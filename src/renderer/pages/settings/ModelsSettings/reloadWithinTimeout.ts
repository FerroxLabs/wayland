/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * After a successful headless connect the Models page `reload()`s the registry
 * list so the new provider row shows. That reload goes over the WS bridge
 * (`modelRegistry.list`), which can stall - and if the Connect button blocked on
 * it, a stalled reload would spin the button forever even though the key already
 * landed server-side (#524).
 *
 * Bound the wait: resolve as soon as the reload finishes OR `ms` elapses,
 * whichever comes first. The reload keeps running in the background and commits
 * to state on its own, so the list still refreshes when it eventually completes;
 * a reload rejection is swallowed (it must never surface as a connect failure).
 */
export function reloadWithinTimeout(reload: () => Promise<void>, ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    reload()
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        resolve();
      });
  });
}
