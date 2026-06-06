/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { LinePlugin } from '@process/channels/plugins/tier2/line/LinePlugin';
import { lineVerifier, verifyLineSignature } from '@process/channels/webhook/verifiers/line';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

// vi.mock is hoisted above ALL imports + describe blocks. The mock fns it
// references must be declared via vi.hoisted (also hoisted, runs first).
// Vitest 4 enforces top-level placement - nested in describe triggers a
// deprecation warning that will become an error.
const { mockReplyMessage, mockPushMessage } = vi.hoisted(() => ({
  mockReplyMessage: vi.fn(),
  mockPushMessage: vi.fn(),
}));

vi.mock('@line/bot-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@line/bot-sdk')>();
  return {
    ...actual,
    messagingApi: {
      ...actual.messagingApi,
      MessagingApiClient: class MockClient {
        replyMessage = mockReplyMessage;
        pushMessage = mockPushMessage;
      },
    },
  };
});

// ── helpers ───────────────────────────────────────────────────────────────────

const CHANNEL_SECRET = 'test-channel-secret';
const CHANNEL_TOKEN = 'test-channel-access-token';

function makeSignature(body: string | Buffer): string {
  const buf = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  return createHmac('sha256', CHANNEL_SECRET).update(buf).digest('base64');
}

async function initPlugin(): Promise<LinePlugin> {
  const plugin = new LinePlugin();
  await plugin.initialize({
    id: 'line_default',
    type: 'line',
    name: 'LINE',
    enabled: true,
    credentials: {
      channelAccessToken: CHANNEL_TOKEN,
      channelSecret: CHANNEL_SECRET,
    },
    status: 'created',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await plugin.start();
  return plugin;
}

function textMessagePayload(overrides: Record<string, unknown> = {}): object {
  return {
    destination: 'Ubot123',
    events: [
      {
        type: 'message',
        webhookEventId: 'wh-001',
        replyToken: 'reply-token-001',
        source: { type: 'user', userId: 'U111' },
        timestamp: Date.now(),
        message: { type: 'text', id: 'msg001', text: 'Hello bot' },
        ...overrides,
      },
    ],
  };
}

// ── verifier tests ────────────────────────────────────────────────────────────

describe('verifyLineSignature', () => {
  const body = JSON.stringify({ events: [] });
  const validSig = makeSignature(body);

  it('accepts a valid HMAC-SHA256 Base64 signature', () => {
    expect(verifyLineSignature(body, validSig, CHANNEL_SECRET)).toBe(true);
  });

  it('accepts signature on a Buffer body', () => {
    expect(verifyLineSignature(Buffer.from(body, 'utf8'), validSig, CHANNEL_SECRET)).toBe(true);
  });

  it('rejects a wrong secret', () => {
    expect(verifyLineSignature(body, validSig, 'wrong-secret')).toBe(false);
  });

  it('rejects a tampered body', () => {
    expect(verifyLineSignature(body + 'x', validSig, CHANNEL_SECRET)).toBe(false);
  });

  it('rejects empty signature without throwing', () => {
    expect(verifyLineSignature(body, '', CHANNEL_SECRET)).toBe(false);
  });
});

describe('lineVerifier', () => {
  const body = JSON.stringify({
    destination: 'Ubot123',
    events: [{ type: 'follow', webhookEventId: 'ev-abc', timestamp: 1716000000000 }],
  });
  const rawBody = Buffer.from(body, 'utf8');
  const validSig = makeSignature(rawBody);

  it('returns ok=true for a valid signature and parses payload', () => {
    const result = lineVerifier(
      { headers: { 'x-line-signature': validSig }, rawBody, query: {}, url: '/webhooks/line/tok' },
      CHANNEL_SECRET,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.payload as { destination: string }).destination).toBe('Ubot123');
      expect(result.eventId).toBe('ev-abc');
    }
  });

  it('returns ok=false when x-line-signature header is absent', () => {
    const result = lineVerifier(
      { headers: {}, rawBody, query: {}, url: '/webhooks/line/tok' },
      CHANNEL_SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('missing-signature');
  });

  it('returns ok=false for a tampered body', () => {
    const tampered = Buffer.from(body + 'evil', 'utf8');
    const result = lineVerifier(
      { headers: { 'x-line-signature': validSig }, rawBody: tampered, query: {}, url: '/webhooks/line/tok' },
      CHANNEL_SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-signature');
  });

  it('returns ok=false for invalid JSON body even with correct signature', () => {
    const badBody = Buffer.from('not-json', 'utf8');
    const badSig = makeSignature(badBody);
    const result = lineVerifier(
      { headers: { 'x-line-signature': badSig }, rawBody: badBody, query: {}, url: '/webhooks/line/tok' },
      CHANNEL_SECRET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-json');
  });
});

// ── handleWebhookPayload tests ────────────────────────────────────────────────

describe('LinePlugin.handleWebhookPayload', () => {
  beforeEach(() => {
    mockReplyMessage.mockReset().mockResolvedValue({});
    mockPushMessage.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits a unified message for a text message event', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(textMessagePayload(), {}, 'line_default');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].platform).toBe('line');
    expect(emitted[0].chatId).toBe('U111');
    expect(emitted[0].content.text).toBe('Hello bot');
  });

  it('drops follow events without emitting a message', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      {
        destination: 'Ubot123',
        events: [{ type: 'follow', source: { type: 'user', userId: 'U222' }, timestamp: Date.now() }],
      },
      {},
      'line_default',
    );

    expect(emitted).toHaveLength(0);
  });

  it('emits a postback event as a text message', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      {
        destination: 'Ubot123',
        events: [
          {
            type: 'postback',
            replyToken: 'rt-pb',
            source: { type: 'user', userId: 'U333' },
            timestamp: Date.now(),
            postback: { data: 'menu=main' },
          },
        ],
      },
      {},
      'line_default',
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].content.text).toBe('menu=main');
  });

  it('drops message events with no usable text (unsupported type)', async () => {
    const plugin = await initPlugin();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      {
        destination: 'Ubot123',
        events: [
          {
            type: 'message',
            replyToken: 'rt-unsup',
            source: { type: 'user', userId: 'U444' },
            timestamp: Date.now(),
            message: { type: 'contact', id: 'ct01' },
          },
        ],
      },
      {},
      'line_default',
    );

    expect(emitted).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('handles an empty events array without throwing', async () => {
    const plugin = await initPlugin();
    await expect(
      plugin.handleWebhookPayload({ destination: 'Ubot123', events: [] }, {}, 'line_default'),
    ).resolves.toBeUndefined();
  });
});
