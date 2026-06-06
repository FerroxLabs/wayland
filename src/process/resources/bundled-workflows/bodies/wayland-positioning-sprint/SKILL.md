---
name: wayland-positioning-sprint
description: >-
  Positioning sprint that ends in a defensible position statement and a
  per-audience messaging matrix. Infers the competitive set, maps competitors,
  audits the brand against that map, recommends a position (what you stand for,
  against, and who it is not for), then translates it into messaging per
  audience.

  Use when the user wants a structured, multi-step process to define or sharpen
  market positioning and produce messaging tailored to each audience segment.

  Do NOT use for a single tagline tweak or one-line positioning question that an
  atomic skill can answer without running the full sprint.
license: Apache-2.0
type: workflow
skills: "market-competitors market-brand market-audit market-copy"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing positioning messaging competitors brand step-by-step
  category: marketing
  depends: "market-competitors market-brand market-audit market-copy"
---
# Positioning Sprint

**Estimated time:** 45-60 minutes

This workflow runs a positioning sprint from competitor map through brand audit
to a recommended position and a per-audience messaging matrix. By the end the
user has a defensible position statement and language tuned to each audience.
It is interactive across three review checkpoints.

## Steps

**Step 1: Kickoff and Gather the Brief** (uses: market-competitors)

Ask the user for the offer, the current positioning (or "we don't have one"),
and the top 3 competitors (or "we don't know who"). Do not proceed without a
clear offer. It is fine if positioning or competitors are unknown; later steps
infer them.

- Input: user-supplied offer, current positioning, top competitors
- Output: positioning brief
- Key focus: a clear offer; missing positioning or comps is acceptable input

**Step 2: Infer the Competitive Set** (uses: market-competitors)

From the brief, infer the competitive set: direct, adjacent, and status-quo
alternatives. State it plus your reasoning and ask the user to add any
competitors you missed.

- Input: positioning brief
- Output: confirmed competitive set
- Key focus: include status-quo alternatives, not only direct competitors

**Step 3: Build the Competitor Map** (uses: market-competitors)

From the brief and competitive set, build the competitor map: positioning,
target customer, and claim hierarchy per competitor. Show the map to the user.

- Input: positioning brief, competitive set
- Output: competitor map
- Key focus: how each competitor positions and who they target

**Step 4: Review the Competitor Map** (uses: market-competitors)

Present the competitor map and ask whether to refine it or proceed to the brand
audit. If refining, re-run the map step with the user's feedback (at most two
passes) before continuing.

- Input: competitor map; optional refinement feedback
- Output: confirmed or refined map, decision to proceed
- Key focus: agree the map before auditing against it

**Step 5: Brand Audit Against the Map** (uses: market-brand)

Audit the user's brand against the competitor map: where the current
positioning overlaps competitors, where it is undifferentiated, and where it
has a credible claim no competitor owns. Show the audit to the user.

- Input: positioning brief, competitor map
- Output: brand audit relative to the competitive field
- Key focus: find the white space the brand can credibly own

**Step 6: Recommend the Position** (uses: market-audit)

From the brief, map, and brand audit, recommend the position: what the brand
stands for, what it stands against, and who it is explicitly NOT for. Make it
defensible. Show the recommendation to the user.

- Input: positioning brief, competitor map, brand audit
- Output: recommended position statement
- Key focus: a sharp, defensible position with a clear "not for whom"

**Step 7: Review the Position** (uses: market-audit)

Present the recommended position and ask whether to refine it or proceed to the
messaging matrix. If refining, re-run the recommendation with the user's
feedback (at most three passes) before continuing.

- Input: recommended position; optional refinement feedback
- Output: confirmed or refined position, decision to proceed
- Key focus: lock the position before translating it into messaging

**Step 8: Build the Messaging Matrix** (uses: market-copy)

From the confirmed position and the brief, build the per-audience messaging
matrix: the same underlying position expressed in the language of each audience
segment. Show the matrix to the user.

- Input: confirmed position, positioning brief
- Output: per-audience messaging matrix
- Key focus: one position, segment-specific language, no positioning drift

**Step 9: Final Review and Ship** (uses: market-copy)

Present the messaging matrix. Ask the user to ship the positioning deliverable
or refine the matrix. If refining, re-run with their feedback (at most two
passes), then assemble the final Positioning Sprint deliverable with sections
for the competitive set, competitor map, brand audit, recommended position, and
messaging matrix.

- Input: messaging matrix; optional refinement feedback
- Output: final Positioning Sprint deliverable
- Key focus: ship a defensible position plus ready-to-use per-audience messaging
