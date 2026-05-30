---
name: wayland-deal-forensic
description: >-
  Diagnose a stuck deal end-to-end: surface the real objection behind the
  stated one, identify the lock that is actually blocking the deal, and
  prescribe the specific next move with exact wording and timing.

  Use when the user has a single deal that has stalled and wants a structured
  diagnosis plus a concrete next-move prescription.

  Do NOT use for reviewing a whole pipeline at once (use
  wayland-pipeline-batch-review) or for building reusable objection responses
  (use wayland-objection-library-build).
license: Apache-2.0
type: workflow
skills: "sales-coach sales-qualify sales-objections sales-followup"
metadata:
  author: wayland
  version: 1.0.0
  tags: sales deal-diagnosis objections forensics step-by-step
  category: sales
  depends: "sales-coach sales-qualify sales-objections sales-followup"
---
# Deal Forensic

**Estimated time:** 15-25 minutes

This workflow diagnoses one stuck deal. The surface objection a prospect gives
is rarely the real one. The job here is to find where the deal actually is,
which lock (Want, Trust, or Excuse) is blocking it, and the single next move
that has the best chance of unsticking it. The output is a short forensic memo:
true stage, blocking lock, diagnosis, and a prescribed next move with exact
wording and an exact day to send it.

Run the sales-coach agent throughout. Each step builds on the captured outputs
of the prior steps.

## Steps

**Step 1: Gather the Deal Context** (uses: sales-coach)

Ask the user to paste the full context for the stuck deal: the deal record,
the email thread, a call transcript, or their own summary. Make sure you learn
the prospect, the offer, the current stage, and how long the deal has been
stuck. Do not proceed until you have enough to reason about the deal. This is an
interactive step: ask, then wait for the paste before continuing.

- Input: user-provided deal record, thread, transcript, or summary
- Output: deal_context (the consolidated raw context for the deal)
- Key focus: capture the real situation, including how long it has been stalled

**Step 2: Infer the True Stage** (uses: sales-qualify)

Using the deal context, infer where the deal really is in the buying process,
not what the CRM stage label says. State the inferred true stage clearly and
give your reasoning. Present it to the user as an inference they can confirm or
override, since they may know something you do not.

- Input: deal_context from Step 1
- Output: true_stage (the real stage of the deal, plus reasoning)
- Key focus: separate the CRM label from where the buyer actually is

**Step 3: Infer the Blocking Lock** (uses: sales-objections)

Using the deal context and the inferred true stage, infer which of the Three
Locks is blocking the deal: Want, Trust, or Excuse. The surface objection is
not always the real one. State the inferred blocking lock and your reasoning,
and invite the user to confirm or override.

- Input: deal_context from Step 1, true_stage from Step 2
- Output: blocking_lock (Want / Trust / Excuse, plus reasoning)
- Key focus: identify the real blocker beneath the stated objection

**Step 4: Run the Full Diagnosis** (uses: sales-objections)

Produce a full diagnosis of the deal: the surface objection versus the real
objection, the lock blocking the deal, and an honest probability assessment of
closing. Use the deal context, the true stage, and the blocking lock as inputs.
Show the diagnosis to the user.

- Input: deal_context from Step 1, true_stage from Step 2, blocking_lock from Step 3
- Output: diagnosis (surface vs real objection, blocking lock, win probability)
- Key focus: a clear-eyed read of what is actually killing the deal

**Step 5: Review and Refine the Diagnosis** (uses: sales-objections)

Show the diagnosis and ask the user whether to proceed to the next-move
prescription or refine the diagnosis with more context. If they have more
context, fold their feedback back into the diagnosis (up to three refinement
passes) and re-present it. Once they are satisfied, advance to the prescription.

- Input: diagnosis from Step 4, user refinement feedback
- Output: confirmed diagnosis ready for prescription
- Key focus: let the user correct the diagnosis before you prescribe a move

**Step 6: Prescribe the Next Move** (uses: sales-followup)

Prescribe the single specific next move to unstick the deal, given the
confirmed diagnosis and the blocking lock. Include the exact wording to send or
say, the channel, and the exact day to send it. Show the prescription to the
user.

- Input: diagnosis from Step 4, blocking_lock from Step 3
- Output: prescription (specific next move, exact wording, exact day)
- Key focus: one concrete, sendable move tuned to the blocking lock

**Step 7: Final Review and Ship the Memo** (uses: sales-followup)

Show the prescription and ask the user to ship the deal-forensic memo or refine
the prescription. If they want changes, fold their feedback in (up to three
passes) and re-present. When they ship, assemble the final forensic memo with:
true stage, blocking lock, context, diagnosis, and prescription.

- Input: prescription from Step 6, deal_context, true_stage, blocking_lock, diagnosis, user feedback
- Output: forensic_memo (the assembled Deal Forensic Memo)
- Key focus: deliver a tight memo the user can act on immediately

## Expected Outcome

A Deal Forensic Memo containing the true stage, the blocking lock, the deal
context, the full diagnosis, and a prescribed next move with exact wording and
timing.
