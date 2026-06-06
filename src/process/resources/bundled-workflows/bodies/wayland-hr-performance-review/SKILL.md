---
name: wayland-hr-performance-review
description: >-
  Run a performance review end to end: gather inputs, set a rating baseline, draft
  the review with specific examples per dimension, then build a development plan
  with goals and timelines, with review checkpoints before shipping the packet.

  Use when the user wants a structured, multi-step process to prep a complete
  performance-review packet for one employee.

  Do NOT use for a single piece of review feedback or one goal that one atomic
  skill can answer.
license: Apache-2.0
type: workflow
skills: "hr-review hr-1on1"
metadata:
  author: wayland
  version: 1.0.0
  tags: hr performance-review development-plan feedback step-by-step planning
  category: hr
  depends: "hr-review hr-1on1"
---
# Run a Performance Review

**Estimated time:** 30-45 minutes

This workflow preps a complete performance-review packet for one employee: a
rating baseline, a review draft with specific examples per dimension, and a
development plan with goals and timelines. The user reviews and refines the draft,
then reviews the development plan before shipping the packet.

## Steps

**Step 1: Kick Off and Capture the Brief** (uses: hr-review)

Ask the user for the employee role, the review period, key projects, and the
manager's observations (invite them to paste 1:1 notes if they have them). Capture
this as the brief. Do not proceed without role, period, and at least some
observations.

- Input: user-provided role, review period, key projects, manager observations
- Output: brief
- Key focus: concrete observations and projects ground every rating

**Step 2: Infer the Rating Baseline** (uses: hr-review)

Using the hr-review skill, infer a performance baseline (Exceeds / Meets / Below /
Significantly Below). State the baseline and the reasoning, and ask the user to
confirm or override based on what they see that you do not. Capture the rating
baseline.

- Input: brief from Step 1
- Output: rating baseline
- Key focus: the manager confirms or overrides the inferred rating

**Step 3: Build the Review Draft** (uses: hr-review)

Using the hr-review skill with the brief and the rating baseline, draft the
performance review with specific examples per dimension. Show the full output.

- Input: brief from Step 1, rating baseline from Step 2
- Output: review draft
- Key focus: a specific example for every dimension

**Step 4: Review the Draft** (uses: hr-review)

Present the review draft and ask whether to refine or proceed to the development
plan. If the user wants changes, gather feedback and re-run Step 3 with that
feedback plus the brief, looping up to 3 times. When approved, advance.

- Input: review draft from Step 3, user decision and feedback
- Output: approved review draft
- Key focus: loop on the review only (max 3 iterations)

**Step 5: Build the Development Plan** (uses: hr-1on1)

Using the hr-1on1 skill in development-plan mode with the approved review, build a
development plan with specific goals and timelines. Show the full output.

- Input: approved review draft from Step 4
- Output: development plan
- Key focus: specific goals with timelines, tied to the review

**Step 6: Final Review and Ship the Packet** (uses: hr-1on1)

Present the development plan and ask whether to ship the review packet or refine
the development plan. If the user wants changes, gather feedback and re-run Step 5
with that feedback plus the approved review, looping up to 2 times. When approved,
assemble the packet with these sections: Brief, Performance Rating, Review,
Development Plan.

- Input: development plan from Step 5, approved review from Step 4, user decision
- Output: review packet (assembled)
- Key focus: assemble the four-section packet only after the user ships
