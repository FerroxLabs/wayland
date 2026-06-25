/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AcpBackendConfig, AcpModelInfo, AvailableAgent } from '../../src/renderer/pages/guid/types';
import type { IProvider } from '../../src/common/config/storage';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const configStorageMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
}));

const ipcMock = vi.hoisted(() => ({
  getAvailableAgents: vi.fn(),
  refreshCustomAgents: vi.fn().mockResolvedValue(undefined),
  getCustomAgents: vi.fn(),
  getAssistants: vi.fn(),
  remoteAgentList: vi.fn().mockResolvedValue([]),
  getClaudeNativeDefault: vi.fn().mockResolvedValue(null),
  // Eager catalog resolve for an uncached backend (no live task). Default: no
  // model info, so the hook leaves currentAcpCachedModelInfo null and the
  // picker sources its list from the live curated catalog.
  getModelInfo: vi.fn().mockResolvedValue({ success: false, data: null }),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../src/common', () => ({
  ipcBridge: {
    acpConversation: {
      getAvailableAgents: { invoke: ipcMock.getAvailableAgents },
      refreshCustomAgents: { invoke: ipcMock.refreshCustomAgents },
      getModelInfo: { invoke: ipcMock.getModelInfo },
    },
    extensions: {
      getAssistants: { invoke: ipcMock.getAssistants },
    },
    remoteAgent: {
      list: { invoke: ipcMock.remoteAgentList },
    },
    systemSettings: {
      getClaudeNativeDefaultModelId: { invoke: ipcMock.getClaudeNativeDefault },
    },
  },
}));

vi.mock('../../src/common/config/storage', () => ({
  ConfigStorage: configStorageMock,
}));

vi.mock('../../src/common/config/presets/assistantPresets', () => ({
  ASSISTANT_PRESETS: [],
}));

let swrData: Record<string, unknown> = {};

function resetSwrCache() {
  swrData = {};
}

vi.mock('swr', () => ({
  default: (key: string, fetcher: () => Promise<unknown>) => {
    if (!(key in swrData)) {
      swrData[key] = undefined;
      fetcher()
        .then((data) => {
          swrData[key] = data;
        })
        .catch(() => {});
    }
    return { data: swrData[key], error: undefined, mutate: vi.fn() };
  },
  mutate: vi.fn(),
}));

vi.mock('../../src/renderer/utils/model/agentModes', () => ({
  getAgentModes: (backend?: string) => {
    if (backend === 'claude') {
      return [
        { value: 'default', label: 'Default' },
        { value: 'bypassPermissions', label: 'Bypass Permissions' },
      ];
    }
    return [
      { value: 'default', label: 'Default' },
      { value: 'yolo', label: 'YOLO' },
    ];
  },
  supportsModeSwitch: () => true,
}));

import { useGuidAgentSelection } from '../../src/renderer/pages/guid/hooks/useGuidAgentSelection';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const PRESET_AGENT_ID = 'cowork';

const AVAILABLE_AGENTS: AvailableAgent[] = [
  { backend: 'gemini', name: 'Gemini' },
  { backend: 'claude', name: 'Claude' },
  { backend: 'claude', name: 'Cowork Assistant', customAgentId: PRESET_AGENT_ID, isPreset: true },
];

const CUSTOM_AGENTS: AcpBackendConfig[] = [
  {
    id: PRESET_AGENT_ID,
    name: 'Cowork Assistant',
    isPreset: true,
    enabled: true,
    presetAgentType: 'claude',
  } as AcpBackendConfig,
];

const CLAUDE_CACHED_MODEL: AcpModelInfo = {
  source: 'models',
  currentModelId: 'claude-sonnet-4-5-20250514',
  currentModelLabel: 'Claude Sonnet 4.5',
  availableModels: [
    { id: 'claude-sonnet-4-5-20250514', label: 'Claude Sonnet 4.5' },
    { id: 'claude-opus-4-5-20250514', label: 'Claude Opus 4.5' },
  ],
  canSwitch: true,
};

const MODEL_LIST: IProvider[] = [
  {
    id: 'p1',
    name: 'Test Provider',
    platform: 'openai',
    baseUrl: '',
    apiKey: 'k',
    model: ['gpt-4'],
  } as IProvider,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocks(overrides?: {
  cachedModels?: Record<string, AcpModelInfo>;
  acpConfig?: Record<string, unknown>;
  geminiConfig?: Record<string, unknown>;
}) {
  const cachedModels = overrides?.cachedModels ?? { claude: CLAUDE_CACHED_MODEL };
  const acpConfig = overrides?.acpConfig ?? { claude: { preferredMode: 'bypassPermissions' } };
  const geminiConfig = overrides?.geminiConfig ?? {};

  ipcMock.getAvailableAgents.mockResolvedValue({ success: true, data: AVAILABLE_AGENTS });
  ipcMock.getAssistants.mockResolvedValue([]);
  // Eager catalog resolve for an uncached backend: default to no model info so
  // currentAcpCachedModelInfo stays null (picker uses the live curated catalog).
  ipcMock.getModelInfo.mockResolvedValue({ success: false, data: null });

  configStorageMock.get.mockImplementation(async (key: string) => {
    switch (key) {
      case 'acp.cachedModels':
        return cachedModels;
      case 'assistants':
        return CUSTOM_AGENTS;
      case 'guid.lastSelectedAgent':
        return null;
      case 'acp.config':
        return acpConfig;
      case 'gemini.config':
        return geminiConfig;
      case 'gemini.defaultModel':
        return null;
      case 'wcore.config':
        return null;
      case 'wcore.defaultModel':
        return null;
      default:
        return null;
    }
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useGuidAgentSelection – preset agent config resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSwrCache();
    setupMocks();
  });

  const hookOptions = {
    modelList: MODEL_LIST,
    isGoogleAuth: false,
    localeKey: 'en-US',
  };

  it('currentAcpCachedModelInfo uses effective backend type for preset agent', async () => {
    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    // Wait for initial data to load (availableAgents + cachedModels)
    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    // Select the preset agent
    act(() => {
      result.current.setSelectedAgentKey(`custom:${PRESET_AGENT_ID}`);
    });

    // Verify effective agent type resolves to 'claude' (via presetAgentType)
    await waitFor(() => {
      expect(result.current.isPresetAgent).toBe(true);
      expect(result.current.currentEffectiveAgentInfo.agentType).toBe('claude');
    });

    // Key assertion: cached model info should look up 'claude' key, not 'custom'
    expect(result.current.currentAcpCachedModelInfo).not.toBeNull();
    expect(result.current.currentAcpCachedModelInfo?.currentModelId).toBe('claude-sonnet-4-5-20250514');
    expect(result.current.currentAcpCachedModelInfo?.availableModels).toHaveLength(2);
  });

  it('currentAcpCachedModelInfo returns null when cached models have no entry for effective backend', async () => {
    setupMocks({ cachedModels: { codex: CLAUDE_CACHED_MODEL } });

    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    act(() => {
      result.current.setSelectedAgentKey(`custom:${PRESET_AGENT_ID}`);
    });

    await waitFor(() => {
      expect(result.current.isPresetAgent).toBe(true);
    });

    // Preset maps to 'claude', but cache only has 'codex'
    expect(result.current.currentAcpCachedModelInfo).toBeNull();
  });

  it('selectedMode loads preferred mode from effective backend config', async () => {
    setupMocks({
      acpConfig: {
        claude: { preferredMode: 'bypassPermissions' },
      },
    });

    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    act(() => {
      result.current.setSelectedAgentKey(`custom:${PRESET_AGENT_ID}`);
    });

    // Mode should load from acp.config.claude.preferredMode
    await waitFor(() => {
      expect(result.current.selectedMode).toBe('bypassPermissions');
    });
  });

  it('selectedMode defaults to "default" when no preferred mode is saved', async () => {
    setupMocks({ acpConfig: {} });

    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    act(() => {
      result.current.setSelectedAgentKey(`custom:${PRESET_AGENT_ID}`);
    });

    // Wait a tick for mode loading effect
    await waitFor(() => {
      expect(result.current.isPresetAgent).toBe(true);
    });

    expect(result.current.selectedMode).toBe('default');
  });

  it('non-preset agent uses its own key for model cache lookup', async () => {
    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    // Select claude directly from pill bar (non-preset)
    act(() => {
      result.current.setSelectedAgentKey('claude');
    });

    await waitFor(() => {
      expect(result.current.isPresetAgent).toBe(false);
      expect(result.current.selectedAgent).toBe('claude');
    });

    // Should look up acpCachedModels['claude']
    expect(result.current.currentAcpCachedModelInfo).not.toBeNull();
    expect(result.current.currentAcpCachedModelInfo?.currentModelId).toBe('claude-sonnet-4-5-20250514');
  });

  it('setSelectedMode saves mode under effective backend for preset agent', async () => {
    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    act(() => {
      result.current.setSelectedAgentKey(`custom:${PRESET_AGENT_ID}`);
    });

    await waitFor(() => {
      expect(result.current.isPresetAgent).toBe(true);
    });

    // Clear mocks to only capture the mode save call
    configStorageMock.get.mockClear();
    configStorageMock.set.mockClear();
    configStorageMock.get.mockResolvedValue({});

    act(() => {
      result.current.setSelectedMode('bypassPermissions');
    });

    // savePreferredMode should be called with 'claude' (effective type), not 'custom'
    await waitFor(() => {
      const setCalls = configStorageMock.set.mock.calls;
      const acpConfigCall = setCalls.find(([key]: [string]) => key === 'acp.config');
      expect(acpConfigCall).toBeDefined();
      // Should save under the 'claude' key, not 'custom'
      const savedConfig = acpConfigCall?.[1] as Record<string, unknown>;
      expect(savedConfig).toHaveProperty('claude');
      expect((savedConfig.claude as Record<string, unknown>).preferredMode).toBe('bypassPermissions');
    });
  });

  it('resets back to the default agent immediately on new-chat navigation', async () => {
    configStorageMock.get.mockImplementation(async (key: string) => {
      switch (key) {
        case 'acp.cachedModels':
          return { claude: CLAUDE_CACHED_MODEL };
        case 'acp.customAgents':
          return CUSTOM_AGENTS;
        case 'guid.lastSelectedAgent':
          return `custom:${PRESET_AGENT_ID}`;
        case 'acp.config':
        case 'gemini.config':
        case 'gemini.defaultModel':
        case 'wcore.config':
        case 'wcore.defaultModel':
          return null;
        default:
          return null;
      }
    });

    const { result, rerender } = renderHook(
      ({ resetAssistant, locationKey }: { resetAssistant?: boolean; locationKey?: string }) =>
        useGuidAgentSelection({ ...hookOptions, resetAssistant, locationKey }),
      { initialProps: { resetAssistant: false, locationKey: 'initial' } }
    );

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
      expect(result.current.selectedAgentKey).toBe(`custom:${PRESET_AGENT_ID}`);
    });

    rerender({ resetAssistant: true, locationKey: 'new-chat' });

    expect(result.current.selectedAgentKey).toBe('gemini');
    expect(configStorageMock.set).toHaveBeenCalledWith('guid.lastSelectedAgent', 'gemini');
  });

  it('returns null cached info for codex with no cached list (picker uses live curated catalog)', async () => {
    // No hardcoded DEFAULT_CODEX_MODELS fallback anymore: an uncached codex
    // backend resolves currentAcpCachedModelInfo to null, and GuidModelSelector
    // then sources its model list from the live curated catalog instead.
    setupMocks({ cachedModels: {}, acpConfig: {} });

    const { result } = renderHook(() => useGuidAgentSelection(hookOptions));

    await waitFor(() => {
      expect(result.current.availableAgents).toBeDefined();
    });

    act(() => {
      result.current.setSelectedAgentKey('codex');
    });

    await waitFor(() => {
      expect(result.current.selectedAgentKey).toBe('codex');
    });

    expect(result.current.currentAcpCachedModelInfo).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Home-path Claude native default: a fresh Claude chat must default to the
  // subscription slot, never be left model-less (which lets the global "Route
  // through Flux" toggle silently route a native-login chat through Flux).
  // ---------------------------------------------------------------------------
  describe('Claude native default model resolution', () => {
    it('defaults selectedAcpModel to the native slot when claude has no saved/cached model', async () => {
      ipcMock.getClaudeNativeDefault.mockResolvedValue('opus');
      setupMocks({ cachedModels: {}, acpConfig: {} });

      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.setSelectedAgentKey('claude');
      });

      await waitFor(() => {
        expect(result.current.selectedAcpModel).toBe('opus');
      });
      expect(ipcMock.getClaudeNativeDefault).toHaveBeenCalled();
    });

    it('leaves selectedAcpModel null when claude has no native login (Flux toggle may then apply)', async () => {
      ipcMock.getClaudeNativeDefault.mockResolvedValue(null);
      setupMocks({ cachedModels: {}, acpConfig: {} });

      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.setSelectedAgentKey('claude');
      });

      await waitFor(() => {
        expect(ipcMock.getClaudeNativeDefault).toHaveBeenCalled();
      });
      expect(result.current.selectedAcpModel).toBeNull();
    });

    it('an explicit preferredModelId (incl. a flux-* pick) wins over the native default', async () => {
      ipcMock.getClaudeNativeDefault.mockResolvedValue('opus');
      setupMocks({ cachedModels: {}, acpConfig: { claude: { preferredModelId: 'flux-auto' } } });

      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.setSelectedAgentKey('claude');
      });

      await waitFor(() => {
        expect(result.current.selectedAcpModel).toBe('flux-auto');
      });
      expect(ipcMock.getClaudeNativeDefault).not.toHaveBeenCalled();
    });

    it('a cached model still wins over the native default (no extra IPC)', async () => {
      ipcMock.getClaudeNativeDefault.mockResolvedValue('opus');
      setupMocks({ cachedModels: { claude: CLAUDE_CACHED_MODEL }, acpConfig: {} });

      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.setSelectedAgentKey('claude');
      });

      await waitFor(() => {
        expect(result.current.selectedAcpModel).toBe('claude-sonnet-4-5-20250514');
      });
      expect(ipcMock.getClaudeNativeDefault).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // selectPresetAssistant - the "Rory rule" for chat-redesign Phase 2/3.
  // Picks an assistant; the chat's backend follows automatically via the
  // existing per-backend preferred-model chain. No modal, no prompt.
  // ---------------------------------------------------------------------------
  describe('selectPresetAssistant - Rory backend defaulting', () => {
    it('sets a custom: key when selecting a preset whose backend is claude', async () => {
      setupMocks({});
      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.selectPresetAssistant({ id: 'cold-outbound', presetAgentType: 'claude' });
      });

      // getAgentKey returns custom:<id> for any non-remote backend with a
      // customAgentId. The backend choice flows through the existing chain
      // via the preset's presetAgentType resolution - no extra prompt.
      expect(result.current.selectedAgentKey).toBe('custom:cold-outbound');
      expect(configStorageMock.set).toHaveBeenCalledWith('guid.lastSelectedAgent', 'custom:cold-outbound');
    });

    it('sets a remote: key when selecting a preset whose backend is remote', async () => {
      setupMocks({});
      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.selectPresetAssistant({ id: 'remote-team-x', presetAgentType: 'remote' });
      });

      expect(result.current.selectedAgentKey).toBe('remote:remote-team-x');
    });

    it('falls back to gemini backend when preset has no presetAgentType', async () => {
      setupMocks({});
      const { result } = renderHook(() => useGuidAgentSelection(hookOptions));
      await waitFor(() => expect(result.current.availableAgents).toBeDefined());

      act(() => {
        result.current.selectPresetAssistant({ id: 'word-creator' });
      });

      // gemini is not 'remote', and customAgentId is present → custom:<id>.
      expect(result.current.selectedAgentKey).toBe('custom:word-creator');
    });
  });
});
