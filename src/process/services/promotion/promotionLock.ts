/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Promotion fence (protocol rule 3).
 *
 * Pausing the job is not enough and neither is reading a busy counter: a fire
 * that croner has already scheduled but not yet dispatched reads as zero
 * activity, so the run starts mid-copy and writes its report into the OLD
 * workspace AFTER the digest pass has been over it. The deliverable is then
 * silently absent from the folder the user was just told is theirs.
 *
 * So the executor asks this module, at the moment it resolves a conversation
 * for a run, whether that conversation is being promoted - and refuses. A
 * skipped run is recoverable; a lost report is not.
 *
 * In-process state is sufficient: cron dispatch and promotion both live in the
 * main process, and a crash releases the lock, which is correct because a
 * crashed promotion is resumed from the journal rather than continued.
 */

const promoting = new Set<string>();

export class ConversationPromotingError extends Error {
  constructor(readonly conversationId: string) {
    super(`Conversation ${conversationId} is being promoted to a durable workspace`);
    this.name = 'ConversationPromotingError';
  }
}

/** False when another promotion already holds the conversation. */
export function acquirePromotionLock(conversationId: string): boolean {
  if (promoting.has(conversationId)) return false;
  promoting.add(conversationId);
  return true;
}

export function releasePromotionLock(conversationId: string): void {
  promoting.delete(conversationId);
}

export function isPromotionInProgress(conversationId: string): boolean {
  return promoting.has(conversationId);
}

/** Throws when `conversationId` is fenced. Callers must not swallow this. */
export function assertNotPromoting(conversationId: string): void {
  if (conversationId && promoting.has(conversationId)) throw new ConversationPromotingError(conversationId);
}
