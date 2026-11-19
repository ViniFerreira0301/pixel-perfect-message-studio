import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/ofertas")({
  head: () =>
    pageHead("Ofertas", "Soluções de inteligência artificial oferecidas a negócios locais."),
  component: () => <Dashboard screen="Ofertas" />,
});
