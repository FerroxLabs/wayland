---
name: wayland-prep-due-diligence
description: >-
  Build a due-diligence readiness pack for a fundraising round: anticipated DD
  question set, a recommended data-room folder structure, per-question response
  drafts, and a readiness checklist showing what is done versus what still needs
  gathering. The agent infers the question set for the stage and investor
  archetype, then structures, drafts, and checklists the responses.

  Use when the user wants a structured multi-step process to prepare for investor
  due diligence and assemble a data-room-ready pack.

  Do NOT use for a single DD question, a one-off document request, or a question
  one atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "pitch-dd-prep"
metadata:
  author: wayland
  version: 1.0.0
  tags: pitch fundraising due-diligence data-room investor step-by-step planning
  category: marketing
  depends: "pitch-dd-prep"
---
# Prep for Due Diligence

**Estimated time:** 30-45 minutes

This workflow builds a due-diligence readiness pack. The arc is: gather the DD
brief, infer the anticipated question set for the stage and investor archetype,
build a recommended data-room folder structure, draft per-question responses,
then produce a readiness checklist (done vs needs-gathering). Review checkpoints
let the user refine the structure and the checklist before shipping.

Every generative step is driven by `pitch-dd-prep`, invoked in a different mode
at each stage.

## Steps

**Step 1: Kickoff and DD Brief** (uses: pitch-dd-prep)

Open the workflow and gather the brief. Ask the user for: the round size and
stage, the investor archetype, what they have already sent (deck? data room?),
and anything the investor has specifically asked for. Do not proceed until you
understand the stage, the archetype, and what is already in the investor's
hands.

- Input: user-provided round size + stage, investor archetype, what was already sent, specific asks
- Output: a captured DD brief block
- Key focus: know what the investor already has and what they explicitly requested

**Step 2: Infer the Question Set** (uses: pitch-dd-prep)

From the brief, infer the anticipated DD question set for this stage and
investor archetype: the questions this kind of investor predictably asks at this
stage. Present the inferred question set with reasoning.

- Input: the DD brief from Step 1
- Output: the anticipated DD question set with reasoning
- Key focus: questions specific to the stage and archetype, not a generic list

**Step 3: Build Data-Room Structure** (uses: pitch-dd-prep)

Run `pitch-dd-prep` in data-room-structure mode using the question set and the
brief. Produce a recommended folder structure for the data room, organized so
each anticipated question maps to where its supporting documents live. Show the
structure.

- Input: the question set from Step 2, the DD brief from Step 1
- Output: a recommended data-room folder structure
- Key focus: every anticipated question has a clear home in the structure

**Step 4: Review and Refine Structure** (uses: pitch-dd-prep)

Present the data-room structure and ask the user to proceed to per-question
response drafts or refine the structure. If they refine, re-run the
structure-building step with the prior structure plus feedback and the question
set, then present again. Allow up to two refinement passes.

- Input: the folder structure from Step 3, user feedback, the question set
- Output: approved (possibly revised) data-room structure
- Key focus: lock the structure before drafting responses into it

**Step 5: Draft Per-Question Responses** (uses: pitch-dd-prep)

Run `pitch-dd-prep` in response-drafts mode using the question set and the
approved structure. Draft a response for each anticipated question, slotted into
the right place in the data-room structure. Show the drafts.

- Input: the question set from Step 2, the approved structure from Step 4
- Output: per-question response drafts
- Key focus: a concrete draft per question, filed where it belongs

**Step 6: Build Readiness Checklist** (uses: pitch-dd-prep)

Run `pitch-dd-prep` in readiness-checklist mode using the response drafts and
the structure. Produce a checklist showing, per item, what is done versus what
still needs gathering (documents to pull, numbers to confirm, sign-offs to get).
Show the checklist.

- Input: the response drafts from Step 5, the data-room structure
- Output: a readiness checklist (done vs needs-gathering)
- Key focus: make the remaining work explicit and actionable

**Step 7: Final Review and Ship** (uses: pitch-dd-prep)

Present the readiness checklist and ask the user to ship the DD pack or refine
the checklist. If they refine, re-run the checklist step with the prior
checklist plus feedback and the response drafts, then present again (up to two
passes). On ship, assemble the DD readiness pack (brief, anticipated questions,
data-room structure, response drafts, readiness checklist) and output it.

- Input: the readiness checklist from Step 6, user decision
- Output: the assembled DD readiness pack
- Key focus: deliver a data-room-ready pack with a clear remaining-work list

## Expected Outcome

A complete DD readiness pack: the DD brief, an anticipated question set, a
recommended data-room folder structure, per-question response drafts, and a
readiness checklist of what is done versus what still needs gathering.
