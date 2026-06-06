/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebhookPlugin } from '@process/channels/plugins/tier1/webhook/WebhookPlugin';

describe('WebhookPlugin.testConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success when the outbound URL responds 2xx', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const result = await WebhookPlugin.testConnection(
      JSON.stringify({ outboundUrl: 'https://example.com/hook' })
    );

    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('https://example.com/hook');
    expect(result.error).toBeUndefined();
  });

  it('includes the HMAC signature header when outboundSecret is set', async () => {
    let capturedHeaders: Record<string, string> = {};
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init?.headers as Record<string, string>) ?? {})
      );
      return new Response(null, { status: 200 });
    });

    await WebhookPlugin.testConnection(
      JSON.stringify({
        outboundUrl: 'https://example.com/hook',
        outboundSecret: 'my-secret',
      })
    );

    expect(capturedHeaders['x-webhook-signature']).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('returns failure when the outbound URL responds 4xx', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not Found', { status: 404 })
    );

    const result = await WebhookPlugin.testConnection(
      JSON.stringify({ outboundUrl: 'https://example.com/hook' })
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/404/);
  });

  it('returns failure on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await WebhookPlugin.testConnection(
      JSON.stringify({ outboundUrl: 'https://example.com/hook' })
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/i);
  });

  it('returns failure for invalid JSON credentials', async () => {
    const result = await WebhookPlugin.testConnection('not-json{{{');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid json/i);
  });

  it('returns failure when outboundUrl is missing from credentials', async () => {
    const result = await WebhookPlugin.testConnection(JSON.stringify({}));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/outboundUrl is required/i);
  });

  it('returns failure when outboundUrl is not a valid URL', async () => {
    const result = await WebhookPlugin.testConnection(
      JSON.stringify({ outboundUrl: 'not-a-url' })
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not a valid URL/i);
  });
});
