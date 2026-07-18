/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/** Canonical, sealed provenance. Similar names from different runtimes are not equivalent. */
export type ActivityProvenance =
  | { origin: 'desktop'; kind: 'team' | 'workflow' | 'schedule' | 'schedule-run' | 'approval' }
  | { origin: 'core'; kind: 'turn' | 'sub-agent' | 'workflow' | 'approval' };

export type LedgerSource = 'desktop-teams' | 'desktop-workflows' | 'scheduler' | 'core-execution' | 'approvals';

export type ActivityGroup = 'needs-you' | 'running' | 'upcoming' | 'recent';

/** `unknown` is intentional: absence of authoritative progress is not "running". */
export type LedgerStatus =
  'running' | 'verifying' | 'pending' | 'blocked' | 'done' | 'failed' | 'zombie' | 'idle' | 'unknown';

export type ActivityDestination = {
  kind: 'navigate';
  path: string;
  label: string;
};

export type LedgerEntry = {
  /** Stable identity: `<origin>:<kind>:<source id>`. */
  id: string;
  sourceId: string;
  source: LedgerSource;
  provenance: ActivityProvenance;
  group: ActivityGroup;
  title: string;
  status: LedgerStatus;
  action: ActivityDestination;
  owner?: string;
  detail?: string;
  context?: string;
  blockedByCount?: number;
  lastHeartbeat?: number;
  retriesUsed?: number;
  retryBudget?: number;
  verdict?: 'pass' | 'fail';
  needsHuman?: boolean;
  nextRunAtMs?: number;
  lastRunStatus?: 'ok' | 'error' | 'skipped' | 'missed';
  startedAt: number;
  updatedAt: number;
};

/** Input accepted from canonical runtime projectors before identity/grouping are derived. */
export type ActivityObservation = Omit<LedgerEntry, 'id' | 'source' | 'group'>;

export type LedgerCounts = Record<LedgerStatus, number> & { total: number };
export type ActivityGroupCounts = Record<ActivityGroup, number>;

export type ActivitySourceHealth = {
  source: LedgerSource;
  status: 'ok' | 'partial' | 'error' | 'unavailable';
  observedAt: number;
  detail?: string;
};

export type MissionControlSnapshot = {
  generatedAt: number;
  entries: LedgerEntry[];
  counts: LedgerCounts;
  groupCounts: ActivityGroupCounts;
  /** Never omitted: the UI must distinguish true empty from an incomplete projection. */
  sourceHealth: ActivitySourceHealth[];
  completeness: 'complete' | 'partial' | 'unavailable';
};
