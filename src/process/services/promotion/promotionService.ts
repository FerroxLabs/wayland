/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The promotion offer, wired to the real cron service, conversation store and
 * allocator.
 *
 * Everything the renderer sends is an ID. No filesystem path ever crosses the
 * bridge inbound: the source workspaces are read from the conversations the job
 * owns and the target is read from the promotion's own result, so a compromised
 * renderer cannot turn "import my earlier reports" into a read of an arbitrary
 * file or a write into an arbitrary folder.
 */

import path from 'node:path';
import { isManagedWorkspaceName } from '@/common/types/managedWorkspaceRetention';
import { allocateWorkspace } from '@process/services/projectWorkspace';
import type { TChatConversation } from '@/common/config/storage';
import {
  findEarlierRunDeliverables,
  importEarlierRunDeliverables,
  type DeliverableCandidate,
  type ImportFailure,
  type ImportedDeliverable,
  type ImportSelection,
} from './earlierRunDeliverables';
import {
  assessPromotion,
  promoteConversationWorkspace,
  type PromotionDeps,
  type PromotionOutcome,
  type PromotionRefusal,
} from './promoteConversationWorkspace';
import { defaultPromotionJournal } from './promotionJournal';

/**
 * H3 - one relative path segment sequence, and nothing that can mean anything
 * else.
 *
 * This is the SYNTACTIC half of the confinement. It is deliberately not the
 * whole answer: `path.resolve` does not resolve symlinks and `fs.lstat` only
 * declines to follow the FINAL component, so a lexically-inside path whose
 * ANCESTOR is a symlink (an agent can leave one in a chat workspace) still
 * escapes. The structural half - only ever accepting a path the OFFER itself
 * enumerated - is what closes that, in `runPromotion` below.
 *
 * `path.win32.isAbsolute` as well as the platform one, because the renderer is
 * untrusted input and a drive-letter path is not something a POSIX
 * `path.isAbsolute` recognises.
 */
export function isSafeRelPath(relPath: unknown): boolean {
  if (typeof relPath !== 'string' || relPath.length === 0) return false;
  if (relPath.includes('\0')) return false;
  if (path.isAbsolute(relPath) || path.win32.isAbsolute(relPath)) return false;
  const segments = relPath.split(/[\\/]/);
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

/** Which earlier-run file the user chose to keep. Ids only, never paths. */
export type KeepSelection = Readonly<{ conversationId: string; relPath: string }>;

export type PromotionOffer = Readonly<{
  eligible: boolean;
  refusal?: PromotionRefusal;
  /** Where the task runs today. Shown so the user knows what is being copied. */
  sourceWorkspace?: string;
  /** What the durable folder will be called. */
  targetName?: string;
  /** Files from runs that happened before promotion. The user picks. */
  earlierRuns: readonly DeliverableCandidate[];
  earlierRunsTruncated: boolean;
}>;

export type PromotionResult = Readonly<{
  outcome: PromotionOutcome;
  imported: readonly ImportedDeliverable[];
  importFailed: readonly ImportFailure[];
}>;

async function services() {
  const [{ cronService }, { conversationServiceSingleton }, { cronBusyGuard }] = await Promise.all([
    import('@process/services/cron/cronServiceSingleton'),
    import('@process/services/conversationServiceSingleton'),
    import('@process/services/cron/CronBusyGuard'),
  ]);
  return { cronService, conversations: conversationServiceSingleton, busyGuard: cronBusyGuard };
}

const workspaceOf = (conversation: TChatConversation | undefined): string =>
  typeof (conversation?.extra as { workspace?: unknown } | undefined)?.workspace === 'string'
    ? ((conversation!.extra as { workspace: string }).workspace || '').trim()
    : '';

/**
 * Conversations of this job that still sit in their own throwaway workspace.
 * The one being promoted is excluded: its files come across with the copy.
 */
async function earlierRunWorkspaces(
  jobId: string,
  excludeConversationId: string
): Promise<Array<{ conversationId: string; workspace: string; createdAtMs: number }>> {
  const { conversations } = await services();
  const children = await conversations.getConversationsByCronJob(jobId);
  const seen = new Set<string>();
  const result: Array<{ conversationId: string; workspace: string; createdAtMs: number }> = [];
  for (const child of children) {
    if (child.id === excludeConversationId) continue;
    const workspace = workspaceOf(child);
    if (!workspace || !isManagedWorkspaceName(path.basename(workspace))) continue;
    if (seen.has(workspace)) continue;
    seen.add(workspace);
    result.push({ conversationId: child.id, workspace, createdAtMs: child.createTime ?? 0 });
  }
  return result;
}

/** What to show the user BEFORE they accept. Touches nothing. */
export async function previewPromotion(input: { conversationId: string; jobId: string }): Promise<PromotionOffer> {
  const { cronService, conversations } = await services();
  const job = await cronService.getJob(input.jobId);
  const conversation = await conversations.getConversation(input.conversationId);
  const assessment = assessPromotion(job, conversation?.extra as Record<string, unknown> | undefined);
  const earlier = await findEarlierRunDeliverables({
    workspaces: await earlierRunWorkspaces(input.jobId, input.conversationId),
  });
  if (assessment.eligible !== true) {
    return {
      eligible: false,
      refusal: assessment.refusal,
      earlierRuns: earlier.candidates,
      earlierRunsTruncated: earlier.truncated,
    };
  }
  return {
    eligible: true,
    sourceWorkspace: assessment.sourceWorkspace,
    targetName: job!.name,
    earlierRuns: earlier.candidates,
    earlierRunsTruncated: earlier.truncated,
  };
}

export async function buildPromotionDeps(): Promise<PromotionDeps> {
  const { cronService, conversations, busyGuard } = await services();
  return {
    journal: defaultPromotionJournal(),
    getJob: (jobId) => cronService.getJob(jobId),
    setJobEnabled: async (jobId, enabled) => {
      await cronService.updateJob(jobId, { enabled });
    },
    isConversationBusy: (conversationId) => busyGuard.isProcessing(conversationId),
    getConversation: async (id) => {
      const conv = await conversations.getConversation(id);
      return conv ? { id: conv.id, extra: conv.extra as Record<string, unknown> } : undefined;
    },
    updateConversation: async (id, patch) => {
      await conversations.updateConversation(id, { extra: patch.extra } as Partial<TChatConversation>);
    },
    allocate: (displayName, options) => allocateWorkspace(displayName, options),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
}

/**
 * Promote, then bring across the earlier-run files the user kept. The import
 * is deliberately AFTER the promotion and separately reported: a failure to
 * copy an old report must not undo a promotion that already succeeded.
 */
export async function runPromotion(input: {
  conversationId: string;
  jobId: string;
  keep?: readonly KeepSelection[];
}): Promise<PromotionResult> {
  const outcome = await promoteConversationWorkspace(
    { conversationId: input.conversationId, jobId: input.jobId },
    await buildPromotionDeps()
  );
  if (!outcome.ok || !input.keep?.length) return { outcome, imported: [], importFailed: [] };

  // Resolve every source path HERE, from the job's own conversations, so a
  // renderer-supplied conversation id can never name a workspace this job does
  // not own.
  const workspaces = await earlierRunWorkspaces(input.jobId, input.conversationId);
  const allowed = new Map(workspaces.map((w) => [w.conversationId, w.workspace]));

  // H3: the conversationId was checked and the relPath was not, which left the
  // renderer naming any file it liked inside a workspace the job DOES own -
  // including through a symlinked ancestor, which no lexical check can see, and
  // including control files the picker deliberately hides.
  //
  // So re-derive the OFFER and accept only what it listed. That is the same
  // rule the rest of this seam already follows ("everything crossing the bridge
  // is an id"), applied to the one field that had been exempt: the candidate
  // list is built by a walk that lstats every entry, so it can contain nothing
  // but real regular files reachable without following a link.
  const offered = await findEarlierRunDeliverables({ workspaces });
  const offeredByConversation = new Map<string, Set<string>>();
  for (const candidate of offered.candidates) {
    const set = offeredByConversation.get(candidate.conversationId) ?? new Set<string>();
    set.add(candidate.relPath);
    offeredByConversation.set(candidate.conversationId, set);
  }

  const selections: ImportSelection[] = [];
  const refused: ImportFailure[] = [];
  for (const keep of input.keep) {
    const sourceWorkspace = allowed.get(keep.conversationId);
    // A conversation this job does not own was never a legal selection at all;
    // dropped silently, as before, rather than confirming it exists.
    if (!sourceWorkspace) continue;
    if (!isSafeRelPath(keep.relPath) || !offeredByConversation.get(keep.conversationId)?.has(keep.relPath)) {
      refused.push({ relPath: keep.relPath, reason: 'not-offered' });
      continue;
    }
    selections.push({ conversationId: keep.conversationId, sourceWorkspace, relPath: keep.relPath });
  }

  const result = await importEarlierRunDeliverables(outcome.workspace, selections);
  return { outcome, imported: result.imported, importFailed: [...refused, ...result.failed] };
}
