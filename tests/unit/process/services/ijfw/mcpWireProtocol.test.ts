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
  MAX_DROPPED_SAMPLES,
  MAX_DROPPED_SAMPLE_CHARS,
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
      const oversized = Buffer.concat([Buffer.alloc(MAX_LINE_BYTES + 100, 0x41), Buffer.from([0x0a])]);
      expect(() => decode(oversized)).toThrow(/exceeds MAX_LINE_BYTES/);
    });

    it('#721 review: MAX_LINE_BYTES bounds cumulative retained-buffer growth across chunks', () => {
      // Simulate the client feed loop: each chunk is appended to the previous
      // remainder and re-decoded, with no newline ever arriving. The retained
      // remainder is always the unterminated partial line, so MAX_LINE_BYTES
      // is the effective cap on total buffer growth (the former MAX_BUFFER_SIZE
      // remainder check was unreachable and has been removed).
      const chunk = Buffer.alloc(4 * 1024 * 1024, 0x41); // 4 MiB, no newline
      let retained = decode(chunk).remainder; // 4 MiB retained
      retained = decode(Buffer.concat([retained, chunk])).remainder; // 8 MiB retained
      expect(retained.length).toBe(8 * 1024 * 1024);
      // 12 MiB > MAX_LINE_BYTES (10 MiB) - the third chunk must throw.
      expect(() => decode(Buffer.concat([retained, chunk]))).toThrow(DecodeError);
    });
  });

  describe('tolerant framing for garbage lines (#721)', () => {
    it('skips a malformed well-terminated line instead of throwing', () => {
      const buf = Buffer.from('{not json\n', 'utf-8');
      const { messages, remainder, droppedLines, droppedSamples } = decode(buf);
      expect(messages).toEqual([]);
      expect(remainder.length).toBe(0);
      expect(droppedLines).toBe(1);
      expect(droppedSamples).toEqual(['{not json']);
    });

    it('decodes valid messages around an interleaved garbage line', () => {
      // Customer-observed shape: the child console.logs a build.* progress
      // line to stdout between JSON-RPC responses.
      const buf = Buffer.concat([
        encode({ jsonrpc: '2.0', id: 1, result: 'a' }),
        Buffer.from('build.building wayland-desktop 42%\n', 'utf-8'),
        encode({ jsonrpc: '2.0', id: 2, result: 'b' }),
      ]);
      const { messages, remainder, droppedLines, droppedSamples } = decode(buf);
      expect(messages).toEqual([
        { jsonrpc: '2.0', id: 1, result: 'a' },
        { jsonrpc: '2.0', id: 2, result: 'b' },
      ]);
      expect(remainder.length).toBe(0);
      expect(droppedLines).toBe(1);
      expect(droppedSamples).toEqual(['build.building wayland-desktop 42%']);
    });

    it('reports zero dropped lines on a clean stream', () => {
      const { droppedLines, droppedSamples } = decode(encode({ a: 1 }));
      expect(droppedLines).toBe(0);
      expect(droppedSamples).toEqual([]);
    });

    it('truncates dropped-line samples to MAX_DROPPED_SAMPLE_CHARS', () => {
      const long = `garbage ${'x'.repeat(500)}`;
      const { droppedSamples } = decode(Buffer.from(`${long}\n`, 'utf-8'));
      expect(droppedSamples[0]).toBe(long.slice(0, MAX_DROPPED_SAMPLE_CHARS));
      expect(droppedSamples[0]!.length).toBe(MAX_DROPPED_SAMPLE_CHARS);
    });

    it('caps collected samples at MAX_DROPPED_SAMPLES but counts every drop', () => {
      const lines = Array.from({ length: MAX_DROPPED_SAMPLES + 3 }, (_, i) => `junk-${i}\n`);
      const { droppedLines, droppedSamples } = decode(Buffer.from(lines.join(''), 'utf-8'));
      expect(droppedLines).toBe(MAX_DROPPED_SAMPLES + 3);
      expect(droppedSamples.length).toBe(MAX_DROPPED_SAMPLES);
      expect(droppedSamples).toEqual(['junk-0', 'junk-1', 'junk-2']);
    });
  });
});
