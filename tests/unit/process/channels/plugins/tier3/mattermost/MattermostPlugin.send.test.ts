/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for MattermostPlugin.sendMessage / editMessage and inbound message
 * emission. fetch and ws are mocked - no real network calls.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';
import { MATTERMOST_MESSAGE_LIMIT } from '@process/channels/plugins/tier3/mattermost/MattermostAdapter';

// ── Hoist WS mock ─────────────────────────────────────────────────────────────
const { MockWebSocket, mockWsInstance } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('node:events') as typeof import('node:events');

  class FakeWs extends EventEmitter {
    static OPEN = 1;
    readyState = FakeWs.OPEN;
    send = vi.fn();
    close = vi.fn(() => {
      this.emit('close');
    });
    removeAllListeners = vi.fn(() => {
      EventEmitter.prototype.removeAllListeners.call(this);
      return this;
    });
  }

  const instance = new FakeWs();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const MockWebSocket = vi.fn(function () {
    setTimeout(() => instance.emit('open'), 0);
    return instance;
  }) as unknown as { new (url: string): FakeWs } & ReturnType<typeof vi.fn>;

  return { MockWebSocket, mockWsInstance: instance };
});

vi.mock('ws', () => ({ default: MockWebSocket }));

// ── Hoist fetch mock ──────────────────────────────────────────────────────────
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal('fetch', mockFetch);

import { EventEmitter } from 'node:events';
import { MattermostPlugin } from '@process/channels/plugins/tier3/mattermost/MattermostPlugin';

const ME_RESPONSE = { id: 'bot-user-id', username: 'wayland-bot' };
const WS_AUTH_OK = JSON.stringify({ seq_reply: 1, status: 'OK' });

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'mattermost_default',
    type: 'mattermost',
    name: 'Mattermost',
    enabled: true,
    status: 'created',
    credentials: {
      serverUrl: 'https://mattermost.example.com',
      accessToken: 'test-token-abc',
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

async function startPlugin(): Promise<MattermostPlugin> {
  const plugin = new MattermostPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  return plugin;
}

beforeEach(() => {
  MockWebSocket.mockClear();
  mockFetch.mockReset();
  mockWsInstance.send.mockReset();
  mockWsInstance.close.mockReset();
  EventEmitter.prototype.removeAllListeners.call(mockWsInstance);

  MockWebSocket.mockImplementation(function () {
    setTimeout(() => mockWsInstance.emit('open'), 0);
    return mockWsInstance;
  });

  // Default: users/me OK then all subsequent REST calls succeed.
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(ME_RESPONSE),
  });

  mockWsInstance.send.mockImplementation(() => {
    setTimeout(() => mockWsInstance.emit('message', WS_AUTH_OK), 0);
  });
});

// ── sendMessage ───────────────────────────────────────────────────────────────

describe('MattermostPlugin.sendMessage - happy paths', () => {
  it('posts to /api/v4/posts and returns the post id', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(ME_RESPONSE),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'post-id-123' }),
      });

    const plugin = await startPlugin();
    const id = await plugin.sendMessage('channel-xyz', { type: 'text', text: 'hello' });

    expect(id).toBe('post-id-123');

    const [url, opts] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(url).toBe('https://mattermost.example.com/api/v4/posts');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body as string) as { channel_id: string; message: string };
    expect(body.channel_id).toBe('channel-xyz');
    expect(body.message).toBe('hello');

    await plugin.stop();
  });

  it('returns empty string for blank message without calling REST', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ME_RESPONSE),
    });

    const plugin = await startPlugin();
    const callsBefore = mockFetch.mock.calls.length;
    const id = await plugin.sendMessage('channel-xyz', { type: 'text', text: '   ' });

    expect(id).toBe('');
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
    await plugin.stop();
  });

  it('sends multiple chunks for long messages and returns last post id', async () => {
    const longText = 'word '.repeat(Math.ceil((MATTERMOST_MESSAGE_LIMIT * 2) / 5)).trimEnd();

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ME_RESPONSE) }) // users/me
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'chunk-post-id' }) }); // chunks

    const plugin = await startPlugin();
    const id = await plugin.sendMessage('channel-xyz', { type: 'text', text: longText });

    // At least 2 POST calls (1 users/me + 2+ chunks).
    const postCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      (url as string).endsWith('/api/v4/posts'),
    );
    expect(postCalls.length).toBeGreaterThan(1);
    expect(id).toBe('chunk-post-id');

    await plugin.stop();
  });
});

describe('MattermostPlugin.sendMessage - error path', () => {
  it('throws when REST call fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ME_RESPONSE) })
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('error') });

    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('channel-xyz', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/500/);
    await plugin.stop();
  });
});

// ── editMessage ───────────────────────────────────────────────────────────────

describe('MattermostPlugin.editMessage', () => {
  it('PUTs to /api/v4/posts/{id} with updated message', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ME_RESPONSE) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'post-id-999' }) });

    const plugin = await startPlugin();
    await plugin.editMessage('channel-xyz', 'post-id-999', {
      type: 'text',
      text: 'updated text',
    });

    const [url, opts] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(url).toBe('https://mattermost.example.com/api/v4/posts/post-id-999');
    expect(opts.method).toBe('PUT');
    const body = JSON.parse(opts.body as string) as { id: string; message: string };
    expect(body.id).toBe('post-id-999');
    expect(body.message).toBe('updated text');

    await plugin.stop();
  });

  it('is a no-op for blank edit text', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(ME_RESPONSE) });

    const plugin = await startPlugin();
    const callsBefore = mockFetch.mock.calls.length;
    await plugin.editMessage('channel-xyz', 'post-id-999', { type: 'text', text: '' });
    expect(mockFetch.mock.calls.length).toBe(callsBefore);
    await plugin.stop();
  });
});

// ── Inbound message emission ──────────────────────────────────────────────────

describe('MattermostPlugin inbound message emission', () => {
  it('emits a unified message when a posted WS event arrives', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(ME_RESPONSE) });

    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });

    const post = {
      id: 'post-abc',
      user_id: 'alice-id',
      channel_id: 'channel-xyz',
      message: 'hello from mattermost',
      type: '',
      create_at: 1_700_000_000_000,
    };
    const wsEvent = JSON.stringify({
      event: 'posted',
      data: { post: JSON.stringify(post) },
      broadcast: { channel_id: 'channel-xyz' },
    });

    mockWsInstance.emit('message', wsEvent);
    await new Promise((r) => setTimeout(r, 0));

    expect(received.length).toBe(1);
    const msg = received[0] as { platform: string; content: { text: string }; chatId: string };
    expect(msg.platform).toBe('mattermost');
    expect(msg.content.text).toBe('hello from mattermost');
    expect(msg.chatId).toBe('channel-xyz');

    await plugin.stop();
  });

  it('does not emit messages from the bot itself', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(ME_RESPONSE) });

    const plugin = await startPlugin();
    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });

    // user_id matches selfUserId (bot-user-id from ME_RESPONSE).
    const post = {
      id: 'self-post',
      user_id: 'bot-user-id',
      channel_id: 'channel-xyz',
      message: 'self echo',
      type: '',
    };
    mockWsInstance.emit(
      'message',
      JSON.stringify({
        event: 'posted',
        data: { post: JSON.stringify(post) },
        broadcast: { channel_id: 'channel-xyz' },
      }),
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(received.length).toBe(0);
    await plugin.stop();
  });

  it('tracks senders in the active user set', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(ME_RESPONSE) });

    const plugin = await startPlugin();
    plugin.onMessage(async () => undefined);

    expect(plugin.getActiveUserCount()).toBe(0);

    const post = {
      id: 'post-1',
      user_id: 'alice-id',
      channel_id: 'channel-xyz',
      message: 'hi',
      type: '',
    };
    mockWsInstance.emit(
      'message',
      JSON.stringify({
        event: 'posted',
        data: { post: JSON.stringify(post) },
        broadcast: { channel_id: 'channel-xyz' },
      }),
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(plugin.getActiveUserCount()).toBeGreaterThan(0);
    await plugin.stop();
  });
});
