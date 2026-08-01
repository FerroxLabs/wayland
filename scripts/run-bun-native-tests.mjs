/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && entry.name.endsWith('.bun.test.ts') ? [target] : [];
  });
}

const files = ['src', 'tests'].flatMap(collect).sort();
if (files.length === 0) {
  console.error('No Bun-native test files found.');
  process.exit(1);
}

/**
 * Bun defaults to a 5s per-test timeout; Vitest in this repo budgets 10s
 * (`vitest.config.ts`). The Bun-native corpus therefore silently ran on half the
 * budget, and the Constitution durability suites do not fit in it on Windows,
 * where every `fsync` is a real `FlushFileBuffers` rather than a cheap one.
 *
 * Measured on the Windows box under Bun 1.3.11, whole corpus in one run: the
 * heaviest test (the Classic recovery locator restart/replay proof) takes
 * 4640ms, or 93% of Bun's default, and its cost swings with I/O scheduling
 * (2406ms alone, 4031ms paired, 4640ms full-corpus). A second test measured
 * 5016ms locally while passing at 2416ms on the CI runner. So the cliff is not
 * one slow test; the entire suite sits against the default and which test trips
 * is luck. With this budget all 254 tests pass on Windows.
 *
 * Deliberately larger than Vitest's 10s: 10s leaves only ~2x headroom over the
 * measured Windows ceiling, and the CI runner is slower than the box. The full
 * corpus completes in ~26s, so a genuine hang is still reported promptly.
 */
const TEST_TIMEOUT_MS = 30_000;

const result = spawnSync(process.execPath, ['test', '--timeout', String(TEST_TIMEOUT_MS), ...files], {
  env: process.env,
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
