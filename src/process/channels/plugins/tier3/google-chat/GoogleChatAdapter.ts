/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for Google Chat ↔ Wayland unified message types.
 * No side effects, no network calls - suitable for direct unit testing.
 */

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// ── Inbound types (subset of Google Chat API) ─────────────────────────────────

export type GoogleChatSpace = {
  name?: string;
  displayName?: string;
  type?: string;
};

export type GoogleChatUser = {
  name?: string;
  displayName?: string;
  email?: string;
  type?: string;
};

export type GoogleChatThread = {
  name?: string;
  threadKey?: string;
};

export type GoogleChatMessage = {
  name?: string;
  text?: string;
  argumentText?: string;
  sender?: GoogleChatUser;
  thread?: GoogleChatThread;
};

export type GoogleChatEvent = {
  type?: string;
  eventType?: string;
  eventTime?: string;
  space?: GoogleChatSpace;
  user?: GoogleChatUser;
  message?: GoogleChatMessage;
};

// ── Inbound: Google Chat event → IUnifiedIncomingMessage ─────────────────────

/**
 * Convert a verified Google Chat event payload into a unified incoming message.
 * Returns null for event types that don't produce a user-visible message
 * (ADDED_TO_SPACE, REMOVED_FROM_SPACE, CARD_CLICKED, etc.).
 */
export function googleChatEventToUnified(
  event: GoogleChatEvent,
  pluginInstanceId: string,
): IUnifiedIncomingMessage | null {
  const eventType = (event.type ?? event.eventType ?? '').toUpperCase();

  if (eventType !== 'MESSAGE') {
    return null;
  }

  const msg = event.message;
  const text = msg?.text ?? msg?.argumentText ?? '';
  if (!text.trim() && !msg?.name) {
    return null;
  }

  const sender = event.user ?? msg?.sender;
  const senderId = sender?.name ?? 'unknown';
  const senderDisplay = sender?.displayName ?? sender?.email ?? senderId;

  // chatId = space name (e.g. "spaces/AAAA") - this is what sendMessage/editMessage receive.
  // If the inbound event has no space.name we MUST drop it: a downstream
  // sendMessage(pluginInstanceId, …) would POST to `…/v1/google-chat_default/messages`
  // and 404. Same defensive shape as the no-text branch above.
  if (!event.space?.name) {
    return null;
  }
  const spaceId = event.space.name;
  // pluginInstanceId retained in the signature for future routing; unused for now.
  void pluginInstanceId;

  // Message name is the stable ID for editing (e.g. "spaces/AAAA/messages/BBBB")
  const messageId = msg?.name ?? `${spaceId}/messages/${Date.now()}`;

  return {
    id: messageId,
    platform: 'google-chat',
    chatId: spaceId,
    user: {
      id: senderId,
      displayName: senderDisplay,
      username: sender?.email ?? senderDisplay,
    },
    content: {
      type: 'text',
      text: text.trim(),
    },
    timestamp: event.eventTime ? new Date(event.eventTime).getTime() : Date.now(),
    raw: event,
  };
}

// ── Outbound: IUnifiedOutgoingMessage → Google Chat REST body ─────────────────

/**
 * Convert a unified outgoing message to the body expected by the Google Chat
 * REST API (POST /v1/spaces/{space}/messages or PATCH /v1/{name}?updateMask=text).
 *
 * When `options.threadName` is provided (e.g. derived from a reply context or
 * a chatId that contains `/threads/<id>`), the message is posted into that
 * existing thread instead of becoming a top-level post - matching OpenClaw's
 * threading semantics and preserving conversation continuity.
 */
export type ToGoogleChatMessageBodyOptions = {
  /** Fully-qualified thread resource name, e.g. "spaces/AAA/threads/TTT". */
  threadName?: string;
};

export type GoogleChatMessageBody = {
  text: string;
  thread?: { name: string };
};

export function toGoogleChatMessageBody(
  message: IUnifiedOutgoingMessage,
  options?: ToGoogleChatMessageBodyOptions,
): GoogleChatMessageBody {
  const text = message.text ?? '';
  const threadName = options?.threadName?.trim();
  if (threadName) {
    return { text, thread: { name: threadName } };
  }
  return { text };
}

/**
 * Derive a Google Chat thread resource name from either:
 *   - an explicit `replyToMessageId` like "spaces/AAA/messages/MSG-001" or
 *     "spaces/AAA/threads/TTT/messages/MSG-001"
 *   - a chatId that already encodes a thread, e.g. "spaces/AAA/threads/TTT"
 *
 * Returns null if no thread context can be inferred (caller should omit
 * `thread` and let the message be top-level).
 */
export function deriveThreadName(
  chatId: string,
  replyToMessageId?: string,
): string | null {
  // Case 1: caller passed an explicit reply target.
  if (replyToMessageId) {
    const m = replyToMessageId.match(/^(spaces\/[^/]+\/threads\/[^/]+)/);
    if (m) return m[1];
    // Plain "spaces/<S>/messages/<M>" - no thread segment present, but the
    // space-level fallback "spaces/<S>" is NOT a valid thread name. Skip.
  }
  // Case 2: chatId itself encodes a thread.
  const m = chatId.match(/^(spaces\/[^/]+\/threads\/[^/]+)/);
  if (m) return m[1];
  return null;
}
