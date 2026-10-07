import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Eye,
  FileText,
  Flame,
  Menu,
  Newspaper,
  Rss,
  Search,
  Settings,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFilters } from "@/lib/filters";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: BarChart3 },
  { to: "/explorer", label: "Explorer", icon: Newspaper },
  { to: "/tendances", label: "Tendances", icon: Flame },
  { to: "/veilles", label: "Veilles", icon: Eye },
  { to: "/sources", label: "Sources", icon: Rss },
  { to: "/rapports", label: "Rapports", icon: FileText },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pt-6 pb-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary font-display text-lg font-bold text-sidebar-primary-foreground">
            R
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">Revue</span>
            <span className="block text-[11px] text-sidebar-muted">Veille médiatique</span>
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground font-medium" }}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="m-3 rounded-md border border-sidebar-border p-3 text-[11px] leading-relaxed text-sidebar-muted">
        Espace de démonstration — les articles affichés sont fictifs.
      </div>
    </div>
  );
}

function GlobalSearch() {
  const { setFilters } = useFilters();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        setFilters((f) => ({ ...f, keyword: q }));
        navigate({ to: "/explorer" });
      }}
    >
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher dans toute la presse… (Entrée)"
        className="h-9 bg-card pl-9"
        aria-label="Recherche globale"
      />
    </form>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-60 lg:block">
        <Nav />
      </aside>
      <div className="lg:pl-60">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-none p-0">
              <Nav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <GlobalSearch />
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
