---
name: wayland-close-rebuild
description: >-
  Diagnose a weak sales close and rebuild it as a full Cascade Close (Stack to
  Vision to Math to Safety Net to Door, plus P.S. and P.P.S.).

  Use when the user has an existing close that under-converts and wants it
  diagnosed and rebuilt against the Three Locks and every buyer type.

  Do NOT use when the user needs a whole sales letter (use
  wayland-full-sales-asset) or only a headline (use wayland-headline-lab).
license: Apache-2.0
type: workflow
skills: "convert-temperature convert-audit convert-close"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting close cascade-close step-by-step
  category: marketing
  depends: "convert-temperature convert-audit convert-close"
---

Interactive rebuild of a sales close. The Cascade Close converts every buyer type
because it sequences proof against the Three Locks: Stack hits Want, Vision and
Math hit Trust, Safety Net hits Excuse. Skip a beat and you lose that buyer type.
Diagnose the existing close, then rebuild it as a full Stack to Vision to Math to
Safety Net to Door sequence with P.S. and P.P.S. Review with the user at each
beat.

**Step 1: Gather the existing close** (uses: convert-close)

Ask the user to paste the existing close: the section running from "and that's
why I created..." through the buy buttons and P.S. If they do not have one yet,
ask for the offer brief instead and plan to write the close from scratch. Capture
exactly what they provide; do not invent a close.

- Input: user-supplied existing close, or offer brief if no close exists
- Output: the existing close text (or offer brief) captured for diagnosis
- Key focus: get the real close text before diagnosing anything

**Step 2: Infer the buyer-type mix** (uses: convert-temperature)

From the close text, infer which buyer types this close must convert across the
five: Logical, Emotional, Skeptical, Aspirational, Hesitant. State the inferred
mix and the reasoning. The Cascade Close addresses all five, but the emphasis
shifts with the mix. Show the inference and let the user confirm or override.

- Input: the existing close from Step 1
- Output: the inferred buyer-type mix with reasoning, confirmed by the user
- Key focus: name the buyer mix so the rebuild can weight the right beats

**Step 3: Diagnose the close against the Cascade beats** (uses: convert-audit)

Audit the existing close in close-diagnosis mode against the buyer mix. Identify
which Cascade beats (Stack, Vision, Math, Safety Net, Door, P.S., P.P.S.) are
missing and which are weak, mapping each gap to the Lock and buyer type it fails.
Show the diagnosis to the user.

- Input: existing close, buyer-type mix
- Output: a beat-by-beat diagnosis flagging missing and weak Cascade beats
- Key focus: pinpoint the missing and weak beats before rebuilding

**Step 4: Review the diagnosis** (uses: convert-audit)

Present the diagnosis and ask the user whether to proceed to the rebuild or drill
into a specific weak beat first. If they want to drill in, refine the diagnosis on
that beat (up to two passes) using their feedback, then re-present. Once they are
satisfied, proceed to the rebuild.

- Input: the diagnosis from Step 3, user decision and any drill-in feedback
- Output: a confirmed, possibly refined diagnosis the rebuild will act on
- Key focus: let the user steer which weaknesses matter most before rebuilding

**Step 5: Rebuild as a full Cascade Close** (uses: convert-close)

Rebuild the close as a complete Cascade Close: Stack to Vision to Math to Safety
Net to Door, plus P.S. and P.P.S. Address every buyer type, weighting the beats
per the buyer mix and closing the gaps the diagnosis surfaced. Show the rebuilt
close.

- Input: existing close, diagnosis, buyer-type mix
- Output: a rebuilt Cascade Close covering all seven beats and every buyer type
- Key focus: rebuild the full sequence, close the diagnosed gaps

**Step 6: Review and refine the rebuild** (uses: convert-close)

Present the rebuilt close and confirm every buyer type is addressed across the
full sequence. Ask the user to ship it or request another pass. If they want
changes, refine the rebuild from their feedback (up to three passes), re-presenting
each time, until they ship.

- Input: the rebuilt close, original close, diagnosis, user refinement feedback
- Output: the final shipped Cascade Close plus a close-rebuild document capturing original, diagnosis, and rebuild
- Key focus: iterate to a close the user approves, then assemble the rebuild document
