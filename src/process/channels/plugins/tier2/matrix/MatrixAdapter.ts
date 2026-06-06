/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * MatrixAdapter - pure conversions between matrix-js-sdk event shapes and the
 * unified channel message contract. No matrix-js-sdk runtime imports here so
 * the same adapter can be unit-tested without booting a sync loop.
 */

import type {
  AttachmentType,
  IUnifiedAttachment,
  IUnifiedIncomingMessage,
  IUnifiedMessageContent,
} from '../../../types';

// Matrix has no protocol-imposed event-size limit but homeservers commonly cap
// at ~64KiB JSON. 65k UTF-8 characters of plain body fits well under that ceiling
// after JSON-escaping, so use it as the outbound chunker boundary.
export const MATRIX_MESSAGE_LIMIT = 65000;

/**
 * Minimal subset of MatrixEvent we depend on. matrix-js-sdk exposes a richer
 * shape but adapter unit tests construct plain objects, so we restrict the
 * surface to the four methods the converter actually calls.
 */
export type MatrixEventLike = {
  getType: () => string;
  getId: () => string | undefined;
  getRoomId: () => string | undefined;
  getSender: () => string | undefined;
  getTs: () => number;
  getContent: () => MatrixMessageContent;
};

export type MatrixMessageContent = {
  msgtype?: string;
  body?: string;
  url?: string;
  filename?: string;
  info?: {
    mimetype?: string;
    size?: number;
  };
  ['m.relates_to']?: {
    rel_type?: string;
    event_id?: string;
  };
};

function attachmentTypeFromMsgType(msgtype: string | undefined): AttachmentType {
  switch (msgtype) {
    case 'm.image':
      return 'photo';
    case 'm.video':
      return 'video';
    case 'm.audio':
      return 'audio';
    default:
      return 'document';
  }
}

function contentTypeFromMsgType(msgtype: string | undefined): IUnifiedMessageContent['type'] {
  switch (msgtype) {
    case 'm.image':
      return 'photo';
    case 'm.video':
      return 'video';
    case 'm.audio':
      return 'audio';
    case 'm.file':
      return 'document';
    default:
      return 'text';
  }
}

/**
 * Convert a matrix-js-sdk timeline event into the unified incoming format.
 *
 * Drops events where:
 * - type !== 'm.room.message' (we ignore membership, state, redactions here)
 * - sender === selfUserId (loop prevention - Matrix echoes every sent event)
 * - sender / roomId / id is missing (skeleton events from initial sync)
 */
export function toUnifiedIncomingFromMatrix(
  event: MatrixEventLike,
  selfUserId: string
): IUnifiedIncomingMessage | null {
  if (event.getType() !== 'm.room.message') return null;

  const sender = event.getSender();
  if (!sender) return null;
  if (sender === selfUserId) return null; // ignore our own echoes

  const id = event.getId();
  const roomId = event.getRoomId();
  if (!id || !roomId) return null;

  const content = event.getContent() ?? {};
  const msgtype = content.msgtype;
  const body = typeof content.body === 'string' ? content.body : '';
  const contentType = contentTypeFromMsgType(msgtype);

  // Display name is not on the event itself - matrix-js-sdk exposes it via
  // client.getUser(sender)?.displayName which the plugin resolves at runtime.
  // Adapter only has the raw mxid, so use it as the displayName fallback.
  const unifiedContent: IUnifiedMessageContent = (() => {
    if (contentType === 'text') {
      return { type: 'text', text: body };
    }
    const attachment: IUnifiedAttachment = {
      type: attachmentTypeFromMsgType(msgtype),
      fileId: typeof content.url === 'string' ? content.url : id,
      fileName: typeof content.filename === 'string' ? content.filename : undefined,
      mimeType: content.info?.mimetype,
      size: content.info?.size,
    };
    return { type: contentType, text: body, attachments: [attachment] };
  })();

  const relates = content['m.relates_to'];
  // Treat reply chains the same as Telegram - surface in-thread parent so the
  // ActionExecutor can preserve context. m.in_reply_to wraps inside relates_to.
  const replyToMessageId = relates?.event_id;

  return {
    id,
    platform: 'matrix',
    chatId: roomId,
    user: {
      id: sender,
      username: sender,
      displayName: sender,
    },
    content: unifiedContent,
    timestamp: event.getTs(),
    replyToMessageId,
    raw: event,
  };
}

/**
 * Split a long body into Matrix-safe chunks. Matrix has no hard event size
 * limit but homeservers commonly cap event JSON at ~64KiB. Mirrors the
 * paragraph→newline→space cascade from the Discord adapter.
 */
export function splitMatrixMessage(text: string, limit: number = MATRIX_MESSAGE_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf('\n\n', limit);
    if (cut < limit / 2) cut = remaining.lastIndexOf('\n', limit);
    if (cut < limit / 2) cut = remaining.lastIndexOf(' ', limit);
    if (cut <= 0) cut = limit;
    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).replace(/^\s+/, '');
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}
