/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import {
  collectDesktopManagedWorkspaceInventory,
  type DesktopManagedWorkspaceAuthoritySources,
} from '@process/services/desktopManagedWorkspaceInventory';

export type WorkspaceRetentionBridgeDependencies = {
  getWorkDir: () => string;
  sources: DesktopManagedWorkspaceAuthoritySources;
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
    return collectDesktopManagedWorkspaceInventory({
      workDir: deps.getWorkDir(),
      sources: deps.sources,
    });
  });
}
