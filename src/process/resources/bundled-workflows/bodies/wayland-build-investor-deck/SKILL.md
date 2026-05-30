---
name: wayland-build-investor-deck
description: >-
  Build an investor pitch deck end to end: from the narrative story arc through
  slide-level briefs, full slide content, narrative tightening, and speaker
  notes. The agent infers the story arc that makes the round credible to the
  investor archetype, drafts each slide's argument and proof, then tightens the
  narrative and produces what to say beyond the slide.

  Use when the user wants a structured multi-step process to produce a complete
  investor deck (story arc through speaker notes) for a fundraising round.

  Do NOT use for a single-slide tweak, a one-off copy edit, or a question one
  atomic pitch skill can answer.
license: Apache-2.0
type: workflow
skills: "pitch-deck"
metadata:
  author: wayland
  version: 1.0.0
  tags: pitch fundraising deck investor narrative step-by-step planning
  category: marketing
  depends: "pitch-deck"
---
# Build an Investor Deck

**Estimated time:** 60-90 minutes

This workflow builds an investor pitch deck from the ground up. It runs long, so
state is saved between steps. The arc is: gather the brief, infer the right
story arc for the investor archetype, draft slide-level briefs (what each slide
is FOR), expand to full slide content, tighten the narrative, then write speaker
notes. Review checkpoints let the user refine briefs, slides, and notes before
shipping.

The driving skill for every generative step is `pitch-deck`, invoked in a
different mode at each stage.

## Steps

**Step 1: Kickoff and Brief** (uses: pitch-deck)

Open the workflow and gather the brief. Ask the user for: the company, the round
and target size, the investor archetype, current revenue/traction, and any
existing deck to build on. Tell the user this takes about 60-90 minutes and that
state is saved as you go. Do not proceed until you have enough to characterize
the company and the round.

- Input: user-provided company, round + size, investor archetype, revenue/traction, existing deck
- Output: a captured brief block describing the company and the round
- Key focus: get a concrete, specific brief before any generation

**Step 2: Infer the Story Arc** (uses: pitch-deck)

Using the brief, infer the recommended story arc: the narrative shape that makes
this round credible to this specific investor archetype. Present the inferred
arc and the reasoning behind it, then let the user confirm or override before
building on it.

- Input: the brief from Step 1
- Output: a recommended story arc with reasoning, confirmed or overridden by the user
- Key focus: the arc must be tailored to the investor archetype, not generic

**Step 3: Build Slide-Level Briefs** (uses: pitch-deck)

Run `pitch-deck` in slide-level-briefs mode against the brief and the confirmed
arc. For each slide, state what the slide is FOR, the argument it carries, and
the proof it presents. Show the full set of briefs to the user.

- Input: the brief from Step 1, the story arc from Step 2
- Output: slide-level briefs (purpose, argument, proof per slide)
- Key focus: every slide must carry one clear argument backed by proof

**Step 4: Review and Refine Slide Briefs** (uses: pitch-deck)

Present the slide briefs and ask the user to either proceed to full slide
content or refine the briefs. If they refine, take their feedback and re-run the
brief-building step with the prior briefs plus the feedback and the arc, then
present again. Allow up to three refinement passes before moving on.

- Input: slide briefs from Step 3, user refinement feedback, the story arc
- Output: approved (possibly revised) slide briefs
- Key focus: lock the structure before writing full content

**Step 5: Build Full Slide Content** (uses: pitch-deck)

Run `pitch-deck` in full-slide-content mode using the approved slide briefs and
the original brief. Produce the actual content for each slide: headlines, body,
data callouts, and visual cues. Show the full content to the user.

- Input: approved slide briefs from Step 4, the brief from Step 1
- Output: full slide content for every slide
- Key focus: faithful to each slide's brief; concrete numbers, not placeholders

**Step 6: Review and Refine Slides** (uses: pitch-deck)

Present the full slide content and ask the user to proceed to narrative
tightening or refine specific slides. If they refine, re-run the slide-content
step with the prior slides plus feedback and the slide briefs, then present
again. Allow up to three refinement passes.

- Input: full slide content from Step 5, user feedback, slide briefs
- Output: approved (possibly revised) slide content
- Key focus: fix the specific slides the user flags without breaking the arc

**Step 7: Tighten the Narrative** (uses: pitch-deck)

Run `pitch-deck` in narrative-tightening mode over the approved slides. Cut
redundancy, sharpen transitions slide-to-slide, and make the through-line
unmistakable so the deck reads as one argument, not a pile of slides.

- Input: approved slide content from Step 6
- Output: a tightened version of the slides
- Key focus: one continuous argument; remove anything that does not advance it

**Step 8: Write Speaker Notes** (uses: pitch-deck)

Run `pitch-deck` in speaker-notes mode over the tightened slides. For each
slide, write what to say beyond what is on the slide: the framing, the emphasis,
and the answer to the obvious objection. Show the notes to the user.

- Input: tightened slides from Step 7
- Output: speaker notes per slide
- Key focus: what the presenter says, not a restatement of the slide

**Step 9: Final Review and Ship** (uses: pitch-deck)

Present the speaker notes and the assembled deck package (story arc, slide
briefs, tightened slides, speaker notes). Ask the user to ship or refine the
speaker notes. If they refine, re-run the speaker-notes step with the prior
notes plus feedback and the tightened slides, then present again (up to two
passes). On ship, assemble and output the final deck package.

- Input: speaker notes from Step 8, tightened slides, user decision
- Output: the final deck package (arc, briefs, tightened slides, speaker notes)
- Key focus: deliver a complete, coherent deck the user can present

## Expected Outcome

A complete investor deck: a confirmed story arc, slide-level briefs, tightened
full slide content, and per-slide speaker notes, assembled into one deck
package ready to present.
