/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Config-integrity Doctor checks.
 *
 * Two failure classes this catches:
 *  1. No OS secret-store backend (`safeStorage` unavailable). On a headless
 *     Linux host without libsecret the app falls back to a weaker file-key
 *     backend — credentials still persist, but the user should know the keychain
 *     is not in use (the headless-encrypt class).
 *  2. The engine's user `config.toml` is corrupt / unparseable. The engine reads
 *     it live; a parse failure breaks every WCore chat. A missing file is fine
 *     (a fresh install has none).
 */

import type { DoctorCheckOutcome } from '../types';

/** Config check dependencies — all injectable so the checks are unit-testable. */
export type ConfigCheckDeps = {
  /** True when an OS keychain-backed secret store is available. */
  isEncryptionAvailable: () => boolean;
  /**
   * Read + parse the engine's user `config.toml`. Resolves `'ok'` (parsed or
   * absent), or `'corrupt'` with the parse error message. Never throws.
   */
  readEngineConfig: () => Promise<{ status: 'ok'; existed: boolean } | { status: 'corrupt'; message: string }>;
};

/**
 * Secret storage — the OS keychain is available so credentials are stored at
 * full strength. WARN (not FAIL) when only the file-key fallback is available:
 * credentials still persist, but at a weaker strength the user should know about.
 */
export async function checkSecretStorage(isEncryptionAvailable: () => boolean): Promise<DoctorCheckOutcome> {
  if (isEncryptionAvailable()) {
    return { status: 'pass', detail: 'OS keychain (safeStorage) is available for credential encryption.' };
  }
  return {
    status: 'warn',
    detail: 'No OS keychain available — credentials fall back to a weaker file-key store.',
    remediation: 'On Linux, install libsecret + a running secret service (gnome-keyring / KWallet) for keychain-strength storage.',
  };
}

/**
 * Engine config integrity — the user `config.toml` parses. FAIL when it exists
 * but is corrupt; PASS when it parses or is absent (a fresh install).
 */
export async function checkEngineConfigIntegrity(
  readEngineConfig: ConfigCheckDeps['readEngineConfig']
): Promise<DoctorCheckOutcome> {
  const result = await readEngineConfig();
  if (result.status === 'corrupt') {
    return {
      status: 'fail',
      detail: `The engine's config.toml could not be parsed: ${result.message}`,
      remediation: 'Fix the TOML syntax in the engine config.toml, or remove the file to regenerate defaults.',
    };
  }
  return {
    status: 'pass',
    detail: result.existed ? 'Engine config.toml parses cleanly.' : 'No engine config.toml yet (fresh install) — defaults apply.',
  };
}
