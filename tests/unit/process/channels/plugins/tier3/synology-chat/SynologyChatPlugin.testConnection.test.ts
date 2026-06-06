/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for SynologyChatPlugin.testConnection - happy path, bad credentials,
 * network failure. fetch is mocked via vi.stubGlobal - no real HTTP.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SynologyChatPlugin } from '@process/channels/plugins/tier3/synology-chat/SynologyChatPlugin';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const VALID_TOKEN = JSON.stringify({
  incomingUrl: 'https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=abc',
  incomingToken: 'test-token-123',
});

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(new Response('{"success":true}', { status: 200 }));
});

describe('SynologyChatPlugin.testConnection - happy path', () => {
  it('returns success with botUsername when POST succeeds', async () => {
    const result = await SynologyChatPlugin.testConnection(VALID_TOKEN);
    expect(result).toEqual({ success: true, botUsername: 'wayland-bot' });
  });

  it('POSTs to the incomingUrl with form-encoded test payload', async () => {
    await SynologyChatPlugin.testConnection(VALID_TOKEN);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('nas.example.com');
    expect(init.method).toBe('POST');
    const bodyStr = init.body as string;
    const params = new URLSearchParams(bodyStr);
    const inner = JSON.parse(params.get('payload')!) as { text: string };
    expect(inner.text).toBe('Wayland test connection');
  });
});

describe('SynologyChatPlugin.testConnection - credential errors', () => {
  it('returns failure for non-JSON token', async () => {
    const result = await SynologyChatPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns failure when incomingUrl is missing', async () => {
    const result = await SynologyChatPlugin.testConnection(
      JSON.stringify({ incomingToken: 'tok' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/URL/i);
  });

  it('returns failure when incomingToken is missing', async () => {
    const result = await SynologyChatPlugin.testConnection(
      JSON.stringify({ incomingUrl: 'https://nas.example.com/webhook' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/token/i);
  });

  it('returns failure when incomingUrl is empty string', async () => {
    const result = await SynologyChatPlugin.testConnection(
      JSON.stringify({ incomingUrl: '', incomingToken: 'tok' }),
    );
    expect(result.success).toBe(false);
  });
});

describe('SynologyChatPlugin.testConnection - network failures', () => {
  it('returns failure when server returns non-200', async () => {
    mockFetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }));
    const result = await SynologyChatPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/401/);
  });

  it('returns failure when fetch rejects (network error)', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await SynologyChatPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });

  it('returns failure when server returns 500', async () => {
    mockFetch.mockResolvedValue(new Response('Internal Server Error', { status: 500 }));
    const result = await SynologyChatPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/500/);
  });
});
