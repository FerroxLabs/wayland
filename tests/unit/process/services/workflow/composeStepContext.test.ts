/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for composeStepContext - per-turn WORKFLOW_STEP_CONTEXT block (SPEC §7.2).
 */

import { describe, expect, it } from 'vitest';

import { composeStepContext } from '../../../../../src/process/services/workflow/composeStepContext';
import type { StepState, WorkflowSession } from '../../../../../src/common/types/workflowTypes';

const TRUNCATION_SUFFIX = ' …[truncated]';

type StepOverrides = Partial<StepState> & Pick<StepState, 'n' | 'title' | 'status'>;

function makeStep(overrides: StepOverrides): StepState {
  return {
    body_excerpt: '',
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
    ...overrides,
  };
}

function makeSession(overrides: Partial<WorkflowSession> & Pick<WorkflowSession, 'steps'>): WorkflowSession {
  const total = overrides.total_steps ?? overrides.steps.length;
  return {
    id: 'session-1',
    workflow_name: 'demo',
    workflow_title: 'Demo workflow',
    conversation_id: 'conv-1',
    current_step: 1,
    total_steps: total,
    steps: overrides.steps,
    skills: [],
    asks: [],
    status: 'active',
    palette: null,
    category: null,
    created_at: 0,
    updated_at: 0,
    completed_at: null,
    ...overrides,
  };
}

describe('composeStepContext', () => {
  it('returns empty string when current_step is 0', () => {
    const session = makeSession({
      current_step: 0,
      total_steps: 2,
      steps: [
        makeStep({ n: 1, title: 'Step one', status: 'todo' }),
        makeStep({ n: 2, title: 'Step two', status: 'todo' }),
      ],
    });
    expect(composeStepContext(session)).toBe('');
  });

  it('returns empty string when total_steps is 0', () => {
    const session = makeSession({ current_step: 1, total_steps: 0, steps: [] });
    expect(composeStepContext(session)).toBe('');
  });

  it('starts with opening tag and ends with terminator', () => {
    const session = makeSession({
      current_step: 1,
      steps: [makeStep({ n: 1, title: 'Only step', status: 'now', body_excerpt: 'Do the thing.' })],
    });
    const block = composeStepContext(session);
    expect(block.startsWith('[workflow_step_context current_step="1" total_steps="1"]')).toBe(true);
    expect(block.endsWith('[/workflow_step_context]')).toBe(true);
  });

  it('includes the current step body when it fits in 8KB', () => {
    const body = 'A short prose description of step two.';
    const session = makeSession({
      current_step: 2,
      steps: [
        makeStep({ n: 1, title: 'First', status: 'done' }),
        makeStep({ n: 2, title: 'Second', status: 'now', body_excerpt: body }),
      ],
    });
    const block = composeStepContext(session);
    expect(block).toContain('Step 2 body (from the workflow author):');
    expect(block).toContain(body);
    expect(block).not.toContain(TRUNCATION_SUFFIX);
  });

  it('truncates a current step body longer than 8192 chars with the literal suffix', () => {
    const oversized = 'x'.repeat(9000);
    const session = makeSession({
      current_step: 1,
      steps: [makeStep({ n: 1, title: 'Big', status: 'now', body_excerpt: oversized })],
    });
    const block = composeStepContext(session);
    const opener = 'Step 1 body (from the workflow author):\n';
    const startIdx = block.indexOf(opener);
    expect(startIdx).toBeGreaterThanOrEqual(0);
    const tailIdx = block.indexOf('\n\nRecent step transitions:', startIdx);
    expect(tailIdx).toBeGreaterThan(startIdx);
    const bodySection = block.slice(startIdx + opener.length, tailIdx);
    expect(bodySection.endsWith(TRUNCATION_SUFFIX)).toBe(true);
    // Body content (before suffix) is exactly 8192 chars.
    expect(bodySection.length).toBe(8192 + TRUNCATION_SUFFIX.length);
  });

  it('emits a body section with an empty payload when the step body is empty', () => {
    const session = makeSession({
      current_step: 1,
      steps: [makeStep({ n: 1, title: 'Blank', status: 'now', body_excerpt: '' })],
    });
    const block = composeStepContext(session);
    expect(block).toContain('Step 1 body (from the workflow author):\n\n');
    expect(block).toContain('[/workflow_step_context]');
  });

  it('renders the correct glyph for each step status', () => {
    const session = makeSession({
      current_step: 3,
      steps: [
        makeStep({ n: 1, title: 'A', status: 'done' }),
        makeStep({ n: 2, title: 'B', status: 'skipped' }),
        makeStep({ n: 3, title: 'C', status: 'now' }),
        makeStep({ n: 4, title: 'D', status: 'errored' }),
        makeStep({ n: 5, title: 'E', status: 'todo' }),
      ],
    });
    const block = composeStepContext(session);
    expect(block).toContain('✓ Step 1: A');
    expect(block).toContain('⊘ Step 2: B');
    expect(block).toContain('→ Step 3: C');
    expect(block).toContain('⚠ Step 4: D');
    expect(block).toContain('⋯ Step 5: E');
  });

  it('formats elapsed time as MM:SS for completed steps with timestamps', () => {
    // 90s elapsed → 1:30
    const session = makeSession({
      current_step: 2,
      steps: [
        makeStep({
          n: 1,
          title: 'Fast',
          status: 'done',
          started_at: 1000,
          completed_at: 1000 + 90_000,
        }),
        makeStep({ n: 2, title: 'Now', status: 'now', body_excerpt: 'hi' }),
      ],
    });
    const block = composeStepContext(session);
    expect(block).toContain('✓ Step 1: Fast (done, 1:30)');
  });

  it('formats elapsed time above one hour as MM:SS (no hour rollover)', () => {
    // 3700s = 61 min 40s → 61:40
    const session = makeSession({
      current_step: 2,
      steps: [
        makeStep({
          n: 1,
          title: 'Long',
          status: 'done',
          started_at: 0,
          completed_at: 3_700_000,
        }),
        makeStep({ n: 2, title: 'Now', status: 'now', body_excerpt: 'hi' }),
      ],
    });
    const block = composeStepContext(session);
    expect(block).toContain('✓ Step 1: Long (done, 61:40)');
  });

  it('omits the elapsed marker when started_at or completed_at is null', () => {
    const session = makeSession({
      current_step: 2,
      steps: [
        makeStep({
          n: 1,
          title: 'Half',
          status: 'done',
          started_at: 1000,
          completed_at: null,
        }),
        makeStep({ n: 2, title: 'Now', status: 'now', body_excerpt: 'hi' }),
      ],
    });
    const block = composeStepContext(session);
    expect(block).toContain('✓ Step 1: Half (done)');
    expect(block).not.toContain('(done, ');
  });

  it('omits the "Step N body" section but keeps the transitions tape when current_step exceeds total_steps', () => {
    const session = makeSession({
      current_step: 3,
      total_steps: 2,
      status: 'complete',
      steps: [
        makeStep({
          n: 1,
          title: 'First',
          status: 'done',
          started_at: 0,
          completed_at: 60_000,
        }),
        makeStep({
          n: 2,
          title: 'Second',
          status: 'done',
          started_at: 60_000,
          completed_at: 120_000,
        }),
      ],
    });
    const block = composeStepContext(session);
    expect(block.startsWith('[workflow_step_context current_step="3" total_steps="2"]')).toBe(true);
    expect(block).not.toContain('body (from the workflow author):');
    expect(block).toContain('Recent step transitions:');
    expect(block).toContain('✓ Step 1: First (done, 1:00)');
    expect(block).toContain('✓ Step 2: Second (done, 1:00)');
    expect(block.endsWith('[/workflow_step_context]')).toBe(true);
  });

  it('says "You are currently on Step N" for the active step header', () => {
    const session = makeSession({
      current_step: 2,
      steps: [
        makeStep({ n: 1, title: 'Audit', status: 'done' }),
        makeStep({ n: 2, title: 'Decide', status: 'now', body_excerpt: 'pick a tool' }),
        makeStep({ n: 3, title: 'Build', status: 'todo' }),
      ],
    });
    const block = composeStepContext(session);
    expect(block).toContain('You are currently on Step 2: "Decide".');
  });
});
