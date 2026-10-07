import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { TypeBadge } from "@/components/app/bits";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { articleQuery } from "@/lib/data";

export const Route = createFileRoute("/articles/$id")({
  head: () => ({
    meta: [
      { title: "Détail de l'article — Revue" },
      { name: "description", content: "Métadonnées complètes d'un texte de presse surveillé." },
      { property: "og:title", content: "Détail de l'article — Revue" },
      { property: "og:description", content: "Métadonnées complètes d'un texte de presse surveillé." },
    ],
  }),
  component: ArticleDetail,
});

function ArticleDetail() {
  const { id } = Route.useParams();
  const q = useQuery(articleQuery(id));
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.isLoading) return <LoadingState rows={3} />;
  const a = q.data;
  if (!a) return <div className="panel"><EmptyState title="Article introuvable" /></div>;
  const meta: [string, React.ReactNode][] = [
    ["Source", a.sources?.name ?? "—"],
    ["Type de source", a.sources?.source_type?.toUpperCase() ?? "—"],
    ["Publication", format(new Date(a.published_at), "EEEE d MMMM yyyy, HH:mm", { locale: fr })],
    ["Ingestion", format(new Date(a.ingested_at), "d MMM yyyy, HH:mm", { locale: fr })],
    ["Auteur", a.author ?? "—"],
    ["Langue", a.language.toUpperCase()],
    ["Type de texte", <TypeBadge key="t" type={a.text_type} />],
    ["Confiance classification", a.type_confidence ? `${Math.round(a.type_confidence * 100)} %` : "—"],
    ["Importance", ["Faible", "Normale", "Élevée"][a.importance - 1] ?? a.importance],
    ["Origine", a.is_demo ? "Donnée de démonstration" : "Ingestion"],
  ];
  return (
    <div className="max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/explorer"><ArrowLeft /> Retour à l'explorateur</Link>
      </Button>
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="panel p-8 lg:col-span-2">
          <p className="kicker mb-3">{a.sources?.name}</p>
          <h1 className="font-display text-3xl font-semibold leading-tight">{a.title}</h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">{a.summary}</p>
          {a.content && <p className="mt-4 leading-relaxed">{a.content}</p>}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {a.article_topics.map((t) => (
              <span key={t.topic_id} className="rounded-full border px-2.5 py-0.5 text-xs">
                {t.topics?.name}
              </span>
            ))}
            {a.keywords.map((k) => (
              <span key={k} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">#{k}</span>
            ))}
          </div>
          {a.url && (
            <Button variant="outline" asChild className="mt-6">
              <a href={a.url} target="_blank" rel="noreferrer">
                Ouvrir le lien {a.is_demo && "(fictif)"} <ExternalLink />
              </a>
            </Button>
          )}
        </article>
        <aside className="panel p-5 h-fit">
          <h2 className="text-sm font-semibold mb-3">Métadonnées</h2>
          <dl className="space-y-3 text-sm">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt className="kicker">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
