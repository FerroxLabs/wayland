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

import { redactSecrets } from '@process/utils/secretRedaction';
import type { DoctorCheckOutcome } from '../types';

/** Config check dependencies — all injectable so the checks are unit-testable. */
export type ConfigCheckDeps = {
  /** True when an OS keychain-backed secret store is available. */
  isEncryptionAvailable: () => boolean;
  /**
   * Read + parse the engine's user `config.toml`. Resolves `'ok'` (parsed or
   * absent), or `'corrupt'` with the parse failure's reason and, when the parser
   * reported one, its position. Never throws.
   *
   * `message` is the reason ONLY. It must never carry the offending source line:
   * that line is the user's own config, credentials included
   * (GHSA-2g2m-r86j-jg6h). `line`/`column` are how this check stays actionable
   * without echoing any of the file. `probeEngineConfig` is the real producer.
   */
  readEngineConfig: () => Promise<
    | { status: 'ok'; existed: boolean; path?: string }
    | { status: 'corrupt'; message: string; path?: string; line?: number; column?: number }
    | { status: 'unresolved'; message: string }
  >;
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
    remediation:
      'On Linux, install libsecret + a running secret service (gnome-keyring / KWallet) for keychain-strength storage.',
  };
}

/**
 * Render `line`/`column` as a position phrase, or `null` when the parser gave
 * neither. Deliberately NUMBERS only - naming the position is what keeps the
 * remediation actionable now that the offending line's TEXT is withheld
 * (GHSA-2g2m-r86j-jg6h).
 */
function describePosition(result: { line?: number; column?: number }): string | null {
  if (typeof result.line !== 'number' || !Number.isFinite(result.line)) return null;
  if (typeof result.column !== 'number' || !Number.isFinite(result.column)) return `line ${result.line}`;
  return `line ${result.line}, column ${result.column}`;
}

/**
 * Engine config integrity — the user `config.toml` parses. FAIL when it exists
 * but is corrupt; PASS when it parses or is absent (a fresh install).
 *
 * The corrupt branch names the POSITION of the fault and never its text. The
 * Doctor panel has a "Copy report" button and exists to be shared with support,
 * so echoing the offending config line would hand out whatever credential
 * happened to sit next to it (GHSA-2g2m-r86j-jg6h).
 */
export async function checkEngineConfigIntegrity(
  readEngineConfig: ConfigCheckDeps['readEngineConfig']
): Promise<DoctorCheckOutcome> {
  const result = await readEngineConfig();
  // A profile that cannot be resolved is a DIFFERENT fault from a config that
  // will not parse, and calling it a parse failure is the same misdiagnosis this
  // check already shipped once by reading the wrong file (see `probeEngineConfig`).
  if (result.status === 'unresolved') {
    return {
      status: 'fail',
      detail: `The active profile's config directory could not be resolved: ${redactSecrets(result.message)}`,
      remediation: 'Switch back to the default profile, or repair the active profile directory, then re-run Doctor.',
    };
  }
  if (result.status === 'corrupt') {
    // `readEngineConfig` is INJECTED, and the real producer already strips and
    // scrubs. Scrub again anyway: every future caller of this check inherits the
    // copy-to-support blast radius, and a defence that depends on the injection
    // being the right one is not a defence. `redactSecrets` is idempotent.
    //
    // This is a BACKSTOP, not the fix. The fix is the producer DROPPING the
    // echoed source block (`probeEngineConfig`): `redactSecrets` misses the
    // prefixed label spelling `ANTHROPIC_API_KEY=<value>` entirely (#1026), so a
    // scrub over an unstripped parse error would still leak.
    const reason = redactSecrets(result.message);
    const position = describePosition(result);
    // The PATH is named in the detail because the check and the recovery panel
    // that mounts under this row must visibly agree on which file they mean; when
    // they silently disagreed, Reveal opened a file nobody was complaining about.
    const where = result.path ? ` (${result.path})` : '';
    return {
      status: 'fail',
      detail: position
        ? `The engine's config.toml${where} could not be parsed at ${position}: ${reason}`
        : `The engine's config.toml${where} could not be parsed: ${reason}`,
      remediation: position
        ? `Fix the TOML syntax at ${position} in ${result.path ?? 'the engine config.toml'}, or remove the file to regenerate defaults.`
        : `Fix the TOML syntax in ${result.path ?? 'the engine config.toml'}, or remove the file to regenerate defaults.`,
    };
  }
  const target = result.path ? ` (${result.path})` : '';
  return {
    status: 'pass',
    detail: result.existed
      ? `Engine config.toml${target} parses cleanly.`
      : `No engine config.toml yet${target} (fresh install) — defaults apply.`,
  };
}

/** Dependencies for {@link checkConfigPaths} — the two resolved config dirs. */
export type ConfigPathsDeps = {
  /** The desktop app config directory (`getConfigPath()` → `.../Wayland/config`). */
  appConfigDir: () => string;
  /** The engine (wayland-core) config directory (`nativeConfigDir()`). */
  engineConfigDir: () => string;
};

/**
 * Config locations — surface the TWO distinct config directories the app uses so
 * the "which config is live / why didn't my setting take / where is my config"
 * confusion is visible: the desktop app config dir (providers, channels, OAuth)
 * and the SEPARATE wayland-core engine config dir. Informational — always PASS,
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
