// Couche d'ingestion : un adaptateur par type de source.
// IMPORTANT : aucun connecteur réel n'est branché pour l'instant. Les adaptateurs
// déclarent leur contrat ; l'exécution côté serveur (fonction planifiée) sera ajoutée
// dans une étape ultérieure. L'interface ne prétend jamais qu'un flux est synchronisé.
import type { RawItem, SourceType } from "./types";

export interface SourceConfig {
  id: string;
  name: string;
  source_type: SourceType;
  url: string;
  language: string;
}

export interface SourceAdapter {
  type: SourceType;
  label: string;
  /** Vérifie la forme de l'URL/configuration avant enregistrement. */
  validate(url: string): string | null;
  /** Récupère les éléments bruts. Doit s'exécuter côté serveur. */
  fetch(source: SourceConfig): Promise<RawItem[]>;
}

class NotConnectedError extends Error {
  constructor(type: string) {
    super(`L'ingestion ${type.toUpperCase()} n'est pas encore connectée côté serveur.`);
  }
}

const isHttpUrl = (url: string) => {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export const adapters: Record<SourceType, SourceAdapter> = {
  rss: {
    type: "rss",
    label: "Flux RSS / Atom",
    validate: (url) => (isHttpUrl(url) ? null : "URL de flux invalide (http/https requis)."),
    fetch: async () => {
      throw new NotConnectedError("rss");
    },
  },
  api: {
    type: "api",
    label: "API (agence, agrégateur)",
    validate: (url) => (isHttpUrl(url) ? null : "Point d'accès API invalide."),
    fetch: async () => {
      throw new NotConnectedError("api");
    },
  },
  web: {
    type: "web",
    label: "Page web (extraction)",
    validate: (url) => (isHttpUrl(url) ? null : "URL de page invalide."),
    fetch: async () => {
      throw new NotConnectedError("web");
    },
  },
};

export const SYNC_STATUS_LABEL: Record<string, string> = {
  non_connecte: "Ingestion non connectée",
  demo: "Données de démonstration",
  ok: "Synchronisée",
  erreur: "Erreur",
};
