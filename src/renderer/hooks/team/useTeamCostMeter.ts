// src/renderer/hooks/team/useTeamCostMeter.ts
//
// W2d - Per-team token + USD cost rollup over a sliding time window.
// Polls `ipcBridge.team.listEvents` (W1e) filtered to
// `event_type='token_usage'` every 30 seconds and aggregates the totals
// the sidebar Active section needs.
//
// === Two upstream conventions to know about ===
//
// 1. Total-tokens shape. W1e currently writes
//      `{ prompt_tokens: usage.used, completion_tokens: 0,
//         cost_estimate_usd: number, ... }`
//    where `usage.used` is actually the *total* (prompt + completion) from
//    the source `acp_context_usage` event, not a prompt-only count.
//    For W2d we treat `prompt_tokens + completion_tokens` as the total
//    tokens, which works under both the current convention (total + 0)
//    and any future fix that splits them honestly. Only the aggregation
//    below needs to change if the upstream shape ever changes.
//
// 2. `WHERE created_at > ?` strict inequality. The W1e listEvents reader
//    excludes rows tied to the cursor timestamp. At a 30s polling cadence
//    on a cost-meter (rough-estimate, not penny-accurate) this is fine;
//    we lose at most sibling same-millisecond events on a hot burst,
//    which would change a rollup by sub-cent amounts.
//
// === Cursor strategy ===
// We keep a `since` cursor of the most recent createdAt we've seen and
// accumulate the running totals across polls instead of refetching the
// whole 7-day window every 30s. A teamId / window change resets the
// cursor + totals from scratch.

import { useEffect, useRef, useState } from 'react';
import { ipcBridge } from '@/common';

export type TeamCostMeterResult = {
  totalTokens: number;
  totalUsd: number;
  isLoading: boolean;
};

const DEFAULT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_POLL_MS = 30_000;
const FETCH_LIMIT = 1000;

type Options = {
  /** Sliding window length in ms (default: 7 days). */
  windowMs?: number;
  /** Polling cadence in ms (default: 30s). Lowered in tests. */
  pollIntervalMs?: number;
};

/**
 * Polls `team_event_log` `token_usage` rows for `teamId` and returns the
 * accumulated `totalTokens` + `totalUsd` over the sliding window.
 */
export function useTeamCostMeter(teamId: string, opts: Options = {}): TeamCostMeterResult {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const pollIntervalMs = opts.pollIntervalMs ?? DEFAULT_POLL_MS;

  const [totalTokens, setTotalTokens] = useState(0);
  const [totalUsd, setTotalUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const cursorRef = useRef<number>(0);

  useEffect(() => {
    if (!teamId) return;

    // Reset accumulators + cursor when teamId / window changes so we never
    // bleed one team's totals into another.
    let cancelled = false;
    cursorRef.current = Date.now() - windowMs;
    setTotalTokens(0);
    setTotalUsd(0);
    setIsLoading(true);

    const poll = async (): Promise<void> => {
      const since = cursorRef.current;
      try {
        const events = await ipcBridge.team.listEvents.invoke({
          teamId,
          since,
          limit: FETCH_LIMIT,
          eventType: 'token_usage',
        });
        if (cancelled) return;
        if (!Array.isArray(events) || events.length === 0) {
          setIsLoading(false);
          return;
        }

        let tokensDelta = 0;
        let usdDelta = 0;
        let maxCreatedAt = since;
        for (const e of events) {
          const p = (e.payload ?? {}) as Record<string, unknown>;
          const prompt = typeof p.prompt_tokens === 'number' ? p.prompt_tokens : 0;
          const completion = typeof p.completion_tokens === 'number' ? p.completion_tokens : 0;
          const cost = typeof p.cost_estimate_usd === 'number' ? p.cost_estimate_usd : 0;
          tokensDelta += prompt + completion;
          usdDelta += cost;
          if (e.createdAt > maxCreatedAt) maxCreatedAt = e.createdAt;
        }
        cursorRef.current = maxCreatedAt;
        setTotalTokens((prev) => prev + tokensDelta);
        setTotalUsd((prev) => prev + usdDelta);
        setIsLoading(false);
      } catch (error) {
        // Cost meter is best-effort - a single failed poll shouldn't tear
        // down the sidebar. Next tick retries.
        console.warn('[useTeamCostMeter] poll failed', error);
        setIsLoading(false);
      }
    };

    void poll();
    const id = setInterval(() => void poll(), pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [teamId, windowMs, pollIntervalMs]);

  return { totalTokens, totalUsd, isLoading };
}
