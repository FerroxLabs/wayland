/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the Mattermost channel plugin.
 * No side effects - all functions are stateless transforms.
 */

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// Mattermost hard-limits posts to 16383 chars. We stay safely under that.
export const MATTERMOST_MESSAGE_LIMIT = 4000;

/**
 * Subset of the Mattermost WebSocket "posted" event data payload we care about.
 * Harvested from openclaw/extensions/mattermost/src/mattermost/monitor-websocket.ts.
 */
export type MattermostPost = {
  id: string;
  user_id?: string | null;
  channel_id?: string | null;
  message?: string | null;
  root_id?: string | null;
  create_at?: number | null;
  type?: string | null;
  file_ids?: readonly string[];
  props?: Record<string, unknown>;
};

export type MattermostEventPayload = {
  event?: string;
  data?: {
    post?: string | MattermostPost;
    channel_type?: string;
    sender_name?: string;
    team_id?: string;
  };
  broadcast?: {
    channel_id?: string;
    team_id?: string;
    user_id?: string;
  };
};

/**
 * Parse a raw WebSocket message string into a MattermostEventPayload.
 * Returns null if the string is not valid JSON or not a recognized shape.
 */
export function parseMattermostWsEvent(raw: string): MattermostEventPayload | null {
  try {
    return JSON.parse(raw) as MattermostEventPayload;
  } catch {
    return null;
  }
}

/**
 * Extract a MattermostPost from an event payload's data.post field.
 * Mattermost sends post as a JSON-encoded string inside the WS event data.
 */
export function extractPostFromEvent(payload: MattermostEventPayload): MattermostPost | null {
  const postData = payload.data?.post;
  if (!postData) return null;
  if (typeof postData === 'string') {
    try {
      return JSON.parse(postData) as MattermostPost;
    } catch {
      return null;
    }
  }
  return postData;
}

/**
 * Convert a Mattermost "posted" event into a Wayland IUnifiedIncomingMessage.
 * Returns null for:
 * - non-"posted" events
 * - posts from the bot itself (echo filter via selfUserId)
 * - system messages (type !== '')
 * - empty messages
 */
export function toUnifiedIncomingFromMattermost(
  payload: MattermostEventPayload,
  selfUserId: string,
): IUnifiedIncomingMessage | null {
  if (payload.event !== 'posted') return null;

  const post = extractPostFromEvent(payload);
  if (!post) return null;

  // Drop system messages (join/leave/etc. have non-empty type).
  if (post.type && post.type !== '') return null;

  // Drop bot's own messages to prevent loops.
  if (post.user_id === selfUserId) return null;

  const text = post.message?.trim() ?? '';
  if (!text) return null;

  const channelId = post.channel_id ?? payload.broadcast?.channel_id ?? '';
  const userId = post.user_id ?? '';
  // Audit MED 2026-05-18: prefer sender_name (typically "@username") from
  // the WS event over the raw user_id UUID. Mattermost ships it on every
  // posted event; without this fix any UI rendering the author surfaces a
  // user_id like "abc123def456" instead of "@alice".
  const senderName = payload.data?.sender_name;
  const username = senderName ?? userId;
  const displayName = senderName ?? userId;

  return {
    id: post.id,
    content: { type: 'text', text },
    user: {
      id: userId,
      username,
      displayName,
    },
    chatId: channelId,
    timestamp: post.create_at ? Number(post.create_at) : Date.now(),
    replyToMessageId: post.root_id ?? undefined,
    platform: 'mattermost',
  };
}

/**
 * Split a long message into chunks that fit within MATTERMOST_MESSAGE_LIMIT.
 * Splits on newlines where possible to avoid breaking mid-sentence.
 * Harvested logic from openclaw text-chunking patterns.
 */
export function splitMattermostMessage(text: string, limit = MATTERMOST_MESSAGE_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf('\n', limit);
    if (splitAt <= 0) splitAt = limit;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).replace(/^\n/, '');
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Build the REST payload for POST /api/v4/posts from a unified outgoing message.
 */
export function toMattermostPostPayload(
  channelId: string,
  message: IUnifiedOutgoingMessage,
  rootId?: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    channel_id: channelId,
    message: message.text ?? '',
  };
  if (rootId) payload.root_id = rootId;
  return payload;
}

/**
 * Build the REST payload for PUT /api/v4/posts/{id} (edit).
 */
export function toMattermostEditPayload(
  postId: string,
  message: IUnifiedOutgoingMessage,
): Record<string, unknown> {
  return {
    id: postId,
    message: message.text ?? '',
  };
}
