/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Binary names to look for, in priority order:
 *  1. `wayland-nano`  - primary, written by `prepareWaylandNano.js` and
 *     published by the agent's release workflow.
 *  2. `wnano`         - convenience symlink users may have created.
 */
const BINARY_CANDIDATES: readonly string[] = ['wayland-nano', 'wnano'];

/**
 * Subdirectory under `userData` where an in-app agent updater would install a
 * newer wayland-nano, by runtime key (`<platform>-<arch>`). Checked BEFORE the
 * bundled binary so a user-accepted update supersedes the version shipped with
 * the app. Mirrors `WCORE_OVERRIDE_SUBDIR` in the wcore resolver.
 */
export const WNANO_OVERRIDE_SUBDIR = 'wayland-nano-overrides';

function withPlatformExt(name: string): string {
  return process.platform === 'win32' ? `${name}.exe` : name;
}

/**
 * The user-data override dir (`<userData>/wayland-nano-overrides`), or `null`
 * when Electron's `app` is unavailable (e.g. unit tests). Lazily `require`d so
 * importing this module outside Electron (test runner) never throws.
 */
function userDataOverrideDir(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    const electron = require('electron') as { app?: { getPath?: (n: string) => string } };
    const dir = electron.app?.getPath?.('userData');
    return dir ? join(dir, WNANO_OVERRIDE_SUBDIR) : null;
  } catch {
    return null;
  }
}

/**
 * Primary binary name (used for the bundled-resource lookup filename).
 * Iteration over `BINARY_CANDIDATES` happens at the call site for the
 * bundled and PATH searches.
 */
function getBinaryName(): string {
  return withPlatformExt(BINARY_CANDIDATES[0]);
}

function lookupOnPath(name: string): string | null {
  // Use execFileSync (no shell) so the binary-name candidate cannot be
  // interpreted as shell syntax - `BINARY_CANDIDATES` is compile-time
  // constant today but defensive coding prevents future drift.
  const finder = process.platform === 'win32' ? 'where' : 'which';
  try {
    const result = execFileSync(finder, [name], { encoding: 'utf-8', timeout: 5000 }).trim();
    if (result && existsSync(result)) return result;
  } catch {
    // not found in PATH
  }
  return null;
}

/**
 * Resolve the wayland-nano agent binary path.
 * Search order:
 *  0. User-installed override (in-app update) under userData.
 *  1. Bundled with app (production resourcesPath) - tries each `BINARY_CANDIDATES` filename.
 *  2. Project-root resources/bundled-wayland-nano/ (dev mode) - mirrors the
 *     wcore resolution so `bun start` finds the same binary the packaged
 *     build does.
 *  3. System PATH - tries each `BINARY_CANDIDATES` name in order.
 */
export function resolveWNanoBinary(): string | null {
  const runtimeKey = `${process.platform}-${process.arch}`;

  // 0. User-installed override (in-app agent update) - checked FIRST so an
  //    accepted update supersedes the bundled binary without a full app update.
  const overrideDir = userDataOverrideDir();
  if (overrideDir) {
    for (const candidate of BINARY_CANDIDATES) {
      const override = join(overrideDir, runtimeKey, withPlatformExt(candidate));
      if (existsSync(override)) return override;
    }
  }

  // 1. Bundled binary (production) - same layout as bundled-wayland-core
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (resourcesPath) {
    for (const candidate of BINARY_CANDIDATES) {
      const bundled = join(resourcesPath, 'bundled-wayland-nano', runtimeKey, withPlatformExt(candidate));
      if (existsSync(bundled)) return bundled;
    }
  }

  // 2. Dev-mode project-root fallback. In dev, `process.resourcesPath` points
  //    at Electron's own resources dir, not ours - so step 1 misses our
  //    prepared binary. Check project-root resources/ directly.
  for (const candidate of BINARY_CANDIDATES) {
    const devBundled = join(process.cwd(), 'resources', 'bundled-wayland-nano', runtimeKey, withPlatformExt(candidate));
    if (existsSync(devBundled)) return devBundled;
  }

  // 3. System PATH - try each candidate in priority order.
  for (const candidate of BINARY_CANDIDATES) {
    const found = lookupOnPath(candidate);
    if (found) return found;
  }

  return null;
}

export function isWNanoAvailable(): boolean {
  return resolveWNanoBinary() !== null;
}

/**
 * Detect wayland-nano availability and version for settings UI.
 */
export function detectWNano(): {
  available: boolean;
  version?: string;
  path?: string;
} {
  const binaryPath = resolveWNanoBinary();
  if (!binaryPath) return { available: false };

  try {
    const version = execFileSync(binaryPath, ['--version'], {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    return { available: true, version, path: binaryPath };
  } catch {
    return { available: true, path: binaryPath };
  }
}

// Internal - exported for tests.
export { BINARY_CANDIDATES, getBinaryName };
