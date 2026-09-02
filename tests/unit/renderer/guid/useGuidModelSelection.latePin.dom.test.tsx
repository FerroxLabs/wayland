/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig, useSWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A PIN WRITTEN AFTER RESOLUTION MUST STILL WIN, WITH NO CATALOG CHANGE.
 *
 * Onboarding writes `wcore.defaultModel` after the composer has already
 * resolved and locked. The previous fix announced that by revalidating
 * `model.config.welcome` — but that key holds the PROVIDER CATALOG, which a pin
 * write does not touch. SWR refetches, finds the data deep-equal, keeps the
 * same reference, the derived `modelList` memo does not recompute, and the
 * resolution effect (deps `[modelList, storageKey]`) never fires again. Every
 * guard inside it was unreachable.
 *
 * Measured live on 10 fresh Flux-connected profiles at `ec38dc678`: the pin on
 * disk read `flux-reasoning` on 9 of 10 runs while the composer chip read
 * `flux-auto` on 6 of 10 — and the catalog was complete and identical at every
 * sample from +2s to +15s, so nothing was racing to load. It corrected itself
 * on launch two, because by then the pin is on disk before the first
 * resolution. Session one is the one that decides what a buyer thinks.
 *
 * That matters beyond tidiness: `flux-auto` was measured at 1 completion in 6
 * on agentic work against `flux-reasoning`'s 8 in 8, so the buyer's very first
 * morning brief ran on the tier most likely to quit halfway.
 *
 * The fix gives the pin its own SWR key so it is a REACTIVE input to the
 * effect. This test fires ONLY that key — no `listChanged`, no catalog edit —
 * so it fails if the pin ever stops being a dependency.
 */

// The real Flux row: its `id` is a uuid and its `platform` is
// 'openai-compatible', so a pin naming `flux-router` can only ever match by the
// registry bridge tag. Measured off a live profile, not invented.
const FLUX_ROW = {
  id: 'cc9b9020-1111-2222-3333-444455556666',
  platform: 'openai-compatible',
  name: 'Flux Router',
  model: ['flux-auto', 'flux-reasoning', 'flux-fast'],
  __waylandModelRegistryBridge: 'v2:flux-router',
};

let modelConfig: unknown[] = [];
let routeThroughFlux = false;

vi.mock('@/common', () => ({
  ipcBridge: {
    mode: { getModelConfig: { invoke: vi.fn(async () => modelConfig) } },
    modelRegistry: { listChanged: { on: vi.fn(() => () => {}) } },
    systemSettings: { getRouteThroughFlux: { invoke: vi.fn(async () => routeThroughFlux) } },
    usage: { queryRecentlyUsedModels: { invoke: vi.fn(async () => []) } },
  },
}));

const store = new Map<string, unknown>();
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: vi.fn(async (k: string) => store.get(k)),
    set: vi.fn(async (k: string, v: unknown) => {
      store.set(k, v);
    }),
  },
}));

// THE MOCK HAS TO RETURN STABLE REFERENCES OR THIS TEST ASSERTS NOTHING.
//
// Returning a fresh `{ geminiModeOptions: [] }` per call makes the derived
// `modelList` memo recompute on EVERY render, so the resolution effect re-runs
// on every render too - and the test then passes with the fix removed, which is
// exactly what it did the first time it was written. A real hook returns stable
// references between renders; mirroring that is what lets the assertion below
// discriminate.
vi.mock('@renderer/hooks/agent/useGeminiGoogleAuthModels', () => {
  const stable = { geminiModeOptions: [] as never[], isGoogleAuth: false };
  return { useGeminiGoogleAuthModels: () => stable };
});

import { MODEL_PIN_SWR_KEY, useGuidModelSelection } from '@renderer/pages/guid/hooks/useGuidModelSelection';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>
);

/**
 * The wrapper gives each test its OWN cache, and `mutate` imported from 'swr'
 * only ever addresses the default global one - so revalidating through the
 * import silently reaches nothing here and the assertion below would fail for a
 * reason that has nothing to do with the product. Take the scoped mutate from
 * inside the provider instead. (The app itself mounts no SWRConfig provider, so
 * onboarding's imported `globalMutate` does hit the cache this hook reads.)
 */
const renderSelection = () =>
  renderHook(
    () => {
      const selection = useGuidModelSelection('wcore');
      const { mutate } = useSWRConfig();
      return { selection, mutate };
    },
    { wrapper }
  );

describe('useGuidModelSelection — a pin that lands after resolution', () => {
  beforeEach(() => {
    modelConfig = [FLUX_ROW];
    routeThroughFlux = true;
    store.clear();
  });

  it('follows a late flux-reasoning pin with no catalog change at all', async () => {
    // Cold start, Flux connected, no pin yet: the chain lands on flux-auto.
    const { result } = renderSelection();
    await waitFor(() => expect(result.current.selection.currentModel?.useModel).toBe('flux-auto'));

    // Onboarding's pin lands a beat later. The catalog is UNTOUCHED - this is
    // the exact condition the old announce could not signal.
    store.set('wcore.defaultModel', { id: 'flux-router', useModel: 'flux-reasoning' });
    await result.current.mutate((key) => Array.isArray(key) && key[0] === MODEL_PIN_SWR_KEY);

    await waitFor(() => expect(result.current.selection.currentModel?.useModel).toBe('flux-reasoning'));
  });

  it('does not let a late pin override a model the user actually picked', async () => {
    const { result } = renderSelection();
    await waitFor(() => expect(result.current.selection.currentModel?.useModel).toBe('flux-auto'));

    // A deliberate pick - `persist` defaults to true, which is how the setter
    // tells a choice from a fallback.
    await result.current.selection.setCurrentModel({ ...FLUX_ROW, useModel: 'flux-fast' } as never);
    await waitFor(() => expect(result.current.selection.currentModel?.useModel).toBe('flux-fast'));

    // A stale pin now arriving must NOT throw the user's own pick away.
    store.set('wcore.defaultModel', { id: 'flux-router', useModel: 'flux-reasoning' });
    await result.current.mutate((key) => Array.isArray(key) && key[0] === MODEL_PIN_SWR_KEY);
    await new Promise((r) => setTimeout(r, 60));

    expect(result.current.selection.currentModel?.useModel).toBe('flux-fast');
  });
});
