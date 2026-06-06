/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared types for the v0.6.4 Memory Archive IPC surface.
 */

export type MemoryType = 'decision' | 'pattern' | 'observation' | 'session' | 'wiki' | 'preference';

export type MemoryEntry = {
  id: string;
  type: MemoryType;
  project: string;
  projectPath: string;
  summary: string;
  bodyPreview: string;
  body?: string;
  why?: string;
  howToApply?: string;
  tags: string[];
  storedAt: number;
  sourcePath: string;
  sourceLine: number;
  referencedBy: number;
  promotionScore: number;
};

export type ListFilter = {
  project?: 'this' | 'all' | 'global' | string;
  types?: MemoryType[];
  tags?: string[];
  timeWindow?: 'all' | 'today' | '7d' | '30d';
  search?: string;
  sort?: 'recent' | 'most-referenced' | 'highest-score';
  offset?: number;
  limit?: number;
};

export type SparklineData = number[];

export type StatDeltas = {
  total24h: number;
  total7d: number;
  decisions24h: number;
  decisions7d: number;
  wiki24h: number;
  wiki7d: number;
  sessions24h: number;
  sessions7d: number;
};

export type StatKey = 'total' | 'banked' | 'decisions' | 'wiki' | 'sessions' | 'projects';

export type MemoryStats = {
  total: number;
  decisions: number;
  wiki: number;
  sessions: number;
  projects: number;
  banked: number;
  deltas: StatDeltas;
  sparkline: SparklineData;
  sparklines: Record<StatKey, number[]>;
  /**
   * Count of entries grouped by MemoryType. All six keys are always present
   * (zero-filled) so the renderer can render "Decisions (0)" without optional
   * chaining.
   */
  typeCounts: Record<MemoryType, number>;
  /**
   * Activity streak computed from the disk index across all projects.
   * `sessions`     = total count of distinct UTC calendar days with any stored entry.
   * `longestDays`  = longest consecutive-day run in the per-disk-index history.
   * `lastActiveDayMs` = midnight-UTC epoch ms of the most recent active day, so
   *                  the renderer can compute "X days since last activity".
   */
  streak: {
    sessions: number;
    longestDays: number;
    lastActiveDayMs: number;
  };
};

export type IndexStats = {
  total: number;
  projects: number;
  lastIndexedAt: number;
};

export type ProjectSummary = {
  path: string;
  basename: string;
  count: number;
  lastActive: number;
};

export type TagCount = {
  tag: string;
  count: number;
};

export type PromotionCandidate = {
  id: string;
  score: number;
  /** Human-readable summary for display (added W3). */
  summary?: string;
  /** Project identifier (added W3). */
  project?: string;
};

export type LastDream = {
  factsExtracted: number;
  promoted: number;
  agoMs: number;
};

export type PromotionCandidates = {
  candidates: PromotionCandidate[];
  threshold: number;
  lastRun: number;
  nextRun: number;
  /** ISO timestamp of the last sweep run (W3 alias for lastRun). */
  lastRunAt?: number;
  /** ISO timestamp of the next scheduled sweep (W3 alias for nextRun). */
  nextRunAt?: number;
  /** Whether auto-promotion on schedule is enabled (added W3). */
  autoPromoteEnabled?: boolean;
  /** Summary of the most recent promotion sweep run. */
  lastDream?: LastDream;
};

/**
 * Discriminated union result for memory.get-stats IPC call.
 * Using a wrapper so the renderer can safely distinguish success from failure.
 */
export type GetStatsResult =
  | { ok: true; stats: MemoryStats }
  | { ok: false; error: string };

// ==================== Wiki types (v0.6.4) ====================

export type WikiTopicTag =
  | 'Architecture'
  | 'Design'
  | 'Decisions'
  | 'Process'
  | 'Patterns'
  | 'Brand';

export type WikiFreshness = 'fresh' | 'stale' | 'never_reviewed';

export type WikiConcept = {
  id: string;
  name: string;
  slug: string;
  topicTag: WikiTopicTag;
  tldr: string;
  body: string;
  aliases: string[];
  sourceMemoryIds: string[];
  linkedFromConcepts: string[];
  relatedConcepts: string[];
  tags: string[];
  lastSynthesizedAt: number;
  lastReviewedAt?: number;
  freshness: WikiFreshness;
};

export type WikiState = {
  version: 1;
  concepts: WikiConcept[];
  backlinkGraph: Record<string, string[]>;
  orphanCandidates: {
    memoryIds: string[];
    citationCount: number;
    suggestedName: string;
  }[];
  lastUpdatedAt: number;
  /** Epoch ms of the last auto-synthesis sweep. Undefined before first sweep. */
  lastSyncAt?: number;
};
