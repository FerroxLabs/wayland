/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the generic Webhook channel plugin.
 * Inbound: JSON body -> IUnifiedIncomingMessage.
 * Outbound: IUnifiedOutgoingMessage -> POST body POSTed to operator URL.
 */

import { createHmac } from 'node:crypto';
import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// ---------------------------------------------------------------------------
// Inbound - incoming webhook payload -> unified message
// ---------------------------------------------------------------------------

/**
 * Flexible inbound payload shape. Operators may POST either:
 *   - wayland-v1: { id, chatId, userId, displayName?, text, ts? }
 *   - json-flexible: any JSON object; we best-effort extract text/id/sender
 */
export type WebhookInboundPayload = {
  readonly id?: string;
  readonly chatId?: string;
  readonly userId?: string;
  readonly displayName?: string;
  readonly text?: string;
  readonly message?: string;
  readonly content?: string;
  readonly ts?: number | string;
  readonly timestamp?: number | string;
  readonly attachments?: ReadonlyArray<{
    readonly type?: string;
    readonly url?: string;
    readonly name?: string;
  }>;
  /** Raw passthrough - any extra fields the sender adds */
  readonly [key: string]: unknown;
};

/**
 * Body POSTed to the operator's outbound URL by sendMessage.
 * Harvested concept from OpenClaw http.ts - keep the shape simple and
 * predictable so operators can parse without a schema.
 */
export type WebhookOutboundBody = {
  readonly chatId: string;
  readonly message: string;
  readonly ts: number;
};

/**
 * Parse an inbound webhook payload into IUnifiedIncomingMessage. Returns null
 * when the required minimum (some extractable text) is absent - callers should
 * drop+warn rather than throw.
 *
 * @param payload   Parsed JSON body from the verified webhook POST.
 * @param pluginId  The plugin instance id, used as the platform identifier.
 */
export function toUnifiedIncoming(
  payload: WebhookInboundPayload,
  pluginId: string
): IUnifiedIncomingMessage | null {
  // Extract text - try common field names in priority order
  const text =
    typeof payload.text === 'string' && payload.text.length > 0
      ? payload.text
      : typeof payload.message === 'string' && payload.message.length > 0
        ? payload.message
        : typeof payload.content === 'string' && payload.content.length > 0
          ? payload.content
          : null;

  if (text === null) return null;

  const id =
    typeof payload.id === 'string' && payload.id.length > 0 ? payload.id : `wh-${Date.now()}`;

  const chatId =
    typeof payload.chatId === 'string' && payload.chatId.length > 0 ? payload.chatId : 'default';

  const userId =
    typeof payload.userId === 'string' && payload.userId.length > 0 ? payload.userId : chatId;

  const displayName =
    typeof payload.displayName === 'string' && payload.displayName.length > 0
      ? payload.displayName
      : userId;

  const timestamp = normalizeTimestamp(payload.ts ?? payload.timestamp);

  // Surface attachment URLs as part of text when the "attachments" array is present
  const attachmentLines = buildAttachmentLines(payload.attachments);
  const fullText = attachmentLines.length > 0 ? `${text}\n${attachmentLines.join('\n')}` : text;

  return {
    id,
    platform: pluginId,
    chatId,
    user: {
      id: userId,
      displayName,
    },
    content: {
      type: 'text',
      text: fullText,
    },
    timestamp,
    raw: payload,
  };
}

/**
 * Build the JSON body POSTed to the operator's outbound URL.
 * Shape: { chatId, message, ts } - kept minimal and predictable.
 * Harvested concept from OpenClaw http.ts webhook action body builder.
 */
export function toOutboundBody(chatId: string, message: IUnifiedOutgoingMessage): WebhookOutboundBody {
  const text = (message.text ?? '').trim();
  if (!text) throw new Error('Webhook outbound body cannot be empty');
  return {
    chatId,
    message: text,
    ts: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// HMAC signing for outbound requests
// ---------------------------------------------------------------------------

/**
 * Compute the HMAC-SHA256 signature header value for an outbound POST body.
 * Signs `<timestamp>.<bodyJson>` so the receiving end can enforce a replay
 * window (Slack/Stripe convention). The caller must send the same `timestamp`
 * in the `X-Webhook-Timestamp` header alongside `X-Webhook-Signature`.
 * Format mirrors GitHub / Meta: "sha256=<hex>". Returns null when secret is
 * empty (signing disabled).
 *
 * Harvested concept from OpenClaw http.ts timingSafeEquals + secret extraction.
 */
export function signOutboundBody(
  bodyJson: string,
  secret: string,
  timestampMs: number
): string | null {
  const trimmed = secret.trim();
  if (!trimmed) return null;
  const hex = createHmac('sha256', trimmed)
    .update(`${timestampMs}.${bodyJson}`, 'utf8')
    .digest('hex');
  return `sha256=${hex}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

function buildAttachmentLines(
  attachments: WebhookInboundPayload['attachments']
): string[] {
  if (!Array.isArray(attachments) || attachments.length === 0) return [];
  return attachments
    .map((a) => {
      const url = typeof a.url === 'string' ? a.url : '';
      const name = typeof a.name === 'string' ? a.name : '';
      return url ? (name ? `[${name}](${url})` : url) : null;
    })
    .filter((line): line is string => line !== null);
}
