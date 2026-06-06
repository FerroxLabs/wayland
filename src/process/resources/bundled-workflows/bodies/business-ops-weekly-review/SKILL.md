---
name: business-ops-weekly-review
description: >-
  Pull the week's metrics from the provided data sources and draft a weekly
  business review covering wins, blockers, and next-week priorities, with
  continuity from the prior week's review when available.

  Use when the user wants an automated weekly review assembled from finance,
  sales, and support data sources.

  Do NOT use for monthly or quarterly reviews, or when there is no underlying
  data to pull metrics from.
license: Apache-2.0
type: workflow
skills: "ops-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-ops weekly-review metrics reporting deterministic
  category: Business Operations
  depends: "ops-report"
---
# Weekly Review

**Estimated time:** about 60 seconds

This workflow pulls the week's metrics from the provided data sources and drafts
a weekly review of wins, blockers, and priorities, carrying continuity forward
from the prior week when a prior review is supplied. It runs as a deterministic
two-action pipeline once the inputs are known.

## Steps

**Step 1: Gather the Data Sources**

Confirm the inputs before pulling anything. You need `data_dirs`: a path or list
of paths to the weekly data sources (finance, sales, support reports). This input
is required, so if it is missing, ask the user for it and wait. Optionally accept
`prior_review_path`: a file path to last week's review for continuity. If it is
not provided, proceed without it.

- Input: data_dirs (required), prior_review_path (optional)
- Output: confirmed source paths for the metrics pull
- Key focus: do not proceed without a valid data_dirs path

**Step 2: Pull the Weekly Metrics** (uses: ops-report)

Pull the week's metrics from the confirmed data sources in weekly-metrics mode.
Read the finance, sales, and support sources and extract the period's key numbers.
If the pull fails (unreadable or missing sources), halt and report the error
rather than fabricating numbers; do not advance to the draft.

- Input: data_dirs from Step 1
- Output: the pulled weekly metrics
- Key focus: real numbers from the sources; halt on a pull failure

**Step 3: Draft the Weekly Review** (uses: ops-report)

Draft the weekly review from the pulled metrics in weekly-review-draft mode:
wins, blockers, and next-week priorities. If a prior review path was provided,
read it and carry trends and continuity forward so the draft reads as a follow-on
rather than a standalone snapshot. Output the metrics alongside the draft.

- Input: weekly metrics from Step 2, prior_review_path from Step 1 (optional)
- Output: the metrics plus the drafted weekly review
- Key focus: wins, blockers, priorities, with week-over-week continuity
