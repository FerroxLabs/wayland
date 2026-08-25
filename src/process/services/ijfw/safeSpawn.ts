/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW safe spawn wrapper - the ONLY entry point under
 * src/process/services/ijfw/** that may import child_process. Resolves npm/npx
 * via trusted paths instead of bare PATH lookup (SEC-007), and forwards a
 * filtered child env via buildChildEnv (R-P04).
 */

import { spawn, type ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildChildEnv } from './envAllowlist';
import { resolveSafeSpawnCwd } from '@process/utils/safeSpawnCwd';
import { resolveJsRuntime } from '@process/utils/jsRuntime';

export type Cmd = 'npm' | 'npx' | 'node';

export interface SafeSpawnOptions {
  cmd: Cmd;
  args: string[];
  extraEnv?: Record<string, string>;
  cwd?: string;
}

let trustedNpmCache: string | null = null;
let resolverOverride: (() => Promise<string>) | null = null;

/**
 * Build the ordered list of candidate npm-cli.js paths to probe, given a
 * platform and environment. Pure (no filesystem access) so it can be unit
 * tested. The actual trust validation (ownership / world-writable checks)
 * happens in defaultResolveTrustedNpm against the resolved real paths.
 *
 * On Windows, npm ships as the `npm.cmd` shim colocated with `node.exe` and
 * `node_modules\npm\bin\npm-cli.js`. We therefore derive `npm-cli.js` from
 * every directory on PATH that could host a Node install (covers the Node MSI,
 * nvm-windows, fnm, volta, scoop and Chocolatey layouts) in addition to the
 * well-known fixed install locations.
 */
export function __buildNpmCliCandidates(platform: NodeJS.Platform, env: NodeJS.ProcessEnv, execPath: string): string[] {
  if (platform === 'win32') {
    // Use path.win32 explicitly so candidate construction is correct (and unit
    // testable) regardless of the host OS the resolver/test runs on.
    const win = path.win32;
    const candidates: string[] = [];
    const pushNpmCli = (nodeDir: string) => {
      if (!nodeDir) return;
      candidates.push(win.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'));
    };

    // Electron's process.execPath is the app .exe, but keep this for the rare
    // case where a real node.exe is the host process.
    pushNpmCli(win.dirname(execPath));
    // User-global npm install (npm install -g npm).
    candidates.push(win.join(env['APPDATA'] ?? '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js'));
    // System-wide Node.js installer default.
    pushNpmCli('C:\\Program Files\\nodejs');
    pushNpmCli('C:\\Program Files (x86)\\nodejs');

    // where()-style resolution: derive npm-cli.js from any PATH directory that
    // hosts a Node install (i.e. one that ships an npm.cmd/node.exe shim). This
    // covers version managers (nvm-windows, fnm, volta) and scoop/choco shims.
    const pathDirs = (env['PATH'] ?? env['Path'] ?? '').split(win.delimiter).filter(Boolean);
    for (const dir of pathDirs) {
      pushNpmCli(dir);
    }
    // De-duplicate while preserving order.
    return [...new Set(candidates)];
  }

  return [
    path.join(path.dirname(execPath), '..', 'libnode', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    '/usr/local/lib/node_modules/npm/bin/npm-cli.js',
    '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js',
  ];
}

/**
 * Test-only: inject a custom resolver. Pass null to restore the default
 * resolution chain. The function is exported with a `__` prefix to make its
 * test-only intent explicit.
 */
export function __setTrustedNpmCliResolver(fn: (() => Promise<string>) | null): void {
  resolverOverride = fn;
  trustedNpmCache = null;
}

/**
 * Decide whether a resolved npm-cli.js is trustworthy by its stat.
 *
 * The POSIX world-writable + ownership checks are meaningless on Windows: NTFS
 * does not express these bits, so Node reports a normal file under
 * `C:\Program Files\nodejs` as world-writable (mode `0o666`) and `getuid()` is
 * `undefined`. Applying them there rejects every valid system npm and breaks the
 * IJFW update check (#261). On Windows the trust anchor is instead the candidate
 * origin (system install dirs / a Node dir on PATH) built by
 * `__buildNpmCliCandidates`, so accept any path that resolves there.
 */
export function __isAcceptableNpmStat(
  stat: { mode: number; uid?: number },
  platform: NodeJS.Platform,
  currentUid: number | undefined
): boolean {
  if (platform === 'win32') return true;
  // Reject world-writable npm CLIs.
  if ((stat.mode & 0o002) !== 0) return false;
  // Reject CLIs owned by anyone other than current uid (where applicable).
  if (currentUid !== undefined && stat.uid !== currentUid && stat.uid !== 0) return false;
  return true;
}

export async function defaultResolveTrustedNpm(): Promise<string> {
  // SEC-007: resolve via known install locations + PATH-derived Node dirs,
  // NOT a bare PATH lookup of an arbitrary `npm` binary.
  const candidates = __buildNpmCliCandidates(process.platform, process.env, process.execPath);
  const rejected: Array<{ candidate: string; reason: string }> = [];
  for (const candidate of candidates) {
    try {
      const real = await fs.promises.realpath(candidate);
      const stat = await fs.promises.lstat(real);
      if (!__isAcceptableNpmStat(stat, process.platform, process.getuid?.())) {
        rejected.push({ candidate: real, reason: 'failed trust check (world-writable / foreign owner)' });
        continue;
      }
      return real;
    } catch (err) {
      rejected.push({ candidate, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  // Enumerate every tried candidate + rejection reason so a failed resolution is
  // diagnosable from the logs instead of a bare "Could not resolve". (#261)
  const detail = rejected.map((r) => `  - ${r.candidate}: ${r.reason}`).join('\n');
  throw new Error(`Could not resolve trusted npm (platform=${process.platform}). Tried:\n${detail}`);
}

async function resolveTrustedNpmCli(): Promise<string> {
  if (trustedNpmCache) return trustedNpmCache;
  const resolver = resolverOverride ?? defaultResolveTrustedNpm;
  const resolved = await resolver();
  trustedNpmCache = resolved;
  return resolved;
}

/**
 * Keep the bundled Bun's whole file-operation chain out of the OS temp dir
 * (#928).
 *
 * In a packaged Windows build the IJFW child is `bun.exe npm-cli.js ...`.
 * Windows Defender actively scans %TEMP%, so bun's rename of its staged files
 * fails with EPERM (NtSetInformationFile). `acpConnectors.ts` already fixed
 * this for the ACP spawn site by redirecting BUN_INSTALL_CACHE_DIR, BUN_TMPDIR
 * and - because bunx builds its working directory under the OS TMP/TEMP, so the
 * SOURCE of the move is otherwise still scanned - TMP/TEMP as well. `safeSpawn`
 * is the second bun spawn site and never got that redirect.
 *
 * TMP/TEMP are overridden on win32 only: the AV lock is Windows-only, and on
 * POSIX repointing them would change npm's staging for no benefit.
 *
 * A redirect to a directory that does not exist is WORSE than no redirect -
 * npm's own `os.tmpdir()` staging would then ENOENT - so the directories are
 * created first and the whole redirect is dropped if creation fails.
 */
export function __buildBunSandboxEnv(platform: NodeJS.Platform, baseDir: string): Record<string, string> {
  const cacheDir = path.join(baseDir, 'bun-cache');
  const tmpDir = path.join(baseDir, 'bun-tmp');
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  } catch {
    return {};
  }
  const env: Record<string, string> = { BUN_INSTALL_CACHE_DIR: cacheDir, BUN_TMPDIR: tmpDir };
  if (platform === 'win32') {
    env.TMP = tmpDir;
    env.TEMP = tmpDir;
  }
  return env;
}

export async function safeSpawn(opts: SafeSpawnOptions): Promise<ChildProcess> {
  let argv0: string;
  let argv: string[];

  // #706: packaged (fused) builds ignore ELECTRON_RUN_AS_NODE, so the app binary
  // can no longer stand in for Node. Resolve a real runtime (bundled Bun when
  // packaged; the app binary as Node in dev). The trusted npm-cli.js resolution
  // (SEC-007) is unchanged — only the interpreter running it changes, and Bun
  // ships inside the signed bundle.
  const runtime = resolveJsRuntime();

  if (opts.cmd === 'node') {
    argv0 = runtime.command;
    argv = [...opts.args];
  } else if (opts.cmd === 'npm') {
    const npmCli = await resolveTrustedNpmCli();
    argv0 = runtime.command;
    argv = [npmCli, ...opts.args];
  } else {
    const npmCli = await resolveTrustedNpmCli();
    const npxCli = path.join(path.dirname(npmCli), 'npx-cli.js');
    argv0 = runtime.command;
    argv = [npxCli, ...opts.args];
  }

  // The bun sandbox always lives under userData, even when the caller pinned a
  // different cwd - it is where the runtime writes, not where the command runs.
  const userDataDir = resolveSafeSpawnCwd();
  const env = buildChildEnv({
    ...__buildBunSandboxEnv(process.platform, userDataDir),
    ...opts.extraEnv,
    ...runtime.env,
  });

  return spawn(argv0, argv, {
    stdio: ['pipe', 'pipe', 'pipe'],
    // #755: never inherit the parent's cwd - in forked workers it is
    // app.asar.unpacked, and npm/npx treat cwd as a project root (package.json
    // discovery, potential node_modules writes) which must never point inside
    // the signed bundle.
    cwd: opts.cwd ?? userDataDir,
    env,
  });
}
