/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * DOM tests for the IJFW Memory setup-status checklist + Test button (#414).
 *
 * The checklist renders three signals (install / CLIs / runtime) with a
 * data-status of "ok" or "pending", and a Test button that probes the local
 * IJFW MCP server via `ipcBridge.ijfw.brainInvoke({ verb: 'state' })`.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const brainInvoke = vi.hoisted(() => vi.fn());

// i18n: return the defaultValue (reference English) so the component renders
// without a live i18n backend.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: Record<string, unknown> & { defaultValue?: string }) =>
      (opts?.defaultValue as string | undefined) ?? _key,
  }),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      brainInvoke: { invoke: brainInvoke },
    },
  },
}));

// eslint-disable-next-line import/first
import IjfwSetupStatus from '@/renderer/pages/settings/components/IjfwSetupStatus';

afterEach(() => {
  cleanup();
  brainInvoke.mockReset();
});

describe('IjfwSetupStatus (#414)', () => {
  it('marks all checks ok when installed, CLIs present, runtime probe reachable', async () => {
    brainInvoke.mockResolvedValue({ ok: true });
    render(<IjfwSetupStatus status='installed_current' cliCount={3} />);
    expect(screen.getByTestId('ijfw-status-item-install').getAttribute('data-status')).toBe('ok');
    expect(screen.getByTestId('ijfw-status-item-clis').getAttribute('data-status')).toBe('ok');
    // The runtime row is driven by a live probe on mount, not an unprobed mode.
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('ok');
    });
    expect(brainInvoke).toHaveBeenCalledWith({ verb: 'state' });
  });

  it('does NOT probe the runtime (no MCP spawn) when IJFW is not installed', async () => {
    brainInvoke.mockResolvedValue({ ok: true });
    render(<IjfwSetupStatus status='not_installed' cliCount={0} />);
    expect(screen.getByTestId('ijfw-status-item-install').getAttribute('data-status')).toBe('pending');
    expect(screen.getByTestId('ijfw-status-item-clis').getAttribute('data-status')).toBe('pending');
    // Mount probe must be gated: opening the panel while not installed must not
    // spawn the IJFW MCP child process.
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('pending');
    });
    expect(brainInvoke).not.toHaveBeenCalled();
    // Runtime row renders as neutral not-applicable, never the degraded warning.
    expect(screen.queryByText('Degraded (not reachable)')).toBeNull();
    expect(screen.getByText('Waiting for install')).toBeTruthy();
  });

  it('renders the runtime row as neutral "checking" (not the degraded warning) while the mount probe is in flight', () => {
    // Never-resolving probe keeps runtimeReachable === null so we observe the
    // in-flight state before it flips to Live/Degraded.
    brainInvoke.mockReturnValue(new Promise<never>(() => {}));
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    const runtime = screen.getByTestId('ijfw-status-item-runtime');
    expect(runtime.getAttribute('data-status')).toBe('checking');
    expect(screen.queryByText('Degraded (not reachable)')).toBeNull();
    expect(screen.getByText('Checking…')).toBeTruthy();
    expect(brainInvoke).toHaveBeenCalledWith({ verb: 'state' });
  });

  it('marks the runtime row pending when the mount probe rejects', async () => {
    brainInvoke.mockRejectedValue(new Error('boom'));
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('pending');
    });
  });

  it('treats pending activation as an installed check', () => {
    brainInvoke.mockResolvedValue({ ok: false });
    render(<IjfwSetupStatus status='installed_pending_activation' cliCount={0} />);
    expect(screen.getByTestId('ijfw-status-item-install').getAttribute('data-status')).toBe('ok');
  });

  it('Test button shows pass when the brain probe succeeds', async () => {
    brainInvoke.mockResolvedValue({ ok: true });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-settings-test-result').getAttribute('data-result')).toBe('pass');
    });
    expect(brainInvoke).toHaveBeenCalledWith({ verb: 'state' });
  });

  it('Test button shows fail when the brain probe errors', async () => {
    brainInvoke.mockResolvedValue({ ok: false, error: 'nope' });
    render(<IjfwSetupStatus status='not_installed' cliCount={0} />);
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-settings-test-result').getAttribute('data-result')).toBe('fail');
    });
  });

  it('Test button shows fail when the probe throws', async () => {
    brainInvoke.mockRejectedValue(new Error('boom'));
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-settings-test-result').getAttribute('data-result')).toBe('fail');
    });
  });
});
