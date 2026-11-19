import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Company = Tables<"empresas">;
export type Contact = Tables<"contatos">;
export type Offer = Tables<"ofertas">;
export type Profile = Pick<Tables<"profiles">, "nome" | "foto" | "cargo">;
export type Lead = { company: Company; contact: Contact };
export const defaults = { assinatura: "", cidade: "", limite: "20", tom: "Natural e direto" };
export type Settings = typeof defaults;
export const optOut = "Se não fizer sentido, é só me falar que eu não mando mais.";
export const statusNames: Record<string, string> = {
  a_mandar: "A mandar",
  enviado: "Enviado",
  respondeu: "Respondeu",
  reuniao: "Reunião marcada",
  fechou: "Fechado",
  sem_interesse: "Sem interesse",
};
export const brDay = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(new Date(date));
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (/^00(55)/.test(digits)) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  if (/^55[1-9]\d[2-5]\d{7}$/.test(digits)) return { reason: "Telefone fixo" };
  if (!/^55[1-9]\d9\d{8}$/.test(digits)) return { reason: "Celular inválido ou ausente" };
  return { phone: digits };
}
export function parseRows(
  rows: Record<string, unknown>[],
  existing: string[],
  origem: "manual" | "planilha" = "planilha",
) {
  const valid: TablesInsert<"empresas">[] = [];
  const rejected: Record<string, number> = {};
  const seen = new Set(existing);
  const reject = (reason: string) => {
    rejected[reason] = (rejected[reason] ?? 0) + 1;
  };
  for (const row of rows) {
    const values = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key.trim().toLowerCase(),
        String(value ?? "").trim(),
      ]),
    );
    const get = (...keys: string[]) => keys.map((key) => values[key]).find(Boolean) ?? "";
    const nome = get("nome", "title");
    if (!nome) {
      reject("Nome ausente");
      continue;
    }
    const number = normalizePhone(get("telefone", "phone"));
    if (!number.phone) {
      reject(number.reason ?? "Celular inválido");
      continue;
    }
    if (seen.has(number.phone)) {
      reject("Telefone duplicado");
      continue;
    }
    seen.add(number.phone);
    const score = get("nota_google", "totalscore");
    const reviews = get("avaliacoes_google", "reviewscount");
    const rating = Number(score.replace(",", "."));
    valid.push({
      nome,
      telefone: number.phone,
      categoria: get("categoria", "categoryname"),
      cidade: get("cidade", "city"),
      bairro: get("bairro", "neighborhood"),
      site: get("site", "website"),
      instagram: get("instagram"),
      observacao: get("observacao"),
      nota_google: score && rating >= 0 && rating <= 5 ? rating : null,
      avaliacoes_google: /^\d{1,9}$/.test(reviews) ? Number(reviews) : null,
      origem,
    });
  }
  return { valid, rejected };
}
export function queue(leads: Lead[], limit = 20, today = brDay()) {
  const opened = leads.filter(
    (l) => l.contact.enviado_em && brDay(new Date(l.contact.enviado_em)) === today,
  ).length;
  const active = leads.filter((l) => !l.company.saiu);
  const remaining = Math.max(0, limit - opened);
  const follow = active
    .filter(({ contact: c }) => c.status === "enviado" && c.follow_up_em && c.follow_up_em <= today)
    .sort((a, b) => (a.contact.follow_up_em ?? "").localeCompare(b.contact.follow_up_em ?? ""));
  const first = active
    .filter(({ contact: c }) => c.status === "a_mandar")
    .sort((a, b) => priority(b.company) - priority(a.company));
  return { opened, remaining, follow, first: first.slice(0, remaining) };
}
const priority = (c: Company) => (c.nota_google ?? 0) * Math.log1p(c.avaliacoes_google ?? 0);
export function funnel(leads: Lead[]) {
  const sent = leads.filter((l) => l.contact.enviado_em);
  const replied = sent.filter((l) => l.contact.respondeu_em).length;
  const meetings = sent.filter((l) => l.contact.reuniao_em).length;
  const closed = sent.filter((l) => l.contact.status === "fechou").length;
  const groups = new Map<
    string,
    { categoria: string; oferta: string; enviados: number; respostas: number }
  >();
  for (const { company, contact } of sent) {
    if (!contact.sistema_sugerido) continue;
    const key = JSON.stringify([company.categoria, contact.sistema_sugerido]);
    const group = groups.get(key) ?? {
      categoria: company.categoria || "Sem categoria",
      oferta: contact.sistema_sugerido,
      enviados: 0,
      respostas: 0,
    };
    group.enviados++;
    if (contact.respondeu_em) group.respostas++;
    groups.set(key, group);
  }
  return {
    counts: [
      leads.filter((l) => !l.company.saiu && l.contact.status === "a_mandar").length,
      sent.length,
      replied,
      meetings,
      closed,
    ],
    responseRate: sent.length ? Math.round((replied / sent.length) * 100) : 0,
    meetingRate: sent.length ? Math.round((meetings / sent.length) * 100) : 0,
    groups: [...groups.values()].sort(
      (a, b) => b.respostas / b.enviados - a.respostas / a.enviados,
    ),
  };
}
