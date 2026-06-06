/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * FluxRouterHero behaviour contract.
 *
 *  - Connected + live metrics (>= 10 turns) → renders the routing metrics line.
 *  - Connected + null metrics (daemon down) → renders the calm confirmation,
 *    NO fabricated numbers.
 *  - Not connected → renders the "Connect Flux Router" recommendation CTA.
 *
 * `react-i18next` is mocked to echo keys + interpolation so assertions read
 * clean; `openExternalUrl` is mocked so the "Get a key" link is inert.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && typeof opts === 'object') {
        let out = key;
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          out += `:${k}=${String(v)}`;
        }
        return out;
      }
      return key;
    },
  }),
}));

vi.mock('@renderer/utils/platform', () => ({
  openExternalUrl: vi.fn(),
}));

import FluxRouterHero from '../../../src/renderer/pages/settings/ModelsSettings/components/FluxRouterHero';

const mockFluxMetrics = vi.fn();

beforeEach(() => {
  mockFluxMetrics.mockReset();
  (window as unknown as { electronAPI: { onboardingFluxMetrics: () => Promise<unknown> } }).electronAPI = {
    onboardingFluxMetrics: mockFluxMetrics,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

const noopConnect = vi.fn(async () => ({ ok: true }) as never);

describe('FluxRouterHero', () => {
  it('renders the live metrics line when connected with >= 10 turns of metrics', async () => {
    mockFluxMetrics.mockResolvedValue({
      totalTurns: 100,
      histogram: { h: 21, s: 38, o: 41 },
      savings: '~$120 saved',
    });

    render(<FluxRouterHero connected onConnectKey={noopConnect} />);

    await waitFor(() => {
      expect(screen.getByTestId('flux-router-metrics')).toBeTruthy();
    });
    // Histogram numbers are interpolated, never fabricated.
    expect(screen.getByTestId('flux-router-metrics').textContent).toContain('flagship=21');
    expect(screen.getByTestId('flux-router-metrics').textContent).toContain('small=38');
    expect(screen.getByTestId('flux-router-metrics').textContent).toContain('local=41');
    expect(screen.getByTestId('flux-router-metrics').textContent).toContain('count=100');
    expect(screen.getByTestId('flux-router-metrics').textContent).toContain('~$120 saved');
  });

  it('renders the calm confirmation (no fabricated numbers) when metrics are null', async () => {
    mockFluxMetrics.mockResolvedValue(null);

    render(<FluxRouterHero connected onConnectKey={noopConnect} />);

    await waitFor(() => {
      expect(screen.getByTestId('flux-router-confirmation')).toBeTruthy();
    });
    expect(screen.queryByTestId('flux-router-metrics')).toBeNull();
    // The only figure is the deliberately conservative "40+" product count
    // (FLUX_MODEL_COUNT) - never a fabricated precise number from a daemon stat.
    expect(screen.getByTestId('flux-router-confirmation').textContent).toContain('count=40+');
  });

  it('renders the calm confirmation when metrics have fewer than 10 turns', async () => {
    mockFluxMetrics.mockResolvedValue({ totalTurns: 3, histogram: { h: 1, s: 1, o: 1 } });

    render(<FluxRouterHero connected onConnectKey={noopConnect} />);

    await waitFor(() => {
      expect(screen.getByTestId('flux-router-confirmation')).toBeTruthy();
    });
    expect(screen.queryByTestId('flux-router-metrics')).toBeNull();
  });

  it('renders the Connect Flux Router recommendation when not connected', () => {
    render(<FluxRouterHero connected={false} onConnectKey={noopConnect} />);

    const hero = screen.getByTestId('flux-router-hero');
    expect(hero.getAttribute('data-state')).toBe('disconnected');
    // The primary CTA label key is present.
    expect(hero.textContent).toContain('settings.modelsPage.flux.connect');
    expect(hero.textContent).toContain('settings.modelsPage.flux.headline');
    // No metrics call should fire when disconnected.
    expect(mockFluxMetrics).not.toHaveBeenCalled();
  });
});
