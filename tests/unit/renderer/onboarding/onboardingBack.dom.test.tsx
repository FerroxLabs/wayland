/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Onboarding must let people step BACK (Sean, live test: "on the onboarding
 * screen you never have a back button on any of the onboarding screens to go
 * back a step").
 *
 * The flow is a forward-only state machine, so a mistyped name or a wrong focus
 * pick was unrecoverable without restarting the app. These drive the real
 * component: advance with the production Continue/Skip buttons, press Back, and
 * assert both that the screen actually stepped back AND that what the user
 * typed is still there. Following onboardingResume.dom.test.tsx, react-i18next
 * is mocked so `t` returns the raw key and every control is queryable by name.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '@/common/types/onboarding';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts.name === 'string' ? `${key}:${opts.name}` : key,
  }),
}));

// Never resolves, so `busy` stays set for the duration of the assertion - the
// exact state a back control must not navigate out of.
const pendingFluxConnect = vi.fn(() => new Promise<never>(() => {}));

vi.mock('@/common', () => ({
  ipcBridge: {
    modelRegistry: { connect: { invoke: vi.fn().mockResolvedValue({ ok: true }) } },
    onboarding: { connectFlux: { invoke: (...args: unknown[]) => pendingFluxConnect(...args) } },
  },
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@renderer/utils/platform', () => ({
  openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line import/first
import OnboardingFlow from '@renderer/components/onboarding/OnboardingFlow';

const PROGRESS_KEY = 'onboarding.progress';
const BACK = 'onboarding.flow.back';

const detection = (): DetectionResult => ({
  name: '',
  clis: [],
  agents: [],
  envKeys: [],
  claudePro: false,
  ollama: { running: false, models: [] },
  fluxDesktop: { running: false },
  fluxConnected: false,
});

/** Land on a screen the way a resumed session does (the production restore path). */
const renderAt = (screenName: string) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: screenName, name: 'Sean', picks: [], work: '' }));
  return render(<OnboardingFlow detection={detection()} onFinish={vi.fn()} />);
};

const backButton = () => screen.getByRole('button', { name: BACK });

describe('onboarding back control', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it('steps back one screen and keeps what the user typed', () => {
    renderAt('interests');

    // Type into the real work field, then advance with the real Skip control.
    const work = screen.getByPlaceholderText('onboarding.flow.interests.workPlaceholder') as HTMLInputElement;
    fireEvent.change(work, { target: { value: 'ship the preview' } });
    fireEvent.click(screen.getByRole('button', { name: 'onboarding.flow.interests.skip' }));

    // Forward transition landed on layout.
    expect(screen.getByText('onboarding.flow.layout.headline')).toBeTruthy();

    fireEvent.click(backButton());

    // Back landed on interests - exactly one step, not two (that would be outcome).
    expect(screen.getByText('onboarding.flow.interests.sub')).toBeTruthy();
    // ...and the answer survived the round trip.
    expect((screen.getByPlaceholderText('onboarding.flow.interests.workPlaceholder') as HTMLInputElement).value).toBe(
      'ship the preview'
    );
  });

  it('offers no back control on the first screen', () => {
    renderAt('quickstart');

    expect(screen.getByPlaceholderText('onboarding.flow.quickstart.namePlaceholder')).toBeTruthy();
    expect(screen.queryByRole('button', { name: BACK })).toBeNull();
  });

  it('is a real keyboard-reachable button on every later screen', () => {
    for (const s of ['scan', 'outcome', 'interests', 'layout', 'allset']) {
      renderAt(s);
      const btn = backButton();
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.getAttribute('type')).toBe('button');
      // Native <button> is tab-reachable; a removed-from-order control is not.
      expect(btn.getAttribute('tabindex')).not.toBe('-1');
      cleanup();
      localStorage.clear();
    }
  });

  it('refuses to navigate out of an in-flight connection', () => {
    renderAt('outcome');

    // Start the Flux connect; `busy` is set for as long as it is in flight.
    fireEvent.click(screen.getByRole('button', { name: /onboarding\.flow\.outcome\.doorFluxTitle/ }));

    expect((backButton() as HTMLButtonElement).disabled).toBe(true);
  });
});
