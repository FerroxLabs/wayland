/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { cpSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Shims the headless payload cannot boot without.
 *
 * getManagedOfficeCliShimDir() (src/process/utils/shellEnv.ts) is a FAIL-CLOSED
 * guard: with the directory absent it throws "Wayland managed OfficeCLI fallback
 * guard is unavailable", and the npm launcher runs the server with cwd = payload
 * (installer/bin/wayland.mjs), so the guard resolves payload/resources/managed-cli-shims.
 * The desktop gets these via electron-builder extraResources; the payload has to
 * copy them itself. It never did, so every chat failed on a fresh headless npm
 * install from 0.12.13 through 0.13.1 (#1316).
 */
export const REQUIRED_SHIMS = ['officecli', 'officecli.cmd'];

/**
 * Copy the managed OfficeCLI shims into the payload, preserving the executable
 * bit the guard checks. Throws with an actionable message rather than producing
 * a payload that boots into a broken state.
 */
export function stageManagedCliShims(appDir, payloadDir) {
  const src = join(appDir, 'resources', 'managed-cli-shims');
  const dst = join(payloadDir, 'resources', 'managed-cli-shims');
  if (!existsSync(src)) {
    throw new Error(`managed OfficeCLI shims missing in source: ${src}`);
  }
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst, { recursive: true, preserveTimestamps: true });
  for (const name of REQUIRED_SHIMS) {
    const shipped = join(dst, name);
    if (!existsSync(shipped)) {
      throw new Error(`managed OfficeCLI shim not copied into the payload: ${name}`);
    }
    // The POSIX shim is rejected by the runtime guard without its executable
    // bit; the .cmd one is launched by cmd.exe and does not carry one.
    // NTFS has no POSIX mode bits, so a Windows build host cannot express or
    // observe this - asserting it there fails every time and proves nothing.
    // The payload that ships to POSIX users is built on POSIX.
    if (process.platform !== 'win32' && name !== 'officecli.cmd' && (statSync(shipped).mode & 0o111) === 0) {
      throw new Error(`managed OfficeCLI shim lost its executable bit in the payload: ${name}`);
    }
  }
  return dst;
}
