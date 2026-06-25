/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Regression tests for issue #141: disabled assistants AND extension/template
 * inventory must not leak into the new-chat pickers.
 *
 *  - `useConversationAgents` filters hidden CLI agents (agents.hidden) and
 *    extension adapters out of the *launch* choices, with an empty-result
 *    fallback so the picker is never left empty.
 *  - `useCustomAgentsLoader` only includes presets with `enabled !== false`
 *    and no longer force-enables extension assistants, with the same fallback.
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AvailableAgent } from '@/renderer/utils/model/agentTypes';

// --- mock data the mocks read from (mutated per test) -----------------------
const detectedRef = vi.hoisted(() => ({ value: [] as AvailableAgent[] }));
const hiddenRef = vi.hoisted(() => ({ value: undefined as string[] | undefined }));
const assistantsRef = vi.hoisted(() => ({ value: [] as unknown[] }));
const extAssistantsRef = vi.hoisted(() => ({ value: [] as Record<string, unknown>[] }));

const fetchDetectedAgents = vi.hoisted(() => vi.fn());
const getAssistants = vi.hoisted(() => vi.fn());
const refreshCustomAgents = vi.hoisted(() => vi.fn());
const configGet = vi.hoisted(() => vi.fn());
const configSet = vi.hoisted(() => vi.fn());

vi.mock('@/renderer/utils/model/agentTypes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/renderer/utils/model/agentTypes')>();
  return { ...actual, fetchDetectedAgents };
});

vi.mock('@/common', () => ({
  ipcBridge: {
    extensions: { getAssistants: { invoke: getAssistants } },
    acpConversation: { refreshCustomAgents: { invoke: refreshCustomAgents } },
  },
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: configGet, set: configSet },
}));

import { useConversationAgents } from '@/renderer/pages/conversation/hooks/useConversationAgents';
import { useCustomAgentsLoader } from '@/renderer/pages/guid/hooks/useCustomAgentsLoader';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    SWRConfig,
    { value: { provider: () => new Map(), dedupingInterval: 0 } },
    children
  );
}

function resetMocks() {
  vi.clearAllMocks();
  fetchDetectedAgents.mockImplementation(async () => detectedRef.value);
  getAssistants.mockImplementation(async () => extAssistantsRef.value);
  refreshCustomAgents.mockResolvedValue(undefined);
  configGet.mockImplementation(async (key: string) => {
    if (key === 'agents.hidden') return hiddenRef.value;
    if (key === 'assistants') return assistantsRef.value;
    return undefined;
  });
  configSet.mockResolvedValue(undefined);
}

beforeEach(() => {
  resetMocks();
  detectedRef.value = [];
  hiddenRef.value = undefined;
  assistantsRef.value = [];
  extAssistantsRef.value = [];
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useConversationAgents - launch choice filtering (#141)', () => {
  it('filters a hidden CLI agent out of the launch choices', async () => {
    detectedRef.value = [
      { backend: 'wcore', name: 'WCore' },
      { backend: 'codex', name: 'Codex' },
    ];
    hiddenRef.value = ['codex'];

    const { result } = renderHook(() => useConversationAgents(), { wrapper });

    await waitFor(() => expect(result.current.cliAgents.map((a) => a.backend)).toEqual(['wcore']));
  });

  it('excludes extension/template adapters from the launch choices', async () => {
    detectedRef.value = [
      { backend: 'wcore', name: 'WCore' },
      { backend: 'claude', name: 'Ext Adapter', isExtension: true, customAgentId: 'ext-1' },
    ];

    const { result } = renderHook(() => useConversationAgents(), { wrapper });

    await waitFor(() => expect(result.current.cliAgents).toHaveLength(1));
    expect(result.current.cliAgents[0].backend).toBe('wcore');
  });

  it('falls back to the unfiltered list when every CLI agent is hidden', async () => {
    detectedRef.value = [
      { backend: 'wcore', name: 'WCore' },
      { backend: 'codex', name: 'Codex' },
    ];
    hiddenRef.value = ['wcore', 'codex'];

    const { result } = renderHook(() => useConversationAgents(), { wrapper });

    // Never empty: the guard returns the full set rather than stranding the user.
    await waitFor(() => expect(result.current.cliAgents).toHaveLength(2));
  });
});

describe('useCustomAgentsLoader - preset + extension filtering (#141)', () => {
  const emptyIds = new Set<string>();

  it('filters a disabled preset out of the launch data', async () => {
    assistantsRef.value = [
      { id: 'p1', name: 'Enabled', isPreset: true, enabled: true },
      { id: 'p2', name: 'Disabled', isPreset: true, enabled: false },
    ];

    const { result } = renderHook(() => useCustomAgentsLoader({ availableCustomAgentIds: emptyIds }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.customAgents.map((a) => a.id)).toEqual(['p1']));
  });

  it('excludes a disabled extension assistant and never force-enables it', async () => {
    assistantsRef.value = [{ id: 'p1', name: 'Enabled', isPreset: true, enabled: true }];
    extAssistantsRef.value = [
      { id: 'ext-on', name: 'Ext On' },
      { id: 'ext-off', name: 'Ext Off', enabled: false },
    ];

    const { result } = renderHook(() => useCustomAgentsLoader({ availableCustomAgentIds: emptyIds }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.customAgents.map((a) => a.id)).toEqual(['p1', 'ext-on']));
  });

  it('falls back to all presets when filtering leaves the list empty', async () => {
    // Every preset disabled and no extensions => without the guard the list
    // would be empty; the fallback surfaces the presets so the picker works.
    assistantsRef.value = [
      { id: 'p1', name: 'A', isPreset: true, enabled: false },
      { id: 'p2', name: 'B', isPreset: true, enabled: false },
    ];

    const { result } = renderHook(() => useCustomAgentsLoader({ availableCustomAgentIds: emptyIds }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.customAgents.map((a) => a.id)).toEqual(['p1', 'p2']));
  });
});
