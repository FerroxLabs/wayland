/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-2 - durable workspaces for recurring tasks.
 *
 * Recurrence implies durability. A `new_conversation` job carries no
 * `agentConfig.workspace`, so `buildConversationForJob` persists
 * `extra.workspace = ''` and `buildWorkspaceWidthFiles` mints a fresh
 * `wcore-temp-<ts>` on every fire. Run 2 therefore cannot see run 1's output,
 * which is exactly what a routine that diffs against its own history needs.
 * All 12 bundled routines are seeded in that mode.
 *
 * Fresh CONVERSATION is useful; fresh WORKSPACE never is. So the job keeps
 * `new_conversation` mode and gains one durable task root, allocated the first
 * time the job is actually armed - never at seed time, because a dozen folders
 * for routines nobody enabled is user-hostile.
 *
 * The allocation is returned as a metadata patch rather than written here, so
 * the caller can persist it in the SAME repository update as the enable. Two
 * writes would let a crash arm a job that is still stateless.
 */

import { allocateWorkspace } from '@process/services/projectWorkspace';
import { CRON_ROUTINE_KIND, type CronJob } from './CronStore';

/** True when this job is one of the Wayland-shipped bundled routines. */
export function isBundledRoutineJob(job: CronJob): boolean {
  return job.metadata.agentConfig?.configOptions?.kind === CRON_ROUTINE_KIND;
}

/**
 * True when arming this job would otherwise give it a throwaway workspace per
 * run: `new_conversation` mode, an agentConfig to write the workspace into, and
 * no workspace chosen yet.
 */
export function jobNeedsDurableWorkspace(job: CronJob): boolean {
  if (job.target.executionMode !== 'new_conversation') return false;
  const config = job.metadata.agentConfig;
  if (!config) return false;
  return !config.workspace;
}

/**
 * Allocate the durable task root and return the metadata to persist, or null
 * when the job does not need one.
 *
 * Throws on allocation failure ON PURPOSE. The caller aborts the enable, which
 * is the honest outcome: an armed routine with no durable workspace is the bug
 * this fixes, so silently arming it anyway would reintroduce it under a
 * different cause.
 */
export async function durableWorkspaceMetadataForJob(job: CronJob): Promise<CronJob['metadata'] | null> {
  if (!jobNeedsDurableWorkspace(job)) return null;
  const allocated = await allocateWorkspace(job.name, { ownerKind: 'task', ownerId: job.id });
  return {
    ...job.metadata,
    agentConfig: {
      ...job.metadata.agentConfig!,
      workspace: allocated.dir,
      // The marker id, not the path, is what a later run compares against
      // (P2-10). Absent when the marker could not be written.
      ...(allocated.marker ? { workspaceId: allocated.marker.workspaceId } : {}),
    },
  };
}
