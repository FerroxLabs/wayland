/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for SynologyChatPlugin.sendMessage and handleWebhookPayload.
 * fetch is mocked via vi.stubGlobal - no real HTTP.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';
import { SynologyChatPlugin } from '@process/channels/plugins/tier3/synology-chat/SynologyChatPlugin';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'synology-chat_default',
    type: 'synology-chat',
    name: 'Synology Chat',
    enabled: true,
    status: 'created',
    credentials: {
      incomingUrl: 'https://nas.example.com/webhook',
      incomingToken: 'secret-token',
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

async function startPlugin(): Promise<SynologyChatPlugin> {
  const plugin = new SynologyChatPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  return plugin;
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(new Response('{"success":true}', { status: 200 }));
});

describe('SynologyChatPlugin.sendMessage - happy paths', () => {
  it('POSTs form-encoded payload to the incomingUrl', async () => {
    const plugin = await startPlugin();
    await plugin.sendMessage('42', { type: 'text', text: 'hello' });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://nas.example.com/webhook');
    expect((init.headers as Record<string, string>)['content-type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(init.method).toBe('POST');

    // Body should be form-encoded with payload containing the text.
    const bodyStr = init.body as string;
    const params = new URLSearchParams(bodyStr);
    const inner = JSON.parse(params.get('payload')!) as { text: string; user_ids: number[] };
    expect(inner.text).toBe('hello');
    expect(inner.user_ids).toEqual([42]);

    await plugin.stop();
  });

  it('returns a synology-chat prefixed synthetic message id', async () => {
    const plugin = await startPlugin();
    const id = await plugin.sendMessage('7', { type: 'text', text: 'hi' });
    expect(id).toMatch(/^synology-chat:7:\d+$/);
    await plugin.stop();
  });

  it('throws when plugin is not initialized', async () => {
    const plugin = new SynologyChatPlugin();
    await expect(
      plugin.sendMessage('1', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/not initialized/i);
  });

  it('throws when the server returns a non-200 response', async () => {
    mockFetch.mockResolvedValue(new Response('Forbidden', { status: 403 }));
    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('1', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/403/);
    await plugin.stop();
  });

  it('throws when fetch rejects (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('1', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/ECONNREFUSED/);
    await plugin.stop();
  }, 10_000);
});

// ── Retry + throttle (MED) ────────────────────────────────────────────────────
//
// The wrapper enforces a 500ms minimum interval between sends and runs up to 3
// attempts with exponential backoff (300ms base) on failure - both lifted from
// OpenClaw to absorb Synology Chat's documented 429-prone behaviour.

describe('SynologyChatPlugin.sendMessage - retry + throttle', () => {
  it('retries up to 3 times when fetch rejects, then surfaces the last error', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('boom-1'))
      .mockRejectedValueOnce(new Error('boom-2'))
      .mockRejectedValueOnce(new Error('boom-3'));

    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('1', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/boom-3/);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    await plugin.stop();
  }, 15_000);

  it('succeeds on the second attempt after a transient 500', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('flake', { status: 500 }))
      .mockResolvedValueOnce(new Response('{"success":true}', { status: 200 }));

    const plugin = await startPlugin();
    const id = await plugin.sendMessage('1', { type: 'text', text: 'hello' });
    expect(id).toMatch(/^synology-chat:1:\d+$/);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await plugin.stop();
  }, 15_000);

  it('enforces a minimum 500ms interval between consecutive sends', async () => {
    const plugin = await startPlugin();
    const t0 = Date.now();
    await plugin.sendMessage('1', { type: 'text', text: 'a' });
    await plugin.sendMessage('2', { type: 'text', text: 'b' });
    const elapsed = Date.now() - t0;
    // Allow 50ms scheduler slack - what we care about is "≥ ~500ms".
    expect(elapsed).toBeGreaterThanOrEqual(450);
    await plugin.stop();
  }, 15_000);
});

// ── user_id remapping (MED) ───────────────────────────────────────────────────
//
// On Synology servers whose incoming-webhook URL exposes `method=incoming`, we
// swap to `method=user_list` to fetch the (webhook id → Chat-API id) map.
// Lookup failures fall back to the webhook id (the canonical bot-DM case).

function makeConfigWithMethodUrl(): IChannelPluginConfig {
  return {
    id: 'synology-chat_default',
    type: 'synology-chat',
    name: 'Synology Chat',
    enabled: true,
    status: 'created',
    credentials: {
      incomingUrl:
        'https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&token=abc',
      incomingToken: 'secret-token',
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('SynologyChatPlugin.sendMessage - webhook→Chat user_id mapping', () => {
  it('remaps nickname-shaped webhook id to numeric Chat user_id via user_list', async () => {
    // First call = user_list lookup; second call = the actual send POST.
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { users: [{ user_id: 99, nickname: 'alice' }] },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response('{"success":true}', { status: 200 }));

    const plugin = new SynologyChatPlugin();
    await plugin.initialize(makeConfigWithMethodUrl());
    await plugin.start();

    await plugin.sendMessage('alice', { type: 'text', text: 'hello' });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [listUrl] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(listUrl).toContain('method=user_list');

    const [, sendInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    const inner = JSON.parse(
      new URLSearchParams(sendInit.body as string).get('payload')!,
    ) as { user_ids?: number[] };
    expect(inner.user_ids).toEqual([99]);

    await plugin.stop();
  }, 15_000);

  it('falls back to the webhook id when user_list fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(new Response('{"success":true}', { status: 200 }));

    const plugin = new SynologyChatPlugin();
    await plugin.initialize(makeConfigWithMethodUrl());
    await plugin.start();

    // Numeric webhook id - should pass through to user_ids verbatim.
    await plugin.sendMessage('77', { type: 'text', text: 'hello' });

    const [, sendInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    const inner = JSON.parse(
      new URLSearchParams(sendInit.body as string).get('payload')!,
    ) as { user_ids?: number[] };
    expect(inner.user_ids).toEqual([77]);

    await plugin.stop();
  }, 15_000);

  it('skips the user_list lookup entirely when incomingUrl has no method=incoming segment', async () => {
    // Default config in this file uses a plain `/webhook` URL - no `method=`
    // to swap, so we should never hit user_list. Only the send POST happens.
    const plugin = await startPlugin();
    await plugin.sendMessage('5', { type: 'text', text: 'hello' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://nas.example.com/webhook');
    await plugin.stop();
  }, 10_000);
});

describe('SynologyChatPlugin.handleWebhookPayload - inbound message emission', () => {
  it('emits a unified message for a valid payload', async () => {
    const plugin = await startPlugin();

    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    await plugin.handleWebhookPayload(
      { user_id: '5', username: 'alice', text: 'hello bot', channel_id: '10' },
      {},
      'synology-chat_default',
    );

    expect(received.length).toBe(1);
    const msg = received[0] as { platform: string; content: { text: string }; chatId: string };
    expect(msg.platform).toBe('synology-chat');
    expect(msg.content.text).toBe('hello bot');
    expect(msg.chatId).toBe('10');

    await plugin.stop();
  });

  it('tracks senders in the active user set', async () => {
    const plugin = await startPlugin();
    plugin.onMessage(async () => undefined);

    expect(plugin.getActiveUserCount()).toBe(0);

    await plugin.handleWebhookPayload(
      { user_id: '5', text: 'hi', channel_id: '1' },
      {},
      'synology-chat_default',
    );

    expect(plugin.getActiveUserCount()).toBe(1);
    await plugin.stop();
  });

  it('drops payloads missing user_id without throwing', async () => {
    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    await expect(
      plugin.handleWebhookPayload({ text: 'hi' }, {}, 'synology-chat_default'),
    ).resolves.not.toThrow();

    expect(received.length).toBe(0);
    await plugin.stop();
  });

  it('drops payloads missing text without throwing', async () => {
    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => { received.push(msg); });

    await expect(
      plugin.handleWebhookPayload({ user_id: '5' }, {}, 'synology-chat_default'),
    ).resolves.not.toThrow();

    expect(received.length).toBe(0);
    await plugin.stop();
  });
});
