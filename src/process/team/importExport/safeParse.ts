/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * W4 (T4.6.1) - DOS + prototype-pollution + recursion limits for team imports.
 *
 * The threat model: a malicious or oversized .team file dropped into the
 * import picker must not (1) wedge the main thread with a pathological
 * `JSON.parse`, (2) pollute `Object.prototype` via merge-like accessors
 * downstream of Zod, or (3) survive past the byte cap.
 *
 * `AbortSignal` cannot preempt a synchronous `JSON.parse` (TRIAGE round-2 N3
 * + TEAM-BLITZ-PLAN §6 D7 #10) - only a real Worker Thread with `.terminate()`
 * can interrupt the parser. We spawn the worker with `eval: true` to dodge
 * both the runtime resolution problem (electron-vite does not bundle ad-hoc
 * worker `.ts` files) and the test-runner problem (vitest does not
 * TypeScript-transpile a path passed to `new Worker(url)`). The worker
 * source is short, audited inline, and changes are reviewed alongside the
 * caller.
 *
 * The bounded queue (max 2 concurrent workers + 5s wait timeout) guards
 * against fork-bomb amplification if an attacker triggers many imports in
 * quick succession through the file picker exploit class.
 */

import { Worker } from 'node:worker_threads';
import { TeamImportBusyError, TeamImportError } from './errors';

export const MAX_TEAM_FILE_BYTES = 256 * 1024;
export const MAX_JSON_DEPTH = 6;
export const MAX_CONCURRENT_PARSE_WORKERS = 2;
export const QUEUE_WAIT_TIMEOUT_MS = 5_000;
export const DEFAULT_PARSE_TIMEOUT_MS = 1_000;

/**
 * Inlined worker source. Posts the parsed value back, or `{ __parseError }`
 * on JSON.parse failure. We do NOT trust the input - the worker is killed
 * after `timeoutMs` and any partial state is discarded by `terminate()`.
 */
const WORKER_SOURCE = `
const { parentPort } = require('node:worker_threads');
if (!parentPort) {
  throw new Error('safeParse worker must run as a Worker Thread');
}
parentPort.on('message', (text) => {
  try {
    const value = JSON.parse(text);
    parentPort.postMessage({ __ok: true, value });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    parentPort.postMessage({ __parseError: message });
  }
});
`;

// ---------------------------------------------------------------------------
// Bounded queue - max 2 concurrent parse workers, 5s wait timeout.
// ---------------------------------------------------------------------------

let activeParseCount = 0;
const waitingResolvers: Array<{ resolve: () => void; reject: (e: Error) => void; timer: NodeJS.Timeout }> = [];

function acquireParseSlot(): Promise<void> {
  if (activeParseCount < MAX_CONCURRENT_PARSE_WORKERS) {
    activeParseCount += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = waitingResolvers.findIndex((w) => w.resolve === resolve);
      if (idx >= 0) waitingResolvers.splice(idx, 1);
      reject(new TeamImportBusyError());
    }, QUEUE_WAIT_TIMEOUT_MS);
    waitingResolvers.push({ resolve, reject, timer });
  });
}

function releaseParseSlot(): void {
  activeParseCount = Math.max(0, activeParseCount - 1);
  const next = waitingResolvers.shift();
  if (next) {
    clearTimeout(next.timer);
    activeParseCount += 1;
    next.resolve();
  }
}

/**
 * Parse `text` as JSON inside a Worker Thread with a hard timeout. Throws
 * `TeamImportError` on byte-size overflow, parse failure, or timeout.
 * Throws `TeamImportBusyError` if the concurrency cap + 5s wait elapses.
 *
 * The byte-size pre-check runs synchronously BEFORE any worker is spawned,
 * so 257KB rejections do not consume a queue slot.
 */
export async function safeParseWithTimeout(
  text: string,
  timeoutMs: number = DEFAULT_PARSE_TIMEOUT_MS
): Promise<unknown> {
  if (Buffer.byteLength(text, 'utf8') > MAX_TEAM_FILE_BYTES) {
    throw new TeamImportError(
      `File exceeds ${MAX_TEAM_FILE_BYTES / 1024}KB`,
      'TEAM_IMPORT_TOO_LARGE'
    );
  }

  await acquireParseSlot();
  let worker: Worker | undefined;
  try {
    return await new Promise<unknown>((resolve, reject) => {
      worker = new Worker(WORKER_SOURCE, { eval: true });
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        void worker?.terminate();
        reject(new TeamImportError('Parse timeout', 'TEAM_IMPORT_TIMEOUT'));
      }, timeoutMs);

      worker.once('message', (msg: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker?.terminate();
        if (msg && typeof msg === 'object' && '__parseError' in msg) {
          const message = String((msg as { __parseError: unknown }).__parseError);
          reject(new TeamImportError(`Invalid JSON: ${message}`, 'TEAM_IMPORT_INVALID_JSON'));
          return;
        }
        if (msg && typeof msg === 'object' && '__ok' in msg) {
          resolve((msg as unknown as { value: unknown }).value);
          return;
        }
        reject(new TeamImportError('Unexpected worker response', 'TEAM_IMPORT_WORKER_ERROR'));
      });

      worker.once('error', (err: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker?.terminate();
        reject(new TeamImportError(`Worker error: ${err.message}`, 'TEAM_IMPORT_WORKER_ERROR'));
      });

      worker.postMessage(text);
    });
  } finally {
    releaseParseSlot();
  }
}

// ---------------------------------------------------------------------------
// Post-parse walkers - reject prototype-pollution keys + deep nesting.
// ---------------------------------------------------------------------------

const POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively reject any property whose key matches `__proto__`,
 * `constructor`, or `prototype` at any depth. Throws `TeamImportError`
 * with a path hint when one is found.
 *
 * Must run BEFORE the value is handed to Zod or any merge-like helper.
 */
export function rejectPrototypePollutionKeys(value: unknown, path = '$'): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      rejectPrototypePollutionKeys(value[i], `${path}[${i}]`);
    }
    return;
  }
  // Use Object.keys (not for...in) so we examine OWN enumerable string keys
  // only - and check Object.getOwnPropertyNames to catch non-enumerable
  // `__proto__` setter attempts that parsers like `JSON.parse` reject by
  // default but defensive layering is cheap.
  const ownKeys = Object.getOwnPropertyNames(value as object);
  for (const key of ownKeys) {
    if (POLLUTION_KEYS.has(key)) {
      throw new TeamImportError(
        `Prototype-pollution key detected: ${path}.${key}`,
        'TEAM_IMPORT_PROTO_POLLUTION'
      );
    }
    rejectPrototypePollutionKeys((value as Record<string, unknown>)[key], `${path}.${key}`);
  }
}

/**
 * Enforce a maximum JSON depth on the parsed object graph. Depth 1 = the
 * root object. Throws `TeamImportError` when the limit is exceeded.
 *
 * This is the recursion-budget defense - Zod's own depth is shallow for
 * the team schema but a payload like `{a:{a:{a:...}}}` could still build
 * a nightmare graph before validation rejects it field-by-field.
 */
export function enforceMaxDepth(value: unknown, maxDepth: number, currentDepth = 1): void {
  if (currentDepth > maxDepth) {
    throw new TeamImportError(`JSON depth exceeds ${maxDepth}`, 'TEAM_IMPORT_TOO_DEEP');
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const entry of value) {
      enforceMaxDepth(entry, maxDepth, currentDepth + 1);
    }
    return;
  }
  for (const entry of Object.values(value as Record<string, unknown>)) {
    enforceMaxDepth(entry, maxDepth, currentDepth + 1);
  }
}
