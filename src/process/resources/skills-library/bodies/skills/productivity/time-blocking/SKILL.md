---
name: time-blocking
description: |
  Builds a time-blocked weekly schedule from the user's working hours, fixed commitments, and task list. Produces a day-by-day block schedule with task assignments, buffer rules, and energy-level matching.
  Use when the user asks about time blocking, scheduling their day, creating a weekly plan with specific time slots, or structuring their workday around focused blocks.
  Do NOT use for prioritizing tasks without scheduling (use eisenhower-matrix or task-prioritization), building a full GTD system (use gtd-workflow), or enterprise team scheduling (use business project-management skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management planning optimization"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Time Blocking

## When to Use

**Use this skill when:**
- The user explicitly asks to "time block" their week, schedule tasks into calendar slots, or create a structured daily plan with named time chunks
- The user describes a fragmented workday -- feeling like they never have time for important work despite being busy all day
- The user has a task list and working hours and wants help turning those into a concrete, hour-by-hour schedule
- The user wants to protect focused work time around a set of recurring commitments (meetings, pickups, calls) they cannot move
- The user asks about energy-based scheduling, ultradian rhythm planning, or aligning their hardest work with their best hours
- The user is returning from vacation, starting a new job, or resetting their work habits and needs a structured template to follow
- The user wants to reduce decision fatigue about "what to work on next" by pre-assigning every hour of the workday

**Do NOT use when:**
- The user needs to decide which tasks matter most before scheduling anything -- use `eisenhower-matrix` or `task-prioritization` first, then return here
- The user wants a single plan for just today, not a repeating weekly structure -- use `daily-planning`
- The user wants to implement a full capture-process-review system with contexts and projects -- use `gtd-workflow`
- The user wants to reduce context switching as a standalone problem without building a schedule -- use `context-switching-reduction`
- The user needs to coordinate schedules across a team or synchronize multiple people's calendars -- use business project-management skills
- The user is asking about habit formation or behavior change without a scheduling component -- use `habit-building`
- The user's primary problem is motivation or procrastination, not schedule structure -- use `procrastination-intervention` first

---

## Process

### Step 1: Gather All Schedule Inputs Before Building Anything

Do not begin constructing the schedule until you have the following. If any item is missing, ask explicitly.

- **Working hours:** Start time, end time, and which days. Do not assume Monday-Friday 9-5. Freelancers, shift workers, parents, and caregivers all have non-standard grids.
- **Fixed commitments:** Every recurring meeting, standup, sync, call, school run, commute, medication routine, or non-negotiable personal obligation. Get the exact day, start time, and end time for each. Note which are immovable versus which are merely habitual.
- **Task list with effort estimates:** Ask the user to list every meaningful task they need to complete this week. For each task, estimate duration in 30-minute increments. If the user cannot estimate, apply the following heuristics: email processing = 30-45 minutes per batch; code review = 30-60 minutes per PR depending on size; writing a first draft = 90-120 minutes per 500-800 words; strategic or analytical work = 90-180 minutes per deliverable.
- **Cognitive demand level for each task:** Classify each task as Deep Work (requires full cognitive engagement, no interruption), Shallow Work (can be done at 60% mental capacity), Creative Work (requires open-ended ideation and psychological safety to think), or Communication Work (meetings, calls, real-time collaboration).
- **Energy pattern:** Ask directly: "At what time of day do you feel sharpest and most able to do hard thinking? When do you feel a slump?" If the user does not know, default to the circadian norm (see Edge Cases).
- **Break preferences and constraints:** How long can the user work before they need to stop? Are there physical constraints (back pain, ADHD, hyperfocus patterns) that dictate block length? Breaks are not optional -- they are inputs.
- **Interruption exposure:** Does the user work in an open office, care for children or dependents during work hours, or have a role that requires being on-call? This determines how many flex blocks are needed and which tasks can tolerate interruption.

### Step 2: Plot Fixed Commitments and Calculate True Available Time

Before assigning any tasks, map the immovable structure of the week.

- Create a 7-column grid (Mon-Sun or the user's working days) with time rows at 15-minute granularity in your mental model.
- Plot every fixed commitment from Step 1. Include commute blocks (round-trip) even if the user did not mention them -- ask if unclear.
- Add mandatory non-work time: lunch (minimum 30 minutes, ideally 45), and any hygiene/personal routines that eat into the workday.
- Calculate **net available hours** by subtracting all fixed commitments from total working hours. This is the real scheduling budget. Example: 40-hour week minus 5 hours of meetings minus 2.5 hours of lunch minus 1.5 hours of standups = 31 net available hours.
- Identify **contiguous blocks** within available time. A 3-hour gap and a 45-minute gap are not interchangeable -- deep work requires contiguity. Flag any day where the largest contiguous gap is under 60 minutes as a "fragmented day" that cannot host deep work without meeting restructuring.
- Note **transition time costs**: the 10-15 minutes of cognitive recovery after any meeting or context switch is a real cost that must be budgeted. Do not let transitions silently eat into focus blocks.

### Step 3: Categorize Tasks and Match to Block Types

Use these four categories with strict definitions and minimum block sizes:

**Deep Work blocks:**
- Definition: Tasks that push your cognitive capabilities to their limit, create new value, and cannot be done at reduced attention. Requires zero interruption, ideally zero notifications.
- Minimum viable block length: 90 minutes. Below 90 minutes, the brain does not reach the depth of focus needed for complex problem-solving -- the average time-on-task to reach flow state is 23 minutes, meaning a 60-minute block gives you roughly 37 minutes of actual deep work.
- Maximum recommended single block: 3 hours. Beyond 3 hours, cognitive performance degrades sharply without recovery.
- Examples: writing, software development, financial modeling, research synthesis, strategic planning, design work, learning a new technical skill.
- Energy requirement: Peak only. Never schedule deep work in low-energy windows.

**Shallow Work blocks:**
- Definition: Logistical, administrative, or communicative tasks that are necessary but do not require deep concentration. Could be done while mildly tired.
- Block size: 30-60 minutes per batch. Batch email into two sessions per day (never continuous open inbox). Batch Slack/messaging into 3-4 discrete windows.
- Examples: email responses, expense reports, scheduling meetings, filing, updating task lists, reading non-essential news.
- Energy requirement: Low energy windows. Shallow work during peak hours is a cognitive budget waste.

**Creative Work blocks:**
- Definition: Tasks that require ideation, brainstorming, divergent thinking, or open-ended exploration. Different from deep work -- creativity benefits from slightly relaxed focus and associative thinking, not maximum concentration.
- Block size: 60-120 minutes. Shorter sessions do not allow enough warm-up; longer sessions exhaust novelty.
- Optimal timing: Late morning (after one deep work block has "warmed up" the brain) or mid-afternoon (post-nap equivalent energy window, 3-4 PM).
- Examples: brainstorming, product ideation, writing first drafts (exploratory), design concepting.

**Communication Work blocks:**
- Definition: Meetings, calls, check-ins, 1-on-1s, team syncs. These are schedule anchors -- everything else is built around them.
- Batching principle: Group meetings together on the same days or at the same time of day whenever possible. "Meeting days" and "deep work days" is a well-established scheduling pattern used by executives (the "maker's schedule vs. manager's schedule" framework from Paul Graham). For users who control their calendar, aim for 2 heavy meeting days and 3 light meeting days per week.
- Recovery cost: Budget 15 minutes of transition buffer after any meeting over 30 minutes, and 5-10 minutes after standups.

### Step 4: Assign Blocks to the Schedule Using Energy-First Principles

Energy alignment is the single most important principle in time blocking. A misaligned schedule (shallow work in peak hours, deep work when exhausted) is worse than no schedule at all.

- **Peak energy hours → Deep Work and Creative Work only.** This is the non-negotiable core rule.
- **Medium energy hours → Communication, collaborative work, and engaged shallow work** (reading reports, reviewing documents, giving feedback).
- **Low energy hours → Pure shallow work:** inbox zero, scheduling, data entry, admin, watching recorded meetings.
- **Never place deep work immediately after a meeting.** The cognitive residue from a meeting (lingering thoughts, emotional processing, open loops) degrades focus for 15-30 minutes. Always insert a 15-minute buffer block -- use it to write meeting notes, close open loops, and mentally transition.
- **Never place a meeting immediately after deep work** if avoidable. The cognitive momentum from deep work is expensive to rebuild. If a meeting is unavoidable mid-morning, shift deep work to start the day (8:00-9:00) or block 9:30-11:00 after a standup.
- **The ultradian rhythm principle:** The brain's natural work-rest cycle runs approximately 90-120 minutes. Design deep work blocks to align with this: 90-minute block, 15-minute break, repeat. Do not fight this cycle -- users who do often crash by 2 PM.
- **For knowledge workers with significant autonomy:** Target a structure of 3-4 hours of deep work before noon, batched meetings in the early-to-mid afternoon, and shallow work and planning at the end of the day.

### Step 5: Build Buffer and Flex Block Architecture

Buffers and flex blocks are not padding -- they are the structural load-bearing elements that keep the schedule from collapsing.

- **Transition buffers (15 min):** Insert between every block type change. Between deep work and a meeting. Between a meeting and anything else. These are sacred -- do not let them be consumed by early meeting arrivals.
- **Daily overflow block (30 min):** One per day, placed in the afternoon. This absorbs tasks that took longer than estimated. If not needed, it becomes bonus deep work or genuine rest. Placing overflow blocks in the morning is a mistake -- they create permission to underperform in the morning knowing there is a catch-up net below.
- **Weekly flex block (60-90 min):** One per week, placed on Wednesday or Thursday afternoon. This handles urgent but unexpected work, long-overdue tasks surfaced during the week, and genuine fires that would otherwise detonate the whole schedule.
- **End-of-day shutdown block (15-20 min):** Every day, the final block is a shutdown ritual. Tasks: review the next day's schedule, move any incomplete tasks to specific future slots (not to a vague "later" pile), clear the inbox to a processed state (not necessarily zero), write the single most important task for tomorrow at the top of the plan. The shutdown block protects cognitive recovery -- it creates a clean cognitive boundary between work and non-work.
- **Protect lunch:** Lunch is a named block in the schedule, not empty space. Scheduling over lunch consistently is a common pattern that leads to afternoon energy crashes and decision fatigue by 4 PM. Minimum 30 minutes; 45-60 is better.

### Step 6: Apply the Weekly Balance Check

Before finalizing the schedule, run these five checks:

1. **Deep work hours check:** Knowledge workers should have 15-25 hours of deep work per week if they want to do exceptional work. Below 10 hours/week suggests meeting load is too high. Above 25 hours/week suggests tasks may be miscategorized or the user is underestimating restoration time.
2. **Meeting distribution check:** Are meetings clustered (good) or scattered (bad)? If a user has 90-minute gaps between meetings all day, they have a fragmented schedule. Recommend batching.
3. **Monday and Friday check:** Monday mornings are high-energy and should be protected for deep work, not meetings. Friday afternoons are low-energy and are ideal for shallow work, planning, and weekly reviews -- not for scheduling new deep work.
4. **Buffer percentage check:** Total buffer and flex time should be 15-20% of total available time. Below 15% means the schedule will break under real-world conditions. Above 25% means the schedule is too conservative and tasks will not get done.
5. **Task-to-block fit check:** Every task from the user's task list must appear in a specific named block. No task should be "floating." If there are more tasks than available deep work slots, surface this explicitly to the user and help them triage which tasks to defer to the following week.

### Step 7: Apply Naming and Specificity Rules to Every Block

A time-blocked schedule with vague block names fails within two days. The user opens the schedule, sees "Work on project," and immediately decision-fatigues.

- Every block must have a specific task name and a specific deliverable or stopping condition. Not "email" but "Process inbox to zero, batch-respond to all messages under 5 minutes, flag messages needing longer responses." Not "coding" but "Implement user authentication endpoint -- target: passing unit tests."
- Group similar small tasks together as a named batch. "Code review: PR #142 (Martinez) and PR #147 (Singh)" is specific. "Code review" is not.
- For recurring blocks (daily standup, weekly 1-on-1), the block name is the meeting name. For deep work blocks, the name is the specific project or deliverable being advanced.
- Blocks should have a stated exit condition where possible: "Stop when first draft is complete" or "Stop after 90 minutes regardless of progress." This prevents the dangerous pattern of a deep work block expanding to consume the rest of the day.

### Step 8: Deliver the Schedule and Calibration Instructions

The schedule is not the end product -- the ability to run and adjust it is.

- Present the full week grid (see Output Format).
- Include a set of schedule-specific rules tailored to the user's situation (not generic advice).
- Explain the first-week calibration protocol: the schedule is a hypothesis, not a commitment. After the first week, the user should identify which blocks were consistently violated, which tasks took longer than estimated, and which energy assumptions were wrong. Adjust in week 2.
- Tell the user which tools to use to implement it: Google Calendar (create recurring blocks with color-coding by block type), Notion or Todoist (as the underlying task list that feeds into blocks), or a paper planner (time-boxing with 15-minute grid). All three work -- the tool is less important than the habit of looking at the schedule before starting work each morning.
- Recommend a weekly review (Sunday evening or Monday morning, 20-30 minutes) to load tasks into next week's blocks. This is the maintenance ritual that keeps the system alive.

---

## Output Format

```
## Weekly Time-Block Schedule

### Schedule Parameters
- **Working hours:** [HH:MM] to [HH:MM], [days of week]
- **Peak energy window:** [HH:MM] to [HH:MM]
- **Secondary energy window:** [HH:MM] to [HH:MM]
- **Low energy window:** [HH:MM] to [HH:MM]
- **Total working hours/week:** [X] hours
- **Fixed commitments (total):** [X] hours/week
- **Net available hours:** [X] hours/week
- **Largest contiguous block per day:** [X] min (Mon), [X] min (Tue), etc.

---

### Block Type Legend
| Code | Type | Min Duration | Energy Zone | Notes |
|------|------|-------------|-------------|-------|
| [D] | Deep Work | 90 min | Peak only | Zero interruption |
| [S] | Shallow Work | 30 min | Low | Batched; not continuous |
| [C] | Creative Work | 60 min | Peak or secondary | Divergent/exploratory |
| [M] | Meeting/Comms | As scheduled | Any | Anchor point |
| [B] | Buffer/Transition | 15 min | N/A | Non-negotiable gap |
| [F] | Flex/Overflow | 30-60 min | N/A | Absorbs overruns |
| [X] | Fixed Commitment | As scheduled | N/A | Immovable |
| [R] | Rest/Break | 15-20 min | N/A | Performance tool |
| [L] | Lunch | 30-60 min | N/A | Protected; non-negotiable |
| [Z] | Shutdown Ritual | 15-20 min | Low | Daily end-of-day close |

---

### [Day 1 -- e.g., Monday]
| Time | Code | Task / Activity | Duration | Notes |
|------|------|----------------|----------|-------|
| HH:MM-HH:MM | [D] | [Specific task name -- deliverable or stopping condition] | XX min | |
| HH:MM-HH:MM | [B] | Transition buffer | 15 min | Write meeting notes if applicable |
| HH:MM-HH:MM | [M] | [Meeting name] | XX min | |
| HH:MM-HH:MM | [B] | Post-meeting cognitive reset | 15 min | Close open loops, notes |
| HH:MM-HH:MM | [D] | [Specific task name] | XX min | |
| HH:MM-HH:MM | [R] | Break -- step away from screen | 15 min | |
| HH:MM-HH:MM | [S] | [Batched shallow task description] | XX min | |
| HH:MM-HH:MM | [L] | Lunch | XX min | Protected |
| HH:MM-HH:MM | [S] | [Second shallow work batch] | XX min | |
| HH:MM-HH:MM | [F] | Daily overflow block | 30 min | For overruns; use as [D] if not needed |
| HH:MM-HH:MM | [D] or [C] | [Specific task] | XX min | Secondary energy window |
| HH:MM-HH:MM | [Z] | Shutdown ritual: review tomorrow, move tasks, set #1 priority | 15 min | |

[Repeat table for each working day]

---

### Weekly Summary Table
| Block Type | Hours/Week | % of Available Time | Target Range |
|-----------|-----------|---------------------|-------------|
| Deep Work [D] | X.Xh | XX% | 35-50% |
| Creative Work [C] | X.Xh | XX% | 5-15% |
| Shallow Work [S] | X.Xh | XX% | 15-25% |
| Meetings [M] | X.Xh | XX% | 10-20% |
| Buffers [B] | X.Xh | XX% | 8-12% |
| Flex/Overflow [F] | X.Xh | XX% | 4-8% |
| Rest/Break [R] | X.Xh | XX% | 5-8% |
| Lunch [L] | X.Xh | XX% | 5-8% |
| Shutdown [Z] | X.Xh | XX% | 2-4% |
| **Total** | **X.Xh** | **100%** | |

---

### Task Coverage Checklist
| Task | Estimated Duration | Block(s) Assigned | Day(s) | Covered? |
|------|--------------------|------------------|--------|---------|
| [Task name] | XX min | [D] block [HH:MM] | [Day] | Yes |
| [Task name] | XX min | [D] block [HH:MM] | [Day] | Yes |
| [Deferred task] | XX min | Not scheduled -- deferred to Week [N] | -- | Deferred |

---

### Schedule-Specific Rules
1. [Deep work protection rule specific to this user's situation]
2. [Meeting batching or interruption rule]
3. [Overflow/flex usage rule]
4. [End-of-day shutdown rule]
5. [Energy-specific rule based on their pattern]

---

### First-Week Calibration Notes
- Track which blocks overran and by how much
- Note which energy assumptions were incorrect
- Identify any fixed commitment that could be made flexible
- Revisit and adjust in Week 2
```

---

## Rules

1. **Never build the schedule before collecting all seven inputs from Step 1.** A schedule built on assumptions about working hours, energy, or commitments will fail by Tuesday. If the user is impatient, ask for working hours and task list at minimum, then flag what was assumed.

2. **Deep work blocks must be a minimum of 90 minutes.** This is not a stylistic preference -- it reflects the neuroscience of focused attention. The average time to reach a flow state is 23 minutes. A 60-minute "deep work" block yields fewer than 40 minutes of genuine deep focus. If the user's calendar does not have a single 90-minute contiguous gap, the schedule needs meeting restructuring before it needs task assignment.

3. **Never schedule deep work immediately after a meeting without a 15-minute buffer.** Meeting residue -- the cognitive tail of an unresolved conversation -- measurably degrades focus for 15-30 minutes. The buffer is not downtime; it is the cost of context-switching that will happen anyway, made explicit and contained.

4. **Shallow work must be batched, not scattered.** Two 30-minute email batches per day outperform eight 5-minute check-ins. Batching shallow work into named blocks eliminates the "quick check" habit that fragments deep work. Never let shallow work appear as a block shorter than 20 minutes -- at that length, the overhead of starting and stopping exceeds the value of the work done.

5. **The schedule must account for 100% of working hours.** Every minute from start time to end time must appear in a named block. Empty gaps in a schedule are not "free time" -- they are undefended time that will be colonized by interruptions, notifications, and reactive work. If the user genuinely wants unstructured time, label it as a [F] flex block or a [R] rest block, but name it.

6. **Total deep work hours must be cross-checked against total task demand.** If the user's task list requires 30 hours of deep work but their schedule only has 18 hours of deep work capacity, surface this immediately. Do not silently over-schedule. Offer to help triage which tasks to defer (use `eisenhower-matrix` for this step if needed).

7. **Friday afternoons must never receive new deep work.** Research on end-of-week cognitive performance consistently shows that complex analytical work initiated after Thursday noon has sharply higher error rates and lower completion rates. Friday afternoon is reserved for weekly review, shallow work, planning next week's blocks, and administrative closure. Violating this rule produces low-quality work and frustration.

8. **Meeting days and deep work days must be distinguished if the user has calendar control.** Users who can influence when meetings are scheduled should cluster meetings into 2-3 days per week, leaving 2 days with minimal meeting load for long-horizon deep work. A schedule that interleaves meetings and deep work every day is systematically less productive than one that separates them, even if total hours are identical.

9. **Every task in the task list must be assigned to a specific block or explicitly deferred.** Unassigned tasks create cognitive load even when they are not being worked on -- the brain continues processing open loops. If there is not enough capacity for a task, it must be actively deferred to a named future date, not left floating. Include a Task Coverage Checklist in the output.

10. **The shutdown ritual block is non-negotiable and must appear as the final block every day.** Users who skip end-of-day shutdown consistently report higher anxiety, poorer sleep quality (due to unresolved cognitive loops), and worse next-day task initiation. The 15-20 minutes of shutdown is not wasted time -- it is the ritual that makes the next morning's deep work block start faster and cleaner.

---

## Edge Cases

### User Has Back-to-Back Meetings Most of the Day
This is the most common failure mode for senior employees and managers. If the user's calendar shows fewer than two 90-minute contiguous gaps per day:

- First, audit which meetings are optional vs. required. Many recurring meetings can be converted to async updates (a 5-minute written summary replaces a 30-minute status call). Help the user identify 2-3 meetings that could be eliminated or shortened.
- Second, find the largest gap on each day, even if it is only 45-60 minutes. Assign the most cognitively demanding task that can be meaningfully advanced in that window -- "meaningfully advanced" means producing a concrete output, even a partial one.
- Third, recommend moving the first meeting of each day to 10:00 AM instead of 9:00 AM. This creates an 8:00-10:00 AM protected deep work block, which research shows is the highest-leverage schedule change available to meeting-heavy professionals.
- Flag the schedule explicitly: "This week's schedule is meeting-constrained. You have [X] hours of protected deep work. To increase this, consider: converting [meeting A] to async, declining [meeting B], and blocking 8:00-10:00 AM as focus time in your calendar."

### User Works Irregular Hours (Freelancer, Shift Worker, or Non-Standard Schedule)
Do not apply the 9-5 Monday-Friday template. Instead:

- Ask for each day's available hours individually -- they may be different every day.
- Note that circadian energy patterns shift with chronotype. A late chronotype (night owl) may have peak energy from 11 AM-2 PM and secondary peak from 7-9 PM, with low energy in the early morning. Do not default to "morning peak" without confirming.
- Build a per-day template rather than a repeating weekly one. Each day may have a unique structure.
- For freelancers with client-driven scheduling: designate "client-available" windows (when clients can book calls) separate from "deep work" windows (which clients cannot touch). Client calls should be batched to specific days.

### User Reports No Clear Energy Pattern
This is common for people in high-stress periods, people recovering from sleep deprivation, or people who have never paid attention to their energy.

- Do not guess. Provide the circadian default: peak 9:00-11:30 AM, secondary peak 3:00-5:00 PM, trough 1:00-3:00 PM. Build the initial schedule on this baseline.
- Instruct the user to run a one-week energy audit: every 90 minutes, rate energy on a 1-5 scale and note what they are working on. After 5 days, the pattern becomes visible.
- Note that the afternoon trough is strongly influenced by meal size. A heavy lunch deepens the 1-3 PM slump; a light lunch with a short walk can reduce it to 30-45 minutes instead of 90.

### User Resists Including Breaks
A substantial subset of users -- especially high performers and anxious workers -- resist scheduling breaks because they associate stopping work with falling behind.

- Do not argue philosophically. Present the operational case: sustained attention degrades measurably after 60-90 minutes without rest. The NASA Fatigue Management guidelines, research on air traffic controller performance, and attention restoration theory all point to the same threshold. A 15-minute break after 90 minutes of deep work produces higher quality output in the subsequent block than continuous work would.
- Frame breaks as a block type with a function, not as absence of work. "15-minute physical reset -- walk outside, no screens" is a productivity intervention.
- For users with ADHD or hyperfocus patterns: breaks may actually feel disruptive mid-flow. In this case, use the Pomodoro variant -- 52 minutes work, 17 minutes rest -- which research shows aligns better with the natural attention rhythm for many ADHD profiles than the 90-minute default.

### User Has Caregiving Responsibilities With Unpredictable Timing
Parents with young children, people caring for elderly relatives, or anyone with dependents requiring variable attention need a modified architecture:

- Add two flex blocks per day instead of one -- one in the morning, one in the afternoon.
- Explicitly designate each task as either "interruptible" or "protected." Shallow work tasks are interruptible by default. Deep work is protected, which means communicating to household members that certain hours require uninterrupted focus.
- Recommend a "nap window" strategy: if caregiving demands cluster around certain times (child's nap time, school hours), those windows become the primary deep work slots regardless of whether they fall in peak energy hours. Reliable solitude outweighs energy alignment when solitude is scarce.
- Build a "fragmented day" fallback plan: a set of 30-minute tasks that can be completed in standalone sessions, so that if caregiving demands fragment the day, something meaningful still gets done.

### User Has Previously Tried Time Blocking and Failed
This is the user who says "I've tried this before and it never sticks." The failure modes are predictable:

- **Over-precision failure:** The user made blocks too specific (8:37 AM: respond to email from David) and the schedule broke the moment one thing ran over. Solution: use 30-minute minimum block granularity and allow tasks to shift within a block type without guilt.
- **Under-protection failure:** The user scheduled every hour with tasks and had no buffers. The first meeting that ran 10 minutes long detonated the entire day. Solution: the 15-20% buffer rule.
- **Identity failure:** The user scheduled the "ideal" version of themselves rather than their actual current self. They put 5 hours of deep work on a day when they realistically have 2.5. Solution: start with a conservative schedule and let the user discover they have more capacity than planned.
- **Missing shutdown ritual:** Without the daily shutdown block, incomplete tasks pile up invisibly and the schedule becomes psychologically unsafe to look at. Solution: make the shutdown ritual the first habit installed, before the rest of the schedule is even built.

### User Is an Executive or Manager With 60%+ Meeting Load
High meeting load is not a failure of time management -- it may be appropriate to the role. The goal is not to reduce meetings but to protect the remaining capacity intelligently.

- Apply the "Maker/Manager" framework: identify which days are naturally meeting-heavy (Manager mode: responding, deciding, unblocking) and which can be protected (Maker mode: strategic work, deep thinking, writing).
- For executives, deep work blocks are typically 60-90 minutes max, and they may only have 8-12 hours per week. Every deep work block must be assigned to the highest-leverage item -- use `eisenhower-matrix` to validate task selection first.
- Recommend "office hours" blocks: two 30-minute daily windows where the user is available for questions, unblocking, and 1-on-1 drop-ins. This eliminates the random interruption pattern by giving it a named time and place.

---

## Example

**Input:**
"I work from home, 8 AM to 5 PM, Monday through Friday. I have a team standup at 9:00-9:15 AM every day and a 1-on-1 with my manager on Wednesdays 2:00-3:00 PM. I'm sharpest in the mornings, especially before 11 AM. After lunch I feel pretty slow until about 3 PM. My tasks this week are: finish writing a technical specification document (I'd say 4-5 hours of writing total), do code reviews for three open PRs (about 30-45 minutes each), build out a feature branch I've been starting (about 8 hours of development work), process my email backlog, and do general admin/Slack stuff. I have trouble staying off Slack and email during focus time."

---

**Output:**

## Weekly Time-Block Schedule

### Schedule Parameters
- **Working hours:** 8:00 AM to 5:00 PM, Monday-Friday (45 hours gross)
- **Peak energy window:** 8:00 AM -- 12:00 PM (mornings, pre-lunch)
- **Secondary energy window:** 3:00 PM -- 5:00 PM
- **Low energy window:** 12:30 PM -- 3:00 PM
- **Fixed commitments:** Daily standups (5 × 15 min = 1.25h) + Wednesday 1-on-1 (1h) = 2.25h/week
- **Lunch:** 5 × 30 min = 2.5h/week
- **Net available hours:** 45 - 2.25 - 2.5 = **40.25 hours/week**
- **Task demand estimate:** Technical spec (4.5h) + code reviews (2.25h) + feature branch (8h) + email/admin (5h/week assumed) = **19.75 hours of scheduled tasks**
- **Contiguous blocks:** Mon/Tue/Thu/Fri have two clean deep work gaps (8:00-9:00 and 9:30-12:00). Wednesday is meeting-constrained in the afternoon.

---

### Block Type Legend
| Code | Type | Min Duration | Energy Zone | Notes |
|------|------|-------------|-------------|-------|
| [D] | Deep Work | 90 min | Peak only | Phone on Do Not Disturb; Slack closed |
| [S] | Shallow Work | 30 min | Low | Email + Slack batched here only |
| [C] | Creative Work | 60 min | Peak/Secondary | Exploratory thinking tasks |
| [M] | Meeting/Comms | As scheduled | Any | Calendar anchor |
| [B] | Buffer/Transition | 15 min | N/A | Mandatory; absorbs meeting overrun |
| [F] | Flex/Overflow | 30 min | N/A | Absorbs task overruns; bonus [D] if unused |
| [X] | Fixed Commitment | As scheduled | N/A | Immovable |
| [R] | Rest/Break | 15 min | N/A | Step away from screen -- mandatory |
| [L] | Lunch | 30 min | N/A | Protected; eat away from desk |
| [Z] | Shutdown Ritual | 15 min | Low | Daily: review tomorrow, set #1 task |

---

### Monday
| Time | Code | Task / Activity | Duration | Notes |
|------|------|----------------|----------|-------|
| 8:00-9:00 | [D] | Technical spec -- Section 1: Architecture overview (target: complete section draft) | 60 min | Slack closed; phone DND |
| 8:55-9:00 | [B] | Transition to standup -- close editor, open notes | 5 min | |
| 9:00-9:15 | [X] | Team standup | 15 min | |
| 9:15-9:30 | [B] | Post-standup reset: write action items, close open loops | 15 min | |
| 9:30-11:30 | [D] | Technical spec -- Section 2: API design + data model (target: complete draft through data model) | 120 min | Slack closed; 90-min ultradian block + 30-min extension |
| 11:30-11:45 | [R] | Break -- walk outside, no screens | 15 min | |
| 11:45-12:15 | [D] | Code review: PR #142 (Martinez) -- full review with comments | 30 min | Shortened deep block; spec review appropriate here |
| 12:15-12:45 | [L] | Lunch -- away from desk | 30 min | Protected |
| 12:45-1:15 | [S] | Email batch 1: process inbox, respond to all under-5-minute items, flag longer ones | 30 min | First Slack check of day also here |
| 1:15-1:45 | [S] | Slack catchup: respond to all threads, clear notifications | 30 min | |
| 1:45-2:15 | [F] | Daily overflow block | 30 min | Use for spec overrun or PR if needed; bonus [S] if not needed |
| 2:15-2:30 | [B] | Transition buffer | 15 min | |
| 2:30-3:00 | [S] | Admin: update task list, check project board, file documents | 30 min | |
| 3:00-4:30 | [D] | Feature branch development -- implement authentication endpoint (target: passing unit tests) | 90 min | Secondary energy window; Slack closed |
| 4:30-4:45 | [B] | Transition | 15 min | |
| 4:45-5:00 | [Z] | Shutdown ritual: review Tuesday's blocks, assign #1 task, process any flagged emails | 15 min | |

---

### Tuesday
| Time | Code | Task / Activity | Duration | Notes |
|------|------|----------------|----------|-------|
| 8:00-8:55 | [D] | Feature branch development -- implement data persistence layer (target: schema migrations passing) | 55 min | Slack closed |
| 8:55-9:00 | [B] | Transition to standup | 5 min | |
| 9:00-9:15 | [X] | Team standup | 15 min | |
| 9:15-9:30 | [B] | Post-standup reset | 15 min | |
| 9:30-11:30 | [D] | Feature branch development -- continued (target: core business logic layer complete) | 120 min | Longest contiguous block of the week; protect fiercely |
| 11:30-11:45 | [R] | Break | 15 min | |
| 11:45-12:15 | [D] | Code review: PR #147 (Singh) -- full review with inline comments | 30 min | |
| 12:15-12:45 | [L] | Lunch | 30 min | Protected |
| 12:45-1:15 | [S] | Email batch 1: inbox processing | 30 min | |
| 1:15-1:45 | [S] | Slack catchup | 30 min | |
| 1:45-2:15 | [F] | Daily overflow block | 30 min | |
| 2:15-3:00 | [S] | Admin: documentation updates, project board, expense reports | 45 min | |
| 3:00-4:30 | [D] | Technical spec -- Section 3: Integration patterns and error handling | 90 min | |
| 4:30-4:45 | [B] | Transition | 15 min | |
| 4:45-5:00 | [Z] | Shutdown ritual | 15 min | |

---

### Wednesday (Meeting-Heavy Day)
| Time | Code | Task / Activity | Duration | Notes |
|------|------|----------------|----------|-------|
| 8:00-8:55 | [D] | Feature branch development -- implement API endpoints (target: GET and POST endpoints operational) | 55 min | Slack closed; protect this window -- it's the only long morning gap |
| 8:55-9:00 | [B] | Transition to standup | 5 min | |
| 9:00-9:15 | [X] | Team standup | 15 min | |
| 9:15-9:30 | [B] | Post-standup reset | 15 min | |
| 9:30-11:00 | [D] | Technical spec -- Section 4: Testing strategy and acceptance criteria (target: complete draft) | 90 min | This completes the spec; total spec writing: ~4.5h across Mon-Wed |
| 11:00-11:15 | [R] | Break | 15 min | |
| 11:15-12:00 | [D] | Code review: PR #153 (Okonkwo) -- full review | 45 min | Completes all 3 PR reviews for the week |
| 12:00-12:30 | [L] | Lunch | 30 min | Protected |
| 12:30-1:00 | [S] | Email batch 1 + Slack catchup | 30 min | |
| 1:00-1:45 | [S] | Admin + documentation | 45 min | |
| 1:45-2:00 | [B] | Pre-meeting prep: review agenda, open notes for 1-on-1 | 15 min | |
| 2:00-3:00 | [X] | 1-on-1 with manager | 60 min | |
| 3:00-3:15 | [B] | Post-1-on-1 notes: capture action items, decisions, follow-ups | 15 min | |
| 3:15-3:45 | [F] | Weekly flex block: urgent/unexpected tasks or spec final polish | 30 min | This is the week's primary flex block |
| 3:45-4:30 | [S] | Email batch 2: longer responses, flagged items | 45 min | |
| 4:30-4:45 | [B] | Transition | 15 min | |
| 4:45-5:00 | [Z] | Shutdown ritual | 15 min | |

---

### Thursday
| Time | Code | Task / Activity | Duration | Notes |
|------|------|----------------|----------|-------|
| 8:00-8:55 | [D] | Feature branch development -- implement error handling + validation layer | 55 min | Slack closed |
| 8:55-9:00 | [B] | Transition | 5 min | |
| 9:00-9:15 | [X] | Team standup | 15 min | |
| 9:15-9:30 | [B] | Post-standup reset | 15 min | |
| 9:30-11:30 | [D] | Feature branch development -- integration testing + bug fixes (target: end-to-end flow working) | 120 min | Deep block; this completes the 8h estimate for the feature branch |
| 11:30-11:45 | [R] | Break | 15 min | |
| 11:45-12:15 | [C] | Technical spec review -- read full draft, identify gaps, note open questions | 30 min | Transition from writing to reviewing; lower intensity |
| 12:15-12:45 | [L] | Lunch | 30 min | Protected |
| 12:45-1:15 | [S] | Email batch 1 | 30 min | |
| 1:15-1:45 | [S] | Slack + project board update | 30 min | |
| 1:45-2:15 | [F] | Daily overflow block | 30 min | |
| 2:15-3:00 | [S] | Admin + documentation | 45 min | |
| 3:00-4:30 | [D] | Spec revisions based on morning review -- finalize document | 90 min | Target: submit spec for review by EOD Thursday |
| 4:30-4:45 | [B] | Transition | 15 min | |
| 4:45-5:00 | [Z] | Shutdown ritual | 15 min | |

---

### Friday
| Time | Code | Task / Activity | Duration | Notes |
|------|------|----------------|----------|-------|
| 8:00-8:55 | [D] | Feature branch: write PR description, add inline code comments, prepare for review | 55 min | Submit feature branch PR before standup |
| 8:55-9:00 | [B] | Transition | 5 min | |
| 9:00-9:15 | [X] | Team standup | 15 min | |
| 9:15-9:30 | [B] | Post-standup reset | 15 min | |
| 9:30-10:30 | [S] | Email batch 1: full inbox processing, weekly unsubscribe pass | 60 min | Friday morning is good for slower email pace |
| 10:30-11:00 | [S] | Slack: clear all threads, respond to anything missed this week | 30 min | |
| 11:00-11:15 | [R] | Break | 15 min | |
| 11:15-12:00 | [F] | Flex block: anything that slipped this week; or early start on next week prep | 45 min | |
| 12:00-12:30 | [L] | Lunch | 30 min | Protected |
| 12:30-1:30 | [S] | Weekly review: review what got done, what slipped, what needs to move to next week | 60 min | |
| 1:30-2:30 | [S] | Next week planning: load tasks into Monday-Wednesday deep work blocks | 60 min | This is how the system stays alive |
| 2:30-3:00 | [S] | Admin wrap-up: documentation, time tracking, expense reports | 30 min | |
| 3:00-4:00 | [S] | Learning block: read one technical article or watch one talk (low stakes) | 60 min | Friday afternoons are for maintenance inputs, not deep outputs |
| 4:00-4:30 | [S] | Clear workspace: close tabs, archive files, tidy digital environment | 30 min | |
| 4:30-4:45 | [B] | Transition | 15 min | |
| 4:45-5:00 | [Z] | Shutdown ritual: full week close, set #1 task for Monday | 15 min | |

---

### Weekly Summary Table
| Block Type | Hours/Week | % of Available Time | Target Range |
|-----------|-----------|---------------------|-------------|
| Deep Work [D] | 19.5h | 48% | 35-50% |
| Creative Work [C] | 0.5h | 1% | 5-15% |
| Shallow Work [S] | 9.75h | 24% | 15-25% |
| Meetings [M] | 2.25h | 6% | 10-20% |
| Buffers [B] | 3.5h | 9% | 8-12% |
| Flex/Overflow [F] | 2.25h | 6% | 4-8% |
| Rest/Break [R] | 1.25h | 3% | 5-8% |
| Lunch [L] | 2.5h | 6% | 5-8% |
| Shutdown [Z] | 1.25h | 3% | 2-4% |
| **Total** | **42.75h** | **~100%** | |

*Note: Creative Work is low this week because the task list is execution-heavy (spec writing and coding). In a week with more strategic or exploratory tasks, target 3-6h of [C] blocks.*

---

### Task Coverage Checklist
| Task | Estimated Duration | Block(s) Assigned | Day(s) | Covered? |
|------|--------------------|------------------|--------|---------|
| Technical spec (writing + revisions) | 4.5h | Mon [D] 8-9 + 9:30-11:30; Tue [D] 3-4:30; Wed [D] 9:30-11; Thu [D] 3-4:30 | Mon, Tue, Wed, Thu | Yes |
| Code review: PR #142 (Martinez) | 30 min | [D] 11:45 | Monday | Yes |
| Code review: PR #147 (Singh) | 40 min | [D] 11:45 | Tuesday | Yes |
| Code review: PR #153 (Okonkwo) | 45 min | [D] 11:15 | Wednesday | Yes |
| Feature branch development | 8h | Tue [D] 8-9 + 9:30-11:30; Wed [D] 8-9; Thu [D] 8-9 + 9:30-11:30; Fri [D] 8-9 | Tue-Fri | Yes |
| Email + Slack processing | ~5h | Daily [S] batches (2×30 min/day) | Mon-Fri | Yes |
| Admin/documentation | ~2.5h | Daily [S] afternoon slots | Mon-Fri | Yes |

---

### Schedule-Specific Rules

1. **Slack and email are closed during all [D] blocks.** Both applications are quit (not minimized) from 8:00-9:00 AM and during all afternoon [D] blocks. The two [S] batches per day (12:45 and mid-afternoon) are the only sanctioned communication windows on focus-heavy days. If this creates anxiety at first, tell a colleague one trusted person can reach you by phone for genuine emergencies.

2. **The 8:00-9:00 AM deep work block is the highest-priority block of the day.** It exists before the standup and requires only 60 minutes of protection. Do not schedule calls, check messages, or do admin work before 9:00 AM. This block consistently produces disproportionate output because cognitive resources are fully restored from sleep and have not yet been depleted by decisions.

3. **Post-standup buffers (9:15-9:30) are not free time -- they are transition work.** Use them
