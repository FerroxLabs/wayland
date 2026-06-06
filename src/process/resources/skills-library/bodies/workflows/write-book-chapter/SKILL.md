---
name: write-book-chapter
description: |
  Guides the user through writing a complete book chapter from initial brief
  and outline through long-form drafting, structural editing, style compliance,
  proofreading, and final copy editing. Use when the user needs to write a book
  chapter as part of a larger manuscript, wants a structured multi-pass writing
  and editing pipeline, or needs to produce publication-quality long-form content.
  Do NOT use for short-form content like blog posts (use publish-blog-post), for
  standalone long-form articles (use long-form-article), or for editing an
  already-complete chapter (use structural-editing or copy-editing directly).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing editing creative-writing step-by-step planning"
  category: "content-creation"
  depends: "content-brief long-form-article structural-editing style-guide-compliance proofreading copy-editing"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Write a Book Chapter

A six-step workflow that produces a publication-quality book chapter through a systematic pipeline of briefing, drafting, structural editing, style compliance, proofreading, and copy editing. Each editing pass targets a different layer of quality, preventing the common pitfall of trying to fix everything in a single revision.

**Estimated time:** 1-3 weeks (depending on chapter length, research requirements, and revision cycles)

## When to Use

- User is writing a book and needs to produce a complete chapter
- User has a book outline and wants to turn a chapter entry into a finished manuscript section
- User wants a multi-pass editing pipeline that separates structural, stylistic, and mechanical concerns
- User is self-publishing or submitting to a traditional publisher and needs professional-quality output
- Do NOT use when: the user only needs to write a standalone article (use long-form-article), only needs editing help on an existing chapter (use structural-editing or copy-editing directly), or is writing a short piece under 3,000 words (use blog-post-writing)

## Prerequisites

Before starting this workflow, ensure:

1. **Book outline or manuscript plan:** The user has at least a chapter-level outline showing where this chapter fits in the larger work. A single sentence per chapter is sufficient, but the outline must show the chapter before and after the current one.
2. **Chapter scope:** The user knows the chapter's purpose -- what the reader should know, feel, or be able to do after reading this chapter that they could not before.
3. **Style reference:** For nonfiction, a style guide (Chicago, APA, house style) or at least a description of the target voice. For fiction, existing chapters or a character/voice reference document. If no style reference exists, Step 4 will help establish one.
4. **Research materials:** Any source material, interviews, data, or reference documents needed for the chapter content should be gathered before starting.

## Steps

**Step 1: Chapter Brief and Outline** (uses: content-brief)

Define the chapter's scope, structure, key arguments or plot points, and how it connects to the surrounding chapters. The brief prevents a chapter from drifting off-topic or duplicating content covered elsewhere in the book.

- Input: Book outline showing chapter placement, chapter topic or purpose, any existing notes or research material for this chapter
- Output: A chapter brief containing: the chapter's thesis or narrative arc, 4-8 section headings with 2-3 sentence descriptions of each, the entry state (what the reader knows coming in from the previous chapter), the exit state (what the reader knows leaving for the next chapter), and a word count target (typically 3,000-8,000 words per chapter)
- Key focus: The entry/exit state analysis is critical. A chapter that re-explains concepts from the previous chapter or fails to set up the next chapter breaks the book's flow. Verify that the brief's opening picks up where the prior chapter left off.

**Step 2: Long-Form Draft** (uses: long-form-article)

Write the complete chapter draft following the brief's structure. Long-form writing requires sustained focus and internal consistency that differs from shorter content. The draft should prioritize completeness over polish.

- Input: Chapter brief from Step 1, research materials, and any existing manuscript chapters for voice consistency
- Output: A complete first draft covering all sections from the brief, at or near the target word count, with all key arguments or plot points addressed, supporting evidence or narrative detail for each section, and transitional passages connecting sections
- Key focus: Write through the entire chapter before revising. Flag uncertain sections with inline notes ([CHECK: source needed], [EXPAND: needs example]) rather than stopping to research. Momentum matters more than perfection in the drafting phase.

**Step 3: Structural Editing** (uses: structural-editing)

Evaluate and revise the chapter's organization, argument flow, pacing, and completeness. Structural editing is the most impactful revision pass -- it determines whether the chapter works as a unit of the larger book.

- Input: Complete first draft from Step 2, plus the chapter brief from Step 1 (to verify the draft fulfills the brief's promises)
- Output: A structurally revised draft with sections reordered for logical flow if needed, weak arguments strengthened or removed, pacing adjusted (sections expanded or condensed based on their importance to the chapter thesis), transitions between sections smoothed, and any structural gaps from the brief identified and filled
- Key focus: Compare the draft against the brief's section plan. If the draft deviated significantly from the brief, determine whether the deviation improved or weakened the chapter. Update the brief to match justified deviations. Flag unjustified deviations for revision.

**Step 4: Style Guide Compliance** (uses: style-guide-compliance)

Ensure the chapter matches the book's established voice, tone, terminology, and formatting conventions. Style compliance creates the consistency that makes a multi-chapter book feel like a single cohesive work rather than a collection of separate essays.

- Input: Structurally edited draft from Step 3, the book's style guide or voice reference document, and any previously completed chapters for consistency comparison
- Output: A style-compliant draft with consistent terminology throughout (the same concept is always called the same thing), voice and tone matching established patterns, formatting conventions applied (heading levels, list styles, callout boxes, citation format), and a style note documenting any new conventions established in this chapter that should apply to future chapters
- Key focus: For fiction, verify that character voices remain consistent with their established patterns from prior chapters. For nonfiction, verify that the level of technical detail matches the book's target reader -- a chapter that suddenly becomes more technical or more simplified than its neighbors disrupts the reading experience.

**Step 5: Proofread for Accuracy** (uses: proofreading)

Check factual claims, quotations, data references, and internal consistency. Proofreading at this stage focuses on accuracy and completeness, not mechanical correctness (that comes in Step 6).

- Input: Style-compliant draft from Step 4, source materials and reference documents
- Output: An accuracy-verified draft with all factual claims checked against sources, quotations verified for accuracy, internal references (mentions of other chapters, forward references) verified, numerical data checked for consistency, and a fact-check log listing each verified claim and its source
- Key focus: Pay special attention to forward and backward references within the book. A chapter that says "as we discussed in Chapter 3" must actually reference content that exists in Chapter 3. If the referenced chapter has not been written yet, flag the reference for verification when that chapter is complete.

**Step 6: Copy Edit** (uses: copy-editing)

Perform the final mechanical edit for grammar, spelling, punctuation, sentence structure, and readability. Copy editing is the last pass before the chapter is considered complete.

- Input: Accuracy-verified draft from Step 5
- Output: A publication-ready chapter with all grammar, spelling, and punctuation errors corrected, sentence-level clarity improvements applied, paragraph breaks optimized for readability, consistent punctuation style throughout (serial comma, em-dash vs en-dash, etc.), and a clean manuscript formatted for the target output (print, ebook, or both)
- Key focus: Read the chapter aloud (or use text-to-speech) to catch awkward phrasing that the eye skips over. Copy editing should not change the meaning or structure of any sentence -- only its mechanical correctness and readability. If a sentence needs structural revision at this stage, flag it for the author rather than rewriting it.

## Output Format

```
## Chapter Pipeline: [Chapter Title]

### Chapter Brief
- **Book:** [book title]
- **Chapter Number:** [N] of [total]
- **Chapter Thesis/Arc:** [one-sentence thesis or narrative arc]
- **Entry State:** [what reader knows from previous chapter]
- **Exit State:** [what reader knows leaving for next chapter]
- **Target Word Count:** [number] words
- **Sections Planned:** [count]
  1. [Section heading] -- [2-sentence description]
  2. [Section heading] -- [2-sentence description]
  3. [Section heading] -- [2-sentence description]

### Draft Status
- **Word Count:** [number] (target: [number])
- **Sections Completed:** [count]/[total]
- **Inline Flags:** [count] items flagged for review ([CHECK], [EXPAND])

### Structural Edit
- **Sections Reordered:** [yes/no, details if yes]
- **Sections Expanded:** [list]
- **Sections Condensed:** [list]
- **Gaps Filled:** [count] gaps from brief addressed

### Style Compliance
- **Terminology Standardized:** [count] terms aligned
- **Voice Consistency:** [assessment]
- **New Conventions:** [any new style rules established]

### Fact-Check Log
- **Claims Verified:** [count]
- **Claims Updated:** [count]
- **Claims Removed:** [count]
- **Forward References Flagged:** [count]

### Copy Edit Results
- **Corrections Applied:** [count] (grammar, spelling, punctuation breakdown)
- **Final Word Count:** [number]
- **Format:** [print/ebook/both]
- **Status:** Publication-ready
```

## Decision Points

- **Before Step 1 (fiction vs nonfiction):** If the chapter is fiction, the brief in Step 1 focuses on narrative arc (inciting incident, rising action, climax, resolution for the chapter's subplot) rather than thesis and arguments. The structural editing in Step 3 evaluates pacing and tension rather than argument flow. All other steps remain the same.
- **After Step 1 (standalone vs series):** If the chapter is part of a series (multiple books, not just multiple chapters), Step 1 must also account for series-level continuity. Add a series continuity check: verify that no information in this chapter contradicts established facts from previous books.
- **After Step 2 (word count check):** If the draft significantly exceeds the target word count (more than 25% over), evaluate whether to split the chapter before proceeding to Step 3. Splitting after structural editing wastes the editing investment on content that will be reorganized.
- **After Step 3 (self-publish vs traditional):** If the user is submitting to a traditional publisher, Steps 4-6 should follow the publisher's house style guide exactly. Request the publisher's style sheet if available. If self-publishing, establish a personal style guide in Step 4 and maintain it across all chapters.
- **After Step 5:** If fact-checking reveals errors that require new research or source material, return to Step 2 to revise the affected sections, then re-run Steps 3-5 for the revised content only. Do not proceed to copy editing with unresolved factual issues.

## Failure Handling

- **Step 1 fails (chapter does not fit the outline):** If the brief reveals that the chapter's content overlaps significantly with adjacent chapters or does not advance the book's overall narrative, the problem is in the book outline, not the chapter. Revise the book outline to clarify chapter boundaries before proceeding. This is an outline-level problem, not a chapter-level problem.

- **Step 2 produces poor quality output:** If the draft is significantly below the target word count or fails to cover the brief's sections, the brief was likely too ambitious or the research was insufficient. Return to Step 1 and either narrow the chapter scope or gather additional research material. Do not try to pad a thin draft -- expand the substance first.

- **Step 3 reveals structural problems:** If structural editing requires more than 40% of the draft to be rewritten, treat the structural edit output as a revised outline and return to Step 2 for a fresh draft. Repeatedly patching a structurally unsound draft produces worse results than redrafting with the structural insights.

- **Step 4 finds inconsistency with prior chapters:** If style compliance reveals that this chapter's voice or terminology conflicts with established chapters, the author must decide which version becomes the standard. Update the style guide to reflect the decision, and flag earlier chapters for revision to match the updated standard. Do not silently change the current chapter to match if the current chapter's approach is better.

- **Step 6 produces excessive corrections:** If copy editing reveals more than 3 errors per page, the manuscript quality is below publication standard. Return to Step 5 and run a more careful proofreading pass, or consider whether Steps 2-4 were rushed. Frequent mechanical errors often indicate that earlier revision passes did not receive adequate attention.

- **User wants to change direction mid-workflow:** If the user decides to change the chapter's topic or structure after Step 3, Steps 1-3 must be repeated. Steps 4-6 are mechanical and cannot be reused if the content changes. The style guide established in Step 4 remains valid for the revised chapter.

## Expected Outcome

When this workflow is complete, the user will have:

1. A chapter brief documenting the chapter's scope, structure, and connection to the larger book
2. A publication-quality chapter that has been structurally edited, style-checked, proofread, and copy-edited
3. A fact-check log documenting verified claims and sources for the chapter
4. Updated style notes capturing any new conventions established during this chapter
5. A repeatable six-step process for writing subsequent chapters with consistent quality

## Edge Cases

- **User has no book outline.** Before starting Step 1, help the user create a minimal outline: book title, 1-sentence description of each planned chapter, and the current chapter's position. This does not need to be complete -- even a partial outline with the current chapter and its neighbors is sufficient to establish context.
- **User is writing the first chapter of the book.** The "entry state" in Step 1 is the reader's starting knowledge (no prior chapter context). The "exit state" becomes especially important as it defines what all subsequent chapters can assume. Spend extra time on the brief to establish the book's foundational concepts and voice.
- **User has a completed draft and wants editing only.** Skip Steps 1-2. Create a retroactive brief from the existing draft (Step 1 output) to use as the reference point for Steps 3-6. This ensures the editing passes have clear structural targets.
- **Chapter includes images, diagrams, or code samples.** Steps 3-6 handle text only. Create a separate visual review checklist alongside the text pipeline: verify image placement, caption accuracy, diagram data consistency, and code sample correctness. Visual elements are reviewed in parallel with Step 5 (accuracy verification).
- **User is ghostwriting for another author.** In Step 4, the style reference must be the client's voice, not the ghostwriter's. Use 2-3 samples of the client's existing writing as the voice calibration source. Flag any passages where the ghostwriter's natural style overrides the client's voice.
- **Multiple chapters are being written simultaneously by different authors.** Run separate instances of this workflow for each chapter. Add a cross-chapter consistency review after all chapters complete Steps 1-4, before any chapter proceeds to Steps 5-6. This catches terminology drift and structural overlap between authors.

## Example

**Input:** "I am writing a nonfiction book about remote team management. I need to write Chapter 4: Building Trust Without Face-to-Face Interaction. Chapter 3 covered Communication Tools and Rhythms. Chapter 5 will cover Handling Conflict Remotely."

**Output:**

## Chapter Pipeline: Building Trust Without Face-to-Face Interaction

### Chapter Brief
- **Book:** Remote Team Management
- **Chapter Number:** 4 of 12
- **Chapter Thesis/Arc:** Trust in remote teams is built through predictable behavior patterns, not relationship-building activities
- **Entry State:** Reader understands async communication patterns from Chapter 3
- **Exit State:** Reader is prepared for conflict resolution in Chapter 5
- **Target Word Count:** 5,000 words
- **Sections Planned:** 6
  1. Why traditional trust-building fails remotely -- office rapport mechanisms do not transfer
  2. The predictability framework -- consistent follow-through as the trust foundation
  3. Transparency as a trust mechanism -- visible work and status sharing
  4. Follow-through tracking systems -- tools and rituals for accountability
  5. Vulnerability in text-based communication -- building psychological safety asynchronously
  6. Measuring trust health -- signals and surveys for distributed teams

### Draft Status
- **Word Count:** 5,200 (target: 5,000)
- **Sections Completed:** 6/6
- **Inline Flags:** 3 items ([CHECK: Buffer remote work survey year], [EXPAND: status update template example], [CHECK: Lencioni trust model citation])

### Structural Edit
- **Sections Reordered:** Yes -- Sections 2 and 3 swapped (transparency is prerequisite for predictability)
- **Sections Expanded:** Section 5 expanded from 400 to 700 words (vulnerability concept needs more nuance)
- **Sections Condensed:** None
- **Gaps Filled:** 1 (added transition from Chapter 3 communication rhythms to trust discussion)

### Style Compliance
- **Terminology Standardized:** "distributed team" used consistently (replaced "remote team" and "virtual team" per Chapters 1-3 convention)
- **Voice Consistency:** Matches established practical-advisory tone with data support
- **New Conventions:** "predictability framework" established as book-specific term for Chapters 5-8

### Fact-Check Log
- **Claims Verified:** 12
- **Claims Updated:** 2 (Buffer survey updated to 2024 edition, Lencioni citation confirmed)
- **Claims Removed:** 0
- **Forward References Flagged:** 1 (reference to Chapter 5 conflict resolution verified against outline)

### Copy Edit Results
- **Corrections Applied:** 14 (6 punctuation, 3 sentence restructures, 2 spelling, 2 paragraph breaks, 1 em-dash standardization)
- **Final Word Count:** 5,480
- **Format:** Publisher submission (Chicago Manual of Style 17th edition)
- **Status:** Publication-ready
