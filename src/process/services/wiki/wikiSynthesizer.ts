/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Wiki synthesizer - converts MemoryEntry[] into a WikiConcept.
 *
 * LLM path: tries IJFW MCP `llm_synthesize` verb if the IJFW MCP service
 * is reachable. Falls back to a local heuristic when unavailable.
 *
 * NOTE: The LLM call site is stubbed with a TODO - the fallback always
 * produces valid output. The call site structure exists so W1a/W2 can wire
 * it without structural changes.
 */

import type { MemoryEntry, WikiConcept, WikiTopicTag } from '@/common/types/memory';

// ===== Slug helper =====

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ===== Topic tag inference =====

const TOPIC_KEYWORDS: Record<WikiTopicTag, string[]> = {
  Architecture: ['architecture', 'infra', 'system', 'design system', 'engine', 'bridge', 'ipc'],
  Design: ['ui', 'ux', 'design', 'layout', 'component', 'style', 'css'],
  Decisions: ['decision', 'decided', 'chose', 'rationale', 'why', 'tradeoff'],
  Process: ['process', 'workflow', 'pipeline', 'sprint', 'milestone', 'ship'],
  Patterns: ['pattern', 'convention', 'standard', 'rule', 'approach', 'best practice'],
  Brand: ['brand', 'logo', 'tone', 'voice', 'marketing', 'copy'],
};

function inferTopicTag(entries: MemoryEntry[]): WikiTopicTag {
  const tally: Record<WikiTopicTag, number> = {
    Architecture: 0,
    Design: 0,
    Decisions: 0,
    Process: 0,
    Patterns: 0,
    Brand: 0,
  };

  for (const entry of entries) {
    const text = `${entry.summary} ${entry.tags.join(' ')} ${entry.type}`.toLowerCase();
    for (const [tag, keywords] of Object.entries(TOPIC_KEYWORDS) as [WikiTopicTag, string[]][]) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          tally[tag]++;
        }
      }
    }
    // Direct type hint
    if (entry.type === 'decision') tally['Decisions']++;
    if (entry.type === 'pattern') tally['Patterns']++;
    if (entry.type === 'session') tally['Process']++;
  }

  let best: WikiTopicTag = 'Process';
  let bestScore = 0;
  for (const [tag, score] of Object.entries(tally) as [WikiTopicTag, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = tag;
    }
  }
  return best;
}

// ===== Proper-noun wikilink injection =====
// Simple heuristic: Title Case runs of 2+ words get [[wrapped]]

function injectWikilinks(text: string): string {
  return text.replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g, '[[$1]]');
}

// ===== Local heuristic fallback =====

function buildConceptFromHeuristic(
  entries: MemoryEntry[],
  topicHint?: WikiTopicTag,
): WikiConcept {
  if (entries.length === 0) {
    throw new Error('synthesize requires at least one MemoryEntry');
  }

  const topEntry = entries[0];
  const name =
    topEntry.project
      ? `${topEntry.project} - synthesized concept`
      : 'Synthesized Concept';

  const slug = toSlug(name);
  const id = `wiki-${slug}-${Date.now()}`;

  // TL;DR: first entry's summary, truncated to 280 chars
  const tldr = topEntry.summary.slice(0, 280);

  // Body: top 3 entry summaries joined, with wikilink injection
  const bodyParts = entries
    .slice(0, 3)
    .map((e, i) => `## ${i + 1}. ${e.summary}\n\n${e.bodyPreview || e.summary}`)
    .join('\n\n');
  const body = injectWikilinks(bodyParts);

  const topicTag = topicHint ?? inferTopicTag(entries);

  // Collect tags via majority voting
  const tagFreq = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagFreq.set(tag, (tagFreq.get(tag) ?? 0) + 1);
    }
  }
  const tags = Array.from(tagFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  return {
    id,
    name,
    slug,
    topicTag,
    tldr,
    body,
    aliases: [slug],
    sourceMemoryIds: entries.map((e) => e.id),
    linkedFromConcepts: [],
    relatedConcepts: [],
    tags,
    lastSynthesizedAt: Date.now(),
    lastReviewedAt: undefined,
    freshness: 'never_reviewed',
  };
}

// ===== Stopwords for content-word overlap =====

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'on',
  'at', 'by', 'for', 'with', 'about', 'as', 'from', 'that', 'this',
  'it', 'its', 'we', 'our', 'their', 'they', 'he', 'she', 'and', 'or',
  'but', 'if', 'not', 'so', 'all', 'any', 'each', 'via', 'into', 'use',
  'used', 'uses', 'when', 'then', 'than', 'also', 'now', 'up', 'how',
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
  );
}

function tagOverlap(a: MemoryEntry, b: MemoryEntry): number {
  const setA = new Set(a.tags.map((t) => t.toLowerCase()));
  let count = 0;
  for (const t of b.tags) {
    if (setA.has(t.toLowerCase())) count++;
  }
  return count;
}

function wordOverlap(a: MemoryEntry, b: MemoryEntry): number {
  const wordsA = significantWords(a.summary);
  const wordsB = significantWords(b.summary);
  let count = 0;
  for (const w of wordsB) {
    if (wordsA.has(w)) count++;
  }
  return count;
}

/**
 * Group entries into clusters where members share ≥2 tags OR ≥3 significant
 * content words in their summaries. Returns only clusters with ≥2 members.
 *
 * Algorithm: union-find style - each entry starts in its own cluster, then we
 * merge pairs that satisfy the similarity condition.
 */
function clusterEntries(entries: MemoryEntry[]): MemoryEntry[][] {
  const parent: number[] = entries.map((_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(x: number, y: number): void {
    const px = find(x);
    const py = find(y);
    if (px !== py) parent[px] = py;
  }

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (tagOverlap(entries[i], entries[j]) >= 2 || wordOverlap(entries[i], entries[j]) >= 3) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, MemoryEntry[]>();
  for (let i = 0; i < entries.length; i++) {
    const root = find(i);
    const arr = groups.get(root) ?? [];
    arr.push(entries[i]);
    groups.set(root, arr);
  }

  return Array.from(groups.values()).filter((g) => g.length >= 2);
}

/**
 * Name a concept cluster from the most-common shared tag (Title Case).
 * Falls back to the first entry's summary truncated to 5 words.
 */
function nameForCluster(entries: MemoryEntry[]): string {
  const tagFreq = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      const lower = tag.toLowerCase();
      tagFreq.set(lower, (tagFreq.get(lower) ?? 0) + 1);
    }
  }
  // Only consider tags that appear in more than one entry
  let bestTag = '';
  let bestCount = 1;
  for (const [tag, count] of tagFreq.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestTag = tag;
    }
  }
  if (bestTag) {
    return bestTag
      .split(/[-_ ]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  // Fallback: first 5 words of first entry summary
  return entries[0].summary.split(/\s+/).slice(0, 5).join(' ');
}

// ===== Public surface =====

export type SynthesizeOptions = {
  topicHint?: WikiTopicTag;
};

/**
 * Synthesize a WikiConcept from a set of MemoryEntry records.
 *
 * Tries the IJFW MCP `llm_synthesize` verb first; falls back to a local
 * heuristic if the MCP service is unavailable or the call fails.
 */
export async function synthesize(
  memoryEntries: MemoryEntry[],
  opts?: SynthesizeOptions,
): Promise<WikiConcept> {
  // TODO(W1a/W2): Wire the IJFW MCP llm_synthesize verb here.
  // The call site pattern is:
  //
  //   try {
  //     const ijfwMcp = getIjfwMcpClient(); // lazy singleton
  //     if (await ijfwMcp.isReachable()) {
  //       const result = await ijfwMcp.call('llm_synthesize', {
  //         entries: memoryEntries,
  //         topicHint: opts?.topicHint,
  //       });
  //       return result as WikiConcept;
  //     }
  //   } catch {
  //     // Fall through to local heuristic
  //   }
  //
  // The getIjfwMcpClient() singleton lives in
  // src/process/services/ijfw/ijfwMcpClient.ts (already exists).
  // Import it here once the MCP verb is implemented.

  return buildConceptFromHeuristic(memoryEntries, opts?.topicHint);
}

/**
 * Synthesize multiple WikiConcepts from a pool of MemoryEntry records using
 * heuristic clustering. Only entries not already represented in
 * `existingSourceIds` are considered (incremental synthesis).
 *
 * Returns zero or more concepts - one per cluster with ≥2 members.
 */
export async function synthesizeMany(
  allEntries: MemoryEntry[],
  existingSourceIds: Set<string>,
): Promise<WikiConcept[]> {
  const newEntries = allEntries.filter((e) => !existingSourceIds.has(e.id));
  if (newEntries.length === 0) return [];

  const clusters = clusterEntries(newEntries);
  const results: WikiConcept[] = [];

  for (const cluster of clusters) {
    const name = nameForCluster(cluster);
    const slug = toSlug(name);
    const id = `wiki-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const tldr = cluster
      .slice(0, 3)
      .map((e) => e.summary)
      .join(' · ')
      .slice(0, 280);

    const bodyParts = cluster
      .slice(0, 3)
      .map((e, i) => `## ${i + 1}. ${e.summary}\n\n${e.bodyPreview || e.summary}`)
      .join('\n\n');
    const body = injectWikilinks(bodyParts);

    const topicTag = inferTopicTag(cluster);

    const tagFreq = new Map<string, number>();
    for (const entry of cluster) {
      for (const tag of entry.tags) {
        tagFreq.set(tag, (tagFreq.get(tag) ?? 0) + 1);
      }
    }
    const tags = Array.from(tagFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    results.push({
      id,
      name,
      slug,
      topicTag,
      tldr,
      body,
      aliases: [slug],
      sourceMemoryIds: cluster.map((e) => e.id),
      linkedFromConcepts: [],
      relatedConcepts: [],
      tags,
      lastSynthesizedAt: Date.now(),
      lastReviewedAt: undefined,
      freshness: 'never_reviewed',
    });
  }

  return results;
}
