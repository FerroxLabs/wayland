---
name: wayland-draft-investor-update
description: >-
  Draft a monthly investor update: wins, metrics, lowlights, and asks. The agent
  gathers the period and data sources, infers the month's narrative shape (build
  month, breakthrough, slog, or pivot), pulls the metrics, builds the update, and
  iterates with the user until it ships.

  Use when the user wants a structured multi-step process to write a single
  month's investor update from their data.

  Do NOT use for a batch of historical updates, a one-line status note, or a
  question one atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "pitch-investor-email finance-report"
metadata:
  author: wayland
  version: 1.0.0
  tags: pitch investor-update reporting metrics fundraising step-by-step
  category: marketing
  depends: "pitch-investor-email finance-report"
---
# Draft a Monthly Investor Update

**Estimated time:** 20-30 minutes

This workflow drafts one month's investor update. The arc is: gather the period
and where to pull metrics from, infer the month's narrative shape, pull the
metrics, build the update (wins, metrics, lowlights, asks), then refine with the
user until it ships.

The narrative and update steps are driven by `pitch-investor-email`; metrics are
pulled by `finance-report`.

## Steps

**Step 1: Kickoff, Period, and Data** (uses: pitch-investor-email)

Open the workflow and gather inputs. Ask the user which month the update covers
and where you can pull metrics from: paste of the P&L, cash position, sales
report, or paths to those files. Do not proceed until you have the period and a
usable data source.

- Input: user-provided period (which month) and metrics source (pasted data or file paths)
- Output: a captured period-and-data block
- Key focus: get a concrete period and a real data source before drafting

**Step 2: Infer the Narrative Shape** (uses: pitch-investor-email)

From the period and data, infer the month's narrative shape: was it a build
month, a breakthrough, a slog, or a pivot? Present the inferred shape with
reasoning and ask the user to confirm or override, since the shape sets the tone
of the whole update.

- Input: the period-and-data from Step 1
- Output: the inferred narrative shape, confirmed or overridden by the user
- Key focus: the shape drives tone; get the user's agreement on it

**Step 3: Pull Metrics** (uses: finance-report)

Run `finance-report` in investor-metrics mode against the data the user
provided, to extract the metrics that belong in an investor update (revenue,
growth, burn, runway, cash, key funnel numbers). Show the pulled metrics.

- Input: the period-and-data from Step 1
- Output: the investor-relevant metrics for the month
- Key focus: pull the standard investor metrics, sourced from the user's data

**Step 4: Build the Update** (uses: pitch-investor-email)

Run `pitch-investor-email` using the data, the pulled metrics, and the confirmed
narrative shape. Produce the full update with the standard sections: wins,
metrics, lowlights, and asks, written in the tone the narrative shape implies.
Show the draft.

- Input: the period-and-data, the metrics from Step 3, the narrative shape from Step 2
- Output: a full monthly investor update draft (wins, metrics, lowlights, asks)
- Key focus: honest lowlights and specific asks, not just a victory lap

**Step 5: Review and Ship** (uses: pitch-investor-email)

Present the update draft and ask the user to ship it or refine it. If they
refine, re-run the build step with the prior update plus feedback, the metrics,
and the narrative shape, then present again. Allow up to three refinement passes
before shipping. On ship, output the final update.

- Input: the update draft from Step 4, user feedback, the metrics, the narrative shape
- Output: the final monthly investor update
- Key focus: tighten to the user's voice and ship a sendable update

## Expected Outcome

A finished monthly investor update for one period: an agreed narrative shape,
pulled metrics, and a complete draft with wins, metrics, lowlights, and asks,
refined with the user and ready to send.
