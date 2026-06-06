/*
 * Portions adapted from OpenClaw <https://github.com/openclaw/openclaw>@aee2681a
 * Source: src/infra/retry-policy.ts (with retry-engine primitives from src/infra/retry.ts inlined,
 * since OpenClaw's retry.ts is not part of Wayland's Wave 1 channel-infra lift surface).
 * MIT License - Copyright (c) 2025 Peter Steinberger
 * Used per MIT permission grant; Wayland additions remain under Apache-2.0.
 */
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatErrorMessage } from './channel-errors';
import { mainWarn } from './mainLogger';

// Uses globalThis.setTimeout so vi.useFakeTimers() can intercept (node:timers/promises bypasses fake timers).
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ─── retry-engine primitives (inlined from OpenClaw src/infra/retry.ts) ──────

export type RetryConfig = {
  attempts?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
};

export type RetryInfo = {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  err: unknown;
  label?: string;
};

export type RetryOptions = RetryConfig & {
  label?: string;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  retryAfterMs?: (err: unknown) => number | undefined;
  onRetry?: (info: RetryInfo) => void;
};

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  attempts: 3,
  minDelayMs: 300,
  maxDelayMs: 30_000,
  jitter: 0,
};

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') {
    return undefined;
  }
  return Number.isFinite(value) ? value : undefined;
}

function clampNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const next = asFiniteNumber(value);
  if (next === undefined) {
    return fallback;
  }
  const floor = typeof min === 'number' ? min : Number.NEGATIVE_INFINITY;
  const ceiling = typeof max === 'number' ? max : Number.POSITIVE_INFINITY;
  return Math.min(Math.max(next, floor), ceiling);
}

export function resolveRetryConfig(
  defaults: Required<RetryConfig> = DEFAULT_RETRY_CONFIG,
  overrides?: RetryConfig,
): Required<RetryConfig> {
  const attempts = Math.max(1, Math.round(clampNumber(overrides?.attempts, defaults.attempts, 1)));
  const minDelayMs = Math.max(
    0,
    Math.round(clampNumber(overrides?.minDelayMs, defaults.minDelayMs, 0)),
  );
  const maxDelayMs = Math.max(
    minDelayMs,
    Math.round(clampNumber(overrides?.maxDelayMs, defaults.maxDelayMs, 0)),
  );
  const jitter = clampNumber(overrides?.jitter, defaults.jitter, 0, 1);
  return { attempts, minDelayMs, maxDelayMs, jitter };
}

function applyJitter(delayMs: number, jitter: number): number {
  if (jitter <= 0) {
    return delayMs;
  }
  const offset = (Math.random() * 2 - 1) * jitter;
  return Math.max(0, Math.round(delayMs * (1 + offset)));
}

export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const resolved = resolveRetryConfig(DEFAULT_RETRY_CONFIG, options);
  const maxAttempts = resolved.attempts;
  const minDelayMs = resolved.minDelayMs;
  const maxDelayMs =
    Number.isFinite(resolved.maxDelayMs) && resolved.maxDelayMs > 0
      ? resolved.maxDelayMs
      : Number.POSITIVE_INFINITY;
  const jitter = resolved.jitter;
  const shouldRetry = options.shouldRetry ?? (() => true);
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts || !shouldRetry(err, attempt)) {
        break;
      }

      const retryAfterMs = options.retryAfterMs?.(err);
      const hasRetryAfter = typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs);
      const baseDelay = hasRetryAfter
        ? Math.max(retryAfterMs, minDelayMs)
        : minDelayMs * 2 ** (attempt - 1);
      let computed = Math.min(baseDelay, maxDelayMs);
      computed = applyJitter(computed, jitter);
      computed = Math.min(Math.max(computed, minDelayMs), maxDelayMs);

      options.onRetry?.({
        attempt,
        maxAttempts,
        delayMs: computed,
        err,
        label: options.label,
      });
      if (computed > 0) {
        await delay(computed);
      }
    }
  }

  throw lastErr ?? new Error('Retry failed');
}

// ─── channel-API retry policy ────────────────────────────────────────────────

export type RetryRunner = <T>(fn: () => Promise<T>, label?: string) => Promise<T>;

export const CHANNEL_API_RETRY_DEFAULTS: Required<RetryConfig> = {
  attempts: 3,
  minDelayMs: 400,
  maxDelayMs: 30_000,
  jitter: 0.1,
};

const CHANNEL_API_RETRY_RE = /429|timeout|connect|reset|closed|unavailable|temporarily/i;
const LOG_TAG = '[retry-policy]';

function resolveChannelApiShouldRetry(params: {
  shouldRetry?: (err: unknown) => boolean;
  strictShouldRetry?: boolean;
}): (err: unknown) => boolean {
  if (!params.shouldRetry) {
    return (err: unknown) => CHANNEL_API_RETRY_RE.test(formatErrorMessage(err));
  }
  if (params.strictShouldRetry) {
    return params.shouldRetry;
  }
  return (err: unknown) =>
    params.shouldRetry?.(err) === true ||
    CHANNEL_API_RETRY_RE.test(formatErrorMessage(err));
}

function getChannelApiRetryAfterMs(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') {
    return undefined;
  }
  const candidate =
    'parameters' in err && err.parameters && typeof err.parameters === 'object'
      ? (err.parameters as { retry_after?: unknown }).retry_after
      : 'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'parameters' in err.response
        ? (
            err.response as {
              parameters?: { retry_after?: unknown };
            }
          ).parameters?.retry_after
        : 'error' in err && err.error && typeof err.error === 'object' && 'parameters' in err.error
          ? (err.error as { parameters?: { retry_after?: unknown } }).parameters?.retry_after
          : undefined;
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate * 1000 : undefined;
}

export function createRateLimitRetryRunner(params: {
  retry?: RetryConfig;
  configRetry?: RetryConfig;
  verbose?: boolean;
  defaults: Required<RetryConfig>;
  logLabel: string;
  shouldRetry: (err: unknown) => boolean;
  retryAfterMs?: (err: unknown) => number | undefined;
}): RetryRunner {
  const retryConfig = resolveRetryConfig(params.defaults, {
    ...params.configRetry,
    ...params.retry,
  });
  return <T>(fn: () => Promise<T>, label?: string) =>
    retryAsync(fn, {
      ...retryConfig,
      label,
      shouldRetry: params.shouldRetry,
      retryAfterMs: params.retryAfterMs,
      onRetry: params.verbose
        ? (info: RetryInfo) => {
            const labelText = info.label ?? 'request';
            const maxRetries = Math.max(1, info.maxAttempts - 1);
            mainWarn(
              LOG_TAG,
              `${params.logLabel} ${labelText} rate limited, retry ${info.attempt}/${maxRetries} in ${info.delayMs}ms`,
            );
          }
        : undefined,
    });
}

export function createChannelApiRetryRunner(params: {
  retry?: RetryConfig;
  configRetry?: RetryConfig;
  verbose?: boolean;
  shouldRetry?: (err: unknown) => boolean;
  /**
   * When true, the custom shouldRetry predicate is used exclusively -
   * the default channel API fallback regex is NOT OR'd in.
   * Use this for non-idempotent operations (e.g. sendMessage) where
   * the regex fallback would cause duplicate message delivery.
   */
  strictShouldRetry?: boolean;
}): RetryRunner {
  const retryConfig = resolveRetryConfig(CHANNEL_API_RETRY_DEFAULTS, {
    ...params.configRetry,
    ...params.retry,
  });
  const shouldRetry = resolveChannelApiShouldRetry(params);

  return <T>(fn: () => Promise<T>, label?: string) =>
    retryAsync(fn, {
      ...retryConfig,
      label,
      shouldRetry,
      retryAfterMs: getChannelApiRetryAfterMs,
      onRetry: params.verbose
        ? (info: RetryInfo) => {
            const maxRetries = Math.max(1, info.maxAttempts - 1);
            mainWarn(
              LOG_TAG,
              `channel send retry ${info.attempt}/${maxRetries} for ${info.label ?? label ?? 'request'} in ${info.delayMs}ms: ${formatErrorMessage(info.err)}`,
            );
          }
        : undefined,
    });
}
