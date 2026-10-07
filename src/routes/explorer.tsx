import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { ArticleRow } from "@/components/app/bits";
import { FilterBar } from "@/components/app/filter-bar";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilteredArticles } from "@/hooks/use-articles";
import { sourceName } from "@/lib/analytics";
import { articlesToCsv, downloadFile } from "@/lib/export";
import { normalizeText } from "@/lib/pipeline/processing";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Explorateur de presse — Revue" },
      { name: "description", content: "Recherchez, filtrez et triez tous les textes de presse surveillés." },
      { property: "og:title", content: "Explorateur de presse — Revue" },
      { property: "og:description", content: "Recherchez, filtrez et triez tous les textes de presse surveillés." },
    ],
  }),
  component: Explorer,
});

type Sort = "date" | "relevance" | "source";
const PAGE = 25;

function Explorer() {
  const { current, sources, topics, isLoading, error, refetch, filters } = useFilteredArticles();
  const [sort, setSort] = useState<Sort>("date");
  const [limit, setLimit] = useState(PAGE);

  const sorted = useMemo(() => {
    const list = [...current];
    if (sort === "date") list.sort((a, b) => b.published_at.localeCompare(a.published_at));
    if (sort === "source") list.sort((a, b) => sourceName(sources, a.source_id).localeCompare(sourceName(sources, b.source_id)) || b.published_at.localeCompare(a.published_at));
    if (sort === "relevance") {
      const words = normalizeText(filters.keyword).split(/\s+/).filter(Boolean);
      const score = (t: string, s: string | null, imp: number) => {
        const nt = normalizeText(t);
        const ns = normalizeText(s ?? "");
        return words.reduce((acc, w) => acc + (nt.includes(w) ? 3 : 0) + (ns.includes(w) ? 1 : 0), 0) + imp;
      };
      list.sort((a, b) => score(b.title, b.summary, b.importance) - score(a.title, a.summary, a.importance) || b.published_at.localeCompare(a.published_at));
    }
    return list;
  }, [current, sort, sources, filters.keyword]);

  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? "";

  return (
    <>
      <PageHeader
        kicker="Explorateur"
        title="Tous les textes"
        description="Recherche plein texte sur les titres, résumés et mots-clés."
        actions={
          <Button
            variant="outline"
            disabled={!sorted.length}
            onClick={() => downloadFile(`revue-articles-${new Date().toISOString().slice(0, 10)}.csv`, articlesToCsv(sorted, sources, topicName))}
          >
            <Download /> Exporter CSV
          </Button>
        }
      />
      <FilterBar />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={6} />
      ) : (
        <div className="panel">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sorted.length.toLocaleString("fr-FR")}</span> résultat(s)
            </p>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Plus récents</SelectItem>
                <SelectItem value="relevance">Pertinence</SelectItem>
                <SelectItem value="source">Source (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {sorted.length === 0 ? (
            <EmptyState title="Aucun texte trouvé" description="Essayez un autre mot-clé ou élargissez la période." />
          ) : (
            <div className="px-5">
              {sorted.slice(0, limit).map((a) => (
                <ArticleRow key={a.id} article={a} sources={sources} topics={topics} />
              ))}
              {limit < sorted.length && (
                <div className="py-5 text-center">
                  <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
                    Afficher plus ({sorted.length - limit} restants)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
