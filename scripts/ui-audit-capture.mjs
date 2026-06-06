#!/usr/bin/env node
/**
 * UI audit capture - attaches Playwright to the running Electron's CDP
 * endpoint and screenshots every settings + library + chat surface so we
 * can audit them against the UI System Bible
 * (.planning/brainstorm/ui-system.html).
 *
 * Usage: node scripts/ui-audit-capture.mjs [outDir]
 *
 * Dev Electron must already be running with --remote-debugging-port=9230.
 * If you killed it, restart with `bun run start` first.
 */

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const CDP = 'http://127.0.0.1:9230';
const OUT_DIR = path.resolve(process.argv[2] ?? '.planning/ui-audit');

/**
 * Hash-route surfaces to capture. Each entry is [name, hash, waitForSelectorOrNull].
 * The wait selector lets us pause until the route's primary content is in the DOM,
 * avoiding empty-state screenshots while data loads.
 */
const SURFACES = [
  // Chat / library
  ['00-new-chat', '/guid', 'body'],
  ['01-assistants-library', '/assistants', 'body'],
  ['02-workflows-library', '/workflows', 'body'],
  ['03-teams-library', '/teams', 'body'],

  // Settings - by sidebar order
  ['10-settings-assistants', '/settings/assistants', 'body'],
  ['11-settings-agents', '/settings/agents', 'body'],
  ['12-settings-skills', '/settings/skills', 'body'],
  ['13-settings-constitution', '/settings/constitution', 'body'],
  ['14-settings-providers', '/settings/providers', 'body'],
  ['15-settings-images', '/settings/images', 'body'],
  ['16-settings-voice', '/settings/voice', 'body'],
  ['17-settings-webui', '/settings/webui', 'body'],
  ['18-settings-channels', '/settings/channels', 'body'],
  ['19-settings-mcp', '/settings/mcp', 'body'],
  ['20-settings-theme', '/settings/theme', 'body'],
  ['21-settings-editor', '/settings/editor', 'body'],
  ['22-settings-general', '/settings/general', 'body'],
  ['23-settings-notifications', '/settings/notifications', 'body'],
  ['24-settings-storage', '/settings/storage', 'body'],
  ['25-settings-wcore', '/settings/wcore', 'body'],
  ['26-settings-about', '/settings/about', 'body'],
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Out dir: ${OUT_DIR}`);

  console.log(`Connecting to Electron CDP at ${CDP}…`);
  const browser = await chromium.connectOverCDP(CDP);
  const contexts = browser.contexts();
  if (contexts.length === 0) {
    throw new Error('No browser contexts found - is the Electron window open?');
  }
  const ctx = contexts[0];
  const pages = ctx.pages();
  if (pages.length === 0) {
    throw new Error('No pages in context');
  }
  // Pick the renderer page (NOT a devtools page). Electron's main renderer is
  // typically the only page that has a localhost URL.
  let page = pages.find((p) => p.url().startsWith('http://localhost')) ?? pages[0];
  console.log(`Attached to page: ${page.url()}`);

  // Force a sane viewport so screenshots are reproducible.
  await page.setViewportSize({ width: 1640, height: 1024 }).catch(() => {});

  // Inject dark theme BEFORE any page load so the renderer boots in
  // dark mode (the localStorage hint is read by the theme-init script
  // in index.html before React mounts). The init script runs on every
  // fresh document, so this needs to be in place ahead of reload.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('__wayland_theme', 'dark');
    } catch {}
  });

  // Hard reload via about:blank bounce so CSS-var changes flush.
  console.log('Hard reload to flush stale CSS…');
  const currentUrl = page.url();
  const baseUrl = currentUrl.split('#')[0] || 'http://localhost:5173/';
  await page.goto('about:blank', { timeout: 5000 }).catch(() => {});
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});

  // Belt: re-assert the DOM attribute in case anything raced ahead.
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.setAttribute('arco-theme', 'dark');
  });

  // Verify the theme actually took.
  const themeCheck = await page.evaluate(() => ({
    attr: document.documentElement.getAttribute('data-theme'),
    bg1: getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim(),
  }));
  console.log(`Theme check: data-theme=${themeCheck.attr}  --bg-1=${themeCheck.bg1}`);
  if (themeCheck.attr !== 'dark' || themeCheck.bg1.toLowerCase().startsWith('#f')) {
    console.warn('!! Theme did NOT take. Screenshots will be light/mixed mode. Continuing anyway.');
  }

  const results = [];
  for (const [name, hash, waitSel] of SURFACES) {
    const targetUrl = `http://localhost:5173/#${hash}`;
    console.log(`→ ${name}  (${hash})`);
    try {
      await page.evaluate((u) => {
        window.location.hash = u;
        // Re-assert dark theme - some routes toggle theme via store init.
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('arco-theme', 'dark');
      }, hash);
      // Settle: react-router transition + lazy chunk load.
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
      if (waitSel) {
        await page.waitForSelector(waitSel, { timeout: 4000 }).catch(() => {});
      }
      // Extra settle for animation / data fetch.
      await page.waitForTimeout(900);
      // Belt-final: assert dark JUST before screenshot.
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('arco-theme', 'dark');
      });
      await page.waitForTimeout(100);

      const file = path.join(OUT_DIR, `${name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const stat = await fs.stat(file);
      console.log(`   ✓ ${file}  (${(stat.size / 1024).toFixed(1)} KB)`);
      results.push({ name, hash, ok: true, file });
    } catch (err) {
      console.error(`   ✗ ${name}: ${err.message}`);
      results.push({ name, hash, ok: false, error: err.message });
    }
  }

  // Write manifest for the audit pass to consume.
  const manifest = {
    capturedAt: new Date().toISOString(),
    bible: '.planning/brainstorm/ui-system.html',
    outDir: OUT_DIR,
    surfaces: results,
  };
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nManifest: ${path.join(OUT_DIR, 'manifest.json')}`);

  // Detach without killing Electron.
  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
