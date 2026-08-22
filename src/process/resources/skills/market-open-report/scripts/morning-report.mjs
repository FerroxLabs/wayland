#!/usr/bin/env node
/**
 * morning-report.mjs — the CLI half of
 * /Users/seandonahoe/dev/tvcontrol/skills/market-open-report/tools/morning_report.py
 *
 * This file is the `argparse` block and the `if __name__ == '__main__'` guard.
 * Everything it prints comes from report.mjs, which owns the port of the report
 * itself.
 *
 *     node morning-report.mjs [--tier 1|2] [--slots 20] [--start YYYY-MM-DD]
 *                             [--end YYYYMMDD] [--json OUT]
 *
 * ===========================================================================
 * REPRODUCED DEFECT — THE TWO DATE FORMATS DO NOT MATCH
 * ===========================================================================
 * `--start` takes YYYY-MM-DD and `--end` takes YYYYMMDD. They are different
 * shapes for the same kind of value on the same command line, and neither is
 * validated.
 *
 *   --start goes into cfg['start'] and is compared against a bar's `date`
 *           field, which is 'YYYY-MM-DD'. A wrong shape there does not raise:
 *           it silently changes which bars are in range. '20150101' compares
 *           LESS than every ISO date, so it quietly means "no start filter".
 *
 *   --end   goes to yahooDaily(), which hands it to _epoch(). That reads
 *           [0:4], [4:6] and [6:] as year, month and day, so the ISO shape
 *           '2026-08-11' gives int('2026'), int('-0') — which is a legal 0 —
 *           and then int('8-11'), which in Python raises
 *               ValueError: invalid literal for int() with base 10: '8-11'
 *
 * WHAT THAT ACTUALLY DOES, measured on this machine rather than assumed: the
 * ValueError is raised inside yahoo_daily, which scan() calls inside a bare
 * `except Exception`. So it does NOT crash. Every one of the 74 symbols gets
 * `error: "invalid literal for int() with base 10: '8-11'"`, the report prints
 * a complete NO DATA (74) block, and the process exits 0. `--end 2026-08-11`
 * is the shortest way to reproduce the total-failure-reports-success defect
 * that the exit status below exists to catch.
 *
 * BOTH FORMATS ARE REPRODUCED AS-IS AND NEITHER IS NORMALISED, and there is no
 * up-front shape check here. An earlier draft of this file added one; it was
 * removed, because rejecting the ISO shape with a usage error is a third
 * behaviour that is neither the Python's nor a fix, and it suppresses the one
 * command that demonstrates the defect. Accepting both shapes would fix the
 * CLI while leaving the same trap for every other caller of scan(); that fix
 * belongs in one place, applied deliberately, with the Yahoo cache keys
 * invalidated at the same time (the cache filename embeds the end date).
 *
 * ⚠ KNOWN PORT DIVERGENCE, NOT FIXED HERE. yahooData.mjs's `_epoch` does not
 * raise on the ISO shape the way Python's does: `parseInt('-0')` is -0 and
 * `parseInt('8-11')` is 8, so it returns a valid epoch for 2026-12-07 and the
 * scan fetches 74 symbols over a silently wrong window instead of reporting NO
 * DATA. Reproducing the Python's ValueError from here would mean a second,
 * drifting copy of _epoch's parsing inside report.mjs — the exact defect shape
 * scan()'s own "no exit level column" comment warns against. The fix belongs in
 * `_epoch`, in yahooData.mjs, alongside the local-timezone bug already flagged
 * there.
 *
 * ===========================================================================
 * DELIBERATE ADDITION — EXIT STATUS
 * ===========================================================================
 * The Python's main() never exits non-zero. A run in which every single symbol
 * fails produces a perfectly well-formed report listing all 74 of them as NO
 * DATA, prints it, and reports success — reproduced live on this machine. Any
 * cron job or CI step wrapping it therefore cannot tell a good morning from a
 * total outage.
 *
 * So: when at least one symbol was scanned and EVERY one of them failed, this
 * exits 1. Nothing else changes — not the report text, not the JSON, not the
 * exit status of any partially-successful run. In-process callers that want a
 * threshold of their own read `noDataCount` off `main`'s return value; it is
 * deliberately kept OUT of the --json payload so the written file stays
 * byte-identical to the Python's.
 *
 * ===========================================================================
 * PATHS
 * ===========================================================================
 * The flag surface is exactly the Python's. The three paths the Python derives
 * from __file__ are parameters of report.mjs and are overridable here by
 * environment variable, because this ships inside an app with a read-only
 * resources directory:
 *
 *   MARKET_OPEN_REPORT_LIST       watchlist CSV     (default: ../package/exports/TC-MASTER-WATCHLIST.csv)
 *   MARKET_OPEN_REPORT_POSITIONS  positions CSV     (default: ../package/exports/positions.csv)
 *   MARKET_OPEN_REPORT_CACHE      Yahoo cache dir   (no fixed default - probed, see below)
 *
 * There is no fixed cache default: `~/.cache` is unreachable under the agent
 * sandbox, so with MARKET_OPEN_REPORT_CACHE unset `report.mjs` probes, in
 * order, `~/.cache/market-open-report/yahoo-cache`, then
 * `<cwd>/.market-open-report-cache/yahoo-cache`, then
 * `<tmpdir>/market-open-report/yahoo-cache`, and keeps the first it can
 * create. In the sandbox the first fails EPERM and the second is used.
 *
 * The output path is --json, as in the Python.
 */

import { basename } from 'node:path';

import { DEFAULT_CACHE_DIR, DEFAULT_LIST, DEFAULT_POSITIONS, main, writeJson } from './report.mjs';
import { dataSourceRefusal } from './yahooData.mjs';

const PROG = basename(process.argv[1] || 'morning-report.mjs');

const USAGE =
  `usage: ${PROG} [-h] [--tier {1,2}] [--slots SLOTS] [--start START]\n` +
  `${' '.repeat(7 + PROG.length)}[--end END] [--json JSONOUT]`;

/** argparse exits 2 on a bad command line; this carries that up to the top. */
class ArgparseError extends Error {}

/**
 * Port of the `argparse.ArgumentParser` block in main().
 *
 *   --tier   type=int, default=1, choices=(1, 2)
 *   --slots  type=int, default=20
 *   --start  default='2015-01-01'
 *   --end    default=None
 *   --json   dest='jsonout', default=None
 */
function parseArgs(argv) {
  const a = { tier: 1, slots: 20, start: '2015-01-01', end: null, jsonout: null };

  /**
   * argparse's `type=int`: int(s) on a str, which accepts surrounding
   * whitespace and a leading sign and rejects everything else — notably '3.0',
   * '0x10' and ''. Number()/parseInt() both accept things int() does not, so
   * the accepted shape is spelled out.
   */
  const pyInt = (s, opt) => {
    if (!/^[+-]?\d+$/.test(String(s).trim())) {
      throw new ArgparseError(`argument ${opt}: invalid int value: '${s}'`);
    }
    return Number.parseInt(String(s).trim(), 10);
  };

  const need = (i, opt) => {
    if (i + 1 >= argv.length) {
      throw new ArgparseError(`argument ${opt}: expected one argument`);
    }
    return argv[i + 1];
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      process.stdout.write(USAGE + '\n');
      process.exit(0);
    } else if (arg === '--tier') {
      a.tier = pyInt(need(i, '--tier'), '--tier');
      i++;
      if (a.tier !== 1 && a.tier !== 2) {
        throw new ArgparseError(`argument --tier: invalid choice: ${a.tier} (choose from 1, 2)`);
      }
    } else if (arg === '--slots') {
      a.slots = pyInt(need(i, '--slots'), '--slots');
      i++;
    } else if (arg === '--start') {
      a.start = need(i, '--start');
      i++;
    } else if (arg === '--end') {
      a.end = need(i, '--end');
      i++;
    } else if (arg === '--json') {
      a.jsonout = need(i, '--json');
      i++;
    } else {
      throw new ArgparseError(`unrecognized arguments: ${arg}`);
    }
  }
  return a;
}

/**
 * `dt.datetime.now(dt.UTC).strftime('%Y%m%d')`. UTC, not local — which is what
 * makes the local-timezone bug in _epoch observable.
 */
function utcToday() {
  const now = new Date();
  return (
    String(now.getUTCFullYear()) +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0')
  );
}

async function cli() {
  let a;
  try {
    a = parseArgs(process.argv.slice(2));
  } catch (e) {
    if (!(e instanceof ArgparseError)) throw e;
    process.stderr.write(USAGE + '\n' + PROG + ': error: ' + e.message + '\n');
    process.exit(2);
    return;
  }

  // `end = a.end or dt.datetime.now(dt.UTC).strftime('%Y%m%d')`. Passed through
  // unvalidated, exactly as the Python does — see the REPRODUCED DEFECT note in
  // the header for why there is deliberately no shape check on this line.
  const end = a.end || utcToday();

  const r = await main(
    { tier: a.tier, slots: a.slots, start: a.start, end: end, jsonout: a.jsonout },
    {
      listPath: process.env.MARKET_OPEN_REPORT_LIST || DEFAULT_LIST,
      cacheDir: process.env.MARKET_OPEN_REPORT_CACHE || DEFAULT_CACHE_DIR,
      positionsPath: process.env.MARKET_OPEN_REPORT_POSITIONS || DEFAULT_POSITIONS,
    }
  );

  process.stdout.write(r.text + '\n'); // print()
  if (r.jsonout) {
    writeJson(r.jsonout, r.payload);
    process.stdout.write('\n' + 'wrote' + ' ' + r.jsonout + '\n'); // print('\nwrote', ...)
  }

  // ADDED (B10). A NAMED REFUSAL, NOT A HANG.
  //
  // Before this, a run with no network burned ~12s per symbol (measured:
  // 12,159 ms for one, 96,211 ms for the real 8-symbol overview sweep) until
  // the agent's 10-minute no-progress watchdog killed the turn. The user got
  // two 0-byte files and "The agent stopped making progress" — no cause named
  // anywhere. `yahooData.mjs` now latches after two consecutive symbols
  // exhaust every attempt on a NETWORK-class error, so the sweep ends in ~24s
  // and this prints WHY.
  //
  // On STDOUT as well as STDERR on purpose: the workflow body tells the run to
  // read the scanner's stdout and its exit code, and stdout is what actually
  // reaches the thread.
  const refusal = dataSourceRefusal();
  if (refusal) {
    const lines = [
      '',
      `${PROG}: REFUSED — the price source was unreachable from this run.`,
      `  cause:   ${refusal.detail || refusal.code} (${refusal.code})`,
      `  refused: after ${refusal.attempts} attempts on each of ` +
        `${refusal.consecutiveSymbols} consecutive symbols, first at ${refusal.symbol}`,
      '  effect:  every symbol not already cached was SKIPPED, not fetched and not answered.',
      '  This is NOT "no data" and it is NOT a quiet market: nothing was asked and',
      '  nothing answered. A scheduled run has no network, so a routine that needs',
      '  live prices needs a connector granted to it, not a retry.',
      '',
    ];
    process.stdout.write(lines.join('\n'));
    process.stderr.write(lines.join('\n'));
    process.exitCode = 1;
  }

  // ADDED (see header). Everything above this line is the Python's behaviour.
  // The guard on `scanned` matters: an empty watchlist scans nothing and fails
  // nothing, and calling that a total outage would be a second defect.
  if (r.scanned > 0 && r.noDataCount === r.scanned) {
    process.stderr.write(
      `${PROG}: every one of the ${r.scanned} symbols scanned returned no data. ` +
        'The report above is real but empty of signal.\n'
    );
    process.exitCode = 1;
  }
}

cli().catch((e) => {
  // An unhandled exception is a traceback and exit 1 in Python.
  process.stderr.write((e && e.stack ? e.stack : String(e)) + '\n');
  process.exit(1);
});
