/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import {
  parseManagedWorkspaceInventoryReport,
  type WorkspaceRetentionPreviewResult,
} from '@/common/types/managedWorkspaceRetention';
import {
  collectDesktopManagedWorkspaceInventory,
  type DesktopManagedWorkspaceAuthoritySources,
} from '@process/services/desktopManagedWorkspaceInventory';
import type { ManagedWorkspaceProvenanceLoad } from '@process/services/managedWorkspaceProvenance';

export type WorkspaceRetentionBridgeDependencies = {
  getWorkDir: () => string;
  getInstallationId: () => Promise<string>;
  /**
   * The user's TIER-2 review window. Read per request so a change in Settings
   * is reflected by the next Refresh without a restart.
   */
  getRetentionWindowMs: () => Promise<number>;
  loadProvenance: () => Promise<ManagedWorkspaceProvenanceLoad>;
  sources: Omit<DesktopManagedWorkspaceAuthoritySources, 'loadProvenance'>;
};

/**
 * Register the local-human dry-run provider. This bridge deliberately exposes
 * no quarantine, delete, rename, or mutation provider.
 *
 * NOTHING in this handler may throw. The IPC bridge cannot carry a rejection:
 * `invoke` is `new Promise(function (resolve) { ... })` with no reject and no
 * timeout, and the provider side is `handler(data).then(cb)` with no `.catch`.
 * A throw here is a promise that never settles, and the Storage settings card
 * that awaits it spins forever - no message, no "Try again", because neither
 * its `catch` nor its `finally` ever runs. Every failure is returned as a
 * classified value instead, the pattern already proven at
 * `speechToTextBridge.ts:44-55`.
 *
 * The refusal in the last branch is also the gate a future prune/delete
 * provider inherits: `parseManagedWorkspaceInventoryReport` rejects any report
 * that carries a review candidate, because no directory's emptiness is provable
 * while the snapshot and receipt authorities have no producer. An inventory
 * that cannot be proven leaves this process as an error code, never as entries.
 */
export function initWorkspaceRetentionBridge(deps: WorkspaceRetentionBridgeDependencies): void {
  ipcBridge.workspaceRetention.preview.provider(
    async (request?: unknown): Promise<WorkspaceRetentionPreviewResult> => {
      // This provider deliberately has no renderer-controlled request surface.
      // Refuse rather than ignore fields so a future caller cannot smuggle a
      // path, root, classification, or mutation intent across the boundary.
      if (request !== undefined) return { ok: false, errorCode: 'invalid-request' };

      let report: unknown;
      try {
        report = await collectDesktopManagedWorkspaceInventory({
          workDir: deps.getWorkDir(),
          installationId: await deps.getInstallationId(),
          retentionWindowMs: await deps.getRetentionWindowMs(),
          sources: { ...deps.sources, loadProvenance: deps.loadProvenance },
        });
      } catch {
        // Deliberately unclassified beyond the code: the underlying message
        // carries canonical local paths and authority identifiers.
        return { ok: false, errorCode: 'inventory-unavailable' };
      }

      let validated: ReturnType<typeof parseManagedWorkspaceInventoryReport> = null;
      try {
        validated = parseManagedWorkspaceInventoryReport(report);
      } catch {
        return { ok: false, errorCode: 'inventory-unprovable' };
      }
      if (!validated) return { ok: false, errorCode: 'inventory-unprovable' };
      return { ok: true, report: validated };
    }
  );
}
