/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PER-ROUTINE CONNECTOR ALLOWLIST (B9).
 *
 * THE PROBLEM THIS EXISTS FOR. An unattended run is acquired with
 * `{ yoloMode: true }` — blanket auto-approve, no human at the keyboard — so
 * `WorkerTaskManagerJobExecutor` scopes every user connector OUT of it
 * (`activeMcpServers: []`). That narrowing is correct and stays the default:
 * `isServerActiveForSession` reads an ABSENT selection as "every enabled
 * server", and server-level selection is all the wcore launch path has, so
 * whatever survives reaches the engine with its FULL tool inventory (#998).
 *
 * But it leaves a routine with NO ROUTE TO ITS DATA. The scheduled run's shell
 * has no network at all — measured on the pinned v0.13.4 engine:
 *
 *     $ wayland-core sandbox exec --workspace /private/tmp/rc2-ws \
 *         'curl -sS -m 8 https://query1.finance.yahoo.com/...'
 *     curl: (6) Could not resolve host: query1.finance.yahoo.com
 *     $ ...same command on the host: http=429   <- known-positive control
 *
 * and raw-IP TCP and 127.0.0.1:9222 are refused from inside the same sandbox
 * too, so it is a whole-network deny, not a DNS one.
 *
 * WHAT THIS IS NOT. It is NOT the morning report's data route, and nothing
 * shipped uses it. That report's bars come from `routinePrefetch` /
 * `prefetchDailyBars`, which fetch in the MAIN process - outside the seatbelt -
 * into the cache the scanner already reads. Proven from a cold workspace: 82
 * written in 16.8 s, then the real scanner inside the real sandbox printing
 * "74 names scanned, 56 currently long, bar 2026-08-21". A connector could not
 * have done it anyway: `data_get_ohlcv` takes no symbol parameter and caps at
 * 500 bars, against a scanner that discards anything under 300 daily bars for
 * each of 74 names.
 *
 * So this module is the mechanism for a routine that genuinely has no other
 * way, and today NO shipped routine declares anything. Every path through it
 * returns `[]` for the corpus as it stands, which is the same fail-closed
 * default that existed before it.
 *
 * THE GRANT. A routine may NAME the connectors its workflow needs. Nothing is
 * inherited: an undeclared routine, a user-created cron, and a routine whose
 * declared connector is not installed all still resolve to `[]`.
 *
 * THE KEY IS THE INSTALL, NOT A STRING NAMED AFTER IT. `libraryEntryId` alone
 * is not a consent boundary. It is an ordinary optional field on an ordinary
 * record in `mcp.config`, so anything that can add a server can set it to any
 * value - including the exact id a routine declares. Keying on it alone means
 * a hand-added custom server, or an external definition mirrored in from
 * another tool's settings, captures the grant by copying one string, and what
 * it captures is a connector reaching an unattended `{ yoloMode: true }` run
 * where every `approval_required` is answered `true`.
 *
 * So the key is PROVENANCE AS A PAIR, the pattern this repo already uses for
 * the same problem (`isOwnBuiltinWaylandMcpScript`, #1015 F2): the MCP Library
 * install (`entryToServerData`) is the only writer of `source: 'library'`,
 * `libraryEntryId: <entry>` and the `originalJson` stamp
 * `{"source":"library","entry":"<entry>"}`, and it writes all three in ONE
 * record from ONE catalog entry. A record that contradicts itself across them
 * is not the entry it claims to be. `name` is not consulted at all - it is
 * user-editable and collision-prone.
 *
 * WHAT THIS CANNOT DO. No field inside `mcp.config` can defend against a
 * caller that rewrites `mcp.config` wholesale. That is why
 * `mcp.compare-and-set-config` - which persists a caller-supplied
 * `IMcpServer[]` verbatim - is remote-denied in `bridgeAllowlist.ts`. This
 * check is the local half; that denial is the remote half. Neither is
 * sufficient alone.
 *
 * SERVER-LEVEL, AND SAYING SO. There is no per-tool narrowing available on
 * this path and this module does not pretend otherwise. Proven by executing
 * both production writers over the SAME server carrying
 * `allowedTools: ['quote_batch']`: the codex writer emits
 * `enabled_tools = ["quote_batch"]`, the wcore writer emits no tool key at
 * all; the engine's own `McpServerConfig` has no tool field (its tool curation
 * is `off | top_k`, a ranking, not an allowlist); and `WCoreManager` answers
 * every `approval_required` in a `yoloMode` session with `true`. So a routine
 * that names a connector gets that connector's WHOLE inventory. Name the
 * smallest set that does the job, and never a connector whose mutating tools
 * you would not hand an unattended process.
 */

import { logger } from '@office-ai/platform';
import type { IMcpServer } from '@/common/config/storage';
import { loadRuntimeMcpServers } from '@process/services/mcpServices/runtimeMcpServers';
import { loadBundledRoutines } from './BuiltinRoutinesSeeder';

/**
 * Most connectors one routine may name. A routine needing more than a handful
 * is not scoping anything; the cap keeps a malformed or hostile definition
 * from re-creating the "inherit everything" posture this module replaces.
 */
export const ROUTINE_CONNECTOR_CAP = 4;

/**
 * A declarable connector identity: the MCP Library entry name, e.g.
 * `com.ferroxlabs/tvcontrol`. Bounded and printable so a malformed definition
 * cannot smuggle control characters into a log line or a comparison.
 */
export function isDeclarableConnectorId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && /^[\w.@/-]+$/.test(value);
}

/**
 * The catalog entry a server record can PROVE it was installed from, or null.
 *
 * Three statements, all written by the MCP Library install and only by it, all
 * derived from the same `entry.name`. They must agree. A record missing any of
 * them, or disagreeing across them, resolves to null and can never match a
 * declaration - which is the fail-closed `[]` the default already sends.
 *
 * `originalJson` is parsed defensively: it is a free-form string on the record,
 * so a non-object, an array, `null`, or unparseable text is a REFUSAL and not a
 * reason to fall back to the weaker field.
 */
function installedCatalogEntryId(
  server: Pick<IMcpServer, 'source' | 'libraryEntryId' | 'originalJson'>
): string | null {
  const entry = server.libraryEntryId;
  if (!isDeclarableConnectorId(entry)) return null;
  if (server.source !== 'library') return null;
  if (typeof server.originalJson !== 'string') return null;
  let stamp: unknown;
  try {
    stamp = JSON.parse(server.originalJson);
  } catch {
    return null;
  }
  if (typeof stamp !== 'object' || stamp === null || Array.isArray(stamp)) return null;
  const claimed = stamp as { source?: unknown; entry?: unknown };
  if (claimed.source !== 'library' || claimed.entry !== entry) return null;
  return entry;
}

/**
 * The `activeMcpServers` selection for a routine, given what it declared and
 * what is installed. PURE — the caller does the I/O — so the grant rule is
 * testable without a storage layer.
 *
 * Fail-closed at every step: a malformed name, a name over the cap, a
 * connector that is not installed, one that is installed but DISABLED, a
 * builtin, and a server that cannot PROVE it was installed from the catalog
 * entry it names ({@link installedCatalogEntryId}) all contribute nothing. An
 * empty result is the same `[]` the default already sends, so the worst case of
 * a bad declaration is the behaviour before this module existed.
 */
export function selectRoutineConnectorIds(
  declared: readonly unknown[] | undefined,
  servers: readonly IMcpServer[],
  routineId: string = '<unknown>'
): string[] {
  if (!Array.isArray(declared) || declared.length === 0) return [];

  const wanted = new Set<string>();
  for (const entry of declared) {
    if (!isDeclarableConnectorId(entry)) {
      logger.warn(`[RoutineConnectors] Routine "${routineId}" declares an unusable connector ${JSON.stringify(entry)}`);
      continue;
    }
    if (wanted.size >= ROUTINE_CONNECTOR_CAP) {
      logger.warn(
        `[RoutineConnectors] Routine "${routineId}" declares more than ${ROUTINE_CONNECTOR_CAP} connectors; ignoring "${entry}"`
      );
      continue;
    }
    wanted.add(entry);
  }
  if (wanted.size === 0) return [];

  const ids: string[] = [];
  for (const server of servers) {
    // Builtins bypass session scoping entirely (`isServerActiveForSession`
    // returns true for them regardless), so naming one would be theatre.
    if (server.builtin === true) continue;
    if (server.enabled !== true) continue;
    const installed = installedCatalogEntryId(server);
    if (installed === null || !wanted.has(installed)) continue;
    if (typeof server.id !== 'string' || server.id === '') continue;
    if (!ids.includes(server.id)) ids.push(server.id);
  }
  return ids;
}

/**
 * The `activeMcpServers` selection for a seeded routine job, resolved against
 * the connectors actually installed on this machine. `[]` for every job that
 * is not a routine, every routine that declares nothing, and every declaration
 * that resolves to nothing.
 *
 * Best-effort by design: any failure reading routines or connectors returns
 * `[]`, which is the fail-closed default, so this can never block a run.
 */
export async function resolveRoutineConnectorIds(routineId: string | undefined): Promise<string[]> {
  if (!routineId) return [];
  try {
    const routines = await loadBundledRoutines();
    const declared = routines?.find((r) => r?.id === routineId)?.connectors;
    if (!Array.isArray(declared) || declared.length === 0) return [];
    const servers = await loadRuntimeMcpServers();
    const ids = selectRoutineConnectorIds(declared, servers, routineId);
    logger.info(
      `[RoutineConnectors] Routine "${routineId}" declared ${declared.length} connector(s); ${ids.length} granted to this run`
    );
    return ids;
  } catch (err) {
    logger.warn(
      `[RoutineConnectors] Could not resolve connectors for "${routineId}": ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}
