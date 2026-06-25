/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * ijfwSystemService - Wave 1 of v0.6.3 IJFW integration.
 *
 * Replaces the v0.6.2 `ijfwAutoInstallService`. Responsibilities:
 *   1. Detect a local IJFW install at `~/.ijfw/mcp-server` (lstat - symlink safe)
 *      and fall back to a PATH probe for CLI-only installs.
 *   2. Resolve the latest `@ijfw/install` version published to npm (via the
 *      Wave 0 `safeSpawn` wrapper - trusted npm CLI, allowlisted env).
 *   3. Bootstrap on first boot when no install is present; upgrade in place
 *      to a `.pending` directory when one is present and out of date.
 *   4. Activate `.pending` on the next boot via the full JSON-RPC envelope
 *      spawn-test (rolls back to `.prev` on failure).
 *   5. Surface install lifecycle via `ipcBridge.ijfw.onStatusChanged`.
 *
 * Decision 1a: we trust the npm OIDC publish chain rather than verifying a
 * (fake) on-the-wire fingerprint. The trust boundary lives at publish time.
 */

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import semver from 'semver';
import log from 'electron-log';
import { app } from 'electron';
import { ipcBridge } from '@/common';
import type { IjfwLifecycleStatus, IjfwStatusPayload } from '@/common/adapter/ipcBridge';
import type { IjfwErrorReason } from '@/common/types/ijfw';
import { buildChildEnv } from '@process/services/ijfw/envAllowlist';
import { safeSpawn } from '@process/services/ijfw/safeSpawn';
import { writeAtomic, moveWithExdevFallback, ijfwCacheKey } from '@process/services/ijfw/atomicFile';
import { acquireLock, releaseLock, type LockMetadata } from '@process/services/ijfw/installLock';
import {
  applyPreludeForStatus,
  discoverTargets,
  type IjfwStatus as PreludeStatus,
} from '@process/services/ijfw/preludeManager';
import { watchInstallRoot } from '@process/services/ijfw/healthCheck';
import { resolveEntry } from '@process/services/ijfw/entryResolver';
import { encode, decode } from '@process/services/ijfw/mcpWireProtocol';
import { jsonRpcResponseSchema } from '@process/services/ijfw/ipcSchemas';
import { ijfwMcpClient } from '@process/services/ijfw/ijfwMcpClient';
import { agentRegistry } from '@process/agent/AgentRegistry';
import { ProcessConfig } from '@process/utils/initStorage';

export type IjfwRuntimeMode = 'disabled' | 'enabled' | 'pending_activation';

export type IjfwDetectionResult = {
  installed: boolean;
  version?: string;
  mcpServerPath?: string;
  cliOnPath?: boolean;
  detectedVia: 'directory' | 'symlink' | 'cli' | 'none';
  pathProbe: {
    homebrew: boolean;
    usrLocal: boolean;
    standardPath: boolean;
  };
};

const NOT_IMPLEMENTED = new Error('ijfwSystemService: method not implemented yet (Wave 1 shell)');

let runtimeMode: IjfwRuntimeMode = 'disabled';

const HOMEBREW_PATHS = ['/opt/homebrew/bin', '/usr/local/bin', '/home/linuxbrew/.linuxbrew/bin'];

async function detectLocalInstallImpl(): Promise<IjfwDetectionResult> {
  const home = os.homedir();
  const target = path.join(home, '.ijfw', 'mcp-server');
  const pathProbe = { homebrew: false, usrLocal: false, standardPath: false };

  // SEC-006: filtered env, not raw process.env. Run PATH probe unconditionally
  // so directory/symlink installs also populate cliOnPath (fixes #179).
  const augmentedPath = [process.env.PATH ?? '', ...HOMEBREW_PATHS].join(path.delimiter);
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const which = spawnSync(cmd, ['ijfw'], {
    encoding: 'utf-8',
    env: buildChildEnv({ PATH: augmentedPath }),
  });
  let cliOnPath: boolean | undefined;
  if (which.status === 0 && typeof which.stdout === 'string' && which.stdout.trim().length > 0) {
    const resolved = which.stdout.trim().split(/\r?\n/)[0]!;
    pathProbe.homebrew = resolved.includes('homebrew') || resolved.includes('linuxbrew');
    pathProbe.usrLocal = resolved.includes('/usr/local/');
    pathProbe.standardPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .some((p) => p.length > 0 && resolved.startsWith(p));
    cliOnPath = true;
  }

  try {
    const stat = await fs.promises.lstat(target);
    let resolvedPath = target;
    let via: 'symlink' | 'directory' = 'directory';
    if (stat.isSymbolicLink()) {
      resolvedPath = await fs.promises.realpath(target);
      via = 'symlink';
    } else if (!stat.isDirectory()) {
      // Treat unknown filesystem object as not installed and fall through.
      throw new Error('not a directory or symlink');
    }
    try {
      const raw = await fs.promises.readFile(path.join(resolvedPath, 'package.json'), 'utf-8');
      const parsed = JSON.parse(raw) as { version?: unknown };
      const version = typeof parsed.version === 'string' ? parsed.version : undefined;
      return {
        installed: true,
        ...(version ? { version } : {}),
        mcpServerPath: resolvedPath,
        ...(cliOnPath !== undefined ? { cliOnPath } : {}),
        detectedVia: via,
        pathProbe,
      };
    } catch {
      return {
        installed: true,
        mcpServerPath: resolvedPath,
        ...(cliOnPath !== undefined ? { cliOnPath } : {}),
        detectedVia: via,
        pathProbe,
      };
    }
  } catch {
    /* fall through - no directory/symlink install found */
  }

  if (cliOnPath) {
    return {
      installed: true,
      cliOnPath: true,
      detectedVia: 'cli',
      pathProbe,
    };
  }
  return { installed: false, detectedVia: 'none', pathProbe };
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type LatestCache = { version: string; fetchedAt: number };
let inMemoryCache: LatestCache | null = null;

function cachePath(): string {
  return path.join(app.getPath('userData'), `ijfw-latest-cache-${ijfwCacheKey()}.json`);
}

async function readCache(): Promise<LatestCache | null> {
  if (inMemoryCache) return inMemoryCache;
  try {
    const raw = await fs.promises.readFile(cachePath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LatestCache>;
    if (typeof parsed.version !== 'string' || typeof parsed.fetchedAt !== 'number' || !semver.valid(parsed.version)) {
      return null;
    }
    inMemoryCache = { version: parsed.version, fetchedAt: parsed.fetchedAt };
    return inMemoryCache;
  } catch {
    return null;
  }
}

async function writeCache(version: string): Promise<void> {
  const entry: LatestCache = { version, fetchedAt: Date.now() };
  inMemoryCache = entry;
  try {
    await writeAtomic(cachePath(), JSON.stringify(entry));
  } catch (err) {
    log.warn('[ijfw] failed to write latest-version cache', { err });
  }
}

async function getLatestPublishedImpl(): Promise<string | null> {
  const cached = await readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.version;
  }

  let child: ChildProcess;
  try {
    child = await safeSpawn({
      cmd: 'npm',
      args: ['view', '@ijfw/install', 'version'],
    });
  } catch (err) {
    log.warn('[ijfw] safeSpawn(npm view) failed', { err });
    return cached ? cached.version : null;
  }

  return new Promise<string | null>((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const settle = (value: string | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      log.warn('[ijfw] npm view error', { err });
      settle(cached ? cached.version : null);
    });
    child.on('exit', (code) => {
      void (async () => {
        if (code !== 0) {
          log.info('[ijfw] npm view non-zero exit', { code, stderr });
          settle(cached ? cached.version : null);
          return;
        }
        const trimmed = stdout.trim();
        if (!semver.valid(trimmed)) {
          log.warn('[ijfw] npm view returned non-semver', { trimmed });
          settle(cached ? cached.version : null);
          return;
        }
        await writeCache(trimmed);
        settle(trimmed);
      })();
    });
  });
}

/** Test-only - clear the latest-version cache. */
export function __resetCacheForTests(): void {
  inMemoryCache = null;
}

/** Map our bootstrap lifecycle status onto the prelude-manager union. */
function mapToPreludeStatus(status: IjfwLifecycleStatus): PreludeStatus {
  switch (status) {
    case 'installed_current':
      return 'installed_current';
    case 'installing':
    case 'upgrading':
      return 'installing';
    case 'install_failed':
      return 'install_failed';
    case 'installed_pending_activation':
      // Still actively transitioning - treat as installing for prelude purposes.
      return 'installing';
    case 'not_installed':
    default:
      return 'uninstalled';
  }
}

// Gemini B2: when the Wayland app is launched from a macOS GUI Dock click,
// `process.cwd()` is `/`. The previous baseline (`return [process.cwd()]`)
// fed `/` into `discoverTargets()` which recursively walks the tree looking
// for marker files - guaranteed OOM / hang on the root filesystem.
//
// Hard guard: refuse any path that is the filesystem root, the user's bare
// HOME directory, or a well-known system path. The empty list is a safe
// no-op for preludeManager (it just won't manage any files this session).
// Wave 6.4 will wire the recent-workspaces store so users see managed files
// for every tracked project, not just whatever cwd happens to be.
const UNSAFE_PROJECT_ROOTS: readonly string[] = [
  '/',
  '/etc',
  '/var',
  '/usr',
  '/bin',
  '/sbin',
  '/opt',
  '/private',
  '/System',
  '/Library',
  '/Applications',
  '/tmp',
  '/dev',
  '/proc',
  '/sys',
  // Windows roots - normalized to lowercase below for cross-platform compare.
  'c:\\',
  'c:\\windows',
  'c:\\program files',
  'c:\\program files (x86)',
];

function isUnsafeProjectRoot(dir: string): boolean {
  if (!dir) return true;
  // Filesystem root on POSIX.
  if (dir === '/' || dir === path.parse(dir).root) return true;
  // Bare HOME - too broad; would walk every dotfile dir.
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  if (home && dir === home) return true;
  // Hard-coded system paths.
  const norm = process.platform === 'win32' ? dir.toLowerCase() : dir;
  for (const unsafe of UNSAFE_PROJECT_ROOTS) {
    const target = process.platform === 'win32' ? unsafe.toLowerCase() : unsafe;
    if (norm === target) return true;
  }
  return false;
}

export function getActiveProjectDirs(): string[] {
  // Wave 1 baseline: only the current working directory. Wave 6.4 will hook
  // into the recent-workspaces store. We never inject markers into foreign
  // files, so this is safe even if the cwd is unrelated (preludeManager
  // returns early for files without the IJFW-PRELUDE-START sentinel) -
  // BUT discoverTargets() still has to walk the tree before that filter runs,
  // so we must never hand it `/` or `$HOME`. See Gemini B2.
  const cwd = process.cwd();
  if (isUnsafeProjectRoot(cwd)) {
    log.warn('[ijfw] cwd is unsafe project root - refusing to scan', { cwd });
    return [];
  }
  return [cwd];
}

async function syncPrelude(status: IjfwLifecycleStatus): Promise<void> {
  try {
    const targets = await discoverTargets(getActiveProjectDirs());
    await applyPreludeForStatus(mapToPreludeStatus(status), targets);
  } catch (err) {
    log.warn('[ijfw] prelude sync failed', { status, err });
  }
}

let __lastStatus: IjfwStatusPayload | null = null;

/**
 * Returns the count of detected CLIs known to IJFW, excluding Wayland Core
 * itself (id 'wcore'). The registry may not be initialized on first cold boot;
 * in that case `getDetectedAgents()` returns an empty array and we return 0.
 */
function getDetectedCliCount(): number {
  const agents = agentRegistry.getDetectedAgents();
  return Math.max(0, agents.filter((a) => a.id !== 'wcore').length);
}

function emitStatus(payload: IjfwStatusPayload): void {
  const enriched: IjfwStatusPayload = { ...payload, cliCount: getDetectedCliCount() };
  __lastStatus = enriched;
  try {
    ipcBridge.ijfw.onStatusChanged.emit(enriched);
  } catch (err) {
    log.warn('[ijfw] status emit failed', { payload: enriched, err });
  }
}

/** Latest emitted status - used by `ijfwBridge.getStatus`. */
export function getLastStatus(): IjfwStatusPayload | null {
  return __lastStatus;
}

async function readSkipSetupSetting(): Promise<boolean> {
  try {
    const v = (await ProcessConfig.get('ijfw.skipSetup')) as unknown;
    return v === true || v === 'true' || v === 1 || v === '1';
  } catch {
    return false;
  }
}

async function bootstrapImpl(): Promise<void> {
  if (process.env.IJFW_AUTO_INSTALL === 'never' || (await readSkipSetupSetting())) {
    emitStatus({ status: 'not_installed', reason: 'opt_out' });
    await syncPrelude('not_installed');
    return;
  }

  const local = await detectLocalInstallImpl();
  const latest = await getLatestPublishedImpl();

  // Already current.
  if (local.installed && latest && local.version && semver.valid(local.version) && semver.gte(local.version, latest)) {
    emitStatus({ status: 'installed_current', version: local.version });
    await syncPrelude('installed_current');
    runtimeMode = 'enabled';
    return;
  }

  // Offline but already installed - accept what we have.
  if (local.installed && !latest) {
    const payload: IjfwStatusPayload = { status: 'installed_current', offline: true };
    if (local.version) payload.version = local.version;
    emitStatus(payload);
    await syncPrelude('installed_current');
    runtimeMode = 'enabled';
    return;
  }

  const lock = await acquireLock();
  if (!lock.acquired) {
    log.info('[ijfw] install already running by pid', lock.holderPid);
    return;
  }
  const lockHandle: LockMetadata = lock.handle!;

  try {
    const targetVersion = latest ?? '1.5.4';
    if (!semver.valid(targetVersion)) {
      emitStatus({ status: 'install_failed', errorReason: 'invalid_target_version' });
      await releaseLock(lockHandle);
      return;
    }

    const action: IjfwLifecycleStatus = local.installed ? 'upgrading' : 'installing';
    emitStatus({ status: action, version: targetVersion });
    await syncPrelude(action);

    let child: ChildProcess;
    try {
      child = await safeSpawn({
        cmd: 'npx',
        // The published `@ijfw/install` package exposes three bins (`ijfw`,
        // `ijfw-install`, `ijfw-uninstall`) and none matches the unscoped
        // package name, so a bare `npx @ijfw/install` fails with "could not
        // determine executable to run". Name the bin explicitly via --package,
        // and pass --yes so the installer runs non-interactively under our
        // piped stdio (otherwise it can block on a prompt).
        args: ['-y', '--package', `@ijfw/install@${targetVersion}`, 'ijfw-install', '--yes'],
      });
    } catch (err) {
      log.error('[ijfw] safeSpawn(npx install) failed', { err });
      emitStatus({
        status: 'install_failed',
        errorReason: 'spawn_error',
        stderr: err instanceof Error ? err.message : String(err),
      });
      await syncPrelude('install_failed');
      await releaseLock(lockHandle);
      return;
    }

    let stderr = '';
    // Checkpoint B H1: Node child_process can fire BOTH `error` and `exit`
    // for a single failed child. Without a latch we emit install_failed twice,
    // release the lock twice, and (worst case) call agentRegistry.refreshAll
    // after we already emitted install_failed. Mirrors spawnTestVerify's
    // existing `settled` pattern.
    let settled = false;
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      log.error('[ijfw] install child error', { err });
      emitStatus({
        status: 'install_failed',
        errorReason: 'spawn_error',
        stderr: err.message,
      });
      void syncPrelude('install_failed');
      void releaseLock(lockHandle);
    });
    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      void (async () => {
        try {
          if (code !== 0) {
            emitStatus({ status: 'install_failed', errorReason: 'install_exit_nonzero', stderr });
            await syncPrelude('install_failed');
            return;
          }
          if (local.installed) {
            // Decision 1a: stage upgrade into .pending - activate next boot.
            try {
              const homeDir = os.homedir();
              await moveWithExdevFallback(
                path.join(homeDir, '.ijfw', 'mcp-server'),
                path.join(homeDir, '.ijfw', 'mcp-server.pending')
              );
            } catch (err) {
              log.error('[ijfw] failed to stage upgrade to .pending', { err });
              emitStatus({
                status: 'install_failed',
                errorReason: 'stage_pending_failed',
                stderr: err instanceof Error ? err.message : String(err),
              });
              await syncPrelude('install_failed');
              return;
            }
            emitStatus({ status: 'installed_pending_activation', version: targetVersion });
            runtimeMode = 'pending_activation';
            // Keep the prelude in 'installing' state until activation.
          } else {
            try {
              await agentRegistry.refreshAll();
            } catch (err) {
              log.warn('[ijfw] agentRegistry.refreshAll failed post-install', { err });
            }
            emitStatus({ status: 'installed_current', version: targetVersion });
            await syncPrelude('installed_current');
            runtimeMode = 'enabled';
          }
        } finally {
          await releaseLock(lockHandle);
        }
      })();
    });
  } catch (err) {
    await releaseLock(lockHandle);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// applyPendingUpgrade - boot-time activation of a .pending tree
// ---------------------------------------------------------------------------

async function isSafelyOwned(p: string): Promise<boolean> {
  let stat: fs.Stats;
  try {
    stat = await fs.promises.lstat(p);
  } catch {
    return false;
  }
  // Symlink/junction rejection is cross-platform and is the load-bearing check:
  // a reparse point at this path is a symlink-escape vector on every OS. NTFS
  // junctions are creatable without elevation and report isSymbolicLink()=true,
  // so enforcing this on Windows too closes the bypass where a planted
  // `.ijfw/mcp-server.pending` junction would otherwise be activated unchecked.
  if (stat.isSymbolicLink()) return false;
  // The POSIX uid/world-writable checks have no NTFS-ACL equivalent exposed by
  // fs.Stats, so they are enforced only where meaningful. Windows relies on the
  // symlink rejection above (the actual escape vector) - not a blanket bypass.
  if (process.platform === 'win32') return true;
  const uid = process.getuid?.() ?? -1;
  if (uid >= 0 && stat.uid !== uid) return false;
  return (stat.mode & 0o002) === 0;
}

async function retryOnEbusy<T>(op: () => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EBUSY' && code !== 'EPERM') throw err;
      await new Promise((r) => setTimeout(r, 100 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('EBUSY retry exhausted');
}

/** SEC-003: full JSON-RPC envelope verify with exit-before-success = fail. */
async function spawnTestVerify(mcpServerDir: string): Promise<boolean> {
  let entry: string;
  try {
    entry = await resolveEntry(mcpServerDir);
  } catch (err) {
    log.warn('[ijfw] spawnTestVerify - resolveEntry failed', { err });
    return false;
  }

  return new Promise<boolean>((resolve) => {
    let child: ChildProcess;
    try {
      child = spawn(process.execPath, [entry], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: buildChildEnv({ ELECTRON_RUN_AS_NODE: '1' }),
      });
    } catch (err) {
      log.warn('[ijfw] spawnTestVerify - spawn threw', { err });
      resolve(false);
      return;
    }

    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      clearTimeout(timeout);
      resolve(value);
    };

    const timeout = setTimeout(() => settle(false), 5000);
    let buf: Buffer = Buffer.alloc(0);

    child.stdout?.on('data', (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      try {
        const { messages, remainder } = decode(buf);
        buf = remainder as Buffer;
        for (const msg of messages) {
          const parsed = jsonRpcResponseSchema.safeParse(msg);
          if (!parsed.success) continue;
          if (parsed.data.id !== 1) continue;
          if (parsed.data.error) {
            settle(false);
            return;
          }
          const result = parsed.data.result as { tools?: Array<{ name?: string }> } | undefined;
          // Verify the spawned MCP server identifies as IJFW by exposing at least
          // one tool in the `ijfw_` namespace. Live verification against IJFW v1.5.0
          // showed the install exposes 13 tools (ijfw_memory_recall, ijfw_run, ijfw_state, …)
          // and no single canonical tool we could hard-pin to. Checking for the
          // namespace prefix is robust to tool inventory drift across IJFW versions.
          if (
            result &&
            Array.isArray(result.tools) &&
            result.tools.some((t) => typeof t.name === 'string' && t.name.startsWith('ijfw_'))
          ) {
            settle(true);
            return;
          }
        }
      } catch (err) {
        log.warn('[ijfw] spawnTestVerify decode error', { err });
        settle(false);
      }
    });
    child.on('error', () => settle(false));
    // SEC-003: exit before success = failure.
    child.on('exit', () => settle(false));

    try {
      child.stdin?.write(encode({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }));
    } catch (err) {
      log.warn('[ijfw] spawnTestVerify stdin.write failed', { err });
      settle(false);
    }
  });
}

async function applyPendingUpgradeImpl(): Promise<void> {
  const home = os.homedir();
  const current = path.join(home, '.ijfw', 'mcp-server');
  const pending = path.join(home, '.ijfw', 'mcp-server.pending');
  const previous = path.join(home, '.ijfw', 'mcp-server.prev');

  // Wave 7 H2: every install_failed exit MUST sync the prelude so the on-disk
  // `~/.ijfw/PRELUDE` marker matches the emitted status. Without this, the
  // prelude stays in `installing` / `upgrading` state after a failed upgrade
  // and the next boot reads a stale optimistic state. Helper centralizes the
  // emit+sync so it can't be forgotten at any failure exit.
  const failWithReason = async (errorReason: IjfwErrorReason, stderr?: string): Promise<void> => {
    const payload: IjfwStatusPayload = stderr
      ? { status: 'install_failed', errorReason, stderr }
      : { status: 'install_failed', errorReason };
    emitStatus(payload);
    await syncPrelude('install_failed');
  };

  try {
    await fs.promises.stat(pending);
  } catch {
    return;
  }

  // Checkpoint B B2: serialize activation with the same lockfile bootstrap
  // uses. Without this, two concurrent boots race the move-current-to-prev
  // → move-pending-to-current sequence and corrupt the install tree.
  const lock = await acquireLock();
  if (!lock.acquired) {
    log.info('[ijfw] applyPendingUpgrade - install already running by pid', lock.holderPid);
    return;
  }
  const lockHandle: LockMetadata = lock.handle!;

  try {
    // SEC-010: ownership check before activation.
    if (!(await isSafelyOwned(pending)) || !(await isSafelyOwned(path.dirname(pending)))) {
      log.error('[ijfw] pending tree not safely owned - refusing to activate');
      await failWithReason('unsafe_ownership');
      return;
    }

    try {
      await ijfwMcpClient.shutdown();
    } catch (err) {
      log.warn('[ijfw] mcp shutdown threw', { err });
    }
    const drained = await ijfwMcpClient.waitForExit(10_000);
    if (!drained) {
      log.warn('[ijfw] MCP client did not exit cleanly - deferring upgrade');
      return;
    }

    // Stage swap with Windows EBUSY retry (F-B03).
    try {
      await retryOnEbusy(async () => {
        try {
          await fs.promises.rm(previous, { recursive: true, force: true });
        } catch {
          /* ignore - previous may not exist */
        }
        try {
          await moveWithExdevFallback(current, previous);
        } catch (err) {
          log.warn('[ijfw] preserve-previous failed', { err });
        }
        await moveWithExdevFallback(pending, current);
      });
    } catch (err) {
      log.error('[ijfw] staged swap failed', { err });
      await failWithReason('stage_swap_failed', err instanceof Error ? err.message : String(err));
      return;
    }

    // Checkpoint B H4: TOCTOU defense. Between the ownership check on
    // `pending` (above) and the rename, a local attacker who controls
    // `~/.ijfw/` could swap `pending` for a symlink. After the rename,
    // `current` would then point at attacker-controlled content and
    // `spawnTestVerify` would read attacker-controlled package.json. Re-stat
    // `current` after the rename and require: not a symlink, is a directory,
    // owned by us. On failure: attempt rollback and emit unsafe_ownership.
    if (!(await isSafelyOwned(current))) {
      log.error('[ijfw] post-swap ownership re-check failed - refusing to verify');
      try {
        await retryOnEbusy(async () => {
          await fs.promises.rm(current, { recursive: true, force: true });
          try {
            await moveWithExdevFallback(previous, current);
          } catch (rollbackErr) {
            log.error('[ijfw] rollback after unsafe-ownership re-check failed', {
              err: rollbackErr,
            });
          }
        });
      } catch (err) {
        log.error('[ijfw] rollback retry exhausted after unsafe-ownership re-check', {
          err,
        });
      }
      await failWithReason('unsafe_ownership');
      return;
    }

    const newOk = await spawnTestVerify(current);
    if (newOk) {
      emitStatus({ status: 'installed_current' });
      runtimeMode = 'enabled';
      await syncPrelude('installed_current');
      try {
        await agentRegistry.refreshAll();
      } catch (err) {
        log.warn('[ijfw] agentRegistry.refreshAll failed post-activation', { err });
      }
      return;
    }

    log.warn('[ijfw] new version failed spawn-test - rolling back');
    try {
      await retryOnEbusy(async () => {
        await fs.promises.rm(current, { recursive: true, force: true });
        try {
          await moveWithExdevFallback(previous, current);
        } catch (err) {
          log.error('[ijfw] rollback move failed', { err });
          throw err;
        }
      });
    } catch (err) {
      await failWithReason('upgrade_failed_no_rollback', err instanceof Error ? err.message : String(err));
      return;
    }

    const rollbackOk = await spawnTestVerify(current);
    if (!rollbackOk) {
      await failWithReason('rollback_also_failed');
    } else {
      await failWithReason('upgrade_failed_rolled_back');
    }
  } finally {
    await releaseLock(lockHandle);
  }
}

export const ijfwSystemService = {
  async detectLocalInstall(): Promise<IjfwDetectionResult> {
    return detectLocalInstallImpl();
  },

  async getLatestPublished(): Promise<string | null> {
    return getLatestPublishedImpl();
  },

  async bootstrap(): Promise<void> {
    return bootstrapImpl();
  },

  async applyPendingUpgrade(): Promise<void> {
    return applyPendingUpgradeImpl();
  },

  getRuntimeMode(): IjfwRuntimeMode {
    return runtimeMode;
  },

  /**
   * Subscribe to ~/.ijfw filesystem changes. When the mcp-server tree
   * disappears (user-driven rm, background uninstall, AV quarantine), shut
   * down the MCP client and emit `not_installed` so downstream UI surfaces
   * react. Returns a disposer.
   */
  startHealthWatcher(): () => void {
    return startHealthWatcherImpl();
  },
};

let lastEmittedAbsent = false;

function startHealthWatcherImpl(): () => void {
  // Initialize the debounce flag to the inverse of current state so the very
  // first absent-event triggers an emit even if we boot into a no-install.
  lastEmittedAbsent = false;
  const dispose = watchInstallRoot((exists) => {
    if (!exists) {
      if (lastEmittedAbsent) return;
      lastEmittedAbsent = true;
      void (async () => {
        try {
          await ijfwMcpClient.shutdown();
        } catch (err) {
          log.warn('[ijfw] mcp shutdown on health-watcher absent failed', { err });
        }
        emitStatus({ status: 'not_installed', reason: 'install_removed' });
        runtimeMode = 'disabled';
        await syncPrelude('not_installed');
      })();
    } else {
      lastEmittedAbsent = false;
    }
  });
  return dispose;
}

/** Test-only - reset module-level state. */
export function __setRuntimeModeForTests(mode: IjfwRuntimeMode): void {
  runtimeMode = mode;
}
