/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * First-run chromium provisioning for the bundled Playwright MCP server (#465).
 *
 * `@playwright/mcp` does NOT ship or auto-download a browser; it errors on the
 * first browse if chromium is missing. Its `cli.js` exposes an `install-browser`
 * command (→ `playwright install`). We run it once, lazily, into an app-managed
 * directory (PLAYWRIGHT_BROWSERS_PATH) so the download is cached and never
 * repeats, and so it lands where the spawned server looks for it. The install
 * runs through the SAME bundled bun the server uses, so no system Node is needed.
 */
import { spawn } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';
import log from 'electron-log';
import { BUILTIN_PLAYWRIGHT_PACKAGE } from '@process/resources/builtinMcp/constants';
import { getDataPath } from '@process/utils/utils';
import { getEnhancedEnv, resolveNpxPath } from '@process/utils/shellEnv';

/** App-managed directory chromium is installed into and the MCP server reads from. */
export function getPlaywrightBrowsersDir(): string {
  return path.join(getDataPath(), 'playwright-browsers');
}

/** True if a chromium build is already present in the managed browsers dir. */
export function isChromiumInstalled(browsersDir: string = getPlaywrightBrowsersDir()): boolean {
  try {
    return readdirSync(browsersDir).some((entry) => entry.startsWith('chromium-'));
  } catch {
    // Dir doesn't exist yet → not installed.
    return false;
  }
}

// One install at a time across the process; subsequent callers await the same run.
let inflight: Promise<boolean> | null = null;

/**
 * Ensure chromium is installed for the Playwright MCP server. Idempotent and
 * best-effort: returns true if chromium is present (already, or after a
 * successful install), false on failure. Never throws — a failed install must
 * not break MCP sync or chat; the agent simply gets a browse error it can retry.
 */
export function ensurePlaywrightChromium(browsersDir: string = getPlaywrightBrowsersDir()): Promise<boolean> {
  if (isChromiumInstalled(browsersDir)) return Promise.resolve(true);
  if (inflight) return inflight;

  inflight = new Promise<boolean>((resolve) => {
    const bun = resolveNpxPath(process.env);
    const args = ['x', '--bun', BUILTIN_PLAYWRIGHT_PACKAGE, 'install-browser', 'chromium'];
    const env = { ...getEnhancedEnv({ PLAYWRIGHT_BROWSERS_PATH: browsersDir }), TERM: 'dumb', NO_COLOR: '1' };
    log.info('[playwright] installing chromium (first run)', { dir: browsersDir });

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(bun, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      log.warn('[playwright] failed to spawn chromium install', { err });
      resolve(false);
      return;
    }

    let stderr = '';
    child.stderr?.on('data', (d) => {
      if (stderr.length < 4096) stderr += String(d);
    });
    child.on('error', (err) => {
      log.warn('[playwright] chromium install process error', { err });
      resolve(false);
    });
    child.on('close', (code) => {
      const ok = code === 0 && isChromiumInstalled(browsersDir);
      if (ok) {
        log.info('[playwright] chromium install complete', { dir: browsersDir });
      } else {
        log.warn('[playwright] chromium install failed', { code, stderr: stderr.slice(0, 1000) });
      }
      resolve(ok);
    });
  }).finally(() => {
    inflight = null;
  });

  return inflight;
}
