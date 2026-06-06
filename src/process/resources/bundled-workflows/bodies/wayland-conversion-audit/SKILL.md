---
name: wayland-conversion-audit
description: >-
  Score existing copy 0-100 against The Donahoe Method, prioritize the rewrites,
  and present a revised draft.

  Use when the user has a piece of sales or marketing copy and wants a scored
  diagnosis plus a Method-aligned, Filter-cleaned revision.

  Do NOT use when the user wants to write copy from scratch (use
  wayland-full-sales-asset) or only a quick weak-line cleanup (use
  wayland-bullshit-clean).
license: Apache-2.0
type: workflow
skills: "convert-four-questions convert-temperature convert-audit convert-bullshit-filter convert-voice"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing conversion copywriting audit donahoe-method step-by-step
  category: marketing
  depends: "convert-four-questions convert-temperature convert-audit convert-bullshit-filter convert-voice"
---

Interactive audit of existing copy against The Donahoe Method. Score it 0-100,
run the Bullshit Filter, prioritize the rewrites, and produce a revised draft.
Audits done on snippets miss the Three Locks gating because the locks are
sequential: break Want at the top and the rest is moot. Always work from the full
piece, not excerpts.

**Step 1: Gather the full copy** (uses: convert-audit)

Ask the user to paste the copy to audit, or the path to the file. If it is a
long-form sales letter, get the whole thing, not an excerpt. Capture the full
source copy before doing any scoring.

- Input: user-pasted copy or a file path to the copy
- Output: the full source copy captured for audit
- Key focus: work from the complete piece so the sequential locks can be judged

**Step 2: Infer the target action** (uses: convert-four-questions)

From the copy, infer the target action it is driving toward (opt-in, purchase,
booking, reply, etc.). State the inferred action and the reasoning, then ask the
user to confirm or override it.

- Input: the full source copy
- Output: the confirmed target action with reasoning
- Key focus: lock the conversion goal the rest of the audit measures against

**Step 3: Infer the audience temperature** (uses: convert-temperature)

Infer the audience temperature (cold, warm, hot) from the copy and the target
action. State the temperature, the reasoning, and the Method implication for how
the copy should be calibrated. Let the user confirm or correct it.

- Input: the source copy and the target action
- Output: the confirmed audience temperature with its Method implication
- Key focus: set temperature so the score reflects the right calibration

**Step 4: Score against The Donahoe Method** (uses: convert-audit)

Score the copy 0-100 against The Donahoe Method, judged against the target action
and temperature. Break the score down by the Method's dimensions (Four Questions,
Three Locks, structure, proof, close) and flag the lowest-scoring sections. Show
the score and breakdown.

- Input: source copy, target action, temperature
- Output: a 0-100 Method score with a per-dimension breakdown and flagged weak sections
- Key focus: a concrete, prioritizable score, not a vibe check

**Step 5: Run the Bullshit Filter** (uses: convert-bullshit-filter)

Run the Bullshit Filter across the full copy. Flag every vague, hype-laden,
unsupported, or method-weak line, ranked worst-first. Show the filter results
alongside the score.

- Input: the full source copy
- Output: ranked list of weak lines with reasons
- Key focus: surface the specific lines dragging the score down

**Step 6: Review the diagnosis** (uses: convert-audit)

Present the score and Filter results together and ask the user whether to proceed
to the revised draft or drill into a specific weakness first. If they drill in,
refine the score and diagnosis on that area (up to two passes) from their feedback,
then re-present. Once satisfied, proceed to the revision.

- Input: the score, the filter results, the user decision and any drill-in feedback
- Output: a confirmed diagnosis the revision will act on
- Key focus: let the user direct which weaknesses the revision prioritizes

**Step 7: Produce the revised draft** (uses: convert-voice)

Rewrite the copy in the author's voice, applying the audit findings and the Filter
results, calibrated to the target action and temperature. Fix the prioritized
weaknesses while preserving what already works. Show the revised draft.

- Input: source copy, Method score, filter results, target action, temperature
- Output: a Method-aligned, Filter-cleaned, voice-checked revised draft
- Key focus: turn the diagnosis into a concrete improved draft

**Step 8: Final review and iterate** (uses: convert-voice)

Present the revised draft and ask the user to ship it or request another pass
naming what to push harder on. If they want another pass, refine the revision from
their feedback (up to three passes), re-presenting each time, until they ship.
Then assemble the audit document: target action, temperature, Method score, Filter
results, and revised draft.

- Input: the revised draft, source copy, score, user refinement feedback
- Output: the final approved revision plus the assembled audit document
- Key focus: iterate to an approved revision, then package the full audit
