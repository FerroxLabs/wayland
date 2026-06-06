/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Block, KnownBlock } from '@slack/web-api';
import type {
  AttachmentType,
  IUnifiedIncomingMessage,
  IUnifiedOutgoingMessage,
  IUnifiedUser,
  MessageContentType,
} from '../../../types';
import { buildSlackBlocksFallbackText } from './blocks-fallback';

/**
 * Slack message size cap (chat.postMessage practical limit ~40k, but we chunk
 * around the documented 3000 plain-text block element ceiling for safety -
 * leaves headroom for markdown expansion).
 */
export const SLACK_MESSAGE_LIMIT = 3000;

/**
 * Slack file attachment surface (whittled subset of message.files[*]).
 * Slack exposes both image MIME types (image/png etc.) and arbitrary mimes
 * for documents; we map them to the unified attachment vocabulary.
 */
export type SlackFile = {
  id?: string;
  name?: string;
  mimetype?: string;
  filetype?: string;
};

/**
 * Slack message event subset we read. Mirrors the slack-events-api `message`
 * payload shape that Bolt forwards under `event` for both Socket Mode and
 * Events API transports.
 */
export type SlackMessageEvent = {
  ts: string;
  channel: string;
  user?: string;
  bot_id?: string;
  text?: string;
  thread_ts?: string;
  files?: SlackFile[];
  subtype?: string;
};

/**
 * Information the plugin learns about itself at auth.test time.
 */
export type SlackBotInfo = {
  userId: string;
  teamId: string;
  team?: string;
  user?: string;
};

/**
 * Format a unified action button row into Slack actions block elements.
 * Slack inline buttons go inside an `actions` block whose elements are
 * `button` interactive components.
 */
function buttonsToBlocks(
  buttons?: readonly (readonly { label: string; action: string }[])[],
): KnownBlock[] | undefined {
  if (!buttons || buttons.length === 0) return undefined;
  const blocks: KnownBlock[] = [];
  for (const row of buttons) {
    if (row.length === 0) continue;
    blocks.push({
      type: 'actions',
      elements: row.slice(0, 25).map((b) => ({
        type: 'button',
        action_id: b.action,
        text: { type: 'plain_text', text: b.label.slice(0, 75), emoji: true },
        value: b.action,
      })),
    });
  }
  return blocks.length > 0 ? blocks : undefined;
}

/**
 * Split a long Slack message into chunks under SLACK_MESSAGE_LIMIT, breaking
 * on paragraph then sentence boundaries before falling back to hard cuts.
 */
export function splitSlackMessage(text: string, limit = SLACK_MESSAGE_LIMIT): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    let cut = remaining.lastIndexOf('\n\n', limit);
    if (cut < limit / 2) cut = remaining.lastIndexOf('\n', limit);
    if (cut < limit / 2) cut = remaining.lastIndexOf('. ', limit);
    if (cut < limit / 2) cut = limit;
    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Outbound attachment descriptor passed from the unified message to the
 * plugin so it can drive Slack's 3-step external upload flow
 * (files.getUploadURLExternal → POST → completeUploadExternal). F10 MED:
 * prior code carried text-only outgoing payloads, silently dropping
 * attachments uploaded via the compose box.
 */
export type SlackOutgoingAttachment = {
  data: Buffer | Uint8Array | string;
  filename?: string;
  mimeType?: string;
  title?: string;
};

export type SlackSendParams = {
  text: string;
  blocks?: (Block | KnownBlock)[];
  thread_ts?: string;
  attachments?: SlackOutgoingAttachment[];
};

/**
 * Build the payload for chat.postMessage / chat.update from a unified outgoing
 * message. Inline buttons become an actions block when no explicit blocks are
 * provided; explicit blocks take precedence.
 */
export function toSlackSendParams(message: IUnifiedOutgoingMessage): SlackSendParams {
  const blocks = buttonsToBlocks(message.buttons);
  const params: SlackSendParams = {
    text: message.text ?? '',
  };
  if (blocks) params.blocks = blocks;
  if (message.replyToMessageId) params.thread_ts = message.replyToMessageId;
  // F10 MED: forward outbound attachments through to the plugin so it can
  // call Slack's 3-step external upload flow alongside chat.postMessage.
  const outgoing = (message as { attachments?: SlackOutgoingAttachment[] }).attachments;
  if (Array.isArray(outgoing) && outgoing.length > 0) {
    const usable = outgoing.filter((a) => a && a.data !== undefined && a.data !== null);
    if (usable.length > 0) params.attachments = usable;
  }
  // Ensure a non-empty `text` accompanies blocks: Slack requires text as the
  // notification fallback when blocks are present.
  if (params.blocks && !params.text.trim()) {
    params.text = buildSlackBlocksFallbackText(params.blocks);
  }
  return params;
}

function mapSlackFileToAttachmentType(file: SlackFile): AttachmentType {
  const mime = file.mimetype ?? '';
  if (mime.startsWith('image/')) return 'photo';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

function buildUser(event: SlackMessageEvent): IUnifiedUser {
  const id = event.user ?? event.bot_id ?? 'slack-unknown';
  return {
    id,
    displayName: id,
  };
}

/**
 * Convert a Slack message event into the unified inbound shape. Returns null
 * for messages we deliberately drop (bot self-messages, message_changed
 * subtype, missing ts).
 */
export function toUnifiedIncomingMessage(
  event: SlackMessageEvent,
  selfBotUserId: string | undefined,
): IUnifiedIncomingMessage | null {
  if (!event?.ts || !event.channel) return null;
  // Drop messages from ourselves to avoid feedback loops.
  if (selfBotUserId && event.user === selfBotUserId) return null;
  // F7 MED: forward fresh user posts plus subtypes a Wayland-driven bot
  // routinely cares about (app_mention, bot_message from other bots,
  // me_message, thread_broadcast, file_share). Drop edit/delete-style
  // subtypes that would otherwise replay state changes (message_changed,
  // message_deleted, channel_join, etc.).
  if (
    event.subtype &&
    event.subtype !== 'file_share' &&
    event.subtype !== 'app_mention' &&
    event.subtype !== 'bot_message' &&
    event.subtype !== 'me_message' &&
    event.subtype !== 'thread_broadcast'
  ) {
    return null;
  }

  const file = event.files?.[0];
  const attachmentType: AttachmentType | null = file ? mapSlackFileToAttachmentType(file) : null;
  const contentType: MessageContentType = attachmentType ?? 'text';
  const text = event.text ?? '';

  const message: IUnifiedIncomingMessage = {
    id: event.ts,
    platform: 'slack',
    chatId: event.channel,
    user: buildUser(event),
    content: {
      type: contentType,
      text,
      ...(file && attachmentType
        ? {
            attachments: [
              {
                type: attachmentType,
                fileId: file.id ?? event.ts,
                ...(file.name ? { fileName: file.name } : {}),
                ...(file.mimetype ? { mimeType: file.mimetype } : {}),
              },
            ],
          }
        : {}),
    },
    // LOW finding: preserve millisecond precision from Slack's
    // "<seconds>.<microseconds>" ts so sub-second ordering is retained.
    timestamp: Math.floor(Number.parseFloat(event.ts) * 1000),
    ...(event.thread_ts && event.thread_ts !== event.ts ? { replyToMessageId: event.thread_ts } : {}),
    raw: event,
  };
  return message;
}
