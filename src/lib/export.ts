import type { Article, Source } from "./data";
import { sourceName } from "./analytics";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function articlesToCsv(articles: Article[], sources: Source[], topicName: (id: string) => string) {
  const header = ["date", "titre", "source", "type", "langue", "thematiques", "importance", "url"];
  const rows = articles.map((a) => [
    a.published_at,
    a.title,
    sourceName(sources, a.source_id),
    a.text_type,
    a.language,
    a.topic_ids.map(topicName).join(" | "),
    a.importance,
    a.url ?? "",
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
}

export function downloadFile(name: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
