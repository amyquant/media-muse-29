import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Source = Tables<"sources">;
export type Topic = Tables<"topics">;
export type Watchlist = Tables<"watchlists">;
export type Report = Tables<"reports">;

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  language: string;
  text_type: string;
  published_at: string;
  source_id: string | null;
  importance: number;
  keywords: string[];
  topic_ids: string[];
}

const ARTICLE_COLS =
  "id,title,summary,url,language,text_type,published_at,source_id,importance,keywords,article_topics(topic_id)";

type ArticleRow = Omit<Article, "topic_ids"> & { article_topics: { topic_id: string }[] };
const mapRow = (r: ArticleRow): Article => ({
  ...r,
  topic_ids: (r.article_topics ?? []).map((t) => t.topic_id),
});

export async function fetchArticlesBetween(from: Date, to: Date): Promise<Article[]> {
  const page = 1000;
  const out: Article[] = [];
  for (let offset = 0; ; offset += page) {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_COLS)
      .gte("published_at", from.toISOString())
      .lte("published_at", to.toISOString())
      .order("published_at", { ascending: false })
      .range(offset, offset + page - 1);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as ArticleRow[]).map(mapRow));
    if (!data || data.length < page) break;
  }
  return out;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 13);

export const articlesQuery = (from: Date, to: Date) =>
  queryOptions({
    queryKey: ["articles", dayKey(from), dayKey(to)],
    queryFn: () => fetchArticlesBetween(from, to),
    staleTime: 60_000,
  });

export const articleQuery = (id: string) =>
  queryOptions({
    queryKey: ["article", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, sources(name, category, source_type), article_topics(topic_id, score, topics(name, slug))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const sourcesQuery = queryOptions({
  queryKey: ["sources"],
  queryFn: async () => {
    const { data, error } = await supabase.from("sources").select("*").order("name");
    if (error) throw error;
    return data;
  },
});

export const sourceCountsQuery = queryOptions({
  queryKey: ["source-counts"],
  queryFn: async () => {
    const { data: sources, error } = await supabase.from("sources").select("id");
    if (error) throw error;
    const entries = await Promise.all(
      sources.map(async (s) => {
        const { count } = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("source_id", s.id);
        return [s.id, count ?? 0] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<string, number>;
  },
});

export const topicsQuery = queryOptions({
  queryKey: ["topics"],
  queryFn: async () => {
    const { data, error } = await supabase.from("topics").select("*").order("name");
    if (error) throw error;
    return data;
  },
});

export const watchlistsQuery = queryOptions({
  queryKey: ["watchlists"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("watchlists")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const reportsQuery = queryOptions({
  queryKey: ["reports"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*, watchlists(name), topics(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const reportQuery = (id: string) =>
  queryOptions({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, watchlists(*), topics(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
