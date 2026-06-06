---
name: wayland-case-study-build
description: >-
  Build a customer case study end to end: capture the brief, infer the
  narrative arc, draft the story, humanize it to the author's voice, then
  repurpose it into email, LinkedIn, and X-thread derivatives.

  Use when the user wants a structured multi-step process to turn a customer
  story or call transcript into a polished case study with derivatives.

  Do NOT use for a quick testimonial blurb or a single edit that one content
  skill can produce without the full build-and-repurpose chain.
license: Apache-2.0
type: workflow
skills: "content-case-study content-humanize content-repurpose"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing content case-study repurpose step-by-step proof
  category: marketing
  depends: "content-case-study content-humanize content-repurpose"
---
# Customer Case Study Builder

**Estimated time:** 20-30 minutes

This workflow turns a customer story into a proof-anchored case study and three
platform derivatives. It captures the brief, infers a narrative arc, drafts the
story, humanizes it to the author's voice, and fans it out to email, LinkedIn,
and an X-thread. Review gates sit at the draft and the final bundle.

The strongest case studies carry a number, a timeframe, and a specific "before"
state. Push for all three early; without them the proof feels fuzzy.

By the end you will have: a confirmed brief, a narrative arc, a humanized
long-form case study, and three voice-aligned derivatives.

## When to Use

- User wants to turn a customer result into a case study
- User has a call transcript or notes and wants a structured story
- User wants case-study derivatives for email and social

## Workflow Steps

**Step 1: Capture the Customer Brief** (uses: content-case-study)

Ask the user for the customer name (or "anonymous customer"), what they achieved
as a specific result with numbers, and how long it took. Invite them to paste
any call transcript or notes. Press for a number, a timeframe, and a concrete
"before" state, since those three anchor the proof.

- Input: customer name, result with numbers, timeframe, optional transcript
- Output: confirmed customer brief
- Key focus: number plus timeframe plus a specific before state

**Step 2: Infer the Narrative Arc** (uses: content-case-study)

From the brief, infer the narrative arc following Problem, Misadventures,
Mechanism, Transformation. State the inferred arc and your reasoning, then let
the user adjust it if the real story has a different shape.

- Input: customer brief from Step 1
- Output: narrative arc with reasoning
- Key focus: a story shape the user confirms

**Step 3: Draft the Case Study** (uses: content-case-study)

Write the long-form case study from the brief along the confirmed arc: story to
mechanism to result, with the proof anchored in the numbers. Show the draft,
then ask whether to refine it or proceed to humanize and repurpose. If the user
wants changes, revise against their feedback and show it again, up to three
iterations.

- Input: customer brief, narrative arc
- Output: approved long-form case study draft
- Key focus: story to mechanism to result, proof in numbers

**Step 4: Humanize the Draft** (uses: content-humanize)

Run the draft through a humanize pass: apply the voice profile from
~/wayland/voice-notes.md and strip AI tells so the case study reads in the
author's voice.

- Input: case study draft, voice profile at ~/wayland/voice-notes.md
- Output: humanized long-form case study
- Key focus: author voice, no AI tells

**Step 5: Build Derivatives** (uses: content-repurpose)

From the humanized case study, generate case-study derivatives for email,
LinkedIn, and an X-thread, each shaped for its platform. Show all three, then
ask whether to ship the bundle or refine the derivatives; if they need work,
revise against the user's feedback, up to two iterations.

- Input: humanized case study
- Output: email, LinkedIn, and X-thread derivatives
- Key focus: platform-native shapes carrying the same proof

**Step 6: Assemble the Case Study Bundle** (uses: content-repurpose)

Assemble the final deliverable: the narrative arc and source brief, the
long-form case study, and the three derivatives. Hand the user one complete
bundle.

- Input: arc, brief, humanized case study, derivatives
- Output: complete case study bundle
- Key focus: one assembled, ready-to-ship document
