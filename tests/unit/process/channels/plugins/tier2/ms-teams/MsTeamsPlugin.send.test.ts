/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── hoisted mocks ─────────────────────────────────────────────────────────────
const mockFetch = vi.hoisted(() => vi.fn<typeof fetch>());

vi.stubGlobal('fetch', mockFetch);

import { MsTeamsPlugin } from '@process/channels/plugins/tier2/ms-teams/MsTeamsPlugin';
import type { IChannelPluginConfig, IUnifiedOutgoingMessage } from '@process/channels/types';

function makeConfig(): IChannelPluginConfig {
  return {
    id: 'ms-teams_default',
    type: 'ms-teams',
    name: 'MS Teams',
    enabled: true,
    status: 'created',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    credentials: { appId: 'test-app-id', appPassword: 'test-app-password' },
  };
}

function mockFetchToken(): void {
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ access_token: 'mock-token', expires_in: 3600 }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
}

function mockFetchOk(body: object = {}): void {
  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

function mockFetchFail(status: number, body = 'error'): void {
  mockFetch.mockResolvedValueOnce(new Response(body, { status }));
}

const CHAT_ID = 'https://smba.trafficmanager.net/apis|19:thread-abc@thread.v2';
const MSG: IUnifiedOutgoingMessage = { type: 'text', text: 'Hello Teams' };

async function makeInitializedPlugin(): Promise<MsTeamsPlugin> {
  // initialize() needs no fetch; start() mints a token
  mockFetchToken();
  const plugin = new MsTeamsPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  // Reset so only the test's own fetch calls are counted
  mockFetch.mockReset();
  return plugin;
}

/**
 * sendMessage now wraps the actual POST in a typing keep-alive loop
 * (startTypingLoop → POST {type:'typing'} → setInterval). That means each
 * sendMessage call produces N+1 fetches: 1 immediate typing POST + N
 * activity POSTs. Tests filter mockFetch.mock.calls to find the real
 * message-activity POST by inspecting body.type.
 */
function findMessageCall(): [string, RequestInit] {
  const call = mockFetch.mock.calls.find(([, init]) => {
    if (!init) return false;
    const body = (init as RequestInit).body;
    if (typeof body !== 'string') return false;
    try {
      return (JSON.parse(body) as { type?: string }).type === 'message';
    } catch {
      return false;
    }
  });
  if (!call) throw new Error('No message activity POST found in fetch calls');
  return [String(call[0]), call[1] as RequestInit];
}

describe('MsTeamsPlugin.sendMessage', () => {
  let plugin: MsTeamsPlugin;

  beforeEach(async () => {
    mockFetch.mockReset();
    plugin = await makeInitializedPlugin();
    // Default: any unmatched fetch (e.g. typing keep-alive POSTs) returns 200.
    mockFetch.mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
  });

  it('sends POST to the Connector URL and returns activity id', async () => {
    // Token cached from start(); the typing POST + the message POST both fire.
    // Override the next call (the send) to return the expected activity id.
    mockFetchOk({ id: 'act-001' });

    const id = await plugin.sendMessage(CHAT_ID, MSG);

    expect(id).toBe('act-001');
    const [url, init] = findMessageCall();
    expect(url).toContain('/v3/conversations/');
    expect(url).toContain('19%3Athread-abc%40thread.v2');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['authorization']).toMatch(/^Bearer /);
  });

  it('throws on non-ok HTTP response', async () => {
    // Override the next (send) fetch to fail. Typing POSTs swallow errors.
    mockFetchFail(403, 'Forbidden');
    await expect(plugin.sendMessage(CHAT_ID, MSG)).rejects.toThrow(/403/);
  });

  it('falls back to default serviceUrl when chatId has no pipe separator', async () => {
    mockFetchOk({ id: 'act-002' });
    await plugin.sendMessage('19:conv-id@thread.v2', MSG);
    const [url] = findMessageCall();
    expect(url).toContain('smba.trafficmanager.net');
  });

  it('throws when plugin is not initialized', async () => {
    const fresh = new MsTeamsPlugin();
    await expect(fresh.sendMessage(CHAT_ID, MSG)).rejects.toThrow(/not initialized/);
  });
});

describe('MsTeamsPlugin.editMessage', () => {
  let plugin: MsTeamsPlugin;

  beforeEach(async () => {
    mockFetch.mockReset();
    plugin = await makeInitializedPlugin();
  });

  it('sends PUT to the Connector activity URL', async () => {
    // Token cached from start(); editMessage only does the edit.
    mockFetchOk({});

    await plugin.editMessage(CHAT_ID, 'act-original', { type: 'text', text: 'Updated text' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('/activities/act-original');
    expect((init as RequestInit).method).toBe('PUT');
  });

  it('throws on edit failure', async () => {
    mockFetchFail(500, 'Server error');
    await expect(plugin.editMessage(CHAT_ID, 'act-001', MSG)).rejects.toThrow(/500/);
  });
});

describe('MsTeamsPlugin.handleWebhookPayload', () => {
  let plugin: MsTeamsPlugin;
  let emitted: unknown[];

  beforeEach(async () => {
    mockFetch.mockReset();
    emitted = [];
    plugin = await makeInitializedPlugin();
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });
  });

  it('emits a unified message for inbound message activities', async () => {
    const activity = {
      type: 'message',
      id: 'act-inbound',
      from: { id: 'user-123', name: 'Bob' },
      conversation: { id: 'conv-abc' },
      recipient: { id: 'test-app-id' },
      text: 'Hey bot!',
      textFormat: 'plain',
    };

    await plugin.handleWebhookPayload(activity, {}, 'ms-teams_default');

    expect(emitted).toHaveLength(1);
    const msg = emitted[0] as { content: { text: string }; user: { id: string } };
    expect(msg.content.text).toBe('Hey bot!');
    expect(msg.user.id).toBe('user-123');
  });

  it('drops non-message activity types silently', async () => {
    await plugin.handleWebhookPayload({ type: 'conversationUpdate' }, {}, 'ms-teams_default');
    await plugin.handleWebhookPayload({ type: 'typing' }, {}, 'ms-teams_default');
    expect(emitted).toHaveLength(0);
  });

  it('increments active user count after inbound message', async () => {
    const activity = {
      type: 'message',
      id: 'act-x',
      from: { id: 'user-999', name: 'Carol' },
      conversation: { id: 'conv-1' },
      recipient: { id: 'test-app-id' },
      text: 'Hi',
    };

    await plugin.handleWebhookPayload(activity, {}, 'ms-teams_default');
    expect(plugin.getActiveUserCount()).toBe(1);
  });
});
