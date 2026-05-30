---
name: business-ops-runbook-generator
description: >-
  Build an operational runbook with rollback paths for a recurring task or
  incident: capture the brief, infer failure modes, draft the runbook steps and
  checks, then define a rollback path for each failure mode.

  Use when the user wants a step-by-step runbook that an operator can follow
  under pressure, including what to do when a step fails.

  Do NOT use for documenting a stable, low-risk process with no failure or
  rollback concerns; use the SOP workflow for that.
license: Apache-2.0
type: workflow
skills: "ops-process-doc"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-ops runbook incident rollback step-by-step
  category: Business Operations
  depends: "ops-process-doc"
---
# Build a Runbook with Rollback Paths

**Estimated time:** 20-30 minutes

This workflow produces an operational runbook for a recurring task or incident
response, with an explicit rollback path for every way the task can fail. It
captures the brief, infers the failure modes, drafts the runbook steps and
checks, and then pairs each failure mode with a recovery action. Review and
refine each step before advancing.

## Steps

**Step 1: Capture the Runbook Brief**

Open by telling the user you will build a runbook with rollback paths, then ask
them for: what task or incident the runbook covers, who runs it, what could go
wrong, and the current pain. Ask these as a single grouped question and wait for
the answer. Record the response verbatim as the brief.

- Input: user description of the task or incident, operator, known risks, current pain
- Output: a captured runbook brief
- Key focus: scope the exact task or incident before generating anything

**Step 2: Infer the Failure Modes** (uses: ops-process-doc)

From the brief, infer the concrete ways this task can fail. List each failure
mode and give a one-paragraph reasoning. State explicitly that the runbook will
need a rollback path for each mode. Surface the inference to the user so they can
add or correct failure modes before you draft the runbook.

- Input: runbook brief from Step 1
- Output: an enumerated list of failure modes with reasoning
- Key focus: each failure mode is specific enough to design a recovery for

**Step 3: Draft the Runbook** (uses: ops-process-doc)

Draft the full runbook: an ordered sequence of execution steps, each with the
action to take and a verification check that confirms the step succeeded before
moving on. Show the draft to the user and ask whether to refine it or proceed to
rollback paths. If they ask for changes, revise the runbook against their
feedback and show it again. Allow up to three refinement passes.

- Input: runbook brief from Step 1, failure modes from Step 2, user refinement feedback
- Output: a reviewed runbook draft (ordered steps plus per-step verification checks)
- Key focus: every step has an action and a check, so the operator never guesses

**Step 4: Define Rollback Paths** (uses: ops-process-doc)

For each failure mode from Step 2 and each runbook step that can fail, define the
rollback path: exactly what to do if that step fails, how to restore a known-good
state, and who to escalate to. Show the rollback paths to the user and ask
whether to refine them or ship the runbook. If they ask for changes, revise
against their feedback and show them again. Allow up to two refinement passes.

- Input: runbook from Step 3, failure modes from Step 2, user refinement feedback
- Output: a reviewed rollback path for each failure mode and risky step
- Key focus: a clear, safe recovery for every way the task can go wrong

**Step 5: Assemble and Ship the Runbook Package**

Assemble the final deliverable as a single document containing: the brief, the
failure modes, the runbook, and the rollback paths. Confirm the package is
complete and hand it to the user.

- Input: brief, failure modes, runbook, rollback paths from prior steps
- Output: the assembled runbook package document
- Key focus: one operator-ready artifact covering both the happy path and recovery
