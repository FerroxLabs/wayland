---
name: wayland-voice-bootstrap
description: >-
  Bootstrap a writing voice profile using the Ghostwrite Yourself interview: 22
  questions across six voice dimensions, synthesized into a profile, saved to
  voice-notes.md, and validated on a sample post.

  Use when the user wants a structured multi-step process to capture their
  writing voice into a reusable profile other content workflows can apply.

  Do NOT use for a one-off rewrite or a quick tone tweak; this is the setup step
  that produces the voice profile other workflows depend on.
license: Apache-2.0
type: workflow
skills: "content-voice-profile content-thought-leadership-post"
metadata:
  author: wayland
  version: 1.0.0
  tags: content voice writing onboarding step-by-step profile
  category: marketing
  depends: "content-voice-profile content-thought-leadership-post"
---
# Voice Profile Bootstrap

**Estimated time:** 30-45 minutes

This workflow captures the author's writing voice into a reusable profile using
the Ghostwrite Yourself method: 22 questions across six voice dimensions. It
reads an initial hypothesis from reference material, runs the interview,
synthesizes the profile, and validates it on a sample post before saving to
voice-notes.md. Review gates sit after the interview, after synthesis, and after
the sample.

Voice profiles built from the interview alone land around 60% accurate. With
three or more existing posts or transcripts as reference, they reach 85% or
better. Push for reference material early.

By the end you will have: a synthesized voice profile (rules, signature phrases,
anti-patterns, tonal matrix), the interview responses, and a calibration sample,
assembled into voice-notes.md.

## When to Use

- User wants to capture their writing voice into a reusable profile
- User wants the profile other content workflows will apply
- User wants the voice validated on a real sample before saving

## Workflow Steps

**Step 1: Gather Reference Material** (uses: content-voice-profile)

Ask the user what they publish (newsletters, threads, blog, podcasts) and
roughly how much existing material exists to reference. Encourage them to share
even a paragraph or, better, three or more existing posts or transcripts, since
reference material raises accuracy from about 60% to 85% or more.

- Input: description of what the user publishes, existing material
- Output: summary of available reference material
- Key focus: secure reference material to lift accuracy

**Step 2: Read an Initial Voice Hypothesis** (uses: content-voice-profile)

From the reference material, produce an initial voice-style read as a starting
hypothesis. State it with your reasoning, and make clear the 22-question
interview will refine it.

- Input: reference material summary
- Output: initial voice-style assessment with reasoning
- Key focus: a starting hypothesis, not the final profile

**Step 3: Run the 22-Question Interview** (uses: content-voice-profile)

Run the Ghostwrite Yourself interview: 22 questions across the six voice
dimensions, starting from the initial assessment. Capture the responses. Show
them, then ask whether to revisit any question or proceed to synthesis. If the
user wants to revisit, re-ask the named questions against their feedback, up to
two iterations.

- Input: initial voice assessment
- Output: captured interview responses
- Key focus: complete, honest answers across all six dimensions

**Step 4: Synthesize the Voice Profile** (uses: content-voice-profile)

Synthesize the profile from the interview responses and the initial assessment:
voice rules, signature phrases, anti-patterns to avoid, and a tonal calibration
matrix. Show it, then ask whether to test on a sample post or refine the
profile. If the user wants changes, revise against their feedback and show it
again, up to three iterations.

- Input: interview responses, initial assessment
- Output: synthesized voice profile
- Key focus: rules, signature phrases, anti-patterns, tonal matrix

**Step 5: Test on a Sample Post** (uses: content-thought-leadership-post)

Write a sample thought-leadership post using the synthesized voice profile, as a
calibration test. Show it and ask the user to read it: does it sound like them?
If yes, ship the profile. If not, ask what is off and refine the profile against
that failure, then re-test, up to three iterations.

- Input: synthesized voice profile
- Output: calibration sample post
- Key focus: a real sample that proves the voice reads true

**Step 6: Save voice-notes.md** (uses: content-voice-profile)

Assemble the deliverable: the voice profile, the interview responses for
reference, and the calibration sample, and save it as voice-notes.md so other
content workflows can apply it.

- Input: voice profile, interview responses, sample post
- Output: assembled voice-notes.md
- Key focus: a saved, reusable profile other workflows can load
