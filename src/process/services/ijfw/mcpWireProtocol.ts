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
 * (SEC-004 / GEM-R-03): MAX_LINE_BYTES caps each message, MAX_BUFFER_SIZE
 * prevents unbounded growth on missing newlines, DecodeError fires on
 * malformed JSON or oversize lines so callers can quarantine the child.
 */

const NEWLINE = 0x0a; // '\n'

export const MAX_LINE_BYTES = 10 * 1024 * 1024; // 10 MiB per message
export const MAX_BUFFER_SIZE = 16 * 1024 * 1024; // 16 MiB retained-buffer cap

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

export interface DecodeResult {
  messages: unknown[];
  remainder: Buffer;
}

export function decode(buf: Buffer): DecodeResult {
  const messages: unknown[] = [];
  let cursor = buf;

  while (cursor.length > 0) {
    const newlineIdx = cursor.indexOf(NEWLINE);

    if (newlineIdx < 0) {
      // Partial line - verify it doesn't exceed bounds before returning remainder.
      if (cursor.length > MAX_LINE_BYTES) {
        throw new DecodeError(
          `unterminated line exceeds MAX_LINE_BYTES (${cursor.length} > ${MAX_LINE_BYTES})`,
        );
      }
      break;
    }

    if (newlineIdx > MAX_LINE_BYTES) {
      throw new DecodeError(`line exceeds MAX_LINE_BYTES (${newlineIdx} > ${MAX_LINE_BYTES})`);
    }

    const lineBuf = cursor.subarray(0, newlineIdx);
    // Tolerate \r\n line endings by stripping a single trailing CR (0x0d).
    const trimmed = lineBuf.length > 0 && lineBuf[lineBuf.length - 1] === 0x0d
      ? lineBuf.subarray(0, lineBuf.length - 1)
      : lineBuf;
    const lineText = trimmed.toString('utf-8');

    if (lineText.trim().length > 0) {
      try {
        messages.push(JSON.parse(lineText));
      } catch (err) {
        throw new DecodeError(`invalid JSON line: ${(err as Error).message}`);
      }
    }
    // Empty lines (keepalives / blank stdin chunks) are skipped silently.

    cursor = cursor.subarray(newlineIdx + 1);
  }

  if (cursor.length > MAX_BUFFER_SIZE) {
    throw new DecodeError(
      `remainder exceeds MAX_BUFFER_SIZE (${cursor.length} > ${MAX_BUFFER_SIZE}) - possible slow loris`,
    );
  }

  return { messages, remainder: cursor };
}
