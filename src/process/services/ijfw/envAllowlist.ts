/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW env allowlist - strictly forwards only known-safe env vars to spawned
 * children. Fixes SEC-005 (no prefix match - exact IJFW_* keys only).
 */

const ALLOW_EXACT = new Set<string>([
  'PATH',
  'HOME',
  'NODE_ENV',
  'ELECTRON_RUN_AS_NODE',
  'LANG',
  'LC_ALL',
  'TZ',
  'TMPDIR',
  'TEMP',
  'TMP',
  'USER',
  'USERNAME',
  'LOGNAME',
  // Exact IJFW_* keys we forward (SEC-005 - never prefix-match).
  'IJFW_AUTO_INSTALL',
  'IJFW_HOME',
  'IJFW_LOG_LEVEL',
]);

/**
 * Windows-only additions (#928).
 *
 * The list above was written against a POSIX login environment and named not
 * one Windows variable, so on Windows every IJFW child - the `npm view` version
 * probe, the `npx @ijfw/install` bootstrap, the MCP spawn-test and the
 * long-lived memory client - was started with an environment npm cannot work
 * in. Each entry below is load-bearing and carries no secret:
 *
 *   APPDATA / LOCALAPPDATA  npm derives its user-writable global prefix from
 *                           APPDATA. Without it npm falls back beside the node
 *                           install (Program Files) and an unelevated write is
 *                           EPERM - the error the reporter saw.
 *   SystemRoot              winsock/DNS initialisation in a child fails without
 *                           it, so the registry fetch dies even when the prefix
 *                           is writable.
 *   USERPROFILE             Windows has no HOME; os.homedir() reads this.
 *   ComSpec                 any `shell: true` / .cmd shim spawn needs it.
 *   PATHEXT                 without it a bare `npm` never resolves to `npm.cmd`.
 */
const ALLOW_EXACT_WIN32 = new Set<string>([
  'APPDATA',
  'LOCALAPPDATA',
  'SystemRoot',
  'USERPROFILE',
  'ComSpec',
  'PATHEXT',
]);

/**
 * The same names, lower-cased, for the win32 comparison.
 *
 * Windows presents these variables in ITS casing, not ours: a real
 * `Object.keys(process.env)` on Windows yields `Path`, `ComSpec`, `SystemRoot`
 * - so a case-SENSITIVE `has('PATH')` dropped the child's entire search path.
 * (`safeSpawn.ts` already reads `env['PATH'] ?? env['Path']` for exactly this
 * reason.) Windows env names are case-INSENSITIVE at the OS level, so matching
 * them that way widens nothing there: `path` and `PATH` are the same variable.
 * On POSIX they are two different variables, so that platform keeps the exact
 * match and never sees the Windows-only names at all.
 */
const ALLOW_LOWER_WIN32 = new Set<string>([...ALLOW_EXACT, ...ALLOW_EXACT_WIN32].map((key) => key.toLowerCase()));

const EXTRA_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function isAllowedKey(key: string, platform: NodeJS.Platform): boolean {
  return platform === 'win32' ? ALLOW_LOWER_WIN32.has(key.toLowerCase()) : ALLOW_EXACT.has(key);
}

/**
 * Pure core: no process access, so the platform-dependent behaviour is unit
 * testable from any host. `buildChildEnv` is the process-bound wrapper.
 */
export function buildChildEnvWith(
  platform: NodeJS.Platform,
  sourceEnv: NodeJS.ProcessEnv,
  extra: Record<string, string> = {}
): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(sourceEnv)) {
    if (v === undefined) continue;
    if (isAllowedKey(k, platform)) out[k] = v;
  }
  for (const [k, v] of Object.entries(extra)) {
    if (!EXTRA_KEY_PATTERN.test(k)) {
      throw new Error(`invalid env key: ${k}`);
    }
    if (platform === 'win32') {
      // An env block holding both `Path` and `PATH` is ambiguous on Windows -
      // which one the child reads is undefined. `ijfwSystemService` passes an
      // augmented `PATH` while the OS handed us `Path`, so the caller's value
      // must REPLACE the forwarded spelling rather than sit beside it.
      const lower = k.toLowerCase();
      for (const existing of Object.keys(out)) {
        if (existing !== k && existing.toLowerCase() === lower) delete out[existing];
      }
    }
    out[k] = v;
  }
  return out;
}

export function buildChildEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  return buildChildEnvWith(process.platform, process.env, extra);
}
