/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { toUnifiedIncoming } from '@process/channels/plugins/tier1/webhook/WebhookAdapter';

const PLUGIN_ID = 'webhook_default';

describe('WebhookAdapter.toUnifiedIncoming - inbound parse', () => {
  it('parses a wayland-v1 payload with all fields', () => {
    const payload = {
      id: 'msg-001',
      chatId: 'chat-abc',
      userId: 'user-xyz',
      displayName: 'Alice',
      text: 'Hello Wayland',
      ts: 1_700_000_000_000,
    };
    const result = toUnifiedIncoming(payload, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('msg-001');
    expect(result!.chatId).toBe('chat-abc');
    expect(result!.user.id).toBe('user-xyz');
    expect(result!.user.displayName).toBe('Alice');
    expect(result!.content.text).toBe('Hello Wayland');
    expect(result!.timestamp).toBe(1_700_000_000_000);
    expect(result!.platform).toBe(PLUGIN_ID);
  });

  it('extracts text from the "message" field when "text" is absent', () => {
    const result = toUnifiedIncoming({ message: 'body via message field' }, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('body via message field');
  });

  it('extracts text from the "content" field when "text" and "message" are absent', () => {
    const result = toUnifiedIncoming({ content: 'body via content field' }, PLUGIN_ID);
    expect(result).not.toBeNull();
    expect(result!.content.text).toBe('body via content field');
  });

  it('returns null when no text field is present', () => {
    const result = toUnifiedIncoming({ id: 'x', chatId: 'c' }, PLUGIN_ID);
    expect(result).toBeNull();
  });

  it('returns null for an empty payload', () => {
    expect(toUnifiedIncoming({}, PLUGIN_ID)).toBeNull();
  });

  it('falls back chatId to "default" when absent', () => {
    const result = toUnifiedIncoming({ text: 'hi' }, PLUGIN_ID);
    expect(result!.chatId).toBe('default');
  });

  it('falls back userId to chatId when absent', () => {
    const result = toUnifiedIncoming({ text: 'hi', chatId: 'room-1' }, PLUGIN_ID);
    expect(result!.user.id).toBe('room-1');
  });

  it('generates a synthetic id when id is absent', () => {
    const result = toUnifiedIncoming({ text: 'hi' }, PLUGIN_ID);
    expect(result!.id).toMatch(/^wh-/);
  });

  it('appends attachment URLs to the message text', () => {
    const payload = {
      text: 'See attached',
      attachments: [
        { url: 'https://cdn.example.com/file.pdf', name: 'file.pdf' },
        { url: 'https://cdn.example.com/img.png' },
      ],
    };
    const result = toUnifiedIncoming(payload, PLUGIN_ID);
    expect(result!.content.text).toContain('See attached');
    expect(result!.content.text).toContain('[file.pdf](https://cdn.example.com/file.pdf)');
    expect(result!.content.text).toContain('https://cdn.example.com/img.png');
  });

  it('normalises epoch-seconds timestamps to milliseconds', () => {
    const result = toUnifiedIncoming({ text: 'hi', ts: 1_700_000_000 }, PLUGIN_ID);
    expect(result!.timestamp).toBe(1_700_000_000_000);
  });

  it('preserves millisecond timestamps as-is', () => {
    const result = toUnifiedIncoming({ text: 'hi', ts: 1_700_000_000_000 }, PLUGIN_ID);
    expect(result!.timestamp).toBe(1_700_000_000_000);
  });

  it('parses ISO-8601 string timestamps', () => {
    const iso = '2024-01-15T10:30:00.000Z';
    const result = toUnifiedIncoming({ text: 'hi', timestamp: iso }, PLUGIN_ID);
    expect(result!.timestamp).toBe(Date.parse(iso));
  });

  it('preserves the raw payload under .raw', () => {
    const payload = { text: 'hello', extra: 42 };
    const result = toUnifiedIncoming(payload, PLUGIN_ID);
    expect(result!.raw).toEqual(payload);
  });
});
