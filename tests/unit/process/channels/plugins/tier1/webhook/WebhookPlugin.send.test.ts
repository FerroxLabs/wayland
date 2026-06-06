/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebhookPlugin } from '@process/channels/plugins/tier1/webhook/WebhookPlugin';
import type { IUnifiedIncomingMessage } from '@process/channels/types';

async function initPlugin(overrides: Record<string, unknown> = {}): Promise<WebhookPlugin> {
  const plugin = new WebhookPlugin();
  await plugin.initialize({
    id: 'webhook_default',
    type: 'webhook',
    name: 'Webhook',
    enabled: true,
    credentials: {
      outboundUrl: 'https://example.com/hook',
      ...overrides,
    },
    status: 'created',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await plugin.start();
  return plugin;
}

describe('WebhookPlugin.sendMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs to outboundUrl and returns a synthetic message id on success', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    const plugin = await initPlugin();

    const id = await plugin.sendMessage('chat-1', { type: 'text', text: 'Hello' });

    expect(id).toMatch(/^wh-msg-\d+$/);
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://example.com/hook');
    expect(((init?.headers ?? {}) as Record<string, string>)['content-type']).toBe('application/json');

    const body = JSON.parse(init?.body as string) as { chatId: string; message: string };
    expect(body.chatId).toBe('chat-1');
    expect(body.message).toBe('Hello');
  });

  it('adds X-Webhook-Signature header when outboundSecret is configured', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    const plugin = await initPlugin({ outboundSecret: 'my-signing-secret' });

    await plugin.sendMessage('chat-1', { type: 'text', text: 'Signed message' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-webhook-signature']).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('does NOT add X-Webhook-Signature when no secret configured', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    const plugin = await initPlugin();

    await plugin.sendMessage('chat-1', { type: 'text', text: 'Unsigned' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers['x-webhook-signature']).toBeUndefined();
  });

  it('throws on HTTP error response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    const plugin = await initPlugin();

    await expect(plugin.sendMessage('chat-1', { type: 'text', text: 'hi' })).rejects.toThrow(/502/);
  });

  it('throws on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    const plugin = await initPlugin();

    await expect(plugin.sendMessage('chat-1', { type: 'text', text: 'hi' })).rejects.toThrow(/network down/i);
  });
});

describe('WebhookPlugin.handleWebhookPayload', () => {
  it('emits a unified message for a valid inbound payload', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      { id: 'in-1', chatId: 'room-A', userId: 'u1', text: 'Inbound text' },
      {},
      'webhook_default'
    );

    expect(emitted).toHaveLength(1);
    expect(emitted[0].content.text).toBe('Inbound text');
    expect(emitted[0].chatId).toBe('room-A');
    expect(emitted[0].platform).toBe('webhook_default');
  });

  it('drops payloads with no extractable text without throwing', async () => {
    const plugin = await initPlugin();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload({ id: 'x', chatId: 'c' }, {}, 'webhook_default');

    expect(emitted).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('emits with attachment URLs appended to text', async () => {
    const plugin = await initPlugin();
    const emitted: IUnifiedIncomingMessage[] = [];
    plugin.onMessage(async (msg) => {
      emitted.push(msg);
    });

    await plugin.handleWebhookPayload(
      {
        text: 'Check this',
        attachments: [{ url: 'https://cdn.example.com/doc.pdf', name: 'doc.pdf' }],
      },
      {},
      'webhook_default'
    );

    expect(emitted[0].content.text).toContain('Check this');
    expect(emitted[0].content.text).toContain('[doc.pdf](https://cdn.example.com/doc.pdf)');
  });
});

describe('WebhookPlugin capabilities', () => {
  it('declares all capabilities false', async () => {
    const plugin = new WebhookPlugin();
    expect(plugin.capabilities).toEqual({
      canEdit: false,
      canStream: false,
      canReact: false,
      canTypingIndicator: false,
    });
  });

  it('editMessage falls through to the BasePlugin no-op (does not throw)', async () => {
    const plugin = await initPlugin();
    // canEdit=false means BasePlugin.editMessage is a no-op; must not throw.
    await expect(plugin.editMessage('chat-1', 'msg-id', { type: 'text', text: 'edit' })).resolves.toBeUndefined();
  });
});
