---
name: wayland-batch-investor-update
description: >-
  Fast, deterministic prep for a monthly investor update: pull last month's
  metrics from a data directory and draft an investor-update template ready for
  review. No back-and-forth; the agent runs the two steps and hands back metrics
  plus a draft to edit.

  Use when the user wants a quick, hands-off pass that pulls the month's metrics
  and produces a draft investor-update template to review.

  Do NOT use when the user wants an interactive, narrative-shaped update (use the
  full investor-update workflow), and do NOT treat this as a scheduled routine.
license: Apache-2.0
type: workflow
skills: "finance-report pitch-investor-email"
metadata:
  author: wayland
  version: 1.0.0
  tags: pitch investor-update reporting metrics batch deterministic
  category: marketing
  depends: "finance-report pitch-investor-email"
---
# Batch Investor Update Prep

**Estimated time:** about 60 seconds

This is a deterministic, two-step prep pass. It pulls last month's metrics from a
data directory and drafts an investor-update template, ready for the user to
review and edit. There are no review checkpoints; the agent runs both steps and
returns the metrics and the draft.

Inputs: a `data_dir` (directory containing the finance and sales reports, used
by Step 1) and an optional `prior_update_path` (last month's investor update,
used by Step 2 for continuity). If `data_dir` is not provided, ask the user for
it before running Step 1.

## Steps

**Step 1: Pull Monthly Metrics** (uses: finance-report)

Run `finance-report` in investor-metrics-monthly mode against the `data_dir`,
pulling the finance and sales numbers for last month into the standard monthly
investor-metrics set. If this step fails (for example, the directory is missing
or unreadable), halt and report the error rather than proceeding with empty
metrics.

- Input: `data_dir` (directory with finance + sales reports)
- Output: last month's monthly investor metrics
- Key focus: pull a complete, correct metrics set; halt on error instead of drafting on bad data

**Step 2: Draft the Update Template** (uses: pitch-investor-email)

Run `pitch-investor-email` in monthly-template-draft mode using the pulled
metrics and, if provided, the `prior_update_path` for continuity with last
month's framing. Produce a draft investor-update template the user can review
and edit. Return both the metrics and the draft.

- Input: metrics from Step 1, optional `prior_update_path`
- Output: a draft monthly investor-update template
- Key focus: a ready-to-edit template that carries continuity from the prior update

## Expected Outcome

Last month's monthly metrics plus a draft investor-update template, produced in
one fast pass and handed back for the user to review and finalize.
