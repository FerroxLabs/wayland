/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Config-integrity Doctor checks.
 *
 * The failure class this catches: no OS secret-store backend (`safeStorage`
 * unavailable). On a headless Linux host without libsecret the app falls back
 * to a weaker file-key backend — credentials still persist, but the user
 * should know the keychain is not in use (the headless-encrypt class).
 */

import type { DoctorCheckOutcome } from '../types';

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
    remediation:
      'On Linux, install libsecret + a running secret service (gnome-keyring / KWallet) for keychain-strength storage.',
  };
}

/** Dependencies for {@link checkConfigPaths} — the two resolved config dirs. */
export type ConfigPathsDeps = {
  /** The desktop app config directory (`getConfigPath()` → `.../Wayland/config`). */
  appConfigDir: () => string;
  /** The bundled engine's home directory (`$FUIGO_HOME`). */
  engineConfigDir: () => string;
};

/**
 * Config locations — surface the TWO distinct config directories the app uses so
 * the "which config is live / why didn't my setting take / where is my config"
 * confusion is visible: the desktop app config dir (providers, channels, OAuth)
 * and the SEPARATE engine home. Informational — always PASS,
 * with both resolved paths in the detail (uninstalling deletes neither, so a
 * stale config can survive a reinstall).
 */
export async function checkConfigPaths(deps: ConfigPathsDeps): Promise<DoctorCheckOutcome> {
  const appDir = deps.appConfigDir();
  const engineDir = deps.engineConfigDir();
  return {
    status: 'pass',
    detail: `App config: ${appDir} · Engine config: ${engineDir}. These are two separate locations — the engine reads its own config, not the app's.`,
  };
}
