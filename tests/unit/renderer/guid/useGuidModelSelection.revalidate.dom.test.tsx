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
let modelConfig: Array<{ id: string; platform: string; model: string[] }> = [];

// Capture the renderer's `modelRegistry.listChanged` subscriber so the test can
// fire the event the same way a real connect does.
let listChangedHandler: (() => void) | null = null;

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
});
