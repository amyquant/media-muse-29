import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultFilters, getRange, previousRange, type Filters } from "./analytics";

interface Ctx {
  filters: Filters;
  setFilters: (f: Filters | ((f: Filters) => Filters)) => void;
  range: { from: Date; to: Date };
  prevRange: { from: Date; to: Date };
  reset: () => void;
}

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const value = useMemo(() => {
    const range = getRange(filters);
    return {
      filters,
      setFilters,
      range,
      prevRange: previousRange(range),
      reset: () => setFilters(defaultFilters),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters doit être utilisé dans FiltersProvider");
  return ctx;
}
