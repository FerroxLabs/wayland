import { describe, it, expect, vi } from 'vitest';
import { sweepStalledAutonomousSteps } from '@process/services/workflow/autonomousWatchdog';
import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';

const NOW = 1_000_000_000_000;
const MIN = 60 * 1000;

function makeStep(over: Partial<StepState> & { n: number }): StepState {
  return {
    n: over.n,
    title: `Step ${over.n}`,
    body_excerpt: '',
    status: 'now',
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
    ...over,
  };
}

function makeSession(steps: StepState[], id = 'sess-1'): { session: WorkflowSession; conversation_preview: string } {
  return {
    conversation_preview: '',
    session: {
      id,
      workflow_name: 'wf',
      workflow_title: 'WF',
      conversation_id: 'conv',
      current_step: 1,
      total_steps: steps.length,
      steps,
      skills: [],
      asks: [],
      status: 'active',
      palette: null,
      category: null,
      created_at: NOW,
      updated_at: NOW,
      completed_at: null,
      begin_sent_at: NOW,
    },
  };
}

function makeService(active: Array<{ session: WorkflowSession; conversation_preview: string }>) {
  return {
    findAllActive: vi.fn(() => Promise.resolve(active)),
    recordAutonomousCompletion: vi.fn(() => Promise.resolve({} as WorkflowSession)),
    applyStepTransition: vi.fn(() => Promise.resolve({} as WorkflowSession)),
  };
}

describe('sweepStalledAutonomousSteps', () => {
  it('errors-out a step still running past the threshold', async () => {
    const step = makeStep({
      n: 1,
      autonomous_run: { dispatch_id: 'd1', started_at: NOW - 31 * MIN, state: 'running' },
    });
    const service = makeService([makeSession([step])]);

    const swept = await sweepStalledAutonomousSteps(service, 30 * MIN, NOW);

    expect(service.recordAutonomousCompletion).toHaveBeenCalledWith('sess-1', 1, false);
    expect(service.applyStepTransition).toHaveBeenCalledWith('sess-1', {
      step_n: 1,
      status: 'errored',
      source: 'worker',
      dispatch_id: 'd1',
      timestamp: NOW,
    });
    expect(swept).toEqual([{ sessionId: 'sess-1', stepN: 1, dispatchId: 'd1' }]);
  });

  it('leaves a freshly dispatched running step alone', async () => {
    const step = makeStep({ n: 1, autonomous_run: { dispatch_id: 'd1', started_at: NOW - 1 * MIN, state: 'running' } });
    const service = makeService([makeSession([step])]);

    const swept = await sweepStalledAutonomousSteps(service, 30 * MIN, NOW);

    expect(service.recordAutonomousCompletion).not.toHaveBeenCalled();
    expect(service.applyStepTransition).not.toHaveBeenCalled();
    expect(swept).toEqual([]);
  });

  it('ignores non-running autonomous_run and steps without a dispatch', async () => {
    const done = makeStep({ n: 1, autonomous_run: { dispatch_id: 'd1', started_at: NOW - 99 * MIN, state: 'done' } });
    const idle = makeStep({ n: 2, autonomous_run: null });
    const service = makeService([makeSession([done, idle])]);

    const swept = await sweepStalledAutonomousSteps(service, 30 * MIN, NOW);

    expect(service.recordAutonomousCompletion).not.toHaveBeenCalled();
    expect(swept).toEqual([]);
  });

  it('continues sweeping after one transition throws', async () => {
    const s1 = makeStep({ n: 1, autonomous_run: { dispatch_id: 'd1', started_at: NOW - 40 * MIN, state: 'running' } });
    const s2 = makeStep({ n: 1, autonomous_run: { dispatch_id: 'd2', started_at: NOW - 40 * MIN, state: 'running' } });
    const service = makeService([makeSession([s1], 'sess-1'), makeSession([s2], 'sess-2')]);
    service.recordAutonomousCompletion.mockImplementationOnce(() => Promise.reject(new Error('db down')));

    const swept = await sweepStalledAutonomousSteps(service, 30 * MIN, NOW);

    // First session threw; second still processed.
    expect(swept).toEqual([{ sessionId: 'sess-2', stepN: 1, dispatchId: 'd2' }]);
  });
});
