import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Revue" },
      { name: "description", content: "Configuration de l'espace de veille médiatique." },
      { property: "og:title", content: "Paramètres — Revue" },
      { property: "og:description", content: "Configuration de l'espace de veille médiatique." },
    ],
  }),
  component: Settings,
});

const ITEMS = [
  { title: "Ingestion des sources", status: "Non connectée", desc: "Récupération automatique des flux RSS, API et pages web. Les sources peuvent déjà être enregistrées." },
  { title: "Classification des types de texte", status: "Règles", desc: "Classement par règles sur les titres (Opinion, Éditorial, Entrevue…). Prêt pour un classement par IA." },
  { title: "Détection des sujets", status: "Mots-clés", desc: "Regroupement par mots-clés et thématiques. Évolutif vers une analyse sémantique." },
  { title: "Alertes et notifications", status: "À venir", desc: "Envoi d'alertes courriel lorsqu'une veille dépasse un seuil." },
  { title: "Rapports automatisés", status: "À venir", desc: "Génération et envoi planifiés des rapports." },
  { title: "Comptes et accès", status: "Démonstration", desc: "Espace partagé sans connexion. Les comptes utilisateurs pourront être ajoutés." },
];

function Settings() {
  return (
    <>
      <PageHeader kicker="Paramètres" title="Paramètres de l'espace" description="État des modules de traitement et des fonctionnalités à venir." />
      <div className="panel divide-y">
        {ITEMS.map((i) => (
          <div key={i.title} className="flex items-start justify-between gap-6 px-5 py-4">
            <div><p className="font-medium">{i.title}</p><p className="text-sm text-muted-foreground mt-0.5">{i.desc}</p></div>
            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{i.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}
