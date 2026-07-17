/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AcpBackend, AcpModelInfo } from '@/common/types/acpTypes';

vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));

import AcpAgentManager from '@process/task/AcpAgentManager';

type FakeAgent = {
  start: ReturnType<typeof vi.fn>;
  kill: ReturnType<typeof vi.fn>;
  getModelInfo: ReturnType<typeof vi.fn>;
  getConfigOptions: ReturnType<typeof vi.fn>;
  setModelByConfigOption: ReturnType<typeof vi.fn>;
};

type FakeRuntime = {
  agent: FakeAgent;
  routing: 'flux' | 'native' | 'unknown';
  sessionId: string | null;
  activate: ReturnType<typeof vi.fn>;
};

function modelInfo(currentModelId: string, availableModelIds: string[] = [currentModelId]): AcpModelInfo {
  return {
    currentModelId,
    currentModelLabel: currentModelId,
    availableModels: availableModelIds.map((id) => ({ id, label: id })),
    canSwitch: true,
    source: 'models',
    sourceDetail: 'acp-models',
    confirmationSource: 'session-models',
  };
}

function makeAgent(info: AcpModelInfo): FakeAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    kill: vi.fn().mockResolvedValue(undefined),
    getModelInfo: vi.fn(() => info),
    getConfigOptions: vi.fn(() => []),
    setModelByConfigOption: vi.fn().mockResolvedValue(info),
  };
}

function makeRuntime(info: AcpModelInfo, routing: FakeRuntime['routing'] = 'native'): FakeRuntime {
  return {
    agent: makeAgent(info),
    routing,
    sessionId: 'candidate-session',
    activate: vi.fn(),
  };
}

function makeManager(backend: AcpBackend = 'codex' as AcpBackend) {
  const manager = Object.create(AcpAgentManager.prototype) as AcpAgentManager;
  const internals = manager as unknown as Record<string, unknown>;
  const oldAgent = makeAgent(modelInfo('gpt-old'));
  const runtime = makeRuntime(modelInfo('gpt-5.6-sol[ultra]'));

  Object.assign(internals, {
    options: {
      backend,
      conversation_id: 'test-convo',
      workspace: '/tmp/workspace',
      currentModelId: 'gpt-old',
    },
    conversation_id: 'test-convo',
    workspace: '/tmp/workspace',
    agent: oldAgent,
    bootstrap: Promise.resolve(oldAgent),
    bootstrapping: false,
    currentMode: 'default',
    requestedModelId: 'gpt-old',
    confirmedModelId: 'gpt-old',
    previousConfirmedModelId: null,
    pendingModelId: null,
    persistedModelId: 'gpt-old',
    modelSelectionState: 'confirmed',
    modelBlockedFailure: null,
    modelSwitchGeneration: 0,
    modelTransition: null,
    modelPromptLease: Promise.resolve(),
    lastConfirmationSource: 'session-models',
    lastModelSwitchRestarted: false,
    lastRouting: 'native',
  });

  internals.computeFluxRouting = vi.fn().mockResolvedValue({ routing: 'native', env: {}, stripKeys: [] });
  internals.loadLatestSpawnData = vi.fn(async (modelId: string | null) => ({
    ...(internals.options as Record<string, unknown>),
    currentModelId: modelId ?? undefined,
  }));
  internals.createAgentRuntime = vi.fn().mockResolvedValue(runtime);
  internals.commitModelSelection = vi.fn().mockResolvedValue(undefined);
  internals.emitModelInfo = vi.fn();

  return {
    manager,
    internals,
    oldAgent,
    runtime,
    createAgentRuntime: internals.createAgentRuntime as ReturnType<typeof vi.fn>,
    commitModelSelection: internals.commitModelSelection as ReturnType<typeof vi.fn>,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('AcpAgentManager strict model transaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stages native Codex with CODEX_CONFIG intent and persists only after exact base and effort confirmation', async () => {
    const { manager, runtime, oldAgent, createAgentRuntime, commitModelSelection } = makeManager();
    runtime.agent.getConfigOptions.mockReturnValue([
      {
        id: 'reasoning_effort',
        name: 'Reasoning effort',
        category: 'thought_level',
        type: 'select',
        currentValue: 'ultra',
      },
    ]);

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({
      ok: true,
      requestedModelId: 'gpt-5.6-sol[ultra]',
      confirmedModelId: 'gpt-5.6-sol[ultra]',
      restarted: true,
    });
    expect(createAgentRuntime).toHaveBeenCalledWith(
      expect.objectContaining({ currentModelId: 'gpt-5.6-sol[ultra]' }),
      true
    );
    expect(oldAgent.setModelByConfigOption).not.toHaveBeenCalled();
    expect(runtime.agent.setModelByConfigOption).toHaveBeenCalledWith('gpt-5.6-sol[ultra]');
    expect(commitModelSelection).toHaveBeenCalledWith('gpt-5.6-sol[ultra]', 'candidate-session', expect.any(Number));
  });

  it('awaits the staged Codex correlated provider confirmation before committing', async () => {
    const { manager, runtime, commitModelSelection } = makeManager();
    const initial = modelInfo('gpt-5.5[ultra]', ['gpt-5.5[ultra]', 'gpt-5.6-sol[ultra]']);
    const confirmed = modelInfo('gpt-5.6-sol[ultra]', ['gpt-5.5[ultra]', 'gpt-5.6-sol[ultra]']);
    const providerConfirmation = deferred<AcpModelInfo>();
    runtime.agent.getModelInfo.mockReturnValue(initial);
    runtime.agent.setModelByConfigOption.mockImplementation(async () => {
      const next = await providerConfirmation.promise;
      runtime.agent.getModelInfo.mockReturnValue(next);
      return next;
    });

    const selection = manager.setModel('gpt-5.6-sol[ultra]');
    await vi.waitFor(() => expect(runtime.agent.setModelByConfigOption).toHaveBeenCalledOnce());
    expect(commitModelSelection).not.toHaveBeenCalled();

    providerConfirmation.resolve(confirmed);

    await expect(selection).resolves.toMatchObject({ ok: true, confirmedModelId: 'gpt-5.6-sol[ultra]' });
    expect(commitModelSelection).toHaveBeenCalledOnce();
  });

  it('cancels a staged Codex confirmation promptly when a newer selection supersedes it', async () => {
    vi.useFakeTimers();
    try {
      const { manager, internals, createAgentRuntime } = makeManager();
      const neverConfirmed = deferred<AcpModelInfo>();
      const firstRuntime = makeRuntime(
        modelInfo('gpt-5.5[high]', ['gpt-5.5[high]', 'gpt-first[high]', 'gpt-second[high]'])
      );
      firstRuntime.agent.setModelByConfigOption.mockReturnValue(neverConfirmed.promise);
      const secondRuntime = makeRuntime(modelInfo('gpt-second[high]'));
      createAgentRuntime.mockReset().mockResolvedValueOnce(firstRuntime).mockResolvedValueOnce(secondRuntime);

      const first = manager.setModel('gpt-first[high]');
      await vi.advanceTimersByTimeAsync(0);
      expect(firstRuntime.agent.setModelByConfigOption).toHaveBeenCalledOnce();

      const second = manager.setModel('gpt-second[high]');
      await vi.advanceTimersByTimeAsync(50);

      await expect(first).resolves.toMatchObject({ ok: false, code: 'model_rejected' });
      await expect(second).resolves.toMatchObject({ ok: true, confirmedModelId: 'gpt-second[high]' });
      expect(firstRuntime.agent.kill).toHaveBeenCalledOnce();
      expect(internals.agent).toBe(secondRuntime.agent);
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits for late Codex effort state after the correlated base-model confirmation', async () => {
    vi.useFakeTimers();
    try {
      const { manager, runtime, commitModelSelection } = makeManager();
      const confirmedBase = modelInfo('gpt-5.6-sol', ['gpt-5.6-sol']);
      runtime.agent.getModelInfo.mockReturnValue(confirmedBase);
      runtime.agent.setModelByConfigOption.mockResolvedValue(confirmedBase);
      runtime.agent.getConfigOptions.mockReturnValue([]);

      const selection = manager.setModel('gpt-5.6-sol[ultra]');
      await vi.advanceTimersByTimeAsync(25);
      expect(commitModelSelection).not.toHaveBeenCalled();

      runtime.agent.getConfigOptions.mockReturnValue([
        {
          id: 'reasoning_effort',
          name: 'Reasoning effort',
          category: 'thought_level',
          type: 'select',
          currentValue: 'ultra',
        },
      ]);
      await vi.advanceTimersByTimeAsync(50);

      await expect(selection).resolves.toMatchObject({ ok: true, confirmedModelId: 'gpt-5.6-sol[ultra]' });
      expect(commitModelSelection).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits for a late authoritative Claude startup confirmation', async () => {
    vi.useFakeTimers();
    try {
      const { manager, runtime, commitModelSelection } = makeManager('claude' as AcpBackend);
      const unavailable: AcpModelInfo = {
        ...modelInfo('claude-sonnet-4-20250514'),
        currentModelId: null,
        currentModelLabel: null,
        confirmationSource: undefined,
      };
      runtime.agent.getModelInfo.mockReturnValue(unavailable);

      const selection = manager.setModel('claude-sonnet-4-20250514');
      await vi.advanceTimersByTimeAsync(25);
      expect(commitModelSelection).not.toHaveBeenCalled();

      runtime.agent.getModelInfo.mockReturnValue(modelInfo('claude-sonnet-4-20250514'));
      await vi.advanceTimersByTimeAsync(50);

      await expect(selection).resolves.toMatchObject({
        ok: true,
        confirmedModelId: 'claude-sonnet-4-20250514',
      });
      expect(runtime.agent.setModelByConfigOption).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('times out a staged Claude runtime that never reports authoritative model state', async () => {
    vi.useFakeTimers();
    try {
      const { manager, runtime, commitModelSelection } = makeManager('claude' as AcpBackend);
      runtime.agent.getModelInfo.mockReturnValue({
        ...modelInfo('claude-sonnet-4-20250514'),
        currentModelId: null,
        currentModelLabel: null,
        confirmationSource: undefined,
      });

      const selection = manager.setModel('claude-sonnet-4-20250514');
      await vi.advanceTimersByTimeAsync(60_000);

      await expect(selection).resolves.toMatchObject({ ok: false, code: 'model_switch_timeout' });
      expect(commitModelSelection).not.toHaveBeenCalled();
      expect(runtime.agent.kill).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the prior runtime and persistence when the candidate reports a different model', async () => {
    const { manager, internals, runtime, oldAgent, commitModelSelection } = makeManager();
    runtime.agent.getModelInfo.mockReturnValue(modelInfo('gpt-5.5[ultra]', ['gpt-5.5[ultra]', 'gpt-5.6-sol[ultra]']));

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({ ok: false, code: 'model_mismatch', previousConfirmedModelId: 'gpt-old' });
    expect(internals.agent).toBe(oldAgent);
    expect(commitModelSelection).not.toHaveBeenCalled();
    expect(runtime.agent.kill).toHaveBeenCalledOnce();
    expect(internals.persistedModelId).toBe('gpt-old');
  });

  it('rejects a candidate when authoritative provider model sources disagree', async () => {
    const { manager, internals, runtime, oldAgent, commitModelSelection } = makeManager();
    runtime.agent.getModelInfo.mockReturnValue({
      ...modelInfo('gpt-5.6-sol[ultra]', ['gpt-5.6-sol[ultra]', 'gpt-5.5[ultra]']),
      selectionState: 'blocked',
      requestedModelId: 'gpt-5.6-sol[ultra]',
      selectionFailureCode: 'model_mismatch',
    });

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({ ok: false, code: 'model_mismatch' });
    expect(internals.agent).toBe(oldAgent);
    expect(commitModelSelection).not.toHaveBeenCalled();
    expect(runtime.agent.kill).toHaveBeenCalledOnce();
  });

  it('rejects an exact base with the wrong Codex reasoning effort', async () => {
    const { manager, runtime, commitModelSelection } = makeManager();
    runtime.agent.getModelInfo.mockReturnValue(
      modelInfo('gpt-5.6-sol[high]', ['gpt-5.6-sol[high]', 'gpt-5.6-sol[ultra]'])
    );

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({ ok: false, code: 'model_mismatch' });
    expect(commitModelSelection).not.toHaveBeenCalled();
    expect(runtime.agent.kill).toHaveBeenCalledOnce();
  });

  it('commits the candidate before swapping and kills the old runtime last', async () => {
    const { manager, runtime, oldAgent, commitModelSelection } = makeManager();

    await manager.setModel('gpt-5.6-sol[ultra]');

    expect(commitModelSelection.mock.invocationCallOrder[0]).toBeLessThan(runtime.activate.mock.invocationCallOrder[0]);
    expect(runtime.activate.mock.invocationCallOrder[0]).toBeLessThan(oldAgent.kill.mock.invocationCallOrder[0]);
  });

  it('keeps the committed candidate when activation notification throws', async () => {
    const { manager, internals, runtime, oldAgent } = makeManager();
    runtime.activate.mockImplementation(() => {
      throw new Error('listener failed');
    });

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({ ok: true, confirmedModelId: 'gpt-5.6-sol[ultra]' });
    expect(internals.agent).toBe(runtime.agent);
    expect(runtime.agent.kill).not.toHaveBeenCalled();
    expect(oldAgent.kill).toHaveBeenCalledOnce();
  });

  it('keeps the committed candidate when the confirmed-state notification throws', async () => {
    const { manager, internals, runtime, oldAgent } = makeManager();
    (internals.emitModelInfo as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('renderer disconnected');
      });

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({ ok: true, confirmedModelId: 'gpt-5.6-sol[ultra]' });
    expect(internals.agent).toBe(runtime.agent);
    expect(runtime.agent.kill).not.toHaveBeenCalled();
    expect(oldAgent.kill).toHaveBeenCalledOnce();
  });

  it('uses the captured confirmation when live model lookup throws after candidate commit', async () => {
    const { manager, internals, runtime, oldAgent } = makeManager();
    const confirmed = modelInfo('gpt-5.6-sol[ultra]');
    runtime.agent.getModelInfo
      .mockReset()
      .mockReturnValue(confirmed)
      .mockImplementationOnce(() => confirmed)
      .mockImplementationOnce(() => confirmed)
      .mockImplementationOnce(() => {
        throw new Error('late live lookup failed');
      });

    const result = await manager.setModel('gpt-5.6-sol[ultra]');

    expect(result).toMatchObject({ ok: true, confirmedModelId: 'gpt-5.6-sol[ultra]' });
    expect(internals.agent).toBe(runtime.agent);
    expect(runtime.agent.kill).not.toHaveBeenCalled();
    expect(oldAgent.kill).toHaveBeenCalledOnce();
  });

  it('keeps an in-place provider and DB commit when notification throws', async () => {
    const { manager, internals, oldAgent, commitModelSelection } = makeManager('qwen' as AcpBackend);
    oldAgent.getModelInfo.mockReturnValue(modelInfo('qwen-exact'));
    (internals.emitModelInfo as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('renderer disconnected');
      });

    const result = await manager.setModel('qwen-exact');

    expect(result).toMatchObject({ ok: true, confirmedModelId: 'qwen-exact', restarted: false });
    expect(commitModelSelection).toHaveBeenCalledOnce();
    expect(internals.modelSelectionState).toBe('confirmed');
    expect(oldAgent.kill).not.toHaveBeenCalled();
  });

  it('respawns a same-routing Flux selection instead of persisting a request echo', async () => {
    const { manager, internals, runtime, oldAgent, createAgentRuntime } = makeManager('claude' as AcpBackend);
    internals.lastRouting = 'flux';
    (internals.computeFluxRouting as ReturnType<typeof vi.fn>).mockResolvedValue({
      routing: 'flux',
      env: {},
      stripKeys: [],
    });
    runtime.routing = 'flux';
    runtime.agent.getModelInfo.mockReturnValue(modelInfo('flux-reasoning'));

    const result = await manager.setModel('flux-reasoning');

    expect(result).toMatchObject({ ok: true, confirmedModelId: 'flux-reasoning', restarted: true });
    expect(createAgentRuntime).toHaveBeenCalledOnce();
    expect(oldAgent.setModelByConfigOption).not.toHaveBeenCalled();
  });

  it('passes a full native Claude identifier unchanged to the staged runtime', async () => {
    const { manager, runtime, createAgentRuntime } = makeManager('claude' as AcpBackend);
    runtime.agent.getModelInfo.mockReturnValue(modelInfo('claude-sonnet-4-8-20260701'));

    const result = await manager.setModel('claude-sonnet-4-8-20260701');

    expect(result).toMatchObject({ ok: true, confirmedModelId: 'claude-sonnet-4-8-20260701' });
    expect(createAgentRuntime).toHaveBeenCalledWith(
      expect.objectContaining({ currentModelId: 'claude-sonnet-4-8-20260701' }),
      true
    );
  });

  it('lets the latest generation win and prevents a late candidate from persisting', async () => {
    const { manager, internals, runtime, createAgentRuntime, commitModelSelection } = makeManager();
    const firstStart = deferred<void>();
    const firstRuntime = makeRuntime(modelInfo('gpt-first[high]'));
    firstRuntime.agent.start.mockReturnValue(firstStart.promise);
    const secondRuntime = makeRuntime(modelInfo('gpt-second[high]'));
    createAgentRuntime.mockReset().mockResolvedValueOnce(firstRuntime).mockResolvedValueOnce(secondRuntime);

    const first = manager.setModel('gpt-first[high]');
    await vi.waitFor(() => expect(createAgentRuntime).toHaveBeenCalledTimes(1));
    const second = manager.setModel('gpt-second[high]');
    firstStart.resolve();

    await expect(first).resolves.toMatchObject({ ok: false, code: 'model_rejected' });
    await expect(second).resolves.toMatchObject({ ok: true, confirmedModelId: 'gpt-second[high]' });
    expect(commitModelSelection).toHaveBeenCalledTimes(1);
    expect(commitModelSelection).toHaveBeenCalledWith('gpt-second[high]', 'candidate-session', expect.any(Number));
    expect(firstRuntime.agent.kill).toHaveBeenCalledOnce();
    expect(internals.agent).toBe(secondRuntime.agent);
    expect(runtime.agent.start).not.toHaveBeenCalled();
  });

  it('does not let stale candidate cleanup overwrite the latest pending selection', async () => {
    const { manager, internals, createAgentRuntime } = makeManager();
    const firstKill = deferred<void>();
    const secondStart = deferred<void>();
    const firstRuntime = makeRuntime(modelInfo('gpt-wrong[high]', ['gpt-wrong[high]', 'gpt-first[high]']));
    firstRuntime.agent.kill.mockReturnValue(firstKill.promise);
    const secondRuntime = makeRuntime(modelInfo('gpt-second[high]'));
    secondRuntime.agent.start.mockReturnValue(secondStart.promise);
    createAgentRuntime.mockReset().mockResolvedValueOnce(firstRuntime).mockResolvedValueOnce(secondRuntime);

    const first = manager.setModel('gpt-first[high]');
    await vi.waitFor(() => expect(firstRuntime.agent.kill).toHaveBeenCalledOnce());
    const second = manager.setModel('gpt-second[high]');
    firstKill.resolve();

    await expect(first).resolves.toMatchObject({ ok: false, code: 'model_rejected' });
    await vi.waitFor(() => expect(createAgentRuntime).toHaveBeenCalledTimes(2));
    expect(internals.modelSelectionState).toBe('pending');
    expect(internals.modelBlockedFailure).toBeNull();

    secondStart.resolve();
    await expect(second).resolves.toMatchObject({ ok: true, confirmedModelId: 'gpt-second[high]' });
  });

  it('starts provider default without an explicit model and clears persistence only after startup', async () => {
    const { manager, internals, createAgentRuntime, commitModelSelection } = makeManager();
    const defaultRuntime = makeRuntime(modelInfo('gpt-provider-default[medium]'));
    createAgentRuntime.mockResolvedValue(defaultRuntime);

    const result = await manager.setModel(null);

    expect(result).toMatchObject({
      ok: true,
      requestedModelId: null,
      confirmedModelId: null,
      confirmationSource: 'provider-default',
    });
    expect(createAgentRuntime).toHaveBeenCalledWith(expect.any(Object), true);
    const candidateData = createAgentRuntime.mock.calls[0][0] as { currentModelId?: string };
    expect(candidateData.currentModelId).toBeUndefined();
    expect(commitModelSelection).toHaveBeenCalledWith(null, 'candidate-session', expect.any(Number));
    expect(internals.persistedModelId).toBeNull();
  });
});
