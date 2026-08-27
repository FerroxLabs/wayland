/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #1045 - how long an UNATTENDED run may sit on a held tool call.
 *
 * A held permission request in a scheduled run had no end. `PermissionResolver`
 * stored the pending promise, recorded `createdAt` and never read it again, so
 * the only ways out were a human decision or teardown. `CronBusyGuard` keeps that
 * conversation marked busy for the whole time, and its own cleanup does not sweep
 * a stale entry until it is an hour old - so ONE unanswered prompt could eat an
 * hour of that conversation's schedule.
 *
 * The shape of the answer is the industry-standard one for a human-in-the-loop
 * gate, and all three parts matter: bound the wait, fail CLOSED when it expires,
 * leave a record. GitHub Actions environment protection rules REJECT on expiry,
 * GitLab manual jobs block, AWS Step Functions human-approval tasks FAIL, the
 * OAuth 2.0 device grant denies an expired user code, and a Kubernetes admission
 * webhook's safe `failurePolicy` is `Fail`. None of them auto-approve. An expiry
 * is the ABSENCE of a decision, never a permissive one.
 *
 * ATTENDED runs are not affected and get no deadline at all: a person sitting in
 * front of the app is the thing being waited on, and there is nothing to time
 * out. Only the scheduled-run path supplies a deadline.
 */

/**
 * The deadline when nothing sooner constrains it.
 *
 * Fifteen minutes: long enough that a user who happens to be nearby can still
 * answer, and comfortably inside {@link UNATTENDED_HOLD_CEILING_MS}.
 */
export const UNATTENDED_HOLD_DEFAULT_MS = 15 * 60_000;

/**
 * Hard ceiling, under `CronBusyGuard.cleanup`'s one-hour `olderThanMs`. A hold
 * that outlived that sweep would be a run the busy guard has already forgotten
 * about while the promise it belongs to is still pending.
 */
export const UNATTENDED_HOLD_CEILING_MS = 55 * 60_000;

/**
 * Headroom between the deadline and the next scheduled run, so the denial, the
 * turn teardown and `setProcessing(false)` all complete before the next fire
 * rather than racing it.
 *
 * Capped at half the remaining interval, so the guarantee "the deadline is
 * strictly before the next run" holds for a one-minute schedule as well as a
 * daily one.
 */
export const UNATTENDED_HOLD_NEXT_RUN_MARGIN_MS = 30_000;

/**
 * Resolve the deadline for a hold in an unattended run.
 *
 * INVARIANT, asserted directly by the tests: when `nextRunAtMs` is in the future,
 * the result is strictly less than `nextRunAtMs - nowMs`. That is the whole point
 * - a single hold must never be able to eat the run that follows it.
 *
 * `nextRunAtMs` absent (a one-shot job, or a schedule whose next fire is not yet
 * known) means only the default and the ceiling apply.
 */
export function resolveUnattendedHoldMs(input: { nowMs: number; nextRunAtMs?: number }): number {
  const base = Math.min(UNATTENDED_HOLD_DEFAULT_MS, UNATTENDED_HOLD_CEILING_MS);
  const { nowMs, nextRunAtMs } = input;
  if (typeof nextRunAtMs !== 'number' || !Number.isFinite(nextRunAtMs) || nextRunAtMs <= nowMs) {
    return base;
  }
  const untilNext = nextRunAtMs - nowMs;
  const margin = Math.min(UNATTENDED_HOLD_NEXT_RUN_MARGIN_MS, Math.floor(untilNext / 2));
  // The trailing clamp is what makes the invariant exact rather than nearly
  // true: for a schedule only a millisecond away, `untilNext - margin` is still
  // `untilNext`, and a deadline equal to the next fire is a deadline that races
  // it.
  return Math.max(1, Math.min(base, untilNext - margin, untilNext - 1));
}
