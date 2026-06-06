/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mission Control - the unified task ledger.
 *
 * A read model that projects every running/scheduled unit of work across the
 * app (team tasks, cron jobs; ACP sessions + workflows land later) into one
 * normalized shape so a single pane can show "what is happening right now".
 *
 * P1 covers team tasks + cron jobs. The projection is passive: building a
 * snapshot never starts a team session or mutates anything.
 */

/** Where a ledger entry originates. */
export type LedgerSource = 'team' | 'cron';

/** Normalized status across all sources. */
export type LedgerStatus = 'running' | 'verifying' | 'pending' | 'blocked' | 'done' | 'failed' | 'zombie' | 'idle';

/** One normalized unit of work in the ledger. */
export type LedgerEntry = {
  /** Stable, source-prefixed id, e.g. `team:<taskId>` or `cron:<jobId>`. */
  id: string;
  source: LedgerSource;
  title: string;
  status: LedgerStatus;
  /** Who is doing it: teammate slot, agent backend, or 'schedule'. */
  owner?: string;
  /** One-line context: team name, schedule summary, or last error. */
  detail?: string;
  /** Grouping context (team name / conversation title). */
  context?: string;
  /** Team: how many tasks block this one (0 when unblocked). */
  blockedByCount?: number;
  /** P2: epoch-ms of the last heartbeat from the running teammate (zombie detection). */
  lastHeartbeat?: number;
  /** P2: retry budget consumed so far (paired with retryBudget). */
  retriesUsed?: number;
  /** P2: total retry budget before a reclaim gives up. */
  retryBudget?: number;
  /** P3: verification verdict once the gate has run. */
  verdict?: 'pass' | 'fail';
  /** P3: task failed cross-audit twice and is parked for human review. */
  needsHuman?: boolean;
  /** Cron: epoch-ms of the next scheduled run. */
  nextRunAtMs?: number;
  /** Cron: status of the most recent run. */
  lastRunStatus?: 'ok' | 'error' | 'skipped' | 'missed';
  startedAt: number;
  updatedAt: number;
};

/** Aggregate counts for the header strip. */
export type LedgerCounts = {
  running: number;
  verifying: number;
  pending: number;
  blocked: number;
  failed: number;
  zombie: number;
  done: number;
  idle: number;
  total: number;
};

/** A point-in-time projection of all work. */
export type MissionControlSnapshot = {
  generatedAt: number;
  entries: LedgerEntry[];
  counts: LedgerCounts;
};
