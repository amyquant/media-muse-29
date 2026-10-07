// Normalisation, classification du type de texte et détection de sujets.
// Implémentations déterministes (MVP), remplaçables par des versions sémantiques / IA
// grâce aux interfaces TextClassifier et TopicDetector.
import type {
  Classification,
  NormalizedArticle,
  RawItem,
  TextClassifier,
  TopicDetector,
} from "./types";
import type { SourceConfig } from "./ingestion";

export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const stripHtml = (s?: string) => (s ? s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

export function normalizeItem(item: RawItem, source: SourceConfig): NormalizedArticle {
  const summary = stripHtml(item.description).slice(0, 600) || null;
  return {
    source_id: source.id,
    external_id: item.externalId,
    title: stripHtml(item.title),
    summary,
    content: stripHtml(item.content) || null,
    url: item.link ?? null,
    author: item.author ?? null,
    language: source.language,
    published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
    keywords: item.categories ?? [],
  };
}

const TYPE_RULES: { type: Classification["type"]; patterns: RegExp[] }[] = [
  { type: "Éditorial", patterns: [/^editorial\b/, /\beditorial\s*:/] },
  { type: "Opinion", patterns: [/^opinion\b/, /\bchronique\b/, /\blettre ouverte\b/, /\btribune\b/] },
  { type: "Entrevue", patterns: [/^entrevue\b/, /\bentretien\b/, /\binterview\b/] },
  { type: "Analyse", patterns: [/^analyse\b/, /\bdecryptage\b/, /\bdossier\b/] },
  { type: "Communiqué", patterns: [/^communique\b/, /\bcommunique de presse\b/] },
];

export const ruleBasedClassifier: TextClassifier = {
  classify({ title, summary }) {
    const t = normalizeText(title);
    const s = normalizeText(summary ?? "");
    for (const rule of TYPE_RULES) {
      if (rule.patterns.some((p) => p.test(t))) return { type: rule.type, confidence: 0.9 };
      if (rule.patterns.some((p) => p.test(s))) return { type: rule.type, confidence: 0.6 };
    }
    return { type: "Actualité", confidence: 0.5 };
  },
};

export const keywordTopicDetector: TopicDetector = {
  detect(text, topics) {
    const n = normalizeText(text);
    return topics
      .map((topic) => {
        const hits = topic.keywords.filter((k) => {
          const kw = normalizeText(k);
          return kw.length <= 3 ? new RegExp(`\\b${kw}\\b`).test(n) : n.includes(kw);
        }).length;
        return { topicId: topic.id, score: topic.keywords.length ? hits / topic.keywords.length : 0 };
      })
      .filter((r) => r.score > 0);
  },
};
