import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/veilles")({
  head: () => ({
    meta: [
      { title: "Veilles — Revue" },
      { name: "description", content: "Veilles — veille médiatique Revue." },
      { property: "og:title", content: "Veilles — Revue" },
      { property: "og:description", content: "Veilles — veille médiatique Revue." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader kicker="Veilles" title="Veilles" />
      <div className="panel"><EmptyState title="Écran en cours de construction" description="Le modèle de données est prêt ; cet écran arrive à la prochaine étape." /></div>
    </>
  );
}
