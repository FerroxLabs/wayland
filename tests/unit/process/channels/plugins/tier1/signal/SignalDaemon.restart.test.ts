/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalDaemon restart / backoff + HTTP transport behaviour - verifies:
 *   - unexpected exit triggers a restart after backoff delay
 *   - restart counter increments correctly
 *   - after MAX_RESTART_ATTEMPTS status transitions to 'error'
 *   - stop() cancels a pending restart
 *   - outbound RPC posts JSON-RPC frames to /api/v1/rpc
 *   - inbound poll loop dispatches envelopes returned by `receive`
 *
 * Transport changed from stdio → HTTP (audit HIGH 4 2026-05-18); these tests
 * mock `fetch` rather than child.stdin/stdout.  Uses real timers (vi.useFakeTimers
 * only where needed) and synchronous child exit emission to avoid
 * setImmediate / setTimeout interaction issues.
 */

import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist spawn mock ──────────────────────────────────────────────────────────

const { mockSpawn, getChildren } = vi.hoisted(() => {
  type FakeStream = EventEmitter & {
    setEncoding: ReturnType<typeof vi.fn>;
  };

  type FakeChild = EventEmitter & {
    stdout: FakeStream;
    stderr: FakeStream;
    pid: number;
    killed: boolean;
    kill: ReturnType<typeof vi.fn>;
    /** Synchronously fire the exit event (avoids setImmediate/fake-timer issues). */
    exitSync: (code: number | null, signal: NodeJS.Signals | null) => void;
  };

  const children: FakeChild[] = [];

  function makeStream(): FakeStream {
    const s = new EventEmitter() as FakeStream;
    s.setEncoding = vi.fn();
    return s;
  }

  const mockSpawn = vi.fn(function (): FakeChild {
    const child = new EventEmitter() as FakeChild;
    child.stdout = makeStream();
    child.stderr = makeStream();
    child.pid = 10000 + children.length;
    child.killed = false;
    child.exitSync = (code, signal) => {
      child.emit('exit', code, signal);
    };
    // kill() fires exit synchronously so stop() resolves without needing timers.
    child.kill = vi.fn((sig: string) => {
      if (!child.killed) {
        child.killed = true;
        child.exitSync(null, (sig ?? 'SIGTERM') as NodeJS.Signals);
      }
    });
    children.push(child);
    return child;
  });

  return {
    mockSpawn,
    getChildren: () => children,
  };
});

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
  execFile: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: () => '/fake/app',
    getPath: () => '/fake/userData',
  },
}));

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn(() => false) },
  existsSync: vi.fn(() => false),
}));

import { SignalDaemon } from '@process/channels/plugins/tier1/signal/SignalDaemon';

// ── fetch mock helpers ───────────────────────────────────────────────────────

type FetchCall = { url: string; init?: RequestInit };

function makeFetchMock(handler: (call: FetchCall) => Response | Promise<Response>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    return await handler({ url, init });
  });
}

function jsonRpcOk(id: number | string, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  // Clear the shared children array.
  getChildren().splice(0);
  mockSpawn.mockClear();
  // Disable jitter so deterministic backoff assertions (5_000 / 10_000) still
  // hold. The jitter was added per gemini MED1 2026-05-18; tests pin it to 0.
  vi.spyOn(Math, 'random').mockReturnValue(0);
  // Default fetch mock: any /check probe returns ok, any /rpc returns empty
  // receive result. Individual tests override via vi.stubGlobal.
  vi.stubGlobal(
    'fetch',
    makeFetchMock(({ url }) => {
      if (url.endsWith('/api/v1/check')) {
        return new Response('', { status: 200 });
      }
      return jsonRpcOk(1, []);
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SignalDaemon restart behaviour', () => {
  it('spawns signal-cli with daemon + --http args on start()', async () => {
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();
    expect(mockSpawn).toHaveBeenCalledOnce();
    const [, args] = mockSpawn.mock.calls[0] as [string, string[]];
    expect(args).toContain('daemon');
    expect(args).toContain('--http');
    expect(args).toContain('+14155551234');
    expect(args).toContain('--no-receive-stdout');
    await daemon.stop();
  });

  it('spawns child with stdin ignored (RPC travels via HTTP)', async () => {
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();
    const [, , spawnOpts] = mockSpawn.mock.calls[0] as [
      string,
      string[],
      { stdio: [string, string, string] },
    ];
    expect(spawnOpts.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    await daemon.stop();
  });

  it('status is starting after start() and stays there until HTTP /api/v1/check responds', async () => {
    // v0.4.1 codex audit fix: setStatus('running') moved INSIDE the success
    // branch of the HTTP ready probe, so a fresh start() leaves status in
    // 'starting' until the probe succeeds. This prevents the window where
    // consumers see status=running but RPC fetches still 502.
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();
    expect(daemon.status).toBe('starting');
    await daemon.stop();
  });

  it('status is stopped after stop()', async () => {
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();
    await daemon.stop();
    expect(daemon.status).toBe('stopped');
  });

  it('schedules a restart after unexpected exit (first attempt: 5 s)', async () => {
    vi.useFakeTimers();
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();
    expect(mockSpawn).toHaveBeenCalledTimes(1);

    // Simulate unexpected exit synchronously.
    getChildren()[0].exitSync(1, null);

    expect(daemon.status).toBe('starting');

    // Advance past the 5s initial backoff.
    await vi.advanceTimersByTimeAsync(5_001);
    expect(mockSpawn).toHaveBeenCalledTimes(2);

    // Stop with real timers so killChild resolves immediately.
    vi.useRealTimers();
    await daemon.stop();
  });

  it('doubles backoff on successive failures (5s → 10s)', async () => {
    vi.useFakeTimers();
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();

    // First exit → restart after 5s.
    getChildren()[0].exitSync(1, null);
    await vi.advanceTimersByTimeAsync(5_001);
    expect(mockSpawn).toHaveBeenCalledTimes(2);

    // Second exit → restart after 10s.
    getChildren()[1].exitSync(1, null);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(mockSpawn).toHaveBeenCalledTimes(2); // not yet
    await vi.advanceTimersByTimeAsync(5_001);
    expect(mockSpawn).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
    await daemon.stop();
  });

  it('transitions to error after exceeding MAX_RESTART_ATTEMPTS (5)', async () => {
    vi.useFakeTimers();
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();

    // The daemon allows MAX_RESTART_ATTEMPTS=5 restarts.
    // Spawn sequence: #1 (initial) → exit → #2 → exit → ... → #6 → exit → error.
    // 6 exits total exhaust the budget.
    for (let i = 0; i < 6; i++) {
      getChildren()[i].exitSync(1, null);
      // Advance past the current backoff so the next restart fires (if any).
      await vi.advanceTimersByTimeAsync(65_000);
    }

    expect(daemon.status).toBe('error');
    // original spawn + 5 retry spawns = 6 total
    expect(mockSpawn).toHaveBeenCalledTimes(6);
    vi.useRealTimers();
  });

  it('stop() cancels a pending restart and does not spawn again', async () => {
    vi.useFakeTimers();
    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();

    getChildren()[0].exitSync(1, null);
    expect(daemon.status).toBe('starting');

    // Stop before the 5s fires.
    vi.useRealTimers();
    await daemon.stop();

    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_000);

    // Only the original spawn - no restart.
    expect(mockSpawn).toHaveBeenCalledTimes(1);
    expect(daemon.status).toBe('stopped');
    vi.useRealTimers();
  });
});

describe('SignalDaemon HTTP transport', () => {
  it('rpc() POSTs JSON-RPC frame to /api/v1/rpc and returns result', async () => {
    const captured: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      makeFetchMock((call) => {
        captured.push(call);
        if (call.url.endsWith('/api/v1/check')) {
          return new Response('', { status: 200 });
        }
        if (call.url.endsWith('/api/v1/rpc')) {
          const body = JSON.parse(String(call.init?.body ?? '{}')) as { id: number };
          return jsonRpcOk(body.id, { timestamp: 1_700_000_000_000 });
        }
        return new Response('', { status: 404 });
      }),
    );

    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();

    const result = (await daemon.rpc('send', {
      account: '+14155551234',
      message: 'hello',
      recipient: ['+12125550100'],
    })) as { timestamp?: number } | null;

    expect(result).toEqual({ timestamp: 1_700_000_000_000 });

    const sendCall = captured.find(
      (c) =>
        c.url.endsWith('/api/v1/rpc') &&
        typeof c.init?.body === 'string' &&
        c.init.body.includes('"send"'),
    );
    expect(sendCall).toBeDefined();
    expect(sendCall!.url).toBe('http://127.0.0.1:8080/api/v1/rpc');
    expect(sendCall!.init?.method).toBe('POST');

    const body = JSON.parse(String(sendCall!.init!.body)) as Record<string, unknown>;
    expect(body.jsonrpc).toBe('2.0');
    expect(body.method).toBe('send');
    expect(body.params).toMatchObject({ message: 'hello' });
    expect(typeof body.id).toBe('number');

    await daemon.stop();
  });

  it('rpc() rejects when daemon returns a JSON-RPC error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock(({ url, init }) => {
        if (url.endsWith('/api/v1/check')) return new Response('', { status: 200 });
        const body = JSON.parse(String(init?.body ?? '{}')) as { id: number };
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32601, message: 'method not found' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }),
    );

    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    await daemon.start();
    await expect(daemon.rpc('bogus', {})).rejects.toThrow(/-32601: method not found/);
    await daemon.stop();
  });

  it('polls `receive` over HTTP and dispatches inbound envelopes to handlers', async () => {
    const envelope = {
      envelope: {
        source: '+12125550100',
        timestamp: 1_700_000_000_000,
        dataMessage: { message: 'Test inbound', timestamp: 1_700_000_000_000 },
      },
    };

    let receiveCalls = 0;
    vi.stubGlobal(
      'fetch',
      makeFetchMock(({ url, init }) => {
        if (url.endsWith('/api/v1/check')) return new Response('', { status: 200 });
        const body = JSON.parse(String(init?.body ?? '{}')) as { id: number; method: string };
        if (body.method === 'receive') {
          receiveCalls += 1;
          // First poll returns one envelope; subsequent polls return empty.
          return jsonRpcOk(body.id, receiveCalls === 1 ? [envelope] : []);
        }
        return jsonRpcOk(body.id, null);
      }),
    );

    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    const handler = vi.fn();
    daemon.onMessage(handler);
    await daemon.start();

    // Wait for the ready probe to complete + first poll tick to fire.
    await vi.waitFor(() => expect(handler).toHaveBeenCalled(), { timeout: 2_000 });

    expect(handler.mock.calls[0][0]).toMatchObject({
      envelope: { source: '+12125550100' },
    });

    await daemon.stop();
  });

  it('offMessage removes a handler so it no longer fires', async () => {
    const envelope = {
      envelope: { source: '+12125550100', timestamp: 1, dataMessage: { message: 'x' } },
    };

    vi.stubGlobal(
      'fetch',
      makeFetchMock(({ url, init }) => {
        if (url.endsWith('/api/v1/check')) return new Response('', { status: 200 });
        const body = JSON.parse(String(init?.body ?? '{}')) as { id: number; method: string };
        if (body.method === 'receive') return jsonRpcOk(body.id, [envelope]);
        return jsonRpcOk(body.id, null);
      }),
    );

    const daemon = new SignalDaemon({ phoneNumber: '+14155551234' });
    const handler = vi.fn();
    daemon.onMessage(handler);
    daemon.offMessage(handler);
    await daemon.start();

    // Give the poll loop a moment - if offMessage works, handler still 0.
    await new Promise((r) => setTimeout(r, 200));
    expect(handler).not.toHaveBeenCalled();

    await daemon.stop();
  });
});
