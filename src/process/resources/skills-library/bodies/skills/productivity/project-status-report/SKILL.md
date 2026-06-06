---
name: project-status-report
description: |
  Generates a structured project status report from project state inputs including RAG status, accomplishments, upcoming milestones, blockers, and decisions needed. Produces a consistent-format report for personal or small-team projects.
  Use when the user asks about writing a status report, tracking project progress, creating a project update, or communicating project health to stakeholders.
  Do NOT use for project kickoff planning (use project-kickoff), retrospective facilitation (use retrospective-facilitator), or enterprise portfolio reporting (use business project-management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management report template"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Project Status Report

## When to Use

**Use this skill when:**
- A user needs to produce a recurring status report for an active project -- weekly, biweekly, or monthly cadence -- and wants a consistent format that stakeholders can scan in under two minutes
- A user asks how to communicate project health to a sponsor, client, manager, or collaborator who is not embedded in day-to-day work
- A user wants to establish a RAG (Red/Amber/Green) reporting discipline so that status is objective and comparable across periods rather than anecdotal
- A user has a project underway with identifiable milestones, a budget, and a deadline, and needs to document what happened and what comes next
- A user has blockers or decisions that need stakeholder attention and wants to surface them clearly without burying them in narrative prose
- A user is preparing a verbal status update (standup, steering meeting, sponsor review) and wants a structured one-pager to anchor the conversation
- A user wants a written record of project health over time -- for accountability, lessons-learned, or performance documentation

**Do NOT use when:**
- The user is launching a brand-new project for the first time and needs a charter, scope statement, or kickoff agenda -- use `project-kickoff` instead
- The user wants a retrospective or post-mortem after the project closes -- use `retrospective-facilitator` instead
- The user needs to build or replan the project schedule, milestone sequence, or work breakdown structure -- use `milestone-planning` instead
- The user needs a formal risk assessment, probability-impact matrix, or risk register -- use `risk-assessment` instead; risk items surface in the status report but are not deeply analyzed here
- The user is managing a portfolio of 5+ projects and needs roll-up reporting, resource utilization analysis, or executive dashboard content -- use enterprise business project-management skills instead
- The user wants a meeting agenda or facilitation guide for a status meeting -- this skill produces the written artifact, not the meeting design
- The user is tracking personal tasks or habits without a defined end date or stakeholder -- a simple to-do list or journal is more appropriate than a status report

---

## Process

### Step 1: Establish the Reporting Context Before Writing Anything

Ask for or confirm the following before drafting:

- **Project name** -- what to call it in the header (be specific: "Website Redesign -- Phase 2" beats "Marketing Project")
- **Reporting period** -- exact date range this report covers (e.g., June 10--June 16), not just "Week 3"
- **Report number** -- if this is a recurring series, include a sequential number (Report #3 of an expected 8). This allows stakeholders to understand cadence and spot gaps.
- **Audience** -- a sponsor who approved budget needs different depth than a collaborating teammate. Identify one primary audience; the executive summary adapts to them.
- **Whether a prior report exists** -- if yes, ask for the previous RAG ratings and any open blockers or decisions carried from that report. Continuity between reports is what makes status reporting useful.
- **Reporting cadence commitment** -- confirm when the next report is due so the "Next Report Due" field is accurate. Weekly cadence is appropriate for high-risk or fast-moving projects; biweekly for steady-state work; monthly for low-activity or long-horizon projects.

If the user provides all information in one prompt, extract it directly. If they provide a narrative ("things went okay this week, we got the design done but the dev environment is broken"), interview them with targeted follow-up questions to fill gaps before drafting.

### Step 2: Determine RAG Status for Each Dimension Using Consistent Thresholds

Never let the user assign RAG ratings without applying objective criteria. Use these thresholds across all reports:

**Schedule RAG:**
- GREEN: On track or ahead. No milestone slippage. Completion date unchanged.
- AMBER: 1--7 calendar days behind plan on current milestone OR completion date at risk but recoverable within current scope. A credible recovery plan exists.
- RED: 8+ calendar days behind plan, OR completion date will slip without scope reduction or resource addition, OR a milestone has already been missed with no recovery plan in place.

**Budget RAG (when budget is tracked):**
- GREEN: Cumulative spend within 5% of planned spend-to-date. No unbudgeted items pending.
- AMBER: Cumulative spend 6--15% over plan-to-date, OR a known unbudgeted cost is pending approval but within contingency reserve.
- RED: Cumulative spend 16%+ over plan-to-date, OR contingency reserve exhausted, OR cost overrun requires stakeholder authorization to continue.

**Scope RAG:**
- GREEN: Delivering exactly what was agreed. No change requests open or pending.
- AMBER: A change request is open and under evaluation. Scope creep has been identified but not yet approved. Outcome uncertain.
- RED: Scope has been reduced without stakeholder approval, OR approved scope cannot be delivered within current constraints, OR unauthorized work is consuming capacity.

**Quality RAG:**
- GREEN: Deliverables meet acceptance criteria. No rework items open.
- AMBER: Minor rework identified on 1--2 deliverables. Issue is contained, no impact on downstream milestones.
- RED: A deliverable failed acceptance review and must be substantially reworked. A downstream milestone depends on the failed item. Delivery risk is elevated.

**Overall RAG:** The overall rating equals the worst individual dimension. If schedule is RED and everything else is GREEN, the overall is RED. Never average the ratings. A project that is under budget but two weeks late is a RED project.

Document the reasoning for each rating in the Detail column of the status table -- one specific sentence explaining why that rating was chosen. Vague ratings ("budget looks okay") erode trust; precise ratings ("spent $4,200 of $8,000 at 50% of timeline -- on track") build it.

### Step 3: Compile Accomplishments with Specificity and Timing

For each item the user mentions completing this period:

- Convert vague descriptions into concrete deliverables. "Worked on the design" becomes "Completed high-fidelity mockups for homepage and product listing page -- 2 of 5 screens done."
- Record the actual completion date, not the week. "Finished Tuesday" is useful; "finished this week" is not.
- Compare actual to planned: was the item on time, early, or late? If late, by how many days? This creates accountability without blame and generates useful data for estimating future work.
- If a task was started but not completed, it belongs in Upcoming Work (with a revised target), not Accomplishments. Partial credit obscures true progress.
- List items in chronological order of completion, not by importance. This makes the report scannable and makes the timeline of events clear.
- Aim for 3--7 accomplishments per period. Fewer suggests insufficient reporting granularity or a slow period (note which one). More than 7 suggests the items are too granular -- consolidate to deliverable level, not task level.

### Step 4: Document Upcoming Work with Dependencies and Risk

For each planned item in the next reporting period:

- Assign a specific target date, not a week number. "By June 23" is actionable; "next week" is ambiguous and cannot be tracked on the next report.
- Identify every dependency for each item: internal (requires another task to be done first) and external (requires input, approval, or delivery from outside the project team). External dependencies are where projects stall -- surface them explicitly.
- Assign a risk level (Low / Medium / High) to each upcoming item. Use this heuristic: Low = no dependencies, similar work already completed successfully; Medium = one uncertain dependency or new type of work; High = multiple dependencies, external stakeholders involved, or no similar prior work to reference.
- Flag anything where completion is contingent on an open blocker or unresolved decision. Write "BLOCKED -- pending [decision name]" in the Dependencies column rather than pretending the item will simply proceed.
- Limit upcoming work to items realistically achievable in the next reporting period. Over-promising in status reports is one of the most common ways project managers lose stakeholder trust. If the list is long, note what has been de-prioritized and why.

### Step 5: Document Blockers with Precision and Urgency

A blocker is anything that will prevent planned work from completing on schedule without external action. It is not the same as a risk (something that might happen) or a concern (something to monitor). Apply this test: "If this situation does not change, will a planned milestone slip?" If yes, it is a blocker.

For each blocker:

- Name the specific work item that is blocked. Not "the project" -- the specific task or milestone.
- Identify the root cause of the block, not just the symptom. "Flooring is delayed" is a symptom. "Supplier did not ship on time due to warehouse backlog" is the cause.
- Assign an owner -- the specific person (by name or role) who has the authority to resolve it. If the resolution requires the user's own decision, they are the owner.
- State a requested resolution as a concrete ask: "Please confirm revised delivery date by June 18" or "Approve switch to alternative vendor." Not "we need this resolved soon."
- Set a resolution deadline -- the latest date by which the blocker must be resolved to avoid impacting the next milestone. Calculate this backward from the milestone date, not forward from today.
- Track blockers from report to report. A blocker that persists across two periods without a status change is an escalation signal. Note "Carried from Report #2 -- no progress" rather than presenting it as new.

If there are no blockers, write "No blockers this period" explicitly. Never omit the section -- an empty blockers section tells stakeholders the project is clear, which is meaningful information.

### Step 6: Frame Decisions Needed so Stakeholders Can Act

Every item in the Decisions Needed section must be constructed so a stakeholder can read it, understand the options, and respond with a decision -- not request more information. Use this structure:

- **Decision statement:** A single clear question. "Should we proceed with the original flooring supplier or switch to an in-stock alternative?"
- **Options:** List exactly the viable options with one or two relevant data points for each. Do not include options that are not genuinely viable -- this wastes stakeholder attention.
- **Recommendation:** State a preferred option and the one-sentence reason. Do not present options without a recommendation unless the decision is genuinely a values or preference question rather than a technical one. Stakeholders expect the project owner to have a view.
- **Decision deadline:** The specific date by which the decision must be made to avoid impacting the schedule. Include the downstream consequence of missing the deadline: "Decision needed by June 18 -- if not made by then, flooring installation will slip to June 25 and push project completion by one week."

If no decisions are needed, write "No decisions required this period" explicitly.

### Step 7: Assemble and Format the Complete Report

Apply these formatting disciplines when assembling the report:

- **Executive summary goes first** -- a 2--3 sentence paragraph above the status table. Written in plain language. Stakeholders who read nothing else should still understand overall project health, the most important accomplishment, and the most important action needed from them.
- **Status table before narrative** -- the RAG table must appear before any prose so stakeholders can orient instantly.
- **One page equivalent** -- the full report should fit in roughly 500--700 words of content. If it is longer, the items are too granular. Consolidate tasks into deliverables, remove items that require no action, and move historical context to a Notes section or a separate change log.
- **Consistent terminology** -- use the same names for milestones across reports. If "Phase 2 design review" appeared in Report #2, it must appear with the same name in Report #3, not renamed "the design approval step."
- **Dates, not relative references** -- replace all "next week," "yesterday," and "soon" with specific dates. Reports are read asynchronously and archived; relative time references become meaningless within days.
- **Bold the most important thing** -- in the executive summary and the notes section, bold the single most critical piece of information for stakeholders: the key risk, the key win, or the required action. This respects stakeholder time and guides their attention.

---

## Output Format

```
## Project Status Report -- [Project Name]
**Report #[N] of [Expected Total] | [Reporting Period: Month DD -- Month DD, YYYY]**

---

### Executive Summary
[2--3 sentences. State overall status in plain terms. Name the most important accomplishment 
this period. Name the most critical action needed from stakeholders. Written for someone who 
will not read the rest of the report.]

---

### Report Header

| Field | Value |
|-------|-------|
| Project | [Full project name -- Phase/Version if applicable] |
| Report Number | #[N] |
| Report Date | [Date this report is issued] |
| Reporting Period | [Start date] to [End date] |
| Report Author | [Name or role] |
| Primary Audience | [Sponsor / Client / Manager / Team] |
| Next Report Due | [Date] |

---

### Overall Status: [🟢 GREEN / 🟡 AMBER / 🔴 RED]

| Dimension | Status | Detail |
|-----------|--------|--------|
| Schedule | [G/A/R] | [Specific: "On track -- M3 completes June 20 as planned" or "5 days behind -- flooring delayed"] |
| Scope | [G/A/R] | [Specific: "No change requests open" or "1 change request pending approval"] |
| Budget | [G/A/R] | [Specific: "$X of $Y spent (Z%) -- on/over/under plan-to-date" -- omit row if no budget tracked] |
| Quality | [G/A/R] | [Specific: "All deliverables accepted" or "Homepage mockup requires rework -- 2 days"] |

**Overall status is [color] because:** [One sentence explaining the determining factor -- which 
dimension drove the overall rating and why.]

---

### Progress Summary

- **Overall completion:** [X of Y milestones complete] ([Z]%)
- **Current active milestone:** [Milestone name] -- [On track / At risk / Delayed by X days]
- **Projected completion date:** [Date] ([Unchanged / Moved from original date of (date)])
- **Key project metric:** [Domain-specific measure: e.g., "8 of 22 features shipped," "4 of 6 
  chapters drafted," "3 of 5 rooms complete"]

---

### Accomplishments This Period

| # | Deliverable/Milestone | Completed | vs. Plan | Notes |
|---|-----------------------|-----------|----------|-------|
| 1 | [Specific deliverable name] | [Date] | [On time / X days early / X days late] | [Optional: quality note or unexpected result] |
| 2 | [Specific deliverable name] | [Date] | [On time / X days early / X days late] | |
| 3 | [Specific deliverable name] | [Date] | [On time / X days early / X days late] | |

*Items in progress but not yet complete are listed in Upcoming Work below, not here.*

---

### Upcoming Work -- Next Period ([Period dates])

| # | Milestone/Deliverable | Target Date | Owner | Dependencies | Risk |
|---|-----------------------|-------------|-------|-------------|------|
| 1 | [Specific deliverable] | [Date] | [Person/role] | [Internal or external dependency, or "None"] | [Low/Med/High] |
| 2 | [Specific deliverable] | [Date] | [Person/role] | [Dependency] | [Low/Med/High] |
| 3 | [Specific deliverable] | [Date] | [Person/role] | [Dependency] | [Low/Med/High] |

---

### Blockers

| # | Blocked Item | Root Cause | Owner | Requested Resolution | Resolution Deadline | Carried From |
|---|-------------|-----------|-------|---------------------|--------------------|-|
| 1 | [Specific task/milestone blocked] | [Root cause, not symptom] | [Named person or role] | [Specific ask] | [Date -- and consequence if missed] | [New / Report #N] |

*If no blockers: "No blockers this period. All planned work is proceeding without external impediments."*

---

### Decisions Needed

| # | Decision | Options | Recommendation | Deadline | Consequence if Delayed |
|---|----------|---------|---------------|----------|------------------------|
| 1 | [Single clear question] | A: [Option + key data point]. B: [Option + key data point] | [Option letter] -- [one sentence reason] | [Date] | [What slips if decision misses deadline] |

*If no decisions needed: "No decisions required this period."*

---

### Risks and Issues Log

| # | Risk/Issue | Category | Probability | Impact | Status | Mitigation/Action | Last Updated |
|---|-----------|----------|-------------|--------|--------|-------------------|-------------|
| 1 | [Description] | [Schedule/Budget/Scope/Quality/External] | [Low/Med/High] | [Low/Med/High] | [New/Active/Monitoring/Mitigated/Closed] | [Current action or owner] | [Date] |
| 2 | [Description] | | | | | | |

---

### Notes and Context

[Freeform section. Use for: observations that don't fit other sections, positive signals worth 
documenting, lessons being applied from prior periods, context a new reader would need to 
understand the report, or anything that would otherwise be said verbally but not documented. 
Keep to 3--5 sentences. Bold the single most important sentence.]

---

### Report History (Last 3 Periods)

| Report # | Period | Overall | Schedule | Budget | Key Issue |
|----------|--------|---------|----------|--------|-----------|
| [N-2] | [Dates] | [G/A/R] | [G/A/R] | [G/A/R] | [One phrase] |
| [N-1] | [Dates] | [G/A/R] | [G/A/R] | [G/A/R] | [One phrase] |
| [N -- current] | [Dates] | [G/A/R] | [G/A/R] | [G/A/R] | [One phrase] |

*Omit this section on Report #1. Populate from prior reports on Report #2 onward.*
```

---

## Rules

1. **The overall RAG status is always the worst individual dimension -- never an average.** A project that is GREEN on budget and scope but RED on schedule is a RED project. Averaging ratings produces false confidence and is one of the most common ways status reports mislead stakeholders.

2. **Every RAG rating must be justified with a specific number or fact in the Detail column.** "Schedule: AMBER -- 5 days behind plan on milestone M3" is acceptable. "Schedule: AMBER -- slightly behind" is not. Vague ratings cannot be acted upon or compared across periods.

3. **Accomplishments must be deliverables, not activities.** "Held three planning meetings" is an activity. "Completed scope document reviewed and approved by client" is a deliverable. Activities consume time; deliverables produce value. Report deliverables.

4. **Never soften bad news.** If the project is RED, the executive summary says the project is red. Do not use language like "some challenges remain" or "we are working through some issues" to avoid discomfort. Stakeholders who receive softened bad news cannot make good decisions, and the writer loses credibility when reality becomes apparent.

5. **Blockers that persist across two reports without status change require an escalation note.** Add "Escalation required" to the Carried From column and include a sentence in the Notes section explaining that resolution attempts have stalled and what higher-level intervention is needed. Do not silently carry a stale blocker as if it is making progress.

6. **Every decision in the Decisions Needed section must have a recommendation.** Project status reports are not forums for presenting options and asking stakeholders to figure it out. The person closest to the work is expected to have a view. If the project owner genuinely cannot recommend, explain why (values-based tradeoff, missing information, stakeholder preference) in the options column rather than omitting a recommendation entirely.

7. **Do not mix completed and in-progress items in the Accomplishments section.** A task that is 90% done belongs in Upcoming Work with a revised target date, not in Accomplishments as "nearly finished." This rule enforces accurate percent-complete figures and prevents the common pattern of projects appearing to be always 90% done.

8. **The executive summary must be written for someone who will not read the rest of the report.** After drafting, read only the executive summary and ask: would a busy executive understand the overall status, the key win, and what they need to do? If any of those three elements are missing, revise.

9. **Dates must be specific calendar dates, never relative references.** "Next Friday," "next week," and "soon" become meaningless within days of issuance. Reports are archived and read later. Every date in every table must be a calendar date in a consistent format (e.g., June 23 or 2024-06-23).

10. **The Report History table must be populated beginning on Report #2.** Trends matter. A project that was GREEN two weeks ago and is now RED requires a different response than a project that has been RED for three consecutive periods. Stakeholders cannot detect trends from a single data point. If prior report data is not available, note "Prior report data unavailable -- history will populate from Report #[N] onward."

11. **Scope RAG must reflect formal change control, not informal drift.** If the team has quietly added features, functionality, or tasks that were not in the original scope -- even if the client "seemed to want them" -- the scope dimension is not GREEN. Scope creep without a change request is a RED or AMBER condition regardless of whether it feels manageable. Flag it so stakeholders can decide whether to formalize it.

12. **The report must be completed and issued on the committed cadence.** A status report delivered late is itself a yellow flag. If a report cannot be issued on time, send a one-sentence delay notice to stakeholders with a revised delivery time. Never let a status report go more than 48 hours past its scheduled issuance date without explanation.

---

## Edge Cases

### The user has never written a status report before and doesn't know what to include

Do not present the full template and ask them to fill it in -- this is overwhelming and produces low-quality responses. Instead, ask five focused questions in sequence:

1. "What is your project trying to accomplish, and when is it supposed to be done?"
2. "What did you get done since you last checked in on it?"
3. "What's supposed to happen next, and is anything blocking it?"
4. "Do you need anyone to make a decision or take an action before you can proceed?"
5. "On a scale of green (on track), yellow (concerned), or red (in trouble), how would you rate it?"

From those five answers, draft the full report. After delivering it, explain what you inferred for each section so the user understands the structure. Offer to iterate on any section they find surprising.

### The project is severely off track and the user is reluctant to report RED status

This is common. Project owners fear that a RED report will be read as personal failure. The correct approach: acknowledge the discomfort directly, then explain that a RED report that includes a concrete recovery plan is far better received than a softened AMBER report followed by a surprise miss. Help the user construct a "Recovery Plan" subsection within Notes that includes: (1) the specific cause of the deviation, (2) what has already been done to address it, (3) the revised completion date or scope, and (4) what stakeholders need to approve or provide for recovery to succeed. A RED report with a recovery plan demonstrates competence; a missed deadline with no prior warning demonstrates the opposite.

### The user sends status reports to multiple audiences with different information needs

The base report should be written for the most detail-oriented stakeholder. Then produce a layered delivery:

- **Executive summary** (3 sentences): For sponsors or clients who need the headline and their required action only. Can be delivered as a standalone email.
- **Full report**: For the project manager, collaborator, or stakeholder who needs the complete picture.
- **Verbal talking points**: 3 bullets -- "What we did, what we're doing next, what we need from you" -- for verbal status meetings.

Never create multiple versions with different facts for different audiences. One set of facts, multiple depths of presentation. Inconsistent facts across audiences is one of the fastest ways to destroy stakeholder trust.

### The project has no formal milestones, budget, or defined scope -- just ongoing work

This applies to many creative, research, or informal projects. Adapt as follows:

- **Milestones:** Use output count instead. "6 of 20 sections drafted" or "3 of 8 interviews completed" works as well as milestone tracking.
- **Budget:** Omit the budget row from the status table and note "Budget not formally tracked" in the header.
- **Scope:** Replace scope RAG with "Focus" RAG -- is the work staying on the original intent, or is it drifting? Scope RAG for informal projects: GREEN = on original intent; AMBER = some drift being evaluated; RED = unclear what the work is supposed to produce.
- **Schedule:** If there is no deadline, the schedule RAG defaults to GREEN but note the absence of a target date as a risk. Suggest the user establish a time-box even if the scope is open-ended ("I want to finish the first draft by August 1") to make future status reporting meaningful.

### A blocker or decision from a prior report was never resolved

This is an escalation pattern and must be treated as one. Do not simply carry the item forward as-is. In the Blockers table, populate the Carried From column with the report number where it first appeared. Add a sentence to the Notes section: "Blocker #1 has been open for [X] weeks without resolution. If not resolved by [date], recommend escalating to [sponsor/stakeholder name] for intervention." In the Decisions Needed table, include a "Consequence if Delayed" column entry that quantifies the schedule or budget impact of continued inaction. Make the cost of indecision visible.

### The reporting period was inactive -- nothing happened

This occurs during holidays, dependency waits, or holding periods. Issue the report anyway. An empty accomplishments section is not a reason to skip a report -- it is the most important data point in a stalled period. In the executive summary, state why nothing happened: "No deliverables completed this period due to [waiting on external vendor approval / team out for scheduled holiday / holding pending architecture decision]. Work resumes [date] pending [condition]." This documents the hold period for the record and prevents the appearance of an unexplained gap in the reporting history.

### The user is reporting to an external client who may panic at RED status

Red does not mean failure -- it means the project needs attention. Help the user write the executive summary in factual, professional language that does not catastrophize. Correct: "This project is currently rated RED due to a 9-day schedule delay on milestone M3 caused by a vendor delivery issue. A recovery plan is in place; see Blockers and Decisions Needed sections for the required action." Incorrect: "Unfortunately, we are experiencing some significant challenges that have put us in a difficult position." The first version informs. The second version alarms. Use precise language, state the cause, state the action, state the recovery. Then let the facts speak.

---

## Example

**Input from user:** "I'm working on writing a book. It's a 12-chapter business book. I'm in week 6 of a 20-week writing plan. I've finished 4 chapters. Chapter 5 is supposed to be done by Friday but I haven't started the research yet -- it's probably going to be 10 days late. My editor wants to check in and I need to give her a status update. I've spent about $1,800 of my $6,000 budget (mostly on research tools and a freelance researcher). I haven't missed any chapters yet but I know Chapter 5 is going to slip. No decisions needed yet."

---

**Output:**

## Project Status Report -- Business Book: First Draft
**Report #3 of 10 | Reporting Period: May 26 -- June 1, 2025**

---

### Executive Summary

The book project is currently **AMBER**. Four of 12 chapters are complete (33%), placing the project slightly ahead of word-count pace but with a confirmed schedule delay emerging on Chapter 5, which is now projected to be 10 days late due to research not yet started. Budget is tracking well at 30% spend at 30% of timeline. **The editor should be aware that the Chapter 5 delivery date will move from June 6 to approximately June 16** -- no decision is required at this time, but a revised milestone schedule is provided below.

---

### Report Header

| Field | Value |
|-------|-------|
| Project | Business Book -- First Draft (12 Chapters) |
| Report Number | #3 |
| Report Date | June 1, 2025 |
| Reporting Period | May 26 -- June 1, 2025 |
| Report Author | [Author] |
| Primary Audience | Editor |
| Next Report Due | June 8, 2025 |

---

### Overall Status: 🟡 AMBER

| Dimension | Status | Detail |
|-----------|--------|--------|
| Schedule | AMBER | Chapter 5 research not started -- delivery will slip 10 days from June 6 to June 16 |
| Scope | GREEN | All 12 chapters remain in scope; no structural changes requested or planned |
| Budget | GREEN | $1,800 of $6,000 spent (30%) at Week 6 of 20 (30% of timeline) -- exactly on track |
| Quality | GREEN | All 4 completed chapters accepted without rework requests |

**Overall status is AMBER because:** Schedule dimension is AMBER -- Chapter 5 is at risk of a confirmed 10-day delay, which may compress later chapters if not managed.

---

### Progress Summary

- **Overall completion:** 4 of 12 chapters complete (33%)
- **Current active milestone:** Chapter 5 (Introduction to Strategy Frameworks) -- At risk, delay confirmed
- **Projected completion date:** September 7, 2025 (original: August 28 -- moved by approximately 10 days pending Chapter 5 recovery)
- **Key project metric:** 4 of 12 chapters drafted and accepted; estimated 38,000 of 96,000 words written (40% of word count)

---

### Accomplishments This Period

| # | Deliverable/Milestone | Completed | vs. Plan | Notes |
|---|-----------------------|-----------|----------|-------|
| 1 | Chapter 3 -- Leadership Principles: full draft | May 27 | On time | Strongest chapter to date per self-review; sent to editor |
| 2 | Chapter 4 -- Building High-Trust Teams: full draft | May 31 | 1 day early | Research was already complete from Chapter 3 overlap -- accelerated draft |
| 3 | Research dossier for Chapters 6--8 compiled by freelancer | May 30 | On time | 47-page research summary delivered; covers case studies for Parts 2 and 3 |

---

### Upcoming Work -- Next Period (June 2 -- June 8, 2025)

| # | Milestone/Deliverable | Target Date | Owner | Dependencies | Risk |
|---|-----------------------|-------------|-------|-------------|------|
| 1 | Chapter 5 research -- complete primary source review | June 5 | Author | None -- starting now | High |
| 2 | Chapter 5 -- first draft | June 16 | Author | Chapter 5 research (above) | High |
| 3 | Begin Chapter 6 research | June 7 | Author | Chapters 6--8 dossier (complete) | Low |
| 4 | Editor check-in call | June 8 | Author + Editor | This status report | Low |

---

### Blockers

No blockers this period. All planned work for Chapters 6--12 is unimpeded. The Chapter 5 delay is a self-caused schedule issue (research not prioritized), not an external block -- recovery is entirely within the author's control.

---

### Decisions Needed

No decisions required this period. The editor is informed of the Chapter 5 delay as a transparency update; no approval or decision is needed to proceed.

---

### Risks and Issues Log

| # | Risk/Issue | Category | Probability | Impact | Status | Mitigation/Action | Last Updated |
|---|-----------|----------|-------------|--------|--------|-------------------|-------------|
| 1 | Chapter 5 delay cascades into Chapters 6--7 | Schedule | Medium | Medium | Active | Begin Chapter 6 research in parallel this week; do not wait for Chapter 5 to finish | June 1, 2025 |
| 2 | Freelance researcher unavailable for Chapters 9--12 | External | Low | High | Monitoring | Confirm availability with researcher by June 15; identify backup if needed | June 1, 2025 |
| 3 | Scope of Chapter 8 may expand based on new research | Scope | Low | Low | Monitoring | Flag to editor before drafting if expansion seems warranted | June 1, 2025 |

---

### Notes and Context

The delay on Chapter 5 is a sequencing error -- research for this chapter was deprioritized while Chapter 4 came together faster than expected, and the buffer was not reinvested into Chapter 5 preparation. **Starting Chapter 6 research in parallel with the Chapter 5 draft is the primary mitigation and should prevent the delay from propagating.** Chapters 1--4 are in strong shape and the freelance researcher dossier for the back half of the book reduces the risk of similar gaps occurring again. The project remains on budget and the quality of completed chapters is consistent.

---

### Report History (Last 3 Periods)

| Report # | Period | Overall | Schedule | Budget | Key Issue |
|----------|--------|---------|----------|--------|-----------|
| #1 | May 12--18 | 🟢 GREEN | GREEN | GREEN | None -- strong start, Chapters 1--2 complete |
| #2 | May 19--25 | 🟢 GREEN | GREEN | GREEN | Chapter 3 started late but recovered within period |
| #3 (current) | May 26--Jun 1 | 🟡 AMBER | AMBER | GREEN | Chapter 5 research not started -- 10-day delay projected |
