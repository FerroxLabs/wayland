---
name: wayland-launch-readiness-audit
description: >-
  Pre-launch readiness audit workflow. Builds a required-asset checklist for the
  launch type, runs a gap analysis with severity flags against what is already
  built, and produces a go/no-go recommendation with rationale.

  Use when the user wants a structured pre-launch audit to decide whether the
  launch is ready to go.

  Do NOT use when the user wants to build launch assets from scratch (use the
  full launch workflow) or has a single quick question.
license: Apache-2.0
type: workflow
skills: "launch"
metadata:
  author: wayland
  version: 1.0.0
  tags: marketing launch audit readiness step-by-step go-no-go
  category: marketing
  depends: "launch"
---
# Launch Readiness Audit

**Estimated time:** 15-25 minutes

This workflow audits launch readiness: what is done, what is missing, and what is
risky, ending in a go/no-go decision with rationale. Keep the interaction budget
small (about 4 user touchpoints) by gathering status once and only pausing at the
review gates.

**Step 1: Kickoff and Capture Status** (uses: launch)

Tell the user you will audit launch readiness: what is done, what is missing,
what is risky. Ask them for the launch date, what is already built (have them
paste an asset list), and what is still in progress. Gather this before
proceeding.

- Input: user goal
- Output: status_brief (launch date, built assets, in-progress items)
- Key focus: a complete picture of current launch state

**Step 2: Infer the Required Asset Checklist** (uses: launch)

From the status brief, infer the required asset checklist for this launch type:
everything a launch of this shape needs to succeed. Present the checklist and a
short reasoning. Proceed with it once confirmed.

- Input: status_brief
- Output: required_assets (required asset checklist + reasoning)
- Key focus: define the full bar the launch must clear

**Step 3: Run the Gap Analysis** (uses: launch)

Compare the status brief against the required assets in gap-analysis mode.
Produce the gap analysis with a severity flag on each gap (for example blocker,
high, medium, low). Show the output.

- Input: status_brief, required_assets
- Output: gaps (gap analysis with severity flags)
- Key focus: surface every missing or risky asset with severity

**Step 4: Review Gaps Gate** (uses: launch)

Show the gap analysis with severity flags. Ask the user to proceed to the
go/no-go decision matrix or refine the gap analysis. On refinement, gather
feedback and re-run the gap analysis with that feedback and the status, up to 2
times, then continue.

- Input: gaps, user decision
- Output: approved gaps or refinement feedback
- Key focus: agree on the gaps before deciding go/no-go

**Step 5: Go/No-Go Recommendation** (uses: launch)

From the gaps and the status brief, produce a go/no-go recommendation in
go-no-go-recommendation mode, with explicit rationale tied to the severity of the
remaining gaps. Show the output.

- Input: gaps, status_brief
- Output: recommendation (go/no-go recommendation with rationale)
- Key focus: a defensible launch/hold decision

**Step 6: Final Review and Ship the Audit** (uses: launch)

Show the go/no-go recommendation with rationale. Ask the user if they want to
ship the readiness audit. If they want changes, gather feedback and re-run the
go/no-go step with the feedback and gaps, up to 2 times. When approved, assemble
the final readiness audit combining status, required assets, gap analysis, and
the go/no-go recommendation into one document.

- Input: recommendation, all prior outputs, user decision
- Output: readiness_audit (assembled readiness audit)
- Key focus: deliver one clear readiness verdict
