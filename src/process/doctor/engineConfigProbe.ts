/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The engine-`config.toml` read the Doctor's config-integrity check consumes.
 *
 * Extracted out of `registry.ts` for one reason: this is the SANITISATION point
 * for GHSA-2g2m-r86j-jg6h, and a security boundary that can only be exercised
 * through Electron singletons is a boundary nobody can test. It has no Electron
 * dependency, so `tests/unit/process/doctor/engineConfigParseErrorRedaction.test.ts`
 * drives it against a real corrupt file on disk.
 *
 * The sanitisation lives HERE, at the producer, not at the consumer: the raw
 * `smol-toml` message echoes the user's own config lines (their `api_key`s
 * among them), so stripping it inside one check would still leave it available
 * to the next consumer of this result. See `@process/utils/tomlErrorSummary`.
 */

import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readConfig } from '@process/agent/wcore/configBridge';
import { DEFAULT_PROFILE, ProfileIsolationError, resolveActiveConfigIdentity } from '@process/agent/wcore/profilePaths';
import { summarizeTomlError, tomlErrorPosition } from '@process/utils/tomlErrorSummary';

/**
 * `'ok'` when the config parsed or is simply absent (a fresh install has none);
 * `'corrupt'` with a SANITISED reason plus the failure's position as numbers;
 * `'unresolved'` when the ACTIVE PROFILE itself could not be resolved, which is
 * a different fault and must not be reported as a parse failure.
 *
 * `path` is the file actually inspected, so the check can name the same target
 * the recovery panel does instead of leaving the user to guess.
 *
 * `displayPath` is what a SURFACE must render instead, when it is set. Same split,
 * and for the same reason, as `WorkspaceEntry.displayPath`: `path` is the real
 * file - Reveal-in-Finder opens it and the recovery panel edits it - while under a
 * named profile the path's second-to-last segment IS the user-authored profile
 * name and printing the path prints the name. See {@link withheldProfilePath}.
 */
export type EngineConfigProbeResult =
  | { status: 'ok'; existed: boolean; path: string; displayPath?: string }
  | { status: 'corrupt'; message: string; path: string; displayPath?: string; line?: number; column?: number }
  | { status: 'unresolved'; message: string };

/**
 * The two reasons an active profile can fail to resolve, as CONSTANTS.
 *
 * This branch used to route the thrown error through `summarizeTomlError`, and
 * that failed open. `ProfileIsolationError` interpolates the profile name into
 * the FIRST line of its own message (`Cannot resolve the config directory for the
 * active profile "<name>" ...`), so keeping only the first line kept the name, and
 * the scrub cannot see a bare value. Executed, the Doctor detail read
 * `... active profile "f0e9d8c7b6a5948372615041302f1e0d"`.
 *
 * A profile name is user-authored: `PROFILE_NAME_RE` allows 64 characters of
 * `[A-Za-z0-9._-]`, which fits a 32-hex key and an `sk-ant-` token alike, and the
 * invalid-marker branch passes whatever the marker file contained. So the name is
 * withheld outright rather than surfaced or truncated.
 *
 * CORRECTION. An earlier version of this paragraph read as though withholding the
 * name were a property of this module. It was true of THIS branch only, and false
 * of the two beside it: the `ok` and `corrupt` branches returned the resolved
 * `path`, whose second-to-last segment is the lowercased profile name, and the
 * config check interpolated it into a detail AND a remediation on EVERY Doctor run
 * - not only on a fault. Executed, a healthy config read `Engine config.toml
 * (.../f0e9d8c7b6a5948372615041302f1e0d/config.toml) parses cleanly.` The name is
 * withheld on all three branches now; {@link withheldProfilePath} does the other
 * two.
 *
 * The two constants preserve the distinction the #278 contract actually turns on -
 * a named profile whose directory is broken (fail closed) versus a fault reading
 * the selection itself - and the remediation covers both. The error's own `detail`
 * argument is dropped with them, because on two of its three call sites it is an
 * fs message carrying the profile path, and therefore the name again.
 */
const PROFILE_ISOLATION_REASON = 'a named profile is active and its config directory could not be resolved';
const PROFILE_SELECTION_REASON = 'the active-profile selection could not be read';

function profileUnresolvedReason(error: unknown): string {
  return error instanceof ProfileIsolationError ? PROFILE_ISOLATION_REASON : PROFILE_SELECTION_REASON;
}

/** Stands in for a withheld profile-directory name in a Doctor detail. */
const WITHHELD_PROFILE = '(profile name withheld)';

/**
 * The config path to RENDER for a named profile: the same path with the profile
 * directory replaced by {@link WITHHELD_PROFILE}.
 *
 * The profiles ROOT is kept because it is the actionable half - it is where the
 * user looks in Finder - and dropping only the leaf directory drops the part that
 * carries the name. This mirrors `doctorWorkspaceDisplayPath`, which made the same
 * trade for the same reason on the workspace paths.
 *
 * `dirname` of the profile dir rather than `profilesRoot()`: the dir handed in has
 * been through `realpath` (`resolveProfileDir`), and the root may itself be
 * Desktop's intentional macOS CLI-compatibility symlink, so recomputing the root
 * could print a path that does not prefix the real one.
 */
function withheldProfilePath(profileDir: string): string {
  return join(dirname(profileDir), WITHHELD_PROFILE, 'config.toml');
}

/**
 * Read + parse the engine's user `config.toml`. Never throws, and never carries
 * any of the file's own bytes out - only the parser's one-line reason (scrubbed)
 * and the line/column numbers.
 *
 * TARGET: `resolveActiveConfigPath()`, i.e. the ACTIVE PROFILE's config - NOT
 * `resolveUserConfigPath()` (the native one). This was wrong on the first pass
 * and it was reachable today, because profile activation is shipped UI. With a
 * named profile active the two paths differ [verified by execution], so the check
 * inspected a file the engine would never load: the Doctor row failed forever
 * over a corrupt native config while the recovery panel mounted beneath it - which
 * reads the active path - reported `ok`, and Reveal opened neither.
 *
 * The active path is the correct side, established rather than assumed: the
 * engine spawn sets `WAYLAND_HOME` from `resolveActiveConfigDir()`
 * (`WCoreAgent.resolveWaylandHomeForLaunch`), and Core treats `$WAYLAND_HOME` as
 * the literal config dir. So the active profile's `config.toml` IS the file the
 * engine launches against. `readConfig()` already defaults to the same path; only
 * this caller was overriding it with the native one.
 *
 * @param path Optional override (tests / non-default homes).
 */
export async function probeEngineConfig(path?: string): Promise<EngineConfigProbeResult> {
  let target: string;
  /** Set only under a named profile; `undefined` means `target` is safe to render. */
  let displayTarget: string | undefined;
  if (path === undefined) {
    try {
      // `resolveActiveConfigIdentity`, not `resolveActiveConfigPath`: the same one
      // marker read, but it also returns WHICH profile resolved, and that is what
      // decides whether the path carries a user-authored name at all. The native
      // selector's dir is `<config-base>/wayland-core` and carries none.
      const identity = await resolveActiveConfigIdentity();
      target = join(identity.dir, 'config.toml');
      if (identity.profile !== DEFAULT_PROFILE) displayTarget = withheldProfilePath(identity.dir);
    } catch (error) {
      // A named profile that cannot be resolved is fail-closed by contract
      // (#278) and is NOT a parse failure. Reporting it as "config.toml could
      // not be parsed" would misdiagnose it exactly the way the wrong-target bug
      // above did.
      return { status: 'unresolved', message: profileUnresolvedReason(error) };
    }
  } else {
    target = path;
  }

  let existed = true;
  try {
    await access(target);
  } catch {
    existed = false;
  }

  const shown = displayTarget ? { displayPath: displayTarget } : {};
  try {
    await readConfig(target);
    return { status: 'ok', existed, path: target, ...shown };
  } catch (error) {
    const position = tomlErrorPosition(error);
    return {
      status: 'corrupt',
      message: summarizeTomlError(error),
      path: target,
      ...shown,
      ...(position ? { line: position.line, column: position.column } : {}),
    };
  }
}
