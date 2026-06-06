/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure parse/format helpers for the IRC channel plugin.
 * No side-effects, no network I/O - safe to unit test in isolation.
 */

import { randomUUID } from 'node:crypto';

import type { IUnifiedIncomingMessage, IUnifiedOutgoingMessage } from '../../../types';

// IRC PRIVMSG lines: ":prefix PRIVMSG target :text\r\n"
// The raw line overhead (prefix + PRIVMSG + target + colons + spaces + CRLF)
// typically consumes ~60-100 bytes of the 512-byte limit. 350 chars matches
// OpenClaw's default and leaves ~162 bytes of headroom - enough for long nicks
// (32+ chars) plus long channel names plus user@host on extended networks.
export const IRC_MESSAGE_CHUNK_CHARS = 350;

// ── mIRC / IRC control-char stripping ────────────────────────────────────────
// Adapted from openclaw/extensions/irc/src/control-chars.ts (MIT).

/**
 * Returns true if `charCode` is an IRC control character (≤ 0x1f or DEL 0x7f).
 * mIRC formatting codes (bold=0x02, color=0x03, italic=0x1d, underline=0x1f,
 * strikethrough=0x1e, monospace=0x11, reset=0x0f) all fall in this range.
 */
export function isIrcControlChar(charCode: number): boolean {
  return charCode <= 0x1f || charCode === 0x7f;
}

/**
 * Strip all IRC control characters from `value`. Removes mIRC color codes
 * (0x03 + optional fg,bg digits), bold (0x02), italic, underline, etc.
 * Adapted from openclaw/extensions/irc/src/control-chars.ts (MIT).
 */
export function stripIrcControlChars(value: string): string {
  // First pass: strip mIRC color sequences 0x03[fg[,bg]] where digits are 1-2 chars each.
  // eslint-disable-next-line no-control-regex
  let out = value.replace(/\x03(?:\d{1,2}(?:,\d{1,2})?)?/g, '');
  // Second pass: strip remaining control chars.
  let result = '';
  for (const char of out) {
    if (!isIrcControlChar(char.charCodeAt(0))) {
      result += char;
    }
  }
  return result;
}

// ── IRC line/target sanitisation ─────────────────────────────────────────────
// Adapted from openclaw/extensions/irc/src/protocol.ts (MIT).

/**
 * Sanitise outbound text: collapse CRLF to spaces and strip control chars.
 * Returns empty string if the result is blank.
 */
export function sanitizeIrcOutboundText(text: string): string {
  return stripIrcControlChars(text.replace(/\r?\n/g, ' ')).trim();
}

// IRC target = channel name or nick - must contain no whitespace, no colon,
// and no control characters. Anything else can smuggle protocol bytes through
// `client.say(target, line)` and forge arbitrary IRC commands.
const IRC_TARGET_PATTERN = /^[^\s:]+$/u;

/**
 * Validate an IRC target (channel or nick) before passing to client.say.
 * Throws if the input is empty, contains CR/LF/NUL/other control characters,
 * or fails the [^\s:]+ pattern. Adapted from
 * openclaw/extensions/irc/src/protocol.ts (MIT).
 */
export function sanitizeIrcTarget(raw: string): string {
  const decoded = typeof raw === 'string' ? raw.trim() : '';
  if (!decoded) {
    throw new Error('IRC target is required');
  }
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\r\n]/.test(decoded)) {
    throw new Error(`Invalid IRC target (control chars): ${raw}`);
  }
  if (!IRC_TARGET_PATTERN.test(decoded)) {
    throw new Error(`Invalid IRC target (pattern): ${raw}`);
  }
  return decoded;
}

/**
 * Split cleaned text into chunks of at most `maxChars` characters, breaking
 * at word boundaries where possible. Returns [] for blank input.
 * Adapted from openclaw/extensions/irc/src/protocol.ts (MIT).
 */
export function splitIrcText(text: string, maxChars = IRC_MESSAGE_CHUNK_CHARS): string[] {
  const cleaned = sanitizeIrcOutboundText(text);
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const chunks: string[] = [];
  let remaining = cleaned;
  while (remaining.length > maxChars) {
    let splitAt = remaining.lastIndexOf(' ', maxChars);
    if (splitAt < Math.floor(maxChars * 0.5)) splitAt = maxChars;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks.filter(Boolean);
}

// ── Incoming message conversion ───────────────────────────────────────────────

export type IrcPrivmsgEvent = {
  /** Sender nick */
  nick: string;
  /** Username part of the prefix (ident) */
  ident?: string;
  /** Host part of the prefix */
  hostname?: string;
  /** Destination channel or nick the message was sent to */
  target: string;
  /** Raw message text (may contain mIRC control chars) */
  message: string;
  /** Message tags from IRCv3 (optional) */
  tags?: Record<string, string>;
};

/**
 * Convert an irc-framework PRIVMSG event to a unified incoming message.
 *
 * Returns null for:
 * - Messages from our own nick (echo filter).
 * - CTCP messages (0x01-delimited - ACTION, VERSION, etc.) that are not /me.
 * - Empty text after stripping control chars.
 *
 * The chatId is the channel name for channel messages, or the sender nick for
 * direct/private messages (target === our own nick).
 */
export function toUnifiedIncomingFromIrc(
  event: IrcPrivmsgEvent,
  selfNick: string,
): IUnifiedIncomingMessage | null {
  // Echo filter - skip our own outbound messages.
  if (event.nick.toLowerCase() === selfNick.toLowerCase()) return null;

  const rawText = event.message;

  // CTCP detection: messages wrapped in 0x01 bytes.
  const CTCP_CHAR = '\x01';
  if (rawText.startsWith(CTCP_CHAR)) {
    // Allow /me (ACTION) to pass through as a plain text message.
    const inner = rawText.slice(1, rawText.endsWith(CTCP_CHAR) ? -1 : undefined);
    if (inner.startsWith('ACTION ')) {
      const actionText = `* ${event.nick} ${inner.slice('ACTION '.length)}`;
      return buildMessage(event, selfNick, stripIrcControlChars(actionText));
    }
    // All other CTCP messages (VERSION, PING, etc.) are silently dropped.
    return null;
  }

  const text = stripIrcControlChars(rawText);
  if (!text.trim()) return null;

  return buildMessage(event, selfNick, text);
}

function buildMessage(
  event: IrcPrivmsgEvent,
  selfNick: string,
  text: string,
): IUnifiedIncomingMessage {
  // For channel messages the chatId is the channel; for PMs it is the sender nick.
  const isChannel = event.target.startsWith('#') || event.target.startsWith('&');
  const chatId = isChannel ? event.target : event.nick;
  // Suppress unused variable warning - selfNick is used only for the echo filter
  // which happens before buildMessage is called.
  void selfNick;

  return {
    id: randomUUID(),
    platform: 'irc',
    chatId,
    user: {
      id: event.nick,
      username: event.nick,
      displayName: event.nick,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp: Date.now(),
    raw: event,
  };
}

// ── Outgoing message formatting ───────────────────────────────────────────────

export type IrcOutboundPayload = {
  /** Lines ready to send via client.say(target, line). */
  lines: string[];
};

/**
 * Convert a unified outgoing message to one or more IRC PRIVMSG lines.
 * Lines are chunked to IRC_MESSAGE_CHUNK_CHARS to respect the 512-byte limit.
 */
export function fromUnifiedOutgoingToIrc(message: IUnifiedOutgoingMessage): IrcOutboundPayload {
  const text = message.text ?? '';
  const lines = splitIrcText(text, IRC_MESSAGE_CHUNK_CHARS);
  return { lines };
}
