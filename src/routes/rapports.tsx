import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports — Revue" },
      { name: "description", content: "Rapports — veille médiatique Revue." },
      { property: "og:title", content: "Rapports — Revue" },
      { property: "og:description", content: "Rapports — veille médiatique Revue." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader kicker="Rapports" title="Rapports" />
      <div className="panel"><EmptyState title="Écran en cours de construction" description="Le modèle de données est prêt ; cet écran arrive à la prochaine étape." /></div>
    </>
  );
}
