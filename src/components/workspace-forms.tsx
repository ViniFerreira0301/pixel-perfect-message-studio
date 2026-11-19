import { useState, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FileSpreadsheet, Plus, Trash2, Upload, X } from "lucide-react";
import { Button } from "./button";
import { supabase } from "@/integrations/supabase/client";
import { parseRows, type Lead, type Offer, type Profile, type Settings } from "@/lib/prospector";

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      {label}
      {children}
    </label>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content aria-describedby={undefined} className="modal">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" className="modal-close" aria-label="Fechar">
              <X />
            </Button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  return text ? (
    <div className={`banner ${error ? "error" : ""}`} role={error ? "alert" : "status"}>
      {text}
    </div>
  ) : null;
}
export function ManualForm({
  leads,
  city,
  done,
}: {
  leads: Lead[];
  city: string;
  done: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const { valid, rejected } = parseRows(
      [values],
      leads.map((l) => l.company.telefone),
      "manual",
    );
    if (!valid.length) {
      setError(Object.keys(rejected).join(", "));
      return;
    }
    setBusy(true);
    try {
      const result = await supabase.from("empresas").insert(valid);
      if (result.error) throw result.error;
      done();
    } catch {
      setError("Não foi possível cadastrar. Confira se o telefone já está na lista.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <Notice text={error} error />
      <div className="form-grid">
        {(
          [
            ["Nome da empresa", "nome"],
            ["Telefone comercial", "telefone"],
            ["Categoria", "categoria"],
            ["Cidade", "cidade"],
            ["Bairro", "bairro"],
            ["Site", "site"],
            ["Instagram", "instagram"],
            ["Nota no Google", "nota_google"],
            ["Avaliações no Google", "avaliacoes_google"],
          ] as const
        ).map(([label, name]) => (
          <Field key={name} label={label}>
            <input
              name={name}
              required={name === "nome" || name === "telefone"}
              defaultValue={name === "cidade" ? city : undefined}
              inputMode={name === "telefone" ? "tel" : undefined}
            />
          </Field>
        ))}
        <Field label="Observação pública" full>
          <textarea name="observacao" />
        </Field>
      </div>
      <Button type="submit" disabled={busy}>
        <Plus />
        Cadastrar empresa
      </Button>
    </form>
  );
}
export function ImportForm({ leads, done, canSave }: { leads: Lead[]; done: () => void; canSave: boolean }) {
  const [preview, setPreview] = useState<ReturnType<typeof parseRows> | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function read(file?: File) {
    setError("");
    setNotice("");
    setPreview(null);
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Escolha um arquivo de até 10 MB.");
      let records: Record<string, unknown>[];
      if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import("read-excel-file/browser");
        const [headers, ...rows] = await readSheet(file);
        records = headers
          ? rows.map((row) =>
              Object.fromEntries(headers.map((header, i) => [String(header ?? ""), row[i]])),
            )
          : [];
      } else if (/\.csv$/i.test(file.name)) {
        const { default: Papa } = await import("papaparse");
        const parsed = Papa.parse<Record<string, unknown>>(await file.text(), {
          header: true,
          skipEmptyLines: "greedy",
        });
        if (parsed.errors.some((e) => e.type === "Quotes"))
          throw new Error("O CSV tem campos com aspas incompletas.");
        records = parsed.data;
      } else throw new Error("Selecione um arquivo CSV ou XLSX.");
      if (!records.length) throw new Error("A planilha não tem empresas.");
      setPreview(
        parseRows(
          records,
          leads.map((l) => l.company.telefone),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler a planilha.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!canSave || !preview?.valid.length) return;
    setBusy(true);
    setError("");
    let imported = 0;
    try {
      for (let i = 0; i < preview.valid.length; i += 250) {
        const { count, error } = await supabase
          .from("empresas")
          .upsert(preview.valid.slice(i, i + 250), {
            onConflict: "user_id,telefone",
            ignoreDuplicates: true,
            count: "exact",
          });
        if (error) throw error;
        imported += count ?? 0;
      }
      setNotice(
        `${imported} empresa(s) importada(s).${imported < preview.valid.length ? " Telefones já cadastrados foram ignorados." : ""}`,
      );
      setPreview(null);
      done();
    } catch {
      setError(
        `${imported} empresa(s) importada(s) antes da falha. Você pode tentar novamente sem duplicar registros.`,
      );
      done();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Notice text={error} error />
      <Notice text={notice} />
      <label className="drop">
        <span className="company-icon tone-lavender">
          <FileSpreadsheet size={18} />
        </span>
        <strong>Selecione ou solte sua planilha</strong>
        <span className="subtle">CSV ou Excel (.xlsx)</span>
        <input
          aria-label="Arquivo de empresas"
          type="file"
          accept=".csv,.xlsx"
          disabled={busy}
          onChange={(e) => {
            void read(e.target.files?.[0]);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {preview && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Prévia · {preview.valid.length} válida(s)</h2>
          <p className="subtle mb-3">
            {Object.values(preview.rejected).reduce((a, b) => a + b, 0)} descartada(s)
            {Object.keys(preview.rejected).length > 0
              ? `: ${Object.entries(preview.rejected)
                  .map(([reason, count]) => `${reason} (${count})`)
                  .join(" · ")}`
              : "."}
          </p>
          {preview.valid.length > 0 && (
            <>
              <div className="table-wrap mb-3">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Categoria</th>
                      <th>Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.valid.slice(0, 10).map((row) => (
                      <tr key={row.telefone}>
                        <td>{row.nome}</td>
                        <td>{row.categoria || "—"}</td>
                        <td>{row.telefone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.valid.length > 10 && <p className="subtle mb-3">Mostrando as primeiras 10 de {preview.valid.length} empresas válidas.</p>}
              {canSave && (
                <Button disabled={busy} onClick={() => void save()}>
                  <Upload />
                  Importar {preview.valid.length} empresa(s)
                </Button>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
export function OfferForm({ offer, done }: { offer?: Offer | undefined; done: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values = {
      nome: String(data.get("nome") ?? "").trim(),
      para_quem: String(data.get("para_quem") ?? "").trim(),
      dor: String(data.get("dor") ?? "").trim(),
      resultado: String(data.get("resultado") ?? "").trim(),
    };
    if (Object.values(values).some((v) => !v)) {
      setError("Preencha todos os campos.");
      return;
    }
    setBusy(true);
    const result = offer
      ? await supabase.from("ofertas").update(values).eq("id", offer.id)
      : await supabase.from("ofertas").insert(values);
    setBusy(false);
    if (result.error) setError("Não foi possível salvar a oferta.");
    else done();
  }
  async function remove() {
    if (!offer || !window.confirm("Excluir esta oferta?")) return;
    setBusy(true);
    const result = await supabase.from("ofertas").delete().eq("id", offer.id);
    setBusy(false);
    if (result.error) setError("Não foi possível excluir a oferta.");
    else done();
  }
  return (
    <form onSubmit={submit}>
      <Notice text={error} error />
      <div className="form-grid">
        <Field label="Nome da oferta">
          <input
            name="nome"
            defaultValue={offer?.nome}
            placeholder="Atendente de I.A no WhatsApp"
            required
            maxLength={120}
          />
        </Field>
        <Field label="Categorias atendidas">
          <input name="para_quem" defaultValue={offer?.para_quem} required maxLength={240} />
        </Field>
        <Field label="Dor que resolve" full>
          <textarea name="dor" defaultValue={offer?.dor} required maxLength={600} />
        </Field>
        <Field label="Resultado esperado, sem prometer números" full>
          <textarea name="resultado" defaultValue={offer?.resultado} required maxLength={600} />
        </Field>
      </div>
      <div className="head-actions">
        <Button disabled={busy} type="submit">
          Salvar oferta
        </Button>
        {offer && (
          <Button disabled={busy} variant="outline" onClick={() => void remove()}>
            <Trash2 />
            Excluir oferta
          </Button>
        )}
      </div>
    </form>
  );
}
export function SettingsForm({
  settings,
  profile,
  userId,
  done,
}: {
  settings: Settings;
  profile: Profile;
  userId?: string;
  done: () => void;
}) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    setError("");
    setNotice("");
    const data = new FormData(e.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();
    const foto = get("foto");
    if (foto && !/^https:\/\//i.test(foto)) {
      setError("Use um endereço de foto que começa com https://.");
      return;
    }
    setBusy(true);
    const config = await supabase
      .from("configuracoes")
      .upsert(
        Object.keys(settings).map((chave) => ({ user_id: userId, chave, valor: get(chave) })),
      );
    if (config.error) {
      setBusy(false);
      setError("Não foi possível salvar as configurações.");
      return;
    }
    const update = await supabase
      .from("profiles")
      .update({ nome: get("nome"), cargo: get("cargo"), foto })
      .eq("id", userId);
    setBusy(false);
    done();
    if (update.error) setError("As preferências foram salvas, mas o perfil não foi atualizado.");
    else setNotice("Configurações salvas.");
  }
  return (
    <form onSubmit={submit}>
      <Notice text={error} error />
      <Notice text={notice} />
      <fieldset disabled={!userId}>
      <section className="mb-5">
        <h2 className="mb-3 text-lg font-bold">Prospecção</h2>
        <div className="form-grid">
          <Field label="Assinatura">
            <input name="assinatura" defaultValue={settings.assinatura} maxLength={120} />
          </Field>
          <Field label="Cidade">
            <input name="cidade" defaultValue={settings.cidade} maxLength={120} />
          </Field>
          <Field label="Limite diário de primeiras mensagens">
            <input
              name="limite"
              type="number"
              min={1}
              max={999}
              required
              defaultValue={settings.limite}
            />
          </Field>
          <Field label="Tom da mensagem">
            <input name="tom" defaultValue={settings.tom} maxLength={120} />
          </Field>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Perfil</h2>
        <div className="form-grid">
          <Field label="Nome de exibição">
            <input name="nome" defaultValue={profile.nome} maxLength={90} />
          </Field>
          <Field label="Cargo">
            <input name="cargo" defaultValue={profile.cargo} maxLength={90} />
          </Field>
          <Field label="Endereço da foto" full>
            <input name="foto" type="url" defaultValue={profile.foto} maxLength={500} />
          </Field>
        </div>
      </section>
      {userId && <Button type="submit" disabled={busy}>Salvar configurações</Button>}
      </fieldset>
    </form>
  );
}
