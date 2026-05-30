---
name: wayland-campaign-brief
description: >-
  Build a campaign brief detailed enough that creative can execute without
  re-asking. Captures goal, KPI, offer, audience, and timeline, infers the one
  specific angle that makes the campaign distinct, then produces the brief, an
  asset list with specs, and a per-asset creative spec.

  Use when the user wants a structured, multi-step process to turn a campaign
  goal into an executable brief plus an asset list and creative spec.

  Do NOT use for a single piece of copy or a one-line angle question that one
  atomic copy skill can answer without building the full brief.
license: Apache-2.0
type: workflow
skills: "market-copy market-launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing campaign brief creative launch step-by-step
  category: marketing
  depends: "market-copy market-launch"
---
# Campaign Brief

**Estimated time:** 25-35 minutes

This workflow produces a campaign brief specific enough for creative to execute
without re-asking, plus an asset list with specs and a per-asset creative spec.
It is interactive: the user reviews and can refine the brief and the creative
spec before shipping.

## Steps

**Step 1: Kickoff and Gather Inputs** (uses: market-launch)

Ask the user for the campaign basics: what they are trying to achieve (goal
plus KPI), the offer, the audience, and the timeline. Push for specifics; a
vague goal produces a vague brief. Do not proceed until the inputs are concrete.

- Input: user-supplied goal and KPI, offer, audience, timeline
- Output: structured campaign inputs
- Key focus: get a measurable goal and a real offer, not platitudes

**Step 2: Infer the Campaign Angle** (uses: market-copy)

From the inputs, infer the single specific angle (the one frame that makes this
campaign different from a generic awareness push). State the inferred angle plus
your reasoning. This angle drives the rest of the brief.

- Input: campaign inputs from Step 1
- Output: campaign angle with reasoning
- Key focus: one sharp, differentiated frame, not a list of generic benefits

**Step 3: Build the Brief** (uses: market-launch)

Build the campaign brief using the inputs and the inferred angle: goal,
audience, angle, channels, KPIs, and timeline. Make it execution-ready. Show
the brief to the user.

- Input: campaign inputs, campaign angle
- Output: campaign brief (goal, audience, angle, channels, KPIs)
- Key focus: specific enough that creative does not need to re-ask

**Step 4: Review the Brief** (uses: market-launch)

Present the brief and ask whether to refine it or proceed to the asset list. If
the user wants changes, re-run the brief build with their feedback (at most
three refinement passes) before continuing.

- Input: campaign brief; optional refinement feedback
- Output: confirmed or refined brief, decision to proceed
- Key focus: lock the brief before deriving assets from it

**Step 5: Build the Asset List with Specs** (uses: market-launch)

From the confirmed brief, produce the asset list with specs: every asset the
campaign needs, with format, dimensions or length, placement, and purpose. Show
the list to the user.

- Input: confirmed campaign brief
- Output: asset list with per-asset specs
- Key focus: complete coverage of every channel in the brief

**Step 6: Build the Creative Spec** (uses: market-copy)

For each asset, write the creative spec: the message, the hook, the proof, the
call to action, and any voice or visual direction. The spec should be enough
for creative to execute the asset directly. Show it to the user.

- Input: confirmed brief, asset list
- Output: per-asset creative spec
- Key focus: each asset spec is independently executable

**Step 7: Final Review and Ship** (uses: market-copy)

Present the creative spec. Ask the user to ship the brief or refine the creative
spec. If refining, re-run with their feedback (at most two passes), then
assemble the final Campaign Brief document with sections for inputs, angle,
brief, asset list, and creative spec.

- Input: per-asset creative spec; optional refinement feedback
- Output: final Campaign Brief document
- Key focus: hand creative a self-contained, execution-ready package
