/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleChatPlugin } from '@process/channels/plugins/tier3/google-chat/GoogleChatPlugin';

const { mockGetClient, mockGetAccessToken } = vi.hoisted(() => ({
  mockGetClient: vi.fn(),
  mockGetAccessToken: vi.fn(),
}));

vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn(function () {
    return { getClient: mockGetClient };
  }),
}));

const VALID_SA_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'my-project',
  client_email: 'bot@my-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----\n',
});

const validTokenJson = JSON.stringify({
  serviceAccountJson: VALID_SA_JSON,
  projectId: '123456789012',
});

describe('GoogleChatPlugin.testConnection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockGetClient.mockResolvedValue({ getAccessToken: mockGetAccessToken });
    mockGetAccessToken.mockResolvedValue({ token: 'fake-access-token' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success with botUsername on valid credentials and 200 spaces response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ spaces: [{ name: 'spaces/ABC', displayName: 'General' }] }),
    } as Response);

    const result = await GoogleChatPlugin.testConnection(validTokenJson);
    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('bot@my-project.iam.gserviceaccount.com');
    expect(result.error).toBeUndefined();
  });

  it('returns success even when spaces list is empty (valid creds, no spaces yet)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ spaces: [] }),
    } as Response);

    const result = await GoogleChatPlugin.testConnection(validTokenJson);
    expect(result.success).toBe(true);
    expect(result.botUsername).toBe('bot@my-project.iam.gserviceaccount.com');
  });

  it('returns failure when Google Chat API returns non-OK status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Permission denied',
    } as Response);

    const result = await GoogleChatPlugin.testConnection(validTokenJson);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/403/);
  });

  it('returns failure when fetch throws a network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network unreachable'));

    const result = await GoogleChatPlugin.testConnection(validTokenJson);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network unreachable');
  });

  it('returns failure for invalid outer JSON credentials', async () => {
    const result = await GoogleChatPlugin.testConnection('not-json{{{');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid json/i);
  });

  it('returns failure when serviceAccountJson field is missing', async () => {
    const result = await GoogleChatPlugin.testConnection(
      JSON.stringify({ projectId: '123' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/serviceAccountJson is required/i);
  });

  it('returns failure when serviceAccountJson is not valid JSON', async () => {
    const result = await GoogleChatPlugin.testConnection(
      JSON.stringify({ serviceAccountJson: '{bad}', projectId: '123' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not valid JSON/i);
  });

  it('returns failure when serviceAccountJson is missing private_key', async () => {
    const sa = JSON.stringify({ type: 'service_account', client_email: 'bot@x.com' });
    const result = await GoogleChatPlugin.testConnection(
      JSON.stringify({ serviceAccountJson: sa, projectId: '123' }),
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/private_key.*client_email/i);
  });

  it('returns failure when getAccessToken returns null', async () => {
    mockGetAccessToken.mockResolvedValueOnce({ token: null });
    const result = await GoogleChatPlugin.testConnection(validTokenJson);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/access token/i);
  });
});
