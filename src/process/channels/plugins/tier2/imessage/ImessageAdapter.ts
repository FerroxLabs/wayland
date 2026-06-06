/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw (https://github.com/steipete/openclaw)
 * Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 *
 * Pure adapter functions: chat.db row → IUnifiedIncomingMessage, and the
 * quoteAppleScriptString helper used by all outbound osascript invocations.
 */

import type { IUnifiedIncomingMessage } from '../../../types';

// ---------------------------------------------------------------------------
// chat.db row shape
// ---------------------------------------------------------------------------

/**
 * Minimal projection of a chat.db `message` row joined with `handle`.
 * Only the columns we actually read are typed here.
 */
export type ChatDbRow = {
  /** Primary key from the `message` table */
  readonly rowid: number;
  /** Message body text (may be null for attachments OR Ventura+ rich messages) */
  readonly text: string | null;
  /**
   * macOS Ventura+ stores rich/edited/threaded message text in this binary
   * NSKeyedArchiver plist column instead of `text`. When `text IS NULL` we
   * MUST extract from this blob or the message vanishes. See REVIEW F6.
   */
  readonly attributed_body?: Buffer | Uint8Array | null;
  /** 1 if sent by this Mac's iCloud account, 0 if received */
  readonly is_from_me: number;
  /** Unix timestamp in nanoseconds (chat.db stores ns since 2001-01-01) */
  readonly date: number;
  /** GUID of the chat this message belongs to */
  readonly chat_guid: string;
  /** chat.service_name: 'iMessage' | 'SMS' (Apple keeps both casings stable) */
  readonly chat_service_name?: string | null;
  /** Sender handle string (e.g. "+15551234567" or "user@icloud.com") */
  readonly sender_handle: string | null;
  /** Whether the chat is a group chat (1) or 1:1 (0) */
  readonly is_group: number;
};

// ---------------------------------------------------------------------------
// Security helper - MUST be used for all AppleScript string interpolation
// ---------------------------------------------------------------------------

/**
 * Escape a string for safe embedding inside an AppleScript double-quoted
 * string literal. Two characters need escaping:
 *   - `\`  → `\\`   (AppleScript uses backslash escaping inside strings)
 *   - `"`  → `\"`   (would close the string literal prematurely)
 *
 * Call this on EVERY user-controlled value before interpolating into an
 * osascript script string. Failing to do so is a script-injection vector.
 *
 * Examples:
 *   quoteAppleScriptString('hello')        → '"hello"'
 *   quoteAppleScriptString('say "hi"')     → '"say \\"hi\\""'
 *   quoteAppleScriptString('back\\slash')  → '"back\\\\slash"'
 *   quoteAppleScriptString('line1\nline2') → '"line1\\nline2"'  (newlines literal in AS)
 */
export function quoteAppleScriptString(s: string): string {
  // 0. Strip NUL bytes - AppleScript can mis-handle them and they have no
  //    legitimate place in a user-visible message body.
  // 1. Escape backslashes first (must come before quote escaping).
  // 2. Escape double-quotes.
  // 3. Wrap in double-quotes to produce a valid AppleScript string literal.
  const escaped = s
    .replaceAll('\u0000', '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `"${escaped}"`;
}

// ---------------------------------------------------------------------------
// ROWID cursor helpers
// ---------------------------------------------------------------------------

/**
 * Apple's CoreData epoch is 2001-01-01 00:00:00 UTC in nanoseconds.
 * Convert a chat.db `date` column value to a JS millisecond timestamp.
 */
export function chatDbDateToMs(dateNs: number): number {
  // CoreData epoch offset: 978307200 seconds between Unix epoch and 2001-01-01
  const APPLE_EPOCH_OFFSET_S = 978_307_200;
  return Math.round(dateNs / 1_000_000) + APPLE_EPOCH_OFFSET_S * 1000;
}

// ---------------------------------------------------------------------------
// Row → IUnifiedIncomingMessage
// ---------------------------------------------------------------------------

/**
 * Convert a chat.db row (joined with handle) into Wayland's unified incoming
 * message format. Returns null for rows that should be ignored:
 *   - sent by this device (is_from_me === 1)
 *   - no usable text body
 *   - missing required fields
 */
export function rowToUnifiedMessage(row: ChatDbRow): IUnifiedIncomingMessage | null {
  // Ignore own messages to prevent echo loops.
  if (row.is_from_me === 1) return null;

  // F6: prefer m.text; on macOS Ventura+ rich/edited/thread-reply bodies live
  // in m.attributedBody (binary NSKeyedArchiver plist). Without the fallback
  // those messages are silently dropped from the inbound stream.
  let text = row.text?.trim() ?? '';
  if (!text && row.attributed_body) {
    text = decodeAttributedBody(row.attributed_body).trim();
  }
  if (!text) return null;

  // Require a sender handle.
  const senderId = row.sender_handle?.trim() ?? '';
  if (!senderId) return null;

  // chatId is the chat GUID for groups, or the normalized handle for 1:1.
  const chatId = row.is_group === 1 ? row.chat_guid : normalizeSenderId(senderId);

  return {
    id: String(row.rowid),
    platform: 'imessage',
    chatId,
    user: {
      id: normalizeSenderId(senderId),
      displayName: senderId,
    },
    content: {
      type: 'text',
      text,
    },
    timestamp: chatDbDateToMs(row.date),
    raw: row,
  };
}

// ---------------------------------------------------------------------------
// Handle normalization (adapted from openclaw/extensions/imessage/src/normalize.ts)
// ---------------------------------------------------------------------------

const SERVICE_PREFIX_RE = /^(imessage:|sms:|auto:)/i;

/**
 * Strip service prefix (imessage:, sms:, auto:) and lowercase email addresses.
 * Phone numbers are left in E.164 form if already normalized; otherwise trimmed.
 */
export function normalizeSenderId(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  for (const prefix of ['imessage:', 'sms:', 'auto:']) {
    if (lower.startsWith(prefix)) {
      return normalizeSenderId(trimmed.slice(prefix.length));
    }
  }

  if (SERVICE_PREFIX_RE.test(trimmed)) {
    return trimmed.replace(SERVICE_PREFIX_RE, '');
  }

  if (trimmed.includes('@')) {
    return lower;
  }

  return trimmed.replace(/\s+/g, '');
}

// ---------------------------------------------------------------------------
// attributedBody decoder (F6)
// ---------------------------------------------------------------------------

/**
 * Best-effort extractor for the visible text inside chat.db's `attributedBody`
 * NSKeyedArchiver binary plist (macOS Ventura+ stores rich/edited/thread-
 * reply bodies here instead of `m.text`). Full NSKeyedUnarchiver semantics
 * are non-trivial to reimplement in JS, so this scans the binary for the
 * archived `NSString` blob following the last NSString class marker - which
 * matches Apple's archive layout in 13.x / 14.x / 15.x.
 *
 * Returns '' if extraction fails - caller drops the message rather than
 * emit garbage. See REVIEW F6.
 */
export function decodeAttributedBody(buf: Buffer | Uint8Array | string): string {
  if (typeof buf === 'string') return buf;
  if (!buf || buf.length === 0) return '';

  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const asLatin = bytes.toString('binary');

  // Locate the LAST NSString class marker - the user-visible body string is
  // archived after the class-table entries and before the $objects trailer.
  const markerIdx = Math.max(
    asLatin.lastIndexOf('NSString'),
    asLatin.lastIndexOf('NSMutableString'),
  );
  if (markerIdx < 0) return '';

  // bplist00 string type tags (Apple Binary Plist v0):
  //   0x4x → ASCII, length = low nibble (1..14); 0x4F = extended length
  //   0x5x → UTF-8, length = low nibble (1..14); 0x5F = extended length
  //   0x6x → UTF-16, length = low nibble (1..14); 0x6F = extended length
  for (let i = markerIdx + 'NSString'.length; i < bytes.length - 1; i++) {
    const b = bytes[i];
    if (b == null) continue;

    // Short ASCII / UTF-8: high nibble 0x4 or 0x5, length = low nibble.
    if (b >= 0x41 && b <= 0x5e && (b & 0xf0) !== 0x40 ? false : false) {
      // unreachable - replaced by branches below
    }
    if ((b >= 0x41 && b <= 0x4e) || (b >= 0x51 && b <= 0x5e)) {
      const len = b & 0x0f;
      const slice = bytes.slice(i + 1, i + 1 + len);
      const txt = slice.toString('utf8');
      if (looksLikePrintable(txt)) return txt;
      continue;
    }

    // Extended-length variants: 0x4F / 0x5F / 0x6F → next byte is 0x1x int
    // marker telling us how many bytes encode the length.
    if (b === 0x4f || b === 0x5f || b === 0x6f) {
      const intMarker = bytes[i + 1];
      if (intMarker == null) continue;
      const intBytes = 1 << (intMarker & 0x0f); // 0x10 → 1, 0x11 → 2, 0x12 → 4
      if (intBytes > 4) continue;
      let len = 0;
      for (let k = 0; k < intBytes; k++) {
        len = (len << 8) | (bytes[i + 2 + k] ?? 0);
      }
      if (len <= 0 || len > 64 * 1024) continue;
      const start = i + 2 + intBytes;
      const slice = bytes.slice(start, start + len);
      const txt = b === 0x6f ? slice.toString('utf16le') : slice.toString('utf8');
      if (looksLikePrintable(txt)) return txt;
    }
  }
  return '';
}

/**
 * Reject candidate slices that are clearly archive plumbing (class names,
 * key markers) rather than user-visible text. Threshold: >=70% printable.
 */
function looksLikePrintable(s: string): boolean {
  if (!s || s.length === 0) return false;
  const blacklist = [
    'NSString',
    'NSMutableString',
    'NSDictionary',
    'NSAttributedString',
    '$class',
    '$classname',
    'NSObject',
    'NSValue',
  ];
  if (blacklist.some((k) => s.includes(k))) return false;

  let printable = 0;
  let total = 0;
  for (const ch of s) {
    total++;
    const code = ch.codePointAt(0) ?? 0;
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126) || code > 0x9f) {
      printable++;
    }
  }
  return total > 0 && printable / total >= 0.7;
}
