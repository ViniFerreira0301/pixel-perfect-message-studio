import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ExternalLink, RefreshCw, Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { escrever } from "@/lib/escrever.functions";
import { brDay, dateLabel, optOut, statusNames, type Lead } from "@/lib/prospector";
import { Button } from "./button";
import { Field, Modal, Notice } from "./workspace-forms";

export function LeadEditor({
  lead,
  preview,
  remaining,
  close,
  refresh,
}: {
  lead: Lead;
  preview: boolean;
  remaining: number;
  close: () => void;
  refresh: () => void;
}) {
  const { company: c, contact: t } = lead;
  const [message, setMessage] = useState(t.mensagem);
  const [follow, setFollow] = useState(t.follow_up);
  const [notes, setNotes] = useState(t.anotacao);
  const [offer, setOffer] = useState(t.sistema_sugerido);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState("");
  const generate = useServerFn(escrever);
  const first = t.status === "a_mandar";
  const due = t.status === "enviado" && t.follow_up_em && t.follow_up_em <= brDay();
  const sendFirst = () =>
    message.trim().toLocaleLowerCase("pt-BR").endsWith(optOut.toLocaleLowerCase("pt-BR"))
      ? message.trim()
      : [message.trim(), optOut].filter(Boolean).join("\n");
  async function write() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await generate({ data: { id: t.id } });
      if (result.error || !result.mensagem) {
        setError(result.error ?? "Não foi possível gerar o texto.");
        return;
      }
      setMessage(result.mensagem);
      setFollow(result.follow_up);
      setOffer(result.oferta);
      refresh();
    } catch {
      setError("Não foi possível gerar a mensagem agora.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    const result = await supabase
      .from("contatos")
      .update({ mensagem: message, follow_up: follow, anotacao: notes })
      .eq("id", t.id);
    setBusy(false);
    if (result.error) setError("Não foi possível salvar as alterações.");
    else {
      setNotice("Alterações salvas.");
      refresh();
    }
  }
  async function action(kind: string) {
    if (busy || preview) return;
    if (kind === "sair" && !window.confirm("Bloquear novas mensagens para esta empresa?")) return;
    setError("");
    setNotice("");
    const send = kind === "enviar" || kind === "follow_up";
    const text = kind === "enviar" ? sendFirst() : follow.trim();
    if (
      send &&
      (!(kind === "enviar" ? message.trim() : text) ||
        (kind === "enviar" ? text.split(/\r?\n/).length > 4 : text.split(/\r?\n/).length > 1))
    ) {
      setError(
        kind === "enviar"
          ? "Escreva a abordagem em até quatro linhas, incluindo a opção de saída."
          : "Escreva o follow-up em uma única linha.",
      );
      return;
    }
    const tab = send ? window.open("about:blank", "_blank") : null;
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      const result = await supabase.rpc("prospector_action", {
        p_id: t.id,
        p_action: kind,
        p_text: send ? text : "",
      });
      if (result.error) throw new Error(result.error.message);
      if (send) {
        const resultData = result.data;
        const phone =
          resultData && typeof resultData === "object" && !Array.isArray(resultData)
            ? resultData.telefone
            : null;
        if (typeof phone !== "string") throw new Error("Não foi possível recuperar o telefone.");
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
        if (tab && !tab.closed) {
          tab.location.replace(url);
          close();
        } else {
          setHandoff(url);
          setNotice("Abertura registrada. Clique abaixo para continuar no WhatsApp.");
        }
      } else close();
      refresh();
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : "Não foi possível registrar esta ação.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={c.nome} close={close}>
      <Notice text={error} error />
      <Notice text={notice} />
      <p className="subtle mb-3">
        {[c.categoria, c.bairro, c.cidade].filter(Boolean).join(" · ")} · Origem:{" "}
        {c.origem === "planilha" ? "Planilha" : "Cadastro manual"}
      </p>
      {!preview && (
        <p className="subtle mb-3">
          {c.telefone}{" "}
          {c.nota_google !== null
            ? `· Nota ${c.nota_google} (${c.avaliacoes_google ?? 0} avaliações)`
            : ""}{" "}
          {t.follow_up_em ? `· Follow-up em ${dateLabel(t.follow_up_em)}` : ""}
        </p>
      )}
      {(c.site || c.instagram || c.observacao) && (
        <p className="subtle mb-3 break-all">
          {[c.site, c.instagram, c.observacao].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="badge">{statusNames[t.status]}</span>
        {offer && <span className="badge tone-blue">{offer}</span>}
      </div>
      <div className="form-grid">
        <Field label="Primeira mensagem" full>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            readOnly={preview || !!handoff}
            maxLength={1500}
          />
        </Field>
        <Field label="Follow-up" full>
          <textarea
            value={follow}
            onChange={(e) => setFollow(e.target.value)}
            readOnly={preview || !!handoff}
            rows={2}
            maxLength={500}
          />
        </Field>
        {!preview && (
          <Field label="Anotações" full>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </Field>
        )}
      </div>
      {preview ? (
        <Link to="/auth" className="btn btn-default">
          Entrar para usar sua lista
        </Link>
      ) : handoff ? (
        <a className="btn btn-default" href={handoff} target="_blank" rel="noreferrer">
          <ExternalLink />
          Continuar no WhatsApp
        </a>
      ) : (
        <>
          <div className="head-actions">
            {first && (
              <Button disabled={busy} variant="outline" onClick={() => void write()}>
                {message ? <RefreshCw /> : <Sparkles />}
                {message ? "Escrever de novo" : "Escrever com I.A"}
              </Button>
            )}
            <Button disabled={busy} variant="outline" onClick={() => void save()}>
              <Save />
              Salvar revisão
            </Button>
            {((first && remaining > 0) || due) && (
              <Button disabled={busy} onClick={() => void action(first ? "enviar" : "follow_up")}>
                <ExternalLink />
                {first ? "Enviar pelo WhatsApp" : "Abrir follow-up no WhatsApp"}
              </Button>
            )}
          </div>
          {first && remaining === 0 && (
            <p className="subtle mt-2">Limite diário atingido. Novos contatos amanhã.</p>
          )}
          <div className="head-actions mt-4 border-t pt-3">
            {(t.enviado_em
              ? ["respondeu", "reuniao", "fechou", "sem_interesse"]
              : ["sem_interesse"]
            )
              .filter((key) => key !== t.status)
              .map((key) => (
                <Button variant="ghost" key={key} disabled={busy} onClick={() => void action(key)}>
                  {statusNames[key]}
                </Button>
              ))}
            <Button variant="ghost" disabled={busy} onClick={() => void action("sair")}>
              Pediu para sair
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
