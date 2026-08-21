/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The shapes the Settings surface exchanges with the main process over IPC.
 *
 * Kept apart from `folderGrants.ts` (the durable vocabulary) because these
 * types describe a VIEW and its outcomes, not the record. The record is what
 * the store persists; this is what a human is shown and what they get back
 * when they act.
 *
 * EVERY result here is a classified VALUE, never a rejection. The IPC bridge
 * has no reject and no timeout - `invoke` is `new Promise(resolve => …)` and
 * the provider side is `handler(data).then(cb)` with no `.catch` - so a
 * throwing provider is a promise that never settles and a card that spins
 * forever with neither its `catch` nor its `finally` running. Same reason
 * `workspaceRetentionBridge` returns `{ ok: false, errorCode }`.
 */

import type { FolderGrant, FolderGrantRefusal } from './folderGrants';

/**
 * One workspace's row in "Folders this workspace may reach".
 *
 * `displayName` / `workspaceDir` are RESOLVED, not stored: the durable list is
 * keyed by workspace id precisely because a folder can be renamed or moved, so
 * the human-readable half is looked up fresh from the identity markers on each
 * read. Both are null for a workspace whose folder no longer carries its
 * marker - the grants are still listed, and still removable, because an entry
 * nobody can account for is exactly the entry a user most needs to revoke.
 */
export interface FolderGrantWorkspaceView {
  workspaceId: string;
  displayName: string | null;
  workspaceDir: string | null;
  grants: readonly FolderGrant[];
}

export type FolderGrantListResult =
  | Readonly<{ ok: true; workspaces: readonly FolderGrantWorkspaceView[] }>
  | Readonly<{ ok: false; errorCode: 'unavailable' }>;

/**
 * The outcome of removing one entry.
 *
 * `liveSessionsRevoked` / `liveSessionsFailed` are reported rather than
 * summarised into a boolean because a removal that edited the file but could
 * not reach a running engine is NOT the same event as a clean revoke, and the
 * user is entitled to know which one happened before they close the window.
 */
export type FolderGrantRemoveResult =
  | Readonly<{ ok: true; removed: boolean; liveSessionsRevoked: number; liveSessionsFailed: number }>
  | Readonly<{ ok: false; errorCode: 'invalid-request' | 'unavailable' }>;

/**
 * The outcome of adding a folder from Settings.
 *
 * `cancelled` is a first-class outcome, not an error: the native picker being
 * dismissed is the most common ending and must stay silent.
 */
export type FolderGrantPickResult =
  | Readonly<{ ok: true; root: string; created: boolean }>
  | Readonly<{ ok: false; reason: 'cancelled' }>
  | Readonly<{ ok: false; reason: 'refused'; refusal: FolderGrantRefusal }>
  | Readonly<{ ok: false; reason: 'unavailable' }>;
