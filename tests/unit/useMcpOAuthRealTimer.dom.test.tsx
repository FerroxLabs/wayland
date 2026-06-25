/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * #242 real-path verification: drive the REAL useMcpOAuth hook against a REAL
 * never-resolving login (the exact hang: dead vendor endpoint / unfinished or
 * mis-pasted consent) using REAL timers. The companion fake-timer test proves
 * the same outcome by simulation; this one proves the wall-clock setTimeout
 * inside Promise.race actually fires and settles the hook, with no tautological
 * mock of the timeout/abort logic itself.
 *
 * Ceiling: this is the real hook in jsdom. The only thing mocked is the IPC
 * boundary (mcpService.loginMcpOAuth.invoke) and the platform check - exactly
 * the seam #242 lives behind. The gold-standard E2E (the Save & Sign-in GUI
 * click in the running Electron app) is the remaining step.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { IMcpServer } from '@/common/config/storage';

// A never-resolving invoke is the genuine #242 hang. The hook's race must still
// settle in real wall-clock time via its own timeout / abort.
const loginInvoke = vi.hoisted(() => vi.fn());

vi.mock('@/common/adapter/ipcBridge', () => ({
  mcpService: {
    loginMcpOAuth: { invoke: loginInvoke },
  },
}));

vi.mock('@renderer/utils/platform', () => ({
  isElectronDesktop: () => true,
}));

vi.mock('@renderer/services/McpOAuthService', () => ({
  startMcpOAuthHttp: vi.fn(),
}));

vi.mock('@renderer/services/McpConfigService', () => ({
  setMcpByoOAuthCredentialsHttp: vi.fn(),
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: { get: vi.fn() },
}));

import { useMcpOAuth } from '@renderer/hooks/mcp/useMcpOAuth';

const server = { id: 'github', transport: { type: 'http' } } as unknown as IMcpServer;

// The genuine hang: a promise that never settles.
const neverResolves = () => new Promise(() => {});

describe('useMcpOAuth #242 real-timer drive (no fake timers)', () => {
  beforeEach(() => {
    loginInvoke.mockReset();
    // Explicit: REAL timers. The timeout must fire by itself.
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TIMEOUT: real never-resolving login settles to a timeout result in real time, spinner clears', async () => {
    loginInvoke.mockImplementation(neverResolves);

    const { result } = renderHook(() => useMcpOAuth());

    let settled: Awaited<ReturnType<typeof result.current.login>> | undefined;
    let didSettle = false;
    act(() => {
      void result.current.login(server, undefined, { timeoutMs: 50 }).then((r) => {
        settled = r;
        didSettle = true;
      });
    });

    // In flight: spinner on, nothing settled yet.
    expect(result.current.loggingIn[server.id]).toBe(true);
    expect(didSettle).toBe(false);

    // No fake-timer advance. The real 50ms setTimeout inside the hook must fire.
    await waitFor(() => expect(didSettle).toBe(true), { timeout: 2000 });

    expect(settled).toEqual({ success: false, code: 'timeout', error: 'timeout' });
    // Spinner clears in the hook's finally; the re-render is async, so await it.
    await waitFor(() => expect(result.current.loggingIn[server.id]).toBe(false), { timeout: 2000 });
  });

  it('CANCEL: real abort signal settles to a cancelled result, spinner clears, no timeout wait', async () => {
    loginInvoke.mockImplementation(neverResolves);

    const { result } = renderHook(() => useMcpOAuth());
    const controller = new AbortController();

    let settled: Awaited<ReturnType<typeof result.current.login>> | undefined;
    let didSettle = false;
    act(() => {
      // Large timeout: if cancel did NOT work, this test would hang far past it.
      void result.current.login(server, undefined, { signal: controller.signal, timeoutMs: 60_000 }).then((r) => {
        settled = r;
        didSettle = true;
      });
    });

    expect(result.current.loggingIn[server.id]).toBe(true);

    // Real abort event on the real signal.
    act(() => {
      controller.abort();
    });

    await waitFor(() => expect(didSettle).toBe(true), { timeout: 2000 });

    expect(settled).toEqual({ success: false, code: 'cancelled', error: 'Sign-in cancelled' });
    await waitFor(() => expect(result.current.loggingIn[server.id]).toBe(false), { timeout: 2000 });
  });

  it('HAPPY PATH: a fast-resolving login returns success and is not pre-empted by the timeout', async () => {
    loginInvoke.mockResolvedValue({ success: true, data: { success: true } });

    const { result } = renderHook(() => useMcpOAuth());

    let settled: Awaited<ReturnType<typeof result.current.login>> | undefined;
    await act(async () => {
      // Real (short) timeout coexists; the real resolve must win the race.
      settled = await result.current.login(server, undefined, { timeoutMs: 50 });
    });

    expect(settled).toEqual({ success: true });
    expect(result.current.loggingIn[server.id]).toBe(false);
    // Authenticated state was set on the success path.
    expect(result.current.oauthStatus[server.id]?.isAuthenticated).toBe(true);
  });
});
