/**
 * Ported from tools/market_overview.py (skills/market-open-report).
 *
 * State of play: the eight instruments Sean reads before the open.
 *
 *     node marketOverview.js <cacheDir>
 *
 * E-mini S&P, Dow, Nasdaq and Russell, plus crude, gold, the VIX and the dollar.
 *
 * THE SUMMARY IS DESCRIPTIVE AND IT HAS TO STAY THAT WAY. Everything in the
 * paragraph is a measured fact about closes that have already happened: how many
 * index futures are up, which leads, where the VIX sits in its own trailing year,
 * whether the dollar rose. There is no forecast, no "suggests", no "looks poised
 * to". The moment a morning brief starts predicting, every claim in the rest of it
 * inherits that credibility problem, and this project has spent its whole life
 * removing claims that could not be checked.
 *
 * Percentile rather than a level for the VIX, because 14.9 means nothing on its
 * own and "lower than 82% of the past year" means something to everybody.
 *
 * PORTING NOTES (read before editing):
 *   - `sma` below is market_overview.py's own local scalar SMA (mean of the last
 *     n values). It is deliberately NOT imported from ./indicators.js: the SMAs
 *     over there are the rolling running-sum series from mcats/mtvegas/dip_engine,
 *     which return an array and accumulate their total across the whole input.
 *     A running sum visits the addends in a different order and therefore lands
 *     on different last digits than sum(xs[-n:]). Same name, different function.
 *   - Every `:.1f` / `:.0f` / `:,.2f` in the Python is round-half-to-EVEN.
 *     JS toFixed rounds half away from zero, so all formatting goes through
 *     pyFormat() below. `1y pctile` genuinely lands on exact .5 ties (a 200-bar
 *     trailing year makes every percentile a multiple of 0.5), so this matters.
 *   - Every float sum() goes through pySum(), NOT `+=`. CPython 3.12+ sums
 *     floats with Neumaier compensated summation, so a plain accumulator is off
 *     by an ulp: the 2026-08-11 PRESSURE score reproduced as 79.83556216567526
 *     against Python's 79.83556216567527 until this was fixed. The components
 *     there span 54..100, which is all it takes. sma() sums closes of near
 *     identical magnitude, where the compensation term has so far always come
 *     out zero (17,974 windows checked, naive and compensated agreed on every
 *     one) — but it is the same builtin, so it gets the same treatment rather
 *     than a bet that the inputs stay well conditioned.
 *
 * ONE FORCED SIGNATURE CHANGE. yahooData.js takes its cache directory as a
 * parameter (the Python hardcoded a sibling of the source file, which cannot
 * work inside a read-only app resources directory), and it THROWS when that
 * argument is missing. read() therefore takes `cacheDir` as a trailing
 * argument and hands it straight through. It is validated before the loop, not
 * inside it: the per-symbol `try` below is Python's blanket `except Exception:
 * continue`, so a missing cacheDir would otherwise be swallowed eight times
 * over and surface as a clean, empty, entirely wrong report.
 */
import { pathToFileURL } from 'node:url';

import { yahooDaily } from './yahooData.js';

export const MARKETS = [
  ['ES=F', 'S&P 500', 'E-mini future', 'equity'],
  ['NQ=F', 'Nasdaq', 'E-mini future', 'equity'],
  ['YM=F', 'Dow', 'E-mini future', 'equity'],
  ['RTY=F', 'Russell', 'E-mini future', 'equity'],
  ['CL=F', 'Crude', 'WTI future', 'commodity'],
  ['GC=F', 'Gold', 'COMEX future', 'commodity'],
  ['^VIX', 'VIX', 'volatility index', 'vol'],
  ['DX-Y.NYB', 'Dollar', 'DXY index', 'fx'],
];

// ---------------------------------------------------------------- formatting

/**
 * The exact decimal a Python format spec would produce, sign excluded.
 *
 * toFixed() already rounds on the EXACT binary value of the double (so 1.115,
 * which is really 1.11499999..., correctly gives "1.11" and not "1.12" the way
 * a naive x*100 rescale would). Its single disagreement with Python is the
 * exact tie: toFixed goes half away from zero, Python goes half to even. So
 * probe 20 guard digits past the cut; a true tie reads "5" then only zeros,
 * while a near-tie shows itself (8.835 probes as 8.83500000000000085...).
 */
function pyFixed(a, digits) {
  if (Number.isNaN(a)) return 'nan';
  if (!Number.isFinite(a)) return 'inf';
  // toFixed switches to exponential notation at 1e21 and the probe below would
  // mis-parse. Nothing in this table is remotely that large.
  if (a >= 1e21) return a.toFixed(digits);
  const probe = a.toFixed(Math.min(100, digits + 20));
  const dot = probe.indexOf('.');
  const tail = probe.slice(dot + 1 + digits);
  if (!/^50*$/.test(tail)) return a.toFixed(digits);
  // Exact tie: truncate, then step up only when the kept digit is odd.
  const kept = digits === 0 ? probe.slice(0, dot) : probe.slice(0, dot + 1 + digits);
  const last = kept.charCodeAt(kept.length - 1) - 48;
  return last % 2 === 0 ? kept : bumpLastDigit(kept);
}

/** Add one unit in the last decimal place of a plain decimal string. */
function bumpLastDigit(s) {
  const d = s.split('');
  for (let i = d.length - 1; i >= 0; i--) {
    if (d[i] === '.') continue;
    if (d[i] === '9') {
      d[i] = '0';
      continue;
    }
    d[i] = String.fromCharCode(d[i].charCodeAt(0) + 1);
    return d.join('');
  }
  return '1' + d.join('');
}

function groupThousands(s) {
  const dot = s.indexOf('.');
  const int = dot < 0 ? s : s.slice(0, dot);
  const rest = dot < 0 ? '' : s.slice(dot);
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + rest;
}

/**
 * Python's `format(x, '[+][,].Nf')`. The sign comes from the value, not from
 * the rounded magnitude, which is why -0.04 at one decimal prints "-0.0" in
 * both languages.
 */
export function pyFormat(x, digits, plus = false, comma = false) {
  if (Number.isNaN(x)) return plus ? '+nan' : 'nan';
  const neg = x < 0 || Object.is(x, -0);
  let s = pyFixed(Math.abs(x), digits);
  if (comma) s = groupThousands(s);
  return (neg ? '-' : plus ? '+' : '') + s;
}

// ---------------------------------------------------------------- primitives

/**
 * Python's max()/min() with a key return the FIRST extreme on a tie; a plain
 * reduce with a non-strict comparison would return the last. Both throw on an
 * empty sequence, and so does this.
 */
function maxBy(xs, key) {
  return xs.reduce((best, x) => (key(x) > key(best) ? x : best));
}

function minBy(xs, key) {
  return xs.reduce((best, x) => (key(x) < key(best) ? x : best));
}

/**
 * Python's builtin sum() over floats: improved Kahan-Babuska (Neumaier)
 * compensated summation, which CPython 3.12+ uses on the float fast path. A
 * plain left-to-right accumulator is NOT the same function: on real data it put
 * the PRESSURE score an ulp low. Checked bit-for-bit against CPython 3.14 over
 * every 20- and 50-close window of all eight instruments, plus the score and
 * momentum sums. See the header note.
 */
function pySum(xs) {
  let f = 0.0;
  let c = 0.0;
  for (const x of xs) {
    const t = f + x;
    if (Math.abs(f) >= Math.abs(x)) c += (f - t) + x;
    else c += (x - t) + f;
    f = t;
  }
  return f + c;
}

export function sma(xs, n) {
  // sum(xs[-n:]) / n
  return xs.length >= n ? pySum(xs.slice(-n)) / n : null;
}

export async function read(end, cacheDir) {
  // Checked here, outside the per-symbol catch, so it cannot masquerade as
  // "no market data available" — see the header note.
  if (typeof cacheDir !== 'string' || cacheDir === '') {
    throw new Error('read: cacheDir is required (app-owned cache directory)');
  }
  const out = [];
  for (const [sym, name, desc, kind] of MARKETS) {
    let b;
    try {
      b = await yahooDaily(sym, '20220101', end, 3, cacheDir);
    } catch {
      continue;
    }
    // Python's `not b or len(b) < 60`, translated properly.
    //
    // The length test does NOT cover it, which is what the previous comment
    // here got wrong. Truthiness is where these two languages part company:
    // in Python an empty dict, list or string is FALSY, in JavaScript `{}` and
    // `[]` are both TRUTHY. A malformed cache file makes both implementations
    // return `{}` — they agree that far — and then Python's `not b` is true and
    // it continues, while `!{}` is false, `{}.length` is undefined, and
    // `undefined < 60` is false, so JS fell through to `b.map` and took the
    // whole report down with a TypeError. Verified against the Python on an
    // identical malformed cache: Python returned 0 rows, this crashed.
    //
    // Testing for an array is stricter than Python and deliberately so: every
    // line below requires one. The only input where the two now differ is a
    // non-array of length >= 60, and Python crashes on that too — outside its
    // try, so it is no better protected there.
    if (!Array.isArray(b) || b.length < 60) continue;
    const c = b.map((x) => x.close);
    const yr = c.length >= 252 ? c.slice(-252) : c;
    let below = 0;
    for (const x of yr) if (x < c[c.length - 1]) below += 1;
    out.push({
      sym, name, desc, kind,
      bar: b[b.length - 1].date,
      close: c[c.length - 1],
      // c[-2] and c[-6] are non-zero: yahooDaily drops any bar with close <= 0.
      // Python would raise ZeroDivisionError here, JS would yield Infinity.
      chg: c.length > 1 ? (c[c.length - 1] / c[c.length - 2] - 1) * 100 : 0.0,
      chg5: c.length > 5 ? (c[c.length - 1] / c[c.length - 6] - 1) * 100 : 0.0,
      ma20: sma(c, 20), ma50: sma(c, 50),
      // where this close sits inside its own trailing year
      pct: below / yr.length * 100,
      hi: Math.max(...yr), lo: Math.min(...yr),
      // 60 closes for the sparkline. Real series, not decoration: the
      // shape of the last quarter is the context a single day change
      // cannot give you.
      spark: c.slice(-60),
    });
  }
  return out;
}

/**
 * A 0-100 risk-on reading, AND the four things that made it.
 *
 * A gauge that hides its inputs is a horoscope. Every component below is a
 * plain measurement with a stated direction, the weights are equal and
 * declared, and the components are rendered beside the dial so a reader can
 * disagree with the composite and still use the parts. Nothing here forecasts
 * anything: it describes where four measurable things closed.
 */
export function pressure(rows) {
  const by = new Map(rows.map((r) => [r.name, r]));
  const eq = rows.filter((r) => r.kind === 'equity');
  const comp = [];

  if (eq.length) {
    // `r.ma50 && ...` reproduces Python's truthiness exactly: null is falsy in
    // both, and so is a 0.0 average.
    const n = eq.filter((r) => r.ma50 && r.close > r.ma50).length;
    comp.push({ k: 'Trend', v: n / eq.length * 100,
      label: `${n} of ${eq.length} index futures above their 50-day` });
    const mom = pySum(eq.map((r) => r.chg5)) / eq.length;
    // +-3% over five days spans the scale; beyond that it is pinned
    comp.push({ k: 'Momentum', v: Math.max(0, Math.min(100, 50 + mom / 3 * 50)),
      label: `index futures ${pyFormat(mom, 1, true)}% over five days` });
  }

  const v = by.get('VIX');
  if (v) {
    // low VIX percentile = risk on, so the scale is inverted
    comp.push({ k: 'Volatility', v: 100 - v.pct,
      label: `VIX at ${pyFormat(v.close, 1)}, calmer than `
           + `${pyFormat(100 - v.pct, 0)}% of its year` });
  }
  const d = by.get('Dollar');
  if (d) {
    comp.push({ k: 'Dollar', v: Math.max(0, Math.min(100, 50 - d.chg5 / 2 * 50)),
      label: `dollar ${pyFormat(d.chg5, 1, true)}% over five days` });
  }

  // The guard is the Python's: without it an empty comp divides by zero, which
  // raises there and yields NaN here.
  const score = comp.length ? pySum(comp.map((c) => c.v)) / comp.length : 50.0;
  const band = (score >= 70 ? 'Risk on' : score >= 55 ? 'Leaning risk on'
    : score >= 45 ? 'Mixed' : score >= 30 ? 'Leaning risk off'
    : 'Risk off');
  return { score, band, components: comp };
}

/** Three or four sentences, every one of them a fact about closes. */
export function summarise(rows) {
  const by = new Map(rows.map((r) => [r.name, r]));
  const eq = rows.filter((r) => r.kind === 'equity');
  if (!eq.length) return 'No market data available for this session.';
  const up = eq.filter((r) => r.chg > 0);
  const S = [];

  if (up.length === eq.length) {
    const lead = maxBy(eq, (r) => r.chg);
    S.push(`All four index futures closed higher, ${lead.name} `
         + `leading at ${pyFormat(lead.chg, 1, true)}%.`);
  } else if (!up.length) {
    const worst = minBy(eq, (r) => r.chg);
    S.push(`All four index futures closed lower, ${worst.name} `
         + `worst at ${pyFormat(worst.chg, 1, true)}%.`);
  } else {
    const best = maxBy(eq, (r) => r.chg);
    const worst = minBy(eq, (r) => r.chg);
    S.push(`Index futures were split, ${up.length} of ${eq.length} higher: `
         + `${best.name} ${pyFormat(best.chg, 1, true)}% against `
         + `${worst.name} ${pyFormat(worst.chg, 1, true)}%.`);
  }

  const above = eq.filter((r) => r.ma50 && r.close > r.ma50);
  S.push(`${above.length} of ${eq.length} sit above their own 50-day average.`);

  const v = by.get('VIX');
  if (v) {
    const where = (v.pct < 25 ? 'the calmest quarter of'
      : v.pct > 75 ? 'the most agitated quarter of'
      : 'the middle of');
    S.push(`The VIX closed at ${pyFormat(v.close, 1)}, ${where} its trailing `
         + `year, ${pyFormat(v.chg, 1, true)}% on the day.`);
  }

  const tail = [];
  for (const n of ['Crude', 'Gold', 'Dollar']) {
    const r = by.get(n);
    if (r) {
      tail.push(`${n.toLowerCase()} ${pyFormat(r.chg, 1, true)}%`);
    }
  }
  if (tail.length) {
    S.push('Elsewhere ' + tail.join(', ') + '.');
  }
  return S.join(' ');
}

export async function main(cacheDir = process.argv[2]) {
  const now = new Date();
  const end = String(now.getUTCFullYear())
    + String(now.getUTCMonth() + 1).padStart(2, '0')
    + String(now.getUTCDate()).padStart(2, '0');
  const rows = await read(end, cacheDir);
  console.log(''.padEnd(10) + 'close'.padStart(12) + 'day'.padStart(9)
    + '5d'.padStart(9) + 'vs 50d'.padStart(9) + '1y pctile'.padStart(11));
  for (const r of rows) {
    const v50 = (r.ma50 && r.close > r.ma50) ? 'above' : 'below';
    console.log(r.name.padEnd(10)
      + pyFormat(r.close, 2, false, true).padStart(12)
      + pyFormat(r.chg, 1, true).padStart(8) + '%'
      + pyFormat(r.chg5, 1, true).padStart(8) + '%'
      + v50.padStart(9)
      + pyFormat(r.pct, 0).padStart(10) + '%');
  }
  console.log('');
  console.log(summarise(rows));
  const pr = pressure(rows);
  console.log('');
  console.log(`PRESSURE ${pyFormat(pr.score, 0)}/100  ${pr.band}`);
  for (const c of pr.components) {
    console.log('  ' + c.k.padEnd(11) + pyFormat(c.v, 0).padStart(5) + '  ' + c.label);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
