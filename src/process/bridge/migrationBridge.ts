/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bridge for the "Migrate from another tool" importer (#migrate). Wires the
 * renderer-facing `migrate.scan` / `migrate.apply` providers to the importer.
 * Both handlers never throw: a scan failure returns a not-detected plan; an
 * apply failure surfaces as a per-tool error so the UI always resolves.
 */

import { ipcBridge } from '@/common';
import { scanTool, applyMigration } from '@process/services/import/migration/migrationImporter';

let initialized = false;

export function initMigrationBridge(): void {
  if (initialized) return;
  initialized = true;

  ipcBridge.migrate.scan.provider(async ({ toolId }) => {
    try {
      return await scanTool(toolId);
    } catch (err) {
      console.error('[migrate] scan failed', { toolId, err });
      return { toolId, sourcePath: null, detected: false, items: [], warnings: [String(err)] };
    }
  });

  ipcBridge.migrate.apply.provider(async ({ toolId, selectedIds }) => {
    try {
      return await applyMigration(toolId, selectedIds);
    } catch (err) {
      console.error('[migrate] apply failed', { toolId, err });
      return { toolId, applied: 0, skipped: 0, errors: [{ label: toolId, reason: String(err) }] };
    }
  });
}
