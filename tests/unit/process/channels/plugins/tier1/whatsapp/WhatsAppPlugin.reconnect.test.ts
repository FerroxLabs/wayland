/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * W-10 (v0.4.3 R5): coverage for the WhatsApp bridge reconnect ladder.
 *  - Unexpected bridge `exit` schedules a respawn via fork()
 *  - Ladder exhaustion (RECONNECT_MAX_ATTEMPTS) transitions status -> 'error'
 *    with an "exhausted" message
 *  - onStop sets stopRequested + clears any pending reconnectTimer so a
 *    subsequent bridge exit does NOT schedule another reconnect
 *  - A `connection.status: connected` notification resets reconnectAttempts
 *  - Backoff timing matches INITIAL * FACTOR^(n-1), clamped at MAX_MS.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

const { forkSpy, getFakeChild, resetChild, stdinWrites } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  type Emitter = {
    on: (event: string, cb: Listener) => unknown;
    once: (event: string, cb: Listener) => unknown;
    off: (event: string, cb: Listener) => unknown;
    emit: (event: string, ...args: unknown[]) => boolean;
  };
  function makeEmitter(): Emitter {
    const listeners: Record<string, Listener[]> = {};
    return {
      on(event, cb) {
        (listeners[event] ??= []).push(cb);
        return this;
      },
      once(event, cb) {
        const wrap: Listener = (...args) => {
          this.off(event, wrap);
          cb(...args);
        };
        (listeners[event] ??= []).push(wrap);
        return this;
      },
      off(event, cb) {
        const arr = listeners[event];
        if (!arr) return this;
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
        return this;
      },
      emit(event, ...args) {
        const arr = listeners[event];
        if (!arr || arr.length === 0) return false;
        for (const cb of arr.slice()) cb(...args);
        return true;
      },
    };
  }

  type Child = Emitter & {
    stdout: Emitter & { setEncoding: () => void };
    stdin: { write: (frame: string, cb?: (err?: Error) => void) => boolean };
    kill: (sig?: string) => undefined;
  };

  const stdinWrites: string[] = [];
  let current: Child;

  function buildChild(): Child {
    const stdout = Object.assign(makeEmitter(), {
      setEncoding: () => undefined,
    });
    const stdin = {
      write(frame: string, cb?: (err?: Error) => void) {
        stdinWrites.push(frame);
        cb?.();
        return true;
      },
    };
    return Object.assign(makeEmitter(), {
      stdout,
      stdin,
      kill: (_sig?: string) => undefined,
    });
  }

  function resetChild(): void {
    current = buildChild();
  }
  function getFakeChild(): Child {
    return current;
  }
  resetChild();

  return {
    forkSpy: vi.fn(() => {
      // Each fork() call returns a fresh child emitter so the reconnect
      // ladder can wire its `exit`/`error` listeners onto the new process
      // without colliding with the previous (dead) one.
      resetChild();
      return current;
    }),
    getFakeChild,
    resetChild,
    stdinWrites,
  };
});

vi.mock('child_process', () => ({
  fork: forkSpy,
  ChildProcess: class {},
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/test/app' },
}));

import { WhatsAppPlugin } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

function configFor(backend: string): IChannelPluginConfig {
  return {
    id: 'whatsapp_default',
    type: 'whatsapp',
    name: 'WhatsApp',
    enabled: true,
    status: 'created',
    createdAt: 0,
    updatedAt: 0,
    credentials: { backend },
  };
}

async function flush(): Promise<void> {
  // Settle micro-tasks (await chains) between fake-timer advances. setImmediate
  // is real (vi.useFakeTimers doesn't fake setImmediate by default).
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve();
}

/** Resolve the next outstanding `connect` RPC by feeding a JSON-RPC reply. */
function resolveConnectRpc(): void {
  // The latest stdin frame should be the `connect` request; parse its id and
  // mirror it back as a success reply so onStart()'s await resolves.
  const lastFrame = stdinWrites[stdinWrites.length - 1];
  if (!lastFrame) return;
  const parsed = JSON.parse(lastFrame.trim()) as { id: number; method: string };
  getFakeChild().stdout.emit('data', `${JSON.stringify({ jsonrpc: '2.0', id: parsed.id, result: { ok: true } })}\n`);
}

/**
 * Drive the plugin from `created` -> `running`. We can't simply await
 * `plugin.start()` because onStart issues a JSON-RPC `connect` that needs a
 * mocked reply; we start it, flush so the RPC frame lands on stdin, then
 * mirror the response back.
 */
async function bringUp(plugin: WhatsAppPlugin): Promise<void> {
  await plugin.initialize(configFor('baileys'));
  const startP = plugin.start();
  await flush(); // let onStart push the connect frame to stdin
  resolveConnectRpc();
  await startP;
  expect(plugin.status).toBe('running');
}

describe('WhatsAppPlugin - W-10 reconnect ladder', () => {
  beforeEach(() => {
    forkSpy.mockClear();
    stdinWrites.length = 0;
    resetChild();
  });

  it('schedules a respawn (re-forks bridge) when the bridge exits unexpectedly', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const plugin = new WhatsAppPlugin();
      await bringUp(plugin);
      expect(forkSpy).toHaveBeenCalledTimes(1);

      // Simulate an unexpected bridge crash.
      getFakeChild().emit('exit', 1, null);
      await flush();

      // First reconnect delay = INITIAL = 2000ms.
      await vi.advanceTimersByTimeAsync(2_000);
      await flush();

      expect(forkSpy).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('transitions to error with "exhausted" after RECONNECT_MAX_ATTEMPTS', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const plugin = new WhatsAppPlugin();
      await bringUp(plugin);

      // Drive the ladder all the way through. RECONNECT_MAX_ATTEMPTS = 12.
      // The respawn path calls onStart() which issues another `connect` RPC;
      // we resolve each one and then crash the new child so the next ladder
      // step queues. After 12 successful schedule+exit pairs the 13th call
      // hits the >=MAX_ATTEMPTS guard.
      for (let i = 0; i < 12; i++) {
        getFakeChild().emit('exit', 1, null);
        await flush();
        // Advance well past the max delay (30s) so any scheduled timer fires.
        await vi.advanceTimersByTimeAsync(35_000);
        await flush();
        // The respawn issued a fresh `connect`; mirror its response so the
        // onStart promise the ladder kicked off settles cleanly. (We don't
        // need to await that internal promise - it's fire-and-forget via
        // `void this.onStart()`.) Wrap in try in case a step did not actually
        // produce a fresh frame (e.g. exhaustion).
        try {
          resolveConnectRpc();
        } catch {
          // no outstanding connect - exhaustion already tripped.
        }
        await flush();
      }

      // The 13th exit must trip the exhaustion guard.
      getFakeChild().emit('exit', 1, null);
      await flush();

      expect(plugin.status).toBe('error');
      expect(plugin.error).toMatch(/exhausted/i);
    } finally {
      vi.useRealTimers();
    }
  });

  it('onStop sets stopRequested + cancels pending reconnectTimer (no respawn after stop)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const plugin = new WhatsAppPlugin();
      await bringUp(plugin);
      expect(forkSpy).toHaveBeenCalledTimes(1);

      // Operator-initiated stop while the plugin is still 'running'. onStop
      // sets stopRequested=true and clears any reconnectTimer BEFORE invoking
      // killChild, then races disconnect-rpc against a 2s timeout. The
      // disconnect RPC will never resolve under the mock - let the 2s race
      // settle then advance past killChild's 5s SIGKILL safety.
      const stopPromise = plugin.stop();
      await flush();
      await vi.advanceTimersByTimeAsync(2_100); // disconnect-vs-timeout race
      await flush();
      await vi.advanceTimersByTimeAsync(5_100); // killChild SIGKILL safety
      await flush();
      await stopPromise;
      expect(plugin.status).toBe('stopped');

      // The bridge process now emits its terminal `exit` event (SIGTERM
      // landed). With stopRequested=true the handler must NOT re-fork.
      getFakeChild().emit('exit', null, 'SIGTERM');
      await flush();
      await vi.advanceTimersByTimeAsync(60_000);
      await flush();

      // Only the original initialize fork; no reconnect-time forks happened.
      expect(forkSpy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets reconnectAttempts on a successful connection.status=connected', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const plugin = new WhatsAppPlugin();
      await bringUp(plugin);

      // First failure -> attempt 1 (2000ms).
      getFakeChild().emit('exit', 1, null);
      await flush();
      await vi.advanceTimersByTimeAsync(2_000);
      await flush();
      expect(forkSpy).toHaveBeenCalledTimes(2);
      // The respawn issued a fresh `connect` RPC; resolve it.
      resolveConnectRpc();
      await flush();

      // The fresh child reports connected -> attempts reset to 0.
      getFakeChild().stdout.emit(
        'data',
        `${JSON.stringify({
          jsonrpc: '2.0',
          method: 'connection.status',
          params: { state: 'connected' },
        })}\n`
      );
      await flush();

      // Another crash should start a NEW attempt 1 at 2000ms - proving the
      // counter reset. If it had not reset, this respawn would be attempt 2
      // at 3600ms and the 2000ms advance would not fire the timer.
      getFakeChild().emit('exit', 1, null);
      await flush();
      await vi.advanceTimersByTimeAsync(2_000);
      await flush();
      expect(forkSpy).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('backoff follows INITIAL * FACTOR^(n-1), clamped at MAX_MS', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const plugin = new WhatsAppPlugin();
      await bringUp(plugin);

      // Helper: crash, assert no respawn at delay-1, then advance the last ms
      // and assert the new fork landed. After each successful respawn, mirror
      // the new `connect` RPC so onStart settles cleanly.
      async function crashAndExpect(delayMs: number, totalForksAfter: number): Promise<void> {
        getFakeChild().emit('exit', 1, null);
        await flush();
        await vi.advanceTimersByTimeAsync(delayMs - 1);
        await flush();
        expect(forkSpy).toHaveBeenCalledTimes(totalForksAfter - 1);
        await vi.advanceTimersByTimeAsync(1);
        await flush();
        expect(forkSpy).toHaveBeenCalledTimes(totalForksAfter);
        try {
          resolveConnectRpc();
        } catch {
          // ignore - fresh child may not have produced a connect frame yet.
        }
        await flush();
      }

      // Attempt 1: 2000 * 1.8^0 = 2000ms.
      await crashAndExpect(2_000, 2);
      // Attempt 2: 2000 * 1.8^1 = 3600ms.
      await crashAndExpect(3_600, 3);
      // Attempt 3: 2000 * 1.8^2 = 6480ms.
      await crashAndExpect(6_480, 4);
      // Attempt 4: 2000 * 1.8^3 = 11664ms (rounded).
      await crashAndExpect(11_664, 5);
      // Attempt 5: 2000 * 1.8^4 = 20995ms (rounded).
      await crashAndExpect(20_995, 6);
      // Attempt 6: raw 37758 -> clamped to 30000ms.
      await crashAndExpect(30_000, 7);
    } finally {
      vi.useRealTimers();
    }
  });
});
