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
 * too, so it is a whole-network deny, not a DNS one. The only remaining route
 * to market data is a connector, and a connector is exactly what the narrowing
 * removes. The morning brief that exists today exists only because a proof
 * agent hand-placed 328 cache files from outside the sandbox.
 *
 * THE GRANT. A routine may NAME the connectors its workflow needs. Nothing is
 * inherited: an undeclared routine, a user-created cron, and a routine whose
 * declared connector is not installed all still resolve to `[]`. The grant is
 * keyed on `IMcpServer.libraryEntryId` — the catalog identity written at
 * install — and NOT on `name`, because a name is user-editable and
 * collision-prone: a hand-added custom server called `tvcontrol`, or an
 * external definition mirrored in from another tool's settings, must not be
 * able to capture a grant the routine wrote for the catalog connector.
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
 * The `activeMcpServers` selection for a routine, given what it declared and
 * what is installed. PURE — the caller does the I/O — so the grant rule is
 * testable without a storage layer.
 *
 * Fail-closed at every step: a malformed name, a name over the cap, a
 * connector that is not installed, one that is installed but DISABLED, a
 * builtin, and a server whose `libraryEntryId` does not match all contribute
 * nothing. An empty result is the same `[]` the default already sends, so the
 * worst case of a bad declaration is the behaviour before this module existed.
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
      logger.warn(`[RoutineConnectors] Routine "${routineId}" declares more than ${ROUTINE_CONNECTOR_CAP} connectors; ignoring "${entry}"`);
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
    if (typeof server.libraryEntryId !== 'string' || !wanted.has(server.libraryEntryId)) continue;
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
