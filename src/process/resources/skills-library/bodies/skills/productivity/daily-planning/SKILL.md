---
name: daily-planning
description: |
  Generates a structured daily plan from the user's task list and calendar. Applies Most Important Tasks (MITs), time estimates, and energy-level matching to produce a sequenced day plan with rationale for task ordering.
  Use when the user asks for help planning their day, creating a daily schedule, or figuring out what to work on today.
  Do NOT use for weekly time blocking (use time-blocking), full GTD system setup (use gtd-workflow), or team sprint planning (use business project-management skills).
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
# Daily Planning

## When to Use

**Use this skill when:**
- The user explicitly asks for help planning today or structuring the current workday -- phrases like "help me figure out my day," "I have too much to do today," or "what should I work on first?"
- The user has a task list or brain dump and needs help sequencing, estimating, and committing to a realistic daily execution plan
- The user wants to identify their Most Important Tasks (MITs) for the day and needs a rationale for which ones to prioritize
- The user expresses overwhelm about today's workload, decision fatigue about where to start, or anxiety about fitting everything in
- The user is at a morning planning moment and wants a structured kickoff -- including carryover tasks from yesterday, today's calendar, and fresh items
- The user needs to re-plan mid-day after a crisis, unexpected meeting, or a task that ran over
- The user has a loose sense of what they should do but hasn't committed to a specific, time-anchored sequence

**Do NOT use when:**
- The user wants to build a full weekly time-block schedule across multiple days -- use `time-blocking` instead, which handles recurring blocks, weekly themes, and time-category allocation
- The user wants to set up a complete GTD capture-clarify-organize-reflect-engage system -- use `gtd-workflow`, which addresses the full trusted system architecture
- The user needs to triage and prioritize a large project backlog or epics list across multiple weeks -- use `task-prioritization`, which applies RICE scoring, ICE frameworks, and multi-horizon thinking
- The user is coordinating a team sprint, assigning work to multiple people, or planning a sprint retrospective -- use business project management skills built for team contexts
- The user wants to do a structured weekly review of last week and plan next week at a macro level -- use `weekly-review`, which handles horizon-2 and horizon-3 goal alignment
- The user is asking for advice on building a permanent habit system, daily routine design, or identity-based behavior change -- daily planning is tactical execution, not habit architecture

---

## Process

### Step 1 -- Gather All Inputs Before Planning Anything

Never attempt to produce a plan without complete inputs. Ask the user for all of the following in a single request to avoid back-and-forth:

- **Full task list:** Every task they could conceivably work on today, including carryover items from yesterday. Do not filter yet -- capture everything.
- **Fixed calendar commitments:** Every meeting, call, appointment, or blocked time slot with exact start and end times. Include commute time if relevant.
- **Hard deadlines due today or tomorrow morning:** Any task where missing the deadline causes real consequences -- a client deliverable, a payment, a dependency someone else is waiting on.
- **Working hours available:** Exact start time and end time of their workday today, including whether they take a lunch break and its duration.
- **Current energy level:** Ask specifically: "Are you a morning person, an afternoon person, or do you have a specific energy peak you notice?" This determines when to schedule deep work.
- **Context about yesterday:** Any carryover tasks that are now a day older, any commitments made in yesterday's meetings that create new tasks today.
- **One grounding question:** "If you could only accomplish two things today, which two would make you feel like today was genuinely productive?" This primes MIT selection and bypasses the user's tendency to say "everything is important."

If the user provides a vague or incomplete task list (e.g., "work stuff, emails, some project things"), do not proceed. Run a structured brain dump: ask them to spend 60 seconds listing every specific item on their mind -- work tasks, personal tasks that might bleed into work time, open loops, things they promised to people, and things nagging at them. Then clarify each vague item into a single concrete next action (not a project or an outcome -- the specific physical action to move it forward).

---

### Step 2 -- Identify the MITs Using the Three-Filter Framework

Select exactly 2-3 Most Important Tasks. Selecting 1 is too conservative and leaves strategic opportunities unfilled. Selecting 4 or more means everything is important, which means nothing is.

Apply these three filters in order:

**Filter 1 -- Hard constraints (automatic MIT qualification):**
- Any task with a hard deadline due today or by 9 AM tomorrow morning
- Any task that is blocking another person's ability to do their work -- a code review, an approval, a document someone is waiting on
- Any task that, if not done today, triggers a financial or reputational consequence (missed invoice, unanswered client, delayed shipment)

**Filter 2 -- Strategic leverage test:**
- Which tasks on this list advance the user's single most important goal or project right now?
- Apply the 80/20 principle: which 2-3 tasks, if completed, would produce 80% of today's meaningful progress?
- Prefer tasks that compound (a decision that unblocks five other tasks, a draft that enables a review cycle to start)

**Filter 3 -- The "photograph test" (borrowed from Tiago Forte's PARA prioritization logic):**
- If someone took a photograph of your desk at 5 PM, which completed tasks would make you feel genuinely accomplished versus which would barely register?
- This filter removes tasks that feel important due to urgency theater (responding to someone's low-stakes message instantly, reorganizing files) rather than real impact

Label each MIT with its specific qualification reason -- not just "important" but "client deliverable due 3 PM" or "blocks Sarah's PR review" or "first draft needed to start feedback cycle before Friday."

---

### Step 3 -- Estimate Durations with Planning-Fallacy Correction

For every task on the list (not just MITs), establish a realistic time estimate:

- **Ask the user for their raw estimate first.** Do not impose estimates without their input.
- **Apply a 25% buffer multiplier to all estimates.** If the user says "30 minutes," record 38 minutes. If they say "2 hours," record 150 minutes. This corrects for the planning fallacy -- the well-documented cognitive bias where people systematically underestimate task duration even when they know about the planning fallacy. The 25% figure is drawn from reference-class forecasting research and is conservative for cognitively demanding work.
- **Apply a 50% buffer to tasks the user has never done before**, creative tasks with unknown scope, or tasks that require coordination with someone else whose response time is uncertain.
- **Tasks without any estimate default to 25 minutes** -- one Pomodoro unit. This is a practical forcing function that prevents tasks from being scheduled as vague "I'll get to it" blocks.
- **Cap any single continuous work block at 90 minutes.** The ultradian rhythm cycle (popularized in productivity research building on Peretz Lavie's sleep-wake research) runs in approximately 90-minute intervals. After 90 minutes of focused work, cognitive performance degrades. If an MIT requires more than 90 minutes, split it into two named blocks: "Draft blog post -- Part 1 (opening + argument)" and "Draft blog post -- Part 2 (examples + conclusion)," with a 15-minute break between them.
- **After all estimates are finalized, compute the capacity math:**
  - Net available time = (total working hours) minus (total fixed calendar time) minus (total transition buffer time) minus (lunch/break time)
  - Total task load = sum of all buffered task estimates
  - If task load exceeds net available time by more than 15 minutes, the plan is over-committed and requires explicit cuts before sequencing

---

### Step 4 -- Sequence Tasks Using Energy-Context Matching

Sequencing is not just about fitting tasks into available gaps. It is about matching the cognitive demand of each task to the cognitive capacity available at that time of day.

**The four energy zones:**

| Zone | Typical Time | Cognitive State | Best Task Types |
|------|-------------|-----------------|-----------------|
| Peak | First 2-3 hours after waking | Maximum focus, dopamine high, fewest distractions | Deep work MITs: writing, coding, analysis, strategy, complex decisions |
| Trough | Early-to-mid afternoon (roughly 1-3 PM for most people) | Energy dip, reduced vigilance, higher error rates | Administrative tasks, routine email, expense reports, data entry, routine calls |
| Recovery | Late afternoon (roughly 3-5 PM) | Energy rebounds, mood improves, good for collaboration | Shallow creative tasks, 1:1 conversations, brainstorming, light planning |
| Post-dinner (for evening workers) | 7-9 PM | Second cognitive peak for night owls | Deep work if user identifies as an evening chronotype |

These zones shift by roughly 1-2 hours for night owls versus early birds. Always use the user's self-reported energy curve, not a generic schedule.

**Sequencing rules:**
- Place MIT #1 in the Peak zone, as the first task of the day before email, Slack, or any reactive work. Reactive work hijacks attentional resources before the user has deployed them intentionally.
- Place MIT #2 in the second-best energy slot -- either late morning or the Recovery zone, depending on available time after fixed commitments.
- Place MIT #3 immediately before or after a natural energy anchor (e.g., right before lunch while still motivated, or at the start of Recovery zone).
- Batch all reactive/administrative tasks (email, Slack replies, expense reports) into the Trough zone. Never scatter them throughout the day as interruptions.
- Place 10-minute transition buffers between every fixed meeting and the following focused task. This is not optional -- it accounts for meeting overrun, context-switching cost, and bathroom/water breaks.
- Never schedule a meeting prep task in the 5-minute window before the meeting. Schedule it at least 30 minutes before with a transition buffer between prep and meeting.
- If the user has back-to-back meetings with no gaps, protect the first available 30+ minute post-meeting slot for the highest-priority MIT that still hasn't been completed.

---

### Step 5 -- Handle Over-Commitment Explicitly

If the total task load exceeds available net time, do not silently adjust times and hope it works. Over-commitment is one of the most common and damaging planning errors. Handle it explicitly:

**The three-option framework for over-committed days:**
1. **Cut:** Remove low-value tasks from today's plan entirely. They do not get deferred -- they get evaluated for whether they should be done at all. Ask: "Does this task still need to happen, or has it been on the list past its usefulness?"
2. **Defer:** Move tasks to a specific future date with a reason logged. "Deferred to Friday because MIT #1 takes priority and there is no hard deadline today" is acceptable. Deferring without a reason creates a growing list of guilt.
3. **Shrink:** Reduce the scope of a task to fit today's time. Instead of "Write full blog post draft," shrink to "Write blog post outline and first 300 words." A smaller version done is better than a full version not started.

Never defer an MIT unless the user physically cannot work on it today (e.g., they are waiting for someone else's input). If an MIT is being deferred, flag it as a planning-quality issue and help the user identify what created the conflict.

If the plan is over-committed by more than 90 minutes, the user is in triage mode. In triage mode, the output includes only the MITs plus any hard-deadline items. Everything else is explicitly moved to a deferred list.

---

### Step 6 -- Build the Shutdown Ritual into the Plan

The end-of-day shutdown is not optional productivity theater -- it is the cognitive mechanism that allows the user to mentally disengage from work. Without a deliberate shutdown, the Zeigarnik effect (the brain's tendency to keep rehearsing incomplete tasks) produces rumination, poor sleep, and anxiety. Cal Newport's "shutdown complete" verbalization is a behavioral anchor that signals task-list closure to the brain.

The shutdown block should be 15 minutes, scheduled 10-15 minutes before the end of the workday:

- **Review what was completed vs. planned.** Percentage completion is not the goal -- MIT completion is the goal. A day where 3 MITs are done and 5 admin tasks are incomplete is a successful day.
- **Process every incomplete task.** For each one: does it move to tomorrow, get delegated, get cut, or get deferred to a specific future date? No task should remain in ambiguous limbo.
- **Capture every new task that arose during the day** -- from meetings, emails, conversations, or ideas -- in a single capture list (not scattered across email, Slack, sticky notes, and memory).
- **Write the shutdown sentence.** "The most important thing I accomplished today was ___." This is not journaling -- it is a 20-second cognitive completion ritual that creates a clean break.
- **Scan tomorrow.** Spend 60 seconds reviewing tomorrow's calendar to surface any prep needed that wasn't already planned.

---

### Step 7 -- Produce and Deliver the Final Plan

After completing all previous steps, produce the sequenced daily plan in the Output Format specified below. The plan must be:

- **Time-anchored:** Every task has a specific start time, not just an order number
- **Typed:** Every block is labeled as MIT, Standard, Admin, Fixed, Buffer, or Break
- **Rationale-tagged:** Every MIT has a one-line reason for its priority
- **Capacity-verified:** Available time math is shown explicitly
- **Complete:** Nothing is left as "will figure it out later" -- every task either has a time slot or is explicitly deferred

If producing the plan requires assumptions (e.g., the user didn't specify whether lunch is 30 or 60 minutes), state the assumption inline and invite the user to correct it.

---

## Output Format

```
## Daily Plan: [Full Day Name, Month Date, Year]

### Today's MITs (Must Complete)
1. [MIT Task Name] -- [specific reason: deadline / blocks someone / strategic priority]
2. [MIT Task Name] -- [specific reason]
3. [MIT Task Name] -- [specific reason]  ← omit if only 2 MITs qualify

### Capacity Snapshot
| | Hours/Minutes |
|---|---|
| Working hours today | [X hrs] ([start time] -- [end time]) |
| Fixed calendar commitments | [X hrs X min] |
| Transition buffers | [X min total] |
| Lunch / breaks | [X min] |
| **Net available for tasks** | **[X hrs X min]** |
| Total task estimates (buffered) | [X hrs X min] |
| **Status** | **[On track / Over-committed by X min / Under-loaded by X min]** |

### Sequenced Day Plan
| # | Start | Task | Duration | Type | Energy Zone |
|---|-------|------|----------|------|-------------|
| 1 | [HH:MM AM/PM] | [Task name] | [X min] | MIT | Peak |
| 2 | [HH:MM AM/PM] | [Task name, Part 2 if split] | [X min] | MIT | Peak |
| 3 | [HH:MM AM/PM] | Transition buffer | 10 min | Buffer | -- |
| 4 | [HH:MM AM/PM] | [Meeting/appointment name] | [X min] | Fixed | -- |
| 5 | [HH:MM AM/PM] | Transition buffer | 10 min | Buffer | -- |
| 6 | [HH:MM AM/PM] | [Task name] | [X min] | MIT / Standard / Admin | Peak/Mid/Trough/Recovery |
| ... | ... | ... | ... | ... | ... |
| N | [HH:MM AM/PM] | End-of-day shutdown | 15 min | Shutdown | -- |

### Deferred Tasks
| Task | Reason Deferred | Proposed Rescheduled Date | Priority |
|------|----------------|--------------------------|----------|
| [Task name] | [specific reason it cannot be today] | [Tomorrow / Thursday / Next week] | High / Medium / Low |

*No tasks deferred -- all fit within available time.* ← use this line if nothing is deferred

### Planning Assumptions
- [Any assumption made where user input was missing or ambiguous]
- Example: "Lunch assumed to be 45 minutes starting at 12:15 PM -- adjust if different"
- Example: "Blog post draft estimated at 90 minutes raw; 113 minutes after 25% buffer applied"

### End-of-Day Shutdown Checklist ([time])
- [ ] Review MIT completion: were all [#] MITs completed?
- [ ] Process every incomplete task -- defer, cut, or delegate each one
- [ ] Capture new tasks from today's meetings and conversations
- [ ] Write: "The most important thing I accomplished today was ___"
- [ ] Scan tomorrow's calendar for any prep needed
```

---

## Rules

1. **Never produce the plan without first completing the capacity math.** If total buffered task time exceeds net available time, the plan is invalid until tasks are cut, deferred, or shrunk. Presenting an over-committed schedule as if it will work is the most common failure mode in daily planning.

2. **Always select exactly 2-3 MITs -- never 1, never 4 or more.** One MIT is too conservative and leaves room for the user to spend peak hours on shallow work. Four or more MITs recreates the overwhelm the planning session was meant to solve. If the user insists more than 3 things are critical, ask: "If you could only complete 3 of these by 5 PM, which 3?" and force the trade-off.

3. **Apply the 25% planning-fallacy buffer to all user-provided time estimates.** Do not skip this step because estimates "seem reasonable." Research consistently shows the planning fallacy applies even to experienced professionals estimating familiar tasks. Always show the raw estimate and the buffered estimate so the user understands what happened to their numbers.

4. **MIT #1 must be scheduled in the Peak energy zone as the first task of the day -- before email, Slack, or any reactive work.** This is non-negotiable. If the user's Peak zone is before their first meeting and they want to "check email first," flag this explicitly: starting with reactive work consumes attentional resources before deploying them on the highest-priority item. This is the single most impactful sequencing decision in the entire plan.

5. **Never schedule a task during a fixed calendar block.** Not even a "quick 5-minute" task during a meeting. Calendar blocks are treated as truly fixed -- the plan sequences around them.

6. **Batch all reactive and administrative tasks into the Trough zone (typically early-to-mid afternoon).** Email, Slack, expense reports, routine scheduling, and form filling belong in low-cognitive-demand time slots. Scattering them as interruptions throughout deep work blocks reduces deep work quality by up to 40% due to attention residue (the cognitive cost documented by Sophie Leroy's research on task-switching).

7. **Cap all single continuous focus blocks at 90 minutes.** If an MIT requires more than 90 minutes, split it into two named sub-tasks with a 15-minute break between them. Name each sub-task specifically so the user knows exactly where to pick up after the break -- not just "Write report, Part 2" but "Write report -- evidence section and recommendations."

8. **Every task in the Sequenced Day Plan must have a specific start time, not a relative order.** "After the meeting, do X" is not a schedule. Time-anchoring creates commitment and makes it possible to detect conflicts, evaluate realism, and measure adherence.

9. **Carryover tasks from yesterday are not automatically MITs, but they receive priority consideration.** A task that has been deferred two or more days in a row is either urgently due (making it an auto-MIT) or persistently avoided (suggesting it should be cut, delegated, or broken into a smaller first action). Flag any task that has been deferred more than twice and ask the user why.

10. **Always include the End-of-Day Shutdown block as a scheduled 15-minute task in the plan.** A shutdown that is not scheduled does not happen. The Zeigarnik effect means incomplete tasks remain active in working memory until deliberately closed. Without the shutdown ritual, the cognitive cost of the day extends into the evening. The shutdown is part of the plan, not an optional addition.

---

## Edge Cases

### The User Has Back-to-Back Meetings All Day

When fixed calendar commitments consume more than 70% of available working hours, the daily plan shifts from execution mode to protection mode.

- Identify every gap of 20 minutes or more between meetings. Even a 20-minute window, used intentionally, can complete a focused micro-task.
- Reframe MITs as "meeting-adjacent actions": tasks that take fewer than 15 minutes and can be done within a meeting context or immediately following one. Examples: sending the pre-read document before a meeting, sending a one-paragraph decision after a meeting, approving a PR that takes 10 minutes.
- For any MIT requiring 45+ minutes of focus, explicitly flag: "This task cannot be completed today without a free block. Proposed options: (a) protect 7-8 AM before meetings begin, (b) defer to [specific date] when calendar is lighter, (c) reduce scope to the 15-minute next action that makes progress."
- Never pretend a 45-minute deep work task will fit in a 15-minute gap. Acknowledging the mismatch and deferring with a specific future date is far more useful than an optimistic plan the user cannot follow.

### The User Starts the Planning Session Mid-Day (11 AM or Later)

Mid-day planning requires recalibrated inputs:

- Establish remaining working hours from the current time, not the original start of day.
- If Peak zone has passed (i.e., it is now mid-morning or afternoon), do not pretend deep work MITs can still be scheduled in peak energy. Acknowledge: "Your highest-focus window for today has likely passed. For deep work MITs, the best remaining option is the Recovery zone starting around [time]. For today, consider completing MITs that are short enough to execute in the Trough or Recovery zones, and protect tomorrow's Peak zone for [MIT task]."
- Reduce the MIT count to 1-2 for afternoon planning sessions. With 4 or fewer hours remaining, attempting 3 MITs creates unrealistic pressure and invites poor-quality rushed completion.
- Ask what was already completed this morning before building the remaining plan -- do not include completed tasks in the task load math.

### The User Has Zero Deadlines and No Urgent Pressure Today

A "no deadline" day is a strategic opportunity that most people waste on Quadrant 3 tasks (urgent but unimportant, in Eisenhower Matrix terms) or Quadrant 4 tasks (neither urgent nor important). Flag this opportunity explicitly.

- MITs on a low-urgency day should come from Quadrant 2 (important but not urgent): long-term projects, skill development, relationship-building, system improvement, creative work that has been getting deferred.
- Ask: "What is the most important project or goal you've been meaning to make progress on but keep putting off because more urgent things take over?" The answer becomes MIT #1.
- Protect the user from spending this rare low-urgency day on inbox zero, file organization, or catching up on reading -- these activities feel productive but produce minimal real output. Name this trap explicitly if the user's task list skews heavily toward these items.
- Suggest using the first 90-minute Peak block for the highest-leverage Q2 task, even if it feels uncomfortable to do something with no immediate deadline.

### The User Provides Time Estimates That Sum to 4-6x Their Available Time

This is an extreme over-commitment scenario (common on Mondays or after vacation). Standard 25% buffering and minor cuts will not resolve it.

- Enter full triage mode. The output is not a normal daily plan -- it is a triage protocol.
- Present the raw numbers to the user first: "Your task list, even with conservative estimates, totals approximately [X hours]. You have [Y hours] available today. That is a [ratio]x overload."
- Guide the user through the three-category sort: (1) Must happen today -- hard deadline or blocks others, (2) Should happen this week -- no today-specific urgency, (3) Nice to have -- no real deadline, could be cut or delegated.
- Only Category 1 tasks make it into today's plan. Everything else gets a specific future date or a cut decision.
- After the triage, verify the remaining Category 1 tasks still fit within available time. If they do not, escalate: help the user identify which hard deadlines can be renegotiated with a proactive communication to the stakeholder.

### A Crisis Interrupts the Plan Mid-Execution

When an unexpected high-priority task arrives mid-day and consumes unplanned time, the original plan is no longer valid. Do not ask the user to "catch up."

- Stop. Acknowledge the plan is disrupted.
- Establish: (a) how much time the crisis consumed, (b) how much time remains in the workday, (c) which planned tasks were skipped.
- Re-run a simplified version of Step 4 for the remaining hours only. Treat remaining time as a new mini-planning session.
- Apply a strict rule: if completing the interrupted MITs now would require rushing or cutting quality, defer them to a specific time slot rather than doing them poorly under time pressure. A crammed 45-minute MIT completed in 20 minutes is usually worse than a full MIT done tomorrow.
- Add a post-crisis buffer: after handling an unexpected crisis, the user's cognitive state is typically degraded by stress and context-switching. Schedule a 10-15 minute decompression block (a short walk, making a drink, a brief freewriting session) before resuming focused MIT work.

### The User Is Working Across Multiple Roles or Contexts (e.g., Manager + Individual Contributor)

Some users have fundamentally incompatible task types that require different environments, different cognitive modes, and different tools -- such as someone who both manages a team and writes code.

- Identify distinct "context zones" in the user's task list and group tasks by context: Maker work (deep focus, uninterrupted, long blocks), Manager work (reactive, communication-heavy, short bursts), and Admin work (mechanical, low-cognitive, batchable).
- Never alternate between Maker and Manager tasks within the same hour. Context-switching between these modes has the highest cognitive cost of any task transition.
- Dedicate entire morning or afternoon blocks to a single context when possible: "Maker morning, Manager afternoon" is the canonical structure for hybrid-role knowledge workers.
- If fixed meetings interrupt what would otherwise be a Maker block, build the plan around protecting at least one 90-minute continuous block for the most important deep work MIT. Everything else can fragment.

### The User Has Chronic Planning-vs-Execution Misalignment (Plans Daily, Rarely Follows Through)

If the user mentions that they make plans every day but always fall behind or abandon them by noon, this is a systemic planning quality issue, not a motivation issue.

- Do not produce another ambitious, over-optimistic plan that will be abandoned by 11 AM.
- Diagnose the pattern: ask "What typically causes the plan to break down? Unexpected interruptions, tasks taking longer than expected, or starting on low-value tasks instead of the plan?"
- If interruptions are the cause: build explicit interruption buffers (20-30 minutes in the Trough zone) and discuss with the user which interruptions they can reasonably decline versus which are genuinely urgent.
- If tasks run over: increase the planning-fallacy buffer from 25% to 50% for this user until their estimates become more calibrated. This is not a permanent ceiling -- it is a recalibration period.
- If the user starts on low-value tasks: implement a "first task commitment" rule: the MIT starts within 10 minutes of the workday beginning, before any email, Slack, or task-switching. Name the MIT explicitly in the plan ("8:00 AM: Open document, write for 90 minutes") so there is no ambiguity about the first physical action.

---

## Example

**Input from user:**
"It's Thursday. I have a 9-10 AM standup, a 1-2 PM product review meeting, and a 4 PM dentist appointment that will take me out at 3:45. My task list: finish the Q3 pricing analysis spreadsheet (my manager asked for it by EOD), review and respond to the legal team's contract redlines (they're waiting on me), write my performance self-review (due Friday EOD), fix a UI bug my teammate flagged, update the team wiki with last week's release notes, reply to about 8 emails, and schedule next quarter's planning session. I work 8 AM to 5 PM normally but today I have to leave at 3:45 for the dentist. I'm a morning person -- I feel sharpest from 8 to 11."

---

**Output:**

## Daily Plan: Thursday, November 14

### Today's MITs (Must Complete)
1. **Finish Q3 pricing analysis spreadsheet** -- hard deadline EOD today, explicitly requested by manager; missing this deadline has a direct professional consequence
2. **Review and respond to legal team's contract redlines** -- blocking another team's workflow; legal is waiting on this response to proceed; a delayed response today becomes a delayed business decision tomorrow
3. **Write performance self-review (first draft)** -- due Friday EOD, which leaves only tonight and tomorrow morning if not started today; complex reflective writing benefits from your Peak zone and will be significantly harder to write under time pressure tomorrow

### Capacity Snapshot
| | Hours / Minutes |
|---|---|
| Working hours today | 7 hrs 45 min (8:00 AM -- 3:45 PM, including dentist departure) |
| Fixed calendar commitments | 2 hrs (standup 9-10 AM + product review 1-2 PM) |
| Transition buffers | 40 min (4 buffers × 10 min) |
| Lunch / breaks | 45 min (12:15 -- 1:00 PM) |
| **Net available for tasks** | **4 hrs 20 min (260 min)** |
| Total task estimates (buffered at 25%) | 4 hrs 11 min (251 min) |
| **Status** | **On track -- 9-minute margin. Tight but executable.** |

*Key assumption: Q3 pricing analysis estimated at 90 min raw / 113 min buffered. Legal contract redlines estimated at 45 min raw / 56 min buffered. Self-review first draft estimated at 60 min raw / 75 min buffered. UI bug fix estimated at 20 min raw / 25 min buffered. Adjust if your estimates differ significantly.*

### Sequenced Day Plan
| # | Start | Task | Duration | Type | Energy Zone |
|---|-------|------|----------|------|-------------|
| 1 | 8:00 AM | Q3 pricing analysis spreadsheet | 88 min | MIT #1 | Peak |
| 2 | 9:28 AM | Transition buffer (save work, close out) | 10 min | Buffer | -- |
| 3 | 9:38 AM | ← *Note: standup starts at 9:38 if standup is 9:00; see assumption below* | -- | -- | -- |
| 4 | 9:00 AM* | Standup meeting | 60 min | Fixed | -- |

*Wait -- conflict detected. Standup begins at 9:00 AM, but MIT #1 is also scheduled starting at 8:00 AM. The 90-minute (88 min buffered) MIT block runs from 8:00 to 9:28 AM, which overlaps the 9:00 AM standup. Applying split-MIT rule below.*

**Revised plan with MIT #1 split across two blocks:**

| # | Start | Task | Duration | Type | Energy Zone |
|---|-------|------|----------|------|-------------|
| 1 | 8:00 AM | Q3 pricing analysis -- Part 1 (data gathering + model structure) | 50 min | MIT #1a | Peak |
| 2 | 8:50 AM | Transition buffer + standup prep | 10 min | Buffer | -- |
| 3 | 9:00 AM | Standup meeting | 60 min | Fixed | -- |
| 4 | 10:00 AM | Transition buffer | 10 min | Buffer | -- |
| 5 | 10:10 AM | Legal contract redlines -- review and respond | 56 min | MIT #2 | Peak |
| 6 | 11:06 AM | Q3 pricing analysis -- Part 2 (analysis + formatting + final review) | 63 min | MIT #1b | Peak-to-Mid |
| 7 | 12:09 PM | Reply to 8 emails (batched) | 25 min | Admin | Mid |
| 8 | 12:34 PM | Schedule Q4 planning session (calendar + invite) | 10 min | Admin | Mid |
| 9 | 12:44 PM | Lunch break | 45 min | Break | -- |
| 10 | 1:00 PM* | Product review meeting | 60 min | Fixed | -- |

*Note: Lunch runs 12:44 -- 1:29 PM if taken in full, but product review starts at 1:00 PM. Adjust: take 15-minute lunch at 12:44 PM, or take full lunch 11:30 AM -- 12:15 PM and shift email batch to after product review. Recommended: shift lunch earlier to 11:10 AM after Part 1b of pricing analysis, move email batch to Trough zone post-meeting. See revised sequence below.*

**Final Revised Sequence (cleaner):**

| # | Start | Task | Duration | Type | Energy Zone |
|---|-------|------|----------|------|-------------|
| 1 | 8:00 AM | Q3 pricing analysis -- Part 1 (data gathering + model structure) | 50 min | MIT #1a | Peak |
| 2 | 8:50 AM | Transition buffer | 10 min | Buffer | -- |
| 3 | 9:00 AM | Standup meeting | 60 min | Fixed | -- |
| 4 | 10:00 AM | Transition buffer | 10 min | Buffer | -- |
| 5 | 10:10 AM | Legal contract redlines -- review and respond | 56 min | MIT #2 | Peak |
| 6 | 11:06 AM | Q3 pricing analysis -- Part 2 (analysis + final formatting) | 63 min | MIT #1b | Peak-to-Mid |
| 7 | 12:09 PM | Lunch break | 45 min | Break | -- |
| 8 | 12:54 PM | Performance self-review -- first draft | 6 min run-up + transition buffer | Buffer | -- |
| 9 | 1:00 PM | Product review meeting | 60 min | Fixed | -- |
| 10 | 2:00 PM | Transition buffer | 10 min | Buffer | -- |
| 11 | 2:10 PM | Performance self-review -- first draft | 75 min | MIT #3 | Recovery |
| 12 | 3:25 PM | Reply to 8 emails (batched) + schedule Q4 planning session | 35 min | Admin | Recovery |
| 13 | 3:45 PM | ← Depart for dentist. Shutdown moves to post-dentist or tomorrow AM. | -- | -- | -- |

*UI bug fix and team wiki update are both deferred -- see Deferred Tasks below. Total scheduled task time: 279 min / 4 hrs 39 min. Net available: ~265 min. Over by 14 minutes -- addressed by deferring UI bug fix and wiki update.*

### Deferred Tasks
| Task | Reason Deferred | Proposed Rescheduled Date | Priority |
|------|----------------|--------------------------|----------|
| Fix UI bug (team-flagged) | No hard deadline; no one is blocked on this today; fits in tomorrow's Trough zone | Friday, Trough zone (~2 PM) | Medium |
| Update team wiki with release notes | Administrative task; no reader is actively waiting for this update; 1-week-old notes are still useful | Friday or Monday morning | Low |

### Planning Assumptions
- Q3 pricing analysis estimated at 90 minutes raw by user; 113 minutes buffered (split into 50 + 63 min to work around standup)
- Legal redlines estimated at 45 minutes raw; 56 minutes buffered -- assumes contract is under 20 pages and redlines are substantive but not requiring legal counsel escalation
- Self-review first draft estimated at 60 minutes raw; 75 minutes buffered -- assumes narrative format, not a form with discrete numeric ratings
- UI bug fix estimated at 20 minutes raw; 25 minutes buffered -- if this turns out to be a larger bug, do not let it expand into today's plan; defer and protect a full block tomorrow
- Lunch taken 12:09 -- 12:54 PM (45 minutes)
- Dentist departure at 3:45 PM is firm -- end-of-day shutdown moved to post-dentist return or folded into tomorrow morning's planning session

### End-of-Day Shutdown Checklist (3:30 PM today, abbreviated -- 10 minutes before dentist departure)
- [ ] Confirm Q3 pricing analysis is complete and sent to manager before 3:45 PM
- [ ] Confirm legal redlines response has been sent
- [ ] Save self-review draft with clear filename indicating it is in progress
- [ ] Capture any new tasks from product review meeting
- [ ] Process deferred items: confirm UI bug and wiki update are logged for Friday
- [ ] Write: "The most important thing I accomplished today was ___"
- [ ] *Full shutdown review to complete tomorrow morning before starting work*
