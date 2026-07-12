/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #163 — a minute-cadence scheduled job that creates a NEW conversation every
 * run floods the conversation history, spawns overlapping agent processes, and
 * makes the app feel unstable. Reuse ('existing') mode is the safe path.
 *
 * These helpers detect the dangerous combination so both the renderer (warn
 * before save) and the main process (authoritative reject unless overridden)
 * agree on exactly what counts as a footgun. Pure + dependency-free so they run
 * in either bundle and are trivially unit-testable.
 */

/**
 * True when a cron expression's minute field makes it fire every minute — a bare
 * star, a one-step (star or full 0-59 range divided by 1), i.e. the shapes the
 * issue calls out. Supports 5-field (standard) and 6-field (leading seconds)
 * croner expressions; a 6-field expression whose seconds field fires every unit
 * runs even more often and also counts.
 */
export function isEveryMinuteCronExpr(expr: string): boolean {
  if (!expr) return false;
  const fields = expr.trim().split(/\s+/);
  if (fields.length < 5) return false;

  const firesEveryUnit = (field: string): boolean => {
    if (field === '*' || field === '*/1') return true;
    // Any `/1` step (e.g. `*/1`, `0-59/1`, `0/1`) fires every unit.
    const step = field.match(/\/(\d+)$/);
    if (step) return step[1] === '1';
    // A bare range spanning the whole 0-59 domain is identical to `*` (e.g.
    // `0-59`), which the free-text custom-cron field lets a user type.
    const range = field.match(/^(\d{1,2})-(\d{1,2})$/);
    return range !== null && Number(range[1]) === 0 && Number(range[2]) >= 59;
  };

  // 6-field croner form is `sec min hour dom mon dow`; a per-second cadence is
  // strictly worse than per-minute, so treat it as high-frequency too.
  if (fields.length >= 6) {
    return firesEveryUnit(fields[0]) || firesEveryUnit(fields[1]);
  }
  return firesEveryUnit(fields[0]);
}

/**
 * The #163 footgun: a cron-kind schedule firing every minute while creating a
 * new conversation each run. Interval/at schedules and reuse ('existing') mode
 * are unaffected.
 */
export function isNewConversationFootgun(
  scheduleKind: string,
  expr: string | undefined,
  executionMode: string | undefined
): boolean {
  if (scheduleKind !== 'cron') return false;
  if (executionMode !== 'new_conversation') return false;
  return isEveryMinuteCronExpr(expr ?? '');
}
