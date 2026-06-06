---
name: weekly-review
description: |
  Produces a complete weekly review session guide with a step-by-step checklist, time estimates per step, review questions, and output artifacts. Delivers the actual review protocol, not advice about doing reviews.
  Use when the user asks about weekly reviews, planning their week, reflecting on what was accomplished, or building a regular review practice.
  Do NOT use for daily planning (use daily-planning), quarterly or annual planning (use quarterly-planning or annual-review), or team retrospectives (use retrospective-facilitator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management planning checklist"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Weekly Review

## When to Use

**Use this skill when:**
- The user explicitly asks to do a weekly review, set up a weekly review practice, or improve their existing review process
- The user says they want to "plan my week," "reflect on last week," or "get my system back on track"
- The user describes symptoms of a broken productivity system: tasks piling up, forgetting commitments, feeling reactive instead of proactive, or waking up Monday unsure what matters
- The user mentions a GTD (Getting Things Done) workflow and wants to run the Weekly Review step David Allen prescribes as the system's backbone
- The user says their Todoist, Notion, Asana, Things, OmniFocus, or paper planner "isn't working" -- this almost always means reviews have lapsed, not that the tool is wrong
- The user asks about maintaining alignment between daily tasks and long-term goals on a recurring basis
- The user wants to build a weekly ritual around a specific time slot (Sunday evenings, Friday afternoons, etc.)
- The user is starting a new job, semester, or project phase and wants to install a planning habit before the chaos hits

**Do NOT use when:**
- The user wants a plan for today only -- use `daily-planning` instead, which handles time-blocking a single day, prioritizing today's tasks, and the morning/shutdown ritual
- The user wants quarterly or annual planning, goal-setting, or an OKR review -- use `quarterly-planning` or `annual-review`, which operate at a higher altitude and involve longer time horizons than a weekly review can address
- The user needs a facilitated team retrospective (Sprint retro, post-mortem, or "what went wrong this project") -- use `retrospective-facilitator`, which handles group dynamics, anonymous input, and retrospective formats like Start-Stop-Continue
- The user wants to build a task capture system from scratch with no existing workflow -- use `task-capture-system` first to establish inbox discipline, then return here to install the review on top of it
- The user needs a time-blocked weekly calendar schedule -- use `time-blocking`, which handles assigning specific hours to specific work rather than reviewing and planning at a higher level
- The user is asking about project management methodology for a team (Scrum, Kanban cadences) -- this skill is for individual knowledge workers, not team workflows

---

## Process

### Step 1: Gather Review Context (ask before producing output)

Collect the following from the user before generating anything. If the user has already provided some of this in their message, extract it rather than asking again.

- **Productivity system in use:** GTD (paper or digital), Todoist, Things 3, OmniFocus, Notion, Obsidian, physical planner, a combination, or none. This determines Phase 1 and Phase 2 specifics -- the checklist items differ meaningfully between a paper planner user and someone on OmniFocus.
- **Calendar tool:** Google Calendar, Outlook/Exchange, Apple Calendar, or paper. The calendar review steps reference the actual tool.
- **Preferred review day and time:** The research-backed best options are Friday 3:00-5:00 PM (closes the work week cleanly, keeps Monday from being reactive) and Sunday 5:00-8:00 PM (longer mental runway before Monday). Midweek reviews are less effective because both look-back and look-forward windows are asymmetric.
- **Available time:** Minimum viable review is 30 minutes (covers only Phases 2 and 3 at a reduced depth). Full review is 60-90 minutes. Power review for experienced practitioners is 45 minutes with all phases.
- **Areas of life to track:** Common areas are Work/Career, Personal Projects, Health and Fitness, Finance, Relationships/Social, Learning, and Household. Limit to 5-7 areas maximum -- more than 7 creates review fatigue.
- **Current review habit status:** First time ever, lapsed for 1-3 weeks, lapsed for a month or more, or running inconsistently. This determines whether to apply the "starter," "recovery," or "maintenance" variant of the protocol.
- **Known friction points:** If they have tried weekly reviews before and stopped, ask what broke down. The three most common answers are (1) it took too long, (2) they skipped one week and never restarted, (3) the list felt pointless because nothing changed afterward.

### Step 2: Select the Correct Protocol Variant

Based on the context gathered, choose which variant to build:

- **Starter Protocol (weeks 1-3, never done a review before):** 30 minutes, Phases 2-3 only, simplified checklist with only 5-8 items. The goal is to install the habit, not to run a complete system. Add one new habit element per week.
- **Recovery Protocol (lapsed 2+ weeks):** Standard 90-minute review with an added 15-minute "archaeology" phase at the front that processes stale tasks, archives anything older than 60 days that has never been touched, and resets project statuses.
- **Maintenance Protocol (running consistently for 4+ weeks):** The full four-phase review. Include a metrics tracking table and a 5-minute "continuous improvement" coda at the end where the user rates the review process itself.
- **Compressed Protocol (time-constrained practitioner, 30-45 minutes):** All four phases but with strict timers -- 5 minutes for Phase 1, 10 for Phase 2, 15 for Phase 3, 5 for Phase 4. Ruthlessly skip anything that can wait until the next full review.

### Step 3: Build Phase 1 -- Collect and Clear

This phase is about achieving a "clear mind, clear system" state before any review or planning. Every item that lives outside the system introduces cognitive drag during Phases 2 and 3.

- **Physical inbox:** Papers, mail, receipts, business cards, sticky notes, notebooks with uncaptured ideas. Process each: file, trash, or convert to a task/note in the system.
- **Digital inboxes:** Email to zero means every item is either replied to, converted to a task with a due date, filed to a reference folder, or deleted. Do not use the inbox as a to-do list. For Outlook and Gmail users: use a "Action Needed" label/folder as a holding zone, not the inbox itself.
- **Tool-specific inboxes:** Todoist Inbox (the unprocessed queue), Things 3 Inbox, OmniFocus Inbox, Notion "Capture" database. Every item needs a project, an area, and a next-action date or it should be deleted.
- **Brain dump:** Set a 3-minute timer. Write every open loop -- worries, ideas, promises made, things you meant to do -- into the inbox. This is not planning. It is capture. Speed over completeness; a second pass in 30 seconds is allowed.
- **Peripheral capture points:** Voice memos (transcribe or delete), screenshots and camera roll (process action items, delete the rest), browser bookmarks added during the week (read, act, or delete), Kindle or podcast highlights (route to learning system or note-taking tool).
- **Target state:** Zero items in every inbox. If achieving true zero is impossible in the allotted time, flag the overflow for a mini-processing session before Wednesday.

### Step 4: Build Phase 2 -- Review the Past Week

This phase looks backward over the past 7 calendar days. Its purpose is to close open loops, extract lessons, and ensure nothing slips through.

- **Calendar scan (past 7 days):** Open every event, meeting, and appointment in the past week. Ask: Did anything from this event create a commitment, follow-up, or new project? If yes, capture it now. Missing follow-ups from meetings is one of the top 5 causes of trust erosion in professional relationships.
- **Completed tasks review:** Look at what was finished. Note at least 3 wins explicitly -- this is not optional. The human brain has a negativity bias; without deliberately noting wins, the week feels worse than it was, which erodes motivation to continue the review habit. Wins can be small: "sent that difficult email," "ran 3 times," "declined a low-value meeting."
- **Incomplete and overdue tasks:** Review every task that was due this week but not completed. For each, make a binary decision: Does this still matter? If yes, reschedule with a new due date and consider whether the original deadline was realistic. If no, delete it without guilt. Do not simply push every overdue task forward -- that creates a growing debt of zombie tasks that psychologically weigh down the system.
- **Waiting For list:** This is one of GTD's most underused lists. It holds items you are expecting from other people -- responses, deliverables, approvals. Walk through every item: Is it overdue? Send a follow-up. Has it arrived and not been removed from the list? Archive it.
- **Project health check:** For every active project, answer two questions: (1) Does it have a clearly defined next action? (2) Has it had any forward movement this week? A project with no next action is stalled. A project with no movement for two consecutive weeks needs a decision: restart, defer, or kill.
- **Area-of-focus review:** For each life area the user tracks, spend 60 seconds asking: Am I honoring my commitments here? Is anything slipping that I have not noticed? This is a scan, not a deep dive -- red-flag items get added to the task list; everything else continues.
- **Meeting notes:** Any notes from the week's meetings, calls, or conversations that have not been processed for action items. Convert action items to tasks, archive the notes.

### Step 5: Build Phase 3 -- Plan the Next Week

This phase looks forward 7 days. It answers one master question: Given my available time and energy, what are the most important things to accomplish next week?

- **Calendar scan (next 7 days):** Preview every event, appointment, deadline, and commitment. Flag anything that requires preparation -- a presentation, a difficult conversation, a medical appointment, a trip. Preparation tasks must be added to the task system now, not on the morning they are needed.
- **Identify the week's Most Important Tasks (MITs):** Choose 3-5 outcomes that, if completed, would make next week a success regardless of everything else. MITs are outcome-level, not task-level: "Finish the client proposal first draft" is an MIT; "write section 3 of client proposal" is a task within it. Keep MITs to 5 maximum -- more than 5 is not prioritization, it is a wish list.
- **Assign next actions to every active project:** Every active project must have exactly one clearly defined "next physical action" -- the smallest possible next step, specific enough that a person who knows nothing about the project could do it. "Work on website" is not a next action. "Draft the About page copy in Google Docs" is.
- **Goal alignment check:** Pull up monthly and quarterly goals (or the user's equivalent). Do this week's MITs contribute to at least 2 of those goals? If next week's plan has zero connection to longer-horizon goals, that is a signal to reassess -- either the goals are wrong, or the week is being consumed by urgent-but-not-important work.
- **Capacity check -- the Hours Test:** Estimate total hours of committed work next week: scheduled meetings plus estimated task hours. Compare to actual available working hours (typically 35-45 for full-time knowledge workers, adjusted for time already blocked for non-discretionary work). If committed hours exceed 70% of available hours, remove tasks -- do not expand the available hours. The 70% threshold preserves buffer for reactive work, which is always underestimated.
- **Energy matching:** Identify which day(s) of next week are highest-energy and lowest-energy based on the calendar. Schedule deep work (creative projects, writing, complex analysis) in high-energy slots. Schedule administrative tasks, meetings, and errands in low-energy slots. Note this during planning, not Monday morning when it is too late.
- **Identify conflicts and risks:** Any two important tasks competing for the same time slot? Any dependency that could block a task (waiting on someone else)? Any external event that might derail the week? Name each risk explicitly -- named risks get mitigated; unnamed risks become surprises.

### Step 6: Build Phase 4 -- Reflect and Reset

This phase creates the psychological and environmental closure that distinguishes a complete review from a to-do list maintenance session.

- **Three reflection questions:** These must be specific and answerable in 2-3 sentences each, not philosophical or open-ended. Recommended defaults: (1) What went well this week that I should repeat? (2) What did I commit to that I should not have, and how do I prevent that next week? (3) What one constraint -- a habit, environment, or decision -- would most improve my output next week?
- **Week rating (1-10):** Rate the overall week on a 1-10 scale. Track this number over time. A consistent score below 6 indicates a systemic problem -- not a bad week. A score of 8+ for three consecutive weeks usually means the system is working. A sudden drop after a streak of high scores signals a new stressor worth investigating.
- **One behavioral experiment:** Identify one specific, small change to try next week. Not a resolution -- an experiment. "I will not check email before 9 AM" is an experiment. "I will be better at email" is a resolution. Experiments are binary: did you try it or not? Review results the following Sunday.
- **Environmental reset:** Close or file all open documents. Archive all browser tabs (tools like OneTab consolidate tabs into a single restorable list). Clear the physical desk surface. Close task management apps and reopen them fresh. This physical reset signals to the brain that the week is closed -- it is the shutdown ritual equivalent for the planning system.
- **Write the "theme" for next week:** One sentence that captures the week's focus or intention. Not a goal -- a lens. "Week of deep focus on the project proposal." "Week of reconnecting with the team." "Recovery week -- protect energy." This sentence can be written at the top of the next week's daily planner page or pinned in the task system.

### Step 7: Calibrate and Close

- **Record metrics:** Log the review date, duration, week rating, number of MITs completed (from last week), and any notable pattern.
- **Schedule next review:** Confirm the recurring calendar event for next week's review. If this is the first review, set a 4-week trial with a calendar block now before closing.
- **Signal completion:** The review is done when the user can answer yes to: (1) Are all inboxes at or near zero? (2) Does every active project have a next action? (3) Do I know what the 3 most important outcomes of next week are? If any answer is no, spend 5 more minutes before closing.
- **Habit stacking note:** For users installing this as a new habit, recommend stacking the weekly review onto an existing anchor: after dinner on Sunday, before the first coffee on Friday, immediately after a recurring meeting. The specific anchor matters less than its reliability.

---

## Output Format

Produce this complete protocol, customized with the user's specific tools, day, time, and areas of focus. Fill in every bracketed field. Do not leave template placeholders.

```
## Weekly Review Protocol

### Identity
- **Owner:** [name or "you"]
- **Variant:** [Starter / Recovery / Maintenance / Compressed]
- **Review Day:** [day of week]
- **Start Time:** [time + timezone]
- **Target Duration:** [minutes]
- **Location:** [physical location -- home desk, office, coffee shop]
- **Trigger:** [calendar event name, alarm label, or habit anchor]
- **Tools open during review:** [list all apps and tools needed]

---

### Pre-Review Setup (5 min, before the timer starts)
- [ ] Phone on Do Not Disturb
- [ ] Beverage in hand, environment set
- [ ] Open [task management tool], [calendar tool], and [notes tool]
- [ ] Start timer for total session duration
- [ ] Open Review Metrics log (see end of document)

---

### Phase 1: Collect and Clear
**Target time:** [X] minutes | **Timer:** Start when you sit down

- [ ] **Physical inbox** -- process all papers, mail, sticky notes, business cards
  - File: ___
  - Trash: ___
  - Capture to [task tool]: ___
- [ ] **Email inbox** ([Gmail / Outlook / other]) -- reach zero
  - Each item: Reply now | Create task in [tool] | Archive | Delete
  - Inbox count at start: ___ | Count at end: ___
- [ ] **[Messaging tool] inbox** ([Slack / Teams / iMessage]) -- clear pending items
- [ ] **[Task tool] inbox** -- every item must have a project, area, and status
  - Items in inbox at start: ___ | Items processed: ___
- [ ] **Brain dump** -- set a 3-minute timer, capture every open loop into [task tool] inbox
  - Open loops captured: ___
- [ ] **Peripheral capture points**
  - [ ] Voice memos -- transcribe or delete
  - [ ] Screenshots / camera roll -- process or delete
  - [ ] Browser bookmarks added this week -- read, task, or delete
  - [ ] [Other capture point, e.g., Kindle highlights, Slack saved messages]
- [ ] **Phase 1 complete?** All inboxes at zero? [ Yes / Overflow flagged for Wednesday ]

---

### Phase 2: Review the Past Week
**Target time:** [X] minutes | **Week reviewed:** [date range, e.g., Mon Jan 6 -- Sun Jan 12]

#### Calendar Scan (past 7 days)
- [ ] Walk through every event in [calendar tool] from [Monday date] to [Sunday date]
  - Follow-up needed from event: [event name] --> Action: ___ | Due: ___
  - Follow-up needed from event: [event name] --> Action: ___ | Due: ___
  - No follow-ups needed: [ ]

#### Wins (minimum 3 -- do not skip this)
- Win 1: ___
- Win 2: ___
- Win 3: ___
- Bonus win: ___

#### Incomplete and Overdue Tasks
- [ ] Open overdue view in [task tool]
  - Total overdue tasks: ___
  - For each: **Reschedule** (still matters) | **Delete** (no longer relevant) | **Delegate** (name: ___)
  - Tasks rescheduled: ___ | Tasks deleted: ___ | Tasks delegated: ___

#### Waiting For List
- [ ] Review [Waiting For label/list/tag] in [task tool]
  - Overdue item: ___ --> Follow-up action: ___ | Due: ___
  - Overdue item: ___ --> Follow-up action: ___ | Due: ___
  - Items removed (received/resolved): ___

#### Project Health Check
- [ ] For each active project: Next action assigned? [ Y / N ] | Movement this week? [ Y / N ]

| Project | Next Action | Movement This Week | Status |
|---------|-------------|-------------------|--------|
| ___ | ___ | Y / N | Active / Stalled / Kill? |
| ___ | ___ | Y / N | Active / Stalled / Kill? |
| ___ | ___ | Y / N | Active / Stalled / Kill? |

- Projects with no movement for 2+ weeks: ___ --> Decision: Restart / Defer / Kill

#### Area-of-Focus Review
- [ ] [Area 1, e.g., Work/Career] -- anything slipping? [ Y / N ] --> Flag: ___
- [ ] [Area 2, e.g., Personal Projects] -- anything slipping? [ Y / N ] --> Flag: ___
- [ ] [Area 3, e.g., Health/Fitness] -- anything slipping? [ Y / N ] --> Flag: ___
- [ ] [Area 4, e.g., Finance] -- anything slipping? [ Y / N ] --> Flag: ___
- [ ] [Area 5, e.g., Relationships] -- anything slipping? [ Y / N ] --> Flag: ___

#### Meeting Notes Processing
- [ ] All meeting notes from this week reviewed for action items? [ Yes / None this week ]
  - Action extracted: ___ | Added to [task tool]? [ Y ]

---

### Phase 3: Plan the Next Week
**Target time:** [X] minutes | **Week planned:** [date range, e.g., Mon Jan 13 -- Sun Jan 19]

#### Calendar Preview (next 7 days)
- [ ] Walk through every event in [calendar tool] from [Monday date] to [Sunday date]
  - Event requiring preparation: [event name] --> Prep task: ___ | Must be done by: ___
  - Event requiring preparation: [event name] --> Prep task: ___ | Must be done by: ___
  - All prep tasks added to [task tool]? [ Y ]

#### Most Important Tasks (MITs) for Next Week
Maximum 5. These are outcome-level, not individual tasks.
1. ___
2. ___
3. ___
4. (optional) ___
5. (optional) ___

#### Project Next Actions Audit
- [ ] Every active project has exactly one clearly defined next action? [ Yes / No -- see Project Health table above ]

#### Goal Alignment Check
- [ ] Monthly goal: ___ | MITs contributing to this: ___
- [ ] Quarterly goal: ___ | MITs contributing to this: ___
- [ ] At least 2 MITs connect to a longer-term goal? [ Yes / No -- if No, adjust MITs ]

#### Capacity Check
- Total available working hours next week: ___ hrs
  - (Standard work week 40 hrs, minus scheduled meetings ___ hrs, minus non-discretionary blocks ___ hrs)
- Total estimated task hours: ___ hrs
- 70% capacity ceiling: ___ hrs  ← Do not exceed this
- Status: [ Under capacity / At limit / OVER -- remove tasks now ]
  - Tasks removed to reach capacity: ___

#### Energy Matching
- Highest-energy days next week: ___
  - Deep work scheduled for these days: ___
- Lowest-energy days next week: ___
  - Administrative tasks and meetings already scheduled here: ___

#### Risks and Dependencies
- Risk 1: ___ --> Mitigation: ___
- Risk 2: ___ --> Mitigation: ___
- Blocking dependencies (waiting on someone): ___ --> Follow-up: ___

---

### Phase 4: Reflect and Reset
**Target time:** [X] minutes

#### Reflection Questions
1. What went well this week that I should deliberately repeat next week?
   Answer: ___

2. What did I over-commit to or should have declined -- and how do I prevent the same mistake?
   Answer: ___

3. What one change to my environment, habits, or decisions would most improve next week?
   Answer: ___

#### Week Rating
- **This week's score:** ___/10
- **Trend (last 3 weeks):** ___ / ___ / ___
- **If score is below 6:** What is the root cause? ___

#### Behavioral Experiment for Next Week
- **Experiment:** ___
- **How I'll know if it worked:** ___

#### Next Week's Theme (one sentence)
> ___

#### Environmental Reset
- [ ] All open documents filed or closed
- [ ] Browser tabs consolidated (OneTab or equivalent) or closed
- [ ] Physical desk cleared
- [ ] [Task tool] closed and reopened (fresh view)
- [ ] Review notes saved to [notes location]

---

### Review Completion Check
Answer yes to all three before closing:
- [ ] Are all inboxes at or near zero?
- [ ] Does every active project have a clearly defined next action?
- [ ] Do I know the 3-5 most important outcomes of next week?

**Review officially complete.** Next review: [date + time]

---

### Review Metrics Log
Track every week. Review trends monthly.

| Week # | Date | Duration | Rating | MITs Set | MITs Completed | Overdue Cleared | Experiment Result |
|--------|------|----------|--------|----------|----------------|-----------------|-------------------|
| 1 | | min | /10 | /5 | /5 | | -- |
| 2 | | min | /10 | /5 | /5 | | Y / N / Partial |
| 3 | | min | /10 | /5 | /5 | | Y / N / Partial |
| 4 | | min | /10 | /5 | /5 | | Y / N / Partial |
| 5 | | min | /10 | /5 | /5 | | Y / N / Partial |
| 6 | | min | /10 | /5 | /5 | | Y / N / Partial |

**Monthly pattern check (every 4 weeks):** Average rating: ___ | Average duration: ___ min | MIT completion rate: ___%
```

---

## Rules

1. **Never produce a generic review checklist without customizing it to the user's actual tools.** A Todoist user and an OmniFocus user have meaningfully different inbox structures, label/tag systems, and project views. A paper planner user has no "overdue view." Substitute the real tool name in every checklist item.

2. **Always include the wins step and always require a minimum of 3.** Skipping this step in the name of efficiency is a false economy. Users who do not record wins develop a distorted picture of their productivity and quit the review habit within 4-6 weeks. The negativity bias is real and measurable.

3. **The capacity check must use the 70% ceiling rule, not "do as much as you can."** Committing to 100% of available hours guarantees overflow, which trains the brain that the plan is not real. Committing to 70% creates a buffer that makes the plan credible. If the user pushes back, explain the math: 30% of a 40-hour work week is 12 hours of unplanned reactive work -- which is almost exactly how much knowledge workers actually spend on unplanned requests.

4. **Every active project must have exactly one next action, not zero and not multiple.** Zero next actions means the project is stalled and will generate anxiety. Multiple next actions creates confusion about what to do first and leads to avoidance. The one-next-action-per-project rule from GTD is not a preference -- it is the mechanism that makes the system trustworthy.

5. **Do not allow the review to become a re-planning session for old tasks.** The overdue task review has one purpose: decide (reschedule, delete, or delegate) and move on. The common failure mode is spending 45 minutes re-examining why a task was not done, feeling guilty, and running out of time for Phase 3. Set a strict 30-second-per-task decision rule for the overdue review.

6. **The brain dump must be timed at exactly 3 minutes.** Untimed brain dumps expand indefinitely and are used as an avoidance mechanism. Timed brain dumps create urgency and capture 85-90% of what matters. A second 60-second pass can follow, but it must be separate and also timed.

7. **The reflection questions must be answered with specific text, never left blank.** A weekly review that ends with empty reflection fields is not a complete review -- it is a task list maintenance session. The reflection is where growth happens. If the user says they do not know the answer, require them to write "I don't know yet, but I notice..." and complete the sentence.

8. **Always include a "next review" scheduling step as the very last action.** The number-one reason weekly review habits break down is that users miss one week and then assume the habit is broken. If the next review is already on the calendar before closing this one, the activation energy for the next session is near zero.

9. **Do not include more than 7 areas of focus in Phase 2.** More than 7 areas turns the review into an exhausting audit that takes 90 minutes for Phase 2 alone. If the user tracks more than 7, help them consolidate: "Finance" and "Household Admin" can become "Life Admin." "Health" and "Fitness" can merge. Each area should require no more than 60 seconds of attention during a scan.

10. **The "behavioral experiment" in Phase 4 must be binary and time-bounded.** A good experiment can be evaluated with a yes/no answer the following Sunday. "I will not check email before 9 AM" works. "I will be more disciplined" does not. If the user proposes a vague experiment, help them rewrite it as a specific, observable behavior with a clear evaluation criterion.

---

## Edge Cases

### User Has Never Done a Weekly Review Before

Do not produce the full four-phase protocol for a first-timer. The complete protocol is 55-90 minutes of structured work that requires familiarity with concepts like "Waiting For lists," "next actions," and "inbox zero" to execute efficiently. A first-timer who attempts the full protocol has a high probability of not finishing, feeling overwhelmed, and concluding that weekly reviews "don't work for them."

**Instead:** Produce the Starter Protocol -- a 20-30 minute session covering only: (1) a 3-minute brain dump into a single list, (2) a calendar scan of the past and next 7 days, and (3) identifying 3 priorities for next week. Include a weekly check-in after each session. Expand by adding one new element per week -- in week 2, add the wins step; in week 3, add the project next-action audit. By week 4, the user is ready for the full protocol and has already internalized its components.

### User Skipped 2 or More Weeks

A 2-week lapse means the task system has accumulated stale items, the calendar has events that were never processed, and the user likely has significant guilt about having skipped reviews. The normal Phase 2 duration will be insufficient.

**Instead:** Activate the Recovery Protocol. Add a 15-minute "archaeology phase" at the very front, before Phase 1. In the archaeology phase: archive all tasks older than 60 days that have never been touched (do not review them individually -- bulk archive and move on), mark all overdue tasks as "pending review" so they appear in a single view in Phase 2, and accept that this week's review will take 90 minutes and that is acceptable. Do not attempt to reconstruct the missed weeks. The purpose is to reset the system to a healthy state, not to account for what happened during the gap.

### User Has No Formal Productivity System

Some users have no task manager, no inbox system, and no project list -- they run everything from memory, email, and a physical notepad. The weekly review still applies and may be the single highest-leverage intervention available to them.

**Instead:** The review becomes the system's anchor rather than a maintenance session for an existing system. Phase 1 becomes: gather all sticky notes, open browser tabs, email drafts with action items, and unwritten mental commitments onto a single sheet of paper or a new note. Phase 2 uses the physical notepad as the task record. Phase 3 produces a single handwritten list of next week's 3-5 priorities. Recommend installing one digital tool after the first review -- a simple inbox like Apple Reminders or Google Tasks -- and using it only for capture during the next week. Grow from there.

### User's Reviews Consistently Run Longer Than Planned

If the user reports that their reviews "always take 2+ hours" and they frequently give up before finishing, the problem is almost always one of three things: (1) they are making decisions during Phase 1 that should be deferred to Phase 2 or 3, (2) they are re-examining every overdue task in depth instead of applying the 30-second decision rule, or (3) they have too many active projects and are trying to give each one full attention.

**Instead:** Introduce the phase-timer discipline. Set a visible countdown timer for each phase. When the timer ends, the phase ends, regardless of completion state. Carry forward any unfinished items with a "continue" flag for a weekday processing session. Run this timed structure for 4 consecutive weeks and track actual vs. planned duration in the metrics log. The act of tracking duration alone typically reduces review time by 20-30% through awareness.

### User Reviews Work and Personal Life Separately (Two Reviews per Week)

Some users have been advised or have self-decided to run a "work review" on Friday and a "personal review" on Sunday. In practice, this doubles the time cost, creates redundant calendar scans, and results in one session being skipped or abbreviated when the week gets busy. The separation also prevents identifying conflicts between work and personal commitments.

**Instead:** Combine into one unified review. Use area-of-focus labels within Phase 2 and Phase 3 to segment work and personal items without running separate sessions. The single exception: if the user has a genuine confidentiality reason to keep work projects separate from a shared household planning system (e.g., a shared Notion or paper planner with a partner), run one combined review but export the personal next-week plan to the shared system separately.

### User Wants a Review But Has No Clear Goals to Align To

The Phase 3 goal alignment check assumes the user has monthly or quarterly goals. Many users do not have articulated goals beyond "do my job" and "don't fall apart." If the user has no goals, the alignment check becomes a philosophical tangent that derails the planning session.

**Instead:** Skip the formal goal alignment check for now and replace it with a values alignment check: "Does next week's plan reflect what I actually care about?" This is answerable even without formal goals. Flag to the user after the review that installing a 90-day goal structure (via `quarterly-planning`) would make future reviews more powerful, but do not let the absence of goals prevent completing this review.

### User Is Reviewing During an Unusually Chaotic Week (Travel, Crisis, Launch Week)

Some weeks have no predictable shape: a product launch, a family emergency, an international trip across time zones. Attempting a full weekly review during these weeks creates frustration because the plan will be invalidated almost immediately.

**Instead:** Run the Compressed Protocol (30-45 minutes maximum). Focus only on: (1) clearing inboxes to a manageable level (not necessarily zero), (2) identifying the single most important outcome of the next 7 days, and (3) ensuring that any recurring commitments have been delegated or deferred. Skip the metrics tracking and reflection questions. Note in the metrics log: "Compressed -- [reason]." This preserves the habit without demanding full execution during an impossible week.

---

## Example

**User input:** "I want to set up a weekly review. I've been using Things 3 for tasks and Apple Calendar for scheduling. I can do it Sunday evenings around 6:30 PM. I track work projects, personal side projects, health/fitness, and finance. I've tried doing weekly reviews before but they always fall apart after a few weeks -- I usually run out of time or skip one Sunday and then never get back on track."

**Determined context:**
- Tool: Things 3 (inbox, project list, Someday, Logbook)
- Calendar: Apple Calendar
- Day/time: Sunday 6:30 PM
- Areas: Work, Personal Projects, Health/Fitness, Finance (4 areas -- ideal range)
- Status: Previous attempts lapsed -- use Maintenance Protocol but note the lapse pattern
- Known friction: Time overruns and single-missed-week failure
- Adjustments: Include phase timers explicitly; include "missed one week" recovery instruction; include calendar event setup as first action item

---

## Weekly Review Protocol

### Identity
- **Owner:** You
- **Variant:** Maintenance (with lapse-prevention features active)
- **Review Day:** Sunday
- **Start Time:** 6:30 PM
- **Target Duration:** 60 minutes
- **Location:** Home desk or wherever you use Things 3 on your Mac/iPhone
- **Trigger:** Apple Calendar recurring event titled "Weekly Review -- Sunday" at 6:25 PM with a 5-minute alert; second alert at 6:30 PM titled "Start now"
- **Tools open during review:** Things 3 (Mac), Apple Calendar, Notes app (for brain dump if preferred), browser (one tab only)

**Lapse-prevention rule:** If you miss one Sunday, do a 20-minute compressed review on Monday evening instead. Do not wait for the following Sunday. Missing one week is recoverable; missing two in a row breaks the habit. Add a Monday 7:00 PM calendar event titled "Review Backup -- only if Sunday missed" that auto-declines unless needed.

---

### Pre-Review Setup (5 min, before the clock starts)
- [ ] iPhone on Do Not Disturb (Settings --> Focus --> Do Not Disturb)
- [ ] Open Things 3 on Mac, Apple Calendar on Mac, Notes app
- [ ] Get a drink -- this is 60 minutes, make it comfortable
- [ ] Start a 60-minute countdown timer (Clock app, kitchen timer, or dedicated app like Be Focused)
- [ ] Open Review Metrics log (bottom of this document or a note in Apple Notes titled "Weekly Review Log")

---

### Phase 1: Collect and Clear
**Target time: 12 minutes** | Start timer when you sit down

- [ ] **Physical inbox** -- process all papers on desk, mail, receipts, sticky notes
  - File: ___
  - Trash: ___
  - Capture to Things 3 Inbox: ___
- [ ] **Email inbox** (Mail app or Gmail) -- reach zero
  - Each email: Reply now | Add to Things 3 Inbox | Archive | Delete
  - Inbox count at start: ___ | Count at end: ___
- [ ] **iMessage / Slack / other messaging** -- clear any actionable threads
  - Pending items captured to Things 3: ___
- [ ] **Things 3 Inbox** -- every item must have an Area or Project assigned before leaving this phase
  - Items in Inbox at start: ___ | Items processed: ___
- [ ] **Brain dump** -- 3-minute timer, capture every open loop into Things 3 Inbox
  - Open loops captured: ___
- [ ] **Peripheral capture points**
  - [ ] iPhone voice memos -- transcribe or delete
  - [ ] iPhone screenshots and camera roll -- extract action items, delete screenshots
  - [ ] Safari Reading List or bookmarks added this week -- read now, add to Things, or delete
  - [ ] Any Reminders in Apple Reminders that need to move to Things 3
- [ ] **Phase 1 complete?** Things 3 Inbox at zero? [ Yes / Overflow -- flag for Wednesday processing ]

---

### Phase 2: Review the Past Week
**Target time: 13 minutes** | Week reviewed: [Mon date] -- [Sun date]

**Timer discipline:** When 13 minutes ends, move to Phase 3. Flag any remaining Phase 2 items with the tag "carry-forward" in Things 3 and process them before Wednesday.

#### Calendar Scan (past 7 days)
- [ ] Open Apple Calendar, week view, scroll back to last Monday
  - Follow-up from event: ___ --> Action added to Things 3: ___ | Due: ___
  - Follow-up from event: ___ --> Action added to Things 3: ___ | Due: ___
  - No follow-ups needed: [ ]

#### Wins (minimum 3 -- required before moving forward)
- Win 1: ___
- Win 2: ___
- Win 3: ___
- Bonus: ___

#### Incomplete and Overdue Tasks
- [ ] In Things 3: open the "Today" view and check for anything overdue; also check "Anytime" for stale items
  - Total overdue: ___
  - Decision for each (30 seconds max per task): **Reschedule** | **Delete** | **Delegate**
  - Rescheduled: ___ | Deleted: ___ | Delegated to: ___

#### Waiting For List
- [ ] Open the Things 3 tag "Waiting" (create this tag if it does not exist yet)
  - Overdue item: ___ --> Follow-up: ___ | Due: ___
  - Overdue item: ___ --> Follow-up: ___ | Due: ___
  - Items resolved this week (remove tag): ___

#### Project Health Check
- [ ] Open Things 3 Projects view -- review each active project

| Project | Next Action in Things 3? | Movement This Week? | Status |
|---------|--------------------------|---------------------|--------|
| ___ | Y / N | Y / N | Active / Stalled / Kill? |
| ___ | Y / N | Y / N | Active / Stalled / Kill? |
| ___ | Y / N | Y / N | Active / Stalled / Kill? |
| ___ | Y / N | Y / N | Active / Stalled / Kill? |
| ___ | Y / N | Y / N | Active / Stalled / Kill? |

- Projects stalled for 2+ weeks with no decision: ___ --> Move to Things 3 "Someday" or delete

#### Area-of-Focus Review (60 seconds per area)
- [ ] **Work** -- anything slipping or unaddressed? [ Y / N ] --> Flag: ___
- [ ] **Personal Projects** -- anything slipping? [ Y / N ] --> Flag: ___
- [ ] **Health/Fitness** -- did I honor commitments (workouts, sleep, nutrition)? [ Y / N ] --> Flag: ___
- [ ] **Finance** -- any bills due, budget items to review, or financial tasks pending? [ Y / N ] --> Flag: ___

#### Meeting and Call Notes
- [ ] Any notes from this week's meetings, calls, or 1:1s reviewed for missed action items? [ Yes / None this week ]
  - Action extracted: ___ | Added to Things 3: [ Y ]

---

### Phase 3: Plan the Next Week
**Target time: 20 minutes** | Week planned: [Mon date] -- [Sun date]

**Note:** Phase 3 gets the most time because it has the highest leverage. Do not compress this phase to compensate for Phase 2 running long.

#### Calendar Preview (next 7 days)
- [ ] Open Apple Calendar, week view, scroll forward to next Monday
  - Event requiring preparation: ___ --> Prep task in Things 3: ___ | Must be done by: ___
  - Event requiring preparation: ___ --> Prep task in Things 3: ___ | Must be done by: ___
  - All prep tasks added? [ Y ]

#### Most Important Tasks (MITs) for Next Week
*Outcome-level. Maximum 5. At least 2 must connect to a longer-term goal.*
1. ___
2. ___
3. ___
4. (optional) ___
5. (optional) ___

Each MIT should correspond to at least one task already in Things 3 with a next-week date. If not, add the first next action now.

#### Project Next Actions Audit
- [ ] Every active project in Things 3 has exactly one task scheduled for next week or tagged "Next"? [ Yes / No -- review Project Health table above for gaps ]

#### Goal Alignment Check
- [ ] Monthly goal: ___ | Which MITs contribute to this? ___
- [ ] Do at least 2 of my 3-5 MITs connect to something I care about beyond this week? [ Yes / No ]
  - If No: which MIT should I replace or reframe? ___

#### Capacity Check
- Available working hours next week: ___ hrs
  - (Total work hours ___ hrs) minus (scheduled meetings ___ hrs) minus (non-discretionary blocks ___ hrs)
- Total estimated task hours for all Things 3 tasks scheduled next week: ___ hrs
- 70% ceiling: ___ hrs (multiply available hours by 0.7)
- Status: [ Under / At limit / OVER ]
  - Tasks removed to get under ceiling: ___
  - Moved to: Things 3 Someday or rescheduled to the following week

#### Energy Matching
- Highest-energy days: ___ --> Deep work tasks scheduled here: ___
- Lowest-energy days: ___ --> Admin/meetings already here: ___

#### Risks and Blocking Dependencies
- Risk: ___ --> Mitigation: ___
- Waiting on: ___ --> Follow-up action + date: ___

---

### Phase 4: Reflect and Reset
**Target time: 10 minutes**

#### Reflection (write specific answers -- do not leave blank)
1. **What went well this week that I should deliberately repeat?**
   Answer: ___

2. **What did I over-commit to or should have declined -- and how do I prevent it next week?**
   Answer: ___

3. **What one specific change to my environment, routine, or behavior would most improve next week?**
   Answer: ___

#### Week Rating
- **This week:** ___/10
- **Last 3 weeks:** ___ / ___ / ___
- **If below 6:** Root cause (one sentence): ___
- **If 8+ for three straight weeks:** What is working that I should protect? ___

#### Behavioral Experiment for Next Week
- **Experiment:** ___
  - *(Must be binary: I either did it or I didn't. Example: "No phone in bedroom Sunday through Thursday.")*
- **Evaluation criterion:** ___
  - *(How I'll know it worked next Sunday)*

#### Next Week's Theme
> *(One sentence. Example: "Week of finishing things that have been 80% done for two weeks.")*
> ___

#### Environmental Reset
- [ ] All open documents on Mac saved, filed, or closed
- [ ] Safari tabs: archive with OneTab extension or close all
- [ ] Physical desk cleared -- nothing on surface except what belongs there permanently
- [ ] Things 3 closed and reopened (takes 5 seconds -- the fresh open is the reset signal)
- [ ] This review document / note saved to Apple Notes folder "Weekly Reviews"

---

### Review Completion Check
Before closing, answer yes to all three:
- [ ] Are all inboxes at or near zero? [ Yes / Overflow flagged ]
- [ ] Does every active project in Things 3 have a next action? [ Yes ]
- [ ] Do I know the 3-5 most important outcomes of next week? [ Yes ]

**Review officially complete.**
**Next review:** Sunday [next date] at 6:30 PM -- recurring event already on Apple Calendar.

---

### Review Metrics Log
*Save this in Apple Notes under "Weekly Review Log." Review trends every 4 weeks.*

| Week # | Date | Duration | Rating | MITs Set | MITs Completed | Experiments | Notes |
|--------|------|----------|--------|----------|----------------|-------------|-------|
| 1 | | min | /10 | /5 | -- | -- (baseline) | First review |
| 2 | | min | /10 | /5 | /5 | Y / N / Partial | |
| 3 | | min | /10 | /5 | /5 | Y / N / Partial | |
| 4 | | min | /10 | /5 | /5 | Y / N / Partial | |
| 5 | | min | /10 | /5 | /5 | Y / N / Partial | |
| 6 | | min | /10 | /5 | /5 | Y / N / Partial | |

**4-week check (fill in after week 4):**
- Average rating: ___/10
- Average duration: ___ min (target: ≤60)
- MIT completion rate: ___% (target: ≥70%)
- Did I miss any Sundays? ___ -- Did I use the Monday backup? ___
- Is anything about the review itself consistently frustrating? ___
  - If yes, adjust that phase next week: ___
