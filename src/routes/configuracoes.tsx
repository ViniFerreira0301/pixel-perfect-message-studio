import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/configuracoes")({
  head: () => pageHead("Configurações", "Perfil e preferências de prospecção."),
  component: () => <Dashboard screen="Configurações" />,
});
