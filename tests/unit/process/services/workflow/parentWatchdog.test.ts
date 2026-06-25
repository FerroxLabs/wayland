/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for the PARENT-run stall watchdog (Phase 2b.3). Mirrors the
 * autonomousWatchdog test shape. A parent step stuck `now` past the threshold
 * with NO autonomous_run (the crash-mid-turn case where no event ever fires)
 * is surfaced by parking the run at `awaiting_input`.
 */

import { describe, expect, it, vi } from 'vitest';
import { sweepStalledParentRuns } from '@process/services/workflow/parentWatchdog';
import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';

const NOW = 1_000_000_000_000;
const MIN = 60 * 1000;

function makeStep(over: Partial<StepState> & { n: number }): StepState {
  return {
    n: over.n,
    title: `Step ${over.n}`,
    body_excerpt: '',
    status: 'todo',
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
    ...over,
  };
}

function makeSession(
  over: Partial<WorkflowSession> & { steps: StepState[] },
  id = 'sess-1'
): { session: WorkflowSession; conversation_preview: string } {
  return {
    conversation_preview: '',
    session: {
      id,
      workflow_name: 'wf',
      workflow_title: 'WF',
      conversation_id: 'conv',
      current_step: 1,
      total_steps: over.steps.length,
      skills: [],
      asks: [],
      status: 'active',
      palette: null,
      category: null,
      created_at: NOW,
      updated_at: NOW,
      completed_at: null,
      begin_sent_at: NOW,
      run_mode: 'running',
      interactivity: 'auto',
      ...over,
    },
  };
}

function makeService(active: Array<{ session: WorkflowSession; conversation_preview: string }>) {
  return {
    findAllActive: vi.fn(() => Promise.resolve(active)),
    setRunMode: vi.fn(() => Promise.resolve({} as WorkflowSession)),
  };
}

describe('sweepStalledParentRuns', () => {
  it('parks a parent run whose `now` step has been stalled past the threshold', async () => {
    const stalled = makeStep({ n: 1, status: 'now', started_at: NOW - 31 * MIN });
    const service = makeService([makeSession({ steps: [stalled], updated_at: NOW - 31 * MIN })]);

    const swept = await sweepStalledParentRuns(service, 30 * MIN, NOW);

    expect(service.setRunMode).toHaveBeenCalledWith('sess-1', 'awaiting_input');
    expect(swept).toEqual([{ sessionId: 'sess-1', stepN: 1 }]);
  });

  it('leaves a freshly started `now` step alone', async () => {
    const fresh = makeStep({ n: 1, status: 'now', started_at: NOW - 1 * MIN });
    const service = makeService([makeSession({ steps: [fresh], updated_at: NOW - 1 * MIN })]);

    const swept = await sweepStalledParentRuns(service, 30 * MIN, NOW);

    expect(service.setRunMode).not.toHaveBeenCalled();
    expect(swept).toEqual([]);
  });

  it('ignores a `now` step that has an autonomous_run (autonomousWatchdog owns it)', async () => {
    const auto = makeStep({
      n: 1,
      status: 'now',
      started_at: NOW - 99 * MIN,
      autonomous_run: { dispatch_id: 'd1', started_at: NOW - 99 * MIN, state: 'running' },
    });
    const service = makeService([makeSession({ steps: [auto], updated_at: NOW - 99 * MIN })]);

    const swept = await sweepStalledParentRuns(service, 30 * MIN, NOW);

    expect(service.setRunMode).not.toHaveBeenCalled();
    expect(swept).toEqual([]);
  });

  it('ignores a non-running session', async () => {
    const stalled = makeStep({ n: 1, status: 'now', started_at: NOW - 99 * MIN });
    const service = makeService([makeSession({ steps: [stalled], run_mode: 'paused', updated_at: NOW - 99 * MIN })]);

    const swept = await sweepStalledParentRuns(service, 30 * MIN, NOW);

    expect(service.setRunMode).not.toHaveBeenCalled();
    expect(swept).toEqual([]);
  });

  it('continues after one setRunMode throws', async () => {
    const s1 = makeStep({ n: 1, status: 'now', started_at: NOW - 40 * MIN });
    const s2 = makeStep({ n: 1, status: 'now', started_at: NOW - 40 * MIN });
    const service = makeService([
      makeSession({ steps: [s1], updated_at: NOW - 40 * MIN }, 'sess-1'),
      makeSession({ steps: [s2], updated_at: NOW - 40 * MIN }, 'sess-2'),
    ]);
    service.setRunMode.mockImplementationOnce(() => Promise.reject(new Error('db down')));

    const swept = await sweepStalledParentRuns(service, 30 * MIN, NOW);

    expect(swept).toEqual([{ sessionId: 'sess-2', stepN: 1 }]);
  });
});
