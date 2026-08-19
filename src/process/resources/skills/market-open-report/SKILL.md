---
name: market-open-report
description: Produce the TC-TIDE morning report — scan the watchlist for trend state, entries, exits and open positions, and render a standalone HTML brief. Use when the user asks for the morning report, the daily brief, a pre-open scan, or "what is my watchlist doing today".
---

# Morning report

Runs a daily scan over the watchlist and produces two things: a plain-text
report and a standalone HTML brief.

It does **not** read the user's TradingView chart, and does not need TradingView
Desktop, the TVControl connector, or any API key. Prices come from Yahoo daily
closes and the strategy is computed here. That is deliberate: scanning seventy
symbols through the chart means seventy symbol changes and seventy study
reloads, and every one of those is a place the UI can fail silently.

## Running it

From the skill directory:

```bash
node scripts/morning-report.mjs --tier 1 --slots 20 --json <OUT>/mr.json
node scripts/briefHtml.mjs <OUT>/mr.json <OUT>/morning-brief.html
```

Node only. No dependencies, no install step, no Python.

**It works with no arguments and no setup.** A default watchlist ships in
`data/TC-MASTER-WATCHLIST.csv` (74 names) and an empty holdings template in
`data/positions.csv`, so a brand-new user gets a real report on the first run —
about 13 seconds cold, since it fetches every symbol. Do not ask them to supply
a watchlist before running it once.

Override any of it through the environment, so nothing is written where it does
not belong:

| variable | meaning |
|---|---|
| `MARKET_OPEN_REPORT_LIST` | watchlist CSV (defaults to the bundled one) |
| `MARKET_OPEN_REPORT_POSITIONS` | the user's holdings CSV (absent is valid) |
| `MARKET_OPEN_REPORT_CACHE` | Yahoo cache directory |

Write `--json` and the HTML brief to the workspace-relative output directory
(default `artifacts/`, i.e. `<workspace>/artifacts/`). Never write beside this
skill's own script — `.wayland-core/skills/` is a hidden engine directory the
Workbench does not show — and never write into a git repository.

## Reading the result — this part matters

**Check the exit code, and check the NO DATA line.** A run where Yahoo rate
limits or blocks produces a *complete, well-formed, entirely empty* report:
every symbol listed under NO DATA, every table empty, and it looks fine. The
Python original returned success in exactly that case. This version exits
non-zero when every scanned symbol failed — but a partial failure still exits
zero, so read the NO DATA count and say it out loud to the user rather than
presenting an empty brief as if it were a quiet market.

If the report says "0 names scanned", something is broken. Say so plainly.

## Things that will trip you up

- `--start` takes `YYYY-MM-DD`. `--end` takes `YYYYMMDD`. They are different
  formats in the same CLI, inherited from the original; `--end` in the wrong
  shape used to produce a confident empty report.
- There is no market-calendar awareness. Run on a Saturday and it reprints
  Friday's bar. The masthead carries both the bar date and the build date for
  exactly this reason — quote the **bar** date to the user, not today's.
- The cache grows by roughly one file per symbol per day, because the cache key
  includes the end date. Prune it.
- Entries and exits happen at the CLOSE of the bar that signalled them, so the
  report describes a decision to act on at the next open. Do not describe it as
  a live signal.

## Scheduling it

This is a good candidate for a daily routine. It needs no chart, no browser and
no credentials, so it runs unattended. Offer it; do not enable it without
asking.
