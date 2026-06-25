/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { DetectionResult } from '@/common/types/onboarding';

const hooks = vi.hoisted(() => ({
  detection: vi.fn(),
  configGet: vi.fn(),
  configSet: vi.fn(),
}));

vi.mock('@renderer/hooks/useOnboardingDetection', () => ({
  useOnboardingDetection: hooks.detection,
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: hooks.configGet,
    set: hooks.configSet,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && typeof opts.name === 'string' ? `${key}:${opts.name}` : key,
  }),
}));

vi.mock('@renderer/hooks/useModelRegistry', () => ({
  useModelRegistry: () => ({ connect: vi.fn().mockResolvedValue({ ok: true }) }),
}));

vi.mock('@renderer/utils/platform', () => ({
  openExternalUrl: vi.fn().mockResolvedValue(undefined),
}));

// Stand-in flow that exposes a single button which triggers `onFinish` (the
// overlay's `dismiss`), so dismiss behaviour can be tested without driving the
// real multi-screen flow.
vi.mock('../../src/renderer/components/onboarding/OnboardingFlow', () => ({
  default: ({ onFinish }: { onFinish: () => void }) => (
    <button type='button' data-testid='finish-onboarding' onClick={onFinish}>
      onboarding.flow.quickstart.headline
    </button>
  ),
}));

import OnboardingOverlay from '../../src/renderer/components/onboarding/OnboardingOverlay';

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

describe('OnboardingOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.configSet.mockResolvedValue(undefined);
    localStorage.clear();
  });

  it('opens the onboarding flow on a fresh machine', async () => {
    // Nothing detected, flag unset ⇒ overlay shows the flow's first screen.
    hooks.configGet.mockResolvedValue(undefined);
    hooks.detection.mockReturnValue({ detection: emptyDetection(), loading: false });

    render(<OnboardingOverlay />);

    await waitFor(() => {
      expect(screen.getByText('onboarding.flow.quickstart.headline')).toBeInTheDocument();
    });
  });

  it('renders nothing when onboarding was already completed', async () => {
    hooks.configGet.mockResolvedValue(true);
    hooks.detection.mockReturnValue({ detection: emptyDetection(), loading: false });

    const { container } = render(<OnboardingOverlay />);

    // Give the async flag read a chance to resolve, then assert no overlay.
    await waitFor(() => {
      expect(hooks.configGet).toHaveBeenCalledWith('onboardingCompleted');
    });
    expect(screen.queryByText('onboarding.flow.quickstart.headline')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('writes a synchronous localStorage marker on dismiss (issue #8 reopen guard)', async () => {
    hooks.configGet.mockResolvedValue(undefined);
    hooks.detection.mockReturnValue({ detection: emptyDetection(), loading: false });

    render(<OnboardingOverlay />);

    const finish = await screen.findByTestId('finish-onboarding');
    await act(async () => {
      fireEvent.click(finish);
    });

    // Always-local, synchronous marker is set even though the bridge write is async.
    expect(localStorage.getItem('onboardingCompleted')).toBe('1');
    expect(hooks.configSet).toHaveBeenCalledWith('onboardingCompleted', true);
  });

  it('retries the bridge write once when the first set rejects', async () => {
    hooks.configGet.mockResolvedValue(undefined);
    hooks.detection.mockReturnValue({ detection: emptyDetection(), loading: false });
    hooks.configSet.mockRejectedValueOnce(new Error('bridge down')).mockResolvedValueOnce(undefined);

    render(<OnboardingOverlay />);

    const finish = await screen.findByTestId('finish-onboarding');
    await act(async () => {
      fireEvent.click(finish);
    });

    await waitFor(() => {
      expect(hooks.configSet).toHaveBeenCalledTimes(2);
    });
    // Local marker still durably records the dismiss regardless of the bridge.
    expect(localStorage.getItem('onboardingCompleted')).toBe('1');
  });

  it('stays closed on a fresh boot when the local marker is set but the bridge flag is not', async () => {
    // Simulates headless: prior dismiss landed in localStorage, bridge write
    // never durably persisted ⇒ overlay must NOT re-open.
    localStorage.setItem('onboardingCompleted', '1');
    hooks.configGet.mockResolvedValue(undefined);
    hooks.detection.mockReturnValue({ detection: emptyDetection(), loading: false });

    const { container } = render(<OnboardingOverlay />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
    expect(screen.queryByTestId('finish-onboarding')).not.toBeInTheDocument();
  });
});
