/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
});
