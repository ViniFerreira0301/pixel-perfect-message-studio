import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/funil")({
  head: () => pageHead("Funil", "Contatos, respostas, reuniões e resultados das ofertas."),
  component: () => <Dashboard screen="Funil" />,
});
