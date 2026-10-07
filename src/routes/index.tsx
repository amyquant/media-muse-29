import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, Delta, Kpi, ArticleRow } from "@/components/app/bits";
import { HBarChart, TypeBySourceChart, TypeDonut, VolumeChart } from "@/components/app/charts";
import { FilterBar } from "@/components/app/filter-bar";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/states";
import { useFilteredArticles } from "@/hooks/use-articles";
import { GRAN_LABEL, bySource, byType, computeTrends, granularityFor, pctChange, timeSeries } from "@/lib/analytics";
import { useFilters } from "@/lib/filters";
import { TEXT_TYPES } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Revue, veille médiatique" },
      { name: "description", content: "Volume médiatique, évolution, types de textes et sources en un coup d'œil." },
      { property: "og:title", content: "Tableau de bord — Revue, veille médiatique" },
      { property: "og:description", content: "Volume médiatique, évolution, types de textes et sources en un coup d'œil." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { current, previous, sources, topics, isLoading, error, refetch, range } = useFilteredArticles();
  const { setFilters } = useFilters();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"total" | "types">("total");
  const gran = granularityFor(range);

  const data = useMemo(() => {
    const series = timeSeries(current, range, gran);
    const types = byType(current);
    const src = bySource(current, sources, 8);
    const trends = computeTrends(current, previous, topics, sources);
    const typeBySource = src.map((s) => {
      const row: Record<string, number | string> = { name: s.name };
      TEXT_TYPES.forEach((t) => (row[t] = current.filter((a) => a.source_id === s.id && a.text_type === t).length));
      return row;
    });
    const important = [...current].sort((a, b) => b.importance - a.importance || b.published_at.localeCompare(a.published_at)).slice(0, 5);
    return { series, types, src, trends, typeBySource, important };
  }, [current, previous, sources, topics, range, gran]);

  const activeSources = new Set(current.map((a) => a.source_id)).size;
  const delta = pctChange(current.length, previous.length);
  const emerging = data.trends.filter((t) => t.status === "emergente");

  return (
    <>
      <PageHeader kicker="Analyse du volume" title="Tableau de bord" description="Suivez le volume médiatique, sa composition et son évolution sur la période choisie." />
      <FilterBar />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Kpi label="Articles" value={current.length.toLocaleString("fr-FR")} hint={`${previous.length.toLocaleString("fr-FR")} sur la période précédente`} />
            <Kpi label="Sources actives" value={activeSources} hint={`sur ${sources.length} sources configurées`} />
            <Kpi label="Évolution" value={<Delta value={delta} className="text-3xl [&_svg]:size-6" />} hint="vs période précédente équivalente" />
            <Kpi label="Sujets détectés" value={data.trends.filter((t) => t.volume > 0).length} hint={`${emerging.length} en émergence`} />
          </div>

          {current.length === 0 ? (
            <div className="panel">
              <EmptyState title="Aucun article pour ces critères" description="Élargissez la période ou retirez certains filtres." />
            </div>
          ) : (
            <>
              <Card
                title="Volume d'articles publiés"
                subtitle={`Regroupement ${GRAN_LABEL[gran]}`}
                action={
                  <div className="inline-flex rounded-md border p-0.5 text-xs">
                    {(["total", "types"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={cn("rounded px-2.5 py-1", mode === m ? "bg-secondary font-medium" : "text-muted-foreground")}
                      >
                        {m === "total" ? "Total" : "Par type"}
                      </button>
                    ))}
                  </div>
                }
              >
                <VolumeChart data={data.series} stacked={mode === "types"} height={300} />
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Répartition par type de texte">
                  <TypeDonut data={data.types} />
                </Card>
                <Card title="Principales sources" subtitle="Cliquer une barre pour filtrer">
                  <HBarChart
                    data={data.src}
                    onClick={(d) => d.id && setFilters((f) => ({ ...f, sourceIds: [d.id!] }))}
                  />
                </Card>
              </div>

              <Card title="Types de textes par source" subtitle="Comparaison de la ligne éditoriale des principales sources">
                <TypeBySourceChart data={data.typeBySource} />
              </Card>

              <div className="grid gap-6 lg:grid-cols-5">
                <Card
                  className="lg:col-span-2"
                  title="Sujets du moment"
                  action={
                    <Link to="/tendances" className="text-xs text-muted-foreground hover:text-foreground">
                      Toutes les tendances →
                    </Link>
                  }
                >
                  <ul className="divide-y">
                    {data.trends.slice(0, 6).map((t) => (
                      <li key={t.topic.id}>
                        <button
                          className="flex w-full items-center gap-3 py-2.5 text-left hover:text-highlight"
                          onClick={() => {
                            setFilters((f) => ({ ...f, topicIds: [t.topic.id] }));
                            navigate({ to: "/explorer" });
                          }}
                        >
                          <span className="flex-1 text-sm font-medium">{t.topic.name}</span>
                          <span className="text-sm tabular-nums">{t.volume}</span>
                          <Delta value={t.change} className="w-14 justify-end" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="lg:col-span-3" title="Articles importants">
                  {data.important.map((a) => (
                    <ArticleRow key={a.id} article={a} sources={sources} topics={topics} compact />
                  ))}
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
