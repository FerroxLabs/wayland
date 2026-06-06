/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * v0.4.7.1 (G-M-2) - minimal publish/subscribe for cron-service readiness.
 *
 * `initBridge.ts` calls `setCronReadyPromise(...)` with the promise from
 * `cronService.init()`. The Kickoff bridge (and any other consumer that
 * needs a populated cron store on first read) calls `waitForCronReady`
 * with a bounded timeout. The default unset promise never resolves on
 * its own, so consumers MUST pair `waitForCronReady` with a timeout -
 * cron readiness is a soft signal, not a hard precondition.
 */

let cronReadyPromise: Promise<void> | undefined;

export function setCronReadyPromise(p: Promise<void>): void {
  cronReadyPromise = p;
}

export function getCronReadyPromise(): Promise<void> | undefined {
  return cronReadyPromise;
}

/**
 * Await cron service init with a bounded timeout. Returns `'ready'` if
 * init resolved before the deadline, `'timeout'` if not, `'unset'` if
 * `setCronReadyPromise` was never called (e.g. test harness).
 */
export async function waitForCronReady(
  timeoutMs: number
): Promise<'ready' | 'timeout' | 'unset'> {
  const p = cronReadyPromise;
  if (!p) return 'unset';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs);
  });
  try {
    const result = await Promise.race([p.then(() => 'ready' as const), timeout]);
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Test-only: drop the published promise so a fresh init runs. */
export function __resetCronReadyForTests(): void {
  cronReadyPromise = undefined;
}
