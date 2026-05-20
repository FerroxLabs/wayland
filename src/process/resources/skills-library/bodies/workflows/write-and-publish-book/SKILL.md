---
name: write-and-publish-book
description: >-
  End-to-end guided journey from initial concept through novel planning,
  character development, outlining, developmental editing, line editing,
  publishing, and marketing. Covers both fiction and nonfiction paths with
  decision gates for self-publishing versus traditional publishing.

  Use when the user wants to write and publish book or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "novel-architect character-architect book-outliner developmental-editor line-editor self-publishing-guide book-marketing"
trigger_phrases: >-
  I want to write a book help me publish a novel guide me through writing a book
  how do I self-publish book writing process write and publish I have a book
  idea
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: writing content-marketing creative-writing step-by-step planning
  category: content-creation
  depends: "novel-architect character-architect book-outliner developmental-editor line-editor self-publishing-guide book-marketing"
---
# Write And Publish Book

**Estimated time:** 3-6 months

This workflow guides you through the complete process of writing and publishing
a book, from the initial spark of an idea to a finished, marketed product on
store shelves or digital platforms. It chains together seven specialized skills
that cover novel architecture, character design, outlining, structural editing,
prose-level editing, publishing mechanics, and marketing strategy.

Whether you are writing literary fiction, genre fiction, or narrative nonfiction,
this workflow adapts to your path. A decision gate after the editing phase lets
you choose between self-publishing and traditional publishing, adjusting the
remaining steps accordingly.

By the end of this workflow you will have: a fully planned novel structure,
developed characters, a detailed outline, a structurally sound manuscript,
polished prose, a publishing plan, and a marketing strategy.

## When to Use

- User wants to write and publish book
- User needs a structured, step-by-step process for write and publish book
- User wants to write a book
- User wants to publish a novel
- guide me through writing a book
- Do NOT use when: the request is outside the scope of write and publish book or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A book idea (even a vague concept is fine -- Step 1 will refine it)
- Dedicated writing time (at least 5-10 hours per week recommended)
- Willingness to revise and iterate on your manuscript
- A completed or in-progress first draft is helpful but not required

## Steps

**Step 1: Architect Your Novel** (uses: novel-architect)

transform the raw book idea into a structured
novel plan.

- Input: book idea, genre preferences, and target audience, Any prior writing experience or previous attempts at this project, Desired word count range and timeline
- Output: Complete novel architecture including structure, POV, tense, and pacing strategy, Genre, subgenre, target reader, and market positioning, 3-5 comparable titles with differentiation notes
- Key focus: Defining the genre, subgenre, and target reader profile

**Step 2: Design Your Characters** (uses: character-architect)

build deep, compelling characters that
serve the story structure established in Step 1.

- Input: `novel-plan` from Step 1 (story structure informs character needs), `genre-profile` from Step 1 (genre conventions shape character expectations)
- Output: Detailed profiles for all major characters, Arc trajectories mapped against the story structure, Character relationship dynamics and evolution
- Key focus: Creating character bibles for all major characters (protagonist, antagonist,

**Step 3: Build Your Outline** (uses: book-outliner)

create a detailed, scene-by-scene outline that
integrates the novel architecture and character arcs.

- Input: `novel-plan` from Step 1 (structure and pacing targets), `character-arcs` from Step 2 (character trajectories to weave into scenes), `genre-profile` from Step 1 (genre pacing expectations)
- Output: Chapter-by-chapter, scene-by-scene outline, Subplot threads with integration and resolution points, Tension curve mapped across chapters with key beat placements
- Key focus: Selecting the right outlining methodology for the writer's style (progressive

**Step 4: Developmental Edit** (uses: developmental-editor)

perform a structural edit of the
manuscript or detailed outline. This step can happen on the outline before
drafting (to catch structural problems early) or on a completed draft.

- Input: `detailed-outline` from Step 3 (or a completed manuscript draft), `character-arcs` from Step 2 (arc fulfillment to verify), `novel-plan` from Step 1 (structural targets to evaluate against)
- Output: Structural assessment covering plot, pacing, and character arcs, Prioritized revision guidance with specific fixes, Scene-by-scene evaluation of purpose and contribution
- Key focus: Detecting plot holes, logic gaps, and unresolved threads

**Step 5: Line Edit** (uses: line-editor)

polish the prose after structural issues have been
resolved.

- Input: `dev-edit-report` from Step 4 (structural issues should be resolved first), `voice-guide` from Step 2 (voice consistency to maintain), The manuscript draft with structural revisions applied
- Output: Prose-level feedback with before/after examples, Consistency guide for spelling, hyphenation, and style choices, Manuscript with line edits applied
- Key focus: Sentence rhythm and variety (avoiding monotonous patterns)

**Step 6: Publish Your Book** (uses: self-publishing-guide)

navigate the publishing process.

- Input: `polished-manuscript` from Step 5 (the final manuscript), `genre-profile` from Step 1 (genre drives pricing and category choices), `comp-titles` from Step 1 (competitor analysis for positioning)
- Output: Platform selection, format specifications, and timeline, Ebook and print formatting requirements and files, Price points for each format with royalty projections
- Key focus: Choosing publishing platforms (KDP, IngramSpark, or both for wide distribution)

**Step 7: Market Your Book** (uses: book-marketing)

create and execute a comprehensive marketing
strategy.

- Input: `genre-profile` from Step 1 (target reader determines marketing channels), `comp-titles` from Step 1 (competitive positioning), `metadata-package` from Step 6 (core messaging to repurpose)
- Output: Comprehensive marketing plan with channel selection, Pre-launch, launch week, and post-launch content calendar, Advance reader copy distribution and review strategy
- Key focus: Building a pre-launch buzz strategy (ARC readers, cover reveals)

## Decision Points

- **After Step 5:** How do you want to publish this book?
  - If **Self-publish**: You control the entire process: cover, formatting, pricing, distribution. Full royalties, full responsibility.
  - If **Traditional publishing**: Skip self-publishing mechanics. Query agents, submit to publishers. The publisher handles cover, formatting, and distribution. Marketing still requires author effort.
  - If **Hybrid publisher**: Varies by publisher. Proceed through both steps and skip elements the publisher covers.

## Failure Handling

- **Skipping Step 2 (Characters):** Weak characters sink even brilliantly plotted novels. Invest in character depth before drafting.
- **Outlining too rigidly or too loosely:** Match the outlining method to your writing style. Pantsers need a lighter framework; plotters need more detail.
- **Line editing before developmental editing:** Do not polish prose that might be cut for structural reasons. Always fix structure first.
- **Rushing to publish:** A book published too early cannot be unpublished. Take the time to edit properly.
- **Treating marketing as optional:** Even traditionally published authors must market. Build your platform before and during writing, not after.

## Expected Outcome

When this workflow is complete, the user will have:

1. A complete, structurally sound, and polished manuscript exists
2. Characters are well-developed with satisfying arcs
3. A publishing path has been chosen and executed
4. Marketing materials and strategy are in place
5. The book is published or submitted to agents/publishers
6. The author has a plan for sustained post-launch visibility

## Output Format

```
WRITE AND PUBLISH BOOK TRACKER
==============================

[ ] Step 1: Architect Your Novel
    Status: [pending/in-progress/complete]
[ ] Step 2: Design Your Characters
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Your Outline
    Status: [pending/in-progress/complete]
[ ] Step 4: Developmental Edit
    Status: [pending/in-progress/complete]
[ ] Step 5: Line Edit
    Status: [pending/in-progress/complete]
[ ] Step 6: Publish Your Book
    Status: [pending/in-progress/complete]
[ ] Step 7: Market Your Book
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Skipping Step 2 (Characters):** Weak characters sink even brilliantly plotted novels. Invest in character depth before drafting.
- **Outlining too rigidly or too loosely:** Match the outlining method to your writing style. Pantsers need a lighter framework; plotters need more detail.
- **Line editing before developmental editing:** Do not polish prose that might be cut for structural reasons. Always fix structure first.
- **Rushing to publish:** A book published too early cannot be unpublished. Take the time to edit properly.

## Example

**Input:** "I want to write and publish book and need a structured plan to follow step by step."

**Output:**

**Step 1 (novel-architect):** Architect Your Novel -- produces concrete deliverables for this phase.

**Step 2 (character-architect):** Design Your Characters -- produces concrete deliverables for this phase.

**Step 3 (book-outliner):** Build Your Outline -- produces concrete deliverables for this phase.

**Step 4 (developmental-editor):** Developmental Edit -- produces concrete deliverables for this phase.

**Step 5 (line-editor):** Line Edit -- produces concrete deliverables for this phase.

**Step 6 (self-publishing-guide):** Publish Your Book -- produces concrete deliverables for this phase.

**Step 7 (book-marketing):** Market Your Book -- produces concrete deliverables for this phase.

**Result:** User has a complete write and publish book plan with all deliverables produced, validated, and ready for implementation.
