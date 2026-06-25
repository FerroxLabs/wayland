/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// #139: tunnel children must be reaped through the shared cross-platform
// killChild (taskkill /T /F on win32, descendant sweep on POSIX) - a bare
// child.kill() orphans cloudflared/ngrok grandchildren. This suite proves
// stopAllTunnels() routes every tracked child through that helper.

const killChild = vi.fn(async () => undefined);
vi.mock('@process/agent/acp/utils', () => ({
  killChild: (...args: unknown[]) => killChild(...args),
}));

const spawn = vi.fn();
vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => spawn(...args),
}));

vi.mock('@process/channels/tunnel/cloudflaredBinary', () => ({
  ensureCloudflaredBinary: vi.fn(async () => '/usr/bin/cloudflared'),
}));

import { startTunnel, stopAllTunnels } from '@process/channels/tunnel/TunnelManager';

/** A fake spawned child that emits a cloudflared banner so startTunnel resolves. */
function fakeChild(): EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; pid: number } {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    pid: number;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.pid = 4242;
  return child;
}

describe('TunnelManager.stopAllTunnels (#139)', () => {
  beforeEach(() => {
    killChild.mockClear();
    spawn.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reaps each tracked child through the cross-platform killChild with isDetached=false', async () => {
    const child = fakeChild();
    spawn.mockReturnValue(child);

    // cloudflared prints the URL banner to stderr. spawnAndParse attaches its
    // 'data' listener after awaiting ensureCloudflaredBinary, so emit exactly
    // when that listener registers (deterministic, no microtask guesswork).
    child.stderr.once('newListener', (event) => {
      if (event !== 'data') return;
      queueMicrotask(() => {
        child.stderr.emit('data', Buffer.from('Your quick Tunnel: https://abc.trycloudflare.com\n'));
      });
    });

    const handle = await startTunnel({ port: 25808, provider: 'cloudflared' });
    expect(handle.publicUrl).toBe('https://abc.trycloudflare.com');

    await stopAllTunnels();

    expect(killChild).toHaveBeenCalledTimes(1);
    expect(killChild).toHaveBeenCalledWith(child, false);

    // The child is untracked, so a second stop is a no-op.
    await stopAllTunnels();
    expect(killChild).toHaveBeenCalledTimes(1);
  });
});
