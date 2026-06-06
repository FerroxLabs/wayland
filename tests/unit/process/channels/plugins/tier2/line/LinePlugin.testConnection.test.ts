/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinePlugin } from '@process/channels/plugins/tier2/line/LinePlugin';

describe('LinePlugin.testConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validCreds = JSON.stringify({
    channelAccessToken: 'tok-valid',
    channelSecret: 'sec-valid',
  });

  it('returns success and botUsername on a valid /v2/bot/info response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ displayName: 'MyLINEBot', userId: 'U000' }),
    } as Response);

    const result = await LinePlugin.testConnection(validCreds);
    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('MyLINEBot');
    expect(result.error).toBeUndefined();
  });

  it('returns failure when the LINE API returns a non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    const result = await LinePlugin.testConnection(validCreds);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/401/);
  });

  it('returns failure when displayName is missing from response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const result = await LinePlugin.testConnection(validCreds);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/empty bot info/i);
  });

  it('returns failure when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network unreachable'));

    const result = await LinePlugin.testConnection(validCreds);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network unreachable');
  });

  it('returns failure for invalid JSON credentials', async () => {
    const result = await LinePlugin.testConnection('not-json{{{');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid json/i);
  });

  it('returns failure when channelAccessToken is missing', async () => {
    const result = await LinePlugin.testConnection(
      JSON.stringify({ channelSecret: 'sec' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/channelAccessToken/i);
  });

  it('returns failure when channelSecret is missing', async () => {
    const result = await LinePlugin.testConnection(
      JSON.stringify({ channelAccessToken: 'tok' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/channelSecret/i);
  });
});
