// src/process/team/EventLogger.ts
//
// W1e - append-only writer for team_event_log.
//
// Every team-mutating surface (Mailbox.write, TaskManager.create/update,
// TeamSessionService.addAgent, TeammateManager.wake / token-usage stream)
// goes through this single helper so the wire format stays consistent and
// payload shape lives in one place rather than duplicated at each call site.
//
// Failures are swallowed-with-warning on purpose: event logging is observability,
// not correctness - a failed audit row must never break a user-visible op
// (mailbox write, task create, etc.).
//
// P1 - appends are moved OFF the hot path via an in-memory queue:
//   - non-token_usage events drain on a microtask, batched into one
//     transaction. The microtask (not a macrotask timer) preserves the
//     append-then-immediately-read ordering some call sites rely on.
//   - token_usage events are COALESCED per (teamId, actorSlotId) on a short
//     timer: the ACP gauge is cumulative, so we keep only the latest snapshot
//     per window while SUMMING the per-event deltas (tokens_delta / cost_delta),
//     which is exactly what the cost meter sums - collapsing the per-token write
//     storm to ~one row per window per agent without changing the meter total.
// flush() drains everything synchronously (dispose/stop) so nothing is lost.
import type { ITeamEventRepository } from './repository/ITeamRepository';
import type { TeamEvent, TeamEventType } from './types';

export type AppendEventInput = {
  teamId: string;
  eventType: TeamEventType;
  actorSlotId?: string;
  targetSlotId?: string;
  payload: Record<string, unknown>;
};

/** One queued event plus the waiters to resolve once it is persisted. */
type QueuedEvent = { event: TeamEvent; resolvers: Array<() => void> };

/** Coalescing window (ms) for cumulative token_usage rows. */
const TOKEN_USAGE_COALESCE_MS = 250;

export class EventLogger {
  /** Non-token_usage events pending a microtask drain. */
  private readonly queue: QueuedEvent[] = [];
  private microtaskScheduled = false;
  /** Coalesced token_usage events, keyed by `${teamId}|${actorSlotId}`. */
  private readonly tokenUsagePending = new Map<string, QueuedEvent>();
  private tokenUsageTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly repo: ITeamEventRepository) {}

  /**
   * Best-effort append. Generates id + timestamp and enqueues the row; the
   * returned promise resolves once the row's batch is flushed (errors are logged
   * but never propagated - the caller's success must not depend on the audit
   * row). Callers may `void` it (fire-and-forget) or `await` it.
   */
  append(input: AppendEventInput): Promise<void> {
    const event: TeamEvent = {
      id: crypto.randomUUID(),
      teamId: input.teamId,
      eventType: input.eventType,
      actorSlotId: input.actorSlotId,
      targetSlotId: input.targetSlotId,
      payload: input.payload,
      createdAt: Date.now(),
    };

    return new Promise<void>((resolve) => {
      if (input.eventType === 'token_usage') {
        this.enqueueTokenUsage(event, resolve);
      } else {
        this.queue.push({ event, resolvers: [resolve] });
        this.scheduleMicrotaskDrain();
      }
    });
  }

  /**
   * Flush everything now and wait for it to persist. Call on dispose/stop so no
   * queued or coalesced event is lost at shutdown.
   */
  async flush(): Promise<void> {
    if (this.tokenUsageTimer) {
      clearTimeout(this.tokenUsageTimer);
      this.tokenUsageTimer = undefined;
    }
    this.microtaskScheduled = false;
    const items = [...this.queue.splice(0), ...this.tokenUsagePending.values()];
    this.tokenUsagePending.clear();
    await this.drain(items);
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private enqueueTokenUsage(event: TeamEvent, resolve: () => void): void {
    const key = `${event.teamId}|${event.actorSlotId ?? ''}`;
    const existing = this.tokenUsagePending.get(key);
    if (existing) {
      existing.event = mergeCumulativeTokenUsage(existing.event, event);
      existing.resolvers.push(resolve);
    } else {
      this.tokenUsagePending.set(key, { event, resolvers: [resolve] });
    }
    if (!this.tokenUsageTimer) {
      this.tokenUsageTimer = setTimeout(() => {
        this.tokenUsageTimer = undefined;
        const items = [...this.tokenUsagePending.values()];
        this.tokenUsagePending.clear();
        void this.drain(items);
      }, TOKEN_USAGE_COALESCE_MS);
    }
  }

  private scheduleMicrotaskDrain(): void {
    if (this.microtaskScheduled) return;
    this.microtaskScheduled = true;
    queueMicrotask(() => {
      this.microtaskScheduled = false;
      const items = this.queue.splice(0);
      void this.drain(items);
    });
  }

  private async drain(items: QueuedEvent[]): Promise<void> {
    if (items.length === 0) return;
    const events = items.map((i) => i.event);
    try {
      if (this.repo.appendEvents) {
        await this.repo.appendEvents(events);
      } else {
        for (const event of events) {
          await this.repo.appendEvent(event);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[EventLogger] Failed to append ${events.length} event(s): ${message}`);
    } finally {
      for (const item of items) {
        for (const resolve of item.resolvers) resolve();
      }
    }
  }
}

/**
 * Merge two cumulative token_usage events (same agent session). The ACP gauge is
 * a running session total, so the LATEST snapshot fields win; the per-event
 * spend DELTAS are summed so the collapsed row carries the total spend of the
 * window (the cost meter sums tokens_delta / cost_delta across rows).
 */
function mergeCumulativeTokenUsage(existing: TeamEvent, incoming: TeamEvent): TeamEvent {
  const sum = (a: unknown, b: unknown): number => (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0);
  return {
    ...incoming,
    id: existing.id,
    payload: {
      ...incoming.payload,
      tokens_delta: sum(existing.payload.tokens_delta, incoming.payload.tokens_delta),
      cost_delta: sum(existing.payload.cost_delta, incoming.payload.cost_delta),
    },
  };
}
