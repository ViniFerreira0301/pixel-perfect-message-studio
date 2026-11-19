import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/lib/heads";

export const Route = createFileRoute("/ajuda")({
  head: () => pageHead("Ajuda", "Boas práticas para envio semiautomático pelo WhatsApp."),
  component: () => <Dashboard screen="Ajuda" />,
});
