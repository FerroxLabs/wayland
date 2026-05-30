---
name: wayland-employment-package
description: >-
  Build an employment agreement bundle: offer letter with at-will language, IP
  assignment, and restrictive covenants (non-compete / non-solicit) checked against
  the jurisdiction's enforceability rules, ready for counsel review.

  Use when the user wants a structured, multi-step process to assemble a full
  employment-agreement package and needs jurisdictional non-compete flags surfaced.

  Do NOT use for a single quick offer letter with no IP or restrictive terms, or as
  a substitute for licensed legal advice. Outputs are drafts; counsel review is required.
license: Apache-2.0
type: workflow
skills: "legal-employment"
metadata:
  author: wayland
  version: 1.0.0
  tags: legal employment offer ip-assignment non-compete step-by-step business-legal
  category: business-legal
  depends: ""
---
# Employment Package

**Estimated time:** 20-30 minutes

This workflow assembles an employment agreement bundle: an offer letter with
at-will language, an IP assignment, and restrictive covenants (non-compete and
non-solicit) checked against the hiring jurisdiction's enforceability rules.
State matters enormously here: California, Massachusetts, and several other
states sharply limit or void non-competes.

The deliverable is a set of drafts. Counsel review is required before any offer
is extended.

## When to Use

- User wants a complete employment-agreement bundle, not just one document
- User needs jurisdiction-specific non-compete enforceability flags
- User wants offer + IP assignment + restrictive covenants assembled together
- Do NOT use for a single standalone offer letter with no IP or restrictive terms
- Do NOT use as a replacement for licensed legal advice

## Steps

**Step 1: Intake the Hiring Brief** (uses: legal-employment)

Ask the user for the inputs that drive the bundle: the role and level, the
jurisdiction (state matters a lot for non-compete enforceability), whether the
person is full-time or a contractor, and whether equity is included. Do not
proceed until you have at least the role, jurisdiction, and worker classification.

- Input: role / level, jurisdiction, full-time vs contractor, equity inclusion
- Output: captured hiring brief
- Key focus: capture the jurisdiction and worker classification up front

**Step 2: Flag Jurisdictional Constraints** (uses: legal-employment)

Infer the jurisdictional flags for this employment relationship from the brief.
Call out non-compete limits explicitly: California, Massachusetts, and other
states with strict or void-by-default non-compete rules. State the flags, explain
the reasoning, and add the explicit caution that these must be reviewed with
counsel. Carry these flags into the offer and restrictive-covenant steps.

- Input: hiring brief from Step 1
- Output: jurisdictional flags, with non-compete enforceability called out
- Key focus: surface state-specific non-compete and wage-law constraints early

**Step 3: Draft the Offer Letter with At-Will** (uses: legal-employment)

Draft the offer letter incorporating at-will employment language appropriate to
the jurisdiction. Include role, compensation, start terms, and equity if present.
Apply any jurisdictional flags from Step 2 to the at-will and offer terms. Surface
the draft to the user.

- Input: hiring brief from Step 1, jurisdictional flags from Step 2
- Output: offer letter draft with at-will language
- Key focus: jurisdiction-appropriate at-will language and complete offer terms

**Step 4: Draft the IP Assignment** (uses: legal-employment)

Draft the IP assignment agreement assigning work product to the employer, with
the usual carve-outs (prior inventions, jurisdiction-mandated exclusions such as
state inventor-protection statutes). Surface the draft to the user.

- Input: hiring brief from Step 1
- Output: IP assignment draft with appropriate carve-outs
- Key focus: complete assignment with statutory carve-outs for the jurisdiction

**Step 5: Review Core Docs with the User** (uses: legal-employment)

Present the offer letter and IP assignment together and ask whether to proceed to
restrictive covenants or refine the core docs. If the user wants changes, gather
feedback, re-run the IP assignment draft incorporating it, and re-present (loop up
to two times). When approved, proceed.

- Input: offer letter from Step 3, IP assignment from Step 4, user feedback
- Output: approved offer letter and IP assignment
- Key focus: lock the core docs before adding restrictive covenants

**Step 6: Draft Restrictive Covenants with Jurisdictional Check** (uses: legal-employment)

Draft the restrictive covenants (non-compete, non-solicit, non-disclosure) and run
each against the jurisdictional flags from Step 2. For each covenant, mark whether
it is enforceable, narrow-to-enforce, or void in the jurisdiction, and adjust scope
and duration accordingly. Surface the draft with the enforceability flags to the
user.

- Input: hiring brief from Step 1, jurisdictional flags from Step 2
- Output: restrictive covenants draft with per-covenant enforceability flags
- Key focus: every covenant carries an explicit enforceability verdict for the state

**Step 7: Finalize and Ship the Bundle** (uses: legal-employment)

Present the restrictive covenants and ask whether to ship the bundle for counsel
review or refine the covenants. If the user wants changes, gather feedback, re-run
the covenants step, and re-present (loop up to two times). When approved, assemble
the bundle: brief, jurisdiction flags, offer letter, IP assignment, and restrictive
covenants, marked as DRAFTS requiring counsel review before extending the offer.

- Input: restrictive covenants from Step 6, all prior outputs, user feedback
- Output: assembled employment bundle marked DRAFTS pending counsel review
- Key focus: deliver one bundle with the counsel-review gate clearly stated
