/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fail-closed OfficeCLI authority and recovery boundary.
 *
 * Desktop packages an exact native OfficeCLI release asset after verifying its
 * pinned SHA-256. We intentionally do not run the upstream install scripts as a
 * fallback: the tagged scripts currently resolve a moving `latest` binary, so
 * checksum-pinning the script would not pin what ultimately executes.
 *
 * Cowork preview bridges must invoke only the accepted lockstep capability
 * (01-13) at its exact verified executable path. A bare-PATH `officecli`, an
 * npm/global bootstrap, a cache substitution, or any hosted fallback is never
 * resolved. A missing or altered packaged binary is a release defect, never
 * permission to download and execute mutable code at runtime.
 */

import path from 'node:path';
import { getBundledOfficeCliDir } from '@process/utils/shellEnv';

export type InstallStatusEmitter = (payload: {
  state: 'starting' | 'installing' | 'ready' | 'error';
  message?: string;
}) => void;

/**
 * The single user-visible message shown when the verified OfficeCLI runtime is
 * absent or fails its lockstep identity check. Reused by every fail-closed
 * caller so the fallback route surfaces one consistent repair instruction.
 */
export const OFFICECLI_MISSING_RUNTIME_MESSAGE =
  'The verified OfficeCLI runtime is missing; reinstall or update Wayland';

/**
 * Resolve the exact verified OfficeCLI executable from the accepted lockstep
 * capability (01-13). `getBundledOfficeCliDir` re-validates the pinned digest,
 * publisher/contract manifest, symlink-free identity, and root containment on
 * every call, so a missing, replaced, or drifted binary yields no directory and
 * this returns `null`. Callers fail closed on `null`; they never fall back to a
 * bare-PATH `officecli`, an npm/global bootstrap, or a hosted alternative.
 */
export function resolveVerifiedOfficecliCommand(): string | null {
  let bundledDir: string | null = null;
  try {
    bundledDir = getBundledOfficeCliDir();
  } catch {
    return null;
  }
  if (!bundledDir) return null;
  const binaryName = process.platform === 'win32' ? 'officecli.exe' : 'officecli';
  return path.join(bundledDir, binaryName);
}

let failureReported = false;

export async function installOfficecli(emitStatus?: InstallStatusEmitter): Promise<boolean> {
  if (failureReported) return false;
  failureReported = true;

  const message =
    'The verified native OfficeCLI runtime is missing. Reinstall or update Wayland; runtime auto-install is disabled.';
  console.error(`[officecli] ${message}`);
  emitStatus?.({ state: 'error', message });
  return false;
}

/** Test-only: reset the per-session failure notification latch. */
export function _resetOfficecliInstallerForTests(): void {
  failureReported = false;
}
