/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #468 — shared "Output budget" constants + type. Lives in `common` so the
 * renderer control (OutputBudgetField) and the main-process spawn seam
 * (WCoreManager) agree on the same bounds without a renderer→main import.
 */
export type OutputBudget = { mode: 'auto' | 'fixed'; value?: number };

/** Default Fixed value offered when a user first switches Auto → Fixed. */
export const DEFAULT_FIXED_BUDGET = 16000;
/**
 * Floor for a Fixed budget. Enforced in BOTH the UI input and the spawn seam:
 * a too-small `--max-tokens` starves reasoning/visible output, so a positive
 * Fixed value below this is clamped up to it (defense in depth — the value can
 * arrive from imported config, not just the input).
 */
export const MIN_FIXED_BUDGET = 256;
/** Upper bound for the Fixed input (the engine clamps the real ceiling anyway). */
export const MAX_FIXED_BUDGET = 200000;

/**
 * Resolve the per-call `max_tokens` a Fixed budget should request, or
 * `undefined` for Auto / no usable value. Single source for UI + spawn.
 */
export function resolveFixedBudget(pref: OutputBudget | undefined): number | undefined {
  if (pref?.mode !== 'fixed' || typeof pref.value !== 'number' || pref.value <= 0) return undefined;
  return Math.max(pref.value, MIN_FIXED_BUDGET);
}
