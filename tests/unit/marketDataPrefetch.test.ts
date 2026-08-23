import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import {
  isPrefetchableSymbol,
  prefetchDailyBars,
  utcCacheEndDate,
  YAHOO_OVERVIEW_START,
  YAHOO_SCAN_START,
} from '@process/services/marketData/prefetchDailyBars';

// The REAL scanner functions. These are the consumers the prefetch exists to
// feed, so the tests read them rather than a restatement of them - a fixture
// shaped by hand here would agree with itself and with nothing that ships.
import { utcToday } from '../../src/process/resources/skills/market-open-report/scripts/morning-report.mjs';
import { yahooDaily } from '../../src/process/resources/skills/market-open-report/scripts/yahooData.mjs';

const BARS = Array.from({ length: 400 }, (_, i) => ({
  date: `2024-${String(1 + (i % 12)).padStart(2, '0')}-01`,
  open: 10 + i,
  high: 11 + i,
  low: 9 + i,
  close: 10.5 + i,
  volume: 1000 + i,
}));

/** A Yahoo chart response built the way Yahoo builds one. */
function yahooChartBody(bars: typeof BARS): string {
  return JSON.stringify({
    chart: {
      result: [
        {
          timestamp: bars.map((_, i) => 1_700_000_000 + i * 86_400),
          indicators: {
            quote: [
              {
                open: bars.map((b) => b.open),
                high: bars.map((b) => b.high),
                low: bars.map((b) => b.low),
                close: bars.map((b) => b.close),
                volume: bars.map((b) => b.volume),
              },
            ],
          },
        },
      ],
    },
  });
}

function tempCache(): string {
  return mkdtempSync(path.join(tmpdir(), 'mr-prefetch-'));
}

describe('prefetchDailyBars', () => {
  it('writes a cache file the real yahooDaily reads back WITHOUT touching the network', async () => {
    const dir = tempCache();
    try {
      const end = '20260822';
      const res = await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: ['AAPL'],
        overviewSymbols: [],
        end,
        fetchImpl: async () => new Response(yahooChartBody(BARS), { status: 200 }),
      });
      expect(res.written).toBe(1);
      expect(existsSync(path.join(dir, `AAPL_${YAHOO_SCAN_START}_${end}.json`))).toBe(true);

      // The reader. If the cache key or the payload shape is wrong, yahooDaily
      // misses and calls fetch - which here is a detonator, not a stub.
      const realFetch = globalThis.fetch;
      globalThis.fetch = (() => {
        throw new Error('NETWORK TOUCHED: the prefetched cache was not read');
      }) as unknown as typeof fetch;
      let readBack: Array<Record<string, unknown>>;
      try {
        readBack = await yahooDaily('AAPL', YAHOO_SCAN_START, end, 3, dir);
      } finally {
        globalThis.fetch = realFetch;
      }
      expect(Array.isArray(readBack)).toBe(true);
      expect(readBack.length).toBe(BARS.length);
      expect(readBack[0]).toEqual(
        expect.objectContaining({ open: expect.any(Number), close: expect.any(Number), date: expect.any(String) })
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('uses the overview start date for overview symbols', async () => {
    const dir = tempCache();
    try {
      const end = '20260822';
      await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: [],
        overviewSymbols: ['^VIX'],
        end,
        fetchImpl: async () => new Response(yahooChartBody(BARS), { status: 200 }),
      });
      expect(existsSync(path.join(dir, `^VIX_${YAHOO_OVERVIEW_START}_${end}.json`))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('computes the SAME end date the scanner does, including across UTC midnight', () => {
    // 23:30 in a UTC+07 local zone is already the NEXT UTC day. A prefetcher
    // that derives its key from the LOCAL date writes a file the scanner never
    // asks for, every cache lookup misses, and the sandboxed run - which has no
    // network - reports a total outage that looks exactly like a quiet market.
    for (const iso of [
      '2026-08-22T16:30:00.000Z', // 23:30 local at UTC+07, still 08-22 UTC
      '2026-08-22T17:30:00.000Z', // 00:30 local NEXT day at UTC+07, still 08-22 UTC
      '2026-08-22T23:59:59.000Z',
      '2026-08-23T00:00:01.000Z',
      '2026-01-01T00:00:00.000Z',
    ]) {
      const frozen = new Date(iso);
      expect(utcCacheEndDate(frozen)).toBe(utcToday(frozen));
    }
  });

  it('REFUSES a symbol that could walk out of the cache directory, and writes nothing for it', async () => {
    // A PRIVATE parent. The shared OS temp directory is written to by every
    // other process on the machine, so listing it turns "nothing escaped the
    // cache directory" into a race with whatever else is running.
    const root = tempCache();
    const parent = path.join(root, 'parent');
    const dir = path.join(parent, 'cache');
    mkdirSync(dir, { recursive: true });
    try {
      expect(isPrefetchableSymbol('../../evil')).toBe(false);
      expect(isPrefetchableSymbol('a/b')).toBe(false);
      expect(isPrefetchableSymbol('..')).toBe(false);
      expect(isPrefetchableSymbol('a\\b')).toBe(false);
      expect(isPrefetchableSymbol('')).toBe(false);
      expect(isPrefetchableSymbol('A'.repeat(40))).toBe(false);
      // The real ones must survive.
      expect(isPrefetchableSymbol('AAPL')).toBe(true);
      expect(isPrefetchableSymbol('^VIX')).toBe(true);
      expect(isPrefetchableSymbol('ES=F')).toBe(true);
      expect(isPrefetchableSymbol('DX-Y.NYB')).toBe(true);
      expect(isPrefetchableSymbol('BRK.B')).toBe(true);

      const before = new Set(readdirSync(parent));
      let fetched = 0;
      const res = await prefetchDailyBars({
        confineTo: root,
        cacheDir: dir,
        scanSymbols: ['../../evil', 'a/b', 'AAPL'],
        overviewSymbols: [],
        end: '20260822',
        fetchImpl: async () => {
          fetched += 1;
          return new Response(yahooChartBody(BARS), { status: 200 });
        },
      });
      // Exactly one legal symbol was ever fetched or written.
      expect(fetched).toBe(1);
      expect(res.written).toBe(1);
      expect(res.rejected).toEqual(['../../evil', 'a/b']);
      expect(readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'))).toEqual([
        `AAPL_${YAHOO_SCAN_START}_20260822.json`,
      ]);
      // Nothing appeared beside the cache directory.
      expect(new Set(readdirSync(parent))).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('percent-encodes the symbol into the URL and refuses to follow redirects', async () => {
    const dir = tempCache();
    try {
      const seen: Array<{ url: string; init?: RequestInit }> = [];
      await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: ['BRK.B'],
        overviewSymbols: [],
        end: '20260822',
        fetchImpl: async (url: string, init?: RequestInit) => {
          seen.push({ url, init });
          return new Response(yahooChartBody(BARS), { status: 200 });
        },
      });
      expect(seen).toHaveLength(1);
      expect(seen[0].url.startsWith('https://query1.finance.yahoo.com/v8/finance/chart/')).toBe(true);
      expect(seen[0].url).toContain(encodeURIComponent('BRK.B'));
      expect(seen[0].init?.redirect).toBe('error');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('NEVER throws when the fetch fails, and leaves no half-written cache file behind', async () => {
    const dir = tempCache();
    try {
      const res = await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: ['AAPL'],
        overviewSymbols: [],
        end: '20260822',
        fetchImpl: async () => {
          throw new Error('DNS refused');
        },
      });
      expect(res.written).toBe(0);
      expect(res.failed).toEqual(['AAPL']);
      expect(readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not refetch a symbol whose cache file is already present', async () => {
    const dir = tempCache();
    try {
      const end = '20260822';
      writeFileSync(path.join(dir, `AAPL_${YAHOO_SCAN_START}_${end}.json`), JSON.stringify(BARS));
      let fetched = 0;
      const res = await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: ['AAPL'],
        overviewSymbols: [],
        end,
        fetchImpl: async () => {
          fetched += 1;
          return new Response(yahooChartBody(BARS), { status: 200 });
        },
      });
      expect(fetched).toBe(0);
      expect(res.cached).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('PRUNES yesterday\'s cache, because this cache lives in the user\'s Documents folder', async () => {
    // The cache key ends with the run date, so an unpruned cache gains ONE FILE
    // PER SYMBOL PER DAY. Measured on a real run: 82 symbols came to 51 MB, and
    // it sits inside `~/Documents/Wayland/Tasks/<task>/` - which on a machine
    // with Desktop & Documents sync turned on is a 51 MB/day upload. Keeping
    // only the current end date is what makes the cache bounded.
    const dir = tempCache();
    try {
      const stale = path.join(dir, `AAPL_${YAHOO_SCAN_START}_20260801.json`);
      const staleOverview = path.join(dir, `^VIX_${YAHOO_OVERVIEW_START}_20260801.json`);
      const notOurs = path.join(dir, 'somebody-elses-file.txt');
      writeFileSync(stale, JSON.stringify(BARS));
      writeFileSync(staleOverview, JSON.stringify(BARS));
      writeFileSync(notOurs, 'keep me');

      await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: ['AAPL'],
        overviewSymbols: [],
        end: '20260822',
        fetchImpl: async () => new Response(yahooChartBody(BARS), { status: 200 }),
      });

      expect(existsSync(stale)).toBe(false);
      expect(existsSync(staleOverview)).toBe(false);
      // Today's file is kept, and a file this module did not write is never touched.
      expect(existsSync(path.join(dir, `AAPL_${YAHOO_SCAN_START}_20260822.json`))).toBe(true);
      expect(existsSync(notOurs)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('records provenance beside the cache so a brief can say where its bars came from', async () => {
    const dir = tempCache();
    try {
      const res = await prefetchDailyBars({
        confineTo: dir,
        cacheDir: dir,
        scanSymbols: ['AAPL'],
        overviewSymbols: [],
        end: '20260822',
        fetchImpl: async () => new Response(yahooChartBody(BARS), { status: 200 }),
      });
      const manifest = JSON.parse(readFileSync(path.join(dir, '.prefetch-manifest.json'), 'utf8'));
      expect(manifest.source).toBe('yahoo-daily');
      expect(manifest.end).toBe('20260822');
      expect(typeof manifest.fetchedAt).toBe('string');
      expect(Number.isFinite(Date.parse(manifest.fetchedAt))).toBe(true);
      expect(manifest.written).toBe(res.written);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
