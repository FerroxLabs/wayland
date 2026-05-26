/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

// @vitest-environment jsdom

/**
 * Wave 5 Task 5.0 — unit tests for the `useIjfwBrain` shared hook.
 *
 * Covers the four state transitions:
 *   - Initial render returns `{loading: true}`.
 *   - After ok:true resolve → `{loading: false, ok: true, data}`.
 *   - After ok:false resolve → `{loading: false, ok: false, errorReason}` with
 *     the propagated reason code (`'unknown'` if absent).
 *   - After invoke throws → `{loading: false, ok: false, errorReason: 'unknown'}`.
 *   - Cancel-on-unmount: a resolve after unmount does not call setState.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { brainInvokeMock } = vi.hoisted(() => ({
  brainInvokeMock: vi.fn<
    (args: { verb: string; args?: Record<string, unknown> }) => Promise<
      { ok: true; data?: unknown } | { ok: false; error?: string; errorReason?: string }
    >
  >(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      brainInvoke: { invoke: brainInvokeMock },
    },
  },
}));

import { useIjfwBrain } from '@renderer/pages/memory/hooks/useIjfwBrain';

beforeEach(() => {
  brainInvokeMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useIjfwBrain', () => {
  it('returns {loading: true} on initial render', () => {
    brainInvokeMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useIjfwBrain('memory_recall', { q: 'x' }, ['x']));
    expect(result.current).toEqual({ loading: true });
  });

  it('transitions to ok:true with the data payload after a successful resolve', async () => {
    brainInvokeMock.mockResolvedValueOnce({ ok: true, data: { hits: [1, 2, 3] } });
    const { result } = renderHook(() =>
      useIjfwBrain<{ hits: number[] }>('memory_search', { q: 'foo' }, ['foo'])
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        ok: true,
        data: { hits: [1, 2, 3] },
      });
    });
  });

  it('transitions to ok:false with the propagated errorReason code', async () => {
    brainInvokeMock.mockResolvedValueOnce({
      ok: false,
      error: 'oops',
      errorReason: 'mcp_error',
    });
    const { result } = renderHook(() => useIjfwBrain('state', {}, []));
    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        ok: false,
        errorReason: 'mcp_error',
      });
    });
  });

  it('falls back to errorReason="unknown" when ok:false is returned without a reason', async () => {
    brainInvokeMock.mockResolvedValueOnce({ ok: false, error: 'no reason here' });
    const { result } = renderHook(() => useIjfwBrain('state', {}, []));
    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        ok: false,
        errorReason: 'unknown',
      });
    });
  });

  it('transitions to errorReason="unknown" when the invoke promise throws', async () => {
    brainInvokeMock.mockRejectedValueOnce(new Error('ipc died'));
    const { result } = renderHook(() => useIjfwBrain('state', {}, []));
    await waitFor(() => {
      expect(result.current).toEqual({
        loading: false,
        ok: false,
        errorReason: 'unknown',
      });
    });
  });

  it('does not setState after unmount when the invoke promise resolves late', async () => {
    let resolveLate: ((value: { ok: true; data: unknown }) => void) | null = null;
    brainInvokeMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLate = resolve;
      })
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useIjfwBrain('state', {}, []));
    expect(result.current).toEqual({ loading: true });

    unmount();

    // Resolve after unmount — the hook must swallow this silently.
    await act(async () => {
      resolveLate?.({ ok: true, data: { late: true } });
      await Promise.resolve();
    });

    // If the hook had called setState on the unmounted component, React
    // would have logged a warning via console.error. Verify none surfaced.
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
