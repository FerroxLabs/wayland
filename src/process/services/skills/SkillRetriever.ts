/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SkillRetriever - pure-TS BM25 retrieval over the in-memory skill index.
 *
 * BM25 parameters: k1 = 1.5, b = 0.75.
 * Document text: name + description + tags + category (all lowercased).
 * Tokenization: word-boundary split, lowercase, no stemming.
 * Blocked skills (security.verdict === 'blocked') are excluded from the index.
 */

import type { SkillIndexEntry } from '@/common/types/skillTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RetrievalResult = {
  name: string;
  description: string;
  score: number;
};

type DocRecord = {
  name: string;
  description: string;
  termFreqs: Map<string, number>;
  length: number;
};

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z0-9_-]+\b/g) ?? [];
}

// ---------------------------------------------------------------------------
// SkillRetriever
// ---------------------------------------------------------------------------

const BM25_K1 = 1.5;
const BM25_B = 0.75;

export class SkillRetriever {
  private static instance: SkillRetriever | null = null;

  private docs: DocRecord[] = [];
  private df: Map<string, number> = new Map();
  private avgdl = 0;
  private built = false;

  constructor(private readonly options: { entries?: SkillIndexEntry[] } = {}) {}

  // ---------------------------------------------------------------------------
  // Singleton
  // ---------------------------------------------------------------------------

  static getInstance(options?: { entries?: SkillIndexEntry[] }): SkillRetriever {
    if (!SkillRetriever.instance) {
      SkillRetriever.instance = new SkillRetriever(options);
    }
    return SkillRetriever.instance;
  }

  /** For tests only - resets singleton so a fresh instance can be injected. */
  static resetInstance(): void {
    SkillRetriever.instance = null;
  }

  // ---------------------------------------------------------------------------
  // Index construction
  // ---------------------------------------------------------------------------

  buildIndex(entries: SkillIndexEntry[]): void {
    this.docs = [];
    this.df = new Map();

    const eligible = entries.filter((e) => e.security?.verdict !== 'blocked');

    let totalLength = 0;

    for (const e of eligible) {
      const text = [
        e.name,
        e.description,
        ...(e.metadata.tags ?? []),
        e.metadata.category ?? '',
      ].join(' ');

      const tokens = tokenize(text);
      const termFreqs = new Map<string, number>();
      for (const t of tokens) {
        termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1);
      }

      this.docs.push({
        name: e.name,
        description: e.description,
        termFreqs,
        length: tokens.length,
      });

      totalLength += tokens.length;

      // DF counts (one per unique term per doc)
      for (const term of termFreqs.keys()) {
        this.df.set(term, (this.df.get(term) ?? 0) + 1);
      }
    }

    this.avgdl = eligible.length > 0 ? totalLength / eligible.length : 1;
    this.built = true;
  }

  private ensureBuilt(): void {
    if (this.built) return;
    const entries = this.options.entries;
    if (!entries) {
      throw new Error('SkillRetriever: no entries provided and index not built yet');
    }
    this.buildIndex(entries);
  }

  // ---------------------------------------------------------------------------
  // BM25 retrieval
  // ---------------------------------------------------------------------------

  retrieve(query: string, limit = 25): RetrievalResult[] {
    this.ensureBuilt();

    const N = this.docs.length;
    if (N === 0) return [];

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    const scores = new Float64Array(N);

    for (const term of queryTerms) {
      const df = this.df.get(term) ?? 0;
      if (df === 0) continue;

      // IDF with +0.5 smoothing (Robertson / Lucene-style)
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      for (let i = 0; i < N; i++) {
        const doc = this.docs[i];
        const tf = doc.termFreqs.get(term) ?? 0;
        if (tf === 0) continue;

        const norm = 1 - BM25_B + BM25_B * (doc.length / this.avgdl);
        const tfSat = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm);
        scores[i] += idf * tfSat;
      }
    }

    // Collect non-zero scores
    const results: RetrievalResult[] = [];
    for (let i = 0; i < N; i++) {
      if (scores[i] > 0) {
        results.push({
          name: this.docs[i].name,
          description: this.docs[i].description,
          score: scores[i],
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}
