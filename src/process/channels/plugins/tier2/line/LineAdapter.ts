/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the LINE Messaging API webhook plugin.
 * Converts LINE webhook event payloads → IUnifiedIncomingMessage and
 * IUnifiedOutgoingMessage → LINE message objects. No side effects.
 */

import type { messagingApi } from '@line/bot-sdk';
import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// ─── Inbound types (subset of @line/bot-sdk webhook shapes) ──────────────────

export type LineEventSource =
  | { type: 'user'; userId: string }
  | { type: 'group'; groupId: string; userId?: string }
  | { type: 'room'; roomId: string; userId?: string };

export type LineTextMessageContent = {
  type: 'text';
  id: string;
  text: string;
};

export type LineMediaMessageContent = {
  type: 'image' | 'video' | 'audio' | 'file';
  id: string;
  fileName?: string;
};

export type LineStickerMessageContent = {
  type: 'sticker';
  id: string;
  packageId: string;
  stickerId: string;
  keywords?: string[];
};

export type LineLocationMessageContent = {
  type: 'location';
  id: string;
  title?: string;
  address?: string;
  latitude: number;
  longitude: number;
};

export type LineMessageContent =
  | LineTextMessageContent
  | LineMediaMessageContent
  | LineStickerMessageContent
  | LineLocationMessageContent
  | { type: string; id: string };

export type LineMessageEvent = {
  type: 'message';
  webhookEventId?: string;
  replyToken?: string;
  source?: LineEventSource;
  timestamp: number;
  message: LineMessageContent;
};

export type LineFollowEvent = {
  type: 'follow';
  source?: LineEventSource;
  timestamp: number;
  replyToken?: string;
};

export type LineUnfollowEvent = {
  type: 'unfollow';
  source?: LineEventSource;
  timestamp: number;
};

export type LinePostbackEvent = {
  type: 'postback';
  webhookEventId?: string;
  replyToken?: string;
  source?: LineEventSource;
  timestamp: number;
  postback: { data: string };
};

export type LineWebhookEvent =
  | LineMessageEvent
  | LineFollowEvent
  | LineUnfollowEvent
  | LinePostbackEvent
  | { type: string; source?: LineEventSource; timestamp: number };

export type LineCallbackRequest = {
  destination?: string;
  events: LineWebhookEvent[];
};

// ─── Outbound types ───────────────────────────────────────────────────────────

export type LineTextMessage = {
  type: 'text';
  text: string;
};

// ─── Source helpers ───────────────────────────────────────────────────────────

/**
 * Extract user/group/room identifiers from a LINE event source.
 * Adapted from openclaw/extensions/line/src/bot-message-context.ts - getLineSourceInfo.
 */
export function getLineSourceInfo(source: LineEventSource | undefined): {
  userId: string | undefined;
  groupId: string | undefined;
  roomId: string | undefined;
  isGroup: boolean;
} {
  if (!source) {
    return { userId: undefined, groupId: undefined, roomId: undefined, isGroup: false };
  }
  const userId =
    source.type === 'user'
      ? source.userId
      : source.type === 'group'
        ? source.userId
        : source.type === 'room'
          ? source.userId
          : undefined;
  const groupId = source.type === 'group' ? source.groupId : undefined;
  const roomId = source.type === 'room' ? source.roomId : undefined;
  const isGroup = source.type === 'group' || source.type === 'room';
  return { userId, groupId, roomId, isGroup };
}

/**
 * Resolve a stable chatId from a LINE event source. Group/room conversations
 * are keyed on the group/room ID; DMs are keyed on the userId.
 */
function resolveChatId(source: LineEventSource | undefined): string {
  if (!source) return 'unknown';
  if (source.type === 'group') return `group:${source.groupId}`;
  if (source.type === 'room') return `room:${source.roomId}`;
  if (source.type === 'user') return source.userId;
  return 'unknown';
}

// ─── STICKER_PACKAGES - abbreviated package names (harvest from openclaw) ────

const STICKER_PACKAGES: Record<string, string> = {
  '1': 'Moon & James',
  '2': 'Cony & Brown',
  '3': 'Brown & Friends',
  '4': 'Moon Special',
  '789': 'LINE Characters',
  '6136': "Cony's Happy Life",
  '6325': "Brown's Life",
  '6359': 'Choco',
  '6362': 'Sally',
  '6370': 'Edward',
  '11537': 'Cony',
  '11538': 'Brown',
  '11539': 'Moon',
};

/**
 * Derive a human-readable text body from a LINE message content object.
 * Returns empty string for unrecognised types - caller decides to drop or
 * synthesise a placeholder.
 * Adapted from openclaw/extensions/line/src/bot-message-context.ts - extractMessageText.
 */
export function extractLineMessageText(message: LineMessageContent): string {
  if (message.type === 'text') {
    return (message as LineTextMessageContent).text;
  }
  if (message.type === 'sticker') {
    const sticker = message as LineStickerMessageContent;
    const packageName = STICKER_PACKAGES[sticker.packageId] ?? 'sticker';
    const keywords = sticker.keywords?.slice(0, 3).join(', ') ?? '';
    return keywords
      ? `[Sent a ${packageName} sticker: ${keywords}]`
      : `[Sent a ${packageName} sticker]`;
  }
  if (message.type === 'location') {
    const loc = message as LineLocationMessageContent;
    const title = loc.title?.trim() || 'Location';
    const coords = `${loc.latitude}, ${loc.longitude}`;
    const address = loc.address?.trim();
    return address
      ? `📍 ${title} (${coords}) - ${address}`
      : `📍 ${title} (${coords})`;
  }
  if (message.type === 'image') return '<media:image>';
  if (message.type === 'video') return '<media:video>';
  if (message.type === 'audio') return '<media:audio>';
  if (message.type === 'file') return '<media:document>';
  return '';
}

// ─── Inbound conversion ───────────────────────────────────────────────────────

/**
 * Convert a LINE webhook MessageEvent into IUnifiedIncomingMessage.
 * Returns null when the event carries no usable text (e.g. an unsupported
 * message type with no content) - callers drop silently.
 */
export function lineMessageEventToUnified(event: LineMessageEvent): IUnifiedIncomingMessage | null {
  const { userId, groupId, roomId } = getLineSourceInfo(event.source);
  const chatId = resolveChatId(event.source);
  const senderId = userId ?? chatId;

  const text = extractLineMessageText(event.message);
  if (!text) return null;

  const messageId = event.message.id;

  return {
    id: messageId,
    platform: 'line',
    chatId,
    user: {
      id: senderId,
      displayName: senderId,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp: event.timestamp,
    raw: { event, groupId, roomId },
  };
}

/**
 * Convert a LINE PostbackEvent into IUnifiedIncomingMessage.
 * Returns null when postback data is empty.
 */
export function linePostbackEventToUnified(
  event: LinePostbackEvent,
): IUnifiedIncomingMessage | null {
  const data = event.postback?.data?.trim() ?? '';
  if (!data) return null;

  // LINE built-in actions arrive as URL-encoded querystrings with a
  // `line.action=` prefix. Rewrite to a human-readable phrase so the agent
  // sees an actionable intent rather than an opaque querystring.
  // Adapted from openclaw/extensions/line/src/bot-message-context.ts:538-543.
  let text = data;
  if (data.includes('line.action=')) {
    const searchParams = new URLSearchParams(data);
    const action = searchParams.get('line.action') ?? '';
    const device = searchParams.get('line.device');
    text = device ? `line action ${action} device ${device}` : `line action ${action}`;
  }

  const { userId } = getLineSourceInfo(event.source);
  const chatId = resolveChatId(event.source);
  const senderId = userId ?? chatId;
  const messageId = event.replyToken ? `postback:${event.replyToken}` : `postback:${event.timestamp}`;

  return {
    id: messageId,
    platform: 'line',
    chatId,
    user: {
      id: senderId,
      displayName: senderId,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp: event.timestamp,
    raw: { event },
  };
}

// ─── Outbound conversion ──────────────────────────────────────────────────────

/**
 * Build a LINE text message object from IUnifiedOutgoingMessage.
 * LINE v11 SDK uses `{ type: 'text', text: string }`.
 */
export function toLineTextMessage(message: IUnifiedOutgoingMessage): messagingApi.TextMessage {
  const text = (message.text ?? '').trim();
  if (!text) throw new Error('LINE send body cannot be empty');
  // LINE text messages max 5000 chars; truncate rather than throw.
  return { type: 'text', text: text.slice(0, 5000) };
}
