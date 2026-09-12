/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AvailableAgent } from '@/renderer/pages/guid/types';

/**
 * Fuigo cutover (Phase 2): the bundled engine a new chat lands on when nothing
 * else decides is Fuigo, not Wayland Core. Three seams in
 * useGuidAgentSelection carried the old `'wcore'` literal:
 *   - the initial `selectedAgentKey` before any restore runs
 *   - the sidebar "new chat" reset fallback when no CLI agent is detected
 *   - `defaultAgentKey`, the key used when leaving preset mode
 */

const cfg = vi.hoisted(() => ({ values: {} as Record<string, unknown> }));
const agents = vi.hoisted(() => ({ current: [] as AvailableAgent[] }));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn((key: string) => Promise.resolve(cfg.values[key])),
    set: vi.fn(() => Promise.resolve()),
  },
}));

const swrEmpty = vi.hoisted(() => ({ list: [] as never[] }));
vi.mock('swr', () => ({
  default: (key: string) => (key === 'agents.detected' ? { data: agents.current } : { data: swrEmpty.list }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    remoteAgent: { list: { invoke: () => Promise.resolve([]) } },
    acpConversation: { getModelInfo: { invoke: () => Promise.resolve({ success: false }) } },
    systemSettings: { getClaudeNativeDefaultModelId: { invoke: () => Promise.resolve(null) } },
  },
}));

vi.mock('@/renderer/pages/guid/hooks/agentSelectionUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/renderer/pages/guid/hooks/agentSelectionUtils')>();
  return { ...actual, savePreferredMode: vi.fn(), savePreferredModelId: vi.fn() };
});

vi.mock('@/renderer/pages/guid/hooks/useCustomAgentsLoader', () => ({
  useCustomAgentsLoader: () => ({
    customAgents: [],
    customAgentAvatarMap: new Map(),
    refreshCustomAgents: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock('@/renderer/pages/guid/hooks/usePresetAssistantResolver', () => ({
  usePresetAssistantResolver: () => ({
    resolvePresetRulesAndSkills: vi.fn(() => Promise.resolve({})),
    resolvePresetContext: vi.fn(() => Promise.resolve(undefined)),
    resolvePresetAgentType: vi.fn(() => 'fuigo'),
    resolveEnabledSkills: vi.fn(() => undefined),
    resolveDisabledBuiltinSkills: vi.fn(() => undefined),
  }),
}));

vi.mock('@/renderer/pages/guid/hooks/useAgentAvailability', () => ({
  useAgentAvailability: () => ({
    isMainAgentAvailable: () => true,
    getEffectiveAgentType: () => ({
      agentType: 'fuigo',
      isFallback: false,
      originalType: 'fuigo',
      isAvailable: true,
    }),
  }),
}));

import { ConfigStorage } from '@/common/config/storage';
import { useGuidAgentSelection } from '@/renderer/pages/guid/hooks/useGuidAgentSelection';

const setSpy = ConfigStorage.set as unknown as ReturnType<typeof vi.fn>;

const PRESET_ONLY: AvailableAgent[] = [
  { backend: 'fuigo', name: 'Concierge', customAgentId: 'builtin-concierge', isPreset: true },
];

describe('useGuidAgentSelection - Fuigo is the bundled default engine', () => {
  beforeEach(() => {
    cfg.values = {};
    agents.current = [];
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts a new chat on fuigo before any saved selection is restored', () => {
    // No detected agents -> the restore effect never runs; this is the bare
    // initial state every first render shows.
    const { result } = renderHook(() =>
      useGuidAgentSelection({ modelList: [], isGoogleAuth: false, localeKey: 'en-US' })
    );
    expect(result.current.selectedAgentKey).toBe('fuigo');
    expect(result.current.selectedAgent).toBe('fuigo');
  });

  it('falls back to fuigo on a sidebar "new chat" reset when no CLI agent is detected', async () => {
    agents.current = PRESET_ONLY;
    const { result } = renderHook(() =>
      useGuidAgentSelection({
        modelList: [],
        isGoogleAuth: false,
        localeKey: 'en-US',
        resetAssistant: true,
        locationKey: 'k1',
      })
    );
    await waitFor(() => expect(result.current.selectedAgentKey).toBe('fuigo'));
    await waitFor(() => expect(setSpy).toHaveBeenCalledWith('guid.lastSelectedAgent', 'fuigo'));
  });

  it('exposes fuigo as defaultAgentKey when only preset assistants are available', async () => {
    agents.current = PRESET_ONLY;
    const { result } = renderHook(() =>
      useGuidAgentSelection({ modelList: [], isGoogleAuth: false, localeKey: 'en-US' })
    );
    await act(async () => {});
    expect(result.current.defaultAgentKey).toBe('fuigo');
  });
});
