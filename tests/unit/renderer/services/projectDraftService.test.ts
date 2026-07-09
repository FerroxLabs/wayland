/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression for #682: draft-generation failures must surface as DISTINCT,
 * actionable error classes, not collapse into one generic 'failed'. In the
 * headless WebUI flow, an auth/CSRF 403, an unreachable backend, a hung
 * connection, and a provider error all looked identical to the user (and one
 * of them was an infinite "Drafting…" spinner).
 *
 * Contract under test (generateKnowledgeDraftHttp):
 *  - 401/403 (token auth or tiny-csrf rejection)  → error 'auth' + server cause
 *  - fetch transport failure (backend unreachable) → error 'bridge' + cause
 *  - client-side deadline (AbortSignal.timeout)    → error 'timeout' (no hang)
 *  - backend/provider failure                      → error 'failed' + detail
 *  - route success payloads (draft / no-model / failed+detail) pass through
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// getCsrfToken reads document.cookie; stub it so the service is env-independent.
vi.mock('@process/webserver/middleware/csrfClient', () => ({
  getCsrfToken: () => 'test-csrf-token',
}));

import { generateKnowledgeDraftHttp } from '@renderer/services/ProjectDraftService';

const mockFetch = vi.fn();

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const params = { kind: 'context' as const, description: 'a thing' };

describe('generateKnowledgeDraftHttp failure classes (#682)', () => {
  it('returns the draft untouched on success', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { success: true, data: { draft: '# Draft' } }));

    await expect(generateKnowledgeDraftHttp(params)).resolves.toEqual({ draft: '# Draft' });
  });

  it('classifies a tiny-csrf 403 as an auth failure with the server cause', async () => {
    // Body shape the global errorHandler emits for a tiny-csrf rejection.
    mockFetch.mockResolvedValue(
      jsonResponse(403, { success: false, error: 'Invalid or missing CSRF token', code: 'csrf_invalid' })
    );

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'auth', detail: 'Invalid or missing CSRF token' });
  });

  it('classifies a token-auth 401 as an auth failure', async () => {
    mockFetch.mockResolvedValue(jsonResponse(401, { success: false, msg: 'Invalid or expired token' }));

    const res = await generateKnowledgeDraftHttp(params);

    expect(res.error).toBe('auth');
    expect(res.detail).toBe('Invalid or expired token');
  });

  it('falls back to the HTTP status when an auth rejection has an empty body', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 403 }));

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'auth', detail: 'HTTP 403' });
  });

  it('classifies an unreachable backend (fetch transport failure) as a bridge failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'bridge', detail: 'Failed to fetch' });
  });

  it('classifies a client-side deadline as a timeout, never an opaque failure', async () => {
    // What AbortSignal.timeout() raises when the connection hangs — previously
    // this path had no deadline at all (infinite "Drafting…" spinner).
    mockFetch.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'timeout' });
  });

  it('passes a client-side deadline to fetch so a hung connection cannot spin forever', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { success: true, data: { draft: 'x' } }));

    await generateKnowledgeDraftHttp(params);

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('classifies a backend 500 as a provider/backend failure with the server cause', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { success: false, error: 'Internal server error', code: 'internal_error' })
    );

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'failed', detail: 'Internal server error' });
  });

  it('passes through a provider failure with its detail (#221 parity)', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, { success: true, data: { draft: '', error: 'failed', detail: '401: invalid api key' } })
    );

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'failed', detail: '401: invalid api key' });
  });

  it('passes through a no-model result untouched', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { success: true, data: { draft: '', error: 'no-model' } }));

    const res = await generateKnowledgeDraftHttp(params);

    expect(res).toEqual({ draft: '', error: 'no-model' });
  });
});
