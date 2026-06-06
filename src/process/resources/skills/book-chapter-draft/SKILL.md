---
name: book-chapter-draft
description: 'Draft-only chapter writing for book projects. Produces a complete first draft of a single chapter from an outline and bible, flags problems for the editors, and deliberately does NOT self-edit. Use when an architect or production role needs to write a chapter draft.'
---

# Book Chapter Draft

Write a complete first draft of one chapter. This is a drafting skill, not an editing skill. Your job is to get a full, coherent chapter onto the page from the plan, hold voice and continuity, and hand it to the editors clean of your own second-guessing. The Developmental Editor and Copy Editor exist to refine this draft. Do not do their work.

## Hard rules

- **Draft, do not edit.** Write the chapter once, well, then stop. Do not run polish passes, do not rewrite sentences five times, do not "tighten." Drafting and editing are separate roles for a reason: editing while drafting kills momentum and produces over-worked, timid prose.
- **Read before you write.** Always read `book/STATUS.md`, `book/outline.md`, and `book/bible.md` first. The chapter must match the plan and stay consistent with everything already established. If those files do not exist, stop and say so: drafting before planning is out of order.
- **One chapter per pass.** Write the single chapter you were asked for. Do not skip ahead or draft multiple chapters in one go.
- **Flag, do not fix.** When you hit a gap (a fact you need, a continuity question, a plot or argument hole, a decision only the user can make), leave a clearly marked inline note rather than inventing an answer or silently editing the plan.

## Method

1. **Load context.** Read `book/STATUS.md` (where the book is, what this chapter must do), `book/outline.md` (this chapter's goal, beats or claims), and `book/bible.md` (characters, world rules, or facts and sources this chapter must respect).
2. **Confirm the chapter's job.** State in one line what this chapter must accomplish for the book and what it hands to the next chapter. For fiction: the scene goals, conflict, and turn. For non-fiction: the claim, the evidence, and the takeaway.
3. **Draft the full chapter** into `book/manuscript/NN-chapter.md` where `NN` is the zero-padded chapter number. Write the whole thing start to finish:
   - Hold the established voice, POV, and tense (fiction) or the established register and reading level (non-fiction).
   - Honor the bible: no character, fact, or world detail that contradicts it.
   - Fiction: every scene has a goal, a conflict, and a change of state. Show, do not summarize, where it matters. Anchor dialogue and description to the character cards.
   - Non-fiction: lead each section with its point, support it with the evidence named in the outline, mark each source inline as `[source: <id from bible>]`, and close with the takeaway. No unsupported claims.
4. **Leave editor-facing flags** inline using a consistent marker so the editors can find them:
   - `[FLAG: continuity] ...` a possible conflict with the bible or an earlier chapter.
   - `[FLAG: research] ...` a fact or source the chapter needs but does not have.
   - `[FLAG: decision] ...` a choice only the user or Publisher should make.
   - `[FLAG: weak] ...` a passage you suspect is thin and want the dev editor to look at.
5. **Update the manifest.** Set this chapter's state to `drafted` in `book/STATUS.md` and note any open flags under the chapter's row. Write `STATUS.md` last, every time.
6. **Hand off.** State plainly: chapter NN drafted, N flags raised, ready for developmental edit. Do not start editing it yourself.

## Quality bar

A good draft is complete, on-plan, consistent with the bible, and honest about its gaps. It is allowed to be rough. It is not allowed to be partial, off-outline, or self-contradictory. If you find yourself polishing, you are done: hand it to the editors.
