/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ApprovalPersistence - durable, per-workspace backing store for the ACP
 * PermissionResolver "allow always" cache (#672, part of the #656 audit).
 *
 * The live approval cache (PermissionResolver.ApprovalCache) is in-memory and
 * session-scoped, so a user who chose "allow always" for a command/path was
 * re-prompted after an app restart. This store persists those decisions to
 * ProcessConfig, keyed by workspace (the session cwd), and rehydrates them on
 * session start. It only ever holds explicit "allow always" grants — deny
 * decisions and one-time allows are never persisted.
 *
 * Main-process only (ProcessConfig is a main-process JSON config file).
 */

import { ProcessConfig } from '@process/utils/initStorage';
import { mainLog, mainError } from '@process/utils/mainLogger';

const CONFIG_KEY = 'acp.workspaceApprovals' as const;

/** In-memory-typed view of the persisted structure: workspace → (approvalKey → optionId). */
type WorkspaceApprovals = Record<string, Record<string, string>>;

async function readAll(): Promise<WorkspaceApprovals> {
  const stored = await ProcessConfig.get(CONFIG_KEY).catch((): undefined => undefined);
  return stored && typeof stored === 'object' ? stored : {};
}

/**
 * Load the persisted "allow always" entries for a workspace as [approvalKey,
 * optionId] pairs, ready to seed a PermissionResolver cache. Returns an empty
 * list on any read error (persistence must never block a session from starting).
 */
export async function loadWorkspaceApprovals(workspace: string | undefined): Promise<Array<[string, string]>> {
  if (!workspace) return [];
  try {
    const all = await readAll();
    const forWorkspace = all[workspace];
    return forWorkspace ? Object.entries(forWorkspace) : [];
  } catch (err) {
    mainError(
      '[ApprovalPersistence]',
      'loadWorkspaceApprovals failed',
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
}

/**
 * Durably record an "allow always" decision for a workspace. A no-op when the
 * workspace is unknown. Failures are logged, never thrown: losing a persist
 * write only means the user is re-prompted next session (the pre-#672 behavior),
 * which must never break the in-memory fast path or the turn.
 */
export async function saveWorkspaceApproval(
  workspace: string | undefined,
  approvalKey: string,
  optionId: string
): Promise<void> {
  if (!workspace) return;
  try {
    const all = await readAll();
    const forWorkspace = { ...all[workspace] };
    if (forWorkspace[approvalKey] === optionId) return; // already persisted - avoid a redundant write
    forWorkspace[approvalKey] = optionId;
    await ProcessConfig.set(CONFIG_KEY, { ...all, [workspace]: forWorkspace });
  } catch (err) {
    mainError(
      '[ApprovalPersistence]',
      'saveWorkspaceApproval failed',
      err instanceof Error ? err.message : String(err)
    );
  }
}

/**
 * Clear all persisted approvals for a workspace (the "can be cleared" path).
 * Exposed for a future revoke affordance; not wired to any auto-clear so the
 * whole point of persistence isn't defeated by a session reset.
 */
export async function clearWorkspaceApprovals(workspace: string | undefined): Promise<void> {
  if (!workspace) return;
  try {
    const all = await readAll();
    if (!(workspace in all)) return;
    const next = { ...all };
    delete next[workspace];
    await ProcessConfig.set(CONFIG_KEY, next);
    mainLog('[ApprovalPersistence]', `cleared persisted approvals for workspace`);
  } catch (err) {
    mainError(
      '[ApprovalPersistence]',
      'clearWorkspaceApprovals failed',
      err instanceof Error ? err.message : String(err)
    );
  }
}
