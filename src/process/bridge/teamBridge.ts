/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { ipcBridge } from '@/common';
import { suggestRoster } from '@process/team/suggestRoster';
import type { TeamSessionService } from '@process/team/TeamSessionService';
import { ExtensionRegistry } from '@process/extensions/ExtensionRegistry';
import type { SpecialistCatalog } from '@process/team/importExport/importTeam';
import { makeExtensionRegistryRitualsResolver } from '@process/team/ritualScheduler';

// W5 audit HIGH-1 (2026-05-19) - IPC boundary schemas for the new W4 providers.
// Renderer-supplied params used to flow straight through to the service layer
// for these endpoints. Each schema below is `.strict()` so unknown keys are
// rejected, and every string is bounded so a hostile renderer cannot starve
// the main process with megabyte-class payloads on identifier fields. The
// `parsed` field on `importAccept` is deliberately `z.unknown()` here - it is
// re-validated against `TeamExportSchema` inside `acceptTeamImport` itself so
// the structural guarantees are enforced exactly once, in the service layer.

const importAcceptParamSchema = z
  .object({
    userId: z.string().min(1).max(64),
    parsed: z.unknown(), // re-validated by TeamSessionService.acceptTeamImport
    capabilityGrants: z.record(z.string(), z.boolean()),
    source: z.string().min(1).max(256),
  })
  .strict();

const importPreviewParamSchema = z
  .object({
    // Hard cap mirrors the service-layer DOS limit; size cap here means the
    // structured-clone copy never crosses the IPC boundary if it's oversized.
    jsonText: z.string().max(1024 * 1024),
  })
  .strict();

const exportParamSchema = z
  .object({
    teamId: z.string().min(1).max(64),
  })
  .strict();

const suggestRosterParamSchema = z
  .object({
    goalText: z.string().max(8192),
    // Specialist payloads are normalized inside `suggestRoster`; the bridge
    // just enforces a sane array cap so the worker thread cannot be flooded.
    specialists: z.array(z.unknown()).max(200),
    detectedBackends: z.array(z.string()).max(50),
    targetSize: z.number().int().min(2).max(6).optional(),
  })
  .strict();

const restartAgentParamSchema = z
  .object({
    teamId: z.string().min(1).max(64),
    slotId: z.string().min(1).max(128),
  })
  .strict();

// Live-smoke fix #4b (2026-05-19) - schema for the changeAgentBackend
// IPC. newBackend is capped at the same length as agentType strings
// elsewhere in the codebase; newModel is optional because a swap
// between equivalent default models doesn't need a model override.
const changeAgentBackendParamSchema = z
  .object({
    teamId: z.string().min(1).max(64),
    slotId: z.string().min(1).max(128),
    newBackend: z.string().min(1).max(64),
    newModel: z.string().min(1).max(128).optional(),
  })
  .strict();

const teamIdOnlyParamSchema = z
  .object({
    teamId: z.string().min(1).max(64),
  })
  .strict();

/**
 * Wrap an async provider handler so that unhandled rejections are caught and
 * logged instead of silently swallowed by the platform bridge (which only
 * chains `.then()` without `.catch()` on the provider callback).
 *
 * Returning `{ __bridgeError: true, message }` unblocks the renderer-side
 * `invoke()` promise so the UI never "freezes".
 */
function safeProvider<R, P>(fn: (params: P) => Promise<R>) {
  return async (params: P): Promise<R> => {
    try {
      return await fn(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[teamBridge] provider error:', message);
      // Return a sentinel the renderer can detect
      return { __bridgeError: true, message } as unknown as R;
    }
  };
}

let _teamSessionService: TeamSessionService | null = null;

export function initTeamBridge(teamSessionService: TeamSessionService): void {
  _teamSessionService = teamSessionService;
  ipcBridge.team.create.provider(
    safeProvider(async (params) => {
      return teamSessionService.createTeam(params);
    })
  );

  ipcBridge.team.list.provider(
    safeProvider(async ({ userId }) => {
      return teamSessionService.listTeams(userId);
    })
  );

  ipcBridge.team.get.provider(
    safeProvider(async ({ id }) => {
      return teamSessionService.getTeam(id);
    })
  );

  ipcBridge.team.remove.provider(
    safeProvider(async ({ id }) => {
      await teamSessionService.deleteTeam(id);
    })
  );

  ipcBridge.team.addAgent.provider(
    safeProvider(async ({ teamId, agent }) => {
      return teamSessionService.addAgent(teamId, agent);
    })
  );

  ipcBridge.team.removeAgent.provider(
    safeProvider(async ({ teamId, slotId }) => {
      await teamSessionService.removeAgent(teamId, slotId);
    })
  );

  ipcBridge.team.restartAgent.provider(
    safeProvider(async (raw) => {
      const { teamId, slotId } = restartAgentParamSchema.parse(raw);
      await teamSessionService.restartAgent(teamId, slotId);
    })
  );

  // Live-smoke fix #4b (2026-05-19) - backend swap handler. The Zod
  // boundary check mirrors the W5 audit pattern; service-side enforces
  // same-conversationType + not-mid-wake invariants. Destructure into
  // a fresh object because Zod's inferred type from .strict() still
  // marks the fields as TS-optional even though the schema guarantees
  // presence at runtime.
  ipcBridge.team.changeAgentBackend.provider(
    safeProvider(async (raw) => {
      const { teamId, slotId, newBackend, newModel } = changeAgentBackendParamSchema.parse(raw);
      await teamSessionService.changeAgentBackend({ teamId, slotId, newBackend, newModel });
    })
  );

  ipcBridge.team.renameAgent.provider(
    safeProvider(async ({ teamId, slotId, newName }) => {
      await teamSessionService.renameAgent(teamId, slotId, newName);
    })
  );

  ipcBridge.team.renameTeam.provider(
    safeProvider(async ({ id, name }) => {
      await teamSessionService.renameTeam(id, name);
    })
  );

  ipcBridge.team.setSessionMode.provider(
    safeProvider(async ({ teamId, sessionMode }) => {
      await teamSessionService.setSessionMode(teamId, sessionMode);
    })
  );

  ipcBridge.team.updateWorkspace.provider(
    safeProvider(async ({ teamId, workspace }) => {
      await teamSessionService.updateWorkspace(teamId, workspace);
    })
  );

  // W3b - promote/demote handlers. Service methods are idempotent; the
  // provider just translates IPC → service and surfaces errors via safeProvider.
  ipcBridge.team.promoteToStanding.provider(
    safeProvider(async (raw) => {
      const { teamId } = teamIdOnlyParamSchema.parse(raw);
      await teamSessionService.promoteTeamToStanding(teamId);
    })
  );

  ipcBridge.team.demoteFromStanding.provider(
    safeProvider(async (raw) => {
      const { teamId } = teamIdOnlyParamSchema.parse(raw);
      await teamSessionService.demoteTeamFromStanding(teamId);
    })
  );

  ipcBridge.team.sendMessage.provider(
    safeProvider(async ({ teamId, content, files }) => {
      const session = await teamSessionService.getOrStartSession(teamId);
      await session.sendMessage(content, files);
    })
  );

  ipcBridge.team.sendMessageToAgent.provider(
    safeProvider(async ({ teamId, slotId, content, files }) => {
      const session = await teamSessionService.getOrStartSession(teamId);
      await session.sendMessageToAgent(slotId, content, { files });
    })
  );

  ipcBridge.team.stop.provider(
    safeProvider(async ({ teamId }) => {
      await teamSessionService.stopSession(teamId);
    })
  );

  ipcBridge.team.ensureSession.provider(
    safeProvider(async ({ teamId }) => {
      await teamSessionService.getOrStartSession(teamId);
    })
  );

  // W1e - list team_event_log rows for the Activity tab + cost meter.
  ipcBridge.team.listEvents.provider(
    safeProvider(async ({ teamId, since, limit, eventType }) => {
      return teamSessionService.listEvents(teamId, { since, limit, eventType });
    })
  );

  // W3c - pure server-side roster suggester. No I/O; runs the keyword
  // scorer + recommendBackend over the renderer-provided specialist pool.
  ipcBridge.team.suggestRoster.provider(
    safeProvider(async (raw) => {
      const validated = suggestRosterParamSchema.parse(raw);
      // Cast back to the ipcBridge param shape - `suggestRoster` does its
      // own per-element normalization on the specialist pool.
      return suggestRoster(validated as Parameters<typeof suggestRoster>[0]);
    })
  );

  // W4 (T4.1) - team export. Resolves rituals from the live extension
  // registry; if the registry has not booted yet the export still works
  // but omits rituals.
  ipcBridge.team.export.provider(
    safeProvider(async (raw) => {
      const { teamId } = exportParamSchema.parse(raw);
      return teamSessionService.exportTeam(teamId, makeExtensionRegistryRitualsResolver());
    })
  );

  // W4 (T4.2 + T4.6 + T4.6.1) - preview an import payload. All guard
  // failures are translated to JSON error sentinels by safeProvider so the
  // renderer can surface them in the import dialog.
  ipcBridge.team.importPreview.provider(
    safeProvider(async (raw) => {
      const { jsonText } = importPreviewParamSchema.parse(raw);
      return teamSessionService.previewTeamImport(jsonText, makeSpecialistCatalog());
    })
  );

  // W4 (T4.5 + T4.6) - accept an already-previewed import + persist.
  // W4b will add a renderer-side capability-review dialog ahead of this
  // call; until then, the renderer MUST pass an empty grants map.
  ipcBridge.team.importAccept.provider(
    safeProvider(async (raw) => {
      const { userId, parsed, capabilityGrants, source } = importAcceptParamSchema.parse(raw);
      // `parsed` is re-validated inside `acceptTeamImport` against
      // `TeamExportSchema`. We cast to the service-layer type here because
      // the strict re-parse on the inside is the source of truth.
      return teamSessionService.acceptTeamImport({
        userId,
        parsed: parsed as Parameters<typeof teamSessionService.acceptTeamImport>[0]['parsed'],
        capabilityGrants,
        source,
        specialistCatalog: makeSpecialistCatalog(),
      });
    })
  );
}

/**
 * Build the specialist-id catalog from the live ExtensionRegistry. The
 * registry stores assistants with ids prefixed `ext-<id>`; the export
 * format uses the unprefixed id so the catalog set must mirror that.
 */
function makeSpecialistCatalog(): SpecialistCatalog {
  return async () => {
    const registry = ExtensionRegistry.getInstance();
    const assistants = registry.getAssistants();
    const ids = new Set<string>();
    for (const a of assistants) {
      const rawId = (a as { id?: string }).id;
      if (typeof rawId !== 'string') continue;
      const stripped = rawId.startsWith('ext-') ? rawId.slice(4) : rawId;
      ids.add(stripped);
    }
    return ids;
  };
}

/** Stop all active team sessions (TCP servers + child processes). Call on app quit. */
export function disposeAllTeamSessions(): Promise<void> {
  return _teamSessionService?.stopAllSessions() ?? Promise.resolve();
}
