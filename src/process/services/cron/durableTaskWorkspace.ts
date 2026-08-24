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

import { isChatNamespace } from '@process/services/artifacts/artifactLedger';
import { allocateWorkspace } from '@process/services/projectWorkspace';
import { checkWorkspaceIdentity, type WorkspaceIdentityStatus } from '@process/services/workspaceIdentity';
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

/** A workspace problem found before a run started. `null` means "safe to run". */
export type JobWorkspaceProblem = Readonly<{
  status: Exclude<WorkspaceIdentityStatus, 'ok'>;
  workspace: string;
}>;

/**
 * P2-10: stat the job's workspace before every run and compare its identity.
 *
 * `agentConfig.workspace` is validated nowhere and `WCoreManager` has no mkdir
 * or existsSync at all, so a run against a deleted folder behaves however the
 * engine happens to behave, and a run against a REPLACED folder writes into a
 * stranger's directory. Both matter here because the folder is the user's, in
 * their Documents, holding the reports the task exists to produce.
 *
 * Returns the problem, and deliberately does NOT fix it. Recreating the folder
 * would make a workspace whose history was lost indistinguishable from a healthy
 * one, and the three recoveries - recreate empty, pick another folder, turn the
 * task off - are the user's to choose.
 *
 * A workspace with no recorded `workspaceId` (allocated before markers existed,
 * or picked by the user) is only checked for existence: there is nothing to
 * compare against and a comparison must not be invented.
 */
export async function preflightJobWorkspace(job: CronJob): Promise<JobWorkspaceProblem | null> {
  const workspace = job.metadata.agentConfig?.workspace;
  if (!workspace) return null;
  const { status } = await checkWorkspaceIdentity(workspace, job.metadata.agentConfig?.workspaceId ?? null);
  return status === 'ok' ? null : { status, workspace };
}

/**
 * Which `artifacts/<series>/` directory this job publishes into.
 *
 * A recurring task needs ONE stable folder name for its whole history, and the
 * four bundled routines that read a prior run already name theirs in a prompt
 * baked at seed time (`artifacts/ops/last-weekly-review.md`). So the seeder
 * records the routine's own series and this reads it back; a job with none -
 * a task the user made from a chat - falls back to its id, which is stable for
 * the life of the job and is what "one folder per task" means when the task
 * never declared a domain.
 *
 * Sanitised because the value becomes a path segment the user sees in Finder,
 * and dot-leading is refused because `.staging` and `.latest.json` already mean
 * something inside a series directory.
 */
export function artifactSeriesForJob(job: CronJob): string {
  const declared = job.metadata.agentConfig?.configOptions?.artifactSeries;
  return sanitizeSeriesName(declared) ?? sanitizeSeriesName(job.id) ?? 'task';
}

/** One safe path segment, or null when nothing usable survives. */
export function sanitizeSeriesName(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/^[^A-Za-z0-9]+/, '')
    .slice(0, 64)
    .replace(/[-.]+$/, '');
  if (cleaned.length === 0) return null;
  // T1: `artifacts/chat/` is the interactive-chat namespace. A job whose id or
  // declared series sanitises down to it would publish into - and retire stale
  // aliases inside - a directory holding the user's own chat deliverables.
  if (isChatNamespace(cleaned)) return null;
  return cleaned;
}
