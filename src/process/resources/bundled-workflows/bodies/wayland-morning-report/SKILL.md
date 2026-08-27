---
name: wayland-morning-report
description: >-
  Run the pre-open brief off the user's own TradingView chart: load their
  morning layout, read what their indicators are showing across their
  watchlist, write a standalone HTML brief into the deliverables directory
  named in the run instructions, then state plainly whether the run was
  complete, partial, or empty.

  Use when the user wants the morning report, the daily brief, or a pre-open
  scan of their watchlist, run unattended on a schedule or on demand.

  Do NOT use for intraday signals, for placing orders, or for any request that
  needs a broker. This workflow reads a chart and computes nothing.
license: Apache-2.0
type: workflow
skills: 'morning-prep'
metadata:
  author: wayland
  version: 2.0.0
  tags: market watchlist morning-report pre-open chart
  category: finance
  depends: 'morning-prep'
---

# Morning Report

**Estimated time:** about two minutes for a 30-name watchlist.

This workflow reads the user's live TradingView chart through the TVControl
connector and writes a brief. **It computes nothing.** Every number in the
output is a number their own chart printed, so they can point at any line and
find it on screen.

## Ground rules

- **Write everything to the deliverables directory named in your run
  instructions, and never outside the workspace** — everything outside the
  workspace is refused by the sandbox. Your run instructions name that
  directory as an ABSOLUTE path, and it is the destination. Writing anywhere
  else means the run publishes nothing at all.
- **That directory is a destination, not an address.** On a scheduled run it is
  a staging directory and it is **deleted the moment the run publishes** — the
  app publishes by renaming it, so the path you wrote to stops existing at that
  instant. Write to it and never quote it back to the user. Naming a file is
  fine; naming its directory is telling the user to go somewhere that is gone.
- **Do not read `WAYLAND_OUTPUT_DIR`.** It is set on the engine process and the
  engine does not forward it to shell commands, so it always resolves EMPTY and
  every `${WAYLAND_OUTPUT_DIR:-…}` fallback silently wins. If an older
  instruction anywhere tells you to read it, ignore that instruction.
- **Pin the directory to a shell variable before you write anything.** Create it
  if it does not exist. If it contains a `.git` folder, or sits inside one, stop
  and ask for a different path rather than dirtying somebody's repo on a
  schedule.
- **Never fabricate numbers.** Every figure must come off the chart you read. If
  the chart could not be read, the brief says so and carries no figures at all.
- **Never claim success you did not verify.** A scheduled run is marked
  delivered the moment this prompt arrives, long before anything has run. The
  only place the user learns whether the report actually worked is what you
  write in this thread, so state the outcome explicitly every time.

## Steps

**Step 1: Prove the chart is answering** (uses: morning-prep)

This run holds the TVControl connector because the routine declares it. Search
your tool catalogue for `tv_health_check` and call it. Only an empty search is
evidence of absence.

Three outcomes, and each has one honest answer:

- **The tools are not there.** TVControl is not installed. Write a brief that
  says exactly that and stop. Produce no market content.
- **`datafeed.state` is `disconnected`.** Every number on that chart may be
  stale, the indicators included, because they are computed off the same bars.
  Write that, and read no figures.
- **Healthy.** Continue.

- Output: a health verdict you actually received
- Key focus: fail with a clear sentence, never with a stack trace

**Step 2: Resolve the watchlist by name, never by "active"**

Call `watchlist_list`. It returns every list with its id and symbol count.

Do **not** use `watchlist_get`: it reads whatever TradingView currently marks
active, which has been measured naming a 29-symbol list while the chart in
front of the user held a 74-symbol one, and reporting that as a success.

Pick the list the user configured, **by id**. If the run has no configured list
and more than one exists, write a brief saying which lists were found and that
the user needs to choose one. Do not guess.

**Step 3: Read the chart across the watchlist**

Use `batch_run` with the `get_pine_tables` action and the whole symbol list in
ONE call. It restores the starting chart state when it finishes.

For each result, confirm the panel's own stamp names the symbol you asked for.
A panel that still names the previous symbol has not repainted, and its numbers
belong to a different instrument — that is a FAILED read for that symbol.

`read + failed` must equal the number of symbols you asked for, every time. A
symbol is never dropped, never back-filled, and never quietly counted as
neutral.

**Step 4: Write the brief and report the outcome**

Pin the directory, then write the file. Substitute `<deliverables_dir>` with the
absolute deliverables directory your run instructions name:

```bash
OUT="<deliverables_dir>"; mkdir -p "$OUT"
```

Write a standalone `morning-brief.html` into `"$OUT"`. It must state, at the
top: the watchlist name and its size, the timeframe, the indicators found on
the chart, and the count read versus attempted.

Then report in this thread:

- how many symbols were read, out of how many attempted
- which watchlist, by name and size
- every symbol that could not be read, **by name**
- the outcome in one word: complete, partial, or empty

Name the file `morning-brief.html` when you refer to it.
**Do not print the deliverables directory** — it is a staging directory on a
scheduled run and it stops existing the moment the run publishes, so a user who
follows it arrives nowhere.

An empty run is a valid outcome and must be reported as one. A brief with no
figures, clearly labelled, is worth more than a brief that looks complete and
is not.
