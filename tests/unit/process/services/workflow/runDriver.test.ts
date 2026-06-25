/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  classifyTurnFailure,
  decideAfterTurn,
  runModeOnPause,
  runModeOnResume,
  shouldAutoAdvance,
} from '@process/services/workflow/runDriver';
import type {
  StepState,
  StepStatus,
  WorkflowRunMode,
  WorkflowSession,
} from '@/common/types/workflowTypes';

// Build a single step with sensible defaults; only n and status matter here.
function makeStep(n: number, status: StepStatus): StepState {
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
  };
}

// Fixture builder mirroring the spread-override style; fill ALL required fields.
function makeSession(over: Partial<WorkflowSession> = {}): WorkflowSession {
  return {
    id: 'session-1',
    workflow_name: 'demo',
    workflow_title: 'Demo Workflow',
    conversation_id: 'conv-1',
    current_step: 1,
    total_steps: 2,
    steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    skills: [],
    asks: [],
    status: 'active',
    palette: null,
    category: null,
    created_at: 0,
    updated_at: 0,
    completed_at: null,
    begin_sent_at: null,
    run_mode: 'running',
    interactivity: 'step',
    ...over,
  };
}

describe('decideAfterTurn - precedence matrix', () => {
  it('returns complete when every step is terminal (all done)', () => {
    const session = makeSession({
      steps: [makeStep(1, 'done'), makeStep(2, 'done')],
    });
    expect(decideAfterTurn(session)).toBe('complete');
  });

  it('returns complete when steps mix done/skipped/errored (all terminal)', () => {
    const session = makeSession({
      steps: [makeStep(1, 'done'), makeStep(2, 'skipped'), makeStep(3, 'errored')],
    });
    expect(decideAfterTurn(session)).toBe('complete');
  });

  it('returns complete for an empty steps array', () => {
    const session = makeSession({ steps: [] });
    expect(decideAfterTurn(session)).toBe('complete');
  });

  it('pause wins at the finish line: paused-but-all-done HALTS (no auto-finalize over pause)', () => {
    const session = makeSession({
      run_mode: 'paused',
      steps: [makeStep(1, 'done'), makeStep(2, 'done')],
    });
    expect(decideAfterTurn(session)).toBe('halt');
  });

  it('a running all-done run still completes', () => {
    const session = makeSession({
      run_mode: 'running',
      steps: [makeStep(1, 'done'), makeStep(2, 'done')],
    });
    expect(decideAfterTurn(session)).toBe('complete');
  });

  it('returns halt when run_mode is paused (non-terminal steps remain)', () => {
    const session = makeSession({
      run_mode: 'paused',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(decideAfterTurn(session)).toBe('halt');
  });

  it('returns halt when run_mode is awaiting_input (non-terminal steps remain)', () => {
    const session = makeSession({
      run_mode: 'awaiting_input',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(decideAfterTurn(session)).toBe('halt');
  });

  it('returns halt when run_mode is done (non-terminal steps remain)', () => {
    const session = makeSession({
      run_mode: 'done',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(decideAfterTurn(session)).toBe('halt');
  });

  it('returns advance when running + auto with non-terminal steps', () => {
    const session = makeSession({
      run_mode: 'running',
      interactivity: 'auto',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(decideAfterTurn(session)).toBe('advance');
  });

  it('returns advance when running + auto with mixed terminal and non-terminal steps', () => {
    const session = makeSession({
      run_mode: 'running',
      interactivity: 'auto',
      steps: [makeStep(1, 'done'), makeStep(2, 'now'), makeStep(3, 'todo')],
    });
    expect(decideAfterTurn(session)).toBe('advance');
  });

  it('returns await_input when running + step with non-terminal steps', () => {
    const session = makeSession({
      run_mode: 'running',
      interactivity: 'step',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(decideAfterTurn(session)).toBe('await_input');
  });
});

describe('shouldAutoAdvance', () => {
  it('is true when decideAfterTurn returns advance', () => {
    const session = makeSession({
      run_mode: 'running',
      interactivity: 'auto',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(shouldAutoAdvance(session)).toBe(true);
  });

  it('is false when running + step (await_input)', () => {
    const session = makeSession({
      run_mode: 'running',
      interactivity: 'step',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(shouldAutoAdvance(session)).toBe(false);
  });

  it('is false when complete', () => {
    const session = makeSession({
      run_mode: 'running',
      interactivity: 'auto',
      steps: [makeStep(1, 'done'), makeStep(2, 'done')],
    });
    expect(shouldAutoAdvance(session)).toBe(false);
  });

  it('is false when halted', () => {
    const session = makeSession({
      run_mode: 'paused',
      interactivity: 'auto',
      steps: [makeStep(1, 'now'), makeStep(2, 'todo')],
    });
    expect(shouldAutoAdvance(session)).toBe(false);
  });
});

describe('runModeOnPause', () => {
  const cases: ReadonlyArray<readonly [WorkflowRunMode, WorkflowRunMode]> = [
    ['running', 'paused'],
    ['paused', 'paused'],
    ['awaiting_input', 'awaiting_input'],
    ['done', 'done'],
  ];
  it.each(cases)('maps %s -> %s', (input, expected) => {
    expect(runModeOnPause(input)).toBe(expected);
  });
});

describe('runModeOnResume', () => {
  const cases: ReadonlyArray<readonly [WorkflowRunMode, WorkflowRunMode]> = [
    ['paused', 'running'],
    ['awaiting_input', 'running'],
    ['running', 'running'],
    ['done', 'done'],
  ];
  it.each(cases)('maps %s -> %s', (input, expected) => {
    expect(runModeOnResume(input)).toBe(expected);
  });
});

describe('classifyTurnFailure', () => {
  it('maps a network drop to transient', () => {
    expect(classifyTurnFailure({ state: 'error', detail: 'ECONNRESET: socket hang up' })).toBe('transient');
    expect(classifyTurnFailure({ state: 'error', detail: 'fetch failed: network error' })).toBe('transient');
    expect(classifyTurnFailure({ state: 'error', detail: 'request timed out' })).toBe('transient');
    expect(classifyTurnFailure({ state: 'error', detail: 'ETIMEDOUT' })).toBe('transient');
  });

  it('maps a 429 / 5xx to transient', () => {
    expect(classifyTurnFailure({ state: 'error', detail: 'HTTP 429 Too Many Requests' })).toBe('transient');
    expect(classifyTurnFailure({ state: 'error', detail: 'status 503 Service Unavailable' })).toBe('transient');
    expect(classifyTurnFailure({ state: 'error', detail: 'Error 500: internal server error' })).toBe('transient');
  });

  it('maps a 401 / auth failure to terminal', () => {
    expect(classifyTurnFailure({ state: 'error', detail: 'HTTP 401 Unauthorized' })).toBe('terminal');
    expect(classifyTurnFailure({ state: 'error', detail: 'authentication failed: invalid api key' })).toBe('terminal');
    expect(classifyTurnFailure({ state: 'error', detail: '403 Forbidden' })).toBe('terminal');
  });

  it('maps a 400 bad-request to terminal', () => {
    expect(classifyTurnFailure({ state: 'error', detail: 'HTTP 400 Bad Request' })).toBe('terminal');
    expect(classifyTurnFailure({ state: 'error', detail: 'invalid request: bad parameter' })).toBe('terminal');
  });

  it('returns none for a non-error terminal state', () => {
    expect(classifyTurnFailure({ state: 'ai_waiting_input', detail: '' })).toBe('none');
    expect(classifyTurnFailure({ state: 'stopped', detail: '' })).toBe('none');
  });

  it('defaults an unrecognized error detail to transient (retry-then-surface, not silently terminal)', () => {
    expect(classifyTurnFailure({ state: 'error', detail: 'something weird happened' })).toBe('transient');
    expect(classifyTurnFailure({ state: 'error', detail: '' })).toBe('transient');
  });
});
