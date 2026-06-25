/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CostAnalyticsService } from './CostAnalyticsService';
import type {
  Budget,
  BudgetAlert,
  BudgetBreach,
  BudgetGateResult,
  BudgetInput,
  BudgetPeriod,
  BudgetScope,
  BudgetStatus,
  CostWindow,
  IBudgetRepository,
} from './types';

/** Context the turn-start path passes to canStartTurn. */
export type TurnScopeContext = {
  modelId?: string;
  backend?: string;
  teamId?: string;
};

/**
 * Start of the rolling period that `at` falls in, in local time. Day = midnight
 * today; week = midnight on the most recent Monday; month = midnight on the 1st.
 * Local time so a user's "daily" budget matches their calendar day.
 */
export function periodStart(period: BudgetPeriod, at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  if (period === 'day') return d.getTime();
  if (period === 'week') {
    // getDay(): 0=Sun..6=Sat. Shift so Monday is the first day of the week.
    const dow = d.getDay();
    const daysSinceMonday = (dow + 6) % 7;
    d.setDate(d.getDate() - daysSinceMonday);
    return d.getTime();
  }
  // month
  d.setDate(1);
  return d.getTime();
}

function randomId(): string {
  return `bgt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Owns budget CRUD + period-spend evaluation + non-blocking enforcement.
 *
 * Spend is resolved through CostAnalyticsService over the current period
 * window, scoped by the budget's dimension: global => summary; model/backend/
 * team => the matching aggregate key. Enforcement is warn-default: when a turn
 * pushes a 'warn' budget over its limit, `checkAfterTurn` emits a one-time
 * non-blocking BudgetAlert via the injected emitter (the recording path calls
 * it post-turn). 'pause' budgets are opt-in and consulted by `canStartTurn`;
 * a pause is a RESUMABLE state (raising the limit or a new period clears it) -
 * never a hard lock.
 */
export class BudgetController {
  /** Budget ids already alerted this period, keyed by `${id}:${periodStartMs}`. */
  private readonly alerted = new Set<string>();

  constructor(
    private readonly repo: IBudgetRepository,
    private readonly analytics: CostAnalyticsService,
    /** Emits a one-time over-budget warn notification to the renderer. */
    private readonly emitAlert: (alert: BudgetAlert) => void,
    private readonly now: () => number = () => Date.now()
  ) {}

  upsert(input: BudgetInput): Budget {
    const ts = this.now();
    const existing = input.id ? this.repo.getById(input.id) : undefined;
    const budget: Budget = {
      id: input.id ?? randomId(),
      scope: input.scope,
      scopeKey: input.scope === 'global' ? undefined : input.scopeKey,
      limitUsd: input.limitUsd,
      period: input.period,
      action: input.action,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
    };
    this.repo.upsert(budget);
    // A changed budget may clear a prior alert (new limit/period); reset its
    // one-time alert latch so the next breach can notify again.
    this.clearAlertLatch(budget.id);
    return budget;
  }

  remove(id: string): void {
    this.repo.delete(id);
    this.clearAlertLatch(id);
  }

  /** All budgets with their current-period spend, for the UI progress bars. */
  listStatus(): BudgetStatus[] {
    const at = this.now();
    return this.repo.list().map((b) => {
      const start = periodStart(b.period, at);
      return {
        ...b,
        spentUsd: this.spend(b, start, at),
        periodStartMs: start,
      };
    });
  }

  /** Budgets whose current-period spend is at or over their limit. */
  evaluate(): { warn: BudgetBreach[]; pause: BudgetBreach[] } {
    const at = this.now();
    const warn: BudgetBreach[] = [];
    const pause: BudgetBreach[] = [];
    for (const b of this.repo.list()) {
      const start = periodStart(b.period, at);
      const spentUsd = this.spend(b, start, at);
      if (spentUsd >= b.limitUsd) {
        const breach: BudgetBreach = { budget: b, spentUsd, periodStartMs: start };
        (b.action === 'pause' ? pause : warn).push(breach);
      }
    }
    return { warn, pause };
  }

  /**
   * Pre-turn gate (opt-in). The send/turn-start path MAY consult this; when a
   * 'pause' budget matching the scope context is already over its limit, the
   * turn is blocked (allowed:false) until the period rolls over or the user
   * raises the limit. 'warn' budgets never block. Default => allowed:true.
   */
  canStartTurn(ctx: TurnScopeContext): BudgetGateResult {
    const at = this.now();
    for (const b of this.repo.list()) {
      if (b.action !== 'pause') continue;
      if (!this.matchesScope(b, ctx)) continue;
      const start = periodStart(b.period, at);
      const spentUsd = this.spend(b, start, at);
      if (spentUsd >= b.limitUsd) {
        return { allowed: false, budget: b, spentUsd };
      }
    }
    return { allowed: true };
  }

  /**
   * Post-turn enforcement for 'warn' budgets (non-blocking). The recording path
   * calls this after a turn finishes; for each 'warn' budget that the just-ended
   * turn pushed over its limit, emit a one-time BudgetAlert this period. Pause
   * budgets are handled by canStartTurn, not here.
   */
  checkAfterTurn(ctx: TurnScopeContext): void {
    const at = this.now();
    for (const b of this.repo.list()) {
      if (b.action !== 'warn') continue;
      if (!this.matchesScope(b, ctx)) continue;
      const start = periodStart(b.period, at);
      const spentUsd = this.spend(b, start, at);
      if (spentUsd < b.limitUsd) continue;
      const latch = this.latchKey(b.id, start);
      if (this.alerted.has(latch)) continue;
      this.alerted.add(latch);
      this.emitAlert({
        budgetId: b.id,
        scope: b.scope,
        scopeKey: b.scopeKey,
        limitUsd: b.limitUsd,
        spentUsd,
        period: b.period,
      });
    }
  }

  /** Spend for one budget over [start, at), scoped by its dimension. */
  private spend(b: Budget, start: number, at: number): number {
    const window: CostWindow = { fromMs: start, toMs: at + 1 };
    if (b.scope === 'global') return this.analytics.summary(window).costUsd;
    const key = b.scopeKey ?? '';
    const rows = this.aggregateFor(b.scope, window);
    const match = rows.find((r) => r.key === key);
    return match?.costUsd ?? 0;
  }

  private aggregateFor(scope: Exclude<BudgetScope, 'global'>, window: CostWindow) {
    if (scope === 'model') return this.analytics.byModel(window);
    if (scope === 'backend') return this.analytics.byBackend(window);
    return this.analytics.byTeam(window);
  }

  private matchesScope(b: Budget, ctx: TurnScopeContext): boolean {
    if (b.scope === 'global') return true;
    if (b.scope === 'model') return !!ctx.modelId && ctx.modelId === b.scopeKey;
    if (b.scope === 'backend') return !!ctx.backend && ctx.backend === b.scopeKey;
    return !!ctx.teamId && ctx.teamId === b.scopeKey;
  }

  private latchKey(id: string, periodStartMs: number): string {
    return `${id}:${periodStartMs}`;
  }

  private clearAlertLatch(id: string): void {
    for (const key of this.alerted) {
      if (key.startsWith(`${id}:`)) this.alerted.delete(key);
    }
  }
}

let singleton: BudgetController | undefined;

/** Install the process-wide BudgetController. Called once from initBridge. */
export function setBudgetController(controller: BudgetController): void {
  singleton = controller;
}

/**
 * Get the process-wide BudgetController, or undefined before it is wired. The
 * turn-start path consults this for the pre-turn pause gate (canStartTurn).
 */
export function getBudgetController(): BudgetController | undefined {
  return singleton;
}
