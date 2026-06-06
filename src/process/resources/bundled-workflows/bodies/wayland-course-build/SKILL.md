---
name: wayland-course-build
description: >-
  Build a complete course from scratch: outline, per-module slide decks, and a
  workbook, with the student profile and price tier inferred up front.

  Use when the user wants a structured multi-step process to produce a full
  course package (curriculum, decks, workbook) from a single transformation
  statement.

  Do NOT use for a single lesson, a one-off slide, or a quick outline that one
  content skill can produce without the full course build.
license: Apache-2.0
type: workflow
skills: "sales-icp funnels-offer-pricing content-course-outline content-slide-deck content-leadmagnet-ebook"
metadata:
  author: wayland
  version: 1.0.0
  tags: education content course curriculum step-by-step planning
  category: education
  depends: "sales-icp funnels-offer-pricing content-course-outline content-slide-deck content-leadmagnet-ebook"
---
# Complete Course Builder

**Estimated time:** 60-90 minutes

This workflow builds a full course package from a single transformation
statement. It infers the student profile and a price tier, drafts the
curriculum outline, builds Marp slide decks per module, and produces a workbook
of exercises and reflection prompts. Review gates sit at the outline, the decks,
and the workbook.

By the end you will have: a confirmed transformation, student profile, and
pricing tier, a curriculum outline, per-module decks, and a workbook, assembled
into one course package.

## When to Use

- User wants to build a complete course from a transformation statement
- User wants curriculum, decks, and a workbook as one package
- User wants the student profile and price tier reasoned out first

## Workflow Steps

**Step 1: Define the Transformation** (uses: content-course-outline)

Ask the user for the course transformation in one sentence: "By the end, the
student can ___." Do not proceed without a clear end-state, since it anchors the
outline, decks, and workbook.

- Input: user's one-sentence transformation
- Output: confirmed course transformation
- Key focus: a single, concrete end-state for the student

**Step 2: Infer the Student Profile** (uses: sales-icp)

From the transformation, infer the student profile: who this course is for and
where they start. State the profile and your reasoning, then let the user
correct it.

- Input: course transformation
- Output: student profile with reasoning
- Key focus: a concrete starting student, validated by the user

**Step 3: Recommend a Price Tier** (uses: funnels-offer-pricing)

From the transformation depth and the audience's capacity, recommend a price
tier. State the tier and your reasoning, then ask the user to confirm or pick a
different one.

- Input: transformation, student profile
- Output: recommended price tier with reasoning
- Key focus: a defensible tier the user confirms

**Step 4: Build the Curriculum Outline** (uses: content-course-outline)

Build the course outline from the transformation, audience, and pricing:
modules, learning objectives, and a hook/promise/proof structure per module.
Show it, then ask whether to refine or proceed to module decks. If the user
wants changes, revise the outline against their feedback and show it again, up
to three iterations.

- Input: transformation, student profile, pricing
- Output: approved curriculum outline
- Key focus: modules with objectives and hook/promise/proof

**Step 5: Build the Module Decks** (uses: content-slide-deck)

From the approved outline, build a slide deck per module as Marp markdown,
applying the voice profile at ~/wayland/voice-notes.md. Show the decks, then ask
whether to refine specific decks or proceed to the workbook. If the user wants
changes, revise the named decks against their feedback and show them again, up
to three iterations.

- Input: course outline, voice profile at ~/wayland/voice-notes.md
- Output: per-module Marp decks
- Key focus: one coherent deck per module, in the author's voice

**Step 6: Build the Workbook** (uses: content-leadmagnet-ebook)

From the outline and decks, build a course workbook: exercises, reflection
prompts, and action steps per module. Show it, then ask whether to assemble the
package or refine the workbook. If the user wants changes, revise against their
feedback and show it again, up to three iterations.

- Input: course outline, module decks
- Output: course workbook
- Key focus: exercises and action steps tied to each module

**Step 7: Assemble the Course Package** (uses: content-course-outline)

Assemble the final package: the transformation, student, and pricing at the top,
then the curriculum outline, the module decks, and the workbook. Hand the user
one complete course package.

- Input: transformation, student profile, pricing, outline, decks, workbook
- Output: complete course package
- Key focus: one assembled, ready-to-deliver course
