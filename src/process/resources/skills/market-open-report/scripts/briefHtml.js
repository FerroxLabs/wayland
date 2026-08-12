/**
 * Render morning_report's JSON as the customer-facing morning brief.
 *
 * Ported from tools/brief_html.py (tvcontrol skills/market-open-report).
 *
 *     node morningReport.js --json out.json
 *     node briefHtml.js out.json brief.html [--account 10000]
 *
 * THE ORDER IS THE ARGUMENT.
 *
 *   1  Pressure, because a reader wants to know what kind of day it is before
 *      they want to know anything about their own book.
 *   2  The eight instruments, each with its real sixty-close shape.
 *   3  Capacity, because 54 names qualifying against 20 slots is the decision
 *      this product turns on and it is the thing people get wrong.
 *   4  ONE WORKED TRADE, in full, with real prices. Everything else on the page
 *      is aggregate, and aggregates do not teach anyone what to actually do.
 *   5  Overnight events, then your book, then the whole holdings table.
 *
 * THE TABLE IS SORTED BY UNREALISED GAIN AND THAT IS NOT A RANKING. Four ranking
 * rules were tested and none beat first come. The cut line at the slot count marks
 * where the account runs out, NOT which names to prefer, and it says so on the row,
 * because a line drawn across a sorted table is read as a recommendation unless
 * something states otherwise.
 *
 * ---------------------------------------------------------------------------
 * PORTING NOTES (read before changing anything below)
 *
 * STANDALONE IS THE WHOLE POINT. The document is one file: inline <style> from
 * briefCss.js, inline SVG from briefCharts.js, no script tag, no font, no image,
 * no href to anywhere. It has to open from disk on a machine with no network,
 * so nothing here may ever grow an external reference.
 *
 * Number formatting never uses toFixed. Python's f'{x:.1f}' rounds HALF-TO-EVEN
 * on the exact binary value; toFixed rounds half-away. pyFmt from briefCharts.js
 * is the exact CPython formatter and every formatted number goes through it.
 *
 * PYTHON TRUTHINESS IS NOT JAVASCRIPT TRUTHINESS and this file is full of it.
 * An empty dict and an empty list are FALSY in Python and TRUTHY in JavaScript,
 * so every `if pr:` / `if mkt:` / `if not mine:` becomes an explicit length or
 * key-count test. Getting one of those wrong renders an empty section rather
 * than skipping it, which is silent.
 *
 * The order of every arithmetic expression is preserved exactly as written in
 * the Python. Both languages use IEEE-754 doubles, so identical order gives
 * identical results; reordering for elegance would silently change last digits.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import {
  pyFmt,
  gauge,
  sparkline,
  histogram,
  ladder_mix,
  trade_chart,
} from './briefCharts.js';
import { CSS } from './briefCss.js';

export const TPS = [1.5, 3.0, 6.0, 12.0];
export const QTY = [25, 20, 10, 15];

// NO BRAND LOCKUP. The first version put a TC-TIDE mark above the headline and
// it read as a logo on a document that is not an advert. The page is a brief;
// the masthead says so and nothing else.

// --------------------------------------------------------------------------
// Python semantics the language does not give us
// --------------------------------------------------------------------------

/**
 * Python's truth test, which is NOT JavaScript's. An empty list and an empty
 * dict are FALSY in Python and TRUTHY in JavaScript.
 *
 * This is not theoretical: morning_report always emits `trimmed_today` and
 * `rungs` as lists, empty on the ordinary day. `rows.filter(r => r.trimmed_today)`
 * kept all 74 rows and printed the entire watchlist under "Targets filled".
 */
function pyTruthy(v) {
  if (v === null || v === undefined || v === false) return false;
  if (v === 0 || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return Boolean(v);
}

/**
 * `html.escape(str(x))`, i.e. quote=True: the five replacements in CPython's
 * order, & first so the later entities are not double-escaped.
 *
 * str(None) is 'None' where String(null) is 'null'; the JSON carries a null
 * `entry_date` on every flat row, so that case is folded in rather than left to
 * drift. Booleans still differ ('True' vs 'true') and are never escaped here.
 */
export function esc(x) {
  return String(x === null || x === undefined ? 'None' : x)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * `money(v, dp=None)`. Thousands separators always; two decimals under 1000 and
 * none at or above it, so a price reads to the cent and an account balance does
 * not carry noise.
 *
 * Python tests `v is None`. undefined is folded in with it because a missing
 * key reaches here as undefined where Python would have raised KeyError first.
 */
export function money(v, dp = null) {
  if (v === null || v === undefined) {
    return '-';
  }
  if (dp !== null && dp !== undefined) {
    return pyFmt(v, dp, { comma: true });
  }
  return Math.abs(v) < 1000
    ? pyFmt(v, 2, { comma: true })
    : pyFmt(v, 0, { comma: true });
}

/**
 * Python's str() for a float. Needed for the one number interpolated with no
 * format spec: the '+3.0%' in the rung labels. TPS holds Python floats, and
 * str(3.0) is '3.0' where String(3) is '3'.
 */
function pyFloatStr(v) {
  if (Number.isNaN(v)) return 'nan';
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : '-inf';
  if (Number.isInteger(v) && Math.abs(v) < 1e16) {
    return (Object.is(v, -0) ? '-0' : String(v)) + '.0';
  }
  return String(v);
}

/**
 * Python's max() over an iterable, with `default=`. It keeps the FIRST maximal
 * element (it only replaces on a strict `>`), which Math.max does not: for the
 * signed zeros Math.max(-0, 0) is 0 where Python's max(-0.0, 0.0) is -0.0, and
 * that prints as '-0' rather than '+0'. Also used on the bar-date strings,
 * where Math.max is not applicable at all.
 */
function pyMax(items, dflt) {
  let best;
  let has = false;
  for (const it of items) {
    if (!has) {
      best = it;
      has = true;
    } else if (it > best) {
      best = it;
    }
  }
  return has ? best : dflt;
}

/** Python's min(): keeps the first minimal element. Raises on empty; the one
 *  caller is guarded by `if held:` so the empty case is unreachable and this
 *  returns undefined rather than throwing. */
function pyMin(items) {
  let best;
  let has = false;
  for (const it of items) {
    if (!has) {
      best = it;
      has = true;
    } else if (it < best) {
      best = it;
    }
  }
  return best;
}

/** C copysign(0.0, x): a zero carrying the sign bit of x. */
function copysignZero(x) {
  return (x < 0 || Object.is(x, -0)) ? -0 : 0;
}

/**
 * Python's `a // b` for FLOATS, which is CPython float_floor_div in
 * Objects/floatobject.c and is NOT Math.floor(a / b).
 *
 * a / b rounds to nearest, so it can land exactly on an integer the true
 * quotient sits just below: 500 // 0.1 is 4999 in Python and
 * Math.floor(500 / 0.1) is 5000. Penny prices reach that case, and the result
 * is a share count, so the difference is a whole share of real money.
 *
 * Python raises ZeroDivisionError on b == 0. The only caller guards with
 * `if px`, so instead of throwing this returns the IEEE result and the guard
 * keeps it unreachable.
 */
function pyFloorDivFloat(vx, wx) {
  if (wx === 0) return vx / wx;
  let mod = vx % wx;                    // JS % is C fmod: sign of the dividend
  let div = (vx - mod) / wx;
  if (mod) {
    if ((wx < 0) !== (mod < 0)) {
      mod += wx;
      div -= 1.0;
    }
  }
  let floordiv;
  if (div) {
    floordiv = Math.floor(div);
    if (div - floordiv > 0.5) floordiv += 1.0;
  } else {
    floordiv = copysignZero(vx / wx);
  }
  return floordiv;
}

const p2 = (n) => String(n).padStart(2, '0');

/** datetime.now().strftime('%Y-%m-%d %H:%M') in local time, zero-padded. */
function nowStamp(dt) {
  return `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())} `
    + `${p2(dt.getHours())}:${p2(dt.getMinutes())}`;
}

/** `sorted(xs, key=...)` for a single scalar key. Stable in both languages;
 *  the comparator reproduces the ordering without subtracting, so it works on
 *  strings as well as numbers and never sees a -0 artefact. */
function sortedBy(xs, key) {
  return xs.slice().sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/** Python's `d.get(k, default)`: a key present and null returns null, not the
 *  default. `d[k] ?? default` would get that wrong. */
function pyGet(d, k, dflt) {
  return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : dflt;
}

// --------------------------------------------------------------------------

export function build(d, account = 10000.0) {
  const rows = d.rows.filter((r) => !('error' in r));
  const slots = pyGet(d, 'slots', 20);
  const held = sortedBy(rows.filter((r) => pyTruthy(r.open)), (r) => -(r.unreal || 0));
  // `new` is a reserved word in JavaScript; this is the Python's `new`.
  const new_ = rows.filter((r) => pyTruthy(r.entered_today));
  const out = rows.filter((r) => pyTruthy(r.closed_today));
  const trim = rows.filter((r) => pyTruthy(r.trimmed_today));
  const bar = pyMax(rows.map((r) => r.bar), '?');
  const built = nowStamp(new Date());
  const tier = pyGet(d, 'tier', 1);
  const mkt = d.market || [];
  const pr = d.pressure || {};
  const free = Math.max(0, slots - held.length);
  const over = Math.max(0, held.length - slots);
  const P = [];

  // ---------------- masthead ----------------
  P.push('<div class="page">');
  P.push('<header class="top"><div>'
    + '<p class="brand">Morning brief</p>'
    + `<h1>${esc(bar)} `
    + `<span class="thin">&middot; Tier ${tier}</span></h1>`
    // THE HEADLINE DATE IS THE BAR, NOT TODAY, and a saved copy of
    // this page gives no other clue. A brief read four days late
    // looks exactly like a brief read on the morning it was built.
    // Both dates ship, deliberately: the bar date in the headline and the
    // build stamp beside it. Dropping either one is how a stale brief
    // passes for a fresh one.
    + '<p class="ms" style="margin-top:4px">closes through '
    + `${esc(bar)}, generated ${esc(built)}</p></div>`
    + '<div class="stampset">'
    + '<div class="stamp"><div class="k">Watching</div>'
    + `<div class="v">${rows.length}</div></div>`
    + '<div class="stamp"><div class="k">In a trade</div>'
    + `<div class="v">${held.length}</div></div>`
    + '<div class="stamp"><div class="k">Slots</div>'
    + `<div class="v">${slots}</div></div>`
    + '</div></header>');

  // ---------------- hero ----------------
  // ONE FULL-WIDTH BAND, not two columns. The first version put a tall gauge
  // card beside a short summary card and the grid stretched the summary to
  // match, leaving well over half of it empty. The rail spans the width, the
  // four components sit under it as chips, and the summary reads across the
  // whole measure instead of down a narrow gutter.
  if (Object.keys(pr).length) {                 // `if pr:` -- {} is falsy in Python
    P.push('<section class="press">');
    P.push(gauge(pr.score));
    P.push('<div class="chips">');
    for (const c of pyGet(pr, 'components', [])) {
      const cc = c.v >= 55 ? 'var(--bull)'
        : c.v >= 45 ? 'var(--gold)' : 'var(--bear)';
      P.push(`<div class="chip"><div class="chipk">${esc(c.k)}</div>`
        + `<div class="chipv" style="color:${cc}">${pyFmt(c.v, 0)}</div>`
        + `<div class="chiptrack"><i style="width:${pyFmt(Math.max(3, c.v), 0)}%;`
        + `background:${cc}"></i></div>`
        + `<div class="chipl">${esc(c.label)}</div></div>`);
    }
    P.push('</div>');
    P.push('<p class="presssub">Market pressure is four equally weighted '
      + 'measurements of closes that <b>already happened</b>. It is a '
      + 'description of where the market is, not a forecast of where '
      + 'it goes.</p>');
    P.push('</section>');
  }

  // `ev` and `up` are built and never read, in the Python too. Kept so the two
  // files stay line-for-line comparable; neither reaches the output.
  const ev = [];
  if (out.length) {
    ev.push(`${out.length} closed`);
  }
  if (new_.length) {
    ev.push(`${new_.length} entered`);
  }
  if (trim.length) {
    ev.push(`${trim.length} took a target`);
  }
  const up = rows.filter((r) => r.trend === 1).length;
  void ev;
  void up;
  P.push('<section class="lede">');
  if (pyTruthy(d.market_summary)) {
    P.push(`<p class="summary">${esc(d.market_summary)}</p>`);
  }
  P.push('<div class="ledestats">'
    + `<div class="ls"><b>${held.length}</b><span>of ${rows.length} in a live trade</span></div>`
    + `<div class="ls"><b>${Math.max(0, held.length - slots)}</b><span>more than you can hold</span></div>`
    + `<div class="ls"><b>${out.length}</b><span>closed overnight</span></div>`
    + `<div class="ls"><b>${new_.length}</b><span>new entries</span></div>`
    + `<div class="ls"><b>${trim.length}</b><span>targets filled</span></div>`
    + '</div>');
  P.push('</section>');

  // ---------------- market grid ----------------
  if (mkt.length) {                             // `if mkt:` -- [] is falsy in Python
    P.push('<h2 class="sec">State of play</h2>');
    P.push('<div class="mkt">');
    for (const m of mkt) {
      const up_ = m.chg >= 0;
      const v50 = (m.ma50 && m.close > m.ma50) ? 'above' : 'below';
      P.push(
        '<div class="mcell"><div class="mrow">'
        + `<span class="mn">${esc(m.name)}</span>`
        + `<span class="mc ${up_ ? 'pos' : 'neg'}">${pyFmt(m.chg, 1, { sign: true })}%</span>`
        + `</div><div class="mv">${money(m.close)}</div>`
        + `<div class="ms">5d ${pyFmt(m.chg5, 1, { sign: true })}% &middot; ${v50} 50d `
        + `&middot; ${pyFmt(m.pct, 0)}th pctile</div>`
        // The label is interpolated raw, as in the Python; sparkline puts it in
        // an aria-label attribute.
        + sparkline(m.spark || [], 132, 34, up_, `${m.name} last 60 closes`)
        + '</div>');
    }
    P.push('</div>');
  }

  // ---------------- capacity ----------------
  P.push('<h2 class="sec">Capacity</h2>');
  let cells = '';
  for (let i = 0; i < Math.max(held.length, slots); i += 1) {
    cells += `<div class="cell${i < Math.min(held.length, slots) ? '' : ' over'}"></div>`;
  }
  P.push('<section class="card">');
  P.push('<div style="font-family:var(--mono);font-size:15px">'
    + `<b>${Math.min(held.length, slots)}</b> of <b>${slots}</b> slots filled`
    + (over ? ` &middot; <b>${over}</b> more qualify than you can hold`
      : ` &middot; <b>${free}</b> free`) + '</div>');
  P.push(`<div class="cells">${cells}</div>`);
  P.push('<p class="note">Solid is what you can hold, outlined is the '
    + 'overflow. ' + (over
      ? 'This is normal and not an error: you are meant to own a '
        + 'subset. There is no measured rule for choosing which, so '
        + 'pick one and keep it. What <b>is</b> measured is that the '
        + 'cost of choosing badly falls as the slot count rises, which '
        + 'is the argument for holding more of them rather than for '
        + 'choosing better.'
      : 'Take new signals only into the outlined slots.') + '</p>');
  P.push('</section>');

  // ---------------- one worked trade, end to end ----------------
  const demo = new_.length ? new_[0] : (held.length ? held[0] : null);
  if (pyTruthy(demo)) {
    const live = Boolean(new_.length);
    const px = live ? demo.close : demo.entry;
    const per_slot = account / slots;
    const sh = px ? Math.trunc(pyFloorDivFloat(per_slot, px)) : 0;
    let steps = '';
    for (let j = 0; j < Math.min(TPS.length, QTY.length); j += 1) {
      const i = j + 1;                          // enumerate(..., start=1)
      const t = TPS[j];
      const q = QTY[j];
      const doneflag = (!live) && (demo.rungs || []).includes(`TP${i}`);
      steps += (`<div class="step${doneflag ? ' done' : ''}">`
        + `<div class="p">${money(px * (1 + t / 100))}</div>`
        + `<div class="q">T${i} &middot; +${pyFloatStr(t)}% &middot; sell ${q}%`
        + `${doneflag ? ' &middot; FILLED' : ''}</div></div>`);
    }
    P.push('<h2 class="sec">A trade, end to end</h2>');
    P.push('<section class="trade">');
    P.push('<div class="tradehead">'
      + `<div><div class="tradesym">${esc(demo.tv)}</div>`
      + '<div class="ms" style="margin-top:3px">'
      + (live ? 'entered at the close of the last bar'
        : `open since ${esc(demo.entry_date)} &middot; shown as a `
          + 'worked example'
          + (pyTruthy(pyGet(d.demo || {}, 'entry_in_frame', true)) ? ''
            : ' &middot; open too long to fit its entry on the '
              + 'chart below')) + '</div></div>'
      + (live ? '<span class="pill">Live entry</span>'
        : '<span class="pill demo">Worked example</span>')
      + '</div>');
    const dm = d.demo || {};
    if (pyTruthy(dm.bars)) {
      P.push('<div style="padding:6px 14px 0">'
        + trade_chart(dm.bars, dm.entry || px, pyGet(dm, 'entry_date', null),
          pyGet(dm, 'rungs', null), TPS)
        + '</div>');
    }
    P.push('<div class="tradebody"><div class="tradeleft">');
    P.push('<dl class="kv">'
      + `<dt>Entry price</dt><dd>${money(px)}</dd>`
      + `<dt>Account</dt><dd>${money(account, 0)}</dd>`
      + `<dt>One slot, 1 of ${slots}</dt><dd>${money(per_slot, 0)}</dd>`
      + `<dt>Shares you buy</dt><dd>${sh}</dd>`
      + `<dt>Committed</dt><dd>${money(sh * px)}</dd>`
      + '<dt>Runner kept back</dt><dd>30%</dd>'
      + (!live
        ? `<dt>Now</dt><dd class="${(demo.unreal || 0) >= 0 ? 'pos' : 'neg'}">`
          + `${money(demo.close)} &middot; ${pyFmt(demo.unreal || 0, 1, { sign: true })}%</dd>`
        : '')
      + '</dl>');
    P.push('<p class="note" style="font-size:12px">The four targets sell '
      + '70% between them. The last 30% has no target and rides until '
      + 'the trend turns, which is where the large winners come from '
      + 'and why the ladder deliberately does not add to 100.</p>');
    P.push('</div><div class="traderight">');
    P.push('<div class="ms" style="margin-bottom:7px">THE LADDER</div>');
    P.push(`<div class="ladderrow">${steps}`
      + '<div class="runner"><div class="p">30%</div>'
      + '<div class="q">runner</div></div></div>');
    P.push('<p class="note" style="font-size:12px;margin-top:14px">'
      + (live
        ? 'Place the four targets as limit orders the moment the '
          + 'entry fills. The trend line on the chart is where the '
          + 'runner exits; it moves, so read it there rather than '
          + 'fixing a number now.'
        : 'Filled targets are highlighted. This position is already '
          + 'part way up its ladder.') + '</p>');
    P.push('</div></div></section>');
  }

  // ---------------- overnight ----------------
  const cardset = (items, cls, title, line) => {
    if (!items.length) {
      return;
    }
    P.push(`<h2 class="sec">${title}</h2><div class="cards">`);
    for (const r of sortedBy(items, (x) => x.sym)) {
      P.push(`<div class="mini ${cls}"><div class="t">${esc(r.tv)}</div>`
        + `<div class="m">${line(r)}</div>`
        + `<div class="p">${money(r.close)} `
        + `<span class="${r.chg >= 0 ? 'pos' : 'neg'}">`
        + `${pyFmt(r.chg, 1, { sign: true })}%</span></div></div>`);
    }
    P.push('</div>');
  };

  cardset(out, 'bear', 'Closed on the last bar',
    (r) => `exit: ${esc(r.closed_today)}`);
  cardset(new_, 'bull', 'New entries', () => 'entered at the close');
  cardset(trim, 'gold', 'Targets filled',
    (r) => `${esc(r.trimmed_today.join(', '))} sold`);

  // ---------------- your book ----------------
  const mine = d.mine || {};
  // A Map, not an object: JavaScript reorders integer-like string keys on a
  // plain object and a ticker can be all digits on some exchanges.
  const bysym = new Map(rows.map((r) => [r.tv.toUpperCase(), r]));
  P.push('<h2 class="sec">Your book</h2>');
  if (!Object.keys(mine).length) {              // `if not mine:` -- {} is falsy
    P.push('<p class="empty">No positions file, so everything above '
      + 'describes what the <b>system</b> holds rather than what '
      + '<b>you</b> hold. To make this section tell you what to do '
      + 'today, list your open positions in '
      + '<code>package/exports/positions.csv</code>: one line each, '
      + '<code>symbol,shares,entry_date,entry_price</code>. That is '
      + 'the one thing this brief cannot work out on its own.</p>');
  } else {
    const acts = [];
    // sorted(mine.items()) compares tuples element-wise, but dict keys are
    // unique so the value is never reached and this is a sort on the key.
    for (const sym of sortedBy(Object.keys(mine), (k) => k)) {
      const r = bysym.get(sym);
      if (r === undefined) {                    // `if r is None`
        acts.push(['bear', sym, 'not on the watchlist. Nothing here '
          + 'tracks it and no exit will be reported for it.']);
      } else if (pyTruthy(r.closed_today)) {
        acts.push(['bear', sym, 'EXITED overnight '
          + `(${esc(r.closed_today)}). Close it at the open.`]);
      } else if (pyTruthy(r.trimmed_today)) {
        acts.push(['gold', sym, `${esc(r.trimmed_today.join(', '))} `
          + 'filled. Take the partial profit.']);
      } else if (!pyTruthy(r.open)) {
        acts.push(['bear', sym, 'the system is flat here but you are '
          + 'not. Check why before adding to it.']);
      } else {
        acts.push(['bull', sym, 'still open, system unrealised '
          + `${pyFmt(r.unreal || 0, 1, { sign: true })}%. Nothing to do.`]);
      }
    }
    const urgent = acts.filter((a) => a[0] === 'bear').length;
    P.push('<p class="note" style="margin:0 0 12px">You hold '
      + `<b>${Object.keys(mine).length}</b> of ${slots} slots &middot; `
      + `<b>${Math.max(0, slots - Object.keys(mine).length)}</b> free &middot; `
      + `<b>${urgent}</b> need action today</p>`);
    P.push('<div class="cards">');
    for (const [cls, sym, msg] of acts) {
      P.push(`<div class="mini ${cls}"><div class="t">${esc(sym)}</div>`
        + `<div class="m">${msg}</div></div>`);
    }
    P.push('</div>');
  }

  // ---------------- shape of the book ----------------
  if (held.length) {
    const vals = held.map((r) => r.unreal || 0);
    const counts = [0, 0, 0, 0, 0];
    for (const r of held) {
      // Python raises IndexError past four rungs; JavaScript would silently
      // extend the array and change what ladder_mix is given.
      counts[(r.rungs || []).length] += 1;
    }
    const wins = vals.filter((v) => v >= 0).length;
    P.push('<h2 class="sec">Shape of the book</h2><div class="grid2">');
    P.push('<figure class="card" style="margin:0">'
      + '<div class="ms" style="margin-bottom:6px">UNREALISED, EVERY '
      + 'OPEN POSITION</div>' + histogram(vals)
      + `<figcaption>${wins} of ${vals.length} are above water. The `
      + `median is ${pyFmt(sortedBy(vals, (v) => v)[Math.floor(vals.length / 2)], 1, { sign: true })}%, the best `
      + `${pyFmt(pyMax(vals), 0, { sign: true })}% and the worst ${pyFmt(pyMin(vals), 1, { sign: true })}%. A trend `
      + 'system is meant to look like this: a long right tail paying '
      + 'for a crowd of small ones.</figcaption></figure>');
    P.push('<figure class="card" style="margin:0">'
      + '<div class="ms" style="margin-bottom:6px">LADDER PROGRESS</div>'
      + ladder_mix(counts)
      + `<figcaption>${counts[4]} position`
      + `${counts[4] !== 1 ? 's are' : ' is'} through all four `
      + `targets and running on the 30% runner. ${counts[0]} `
      + `${counts[0] !== 1 ? 'have' : 'has'} not reached the first `
      + 'target yet.</figcaption></figure>');
    P.push('</div>');
  }

  // ---------------- holdings ----------------
  P.push(`<h2 class="sec">Holding &middot; ${held.length} names</h2>`);
  P.push('<div class="tw"><div class="scroll"><table>'
    + '<caption class="sr" style="position:absolute;left:-9999px">'
    + 'Open positions, sorted by unrealised gain</caption>'
    + '<thead><tr><th scope="col">Symbol</th>'
    + '<th scope="col" style="text-align:right">Close</th>'
    + '<th scope="col" style="text-align:right">Day</th>'
    + '<th scope="col">In from</th>'
    + '<th scope="col" style="text-align:right">Entry</th>'
    + '<th scope="col" style="text-align:right">Unrealised</th>'
    + '<th scope="col">Ladder</th></tr></thead><tbody>');
  for (let i = 0; i < held.length; i += 1) {
    const r = held[i];
    if (i === slots && held.length > slots) {
      P.push(`<tr class="cutrow"><td colspan="7">Your ${slots} slots `
        + `end here &middot; the ${held.length - slots} below qualify `
        + 'too &middot; this order is display, not advice</td></tr>');
    }
    const u = r.unreal || 0;
    let rungs = '';
    for (const k of [1, 2, 3, 4]) {
      rungs += `<span class="rung${(r.rungs || []).includes(`TP${k}`) ? ' on' : ''}">`
        + `${k}</span>`;
    }
    P.push(`<tr><td class="sym">${esc(r.tv)}</td>`
      + `<td class="r">${money(r.close)}</td>`
      + `<td class="r ${r.chg >= 0 ? 'pos' : 'neg'}">`
      + `${pyFmt(r.chg, 1, { sign: true })}%</td>`
      + `<td>${esc(r.entry_date)}</td>`
      + `<td class="r">${money(r.entry)}</td>`
      + `<td class="r ${u >= 0 ? 'pos' : 'neg'}">${pyFmt(u, 1, { sign: true })}%</td>`
      + `<td><span class="rungs">${rungs}</span></td></tr>`);
  }
  P.push('</tbody></table></div></div>');

  P.push('<p class="foot"><b>Read this before acting.</b> Prices are daily '
    + 'closes for the session shown, not live quotes. Entries and exits '
    + 'happen at the CLOSE of the bar that signalled them, so this brief '
    + 'describes a decision you act on at the next open.<br><br>'
    + 'The ladder squares show which of the four profit targets have '
    + 'filled; a position with all four lit is running on its 30% '
    + 'runner. Market pressure is a description of closes that already '
    + 'happened and is not a forecast.<br><br>'
    + '<b>Never rotate out of a live trade to fund a fresh signal.</b> '
    + 'Nothing in this system was tested that way.</p>');
  P.push('</div>');
  return P.join('\n');
}

export function main(argv = process.argv.slice(1)) {
  // argv is sliced to mirror sys.argv: argv[0] is the script, so src and dst
  // stay at [1] and [2] and indexOf('--account') lines up with .index().
  const src = argv[1];
  const dst = argv[2];
  let account = 10000.0;
  if (argv.includes('--account')) {
    // Python float() and Number() disagree on the edges -- Number() takes
    // '0x10' and rejects 'inf', float() the reverse -- but agree on every
    // decimal string this flag is ever given.
    account = Number(argv[argv.indexOf('--account') + 1]);
  }
  const d = JSON.parse(readFileSync(src, 'utf-8'));
  const bar = pyMax(d.rows.filter((r) => !('error' in r)).map((r) => r.bar), '');
  // The title takes the bar date UNESCAPED, exactly as the Python does.
  const head = `<title>TC-TIDE Morning Brief ${bar}</title>\n${CSS}`;
  // Standalone document: the publisher tolerates a whole page, a browser
  // opening this from disk does not tolerate half of one.
  writeFileSync(dst,
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    + head + '\n</head>\n<body>\n' + build(d, account)
    + '\n</body>\n</html>\n');
  console.log('wrote', dst);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
