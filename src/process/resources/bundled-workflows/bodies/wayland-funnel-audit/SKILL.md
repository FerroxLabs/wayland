---
name: wayland-funnel-audit
description: >-
  Diagnose an existing funnel. Classifies stages, identifies likely dropoff
  points against the math, runs a stage-by-stage audit, and produces a
  prioritized fix list ranked by impact over effort.

  Use when the user has a live funnel and wants a structured, multi-step
  diagnosis that finds the leaks and recommends prioritized fixes.

  Do NOT use to design a new funnel from scratch or for a question one atomic
  audit skill can answer without the full stage-by-stage diagnosis.
license: Apache-2.0
type: workflow
skills: "funnels-architecture-audit funnels-offer-audit"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing funnels audit diagnostics step-by-step optimization
  category: marketing
  depends: "funnels-architecture-audit funnels-offer-audit"
---
# Funnel Audit

**Estimated time:** 20-30 minutes

This workflow audits an existing funnel: it finds the leaks and prioritizes the
fixes. Audit work without numbers is guesswork, so the agent asks for conversion
rates per stage and diagnoses against the math wherever the user can provide it.
The output is a prioritized fix list ordered by impact over effort.

## Steps

**Step 1: Capture the Funnel Under Audit** (uses: funnels-architecture-audit)

Ask the user to paste the funnel structure (URLs, a page list, or a description
of the stages). Ask for conversion numbers per stage if they have them, since
even rough rates let the audit calibrate which stage is actually the leak. Do
not advance until you have a concrete description of the funnel.

- Input: user's funnel structure and any per-stage conversion numbers
- Output: captured funnel description with available metrics
- Key focus: numbers turn guesswork into diagnosis; gather what exists

**Step 2: Classify the Stages** (uses: funnels-architecture-audit)

Classify the funnel into stages: entry, tripwire, core, and backend. Present the
classification with reasoning and ask the user to confirm or correct. Correct
stage labels are required for the diagnostics that follow.

- Input: funnel description from Step 1
- Output: confirmed stage classification
- Key focus: map the funnel onto entry / tripwire / core / backend correctly

**Step 3: Infer Likely Dropoff Points** (uses: funnels-offer-audit)

Infer the likely dropoff points using Method diagnostics, given the funnel and
its stage classification. Present them with reasoning and ask the user to
confirm or override based on what they actually see in their data.

- Input: funnel description, stage classification
- Output: confirmed likely dropoff points
- Key focus: name where leads leak before drilling into each stage

**Step 4: Run the Stage-by-Stage Audit** (uses: funnels-architecture-audit)

Run the full stage-by-stage audit, producing a diagnosis per stage using the
funnel, the stage classification, and the known dropoffs. Show the audit to the
user and ask whether to drill deeper into a specific stage or proceed to the
prioritized fix list. Revise or deepen on feedback before advancing.

- Input: funnel description, stage classification, known dropoffs
- Output: full stage-by-stage audit with per-stage diagnoses
- Key focus: a concrete diagnosis for every stage, grounded in the numbers

**Step 5: Prioritize the Fixes** (uses: funnels-offer-audit)

Produce the prioritized fix list from the audit, ranking items by impact over
effort with the highest-leverage fixes first. Show the list to the user and ask
whether to assemble the audit deliverable or adjust priorities or scope. Revise
on feedback before advancing.

- Input: full audit from Step 4
- Output: prioritized fix list ranked by impact / effort
- Key focus: surface the highest-leverage fixes first

**Step 6: Assemble the Audit Document** (uses: funnels-architecture-audit)

Assemble the complete audit deliverable. Include the funnel under audit, the
stage classification, the identified dropoff points, the stage-by-stage audit,
and the prioritized fix list. Deliver it as the final artifact.

- Input: all confirmed outputs from Steps 1 through 5
- Output: complete funnel audit document
- Key focus: one document the user can act on, ordered by priority
