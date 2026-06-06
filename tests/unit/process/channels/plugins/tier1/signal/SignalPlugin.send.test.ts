/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalPlugin.send - sendMessage dispatches the correct RPC params and
 * returns a stable message id (timestamp string).  Multi-chunk sends are
 * tested too.
 *
 * Transport changed from stdio → HTTP (audit HIGH 4 2026-05-18); these tests
 * mock `fetch` rather than child.stdin.
 */

import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist spawn mock ──────────────────────────────────────────────────────────

const { mockSpawn } = vi.hoisted(() => {
  type FakeStream = EventEmitter & { setEncoding: ReturnType<typeof vi.fn> };

  function makeStream(): FakeStream {
    const s = new EventEmitter() as FakeStream;
    s.setEncoding = vi.fn();
    return s;
  }

  type Child = EventEmitter & {
    stdout: FakeStream;
    stderr: FakeStream;
    pid: number;
    killed: boolean;
    kill: ReturnType<typeof vi.fn>;
  };

  const mockSpawn = vi.fn(function (): Child {
    const child = new EventEmitter() as Child;
    child.stdout = makeStream();
    child.stderr = makeStream();
    child.pid = 99;
    child.killed = false;
    child.kill = vi.fn((sig: string) => {
      child.killed = true;
      setImmediate(() => child.emit('exit', null, sig ?? 'SIGTERM'));
    });
    return child;
  });

  return { mockSpawn };
});

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
  execFile: vi.fn((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
    cb(null, 'signal-cli 0.13.5', '');
  }),
}));

vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/fake/app', getPath: () => '/fake/userData' },
}));

vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn(() => false) },
  existsSync: vi.fn(() => false),
}));

import type { IChannelPluginConfig } from '@process/channels/types';
import { SignalPlugin } from '@process/channels/plugins/tier1/signal/SignalPlugin';

// ── fetch mock ───────────────────────────────────────────────────────────────

type RpcCall = { method: string; params: Record<string, unknown>; id: number };
let rpcCalls: RpcCall[] = [];

function installFetchMock(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/api/v1/check')) {
        return new Response('', { status: 200 });
      }
      if (url.endsWith('/api/v1/rpc')) {
        const body = JSON.parse(String(init?.body ?? '{}')) as RpcCall;
        if (body.method === 'send') rpcCalls.push(body);
        // Receive polls get empty list; send gets timestamp.
        const result = body.method === 'receive' ? [] : { timestamp: 1_700_000_001_000 };
        return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('', { status: 404 });
    }),
  );
}

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'signal_default',
    type: 'signal',
    name: 'Signal',
    enabled: true,
    status: 'created',
    credentials: { phoneNumber: '+14155551234' },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  mockSpawn.mockClear();
  rpcCalls = [];
  installFetchMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SignalPlugin.sendMessage', () => {
  it('returns the daemon timestamp as message id for a short message', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();

    const id = await p.sendMessage('+12125550100', { type: 'text', text: 'Hello' });
    expect(id).toBe('1700000001000');

    await p.stop();
  });

  it('sends to recipient array for E.164 chatId', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();

    await p.sendMessage('+12125550100', { type: 'text', text: 'Hello' });

    expect(rpcCalls.length).toBeGreaterThanOrEqual(1);
    const send = rpcCalls[0];
    expect(send.method).toBe('send');
    expect((send.params as { recipient?: string[] }).recipient).toEqual(['+12125550100']);
    expect((send.params as { message: string }).message).toBe('Hello');

    await p.stop();
  });

  it('sends to groupId field for group: chatId', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();

    await p.sendMessage('group:abc123==', { type: 'text', text: 'Group msg' });

    expect(rpcCalls.length).toBeGreaterThanOrEqual(1);
    const send = rpcCalls[0];
    expect((send.params as { groupId?: string }).groupId).toBe('abc123==');
    expect((send.params as { recipient?: string[] }).recipient).toBeUndefined();

    await p.stop();
  });

  it('throws when message body is empty', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();

    await expect(p.sendMessage('+12125550100', { type: 'text', text: '' })).rejects.toThrow(/empty/i);

    await p.stop();
  });

  it('sends multiple RPC frames for long text (chunking)', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();

    // Build a text that is just over 2× the chunk limit so it splits into 3.
    const longText = ('word ').repeat(900).trim(); // ~4500 chars
    await p.sendMessage('+12125550100', { type: 'text', text: longText });

    // At least 2 send RPC posts expected (text was chunked).
    expect(rpcCalls.length).toBeGreaterThanOrEqual(2);

    await p.stop();
  });

  it('throws when daemon is not running', async () => {
    const p = new SignalPlugin();
    await expect(p.sendMessage('+12125550100', { type: 'text', text: 'hi' })).rejects.toThrow(/daemon/i);
  });
});
