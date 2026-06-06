---
name: wayland-support-macro-library
description: >-
  Build a reusable support macro library from recurring ticket patterns: identify
  the patterns, draft reply templates with personalization slots, then organize
  them into a category index.

  Use when the user wants a structured, multi-step process to turn a sample of
  recurring tickets into a complete macro library with templates and a lookup
  index.

  Do NOT use for a single canned reply or one template that one atomic skill can
  answer.
license: Apache-2.0
type: workflow
skills: "support-faq support-reply"
metadata:
  author: wayland
  version: 1.0.0
  tags: support macros templates faq category-index step-by-step
  category: support
  depends: "support-faq support-reply"
---
# Build a Macro Library

**Estimated time:** 30-45 minutes

This workflow turns a sample of recurring support tickets into a macro library:
reply templates with personalization slots, organized under a category index. It
is interactive: the user reviews and refines the macros, then reviews and refines
the index before shipping the library.

## Steps

**Step 1: Kick Off and Capture the Ticket Sample** (uses: support-faq)

Ask the user to paste a sample of recent tickets (10-30 if available) or to
describe the recurring categories they see. Capture the sample verbatim. Do not
proceed until you have either a concrete ticket sample or a clear description of
the recurring categories.

- Input: user-pasted ticket sample or category descriptions
- Output: ticket sample
- Key focus: get enough volume or category detail to spot real patterns

**Step 2: Infer Recurring Patterns** (uses: support-faq)

Using the support-faq skill, identify the recurring patterns in the ticket
sample. State the patterns you found and the reasoning. Invite the user to add
patterns you missed from their real ticket history. Capture the resulting
patterns.

- Input: ticket sample from Step 1
- Output: recurring patterns
- Key focus: name each pattern clearly and let the user add ones you missed

**Step 3: Build the Macros** (uses: support-reply)

Using the support-reply skill in macro-templates mode with the patterns, produce
a set of reply macros, one per pattern, each with explicit personalization slots
the agent fills at send time. Show the full set of macros to the user.

- Input: patterns from Step 2
- Output: macros (templates with personalization slots)
- Key focus: every macro needs clear personalization slots, not hardcoded specifics

**Step 4: Review the Macros** (uses: support-reply)

Present the macros and ask the user whether to refine them or proceed to the
category index. If the user wants changes, gather specific refinement feedback and
re-run Step 3 with that feedback plus the prior macros and the patterns, looping
up to 3 times until the user is satisfied. When satisfied, advance.

- Input: macros from Step 3, user decision and refinement feedback
- Output: approved macros
- Key focus: loop on the macros only until the user approves (max 3 iterations)

**Step 5: Build the Category Index** (uses: support-faq)

Using the support-faq skill in category-index mode with the approved macros and
the patterns, build a category index that lets an agent look up the right macro by
category. Show the full index to the user.

- Input: approved macros from Step 4, patterns from Step 2
- Output: category index (macro lookup)
- Key focus: every macro is reachable from the index by an obvious category

**Step 6: Final Review and Ship the Library** (uses: support-faq)

Present the category index and ask the user whether to ship the library or refine
the index. If they want changes, gather feedback and re-run Step 5 with that
feedback plus the approved macros, looping up to 2 times. When approved, assemble
the macro library with these sections: Patterns, Macros, Category Index.

- Input: category index from Step 5, approved macros from Step 4, user decision
- Output: macro library (assembled)
- Key focus: assemble the three-section library only after the user ships
