/**
 * yahooData.mjs — port of
 * /Users/seandonahoe/dev/tvcontrol/skills/market-open-report/backtests/yahoo_data.py
 *
 * A second price source, because ThetaData cannot answer the question being asked.
 *
 * WHY THIS EXISTS. ThetaData's stock EOD history is deep for a handful of names
 * (MSFT, AAPL, INTC, ADBE) and starts at 2017 for almost everything else. Probed
 * directly: KO, JNJ, PG, XOM, JPM, CAT, IBM, HON, DIS, BA, WMT, NKE, UNH, GS, PEP,
 * LLY, V and T all return HTTP 472 for 2012 and 2015. That is why the 2010-2017
 * holdout only ever contained 18 of the 34 symbols.
 *
 * Testing a WIDER, CALMER universe therefore cannot be done on ThetaData at all:
 * the new names have no out-of-sample period, and "out of sample or it did not
 * happen" is the rule that has already killed one false discovery in this project.
 *
 * So this loads daily bars from Yahoo instead, which reaches back to 2010 for
 * everything. Yahoo is NOT trusted on arrival. validate_against_theta() re-runs
 * the dip backtest on both sources over the same symbols and the same window, and
 * the wider-universe study is only worth reading if those agree.
 *
 * ADJUSTMENT. Yahoo's chart OHLC is already split-adjusted and NOT dividend
 * adjusted, which is exactly what this project wants: ThetaData is unadjusted and
 * gets split-corrected by hand in signal_engine. Both paths therefore end at
 * split-adjusted, dividend-unadjusted prices. `adjclose` is deliberately ignored,
 * because dividend adjustment shifts a price-trend system's moving averages.
 *
 * ---------------------------------------------------------------------------
 * DELIBERATE DIFFERENCES FROM THE PYTHON (both required by the port brief):
 *
 * 1. CACHE DIRECTORY IS A PARAMETER. The Python hardcodes
 *      CACHE = <dir of yahoo_data.py>/yahoo-cache
 *    which is a sibling of the source file. This code ships inside an app whose
 *    resources directory is read-only, so the cache directory is passed in by the
 *    caller as the last argument to yahooDaily(). The filename convention inside
 *    it is unchanged: `{symbol}_{start}_{end}.json`.
 *
 * 2. yahooDaily IS ASYNC, because `fetch` is. Call sites must await it. Nothing
 *    else about the control flow changed.
 * ---------------------------------------------------------------------------
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';

/**
 * Port of `_epoch(datestr)`.
 *
 * Python:
 *   d = dt.date(int(datestr[:4]), int(datestr[4:6]), int(datestr[6:]))
 *   return int(time.mktime(d.timetuple()))
 *
 * !!! KNOWN BUG, REPRODUCED ON PURPOSE — DO NOT "FIX" HERE !!!
 * `time.mktime` interprets the date in the machine's LOCAL timezone, while the
 * caller computes `end` in UTC. The window this function produces is therefore
 * machine-dependent: it slides by the local UTC offset (up to +/-14h), so the
 * same symbol+start+end can request — and cache under the same filename — a
 * different range on two machines. The correct behaviour is almost certainly
 * Date.UTC(y, m - 1, day) / 1000. It is left LOCAL here so this port can be
 * proven bit-for-bit equivalent to the Python first; fix it deliberately, in
 * both files at once, and expect every cache key to need invalidating.
 *
 * `new Date(y, m - 1, day)` is the JS equivalent of mktime() on a timetuple with
 * tm_hour/min/sec = 0 and tm_isdst = -1: both ask the platform to resolve local
 * midnight, DST included.
 *
 * @param {string} datestr 'YYYYMMDD'
 * @returns {number} whole seconds since the epoch
 */
export function _epoch(datestr) {
  // Python's int() on a slice; parseInt matches for the well-formed 'YYYYMMDD'
  // input this is only ever called with. (On malformed input Python raises and
  // parseInt returns NaN — the Python has no guard either, so neither does this.)
  const y = Number.parseInt(datestr.slice(0, 4), 10);
  const m = Number.parseInt(datestr.slice(4, 6), 10);
  const day = Number.parseInt(datestr.slice(6), 10);
  const d = new Date(y, m - 1, day, 0, 0, 0, 0);
  // JS maps two-digit years to 1900+; Python's dt.date does not. Undo that.
  d.setFullYear(y);
  // Python `int()` truncates toward zero (NOT floor) — Math.trunc, not Math.floor.
  // getTime() is whole milliseconds here, so the ms/1000 divide is exact for any
  // sane date and this only matters as documentation of intent.
  return Math.trunc(d.getTime() / 1000);
}

/**
 * Port of `yahoo_daily(symbol, start, end, retries)`.
 * Split-adjusted daily bars. Cached, because a 100-symbol sweep repeats.
 *
 * @param {string} symbol
 * @param {string} [start='20090101']
 * @param {string} [end='20260805']
 * @param {number} [retries=3]
 * @param {string} cacheDir  App-owned cache directory (see note 1 in the header).
 *                           Required; the Python's hardcoded sibling path is gone.
 * @returns {Promise<Array<{date: string, open: number, high: number, low: number,
 *                          close: number, volume: number}>>}
 */
export async function yahooDaily(symbol, start = '20090101', end = '20260805', retries = 3, cacheDir) {
  if (typeof cacheDir !== 'string' || cacheDir === '') {
    // No hardcoded fallback on purpose: silently writing next to the bundled
    // script is exactly the behaviour this port exists to remove.
    throw new Error('yahooDaily: cacheDir is required (app-owned cache directory)');
  }
  mkdirSync(cacheDir, { recursive: true }); // os.makedirs(CACHE, exist_ok=True)
  const p = join(cacheDir, `${symbol}_${start}_${end}.json`);
  if (existsSync(p)) {
    // json.load throws on a corrupt cache file in Python; JSON.parse throws too.
    return JSON.parse(readFileSync(p, 'utf8'));
  }
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=${_epoch(start)}&period2=${_epoch(end)}&interval=1d&events=split`;
  let raw = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': UA },
        // urllib's timeout=60 is a per-socket-operation timeout; AbortSignal is a
        // whole-request deadline. Same 60s number, slightly stricter semantics.
        signal: AbortSignal.timeout(60000),
      });
      // urlopen() raises HTTPError on 4xx/5xx; fetch resolves. Throw so the
      // backoff below still runs — otherwise rate limiting would parse as data.
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      raw = JSON.parse(await r.text());
      break;
    } catch {
      // Yahoo rate limits under a sweep. Back off rather than silently
      // dropping the symbol, which is the exact bug the 472 handling in
      // signal_engine was written to avoid.
      //
      // Faithful to the Python: it sleeps after the LAST failed attempt too
      // (there is no `if attempt < retries - 1` guard), so the call costs an
      // extra 2*retries seconds on total failure. Kept as-is.
      await new Promise((resolve) => setTimeout(resolve, 2 * (attempt + 1) * 1000));
    }
  }
  if (raw === null) {
    return [];
  }
  let res, ts, q;
  try {
    // Python catches (KeyError, TypeError, IndexError) here and returns [].
    // Chained access on a missing key gives undefined in JS and then throws
    // TypeError on the next hop, which lands in the same catch — so
    // raw['chart'], ['result'], ['indicators'] and ['quote'] need no guards.
    // The two cases that DO need spelling out are the ones where Python raises
    // but JS quietly yields undefined:
    res = raw['chart']['result'][0];
    //   res['timestamp'] on a dict without the key -> KeyError (JS: undefined)
    if (res === null || typeof res !== 'object' || !('timestamp' in res)) {
      throw new TypeError('no timestamp key');
    }
    ts = res['timestamp'];
    q = res['indicators']['quote'][0];
    //   quote[0] on an empty list -> IndexError (JS: undefined).
    //   quote[0] === null is NOT caught: Python binds q = None and dies later
    //   at q['open'], which JS also does. Left alone on purpose.
    if (q === undefined) throw new TypeError('empty quote list');
  } catch {
    return [];
  }
  // FAITHFUL CRASH: the Python's try block ends above, so a `timestamp` key that
  // is present but null reaches `for i, t in enumerate(ts)` and raises an
  // UNCAUGHT TypeError ("'NoneType' object is not iterable"). JS would silently
  // read `null.length`... which also throws, but a non-array (say a number)
  // would give an undefined length and a zero-iteration loop returning [] —
  // i.e. it would swallow a failure the Python propagates. Throw instead.
  if (!Array.isArray(ts)) throw new TypeError("yahooDaily: 'timestamp' is not iterable");
  const out = [];
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i];
    const o = q['open'][i], h = q['high'][i], l = q['low'][i], c = q['close'][i];
    // `None in (o, h, l, c)` — JSON null maps to null. undefined covers a short
    // array, which would have been an IndexError in Python (uncaught there, and
    // Yahoo does not send ragged arrays, so this is belt-and-braces).
    if (o === null || o === undefined || h === null || h === undefined ||
        l === null || l === undefined || c === null || c === undefined) continue;
    // NOTE: `o` is deliberately NOT range-checked, matching the Python.
    if (!(h > 0 && l > 0 && c > 0)) continue;
    out.push({
      // dt.datetime.utcfromtimestamp(t).strftime('%Y-%m-%d') — UTC, not local.
      date: new Date(t * 1000).toISOString().slice(0, 10),
      open: Number(o), high: Number(h), low: Number(l), close: Number(c),
      // Python `x or 0` and JS `x || 0` agree on null/undefined/0/0.0.
      volume: Number(q['volume'][i] || 0),
    });
  }
  // out.sort(key=lambda x: x['date']) — ascending string compare, stable in both.
  // The default JS .sort() coerces to string and would work here, but spell the
  // comparator out so the ordering is the Python's and not V8's coercion rules.
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (out.length) {
    writeFileSync(p, JSON.stringify(out));
  }
  return out;
}
