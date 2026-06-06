---
name: wayland-re-launch
description: >-
  Re-launch planning workflow. Takes a prior launch's results, infers the
  priority fix list, builds a structured debrief of what worked versus what did
  not, and produces a relaunch plan with the specific changes to make next time.

  Use when the user has already run a launch and wants a structured process to
  debrief it and plan the relaunch.

  Do NOT use for a first-time launch with no prior results (use the full launch
  workflow) or a single quick question.
license: Apache-2.0
type: workflow
skills: "launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing launch relaunch debrief step-by-step planning
  category: marketing
  depends: "launch"
---
# Re-launch

**Estimated time:** 30-45 minutes

This workflow plans a re-launch from a prior launch's results: debrief, fix list,
relaunch plan. Keep the interaction budget small (about 5 user touchpoints) by
gathering the prior data once and only pausing at the review gates.

**Step 1: Kickoff and Capture Prior Launch Data** (uses: launch)

Tell the user you will plan a re-launch. Ask them to paste the prior launch's
results: revenue, conversion stages, what worked, and what did not. A debrief doc
is even better. Gather this before proceeding.

- Input: user goal
- Output: prior_launch_data (prior results, conversion stages, what worked/did not)
- Key focus: capture honest prior-launch data to plan against

**Step 2: Infer the Fix Priorities** (uses: launch)

From the prior launch data, infer the priority fix list: what most needs to
change for the relaunch. Present the inferred priorities and a short reasoning.
Proceed with them once confirmed.

- Input: prior_launch_data
- Output: fix_priorities (priority fix list + reasoning)
- Key focus: focus the relaunch on the highest-leverage changes

**Step 3: Build the Structured Debrief** (uses: launch)

Build a structured debrief from the prior data and fix priorities, in
structured-debrief mode: a clear what-worked versus what-did-not breakdown with
evidence from the numbers. Show the output.

- Input: prior_launch_data, fix_priorities
- Output: debrief (structured what-worked vs what-did-not debrief)
- Key focus: separate signal from noise in the prior launch

**Step 4: Review Debrief Gate** (uses: launch)

Show the structured debrief. Ask the user to proceed to the relaunch plan or
refine the debrief. On refinement, gather feedback and re-run the debrief with
that feedback and the prior data, up to 2 times, then continue.

- Input: debrief, user decision
- Output: approved debrief or refinement feedback
- Key focus: agree on the diagnosis before planning the fix

**Step 5: Build the Relaunch Plan** (uses: launch)

Build the relaunch plan from the debrief and the fix priorities, in
relaunch-plan mode: the specific changes to make versus the prior launch, with
the rationale tied back to the debrief. Show the output.

- Input: debrief, fix_priorities
- Output: relaunch_plan (relaunch plan with specific changes)
- Key focus: a concrete change list, not a generic re-run

**Step 6: Final Review and Ship the Memo** (uses: launch)

Show the relaunch plan with the specific changes from the prior launch. Ask the
user if they want to ship the relaunch memo. If they want changes, gather
feedback and re-run the relaunch plan step with the feedback and debrief, up to 3
times. When approved, assemble the relaunch memo combining prior launch results,
debrief, fix priorities, and the relaunch plan into one document.

- Input: relaunch_plan, all prior outputs, user decision
- Output: relaunch_memo (assembled relaunch memo)
- Key focus: deliver one decision-ready relaunch memo
