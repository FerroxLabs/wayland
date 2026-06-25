/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveLocaleKey } from '../../src/common/utils';

const loadPresetAssistantResources = vi.fn();
const configGet = vi.fn();

vi.mock('@/common', () => ({
  ipcBridge: {},
}));

// The Flux default-routing probe (resolvePreferredAcpModelId -> shouldDefaultToFluxAuto)
// calls these IPC providers; without a mock their .invoke() never resolves and ACP
// cases hang. Default to "Flux off" so model selection stays deterministic.
vi.mock('@/common/adapter/ipcBridge', () => ({
  systemSettings: {
    getRouteThroughFlux: { invoke: vi.fn(async () => false) },
  },
  modelRegistry: {
    list: { invoke: vi.fn(async () => []) },
  },
}));

vi.mock('@/common/config/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/common/config/storage')>(
    '../../src/common/config/storage'
  );
  return {
    ...actual,
    ConfigStorage: {
      get: configGet,
    },
  };
});

vi.mock('@/common/utils/presetAssistantResources', () => ({
  loadPresetAssistantResources,
}));

const { buildPresetAssistantParams, buildCliAgentParams } =
  await import('../../src/renderer/pages/conversation/utils/createConversationParams');

describe('createConversationParams', () => {
  beforeEach(() => {
    loadPresetAssistantResources.mockReset();
    configGet.mockReset();
  });

  it('uses the shared locale resolver for Turkish', async () => {
    loadPresetAssistantResources.mockResolvedValue({
      rules: 'preset rules',
      skills: '',
      enabledSkills: ['moltbook'],
    });
    configGet.mockResolvedValue([
      {
        id: 'provider-1',
        platform: 'openai',
        name: 'Provider',
        baseUrl: 'https://example.com',
        apiKey: 'token',
        model: ['gpt-4.1'],
        enabled: true,
      },
    ]);

    const params = await buildPresetAssistantParams(
      {
        backend: 'gemini',
        name: 'Preset Assistant',
        customAgentId: 'builtin-cowork',
        isPreset: true,
        presetAgentType: 'gemini',
      },
      '/tmp/workspace',
      'tr'
    );

    expect(resolveLocaleKey('tr')).toBe('tr-TR');
    expect(loadPresetAssistantResources).toHaveBeenCalledWith({
      customAgentId: 'builtin-cowork',
      localeKey: 'tr-TR',
    });
    expect(params.extra.presetRules).toBe('preset rules');
    expect(params.extra.enabledSkills).toEqual(['moltbook']);
    expect(params.model.useModel).toBe('gpt-4.1');
  });

  it('maps acp preset assistants to presetContext and backend', async () => {
    loadPresetAssistantResources.mockResolvedValue({
      rules: 'acp preset rules',
      skills: '',
      enabledSkills: undefined,
    });

    const params = await buildPresetAssistantParams(
      {
        backend: 'codebuddy',
        name: 'Codebuddy Assistant',
        customAgentId: 'preset-1',
        isPreset: true,
        presetAgentType: 'codebuddy',
      },
      '/tmp/workspace',
      'zh'
    );

    expect(params.type).toBe('acp');
    expect(params.extra.presetContext).toBe('acp preset rules');
    expect(params.extra.backend).toBe('codebuddy');
  });

  it('falls back to gemini-placeholder when no provider configured for gemini (preset)', async () => {
    loadPresetAssistantResources.mockResolvedValue({
      rules: 'gemini preset rules',
      skills: '',
      enabledSkills: [],
    });
    configGet.mockResolvedValue([]); // No providers

    const params = await buildPresetAssistantParams(
      {
        backend: 'gemini',
        name: 'Gemini Assistant',
        customAgentId: 'builtin-gemini',
        isPreset: true,
        presetAgentType: 'gemini',
      },
      '/tmp/workspace',
      'en'
    );

    expect(params.model.id).toBe('gemini-placeholder');
    expect(params.model.platform).toBe('gemini-with-google-auth');
  });

  it('falls back to gemini-placeholder when no provider configured for gemini (CLI)', async () => {
    configGet.mockResolvedValue([]); // No providers

    const params = await buildCliAgentParams(
      {
        backend: 'gemini',
        name: 'Gemini CLI Agent',
      },
      '/tmp/workspace'
    );

    expect(params.type).toBe('gemini');
    expect(params.model.id).toBe('gemini-placeholder');
    expect(params.model.platform).toBe('gemini-with-google-auth');
  });

  it('resolves wcore model from enabled provider', async () => {
    configGet.mockResolvedValue([
      {
        id: 'provider-1',
        platform: 'openai',
        name: 'Provider',
        baseUrl: 'https://example.com',
        apiKey: 'token',
        model: ['gpt-4.1'],
        enabled: true,
      },
    ]);

    const params = await buildCliAgentParams(
      {
        backend: 'wcore',
        name: 'Wayland Core Agent',
      },
      '/tmp/workspace'
    );

    expect(params.type).toBe('wcore');
    expect(params.model.id).toBe('provider-1');
    expect(params.model.useModel).toBe('gpt-4.1');
  });

  it('throws error for wcore if no provider configured', async () => {
    configGet.mockResolvedValue([]);

    await expect(
      buildCliAgentParams(
        {
          backend: 'wcore',
          name: 'Wayland Core Agent',
        },
        '/tmp/workspace'
      )
    ).rejects.toThrow('No model provider configured');
  });

  it('sets empty model for ACP backend in buildCliAgentParams', async () => {
    const params = await buildCliAgentParams(
      {
        backend: 'claude',
        name: 'Claude Agent',
      },
      '/tmp/workspace'
    );

    expect(params.type).toBe('acp');
    expect(params.model).toEqual({});
  });

  it('reuses the saved ACP mode and model for workspace conversations', async () => {
    configGet.mockImplementation(async (key: string) => {
      if (key === 'acp.config') {
        return {
          codex: {
            preferredMode: 'yolo',
            preferredModelId: 'gpt-5-codex',
          },
        };
      }
      return undefined;
    });

    const params = await buildCliAgentParams(
      {
        backend: 'codex',
        name: 'Codex Agent',
      },
      '/tmp/workspace'
    );

    expect(params.extra.sessionMode).toBe('yolo');
    expect(params.extra.currentModelId).toBe('gpt-5-codex');
  });

  it('falls back to legacy yolo mode when preferred ACP mode is missing', async () => {
    configGet.mockImplementation(async (key: string) => {
      if (key === 'acp.config') {
        return {
          claude: {
            yoloMode: true,
          },
        };
      }
      return undefined;
    });

    const params = await buildCliAgentParams(
      {
        backend: 'claude',
        name: 'Claude Agent',
      },
      '/tmp/workspace'
    );

    expect(params.extra.sessionMode).toBe('bypassPermissions');
  });

  it('reuses the effective preset backend mode and model for ACP preset assistants', async () => {
    loadPresetAssistantResources.mockResolvedValue({ rules: 'r', skills: '', enabledSkills: [] });
    configGet.mockImplementation(async (key: string) => {
      if (key === 'acp.config') {
        return {
          claude: {
            preferredMode: 'acceptEdits',
            preferredModelId: 'claude-sonnet-4-5',
          },
        };
      }
      return undefined;
    });

    const params = await buildPresetAssistantParams(
      { backend: 'custom', name: 'A', customAgentId: 'p', isPreset: true, presetAgentType: 'claude' },
      '/tmp',
      'en'
    );

    expect(params.extra.backend).toBe('claude');
    expect(params.extra.sessionMode).toBe('acceptEdits');
    expect(params.extra.currentModelId).toBe('claude-sonnet-4-5');
  });

  it('leaves codex model unset when no cached ACP model and Flux is off (no hardcoded default)', async () => {
    configGet.mockImplementation(async (key: string) => {
      if (key === 'acp.config') {
        return {};
      }
      if (key === 'acp.cachedModels') {
        return {};
      }
      return undefined;
    });

    const params = await buildCliAgentParams(
      {
        backend: 'codex',
        name: 'Codex Agent',
      },
      '/tmp/workspace'
    );

    // No hardcoded codex default: with no cached pick and Flux off, the model is
    // left undefined and the launch picker supplies a live (curated) model.
    expect(params.extra.currentModelId).toBeUndefined();
  });

  it('throws error for wcore if no enabled provider', async () => {
    configGet.mockResolvedValue([{ id: 'p1', enabled: false, model: ['m1'] }]);
    await expect(buildCliAgentParams({ backend: 'wcore', name: 'Agent' }, '/tmp')).rejects.toThrow(
      'No enabled model provider for Wayland Core'
    );
  });

  it('throws error for gemini if no enabled provider', async () => {
    configGet.mockResolvedValue([{ id: 'p1', enabled: false, model: ['m1'] }]);
    // Note: buildCliAgentParams for gemini uses resolveGeminiModel which catches the error
    const params = await buildCliAgentParams({ backend: 'gemini', name: 'Agent' }, '/tmp');
    expect(params.model.id).toBe('gemini-placeholder');
  });

  it('maps various backends correctly', async () => {
    const backends = [
      { input: 'openclaw', expected: 'openclaw-gateway' },
      { input: 'nanobot', expected: 'nanobot' },
      { input: 'remote', expected: 'remote' },
      { input: 'custom', expected: 'acp' },
    ];

    for (const { input, expected } of backends) {
      const params = await buildCliAgentParams({ backend: input, name: 'Agent' }, '/tmp');
      expect(params.type).toBe(expected);
    }
  });

  it('falls back to first model if none enabled for wcore', async () => {
    configGet.mockResolvedValue([
      {
        id: 'p1',
        platform: 'openai',
        name: 'P1',
        baseUrl: 'b1',
        apiKey: 'k1',
        model: ['m1', 'm2'],
        enabled: true,
        modelEnabled: { m1: false, m2: false },
      },
    ]);

    const params = await buildCliAgentParams({ backend: 'wcore', name: 'A' }, '/tmp');
    expect(params.model.useModel).toBe('m1');
  });

  it('handles missing cliPath for acp backend', async () => {
    const params = await buildCliAgentParams({ backend: 'claude', name: 'A' }, '/tmp');
    expect(params.extra.cliPath).toBeUndefined();
  });

  it('sets backend for acp preset assistant', async () => {
    loadPresetAssistantResources.mockResolvedValue({ rules: 'r', skills: '', enabledSkills: [] });
    const params = await buildPresetAssistantParams(
      { backend: 'claude', name: 'A', customAgentId: 'p', isPreset: true, presetAgentType: 'claude' },
      '/tmp',
      'en'
    );
    expect(params.extra.backend).toBe('claude');
  });
});
