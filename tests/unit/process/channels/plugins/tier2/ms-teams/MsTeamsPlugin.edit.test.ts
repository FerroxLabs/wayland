/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dedicated coverage for MsTeamsPlugin.editMessage (Bot Framework PUT path).
 * Kept separate from send.test.ts per the OpenClaw convention.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── hoisted mocks (module top-level, before any imports) ──────────────────────
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
const MSG: IUnifiedOutgoingMessage = { type: 'text', text: 'Edited content' };

async function makeInitializedPlugin(): Promise<MsTeamsPlugin> {
  mockFetchToken();
  const plugin = new MsTeamsPlugin();
  await plugin.initialize(makeConfig());
  await plugin.start();
  mockFetch.mockReset();
  return plugin;
}

describe('MsTeamsPlugin.editMessage (PUT path)', () => {
  let plugin: MsTeamsPlugin;

  beforeEach(async () => {
    mockFetch.mockReset();
    plugin = await makeInitializedPlugin();
  });

  it('issues a PUT to /activities/{messageId}', async () => {
    mockFetchOk({});
    await plugin.editMessage(CHAT_ID, 'act-original', MSG);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('/v3/conversations/');
    expect(String(url)).toContain('/activities/act-original');
    expect((init as RequestInit).method).toBe('PUT');
  });

  it('URL-encodes both the conversation id and the message id', async () => {
    mockFetchOk({});
    await plugin.editMessage(CHAT_ID, 'act/with:special chars', MSG);
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('19%3Athread-abc%40thread.v2');
    expect(String(url)).toContain('act%2Fwith%3Aspecial%20chars');
  });

  it('sends the edited body as JSON with markdown textFormat', async () => {
    mockFetchOk({});
    await plugin.editMessage(CHAT_ID, 'act-original', {
      type: 'text',
      text: '**bold** update',
    });

    const init = mockFetch.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string) as {
      type: string;
      text: string;
      textFormat: string;
    };
    expect(body.type).toBe('message');
    expect(body.text).toBe('**bold** update');
    expect(body.textFormat).toBe('markdown');
  });

  it('sends a Bearer authorization header', async () => {
    mockFetchOk({});
    await plugin.editMessage(CHAT_ID, 'act-x', MSG);
    const init = mockFetch.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['authorization']).toMatch(/^Bearer /);
    expect(headers['content-type']).toBe('application/json');
  });

  it('throws on non-ok HTTP response', async () => {
    mockFetchFail(500, 'Server error');
    await expect(plugin.editMessage(CHAT_ID, 'act-001', MSG)).rejects.toThrow(/500/);
  });

  it('throws when plugin is not initialized', async () => {
    const fresh = new MsTeamsPlugin();
    await expect(fresh.editMessage(CHAT_ID, 'act-x', MSG)).rejects.toThrow(/not initialized/);
  });

  it('falls back to default serviceUrl when chatId has no pipe separator', async () => {
    mockFetchOk({});
    await plugin.editMessage('19:conv-id@thread.v2', 'act-y', MSG);
    const [url] = mockFetch.mock.calls[0]!;
    expect(String(url)).toContain('smba.trafficmanager.net');
  });
});
