/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@process/webserver/middleware/csrfClient', () => ({
  getCsrfToken: () => 'test-csrf-token',
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { generateKnowledgeDraftHttp } = await import('@/renderer/services/ProjectDraftService');

describe('generateKnowledgeDraftHttp (#682)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces the configWriteGuards `msg` as detail on a 403', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () =>
        Promise.resolve({
          success: false,
          msg: 'HTTPS required: secret writes from the public internet must use a secure connection (HTTPS / Tailscale).',
        }),
    });

    const result = await generateKnowledgeDraftHttp({ kind: 'context' });

    expect(result.error).toBe('failed');
    expect(result.detail).toContain('HTTPS required');
  });

  it('surfaces the errorHandler `error` (e.g. CSRF) as detail', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ success: false, error: 'Invalid or missing CSRF token', code: 'csrf_invalid' }),
    });

    const result = await generateKnowledgeDraftHttp({ kind: 'context' });

    expect(result.error).toBe('failed');
    expect(result.detail).toBe('Invalid or missing CSRF token');
  });

  it('passes through the structured provider-failure detail unchanged', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ success: true, data: { draft: '', error: 'failed', detail: '401: invalid api key' } }),
    });

    const result = await generateKnowledgeDraftHttp({ kind: 'context' });

    expect(result).toEqual({ draft: '', error: 'failed', detail: '401: invalid api key' });
  });

  it('returns the draft unchanged on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { draft: '# Hello' } }),
    });

    const result = await generateKnowledgeDraftHttp({ kind: 'context' });

    expect(result).toEqual({ draft: '# Hello' });
  });
});
