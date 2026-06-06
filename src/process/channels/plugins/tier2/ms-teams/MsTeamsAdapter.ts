/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure adapter functions: Bot Framework Activity → IUnifiedIncomingMessage
 * and IUnifiedOutgoingMessage → Bot Framework REST activity payload.
 *
 * Harvested from openclaw/extensions/msteams/src/inbound.ts (HTML helpers,
 * mention stripping, conversation-id normalisation) and outbound.ts (chunk
 * limit, adaptive card shape).
 */

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// Bot Framework text chunk limit (per OpenClaw outbound.ts: textChunkLimit=4000)
export const MS_TEAMS_TEXT_CHUNK_LIMIT = 4000;

// Bot Framework activity types we care about
export type BotFrameworkActivityType =
  | 'message'
  | 'messageReaction'
  | 'typing'
  | 'conversationUpdate'
  | 'event'
  | 'invoke';

/**
 * Minimal Bot Framework Activity shape - only the fields we consume.
 * The full schema is documented at:
 * https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference#activity-object
 */
export type BotFrameworkActivity = {
  type?: BotFrameworkActivityType | string;
  id?: string;
  timestamp?: string;
  serviceUrl?: string;
  channelId?: string;
  from?: { id?: string; name?: string; aadObjectId?: string };
  conversation?: {
    id?: string;
    conversationType?: string;
    tenantId?: string;
    isGroup?: boolean;
  };
  recipient?: { id?: string; name?: string };
  text?: string;
  textFormat?: string;
  attachments?: Array<{
    contentType?: string | null;
    content?: unknown;
    contentUrl?: string;
    name?: string;
  }>;
  entities?: Array<{
    type?: string;
    mentioned?: { id?: string; name?: string };
  }>;
  replyToId?: string;
  value?: unknown;
};

/**
 * Outbound activity sent to Bot Framework Connector REST API.
 */
export type BotFrameworkOutboundActivity = {
  type: string;
  text?: string;
  textFormat?: string;
  attachments?: Array<{
    contentType: string;
    /** For inline cards (e.g. adaptive cards). */
    content?: unknown;
    /** For file/image attachments served from a URL. */
    contentUrl?: string;
    /** Display name shown in Teams. */
    name?: string;
  }>;
  entities?: Array<{ type: string; [key: string]: unknown }>;
};

/** AI-generated content entity - mirrors openclaw/extensions/msteams/src/ai-entity.ts */
const AI_GENERATED_ENTITY = {
  type: 'https://schema.org/Message',
  '@type': 'Message',
  '@id': '',
  additionalType: ['AIGeneratedContent'],
};

// ── HTML helpers (from openclaw inbound.ts) ──────────────────────────────────

/**
 * Decode common HTML entities to plain text.
 */
export function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&'); // must be last - prevents double-decoding (&amp;lt; → &lt; not <)
}

/**
 * Strip HTML tags, decode entities, collapse whitespace.
 */
export function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

/**
 * Strip Teams @-mention tags - <at>BotName</at> → empty string.
 */
export function stripMsTeamsMentionTags(text: string): string {
  return text.replace(/<at[^>]*>.*?<\/at>/gi, '').trim();
}

/**
 * Normalise a Bot Framework conversation ID to the stable prefix portion.
 * Teams appends ";messageid=<N>" to conversation IDs on replies - strip it
 * so that all messages in a thread share a single conversation key.
 */
export function normalizeMsTeamsConversationId(raw: string): string {
  return raw.split(';')[0] ?? raw;
}

/**
 * Check whether the bot was @-mentioned in the activity.
 * Bot Framework puts each mention in activity.entities with type='mention'.
 */
export function wasBotMentioned(activity: BotFrameworkActivity): boolean {
  const botId = activity.recipient?.id;
  if (!botId) return false;
  return (activity.entities ?? []).some(
    (e) => e.type === 'mention' && e.mentioned?.id === botId,
  );
}

// ── Incoming → Unified ────────────────────────────────────────────────────────

/**
 * Convert a Bot Framework Activity into a IUnifiedIncomingMessage.
 *
 * Returns null for non-message activity types (conversationUpdate, invoke,
 * messageReaction, typing) - callers must check before emitting.
 *
 * selfId is the bot's own recipient ID - used to filter echo events when
 * the bot sends a message that loops back through the webhook.
 */
export function toUnifiedIncomingFromActivity(
  activity: BotFrameworkActivity,
  selfId: string,
): IUnifiedIncomingMessage | null {
  // Only handle message-type activities
  if (activity.type !== 'message') return null;

  const senderId = activity.from?.id ?? '';
  // Filter out messages from the bot itself (echo guard)
  if (senderId && selfId && senderId === selfId) return null;

  // Require conversation + message id
  const rawConvId = activity.conversation?.id ?? '';
  if (!rawConvId) return null;
  const conversationId = normalizeMsTeamsConversationId(rawConvId);

  const messageId = activity.id ?? '';
  if (!messageId) return null;

  // Extract plain text. Order matters: strip <at> mention tags BEFORE
  // htmlToPlainText so the mention's inner text (e.g. "Wayland Bot") goes
  // with the wrapper, not as bare leading text. Then strip remaining HTML.
  let text = activity.text ?? '';
  text = stripMsTeamsMentionTags(text);
  if (activity.textFormat === 'html' || text.includes('<')) {
    text = htmlToPlainText(text);
  }

  // Extract attachment info (file name + content type) for first real attachment
  const firstAttachment = (activity.attachments ?? []).find(
    (a) => a.contentType && !a.contentType.startsWith('text/'),
  );

  const timestamp = activity.timestamp ? new Date(activity.timestamp).getTime() : Date.now();

  // Encode serviceUrl into chatId so sendMessage/editMessage can route the
  // reply back to the correct Bot Framework Connector region. Format:
  // `${serviceUrl}|${conversationId}`. SendMessage already splits on the pipe.
  // Without serviceUrl, replies hit the default smba.trafficmanager.net region
  // which may be wrong for the tenant that sent us the inbound activity
  // (audit fix HIGH6 2026-05-18).
  const chatId = activity.serviceUrl
    ? `${activity.serviceUrl.replace(/\/$/, '')}|${conversationId}`
    : conversationId;

  return {
    id: messageId,
    platform: 'ms-teams',
    chatId,
    user: {
      id: senderId,
      displayName: activity.from?.name ?? senderId,
    },
    content: {
      type: firstAttachment ? 'document' : 'text',
      text,
      ...(firstAttachment
        ? {
            attachments: [
              {
                type: 'document',
                fileId: firstAttachment.contentUrl ?? firstAttachment.name ?? messageId,
                fileName: firstAttachment.name ?? 'attachment',
                mimeType: firstAttachment.contentType ?? 'application/octet-stream',
              },
            ],
          }
        : {}),
    },
    timestamp,
    raw: activity,
  };
}

// ── Outgoing → Bot Framework ──────────────────────────────────────────────────

/**
 * Build a Bot Framework message activity from a unified outgoing message.
 * Includes the AI-generated entity so Teams displays the provenance badge.
 */
export function toOutboundActivity(message: IUnifiedOutgoingMessage): BotFrameworkOutboundActivity {
  const activity: BotFrameworkOutboundActivity = {
    type: 'message',
    text: message.text ?? '',
    // Teams renders markdown when textFormat='markdown'; 'plain' would strip
    // **bold**, links, and ```code``` from agent responses. Matches OpenClaw's
    // chunkerMode='markdown' default.
    textFormat: 'markdown',
    entities: [AI_GENERATED_ENTITY],
  };

  // Image/file attachments → Bot Framework attachment. Adaptive cards are a
  // Teams-specific extension not in the unified outgoing contract; if a
  // future caller needs them, lift them via a typed extension field rather
  // than the bare `any` we used to require.
  if (message.imageUrl) {
    activity.attachments = [
      {
        contentType: 'image/*',
        contentUrl: message.imageUrl,
        name: message.fileName ?? 'image',
      },
    ];
  } else if (message.fileUrl) {
    activity.attachments = [
      {
        contentType: 'application/octet-stream',
        contentUrl: message.fileUrl,
        name: message.fileName ?? 'attachment',
      },
    ];
  }

  return activity;
}

/**
 * Split long text into chunks at sentence or word boundaries, respecting the
 * Teams 4000-character limit. Returns an array of at least one element.
 */
export function splitMsTeamsMessage(text: string, limit = MS_TEAMS_TEXT_CHUNK_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf('\n', limit);
    if (splitAt < limit * 0.5) splitAt = remaining.lastIndexOf(' ', limit);
    if (splitAt < 1) splitAt = limit;

    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}
