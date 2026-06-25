/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { StepState, WorkflowRunMode, WorkflowSession } from '@/common/types/workflowTypes';
import { isStepTerminal as isStatusTerminal } from '@process/services/workflow/stepCursor';

export type AfterTurnDecision = 'advance' | 'await_input' | 'halt' | 'complete';

// Single shared terminal definition (see stepCursor.isStepTerminal) so the
// driver and the cursor cannot drift on what "done" means.
const isStepTerminal = (step: StepState): boolean => isStatusTerminal(step.status);

/**
 * Pure decision: given a workflow session whose parent conversation just finished
 * an agent turn, what should the run driver do next?
 * Precedence (check in THIS order):
 *  1. If run_mode is NOT 'running' (paused | awaiting_input | done)          -> 'halt'
 *  2. If every step is terminal (status is 'done' | 'skipped' | 'errored')  -> 'complete'
 *  3. If interactivity === 'auto'                                           -> 'advance'
 *  4. Otherwise (interactivity === 'step')                                  -> 'await_input'
 *
 * Pause wins at the finish line: a paused run whose last step just completed
 * HALTS (the user gets an explicit "finish workflow?" affordance) rather than
 * auto-finalizing over their pause. Only a `running` all-terminal run completes.
 * An empty steps array on a running run still counts as all-terminal -> 'complete'.
 */
export function decideAfterTurn(session: WorkflowSession): AfterTurnDecision {
  if (session.run_mode !== 'running') {
    return 'halt';
  }
  if (session.steps.every(isStepTerminal)) {
    return 'complete';
  }
  if (session.interactivity === 'auto') {
    return 'advance';
  }
  return 'await_input';
}

/** Convenience boolean: decideAfterTurn(session) === 'advance'. */
export function shouldAutoAdvance(session: WorkflowSession): boolean {
  return decideAfterTurn(session) === 'advance';
}

/** running -> paused; every other mode returned unchanged. */
export function runModeOnPause(mode: WorkflowRunMode): WorkflowRunMode {
  return mode === 'running' ? 'paused' : mode;
}

/** paused | awaiting_input -> running; every other mode returned unchanged. */
export function runModeOnResume(mode: WorkflowRunMode): WorkflowRunMode {
  return mode === 'paused' || mode === 'awaiting_input' ? 'running' : mode;
}

/**
 * Classification of a completed turn for resilience (Phase 2b).
 *  - `none`      – the turn did not fail (`state !== 'error'`).
 *  - `transient` – a recoverable failure (network drop / timeout / 429 / 5xx):
 *                  retry the same step (auto) or offer Retry (step).
 *  - `terminal`  – a non-recoverable failure (auth / 400 bad-request): retrying
 *                  the same way will fail again; surface the setup remedy.
 */
export type TurnFailureKind = 'none' | 'transient' | 'terminal';

/**
 * The shape we classify on - a structural subset of the turnCompleted event so
 * this stays pure and trivially unit-testable. Only the terminal `error` state
 * carries a failure; every other state is `none`.
 */
export type TurnFailureInput = {
  state: string;
  detail: string;
};

// Terminal: the request itself is wrong/unauthorized - the same call repeats the
// failure. Auth (401/403), bad-request (400), and explicit auth wording.
const TERMINAL_PATTERNS: readonly RegExp[] = [
  /\b401\b/,
  /\b403\b/,
  /\b400\b/,
  /unauthor/i,
  /forbidden/i,
  /authenticat/i,
  /invalid[\s_-]*(api[\s_-]*key|request|token|credential)/i,
  /bad[\s_-]*request/i,
];

// Transient: connectivity / rate-limit / server-side - a retry can succeed.
const TRANSIENT_PATTERNS: readonly RegExp[] = [
  /\b429\b/,
  /\b5\d\d\b/,
  /econnreset/i,
  /etimedout/i,
  /enotfound/i,
  /econnrefused/i,
  /epipe/i,
  /socket\s*hang\s*up/i,
  /network/i,
  /timed?\s*out/i,
  /timeout/i,
  /fetch\s*failed/i,
  /rate[\s_-]*limit/i,
  /unavailable/i,
];

/**
 * Classify a completed turn. Order matters: terminal patterns are checked first
 * so an "HTTP 401 ... fetch failed" message classifies as `terminal` (the auth
 * problem dominates). Unrecognized error details default to `transient` so the
 * driver retries-then-surfaces rather than parking a possibly-recoverable run.
 */
export function classifyTurnFailure(input: TurnFailureInput): TurnFailureKind {
  if (input.state !== 'error') return 'none';
  const detail = input.detail ?? '';
  if (TERMINAL_PATTERNS.some((re) => re.test(detail))) return 'terminal';
  if (TRANSIENT_PATTERNS.some((re) => re.test(detail))) return 'transient';
  return 'transient';
}
