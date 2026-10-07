import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
  addWeeks,
  addMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Article, Source, Topic, Watchlist } from "./data";
import { normalizeText } from "./pipeline/processing";
import { TEXT_TYPES } from "./pipeline/types";

export type Preset = "today" | "7d" | "30d" | "3m" | "1y" | "custom";
export const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "3m", label: "3 mois" },
  { value: "1y", label: "1 an" },
  { value: "custom", label: "Personnalisée" },
];

export interface Filters {
  preset: Preset;
  customFrom?: string;
  customTo?: string;
  topicIds: string[];
  sourceIds: string[];
  types: string[];
  language: "all" | "fr" | "en";
  keyword: string;
}

export const defaultFilters: Filters = {
  preset: "30d",
  topicIds: [],
  sourceIds: [],
  types: [],
  language: "all",
  keyword: "",
};

export function getRange(f: Pick<Filters, "preset" | "customFrom" | "customTo">, now = new Date()) {
  const to = endOfDay(now);
  let from: Date;
  switch (f.preset) {
    case "today":
      from = startOfDay(now);
      break;
    case "7d":
      from = startOfDay(subDays(now, 6));
      break;
    case "30d":
      from = startOfDay(subDays(now, 29));
      break;
    case "3m":
      from = startOfDay(subMonths(now, 3));
      break;
    case "1y":
      from = startOfDay(subYears(now, 1));
      break;
    case "custom": {
      const cf = f.customFrom ? new Date(f.customFrom) : subDays(now, 29);
      const ct = f.customTo ? new Date(f.customTo) : now;
      return { from: startOfDay(cf), to: endOfDay(ct) };
    }
  }
  return { from, to };
}

export function previousRange(r: { from: Date; to: Date }) {
  const ms = r.to.getTime() - r.from.getTime();
  return { from: new Date(r.from.getTime() - ms - 1), to: new Date(r.from.getTime() - 1) };
}

export const formatRange = (r: { from: Date; to: Date }) =>
  `${format(r.from, "d MMM yyyy", { locale: fr })} – ${format(r.to, "d MMM yyyy", { locale: fr })}`;

export function matchesKeyword(a: Article, keyword: string) {
  if (!keyword.trim()) return true;
  const hay = normalizeText(`${a.title} ${a.summary ?? ""} ${a.keywords.join(" ")}`);
  return normalizeText(keyword)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

export function applyFilters(articles: Article[], f: Filters, range?: { from: Date; to: Date }) {
  return articles.filter((a) => {
    if (range) {
      const t = new Date(a.published_at).getTime();
      if (t < range.from.getTime() || t > range.to.getTime()) return false;
    }
    if (f.topicIds.length && !a.topic_ids.some((t) => f.topicIds.includes(t))) return false;
    if (f.sourceIds.length && (!a.source_id || !f.sourceIds.includes(a.source_id))) return false;
    if (f.types.length && !f.types.includes(a.text_type)) return false;
    if (f.language !== "all" && a.language !== f.language) return false;
    return matchesKeyword(a, f.keyword);
  });
}

export function matchesWatchlist(a: Article, w: Watchlist) {
  const hay = normalizeText(`${a.title} ${a.summary ?? ""} ${a.keywords.join(" ")}`);
  const has = (k: string) => {
    const kw = normalizeText(k);
    return kw.length <= 3 ? new RegExp(`\\b${kw}\\b`).test(hay) : hay.includes(kw);
  };
  if (w.include_keywords.length && !w.include_keywords.some(has)) return false;
  if (w.exclude_keywords.some(has)) return false;
  if (w.source_ids.length && (!a.source_id || !w.source_ids.includes(a.source_id))) return false;
  if (w.text_types.length && !w.text_types.includes(a.text_type)) return false;
  if (w.languages.length && !w.languages.includes(a.language)) return false;
  return true;
}

export type Granularity = "day" | "week" | "month";
export function granularityFor(r: { from: Date; to: Date }): Granularity {
  const d = differenceInCalendarDays(r.to, r.from);
  if (d <= 45) return "day";
  if (d <= 150) return "week";
  return "month";
}
export const GRAN_LABEL: Record<Granularity, string> = { day: "par jour", week: "par semaine", month: "par mois" };

const bucketStart = (d: Date, g: Granularity) =>
  g === "day" ? startOfDay(d) : g === "week" ? startOfWeek(d, { weekStartsOn: 1 }) : startOfMonth(d);
const nextBucket = (d: Date, g: Granularity) =>
  g === "day" ? addDays(d, 1) : g === "week" ? addWeeks(d, 1) : addMonths(d, 1);
const bucketLabel = (d: Date, g: Granularity) =>
  g === "month" ? format(d, "MMM yy", { locale: fr }) : format(d, "d MMM", { locale: fr });

export function timeSeries(articles: Article[], r: { from: Date; to: Date }, g: Granularity) {
  const buckets = new Map<number, Record<string, number | string>>();
  for (let d = bucketStart(r.from, g); d <= r.to; d = nextBucket(d, g)) {
    const row: Record<string, number | string> = { label: bucketLabel(d, g), total: 0, date: d.toISOString() };
    TEXT_TYPES.forEach((t) => (row[t] = 0));
    buckets.set(d.getTime(), row);
  }
  for (const a of articles) {
    const k = bucketStart(new Date(a.published_at), g).getTime();
    const row = buckets.get(k);
    if (!row) continue;
    row.total = (row.total as number) + 1;
    row[a.text_type] = ((row[a.text_type] as number) ?? 0) + 1;
  }
  return [...buckets.values()];
}

export function countBy<T extends string>(items: Article[], key: (a: Article) => T | null) {
  const m = new Map<string, number>();
  for (const a of items) {
    const k = key(a);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function byType(articles: Article[]) {
  const m = countBy(articles, (a) => a.text_type);
  return TEXT_TYPES.map((t) => ({ name: t, value: m.get(t) ?? 0 }));
}

export function bySource(articles: Article[], sources: Source[], limit = 8) {
  const m = countBy(articles, (a) => a.source_id);
  return sources
    .map((s) => ({ id: s.id, name: s.name.replace(/\s*\((démo|demo)\)/i, ""), value: m.get(s.id) ?? 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return Math.round(((cur - prev) / prev) * 100);
}

export interface Trend {
  topic: Topic;
  volume: number;
  previous: number;
  change: number;
  firstSeen: string | null;
  lastSeen: string | null;
  topSources: { name: string; value: number }[];
  status: "emergente" | "en_baisse" | "stable";
}

export function computeTrends(
  current: Article[],
  previous: Article[],
  topics: Topic[],
  sources: Source[],
): Trend[] {
  return topics
    .map((topic) => {
      const cur = current.filter((a) => a.topic_ids.includes(topic.id));
      const prev = previous.filter((a) => a.topic_ids.includes(topic.id)).length;
      const dates = cur.map((a) => a.published_at).sort();
      const change = pctChange(cur.length, prev);
      const status: Trend["status"] =
        change >= 25 && cur.length >= 3 ? "emergente" : change <= -25 && prev >= 3 ? "en_baisse" : "stable";
      return {
        topic,
        volume: cur.length,
        previous: prev,
        change,
        firstSeen: dates[0] ?? null,
        lastSeen: dates[dates.length - 1] ?? null,
        topSources: bySource(cur, sources, 3),
        status,
      };
    })
    .filter((t) => t.volume > 0 || t.previous > 0)
    .sort((a, b) => b.volume - a.volume);
}

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
];

export const sourceName = (sources: Source[] | undefined, id: string | null) =>
  (sources?.find((s) => s.id === id)?.name ?? "Source inconnue").replace(/\s*\((démo|demo)\)/i, "");
