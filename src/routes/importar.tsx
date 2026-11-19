import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/importar")({
  head: () => pageHead("Importar", "Importação de empresas de planilhas CSV e Excel."),
  component: () => <Dashboard screen="Importar" />,
});
