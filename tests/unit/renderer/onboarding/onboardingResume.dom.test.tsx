/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Onboarding resume-across-remount (fix for Sean's "onboarding reloads when it
 * enters multi-agent mode" — a remount restarted the flow at step 1 because the
 * screen + answers were unpersisted useState).
 *
 * The flow now mirrors its progress to localStorage (synchronous + always-local,
 * like the completion marker). These tests assert the contract via the
 * localStorage side-effect rather than screen content (the flow has no testids):
 * on mount the persist effect re-serialises the CURRENT state, so the stored
 * `screen` reflects whatever the initializer restored — proving resume vs reset.
 */

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '@/common/types/onboarding';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts.name === 'string' ? `${key}:${opts.name}` : key,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    modelRegistry: { connect: { invoke: vi.fn().mockResolvedValue({ ok: true }) } },
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

const emptyDetection = (): DetectionResult => ({
  name: '',
  clis: [],
  agents: [],
  envKeys: [],
  claudePro: false,
  ollama: { running: false, models: [] },
  fluxDesktop: { running: false },
  fluxConnected: false,
});

const savedProgress = (): { screen?: string; name?: string; work?: string } => {
  const raw = localStorage.getItem(PROGRESS_KEY);
  return raw ? JSON.parse(raw) : {};
};

describe('onboarding progress persistence (resume across remount)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it('restores a mid-flow screen + answers from localStorage instead of restarting at step 1', () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ screen: 'interests', name: 'Sean', picks: [], work: 'ship the preview' })
    );

    render(<OnboardingFlow detection={emptyDetection()} onFinish={vi.fn()} />);

    // The mount persist effect re-serialises the CURRENT state. If restore worked
    // the stored screen stays 'interests'; if it had reset it would be 'quickstart'.
    const saved = savedProgress();
    expect(saved.screen).toBe('interests');
    expect(saved.name).toBe('Sean');
    expect(saved.work).toBe('ship the preview');
  });

  it('persists progress on mount for a fresh flow (so the first remount can resume)', () => {
    render(<OnboardingFlow detection={emptyDetection()} onFinish={vi.fn()} />);

    const saved = savedProgress();
    expect(saved.screen).toBe('quickstart');
  });

  it('ignores a corrupt/invalid persisted screen and falls back to step 1', () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: 'not-a-real-screen', name: 'X' }));

    render(<OnboardingFlow detection={emptyDetection()} onFinish={vi.fn()} />);

    // Invalid entry rejected → initializer defaults to quickstart, then re-persists it.
    expect(savedProgress().screen).toBe('quickstart');
  });
});
