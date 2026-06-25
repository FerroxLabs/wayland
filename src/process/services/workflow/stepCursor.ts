/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { applyTransition } from '@process/services/workflow/applyTransition';
import type { StepState, StepStatus, StepTransition } from '@/common/types/workflowTypes';

/**
 * Structural step cursor for a workflow run. This is the single authoritative
 * source for "where is the run" and "is this transition legal", layered on top
 * of the tested per-step status matrix in {@link applyTransition}:
 *
 *  - {@link deriveCurrentStep} – the one place that computes `current_step`.
 *  - {@link resolveTransition} – status matrix + a no-forward-leapfrog guard,
 *    returning the next immutable steps array and cursor (replaces the old
 *    1000 ms race-window resolver's role at the call site).
 *  - {@link backtrackTo} – the sanctioned backward regress (re-run from step N),
 *    returning a one-level undo snapshot.
 *
 * All functions are pure: no I/O, no `Date.now()` (callers pass the timestamp on
 * the {@link StepTransition}), and inputs are never mutated.
 */

const TERMINAL: ReadonlySet<StepStatus> = new Set<StepStatus>(['done', 'skipped', 'errored']);

/**
 * A step is terminal when it will not be revisited by normal forward flow.
 * Exported as the single shared definition so {@link runDriver} cannot drift
 * out of lockstep with the cursor.
 */
export const isStepTerminal = (status: StepStatus): boolean => TERMINAL.has(status);

const isTerminal = isStepTerminal;

export type TransitionReason = 'regress' | 'dedup' | 'precedence_loss' | 'leapfrog' | 'unknown_step';

export type TransitionOutcome =
  | { accepted: true; steps: StepState[]; current_step: number; status: StepStatus }
  | { accepted: false; reason: TransitionReason };

/**
 * The single source of truth for `current_step`. This is a 1-based POSITION
 * cursor (the index of the first non-terminal step + 1), NOT a step `n`. It
 * parks at `steps.length + 1` when every step is terminal (or there are none).
 *
 * Position, not `n`, because: (a) it must satisfy the DB CHECK
 * `current_step <= total_steps + 1` even when authors number steps
 * non-contiguously (e.g. `## Step 2/5/7` — parseSteps preserves those numbers),
 * and (b) `composeStepContext` reads `steps[current_step - 1]`, which is index
 * math. For contiguously-numbered workflows position === n, so this is a no-op
 * for every machine-generated workflow; it only fixes the non-contiguous edge.
 */
export function deriveCurrentStep(steps: StepState[]): number {
  const idx = steps.findIndex((s) => !isTerminal(s.status));
  return idx === -1 ? steps.length + 1 : idx + 1;
}

/**
 * Apply `withTimestamps` semantics for a newly-accepted status, mirroring the
 * legacy service behaviour: entering `now` stamps `started_at`; any terminal
 * status stamps `completed_at` and backfills `started_at` if it was never set.
 */
function withTimestamps(step: StepState, newStatus: StepStatus, timestamp: number): StepState {
  if (newStatus === 'now') {
    return { ...step, status: newStatus, started_at: step.started_at ?? timestamp, completed_at: null };
  }
  if (isTerminal(newStatus)) {
    return {
      ...step,
      status: newStatus,
      started_at: step.started_at ?? timestamp,
      completed_at: timestamp,
    };
  }
  return { ...step, status: newStatus };
}

/**
 * Resolve an incoming transition against the current steps. Rejects:
 *  - `unknown_step`  – no step matches `incoming.step_n`.
 *  - `leapfrog`      – moving a step to `now` while an earlier step is still
 *                      non-terminal (sanctioned regress goes through {@link backtrackTo}).
 *  - `regress` / `dedup` / `precedence_loss` – propagated from {@link applyTransition}.
 *
 * On accept, returns the next immutable steps array and the recomputed cursor.
 */
export function resolveTransition(steps: StepState[], incoming: StepTransition): TransitionOutcome {
  const idx = steps.findIndex((s) => s.n === incoming.step_n);
  if (idx === -1) {
    return { accepted: false, reason: 'unknown_step' };
  }

  // Structural guard: no forward leapfrog for AGENT-narrated progress. A single
  // verbose parent turn can emit `<step now>` for several steps at once; a step
  // may only enter `now` from a `parent` marker once every earlier step is
  // terminal. `worker` (intentional out-of-order autonomous runs) and `user`
  // (explicit rail jumps) are deliberately ungated - this mirrors the legacy
  // service gating exactly, now living in the cursor where the invariant belongs.
  // (Phase 3 restores `parent` source threading through the IPC boundary so this
  // guard becomes live; today in-chat markers arrive as `user` and pass.)
  if (incoming.status === 'now' && incoming.source === 'parent') {
    const earlierIncomplete = steps.some((s, i) => i < idx && !isTerminal(s.status));
    if (earlierIncomplete) {
      return { accepted: false, reason: 'leapfrog' };
    }
  }

  const result = applyTransition(steps[idx].status, incoming);
  if (result.accepted === false) {
    return { accepted: false, reason: result.reason };
  }

  const updatedStep = withTimestamps(steps[idx], result.newStatus, incoming.timestamp);
  const nextSteps = steps.map((s, i) => (i === idx ? updatedStep : s));
  return {
    accepted: true,
    steps: nextSteps,
    current_step: deriveCurrentStep(nextSteps),
    status: result.newStatus,
  };
}

export type BacktrackResult = {
  steps: StepState[];
  current_step: number;
  /** Prior steps array, for one-level undo. */
  snapshot: StepState[];
};

/**
 * Sanctioned backward regress: re-run the workflow from step `n`. Step `n`
 * becomes `now` (re-run, run metadata cleared); every later step resets to
 * `todo` and its run metadata clears. Earlier steps are untouched. Returns the
 * prior steps array as a one-level undo snapshot. A no-op for `n` past the end.
 */
export function backtrackTo(steps: StepState[], n: number): BacktrackResult {
  const snapshot = steps.map((s) => ({ ...s }));
  const nextSteps = steps.map((s) => {
    if (s.n < n) {
      return s;
    }
    if (s.n === n) {
      return { ...s, status: 'now' as StepStatus, started_at: null, completed_at: null, autonomous_run: null };
    }
    return { ...s, status: 'todo' as StepStatus, started_at: null, completed_at: null, autonomous_run: null };
  });
  return { steps: nextSteps, current_step: deriveCurrentStep(nextSteps), snapshot };
}
