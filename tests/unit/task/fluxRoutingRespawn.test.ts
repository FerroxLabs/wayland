/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// AcpAgentManager pulls a large process-side graph; the database module is the
// only hard dependency its top-level imports need here.
vi.mock('@process/services/database', () => ({ getDatabase: vi.fn() }));

import AcpAgentManager from '@process/task/AcpAgentManager';

type RoutingResult = { routing: 'flux' | 'native' | 'unknown' };

/**
 * Build a bare AcpAgentManager (no constructor side effects) with just the
 * private fields setModel/respawnForRoutingChange read. We stub the seams
 * (computeFluxRouting, the agent, respawn/init/kill) so the test exercises ONLY
 * the routing-boundary decision logic.
 */
function makeManager(over: {
  lastRouting: 'flux' | 'native' | 'unknown';
  nextRouting: 'flux' | 'native' | 'unknown';
}): {
  manager: AcpAgentManager;
  setModelByConfigOption: ReturnType<typeof vi.fn>;
  respawnSpy: ReturnType<typeof vi.fn>;
} {
  const manager = Object.create(AcpAgentManager.prototype) as AcpAgentManager;
  const m = manager as unknown as Record<string, unknown>;

  m.options = { backend: 'claude' };
  m.lastRouting = over.lastRouting;
  m.persistedModelId = null;
  m.conversation_id = 'test-convo';

  const setModelByConfigOption = vi.fn().mockResolvedValue({
    currentModelId: 'flux-auto',
    availableModels: [],
  });
  // A Flux-id switch skips the bridge set_model and returns getModelInfo().
  const getModelInfo = vi.fn().mockReturnValue({ currentModelId: 'flux-auto', availableModels: [] });
  m.agent = { setModelByConfigOption, getModelInfo };

  // Stub the input-gathering helper so we control the NEW routing decision.
  m.computeFluxRouting = vi.fn().mockResolvedValue({ routing: over.nextRouting } as RoutingResult);

  // Stub the heavy re-spawn machinery; we only assert it is (not) called.
  const respawnSpy = vi.fn().mockResolvedValue({ currentModelId: 'flux-auto' });
  m.respawnForRoutingChange = respawnSpy;

  m.saveModelId = vi.fn().mockResolvedValue(undefined);
  m.cacheModelList = vi.fn().mockResolvedValue(undefined);

  return { manager, setModelByConfigOption, respawnSpy };
}

describe('AcpAgentManager.setModel - Flux routing-boundary detection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('re-spawns when the model switch crosses native -> flux', async () => {
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'native',
      nextRouting: 'flux',
    });

    await manager.setModel('flux-auto');

    expect(respawnSpy).toHaveBeenCalledOnce();
    expect(respawnSpy).toHaveBeenCalledWith('flux-auto');
    expect(setModelByConfigOption).not.toHaveBeenCalled();
  });

  it('re-spawns when the model switch crosses flux -> native', async () => {
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'flux',
      nextRouting: 'native',
    });

    await manager.setModel('sonnet');

    expect(respawnSpy).toHaveBeenCalledOnce();
    expect(respawnSpy).toHaveBeenCalledWith('sonnet');
    expect(setModelByConfigOption).not.toHaveBeenCalled();
  });

  it('skips the bridge set_model for a same-routing switch TO a Flux id (carried by env)', async () => {
    // The claude bridge rejects an unlisted id via set_model; the Flux model is
    // selected by the spawn env (ANTHROPIC_MODEL/OPENAI_MODEL=flux-auto), so an
    // in-place set_model would error. We persist + skip instead.
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'flux',
      nextRouting: 'flux',
    });
    const saveModelId = (manager as unknown as Record<string, ReturnType<typeof vi.fn>>).saveModelId;

    await manager.setModel('flux-reasoning');

    expect(respawnSpy).not.toHaveBeenCalled();
    expect(setModelByConfigOption).not.toHaveBeenCalled();
    expect(saveModelId).toHaveBeenCalledWith('flux-reasoning');
  });

  it('keeps the in-place setModel for a same-routing switch to a NATIVE id', async () => {
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'flux',
      nextRouting: 'flux',
    });

    await manager.setModel('opus');

    expect(respawnSpy).not.toHaveBeenCalled();
    expect(setModelByConfigOption).toHaveBeenCalledOnce();
    expect(setModelByConfigOption).toHaveBeenCalledWith('opus');
  });

  it('respawns a native claude slot change to apply ANTHROPIC_MODEL (#184)', async () => {
    // A native (non-Flux) claude slot pick is carried by ANTHROPIC_MODEL at
    // spawn, so it only takes effect on a respawn — the bridge's in-place
    // set_model is unreliable when it advertises no model list.
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'native',
      nextRouting: 'native',
    });

    await manager.setModel('opus');

    expect(respawnSpy).toHaveBeenCalledWith('opus');
    expect(setModelByConfigOption).not.toHaveBeenCalled();
  });

  it('normalizes a registry Claude id to its slot and respawns (#184)', async () => {
    // The in-chat picker offers registry catalog ids (`claude-opus-4-8`), not the
    // bare slot. Claude Code only honors the slot via ANTHROPIC_MODEL, so the id
    // must be normalized to `opus` and carried by a respawn — otherwise it falls
    // through to set_model and the CLI rejects it with -32601 (the live bug).
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'native',
      nextRouting: 'native',
    });

    await manager.setModel('claude-opus-4-8');

    expect(respawnSpy).toHaveBeenCalledWith('opus');
    expect(setModelByConfigOption).not.toHaveBeenCalled();
  });

  it('never re-spawns a non-routable backend (next routing unknown)', async () => {
    const { manager, setModelByConfigOption, respawnSpy } = makeManager({
      lastRouting: 'native',
      nextRouting: 'unknown',
    });

    await manager.setModel('some-model');

    expect(respawnSpy).not.toHaveBeenCalled();
    expect(setModelByConfigOption).toHaveBeenCalledOnce();
  });

  it('never re-spawns when current routing is unknown (cannot re-route via env)', async () => {
    const { manager, respawnSpy } = makeManager({
      lastRouting: 'unknown',
      nextRouting: 'flux',
    });

    await manager.setModel('flux-auto');

    // No boundary cross (lastRouting unknown) => no respawn; a Flux id is carried
    // by env, so the bridge set_model is skipped regardless.
    expect(respawnSpy).not.toHaveBeenCalled();
  });
});

describe('AcpAgentManager.respawnForRoutingChange - teardown + recreate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists the new model, kills the agent, clears bootstrap, and re-inits', async () => {
    const manager = Object.create(AcpAgentManager.prototype) as AcpAgentManager;
    const m = manager as unknown as Record<string, unknown>;

    m.options = { backend: 'claude', currentModelId: 'sonnet' };
    m.persistedModelId = 'sonnet';
    m.conversation_id = 'test-convo';
    m.lastRouting = 'native';
    m.bootstrap = Promise.resolve();
    m.bootstrapping = false;

    const kill = vi.fn().mockResolvedValue(undefined);
    m.agent = { kill };

    const saveModelId = vi.fn().mockResolvedValue(undefined);
    m.saveModelId = saveModelId;

    const initAgent = vi.fn().mockResolvedValue(undefined);
    m.initAgent = initAgent;

    m.getModelInfo = vi.fn().mockReturnValue({ currentModelId: 'flux-auto' });

    const { getDatabase } = await import('@process/services/database');
    (getDatabase as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      getConversation: () => ({
        success: true,
        data: { type: 'acp', extra: { acpSessionId: 's-1', acpWrapperVersion: 'claude@1' } },
      }),
    });

    const result = await (manager as unknown as {
      respawnForRoutingChange: (id: string) => Promise<unknown>;
    }).respawnForRoutingChange('flux-auto');

    // New model persisted BEFORE re-spawn so initAgent picks it up.
    expect((m.options as { currentModelId: string }).currentModelId).toBe('flux-auto');
    expect(m.persistedModelId).toBe('flux-auto');
    expect(saveModelId).toHaveBeenCalledWith('flux-auto');

    // Resume markers reloaded so the fresh spawn resumes the same session.
    expect((m.options as { acpSessionId: string }).acpSessionId).toBe('s-1');
    expect((m.options as { acpWrapperVersion: string }).acpWrapperVersion).toBe('claude@1');

    // Teardown + recreate via the existing kill/initAgent path.
    expect(kill).toHaveBeenCalledOnce();
    expect(m.bootstrap).toBeUndefined();
    expect(initAgent).toHaveBeenCalledOnce();
    expect(result).toEqual({ currentModelId: 'flux-auto' });
  });
});
