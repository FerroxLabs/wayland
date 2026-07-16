/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDriver } from '../database/drivers/createDriver';
import { readDatabaseSchemaVersionStrict } from './startupCompatibility';
import type { RestoredDatabaseValidation } from './isolatedRecovery';

function integrityResult(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 1) return null;
  const row = value[0];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const fields = Object.values(row as Record<string, unknown>);
  return fields.length === 1 && typeof fields[0] === 'string' ? fields[0] : null;
}

/** Validate an isolated mutable copy; this never opens the live database. */
export async function validateRestoredDatabase(
  databasePath: string,
  expectedSchemaVersion: number
): Promise<RestoredDatabaseValidation> {
  const driver = await createDriver(databasePath, { fileMustExist: true });
  try {
    const schemaVersion = readDatabaseSchemaVersionStrict(driver);
    if (schemaVersion !== expectedSchemaVersion) {
      throw new Error(`Restored database schema mismatch (${schemaVersion} != ${expectedSchemaVersion}).`);
    }
    const integrity = integrityResult(driver.pragma('integrity_check'));
    if (integrity !== 'ok') throw new Error(`Restored database integrity check failed: ${integrity ?? 'invalid result'}`);
    return { schemaVersion, integrity: 'ok' };
  } finally {
    driver.close();
  }
}
