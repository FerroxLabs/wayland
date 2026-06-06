/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { signOutboundBody, toOutboundBody } from '@process/channels/plugins/tier1/webhook/WebhookAdapter';
import { createHmac } from 'node:crypto';

describe('WebhookAdapter.toOutboundBody - outbound format', () => {
  it('builds a valid outbound body from a text message', () => {
    const message = { type: 'text' as const, text: 'Hello from Wayland' };
    const body = toOutboundBody('chat-123', message);
    expect(body.chatId).toBe('chat-123');
    expect(body.message).toBe('Hello from Wayland');
    expect(typeof body.ts).toBe('number');
    expect(body.ts).toBeGreaterThan(0);
  });

  it('trims whitespace from the message text', () => {
    const body = toOutboundBody('chat-1', { type: 'text' as const, text: '  trimmed  ' });
    expect(body.message).toBe('trimmed');
  });

  it('throws when the message text is empty', () => {
    expect(() =>
      toOutboundBody('chat-1', { type: 'text' as const, text: '' })
    ).toThrow(/cannot be empty/i);
  });

  it('throws when message.text is undefined', () => {
    expect(() =>
      toOutboundBody('chat-1', { type: 'text' as const })
    ).toThrow(/cannot be empty/i);
  });

  it('uses the chatId argument as body.chatId (not any message property)', () => {
    const body = toOutboundBody('explicit-chat-id', { type: 'text' as const, text: 'hi' });
    expect(body.chatId).toBe('explicit-chat-id');
  });

  it('returns a frozen-shape object (no extra keys)', () => {
    const body = toOutboundBody('c', { type: 'text' as const, text: 'hi' });
    const keys = Object.keys(body).toSorted();
    expect(keys).toEqual(['chatId', 'message', 'ts']);
  });
});

describe('WebhookAdapter.signOutboundBody - HMAC signing', () => {
  const secret = 'test-secret';
  const bodyJson = JSON.stringify({ chatId: 'c', message: 'hi', ts: 1234567890 });
  const ts = 1700000000000;

  it('returns sha256=<hex> header value matching manual HMAC over <ts>.<body>', () => {
    const sig = signOutboundBody(bodyJson, secret, ts);
    expect(sig).not.toBeNull();
    const expected =
      'sha256=' + createHmac('sha256', secret).update(`${ts}.${bodyJson}`, 'utf8').digest('hex');
    expect(sig).toBe(expected);
  });

  it('signature changes when body changes', () => {
    const sig1 = signOutboundBody(bodyJson, secret, ts);
    const sig2 = signOutboundBody(bodyJson + 'x', secret, ts);
    expect(sig1).not.toBe(sig2);
  });

  it('signature changes when secret changes', () => {
    const sig1 = signOutboundBody(bodyJson, secret, ts);
    const sig2 = signOutboundBody(bodyJson, 'different-secret', ts);
    expect(sig1).not.toBe(sig2);
  });

  it('signature changes when timestamp changes (replay protection)', () => {
    const sig1 = signOutboundBody(bodyJson, secret, ts);
    const sig2 = signOutboundBody(bodyJson, secret, ts + 1);
    expect(sig1).not.toBe(sig2);
  });

  it('returns null when secret is empty string', () => {
    expect(signOutboundBody(bodyJson, '', ts)).toBeNull();
  });

  it('returns null when secret is whitespace only', () => {
    expect(signOutboundBody(bodyJson, '   ', ts)).toBeNull();
  });

  it('produces a sha256= prefixed hex string of correct length (71 chars)', () => {
    const sig = signOutboundBody(bodyJson, secret, ts);
    // 'sha256=' (7) + 64 hex chars = 71
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });
});
