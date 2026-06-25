/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Automatic model-discovery refresh scheduler (main process) - W0 skeleton.
 *
 * Wall-clock staleness, not interval-cadence: a 30-min poll whose only job is
 * `if isStale(now, lastRefreshedAt) → refreshAll('interval')`. This self-heals
 * across sleep / clock-jump, where a naive `setInterval(24h)` would not.
 *
 * W0 scaffolds the shared seam only: lifecycle method signatures, the fully
 * implemented `isStale` staleness helper, and the cadence constants. The poll /
 * launch / resume / single-flight / online-gate / backoff wiring and the real
 * `refreshAll` body land in W1 - they are `throw new Error('W1')` placeholders
 * here so the contract is callable and type-checked but not yet live.
 */

import { app, net, powerMonitor } from 'electron';
import type { IModelRegistryRefreshState, IModelRegistryRefreshSummary } from '@/common/adapter/ipcBridge';

/** A refresh trigger source, for logging / future telemetry. */
export type RefreshReason = 'manual' | 'launch' | 'interval' | 'resume';

/**
 * Injected collaborators. `runRefresh` is the real `handlers.refreshAllOnce`
 * core; the getters read the persisted `ProcessConfig` state; `isOnline` / `now`
 * are seams so the lifecycle is fully unit-testable without electron or timers.
 */
export type ModelRefreshSchedulerDeps = {
  runRefresh: () => Promise<IModelRegistryRefreshSummary>;
  getLastRefreshedAt: () => Promise<number | null>;
  getAutoRefresh: () => Promise<boolean>;
  isOnline?: () => boolean;
  now?: () => number;
};

/** Failure backoff ceiling - never wait longer than 6h between retry attempts. */
const MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;

/** Full re-discovery cadence: refresh when the catalog is older than 24h. */
export const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
/** Launch-if-stale threshold: a catalog older than 12h is refreshed on boot. */
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000;
/** Wall-clock poll interval: re-check staleness every 30 minutes. */
export const POLL_MS = 30 * 60 * 1000;

/**
 * Wall-clock staleness predicate. Pure - `now` and `lastRefreshedAt` are both
 * injected so unit tests can drive every boundary without real timers.
 *
 *  - `lastRefreshedAt == null` (never refreshed) → stale.
 *  - `now - lastRefreshedAt >= REFRESH_INTERVAL_MS` (24h elapsed) → stale.
 *  - `now < lastRefreshedAt` (clock moved backwards) → stale.
 *  - otherwise → fresh.
 */
export function isStale(now: number, lastRefreshedAt: number | null): boolean {
  if (lastRefreshedAt == null) return true;
  if (now < lastRefreshedAt) return true;
  return now - lastRefreshedAt >= REFRESH_INTERVAL_MS;
}

/** An idle (failed/online-gated) refresh summary that changed nothing. */
function emptySummary(lastRefreshedAt: number | null): IModelRegistryRefreshSummary {
  return { ok: false, succeeded: [], failed: [], added: [], lastRefreshedAt };
}

/**
 * Owns the auto-refresh lifecycle: a 30-min wall-clock staleness poll (self-heals
 * across sleep / clock-jump), a launch-if-stale kick, a `powerMonitor` resume
 * check, single-flight dedupe, an online gate, consecutive-failure backoff, and
 * a `before-quit` teardown. The catalog work itself is delegated to `runRefresh`.
 */
export class ModelRefreshScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private inflight: Promise<IModelRegistryRefreshSummary> | null = null;
  private lastRefreshedAt: number | null = null;
  private consecutiveFailures = 0;
  private lastAttemptAt: number | null = null;
  private hooksBound = false;

  constructor(private readonly deps: ModelRefreshSchedulerDeps) {}

  private now(): number {
    return (this.deps.now ?? Date.now)();
  }

  private online(): boolean {
    if (this.deps.isOnline) return this.deps.isOnline();
    try {
      return net.isOnline();
    } catch {
      return true; // never let an offline-probe failure permanently wedge refresh
    }
  }

  /**
   * Single-flight refresh. Concurrent callers (launch + interval + manual) share
   * one in-flight promise; the leader runs, the promise is cleared in `finally`
   * so a settled/rejected refresh never wedges future ones. Skipped while
   * offline. Tracks the freshness stamp + failure streak for backoff.
   */
  refreshAll(_reason: RefreshReason): Promise<IModelRegistryRefreshSummary> {
    if (this.inflight) return this.inflight;
    if (!this.online()) return Promise.resolve(emptySummary(this.lastRefreshedAt));

    this.lastAttemptAt = this.now();
    const p = this.deps
      .runRefresh()
      .then((summary) => {
        if (summary.lastRefreshedAt != null) this.lastRefreshedAt = summary.lastRefreshedAt;
        this.consecutiveFailures = summary.ok ? 0 : this.consecutiveFailures + 1;
        return summary;
      })
      .catch(() => {
        this.consecutiveFailures += 1;
        return emptySummary(this.lastRefreshedAt);
      })
      .finally(() => {
        this.inflight = null;
      });
    this.inflight = p;
    return p;
  }

  /** Begin polling + register launch / resume / quit hooks. No-op when auto-refresh is off. */
  async start(): Promise<void> {
    if (!(await this.deps.getAutoRefresh())) return;
    this.lastRefreshedAt = await this.deps.getLastRefreshedAt();

    if (!this.hooksBound) {
      // Electron's `app` / `powerMonitor` are undefined in the headless server
      // (bun, no Electron). Bind the lifecycle hooks only when present; the
      // interval poll below still drives auto-refresh in headless mode.
      if (typeof app?.on === 'function') app.on('before-quit', () => this.stop());
      if (typeof powerMonitor?.on === 'function') powerMonitor.on('resume', () => void this.maybeRefresh('resume'));
      this.hooksBound = true;
    }

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => void this.maybeRefresh('interval'), POLL_MS);
    this.timer.unref?.();

    void this.maybeRefresh('launch');
  }

  /** Refresh only when stale AND the failure-backoff window has elapsed. */
  private async maybeRefresh(reason: RefreshReason): Promise<void> {
    const now = this.now();
    if (this.consecutiveFailures > 0 && this.lastAttemptAt != null) {
      const backoff = Math.min(POLL_MS * 2 ** this.consecutiveFailures, MAX_BACKOFF_MS);
      if (now - this.lastAttemptAt < backoff) return;
    }
    if (isStale(now, this.lastRefreshedAt)) await this.refreshAll(reason);
  }

  /** Stop polling + clear the interval. An in-flight refresh is left to settle. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Current freshness + in-flight state for the Models settings header. */
  getState(): IModelRegistryRefreshState {
    return { lastRefreshedAt: this.lastRefreshedAt, refreshing: this.inflight != null };
  }
}
