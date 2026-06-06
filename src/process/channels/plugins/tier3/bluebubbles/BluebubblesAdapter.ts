/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * BluebubblesAdapter - converts BlueBubbles Socket.IO payloads to
 * IUnifiedIncomingMessage and formats tapback reactions for the REST API.
 */

import type { IUnifiedIncomingMessage } from '../../../types';

// ── BB payload types ──────────────────────────────────────────────────────────

/** Subset of a BlueBubbles message object as emitted in the `new-message` event. */
export type BBMessage = {
  guid?: string;
  text?: string;
  isFromMe?: boolean;
  handle?: { address?: string; displayName?: string } | null;
  chats?: Array<{ guid?: string }>;
  chatGuid?: string;
  associatedMessageGuid?: string;
  associatedMessageType?: number;
  attachments?: Array<{ guid?: string; mimeType?: string; transferName?: string }>;
  dateCreated?: number;
  date?: number;
};

/** The outer event envelope BlueBubbles sends over Socket.IO. */
export type BBSocketEvent = {
  type?: string;
  data?: BBMessage | unknown;
};

// ── Tapback reaction mapping ─────────────────────────────────────────────────
// associatedMessageType 2000-2005 = add; 3000-3005 = remove.
// Mirrored from OpenClaw monitor-normalize.ts REACTION_TYPE_MAP.

const REACTION_TYPE_MAP = new Map<number, { emoji: string; action: 'added' | 'removed' }>([
  [2000, { emoji: '❤️', action: 'added' }],
  [2001, { emoji: '👍', action: 'added' }],
  [2002, { emoji: '👎', action: 'added' }],
  [2003, { emoji: '😂', action: 'added' }],
  [2004, { emoji: '‼️', action: 'added' }],
  [2005, { emoji: '❓', action: 'added' }],
  [3000, { emoji: '❤️', action: 'removed' }],
  [3001, { emoji: '👍', action: 'removed' }],
  [3002, { emoji: '👎', action: 'removed' }],
  [3003, { emoji: '😂', action: 'removed' }],
  [3004, { emoji: '‼️', action: 'removed' }],
  [3005, { emoji: '❓', action: 'removed' }],
]);

/**
 * iMessage tapback names for the BB REST reaction endpoint.
 * POST /api/v1/message/react uses these string names, not emoji codepoints.
 */
export const TAPBACK_NAMES: Record<string, string> = {
  '❤️': 'love',
  '❤': 'love',
  '👍': 'like',
  '👎': 'dislike',
  '😂': 'laugh',
  '‼️': 'emphasize',
  '‼': 'emphasize',
  '❓': 'question',
};

/** Normalise a caller-supplied emoji to a BB tapback name. Throws if unknown. */
export function normalizeTapbackName(emoji: string): string {
  const trimmed = emoji.trim();
  const name = TAPBACK_NAMES[trimmed];
  if (!name) {
    throw new Error(
      `Unsupported BlueBubbles tapback: "${trimmed}". Supported: love, like, dislike, laugh, emphasize, question`,
    );
  }
  return name;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/**
 * Extract the chatGuid from the message.  BlueBubbles places it in two spots
 * depending on server version: `message.chatGuid` (v3+) or `message.chats[0].guid`.
 */
function extractChatGuid(msg: Record<string, unknown>): string | undefined {
  const direct = readString(msg, 'chatGuid');
  if (direct) return direct;
  const chats = msg['chats'];
  if (Array.isArray(chats) && chats.length > 0) {
    const first = asRecord(chats[0]);
    if (first) return readString(first, 'guid');
  }
  return undefined;
}

const DM_CHAT_GUID_PATTERN = new RegExp('^iMessage;-;(.+)$');

/**
 * Extract the remote handle from a DM chatGuid (iMessage;-;+15551234567).
 * Returns undefined for group chats (iMessage;+;...) or unparseable input.
 *
 * Mirrors OpenClaw's webhook fallback: BlueBubbles sometimes omits handle
 * in new-message deliveries for DMs but the address is always recoverable
 * from the chat GUID.
 */
export function extractHandleFromChatGuid(chatGuid: string | undefined): string | undefined {
  if (!chatGuid) return undefined;
  const match = DM_CHAT_GUID_PATTERN.exec(chatGuid);
  return match ? match[1] : undefined;
}

/**
 * Convert a raw `new-message` Socket.IO payload to IUnifiedIncomingMessage.
 *
 * Returns null for:
 * - Messages sent by us (isFromMe=true) - prevents echo loops.
 * - Tapback association events (associatedMessageType in the 2000-3xxx range)
 *   which have no text body and represent reactions, not new messages.
 * - Payloads where we cannot derive a sender address or chatGuid.
 */
export function toUnifiedIncomingFromBluebubbles(
  raw: unknown,
  pluginType: string,
): IUnifiedIncomingMessage | null {
  const outer = asRecord(raw);
  if (!outer) return null;

  // The Socket.IO event can be { type, data: <message> } or the message directly.
  const data = outer['data'] ?? outer['message'] ?? outer;
  const msg = asRecord(data);
  if (!msg) return null;

  // Skip own messages.
  if (msg['isFromMe'] === true) return null;

  // Skip tapback/reaction events - they have associatedMessageType in 2000-3xxx range.
  const assocType =
    typeof msg['associatedMessageType'] === 'number' ? msg['associatedMessageType'] : undefined;
  if (assocType !== undefined && assocType >= 2000 && assocType < 4000) return null;

  const chatGuid = extractChatGuid(msg);
  if (!chatGuid) return null;

  // Sender: prefer handle.address, with full OpenClaw fallback chain.
  // Real BB payloads vary by server version; some webhook deliveries omit
  // `handle` entirely for DMs, in which case the address is recoverable
  // from the chatGuid via extractHandleFromChatGuid.
  const handleVal = msg['handle'] ?? msg['from'];
  const handleRec =
    asRecord(handleVal) ?? (typeof handleVal === 'string' ? { address: handleVal } : null);
  const senderAddress =
    (handleRec ? readString(handleRec, 'address') : undefined) ??
    (handleRec ? readString(handleRec, 'handle') : undefined) ??
    (handleRec ? readString(handleRec, 'id') : undefined) ??
    readString(msg, 'senderId') ??
    readString(msg, 'sender') ??
    readString(msg, 'from') ??
    extractHandleFromChatGuid(chatGuid);
  const senderDisplayName = handleRec
    ? (readString(handleRec, 'displayName') ?? senderAddress ?? '')
    : (senderAddress ?? '');

  if (!senderAddress) return null;

  const messageId = readString(msg, 'guid') ?? readString(msg, 'id') ?? `bb-${Date.now()}`;

  const rawDate = msg['dateCreated'] ?? msg['date'];
  const timestamp =
    typeof rawDate === 'number'
      ? rawDate > 1_000_000_000_000
        ? rawDate
        : rawDate * 1000
      : Date.now();

  const text = readString(msg, 'text') ?? readString(msg, 'body') ?? '';

  return {
    id: messageId,
    platform: pluginType,
    chatId: chatGuid,
    user: {
      id: senderAddress,
      username: senderAddress,
      displayName: senderDisplayName,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp,
    raw: msg,
  };
}

/**
 * Build the tapback reaction payload for POST /api/v1/message/react.
 * Returns null if the emoji does not map to a known iMessage tapback.
 */
export function buildTapbackPayload(
  chatGuid: string,
  messageGuid: string,
  emoji: string,
): { chatGuid: string; selectedMessageGuid: string; reaction: string; partIndex: number } | null {
  let name: string;
  try {
    name = normalizeTapbackName(emoji);
  } catch {
    return null;
  }
  return { chatGuid, selectedMessageGuid: messageGuid, reaction: name, partIndex: 0 };
}

/**
 * Extract a reaction from a tapback event payload (for informational use in tests).
 * Returns null if the payload is not a tapback event.
 */
export function extractTapbackFromPayload(raw: unknown): {
  emoji: string;
  action: 'added' | 'removed';
  targetMessageGuid: string;
} | null {
  const outer = asRecord(raw);
  if (!outer) return null;
  const data = outer['data'] ?? outer;
  const msg = asRecord(data);
  if (!msg) return null;

  const assocType =
    typeof msg['associatedMessageType'] === 'number' ? msg['associatedMessageType'] : undefined;
  if (assocType === undefined) return null;

  const mapping = REACTION_TYPE_MAP.get(assocType);
  if (!mapping) return null;

  const targetGuid =
    readString(msg, 'associatedMessageGuid') ??
    readString(msg, 'associated_message_guid') ??
    readString(msg, 'associatedMessageId');
  if (!targetGuid) return null;

  return { emoji: mapping.emoji, action: mapping.action, targetMessageGuid: targetGuid };
}
