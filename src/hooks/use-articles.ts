import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { applyFilters } from "@/lib/analytics";
import { articlesQuery, sourcesQuery, topicsQuery } from "@/lib/data";
import { useFilters } from "@/lib/filters";

/** Articles de la période courante et précédente, filtrés selon les filtres globaux. */
export function useFilteredArticles() {
  const { filters, range, prevRange } = useFilters();
  const q = useQuery(articlesQuery(prevRange.from, range.to));
  const sources = useQuery(sourcesQuery);
  const topics = useQuery(topicsQuery);
  const { current, previous } = useMemo(() => {
    const all = q.data ?? [];
    return {
      current: applyFilters(all, filters, range),
      previous: applyFilters(all, filters, prevRange),
    };
  }, [q.data, filters, range, prevRange]);
  return {
    current,
    previous,
    sources: sources.data ?? [],
    topics: topics.data ?? [],
    isLoading: q.isLoading || sources.isLoading || topics.isLoading,
    error: q.error ?? sources.error ?? topics.error,
    refetch: q.refetch,
    range,
    prevRange,
    filters,
  };
}
