/**
 * indicators.mjs — pure indicator primitives.
 *
 * Ported from /Users/seandonahoe/dev/tvcontrol/skills/market-open-report/backtests/mcats.py
 * (the "primitives" block, lines 36-162). Function names, argument order and
 * internal loop structure are kept 1:1 with the Python so the two files diff
 * side by side.
 *
 * Pine semantics carried over verbatim from the Python docstrings:
 *   stdev_pop  POPULATION deviation, divides by n.
 *   rma        Wilder smoothing, SMA-seeded. Used by atr, rsi and dmi.
 *   ema        2/(n+1), SMA-seeded.
 *   macd_line  ema(12) - ema(26), all EMAs SMA-seeded.
 *   dmi        Wilder. adx = rma(abs(diPlus-diMinus)/(diPlus+diMinus)*100).
 *
 * Python `None` is represented as JavaScript `null` throughout (NOT `undefined`),
 * so `x === null` is the faithful translation of `x is None`.
 *
 * Bars are objects with numeric `high` / `low` / `close`; bracket access is used
 * so the lines read the same as the Python `b['high']`.
 *
 * Arithmetic notes (see also pyRound below):
 *   - No `//`, no `%`, and no `int()` appear in these nine functions, so traps
 *     1/2/5 do not arise here. All division is float division in both languages.
 *   - Division by zero: Python raises ZeroDivisionError, JS yields Infinity/NaN.
 *     Every such site is called out in a comment at the point it occurs. The
 *     deliberate choice is to NOT add guards the Python does not have, so a
 *     degenerate input produces a visibly wrong number (NaN/Infinity) here
 *     instead of a silently different one.
 */

// ---------------------------------------------------------------- pyRound

/**
 * Exact integer division with Python's half-to-even tie break.
 * num >= 0n, den > 0n.
 */
function divRoundHalfEven(num, den) {
  const q = num / den;
  const r = num % den;
  const twice = r * 2n;
  if (twice > den) return q + 1n;
  if (twice < den) return q;
  // exact tie -> round to even
  return q % 2n === 0n ? q : q + 1n;
}

/**
 * Python's `round()`: round-half-to-EVEN, applied to the EXACT binary value of
 * the double, not to its shortest decimal repr.
 *
 *   pyRound(0.5) === 0      pyRound(1.5) === 2      pyRound(2.5) === 2
 *   pyRound(-0.5) === -0    pyRound(-1.5) === -2    pyRound(-2.5) === -2
 *   pyRound(2.675, 2) === 2.67   // because 2.675 is really 2.67499999999999982...
 *
 * `Math.round` is half-UP and asymmetric for negatives (Math.round(-0.5) === -0
 * but Math.round(-1.5) === -1), and `toFixed` breaks exact ties upward, so
 * neither can stand in for this.
 *
 * The double is decomposed to mantissa * 2^exp with a DataView, the rounding is
 * done in exact BigInt rational arithmetic, and the result is re-parsed from a
 * decimal string (JS number parsing is correctly rounded), so the returned
 * double is the same one Python produces.
 *
 * Python distinguishes `round(x)` -> int from `round(x, 0)` -> float; JS has one
 * numeric type, so both return the same Number here.
 */
export function pyRound(x, digits = 0) {
  // Python raises OverflowError/ValueError for round(inf)/round(nan) with no
  // ndigits, and returns inf/nan when ndigits is given. Returning as-is.
  if (!Number.isFinite(x)) return x;
  if (x === 0) return x; // preserves -0, as Python does
  const d = digits | 0;

  const neg = x < 0;
  const ax = neg ? -x : x;

  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, ax);
  const hi = view.getUint32(0);
  const lo = view.getUint32(4);
  const expBits = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e;
  if (expBits === 0) {
    e = -1074; // subnormal
  } else {
    mant |= 1n << 52n;
    e = expBits - 1075;
  }

  // exact value of ax is mant * 2^e; we want round(ax * 10^d) half-to-even
  let num = mant;
  let den = 1n;
  if (e >= 0) num <<= BigInt(e);
  else den <<= BigInt(-e);
  if (d >= 0) num *= 10n ** BigInt(d);
  else den *= 10n ** BigInt(-d);

  const q = divRoundHalfEven(num, den);
  // re-parse rather than divide, so the last digit is not perturbed
  const out = Number(`${q.toString()}e${-d}`);
  return neg ? -out : out;
}

// ---------------------------------------------------------------- primitives

export function sma(v, n) {
  // NOTE: like the Python, this assumes v contains no nulls; Python would raise
  // TypeError on None + float, JS would silently produce NaN and poison `run`.
  const out = new Array(v.length).fill(null);
  let run = 0.0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    run += x;
    if (i >= n) {
      run -= v[i - n];
    }
    if (i >= n - 1) {
      out[i] = run / n; // n === 0 -> Python ZeroDivisionError, JS Infinity/NaN
    }
  }
  return out;
}

export function stdev_pop(v, n) {
  const out = new Array(v.length).fill(null);
  let run = 0.0;
  let run2 = 0.0;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    run += x;
    run2 += x * x;
    if (i >= n) {
      run -= v[i - n];
      run2 -= v[i - n] * v[i - n];
    }
    if (i >= n - 1) {
      const m = run / n; // n === 0 -> Python ZeroDivisionError, JS Infinity/NaN
      out[i] = Math.sqrt(Math.max(0.0, run2 / n - m * m));
    }
  }
  return out;
}

/**
 * Wilder smoothing, SMA-seeded, exactly as ta.rma. Leading nulls skipped
 * so this composes on series that start late (log returns, DM).
 */
export function rma(v, n) {
  const out = new Array(v.length).fill(null);
  let acc = 0.0;
  let cnt = 0;
  let prev = null;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (x === null) {
      continue;
    }
    if (prev === null) {
      acc += x;
      cnt += 1;
      if (cnt === n) {
        prev = acc / n; // n === 0 unreachable: cnt starts at 1
        out[i] = prev;
      }
      continue;
    }
    prev = (prev * (n - 1) + x) / n;
    out[i] = prev;
  }
  return out;
}

export function ema(v, n) {
  const out = new Array(v.length).fill(null);
  const k = 2.0 / (n + 1);
  let acc = 0.0;
  let cnt = 0;
  let prev = null;
  for (let i = 0; i < v.length; i++) {
    const x = v[i];
    if (x === null) {
      continue;
    }
    if (prev === null) {
      acc += x;
      cnt += 1;
      if (cnt === n) {
        prev = acc / n;
        out[i] = prev;
      }
      continue;
    }
    prev = (x - prev) * k + prev;
    out[i] = prev;
  }
  return out;
}

export function true_range(bars) {
  const tr = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (i === 0) {
      tr.push(b['high'] - b['low']);
    } else {
      const pc = bars[i - 1]['close'];
      tr.push(
        Math.max(b['high'] - b['low'], Math.abs(b['high'] - pc), Math.abs(b['low'] - pc))
      );
    }
  }
  return tr;
}

export function atr(bars, n) {
  return rma(true_range(bars), n);
}

/** Wilder RSI, as ta.rsi. */
export function rsi(close, n) {
  const up = [null];
  const dn = [null];
  for (let i = 1; i < close.length; i++) {
    const d = close[i] - close[i - 1];
    up.push(Math.max(d, 0.0));
    dn.push(Math.max(-d, 0.0));
  }
  const ru = rma(up, n);
  const rd = rma(dn, n);
  const out = new Array(close.length).fill(null);
  for (let i = 0; i < close.length; i++) {
    if (ru[i] === null || rd[i] === null) {
      continue;
    }
    out[i] = rd[i] === 0 ? 100.0 : 100.0 - 100.0 / (1.0 + ru[i] / rd[i]);
  }
  return out;
}

export function macd_line(close, fast = 12, slow = 26) {
  const ef = ema(close, fast);
  const es = ema(close, slow);
  const out = new Array(close.length);
  for (let i = 0; i < close.length; i++) {
    out[i] = ef[i] === null || es[i] === null ? null : ef[i] - es[i];
  }
  return out;
}

/** ta.dmi, Wilder. Returns [diPlus, diMinus, adx]. */
export function dmi(bars, length, smoothing) {
  const n = bars.length;
  const pdm = [null];
  const ndm = [null];
  for (let i = 1; i < n; i++) {
    const up = bars[i]['high'] - bars[i - 1]['high'];
    const dw = bars[i - 1]['low'] - bars[i]['low'];
    pdm.push(up > dw && up > 0 ? up : 0.0);
    ndm.push(dw > up && dw > 0 ? dw : 0.0);
  }
  const tr = true_range(bars);
  tr[0] = null;
  const rtr = rma(tr, length);
  const rp = rma(pdm, length);
  const rn = rma(ndm, length);
  const dip = new Array(n).fill(null);
  const dim = new Array(n).fill(null);
  const dx = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (rtr[i] === null || rtr[i] === 0 || rp[i] === null || rn[i] === null) {
      continue;
    }
    dip[i] = (100.0 * rp[i]) / rtr[i];
    dim[i] = (100.0 * rn[i]) / rtr[i];
    const s = dip[i] + dim[i];
    dx[i] = s === 0 ? 0.0 : (100.0 * Math.abs(dip[i] - dim[i])) / s;
  }
  return [dip, dim, rma(dx, smoothing)];
}
