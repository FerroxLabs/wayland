/**
 * Portions of this file are derived from OpenClaw's discord extension
 *   https://github.com/openclaw/openclaw  (extensions/discord/src/normalize.ts, outbound-adapter.ts)
 *   Copyright OpenClaw contributors, licensed under the MIT License.
 *
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Attachment, Message as DiscordMessage, User as DiscordUser } from 'discord.js';

import type {
  IUnifiedAttachment,
  IUnifiedIncomingMessage,
  IUnifiedMessageContent,
  IUnifiedOutgoingMessage,
  IUnifiedUser,
} from '../../../types';

/**
 * DiscordAdapter — converts between discord.js native types and the unified
 * channel message contract used by ActionExecutor / SessionManager.
 *
 * Pure functions only — no Gateway / API side effects. Keep this file free of
 * `discord.js` runtime objects (clients, channels) so the same adapter can be
 * unit-tested without booting a Gateway connection.
 */

// Discord enforces a 2000-character message limit on the standard
// channels.messages POST endpoint. Nitro raises to 4000 but bot accounts can't
// use Nitro, so 2000 is the hard ceiling for our outbound chunker.
export const DISCORD_MESSAGE_LIMIT = 2000;

// ==================== Incoming Conversion ====================

export function toUnifiedUser(user: DiscordUser | null | undefined): IUnifiedUser | null {
  if (!user) return null;
  const displayName = user.globalName || user.username || `User ${user.id}`;
  return {
    id: user.id,
    username: user.username,
    displayName,
    avatarUrl: typeof user.displayAvatarURL === 'function' ? user.displayAvatarURL() : undefined,
  };
}

function attachmentTypeFromMime(mime: string | null | undefined): IUnifiedAttachment['type'] {
  const m = (mime ?? '').toLowerCase();
  if (m.startsWith('image/')) return 'photo';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('video/')) return 'video';
  return 'document';
}

function toUnifiedAttachments(attachments: readonly Attachment[]): IUnifiedAttachment[] {
  return attachments.map((att): IUnifiedAttachment => ({
    type: attachmentTypeFromMime(att.contentType),
    fileId: att.id,
    fileName: att.name ?? undefined,
    mimeType: att.contentType ?? undefined,
    size: att.size,
  }));
}

function extractContent(msg: DiscordMessage): IUnifiedMessageContent {
  const attachments = msg.attachments ? Array.from(msg.attachments.values()) : [];
  const unifiedAttachments = toUnifiedAttachments(attachments);

  if (attachments.length > 0) {
    const first = unifiedAttachments[0];
    const type: IUnifiedMessageContent['type'] =
      first.type === 'photo' || first.type === 'audio' || first.type === 'video' ? first.type : 'document';
    return {
      type,
      text: msg.content ?? '',
      attachments: unifiedAttachments,
    };
  }

  return {
    type: 'text',
    text: msg.content ?? '',
  };
}

/**
 * Convert a discord.js Message into the unified incoming format.
 *
 * Returns null if the message lacks an author (system events, webhook stubs).
 */
export function toUnifiedIncomingMessage(msg: DiscordMessage): IUnifiedIncomingMessage | null {
  const user = toUnifiedUser(msg.author);
  if (!user) return null;

  return {
    id: msg.id,
    platform: 'discord',
    // Discord conflates DM / guild text channels under `channelId`; that is
    // the right shard key for routing replies. Guild membership lives on
    // msg.guildId and is preserved in `raw` for moderation actions.
    chatId: msg.channelId,
    user,
    content: extractContent(msg),
    timestamp: msg.createdTimestamp,
    replyToMessageId: msg.reference?.messageId ?? undefined,
    raw: msg,
  };
}

// ==================== Outgoing Conversion ====================

export interface DiscordSendParams {
  content: string;
  /** Render hint for clients that style markdown differently per surface. */
  flags?: number;
}

/**
 * Convert a unified outgoing message into discord.js channel.send() options.
 *
 * discord.js accepts a string OR a MessagePayload; we always return a
 * normalized object so callers can spread extra fields (allowedMentions,
 * components) without re-parsing parseMode.
 */
export function toDiscordSendParams(message: IUnifiedOutgoingMessage): DiscordSendParams {
  // Discord renders markdown server-side. parseMode 'HTML' is not supported;
  // we down-convert to plain (Discord ignores HTML and renders it literally).
  return {
    content: message.text ?? '',
  };
}

/**
 * Split a long message into Discord-safe chunks at paragraph or word
 * boundaries. Mirrors splitMessage in TelegramAdapter but adapted for the
 * Discord 2000-char limit and code-fence preservation.
 */
export function splitMessage(text: string, limit: number = DISCORD_MESSAGE_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    // Prefer to split at a double-newline (paragraph) within the limit window.
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
