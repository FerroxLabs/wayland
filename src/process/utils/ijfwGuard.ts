/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'node:os';

/**
 * Decides whether the IJFW system service boots.
 *
 * WHY THIS IS ITS OWN MODULE (Sean's live find, 2026-07-25)
 * --------------------------------------------------------
 * The predicate used to be inline in `src/index.ts` as:
 *
 *   isCiRuntime || WAYLAND_DISABLE_IJFW === '1' || WAYLAND_E2E_TEST === '1'
 *
 * `WAYLAND_E2E_TEST=1` is ALSO the switch that redirects the userData root to a
 * throwaway dir (`configureAppIdentity.ts`). One variable therefore meant both
 * "isolate the profile" and "turn Memory off", so no packaged E2E or smoke run
 * could ever exercise IJFW. That is exactly how a dead Memory surface shipped
 * while the packaged cockpit smoke reported PASS on the same build.
 *
 * `WAYLAND_DISABLE_IJFW` is now tri-state and outranks the implicit rules:
 *
 *   '1'        force OFF  (what E2E/CI runs that must not spawn installs set)
 *   '0'        force ON   (lets an isolated harness cover Memory for real)
 *   unset      fall back to the implicit rule: off under CI or E2E
 *
 * The default is deliberately unchanged, so existing E2E and CI runs keep their
 * fail-safe "no npx install spawned" behaviour without touching a single
 * harness.
 *
 * FORCE-ON IS FAIL-CLOSED
 * -----------------------
 * An earlier version of this file only DOCUMENTED that `'0'` must be paired with
 * an isolated HOME, and a comment is not a guard. Booting IJFW against the real
 * HOME runs `npx -y --package @ijfw/install@latest ijfw-install --yes` against
 * the developer's own `~/.ijfw`, takes its install lock, can swap the live
 * `mcp-server` tree via `applyPendingUpgrade`, and rewrites IJFW-PRELUDE blocks
 * in their repos. The obvious one-line follow-through (adding `'0'` to the
 * packaged smoke, which allowlists the real `HOME`) would have done exactly
 * that.
 *
 * So `'0'` is honoured ONLY when HOME has actually been redirected. `os.homedir()`
 * respects `$HOME`; `os.userInfo().homedir` reads the passwd entry and ignores
 * it. When they differ, HOME is sandboxed. When they match, `'0'` is refused and
 * we fall back to the implicit rule, so a mis-wired harness degrades to the safe
 * behaviour instead of touching a real home.
 */
export type HomePair = { effective: string; login: string };

function resolveHomes(): HomePair {
  let login = '';
  try {
    login = os.userInfo().homedir ?? '';
  } catch {
    // userInfo() throws when there is no passwd entry (some containers). Leave
    // it empty, which reads as "cannot prove isolation" below.
  }
  return { effective: os.homedir(), login };
}

/** True when `$HOME` has been pointed somewhere other than the real account home. */
export function isHomeRedirected(homes: HomePair): boolean {
  if (!homes.effective || !homes.login) return false;
  return homes.effective !== homes.login;
}

export function isCiRuntime(env: NodeJS.ProcessEnv): boolean {
  return env.CI === 'true' || env.CI === '1' || env.GITHUB_ACTIONS === 'true';
}

/**
 * Every environment variable {@link shouldDisableIjfw} consults.
 *
 * Exported so a test can neutralise the guard by clearing exactly what it reads
 * instead of hand-listing variables. Hand-listing is what broke
 * VerificationGate on CI: the suite cleared `CI` (enough for the bare
 * `process.env.CI` check it was written against) but not `GITHUB_ACTIONS`, so
 * once this guard started reading the latter, every gate call short-circuited to
 * advisory on GitHub Actions while passing on every developer machine. Keep this
 * list in step with the reads above and tests cannot drift out of step again.
 */
export const IJFW_GUARD_ENV_VARS = ['WAYLAND_DISABLE_IJFW', 'CI', 'GITHUB_ACTIONS', 'WAYLAND_E2E_TEST'] as const;

/** Delete every variable the guard reads from `env`, in place. */
export function clearIjfwGuardEnv(env: NodeJS.ProcessEnv): void {
  for (const name of IJFW_GUARD_ENV_VARS) delete env[name];
}

export function shouldDisableIjfw(env: NodeJS.ProcessEnv, homes: HomePair = resolveHomes()): boolean {
  const explicit = env.WAYLAND_DISABLE_IJFW;
  if (explicit === '1') return true;
  // Force-ON only from a provably sandboxed HOME. See FORCE-ON IS FAIL-CLOSED.
  if (explicit === '0' && isHomeRedirected(homes)) return false;
  return isCiRuntime(env) || env.WAYLAND_E2E_TEST === '1';
}
