/**
 * Pre-warm the morning report's Yahoo bar cache from OUTSIDE the engine sandbox.
 *
 * WHY THIS FILE EXISTS AT ALL
 * ---------------------------
 * The signal engine needs deep history - `report.mjs` discards any symbol with
 * fewer than 300 daily bars - and a scheduled run cannot fetch it. A run's Bash
 * tool executes under Core's seatbelt, where DNS is refused outright: a `curl`
 * from inside a run exits 6, and every symbol then comes back `no data` while
 * the run still produces a well-formed, entirely empty brief. Widening the
 * sandbox would fix it in one line and is the wrong line - an unattended
 * auto-approve run with outbound network is a security decision with a real
 * blast radius, and it is deliberately not taken here.
 *
 * So the bars are fetched by the main process, which is not in the seatbelt,
 * and left on disk in the exact shape the scanner already reads without a
 * network call. `yahooDaily` checks its cache file FIRST and returns it; the
 * payload it writes is exactly the parsed bar array. Nothing in the scanner
 * changes.
 *
 * THE BARS ARE YAHOO'S, NOT TRADINGVIEW'S. Anyone reading a green result on the
 * morning-report milestone has to be told that sentence in those words. This
 * module is the whole of the report's history layer and it talks to
 * query1.finance.yahoo.com.
 *
 * TWO THINGS THIS CODE IS CAREFUL ABOUT, BOTH BECAUSE IT RUNS UNSANDBOXED
 * ----------------------------------------------------------------------
 *  1. A symbol reaches `path.join` on the way to a filename. In the sandboxed
 *     scanner that write is jailed; here it is not, so a symbol carrying `..`
 *     or a separator would be an arbitrary file write running as the user. The
 *     grammar below REFUSES rather than sanitises, because a sanitiser that
 *     silently rewrites `BRK/B` into something else produces a cache file the
 *     scanner never asks for, which is the exact silent-empty-report failure
 *     this module exists to remove.
 *  2. A symbol reaches a URL. It is percent-encoded into the path segment, and
 *     redirects are refused, so a crafted watchlist entry cannot rewrite the
 *     query, the fragment, or the host that is eventually contacted.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

/** `report.mjs:334` - `yahooDaily(tkr, '19990101', end, …)`. */
export const YAHOO_SCAN_START = '19990101';

/** `marketOverview.mjs:179` - `yahooDaily(sym, '20220101', end, …)`. */
export const YAHOO_OVERVIEW_START = '20220101';

/** Yahoo rejects an unfamiliar agent outright; same string the scanner sends. */
const UA = 'Mozilla/5.0';

/** Whole-fetch deadline for ONE symbol. */
const PER_SYMBOL_TIMEOUT_MS = 20_000;

/** Whole-prefetch deadline. A routine fires at 07:00 and must not hang a run. */
export const DEFAULT_PREFETCH_BUDGET_MS = 240_000;

/**
 * ONE Yahoo ticker, and nothing that can leave a directory.
 *
 * Deliberately a whitelist of the characters the shipped universe actually
 * uses: plain tickers (`AAPL`), class shares (`BRK.B`), continuous futures
 * (`ES=F`), indices (`^VIX`) and Yahoo's dotted index names (`DX-Y.NYB`).
 * `/`, `\`, `..`, NUL and every URL separator are outside the set, so a
 * traversal is a REFUSAL and not a rewrite.
 */
export function isPrefetchableSymbol(symbol: unknown): boolean {
  if (typeof symbol !== 'string') return false;
  if (symbol.length === 0 || symbol.length > 16) return false;
  if (symbol.includes('..')) return false;
  return /^[A-Za-z0-9^][A-Za-z0-9.=^-]*$/.test(symbol);
}

/**
 * The end half of the cache key, in UTC.
 *
 * MUST agree with `utcToday()` in `morning-report.mjs`, which is what the
 * scanner passes when `--end` is absent. A test pins both to the same frozen
 * instant across a UTC midnight; see the note on that function for what a
 * disagreement costs.
 */
export function utcCacheEndDate(now: Date = new Date()): string {
  return (
    String(now.getUTCFullYear()) +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0')
  );
}

export type PrefetchResult = {
  /** Files newly written this run. */
  written: number;
  /** Keys already on disk, so never fetched. */
  cached: number;
  /** Symbols refused by the grammar. Never fetched, never written. */
  rejected: string[];
  /** Symbols that were fetched and produced nothing usable. */
  failed: string[];
  /** True when the whole-prefetch budget ran out before the list did. */
  timedOut: boolean;
};

export type PrefetchOptions = {
  cacheDir: string;
  /** Watchlist tickers - the deep-history shape. */
  scanSymbols: readonly string[];
  /** `marketOverview.MARKETS` symbols - the shallower shape. */
  overviewSymbols: readonly string[];
  end: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
  budgetMs?: number;
};

function epochSeconds(yyyymmdd: string): number {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return Math.floor(Date.UTC(y, m - 1, d) / 1000);
}

/**
 * Yahoo's chart payload -> the scanner's bar array.
 *
 * Intentionally the same filtering `yahooDaily` applies, because the file this
 * writes IS what `yahooDaily` returns: it is read back with `JSON.parse` and
 * handed straight to the engine with no further validation. Anything this
 * function lets through is financial signal input.
 */
function parseBars(raw: unknown): Array<Record<string, number | string>> {
  const chart = (raw as { chart?: { result?: unknown[] } })?.chart;
  const res = chart?.result?.[0] as
    | { timestamp?: unknown; indicators?: { quote?: Array<Record<string, unknown[]>> } }
    | undefined;
  if (!res || !Array.isArray(res.timestamp)) return [];
  const q = res.indicators?.quote?.[0];
  if (!q) return [];
  const out: Array<Record<string, number | string>> = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const o = q['open']?.[i];
    const h = q['high']?.[i];
    const l = q['low']?.[i];
    const c = q['close']?.[i];
    if (o === null || o === undefined || h === null || h === undefined) continue;
    if (l === null || l === undefined || c === null || c === undefined) continue;
    if (!(Number(h) > 0 && Number(l) > 0 && Number(c) > 0)) continue;
    out.push({
      date: new Date(Number(res.timestamp[i]) * 1000).toISOString().slice(0, 10),
      open: Number(o),
      high: Number(h),
      low: Number(l),
      close: Number(c),
      volume: Number(q['volume']?.[i] ?? 0) || 0,
    });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/**
 * Fetch and cache the daily bars the morning report will ask for.
 *
 * NEVER THROWS. A prefetch outage must not abort the run: the scanner then
 * finds an empty cache, has no network, and produces the honest empty report
 * that names exactly what it could not reach. That is a correct outcome and a
 * far better one than a run that dies with a stack trace, or - worse - a brief
 * assembled from whatever happened to be lying around.
 */
export async function prefetchDailyBars(options: PrefetchOptions): Promise<PrefetchResult> {
  const result: PrefetchResult = { written: 0, cached: 0, rejected: [], failed: [], timedOut: false };
  const doFetch = options.fetchImpl ?? ((url: string, init?: RequestInit) => fetch(url, init));
  const deadline = Date.now() + (options.budgetMs ?? DEFAULT_PREFETCH_BUDGET_MS);

  const jobs: Array<{ symbol: string; start: string }> = [
    ...options.scanSymbols.map((symbol) => ({ symbol, start: YAHOO_SCAN_START })),
    ...options.overviewSymbols.map((symbol) => ({ symbol, start: YAHOO_OVERVIEW_START })),
  ];

  try {
    mkdirSync(options.cacheDir, { recursive: true });
  } catch {
    // An unwritable cache directory is a total prefetch outage, not a crash.
    result.failed = jobs.map((j) => j.symbol);
    return result;
  }

  for (const { symbol, start } of jobs) {
    if (!isPrefetchableSymbol(symbol)) {
      result.rejected.push(symbol);
      continue;
    }
    const target = path.join(options.cacheDir, `${symbol}_${start}_${options.end}.json`);
    // Belt and braces on top of the grammar: the file must land in the cache
    // directory itself, not in a child of it and not beside it.
    if (path.dirname(path.resolve(target)) !== path.resolve(options.cacheDir)) {
      result.rejected.push(symbol);
      continue;
    }
    if (existsSync(target)) {
      result.cached += 1;
      continue;
    }
    if (Date.now() >= deadline) {
      result.timedOut = true;
      break;
    }

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
      `?period1=${epochSeconds(start)}&period2=${epochSeconds(options.end)}&interval=1d&events=split`;
    let bars: Array<Record<string, number | string>> = [];
    try {
      const response = await doFetch(url, {
        headers: { 'User-Agent': UA },
        // A crafted symbol cannot rewrite the host through the template, but a
        // 30x could send the follow-up request anywhere. Refuse it.
        redirect: 'error',
        signal: AbortSignal.timeout(PER_SYMBOL_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      bars = parseBars(JSON.parse(await response.text()));
    } catch {
      result.failed.push(symbol);
      continue;
    }
    if (bars.length === 0) {
      result.failed.push(symbol);
      continue;
    }
    try {
      writeFileSync(target, JSON.stringify(bars));
      result.written += 1;
    } catch {
      result.failed.push(symbol);
    }
  }

  // Provenance, so the brief can say where its bars came from and how old they
  // are. Best effort: a manifest that cannot be written must not fail the run.
  try {
    writeFileSync(
      path.join(options.cacheDir, '.prefetch-manifest.json'),
      JSON.stringify(
        {
          source: 'yahoo-daily',
          host: 'query1.finance.yahoo.com',
          end: options.end,
          fetchedAt: new Date().toISOString(),
          written: result.written,
          cached: result.cached,
          failed: result.failed.length,
          rejected: result.rejected.length,
          timedOut: result.timedOut,
        },
        null,
        2
      )
    );
  } catch {
    /* provenance is not load-bearing */
  }

  return result;
}
