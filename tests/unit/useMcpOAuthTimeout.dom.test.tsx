/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { IMcpServer } from '@/common/config/storage';

// login() (desktop branch) awaits mcpService.loginMcpOAuth.invoke. A never-
// resolving invoke reproduces the #242 hang; the hook's race must still settle.
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

describe('useMcpOAuth login timeout / cancel (#242)', () => {
  beforeEach(() => {
    loginInvoke.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('settles to a timeout result when the IPC never resolves, and clears the spinner', async () => {
    // Never resolves: models the dead-vendor / unfinished-consent hang.
    loginInvoke.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMcpOAuth());

    let outcome: Awaited<ReturnType<typeof result.current.login>> | undefined;
    act(() => {
      void result.current.login(server, { timeoutMs: 1000 }).then((r) => {
        outcome = r;
      });
    });

    // Spinner is on while in flight.
    expect(result.current.loggingIn[server.id]).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(outcome).toEqual({ success: false, code: 'unknown', error: 'timeout' });
    expect(result.current.loggingIn[server.id]).toBe(false);
  });

  it('settles to a cancelled result when the caller aborts, and clears the spinner', async () => {
    loginInvoke.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMcpOAuth());
    const controller = new AbortController();

    let outcome: Awaited<ReturnType<typeof result.current.login>> | undefined;
    act(() => {
      void result.current
        .login(server, { signal: controller.signal, timeoutMs: 60_000 })
        .then((r) => {
          outcome = r;
        });
    });

    expect(result.current.loggingIn[server.id]).toBe(true);

    await act(async () => {
      controller.abort();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(outcome).toEqual({ success: false, code: 'cancelled', error: 'Sign-in cancelled' });
    expect(result.current.loggingIn[server.id]).toBe(false);
  });

  it('resolves the happy path well before the timeout fires', async () => {
    loginInvoke.mockResolvedValue({ success: true, data: { success: true } });

    const { result } = renderHook(() => useMcpOAuth());

    let outcome: Awaited<ReturnType<typeof result.current.login>> | undefined;
    await act(async () => {
      outcome = await result.current.login(server, { timeoutMs: 120_000 });
    });

    expect(outcome).toEqual({ success: true });
    expect(result.current.loggingIn[server.id]).toBe(false);
  });
});
