/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

/**
 * Subset of AgentMail's inbound message webhook payload that we care about.
 * Real AgentMail payloads carry more fields; we preserve the full object under
 * IUnifiedIncomingMessage.raw for debugging.
 *
 * AgentMail (https://agentmail.com) and similar inbound-email SaaS providers
 * (Resend, Postmark, SendGrid Inbound) all surface roughly the same shape:
 * sender + recipient + subject + plaintext/html body + message-id + thread refs.
 */
export type AgentMailInboundPayload = {
  readonly event?: string;
  readonly message?: {
    readonly id?: string;
    readonly message_id?: string;
    readonly from?: string;
    readonly from_name?: string;
    readonly to?: string | readonly string[];
    readonly subject?: string;
    readonly text?: string;
    readonly html?: string;
    readonly in_reply_to?: string;
    readonly references?: readonly string[];
    readonly received_at?: string | number;
  };
};

/**
 * Body shape we POST to AgentMail's send endpoint. Field names mirror the
 * common SaaS-email REST shape (to/subject/text/in_reply_to). The plugin owns
 * the URL and auth; this is pure body construction.
 */
export type AgentMailSendBody = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly in_reply_to?: string;
};

const DEFAULT_SUBJECT = '(no subject)';

/**
 * Convert a verified AgentMail inbound webhook payload into the unified
 * incoming-message format. Returns null when required fields are missing -
 * callers should drop+log instead of throwing, mirroring the SMS plugin
 * behavior.
 */
export function toUnifiedIncomingFromAgentMail(
  payload: AgentMailInboundPayload,
  inboxAddress: string
): IUnifiedIncomingMessage | null {
  const message = payload.message;
  if (!message) return null;

  const messageId = (message.message_id ?? message.id ?? '').trim();
  const from = (message.from ?? '').trim();
  if (!messageId || !from) return null;

  const toRaw = message.to;
  const to = Array.isArray(toRaw) ? (toRaw[0] ?? inboxAddress) : (typeof toRaw === 'string' ? toRaw : inboxAddress);

  const text = pickBodyText(message.text, message.html);
  const subject = typeof message.subject === 'string' && message.subject.length > 0
    ? message.subject
    : DEFAULT_SUBJECT;

  const displayName = typeof message.from_name === 'string' && message.from_name.length > 0
    ? message.from_name
    : from;

  const timestamp = normalizeTimestamp(message.received_at);

  const references = Array.isArray(message.references) ? message.references.slice() : undefined;

  return {
    id: messageId,
    platform: 'email-agentmail',
    chatId: from, // conversation key = sender email address
    user: {
      id: from,
      displayName,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp,
    replyToMessageId: typeof message.in_reply_to === 'string' ? message.in_reply_to : undefined,
    raw: payload,
    email: {
      from,
      to,
      subject,
      messageId,
      inReplyTo: typeof message.in_reply_to === 'string' ? message.in_reply_to : undefined,
      references,
    },
  };
}

/**
 * Construct the JSON body POSTed to AgentMail's outbound send endpoint.
 * Defaults the subject to "(no subject)" when the agent did not supply one
 * so the recipient sees something deterministic instead of an empty header.
 */
export function toAgentMailSendBody(message: IUnifiedOutgoingMessage, chatId: string): AgentMailSendBody {
  const text = (message.text ?? '').trim();
  if (!text) {
    throw new Error('AgentMail send body cannot be empty');
  }
  const subject = typeof message.subject === 'string' && message.subject.length > 0
    ? message.subject
    : DEFAULT_SUBJECT;

  const body: AgentMailSendBody = {
    to: chatId,
    subject,
    text,
    ...(message.replyToMessageId ? { in_reply_to: message.replyToMessageId } : {}),
  };
  return body;
}

function pickBodyText(text: string | undefined, html: string | undefined): string {
  if (typeof text === 'string' && text.length > 0) return text;
  if (typeof html === 'string' && html.length > 0) return stripHtml(html);
  return '';
}

/**
 * Minimal HTML-to-text stripper. AgentMail is supposed to send a plaintext
 * `text` body alongside `html`; this fallback exists so a misconfigured sender
 * (html-only) does not break message ingestion.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // AgentMail-style epoch seconds → ms when the value is too small for ms.
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}
