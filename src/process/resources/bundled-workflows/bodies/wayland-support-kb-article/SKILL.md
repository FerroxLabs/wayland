---
name: wayland-support-kb-article
description: >-
  Build a self-serve knowledge-base article from a recurring support ticket:
  infer search intent, draft the article, then add an if-this-then-that
  troubleshooting tree.

  Use when the user wants a structured, multi-step process to turn a representative
  ticket and its resolution into a published-quality KB article with a
  troubleshooting tree.

  Do NOT use for a one-paragraph FAQ answer or a single edit that one atomic skill
  can answer.
license: Apache-2.0
type: workflow
skills: "support-kb-article"
metadata:
  author: wayland
  version: 1.0.0
  tags: support knowledge-base kb-article troubleshooting self-serve step-by-step
  category: support
  depends: "support-kb-article"
---
# Build a KB Article

**Estimated time:** 20-30 minutes

This workflow turns a representative support ticket and its working resolution
into a self-serve knowledge-base article plus a troubleshooting tree. It is
interactive: the user reviews and refines the article, then reviews and refines
the tree before shipping the package.

## Steps

**Step 1: Kick Off and Capture the Source Ticket** (uses: support-kb-article)

Ask the user to paste a representative ticket for the recurring issue plus the
resolution that actually worked. Capture both verbatim as the source ticket. Do
not proceed until you have both the issue and the working resolution.

- Input: user-pasted representative ticket and working resolution
- Output: source ticket
- Key focus: capture both the problem and the proven fix before writing anything

**Step 2: Infer Search Intent** (uses: support-kb-article)

Using the support-kb-article skill, infer the search intent: the actual phrases
users will type when they hit this problem. State the inferred search intents and
the reasoning. Note that the article title and headers should match these
intents. Capture the search intent.

- Input: source ticket from Step 1
- Output: search intent (phrases users will search)
- Key focus: derive real search phrasing so the article is findable

**Step 3: Build the Article** (uses: support-kb-article)

Using the support-kb-article skill with the source ticket and the search intent,
draft the KB article: a title and headers matched to search intent, the issue
description, and the step-by-step solution. Show the full article to the user.

- Input: source ticket from Step 1, search intent from Step 2
- Output: KB article draft
- Key focus: title and headers must match the inferred search intents

**Step 4: Review the Article** (uses: support-kb-article)

Present the article and ask the user whether to refine it or proceed to the
troubleshooting tree. If the user wants changes, gather specific refinement
feedback and re-run Step 3 with that feedback plus the prior article and the
source ticket, looping up to 3 times until the user is satisfied. When satisfied,
advance.

- Input: article draft from Step 3, user decision and refinement feedback
- Output: approved article
- Key focus: loop on the article only until the user approves (max 3 iterations)

**Step 5: Build the Troubleshooting Tree** (uses: support-kb-article)

Using the support-kb-article skill in troubleshooting-tree mode with the approved
article, produce an if-this-then-that troubleshooting tree that branches on the
symptoms a user might observe. Show the full tree to the user.

- Input: approved article from Step 4
- Output: troubleshooting tree (if-this-then-that branches)
- Key focus: branch on observable symptoms, each branch ending in a concrete action

**Step 6: Final Review and Ship the Package** (uses: support-kb-article)

Present the troubleshooting tree and ask the user whether to ship the KB article
or refine the tree. If they want changes, gather feedback and re-run Step 5 with
that feedback plus the approved article, looping up to 2 times. When approved,
assemble the KB article package with these sections: Source Ticket, Search Intent,
KB Article, Troubleshooting Tree.

- Input: troubleshooting tree from Step 5, approved article from Step 4, user decision
- Output: KB article package (assembled)
- Key focus: assemble the four-section package only after the user ships
