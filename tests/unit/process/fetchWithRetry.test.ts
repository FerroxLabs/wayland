/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Behavior contract for `fetchWithRetry` - the shared provider-HTTP retry
 * wrapper. Fake timers drive the backoff delays so the suite stays instant.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from '../../../src/process/utils/fetchWithRetry';

const url = 'https://api.example.test/v1/models';
const init = { method: 'GET' as const };

/** Build a stub fetch that returns/throws each queued outcome in order. */
function stubFetch(outcomes: Array<Response | Error>): ReturnType<typeof vi.fn> {
  let i = 0;
  const fn = vi.fn(async () => {
    const outcome = outcomes[Math.min(i, outcomes.length - 1)];
    i += 1;
    if (outcome instanceof Error) throw outcome;
    return outcome;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Run the call to completion, flushing the fake backoff timers. */
async function run(promise: Promise<Response>): Promise<Response> {
  await vi.runAllTimersAsync();
  return promise;
}

function errnoError(code: string): Error {
  return Object.assign(new Error(`network ${code}`), { code });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchWithRetry', () => {
  it('returns a 200 on the first try without retrying', async () => {
    const fetchFn = stubFetch([new Response('ok', { status: 200 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000 }));
    expect(res.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retries a 503 and returns the eventual 200', async () => {
    const fetchFn = stubFetch([new Response('busy', { status: 503 }), new Response('ok', { status: 200 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000 }));
    expect(res.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('returns a non-retryable 401 without retrying', async () => {
    const fetchFn = stubFetch([new Response('nope', { status: 401 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000 }));
    expect(res.status).toBe(401);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retries a 404 for OpenAI-family providers', async () => {
    const fetchFn = stubFetch([new Response('not found', { status: 404 }), new Response('ok', { status: 200 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000, providerId: 'openai' }));
    expect(res.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry a 404 when no provider id gates it', async () => {
    const fetchFn = stubFetch([new Response('not found', { status: 404 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000 }));
    expect(res.status).toBe(404);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('retries a transient network error then succeeds', async () => {
    const fetchFn = stubFetch([errnoError('ECONNRESET'), new Response('ok', { status: 200 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000 }));
    expect(res.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('exhausts retries on a persistent 503 and returns the last response', async () => {
    const fetchFn = stubFetch([new Response('busy', { status: 503 })]);
    const res = await run(fetchWithRetry(url, init, { timeoutMs: 5_000, attempts: 2 }));
    expect(res.status).toBe(503);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not retry, or even call fetch, when the caller signal is already aborted', async () => {
    const fetchFn = stubFetch([new Response('ok', { status: 200 })]);
    const controller = new AbortController();
    controller.abort();
    // Rejects synchronously (no backoff timers to flush), so await it directly.
    await expect(
      fetchWithRetry(url, { ...init, signal: controller.signal }, { timeoutMs: 5_000, signal: controller.signal })
    ).rejects.toBeDefined();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
