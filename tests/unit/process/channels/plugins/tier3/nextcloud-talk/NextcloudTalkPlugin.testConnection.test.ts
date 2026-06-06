/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for NextcloudTalkPlugin.testConnection - happy path, bad credentials,
 * network failure. fetch is mocked via vi.hoisted.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoist the fetch mock ──────────────────────────────────────────────────────
const { mockFetch } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  return { mockFetch };
});

vi.stubGlobal('fetch', mockFetch);

import { NextcloudTalkPlugin } from '@process/channels/plugins/tier3/nextcloud-talk/NextcloudTalkPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_TOKEN = JSON.stringify({
  serverUrl: 'https://cloud.example.com',
  username: 'bot',
  appPassword: 'xxxx-xxxx-xxxx-xxxx',
});

function makeWhoamiOk(userId = 'bot'): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      ocs: {
        meta: { status: 'ok', statuscode: 200, message: 'OK' },
        data: { id: userId, displayname: 'Bot User' },
      },
    }),
  } as unknown as Response;
}

function makeErrorResponse(status: number, statusText: string): Response {
  return {
    ok: false,
    status,
    statusText,
    json: async () => ({}),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(makeWhoamiOk());
});

// ── Happy path ────────────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin.testConnection - happy path', () => {
  it('returns success with botUsername when server confirms identity', async () => {
    const result = await NextcloudTalkPlugin.testConnection(VALID_TOKEN);
    expect(result).toEqual({ success: true, botUsername: 'bot' });
  });

  it('calls GET /ocs/v2.php/cloud/user with Basic auth header', async () => {
    await NextcloudTalkPlugin.testConnection(VALID_TOKEN);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/ocs/v2.php/cloud/user');
    // testConnection passes headers as a plain object, not a Headers instance.
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Basic /);
    expect(headers['OCS-APIRequest']).toBe('true');
  });

  it('strips trailing slash from serverUrl', async () => {
    const token = JSON.stringify({
      serverUrl: 'https://cloud.example.com/',
      username: 'bot',
      appPassword: 'xxxx-xxxx-xxxx-xxxx',
    });
    const result = await NextcloudTalkPlugin.testConnection(token);
    expect(result.success).toBe(true);
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).not.toContain('//ocs');
  });
});

// ── Credential errors ─────────────────────────────────────────────────────────

describe('NextcloudTalkPlugin.testConnection - credential errors', () => {
  it('returns failure for non-JSON token', async () => {
    const result = await NextcloudTalkPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/json/i);
  });

  it('returns failure when serverUrl is missing', async () => {
    const result = await NextcloudTalkPlugin.testConnection(
      JSON.stringify({ username: 'bot', appPassword: 'pass' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/server url/i);
  });

  it('returns failure when username is missing', async () => {
    const result = await NextcloudTalkPlugin.testConnection(
      JSON.stringify({ serverUrl: 'https://cloud.example.com', appPassword: 'pass' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/username/i);
  });

  it('returns failure when appPassword is missing', async () => {
    const result = await NextcloudTalkPlugin.testConnection(
      JSON.stringify({ serverUrl: 'https://cloud.example.com', username: 'bot' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/app password/i);
  });
});

// ── Network / server errors ───────────────────────────────────────────────────

describe('NextcloudTalkPlugin.testConnection - network failures', () => {
  it('returns failure with 401 message on bad credentials', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(401, 'Unauthorized'));
    const result = await NextcloudTalkPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/401|unauthorized/i);
  });

  it('returns failure on generic server error (500)', async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, 'Internal Server Error'));
    const result = await NextcloudTalkPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/500/i);
  });

  it('returns failure on network exception (fetch throws)', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await NextcloudTalkPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/i);
  });

  it('returns failure when server returns no user id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        ocs: { meta: { status: 'ok', statuscode: 200, message: 'OK' }, data: {} },
      }),
    } as unknown as Response);
    const result = await NextcloudTalkPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/user id/i);
  });
});
