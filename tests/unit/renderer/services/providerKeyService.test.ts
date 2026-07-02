/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

// getCsrfToken reads document.cookie; stub it so the service is env-independent.
vi.mock('@process/webserver/middleware/csrfClient', () => ({
  getCsrfToken: () => 'test-csrf-token',
}));

import { classifyConnectFailure, connectProviderHttp } from '@renderer/services/ProviderKeyService';
import { reloadWithinTimeout } from '@renderer/pages/settings/ModelsSettings/reloadWithinTimeout';

describe('classifyConnectFailure (#524 error mapping)', () => {
  it('maps a tiny-csrf rejection to csrf-invalid via its machine code', () => {
    // 403 body the global errorHandler emits for a tiny-csrf throw.
    expect(classifyConnectFailure({ error: 'Invalid or missing CSRF token', code: 'csrf_invalid' })).toEqual({
      error: 'csrf-invalid',
    });
  });

  it('maps the HTTPS config-write floor (msg only) to https-required', () => {
    expect(
      classifyConnectFailure({
        msg: 'HTTPS required: secret writes from the public internet must use a secure connection (HTTPS / Tailscale).',
      })
    ).toEqual({ error: 'https-required' });
  });

  it('maps the token-auth denial sentence to auth-required', () => {
    expect(classifyConnectFailure({ error: 'Access denied. Please login first.' })).toEqual({
      error: 'auth-required',
    });
  });

  it('passes through a genuine host-side ConnectError enum code', () => {
    expect(classifyConnectFailure({ error: 'unauthorized' })).toEqual({ error: 'unauthorized' });
    expect(classifyConnectFailure({ error: 'no-credit' })).toEqual({ error: 'no-credit' });
  });

  it('never collapses silently: surfaces the server message for an unmapped body', () => {
    const result = classifyConnectFailure({ msg: 'providerId is required' });
    expect(result.error).toBe('unknown');
    expect(result.errorMessage).toBe('providerId is required');
  });

  it('scrubs secret-looking substrings out of the surfaced fallback text', () => {
    const result = classifyConnectFailure({ msg: 'rejected key sk-live-ABCDEFGH12345678 by upstream' });
    expect(result.error).toBe('unknown');
    expect(result.errorMessage).not.toContain('sk-live-ABCDEFGH12345678');
    expect(result.errorMessage).toContain('[redacted]');
  });

  it('yields a bare unknown (no message) when the server said nothing', () => {
    expect(classifyConnectFailure({})).toEqual({ error: 'unknown', errorMessage: undefined });
  });
});

describe('connectProviderHttp (#524 transport robustness)', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('classifies a 403 csrf response body end-to-end', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'Invalid or missing CSRF token', code: 'csrf_invalid' }),
    }) as unknown as typeof fetch;

    await expect(connectProviderHttp('flux-router', 'sk-flux-xxx')).resolves.toEqual({
      ok: false,
      error: 'csrf-invalid',
    });
  });

  it('classifies a 403 HTTPS-floor response body end-to-end', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ success: false, msg: 'HTTPS required: secret writes ...' }),
    }) as unknown as typeof fetch;

    await expect(connectProviderHttp('flux-router', 'sk-flux-xxx')).resolves.toEqual({
      ok: false,
      error: 'https-required',
    });
  });

  it('returns offline (never hangs) when the request aborts / the network fails', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          // Simulate an aborted fetch (AbortController fires DOMException).
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        })
    ) as unknown as typeof fetch;

    await expect(connectProviderHttp('flux-router', 'sk-flux-xxx')).resolves.toEqual({
      ok: false,
      error: 'offline',
    });
  });

  it('resolves ok:true on a successful connect', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { state: 'connected', modelCount: 12 } }),
    }) as unknown as typeof fetch;

    await expect(connectProviderHttp('flux-router', 'sk-flux-xxx')).resolves.toEqual({ ok: true });
  });

  it('does not hang when headers arrive but the body read stalls, then times out to offline', async () => {
    vi.useFakeTimers();
    // Headers arrive (fetch resolves) but the body read never completes until
    // our own AbortController fires - the "broken proxy" case the timeout must
    // still cover (cross-audit finding, #524).
    globalThis.fetch = vi.fn().mockImplementation((_url: string, opts: { signal: AbortSignal }) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
          }),
      })
    ) as unknown as typeof fetch;

    const promise = connectProviderHttp('flux-router', 'sk-flux-xxx');
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(promise).resolves.toEqual({ ok: false, error: 'offline' });
  });
});

// A reload that never resolves - the classic stalled modelRegistry.list.invoke.
const neverResolves = (): Promise<void> => new Promise<void>(() => {});

describe('reloadWithinTimeout (#524 post-connect reload must not hang)', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves via the timeout when reload never settles', async () => {
    vi.useFakeTimers();
    let settled = false;
    const p = reloadWithinTimeout(neverResolves, 8_000).then(() => {
      settled = true;
    });

    // Before the timeout fires it is still pending...
    await Promise.resolve();
    expect(settled).toBe(false);

    // ...and after the timeout it resolves rather than hanging forever.
    await vi.advanceTimersByTimeAsync(8_000);
    await p;
    expect(settled).toBe(true);
  });

  it('resolves immediately when reload completes fast, and swallows a reload rejection', async () => {
    await expect(reloadWithinTimeout(() => Promise.resolve(), 8_000)).resolves.toBeUndefined();
    await expect(reloadWithinTimeout(() => Promise.reject(new Error('bridge down')), 8_000)).resolves.toBeUndefined();
  });
});
