---
name: wayland-competitor-watch
description: >-
  Scan a set of competitors, flag what changed since the last scan, and draft a
  brief on what is new. A fast, deterministic monitoring pass that resolves its
  competitor source from an attached list or a wired research source, detects
  deltas against a prior scan, and writes a weekly brief.

  Use when the user wants to run a competitor monitoring scan and get a short
  brief on changes since the last run.

  Do NOT use for first-time deep competitor research or positioning work; use
  the competitor deep research workflow for that.
license: Apache-2.0
type: workflow
skills: "market-competitors market-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing competitors monitoring scan brief deterministic
  category: marketing
  depends: "market-competitors market-report"
---
# Competitor Watch

**Estimated time:** about 60 seconds

This workflow runs a deterministic monitoring pass over a set of competitors,
detects changes since the previous scan, and drafts a short brief on what is
new. It is not interactive; the agent executes each step and advances.

Resolve the competitor source in this order, first hit wins:

1. Any competitor list or prior-scan export the user attached to the
   conversation (the competitor list path or last-scan path, in the workspace
   working directory).
2. The web-research connector (or a wired Sheets or analytics source) to pull
   live competitor signals.

If neither yields data, halt and ask the user to attach a competitor list or
connect a research source. Never fabricate competitors or changes to fill an
empty brief.

## Steps

**Step 1: Scan Competitors** (uses: market-competitors)

Run the weekly scan over the resolved competitor list, pulling current signals
for each competitor (positioning, pricing, messaging, offers, channels). If the
scan cannot resolve any data source, halt and ask the user to attach a
competitor list or connect a research source rather than proceeding empty.

- Input: competitor list path (attached file) or wired research source
- Output: current scan results per competitor
- Key focus: real signals only; halt rather than fabricate

**Step 2: Detect Changes** (uses: market-competitors)

Compare the current scan against the previous scan output, if one was provided,
and flag the deltas: new offers, pricing changes, messaging shifts, new
channels. If there is no prior scan (first run), skip the delta and note that
this run establishes the baseline. Do not fail the workflow if the previous
scan is missing.

- Input: current scan results, previous scan output (optional)
- Output: change set since last scan (or baseline note on first run)
- Key focus: surface only real, material changes

**Step 3: Draft the Weekly Brief** (uses: market-report)

Draft the weekly brief from the scan and the detected changes: a short,
scannable summary of what is new and what it means, with the most important
changes first. If there were no changes, say so plainly rather than padding the
brief.

- Input: scan results, detected changes
- Output: weekly competitor brief
- Key focus: a concise, honest brief that highlights what actually changed
