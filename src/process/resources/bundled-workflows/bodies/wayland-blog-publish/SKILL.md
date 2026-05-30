---
name: wayland-blog-publish
description: >-
  Voice-locked blog publishing workflow: outline, full draft, humanize pass,
  then repurpose the anchor into an email, a LinkedIn post, and an X-thread.

  Use when the user wants a structured multi-step process to publish a
  long-form blog post with platform derivatives in a consistent voice.

  Do NOT use for a single short post, a one-off edit, or a request a single
  content skill can answer without the full publish-and-repurpose chain.
license: Apache-2.0
type: workflow
skills: "sales-icp content-blog content-humanize content-repurpose"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing content blogging repurpose step-by-step publishing
  category: marketing
  depends: "sales-icp content-blog content-humanize content-repurpose"
---
# Voice-Locked Blog Publishing

**Estimated time:** 30-45 minutes

This workflow takes one sharp angle and turns it into a published long-form blog
post plus three platform derivatives, all locked to the author's voice. It moves
from outline to draft to a humanize pass that strips AI tells, then fans the
finished anchor out to email, LinkedIn, and an X-thread. Review gates sit at the
outline, the draft, and the final bundle so the user steers before anything
ships.

By the end you will have: a confirmed angle and reader profile, a structural
outline, a humanized long-form draft, and three voice-aligned derivatives ready
to publish.

## When to Use

- User wants to publish a long-form blog post with derivatives
- User wants a repeatable outline-to-repurpose publishing process
- User wants platform derivatives that match the blog's voice

## Workflow Steps

**Step 1: Capture the Angle** (uses: content-blog)

Ask the user for the angle in one sentence: the take, contrarian belief, or
lived insight worth publishing. Do not proceed until you have a single, sharp
angle. This is the spine every later step hangs on.

- Input: user's one-sentence angle
- Output: confirmed publishing angle
- Key focus: one sharp, specific take, not a broad topic

**Step 2: Infer the Reader Profile** (uses: sales-icp)

From the angle, infer the ideal reader profile (who this is for and what they
already believe). State the inferred profile and your reasoning, then let the
user correct it. Use the confirmed profile to calibrate tone and proof
throughout the rest of the workflow.

- Input: confirmed angle from Step 1
- Output: reader/audience profile with reasoning
- Key focus: a concrete reader, validated by the user

**Step 3: Build the Outline** (uses: content-blog)

Produce an outline-only pass: the structural beats and the proof points that
support the angle for this audience. Show the outline. Then ask whether to
refine it or proceed to the full draft. If the user wants changes, revise the
outline against their feedback and show it again, up to three iterations, before
moving on.

- Input: angle, audience profile
- Output: approved blog outline with beats and proof points
- Key focus: structure and proof before prose

**Step 4: Write the Full Draft** (uses: content-blog)

Expand the approved outline into a complete long-form draft in the author's
voice, holding the angle and the audience profile throughout.

- Input: approved outline, angle, audience profile
- Output: full long-form blog draft
- Key focus: a complete draft that delivers on the outline

**Step 5: Humanize the Draft** (uses: content-humanize)

Run the draft through a humanize pass: apply the voice profile from
~/wayland/voice-notes.md and strip AI tells. Show the humanized draft, then ask
whether to refine or proceed to the repurpose chain. If the user wants changes,
re-humanize against their feedback and show it again, up to three iterations.

- Input: full draft, voice profile at ~/wayland/voice-notes.md
- Output: voice-locked, humanized anchor draft
- Key focus: sounds like the author, no AI tells

**Step 6: Repurpose to Derivatives** (uses: content-repurpose)

From the humanized anchor, generate three derivatives for email, LinkedIn, and
an X-thread, each voice-aligned and shaped for its platform. Show all three.
Then ask whether to ship the bundle or refine a specific derivative; if a
derivative needs work, revise just that one against the user's feedback, up to
three iterations.

- Input: humanized anchor, angle, audience profile
- Output: email, LinkedIn post, and X-thread derivatives
- Key focus: platform-native shapes, one consistent voice

**Step 7: Assemble the Publishing Bundle** (uses: content-repurpose)

Assemble the final deliverable: the angle and audience at the top, then the
outline, the long-form anchor, and the email, LinkedIn, and X-thread sections.
Hand the user a single ready-to-publish bundle.

- Input: angle, audience, outline, humanized anchor, derivatives
- Output: complete publishing bundle (anchor plus three derivatives)
- Key focus: one assembled, ready-to-ship document
