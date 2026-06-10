/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Routing tests for `workflowBridge`. Verifies that each of the 5 wired
 * provider handlers calls into the corresponding {@link WorkflowSessionService}
 * method with the right argument shape, that `dispatchAutonomousStep` is
 * still the W5 stub (throws), and that the `updateSessionState` patch
 * dispatcher fans the union shape (`setStepStatus` / `appendAsk` /
 * `answerAsk` / `setSessionStatus`) into the right service calls.
 *
 * Spec refs: §6.1, §6.2, §6.3, §6.3.1, §6.4, §6.5.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the provider functions registered by `registerWorkflowBridge`
// without involving a real Electron IPC layer. `vi.hoisted` is required
// because `vi.mock` is hoisted above the imports - top-level `vi.fn()`s
// would not yet exist at the mock-factory call site.
const {
  startProvider,
  findActiveProvider,
  findAllActiveProvider,
  findByIdProvider,
  resolveSkillsProvider,
  updateSessionStateProvider,
  dispatchAutonomousStepProvider,
  acceptStepProvider,
  countActiveProvider,
  deleteSessionProvider,
} = vi.hoisted(() => ({
  startProvider: vi.fn(),
  findActiveProvider: vi.fn(),
  findAllActiveProvider: vi.fn(),
  findByIdProvider: vi.fn(),
  resolveSkillsProvider: vi.fn(),
  updateSessionStateProvider: vi.fn(),
  dispatchAutonomousStepProvider: vi.fn(),
  acceptStepProvider: vi.fn(),
  countActiveProvider: vi.fn(),
  deleteSessionProvider: vi.fn(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    workflow: {
      start: { provider: startProvider },
      findActive: { provider: findActiveProvider },
      findAllActive: { provider: findAllActiveProvider },
      findById: { provider: findByIdProvider },
      resolveSkills: { provider: resolveSkillsProvider },
      updateSessionState: { provider: updateSessionStateProvider },
      dispatchAutonomousStep: { provider: dispatchAutonomousStepProvider },
      acceptStep: { provider: acceptStepProvider },
      countActive: { provider: countActiveProvider },
      deleteSession: { provider: deleteSessionProvider },
    },
  },
}));

import type { WorkflowSession } from '@/common/types/workflowTypes';
import { __resetWorkflowBridgeForTests, initWorkflowBridge } from '@process/bridge/workflowBridge';

type ProviderHandler<I, O> = (input: I) => Promise<O>;

function captured<I, O>(fn: ReturnType<typeof vi.fn>): ProviderHandler<I, O> {
  const call = fn.mock.calls[fn.mock.calls.length - 1];
  expect(call).toBeTruthy();
  return call[0] as ProviderHandler<I, O>;
}

function makeFakeSession(overrides: Partial<WorkflowSession> = {}): WorkflowSession {
  return {
    id: 'sess-1',
    workflow_name: 'feature-dev',
    workflow_title: 'Feature Dev',
    conversation_id: 'conv-1',
    current_step: 1,
    total_steps: 3,
    steps: [],
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
    ...overrides,
  };
}

function makeFakeService() {
  return {
    start: vi.fn(),
    findActive: vi.fn(),
    findAllActive: vi.fn(),
    findById: vi.fn(),
    resolveSkills: vi.fn(),
    applyStepTransition: vi.fn(),
    appendAsk: vi.fn(),
    answerAsk: vi.fn(),
    completeSession: vi.fn(),
    endSession: vi.fn(),
    markBeginSent: vi.fn(),
    deleteSession: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    setRunMode: vi.fn(),
    setInteractivity: vi.fn(),
    backtrackToStep: vi.fn(),
    acceptStep: vi.fn(),
  };
}

describe('workflowBridge - handler routing', () => {
  beforeEach(() => {
    __resetWorkflowBridgeForTests();
    startProvider.mockReset();
    findActiveProvider.mockReset();
    findAllActiveProvider.mockReset();
    findByIdProvider.mockReset();
    resolveSkillsProvider.mockReset();
    updateSessionStateProvider.mockReset();
    dispatchAutonomousStepProvider.mockReset();
    acceptStepProvider.mockReset();
    countActiveProvider.mockReset();
    deleteSessionProvider.mockReset();
  });

  it('registers all 6 providers exactly once and is idempotent across init calls', () => {
    const svc = makeFakeService();
    initWorkflowBridge(svc as never);
    initWorkflowBridge(svc as never);
    expect(startProvider).toHaveBeenCalledTimes(1);
    expect(findActiveProvider).toHaveBeenCalledTimes(1);
    expect(findAllActiveProvider).toHaveBeenCalledTimes(1);
    expect(resolveSkillsProvider).toHaveBeenCalledTimes(1);
    expect(updateSessionStateProvider).toHaveBeenCalledTimes(1);
    expect(dispatchAutonomousStepProvider).toHaveBeenCalledTimes(1);
  });

  it('routes workflow.start to service.start forwarding the full input payload', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.start.mockResolvedValue({
      sessionId: 'sess-1',
      session,
      systemPromptDirective: 'directive',
    });
    initWorkflowBridge(svc as never);

    const fullInput = {
      workflow_name: 'feature-dev',
      backend: 'claude',
      cliPath: undefined,
      model: {
        id: 'anthropic',
        platform: 'claude',
        name: 'Claude',
        baseUrl: '',
        apiKey: '',
        useModel: 'claude-sonnet-4-5',
      },
      agentName: undefined,
      customAgentId: undefined,
      presetAssistantId: undefined,
      sessionMode: 'default',
    };

    const handler = captured<typeof fullInput, unknown>(startProvider);
    const result = await handler(fullInput);

    expect(svc.start).toHaveBeenCalledWith(fullInput);
    expect(result).toEqual({
      sessionId: 'sess-1',
      session,
      systemPromptDirective: 'directive',
    });
  });

  it('routes workflow.findActive to service.findActive and wraps the result', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.findActive.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ workflow_name: string }, { session: WorkflowSession | null }>(findActiveProvider);
    const result = await handler({ workflow_name: 'feature-dev' });

    expect(svc.findActive).toHaveBeenCalledWith('feature-dev');
    expect(result).toEqual({ session });
  });

  it('routes workflow.findAllActive to service.findAllActive and wraps the result', async () => {
    const svc = makeFakeService();
    const sessions = [{ session: makeFakeSession(), conversation_preview: 'hello' }];
    svc.findAllActive.mockResolvedValue(sessions);
    initWorkflowBridge(svc as never);

    const handler = captured<{ limit?: number }, { sessions: typeof sessions }>(findAllActiveProvider);
    const result = await handler({ limit: 5 });

    expect(svc.findAllActive).toHaveBeenCalledWith(5);
    expect(result).toEqual({ sessions });
  });

  it('routes workflow.findById to service.findById and wraps the session (returns it for any status)', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ status: 'complete', run_mode: 'done' });
    svc.findById.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string }, { session: WorkflowSession | null }>(findByIdProvider);
    const result = await handler({ sessionId: 'sess-1' });

    expect(svc.findById).toHaveBeenCalledWith('sess-1');
    expect(result).toEqual({ session });
  });

  it('routes workflow.resolveSkills to service.resolveSkills with the slug list', async () => {
    const svc = makeFakeService();
    svc.resolveSkills.mockResolvedValue({ skills: [], unresolved: ['missing'] });
    initWorkflowBridge(svc as never);

    const handler = captured<{ slugs: string[] }, unknown>(resolveSkillsProvider);
    const result = await handler({ slugs: ['a', 'missing'] });

    expect(svc.resolveSkills).toHaveBeenCalledWith(['a', 'missing']);
    expect(result).toEqual({ skills: [], unresolved: ['missing'] });
  });

  it('updateSessionState.setStepStatus dispatches to applyStepTransition with user/null defaults', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.applyStepTransition.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    const result = await handler({
      sessionId: 'sess-1',
      patch: { setStepStatus: { n: 2, status: 'done', completed_at: 1700000000000 } },
    });

    expect(svc.applyStepTransition).toHaveBeenCalledWith('sess-1', {
      step_n: 2,
      status: 'done',
      source: 'user',
      dispatch_id: null,
      timestamp: 1700000000000,
    });
    expect(result).toEqual({ session });
  });

  it('updateSessionState.setStepStatus threads an explicit parent source through', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.applyStepTransition.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({
      sessionId: 'sess-1',
      patch: { setStepStatus: { n: 3, status: 'now', source: 'parent', completed_at: 1700000000001 } },
    });

    // The renderer-supplied `source` must reach the service verbatim so the
    // stepCursor leapfrog guard (parent markers only) finally activates - it
    // was inert while the bridge hardcoded 'user'.
    expect(svc.applyStepTransition).toHaveBeenCalledWith('sess-1', {
      step_n: 3,
      status: 'now',
      source: 'parent',
      dispatch_id: null,
      timestamp: 1700000000001,
    });
  });

  it('updateSessionState.appendAsk dispatches to appendAsk', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.appendAsk.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const ask = {
      id: 'ask-1',
      step_n: 1,
      question: 'q?',
      type: 'text' as const,
      options: null,
      max: null,
      placeholder: null,
      answer: null,
      asked_at: 0,
      answered_at: null,
    };

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({ sessionId: 'sess-1', patch: { appendAsk: ask } });

    expect(svc.appendAsk).toHaveBeenCalledWith('sess-1', ask);
  });

  it('updateSessionState.answerAsk dispatches to answerAsk', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.answerAsk.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({
      sessionId: 'sess-1',
      patch: { answerAsk: { askId: 'ask-1', answer: 'yes', answered_at: 123 } },
    });

    expect(svc.answerAsk).toHaveBeenCalledWith('sess-1', 'ask-1', 'yes');
  });

  it('updateSessionState.setSessionStatus=complete dispatches to completeSession', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ status: 'complete' });
    svc.completeSession.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({ sessionId: 'sess-1', patch: { setSessionStatus: 'complete' } });

    expect(svc.completeSession).toHaveBeenCalledWith('sess-1');
  });

  it('updateSessionState.setSessionStatus=ended dispatches to endSession', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ status: 'ended' });
    svc.endSession.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({ sessionId: 'sess-1', patch: { setSessionStatus: 'ended' } });

    expect(svc.endSession).toHaveBeenCalledWith('sess-1');
  });

  it('updateSessionState.setRunMode=paused dispatches to pause', async () => {
    const svc = makeFakeService();
    svc.pause.mockResolvedValue(makeFakeSession({ run_mode: 'paused' }));
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({ sessionId: 'sess-1', patch: { setRunMode: 'paused' } });
    expect(svc.pause).toHaveBeenCalledWith('sess-1');
  });

  it('updateSessionState.setRunMode=running dispatches to resume (Continue affordance)', async () => {
    const svc = makeFakeService();
    svc.resume.mockResolvedValue(makeFakeSession({ run_mode: 'running' }));
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({ sessionId: 'sess-1', patch: { setRunMode: 'running' } });
    expect(svc.resume).toHaveBeenCalledWith('sess-1');
  });

  it('updateSessionState.setRunMode=done dispatches to setRunMode directly', async () => {
    const svc = makeFakeService();
    svc.setRunMode.mockResolvedValue(makeFakeSession({ run_mode: 'done' }));
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    await handler({ sessionId: 'sess-1', patch: { setRunMode: 'done' } });
    expect(svc.setRunMode).toHaveBeenCalledWith('sess-1', 'done');
  });

  it('updateSessionState throws on an empty patch', async () => {
    const svc = makeFakeService();
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );

    await expect(handler({ sessionId: 'sess-1', patch: {} })).rejects.toThrow(/empty or unsupported patch/);
  });

  it('updateSessionState.setBeginSent forwards the timestamp value to markBeginSent', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ begin_sent_at: 1_700_000_000_000 });
    svc.markBeginSent.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    const result = await handler({ sessionId: 'sess-1', patch: { setBeginSent: 1_700_000_000_000 } });

    // The bridge must forward the value (not ignore it) so the renderer can
    // detect whether its specific call won the cross-mount begin-send race.
    expect(svc.markBeginSent).toHaveBeenCalledWith('sess-1', 1_700_000_000_000);
    expect(result).toEqual({ session });
  });

  it('updateSessionState.setInteractivity dispatches to setInteractivity', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ interactivity: 'auto' });
    svc.setInteractivity.mockResolvedValue(session);
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    const result = await handler({ sessionId: 'sess-1', patch: { setInteractivity: 'auto' } });

    expect(svc.setInteractivity).toHaveBeenCalledWith('sess-1', 'auto');
    expect(result).toEqual({ session });
  });

  it('updateSessionState.backtrackToStep dispatches to backtrackToStep and returns the session', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ current_step: 2 });
    svc.backtrackToStep.mockResolvedValue({ session, snapshot: [] });
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; patch: Record<string, unknown> }, { session: WorkflowSession }>(
      updateSessionStateProvider
    );
    const result = await handler({ sessionId: 'sess-1', patch: { backtrackToStep: 2 } });

    expect(svc.backtrackToStep).toHaveBeenCalledWith('sess-1', 2);
    expect(result).toEqual({ session });
  });

  it('dispatchAutonomousStep without deps throws a clear "not yet wired" error', async () => {
    const svc = makeFakeService();
    // Init WITHOUT passing the dispatch deps - exercises the cold-start
    // fallback path so a renderer call that arrives before initBridge has
    // resolved the conversation service + worker manager fails loudly
    // rather than silently no-opping.
    initWorkflowBridge(svc as never);

    const handler = captured<{ sessionId: string; stepN: number }, { dispatchId: string }>(
      dispatchAutonomousStepProvider
    );
    await expect(handler({ sessionId: 'sess-1', stepN: 1 })).rejects.toThrow(/dispatch deps not yet wired/);
  });

  it('routes workflow.acceptStep to service.acceptStep and sends the directive', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession({ conversation_id: 'conv-7' });
    svc.acceptStep.mockResolvedValue({ decision: 'advance', directive: 'Proceed to step 2: Ship', session });
    const sendDirective = vi.fn(async () => undefined);
    initWorkflowBridge(svc as never, {
      conversationService: {} as never,
      workerTaskManager: {} as never,
      telemetry: {} as never,
      getDefaultModel: () => ({}) as never,
      sendDirective,
    });

    const handler = captured<{ sessionId: string }, { session: WorkflowSession }>(acceptStepProvider);
    const result = await handler({ sessionId: 'sess-1' });
    expect(svc.acceptStep).toHaveBeenCalledWith('sess-1');
    expect(sendDirective).toHaveBeenCalledWith('conv-7', 'Proceed to step 2: Ship');
    expect(result.session).toBe(session);
  });

  it('acceptStep does not send when there is no directive (terminal/complete)', async () => {
    const svc = makeFakeService();
    const session = makeFakeSession();
    svc.acceptStep.mockResolvedValue({ decision: 'complete', directive: null, session });
    const sendDirective = vi.fn(async () => undefined);
    initWorkflowBridge(svc as never, {
      conversationService: {} as never,
      workerTaskManager: {} as never,
      telemetry: {} as never,
      getDefaultModel: () => ({}) as never,
      sendDirective,
    });

    const handler = captured<{ sessionId: string }, { session: WorkflowSession }>(acceptStepProvider);
    await handler({ sessionId: 'sess-1' });
    expect(sendDirective).not.toHaveBeenCalled();
  });
});
