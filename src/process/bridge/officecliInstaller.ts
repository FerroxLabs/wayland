/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Fail-closed OfficeCLI recovery boundary.
 *
 * Desktop packages an exact native OfficeCLI release asset after verifying its
 * pinned SHA-256. We intentionally do not run the upstream install scripts as a
 * fallback: the tagged scripts currently resolve a moving `latest` binary, so
 * checksum-pinning the script would not pin what ultimately executes.
 *
 * The legacy function name remains while preview bridges migrate to a richer
 * capability/recovery surface. A missing packaged binary is a release defect,
 * never permission to download and execute mutable code at runtime.
 */

export type InstallStatusEmitter = (payload: {
  state: 'starting' | 'installing' | 'ready' | 'error';
  message?: string;
}) => void;

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
