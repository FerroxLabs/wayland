/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

// W4b - CapabilityReviewModal DOM tests. Covers:
//   - Renders title + capability rows + 3 buttons.
//   - One row per capability declared `true`; rows for `false`-caps hidden.
//   - Primary CTA disabled on mount, enables after 5s, countdown label updates.
//   - Per-row checkboxes default OFF and propagate the grant map to onTrustSelected.
//   - Sandbox CTA is available immediately and passes no args.
//   - Missing-specialists alert renders and disables both CTAs.

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string; seconds?: number; names?: string }) => {
      if (opts?.seconds !== undefined) {
        return (opts.defaultValue ?? key).replace('{{seconds}}', String(opts.seconds));
      }
      if (opts?.names !== undefined) {
        return (opts.defaultValue ?? key).replace('{{names}}', opts.names);
      }
      return opts?.defaultValue ?? key;
    },
  }),
}));
vi.mock('@/renderer/hooks/context/ThemeContext', () => ({
  useThemeContext: () => ({ fontScale: 1 }),
}));
// Arco Message tries to render a toast via ReactDOM which is not available in
// jsdom - stub it the same way the other team modal tests do.
vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    Message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

import CapabilityReviewModal, {
  type TeamCapabilities,
} from '@/renderer/pages/teams/components/CapabilityReviewModal';

const ALL_TRUE: TeamCapabilities = {
  canReadFiles: true,
  canWriteFiles: true,
  canSpawnAgents: true,
  canNetworkRequest: true,
  canCrossTeamMessage: true,
};

type Overrides = Partial<React.ComponentProps<typeof CapabilityReviewModal>>;

const renderModal = (overrides: Overrides = {}) => {
  const onTrustSelected = vi.fn();
  const onSandboxImport = vi.fn();
  const onCancel = vi.fn();
  const props = {
    visible: true,
    teamName: 'Renewal Push',
    importSource: 'renewal-push.json',
    capabilities: ALL_TRUE,
    onTrustSelected,
    onSandboxImport,
    onCancel,
    ...overrides,
  } as React.ComponentProps<typeof CapabilityReviewModal>;
  render(<CapabilityReviewModal {...props} />);
  return { onTrustSelected, onSandboxImport, onCancel };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CapabilityReviewModal', () => {
  it('renders title, team name, all three buttons, and one row per declared capability (excluding canNetworkRequest)', () => {
    renderModal();
    expect(screen.getByText('Review team capabilities')).toBeTruthy();
    expect(screen.getByTestId('capability-review-team-name').textContent).toBe('Renewal Push');
    expect(screen.getByTestId('capability-review-trust')).toBeTruthy();
    expect(screen.getByTestId('capability-review-sandbox')).toBeTruthy();
    expect(screen.getByTestId('capability-review-cancel')).toBeTruthy();
    // W4 audit HIGH-1 (2026-05-19): canNetworkRequest is intentionally
    // never rendered - it has no runtime gate in v1. Renderable rows
    // exclude it even when the import declares it true.
    const renderableCaps = Object.keys(ALL_TRUE).filter((c) => c !== 'canNetworkRequest');
    for (const cap of renderableCaps) {
      expect(screen.getByTestId(`capability-review-row-${cap}`)).toBeTruthy();
    }
    expect(screen.queryByTestId('capability-review-row-canNetworkRequest')).toBeNull();
    // Network notice surfaces because canNetworkRequest=true was declared.
    expect(screen.getByTestId('capability-review-network-notice')).toBeTruthy();
  });

  it('hides rows for capabilities the import file declared as false', () => {
    renderModal({
      capabilities: {
        canReadFiles: true,
        canWriteFiles: false,
        canSpawnAgents: false,
        canNetworkRequest: true,
        canCrossTeamMessage: false,
      },
    });
    expect(screen.getByTestId('capability-review-row-canReadFiles')).toBeTruthy();
    // W4 audit HIGH-1 (2026-05-19): canNetworkRequest is intentionally
    // never rendered as a grant row; the network notice is surfaced instead.
    expect(screen.queryByTestId('capability-review-row-canNetworkRequest')).toBeNull();
    expect(screen.getByTestId('capability-review-network-notice')).toBeTruthy();
    expect(screen.queryByTestId('capability-review-row-canWriteFiles')).toBeNull();
    expect(screen.queryByTestId('capability-review-row-canSpawnAgents')).toBeNull();
    expect(screen.queryByTestId('capability-review-row-canCrossTeamMessage')).toBeNull();
  });

  it('keeps the primary Trust CTA disabled for 5 seconds and enables it after the countdown', () => {
    renderModal();
    const trust = screen.getByTestId('capability-review-trust') as HTMLButtonElement;
    expect(trust.disabled).toBe(true);
    expect(trust.textContent).toMatch(/Trust selected \(5s\)/);

    // Tick 4 seconds - still disabled, countdown shows 1s.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(trust.disabled).toBe(true);
    expect(trust.textContent).toMatch(/Trust selected \(1s\)/);

    // Final tick - now enabled with the static label.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(trust.disabled).toBe(false);
    expect(trust.textContent).toMatch(/^Trust selected$/);
  });

  it('countdown label updates every second', () => {
    renderModal();
    const trust = screen.getByTestId('capability-review-trust') as HTMLButtonElement;
    expect(trust.textContent).toMatch(/5s/);
    act(() => vi.advanceTimersByTime(1000));
    expect(trust.textContent).toMatch(/4s/);
    act(() => vi.advanceTimersByTime(1000));
    expect(trust.textContent).toMatch(/3s/);
    act(() => vi.advanceTimersByTime(1000));
    expect(trust.textContent).toMatch(/2s/);
    act(() => vi.advanceTimersByTime(1000));
    expect(trust.textContent).toMatch(/1s/);
  });

  it('per-row checkboxes default OFF', () => {
    renderModal();
    const renderableCaps = Object.keys(ALL_TRUE).filter((c) => c !== 'canNetworkRequest');
    for (const cap of renderableCaps) {
      const cb = screen
        .getByTestId(`capability-review-checkbox-${cap}`)
        .querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(cb.checked).toBe(false);
    }
  });

  it('clicking Trust selected after countdown passes the per-row grant map to onTrustSelected', () => {
    const { onTrustSelected } = renderModal();
    // Toggle two of the five caps ON.
    const readBox = screen
      .getByTestId('capability-review-checkbox-canReadFiles')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    const spawnBox = screen
      .getByTestId('capability-review-checkbox-canSpawnAgents')
      .querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(readBox);
    fireEvent.click(spawnBox);

    // Advance past the cool-off.
    act(() => vi.advanceTimersByTime(5000));

    fireEvent.click(screen.getByTestId('capability-review-trust'));
    expect(onTrustSelected).toHaveBeenCalledTimes(1);
    const grants = onTrustSelected.mock.calls[0][0] as Record<string, boolean>;
    expect(grants).toEqual({
      canReadFiles: true,
      canWriteFiles: false,
      canSpawnAgents: true,
      canNetworkRequest: false,
      canCrossTeamMessage: false,
    });
  });

  it('Sandbox CTA is available immediately and fires onSandboxImport with no args', () => {
    const { onSandboxImport } = renderModal();
    const sandbox = screen.getByTestId('capability-review-sandbox') as HTMLButtonElement;
    expect(sandbox.disabled).toBe(false);
    fireEvent.click(sandbox);
    expect(onSandboxImport).toHaveBeenCalledTimes(1);
    expect(onSandboxImport.mock.calls[0]).toEqual([]);
  });

  it('renders missing-specialists Alert and disables BOTH CTAs when missingSpecialists is non-empty', () => {
    renderModal({ missingSpecialists: ['weave-pm', 'lattice-eng'] });
    expect(screen.getByTestId('capability-review-missing-specialists')).toBeTruthy();
    const trust = screen.getByTestId('capability-review-trust') as HTMLButtonElement;
    const sandbox = screen.getByTestId('capability-review-sandbox') as HTMLButtonElement;
    // Trust disabled both by missing AND by countdown - assert it's blocked.
    expect(trust.disabled).toBe(true);
    expect(sandbox.disabled).toBe(true);
    // Even after countdown elapses, trust stays disabled because of missing specialists.
    act(() => vi.advanceTimersByTime(5000));
    expect(trust.disabled).toBe(true);
    expect(sandbox.disabled).toBe(true);
  });
});
