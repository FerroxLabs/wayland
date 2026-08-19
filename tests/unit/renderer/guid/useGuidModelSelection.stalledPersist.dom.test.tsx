/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */
// @vitest-environment jsdom

/**
 * Regression: a stalled config write must not strand the model selection.
 *
 * `setCurrentModel` used to `await ConfigStorage.set(...)` BEFORE calling
 * `_setCurrentModel(...)`. The renderer IPC bridge is resolve-only - it has no
 * reject path and no timeout - so a provider that never answers leaves that
 * promise pending forever and React state is never updated. The user then sees
 * "No model configured yet" with a disabled Send while the picker happily lists
 * hundreds of models, and every manual pick is swallowed by the same await.
 *
 * Reported live against v0.12.0 with eleven connected providers and a VALID
 * saved pin, so nothing about the catalogue or the pin explains it.
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let modelConfig: Array<{ id: string; platform: string; model: string[] }> = [];
let routeThroughFlux = false;

vi.mock('@/common', () => ({
  ipcBridge: {
    mode: { getModelConfig: { invoke: vi.fn(async () => modelConfig) } },
    modelRegistry: { listChanged: { on: vi.fn(() => () => undefined) } },
    systemSettings: { getRouteThroughFlux: { invoke: vi.fn(async () => routeThroughFlux) } },
    usage: { queryRecentlyUsedModels: { invoke: vi.fn(async () => []) } },
  },
}));

const store = new Map<string, unknown>();
// `set` never settles - exactly what the resolve-only bridge does when the
// provider does not answer. Never rejects, so an inline .catch() cannot help.
let stallWrites = false;
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store.get(k)),
    set: vi.fn((k: string, v: unknown) => {
      if (stallWrites) return new Promise<void>(() => undefined);
      store.set(k, v);
      return Promise.resolve();
    }),
  },
}));

vi.mock('@renderer/hooks/agent/useGeminiGoogleAuthModels', () => ({
  useGeminiGoogleAuthModels: () => ({ geminiModeOptions: [], isGoogleAuth: false }),
}));

import { useGuidModelSelection } from '@renderer/pages/guid/hooks/useGuidModelSelection';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

describe('useGuidModelSelection - a stalled config write must not strand selection', () => {
  beforeEach(() => {
    modelConfig = [
      { id: 'b1c5cb99', platform: 'openai-compatible', model: ['flux-pinned-claude-opus-5', 'flux-auto'] },
    ];
    routeThroughFlux = false;
    stallWrites = false;
    store.clear();
    store.set('wcore.defaultModel', { id: 'b1c5cb99', useModel: 'flux-pinned-claude-opus-5', accountId: 'default' });
  });

  it('resolves the saved pin even when the persistence write never settles', async () => {
    stallWrites = true;
    const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });
    await waitFor(() => expect(result.current.modelList.length).toBeGreaterThan(0));
    // The gate that drives the CTA and the Send button reads exactly this.
    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('flux-pinned-claude-opus-5'), {
      timeout: 3000,
    });
  });

  it('still applies a manual pick when the write never settles', async () => {
    const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });
    await waitFor(() => expect(result.current.currentModel).toBeDefined());
    stallWrites = true;
    await result.current.setCurrentModel({
      id: 'b1c5cb99',
      platform: 'openai-compatible',
      model: ['flux-auto'],
      useModel: 'flux-auto',
    } as never);
    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('flux-auto'));
  });
});
