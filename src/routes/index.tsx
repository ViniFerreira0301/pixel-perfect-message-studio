import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/")({
  head: () => pageHead("Hoje", "Fila diária de primeiros contatos e follow-ups."),
  component: () => <Dashboard screen="Hoje" />,
});
