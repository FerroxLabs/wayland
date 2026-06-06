---
name: wayland-hr-hire-loop
description: >-
  Build a complete hiring loop for an open role: job description, screening
  rubric, full interview kit, and offer-letter template, anchored to an inferred
  comp band, with review checkpoints between each artifact.

  Use when the user wants a structured, multi-step process to produce every
  artifact needed to run a hiring loop for one role.

  Do NOT use for a single job-description draft or one interview question that one
  atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "hr-comp-band hr-job-description hr-interview-questions hr-offer-letter"
metadata:
  author: wayland
  version: 1.0.0
  tags: hr hiring recruiting interview job-description step-by-step planning
  category: hr
  depends: "hr-comp-band hr-job-description hr-interview-questions hr-offer-letter"
---
# Build a Hiring Loop

**Estimated time:** 45-60 minutes

This workflow produces a complete hiring-loop package for one open role: a comp
band, a job description, a screening rubric, a full interview kit, and an
offer-letter template. The user reviews and refines the JD, the interview kit, and
the offer letter before the package ships.

## Steps

**Step 1: Kick Off and Capture the Role Brief** (uses: hr-job-description)

Ask the user for the role title, level (junior / mid / senior / lead),
department, key responsibilities, and target start date. Capture this as the role
brief. Do not proceed without title, level, and responsibilities.

- Input: user-provided title, level, department, responsibilities, start date
- Output: role brief
- Key focus: level and responsibilities drive every downstream artifact

**Step 2: Infer the Comp Band** (uses: hr-comp-band)

Using the hr-comp-band skill, infer a comp band for this role. State the band and
the reasoning, and invite the user to override with an internal band if they have
one. Capture the comp band.

- Input: role brief from Step 1
- Output: comp band
- Key focus: produce a band the JD and offer letter can both reference

**Step 3: Build the Job Description** (uses: hr-job-description)

Using the hr-job-description skill with the role brief and comp band, draft the
job description. Show the full output.

- Input: role brief from Step 1, comp band from Step 2
- Output: job description
- Key focus: responsibilities, requirements, and comp transparency

**Step 4: Review the Job Description** (uses: hr-job-description)

Present the JD and ask whether to refine or proceed to the screening rubric. If
the user wants changes, gather feedback and re-run Step 3 with that feedback plus
the role brief, looping up to 2 times. When approved, advance.

- Input: job description from Step 3, user decision and feedback
- Output: approved job description
- Key focus: loop on the JD only (max 2 iterations)

**Step 5: Build the Screening Rubric** (uses: hr-interview-questions)

Using the hr-interview-questions skill in screening-rubric mode with the approved
JD and role brief, produce a screening rubric. Show the full output.

- Input: approved JD from Step 4, role brief from Step 1
- Output: screening rubric
- Key focus: criteria that map directly to JD requirements

**Step 6: Build the Full Interview Kit** (uses: hr-interview-questions)

Using the hr-interview-questions skill in full-interview-kit mode with the JD and
screening rubric, produce the interview kit (questions, rubric, scorecard,
calibration notes). Show the full output.

- Input: approved JD from Step 4, screening rubric from Step 5
- Output: interview kit
- Key focus: questions, scorecard, and calibration notes together

**Step 7: Review the Interview Kit** (uses: hr-interview-questions)

Present the interview kit and ask whether to refine or proceed to the offer
letter. If the user wants changes, gather feedback and re-run Step 6 with that
feedback plus the JD, looping up to 2 times. When approved, advance.

- Input: interview kit from Step 6, user decision and feedback
- Output: approved interview kit
- Key focus: loop on the kit only (max 2 iterations)

**Step 8: Build the Offer Letter** (uses: hr-offer-letter)

Using the hr-offer-letter skill with the JD, comp band, and role brief, draft the
offer-letter template. Show the full output.

- Input: approved JD from Step 4, comp band from Step 2, role brief from Step 1
- Output: offer-letter template
- Key focus: comp figures must match the band

**Step 9: Final Review and Ship the Package** (uses: hr-offer-letter)

Present the offer letter and ask whether to ship the hiring-loop package or refine
the offer letter. If the user wants changes, gather feedback and re-run Step 8
with that feedback plus the comp band, looping up to 2 times. When approved,
assemble the package with these sections: Comp Band, Job Description, Screening
Rubric, Interview Kit, Offer Letter Template.

- Input: offer letter from Step 8, all prior artifacts, user decision
- Output: hire-loop package (assembled)
- Key focus: assemble the five-section package only after the user ships
