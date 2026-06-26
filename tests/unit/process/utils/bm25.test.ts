/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { tokenize, buildBm25Index, rankBm25 } from '@process/utils/bm25';
import { SkillRetriever } from '@process/services/skills/SkillRetriever';
import type { SkillIndexEntry } from '@/common/types/skillTypes';

const entry = (o: Partial<SkillIndexEntry> = {}): SkillIndexEntry => ({
  name: o.name ?? 'sample-skill',
  description: o.description ?? 'A sample skill',
  type: 'skill',
  source: 'wayland-library',
  metadata: { tags: o.metadata?.tags ?? [], category: o.metadata?.category ?? '' },
  path: `bodies/${o.name ?? 'sample-skill'}.md`,
  security: o.security,
});

// The exact text SkillRetriever concatenates internally (name + description + tags + category).
const toText = (e: SkillIndexEntry) =>
  [e.name, e.description, ...(e.metadata.tags ?? []), e.metadata.category ?? ''].join(' ');

describe('bm25 tokenize', () => {
  it('lowercases and splits on word boundaries, keeping - and _', () => {
    expect(tokenize('Hello World')).toEqual(['hello', 'world']);
    expect(tokenize('git-workflow snake_case')).toEqual(['git-workflow', 'snake_case']);
    expect(tokenize('  Punctuation! Marks?  ')).toEqual(['punctuation', 'marks']);
  });

  it('returns [] for empty or symbol-only text', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('!!! ??? ...')).toEqual([]);
  });
});

describe('bm25 rank', () => {
  type Doc = { id: string; text: string };
  const docs: Doc[] = [
    { id: 'py', text: 'python project setup virtualenv pip' },
    { id: 'react', text: 'react component hooks frontend' },
    { id: 'sql', text: 'optimized sql queries relational databases postgres' },
    { id: 'git', text: 'git branching merge workflows version control' },
  ];
  const index = buildBm25Index(docs, (d) => d.text);

  it('ranks the most relevant doc first', () => {
    expect(rankBm25(index, 'sql database query', 10)[0].ref.id).toBe('sql');
  });

  it('returns only docs that matched >=1 query term, with a distinct matchedTerms count', () => {
    const hits = rankBm25(index, 'python pip', 10);
    expect(hits.map((h) => h.ref.id)).toEqual(['py']);
    expect(hits[0].matchedTerms).toBe(2);
  });

  it('counts a repeated query term once (distinct terms)', () => {
    const once = rankBm25(index, 'python', 10)[0];
    const thrice = rankBm25(index, 'python python python', 10)[0];
    expect(thrice.score).toBeCloseTo(once.score, 10);
    expect(thrice.matchedTerms).toBe(1);
  });

  it('respects the limit', () => {
    expect(rankBm25(index, 'project component sql git', 2)).toHaveLength(2);
  });

  it('returns [] for an empty index, empty query, or no-match query', () => {
    expect(
      rankBm25(
        buildBm25Index([] as Doc[], (d) => d.text),
        'x',
        5
      )
    ).toEqual([]);
    expect(rankBm25(index, '', 5)).toEqual([]);
    expect(rankBm25(index, 'nonexistentterm', 5)).toEqual([]);
  });
});

describe('bm25 parity with SkillRetriever (proves the extraction is verbatim)', () => {
  const entries = [
    entry({
      name: 'python-project-setup',
      description: 'Set up a new Python project',
      metadata: { tags: ['python', 'pip'], category: 'software-engineering' },
    }),
    entry({
      name: 'react-component',
      description: 'Generate a React component with hooks',
      metadata: { tags: ['react', 'hooks'], category: 'frontend' },
    }),
    entry({
      name: 'sql-query',
      description: 'Write optimized SQL queries',
      metadata: { tags: ['sql', 'postgres'], category: 'database' },
    }),
  ];

  it('produces identical scores, order, and matchedTerms for the same docs', () => {
    const query = 'python sql project';
    const skillHits = new SkillRetriever({ entries }).retrieve(query, 10);
    const bmHits = rankBm25(buildBm25Index(entries, toText), query, 10);

    expect(bmHits.map((h) => h.ref.name)).toEqual(skillHits.map((s) => s.name));
    expect(bmHits).toHaveLength(skillHits.length);
    for (let i = 0; i < bmHits.length; i++) {
      expect(bmHits[i].score).toBeCloseTo(skillHits[i].score, 12);
      expect(bmHits[i].matchedTerms).toBe(skillHits[i].matchedTerms);
    }
  });
});
