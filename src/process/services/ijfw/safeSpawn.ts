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
 * Test-only: inject a custom resolver. Pass null to restore the default
 * resolution chain. The function is exported with a `__` prefix to make its
 * test-only intent explicit.
 */
export function __setTrustedNpmCliResolver(fn: (() => Promise<string>) | null): void {
  resolverOverride = fn;
  trustedNpmCache = null;
}

async function defaultResolveTrustedNpm(): Promise<string> {
  // SEC-007: resolve via process.execPath sibling, NOT bare PATH.
  const candidates = [
    path.join(
      path.dirname(process.execPath),
      '..',
      'libnode',
      'lib',
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    ),
    '/usr/local/lib/node_modules/npm/bin/npm-cli.js',
    '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js',
  ];
  for (const candidate of candidates) {
    try {
      const real = await fs.promises.realpath(candidate);
      const stat = await fs.promises.lstat(real);
      // Reject world-writable npm CLIs.
      if ((stat.mode & 0o002) !== 0) continue;
      // Reject CLIs owned by anyone other than current uid (where applicable).
      const currentUid = process.getuid?.();
      if (currentUid !== undefined && stat.uid !== currentUid && stat.uid !== 0) continue;
      return real;
    } catch {
      /* try next */
    }
  }
  throw new Error('Could not resolve trusted npm');
}

async function resolveTrustedNpmCli(): Promise<string> {
  if (trustedNpmCache) return trustedNpmCache;
  const resolver = resolverOverride ?? defaultResolveTrustedNpm;
  const resolved = await resolver();
  trustedNpmCache = resolved;
  return resolved;
}

export async function safeSpawn(opts: SafeSpawnOptions): Promise<ChildProcess> {
  let argv0: string;
  let argv: string[];

  if (opts.cmd === 'node') {
    argv0 = process.execPath;
    argv = [...opts.args];
  } else if (opts.cmd === 'npm') {
    const npmCli = await resolveTrustedNpmCli();
    argv0 = process.execPath;
    argv = [npmCli, ...opts.args];
  } else {
    const npmCli = await resolveTrustedNpmCli();
    const npxCli = path.join(path.dirname(npmCli), 'npx-cli.js');
    argv0 = process.execPath;
    argv = [npxCli, ...opts.args];
  }

  const env = buildChildEnv({ ...opts.extraEnv, ELECTRON_RUN_AS_NODE: '1' });

  return spawn(argv0, argv, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: opts.cwd,
    env,
  });
}
