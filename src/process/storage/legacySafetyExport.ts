/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { backupExport } from './backupExport';

export type LegacySafetyExportOptions = {
  userData: string;
  passphrase?: string;
  now?: Date;
};

/**
 * Create and atomically publish the matching legacy-file recovery artifact
 * required before a legacy import may overwrite live files.
 *
 * This is intentionally stored under userData/recovery rather than a temporary
 * directory: a successful import must not destroy its own rollback evidence.
 * It is still explicitly non-authoritative for the primary database, Core, and
 * external workspaces because backupExport's manifest says so.
 */
export async function createLegacySafetyExport(opts: LegacySafetyExportOptions): Promise<string> {
  const recoveryDir = path.join(opts.userData, 'recovery', 'legacy-file-imports');
  fs.mkdirSync(recoveryDir, { recursive: true });

  const timestamp = (opts.now ?? new Date()).toISOString().replace(/[:.]/g, '-');
  const finalPath = path.join(recoveryDir, `pre-restore-${timestamp}-${randomUUID()}.zip`);
  const incompletePath = `${finalPath}.incomplete`;
  try {
    await backupExport({
      userData: opts.userData,
      destPath: incompletePath,
      includeKeys: Boolean(opts.passphrase),
      passphrase: opts.passphrase,
    });
    fs.renameSync(incompletePath, finalPath);
    return finalPath;
  } catch (error) {
    fs.rmSync(incompletePath, { force: true });
    throw error;
  }
}
