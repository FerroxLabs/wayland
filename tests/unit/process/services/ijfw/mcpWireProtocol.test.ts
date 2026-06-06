/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the newline-delimited MCP wire protocol (matches IJFW's
 * readline-based server in `~/.ijfw/mcp-server/src/server.js`).
 */

import { describe, expect, it } from 'vitest';
import {
  DecodeError,
  MAX_LINE_BYTES,
  decode,
  encode,
} from '@process/services/ijfw/mcpWireProtocol';

describe('ijfw/mcpWireProtocol (newline-delimited)', () => {
  describe('encode', () => {
    it('produces a JSON line terminated by \\n', () => {
      const buf = encode({ jsonrpc: '2.0', id: 1, method: 'ping' });
      const text = buf.toString('utf-8');
      expect(text.endsWith('\n')).toBe(true);
      expect(JSON.parse(text.slice(0, -1))).toEqual({ jsonrpc: '2.0', id: 1, method: 'ping' });
    });

    it('serializes multibyte UTF-8 correctly in the byte stream', () => {
      const buf = encode({ q: '😀😀😀' });
      const text = buf.toString('utf-8');
      const json = JSON.parse(text.trim());
      expect(json.q).toBe('😀😀😀');
    });

    it('throws when encoded message would exceed MAX_LINE_BYTES', () => {
      const huge = { x: 'A'.repeat(MAX_LINE_BYTES) };
      expect(() => encode(huge)).toThrow(/exceeds MAX_LINE_BYTES/);
    });
  });

  describe('decode roundtrip', () => {
    it('decodes a single message', () => {
      const buf = encode({ hello: 'world' });
      const { messages, remainder } = decode(buf);
      expect(messages).toEqual([{ hello: 'world' }]);
      expect(remainder.length).toBe(0);
    });

    it('decodes two concatenated messages', () => {
      const buf = Buffer.concat([encode({ a: 1 }), encode({ b: 2 })]);
      const { messages, remainder } = decode(buf);
      expect(messages).toEqual([{ a: 1 }, { b: 2 }]);
      expect(remainder.length).toBe(0);
    });

    it('tolerates \\r\\n line endings (strips trailing CR before JSON.parse)', () => {
      const buf = Buffer.from('{"crlf":true}\r\n', 'utf-8');
      const { messages, remainder } = decode(buf);
      expect(messages).toEqual([{ crlf: true }]);
      expect(remainder.length).toBe(0);
    });

    it('skips empty lines between messages (server keepalive tolerance)', () => {
      const buf = Buffer.from('{"a":1}\n\n\n{"b":2}\n', 'utf-8');
      const { messages, remainder } = decode(buf);
      expect(messages).toEqual([{ a: 1 }, { b: 2 }]);
      expect(remainder.length).toBe(0);
    });
  });

  describe('partial buffer streaming', () => {
    it('returns no messages and retains the partial line when no newline yet', () => {
      const partial = Buffer.from('{"hello":"wor', 'utf-8');
      const { messages, remainder } = decode(partial);
      expect(messages).toEqual([]);
      expect(remainder.equals(partial)).toBe(true);
    });

    it('decodes the complete prefix and retains the tail for next call', () => {
      const a = encode({ a: 1 });
      const partial = Buffer.from('{"b":', 'utf-8');
      const concat = Buffer.concat([a, partial]);
      const { messages, remainder } = decode(concat);
      expect(messages).toEqual([{ a: 1 }]);
      expect(remainder.equals(partial)).toBe(true);
    });

    it('appending the tail and re-running decode yields the second message', () => {
      const a = encode({ a: 1 });
      const partial = Buffer.from('{"b":', 'utf-8');
      const tail = Buffer.from('2}\n', 'utf-8');
      const first = decode(Buffer.concat([a, partial]));
      const second = decode(Buffer.concat([first.remainder, tail]));
      expect(second.messages).toEqual([{ b: 2 }]);
      expect(second.remainder.length).toBe(0);
    });
  });

  describe('line bounds (SEC-004 / GEM-R-03)', () => {
    it('throws DecodeError when an unterminated line exceeds MAX_LINE_BYTES', () => {
      const oversized = Buffer.alloc(MAX_LINE_BYTES + 100, 0x41); // 'A' * (MAX+100), no \n
      expect(() => decode(oversized)).toThrow(DecodeError);
    });

    it('throws DecodeError when a terminated line exceeds MAX_LINE_BYTES', () => {
      const oversized = Buffer.concat([
        Buffer.alloc(MAX_LINE_BYTES + 100, 0x41),
        Buffer.from([0x0a]),
      ]);
      expect(() => decode(oversized)).toThrow(/exceeds MAX_LINE_BYTES/);
    });
  });

  describe('body validation', () => {
    it('throws DecodeError on malformed JSON line', () => {
      const buf = Buffer.from('{not json\n', 'utf-8');
      expect(() => decode(buf)).toThrow(/invalid JSON line/);
    });

    it('throws DecodeError naming the underlying parse error', () => {
      try {
        decode(Buffer.from('{"a":undefined}\n', 'utf-8'));
        throw new Error('expected DecodeError');
      } catch (err) {
        expect(err).toBeInstanceOf(DecodeError);
        expect((err as Error).message).toMatch(/invalid JSON line/);
      }
    });
  });
});
