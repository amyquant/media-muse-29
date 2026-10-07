import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Sources — Revue" },
      { name: "description", content: "Sources — veille médiatique Revue." },
      { property: "og:title", content: "Sources — Revue" },
      { property: "og:description", content: "Sources — veille médiatique Revue." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader kicker="Sources" title="Sources" />
      <div className="panel"><EmptyState title="Écran en cours de construction" description="Le modèle de données est prêt ; cet écran arrive à la prochaine étape." /></div>
    </>
  );
}
