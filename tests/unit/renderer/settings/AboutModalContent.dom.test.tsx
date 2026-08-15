/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="@testing-library/jest-dom/vitest" />

/**
 * #731 — the About page auto-checks for updates on open and surfaces the result
 * inline (checking → up-to-date / available / error), without the user pressing
 * a button first. These tests pin: auto-check-on-mount, the Wayland-vs-IJFW
 * distinction (an IJFW-only update must NOT read as an app update), the
 * electron-updater-only version fallback, manual retry, failure surfacing, and
 * the short-TTL cache that avoids re-hitting the rate limit on every reopen.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';

const runCheckMock = vi.fn();

vi.mock('@/renderer/pages/settings/utils/waylandUpdaterBridge', () => ({
  runWaylandUpdaterExtensionCheck: (...args: unknown[]) => runCheckMock(...args),
}));

vi.mock('@/renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
  openExternalUrl: vi.fn(),
}));

vi.mock('@/renderer/components/settings/SettingsModal/settingsViewContext', () => ({
  useSettingsViewMode: () => 'modal' as const,
}));

// FeedbackReportModal drags in a heavy import chain irrelevant to this surface.
vi.mock('@/renderer/components/settings/SettingsModal/contents/FeedbackReportModal', () => ({
  default: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && opts.version !== undefined ? `${key} ${String(opts.version)}` : key,
    i18n: { language: 'en-US' },
  }),
}));

import AboutModalContent, {
  __resetAboutCheckCacheForTest,
} from '@/renderer/components/settings/SettingsModal/contents/AboutModalContent';

const upToDate = {
  ok: true,
  autoUpdateAvailable: false,
  autoVersion: '',
  manual: { success: true, data: { currentVersion: '1.0.0', updateAvailable: false } },
};

const manualAvailable = {
  ok: true,
  autoUpdateAvailable: false,
  autoVersion: '',
  manual: {
    success: true,
    data: { currentVersion: '1.0.0', updateAvailable: true, latest: { version: '9.9.9' } },
  },
};

beforeEach(() => {
  runCheckMock.mockReset();
  localStorage.clear();
  __resetAboutCheckCacheForTest();
});

afterEach(() => {
  cleanup();
});

describe('AboutModalContent update auto-check (#731)', () => {
  it('runs an update check on mount and shows "up to date"', async () => {
    runCheckMock.mockResolvedValue(upToDate);
    render(<AboutModalContent />);

    // Fires without any user interaction.
    await waitFor(() => expect(runCheckMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('update.upToDateTitle')).toBeInTheDocument();
  });

  it('passes the persisted prerelease preference into the check', async () => {
    localStorage.setItem('update.includePrerelease', 'true');
    runCheckMock.mockResolvedValue(upToDate);
    render(<AboutModalContent />);

    await waitFor(() => expect(runCheckMock).toHaveBeenCalledTimes(1));
    expect(runCheckMock.mock.calls[0][0]).toBe(true);
  });

  it('shows the available version when a Wayland app update exists', async () => {
    runCheckMock.mockResolvedValue(manualAvailable);
    render(<AboutModalContent />);

    expect(await screen.findByText('update.availableTitle')).toBeInTheDocument();
    expect(screen.getByText(/9\.9\.9/)).toBeInTheDocument();
  });

  it('falls back to the electron-updater version when only auto-update is available', async () => {
    runCheckMock.mockResolvedValue({
      ok: true,
      autoUpdateAvailable: true,
      autoVersion: '2.0.0',
      manual: { success: true, data: { currentVersion: '1.0.0', updateAvailable: false } },
    });
    render(<AboutModalContent />);

    expect(await screen.findByText('update.availableTitle')).toBeInTheDocument();
    expect(screen.getByText(/2\.0\.0/)).toBeInTheDocument();
  });

  it('treats an IJFW-only update as up to date (not an app update)', async () => {
    runCheckMock.mockResolvedValue({
      ok: true,
      autoUpdateAvailable: false,
      autoVersion: '',
      manual: {
        success: true,
        data: {
          currentVersion: '1.0.0',
          updateAvailable: false,
          ijfw: { installed: true, updateAvailable: true },
        },
      },
    });
    render(<AboutModalContent />);

    expect(await screen.findByText('update.upToDateTitle')).toBeInTheDocument();
    expect(screen.queryByText('update.availableTitle')).not.toBeInTheDocument();
  });

  it('surfaces a failed check (ok: false)', async () => {
    runCheckMock.mockResolvedValue({ ok: false, error: 'boom' });
    render(<AboutModalContent />);

    expect(await screen.findByText('update.checkFailed')).toBeInTheDocument();
  });

  it('surfaces a rejected check (thrown error)', async () => {
    runCheckMock.mockRejectedValue(new Error('network down'));
    render(<AboutModalContent />);

    expect(await screen.findByText('update.checkFailed')).toBeInTheDocument();
  });

  it('re-checks when the user clicks retry, and reflects the new result', async () => {
    runCheckMock.mockResolvedValueOnce(upToDate).mockResolvedValueOnce(manualAvailable);
    render(<AboutModalContent />);

    await screen.findByText('update.upToDateTitle');
    expect(runCheckMock).toHaveBeenCalledTimes(1);

    // The up-to-date state exposes a manual re-check button.
    fireEvent.click(screen.getByText('settings.checkForUpdates'));

    expect(await screen.findByText('update.availableTitle')).toBeInTheDocument();
    expect(runCheckMock).toHaveBeenCalledTimes(2);
  });

  it('serves the cached result on remount without re-hitting the network', async () => {
    runCheckMock.mockResolvedValue(upToDate);
    const first = render(<AboutModalContent />);
    await screen.findByText('update.upToDateTitle');
    expect(runCheckMock).toHaveBeenCalledTimes(1);
    first.unmount();

    // Reopening the About tab within the TTL must not spend another API call.
    render(<AboutModalContent />);
    expect(await screen.findByText('update.upToDateTitle')).toBeInTheDocument();
    expect(runCheckMock).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures (a later reopen re-checks)', async () => {
    runCheckMock.mockResolvedValueOnce({ ok: false, error: 'boom' }).mockResolvedValueOnce(upToDate);
    const first = render(<AboutModalContent />);
    await screen.findByText('update.checkFailed');
    first.unmount();

    render(<AboutModalContent />);
    expect(await screen.findByText('update.upToDateTitle')).toBeInTheDocument();
    expect(runCheckMock).toHaveBeenCalledTimes(2);
  });
});

/**
 * AGPL-3.0 "Appropriate Legal Notices" (§0) — the About screen is the
 * "convenient and prominently visible feature" that must carry the copyright
 * notice, the no-warranty statement, the fact that the work may be conveyed
 * under this licence, and how to view it. §13 adds the source-code offer.
 *
 * Ferrox Labs is the original AGPL licensor and so is not itself bound by
 * §5(d) (see I-01-DETERMINATION.md, Q5). These are pinned anyway: a downstream
 * forker IS bound, and would otherwise inherit a UI with no notices to
 * preserve. The i18n mock above returns the raw key, so assertions are on keys.
 */
describe('AboutModalContent — Appropriate Legal Notices', () => {
  beforeEach(() => {
    __resetAboutCheckCacheForTest();
    runCheckMock.mockResolvedValue(upToDate);
  });
  afterEach(cleanup);

  it.each([
    ['copyright notice', 'settings.legalCopyright'],
    ['upstream Apache-2.0 attribution', 'settings.legalUpstream'],
    ['licence under which it may be conveyed', 'settings.legalLicense'],
    ['no-warranty statement', 'settings.legalWarranty'],
  ])('shows the %s', async (_label, key) => {
    render(<AboutModalContent />);
    await waitFor(() => expect(screen.getByText(key)).toBeInTheDocument());
  });

  it('offers a way to view the licence and obtain the source', async () => {
    render(<AboutModalContent />);
    await waitFor(() => expect(screen.getByText('settings.viewLicense')).toBeInTheDocument());
    expect(screen.getByText('settings.sourceCode')).toBeInTheDocument();
  });
});
