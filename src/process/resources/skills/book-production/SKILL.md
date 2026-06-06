---
name: book-production
description: 'Final production and publishing for a book project: gate on every chapter being final, assemble the manuscript and front/back matter in STATUS order, format to DOCX via officecli-docx, generate metadata, blurb, a non-fiction index and bibliography, and a KDP/IngramSpark platform prep checklist. Use when a copy-clean manuscript is ready to be turned into an uploadable package.'
---

# Book Production

Turn a finished, copy-clean manuscript into the package a person can upload: a formatted DOCX, the front and back matter, metadata, a back-cover blurb, a non-fiction index and bibliography, and a platform prep checklist. You are the exit role. You do not write and you do not edit the prose. Everything you produce lands under `book/out/`.

## Source of truth and reference freshness

The coordination rules are in `../../assistant/book-publisher/HANDOFF-CONTRACT.md` (the Publishing House Hand-off Contract). It defines the shared `book/` workspace, the named artifacts, the chapter state machine (`outlined -> drafted -> dev-noted -> revised -> copy-clean -> final`), and the team tool names. Read it before you build. When this skill and that contract disagree, the contract wins. If the contract has changed (new artifact, renamed field, changed gate), follow the contract and treat this skill as the older copy. Read the STATUS chapter table for chapter order and titles, never a directory glob.

## Hard rules

- **Gate first.** Production assembles only chapters in state `final`. If any chapter is not `final`, STOP and report exactly which ones block the gate, by number and title.
- **STATUS order, not filesystem order.** The chapter table in `book/STATUS.md` is the authority for which chapters exist and in what order. Do not list `book/manuscript/` to decide.
- **Reuse officecli-docx for documents.** Do not hand-roll DOCX. Do not use `_builtin/office-cli`. officecli is install-on-demand: pre-check it and guide install if missing.
- **Non-fiction needs an index and a bibliography.** A non-fiction book without both is not publish-ready. Build them from the sources register in `book/bible.md`.
- **Read STATUS first, write STATUS last.** Set the phase to `done` only after the package is built.

## Method

### 1. Read STATUS and gate on every chapter being final

Read `book/STATUS.md`. If it does not exist, the project is not set up: hand back to the Publisher, do not start fresh. Read the genre (fiction or non-fiction) and the chapter table.

Walk the chapter table. Every row's state must be `final`. If any row is not, STOP and report precisely which chapters block you:

> Production blocked. Not final: 03 (The Long Road) is `revised`, 07 (Reckoning) is `copy-clean`. I assemble only `final` chapters. Send these back through the remaining steps, then I can build.

Do not produce a partial book. Only continue when every chapter is `final`.

### 2. Pre-check officecli-docx; guide install if missing

The DOCX (and ePub and PDF) build is gated on `officecli`. Check it before the formatting step:

```bash
officecli --version
```

If that fails, officecli is not installed. Do not skip the manuscript and do not fail silently. Guide the user to install it (from the `officecli-docx` skill's Setup section):

- **macOS / Linux**: `curl -fsSL https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/main/install.sh | bash`
- **Windows (PowerShell)**: `irm https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/main/install.ps1 | iex`

Open a new terminal so PATH picks it up, then re-run `officecli --version`. Until it answers, you can still do steps 3, 5, 6, and 7 in Markdown. Only step 4 (the binary render) is blocked. Pick the DOCX build back up here once officecli is available.

When you do build the DOCX, follow the `officecli-docx` skill end to end: its Requirements for Outputs, its Common Workflow, its Delivery Gate, and its QA cycle are authoritative for what a good document looks like. Do not reinvent any of that here.

### 3. Assemble chapters in STATUS order plus front and back matter

Concatenate the chapters in the order given by the STATUS chapter table, reading each `book/manuscript/NN-chapter.md`. Strip any leftover editor markers (`[FLAG: ...]`, resolved-note residue) before formatting; if you find an unresolved `[FLAG: decision]` or `[FLAG: research]`, that is a sign a gate was skipped, so stop and report it rather than shipping the marker.

Build the front and back matter as a templated checklist captured in `book/out/metadata.md`. Fill what is known from `book/brief.md` and the manuscript; mark every gap as a clear `TODO` rather than inventing content. The matter set:

- **Title page**: title, subtitle, author.
- **Copyright page**: copyright year and holder, rights statement, ISBN slot (TODO until obtained), edition.
- **Table of contents**: from the STATUS chapter titles (the DOCX TOC is generated as a live field by officecli; see the officecli-docx skill's Table of Contents section).
- **Dedication**: TODO unless the user supplies one.
- **Epigraph**: TODO unless supplied (note any quote needs permission).
- **Also by the author**: TODO, list prior titles if known.
- **About the author**: draft from the brief if author bio exists, else TODO.

### 4. Format to DOCX via officecli-docx

Produce `book/out/<title>.docx` using the `officecli-docx` skill. Front matter first (title page, copyright, dedication, epigraph, TOC), then the chapters in STATUS order with each chapter starting on a fresh page (apply the belt-and-suspenders page-break rule from that skill: `add --type pagebreak` before each chapter heading AND `pageBreakBefore=true` on the heading paragraph). Back matter last (also-by, about-the-author, and for non-fiction the index and bibliography). Run that skill's Delivery Gate before declaring the DOCX done.

Name ePub and PDF as additional targets. Build them from the same assembled content when the user wants them; the DOCX is the primary deliverable.

### 5. Generate metadata.md, keywords, and blurb.md

In `book/out/metadata.md` capture: title, subtitle, author, BISAC categories (pick the closest from the BISAC subject list for the genre and subject), keywords (a short list of search phrases a buyer would actually type), a one-line description, and a one-paragraph description. Draft these from `book/brief.md` (positioning, comps, back-cover promise) and the actual manuscript.

In `book/out/blurb.md` write the back-cover copy and sales description, drafted from the brief's one-paragraph back-cover promise. This is sales copy: a hook, the stakes or the payoff, and a reason to buy. Keep it tight.

### 6. For non-fiction, build index.md and the bibliography

Skip this entire step for fiction.

- **`book/out/index.md`** (MVP): a key-term list with chapter anchors. Walk the manuscript for recurring terms, names, concepts, and methods; for each, list the chapters where it appears (by chapter number from the STATUS table). This is a working index, not a typeset page-number index; say so. A non-fiction book without an index is not publish-ready.
- **Bibliography / notes**: build from the sources register in `book/bible.md`. Each source there has an id used in inline `[source: id]` markers in the manuscript. Produce a consistent reference list (one entry per source) and, where the manuscript uses inline source markers, a notes section keyed to them. Use a hanging-indent reference style in the DOCX (see the officecli-docx skill).

### 7. Produce the platform prep checklist

Write `book/out/platform-checklist.md` covering the fields each store asks for, so the user can upload without surprises.

- **KDP (Amazon)** field list: title, subtitle, series (if any), author and contributors, description, keywords (up to 7), 2 BISAC categories, language, publication date, print ISBN or free ASIN choice, paperback trim size and bleed, manuscript and cover upload, pricing and territories.
- **IngramSpark** field list: title, subtitle, contributors, BISAC categories, audience, description, ISBN (required, no free option), trim size, binding and paper, page count, list price and discount, returns setting, market and distribution.
- **Trim-size guidance**: common sizes (6x9 in for most non-fiction and trade fiction, 5x8 in for smaller fiction, 5.5x8.5 in for memoir and shorter non-fiction). Pick from the brief's format and length; note that trim size must be fixed before the interior is finalized because it drives pagination.
- **ISBN guidance**: where to get one (the official agency for the author's country, for example Bowker in the US), and the trade-off plainly stated: Amazon offers a free ASIN that works only on Amazon, while a real ISBN is required for IngramSpark and for selling across other stores and to libraries. Recommend a real ISBN if the author wants distribution beyond Amazon; the free ASIN is fine for Amazon-only.

State the scope limits in the checklist itself: this package does NOT include buying the ISBN, designing the cover (hand that to an image-generation tool), sensitivity reads, or beta-reader rounds.

### 8. Update STATUS to done

Set the phase in `book/STATUS.md` to `done`, record what was produced under `book/out/`, and note any outstanding TODOs (matter gaps, ISBN, cover) so the user knows exactly what is left before upload. Write STATUS last.

## Quality bar

A good production pass is complete, faithful to the final manuscript, and honest about its gaps. The DOCX passes the officecli-docx Delivery Gate. The matter checklist marks every unknown as a TODO instead of inventing it. Non-fiction ships with an index and a bibliography or it is not done. The platform checklist tells the user the real fields and the real cost, including the things this role does not do. If you produced before every chapter was `final`, you broke the one rule that matters here: stop and gate.

## Scope honesty

"Publish-ready" here means a clean, formatted manuscript with front and back matter, metadata, a blurb, a non-fiction index and bibliography, and a platform prep checklist. It does NOT include ISBN purchase, professional cover design (hand off to an image-generation tool), sensitivity reads, or beta-reader rounds. Say so plainly. Do not overclaim.
