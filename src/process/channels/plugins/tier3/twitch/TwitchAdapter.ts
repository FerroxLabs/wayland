/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the Twitch channel plugin.
 * No side-effects, no network I/O - safe to unit test in isolation.
 *
 * Adapted from openclaw/extensions/twitch/src/utils/markdown.ts (stripMarkdownForTwitch,
 * chunkTextForTwitch) and openclaw/extensions/twitch/src/utils/twitch.ts.
 */

import { randomUUID } from 'node:crypto';

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

/** Twitch chat hard limit - messages exceeding this are rejected by the server. */
export const TWITCH_MESSAGE_CHUNK_CHARS = 500;

// ── Markdown stripping ────────────────────────────────────────────────────────
// Adapted from openclaw/extensions/twitch/src/utils/markdown.ts (MIT).

/**
 * Strip markdown formatting from text for Twitch compatibility.
 * Twitch chat is single-line plain text - markdown is useless and emotes
 * must be preserved as their raw text form (e.g. "Kappa", "PogChamp").
 */
export function stripMarkdownForTwitch(markdown: string): string {
  return (
    markdown
      // Images
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')
      // Links - keep display text
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      // Bold (**text**)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Bold (__text__)
      .replace(/__([^_]+)__/g, '$1')
      // Italic (*text*)
      .replace(/\*([^*]+)\*/g, '$1')
      // Italic (_text_)
      .replace(/_([^_]+)_/g, '$1')
      // Strikethrough (~~text~~)
      .replace(/~~([^~]+)~~/g, '$1')
      // Code blocks - keep inner text
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?/g, '').replace(/```/g, ''))
      // Inline code
      .replace(/`([^`]+)`/g, '$1')
      // Headers
      .replace(/^#{1,6}\s+/gm, '')
      // Lists
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Normalize whitespace - Twitch is single-line
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  );
}

// ── Chunking ──────────────────────────────────────────────────────────────────
// Adapted from openclaw/extensions/twitch/src/utils/markdown.ts (MIT).

/**
 * Strip markdown then split at word boundaries to respect TWITCH_MESSAGE_CHUNK_CHARS.
 * Returns [] for blank input.
 */
export function chunkTextForTwitch(text: string, limit = TWITCH_MESSAGE_CHUNK_CHARS): string[] {
  const cleaned = stripMarkdownForTwitch(text);
  if (!cleaned) return [];
  if (limit <= 0) return [cleaned];
  if (cleaned.length <= limit) return [cleaned];

  const chunks: string[] = [];
  let remaining = cleaned;

  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);
    const lastSpace = window.lastIndexOf(' ');
    if (lastSpace === -1) {
      chunks.push(window);
      remaining = remaining.slice(limit);
    } else {
      chunks.push(window.slice(0, lastSpace));
      remaining = remaining.slice(lastSpace + 1);
    }
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

// ── Channel normalisation ─────────────────────────────────────────────────────

/**
 * Normalise a Twitch channel name: lowercase, strip leading '#'.
 * tmi.js JOIN accepts both forms but canonical is without '#'.
 */
export function normalizeTwitchChannel(channel: string): string {
  const trimmed = channel.trim().toLowerCase();
  return trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
}

/**
 * Strip the "oauth:" prefix that some token generators include.
 * tmi.js requires the bare token.
 */
export function normalizeTwitchToken(token: string): string {
  return token.startsWith('oauth:') ? token.slice(6) : token;
}

// ── Incoming message conversion ───────────────────────────────────────────────

/**
 * Raw tmi.js message event shape (subset we consume).
 * tmi.js delivers: channel, userstate, message, self
 */
export type TmiMessageEvent = {
  channel: string;
  userstate: {
    id?: string;
    'user-id'?: string;
    username?: string;
    'display-name'?: string;
    'message-type'?: string;
    emotes?: Record<string, string[]> | null;
    // F-3: Twitch role tags. tmi.js delivers these as IRCv3 tag strings
    // ('1' / '0') or sometimes booleans depending on version.
    mod?: string | boolean;
    subscriber?: string | boolean;
    vip?: string | boolean;
    turbo?: string | boolean;
    badges?: Record<string, string> | null;
    'badges-raw'?: string;
    bits?: string;
  };
  message: string;
  self: boolean;
};

/** F-3: Extracted Twitch role flags + raw badge map. */
export type TwitchRoles = {
  isMod: boolean;
  isVip: boolean;
  isSubscriber: boolean;
  isBroadcaster: boolean;
  badges: Record<string, string>;
};

function flagTrue(value: string | boolean | undefined): boolean {
  if (value === true) return true;
  return value === '1';
}

/**
 * F-3: Extract role/badge metadata from a tmi.js userstate.
 * Exported for unit tests.
 */
export function extractTwitchRoles(userstate: TmiMessageEvent['userstate']): TwitchRoles {
  const badges = userstate.badges ?? {};
  return {
    isMod: flagTrue(userstate.mod),
    isVip: flagTrue(userstate.vip),
    isSubscriber: flagTrue(userstate.subscriber) || Boolean(badges['subscriber']),
    isBroadcaster: badges['broadcaster'] === '1',
    badges: { ...badges },
  };
}

/**
 * Convert a tmi.js PRIVMSG event to a unified incoming message.
 *
 * Returns null for:
 * - Messages from our own bot (self === true).
 * - Empty text after stripping.
 * - Non-PRIVMSG message types (action /me is allowed through).
 *
 * Emotes are preserved as their text form - tmi.js delivers the raw chat
 * text (e.g. "Hello Kappa !") which already contains the emote word.
 */
export function toUnifiedIncomingFromTwitch(event: TmiMessageEvent): IUnifiedIncomingMessage | null {
  if (event.self) return null;

  const msgType = event.userstate['message-type'];
  // Only handle chat messages and /me actions.
  if (msgType && msgType !== 'chat' && msgType !== 'action') return null;

  const text = event.message.trim();
  if (!text) return null;

  const userId = event.userstate['user-id'] ?? event.userstate.username ?? 'unknown';
  const username = event.userstate.username ?? userId;
  const displayName = event.userstate['display-name'] ?? username;

  // chatId is the channel name (normalised, no '#')
  const chatId = normalizeTwitchChannel(event.channel);

  // F-3: extract role/badge metadata so downstream agents can gate on
  // mods-only / subs-only / broadcaster without re-parsing IRC tags.
  const roles = extractTwitchRoles(event.userstate);

  return {
    id: event.userstate.id ?? randomUUID(),
    platform: 'twitch',
    chatId,
    user: {
      id: userId,
      username,
      displayName,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp: Date.now(),
    raw: { ...event, roles },
  };
}

// ── Outgoing message formatting ───────────────────────────────────────────────

export type TwitchOutboundPayload = {
  /** Lines ready to send via client.say(channel, line). */
  lines: string[];
};

/**
 * Convert a unified outgoing message to one or more Twitch chat lines.
 * Strips markdown and chunks at TWITCH_MESSAGE_CHUNK_CHARS.
 */
export function fromUnifiedOutgoingToTwitch(message: IUnifiedOutgoingMessage): TwitchOutboundPayload {
  const text = message.text ?? '';
  const lines = chunkTextForTwitch(text, TWITCH_MESSAGE_CHUNK_CHARS);
  return { lines };
}
