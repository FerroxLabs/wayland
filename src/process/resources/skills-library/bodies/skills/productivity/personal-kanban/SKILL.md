---
name: personal-kanban
description: |
  Designs a personal Kanban system with column definitions, WIP limits, card anatomy, flow rules, and a weekly maintenance protocol. Produces a complete, ready-to-use Kanban board specification for individual project tracking.
  Use when the user asks about setting up a personal Kanban board, visualizing their workflow, managing work-in-progress limits, or building a visual task management system.
  Do NOT use for team Kanban or Scrum boards (use business project-management skills), general task prioritization (use task-prioritization), or project milestone tracking (use milestone-planning).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management planning automation"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Personal Kanban

## When to Use

**Use this skill when:**
- A user wants to design or rebuild a personal Kanban board for solo task and project tracking -- they have multiple active workstreams and nothing is getting finished
- A user asks how to set WIP limits, explains they are constantly multitasking, or uses phrases like "I have too many things in flight" or "I start things but never finish them"
- A user wants to visualize their personal workflow from idea capture through completion, including blocked states
- A user asks about Kanban specifically for individual use: cards, columns, flow, throughput, or cycle time in a solo context
- A user wants to understand why their task list is failing them and needs a pull-based visual system instead of a linear to-do list
- A user is transitioning from a calendar-and-list system to a flow-based visual board and needs a complete operating model
- A user wants to measure their personal productivity -- how long work takes, how much they complete, where work gets stuck

**Do NOT use when:**
- The user is designing a board for a team, department, or squad -- column definitions, WIP limits, and maintenance protocols differ fundamentally (use team project-management or business Kanban skills)
- The user wants to prioritize a flat list of tasks without any visual system or workflow stages (use `task-prioritization`)
- The user needs to plan project milestones, deliverables, and dependencies across a timeline (use `milestone-planning`)
- The user wants a time-blocked daily schedule with calendar slots (use `time-blocking` -- Kanban does not assign time, it manages flow)
- The user wants a full GTD (Getting Things Done) capture-and-organize system with contexts, horizons, and weekly reviews (use `gtd-workflow` -- though personal Kanban and GTD can coexist as complementary layers)
- The user is asking about Scrum sprints, story points, velocity, or retrospectives (use `agile-sprint-planning`)
- The user needs a purely digital automation pipeline for tasks (use `workflow-automation`)

---

## Process

### 1. Diagnose the User's Current Workflow Pain

Before designing anything, establish what is broken. The board design follows the diagnosis.

- Ask the user: "What does your current task management look like, and what is the main thing going wrong?" Listen for specific failure modes:
  - **Too much WIP:** "I have 10 things started and nothing done." -- This user needs aggressive WIP limits and a pull discipline
  - **No visibility:** "I forget what I'm supposed to be doing." -- This user needs a physical or always-visible board, not a buried app
  - **Blocked work piling up:** "Things keep getting stuck waiting for other people." -- This user needs a Waiting column and a follow-up protocol
  - **Backlog swamp:** "My to-do list has 200 items and I don't know what to pick." -- This user needs Backlog segmentation (Ready vs. Someday)
  - **Context chaos:** "I have work tasks, a side project, and personal errands all mixed together." -- This user needs swimlanes or label discipline
- Ask about the volume of work: roughly how many tasks per week do they complete? How many are in flight at any time?
- Ask about task size distribution: are most tasks under 2 hours, or do they include multi-day projects?
- Identify the tool they are willing to use: physical sticky notes on a wall, Trello, Notion, GitHub Projects, a whiteboard, Obsidian's Kanban plugin. The tool shapes the implementation (physical boards cannot sort by label; Trello cannot enforce WIP limits automatically without a plugin)
- Do not skip this step -- a board designed for a freelance writer with 15 tasks per week should look nothing like one designed for a software developer with complex technical work and frequent external blockers

### 2. Define the Column Structure

Personal Kanban columns represent workflow states -- the real phases a piece of work passes through -- not categories or priorities. The canonical personal Kanban structure has 3 to 6 columns. More than 6 almost always indicates the user is conflating states with categories.

- **Minimum viable board (3 columns):** Backlog | In Progress | Done. Use this for users new to Kanban, users with simple workflows, or anyone who resists complexity. Start here and evolve.
- **Standard personal board (5 columns):** Backlog | This Week | In Progress | Waiting | Done. This is the right default for most individual knowledge workers.
- **Extended board (6 columns):** Add a "Review" or "Testing" column between In Progress and Done if the user's work has a consistent verification step (writers who need to edit before publishing, developers who run tests before closing a ticket, designers who need a final review pass)
- Column design principles:
  - Each column must represent a state the work is actually in, not a priority level
  - "High Priority" is not a column -- it is a label or a card position within Backlog
  - "This Week" is a commitment column, not a priority column -- it answers "what am I committing to this week?" not "what is most important?"
  - A "Waiting" or "Blocked" column is non-optional once the user has any external dependencies -- without it, blocked work sits in In Progress and pollutes the WIP count
  - Never create a "Paused" column -- paused work is either Waiting (blocked externally) or should return to This Week (deferred by choice). A Paused column becomes a graveyard.
- For each column, define explicitly:
  - **Purpose:** What is true about every card in this column?
  - **Entry rule:** What must be true for a card to enter this column?
  - **Exit rule:** What must happen before a card can leave this column?
  - **WIP limit:** The maximum number of cards allowed at any time

### 3. Set WIP Limits with Reasoning

WIP limits are the most important design decision in personal Kanban. Setting them wrong -- too high -- makes the board useless. Setting them arbitrarily -- without explaining why -- means the user will ignore them.

- **In Progress: Hard limit of 2-3.** The research-backed recommendation from David Anderson's Kanban method and Jim Benson's Personal Kanban (the two foundational texts) is 2 for deep work practitioners, 3 for generalist knowledge workers. Never more than 3 for a single person.
  - The cognitive cost of context switching is approximately 23 minutes of recovery time per interruption (from Gloria Mark's UC Irvine research). Three simultaneous tasks means you are never fully in any of them.
  - If the user protests, counter with: "Your current WIP limit is whatever number of things you're working on now. How is that working?" Start with 3 and tighten to 2 after the first month if cycle times are still long.
- **This Week: 5-7 items maximum.** One committed task per working day, plus 1-2 buffer for urgent inbounds. If the user works a 4-day week, the limit is 5-6.
  - "This Week" is a commitment, not a wish list. Pulling 15 items into This Week is just moving the problem one column to the right.
- **Waiting: 3-5 items.** More than 5 waiting items means the user has a follow-up problem or an external-dependency problem, not a Kanban problem.
  - If Waiting regularly fills to capacity, escalate: the user needs to renegotiate SLAs with dependencies or stop committing to work they cannot unblock themselves.
- **Backlog: Unlimited, but managed.** Backlog is not infinite storage -- it is the queue from which "This Week" pulls. Items older than 30 days with no movement should be deleted or moved to a Someday list that is reviewed monthly, not weekly.
- **Swimlane-level WIP limits (when swimlanes are used):** If using project swimlanes, set limits per swimlane (e.g., max 1 In Progress per project) AND a total In Progress limit across all swimlanes (still max 3 total). The per-project limit prevents one project from consuming all capacity.

### 4. Design the Card Anatomy

A Kanban card is not a sticky note with a title. Each card must contain exactly the information needed to act on it -- no more, no less. Over-engineering card fields creates friction and cards stop getting updated.

- **Required fields on every card:**
  - **Title:** Action-verb phrase describing the work. "Email" is not a title. "Send project update to Sarah with Q3 numbers attached" is a title. The test: could someone else pick up this card and know exactly what to do?
  - **Category/Label:** The project, context, or domain this card belongs to. Used for swimlanes and balance checks. Typical labels: Work, Side Project, Admin, Personal, Learning.
  - **Size estimate:** Use a 3-point scale -- Small (under 1 hour), Medium (1-4 hours), Large (4+ hours). Large items should be broken down before entering In Progress. The size estimate is set when the card is created, not when it is started.
  - **Date entered In Progress:** The start timestamp for cycle time calculation. Even on physical boards, write this date directly on the card when it moves into In Progress.
  - **Next Action:** The single immediate next physical action (GTD language). This is what you do the moment you pick up this card. It removes the startup cost of figuring out where you left off.
- **Optional fields (add only if the user's workflow requires them):**
  - **Due date:** Only relevant when there is an actual external deadline. If every card has a due date, they become meaningless. Reserve due dates for real commitments.
  - **Blocked reason and follow-up date:** Required on all Waiting cards. Without a reason and a date, the card disappears into Waiting forever.
  - **Energy level required:** Some practitioners tag cards Low/Medium/High energy to match tasks to mental state (high-energy creative work vs. low-energy admin). Useful for users who work nonstandard hours or have variable energy across the day.
  - **Linked resources:** A URL or file path to relevant material. More useful on digital boards (Trello, Notion) than physical.
- **Card hygiene rules:**
  - Maximum one task per card. "Write report AND schedule meeting with client" is two cards.
  - Card titles should not contain the word "continue" -- if work continues, the card stays in place; "continue" as a verb means the card was not properly sized.
  - Cards should never live in In Progress for more than 3 working days without moving. A card stuck that long is either too large (break it down), actually blocked (move to Waiting), or abandoned (move back to This Week or delete).

### 5. Establish the Pull System and Flow Rules

The pull system is what separates Kanban from a rebranded to-do list. Every flow rule must enforce the pull discipline.

- **Pull, never push:** A card moves from one column to the next only when the downstream column has capacity. You do not push work forward because it is "ready" -- you pull it forward because you have capacity to receive it.
  - Practical meaning: You do not put something in In Progress because you finished planning it. You pull it into In Progress when an In Progress slot opens up.
- **The pull sequence:**
  1. A card completes and moves to Done -- an In Progress slot opens
  2. You pull the highest-priority card from This Week into the open In Progress slot
  3. If This Week drops below 3 cards, you pull from Backlog during your next weekly review (not ad hoc during the week)
  4. New tasks are added to Backlog first, never directly to In Progress (except Expedite lane items)
- **Blocked card protocol:** When work in In Progress becomes blocked, move the card immediately to Waiting -- this frees the In Progress slot and makes the blockage visible. Do not let blocked cards sit in In Progress and create a false "at capacity" signal.
- **Emergency/expedite protocol:** Reserve one fast-track slot for genuinely urgent items that cannot wait for weekly planning. This is not a priority lane -- it is a true emergency bypass used for genuine urgency (a client has a crisis, a hard deadline appeared today). If this lane is used more than twice per week, the real problem is poor planning or boundary-setting, not a Kanban design problem.
- **The "no skipping" rule:** Cards move through every column in sequence. A card cannot jump from Backlog to Done without passing through In Progress. This maintains accurate cycle time data and prevents the habit of marking things "done" that were never formally in progress.
- **The "one home" rule:** A card exists in exactly one column at any moment. There is no "sort of in progress" or "almost done." The board must be an accurate reality, not a wish state.

### 6. Design the Weekly Maintenance Protocol

A Kanban board without a regular maintenance cadence decays within two weeks. Cards become stale, Backlog fills with zombie tasks, and the board stops being trusted. The weekly review is what keeps the system alive.

- **Frequency and duration:** Once per week, 15-20 minutes maximum. If it takes longer, the board has been neglected. Choose a consistent time -- Sunday evening or Friday afternoon are the two most effective times because they create a clean mental break between weeks.
- **The six-step weekly review sequence (execute in this order):**
  1. **Archive Done:** Move all cards in Done to an archive (a Done archive list in Trello, an archive section in Notion, or a "Completed" envelope for physical boards). Count completed cards -- this is your weekly throughput number. Write it down.
  2. **Review Waiting:** For each card in Waiting, check the follow-up date. If the date has passed, either take the follow-up action now (send the follow-up email, make the call) or escalate. If a Waiting card has been there for more than 10 days without movement, either accept that it will not happen and delete it, or restructure the task so it does not require the external dependency.
  3. **Review In Progress:** Are these cards genuinely in progress? Any card in In Progress for more than 3 days without movement belongs in Waiting (if blocked) or needs to be broken down into smaller units.
  4. **Backlog pruning:** Review every item in Backlog. Delete items older than 30 days that have not been touched. If you are not ready to delete it, move it to a Someday list. The Backlog should contain only items you could realistically start within the next 2-4 weeks.
  5. **Refill This Week:** Pull 5-7 cards from Backlog into This Week for the coming week. Apply balance checks -- do not pull all Work cards; include personal and side project tasks. Sequence by priority and size: pull at least one Small card for momentum and at least one high-priority card for progress.
  6. **Metrics update:** Record WIP compliance (did In Progress ever exceed the limit this week?), cycle time (average days from In Progress to Done), and throughput (cards completed). Three weeks of data is enough to spot patterns.
- **Daily micro-review (2 minutes, not optional):** Each morning, look at the board and answer three questions: What is in In Progress right now? Is anything blocked that should move to Waiting? Do I have an open In Progress slot I should fill? This is the daily standup you run with yourself.

### 7. Build the Metrics System

Personal Kanban without measurement is just a visual to-do list. The three metrics that matter most for personal use are cycle time, throughput, and WIP compliance. These three numbers, tracked weekly over a month, will tell you more about your personal productivity than any time-tracking app.

- **Cycle time:** The number of days (or hours for small tasks) from the moment a card enters In Progress to the moment it enters Done. Calculate the average for all cards completed in a given week.
  - Target: For knowledge work tasks, a personal cycle time average of 1-3 days is healthy. Longer averages indicate oversized tasks, blocked work, or too many competing priorities.
  - Trend matters more than absolute value: is your cycle time getting shorter or longer over the past 4 weeks?
- **Throughput:** The number of cards completed per week. This is your core productivity metric.
  - Do not optimize throughput blindly -- completing 12 tiny tasks is not better than completing 3 significant ones. Combine throughput with size distribution for a complete picture.
  - A declining throughput over 3+ weeks is a signal to investigate: is the WIP limit being violated? Is the Backlog underpopulated? Is Waiting filling up?
- **WIP compliance:** The percentage of days where In Progress count was at or below the WIP limit. Track this simply: at the end of each day, was In Progress at 3 or fewer? Yes/No for each of 5 working days = 0/5 to 5/5.
  - Target: 4/5 or 5/5 days per week. Consistently below 3/5 means the WIP limit is either too low for the user's actual workflow or the user lacks pull discipline. Investigate before raising the limit.
- **Blocked rate:** The percentage of cards that passed through Waiting before completing. A blocked rate above 40% indicates the user has a systemic dependency problem -- too much work relies on external parties. This requires a different solution than Kanban tuning.
- **Age of oldest Backlog item:** A canary metric. If the oldest Backlog item is more than 60 days old, the Backlog is being used as a guilt list, not a work queue. Prune aggressively.

### 8. Produce the Complete Board Specification

Deliver the full specification in one cohesive document that the user can use immediately as a reference during setup. The document must include: board setup parameters, column definitions table, card template, WIP limit rationale, flow rules, weekly maintenance checklist, and metrics tracking table.

- Do not produce only a summary -- the user should be able to hand this document to a Trello board, Notion database, or physical wall and set up the system from scratch in under 30 minutes
- Include tool-specific implementation notes for whatever platform the user named in Step 1
- Flag the three most common failure modes for this user's specific context (based on the diagnosis in Step 1) so they know what to watch for in the first month

---

## Output Format

```
## Personal Kanban System Specification

### System Summary
- **Owner:** [name or "Personal"]
- **Tool:** [Trello / Notion / Physical / Obsidian Kanban / GitHub Projects / other]
- **Board name:** [suggested name]
- **Created:** [date]
- **Primary context:** [work tasks / mixed / creative projects / etc.]
- **Diagnosed failure mode:** [multitasking / visibility / blocked work / backlog swamp / context chaos]

---

### Column Definitions

| Column | Purpose | WIP Limit | Entry Rule | Exit Rule | Notes |
|--------|---------|-----------|-----------|----------|-------|
| Backlog | All uncommitted work | Unlimited (max 30 active) | Any new task captured here first | Pulled to This Week during Sunday review | Prune items > 30 days at weekly review |
| This Week | Committed work for current week | 7 max | Pulled from Backlog during Sunday review only | Pulled to In Progress when slot opens | Balance labels across categories |
| In Progress | Actively being worked on RIGHT NOW | 3 (hard limit) | Only when In Progress count < 3; pulled from This Week | Complete → Done; Blocked → Waiting | Never exceeded; blocks new starts |
| Waiting | Blocked on external party or dependency | 5 max | From In Progress when work is externally blocked | Unblocked → back to In Progress | Must have follow-up date on card |
| Done | Completed work this week | Unlimited | From In Progress when work is fully complete | Archived during weekly review | Archive weekly, never delete permanently |

---

### Card Template

```
[Label: Work / Side Project / Personal / Admin / Learning]

TASK: [Action-verb title -- specific enough that anyone could pick it up and start]
Size: [S = under 1 hour | M = 1-4 hours | L = 4+ hours]
Added to In Progress: [YYYY-MM-DD]
Due: [YYYY-MM-DD or "None"]
Next Action: [The single immediate physical step to take when picking up this card]
Blocked Reason (Waiting only): [Why it is blocked and who/what is needed]
Follow-up Date (Waiting only): [YYYY-MM-DD]
```

---

### WIP Limits Reference

| Column | Limit | Reason | What to Do at Limit |
|--------|-------|--------|-------------------|
| In Progress | 3 | Context-switching cost: 23-min recovery per switch; 3+ tasks means none get full attention | Finish one task or move one to Waiting before pulling anything new |
| This Week | 7 | One per working day + 2 buffer for urgent inbound | Resist pulling more; if you do, remove a lower-priority item first |
| Waiting | 5 | More than 5 blocked items = systemic dependency problem | Follow up on the oldest before adding a new Waiting card |
| Backlog (active) | 30 | Above 30, the board becomes a guilt list | Prune items > 30 days old at weekly review |

---

### Flow Rules (Ordered by Priority)

1. **Pull, never push.** Work moves to the next column only when that column has capacity -- never because the work is "ready" from the upstream perspective.
2. **Finish before starting.** In Progress at limit? Complete or block a card before pulling a new one. No exceptions.
3. **One column per card.** Every task is in exactly one state. No "sort of done" or "mostly in progress."
4. **Block visibly.** Blocked work moves immediately to Waiting. It does not stay in In Progress.
5. **Waiting requires a date.** Every card in Waiting has a follow-up date. No date, no Waiting -- it returns to This Week or is deleted.
6. **New tasks enter Backlog first.** No task goes directly to In Progress unless it is a genuine Expedite item (real urgency, not just importance).
7. **No backward movement.** Cards move left to right only. If a "done" task needs rework, create a new card.
8. **Size before In Progress.** Large (L) tasks are broken into Medium or Small sub-tasks before entering In Progress.

---

### Weekly Maintenance Protocol

**When:** [Day of week], [Time], recurring -- 15-20 minutes maximum

- [ ] **Archive Done:** Move all Done cards to archive. Count them -- record throughput.
- [ ] **Review Waiting:** Check follow-up dates. Act on or escalate any item past its date.
- [ ] **Review In Progress:** Any card untouched for 3+ days? Move to Waiting (if blocked) or break down (if oversized).
- [ ] **Prune Backlog:** Delete or move to Someday any item older than 30 days with no movement.
- [ ] **Refill This Week:** Pull 5-7 items from Backlog. Balance across labels. Sequence by priority.
- [ ] **WIP check:** Did In Progress exceed the limit any day this week? Investigate root cause.
- [ ] **Record metrics:** Log throughput, cycle time average, WIP compliance score for the week.

---

### Metrics Tracker

| Metric | Definition | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|-----------|--------|--------|--------|--------|--------|
| Throughput | Cards completed this week | [set after week 2 baseline] | | | | |
| Avg cycle time | Avg days from In Progress → Done | < 3 days | | | | |
| WIP compliance | Days In Progress ≤ limit / 5 days | 4/5 or 5/5 | | | | |
| Blocked rate | Cards passing through Waiting / total completed | < 40% | | | | |
| Backlog age | Days since oldest active Backlog item was added | < 30 days | | | | |

---

### First-Month Watch List

Based on your diagnosed failure mode ([multitasking / visibility / blocked work / backlog swamp / context chaos]), watch for these failure patterns in the first 4 weeks:

1. **[Specific failure mode 1 for this user's context]:** [What it looks like + what to do]
2. **[Specific failure mode 2]:** [What it looks like + what to do]
3. **[Specific failure mode 3]:** [What it looks like + what to do]

---

### Tool-Specific Setup Notes

**[Tool the user selected]:**
- [Concrete setup step 1]
- [Concrete setup step 2]
- [Concrete setup step 3]
- [Any limitations of this tool + workaround]
```

---

## Rules

1. **Never produce a partial specification.** The output must always include all seven components: system summary, column definitions, card template, WIP limits, flow rules, weekly maintenance checklist, and metrics tracker. A partial spec will be ignored or misimplemented.

2. **In Progress WIP limit is 2 or 3 -- never higher for a single person.** If the user argues for 5 or 6, restate the cognitive switching cost and offer to start at 3 with a review after 3 weeks. Raising a WIP limit after seeing data is fine; setting it high from the start negates the system entirely.

3. **Diagnose before designing.** The column structure, WIP limits, and maintenance frequency must follow from the user's specific failure mode. A user with a Backlog swamp problem needs Backlog segmentation, not just a prettier board. A user with a blocked-work problem needs a Waiting protocol, not just a Done column.

4. **"Paused" is not a valid column.** If a user requests a Paused column, redirect them: paused work that is externally blocked belongs in Waiting (with a follow-up date); paused work that is internally deferred belongs back in This Week or Backlog. Paused columns become task graveyards within two weeks.

5. **Large tasks (4+ hours) must be broken down before entering In Progress.** This is not a preference -- it is the rule. A card that cannot be completed in one working session creates a blocked In Progress slot that may span multiple days, distorting cycle time data and creating the illusion of perpetual progress.

6. **Every Waiting card must have a follow-up date and a reason.** A Waiting column without dates is a Graveyard column with a different name. If the user cannot specify a follow-up date, the card should return to Backlog until the dependency is more concrete.

7. **Backlog is a ready queue, not a long-term storage system.** Items in Backlog should be actionable within the next 30 days. Aspirational someday items belong in a separate Someday list (reviewed monthly, not weekly). Conflating Backlog and Someday is the most common cause of Backlog swamp.

8. **WIP compliance is measured daily, not weekly.** A user who violates WIP limits Monday through Thursday and fixes it Friday has a 1/5 compliance score, not "in compliance this week." The daily measurement creates the behavioral feedback loop that makes the limit real.

9. **Never use "priority" as a column name.** Priority is a card attribute (position in Backlog, label color, or explicit priority field), not a workflow state. A column named "High Priority" will fill with every task the user feels guilty about and will never empty.

10. **The board must reflect reality, not aspiration.** If a card is in In Progress but has not been touched in 4 days, it is not In Progress -- it is blocked or abandoned. The board loses its value the moment cards start representing what the user wishes were true rather than what is actually true. Reinforce this in the weekly maintenance protocol: if the user finds stale In Progress cards during the review, that is data about over-commitment, not a board failure.

11. **Include tool-specific implementation notes.** A Trello implementation looks different from an Obsidian Kanban implementation -- Trello uses cards within lists, labels for categories, and requires a Power-Up (like Kanban Power-Up) for WIP limit enforcement; Obsidian Kanban enforces nothing automatically but allows inline metadata and local markdown access. Never give tool-agnostic advice when the user has named a specific tool.

12. **The weekly review is a hard commitment, not optional advice.** Without the weekly review, the Backlog decays, Waiting cards are forgotten, and the board becomes a stale artifact within 3 weeks. Frame the 15-20 minute weekly review as a non-negotiable system requirement, not a nice-to-have habit.

---

## Edge Cases

### User Has 100+ Items in Their Current Task List

When the user's existing backlog is massive, a single undifferentiated Backlog column will never be trusted or maintained. Do not simply migrate all 100+ items into Backlog.

- Split the Backlog into two tiers immediately: **Ready Queue** (items actionable within the next 3 weeks, hard limit of 20-25 items) and **Someday/Maybe** (everything else, reviewed monthly not weekly)
- Run a rapid triage session with the user before setting up the board: for each item, ask "Could you realistically start this in the next 3 weeks?" Yes → Ready Queue. No or unsure → Someday/Maybe. Cannot remember why it's there → delete.
- Items can graduate from Someday/Maybe to Ready Queue only during the monthly review, not ad hoc. This prevents the Ready Queue from bloating again.
- The monthly Someday/Maybe review is a separate 30-minute session, distinct from the weekly 15-minute maintenance. Note this difference explicitly in the system specification.

### User Has Multiple Unrelated Projects (3+ Active Workstreams)

A flat column structure will cause different projects to compete invisibly for the same WIP slots, typically resulting in one project consuming all capacity while others stall.

- Add horizontal swimlanes -- one row per active project. Recommended maximum: 4 swimlanes (any more and the board becomes cognitively overwhelming)
- Set a per-swimlane WIP limit for In Progress of 1-2 cards, AND maintain a cross-swimlane total limit of 3. The cross-swimlane limit is the binding constraint.
- Label cards with project names rather than categories -- "Project Alpha," "Blog," "Home Renovation" -- so balance is visually obvious
- If the user has more than 4 active projects, this is a prioritization problem, not a board design problem. Escalate: help them identify which 2-3 projects are active and which should be parked in Someday/Maybe until others complete.
- Apply the swimlane structure only to In Progress and Waiting columns. Backlog and This Week can remain flat with label filtering.

### User Frequently Receives Urgent Interruptions That Bypass All Planning

Some users work in genuinely reactive environments (client services, operations, IT support) where external demands arrive daily and override planned work. A strict pull system will fail if urgent work has no home.

- Add a dedicated **Expedite lane** -- a single horizontal row above all other swimlanes that has a hard WIP limit of 1. This lane bypasses This Week and pulls directly from an inbound trigger (email, Slack, phone call) into In Progress.
- The Expedite lane has a separate cycle time metric -- expedite items should complete in under 24 hours. If an expedite item is still in the lane after 24 hours, it was not truly urgent and should be reclassified.
- Track Expedite usage: how many times per week is the lane activated? If the answer is consistently more than 2, the user has a boundary or expectation-setting problem. The Kanban system should surface this data; solving it requires a different intervention (communication skills, SLA renegotiation, capacity planning with a manager).
- Expedite cards compete against the total In Progress WIP limit -- if the Expedite slot is occupied, all other In Progress work pauses. This is by design: interruptions have a visible cost.

### User Works on Long-Running Projects Where Individual Tasks Are Hard to Define

Some users work on open-ended creative or research projects where progress is not easily chunked into discrete cards (writing a dissertation, developing a software architecture, planning a complex event).

- Use **milestone cards** for long-running projects within the Kanban system: the card represents not the full project but the next concrete deliverable (not "Write book" but "Complete Chapter 3 draft -- 2,500 words," not "Build app" but "Complete user authentication flow")
- Set a size limit: if a card cannot be completed in 3 days or fewer at a realistic working pace, it is a milestone card and belongs in Backlog until it is broken into session-sized sub-tasks
- For open-ended research or exploration tasks, use time-boxing instead of completion criteria: "Spend 2 hours researching competitor pricing models" is a valid card; "Research competitors" is not
- Add a **Projects reference section** alongside the Kanban board (a separate list, note, or document) that contains the full scope of each long-running project, its milestone sequence, and its current status. The Kanban board contains only the current active task for each project, not the full project plan.

### User Shares a Physical or Digital Space with a Partner or Housemate

Household Kanban boards sometimes serve two people. The standard personal Kanban model breaks down when card ownership is ambiguous.

- Add an **Owner field** to every card -- initials work for physical boards, assigned member feature for Trello/Notion
- WIP limits apply per owner: each person has their own In Progress limit of 3 (not 3 total for both people). Use swimlanes to separate each person's In Progress visually.
- Shared cards -- tasks requiring both people (moving apartments, planning a trip) -- belong in a third swimlane with a shared WIP limit of 1-2
- The weekly review becomes a joint 20-minute session, not two separate reviews. Separate reviews lead to uncoordinated Backlog management.
- If the two people have significantly different working styles (one prefers digital, one prefers physical), do not force a shared tool. Maintain two boards that reference a shared project list rather than forcing an uncomfortable unified interface.

### User Is New to Kanban and Feels Overwhelmed by the Full System

A user who has never used Kanban should not be handed a 6-column board with swimlanes, WIP limits, cycle time metrics, and an Expedite lane on day one.

- Start with the **3-column minimum viable board:** Backlog | In Progress | Done
- Apply only one rule strictly in week one: In Progress WIP limit of 3. No other rules need to be enforced until the user has used the board for 7 days.
- Introduce the This Week commitment column in week 2 once the user understands the pull principle
- Introduce Waiting in week 3 if blocked work has appeared
- Introduce metrics in week 4 once there are 3+ weeks of data to work with
- Document this **4-week onboarding sequence** in the system specification when producing the output for a new user. Do not deliver the full system and expect a new user to adopt it all at once -- Kanban's simplicity is the feature, and adding complexity too fast negates it.

### User Has Already Set Up a Board That Isn't Working

When the user has an existing board that has decayed or is being ignored, do not simply redesign it. Diagnose why it failed first.

- Ask the user to describe their current board: how many columns, current card counts, last time they updated it
- The most common causes of board failure are: (a) WIP limits not being enforced, (b) Backlog used as a dump rather than a ready queue, (c) no weekly maintenance cadence, (d) cards too large to complete in a session, (e) board not visible enough in the user's daily environment
- Do a **board autopsy** before redesigning: identify which of the five failure modes applies, fix the structural cause, then produce a revised specification
- Do not recommend "starting fresh" as the first option -- migrating working cards from an existing board preserves momentum and avoids the psychological fresh-start that lets users ignore all previous commitments

---

## Example

**Input:** "I need help setting up a personal Kanban board. I'm a freelance UX designer. I juggle client work for 3-4 clients at once, plus I'm trying to write a design blog on the side and do some professional development (I'm learning Figma prototyping advanced features). I use Trello already but my board is a mess -- I have like 80 cards in my To Do list and nothing feels organized. I end up working on whatever feels most urgent and I can never tell if I'm making progress. I probably complete 3-5 tasks per week but I feel like I should be doing more."

**Output:**

---

## Personal Kanban System Specification

### System Summary
- **Owner:** Personal (Freelance UX Designer)
- **Tool:** Trello
- **Board name:** "UX Work Hub -- Personal Kanban"
- **Created:** [today's date]
- **Primary context:** Multi-client freelance work + side projects
- **Diagnosed failure mode:** Backlog swamp (80-card To Do list) + reactive prioritization (working on whatever feels urgent)

---

### Column Definitions

| Column | Purpose | WIP Limit | Entry Rule | Exit Rule | Notes |
|--------|---------|-----------|-----------|----------|-------|
| Someday/Maybe | Long-term ideas and deferred work | Unlimited | Any task not actionable in next 3 weeks | Pulled to Backlog during monthly review only | Reviewed monthly on the 1st; not in weekly flow |
| Backlog (Ready) | Tasks actionable within the next 3 weeks | 25 max | Any new task; items graduated from Someday/Maybe | Pulled to This Week during Sunday review | Max 25 items enforced; prune at weekly review |
| This Week | Committed work for the current week | 8 max | Pulled from Backlog every Sunday evening | Pulled to In Progress when slot opens | Balance across clients + blog + learning |
| In Progress | Actively working on RIGHT NOW | 3 (hard limit) | Only when In Progress count < 3; pulled from This Week | Complete → Done; Blocked → Waiting | The binding constraint of the whole system |
| Waiting | Blocked on client feedback, asset, or external input | 4 max | From In Progress when externally blocked | Back to In Progress when unblocked | Must have follow-up date; check Wednesdays |
| Done | Completed this week | Unlimited | From In Progress when fully complete | Archived every Sunday | Count before archiving for throughput metric |

---

### Your Immediate Setup Task: Triage the 80-Card Backlog

Before setting up the board, run a 30-minute triage session on your existing 80 cards. For each card, answer one question: "Can I realistically start this in the next 3 weeks?" 

- **Yes:** Move to Backlog (Ready). Stop adding when you hit 25 -- the rest are Someday/Maybe.
- **No / Not yet:** Move to Someday/Maybe.
- **Not sure why this is here:** Delete. If it surfaces again, it matters.

Expected outcome: 15-25 cards in Backlog (Ready), 40-50 in Someday/Maybe, 10-15 deleted. This is normal and correct.

---

### Card Template

```
[Label: Client A / Client B / Client C / Client D / Blog / Learning]

TASK: [Action-verb phrase -- specific and completable in one work session]
Size: [S = under 1 hour | M = 1-4 hours | L = 4+ hours -- no L cards in In Progress]
Added to In Progress: [YYYY-MM-DD]
Due: [YYYY-MM-DD or "None" -- only fill if hard external deadline exists]
Next Action: [Single immediate step to take when picking up this card]

-- Waiting cards only --
Blocked reason: [What is needed, from whom]
Follow-up date: [YYYY-MM-DD]
```

**Good card title examples for your context:**
- "Write first draft of 'Typography in Mobile UX' blog post -- target 800 words" ✓
- "Create 3 homepage wireframe variations for Client B -- based on brief received Oct 12" ✓
- "Complete Figma advanced prototyping module 4 -- conditional logic" ✓
- "Client work" ✗ (not actionable)
- "Blog post" ✗ (not specific enough to pick up without thinking)
- "Wireframes" ✗ (no client, no scope, no next action)

---

### WIP Limits Reference

| Column | Limit | Reason | What to Do at Limit |
|--------|-------|--------|-------------------|
| In Progress | 3 | You are currently reactive across 4+ work streams. Three simultaneous tasks is the maximum before context-switching costs exceed the benefit of multitasking. | Stop. Complete one task or move one blocked task to Waiting before pulling anything new. No exceptions. |
| This Week | 8 | Four clients plus blog plus learning = 6 workstreams. Eight committed tasks = ~1.5 per stream per week, which is realistic given freelance variability. | If you want to add a 9th, remove a lower-priority card first. |
| Waiting | 4 | Freelance design frequently creates client-approval blockers. Four waiting items is the threshold before the issue becomes systemic -- if you hit 4, follow up on the oldest immediately. | Follow up on the oldest Waiting card before adding a new one. |
| Backlog (Ready) | 25 | Above 25 active-backlog items, selection paralysis defeats the purpose of the ready queue. | Excess items go to Someday/Maybe during weekly review. |

---

### Flow Rules

1. **Pull, never push.** A card enters In Progress only when an In Progress slot opens. You do not push client work in because the client just sent assets -- you pull it in when you have capacity.
2. **Finish before starting.** In Progress at 3? Finish something or move something to Waiting. Do not negotiate with yourself about "just this one extra."
3. **L-size tasks do not enter In Progress.** Break any Large task into M or S sub-tasks first. "Complete full UX audit for Client C" is not an In Progress card. "Complete heuristic review section of UX audit -- 3 screens" is.
4. **New tasks enter Backlog first.** When a client sends new work, it goes to Backlog (or Someday/Maybe), not directly to In Progress. Evaluate it at Sunday planning. Expedite only for genuine same-day deadlines.
5. **Client-approval blocks move immediately to Waiting.** The moment you are waiting on client feedback, the card moves to Waiting and frees the In Progress slot. You do not hold the slot "in case they respond today."
6. **Waiting requires a follow-up date.** Every card in Waiting has a date by which you will follow up if you have not heard back. Default follow-up window for clients: 3 business days.
7. **This Week is set on Sunday and not changed during the week.** Resist mid-week additions to This Week -- they go to Backlog and are considered at next Sunday's planning. If something is genuinely urgent, use the single Expedite slot and accept that it displaces In Progress.
8. **No card stays in In Progress for more than 3 days untouched.** At day 3, you either work on it, move it to Waiting, or return it to This Week with an honest re-evaluation of when it will actually get done.

---

### Trello-Specific Setup Notes

**Lists to create (left to right):**
1. Someday/Maybe
2. Backlog (Ready) -- [max 25]
3. This Week -- [max 8]
4. In Progress -- [max 3] ← most important list; keep this visible
5. Waiting
6. Done
7. Archived Done (create as a separate board or use the "Archive all cards" feature at end of each month)

**Labels to create:**
- 🔵 Blue: Client A [use your actual client names or codes for privacy]
- 🟢 Green: Client B
- 🟠 Orange: Client C
- 🟣 Purple: Client D
- 🟡 Yellow: Blog
- ⚪ Gray: Learning / Professional Dev
- 🔴 Red: Expedite (use sparingly)

**WIP limit enforcement in Trello:**
Trello does not natively enforce WIP limits. Use two workarounds:
- Option 1: Edit the list name to include the limit in brackets: "In Progress [max 3]" -- the visual reminder is enough for most users
- Option 2: Install the "Kanban WIP for Trello" Power-Up (available in Trello's Power-Up directory) for automatic warnings when a list exceeds its limit

**Due dates in Trello:**
Only add due dates to cards with real external deadlines. Trello highlights overdue cards in red -- if every card is red, the system stops communicating meaning. Reserve red for genuine deadline urgency.

**Card aging:**
Trello does not show card age natively. Use the description field to record the date a card entered In Progress. During weekly review, check for any In Progress cards whose In Progress date is more than 3 days old.

---

### Weekly Maintenance Protocol

**When:** Sunday evenings, 7:00-7:20 PM -- set a recurring calendar block named "Kanban Weekly Review (non-negotiable 20 min)"

Execute in this sequence:

- [ ] **Archive Done cards.** Count them before archiving. Write the number down: "Week of [date]: [X] cards completed." This is your throughput log.
- [ ] **Review Waiting.** For each Waiting card: has the follow-up date passed? If yes, send the follow-up email or make the call tonight -- do not defer it to "this week." If a Waiting card has been there more than 10 days, escalate or delete.
- [ ] **Review In Progress.** Any cards untouched since before Wednesday? Move to Waiting (if blocked) or break down and return to This Week (if oversized).
- [ ] **Prune Backlog (Ready).** Delete or demote to Someday/Maybe any card older than 30 days with no movement. Your target: under 25 cards in Backlog after this step.
- [ ] **Refill This Week.** Pull 6-8 cards from Backlog into This Week. Apply the balance check: aim for at least 1 card per active client, 1 blog card, and 1 learning card per week. Do not load all client work and skip the blog every week -- that pattern will kill the blog within a month.
- [ ] **Record metrics.** Log throughput, note any WIP violations this week, and estimate average cycle time.

**First Sunday special task:** Triage the 80-card backlog before the regular review steps. This one-time 30-minute session sets the foundation.

---

### Metrics Tracker

| Metric | Definition | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|-----------|--------|--------|--------|--------|--------|
| Throughput | Cards moved to Done this week | Baseline weeks 1-2; target 6-8 from week 3 | | | | |
| Avg cycle time | Days from "Added to In Progress" → Done | < 2.5 days | | | | |
| WIP compliance | Days In Progress ≤ 3 out of 5 | 4/5 or 5/5 | /5 | /5 | /5 | /5 |
| Blocked rate | Waiting cards / total Done cards | < 35% (freelance norm is higher than in-house) | | | | |
| Backlog (Ready) size | Count of cards in Backlog list | < 25 | | | | |
| Blog card completions | Blog cards completed per month | ≥ 3 per month | | | | |

**Throughput note:** You currently complete 3-5 tasks per week. After the backlog triage and with a strict WIP limit of 3, expect throughput to drop slightly in week 1 (while you clear the backlog confusion) and rise to 6-8 in weeks 3-4 as cycle times shorten. The goal is not more tasks -- it is shorter, more reliable cycle times.

---

### First-Month Watch List

Based on your situation (80-card backlog swamp + reactive prioritization across 4+ clients), watch for these failure patterns:

1. **Mid-week This Week additions:** A client sends something "urgent" and you pull it directly into This Week (or In Progress) mid-week, displacing planned work. This Week is locked after Sunday. Urgent client work goes into the Expedite slot or waits for Sunday. If a client's work is genuinely same-day urgent, move the lowest-priority card in This Week back to Backlog to make room -- consciously, not accidentally.

2. **Client work crowding out blog and learning:** The labels in This Week will reveal this pattern within 2 weeks. If you look at your Done archive after a month and see only client cards, the blog and learning goals are being sacrificed to reactive client work. Protect 2 of your 8 This Week slots for non-client work -- treat them as pre-allocated before client work is pulled.

3. **Backlog (Ready) creeping back above 25:** After the initial triage, new work will arrive and old habits will pull items out of Someday/Maybe early. Check the Backlog count every Sunday. If it has crept above 25, immediately identify the 5 most recently added items and ask: "Are these actually ready-queue items, or did I pull them out of Someday/Maybe too early?"
