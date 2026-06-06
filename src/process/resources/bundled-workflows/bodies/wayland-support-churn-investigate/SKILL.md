---
name: wayland-support-churn-investigate
description: >-
  Investigate customer churn end to end: gather the brief, infer hypotheses to
  test, run a full investigation, synthesize a root cause, then build an action
  plan and ship the report.

  Use when the user wants a structured, multi-step process to diagnose churn root
  causes and produce an action plan they review as it is built.

  Do NOT use for a single churn-rate lookup or a one-line guess that one atomic
  skill can answer.
license: Apache-2.0
type: workflow
skills: "support-churn-investigate support-nps-analysis"
metadata:
  author: wayland
  version: 1.0.0
  tags: support churn retention root-cause action-plan step-by-step
  category: support
  depends: "support-churn-investigate support-nps-analysis"
---
# Investigate Churn

**Estimated time:** 30-45 minutes

This workflow diagnoses customer churn: it gathers the brief, infers hypotheses,
runs a full investigation, synthesizes a root cause, and builds an action plan,
ending in a shipped churn report. It is interactive: the user reviews and refines
the investigation, then reviews and refines the action plan before shipping.

## Steps

**Step 1: Kick Off and Capture the Brief** (uses: support-churn-investigate)

Ask the user for the churn-rate trend, a list of recently churned customers (or
pasted exit feedback), and any cohort or segment pattern they have noticed.
Capture this verbatim as the brief. Do not proceed until you have at least the
churn trend and some churned-customer signal.

- Input: user-provided churn trend, churned-customer list or exit feedback, segment patterns
- Output: brief
- Key focus: get the trend plus real churned-customer signal before hypothesizing

**Step 2: Infer Hypotheses to Test** (uses: support-churn-investigate)

Using the support-churn-investigate skill, infer the churn hypotheses worth
testing, in priority order. State the inferred hypotheses and the reasoning. Ask
the user to confirm or add hypotheses they suspect from internal signals. Capture
the resulting hypotheses.

- Input: brief from Step 1
- Output: hypotheses (priority-ordered)
- Key focus: prioritize the hypotheses and let the user add internal-signal ones

**Step 3: Run the Investigation** (uses: support-churn-investigate)

Using the support-churn-investigate skill in full-investigation mode with the
brief and the hypotheses, investigate each hypothesis and produce findings. Show
the full investigation findings to the user.

- Input: brief from Step 1, hypotheses from Step 2
- Output: investigation findings
- Key focus: test every hypothesis and record what the evidence shows for each

**Step 4: Review the Investigation** (uses: support-churn-investigate)

Present the investigation findings and ask the user whether to refine them or
proceed to root-cause analysis. If the user wants changes, gather specific
refinement feedback and re-run Step 3 with that feedback plus the prior findings
and the hypotheses, looping up to 3 times until the user is satisfied. When
satisfied, advance.

- Input: investigation findings from Step 3, user decision and refinement feedback
- Output: approved investigation findings
- Key focus: loop on the investigation only until the user approves (max 3 iterations)

**Step 5: Synthesize the Root Cause** (uses: support-nps-analysis)

Using the support-nps-analysis skill in root-cause-synthesis mode with the
approved investigation, synthesize the root cause of the churn from the findings.
Show the root-cause synthesis to the user.

- Input: approved investigation findings from Step 4
- Output: root cause
- Key focus: converge the findings into a single defensible root cause

**Step 6: Build the Action Plan** (uses: support-churn-investigate)

Using the support-churn-investigate skill in action-plan mode with the root cause
and the investigation, build a concrete action plan to address the root cause.
Show the full action plan to the user.

- Input: root cause from Step 5, approved investigation findings from Step 4
- Output: action plan
- Key focus: every action ties back to the root cause and is concretely owned

**Step 7: Final Review and Ship the Report** (uses: support-churn-investigate)

Present the root-cause synthesis and the action plan and ask the user whether to
ship the investigation report or refine the action plan. If they want changes,
gather feedback and re-run Step 6 with that feedback plus the root cause, looping
up to 2 times. When approved, assemble the churn report with these sections:
Brief, Hypotheses, Investigation, Root Cause, Action Plan.

- Input: action plan from Step 6, root cause from Step 5, user decision
- Output: churn report (assembled)
- Key focus: assemble the five-section report only after the user ships
