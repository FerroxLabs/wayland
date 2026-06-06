/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WeixinChatRequest } from './WeixinMonitor';
import type { IUnifiedIncomingMessage } from '../../types';

// ==================== Inbound ====================

/**
 * Convert a WeixinChatRequest to the unified incoming message format.
 * Attachments are appended to the text as local file path markers so the
 * agent can read them with its file-read tools.
 */
export function toUnifiedIncomingMessage(request: WeixinChatRequest): IUnifiedIncomingMessage {
  const { conversationId, msgId, text, attachments } = request;

  let fullText = text ?? '';
  if (attachments && attachments.length > 0) {
    const lines = attachments.map((att) =>
      att.kind === 'image' ? `[Image: ${att.path}]` : `[File "${att.name}": ${att.path}]`
    );
    fullText = fullText ? `${fullText}\n\n${lines.join('\n')}` : lines.join('\n');
  }

  // displayName falls back to the full opaque platform id (e.g.
  // `wxid_xxxxxxxxx`). The Tencent iLink getupdates response carries
  // no nickname field; the previous `conversationId.slice(-6)` produced
  // meaningless garbage like `abc123` and surfaced it to users as their
  // "name" (audit HIGH-3). Until a separate get_user_info call is wired
  // in, surfacing the full id at least tells the user this is an ID, not
  // a name.
  return {
    // LOW-4: use the per-message Tencent msg_id so downstream dedup/threading sees a unique
    // id per message. Falls back to conversationId only when the monitor couldn't supply one
    // (legacy callers / unit tests).
    id: msgId ?? conversationId,
    platform: 'weixin',
    chatId: conversationId,
    user: {
      id: conversationId,
      displayName: conversationId,
    },
    content: {
      type: 'text',
      text: fullText,
    },
    timestamp: Date.now(),
  };
}

// ==================== Text Formatting ====================

/**
 * Strip HTML tags and decode common HTML entities to plain text.
 * WeChat does not support HTML markup, so all outgoing text must be plain.
 */
export function stripHtml(html: string): string {
  // Strip tags first, then decode entities, then strip again.
  // Two-pass approach handles entity-encoded tags (&lt;script&gt; → <script>)
  // while the single-pass entity decoder prevents double-unescaping (&amp;lt; stays &lt;).
  const decoded = stripTags(html).replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => {
    if (entity === '&amp;') return '&';
    if (entity === '&lt;') return '<';
    if (entity === '&gt;') return '>';
    if (entity === '&quot;') return '"';
    if (entity === '&#39;') return "'";
    if (entity === '&nbsp;') return ' ';
    return entity;
  });
  return stripTags(decoded);
}

function stripTags(str: string): string {
  let result = str;
  let prev: string;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, '');
  } while (result !== prev);
  return result;
}
