/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Fuigo cutover (Phase 2): onboarding pins the connected provider's default
 * model under `fuigo.defaultModel` - Fuigo is the engine a fresh profile chats
 * on. `wcore.defaultModel` is STILL written on this commit so a Core
 * conversation opened later has a model; Phase 3 removes it.
 *
 * Fuigo is bundled, not discovered: it must not count toward the "you already
 * have a CLI agent" (cli-only) fork of the outcome screen, exactly like the
 * bundled Wayland Core / Gemini CLI entries it joins. Fuigo's detection row is
 * `{ id: 'fuigo', kind: 'acp' }` (AgentRegistry.merge), so the filter has to
 * look at `id`, not `kind`.
 */

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '@/common/types/onboarding';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const providers = vi.hoisted(() => ({ current: [] as unknown[] }));
vi.mock('@/common', () => ({
  ipcBridge: {
    modelRegistry: { connect: { invoke: vi.fn().mockResolvedValue({ ok: true }) } },
    systemSettings: { setRouteThroughFlux: { invoke: vi.fn().mockResolvedValue(undefined) } },
    mode: { getModelConfig: { invoke: vi.fn(() => Promise.resolve(providers.current)) } },
  },
}));

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

const detection = (over: Partial<DetectionResult> = {}): DetectionResult => ({
  name: '',
  clis: [],
  agents: [],
  envKeys: [],
  claudePro: false,
  ollama: { running: false, models: [] },
  fluxDesktop: { running: false },
  fluxConnected: false,
  ...over,
});

const pinsFor = (key: string) => setSpy.mock.calls.filter(([k]: [string]) => k === key);

/** Mount on the scan screen and let the narrated scan settle (1750ms min beat). */
const runScan = async (over: Partial<DetectionResult>) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: 'scan', name: 'Sean' }));
  render(<OnboardingFlow detection={detection(over)} onFinish={vi.fn()} />);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 2_200));
  });
};

describe('onboarding - Fuigo is the engine the default-model pin targets', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    providers.current = [];
  });
  afterEach(() => cleanup());

  it('pins fuigo.defaultModel (and still wcore.defaultModel) when Flux is already connected', async () => {
    await runScan({ fluxConnected: true });

    const fuigo = pinsFor('fuigo.defaultModel');
    expect(fuigo.length).toBeGreaterThan(0);
    expect(fuigo[0][1]).toMatchObject({ id: 'flux-router', useModel: 'flux-reasoning' });
    // Phase-2 contract: the Core key keeps receiving the same pin until Phase 3.
    expect(pinsFor('wcore.defaultModel')[0]?.[1]).toEqual(fuigo[0][1]);
  }, 15_000);

  it('pins fuigo.defaultModel from the safe default when no Flux is connected', async () => {
    providers.current = [{ id: 'p-anthropic', name: 'Anthropic', platform: 'anthropic', model: ['claude-sonnet-4-5'] }];
    await runScan({ envKeys: ['anthropic'] });

    const fuigo = pinsFor('fuigo.defaultModel');
    expect(fuigo.length).toBeGreaterThan(0);
    expect(fuigo[0][1]).toEqual({ id: 'p-anthropic', useModel: 'claude-sonnet-4-5' });
    expect(pinsFor('wcore.defaultModel')[0]?.[1]).toEqual(fuigo[0][1]);
  }, 15_000);

  it('does not count the bundled Fuigo engine as a discovered CLI agent on the outcome screen', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: 'outcome', name: 'Sean', picks: [] }));
    render(
      <OnboardingFlow
        detection={detection({ agents: [{ id: 'fuigo', kind: 'acp', name: 'Fuigo' }] })}
        onFinish={vi.fn()}
      />
    );

    // True-cold branch: "do it later" ghost button, no CLI-only note.
    expect(screen.getByText('onboarding.flow.outcome.doLater')).toBeTruthy();
    expect(screen.queryByText('onboarding.flow.outcome.cliNote')).toBeNull();
  });

  it('still treats a genuinely discovered CLI agent as the cli-only fork', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: 'outcome', name: 'Sean', picks: [] }));
    render(
      <OnboardingFlow
        detection={detection({ agents: [{ id: 'claude', kind: 'acp', name: 'Claude Code' }] })}
        onFinish={vi.fn()}
      />
    );

    expect(screen.getByText('onboarding.flow.outcome.cliNote')).toBeTruthy();
    expect(screen.queryByText('onboarding.flow.outcome.doLater')).toBeNull();
  });
});
