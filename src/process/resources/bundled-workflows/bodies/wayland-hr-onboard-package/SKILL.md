---
name: wayland-hr-onboard-package
description: >-
  Build a complete onboarding package for a new hire: a first-week plan, a
  30/60/90-day milestone plan, and a paperwork checklist, shaped to the role and
  level, with review checkpoints before shipping.

  Use when the user wants a structured, multi-step process to produce a full
  onboarding package for a specific new hire.

  Do NOT use for a single onboarding checklist item or a one-line first-day note
  that one atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "hr-onboard"
metadata:
  author: wayland
  version: 1.0.0
  tags: hr onboarding new-hire 30-60-90 step-by-step planning
  category: hr
  depends: "hr-onboard"
---
# Build an Onboarding Package

**Estimated time:** 20-30 minutes

This workflow produces a complete onboarding package for one new hire: a
first-week plan, a 30/60/90-day milestone plan, and a paperwork checklist. The
user reviews and refines the first-week plan, then reviews the milestones and
paperwork before shipping.

## Steps

**Step 1: Kick Off and Capture the Brief** (uses: hr-onboard)

Ask the user for the role, start date, and manager, plus any company-specific
onboarding cadence they already follow. Capture this as the brief. Do not proceed
without role and start date.

- Input: user-provided role, start date, manager, existing cadence
- Output: brief
- Key focus: role and start date anchor the whole package

**Step 2: Infer the Onboarding Shape** (uses: hr-onboard)

Using the hr-onboard skill, infer the recommended onboarding shape for this role
and level. State the shape and the reasoning. Capture the shape.

- Input: brief from Step 1
- Output: onboarding shape
- Key focus: match the shape to role and level

**Step 3: Build the First-Week Plan** (uses: hr-onboard)

Using the hr-onboard skill in first-week-plan mode with the brief and the
onboarding shape, draft a day-by-day first-week plan. Show the full output.

- Input: brief from Step 1, shape from Step 2
- Output: first-week plan
- Key focus: a concrete day-by-day first week

**Step 4: Review the First-Week Plan** (uses: hr-onboard)

Present the first-week plan and ask whether to refine or proceed to the 30/60/90
plan. If the user wants changes, gather feedback and re-run Step 3 with that
feedback plus the brief, looping up to 2 times. When approved, advance.

- Input: first-week plan from Step 3, user decision and feedback
- Output: approved first-week plan
- Key focus: loop on the first week only (max 2 iterations)

**Step 5: Build the 30/60/90 Milestones** (uses: hr-onboard)

Using the hr-onboard skill in 30/60/90-milestones mode with the brief and the
approved first-week plan, draft the 30-, 60-, and 90-day milestones. Show the full
output.

- Input: brief from Step 1, approved first-week plan from Step 4
- Output: 30/60/90 milestones
- Key focus: measurable milestones at each horizon

**Step 6: Build the Paperwork Checklist** (uses: hr-onboard)

Using the hr-onboard skill in paperwork-checklist mode with the brief, draft the
onboarding paperwork checklist. Show the full output.

- Input: brief from Step 1
- Output: paperwork checklist
- Key focus: every required form and signature

**Step 7: Final Review and Ship the Package** (uses: hr-onboard)

Present the 30/60/90 milestones and paperwork checklist together. Ask whether to
ship the package or refine the milestones or paperwork. If the user wants changes,
gather feedback and re-run Step 5 with that feedback plus the approved first-week
plan, looping up to 2 times. When approved, assemble the package with these
sections: Onboarding Shape, First-Week Plan, 30/60/90 Milestones, Paperwork
Checklist.

- Input: milestones from Step 5, paperwork from Step 6, user decision
- Output: onboarding package (assembled)
- Key focus: assemble the four-section package only after the user ships
