/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * "Available to install" band (T-B) — behaviour contract.
 *
 * Two things here are load-bearing beyond ordinary rendering:
 *
 *  1. CONSENT GATES EXECUTION (D2). It is not enough that a sheet appears
 *     before the install; there must be no way to reach the install without
 *     passing through it. The suite therefore tries to install WITHOUT the
 *     sheet — clicking Install, cancelling, driving the controller directly —
 *     and asserts the IPC channel is never touched.
 *  2. A DETECTED SYSTEM COPY IS NEVER OFFERED AN INSTALL (D1), and that has to
 *     hold at EXECUTION time, not just at render time: a consent minted while
 *     an agent looked absent must die if the status later says `system`.
 *
 * i18n resolves against the REAL en-US strings so the assertions verify actual
 * copy, not key presence.
 */

import { act, fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enSettings from '../../../src/renderer/services/i18n/locales/en-US/settings.json';

function lookup(path: string): string | undefined {
  const parts = path.replace(/^settings\./, '').split('.');
  let node: unknown = enSettings;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      let out = lookup(key);
      if (out === undefined) {
        if (opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
        return key;
      }
      if (opts && typeof opts === 'object') {
        for (const [k, v] of Object.entries(opts)) {
          if (k === 'defaultValue') continue;
          out = out!.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
        }
      }
      return out;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => React.createElement('span', null, i18nKey),
}));

const mockStatus = vi.fn();
const mockInstall = vi.fn();
const mockCancel = vi.fn();
const mockUninstall = vi.fn();

vi.mock('../../../src/common', () => ({
  ipcBridge: {
    agentInstaller: {
      status: { invoke: (...a: unknown[]) => mockStatus(...a) },
      install: { invoke: (...a: unknown[]) => mockInstall(...a) },
      cancel: { invoke: (...a: unknown[]) => mockCancel(...a) },
      uninstall: { invoke: (...a: unknown[]) => mockUninstall(...a) },
    },
    // FluxCompatChip renders a setup modal for codex/kimi; it only reaches the
    // connector on click, but the module must exist for the factory mock.
    fluxConnector: {
      codexStatus: { invoke: vi.fn() },
      kimiStatus: { invoke: vi.fn() },
      opencodeStatus: { invoke: vi.fn() },
      setupCodex: { invoke: vi.fn() },
      setupKimi: { invoke: vi.fn() },
      setupOpencode: { invoke: vi.fn() },
      removeCodex: { invoke: vi.fn() },
      removeKimi: { invoke: vi.fn() },
      removeOpencode: { invoke: vi.fn() },
    },
  },
}));

vi.mock('../../../src/renderer/utils/model/agentLogo', () => ({
  resolveAgentLogo: () => null,
}));

import AvailableToInstall from '../../../src/renderer/pages/settings/AgentSettings/AvailableToInstall';
import type { AgentInstallerReport, ManagedAgentStatus } from '../../../src/common/types/agentInstaller';

const PREFIX = '/Users/x/Library/Application Support/Wayland/agents/kimi';

function status(overrides: Partial<ManagedAgentStatus> = {}): ManagedAgentStatus {
  return {
    agentId: 'kimi',
    npmPackage: '@moonshot-ai/kimi-code',
    pinnedVersion: '0.34.0',
    installPrefix: PREFIX,
    state: 'absent',
    detectedOnPath: false,
    managedInstall: null,
    reason: 'prefix-missing',
    ...overrides,
  };
}

function report(agents: ManagedAgentStatus[], bundledBunAvailable = true): AgentInstallerReport {
  return { bundledBunAvailable, agents };
}

function render(ui: React.ReactElement) {
  return rtlRender(React.createElement(SWRConfig, { value: { provider: () => new Map(), dedupingInterval: 0 } }, ui));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStatus.mockResolvedValue(report([status()]));
  mockInstall.mockResolvedValue({ ok: true, status: status({ state: 'installed' }) });
  mockCancel.mockResolvedValue({ ok: true, cancelled: true, status: status() });
  mockUninstall.mockResolvedValue({ ok: true, removed: true, status: status() });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AvailableToInstall — the band', () => {
  it('renders the band header and a tile per catalogued agent', async () => {
    mockStatus.mockResolvedValue(
      report([status({ agentId: 'codex' }), status({ agentId: 'kimi' }), status({ agentId: 'openclaw' })])
    );
    render(<AvailableToInstall />);

    await waitFor(() => expect(screen.getByText('Available to install')).toBeTruthy());
    expect(screen.getByTestId('installable-tile-codex')).toBeTruthy();
    expect(screen.getByTestId('installable-tile-kimi')).toBeTruthy();
    expect(screen.getByTestId('installable-tile-openclaw')).toBeTruthy();
    // Brand names, not raw ids.
    expect(screen.getByText('Kimi Code')).toBeTruthy();
    expect(screen.getByText('OpenClaw')).toBeTruthy();
  });

  it('renders nothing at all when the status call fails', async () => {
    // An older engine or a broken bridge must not leave a header promising
    // installs the build cannot perform.
    mockStatus.mockRejectedValue(new Error('no such channel'));
    const { container } = render(<AvailableToInstall />);
    await waitFor(() => expect(mockStatus).toHaveBeenCalled());
    expect(container.textContent).toBe('');
    expect(screen.queryByText('Available to install')).toBeNull();
  });
});

describe('AvailableToInstall — card states', () => {
  it('absent: dashed card, pinned version, and an Install button', async () => {
    render(<AvailableToInstall />);
    await waitFor(() => expect(screen.getByTestId('installable-tile-kimi')).toBeTruthy());

    const tile = screen.getByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('absent');
    expect(tile.className).toContain('tileAvailable');
    expect(screen.getByTestId('install-state-kimi').textContent).toBe('Installs 0.34.0');
    expect(screen.getByTestId('install-button-kimi').textContent).toContain('Install');
  });

  it('absent: the Flux chip renders BEFORE the install, but is NOT a live button', async () => {
    // The reason to install has to be visible at the moment of deciding, so the
    // chip stays on the card. What it must NOT do is offer to configure routing
    // for software the user does not have: on an `absent` card it rendered as a
    // real <button> that mounted the "Route ... through Flux" setup modal.
    render(<AvailableToInstall />);
    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('absent');
    // Still VISIBLE - this half of the assertion is not relaxed.
    expect(tile.textContent).toContain('Flux setup');
    const chip = tile.querySelector('[data-testid="flux-setup-chip"]');
    expect(chip).toBeTruthy();
    // ...but inert.
    expect(chip!.tagName).not.toBe('BUTTON');
    await act(async () => {
      fireEvent.click(chip!);
    });
    expect(document.querySelectorAll('.arco-modal').length).toBe(0);
  });

  it('installed: the Flux chip IS a live button - the user has the software to route', async () => {
    // The mirror of the assertion above, so "non-interactive" cannot be
    // satisfied by killing the chip everywhere.
    mockStatus.mockResolvedValue(
      report([
        status({
          state: 'installed',
          managedInstall: { prefix: PREFIX, version: '0.34.0', installedAt: '2026-08-11T00:00:00.000Z' },
          reason: 'ok',
        }),
      ])
    );
    render(<AvailableToInstall />);
    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('installed');
    const chip = tile.querySelector('[data-testid="flux-setup-chip"]');
    expect(chip).toBeTruthy();
    expect(chip!.tagName).toBe('BUTTON');
    await act(async () => {
      fireEvent.click(chip!);
    });
    await waitFor(() => expect(document.querySelectorAll('.arco-modal').length).toBe(1));
  });

  it('system: says it uses the user’s own copy and offers NO competing Install button (D1)', async () => {
    mockStatus.mockResolvedValue(
      report([
        status({
          state: 'system',
          detectedOnPath: true,
          managedInstall: { prefix: PREFIX, version: '0.33.0', installedAt: '2026-08-11T00:00:00.000Z' },
          reason: 'ok',
        }),
      ])
    );
    render(<AvailableToInstall />);

    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('system');
    expect(screen.getByTestId('install-state-kimi').textContent).toBe('Uses your system copy');
    // The whole point of D1: no install affordance next to a working setup.
    expect(screen.queryByTestId('install-button-kimi')).toBeNull();
    // A machine with BOTH still reports Wayland's own copy as a version chip.
    expect(screen.getByTestId('install-version-kimi').textContent).toBe('0.33.0');
    // Nor is it dimmed - the user HAS this agent.
    expect(tile.className).not.toContain('tileAvailable');
  });

  it('installed: shows the receipt version and no Install button', async () => {
    mockStatus.mockResolvedValue(
      report([
        status({
          state: 'installed',
          managedInstall: { prefix: PREFIX, version: '0.34.0', installedAt: '2026-08-11T00:00:00.000Z' },
          reason: 'ok',
        }),
      ])
    );
    render(<AvailableToInstall />);

    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('installed');
    expect(screen.getByTestId('install-state-kimi').textContent).toBe('Installed by Wayland');
    expect(screen.getByTestId('install-version-kimi').textContent).toBe('0.34.0');
    expect(screen.queryByTestId('install-button-kimi')).toBeNull();
  });

  it('unavailable: says so, offers a Why? instead of a button that would always fail', async () => {
    mockStatus.mockResolvedValue(report([status()], false));
    render(<AvailableToInstall />);

    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('unavailable');
    expect(screen.getByTestId('install-state-kimi').textContent).toBe('Not available on this build');
    expect(screen.getByTestId('install-why-kimi').textContent).toContain('Why?');
    expect(screen.queryByTestId('install-button-kimi')).toBeNull();
  });

  it('installing: pins the version being fetched while the install runs', async () => {
    let settle: ((v: unknown) => void) | null = null;
    mockInstall.mockImplementation(() => new Promise((resolve) => (settle = resolve)));

    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-confirm'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('installable-tile-kimi').getAttribute('data-state')).toBe('installing')
    );
    expect(screen.getByTestId('install-state-kimi').textContent).toBe('Installing 0.34.0…');
    // Progress in place of the action, and no second Install button to click.
    expect(screen.getByTestId('install-progress-kimi')).toBeTruthy();
    expect(screen.queryByTestId('install-button-kimi')).toBeNull();

    await act(async () => {
      settle?.({ ok: true, status: status({ state: 'installed' }) });
    });
  });

  it('failed: names the cause and offers Retry', async () => {
    mockInstall.mockResolvedValue({ ok: false, reason: 'install-failed', message: 'exit 1' });

    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-confirm'));
    });

    await waitFor(() => expect(screen.getByTestId('installable-tile-kimi').getAttribute('data-state')).toBe('failed'));
    // The NAMED cause, not a generic banner.
    expect(screen.getByTestId('install-state-kimi').textContent).toBe(
      'The download failed. Check your connection and try again.'
    );
    expect(screen.getByTestId('install-button-kimi').textContent).toContain('Retry');
  });

  // Every reason the main process can return must have COPY. Three of them
  // (`already-installing`, `timed-out`, `cancelled`) shipped as failure reasons
  // with no string behind them, so the tile rendered the literal key path
  // "settings.agentsPage.install.failed.timed-out" at the user. Windows install
  // failures are unreadable without this, so it is asserted per reason rather
  // than sampled.
  it.each(['unknown-agent', 'bundled-bun-unavailable', 'install-failed', 'already-installing', 'timed-out', 'cancelled', 'error'] as const)(
    'failed(%s): renders copy, never a raw i18n key path',
    async (reason) => {
      mockInstall.mockResolvedValue({ ok: false, reason });

      render(<AvailableToInstall />);
      await screen.findByTestId('install-button-kimi');
      await act(async () => {
        fireEvent.click(screen.getByTestId('install-button-kimi'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('install-consent-confirm'));
      });

      await waitFor(() =>
        expect(screen.getByTestId('installable-tile-kimi').getAttribute('data-state')).toBe('failed')
      );
      const text = screen.getByTestId('install-state-kimi').textContent ?? '';
      expect(text.startsWith('settings.')).toBe(false);
      expect(text.length).toBeGreaterThan(0);
    }
  );

  it('failed: a rejected bridge call becomes a retryable failure, not a stuck spinner', async () => {
    mockInstall.mockRejectedValue(new Error('bridge died'));

    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-confirm'));
    });

    await waitFor(() => expect(screen.getByTestId('installable-tile-kimi').getAttribute('data-state')).toBe('failed'));
    expect(screen.getByTestId('install-state-kimi').textContent).toBe('The install stopped with an unexpected error.');
  });
});

describe('AvailableToInstall — an install in flight can be stopped', () => {
  it('installing: offers a Cancel that reaches agent-installer:cancel with the agent id', async () => {
    // `agent-installer:cancel` shipped on the wire with ZERO renderer call
    // sites: a running install had no stop, only a spinner and the deadline.
    let settle: ((v: unknown) => void) | null = null;
    mockInstall.mockImplementation(() => new Promise((resolve) => (settle = resolve)));

    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-confirm'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('installable-tile-kimi').getAttribute('data-state')).toBe('installing')
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-cancel-kimi'));
    });

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledWith({ agentId: 'kimi' });

    await act(async () => {
      settle?.({ ok: false, reason: 'cancelled' });
    });
  });

  it('cancel is offered ONLY while an install is running', async () => {
    // absent
    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    expect(screen.queryByTestId('install-cancel-kimi')).toBeNull();
    expect(mockCancel).not.toHaveBeenCalled();
  });
});

describe('AvailableToInstall — an install Wayland made can be removed', () => {
  const installedReport = () =>
    report([
      status({
        state: 'installed',
        managedInstall: { prefix: PREFIX, version: '0.34.0', installedAt: '2026-08-11T00:00:00.000Z' },
        reason: 'ok',
      }),
    ]);

  it('installed: a Remove control, behind a confirm, reaches agent-installer:uninstall', async () => {
    // `agent-installer:uninstall` was likewise unreachable from the UI: Wayland
    // would install into its own profile and then refuse to let go of it.
    mockStatus.mockResolvedValue(installedReport());
    render(<AvailableToInstall />);

    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('installed');

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-remove-kimi'));
    });
    // The click asks; it does not remove.
    expect(mockUninstall).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-remove-confirm'));
    });

    expect(mockUninstall).toHaveBeenCalledTimes(1);
    expect(mockUninstall).toHaveBeenCalledWith({ agentId: 'kimi' });
  });

  it('installed: dismissing the confirm removes nothing', async () => {
    mockStatus.mockResolvedValue(installedReport());
    render(<AvailableToInstall />);
    await screen.findByTestId('installable-tile-kimi');

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-remove-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-remove-cancel'));
    });

    expect(mockUninstall).not.toHaveBeenCalled();
  });

  it('system: NO Remove - Wayland did not install it and must not remove it (D1)', async () => {
    mockStatus.mockResolvedValue(
      report([
        status({
          state: 'system',
          detectedOnPath: true,
          managedInstall: null,
          reason: 'ok',
        }),
      ])
    );
    render(<AvailableToInstall />);

    const tile = await screen.findByTestId('installable-tile-kimi');
    expect(tile.getAttribute('data-state')).toBe('system');
    expect(screen.queryByTestId('install-remove-kimi')).toBeNull();
  });
});

describe('AvailableToInstall — consent GATES execution (D2)', () => {
  it('clicking Install opens the sheet and installs NOTHING', async () => {
    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });

    expect(screen.getByTestId('install-consent-sheet')).toBeTruthy();
    // The button is a REQUEST for consent, never the action itself.
    expect(mockInstall).not.toHaveBeenCalled();
  });

  it('states all four facts D2 requires, plus the plain sentence', async () => {
    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });

    expect(screen.getByTestId('install-consent-package').textContent).toBe('@moonshot-ai/kimi-code');
    expect(screen.getByTestId('install-consent-version').textContent).toBe('0.34.0');
    expect(screen.getByTestId('install-consent-destination').textContent).toBe(PREFIX);
    expect(screen.getByTestId('install-consent-scripts').textContent).toBe('Blocked');
    expect(screen.getByTestId('install-consent-sheet').textContent).toContain(
      'This downloads a package from npm and puts runnable code on your computer.'
    );
  });

  it('cancelling installs nothing', async () => {
    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-cancel'));
    });

    expect(mockInstall).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByTestId('install-consent-sheet')).toBeNull());
    // And the card is still installable afterwards - cancelling is not a failure.
    expect(screen.getByTestId('installable-tile-kimi').getAttribute('data-state')).toBe('absent');
  });

  it('confirming is the only thing that installs, and it installs exactly the agent consented to', async () => {
    mockStatus.mockResolvedValue(report([status({ agentId: 'codex' }), status({ agentId: 'kimi' })]));
    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-confirm'));
    });

    expect(mockInstall).toHaveBeenCalledTimes(1);
    expect(mockInstall).toHaveBeenCalledWith({ agentId: 'kimi' });
  });

  it('re-reads status after an install rather than guessing the outcome', async () => {
    render(<AvailableToInstall />);
    await screen.findByTestId('install-button-kimi');
    expect(mockStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByTestId('install-button-kimi'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('install-consent-confirm'));
    });

    await waitFor(() => expect(mockStatus.mock.calls.length).toBeGreaterThan(1));
  });
});

// D1 at EXECUTION time (a consent that goes stale before it is confirmed) is
// pinned against the controller itself in useAgentInstaller.dom.test.tsx, where
// the live agent list can be swapped deterministically instead of waiting on an
// SWR revalidation.
