/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import type { DetectionResult } from '@/common/types/onboarding';
import SiderFluxRouterEntry from '@renderer/components/layout/Sider/SiderNav/SiderFluxRouterEntry';

// --- Mock the onboarding detection hook (state-machine input) ----------------
const mockDetection = vi.fn<[], DetectionResult | null>(() => null);

vi.mock('@renderer/hooks/useOnboardingDetection', () => ({
  useOnboardingDetection: () => ({ detection: mockDetection(), loading: false }),
}));

// --- Mock the external-URL opener so install clicks are inert ----------------
vi.mock('@renderer/utils/platform', () => ({
  openExternalUrl: vi.fn(),
}));

// --- Mock react-i18next so labels are deterministic --------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const baseDetection: DetectionResult = {
  name: 'Tester',
  clis: [],
  envKeys: [],
  claudePro: false,
  ollama: { running: false, models: [] },
  fluxDesktop: { running: false },
  fluxConnected: false,
};

const renderEntry = (collapsed = false): void => {
  render(
    <MemoryRouter>
      <SiderFluxRouterEntry
        isMobile={false}
        collapsed={collapsed}
        siderTooltipProps={{}}
        onClick={() => {}}
      />
    </MemoryRouter>
  );
};

describe('SiderFluxRouterEntry', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the Connect Flux Router nudge when not connected but keys exist', () => {
    mockDetection.mockReturnValue({ ...baseDetection, envKeys: ['ANTHROPIC_API_KEY'] });
    renderEntry();
    expect(screen.getByTestId('sider-flux-router-entry')).toBeTruthy();
    expect(screen.getByText('sider.fluxRouter.connect.action →')).toBeTruthy();
  });

  it('renders nothing when not connected and nothing is actionable', () => {
    mockDetection.mockReturnValue({ ...baseDetection });
    renderEntry();
    expect(screen.queryByTestId('sider-flux-router-entry')).toBeNull();
  });
});
