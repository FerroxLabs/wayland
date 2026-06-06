/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for MattermostPlugin.testConnection - happy path, bad credentials,
 * network failures. fetch is mocked so no real HTTP calls are made.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.stubGlobal('fetch', mockFetch);

import { MattermostPlugin } from '@process/channels/plugins/tier3/mattermost/MattermostPlugin';

const VALID_TOKEN = JSON.stringify({
  serverUrl: 'https://mattermost.example.com',
  accessToken: 'valid-token-abc',
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('MattermostPlugin.testConnection - happy path', () => {
  it('returns success with botUsername when /users/me responds 200', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'bot-id', username: 'wayland-bot' }),
    });

    const result = await MattermostPlugin.testConnection(VALID_TOKEN);
    expect(result).toEqual({ success: true, botUsername: 'wayland-bot' });
  });

  it('calls the correct endpoint with Bearer auth', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'bot-id', username: 'wayland-bot' }),
    });

    await MattermostPlugin.testConnection(VALID_TOKEN);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://mattermost.example.com/api/v4/users/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-token-abc',
        }),
      }),
    );
  });

  it('strips trailing slash from serverUrl before calling API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'bot-id', username: 'wayland-bot' }),
    });

    const token = JSON.stringify({
      serverUrl: 'https://mattermost.example.com/',
      accessToken: 'tok',
    });
    await MattermostPlugin.testConnection(token);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe('https://mattermost.example.com/api/v4/users/me');
  });
});

describe('MattermostPlugin.testConnection - credential errors', () => {
  it('returns failure for non-JSON token', async () => {
    const result = await MattermostPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/json/i);
  });

  it('returns failure when serverUrl is missing', async () => {
    const result = await MattermostPlugin.testConnection(
      JSON.stringify({ accessToken: 'tok' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/server url/i);
  });

  it('returns failure when accessToken is missing', async () => {
    const result = await MattermostPlugin.testConnection(
      JSON.stringify({ serverUrl: 'https://mm.example.com' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/access token/i);
  });

  it('returns failure when server responds 401', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    const result = await MattermostPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/401/);
  });

  it('returns failure when server responds non-401 error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await MattermostPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/500/);
  });
});

describe('MattermostPlugin.testConnection - network failure', () => {
  it('returns failure on fetch throwing (ECONNREFUSED)', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await MattermostPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });
});
