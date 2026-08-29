/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * A BUYER WHO CLICKS FAST MUST STILL GET A DEFAULT MODEL.
 *
 * The scan effect's settle handler opened with `if (cancelled) return`, and its
 * cleanup sets `cancelled` whenever `screen` changes. So leaving the scan
 * screen before the scan settled threw away the default-model pin along with
 * the state updates, and the composer fell through to the cold-start resolver.
 *
 * Measured, not reasoned: 1 run in 10 of a fresh Flux-connected profile
 * finished onboarding with `wcore.defaultModel` undefined and the composer on
 * `flux-auto`. `cancelled` is there to suppress stale RENDERS - a config write
 * is idempotent and is what the user asked for by connecting a provider.
 */

import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '@/common/types/onboarding';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The auto-wire never settles until the test releases it, so the "user clicks
// past the scan" moment can be placed exactly before the handler runs.
let releaseWiring: (() => void) | null = null;
vi.mock('@/common', () => ({
  ipcBridge: {
    modelRegistry: {
      connect: {
        invoke: vi.fn(
          () =>
            new Promise((resolve) => {
              releaseWiring = () => resolve({ ok: true });
            })
        ),
      },
    },
    systemSettings: { setRouteThroughFlux: { invoke: vi.fn().mockResolvedValue(undefined) } },
    mode: { getModelConfig: { invoke: vi.fn().mockResolvedValue([]) } },
  },
}));

// `vi.mock` factories are hoisted above every const in this file, so the spy
// has to be created inside the factory and read back through the mocked module.
vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@renderer/utils/platform', () => ({ openExternalUrl: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: vi.fn() }));

// eslint-disable-next-line import/first
import { ConfigStorage } from '@/common/config/storage';
// eslint-disable-next-line import/first
import OnboardingFlow from '@renderer/components/onboarding/OnboardingFlow';

const setSpy = ConfigStorage.set as unknown as ReturnType<typeof vi.fn>;

const PROGRESS_KEY = 'onboarding.progress';

const fluxDetection = (): DetectionResult => ({
  name: '',
  clis: [],
  agents: [],
  envKeys: ['groq'],
  claudePro: false,
  ollama: { running: false, models: [] },
  fluxDesktop: { running: false },
  fluxConnected: true,
});

describe('onboarding — the default-model pin survives leaving the scan screen', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    releaseWiring = null;
  });
  afterEach(() => cleanup());

  it('still writes wcore.defaultModel when the user advances before the scan settles', async () => {
    // Start ON the scan screen, so the effect under test runs on mount.
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: 'scan', name: 'Matty' }));
    const { unmount } = render(<OnboardingFlow detection={fluxDetection()} onFinish={vi.fn()} />);

    // The buyer clicks on. Unmounting runs the same cleanup a screen change
    // does, which is what sets `cancelled`.
    unmount();

    // Only now does the wiring settle, so the handler runs with cancelled=true.
    await act(async () => {
      releaseWiring?.();
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 2_000));
    });

    const pinned = setSpy.mock.calls.filter(([key]: [string]) => key === 'wcore.defaultModel');
    expect(pinned.length).toBeGreaterThan(0);
    expect(pinned[0][1]).toMatchObject({ useModel: 'flux-reasoning' });
  }, 15_000);
});
