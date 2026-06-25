/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AcpConnection.isSessionReady - unit test (bug S4)
 *
 * `isConnected` is presence-only (child alive), so a spawned-but-dead/hung CLI
 * reads "connected" and the auto-reconnect guard would silently wait on a dead
 * session. `isSessionReady` adds the cheap liveness signals we already track
 * (live child with no exitCode + established session + completed handshake) so
 * the guard reconnects / surfaces an honest error instead of hanging.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import type { ChildProcess } from 'child_process';

vi.mock('child_process', () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock('@process/utils/mainLogger', () => ({
  mainLog: vi.fn(),
  mainWarn: vi.fn(),
}));

vi.mock('@process/utils/shellEnv', () => ({
  getNpxCacheDir: vi.fn(() => '/tmp/npx'),
  getWindowsShellExecutionOptions: vi.fn(() => ({})),
  resolveNpxPath: vi.fn(() => 'npx'),
}));

vi.mock('@process/agent/acp/acpConnectors', () => ({
  ACP_PERF_LOG: false,
  spawnGenericBackend: vi.fn(),
  connectClaude: vi.fn(),
  connectCodebuddy: vi.fn(),
  connectCodex: vi.fn(),
  prepareCleanEnv: vi.fn(async () => ({})),
}));

import { AcpConnection } from '../../src/process/agent/acp/AcpConnection';

function createFakeChild(opts: { killed?: boolean; exitCode?: number | null } = {}): ChildProcess & EventEmitter {
  const emitter = new EventEmitter();
  const child = emitter as unknown as ChildProcess & EventEmitter;
  Object.defineProperty(child, 'killed', { value: opts.killed ?? false, writable: true });
  Object.defineProperty(child, 'exitCode', { value: opts.exitCode ?? null, writable: true });
  child.kill = vi.fn(() => true);
  return child;
}

type AcpConnectionInternal = {
  child: ChildProcess | null;
  sessionId: string | null;
  isInitialized: boolean;
  isSetupComplete: boolean;
};

/** Put the connection into a fully-ready (live working session) state. */
function makeReady(conn: AcpConnection, child: ChildProcess): void {
  const internal = conn as unknown as AcpConnectionInternal;
  internal.child = child;
  internal.sessionId = 'sess-1';
  internal.isInitialized = true;
  internal.isSetupComplete = true;
}

describe('AcpConnection.isSessionReady (S4)', () => {
  let conn: AcpConnection;

  beforeEach(() => {
    vi.clearAllMocks();
    conn = new AcpConnection();
  });

  it('is true only when child is live, session established, and handshake complete', () => {
    makeReady(conn, createFakeChild());
    expect(conn.isSessionReady).toBe(true);
  });

  it('is false for a process that already exited even though a sessionId exists (hung/dead session)', () => {
    // exitCode set => process has exited. isConnected (presence) could still
    // mislead, but isSessionReady must reject it.
    makeReady(conn, createFakeChild({ exitCode: 1 }));
    expect(conn.isSessionReady).toBe(false);
  });

  it('is false for a killed child', () => {
    makeReady(conn, createFakeChild({ killed: true }));
    expect(conn.isSessionReady).toBe(false);
  });

  it('is false when no session id has been established yet', () => {
    const internal = conn as unknown as AcpConnectionInternal;
    makeReady(conn, createFakeChild());
    internal.sessionId = null;
    expect(conn.isSessionReady).toBe(false);
  });

  it('is false when the init/setup handshake has not completed', () => {
    const internal = conn as unknown as AcpConnectionInternal;
    makeReady(conn, createFakeChild());
    internal.isInitialized = false;
    expect(conn.isSessionReady).toBe(false);

    makeReady(conn, createFakeChild());
    internal.isSetupComplete = false;
    expect(conn.isSessionReady).toBe(false);
  });

  it('is false when there is no child at all', () => {
    const internal = conn as unknown as AcpConnectionInternal;
    internal.child = null;
    internal.sessionId = 'sess-1';
    internal.isInitialized = true;
    internal.isSetupComplete = true;
    expect(conn.isSessionReady).toBe(false);
  });
});
