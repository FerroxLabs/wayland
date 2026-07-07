// src/renderer/hooks/team/useTeamCostMeter.ts
//
// W2d - Per-team token + USD cost rollup over a sliding time window.
// Polls `ipcBridge.team.listEvents` (W1e) filtered to
// `event_type='token_usage'` every 30 seconds and aggregates the totals
// the sidebar Active section needs.
//
// === Upstream row shapes to know about (DESK-1) ===
//
// The source `acp_context_usage` event is a CUMULATIVE session gauge -
// `used` is "total tokens currently in context", re-sent on every update,
// and `cost` is the cumulative session cost. Summing those snapshots
// grossly inflates the meter, so:
//
// 1. New rows (delta-aware writer in TeammateManager) carry per-event
//    spend deltas as `tokens_delta` / `cost_delta` alongside the raw
//    snapshot fields. Deltas are safe to SUM - that is all we sum.
//
// 2. Legacy rows without the delta fields hold a cumulative snapshot in
//    `prompt_tokens`/`completion_tokens`/`cost_estimate_usd`. A snapshot
//    IS that actor's session total, so we keep only the NEWEST such row
//    per actor (actor_slot_id) as an approximation of that actor's total.
//    Snapshots are never summed across events.
//
// 3. `WHERE created_at > ?` strict inequality. The W1e listEvents reader
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

type LegacySnapshot = { tokens: number; usd: number; createdAt: number };

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
  /** Running sum of the delta-aware rows' `tokens_delta` / `cost_delta`. */
  const deltaTokensRef = useRef(0);
  const deltaUsdRef = useRef(0);
  /** Newest legacy (snapshot-only) row per actor - never summed per-event. */
  const legacySnapshotsRef = useRef<Map<string, LegacySnapshot>>(new Map());

  useEffect(() => {
    if (!teamId) return;

    // Reset accumulators + cursor when teamId / window changes so we never
    // bleed one team's totals into another.
    let cancelled = false;
    cursorRef.current = Date.now() - windowMs;
    deltaTokensRef.current = 0;
    deltaUsdRef.current = 0;
    legacySnapshotsRef.current = new Map();
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

        let maxCreatedAt = since;
        for (const e of events) {
          const p = (e.payload ?? {}) as Record<string, unknown>;
          const tokensDelta = typeof p.tokens_delta === 'number' ? p.tokens_delta : undefined;
          const costDelta = typeof p.cost_delta === 'number' ? p.cost_delta : undefined;
          if (tokensDelta !== undefined || costDelta !== undefined) {
            // Delta-aware row: per-event spend, safe to sum.
            deltaTokensRef.current += tokensDelta ?? 0;
            deltaUsdRef.current += costDelta ?? 0;
          } else {
            // Legacy row: fields are a CUMULATIVE session snapshot. The
            // newest snapshot per actor approximates that actor's session
            // total - never sum snapshots across events.
            const prompt = typeof p.prompt_tokens === 'number' ? p.prompt_tokens : 0;
            const completion = typeof p.completion_tokens === 'number' ? p.completion_tokens : 0;
            const usd = typeof p.cost_estimate_usd === 'number' ? p.cost_estimate_usd : 0;
            const actor = typeof p.slot_id === 'string' && p.slot_id ? p.slot_id : (e.actorSlotId ?? 'unknown');
            const existing = legacySnapshotsRef.current.get(actor);
            if (!existing || e.createdAt >= existing.createdAt) {
              legacySnapshotsRef.current.set(actor, { tokens: prompt + completion, usd, createdAt: e.createdAt });
            }
          }
          if (e.createdAt > maxCreatedAt) maxCreatedAt = e.createdAt;
        }
        cursorRef.current = maxCreatedAt;

        let tokens = deltaTokensRef.current;
        let usd = deltaUsdRef.current;
        for (const snap of legacySnapshotsRef.current.values()) {
          tokens += snap.tokens;
          usd += snap.usd;
        }
        setTotalTokens(tokens);
        setTotalUsd(usd);
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
