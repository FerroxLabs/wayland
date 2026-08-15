/**
 * positions.mjs — faithful port of
 * /Users/seandonahoe/dev/tvcontrol/skills/market-open-report/tools/positions.py
 *
 * What YOU hold, as twelve lines of CSV rather than a portfolio manager.
 *
 *     positions.csv
 *         symbol,shares,entry_date,entry_price
 *         NASDAQ:NVDA,120,2026-05-14,142.30
 *
 * WHY THIS AND NOT A TRADE TRACKER. The brief already knows, exactly and
 * without being told, what the SYSTEM says about all 74 names. The only thing
 * it cannot know is which of them you actually took, and that is one short list
 * you already have in your broker. A full tracker means fills, partial fills,
 * commissions, adjusted cost basis, corporate actions and tax lots: months of
 * work, a permanent maintenance burden, and a second place for your position
 * data to be wrong.
 *
 * ENTRY PRICE IS YOURS, NOT THE SYSTEM'S. You will not have filled at the
 * signal close and pretending otherwise would put a number in front of you that
 * no statement agrees with.
 *
 * PORTING NOTES
 *  - The Python defaults `path` to a location derived from __file__. Here the
 *    CSV path is a REQUIRED PARAMETER: the app owns where user data lives, the
 *    same reason the Yahoo cache directory is injected rather than hardcoded.
 *  - `load` returns a Map, not a plain object. The Python dict is keyed by
 *    ticker symbol and preserves insertion order; a JS object silently reorders
 *    integer-like string keys ("2330", "600519" are real tickers), so a Map is
 *    the only structure that reproduces Python's ordering.
 *  - Only `load` and its dependencies are ported. `template()`, the `HEADER`
 *    constant it writes, and the `__main__` block are NOT ported — this module
 *    reads; the app owns file creation.
 */

import { existsSync, readFileSync } from 'node:fs';

/** Raised where Python's float() would raise ValueError. */
export class PyValueError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PyValueError';
  }
}

/**
 * Characters for which Python's str.isspace() is True, i.e. exactly what
 * str.strip() removes. Deliberately NOT JS String.prototype.trim(): trim()
 * also strips U+FEFF (which Python does not) and skips U+001C..U+001F and
 * U+0085 (which Python does).
 */
const PY_SPACE = /[\t\n\v\f\r\x1c-\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/;

/** Python str.strip() with no argument. */
export function pyStrip(s) {
  let a = 0;
  let b = s.length;
  while (a < b && PY_SPACE.test(s[a])) a += 1;
  while (b > a && PY_SPACE.test(s[b - 1])) b -= 1;
  return s.slice(a, b);
}

/*
 * Python's float() grammar. Accepts a leading sign, underscores BETWEEN digits
 * only, a bare trailing or leading decimal point ("1." / ".5"), and an
 * exponent. Number() is not a substitute: it accepts "0x10", "0b11", "" and
 * whitespace-only (all ValueError in Python) and rejects "1_000.5" and "inf"
 * (both fine in Python).
 */
const PY_FLOAT =
  /^[+-]?(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?$/;
const PY_FLOAT_SPECIAL = /^([+-]?)(inf(?:inity)?|nan)$/i;

/**
 * Python float(). Throws PyValueError exactly where Python raises ValueError.
 * Both languages then do correctly-rounded IEEE-754 decimal -> binary
 * conversion, so the resulting doubles are bit-identical.
 */
export function pyFloat(value) {
  if (typeof value === 'number') return value; // float(0) -> 0.0
  const raw = String(value);
  const s = pyStrip(raw);
  if (PY_FLOAT.test(s)) return Number(s.replace(/_/g, ''));
  const special = PY_FLOAT_SPECIAL.exec(s);
  if (special) {
    if (special[2].toLowerCase() === 'nan') return NaN;
    return special[1] === '-' ? -Infinity : Infinity;
  }
  throw new PyValueError(`could not convert string to float: '${raw}'`);
}

/**
 * Python's csv.reader with the default 'excel' dialect: delimiter ',',
 * quotechar '"', doublequote true, escapechar none, skipinitialspace false,
 * strict false. Yields arrays of fields; a blank line yields [], which is what
 * dictReader skips.
 *
 * `text` must already have had universal-newline translation applied (see
 * load), matching a file opened in Python text mode with newline=None.
 */
export function* csvReader(text) {
  const START_RECORD = 0;
  const START_FIELD = 1;
  const IN_FIELD = 2;
  const IN_QUOTED_FIELD = 3;
  const QUOTE_IN_QUOTED_FIELD = 4;

  let state = START_RECORD;
  let field = '';
  let row = [];

  // i === text.length is the EOF tick; c === null means EOF.
  for (let i = 0; i <= text.length; i += 1) {
    const c = i < text.length ? text[i] : null;

    if (state === START_RECORD) {
      if (c === null) return; // EOF between records: nothing pending
      if (c === '\n') {
        yield []; // blank line -> empty record
        continue;
      }
      state = START_FIELD; // fall through to START_FIELD for this same char
    }

    if (state === START_FIELD) {
      if (c === '"') {
        state = IN_QUOTED_FIELD;
      } else if (c === ',') {
        row.push('');
      } else if (c === '\n' || c === null) {
        row.push('');
        yield row;
        row = [];
        state = START_RECORD;
      } else {
        field += c;
        state = IN_FIELD;
      }
    } else if (state === IN_FIELD) {
      if (c === '\n' || c === null) {
        row.push(field);
        field = '';
        yield row;
        row = [];
        state = START_RECORD;
      } else if (c === ',') {
        row.push(field);
        field = '';
        state = START_FIELD;
      } else {
        field += c;
      }
    } else if (state === IN_QUOTED_FIELD) {
      if (c === null) {
        // EOF inside a quoted field. strict=False: save the field and end.
        row.push(field);
        field = '';
        yield row;
        row = [];
        state = START_RECORD;
      } else if (c === '"') {
        state = QUOTE_IN_QUOTED_FIELD;
      } else {
        field += c; // newlines are literal inside quotes
      }
    } else if (state === QUOTE_IN_QUOTED_FIELD) {
      if (c === '"') {
        field += '"'; // doublequote escape
        state = IN_QUOTED_FIELD;
      } else if (c === ',') {
        row.push(field);
        field = '';
        state = START_FIELD;
      } else if (c === '\n' || c === null) {
        row.push(field);
        field = '';
        yield row;
        row = [];
        state = START_RECORD;
      } else {
        field += c; // strict=False: stray char after a closing quote
        state = IN_FIELD;
      }
    }
  }
}

const RESTKEY = null; // csv.DictReader restkey default
const RESTVAL = null; // csv.DictReader restval default

/**
 * Python's csv.DictReader. Yields a Map per row (a Map, not an object, for the
 * same integer-like-key reason as load's return value; header names are
 * arbitrary strings).
 *
 * Reproduces two easily-missed behaviours: the FIRST record becomes the header
 * even when it is empty (a leading blank line therefore gives zero fieldnames),
 * and blank records AFTER the header are skipped rather than yielded.
 */
export function* dictReader(rows) {
  const it = rows[Symbol.iterator]();
  const first = it.next();
  if (first.done) return; // empty file: fieldnames stays None, yields nothing
  const fieldnames = first.value;

  for (;;) {
    let n = it.next();
    if (n.done) return;
    let row = n.value;
    while (row.length === 0) {
      n = it.next();
      if (n.done) return;
      row = n.value;
    }

    const d = new Map();
    const lf = fieldnames.length;
    const lr = row.length;
    for (let i = 0; i < lf && i < lr; i += 1) d.set(fieldnames[i], row[i]);
    if (lr > lf) d.set(RESTKEY, row.slice(lf));
    else if (lr < lf) for (let i = lr; i < lf; i += 1) d.set(fieldnames[i], RESTVAL);
    yield d;
  }
}

/** Python's `x or fallback` for a value that is always a string or None. */
function pyOr(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

/**
 * symbol -> object, or an empty Map when the file is absent. Absent is a valid
 * state and must never be an error: most people will start without one.
 *
 * @param {string} path Absolute path to positions.csv. Required — the app owns
 *   where user data lives.
 * @returns {Map<string, {symbol: string, shares: number, entry_date: string,
 *   entry_price: number|null} | string[]>} Symbol keys map to position records.
 *   The extra key '__bad__' maps to an array of the raw symbols whose rows were
 *   malformed. Callers that count positions must skip keys starting with '__',
 *   as the Python __main__ block does.
 */
export function load(path) {
  if (typeof path !== 'string' || path === '') {
    throw new TypeError('load(path): an explicit positions.csv path is required');
  }
  if (!existsSync(path)) {
    return new Map();
  }
  const out = new Map();
  // Python opens in text mode with newline=None, which folds \r\n and lone \r
  // to \n before csv ever sees them. Note this decodes UTF-8 unconditionally,
  // where Python uses the locale preferred encoding.
  const text = readFileSync(path, 'utf8').replace(/\r\n?/g, '\n');
  for (const row of dictReader(csvReader(text))) {
    const sym = pyStrip(pyOr(row.get('symbol'), ''));
    if (!sym || sym.startsWith('#')) {
      continue;
    }
    try {
      // Evaluated in the Python dict literal's order, because whichever field
      // is malformed first is the one that raises.
      const symbol = sym.toUpperCase();
      const shares = pyFloat(pyOr(row.get('shares'), 0));
      const entryDate = pyStrip(pyOr(row.get('entry_date'), ''));
      const entryPrice = pyFloat(pyOr(row.get('entry_price'), 0));
      out.set(symbol, {
        symbol,
        shares,
        entry_date: entryDate,
        // Python's `float(...) or None`: 0.0 and -0.0 become None, but NaN is
        // truthy in Python and survives. `x || null` would wrongly nul NaN.
        entry_price: entryPrice === 0 ? null : entryPrice,
      });
    } catch (e) {
      if (!(e instanceof PyValueError)) throw e;
      // A malformed line is skipped and NAMED rather than silently dropped,
      // because a position you believe is tracked and is not is worse than
      // having no file at all.
      if (!out.has('__bad__')) out.set('__bad__', []);
      out.get('__bad__').push(sym);
    }
  }
  return out;
}
