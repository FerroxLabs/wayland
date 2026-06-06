---
name: business-ops-operations-handbook
description: >-
  Build the operations handbook that documents how the company actually runs:
  operating cadences, decision rights, escalation paths, and the remaining
  operational sections. This is the operations handbook, distinct from an HR
  handbook.

  Use when the user wants a structured, multi-step build of a company operations
  handbook covering cadences, decision rights, and escalation.

  Do NOT use for an HR or employee policy handbook, or for a single section that
  one atomic skill can draft on its own.
license: Apache-2.0
type: workflow
skills: "ops-handbook"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-ops handbook operations decision-rights step-by-step
  category: Business Operations
  depends: "ops-handbook"
---
# Build the Operations Handbook

**Estimated time:** 60-90 minutes

This workflow builds the operations handbook: how the company runs day to day,
who decides what, and how problems escalate. It is the operations handbook, not
the HR handbook. The build proceeds through operating cadences, the decision
rights matrix, escalation paths, and the remaining operational sections, then
assembles them into one document. Review and refine each section before
advancing.

## Steps

**Step 1: Capture the Company Brief**

Open by telling the user you will build the operations handbook (how the company
runs day to day, distinct from an HR handbook), then ask them for: company stage,
headcount, key functions, and any existing operating cadence such as weekly
reviews or monthly business reviews. Ask these as a single grouped question and
wait for the answer. Record the response verbatim as the brief.

- Input: user description of stage, headcount, functions, existing cadences
- Output: a captured company brief
- Key focus: anchor every later section in the company's actual stage and size

**Step 2: Infer the Required Sections** (uses: ops-handbook)

From the brief, infer which handbook sections this company needs at its current
stage. List the inferred sections and give a one-paragraph reasoning. Surface the
inference to the user so they can add or remove sections before you build them.

- Input: company brief from Step 1
- Output: the list of required handbook sections with reasoning
- Key focus: right-size the handbook to the stage, no premature bureaucracy

**Step 3: Build the Operating Cadences** (uses: ops-handbook)

Build the operating cadences: the weeklies, monthlies, and quarterlies, each with
its purpose, owner, attendees, and inputs and outputs. Show the cadences to the
user and ask whether to refine them or proceed to decision rights. If they ask
for changes, revise against their feedback and show them again. Allow up to two
refinement passes.

- Input: company brief from Step 1, required sections from Step 2, user refinement feedback
- Output: a reviewed set of operating cadences (weekly, monthly, quarterly)
- Key focus: each meeting has a clear purpose, owner, and output

**Step 4: Build the Decision Rights Matrix** (uses: ops-handbook)

Build the decision rights matrix: for each major decision type, define who is
responsible, who is accountable, who is consulted, and who is informed. Use the
required sections from Step 2 to scope which decision types to cover. Show the
matrix to the user.

- Input: company brief from Step 1, required sections from Step 2
- Output: a decision rights matrix mapping decision types to roles
- Key focus: no ambiguous ownership; every major decision has one accountable owner

**Step 5: Build the Escalation Paths** (uses: ops-handbook)

Build the escalation paths: when and how an issue moves up, who it goes to at each
level, and the response-time expectation at each level. Show the decision rights
matrix and escalation paths together to the user and ask whether to refine them
or proceed to the remaining sections. If they ask for changes, revise the
escalation paths against their feedback and show them again. Allow up to two
refinement passes.

- Input: company brief from Step 1, decision rights matrix from Step 4, user refinement feedback
- Output: a reviewed set of escalation paths with levels and response times
- Key focus: a clear, fast path from a stuck problem to the person who can unstick it

**Step 6: Build the Remaining Sections** (uses: ops-handbook)

Build the remaining operational sections identified in Step 2, such as tooling,
communication norms, and on-call rotation. Show them to the user and ask whether
to refine them or ship the handbook. If they ask for changes, revise against
their feedback and show them again. Allow up to two refinement passes.

- Input: company brief from Step 1, required sections from Step 2, user refinement feedback
- Output: a reviewed set of remaining operational sections
- Key focus: cover the operational glue (tooling, comms, on-call) the stage needs

**Step 7: Assemble and Ship the Operations Handbook**

Assemble the final operations handbook as a single document with sections for
cadences, decision rights, escalation paths, and the remaining operational
sections. Confirm the handbook is complete and hand it to the user.

- Input: brief, required sections, cadences, decision rights, escalation, remaining sections from prior steps
- Output: the assembled operations handbook document
- Key focus: one authoritative document for how the company runs
