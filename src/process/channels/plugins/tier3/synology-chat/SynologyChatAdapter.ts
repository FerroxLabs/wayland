/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the Synology Chat channel plugin.
 * Inbound: form-encoded webhook payload → IUnifiedIncomingMessage.
 * Outbound: IUnifiedOutgoingMessage → form-encoded POST body.
 * No side-effects, no network I/O - safe to unit test in isolation.
 */

import { randomUUID } from 'node:crypto';

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

/**
 * Synology Chat inbound webhook payload shape.
 *
 * Synology Chat POSTs form-encoded data with a single `payload` field whose
 * value is a JSON-encoded object containing the sender details and message text.
 *
 * Ref: https://kb.synology.com/en-global/DSM/tutorial/How_to_configure_webhooks_and_slash_commands_in_Chat
 */
export type SynologyChatInboundPayload = {
  /** Webhook token (query-string, consumed by the verifier - not in this object) */
  readonly token?: string;
  /** Sender's Synology Chat user ID (outgoing webhook ID space) */
  readonly user_id?: string | number;
  /** Sender's username / nickname as shown in the chat UI */
  readonly username?: string;
  /** ID of the channel (group) this message was sent in */
  readonly channel_id?: string | number;
  /** Channel name */
  readonly channel_name?: string;
  /** The message text */
  readonly text?: string;
  /** Slash command trigger word, if this is a slash command */
  readonly trigger_word?: string;
  /** Timestamp as Unix seconds (float) */
  readonly timestamp?: string | number;
};

/**
 * Parse the raw webhook body (application/x-www-form-urlencoded) into a
 * SynologyChatInboundPayload. Synology Chat encodes the event object as
 * a JSON string in the `payload` URL param.
 *
 * Returns null when the body is malformed or the payload field is missing.
 */
export function parseSynologyChatBody(rawBody: string): SynologyChatInboundPayload | null {
  let payloadStr: string | null = null;

  // Parse as URL-encoded form data.
  try {
    const params = new URLSearchParams(rawBody);
    payloadStr = params.get('payload');
  } catch {
    return null;
  }

  if (!payloadStr) return null;

  try {
    const parsed: unknown = JSON.parse(payloadStr);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as SynologyChatInboundPayload;
  } catch {
    return null;
  }
}

/**
 * Convert a parsed Synology Chat inbound payload into a unified incoming
 * message. Returns null when required fields (user_id or text) are absent.
 */
export function toUnifiedIncomingFromSynologyChat(
  payload: SynologyChatInboundPayload,
): IUnifiedIncomingMessage | null {
  const userId = String(payload.user_id ?? '').trim();
  let text = (payload.text ?? '').trim();

  // Strip slash-command trigger word prefix when present (Synology outgoing
  // webhooks echo the trigger_word into text - operators don't want it
  // duplicated into the agent prompt).
  if (payload.trigger_word && text.startsWith(payload.trigger_word)) {
    text = text.slice(payload.trigger_word.length).trim();
  }

  if (!userId || !text) return null;

  const username = (payload.username ?? userId).trim();
  const channelId =
    payload.channel_id !== undefined ? String(payload.channel_id) : userId;

  const timestamp = normalizeTimestamp(payload.timestamp);

  return {
    id: randomUUID(),
    platform: 'synology-chat',
    chatId: channelId,
    user: {
      id: userId,
      username,
      displayName: username,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp,
    raw: payload,
  };
}

/**
 * Build the form-encoded POST body to send a message via the Synology Chat
 * incoming webhook URL. The payload is JSON-encoded inside the `payload`
 * URL parameter. Optionally includes `user_ids` to target a specific user.
 */
export function toSynologyChatSendBody(
  message: IUnifiedOutgoingMessage,
  chatUserId?: string | number,
): string {
  const text = (message.text ?? '').trim();
  const fileUrl = message.fileUrl;

  // Synology's incoming webhook requires at least one of text or file_url.
  // Empty payloads silently succeed in the bridge but never render in chat.
  if (!text && !fileUrl) {
    throw new Error('SynologyChat outgoing message requires text or fileUrl');
  }

  type OutboundPayload = {
    text?: string;
    file_url?: string;
    user_ids?: number[];
  };

  const payload: OutboundPayload = {};

  // Omit `text` entirely when blank + file_url present - Synology rejects
  // empty `text` fields even when accompanied by a file_url.
  if (text) {
    payload.text = text;
  }

  if (fileUrl) {
    payload.file_url = fileUrl;
  }

  const numericId = parseNumericUserId(chatUserId);
  if (numericId !== undefined) {
    payload.user_ids = [numericId];
  }

  return `payload=${encodeURIComponent(JSON.stringify(payload))}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseNumericUserId(userId?: string | number): number | undefined {
  if (userId === undefined) return undefined;
  const n = typeof userId === 'number' ? userId : parseInt(userId, 10);
  return Number.isNaN(n) ? undefined : n;
}

function normalizeTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Synology timestamps are Unix seconds (float) - convert to ms.
    return value < 1e12 ? Math.round(value * 1000) : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n < 1e12 ? Math.round(n * 1000) : n;
  }
  return Date.now();
}
