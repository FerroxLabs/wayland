---
name: business-ops-sop-generator
description: >-
  Build a standard operating procedure end to end: capture the process brief,
  infer its shape, draft the SOP, derive a run checklist, and define the metrics
  that prove it is working.

  Use when the user wants to turn a fuzzy, in-someone's-head process into a
  documented, repeatable SOP with a checklist and success metrics.

  Do NOT use for a single quick edit to an existing SOP, or when the user only
  needs a one-line answer rather than a structured multi-step build.
license: Apache-2.0
type: workflow
skills: "ops-process-doc ops-sop ops-checklist"
metadata:
  author: wayland
  version: 1.0.0
  tags: business-ops sop process documentation step-by-step
  category: Business Operations
  depends: "ops-process-doc ops-sop ops-checklist"
---
# Build an SOP

**Estimated time:** 20-30 minutes

This workflow turns an undocumented or tribal-knowledge process into a clean,
repeatable Standard Operating Procedure. It captures the process, infers its
structure, drafts the procedure, derives a run checklist, and defines the
metrics that tell you the SOP is actually working. Treat each step's output as
the input to the next; review and refine a step before advancing.

## Steps

**Step 1: Capture the Process Brief**

Open by telling the user you will build an SOP for this process, then ask them
for: what process this covers, how frequently it runs, who runs it today, and
where the pain is. Ask these as a single grouped question and wait for the
answer. Record the response verbatim as the brief; it is the source material
for every later step.

- Input: user description of the process, frequency, current owner, pain points
- Output: a captured process brief
- Key focus: get a concrete, specific process scope before generating anything

**Step 2: Infer the Process Shape** (uses: ops-process-doc)

From the brief, infer whether the process is linear, branching, or cyclical.
State the inferred shape clearly and give a one-paragraph reasoning for why the
process fits that shape. Surface the inference to the user as a justification so
they can correct it if wrong before you draft the SOP.

- Input: process brief from Step 1
- Output: inferred process shape (linear / branching / cyclical) with reasoning
- Key focus: pick the structural backbone the SOP steps will hang on

**Step 3: Draft the SOP** (uses: ops-sop)

Draft the full SOP from the brief and the inferred shape: a clear process
description followed by an ordered, numbered step sequence with the owner and
trigger for each step. Show the draft to the user and ask whether to refine it
or proceed to the checklist. If they ask for changes, revise the SOP against
their feedback and show it again. Allow up to three refinement passes before
moving on.

- Input: process brief from Step 1, process shape from Step 2, user refinement feedback
- Output: a reviewed SOP draft (process description plus ordered step sequence)
- Key focus: each step has a clear action, owner, and trigger

**Step 4: Derive the Run Checklist** (uses: ops-checklist)

Convert the approved SOP into a tick-box run checklist a single operator can
follow live. Each SOP step becomes one or more concrete checklist items phrased
as verifiable actions. Show the checklist to the user.

- Input: approved SOP from Step 3
- Output: a per-run execution checklist mapped to the SOP steps
- Key focus: every checklist item is a single, verifiable action

**Step 5: Define Process Metrics** (uses: ops-process-doc)

Define the metrics that show the SOP is working: cycle time, error or rework
rate, throughput, and any quality gates relevant to this process. Show the
metrics to the user and ask whether to refine them or ship the SOP package. If
they ask for changes, revise the metrics against their feedback and show them
again. Allow up to two refinement passes.

- Input: approved SOP from Step 3, user refinement feedback
- Output: a reviewed set of process metrics with target values where known
- Key focus: choose metrics the team can actually observe and act on

**Step 6: Assemble and Ship the SOP Package**

Assemble the final deliverable as a single document containing: the process
shape, the SOP, the checklist, and the metrics, titled with the process name
from the brief. Confirm the package is complete and hand it to the user.

- Input: brief, process shape, SOP, checklist, metrics from prior steps
- Output: the assembled SOP package document
- Key focus: one coherent artifact the team can adopt immediately
