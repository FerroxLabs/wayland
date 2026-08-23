/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * B11 - A SCORED GAUGE ON AN EMPTY BRIEF IS THE SAME CLASS OF LIE AS AN
 * INVENTED PRICE.
 *
 * WHAT SHIPPED: a run that reached no market data at all still rendered the
 * market-pressure hero band - five coloured zones, a full-height needle at the
 * 50% mark and a bubble reading `50 /100  MIXED`, with
 * `aria-label="Market pressure 50 out of 100, Mixed"` - on a page that a few
 * lines later says "No market data available for this session."
 *
 * WHY: `marketOverview.pressure()` guarded its divide-by-zero with a DEFAULT
 * rather than an absence (`comp.length ? sum/len : 50.0`), so it returned
 * `{ score: 50, band: 'Mixed', components: [] }` - a non-empty object carrying
 * an invented number. `briefHtml.mjs`'s `if (Object.keys(pr).length)` is then
 * true on three keys and the whole band draws. A composite of zero measurements
 * is not a reading, and a screen reader announces a number nobody measured.
 *
 * WHAT THIS PINS: `pressure` is `null` when nothing was measured, the band
 * disappears from the HTML, and - the assertion that stops this becoming a
 * blanket deletion - a run WITH market data still draws the gauge.
 *
 * Nothing is hand-written. Both cases run the real `morning-report.mjs` to
 * produce a real `mr.json` and the real `briefHtml.mjs` to produce the HTML;
 * the difference between them is only what the price source answers.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPTS = path.resolve(__dirname, '../../src/process/resources/skills/market-open-report/scripts');
const END = '20260822';

/** The eight instruments `marketOverview.MARKETS` reads, in its own cache key shape. */
const INDEX_SYMBOLS = ['ES=F', 'NQ=F', 'YM=F', 'RTY=F', 'CL=F', 'GC=F', '^VIX', 'DX-Y.NYB'];

/**
 * A preload that makes `fetch` answer HTTP 404 for everything. The server
 * ANSWERING is the point: a 404 is the honest-empty path (readiness 1.6), not
 * the network-class refusal of B10, so the run completes and renders a brief
 * with no market rows in it. That is the exact condition that used to draw a
 * needle.
 */
function notFoundPreload(dir: string): string {
  const p = path.join(dir, 'notfound.mjs');
  writeFileSync(
    p,
    ['globalThis.fetch = async () => new Response("not found", { status: 404 });'].join('\n'),
    'utf8'
  );
  return p;
}

/** 260 daily bars on a gentle uptrend - enough for the 1-year percentile and the SMAs. */
function bars(base: number): Array<Record<string, number | string>> {
  const out: Array<Record<string, number | string>> = [];
  const start = Date.UTC(2025, 7, 1);
  for (let i = 0; i < 300; i++) {
    const day = new Date(start + i * 86400000);
    const c = base * (1 + i * 0.0004);
    out.push({
      date: day.toISOString().slice(0, 10),
      open: c * 0.999,
      high: c * 1.004,
      low: c * 0.996,
      close: c,
      volume: 1000 + i,
    });
  }
  return out;
}

/** Warm the app-owned cache the way the main-process prefetch does, so the run is offline but full. */
function warmIndexCache(cacheDir: string): void {
  mkdirSync(cacheDir, { recursive: true });
  for (const sym of INDEX_SYMBOLS) {
    const base = sym === '^VIX' ? 15 : sym === 'DX-Y.NYB' ? 99 : 5000;
    writeFileSync(path.join(cacheDir, `${sym}_20220101_${END}.json`), JSON.stringify(bars(base)), 'utf8');
  }
}

function runReport(dir: string, opts: { warm: boolean }): { json: string; html: string } {
  const cache = path.join(dir, 'cache');
  mkdirSync(cache, { recursive: true });
  if (opts.warm) warmIndexCache(cache);

  const list = path.join(dir, 'list.csv');
  // Three names that do not exist. The scanner gets a 404 for each, which is
  // the server answering, so this is an empty run and not a refused one.
  writeFileSync(list, 'symbol,ticker,exchange\nNASDAQ:ZZZQQQ1,ZZZQQQ1,NASDAQ\nNASDAQ:ZZZQQQ2,ZZZQQQ2,NASDAQ\nNASDAQ:ZZZQQQ3,ZZZQQQ3,NASDAQ\n', 'utf8');

  const jsonOut = path.join(dir, 'mr.json');
  try {
    execFileSync(
      process.execPath,
      [
        '--import',
        notFoundPreload(dir),
        path.join(SCRIPTS, 'morning-report.mjs'),
        '--end',
        END,
        '--json',
        jsonOut,
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          MARKET_OPEN_REPORT_LIST: list,
          MARKET_OPEN_REPORT_CACHE: cache,
          MARKET_OPEN_REPORT_POSITIONS: path.join(dir, 'nope.csv'),
        },
      }
    );
  } catch (e) {
    // An empty scan exits non-zero; the payload is still written.
    const err = e as { stdout?: string; stderr?: string };
    if (!readFileSync(jsonOut, 'utf8')) throw new Error(String(err.stderr ?? err.stdout));
  }

  const htmlOut = path.join(dir, 'brief.html');
  execFileSync(process.execPath, [path.join(SCRIPTS, 'briefHtml.mjs'), jsonOut, htmlOut], { cwd: SCRIPTS });
  return { json: readFileSync(jsonOut, 'utf8'), html: readFileSync(htmlOut, 'utf8') };
}

describe('the morning brief does not score a market it never measured', () => {
  it('renders NO pressure gauge when no market data was reached', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'brief-empty-'));
    try {
      const { json, html } = runReport(dir, { warm: false });
      const payload = JSON.parse(json);

      // The run really was empty - the precondition, not the claim.
      expect(payload.market).toEqual([]);
      expect(html).toContain('No market data available for this session.');

      // A composite of zero measurements is an absence, not a 50.
      expect(payload.pressure).toBeNull();

      // ...and nothing in the document announces a SCORE, to eyes or to a
      // screen reader. Asserted on the gauge's own two claims - the
      // `aria-label` a screen reader reads out and the `NN /100 BAND` bubble -
      // and NOT on the bare words "Market pressure", which also appear in the
      // footer legend explaining what the band means. That sentence is prose
      // about a method, not a measurement, and suppressing it would be tidying
      // rather than fixing.
      expect(html).not.toContain('aria-label="Market pressure');
      expect(html).not.toContain('/100');
      expect(html).not.toContain('MIXED');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    // 300s, and the reason is B10 itself: this case pays the REAL production
    // retry backoff (2s + 4s + 6s per symbol, taken even after the last
    // attempt) for all eleven lookups, which is ~132s measured. Shortening it
    // would mean changing the backoff, and the backoff is production
    // behaviour this test has no business touching.
  }, 300000);

  it('KNOWN POSITIVE: a run that DID reach market data still draws the gauge', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'brief-warm-'));
    try {
      const { json, html } = runReport(dir, { warm: true });
      const payload = JSON.parse(json);

      // Same 404 network, same three dead watchlist names - the ONLY difference
      // from the case above is that the eight index instruments were cached.
      expect(payload.market.length).toBe(INDEX_SYMBOLS.length);
      expect(payload.pressure).not.toBeNull();
      expect(payload.pressure.components.length).toBeGreaterThan(0);

      expect(html).toContain('aria-label="Market pressure');
      expect(html).toContain('/100');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
