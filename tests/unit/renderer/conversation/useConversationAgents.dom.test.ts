/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { AcpBackendConfig } from '../../../../src/common/types/acpTypes';
import type { AvailableAgent } from '../../../../src/renderer/utils/model/agentTypes';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const configStorageMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
}));

const ipcMock = vi.hoisted(() => ({
  getAvailableAgents: vi.fn(),
  getExtensionAssistants: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../../../src/common', () => ({
  ipcBridge: {
    acpConversation: {
      getAvailableAgents: { invoke: ipcMock.getAvailableAgents },
    },
    extensions: {
      getAssistants: { invoke: ipcMock.getExtensionAssistants },
    },
  },
}));

vi.mock('../../../../src/common/config/storage', () => ({
  ConfigStorage: configStorageMock,
}));

// SWR mock: uses React state to trigger re-renders when async data resolves.
// Each SWR key gets its own useState so the component tree re-renders properly.

const swrSubscribers = vi.hoisted(() => ({
  cache: new Map<string, unknown>(),
  listeners: new Map<string, Set<(v: unknown) => void>>(),
  reset() {
    this.cache.clear();
    this.listeners.clear();
  },
}));

vi.mock('swr', async () => {
  const React = await import('react');
  return {
    default: (key: string, fetcher: () => Promise<unknown>) => {
      const [data, setData] = React.useState<unknown>(
        swrSubscribers.cache.has(key) ? swrSubscribers.cache.get(key) : undefined
      );
      const resolved = swrSubscribers.cache.has(key);

      React.useEffect(() => {
        if (!resolved) {
          fetcher()
            .then((result) => {
              swrSubscribers.cache.set(key, result);
              setData(result);
            })
            .catch(() => {});
        }
      }, [key, fetcher, resolved]);

      return {
        data,
        isLoading: data === undefined && !resolved,
        error: undefined,
        mutate: vi.fn(),
      };
    },
    mutate: vi.fn(),
  };
});

import { useConversationAgents } from '../../../../src/renderer/pages/conversation/hooks/useConversationAgents';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const CLI_AGENTS: AvailableAgent[] = [
  { backend: 'gemini', name: 'Gemini' },
  { backend: 'claude', name: 'Claude Code' },
];

function makePresetConfig(overrides: Partial<AcpBackendConfig> = {}): AcpBackendConfig {
  return {
    id: 'my-assistant',
    name: 'My Assistant',
    isPreset: true,
    enabled: true,
    ...overrides,
  } as AcpBackendConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocks(
  presetConfigs: AcpBackendConfig[] = [],
  extensionAssistants: Array<Record<string, unknown>> = []
) {
  ipcMock.getAvailableAgents.mockResolvedValue({ success: true, data: CLI_AGENTS });
  ipcMock.getExtensionAssistants.mockResolvedValue(extensionAssistants);
  configStorageMock.get.mockImplementation(async (key: string) => {
    if (key === 'assistants') {
      return presetConfigs;
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useConversationAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    swrSubscribers.reset();
  });

  // -- configToAvailableAgent mapping tests (tested via hook output) --

  describe('configToAvailableAgent mapping', () => {
    it('maps presetAgentType to backend field', async () => {
      setupMocks([makePresetConfig({ id: 'p1', name: 'Claude Preset', presetAgentType: 'claude' })]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].backend).toBe('claude');
    });

    it('defaults backend to "gemini" when presetAgentType is undefined', async () => {
      setupMocks([makePresetConfig({ id: 'p2', name: 'Default Backend' })]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].backend).toBe('gemini');
    });

    it('defaults backend to "gemini" when presetAgentType is empty string', async () => {
      setupMocks([makePresetConfig({ id: 'p3', name: 'Empty Type', presetAgentType: '' })]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      // Empty string is falsy, so fallback to 'gemini'
      expect(result.current.presetAssistants[0].backend).toBe('gemini');
    });

    it('sets isPreset to true for all preset assistants', async () => {
      setupMocks([
        makePresetConfig({ id: 'a1', name: 'A1', presetAgentType: 'claude' }),
        makePresetConfig({ id: 'a2', name: 'A2', presetAgentType: 'codex' }),
      ]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(2);
      });

      for (const agent of result.current.presetAssistants) {
        expect(agent.isPreset).toBe(true);
      }
    });

    it('passes through customAgentId, name, avatar, and context', async () => {
      setupMocks([
        makePresetConfig({
          id: 'custom-1',
          name: 'Writer Bot',
          avatar: '🖊️',
          context: 'You are a creative writer.',
          presetAgentType: 'qwen',
        }),
      ]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      const agent = result.current.presetAssistants[0];
      expect(agent.customAgentId).toBe('custom-1');
      expect(agent.name).toBe('Writer Bot');
      expect(agent.avatar).toBe('🖊️');
      expect(agent.context).toBe('You are a creative writer.');
      expect(agent.presetAgentType).toBe('qwen');
    });

    it('handles various presetAgentType values correctly', async () => {
      setupMocks([
        makePresetConfig({ id: 'c1', name: 'Codex', presetAgentType: 'codex' }),
        makePresetConfig({ id: 'c2', name: 'CodeBuddy', presetAgentType: 'codebuddy' }),
        makePresetConfig({ id: 'c3', name: 'Wcore', presetAgentType: 'wcore' }),
      ]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(3);
      });

      expect(result.current.presetAssistants[0].backend).toBe('codex');
      expect(result.current.presetAssistants[1].backend).toBe('codebuddy');
      expect(result.current.presetAssistants[2].backend).toBe('wcore');
    });
  });

  // -- Hook data source tests --

  describe('hook data sources', () => {
    it('returns cliAgents from the SWR detection cache', async () => {
      setupMocks([]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.cliAgents.length).toBe(2);
      });

      expect(result.current.cliAgents).toEqual(CLI_AGENTS);
    });

    it('returns presetAssistants derived from ConfigStorage("assistants")', async () => {
      const presets = [
        makePresetConfig({ id: 'p1', name: 'Assistant A', presetAgentType: 'claude' }),
        makePresetConfig({ id: 'p2', name: 'Assistant B', presetAgentType: 'gemini' }),
      ];
      setupMocks(presets);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(2);
      });

      expect(result.current.presetAssistants[0].name).toBe('Assistant A');
      expect(result.current.presetAssistants[1].name).toBe('Assistant B');
    });

    it('filters out disabled presets (enabled === false)', async () => {
      setupMocks([
        makePresetConfig({ id: 'e1', name: 'Enabled', enabled: true }),
        makePresetConfig({ id: 'e2', name: 'Disabled', enabled: false }),
      ]);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].name).toBe('Enabled');
    });

    it('filters out non-preset configs (isPreset !== true)', async () => {
      const agents: AcpBackendConfig[] = [
        makePresetConfig({ id: 'preset', name: 'Preset One' }),
        { id: 'cli-agent', name: 'CLI Agent', enabled: true } as AcpBackendConfig,
      ];
      setupMocks(agents);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].customAgentId).toBe('preset');
    });

    it('returns empty arrays when ConfigStorage returns null', async () => {
      ipcMock.getAvailableAgents.mockResolvedValue({ success: true, data: [] });
      ipcMock.getExtensionAssistants.mockResolvedValue([]);
      configStorageMock.get.mockResolvedValue(null);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cliAgents).toEqual([]);
      expect(result.current.presetAssistants).toEqual([]);
    });
  });

  // -- Extension-contributed assistants merge (Patch B for teams integration) --

  describe('extension-assistants merge', () => {
    it('merges extension-contributed assistants into presetAssistants', async () => {
      setupMocks(
        [],
        [
          {
            id: 'ext-research',
            name: 'Scout',
            isPreset: true,
            isBuiltin: false,
            enabled: true,
            presetAgentType: 'claude',
            avatar: 'icons/scout.svg',
            context: 'You are Scout, a research specialist.',
          },
          {
            id: 'ext-cold-outbound',
            name: 'Cold Outbound',
            isPreset: true,
            isBuiltin: false,
            enabled: true,
            presetAgentType: 'claude',
          },
        ]
      );

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(2);
      });

      const ids = result.current.presetAssistants.map((a) => a.customAgentId);
      expect(ids).toEqual(expect.arrayContaining(['ext-research', 'ext-cold-outbound']));

      const scout = result.current.presetAssistants.find((a) => a.customAgentId === 'ext-research')!;
      expect(scout.backend).toBe('claude');
      expect(scout.isPreset).toBe(true);
      expect(scout.isExtension).toBe(true);
      expect(scout.context).toBe('You are Scout, a research specialist.');
    });

    it('filters out extension assistants with enabled === false', async () => {
      setupMocks(
        [],
        [
          {
            id: 'ext-active',
            name: 'Active',
            isPreset: true,
            enabled: true,
            presetAgentType: 'claude',
          },
          {
            id: 'ext-disabled',
            name: 'Disabled',
            isPreset: true,
            enabled: false,
            presetAgentType: 'claude',
          },
        ]
      );

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].customAgentId).toBe('ext-active');
    });

    it('config-layer presets win on customAgentId collision', async () => {
      // If somehow the same ID surfaces in both stores, config-layer is authoritative.
      setupMocks(
        [makePresetConfig({ id: 'shared-id', name: 'From Config', presetAgentType: 'claude' })],
        [
          {
            id: 'shared-id',
            name: 'From Extension',
            isPreset: true,
            enabled: true,
            presetAgentType: 'gemini',
          },
        ]
      );

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].name).toBe('From Config');
      expect(result.current.presetAssistants[0].backend).toBe('claude');
    });

    it('returns config-layer presets unchanged when no extension assistants are loaded', async () => {
      setupMocks([makePresetConfig({ id: 'p1', name: 'Only Config', presetAgentType: 'gemini' })], []);

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].customAgentId).toBe('p1');
      expect(result.current.presetAssistants[0].isExtension).toBeUndefined();
    });

    it('survives extension IPC failure (defaults to empty)', async () => {
      ipcMock.getAvailableAgents.mockResolvedValue({ success: true, data: CLI_AGENTS });
      ipcMock.getExtensionAssistants.mockRejectedValue(new Error('IPC unavailable'));
      configStorageMock.get.mockImplementation(async (key: string) => {
        if (key === 'assistants') {
          return [makePresetConfig({ id: 'p1', name: 'Config Only', presetAgentType: 'gemini' })];
        }
        return null;
      });

      const { result } = renderHook(() => useConversationAgents());

      await waitFor(() => {
        expect(result.current.presetAssistants.length).toBe(1);
      });

      expect(result.current.presetAssistants[0].customAgentId).toBe('p1');
    });
  });
});
