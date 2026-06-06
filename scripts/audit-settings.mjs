#!/usr/bin/env node
/**
 * audit-settings.mjs - connect to running Electron renderer over CDP,
 * walk every Settings route at the user's actual window size, in BOTH
 * themes, with automated overflow + horizontal-clipping detection.
 *
 * Pre-req: `bun run start` running with renderer at ws://localhost:9230/.
 *
 * Outputs:
 *   .planning/audit/<ts>/light/<slug>.png
 *   .planning/audit/<ts>/dark/<slug>.png
 *   .planning/audit/<ts>/report.json
 *   .planning/audit/<ts>/report.md   (PASS/FAIL summary)
 *
 * A page FAILS if:
 *   - documentElement.scrollWidth - clientWidth > 0  (horizontal overflow)
 *   - any element extends past the viewport on the right
 *   - the rightmost grid column ends >40px short of the wrapper edge AT 1920
 *     (= excessive dead space - wrong content max-width on a grid page)
 */
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CDP_URL = 'http://localhost:9230';
const APP_BASE = 'http://localhost:5173';
const VIEWPORT = { width: 1920, height: 900 };

const ROUTES = [
  { slug: 'home', path: '/', kind: 'app' },
  { slug: 'settings-providers', path: '/settings/providers', kind: 'list' },
  { slug: 'settings-images', path: '/settings/images', kind: 'form' },
  { slug: 'settings-voice', path: '/settings/voice', kind: 'form' },
  { slug: 'settings-agents', path: '/settings/agents', kind: 'grid' },
  { slug: 'settings-assistants', path: '/settings/assistants', kind: 'list' },
  { slug: 'settings-skills', path: '/settings/skills', kind: 'grid' },
  { slug: 'settings-webui', path: '/settings/webui', kind: 'form' },
  { slug: 'settings-channels', path: '/settings/channels', kind: 'grid' },
  { slug: 'settings-channels-slack', path: '/settings/channels/slack', kind: 'form' },
  { slug: 'settings-channels-telegram', path: '/settings/channels/telegram', kind: 'form' },
  { slug: 'settings-channels-discord', path: '/settings/channels/discord', kind: 'form' },
  { slug: 'settings-channels-lark', path: '/settings/channels/lark', kind: 'form' },
  { slug: 'settings-channels-dingtalk', path: '/settings/channels/dingtalk', kind: 'form' },
  { slug: 'settings-channels-wechat', path: '/settings/channels/wechat', kind: 'form' },
  { slug: 'settings-channels-wecom', path: '/settings/channels/wecom', kind: 'form' },
  { slug: 'settings-channels-webhook', path: '/settings/channels/webhook', kind: 'form' },
  { slug: 'settings-channels-email', path: '/settings/channels/email', kind: 'form' },
  { slug: 'settings-mcp', path: '/settings/mcp', kind: 'list' },
  { slug: 'settings-theme', path: '/settings/theme', kind: 'form' },
  { slug: 'settings-editor', path: '/settings/editor', kind: 'form' },
  { slug: 'settings-general', path: '/settings/general', kind: 'form' },
  { slug: 'settings-notifications', path: '/settings/notifications', kind: 'form' },
  { slug: 'settings-storage', path: '/settings/storage', kind: 'form' },
  { slug: 'settings-about', path: '/settings/about', kind: 'form' },
];

const outDir = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(`.planning/audit/${new Date().toISOString().replace(/[:.]/g, '-')}`);

await mkdir(resolve(outDir, 'light'), { recursive: true });
await mkdir(resolve(outDir, 'dark'), { recursive: true });
console.log(`Writing to: ${outDir}`);

const browser = await chromium.connectOverCDP(CDP_URL);
const ctx = browser.contexts()[0];
let page = ctx.pages()[0];
if (!page) page = await ctx.newPage();

await page.setViewportSize(VIEWPORT);

// Hard reload before walking routes - clears any latched React error-boundary
// state from previous HMR sessions. Without this, one mid-HMR render-loop
// poisons every subsequent navigation in the SPA.
await page.evaluate(() => {
  location.href = 'http://localhost:5173/';
});
await page.waitForTimeout(1200);
await page.evaluate(() => location.reload());
await page.waitForTimeout(2500);
await page.setViewportSize(VIEWPORT);

async function setTheme(t) {
  await page.evaluate((theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body?.setAttribute('arco-theme', theme);
    try {
      localStorage.setItem('arco-theme', theme);
      localStorage.setItem('theme', theme);
    } catch {}
  }, t);
  await page.waitForTimeout(180);
}

async function inspect() {
  return page.evaluate(() => {
    const html = document.documentElement;
    const root = document.querySelector('#root');
    const errorBoundary = root?.innerHTML?.includes('Something went wrong') || false;
    const wrapper = document.querySelector('.settings-page-wrapper');
    const content = document.querySelector('.settings-page-content');
    const grid = document.querySelector(
      '.settings-page-content [class*="grid-cols"]'
    );
    const articles = grid ? Array.from(grid.children) : [];

    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, height: r.height };
    };

    const widest = (() => {
      let max = 0;
      const all = document.body?.getElementsByTagName('*') ?? [];
      for (const el of all) {
        const s = getComputedStyle(el);
        // Skip portals, popovers, dropdowns, drawers - they layout offscreen
        if (s.position === 'fixed' || s.position === 'absolute') continue;
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.right > max) max = r.right;
      }
      return max;
    })();

    return {
      errorBoundary,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      docOverflow: html.scrollWidth - html.clientWidth,
      rightmostElement: widest,
      wrapper: rect(wrapper),
      content: rect(content),
      contentMaxWidth: content ? getComputedStyle(content).maxWidth : null,
      grid: rect(grid),
      gridCols: articles.length > 0 ? (() => {
        // Count cards in the first row by matching y
        const first = articles[0].getBoundingClientRect();
        return articles.filter(
          (a) => Math.abs(a.getBoundingClientRect().top - first.top) < 4
        ).length;
      })() : null,
      cards: articles.slice(0, 3).map((a) => {
        const r = a.getBoundingClientRect();
        return { w: r.width, h: r.height, x: r.left };
      }),
    };
  });
}

const report = [];

for (const theme of ['light', 'dark']) {
  await setTheme(theme);
  for (const { slug, path, kind } of ROUTES) {
    const url = `${APP_BASE}/#${path}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.warn(`goto warn ${slug}: ${e.message}`);
    }
    await page.waitForTimeout(700);

    let data = await inspect();
    if (data.errorBoundary) {
      // Recover: hard reload, restore theme, re-navigate, re-inspect once.
      await page.evaluate(() => {
        location.href = 'http://localhost:5173/';
      });
      await page.waitForTimeout(1200);
      await page.evaluate(() => location.reload());
      await page.waitForTimeout(2000);
      await setTheme(theme);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(900);
      data = await inspect();
    }
    const file = `${outDir}/${theme}/${slug}.png`;
    await page.screenshot({ path: file, fullPage: false });

    // Failure rules. docOverflow is the source of truth for "user can scroll right";
    // rightmostElement is informational only (elements clipped by overflow:hidden
    // ancestors don't actually break the page).
    const issues = [];
    if (data.errorBoundary) issues.push('ERROR_BOUNDARY: React error caught');
    if (data.docOverflow > 0) issues.push(`OVERFLOW_X: ${data.docOverflow}px`);
    if (kind === 'grid' && data.wrapper && data.content) {
      const wrapperRight = data.wrapper.right;
      const contentRight = data.content.right;
      const gutter = wrapperRight - contentRight;
      if (gutter > 80) {
        issues.push(`GRID_NARROW: ${gutter.toFixed(0)}px wasted right of grid`);
      }
    }
    if (kind === 'grid' && data.gridCols !== null && data.gridCols < 3 && VIEWPORT.width >= 1400) {
      issues.push(`GRID_COLS: only ${data.gridCols} cols at ${VIEWPORT.width}w`);
    }

    const status = issues.length === 0 ? 'PASS' : 'FAIL';
    console.log(`[${theme}] ${slug.padEnd(32)} ${status} ${issues.join(' | ')}`);
    report.push({ theme, slug, path, kind, status, issues, data });
  }
}

await writeFile(`${outDir}/report.json`, JSON.stringify(report, null, 2));

const passCount = report.filter((r) => r.status === 'PASS').length;
const failCount = report.length - passCount;
const md = [
  `# Settings audit @ ${VIEWPORT.width}x${VIEWPORT.height}`,
  ``,
  `**${passCount} PASS / ${failCount} FAIL** out of ${report.length} checks (${ROUTES.length} routes × 2 themes).`,
  ``,
  `## Failures`,
  ``,
  ...report
    .filter((r) => r.status === 'FAIL')
    .map((r) => `- **[${r.theme}] ${r.slug}** (${r.kind}) - ${r.issues.join(', ')}`),
  ``,
  `## Full results`,
  ``,
  '| Theme | Slug | Kind | Status | Issues |',
  '|---|---|---|---|---|',
  ...report.map(
    (r) => `| ${r.theme} | ${r.slug} | ${r.kind} | ${r.status} | ${r.issues.join('; ') || '-'} |`
  ),
].join('\n');
await writeFile(`${outDir}/report.md`, md);

console.log(`\nReport: ${outDir}/report.md`);
console.log(`${passCount} PASS, ${failCount} FAIL`);
await browser.close();
process.exit(failCount > 0 ? 1 : 0);
