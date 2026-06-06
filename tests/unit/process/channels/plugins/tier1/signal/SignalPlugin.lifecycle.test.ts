/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * SignalPlugin lifecycle tests - created → initializing → ready → starting →
 * running → stopping → stopped, plus error paths and daemon auto-restart.
 *
 * child_process.spawn is mocked with a hand-rolled EventEmitter stub so no
 * real process is spawned.
 */

import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist spawn mock ──────────────────────────────────────────────────────────

const { mockSpawn, getLastChild } = vi.hoisted(() => {
  type FakeStream = EventEmitter & { setEncoding: ReturnType<typeof vi.fn>; write: ReturnType<typeof vi.fn> };

  function makeStream(): FakeStream {
    const s = new EventEmitter() as FakeStream;
    s.setEncoding = vi.fn();
    s.write = vi.fn((_data: unknown, cb?: (err?: Error) => void) => { cb?.(); return true; });
    return s;
  }

  type FakeChild = EventEmitter & {
    stdin: FakeStream;
    stdout: FakeStream;
    stderr: FakeStream;
    pid: number;
    killed: boolean;
    kill: ReturnType<typeof vi.fn>;
  };

  let lastChild: FakeChild | null = null;

  const mockSpawn = vi.fn(function (): FakeChild {
    const child = new EventEmitter() as FakeChild;
    child.stdin = makeStream();
    child.stdout = makeStream();
    child.stderr = makeStream();
    child.pid = 12345;
    child.killed = false;
    child.kill = vi.fn((sig: string) => {
      child.killed = true;
      setImmediate(() => child.emit('exit', null, sig ?? 'SIGTERM'));
    });
    lastChild = child;
    return child;
  });

  return {
    mockSpawn,
    getLastChild: () => lastChild,
  };
});

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
  execFile: vi.fn((_f: unknown, _a: unknown, _o: unknown, cb: (err: null, stdout: string, stderr: string) => void) => {
    cb(null, 'signal-cli 0.13.5', '');
  }),
}));

// Mock electron app so resolveSignalCliPath doesn't throw.
vi.mock('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/fake/app', getPath: () => '/fake/userData' },
}));

// Mock fs.existsSync so bundled path check returns false (falls through to PATH).
vi.mock('node:fs', () => ({
  default: { existsSync: vi.fn(() => false) },
  existsSync: vi.fn(() => false),
}));

import type { IChannelPluginConfig } from '@process/channels/types';
import { SignalPlugin } from '@process/channels/plugins/tier1/signal/SignalPlugin';

function makeConfig(overrides: Partial<IChannelPluginConfig['credentials']> = {}): IChannelPluginConfig {
  return {
    id: 'signal_default',
    type: 'signal',
    name: 'Signal',
    enabled: true,
    status: 'created',
    credentials: { phoneNumber: '+14155551234', ...overrides },
    createdAt: 0,
    updatedAt: 0,
  };
}

beforeEach(() => {
  mockSpawn.mockReset();
  mockSpawn.mockImplementation(function () {
    const { EventEmitter: EE } = require('node:events') as typeof import('node:events');
    type FakeStream = EventEmitter & { setEncoding: ReturnType<typeof vi.fn>; write: ReturnType<typeof vi.fn> };
    function makeStream(): FakeStream {
      const s = new EE() as FakeStream;
      s.setEncoding = vi.fn();
      s.write = vi.fn((_d: unknown, cb?: (e?: Error) => void) => { cb?.(); return true; });
      return s;
    }
    const child = new EE() as ReturnType<typeof getLastChild>;
    child!.stdin = makeStream();
    child!.stdout = makeStream();
    child!.stderr = makeStream();
    child!.pid = 12345;
    child!.killed = false;
    child!.kill = vi.fn((sig: string) => {
      child!.killed = true;
      setImmediate(() => child!.emit('exit', null, sig ?? 'SIGTERM'));
    });
    (getLastChild as unknown as { _last: typeof child })._last = child;
    return child;
  });
});

describe('SignalPlugin lifecycle', () => {
  it('starts in created status with no active users and no botInfo', () => {
    const p = new SignalPlugin();
    expect(p.type).toBe('signal');
    expect(p.status).toBe('created');
    expect(p.getActiveUserCount()).toBe(0);
    expect(p.getBotInfo()).toBeNull();
  });

  it('exposes correct capabilities: no edit, no stream, no react (until wired), typing', () => {
    const p = new SignalPlugin();
    expect(p.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      // canReact is intentionally false - reactions aren't wired yet (S-MED-3).
      canReact: false,
      canTypingIndicator: true,
    });
  });

  it('transitions created → initializing → ready on valid credentials', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    expect(p.status).toBe('ready');
    expect(p.getBotInfo()).toMatchObject({ username: '+14155551234' });
  });

  it('throws and transitions to error on missing phone number', async () => {
    const p = new SignalPlugin();
    await expect(p.initialize(makeConfig({ phoneNumber: '' }))).rejects.toThrow(/phone number/i);
    expect(p.status).toBe('error');
  });

  it('throws and transitions to error on non-E.164 phone number', async () => {
    const p = new SignalPlugin();
    await expect(p.initialize(makeConfig({ phoneNumber: '5551234' }))).rejects.toThrow(/E\.164/i);
    expect(p.status).toBe('error');
  });

  it('transitions ready → starting → running on start()', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    expect(p.status).toBe('ready');
    await p.start();
    expect(p.status).toBe('running');
    expect(mockSpawn).toHaveBeenCalled();
    const [, args] = mockSpawn.mock.calls[0] as [string, string[]];
    expect(args).toContain('daemon');
    expect(args).toContain('+14155551234');
    await p.stop();
  });

  it('transitions running → stopping → stopped on stop()', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();
    await p.stop();
    expect(p.status).toBe('stopped');
  });

  it('stop() on an un-started (ready) plugin does not throw and stays ready', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    // BasePlugin.stop() is a no-op when not running/error - matches WhatsApp pattern.
    await expect(p.stop()).resolves.toBeUndefined();
    expect(p.status).toBe('ready');
  });

  it('stop() after start+stop is idempotent (stays stopped)', async () => {
    const p = new SignalPlugin();
    await p.initialize(makeConfig());
    await p.start();
    await p.stop();
    await p.stop(); // second stop - should not throw.
    expect(p.status).toBe('stopped');
  });

  it('passes --http flag with host:port to signal-cli', async () => {
    const p = new SignalPlugin();
    await p.initialize(
      makeConfig({ httpHost: '0.0.0.0', httpPort: 9999 } as Partial<IChannelPluginConfig['credentials']> & Record<string, unknown>),
    );
    await p.start();
    const [, args] = mockSpawn.mock.calls[0] as [string, string[]];
    const httpIdx = args.indexOf('--http');
    expect(httpIdx).toBeGreaterThan(-1);
    expect(args[httpIdx + 1]).toBe('0.0.0.0:9999');
    await p.stop();
  });
});
