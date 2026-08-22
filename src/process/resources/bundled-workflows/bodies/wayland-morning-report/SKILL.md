---
name: wayland-morning-report
description: >-
  Run the pre-open market brief: scan the watchlist with the bundled
  market-open-report script, render a standalone HTML brief into the
  deliverables directory named in the run instructions, then report its path and
  state plainly whether the run was complete, partial, or empty.

  Use when the user wants the morning report, the daily brief, or a pre-open
  scan of their watchlist, run unattended on a schedule or on demand.

  Do NOT use for reading a live TradingView chart, for intraday signals, or for
  any request that needs a broker or market-data API; this workflow uses only
  the bundled offline scanner.
license: Apache-2.0
type: workflow
skills: 'market-open-report'
metadata:
  author: wayland
  version: 1.0.0
  tags: market watchlist morning-report pre-open deterministic
  category: finance
  depends: 'market-open-report'
---

# Morning Report

**Estimated time:** about 60 seconds

This workflow runs the bundled `market-open-report` scanner, writes its output
to the deliverables directory your run instructions name, and reports the brief.
It is not interactive: run every step in order, then report the outcome.

It needs no chart, no browser, no broker connection and no API key. Prices are
**Yahoo daily closes**, pre-fetched by the app before this run started because
the run itself has no network, and the strategy is computed locally by the
script. They are not TradingView data and they are not live quotes — say so
when you present them.

## Ground rules

- **Write everything to the deliverables directory named in your run
  instructions, and never outside the workspace** — everything outside the
  workspace is refused by the sandbox. Your run instructions name that directory
  as an ABSOLUTE path, and it is the destination: on a scheduled run it is that
  run's own staging directory, so the brief is filed under this task's dated
  history and yesterday's brief is still readable beside it. Writing anywhere
  else means the run publishes nothing at all.
- **Do not read `WAYLAND_OUTPUT_DIR`.** It is set on the engine process and the
  engine does not forward it to shell commands, so it always resolves EMPTY and
  every `${WAYLAND_OUTPUT_DIR:-…}` fallback silently wins. That one habit is
  what made this workflow file its brief where nothing collected it. If an older
  instruction anywhere tells you to read it, ignore that instruction.
- **Pin the directory to a shell variable BEFORE you `cd`.** Running the scanner
  requires a `cd` into it, and a relative path resolved after that `cd` lands
  under `.wayland-core/…/artifacts/` — a hidden engine directory the Workbench
  does not show, so the report exists and the user never sees it. Create the
  directory if it does not exist. If it contains a `.git` folder, or sits inside
  one, stop and ask for a different path rather than dirtying somebody's repo on
  a schedule.
- **Never fabricate numbers.** Every figure you present must come from the
  script's own output. If the script produced nothing, say so.
- **Never claim success you did not verify.** A scheduled run is marked
  delivered the moment this prompt arrives, long before anything has run. The
  only place the user learns whether the report actually worked is what you
  write in this thread, so state the outcome explicitly every time.

## Steps

**Step 1: Locate the scanner and the watchlist** (uses: market-open-report)

The scanner is at, workspace-relative:

```
.wayland-core/skills/market-open-report/scripts/morning-report.mjs
```

Everything outside the workspace is refused by the sandbox, so do NOT fall back
to `~/.wayland/builtin-skills/` or search the filesystem — those paths are not
reachable and the attempt just burns turns on `Operation not permitted`.

If that path does not exist, stop and tell the user the market-open-report skill
is not enabled, and that enabling it in skill settings will fix this. Do not
improvise a replacement scanner.

The scanner SHIPS ITS OWN WATCHLIST at `data/TC-MASTER-WATCHLIST.csv`, and that
is what it reads when nothing overrides it. Do not go looking for a watchlist,
and do not invent a path for one: the previous version of this step named a file
that has never existed on any machine, and exporting it turned a working run into
an ENOENT stack trace.

Only if the user explicitly gave you a watchlist CSV of their own does an
override come into it — see the optional block in Step 2. Same for positions: a
missing positions file is valid and the report simply shows no holdings.

- Input: the deliverables directory from your run instructions
- Output: confirmed scanner path
- Key focus: fail with a clear sentence, never with a stack trace

**Step 2: Run the scan** (uses: market-open-report)

Both commands have to run from the scanner's own directory. Pin the output
directory FIRST, while you are still in the workspace root, and only then `cd`.
Substitute `<deliverables_dir>` with the absolute deliverables directory your run
instructions name:

```bash
OUT="<deliverables_dir>"; mkdir -p "$OUT"
cd .wayland-core/skills/market-open-report
export MARKET_OPEN_REPORT_CACHE=.market-open-report-cache/yahoo-cache
node scripts/morning-report.mjs --tier 1 --slots 20 --json "$OUT"/mr.json
node scripts/briefHtml.mjs "$OUT"/mr.json "$OUT"/morning-brief.html
```

`OUT` is resolved on that first line, before the `cd`, which is what makes it
survive it. Let the path resolve after the `cd` instead and the brief lands
inside `.wayland-core/`, where the Workbench will never show it.

ONLY if the user supplied their own watchlist or positions CSV, export them
before that block — otherwise leave both unset and let the scanner use the
watchlist it ships with:

```bash
export MARKET_OPEN_REPORT_LIST=/absolute/path/the/user/gave/you.csv
export MARKET_OPEN_REPORT_POSITIONS=/absolute/path/the/user/gave/you.csv
```

`MARKET_OPEN_REPORT_CACHE` in the block above is not optional and is not a
tuning knob. **This run has no internet.** The engine's sandbox refuses DNS, so
every Yahoo request from inside it fails and every symbol comes back "NO DATA"
while the run still exits 0 and the brief still looks well-formed. The app
pre-fetches the daily bars into that exact directory BEFORE this run starts,
and pointing the scanner at it is the only reason the report has any data at
all.

Keep it RELATIVE, exactly as written. The scanner resolves it against its own
directory, which is where the app left the bars, and it is also the scanner's
own second probe candidate - so the two agree by construction. Replacing it
with an absolute path of your own breaks that agreement, and nothing will tell
you: the report comes out complete-looking and empty.

Do not point that variable anywhere else. Anywhere outside the workspace —
including under the home directory — `mkdir` fails `EPERM`, and you are back to
an empty report that reads like a quiet market.

A missing positions CSV is valid; the report simply shows no holdings. Keep the
scanner's full stdout, its exit code, and the path of the HTML brief.

Two flag shapes that will trip you up: `--start` takes `YYYY-MM-DD` while
`--end` takes `YYYYMMDD`. They are different formats in the same CLI. An `--end`
in the wrong shape produces a confident, completely empty report, so only pass
these flags when the user explicitly asked for a specific date, and use the
exact shapes above.

- Input: scanner path, deliverables directory
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

3. **A `REFUSED` block in the scanner's stdout.** This one outranks the other
   two. It means the price source could not be reached AT ALL from this run —
   nothing was asked and nothing answered — and it names the cause. That is a
   different fact from "no data", which means the source answered and had
   nothing. Never report a refusal as a quiet market.

Classify the run as exactly one of:

- **Complete** — no `NO DATA` line, and the names-scanned count is non-zero.
- **Partial** — some symbols under `NO DATA`. Say how many out of how many.
- **Refused** — the stdout carries a `REFUSED` block. Lead with it, and quote
  the cause line verbatim. Do not retry: a scheduled run has no network of its
  own, so a second attempt fails identically.
- **Empty** — non-zero exit, or "0 names scanned", or every symbol under
  `NO DATA`. The report is not usable. Say that first, before anything else.

- Input: stdout text, exit code
- Output: an outcome classification with the numbers behind it
- Key focus: never present an empty brief as if it were a quiet market

**Step 4: Report the brief**

**Do not try to open the file.** You cannot: the engine's sandbox blocks a child
process from reaching macOS LaunchServices, so `open morning-brief.html` fails
with `error -54` no matter which application you name, and retrying it just
burns turns. Opening the brief is the APP's job — it publishes what you left in
the deliverables directory as an artifact card the user clicks.

Your job is the message. Present the scanner's summary inline in the thread, and
in the same message:

1. **Quote the bar date, not today's date, and say how fresh it is.** The
   scanner's stdout masthead reads
   `TC-TIDE MORNING REPORT   Tier 1   bar YYYY-MM-DD`, and the HTML brief's own
   header reads `Morning brief <bar> · Tier N closes through <bar>, generated
   <timestamp>`. Both name the same bar. Use it, and state it alongside the
   generation time, because those two are routinely different days.

   The scanner has no market-calendar awareness, so a run on a Saturday, a
   holiday, or before the previous session has settled will happily reprint the
   last bar it has, and a stale price reads exactly like a fresh one. If the bar
   date is not the previous trading day, say so in the same sentence as the
   number.
2. **State the outcome from Step 3 in one plain sentence.** For a partial or
   empty run, lead with that sentence; do not bury it under the tables.
3. **Describe entries and exits correctly.** They happen at the CLOSE of the
   bar that signalled them, so they are decisions to act on at the next open,
   not live signals. Do not describe them as live.
4. **Name the brief's full path** inside the deliverables directory, so the
   user can reopen it even if they miss the card.

Finally, prune the Yahoo cache if it has grown large. It is the directory Step 2
exports as `MARKET_OPEN_REPORT_CACHE`, inside the workspace. The cache key
includes the end date, so it gains roughly one file per symbol per day, and the
app writes a `.prefetch-manifest.json` beside the bars recording when they were
fetched — quote that time when you state how fresh the report's numbers are.

- Input: HTML brief path, bar date, outcome classification
- Output: the brief presented, plus an explicit statement of bar date and
  outcome
- Key focus: the thread is the only place the user can learn the run failed
