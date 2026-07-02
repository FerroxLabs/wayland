/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression for issue #108 — brand-new user connects Flux Router in the
 * first-run onboarding overlay and the first chat gets no response.
 *
 * The onboarding overlay is a Modal mounted ON TOP of the already-mounted home
 * page. Connecting Flux mirrors the new provider into `model.config` and emits
 * `modelRegistry.listChanged`, but the home picker's SWR view
 * (`model.config.welcome`) used to ignore that event, so its cache stayed on
 * the empty cold-start snapshot, `currentModel` never resolved, and the first
 * send was silently dropped by the wcore "no model configured" guard.
 *
 * The fix subscribes the hook to `modelRegistry.listChanged` and revalidates.
 * This test proves that firing the event after a connect resolves
 * `currentModel` to `flux-auto`.
 */

// Mutable model-config the mocked IPC returns. Starts empty (brand-new user),
// then a Flux connect populates it.
let modelConfig: Array<{ id: string; platform: string; model: string[]; enabled?: boolean }> = [];

// Capture the renderer's `modelRegistry.listChanged` subscriber so the test can
// fire the event the same way a real connect does.
let listChangedHandler: (() => void) | null = null;

// Mutable "Route through Flux" state the mocked systemSettings IPC returns.
let routeThroughFlux = false;

vi.mock('@/common', () => ({
  ipcBridge: {
    mode: {
      getModelConfig: { invoke: vi.fn(async () => modelConfig) },
    },
    modelRegistry: {
      listChanged: {
        on: vi.fn((cb: () => void) => {
          listChangedHandler = cb;
          return () => {
            listChangedHandler = null;
          };
        }),
      },
    },
    systemSettings: {
      getRouteThroughFlux: { invoke: vi.fn(async () => routeThroughFlux) },
    },
    usage: {
      // No telemetry for a brand-new user.
      queryRecentlyUsedModels: { invoke: vi.fn(async () => []) },
    },
  },
}));

// In-memory ConfigStorage — no saved default-model pin for a brand-new user.
const store = new Map<string, unknown>();
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store.get(k)),
    set: vi.fn(async (k: string, v: unknown) => {
      store.set(k, v);
    }),
  },
}));

// No Google Auth in play for the wcore home picker.
vi.mock('@renderer/hooks/agent/useGeminiGoogleAuthModels', () => ({
  useGeminiGoogleAuthModels: () => ({ geminiModeOptions: [], isGoogleAuth: false }),
}));

import { useGuidModelSelection } from '@renderer/pages/guid/hooks/useGuidModelSelection';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

describe('useGuidModelSelection — issue #108 first-run Flux revalidation', () => {
  beforeEach(() => {
    modelConfig = [];
    listChangedHandler = null;
    routeThroughFlux = false;
    store.clear();
  });

  it('resolves currentModel to flux-auto after a connect emits modelRegistry.listChanged', async () => {
    const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });

    // Brand-new user, model config still empty: no model resolves and the first
    // send would be silently dropped.
    await waitFor(() => expect(result.current.modelList).toHaveLength(0));
    expect(result.current.currentModel).toBeUndefined();

    // The onboarding overlay connects Flux: the main process mirrors the
    // provider into model.config and emits listChanged.
    modelConfig = [{ id: 'flux-router', platform: 'flux-router', model: ['flux-auto', 'flux-fast'] }];
    expect(listChangedHandler).toBeTypeOf('function');
    listChangedHandler!();

    // The picker re-reads model.config and lands the cold-start default on
    // flux-auto so the very first send has a real model. (Also guards the
    // capability fix: flux-auto must NOT be filtered out of the primary list
    // by the image-model `excludeFromPrimary` rule.)
    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('flux-auto'));
    expect(result.current.modelList).toHaveLength(1);
  });

  it('#129 - upgrades a stale local default to flux-auto once Route through Flux is on', async () => {
    // Repro for the live-found bug: a local Ollama model (smollm2:135m) loads
    // into the catalog instantly and the home locks onto it. A beat later the
    // onboarding Flux connect pins flux-auto + turns routing on. The lock used to
    // keep the stale local pick in-session until an app restart re-read the pin.
    modelConfig = [{ id: 'ollama', platform: 'ollama', model: ['smollm2:135m'] }];
    const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });

    // Cold start with only the local model present -> it wins the default.
    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('smollm2:135m'));

    // Onboarding Flux connect: flux-auto becomes available, routing flips on, and
    // the default-model pin is rewritten to flux-auto. Fire listChanged as a real
    // connect does.
    store.set('wcore.defaultModel', { id: 'flux-router', useModel: 'flux-auto' });
    routeThroughFlux = true;
    modelConfig = [
      { id: 'ollama', platform: 'ollama', model: ['smollm2:135m'] },
      { id: 'flux-router', platform: 'flux-router', model: ['flux-auto', 'flux-fast'] },
    ];
    listChangedHandler!();

    // The lock must yield: the stale smollm2 default is superseded by flux-auto.
    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('flux-auto'));
  });

  it('#129 - leaves a deliberate non-flux pick alone even with Route through Flux on', async () => {
    // The lock-yield must only promote an UNCHOSEN default to flux-auto, never
    // override a model the user actually picked (their saved pin comes first in
    // the resolution order).
    store.set('wcore.defaultModel', { id: 'openai', useModel: 'gpt-5.5' });
    routeThroughFlux = true;
    modelConfig = [
      { id: 'openai', platform: 'openai', model: ['gpt-5.5'] },
      { id: 'flux-router', platform: 'flux-router', model: ['flux-auto'] },
    ];
    const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });

    await waitFor(() => expect(result.current.currentModel?.useModel).toBe('gpt-5.5'));
    // Give the flux-override path a chance to (wrongly) replace it.
    await new Promise((r) => setTimeout(r, 40));
    expect(result.current.currentModel?.useModel).toBe('gpt-5.5');
  });

  it('#538 - a disabled provider is excluded from the new-chat model list and never becomes the default', async () => {
    // mc14: disabled all OpenAI, left only a local model available, yet a new chat
    // defaulted to gpt-5.5. The disabled provider row must be filtered out of the
    // candidate list (mirroring useModelProviderList) so it can't win the default.
    modelConfig = [
      { id: 'openai', platform: 'openai', model: ['gpt-5.5'], enabled: false },
      { id: 'lmstudio', platform: 'openai-compatible', model: ['local-a'] },
    ];
    const { result } = renderHook(() => useGuidModelSelection('wcore'), { wrapper });

    await waitFor(() => expect(result.current.modelList).toHaveLength(1));
    expect(result.current.modelList.map((p) => p.id)).toEqual(['lmstudio']);
    // Give any default-resolution pass a beat, then confirm the disabled model
    // never surfaced as the selection.
    await new Promise((r) => setTimeout(r, 40));
    expect(result.current.currentModel?.useModel).not.toBe('gpt-5.5');
  });
});
