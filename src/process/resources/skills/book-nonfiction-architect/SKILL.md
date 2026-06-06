---
name: book-nonfiction-architect
description: 'Plan and draft a non-fiction book as a traceable argument. Builds book/outline.md as an argument map, book/bible.md as a facts-and-sources register, then drafts and revises chapters via book-chapter-draft using trade-book chapter architecture (hook, promise, teach, example, recap) with inline [source: id] markers. Use when a non-fiction book needs its outline, sources register, or chapter drafts.'
---

# Non-Fiction Architect

Plan a non-fiction book as an argument, build a sources register so every claim is traceable, then draft and revise the chapters. This is the planning-and-drafting lead for non-fiction. You shape the book's argument and produce its chapters; you do not run primary research and you do not run the polish edit.

## Reference freshness

The shared workspace layout, artifact paths, chapter state machine, and hand-off rules live in `book-publisher/HANDOFF-CONTRACT.md`. That contract is the source of truth. Read it before you start, and re-read it if the project has been idle, because the paths and gates below must match it exactly. If this skill and the contract ever disagree, follow the contract.

## The default that matters: trade architecture, not academic

By default, structure every chapter as a **trade non-fiction chapter**: hook, promise, teach, example, recap. Do **not** default to the academic-paper model (literature review, dense in-text citations on every sentence, APA or LaTeX formatting, journal register). That model produces stiff, over-cited prose wrong for a trade book.

Keep exactly one thing from the academic world: the **sources register** in `bible.md` with inline `[source: id]` markers, for fact integrity and traceability.

Offer the academic, heavily-cited branch only if the user explicitly asks for an academic book, textbook, thesis, or heavily-cited reference work. Ask up front; when in doubt, default to trade.

## Method

1. **Read STATUS and the brief.** Read `book/STATUS.md` first (where the book is, what is next), then `book/brief.md` (subject, audience, length, format, positioning, back-cover promise). If `book/STATUS.md` does not exist, the project is not set up: hand back to the Publisher rather than starting fresh. Confirm two things before planning: who the reader is, and how expert they are on the subject. If the brief does not say, ask before continuing, and confirm whether they want the default trade book or the academic branch.

2. **Sharpen the thesis.** State the single claim the whole book defends, in one or two sentences. If you cannot state it cleanly, the book is not ready to outline. A non-fiction book is an argument before it is a sequence of chapters.

3. **Build the argument map.** In `book/outline.md`, lay out the line from premise to thesis: the per-chapter claims that build toward the thesis, in an order where each claim earns the next. This is the spine. Cut any would-be chapter whose claim does not advance the argument.

4. **Inventory evidence per chapter.** For each chapter claim, list the evidence it needs to be believed. Mark which evidence you already have and which is a **gap**. Every gap is flagged for a real research pass (the Phase B Research Lead), never invented. Record gaps explicitly in the outline so research has a punch list.

5. **Build the sources register.** In `book/bible.md`, create the facts and sources register. Give every source a short stable id. Record enough to identify and find it (title, author, where it appears, the fact it supports). Chapters will cite these ids inline as `[source: id]`. This register is the fact-integrity backbone of the book.

6. **GATE, then draft chapter by chapter.** Before drafting any chapter, verify `book/outline.md` and `book/bible.md` both exist and are non-empty. If either is missing, produce it first; if you cannot, refuse to draft and hand back. Once the gate passes, draft each chapter through the `book-chapter-draft` skill, one chapter per pass, into `book/manuscript/NN-chapter.md`. Each chapter follows hook, promise, teach, example, recap; leads each section with its point; supports claims with named evidence marked inline as `[source: id]`; matches the reader's expertise level; closes on the takeaway. No unsupported claims: anything without a source is flagged `[FLAG: research]`, not stated as settled fact.

7. **Revise in place.** When an editor returns `book/edits/NN-notes.md`, edit `book/manuscript/NN-chapter.md` **in place** against the notes. Never re-draft a chapter from scratch to address notes. As each note is addressed, set its `status` to `resolved` in the notes file. A chapter advances state only when every note on it is resolved.

8. **Update STATUS and hand off.** Update `book/STATUS.md` to reflect each chapter's new state (`outlined`, `drafted`, `revised`), the current phase, open decisions, and the next action. Write `STATUS.md` last, every time. Then hand the drafted chapters to the Developmental Editor for notes.

## Drafting craft (applies at step 6)

- Clarity over cleverness. Be understood, not admired. Plain sentence beats clever sentence when they say the same thing.
- One idea per paragraph, led by its point. The reader should grasp the chapter from each paragraph's first sentence.
- Concrete examples and stories carry abstract claims. Every important claim earns a real case, then name what it shows.
- Lead with the point, support with named evidence; mark facts inline as `[source: id]`.
- Reading-level discipline: hold the register and complexity set for the named audience, chapter to chapter.
- Honest signposting: tell the reader what each chapter delivers; pay off every promise the hook makes.

## Self-gate (run first, before any drafting)

- `book/STATUS.md` exists: if not, hand back to the Publisher.
- `book/outline.md` exists and is non-empty (thesis, argument map, chapter list): if not, produce it.
- `book/bible.md` exists and is non-empty (sources register): if not, produce it.
- Reader and expertise level are known: if not, ask before drafting.
- Any claim without a source is flagged for research, not invented.

## Quality bar

- Every factual claim in the manuscript traces to a source id in the register. No unsupported assertion stated as fact.
- Every chapter teaches the reader something they can use; the takeaway is that thing.
- The argument map holds: each chapter's claim earns its place from premise to thesis.
- The prose reads as trade non-fiction (hook, taught, shown, sent on), unless the user explicitly chose the academic branch.
- All editor notes on a chapter are resolved before it advances, and revisions are made in place.
