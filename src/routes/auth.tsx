import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth-page";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/auth")({
  head: () => pageHead("Entrar", "Acesse sua conta no Prospector de I.A."),
  component: AuthPage,
});
