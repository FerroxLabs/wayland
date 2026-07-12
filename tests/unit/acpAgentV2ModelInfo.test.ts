/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #184 - the in-chat Claude model picker was stuck on a dead "Select Model".
 * Root cause: the fallback was added to AcpAgent (V1, `src/process/agent/acp/index.ts`),
 * which is NEVER instantiated - the runtime agent is AcpAgentV2. This test pins
 * the fallback to the class that actually runs: AcpAgentV2.getModelInfo() must
 * return the static Sonnet/Opus/Haiku slots for a Claude backend when neither
 * cc-switch nor the ACP wrapper advertise a model list (Claude Code never does).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const ccSwitchMocks = vi.hoisted(() => ({
  readClaudeModelInfoFromCcSwitch: vi.fn(),
}));
vi.mock('@process/services/ccSwitchModelSource', () => ({
  readClaudeModelInfoFromCcSwitch: ccSwitchMocks.readClaudeModelInfoFromCcSwitch,
}));

import { AcpAgentV2 } from '../../src/process/acp/compat/AcpAgentV2';
import type { AcpModelInfo } from '../../src/common/types/acpTypes';

function makeAgent(backend: string): AcpAgentV2 {
  // The constructor only assigns fields + calls toAgentConfig; no I/O. We then
  // override agentConfig directly so the test is decoupled from toAgentConfig.
  const agent = new AcpAgentV2({ id: 'c1', onStreamEvent: () => {}, backend } as never);
  (agent as unknown as { agentConfig: { agentBackend: string } }).agentConfig = { agentBackend: backend };
  return agent;
}

describe('AcpAgentV2.getModelInfo (#184 live-class fallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ccSwitchMocks.readClaudeModelInfoFromCcSwitch.mockReturnValue(null);
  });

  it('exposes Claude slot catalogs without inventing a confirmed current model', () => {
    const info = makeAgent('claude').getModelInfo();
    expect(info?.availableModels.map((m) => m.id)).toEqual(['sonnet', 'opus', 'haiku']);
    expect(info?.canSwitch).toBe(true);
    expect(info?.sourceDetail).toBe('claude-slots');
    expect(info?.currentModelId).toBeNull();
    expect(info?.currentModelLabel).toBeNull();
  });

  it('does not promote an unconfirmed user override in the fallback', () => {
    const agent = makeAgent('claude');
    (agent as unknown as { userModelOverride: string | null }).userModelOverride = 'opus';
    expect(agent.getModelInfo()?.currentModelId).toBeNull();
  });

  it('uses a cc-switch catalog without adopting its local current model', () => {
    ccSwitchMocks.readClaudeModelInfoFromCcSwitch.mockReturnValue({
      currentModelId: 'claude-opus-local',
      currentModelLabel: 'Claude Opus Local',
      availableModels: [
        { id: 'claude-opus-local', label: 'Claude Opus Local' },
        { id: 'claude-sonnet-local', label: 'Claude Sonnet Local' },
      ],
      canSwitch: true,
      source: 'models',
      sourceDetail: 'cc-switch',
    });

    const info = makeAgent('claude').getModelInfo();

    expect(info?.availableModels.map((model) => model.id)).toEqual([
      'claude-opus-local',
      'claude-sonnet-local',
    ]);
    expect(info?.currentModelId).toBeNull();
    expect(info?.currentModelLabel).toBeNull();
  });

  it('does not promote a Flux request echo to current model', () => {
    const agent = makeAgent('claude');
    (agent as unknown as { userModelOverride: string | null }).userModelOverride = 'flux-auto';
    expect(agent.getModelInfo()?.currentModelId).toBeNull();
  });

  it('does NOT clobber a real advertised model list with the slots', () => {
    const agent = makeAgent('claude');
    const real: AcpModelInfo = {
      currentModelId: 'real-x',
      currentModelLabel: 'Real X',
      availableModels: [{ id: 'real-x', label: 'Real X' }],
      canSwitch: true,
      source: 'models',
    };
    (agent as unknown as { cachedModelInfo: AcpModelInfo }).cachedModelInfo = real;
    expect(agent.getModelInfo()?.availableModels.map((m) => m.id)).toEqual(['real-x']);
  });

  it('does not leak the claude slots to a non-claude backend', () => {
    expect(makeAgent('qwen').getModelInfo()).toBeNull();
  });
});
