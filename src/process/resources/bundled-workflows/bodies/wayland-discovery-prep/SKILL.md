---
name: wayland-discovery-prep
description: >-
  Prep a tailored discovery call end-to-end: research the prospect, assess ICP
  fit, build a tailored call script, and surface the red flags to listen for.

  Use when the user has an upcoming discovery call with a specific prospect and
  wants a tailored script plus a disqualification checklist before the call.

  Do NOT use for building a cold outreach sequence (use wayland-outreach-build)
  or for diagnosing a deal that has already stalled (use wayland-deal-forensic).
license: Apache-2.0
type: workflow
skills: "sales-coach sales-research sales-icp sales-prep sales-qualify"
metadata:
  author: wayland
  version: 1.0.0
  tags: sales discovery call-prep research qualification step-by-step
  category: sales
  depends: "sales-coach sales-research sales-icp sales-prep sales-qualify"
---
# Discovery Prep

**Estimated time:** 20-30 minutes

This workflow prepares the user for a specific discovery call. The output is a
tailored script with red flags called out: a tailored opening, qualifying
questions, transition cues, plus what to listen for and what to disqualify on.

Run the sales-coach agent throughout. Each step feeds the next.

## Steps

**Step 1: Capture the Prospect Brief** (uses: sales-coach)

Ask the user for the prospect (name, company, role), what they are selling, and
the call's scheduled date. This is an interactive step: ask, then wait for the
brief before continuing. Do not proceed until you have the prospect, the offer,
and the date.

- Input: user-provided prospect and offer details
- Output: prospect_brief (prospect identity, offer, call date)
- Key focus: enough specificity to research and tailor a script

**Step 2: Research the Prospect** (uses: sales-research)

Research the prospect and their company from the brief: company context, the
role and likely priorities of the person, recent signals, and anything that
shapes how to run the call. Show the research to the user.

- Input: prospect_brief from Step 1
- Output: prospect_research (company and contact research)
- Key focus: concrete, call-usable facts, not generic background

**Step 3: Assess ICP Fit** (uses: sales-icp)

Using the research and the offer, assess how well this prospect fits the ideal
customer profile. State the ICP fit assessment and your reasoning, and present
it as an inference the user can confirm or override based on what they know that
you do not.

- Input: prospect_research from Step 2, offer from prospect_brief
- Output: icp_fit (fit assessment plus reasoning)
- Key focus: an honest fit read that shapes how hard to qualify on the call

**Step 4: Build the Discovery Script** (uses: sales-prep)

Build a tailored discovery script: a tailored opening, qualifying questions
ordered for the call, and transition cues between sections. Use the research,
the ICP fit, and the brief. Show the script to the user.

- Input: prospect_research from Step 2, icp_fit from Step 3, prospect_brief from Step 1
- Output: discovery_script (opening, qualifying questions, transitions)
- Key focus: a script tailored to this prospect, not a generic template

**Step 5: Review and Refine the Script** (uses: sales-prep)

Show the script and ask the user to refine it or proceed to the red-flag
analysis. If they want changes, fold their feedback back into the script (up to
three passes) and re-present. Once approved, advance to red flags.

- Input: discovery_script from Step 4, user refinement feedback
- Output: approved discovery_script
- Key focus: let the user shape the script before the call

**Step 6: Surface the Red Flags** (uses: sales-qualify)

Run a red-flag check using the research and the ICP fit. Produce what to listen
for on the call and what to disqualify on. Show the red flags to the user.

- Input: prospect_research from Step 2, icp_fit from Step 3
- Output: red_flags (signals to watch, disqualification criteria)
- Key focus: protect the user from chasing a bad-fit deal

**Step 7: Final Review and Ship the Prep Brief** (uses: sales-qualify)

Show the red flags and ask the user to ship the discovery prep brief or refine
the red flags. If they want changes, fold their feedback in (up to two passes)
and re-present. When they ship, assemble the prep brief: prospect, research, ICP
fit, discovery script, and red flags.

- Input: red_flags from Step 6, prospect_brief, research, icp_fit, script, user feedback
- Output: discovery_prep_brief (the assembled Discovery Prep Brief)
- Key focus: deliver a single brief the user can walk into the call with

## Expected Outcome

A Discovery Prep Brief containing the prospect, the research, the ICP fit
assessment, a tailored discovery script, and the red flags to watch for.
