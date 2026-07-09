/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW MCP wire protocol - newline-delimited JSON-RPC over stdio.
 *
 * Wave-0-followup correction: the original Wave 0 implementation used
 * LSP-style Content-Length framing per Claude Agent's F-B05 audit finding.
 * Live verification against the actual `~/.ijfw/mcp-server/src/server.js`
 * confirmed IJFW uses `readline`-based newline-delimited JSON-RPC (the
 * standard MCP stdio transport). The real artifact wins over audit-cycle
 * assumptions about the spec.
 *
 * Bounded-buffer hardenings retained from the prior Content-Length impl
 * (SEC-004 / GEM-R-03): MAX_LINE_BYTES caps each message, and because the
 * retained remainder is always a single unterminated partial line, the same
 * cap bounds cumulative buffer growth on missing newlines. DecodeError fires
 * on oversize lines so callers can quarantine the child. (#721 review: the
 * former MAX_BUFFER_SIZE remainder check was unreachable - the MAX_LINE_BYTES
 * check always threw first - so it was removed.)
 *
 * #721: malformed JSON on a well-terminated line is NOT a DecodeError.
 * NDJSON is self-synchronizing at newlines, so a garbage line (e.g. a
 * misbehaving server console.logging progress to stdout) cannot desync the
 * protocol. Such lines are skipped and reported via `droppedLines` /
 * `droppedSamples` so the caller can log them - matching the official MCP
 * SDK stdio transport behavior (log-and-skip).
 */

const NEWLINE = 0x0a; // '\n'

export const MAX_LINE_BYTES = 10 * 1024 * 1024; // 10 MiB per message (also caps the retained remainder)

export function encode(message: object): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf-8');
  if (body.length + 1 > MAX_LINE_BYTES) {
    throw new Error(`encoded message exceeds MAX_LINE_BYTES (${body.length + 1} > ${MAX_LINE_BYTES})`);
  }
  return Buffer.concat([body, Buffer.from([NEWLINE])]);
}

export class DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecodeError';
  }
}

// #721: cap how much of a dropped garbage line we retain for diagnostics.
export const MAX_DROPPED_SAMPLE_CHARS = 80;
// #721: cap how many dropped-line samples a single decode() call collects.
export const MAX_DROPPED_SAMPLES = 3;

export interface DecodeResult {
  messages: unknown[];
  remainder: Buffer;
  /** #721: count of well-terminated non-JSON lines skipped in this call. */
  droppedLines: number;
  /** #721: truncated previews of the first few dropped lines, for logging. */
  droppedSamples: string[];
}

export function decode(buf: Buffer): DecodeResult {
  const messages: unknown[] = [];
  let droppedLines = 0;
  const droppedSamples: string[] = [];
  let cursor = buf;

  while (cursor.length > 0) {
    const newlineIdx = cursor.indexOf(NEWLINE);

    if (newlineIdx < 0) {
      // Partial line - verify it doesn't exceed bounds before returning remainder.
      if (cursor.length > MAX_LINE_BYTES) {
        throw new DecodeError(`unterminated line exceeds MAX_LINE_BYTES (${cursor.length} > ${MAX_LINE_BYTES})`);
      }
      break;
    }

    if (newlineIdx > MAX_LINE_BYTES) {
      throw new DecodeError(`line exceeds MAX_LINE_BYTES (${newlineIdx} > ${MAX_LINE_BYTES})`);
    }

    const lineBuf = cursor.subarray(0, newlineIdx);
    // Tolerate \r\n line endings by stripping a single trailing CR (0x0d).
    const trimmed =
      lineBuf.length > 0 && lineBuf[lineBuf.length - 1] === 0x0d ? lineBuf.subarray(0, lineBuf.length - 1) : lineBuf;
    const lineText = trimmed.toString('utf-8');

    if (lineText.trim().length > 0) {
      try {
        messages.push(JSON.parse(lineText));
      } catch {
        // #721: a garbage line cannot desync newline-delimited framing. Skip
        // it and report it instead of throwing - killing the child turned
        // third-party log noise into a connection outage.
        droppedLines++;
        if (droppedSamples.length < MAX_DROPPED_SAMPLES) {
          droppedSamples.push(lineText.slice(0, MAX_DROPPED_SAMPLE_CHARS));
        }
      }
    }
    // Empty lines (keepalives / blank stdin chunks) are skipped silently.

    cursor = cursor.subarray(newlineIdx + 1);
  }

  // The remainder needs no separate cap: it is always an unterminated partial
  // line, already bounded to MAX_LINE_BYTES by the check above.
  return { messages, remainder: cursor, droppedLines, droppedSamples };
}
