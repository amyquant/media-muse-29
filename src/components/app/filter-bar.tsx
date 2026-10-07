import { useQuery } from "@tanstack/react-query";
import { CalendarRange, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRESETS, formatRange, type Preset } from "@/lib/analytics";
import { sourcesQuery, topicsQuery } from "@/lib/data";
import { useFilters } from "@/lib/filters";
import { TEXT_TYPES } from "@/lib/pipeline/types";
import { cn } from "@/lib/utils";
import { MultiSelect } from "./multi-select";

export function PeriodSelector() {
  const { filters, setFilters, range } = useFilters();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border bg-card p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setFilters((f) => ({ ...f, preset: p.value as Preset }))}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-[5px] transition-colors",
              filters.preset === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {filters.preset === "custom" ? (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            className="h-8 w-[9.5rem] text-xs"
            value={filters.customFrom ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, customFrom: e.target.value }))}
            aria-label="Date de début"
          />
          <span className="text-xs text-muted-foreground">au</span>
          <Input
            type="date"
            className="h-8 w-[9.5rem] text-xs"
            value={filters.customTo ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, customTo: e.target.value }))}
            aria-label="Date de fin"
          />
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarRange className="size-3.5" /> {formatRange(range)}
        </span>
      )}
    </div>
  );
}

export function FilterBar({ showKeyword = true }: { showKeyword?: boolean }) {
  const { filters, setFilters, reset } = useFilters();
  const topics = useQuery(topicsQuery);
  const sources = useQuery(sourcesQuery);
  const active =
    filters.topicIds.length + filters.sourceIds.length + filters.types.length + (filters.language !== "all" ? 1 : 0) + (filters.keyword ? 1 : 0);
  return (
    <div className="panel p-3 mb-6 space-y-3 no-print">
      <PeriodSelector />
      <div className="flex flex-wrap items-center gap-2">
        {showKeyword && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={filters.keyword}
              onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
              placeholder="Mot-clé…"
              className="h-8 w-52 pl-8 text-sm"
            />
          </div>
        )}
        <MultiSelect
          label="Thématique"
          options={(topics.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          value={filters.topicIds}
          onChange={(v) => setFilters((f) => ({ ...f, topicIds: v }))}
        />
        <MultiSelect
          label="Source"
          options={(sources.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
          value={filters.sourceIds}
          onChange={(v) => setFilters((f) => ({ ...f, sourceIds: v }))}
        />
        <MultiSelect
          label="Type"
          options={TEXT_TYPES.map((t) => ({ value: t, label: t }))}
          value={filters.types}
          onChange={(v) => setFilters((f) => ({ ...f, types: v }))}
        />
        <Select value={filters.language} onValueChange={(v) => setFilters((f) => ({ ...f, language: v as "all" | "fr" | "en" }))}>
          <SelectTrigger className="h-8 w-[9.5rem] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes langues</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="en">Anglais</SelectItem>
          </SelectContent>
        </Select>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
            <RotateCcw /> Réinitialiser ({active})
          </Button>
        )}
      </div>
    </div>
  );
}
