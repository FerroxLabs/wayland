/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * v0.6.3 -- DOM tests for the re-enable InstallerPitchCard.
 *
 * Covers:
 *   - Headline + lede + 3 bullets render with the right i18n keys.
 *   - Primary CTA is labelled "Enable Memory" (was "Install Memory").
 *   - Clicking the CTA calls skipSetup({enabled:false}) FIRST then
 *     triggerInstall.invoke() -- both must fire and in order, otherwise
 *     bootstrap short-circuits on the still-set opt-out flag.
 *   - Settings link navigates to `/settings/ijfw`.
 *   - Button enters a disabled "installing" state on click (defensive guard
 *     before MemoryPage swaps in InstallingCard via the status emitter).
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockNavigate, triggerInstallInvoke, skipSetupInvoke } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  triggerInstallInvoke: vi.fn<() => Promise<{ ok: true } | { ok: false; error: string }>>(),
  skipSetupInvoke: vi.fn<(args: { enabled: boolean }) => Promise<{ ok: true }>>(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      triggerInstall: { invoke: triggerInstallInvoke },
      skipSetup: { invoke: skipSetupInvoke },
    },
  },
}));

import InstallerPitchCard from '@renderer/pages/memory/state-branches/InstallerPitchCard';

beforeEach(() => {
  mockNavigate.mockReset();
  triggerInstallInvoke.mockReset();
  triggerInstallInvoke.mockResolvedValue({ ok: true });
  skipSetupInvoke.mockReset();
  skipSetupInvoke.mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
});

describe('InstallerPitchCard', () => {
  it('renders headline, lede, and three value-prop bullets', () => {
    render(<InstallerPitchCard />);
    expect(screen.getByText('memory.pitch.headline')).toBeTruthy();
    expect(screen.getByText('memory.pitch.lede')).toBeTruthy();
    expect(screen.getByText('memory.pitch.bullet1')).toBeTruthy();
    expect(screen.getByText('memory.pitch.bullet2')).toBeTruthy();
    expect(screen.getByText('memory.pitch.bullet3')).toBeTruthy();
  });

  it('renders the Enable Memory CTA (re-enable surface, not first install)', () => {
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta');
    expect(cta.textContent).toContain('memory.pitch.enable_cta');
  });

  it('calls skipSetup({enabled:false}) AND triggerInstall.invoke when the CTA is clicked', async () => {
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta');
    await act(async () => {
      fireEvent.click(cta);
    });
    expect(skipSetupInvoke).toHaveBeenCalledTimes(1);
    expect(skipSetupInvoke).toHaveBeenCalledWith({ enabled: false });
    expect(triggerInstallInvoke).toHaveBeenCalledTimes(1);
  });

  it('fires skipSetup BEFORE triggerInstall (bootstrap short-circuits on stale flag otherwise)', async () => {
    const callOrder: string[] = [];
    skipSetupInvoke.mockImplementationOnce(async () => {
      callOrder.push('skipSetup');
      return { ok: true };
    });
    triggerInstallInvoke.mockImplementationOnce(async () => {
      callOrder.push('triggerInstall');
      return { ok: true };
    });
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta');
    await act(async () => {
      fireEvent.click(cta);
    });
    expect(callOrder).toEqual(['skipSetup', 'triggerInstall']);
  });

  it('disables the CTA and swaps to an installing label after click', async () => {
    // Hold the promise open so the post-resolve cleanup does not flip state
    // back before we assert the disabled label.
    let resolveInvoke: (value: { ok: true }) => void = () => {};
    triggerInstallInvoke.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInvoke = resolve;
      })
    );
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(cta);
    });
    expect(cta.disabled).toBe(true);
    expect(cta.textContent).toContain('memory.installing.title');
    await act(async () => {
      resolveInvoke({ ok: true });
    });
  });

  it('does not double-fire the install when clicked twice', async () => {
    let resolveInvoke: (value: { ok: true }) => void = () => {};
    triggerInstallInvoke.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInvoke = resolve;
      })
    );
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta');
    await act(async () => {
      fireEvent.click(cta);
    });
    // Second click happens after React has committed the disabled state from
    // the first click -- the in-flight guard (both `disabled` and the
    // `isInstalling` early-return) must keep the invoke count at 1.
    await act(async () => {
      fireEvent.click(cta);
    });
    expect(triggerInstallInvoke).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveInvoke({ ok: true });
    });
  });

  it('re-enables the CTA if the bridge invoke rejects', async () => {
    triggerInstallInvoke.mockRejectedValueOnce(new Error('bridge unavailable'));
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(cta);
    });
    expect(cta.disabled).toBe(false);
    expect(cta.textContent).toContain('memory.pitch.enable_cta');
  });

  it('re-enables the CTA if skipSetup itself rejects (does not call triggerInstall)', async () => {
    skipSetupInvoke.mockRejectedValueOnce(new Error('skipSetup bridge error'));
    render(<InstallerPitchCard />);
    const cta = screen.getByTestId('memory-installer-pitch-install-cta') as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(cta);
    });
    expect(triggerInstallInvoke).not.toHaveBeenCalled();
    expect(cta.disabled).toBe(false);
    expect(cta.textContent).toContain('memory.pitch.enable_cta');
  });

  it('navigates to /settings/ijfw when the settings link is clicked', () => {
    render(<InstallerPitchCard />);
    const link = screen.getByTestId('memory-installer-pitch-settings-link');
    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/settings/ijfw');
  });
});
