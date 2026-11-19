import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BarChart3, Plus, ShieldCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { demo } from "@/lib/demo";
import {
  brDay,
  defaults,
  funnel,
  queue,
  statusNames,
  type Lead,
  type Offer,
} from "@/lib/prospector";
import { workspaceQuery, type WorkspaceData } from "@/lib/workspace";
import { Button } from "./button";
import {
  LeadTable,
  ListSection,
  Metrics,
  Pace,
  PageHead,
  Shell,
  type Screen,
} from "./dashboard-parts";
import { LeadEditor } from "./lead-editor";
import { ImportForm, ManualForm, Modal, Notice, OfferForm, SettingsForm } from "./workspace-forms";

const descriptions = {
  Hoje: "Revise seus follow-ups e suas próximas primeiras mensagens.",
  Empresas: "Consulte suas empresas e acompanhe a situação de cada contato.",
  Importar: "Adicione empresas a partir de uma planilha do Google Maps ou da sua própria lista.",
  Ofertas: "Organize os sistemas de I.A que você oferece.",
  Funil: "Acompanhe o avanço dos contatos e o desempenho das ofertas.",
  Configurações: "Ajuste sua rotina de prospecção e os dados do seu perfil.",
  Ajuda: "Boas práticas para conversar com negócios locais.",
} satisfies Record<Screen, string>;
const stamp = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

export function Dashboard({ screen }: { screen: Screen }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    let mounted = true;
    const verify = () => {
      void supabase.auth.getUser().then(({ data }) => {
        if (mounted) setUser(data.user);
      });
    };
    verify();
    const unsubscribe = router.subscribe("onResolved", verify);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);
  const query = useQuery({ ...workspaceQuery(user?.id ?? ""), enabled: !!user });
  async function logout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setUser(null);
    await navigate({ to: "/auth", replace: true });
  }
  return (
    <Shell
      screen={screen}
      preview={!user}
      name={query.data?.profile.nome || user?.email}
      photo={query.data?.profile.foto}
      onLogout={() => void logout()}
    >
      {user && query.isPending ? (
        <p className="empty">Carregando seu espaço de trabalho…</p>
      ) : user && query.isError ? (
        <>
          <Notice text="Não foi possível carregar seu espaço de trabalho." error />
          <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        </>
      ) : (
        <Workspace
          key={user?.id ?? "demo"}
          screen={screen}
          userId={user?.id}
          data={user ? query.data : undefined}
          refresh={() => {
            if (user) void queryClient.invalidateQueries({ queryKey: ["workspace", user.id] });
          }}
        />
      )}
    </Shell>
  );
}
function Workspace({
  screen,
  userId,
  data,
  refresh,
}: {
  screen: Screen;
  userId?: string | undefined;
  data?: WorkspaceData | undefined;
  refresh: () => void;
}) {
  const [editor, setEditor] = useState<Lead | null>(null);
  const [modal, setModal] = useState<"manual" | "offer" | null>(null);
  const [offer, setOffer] = useState<Offer>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [status, setStatus] = useState("");
  const [day, setDay] = useState(() => brDay());
  useEffect(() => {
    const clock = window.setInterval(() => setDay(brDay()), 15000);
    return () => window.clearInterval(clock);
  }, []);
  const preview = !userId;
  const leads = data?.leads ?? (preview ? demo : []);
  const settings = data?.settings ?? defaults;
  const offers = data?.offers ?? [];
  const today = queue(leads, Number(settings.limite), day);
  const stats = funnel(leads);
  const active = leads.filter((l) => !l.company.saiu);
  const unique = (key: "categoria" | "bairro") =>
    [...new Set(active.map((l) => l.company[key]).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  const filtered = active.filter(
    ({ company: c, contact: t }) =>
      (!search || c.nome.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) &&
      (!category || category === c.categoria) &&
      (!neighborhood || neighborhood === c.bairro) &&
      (!status || status === t.status),
  );
  const done = () => {
    setModal(null);
    refresh();
  };
  const requiresLogin = (
    <div className="empty">
      <p className="mb-3">Entre para trabalhar com sua própria lista.</p>
      <Link to="/auth" className="btn btn-default">
        Entrar
      </Link>
    </div>
  );
  return (
    <>
      <PageHead
        title={screen}
        description={descriptions[screen]}
        overline={screen === "Hoje" ? stamp.format(new Date(`${day}T12:00:00Z`)) : undefined}
      >
        {screen === "Hoje" && (
          <>
            <Link className="btn btn-outline" to="/importar">
              <Upload size={16} />
              Importar planilha
            </Link>
            {preview ? (
              <Link to="/auth" className="btn btn-default">
                <Plus size={16} />
                Nova empresa
              </Link>
            ) : (
              <Button onClick={() => setModal("manual")}>
                <Plus />
                Nova empresa
              </Button>
            )}
          </>
        )}
        {screen === "Empresas" && !preview && (
          <Button onClick={() => setModal("manual")}>
            <Plus />
            Nova empresa
          </Button>
        )}
        {screen === "Ofertas" && !preview && (
          <Button
            onClick={() => {
              setOffer(undefined);
              setModal("offer");
            }}
          >
            <Plus />
            Nova oferta
          </Button>
        )}
      </PageHead>
      {screen === "Hoje" && (
        <>
          <Metrics counts={stats.counts} />
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="subtle">
              Taxa de resposta <b className="text-foreground">{stats.responseRate}%</b>
            </span>
            <span className="subtle">
              Taxa de reunião <b className="text-foreground">{stats.meetingRate}%</b>
            </span>
            <Link to="/funil" className="text-primary">
              Desempenho por oferta →
            </Link>
          </div>
          <Pace opened={today.opened} limit={Number(settings.limite)} remaining={today.remaining} />
          <ListSection title="Follow-ups pendentes" tone="amber" count={today.follow.length}>
            <LeadTable leads={today.follow} mode="follow" onOpen={setEditor} />
          </ListSection>
          <ListSection title="Primeiras mensagens" tone="lavender" count={today.first.length}>
            <LeadTable leads={today.first} mode="first" onOpen={setEditor} />
          </ListSection>
        </>
      )}
      {screen === "Empresas" && (
        <>
          <div className="filters">
            <input
              aria-label="Buscar empresa"
              placeholder="Buscar empresa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {unique("categoria").map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Bairro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            >
              <option value="">Todos os bairros</option>
              {unique("bairro").map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(statusNames).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <LeadTable leads={filtered} mode="all" onOpen={setEditor} />
        </>
      )}
      {screen === "Importar" &&
        (preview ? requiresLogin : <ImportForm leads={leads} done={refresh} />)}
      {screen === "Ofertas" &&
        (preview ? (
          requiresLogin
        ) : offers.length ? (
          <div className="offer-grid">
            {offers.map((o) => (
              <article key={o.id} className="panel">
                <span className="badge tone-lavender">{o.para_quem}</span>
                <h2>{o.nome}</h2>
                <p className="subtle">{o.dor}</p>
                <p>{o.resultado}</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setOffer(o);
                    setModal("offer");
                  }}
                >
                  Editar oferta
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">Nenhuma oferta cadastrada.</p>
        ))}
      {screen === "Funil" && (
        <>
          <Metrics counts={stats.counts} />
          <div className="offer-grid mt-4">
            <div className="panel">
              <p className="subtle">Taxa de resposta</p>
              <strong className="metric-value">{stats.responseRate}%</strong>
            </div>
            <div className="panel">
              <p className="subtle">Taxa de reunião</p>
              <strong className="metric-value">{stats.meetingRate}%</strong>
            </div>
          </div>
          <div className="section-heading">
            <span className="section-icon tone-mint">
              <BarChart3 size={16} />
            </span>
            <h2>Resposta por categoria e oferta</h2>
          </div>
          {stats.groups.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Oferta</th>
                    <th>Respostas / envios</th>
                    <th>Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.groups.map((g) => (
                    <tr key={JSON.stringify([g.categoria, g.oferta])}>
                      <td>{g.categoria}</td>
                      <td>{g.oferta}</td>
                      <td>
                        {g.respostas} / {g.enviados}
                      </td>
                      <td>
                        <span className="badge tone-mint">
                          {Math.round((g.respostas / g.enviados) * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty">
              O desempenho aparece depois dos primeiros contatos com uma oferta sugerida.
            </p>
          )}
        </>
      )}
      {screen === "Configurações" &&
        (userId && data ? (
          <SettingsForm userId={userId} settings={settings} profile={data.profile} done={refresh} />
        ) : (
          requiresLogin
        ))}
      {screen === "Ajuda" && (
        <>
          <section className="panel">
            <div className="section-heading">
              <span className="section-icon tone-mint">
                <ShieldCheck size={17} />
              </span>
              <h2>Por que o envio é semiautomático?</h2>
            </div>
            <p>
              Mensagens em massa para quem nunca falou com você podem gerar denúncias e bloqueio do
              número. Priorize poucas conversas relevantes, com texto personalizado e revisão
              individual. O limite diário não garante que o WhatsApp permita uma abordagem não
              solicitada.
            </p>
            <p>
              O Prospector prepara a mensagem. Ao abrir o WhatsApp, você confere o texto e decide se
              envia. A abertura entra na fila como enviada, mas o Prospector não confirma entrega
              nem lê respostas automaticamente.
            </p>
          </section>
          <section className="panel">
            <h2>Respeite a escolha de quem recebe</h2>
            <p>
              Use apenas contatos comerciais públicos e registre a origem da lista. Avalie a base
              legal aplicável, a expectativa de quem recebe e as regras do WhatsApp. Quando houver
              exigência de consentimento, obtenha-o antes de abordar.
            </p>
            <p>
              Inclua a opção de não receber mais mensagens. Se alguém pedir para sair, registre o
              pedido imediatamente. Não insista depois de uma recusa.
            </p>
          </section>
          <section className="panel">
            <h2>Follow-up</h2>
            <p>
              O lembrete aparece três dias depois da primeira abordagem, se nenhuma resposta tiver
              sido registrada. Atualize o status ao receber uma resposta para retirar o contato da
              fila.
            </p>
          </section>
        </>
      )}
      {editor && (
        <LeadEditor
          key={editor.contact.id}
          lead={editor}
          preview={preview}
          remaining={today.remaining}
          close={() => setEditor(null)}
          refresh={refresh}
        />
      )}
      {modal === "manual" && (
        <Modal title="Nova empresa" close={() => setModal(null)}>
          <ManualForm leads={leads} city={settings.cidade} done={done} />
        </Modal>
      )}
      {modal === "offer" && (
        <Modal title={offer ? "Editar oferta" : "Nova oferta"} close={() => setModal(null)}>
          <OfferForm offer={offer} done={done} />
        </Modal>
      )}
    </>
  );
}
