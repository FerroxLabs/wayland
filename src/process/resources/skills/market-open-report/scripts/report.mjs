/**
 * report.mjs — faithful port of
 * /Users/seandonahoe/dev/tvcontrol/skills/market-open-report/tools/morning_report.py
 *
 * The morning report: what the system holds, what fired, what you can take.
 *
 *     node morning-report.mjs [--tier 1|2] [--slots 20] [--json OUT]
 *
 * WHAT THIS IS FOR. The single most load-bearing number in this product is how
 * many positions you run at once, and it is the one thing a chart cannot
 * enforce. A student opens one symbol, sees BUY, and buys. Twenty charts each
 * say BUY and each one is telling the truth about itself. The slot cap in the
 * sizer stops any one of them over-committing, but only a list can answer
 * "given what I already hold, what am I allowed to take today". That list is
 * this file.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not simulate a shared account and
 * tell you which names to own. That answer is path dependent: measured across
 * twenty orderings of the same signals, the ten-year outcome spanned 3.21x at 8
 * slots purely on which competing signals got taken first. A report that picked
 * for you would be presenting one draw from that spread as instruction.
 *
 * So it reports the SLEEVE state, which is deterministic per name and has no
 * ordering in it: for each name, is the strategy long right now, did it enter
 * or exit on the last bar, and how far is price from the line that ends the
 * trade. Which of them you take is yours, and the slot count is printed so the
 * decision is made against the right denominator.
 *
 * THE PRICE SOURCE IS YAHOO, NOT TRADINGVIEW, and that is on purpose. Scanning
 * seventy-four symbols through the chart would mean seventy-four symbol changes
 * and seventy-four study reloads, and every one of those is a place the UI can
 * fail silently, as it did on 2026-08-09 when Add-to-chart vanished from the
 * DOM. The Python engine reproduces TradingView trade for trade, 123 against
 * 123 on QQQ with zero disagreements, so the scan runs here and TradingView
 * stays what it is good at: looking at one name closely.
 *
 * ===========================================================================
 * PORTING NOTES (read before changing any number below)
 * ===========================================================================
 *
 * ARITHMETIC. Every expression keeps the Python's operand order, because both
 * languages use IEEE-754 doubles and identical order gives identical bits.
 * Nothing here uses `//`, `%` or `int()`, so the floor/truncate and
 * sign-of-modulo traps do not arise; the one place integer arithmetic appears
 * (`slots - len(held)`) is exact in both.
 *
 * NUMBER FORMATTING. Python's `f'{x:,.2f}'` and `f'{x:+.1f}'` round HALF TO
 * EVEN on the exact binary value of the double. `toFixed` rounds half away and
 * is never used. `pyFormat` from marketOverview.mjs is the CPython-compatible
 * formatter (a tie probe on top of toFixed's exact-value rounding) and every
 * number in `render` goes through it. Width padding is `padStart`/`padEnd`,
 * which match Python's `>`/`<` alignment exactly: both pad and neither
 * truncates.
 *
 * ORDERED MAPPINGS. `position_state`'s group table and `scan`'s `keep` are
 * keyed by strings that can look integer-like (an entry date cannot, but a
 * ticker can — "2330" and "600519" are real symbols). A JS object reorders
 * integer-like keys and a Python dict does not, so both are Maps. `keep` being
 * a Map is why `demo_payload` calls `bars_by_sym.get(...)` unchanged.
 *
 * ASYNC. `scan` and `main` are async because `yahooDaily` is. Nothing else
 * about the control flow changed; the per-symbol loop is still sequential, so
 * Yahoo sees the same request pattern in the same order.
 *
 * PATHS. The Python derives the watchlist, the Yahoo cache and positions.csv
 * from `__file__`. This code ships inside an app whose resources directory is
 * read-only, so all three are parameters. The defaults below reproduce the
 * Python's layout where that is safe (the watchlist and positions.csv are read
 * only) and move the WRITEABLE Yahoo cache out to a user-owned directory.
 *
 * DELIBERATE ADDITION — see `main`: the RETURN VALUE carries `noDataCount`. The
 * Python cannot report total failure and neither can this function; the CLI
 * turns that count into an exit status. It is deliberately NOT in the --json
 * payload, which stays byte-identical to the Python's.
 *
 * JSON NUMBERS. Python writes `861.0` where JS writes `861`, because a whole
 * float is still a float there. `writeJson` at the bottom of this file restores
 * the distinction; see `pyFloatRepr` for the three ways the two languages
 * disagree about printing a double.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as mcats from './engine.mjs';
import { yahooDaily } from './yahooData.mjs';
import * as MO from './marketOverview.mjs';
import { pyFormat } from './marketOverview.mjs';
import * as POS from './positions.mjs';
import { csvReader, dictReader } from './positions.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));

/**
 * Port of `LIST = os.path.join(HERE, '..', 'package', 'exports',
 *                              'TC-MASTER-WATCHLIST.csv')`.
 * Same relative layout, resolved to an absolute path at load time. Read-only,
 * so it can stay beside the code.
 */
export const DEFAULT_LIST = join(HERE, '..', 'data', 'TC-MASTER-WATCHLIST.csv');

/**
 * Port of positions.py's `PATH`. The Python's `POS.load()` takes this default;
 * positions.mjs made the path required, so the default lives here instead.
 */
export const DEFAULT_POSITIONS = join(HERE, '..', 'data', 'positions.csv');

/**
 * NOT a port: the Python's Yahoo cache is a sibling of yahoo_data.py, which is
 * inside the read-only bundle here. A warm cache can be pointed at with
 * MARKET_OPEN_REPORT_CACHE (that is how the tvcontrol checkout's
 * backtests/yahoo-cache gets reused).
 */
function firstWritableDir(candidates) {
  for (const dir of candidates) {
    try {
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      // EPERM/EACCES/EROFS - try the next candidate.
    }
  }
  // Every candidate refused. Return the last one so the caller fails with a
  // real path in the message instead of `undefined`.
  return candidates[candidates.length - 1];
}

/**
 * `~/.cache` is unreachable when this runs inside the agent: Wayland Core
 * sandboxes the skill to its workspace, so `mkdir` under the real home fails
 * `EPERM` and EVERY symbol comes back "NO DATA" while the run still exits 0.
 * Probe instead of assuming, so the same script works in the sandbox, in a
 * plain shell, and against a warm cache pointed at by the env var.
 */
export const DEFAULT_CACHE_DIR =
  process.env.MARKET_OPEN_REPORT_CACHE ||
  firstWritableDir([
    join(homedir(), '.cache', 'market-open-report', 'yahoo-cache'),
    join(process.cwd(), '.market-open-report-cache', 'yahoo-cache'),
    join(tmpdir(), 'market-open-report', 'yahoo-cache'),
  ]);

/**
 * A fill that ENDS the position, as opposed to a rung that trims it.
 *
 * 'end' IS NOT ONE OF THEM ON THE LAST BAR. mcats.run() marks any still-open
 * position to market at the final close and books it with why='end' so the
 * statistics balance. That is accounting, not a signal. Read literally it says
 * every open trade in the watchlist exited today, which is exactly what the
 * first version of this report printed: 54 exits, 0 positions held, on a day
 * nothing happened. A live scan has to distinguish "the system sold" from "the
 * data ran out".
 */
export const TERMINAL = new Set(['flip', 'gate', 'vote']);
export const MTM = 'end';

export const TIER1 = {
  st_mult: 5.0,
  use_take_profit: true,
  tp_steps: 4,
  tps: [1.5, 3.0, 6.0, 12.0],
  tp_amts: [25.0, 20.0, 10.0, 15.0],
};
export const TIER2 = { st_mult: 5.0, use_take_profit: false };

// --------------------------------------------------------------- primitives

/** Python's `str.rjust`/format `>`: pads, never truncates. */
function rjust(s, w) {
  return String(s).padStart(w);
}

/** Python's `str.ljust`/format `<`. */
function ljust(s, w) {
  return String(s).padEnd(w);
}

/**
 * Python's `sorted(xs, key=...)`, ascending. V8's sort is stable and so is
 * Python's, so a three-way comparator on the key reproduces it. String keys are
 * compared with `<`/`>`: Python orders by code POINT and JS by UTF-16 code
 * UNIT, which disagree only above the BMP. Every key sorted here is an ASCII
 * ticker or an ISO date.
 */
function sortedBy(xs, key) {
  return xs.slice().sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/**
 * Python's `sorted(xs, key=..., reverse=True)`. NOT `sortedBy(...).reverse()`:
 * `reverse=True` still keeps equal elements in their original relative order,
 * whereas reversing afterwards would flip them.
 */
function sortedByDesc(xs, key) {
  return xs.slice().sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return kb < ka ? -1 : kb > ka ? 1 : 0;
  });
}

/**
 * Python's `max(iterable, default=...)` over strings. `Math.max` is numeric and
 * would give NaN here.
 */
function maxOrDefault(xs, dflt) {
  let best = dflt;
  let seen = false;
  for (const x of xs) {
    if (!seen || x > best) {
      best = x;
      seen = true;
    }
  }
  return best;
}

/**
 * Python's `str(exception)`, which is the message alone. `String(err)` would
 * prepend "Error: " and change every NO DATA line, so it is only the fallback
 * for a thrown non-Error (Python can raise those too, via a bare object with
 * __str__; JS code throws strings).
 */
function pyStrException(e) {
  return e instanceof Error ? e.message : String(e);
}

/** Python's `x or 0` for a float-or-None. NaN is truthy in Python, so it survives. */
function orZero(x) {
  // `x === 0` is true for -0 as well, which is what we want: -0.0 is falsy in
  // Python, so `-0.0 or 0` is the int 0 and formats as "+0.0", not "-0.0".
  return x === null || x === undefined || x === 0 ? 0 : x;
}

// ------------------------------------------------------------------ symbols

/**
 * Port of `symbols()`.
 *
 * `csvReader`/`dictReader` are positions.mjs's port of the csv module, reused
 * here so the watchlist is parsed by exactly the same rules as positions.csv.
 * Python opens in text mode with newline=None, which folds \r\n and lone \r to
 * \n before csv sees them.
 *
 * @param {string} [listPath=DEFAULT_LIST]
 * @returns {Array<[string, string]>} [ticker, symbol] pairs, file order.
 */
export function symbols(listPath = DEFAULT_LIST) {
  const text = readFileSync(listPath, 'utf8').replace(/\r\n?/g, '\n');
  const out = [];
  for (const r of dictReader(csvReader(text))) {
    out.push([r.get('ticker'), r.get('symbol')]);
  }
  return out;
}

// ----------------------------------------------------------- position state

/**
 * Port of `position_state(fills, last_bar)`.
 *
 * Group fills by the bar the position opened on. A group with no terminal fill
 * is the position that is still open. Grouping on the ENTRY rather than on
 * going flat is the same rule the Pine panel uses, and for the same reason: an
 * exit and an entry can land on one bar, and booking on flatness merges two
 * trades into one that never happened.
 */
export function position_state(fills, last_bar) {
  function real_exit(x) {
    if (TERMINAL.has(x['why'])) {
      return true;
    }
    // an 'end' fill on any bar BUT the last one is a genuine window close
    return x['why'] === MTM && x['date'] !== last_bar;
  }

  // A Map, not an object: see the ORDERED MAPPINGS note in the header.
  const groups = new Map();
  for (const f of fills) {
    if (!groups.has(f['entry_date'])) groups.set(f['entry_date'], []);
    groups.get(f['entry_date']).push(f);
  }
  // `sorted(groups, reverse=True)` iterates the KEYS, descending.
  for (const ed of sortedByDesc([...groups.keys()], (k) => k)) {
    const g = groups.get(ed);
    if (!g.some((x) => real_exit(x))) {
      return {
        open: true,
        entry_date: ed,
        entry: g[0]['entry'],
        rungs: sortedBy(
          g.filter((x) => x['why'].startsWith('TP')).map((x) => x['why']),
          (w) => w
        ),
      };
    }
    break; // only the most recent group can be open
  }
  return { open: false };
}

// --------------------------------------------------------------------- scan

/**
 * Port of `scan(tier_cfg, start, end, keep=None)`.
 *
 * @param {object} tier_cfg
 * @param {string} start 'YYYY-MM-DD'
 * @param {string} end 'YYYYMMDD' — see the defect note in morning-report.mjs
 * @param {Map<string, Array>|null} [keep=null] filled in with the last 160 bars
 *   per ticker. A Map because the Python dict is keyed by ticker.
 * @param {string} [listPath=DEFAULT_LIST]
 * @param {string} [cacheDir=DEFAULT_CACHE_DIR]
 */
export async function scan(
  tier_cfg,
  start,
  end,
  keep = null,
  listPath = DEFAULT_LIST,
  cacheDir = DEFAULT_CACHE_DIR
) {
  keep = keep === null || keep === undefined ? new Map() : keep;
  const rows = [];
  for (const [tkr, tvsym] of symbols(listPath)) {
    let bars;
    try {
      bars = await yahooDaily(tkr, '19990101', end, 3, cacheDir);
    } catch (e) {
      // `str(e)[:60]` slices CHARACTERS in Python and UTF-16 units here. Yahoo
      // error text is ASCII, so the two agree.
      rows.push({ sym: tkr, tv: tvsym, error: pyStrException(e).slice(0, 60) });
      continue;
    }
    // `not bars` is True for an empty list in Python but `![]` is false in JS,
    // so the emptiness test is spelled out. (`length < 300` subsumes it; both
    // are kept so the condition still reads like the Python.)
    //
    // The array test is the part that actually matters, and it was missing.
    // Truthiness diverges for NON-ARRAYS too: a malformed cache file makes
    // yahooDaily return `{}`, and `!{}` is false, `{}.length === 0` is false,
    // and `undefined < 300` is false — so a single bad file fell through to
    // the engine with a non-array and took all 74 symbols down with it,
    // instead of marking that one symbol "no data" as Python does.
    if (!Array.isArray(bars) || bars.length < 300) {
      rows.push({ sym: tkr, tv: tvsym, error: 'no data' });
      continue;
    }
    const cfg = Object.assign({}, tier_cfg, { start: start });
    const r = mcats.run(bars, cfg, 1440, 100.0, 10000.0, 0.001, false);
    const p = mcats.prepare(bars, cfg, 1440, false);
    const last = bars[bars.length - 1];
    const prev = bars[bars.length - 2];
    const st = position_state(r['fills'], last['date']);
    const trend = p['trend'][p['trend'].length - 1];
    // NO EXIT LEVEL COLUMN, and that is deliberate. supertrend_vegas()
    // returns the DIRECTION only; the line itself is never exposed by the
    // engine. Recomputing it here would be a second implementation of the
    // one number the whole system exits on, and a private copy that drifts
    // from the engine is the exact defect shape this project keeps finding.
    // The line is drawn on the chart. Open the name in TradingView to see
    // where the trade ends: that is the division of labour this report is
    // built around.
    const entered = r['fills'].filter((f) => f['entry_date'] === last['date']);
    const closed = r['fills'].filter(
      (f) => f['date'] === last['date'] && TERMINAL.has(f['why'])
    );
    const trimmed = r['fills'].filter(
      (f) => f['date'] === last['date'] && f['why'].startsWith('TP')
    );
    keep.set(tkr, bars.slice(-160));
    rows.push({
      sym: tkr,
      tv: tvsym,
      bar: last['date'],
      close: last['close'],
      chg: prev['close'] ? (last['close'] / prev['close'] - 1) * 100 : 0.0,
      trend: trend,
      open: st['open'],
      // `st.get('entry_date')` — absent means None, which is null here.
      entry_date: st['open'] ? st['entry_date'] : null,
      entry: st['open'] ? st['entry'] : null,
      rungs: st['open'] ? st['rungs'] : [],
      unreal:
        st['open'] && st['entry'] ? (last['close'] / st['entry'] - 1) * 100 : null,
      entered_today: entered.length > 0,
      closed_today: closed.length ? closed[0]['why'] : null,
      trimmed_today: trimmed.map((f) => f['why']),
    });
  }
  return rows;
}

// ------------------------------------------------------------- demo payload

/**
 * Enough to hold a run-up plus a trade that has been open a couple of years.
 * It is a safety valve on the SVG, not a readability rule: the readability rule
 * is that the demo prefers a live entry and then the most recent open position.
 */
export const MAX_DEMO_BARS = 600;

/**
 * Port of `demo_payload(rows, bars_by_sym)`.
 *
 * The one trade the brief walks through, with enough price history to draw it.
 * A worked example told in numbers is a table; told on a chart it is the thing
 * the customer recognises from their own screen.
 *
 * Prefers a LIVE entry from the last bar. Failing that the MOST RECENT open
 * position, which is a deliberate choice over the biggest winner.
 *
 * The first version picked the position with the most ladder progress and drew
 * MU: entered at 102 and now near 880. A 758% winner is a lovely number and a
 * useless chart, because the four rungs sit at +1.5 to +12% and collapse into a
 * single line at the bottom of a frame eight times taller. A recent entry keeps
 * the entry, all four targets and the current price in one readable range,
 * which is what the picture is for.
 *
 * @param {Array<object>} rows
 * @param {Map<string, Array>} bars_by_sym
 */
export function demo_payload(rows, bars_by_sym) {
  // `'error' not in r` — a key test, not a truthiness test.
  const ok = rows.filter((r) => !('error' in r));
  const new_ = ok.filter((r) => r['entered_today']);
  const pool = new_.length
    ? new_
    : sortedByDesc(
        ok.filter((r) => r['open']),
        // key is the 1-tuple `(r.get('entry_date') or '',)`. A single-element
        // tuple orders exactly as its element.
        (r) => r['entry_date'] || ''
      );
  if (!pool.length) {
    return null;
  }
  const r = pool[0];
  const bars = bars_by_sym.get(r['sym']) || [];
  if (!bars.length) {
    return null;
  }

  // WHERE THE ENTRY IS, and the window is built OUTWARD FROM IT.
  // The previous version took bars[i0:] and then sliced win[-140:]. The entry
  // sits at position 90 inside that window, so it survived only while fewer
  // than about 140 bars had passed since it. On any morning with no live entry
  // the demo falls back to the most recent OPEN position, which is routinely
  // older than that, and the entry fell off the chart completely: the card
  // then showed a table saying "entry 102.25, now 877.57" above a picture of
  // an unrelated stretch of tape. That is what shipped on 2026-08-07.
  const entry = r['entry_date'];
  let ei = 0;
  if (entry) {
    // `next((i for i, b in ... if b['date'] >= entry), 0)`
    ei = 0;
    for (let i = 0; i < bars.length; i++) {
      if (bars[i]['date'] >= entry) {
        ei = i;
        break;
      }
    }
  }

  // 90 bars of run-up: enough that the trend the system entered on is visible,
  // not just the trade itself. The cap trims the RUN-UP, never the trade.
  let i0 = Math.max(0, ei - 90);
  let win = bars.slice(i0);
  if (win.length > MAX_DEMO_BARS) {
    i0 = Math.max(0, bars.length - MAX_DEMO_BARS);
    win = bars.slice(i0);
  }

  const drawn = win.map((b) => ({
    d: b['date'],
    o: b['open'],
    h: b['high'],
    l: b['low'],
    c: b['close'],
  }));
  // Say whether the entry is actually in frame rather than leaving the reader
  // to notice it is not. A window that cannot contain its own entry is a
  // different picture and the caption has to change with it.
  const shown =
    drawn.length > 0 &&
    (!entry || (drawn[0]['d'] <= entry && entry <= drawn[drawn.length - 1]['d']));
  return {
    sym: r['sym'],
    tv: r['tv'],
    live: new_.length > 0,
    entry_date: r['entry_date'],
    entry: r['entry'],
    close: r['close'],
    unreal: r['unreal'],
    rungs: r['rungs'] || [],
    entry_in_frame: shown,
    bars: drawn,
  };
}

// ------------------------------------------------------------------- render

/**
 * Port of `render(rows, slots, tier, start, end)`.
 *
 * CHARACTER FOR CHARACTER with the Python. Every implicit string concatenation
 * in the source is reproduced as one JS string so the spacing at each join is
 * visible rather than inferred, and every number goes through `pyFormat`.
 *
 * `start` and `end` are accepted and unused, exactly as in the Python.
 */
export function render(rows, slots, tier, start, end) {
  const ok = rows.filter((r) => !('error' in r));
  const bad = rows.filter((r) => 'error' in r);
  const held = ok.filter((r) => r['open']);
  const new_ = ok.filter((r) => r['entered_today']);
  const out = ok.filter((r) => r['closed_today']);
  const trim = ok.filter((r) => r['trimmed_today'].length > 0);
  const bar = maxOrDefault(
    ok.map((r) => r['bar']),
    '?'
  );

  const L = [];
  L.push(`TC-TIDE MORNING REPORT   Tier ${tier}   bar ${bar}`);
  L.push(`${ok.length} names scanned, ${held.length} currently long, ` + `${slots} slots`);
  L.push('');

  if (out.length) {
    L.push(`CLOSED ON THE LAST BAR (${out.length})`);
    for (const r of sortedBy(out, (x) => x['sym'])) {
      L.push(
        `  ${ljust(r['tv'], 14)} ${rjust(pyFormat(r['close'], 2, false, true), 10)}  ` +
          `${rjust(pyFormat(r['chg'], 1, true), 6)}%   exit: ${r['closed_today']}`
      );
    }
    L.push('');
  }

  if (new_.length) {
    L.push(`NEW ENTRIES ON THE LAST BAR (${new_.length})`);
    for (const r of sortedBy(new_, (x) => x['sym'])) {
      L.push(
        `  ${ljust(r['tv'], 14)} ${rjust(pyFormat(r['close'], 2, false, true), 10)}  ` +
          `${rjust(pyFormat(r['chg'], 1, true), 6)}%   open it in TradingView for the ` +
          `exit line`
      );
    }
    L.push('');
  }

  // Integer subtraction, exact in both languages.
  const free = slots - held.length;
  L.push(`SLOTS   ${held.length} of ${slots} filled, ` + `${Math.max(0, free)} free`);
  if (free < 0) {
    L.push(
      `  NORMAL, NOT AN ERROR. The watchlist has ${held.length} names ` +
        `in a live trade and you run ${slots} of them. You are meant ` +
        `to hold a subset.`
    );
    L.push(
      `  There is NO MEASURED RULE for choosing which ${slots}. ` +
        `Four ranking rules were tested on TC-DIP (tightest stop, ` +
        `widest stop, cheapest share, first come) and none beat ` +
        `first come in either period. The list below is sorted by ` +
        `unrealised gain, which is a display order and not a ` +
        `recommendation.`
    );
    L.push(
      '  What IS measured: which ones you pick moved the ten-year ' +
        'result by 3.21x at 8 slots and 1.49x at 20. The cost of ' +
        'choosing badly falls as the slot count rises. That is the ' +
        'argument for running more of them, not for choosing better.'
    );
    L.push(
      '  And do not rotate out of a live trade to fund a fresh ' +
        'signal. Nothing here was tested that way.'
    );
  } else if (new_.length && free < new_.length) {
    L.push(
      `  ${new_.length} new signals and ${free} free slots. ` +
        `The tie-break is arbitrary and measurably so: which ones you ` +
        `take moved the ten-year result by 3.21x at 8 slots. Pick any ` +
        `rule and keep it.`
    );
  }
  L.push('');

  if (trim.length) {
    L.push(`TARGETS FILLED ON THE LAST BAR (${trim.length})`);
    for (const r of sortedBy(trim, (x) => x['sym'])) {
      L.push(`  ${ljust(r['tv'], 14)} ${r['trimmed_today'].join(', ')}`);
    }
    L.push('');
  }

  L.push(`HOLDING (${held.length})`);
  L.push(
    `  ${ljust('symbol', 14)}${rjust('close', 10)}${rjust('chg', 8)}${rjust('in from', 12)}` +
      `${rjust('entry', 10)}${rjust('unreal', 9)}  rungs`
  );
  // `key=lambda x: -(x['unreal'] or 0)` — a NUMERIC key, so the comparison is
  // numeric and not the string ordering sortedBy uses for the other tables.
  for (const r of sortedBy(held, (x) => -orZero(x['unreal']))) {
    L.push(
      `  ${ljust(r['tv'], 14)}${rjust(pyFormat(r['close'], 2, false, true), 10)}` +
        `${rjust(pyFormat(r['chg'], 1, true), 7)}%` +
        `${rjust(r['entry_date'], 12)}${rjust(pyFormat(r['entry'], 2, false, true), 10)}` +
        `${rjust(pyFormat(orZero(r['unreal']), 1, true), 8)}%  ` +
        `${r['rungs'].join(' ')}`
    );
  }
  L.push('');

  const flat_up = ok.filter((r) => !r['open'] && r['trend'] === 1);
  if (flat_up.length) {
    L.push(`IN AN UPTREND BUT NOT IN A TRADE (${flat_up.length})`);
    L.push(
      '  A filter is holding the system out, or the trade already ' +
        'closed and the trend has not turned yet.'
    );
    L.push('  ' + sortedBy(flat_up, (x) => x['sym']).map((r) => r['sym']).join('  '));
    L.push('');
  }

  if (bad.length) {
    L.push(
      `NO DATA (${bad.length}): ` + bad.map((r) => `${r['sym']} (${r['error']})`).join(', ')
    );
    L.push('');
  }

  L.push('Prices are Yahoo daily closes for the bar shown, not live quotes.');
  L.push(
    'Entries and exits happen at the CLOSE of the bar that signalled ' +
      'them, so this report describes a decision you act on next open.'
  );
  return L.join('\n');
}

// --------------------------------------------------------------------- main

/**
 * Port of `main()`, minus argparse (which morning-report.mjs owns) and minus
 * the two `print` calls, which the CLI makes so this stays usable in-process.
 *
 * DELIBERATE ADDITION, the only behavioural change in this file: the returned
 * OBJECT carries `noDataCount`, the number of scanned symbols that produced no
 * bars. It is not in `payload`, so the written file matches the Python's key for
 * key. The Python has no equivalent and no way to signal total failure — a run
 * where EVERY symbol fails prints a well-formed report listing all of them
 * under NO DATA and exits 0, which was reproduced live on this machine. Turning
 * that into a non-zero exit is the CLI's job and only the CLI's job: a library
 * function that calls process.exit is unusable from a server. The report text
 * is byte-identical either way.
 *
 * @param {object} a Parsed options: {tier, slots, start, end, jsonout}.
 * @param {object} [paths]
 * @returns {Promise<{text: string, payload: object, noDataCount: number,
 *                    scanned: number, jsonout: string|null}>}
 */
export async function main(a, paths = {}) {
  const listPath = paths.listPath || DEFAULT_LIST;
  const cacheDir = paths.cacheDir || DEFAULT_CACHE_DIR;
  const positionsPath = paths.positionsPath || DEFAULT_POSITIONS;

  const bars_by_sym = new Map();
  const rows = await scan(
    a.tier === 1 ? TIER1 : TIER2,
    a.start,
    a.end,
    bars_by_sym,
    listPath,
    cacheDir
  );
  // State of play first, because it is what a person reads before deciding
  // anything, and it costs eight requests against seventy-four.
  const mkt = await MO.read(a.end, cacheDir);
  const held_by_me = POS.load(positionsPath);

  const text = render(rows, a.slots, a.tier, a.start, a.end);

  // ADDED, and computed unconditionally because it is a filter over `rows` that
  // costs nothing and the CLI needs it whether or not --json was passed.
  const noDataCount = rows.filter((r) => 'error' in r).length;

  // The payload is built ONLY under --json, because that is where the Python
  // builds it: summarise(), pressure() and demo_payload() are arguments to the
  // json.dump call inside `if a.jsonout:` and never run otherwise. Hoisting
  // them out would change both the cost of a plain run and which exceptions it
  // can raise.
  let payload = null;
  if (a.jsonout) {
    // `{k: v for k, v in held_by_me.items() if not k.startswith('__')}`. The
    // Map becomes a plain object because it has to be JSON. That reintroduces
    // the integer-like-key reordering the Map existed to avoid, but a JSON
    // object has no ordering guarantee anyway, so nothing downstream can
    // depend on it.
    const mine = {};
    for (const [k, v] of held_by_me) {
      if (!k.startsWith('__')) mine[k] = v;
    }
    payload = {
      tier: a.tier,
      slots: a.slots,
      rows: rows,
      market: mkt,
      market_summary: MO.summarise(mkt),
      pressure: MO.pressure(mkt),
      demo: demo_payload(rows, bars_by_sym),
      mine: mine,
    };
    // `noDataCount` IS NOT IN THE PAYLOAD, deliberately. An earlier version
    // appended it here; that made the written file differ from the Python's by
    // one key, which is a real fidelity break for anything that hashes or
    // byte-compares the artefact. The count is on the RETURN VALUE below, which
    // is what the CLI reads to set its exit status, so nothing was lost.
  }

  return {
    text: text,
    payload: payload,
    noDataCount: noDataCount,
    scanned: rows.length,
    jsonout: a.jsonout || null,
  };
}

// ------------------------------------------------------- json.dump(indent=1)

/**
 * `repr()` of a Python float, which is what `json` writes for one.
 *
 * WHY THIS EXISTS. Python has two numeric types and JS has one, so `1.0` and
 * `1` are the same value here and two different literals there. Left to
 * `JSON.stringify`, every whole-valued float in the payload came out as `861`
 * where the Python wrote `861.0` — measured at 122 places in a single run
 * against the pinned reference. No VALUE was ever wrong; the type was.
 *
 * Both languages pick the SHORTEST digit string that round-trips, so the digits
 * always agree and only the presentation has to be reproduced:
 *
 *   - a whole float keeps its `.0`             (Python `861.0`, JS `861`)
 *   - `-0.0` keeps its sign                    (Python `-0.0`,  JS `0`)
 *   - the fixed/exponential switch is at a different place: CPython goes
 *     exponential when the decimal point sits at or left of -4, or right of 16;
 *     JS at -6 and 21. So 5e-5 is `5e-05` there and `0.00005` here, and 1e16 is
 *     `1e+16` there and `10000000000000000` here.
 *   - CPython pads the exponent to two digits and always signs it: `1e-07`,
 *     never JS's `1e-7`.
 *
 * `toExponential()` with no argument is specified to emit exactly the digits
 * needed to identify the double, which is the same shortest-round-trip string
 * CPython's dtoa produces; everything below is regrouping those digits.
 *
 * Verified by round-trip against CPython over the 37 boundary cases named above
 * plus 40,000 pseudo-random doubles spanning 1e-30 to 1e30: 40,037 checked, 0
 * disagreements with `repr()`.
 */
export function pyFloatRepr(x) {
  // json.dump writes these bare, and they are not valid JSON. Reproduced
  // rather than fixed: the Python emits them and a caller diffing the two
  // files should see the same breakage, not a silently different one.
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';

  const neg = x < 0 || Object.is(x, -0);
  const sign = neg ? '-' : '';
  const a = Math.abs(x);
  if (a === 0) return sign + '0.0';

  const m = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(a.toExponential());
  const digits = m[1] + (m[2] || '');
  const decpt = Number(m[3]) + 1; // digits that belong before the point

  if (decpt <= -4 || decpt > 16) {
    const e = decpt - 1;
    const frac = digits.slice(1);
    return (
      sign + digits[0] + (frac ? '.' + frac : '') +
      'e' + (e < 0 ? '-' : '+') + String(Math.abs(e)).padStart(2, '0')
    );
  }
  if (decpt <= 0) return sign + '0.' + '0'.repeat(-decpt) + digits;
  if (decpt >= digits.length) {
    return sign + digits + '0'.repeat(decpt - digits.length) + '.0';
  }
  return sign + digits.slice(0, decpt) + '.' + digits.slice(decpt);
}

/**
 * A float on its way into the JSON text, wrapped in U+0001 so `JSON.stringify`
 * carries it as a string and `writeJson` can unwrap it afterwards. U+0001 is
 * escaped as `\u0001` in the output and cannot occur in a ticker, a date or the
 * English prose in this file, so the unwrap below cannot hit anything else.
 * `null` passes through: every optional number in this payload is `None` in the
 * Python, never `0.0`.
 */
const PYF = '\u0001';
const F = (v) => (typeof v === 'number' ? PYF + pyFloatRepr(v) + PYF : v);

/**
 * Tag every number in the payload with the Python type it has on the other
 * side. Only three fields are genuinely `int` there:
 *
 *   tier, slots      argparse `type=int`
 *   rows[].trend     `cur` in supertrend_vegas() is literal 1 / -1
 *
 * ...plus one that is int only SOMETIMES. `pressure()` writes Momentum and
 * Dollar as `max(0, min(100, <float>))`, and Python's min/max return the FIRST
 * of two equal arguments, so a pinned component yields the int literal `0` or
 * `100` while an unpinned one stays a float. That is exactly "the value is 0 or
 * 100", so it is decidable here. Trend and Volatility are `n / len * 100` and
 * `100 - pct`, which are float even at 0.0 and 100.0 — hence the test on `k`
 * and not on the number alone.
 *
 * Spreading and then reassigning an existing key leaves it in its original
 * position, so key order is untouched.
 */
function markFloats(p) {
  const out = { tier: p.tier, slots: p.slots }; // ints
  out.rows = p.rows.map((r) =>
    'error' in r // {sym, tv, error} — nothing numeric
      ? r
      : { ...r, close: F(r.close), chg: F(r.chg), entry: F(r.entry), unreal: F(r.unreal) }
  );
  out.market = p.market.map((m) => ({
    ...m,
    close: F(m.close), chg: F(m.chg), chg5: F(m.chg5),
    ma20: F(m.ma20), ma50: F(m.ma50), pct: F(m.pct),
    hi: F(m.hi), lo: F(m.lo), spark: m.spark.map(F),
  }));
  out.market_summary = p.market_summary;
  out.pressure = {
    ...p.pressure,
    score: F(p.pressure.score),
    components: p.pressure.components.map((c) => ({
      ...c,
      v:
        (c.k === 'Momentum' || c.k === 'Dollar') && (c.v === 0 || c.v === 100)
          ? c.v // pinned by max()/min(), so an int on the Python side
          : F(c.v),
    })),
  };
  out.demo = p.demo && {
    ...p.demo,
    entry: F(p.demo.entry), close: F(p.demo.close), unreal: F(p.demo.unreal),
    bars: p.demo.bars.map((b) => ({ ...b, o: F(b.o), h: F(b.h), l: F(b.l), c: F(b.c) })),
  };
  out.mine = {};
  for (const [k, v] of Object.entries(p.mine)) {
    out.mine[k] = { ...v, shares: F(v.shares), entry_price: F(v.entry_price) };
  }
  return out;
}

/**
 * Port of the `json.dump(..., indent=1)` call. Python's default separators
 * under `indent` are (',', ': '), which is what JSON.stringify emits, and
 * neither writes a trailing newline. Python defaults to ensure_ascii=True and
 * would \u-escape non-ASCII; JS does not. Every string in the payload is a
 * ticker, an ISO date or English prose from this file, so the two agree.
 *
 * Indentation and string escaping stay JSON.stringify's, which is already
 * byte-identical to the Python's; only the numbers are re-rendered, by
 * `markFloats` above and the unwrap below. `writeJson` is therefore specific to
 * THIS payload and not a general Python-flavoured JSON writer.
 */
export function writeJson(path, payload) {
  // `[^"\\]*` cannot run past the closing marker: JSON.stringify writes U+0001
  // as a six-character backslash escape, and backslash is outside the class.
  const text = JSON.stringify(markFloats(payload), null, 1).replace(
    /"\\u0001([^"\\]*)\\u0001"/g,
    '$1'
  );
  writeFileSync(path, text);
}
