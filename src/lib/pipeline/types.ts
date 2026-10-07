// Contrats partagés par la chaîne : ingestion → normalisation → classification → détection de sujets.

export const TEXT_TYPES = [
  "Actualité",
  "Opinion",
  "Éditorial",
  "Analyse",
  "Entrevue",
  "Communiqué",
  "Autre",
] as const;
export type TextType = (typeof TEXT_TYPES)[number];

export type SourceType = "rss" | "api" | "web";

/** Élément brut tel que récupéré par un adaptateur de source. */
export interface RawItem {
  externalId: string;
  title: string;
  description?: string;
  content?: string;
  link?: string;
  author?: string;
  publishedAt?: string;
  categories?: string[];
}

/** Article normalisé prêt à être inséré dans la table `articles`. */
export interface NormalizedArticle {
  source_id: string;
  external_id: string;
  title: string;
  summary: string | null;
  content: string | null;
  url: string | null;
  author: string | null;
  language: string;
  published_at: string;
  keywords: string[];
}

export interface Classification {
  type: TextType;
  confidence: number;
}

export interface TextClassifier {
  classify(input: { title: string; summary?: string | null }): Classification;
}

export interface TopicLike {
  id: string;
  name: string;
  keywords: string[];
}

export interface TopicDetector {
  detect(text: string, topics: TopicLike[]): { topicId: string; score: number }[];
}
