/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ISqliteDriver } from './drivers/ISqliteDriver';

/**
 * Atomically capture channel cleanup identity and delete a conversation.
 *
 * The source and session query deliberately run inside the same synchronous
 * transaction as DELETE, so stale bridge state cannot influence eligibility
 * and a failed delete cannot leave a cleanup intent behind.
 */
export function deleteConversationWithChannelCleanupIntent(
  db: ISqliteDriver,
  conversationId: string,
  createdAt = Date.now()
): boolean {
  const commit = db.transaction(() => {
    const conversation = db.prepare('SELECT source FROM conversations WHERE id = ?').get(conversationId) as
      | { source: string | null }
      | undefined;
    if (!conversation) return false;

    const sessionIds = (
      db
        .prepare('SELECT id FROM assistant_sessions WHERE conversation_id = ? ORDER BY id')
        .all(conversationId) as Array<{
        id: string;
      }>
    ).map(({ id }) => id);
    if ((conversation.source !== null && conversation.source !== 'wayland') || sessionIds.length > 0) {
      db.prepare(
        `INSERT OR IGNORE INTO conversation_channel_cleanup_intents
           (conversation_id, source, session_ids_json, created_at, attempt_count, last_attempt_at)
         VALUES (?, ?, ?, ?, 0, NULL)`
      ).run(conversationId, conversation.source, JSON.stringify(sessionIds), createdAt);
    }

    const result = db.prepare('DELETE FROM conversations WHERE id = ?').run(conversationId);
    return result.changes > 0;
  });
  return commit();
}
