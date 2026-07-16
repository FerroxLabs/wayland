/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reset is deliberately fail-closed until Desktop can create and prove an
 * authoritative recovery point that includes the live SQLite database,
 * credentials, Core profiles, and external-state references.
 *
 * A file manifest or the legacy file-only export is not a recovery point and
 * must never authorize deletion. Keep this process-side refusal even while the
 * renderer control is disabled so a stale or compromised renderer cannot call
 * the old irreversible wipe path directly.
 */
export async function resetAll(_userData: string, _logsDir: string): Promise<never> {
  throw new Error('RESET_RECOVERY_POINT_REQUIRED');
}
