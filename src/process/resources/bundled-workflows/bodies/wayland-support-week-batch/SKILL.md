---
name: wayland-support-week-batch
description: >-
  Run the weekly support batch deterministically: pull weekly metrics, check SLA
  compliance, and detect recurring patterns across the week's tickets in one pass.

  Use when the user wants an automated, multi-step weekly support roll-up from a
  ticket export, producing metrics, an SLA-compliance status, and detected
  patterns.

  Do NOT use for triaging a single live ticket or answering one ad-hoc support
  question that one atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "support-report support-sla-review support-faq"
metadata:
  author: wayland
  version: 1.0.0
  tags: support weekly metrics sla pattern-detection batch deterministic
  category: support
  depends: "support-report support-sla-review support-faq"
---
# Weekly Support Batch

**Estimated time:** about 60 seconds

This workflow runs a deterministic weekly support roll-up in three steps: pull
weekly metrics, run an SLA-compliance check, and detect recurring patterns. It is
not interactive; the agent executes each step in order and assembles the output.

**Data input:** the user provides `tickets_dir`, a path to an attached or exported
ticket file (CSV / PDF / XLSX) in the workspace. If no export is available, pull
from the connected Intercom or HubSpot tickets connector. If neither a file nor a
connector exists, ask the user to attach the export rather than inventing data.
The user may optionally provide `sla_targets_path`, a path to SLA target
definitions.

## Steps

**Step 1: Pull Weekly Metrics** (uses: support-report)

Using the support-report skill in weekly-pull mode, read the ticket export at
`tickets_dir` (or the connected Intercom/HubSpot connector if no file is given)
and compute the week's support metrics: volume, response and resolution times,
backlog, and any other standard weekly figures the skill produces. Capture the
metrics. This step is required: if it cannot read any ticket source, halt and ask
the user to attach the export rather than continuing with invented data.

- Input: tickets_dir (or connected tickets connector)
- Output: metrics
- Key focus: this step gates the others; halt on error rather than fabricating data

**Step 2: SLA Compliance Check** (uses: support-sla-review)

Using the support-sla-review skill with the metrics from Step 1 and the optional
`sla_targets_path`, check SLA compliance for the week and produce an SLA status
(which targets were met or breached, and by how much). Capture the SLA status. If
this step fails, skip it and continue to Step 3; record that the SLA status is
unavailable.

- Input: metrics from Step 1, sla_targets_path (optional)
- Output: SLA status
- Key focus: compare actuals to targets; skip gracefully if no targets are defined

**Step 3: Detect Recurring Patterns** (uses: support-faq)

Using the support-faq skill in weekly-pattern-detection mode, scan the same
`tickets_dir` source and detect recurring themes and patterns across the week's
tickets. Capture the patterns. If this step fails, skip it and continue; record
that pattern detection is unavailable. Assemble the final output with three
sections: Metrics, SLA Status, Patterns.

- Input: tickets_dir (or connected tickets connector)
- Output: patterns, assembled weekly output (Metrics, SLA Status, Patterns)
- Key focus: surface the week's recurring themes; skip gracefully on error
