/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * H6 - which workspace identity an edited task should keep.
 *
 * `CreateTaskDialog.resolveAgentConfig` rebuilds `agentConfig` out of form
 * state. `workspaceId` is not form state - it is the id inside the folder's own
 * `.wayland-workspace.json`, written by the allocator - so every edit dropped
 * it, and `checkWorkspaceIdentity` silently degraded from "is this still the
 * same folder" to "does something exist at this path". The task would then
 * write into whatever the user later moved there. Nothing about that failure is
 * visible: the task keeps running.
 *
 * Carrying the id across unconditionally would be the opposite bug. If the user
 * repoints the task at a DIFFERENT folder, the old id describes the old folder,
 * every future preflight reports a mismatch, and the task refuses to run
 * forever. So the id survives only while it still describes the chosen path;
 * the new folder gets its identity from the allocator, not from here.
 */
export function preservedWorkspaceId(
  prior: { workspace?: string; workspaceId?: string } | undefined,
  workspace: string | undefined
): string | undefined {
  if (!prior?.workspaceId) return undefined;
  if (!workspace || prior.workspace !== workspace) return undefined;
  return prior.workspaceId;
}
