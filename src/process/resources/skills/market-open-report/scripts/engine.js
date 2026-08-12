/**
 * engine.js — the TC-MCATS / TC-TIDE signal engine.
 *
 * Ported from /Users/seandonahoe/dev/tvcontrol/skills/market-open-report/backtests/mcats.py
 * (the scaling, signal, config and execution blocks: tf_scale :167, scaled_params
 * :172, supertrend_vegas :199, BASELINE :228, prepare_filters :293, prepare :325,
 * ladder_part :361, run :393, hold :735). The indicator primitives (lines 36-162)
 * live in ./indicators.js and are imported rather than duplicated.
 *
 * Function names, argument order and internal structure are kept 1:1 with the
 * Python so the two files diff side by side. Python `None` is `null` throughout.
 *
 * SWAPPABLE SEAM. This module is the strategy itself and may later be replaced by
 * a hosted implementation behind the same interface, so it has ZERO dependencies
 * on app internals: it is a pure function of `bars` and `cfg`. Use either the
 * named exports directly, or `createSignalEngine()` for the object form.
 *
 * `bars` is an array of objects with string `date` (ISO 'YYYY-MM-DD', compared
 * lexicographically exactly as Python compares str), numeric `open`/`high`/`low`/
 * `close`, and an optional `time` string used only to key the equity curve.
 *
 * ARITHMETIC NOTES (the traps, and what was done about each):
 *   1. `//` floor division: does not appear in the ported code.
 *   2. `%` modulo: does not appear in the ported code.
 *   3. Python `round()` is half-to-EVEN. It appears twice, both inside
 *      scaled_params, and both go through `pyRound` from ./indicators.js.
 *   4. No formatted numeric output is produced by this module, so the
 *      `f'{x:.2f}'` half-to-even formatting trap does not arise. The only
 *      f-string is the non-numeric `f'TP{k+1}'`.
 *   5. Python `int()` TRUNCATES toward zero -> `Math.trunc`, never `Math.floor`.
 *      Sites: `int(round(...))` x2 in scaled_params, `int(entry_qty*pct/100)` in
 *      ladder_part, `int(raw_q)` in run, `int(initial/close)` in hold. All are
 *      non-negative in practice, but Math.trunc is used so the sign behaviour
 *      matches if they ever are not.
 *   6. `sorted()` does not appear.
 *   7. Dicts: no dict in this module is keyed by an integer-like string, so plain
 *      objects preserve insertion order faithfully. `entry_allow` and `regime`
 *      are CALLER-supplied containers and may be a Map/Set/Array/plain object;
 *      membership is resolved through the helpers below.
 *   8. Division by zero: Python raises ZeroDivisionError, JS yields Infinity/NaN.
 *      Every site the Python does not already guard is called out in a comment
 *      where it occurs. No guards are added that the Python does not have, so a
 *      degenerate input produces a visibly wrong number here instead of a
 *      silently different one.
 *
 * THE TWO PLACES THE LANGUAGES GENUINELY CANNOT AGREE. Both are transcendental
 * library functions, which IEEE-754 does not require to be correctly rounded, so
 * CPython (which calls the platform libm) and V8 (which uses its own fdlibm port)
 * return results differing in the last bit or two. Neither is "wrong", and the
 * Python is not even self-consistent across platforms here — the same script on
 * glibc and on Apple libm gives different last digits. Measured on AAPL daily,
 * 1999-2026, 6,690 bars, against mcats.py itself:
 *
 *   a) `math.log` vs `Math.log`, at the logret line in prepare_filters. 28 of
 *      6,690 log returns differ in the last bit. stdev_pop's running sum of
 *      squares amplifies that, so `vidx` ends up differing by up to 4e-15
 *      relative and `vidx_ma` by up to 3e-14. Every other prepared series —
 *      close, a14, a14sma, rsi, macd, adx, mav and trend — is BIT-IDENTICAL.
 *      The only consumer of vidx is `is_high_vol`, whose comparison never came
 *      closer than a 2e-3 relative margin to its threshold on that sample, so
 *      the 3e-14 cannot flip a signal by eleven orders of magnitude. Across 22
 *      configurations (ladder on/off, both intrabar orderings, trailing stop,
 *      breakeven, runner, time stop, every filter, both gate readings, regime
 *      targets, fractional sizing, 30m/4h/daily scaling) every fill, every
 *      equity-curve point and the final cash balance matched EXACTLY.
 *
 *   b) `x ** y` vs `Math.pow(x, y)`, at the `cagr` and `rpd` metrics. Given
 *      byte-identical operands, V8's pow differs from Apple libm's by ~3 ULP,
 *      which the following `- 1` amplifies to ~7 ULP: 15.328605963401888 vs
 *      15.328605963401865. Fourteen significant figures agree. These are
 *      display-only metrics — nothing feeds back into the state machine — so
 *      this is left as-is rather than shipping a double-double pow.
 */

import {
  pyRound,
  sma,
  stdev_pop,
  atr,
  rsi,
  macd_line,
  dmi,
} from './indicators.js';

// ------------------------------------------------------- container helpers
//
// The Python treats `entry_allow` / `regime` as "a dict of date -> bool, or a
// set of the dates", and branches on `isinstance(x, dict)`. JS has no single
// mapping type, so these three helpers stand in for `in`, `isinstance(_, dict)`
// and `[]` / `.get()`. A Map or plain object is a mapping (dict); a Set or Array
// is a membership container (set/list), for which Python's `in` is True and the
// value lookup is skipped entirely.

function _isMapping(container) {
  if (container instanceof Map) return true;
  if (container instanceof Set) return false;
  if (Array.isArray(container)) return false;
  return typeof container === 'object' && container !== null;
}

function _containerHas(container, key) {
  if (container instanceof Map || container instanceof Set) return container.has(key);
  if (Array.isArray(container)) return container.includes(key);
  return Object.prototype.hasOwnProperty.call(container, key);
}

function _containerGet(container, key) {
  if (container instanceof Map) return container.get(key);
  return container[key];
}

/** Faithful `date in allow and (allow[date] if isinstance(allow, dict) else True)`. */
function _allowOk(allow, date) {
  return (
    _containerHas(allow, date) && (_isMapping(allow) ? Boolean(_containerGet(allow, date)) : true)
  );
}

/** `dict(BASELINE)` followed by `c.update(cfg)` when cfg is truthy. */
function _mergeCfg(cfg) {
  // Python skips the update for a falsy cfg ({} or None); Object.assign with {}
  // is a no-op, so the two agree. A key explicitly set to `undefined` in cfg WILL
  // override here whereas Python has no such value — do not pass undefined.
  return Object.assign({}, BASELINE, cfg || {});
}

// ---------------------------------------------------------------- scaling

/** tf_scale = sqrt(240 / tf_minutes). 4h is the script's design point. */
export function tf_scale(tf_minutes) {
  // tf_minutes === 0 -> Python ZeroDivisionError, JS Infinity.
  return Math.sqrt(240.0 / tf_minutes);
}

/**
 * Reproduces lines 137-148 of tc-mcats.pine.
 *
 * Note the asymmetry, which is in the script and not a transcription error:
 * vegasWindow scales BOTH ways, but every multiplier uses
 * `tf_scale < 1 ? sqrt(tf_scale) : 1`, so it shrinks on timeframes LONGER
 * than 4h and is left untouched on shorter ones.
 */
export function scaled_params(
  tf_minutes,
  vegas_window = 100,
  atr_period = 10,
  st_mult = 5.0,
  vol_adj = 5.0,
  vol_threshold = 1.5,
  tps = [3.0, 6.0, 12.0, 21.0],
  trail_atr_mult = 3.0
) {
  const s = tf_scale(tf_minutes);
  const m = s < 1 ? Math.sqrt(s) : 1.0;
  return {
    tf_scale: s,
    // int(round(x)): Python round() is half-to-even and returns an int, so
    // pyRound then Math.trunc. Math.round would be half-up and diverge on ties.
    vegas_window: Math.trunc(pyRound(vegas_window / s)),
    atr_period: Math.trunc(pyRound(atr_period / Math.sqrt(s))),
    st_mult: st_mult * m,
    vol_adj: vol_adj * m,
    vol_threshold: vol_threshold * m,
    tps: tps.map((t) => t * m),
    // line 148: the trailing stop uses a FOURTH root, not a square root
    trail_atr_mult: trail_atr_mult * (s < 1 ? Math.pow(s, 0.25) : 1.0),
  };
}

// ---------------------------------------------------------------- signal

export function supertrend_vegas(bars, atr_period, vegas_window, st_mult, vol_adj) {
  const close = bars.map((b) => b['close']);
  const vma = sma(close, vegas_window);
  const vsd = stdev_pop(close, vegas_window);
  const a = atr(bars, atr_period);
  const n = bars.length;
  const trend = new Array(n).fill(null);
  let pU = null;
  let pL = null;
  let cur = 1;
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    if (vma[i] === null || vsd[i] === null || a[i] === null || vma[i] === 0) {
      continue;
    }
    const mult = st_mult + vol_adj * ((2.0 * vsd[i]) / vma[i]);
    const hlc3 = (b['high'] + b['low'] + b['close']) / 3.0;
    let su = hlc3 - mult * a[i];
    let sl = hlc3 + mult * a[i];
    if (pU === null) {
      pU = su;
      pL = sl;
    }
    if (b['close'] > pL) {
      cur = 1;
    } else if (b['close'] < pU) {
      cur = -1;
    }
    su = cur === 1 ? Math.max(su, pU) : su;
    sl = cur === -1 ? Math.min(sl, pL) : sl;
    pU = su;
    pL = sl;
    trend[i] = cur;
  }
  return trend;
}

// ---------------------------------------------------------------- config

/**
 * Frozen because the Python's tuple members are immutable and `dict(BASELINE)`
 * is only ever a shallow copy — mutating a shared array here would leak across
 * every subsequent run, which the Python cannot do.
 */
export const BASELINE = Object.freeze({
  // --- Sean's live Inputs panel, 2026-08-07 ---
  direction: 'Long',
  use_vol_index: true, // exit vote only
  vol_index_length: 20,
  vol_index_threshold: 2.0,
  use_momentum_protection: false, // exit vote only
  momentum_length: 14,
  momentum_threshold: 0.5,
  use_drawdown_protection: false, // exit vote only, and structurally broken
  use_adx_filter: false,
  adx_length: 14,
  adx_smoothing: 14,
  adx_threshold: 25.0,
  use_volatility_filter: false,
  use_ma_filter: false,
  ma_length: 200,
  ma_only_above: true,
  use_take_profit: false,
  tp_amts: Object.freeze([25.0, 20.0, 10.0, 15.0]),
  tp_steps: 4,
  // 'None' and 'Dynamic Positioning and Profit Taking' are BEHAVIOURALLY
  // IDENTICAL in the source: exitEnhancement is read at lines 383, 384-387
  // and 409 only, and neither of those two strings changes anything. The
  // label is cosmetic. Only the other two options do work.
  exit_enhancement: 'Dynamic Positioning and Profit Taking',
  trail_atr_mult: 3.0,
  // --- TRADE MANAGEMENT, all OFF by default -------------------------------
  // Every one of these is inert at its default, so reconcile_trades.py stays
  // the positive control: if the shipped configuration ever stops matching
  // TradingView trade for trade, one of these leaked.
  //
  // REGIME-CONDITIONED TARGETS. [on_mult, off_mult] applied to every rung,
  // chosen ONCE at entry from the `regime` mask passed to run(). The thesis is
  // that scaling out early is the expensive mistake in a healthy tape and the
  // correct one in a hostile tape, so a single global ladder is wrong half the
  // time by construction. null disables it.
  regime_tp_mult: null,
  // BREAKEVEN. Once rung N has filled, close the remainder if price returns to
  // the entry. Attacks the specific case of a trade that ran and gave it back.
  // 0 disables.
  breakeven_after: 0,
  // RUNNER TRAIL, a chandelier on the part that has no target. Armed only once
  // every enabled rung has filled, then trails the high-water CLOSE by this
  // many ATR and ratchets, never loosening. 0 disables.
  runner_trail_atr: 0.0,
  // TIME STOP. If no rung has filled within this many bars of entry, leave.
  // In a 20-slot portfolio a flat trade has an opportunity cost that a
  // single-symbol backtest cannot see, so this one is expected to look
  // pointless here and matter at account level. 0 disables.
  time_stop_bars: 0,
  // INTRABAR SEQUENCE, which a daily bar cannot resolve. On a bar that both
  // touches a take-profit limit AND flips the trend, the ladder fills at its
  // limit (a profit) and the remainder exits at the close, OR the flip
  // liquidates everything at the close and the limit never fills. true is
  // TradingView's behaviour: limit orders fill intrabar when touched, while
  // close_all fills at the close under process_orders_on_close. false is the
  // pessimistic reading, and the gap between them is the size of the
  // assumption rather than something to be argued about.
  ladder_before_flip: true,
  // --- the two the script gives no toggle for, exposed here on purpose ---
  entry_block_high_vol: true,
  entry_block_weak_momentum: true,
  // --- trend engine ---
  vegas_window: 100,
  atr_period: 10,
  st_mult: 5.0,
  vol_adj: 5.0,
  vol_threshold: 1.5,
  tps: Object.freeze([3.0, 6.0, 12.0, 21.0]),
  start: '2000-01-01',
});

/**
 * The filter series ONLY: ATR14, the volatility index, RSI, MACD, DMI and
 * the MA. None of these depend on the trend-engine parameters.
 *
 * Split out so a sweep over vegasWindow / atrPeriod / superTrendMultiplier /
 * volatilityAdjustment recomputes only the SuperTrend and not RSI, MACD and
 * DMI as well. On a 1,000-cell parameter surface that is the difference
 * between a 25-minute job and a 3-hour one.
 */
export function prepare_filters(bars, cfg = null, bars_per_year = 252) {
  const c = _mergeCfg(cfg);
  const close = bars.map((b) => b['close']);
  const a14 = atr(bars, 14);
  const a14sma = sma(
    a14.map((x) => (x !== null ? x : 0.0)),
    14
  );
  // [None] + [...]: the leading null is unconditional, so on an EMPTY bars array
  // this list is length 1 while `bars` is length 0, exactly as in the Python.
  const logret = [null];
  for (let i = 1; i < close.length; i++) {
    // close[i] === 0 with close[i-1] > 0 -> Python math.log(0.0) raises
    // ValueError; JS Math.log(0) is -Infinity. Left unguarded, as in the Python.
    // DIVERGENCE (a) in the header: Math.log is not correctly rounded and does
    // not always agree with CPython's math.log in the last bit.
    logret.push(close[i - 1] > 0 ? Math.log(close[i] / close[i - 1]) : 0.0);
  }
  const vidx = new Array(bars.length).fill(null);
  const sdv = stdev_pop(
    logret.map((x) => (x !== null ? x : 0.0)),
    c['vol_index_length']
  );
  for (let i = 0; i < bars.length; i++) {
    if (sdv[i] !== undefined && sdv[i] !== null) {
      vidx[i] = sdv[i] * Math.sqrt(bars_per_year) * 100;
    }
  }
  const vidx_ma = sma(
    vidx.map((x) => (x !== null ? x : 0.0)),
    c['vol_index_length']
  );
  const [, , adx_] = dmi(bars, c['adx_length'], c['adx_smoothing']);
  return {
    close: close,
    a14: a14,
    a14sma: a14sma,
    vidx: vidx,
    vidx_ma: vidx_ma,
    rsi: rsi(close, c['momentum_length']),
    macd: macd_line(close),
    adx: adx_,
    mav: sma(close, c['ma_length']),
    bars_per_year: bars_per_year,
  };
}

/**
 * Every series that does NOT depend on a filter toggle, computed once.
 *
 * Split out of run() so a full-factorial sweep can reuse it. SuperTrend, ATR,
 * RSI, MACD and DMI are identical across every configuration in the grid, and
 * recomputing them per config made an exhaustive sweep a twelve-hour job
 * instead of a one-hour one. run() still calls this, so the two paths cannot
 * drift apart.
 *
 * Only the trend-engine and indicator-LENGTH settings belong in cfg here.
 * Toggling a filter must not require a re-prepare, or the saving is lost.
 */
export function prepare(
  bars,
  cfg = null,
  tf_minutes = 1440,
  apply_scaling = true,
  bars_per_year = 252,
  filters = null
) {
  const c = _mergeCfg(cfg);

  const p = apply_scaling
    ? scaled_params(
        tf_minutes,
        c['vegas_window'],
        c['atr_period'],
        c['st_mult'],
        c['vol_adj'],
        c['vol_threshold'],
        c['tps'],
        c['trail_atr_mult']
      )
    : {
        vegas_window: c['vegas_window'],
        atr_period: c['atr_period'],
        st_mult: c['st_mult'],
        vol_adj: c['vol_adj'],
        vol_threshold: c['vol_threshold'],
        tps: c['tps'],
        trail_atr_mult: c['trail_atr_mult'],
        tf_scale: 1.0,
      };

  // annualisation uses the BAR COUNT PER YEAR, so a 30m series is not scaled
  // as if it were daily. Pine hard-codes 252 here, which is one of the ways
  // the script's own intraday behaviour differs from its daily behaviour.
  //
  // NOTE: the RAW `cfg` is forwarded, not the merged `c`. That is what the
  // Python does, and prepare_filters merges against BASELINE itself.
  const f = filters !== null && filters !== undefined ? filters : prepare_filters(bars, cfg, bars_per_year);
  const trend = supertrend_vegas(bars, p['atr_period'], p['vegas_window'], p['st_mult'], p['vol_adj']);
  return Object.assign({}, f, { p: p, trend: trend });
}

/**
 * How many units one take-profit rung sells.
 *
 * MEASURED against TradingView, 2026-08-08, with a four-rung ladder placed as
 * four strategy.exit(qty_percent = ...) orders against one entry on QQQ daily,
 * re-issued on every bar exactly as tc-mcats.pine does. Fills read out of
 * strategy.closedtrades:
 *
 *     entry 1000 -> 250 / 200 / 100 / 150, runner 300
 *     entry   37 ->   9 /   7 /   3 /   5, runner  13
 *     entry    3 ->   1 /   1 /   1 / never fired, runner 0
 *
 * Three things follow, and an earlier port got the first one backwards:
 *
 * 1. The percentage is of the ENTRY quantity, fixed for the life of the
 *    position. It is NOT of the quantity remaining at fill time. 20% of a
 *    1000-share entry is 200 even when only 750 shares are left.
 * 2. It FLOORS. 3.7 shares fills 3 and 5.55 fills 5, so on small positions the
 *    runner is a little larger than the nominal remainder: a 37-share entry
 *    rides 13, which is 35.1%, not 30%.
 * 3. There is a one-unit minimum. A 3-share entry still fills a share at every
 *    rung until the position is gone, and the fourth rung then never fires.
 *
 * Sizing in whole units is right for equities, because that is what
 * TradingView fills. Crypto trades fractions, so neither the floor nor the
 * one-unit minimum applies there.
 */
export function ladder_part(entry_qty, remaining, pct, whole_units) {
  if (whole_units) {
    // int() truncates toward zero. entry_qty and pct are non-negative here, so
    // this is also the floor the docstring describes, but Math.trunc is used
    // rather than Math.floor because int() is what the Python calls.
    return Math.min(remaining, Math.max(1, Math.trunc((entry_qty * pct) / 100.0)));
  }
  return Math.min(remaining, (entry_qty * pct) / 100.0);
}

/**
 * One backtest. Returns metrics plus a mark-to-market equity curve.
 *
 * Equity is marked to market EVERY BAR, not only on closed trades, because
 * the audit established that close-event equity understates drawdown badly.
 *
 * Pass `prep` from prepare() to skip indicator recomputation across a sweep.
 *
 * `entry_allow` is the REGIME GATE: a mapping of date -> bool, or a set of the
 * dates on which a NEW position may be opened. It blocks entries only and
 * never forces an exit, which is what "hold nothing NEW unless the benchmark
 * closed above its own long average yesterday" means. The caller is
 * responsible for making it causal; see regime_gate.py, which shifts the
 * benchmark by one bar before building the mask. It lives here rather than in
 * a study script because the first version of that study was thrown away and
 * its numbers survived only as prose in a report, which is how a headline risk
 * claim ends up unreproducible.
 *
 * `gate_exits` decides which of the two readings of the gate applies, and the
 * project's own documents disagree about it. REGIME-GATE.md says "hold
 * NOTHING unless the benchmark closed above its average", which liquidates.
 * MASTER-SUMMARY.md says "hold nothing NEW", which only blocks entries. They
 * are different systems with different drawdowns, so both are runnable here
 * and neither is assumed.
 *
 * The caller distinguishes the terminal exit reasons: 'flip' (the trend
 * reversed), 'gate' (gate_exits liquidated) and 'vote' (the exit vote carried).
 * Those three are mutually exclusive and evaluated in exactly that order.
 */
export function run(
  bars,
  cfg = null,
  tf_minutes = 1440,
  equity_pct = 100.0,
  initial = 10000.0,
  commission = 0.001,
  apply_scaling = true,
  prep = null,
  bars_per_year = 252,
  whole_units = true,
  entry_allow = null,
  gate_exits = false,
  regime = null
) {
  const c = _mergeCfg(cfg);
  if (prep === null || prep === undefined) {
    prep = prepare(bars, cfg, tf_minutes, apply_scaling, bars_per_year);
  }

  const p = prep['p'];
  const trend = prep['trend'];
  const close = prep['close'];
  const a14 = prep['a14'];
  const a14sma = prep['a14sma'];
  const vidx = prep['vidx'];
  const vidx_ma = prep['vidx_ma'];
  const r = prep['rsi'];
  const ml = prep['macd'];
  const adx = prep['adx'];
  const mav = prep['mav'];
  bars_per_year = prep['bars_per_year'];

  const is_high_vol = (i) =>
    vidx[i] !== null &&
    vidx[i] !== undefined &&
    vidx_ma[i] !== null &&
    vidx_ma[i] !== undefined &&
    vidx[i] > vidx_ma[i] * c['vol_index_threshold'];

  const momentum_score = (i) => {
    if (r[i] === null || ml[i] === null || adx[i] === null || close[i] === 0) {
      return null;
    }
    // Addition is left-to-right in both languages; the three terms must not be
    // regrouped. `ml[i] / close[i] * 100` is (ml/close)*100, not ml/(close*100).
    return (r[i] - 50) / 50 + (ml[i] / close[i]) * 100 + (adx[i] - 20) / 80;
  };

  const is_weak_mom = (i) => {
    const ms = momentum_score(i);
    return ms === null || Math.abs(ms) < c['momentum_threshold'];
  };

  const vol_check = (i) =>
    a14[i] !== null &&
    a14[i] !== undefined &&
    a14sma[i] !== null &&
    a14sma[i] !== undefined &&
    a14[i] > a14sma[i] * p['vol_threshold'];

  // --- execution ---
  let cash = initial;
  let qty = 0;
  let entry_px = null;
  // Stamped on every fill so a POSITION (entry through final exit) can be
  // reconstructed downstream by grouping on it. The options study needs dated
  // entries above all else and must not re-derive the signal, because a second
  // implementation would silently drift from the TradingView-validated one.
  let entry_dt = null;
  // The size the position was OPENED at, held for the life of the position.
  // Every ladder rung is a percentage of this, never of what is left. See
  // ladder_part() for the measurement that settled it.
  let entry_qty = 0;
  let filled = [false, false, false, false];
  // trade-management state, all inert unless the matching option is set
  let tp_mult = 1.0; // regime multiplier, fixed at entry
  let entry_i = null; // bar index of entry, for the time stop
  let run_hw = null; // high-water close, for the runner trail
  let run_stop = null; // ratcheting runner stop
  const trades = [];
  const curve = [];
  let peak = initial;
  let maxdd = 0.0;
  let entries = 0;
  let trail_stop = null;
  let px = null;

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (trend[i] === null) {
      continue;
    }
    px = b['close'];
    const in_range = b['date'] >= c['start'];

    // trailing stop, armed only under 'Trailing Stop Exits' (line 409).
    // The order is placed at the PREVIOUS bar's close and is live on this
    // bar, so trail_stop carries over rather than being read from today.
    // It follows the close both up AND down; the source does not ratchet it.
    if (qty > 0 && trail_stop !== null && b['low'] <= trail_stop) {
      const fill = Math.min(trail_stop, b['open']);
      cash += qty * fill * (1 - commission);
      trades.push({
        entry: entry_px,
        exit: fill,
        qty: qty,
        why: 'trail',
        date: b['date'],
        entry_date: entry_dt,
      });
      qty = 0;
      entry_px = null;
      filled = [false, false, false, false];
      trail_stop = null;
    }

    // ladder, whole units
    if (qty > 0 && c['use_take_profit'] && c['ladder_before_flip']) {
      // 'Volatility-Adjusted Targets' multiplies every step by
      // atr14/entryPrice*100, so the ladder widens on volatile names and
      // tightens on calm ones (line 383).
      const vm =
        c['exit_enhancement'] === 'Volatility-Adjusted Targets' && a14[i] !== null && entry_px
          ? (a14[i] / entry_px) * 100.0
          : 1.0;
      for (let k = 0; k < c['tp_steps']; k++) {
        if (filled[k] || qty <= 0) {
          continue;
        }
        const tgt = entry_px * (1 + (p['tps'][k] * vm * tp_mult) / 100);
        if (b['high'] < tgt) {
          continue;
        }
        const part = ladder_part(entry_qty, qty, c['tp_amts'][k], whole_units);
        cash += part * tgt * (1 - commission);
        trades.push({
          entry: entry_px,
          exit: tgt,
          qty: part,
          why: `TP${k + 1}`,
          date: b['date'],
          entry_date: entry_dt,
        });
        qty -= part;
        filled[k] = true;
        if (qty === 0) {
          entry_px = null;
          filled = [false, false, false, false];
          break;
        }
      }
    }

    // exit vote, f_shouldExitPosition()
    let ex = 0;
    let tot = 0;
    if (c['use_vol_index']) {
      ex += is_high_vol(i) ? 1 : 0;
      tot += 1;
    }
    if (c['use_momentum_protection']) {
      ex += is_weak_mom(i) ? 1 : 0;
      tot += 1;
    }
    if (c['use_drawdown_protection']) {
      ex += 0; // currentDrawdown is never assigned. Always 0.
      tot += 1;
    }
    const should_exit = tot > 0 && ex >= Math.ceil(tot * 0.5);

    const flip = i > 0 && trend[i - 1] !== null && trend[i] !== trend[i - 1];

    const gate_kill =
      gate_exits && entry_allow !== null && entry_allow !== undefined && !_allowOk(entry_allow, b['date']);

    // close_all reads the PRE-BAR position, so it is evaluated first
    if (qty > 0 && (flip || should_exit || gate_kill)) {
      cash += qty * px * (1 - commission);
      trades.push({
        entry: entry_px,
        exit: px,
        qty: qty,
        // the three terminal reasons the caller distinguishes, in the source's
        // own precedence: flip beats gate beats vote.
        why: flip ? 'flip' : gate_kill ? 'gate' : 'vote',
        date: b['date'],
        entry_date: entry_dt,
      });
      qty = 0;
      entry_px = null;
      filled = [false, false, false, false];
      trail_stop = null;
    }

    // pessimistic ordering: the flip has already liquidated, so the ladder
    // only fills on bars where the trend did NOT flip
    if (qty > 0 && c['use_take_profit'] && !c['ladder_before_flip']) {
      const vm =
        c['exit_enhancement'] === 'Volatility-Adjusted Targets' && a14[i] !== null && entry_px
          ? (a14[i] / entry_px) * 100.0
          : 1.0;
      for (let k = 0; k < c['tp_steps']; k++) {
        if (filled[k] || qty <= 0) {
          continue;
        }
        const tgt = entry_px * (1 + (p['tps'][k] * vm * tp_mult) / 100);
        if (b['high'] < tgt) {
          continue;
        }
        const part = ladder_part(entry_qty, qty, c['tp_amts'][k], whole_units);
        cash += part * tgt * (1 - commission);
        trades.push({
          entry: entry_px,
          exit: tgt,
          qty: part,
          why: `TP${k + 1}`,
          date: b['date'],
          entry_date: entry_dt,
        });
        qty -= part;
        filled[k] = true;
        if (qty === 0) {
          entry_px = null;
          filled = [false, false, false, false];
          break;
        }
      }
    }

    // ---- TRADE MANAGEMENT. Every branch is unreachable at defaults.
    // Exits fill at the CLOSE, matching process_orders_on_close, which is
    // the same assumption the trend-flip exit already makes.
    if (qty > 0 && entry_px !== null) {
      const steps = c['tp_steps'];
      // Python: all(filled[:steps]). Both slices truncate at 4, and both
      // all([]) / [].every() are true, so steps <= 0 agrees as well.
      const all_filled = c['use_take_profit'] && filled.slice(0, steps).every((x) => x);
      const bk = c['breakeven_after'];
      let why = null;
      // filled[bk-1] with bk > 4 is an IndexError in Python and `undefined`
      // (falsy) here. Not guarded: breakeven_after > 4 is a caller error.
      if (bk && filled[bk - 1] && px <= entry_px) {
        why = 'breakeven';
      } else if (
        c['time_stop_bars'] &&
        entry_i !== null &&
        i - entry_i >= c['time_stop_bars'] &&
        !filled.some((x) => x)
      ) {
        why = 'time';
      } else if (c['runner_trail_atr'] && all_filled && a14[i] !== null) {
        // ratchets: the stop follows the high-water CLOSE up and never
        // loosens, which is the difference between a chandelier and the
        // 'Trailing Stop Exits' option, whose stop follows price DOWN
        // as well (see the note at the trail_stop block above).
        run_hw = run_hw === null ? px : Math.max(run_hw, px);
        const cand = run_hw - a14[i] * c['runner_trail_atr'];
        run_stop = run_stop === null ? cand : Math.max(run_stop, cand);
        if (px <= run_stop) {
          why = 'runner';
        }
      }
      if (why) {
        cash += qty * px * (1 - commission);
        trades.push({
          entry: entry_px,
          exit: px,
          qty: qty,
          why: why,
          date: b['date'],
          entry_date: entry_dt,
        });
        qty = 0;
        entry_px = null;
        filled = [false, false, false, false];
        run_hw = null;
        run_stop = null;
        entry_i = null;
      }
    }

    // entry, a LEVEL not a transition
    const gate_ok =
      entry_allow === null || entry_allow === undefined || _allowOk(entry_allow, b['date']);
    if (qty === 0 && in_range && gate_ok && trend[i] === 1 && c['direction'] !== 'Short') {
      let ok = true;
      if (c['use_adx_filter'] && !(adx[i] !== null && adx[i] > c['adx_threshold'])) {
        ok = false;
      }
      if (c['use_volatility_filter'] && !vol_check(i)) {
        ok = false;
      }
      if (c['entry_block_high_vol'] && is_high_vol(i)) {
        ok = false;
      }
      if (c['entry_block_weak_momentum'] && is_weak_mom(i)) {
        ok = false;
      }
      if (c['use_ma_filter'] && c['ma_only_above'] && !(mav[i] !== null && px > mav[i])) {
        ok = false;
      }
      if (ok) {
        // WHOLE UNITS is correct for equities, because TradingView
        // fills integer shares and fractional sizing was the dominant
        // error in an earlier port. It is WRONG for crypto, where every
        // venue trades fractions: at a $10,000 sleeve it silently
        // refuses to open BTCUSDT at all, because one bitcoin costs
        // more than the whole account. That produced published crypto
        // figures measured on 29 pairs while claiming 30, with the
        // single most important pair contributing nothing.
        const raw_q = (cash * equity_pct) / 100.0 / (px * (1 + commission));
        const q = whole_units ? Math.trunc(raw_q) : raw_q;
        if (q >= (whole_units ? 1 : 1e-8)) {
          cash -= q * px * (1 + commission);
          qty = q;
          entry_px = px;
          filled = [false, false, false, false];
          entry_qty = q;
          entry_dt = b['date'];
          entries += 1;
          entry_i = i;
          run_hw = px;
          run_stop = null;
          tp_mult = 1.0;
          if (c['regime_tp_mult'] !== null && c['regime_tp_mult'] !== undefined) {
            const on = c['regime_tp_mult'][0];
            const off = c['regime_tp_mult'][1];
            let healthy = true;
            if (regime !== null && regime !== undefined) {
              healthy = _isMapping(regime)
                ? Boolean(_containerGet(regime, b['date']))
                : _containerHas(regime, b['date']);
            }
            tp_mult = healthy ? on : off;
          }
        }
      }
    }

    // place tomorrow's trailing stop from today's close, so it is causal
    if (qty > 0 && c['exit_enhancement'] === 'Trailing Stop Exits' && a14[i] !== null) {
      trail_stop = px - a14[i] * p['trail_atr_mult'];
    } else if (qty === 0) {
      trail_stop = null;
    }

    // The equity curve starts at `start`, NOT at the first valid signal.
    // Otherwise a longer indicator window silently shortens the measured
    // period: Vegas 100 warms up 1999-07-30 and carries the whole dot-com
    // crash, while Vegas 1000 warms up 2003-03-03 and begins AFTER the
    // October 2002 bottom. Comparing their CAGR and drawdown without this
    // gate rewards the long window for skipping the worst bear market in
    // the sample rather than for trading it better.
    if (in_range) {
      const mtm = cash + qty * px;
      // The curve key must be UNIQUE PER BAR. On intraday data every bar
      // in a session shares b['date'], so keying on the date alone
      // silently collapses 13 half-hourly points into one and any
      // downstream map built from this curve keeps only the last. That
      // produced implausible intraday portfolio results (215% CAGR at 17%
      // drawdown on 1h crypto) before it was caught.
      curve.push([b['date'] + (b['time'] ? ' ' + b['time'] : ''), mtm]);
      peak = Math.max(peak, mtm);
      maxdd = Math.max(maxdd, peak > 0 ? (peak - mtm) / peak : 0.0);
    }
  }

  if (qty > 0) {
    px = bars[bars.length - 1]['close'];
    cash += qty * px * (1 - commission);
    trades.push({
      entry: entry_px,
      exit: px,
      qty: qty,
      why: 'end',
      date: bars[bars.length - 1]['date'],
      entry_date: entry_dt,
    });
  }

  // A win rate built from scale-outs is partly mechanical: TP1 at +3% books a
  // WIN on a slice while the remainder can still exit at a loss on the flip.
  // So the win rate is never reported without the payoff profile beside it.
  // avg_win / avg_loss is the number that says whether 84% wins is an edge or
  // a trap, and first_win_bars is what a student actually experiences.
  let gp = 0.0;
  let gl = 0.0;
  let wins = 0;
  for (const t of trades) {
    const pnl =
      (t['exit'] - t['entry']) * t['qty'] - (t['exit'] + t['entry']) * t['qty'] * commission;
    if (pnl > 0) {
      gp += pnl;
      wins += 1;
    } else {
      gl += -pnl;
    }
  }
  const yrs = curve.length ? curve.length / bars_per_year : 1.0;
  const nwin = wins;
  const nloss = trades.length - wins;
  const avg_win = nwin ? gp / nwin : 0.0;
  const avg_loss = nloss ? gl / nloss : 0.0;
  // how long a student waits before their first winning trade prints
  let first_win = null;
  for (let k = 0; k < trades.length; k++) {
    const t = trades[k];
    const pnl =
      (t['exit'] - t['entry']) * t['qty'] - (t['exit'] + t['entry']) * t['qty'] * commission;
    if (pnl > 0) {
      first_win = k + 1;
      break;
    }
  }
  // Math.pow for `**`. See DIVERGENCE (b) in the header: V8's pow and the
  // platform libm's pow disagree by a few ULP on identical operands, which
  // shows up in `cagr` and `rpd` at the 15th significant figure and nowhere
  // else. A negative base with a fractional exponent is a complex number in
  // Python 3 and NaN here, but cash cannot go negative in a long-only
  // cash-settled book, so that case does not arise.
  return {
    avg_win: avg_win,
    avg_loss: avg_loss,
    payoff: avg_loss > 0 ? avg_win / avg_loss : 99.0,
    trades_per_year: yrs > 0 ? trades.length / yrs : 0.0,
    first_win_trade: first_win,
    net_pct: (cash / initial - 1) * 100,
    cagr: yrs > 0 ? (Math.pow(cash / initial, 1 / yrs) - 1) * 100 : 0.0,
    trades: trades.length,
    wins: wins,
    entries: entries,
    win_rate: trades.length ? (wins / trades.length) * 100 : 0.0,
    pf: gl > 0 ? gp / gl : 99.0,
    maxdd: maxdd * 100,
    rpd: maxdd > 0 ? ((Math.pow(cash / initial, 1 / yrs) - 1) * 100) / (maxdd * 100) : 0.0,
    final: cash,
    curve: curve,
    params: p,
    // the raw fill records. 'trades' above is a COUNT, which is what the
    // TradingView report shows; downstream work that needs dated positions
    // groups these on entry_date.
    fills: trades,
  };
}

/**
 * Benchmark 1 and 2: the same instrument, simply held. Marked to market
 * every bar so its drawdown is measured the same way the strategy's is.
 */
export function hold(bars, initial = 10000.0, start = null) {
  const w = bars.filter((b) => start === null || start === undefined || b['date'] >= start);
  if (w.length < 2) {
    return null;
  }
  const q = Math.trunc(initial / w[0]['close']); // int(): truncates toward zero
  const rem = initial - q * w[0]['close'];
  let peak = initial;
  let maxdd = 0.0;
  for (const b of w) {
    const v = q * b['close'] + rem;
    peak = Math.max(peak, v);
    // peak === 0 -> Python ZeroDivisionError, JS NaN. Unguarded, as in the
    // Python: peak starts at `initial` and only grows.
    maxdd = Math.max(maxdd, (peak - v) / peak);
  }
  const final = q * w[w.length - 1]['close'] + rem;
  const yrs = w.length / 252.0;
  const cagr = (Math.pow(final / initial, 1 / yrs) - 1) * 100;
  return {
    net_pct: (final / initial - 1) * 100,
    cagr: cagr,
    maxdd: maxdd * 100,
    rpd: maxdd > 0 ? cagr / (maxdd * 100) : 0.0,
  };
}

// ---------------------------------------------------------------- seam

/**
 * The swappable seam. Returns the engine as an object so a hosted
 * implementation can be dropped in behind the same interface. The methods are
 * the module-level functions themselves — there is no per-instance state, and
 * there must never be any: the engine is a pure function of bars and config.
 */
export function createSignalEngine() {
  return {
    BASELINE,
    tf_scale,
    scaled_params,
    supertrend_vegas,
    prepare_filters,
    prepare,
    ladder_part,
    run,
    hold,
  };
}
