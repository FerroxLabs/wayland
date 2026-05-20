---
name: sop-creation
description: |
  Produces a standard operating procedure document with purpose, scope,
  step-by-step instructions, roles, safety notes, and revision tracking
  using ISO-adjacent SOP format. Use when the user asks to create an SOP,
  write a standard operating procedure, document a business process,
  build a step-by-step procedure for a team, or formalize how a task
  should be performed.
  Do NOT use for process flow diagrams (use process-mapping), quality
  checklists without procedures (use qa-checklist), or training
  curriculum (use teaching skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning template checklist step-by-step"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# SOP Creation

## When to Use

- User asks to create a standard operating procedure or SOP
- User wants to document a business process in a formal, repeatable format
- User needs to write step-by-step instructions for a team to follow consistently
- User asks to formalize how a recurring task should be performed
- User wants to build an SOP for training, compliance, or operational consistency
- Do NOT use when: user needs a process flow diagram (use `process-mapping`), a quality checklist without detailed steps (use `qa-checklist`), or a risk analysis of a process (use `failure-mode-analysis`)

## Process

1. **Collect SOP context.** Before producing the SOP, gather:
   - Process name and purpose (what task this SOP covers)
   - Who performs this process (roles, not specific people)
   - How often the process is performed (daily, weekly, monthly, as-needed)
   - Current pain points or inconsistencies in how it is performed today
   - Any regulatory, safety, or compliance requirements
   - Tools, systems, or materials needed to perform the process
   - Who approves the SOP and how often it should be reviewed

2. **Write the SOP header.** Include required metadata:
   - SOP title (descriptive, not a code number)
   - SOP number (for version tracking)
   - Effective date and revision number
   - Author, reviewer, and approver with dates
   - Department or team responsible
   - Review schedule (annual minimum, or after every process change)

3. **Define purpose and scope.** Establish boundaries:
   - **Purpose:** One sentence explaining why this SOP exists and what it ensures
   - **Scope:** What the SOP covers and what it does not cover
   - **Applicability:** Who must follow this SOP and under what conditions
   - **Definitions:** Any terms that need clarification for consistent interpretation

4. **Document roles and responsibilities.** For each role involved:
   - Role title (not a person's name -- people change, roles persist)
   - What the role is responsible for in this process
   - Decision authority (what decisions this role can make)
   - Escalation path (who to contact if something goes wrong)

5. **Write the procedure steps.** For each step:
   - Sequential step number
   - Clear action statement (verb-first: "Record the batch number," not "The batch number should be recorded")
   - Who performs the step (role reference)
   - Expected time to complete
   - Decision points (if/then branching for different scenarios)
   - Quality checks or verification points within the procedure
   - Safety notes or warnings where applicable

6. **Add supporting sections.** Complete the SOP with:
   - **Required materials and tools:** Everything needed before starting
   - **Safety and compliance notes:** Any regulatory requirements or hazards
   - **Troubleshooting:** Common problems and their solutions
   - **Related documents:** Other SOPs, forms, or references
   - **Revision history:** Table tracking all changes with date, author, and description

## Output Format

```
## Standard Operating Procedure: [Process Name]

| Field | Details |
|-------|---------|
| **SOP Number** | [Department-XXX] |
| **Effective Date** | [Date] |
| **Revision** | [X.X] |
| **Author** | [Name, Title] |
| **Reviewer** | [Name, Title] |
| **Approver** | [Name, Title] |
| **Department** | [Department] |
| **Review Schedule** | [Annual / After each process change / Other] |
| **Next Review Date** | [Date] |

---

### 1. Purpose

[One sentence: This SOP establishes the procedure for [process] to ensure [outcome: consistency, compliance, quality, safety].]

### 2. Scope

**Covers:** [What this SOP applies to]
**Does not cover:** [What is excluded -- reference other SOPs if applicable]
**Applicability:** [Who must follow this SOP and when]

### 3. Definitions

| Term | Definition |
|------|-----------|
| [Term 1] | [Clear definition] |
| [Term 2] | [Definition] |

### 4. Roles and Responsibilities

| Role | Responsibilities | Decision Authority | Escalation Path |
|------|-----------------|-------------------|-----------------|
| [Role 1] | [What they do in this process] | [What they can decide] | [Who they escalate to] |
| [Role 2] | [Responsibilities] | [Authority] | [Escalation] |

### 5. Required Materials and Tools

- [ ] [Material/tool 1]
- [ ] [Material/tool 2]
- [ ] [Material/tool 3]
- [ ] [Access/permissions required]

### 6. Procedure

**Step 1: [Action Title]**
**Performed by:** [Role]
**Time:** [Expected duration]

[Verb-first instruction. Clear, specific, unambiguous.]

- [Sub-step or detail]
- [Sub-step or detail]

**Verification:** [How to confirm this step was completed correctly]

---

**Step 2: [Action Title]**
**Performed by:** [Role]
**Time:** [Expected duration]

[Instruction.]

- If [condition A]: [do this]
- If [condition B]: [do that instead]

**Verification:** [Check]

---

**Step 3: [Action Title]**
**Performed by:** [Role]
**Time:** [Expected duration]

[Instruction.]

> **WARNING:** [Safety or compliance note if applicable]

**Verification:** [Check]

---

[Continue for all steps]

---

**Final Step: [Completion and Documentation]**
**Performed by:** [Role]

[Record completion, file documentation, notify relevant parties.]

### 7. Safety and Compliance Notes

- [Safety requirement or regulatory note]
- [Compliance obligation]
- [PPE or precaution if applicable]

### 8. Troubleshooting

| Problem | Likely Cause | Solution | Escalate If |
|---------|-------------|----------|-------------|
| [Problem 1] | [Cause] | [Fix] | [When to escalate] |
| [Problem 2] | [Cause] | [Fix] | [Escalation trigger] |

### 9. Related Documents

| Document | Reference |
|----------|-----------|
| [Related SOP] | [SOP number] |
| [Form or template] | [Location] |
| [Regulation or standard] | [Reference] |

### 10. Revision History

| Rev | Date | Author | Description of Change |
|-----|------|--------|--------------------|
| 1.0 | [Date] | [Author] | Initial release |
| 1.1 | [Date] | [Author] | [What changed] |
```

## Rules

1. NEVER produce an SOP without first collecting the process name, who performs it, and any compliance requirements
2. Every step must begin with a verb -- "Record the temperature" not "The temperature should be recorded"
3. Steps must be sequential and numbered -- parallel steps must be explicitly marked as such
4. Role references must use titles, not names -- "Shift Supervisor" not "John Smith"
5. Include a verification check for every critical step -- how does the performer know they did it correctly?
6. Decision points must use explicit if/then language, not vague "use your judgment"
7. ALWAYS include a revision history table -- SOPs without version control become unreliable
8. Include a review schedule with a specific next review date -- SOPs that are never reviewed decay
9. Safety warnings must appear immediately before the relevant step, not in a separate section only
10. The troubleshooting section must cover at least 3 common problems with specific solutions

## Edge Cases

- **Highly regulated process (pharma, food safety, medical):** Add a regulatory reference section citing specific standards (ISO, GMP, HACCP). Include witness or sign-off requirements for critical steps. Add a training verification requirement (operator must be trained and signed off before performing the procedure).
- **Process with multiple valid methods:** Document the preferred method as the primary procedure and include approved alternatives as appendices. Specify when each alternative is appropriate. Do not mix methods within the same procedure flow.
- **Cross-departmental process:** Include a RACI assignment for each step showing which department is responsible, accountable, consulted, or informed. Add a handoff section at each department boundary specifying what is passed, to whom, and how.
- **Emergency or exception procedure:** Separate the standard procedure from the emergency procedure. The emergency section should be scannable in under 30 seconds -- use bold headers, numbered steps, and no paragraphs. Include emergency contact numbers.
- **Process performed by a single person with no backup:** Flag this as a risk. Include a knowledge transfer requirement (the SOP itself serves as documentation, but a second person should be able to perform the procedure using only the SOP). Test this by having someone unfamiliar with the process attempt it using the SOP alone.

## Example

**Input:** "Create an SOP for our weekly inventory count at a retail store. The store manager and one associate perform it every Monday morning before the store opens. They count stock in each department, compare to the system, and flag discrepancies over $50."

**Output:**

## Standard Operating Procedure: Weekly Inventory Count

| Field | Details |
|-------|---------|
| **SOP Number** | OPS-001 |
| **Effective Date** | [Current date] |
| **Revision** | 1.0 |
| **Author** | [Name, Operations Manager] |
| **Approver** | [Name, Regional Manager] |
| **Department** | Store Operations |
| **Review Schedule** | Annual or after process change |
| **Next Review Date** | [Date + 12 months] |

---

### 1. Purpose

This SOP establishes the procedure for the weekly physical inventory count to ensure inventory accuracy, identify discrepancies, and prevent shrinkage.

### 2. Scope

**Covers:** Physical count of all merchandise in the store, comparison to system records, and discrepancy reporting.
**Does not cover:** Annual full inventory audit (see SOP OPS-005) or receiving/stocking procedures (see SOP OPS-002).
**Applicability:** Store Manager and designated Store Associate every Monday before store opening.

### 6. Procedure

**Step 1: Prepare Count Materials**
**Performed by:** Store Manager
**Time:** 10 minutes

Print the current inventory report from the inventory management system. Prepare count sheets for each department (5 departments). Assign departments to the Store Associate (2 departments) and yourself (3 departments).

**Verification:** Count sheets printed for all 5 departments, pens and clipboards ready.

---

**Step 2: Perform Physical Count by Department**
**Performed by:** Store Manager and Store Associate (simultaneously)
**Time:** 45-60 minutes

Count every item in the assigned department. Record the count on the department count sheet. Count each SKU once -- use a marker to indicate counted shelves.

- If an item is damaged or unsellable: count it separately in the "damaged" column
- If a shelf is empty but the system shows stock: record zero and flag for investigation

**Verification:** Every shelf in the department has been counted and marked.

---

**Step 3: Compare Counts to System Records**
**Performed by:** Store Manager
**Time:** 20 minutes

Enter physical counts into the inventory system. The system calculates the variance for each SKU. Flag any SKU with a variance exceeding $50 in value.

- If variance is under $50: log for trend tracking, no immediate action required
- If variance is over $50: complete a Discrepancy Report (Form OPS-001A)

**Verification:** All department counts entered, variance report generated, discrepancies over $50 flagged.

---

### 10. Revision History

| Rev | Date | Author | Description of Change |
|-----|------|--------|--------------------|
| 1.0 | [Current date] | [Author] | Initial release |
