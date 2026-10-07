import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Minus } from "lucide-react";
import type { ReactNode } from "react";
import type { Article, Source, Topic } from "@/lib/data";
import { sourceName } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function Delta({ value, className }: { value: number; className?: string }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}

export function Kpi({ label, value, hint, delta }: { label: string; value: ReactNode; hint?: ReactNode; delta?: number }) {
  return (
    <div className="panel p-5">
      <p className="kicker">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-5", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const TYPE_TONE: Record<string, string> = {
  Actualité: "bg-secondary text-secondary-foreground",
  Opinion: "bg-accent text-accent-foreground",
  Éditorial: "bg-primary text-primary-foreground",
  Analyse: "bg-chart-3/15 text-foreground",
  Entrevue: "bg-chart-4/20 text-foreground",
  Communiqué: "bg-chart-5/15 text-foreground",
  Autre: "bg-muted text-muted-foreground",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium", TYPE_TONE[type] ?? TYPE_TONE["Autre"])}>
      {type}
    </span>
  );
}

export function ArticleRow({ article, sources, topics, compact }: { article: Article; sources: Source[]; topics: Topic[]; compact?: boolean }) {
  const tnames = article.topic_ids.map((id) => topics.find((t) => t.id === id)?.name).filter(Boolean);
  return (
    <article className="group py-4 border-b last:border-b-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
        <span className="font-medium text-foreground">{sourceName(sources, article.source_id)}</span>
        <span>·</span>
        <time>{format(new Date(article.published_at), "d MMM yyyy, HH:mm", { locale: fr })}</time>
        <span>·</span>
        <TypeBadge type={article.text_type} />
        {article.importance >= 3 && <span className="text-highlight font-medium">● Important</span>}
        {article.language !== "fr" && <span className="uppercase">{article.language}</span>}
      </div>
      <Link
        to="/articles/$id"
        params={{ id: article.id }}
        className="font-display text-[1.05rem] font-semibold leading-snug hover:text-highlight transition-colors"
      >
        {article.title}
      </Link>
      {!compact && article.summary && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{article.summary}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {tnames.map((n) => (
          <span key={n} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
            {n}
          </span>
        ))}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            title="Lien de démonstration (fictif)"
          >
            Lien externe <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </article>
  );
}
