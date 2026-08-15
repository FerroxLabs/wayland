/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Wayland Nano's cost-metering notifications.
 *
 * Nano originally put these on `session/update` as `sessionUpdate: 'budget'`.
 * The ACP SDK validates that notification against a fixed union before it
 * dispatches, so the frame was rejected with `-32602 Invalid params` and the
 * metering data never reached Desktop at all - every turn logged an error and
 * the P1 pack was invisible.
 *
 * Nano moved them to EXT notifications (`_wayland/session/*`), which the SDK
 * routes through `extNotification` with NO schema validation. That is the whole
 * point of the change: the host, not the SDK, decides what a vendor extension
 * means. Which means the host has to do the validating - hence this module.
 *
 * Contract as published by the Nano side (flattened; no `update` wrapper):
 *   _wayland/session/budget       {sessionId, session_tokens, microcents, priced, limit, observed}
 *   _wayland/session/budget-warn  {sessionId, limit, observed, pct_used}
 *   _wayland/session/budget-clamp {sessionId, requested, granted}
 */

export const NANO_BUDGET_METHOD = '_wayland/session/budget';
export const NANO_BUDGET_WARN_METHOD = '_wayland/session/budget-warn';
export const NANO_BUDGET_CLAMP_METHOD = '_wayland/session/budget-clamp';

/** Every ext method this module claims. Anything else is not ours. */
export const NANO_BUDGET_METHODS: readonly string[] = [
  NANO_BUDGET_METHOD,
  NANO_BUDGET_WARN_METHOD,
  NANO_BUDGET_CLAMP_METHOD,
];

export type NanoBudgetEvent =
  | {
      kind: 'budget';
      sessionId: string;
      /** Cumulative tokens for the session. */
      sessionTokens: number;
      /** Cost in micro-cents. Only meaningful when `priced` is true. */
      microcents: number;
      /** False when the model has no pricing - cost is UNKNOWN, not zero. */
      priced: boolean;
      /** Configured ceiling, or null when unlimited. */
      limit: number | null;
      /** Consumption against the ceiling, or null when not tracked. */
      observed: number | null;
    }
  | { kind: 'budget_warn'; sessionId: string; limit: number | null; observed: number | null; pctUsed: number }
  | { kind: 'budget_clamp'; sessionId: string; requested: number; granted: number };

/**
 * Render a budget event's cost, honouring Nano's stated honesty rule.
 *
 * `priced: false` means the meter has NO pricing for this model, so the cost
 * figure is not real. It must read as unpriced and never as `$0.000` — the
 * difference between "this turn was free" and "we do not know what this cost".
 * The Nano side calls a rendered zero on an unpriced turn an integration bug,
 * so the only safe place for that rule is here, where every consumer has to
 * come through it, rather than in each call site that formats a number.
 *
 * Mirrors the wcore wording already used for the same situation ("cost is
 * unpriced, not $0").
 */
export function formatNanoBudgetCost(event: NanoBudgetEvent): string {
  if (event.kind !== 'budget' || !event.priced) return 'unpriced';
  // microcents = 1e-6 of a cent, so 1e8 microcents is one dollar.
  return `$${(event.microcents / 100_000_000).toFixed(4)}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** A finite number, or `fallback`. Rejects NaN/Infinity, which JSON can carry as null. */
function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A finite number or null. `null` is MEANINGFUL here (unlimited / untracked). */
function nullableNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Parse a Nano budget ext notification, or return null.
 *
 * Returns null - never throws - for a method we do not own and for a malformed
 * payload alike. A notification is fire-and-forget: there is no caller to
 * report a parse failure to, and throwing inside the SDK's notification
 * handler is exactly the failure mode that started all this.
 *
 * `sessionId` is the one required field. Without it the event names no session
 * and cannot be attributed, so it is dropped rather than guessed at.
 */
export function parseNanoBudgetNotification(method: string, params: unknown): NanoBudgetEvent | null {
  if (!NANO_BUDGET_METHODS.includes(method)) return null;
  if (!isObject(params)) return null;

  const sessionId = str(params.sessionId);
  if (sessionId === null) return null;

  switch (method) {
    case NANO_BUDGET_METHOD:
      return {
        kind: 'budget',
        sessionId,
        sessionTokens: num(params.session_tokens, 0),
        microcents: num(params.microcents, 0),
        // Absent `priced` means NOT priced. Defaulting the other way would let a
        // missing field report a real cost of zero.
        priced: params.priced === true,
        limit: nullableNum(params.limit),
        observed: nullableNum(params.observed),
      };
    case NANO_BUDGET_WARN_METHOD:
      return {
        kind: 'budget_warn',
        sessionId,
        limit: nullableNum(params.limit),
        observed: nullableNum(params.observed),
        pctUsed: num(params.pct_used, 0),
      };
    case NANO_BUDGET_CLAMP_METHOD:
      return {
        kind: 'budget_clamp',
        sessionId,
        requested: num(params.requested, 0),
        granted: num(params.granted, 0),
      };
    default:
      return null;
  }
}
