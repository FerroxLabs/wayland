/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Live-verification suites. Deliberately NOT reachable from vitest.config.ts:
 * these need real external services running, so collecting them in CI would
 * turn an absent dependency into a red build.
 *
 * Standalone rather than extending the base config - inheriting its `projects`
 * pulls in the whole unit suite, which is both slow and beside the point here.
 * Run by hand, with the dependency up; see each suite's header for what it needs.
 *
 *   npx vitest run --config vitest.live.config.ts
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@process': resolve(__dirname, 'src/process'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@worker': resolve(__dirname, 'src/worker'),
    },
  },
  test: {
    name: 'live',
    environment: 'node',
    include: ['tests/live/**/*.live.test.ts'],
    testTimeout: 40000,
    hookTimeout: 40000,
  },
});
