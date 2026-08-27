/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DOES THE TEAM WORKSPACE ACTUALLY HOLD WHAT THE TEAMMATE SAYS IT WROTE? (#980)
 *
 * The leader's whole picture of a teammate's output is one sentence in a
 * mailbox message. There is no artifact channel between agents: `MailboxMessage`
 * carries free text, `TeamTask` has no deliverable field, and the
 * per-conversation artifact sweep that DOES compare a claim with the disk
 * (`chatRun` -> `savedFileClaims`) renders its verdict in the teammate's OWN
 * chat, which the leader never reads. So the control plane's belief and the
 * execution plane's filesystem were never compared, and a file that was never
 * written propagated to the leader as fact - the symptom this issue was left
 * open for.
 *
 * This module is the comparison. It reuses the extractor and the verdict table
 * from `savedFileClaims` rather than growing a second copy: a second copy is a
 * copy that drifts, and the drift here is a false accusation.
 *
 * PRECISION OVER RECALL, inherited deliberately. A wrong verdict contradicts a
 * truthful teammate in front of the leader, which is a worse product than the
 * bug. Two rules follow from that and are the only judgement this file adds:
 *
 *  - A claimed path that resolves OUTSIDE the workspace produces NO verdict.
 *    The host cannot honestly say a file it will not look at is missing, and it
 *    has no business stat-ing outside the jail to find out.
 *  - Any failure to read the workspace produces NO verdict. A check that fails
 *    must never become an accusation.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { findElsewhereInWorkspace } from '@process/services/artifacts/chatRun';
import {
  extractSavedFileClaims,
  reconcileSavedFileClaims,
  type SavedFileClaim,
  type UnsupportedSavedFileClaim,
} from '@process/services/artifacts/savedFileClaims';

/** Is `claimedPath`, read relative to `workspace`, a real file inside it? */
async function existsInWorkspace(workspace: string, claimedPath: string): Promise<boolean | 'outside'> {
  const resolved = path.resolve(workspace, claimedPath);
  const relative = path.relative(workspace, resolved);
  // `..` at the head, or an absolute remainder, means the claim names somewhere
  // the workspace does not contain. Never followed, never judged.
  if (relative.startsWith('..') || path.isAbsolute(relative)) return 'outside';
  try {
    return (await fs.stat(resolved)).isFile();
  } catch {
    return false;
  }
}

/**
 * Every deliverable `text` claims to have written that the team workspace does
 * not support, with the verdict the leader needs: `absent` (nothing of that name
 * anywhere under the workspace) or `elsewhere` (the file is real, and here is
 * where it actually is).
 *
 * An empty array is the common and the safe answer: no claim was made, every
 * claim checks out, or the check could not be run.
 */
export async function reconcileTeamMessageClaims(
  text: string,
  workspace: string
): Promise<UnsupportedSavedFileClaim[]> {
  if (typeof text !== 'string' || text.length === 0) return [];
  if (typeof workspace !== 'string' || !path.isAbsolute(workspace)) return [];

  const claims = extractSavedFileClaims(text);
  if (claims.length === 0) return [];

  try {
    // A workspace that is not a readable directory is not a workspace this
    // check can speak about.
    if (!(await fs.stat(workspace)).isDirectory()) return [];

    const unaccounted: SavedFileClaim[] = [];
    for (const claim of claims) {
      // eslint-disable-next-line no-await-in-loop -- a handful of stats, bounded by MAX_CLAIMS in the extractor
      const found = await existsInWorkspace(workspace, claim.claimedPath);
      if (found === true || found === 'outside') continue;
      unaccounted.push(claim);
    }
    if (unaccounted.length === 0) return [];

    // No deliverables namespace to skip on this path - a team workspace has no
    // per-conversation reserved directory - so nothing is excluded from the walk.
    const elsewhere = await findElsewhereInWorkspace(workspace, '', unaccounted);
    return reconcileSavedFileClaims(unaccounted, { registered: [], elsewhere });
  } catch {
    return [];
  }
}

/**
 * The correction, in the leader's own reading order, or '' when there is
 * nothing to correct.
 *
 * Attributed to Wayland rather than written in the teammate's voice: the leader
 * is another agent, and a line it cannot tell apart from its teammate's report
 * is a line it may quote back as the teammate's.
 */
export function formatTeamClaimNotice(unsupported: readonly UnsupportedSavedFileClaim[]): string {
  if (unsupported.length === 0) return '';
  const lines = unsupported.map((claim) =>
    claim.verdict === 'elsewhere'
      ? `- ${claim.fileName} is at ${claim.actualPath}, not where this message says.`
      : `- ${claim.fileName} was not found anywhere in the team workspace. Do not treat it as delivered.`
  );
  return [
    '[Wayland] This message was checked against the team workspace and the following did not match:',
    ...lines,
  ].join('\n');
}

/** The message text as the leader should receive it: the report, plus any correction. */
export async function withReconciledClaims(text: string, workspace: string | undefined): Promise<string> {
  if (!workspace) return text;
  const notice = formatTeamClaimNotice(await reconcileTeamMessageClaims(text, workspace));
  return notice ? `${text}\n\n${notice}` : text;
}
