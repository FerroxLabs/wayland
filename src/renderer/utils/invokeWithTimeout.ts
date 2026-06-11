/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Race a bridge `.invoke()` against a timeout so a read never hangs forever.
 *
 * On the web/WS bridge (phone / headless server) `.invoke()` only resolves when
 * the round-trip frame returns; if it never does, a loading card spins forever.
 * This resolves to `fallback` after `ms` so the caller's `finally` can clear the
 * spinner and render an empty state.
 */
export function invokeWithTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}
