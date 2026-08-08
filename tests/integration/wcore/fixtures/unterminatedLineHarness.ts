/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * K-03 Task 1: a standalone harness (NOT a test file - no test-framework
 * import) that reproduces the exact reported defect as a REAL, separate OS
 * process: it writes a valid `ready` line, a valid `stream_start` line, and
 * then the complete JSON body of a `stream_end` for the same turn with
 * `finish_reason:'stop'` and no `usage` field (the literal "no assistant
 * text" repro) via ONE `process.stdout.write(...)` call that never includes
 * its trailing newline. No delimiter for that final frame is ever sent by
 * this harness - the worst case from the report ("no further engine
 * activity"), not merely a delayed delimiter.
 *
 * Mirrors the house shape used for OS-level proofs elsewhere in this
 * milestone (`fixtures/globalProfileWriteHarness.ts`): once the partial
 * write's callback confirms it is durably queued to the OS pipe, a marker
 * file is written so the parent test can proceed at a known-safe point, then
 * the process blocks forever (an unresolved `Promise` awaited at top level)
 * so the parent test controls exactly when it dies.
 *
 * CLI args: <markerPath>
 *
 * Run via `bun`, not `node` - this file has no production imports, so it
 * needs no Electron stub preload (unlike its K-01 sibling).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [markerPath] = process.argv.slice(2);
if (!markerPath) {
  console.error('usage: unterminatedLineHarness.ts <markerPath>');
  process.exit(1);
}

// Reuse the real, pinned `ready` fixture verbatim so this harness stays in
// lockstep with the actual v1 producer contract rather than embedding a copy
// that could drift.
const readyPath = resolve(process.cwd(), 'contracts/wayland-desktop-core/v1/events/ready.json');
const readyLine = readFileSync(readyPath, 'utf-8').trim();

const streamStartLine = JSON.stringify({ type: 'stream_start', msg_id: 'm1' });

// The literal "no assistant text" repro: a content-free stream_end, complete
// bytes, but its delimiter is never sent.
const streamEndBody = JSON.stringify({ type: 'stream_end', msg_id: 'm1', finish_reason: 'stop' });

process.stdout.write(`${readyLine}\n`);
process.stdout.write(`${streamStartLine}\n`);
process.stdout.write(streamEndBody, () => {
  // The partial write is durably queued to the OS pipe by the time this
  // callback runs - signal the parent test so it can proceed to kill this
  // process at a known-safe point.
  writeFileSync(markerPath, 'ready\n');
});

// Block forever. The parent test decides exactly when this process dies, so
// the delimiter genuinely never arrives while the process is alive.
await new Promise(() => {});
