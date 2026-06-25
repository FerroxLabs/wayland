/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for Phase 2b boot-resume. Pure decision (`decideResumeAction`) plus the
 * `resumeInterruptedParentRuns` sweep (mocked service + send hand).
 */

import { describe, expect, it, vi } from 'vitest';
import {
  decideResumeAction,
  isConsequentialStep,
  resumeInterruptedParentRuns,
} from '@process/services/workflow/resumeRuns';
import type { StepState, StepStatus, WorkflowSession } from '@/common/types/workflowTypes';

function step(n: number, status: StepStatus): StepState {
  return {
    n,
    // Provably read-only by default so the boot-resume "auto-repoke" fixtures
    // represent the safe case; consequential steps are asserted explicitly.
    title: `Analyze step ${n}`,
    body_excerpt: `Review the inputs for step ${n}`,
    status,
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
  };
}

function session(over: Partial<WorkflowSession> = {}): WorkflowSession {
  return {
    id: 'wf-1',
    workflow_name: 'demo',
    workflow_title: 'Demo',
    conversation_id: 'conv-1',
    current_step: 1,
    total_steps: 2,
    steps: [step(1, 'now'), step(2, 'todo')],
    skills: [],
    asks: [],
    status: 'active',
    palette: null,
    category: null,
    created_at: 0,
    updated_at: 0,
    completed_at: null,
    begin_sent_at: 1,
    run_mode: 'running',
    interactivity: 'auto',
    ...over,
  };
}

describe('decideResumeAction', () => {
  it('repokes an interrupted auto run (running + a now step)', () => {
    expect(decideResumeAction(session({ interactivity: 'auto' }))).toBe('repoke');
  });

  it('surfaces an interrupted step-mode run as awaiting_input', () => {
    expect(decideResumeAction(session({ interactivity: 'step' }))).toBe('await_input');
  });

  it('skips a run with no `now` step (nothing interrupted)', () => {
    expect(decideResumeAction(session({ steps: [step(1, 'done'), step(2, 'todo')] }))).toBe('skip');
  });

  it('skips a paused run (the user deliberately stopped it)', () => {
    expect(decideResumeAction(session({ run_mode: 'paused' }))).toBe('skip');
  });

  it('skips a done run', () => {
    expect(decideResumeAction(session({ run_mode: 'done' }))).toBe('skip');
  });

  it('skips when begin was never sent (never actually started)', () => {
    expect(decideResumeAction(session({ begin_sent_at: null }))).toBe('skip');
  });

  it('skips resuming a consequential step (asks before re-running a side effect)', () => {
    const consequential = vi.fn(() => true);
    expect(decideResumeAction(session({ interactivity: 'auto' }), consequential)).toBe('await_input');
  });
});

describe('isConsequentialStep (interim fail-safe heuristic)', () => {
  it('is false ONLY for provably read-only steps (auto-repoke is allowed)', () => {
    expect(isConsequentialStep({ ...step(1, 'now'), title: 'Summarize the findings' })).toBe(false);
    expect(isConsequentialStep({ ...step(1, 'now'), title: 'Analyze the logs' })).toBe(false);
    expect(isConsequentialStep({ ...step(1, 'now'), title: 'Compare the options' })).toBe(false);
  });

  it('parks explicit irreversible / outward actions (title or body)', () => {
    for (const title of [
      'Deploy to production',
      'Send the campaign email',
      'Publish the post',
      'Delete the old records',
      'Cancel the subscription',
      'Revoke the API key',
      'Wire the funds',
      'Push to prod',
      'Merge the PR',
      'Refund the customer',
    ]) {
      expect(isConsequentialStep({ ...step(1, 'now'), title })).toBe(true);
    }
    // body-only side effect is still caught
    expect(isConsequentialStep({ ...step(1, 'now'), title: 'Step 3', body_excerpt: 'charge the customer card' })).toBe(
      true
    );
  });

  it('a dangerous verb wins even when a safe verb is also present', () => {
    expect(
      isConsequentialStep({ ...step(1, 'now'), title: 'Analyze the data then email the report' })
    ).toBe(true);
  });

  it('fails SAFE: an unrecognized / ambiguous phrasing parks rather than silently re-running', () => {
    expect(isConsequentialStep({ ...step(1, 'now'), title: 'Step 7', body_excerpt: 'finalize the customer relationship' })).toBe(true);
  });
});

describe('resumeInterruptedParentRuns', () => {
  function makeService(sessions: WorkflowSession[]) {
    return {
      findAllActive: vi.fn(async (limit?: number) =>
        sessions.slice(0, limit ?? 100).map((s) => ({ session: s, conversation_preview: '' }))
      ),
      setRunMode: vi.fn(async (id: string, mode: WorkflowSession['run_mode']) => session({ id, run_mode: mode })),
      continueRun: vi.fn(async (id: string) => ({
        decision: 'advance' as const,
        directive: `Proceed to step 1`,
        session: session({ id }),
      })),
    };
  }

  it('repokes an interrupted auto run via continueRun + sends the directive', async () => {
    const svc = makeService([session({ id: 'a', interactivity: 'auto' })]);
    const sendDirective = vi.fn(async () => undefined);
    await resumeInterruptedParentRuns(svc as never, { sendDirective });
    // Boot re-poke must force the send past the live-loop's todo→now gate (the
    // interrupted step is already `now`).
    expect(svc.continueRun).toHaveBeenCalledWith('a', { repokeActiveStep: true });
    expect(sendDirective).toHaveBeenCalledWith('conv-1', 'Proceed to step 1');
  });

  it('parks the run when the re-poke send fails (never leaves it alive-but-dead)', async () => {
    const svc = makeService([session({ id: 'a', interactivity: 'auto' })]);
    const sendDirective = vi.fn(async () => {
      throw new Error('worker not ready');
    });
    await resumeInterruptedParentRuns(svc as never, { sendDirective });
    expect(sendDirective).toHaveBeenCalled();
    expect(svc.setRunMode).toHaveBeenCalledWith('a', 'awaiting_input');
  });

  it('parks an interrupted step-mode run at awaiting_input without sending', async () => {
    const svc = makeService([session({ id: 'b', interactivity: 'step' })]);
    const sendDirective = vi.fn(async () => undefined);
    await resumeInterruptedParentRuns(svc as never, { sendDirective });
    expect(svc.setRunMode).toHaveBeenCalledWith('b', 'awaiting_input');
    expect(sendDirective).not.toHaveBeenCalled();
  });

  it('leaves a clean (no `now` step) run alone', async () => {
    const svc = makeService([session({ id: 'c', steps: [step(1, 'done'), step(2, 'todo')] })]);
    const sendDirective = vi.fn(async () => undefined);
    await resumeInterruptedParentRuns(svc as never, { sendDirective });
    expect(svc.continueRun).not.toHaveBeenCalled();
    expect(svc.setRunMode).not.toHaveBeenCalled();
  });

  it('one failing session does not abort the sweep', async () => {
    const svc = makeService([
      session({ id: 'x', interactivity: 'auto' }),
      session({ id: 'y', interactivity: 'auto' }),
    ]);
    svc.continueRun.mockRejectedValueOnce(new Error('boom'));
    const sendDirective = vi.fn(async () => undefined);
    await resumeInterruptedParentRuns(svc as never, { sendDirective });
    expect(svc.continueRun).toHaveBeenCalledTimes(2);
  });
});
