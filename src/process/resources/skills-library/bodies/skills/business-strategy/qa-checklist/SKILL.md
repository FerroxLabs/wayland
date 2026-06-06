---
name: qa-checklist
description: |
  Produces a quality assurance checklist for a defined workflow or process
  with inspection points, pass/fail criteria, and corrective action
  procedures using QA methodology. Use when the user asks to create a
  QA checklist, build quality control checks for a process, design an
  inspection checklist, write acceptance criteria for deliverables, or
  establish quality gates for a workflow.
  Do NOT use for software testing plans (use software development skills),
  failure mode analysis (use failure-mode-analysis), or risk assessment
  (use risk-assessment).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "checklist template planning analysis"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# QA Checklist

## When to Use

Use this skill when the user needs to create a structured, repeatable quality verification system for a defined process or deliverable. Specific triggers include:

- User asks to build a QA checklist, quality control form, or inspection checklist for a business, operational, or content process (e.g., "Create a QA checklist for our invoice processing workflow" or "Build quality checks for our onboarding process")
- User wants to define pass/fail criteria and acceptance standards for a deliverable -- a finished product, document, batch of work, or service output that must meet defined quality standards before release or delivery
- User needs to establish quality gates at handoff points between teams, departments, or process stages where a unit of work transitions from one owner to another
- User wants to standardize QA across a distributed team so that different inspectors evaluate the same characteristics using the same criteria and produce consistent results
- User is responding to a recurring quality problem and needs a systematic inspection protocol to prevent known defect types from reaching customers or downstream processes
- User needs to satisfy a regulatory, contractual, or client-mandated quality verification requirement (ISO 9001, SOC 2, FDA 21 CFR Part 820, client audit requirements) that demands documented inspection records
- User is designing a new process and wants to build quality verification in from the start rather than inspecting defects after they accumulate

**Do NOT use this skill when:**

- User needs a software testing plan, test case matrix, or test suite for code -- use software development testing skills instead. QA checklists cover process and deliverable quality; software test plans cover functional, regression, and integration testing of code.
- User asks to identify failure modes and estimate their probability and severity -- use `failure-mode-analysis`. QA checklists respond to known failure points; FMEA discovers and prioritizes unknown ones.
- User needs to assess operational or project risk across a portfolio of threats -- use `risk-assessment`. QA checklists address conformance to defined standards, not open-ended risk landscapes.
- User wants to audit an entire quality management system (QMS) for ISO or regulatory compliance -- that requires a full audit protocol, gap analysis, and corrective action plan, not a single process checklist.
- User is designing acceptance testing criteria for a software product release -- this overlaps with software development skills even though "acceptance criteria" language is used.

---

## Process

### Step 1: Gather QA Context Before Writing a Single Check Item

Before building the checklist, collect specific information. Producing a checklist without this context results in generic checks that inspectors skip or misapply.

- **Process scope:** What is the exact start point and end point of the process being checked? "Order fulfillment" is too broad; "Pick-and-pack from warehouse shelf to shipping label applied to box" is right-sized.
- **Quality dimensions:** Identify which of these quality dimensions apply -- Accuracy (correct content, correct values), Completeness (all required elements present), Timeliness (within defined time windows), Conformance (matches a standard or specification), Appearance (visual or format standards), Functionality (works as intended). Most processes have 2-3 dominant dimensions, not all six equally.
- **Inspector identity:** Is the QA performed by the worker who produced the output (self-inspection), a peer on the same team (peer review), a dedicated QA role, or a supervisor? Each has different reliability profiles -- self-inspection has the highest confirmation bias risk; dedicated QA roles have the highest consistency.
- **Inspection frequency:** Is this 100% inspection of every unit, periodic batch inspection (every Nth batch), statistical sampling (AQL levels from ISO 2859), or time-triggered (end-of-day, end-of-shift)?
- **Consequence of failure:** What happens downstream if a defect escapes? Customer complaint, regulatory violation, safety incident, rework cost? The consequence determines how rigorous the checklist needs to be.
- **Existing defect data:** Ask the user for the top 3-5 known defect types. These become mandatory check items. If the user has no defect data yet, build a comprehensive checklist and plan to trim it after 60 days of data.
- **Regulatory or contractual standards:** Does this process fall under ISO 9001, ISO 13485, FDA 21 CFR, GMP, SOC 2, HIPAA, a client quality agreement, or another named standard? If yes, specific check items must map to specific clauses or requirements.
- **Time available for inspection:** Ask how long the inspection window is. A 5-minute spot check cannot support 30 check items. The checklist must fit the available time or the user must acknowledge that additional inspection time is being added to the process.

---

### Step 2: Map the Process into Inspection Stages

Identify exactly where in the process flow quality checks belong. Not every step needs a check -- place checks at high-leverage points.

- **Input inspection (pre-process gate):** Check that all inputs -- materials, data, documents, instructions -- meet requirements before work begins. Catching bad inputs here prevents all downstream defects caused by that input.
- **In-process checkpoints:** Identify stages where a defect, if uncaught, becomes significantly more expensive to fix. The general rule: the cost to fix a defect at stage N is roughly 10x the cost to fix it at stage N-1. Place checkpoints before irreversible steps, before high-value-add steps, and at natural pause points.
- **Output inspection (final gate):** Verify the finished deliverable meets all specifications before it is released to the customer, next team, or next stage. This is the last line of defense and must be the most thorough.
- **Post-delivery verification:** For processes where quality can only be assessed after delivery (e.g., training effectiveness, software performance in production), define a post-delivery check with a specific time window (e.g., "Verify within 48 hours of delivery").
- **Critical vs. non-critical checks:** Classify each check as Critical (failure means the unit must be rejected or reworked before release), Major (failure significantly degrades quality but may be conditionally accepted with documented waiver), or Minor (failure is cosmetic or low-impact, log and correct in next version). This classification drives the pass/fail decision rules.

---

### Step 3: Write Specific, Measurable Check Items

This is the highest-skill step. Vague check items are the single most common cause of checklist failure.

- **Structure every check item as a verifiable statement:** The inspector answers yes (pass) or no (fail). "Document is complete" fails this test. "All six required sections are present: Executive Summary, Scope, Methodology, Findings, Recommendations, Appendix" passes it.
- **Apply the SMART test to acceptance criteria:** Specific (names exactly what is being evaluated), Measurable (uses a number, count, percentage, or observable binary state), Achievable (the inspector can actually verify this with available tools), Relevant (failure of this check actually matters to quality), Time-bound (where timing is relevant, the window is specified).
- **Quantify wherever possible:** "Response time is acceptable" is not a check item. "API response time is under 200ms for 95% of requests measured over a 5-minute test window" is. "Invoice total matches" becomes "Invoice total matches purchase order amount within $0.01."
- **Specify the verification method explicitly:** Visual inspection, physical measurement (with what instrument), comparison to a reference document, calculation check, system query, tool output, physical test. If the verification method is not specified, different inspectors use different methods and produce inconsistent results.
- **Limit each check item to one quality characteristic:** A compound check like "Document is complete and accurate" fails this rule. Split it: "All required sections are present" (completeness) and "All figures match source data" (accuracy).
- **Write for the actual inspector, not a hypothetical expert:** If inspectors are entry-level operators, the check item must be unambiguous to someone with 2 weeks of training. If inspectors are subject matter experts, you can reference domain standards. Know your audience.
- **Reference specifications directly when they exist:** Check item: "Weld bead width meets drawing tolerance." Acceptance criteria: "Bead width 4mm ±0.5mm per Drawing Rev C, Dimension D7." This makes the check traceable.

---

### Step 4: Define Severity Levels and Disposition Rules

A checklist that identifies failures without a disposition protocol creates decision paralysis or, worse, ad-hoc decisions that undermine the entire QA system.

- **Establish exactly three severity levels** to avoid over-complication:
  - **Critical:** Safety risk, regulatory violation, or complete functional failure. Disposition: automatic rejection, quarantine unit, mandatory escalation before any further processing.
  - **Major:** Significant departure from specification that will be noticed by the customer or cause downstream process problems. Disposition: rework required before release; supervisor sign-off on rework verification.
  - **Minor:** Cosmetic defect, documentation gap, or deviation below threshold of customer impact. Disposition: log it, correct it if feasible without rework cycle, release conditionally with documented waiver.
- **Define the overall release decision rule** explicitly. Common rules: Zero-defect rule (any failure = reject); Critical-zero rule (any Critical = reject, Majors up to a defined count = conditional release, Minors up to a defined count = accept); AQL-based rule (reject if the number of defects in a sample exceeds the AQL threshold for the lot).
- **Define who has authority to grant waivers** for Major and Minor failures. This must be a named role, not a general statement. "Supervisor can grant waiver" without specifying which supervisor creates confusion.
- **Set a maximum failure count per inspection point** -- if an inspection point generates more than X failures in a single inspection, stop the inspection and escalate rather than continuing to document failures. This threshold prevents inspectors from rubber-stamping catastrophically defective batches.

---

### Step 5: Design the Corrective Action Protocol

Each type of recurring failure needs a mapped response protocol. Random corrective actions taken ad-hoc do not produce sustained improvement.

- **Immediate containment action:** What physically happens to the defective unit right now? Options include: quarantine (physically segregate and label), rework (return to a specific process step), reject (remove from the process permanently), accept-with-waiver (release with documented deviation), or stop production (halt until root cause is identified). The specific containment action must match the failure type.
- **Root cause investigation trigger:** Define the threshold that triggers a formal root cause analysis (RCA). Common thresholds: any Critical failure; three or more Major failures in the same check item within 30 days; defect rate for any check item exceeds 5% over a rolling 30-day window. Ad-hoc investigation of every minor failure wastes resources; no investigation of chronic failures wastes even more.
- **Corrective action ownership:** Assign root cause investigation and corrective action implementation to a specific role, not "the team." Unowned action items are never completed.
- **Verification of effectiveness:** Define how you confirm the corrective action worked. Common method: re-inspect the first 10-20 units produced after the corrective action is implemented at elevated inspection frequency. If no recurrence within that window, return to standard inspection frequency.
- **8D methodology for Critical failures:** For any Critical severity failure, structure the corrective action using the 8D framework -- D1 (team formation), D2 (problem description), D3 (containment), D4 (root cause), D5 (corrective actions), D6 (implementation), D7 (preventive action), D8 (closure). This is especially important in regulated industries.

---

### Step 6: Format the Checklist for Real-World Use

A technically perfect checklist that is unusable in practice has no value. Design for the inspector who will use it under real working conditions.

- **Group checks by inspection stage** (Input, In-Process Checkpoint 1, In-Process Checkpoint 2, Output) -- never interleave checks from different stages.
- **Order checks within each stage in execution sequence** -- the order the inspector physically moves through the process or document. If checks must be done in a specific order (e.g., safety check before operational check), document that dependency.
- **Keep each inspection stage to 15 items or fewer.** Research on checklist completion rates shows that checklists exceeding 15-20 items per section see significantly higher skip rates. If you need more than 15 items at a stage, either create a sub-checklist for a specific sub-process, or question whether all items are truly necessary.
- **Use a consistent column structure:** Check number (for referencing in defect logs), check item description, acceptance criteria, verification method, Pass/Fail fields, severity classification, and notes field. Do not omit the severity column -- inspectors need it to determine disposition on the spot.
- **Include a hard stop indicator** for checks where failure means do not proceed further. Use a visual indicator (e.g., ⛔ STOP) at any check where a failure means all subsequent work must halt until the issue is resolved.
- **Provide a Summary section** with total checks, total passed, total failed, breakdown by severity, and a single overall disposition (PASS / CONDITIONAL PASS / FAIL). The overall disposition must be unambiguous.
- **Version control is mandatory.** Every checklist must have a version number and effective date. Without this, teams run different versions simultaneously without knowing it. Changes to the checklist must go through a defined change control process.

---

### Step 7: Establish Measurement, Trending, and Review Cycles

A QA checklist that is never reviewed becomes stale and eventually counterproductive. Build the maintenance system into the checklist itself.

- **Defect rate tracking:** Calculate defect rate per check item as (number of failures / number of inspections performed) × 100. Any check item with a defect rate consistently below 1% over 90 days is a candidate for removal or reduction in frequency -- it may have outlived its relevance or the underlying process may have been fixed.
- **Any check item with a defect rate above 10% over 30 days** indicates either a broken process (address with process improvement), an incorrect acceptance criterion (revisit the standard), or inadequate training (address with retraining). A high failure rate on a single check item is always a signal, never just a data point.
- **Inspector calibration exercises:** Conduct calibration at least quarterly for checklists with subjective criteria. Present two inspectors with the same set of borderline-case samples and compare their pass/fail determinations. Agreement rate below 80% on the same samples indicates criteria ambiguity -- rewrite the affected check items.
- **Formal checklist review triggers:** Review the checklist whenever: a new defect type appears that the checklist would not have caught; the process being checked changes; a regulatory standard it references is updated; a customer complaint or audit finding reveals a gap; or the scheduled periodic review date arrives.
- **Review frequency by process risk:** High-risk processes (regulatory, safety, customer-facing) review quarterly. Medium-risk processes review semi-annually. Low-risk internal processes review annually.

---

### Step 8: Present the Checklist and Calibrate It With the User

Before finalizing, confirm the checklist is fit for purpose.

- **Read back the overall structure:** "This checklist covers X input checks, Y in-process checks at Z checkpoints, and W output checks. Overall release rule is [state the rule]. Does this match your process?"
- **Confirm the inspector role** can realistically perform every check within the inspection window. Walk through the estimated time per check item if there is any concern.
- **Flag any checks that will require investment:** If the checklist requires a measurement tool the user does not have, a reference document that does not exist, or a test that cannot be performed in the normal flow, name that gap explicitly.
- **Recommend a pilot period:** Run the new checklist for 30 days, track all failures, then reconvene to remove checks that never fail and add checks for any new defects discovered.

---

## Output Format

```
## QA Checklist: [Process or Deliverable Name]

**Process:** [Exact start point] → [Exact end point]
**Quality Standard:** [Named standard, specification, or definition of quality for this process]
**Inspector Role:** [Job title or role -- not a person's name]
**Inspection Type:** [ ] 100% Inspection  [ ] Batch Sampling (every ___th unit)  [ ] Statistical Sample (AQL ___, Level ___)
**Overall Release Rule:** [Zero-defect / Critical-zero / AQL-based -- define specifically]
**Effective Date:** [Date]
**Version:** [X.X]
**Review Due:** [Date]

---

### Section 1: Input Inspection
*Performed before the process begins. Purpose: verify all inputs meet requirements
before any value-add work is done.*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 1.1 | [Specific input characteristic] | [Exact measurable standard] | [How to verify] | [Crit/Major/Minor] | [ ] | [ ] | |
| 1.2 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |
| 1.3 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |

**Input Inspection Failure Protocol:**
- Any Critical failure: ⛔ STOP -- Do not begin process. Quarantine inputs. Notify [role] immediately.
- Any Major failure: Hold inputs. Contact [role] for disposition decision before proceeding.
- Minor failures only: Document, proceed with waiver from [role].

**Input Section Result:**  [ ] PASS  [ ] CONDITIONAL  [ ] FAIL
**Failures found:** ___ Critical  ___ Major  ___ Minor

---

### Section 2: In-Process Inspection

#### Checkpoint A: [Name of stage -- e.g., "After Data Entry, Before Calculation"]
*Performed after [Step X] is complete. Stop and inspect before proceeding to [Step Y].*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 2.1 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |
| 2.2 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |

**Checkpoint A Failure Protocol:**
- Any Critical failure: ⛔ STOP -- [Specific immediate action]. Notify [role].
- Major failure: [Specific rework instruction]. Re-inspect after rework. Sign off: _______
- Minor failure: Log below. Proceed.

**Checkpoint A Result:**  [ ] PASS  [ ] CONDITIONAL  [ ] FAIL

---

#### Checkpoint B: [Name of stage]

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 2.3 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |
| 2.4 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |

**Checkpoint B Failure Protocol:**
- [Protocol specific to this checkpoint]

**Checkpoint B Result:**  [ ] PASS  [ ] CONDITIONAL  [ ] FAIL

---

### Section 3: Output Inspection
*Performed before the deliverable is released. This is the final gate before
the output reaches the customer, downstream team, or next stage.*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 3.1 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |
| 3.2 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |
| 3.3 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |
| 3.4 | [Check item] | [Criteria] | [Method] | [Level] | [ ] | [ ] | |

**Output Inspection Failure Protocol:**
- Any Critical failure: ⛔ REJECT -- Do not release. Return to [stage] for rework.
  Re-inspect from beginning of Output Inspection after rework. Escalate to [role].
- 1-2 Major failures: Rework required before release. Supervisor sign-off on re-inspection.
- 3+ Major failures: Reject batch. Escalate to [role]. Initiate RCA within [timeframe].
- Minor failures only: Conditional release with documented waiver. Correct in next cycle.

**Output Section Result:**  [ ] PASS  [ ] CONDITIONAL  [ ] FAIL
**Failures found:** ___ Critical  ___ Major  ___ Minor

---

### Inspection Summary

| Section | # Checks | Passed | Failed Crit | Failed Major | Failed Minor |
|---------|----------|--------|-------------|--------------|--------------|
| 1. Input Inspection | [X] | [X] | [X] | [X] | [X] |
| 2. In-Process (all checkpoints) | [X] | [X] | [X] | [X] | [X] |
| 3. Output Inspection | [X] | [X] | [X] | [X] | [X] |
| **TOTAL** | **[X]** | **[X]** | **[X]** | **[X]** | **[X]** |

**Overall Disposition:**
[ ] **PASS** -- All checks passed. Release authorized.
[ ] **CONDITIONAL PASS** -- Minor/Major failures within acceptable limits.
    Waiver granted by: _________________ Date: _________
[ ] **FAIL** -- Critical failure(s) or failure count exceeds limit. Do not release.

**Inspector:** _________________________ Date: _________ Time: _________
**Reviewed/Approved by:** ______________ Date: _________

---

### Corrective Action Procedures

| Failure Type | Immediate Containment | RCA Trigger | RCA Method | Corrective Action Owner | Effectiveness Verification |
|-------------|----------------------|-------------|------------|------------------------|---------------------------|
| [Specific failure category] | [Quarantine/Rework/Reject] | [Threshold] | [5-Why/8D/Fishbone] | [Role] | [How and when to verify fix worked] |
| [Failure category 2] | [Action] | [Threshold] | [Method] | [Role] | [Verification] |
| [Failure category 3] | [Action] | [Threshold] | [Method] | [Role] | [Verification] |

---

### Defect Log

| Date | Insp. # | Check # | Description | Severity | Immediate Action Taken | RCA Required? | RCA Status | Corrective Action | Closed Date |
|------|---------|---------|-------------|----------|----------------------|---------------|-----------|-------------------|-------------|
| | | | | | | Y / N | | | |

**Defect Rate Trigger:** If defect rate for any single check item exceeds 10% over
30 days, initiate formal process review. See Corrective Action Procedures above.

---

### Review and Calibration Schedule

| Activity | Frequency | Owner | Last Completed | Next Due |
|----------|-----------|-------|----------------|----------|
| Checklist periodic review | [Quarterly/Semi-annual] | [Role] | [Date] | [Date] |
| Inspector calibration exercise | Quarterly | [Role] | [Date] | [Date] |
| Defect trend review | Monthly | [Role] | [Date] | [Date] |
| Post-process change review | After any process change | [Role] | [Date] | [Date] |

**Change log:**
| Version | Date | Changed By | Change Description |
|---------|------|-----------|-------------------|
| 1.0 | [Date] | [Role] | Initial release |
```

---

## Rules

1. **Never write a check item without a specific, measurable acceptance criterion.** "Properly formatted" is not an acceptance criterion. "All column headers match the template in Appendix A, all numeric fields contain only digits, date fields formatted as YYYY-MM-DD" is. The test: could two different inspectors independently evaluate this criterion and reliably reach the same conclusion?

2. **Never omit the verification method column.** A check item without a specified verification method gets evaluated differently by every inspector. "Compare to specification sheet, Page 4, Table 2" is a method. "Visual inspection using calibrated gauge XYZ-100" is a method. "It looks right" is not.

3. **Classify every check item as Critical, Major, or Minor before publishing the checklist.** If the severity is not pre-classified, inspectors make severity judgments on the spot under time pressure, producing inconsistent dispositions. Severity must be established by someone with authority over the quality standard, not the inspector in the moment.

4. **Define the overall pass/fail rule explicitly at the top of the checklist, not in a footnote.** Inspectors must know the release decision rule before they begin inspecting, not after they have tallied results. The rule must specify exactly what combination of failure types and counts produces a PASS, CONDITIONAL PASS, or FAIL.

5. **Cap each inspection section at 15 check items.** If a stage genuinely requires more than 15 checks, either split it into sub-processes with their own checklists, or create a tiered approach where a short primary checklist covers the most critical items and a secondary checklist covers the full detail. Compliance rates drop sharply beyond 15 items per session.

6. **Every corrective action must have a named role as owner, not "the team."** Action items owned by a group are owned by no one. The corrective action protocol must specify which role (not which person -- roles survive personnel changes) is responsible for investigation and implementation.

7. **Include a version number and effective date on every checklist.** Checklists without version control generate teams running different versions simultaneously, auditors unable to confirm which version was in use during a quality event, and no way to track whether improvements have been implemented.

8. **Do not include checks that cannot be performed within the inspection window.** A check that takes 20 minutes on a line that runs a new unit every 5 minutes will be skipped. If the check is necessary, the process must change to accommodate it. Do not pretend it will happen.

9. **Treat self-inspection as a lower-reliability control than independent inspection.** When the process producer and the QA inspector are the same person, add a mandatory time-gap (minimum one complete task cycle or 30 minutes, whichever is greater) between production and inspection, and designate at least one Critical check for mandatory secondary independent review.

10. **If a regulatory standard applies, cite the specific clause next to each check item it addresses.** "Meets GMP requirements" is not a citation. "21 CFR Part 211.68(b) -- Computer system accuracy and reliability verification" is. Auditors require traceability between check items and regulatory requirements. Generic compliance language fails audits.

11. **Build the review schedule into the checklist itself, not in a separate document.** A review schedule that exists only in a project management tool gets disconnected from the checklist. The checklist is the living document -- its review dates, last review date, and owner must be visible on the checklist itself.

12. **Flag any check item that requires specialized equipment, reference documents, or external systems** with a prerequisite note. If the inspector cannot perform the check because the tool is unavailable or the reference document has not been created yet, the checklist is not deployable. Surface that gap at design time, not during the first use.

---

## Edge Cases

### Subjective or Creative Output (Design Work, Writing, Video, Brand Content)
When quality characteristics cannot be expressed as binary observable facts, use a defined rubric rather than pass/fail. Rubric levels should be: Exceeds Standard (4), Meets Standard (3), Marginally Below Standard (2 -- conditional pass with noted improvements), Does Not Meet Standard (1 -- fail, rework required). Document what distinguishes each level with examples. Require that the rubric is created and approved before the first inspection -- never let the rubric evolve mid-inspection. For brand consistency checks, anchor criteria to a specific brand guide document and version. Example: "Tone matches brand voice guidelines v3.2, Section 2.4" evaluated against printed examples, not inspectors' personal interpretation.

### High-Volume Process With Batch Sampling
When 100% inspection is not feasible due to volume or throughput requirements, use AQL (Acceptance Quality Limit) sampling per ISO 2859-1. Common AQL levels: 0.65% for critical characteristics, 2.5% for major characteristics, 4.0% for minor characteristics. General Inspection Level II is the default. The checklist must specify sample size using ISO 2859-1 tables based on lot size and inspection level. Include a dynamic response rule: if a sample fails, escalate to tightened inspection (double the sample size from the same lot and re-inspect). If two consecutive lots under tightened inspection pass, return to normal sampling. If five consecutive lots under tightened inspection fail, switch to 100% inspection and initiate a process review. Never return to statistical sampling without a formal corrective action closure.

### New Process With No Historical Defect Data
Start with a comprehensive checklist covering all conceptually possible failure modes at each stage. Run it for 30-60 days, recording every failure. At the 30-day review, calculate the defect rate for each check item. Remove or reduce to quarterly spot-check any item with zero failures over 30 days -- with the explicit caveat that if a removed item's defect reappears, it is immediately reinstated. After 60 days, the checklist should have been trimmed to the items that actually fail in this specific environment. Never run a comprehensive first-draft checklist indefinitely -- it will be abandoned.

### Regulated Industry (FDA, ISO 13485, ISO 9001, GMP)
In regulated environments, the QA checklist is a controlled document with specific requirements beyond normal QA practice. Requirements that must be added: Document control number (not just a version number -- a formal document ID), approval signatures with dates from defined roles (typically QA Manager, Process Owner, and in some cases a regulatory affairs representative), change control log showing every revision with justification, and a traceability matrix mapping each check item to the applicable regulatory clause or specification section. The checklist must be retained for the duration defined by the regulation (FDA: 21 CFR 820.180 requires 2 years minimum; GMP: varies by country; ISO 9001: organization-defined but typically 3-5 years). Paper checklists in regulated environments require ink signatures -- never pencil. Electronic checklists require 21 CFR Part 11-compliant e-signatures if FDA-regulated.

### Distributed Teams in Multiple Locations Performing the Same QA Check
Inspector calibration becomes critical. Two inspectors in different locations evaluating the same items against the same criteria will diverge over time without active calibration. Create a calibration kit: 5-10 representative samples covering the full range from clear pass to clear fail and several borderline cases. Run quarterly calibration sessions where all inspectors independently evaluate the same calibration kit and compare results. If agreement on borderline cases drops below 80%, rewrite the acceptance criteria for those items. Include calibration session results in the defect log. Name the calibration exercise moderator in the review schedule.

### Process With Multiple Handoffs Between Teams or Departments
When a process crosses organizational boundaries (e.g., Sales hands off to Operations, Operations hands off to Finance), each handoff point is a mandatory inspection point regardless of what happens between handoffs. Each handoff inspection must have: a defined sender role (who is releasing), a defined receiver role (who is accepting), a binary acceptance decision (accept or reject with documented reason), and a time limit for the receiver to accept or reject (e.g., "Receiver has 4 business hours to accept or reject the handoff -- silence does not constitute acceptance"). Handoff rejections must be escalated immediately rather than cycling back informally, because informal returns through handoffs create accountability gaps and audit trails disappear.

### Process Under Active Improvement (Checklist Used During a Kaizen or Lean Project)
When the process being checked is actively changing, the checklist has a shorter shelf life and must be treated as a draft document with weekly review cycles rather than quarterly. Version the checklist before and after each process change, and keep all previous versions. The comparison between pre-change and post-change defect rates is the primary measure of whether the improvement worked. Do not update the acceptance criteria mid-project to reflect where the process currently performs -- criteria represent the target, not the current state. If the current process consistently fails a criteria that is correct, that failure rate is the data, not a reason to lower the standard.

### Post-Delivery or Field Verification
Some quality characteristics can only be assessed after the output has been in use for a period of time -- training effectiveness, implementation quality, software performance in production, customer satisfaction. For these, the QA checklist must include a post-delivery section with an explicit time window (e.g., "Complete 30-day post-delivery check on [specific date]") and a defined data source (e.g., "Customer satisfaction survey response, support ticket volume for this process area, error rate in downstream system"). Post-delivery checks need the same pass/fail criteria structure as pre-delivery checks. If a post-delivery check fails, the corrective action protocol must address both the immediate customer impact and the upstream process that produced the deficiency.

---

## Example

**User Input:** "We need a QA checklist for our monthly payroll processing. The process runs from payroll data collection through to payroll file submission to our bank. Known problems: incorrect hours entered, employee tax setups missing for new hires, wrong pay rates used for recent promotions, and the wrong bank file format being submitted. We have a payroll specialist who processes it and a finance manager who signs off."

---

## QA Checklist: Monthly Payroll Processing

**Process:** Payroll data collection → Bank file submission
**Quality Standard:** 100% accuracy on all employee pay calculations; zero unauthorized or incorrect payments; bank file accepted by financial institution on first submission
**Inspector Role:** Finance Manager (independent review of Payroll Specialist's work)
**Inspection Type:** [x] 100% Inspection -- all payroll records inspected every cycle
**Overall Release Rule:** Zero-defect rule for Critical items. No payroll file may be submitted with any open Critical failure. Major failures require Finance Manager written waiver and rework verification. Minor failures logged and corrected in next cycle.
**Effective Date:** [Date]
**Version:** 1.0
**Review Due:** Three months from effective date (after first three payroll cycles)

---

### Section 1: Input Inspection
*Performed before payroll processing begins. Verify all data inputs are complete
and correct before any calculations are run.*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 1.1 | All active employees present in payroll run | Headcount in payroll system matches HR headcount report for the period. Zero variance. | Compare payroll system employee count to HR system active employee export. Document counts. | Critical | [ ] | [ ] | |
| 1.2 | New hires have complete tax setup | Every employee with a start date within the last 60 days has federal W-4, state tax withholding form, and local tax (if applicable) on file and entered in system | Export new hire list from HRIS. For each new hire, verify tax fields in payroll system are populated (not default zero or blank). | Critical | [ ] | [ ] | |
| 1.3 | Recent promotion pay rate changes entered | Every employee with a promotion or pay change effective in this pay period has the new rate in the payroll system matching the approved change form | Pull compensation change log from HR for the current period. For each change, verify payroll system rate matches approved change form to the cent. | Critical | [ ] | [ ] | |
| 1.4 | Time and attendance data imported | Time records are present for all hourly employees. Import timestamp is within this pay period. Zero employees with missing time records. | Verify import log in payroll system shows successful import. Run missing-time report -- result must be zero records. | Major | [ ] | [ ] | |
| 1.5 | Approved exceptions and manual adjustments documented | Every manual pay adjustment (bonus, correction, garnishment change) has a signed approval form with approver name and date | Review adjustment queue in payroll system. Match each adjustment to a physical or electronic approval form. Any adjustment without approval = fail. | Critical | [ ] | [ ] | |

**Input Inspection Failure Protocol:**
- **Critical failure (1.1, 1.2, 1.3, 1.5):** ⛔ STOP -- Do not proceed with payroll processing. Notify Payroll Specialist of specific gap. Payroll processing is blocked until all Critical input failures are resolved. Re-inspect affected items only after resolution. Document resolution in Notes column with resolution date and initials.
- **Major failure (1.4):** Contact HR and Payroll Specialist for missing time records. If missing records cannot be resolved within 4 business hours, escalate to Director of Finance for disposition decision (hold payroll or process with documented exclusions). Do not process with missing time records without Director authorization.

**Input Section Result:** [ ] PASS [ ] CONDITIONAL [ ] FAIL
**Failures found:** ___ Critical ___ Major ___ Minor

---

### Section 2: In-Process Inspection

#### Checkpoint A: After Hours Calculation, Before Gross Pay Calculation
*Performed after all hours have been entered and validated, before the system
calculates gross pay. Stop here and verify hours before the system multiplies
by pay rates.*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 2.1 | Total hours are within plausible range | Total hours for all hourly employees do not exceed (employees × hours in pay period × 1.3). Any employee showing more than 1.3× standard hours (e.g., more than 104 hours in a 2-week period) has a documented explanation. | Run hours summary report. Any outlier greater than 1.3× expected maximum hours -- verify against timecard and manager approval. | Major | [ ] | [ ] | |
| 2.2 | Overtime hours flagged and approved | All hours over 40 per week (or applicable state threshold) are classified as overtime in the system and have documented supervisor approval | Export overtime report. For each employee with overtime hours, confirm supervisor approval is on file in the time and attendance system. | Critical | [ ] | [ ] | |
| 2.3 | PTO and leave hours match approved requests | Sick, vacation, and leave hours in payroll match approved leave requests in HRIS. Variance of zero for any leave category. | Compare leave hours in payroll to approved leave in HRIS system for the period. Variance greater than 0 = fail. | Major | [ ] | [ ] | |

**Checkpoint A Failure Protocol:**
- **Critical failure (2.2):** ⛔ STOP -- Unapproved overtime must be resolved before gross pay calculation. Return to Payroll Specialist to obtain retroactive supervisor approval or remove hours. Do not proceed.
- **Major failure (2.1, 2.3):** Payroll Specialist must investigate and document explanation for each flagged item before Finance Manager proceeds to output inspection. Resolution documented in Notes column.

**Checkpoint A Result:** [ ] PASS [ ] CONDITIONAL [ ] FAIL

---

#### Checkpoint B: After Gross Pay Calculation, Before Deductions and Net Pay
*Verify gross pay calculations are correct before deductions are applied.
Errors found here are significantly cheaper to fix than errors found in the
final net pay figures.*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 2.4 | Gross pay matches manual spot-check calculation | For a random sample of 10% of employees (minimum 5 employees), calculated gross pay matches independent manual calculation (hours × rate, plus any applicable overtime multiplier) within $0.01 | Select sample using every Nth employee from alphabetical roster. Manually calculate expected gross pay. Compare to payroll system gross pay figure. | Critical | [ ] | [ ] | |
| 2.5 | Salaried employees' gross pay matches approved annual salary ÷ pay periods | Every salaried employee gross pay = (annual salary / number of pay periods per year) ± $0.02 for rounding. Any deviation requires a documented explanation. | Export salaried employee gross pay report. For each employee, verify calculation matches HR salary record. | Critical | [ ] | [ ] | |
| 2.6 | Total gross payroll is within 5% of prior period | Total gross payroll for this period is within 5% of the prior period's total gross payroll. Variance greater than 5% has a documented explanation (new hires, terminations, bonuses, seasonality). | Compare total gross payroll to prior period. Calculate percentage variance. If variance exceeds 5%, Payroll Specialist must provide written explanation before Finance Manager proceeds. | Major | [ ] | [ ] | |

**Checkpoint B Failure Protocol:**
- **Critical failure (2.4, 2.5):** ⛔ STOP -- Gross pay errors must be corrected before deductions are applied. Errors compound through deduction calculations. Return to Payroll Specialist with specific employee records that failed. Re-inspect after correction.
- **Major failure (2.6):** Document explanation. Finance Manager judgment call on whether explanation is sufficient to proceed. Escalate to Director of Finance if explanation is not satisfactory or Finance Manager is uncertain.

**Checkpoint B Result:** [ ] PASS [ ] CONDITIONAL [ ] FAIL

---

### Section 3: Output Inspection
*Performed after net pay calculation is complete and payroll file is generated,
before the file is transmitted to the bank. This is the final gate.*

| # | Check Item | Acceptance Criteria | Verification Method | Severity | Pass | Fail | Notes |
|---|-----------|---------------------|---------------------|----------|------|------|-------|
| 3.1 | Net pay register total matches bank file control total | Total net pay in the payroll register exactly matches the total dollar amount in the bank ACH file. Zero variance. | Compare payroll register total to bank file total. Must match to the cent. | Critical | [ ] | [ ] | |
| 3.2 | Bank file format is correct | Bank file is in NACHA ACH format (version as specified in bank agreement). File header contains correct Company ID, Company Name, and effective entry date. | Open bank file in text editor. Verify record type codes (1=File Header, 5=Batch Header, 6=Entry Detail, 8=Batch Control, 9=File Control). Confirm Company ID matches bank agreement. Confirm effective date is the correct pay date. | Critical | [ ] | [ ] | |
| 3.3 | No terminated employees in payment file | Zero employees with termination dates prior to the pay period start date appear in the payment file | Export payment file employee list. Cross-reference against HR termination list for the period. Zero matches required. | Critical | [ ] | [ ] | |
| 3.4 | All employee bank account numbers are masked in exported reports | Any payroll report exported for distribution (e.g., Finance summary, department reports) shows masked account numbers (e.g., xxxxxx1234). Full account numbers appear only in the bank transmission file. | Review each exported report file. Confirm no report intended for distribution contains full routing or account numbers. | Major | [ ] | [ ] | |
| 3.5 | Payroll register has been reviewed and signed by Finance Manager | Finance Manager signature and date on physical or electronic payroll register prior to bank file transmission | Confirm Finance Manager signature is present and dated on the current period payroll register. | Critical | [ ] | [ ] | |
| 3.6 | Submission deadline can be met | Bank file transmission timestamp will occur at least 24 hours before the bank's ACH processing cutoff for the pay date | Confirm bank's ACH cutoff time. Confirm current time allows 24-hour lead. If within 24 hours of cutoff, escalate immediately to Director of Finance -- same-day ACH may have additional fees. | Major | [ ] | [ ] | |

**Output Inspection Failure Protocol:**
- **Any Critical failure (3.1, 3.2, 3.3, 3.5):** ⛔ DO NOT SUBMIT. Correct issue and re-inspect the failed item(s) plus any dependent checks. Do not re-inspect the entire output section unless the failure suggests systemic problems.
- **Major failures (3.4, 3.6):** Finance Manager documented waiver required. For 3.6, Director of Finance must authorize same-day ACH submission if that option is used.

**Output Section Result:** [ ] PASS [ ] CONDITIONAL [ ] FAIL
**Failures found:** ___ Critical ___ Major ___ Minor

---

### Inspection Summary

| Section | # Checks | Passed | Failed Crit | Failed Major | Failed Minor |
|---------|----------|--------|-------------|--------------|--------------|
| 1. Input Inspection | 5 | | | | |
| 2. In-Process (Checkpoints A + B) | 6 | | | | |
| 3. Output Inspection | 6 | | | | |
| **TOTAL** | **17** | | | | |

**Overall Disposition:**
[ ] **PASS** -- All checks passed. Bank file transmission authorized.
[ ] **CONDITIONAL PASS** -- Major failures only, within acceptable limits.
    Waiver granted by Finance Manager: _________________ Date: _________
    Waiver details: ________________________________________________
[ ] **FAIL** -- Critical failure(s) present. Bank file transmission BLOCKED.

**Inspector (Finance Manager):** _________________________ Date: _________ Time: _________
**Payroll Specialist (Preparer):** _________________________ Date: _________

---

### Corrective Action Procedures

| Failure Type | Immediate Containment | RCA Trigger | RCA Method | Owner | Effectiveness Verification |
|-------------|----------------------|-------------|------------|-------|---------------------------|
| Tax setup missing for new hire | Block payroll for affected employee. Process separately after correction. | Any occurrence | 5-Why: trace from new hire onboarding checklist to payroll tax setup step | Payroll Specialist + HR Manager | Verify next 3 new hires have tax setup complete at Input Inspection with zero failures |
| Wrong pay rate (promotion not entered) | Correct rate in system. Calculate underpayment. Issue off-cycle correction within 3 business days. | Any occurrence | 5-Why: trace from compensation approval to payroll update workflow | HR Manager + Payroll Specialist | Verify next 3 promotion pay changes pass check 1.3 with zero failures |
| Wrong bank file format | ⛔ Do not submit. Regenerate file. | Any occurrence | 5-Why: trace from file generation settings to bank format specification document | Payroll Specialist | Confirm bank file format specification is documented in Payroll Procedures v[X]. Verify next submission passes check 3.2. |
| Hours entry error | Correct hours. Recalculate gross and net pay. | Two or more occurrences in a 90-day window | Fishbone: evaluate data entry process, training adequacy, system UI factors | Payroll Specialist | Track hours error rate for 3 consecutive payroll cycles after correction. Target: zero recurrence. |
| Total variance greater than 5% unexplained | Hold payroll. Investigate before Finance Manager sign-off. | Any unexplained variance | Finance Manager and Payroll Specialist joint review of payroll change log | Finance Manager | Document explanation. Close after Finance Manager sign-off on explanation. |

---

### Defect Log

| Date | Pay Period | Check # | Description | Severity | Immediate Action Taken | RCA Required? | Corrective Action | Closed Date |
|------|-----------|---------|-------------|----------|----------------------|---------------|-------------------|-------------|
| | | | | | | Y / N | | |

**Defect rate monitoring:** If any single check item fails in 2 out of 3 consecutive payroll cycles, initiate formal RCA regardless of severity level. Payroll errors at any frequency represent systemic risk.

---

### Review and Calibration Schedule

| Activity | Frequency | Owner | Last Completed | Next Due |
|----------|-----------|-------|----------------|----------|
| Checklist periodic review | Quarterly (after Month 1, 2, 3 -- then quarterly) | Finance Manager | [Date] | [Date + 3 months] |
| Inspector calibration (Finance Manager and backup reviewer) | Semi-annually | Director of Finance | [Date] | [Date + 6 months] |
| Defect trend review | Monthly (coincides with payroll close) | Finance Manager | [Date] | End of next payroll cycle |
| Post-process-change review | After any payroll system upgrade or process change | Finance Manager + Payroll Specialist | [Date] | Upon next change |

**Change Log:**
| Version | Date | Changed By | Change Description |
|---------|------|-----------|-------------------|
| 1.0 | [Date] | Finance Manager | Initial release |
