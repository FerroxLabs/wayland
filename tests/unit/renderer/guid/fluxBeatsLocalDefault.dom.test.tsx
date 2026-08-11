/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression: the home picker walked past a CONNECTED Flux Router and made a
 * 3.3 GB local Ollama model (`gemma3:4b`) the default, then the turn 400'd
 * because that model rejects a tools-carrying request.
 *
 * Two independent causes, both reproduced here against the real provider shapes
 * the app mirrors into `model.config`:
 *
 *  1. The default-model pin this hook writes for an AUTO-resolved model is
 *     stored under the same key a deliberate pick uses. A cold start that ran
 *     before the cloud catalogs landed persisted `gemma3:4b` there, and on every
 *     later boot that pin outranked a connected Flux Router.
 *
 *  2. A pin that carries the model registry's ProviderId (`flux-router`) never
 *     resolved at all: the mirrored legacy row carries an opaque id
 *     (`b1c5cb99`), `platform: 'openai-compatible'` and the bridge tag
 *     `v2:flux-router`, so neither the id nor the platform match fired. The
 *     user's deliberate Flux pin was silently discarded every boot.
 *
 * The mirror control (no Flux connected, only Ollama present) proves the fix
 * does not simply disable local models.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ProviderRow = {
  id: string;
  name: string;
  platform: string;
  baseUrl: string;
  apiKey: string;
  model: string[];
  enabled?: boolean;
  __waylandModelRegistryBridge?: string;
};

/**
 * The auto-registered local Ollama daemon, exactly as `autoRegisterOllama`
 * mirrors it: opaque legacy id, `openai-compatible` platform, bridge tag
 * `v2:ollama-local`, and `gemma3:4b` first in the catalog.
 */
const OLLAMA_ROW: ProviderRow = {
  id: 'e6ea99f2',
  name: 'Ollama Local',
  platform: 'openai-compatible',
  baseUrl: 'http://127.0.0.1:11434/v1',
  apiKey: '',
  model: ['gemma3:4b', 'llama3.2:1b', 'qwen2.5:0.5b', 'qwen2.5:7b', 'smollm2:135m'],
  __waylandModelRegistryBridge: 'v2:ollama-local',
};

/** The connected Flux Router mirror row - opaque id, tag `v2:flux-router`. */
const FLUX_ROW: ProviderRow = {
  id: 'b1c5cb99',
  name: 'Flux Router',
  platform: 'openai-compatible',
  baseUrl: '',
  apiKey: 'sk-flux-test',
  model: ['flux-auto', 'flux-fast', 'flux-reasoning', 'flux-standard', 'flux-pinned-claude-opus-5'],
  __waylandModelRegistryBridge: 'v2:flux-router',
};

let modelConfig: ProviderRow[] = [];
let routeThroughFlux = false;
let recentlyUsed: Array<{ modelId: string; useCount: number; lastUsedMs: number }> = [];

vi.mock('@/common', () => ({
  ipcBridge: {
    mode: { getModelConfig: { invoke: vi.fn(async () => modelConfig) } },
    modelRegistry: { listChanged: { on: vi.fn(() => () => {}) } },
    systemSettings: { getRouteThroughFlux: { invoke: vi.fn(async () => routeThroughFlux) } },
    usage: { queryRecentlyUsedModels: { invoke: vi.fn(async () => recentlyUsed) } },
  },
}));

const store = new Map<string, unknown>();
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
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

/** Resolve the hook's default and let every async settle before asserting. */
const resolveDefault = async () => {
  const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });
  await waitFor(() => expect(result.current.currentModel).toBeDefined());
  // The resolver runs several awaits (pin read, telemetry, Flux toggle) before
  // it commits. Settle them so a late overwrite cannot pass as a pass.
  await new Promise((resolve) => setTimeout(resolve, 60));
  return result;
};

describe('useGuidModelSelection - a connected Flux Router outranks the local Ollama daemon', () => {
  beforeEach(() => {
    modelConfig = [];
    routeThroughFlux = false;
    recentlyUsed = [];
    store.clear();
  });

  it('an auto-persisted gemma3:4b pin loses to a connected Flux Router', async () => {
    // Exactly what the owner hit: routing is on (Flux connect enables it), the
    // Flux catalog is present, and the stale local pin is the one THIS hook
    // wrote on an earlier cold start.
    modelConfig = [OLLAMA_ROW, FLUX_ROW];
    routeThroughFlux = true;
    store.set('wcore.defaultModel', { id: 'e6ea99f2', useModel: 'gemma3:4b', accountId: 'default' });

    const result = await resolveDefault();

    expect(result.current.currentModel?.useModel).not.toBe('gemma3:4b');
    expect(result.current.currentModel?.name).toBe('Flux Router');
    expect(result.current.currentModel?.useModel).toBe('flux-auto');
  });

  it('the local daemon never wins the automatic default while Flux is connected', async () => {
    // No pin at all and routing turned OFF by the user. Flux is still connected,
    // so the auto-resolved default must not fall onto the local daemon just
    // because it was auto-registered first and sorts first in `model.config`.
    modelConfig = [OLLAMA_ROW, FLUX_ROW];
    routeThroughFlux = false;

    const result = await resolveDefault();

    expect(result.current.currentModel?.name).not.toBe('Ollama Local');
  });

  it('a registry-keyed Flux pin resolves against the mirrored provider row', async () => {
    // The pin the app writes when the user picks a Flux model carries the
    // registry ProviderId, not the opaque mirrored id. It must still resolve.
    modelConfig = [OLLAMA_ROW, FLUX_ROW];
    routeThroughFlux = false;
    store.set('wcore.defaultModel', {
      id: 'flux-router',
      useModel: 'flux-pinned-claude-opus-5',
      accountId: 'default',
    });

    const result = await resolveDefault();

    expect(result.current.currentModel?.useModel).toBe('flux-pinned-claude-opus-5');
    expect(result.current.currentModel?.name).toBe('Flux Router');
  });

  it('a deliberate local pick is honored even with Flux connected', async () => {
    // `guid.model_selected` telemetry is only written when the user picks from
    // the picker, so it is proof of intent. That must survive the fix.
    modelConfig = [OLLAMA_ROW, FLUX_ROW];
    routeThroughFlux = true;
    recentlyUsed = [{ modelId: 'qwen2.5:7b', useCount: 3, lastUsedMs: Date.now() }];

    const result = await resolveDefault();

    expect(result.current.currentModel?.name).toBe('Ollama Local');
    expect(result.current.currentModel?.useModel).toBe('qwen2.5:7b');
  });

  it('known-positive control: with no Flux connected a local model IS selected', async () => {
    // The mirror case. Nothing but the local daemon is available, so it must
    // still become the default - the fix must not disable local models.
    modelConfig = [OLLAMA_ROW];
    routeThroughFlux = false;

    const result = await resolveDefault();

    expect(result.current.currentModel?.name).toBe('Ollama Local');
    expect(result.current.currentModel?.useModel).toBe('gemma3:4b');
  });

  it('known-positive control: a local pin survives when Flux is not connected', async () => {
    modelConfig = [OLLAMA_ROW, { ...FLUX_ROW, model: [] }];
    routeThroughFlux = false;
    store.set('wcore.defaultModel', { id: 'e6ea99f2', useModel: 'qwen2.5:7b', accountId: 'default' });

    const result = await resolveDefault();

    expect(result.current.currentModel?.name).toBe('Ollama Local');
    expect(result.current.currentModel?.useModel).toBe('qwen2.5:7b');
  });
});
