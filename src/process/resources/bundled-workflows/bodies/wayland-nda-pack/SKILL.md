---
name: wayland-nda-pack
description: >-
  Draft a mutual or unilateral NDA that is jurisdiction-aware and tailored to the
  parties and purpose: infer the right form, recommend key terms, draft the
  agreement, and iterate to a counsel-ready draft.

  Use when the user wants a structured process to produce an NDA draft tailored to a
  specific counterparty, purpose, and governing law.

  Do NOT use for a one-line question about NDAs, or as a substitute for licensed legal
  advice. The output is a draft; counsel review is required before execution.
license: Apache-2.0
type: workflow
skills: "legal-nda"
metadata:
  author: wayland
  version: 1.0.0
  tags: legal nda confidentiality mutual unilateral step-by-step business-legal
  category: business-legal
  depends: ""
---
# NDA Pack

**Estimated time:** 10-15 minutes

This workflow drafts a non-disclosure agreement tailored to the counterparty, the
purpose of the disclosure, and the governing law. It infers whether a mutual or
unilateral form fits, recommends the key terms, drafts the NDA, and iterates with
the user to a counsel-ready draft.

The output is a draft. Counsel review is required before the NDA is executed.

## When to Use

- User wants an NDA tailored to a specific counterparty and purpose
- User is unsure whether a mutual or unilateral NDA is appropriate
- User wants recommended key terms (term length, exclusions, return-of-info)
- Do NOT use for a generic one-line NDA question
- Do NOT use as a replacement for licensed legal advice

## Steps

**Step 1: Intake the NDA Brief** (uses: legal-nda)

Ask the user for the counterparty (name and entity type), the purpose of the NDA
(what is being discussed or disclosed), and the governing law and venue. Do not
proceed until you have the counterparty, purpose, and governing law.

- Input: counterparty name and entity type, purpose of disclosure, governing law / venue
- Output: captured NDA brief
- Key focus: capture purpose and governing law before choosing a form

**Step 2: Infer Mutual vs Unilateral** (uses: legal-nda)

From the brief, infer whether the NDA should be mutual (both sides disclose) or
unilateral (one side discloses). State the inferred form, explain the reasoning,
and ask the user to confirm or override before continuing.

- Input: brief from Step 1
- Output: confirmed NDA form (mutual or unilateral)
- Key focus: pick the form that matches the actual disclosure direction

**Step 3: Recommend Key Terms** (uses: legal-nda)

Recommend the key terms for this NDA: the definition of confidential information,
the term length, the standard exclusions (publicly known, independently developed,
already in possession, compelled by law), and the return-or-destroy-of-information
clause. State the recommended terms with reasoning and let the user adjust them.

- Input: brief from Step 1, NDA form from Step 2
- Output: recommended key terms (definition, term, exclusions, return-of-info)
- Key focus: term length and exclusions tuned to the purpose and parties

**Step 4: Draft the NDA** (uses: legal-nda)

Draft the full NDA using the brief, the chosen form, and the key terms. Tailor the
parties, the definition of confidential information, the obligations, the term, the
exclusions, and the governing-law clause. Surface the full draft to the user.

- Input: brief from Step 1, form from Step 2, key terms from Step 3
- Output: full NDA draft
- Key focus: a complete, party-tailored, jurisdiction-aware draft

**Step 5: Refine and Ship the Draft** (uses: legal-nda)

Present the NDA draft and ask whether to ship it for counsel review or refine it.
If the user wants changes, gather feedback, re-run the draft incorporating the
brief and key terms plus the feedback, and re-present (loop up to three times).
When approved, assemble the NDA Pack: form, brief, key terms, and the NDA draft,
marked DRAFT requiring counsel review before execution.

- Input: NDA draft from Step 4, key terms from Step 3, user feedback
- Output: assembled NDA Pack marked DRAFT pending counsel review
- Key focus: deliver one pack with the counsel-review gate clearly stated
