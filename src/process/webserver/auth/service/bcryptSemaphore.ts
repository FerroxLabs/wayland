/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bcrypt event-loop saturation guard (AUDIT-04 F6 / M1, Option B).
 *
 * bcryptjs is a pure-JS implementation that runs on the main event loop.
 * At cost 12 a single comparison can occupy the loop for ~250-400ms, so a
 * distributed login attack from a botnet (which trivially defeats the
 * per-IP login limiter) can stall every other request handler on the
 * process.
 *
 * This module exposes a single global counter that bounds the number of
 * bcrypt operations allowed to run concurrently. When the cap is reached
 * further attempts reject immediately with BcryptBusyError; the /login
 * route maps that to HTTP 503 with a Retry-After hint so legitimate
 * traffic keeps moving while attackers see fast rejections instead of
 * unbounded queueing.
 *
 * Implementation note: pure JS bcrypt is single-threaded on the loop, so
 * "concurrent" here means "in-flight Promise count" not "parallel
 * threads". Capping in-flight count still matters because it bounds the
 * size of the pending-callback queue and keeps memory pressure flat
 * under attack.
 */

/**
 * Default maximum concurrent in-flight bcrypt operations.
 * Conservative for a single-process Electron-side webserver; bcryptjs
 * yields between rounds but the loop is still serial.
 */
const DEFAULT_MAX_CONCURRENT_BCRYPT = 5;

export class BcryptBusyError extends Error {
  public readonly code = 'BCRYPT_BUSY';
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds = 2) {
    super('Bcrypt semaphore at capacity');
    this.name = 'BcryptBusyError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

let maxConcurrent = DEFAULT_MAX_CONCURRENT_BCRYPT;
let inFlight = 0;

/**
 * Override the concurrency cap. Intended for tests; production should
 * rely on the default.
 */
export function setBcryptMaxConcurrent(value: number): void {
  if (!Number.isFinite(value) || value < 1) {
    throw new Error('bcrypt max concurrent must be a positive integer');
  }
  maxConcurrent = Math.floor(value);
}

/**
 * Current in-flight count. Exposed for diagnostics / tests.
 */
export function getBcryptInFlight(): number {
  return inFlight;
}

/**
 * Current cap. Exposed for diagnostics / tests.
 */
export function getBcryptMaxConcurrent(): number {
  return maxConcurrent;
}

/**
 * Run `task` while holding a slot on the bcrypt semaphore. If no slot is
 * available the call rejects synchronously (well, on the microtask
 * queue) with BcryptBusyError - we never queue, because queueing under
 * attack just defers the saturation. Fast-fail with 503 instead.
 */
export async function withBcryptSlot<T>(task: () => Promise<T>): Promise<T> {
  if (inFlight >= maxConcurrent) {
    throw new BcryptBusyError();
  }
  inFlight++;
  try {
    return await task();
  } finally {
    inFlight--;
  }
}
