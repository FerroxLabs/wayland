/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Onboarding must let people connect the keys they already have (Sean, live test:
 * "there wasn't a section in the onboarding to enter any other keys that I had.
 * It just had setup FluxRouter and no other option").
 *
 * The outcome screen has three branches. The cold branch and the already-wired
 * branch both offered a paste-a-key field; the CLI-ONLY branch (installed agents
 * detected, but no provider key / Ollama / Flux) offered Flux as the only door.
 * Anyone with Claude Code on PATH and their own Anthropic key landed there and
 * had nowhere to put it.
 *
 * These assert the paste field exists in that branch, and that Flux is still
 * offered alongside it (the fix must not displace the recommended door).
 * Following onboardingResume.dom.test.tsx: react-i18next is mocked so `t`
 * returns the raw key, which makes the field queryable by its placeholder.
 */

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
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
const KEY_PLACEHOLDER = 'onboarding.flow.key.placeholder';

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

/** Land directly on the outcome screen via the persisted-progress restore path. */
const renderOutcome = (over: Partial<DetectionResult> = {}) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ screen: 'outcome', name: 'Sean', picks: [] }));
  return render(<OnboardingFlow detection={detection(over)} onFinish={vi.fn()} />);
};

describe('onboarding outcome: every branch can connect an existing key', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it('offers a provider-key field when only CLI agents were detected', () => {
    renderOutcome({ clis: ['claude-code'] });

    // Proves we are in the CLI-only branch and not the cold/wired one.
    expect(screen.getByText('onboarding.flow.outcome.cliNote')).toBeTruthy();
    expect(screen.getByPlaceholderText(KEY_PLACEHOLDER)).toBeTruthy();
  });

  it('still offers the Flux door in the CLI-only branch', () => {
    renderOutcome({ clis: ['claude-code'] });

    expect(screen.getByText('onboarding.flow.outcome.cliNote')).toBeTruthy();
    expect(screen.getByText('onboarding.flow.flux.cta')).toBeTruthy();
  });

  it('offers the field for a claudePro-only detection too', () => {
    renderOutcome({ claudePro: true });

    expect(screen.getByText('onboarding.flow.outcome.cliNote')).toBeTruthy();
    expect(screen.getByPlaceholderText(KEY_PLACEHOLDER)).toBeTruthy();
  });

  it('keeps the field in the truly-cold branch (unchanged behaviour)', () => {
    renderOutcome();

    expect(screen.getByPlaceholderText(KEY_PLACEHOLDER)).toBeTruthy();
  });
});
