---
name: workflow-automation-design
description: |
  Designs personal workflow automation plans by identifying repetitive tasks,
  mapping trigger-action-output structures, and prioritizing by time savings.
  Use when the user wants to automate personal repetitive work, streamline
  daily routines, or eliminate manual steps from recurring processes. Do NOT
  use for enterprise workflow automation, Zapier/Make integration configuration,
  or business process reengineering (use business operations skills instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation planning optimization"
  category: "productivity"
  subcategory: "automation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Workflow Automation Design

## When to Use

Use this skill when the user's need matches one of these specific scenarios:

- User describes spending 30+ minutes per week on tasks that follow the same pattern every time they do them -- processing emails, preparing recurring reports, updating trackers, running status meetings, filing documents
- User says phrases like "I do this every Monday," "I always have to remember to," "every time I get a new client I have to," or "I spend my whole morning just catching up on the same stuff"
- User wants to map out which of their recurring tasks are worth automating before deciding what tools (if any) to use
- User has tried automation tools but found the setup confusing -- they need the workflow logic clarified first, before any tool configuration happens
- User is overwhelmed by their workload and suspects a significant portion is low-value repetitive work that could be systematized
- User wants to delegate or hand off recurring work to a team member and needs to document the current process first
- User is returning from vacation or leave and wants to systematize the backlog of routine work they fell behind on
- User wants to build a personal operating system -- a set of documented personal workflows that covers how they handle their recurring professional responsibilities

**Do NOT use when:**
- User wants specific configuration help for Zapier, Make, n8n, or IFTTT -- those tools have their own integration logic and this skill produces tool-agnostic workflow specifications (use a tool-specific automation configuration skill instead)
- User is redesigning an entire business process involving multiple departments, approval chains, or compliance requirements -- that requires business process reengineering methodology, not personal workflow design
- User needs to automate software builds, CI/CD pipelines, or infrastructure provisioning -- use DevOps or platform engineering skills
- User wants to automate data pipelines, ETL processes, or analytical workflows -- use data engineering skills
- User is asking about robotic process automation (RPA) for enterprise desktop automation -- that is an IT/enterprise architecture decision outside personal productivity scope
- User wants help choosing between specific SaaS tools for their business -- use technology selection or vendor evaluation skills
- User's "repetitive task" is actually a complex decision that happens to recur -- if it requires fresh judgment every single time with no predictable logic, it is not automatable and the user needs prioritization help instead

---

## Process

### Step 1: Conduct a Structured Task Audit

Do not ask the user to brainstorm freely -- they will miss their most automatable tasks. Use a structured elicitation approach:

- Walk through a "week in the life" interview covering five time zones: morning setup (first 30-60 minutes of each workday), communication processing (email, Slack, messages), meeting-adjacent work (prep and follow-up), data and reporting work, and end-of-week administrative tasks
- For each task identified, capture six attributes: task name, trigger (what causes the user to do it), frequency per month, time per occurrence in minutes, whether it follows the same steps every time (rule-based) or varies significantly (judgment-heavy), and current frustration level on a 1-5 scale
- Use the "3 Rs" to identify hidden repetitive tasks: anything the user has to Remember to do (it's not triggered by an obvious external event), anything they have to Re-create from scratch each time (starting from a blank page), and anything they have to Reconcile between two sources (syncing information across tools or people)
- Probe specifically for: client onboarding sequences, weekly status communications, invoice and billing cycles, project kickoff checklists, content drafting and review cycles, expense management, file organization, and performance tracking updates
- Flag tasks that take under 5 minutes each occurrence but happen multiple times per day -- these have outsized cumulative impact and are frequently overlooked because no single instance feels significant
- Compute monthly time cost for each task using the formula: (occurrences per month) x (minutes per occurrence) / 60 = monthly hours. Use 4.33 weeks per month for weekly tasks (52 ÷ 12)

### Step 2: Score and Prioritize Automation Candidates

Apply a three-factor scoring model to rank tasks objectively:

- **Monthly time cost (MTC):** Raw hours per month from Step 1. Weight: 40% of priority score. Tasks under 0.5 hours/month almost never justify significant automation setup effort.
- **Automation feasibility score (AFS):** Rate 1-5 using this rubric -- 5: fully rule-based, same steps every time, no judgment; 4: mostly predictable with 1-2 decision points; 3: follows a template but requires variable data collection; 2: significant judgment involved in some steps; 1: almost entirely judgment-based with unpredictable structure. Tasks scoring 1-2 should almost never be prioritized for full automation -- focus on their sub-components instead.
- **Pain multiplier (PM):** 1-5 scale where 1 = mildly annoying but harmless, 3 = noticeably disrupts focus or causes errors, 5 = actively blocking other work or causing anxiety about forgetting it
- **Priority score formula:** (MTC x AFS x PM) / 10. This normalizes across wildly different task profiles and consistently surfaces the right candidates.
- Apply a minimum threshold: only tasks with a priority score above 1.0 should be selected for full automation design. Tasks below the threshold should be noted as "monitor" items.
- Select the top 3-5 tasks for the automation plan. Going beyond 5 in a single session overwhelms implementation capacity -- the user will set up none of them.
- Flag tasks with high MTC but low AFS (score 1-2) separately as "simplification candidates" -- these need process simplification or delegation, not automation

### Step 3: Map Each Selected Task to Trigger-Action-Output Architecture

Every automatable workflow has the same fundamental anatomy. Map it precisely:

- **Trigger:** The specific event or condition that should cause the task to begin. Triggers are either time-based (every Monday at 9 AM, last business day of month), event-based (new email arrives, client submits form, file lands in folder), or state-based (project moves to "in review," invoice becomes overdue, task is marked complete). If the user cannot define a clear trigger, the task is not automatable -- it is ad hoc work.
- **Preconditions:** What must be true or available before the task can start? (e.g., "last week's meeting notes are filed," "expense receipts are collected," "project status has been updated by team"). Missing preconditions are the most common reason automations fail in practice.
- **Atomic actions:** Decompose the task into steps where each step does exactly one thing. A step like "prepare the report" is not atomic. "Open last week's tracker, copy the three metric columns, paste into this week's template" is three atomic steps. If a step takes more than 2 minutes and contains sub-decisions, decompose further.
- **Decision points:** Every branch in the workflow must be named, and every branch must have an action. Use the format: IF [specific, observable condition] THEN [specific action sequence] ELSE [fallback action]. Never leave an unhandled branch -- this is where manual work creeps back in.
- **Output artifact:** The task should produce exactly one tangible output -- a sent message, a filed document, an updated record, a completed checklist. If a task produces multiple outputs, it is actually multiple tasks and should be split.
- **Verification criterion:** A single, testable question whose answer is yes or no. "The weekly report was sent to the team by Monday noon" is a good verification criterion. "The work feels done" is not.

### Step 4: Design the Automation Specification

Assign each task to one of four automation types and produce the corresponding specification:

- **Type 1 -- Template Automation:** Use when the task produces the same kind of document or message every time, with variable data filled in. The specification is the actual template with `{{variable_name}}` placeholders, plus an ordered fill-in checklist that tells the user exactly where to find each piece of variable data. The template must be complete enough to use immediately -- not an outline of what the template should contain.
- **Type 2 -- Sequence Automation:** Use when the task follows a fixed series of steps in a fixed order with no significant branching. The specification is a numbered checklist with time estimates per step and explicit tool/location references ("open the Q3 budget spreadsheet in the Finance shared drive, column D"). Sequence automations reduce cognitive load -- the user does not have to remember what comes next or whether they forgot a step.
- **Type 3 -- Conditional Automation:** Use when the task varies based on classifiable inputs. The specification is a complete decision tree with mutually exclusive, exhaustive branches. Every branch must be a condition that the user can evaluate by looking at observable data (not by guessing intent). Include an ELSE clause that covers all unclassified situations.
- **Type 4 -- Batching Automation:** Use when the task is currently done reactively (triggered by individual events) but could be more efficiently done in a scheduled batch. Email processing, Slack responses, and expense collection are classic candidates. The specification defines the batch window (time, frequency), the processing order within the batch, and the rules for what gets handled immediately versus deferred to the next batch.
- Note: many real workflows combine types. A weekly report might use a Template for the output document and a Sequence for the data-gathering steps that precede it. Label the type of each component, not just the overall task.

### Step 5: Identify Supporting Infrastructure

Most personal automation plans fail not because the logic is wrong but because the user lacks simple supporting structures:

- **Reference documents:** Does this automation require a list, directory, or lookup table to function? (e.g., a VIP contacts list for inbox triage, a project code list for expense categorization, a standard responses FAQ). Design these as the user's first setup task -- they are often more valuable than the automation itself.
- **Trigger mechanisms:** How will the user remember to run each automation? For time-based triggers, the answer is a calendar event or recurring reminder. For event-based triggers, the answer may be a folder monitoring system, an inbox label, or a physical inbox tray. If there is no reliable trigger mechanism, the automation will be forgotten.
- **Storage and filing conventions:** Template automations require that outputs be saved consistently. Define the exact naming convention (`YYYY-MM-DD_ClientName_AgendaType`) and the exact folder location before the automation goes live.
- **Tool requirements:** Identify the minimum viable toolset needed -- this skill does not prescribe specific products, but it should distinguish between automations that require zero tools (just a saved text template and a checklist), automations that require basic productivity tools already in use (calendar, email, note-taking app), and automations that would require acquiring a new tool. Never block implementation on an optional tool -- design the no-tool version first.
- **Handoff definitions:** For any task that involves sending something to another person, define exactly what gets sent, to whom, via which channel, and what the expected response or next action is. Do not assume the other person's behavior can be automated -- only design the user's side of the handoff.

### Step 6: Build the Implementation Roadmap

Sequence automations by effort-to-benefit ratio, not by priority score:

- **Tier 1 -- Quick wins (setup under 30 minutes):** These are almost always template automations and simple sequence checklists. The user sets them up this week, validates them for one or two cycles, and moves on. The psychological value of early wins is as important as the time savings.
- **Tier 2 -- Medium effort (setup 30 minutes to 2 hours):** These typically require building a reference document, designing a conditional decision tree, or reconfiguring an existing tool (creating inbox labels, setting up recurring calendar blocks). Schedule these for the following week.
- **Tier 3 -- Significant effort (setup 2-8 hours):** These may involve building a more complex template system, redesigning a filing structure, or creating a multi-step reference document. These are weekend or dedicated focus-session tasks.
- Never assign more than one Tier 3 automation to a single implementation plan -- the user will not complete it and will lose confidence in the entire plan.
- Assign specific setup dates, not relative ones ("Week 2" becomes "never"). If the user shares their calendar availability, anchor to real dates.
- Define a validation protocol for each automation: during the first two occurrences, the user times themselves using the new workflow and notes any steps that required improvisation or skipping. Improvised steps are design gaps that need to be added to the specification.

### Step 7: Define Measurement and Review Cadence

Automation plans that do not have explicit measurement criteria get abandoned or inflated:

- Set baselines using the exact numbers computed in Step 1 -- do not adjust or estimate these retroactively.
- Define the target time as a percentage reduction, not an absolute number. A 50% reduction is a reasonable target for Template and Sequence automations in the first month. A 30% reduction is reasonable for Conditional automations, which have more variability.
- The tracking method must be specific and low-effort -- if tracking the automation takes more than 90 seconds per occurrence, the user will stop tracking. The simplest method: note the start and end time in the checklist itself.
- Schedule a 2-week review for Tier 1 automations, a 3-week review for Tier 2, and a 4-week review for Tier 3. At each review, assess: Did the user actually use the automation every time? Did any steps require improvisation? Is the measured time savings close to the projected savings?
- Define the "retire or redesign" threshold: if an automation saves less than 25% of the baseline time after one month, redesign it or retire it. Maintaining a broken automation wastes more time than the original manual process.

---

## Output Format

```markdown
## Personal Workflow Automation Plan

**Prepared for:** [User name or role]
**Date:** [Date]
**Planning horizon:** [e.g., next 4 weeks]

---

### Task Audit Summary

| Task | Trigger Type | Freq/Mo | Min/Occ | Hrs/Mo | Pain (1-5) | Feasibility (1-5) | Priority Score |
|------|-------------|---------|---------|--------|------------|-------------------|----------------|
| [Task 1] | [time/event/state] | [#] | [#] | [#.#] | [#] | [#] | [#.#] |
| [Task 2] | [time/event/state] | [#] | [#] | [#.#] | [#] | [#] | [#.#] |
| [Task 3] | [time/event/state] | [#] | [#] | [#.#] | [#] | [#] | [#.#] |
| [Task 4] | [time/event/state] | [#] | [#] | [#.#] | [#] | [#] | [#.#] |
| [Task 5] | [time/event/state] | [#] | [#] | [#.#] | [#] | [#] | [#.#] |

**Total monthly time on audited tasks:** [X.X] hours
**Tasks selected for automation:** [Task 1, Task 2, Task 3] (priority score > 1.0)
**Tasks flagged for simplification (high time, low feasibility):** [Task X]
**Tasks below automation threshold:** [Task Y, Task Z]

---

### Automation [N]: [Task Name]

**Automation type:** [Template | Sequence | Conditional | Batching]
**Baseline:** [X] min/occurrence × [Y] occurrences/month = [Z] hours/month

**Trigger:** [Exact trigger condition -- e.g., "Every Monday at 8:30 AM" or "New message arrives in shared-inbox@company.com"]
**Preconditions:**
- [What must be ready before this automation can run]
- [Where the required inputs are located]

**Supporting infrastructure needed:**
- [Reference document, filing convention, or trigger mechanism required]

---

#### Automation Specification

[USE ONE OF THE FOUR FORMATS BELOW:]

**-- TEMPLATE FORMAT --**

```
[Full template with {{variable_name}} placeholders.
Every section filled in. No placeholder descriptions -- the actual template.]
```

**Variable fill-in checklist (complete in this order):**
- [ ] `{{variable_1}}` -- Source: [exactly where to find this data]
- [ ] `{{variable_2}}` -- Source: [exactly where to find this data]
- [ ] `{{variable_3}}` -- Source: [exactly where to find this data]

**Pre-send/pre-file checklist:**
- [ ] All `{{placeholder}}` text has been replaced with real data
- [ ] [Task-specific verification step]
- [ ] [Task-specific verification step]

---

**-- SEQUENCE FORMAT --**

**Checklist (complete in order, do not skip steps):**
- [ ] 1. [Atomic action] -- [tool/location] -- est. [X] min
- [ ] 2. [Atomic action] -- [tool/location] -- est. [X] min
- [ ] 3. [Atomic action] -- [tool/location] -- est. [X] min
- [ ] 4. [Atomic action] -- [tool/location] -- est. [X] min

**Total estimated time:** [X] min

---

**-- CONDITIONAL FORMAT --**

**Intake: Evaluate these conditions first (in order):**

Condition 1: [Specific, observable condition]
- IF TRUE → go to Branch A
- IF FALSE → evaluate Condition 2

Condition 2: [Specific, observable condition]
- IF TRUE → go to Branch B
- IF FALSE → go to Branch C (default)

**Branch A -- [Branch Name]:**
1. [Atomic action]
2. [Atomic action]
3. [Atomic action]
Expected time: [X] min

**Branch B -- [Branch Name]:**
1. [Atomic action]
2. [Atomic action]
Expected time: [X] min

**Branch C (Default) -- [Branch Name]:**
1. [Atomic action]
2. [Atomic action]
Expected time: [X] min

---

**-- BATCHING FORMAT --**

**Batch schedule:** [Frequency and exact time window, e.g., "Twice daily: 10 AM and 3 PM, 20-minute block each"]
**What qualifies for this batch:** [Criteria for inclusion]
**What gets handled immediately (not batched):** [Exception criteria]

**Processing sequence within each batch:**
- [ ] 1. [First category to process and its action]
- [ ] 2. [Second category to process and its action]
- [ ] 3. [Third category to process and its action]
- [ ] 4. Close batch -- note total items processed

---

**Output artifact:** [Exactly what this automation produces -- a sent email, a filed document, an updated row in a tracker]
**Verification criterion:** [Single yes/no question: e.g., "Was the agenda sent to all attendees before 8 AM on meeting day?"]
**Projected time after automation:** [X] min/occurrence
**Projected monthly saving:** [Y] hours/month

---

[Repeat Automation section for each selected task]

---

### Supporting Infrastructure Setup

| Item | Type | Setup Instructions | Estimated Setup Time |
|------|------|-------------------|---------------------|
| [e.g., VIP contacts list] | Reference doc | [Where to create it, what columns it needs] | [X] min |
| [e.g., Weekly review folder structure] | Filing convention | [Exact naming convention and folder path] | [X] min |
| [e.g., Monday 8:30 AM recurring block] | Calendar trigger | [Calendar app, recurrence settings, reminder lead time] | [5] min |

---

### Implementation Roadmap

| Tier | Automation | Setup Time | Tools Required | First Validation Date | Weekly Savings |
|------|-----------|------------|---------------|----------------------|----------------|
| 1 -- Quick win | [Automation name] | [≤30 min] | [None / already-owned tool] | [Specific date] | [X] min |
| 1 -- Quick win | [Automation name] | [≤30 min] | [None / already-owned tool] | [Specific date] | [X] min |
| 2 -- Medium effort | [Automation name] | [30-120 min] | [Tool name or none] | [Specific date] | [X] min |
| 3 -- Significant effort | [Automation name] | [2-8 hrs] | [Tool name or none] | [Specific date] | [X] min |

**Week 1 action (due [date]):** [Specific setup task for Tier 1 automations]
**Week 2 action (due [date]):** [Specific setup task for Tier 2 automations]
**Week 3-4 action (due [date]):** [Specific setup task for Tier 3 automation, if applicable]

---

### Measurement and Review Plan

| Automation | Baseline (hrs/mo) | Target (hrs/mo) | Target % Reduction | Tracking Method | Review Date | Retire If |
|-----------|------------------|----------------|-------------------|----------------|------------|-----------|
| [Auto 1] | [X.X] | [Y.Y] | [Z%] | [Specific method] | [Date] | <25% savings after 4 weeks |
| [Auto 2] | [X.X] | [Y.Y] | [Z%] | [Specific method] | [Date] | <25% savings after 4 weeks |
| [Auto 3] | [X.X] | [Y.Y] | [Z%] | [Specific method] | [Date] | <25% savings after 4 weeks |

**Total projected monthly savings:** [X.X] hours (from [A.A] to [B.B] hours/month)
**Estimated annualized savings:** [X.X × 12] hours/year (~[X.X] full workdays recovered)
```

---

## Rules

1. **Never accept "I spend a lot of time on X" as sufficient task definition.** The task is not defined until the user can state its trigger, its frequency, and its steps. Ask specifically: "What causes you to start this task? What do you do first, second, third? What does done look like?" Vague task descriptions produce vague automation specs that the user will not follow.

2. **Calculate every number from the user's actual stated inputs.** If the user says "every Monday" that is 4.33 occurrences per month, not 4. If the user says "about 20 minutes" use 20, not an optimistic 15. Accuracy in the baseline is what makes the eventual savings measurement meaningful. Never use round numbers unless the user explicitly provided round numbers.

3. **The automation feasibility score must be assigned honestly and explained.** A task that involves responding to unique client questions scores 2 or lower, even if the user thinks it should be automatable. Over-automation of judgment-heavy tasks leads to errors and wasted setup time. When a task scores 1-2, tell the user why and redirect to its automatable sub-components.

4. **Templates must be complete and immediately usable.** A template automation specification that says "create a template with the key meeting details" has failed. The specification must contain the actual template text with actual `{{variable_name}}` syntax for every variable field. The user should be able to copy the template into a document on first read and use it at the next occurrence.

5. **Conditional automations must have exhaustive branches.** Every decision tree must include a default ELSE branch that handles all inputs that do not match any named condition. The most common automation failure mode is an unhandled case that forces the user to improvise -- which breaks the habit of following the automation at all.

6. **Implementation roadmap must sequence by setup effort, not by priority score.** The highest-priority automation (most time savings) is not necessarily the right first step. A 5-minute template setup that saves 30 minutes/week builds more habit confidence than a 3-hour conditional system that saves 2 hours/week but is still incomplete after two weeks.

7. **Every automation must name its verification criterion before being considered complete.** A verification criterion is a binary yes/no question answerable by inspection within 30 seconds. "Did the meeting agenda reach all attendees before 9 AM?" is a verification criterion. "Does it feel like the automation is working?" is not. Without a verification criterion, the user cannot distinguish between an automation that is working and one that is silently failing.

8. **Supporting infrastructure items must be designed before the automation that depends on them.** If a conditional automation requires a VIP contacts list, that list must be designed, populated, and stored in a known location before the automation is deployed. Automations that reference unbuilt infrastructure will be abandoned on first use.

9. **Never recommend more than five automations in a single plan, regardless of how many candidate tasks are identified.** Cognitive load during implementation is the primary failure mode for personal automation plans. A focused plan of three automations that all get implemented and used beats a comprehensive plan of eight that overwhelms the user in Week 1. Remaining candidates should be documented in a "future automation backlog" section, not in the active plan.

10. **The measurement plan must specify what "retire or redesign" looks like.** An automation that saves less than 25% of its baseline time after four weeks of consistent use has failed to meet its design goal and should be retired or redesigned. The user should know this threshold upfront so they do not keep maintaining a broken system out of sunk-cost reasoning. Explicitly state the retire threshold in the measurement table.

11. **Tasks involving other people must be designed with explicit handoff points.** The automation covers only the user's actions. It must specify exactly what the user sends or delivers to another person, by which channel, by what time, and what the expected response is. The automation must also specify what happens if the expected response does not arrive within the defined window. Never attempt to automate another person's behavior.

12. **Batching automations must define both what qualifies for the batch and what must be handled immediately.** A batching design without exception criteria will fail the first time an urgent item arrives during a batch window and the user does not know whether to break the batch. The exception criteria must be specific and observable (e.g., "sender is on the executive team," "subject line contains URGENT in caps"), not a judgment call.

---

## Edge Cases

### User Cannot Identify Repetitive Tasks

Some users -- especially those in roles with high task variety -- genuinely struggle to identify automatable work because each instance feels slightly different from the last. Use the "3 Rs" elicitation technique: ask about tasks they have to **Remember** without an external prompt (these have no trigger and are automation candidates because building a trigger is the automation); tasks they **Re-create** from scratch each time even though the output is structurally similar (these are template automation candidates); and tasks they **Reconcile** between two sources of truth (these are sequence or batching automation candidates). Follow up with specific probes: "Walk me through the last 10 minutes of your workday. What are you checking, updating, or closing out?" Most users who claim they have no repetitive tasks identify 4-6 strong candidates in the first 10 minutes of this structured interview.

### All High-Priority Tasks Require Significant Judgment (Feasibility Score 1-2)

This occurs frequently with knowledge workers, consultants, and creative professionals. Do not discard these tasks -- instead, decompose them into their automatable sub-components. Almost every judgment-heavy task contains predictable scaffolding: a setup phase (gathering inputs from consistent sources), a production phase (the actual judgment work, which is not automatable), and a wrap-up phase (filing, communicating, and tracking the output). Design automations for the setup and wrap-up phases only, and leave the production phase as a clearly defined manual step in the sequence. A 45-minute judgment-heavy task whose 15-minute setup and 10-minute wrap-up are automated effectively becomes a 20-minute task -- a 55% time reduction without any attempt to automate the judgment itself.

### User Has Very Few Recurring Tasks (Freelancer, Independent Contributor)

Freelancers and independent contributors often have highly variable day-to-day work but exhibit strong repetition at the project level -- the same sequence of activities for every new project, every new client, and every completed deliverable. Shift the audit focus from weekly recurring tasks to per-project recurring tasks: new client onboarding sequence, project setup checklist, mid-project check-in protocol, final delivery and handoff process, invoice generation, and portfolio documentation. These tasks may occur only monthly or even quarterly, but each instance may take 2-4 hours, making them extremely high-value automation candidates. A freelancer who completes 15 projects per year and spends 3 hours setting up each one saves 45 hours annually by automating project setup -- equivalent to more than a full workweek.

### User Wants to Automate Communication Drafting

Communication drafting -- emails, Slack messages, status updates, client reports -- is among the most requested automation types and the one most commonly over-automated. The correct approach is Template automation for communications where the structure and purpose are fixed (weekly status update, project kickoff intro, invoice follow-up). For any communication where the content varies significantly based on context (responding to a unique client concern, escalating a sensitive issue), the automation should cover only the trigger identification and the opening and closing structure, with the substantive middle section left as a defined manual input. Design these as "fill-in-the-body" templates rather than full templates -- a fixed opening, a `{{body}}` placeholder with a prompt describing what goes there, and a fixed closing. This captures 60-70% of the drafting time savings without producing generic-sounding communications.

### Tasks Involve Multiple Tools With No Integration Between Them

Many personal workflows involve moving data between tools that do not talk to each other -- copying numbers from a spreadsheet into a report, pulling data from a project tracker into a status email, transferring information from a calendar into a weekly plan. When the user's tools are unconnected, do not immediately recommend an integration tool. Instead, design a "data collection" step at the start of the sequence automation that specifies exactly where to find each piece of data and in what format to capture it (usually a temporary scratch document or working copy of the template). This single structural change -- separating data collection from document production -- typically reduces the time on cross-tool workflows by 40-50% even without any technical integration, because the user stops switching back and forth between sources during the production phase.

### User Already Has Partial Automations That Are Inconsistently Used

Users often have fragments of automation -- a template they sometimes use, a checklist that is out of date, a recurring calendar block they frequently skip. When auditing their tasks, these partial automations will appear as tasks with high variability in time per occurrence (sometimes 10 minutes, sometimes 45 minutes) because they only use the automation some of the time. Treat these as redesign candidates, not new designs. First, diagnose why the existing partial automation is being skipped: Is the trigger unreliable? Is the template incomplete (requires too much improvisation to use)? Is the sequence outdated and no longer matches the actual task? Then redesign the specific failing component rather than starting from scratch. Redesigning an existing partial automation is almost always faster than building a new one and produces immediate improvement.

### User's Recurring Tasks Are Done Differently Each Week Due to Varying Context

Some tasks have a consistent structure at the abstract level but vary so much in their concrete inputs that the user resists templating them. The solution is to separate the structural template (the permanent scaffolding) from the context-specific content (the variable inputs that change each occurrence). Design the template with explicit variable fields that acknowledge the variation rather than trying to eliminate it. For example, a weekly planning session does not need to produce the same plan each week -- it needs to follow the same decision process each week. The automation specification for this type of task focuses on the decision sequence ("first review incomplete items from last week, then consult the project priority list, then review the calendar") rather than a static output template. This turns an apparently unautomatable task into a reliable Sequence automation.

---

## Example

**Input:** "I'm a project manager at a 20-person startup. I waste so much time on repetitive admin. Every Monday I write a team status update for the CEO, which takes forever because I have to gather info from everyone. I process our project inbox twice a day -- clients and stakeholders send requests and questions constantly. Every other week I run a project retrospective and spend ages preparing the agenda. I also update our project roadmap spreadsheet every Friday before end of day, and I send new clients an onboarding email each time we kick off a project (happens maybe 3 times a month). I want to be more systematic about this stuff."

**Output:**

---

## Personal Workflow Automation Plan

**Prepared for:** Project Manager
**Date:** [Current date]
**Planning horizon:** Next 4 weeks

---

### Task Audit Summary

| Task | Trigger Type | Freq/Mo | Min/Occ | Hrs/Mo | Pain (1-5) | Feasibility (1-5) | Priority Score |
|------|-------------|---------|---------|--------|------------|-------------------|----------------|
| CEO status update | Time (Monday) | 4.3 | 60 | 4.3 | 5 | 3 | 6.5 |
| Project inbox processing | Time (2x daily) | 43 | 15 | 10.8 | 4 | 4 | 17.2 |
| Retrospective agenda prep | Time (biweekly) | 2 | 75 | 2.5 | 3 | 5 | 3.8 |
| Friday roadmap update | Time (Friday) | 4.3 | 35 | 2.5 | 3 | 4 | 3.0 |
| New client onboarding email | Event (project kickoff) | 3 | 40 | 2.0 | 4 | 5 | 4.0 |

**Total monthly time on audited tasks:** 22.1 hours
**Tasks selected for automation:** Project inbox processing (17.2), CEO status update (6.5), New client onboarding email (4.0), Retrospective agenda prep (3.8)
**Tasks below automation threshold:** Friday roadmap update -- retained as a Sequence automation to support CEO status update data gathering
**Note on CEO status update feasibility score:** Rated 3 rather than 5 because the current bottleneck is information gathering from the team, not document production. Redesign focuses on the data collection sub-process, not the writing step.

---

### Automation 1: Project Inbox Processing

**Automation type:** Batching + Conditional
**Baseline:** 15 min/occurrence × 43 occurrences/month = 10.8 hours/month

**Trigger:** Twice daily calendar block -- 10:00-10:20 AM and 3:00-3:20 PM
**Preconditions:**
- Project inbox is accessible (shared inbox at projects@[company].com)
- FAQ reference document is open in a browser tab before starting the batch
- Project tracker is open to the current sprint view

**Supporting infrastructure needed:**
- VIP senders list (CEO, all clients, Board members) -- stored in a pinned note in email client
- Standard responses FAQ document (see infrastructure table below)
- Processing rules are printed and taped to monitor for first two weeks

---

#### Automation Specification

**Batch schedule:** Twice daily, 10:00-10:20 AM and 3:00-3:20 PM (20-minute block each). Total daily window: 40 minutes, replacing current reactive processing estimated at 90+ minutes/day.

**What qualifies for this batch:** All messages in the project inbox.

**What gets handled immediately (not batched):** Message from a sender on the VIP list AND subject line contains "urgent," "blocked," "escalation," or "today" -- forward to personal inbox immediately upon arrival, do not wait for batch window.

**Processing sequence within each batch (work top-to-bottom through inbox, do not skip):**

- [ ] 1. **Scan for VIP senders first (30 seconds):** If VIP sender present without "urgent" keywords, move to the top of the processing queue.
- [ ] 2. **Classify each message using the decision tree below before taking any action.**
- [ ] 3. Process all messages in classified order: Client questions first, then internal requests, then FYIs.
- [ ] 4. At batch close: note total messages processed and any items that required improvisation (these are gaps to add to the FAQ).

**Classification decision tree:**

Condition 1: Is the sender on the VIP list?
- IF YES → Branch A (VIP handling)
- IF NO → evaluate Condition 2

Condition 2: Does the subject or first line indicate a question or request for information?
- IF YES → evaluate Condition 3
- IF NO → evaluate Condition 4

Condition 3: Does the FAQ document contain a matching standard answer?
- IF YES → Branch B (FAQ reply)
- IF NO → Branch C (research queue)

Condition 4: Is this a status update, FYI, or notification requiring no response?
- IF YES → Branch D (file and record)
- IF NO → Branch E (default -- review and categorize)

**Branch A -- VIP Handling:**
1. Open immediately, read fully
2. If actionable: draft reply within this batch window; if reply requires more than 5 minutes to draft, add to personal task list with 4-hour deadline and send an acknowledgment ("Received, will respond by [time] today")
3. Flag message with "VIP-responded" label
4. Expected time: 3-8 min per message

**Branch B -- FAQ Reply:**
1. Locate matching response in FAQ document
2. Copy response, paste into reply window
3. Personalize opening line with sender's name and specific reference to their question (1 sentence only)
4. Send
5. File under project name label
6. Expected time: 2-3 min per message

**Branch C -- Research Queue:**
1. Mark with "needs-research" label
2. Add to personal task list with 24-hour deadline: "Reply to [sender] re: [topic]"
3. Send acknowledgment: "Thanks for reaching out -- I'm looking into this and will reply by [next business day] EOD."
4. Expected time: 1-2 min per message (reply handled outside batch)

**Branch D -- File and Record:**
1. Extract any project status data mentioned (milestone completions, blockers, decisions made)
2. If data is relevant to Friday roadmap update: copy data point to the "Weekly Inputs" section of the roadmap staging doc
3. Apply project label, mark as read
4. Expected time: 1-2 min per message

**Branch E (Default) -- Review and Categorize:**
1. Read fully
2. Determine whether it is a task, a question, an FYI, or an introduction
3. Assign to the nearest matching branch above and process accordingly
4. If genuinely unclassifiable: reply with "Thanks -- I want to make sure I address this correctly. Could you confirm whether you need [option 1] or [option 2]?"
5. Expected time: 3-5 min per message

**Output artifact:** Zero unprocessed messages in project inbox at end of each batch window; all actionable items added to personal task list with deadlines
**Verification criterion:** Can the inbox be marked "all processed" at the end of the 20-minute window?
**Projected time after automation:** 40 min/day in structured windows vs. current ~90 min/day reactive processing
**Projected monthly saving:** 4.3 hours/month (from 10.8 to 6.5 hours, accounting for research queue items)

---

### Automation 2: New Client Onboarding Email

**Automation type:** Template
**Baseline:** 40 min/occurrence × 3 occurrences/month = 2.0 hours/month

**Trigger:** Project kickoff meeting is scheduled in calendar (create this email the same day the kickoff is added to calendar)
**Preconditions:**
- Client name, company name, and primary contact confirmed
- Project name and internal project code assigned
- Kickoff meeting date and time confirmed on calendar
- Project lead and key team members identified

**Supporting infrastructure needed:**
- Template stored as a draft in email client labeled "TEMPLATE -- Client Onboarding" (do not send this draft -- duplicate it each time)
- Standard project resources link list maintained in a shared note (link to onboarding portal, project charter template, communication guidelines)

---

#### Automation Specification

**Template:**

```
Subject: Welcome to [COMPANY] -- Getting Started with {{project_name}}

Hi {{client_first_name}},

We're excited to kick off {{project_name}} with {{client_company}}. This email gives you
everything you need to get started and sets expectations for how we'll work together.

**Your project team:**
- Project lead: {{project_lead_name}} ({{project_lead_email}})
- Primary contact for day-to-day questions: {{primary_contact_name}} ({{primary_contact_email}})

**Your project details:**
- Project name: {{project_name}}
- Internal reference code: {{project_code}}
- Kickoff date: {{kickoff_date}} at {{kickoff_time}}
- Kickoff meeting link: {{calendar_link}}

**What to expect in the first two weeks:**
{{first_two_weeks_summary}}
(Keep this to 3-5 bullet points describing the major milestones or deliverables
in the first two weeks. Pull from the project charter.)

**How to reach us:**
- For urgent issues: {{urgent_contact_method}} (response within {{urgent_response_sla}})
- For general questions: reply to this email or message {{primary_contact_name}} on {{comms_channel}}
- Response time for non-urgent items: {{standard_response_sla}}

**Resources:**
- Project tracker (view-only): {{tracker_link}}
- Onboarding guide: {{onboarding_guide_link}}
- Communication guidelines: {{comms_guidelines_link}}

We look forward to a great project together.

{{project_lead_name}}
{{project_lead_title}}
{{company_name}}
```

**Variable fill-in checklist (complete in this order before drafting):**

- [ ] `{{project_name}}` -- Source: Project tracker, "Project Name" column
- [ ] `{{client_first_name}}` and `{{client_company}}` -- Source: CRM or kickoff meeting invite
- [ ] `{{project_code}}` -- Source: Internal project tracker
- [ ] `{{kickoff_date}}` and `{{kickoff_time}}` -- Source: Calendar event
- [ ] `{{calendar_link}}` -- Source: Calendar event -- copy the video conference link
- [ ] `{{project_lead_name}}` and `{{primary_contact_name}}` -- Source: Project assignment doc
- [ ] `{{first_two_weeks_summary}}` -- Source: Project charter, Section 2 (Milestones). Write 3-5 bullets in plain language.
- [ ] `{{urgent_contact_method}}` and `{{urgent_response_sla}}` -- Source: Standard SLA document (stored in shared resources note)
- [ ] `{{tracker_link}}` -- Source: Project tracker -- generate or copy view-only share link
- [ ] `{{comms_channel}}` and `{{standard_response_sla}}` -- Source: Standard SLA document

**Pre-send checklist:**
- [ ] All `{{placeholder}}` text replaced -- search for "{{" in the draft to catch any missed fields
- [ ] CC: project lead (if not sender), BCC: internal project archive address
- [ ] Subject line updated with actual project name
- [ ] Links tested (click each link to confirm it opens correctly)
- [ ] Send time: no earlier than 48 hours before kickoff, no later than 24 hours before kickoff

**Output artifact:** Sent onboarding email in client's inbox; copy auto-filed to project folder
**Verification criterion:** Was the onboarding email sent between 24-48 hours before the kickoff meeting with all placeholders replaced?
**Projected time after automation:** 10 min/occurrence
**Projected monthly saving:** 1.5 hours/month (from 2.0 to 0.5 hours)

---

### Automation 3: CEO Monday Status Update

**Automation type:** Sequence (data collection) + Template (document production)
**Baseline:** 60 min/occurrence × 4.3 occurrences/month = 4.3 hours/month

**Root cause of high time:** 45 of the 60 minutes are spent gathering information from team members and the project tracker, not writing. The automation targets the data collection sub-process.

**Trigger:** Friday roadmap update completion (Automation 4) triggers status update prep. By the time the PM arrives Monday morning, data is already compiled.

**Preconditions:**
- Friday roadmap update (Automation 4) completed Friday by 4:00 PM
- Team members have updated their individual status fields in the project tracker by end of day Friday (requires a Friday 3:00 PM calendar reminder sent to team -- add to implementation checklist)
- Status update template is pre-populated with Friday's data collection output

---

#### Automation Specification -- Phase 1: Friday Data Collection (10 min, done as part of Friday roadmap update)

- [ ] 1. Open project tracker to "Weekly Status" view -- 1 min
- [ ] 2. Copy all items moved to "Completed" this week into the status doc staging area under "Wins" -- 2 min
- [ ] 3. Copy all items still "In Progress" with a due date in the next 7 days under "In Flight" -- 2 min
- [ ] 4. Copy all items with a "Blocked" status and their blocker notes under "Blockers" -- 1 min
- [ ] 5. Note any decisions needed from CEO or leadership under "Decisions/Escalations" (pull from project inbox Branch C items from the week) -- 2 min
- [ ] 6. Save staging doc -- this is the Monday status update brief -- 30 sec

**Total Phase 1 time:** 8-10 min (done Friday, not Monday)

---

#### Automation Specification -- Phase 2: Monday Status Update Drafting (15 min, replacing 60 min)

**Template:**

```
Subject: Weekly Project Status -- Week of {{week_start_date}}

Hi {{ceo_first_name}},

Here's the weekly project status across {{active_project_count}} active projects.

**WINS THIS WEEK**
{{wins_list}}
(3-5 bullet points. Pull directly from Friday staging doc.)

**IN FLIGHT (next 7 days)**
{{in_flight_list}}
(Each line: [Project Name] -- [Milestone] -- [Due Date] -- [Owner])

**BLOCKERS AND RISKS**
{{blockers_list}}
(Each line: [Project] -- [Blocker] -- [Impact if unresolved] -- [Help needed from you: yes/no])
If none: "No active blockers this week."

**DECISIONS NEEDED FROM YOU**
{{decisions_needed}}
(Each decision: [Topic] -- [Options] -- [Deadline for decision])
If none: "No decisions needed this week."

**METRICS**
- Projects on track: {{on_track_count}} / {{active_project_count}}
- Milestones completed this week: {{milestones_completed}}
- Items blocked > 3 days: {{long_blocked_count}}

{{project_lead_name}}
```

**Variable fill-in checklist (Monday, using Friday staging doc):**

- [ ] `{{week_start_date}}` -- Today's date (Monday)
- [ ] `{{active_project_count}}` -- Count of active projects in tracker
- [ ] `{{wins_list}}` -- Copy from Friday staging doc "Wins" section
- [ ] `{{in_flight_list}}` -- Copy from Friday staging doc "In Flight" section
- [ ] `{{blockers_list}}` -- Copy from Friday staging doc "Blockers" section
- [ ] `{{decisions_needed}}` -- Copy from Friday staging doc "Decisions/Escalations" section
- [ ] `{{on_track_count}}` -- Count projects with no blockers and milestones on schedule
- [ ] `{{milestones_completed}}` -- Count from "Wins" list
- [ ] `{{long_blocked_count}}` -- Count blockers with >3-day age from tracker

**Pre-send checklist:**
- [ ] All placeholders replaced
- [ ] Blocker items: confirm whether each has been resolved since Friday (quick 60-second tracker check)
- [ ] "Decisions needed" section: confirm each decision is still open
- [ ] Send by 9:00 AM Monday

**Output artifact:** Status email in CEO inbox by 9:00 AM Monday
**Verification criterion:** Was the status email sent before 9:00 AM Monday with no unresolved placeholders?
**Projected time after automation:** 15 min/occurrence (down from 60 min)
**Projected monthly saving:** 3.0 hours/month (from 4.3 to 1.3 hours)

---

### Automation 4: Retrospective Agenda Preparation

**Automation type:** Template
**Baseline:** 75 min/occurrence × 2 occurrences/month = 2.5 hours/month

**Trigger:** Calendar reminder fires 48 hours before each retrospective (set as recurring biweekly event)
**Preconditions:**
- Previous retrospective action items are documented in the retrospective log
- Sprint/project tracker shows the period's completed and incomplete work
- Team members have been notified to submit retrospective input (can be a calendar note added when the meeting is scheduled)

**Supporting infrastructure needed:**
- Retrospective log document -- a running record of all previous retrospective action items with status (Open / Closed / Carried over). Created once, updated after each retro.

---

#### Automation Specification

**Template:**

```
## Retrospective Agenda
**Project:** {{project_name}}
**Sprint / Period:** {{sprint_name}} ({{period_start}} to {{period_end}})
**Date:** {{retro_date}} | **Time:** {{retro_time}} | **Duration:** 
