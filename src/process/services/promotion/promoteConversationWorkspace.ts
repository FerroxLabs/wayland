/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * P2-4 - promotion of an existing chat's workspace to a durable one.
 *
 * OFFERED, never automatic, and never swept on upgrade. This is the one
 * operation in the milestone that copies the user's data, so the whole
 * protocol from section 4 of the plan lives here:
 *
 *  1. idempotency key = conversation id + job id (`promotionJournal`)
 *  2. journal the operation and its target BEFORE any bytes move
 *  3. fence the scheduler: pause the job, take the per-conversation lock the
 *     executor checks, and drain any in-flight run
 *  4. stage into `<target>.promoting-<operation-id>`, rename only when verified
 *  5. explicit copy semantics (`promotionCopy`)
 *  6. retry with quiesce on drift, never abort forever (`promotionCopy`)
 *  7. RESOLVE, don't repoint: lane A made the executor read the workspace from
 *     the conversation, so commit is ONE write. A job that names its own
 *     workspace is refused rather than turned into a three-store transaction.
 *  8. never touch a workspace the user actually chose
 *  9. leave the source completely intact
 * 10. never sweep-migrate
 *
 * On rule 8: `extra.customWorkspace` cannot carry the decision on its own -
 * `buildAgentConversationParams` defaults it to `true`, so every ordinary chat
 * persists `customWorkspace: true` on a throwaway `*-temp-*` directory. Taking
 * the flag literally would refuse exactly the chats promotion exists for. The
 * PATH is what disambiguates: a `*-temp-*` name is the app's own scratch
 * directory whatever the flag says, and anything else is the user's, so the
 * flag only decides which refusal to report.
 *
 * `.wayland-core/` is excluded from the copy. It is regenerated machinery -
 * skills are COPIED into every workspace, not symlinked - and `~/Documents` is
 * iCloud-synced by default, so promoting it would upload the whole bundled
 * skill tree per task. Deliverables that pre-fix runs wrote INSIDE it are
 * recovered by the earlier-runs harvest, which shows them to the user first.
 */

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isManagedWorkspaceName } from '@/common/types/managedWorkspaceRetention';
import type { AllocatedWorkspace, AllocateWorkspaceOptions } from '@process/services/projectWorkspace';
import {
  readWorkspaceMarker,
  writeWorkspaceMarker,
  WORKSPACE_MARKER_FILE,
} from '@process/services/workspaceIdentity';
import type { CronJob } from '@process/services/cron/CronStore';
import { buildTreeManifest, copyTreeVerified, diffManifests, type CopyTreeOptions, type SkippedEntry } from './promotionCopy';
import { promotionKey, type PromotionJournal, type PromotionRecord } from './promotionJournal';
import { acquirePromotionLock, releasePromotionLock } from './promotionLock';

const PROMOTION_EXCLUDES = new Set(['.wayland-core', WORKSPACE_MARKER_FILE]);
const DEFAULT_DRAIN_TIMEOUT_MS = 30_000;
const DRAIN_POLL_MS = 100;

export type PromotionRefusal =
  | 'job-missing'
  | 'job-owns-workspace'
  | 'conversation-missing'
  | 'no-workspace'
  | 'already-durable'
  | 'user-chosen-workspace'
  | 'promotion-in-progress'
  | 'run-in-flight';

export type PromotionOutcome =
  | {
      ok: true;
      workspace: string;
      workspaceId: string | null;
      sourceWorkspace: string;
      skipped: readonly SkippedEntry[];
      alreadyPromoted: boolean;
    }
  | { ok: false; refusal: PromotionRefusal };

export type PromotionAssessment =
  | { eligible: true; sourceWorkspace: string }
  | { eligible: false; refusal: PromotionRefusal };

/**
 * The eligibility rules, shared by the offer (which must not touch anything)
 * and by the promotion itself. Keeping one copy is the point: an offer that
 * disagrees with what promotion will do is an offer that fails on accept.
 */
export function assessPromotion(
  job: CronJob | null,
  extra: Record<string, unknown> | undefined
): PromotionAssessment {
  if (!job) return { eligible: false, refusal: 'job-missing' };
  // Rule 7: commit has to stay ONE write. A job that names its own workspace
  // would need the CronStore updated too, which is the multi-store transaction
  // a crash can leave disagreeing - and P2-2 already gives those jobs a durable
  // workspace, so there is nothing here to fix.
  if (job.metadata.agentConfig?.workspace) return { eligible: false, refusal: 'job-owns-workspace' };
  if (!extra) return { eligible: false, refusal: 'conversation-missing' };
  const source = typeof extra.workspace === 'string' ? extra.workspace.trim() : '';
  if (!source) return { eligible: false, refusal: 'no-workspace' };
  if (!isManagedWorkspaceName(path.basename(source))) {
    // Rule 8. Not a `*-temp-*` name, so it is not the app's scratch directory:
    // either the user picked it or it is already durable. Either way, hands off.
    return { eligible: false, refusal: extra.customWorkspace === true ? 'user-chosen-workspace' : 'already-durable' };
  }
  return { eligible: true, sourceWorkspace: source };
}

export type PromotionDeps = {
  journal: PromotionJournal;
  getJob(jobId: string): Promise<CronJob | null>;
  setJobEnabled(jobId: string, enabled: boolean): Promise<void>;
  isConversationBusy(conversationId: string): boolean;
  getConversation(id: string): Promise<{ id: string; extra?: Record<string, unknown> } | undefined>;
  updateConversation(id: string, patch: { extra: Record<string, unknown> }): Promise<void>;
  allocate(displayName: string, options: AllocateWorkspaceOptions): Promise<AllocatedWorkspace>;
  sleep(ms: number): Promise<void>;
  drainTimeoutMs?: number;
  copyOptions?: CopyTreeOptions;
};

const exists = async (p: string): Promise<boolean> => !!(await fs.stat(p).catch((): null => null));

/** True when `dir` holds nothing but the identity marker we just stamped into it. */
async function holdsOnlyMarker(dir: string): Promise<boolean> {
  const entries = await fs.readdir(dir).catch((): null => null);
  if (!entries) return false;
  return entries.every((name: string) => name === WORKSPACE_MARKER_FILE);
}

export async function promoteConversationWorkspace(
  input: { conversationId: string; jobId: string },
  deps: PromotionDeps
): Promise<PromotionOutcome> {
  const { conversationId, jobId } = input;
  if (!acquirePromotionLock(conversationId)) return { ok: false, refusal: 'promotion-in-progress' };
  try {
    return await run(input, deps);
  } finally {
    releasePromotionLock(conversationId);
  }
}

async function run(
  input: { conversationId: string; jobId: string },
  deps: PromotionDeps
): Promise<PromotionOutcome> {
  const { conversationId, jobId } = input;
  const key = promotionKey(conversationId, jobId);

  // Rule 1. A second accept must return the first accept's answer, not allocate
  // a second folder, copy into it, and leave one of them unreferenced in the
  // user's Documents with nothing able to explain what it is.
  const prior = await deps.journal.read(key);
  if (prior?.state === 'committed') {
    return {
      ok: true,
      workspace: prior.targetWorkspace,
      workspaceId: prior.workspaceId,
      sourceWorkspace: prior.sourceWorkspace,
      skipped: prior.skipped ?? [],
      alreadyPromoted: true,
    };
  }

  const job = await deps.getJob(jobId);
  const conversation = job ? await deps.getConversation(conversationId) : undefined;
  const extra = conversation?.extra ?? (conversation ? {} : undefined);
  const assessment = assessPromotion(job, extra);
  if (assessment.eligible !== true) return { ok: false, refusal: assessment.refusal };
  const source = assessment.sourceWorkspace;

  const wasEnabled = job!.enabled;
  if (wasEnabled) await deps.setJobEnabled(jobId, false);
  try {
    if (!(await drain(conversationId, deps))) return { ok: false, refusal: 'run-in-flight' };

    // Rule 2. An interrupted attempt is RESUMED against the folder it already
    // allocated. Without this the retry allocates `<name> (2)`, copies into it,
    // and abandons the first - a complete, unexplained duplicate of the user's
    // reports sitting in Finder. `aborted` records cleaned up after themselves,
    // so those start fresh.
    const resumable = prior && prior.state !== 'aborted' ? { ...prior, sourceWorkspace: source } : null;
    let record: PromotionRecord;
    if (resumable) {
      record = resumable;
    } else {
      const allocated = await deps.allocate(job!.name, { ownerKind: 'task', ownerId: jobId });
      const operationId = randomUUID();
      record = {
        schemaVersion: 1,
        key,
        operationId,
        conversationId,
        jobId,
        sourceWorkspace: source,
        targetWorkspace: allocated.dir,
        stagingDir: `${allocated.dir}.promoting-${operationId}`,
        workspaceId: allocated.marker?.workspaceId ?? null,
        state: 'staged',
        startedAtMs: Date.now(),
      };
      // JOURNAL FIRST: the target is durable before a single byte is copied.
      await deps.journal.write(record);
    }

    let skipped: readonly SkippedEntry[] = [];
    try {
      if (await alreadyPublished(record)) {
        // The crash landed between the rename and the commit. The tree is the
        // published one; re-copying would refuse it as "target is not empty".
        skipped = record.skipped ?? [];
        await fs.rm(record.stagingDir, { recursive: true, force: true }).catch((): undefined => undefined);
      } else {
        skipped = await stage(record, deps);
        record = { ...record, state: 'copied', skipped };
        await deps.journal.write(record);
        await publish(record);
      }
    } catch (err) {
      await abort(record, deps, err instanceof Error ? err.message : String(err));
      throw err;
    }

    await deps.updateConversation(conversationId, {
      extra: { ...extra, workspace: record.targetWorkspace, customWorkspace: true, workspaceId: record.workspaceId },
    });
    await deps.journal.write({ ...record, state: 'committed', finishedAtMs: Date.now() });

    return {
      ok: true,
      workspace: record.targetWorkspace,
      workspaceId: record.workspaceId,
      sourceWorkspace: source,
      skipped,
      alreadyPromoted: false,
    };
  } finally {
    if (wasEnabled) await deps.setJobEnabled(jobId, true);
  }
}

/** Wait for any in-flight run of this conversation to finish. */
async function drain(conversationId: string, deps: PromotionDeps): Promise<boolean> {
  const deadline = Date.now() + (deps.drainTimeoutMs ?? DEFAULT_DRAIN_TIMEOUT_MS);
  while (deps.isConversationBusy(conversationId)) {
    if (Date.now() >= deadline) return false;
    await deps.sleep(DRAIN_POLL_MS);
  }
  return true;
}

/** Copy into the staging tree and prove it matches, marker included. */
async function stage(record: PromotionRecord, deps: PromotionDeps): Promise<readonly SkippedEntry[]> {
  await fs.rm(record.stagingDir, { recursive: true, force: true });
  const exclude = (rel: string) => PROMOTION_EXCLUDES.has(rel);
  const copied = await copyTreeVerified(record.sourceWorkspace, record.stagingDir, {
    ...deps.copyOptions,
    exclude,
  });
  const verified = await buildTreeManifest(record.stagingDir, { exclude });
  const problems = diffManifests(copied.manifest, verified.manifest);
  if (problems.length > 0) throw new Error(`promotion copy failed verification: ${problems.join(', ')}`);

  const marker = await readWorkspaceMarker(record.targetWorkspace);
  if (marker) await writeWorkspaceMarker(record.stagingDir, marker);
  return copied.skipped;
}

/**
 * True when a previous attempt already renamed its verified staging tree into
 * place: the target holds real content rather than just the allocation marker.
 */
async function alreadyPublished(record: PromotionRecord): Promise<boolean> {
  if (record.state !== 'copied') return false;
  if (!(await exists(record.targetWorkspace))) return false;
  return !(await holdsOnlyMarker(record.targetWorkspace));
}

/** Rule 4: only a verified tree ever gets the real name. */
async function publish(record: PromotionRecord): Promise<void> {
  if (await exists(record.targetWorkspace)) {
    if (!(await holdsOnlyMarker(record.targetWorkspace))) {
      throw new Error(`promotion target is not empty: ${record.targetWorkspace}`);
    }
    await fs.rm(record.targetWorkspace, { recursive: true, force: true });
  }
  await fs.rename(record.stagingDir, record.targetWorkspace);
}

/** Leave no partial tree in Documents, and do not burn the folder name. */
async function abort(record: PromotionRecord, deps: PromotionDeps, error: string): Promise<void> {
  await fs.rm(record.stagingDir, { recursive: true, force: true }).catch((): undefined => undefined);
  if (await holdsOnlyMarker(record.targetWorkspace)) {
    await fs.rm(record.targetWorkspace, { recursive: true, force: true }).catch((): undefined => undefined);
  }
  await deps.journal.write({ ...record, state: 'aborted', error, finishedAtMs: Date.now() });
}

