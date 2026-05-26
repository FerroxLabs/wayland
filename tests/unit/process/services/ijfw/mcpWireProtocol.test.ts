/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { DecodeError, decode, encode } from '@process/services/ijfw/mcpWireProtocol';

describe('ijfw/mcpWireProtocol', () => {
  describe('encode', () => {
    it('produces a Content-Length header and CRLFCRLF separator', () => {
      const buf = encode({ jsonrpc: '2.0', id: 1, method: 'ping' });
      const text = buf.toString('utf-8');
      expect(text).toMatch(/^Content-Length: \d+\r\n\r\n/);
      const body = text.split('\r\n\r\n')[1];
      expect(JSON.parse(body)).toEqual({ jsonrpc: '2.0', id: 1, method: 'ping' });
    });

    it('reports the byte length of the body, not utf-16 length', () => {
      const buf = encode({ q: '😀😀😀' });
      const headerText = buf.toString('utf-8').split('\r\n\r\n')[0];
      const m = headerText.match(/Content-Length: (\d+)/);
      const declared = m ? Number(m[1]) : -1;
      // Body bytes after CRLFCRLF
      const bodyBytes = buf.length - buf.indexOf(Buffer.from('\r\n\r\n')) - 4;
      expect(declared).toBe(bodyBytes);
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
  });

  describe('partial buffer streaming', () => {
    it('returns no messages and the partial buffer when header is incomplete', () => {
      const partial = Buffer.from('Content-Length: 10\r\n', 'ascii');
      const { messages, remainder } = decode(partial);
      expect(messages).toEqual([]);
      expect(remainder.length).toBe(partial.length);
    });

    it('returns no messages and partial buffer when body is incomplete', () => {
      const full = encode({ a: 1 });
      const half = full.subarray(0, full.length - 1);
      const { messages, remainder } = decode(half);
      expect(messages).toEqual([]);
      expect(remainder.length).toBe(half.length);
    });

    it('decodes prefix + retains body suffix for next call', () => {
      const a = encode({ a: 1 });
      const b = encode({ b: 2 });
      const concat = Buffer.concat([a, b]);
      // Cut in the middle of message b's body
      const cut = concat.subarray(0, a.length + Math.floor(b.length / 2));
      const { messages, remainder } = decode(cut);
      expect(messages).toEqual([{ a: 1 }]);
      expect(remainder.length).toBe(cut.length - a.length);
    });
  });

  describe('header bounds (SEC-009)', () => {
    it('throws DecodeError when header exceeds MAX_HEADER_BYTES without terminator', () => {
      const oversized = Buffer.alloc(5000, 0x41); // 'A' * 5000, no CRLFCRLF
      expect(() => decode(oversized)).toThrow(DecodeError);
    });

    it('throws when header is present but exceeds 4096 bytes', () => {
      const filler = 'X'.repeat(4100);
      const header = `Content-Length: 1\r\nX-Junk: ${filler}\r\n\r\n` + 'a';
      const buf = Buffer.from(header, 'ascii');
      expect(() => decode(buf)).toThrow(DecodeError);
    });
  });

  describe('Content-Length validation (SEC-004)', () => {
    it('throws on missing Content-Length', () => {
      const buf = Buffer.from('X-Other: 1\r\n\r\n{}', 'ascii');
      expect(() => decode(buf)).toThrow(/missing Content-Length/);
    });

    it('throws on duplicate Content-Length', () => {
      const body = '{}';
      const buf = Buffer.from(
        `Content-Length: ${body.length}\r\nContent-Length: ${body.length}\r\n\r\n${body}`,
        'ascii',
      );
      expect(() => decode(buf)).toThrow(/duplicate Content-Length/);
    });

    it('rejects negative Content-Length (anchored regex declines to match)', () => {
      // The Content-Length regex only matches `\d+` so a negative value never
      // matches at all, which surfaces as 'missing Content-Length'. Either way
      // the message is rejected — the goal is that it does NOT reach JSON.parse.
      const buf = Buffer.from('Content-Length: -1\r\n\r\n{}', 'ascii');
      expect(() => decode(buf)).toThrow(/missing Content-Length/);
    });

    it('throws on Content-Length larger than MAX_BODY_BYTES', () => {
      const tooBig = 11 * 1024 * 1024;
      const buf = Buffer.from(`Content-Length: ${tooBig}\r\n\r\n`, 'ascii');
      expect(() => decode(buf)).toThrow(/invalid Content-Length/);
    });

    it('throws on Content-Length with trailing garbage (anchored regex)', () => {
      const buf = Buffer.from('Content-Length: 2X\r\n\r\n{}', 'ascii');
      expect(() => decode(buf)).toThrow(/missing Content-Length/);
    });

    it('accepts Content-Length: 0 with empty body', () => {
      const buf = Buffer.from('Content-Length: 0\r\n\r\n', 'ascii');
      // JSON.parse('') will throw — emulate empty-body by sending the literal 0
      // The plan accepts 0 length but JSON.parse('') will then fail.
      // The plan's intent: parsed=0 valid for length-check, then JSON.parse('') throws DecodeError.
      expect(() => decode(buf)).toThrow(/invalid body JSON/);
    });
  });

  describe('body validation', () => {
    it('throws DecodeError on malformed JSON body', () => {
      const body = '{not json';
      const buf = Buffer.from(`Content-Length: ${body.length}\r\n\r\n${body}`, 'ascii');
      expect(() => decode(buf)).toThrow(/invalid body JSON/);
    });
  });
});
