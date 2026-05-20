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
 *  1. `wayland-core`  — primary, written by `prepareWaylandCore.js` and
 *     published by the engine's release workflow.
 *  2. `wcore`         — convenience symlink users may have created.
 */
const BINARY_CANDIDATES: readonly string[] = ['wayland-core', 'wcore'];

function withPlatformExt(name: string): string {
  return process.platform === 'win32' ? `${name}.exe` : name;
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
  // interpreted as shell syntax — `BINARY_CANDIDATES` is compile-time
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
 * Resolve the wayland-core engine binary path.
 * Search order:
 *  1. Bundled with app (production) — tries each `BINARY_CANDIDATES` filename.
 *  2. System PATH — tries each `BINARY_CANDIDATES` name in order.
 */
export function resolveWCoreBinary(): string | null {
  // 1. Bundled binary (production) — same layout as bundled-bun
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (resourcesPath) {
    const runtimeKey = `${process.platform}-${process.arch}`;
    for (const candidate of BINARY_CANDIDATES) {
      const bundled = join(resourcesPath, 'bundled-wayland-core', runtimeKey, withPlatformExt(candidate));
      if (existsSync(bundled)) return bundled;
    }
  }

  // 2. System PATH — try each candidate in priority order.
  for (const candidate of BINARY_CANDIDATES) {
    const found = lookupOnPath(candidate);
    if (found) return found;
  }

  return null;
}

export function isWCoreAvailable(): boolean {
  return resolveWCoreBinary() !== null;
}

/**
 * Detect wayland-core availability and version for settings UI.
 */
export function detectWCore(): {
  available: boolean;
  version?: string;
  path?: string;
} {
  const binaryPath = resolveWCoreBinary();
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

// Internal — exported for tests.
export { BINARY_CANDIDATES, getBinaryName };
