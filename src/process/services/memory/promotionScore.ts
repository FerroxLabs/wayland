/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Promotion score formula for memory entries.
 * Pure function - no side effects, no I/O.
 */

import type { MemoryEntry } from '@/common/types/memory';

const PROMOTED_TAGS = new Set(['decision', 'pattern', 'global', 'design', 'architecture']);

const RECENCY_MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const RECENCY_PEAK_MS = 24 * 60 * 60 * 1000;      // 24 hours

/**
 * Compute a promotion score (0–100) for a memory entry.
 *
 * Formula:
 *   +30 if type = decision or pattern
 *   +10 per cross-project reference (capped by `refsByEntry` lookup)
 *   +5 per referencedBy hit
 *   +20 if any tag is in the promoted-tag set
 *   +15 recency boost (full at <24h, decays linearly to 0 at 30d)
 *   Cap at 100.
 *
 * @param entry        - The memory entry to score.
 * @param refsByEntry  - Map<entryId, crossProjectRefCount>. Populated by
 *                       ijfwArchiveService's cross-project grep.
 */
export function computePromotionScore(
  entry: MemoryEntry,
  refsByEntry: Map<string, number>,
): number {
  let score = 0;

  // +30 for high-signal types.
  if (entry.type === 'decision' || entry.type === 'pattern') {
    score += 30;
  }

  // +10 per cross-project reference.
  const crossRefs = refsByEntry.get(entry.id) ?? 0;
  score += crossRefs * 10;

  // +5 per referencedBy hit.
  score += entry.referencedBy * 5;

  // +20 if any tag is in the promoted-tag set.
  if (entry.tags.some((t) => PROMOTED_TAGS.has(t.toLowerCase()))) {
    score += 20;
  }

  // +15 recency boost: full at <24h, linear decay to 0 at 30d.
  const ageMs = Date.now() - entry.storedAt;
  if (ageMs <= RECENCY_PEAK_MS) {
    score += 15;
  } else if (ageMs < RECENCY_MAX_MS) {
    const decay = 1 - (ageMs - RECENCY_PEAK_MS) / (RECENCY_MAX_MS - RECENCY_PEAK_MS);
    score += Math.round(15 * decay);
  }

  return Math.min(100, Math.max(0, score));
}
