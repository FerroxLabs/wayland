---
name: wayland-hr-handbook
description: >-
  Build an employee handbook from scratch, section by section: determine required
  sections from jurisdiction and stage, then draft foundational, policy, and
  operational sections plus an attestation, with a review checkpoint after each
  block.

  Use when the user wants a structured, long-form, multi-step process to produce a
  complete draft employee handbook they review as it is built.

  Do NOT use for a single policy paragraph or a one-section edit that one atomic
  skill can answer.
license: Apache-2.0
type: workflow
skills: "hr-handbook"
metadata:
  author: wayland
  version: 1.0.0
  tags: hr handbook policy compliance step-by-step planning
  category: hr
  depends: "hr-handbook"
---
# Build an Employee Handbook

**Estimated time:** 60-90 minutes

This is long-form work. The workflow builds a complete draft employee handbook in
review-as-you-go blocks: foundational sections, policy sections, operational
sections, and an attestation. The user reviews and refines each block before the
next. The final draft requires employment-counsel review before distribution.

## Steps

**Step 1: Kick Off and Capture the Brief** (uses: hr-handbook)

Tell the user this is long-form work they will review section by section. Ask for:
company stage, headcount, jurisdictions (states / countries), any existing
handbook, and the key cultural anchors they want preserved. Capture this as the
brief. Jurisdictions are required because they drive the required-sections list.

- Input: user-provided stage, headcount, jurisdictions, existing handbook, cultural anchors
- Output: brief
- Key focus: capture every jurisdiction; it determines mandatory sections

**Step 2: Infer Required Sections** (uses: hr-handbook)

Using the hr-handbook skill, infer the required handbook sections for the given
jurisdictions and company stage. List them with reasoning, and invite the user to
add or remove sections. Capture the resulting section list.

- Input: brief from Step 1
- Output: required sections list
- Key focus: surface jurisdiction-mandated sections explicitly

**Step 3: Build Foundational Sections** (uses: hr-handbook)

Using the hr-handbook skill in foundational-sections mode with the brief and the
required-sections list, draft the foundational sections (welcome, mission,
employment basics). Show the full output.

- Input: brief from Step 1, required sections from Step 2
- Output: foundational sections
- Key focus: welcome, mission, and core employment basics

**Step 4: Review Foundational Sections** (uses: hr-handbook)

Present the foundational sections and ask whether to refine or proceed to
policies. If the user wants changes, gather feedback and re-run Step 3 with that
feedback plus the required-sections list, looping up to 2 times. When approved,
advance.

- Input: foundational sections from Step 3, user decision and feedback
- Output: approved foundational sections
- Key focus: loop on foundational only (max 2 iterations)

**Step 5: Build Policy Sections** (uses: hr-handbook)

Using the hr-handbook skill in policy-sections mode with the brief and
required-sections list, draft the policy sections (anti-harassment, leave,
accommodation, conduct, remote work, and any others the jurisdictions require).
Show the full output.

- Input: brief from Step 1, required sections from Step 2
- Output: policy sections
- Key focus: jurisdiction-required policies must be present

**Step 6: Review Policy Sections** (uses: hr-handbook)

Present the policy sections and ask whether to refine or proceed to operational
sections. If the user wants changes, gather feedback and re-run Step 5 with that
feedback plus the required-sections list, looping up to 3 times. When approved,
advance.

- Input: policy sections from Step 5, user decision and feedback
- Output: approved policy sections
- Key focus: loop on policies only (max 3 iterations)

**Step 7: Build Operational Sections** (uses: hr-handbook)

Using the hr-handbook skill in operational-sections mode with the brief and
required-sections list, draft the operational sections. Show the full output.

- Input: brief from Step 1, required sections from Step 2
- Output: operational sections
- Key focus: day-to-day operational policies and procedures

**Step 8: Build the Attestation** (uses: hr-handbook)

Using the hr-handbook skill in attestation-and-signature mode with the brief,
draft the acknowledgement attestation and signature block. Show the full output.

- Input: brief from Step 1
- Output: attestation and signature block
- Key focus: a clear acknowledgement the employee signs

**Step 9: Final Review and Ship to Counsel** (uses: hr-handbook)

Present the operational sections and attestation together. Ask whether to ship the
handbook (routed to counsel) or refine the operational/attestation block. If the
user wants changes, gather feedback and re-run Step 7 with that feedback plus the
required-sections list, looping up to 2 times. When approved, assemble the full
handbook (foundational, policies, operational, attestation) and append a note that
it is a draft requiring employment-counsel review before distribution.

- Input: operational sections from Step 7, attestation from Step 8, user decision
- Output: employee handbook draft (assembled, counsel-review flagged)
- Key focus: never present as final; counsel review is mandatory
