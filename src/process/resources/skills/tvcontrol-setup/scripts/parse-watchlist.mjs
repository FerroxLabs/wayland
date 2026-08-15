#!/usr/bin/env node
/**
 * parse-watchlist.mjs — turn a TradingView watchlist export into the two shapes
 * TVControl will actually accept.
 *
 *     node parse-watchlist.mjs <export.txt> [--json OUT] [--batch-size 100]
 *
 * WHY THIS EXISTS
 * ---------------
 * `watchlist_import` reads a JSON file in the shape `watchlist_export` writes:
 *
 *     { "schema_version": 1, "symbols": [ { "symbol": "NASDAQ:AAPL" }, ... ] }
 *
 * What a user actually has on disk is TradingView's own UI export: ONE line,
 * a `###` section header, then comma-separated `EXCHANGE:SYMBOL` tokens.
 *
 *     ###TC MASTER,NASDAQ:SOUN,NYSE:IONQ,NASDAQ:ARM,...
 *
 * Handing that file straight to `watchlist_import` fails. This converts it.
 *
 * OUTPUT
 * ------
 * stdout  the plain symbol list, one per line, in file order, deduplicated.
 *         Feed it to `watchlist_add_bulk` (which takes at most 100 per call).
 * --json  writes the `watchlist_import` file. Nothing is written without it.
 * stderr  a summary: symbol count, sections seen, batch count, anything skipped.
 *
 * Node 18+. No dependencies. Reads one file, writes at most one file.
 *
 * EXIT STATUS
 * -----------
 * 0  at least one symbol was parsed
 * 1  the file could not be read, or contained no symbols
 *
 * A watchlist export that parses to zero symbols is a failure, not an empty
 * watchlist. It exits 1 so the caller cannot report success on a file it never
 * understood.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const USAGE = `Usage: node parse-watchlist.mjs <export.txt> [--json OUT] [--batch-size N]

  <export.txt>      TradingView watchlist export (###NAME,EX:SYM,EX:SYM,...)
  --json OUT        also write the watchlist_import JSON to OUT
  --batch-size N    symbols per watchlist_add_bulk call (default 100, the tool's max)
`;

/**
 * TradingView tickers are `EXCHANGE:SYMBOL` or a bare symbol, and the symbol part
 * carries punctuation of its own: BRK.B, RDS-A, ES1!, BTCUSD, SPX500^. Anything
 * outside this is not silently dropped — it is reported on stderr as skipped.
 */
const SYMBOL_RE = /^[A-Za-z0-9][A-Za-z0-9._!:+^-]*$/;

function parseArgs(argv) {
  const opts = { input: null, json: null, batchSize: 100 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(USAGE);
      process.exit(0);
    } else if (arg === '--json') {
      opts.json = argv[++i];
      if (!opts.json) fail('--json needs a path');
    } else if (arg === '--batch-size') {
      opts.batchSize = Number.parseInt(argv[++i], 10);
      if (!Number.isInteger(opts.batchSize) || opts.batchSize < 1 || opts.batchSize > 100) {
        fail('--batch-size must be between 1 and 100 (watchlist_add_bulk caps at 100)');
      }
    } else if (arg.startsWith('-')) {
      fail(`unknown option: ${arg}`);
    } else if (opts.input === null) {
      opts.input = arg;
    } else {
      fail('only one input file at a time');
    }
  }
  if (!opts.input) fail('no input file given');
  return opts;
}

function fail(message) {
  process.stderr.write(`parse-watchlist: ${message}\n\n${USAGE}`);
  process.exit(1);
}

/**
 * Splits on commas AND newlines, so both the single-line UI export and a
 * hand-kept one-per-line list parse the same way.
 */
function parseWatchlist(text) {
  const sections = [];
  const symbols = [];
  const seen = new Set();
  const skipped = [];

  for (const raw of text.replace(/^\uFEFF/, '').split(/[,\r\n\t]+/)) {
    const token = raw.trim().replace(/^["']+|["']+$/g, '');
    if (!token) continue;
    if (token.startsWith('###')) {
      sections.push(token.slice(3).trim() || '(unnamed)');
      continue;
    }
    const symbol = token.toUpperCase();
    if (!SYMBOL_RE.test(symbol)) {
      skipped.push(token);
      continue;
    }
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
  }

  return { sections, symbols, skipped };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  let text;
  try {
    text = readFileSync(opts.input, 'utf8');
  } catch (err) {
    fail(`cannot read ${opts.input}: ${err.message}`);
  }

  const { sections, symbols, skipped } = parseWatchlist(text);

  if (symbols.length === 0) {
    process.stderr.write(
      `parse-watchlist: no symbols found in ${opts.input}.\n` +
        'Expected a TradingView export like "###MY LIST,NASDAQ:AAPL,NYSE:F". ' +
        'Check the file is the watchlist export and not something else.\n',
    );
    process.exit(1);
  }

  if (opts.json) {
    const doc = { schema_version: 1, symbols: symbols.map((symbol) => ({ symbol })) };
    try {
      writeFileSync(opts.json, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    } catch (err) {
      fail(`cannot write ${opts.json}: ${err.message}`);
    }
  }

  process.stdout.write(`${symbols.join('\n')}\n`);

  const batches = Math.ceil(symbols.length / opts.batchSize);
  const lines = [
    `${symbols.length} symbols${sections.length ? ` from ${sections.length} section(s): ${sections.join(', ')}` : ''}`,
    `watchlist_add_bulk takes ${opts.batchSize} per call, so that is ${batches} call(s)`,
  ];
  if (opts.json) lines.push(`watchlist_import file written: ${opts.json}`);
  if (skipped.length) {
    lines.push(`SKIPPED ${skipped.length} token(s) that do not look like tickers: ${skipped.join(', ')}`);
  }
  process.stderr.write(`${lines.join('\n')}\n`);
}

main();
