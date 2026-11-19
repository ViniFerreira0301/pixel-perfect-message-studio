import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crosshair,
  Funnel,
  Handshake,
  HelpCircle,
  LayoutGrid,
  ListTodo,
  MessageCircle,
  Send,
  Settings2,
  Sparkles,
  Star,
  Upload,
  UserRound,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { dateLabel, statusNames, type Lead } from "@/lib/prospector";

export const items = [
  { to: "/", title: "Hoje", icon: LayoutGrid },
  { to: "/empresas", title: "Empresas", icon: Building2 },
  { to: "/importar", title: "Importar", icon: Upload },
  { to: "/ofertas", title: "Ofertas", icon: Sparkles },
  { to: "/funil", title: "Funil", icon: Funnel },
  { to: "/configuracoes", title: "Configurações", icon: Settings2 },
  { to: "/ajuda", title: "Ajuda", icon: HelpCircle },
] as const;
export type Screen = (typeof items)[number]["title"];
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Crosshair size={23} />
      </span>
      <span>
        Prospector de I.A<small>Prospecção local</small>
      </span>
    </div>
  );
}
export function Shell({
  screen,
  preview,
  name,
  photo,
  children,
  onLogout,
}: {
  screen: Screen;
  preview?: boolean;
  name?: string;
  photo?: string;
  children: ReactNode;
  onLogout?: () => void;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Menu principal" className="nav-group">
          <span className="nav-caption">Espaço de trabalho</span>
          {items.map(({ title, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${screen === title ? "active" : ""}`}
              aria-current={screen === title ? "page" : undefined}
            >
              <Icon />
              {title}
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <span className="nav-caption">
            <span className="badge tone-mint">● &nbsp; Envio manual</span>
          </span>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="topbar">
          <div className="crumb">
            <span className="hide-small">Visão geral</span>
            <ChevronRight className="hide-small" size={14} />
            <strong>{screen}</strong>
          </div>
          <div className="top-actions">
            {preview ? (
              <>
                <span className="badge tone-blue hide-small">Demonstração</span>
                <Link to="/auth" className="btn btn-outline">
                  <UserRound size={15} /> Entrar
                </Link>
              </>
            ) : (
              <>
                {photo && (
                  <img className="avatar" src={photo} alt="" referrerPolicy="no-referrer" />
                )}
                <span className="subtle hide-small">{name}</span>
                <Button variant="outline" onClick={onLogout}>
                  Sair
                </Button>
              </>
            )}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
export function PageHead({
  title,
  description,
  overline,
  children,
}: {
  title: string;
  description: string;
  overline?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {overline && <span className="eyebrow">{overline}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="head-actions">{children}</div>}
    </div>
  );
}
const metricItems = [
  ["A mandar", ListTodo, "lavender"],
  ["Enviados", Send, "blue"],
  ["Responderam", MessageCircle, "mint"],
  ["Reuniões", CalendarDays, "amber"],
  ["Fechados", Handshake, "rose"],
] as const;
export function Metrics({ counts }: { counts: number[] }) {
  return (
    <div className="metrics">
      {metricItems.map(([label, Icon, tone], i) => (
        <div className="metric" key={label}>
          <div className="metric-top">
            <span className={`metric-icon tone-${tone}`}>
              <Icon size={15} />
            </span>
            {label}
          </div>
          <strong className="metric-value">{counts[i]}</strong>
        </div>
      ))}
    </div>
  );
}
export function Pace({
  opened,
  limit,
  remaining,
}: {
  opened: number;
  limit: number;
  remaining: number;
}) {
  return (
    <div className="pace">
      <div className="pace-title">
        <span className="section-icon tone-lavender">
          <Zap size={16} />
        </span>
        <div>
          <b>Limite diário de primeiros contatos</b>
          <span>
            {remaining
              ? `${remaining} disponíveis hoje · horário de Brasília`
              : "Limite atingido. Novos contatos amanhã."}
          </span>
        </div>
      </div>
      <div>
        <div className="pace-numbers">
          <strong>
            {opened} de {limit}
          </strong>
          <span>registrados hoje</span>
        </div>
        <progress aria-label="Envios registrados hoje" value={opened} max={limit} />
      </div>
    </div>
  );
}
export function ListSection({
  title,
  tone,
  count,
  children,
}: {
  title: string;
  tone: "amber" | "lavender";
  count: number;
  children: ReactNode;
}) {
  const Icon = tone === "amber" ? Clock3 : Send;
  return (
    <section className="list-section">
      <div className="section-heading">
        <span className={`section-icon tone-${tone}`}>
          <Icon size={16} />
        </span>
        <h2>{title}</h2>
        <span className={`badge tone-${tone}`}>{count}</span>
      </div>
      {children}
    </section>
  );
}
export function LeadTable({
  leads,
  mode,
  onOpen,
}: {
  leads: Lead[];
  mode: "follow" | "first" | "all";
  onOpen: (lead: Lead) => void;
}) {
  if (!leads.length)
    return (
      <p className="empty">
        {mode === "follow"
          ? "Nenhum follow-up pendente."
          : mode === "first"
            ? "Nenhuma primeira mensagem na fila."
            : "Nenhuma empresa encontrada."}
      </p>
    );
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th className="hide-small">Localização</th>
            <th className="hide-small">Google</th>
            <th>{mode === "follow" ? "Prazo" : mode === "first" ? "Mensagem" : "Status"}</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => {
            const { company: c, contact: t } = lead;
            return (
              <tr key={t.id}>
                <td>
                  <div className="company-cell">
                    <span
                      className={`company-icon tone-${["lavender", "mint", "blue", "amber", "rose"][i % 5]}`}
                    >
                      <Building2 size={17} />
                    </span>
                    <div>
                      <b>{c.nome}</b>
                      <small>{c.categoria || "Sem categoria"}</small>
                    </div>
                  </div>
                </td>
                <td className="hide-small">
                  {[c.bairro, c.cidade].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="hide-small rating">
                  {c.nota_google !== null ? (
                    <>
                      <Star size={12} />
                      <b>{c.nota_google.toLocaleString("pt-BR")}</b>{" "}
                      <small>({c.avaliacoes_google ?? 0})</small>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {mode === "follow" ? (
                    <span className="badge tone-amber">
                      {t.follow_up_em ? dateLabel(t.follow_up_em) : "Hoje"}
                    </span>
                  ) : mode === "first" ? (
                    <span className={`badge tone-${t.mensagem ? "mint" : "lavender"}`}>
                      {t.mensagem ? "Pronta" : "A escrever"}
                    </span>
                  ) : (
                    <span className="badge">{statusNames[t.status]}</span>
                  )}
                </td>
                <td>
                  <Button variant="outline" onClick={() => onOpen(lead)}>
                    {mode === "all" ? "Abrir" : "Revisar"}
                    <ArrowUpRight className="hide-small" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
