import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/button";
import { Brand } from "@/components/dashboard-parts";
import { Field, Notice } from "@/components/workspace-forms";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Redefinir senha", "Defina uma nova senha para sua conta."),
  component: ResetPage,
});
function ResetPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || recovery) && session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== data.get("confirm")) {
      setError("As senhas não coincidem.");
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Não foi possível trocar a senha. Solicite um novo link se ele expirou.");
      setBusy(false);
      return;
    }
    await navigate({ to: "/", replace: true });
  }
  return (
    <main className="auth-layout">
      <div className="auth-box">
        <Brand />
        <h1>Defina uma nova senha</h1>
        <Notice text={error} error />
        {ready ? (
          <form onSubmit={submit}>
            <Field label="Nova senha">
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirme a nova senha">
              <input
                name="confirm"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" disabled={busy}>
              Salvar nova senha
            </Button>
          </form>
        ) : (
          <>
            <p className="subtle mb-3">
              Abra o link de recuperação enviado por e-mail para continuar.
            </p>
            <Link className="btn btn-outline" to="/auth">
              Voltar para entrar
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
