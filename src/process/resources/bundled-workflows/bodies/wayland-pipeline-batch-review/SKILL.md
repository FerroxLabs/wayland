---
name: wayland-pipeline-batch-review
description: >-
  Friday pipeline review: resolve a pipeline data source, scan deal records to
  identify stuck deals past a staleness threshold, and draft quick forensics on
  the top three.

  Use when the user wants a fast batch sweep of their open pipeline to find
  stuck deals and get a first-pass diagnosis on the worst three.

  Do NOT use for a deep diagnosis of one specific deal (use
  wayland-deal-forensic) or for building an objection library
  (use wayland-objection-library-build).
license: Apache-2.0
type: workflow
skills: "sales-report sales-objections"
metadata:
  author: wayland
  version: 1.0.0
  tags: sales pipeline-review batch stuck-deals forensics reporting
  category: sales
  depends: "sales-report sales-objections"
---
# Pipeline Batch Review

**Estimated time:** about 60 seconds

This workflow is a fast, mostly deterministic pipeline sweep. It resolves a
pipeline data source, identifies the deals that have not advanced past a
staleness threshold, and drafts quick forensics on the top three stuck deals.
The output is a list of stuck deals plus first-pass forensics.

**Data input resolution.** Before scanning, resolve the pipeline source in this
order, first hit wins:

1. Any deal export the user attached to the conversation (CSV, XLSX, or PDF in
   the workspace working directory).
2. The connected HubSpot deals connector (or a wired Sheets or SQL sales
   source) for open pipeline rows.
3. A pipeline directory on disk containing deal records (JSON, CSV, or
   markdown).

If none of these yields data, halt and ask the user to attach an export or
connect HubSpot. Never fabricate deals to fill an empty review.

**Inputs.** Confirm two inputs before scanning: the pipeline directory (used
only when no attached export or HubSpot connector is available, required) and
the staleness threshold in days (default 14; days without advancement past this
count a deal as stuck).

## Steps

**Step 1: Scan for Stuck Deals** (uses: sales-report)

Resolve the pipeline source per the resolution order above, then scan the deal
records to identify the stuck deals: those that have not advanced in more than
the staleness threshold number of days. If the source resolves to no data, halt
and ask the user to attach an export or connect HubSpot rather than continuing.
Output the list of stuck deals.

- Input: resolved pipeline source (attached export, HubSpot connector, or pipeline directory), staleness threshold in days (default 14)
- Output: stuck_deals (the deals past the staleness threshold)
- Key focus: identify real stuck deals from real data; never fabricate deals; halt on empty

**Step 2: Forensics on the Top Three** (uses: sales-objections)

Draft quick first-pass forensics on the top three stuck deals from the scan:
the likely real objection, the blocking lock, and a suggested next move for
each. If this step errors, skip it rather than halting the run, since the stuck
deals list is already useful on its own.

- Input: stuck_deals from Step 1
- Output: forensics (quick forensics on the top three stuck deals)
- Key focus: a fast first-pass diagnosis on the worst three; skip on error

## Expected Outcome

A list of stuck deals from the resolved pipeline source, plus quick first-pass
forensics on the top three. If no data source resolves, the run halts and asks
the user to attach an export or connect HubSpot.
