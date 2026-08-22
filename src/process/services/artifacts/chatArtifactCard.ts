/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Turn a completed sweep into the card the user sees, and put it in the
 * conversation.
 *
 * DESKTOP-AUTHORED. `render_artifact` is a Core frame pinned by the contract
 * corpus; extending it with a path would be an engine change plus a corpus
 * re-import plus a contract pin bump. This message is written by the host, for
 * the host, after the host verified the files - so no engine or contract change
 * is involved at all.
 *
 * WHAT GOES ON THE CARD IS IDS AND DISPLAY TEXT. Every control on it sends an
 * `artifactId` back, and the host re-resolves and re-verifies from the ledger on
 * every click, so nothing here needs to be - or is - trusted later.
 *
 * ONE CARD PER CONVERSATION, REPLACED IN PLACE. `chatArtifactCardMsgId` is
 * derived from the conversation id, and turn 5's card therefore carries the same
 * `msg_id` as turn 3's. That is the message-level half of the same decision the
 * stable `runId` makes at the ledger level: the user asked for one report and
 * must end up with one card for it, not a fresh card stacking up under every
 * turn that touched the file.
 */

import type { TMessage } from '@/common/chat/chatLib';
import type { ArtifactRejectionReason, ArtifactSummary } from '@/common/types/artifacts';

import { toArtifactSummary } from './artifactActions';
import type { ChatSweepResult } from './chatRun';

/**
 * The card's stable message id.
 *
 * Namespaced so it can never collide with the assistant text message of any
 * turn, which would fragment streamed text into duplicate bubbles - the same
 * trap `activityMsgId` exists to avoid.
 */
export const chatArtifactCardMsgId = (conversationId: string): string => `artifact-card:${conversationId}`;

export interface ChatArtifactCardContent {
  artifacts: ArtifactSummary[];
  /**
   * Narrowed from `string` to the closed union ON PURPOSE.
   *
   * A `string` here is what let the card render `1 escapes-workspace` straight
   * to the user. With the union, the renderer folds each reason into one of
   * five translatable buckets, and a fourteenth reason added later fails to
   * COMPILE rather than reaching a screen as a raw slug.
   */
  rejected?: Array<{ reason: ArtifactRejectionReason; count: number }>;
}

/**
 * The card's content, or null when there is nothing worth showing.
 *
 * Newest first, so the file the user just asked about is the one at the top.
 */
export function buildChatArtifactCardContent(result: ChatSweepResult): ChatArtifactCardContent | null {
  const artifacts = result.registered
    .map((record) => toArtifactSummary(record))
    .toSorted((left, right) => right.runAt.localeCompare(left.runAt) || left.fileName.localeCompare(right.fileName));

  const counts = new Map<ArtifactRejectionReason, number>();
  for (const rejection of result.rejected) counts.set(rejection.reason, (counts.get(rejection.reason) ?? 0) + 1);
  const rejected = [...counts]
    .map(([reason, count]) => ({ reason, count }))
    .toSorted((left, right) => right.count - left.count || left.reason.localeCompare(right.reason));

  // An empty card is never written. A turn that produced nothing - which is
  // most turns - must leave no trace in the conversation at all.
  if (artifacts.length === 0 && rejected.length === 0) return null;
  return rejected.length > 0 ? { artifacts, rejected } : { artifacts };
}

/** The persisted message for a card, ready for `addMessage`. */
export function buildChatArtifactCardMessage(
  conversationId: string,
  content: ChatArtifactCardContent,
  now: number = Date.now()
): TMessage {
  const msgId = chatArtifactCardMsgId(conversationId);
  return {
    id: msgId,
    msg_id: msgId,
    type: 'artifact_card',
    position: 'left',
    conversation_id: conversationId,
    content,
    createdAt: now,
    status: 'finish',
  };
}
