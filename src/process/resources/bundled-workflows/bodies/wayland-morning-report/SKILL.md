---
name: wayland-morning-report
description: >-
  Run the pre-open market brief: scan the watchlist with the bundled
  market-open-report script, render a standalone HTML brief into an app-owned
  folder, then present it and state plainly whether the run was complete,
  partial, or empty.

  Use when the user wants the morning report, the daily brief, or a pre-open
  scan of their watchlist, run unattended on a schedule or on demand.

  Do NOT use for reading a live TradingView chart, for intraday signals, or for
  any request that needs a broker or market-data API; this workflow uses only
  the bundled offline scanner.
license: Apache-2.0
type: workflow
skills: "market-open-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: market watchlist morning-report pre-open deterministic
  category: finance
  depends: "market-open-report"
---
# Morning Report

**Estimated time:** about 60 seconds

This workflow runs the bundled `market-open-report` scanner, writes its output
to an app-owned folder, and presents the brief. It is not interactive: run every
step in order, then report the outcome.

It needs no chart, no browser, no broker connection and no API key. Prices come
from Yahoo daily closes and the strategy is computed locally by the script.

## Ground rules

- **Never write into a git repository.** All output goes to the app-owned
  output directory given in the inputs (default `~/wayland/outbox/market/`).
  Create it if it does not exist. If the resolved output directory contains a
  `.git` folder, or sits inside one, stop and ask for a different path rather
  than dirtying somebody's repo on a schedule.
- **Never fabricate numbers.** Every figure you present must come from the
  script's own output. If the script produced nothing, say so.
- **Never claim success you did not verify.** A scheduled run is marked
  delivered the moment this prompt arrives, long before anything has run. The
  only place the user learns whether the report actually worked is what you
  write in this thread, so state the outcome explicitly every time.

## Steps

**Step 1: Locate the scanner and the watchlist** (uses: market-open-report)

Find the scanner in this order, first hit wins:

1. `skills/market-open-report/scripts/morning-report.mjs` in the workspace.
2. `~/.wayland/builtin-skills/market-open-report/scripts/morning-report.mjs`.

If neither exists, stop and tell the user the market-open-report skill is not
enabled, and that enabling it in skill settings will fix this. Do not improvise
a replacement scanner.

Then check the watchlist CSV named in the inputs actually exists. There is no
bundled default watchlist, so a missing file makes the script throw a stack
trace rather than print a friendly error. If it is missing, stop and tell the
user plainly which path you looked at and that a watchlist CSV needs to be
placed there. Do not run the scan without it.

- Input: watchlist path, positions path, cache dir, output dir
- Output: confirmed scanner path and confirmed watchlist path
- Key focus: fail with a clear sentence, never with a stack trace

**Step 2: Run the scan** (uses: market-open-report)

Create the output directory, then run both commands from the scanner's own
directory, exporting the paths from the inputs:

```bash
export MARKET_OPEN_REPORT_LIST=<watchlist_path>
export MARKET_OPEN_REPORT_POSITIONS=<positions_path>
export MARKET_OPEN_REPORT_CACHE=<cache_dir>

node scripts/morning-report.mjs --tier 1 --slots 20 --json <OUT>/mr.json
node scripts/briefHtml.js <OUT>/mr.json <OUT>/morning-brief.html
```

A missing positions CSV is valid; the report simply shows no holdings. Keep the
scanner's full stdout, its exit code, and the path of the HTML brief.

Two flag shapes that will trip you up: `--start` takes `YYYY-MM-DD` while
`--end` takes `YYYYMMDD`. They are different formats in the same CLI. An `--end`
in the wrong shape produces a confident, completely empty report, so only pass
these flags when the user explicitly asked for a specific date, and use the
exact shapes above.

- Input: scanner path, resolved env paths, output directory
- Output: stdout text, exit code, `mr.json`, `morning-brief.html`
- Key focus: capture the exit code; you need it in the next step

**Step 3: Check the outcome before you present anything** (uses: market-open-report)

Do not assume the run worked because the command returned and a file appeared.
A run that Yahoo rate limits or blocks produces a complete, well-formed,
entirely empty brief: every symbol listed under `NO DATA`, every table empty. It
looks fine. Check both signals:

1. **The exit code.** Non-zero means every scanned symbol failed. The brief is
   real but empty of signal.
2. **The `NO DATA (n)` line and the `N names scanned` line** in the scanner's
   stdout. A partial failure still exits zero, so the count is the only way to
   see it.

Classify the run as exactly one of:

- **Complete** — no `NO DATA` line, and the names-scanned count is non-zero.
- **Partial** — some symbols under `NO DATA`. Say how many out of how many.
- **Empty** — non-zero exit, or "0 names scanned", or every symbol under
  `NO DATA`. The report is not usable. Say that first, before anything else.

- Input: stdout text, exit code
- Output: an outcome classification with the numbers behind it
- Key focus: never present an empty brief as if it were a quiet market

**Step 4: Present the brief**

Open `morning-brief.html` for the user, or if opening a file is not available in
this run, present the scanner's summary inline in the thread. Then, in the same
message:

1. **Quote the bar date, not today's date.** The masthead line reads
   `TC-TIDE MORNING REPORT   Tier 1   bar YYYY-MM-DD`. Use that date. The
   scanner has no market-calendar awareness, so a run on a Saturday, a holiday,
   or before the previous session has settled will happily reprint the last
   bar it has. If the bar date is not the previous trading day, say so.
2. **State the outcome from Step 3 in one plain sentence.** For a partial or
   empty run, lead with that sentence; do not bury it under the tables.
3. **Describe entries and exits correctly.** They happen at the CLOSE of the
   bar that signalled them, so they are decisions to act on at the next open,
   not live signals. Do not describe them as live.
4. **Say where the files are**, so the user can reopen them.

Finally, prune the cache directory if it has grown large. The cache key includes
the end date, so it gains roughly one file per symbol per day.

- Input: HTML brief path, bar date, outcome classification
- Output: the brief presented, plus an explicit statement of bar date and
  outcome
- Key focus: the thread is the only place the user can learn the run failed
