---
name: write-childrens-book
description: >-
  End-to-end guided journey from initial concept through story development,
  illustration direction, publishing, and marketing for children's books. Covers
  board books through middle grade, age-appropriate writing conventions,
  illustration briefs, self-publishing mechanics, and reaching parents,
  teachers, and young readers through targeted marketing strategies.

  Use when the user wants to write childrens book or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "childrens-book-creator character-architect digital-illustrator self-publishing-guide book-marketing"
trigger_phrases: >-
  I want to write a children's book help me create a picture book write a kids
  book children's book illustration publish a book for kids how to write for
  children picture book idea
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: >-
    parenting creative-writing writing design content-marketing study-skills
    step-by-step planning
  category: creative-project
  depends: "childrens-book-creator character-architect digital-illustrator self-publishing-guide book-marketing"
---
# Write Childrens Book

**Estimated time:** 3-6 months

This workflow guides you through the complete process of creating a children's
book, from the initial concept through story writing, illustration direction,
publishing, and marketing. Children's books have unique constraints that adult
books do not: strict page counts, age-calibrated vocabulary, tight word limits,
and a symbiotic relationship between text and illustration that makes neither
optional.

Whether you are creating a 32-page picture book, an early reader, or a chapter
book, this workflow adapts to the target age group. Decision gates after the
concept phase let you tailor the process to your specific format.

By the end of this workflow you will have: a polished manuscript calibrated to
your target age group, an illustration brief or finished artwork, a publishing
plan, and a marketing strategy that reaches parents, educators, and young
readers.

## When to Use

- User wants to write childrens book
- User needs a structured, step-by-step process for write childrens book
- User wants to write a children's book
- User wants to create a picture book
- write a kids book
- Do NOT use when: the request is outside the scope of write childrens book or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A story idea or theme suitable for young readers (even a vague concept works)
- Understanding of the age group you want to write for (or willingness to learn)
- Budget considerations for illustration (DIY, AI-assisted, or hiring an artist)
- Dedicated time for iterative revision (children's books demand precision)

## Steps

**Step 1: Define Your Concept and Age Group** (uses: childrens-book-creator)

transform the raw idea into a
structured children's book concept.

- Input: story idea, theme, or message, Target age range (if known) or description of the intended reader, Any illustration preferences or artistic constraints
- Output: Age group, format, word count target, theme, and premise, Page count, trim size, illustration-to-text ratio, 3-5 comparable titles with differentiation notes
- Key focus: Identifying the target age category (board book 0-3, picture book 3-7,

**Step 2: Develop Characters and Story** (uses: character-architect)

Use the Character Architect and Story Writer skills to create characters and a
story structure appropriate for the target age group.

- Input: `book-concept` from Step 1 (age group and theme inform character design), `format-specs` from Step 1 (word count limits constrain story scope)
- Output: Protagonist and supporting character descriptions, Scene-by-scene breakdown with page assignments, Complete text with page break indicators
- Key focus: Designing a protagonist the target reader can identify with

**Step 3: Create the Illustration Brief** (uses: digital-illustrator)

create a comprehensive illustration brief
that guides the artwork creation process.

- Input: `manuscript-draft` from Step 2 (text drives illustration needs), `illustration-direction` from Step 1 (style and mood guidelines), `format-specs` from Step 1 (page count and trim size)
- Output: Page-by-page illustration descriptions and compositions, Visual consistency guide for all characters, Color palette, trim size, bleed, resolution requirements
- Key focus: Creating a page-by-page illustration map: what each spread needs to show

**Step 4: Revise and Polish** (uses: childrens-book-creator)

Use the Children's Book Creator and Story Writer skills to perform a thorough
revision pass.

- Input: `manuscript-draft` from Step 2 (text to refine), `illustration-map` from Step 3 (text-image interplay to verify), `book-concept` from Step 1 (age group standards to validate against)
- Output: Final text with all revisions applied, Summary of feedback from test readers, Verification that text and illustrations complement each other
- Key focus: Testing text-illustration interplay: does the text say what the pictures

**Step 5: Publish Your Book** (uses: self-publishing-guide)

navigate publishing for a children's
book, which has specific requirements beyond standard books.

- Input: `polished-manuscript` from Step 4 (final text), `art-specs` from Step 3 (formatting requirements), `comp-titles` from Step 1 (market positioning)
- Output: Platform selection, format specs, and distribution strategy, Formatted interior files ready for upload, Print and ebook pricing with royalty projections
- Key focus: Choosing platforms: KDP for ebook and paperback, IngramSpark for hardcover

**Step 6: Market to Parents, Educators, and Kids** (uses: book-marketing)

Use the Book Marketing and Social Media Strategist skills to reach the unique
audience for children's books: you market to adults (parents, teachers,
librarians) who buy for children.

- Input: `book-concept` from Step 1 (age group and theme drive channel selection), `comp-titles` from Step 1 (competitive positioning), `metadata-package` from Step 5 (messaging to repurpose)
- Output: Channel selection, messaging, and budget allocation, Pre-launch, launch week, and 90-day post-launch plan, Classroom guides, coloring pages, and activity sheets
- Key focus: Building a presence where parents discover books: Bookstagram, parenting

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Writing for adults disguised as a children's book:** Write for the child, not for the parent who reads it. Kids detect condescension instantly.
- **Too many words:** Picture books are 500-1000 words, not 3000. Cut ruthlessly. Let the illustrations carry half the story.
- **Telling the moral instead of showing it:** "And Tommy learned to share" is a dead ending. Show the sharing through action and consequence.
- **Skipping the read-aloud test:** If the text does not flow when read aloud, children will lose attention. Read it to actual kids before publishing.
- **Underinvesting in illustration:** Children's books are visual products. A beautiful story with poor illustrations will not sell.

## Expected Outcome

When this workflow is complete, the user will have:

1. A complete, age-appropriate manuscript exists with tight text-illustration interplay
2. Illustrations are finished and consistent across all pages
3. The book is published in formats appropriate for the children's market
4. Marketing reaches the adults who buy children's books (parents, teachers, librarians)
5. Educational companion materials extend the book's reach into schools
6. The author has a platform for future children's book releases

## Output Format

```
WRITE CHILDRENS BOOK TRACKER
============================

[ ] Step 1: Define Your Concept and Age Group
    Status: [pending/in-progress/complete]
[ ] Step 2: Develop Characters and Story
    Status: [pending/in-progress/complete]
[ ] Step 3: Create the Illustration Brief
    Status: [pending/in-progress/complete]
[ ] Step 4: Revise and Polish
    Status: [pending/in-progress/complete]
[ ] Step 5: Publish Your Book
    Status: [pending/in-progress/complete]
[ ] Step 6: Market to Parents, Educators, and Kids
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Writing for adults disguised as a children's book:** Write for the child, not for the parent who reads it. Kids detect condescension instantly.
- **Too many words:** Picture books are 500-1000 words, not 3000. Cut ruthlessly. Let the illustrations carry half the story.
- **Telling the moral instead of showing it:** "And Tommy learned to share" is a dead ending. Show the sharing through action and consequence.
- **Skipping the read-aloud test:** If the text does not flow when read aloud, children will lose attention. Read it to actual kids before publishing.

## Example

**Input:** "I want to write childrens book and need a structured plan to follow step by step."

**Output:**

**Step 1 (childrens-book-creator):** Define Your Concept and Age Group -- produces concrete deliverables for this phase.

**Step 2 (character-architect-story-writer):** Develop Characters and Story -- produces concrete deliverables for this phase.

**Step 3 (digital-illustrator):** Create the Illustration Brief -- produces concrete deliverables for this phase.

**Step 4 (childrens-book-creator-story-writer):** Revise and Polish -- produces concrete deliverables for this phase.

**Step 5 (self-publishing-guide):** Publish Your Book -- produces concrete deliverables for this phase.

**Step 6 (book-marketing-social-media-strategist):** Market to Parents, Educators, and Kids -- produces concrete deliverables for this phase.

**Result:** User has a complete write childrens book plan with all deliverables produced, validated, and ready for implementation.
