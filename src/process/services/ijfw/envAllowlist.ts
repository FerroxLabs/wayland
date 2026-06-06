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

const EXTRA_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export function buildChildEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined) continue;
    if (ALLOW_EXACT.has(k)) out[k] = v;
  }
  for (const [k, v] of Object.entries(extra)) {
    if (!EXTRA_KEY_PATTERN.test(k)) {
      throw new Error(`invalid env key: ${k}`);
    }
    out[k] = v;
  }
  return out;
}
