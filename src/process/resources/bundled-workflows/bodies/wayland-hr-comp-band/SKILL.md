---
name: wayland-hr-comp-band
description: >-
  Build a compensation band for a role end to end: gather the role brief,
  research market data, recommend a min/mid/max range with rationale, then add a
  comp philosophy and base/equity/bonus structure recommendation.

  Use when the user wants a structured, multi-step process to produce a defensible
  comp band and memo for a specific role.

  Do NOT use for a single quick salary lookup or a one-line range that one atomic
  skill can answer.
license: Apache-2.0
type: workflow
skills: "hr-comp-band"
metadata:
  author: wayland
  version: 1.0.0
  tags: hr compensation comp-band hiring step-by-step planning
  category: hr
  depends: "hr-comp-band"
---
# Build a Comp Band

**Estimated time:** 20-30 minutes

This workflow produces a complete compensation band recommendation for a single
role: a researched market-data picture, a min / mid / max range with rationale,
and a comp philosophy plus base/equity/bonus structure. It is interactive: the
user reviews and refines the band, then reviews and refines the philosophy before
shipping a final memo.

## Steps

**Step 1: Kick Off and Capture the Role Brief** (uses: hr-comp-band)

Ask the user for the role title, level, and location (or remote), plus any
anchoring data they already have: existing comp on the team, market data they
have seen, or candidate expectations. Capture this verbatim as the role brief.
Do not proceed until you have title, level, and location.

- Input: user-provided role title, level, location, anchoring data
- Output: role brief
- Key focus: get the three anchors (title, level, location) before inferring anything

**Step 2: Infer Market Data** (uses: hr-comp-band)

Using the hr-comp-band skill, infer market compensation data for this role,
location, and level. State the inferred range and the reasoning behind it.
Explicitly invite the user to override with real data sources they have access to
(Levels.fyi, Pave, Carta, internal benchmarks). Capture the resulting market data.

- Input: role brief from Step 1
- Output: market data (inferred or user-overridden)
- Key focus: show the reasoning so the user can correct it with real sources

**Step 3: Build the Comp Band** (uses: hr-comp-band)

Using the hr-comp-band skill with the role brief and market data, produce a comp
band with min / mid / max and a written rationale for each. Show the full output
to the user.

- Input: role brief from Step 1, market data from Step 2
- Output: comp band (min / mid / max + rationale)
- Key focus: every number needs a one-line justification

**Step 4: Review the Band** (uses: hr-comp-band)

Present the comp band and ask the user whether to refine it or proceed to the
philosophy and structure recommendations. If the user wants changes, gather
specific refinement feedback and re-run Step 3 with that feedback plus the prior
band and market data, looping up to 3 times until the user is satisfied. When the
user is satisfied, advance.

- Input: comp band from Step 3, user decision and refinement feedback
- Output: approved comp band
- Key focus: loop on the band only until the user approves (max 3 iterations)

**Step 5: Build Comp Philosophy and Structure** (uses: hr-comp-band)

Using the hr-comp-band skill in philosophy-and-structure mode with the approved
band, produce a comp philosophy plus a base / equity / bonus structure
recommendation. Show the full output.

- Input: approved comp band from Step 4
- Output: comp philosophy and base/equity/bonus structure
- Key focus: connect the structure back to the band and the role level

**Step 6: Final Review and Ship the Memo** (uses: hr-comp-band)

Present the philosophy and structure and ask the user whether to ship the comp
band memo or refine the philosophy. If they want changes, gather feedback and
re-run Step 5 with that feedback plus the approved band, looping up to 2 times.
When approved, assemble the final memo with these sections: Role Brief, Market
Data, Comp Band, Philosophy + Structure.

- Input: philosophy from Step 5, approved band from Step 4, user decision
- Output: comp band memo (assembled)
- Key focus: assemble the four-section memo only after the user ships
