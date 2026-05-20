---
name: eisenhower-matrix
description: |
  Applies the Eisenhower urgency/importance matrix to a user's task list, sorting every task into one of four quadrants with specific do/delegate/schedule/delete actions. Produces a populated matrix, not a framework description.
  Use when the user asks about prioritizing tasks by urgency and importance, needs help deciding what to work on first, or wants to sort a task list using the Eisenhower method.
  Do NOT use for weighted scoring prioritization (use task-prioritization), time-blocking scheduled tasks (use time-blocking), or enterprise resource allocation (use business strategy skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management decision-making planning"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Eisenhower Matrix

## When to Use

**Use this skill when:**
- The user presents a task list -- however informal -- and wants to know what to work on first, what to drop, or how to structure their day or week
- The user describes feeling overwhelmed, scattered, or reactive, and needs a structured triage of competing demands
- The user explicitly mentions urgency versus importance, the Eisenhower Matrix, the priority matrix, or the urgent/important grid
- The user is stuck deciding whether to do a task now, delay it, hand it off, or cut it entirely
- The user has a mix of self-assigned work, externally imposed deadlines, and open-ended goals and cannot see which deserves their finite attention
- The user is returning from a vacation, sick leave, or context switch and needs to re-triage a backlog
- The user is a solo professional, manager, student, or parent who must allocate personal time across domains (work, health, relationships, side projects)
- The user wants to audit whether their current task list is aligned with their stated goals -- a strategic reality check

**Do NOT use when:**
- The user needs to score and rank tasks using weighted criteria like cost, effort, ROI, or strategic alignment -- use `task-prioritization` instead
- The user's problem is not sorting tasks but scheduling them into specific time slots -- use `time-blocking` after this skill produces sorted quadrants
- The user is allocating resources across a team, department, or portfolio of projects -- organizational prioritization requires capacity modeling, not a personal urgency matrix
- The user is choosing between two specific options (job offer A vs. job offer B, vendor X vs. vendor Y) -- use `weighted-decision-matrix` which handles multi-criteria trade-offs
- The user wants a full capture-to-completion productivity workflow -- use `gtd-workflow` which incorporates the matrix as one step within a larger system
- The user's tasks are all part of a single project and need sequencing by dependency -- use a project dependency map or critical path analysis instead
- The user is trying to prioritize features in a product backlog -- use `product-backlog-prioritization` which applies MoSCoW, RICE, or Kano frameworks
- The user needs to prioritize investments or financial decisions -- time horizons and risk profiles in financial decisions require a different framework entirely

---

## Process

### Step 1: Capture the Complete Task List Before Sorting Anything

Collect every task the user has mentioned, implied, or listed. Do not begin sorting while the list is incomplete -- premature sorting causes the most important items to get buried if they are named last.

- Ask the user to do a full brain dump if they have not already: "Everything you need to do, are worried about, have promised to someone, or know you are avoiding."
- Specifically probe for tasks in these commonly forgotten categories: health and medical appointments, relationship and family commitments, administrative tasks (taxes, renewals, registrations), learning and professional development, and deferred maintenance (equipment, systems, processes).
- Assign a short label to each task (3-8 words). Vague entries like "deal with the project" must be clarified to a specific action ("Submit revised project budget to finance director").
- Flag tasks that are actually projects masquerading as single actions. "Redesign the website" is a project; "Write homepage headline copy options" is a task. Break compound items down before sorting.
- Aim for a minimum of 8-10 tasks to populate all four quadrants meaningfully. Fewer than 5 tasks usually means the user is under-capturing.
- Record any stated deadlines, dependencies (who is waiting), and whether the user personally must do it or if someone else could handle it.

### Step 2: Establish This User's Specific Urgency and Importance Thresholds

The Eisenhower Matrix fails when urgency and importance are left as abstract concepts. Calibrate both dimensions to the user's actual context before a single task is sorted.

- **Urgency threshold:** For most knowledge workers and professionals, urgent means a consequence activates within 24-48 hours. For weekly planners doing Sunday reviews, the threshold may extend to 72-96 hours. For operational roles (customer support, healthcare, logistics), urgency may mean within hours. Ask: "What's your planning horizon -- are you thinking about today, this week, or the next two weeks?"
- **Importance definition -- the goal test:** A task is important if it directly advances one of the user's top 2-3 current goals, produces a significant or irreversible outcome if not done, or is something only this person can do (not substitutable). Tasks that feel important due to social pressure, guilt, or habit often fail this test.
- **The Eisenhower Trap (most common error):** Urgent tasks feel important because of the emotional pressure they create. Train the user to separate the feeling of urgency from actual importance. A ringing phone is urgent; whether it is important depends on who is calling and why.
- Present the calibrated criteria explicitly before sorting. State them as: "For you, urgent means [X]. Important means it contributes to [Goal 1], [Goal 2], or [Goal 3], or has consequences that cannot be undone."
- If the user has not stated their goals, pause here and ask for 2-3 current priorities before proceeding. Without this anchor, importance cannot be objectively assessed and the entire matrix produces garbage results.
- Adjust importance thresholds for domain. For a student, "important" may mean exam-relevant or GPA-affecting. For a caregiver, "important" may mean health-critical or relationship-preserving. Mirror the user's own language.

### Step 3: Sort Each Task Into a Quadrant Using a Decision Tree

Apply a consistent two-question decision tree to every task, in order, without skipping steps.

- **Question 1: Is this task urgent?** Apply the threshold from Step 2. A hard yes or no. If genuinely borderline, default to not urgent -- urgency should be evident, not argued into existence.
- **Question 2: Is this task important?** Apply the goal test. Does it advance a stated goal, carry irreversible consequences, or require this specific person's unique judgment or authority?
- **Q1 -- Do First (Urgent + Important):** Deadlines with real consequences, crises, tasks where delay causes compounding harm (a delayed medical referral, an unacknowledged client escalation, a missed regulatory filing). These demand action today.
- **Q2 -- Schedule (Not Urgent + Important):** Strategic work, skill development, relationship investment, prevention and maintenance, creative and generative work. This is where the highest-value work lives. Eisenhower himself reportedly said that what is important is seldom urgent and what is urgent is seldom important.
- **Q3 -- Delegate (Urgent + Not Important):** Interruptions, certain meetings, some emails, administrative tasks, requests that serve others' agendas but not the user's goals. These have time pressure but do not require this person's judgment. The key question: could someone else handle this at 80% quality? If yes, it belongs here.
- **Q4 -- Eliminate (Not Urgent + Not Important):** Habitual activities with no goal connection, low-value browsing, tasks done out of social obligation without genuine value, work that was relevant six months ago but is now stale.
- Mark tasks whose placement feels uncertain with a "?" -- revisit these after the initial sort using the validation checks in Step 4.

### Step 4: Run Three Mandatory Validation Checks

The initial sort is a hypothesis. These three checks stress-test it before committing to action.

- **Check 1 -- Q1 overflow test:** If Q1 contains more than 5 items, the user is almost certainly conflating urgency with importance. Apply the consequence test to each Q1 item: "If this slips by 3 days, what is the specific, concrete consequence?" Tasks where the answer is vague or mild should move to Q2. Tasks where the answer involves losing a client, failing a compliance requirement, or missing a legal deadline stay in Q1.
- **Check 2 -- Q2 emptiness test:** An empty Q2 is a diagnostic signal, not a neutral state. It means the user has no scheduled time for strategic work, is fully reactive, and is at risk of long-term goal drift. If Q2 is empty after initial sorting, probe explicitly: "What have you been meaning to work on but not getting to? What would make a real difference six months from now if you started today?" Surface at least one Q2 item.
- **Check 3 -- Q3 delegation reality test:** For each Q3 item, ask: "Who specifically could take this, and do you have the authority or relationship to hand it off?" If the user is a solo worker, freelancer, student, or otherwise cannot delegate, do not leave these in Q3. Instead, reclassify as Q1 (if truly urgent and unavoidable) or Q4 (if they can be skipped), or create a "Minimize" sub-category -- tasks that must be done but should be batched and time-boxed to the absolute minimum.
- **Check 4 -- Coherence check (optional, for experienced users):** Does the ratio of Q1 to Q2 tasks reflect a healthy working mode? A chronic overload of Q1 with a perpetually empty Q2 indicates systemic problems (under-resourcing, poor boundary-setting, or a role that structurally prevents strategic work). Flag this pattern explicitly if it emerges.

### Step 5: Assign Concrete Next Actions to Every Task

A quadrant label without a next action is useless. Every task in the populated matrix must have a specific, physical next step assigned.

- **Q1 tasks:** Assign a next action executable today, right now if possible. "Finish the report" is not a next action. "Open the draft, complete the three missing data rows in Table 4, and send to the director by 5 PM" is a next action. Sequence Q1 items by consequence severity -- the task whose delay causes the most damage goes first.
- **Q2 tasks:** Assign a specific calendar date and a time duration. "Schedule sometime next week" is not acceptable. "Thursday, 2:00-4:00 PM" is. If the user does not have calendar access in this conversation, instruct them to block the time immediately after reviewing the matrix. Q2 tasks that are never scheduled always get pushed out indefinitely.
- **Q3 tasks:** Name the specific person or service the task is delegated to, and write the handoff communication in one sentence. "Ask Marcus to pull the vendor quotes by Wednesday" or "Forward the meeting scheduling request to my assistant with a note to find a 30-minute slot before Friday."
- **Q4 tasks:** State the explicit reason for elimination. "Removed because it has no deadline, no goal connection, and has been on my list for 6 weeks without any consequence for ignoring it." This documentation prevents the item from reappearing on the next list through guilt-based carry-forward.
- For the "Minimize" sub-category (when delegation is not possible for Q3 items): assign a batch window -- a single recurring time block (e.g., "Friday 4:00-4:30 PM admin batch") where all such tasks are handled together.

### Step 6: Produce the Action Sequence for Today

Close the matrix with a sequenced action list for the immediate work session or day. This is the bridge between sorting and doing.

- List all Q1 tasks in priority order with time estimates. Flag any Q1 tasks that require prep (documents, access credentials, prior conversations) so those prerequisites can be addressed immediately.
- Include Q2 scheduling actions as concrete to-dos: "Open calendar and block Tuesday 10:00-11:30 AM for strategy document draft."
- Include Q3 handoff actions: "Send email to Marcus delegating vendor quote compilation."
- Include Q4 clearance actions: "Delete 'organize archive folders' from all lists and note pads."
- Estimate total time for Q1 tasks. If Q1 work alone exceeds the available hours in the day, surface this conflict immediately. The user must either negotiate a deadline, drop a Q1 task to Q2, or work a longer session -- one of these three choices, made explicitly.
- Add one sentence of context on what to do if a new task arrives mid-day: apply the same two-question test and insert it into the appropriate quadrant before acting on it.

### Step 7: Optional -- Flag Systemic Patterns

After producing the matrix, briefly note any structural observations that a single session cannot fix.

- If Q1 is chronically overloaded: this may indicate insufficient lead-time on projects, a culture of last-minute requests, or under-delegation upstream. One session of sorting will not fix this -- the pattern itself needs to be addressed.
- If Q4 is large: the user may be a habitual over-committer or is operating from an outdated task list. Recommend a regular weekly review (15-20 minutes, Sunday or Monday morning) to prevent Q4 buildup.
- If Q2 is always empty: the user needs protected time -- a recurring calendar block labeled "Strategic Work" or "Deep Work" that treats Q2 time as a non-negotiable appointment.
- If Q3 has no available delegates: the user may need to escalate a resourcing issue, renegotiate scope, or accept that some tasks will be done poorly (Minimize strategy).
- Keep this section brief -- one to three sentences. The matrix is a sorting tool, not a coaching program.

---

## Output Format

```
## Eisenhower Matrix: [Context or Date -- e.g., "Weekly Review -- [Date]" or "[User's Name] Task Triage"]

### Sorting Criteria Applied
- **Urgent threshold:** [Specific criteria -- e.g., "Deadline within 48 hours OR someone is actively waiting and delay causes a measurable consequence"]
- **Important threshold:** [Specific criteria -- e.g., "Directly advances Goal 1 [name it], Goal 2 [name it], or Goal 3 [name it]; OR produces irreversible consequences if not done; OR requires this person's specific judgment"]

---

### Q1: Do First -- Urgent + Important
*Action: Handle today. Sequence by consequence severity.*

| Priority | Task | Deadline | Why Urgent | Why Important | Next Action (Specific) | Est. Time |
|----------|------|----------|------------|---------------|------------------------|-----------|
| 1 | [task label] | [date/time] | [specific consequence of delay] | [which goal or irreversible outcome] | [exact physical next step] | [XX min] |
| 2 | [task label] | [date/time] | [specific consequence of delay] | [which goal or irreversible outcome] | [exact physical next step] | [XX min] |

---

### Q2: Schedule -- Not Urgent + Important
*Action: Block calendar time. Unscheduled Q2 tasks will always be displaced by Q1 urgency.*

| # | Task | Goal or Outcome It Serves | Scheduled Date | Start Time | Duration |
|---|------|--------------------------|----------------|------------|----------|
| 1 | [task label] | [goal name or outcome] | [date] | [time] | [duration] |
| 2 | [task label] | [goal name or outcome] | [date] | [time] | [duration] |

---

### Q3: Delegate (or Minimize if delegation unavailable) -- Urgent + Not Important
*Action: Hand off to a specific person or service. If no delegate exists, batch and minimize.*

| # | Task | Deadline | Delegate To | Handoff Message (One Sentence) | Fallback If Undelegatable |
|---|------|----------|-------------|-------------------------------|--------------------------|
| 1 | [task label] | [date] | [person/service/tool] | [what to say/write] | [batch window or minimize plan] |

---

### Q4: Eliminate -- Not Urgent + Not Important
*Action: Remove from all lists. Document why to prevent guilt-based return.*

| # | Task | Reason for Elimination | Time Recovered |
|---|------|------------------------|----------------|
| 1 | [task label] | [specific reason -- no goal connection, no deadline, no consequence for deletion] | [est. hours/week] |

---

### Validation Summary
| Check | Result | Status |
|-------|--------|--------|
| Q1 item count | [n] -- target: 3-5 maximum | [OK / OVERLOADED -- re-examine] |
| Q2 item count | [n] -- target: 2+ items | [OK / EMPTY -- flag reactive pattern] |
| Q3 delegation feasibility | [n delegatable / n to minimize] | [OK / NO DELEGATES -- all minimized] |
| Q4 time recovered | Est. [X] hours/week | [noted] |
| Total Q1 time estimate | [X hours] | [OK -- fits today / EXCEEDS DAY -- conflict flagged] |

---

### Systemic Observations
[Optional: 1-3 sentences only. Note any structural pattern (chronic Q1 overload, empty Q2, no delegation capacity) without extending into coaching commentary.]

---

### Today's Action Sequence
Execute in this order:

1. **[Q1 Task 1]** -- [specific next action] -- [time estimate]
2. **[Q1 Task 2]** -- [specific next action] -- [time estimate]
3. **[Q1 Task 3, if applicable]** -- [specific next action] -- [time estimate]
4. **Schedule Q2 items** -- Open calendar and block: [list specific dates/times for each Q2 task]
5. **Send Q3 delegation messages** -- [name each handoff and recipient]
6. **Clear Q4 items** -- Delete from all lists: [name each item]

*If a new task arrives today: ask "Urgent? Important?" and insert into the correct quadrant before acting.*
```

---

## Rules

1. **Never describe the framework -- populate it.** The output must contain the user's actual tasks in specific cells. A description of what the quadrants mean, without the user's tasks sorted into them, is not an acceptable output from this skill.

2. **Define urgency and importance numerically or behaviorally before sorting.** Vague definitions produce inconsistent sorts. "Urgent means a negative consequence activates within 48 hours" is valid. "Urgent means it feels pressing" is not. The criteria must be stated explicitly in the output under Sorting Criteria Applied.

3. **Q1 must not exceed 5 items without a documented conflict.** If initial sorting puts 6 or more items in Q1, apply the consequence test to every item before presenting the matrix. A Q1 with 8 items is almost always a sign that urgent and important are being conflated. Document which items were reclassified and why.

4. **Q2 must never be empty without an explicit flag.** An empty Q2 is a diagnostic warning sign indicating the user is operating in a fully reactive mode with no scheduled strategic work. Surface this observation directly and probe for at least one item that belongs in Q2 before finalizing the matrix.

5. **Every Q1 task must have a sequenced, specific next action -- not a goal description.** "Finish the proposal" is a goal. "Open the proposal draft in Google Docs, complete Section 4 pricing table using the rates from the vendor email of [date], and send to client by 3 PM today" is a next action. Q1 tasks without this specificity create an incomplete matrix.

6. **Every Q2 task must have a named calendar date and time block.** "Sometime next week" is not a scheduled date. Q2 items without a specific date and time are aspirational, not planned, and will be repeatedly displaced by Q1 urgency. If the user cannot provide a date in the session, instruct them to block the time within 30 minutes of finishing the review.

7. **Every Q3 task must name a specific person, role, or automated service.** "Delegate to someone" is not a valid Q3 entry. If no specific delegate can be identified, the task must be reclassified -- to Q1 if it is both urgent and unavoidable, to the Minimize sub-category with a specific batch window, or to Q4 if it can be dropped entirely. Leaving an undelegatable task in Q3 creates false confidence.

8. **Every Q4 task must state a specific reason for elimination.** Without a documented rationale, eliminated tasks return to future lists through guilt, habit, or external pressure. One sentence of reasoning ("This task has no deadline, serves no current goal, and has sat on the list for four weeks with no consequence for ignoring it") prevents re-entry.

9. **Do not add motivational language, encouragement, or coaching commentary to the matrix itself.** The matrix is a sorting and action-planning tool. Phrases like "Great news -- your Q2 is healthy!" or "Don't worry, you've got this!" dilute the precision of the output. Systemic observations belong in the brief Systemic Observations field only, stated neutrally.

10. **When goals are undefined, stop and elicit them before sorting.** The importance dimension of the matrix is analytically meaningless without an anchor. If the user has not stated 2-3 current goals or priorities, ask for them explicitly before producing any quadrant. "I'll need to know your 2-3 current goals to sort by importance -- otherwise I'm guessing. What are you most trying to accomplish in the next 30-90 days?" is an appropriate prompt.

11. **Compound items (projects posing as tasks) must be decomposed before placement.** "Launch new product" cannot be sorted as a single task -- it contains dozens of subtasks with different urgency and importance profiles. Identify any compound items and ask the user to name the single next physical action for that project, then sort that action.

12. **Do not sort tasks the user did not mention.** The matrix reflects the user's stated task inventory, not hypothetical tasks they should consider. The only exception is the Step 1 probing questions, which invite the user to expand their list -- but only tasks they confirm belong in the matrix.

---

## Edge Cases

**The user provides fewer than 5 tasks:**
Build the matrix with what is available but explicitly note that the small sample is unlikely to reveal Q2 strategic items or expose the full Q4 backlog. Probe directly: "Are there tasks you have been avoiding or have not written down? What would a colleague expect you to be working on that you have not listed?" Often, the most important tasks are the ones the user left off the list precisely because they feel overwhelming or ambiguous. Populate the matrix with confirmed tasks and leave unfilled quadrants visibly empty as a diagnostic prompt.

**Everything appears to land in Q1 (the "everything is on fire" scenario):**
This is the most common matrix failure mode and almost always reflects conflation of urgency-feeling with actual importance. Apply three sequential challenges: (1) The one-week test -- "If you could not work on this for seven days, what is the specific, concrete consequence?" Anything where the answer is "nothing catastrophic" moves out of Q1. (2) The substitution test -- "Could someone else handle this at 80% quality?" Yes answers move to Q3. (3) The 48-hour rule -- re-apply the urgency threshold strictly. Items that do not have a consequence activating within 48 hours are not urgent by definition, regardless of how they feel. A Q1 with 10 items after all three tests is a signal of a systemic workload problem, not a sorting problem -- note this in Systemic Observations.

**The user is a solo worker, freelancer, or student with no delegation options:**
Do not omit Q3 -- relabel it "Minimize" and apply a specific protocol: (1) Identify the minimum acceptable quality for each Q3 task. (2) Batch all Q3/Minimize tasks into a single recurring weekly time block (e.g., 30-45 minutes on Friday afternoon). (3) Time-box execution -- set a timer, do each task at minimum acceptable quality, stop when the timer ends. This prevents Q3 tasks from expanding to fill available time. Note in the Q3 cell: "No delegate available -- batched into [day/time] admin block, time-boxed to [X] minutes."

**Multiple Q1 tasks have the same deadline:**
Sequence by consequence severity, not by emotional salience. Ask: "If only one of these gets done today, which one's failure causes the most damage -- financial loss, relationship harm, legal consequence, health impact?" Rank by damage magnitude. If two tasks have identical damage profiles, rank by time required (shortest first to build momentum and clear one item before working on the second). Identify whether any can be partially completed (e.g., send a preliminary version or a status update to meet the deadline) rather than requiring 100% completion.

**The user's goals are undefined or contradictory:**
Stop the sort at Step 2. Do not proceed with importance assessment using invented goals. Use the following prompt sequence: "To sort by importance, I need to know what you are most trying to accomplish right now. In the next 30-90 days, what are 2-3 outcomes that would make this period a success?" If the user responds with vague answers ("be more productive," "do a good job"), push for specificity: "What does 'good job' look like in measurable terms -- a specific deliverable, a number, a relationship outcome?" Only proceed once the importance anchor is established.

**The user is sorting tasks across multiple life domains (work, health, family, personal projects):**
The urgency and importance thresholds may differ by domain. A health task (medical appointment for a concerning symptom) operates on a different urgency scale than a work task (quarterly report). Do not force a single threshold across all domains. Instead, apply domain-appropriate criteria: for health tasks, urgency means "consequences worsen without action within days or weeks" and importance means "affects functional capacity or longevity." Note which domain each task belongs to in the Q1 and Q2 tables so the user can see if they are systematically neglecting one domain.

**The user wants to sort a backlog of 30+ tasks:**
Do not process 30+ tasks in a single matrix pass without grouping first. Ask the user to quickly identify any tasks that are obviously Q4 (no deadline, no goal, would not notice if they disappeared) and remove them before sorting. Then process remaining tasks in batches of 8-10, flagging any that need clarification. For very large backlogs, consider a two-pass approach: pass one sorts into quadrants at a coarse level; pass two assigns specific next actions only to Q1 and Q2 items. Q3 and Q4 at this scale may need only a bulk batch window and a bulk delete, respectively.

**A task keeps moving between quadrants during the sort:**
This usually means the task is underspecified (it is actually a project) or the urgency and importance criteria are not clear enough. Apply two fixes: (1) Decompose the task into its next physical action and sort that action instead. (2) Ask one direct question about the boundary case -- "Does a consequence activate within 48 hours if this is not started?" (urgency) or "Does this directly advance one of your three stated goals?" (importance). Force a binary yes/no on each question. If the answer is genuinely "I don't know," that itself is the answer -- insufficient information means the task cannot be Q1. Default to Q2 with a note to clarify the deadline or goal connection before the scheduled date.

---

## Example

**Input:** "I'm a product manager at a mid-size SaaS company. Here are my tasks for the week: finalize the product roadmap for the board presentation on Thursday, respond to a bug report from our enterprise client Acme (they flagged it this morning and they're our biggest account), review three job applicants' resumes for the open PM role (hiring manager wants feedback by end of week), write the product spec for the Q3 authentication feature, prepare my monthly 1-on-1 agenda with my manager (meeting is tomorrow), set up my new laptop, renew my professional association membership before it auto-renews at a higher rate in 10 days, and skim the SaaS metrics benchmarking report someone in Slack shared."

---

**Output:**

## Eisenhower Matrix: Product Manager Weekly Triage -- [Current Week]

### Sorting Criteria Applied
- **Urgent threshold:** Consequence activates within 48 hours OR a key stakeholder (client, hiring manager, direct manager) is actively waiting
- **Important threshold:** Directly advances Goal 1 (board-level product alignment), Goal 2 (team quality and hiring), or Goal 3 (enterprise client retention); OR produces irreversible or high-cost consequences if not done; OR requires this PM's specific judgment

---

### Q1: Do First -- Urgent + Important
*Action: Handle today. Sequenced by consequence severity.*

| Priority | Task | Deadline | Why Urgent | Why Important | Next Action (Specific) | Est. Time |
|----------|------|----------|------------|---------------|------------------------|-----------|
| 1 | Respond to Acme bug report | Today (client flagged this morning) | Largest enterprise account; SaaS churn risk activates within hours of unacknowledged escalations | Enterprise client retention is a direct business goal; only this PM can communicate product response | Send acknowledgment to Acme contact now; pull bug ticket, assess severity, set engineering triage within 2 hours; send resolution timeline by EOD | 45 min |
| 2 | Finalize product roadmap for board | Thursday (2 days) | Hard board presentation deadline; stakeholders need pre-read 24 hours prior = Wednesday | Core strategic deliverable; reflects product direction and PM credibility at executive level | Open roadmap deck, complete Q3/Q4 initiative table, add resource dependency column, send draft to VP for review by 5 PM today | 2.5 hrs |
| 3 | Prepare 1-on-1 agenda with manager | Tomorrow morning | Manager meeting is tomorrow; agenda sent same-day or no-agenda is a professional norm violation | Manager alignment supports role performance and surfaces blockers for board prep and hiring | Draft 5-item agenda: board prep status, Acme escalation update, PM hire progress, Q3 spec timeline, one blocker to surface -- send tonight | 20 min |

---

### Q2: Schedule -- Not Urgent + Important
*Action: Block calendar time now. These will be displaced by Q1 pressure if not scheduled.*

| # | Task | Goal or Outcome It Serves | Scheduled Date | Start Time | Duration |
|---|------|--------------------------|----------------|------------|----------|
| 1 | Write Q3 authentication feature spec | Goal 3 (product delivery quality); only this PM can author; no external deadline this week but Q3 kick-off is 3 weeks away | Wednesday | 10:00 AM | 2 hours |
| 2 | Review three PM applicant resumes | Goal 2 (team quality); hiring manager needs feedback by end of week | Thursday | 4:00 PM | 1 hour |

---

### Q3: Minimize -- Urgent + Not Important
*No delegation available noted -- applying Minimize protocol with batch window.*

| # | Task | Deadline | Delegate To | Handoff or Minimize Plan | Batch Window |
|---|------|----------|-------------|--------------------------|--------------|
| 1 | Set up new laptop | This week (needed for board presentation Thursday) | IT support can handle initial config | Submit IT setup request immediately; they handle OS config, VPN, and app installs -- PM only needs to provide credentials at end | Submit IT ticket today (5 min); final setup session Friday 9:00-9:30 AM |
| 2 | Renew professional association membership | 10 days (before auto-renewal rate hike) | Automated -- can be self-handled in under 5 minutes | Not urgent enough for this week given board prep; schedule as a specific to-do | Friday 4:45 PM (5-minute admin task in end-of-week batch) |

---

### Q4: Eliminate -- Not Urgent + Not Important
*Action: Remove from all lists. Reason documented to prevent guilt-based return.*

| # | Task | Reason for Elimination | Time Recovered |
|---|------|------------------------|----------------|
| 1 | Skim SaaS metrics benchmarking report | No deadline, no goal connection this week, no one is waiting, low-value passive reading -- move to "Read Later" folder and review during a Q2 learning block next month | ~45 min this week |

---

### Validation Summary
| Check | Result | Status |
|-------|--------|--------|
| Q1 item count | 3 items | OK -- within 3-5 target |
| Q2 item count | 2 items | OK -- strategic work scheduled |
| Q3 delegation feasibility | 1 partially delegatable (laptop to IT), 1 minimized (membership renewal) | OK -- batch window assigned |
| Q4 time recovered | Est. 45 min this week | Noted |
| Total Q1 time estimate | ~3 hrs 35 min | OK -- fits within workday; prioritize Acme response first thing |

---

### Systemic Observations
The board presentation falling into Q1 with only 48 hours remaining suggests the roadmap finalization was a Q2 item earlier this week that drifted into Q1. In future planning cycles, finalize board materials 5+ days in advance to prevent this. The PM hire review task is a recurring Q2 item -- if hiring is ongoing, consider a recurring weekly 1-hour block for candidate review to prevent accumulation.

---

### Today's Action Sequence
Execute in this order:

1. **Respond to Acme bug report** -- Send acknowledgment email to Acme contact immediately, pull bug ticket from issue tracker, set engineering triage for within 2 hours, send resolution timeline by EOD -- *45 minutes*
2. **Work on board roadmap** -- Open deck, complete Q3/Q4 initiative table and resource dependency column, send to VP for review by 5 PM -- *2.5 hours*
3. **Submit IT laptop setup ticket** -- 5 minutes right now; removes laptop from mental load immediately -- *5 minutes*
4. **Draft 1-on-1 agenda** -- 5 items listed above, send to manager tonight -- *20 minutes*
5. **Schedule Q2 blocks** -- Open calendar: block Wednesday 10:00 AM-12:00 PM for auth feature spec; block Thursday 4:00-5:00 PM for resume review -- *5 minutes*
6. **Clear Q4 items** -- Move SaaS benchmarking report to "Read Later" folder; delete from task list and Slack notifications -- *2 minutes*

*If a new task arrives today: Ask "Does a consequence activate within 48 hours?" (urgency) and "Does this advance client retention, board prep, or team quality?" (importance). Insert into the correct quadrant before acting on it.*
