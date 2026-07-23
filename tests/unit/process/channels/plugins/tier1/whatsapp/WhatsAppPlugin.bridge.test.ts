/**
 * @license
 * Copyright 2025 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Exercises the JSON-RPC bridge plumbing without spawning a real subprocess.
 * `child_process.spawn` is hoist-mocked to return a fake ChildProcess whose
 * stdin captures the frames the plugin writes, and whose stdout is a
 * controllable EventEmitter the test feeds with response frames. (#890 migrated
 * the bridge off `child_process.fork` onto `spawn` via `resolveJsRuntime()`.)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig, IUnifiedIncomingMessage } from '@process/channels/types';

// Hoist the spy so vi.mock's factory can reference it (factory runs before
// imports - referencing the `events` module here triggers a TDZ hoist error
// for the auto-generated `__vi_import_*` binding. Use a minimal hand-rolled
// emitter stub instead.
const { spawnSpy, fakeChild, stdinWrites } = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  function makeEmitter(): {
    on: (event: string, cb: Listener) => unknown;
    once: (event: string, cb: Listener) => unknown;
    off: (event: string, cb: Listener) => unknown;
    emit: (event: string, ...args: unknown[]) => boolean;
  } {
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

  const stdinWrites: string[] = [];
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
  const child = Object.assign(makeEmitter(), {
    stdout,
    stdin,
    kill: (_sig?: string) => undefined,
  });
  return {
    spawnSpy: vi.fn(() => child),
    fakeChild: child,
    stdinWrites,
  };
});

vi.mock('child_process', () => ({
  spawn: spawnSpy,
  ChildProcess: class {},
}));

// #890: forkBridge now resolves a real JS runtime before spawning. Pin it so
// the test never touches platform-service internals and the spawn command is
// deterministic.
vi.mock('@process/utils/jsRuntime', () => ({
  resolveJsRuntime: () => ({ command: 'node', env: {}, kind: 'bundled-bun' }),
}));

// WhatsAppPlugin imports `electron` to detect packaged vs dev for bridge path
// resolution. Vitest unit tests don't run inside Electron, so stub it.
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/test/app' },
}));

import { WhatsAppPlugin } from '@process/channels/plugins/tier1/whatsapp/WhatsAppPlugin';

function configFor(backend: string, extra: Record<string, string> = {}): IChannelPluginConfig {
  return {
    id: 'whatsapp_default',
    type: 'whatsapp',
    name: 'WhatsApp',
    enabled: true,
    status: 'created',
    createdAt: 0,
    updatedAt: 0,
    credentials: { backend, ...extra },
  };
}

/**
 * Feed a JSON-RPC frame to the plugin via the fake child stdout.
 */
function emitFromBridge(frame: object): void {
  fakeChild.stdout.emit('data', `${JSON.stringify(frame)}\n`);
}

function lastRpc(): { id: number; method: string; params: Record<string, unknown> } {
  const frame = stdinWrites[stdinWrites.length - 1]!.trim();
  return JSON.parse(frame) as { id: number; method: string; params: Record<string, unknown> };
}

describe('WhatsAppPlugin - bridge JSON-RPC plumbing', () => {
  beforeEach(() => {
    spawnSpy.mockClear();
    stdinWrites.length = 0;
  });

  it('spawns bridge.js with the --backend flag chosen at initialize', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    expect(spawnSpy).toHaveBeenCalledTimes(1);
    // #890: spawn(command, [entry, ...flags], opts). command is the resolved
    // runtime; argv[0] is the bridge entry. Normalize separators: prod builds
    // the entry with path.join, which emits backslashes on win32.
    const [command, argv] = spawnSpy.mock.calls[0]!;
    expect(command).toBe('node');
    expect(String(argv[0]).replace(/\\/g, '/')).toMatch(/whatsapp-bridge\/bridge\.js$/);
    expect(argv.slice(1)).toEqual(['--backend', 'baileys']);
  });

  it('spawns with --backend whatsapp-web when configured', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('whatsapp-web'));
    const [, argv] = spawnSpy.mock.calls[0]!;
    expect(argv.slice(1)).toEqual(['--backend', 'whatsapp-web']);
  });

  it('serializes sendText as a JSON-RPC request and resolves on the matching response', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));

    // First RPC after initialize will be `connect` from onStart; skip start() in
    // this test and call sendMessage directly to keep the assertion focused on
    // request shape + response correlation.
    const pending = plugin.sendMessage('15551234567@s.whatsapp.net', {
      type: 'text',
      text: 'hello world',
    });
    const req = lastRpc();
    expect(req.jsonrpc).toBe('2.0');
    expect(req.method).toBe('sendText');
    expect(req.params).toEqual({ chatId: '15551234567@s.whatsapp.net', text: 'hello world' });
    expect(typeof req.id).toBe('number');

    emitFromBridge({ jsonrpc: '2.0', id: req.id, result: { messageId: 'WA_001' } });
    await expect(pending).resolves.toBe('WA_001');
  });

  it('rejects when the bridge returns a JSON-RPC error frame', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const pending = plugin.sendMessage('chat@x', { type: 'text', text: 'boom' });
    const req = lastRpc();
    emitFromBridge({
      jsonrpc: '2.0',
      id: req.id,
      error: { code: -32000, message: 'whatsapp_not_connected' },
    });
    await expect(pending).rejects.toThrow(/whatsapp_not_connected/);
  });

  it('routes inbound.message notifications through messageHandler with unified shape', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const received: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: {
        messageId: 'WA_in_1',
        chatId: '15551234567@s.whatsapp.net',
        senderId: '15551234567@s.whatsapp.net',
        senderName: 'Alice',
        isGroup: false,
        fromMe: false,
        body: 'hi from phone',
        timestamp: 1_700_000_000,
      },
    });
    // emitMessage is async - yield once.
    await new Promise((resolve) => setImmediate(resolve));
    expect(received).toHaveLength(1);
    const msg = received[0]!;
    expect(msg.id).toBe('WA_in_1');
    expect(msg.platform).toBe('whatsapp');
    expect(msg.chatId).toBe('15551234567@s.whatsapp.net');
    expect(msg.user.displayName).toBe('Alice');
    expect(msg.content.text).toBe('hi from phone');
    expect(plugin.getActiveUserCount()).toBe(1);
  });

  it('ignores fromMe echoes to avoid feedback loops', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const received: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'inbound.message',
      params: {
        messageId: 'WA_in_self',
        chatId: 'me@s.whatsapp.net',
        senderId: 'me@s.whatsapp.net',
        fromMe: true,
        body: 'self echo',
      },
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(received).toHaveLength(0);
  });

  it('captures pairing QR strings from qr.update notifications', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    expect(plugin.getQrCode()).toBeNull();
    emitFromBridge({
      jsonrpc: '2.0',
      method: 'qr.update',
      params: { qr: '2@abc/def==,xyz' },
    });
    expect(plugin.getQrCode()).toBe('2@abc/def==,xyz');
  });

  it('rejects unsupported backend names at initialize', async () => {
    const plugin = new WhatsAppPlugin();
    await expect(plugin.initialize(configFor('signal'))).rejects.toThrow(/Unsupported WhatsApp backend/);
  });

  it('throws on editMessage - WhatsApp has no edit primitive on any backend', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    await expect(plugin.editMessage('chat@x', 'WA_001', { type: 'text', text: 'edited' })).rejects.toThrow(
      /does not support editing/
    );
  });
});

describe('WhatsAppPlugin - stdout pollution tolerance (#890)', () => {
  beforeEach(() => {
    spawnSpy.mockClear();
    stdinWrites.length = 0;
  });

  it('drops non-frame pollution without throwing, and still dispatches a valid frame', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const pending = plugin.sendMessage('chat@x', { type: 'text', text: 'hi' });
    const req = lastRpc();

    // Interleave the kinds of pollution a leak could put on the stdout pipe:
    // app log lines, a stray pino NDJSON object, and JSON primitives (a bare
    // number/bool must not throw on `'id' in parsed`). None may throw.
    expect(() => {
      fakeChild.stdout.emit('data', '[Wayland:init] booting\n');
      fakeChild.stdout.emit('data', '{"level":30,"time":1,"msg":"baileys warn"}\n');
      fakeChild.stdout.emit('data', '5\n');
      fakeChild.stdout.emit('data', 'true\n');
      fakeChild.stdout.emit('data', 'not json at all\n');
      fakeChild.stdout.emit('data', '[]\n');
    }).not.toThrow();

    emitFromBridge({ jsonrpc: '2.0', id: req.id, result: { messageId: 'WA_OK' } });
    await expect(pending).resolves.toBe('WA_OK');
  });

  it('reassembles a valid frame split across two stdout chunks', async () => {
    const plugin = new WhatsAppPlugin();
    await plugin.initialize(configFor('baileys'));
    const pending = plugin.sendMessage('chat@y', { type: 'text', text: 'split' });
    const req = lastRpc();
    const frame = JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { messageId: 'WA_SPLIT' } });
    const mid = Math.floor(frame.length / 2);
    fakeChild.stdout.emit('data', frame.slice(0, mid));
    fakeChild.stdout.emit('data', `${frame.slice(mid)}\n`);
    await expect(pending).resolves.toBe('WA_SPLIT');
  });
});
