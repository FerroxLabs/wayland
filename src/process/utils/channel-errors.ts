/*
 * Portions adapted from OpenClaw <https://github.com/openclaw/openclaw>@aee2681a
 * Source: src/infra/errors.ts (channel-relevant subset only)
 * MIT License - Copyright (c) 2025 Peter Steinberger
 * Used per MIT permission grant; Wayland additions remain under Apache-2.0.
 */
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Channel-error classification.
 *
 * Channel plugins (Slack, Discord, Telegram, ...) all map provider failures
 * onto the same retry policy. This module groups the upstream helpers needed
 * to drive that policy (`detectErrorKind`, cause-chain walking, errno checks)
 * plus the channel-only additions: transient/permanent classification,
 * Retry-After parsing, and an `HttpStatusError` wrapper.
 *
 * Not included from upstream `errors.ts`: name reading, breadth-first error
 * graph walking, uncaught-error stack formatting, and redaction - those are
 * for crash logging / gateway auth surfaces, not per-message channel retry.
 */

// =============================================================================
// Lifted subset (OpenClaw aee2681a - src/infra/errors.ts)
// =============================================================================

export type ErrorKind = 'refusal' | 'timeout' | 'rate_limit' | 'context_length' | 'unknown';

export function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') {
    return undefined;
  }
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string') {
    return code;
  }
  if (typeof code === 'number') {
    return String(code);
  }
  return undefined;
}

/** Type guard for NodeJS.ErrnoException (any error with a `code` property). */
export function isErrno(err: unknown): err is NodeJS.ErrnoException {
  return Boolean(err && typeof err === 'object' && 'code' in err);
}

/** Check if an error has a specific errno code. */
export function hasErrnoCode(err: unknown, code: string): boolean {
  return isErrno(err) && err.code === code;
}

/**
 * Format an error to a single string, walking the `.cause` chain so wrapped
 * network errors (e.g. grammY HttpError wrapping ECONNRESET) are visible.
 * Cycle-safe.
 */
export function formatErrorMessage(err: unknown): string {
  let formatted: string;
  if (err instanceof Error) {
    formatted = err.message || err.name || 'Error';
    let cause: unknown = err.cause;
    const seen = new Set<unknown>([err]);
    while (cause && !seen.has(cause)) {
      seen.add(cause);
      if (cause instanceof Error) {
        if (cause.message) {
          formatted += ` | ${cause.message}`;
        }
        cause = cause.cause;
      } else if (typeof cause === 'string') {
        formatted += ` | ${cause}`;
        break;
      } else {
        break;
      }
    }
  } else if (typeof err === 'string') {
    formatted = err;
  } else if (typeof err === 'number' || typeof err === 'boolean' || typeof err === 'bigint') {
    formatted = String(err);
  } else {
    try {
      formatted = JSON.stringify(err);
    } catch {
      formatted = Object.prototype.toString.call(err);
    }
  }
  return formatted;
}

/**
 * Classify a channel/provider error into a coarse kind. `undefined` means
 * "no signal - caller should treat as unknown/permanent".
 */
export function detectErrorKind(err: unknown): ErrorKind | undefined {
  if (err === undefined) {
    return undefined;
  }
  const message = formatErrorMessage(err).toLowerCase();
  const code = extractErrorCode(err)?.toLowerCase();

  if (
    message.includes('refusal') ||
    message.includes('content_filter') ||
    message.includes('sensitive') ||
    message.includes('unhandled stop reason: refusal_policy')
  ) {
    return 'refusal';
  }
  if (message.includes('timeout') || code === 'etimedout' || code === 'timeout') {
    return 'timeout';
  }
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    code === '429'
  ) {
    return 'rate_limit';
  }
  if (
    message.includes('context length') ||
    message.includes('too many tokens') ||
    message.includes('token limit') ||
    message.includes('context_window')
  ) {
    return 'context_length';
  }
  return undefined;
}

// =============================================================================
// Wayland additions - transient classification + HTTP wrappers
// =============================================================================

/** Transient errno codes that channel transports should retry on. */
const TRANSIENT_ERRNO_CODES = new Set<string>([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENETUNREACH',
  'ENETDOWN',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'EPIPE',
  'ECONNABORTED',
]);

/** HTTP status codes that are safe to retry. */
const TRANSIENT_HTTP_STATUSES = new Set<number>([408, 425, 429, 500, 502, 503, 504]);

/**
 * Error wrapper carrying HTTP status and optional Retry-After hint (seconds).
 * Channel plugins should throw this when an SDK call surfaces an HTTP response
 * so the retry loop can read `status` + `retryAfterSeconds` directly.
 */
export class HttpStatusError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    status: number,
    message: string,
    options?: { retryAfterSeconds?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'HttpStatusError';
    this.status = status;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

/**
 * Parse a Retry-After header value. Accepts seconds (`"30"`) or HTTP-date
 * (`"Wed, 21 Oct 2026 07:28:00 GMT"`). Returns seconds, floored at 0, or
 * `undefined` for unparseable input.
 */
export function parseRetryAfter(header: string | null | undefined, now = Date.now()): number | undefined {
  if (header == null) {
    return undefined;
  }
  const trimmed = header.trim();
  if (trimmed === '') {
    return undefined;
  }

  // Pure-digit seconds form.
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, Number.parseInt(trimmed, 10));
  }

  // HTTP-date form.
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return Math.max(0, Math.round((parsed - now) / 1000));
}

/**
 * Classify an error as transient (worth retrying) vs permanent.
 *
 * Transient signals (any one is sufficient):
 *   - `HttpStatusError` with a retryable status (408, 425, 429, 5xx subset)
 *   - errno in {ECONNRESET, ETIMEDOUT, ...}
 *   - `detectErrorKind` returns `timeout` or `rate_limit`
 *
 * Anything else (including refusal, context_length, and unknown) is permanent.
 */
export function isTransient(err: unknown): boolean {
  if (err instanceof HttpStatusError) {
    return TRANSIENT_HTTP_STATUSES.has(err.status);
  }
  if (isErrno(err) && typeof err.code === 'string' && TRANSIENT_ERRNO_CODES.has(err.code)) {
    return true;
  }
  const kind = detectErrorKind(err);
  return kind === 'timeout' || kind === 'rate_limit';
}

/**
 * Best-effort extraction of a retry-after hint from any error.
 * Returns seconds to wait, or `undefined` if the error carries no hint.
 */
export function retryAfterFromError(err: unknown, now = Date.now()): number | undefined {
  if (err instanceof HttpStatusError && err.retryAfterSeconds !== undefined) {
    return err.retryAfterSeconds;
  }
  if (err && typeof err === 'object') {
    const headers = (err as { headers?: unknown }).headers;
    if (headers && typeof headers === 'object') {
      const raw =
        (headers as Record<string, unknown>)['retry-after'] ??
        (headers as Record<string, unknown>)['Retry-After'];
      if (typeof raw === 'string' || typeof raw === 'number') {
        return parseRetryAfter(String(raw), now);
      }
    }
  }
  return undefined;
}
