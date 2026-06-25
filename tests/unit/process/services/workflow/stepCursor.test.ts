/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { backtrackTo, deriveCurrentStep, resolveTransition } from '@process/services/workflow/stepCursor';
import type { StepState, StepStatus, StepTransition } from '@/common/types/workflowTypes';

function makeStep(n: number, status: StepStatus, over: Partial<StepState> = {}): StepState {
  return {
    n,
    title: `Step ${n}`,
    body_excerpt: '',
    status,
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
    ...over,
  };
}

function makeTx(over: Partial<StepTransition> = {}): StepTransition {
  return {
    step_n: 1,
    status: 'now',
    source: 'user',
    dispatch_id: null,
    timestamp: 1_000,
    ...over,
  };
}

describe('deriveCurrentStep', () => {
  it('returns 1 when all steps are todo', () => {
    expect(deriveCurrentStep([makeStep(1, 'todo'), makeStep(2, 'todo')])).toBe(1);
  });

  it('returns the first non-terminal step (done then todo)', () => {
    expect(deriveCurrentStep([makeStep(1, 'done'), makeStep(2, 'todo')])).toBe(2);
  });

  it('returns the now step when it is the active one', () => {
    expect(deriveCurrentStep([makeStep(1, 'done'), makeStep(2, 'now'), makeStep(3, 'todo')])).toBe(2);
  });

  it('parks at total+1 when every step is terminal', () => {
    expect(deriveCurrentStep([makeStep(1, 'done'), makeStep(2, 'done'), makeStep(3, 'done')])).toBe(4);
  });

  it('treats skipped and errored as terminal when parking', () => {
    expect(deriveCurrentStep([makeStep(1, 'done'), makeStep(2, 'skipped'), makeStep(3, 'errored')])).toBe(4);
  });

  it('returns 1 for an empty steps array (parks at length+1)', () => {
    expect(deriveCurrentStep([])).toBe(1);
  });

  it('is a POSITION cursor, not a step n: non-contiguous numbering stays within bounds', () => {
    // parseSteps preserves author numbering (e.g. ## Step 2 / 5 / 7). current_step
    // must be a 1-based position so it satisfies the DB CHECK current_step<=total+1.
    const steps = [makeStep(2, 'done'), makeStep(5, 'now'), makeStep(7, 'todo')];
    // first non-terminal is the n=5 step at index 1 -> position 2 (NOT 5).
    expect(deriveCurrentStep(steps)).toBe(2);
    // all terminal -> parks at length+1 = 4 (<= total_steps(3)+1), never max-n+1.
    const allDone = [makeStep(2, 'done'), makeStep(5, 'done'), makeStep(7, 'done')];
    expect(deriveCurrentStep(allDone)).toBe(4);
  });
});

describe('resolveTransition - rejections', () => {
  it('rejects unknown_step when no step matches step_n', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    expect(resolveTransition(steps, makeTx({ step_n: 5, status: 'now' }))).toEqual({
      accepted: false,
      reason: 'unknown_step',
    });
  });

  it('rejects parent leapfrog when entering now while an earlier step is non-terminal', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    expect(resolveTransition(steps, makeTx({ step_n: 2, status: 'now', source: 'parent' }))).toEqual({
      accepted: false,
      reason: 'leapfrog',
    });
  });

  it('does NOT gate user out-of-order jumps (explicit rail click)', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 2, status: 'now', source: 'user' }));
    expect(out.accepted).toBe(true);
  });

  it('does NOT gate worker out-of-order autonomous runs', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 2, status: 'now', source: 'worker', dispatch_id: 'd1' }));
    expect(out.accepted).toBe(true);
  });

  it('propagates regress from the status matrix (done -> now)', () => {
    const steps = [makeStep(1, 'done'), makeStep(2, 'todo')];
    expect(resolveTransition(steps, makeTx({ step_n: 1, status: 'now' }))).toEqual({
      accepted: false,
      reason: 'regress',
    });
  });

  it('propagates dedup from the status matrix (done -> done)', () => {
    const steps = [makeStep(1, 'done'), makeStep(2, 'todo')];
    expect(resolveTransition(steps, makeTx({ step_n: 1, status: 'done' }))).toEqual({
      accepted: false,
      reason: 'dedup',
    });
  });
});

describe('resolveTransition - acceptances', () => {
  it('accepts entering now on the first step and stamps started_at', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 1, status: 'now', timestamp: 500 }));
    expect(out.accepted).toBe(true);
    if (!out.accepted) return;
    expect(out.status).toBe('now');
    expect(out.steps[0].status).toBe('now');
    expect(out.steps[0].started_at).toBe(500);
    expect(out.steps[0].completed_at).toBeNull();
    expect(out.current_step).toBe(1);
  });

  it('accepts done, stamps completed_at, backfills started_at, advances cursor', () => {
    const steps = [makeStep(1, 'now'), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 1, status: 'done', timestamp: 800 }));
    expect(out.accepted).toBe(true);
    if (!out.accepted) return;
    expect(out.steps[0].status).toBe('done');
    expect(out.steps[0].completed_at).toBe(800);
    expect(out.steps[0].started_at).toBe(800); // backfilled
    expect(out.current_step).toBe(2);
  });

  it('preserves an existing started_at when completing', () => {
    const steps = [makeStep(1, 'now', { started_at: 100 }), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 1, status: 'done', timestamp: 800 }));
    expect(out.accepted).toBe(true);
    if (!out.accepted) return;
    expect(out.steps[0].started_at).toBe(100);
    expect(out.steps[0].completed_at).toBe(800);
  });

  it('accepts skipped on any step and advances the cursor', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 1, status: 'skipped', timestamp: 400 }));
    expect(out.accepted).toBe(true);
    if (!out.accepted) return;
    expect(out.steps[0].status).toBe('skipped');
    expect(out.steps[0].completed_at).toBe(400);
    expect(out.current_step).toBe(2);
  });

  it('allows entering now on a later step when all earlier steps are terminal', () => {
    const steps = [makeStep(1, 'done'), makeStep(2, 'todo')];
    const out = resolveTransition(steps, makeTx({ step_n: 2, status: 'now', timestamp: 600 }));
    expect(out.accepted).toBe(true);
    if (!out.accepted) return;
    expect(out.steps[1].status).toBe('now');
    expect(out.current_step).toBe(2);
  });

  it('does not mutate the input steps array', () => {
    const steps = [makeStep(1, 'todo'), makeStep(2, 'todo')];
    resolveTransition(steps, makeTx({ step_n: 1, status: 'now', timestamp: 500 }));
    expect(steps[0].status).toBe('todo');
    expect(steps[0].started_at).toBeNull();
  });
});

describe('backtrackTo', () => {
  it('re-runs from step n: n becomes now, later steps reset to todo', () => {
    const steps = [makeStep(1, 'done'), makeStep(2, 'done'), makeStep(3, 'done')];
    const out = backtrackTo(steps, 2);
    expect(out.steps[0].status).toBe('done'); // earlier untouched
    expect(out.steps[1].status).toBe('now');
    expect(out.steps[1].completed_at).toBeNull();
    expect(out.steps[1].started_at).toBeNull();
    expect(out.steps[2].status).toBe('todo');
    expect(out.current_step).toBe(2);
  });

  it('clears run metadata on invalidated steps', () => {
    const steps = [
      makeStep(1, 'done'),
      makeStep(2, 'done', {
        completed_at: 900,
        autonomous_run: { dispatch_id: 'd1', started_at: 1, state: 'done' },
      }),
    ];
    const out = backtrackTo(steps, 2);
    expect(out.steps[1].autonomous_run).toBeNull();
    expect(out.steps[1].completed_at).toBeNull();
  });

  it('returns a snapshot reflecting the pre-backtrack state', () => {
    const steps = [makeStep(1, 'done'), makeStep(2, 'done')];
    const out = backtrackTo(steps, 1);
    expect(out.snapshot).toEqual(steps);
    expect(out.steps[0].status).toBe('now'); // result diverges from snapshot
    expect(out.snapshot[0].status).toBe('done');
  });

  it('is a no-op for n past the end', () => {
    const steps = [makeStep(1, 'done'), makeStep(2, 'done')];
    const out = backtrackTo(steps, 5);
    expect(out.steps.map((s) => s.status)).toEqual(['done', 'done']);
    expect(out.current_step).toBe(3);
  });
});
