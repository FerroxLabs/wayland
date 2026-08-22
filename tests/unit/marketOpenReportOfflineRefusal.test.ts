/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * B10 - SLOW UNREACHABILITY WAS A HANG. IT IS NOW A NAMED REFUSAL.
 *
 * WHAT THE USER SAW: two 0-byte files and "The agent stopped making progress
 * (no activity for 10 minutes)", with no cause named anywhere.
 *
 * WHAT WAS REPORTED AS THE MECHANISM: `AbortSignal.timeout(60000)` per symbol,
 * "74 symbols ~= 74 minutes". REFUTED BY MEASUREMENT. A refused DNS lookup
 * fails in milliseconds and never reaches that deadline. Timed through this
 * exact module inside the engine's own sandbox on the pinned v0.13.4:
 *
 *     ONE symbol .............................. 12,159 ms
 *     the real 8-symbol marketOverview sweep ... 96,211 ms
 *
 * i.e. ~12.1 s/symbol, all of it the retry BACKOFF (2s + 4s + 6s, taken even
 * after the last attempt). 74 watchlist names + 8 index tiles = 82 lookups,
 * ~16.4 minutes - so the 10-minute watchdog kills the turn at roughly symbol 49
 * and nothing ever gets to say why. The same full 74-symbol scanner, same
 * sandbox, after the latch below: 25 seconds, exit 1, and a named refusal on
 * stdout.
 *
 * THE INVARIANTS THIS FILE PINS, in order of importance:
 *  1. after the latch trips, later symbols make NO network call at all;
 *  2. an HTTP answer (404 / 429) is NOT the network and must NOT trip it -
 *     that is the fast honest-empty path ("NO DATA (3)", no fabricated price)
 *     which is the best behaviour this skill has and must survive;
 *  3. the cache still wins, so a partly-warm run is still partial, not refused;
 *  4. the refusal NAMES the cause, on stdout, where the workflow body reads.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPTS = path.resolve(__dirname, '../../src/process/resources/skills/market-open-report/scripts');

/* eslint-disable @typescript-eslint/no-explicit-any */
const yahoo: any = await import(path.join(SCRIPTS, 'yahooData.mjs'));

function offlineError(code = 'ENOTFOUND'): Error {
  const cause: any = new Error(`getaddrinfo ${code} query1.finance.yahoo.com`);
  cause.code = code;
  const err: any = new TypeError('fetch failed');
  err.cause = cause;
  return err;
}

describe('the price source refuses by name instead of hanging', () => {
  let cache: string;

  beforeEach(() => {
    cache = mkdtempSync(path.join(tmpdir(), 'rc2-yahoo-'));
    yahoo.resetDataSourceRefusal();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    yahoo.resetDataSourceRefusal();
    rmSync(cache, { recursive: true, force: true });
  });

  it('classifies a network failure and does NOT classify an HTTP one', () => {
    expect(yahoo.networkErrorCode(offlineError('ENOTFOUND'))).toBe('ENOTFOUND');
    expect(yahoo.networkErrorCode(offlineError('ECONNREFUSED'))).toBe('ECONNREFUSED');
    // What the module itself throws on a 404/429 - the server ANSWERED.
    expect(yahoo.networkErrorCode(new Error('HTTP 404'))).toBeNull();
    expect(yahoo.networkErrorCode(new Error('HTTP 429'))).toBeNull();
  });

  it('stops calling the network once the source is proven unreachable', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      throw offlineError();
    });

    // retries=1 so the test pays 2s of backoff per symbol, not 12s. The latch
    // condition is "every attempt failed on the network", which holds at any
    // retry count.
    for (const sym of ['AAA', 'BBB']) {
      expect(await yahoo.yahooDaily(sym, '20240101', '20260822', 1, cache)).toEqual([]);
    }
    expect(calls).toBe(yahoo.OFFLINE_TRIP_THRESHOLD);

    const refusal = yahoo.dataSourceRefusal();
    expect(refusal).not.toBeNull();
    expect(refusal.reason).toBe('price-source-unreachable');
    expect(refusal.code).toBe('ENOTFOUND');
    expect(refusal.symbol).toBe('BBB');
    expect(refusal.detail).toContain('query1.finance.yahoo.com');

    // THE POINT: the remaining 80 symbols of a real sweep cost NOTHING.
    const before = calls;
    for (const sym of ['CCC', 'DDD', 'EEE', 'FFF']) {
      expect(await yahoo.yahooDaily(sym, '20240101', '20260822', 1, cache)).toEqual([]);
    }
    expect(calls).toBe(before);
  }, 30000);

  it('an HTTP 404 storm never trips it - the fast honest-empty path survives', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      return { ok: false, status: 404, text: async () => '' } as unknown as Response;
    });

    for (const sym of ['ZZZQQQ1', 'ZZZQQQ2', 'ZZZQQQ3']) {
      expect(await yahoo.yahooDaily(sym, '20240101', '20260822', 1, cache)).toEqual([]);
    }
    // Every symbol was really asked, and nothing was latched: the run reports
    // "NO DATA (3)" honestly, exactly as it does today.
    expect(calls).toBe(3);
    expect(yahoo.dataSourceRefusal()).toBeNull();
  }, 30000);

  it('a single transient network failure does not poison the run', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      if (calls === 1) throw offlineError();
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            chart: {
              result: [
                {
                  timestamp: [1700000000],
                  indicators: { quote: [{ open: [1], high: [2], low: [1], close: [2], volume: [10] }] },
                },
              ],
            },
          }),
      } as unknown as Response;
    });

    expect(await yahoo.yahooDaily('AAA', '20240101', '20260822', 1, cache)).toEqual([]);
    const ok = await yahoo.yahooDaily('BBB', '20240101', '20260822', 1, cache);
    expect(ok).toHaveLength(1);
    expect(yahoo.dataSourceRefusal()).toBeNull();

    // THE PART THAT HAS BITE: a symbol that ANSWERED resets the run, so this
    // next failure is the FIRST of a new streak, not the second of the old one.
    // Without the reset the counter would already stand at 1 and this single
    // failure would latch a refusal on a network that demonstrably works.
    calls = 100; // force the stub back onto its failure branch
    vi.stubGlobal('fetch', async () => {
      throw offlineError();
    });
    expect(await yahoo.yahooDaily('CCC', '20240101', '20260822', 1, cache)).toEqual([]);
    expect(yahoo.dataSourceRefusal()).toBeNull();
  }, 30000);

  it('still serves a cached symbol after the latch has tripped', async () => {
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls += 1;
      throw offlineError();
    });
    for (const sym of ['AAA', 'BBB']) await yahoo.yahooDaily(sym, '20240101', '20260822', 1, cache);
    expect(yahoo.dataSourceRefusal()).not.toBeNull();

    // A hand-warmed cache entry, in the module's own filename convention.
    const bars = [{ date: '2026-08-21', open: 1, high: 2, low: 1, close: 2, volume: 10 }];
    writeFileSync(path.join(cache, 'CACHED_20240101_20260822.json'), JSON.stringify(bars));
    const after = calls;
    expect(await yahoo.yahooDaily('CACHED', '20240101', '20260822', 1, cache)).toEqual(bars);
    expect(calls).toBe(after);
  }, 30000);
});

describe('the scanner CLI names the cause on stdout', () => {
  it('prints a REFUSED block and exits 1 when the price source is unreachable', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rc2-cli-'));
    try {
      // Drive the REAL CLI. `--import` replaces global fetch in the real
      // process, which is the only deterministic way to make a machine that
      // HAS a network behave like the sandbox that does not.
      const preload = path.join(dir, 'offline.mjs');
      writeFileSync(
        preload,
        [
          'globalThis.fetch = async () => {',
          "  const cause = new Error('getaddrinfo ENOTFOUND query1.finance.yahoo.com');",
          "  cause.code = 'ENOTFOUND';",
          "  const err = new TypeError('fetch failed');",
          '  err.cause = cause;',
          '  throw err;',
          '};',
        ].join('\n')
      );
      const list = path.join(dir, 'list.csv');
      writeFileSync(list, 'symbol,ticker,exchange\nNASDAQ:AAA,AAA,NASDAQ\nNASDAQ:BBB,BBB,NASDAQ\n');
      mkdirSync(path.join(dir, 'cache'), { recursive: true });

      let stdout = '';
      let status = 0;
      try {
        stdout = execFileSync(
          process.execPath,
          ['--import', preload, path.join(SCRIPTS, 'morning-report.mjs'), '--end', '20260822'],
          {
            encoding: 'utf8',
            env: {
              ...process.env,
              MARKET_OPEN_REPORT_LIST: list,
              MARKET_OPEN_REPORT_CACHE: path.join(dir, 'cache'),
              MARKET_OPEN_REPORT_POSITIONS: path.join(dir, 'nope.csv'),
            },
          }
        );
      } catch (e) {
        stdout = String((e as { stdout?: string }).stdout ?? '');
        status = (e as { status?: number }).status ?? 0;
      }

      expect(status).toBe(1);
      expect(stdout).toContain('REFUSED');
      expect(stdout).toContain('the price source was unreachable from this run');
      expect(stdout).toContain('ENOTFOUND');
      // The distinction the user needs, in the run's own words.
      expect(stdout).toContain('This is NOT "no data"');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120000);
});
