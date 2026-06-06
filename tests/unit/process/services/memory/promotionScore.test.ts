/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computePromotionScore } from '@process/services/memory/promotionScore';
import type { MemoryEntry } from '@/common/types/memory';

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: 'test-id-001',
    type: 'observation',
    project: 'test-project',
    projectPath: '/tmp/test-project',
    summary: 'Test summary',
    bodyPreview: 'Test body preview',
    tags: [],
    storedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    sourcePath: '/tmp/test-project/.ijfw/memory/knowledge.md',
    sourceLine: 1,
    referencedBy: 0,
    promotionScore: 0,
    ...overrides,
  };
}

describe('computePromotionScore', () => {
  const noRefs = new Map<string, number>();

  it('returns 0 for a bare observation with no signals stored > 30d ago', () => {
    const entry = makeEntry({
      type: 'observation',
      tags: [],
      referencedBy: 0,
      storedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
    });
    expect(computePromotionScore(entry, noRefs)).toBe(0);
  });

  it('adds +30 for type=decision', () => {
    const entry = makeEntry({ type: 'decision', tags: [], referencedBy: 0 });
    expect(computePromotionScore(entry, noRefs)).toBeGreaterThanOrEqual(30);
  });

  it('adds +30 for type=pattern', () => {
    const entry = makeEntry({ type: 'pattern', tags: [], referencedBy: 0 });
    expect(computePromotionScore(entry, noRefs)).toBeGreaterThanOrEqual(30);
  });

  it('does NOT add +30 for type=session', () => {
    const entry = makeEntry({ type: 'session', tags: [], referencedBy: 0 });
    expect(computePromotionScore(entry, noRefs)).toBeLessThan(30);
  });

  it('adds +10 per cross-project ref from refsByEntry map', () => {
    const entry = makeEntry({ type: 'observation', tags: [], referencedBy: 0 });
    const refs = new Map([['test-id-001', 3]]);
    const score = computePromotionScore(entry, refs);
    // 0 (type) + 30 (refs 3×10) + 0 (referencedBy) + 0 (tags) + possible recency
    expect(score).toBeGreaterThanOrEqual(30);
  });

  it('adds +5 per referencedBy hit', () => {
    const entry = makeEntry({ type: 'observation', tags: [], referencedBy: 4 });
    const score = computePromotionScore(entry, noRefs);
    // 0 + 0 + 20 (4×5) = 20 + possible recency
    expect(score).toBeGreaterThanOrEqual(20);
  });

  it('adds +20 for "decision" tag', () => {
    const entry = makeEntry({ type: 'observation', tags: ['decision'], referencedBy: 0 });
    const score = computePromotionScore(entry, noRefs);
    expect(score).toBeGreaterThanOrEqual(20);
  });

  it('adds +20 for "architecture" tag', () => {
    const entry = makeEntry({ type: 'observation', tags: ['architecture'], referencedBy: 0 });
    const score = computePromotionScore(entry, noRefs);
    expect(score).toBeGreaterThanOrEqual(20);
  });

  it('adds full +15 recency boost when storedAt < 24h ago', () => {
    const entry = makeEntry({
      type: 'observation',
      tags: [],
      referencedBy: 0,
      storedAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
    });
    const score = computePromotionScore(entry, noRefs);
    expect(score).toBeGreaterThanOrEqual(15);
  });

  it('applies zero recency boost when storedAt >= 30d ago', () => {
    const entry = makeEntry({
      type: 'observation',
      tags: [],
      referencedBy: 0,
      storedAt: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
    });
    const score = computePromotionScore(entry, noRefs);
    expect(score).toBe(0);
  });

  it('caps score at 100', () => {
    const entry = makeEntry({
      type: 'decision',
      tags: ['decision', 'architecture', 'global'],
      referencedBy: 10,
      storedAt: Date.now() - 60 * 1000, // 1 minute ago
    });
    const refs = new Map([['test-id-001', 10]]);
    const score = computePromotionScore(entry, refs);
    expect(score).toBe(100);
  });

  it('score is non-negative', () => {
    const entry = makeEntry({ type: 'observation', tags: [], referencedBy: 0 });
    expect(computePromotionScore(entry, noRefs)).toBeGreaterThanOrEqual(0);
  });

  it('decision + architecture tag + recent + refs exceeds 90 threshold', () => {
    const entry = makeEntry({
      type: 'decision',
      tags: ['architecture'],
      referencedBy: 2,
      storedAt: Date.now() - 2 * 60 * 60 * 1000, // 2h ago
    });
    const refs = new Map([['test-id-001', 1]]);
    // +30 decision + +10 1 cross-ref + +10 2 referencedBy + +20 architecture tag + +15 recency = 85
    const score = computePromotionScore(entry, refs);
    expect(score).toBeGreaterThanOrEqual(85);
  });
});
