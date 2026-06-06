/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the Nextcloud Talk channel plugin.
 * No side-effects, no network I/O - safe to unit test in isolation.
 */

import { randomUUID } from 'node:crypto';

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// Nextcloud Talk REST API caps message text at 32 000 chars.
// We chunk at 4 000 to stay comfortably under and mirror Matrix's limit.
export const NC_MESSAGE_CHUNK_CHARS = 4_000;

// ── Nextcloud Talk REST API shapes ────────────────────────────────────────────

/**
 * A single chat message as returned by the Nextcloud Talk chat API
 * (GET /ocs/v2.php/apps/spreed/api/v1/chat/{token}).
 *
 * Only the fields Wayland reads are typed; the full shape has many more.
 */
export type NextcloudTalkChatMessage = {
  /** Numeric message ID. */
  id: number;
  /** ISO-8601 timestamp string or unix timestamp. */
  timestamp: number;
  /** Message type: 'comment' | 'system' | 'command' | 'bot' | etc. */
  systemMessage: string;
  /** Message text (may be empty for system messages). */
  message: string;
  /** Actor type: 'users' | 'guests' | 'bots' | etc. */
  actorType: string;
  /** Actor user ID. */
  actorId: string;
  /** Actor display name. */
  actorDisplayName: string;
  /** Message parameters (for rich object substitution - we skip). */
  messageParameters?: Record<string, unknown>;
  /** Parent message (for threaded replies). */
  parent?: {
    id: number;
    message: string;
    actorId: string;
    actorDisplayName: string;
  };
};

/**
 * Wrapper for the OCS envelope returned by /ocs/v2.php endpoints.
 */
export type OcsEnvelope<T> = {
  ocs: {
    meta: {
      status: string;
      statuscode: number;
      message: string;
    };
    data: T;
  };
};

// ── Incoming message parsing ───────────────────────────────────────────────────

/**
 * Convert a Nextcloud Talk chat message from the REST API into a Wayland
 * unified incoming message.
 *
 * Returns null for:
 * - System/bot messages (systemMessage !== '').
 * - Empty text after trimming.
 * - Messages from our own userId (echo filter).
 */
export function toUnifiedIncomingFromNextcloudTalk(
  msg: NextcloudTalkChatMessage,
  roomToken: string,
  selfUserId: string,
): IUnifiedIncomingMessage | null {
  // System messages (join/leave, call started, etc.) are not user messages.
  if (msg.systemMessage !== '') return null;

  // Echo filter - skip messages the bot itself sent.
  if (msg.actorId === selfUserId) return null;

  const text = (msg.message ?? '').trim();
  if (!text) return null;

  return {
    id: randomUUID(),
    platform: 'nextcloud-talk',
    chatId: roomToken,
    user: {
      id: msg.actorId,
      username: msg.actorId,
      displayName: msg.actorDisplayName || msg.actorId,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp: msg.timestamp * 1000,
    replyToMessageId: msg.parent?.id !== undefined ? String(msg.parent.id) : undefined,
    raw: msg,
  };
}

// ── Outgoing message formatting ───────────────────────────────────────────────

export type NextcloudTalkOutboundPayload = {
  /** Message text chunks. POST each separately if more than one. */
  chunks: string[];
  /** Optional reply-to message ID (numeric string). */
  replyTo?: string;
};

/**
 * Split text into NC_MESSAGE_CHUNK_CHARS chunks at word boundaries.
 * Returns [] for blank input.
 */
export function splitNextcloudTalkText(
  text: string,
  maxChars = NC_MESSAGE_CHUNK_CHARS,
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;
  while (remaining.length > maxChars) {
    let splitAt = remaining.lastIndexOf(' ', maxChars);
    if (splitAt < Math.floor(maxChars * 0.5)) splitAt = maxChars;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks.filter(Boolean);
}

/**
 * Convert a unified outgoing message to the Nextcloud Talk POST body shape.
 */
export function fromUnifiedOutgoingToNextcloudTalk(
  message: IUnifiedOutgoingMessage,
): NextcloudTalkOutboundPayload {
  const text = message.text ?? '';
  const chunks = splitNextcloudTalkText(text);
  return {
    chunks,
    replyTo: message.replyToMessageId,
  };
}
