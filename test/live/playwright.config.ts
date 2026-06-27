/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Playwright config for the LIVE verification suite (test/live). It connects to
 * an already-running Wayland app over CDP (see fixtures/app.ts) — it never
 * launches the app, so it works identically on macOS and Windows as long as the
 * app is running with remote debugging on `WAYLAND_CDP_URL` (default :9222).
 *
 * Run:  bunx playwright test --config test/live/playwright.config.ts
 * Tag a Windows-only test with `@windows`; filter with `--grep @windows`.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.live.spec.ts',
  // Live provider round-trips (real LLM completions) are slow; be generous.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  // One worker: the suite drives a SINGLE shared app instance over CDP; parallel
  // workers would fight over the one renderer page and the one composer.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'test/live/.report', open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
