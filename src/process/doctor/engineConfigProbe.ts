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
import { readConfig } from '@process/agent/wcore/configBridge';
import { ProfileIsolationError, resolveActiveConfigPath } from '@process/agent/wcore/profilePaths';
import { summarizeTomlError, tomlErrorPosition } from '@process/utils/tomlErrorSummary';

/**
 * `'ok'` when the config parsed or is simply absent (a fresh install has none);
 * `'corrupt'` with a SANITISED reason plus the failure's position as numbers;
 * `'unresolved'` when the ACTIVE PROFILE itself could not be resolved, which is
 * a different fault and must not be reported as a parse failure.
 *
 * `path` is the file actually inspected, so the check can name the same target
 * the recovery panel does instead of leaving the user to guess.
 */
export type EngineConfigProbeResult =
  | { status: 'ok'; existed: boolean; path: string }
  | { status: 'corrupt'; message: string; path: string; line?: number; column?: number }
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
  if (path === undefined) {
    try {
      target = await resolveActiveConfigPath();
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

  try {
    await readConfig(target);
    return { status: 'ok', existed, path: target };
  } catch (error) {
    const position = tomlErrorPosition(error);
    return {
      status: 'corrupt',
      message: summarizeTomlError(error),
      path: target,
      ...(position ? { line: position.line, column: position.column } : {}),
    };
  }
}
