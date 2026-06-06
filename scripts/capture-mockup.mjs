#!/usr/bin/env node
/**
 * capture-mockup.mjs - screenshot the mockup design at given anchors.
 * Mockup uses query params or anchors to switch panes; we just take a tall
 * full-page screenshot of each anchor.
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const URL_BASE = 'http://localhost:9876/settings-redesign-mockup.html';
const ANCHORS = [
  'providers', 'channels', 'channels-telegram', 'mcp', 'image-gen', 'voice',
  'editor', 'storage', 'general', 'notifications', 'webui', 'theme',
];

const outDir = resolve(process.argv[2] || '.planning/audit/mockup');
await mkdir(outDir, { recursive: true });

const browser = await chromium.connectOverCDP('http://localhost:9230');
const page = (browser.contexts()[0] || (await browser.newContext())).pages()[0];

await page.setViewportSize({ width: 1440, height: 900 });

for (const anchor of ANCHORS) {
  const url = `${URL_BASE}#${anchor}`;
  console.log(`-> ${anchor}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${anchor}.png`, fullPage: false });
}

console.log('Done');
process.exit(0);
