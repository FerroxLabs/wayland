/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * SignalAdapter - pure conversion helpers between Signal wire format and
 * Wayland's unified message types. No I/O; easy to unit-test.
 */

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';
import type { SignalInboundMessage } from './SignalDaemon';

// ── Text chunking ─────────────────────────────────────────────────────────────

/** Maximum Signal message length (characters). Signal's actual limit is 64 KiB
 *  of UTF-16 code units, but staying under 2 000 characters keeps messages
 *  readable and avoids push-notification truncation. */
export const SIGNAL_TEXT_CHUNK_LIMIT = 2_000;

/**
 * Split long text into chunks at paragraph boundaries where possible, falling
 * back to word boundaries, then hard-splitting at the limit.
 */
export function chunkSignalText(text: string, limit = SIGNAL_TEXT_CHUNK_LIMIT): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= limit) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > limit) {
    let splitAt = -1;

    // Try paragraph break (\n\n) first - preserves structure.
    const paraBreak = remaining.lastIndexOf('\n\n', limit);
    if (paraBreak > 0) {
      splitAt = paraBreak + 2;
    } else {
      // Try line break.
      const lineBreak = remaining.lastIndexOf('\n', limit);
      if (lineBreak > 0) {
        splitAt = lineBreak + 1;
      } else {
        // Try space.
        const spaceBreak = remaining.lastIndexOf(' ', limit);
        if (spaceBreak > 0) {
          splitAt = spaceBreak + 1;
        } else {
          // Hard split.
          splitAt = limit;
        }
      }
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

// ── Phone / UUID normalisation ─────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the string looks like a UUID (ACI / PNI). */
export function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Normalise a chat-id / recipient from the config form into the form
 * signal-cli expects:
 *
 * - E.164 phone number          → returned as-is (e.g. "+14155551234")
 * - UUID string (ACI)           → returned lowercased
 * - "group:<base64>"            → returned as-is
 * - Signal URI "signal:<x>"     → strips prefix, then recurses
 */
export function normalizeSignalRecipient(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Signal recipient is required');

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('signal:')) {
    return normalizeSignalRecipient(trimmed.slice('signal:'.length));
  }
  if (lower.startsWith('group:')) return trimmed;
  if (looksLikeUuid(trimmed)) return trimmed.toLowerCase();
  if (/^\+?\d{7,}$/.test(trimmed)) return trimmed;

  throw new Error(`Cannot normalise Signal recipient: ${trimmed}`);
}

// ── Inbound conversion ─────────────────────────────────────────────────────────

/**
 * Convert a raw `receive` JSON-RPC notification from signal-cli into Wayland's
 * unified incoming message format.
 *
 * Returns `null` for non-message envelopes (receipts, typing events, self-sends).
 */
export function signalInboundToUnified(
  raw: SignalInboundMessage,
  selfPhoneNumber: string,
): IUnifiedIncomingMessage | null {
  const env = raw.envelope;
  if (!env) return null;

  // Skip self-sends (echo of our own outbound messages).
  const senderPhone = env.source?.trim() ?? '';
  const senderUuid = env.sourceUuid?.trim() ?? '';
  if (senderPhone && senderPhone === selfPhoneNumber) return null;

  // We only handle dataMessage events (actual chat messages).
  const dm = env.dataMessage;
  if (!dm) return null;

  // Skip reactions - they're handled separately via the reaction capability.
  if (dm.reaction) return null;

  const text = dm.message?.trim() ?? '';
  // Determine the chatId: group takes priority over the individual sender.
  const groupId = dm.groupInfo?.groupId;
  const senderId = senderPhone || (senderUuid ? `uuid:${senderUuid}` : 'unknown');
  const chatId = groupId ? `group:${groupId}` : senderId;

  // Use the envelope timestamp as the message id (Signal's canonical approach).
  const ts = env.timestamp ?? Date.now();
  const msgId = String(ts);
  const displayName = env.sourceName?.trim() || senderId;

  return {
    id: msgId,
    platform: 'signal',
    chatId,
    user: { id: senderId, displayName },
    content: { type: 'text', text },
    timestamp: ts,
    raw,
  };
}

// ── Outbound conversion ────────────────────────────────────────────────────────

export type SignalSendParams = {
  /** Phone numbers (E.164) or UUIDs for individual recipients. */
  recipient?: string[];
  /** Base64 group ID for group messages. */
  groupId?: string;
  /** Message body. */
  message: string;
  /** Account phone number to use when signal-cli manages multiple accounts. */
  account?: string;
};

/**
 * Convert a Wayland outgoing message into signal-cli JSON-RPC `send` params.
 * `chatId` is the value previously set on the inbound message (phone, uuid, or group:<id>).
 */
export function unifiedToSignalSend(
  chatId: string,
  msg: IUnifiedOutgoingMessage,
  accountPhone: string,
): SignalSendParams {
  const text = msg.text?.trim() ?? '';
  const lower = chatId.toLowerCase();
  const params: SignalSendParams = { message: text, account: accountPhone };

  if (lower.startsWith('group:')) {
    params.groupId = chatId.slice('group:'.length);
  } else if (looksLikeUuid(chatId)) {
    params.recipient = [chatId.toLowerCase()];
  } else {
    // E.164 phone number.
    params.recipient = [chatId];
  }

  return params;
}
