/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure-TS BM25 retrieval core — the scoring math + tokenizer extracted verbatim
 * from `SkillRetriever` so a second consumer (the MCP ToolSelector, #344) can
 * reuse the SAME proven ranking instead of copying it (which would silently
 * drift the moment anyone tuned the params).
 *
 * Type-agnostic: an index is built over arbitrary items via a text extractor and
 * each hit carries the original `ref`, so callers map results back to their own
 * domain types. NO domain coupling lives here — filters (e.g. blocked skills) and
 * field mapping stay in the caller's adapter.
 *
 * BM25 parameters: k1 = 1.5, b = 0.75. IDF uses +0.5 Robertson/Lucene smoothing.
 * Tokenization: lowercase word-boundary split, no stemming.
 */

export const BM25_K1 = 1.5;
export const BM25_B = 0.75;

/** Lowercase word-boundary tokenizer (no stemming, no stopword filtering). */
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z0-9_-]+\b/g) ?? [];
}

type Bm25Doc<T> = {
  ref: T;
  termFreqs: Map<string, number>;
  length: number;
};

/** An immutable BM25 index over items of type `T`. Build once, rank many. */
export type Bm25Index<T> = {
  docs: Bm25Doc<T>[];
  df: Map<string, number>;
  avgdl: number;
};

/** A scored match: the original item plus its score and distinct-term count. */
export type Bm25Hit<T> = {
  ref: T;
  score: number;
  /** How many DISTINCT query terms this doc contains — a corpus-size-independent
   * relevance signal (a spurious match shares one query word, a genuine match
   * shares several). */
  matchedTerms: number;
};

/** Build a BM25 index from `items`, deriving each doc's text via `toText`. */
export function buildBm25Index<T>(items: readonly T[], toText: (item: T) => string): Bm25Index<T> {
  const docs: Bm25Doc<T>[] = [];
  const df = new Map<string, number>();
  let totalLength = 0;

  for (const item of items) {
    const tokens = tokenize(toText(item));
    const termFreqs = new Map<string, number>();
    for (const t of tokens) {
      termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1);
    }

    docs.push({ ref: item, termFreqs, length: tokens.length });
    totalLength += tokens.length;

    // DF counts (one per unique term per doc).
    for (const term of termFreqs.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const avgdl = items.length > 0 ? totalLength / items.length : 1;
  return { docs, df, avgdl };
}

/**
 * Score `index` against `query` and return the top `limit` hits, sorted by
 * descending BM25 score. The math is identical to `SkillRetriever.retrieve`.
 */
export function rankBm25<T>(index: Bm25Index<T>, query: string, limit: number): Bm25Hit<T>[] {
  const { docs, df, avgdl } = index;
  const N = docs.length;
  if (N === 0) return [];

  // Distinct query terms — a repeated query word must not be scored or counted
  // twice (keeps `matchedTerms` a clean distinct-term count).
  const queryTerms = [...new Set(tokenize(query))];
  if (queryTerms.length === 0) return [];

  const scores = new Float64Array(N);
  const matched = new Uint16Array(N);

  for (const term of queryTerms) {
    const termDf = df.get(term) ?? 0;
    if (termDf === 0) continue;

    // IDF with +0.5 smoothing (Robertson / Lucene-style).
    const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);

    for (let i = 0; i < N; i++) {
      const doc = docs[i];
      const tf = doc.termFreqs.get(term) ?? 0;
      if (tf === 0) continue;

      const norm = 1 - BM25_B + BM25_B * (doc.length / avgdl);
      const tfSat = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm);
      scores[i] += idf * tfSat;
      matched[i] += 1;
    }
  }

  const hits: Bm25Hit<T>[] = [];
  for (let i = 0; i < N; i++) {
    if (scores[i] > 0) {
      hits.push({ ref: docs[i].ref, score: scores[i], matchedTerms: matched[i] });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
