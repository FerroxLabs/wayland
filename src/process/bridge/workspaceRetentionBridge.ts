/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { parseManagedWorkspaceInventoryReport } from '@/common/types/managedWorkspaceRetention';
import {
  collectDesktopManagedWorkspaceInventory,
  type DesktopManagedWorkspaceAuthoritySources,
} from '@process/services/desktopManagedWorkspaceInventory';
import type { ManagedWorkspaceProvenanceLoad } from '@process/services/managedWorkspaceProvenance';

export type WorkspaceRetentionBridgeDependencies = {
  getWorkDir: () => string;
  getInstallationId: () => Promise<string>;
  loadProvenance: () => Promise<ManagedWorkspaceProvenanceLoad>;
  sources: Omit<DesktopManagedWorkspaceAuthoritySources, 'loadProvenance'>;
};

/**
 * Register the local-human dry-run provider. This bridge deliberately exposes
 * no quarantine, delete, rename, or mutation provider.
 */
export function initWorkspaceRetentionBridge(deps: WorkspaceRetentionBridgeDependencies): void {
  ipcBridge.workspaceRetention.preview.provider(async (request?: unknown) => {
    // This provider deliberately has no renderer-controlled request surface.
    // Reject rather than ignore fields so a future caller cannot smuggle a
    // path, root, classification, or mutation intent across the boundary.
    if (request !== undefined) {
      throw new TypeError('workspace retention preview does not accept request fields');
    }
    const report = await collectDesktopManagedWorkspaceInventory({
      workDir: deps.getWorkDir(),
      installationId: await deps.getInstallationId(),
      sources: { ...deps.sources, loadProvenance: deps.loadProvenance },
    });
    const validated = parseManagedWorkspaceInventoryReport(report);
    if (!validated) throw new Error('workspace retention produced an invalid report');
    return validated;
  });
}
