/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

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
 * Splitting them is the durable fix. `WAYLAND_DISABLE_IJFW` is now tri-state and
 * outranks the implicit rules:
 *
 *   '1'        force OFF  (what E2E/CI runs that must not spawn installs set)
 *   '0'        force ON   (lets an isolated harness cover Memory for real)
 *   unset      fall back to the implicit rule: off under CI or E2E
 *
 * The default is deliberately unchanged, so existing E2E and CI runs keep their
 * fail-safe "no npx install spawned" behaviour without touching a single
 * harness. Only a run that explicitly asks for `WAYLAND_DISABLE_IJFW=0` opts in.
 *
 * Pair `WAYLAND_DISABLE_IJFW=0` with BOTH `WAYLAND_E2E_USER_DATA_DIR` (isolates
 * the profile) and a redirected `HOME` (isolates `~/.ijfw`, which the MCP client
 * resolves via `os.homedir()`). Redirecting HOME alone does NOT isolate the
 * profile: Electron resolves the userData root independently of `$HOME` on
 * macOS, so a HOME-only sandbox still attaches to the real profile.
 */
export function shouldDisableIjfw(env: NodeJS.ProcessEnv): boolean {
  const explicit = env.WAYLAND_DISABLE_IJFW;
  if (explicit === '1') return true;
  if (explicit === '0') return false;
  const isCiRuntime = env.CI === 'true' || env.CI === '1' || env.GITHUB_ACTIONS === 'true';
  return isCiRuntime || env.WAYLAND_E2E_TEST === '1';
}
