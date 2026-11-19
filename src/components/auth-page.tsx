import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "./dashboard-parts";
import { Button } from "./button";
import { Field, Notice } from "./workspace-forms";

function GoogleMark() {
  return (
    <svg width="18" height="18" aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.12 2.73-2.39 3.58v3h3.86c2.26-2.09 3.55-5.17 3.55-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96h-4v3.09C3.25 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.54.38-2.29V6.62h-4C.47 8.24 0 10.06 0 12s.47 3.76 1.27 5.38l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.3 0 3.25 2.7 1.27 6.62l4 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}
export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const switchMode = (next: typeof mode) => {
    setMode(next);
    setError("");
    setNotice("");
  };
  async function social(provider: "google" | "lovable") {
    setBusy(true);
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) setError("Não foi possível entrar com este provedor.");
      else if (!result.redirected) await navigate({ to: "/", replace: true });
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const fields = new FormData(e.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (result.error) throw result.error;
        setNotice("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
        return;
      }
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            })
          : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (result.data.session) await navigate({ to: "/", replace: true });
      else setNotice("Confira seu e-mail e confirme o cadastro antes de entrar.");
    } catch (e) {
      const code = e && typeof e === "object" && "code" in e ? e.code : "";
      setError(
        code === "email_not_confirmed"
          ? "Confirme seu e-mail antes de entrar."
          : code === "invalid_credentials"
            ? "E-mail ou senha incorretos."
            : "Não foi possível concluir. Confira os dados e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <div className="auth-box">
        <Link to="/" aria-label="Página inicial">
          <Brand />
        </Link>
        <h1>
          {mode === "signup"
            ? "Crie sua conta"
            : mode === "forgot"
              ? "Redefinir senha"
              : "Entre na sua conta"}
        </h1>
        <p className="subtle">Prospector de I.A</p>
        <form onSubmit={submit}>
          <Notice text={error} error />
          <Notice text={notice} />
          <Field label="E-mail">
            <input name="email" type="email" autoComplete="email" required />
          </Field>
          {mode !== "forgot" && (
            <Field label="Senha">
              <input
                name="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                minLength={6}
                required
              />
            </Field>
          )}
          <Button disabled={busy} type="submit">
            {mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar link" : "Entrar"}
          </Button>
        </form>
        {mode !== "forgot" && (
          <div className="auth-actions">
            <Button
              disabled={busy}
              className="auth-google"
              variant="outline"
              onClick={() => void social("google")}
            >
              <GoogleMark />
              Continuar com Google
            </Button>
            <Button disabled={busy} variant="outline" onClick={() => void social("lovable")}>
              <LovableMark />
              Continuar com Lovable
            </Button>
          </div>
        )}
        <div className="head-actions mt-3">
          {mode === "login" ? (
            <>
              <Button variant="ghost" onClick={() => switchMode("signup")}>
                Criar conta
              </Button>
              <Button variant="ghost" onClick={() => switchMode("forgot")}>
                Esqueci minha senha
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => switchMode("login")}>
              Voltar para entrar
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
