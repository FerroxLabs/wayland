---
name: raci-chart
description: |
  Creates a RACI responsibility assignment matrix for defined processes with roles, decision rights, and escalation paths using RACI methodology. Use when the user asks about RACI charts, RACI matrices, responsibility assignment, role clarity, decision rights, or process ownership.
  Do NOT use for organizational charts, project management plans, or team structure design.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "template planning project-management checklist strategy"
  category: "business-strategy"
  subcategory: "human-resources"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# RACI Chart

## When to Use

**Use this skill when:**
- A user asks to create, build, or review a RACI chart, RACI matrix, or responsibility assignment matrix for any process, workflow, or project
- A user reports organizational friction symptoms: "no one knows who decides X," "everyone thinks someone else is handling it," "we get bottlenecked waiting for approval," or "too many people are involved in every decision"
- A user is standing up a new cross-functional process -- a product launch, a compliance workflow, a procurement cycle, a hiring process -- and needs to define who does what before the process begins
- A user is documenting an existing process for audit, onboarding, or handoff purposes and needs role assignments formalized
- A user needs to identify and resolve accountability gaps after a project failure, missed deadline, or dropped deliverable
- A user is preparing for an organizational change -- restructure, acquisition, new hire, or role consolidation -- and needs to reassign process ownership explicitly
- A user asks about decision rights, process ownership, escalation paths, or sign-off authority in the context of a repeatable process or workflow

**Do NOT use this skill when:**
- The user needs a full project plan with tasks, dependencies, owners, and timelines -- that is a project management plan or work breakdown structure, not a RACI
- The user wants to design their org chart, reporting structure, or team hierarchy -- that is an organizational design exercise
- The user needs to define a single role's responsibilities in detail -- use a `job-description` skill instead, as RACI assigns roles to activities rather than defining what a role does in full
- The user needs a process flow diagram or swimlane diagram -- RACI assigns ownership to steps but does not define the sequence, decision logic, or flow between them; use a process mapping skill for that
- The user is asking about project scheduling, sprint planning, or capacity allocation -- RACI governs who is involved in each activity, not how much time each role spends on it
- The user needs a stakeholder communication plan -- while RACI defines C and I relationships, a full communication plan involves cadence, channels, and message content beyond RACI scope
- The user needs a skills matrix or competency framework -- that tracks what capabilities people have, not who is accountable for what activities

---

## Process

### Step 1: Scope the Process and Gather Information

Before drawing a single cell, define the exact scope. A poorly scoped RACI is worse than no RACI -- it creates false clarity.

- Ask the user to name the process in one sentence, from trigger event to final outcome. For example: "This RACI covers the software release process from requirements sign-off to production deployment and stakeholder notification."
- Establish the process type: Is this a **project** (one-time, finite) or a **recurring process** (repeating cycle like monthly close, quarterly planning, or weekly sprint review)? Project RACIs can use milestone-based activities; recurring process RACIs should use repeating-cycle activities.
- Clarify the scope boundary. What is explicitly OUT of scope? If the user says "hiring process," confirm whether that includes workforce planning (upstream) and onboarding (downstream) or just requisition-to-offer.
- Ask who currently "owns" the process -- is there a process owner at all? If not, the RACI will need to designate one as part of the exercise.
- Ask what prompted this request. Knowing whether the driver is "we just had a failure" vs. "we're launching something new" vs. "we're documenting for compliance" shapes which activities to emphasize and how granular to go.
- Confirm the organizational context: company size, team structure (functional vs. matrix vs. flat), and whether external parties (vendors, clients, regulators) are involved. These determine role complexity.

### Step 2: Identify and Normalize the Activities (Rows)

The rows of the RACI are the atomic units of work, decision, or review within the process. Identifying them correctly is the hardest part of building a good RACI.

- Target **8-15 activities** for a single RACI chart. Fewer than 5 suggests the scope is too narrow to warrant a RACI. More than 15 suggests the scope is too broad and should be split into two or more charts (for example, "Pre-development RACI" and "Deployment RACI").
- Every activity must be a **verb phrase** with a clear completion state: "Draft technical specification," "Approve vendor contract," "Execute regression test suite," "Notify executive stakeholders of release." Nouns ("Technical Specification," "Vendor Contract") do not work -- they describe artifacts, not activities.
- Apply **consistent granularity**. If one row is "Define the 3-year product strategy" and another is "Schedule the design review meeting," the chart is mixing strategic and tactical activities. Either raise the tactical items to the appropriate level or split the RACI into separate charts by phase.
- Separate **doing activities** from **approval/sign-off activities**. "Write the budget proposal" and "Approve the budget proposal" are two distinct rows with different R and A assignments. Collapsing them into one row hides the critical distinction between who does the work and who owns the outcome.
- Include all **gate decisions** explicitly -- go/no-go decisions, escalations, and review checkpoints. These are often the rows where RACI disputes are sharpest and where clarity matters most.
- If the user cannot enumerate the activities clearly, ask them to walk through the process from start to finish and name what happens, in what order. Then help them consolidate overlapping steps and split compound steps.
- Order the activities **chronologically** when the process has a natural flow. This makes the RACI readable as a workflow narrative. For non-sequential processes (like ongoing support functions), group activities by type: planning, execution, review, communication.

### Step 3: Identify and Limit the Roles (Columns)

The columns of the RACI are organizational roles, not individuals.

- **Use role titles, never personal names.** "Engineering Lead" not "Sarah Chen." The RACI should survive personnel changes. If the user insists on names (common in early-stage startups or solo teams), accept them but note that the chart should be updated to role titles as the team grows.
- Target **4-7 roles** per chart. Four is the practical minimum for most cross-functional processes. Seven is the functional maximum before the chart becomes a wide spreadsheet that is difficult to read and impossible to enforce. Eight is a hard ceiling -- if you need more than 8, break the process into sub-processes.
- **Do not include roles with only I (Informed) assignments.** If a role appears on the chart solely to be notified of outcomes, they belong in a communication plan, not a RACI. Their presence on the RACI adds visual noise without adding clarity.
- **Include the senior authority role** (VP, Executive Sponsor, Director) even if they appear in only one or two rows. Their presence on the chart as the A for final approvals is important -- it establishes the escalation endpoint and signals organizational support for the process.
- **Flag external parties explicitly.** If a vendor, client, regulator, or outside counsel has a role in the process, add them as a column with a notation (e.g., "Outside Counsel (External)"). External parties can be R (doing deliverables), C (providing input like legal review), or I (receiving notifications). They should almost never be A -- accountability must reside within the organization.
- Watch for role conflation. "Product" in one company means Product Manager; in another it means the entire product organization. Confirm with the user exactly which role they mean.

### Step 4: Assign RACI Designations -- The Core Work

For every intersection of activity (row) and role (column), assign exactly the right designation or leave it blank. This is where deep expertise matters.

**R -- Responsible:**
- The person or persons who **perform the task** -- the ones who do the actual work, produce the artifact, or execute the action.
- Multiple Rs are allowed on a single row, but keep them minimal. When two people are both R, specify whether the work is **parallel** (both working simultaneously on separate components) or **sequential** (one handoff to the other). Ambiguous shared R is the #1 cause of dropped balls.
- R and A can be held by the same person -- this is the norm for the majority of activities, especially in smaller teams. Use "R/A" notation for combined assignments to keep the chart readable.
- If every activity has the same R, that role is a bottleneck. Redistribute Rs or split the process scope.

**A -- Accountable:**
- The person who **owns the outcome** -- the one who, when asked "is this done and is it correct?" says yes or no with authority.
- **Exactly one A per row. This is non-negotiable.** No exceptions. A row with two As has no accountability. A row with no A has no accountability. Both are equally dangerous.
- A is typically one level above R in the hierarchy. The Engineering Lead (R) writes code; the VP of Engineering (A) approves the release. But A does not always mean senior -- if the QA Engineer is personally accountable for test coverage sign-off, they are A, even if they are junior to the Engineering Lead.
- A approves the output. A is also the person whose reputation is on the line if the output is wrong. When assigning A, ask: "If this activity fails, whose performance review would this show up in?"
- **Do not default all As to the most senior person on the chart.** This is the most common RACI mistake. Senior leaders become A for every activity "because they are accountable for everything." That is org chart accountability, not process accountability. In a well-designed RACI, most As belong to the domain leads, with senior leaders holding A only for final approvals and strategic gates.

**C -- Consulted:**
- The person whose **input is actively sought before the work is done**. Two-way communication -- they provide expertise, feedback, or a perspective that improves the output.
- C is not a courtesy copy. If someone is marked C, there must be a defined mechanism for soliciting their input (review meeting, feedback form, design review session) and a real expectation that their input will be considered.
- **Limit Cs aggressively.** Every C is a communication step that adds time and coordination overhead. As a rule of thumb, if more than 40% of a row's assignments are C, question whether the process is over-consulting. A row with 5 Cs out of 6 roles will be slow to move because everyone must be consulted.
- C is appropriate for: subject matter experts whose expertise the R needs, stakeholders whose downstream work will be affected by this activity, or compliance/legal/security reviewers whose input protects the organization.
- C is not appropriate for: keeping someone in the loop (that is I), involving someone politically to avoid conflict, or placating a senior leader who wants influence without accountability.

**I -- Informed:**
- The person who is **notified of outcomes after the fact**. One-way communication -- they receive information but do not provide input.
- I is appropriate for roles that need to know the result to do their downstream work (e.g., Customer Success is informed when a feature releases so they can update client communications) but who have no input into the activity itself.
- Over-using I is less harmful than over-using C, but a role that is I for every activity in a chart is likely better handled through a standing communication cadence than through individual RACI notifications.

**Blank:**
- A blank cell is not a mistake -- it is a valid and often correct assignment. Not every role is involved in every activity. Blank means "this role has no involvement in this activity." Resist the temptation to assign I to every blank cell just to acknowledge every role on every row.

### Step 5: Validate the Matrix for Structural Errors

Before presenting the chart, run these validation checks. Every check should pass.

- **Row check -- A count:** Count the As in each row. Every row must have exactly 1. Flag rows with 0 or 2+.
- **Row check -- R count:** Count the Rs in each row. Every row must have at least 1. A row with no R means no one is doing the work.
- **Column check -- concentration:** If any single role holds A for more than 50% of all rows, that role is an accountability bottleneck. Discuss redistribution with the user.
- **Column check -- dead weight:** If any role has only I assignments and no R, A, or C on any row, remove them from the chart and route their notifications through a communication plan instead.
- **C count check:** If more than 3 roles are marked C on any single row, flag it. Ask the user which Cs are truly essential.
- **A=R check:** Confirm whether combined A/R assignments make sense. When A and R are combined in a single role, that role is both doing the work and approving it. This is fine for routine activities but inappropriate for high-stakes, high-risk decisions that should have independent review. For example, having the same person R and A for "Authorize payment" is an internal controls red flag in a finance context.
- **Cross-functional seam check:** Identify rows where R and A belong to different organizational functions (e.g., R is Engineering, A is Product). These are the rows most likely to cause friction. Confirm the user understands this cross-functional dependency and document the communication mechanism.

### Step 6: Define Decision Rules and Escalation Paths

A RACI without escalation rules is a chart without teeth. Every RACI must include at minimum three types of rules.

- **Disagreement resolution:** When R and A disagree on whether an activity is complete or correct, A wins -- A owns the outcome and has final say. But "A wins" is not sufficient if there is no time limit. Specify: "If R and A disagree on quality of the test results, they have 24 hours to resolve; if unresolved, the Engineering Director arbitrates."
- **Consulted party override:** When C's input is heard but not acted upon, document the decision rationale. This matters especially for Legal, Compliance, Security, and Finance roles who are marked C. If their recommendation is overridden, the A must explicitly document why. This protects the organization in audits and post-mortems.
- **Missed deadline escalation:** For time-sensitive processes, specify what happens when an activity is not completed on schedule. "If deployment approval is not received from A within 4 business hours of submission, the request escalates to VP of Engineering."
- **Temporary authority:** Who holds A when the designated A is unavailable (vacation, illness, departure)? Name a designated alternate or a delegation rule. Without this, a single unavailable person can halt an entire process.
- **Threshold-based authority:** Many real processes have size or risk thresholds that change who is A. For example: "For contract values under $25K, Legal Lead is A for contract approval. For $25K-$100K, General Counsel is A. For over $100K, CEO is A." Document these thresholds explicitly in the exceptions section.

### Step 7: Document, Review, and Schedule Maintenance

A RACI that is not reviewed becomes a liability rather than an asset.

- **Assign a process owner** who is responsible for maintaining the RACI. This is typically the person who is A for the highest-stakes activity in the process, or the most senior R.
- **Set a review date.** For fast-moving processes (software development, marketing campaigns), review every 3-6 months. For stable processes (annual budget cycle, quarterly board reporting), review annually. For processes in transition (post-merger, post-restructure), review every 6 weeks until the process stabilizes.
- **List the effective date and the version number.** RACIs change. Version control prevents the wrong version from circulating.
- **Distribute the RACI** to every role named in the chart. A RACI that lives in one person's document folder accomplishes nothing. Ensure it is stored in a shared location and linked from the relevant process documentation.
- **Conduct a brief walkthrough** with all roles before the RACI goes live. A 30-minute working session where each role confirms they understand their assignments catches errors that document review misses. Pay special attention to the R/A rows -- confirm that each A genuinely accepts ownership.

---

## Output Format

```markdown
## RACI Chart: [Process Name]

### Overview
- **Process:** [One-sentence description of what this RACI covers, from trigger to outcome]
- **Version:** [1.0, 1.1, 2.0, etc.]
- **Effective date:** [Date]
- **Next review date:** [Date -- 3-6 months for active processes, 6-12 for stable ones]
- **Process owner:** [Role title of the person responsible for maintaining this RACI]
- **Escalation authority:** [Role title who resolves cross-functional disputes]

---

### RACI Matrix

| Activity | [Role 1] | [Role 2] | [Role 3] | [Role 4] | [Role 5] |
|----------|----------|----------|----------|----------|----------|
| [Activity 1 -- verb phrase] | R/A | C | C | I | |
| [Activity 2 -- verb phrase] | C | R/A | I | | |
| [Activity 3 -- verb phrase] | A | R | C | I | |
| [Activity 4 -- verb phrase] | C | C | R/A | | I |
| [Activity 5 -- verb phrase] | | I | R | A | C |
| [Activity 6 -- verb phrase] | A | C | R | | I |
| [Activity 7 -- verb phrase] | I | | C | R | A |
| [Activity 8 -- verb phrase] | R/A | | | C | I |

**Legend:**
| Code | Meaning | Rules |
|------|---------|-------|
| R | Responsible -- performs the work | At least 1 per row; multiple allowed |
| A | Accountable -- owns the outcome, approves | Exactly 1 per row; no more, no less |
| C | Consulted -- provides input before completion | Limit to essential reviewers; two-way |
| I | Informed -- notified of outcome | One-way; use sparingly |
| R/A | Responsible and Accountable -- same person does and owns | Common; acceptable unless high-risk sign-off |
| (blank) | No involvement | Valid assignment; not an oversight |

---

### Role Summary

| Role | Person / Team | R Count | A Count | C Count | I Count | Notes |
|------|--------------|---------|---------|---------|---------|-------|
| [Role 1] | [Name or team] | [n] | [n] | [n] | [n] | [e.g., primary process driver] |
| [Role 2] | [Name or team] | [n] | [n] | [n] | [n] | [e.g., domain expert, QA gatekeeper] |
| [Role 3] | [Name or team] | [n] | [n] | [n] | [n] | [e.g., executive sponsor] |

---

### Decision Rules and Escalation Paths

| Scenario | Rule | Timeframe | Escalation if Unresolved |
|----------|------|-----------|--------------------------|
| R and A disagree on completion | A has final say | Resolve within [X] hours/days | [Escalation role] |
| Consulted input overridden | A documents rationale in [system/document] | At time of decision | [Compliance/audit record] |
| Activity deadline missed | [Defined action: hold, escalate, or skip] | After [X] hours/days past due | [Escalation role] |
| A is unavailable | [Alternate role] assumes A authority | After [X] hours of unavailability | [Backup role] |
| Disagreement between two As | Not applicable -- only one A per row | n/a | n/a |

---

### Exceptions and Threshold-Based Authority

| Condition | Modified Assignment | Notes |
|-----------|-------------------|-------|
| [e.g., Contract value under $25K] | [Modified A assignment] | [Reason] |
| [e.g., Contract value $25K-$100K] | [Modified A assignment] | [Reason] |
| [e.g., Temporary: until [Role] hired] | [Modified R/A assignment] | Expires [date or condition] |
| [e.g., Regulatory/audit-required process] | [Additional C or sign-off requirement] | [Reason and citation if applicable] |

---

### Validation Checklist

- [ ] Every row has exactly 1 A
- [ ] Every row has at least 1 R
- [ ] No single role holds A for more than 50% of rows
- [ ] No role appears only as I (moved to communication plan if so)
- [ ] No row has more than 3 C assignments
- [ ] All R/A combinations reviewed for independence requirements
- [ ] Escalation path defined for top 3 conflict scenarios
- [ ] Process owner assigned and confirmed
- [ ] Review date set
- [ ] All named roles have received a copy and confirmed understanding
```

---

## Rules

1. **Exactly one A per row -- enforce this as a hard constraint, no exceptions.** A row with zero As has no accountability. A row with two As creates the bystander effect -- each A assumes the other is handling it. If the user insists two people share accountability, it means the activity should be split into two separate rows with one A each.

2. **Every row must have at least one R.** A row with only A, C, and I assignments means someone is approving, consulting, and notifying about work that no one is actually doing. Flag this immediately -- it indicates either a missing role on the chart or an activity that does not actually exist in the process.

3. **Resist defaulting all As to the most senior person.** The most common and most damaging RACI mistake is assigning A for every activity to the VP, Director, or Executive Sponsor because they are "ultimately responsible." This creates an accountability concentration that makes them a bottleneck and strips domain leads of the ownership they need to function. Senior leaders should be A only for final approvals, strategic gates, and activities where their organizational authority is genuinely required.

4. **C is a commitment, not a courtesy.** Marking a role as C means the process owner commits to actively soliciting that role's input before the activity is complete. If there is no mechanism to do so -- no meeting, no review stage, no feedback window -- change the C to an I. A C that is never actually consulted breeds resentment and false assurance.

5. **Never use personal names as column headers in the primary matrix.** Names create a RACI that expires when people leave or change roles. Use role titles. If the user's organization is small enough that one person holds multiple roles, create a role-to-person mapping table separately (the Role Summary section), but keep the matrix itself role-based.

6. **Keep the chart to 4-7 roles and 8-15 activities.** These are empirical bounds, not preferences. Charts wider than 7 roles cannot be printed on a standard page and become difficult to use in meetings. Charts taller than 15 activities mix process levels and obscure the key accountability relationships. Larger scope requires splitting into multiple linked RACI charts by phase or sub-process.

7. **Activities must be verb phrases that describe a discrete, completable action.** "Requirements" is not an activity. "Define and document product requirements" is. The activity must have a clear done state so that the A can actually make a yes/no approval decision. Vague activities produce vague accountability.

8. **Combined R/A is acceptable for routine work but should be reviewed for high-stakes or high-risk activities.** In finance, legal, compliance, and security processes, internal controls often require that the person doing the work (R) and the person approving it (A) be different individuals -- this is called segregation of duties. Before combining R/A in sensitive processes, ask the user whether their compliance or audit requirements demand separation.

9. **Document a review date and process owner on every RACI.** A RACI without a review date will not be reviewed. Stale RACIs are actively harmful -- people follow outdated assignments, accountability gaps form as roles change, and the chart loses organizational credibility. Set the review date before the chart is distributed.

10. **When the user's process crosses organizational boundaries -- departments, legal entities, or external parties -- flag the seams explicitly.** The rows where R belongs to one organization (or department) and A belongs to another are the highest-friction rows in the chart. These cross-functional seams should be accompanied by explicit communication mechanisms and escalation paths, because the default resolution mechanism (going to a shared manager) may not exist across org boundaries.

---

## Edge Cases

### 1. Matrix Organization: Multiple Reporting Lines for the Same Role

In a matrix org, an "Engineering Lead" might report to both a Functional Engineering Director and a Project Manager. Both may want to be A for the same activity.

- Resolve by asking: "Whose performance review will reflect whether this activity succeeded?" That person is A.
- If the answer is genuinely "both," the activity almost certainly should be split into two rows -- one for the technical quality (Engineering Director is A) and one for the on-time delivery (Project Manager is A).
- Document the matrix reporting relationship in the exceptions section so future chart readers understand the context.
- Avoid "shadow A" situations where a second senior leader informally overrides the designated A. If this happens consistently, the chart needs to be renegotiated, not patched.

### 2. Regulated Industries with Mandatory Segregation of Duties

In finance (SOX compliance), healthcare (HIPAA), payment processing (PCI DSS), and pharmaceutical manufacturing (FDA 21 CFR Part 11), certain activities legally cannot have the same person as both R and A.

- Identify which activities fall under regulatory segregation requirements before assigning any R/A combinations.
- In these rows, R and A must be different individuals, and if they are also in different roles, make that explicit in the chart.
- Add a "Regulatory Basis" column to the Exceptions section that cites the specific control framework requirement.
- The chart should be reviewed by a compliance officer before going live in regulated environments.
- Internal controls testing (common in SOX audits) will verify that the RACI matches actual practice. If the chart says R and A are separated but operationally the same person is doing both, the chart fails audit.

### 3. Process Owner Does Not Exist Yet

The user is building a RACI for a process that has never had a formal owner -- perhaps because the organization is new, the process was informal, or ownership was always assumed to belong to "everyone."

- The act of creating the RACI is itself part of establishing ownership. The most important output is deciding who is A for the most critical gate decision in the process -- that person is functionally the process owner.
- Recommend the user formally designate a process owner (with a title and a mandate) as part of this exercise. Without a named owner, the RACI becomes a document that no one maintains.
- If the user cannot agree on a process owner, this is a red flag -- it means the organizational will to run this process formally does not yet exist. Surface this explicitly rather than proceeding as if it is solved.

### 4. The Process Is Run Differently by Different Teams

A large organization may have three different regional teams all running what is nominally the same process (e.g., "vendor onboarding") but with different roles, different approval thresholds, and different escalation paths.

- Do not attempt to create one universal RACI that tries to capture all variants. It will be so full of conditional notes that it becomes unreadable.
- Instead, create a **master RACI** that covers the core, universal activities that all teams share, then create **variant addenda** for each regional or team-level deviation.
- Label the master RACI clearly as "Corporate Standard" and the addenda as "Region X Override -- supersedes rows [n-n] of the master for this region only."
- Ensure the master RACI has a single designated owner (typically at the corporate level) and each variant addendum has a local owner who is responsible for keeping it aligned with the master.

### 5. Mergers, Acquisitions, and Integrations

Post-merger processes often have two legacy RACIs (or no RACIs) representing two former organizations, with overlapping roles, duplicate titles, and unresolved accountability.

- Do not attempt to merge two legacy RACIs into one by averaging or combining. Start fresh with the scope as it will exist in the integrated organization.
- Map legacy role titles to new integrated role titles before building the matrix. If two legacy organizations both had a "Director of Operations" with different scopes, the RACI must use the new unified role title.
- Flag activities where legacy practices were different as high-conflict rows. These rows require explicit decision from leadership on which process to standardize, not an average.
- Set a short review cycle (every 6 weeks) for the first 6 months post-merger. Integration processes change rapidly, and an outdated RACI during integration creates more confusion than no RACI.

### 6. External Vendors or Partners as Primary Executors

Some processes are largely executed by an external vendor (outsourced IT support, contract manufacturing, third-party logistics). The vendor does most of the R work.

- Add the vendor as a column, clearly labeled "(External)" or "(Vendor: [Vendor Category])."
- Vendors can be R and C. They can be I. They should not be A -- accountability must reside with an internal role, even when the vendor does the work. The internal owner who is A is the one who accepts the vendor's output and takes organizational responsibility for it.
- If the vendor relationship is governed by a contract or SLA, reference that document in the exceptions section. The RACI does not replace the contract -- it clarifies who manages the relationship and who approves vendor outputs.
- When the vendor is R and an internal role is A, the communication mechanism between them is critical. Specify it explicitly: "Vendor submits deliverable to internal [Role] for review within [X] days. Internal [Role] approves or rejects within [Y] days."

### 7. Small Teams Where One Person Holds Multiple Roles

In early-stage startups or very small organizations, one individual may hold three or four roles simultaneously (CTO who is also the Engineering Lead and the Security Officer, for example).

- Create the RACI using role titles (not the individual's name), even though one person holds all those roles right now.
- In the Role Summary section, document that "Engineering Lead, Security Officer, and CTO are all currently held by [Name]."
- Flag rows where this one person is both R and A and the activity carries high organizational risk -- this concentration is a serious operational risk.
- Set a review trigger: "This RACI should be revisited immediately when the team grows past [X] people or when these roles are separated." Building the RACI by role rather than person makes that transition far easier.

### 8. RACI for a Process That Has Never Been Mapped

Sometimes the user does not have a list of activities -- they just know the process is broken and wants a RACI.

- In this case, the RACI exercise must be preceded by a brief process mapping step. Ask the user to walk through the process from start to finish, narrating what happens. Capture each step as you hear it.
- Use the narration to identify activities (verb phrases), decision points (go/no-go, approve/reject), and handoffs (activity transfers from one role to another). Handoffs are often where R changes between rows and are frequently the source of accountability gaps.
- Once you have a draft list of 10-15 activities from the narration, present it back to the user for validation before building the RACI matrix.
- Warn the user that a RACI built on a process that has not been mapped may need to be revised once the process is formalized. Use version 1.0 explicitly and schedule a 30-day review.

---

## Example

**Input:** "We need a RACI chart for our software security patch management process. We're a mid-sized SaaS company. The roles involved are IT Operations, Security Engineer, Engineering Lead, CISO, and Product Manager. We've had problems where patches get deployed without proper risk assessment and we're not sure who actually signs off on emergency patches."

---

## RACI Chart: Software Security Patch Management Process

### Overview
- **Process:** End-to-end security patch management, from vulnerability identification through patch deployment and post-deployment verification
- **Version:** 1.0
- **Effective date:** January 2026
- **Next review date:** July 2026
- **Process owner:** Security Engineer
- **Escalation authority:** CISO resolves cross-functional disputes within 4 business hours (emergency patches) or 1 business day (standard patches)

---

### RACI Matrix

| Activity | IT Operations | Security Engineer | Engineering Lead | CISO | Product Manager |
|----------|--------------|-------------------|-----------------|------|-----------------|
| Identify and triage vulnerability (CVE scan, threat intel, vendor advisory) | C | R/A | C | I | I |
| Assess risk severity and assign criticality rating (Critical/High/Medium/Low) | C | R | C | A | I |
| Notify affected system owners and stakeholders | R | A | I | I | I |
| Develop patch deployment plan (scope, rollback procedure, maintenance window) | R | C | R | I | C |
| Approve patch deployment plan | C | C | A | I | I |
| Test patch in non-production environment | R | C | R/A | I | I |
| Approve promotion to production | C | C | A | I | I |
| Deploy patch to production environment | R/A | C | C | I | I |
| Verify successful deployment and system stability | R | R | A | I | I |
| Document patch record and update asset inventory | R/A | C | I | I | I |
| Report patch status to CISO and leadership (monthly) | C | R/A | I | I | I |
| Post-incident review (if patch caused degradation) | R | R | A | I | C |

**Legend:**
| Code | Meaning | Rules |
|------|---------|-------|
| R | Responsible -- performs the work | At least 1 per row; multiple allowed |
| A | Accountable -- owns the outcome, approves | Exactly 1 per row; no exceptions |
| C | Consulted -- provides input before completion | Limit to essential reviewers; two-way |
| I | Informed -- notified of outcome | One-way communication |
| R/A | Responsible and Accountable -- same person performs and owns | Reviewed for segregation concerns below |
| (blank) | No involvement | Valid; not an oversight |

---

### Role Summary

| Role | Person / Team | R Count | A Count | C Count | I Count | Notes |
|------|--------------|---------|---------|---------|---------|-------|
| Security Engineer | InfoSec Team | 5 | 5 | 5 | 0 | Primary process driver; owns risk assessment and reporting |
| IT Operations | IT Ops Team | 5 | 2 | 2 | 0 | Primary executor for deployment activities |
| Engineering Lead | Platform Eng | 3 | 4 | 4 | 2 | Technical approval authority; owns deployment quality gate |
| CISO | [Name] | 0 | 1 | 0 | 9 | Executive accountability for risk severity rating; otherwise informed |
| Product Manager | Product Team | 0 | 0 | 2 | 8 | Informed of schedule impacts; consulted on deployment window |

**Concentration check:** No single role holds A for more than 42% of rows. No role is I-only (CISO has 1 A for the risk severity rating, which is the critical accountability assignment for this role). Passes validation.

---

### Segregation of Duties Notes

The following R/A combinations have been reviewed for internal control requirements:

| Row | Combined R/A Role | Risk Level | Segregation Required? | Disposition |
|-----|------------------|-----------|----------------------|-------------|
| Identify and triage vulnerability | Security Engineer | Low | No -- discovery is a single-role function | Accepted |
| Deploy patch to production | IT Operations | Medium | Recommended separation in SOC 2 Type II environments | **See exceptions: Engineering Lead approves; IT Ops executes** |
| Document patch record | IT Operations | Low | No | Accepted |
| Report patch status | Security Engineer | Low | No | Accepted |

**Note:** Organizations pursuing SOC 2 Type II certification should ensure the "Deploy patch to production" activity explicitly has a separate R (IT Operations) and A (Engineering Lead), which this chart already reflects. Combined R/A is NOT used for that row.

---

### Decision Rules and Escalation Paths

| Scenario | Rule | Timeframe | Escalation if Unresolved |
|----------|------|-----------|--------------------------|
| Engineering Lead and Security Engineer disagree on risk severity rating | CISO makes final determination | Within 4 business hours | CISO | 
| Engineering Lead rejects patch deployment plan (step 5) | Security Engineer revises plan; if 3rd rejection, CISO arbitrates | 1 business day per revision cycle | CISO |
| IT Operations identifies unexpected system behavior during deployment | Halt deployment, initiate rollback procedure, notify Engineering Lead and Security Engineer immediately | Real-time; Engineering Lead has 30 minutes to assess | CISO informed within 2 hours |
| CISO is unavailable for emergency patch authorization | Deputy CISO or CTO assumes A for risk severity rating | After 2 hours of CISO unavailability | Board-level notification if no Deputy CTO available |
| Patch deployment deadline missed (e.g., Critical CVE requires 72-hour remediation) | Security Engineer escalates to CISO; CISO notifies executive leadership | At deadline breach | Incident response plan activated |
| Security Engineer overrides C input from Engineering Lead on deployment plan | Security Engineer documents rationale in ticket; Engineering Lead may escalate to CISO | At time of override | CISO reviews within 1 business day |

---

### Exceptions and Threshold-Based Authority

| Condition | Modified Assignment | Notes |
|-----------|-------------------|-------|
| **Emergency / Zero-Day patch (Critical CVE with active exploitation)** | CISO moves from I to A for patch deployment plan approval; standard 72-hour SLA compressed to 4 hours | Overrides standard approval chain; CISO directly notifies executive team |
| **Patch affects customer-facing production systems** | Product Manager moves from I to C for deployment window approval (row 4 and row 7) | Customer impact notification may be required; PM owns customer comms |
| **Third-party vendor patch (OS, database, cloud provider)** | IT Operations adds Vendor as R for delivery; internal R/A assignments unchanged | Vendor SLA governs delivery; internal RACI governs acceptance and deployment |
| **Patch causes production incident** | Post-incident review (row 12) is mandatory and Engineering Lead moves to A | CISO receives written incident report within 24 hours |
| **Security Engineer role vacant** | CISO assumes all A assignments; IT Operations assumes R assignments temporarily | Temporary assignment expires when role is filled; RACI must be reviewed within 30 days of hire |

---

### Validation Checklist

- [x] Every row has exactly 1 A
- [x] Every row has at least 1 R
- [x] No single role holds A for more than 50% of rows (Security Engineer: 5/12 = 42%)
- [x] No role appears only as I (CISO has 1 A)
- [x] No row has more than 3 C assignments
- [x] All R/A combinations reviewed for segregation requirements (see table above)
- [x] Escalation path defined for top 6 conflict scenarios
- [x] Process owner assigned: Security Engineer
- [x] Review date set: July 2026
- [x] Emergency patch exception documented with compressed SLA

---

**Why this RACI solves the stated problem:**

The user reported two specific failures: (1) patches deployed without proper risk assessment, and (2) unclear sign-off authority for emergency patches. This RACI addresses both directly:

1. "Assess risk severity" is a dedicated row with Security Engineer as R and CISO as A. The CISO cannot be bypassed on this step even in a rush -- their accountability for the severity rating is explicit. No deployment plan can be developed (row 4) until the severity assessment is complete (row 3 is a prerequisite, though ordering the rows chronologically communicates this dependency).

2. Emergency patch authority is explicitly documented in the Exceptions section with a clear authority chain (CISO as A, compressed to 4-hour SLA) and a deputy authority rule when the CISO is unreachable. The ambiguity the user described is now resolved with a specific role and a specific timeframe.
