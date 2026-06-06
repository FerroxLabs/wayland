/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleChatPlugin } from '@process/channels/plugins/tier3/google-chat/GoogleChatPlugin';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

// vi.hoisted + vi.mock at module top level per vitest 4 requirement.
const { mockGetClient, mockGetAccessToken } = vi.hoisted(() => ({
  mockGetClient: vi.fn(),
  mockGetAccessToken: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn(function () {
    return { getClient: mockGetClient };
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_SA_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'my-project',
  client_email: 'bot@my-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----\n',
});

async function initPlugin(): Promise<GoogleChatPlugin> {
  const plugin = new GoogleChatPlugin();
  await plugin.initialize({
    id: 'google-chat_default',
    type: 'google-chat',
    name: 'Google Chat',
    enabled: true,
    credentials: {
      serviceAccountJson: VALID_SA_JSON,
      audience: '123456789012',
    },
    status: 'created',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await plugin.start();
  return plugin;
}

// ── sendMessage ───────────────────────────────────────────────────────────────

describe('GoogleChatPlugin.sendMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockGetClient.mockResolvedValue({ getAccessToken: mockGetAccessToken });
    mockGetAccessToken.mockResolvedValue({ token: 'fake-token' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to /v1/{space}/messages and returns the message name', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'spaces/AAA/messages/MSG-001' }),
    } as Response);

    const plugin = await initPlugin();
    const msgId = await plugin.sendMessage('spaces/AAA', { type: 'text', text: 'Hello!' });

    expect(msgId).toBe('spaces/AAA/messages/MSG-001');
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('spaces/AAA/messages');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ text: 'Hello!' });
  });

  it('throws when the API returns a non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    } as Response);

    const plugin = await initPlugin();
    await expect(
      plugin.sendMessage('spaces/AAA', { type: 'text', text: 'Hi' }),
    ).rejects.toThrow(/429/);
  });

  it('throws when the response is missing a message name', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const plugin = await initPlugin();
    await expect(
      plugin.sendMessage('spaces/AAA', { type: 'text', text: 'Hi' }),
    ).rejects.toThrow(/missing message name/i);
  });

  it('throws when not initialized', async () => {
    const plugin = new GoogleChatPlugin();
    await expect(
      plugin.sendMessage('spaces/X', { type: 'text', text: 'Hi' }),
    ).rejects.toThrow(/not initialized/i);
  });
});

// ── editMessage ───────────────────────────────────────────────────────────────

describe('GoogleChatPlugin.editMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockGetClient.mockResolvedValue({ getAccessToken: mockGetAccessToken });
    mockGetAccessToken.mockResolvedValue({ token: 'fake-token' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCHes the message resource with updateMask=text', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'spaces/AAA/messages/MSG-001' }),
    } as Response);

    const plugin = await initPlugin();
    await plugin.editMessage(
      'spaces/AAA',
      'spaces/AAA/messages/MSG-001',
      { type: 'text', text: 'Updated text' },
    );

    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('spaces/AAA/messages/MSG-001');
    expect(url).toContain('updateMask=text');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ text: 'Updated text' });
  });

  it('throws when the API returns a non-OK status on edit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => 'Not found',
    } as Response);

    const plugin = await initPlugin();
    await expect(
      plugin.editMessage('spaces/AAA', 'spaces/AAA/messages/GONE', { type: 'text', text: 'x' }),
    ).rejects.toThrow(/404/);
  });

  it('throws when not initialized', async () => {
    const plugin = new GoogleChatPlugin();
    await expect(
      plugin.editMessage('spaces/X', 'spaces/X/messages/Y', { type: 'text', text: 'x' }),
    ).rejects.toThrow(/not initialized/i);
  });
});

// ── handleWebhookPayload ──────────────────────────────────────────────────────

describe('GoogleChatPlugin.handleWebhookPayload', () => {
  beforeEach(() => {
    mockGetClient.mockResolvedValue({ getAccessToken: mockGetAccessToken });
    mockGetAccessToken.mockResolvedValue({ token: 'fake-token' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits a unified message for a MESSAGE event', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      {
        type: 'MESSAGE',
        space: { name: 'spaces/AAA' },
        user: { name: 'users/U1', displayName: 'Alice', email: 'alice@example.com' },
        message: { name: 'spaces/AAA/messages/M1', text: 'Hello bot' },
        eventTime: '2026-05-18T00:00:00Z',
      },
      {},
      'google-chat_default',
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].platform).toBe('google-chat');
    expect(emitted[0].chatId).toBe('spaces/AAA');
    expect(emitted[0].content.text).toBe('Hello bot');
    expect(emitted[0].user.displayName).toBe('Alice');
  });

  it('drops ADDED_TO_SPACE events without emitting', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      { type: 'ADDED_TO_SPACE', space: { name: 'spaces/X' } },
      {},
      'google-chat_default',
    );

    expect(emitted).toHaveLength(0);
  });

  it('drops REMOVED_FROM_SPACE events without emitting', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      { type: 'REMOVED_FROM_SPACE', space: { name: 'spaces/X' } },
      {},
      'google-chat_default',
    );

    expect(emitted).toHaveLength(0);
  });

  it('drops MESSAGE events with no usable text', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => { emitted.push(msg); });

    await plugin.handleWebhookPayload(
      {
        type: 'MESSAGE',
        space: { name: 'spaces/X' },
        message: { name: undefined, text: '', argumentText: '' },
      },
      {},
      'google-chat_default',
    );

    expect(emitted).toHaveLength(0);
    warnSpy.mockRestore();
  });

  it('resolves without throwing when no message handler is registered', async () => {
    const plugin = await initPlugin();
    await expect(
      plugin.handleWebhookPayload(
        {
          type: 'MESSAGE',
          space: { name: 'spaces/X' },
          user: { name: 'users/U2', displayName: 'Bob' },
          message: { name: 'spaces/X/messages/M2', text: 'hi' },
        },
        {},
        'google-chat_default',
      ),
    ).resolves.toBeUndefined();
  });
});
