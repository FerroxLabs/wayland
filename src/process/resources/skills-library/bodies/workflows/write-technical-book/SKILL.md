---
name: write-technical-book
description: >-
  Complete workflow for writing and publishing a technical book, from crafting a
  compelling proposal through building a detailed outline, writing and revising
  the manuscript, conducting technical review, and navigating the publishing
  process for both traditional and self-publishing paths.

  Use when the user wants to write technical book or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "book-proposal-writer book-outliner non-fiction-author developmental-editor self-publishing-guide"
trigger_phrases: >-
  I want to write a technical book write a programming book technical book
  proposal publish a tech book write a book about software author a technical
  guide book about technology
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: writing content-marketing career step-by-step planning
  category: career
  depends: "book-proposal-writer book-outliner non-fiction-author developmental-editor self-publishing-guide"
---
# Write Technical Book

**Estimated time:** 6-12 months

This workflow guides technical professionals through writing and publishing a
technical book. Technical books are distinct from other nonfiction -- they
require code examples that work, explanations that teach, and content that
remains relevant despite rapidly changing technology. A well-executed technical
book can establish you as a definitive authority in your field, generate
passive income, and create career opportunities for years.

The workflow covers the unique challenges of technical authoring: writing a
proposal that publishers care about, structuring content for progressive
learning, balancing depth with accessibility, managing code examples and
technical accuracy, and choosing between traditional publishers (O'Reilly,
Manning, Pragmatic) and self-publishing.

By the end of this workflow you will have: a polished book proposal, a
detailed chapter outline, a complete manuscript, technically reviewed content,
and a published technical book.

## When to Use

- User wants to write technical book
- User needs a structured, step-by-step process for write technical book
- User wants to write a technical book
- write a programming book
- technical book proposal
- Do NOT use when: the request is outside the scope of write technical book or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Deep expertise in the technical subject (at least 3-5 years of hands-on experience)
- Some existing content (blog posts, talks, tutorials) that demonstrates your ability to teach
- Dedicated writing time (10-15 hours per week for 6-12 months)
- A working development environment for creating and testing code examples
- Clarity on your target reader and their skill level

## Steps

**Step 1: Craft Your Book Proposal** (uses: book-proposal-writer)

create a compelling book proposal. Even
if you plan to self-publish, the proposal process forces the discipline of
thinking through audience, market, and differentiation.

- Input: technical expertise and the subject they want to write about, Target audience and their current skill level, Competing books in the space (what already exists)
- Output: Complete proposal document with all required sections, One fully written chapter demonstrating style and depth, Competitive landscape with differentiation strategy
- Key focus: Book concept refinement: what specific angle or approach makes this book

**Step 2: Build Your Detailed Outline** (uses: book-outliner)

expand the chapter synopses into a detailed,
section-level outline. Technical books live or die by their structure -- a
poorly organized technical book is unusable no matter how good the content.

- Input: `book-proposal` from Step 1 (chapter synopses as starting point), `sample-chapter` from Step 1 (established style and depth level), `market-analysis` from Step 1 (gaps to fill that competitors missed)
- Output: Section-level outline for every chapter, Code examples and exercises planned per chapter, Running project that spans multiple chapters
- Key focus: Learning progression design: each chapter builds on the previous one;

**Step 3: Write and Revise the Manuscript** (uses: non-fiction-author)

write the complete manuscript. This is the
longest and most demanding phase. Technical writing requires balancing clarity,
accuracy, and engagement -- and your code examples must actually work.

- Input: `detailed-outline` from Step 2 (section-level guide for writing), `code-plan` from Step 2 (examples to create alongside text), `sample-chapter` from Step 1 (style template for consistency)
- Output: Complete first-draft manuscript for all chapters, Working code examples organized by chapter, Self-identified issues to address in editing
- Key focus: Writing cadence: establish a sustainable daily or weekly writing routine

**Step 4: Conduct Technical Review** (uses: developmental-editor)

conduct a thorough structural and
technical review of the manuscript. Technical books require both traditional
developmental editing and domain-specific technical review.

- Input: `manuscript-draft` from Step 3 (complete manuscript to review), `code-repository` from Step 3 (code to verify), `detailed-outline` from Step 2 (intended structure to evaluate against)
- Output: Technical accuracy findings with corrections, Developmental edit report on organization and pacing, Aggregated feedback from external technical reviewers
- Key focus: Technical accuracy review: every claim, code example, and technical

**Step 5: Publish the Book** (uses: self-publishing-guide)

navigate the publishing process. Whether
you are working with a traditional publisher or self-publishing, this step
covers getting the book into readers' hands.

- Input: `revision-plan` from Step 4 (applied to produce the final manuscript), `publisher-targets` from Step 1 (publishing path decision), `code-repository` from Step 3 (finalized companion code)
- Output: Complete, copyedited, publication-ready manuscript, Platform configuration, pricing, and metadata, Coordinated launch plan with timeline and channels
- Key focus: Final manuscript preparation: apply all revisions, copyedit, and proofread

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Writing a reference manual instead of a book:** Readers want to learn through guided progression, not look things up in alphabetical order. Teach, do not document.
- **Untested code examples:** Nothing destroys credibility faster than code examples that do not work. Test every example.
- **Technology outpacing your writing:** If you are writing about a fast-moving technology, scope to stable features and version-lock your examples.
- **Perfectionism on early chapters:** Write the whole book before polishing any chapter. You will rewrite chapter 1 anyway once you understand the book's voice.
- **No external reviewers:** You are too close to the content to see gaps. Get at least 2-3 people from your target audience to review.

## Expected Outcome

When this workflow is complete, the user will have:

1. A book proposal clearly differentiates the book in the market
2. A detailed outline provides a logical learning progression
3. A complete manuscript with working code examples is written
4. Technical review confirms accuracy and accessibility
5. The book is published and available to the target audience
6. A companion code repository is published and maintained
7. The book generates professional opportunities and establishes authority

## Output Format

```
WRITE TECHNICAL BOOK TRACKER
============================

[ ] Step 1: Craft Your Book Proposal
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Your Detailed Outline
    Status: [pending/in-progress/complete]
[ ] Step 3: Write and Revise the Manuscript
    Status: [pending/in-progress/complete]
[ ] Step 4: Conduct Technical Review
    Status: [pending/in-progress/complete]
[ ] Step 5: Publish the Book
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Writing a reference manual instead of a book:** Readers want to learn through guided progression, not look things up in alphabetical order. Teach, do not document.
- **Untested code examples:** Nothing destroys credibility faster than code examples that do not work. Test every example.
- **Technology outpacing your writing:** If you are writing about a fast-moving technology, scope to stable features and version-lock your examples.
- **Perfectionism on early chapters:** Write the whole book before polishing any chapter. You will rewrite chapter 1 anyway once you understand the book's voice.

## Example

**Input:** "I want to write technical book and need a structured plan to follow step by step."

**Output:**

**Step 1 (book-proposal-writer):** Craft Your Book Proposal -- produces concrete deliverables for this phase.

**Step 2 (book-outliner):** Build Your Detailed Outline -- produces concrete deliverables for this phase.

**Step 3 (non-fiction-author):** Write and Revise the Manuscript -- produces concrete deliverables for this phase.

**Step 4 (developmental-editor):** Conduct Technical Review -- produces concrete deliverables for this phase.

**Step 5 (self-publishing-guide):** Publish the Book -- produces concrete deliverables for this phase.

**Result:** User has a complete write technical book plan with all deliverables produced, validated, and ready for implementation.
