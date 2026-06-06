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

const { getStatusInvoke, skipSetupInvoke, openExternalInvoke, messageSuccess, messageError } =
  vi.hoisted(() => ({
    getStatusInvoke: vi.fn<() => Promise<IjfwStatusPayload | undefined>>(),
    skipSetupInvoke: vi.fn<(args: { enabled: boolean }) => Promise<{ ok: true }>>(),
    openExternalInvoke: vi.fn<(url: string) => Promise<void>>(),
    messageSuccess: vi.fn<(msg: string) => void>(),
    messageError: vi.fn<(msg: string) => void>(),
  }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      getStatus: { invoke: getStatusInvoke },
      skipSetup: { invoke: skipSetupInvoke },
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
  skipSetupInvoke.mockReset();
  openExternalInvoke.mockReset();
  messageSuccess.mockReset();
  messageError.mockReset();
  getStatusInvoke.mockResolvedValue({ status: 'installed_current' });
  skipSetupInvoke.mockResolvedValue({ ok: true });
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
    expect(screen.getByTestId('ijfw-settings-manual-install-code')).toBeTruthy();
  });

  it('reads initial switch state from getStatus (opt_out → ON)', async () => {
    getStatusInvoke.mockResolvedValueOnce({ status: 'not_installed', reason: 'opt_out' });
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(isSwitchOn()).toBe(true);
  });

  it('defaults the switch to OFF when status is not opt_out', async () => {
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
    getStatusInvoke.mockResolvedValueOnce({ status: 'not_installed', reason: 'opt_out' });
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

  it('renders the IJFW + Ferrox Labs About section with GitHub link (v0.6.3 disclosure)', async () => {
    render(<IjfwSettingsPanel />);
    await flushAsync();
    expect(screen.getByTestId('ijfw-settings-about')).toBeTruthy();
    expect(screen.getByText('An open-source persistent memory engine by Ferrox Labs.')).toBeTruthy();
    expect(screen.getByTestId('ijfw-settings-github-link').textContent).toContain(
      'github.com/FerroxLabs/ijfw'
    );
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
