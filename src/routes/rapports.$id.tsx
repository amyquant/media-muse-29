import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useMemo } from "react";
import { ArticleRow, Delta } from "@/components/app/bits";
import { HBarChart, TypeDonut, VolumeChart } from "@/components/app/charts";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import {
  applyFilters,
  bySource,
  byType,
  computeTrends,
  defaultFilters,
  granularityFor,
  GRAN_LABEL,
  matchesWatchlist,
  pctChange,
  previousRange,
  timeSeries,
} from "@/lib/analytics";
import { articlesQuery, reportQuery, sourcesQuery, topicsQuery } from "@/lib/data";
import { articlesToCsv, downloadFile } from "@/lib/export";

export const Route = createFileRoute("/rapports/$id")({
  head: () => ({
    meta: [
      { title: "Rapport d'analyse — Revue" },
      { name: "description", content: "Rapport d'analyse médiatique : volume, évolution, types, sources et tendances." },
      { property: "og:title", content: "Rapport d'analyse — Revue" },
      { property: "og:description", content: "Rapport d'analyse médiatique : volume, évolution, types, sources et tendances." },
    ],
  }),
  component: ReportView,
});

type RFilters = { sourceIds?: string[]; types?: string[]; language?: string };

function ReportView() {
  const { id } = Route.useParams();
  const rep = useQuery(reportQuery(id));
  const sources = useQuery(sourcesQuery);
  const topics = useQuery(topicsQuery);
  const range = rep.data ? { from: new Date(rep.data.period_start), to: new Date(rep.data.period_end) } : null;
  const prev = range ? previousRange(range) : null;
  const arts = useQuery({ ...articlesQuery(prev?.from ?? new Date(0), range?.to ?? new Date(0)), enabled: !!range });

  const r = useMemo(() => {
    if (!rep.data || !range || !prev || !arts.data) return null;
    const f = (rep.data.filters ?? {}) as RFilters;
    const filters = { ...defaultFilters, sourceIds: f.sourceIds ?? [], types: f.types ?? [], language: (f.language ?? "all") as "all" | "fr" | "en", topicIds: rep.data.topic_id ? [rep.data.topic_id] : [] };
    const scope = (list: typeof arts.data) => (rep.data!.watchlists ? list.filter((a) => matchesWatchlist(a, rep.data!.watchlists!)) : list);
    const cur = scope(applyFilters(arts.data, filters, range));
    const before = scope(applyFilters(arts.data, filters, prev));
    const gran = granularityFor(range);
    const types = byType(cur);
    const src = bySource(cur, sources.data ?? [], 8);
    const trends = computeTrends(cur, before, topics.data ?? [], sources.data ?? []);
    const important = [...cur].sort((a, b) => b.importance - a.importance || b.published_at.localeCompare(a.published_at)).slice(0, 8);
    const series = timeSeries(cur, range, gran);
    const peak = series.reduce((m, x) => ((x["total"] as number) > (m["total"] as number) ? x : m), series[0] ?? { total: 0, label: "" });
    return { cur, before, gran, types, src, trends, important, series, peak, delta: pctChange(cur.length, before.length) };
  }, [rep.data, arts.data, sources.data, topics.data]);

  const err = rep.error ?? arts.error;
  if (err) return <ErrorState error={err} onRetry={() => { rep.refetch(); arts.refetch(); }} />;
  if (rep.isLoading || (rep.data && !r)) return <LoadingState rows={5} />;
  if (!rep.data || !r || !range) return <div className="panel"><EmptyState title="Rapport introuvable" /></div>;

  const d = (x: Date) => format(x, "d MMMM yyyy", { locale: fr });
  const scopeLabel = rep.data.watchlists?.name ? `Veille « ${rep.data.watchlists.name} »` : rep.data.topics?.name ? `Thématique « ${rep.data.topics.name} »` : "Ensemble de la presse surveillée";
  const topType = [...r.types].sort((a, b) => b.value - a.value)[0];
  const emerging = r.trends.filter((t) => t.status === "emergente");
  const topicName = (tid: string) => topics.data?.find((t) => t.id === tid)?.name ?? "";
  const pct = (v: number) => (r.cur.length ? Math.round((v / r.cur.length) * 100) : 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to="/rapports"><ArrowLeft /> Tous les rapports</Link></Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadFile(`rapport-${id.slice(0, 8)}.csv`, articlesToCsv(r.cur, sources.data ?? [], topicName))}><Download /> Exporter CSV</Button>
          <Button onClick={() => window.print()}><Printer /> Exporter PDF</Button>
        </div>
      </div>
      <p className="no-print mb-4 text-xs text-muted-foreground">« Exporter PDF » ouvre la fenêtre d'impression : choisissez « Enregistrer en PDF ».</p>

      <article className="panel print-area p-8 md:p-12 space-y-10">
        <header className="border-b pb-6">
          <p className="kicker">Rapport d'analyse médiatique</p>
          <h1 className="font-display text-4xl font-semibold mt-2">{rep.data.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{scopeLabel} · {d(range.from)} – {d(range.to)} · généré le {format(new Date(rep.data.created_at), "d MMM yyyy", { locale: fr })}</p>
        </header>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">1. Résumé exécutif</h2>
          {r.cur.length === 0 ? <p className="text-muted-foreground">Aucun article ne correspond au périmètre sur cette période.</p> : (
            <ul className="space-y-2 leading-relaxed list-disc pl-5">
              <li><strong>{r.cur.length.toLocaleString("fr-FR")} articles</strong> publiés par <strong>{new Set(r.cur.map((a) => a.source_id)).size} sources</strong>, soit une variation de <strong>{r.delta > 0 ? "+" : ""}{r.delta} %</strong> par rapport à la période précédente ({r.before.length}).</li>
              <li>Pic de couverture : <strong>{String(r.peak["label"])}</strong> avec {String(r.peak["total"])} articles ({GRAN_LABEL[r.gran]}).</li>
              {topType && <li>Le type dominant est <strong>{topType.name}</strong> ({pct(topType.value)} % des textes).</li>}
              {r.src[0] && <li>Source la plus active : <strong>{r.src[0].name}</strong> ({r.src[0].value} articles).</li>}
              {emerging.length > 0 && <li>Sujets en émergence : {emerging.slice(0, 3).map((t) => `${t.topic.name} (${t.change > 0 ? "+" : ""}${t.change} %)`).join(", ")}.</li>}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-3">2. Volume médiatique</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-md bg-muted p-4"><p className="kicker">Articles</p><p className="text-2xl font-semibold tabular-nums">{r.cur.length}</p></div>
            <div className="rounded-md bg-muted p-4"><p className="kicker">Période précédente</p><p className="text-2xl font-semibold tabular-nums">{r.before.length}</p></div>
            <div className="rounded-md bg-muted p-4"><p className="kicker">Évolution</p><Delta value={r.delta} className="text-2xl [&_svg]:size-5" /></div>
          </div>
        </section>

        <section className="break-inside-avoid">
          <h2 className="font-display text-xl font-semibold mb-3">3. Évolution temporelle</h2>
          <VolumeChart data={r.series} height={240} />
        </section>

        <div className="grid gap-8 md:grid-cols-2 break-inside-avoid">
          <section><h2 className="font-display text-xl font-semibold mb-3">4. Types de texte</h2><TypeDonut data={r.types} height={200} /></section>
          <section><h2 className="font-display text-xl font-semibold mb-3">5. Sources principales</h2><HBarChart data={r.src} /></section>
        </div>

        <section className="break-inside-avoid">
          <h2 className="font-display text-xl font-semibold mb-3">6. Tendances et sujets récurrents</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left">{["Sujet", "Volume", "Évolution", "Principales sources"].map((h) => <th key={h} className="kicker py-2">{h}</th>)}</tr></thead>
            <tbody>
              {r.trends.slice(0, 8).map((t) => (
                <tr key={t.topic.id} className="border-t">
                  <td className="py-2 font-medium">{t.topic.name}</td>
                  <td className="py-2 tabular-nums">{t.volume}</td>
                  <td className="py-2"><Delta value={t.change} /></td>
                  <td className="py-2 text-xs text-muted-foreground">{t.topSources.map((s) => s.name).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold mb-1">7. Articles importants</h2>
          {r.important.map((a) => <ArticleRow key={a.id} article={a} sources={sources.data ?? []} topics={topics.data ?? []} compact />)}
        </section>

        <footer className="border-t pt-4 text-xs text-muted-foreground">Rapport établi à partir de données de démonstration. Détection des sujets par mots-clés.</footer>
      </article>
    </div>
  );
}
