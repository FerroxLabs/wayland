/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Append-only audit log for remote config-write / destructive actions
 * (remote-secure-config W0). Backed by the `audit_log` table (migration v51).
 *
 * W0 ships ONLY the table + this append helper. Consumers (the config-write
 * routes, the settings audit pane) wire up in later waves - nothing here is
 * called yet beyond its own tests.
 *
 * Writes are best-effort and never throw into the request path: an audit-store
 * failure must not break the action that was being audited (the action's own
 * gate already decided allow/deny). Failures are logged and swallowed.
 */

import { getDatabase } from '@process/services/database/export';
import type { ReachedVia } from '../middleware/detectNetworkContext';

export type AuditEntry = {
  /** Authenticated user id, or null when no session is attached. */
  userId: string | null;
  /** Stable verb id, e.g. 'provider.connect' / 'storage.restore'. */
  action: string;
  /** Object acted on (provider id, channel id, ...), or null. */
  target?: string | null;
  /** DIRECT socket peer (never req.ip / XFF), or null. */
  ip?: string | null;
  /** Network provenance from detectNetworkContext at action time. */
  reachedVia?: ReachedVia | null;
};

/**
 * Append one audit row. Best-effort: returns true on insert, false on failure
 * (never throws). Timestamp is server time in epoch ms.
 */
export async function appendAudit(entry: AuditEntry): Promise<boolean> {
  try {
    const db = await getDatabase();
    db.getDriver()
      .prepare(
        `INSERT INTO audit_log (user_id, action, target, ip, reached_via, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        entry.userId,
        entry.action,
        entry.target ?? null,
        entry.ip ?? null,
        entry.reachedVia ?? null,
        Date.now()
      );
    return true;
  } catch (error) {
    console.error('[audit] Failed to append audit entry:', error);
    return false;
  }
}
