import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Revue" },
      { name: "description", content: "Paramètres — veille médiatique Revue." },
      { property: "og:title", content: "Paramètres — Revue" },
      { property: "og:description", content: "Paramètres — veille médiatique Revue." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader kicker="Paramètres" title="Paramètres" />
      <div className="panel"><EmptyState title="Écran en cours de construction" description="Le modèle de données est prêt ; cet écran arrive à la prochaine étape." /></div>
    </>
  );
}
