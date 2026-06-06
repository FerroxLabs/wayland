/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for BluebubblesPlugin.testConnection - happy path, bad credentials,
 * network failures. fetch is mocked so no real HTTP calls are made.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.stubGlobal('fetch', mockFetch);

import { BluebubblesPlugin } from '@process/channels/plugins/tier3/bluebubbles/BluebubblesPlugin';

const VALID_TOKEN = JSON.stringify({
  serverUrl: 'https://bb.example.com:1234',
  password: 'secret123',
});

const SERVER_INFO_RESPONSE = {
  status: 200,
  data: { server_address: 'bb.example.com' },
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('BluebubblesPlugin.testConnection - happy path', () => {
  it('returns success with botUsername when server/info responds 200', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SERVER_INFO_RESPONSE),
    });

    const result = await BluebubblesPlugin.testConnection(VALID_TOKEN);
    expect(result).toEqual({ success: true, botUsername: 'bb.example.com' });
  });

  it('calls the correct endpoint with password as query param', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SERVER_INFO_RESPONSE),
    });

    await BluebubblesPlugin.testConnection(VALID_TOKEN);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/v1/server/info');
    expect(url).toContain('password=secret123');
  });

  it('strips trailing slash from serverUrl before building URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SERVER_INFO_RESPONSE),
    });

    const token = JSON.stringify({
      serverUrl: 'https://bb.example.com:1234/',
      password: 'secret123',
    });
    await BluebubblesPlugin.testConnection(token);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toMatch(/^https:\/\/bb\.example\.com:1234\/api/);
  });

  it('falls back to data.name when server_address is absent', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ status: 200, data: { name: 'My BB Server' } }),
    });

    const result = await BluebubblesPlugin.testConnection(VALID_TOKEN);
    expect(result).toEqual({ success: true, botUsername: 'My BB Server' });
  });
});

describe('BluebubblesPlugin.testConnection - credential errors', () => {
  it('returns failure for non-JSON token', async () => {
    const result = await BluebubblesPlugin.testConnection('not-json');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/json/i);
  });

  it('returns failure when serverUrl is missing', async () => {
    const result = await BluebubblesPlugin.testConnection(
      JSON.stringify({ password: 'secret' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/server url/i);
  });

  it('returns failure when password is missing', async () => {
    const result = await BluebubblesPlugin.testConnection(
      JSON.stringify({ serverUrl: 'https://bb.example.com:1234' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/password/i);
  });

  it('returns failure when server responds 401', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    const result = await BluebubblesPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/password/i);
  });

  it('returns failure when server responds 403', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    const result = await BluebubblesPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/password/i);
  });

  it('returns failure when server responds non-auth error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    const result = await BluebubblesPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/503/);
  });
});

describe('BluebubblesPlugin.testConnection - network failure', () => {
  it('returns failure on fetch throwing ECONNREFUSED', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await BluebubblesPlugin.testConnection(VALID_TOKEN);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });
});
