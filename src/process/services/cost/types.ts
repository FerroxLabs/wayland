/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * How a cost figure was derived for a single recorded turn.
 *  - 'engine'   the backend reported a per-conversation cumulative dollar
 *               figure (ACP usage_update). We store the per-turn DELTA.
 *  - 'computed' we priced a per-turn input/output token split via ModelPricing.
 *  - 'unknown'  no usable cost or price was available; cost_usd is 0 and we
 *               still record any token counts we have.
 */
export type CostSource = 'engine' | 'computed' | 'unknown';

/**
 * One persisted row in the cost_events table (migration_v48). NO foreign keys.
 * `tokensTotal`/`costUsd` are the per-turn values after delta resolution.
 */
export type CostEvent = {
  id: number;
  conversationId: string;
  backend: string;
  modelId?: string;
  costUsd: number;
  tokensTotal: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  costSource: CostSource;
  cronId?: string;
  teamId?: string;
  createdAt: number;
};

/**
 * Shape inserted by the CostRecorder. `id`/`createdAt` are assigned at insert
 * time when not provided, mirroring the autoincrement + ms-epoch convention of
 * the existing repositories.
 */
export type CostEventInput = {
  conversationId: string;
  backend: string;
  modelId?: string;
  costUsd: number;
  tokensTotal: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  costSource: CostSource;
  cronId?: string;
  teamId?: string;
  createdAt: number;
};

/**
 * Aggregate row used by the analytics service (WS-D). `key` is the grouped
 * dimension value (model id, backend, conversation id, or team id); `null`
 * keys collapse to the empty string so callers can render an "unattributed"
 * bucket without losing the total.
 */
export type CostAggregate = {
  key: string;
  costUsd: number;
  tokensTotal: number;
  events: number;
};

/**
 * One bucket of a time series over cost_events, aligned to a fixed-width
 * window (the bucket start in ms-epoch). Used to drive the trend chart.
 */
export type CostSeriesPoint = {
  bucketStart: number;
  costUsd: number;
  tokensTotal: number;
  events: number;
};

/** Inclusive-from, exclusive-to time window in ms-epoch. */
export type CostWindow = {
  fromMs: number;
  toMs: number;
};

/** Window total returned by CostAnalyticsService.summary / repo.total. */
export type CostSummary = {
  costUsd: number;
  tokensTotal: number;
  events: number;
};

/** Dimension the analytics service can group cost_events by. */
export type CostGroupBy = 'model_id' | 'backend' | 'conversation_id' | 'team_id';

// ===================== Budgets (Stage 1 / WS-F) =====================

/** Dimension a budget caps spend on. `global` ignores scopeKey. */
export type BudgetScope = 'global' | 'model' | 'backend' | 'team';

/** Rolling period a budget's limit applies over. */
export type BudgetPeriod = 'day' | 'week' | 'month';

/**
 * What happens when period spend crosses the limit.
 *  - 'warn'  non-blocking one-time renderer notification (default).
 *  - 'pause' opt-in resumable gate; the turn-start path MAY consult
 *            BudgetController.canStartTurn before starting a turn.
 */
export type BudgetAction = 'warn' | 'pause';

/** One persisted budget row (migration_v49). NO foreign keys. */
export type Budget = {
  id: string;
  scope: BudgetScope;
  /** Bound dimension value (model id / backend / team id). Omitted for global. */
  scopeKey?: string;
  limitUsd: number;
  period: BudgetPeriod;
  action: BudgetAction;
  createdAt: number;
  updatedAt: number;
};

/**
 * A budget plus its current-period spend, returned by listBudgets so the UI
 * can render progress bars without a second round-trip.
 */
export type BudgetStatus = Budget & {
  spentUsd: number;
  periodStartMs: number;
};

/** Upsert payload. `id` absent => create; present => update in place. */
export type BudgetInput = {
  id?: string;
  scope: BudgetScope;
  scopeKey?: string;
  limitUsd: number;
  period: BudgetPeriod;
  action: BudgetAction;
};

/** A budget whose current-period spend is at or over its limit. */
export type BudgetBreach = {
  budget: Budget;
  spentUsd: number;
  periodStartMs: number;
};

/** Result of a pre-turn budget gate check. */
export type BudgetGateResult = {
  allowed: boolean;
  /** The pause budget that blocked the turn, when allowed is false. */
  budget?: Budget;
  spentUsd?: number;
};

/** Renderer-facing payload for the one-time over-budget warn notification. */
export type BudgetAlert = {
  budgetId: string;
  scope: BudgetScope;
  scopeKey?: string;
  limitUsd: number;
  spentUsd: number;
  period: BudgetPeriod;
};

/**
 * Renderer-facing payload when a 'pause' budget blocks a turn before it starts
 * (the runaway circuit-breaker Phase 1). Carries the held message so the
 * renderer can re-send it after the user raises the cap, and the budget figures
 * so the resumable card can show "spent X of Y this period".
 */
export type BudgetGateBlocked = {
  conversationId: string;
  /** The user message that was held (not yet dispatched to the agent). */
  content: string;
  files?: string[];
  budgetId: string;
  scope: BudgetScope;
  scopeKey?: string;
  limitUsd: number;
  spentUsd: number;
  period: BudgetPeriod;
};

/** CRUD over the budgets table (migration_v49). Synchronous, like the cost repo. */
export interface IBudgetRepository {
  /** Insert or replace one budget row. */
  upsert(budget: Budget): void;
  /** Delete the budget with the given id. Returns rows removed (0 or 1). */
  delete(id: string): number;
  /** All budgets, newest first. */
  list(): Budget[];
  /** A single budget by id, or undefined if absent. */
  getById(id: string): Budget | undefined;
}

export interface ICostRepository {
  /** Insert one cost_event row. Returns the assigned autoincrement id. */
  insert(event: CostEventInput): number;
  /**
   * Sum cost + tokens grouped by the given dimension within a window,
   * ordered by cost descending. Covers byModel/byBackend/byConversation/byTeam.
   */
  aggregate(groupBy: CostGroupBy, window: CostWindow): CostAggregate[];
  /** Fixed-width time-bucketed series over a window. `bucketMs` > 0. */
  series(window: CostWindow, bucketMs: number): CostSeriesPoint[];
  /** Total cost + tokens + row count within a window. */
  total(window: CostWindow): { costUsd: number; tokensTotal: number; events: number };
  /**
   * Delete rows older than the supplied cutoff (epoch ms). Returns the number
   * of rows removed. Mirrors SqliteUsageEventRepository.prune for bounded
   * growth on long-lived installs.
   */
  prune(cutoffMs: number): number;
}
