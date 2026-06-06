/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tests for `dispatchAutonomousStep` - the v1 implementation of SPEC §11's
 * Run-autonomously path. Verifies the happy path (child conversation
 * spawned, first directive sent, parent step flipped to `now` with
 * `source='worker'`, telemetry fired, dispatchId returned) plus the two
 * fast-fail cases (parent session missing; step index out of range).
 *
 * The completion-listener side (turnCompleted → recordAutonomousCompletion
 * + transition to `done`) lives in `initBridge.ts` and is intentionally
 * exercised by the W6 E2E rather than mocked here.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { StepState, WorkflowSession } from '@/common/types/workflowTypes';
import type { TChatConversation } from '@/common/config/storage';
import type { IAgentManager } from '@process/task/IAgentManager';
import type { IWorkerTaskManager } from '@process/task/IWorkerTaskManager';
import {
  dispatchAutonomousStep,
  type AutonomousDispatchDeps,
} from '@process/services/workflow/dispatchAutonomousStep';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeStep(over: Partial<StepState> = {}): StepState {
  return {
    n: 1,
    title: 'Audit the thing',
    body_excerpt: 'Look at the thing and write down what you found.',
    status: 'todo',
    started_at: null,
    completed_at: null,
    eta_seconds: null,
    eta_source: null,
    autonomous_run: null,
    ...over,
  };
}

function makeSession(over: Partial<WorkflowSession> = {}): WorkflowSession {
  return {
    id: 'sess-1',
    workflow_name: 'demo',
    workflow_title: 'Demo Workflow',
    conversation_id: 'parent-conv-1',
    current_step: 1,
    total_steps: 2,
    steps: [makeStep({ n: 1 }), makeStep({ n: 2, title: 'Ship the thing' })],
    skills: [],
    asks: [],
    status: 'active',
    palette: 'orange',
    category: 'Business Operations',
    created_at: 0,
    updated_at: 0,
    completed_at: null,
    ...over,
  };
}

function makeParentConversation(over: Partial<TChatConversation> = {}): TChatConversation {
  return {
    id: 'parent-conv-1',
    type: 'acp',
    name: 'Demo Workflow',
    createTime: 0,
    modifyTime: 0,
    extra: { workspace: '', backend: 'claude' },
    ...over,
  } as unknown as TChatConversation;
}

// ---------------------------------------------------------------------------
// Fake deps
// ---------------------------------------------------------------------------

type Fakes = {
  deps: AutonomousDispatchDeps;
  workflowSessionService: {
    findById: Mock;
    recordAutonomousDispatch: Mock;
    applyStepTransition: Mock;
    recordAutonomousCompletion: Mock;
  };
  conversationService: {
    getConversation: Mock;
    createConversation: Mock;
  };
  workerTaskManager: {
    getOrBuildTask: Mock;
  };
  telemetry: { record: Mock };
  taskSend: Mock;
};

function buildFakes(opts: {
  parentSession?: WorkflowSession | null;
  /** Pass `null` to omit the parent conversation (simulates a deleted row). */
  parentConv?: TChatConversation | null;
  childConvId?: string;
} = {}): Fakes {
  const parentSession =
    opts.parentSession === undefined ? makeSession() : opts.parentSession;
  const parentConv =
    opts.parentConv === undefined
      ? makeParentConversation()
      : opts.parentConv === null
        ? undefined
        : opts.parentConv;
  const childConvId = opts.childConvId ?? 'child-conv-1';

  const findById = vi.fn(async (_id: string) => parentSession);
  const recordAutonomousDispatch = vi.fn(async () => parentSession);
  const applyStepTransition = vi.fn(async () => parentSession);
  const recordAutonomousCompletion = vi.fn(async () => parentSession);
  const getDefaultModel = vi.fn(async () => ({
    id: 'anthropic',
    platform: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKey: 'test-key',
    useModel: 'claude-sonnet-4-5',
  }));
  const getConversation = vi.fn(async (_id: string) => parentConv);
  const createConversation = vi.fn(async () => ({
    id: childConvId,
    type: 'acp',
    name: 'child',
    createTime: 0,
    modifyTime: 0,
  } as unknown as TChatConversation));
  const taskSend = vi.fn(async (_data: unknown) => undefined);
  const fakeTask = {
    type: 'acp',
    status: 'pending',
    workspace: '',
    conversation_id: childConvId,
    lastActivityAt: 0,
    sendMessage: taskSend,
    stop: vi.fn(),
    confirm: vi.fn(),
    getConfirmations: vi.fn(() => []),
    kill: vi.fn(),
  } as unknown as IAgentManager;
  const getOrBuildTask = vi.fn(async (_id: string) => fakeTask);
  const record = vi.fn(async () => undefined);

  const deps: AutonomousDispatchDeps = {
    workflowSessionService: {
      findById,
      recordAutonomousDispatch,
      applyStepTransition,
      recordAutonomousCompletion,
    } as unknown as AutonomousDispatchDeps['workflowSessionService'],
    conversationService: {
      getConversation,
      createConversation,
    } as unknown as AutonomousDispatchDeps['conversationService'],
    workerTaskManager: { getOrBuildTask } as unknown as IWorkerTaskManager,
    telemetry: { record } as unknown as AutonomousDispatchDeps['telemetry'],
    getDefaultModel: getDefaultModel as unknown as AutonomousDispatchDeps['getDefaultModel'],
  };

  return {
    deps,
    workflowSessionService: {
      findById,
      recordAutonomousDispatch,
      applyStepTransition,
      recordAutonomousCompletion,
    },
    conversationService: { getConversation, createConversation },
    workerTaskManager: { getOrBuildTask },
    telemetry: { record },
    taskSend,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('dispatchAutonomousStep', () => {
  it('happy path: spawns child conversation, sends directive, flips parent step, fires telemetry', async () => {
    const fakes = buildFakes();
    const result = await dispatchAutonomousStep(
      { parentSessionId: 'sess-1', stepN: 1 },
      fakes.deps
    );

    expect(result.dispatchId).toBeTruthy();
    expect(result.childConversationId).toBe('child-conv-1');

    // Parent session was looked up exactly once.
    expect(fakes.workflowSessionService.findById).toHaveBeenCalledWith('sess-1');

    // Child conversation created with the parent's backend type + model.
    expect(fakes.conversationService.createConversation).toHaveBeenCalledTimes(1);
    const createArg = fakes.conversationService.createConversation.mock.calls[0][0];
    expect(createArg.type).toBe('acp');
    expect(createArg.model.useModel).toBe('claude-sonnet-4-5');
    expect(createArg.name).toContain('Step 1');
    expect(createArg.extra.autonomousDispatch).toMatchObject({
      parentWorkflowSessionId: 'sess-1',
      stepN: 1,
      dispatchId: result.dispatchId,
    });

    // Directive sent to the child agent.
    expect(fakes.workerTaskManager.getOrBuildTask).toHaveBeenCalledWith('child-conv-1');
    expect(fakes.taskSend).toHaveBeenCalledTimes(1);
    const sendArg = fakes.taskSend.mock.calls[0][0] as { input: string; conversation_id: string };
    expect(sendArg.conversation_id).toBe('child-conv-1');
    expect(sendArg.input).toContain('step 1');
    expect(sendArg.input).toContain('Audit the thing');
    expect(sendArg.input).toContain('Look at the thing');

    // Parent step flipped to `now` with worker source + dispatch id.
    expect(fakes.workflowSessionService.recordAutonomousDispatch).toHaveBeenCalledWith(
      'sess-1',
      1,
      result.dispatchId
    );
    expect(fakes.workflowSessionService.applyStepTransition).toHaveBeenCalledWith(
      'sess-1',
      expect.objectContaining({
        step_n: 1,
        status: 'now',
        source: 'worker',
        dispatch_id: result.dispatchId,
      })
    );

    // Telemetry emitted.
    expect(fakes.telemetry.record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'workflow.autonomous_step_dispatched',
        metadata: expect.objectContaining({
          session_id: 'sess-1',
          step_n: 1,
          dispatch_id: result.dispatchId,
          child_conversation_id: 'child-conv-1',
        }),
      })
    );
  });

  it('propagates the parent backend identity into the child conversation (FINDING-2 regression)', async () => {
    // Without this, the child ACP session starts with `backend: undefined` and
    // fails to connect ("Starting session with backend undefined") - the step
    // never runs. The parent here is a claude ACP conversation.
    const fakes = buildFakes({
      parentConv: makeParentConversation({
        extra: {
          workspace: '',
          backend: 'claude',
          cliPath: 'claude',
          agentName: 'Claude Code',
          sessionMode: 'bypassPermissions',
        },
      } as unknown as Partial<TChatConversation>),
    });

    await dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 1 }, fakes.deps);

    const createArg = fakes.conversationService.createConversation.mock.calls[0][0];
    expect(createArg.extra.backend).toBe('claude');
    expect(createArg.extra.cliPath).toBe('claude');
    expect(createArg.extra.agentName).toBe('Claude Code');
    expect(createArg.extra.sessionMode).toBe('bypassPermissions');
  });

  it('records `running` BEFORE sending, so a hung worker stays watchdog-visible (FINDING-2b)', async () => {
    // sendMessage awaits the whole agent turn; if `running` were recorded after,
    // a hung turn would leave the step `todo`/`autonomous_run=null` - invisible to
    // the 30-min stalled-step watchdog. Running must be persisted first.
    const fakes = buildFakes();
    const order: string[] = [];
    fakes.workflowSessionService.recordAutonomousDispatch.mockImplementation(async () => {
      order.push('running');
      return makeSession();
    });
    fakes.taskSend.mockImplementation(async () => {
      order.push('send');
    });

    await dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 1 }, fakes.deps);

    expect(order).toEqual(['running', 'send']);
  });

  it('marks the step errored (fail-fast) when the worker send throws (FINDING-2b)', async () => {
    const fakes = buildFakes();
    fakes.taskSend.mockRejectedValueOnce(new Error('session failed to start'));

    await expect(
      dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 1 }, fakes.deps)
    ).rejects.toThrow(/session failed to start/);

    // First flipped to running, then errored on the send failure.
    expect(fakes.workflowSessionService.recordAutonomousDispatch).toHaveBeenCalled();
    expect(fakes.workflowSessionService.recordAutonomousCompletion).toHaveBeenCalledWith(
      'sess-1',
      1,
      false
    );
    expect(fakes.workflowSessionService.applyStepTransition).toHaveBeenCalledWith(
      'sess-1',
      expect.objectContaining({ step_n: 1, status: 'errored', source: 'worker' })
    );
  });

  it('refuses to dispatch a step that already has a running worker (W2 double-dispatch guard)', async () => {
    const session = makeSession({
      steps: [
        makeStep({ n: 1, status: 'now', autonomous_run: { dispatch_id: 'd0', started_at: 1, state: 'running' } }),
        makeStep({ n: 2 }),
      ],
    });
    const fakes = buildFakes({ parentSession: session });
    await expect(
      dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 1 }, fakes.deps)
    ).rejects.toThrow(/already has a running autonomous worker/);
    // No second worker, no state mutation.
    expect(fakes.conversationService.createConversation).not.toHaveBeenCalled();
    expect(fakes.workerTaskManager.getOrBuildTask).not.toHaveBeenCalled();
    expect(fakes.workflowSessionService.recordAutonomousDispatch).not.toHaveBeenCalled();
  });

  it('refuses to dispatch a step that is already done (W2 double-dispatch guard)', async () => {
    const session = makeSession({
      steps: [makeStep({ n: 1, status: 'done' }), makeStep({ n: 2 })],
    });
    const fakes = buildFakes({ parentSession: session });
    await expect(
      dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 1 }, fakes.deps)
    ).rejects.toThrow(/already done/);
    expect(fakes.conversationService.createConversation).not.toHaveBeenCalled();
  });

  it('throws when the parent workflow session is missing', async () => {
    const fakes = buildFakes({ parentSession: null });
    await expect(
      dispatchAutonomousStep({ parentSessionId: 'missing', stepN: 1 }, fakes.deps)
    ).rejects.toThrow(/unknown parent session missing/);
    // No side effects.
    expect(fakes.conversationService.createConversation).not.toHaveBeenCalled();
    expect(fakes.workerTaskManager.getOrBuildTask).not.toHaveBeenCalled();
    expect(fakes.workflowSessionService.applyStepTransition).not.toHaveBeenCalled();
    expect(fakes.telemetry.record).not.toHaveBeenCalled();
  });

  it('throws when the requested step number is out of range', async () => {
    const fakes = buildFakes();
    await expect(
      dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 99 }, fakes.deps)
    ).rejects.toThrow(/step 99 not found/);
    expect(fakes.conversationService.createConversation).not.toHaveBeenCalled();
    expect(fakes.workerTaskManager.getOrBuildTask).not.toHaveBeenCalled();
    expect(fakes.workflowSessionService.applyStepTransition).not.toHaveBeenCalled();
  });

  it('throws when the parent conversation cannot be found', async () => {
    const fakes = buildFakes({ parentConv: null });
    await expect(
      dispatchAutonomousStep({ parentSessionId: 'sess-1', stepN: 1 }, fakes.deps)
    ).rejects.toThrow(/parent conversation parent-conv-1 not found/);
  });
});
