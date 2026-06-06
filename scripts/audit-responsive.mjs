#!/usr/bin/env node
/**
 * audit-responsive.mjs - screenshot key pages at three viewport widths
 * to verify the layout reflows.
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const APP_BASE = 'http://localhost:5173';
const WIDTHS = [1024, 1440, 1920];
const ROUTES = [
  { slug: 'agents', path: '/settings/agents' },
  { slug: 'channels', path: '/settings/channels' },
  { slug: 'providers', path: '/settings/providers' },
  { slug: 'voice', path: '/settings/voice' },
  { slug: 'storage', path: '/settings/storage' },
  { slug: 'notifications', path: '/settings/notifications' },
];

const outDir = resolve(process.argv[2] || '.planning/audit/responsive');
await mkdir(outDir, { recursive: true });

const browser = await chromium.connectOverCDP('http://localhost:9230');
const page = browser.contexts()[0].pages()[0];

for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const { slug, path } of ROUTES) {
    const url = `${APP_BASE}/#${path}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const file = `${outDir}/${slug}-${w}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log(`wrote ${file}`);
  }
}

process.exit(0);
