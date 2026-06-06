/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TMessage } from '@/common/chat/chatLib';

/** Minimum length for a user message to count as "substantive intent." */
const MIN_USER_MSG_LENGTH = 30;

/**
 * Whole-message acknowledgement pattern. Matches strings that are NOTHING
 * BUT one or more ack words (with optional punctuation), so:
 *   "thanks"           → match (dropped)
 *   "thanks!"          → match (dropped)
 *   "thanks so much"   → match (dropped)
 *   "OK done"          → match (dropped)
 *   "yeah cool thanks" → match (dropped)
 *   "Thanks for the help - also check Twitter" → NO match (kept; substantive)
 *
 * Anchored end-to-end with optional trailing punctuation and whitespace.
 * Per v0.6.2.6 design decision (Sean 2026-05-26): tighten beyond simple
 * prefix matching so substantive messages that happen to start with an
 * ack word are not falsely dropped.
 */
const ACK_WORD = '(?:thanks?|thank\\s?you|great|ok(?:ay)?|yes|yeah|yep|no|nope|do\\s?another(?:\\s+iteration)?|perfect|done|nice|cool|alright|good|got\\s?it|sounds\\s?good|sure|fine|yo)';
const ACK_PATTERN = new RegExp(`^${ACK_WORD}(?:\\s+${ACK_WORD})*\\s*[.!?]?\\s*$`, 'i');

/**
 * Filter a conversation's user messages into a prompt string suitable
 * for re-running as a scheduled task.
 *
 * Filter pipeline:
 *   1. Keep only `type === 'text'` AND `position === 'right'` (user-side)
 *   2. Drop `hidden`, `teammateMessage`, and cron-triggered messages
 *      (cronMeta is set on prompts that fired FROM a cron, not user input)
 *   3. Trim content
 *   4. Drop content under MIN_USER_MSG_LENGTH chars
 *   5. Drop content that matches ACK_PATTERN end-to-end
 *   6. Join survivors with '\n\n' preserving original order
 *
 * Returns empty string if no surviving messages. Callers should treat
 * empty as "fall through to manual entry."
 *
 * Pure function: no I/O, no React deps, no side effects.
 */
export function extractCronPromptFromUserMessages(messages: readonly TMessage[]): string {
  const survivors: string[] = [];

  for (const msg of messages) {
    if (msg.type !== 'text') continue;
    if (msg.position !== 'right') continue;
    if (msg.hidden) continue;

    // Text-message content shape: { content: string; cronMeta?; teammateMessage?; ... }
    const textContent = msg.content as {
      content?: unknown;
      cronMeta?: unknown;
      teammateMessage?: unknown;
    };
    if (textContent.cronMeta) continue;
    if (textContent.teammateMessage) continue;

    const raw = typeof textContent.content === 'string' ? textContent.content : '';
    const trimmed = raw.trim();
    if (trimmed.length < MIN_USER_MSG_LENGTH) continue;
    if (ACK_PATTERN.test(trimmed)) continue;

    survivors.push(trimmed);
  }

  return survivors.join('\n\n');
}

/**
 * Exported for testing - kept module-private otherwise so the filter
 * behavior stays opaque to callers.
 */
export const __test = { MIN_USER_MSG_LENGTH, ACK_PATTERN };
