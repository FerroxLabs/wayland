---
name: wayland-objection-library-build
description: >-
  Build a reusable objection-handling library: gather and infer the objections
  for a niche, categorize them by the Three Locks, write a response template
  per objection, then produce per-buyer-type variants.

  Use when the user wants a durable, categorized objection library with response
  templates and buyer-type variants they can reuse across deals.

  Do NOT use for diagnosing one specific stuck deal (use wayland-deal-forensic)
  or building a cold outreach sequence (use wayland-outreach-build).
license: Apache-2.0
type: workflow
skills: "sales-coach sales-objections convert-three-locks"
metadata:
  author: wayland
  version: 1.0.0
  tags: sales objections three-locks templates buyer-types step-by-step
  category: sales
  depends: "sales-coach sales-objections convert-three-locks"
---
# Objection Library Build

**Estimated time:** 30-45 minutes

This workflow builds an objection-handling library: the prospect objections the
user hears in their niche, categorized by the Three Locks (Want, Trust,
Excuse), with a response template for each and per-buyer-type variants. The
output is a reusable library document.

Run the sales-coach agent throughout. Each step feeds the next.

## Steps

**Step 1: Capture the Brief** (uses: sales-coach)

Ask the user for the offer, the target ICP, and any objections they have
already heard. Tell them the more objections they give, the better the library.
This is an interactive step: ask, then wait for the brief before continuing.

- Input: user-provided offer, target ICP, and known objections
- Output: brief (offer, ICP, and any already-heard objections)
- Key focus: gather as many real objections as the user can recall

**Step 2: Infer Additional Objections** (uses: sales-objections)

From the brief, infer the additional objections the user will hear beyond the
ones they have already encountered. State the inferred objections and your
reasoning, and invite the user to add or remove based on their real
conversations.

- Input: brief from Step 1
- Output: additional_objections (inferred objections plus reasoning)
- Key focus: anticipate the objections that have not surfaced yet

**Step 3: Categorize by Lock** (uses: convert-three-locks)

Categorize the full set of objections (provided plus inferred) by the Three
Locks: Want, Trust, Excuse. Show the categorization to the user.

- Input: additional_objections from Step 2, brief from Step 1
- Output: by_lock (objections grouped by Want / Trust / Excuse)
- Key focus: map each objection to the lock it really expresses

**Step 4: Review and Refine the Categorization** (uses: convert-three-locks)

Show the lock categorization and ask the user to refine it or proceed to
response templates. If they want changes, fold their feedback back in (up to two
passes) and re-present. Once approved, advance.

- Input: by_lock from Step 3, additional_objections, user feedback
- Output: approved by_lock
- Key focus: get the lock mapping right before writing responses

**Step 5: Build Response Templates** (uses: sales-objections)

Write one response template per objection, each with a reframe, proof, and a
next-step pivot. Use the lock categorization and the brief. Show the templates
to the user.

- Input: by_lock from Step 3, brief from Step 1
- Output: responses (one template per objection: reframe, proof, pivot)
- Key focus: every objection gets a complete, sendable response

**Step 6: Review and Refine the Responses** (uses: sales-objections)

Show the response templates and ask the user to refine them or proceed to
per-buyer-type variants. If they want changes, fold their feedback in (up to
three passes) and re-present. Once approved, advance.

- Input: responses from Step 5, by_lock from Step 3, user feedback
- Output: approved responses
- Key focus: lock the templates before generating variants

**Step 7: Build Buyer-Type Variants** (uses: sales-objections)

Produce per-buyer-type variants of the responses (Logical, Emotional,
Skeptical, Hesitant, Aspirational): same objection, different response per buyer
type. Show the variants to the user.

- Input: responses from Step 5
- Output: variants (responses tuned per buyer type)
- Key focus: the same objection handled five ways for five buyer types

**Step 8: Final Review and Ship the Library** (uses: sales-objections)

Show the buyer-type variants and ask the user to ship the library or refine the
variants. If they want changes, fold their feedback in (up to two passes) and
re-present. When they ship, assemble the library: brief, all objections
categorized by the Three Locks, response templates, and buyer-type variants.

- Input: variants from Step 7, brief, by_lock, responses, user feedback
- Output: objection_library (the assembled Objection Handling Library)
- Key focus: deliver a reusable library the user can pull from on any deal

## Expected Outcome

An Objection Handling Library containing the brief, all objections categorized
by the Three Locks, a response template per objection, and per-buyer-type
variants.
