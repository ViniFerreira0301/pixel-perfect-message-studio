create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, nome text not null default '', foto text not null default '', cargo text not null default '', created_at timestamptz not null default now());
grant select,update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy private_profile on public.profiles for all to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create function public.create_prospector_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end; $$;
revoke all on function public.create_prospector_profile() from public,anon,authenticated;
create trigger prospector_profile_created after insert on auth.users for each row execute procedure public.create_prospector_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create table public.empresas (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), nome text not null check(length(trim(nome))>0), categoria text not null default '', cidade text not null default '', bairro text not null default '', telefone text not null check(telefone ~ '^55[1-9][0-9]9[0-9]{8}$'), site text not null default '', instagram text not null default '', nota_google numeric check(nota_google between 0 and 5), avaliacoes_google integer check(avaliacoes_google>=0), observacao text not null default '', origem text not null default 'manual' check(origem in ('manual','planilha')), saiu boolean not null default false, created_at timestamptz not null default now(), unique(user_id,telefone), unique(user_id,id));
grant select,insert on public.empresas to authenticated;
grant all on public.empresas to service_role;
alter table public.empresas enable row level security;
create policy private_empresas on public.empresas for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create table public.ofertas (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), nome text not null, para_quem text not null, dor text not null, resultado text not null, created_at timestamptz not null default now());
grant select,insert,update,delete on public.ofertas to authenticated;
grant all on public.ofertas to service_role;
alter table public.ofertas enable row level security;
create policy private_ofertas on public.ofertas for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create table public.contatos (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), empresa_id uuid not null unique, status text not null default 'a_mandar' check(status in ('a_mandar','enviado','respondeu','reuniao','fechou','sem_interesse')), sistema_sugerido text not null default '', mensagem text not null default '', follow_up text not null default '', enviado_em timestamptz, follow_up_em date, respondeu_em timestamptz, reuniao_em timestamptz, anotacao text not null default '', created_at timestamptz not null default now(), foreign key(user_id,empresa_id) references public.empresas(user_id,id) on delete cascade);
grant select,update(mensagem,follow_up,anotacao) on public.contatos to authenticated;
grant all on public.contatos to service_role;
alter table public.contatos enable row level security;
create policy private_contatos on public.contatos for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create function public.create_prospector_contact() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.contatos(user_id,empresa_id) values(new.user_id,new.id); return new; end; $$;
revoke all on function public.create_prospector_contact() from public,anon,authenticated;
create trigger empresa_cria_contato after insert on public.empresas for each row execute procedure public.create_prospector_contact();
create table public.configuracoes (user_id uuid not null default auth.uid(), chave text not null check(chave in ('assinatura','cidade','limite','tom')), valor text not null, created_at timestamptz not null default now(), primary key(user_id,chave), check(chave <> 'limite' or (case when valor ~ '^[0-9]{1,3}$' then valor::integer>=1 else false end)));
grant select,insert,update on public.configuracoes to authenticated;
grant all on public.configuracoes to service_role;
alter table public.configuracoes enable row level security;
create policy private_config on public.configuracoes for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create table public.logs (id uuid primary key default gen_random_uuid(), user_id uuid not null, tipo text not null, detalhe jsonb not null default '{}', criado_em timestamptz not null default now(), created_at timestamptz not null default now());
grant select on public.logs to authenticated;
grant all on public.logs to service_role;
alter table public.logs enable row level security;
create policy private_logs on public.logs for select to authenticated using(user_id=(select auth.uid()));
create index logs_owner_event on public.logs(user_id,tipo,criado_em);
create function public.prospector_action(p_id uuid,p_action text,p_text text default '', p_follow text default '', p_offer text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); c public.contatos; e public.empresas; day_br date := (now() at time zone 'America/Sao_Paulo')::date; max_daily integer; begin
if uid is null then raise exception 'Entre para continuar.'; end if;
perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
select * into c from public.contatos where id=p_id and user_id=uid;
if not found then raise exception 'Contato não encontrado.'; end if;
select * into e from public.empresas where id=c.empresa_id and user_id=uid;
if e.saiu then raise exception 'Esta empresa pediu para não receber mensagens.'; end if;
if p_action='sair' then update public.empresas set saiu=true where id=e.id;
elsif p_action='gerar' then
 if c.status <> 'a_mandar' then raise exception 'Este contato já saiu da fila inicial.'; end if;
 update public.contatos set mensagem=p_text,follow_up=p_follow,sistema_sugerido=p_offer where id=c.id;
 insert into public.logs(user_id,tipo,detalhe) values(uid,'geracao',jsonb_build_object('contato',c.id,'mensagem',p_text,'follow_up',p_follow,'oferta',p_offer));
elsif p_action in ('enviar','follow_up') then
 if length(trim(p_text))=0 or length(p_text)>3000 then raise exception 'Revise o texto antes de abrir o WhatsApp.'; end if;
 if p_action='enviar' then
  if c.status<>'a_mandar' or c.enviado_em is not null then raise exception 'Primeira mensagem já registrada.'; end if;
  if lower(p_text) not like '%é só me falar que eu não mando mais%' then raise exception 'Inclua a opção de não receber mais mensagens.'; end if;
  select valor::int into max_daily from public.configuracoes where user_id=uid and chave='limite';
  if (select count(*) from public.logs where user_id=uid and tipo='enviar' and criado_em >= day_br::timestamp at time zone 'America/Sao_Paulo') >= coalesce(max_daily,20) then raise exception 'Limite diário atingido. Volte amanhã.'; end if;
  update public.contatos set mensagem=p_text,status='enviado',enviado_em=now(),follow_up_em=day_br+3 where id=c.id;
 else
  if c.status<>'enviado' or c.follow_up_em is null or c.follow_up_em>day_br then raise exception 'Follow-up indisponível.'; end if;
  update public.contatos set follow_up=p_text,follow_up_em=null where id=c.id;
 end if;
 insert into public.logs(user_id,tipo,detalhe) values(uid,p_action,jsonb_build_object('contato',c.id,'mensagem',p_text));
elsif p_action in ('respondeu','reuniao','fechou','sem_interesse') then
 update public.contatos set status=p_action, follow_up_em=null, respondeu_em=case when p_action<>'sem_interesse' then coalesce(respondeu_em,now()) else respondeu_em end, reuniao_em=case when p_action in ('reuniao','fechou') then coalesce(reuniao_em,now()) else reuniao_em end where id=c.id;
else raise exception 'Ação inválida.'; end if;
return jsonb_build_object('telefone',e.telefone);
end; $$;
revoke all on function public.prospector_action(uuid,text,text,text,text) from public,anon;
grant execute on function public.prospector_action(uuid,text,text,text,text) to authenticated;