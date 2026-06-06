/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for SynologyChatAdapter outgoing helper: toSynologyChatSendBody.
 */

import { describe, expect, it } from 'vitest';

import { toSynologyChatSendBody } from '@process/channels/plugins/tier3/synology-chat/SynologyChatAdapter';

function decodeBody(body: string): Record<string, unknown> {
  const params = new URLSearchParams(body);
  const payloadStr = params.get('payload');
  if (!payloadStr) throw new Error('No payload field in body');
  return JSON.parse(payloadStr) as Record<string, unknown>;
}

describe('toSynologyChatSendBody - text messages', () => {
  it('produces a form-encoded body with payload JSON', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: 'hello world' });
    expect(body).toMatch(/^payload=/);
    const parsed = decodeBody(body);
    expect(parsed.text).toBe('hello world');
  });

  it('trims whitespace from the text', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: '  hi  ' });
    const parsed = decodeBody(body);
    expect(parsed.text).toBe('hi');
  });

  it('throws when text is empty and no fileUrl is provided', () => {
    expect(() => toSynologyChatSendBody({ type: 'text', text: '' })).toThrow(
      /requires text or fileUrl/i,
    );
  });

  it('throws when text is absent and no fileUrl is provided', () => {
    expect(() => toSynologyChatSendBody({ type: 'text' })).toThrow(
      /requires text or fileUrl/i,
    );
  });
});

describe('toSynologyChatSendBody - text + fileUrl edge cases (LOW)', () => {
  it('omits the text field entirely when text is blank and fileUrl is present', () => {
    const body = toSynologyChatSendBody({
      type: 'file',
      text: '',
      fileUrl: 'https://example.com/x.pdf',
    });
    const parsed = decodeBody(body);
    expect(parsed.file_url).toBe('https://example.com/x.pdf');
    // Critical: blank text is omitted, not emitted as `text:""`. Synology's
    // incoming webhook rejects empty `text` even when `file_url` is set.
    expect('text' in parsed).toBe(false);
  });

  it('omits the text field when text is only whitespace + fileUrl is present', () => {
    const body = toSynologyChatSendBody({
      type: 'file',
      text: '   ',
      fileUrl: 'https://example.com/x.pdf',
    });
    const parsed = decodeBody(body);
    expect('text' in parsed).toBe(false);
  });

  it('keeps text when both text and fileUrl are present', () => {
    const body = toSynologyChatSendBody({
      type: 'file',
      text: 'caption',
      fileUrl: 'https://example.com/x.pdf',
    });
    const parsed = decodeBody(body);
    expect(parsed.text).toBe('caption');
    expect(parsed.file_url).toBe('https://example.com/x.pdf');
  });
});

describe('toSynologyChatSendBody - user_ids targeting', () => {
  it('includes user_ids array when numeric chatUserId is provided', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: 'hi' }, 42);
    const parsed = decodeBody(body);
    expect(parsed.user_ids).toEqual([42]);
  });

  it('includes user_ids array when string chatUserId is provided', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: 'hi' }, '7');
    const parsed = decodeBody(body);
    expect(parsed.user_ids).toEqual([7]);
  });

  it('omits user_ids when chatUserId is undefined', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: 'hi' }, undefined);
    const parsed = decodeBody(body);
    expect(parsed.user_ids).toBeUndefined();
  });

  it('omits user_ids when chatUserId is a non-numeric string', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: 'hi' }, 'not-a-number');
    const parsed = decodeBody(body);
    expect(parsed.user_ids).toBeUndefined();
  });
});

describe('toSynologyChatSendBody - file_url', () => {
  it('includes file_url when the message has a fileUrl', () => {
    const body = toSynologyChatSendBody({
      type: 'file',
      text: '',
      fileUrl: 'https://example.com/file.pdf',
    });
    const parsed = decodeBody(body);
    expect(parsed.file_url).toBe('https://example.com/file.pdf');
  });

  it('omits file_url when absent', () => {
    const body = toSynologyChatSendBody({ type: 'text', text: 'hello' });
    const parsed = decodeBody(body);
    expect(parsed.file_url).toBeUndefined();
  });
});

describe('toSynologyChatSendBody - encoding', () => {
  it('URL-encodes the payload so special chars survive a round-trip', () => {
    const text = 'Hello & "World" <test>';
    const body = toSynologyChatSendBody({ type: 'text', text });
    const parsed = decodeBody(body);
    expect(parsed.text).toBe(text);
  });

  it('long messages are included verbatim (no chunking)', () => {
    const text = 'x'.repeat(4000);
    const body = toSynologyChatSendBody({ type: 'text', text });
    const parsed = decodeBody(body);
    expect(parsed.text).toBe(text);
  });
});
