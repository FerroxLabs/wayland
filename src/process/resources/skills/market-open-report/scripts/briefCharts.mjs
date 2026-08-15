/**
 * Hand-rolled SVG charts for the morning brief.
 *
 * Ported from tools/brief_charts.py (tvcontrol skills/market-open-report).
 *
 * NO CHART LIBRARY, and that is a constraint rather than a preference: the brief
 * is published to a page with a strict content-security policy, so a CDN script
 * tag would silently render nothing. Everything here is inline SVG built from the
 * real series, which also means the file opens from disk with no network at all.
 * The port keeps that property: zero imports, zero dependencies, no remote fonts
 * or images, nothing but string building.
 *
 * EVERY CHART OBEYS THE SAME THREE RULES, from the ui-ux-pro-max chart guidance:
 *
 *   Colour never carries meaning alone. Direction is signed, gauges print their
 *   number, the ladder uses filled versus outline rather than hue.
 *   Grid lines stay below the data in contrast, never competing with it.
 *   Each figure gets a text summary so it survives being read aloud.
 *
 * Nothing here is decorative. If a shape is on the page it is a measurement.
 *
 * ---------------------------------------------------------------------------
 * PORTING NOTES (read before changing any number below)
 *
 * Python's f'{x:.1f}' rounds HALF-TO-EVEN on the exact binary value of the
 * double. JavaScript's Number.prototype.toFixed rounds half-AWAY on the exact
 * value. They differ at every tie, and ties are common in coordinate work:
 * '{2.5:.0f}' is '2' in Python and '3' via toFixed, '{0.25:.1f}' is '0.2' in
 * Python and '0.3' via toFixed. So toFixed is never used here. pyRound and
 * pyFmt below reconstruct the double's exact decimal value with BigInt and
 * round half-to-even, which is bit-for-bit what CPython prints.
 *
 * The order of every arithmetic expression is preserved exactly as written in
 * the Python. Both languages use IEEE-754 doubles, so identical order gives
 * identical results; reordering for elegance would silently change last digits.
 */

// --------------------------------------------------------------------------
// Exact decimal formatting (CPython-compatible)
// --------------------------------------------------------------------------

const _DV = new DataView(new ArrayBuffer(8));

/** Decompose a finite non-negative double into an exact m * 2**p, m a BigInt. */
function _decompose(x) {
  _DV.setFloat64(0, x);
  const bits = (BigInt(_DV.getUint32(0)) << 32n) | BigInt(_DV.getUint32(4));
  const E = Number((bits >> 52n) & 0x7ffn);
  const M = bits & 0xfffffffffffffn;
  if (E === 0) return { m: M, p: -1074 };            // subnormal
  return { m: M | 0x10000000000000n, p: E - 1075 };  // normal (implicit bit)
}

/**
 * |x| * 10**digits, rounded HALF-TO-EVEN against the exact value of the double.
 * Returns a BigInt. `digits` must be >= 0.
 */
function _scaleHalfEven(x, digits) {
  const { m, p } = _decompose(Math.abs(x));
  const num = m * 10n ** BigInt(digits);
  if (p >= 0) return num << BigInt(p);
  const den = 1n << BigInt(-p);
  const q = num / den;              // BigInt division truncates; num/den are >= 0
  const twice = (num - q * den) * 2n;
  if (twice > den) return q + 1n;
  if (twice < den) return q;
  return q % 2n === 0n ? q : q + 1n; // tie -> to even, exactly like CPython
}

/** Group an integer digit string with commas, the way Python's ',' spec does. */
function _group(s) {
  let out = '';
  for (let i = 0; i < s.length; i += 1) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ',';
    out += s[i];
  }
  return out;
}

/**
 * Python's round(x, digits): half-to-even on the exact value, returned as a
 * double. Parsing the exact decimal string back gives the correctly-rounded
 * double, which is what CPython produces. Only digits >= 0 is supported; the
 * ported code never asks for negative precision.
 */
export function pyRound(x, digits = 0) {
  if (!Number.isFinite(x)) return x;
  return Number(pyFmt(x, digits));
}

/**
 * Python's format spec for floats: pyFmt(x, 1) is f'{x:.1f}', pyFmt(x, 0,
 * {sign: true}) is f'{x:+.0f}', pyFmt(x, 2, {comma: true}) is f'{x:,.2f}'.
 * Built on the same half-to-even core as pyRound, never on toFixed.
 */
export function pyFmt(x, digits, { comma = false, sign = false } = {}) {
  if (Number.isNaN(x)) return sign ? '+nan' : 'nan';
  const neg = x < 0 || Object.is(x, -0);
  if (!Number.isFinite(x)) return (neg ? '-' : sign ? '+' : '') + 'inf';
  const n = _scaleHalfEven(x, digits);
  let s = n.toString();
  if (digits > 0 && s.length <= digits) s = s.padStart(digits + 1, '0');
  let ip = digits > 0 ? s.slice(0, s.length - digits) : s;
  const fp = digits > 0 ? s.slice(s.length - digits) : '';
  if (comma) ip = _group(ip);
  const sgn = neg ? '-' : sign ? '+' : '';
  return sgn + ip + (digits > 0 ? '.' + fp : '');
}

/**
 * Python's str() for a float, needed for the one place a caller-supplied number
 * is interpolated with no format spec: the 'T2 +3.0%' rung labels.
 *
 * JavaScript has no int/float distinction, so this cannot be inferred from the
 * value. The shipped caller passes TPS = (1.5, 3.0, 6.0, 12.0) -- Python floats
 * -- and Python prints str(3.0) as '3.0' where String(3) gives '3'. This
 * assumes float, which is what the real brief supplies. Pass integers and this
 * will print '1.0' where Python prints '1'.
 *
 * Both languages emit the shortest round-tripping decimal, but they switch to
 * exponential notation at different magnitudes (Python at 1e16 and 1e-5, JS at
 * 1e21 and 1e-7). Only the 1e16 boundary is handled; target percentages never
 * approach either.
 */
function pyFloatStr(v) {
  if (Number.isNaN(v)) return 'nan';
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
  if (Number.isInteger(v) && Math.abs(v) < 1e16) {
    return (Object.is(v, -0) ? '-0' : String(v)) + '.0';
  }
  return String(v);
}

const fmt0 = (v) => pyFmt(v, 0);
const fmt1 = (v) => pyFmt(v, 1);
const fmt2 = (v) => pyFmt(v, 2);
const fmtSigned0 = (v) => pyFmt(v, 0, { sign: true });
const fmtComma0 = (v) => pyFmt(v, 0, { comma: true });
const fmtComma2 = (v) => pyFmt(v, 2, { comma: true });

// --------------------------------------------------------------------------
// CPython hash(), needed only for the sparkline gradient id
// --------------------------------------------------------------------------
//
// sparkline() derives its <linearGradient> id from abs(hash(tuple(series[:6]))).
// That id is part of the emitted bytes, so the port reproduces CPython's hash
// rather than substituting a JS hash. This is deterministic across runs:
// PYTHONHASHSEED randomises str/bytes hashing only, never numbers or the tuple
// combiner. Python guarantees hash(2) == hash(2.0), so the float path below is
// used for every element and matches ints too.

const _HASH_BITS = 61n;
const _HASH_MODULUS = (1n << 61n) - 1n;   // 2**61 - 1
const _HASH_INF = 314159n;
const _HASH_NAN = 0n;                      // Py_HASH_NAN, pre-3.10 constant 0
const _XXPRIME_1 = 11400714785074694791n;
const _XXPRIME_2 = 14029467366897019727n;
const _XXPRIME_5 = 2870177450012600261n;
const _U64 = (1n << 64n) - 1n;

/** CPython _Py_HashDouble, for a JS number. */
function _hashDouble(v) {
  if (Number.isNaN(v)) return _HASH_NAN;
  if (!Number.isFinite(v)) return v > 0 ? _HASH_INF : -_HASH_INF;
  let sign = 1n;
  if (v < 0) sign = -1n;
  // frexp: |v| = m * 2**e with 0.5 <= m < 1. Derived from the exact
  // decomposition so subnormals cannot round-trip through an overflowing
  // 2**e division.
  let m = 0;
  let e = 0;
  if (v !== 0) {
    const d = _decompose(Math.abs(v));
    const bl = d.m.toString(2).length;
    m = Number(d.m) / 2 ** bl;
    e = d.p + bl;
  }
  let x = 0n;
  while (m !== 0) {
    x = ((x << 28n) & _HASH_MODULUS) | (x >> 33n);
    m *= 268435456.0;               // 2**28
    e -= 28;
    const y = BigInt(Math.trunc(m)); // Python int(m): truncates toward zero
    m -= Math.trunc(m);
    x += y;
    if (x >= _HASH_MODULUS) x -= _HASH_MODULUS;
  }
  // CPython: if (e >= 0) e %= BITS; else e = BITS - 1 - ((-e - 1) % BITS);
  const eb = BigInt(e);
  const em = eb >= 0n ? eb % _HASH_BITS : _HASH_BITS - 1n - ((-eb - 1n) % _HASH_BITS);
  x = ((x << em) & _HASH_MODULUS) | (x >> (_HASH_BITS - em));
  x = x * sign;
  if (x === -1n) x = -2n;
  return x;
}

/** CPython tuplehash (the xxHash-derived combiner used since 3.8). */
function _hashTuple(items) {
  let acc = _XXPRIME_5;
  for (const item of items) {
    const lane = BigInt.asUintN(64, _hashDouble(item));
    acc = BigInt.asUintN(64, acc + lane * _XXPRIME_2);
    acc = BigInt.asUintN(64, (acc << 31n) | (acc >> 33n)); // rotate left 31
    acc = BigInt.asUintN(64, acc * _XXPRIME_1);
  }
  // CPython: acc += (Py_uhash_t)len ^ (_PyHASH_XXPRIME_5 ^ 3527539);
  // JS binds '+' tighter than '^', so the xor needs its own parentheses.
  acc = BigInt.asUintN(64, acc + (BigInt(items.length) ^ (_XXPRIME_5 ^ 3527539n)));
  if (acc === _U64) return 1546275796n;
  return BigInt.asIntN(64, acc);
}

// --------------------------------------------------------------------------
// Charts
// --------------------------------------------------------------------------

/** Map a series onto a viewBox, top-left origin, y inverted. */
function _pts(series, w, h, pad = 2) {
  if (!series || series.length < 2) return [];
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  // Python `(hi - lo) or 1.0`: 0.0 and -0.0 are falsy in both languages, so JS
  // `||` matches. It diverges only for NaN, which Python treats as truthy and
  // JS as falsy -- unreachable here, a NaN in the series poisons lo/hi first.
  const rng = (hi - lo) || 1.0;
  const n = series.length - 1;
  return series.map((v, i) => [
    (i / n) * (w - pad * 2) + pad,
    h - pad - ((v - lo) / rng) * (h - pad * 2),
  ]);
}

/**
 * A real 60-close series. The fill is there to make direction readable at
 * a glance without relying on the stroke colour.
 */
export function sparkline(series, w = 132, h = 34, up = true, label = '') {
  const p = _pts(series, w, h);
  if (!p.length) return '';
  const col = up ? 'var(--bull)' : 'var(--bear)';
  const line = 'M' + p.map(([x, y]) => `${fmt1(x)},${fmt1(y)}`).join(' L');
  const area = `${line} L${fmt1(p[p.length - 1][0])},${h} L${fmt1(p[0][0])},${h} Z`;
  const uid = `sg${(_absBig(_hashTuple(series.slice(0, 6))) % 99999n).toString()}`;
  return (
    `<svg class="spark" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" ` +
    `preserveAspectRatio="none" role="img" aria-label="${label}">` +
    `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${col}" stop-opacity=".28"/>` +
    `<stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="${area}" fill="url(#${uid})"/>` +
    `<path d="${line}" fill="none" stroke="${col}" stroke-width="1.6" ` +
    `stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="${fmt1(p[p.length - 1][0])}" cy="${fmt1(p[p.length - 1][1])}" r="2.2" fill="${col}"/>` +
    `</svg>`
  );
}

function _absBig(v) {
  return v < 0n ? -v : v;
}

/**
 * Market pressure as a horizontal rail.
 *
 * A dial was tried twice and was wrong both times: the needle never sat on its
 * own arc and the caps curled below the pivot. A rail has no trigonometry, it
 * fills the width it is given, and the marker cannot land off its own scale.
 *
 * THE ZONES ARE THE SCALE AND NOTHING PAINTS OVER THEM. The first rail drew a
 * cumulative fill from zero to the reading, which covered the RISK OFF and
 * MIXED zones in the colour of the reading: an 87 made the whole left half of
 * a risk-off zone look green, which is precisely backwards. The zones now keep
 * their own colour at every reading and only the marker moves.
 */
export function gauge(score, components = null, w = 980, h = 76) {
  const PAD = 2;
  const railY = 26;
  const railH = 30;
  const iw = w - PAD * 2;
  const s_ = Math.max(0.0, Math.min(100.0, score));
  const x = PAD + iw * s_ / 100.0;
  const col = score >= 55 ? 'var(--bull)'
    : score >= 45 ? 'var(--gold)' : 'var(--bear)';
  const band = score >= 70 ? 'Risk on' : score >= 55 ? 'Leaning risk on'
    : score >= 45 ? 'Mixed' : score >= 30 ? 'Leaning risk off'
      : 'Risk off';
  const zones = [
    [0, 30, 'var(--bear)', 'RISK OFF', 0.30],
    [30, 45, 'var(--bear)', '', 0.16],
    [45, 55, 'var(--gold)', 'MIXED', 0.30],
    [55, 70, 'var(--bull)', '', 0.16],
    [70, 100, 'var(--bull)', 'RISK ON', 0.30],
  ];
  const o = [`<svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" `
    + `preserveAspectRatio="none" role="img" `
    + `aria-label="Market pressure ${fmt0(score)} out of 100, ${band}">`];
  for (const [lo, hi, c, lbl0, op] of zones) {
    const zx = PAD + iw * lo / 100.0;
    const zw = iw * (hi - lo) / 100.0;
    o.push(`<rect x="${fmt1(zx)}" y="${railY}" width="${fmt1(zw - 2)}" `
      + `height="${railH}" rx="4" fill="${c}" opacity="${op}"/>`);
    if (lbl0) {
      o.push(`<text x="${fmt1(zx + zw / 2)}" y="${railY + railH + 15}" `
        + `text-anchor="middle" font-size="10" font-weight="800" `
        + `letter-spacing=".13em" fill="var(--dim2)">${lbl0}</text>`);
    }
  }
  // marker: a full-height bar plus the reading in a bubble above it
  o.push(`<rect x="${fmt1(x - 2)}" y="${railY - 6}" width="4" `
    + `height="${railH + 12}" rx="2" fill="${col}"/>`);
  // THE READING AND ITS BAND TRAVEL TOGETHER, on the marker. They were
  // separated at first, with the band printed at the far left of the rail,
  // where it sat directly beside the RISK OFF zone label and read as a flat
  // contradiction: 'RISK ON  RISK OFF'.
  const lbl = `${fmt0(score)} /100  ${band.toUpperCase()}`;
  const bw = 22 + lbl.length * 7.0;
  const bx = Math.min(Math.max(x, bw / 2 + 2), w - bw / 2 - 2);
  o.push(`<rect x="${fmt1(bx - bw / 2)}" y="0" width="${fmt1(bw)}" height="20" `
    + `rx="5" fill="${col}"/>`);
  o.push(`<text x="${fmt1(bx)}" y="14" text-anchor="middle" font-size="11.5" `
    + `font-weight="800" fill="#08080C" letter-spacing=".04em" `
    + `font-family="ui-monospace,Menlo,monospace">${lbl}</text>`);
  o.push('</svg>');
  return o.join('');
}

/**
 * One stacked bar: how much of the watchlist is in an uptrend. Both
 * segments carry their own count as text, so it reads without colour.
 */
export function breadth(up, down, w = 300, h = 52) {
  const tot = Math.max(1, up + down);
  const uw = up / tot * w;
  return (
    `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" ` +
    `aria-label="${up} of ${tot} names in an uptrend">` +
    `<rect x="0" y="10" width="${w}" height="20" rx="5" fill="var(--panel2)"/>` +
    `<rect x="0" y="10" width="${fmt1(uw)}" height="20" rx="5" fill="var(--bull)"/>` +
    `<text x="8" y="24.5" font-size="11.5" font-weight="800" fill="#08080C">` +
    `${up} up</text>` +
    `<text x="${w - 8}" y="24.5" font-size="11.5" font-weight="700" ` +
    `fill="var(--dim)" text-anchor="end">${down} down</text>` +
    `<text x="0" y="47" font-size="10" fill="var(--dim2)">` +
    `${fmt0(up / tot * 100)}% of the watchlist is trending up</text>` +
    `</svg>`
  );
}

/**
 * Where the open positions actually sit. A single median number hides a
 * book that is one huge winner and forty scratches; the shape does not.
 */
export function histogram(values, w = 300, h = 118, bins = 11) {
  if (!values || !values.length) return '';
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1e-9) {
    lo = lo - 1;
    hi = hi + 1;
  }
  const edges = [];
  for (let i = 0; i < bins + 1; i += 1) edges.push(lo + (hi - lo) * i / bins);
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    // Python int() truncates toward zero, so Math.trunc, not Math.floor.
    const k = Math.min(bins - 1, Math.max(0, Math.trunc((v - lo) / (hi - lo) * bins)));
    counts[k] += 1;
  }
  // Python `max(counts) or 1`; bins >= 1 keeps counts non-empty. bins == 0
  // would raise ValueError in Python (max of an empty list) and then
  // ZeroDivisionError on w / bins; JS would yield -Infinity and Infinity.
  const mx = Math.max(...counts) || 1;
  const bw = w / bins;
  const out = [`<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" `
    + `aria-label="Distribution of unrealised gains across `
    + `${values.length} positions">`];
  // zero line, because the sign is the whole point
  if (lo < 0 && 0 < hi) {
    const zx = (0 - lo) / (hi - lo) * w;
    out.push(`<line x1="${fmt1(zx)}" y1="0" x2="${fmt1(zx)}" y2="${h - 18}" `
      + `stroke="var(--rule)" stroke-width="1" stroke-dasharray="2,3"/>`);
  }
  for (let i = 0; i < counts.length; i += 1) {
    const c = counts[i];
    if (!c) continue;
    const bh = c / mx * (h - 30);
    const mid = (edges[i] + edges[i + 1]) / 2;
    const col = mid >= 0 ? 'var(--bull)' : 'var(--bear)';
    out.push(`<rect x="${fmt1(i * bw + 1)}" y="${fmt1(h - 18 - bh)}" `
      + `width="${fmt1(bw - 2)}" height="${fmt1(bh)}" rx="2" fill="${col}"/>`);
  }
  out.push(`<text x="0" y="${h - 4}" font-size="10" fill="var(--dim2)">`
    + `${fmtSigned0(lo)}%</text>`);
  out.push(`<text x="${w}" y="${h - 4}" font-size="10" fill="var(--dim2)" `
    + `text-anchor="end">${fmtSigned0(hi)}%</text>`);
  out.push('</svg>');
  return out.join('');
}

/**
 * How far through the four-rung ladder the book has travelled. Five
 * columns, 0 to 4 rungs filled, each labelled with its own count.
 */
export function ladder_mix(counts, w = 300, h = 118) {
  // Python `max(counts) or 1` raises ValueError on an empty list; JS gives
  // -Infinity here instead. Callers always pass the five ladder buckets.
  const mx = Math.max(...counts) || 1;
  const bw = w / 5;
  const out = [`<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" `
    + `aria-label="Positions grouped by how many profit targets have filled">`];
  for (let i = 0; i < counts.length; i += 1) {
    const c = counts[i];
    const bh = Math.max(2, c / mx * (h - 40));
    const x = i * bw + bw * 0.18;
    const bwd = bw * 0.64;
    const op = 0.30 + 0.175 * i;
    out.push(`<rect x="${fmt1(x)}" y="${fmt1(h - 26 - bh)}" width="${fmt1(bwd)}" `
      + `height="${fmt1(bh)}" rx="3" fill="var(--gold)" opacity="${fmt2(op)}"/>`);
    if (c) {
      out.push(`<text x="${fmt1(x + bwd / 2)}" y="${fmt1(h - 31 - bh)}" `
        + `font-size="11" font-weight="700" fill="var(--ink)" `
        + `text-anchor="middle">${c}</text>`);
    }
    out.push(`<text x="${fmt1(x + bwd / 2)}" y="${fmt1(h - 11)}" font-size="10" `
      + `fill="var(--dim2)" text-anchor="middle">${i}</text>`);
  }
  out.push(`<text x="${fmt1(w / 2)}" y="${fmt1(h - 1)}" font-size="9.5" `
    + `fill="var(--dim2)" text-anchor="middle">targets filled</text>`);
  out.push('</svg>');
  return out.join('');
}

/**
 * The worked trade, drawn the way the customer will see it on TradingView.
 *
 * Candles, the entry marked on its own bar, the four target rungs as
 * horizontal levels extending from the entry forward, filled ones solid and
 * unfilled ones dashed, and the runner's share stated rather than implied.
 *
 * A worked example told in numbers is a table. Told on a chart it is the thing
 * a student recognises from their own screen, which is the whole point of
 * putting it in front of them the morning they are deciding whether to trade.
 */
export function trade_chart(bars, entry_px, entry_date, rungs, tps, w = 760, h = 330) {
  if (!bars || bars.length < 5 || !entry_px) return '';
  const PL = 8;
  const PR = 64;
  const PT = 14;
  const PB = 22;                            // plot padding, room for right axis
  const iw = w - PL - PR;
  const ih = h - PT - PB;

  // A PROJECTION STRIP, BECAUSE A LIVE ENTRY HAS NOTHING AFTER IT.
  // The rungs are drawn from the entry forward. On the morning a trade is
  // taken the entry IS the last bar, so "forward" was zero pixels wide: four
  // target lines, four labels and the entry label all collapsed into the
  // right-hand gutter on top of the price tag and the axis numbers. Candles
  // now stop short of the right edge and the ladder is drawn into the gap,
  // which is also how the same trade looks on a real chart.
  const proj = iw * 0.20;
  const cw_ = iw - proj;

  const levels = tps.map((t) => entry_px * (1 + t / 100));
  // Python raises ValueError on max([]) if tps is empty; JS gives -Infinity.
  let lo = Math.min(Math.min(...bars.map((b) => b.l)), entry_px);
  let hi = Math.max(Math.max(...bars.map((b) => b.h)), Math.max(...levels));
  const pad = (hi - lo) * 0.06 || 1;
  lo = lo - pad;
  hi = hi + pad;
  const rng = hi - lo;

  const Y = (v) => PT + ih - (v - lo) / rng * ih;

  const n = bars.length;
  const step = cw_ / n;
  const bw = Math.max(1.2, Math.min(7.0, step * 0.62));
  const o = [`<svg viewBox="0 0 ${w} ${h}" width="100%" height="auto" role="img" `
    + `aria-label="Price chart of the worked trade with entry and four `
    + `profit targets marked">`];

  // The price tag owns its slot in the axis lane, so any grid number that
  // would print underneath it is dropped rather than overprinted.
  const tag_y = Y(bars[bars.length - 1].c);

  // horizontal grid, deliberately below the data in contrast
  for (let k = 0; k < 5; k += 1) {
    const v = lo + rng * k / 4;
    const y = Y(v);
    o.push(`<line x1="${PL}" y1="${fmt1(y)}" x2="${PL + iw}" y2="${fmt1(y)}" `
      + `stroke="var(--grid)" stroke-width="1"/>`);
    if (Math.abs(y - tag_y) > 11) {
      o.push(`<text x="${PL + iw + 6}" y="${fmt1(y + 3.5)}" font-size="9.5" `
        + `fill="var(--dim2)" `
        + `font-family="ui-monospace,Menlo,monospace">`
        + `${fmtComma0(v)}</text>`);
    }
  }

  const _ei = entry_date ? bars.findIndex((b) => b.d >= (entry_date || '')) : -1;
  const ei = _ei >= 0 ? _ei : Math.max(0, n - 2);
  const ex = PL + ei * step + step / 2;

  // the trade's own zone, so the eye lands on the part that matters
  o.push(`<rect x="${fmt1(ex)}" y="${PT}" width="${fmt1(PL + iw - ex)}" `
    + `height="${ih}" fill="var(--gold)" opacity=".045"/>`);

  // candles
  for (let i = 0; i < bars.length; i += 1) {
    const b = bars[i];
    const x = PL + i * step + step / 2;
    const up = b.c >= b.o;
    const col = up ? 'var(--bull)' : 'var(--bear)';
    const op = i >= ei ? '1' : '.42';
    o.push(`<line x1="${fmt1(x)}" y1="${fmt1(Y(b.h))}" x2="${fmt1(x)}" `
      + `y2="${fmt1(Y(b.l))}" stroke="${col}" stroke-width="1" `
      + `opacity="${op}"/>`);
    const y0 = Y(Math.max(b.o, b.c));
    const y1 = Y(Math.min(b.o, b.c));
    o.push(`<rect x="${fmt1(x - bw / 2)}" y="${fmt1(y0)}" width="${fmt1(bw)}" `
      + `height="${fmt1(Math.max(1, y1 - y0))}" fill="${col}" opacity="${op}"/>`);
  }

  // TARGET RUNGS, drawn from the entry across the projection strip.
  // Labels are laid out top-down with a minimum gap, because T1 at +1.5% and
  // T2 at +3.0% are only a percent and a half apart and printed on top of each
  // other on any chart whose range runs to +12%.
  const ey = Y(entry_px);
  const lab = [];
  let prev_y = null;
  for (let j = 0; j < Math.min(tps.length, levels.length); j += 1) {
    const k = j + 1;                       // enumerate(..., start=1)
    const t = tps[j];
    const lv = levels[j];
    const filled = (rungs || []).includes(`TP${k}`);
    const y = Y(lv);
    o.push(`<line x1="${fmt1(ex)}" y1="${fmt1(y)}" x2="${PL + iw}" y2="${fmt1(y)}" `
      + `stroke="var(--gold)" stroke-width="${filled ? 1.6 : 1}" `
      + `stroke-dasharray="${filled ? '' : '4,4'}" `
      + `opacity="${filled ? 1 : 0.55}"/>`);
    lab.push([y, k, t, filled]);
  }
  // sorted(lab, key=lambda a: -a[0]) -- lowest target first. Stable in both
  // languages; the comparator reproduces the single-key ordering exactly.
  const labSorted = lab.slice().sort((a, b) => {
    const ka = -a[0];
    const kb = -b[0];
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  for (const row of labSorted) {
    let ty = row[0] - 4;
    if (prev_y !== null && prev_y - ty < 11) ty = prev_y - 11;
    prev_y = ty;
    const k = row[1];
    const t = row[2];
    const filled = row[3];
    o.push(`<text x="${fmt1(PL + iw - 4)}" y="${fmt1(ty)}" font-size="9.5" `
      + `font-weight="700" fill="var(--gold)" text-anchor="end" `
      + `opacity="${filled ? 1 : 0.7}">`
      + `T${k} +${pyFloatStr(t)}%${filled ? ' FILLED' : ''}</text>`);
  }

  // ENTRY. The label sits to the right of the marker when there is room and
  // flips to its left when the entry is the last bar, which is exactly the
  // case the brief shows most often.
  o.push(`<line x1="${PL}" y1="${fmt1(ey)}" x2="${PL + iw}" y2="${fmt1(ey)}" `
    + `stroke="var(--band)" stroke-width="1.2" stroke-dasharray="2,3"/>`);
  o.push(`<circle cx="${fmt1(ex)}" cy="${fmt1(ey)}" r="4.5" fill="var(--band)" `
    + `stroke="var(--bg)" stroke-width="1.6"/>`);
  const room = (PL + iw) - ex > 96;
  o.push(`<text x="${fmt1(room ? ex + 8 : ex - 8)}" y="${fmt1(ey + 13)}" `
    + `font-size="10" font-weight="800" fill="var(--band)" `
    + `text-anchor="${room ? 'start' : 'end'}">`
    + `ENTRY ${fmtComma2(entry_px)}</text>`);

  // last close
  const lc = bars[bars.length - 1].c;
  const ly = Y(lc);
  const lcol = lc >= entry_px ? 'var(--bull)' : 'var(--bear)';
  o.push(`<rect x="${PL + iw + 2}" y="${fmt1(ly - 8)}" width="${PR - 6}" `
    + `height="16" rx="3" fill="${lcol}"/>`);
  o.push(`<text x="${fmt0(PL + iw + PR / 2 - 1)}" y="${fmt1(ly + 3.5)}" `
    + `font-size="9.5" font-weight="800" fill="#08080C" `
    + `text-anchor="middle" font-family="ui-monospace,Menlo,monospace">`
    + `${fmtComma2(lc)}</text>`);

  o.push(`<text x="${PL}" y="${h - 6}" font-size="9.5" fill="var(--dim2)">`
    + `${bars[0].d}</text>`);
  // under the LAST CANDLE, not the right edge: everything past cw_ is the
  // projection strip and no bar has happened there yet
  o.push(`<text x="${fmt0(PL + cw_)}" y="${h - 6}" font-size="9.5" `
    + `fill="var(--dim2)" text-anchor="end">${bars[bars.length - 1].d}</text>`);
  o.push('</svg>');
  return o.join('');
}
