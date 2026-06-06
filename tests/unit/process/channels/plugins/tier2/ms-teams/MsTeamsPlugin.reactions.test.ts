/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dedicated coverage for MsTeamsPlugin.addReaction. Mirrors OpenClaw's
 * send.reactions.test.ts convention of keeping reaction tests in their own file.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── hoisted mocks (module top-level, before any imports) ──────────────────────
const mockFetch = vi.hoisted(() => vi.fn<typeof fetch>());

vi.stubGlobal('fetch', mockFetch);

import { MsTeamsPlugin } from '@process/channels/plugins/tier2/ms-teams/MsTeamsPlugin';
import type { IChannelPluginConfig } from '@process/channels/types';

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
const MESSAGE_ID = 'act-target-123';

async function makeInitializedPlugin(): Promise<MsTeamsPlugin> {
  mockFetchToken();
  const plugin = new MsTeamsPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  mockFetch.mockReset();
  return plugin;
}

describe('MsTeamsPlugin.addReaction', () => {
  let plugin: MsTeamsPlugin;

  beforeEach(async () => {
    mockFetch.mockReset();
    plugin = await makeInitializedPlugin();
  });

  it('POSTs a messageReaction activity to the Connector URL', async () => {
    mockFetchOk({});

    await plugin.addReaction(CHAT_ID, MESSAGE_ID, 'like');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('/v3/conversations/');
    expect(String(url)).toContain('19%3Athread-abc%40thread.v2');
    expect(String(url)).toContain('/activities');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('sends a Bearer authorization header', async () => {
    mockFetchOk({});
    await plugin.addReaction(CHAT_ID, MESSAGE_ID, 'heart');

    const init = mockFetch.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['authorization']).toMatch(/^Bearer /);
    expect(headers['content-type']).toBe('application/json');
  });

  it('body includes type=messageReaction with the emoji and replyToId', async () => {
    mockFetchOk({});
    await plugin.addReaction(CHAT_ID, MESSAGE_ID, 'laugh');

    const init = mockFetch.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string) as {
      type: string;
      reactionsAdded: Array<{ type: string }>;
      replyToId: string;
    };
    expect(body.type).toBe('messageReaction');
    expect(body.reactionsAdded).toEqual([{ type: 'laugh' }]);
    expect(body.replyToId).toBe(MESSAGE_ID);
  });

  it('throws when the Connector returns non-ok', async () => {
    mockFetchFail(500, 'Internal error');
    await expect(plugin.addReaction(CHAT_ID, MESSAGE_ID, 'sad')).rejects.toThrow(/500/);
  });

  it('no-ops silently when plugin is not initialized', async () => {
    const fresh = new MsTeamsPlugin();
    // addReaction without creds returns undefined without throwing
    await expect(fresh.addReaction(CHAT_ID, MESSAGE_ID, 'like')).resolves.toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('falls back to default serviceUrl when chatId has no pipe separator', async () => {
    mockFetchOk({});
    await plugin.addReaction('19:conv-id@thread.v2', MESSAGE_ID, 'like');
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('smba.trafficmanager.net');
  });
});
