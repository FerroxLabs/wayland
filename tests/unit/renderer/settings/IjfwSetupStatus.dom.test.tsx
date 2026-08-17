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
 * IJFW MCP server via `ipcBridge.ijfw.brainInvoke({ verb: 'metrics' })`.

 * The probe verb is deliberately `metrics`, not `state`: `state` direct-maps to
 * the `ijfw_state` facade, which demands its own inner verb and so answered
 * "verb (string) is required" for every probe, making Test fail on healthy
 * installs.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  // #891 adds a timer-driven probe retry; make sure a fake-timer test can never
  // leak its clock into the next one.
  vi.useRealTimers();
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
    expect(brainInvoke).toHaveBeenCalledWith({ verb: 'metrics' });
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
    expect(brainInvoke).toHaveBeenCalledWith({ verb: 'metrics' });
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
    expect(brainInvoke).toHaveBeenCalledWith({ verb: 'metrics' });
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

  // #891 — a degraded runtime must surface WHY, not a bare "Degraded (not
  // reachable)". The reason is already on the wire (`IjfwInvokeResult.error` /
  // `errorReason`); these pin that the renderer stops discarding it. The i18n
  // mock returns `defaultValue` verbatim and does NOT interpolate `{{...}}`, so
  // the raw reason must be concatenated outside `t()` and asserted by substring.
  it('mount probe surfaces the real reason on the runtime row (#891)', async () => {
    brainInvoke.mockResolvedValue({ ok: false, error: 'method not found: ijfw_state', errorReason: 'mcp_error' });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      const runtime = screen.getByTestId('ijfw-status-item-runtime');
      expect(runtime.getAttribute('data-status')).toBe('pending');
      expect(runtime.textContent).toContain('method not found: ijfw_state');
    });
  });

  it('mount probe falls back to the errorReason code when error is absent (#891)', async () => {
    brainInvoke.mockResolvedValue({ ok: false, errorReason: 'timeout' });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      const runtime = screen.getByTestId('ijfw-status-item-runtime');
      expect(runtime.getAttribute('data-status')).toBe('pending');
      expect(runtime.textContent).toContain('timeout');
    });
  });

  it('mount probe with an empty-string error falls through to the errorReason code (#891)', async () => {
    brainInvoke.mockResolvedValue({ ok: false, error: '', errorReason: 'timeout' });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      const runtime = screen.getByTestId('ijfw-status-item-runtime');
      expect(runtime.getAttribute('data-status')).toBe('pending');
      expect(runtime.textContent).toContain('timeout');
    });
  });

  it('mount probe with no reason preserves the bare degraded label without crashing (#891 regression guard)', async () => {
    brainInvoke.mockResolvedValue({ ok: false });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      const runtime = screen.getByTestId('ijfw-status-item-runtime');
      expect(runtime.getAttribute('data-status')).toBe('pending');
    });
    const runtime = screen.getByTestId('ijfw-status-item-runtime');
    expect(runtime.textContent).toContain('Degraded (not reachable)');
    expect(runtime.textContent).not.toContain('undefined');
  });

  it('mount probe reject path stays pending with no reason and no crash (#891 regression guard)', async () => {
    brainInvoke.mockRejectedValue(new Error('boom'));
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      const runtime = screen.getByTestId('ijfw-status-item-runtime');
      expect(runtime.getAttribute('data-status')).toBe('pending');
    });
    const runtime = screen.getByTestId('ijfw-status-item-runtime');
    expect(runtime.textContent).not.toContain('undefined');
  });

  it('Test button surfaces the real reason on fail (#891)', async () => {
    brainInvoke.mockResolvedValue({ ok: false, error: 'method not found: ijfw_state', errorReason: 'mcp_error' });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      const result = screen.getByTestId('ijfw-settings-test-result');
      expect(result.getAttribute('data-result')).toBe('fail');
      expect(result.textContent).toContain('method not found: ijfw_state');
    });
  });

  // #891 — the runtime row must reflect the LATEST probe, not the first failure
  // ever seen. Two mechanisms produced the reported false negative: the
  // main-side respawn backoff manufactures a failure WITHOUT probing, and the
  // renderer latched that first failure for the whole session.
  it('retries the mount probe past the respawn backoff instead of latching Degraded (#891)', async () => {
    vi.useFakeTimers();
    brainInvoke
      .mockResolvedValueOnce({
        ok: false,
        error: 'IJFW MCP respawn backoff active (4200ms remaining)',
        errorReason: 'spawn_backoff',
      })
      .mockResolvedValue({ ok: true });

    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);

    // First probe resolves with the synthetic backoff failure. Nothing was
    // actually probed, so the row must stay neutral, NOT flip to Degraded.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(brainInvoke).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('checking');

    // Past the backoff window the retry runs and finds a healthy runtime.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });
    expect(brainInvoke).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('ok');
  });

  it('stops retrying and reports Degraded when the backoff retry also fails (#891)', async () => {
    vi.useFakeTimers();
    brainInvoke.mockResolvedValue({
      ok: false,
      error: 'IJFW MCP respawn backoff active (4200ms remaining)',
      errorReason: 'spawn_backoff',
    });

    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);

    // Bounded: one immediate probe + exactly one retry. A dead runtime must not
    // be hammered, so a long wait adds no further calls.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(brainInvoke).toHaveBeenCalledTimes(2);
    const runtime = screen.getByTestId('ijfw-status-item-runtime');
    expect(runtime.getAttribute('data-status')).toBe('pending');
    expect(runtime.textContent).toContain('respawn backoff active');
  });

  it('does NOT retry a genuine runtime failure (#891 - no hammering)', async () => {
    vi.useFakeTimers();
    brainInvoke.mockResolvedValue({ ok: false, error: 'nope', errorReason: 'mcp_error' });

    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(brainInvoke).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('pending');
  });

  it('a passing Test clears an already-degraded runtime row (#891)', async () => {
    // Mount probe fails for real, so the row goes Degraded...
    brainInvoke.mockResolvedValueOnce({ ok: false, error: 'nope', errorReason: 'mcp_error' });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('pending');
    });

    // ...and the user presses Test, which succeeds. The row must follow the
    // LATEST evidence instead of staying pinned to the first failure.
    brainInvoke.mockResolvedValue({ ok: true });
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-settings-test-result').getAttribute('data-result')).toBe('pass');
    });
    const runtime = screen.getByTestId('ijfw-status-item-runtime');
    expect(runtime.getAttribute('data-status')).toBe('ok');
    expect(runtime.textContent).toContain('Live');
  });

  it('a failing Test degrades a previously-healthy runtime row with its reason (#891)', async () => {
    brainInvoke.mockResolvedValueOnce({ ok: true });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-status-item-runtime').getAttribute('data-status')).toBe('ok');
    });

    brainInvoke.mockResolvedValue({ ok: false, error: 'memory crashed', errorReason: 'mcp_crashed' });
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('ijfw-settings-test-result').getAttribute('data-result')).toBe('fail');
    });
    const runtime = screen.getByTestId('ijfw-status-item-runtime');
    expect(runtime.getAttribute('data-status')).toBe('pending');
    expect(runtime.textContent).toContain('memory crashed');
  });

  it('Test button with no reason preserves the fixed fail string (#891 regression guard)', async () => {
    brainInvoke.mockResolvedValue({ ok: false });
    render(<IjfwSetupStatus status='installed_current' cliCount={1} />);
    fireEvent.click(screen.getByTestId('ijfw-settings-test-button'));
    await waitFor(() => {
      const result = screen.getByTestId('ijfw-settings-test-result');
      expect(result.getAttribute('data-result')).toBe('fail');
    });
    const result = screen.getByTestId('ijfw-settings-test-result');
    expect(result.textContent).toContain('Memory did not respond. Check the install status above.');
    expect(result.textContent).not.toContain('undefined');
  });
});
