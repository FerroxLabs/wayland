---
name: task-delegation-system
description: |
  Builds a delegation protocol with decision criteria for what to delegate, a handoff template, follow-up schedule, and quality check process. Produces a complete delegation system document the user can use immediately.
  Use when the user asks about delegating tasks, deciding what to hand off, creating handoff procedures, or building a follow-up system for delegated work.
  Do NOT use for team project management (use business project-management skills), hiring or staffing decisions (use business HR skills), or personal task prioritization (use task-prioritization).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning template checklist"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Task Delegation System

## When to Use

**Use this skill when:**
- The user describes being overloaded and asks which tasks they should hand off to others -- including employees, contractors, virtual assistants, family members, or automated services
- The user has tried delegating before but the results were poor -- late deliveries, wrong output, or delegates who kept asking for help -- and they want a structured system to fix the process
- The user wants to write a delegation brief, handoff document, or standard operating procedure (SOP) for work they are passing to someone else
- The user asks how to track tasks they have assigned to others so nothing falls through the cracks
- The user wants to move from informal ("I just ask people to do stuff") to systematic delegation with accountability and quality control
- The user is preparing to hire a part-time assistant, contractor, or intern and needs to identify what to give them and how to structure the relationship
- The user asks how often to check in on delegated work without micromanaging

**Do NOT use when:**
- The user is coordinating work across a team with shared ownership and dependencies -- use business project-management skills, which cover sprint planning, task boards, and cross-functional workflows
- The user is deciding whether to hire someone -- use business HR skills, which cover job design, compensation, and interviewing
- The user wants to sort their own task list by importance and urgency without any delegation intent -- use `task-prioritization`, which applies Eisenhower matrix and effort-impact scoring
- The user wants a full GTD capture-and-review system including a Waiting For list built into a weekly review cycle -- use `gtd-workflow`, which wraps delegation tracking inside a complete personal productivity system
- The user wants to redesign team workflows, build standard operating procedures at an organizational level, or map business processes -- use business operations skills

---

## Process

### Step 1: Gather Delegation Context Before Producing Anything

Do not skip this step. A delegation system built on wrong assumptions is worse than none -- it creates bureaucracy without benefit.

Ask the user for:
- **The full task list** they personally handle: every recurring task, every in-flight project, every thing they "just do" without thinking about it. If they cannot produce a list, prompt them by category: communication (email, calls, meetings), creation (writing, design, code), administration (scheduling, data entry, invoicing), and operations (logistics, purchasing, fulfillment).
- **Who is available to receive delegated work:** employees by role and skill level, contractors or freelancers, virtual assistants, family members in household contexts, and automation or software services. For each, note their approximate weekly capacity, their skill set, and whether the user has delegated to them before.
- **What has failed before:** ask specifically whether past delegation broke down at the handoff (unclear instructions), at execution (wrong skills or capacity), or at delivery (no follow-up). The failure mode determines which part of the system to reinforce.
- **The user's primary bottleneck:** too many tasks total (volume problem), wrong tasks for their skill level (fit problem), or no system for tracking what they have handed off (accountability problem). Each bottleneck calls for a different emphasis in the system.
- **Risk tolerance:** in high-stakes domains (client-facing communication, financial transactions, legal documents), the user may need supervised delegation with review gates rather than full handoff.

If the user is solo with no existing staff, move immediately to the Edge Case for "no one to delegate to" and reframe around outsourcing and automation before building the system.

---

### Step 2: Score Every Task with the Five-Dimension Delegation Filter

Apply this filter to each task the user listed. Do not rely on gut feel -- the scoring makes the decision visible and defensible.

**Dimension 1: Unique Authority**
Does completing this task require the user's legal, fiduciary, or relational authority -- a signature, an executive decision, a key client relationship that would be damaged if someone else handled it? If yes, the task cannot be fully delegated. It may be partially delegated (delegate prepares, user decides).

**Dimension 2: Unique Expertise**
Could the task be done at 80% or better quality by someone else with reasonable training or briefing? The 80% threshold is the standard benchmark in delegation theory -- aiming for 100% quality match before delegating is a failure mode that keeps over-skilled people doing under-skilled work. If the answer is yes at 80%, the task is delegatable.

**Dimension 3: Recurrence**
One-time tasks have a high setup-to-execution cost ratio: the briefing almost costs more than doing the task. Recurring tasks amortize that cost across every future instance. Flag all weekly, monthly, or process-driven tasks as high-value delegation targets.

**Dimension 4: Risk Level**
Categorize risk on three axes:
- **Reversibility:** Can a mistake be corrected cheaply (editable document) or is it permanent (sent email, financial transaction)?
- **Visibility:** Does failure show to a client or the public, or only internally?
- **Magnitude:** Is the worst-case outcome a minor inconvenience or a legal or reputational problem?
Low risk = reversible, internal, low-magnitude. High risk = irreversible, external, high-magnitude.

**Dimension 5: Process Clarity**
Can the task be described in a written SOP of five steps or fewer? If yes, it is immediately delegatable with low training cost. If no, the user must invest in documenting the process before delegating -- or the delegate will fail regardless of skill.

**Scoring Output for Each Task:**
Assign: Delegate (full handoff), Keep (irreplaceable or too risky without more setup), Partial (delegate executes, user reviews and approves output), or Automate (no human needed -- software can handle it).

---

### Step 3: Match Each Delegatable Task to the Right Delegate

Mismatched delegation -- giving a task to someone who lacks the skill, the context, or the capacity -- is the most common cause of delegation failure. Apply these matching rules:

- **Skill match:** List the specific micro-skills the task requires. Customer email requires tone judgment and product knowledge, not just typing speed. Social media scheduling requires brand voice familiarity. Bookkeeping data entry requires attention to detail and basic spreadsheet literacy. Match these to what each available delegate actually does well.
- **Capacity check:** Before assigning, estimate the time per week the task will require. A 10-hour-per-week VA who is already handling 8 hours of work can absorb 2 more hours -- not 5. Make this visible in a time budget table.
- **Autonomy level calibration:** Three levels:
  - **Full autonomy:** Delegate determines the approach, executes, and delivers the output. The user only reviews the final product. Use for low-risk, well-documented, recurring tasks.
  - **Guided autonomy:** User provides SOPs, templates, or decision trees. Delegate follows them with minimal judgment required. Use for medium-risk or brand-sensitive tasks.
  - **Supervised execution:** User reviews at multiple checkpoints before work proceeds to the next phase. Use for high-risk, irreversible, or client-facing tasks until trust is established.
- **Trust calibration:** New delegates start at guided or supervised, regardless of their stated competence. Move toward full autonomy after three to five successful completions of the task with no escalations.
- **Load distribution:** Never concentrate delegation on one person. A single delegate as a bottleneck creates the same overload problem the user was trying to solve.

---

### Step 4: Build the Handoff Template for Each Delegated Task

A handoff is not a task description. A task description tells someone what to do. A handoff tells someone what "done" looks like, what authority they have, what resources they have, and when to escalate. Every element below is required -- the ones most commonly omitted are Decision Authority and Escalation Criteria, which are exactly the ones that prevent the delegate from stalling.

**Required handoff elements:**

- **Desired outcome statement:** Written as an observable, measurable result. Not "handle customer emails" but "every customer email receives a response within 4 business hours using the approved template library; no template match escalates to me same-day." The outcome statement is the quality benchmark used during review.

- **Deliverables list:** Specific artifacts the delegate will produce, with format requirements. "A weekly report" is incomplete. "A Google Sheet in the format in the linked template, submitted to the shared folder by 5 PM Friday" is complete.

- **Deadline and checkpoints:** Single deadlines invite last-minute failures. For any task longer than two days, specify interim checkpoints: a draft or partial deliverable at a midpoint that allows course correction before the final deadline.

- **Resources and access provided:** List every login, document, tool, or contact the delegate needs. Delegates who do not have what they need will either stall silently or improvise badly. Making this explicit at handoff prevents both outcomes.

- **Decision authority boundary:** Specify exactly what the delegate can decide without asking and what requires the user's approval. Expressed as a threshold where possible -- "can approve refunds up to $50 independently; anything above $50 requires my sign-off." Ambiguous authority produces two failure modes: delegates who decide too much (creating risk) and delegates who ask permission constantly (defeating the purpose of delegation).

- **Escalation criteria:** Three to five specific conditions that trigger immediate escalation. Not "use your judgment" but "escalate if the customer mentions a legal threat, if the order error exceeds $200, or if the platform goes down during a campaign." Clear escalation criteria protect both the delegate and the user.

- **SOP link or attachment:** If the task has a process, attach or link the written procedure. If no SOP exists yet, note that one will be developed after the first two cycles.

---

### Step 5: Design the Follow-Up and Accountability System

The Waiting For tracker is the backbone of delegation accountability. Without it, delegated tasks exist only in the delegate's memory -- which is the user's original problem, just relocated.

**Waiting For tracker fields (required):**
- Task name
- Delegate name
- Date assigned
- Due date
- Next scheduled check-in date
- Current status: Not Started, In Progress, Blocked (with reason), Complete, Reviewed
- Notes field for anything that came up during check-in

**Check-in cadence by risk level:**
- **Low risk:** Check in at due date only. Review output against the desired outcome statement. Spot-check one to two deliverables rather than reviewing everything.
- **Medium risk:** Check in at the 50% mark (halfway between assignment and due date) and at delivery. At midpoint, confirm the delegate is on track and has everything they need. At delivery, review all deliverables against spec.
- **High risk:** Check in at 25%, 50%, 75%, and 100% of elapsed time. This is not micromanagement -- it is structured risk management. At each checkpoint, review the specific phase deliverable, not the whole project. Confirm that no blockers have developed silently.

**Check-in format:** Keep check-ins short and structured. Three questions: What is done? What is next? Is anything blocked? A five-minute async message (Slack, email) is better than a 30-minute meeting for routine status updates. Reserve synchronous meetings for tasks that are blocked or off-track.

**Feedback rule:** Provide feedback to the delegate within 24 hours of receiving completed work. Delayed feedback is the most common way to undermine a delegate's learning curve and erode their engagement with delegated tasks. Positive feedback on good work is as important as corrective feedback on errors.

---

### Step 6: Define the Quality Review Process

Delegation without quality review creates a system where errors compound invisibly over time. Quality review is not a sign of distrust -- it is the mechanism that makes delegation sustainable.

**Quality review levels:**
- **Spot-check review (low-risk tasks):** Review one in five to one in ten instances of a recurring task. Enough to catch systemic errors without the overhead of reviewing everything.
- **Full output review (medium-risk tasks):** Review every instance but accept minor imperfections if the outcome statement is met. Focus on whether the result achieves the goal, not whether it was done exactly as you would have done it.
- **Staged-gate review (high-risk tasks):** Each checkpoint output is a formal gate. Work does not proceed to the next phase until the gate is cleared. This is the model used in regulated industries and client-facing deliverables where errors are expensive.

**Quality review checklist elements:**
- Does the output match the desired outcome statement exactly?
- Are all specified deliverables present and in the correct format?
- Were deadlines and checkpoints met? If not, was the delay communicated in advance?
- Are there any errors in the critical elements (numbers, client names, deadlines, links)?
- Is the quality level above the 80% threshold -- good enough to stand behind?
- Was the escalation protocol followed correctly (nothing that should have been escalated was decided independently)?

**After review:** Categorize feedback as: Accept (no action needed), Accept with note (minor issue to mention for next time), Revise (specific corrections needed before use), or Reject and redo (fundamental failure requiring a new attempt). Only "Reject and redo" should trigger a full re-delegation cycle with a revised handoff.

---

### Step 7: Assemble and Deliver the Complete Delegation System Document

The output is a single document the user can act on immediately. Structure it in this order:

1. Delegation decision table for all tasks reviewed
2. Delegate capacity overview (time budget)
3. Task-to-delegate assignment table
4. Handoff templates (one per delegated task)
5. Waiting For tracker (pre-populated with the assigned tasks)
6. Follow-up schedule by risk level
7. Quality review checklist
8. 30-day system review note: instruct the user to review the whole system after 30 days and adjust autonomy levels, check-in frequency, and task assignments based on what they have learned

---

## Output Format

```
# [User Name or Context]'s Delegation System
Generated: [date]

---

## Part 1: Delegation Decision Analysis

### Task Inventory and Scoring
| # | Task | Recurrence | Unique Authority? | 80% Rule? | Risk Level | Process Clarity | Decision |
|---|------|-----------|-------------------|-----------|-----------|----------------|----------|
| 1 | [task name] | [Daily/Weekly/Monthly/One-time] | [Yes/No -- reason] | [Yes/No] | [Low/Med/High] | [SOP exists/Needs SOP/Not needed] | [Delegate/Keep/Partial/Automate] |

---

## Part 2: Delegate Capacity Overview

### Available Delegates
| Delegate | Role / Type | Weekly Capacity | Skills | Trust Level |
|----------|------------|----------------|--------|-------------|
| [name] | [employee/VA/contractor/service] | [X hours/week] | [skill list] | [New/Established/Trusted] |

### Time Budget
| Delegate | Task | Estimated Hours/Week | % of Capacity |
|----------|------|---------------------|---------------|
| [name] | [task] | [X] | [%] |
| [name] | TOTAL | [X] | [%] |

---

## Part 3: Task-to-Delegate Assignment

| # | Task | Delegate | Autonomy Level | Trust Progression | Reason for Match |
|---|------|----------|---------------|-------------------|-----------------|
| 1 | [task] | [person/service] | [Full/Guided/Supervised] | [Move to Full after X successes] | [specific reasoning] |

---

## Part 4: Handoff Templates

### Handoff: [Task Name]
**Delegate:** [name]
**Date Assigned:** [date]
**Due Date / Recurrence:** [date or "Every [day], by [time]"]
**Risk Level:** [Low / Medium / High]
**Autonomy Level:** [Full / Guided / Supervised]

#### Desired Outcome
[One to three sentences describing the observable, measurable result. What does "done" look like and what quality standard does it meet?]

#### Deliverables
- [ ] [Deliverable 1: specific artifact, format, destination, and deadline]
- [ ] [Deliverable 2: specific artifact, format, destination, and deadline]

#### Resources and Access Provided
| Resource | Where to Find It | Access Method |
|----------|-----------------|---------------|
| [document/login/template] | [location] | [how to access] |

#### Decision Authority
**Can decide independently:**
- [specific decision type and threshold -- e.g., "approve refunds up to $30"]
- [specific decision type]

**Must escalate to me before:**
- [specific condition -- e.g., "any request involving a legal threat"]
- [specific condition]

#### Checkpoints
| Checkpoint | Date / Trigger | What to Review |
|-----------|----------------|----------------|
| [Mid-point / 50% elapsed] | [date or trigger] | [specific deliverable or progress indicator] |
| [Final delivery] | [date] | [complete output review] |

#### Escalation Criteria
- Escalate immediately if: [condition 1]
- Escalate immediately if: [condition 2]
- Escalate immediately if: [condition 3]

#### SOP Reference
[Link or attachment name, or note: "SOP to be drafted after first two cycles"]

---
[Repeat Handoff section for each delegated task]

---

## Part 5: Waiting For Tracker

| # | Task | Delegate | Date Assigned | Due Date | Next Check-In | Status | Notes |
|---|------|----------|--------------|----------|--------------|--------|-------|
| 1 | [task] | [person] | [date] | [date] | [date] | [Not Started / In Progress / Blocked / Complete / Reviewed] | |

---

## Part 6: Follow-Up Schedule

| Risk Level | Check-In Frequency | Format | Review Depth |
|-----------|-------------------|--------|-------------|
| Low | At due date only | Async message or email | Spot-check 1 in 5 instances |
| Medium | At 50% elapsed + due date | Async message; meeting only if blocked | Review all deliverables against spec |
| High | At 25%, 50%, 75%, 100% elapsed | Structured check-in (sync or detailed async) | Stage-gate review at each checkpoint |

**Feedback rule:** Provide feedback to the delegate within 24 hours of receiving completed work -- positive or corrective.

---

## Part 7: Quality Review Checklist

Run this checklist when reviewing completed delegated work:

- [ ] Output matches the desired outcome statement
- [ ] All deliverables are present and in the correct format and location
- [ ] All deadlines and checkpoints were met (note any delays)
- [ ] No critical element errors: numbers, names, dates, links verified
- [ ] Quality meets or exceeds the 80% threshold
- [ ] Escalation protocol followed correctly -- nothing decided outside stated authority
- [ ] Feedback provided to delegate within 24 hours

**Review outcome:**
- [ ] Accept -- no action needed
- [ ] Accept with note -- minor feedback for next cycle
- [ ] Revise -- specific corrections required before use
- [ ] Reject and redo -- fundamental failure; revisit handoff template

---

## Part 8: 30-Day System Review

Schedule a 30-day review after launching this system. Evaluate:
- Which tasks were completed on time and at quality? Increase autonomy for those.
- Which tasks required more check-ins than planned? Investigate root cause (unclear SOP, skill gap, capacity issue).
- Which tasks took more of the delegate's time than estimated? Adjust time budget.
- Are any tasks still on "Keep" that could now be delegated with a better SOP or a different delegate?
- Is the Waiting For tracker being maintained consistently? If not, move it to a tool the user actually uses daily.
```

---

## Rules

1. **Never produce a delegation system without first identifying who the delegates are.** "Someone should handle this" is not a delegation system -- it is wishful thinking. Every delegated task must have a named delegate (person, role, or specific service) before the handoff template is written.

2. **Apply the 80% rule rigorously.** If the user says "no one can do this as well as I can," probe whether that is true or whether it is a cognitive distortion called "delegation anxiety." The standard is 80% quality, not 100%. Reserve the user's irreplaceable capacity for the 20% of tasks where their specific contribution matters most.

3. **Never omit Decision Authority or Escalation Criteria from a handoff template.** These are the two elements most commonly skipped and most responsible for delegation failure. Without decision authority, delegates will either over-decide (creating risk) or under-decide (creating constant interruptions). Without escalation criteria, delegates freeze when situations deviate from the SOP.

4. **Risk level drives check-in frequency -- not personal preference.** The user cannot decide they "trust" a delegate and therefore skip check-ins on a high-risk task. Trust is calibrated over time through successful completions. High-risk tasks get 4-checkpoint oversight regardless of delegate seniority until a track record is established.

5. **Recurring tasks are always higher-value delegation targets than one-time tasks.** When time budget is limited, prioritize delegating recurring work -- the SOP investment pays off over every future cycle. One-time tasks with high setup costs should only be delegated if they are large enough to justify the briefing time.

6. **Feedback within 24 hours is a system rule, not a suggestion.** Delayed feedback breaks the learning loop that makes delegation improve over time. It also signals to the delegate that the work was not important, which erodes motivation. Build the 24-hour feedback rule into the quality review checklist explicitly.

7. **Do not delegate authority without delegating the resources to exercise it.** A delegate who is told to "handle customer refunds" but does not have access to the refund processing system cannot do the task. Every handoff template must include a complete resources-and-access list. If access cannot be granted, the task cannot be fully delegated at that autonomy level.

8. **Autonomy level must match trust level, not the user's desired workload reduction.** It is tempting to set all tasks to "full autonomy" to maximize time recovered. This creates high-risk unsupervised execution by delegates who have not yet demonstrated competence. Start every new delegate at guided or supervised, and move to full autonomy after three to five clean completions.

9. **Build the Waiting For tracker in the tool the user already uses.** A tracker in a system the user does not open daily will be abandoned within a week. If the user uses a task manager (Todoist, Asana, Notion, Apple Reminders), the Waiting For tracker goes there. If they use email, it goes in a labeled folder with a weekly review trigger. Never recommend a new tool without checking what the user already uses.

10. **Schedule the 30-day system review at the time of system launch, not "sometime later."** The delegation system will have calibration errors on first deployment -- estimated task times will be wrong, some skill matches will be off, and the SOP for some tasks will be incomplete. Without a scheduled review, these errors compound silently. The review is not optional maintenance -- it is the mechanism that converts a first-draft system into a working one.

---

## Edge Cases

**The user has no one to delegate to (solo operator).**
Reframe the skill around three non-human delegation targets: (1) automation -- email filters and auto-responders, calendar scheduling tools, social media schedulers, invoice automation, and Zapier-style workflow connectors can replace human effort for rule-based tasks; (2) freelancers and platforms -- one-time or recurring tasks can be posted to freelance platforms, and a virtual assistant hired for even 5 hours per week can absorb significant administrative load; (3) AI-assisted drafting -- first drafts of emails, social posts, summaries, and reports can be generated by AI and reviewed by the user, cutting execution time by 50-70% without requiring a human delegate. Build the delegation system around these three categories and name specific tools for each task type.

**The user has tried delegation before and it failed repeatedly.**
Do not rebuild the same system with better templates. Diagnose the failure mode first using a structured root-cause question: Was the handoff unclear (delegate did not know what "done" meant)? Was the delegate unqualified (skill mismatch)? Was there no follow-up (accountability gap)? Was the delegate overloaded (capacity mismatch)? Was the user un-delegatable in practice (took tasks back before completion)? Each failure mode has a specific fix: unclear handoffs need better outcome statements and SOPs; skill mismatches need better delegate selection or a training step; accountability gaps need the Waiting For tracker and check-in schedule; capacity mismatches need the time budget table; task-taking-back is a behavioral issue the user must acknowledge, and the system should include a "no-takeback" commitment for low-risk tasks.

**All of the user's tasks seem irreplaceable.**
This is almost always a sign of "delegation anxiety" or "expert trap" -- the belief that because the user knows how to do something well, no one else can do it adequately. Counter this systematically: ask the user to identify the five tasks they would give up first if they had to take a two-week vacation with no access to their work. Those are the real starting delegation candidates. Then apply the 80% rule explicitly to each one. If the user genuinely cannot find anything delegatable, explore whether the real constraint is documentation -- tasks that cannot be written down in five steps are not undelegatable, they are just undocumented. The first action is to write the SOP, then delegate.

**The user wants to delegate but cannot release control (emotional/psychological barrier).**
This is a real management development issue, not a process problem. Acknowledge it directly: delegation anxiety is common, especially in founders, solo operators, and high-performing individual contributors who built their identity on personal execution quality. Reframe delegation as risk management rather than trust: the user does not have to trust the delegate perfectly; they have to trust the system (checkpoints, escalation criteria, quality review) to catch errors before they become problems. Suggest starting with a single, low-risk, reversible task -- one where the worst-case failure is a minor fix -- to build the user's confidence in the system before expanding scope.

**The user is delegating within a household (family tasks).**
The directive language of professional delegation ("you are responsible for this task") can create friction in personal relationships. Adjust the system language: replace "delegate" with "owns this" or "leads this," replace "escalation criteria" with "when to loop in the other person," and replace "quality review" with "check-in." The handoff template should be co-created with the family member rather than handed down. Mutual agreement on the standard and the process is more important than a detailed SOP. The Waiting For tracker becomes a shared list (a family task board, a shared note, or a whiteboard) rather than a personal tracking tool.

**The user has multiple delegates with overlapping skill sets.**
When more than one person could handle a task, the assignment decision should be based on three factors in order: (1) who has the most available capacity in the current cycle; (2) who has the highest established trust level with this task type; (3) who would benefit most from the development opportunity if the task is growth-oriented. Never assign to the same delegate by default just because they handled it before -- this creates single-point-of-failure risk if that delegate becomes unavailable. For critical recurring tasks, build a documented backup delegate into the handoff template explicitly.

**The user's delegates operate in different time zones (remote or international VA).**
Modify the check-in system to be async-first: structured status updates submitted at a defined local time by the delegate, reviewed by the user at their local start-of-day. Replace real-time check-ins with templated status messages: "Task: [name] | Status: [On Track / Blocked / Complete] | Done today: [X] | Next step: [Y] | Blocking issue: [if any]." Set explicit async escalation protocols: what channel the delegate uses to signal an urgent issue (a flagged message, a specific subject line prefix) and the user's committed response time to that signal. Time zone gaps should be surfaced in the handoff template under "Resources and Access" with a note on overlap hours.

**The user is delegating a task that does not yet have a documented process (undocumented tribal knowledge).**
Delegating undocumented work is the single most common source of delegation failure for experienced individual contributors. The correct sequence is: document first, then delegate. Use a "teach-back" SOP method: the user performs the task once while narrating each step into a recording or document. The delegate reads or watches it, then performs the task once with the user observing. The delegate then writes the final SOP based on their experience. This process takes two cycles but produces an SOP the delegate actually understands and owns, rather than one that exists only on paper. Note this requirement explicitly in the handoff template when the SOP does not yet exist.

---

## Example

**Input:** "I run a small boutique PR firm with two full-time junior account coordinators and one part-time bookkeeper (10 hours per week). I handle everything myself right now -- client calls, writing press releases, pitching journalists, tracking media coverage, invoicing, social media for the firm, and managing my team's work. I'm working 70-hour weeks and I'm the bottleneck on everything. My coordinators are smart but I've never formally given them ownership of anything."

**Output:**

---

# Delegation System -- Boutique PR Firm
Generated: [current date]

---

## Part 1: Delegation Decision Analysis

### Task Inventory and Scoring

| # | Task | Recurrence | Unique Authority? | 80% Rule? | Risk Level | Process Clarity | Decision |
|---|------|-----------|-------------------|-----------|-----------|----------------|----------|
| 1 | Client strategy calls (key accounts) | Weekly | Yes -- clients hired the principal | No | High | No SOP needed | Keep |
| 2 | Press release drafting | 3-4x/week | No -- style can be trained | Yes | Medium | Needs SOP | Partial (coordinator drafts, principal revises) |
| 3 | Journalist pitching (Tier 1 media) | Daily | Partial -- relationship matters | Partial | High | Needs SOP | Partial (coordinator researches and drafts, principal sends) |
| 4 | Journalist pitching (Tier 2/3 media) | Daily | No -- process-driven | Yes | Medium | Needs SOP | Delegate (guided) |
| 5 | Media coverage tracking and reporting | Weekly | No -- research and compilation | Yes | Low | SOP exists informally | Delegate (full) |
| 6 | Client invoice generation | Monthly | No -- data entry | Yes | Medium | Needs SOP | Delegate to bookkeeper (guided) |
| 7 | Invoice follow-up on overdue accounts | Monthly | Partial -- relationship sensitivity | Yes for initial follow-up | Medium | Needs SOP | Partial (bookkeeper follows up; principal on 30+ days overdue) |
| 8 | Firm social media content | 3x/week | No -- brand voice trainable | Yes | Low | Needs content calendar | Delegate (guided) |
| 9 | Team workload management and task assignment | Ongoing | Yes -- management authority | No | High | No | Keep (but build a visible system to reduce ad-hoc interruptions) |
| 10 | New business proposals | As needed | Yes -- requires principal judgment and relationships | No | High | No | Keep |

---

## Part 2: Delegate Capacity Overview

### Available Delegates

| Delegate | Role / Type | Weekly Capacity | Core Skills | Trust Level |
|----------|------------|----------------|------------|-------------|
| Coordinator A | Junior Account Coordinator, FT | 40 hrs/week | Writing, research, organized, detail-oriented | New to formal delegation |
| Coordinator B | Junior Account Coordinator, FT | 40 hrs/week | Client communication, media list management, social media familiarity | New to formal delegation |
| Bookkeeper | Part-time bookkeeper | 10 hrs/week | QuickBooks, invoicing, accounts receivable | Established (existing relationship) |

### Time Budget (Delegated Tasks Only)

| Delegate | Task | Estimated Hours/Week | % of Capacity |
|----------|------|---------------------|---------------|
| Coordinator A | Press release first drafts | 6 | 15% |
| Coordinator A | Tier 2/3 journalist pitching | 8 | 20% |
| Coordinator A | Media coverage tracking and reporting | 4 | 10% |
| Coordinator A | TOTAL DELEGATED | 18 | 45% |
| Coordinator B | Tier 1 pitch research and draft | 5 | 12.5% |
| Coordinator B | Firm social media content | 4 | 10% |
| Coordinator B | Media coverage tracking and reporting | 4 | 10% |
| Coordinator B | TOTAL DELEGATED | 13 | 32.5% |
| Bookkeeper | Invoice generation | 2 | 20% |
| Bookkeeper | Invoice follow-up (initial, under 30 days) | 1.5 | 15% |
| Bookkeeper | TOTAL DELEGATED | 3.5 | 35% |

**Remaining principal time recovered per week: approximately 26 hours (press release revision: 3 hrs, Tier 1 pitch review and send: 3 hrs, invoice follow-up 30+ days: 0.5 hrs) -- actual recovery closer to 20-22 hours after handoff overhead in weeks 1-4.**

---

## Part 3: Task-to-Delegate Assignment

| # | Task | Delegate | Autonomy Level | Trust Progression | Reason for Match |
|---|------|----------|---------------|-------------------|-----------------|
| 1 | Press release first drafts | Coordinator A | Guided (SOP + principal revision required) | Move to Partial Supervised after 5 clean drafts | Strongest writer; revision gate manages quality risk |
| 2 | Tier 2/3 journalist pitching | Coordinator A | Guided (approved pitch template + media list) | Move to Full after 10 pitches with tracking | Process-driven; documented SOP makes this teachable |
| 3 | Tier 1 pitch research and draft | Coordinator B | Supervised (principal reviews draft and sends) | Keep supervised for 60 days -- relationship risk too high | Coordinator B handles client communication well; principal retains send authority |
| 4 | Media coverage tracking | Both Coordinators | Full (shared tracker, weekly report format) | Already at full -- process is clear | Low risk, completely documentable |
| 5 | Firm social media content | Coordinator B | Guided (content calendar + brand voice guide) | Move to Full after 30 days of on-brand posts | Social media familiarity; content calendar reduces judgment calls |
| 6 | Invoice generation | Bookkeeper | Guided (SOP + principal spot-checks monthly) | Already established; move to Full review after 3 clean months | Core bookkeeper competency; already in their workflow |
| 7 | Invoice follow-up (under 30 days) | Bookkeeper | Guided (approved email templates only) | Keep guided -- payment communications are relationship-sensitive | Clear script removes judgment requirement |

---

## Part 4: Handoff Templates

### Handoff: Press Release First Drafts
**Delegate:** Coordinator A
**Date Assigned:** [Week 1]
**Recurrence:** Triggered by client campaign calendar (approx. 3-4 per week)
**Risk Level:** Medium
**Autonomy Level:** Guided (SOP + mandatory principal revision before any release leaves the firm)

#### Desired Outcome
A complete first-draft press release for each assigned campaign moment, written in the firm's house style (AP style, inverted pyramid structure), that requires no more than 20 minutes of principal revision to reach final quality. The draft must include all required client information, a working headline and subhead, two client quotes (drafted, not yet approved by client), and a boilerplate.

#### Deliverables
- [ ] Draft press release in Google Docs, shared in the Client Campaign folder, named "[ClientName]\_PR\_[Topic]\_DRAFT\_[date]"
- [ ] Revision request note at the top of the document: what information is missing or uncertain and needs principal input
- [ ] Draft submitted minimum 48 hours before any intended distribution date

#### Resources and Access Provided
| Resource | Where to Find It | Access Method |
|----------|-----------------|---------------|
| House style guide and AP style reference | Shared Drive > Templates > Style | Full access |
| Client campaign briefs and background documents | Shared Drive > Clients > [Client Name] > Campaign Briefs | Full access |
| Approved client quote library (prior approved quotes) | Shared Drive > Clients > [Client Name] > Approved Assets | Full access |
| Press release template (structure guide) | Shared Drive > Templates > PR Templates | Full access |
| Client contact for factual questions | [Client name, email, phone] | Email or Slack only -- do not call without checking with principal first |

#### Decision Authority
**Can decide independently:**
- Structure of the release (format, ordering of information)
- Word choice and tone within the house style guide parameters
- Which background facts and statistics to include from approved materials
- Drafting quotes (marked clearly as "DRAFT QUOTE -- client approval needed")

**Must escalate to principal before:**
- Any factual claim not found in the approved client materials
- Any deviation from the approved campaign messaging (provided in the brief)
- Contact with the client about the release content (coordinator may contact for scheduling questions only)
- Any situation where the release cannot be drafted by the 48-hour lead time

#### Checkpoints
| Checkpoint | Trigger | What to Review |
|-----------|---------|----------------|
| First three drafts (weeks 1-2) | After each submission | Full detailed review; principal marks all revisions with comments, not silent edits |
| Ongoing after draft 4+ | Each submission | Principal reviews and revises; tracks revision time to measure improvement |

#### Escalation Criteria
- Escalate immediately if: the client brief contains contradictory information that cannot be resolved using existing materials
- Escalate immediately if: a draft cannot be completed 48 hours before distribution due to missing information
- Escalate immediately if: the campaign topic involves any legal, regulatory, or sensitive reputational issue not flagged in the original brief

#### SOP Reference
Coordinator A and principal to co-develop the press release SOP during week 1, using the existing house style guide as the foundation. Coordinator A documents their process after drafts 1 and 2; principal refines it. Final SOP lives in Shared Drive > Templates > SOPs.

---

### Handoff: Tier 2/3 Journalist Pitching
**Delegate:** Coordinator A
**Date Assigned:** [Week 2, after press release handoff is stable]
**Recurrence:** Daily during active campaigns; 3-5 pitches per day
**Risk Level:** Medium
**Autonomy Level:** Guided (approved pitch templates and media list; coordinator sends independently)

#### Desired Outcome
Each relevant Tier 2 and Tier 3 media contact on the approved campaign media list receives a personalized pitch email within the campaign window. Personalization means at least one reference to the journalist's recent work or beat. All pitches use the approved template with permitted variations noted in the SOP. Open rates and response rates are tracked in the campaign tracker.

#### Deliverables
- [ ] Daily pitch log: journalist name, outlet, pitch sent timestamp, and any response received -- entered same day into the Campaign Tracker (Google Sheet)
- [ ] Weekly pitch summary: total pitches sent, responses received, placements secured, and outstanding follow-ups -- submitted to principal by 4 PM Friday
- [ ] Pitch drafts for any non-template situation submitted to principal for approval before sending

#### Resources and Access Provided
| Resource | Where to Find It | Access Method |
|----------|-----------------|---------------|
| Approved media list by campaign | Shared Drive > Clients > [Client] > Campaign > Media Lists | Full access |
| Approved pitch templates (3 variants) | Shared Drive > Templates > Pitch Templates | Full access |
| Campaign Tracker (Google Sheet) | Shared Drive > Clients > [Client] > Campaign Tracker | Full edit access |
| Shared email account for outreach | [account credentials in password manager] | Full access |
| Media database (Muck Rack / Cision) | [login in password manager] | Full access |

#### Decision Authority
**Can decide independently:**
- Which approved template to use for each journalist
- Personalization language within the template parameters
- Follow-up timing (standard is 4 business days after initial pitch)
- Decision to remove a journalist from outreach if their beat has clearly shifted

**Must escalate to principal before:**
- Pitching any journalist not on the approved list
- Responding to any journalist who expresses interest in a story (these go immediately to principal)
- Sending any pitch that does not fit the three approved templates
- Offering any journalist exclusive story rights or embargo terms

#### Checkpoints
| Checkpoint | Trigger | What to Review |
|-----------|---------|----------------|
| End of Week 2 | First week of pitching | Review 10 sent pitches for personalization quality and template adherence |
| Every Friday | Weekly summary submission | Review response rates; identify any journalists who responded and need principal follow-up |

#### Escalation Criteria
- Escalate immediately if: a journalist responds expressing interest, requests an interview, or asks for additional materials
- Escalate immediately if: a journalist responds with a complaint or accusation
- Escalate immediately if: a pitch bounces back with a domain-level block (may indicate a prior relationship issue)

---

### Handoff: Media Coverage Tracking and Weekly Report
**Delegate:** Both Coordinators (alternating weekly lead)
**Date Assigned:** Week 1
**Recurrence:** Daily monitoring; weekly report due Monday by 9 AM
**Risk Level:** Low
**Autonomy Level:** Full

#### Desired Outcome
Every mention of each active client in online, print, and broadcast media is captured within 24 hours of publication. The weekly coverage report is formatted correctly, accurate, and ready for the principal to send to clients with no more than 5 minutes of review.

#### Deliverables
- [ ] Daily: new coverage entries added to the Coverage Tracker (Google Sheet) same-day -- outlet, journalist, publication date, reach/circulation if available, article link or scan, sentiment (Positive/Neutral/Negative)
- [ ] Monday by 9 AM: weekly coverage report in the approved template (Google Doc, Client Coverage Report Template), shared in the client folder

#### Resources and Access Provided
| Resource | Location | Access |
|----------|----------|--------|
| Google Alerts (configured per client) | [Google account login] | Full access |
| Muck Rack monitoring alerts | [login in password manager] | Full access |
| Coverage Tracker (Google Sheet) | Shared Drive > Clients > [Client] > Coverage | Full edit |
| Coverage Report Template | Shared Drive > Templates > Coverage Report | Full access |

#### Decision Authority
- Can decide independently: all -- this is full-autonomy delegation
- Flag for principal if: any coverage is negative or involves a factual error that may require a response

#### Checkpoints
- Spot-check: principal reviews one weekly report per month in detail to confirm accuracy and format
- Quarterly: review tool coverage to confirm alerts are not missing significant outlets

#### Escalation Criteria
- Escalate immediately if: coverage contains a factual error, negative portrayal, or potential crisis signal (legal allegation, product recall reference, executive controversy)
- Escalate if: a significant placement appears (major national outlet, broadcast) -- principal will want to notify the client directly

---

### Handoff: Firm Social Media Content (LinkedIn and Instagram)
**Delegate:** Coordinator B
**Date Assigned:** Week 1
**Recurrence:** 3 posts per week per platform (Monday, Wednesday, Friday)
**Risk Level:** Low
**Autonomy Level:** Guided (content calendar + brand voice guide required)

#### Desired Outcome
All firm social media accounts maintain a consistent posting cadence of 3 times per week. All posts match the brand voice guide (professional but human, thought-leadership focused, no promotional language). Content draws from the approved content category mix: 40% industry insights, 30% case study highlights (anonymized), 20% team culture, 10% direct service promotion.

#### Deliverables
- [ ] Content calendar populated two weeks in advance at all times (Google Sheet: Social Content Calendar)
- [ ] Draft posts submitted in the content calendar for principal review by Wednesday of the prior week for the following week's content
- [ ] Posts scheduled in the scheduling tool by Friday afternoon for the following week
- [ ] Monthly performance summary: engagement rate, follower growth, top-performing post -- submitted last Friday of each month

#### Resources and Access Provided
| Resource | Location | Access |
|----------|----------|--------|
| Brand voice guide | Shared Drive > Marketing > Brand Guide | Full access |
| Content calendar template | Shared Drive > Marketing > Social | Full edit |
| Approved case study summaries | Shared Drive > Marketing > Case Studies | Full access |
| Social media scheduling tool (Buffer or equivalent) | [login in password manager] | Full access |
| Canva brand account | [login in password manager] | Full access -- firm templates pre-loaded |

#### Decision Authority
**Can decide independently:**
- Post copy within the brand voice guide
- Visual selection from approved Canva templates
- Caption length and hashtag selection (approved hashtag list provided)

**Must get principal approval before:**
- Any post mentioning a specific client or campaign (even anonymized -- send to principal first)
- Any post involving industry news or commentary that could be seen as a firm position statement
- Any post format not already in the approved Canva templates

#### Checkpoints
| Checkpoint | Trigger | What to Review |
|-----------|---------|----------------|
| Week 1-4 | Each week's draft content | Principal reviews all drafts; approves or revises before scheduling |
| Week 5+ | Weekly draft review | Move to spot-check -- principal reviews 1-2 posts per week if content calendar is on-brand |

#### Escalation Criteria
- Escalate immediately if: a post receives a negative comment, DM complaint, or request for firm contact
- Escalate if: a trending topic creates a question about whether the firm should respond or comment

---

### Handoff: Monthly Invoice Generation
**Delegate:** Bookkeeper
**Date Assigned:** Ongoing (existing role, now formalized)
**Recurrence:** 1st-5th of each month
**Risk Level:** Medium
**Autonomy Level:** Guided (SOP + principal spot-check on 20% of invoices)

#### Desired Outcome
All client invoices for the prior month are generated accurately in QuickBooks, reflect the correct retainer amount and any approved additional fees, and are emailed to clients by the 5th of each month using the approved invoice email template.

#### Deliverables
- [ ] All invoices generated in QuickBooks by the 3rd of the month
- [ ] Invoice summary spreadsheet (client name, invoice number, amount, date sent) submitted to principal by the 5th
- [ ] Any discrepancies or unusual amounts flagged to principal before sending

#### Decision Authority
**Can decide independently:**
- Standard monthly retainer invoices (amounts are pre-agreed in client contracts)
- Reimbursable expense line items supported by receipts in the approved expense log

**Must escalate to principal before:**
- Any invoice that differs from the prior month's retainer amount
- Any invoice involving a new project fee not in the standard retainer
- Any invoice for a client whose contract is up for renewal (principal may want to handle billing conversation directly)

#### Checkpoints
- Monthly: principal spot-checks 2-3 invoices from the summary for accuracy before they are sent
- Quarterly: principal reviews accounts receivable aging report with bookkeeper

#### Escalation Criteria
- Escalate immediately if: a client disputes an invoice amount
- Escalate if: a client retainer amount in QuickBooks does not match the signed contract on file

---

## Part 5: Waiting For Tracker

| # | Task | Delegate | Date Assigned | Due Date | Next Check-In | Status | Notes |
|---|------|----------|--------------|----------|--------------|--------|-------|
| 1 | Press release drafts | Coord A | Week 1 Mon | Ongoing, 48-hr lead | Week 1 Thu (first draft review) | Not Started | |
| 2 | Tier 2/3 pitching | Coord A | Week 2 Mon | Daily | Week 2 Fri (first weekly summary) | Not Started | |
| 3 | Coverage tracking | Both | Week 1 Mon | Daily entries; Mon report | Week 2 Mon (first report review) | Not Started | |
| 4 | Firm social media | Coord B | Week 1 Mon | Wed draft submission | Week 1 Wed (first draft batch) | Not Started | |
| 5 | Invoice generation | Bookkeeper | Month 1, Day 1 | Month 1, Day 5 | Month 1, Day 3 (spot-check before send) | Not Started | |
| 6 | Tier 1 pitch research and draft | Coord B | Week 2 Mon | Per campaign calendar | Week 2 Thu (first draft review) | Not Started | |

**Recommended tracker location:** Add these as recurring tasks in [whatever task manager the principal currently uses]. Tag all with "Waiting For" label. Set the check-in date as the task due date so the principal's task manager surfaces them at the right time.

---

## Part 6: Follow-Up Schedule

| Risk Level | Task Examples | Check-In Frequency | Format | Review Depth |
|-----------|--------------|-------------------|--------|-------------|
| Low | Coverage tracking, social media | At weekly summary submission | Async email or Slack | Spot-check: 1 in 5 reports in detail; others scanned for format |
| Medium | Press release drafts, invoicing, Tier 2/3 pitching | Every submission (press releases); weekly (pitching); monthly (invoicing) | Async for routine; sync if revision rate is high | Review all deliverables against the outcome statement |
| High | Tier 1 pitch drafts, any client-facing communication | Every draft before sending | Principal reviews synchronously or within 4 hours of submission | Full review at every stage gate;
