/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for `ijfwBridge` - verifies provider registration + brain.invoke
 * input validation via the per-verb schema, and that checkNow/triggerInstall/
 * skipSetup/getRuntimeMode reach the right service surfaces.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getPath: (key: string) => `/tmp/wayland-test-${key}` },
}));

// Capture every provider registration so each test can fish out a handler
// and invoke it directly without IPC plumbing.
type Provider<T, U> = (handler: (args: U) => Promise<T>) => void;
const providers = new Map<string, (args: unknown) => Promise<unknown>>();

vi.mock('@/common', () => ({
  ipcBridge: {
    ijfw: {
      brainInvoke: {
        provider: ((handler) => {
          providers.set('brainInvoke', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      getStatus: {
        provider: ((handler) => {
          providers.set('getStatus', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      checkNow: {
        provider: ((handler) => {
          providers.set('checkNow', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      triggerInstall: {
        provider: ((handler) => {
          providers.set('triggerInstall', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      skipSetup: {
        provider: ((handler) => {
          providers.set('skipSetup', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      getRuntimeMode: {
        provider: ((handler) => {
          providers.set('getRuntimeMode', handler as (args: unknown) => Promise<unknown>);
        }) as Provider<unknown, unknown>,
      },
      onStatusChanged: { emit: vi.fn() },
    },
  },
}));

const mcpInvokeSpy = vi.fn(async (verb: string, args: Record<string, unknown>) => ({
  ok: true,
  data: { verb, args },
}));
const mcpGetModeSpy = vi.fn(() => 'full' as const);
vi.mock('@process/services/ijfw/ijfwMcpClient', () => ({
  ijfwMcpClient: {
    invoke: (verb: string, args: Record<string, unknown>) => mcpInvokeSpy(verb, args),
    getMode: () => mcpGetModeSpy(),
    shutdown: async () => undefined,
    waitForExit: async () => true,
  },
}));

const getLatestSpy = vi.fn(async () => '1.5.4');
const bootstrapSpy = vi.fn(async () => undefined);
vi.mock('@process/services/ijfwSystemService', () => ({
  ijfwSystemService: {
    getLatestPublished: () => getLatestSpy(),
    bootstrap: () => bootstrapSpy(),
    getRuntimeMode: () => 'enabled',
  },
  __resetCacheForTests: () => {},
  getLastStatus: () => null,
}));

const setSpy = vi.fn(async () => undefined);
vi.mock('@process/utils/initStorage', () => ({
  ProcessConfig: {
    set: (key: string, value: unknown) => setSpy(key, value),
    get: async () => undefined,
  },
}));

// eslint-disable-next-line import/first
import { initIjfwBridge } from '@process/bridge/ijfwBridge';

beforeEach(() => {
  providers.clear();
  mcpInvokeSpy.mockClear();
  mcpGetModeSpy.mockClear();
  bootstrapSpy.mockClear();
  getLatestSpy.mockClear();
  setSpy.mockClear();
  initIjfwBridge();
});

describe('ijfwBridge', () => {
  it('registers all six providers', () => {
    expect(providers.has('brainInvoke')).toBe(true);
    expect(providers.has('getStatus')).toBe(true);
    expect(providers.has('checkNow')).toBe(true);
    expect(providers.has('triggerInstall')).toBe(true);
    expect(providers.has('skipSetup')).toBe(true);
    expect(providers.has('getRuntimeMode')).toBe(true);
  });

  describe('brainInvoke', () => {
    it('forwards valid invocation to ijfwMcpClient', async () => {
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({ verb: 'think', args: { query: 'hello' } })) as {
        ok: boolean;
        data?: unknown;
      };
      expect(result.ok).toBe(true);
      expect(mcpInvokeSpy).toHaveBeenCalledWith('think', { query: 'hello' });
    });

    it('rejects unknown verbs with errorReason validation_failed', async () => {
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({ verb: 'not.a.verb', args: {} })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
      expect(mcpInvokeSpy).not.toHaveBeenCalled();
    });

    it('rejects schema-invalid args with errorReason validation_failed', async () => {
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({ verb: 'think', args: {} })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    it('rejects prototype pollution via constructor key', async () => {
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({
        verb: 'think',
        args: { query: 'hi', constructor: { evil: true } },
      })) as { ok: boolean; errorReason?: string };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });

    // Wave 7 H1: the bridge no longer short-circuits on degraded mode. It
    // delegates to `ijfwMcpClient.invoke()`, which calls `ensureSpawned()` on
    // every call and respawns the child when it has been nulled by a crash /
    // decode-error / stdin-write-error path. Previously the bridge-level gate
    // ran BEFORE invoke() could attempt a respawn, so one crash permanently
    // trapped the client.
    it('forwards invocation to ijfwMcpClient even when mode reads as degraded (H1)', async () => {
      // Bridge must no longer consult getMode() before invoke(). Verify by
      // never queueing a getMode response - if the bridge gate were still
      // present it would call getMode() (default 'full') and pass, but we
      // also assert getMode was NEVER called from the brainInvoke path.
      mcpGetModeSpy.mockClear();
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({ verb: 'think', args: { query: 'hi' } })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(true);
      expect(mcpInvokeSpy).toHaveBeenCalledWith('think', { query: 'hi' });
      expect(mcpGetModeSpy).not.toHaveBeenCalled();
    });

    it('surfaces spawn_error from invoke when respawn fails (H1)', async () => {
      mcpInvokeSpy.mockResolvedValueOnce({
        ok: false,
        error: 'entry not found',
        errorReason: 'spawn_error' as const,
      });
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({ verb: 'think', args: { query: 'hi' } })) as {
        ok: boolean;
        errorReason?: string;
      };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('spawn_error');
      expect(mcpInvokeSpy).toHaveBeenCalledTimes(1);
    });

    it('rejects envelope with missing verb', async () => {
      const handler = providers.get('brainInvoke')!;
      const result = (await handler({})) as { ok: boolean; errorReason?: string };
      expect(result.ok).toBe(false);
      expect(result.errorReason).toBe('validation_failed');
    });
  });

  describe('checkNow', () => {
    it('refreshes version cache via ijfwSystemService', async () => {
      const handler = providers.get('checkNow')!;
      const result = (await handler(undefined)) as { ok: boolean; version?: string };
      expect(result.ok).toBe(true);
      expect(result.version).toBe('1.5.4');
      expect(getLatestSpy).toHaveBeenCalled();
    });

    it('returns ok=false when underlying call rejects', async () => {
      getLatestSpy.mockRejectedValueOnce(new Error('network'));
      const handler = providers.get('checkNow')!;
      const result = (await handler(undefined)) as { ok: boolean; error?: string };
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/network/);
    });
  });

  describe('triggerInstall', () => {
    it('calls bootstrap synchronously and returns ok', async () => {
      const handler = providers.get('triggerInstall')!;
      const result = (await handler(undefined)) as { ok: boolean };
      expect(result.ok).toBe(true);
      expect(bootstrapSpy).toHaveBeenCalled();
    });

    it('returns ok=false on bootstrap rejection', async () => {
      bootstrapSpy.mockRejectedValueOnce(new Error('disk full'));
      const handler = providers.get('triggerInstall')!;
      const result = (await handler(undefined)) as { ok: boolean; error?: string };
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/disk full/);
    });
  });

  describe('skipSetup', () => {
    it('persists the opt-out flag', async () => {
      const handler = providers.get('skipSetup')!;
      const result = (await handler({ enabled: true })) as { ok: boolean };
      expect(result.ok).toBe(true);
      expect(setSpy).toHaveBeenCalledWith('ijfw.skipSetup', true);
    });
  });

  describe('getRuntimeMode', () => {
    it('returns the current client mode', async () => {
      const handler = providers.get('getRuntimeMode')!;
      const result = await handler(undefined);
      expect(result).toBe('full');
    });
  });

  describe('getStatus', () => {
    it('returns not_installed when no status has been emitted yet', async () => {
      const handler = providers.get('getStatus')!;
      const result = (await handler(undefined)) as { status: string };
      expect(result.status).toBe('not_installed');
    });
  });
});
