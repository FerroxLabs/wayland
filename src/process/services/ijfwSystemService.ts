/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * ijfwSystemService — Wave 1 of v0.6.3 IJFW integration.
 *
 * Replaces the v0.6.2 `ijfwAutoInstallService`. Responsibilities:
 *   1. Detect a local IJFW install at `~/.ijfw/mcp-server` (lstat — symlink safe)
 *      and fall back to a PATH probe for CLI-only installs.
 *   2. Resolve the latest `@ijfw/install` version published to npm (via the
 *      Wave 0 `safeSpawn` wrapper — trusted npm CLI, allowlisted env).
 *   3. Bootstrap on first boot when no install is present; upgrade in place
 *      to a `.pending` directory when one is present and out of date.
 *   4. Activate `.pending` on the next boot via the full JSON-RPC envelope
 *      spawn-test (rolls back to `.prev` on failure).
 *   5. Surface install lifecycle via `ipcBridge.ijfw.onStatusChanged`.
 *
 * Decision 1a: we trust the npm OIDC publish chain rather than verifying a
 * (fake) on-the-wire fingerprint. The trust boundary lives at publish time.
 */

import { spawnSync, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import semver from 'semver';
import log from 'electron-log';
import { app } from 'electron';
import { ipcBridge } from '@/common';
import type { IjfwLifecycleStatus, IjfwStatusPayload } from '@/common/adapter/ipcBridge';
import { buildChildEnv } from '@process/services/ijfw/envAllowlist';
import { safeSpawn } from '@process/services/ijfw/safeSpawn';
import { writeAtomic, moveWithExdevFallback, ijfwCacheKey } from '@process/services/ijfw/atomicFile';
import {
  acquireLock,
  releaseLock,
  type LockMetadata,
} from '@process/services/ijfw/installLock';
import {
  applyPreludeForStatus,
  discoverTargets,
  type IjfwStatus as PreludeStatus,
} from '@process/services/ijfw/preludeManager';
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

const HOMEBREW_PATHS = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/home/linuxbrew/.linuxbrew/bin',
];

async function detectLocalInstallImpl(): Promise<IjfwDetectionResult> {
  const home = os.homedir();
  const target = path.join(home, '.ijfw', 'mcp-server');
  const pathProbe = { homebrew: false, usrLocal: false, standardPath: false };

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
      const raw = await fs.promises.readFile(
        path.join(resolvedPath, 'package.json'),
        'utf-8',
      );
      const parsed = JSON.parse(raw) as { version?: unknown };
      const version = typeof parsed.version === 'string' ? parsed.version : undefined;
      return {
        installed: true,
        ...(version ? { version } : {}),
        mcpServerPath: resolvedPath,
        detectedVia: via,
        pathProbe,
      };
    } catch {
      return {
        installed: true,
        mcpServerPath: resolvedPath,
        detectedVia: via,
        pathProbe,
      };
    }
  } catch {
    /* fall through to PATH probe */
  }

  // SEC-006: filtered env, not raw process.env.
  const augmentedPath = [process.env.PATH ?? '', ...HOMEBREW_PATHS].join(path.delimiter);
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  const which = spawnSync(cmd, ['ijfw'], {
    encoding: 'utf-8',
    env: buildChildEnv({ PATH: augmentedPath }),
  });
  if (which.status === 0 && typeof which.stdout === 'string' && which.stdout.trim().length > 0) {
    const resolved = which.stdout.trim().split(/\r?\n/)[0]!;
    pathProbe.homebrew = resolved.includes('homebrew') || resolved.includes('linuxbrew');
    pathProbe.usrLocal = resolved.includes('/usr/local/');
    pathProbe.standardPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .some((p) => p.length > 0 && resolved.startsWith(p));
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
    if (
      typeof parsed.version !== 'string' ||
      typeof parsed.fetchedAt !== 'number' ||
      !semver.valid(parsed.version)
    ) {
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

/** Test-only — clear the latest-version cache. */
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
      // Still actively transitioning — treat as installing for prelude purposes.
      return 'installing';
    case 'not_installed':
    default:
      return 'uninstalled';
  }
}

function getActiveProjectDirs(): string[] {
  // Wave 1 baseline: only the current working directory. Wave 6 will hook
  // into the recent-workspaces store. We never inject markers into foreign
  // files, so this is safe even if the cwd is unrelated (preludeManager
  // returns early for files without the IJFW-PRELUDE-START sentinel).
  return [process.cwd()];
}

async function syncPrelude(status: IjfwLifecycleStatus): Promise<void> {
  try {
    const targets = await discoverTargets(getActiveProjectDirs());
    await applyPreludeForStatus(mapToPreludeStatus(status), targets);
  } catch (err) {
    log.warn('[ijfw] prelude sync failed', { status, err });
  }
}

function emitStatus(payload: IjfwStatusPayload): void {
  try {
    ipcBridge.ijfw.onStatusChanged.emit(payload);
  } catch (err) {
    log.warn('[ijfw] status emit failed', { payload, err });
  }
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
  if (
    local.installed &&
    latest &&
    local.version &&
    semver.valid(local.version) &&
    semver.gte(local.version, latest)
  ) {
    emitStatus({ status: 'installed_current', version: local.version });
    await syncPrelude('installed_current');
    runtimeMode = 'enabled';
    return;
  }

  // Offline but already installed — accept what we have.
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
        args: ['-y', `@ijfw/install@${targetVersion}`],
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
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (err) => {
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
      void (async () => {
        try {
          if (code !== 0) {
            emitStatus({ status: 'install_failed', errorReason: 'install_exit_nonzero', stderr });
            await syncPrelude('install_failed');
            return;
          }
          if (local.installed) {
            // Decision 1a: stage upgrade into .pending — activate next boot.
            try {
              const homeDir = os.homedir();
              await moveWithExdevFallback(
                path.join(homeDir, '.ijfw', 'mcp-server'),
                path.join(homeDir, '.ijfw', 'mcp-server.pending'),
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
    throw NOT_IMPLEMENTED;
  },

  getRuntimeMode(): IjfwRuntimeMode {
    return runtimeMode;
  },
};

/** Test-only — reset module-level state. */
export function __setRuntimeModeForTests(mode: IjfwRuntimeMode): void {
  runtimeMode = mode;
}
