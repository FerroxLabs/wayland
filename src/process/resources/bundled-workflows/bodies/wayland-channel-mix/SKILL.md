---
name: wayland-channel-mix
description: >-
  Recommend a channel mix sized to goals and budget, with CAC math per channel
  and a throughput plan. Infers audience starting temperature (which dictates
  which channels work), surfaces viable options with CAC ranges, then a
  budget-optimized mix with break-even math and the creative capacity needed.

  Use when the user wants a structured, multi-step process to decide where to
  spend a marketing budget across channels with per-channel CAC economics.

  Do NOT use for a single-channel tactical question that one atomic funnel or
  channel skill can answer without sizing the whole mix.
license: Apache-2.0
type: workflow
skills: "convert-temperature market-funnel market-launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing channels cac budget funnel step-by-step
  category: marketing
  depends: "convert-temperature market-funnel market-launch"
---
# Channel Mix

**Estimated time:** 20-30 minutes

This workflow recommends a channel mix sized to the user's goals and budget,
with expected CAC per channel, break-even math, and a throughput plan for the
creative and capacity the mix requires. It is interactive across three review
checkpoints.

## Steps

**Step 1: Kickoff and Gather Goals** (uses: market-funnel)

Ask the user for the revenue goal (or lead goal), the total marketing budget,
the target audience, and the timeline. These bound the entire mix. Do not
proceed without a real budget and a measurable goal.

- Input: user-supplied revenue or lead goal, total budget, audience, timeline
- Output: structured channel-mix brief
- Key focus: a concrete budget and goal to size the mix against

**Step 2: Infer Audience Temperature** (uses: convert-temperature)

From the brief, infer the audience starting temperature (cold, warm, or hot).
State it plus your reasoning. Temperature dictates which channels work: cold
paid needs bridge content, warm email can run a direct offer. This gates the
channel options.

- Input: channel-mix brief
- Output: inferred audience temperature with reasoning
- Key focus: temperature drives channel viability

**Step 3: Surface Viable Channel Options** (uses: market-funnel)

Given the brief and temperature, list the viable channel options, each with an
expected CAC range. Exclude channels that do not fit the temperature or budget.
Show the options to the user.

- Input: channel-mix brief, audience temperature
- Output: viable channel options with CAC ranges
- Key focus: only channels that can actually work for this audience and budget

**Step 4: Review Options** (uses: market-funnel)

Present the options and ask whether to refine them or proceed to the
recommended mix. If refining, re-run the options step with the user's feedback
(at most two passes) before continuing.

- Input: channel options; optional refinement feedback
- Output: confirmed or refined options, decision to proceed
- Key focus: agree the option set before allocating budget

**Step 5: Recommend the Budget-Optimized Mix** (uses: market-funnel)

From the confirmed options, recommend the budget-optimized mix: allocation per
channel, expected CAC per channel, and break-even math against the goal. Show
the mix to the user.

- Input: channel-mix brief, confirmed channel options
- Output: recommended mix with allocation, CAC, and break-even math
- Key focus: allocation that maximizes return within the budget

**Step 6: Review the Mix** (uses: market-funnel)

Present the recommended mix and ask whether to refine it or proceed to the
throughput plan. If refining, re-run the mix step with the user's feedback (at
most three passes) before continuing.

- Input: recommended mix; optional refinement feedback
- Output: confirmed or refined mix, decision to proceed
- Key focus: lock the allocation before planning throughput

**Step 7: Build the Throughput Plan** (uses: market-launch)

From the confirmed mix, derive the throughput requirements: creative count per
channel, cadence, and the capacity (team, budget, tooling) needed to sustain
the mix. Show the plan to the user.

- Input: confirmed channel mix
- Output: throughput plan (creative count, cadence, capacity)
- Key focus: whether the mix is actually executable at the required volume

**Step 8: Final Review and Ship** (uses: market-launch)

Present the throughput plan. Ask the user to ship the channel-mix memo or refine
the throughput. If refining, re-run with their feedback (at most two passes),
then assemble the final Channel Mix Memo with sections for the brief, audience
temperature, channel options, recommended mix, and throughput plan.

- Input: throughput plan; optional refinement feedback
- Output: final Channel Mix Memo
- Key focus: ship a memo that is both economically sound and executable
