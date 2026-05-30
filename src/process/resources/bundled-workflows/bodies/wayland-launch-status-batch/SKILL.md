---
name: wayland-launch-status-batch
description: >-
  During-launch daily status workflow. Pulls live launch metrics from the
  available data sources, flags issues against those metrics, and drafts a daily
  standup. Runs fast and deterministically with no required user interaction.

  Use during an active launch when the user wants a quick daily pull of metrics,
  issues, and a standup draft.

  Do NOT use for pre-launch planning or building assets, and never fabricate
  metrics when a data source is missing.
license: Apache-2.0
type: workflow
skills: "launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing launch metrics standup deterministic reporting
  category: marketing
  depends: "launch"
---
# Launch Status Batch

**Estimated time:** about 60 seconds

This is a deterministic during-launch workflow: pull metrics, flag issues, draft
the daily standup. It needs no user interaction once the inputs are known. It
expects two inputs: the path to the active-launch file describing the current
launch (active_launch_path), and the data source paths for sales, ads, and
support (data_dirs).

Resolve the launch numbers in this strict order, per domain, and never fabricate
metrics:

1. Use any file attached to the conversation (an exported CSV/PDF/XLSX of sales,
   ads, or support data) and any files found under the provided data_dirs.
2. Otherwise query the connected MCP connector for each domain: revenue/orders
   from Stripe (or the configured DB/Sheets); sales pipeline from HubSpot deals;
   support load from Intercom or HubSpot tickets; ad spend from the exported
   analytics CSV.
3. Otherwise ask the user to attach the export for the missing domain.

If a domain has no data source, report it as "no data" rather than guessing.

**Step 1: Pull the Daily Metrics** (uses: launch)

Read the active-launch file and the data sources. Pull the daily metrics across
revenue/orders, sales pipeline, support load, and ad spend, in daily-metrics-pull
mode, following the data resolution order above. This step is critical: if metrics
cannot be pulled at all, halt and report why rather than continuing with
fabricated numbers.

- Input: active_launch_path, data_dirs
- Output: metrics (pulled daily metrics by domain)
- Key focus: real numbers from real sources; halt on hard failure

**Step 2: Flag Issues** (uses: launch)

From the pulled metrics, detect and flag issues in issue-flag-detection mode:
anomalies, underperformance against plan, and risks worth attention. If this step
fails, skip it and proceed (issues are non-blocking for the standup).

- Input: metrics
- Output: issues (flagged issues, or empty if none/skipped)
- Key focus: surface what needs attention today

**Step 3: Draft the Daily Standup** (uses: launch)

From the metrics and any flagged issues, draft the daily standup in
daily-standup-draft mode: a concise status the team can read in under a minute,
covering current numbers, flagged issues, and next actions.

- Input: metrics, issues
- Output: standup (daily standup draft)
- Key focus: a tight, accurate daily update
