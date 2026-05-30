---
name: wayland-contract-review
description: >-
  Triage a contract end-to-end: identify the contract type, run a clause-by-clause
  risk review with severity flags, propose red-lines, and produce a counsel-routing
  list of clauses that require attorney sign-off before execution.

  Use when the user wants a structured, multi-step legal triage of a contract before
  signing, including red-line suggestions and an escalation list for counsel.

  Do NOT use for a single quick question about one clause, or as a substitute for
  licensed legal advice. This produces drafts and triage only; counsel review is required.
license: Apache-2.0
type: workflow
skills: "legal-contract"
metadata:
  author: wayland
  version: 1.0.0
  tags: legal contract review red-line counsel step-by-step business-legal
  category: business-legal
  depends: ""
---
# Contract Review

**Estimated time:** 20-30 minutes

This workflow triages a contract before it is signed. It identifies the contract
type, performs a clause-by-clause review with red/yellow/green severity flags,
proposes concrete red-lines, and builds a counsel-routing list naming every clause
that requires attorney sign-off before execution.

This is triage and drafting support. It does not replace a licensed attorney. The
final deliverable is a Contract Review Memo whose counsel-routing section is a
required gate before the contract is executed.

## When to Use

- User wants a structured triage of a contract before signing
- User wants risky clauses flagged with severity and red-line suggestions
- User needs to know which clauses to escalate to counsel
- Do NOT use for a one-off question about a single clause
- Do NOT use as a replacement for licensed legal advice

## Steps

**Step 1: Intake the Contract** (uses: legal-contract)

Ask the user to paste the full contract text (or provide a path to the file).
Request the specifics that change the risk profile: the counterparty, the
governing jurisdiction, the dollar value at stake, and any specific concerns the
user already has. Do not proceed until you have the contract body and at least
the jurisdiction and counterparty.

- Input: contract text or file path, counterparty, jurisdiction, dollar value, stated concerns
- Output: captured contract input and context for review
- Key focus: gather enough context to assess risk before reviewing

**Step 2: Identify the Contract Type** (uses: legal-contract)

Infer the contract type (e.g. MSA, SOW, license, vendor agreement, employment,
lease) and the standard structure baseline a contract of that type should follow.
State the inferred type plainly, give the reasoning, and ask the user to confirm
or override before continuing. Use the standard baseline as the yardstick for the
clause review in the next step.

- Input: contract input from Step 1
- Output: confirmed contract type and standard-structure baseline
- Key focus: anchor the review to the right contract archetype

**Step 3: Run a Clause-by-Clause Review** (uses: legal-contract)

Review the contract clause by clause against the type baseline. For each material
clause, assign a severity flag: red (blocking risk, must change before signing),
yellow (negotiate or clarify), or green (acceptable as written). Note missing
clauses that the baseline expects. Surface the full flagged review to the user.

- Input: contract input from Step 1, contract type from Step 2
- Output: clause-by-clause review with red/yellow/green severity flags and missing-clause notes
- Key focus: every material clause gets a severity flag and a one-line rationale

**Step 4: Refine the Review with the User** (uses: legal-contract)

Present the flagged review and ask whether to proceed to the red-line memo or
drill into specific clauses. If the user wants to refine, gather their feedback,
re-run the clause review on the targeted clauses incorporating that feedback, and
re-present. Loop up to three times until the user is satisfied, then proceed.

- Input: review from Step 3, user refinement feedback
- Output: finalized clause review approved by the user
- Key focus: let the user drill into clauses before drafting red-lines

**Step 5: Propose Red-Lines** (uses: legal-contract)

For every red and yellow clause, draft concrete red-line proposals: the suggested
replacement or amended language, with a short rationale per change. Keep proposals
specific and paste-ready so the user can take them into negotiation. Surface the
red-line set to the user.

- Input: finalized review from Step 4, contract input from Step 1
- Output: red-line proposals with replacement language and rationale per clause
- Key focus: concrete, paste-ready amended language, not vague advice

**Step 6: Build the Counsel-Routing List** (uses: legal-contract)

Build the escalation list: which clauses require licensed-attorney sign-off before
the contract is signed, and why. Cover jurisdiction-specific enforceability,
indemnity and liability caps, IP assignment, and anything flagged red. This is the
required gate before execution.

- Input: finalized review from Step 4, red-lines from Step 5
- Output: counsel-routing list of clauses requiring attorney sign-off, with reasons
- Key focus: clearly mark which clauses block execution until counsel signs off

**Step 7: Finalize and Ship the Memo** (uses: legal-contract)

Present the counsel-routing list and ask whether to ship the memo or refine the
routing. If the user wants changes, gather feedback, re-run the routing step, and
re-present (loop up to two times). When approved, assemble the final Contract
Review Memo: contract type, clause-by-clause review, suggested red-lines, and the
counsel-routing section marked REQUIRED before execution.

- Input: counsel-routing list from Step 6, red-lines from Step 5, user feedback
- Output: final Contract Review Memo with the counsel-routing gate
- Key focus: deliver one assembled memo with the execution gate clearly stated
