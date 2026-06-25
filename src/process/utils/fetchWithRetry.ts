/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A `fetch` with a per-attempt timeout and bounded backoff retry for the
 * transient failures that plague provider HTTP calls: dropped sockets, DNS
 * blips, request timeouts, and the 429 / 5xx "try again" family. Built on the
 * shared {@link computeBackoff} policy so the backoff curve matches the rest of
 * the app.
 *
 * It returns the `Response` untouched for the caller to classify - it only
 * retries the failures worth retrying, and a still-failing retryable status is
 * handed back as-is (not thrown) so the caller's own error mapping is preserved.
 */
import { type BackoffPolicy, computeBackoff } from './backoff';

/** Node/undici error codes that mark a transient, retry-worthy network fault. */
const RETRYABLE_ERRNO = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

/** HTTP statuses that are transient and safe to retry on an idempotent GET. */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Backoff between attempts: 400ms, ~800ms, ~1.6s … capped at 8s, 50% jitter. */
const BACKOFF: BackoffPolicy = { initialMs: 400, maxMs: 8_000, factor: 2, jitter: 0.5 };

/** Pull a Node-style errno off an error or its `cause` (undici nests it). */
function errorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof e.code === 'string') return e.code;
  if (e.cause && typeof e.cause === 'object' && typeof (e.cause as { code?: unknown }).code === 'string') {
    return (e.cause as { code: string }).code;
  }
  return undefined;
}

function isAbortError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { name?: unknown }).name === 'AbortError';
}

/** Whether a thrown fetch error is worth retrying (transient, not a hard bug). */
function isRetryableError(err: unknown): boolean {
  // Our own per-attempt timeout surfaces as an AbortError - retry it.
  if (isAbortError(err)) return true;
  const code = errorCode(err);
  // Known transient errno retries; an unclassifiable network throw is treated
  // as transient too (bounded by the attempt count).
  return code ? RETRYABLE_ERRNO.has(code) : true;
}

/**
 * Whether a non-ok status should be retried. The 429/5xx family always; a 404
 * only for OpenAI-family providers, which "sometimes return 404 for models that
 * are actually available" (the same quirk OpenCode special-cases). Gate the 404
 * retry to model-LIST fetches by only passing `providerId` on those call sites -
 * an inference probe's 404 means a stale model and must fall through immediately.
 */
function isRetryableStatus(status: number, providerId?: string): boolean {
  if (RETRYABLE_STATUS.has(status)) return true;
  if (status === 404 && providerId?.startsWith('openai')) return true;
  return false;
}

/** A `setTimeout`-based sleep (so `vi.useFakeTimers()` can drive tests). */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error('aborted'));
      },
      { once: true }
    );
  });
}

export type FetchRetryOptions = {
  /** Per-attempt timeout in ms (each retry gets a fresh budget). */
  timeoutMs: number;
  /** Total attempts including the first (default 3). */
  attempts?: number;
  /** Provider id; presence enables the OpenAI-family 404 retry. */
  providerId?: string;
  /** Caller-owned abort signal - an abort here is final and never retried. */
  signal?: AbortSignal;
};

/**
 * `fetch` with a per-attempt timeout and bounded retry. Resolves with the
 * `Response` (ok, or a non-retryable / retry-exhausted failure for the caller to
 * classify); rejects only on a network failure that survived every retry or on a
 * caller abort.
 */
export async function fetchWithRetry(url: string, init: RequestInit, opts: FetchRetryOptions): Promise<Response> {
  const { timeoutMs, attempts = 3, providerId, signal } = opts;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) throw signal.reason ?? new Error('aborted');

    const controller = new AbortController();
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

    let res: Response;
    try {
      // Sequential by design - each attempt waits on the previous one's outcome.
      // oxlint-disable-next-line no-await-in-loop
      res = await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      lastError = err;
      // A caller abort is final - never retry it.
      if (signal?.aborted) throw err;
      if (attempt < attempts && isRetryableError(err)) {
        // oxlint-disable-next-line no-await-in-loop
        await sleep(computeBackoff(BACKOFF, attempt), signal);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }

    // Success, a non-retryable status, or the last attempt: hand the response
    // back so the caller classifies it exactly as it would without retries.
    if (res.ok || !isRetryableStatus(res.status, providerId) || attempt >= attempts) {
      return res;
    }
    // oxlint-disable-next-line no-await-in-loop
    await sleep(computeBackoff(BACKOFF, attempt), signal);
  }

  // Unreachable: the loop always returns or throws on the final attempt.
  throw lastError ?? new Error('fetchWithRetry exhausted with no result');
}
