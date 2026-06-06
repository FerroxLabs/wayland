---
name: sop-writing
description: |
  Creates standard operating procedures with step-by-step instructions,
  decision points, safety notes, and verification checks for repeatable
  processes. Use when the user needs to document a process, create a procedure
  manual, or write operational instructions. Do NOT use for how-to guides aimed
  at external audiences (use `how-to-guide`), project proposals (use
  `project-proposal`), or technical documentation (use a technical writing skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing technical-writing template"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# SOP Writing

## When to Use

Use this skill when any of the following conditions are true:

- The user needs to document a repeatable internal business process so that multiple people can perform it consistently -- examples include onboarding a new employee, closing the monthly books, responding to a security incident, or processing a customer return
- The user wants to reduce reliance on tribal knowledge by capturing what a subject matter expert (SME) does so the organization is not dependent on that individual
- The user needs to meet a compliance or audit requirement that mandates documented procedures -- ISO 9001, SOC 2, FDA 21 CFR Part 11, OSHA standards, and HIPAA all require demonstrable procedural controls
- The user is preparing for a quality management review, certification audit, or regulatory inspection and needs procedures that satisfy documentation standards
- The user needs to standardize performance across a distributed team, multiple shifts, or geographically separated locations so that outcomes are consistent regardless of who performs the task
- The user is building a process manual, operations playbook, or runbook for a department or product
- The user needs to document a handoff procedure where responsibility passes between roles or systems at defined points
- The user is capturing a corrective action procedure after a process failure or near-miss incident

**Do NOT use this skill for:**

- External-facing how-to guides for customers or end users -- use the `how-to-guide` skill instead, which is written for an uninitiated reader rather than a trained role
- Project plans, project charters, or one-time initiative scoping documents -- use `project-proposal` instead; SOPs govern repeatable operations, not unique projects
- Training curriculum, learning objectives, or instructional design -- an SOP describes how to do a task, not how to teach someone to do it; use a training/education skill for curriculum
- Technical API documentation, code documentation, or developer reference materials -- use a technical documentation skill; SOPs are for human operators, not developers consuming a spec
- Policies, which state what must be done and why without prescribing how -- an SOP implements a policy; if the user needs a policy, that is a different document type
- Simple checklists without procedural context -- a checklist is a verification artifact; an SOP is the authoritative procedure. The SOP can generate a checklist as a companion artifact, but they are not the same thing
- Strategic frameworks, decision matrices, or governance models that do not describe step-by-step operational execution

---

## Process

### Step 1: Gather Process Intelligence Before Writing a Single Step

The most common reason SOPs fail is that they are written from memory or from a high-level description rather than from direct process observation. Before drafting anything, collect the following:

- **Process name and document ID prefix.** Ask the user what naming convention is already in place (e.g., SOP-HR-XXX, SOP-OPS-XXX). If none exists, recommend a category-prefix + sequential number format (SOP-[DEPT]-[three digit number]) to enable future cross-referencing.
- **Purpose and desired outcome.** Ask: "What measurable result does a successful execution of this procedure produce?" Outcomes should be specific -- not "invoices are sent" but "all approved invoices are delivered by the 5th business day with zero discrepancies against the contract record."
- **Performer role.** Identify the specific job title or role (Billing Coordinator, IT Technician, Quality Inspector) -- never a person's name. If multiple roles are involved, identify all of them and where each one enters and exits the procedure.
- **Frequency and trigger.** How often is this performed? What event starts it? Monthly close is triggered by a calendar date; a return process is triggered by a customer request; an incident response is triggered by an alert. The trigger belongs in the Purpose section.
- **Current process steps.** Ask the user to walk through the process verbally or in rough notes. If they say "it depends," that is a decision point -- capture both branches.
- **Tools, systems, and materials.** Collect every application, physical tool, form, template, or data source the performer touches. These become prerequisites and appear in step-level context.
- **Decision points.** Ask explicitly: "Are there any steps where you choose to do one thing versus another based on a condition?" Every branch needs an IF/THEN structure.
- **Known failure modes.** Ask: "What goes wrong most often? What would cause someone to stop the procedure?" These populate the Troubleshooting section and may elevate to Warnings.
- **Compliance and safety requirements.** Ask whether this procedure is subject to any regulation, certification, or safety standard. This determines whether the SOP needs witnessed sign-offs, regulatory references, or emergency procedures.
- **Definition of completion.** Ask: "How does the performer know they are done? What records, notifications, or system states confirm the procedure is complete?"

If the user provides a rough or partial description, do not fill gaps with assumptions. Ask clarifying questions. A 90-second gap-filling conversation produces a far more accurate SOP than a confident draft based on incomplete input.

---

### Step 2: Determine the SOP's Position in the Document Hierarchy

SOPs exist within a hierarchy: Policy > Standard > Procedure > Work Instruction > Form/Checklist. Misidentifying the document type is a common error.

- **Policy:** States what must happen and why. Does not describe how. Example: "All customer data must be encrypted at rest."
- **Standard:** Defines the measurable criteria that must be met. Example: "Encryption must use AES-256 or stronger."
- **SOP (Procedure):** Describes the sequence of steps a specific role follows to achieve compliance with the policy and standard. Example: "SOP-IT-012: Encrypting Customer Data on New Storage Volumes."
- **Work Instruction:** A granular sub-task that is too detailed for the main SOP body -- often a sub-procedure called out by reference. Example: "WI-IT-012a: How to configure BitLocker on a Windows Server 2022 volume."
- **Form/Checklist:** A completion artifact generated from the procedure. It records that the procedure was followed, not how to follow it.

If the user's process is extremely long (more than 25 main-path steps) or involves deeply specialized sub-tasks, recommend splitting it: one parent SOP that provides the high-level procedure and references child Work Instructions or sub-SOPs by document ID for the specialized sections. Never pad a single SOP to cover all contingencies -- that is what the document hierarchy is for.

---

### Step 3: Write the Header Metadata and Control Fields

Every SOP must begin with control information that allows version tracking, ownership identification, and scheduled review. Write these fields before the procedure body:

- **Document ID:** Use the agreed naming convention. If none exists, create one and recommend the user adopt it organization-wide.
- **Version number:** Use semantic versioning adapted for documents -- major changes increment the left digit (1.0 to 2.0), minor clarifications increment the right (1.0 to 1.1). The initial release is always 1.0.
- **Effective date:** The date the SOP becomes the authoritative version. This is not the draft date.
- **Supersedes:** The document ID and version this SOP replaces, if applicable. Critical for audit trails.
- **Review date:** Set this based on process stability. High-change processes (quarterly review), stable processes (annual review), safety-critical processes (biannual review or after every incident).
- **Owner:** The role responsible for maintaining accuracy. This is a job title, not a person's name, so the document survives turnover.
- **Approver:** The role who authorized this version. Required for regulated environments. Often a manager one level above the owner.
- **Distribution:** Where this document lives and who has access. Especially important if there are different versions for different audiences (e.g., a sanitized version for auditors vs. the operational version with embedded credentials guidance).

---

### Step 4: Write the Purpose, Scope, Prerequisites, and Definitions

These front-matter sections prevent the two most common SOP failures: starting when preconditions are not met, and misapplying the procedure to situations it was not designed for.

**Purpose (2-4 sentences):**
- State the business problem this procedure solves
- State the measurable outcome of successful execution
- Reference the policy or compliance requirement it supports, if applicable
- Do not describe the steps -- that is the Procedure section's job

**Scope (explicit inclusions AND exclusions):**
- Name the roles this applies to
- Name the systems, locations, or product lines covered
- Explicitly exclude adjacent processes with a cross-reference document ID ("This SOP covers recurring monthly invoices. For one-time project invoices, see SOP-FIN-005.")
- Specify any frequency, volume, or condition thresholds that determine applicability

**Prerequisites (checkboxes, not bullets):**
- Format as a checklist the performer completes before starting -- this is critical because it creates accountability
- Include: system access with the specific permission level required, physical materials or equipment, data inputs that must be received from upstream processes, minimum knowledge or training completion, time requirements ("Allow 90 minutes of uninterrupted time")
- If a prerequisite is conditional, document the condition

**Definitions:**
- Define every acronym, internal term, system name, or threshold value that appears in the procedure
- Define quantity thresholds numerically ("High-value invoice: any single invoice exceeding $10,000")
- Define status terms precisely ("Active contract: a contract with status 'Active' in Salesforce and no pending cancellation request on file")
- If a term is defined in a company glossary or policy, reference that document rather than redefining

---

### Step 5: Write the Procedure Body Using Atomic Steps

This is the core of the SOP. Apply these structural rules without exception:

**Atomic actions:**
Each numbered step is one action. "Open the application and log in" is two actions -- split it. The test is: can the performer do this single step, stop, and be in a valid intermediate state? If yes, it is atomic. If the step leaves them in an incomplete state where they must immediately do the next thing, it probably needs to be combined -- or more likely, the parent action needs to be described with sub-bullets explaining the sub-actions.

**Imperative mood:**
Every step begins with a command verb. "Navigate," "Click," "Enter," "Verify," "Submit," "Escalate," "Record." Never "The form should be submitted" or "You will need to click." Present tense, direct address.

**Expected results:**
After any step where the performer cannot visually or audibly confirm success, add an indented "Expected result" statement. Not every step needs one -- a step that says "Click Submit" on an obvious UI button may not need it. But any step involving a system state change, data transfer, calculation, or physical transformation needs verification.

**Warnings and cautions:**
Place warnings BEFORE the step they relate to, never after. Use a consistent notation:
- `> **WARNING:**` for steps that can cause harm, data loss, irreversible system changes, safety hazards, or compliance violations if performed incorrectly
- `> **CAUTION:**` for steps that can cause errors or rework if not done carefully but are not dangerous
- `> **NOTE:**` for contextual information that helps the performer but is not a safety concern

**Decision points:**
When the procedure branches based on a condition, state the condition explicitly using IF/THEN logic:
- `**IF** [condition is true]: proceed to Step [X].`
- `**IF** [condition is false]: proceed to Step [Y].`
Never write "otherwise" without stating what otherwise means numerically. Cross-reference step numbers explicitly so the performer does not have to read ahead to figure out where to go.

**Phase grouping:**
For procedures with more than 7 steps, group steps into phases with sub-headings (5.1, 5.2, 5.3). Phase names should describe what is being accomplished, not just number the sections. "5.1 Data Extraction," "5.2 Invoice Generation," "5.3 Approval and Delivery" -- each phase represents a distinct operational stage with a clear output that feeds the next phase.

**Role indicators:**
If more than one role performs steps within the procedure, add a "Responsible Role" indicator at the start of each step or each phase heading. This prevents the performer from accidentally executing a step meant for a different role.

---

### Step 6: Add Compliance, Safety, and Approval Controls

Regulatory requirements transform a basic process document into a controlled document. Determine which controls apply based on the domain:

**For financial processes:** Document who has authority to approve transactions above each threshold. Note segregation of duties requirements (the person who creates the transaction should not be the person who approves it). Reference the financial authority matrix if one exists.

**For IT/security processes:** Note change control board (CCB) approval requirements, maintenance window restrictions, rollback procedures, and communication requirements. Reference change management policy.

**For manufacturing/quality processes:** Include inspection hold points where work cannot continue until an authorized inspector signs off. Reference applicable quality standards (ISO 9001 Clause 8.5, for example). Include acceptance criteria with specific tolerances.

**For healthcare/clinical processes:** Include patient safety verification steps. Reference applicable regulations (HIPAA, Joint Commission standards). Include escalation paths if a safety concern is identified.

**For HR/people processes:** Note required documentation retention periods. Reference applicable employment law or internal policy. Include privacy handling requirements for personal data.

Add required sign-off lines after any step that needs witnessed verification. Format as:
```
Performed by: _______________ Date: ___________
Verified by:  _______________ Date: ___________
```

---

### Step 7: Build the Troubleshooting and Verification Sections

**Troubleshooting table:**
Collect every known failure mode during the information-gathering phase. For each:
- Describe the problem symptom as the performer would experience it (not the root cause -- they do not know the root cause yet)
- Identify the most likely cause or causes
- Provide a resolution the performer can attempt themselves
- If resolution requires escalation, name the escalation role and the information they will need

Aim for 4-8 entries covering the most common issues. A troubleshooting section with only one entry looks incomplete; a section with 20 entries signals that the procedure itself is too fragile and should be redesigned.

**Verification checklist:**
The final section before the revision history. This is the completion criteria -- the performer confirms every outcome that must be true for the procedure to be considered successfully executed. Format as a checkbox list. Group into:
- Operational checks (desired output exists and is correct)
- Documentation checks (records are updated, files are saved, logs are written)
- Notification checks (stakeholders are informed, tickets are updated, approvals are on file)
- Compliance checks (required approvals are obtained, audit trail is complete)

---

### Step 8: Review, Validate, and Set the Maintenance Cadence

Before finalizing, apply these quality checks:

- **Completeness check:** Can someone unfamiliar with the process follow this SOP from prerequisites to verification without asking a single question? If no, find the gap.
- **Consistency check:** Are all terms, thresholds, and role names used consistently throughout the document?
- **SME validation:** The person who performs the procedure should walk through the draft step by step. They will catch missing steps, incorrect sequences, and outdated tool names.
- **Second-performer validation:** Ideally, have a different person who has never performed the procedure attempt to follow it. This surfaces assumptions the author made that are not visible in the text.
- **Compliance review:** If the procedure is subject to regulatory requirements, route it to the compliance officer or legal team before publication.
- **Approval signature:** The designated approver signs off before the effective date. This signature is the difference between a draft and a controlled document.

Set the review cadence based on process volatility:
- High-change processes (technology or regulatory changes frequently): 90-day review cycle
- Moderate-change processes: 6-month review cycle
- Stable processes: Annual review cycle
- Safety-critical processes: Review after every incident, regardless of scheduled review date

---

## Output Format

Use this exact structure. Do not omit sections even if they are short -- a missing section in an SOP signals to an auditor that the control was not considered.

```markdown
# SOP: [Descriptive Procedure Name]

**Document ID:** [SOP-DEPT-###]
**Version:** [X.X]
**Effective Date:** [Month DD, YYYY]
**Supersedes:** [Document ID vX.X, or "N/A -- Initial Release"]
**Review Date:** [Month DD, YYYY]
**Owner:** [Job Title]
**Approver:** [Job Title]
**Distribution:** [Where this document is stored and who has access]

---

## 1. Purpose

[2-4 sentences. State the business problem this solves, the measurable outcome of
successful execution, and the policy or compliance requirement it supports, if any.]

## 2. Scope

**Applies to:** [Roles, departments, locations, or systems covered]
**Excludes:** [Adjacent processes not covered, with cross-reference document IDs]

## 3. Prerequisites

Complete all items before beginning the procedure:

- [ ] [System name] access with [specific permission level] confirmed
- [ ] [Data input or upstream artifact] received from [source role]
- [ ] [Physical material or equipment] available and in working condition
- [ ] [Minimum training or certification] completed
- [ ] Estimated time available: [X] minutes of uninterrupted time

## 4. Definitions

| Term | Definition |
|------|------------|
| [Term 1] | [Precise definition with any applicable thresholds or conditions] |
| [Term 2] | [Precise definition] |
| [Acronym] | [Expanded form and meaning in this context] |

## 5. Roles and Responsibilities

| Role | Responsibilities in This Procedure |
|------|------------------------------------|
| [Role 1] | [What they do in this procedure] |
| [Role 2] | [What they do in this procedure] |

## 6. Procedure

### 6.1 [Phase Name -- describes the output of this phase]

> **NOTE:** [Any contextual information the performer needs before starting this phase]

1. [Imperative action verb + object + location/system]
   - **Expected result:** [What the performer should observe to confirm success]

2. [Imperative action verb]
   - **IF** [condition A is true]: proceed to Step 3.
   - **IF** [condition B is true]: proceed to Step 5.

> **WARNING:** [Danger, data loss risk, or compliance violation that will occur if the
> next step is performed incorrectly. Place before the step, never after.]

3. [Critical action step]
   - **Expected result:** [Verification]
   - **Required approval:** [Role] must approve before proceeding. Obtain approval via [method].

### 6.2 [Phase Name]

4. [Action step] | **Responsible Role:** [Role Name]

5. [Action step]
   - **Expected result:** [Verification]

6. [Action step]

---
Performed by: ___________________________ Date: ___________
Title: ___________________________________
---

### 6.3 [Phase Name]

7. [Action step]

8. [Action step]
   - **Expected result:** [Verification]

---
Verified by: ____________________________ Date: ___________
Title: ___________________________________
---

## 7. Verification

Confirm all items are true before closing this procedure:

**Operational:**
- [ ] [Desired output exists and meets quality criteria]
- [ ] [System state reflects successful completion]

**Documentation:**
- [ ] [Records updated in system/location]
- [ ] [Log or tracker entry completed]
- [ ] [Files saved to correct location with correct naming convention]

**Notifications:**
- [ ] [Stakeholder notified via method]
- [ ] [Ticket or workflow item updated to status]

**Compliance:**
- [ ] [Required approval on file]
- [ ] [Audit trail entry exists]

## 8. Troubleshooting

| Symptom | Most Likely Cause | Resolution | Escalate To |
|---------|-------------------|------------|-------------|
| [What the performer observes] | [Root cause] | [Steps to resolve] | [Role if self-resolution fails] |
| [Symptom] | [Cause] | [Resolution] | [Role] |
| [Symptom] | [Cause] | [Resolution] | [Role] |

## 9. Related Documents

| Document ID | Title | Relationship |
|-------------|-------|--------------|
| [SOP-DEPT-###] | [Title] | [Feeds into / Fed by / Sub-procedure of] |
| [Policy-###] | [Title] | [Governing policy this SOP implements] |

## 10. Revision History

| Version | Effective Date | Author | Changes Made | Approved By |
|---------|----------------|--------|--------------|-------------|
| 1.0 | [Date] | [Name, Role] | Initial release | [Name, Role] |
```

---

## Rules

1. **One atomic action per numbered step, without exception.** The test: can the performer do this step, stop, and be in a valid state? If the answer is no, the step is not atomic. Common violations include "Open X and navigate to Y" (two actions), "Verify A and update B" (two actions), and "Enter the data and click Save" (two actions). Split every compound instruction.

2. **Warnings precede dangerous steps -- always.** An auditor reviewing a safety incident will check whether the warning appeared before or after the step. A warning that appears after a dangerous step is a documentation failure. If you catch yourself writing a warning after a step, move the warning block above the step, not below it.

3. **Use imperative mood exclusively.** Every step begins with a command verb. "Click," "Navigate," "Enter," "Verify," "Confirm," "Escalate," "Record," "Submit." Never "You should click," "The form needs to be submitted," or "It is important to verify." Passive voice in an SOP is not a style preference -- it is an ambiguity that becomes a compliance liability.

4. **Never assume the performer knows what success looks like.** Every step involving a system state change, data transformation, calculation, or physical process outcome must have an "Expected result" statement. A step that says "Run the batch job" without an expected result leaves the performer with no way to know whether the job succeeded, failed silently, or produced corrupt output.

5. **IF/THEN branching must reference step numbers, never vague directions.** "If the invoice is over the limit, get approval" is not a decision point -- it is a suggestion. The correct form is: "**IF** invoice total exceeds $10,000: proceed to Step 9. **IF** invoice total is $10,000 or less: proceed to Step 10." The performer must never need to search the document to understand where to go.

6. **A draft is not a controlled document.** An SOP becomes authoritative only when it carries a version number, an effective date, an owner, and an approver signature. Do not present a draft as a complete SOP. If the approval process is not yet complete, mark the document clearly as DRAFT and do not include an effective date until approval is obtained.

7. **No SOP should exceed 25 main-path steps.** If the main path requires more than 25 steps, the procedure is almost certainly composed of multiple distinct sub-procedures that should be broken out into child SOPs or Work Instructions referenced by document ID. Long SOPs are not followed. They are filed and ignored.

8. **Decision points that are not explicitly defined will be resolved inconsistently.** Every time a performer encounters an undocumented decision, they will make a judgment call. Different performers will make different calls. These inconsistencies accumulate into quality defects, compliance gaps, and audit findings. Every conditional must be documented with explicit criteria.

9. **Prerequisites are a checklist, not a paragraph.** A paragraph describing prerequisites is difficult to use under operational pressure. A formatted checkbox list is a verification artifact -- the performer signs off that each prerequisite is met before starting. This creates accountability and prevents the most common cause of procedure failure: starting before conditions are ready.

10. **Set a review date that matches process volatility.** An SOP with an expired review date is a liability in an audit. For technology-dependent procedures, set 6-month reviews. For stable financial or HR procedures, set 12-month reviews. For safety-critical procedures, set 6-month reviews AND add a clause requiring review after any incident, near-miss, or system change that affects the procedure.

11. **Define every threshold numerically.** "High-value," "large batch," "significant delay," and "excessive error rate" are not SOP language. Every threshold that affects a decision must be stated as a number with a unit: "$10,000," "more than 50 records," "longer than 2 business days," "more than 3% error rate." Ambiguous thresholds produce inconsistent decisions.

12. **Name the document owner by role, not by person.** An SOP that names Jane Smith as owner is orphaned the moment Jane leaves the organization. Name the role ("Finance Manager," "IT Operations Lead") so that ownership transfers with the position and the SOP remains maintained.

---

## Edge Cases

**The process is almost entirely undocumented and exists only in one person's head.**
Do not ask them to write it out -- you will get the idealized version, not the actual version. Instead, gather information through a process walkthrough: ask them to narrate what they are doing as they perform it, or immediately after they have just performed it. Record the narration (with permission) or take detailed notes. The first draft should reflect what they actually do, including the workarounds and exceptions. Then ask: "Is this how it's supposed to work, or is this what you do to make it work?" That question surfaces the gap between the designed process and the actual process -- both need to be documented.

**The procedure has dozens of branches and conditional paths.**
A heavily branched procedure written as a single linear numbered list becomes unnavigable. Use two structural approaches together: (1) Keep the main path to 12-15 steps representing the most common execution. Move each major branch into a sub-procedure section at the end of the document (Section 6.4, 6.5, etc.) and reference it from the main path step with an explicit cross-reference. (2) For procedures with more than 4 distinct paths, consider adding a flowchart as an appendix. The flowchart does not replace the written procedure but helps the performer orient before they start. Never let the flowchart be the authoritative document -- flowcharts cannot carry the level of detail needed for compliance.

**The procedure involves a handoff between two or more roles and there is disagreement about who owns each step.**
This is a governance problem, not a documentation problem -- but the SOP can make the governance problem visible and force resolution. Add a "Responsible Role" column to the procedure table. Use RACI notation where needed: R (Responsible -- does the work), A (Accountable -- owns the outcome), C (Consulted -- provides input), I (Informed -- notified of completion). Run the completed RACI through the relevant managers for sign-off before the SOP is approved. Unresolved RACI conflicts should be logged as open issues and the SOP should not be marked effective until they are resolved, because an SOP with unclear role ownership will not be followed consistently.

**The procedure is for a safety-critical operation (industrial, clinical, IT systems that affect availability).**
Elevate the safety controls: (1) Every step with a safety implication needs a WARNING block in the prescribed format -- not just an inline note. (2) Critical steps require a witnessed verification -- a second qualified person must observe and sign off, not just the performer. Add explicit signature lines with "Performed by" and "Verified by" fields directly in the procedure body. (3) Add a Section 0 -- "Emergency Procedures" -- before the main procedure, not as an appendix, so it is the first thing the performer encounters if the document is opened in a crisis. (4) Include the emergency contacts, system emergency shutdown procedures, and rollback steps prominently. (5) Route the draft to a safety officer or risk manager for review before approval.

**The process changes frequently because the underlying system or regulation is evolving.**
Use a modular SOP structure. Separate the stable core procedure from the volatile elements. Put stable elements (purpose, scope, roles, core workflow) in the main SOP body. Put volatile elements -- specific system navigation paths, screen layouts, field names, regulatory thresholds -- in a separately numbered Appendix with its own version control. The Appendix can be updated and re-approved independently without triggering a full re-approval of the parent SOP. Reference the Appendix by document ID within the procedure step ("See Appendix A for current field mapping"). This approach is especially valuable for procedures that reference software systems, which change with every product update.

**The user says "just make it simple -- we don't need all the formal sections."**
Resist the urge to omit control sections because they feel bureaucratic. At minimum, every SOP requires: a version number and date, an identified owner, a purpose statement, numbered steps in imperative mood, and a verification section. The sections that feel most bureaucratic -- revision history, approver signatures, review dates -- are precisely the sections that protect the organization during an audit or incident investigation. You can adjust the formatting to be lighter (a brief one-page SOP versus a 12-page document) but the minimum required elements must be present. If the user genuinely needs something lighter than a full SOP, they may need a Work Instruction or a Checklist instead -- clarify the appropriate document type before reducing the structure.

**The SOP needs to be localized for multiple languages or regional regulatory environments.**
Create the English master document first and establish it as the authoritative version. Translated versions must reference the master document ID and version to which they correspond. Note in the Scope section which regulatory jurisdiction the master version addresses and which regional appendices or variant documents address other jurisdictions. Never merge conflicting regulatory requirements into a single document -- create jurisdiction-specific versions as child documents of the master SOP.

**The procedure is being written retrospectively after a process failure or audit finding.**
A corrective action SOP has a higher bar than a routine documentation effort. Add a "Background" note in the Purpose section acknowledging the trigger (without assigning blame) and referencing the incident report or audit finding number. This creates traceability from the compliance event to the control document. Ensure the SOP specifically addresses the root cause identified in the incident report -- if the failure was caused by an unclear decision point, the SOP must now make that decision point explicit and verifiable. Route to legal or compliance review before approval, because the SOP may be referenced in regulatory response correspondence.

---

## Example

**Input:** "I need an SOP for our IT team's process of provisioning access for new employees. The IT helpdesk creates accounts in Active Directory and Office 365, assigns them to the correct security groups based on the department, and the manager has to approve the access within 24 hours. We've had audit findings because sometimes people get access to systems they shouldn't, so we need this to be tight. HR triggers the process when they send a 'New Hire Access Request' form."

---

**Output:**

```markdown
# SOP: New Employee System Access Provisioning

**Document ID:** SOP-IT-008
**Version:** 1.0
**Effective Date:** January 15, 2026
**Supersedes:** N/A -- Initial Release
**Review Date:** July 15, 2026
**Owner:** IT Helpdesk Manager
**Approver:** Director of IT
**Distribution:** IT Helpdesk team SharePoint site (IT-OPS > Procedures > SOP-IT-008).
Accessible to: IT Helpdesk team, IT Manager, HR Operations. Read-only access for
Internal Audit.

---

## 1. Purpose

Ensure that all new employees receive the minimum necessary system access required
for their role on or before their first day, and that no access is granted without
documented manager approval. This procedure implements the company's Principle of
Least Privilege access control policy (Policy-SEC-002) and addresses Audit Finding
AF-2025-14, which identified instances of over-provisioned access resulting from
undocumented security group assignments.

## 2. Scope

**Applies to:** IT Helpdesk Technicians provisioning access for all full-time and
part-time employees hired through the standard HR onboarding process.

**Excludes:**
- Contractor and vendor account provisioning (see SOP-IT-011)
- Access requests for existing employees changing roles (see SOP-IT-009)
- Emergency temporary access grants (see SOP-IT-015)
- Application-specific access that requires approval from a system owner beyond
  standard security groups (see SOP-IT-012 for ERP access provisioning)

## 3. Prerequisites

Complete all items before beginning account creation:

- [ ] New Hire Access Request form received from HR Operations via the IT
      Service Desk ticketing system (ServiceNow), with ticket status "New --
      Awaiting Provisioning"
- [ ] New Hire Access Request form contains all required fields: legal name,
      employee ID, start date, department, job title, direct manager name
      and email address, and office location
- [ ] Start date is at least 2 business days in the future (same-day provisioning
      requires IT Manager approval -- see Edge Case: Expedited Provisioning)
- [ ] IT Technician has Active Directory Administrator access confirmed
- [ ] IT Technician has Microsoft 365 Admin Center access confirmed
- [ ] Department Access Matrix (IT-OPS SharePoint > Reference > Access Matrix v4.2)
      is open and accessible

## 4. Definitions

| Term | Definition |
|------|------------|
| New Hire Access Request | The standardized form submitted by HR Operations via ServiceNow that triggers this procedure. Form template: HRFORM-009. |
| Standard Security Group | A pre-defined Active Directory group mapped to a department and job function, listed in the Department Access Matrix. Grants access to file shares, applications, and system resources appropriate to that role. |
| Elevated Access Group | Any Active Directory group that grants access beyond the standard role assignment -- for example, administrator rights, financial system write access, or access to personally identifiable information (PII). Requires manager approval AND IT Manager countersignature. |
| Principle of Least Privilege | The security policy (Policy-SEC-002) requiring that users are granted only the access necessary to perform their defined job function -- no more. |
| Over-provisioned | A state in which a user has access to systems, data, or resources beyond what their job function requires. This is the condition Audit Finding AF-2025-14 identified. |
| Provisioning Complete | System state in which the user's Active Directory account is active, all required security groups are assigned, and manager approval is documented in ServiceNow. |

## 5. Roles and Responsibilities

| Role | Responsibilities in This Procedure |
|------|------------------------------------|
| IT Helpdesk Technician | Executes all provisioning steps. Sole individual who creates accounts and assigns group memberships. |
| Hiring Manager | Reviews and approves the assigned access groups within 24 hours of the approval request. Approves or denies access before the account is activated. |
| IT Helpdesk Manager | Approves any Elevated Access Group assignments. Receives escalations for overdue manager approvals. |
| HR Operations | Submits the New Hire Access Request form and is notified upon provisioning completion. |

## 6. Procedure

### 6.1 Request Validation

> **NOTE:** Do not begin account creation until the request is validated as
> complete. An account created from an incomplete request is the leading cause
> of incorrect security group assignments. This step takes approximately 5 minutes.

1. Open the ServiceNow ticket linked to the New Hire Access Request.
   - **Expected result:** Ticket is in status "New -- Awaiting Provisioning" and
     contains the completed HRFORM-009 as an attachment.

2. Verify that all required fields in HRFORM-009 are populated: legal name,
   employee ID, start date, department, job title, direct manager name and email,
   and office location.
   - **IF** all required fields are present: proceed to Step 3.
   - **IF** any required field is missing: update the ServiceNow ticket status to
     "On Hold -- Incomplete Request," add a comment identifying the missing fields,
     and notify HR Operations via the ticket. Do not proceed until the complete form
     is resubmitted.

3. Look up the employee's job title and department in the Department Access Matrix
   (IT-OPS SharePoint > Reference > Access Matrix v4.2).
   - **Expected result:** The matrix returns a defined set of Standard Security
     Groups for the role. Record the group names in the ServiceNow ticket notes field.

4. Review the security groups identified in Step 3 for any groups flagged as
   "Elevated Access" in the Access Matrix.
   - **IF** no Elevated Access groups are assigned: proceed to Step 5.
   - **IF** one or more Elevated Access groups are required: do not proceed until
     you receive written IT Manager approval via email or ServiceNow ticket update.
     Attach the approval to the ticket before continuing.

### 6.2 Account Creation

> **NOTE:** Complete Steps 5 through 8 in a single session. Do not create an
> account and leave it incomplete -- a partially provisioned account is a
> security risk because it may be active without appropriate group assignments.

5. Open Active Directory Users and Computers and navigate to the correct
   Organizational Unit (OU) for the employee's department.
   - **Expected result:** The OU is visible in the directory tree and matches the
     department listed in the New Hire Access Request.

> **WARNING:** Do not create the account in the default "Users" container.
> Accounts created outside the correct OU will not inherit the department Group
> Policy Objects (GPOs), resulting in incorrect system configurations and access
> restrictions that require manual remediation.

6. Create a new user account with the following attributes:
   - First name, last name, and display name: as listed in HRFORM-009
   - Username format: [firstname.lastname]@[companydomain].com
   - Employee ID: enter in the "Employee Number" attribute field
   - Account status: set to DISABLED (do not enable until manager approval is
     received in Step 12)
   - **Expected result:** Account appears in the correct OU with status "Disabled"
     and all fields populated correctly. Verify by opening the account properties
     and confirming each field.

7. Set the initial password according to the current Password Policy (Policy-SEC-001
   Section 4.2): minimum 14 characters, one uppercase, one lowercase, one number,
   one special character. Use the IT Helpdesk Password Generator tool.
   - Record the temporary password in the ServiceNow ticket using the encrypted
     Password field -- do not enter it in the general Notes field.
   - **Expected result:** Password is set and the "User must change password at
     next login" checkbox is enabled.

8. Add the user account to all Standard Security Groups identified in Step 3.
   Assign groups one at a time, confirming each addition before proceeding to the next.
   - **Expected result:** The "Member Of" tab in the user's account properties
     shows exactly the groups from the Access Matrix -- no more, no fewer. Take a
     screenshot and attach it to the ServiceNow ticket.

### 6.3 Office 365 Provisioning

9. Open the Microsoft 365 Admin Center and navigate to Users > Active Users >
   Add a User.

10. Create the Office 365 account using the same username created in Step 6.
    Assign the license type appropriate for the department as specified in the
    Department Access Matrix column "O365 License Tier."
    - **Expected result:** Account appears in Active Users with the correct license
      assigned and status "Setup in progress."

11. Confirm Azure AD Connect synchronization of the new account.
    - Navigate to Azure Active Directory > Users and search for the new account.
    - **Expected result:** Account appears in Azure AD within 30 minutes of creation.
      If the account does not appear within 30 minutes, see Troubleshooting -- Azure
      AD Sync Delay.
    - **Required approval:** Do not enable the account in Step 12 until Azure AD
      sync is confirmed.

### 6.4 Manager Approval

> **NOTE:** Manager approval is required before any account is activated.
> This control directly addresses Audit Finding AF-2025-14. Do not skip or
> defer this step under any circumstances, including time pressure from the
> hiring manager.

12. Send the manager approval request via the ServiceNow Approval Workflow:
    - Open the ticket, navigate to the Approval tab, select "New Hire Access
      Approval," and enter the hiring manager's email address from HRFORM-009.
    - The workflow will send the manager an email listing the security groups
      assigned and requesting confirmation.
    - Update the ticket status to "Pending Manager Approval."
    - **Expected result:** ServiceNow shows an open approval request assigned to
      the hiring manager with a due date 24 hours from the current time.

13. Monitor for manager response.
    - **IF** manager approves within 24 hours: proceed to Step 14.
    - **IF** no response is received within 24 hours: escalate to the IT Helpdesk
      Manager, who will contact the hiring manager directly. Document the escalation
      in the ticket. Do not enable the account without approval.
    - **IF** manager requests changes to the security group assignment: return to
      Step 3, update the group list in the ticket notes, modify the Active Directory
      group membership, take a new screenshot, and resubmit the approval request.

14. Upon receiving manager approval in ServiceNow, enable the Active Directory
    account by right-clicking the account in Active Directory Users and Computers
    and selecting "Enable Account."
    - **Expected result:** Account status changes from "Disabled" to active (the
      red X icon is removed from the account icon).

---
Performed by: _____________________________ Date: ___________
IT Helpdesk Technician (print name): _____________________________
ServiceNow Ticket #: _____________________________
---

### 6.5 Notification and Closure

15. Send the new employee's login credentials to the hiring manager via encrypted
    email (not to the employee directly -- the employee has not yet verified their
    identity). Include: username, temporary password, instructions for first login,
    and a link to the IT self-service portal.
    - **Expected result:** Hiring manager acknowledges receipt via email reply.
      Attach the acknowledgment to the ServiceNow ticket.

16. Update the ServiceNow ticket: change status to "Resolved," enter the
    completion date, and add a summary note listing the accounts created, security
    groups assigned, and manager approval reference number.

17. Notify HR Operations by updating the ticket and tagging the HR Operations
    group: "Access provisioning complete for [Employee Name] (EMP-ID). Account
    active as of [date/time]. Manager approval on file: ServiceNow Approval #[X]."

---
Verified by: _____________________________ Date: ___________
IT Helpdesk Manager (print name): _____________________________
---

## 7. Verification

Confirm all items are true before the ServiceNow ticket is closed:

**Operational:**
- [ ] Active Directory account exists in the correct OU with correct attributes
- [ ] Account status is "Enabled" and "User must change password at next login"
      is checked
- [ ] Active Directory security group membership matches the Department Access
      Matrix exactly -- no additional groups added
- [ ] Office 365 account active with correct license tier assigned
- [ ] Azure AD sync confirmed -- account visible in Azure AD

**Documentation:**
- [ ] Screenshot of AD "Member Of" tab attached to ServiceNow ticket
- [ ] Manager approval record visible in ServiceNow Approval tab with approval
      timestamp
- [ ] Temporary credentials sent to hiring manager, acknowledgment attached to
      ticket
- [ ] ServiceNow ticket status set to "Resolved" with completion summary note

**Notifications:**
- [ ] Hiring manager notified with credentials
- [ ] HR Operations notified of completion via ServiceNow ticket update

**Compliance:**
- [ ] No Elevated Access groups assigned without IT Manager countersignature on file
- [ ] Audit trail complete: every action in this procedure is traceable in
      ServiceNow ticket history and Active Directory audit logs
- [ ] Account was DISABLED at creation and only ENABLED after documented manager
      approval -- confirm this sequence is visible in the AD audit log

## 8. Troubleshooting

| Symptom | Most Likely Cause | Resolution | Escalate To |
|---------|-------------------|------------|-------------|
| Job title not found in Department Access Matrix | New role not yet added to the matrix, or job title wording differs from the standardized role list | Search the matrix by department rather than job title. If no match exists, place ticket On Hold and contact IT Helpdesk Manager to obtain the correct group assignment before proceeding. | IT Helpdesk Manager |
| Azure AD sync does not complete within 30 minutes | Azure AD Connect sync cycle delayed or stopped | Open the Azure AD Connect server, open the Synchronization Service Manager, and check for errors. If no active sync cycle is running, initiate a manual delta sync. If errors are present, do not attempt to resolve manually -- escalate immediately. | IT Infrastructure Lead |
| Manager approval not received within 24 hours | Manager out of office, email not received, or approval email filtered to spam | IT Helpdesk Manager contacts the manager directly by phone. If the manager is unavailable, escalate to the manager's direct supervisor. Document all contact attempts in the ticket. Never enable an account without obtaining approval from an authorized approver. | IT Helpdesk Manager |
| Account creation fails in Active Directory -- "The object already exists" error | Previous employee with same name or a duplicate provisioning attempt | Search Active Directory for existing accounts with the same name. If a terminated account exists, do not reactivate it -- create a new account. If a duplicate provisioning attempt occurred, use the existing account if it is correctly configured. Document the resolution in the ticket. | IT Helpdesk Manager |
| Hiring manager requests security groups not in the Access Matrix | Manager attempting to grant additional access outside the standard provisioning process | Explain that non-standard access requires a separate access request (SOP-IT-009) submitted after the employee's first day. Complete the standard provisioning with the correct matrix groups. Do not add non-standard groups to the new hire provisioning. | N/A -- redirect to SOP-IT-009 |
| Start date is same day and provisioning has not been completed | Late HR form submission or missed ticket | Requires IT Manager approval to proceed with expedited provisioning. IT Manager must acknowledge the risk of a compressed approval timeline in writing in the ServiceNow ticket. All other steps remain mandatory -- no steps may be skipped even under time pressure. | IT Helpdesk Manager |

## 9. Related Documents

| Document ID | Title | Relationship |
|-------------|-------|--------------|
| Policy-SEC-002 | Principle of Least Privilege Access Control Policy | Governing policy this SOP implements |
| SOP-IT-009 | Employee Access Change Request | Used when an existing employee's role changes and access must be modified |
| SOP-IT-011 | Contractor and Vendor Account Provisioning | Parallel procedure for non-employee access -- different approval chain |
| SOP-IT-012 | ERP System Access Provisioning | Sub-procedure for ERP-specific access requiring system owner approval |
| SOP-IT-015 | Emergency Temporary Access Grant | Used when business-critical access is needed outside the standard timeline |
| HRFORM-009 | New Hire Access Request Form | Input document that triggers this procedure |
| IT-OPS: Access Matrix v4.2 | Department Access Matrix | Reference document listing standard security groups by role |

## 10. Revision History

| Version | Effective Date | Author | Changes Made | Approved By |
|---------|----------------|--------|--------------|-------------|
| 1.0 | January 15, 2026 | J. Patel, IT Helpdesk Manager | Initial release. Created in response to Audit Finding AF-2025-14 to formalize access provisioning controls and document manager approval requirements. | D. Reyes, Director of IT |
```
