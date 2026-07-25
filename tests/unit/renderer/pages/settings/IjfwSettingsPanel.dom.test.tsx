/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 6 / Decision 3b - DOM tests for IjfwSettingsPanel.
 *
 * Covers:
 *   - Title + switch + description + manual-install hint render.
 *   - Initial switch state reflects `getStatus` reason === 'opt_out'.
 *   - Toggling the switch calls `ipcBridge.ijfw.skipSetup.invoke({ enabled })`.
 *   - Success path surfaces `Message.success`.
 *   - Failure path surfaces `Message.error` and reverts the switch.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IjfwStatusPayload } from '@/common/adapter/ipcBridge';

const {
  getStatusInvoke,
  getRuntimeModeInvoke,
  brainInvoke,
  skipSetupInvoke,
  getSkipSetupInvoke,
  triggerInstallInvoke,
  onStatusChangedOn,
  statusListeners,
  unsubscribeSpy,
  openExternalInvoke,
  messageSuccess,
  messageError,
} = vi.hoisted(() => {
  const listeners: Array<(p: IjfwStatusPayload) => void> = [];
  const unsub = vi.fn<() => void>();
  return {
    getStatusInvoke: vi.fn<() => Promise<IjfwStatusPayload | undefined>>(),
    getRuntimeModeInvoke: vi.fn<() => Promise<'full' | 'degraded'>>(),
    brainInvoke: vi.fn<(args: { verb: string }) => Promise<{ ok: boolean }>>(),
    skipSetupInvoke: vi.fn<(args: { enabled: boolean }) => Promise<{ ok: true }>>(),
    getSkipSetupInvoke: vi.fn<() => Promise<{ enabled: boolean }>>(),
    triggerInstallInvoke: vi.fn<() => Promise<{ ok: boolean; error?: string }>>(),
    onStatusChangedOn: vi.fn((cb: (p: IjfwStatusPayload) => void) => {
      listeners.push(cb);
      return unsub;
    }),
    statusListeners: listeners,
    unsubscribeSpy: unsub,
    openExternalInvoke: vi.fn<(url: string) => Promise<void>>(),
    messageSuccess: vi.fn<(msg: string) => void>(),
    messageError: vi.fn<(msg: string) => void>(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      getStatus: { invoke: getStatusInvoke },
      getRuntimeMode: { invoke: getRuntimeModeInvoke },
      brainInvoke: { invoke: brainInvoke },
      skipSetup: { invoke: skipSetupInvoke },
      getSkipSetup: { invoke: getSkipSetupInvoke },
      triggerInstall: { invoke: triggerInstallInvoke },
      onStatusChanged: { on: onStatusChangedOn },
    },
    shell: {
      openExternal: { invoke: openExternalInvoke },
    },
  },
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return {
    ...actual,
    Message: { success: messageSuccess, error: messageError },
  };
});

// SettingsPageWrapper drags in router/layout/i18n machinery we don't need to
// exercise here - render the panel chrome inline so the assertions stay on
// the toggle behavior.
vi.mock('@renderer/pages/settings/components/SettingsPageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid='spw-stub'>{children}</div>,
}));

import IjfwSettingsPanel from '@renderer/pages/settings/IjfwSettingsPanel';

beforeEach(() => {
  getStatusInvoke.mockReset();
  getRuntimeModeInvoke.mockReset();
  brainInvoke.mockReset();
  skipSetupInvoke.mockReset();
  openExternalInvoke.mockReset();
  messageSuccess.mockReset();
  messageError.mockReset();
  getSkipSetupInvoke.mockReset();
  getSkipSetupInvoke.mockResolvedValue({ enabled: false });
  triggerInstallInvoke.mockReset();
  onStatusChangedOn.mockClear();
  unsubscribeSpy.mockClear();
  statusListeners.length = 0;
  getStatusInvoke.mockResolvedValue({ status: 'installed_current' });
  getRuntimeModeInvoke.mockResolvedValue('full');
  brainInvoke.mockResolvedValue({ ok: true });
  skipSetupInvoke.mockResolvedValue({ ok: true });
  triggerInstallInvoke.mockResolvedValue({ ok: true });
  openExternalInvoke.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

const flushAsync = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

// Arco's Switch renders as <button role="switch" aria-checked="..."> with
// onClick toggling state. We read aria-checked for the assertion and dispatch
// click events directly on the button.
const getSwitchButton = (): HTMLButtonElement => {
  const el = screen.getByTestId('ijfw-settings-skip-switch') as HTMLButtonElement;
  return el;
};

const isSwitchOn = (): boolean => getSwitchButton().getAttribute('aria-checked') === 'true';

describe('IjfwSettingsPanel', () => {
  it('renders the title, switch, description, and manual install hint', async () => {
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(screen.getByText('IJFW Memory (Ferrox Labs)')).toBeTruthy();
    expect(screen.getByText('Skip IJFW automatic setup')).toBeTruthy();
    expect(
      screen.getByText(
        'When enabled, Wayland will not install or upgrade IJFW. You can install manually later via the Memory page.'
      )
    ).toBeTruthy();
    expect(screen.getByTestId('ijfw-settings-skip-switch')).toBeTruthy();
    // #572: the manual-install command must name the bin via --package. A bare
    // `npx @ijfw/install` fails with "could not determine executable to run"
    // because the package's bins (ijfw/ijfw-install/ijfw-uninstall) don't match
    // the package name — see ijfwSystemService spawn args.
    const codeEl = screen.getByTestId('ijfw-settings-manual-install-code');
    expect(codeEl.textContent).toContain('--package @ijfw/install');
    expect(codeEl.textContent).toContain('ijfw-install --yes');
    expect(codeEl.textContent).not.toBe('npx -y @ijfw/install@latest');
  });

  it('reads the switch from the persisted flag, not the status', async () => {
    getStatusInvoke.mockResolvedValueOnce({ status: 'not_installed', reason: 'opt_out' });
    getSkipSetupInvoke.mockResolvedValue({ enabled: true });
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(isSwitchOn()).toBe(true);
  });

  it('defaults the switch to OFF when the flag is unset', async () => {
    getStatusInvoke.mockResolvedValueOnce({ status: 'installed_current' });
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(isSwitchOn()).toBe(false);
  });

  it('calls skipSetup.invoke({ enabled: true }) when toggled on', async () => {
    render(<IjfwSettingsPanel />);
    await flushAsync();
    await act(async () => {
      fireEvent.click(getSwitchButton());
    });
    await flushAsync();
    expect(skipSetupInvoke).toHaveBeenCalledTimes(1);
    expect(skipSetupInvoke).toHaveBeenCalledWith({ enabled: true });
    expect(messageSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls skipSetup.invoke({ enabled: false }) when toggled off', async () => {
    getSkipSetupInvoke.mockResolvedValue({ enabled: true });
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(isSwitchOn()).toBe(true);
    await act(async () => {
      fireEvent.click(getSwitchButton());
    });
    await flushAsync();
    expect(skipSetupInvoke).toHaveBeenCalledTimes(1);
    expect(skipSetupInvoke).toHaveBeenCalledWith({ enabled: false });
    expect(messageSuccess).toHaveBeenCalledTimes(1);
  });

  it('surfaces an error toast and reverts the switch when skipSetup rejects', async () => {
    skipSetupInvoke.mockRejectedValueOnce(new Error('bridge unavailable'));
    render(<IjfwSettingsPanel />);
    await flushAsync();
    await act(async () => {
      fireEvent.click(getSwitchButton());
    });
    await flushAsync();
    expect(messageError).toHaveBeenCalledTimes(1);
    expect(isSwitchOn()).toBe(false);
  });

  /**
   * Sean's live find, 2026-07-25: with the Skip flag on, the panel reported
   * "Not installed yet" / "Waiting for install" and Test kept failing, and
   * flipping the switch off changed NOTHING because the toggle only persisted
   * the flag. Bootstrap had already run at boot and short-circuited on
   * `opt_out`, so nothing re-ran and `runtimeMode` was never enabled. Only an
   * app restart could recover it, which read as a permanently broken feature.
   */
  describe('re-enabling actually runs the install path', () => {
    it('triggers bootstrap when Skip is switched OFF', async () => {
      getSkipSetupInvoke.mockResolvedValue({ enabled: true });
      render(<IjfwSettingsPanel />);
      await flushAsync();
      expect(isSwitchOn()).toBe(true);

      await act(async () => {
        fireEvent.click(getSwitchButton());
      });
      await flushAsync();

      expect(skipSetupInvoke).toHaveBeenCalledWith({ enabled: false });
      expect(triggerInstallInvoke).toHaveBeenCalledTimes(1);
    });

    it('does NOT trigger bootstrap when Skip is switched ON', async () => {
      render(<IjfwSettingsPanel />);
      await flushAsync();
      await act(async () => {
        fireEvent.click(getSwitchButton());
      });
      await flushAsync();

      expect(skipSetupInvoke).toHaveBeenCalledWith({ enabled: true });
      expect(triggerInstallInvoke).not.toHaveBeenCalled();
    });

    it('surfaces an error when bootstrap refuses to start', async () => {
      getSkipSetupInvoke.mockResolvedValue({ enabled: true });
      triggerInstallInvoke.mockResolvedValueOnce({ ok: false, error: 'lock held by pid 42' });
      render(<IjfwSettingsPanel />);
      await flushAsync();
      await act(async () => {
        fireEvent.click(getSwitchButton());
      });
      await flushAsync();

      expect(messageError).toHaveBeenCalledWith('lock held by pid 42');
    });
  });

  describe('live status updates (no app restart required)', () => {
    it('subscribes on mount and unsubscribes on unmount', async () => {
      const view = render(<IjfwSettingsPanel />);
      await flushAsync();
      expect(onStatusChangedOn).toHaveBeenCalledTimes(1);
      view.unmount();
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * Cross-audit finding (Kimi K3, 2026-07-25) on the first cut of this fix:
     * deriving the switch from EVERY emitted payload let a bootstrap that
     * started before the user re-enabled Skip flip the switch back OFF under
     * them. A late `installed_current` is not evidence about the flag.
     */
    it("never lets a late emit override the user's own choice", async () => {
      render(<IjfwSettingsPanel />);
      await flushAsync();

      // User turns Skip ON. The flag is now true.
      await act(async () => {
        fireEvent.click(getSwitchButton());
      });
      await flushAsync();
      expect(skipSetupInvoke).toHaveBeenCalledWith({ enabled: true });
      expect(isSwitchOn()).toBe(true);

      // A bootstrap already in flight now reports success.
      await act(async () => {
        for (const emit of statusListeners) emit({ status: 'installed_current', cliCount: 17 });
      });
      await flushAsync();

      // Checklist follows reality; the switch keeps the user's choice.
      expect(screen.getByText('Installed and up to date')).toBeTruthy();
      expect(isSwitchOn()).toBe(true);
    });

    /**
     * Cross-audit finding (Gemini, 2026-07-25): with an install present the
     * status is `installed_current` no matter what the flag says, so inferring
     * the switch from status meant a user could never KEEP Skip on. Navigating
     * away and back re-derived it to OFF and masked their persisted choice.
     */
    it('keeps Skip ON across a remount while an install is present', async () => {
      getSkipSetupInvoke.mockResolvedValue({ enabled: true });
      getStatusInvoke.mockResolvedValue({ status: 'installed_current', cliCount: 17 });

      const first = render(<IjfwSettingsPanel />);
      await flushAsync();
      expect(isSwitchOn()).toBe(true);
      first.unmount();

      render(<IjfwSettingsPanel />);
      await flushAsync();
      expect(screen.getByText('Installed and up to date')).toBeTruthy();
      expect(isSwitchOn()).toBe(true);
    });

    it('updates the checklist from an emitted status without a remount', async () => {
      getStatusInvoke.mockResolvedValueOnce({ status: 'not_installed', reason: 'opt_out' });
      getSkipSetupInvoke.mockResolvedValue({ enabled: true });
      render(<IjfwSettingsPanel />);
      await flushAsync();
      expect(screen.getByText('Not installed yet')).toBeTruthy();
      expect(isSwitchOn()).toBe(true);

      // What bootstrap emits once it detects the existing install.
      await act(async () => {
        for (const emit of statusListeners) emit({ status: 'installed_current', cliCount: 17 });
      });
      await flushAsync();

      expect(screen.getByText('Installed and up to date')).toBeTruthy();
      // The i18n mock returns defaultValue verbatim without interpolating
      // {{count}}, so assert the row's resolved state rather than its text.
      expect(screen.getByTestId('ijfw-status-item-clis').getAttribute('data-status')).toBe('ok');
    });
  });

  it('renders the IJFW + Ferrox Labs About section with GitHub link (v0.6.3 disclosure)', async () => {
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(screen.getByTestId('ijfw-settings-about')).toBeTruthy();
    expect(screen.getByText('An open-source persistent memory engine by Ferrox Labs.')).toBeTruthy();
    expect(screen.getByTestId('ijfw-settings-github-link').textContent).toContain('github.com/FerroxLabs/ijfw');
  });

  it('opens the IJFW GitHub URL via ipcBridge.shell.openExternal when the link is clicked', async () => {
    render(<IjfwSettingsPanel />);
    await flushAsync();
    await act(async () => {
      fireEvent.click(screen.getByTestId('ijfw-settings-github-link'));
    });
    await flushAsync();
    expect(openExternalInvoke).toHaveBeenCalledTimes(1);
    expect(openExternalInvoke).toHaveBeenCalledWith('https://github.com/FerroxLabs/ijfw');
  });
});
