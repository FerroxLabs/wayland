/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for NextcloudTalkPlugin.sendMessage, editMessage, addReaction,
 * and inbound message emission from the long-poll loop. fetch is mocked
 * via vi.hoisted.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IChannelPluginConfig } from '@process/channels/types';

// ── Hoist the fetch mock ──────────────────────────────────────────────────────
const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.stubGlobal('fetch', mockFetch);

import { NextcloudTalkPlugin } from '@process/channels/plugins/tier3/nextcloud-talk/NextcloudTalkPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<Record<string, unknown>> = {}): IChannelPluginConfig {
  return {
    id: 'nextcloud-talk_default',
    type: 'nextcloud-talk',
    name: 'Nextcloud Talk',
    enabled: true,
    status: 'created',
    credentials: {
      serverUrl: 'https://cloud.example.com',
      username: 'bot',
      appPassword: 'xxxx-xxxx-xxxx-xxxx',
      ...overrides,
    },
    createdAt: 0,
    updatedAt: 0,
  };
}

function makeWhoamiResponse(userId = 'bot'): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      ocs: {
        meta: { status: 'ok', statuscode: 200, message: 'OK' },
        data: { id: userId, displayname: userId },
      },
    }),
  } as unknown as Response;
}

function makeSendResponse(messageId = 101): Response {
  return {
    ok: true,
    status: 201,
    statusText: 'Created',
    json: async () => ({
      ocs: {
        meta: { status: 'ok', statuscode: 201, message: 'Created' },
        data: {
          id: messageId,
          timestamp: 1_700_000_000,
          systemMessage: '',
          message: 'test',
          actorType: 'users',
          actorId: 'bot',
          actorDisplayName: 'Bot',
        },
      },
    }),
  } as unknown as Response;
}

function makeOkResponse(): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ ocs: { meta: { status: 'ok', statuscode: 200, message: 'OK' }, data: {} } }),
  } as unknown as Response;
}

function makePollResponse304(): Response {
  return {
    ok: false,
    status: 304,
    statusText: 'Not Modified',
    json: async () => ({}),
  } as unknown as Response;
}

/**
 * Start a plugin with no rooms so the poll loop never fires background fetches
 * that would interfere with the test's fetch call accounting.
 */
async function startPlugin(): Promise<NextcloudTalkPlugin> {
  const plugin = new NextcloudTalkPlugin();
  await plugin.initialize(makeConfig({ rooms: [] }));
  await plugin.start();
  return plugin;
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url: string) => {
    if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
    return Promise.resolve(makePollResponse304());
  });
});

// ── sendMessage ───────────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin.sendMessage - happy path', () => {
  it('POSTs to the correct chat URL and returns the message id as a string', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      if (String(url).includes('/chat/')) return Promise.resolve(makeSendResponse(101));
      return Promise.resolve(makePollResponse304());
    });

    const plugin = await startPlugin();
    const id = await plugin.sendMessage('myroom', { type: 'text', text: 'hello nc' });

    expect(id).toBe('101');

    const chatCall = mockFetch.mock.calls.find(([url]: [string]) =>
      String(url).includes('/chat/myroom'),
    );
    expect(chatCall).toBeDefined();
    const [, init] = chatCall as [string, RequestInit];
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as { message: string };
    expect(body.message).toBe('hello nc');

    await plugin.stop();
  });

  it('returns empty string for blank text without calling fetch chat endpoint', async () => {
    const plugin = await startPlugin();
    const id = await plugin.sendMessage('myroom', { type: 'text', text: '' });
    expect(id).toBe('');
    const chatCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/chat/'),
    );
    expect(chatCalls.length).toBe(0);
    await plugin.stop();
  });

  it('sends each chunk in a separate POST for long messages', async () => {
    mockFetch.mockImplementation((url: string, _init: RequestInit) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      if (String(url).includes('/chat/')) return Promise.resolve(makeSendResponse(200));
      return Promise.resolve(makePollResponse304());
    });

    const plugin = await startPlugin();
    // ~9000 chars → at least 3 chunks at 4000 chars each
    const longText = 'word '.repeat(1800).trimEnd();
    await plugin.sendMessage('myroom', { type: 'text', text: longText });

    const chatCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/chat/myroom'),
    );
    expect(chatCalls.length).toBeGreaterThanOrEqual(2);

    await plugin.stop();
  });

  it('throws when the server returns a non-2xx status', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      return Promise.resolve({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      } as unknown as Response);
    });

    const plugin = await startPlugin();
    await expect(
      plugin.sendMessage('myroom', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/403/);
    await plugin.stop();
  });

  it('throws when plugin is not started', async () => {
    const plugin = new NextcloudTalkPlugin();
    await expect(
      plugin.sendMessage('myroom', { type: 'text', text: 'hello' }),
    ).rejects.toThrow(/not started/i);
  });
});

// ── editMessage ───────────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin.editMessage', () => {
  it('PUTs to the correct message URL', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      return Promise.resolve(makeOkResponse());
    });

    const plugin = await startPlugin();
    await plugin.editMessage('myroom', '55', { type: 'text', text: 'edited text' });

    const editCall = mockFetch.mock.calls.find(([url]: [string]) =>
      String(url).includes('/chat/myroom/55'),
    );
    expect(editCall).toBeDefined();
    const [, init] = editCall as [string, RequestInit];
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body as string) as { message: string };
    expect(body.message).toBe('edited text');

    await plugin.stop();
  });

  it('does nothing for blank text (no fetch call)', async () => {
    const plugin = await startPlugin();
    await plugin.editMessage('myroom', '55', { type: 'text', text: '' });
    const editCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      String(url).includes('/chat/myroom/55'),
    );
    expect(editCalls.length).toBe(0);
    await plugin.stop();
  });

  it('throws when server returns non-2xx', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as unknown as Response);
    });

    const plugin = await startPlugin();
    await expect(
      plugin.editMessage('myroom', '999', { type: 'text', text: 'edit' }),
    ).rejects.toThrow(/404/);
    await plugin.stop();
  });
});

// ── addReaction ───────────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin.addReaction', () => {
  it('POSTs to the reaction endpoint with the emoji', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      return Promise.resolve(makeOkResponse());
    });

    const plugin = await startPlugin();
    await plugin.addReaction('myroom', '77', '👍');

    const reactionCall = mockFetch.mock.calls.find(([url]: [string]) =>
      String(url).includes('/reaction/myroom/77'),
    );
    expect(reactionCall).toBeDefined();
    const [, init] = reactionCall as [string, RequestInit];
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as { reaction: string };
    expect(body.reaction).toBe('👍');

    await plugin.stop();
  });
});

// ── Inbound message emission ──────────────────────────────────────────────────

describe('NextcloudTalkPlugin inbound emission via poll loop', () => {
  it('emits a unified message when the poll returns a new chat message', async () => {
    // Set up: plugin with one room. On first poll return a message, subsequent polls 304.
    let pollCount = 0;
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      if (String(url).includes('/chat/')) {
        pollCount += 1;
        if (pollCount === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              ocs: {
                meta: { status: 'ok', statuscode: 200, message: 'OK' },
                data: [
                  {
                    id: 1,
                    timestamp: 1_700_000_000,
                    systemMessage: '',
                    message: 'hello from alice',
                    actorType: 'users',
                    actorId: 'alice',
                    actorDisplayName: 'Alice',
                  },
                ],
              },
            }),
          } as unknown as Response);
        }
        return Promise.resolve(makePollResponse304());
      }
      return Promise.resolve(makePollResponse304());
    });

    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig({ rooms: ['testroom'] }));

    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });

    await plugin.start();

    // Wait for the async poll loop to fire and process at least one response.
    await new Promise((r) => setTimeout(r, 80));

    expect(received.length).toBeGreaterThanOrEqual(1);
    const msg = received[0] as { platform: string; content: { text: string }; chatId: string };
    expect(msg.platform).toBe('nextcloud-talk');
    expect(msg.chatId).toBe('testroom');
    expect(msg.content.text).toBe('hello from alice');

    await plugin.stop();
  });

  it('does not emit messages from the bot itself (echo filter)', async () => {
    let pollCount = 0;
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse('bot'));
      if (String(url).includes('/chat/')) {
        pollCount += 1;
        if (pollCount === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              ocs: {
                meta: { status: 'ok', statuscode: 200, message: 'OK' },
                data: [
                  {
                    id: 2,
                    timestamp: 1_700_000_001,
                    systemMessage: '',
                    message: 'bot echo',
                    actorType: 'bots',
                    actorId: 'bot',
                    actorDisplayName: 'Bot',
                  },
                ],
              },
            }),
          } as unknown as Response);
        }
        return Promise.resolve(makePollResponse304());
      }
      return Promise.resolve(makePollResponse304());
    });

    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig({ rooms: ['testroom'] }));

    const received: unknown[] = [];
    plugin.onMessage(async (msg) => {
      received.push(msg);
    });

    await plugin.start();
    await new Promise((r) => setTimeout(r, 80));

    expect(received.length).toBe(0);

    await plugin.stop();
  });

  it('tracks senders in the active user set', async () => {
    let pollCount = 0;
    mockFetch.mockImplementation((url: string) => {
      if (String(url).includes('/cloud/user')) return Promise.resolve(makeWhoamiResponse());
      if (String(url).includes('/chat/')) {
        pollCount += 1;
        if (pollCount === 1) {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              ocs: {
                meta: { status: 'ok', statuscode: 200, message: 'OK' },
                data: [
                  {
                    id: 3,
                    timestamp: 1_700_000_002,
                    systemMessage: '',
                    message: 'hi',
                    actorType: 'users',
                    actorId: 'carol',
                    actorDisplayName: 'Carol',
                  },
                ],
              },
            }),
          } as unknown as Response);
        }
        return Promise.resolve(makePollResponse304());
      }
      return Promise.resolve(makePollResponse304());
    });

    const plugin = new NextcloudTalkPlugin();
    await plugin.initialize(makeConfig({ rooms: ['testroom'] }));
    plugin.onMessage(async () => undefined);

    expect(plugin.getActiveUserCount()).toBe(0);
    await plugin.start();
    await new Promise((r) => setTimeout(r, 80));
    expect(plugin.getActiveUserCount()).toBe(1);

    await plugin.stop();
  });
});
