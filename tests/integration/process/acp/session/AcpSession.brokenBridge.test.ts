/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A bunx-spawned ACP bridge whose install is missing a declared dependency.
 *
 * Observed on the owner's machine: `@agentclientprotocol/claude-agent-acp`
 * declares `zod` as a direct dependency, but a partial bunx install left 99
 * packages and no zod on disk. Every launch after that reused the same broken
 * working directory and failed identically, forever, with
 * `Cannot find module 'zod/v4'` on stderr and
 * `Agent disconnected (connection_close, code: null)` in the chat.
 *
 * These tests drive the REAL ProcessAcpClient against REAL child processes so
 * the spawn/exit/abort race that produced that message is exercised, not
 * simulated.
 *
 * The scratch bunx root is reached through a SYMLINK on purpose. bun prints the
 * resolved real path in its module-resolution error (verified: on macOS it
 * prints `/private/var/...` while `os.tmpdir()` returns `/var/...`), so the
 * cleanup's containment guard has to compare resolved paths or it refuses to
 * clear the very directory that is broken.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { RequestError } from '@agentclientprotocol/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AcpClient, ClientFactory } from '@process/acp/infra/IAcpClient';
import { ProcessAcpClient } from '@process/acp/infra/ProcessAcpClient';
import { AcpSession } from '@process/acp/session/AcpSession';
import type { AgentConfig, ProtocolHandlers, SessionCallbacks } from '@process/acp/types';

const PACKAGE_DIR = 'fake-agent-acp@1.0.0';
const SCOPE_DIR = 'bunx-501-@fakescope';

/** Real exit-1 stderr shapes, minus the parts a test must own (the path). */
function moduleNotFoundStderr(entryPath: string): string {
  return `error: Cannot find module 'zod/v4' from '${entryPath}'\n\nBun v1.3.11 (macOS arm64)\n`;
}

function authFailureStderr(): string {
  return 'error: invalid API key: unauthorized. Run `claude login` and try again.\n';
}

type Scratch = {
  /** Path the app sees (a symlink), i.e. what BUN_TMPDIR is set to. */
  linkRoot: string;
  /** Path bun prints (the resolved real path). */
  realRoot: string;
  /** The versioned bunx working dir that cleanup is expected to remove. */
  installDir: string;
  /** The module inside installDir that bun names in the error. */
  entryPath: string;
  cleanup: () => void;
};

function makeScratch(): Scratch {
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wl-broken-bridge-')));
  const target = path.join(base, 'real');
  fs.mkdirSync(target, { recursive: true });
  const linkRoot = path.join(base, 'link');
  fs.symlinkSync(target, linkRoot, 'dir');

  const installDir = path.join(target, SCOPE_DIR, PACKAGE_DIR);
  const entryDir = path.join(installDir, 'node_modules', '@fakescope', 'sdk', 'dist', 'schema');
  fs.mkdirSync(entryDir, { recursive: true });
  const entryPath = path.join(entryDir, 'zod.gen.js');
  fs.writeFileSync(entryPath, '// partial install: zod is absent\n');

  return {
    linkRoot,
    realRoot: target,
    installDir,
    entryPath,
    cleanup: () => fs.rmSync(base, { recursive: true, force: true }),
  };
}

/** Spawns a real node process that reproduces one bridge failure shape. */
function spawnFailingBridge(stderrText: string): ChildProcess {
  return spawn(process.execPath, ['-e', `process.stderr.write(${JSON.stringify(stderrText)}); process.exit(1);`], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

function createCallbacks(errors: string[]): SessionCallbacks {
  return {
    onMessage: vi.fn(),
    onSessionId: vi.fn(),
    onStatusChange: vi.fn(),
    onConfigUpdate: vi.fn(),
    onModelUpdate: vi.fn(),
    onModeUpdate: vi.fn(),
    onContextUsage: vi.fn(),
    onPermissionRequest: vi.fn(),
    onSignal: vi.fn((event) => {
      if (event.type === 'error') errors.push(event.message);
    }),
  } as unknown as SessionCallbacks;
}

const baseConfig: AgentConfig = {
  agentBackend: 'claude',
  agentSource: 'builtin',
  agentId: 'builtin:claude',
  cwd: os.tmpdir(),
};

/** ClientFactory building the real ProcessAcpClient over a counted spawn. */
function countingFactory(makeChild: () => ChildProcess): { factory: ClientFactory; spawns: () => number } {
  let count = 0;
  const factory: ClientFactory = {
    create: (config: AgentConfig, handlers: ProtocolHandlers): AcpClient =>
      new ProcessAcpClient(
        async () => {
          count += 1;
          return makeChild();
        },
        { backend: config.agentBackend, handlers }
      ),
  };
  return { factory, spawns: () => count };
}

describe('broken bunx bridge install', () => {
  let scratch: Scratch;
  let prevBunTmpdir: string | undefined;
  let prevBunCache: string | undefined;

  beforeEach(() => {
    scratch = makeScratch();
    prevBunTmpdir = process.env.BUN_TMPDIR;
    prevBunCache = process.env.BUN_INSTALL_CACHE_DIR;
    // The app only ever sees the symlinked path; bun reports the resolved one.
    process.env.BUN_TMPDIR = scratch.linkRoot;
    process.env.BUN_INSTALL_CACHE_DIR = path.join(scratch.linkRoot, 'install-cache');
  });

  afterEach(() => {
    if (prevBunTmpdir === undefined) delete process.env.BUN_TMPDIR;
    else process.env.BUN_TMPDIR = prevBunTmpdir;
    if (prevBunCache === undefined) delete process.env.BUN_INSTALL_CACHE_DIR;
    else process.env.BUN_INSTALL_CACHE_DIR = prevBunCache;
    scratch.cleanup();
  });

  it('clears the broken install and retries the spawn exactly once', async () => {
    const errors: string[] = [];
    const { factory, spawns } = countingFactory(() => spawnFailingBridge(moduleNotFoundStderr(scratch.entryPath)));
    const session = new AcpSession(baseConfig, factory, createCallbacks(errors));

    expect(fs.existsSync(scratch.installDir)).toBe(true);

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('error'), { timeout: 25_000, interval: 50 });

    // The half-installed working directory must be gone, so the next launch
    // re-installs instead of re-reading the same missing dependency.
    expect(fs.existsSync(scratch.installDir)).toBe(false);
    // One recovery attempt, then stop: the original spawn plus exactly one retry.
    expect(spawns()).toBe(2);
  }, 30_000);

  it('does not treat an authentication failure as a broken install', async () => {
    const errors: string[] = [];
    const { factory } = countingFactory(() => spawnFailingBridge(authFailureStderr()));
    const session = new AcpSession(baseConfig, factory, createCallbacks(errors));

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('error'), { timeout: 25_000, interval: 50 });

    // Nothing on disk is broken, so nothing on disk may be deleted.
    expect(fs.existsSync(scratch.installDir)).toBe(true);
    const last = errors[errors.length - 1] ?? '';
    expect(last.toLowerCase()).not.toContain('install');
  }, 30_000);

  it('does not retry a clean protocol-level rejection', async () => {
    let spawnCount = 0;
    // A bridge that speaks ACP correctly and rejects session/new with a
    // non-retryable JSON-RPC error. Modelled at the client seam so the
    // rejection is protocol-level, not a process crash.
    const factory: ClientFactory = {
      create: (): AcpClient => {
        spawnCount += 1;
        return {
          start: vi.fn().mockResolvedValue({ protocolVersion: 1, agentCapabilities: {} }),
          createSession: vi.fn().mockRejectedValue(new RequestError(-32602, 'Invalid params')),
          loadSession: vi.fn(),
          prompt: vi.fn(),
          cancel: vi.fn(),
          setModel: vi.fn(),
          setMode: vi.fn(),
          setConfigOption: vi.fn(),
          closeSession: vi.fn(),
          extMethod: vi.fn(),
          authenticate: vi.fn(),
          lifecycleSnapshot: { pid: null, running: false, lastExit: null },
          onDisconnect: vi.fn(),
          close: vi.fn().mockResolvedValue(undefined),
        } as unknown as AcpClient;
      },
    };
    const errors: string[] = [];
    const session = new AcpSession(baseConfig, factory, createCallbacks(errors));

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('error'), { timeout: 10_000, interval: 25 });

    expect(spawnCount).toBe(1);
    expect(fs.existsSync(scratch.installDir)).toBe(true);
  }, 15_000);

  it('names the situation once recovery has failed', async () => {
    const errors: string[] = [];
    const { factory } = countingFactory(() => spawnFailingBridge(moduleNotFoundStderr(scratch.entryPath)));
    const session = new AcpSession(baseConfig, factory, createCallbacks(errors));

    session.start();
    await vi.waitFor(() => expect(session.status).toBe('error'), { timeout: 25_000, interval: 50 });

    const message = errors[errors.length - 1] ?? '';

    // Says what happened, in the user's terms.
    expect(message.toLowerCase()).toContain('claude');
    expect(message.toLowerCase()).toMatch(/install/);
    // Not the raw failure the owner was shown.
    expect(message).not.toContain('zod/v4');
    expect(message).not.toContain('Cannot find module');
    expect(message).not.toContain('connection_close');
    // House style for user-visible copy.
    expect(message).not.toContain('—');
    expect(message.toLowerCase()).not.toContain('unknown');
    expect(message).not.toMatch(/\b[a-z]+\.[a-z_]+\.[a-z_]+\b/);
  }, 30_000);
});
