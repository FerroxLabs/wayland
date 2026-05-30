---
name: wayland-competitor-deep-research
description: >-
  Deep competitor research that goes beyond a comp set into positioning gaps and
  opportunity spaces. Infers the full competitive set (direct, adjacent,
  status-quo, and nascent threats), profiles each, builds a 2x2 positioning map,
  identifies gaps, and recommends a counter-position.

  Use when the user wants a structured, multi-step process for thorough
  competitor research that ends in a positioning map and counter-positioning
  recommendation.

  Do NOT use for a quick lookup of one competitor or a single fact that one
  atomic competitor skill can answer without the full research arc.
license: Apache-2.0
type: workflow
skills: "market-competitors market-audit"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing competitors research positioning step-by-step
  category: marketing
  depends: "market-competitors market-audit"
---
# Competitor Deep Research

**Estimated time:** 45-60 minutes

This workflow runs deep competitor research, moving from a full competitive set
through per-competitor profiles, a positioning map, gap analysis, and a
counter-positioning recommendation. It is interactive across three review
checkpoints.

## Steps

**Step 1: Kickoff and Gather the Brief** (uses: market-competitors)

Ask the user for their offer, the obvious 3-5 direct competitors, and any
adjacent or status-quo competitors they suspect. Do not proceed without a clear
offer and at least the obvious direct competitors. Never fabricate competitors.

- Input: user-supplied offer, direct competitors, suspected adjacent or status-quo competitors
- Output: research brief
- Key focus: a clear offer and a real starting comp set

**Step 2: Infer the Full Competitive Set** (uses: market-competitors)

From the brief, infer the full competitive set: direct, adjacent, status-quo
alternatives, and nascent threats. This is broader than just direct comps.
State it plus your reasoning and ask the user to confirm or refine.

- Input: research brief
- Output: confirmed full competitive set
- Key focus: include status-quo and nascent threats, not only direct comps

**Step 3: Research Each Competitor** (uses: market-competitors)

For each competitor in the full set, research and document: positioning, target
segment, claim hierarchy, pricing strategy, and channels. Show the per-competitor
profiles to the user. Use real, verifiable signals; do not invent details.

- Input: research brief, confirmed competitive set
- Output: per-competitor profiles
- Key focus: comparable, structured profiles across every competitor

**Step 4: Review Research** (uses: market-competitors)

Present the per-competitor research and ask whether to refine specific entries
or proceed to the positioning map. If refining, re-run the research step on the
flagged entries with the user's feedback (at most two passes) before continuing.

- Input: per-competitor profiles; optional refinement feedback
- Output: confirmed or refined profiles, decision to proceed
- Key focus: correct any thin or inaccurate profiles before mapping

**Step 5: Build the 2x2 Positioning Map** (uses: market-competitors)

From the per-competitor profiles, build a 2x2 positioning map on the two axes
that best separate the field. Place each competitor and explain the axis choice.
Show the map to the user.

- Input: per-competitor profiles
- Output: 2x2 positioning map
- Key focus: axes that reveal where the field clusters and where it is empty

**Step 6: Identify Gaps** (uses: market-audit)

Using the map and the brief, identify the positioning gaps and opportunity
spaces: where the field is crowded, where it is empty, and which empty spaces
the user's offer could credibly own. Show the gap analysis to the user.

- Input: positioning map, research brief
- Output: gap analysis with opportunity spaces
- Key focus: empty spaces the user can credibly and profitably own

**Step 7: Review Gaps** (uses: market-audit)

Present the gaps and opportunity spaces and ask whether to refine the analysis
or proceed to the counter-positioning recommendation. If refining, re-run the
gap analysis with the user's feedback (at most two passes) before continuing.

- Input: gap analysis; optional refinement feedback
- Output: confirmed or refined gaps, decision to proceed
- Key focus: validate the chosen opportunity space before recommending a move

**Step 8: Recommend Counter-Positioning** (uses: market-audit)

From the gaps, map, and brief, recommend the counter-position: what the user
should stand for, against whom, and how to frame it so incumbents cannot easily
copy it. Show the recommendation to the user.

- Input: gap analysis, positioning map, research brief
- Output: counter-positioning recommendation
- Key focus: a defensible position the incumbents cannot trivially match

**Step 9: Final Review and Ship** (uses: market-audit)

Present the counter-positioning recommendation. Ask the user to ship the research
or refine the recommendation. If refining, re-run with their feedback (at most
two passes), then assemble the final Competitor Deep Research document with
sections for the full competitive set, per-competitor profiles, positioning
map, identified gaps, and counter-positioning recommendation.

- Input: counter-positioning recommendation; optional refinement feedback
- Output: final Competitor Deep Research document
- Key focus: ship research that ends in a clear, actionable move
