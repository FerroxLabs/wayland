/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * RELEASE GATE — BM25 recall@20 over the full discovery-queries corpus.
 *
 * Loads 2105 skill index entries and 2003 discovery queries from disk.
 * For each query, calls retrieve(query, 20) and checks whether the first
 * entry in should_match appears in the top-20 results.
 *
 * Passes when recall@20 >= 0.80. Fails with the actual number so the team
 * can decide whether to invest in semantic embeddings.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import path from 'path';
import { SkillRetriever } from '@process/services/skills/SkillRetriever';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

// ---------------------------------------------------------------------------
// Discovery query schema
// ---------------------------------------------------------------------------

type DiscoveryQuery = {
  query: string;
  should_match: string[];
  category_hint?: string;
  should_not_match?: string[];
};

type DiscoveryQueryFile = {
  description: string;
  topN: number;
  queries: DiscoveryQuery[];
};

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// Anchor on cwd (= project root when vitest runs) rather than __dirname,
// which is sensitive to test directory depth.
const LIBRARY_DIR = path.resolve(process.cwd(), 'src/process/resources/skills-library');
const INDEX_PATH = path.join(LIBRARY_DIR, 'index.json');
const QUERIES_PATH = path.join(LIBRARY_DIR, 'discovery-queries.json');

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

describe('BM25 recall gate (release gate)', () => {
  it('recall@20 >= 0.80 over the full discovery-queries corpus', async () => {
    const [indexRaw, queriesRaw] = await Promise.all([
      readFile(INDEX_PATH, 'utf-8'),
      readFile(QUERIES_PATH, 'utf-8'),
    ]);

    const entries = JSON.parse(indexRaw) as SkillIndexEntry[];
    const { queries } = JSON.parse(queriesRaw) as DiscoveryQueryFile;

    // Fresh retriever — never touches the singleton
    const retriever = new SkillRetriever();
    retriever.buildIndex(entries);

    let hits = 0;
    let evaluated = 0;

    for (const q of queries) {
      // Skip queries with no should_match entries (nothing to evaluate)
      if (!q.should_match || q.should_match.length === 0) continue;

      const expected = q.should_match[0];
      const results = retriever.retrieve(q.query, 20);
      const names = results.map((r) => r.name);

      if (names.includes(expected)) {
        hits += 1;
      }
      evaluated += 1;
    }

    const recall = evaluated > 0 ? hits / evaluated : 0;
    const pct = (recall * 100).toFixed(2);

    expect(
      recall,
      `BM25 recall@20 = ${pct}% (${hits}/${evaluated}) — below the 80% gate. ` +
        `Consider improving tokenization or adding semantic embeddings.`
    ).toBeGreaterThanOrEqual(0.8);
  }, 30_000); // Allow up to 30s for 2003 queries
});
