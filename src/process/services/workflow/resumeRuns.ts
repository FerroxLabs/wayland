/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Boot-resume for parent workflow runs (Phase 2b.1).
 *
 * Resumption is at the STEP BOUNDARY, not mid-turn: an LLM/ACP turn is atomic,
 * so a run interrupted mid-`now` (app quit / crash) re-runs that step rather
 * than resuming a token stream. Phase 1 persists per-step status + `run_mode`,
 * so an interrupted run is the one that is still `running` with a step `now`
 * when a fresh service boots.
 *
 *  - `decideResumeAction` is the pure decision (unit-tested in isolation).
 *  - `resumeInterruptedParentRuns` sweeps `findAllActive`, applies the decision
 *    per session, and uses the same send HAND the live driver loop uses.
 */

import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';
import type { AfterTurnDecision } from './runDriver';

export type ResumeAction = 'repoke' | 'await_input' | 'skip';

// Explicit irreversible / outward-facing actions: always park. Not exhaustive
// (it never can be), which is exactly why the classifier below defaults unknown
// phrasings to consequential rather than trusting this list to be complete.
const DANGEROUS_PATTERNS: readonly RegExp[] = [
  /\b(send|email|e-mail|deliver|dispatch|notify|broadcast|announce|message|text|call|reply|dm|ping|alert)\b/i,
  /\b(publish|post|tweet|deploy|release|ship|launch|push|merge|promote|rollback|provision|fire|trigger|webhook)\b/i,
  /\b(charge|payment|pay|payout|invoice|bill|purchase|checkout|refund|transfer|wire|withdraw|capture|settle|fund|subscribe)\b/i,
  /\b(delete|remove|destroy|wipe|purge|drop|truncate|reset|overwrite|cancel|revoke|terminate|deactivate|suspend|ban|archive)\b/i,
  /\b(submit|order|book|booking|sign|execute|approve|reject|confirm|file|enroll|register|accept)\b/i,
];

// Provably read-only / side-effect-free actions. ONLY these auto-repoke after a
// crash; everything else fails safe to "park for confirmation".
const PROVABLY_SAFE_PATTERNS: readonly RegExp[] = [
  /\b(read|fetch|load|get|view|open|scan)\b/i,
  /\b(analy[sz]e|summari[sz]e|review|inspect|audit|evaluate|assess|examine)\b/i,
  /\b(plan|draft|outline|brainstorm|design|research|explore|investigate)\b/i,
  /\b(compute|calculate|estimate|compare|rank|score|measure)\b/i,
  /\b(list|gather|collect|identify|find|search|describe|explain|classify)\b/i,
];

/**
 * Interim side-effect classifier (Phase 4.2 will own the real heuristic).
 * Determines whether an interrupted auto step should be PARKED for one-click
 * confirmation rather than silently re-run on crash-resume.
 *
 * Deliberately FAIL-SAFE: an explicit dangerous action parks; only a provably
 * read-only action auto-repokes; ANYTHING ELSE (a novel or ambiguous phrasing)
 * defaults to consequential and parks. A false positive costs one extra
 * "Continue?" click after a crash; a false negative re-runs a real side effect
 * (re-charge, re-send, re-delete) - the data-loss class we refuse to risk, so
 * the unknown case must never be the silent-repoke case.
 */
export function isConsequentialStep(step: StepState): boolean {
  const haystack = `${step.title ?? ''}\n${step.body_excerpt ?? ''}`;
  if (DANGEROUS_PATTERNS.some((re) => re.test(haystack))) return true;
  if (PROVABLY_SAFE_PATTERNS.some((re) => re.test(haystack))) return false;
  return true; // unknown phrasing -> fail safe -> park
}

/**
 * Decide how to resume a single persisted session on boot.
 *  - Not `running`, no `now` step, or begin never sent  -> `skip`.
 *  - The interrupted step is consequential               -> `await_input`
 *    (ask before re-running a side effect).
 *  - `auto`                                              -> `repoke`.
 *  - `step`                                              -> `await_input`.
 */
export function decideResumeAction(
  session: WorkflowSession,
  consequential: (step: StepState) => boolean = isConsequentialStep
): ResumeAction {
  if (session.run_mode !== 'running') return 'skip';
  if (session.begin_sent_at === null) return 'skip';
  const nowStep = session.steps.find((s) => s.status === 'now');
  if (nowStep === undefined) return 'skip';
  if (consequential(nowStep)) return 'await_input';
  return session.interactivity === 'auto' ? 'repoke' : 'await_input';
}

/** The slice of WorkflowSessionService the boot-resume sweep needs. */
export type ResumeService = {
  findAllActive(limit?: number): Promise<Array<{ session: WorkflowSession; conversation_preview: string }>>;
  setRunMode(sessionId: string, mode: WorkflowSession['run_mode']): Promise<WorkflowSession>;
  continueRun(
    sessionId: string,
    opts?: { repokeActiveStep?: boolean }
  ): Promise<{
    decision: AfterTurnDecision;
    directive: string | null;
    session: WorkflowSession;
  }>;
};

export type ResumeDeps = {
  sendDirective(conversationId: string, directive: string): Promise<void>;
  /** Observability hook: a side-effect-free auto step was re-poked on boot. */
  onRepoke?(session: WorkflowSession): void;
};

/**
 * Re-arm every interrupted parent run on boot. Per-session failures are logged
 * and skipped so one bad row never aborts the sweep.
 */
export async function resumeInterruptedParentRuns(service: ResumeService, deps: ResumeDeps): Promise<void> {
  const active = await service.findAllActive(100);
  for (const { session } of active) {
    try {
      const action = decideResumeAction(session);
      if (action === 'skip') continue;
      if (action === 'await_input') {
        await service.setRunMode(session.id, 'awaiting_input');
        continue;
      }
      // repoke: the interrupted step is still `now` and its agent process is
      // gone, so force a single re-poke (the live loop's todo→now gate would
      // otherwise refuse to re-send an already-`now` step). The decision is
      // logged + surfaced via telemetry so a boot re-run is always auditable.
      const nowStep = session.steps.find((s) => s.status === 'now');
      console.warn(
        `[resumeRuns] re-poking interrupted auto step ${session.id}/${nowStep?.n ?? '?'} (${session.workflow_name})`
      );
      deps.onRepoke?.(session);
      const { decision, directive } = await service.continueRun(session.id, { repokeActiveStep: true });
      if (decision === 'advance' && directive) {
        try {
          await deps.sendDirective(session.conversation_id, directive);
        } catch (sendErr) {
          // A failed re-poke must NOT leave the run looking alive (fresh
          // updated_at) but dead (no directive delivered). Park it so the UI
          // surfaces "interrupted - resume?" and the watchdog stops watching it.
          console.warn('[resumeRuns] re-poke send failed, parking run', session.id, sendErr);
          await service.setRunMode(session.id, 'awaiting_input');
        }
      }
    } catch (err) {
      console.warn('[resumeRuns] failed to resume interrupted run', session.id, err);
    }
  }
}
