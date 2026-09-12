/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AvailableAgent } from '@/renderer/pages/guid/types';

/**
 * Verifies the reversible "land on Concierge" default in
 * useGuidAgentSelection.restoreSavedSelection:
 *   - fresh install (no saved key)          → custom:builtin-concierge
 *   - explicit saved selection              → unchanged (never overridden)
 *   - concierge.defaultPersona === false    → first detected engine, not concierge
 */

// Configurable ConfigStorage fixture - key → resolved value.
const cfg = vi.hoisted(() => ({ values: {} as Record<string, unknown> }));
const agents = vi.hoisted(() => ({ current: [] as AvailableAgent[] }));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn((key: string) => Promise.resolve(cfg.values[key])),
    set: vi.fn(() => Promise.resolve()),
  },
}));

// useSWR is the only data source for availableAgents. Return STABLE references
// per key - a fresh object/array each render would change effect deps and spin
// setAvailableAgents into an infinite render loop.
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

// Keep getAgentKey real (pure), stub the persistence helpers.
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

import { useGuidAgentSelection } from '@/renderer/pages/guid/hooks/useGuidAgentSelection';

const renderSelection = () =>
  renderHook(() => useGuidAgentSelection({ modelList: [], isGoogleAuth: false, localeKey: 'en-US' }));

describe('useGuidAgentSelection - Concierge default persona', () => {
  beforeEach(() => {
    cfg.values = {};
    agents.current = [{ backend: 'fuigo', name: 'Fuigo' }];
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fresh install (no saved selection) lands on the Concierge assistant', async () => {
    cfg.values['guid.lastSelectedAgent'] = undefined;
    const { result } = renderSelection();
    await waitFor(() => expect(result.current.selectedAgentKey).toBe('custom:builtin-concierge'));
  });

  it('never overrides an explicit saved selection', async () => {
    cfg.values['guid.lastSelectedAgent'] = 'custom:builtin-cowork';
    const { result } = renderSelection();
    await waitFor(() => expect(result.current.selectedAgentKey).toBe('custom:builtin-cowork'));
  });

  it('respects the opt-out: concierge.defaultPersona=false keeps the first detected engine', async () => {
    cfg.values['guid.lastSelectedAgent'] = undefined;
    cfg.values['concierge.defaultPersona'] = false;
    const { result } = renderSelection();
    await waitFor(() => expect(result.current.selectedAgentKey).toBe('fuigo'));
    expect(result.current.selectedAgentKey).not.toBe('custom:builtin-concierge');
  });
});
