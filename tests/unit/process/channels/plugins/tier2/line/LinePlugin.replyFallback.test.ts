/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regression-locks LinePlugin.sendMessage outbound fallback behaviour:
 *   1. replyMessage throws → cache entry deleted → pushMessage invoked
 *   2. group:/room: prefix is stripped from the chatId before pushMessage
 *
 * These invariants live in LinePlugin.ts:144-170. Without this test, a future
 * "cleanup" of chatId encoding or token-cache handling could regress silently.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinePlugin } from '@process/channels/plugins/tier2/line/LinePlugin';

// vi.hoisted runs before any import; vi.mock hoists above imports.
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

const CHANNEL_SECRET = 'test-channel-secret';
const CHANNEL_TOKEN = 'test-channel-access-token';

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

/** Prime the plugin's reply-token cache for `chatId` by feeding it a webhook. */
async function primeReplyToken(
  plugin: LinePlugin,
  source: { type: 'user'; userId: string } | { type: 'group'; groupId: string; userId?: string } | { type: 'room'; roomId: string; userId?: string },
  replyToken: string,
): Promise<void> {
  await plugin.handleWebhookPayload(
    {
      destination: 'Ubot123',
      events: [
        {
          type: 'message',
          webhookEventId: 'wh-prime',
          replyToken,
          source,
          // Use Date.now() so the 60s TTL is fresh.
          timestamp: Date.now(),
          message: { type: 'text', id: 'msg-prime', text: 'incoming' },
        },
      ],
    },
    {},
    'line_default',
  );
}

describe('LinePlugin.sendMessage reply-then-push fallback', () => {
  beforeEach(() => {
    mockReplyMessage.mockReset();
    mockPushMessage.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to pushMessage when replyMessage throws, after deleting cached token', async () => {
    const plugin = await initPlugin();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await primeReplyToken(plugin, { type: 'user', userId: 'U111' }, 'reply-token-stale');

    // replyMessage throws once (LINE server returns 400 Invalid reply token).
    mockReplyMessage.mockRejectedValueOnce(new Error('Invalid reply token'));

    const id = await plugin.sendMessage('U111', { text: 'fallback body' });

    expect(mockReplyMessage).toHaveBeenCalledTimes(1);
    expect(mockReplyMessage).toHaveBeenCalledWith({
      replyToken: 'reply-token-stale',
      messages: [{ type: 'text', text: 'fallback body' }],
    });

    // After reply failure, pushMessage must be called with the raw userId.
    expect(mockPushMessage).toHaveBeenCalledTimes(1);
    expect(mockPushMessage).toHaveBeenCalledWith({
      to: 'U111',
      messages: [{ type: 'text', text: 'fallback body' }],
    });

    // Returned id reflects the push path.
    expect(id.startsWith('push:U111:')).toBe(true);

    // A second send for the same chatId must skip replyMessage entirely
    // (the cached token was deleted when reply failed).
    await plugin.sendMessage('U111', { text: 'second body' });
    expect(mockReplyMessage).toHaveBeenCalledTimes(1); // unchanged
    expect(mockPushMessage).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it('strips the group: prefix from chatId on push fallback', async () => {
    const plugin = await initPlugin();

    // No cached reply token for this chatId → goes straight to push.
    await plugin.sendMessage('group:Gabc123', { text: 'group body' });

    expect(mockReplyMessage).not.toHaveBeenCalled();
    expect(mockPushMessage).toHaveBeenCalledTimes(1);
    expect(mockPushMessage).toHaveBeenCalledWith({
      to: 'Gabc123',
      messages: [{ type: 'text', text: 'group body' }],
    });
  });

  it('strips the room: prefix from chatId on push fallback', async () => {
    const plugin = await initPlugin();

    await plugin.sendMessage('room:Rxyz789', { text: 'room body' });

    expect(mockReplyMessage).not.toHaveBeenCalled();
    expect(mockPushMessage).toHaveBeenCalledTimes(1);
    expect(mockPushMessage).toHaveBeenCalledWith({
      to: 'Rxyz789',
      messages: [{ type: 'text', text: 'room body' }],
    });
  });

  it('passes user chatId through unchanged on direct-push (no prefix)', async () => {
    const plugin = await initPlugin();

    await plugin.sendMessage('U999', { text: 'dm body' });

    expect(mockPushMessage).toHaveBeenCalledWith({
      to: 'U999',
      messages: [{ type: 'text', text: 'dm body' }],
    });
  });

  it('wraps pushMessage errors with a quota/permission hint', async () => {
    const plugin = await initPlugin();
    mockPushMessage.mockRejectedValueOnce(new Error('Forbidden'));

    await expect(plugin.sendMessage('U222', { text: 'quota body' })).rejects.toThrow(
      /LINE pushMessage failed \(likely quota or permission\): Forbidden/,
    );
  });
});
