---
name: wayland-content-calendar-build
description: >-
  Build a 30/60/90-day content calendar mapped to funnel stages, with inferred
  pillar topics, a per-channel cadence, and repurpose chains for each anchor.

  Use when the user wants a structured multi-step process to plan a quarter of
  content tied to funnel stages and topic clusters.

  Do NOT use for a single post or a one-off idea; use this only when the user
  wants a full multi-week publishing plan.
license: Apache-2.0
type: workflow
skills: "content-audit content-calendar content-repurpose"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing content calendar planning funnel step-by-step
  category: marketing
  depends: "content-audit content-calendar content-repurpose"
---
# 30/60/90-Day Content Calendar Builder

**Estimated time:** 30-45 minutes

This workflow builds a quarter of content mapped to funnel stages. It captures
the brief, infers pillar topics and a per-channel cadence, lays out a 30-day
plan, extends it to 60 and 90 days, and maps repurpose chains so each long-form
anchor has its derivative shapes planned. Review gates sit at the 30-day plan
and the final assembly.

By the end you will have: confirmed pillar topics and cadence, a 30-day plan, a
60/90-day plan, and repurpose chains for the anchors.

## When to Use

- User wants a 30/60/90-day content plan tied to funnel stages
- User wants pillar topics and a per-channel cadence
- User wants repurpose chains mapped to each anchor

## Workflow Steps

**Step 1: Capture the Brief** (uses: content-calendar)

Ask the user for the offer at the top of mind, who the audience is, and which
channels they publish to. Capture this brief as the basis for the calendar.

- Input: offer, audience, channels
- Output: confirmed calendar brief
- Key focus: offer, audience, and channel mix

**Step 2: Infer Pillar Topics** (uses: content-audit)

From the brief, infer three to five pillar topics: the recurring themes the
content should orbit. State the pillars and your reasoning, then let the user
adjust.

- Input: calendar brief
- Output: three to five pillar topics with reasoning
- Key focus: a small set of durable, recurring themes

**Step 3: Recommend a Cadence** (uses: content-calendar)

From the brief and the pillars, recommend a publishing cadence per channel.
State the cadence and your reasoning, and ask the user to adjust for any known
capacity constraints.

- Input: brief, pillar topics
- Output: per-channel publishing cadence
- Key focus: a realistic cadence the user can sustain

**Step 4: Build the 30-Day Plan** (uses: content-calendar)

Build the 30-day calendar from the brief, pillars, and cadence: topics, formats,
channel mix, and funnel stage per slot. Show it, then ask whether to refine or
extend to 60/90. If the user wants changes, revise the 30-day plan against their
feedback and show it again, up to three iterations.

- Input: brief, pillars, cadence
- Output: approved 30-day calendar
- Key focus: each slot has topic, format, channel, and funnel stage

**Step 5: Extend to 60/90 Days** (uses: content-calendar)

Extend the approved 30-day plan to a full 60 and 90 days, keeping it anchored to
the same brief, pillars, and cadence so the quarter reads as one coherent arc.

- Input: brief, pillars, cadence, 30-day plan
- Output: 60/90-day calendar
- Key focus: continuity from the 30-day base across the quarter

**Step 6: Map Repurpose Chains** (uses: content-repurpose)

For the calendar's long-form anchors, plan the repurpose chains: map each anchor
to its derivative shapes across channels. Show the chains.

- Input: 30-day calendar, pillar topics
- Output: repurpose chains per anchor
- Key focus: every anchor has its derivative shapes mapped

**Step 7: Assemble the Calendar Deliverable** (uses: content-calendar)

Assemble the final document: pillar topics and cadence at the top, then the
30-day plan, the 60/90-day plan, and the repurpose chains. Before assembling,
ask whether the user wants to refine the 60/90 plan or the chains; if so, revise
against their feedback, up to three iterations, then assemble.

- Input: pillars, cadence, 30-day plan, 60/90-day plan, repurpose chains
- Output: complete 90-day content calendar document
- Key focus: one assembled, ready-to-use calendar
