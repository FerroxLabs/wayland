/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * IJFW MCP wire protocol — bounded Content-Length framing.
 * Fixes SEC-004 (Content-Length anchored regex + bounds), SEC-009 (header byte
 * cap), GEM-R-03 (duplicate header reject + DecodeError on malformed input).
 */

const HEADER_TERMINATOR = Buffer.from('\r\n\r\n');
export const MAX_HEADER_BYTES = 4096;
export const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MiB
const CONTENT_LENGTH_RE = /^Content-Length:\s*(\d+)\s*$/i;

export function encode(message: object): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf-8');
  const header = `Content-Length: ${body.length}\r\n\r\n`;
  return Buffer.concat([Buffer.from(header, 'ascii'), body]);
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
    const headerEnd = cursor.indexOf(HEADER_TERMINATOR);
    if (headerEnd < 0) {
      if (cursor.length > MAX_HEADER_BYTES) {
        throw new DecodeError('header too large');
      }
      break; // partial header — wait for more bytes
    }
    if (headerEnd > MAX_HEADER_BYTES) {
      throw new DecodeError('header exceeded limit');
    }

    const headerLines = cursor.slice(0, headerEnd).toString('ascii').split('\r\n');
    let bodyLen: number | null = null;
    for (const line of headerLines) {
      const match = line.match(CONTENT_LENGTH_RE);
      if (match) {
        if (bodyLen !== null) {
          throw new DecodeError('duplicate Content-Length');
        }
        const parsed = Number(match[1]);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_BODY_BYTES) {
          throw new DecodeError(`invalid Content-Length: ${match[1]}`);
        }
        bodyLen = parsed;
      }
    }
    if (bodyLen === null) {
      throw new DecodeError('missing Content-Length');
    }

    const bodyStart = headerEnd + HEADER_TERMINATOR.length;
    if (cursor.length < bodyStart + bodyLen) break; // partial body — wait

    const body = cursor.slice(bodyStart, bodyStart + bodyLen);
    try {
      messages.push(JSON.parse(body.toString('utf-8')));
    } catch (err) {
      throw new DecodeError(`invalid body JSON: ${(err as Error).message}`);
    }
    cursor = cursor.slice(bodyStart + bodyLen);
  }

  return { messages, remainder: cursor };
}
