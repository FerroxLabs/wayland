---
name: wayland-brand-audit
description: >-
  Visual, voice, and positioning brand audit that ends in a prioritized fix
  list ordered by impact. Infers the current brand archetype from real assets,
  audits each dimension separately, then merges findings into a ranked action
  plan the user can ship.

  Use when the user wants a structured, multi-step process to audit a brand
  across visual, voice, and positioning and walk away with prioritized fixes.

  Do NOT use for a one-off copy tweak or a single asset review that one atomic
  brand skill can answer without the full three-dimension audit.
license: Apache-2.0
type: workflow
skills: "market-brand market-audit"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing brand audit positioning voice step-by-step
  category: marketing
  depends: "market-brand market-audit"
---
# Brand Audit

**Estimated time:** 20-30 minutes

This workflow audits a brand across three dimensions (visual, voice, and
positioning), then prioritizes the fixes by impact so the user knows exactly
what to change first. It is interactive: at two checkpoints the user can refine
findings or priorities before shipping.

## Steps

**Step 1: Kickoff and Gather Assets** (uses: market-brand)

Ask the user to point you at the assets to audit. Request: the homepage, the
primary product page, the top 3 marketing assets (ads, one-pager, or pitch
deck), and any brand guidelines document. Do not proceed until you have enough
real material to audit. Never invent assets.

- Input: user-supplied homepage URL, product page, top 3 marketing assets, brand guidelines doc
- Output: collected asset set ready for audit
- Key focus: get concrete, real assets before auditing anything

**Step 2: Infer the Brand Archetype** (uses: market-brand)

From the gathered assets, infer the brand archetype the assets currently
project. State the inferred archetype plus your reasoning, then ask the user to
confirm it or override it with the archetype they actually want to embody. The
confirmed archetype becomes the yardstick for the visual and voice audits.

- Input: collected assets from Step 1
- Output: confirmed brand archetype (current vs. intended)
- Key focus: surface the gap between the projected and intended archetype

**Step 3: Visual Consistency Audit** (uses: market-brand)

Audit visual consistency against the confirmed archetype: logo usage, color
system, typography, imagery style, layout, and whether the visual system reads
as one coherent brand across all assets. Show the findings to the user.

- Input: collected assets, confirmed archetype
- Output: visual audit findings with specific inconsistencies flagged
- Key focus: does the visual system consistently signal the intended archetype

**Step 4: Voice Consistency Audit** (uses: market-brand)

Audit voice and tone consistency against the confirmed archetype: word choice,
sentence rhythm, formality, point of view, and whether copy across assets
sounds like one brand. Show the findings to the user.

- Input: collected assets, confirmed archetype
- Output: voice audit findings with specific inconsistencies flagged
- Key focus: does the copy sound like one consistent brand voice

**Step 5: Positioning Clarity Audit** (uses: market-audit)

Audit positioning clarity: is it obvious what the brand is, who it is for, what
it stands for and against, and why it is different. Flag vague, generic, or
contradictory positioning across the assets. Show the findings to the user.

- Input: collected assets
- Output: positioning audit findings
- Key focus: clarity and differentiation of the stated position

**Step 6: Review Findings** (uses: market-audit)

Present the combined visual, voice, and positioning findings. Ask the user
whether they want to refine specific findings or proceed to the prioritized fix
list. If they ask to refine, re-run the positioning audit with their feedback
(at most two refinement passes) before continuing.

- Input: visual, voice, and positioning findings; optional user refinement feedback
- Output: confirmed or refined finding set, decision to proceed
- Key focus: let the user correct any findings before prioritizing

**Step 7: Prioritize Fixes** (uses: market-audit)

Merge all findings into a single prioritized fix list, top items first by
impact. Each fix should name the dimension, the problem, the recommended
change, and why it ranks where it does. Show the list to the user.

- Input: visual audit, voice audit, positioning audit findings
- Output: impact-ranked fix list
- Key focus: order by business impact, not by ease

**Step 8: Final Review and Ship** (uses: market-audit)

Present the prioritized fix list. Ask the user to ship the audit or adjust the
priorities. If they want to adjust, re-rank with their feedback (at most two
passes), then assemble the final Brand Audit document with sections for the
inferred archetype, visual audit, voice audit, positioning audit, and
prioritized fixes.

- Input: prioritized fix list; optional priority-adjustment feedback
- Output: final Brand Audit document
- Key focus: ship a document the user can act on immediately
