import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Delta } from "@/components/app/bits";
import { Sparkline } from "@/components/app/charts";
import { FilterBar } from "@/components/app/filter-bar";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/states";
import { useFilteredArticles } from "@/hooks/use-articles";
import { computeTrends, granularityFor, timeSeries, type Trend } from "@/lib/analytics";
import { useFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tendances")({
  head: () => ({
    meta: [
      { title: "Tendances et sujets récurrents — Revue" },
      { name: "description", content: "Sujets émergents, en baisse et récurrents dans la couverture médiatique." },
      { property: "og:title", content: "Tendances et sujets récurrents — Revue" },
      { property: "og:description", content: "Sujets émergents, en baisse et récurrents dans la couverture médiatique." },
    ],
  }),
  component: Trends,
});

const STATUS = {
  emergente: { label: "Émergente", cls: "bg-success/12 text-success" },
  en_baisse: { label: "En baisse", cls: "bg-destructive/10 text-destructive" },
  stable: { label: "Stable", cls: "bg-muted text-muted-foreground" },
};

function Trends() {
  const { current, previous, sources, topics, isLoading, error, refetch, range } = useFilteredArticles();
  const { setFilters } = useFilters();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | Trend["status"]>("all");

  const trends = useMemo(() => computeTrends(current, previous, topics, sources), [current, previous, topics, sources]);
  const sparks = useMemo(() => {
    const g = granularityFor(range);
    return Object.fromEntries(
      trends.map((t) => [
        t.topic.id,
        timeSeries(current.filter((a) => a.topic_ids.includes(t.topic.id)), range, g).map((r) => ({ v: r.total as number })),
      ]),
    );
  }, [trends, current, range]);

  const open = (id: string) => {
    setFilters((f) => ({ ...f, topicIds: [id] }));
    navigate({ to: "/explorer" });
  };
  const emerging = trends.filter((t) => t.status === "emergente").sort((a, b) => b.change - a.change);
  const declining = trends.filter((t) => t.status === "en_baisse").sort((a, b) => a.change - b.change);
  const shown = tab === "all" ? trends : trends.filter((t) => t.status === tab);
  const d = (s: string | null) => (s ? format(new Date(s), "d MMM yyyy", { locale: fr }) : "—");

  return (
    <>
      <PageHeader
        kicker="Tendances"
        title="Sujets récurrents"
        description="Détection déterministe par mots-clés et catégories ; prête à être remplacée par une analyse sémantique ou IA."
      />
      <FilterBar />
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState rows={5} />
      ) : trends.length === 0 ? (
        <div className="panel"><EmptyState title="Aucune tendance détectée" description="Élargissez la période." /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "En émergence", icon: TrendingUp, list: emerging, tone: "text-success" },
              { title: "En baisse", icon: TrendingDown, list: declining, tone: "text-destructive" },
            ].map(({ title, icon: Icon, list, tone }) => (
              <section key={title} className="panel p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <Icon className={cn("size-4", tone)} /> {title}
                </h2>
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3">Aucun sujet sur cette période.</p>
                ) : (
                  <ul className="space-y-1">
                    {list.slice(0, 4).map((t) => (
                      <li key={t.topic.id}>
                        <button onClick={() => open(t.topic.id)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-muted text-left">
                          <span className="flex-1 font-medium text-sm">{t.topic.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{t.previous} → {t.volume}</span>
                          <Delta value={t.change} className="w-14 justify-end" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="panel overflow-hidden">
            <div className="flex gap-1 border-b px-4 pt-3">
              {(["all", "emergente", "stable", "en_baisse"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn("px-3 pb-2.5 text-sm border-b-2 -mb-px", tab === k ? "border-highlight font-medium" : "border-transparent text-muted-foreground")}
                >
                  {k === "all" ? "Toutes" : STATUS[k].label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    {["Sujet", "Volume", "Évolution", "Tendance", "Première apparition", "Dernière apparition", "Principales sources"].map((h) => (
                      <th key={h} className="kicker px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((t) => (
                    <tr key={t.topic.id} onClick={() => open(t.topic.id)} className="border-t cursor-pointer hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.topic.name}</div>
                        <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium", STATUS[t.status].cls)}>{STATUS[t.status].label}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{t.volume}</td>
                      <td className="px-4 py-3"><Delta value={t.change} /></td>
                      <td className="px-4 py-3 w-36"><Sparkline data={sparks[t.topic.id] ?? []} color={t.status === "en_baisse" ? "var(--destructive)" : "var(--chart-1)"} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{d(t.firstSeen)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{d(t.lastSeen)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{t.topSources.map((s) => `${s.name} (${s.value})`).join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length === 0 && <EmptyState title="Aucun sujet dans cette catégorie" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
