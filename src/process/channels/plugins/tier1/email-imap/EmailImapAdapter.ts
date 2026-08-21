/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { convert as htmlToText } from 'html-to-text';
import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

/**
 * Minimal IMAP-message shape we care about. Real `imapflow` payloads are
 * richer (FETCH envelope + bodyParts); this is the subset we project into
 * IUnifiedIncomingMessage. Fields are optional so the adapter can defensively
 * reject malformed messages instead of throwing.
 */
export type ImapMessageEnvelope = {
  readonly uid: number;
  readonly messageId?: string;
  readonly inReplyTo?: string;
  readonly references?: readonly string[];
  readonly from?: { readonly address?: string; readonly name?: string };
  readonly to?: ReadonlyArray<{ readonly address?: string; readonly name?: string }>;
  readonly subject?: string;
  readonly date?: Date | string | number;
  /** Plain-text body (preferred). */
  readonly text?: string;
  /** HTML body (used as fallback when text is missing). */
  readonly html?: string;
};

/**
 * nodemailer.sendMail() envelope shape - kept narrow so the adapter is a
 * pure function with no nodemailer types leaking out.
 */
export type SmtpEnvelope = {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly inReplyTo?: string;
  readonly references?: string;
};

const DEFAULT_SUBJECT = '(no subject)';

/**
 * Convert a fetched IMAP message into the unified incoming-message format.
 * Returns null when required fields (uid + from + messageId) are missing -
 * callers should drop+log instead of throwing.
 *
 * The conversation key (chatId) is the sender's address so replies thread
 * by counterparty exactly like the AgentMail plugin.
 */
export function parseImapMessage(raw: ImapMessageEnvelope): IUnifiedIncomingMessage | null {
  const fromAddress = (raw.from?.address ?? '').trim();
  const messageId = (raw.messageId ?? '').trim();
  if (!fromAddress || !messageId || !Number.isFinite(raw.uid)) return null;

  const toAddress = (raw.to?.[0]?.address ?? '').trim();
  const subject =
    typeof raw.subject === 'string' && raw.subject.length > 0 ? raw.subject : DEFAULT_SUBJECT;
  const displayName =
    typeof raw.from?.name === 'string' && raw.from.name.length > 0 ? raw.from.name : fromAddress;
  const text = pickBodyText(raw.text, raw.html);
  const timestamp = normalizeTimestamp(raw.date);
  const references = Array.isArray(raw.references) ? raw.references.slice() : undefined;

  return {
    id: messageId,
    platform: 'email-imap',
    chatId: fromAddress,
    user: {
      id: fromAddress,
      displayName,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp,
    replyToMessageId: typeof raw.inReplyTo === 'string' ? raw.inReplyTo : undefined,
    raw,
    email: {
      from: fromAddress,
      to: toAddress,
      subject,
      messageId,
      inReplyTo: typeof raw.inReplyTo === 'string' ? raw.inReplyTo : undefined,
      references,
    },
  };
}

/**
 * Construct the SMTP envelope passed to nodemailer.sendMail. The plugin owns
 * the transport + auth; this is pure body construction.
 *
 * @param message Unified outgoing message from the action executor
 * @param chatId  Recipient address (mirrors the agentmail send body)
 * @param fromAddress Inbox address - used as the From header
 * @param inReplyTo Optional Message-ID we are replying to
 */
export function buildSmtpEnvelope(
  message: IUnifiedOutgoingMessage,
  chatId: string,
  fromAddress: string,
  inReplyTo?: string
): SmtpEnvelope {
  const text = (message.text ?? '').trim();
  if (!text) {
    throw new Error('SMTP envelope cannot be empty');
  }
  const subject =
    typeof message.subject === 'string' && message.subject.length > 0
      ? message.subject
      : DEFAULT_SUBJECT;

  const replyId = inReplyTo ?? message.replyToMessageId;

  const envelope: SmtpEnvelope = {
    from: fromAddress,
    to: chatId,
    subject,
    text,
    ...(replyId ? { inReplyTo: replyId, references: replyId } : {}),
  };
  return envelope;
}

function pickBodyText(text: string | undefined, html: string | undefined): string {
  if (typeof text === 'string' && text.length > 0) return text;
  if (typeof html === 'string' && html.length > 0) {
    // Use html-to-text (already a project dep for AgentMail). Wordwrap off so
    // the agent sees the raw body and decides how to reflow.
    return htmlToText(html, { wordwrap: false }).trim();
  }
  return '';
}

function normalizeTimestamp(value: Date | string | number | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}
