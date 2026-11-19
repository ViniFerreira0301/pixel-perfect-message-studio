import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/empresas")({
  head: () => pageHead("Empresas", "Empresas locais e histórico de prospecção."),
  component: () => <Dashboard screen="Empresas" />,
});
