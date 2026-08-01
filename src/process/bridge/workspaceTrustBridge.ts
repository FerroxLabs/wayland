/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bridge for the #671 per-workspace access axis. The legacy
 * `workspaceTrust.get` / `workspaceTrust.set` wire names remain stable while
 * payloads normalize to `ask` / `trusted-edits`. Seeds the in-memory
 * gate cache once on init so the approval gates read the persisted level from
 * the first tool call.
 *
 * SECURITY: both providers are denied to remote WS peers at the wire by the
 * `workspaceTrust.` REMOTE_DENIED_PREFIXES entry (bridgeAllowlist.ts). Handlers
 * never throw: a get failure resolves to fail-safe `ask`; a set failure is
 * swallowed inside the store (the in-memory choice still applies this session).
 */

import { ipcBridge } from '@/common';
import { DEFAULT_WORKSPACE_ACCESS_LEVEL } from '@/common/security/workspaceTrust';
import { getWorkspaceAccess, setWorkspaceAccess, hydrateWorkspaceTrust } from '@process/permissions/workspaceTrust';

let initialized = false;

export function initWorkspaceTrustBridge(): void {
  if (initialized) return;
  initialized = true;

  // Seed the process-global cache from ProcessConfig once, so the sync gate
  // lookups see persisted access levels immediately (fail-safe `ask` meanwhile).
  void hydrateWorkspaceTrust();

  ipcBridge.workspaceTrust.get.provider(async ({ workspace }) => {
    try {
      return await getWorkspaceAccess(workspace);
    } catch (err) {
      console.error('[workspaceTrust] get failed', { err });
      return DEFAULT_WORKSPACE_ACCESS_LEVEL;
    }
  });

  ipcBridge.workspaceTrust.set.provider(async ({ workspace, level }) => {
    await setWorkspaceAccess(workspace, level);
  });
}
