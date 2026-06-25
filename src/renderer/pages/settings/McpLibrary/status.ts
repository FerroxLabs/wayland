/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IMcpServer } from '@/common/config/storage';
import type { McpOAuthStatus } from '@renderer/hooks/mcp/useMcpOAuth';

/**
 * The 4-state UI status a server resolves to, shared by the Installed rows and
 * the Browse cards so both surfaces describe a server's health identically.
 *
 * - running: enabled + connected (the happy path)
 * - warn:    needs the user to sign in again (OAuth expired / never completed)
 * - error:   last connection attempt failed (see server.lastError for why)
 * - stopped: disabled by the user, or enabled-but-not-yet-connected (idle)
 */
export type UIStatus = 'running' | 'warn' | 'error' | 'stopped';

/**
 * Derive the UI status from the stored server record + its live OAuth status.
 * error short-circuits first, then warn (needsLogin), then running
 * (enabled + connected), else stopped (absorbs disconnected / testing / undefined).
 */
export function deriveStatus(s: IMcpServer, oauth: McpOAuthStatus | undefined): UIStatus {
  if (s.status === 'error') return 'error';
  if (oauth?.needsLogin === true) return 'warn';
  if (s.enabled === true && s.status === 'connected') return 'running';
  return 'stopped';
}

/** A status counts as "needs the user's attention" when it is broken or wants a sign-in. */
export function needsAttention(status: UIStatus): boolean {
  return status === 'error' || status === 'warn';
}
