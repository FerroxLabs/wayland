/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Reference source for the team-import JSON parser worker.
 *
 * NOTE: this file is the AUDIT-FRIENDLY reference copy. The actual worker
 * spawned by `safeParse.ts` uses an inlined `eval: true` Worker spawn (see
 * the `WORKER_SOURCE` constant in `safeParse.ts`) because:
 *   1. `electron-vite` does not bundle ad-hoc worker files unless they are
 *      listed as a separate `rollupOptions.input` entry.
 *   2. `vitest` does not TypeScript-transpile a path passed to
 *      `new Worker(new URL(...))` so a `.ts` URL would 500 at test time.
 * The inlined source must stay byte-equivalent to the body below; reviewers
 * cross-check both during W4 audit.
 */

import { parentPort } from 'node:worker_threads';

if (!parentPort) {
  throw new Error('safeParse worker must run as a Worker Thread');
}

const port = parentPort;
port.on('message', (text: string) => {
  try {
    const value = JSON.parse(text);
    port.postMessage({ __ok: true, value });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    port.postMessage({ __parseError: message });
  }
});
