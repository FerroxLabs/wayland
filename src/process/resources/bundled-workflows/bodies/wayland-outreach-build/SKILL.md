---
name: wayland-outreach-build
description: >-
  Build a cold outreach sequence: ICP-targeted, multi-touch cadence with
  per-touch copy and response branches for when prospects engage, ignore, or
  object.

  Use when the user wants a complete cold outreach kit: a recommended cadence, a
  full multi-touch sequence, and follow-up branches.

  Do NOT use for prepping a single discovery call (use wayland-discovery-prep)
  or building an ICP from scratch (use wayland-icp-build).
license: Apache-2.0
type: workflow
skills: "sales-coach sales-outreach sales-followup"
metadata:
  author: wayland
  version: 1.0.0
  tags: sales outreach cold-email cadence follow-up step-by-step
  category: sales
  depends: "sales-coach sales-outreach sales-followup"
---
# Outreach Build

**Estimated time:** 20-30 minutes

This workflow builds a cold outreach sequence: an ICP-targeted, multi-touch
cadence with copy for every touch and response branches for what to send when a
prospect engages, ignores, or objects. The output is an outreach kit: brief,
cadence, sequence, and response branches.

Run the sales-coach agent throughout. Each step feeds the next.

## Steps

**Step 1: Capture the Outreach Brief** (uses: sales-coach)

Ask the user for the offer, the target ICP (or a pasted ICP doc), the channel
(email, LinkedIn, X DM, or mixed), and the goal of the sequence (book a call,
start a conversation, drive to the squeeze page). This is an interactive step:
ask, then wait for the brief before continuing.

- Input: user-provided offer, ICP, channel, and sequence goal
- Output: outreach_brief (offer, ICP, channel, goal)
- Key focus: pin down the channel and the goal before drafting

**Step 2: Recommend the Cadence** (uses: sales-outreach)

From the brief, recommend the cadence: touch count, day spacing, and channel
mix. State the recommendation and your reasoning, and invite the user to adjust
for channel-specific constraints (for example, LinkedIn connection limits per
day).

- Input: outreach_brief from Step 1
- Output: cadence (touch count, spacing, channel mix, plus reasoning)
- Key focus: a realistic cadence the user can actually run

**Step 3: Build the Sequence** (uses: sales-outreach)

Build the full sequence from the brief and the cadence: each touch with subject
lines (or hooks), body, and CTA. Show the sequence to the user.

- Input: outreach_brief from Step 1, cadence from Step 2
- Output: sequence (each touch with subject/hook, body, CTA)
- Key focus: every touch is complete and ready to send

**Step 4: Review and Refine the Sequence** (uses: sales-outreach)

Show the sequence and ask the user to refine it or proceed to follow-up
branches. If they want changes, fold their feedback back in (up to three passes)
and re-present. Once approved, advance.

- Input: sequence from Step 3, cadence from Step 2, user feedback
- Output: approved sequence
- Key focus: lock the sequence before branching

**Step 5: Build the Response Branches** (uses: sales-followup)

From the sequence, build the response branches: what to send when the prospect
engages, when they ignore, and when they object. Show the branches to the user.

- Input: sequence from Step 3
- Output: branches (engage / ignore / object follow-up paths)
- Key focus: a defined next move for every prospect reaction

**Step 6: Final Review and Ship the Kit** (uses: sales-followup)

Show the response branches and ask the user to ship the outreach kit or refine
the branches. If they want changes, fold their feedback in (up to two passes)
and re-present. When they ship, assemble the outreach kit: brief, cadence,
sequence, and response branches.

- Input: branches from Step 5, brief, cadence, sequence, user feedback
- Output: outreach_kit (the assembled Outreach Kit)
- Key focus: deliver a complete kit the user can launch immediately

## Expected Outcome

An Outreach Kit containing the brief, the recommended cadence, the full
multi-touch sequence, and the response branches for engage, ignore, and object.
