---
name: context-switching-reduction
description: |
  Designs a personal work context system that minimizes cognitive switching costs. Groups tasks by context, assigns time blocks, sets transition rules, and produces a context-optimized schedule.
  Use when the user asks about reducing context switching, batching similar work, minimizing distractions, or improving focus by grouping related tasks.
  Do NOT use for general time blocking (use time-blocking), email-specific management (use inbox-zero), or team workflow optimization (use business operations skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management optimization planning"
  category: "productivity"
  subcategory: "task-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Context Switching Reduction

## When to Use

**Use this skill when:**
- The user describes a fragmented workday -- bouncing between coding, Slack, email, meetings, and admin tasks dozens of times without completing anything fully
- The user reports ending the day exhausted but feeling like they accomplished little, which is the hallmark symptom of high switching costs rather than insufficient effort
- The user explicitly wants to batch similar work together -- consolidating all code reviews, all meetings, or all communication into dedicated windows
- The user describes "getting interrupted just as they were getting into flow" repeatedly, indicating deep work contexts are not protected
- The user tracks their time and notices a large percentage is spent in transitions, context-loading, or re-orienting to a task rather than doing the task itself
- The user is a knowledge worker (developer, writer, analyst, designer, researcher) whose output quality degrades sharply when context is disrupted mid-stream
- The user wants to implement an async-first work style and needs a system to support batched communication rather than real-time reactivity
- The user is returning from a productivity audit or time-tracking exercise and sees high task-switching frequency in their data

**Do NOT use when:**
- The user needs a general time-blocked schedule without the specific context-grouping and switching-cost analysis this skill provides -- use `time-blocking` instead
- The user's primary problem is email volume and processing, not context switching -- use `inbox-zero` for that specific workflow
- The user needs to decide which tasks to do, not how to batch the ones they already have -- use `task-prioritization` first, then return here
- The user is optimizing how a team hands off work, runs standups, or manages parallel workstreams -- that is a business operations problem, not a personal context problem
- The user wants a capture system for tasks and ideas that are currently slipping through the cracks -- use `task-capture-system` first to stabilize their inputs
- The user's core issue is procrastination or task avoidance, not switching -- context batching will not solve an avoidance problem and may enable it
- The user is in a role where real-time responsiveness is a performance requirement written into their job description (e.g., on-call incident response, live customer support) -- a different skill covering reactive work management applies

---

## Process

### Step 1: Conduct a Switching Audit

Before designing any system, establish a data-based picture of the current state. Do not accept vague descriptions like "I switch a lot" -- quantify it.

- Ask the user to describe their last three typical workdays in narrative form: what they worked on, in what order, and what interrupted them
- Count the distinct task-type transitions in their description -- each shift from one cognitive mode to another counts as one switch, even within the same project (e.g., writing code then reviewing a PR is a switch)
- Identify whether interruptions are primarily **external** (Slack messages, meeting invites, a colleague walking over) or **self-initiated** (checking email, switching browser tabs, reading the news) -- the intervention differs for each
- Establish the user's peak cognitive hours: most people have a 2-4 hour peak window, typically in the morning, where fluid intelligence and working memory are at their highest; this window is the most valuable to protect
- Ask how many "types" of work they do -- a developer might list: feature coding, bug fixing, code review, design docs, Slack, email, 1:1s, standups, planning, admin; this raw list becomes the input to context definition
- Calculate the rough switching cost baseline: research by Gloria Mark at UC Irvine shows it takes an average of 23 minutes to fully return to a task after an interruption; for knowledge workers in deep work, the effective ramp-up is 15-25 minutes; for shallow tasks, 3-7 minutes. Use 15 minutes as the default ramp-up cost for deep work contexts and 5 minutes for shallow ones
- Multiply: (number of deep-work switches x 15 min) + (number of shallow switches x 5 min) = estimated daily time lost to switching overhead; present this number to the user -- it is usually alarming and motivating

### Step 2: Define the User's Work Contexts

Contexts are not the same as tasks or projects. A context is defined by three things acting together: the **cognitive mode** required, the **tools** open and active, and the **mental state** or social posture needed.

- Identify 4-6 contexts maximum -- fewer is better; more than 6 contexts signals that the batching has not gone deep enough, and the user will still experience cognitive fragmentation
- The canonical set of contexts for most knowledge workers falls into five categories: **Deep Creation** (writing, coding, analysis, design), **Reactive Communication** (Slack, email, async threads), **Synchronous Collaboration** (meetings, calls, pairing sessions), **Evaluation & Review** (code review, editing drafts, reviewing reports), and **Administrative** (scheduling, expenses, filing, forms)
- Name contexts in the user's own vocabulary, not generic labels -- a copywriter should call it "Writing" not "Deep Creation"; a data analyst should call it "Analysis" not "Deep Work"
- Assign each context a **cognitive load tier**: Tier 1 -- High (requires full working memory, minimal interruption tolerance: coding, writing, analysis), Tier 2 -- Medium (requires attention but tolerates some interruption: code review, editing), Tier 3 -- Low (routine, procedural, low stakes: admin tasks, scheduling, form-filling)
- Identify the **re-entry cost** for each context: Tier 1 contexts cost 15-25 minutes to re-enter after interruption; Tier 2 costs 7-12 minutes; Tier 3 costs under 5 minutes
- Flag any tasks the user listed that do not belong to a defined context -- these are usually the biggest sources of fragmentation because they have no home in the schedule

### Step 3: Calculate Switching Cost and Build the Case for Change

Present the math explicitly. Users who see the numbers adopt the system. Users who only hear abstract advice do not.

- **Current state calculation:** (number of deep switches per day x 15 min ramp-up) + (number of shallow switches per day x 5 min ramp-up) = daily minutes lost; multiply by 5 for the weekly figure; multiply by 48 for the annual figure
- For a user switching between deep and shallow work 20 times per day (a common finding), the calculation is: (10 deep switches x 15 min) + (10 shallow switches x 5 min) = 150 + 50 = 200 minutes lost per day -- nearly 3.5 hours daily, 17 hours per week, 816 hours per year (over 20 full workweeks per year lost to switching overhead)
- **Target state calculation:** With 4-6 context transitions per day, each between cleanly defined contexts with transition buffers: (5 transitions x 5 min buffer each) + (2 deep-work re-entries x 5 min settling-in time) = 35 minutes in transition overhead -- a reduction of 85-90% from a fragmented baseline
- Present both the time savings and the **quality multiplier**: deep work done in 90-minute uninterrupted blocks produces qualitatively different output than the same 90 minutes scattered across a fragmented day; this is not just a time efficiency argument but an output quality argument
- Identify the **most expensive transition pair** in the user's current workflow -- this is the single switch that costs the most cognitive ramp-up, usually the transition from deep creative/analytical work into reactive communication and back; this transition alone is worth targeting first

### Step 4: Design the Context-Batched Schedule Architecture

Build the optimized schedule using five design principles: energy alignment, context sequencing, transition buffering, communication windowing, and slack allocation.

- **Energy alignment:** Place Tier 1 (deep, high-cognitive) contexts during the user's peak energy window; most chronotypes have peak cognitive performance 1-3 hours after waking, typically between 8:00-11:00 AM for morning types; do not schedule meetings, email, or admin tasks during this window if avoidable
- **Context sequencing:** Order contexts to minimize the "distance" between adjacent cognitive modes; a good sequence is Deep Work -- Review/Evaluation -- Communication -- Admin -- (break) -- Deep Work; a bad sequence is Deep Work -- Communication -- Deep Work -- Meetings -- Deep Work because each re-entry into deep work carries full ramp-up cost
- **Transition buffering:** Insert 10-15 minute transition blocks between every context change; these are not wasted time -- they serve three functions: closing the previous context (saving state, noting next action), preparing the next context (opening tools, reviewing the agenda), and providing a cognitive gear-shift period that reduces the ramp-up cost of the incoming context
- **Communication windowing:** Schedule exactly 2-3 communication windows per day, not continuous access; research supports that workers who check email and messages on a time-delayed batch schedule (3x/day) report significantly lower stress and comparable output to those with continuous access; a standard communication window architecture is: morning window (30-45 min after deep work block), midday window (around lunch), and late-afternoon window (before end of day)
- **Slack allocation:** Build at least one 30-minute unscheduled "flex" period into the schedule; without flex time, any unexpected task forces a context switch into an existing block, destroying the architecture
- **Meeting consolidation:** Where the user has any control over their calendar, group all meetings into a single half-day or into consecutive afternoon slots; meetings held in the morning consistently destroy the most valuable deep work time; even one 30-minute meeting at 10:00 AM in an otherwise clear morning eliminates the deep work block for many people because of anticipatory attention -- the brain starts pre-processing the meeting 20-30 minutes beforehand
- **Block length targets:** Deep work blocks should be 90-120 minutes minimum to achieve meaningful flow state; research on flow entry (Csikszentmihalyi) suggests flow typically begins after 15-20 minutes of focused engagement and reaches full depth at approximately 40 minutes; a block shorter than 60 minutes rarely reaches productive flow; do not create deep work blocks under 60 minutes

### Step 5: Design the Context Bookmark System

The context bookmark system is the fail-safe that makes the architecture recoverable when unexpected switches happen.

- A context bookmark is a 30-60 second written record created at the moment a switch is forced, capturing exactly where the user is and what the very next action should be when they return
- The bookmark format for Tier 1 contexts (deep work) must include: the file or document being worked on, the specific subtask in progress, the next concrete action to take upon return, and any open questions or decisions that were in working memory -- these items would be lost without capture
- For Tier 2 contexts, a simpler bookmark suffices: current item, next item, any pending decisions
- Physical or digital medium: for developers, inline code comments tagged with a personal marker (e.g., `// RESUME: next step is to refactor the auth middleware`) are highly effective because they appear exactly at the point of re-entry; for writers, a similar inline note works; for analysts, a sticky note or Notion block with a one-line re-entry cue is sufficient
- Define the user's **interruption decision matrix**: not all interruptions are equal; a production system outage overrides everything; a colleague asking a non-urgent question does not; the matrix has two axes -- urgency (minutes vs. hours vs. days) and scope (affects others vs. affects only me) -- only genuinely urgent, externally-scoped items justify an immediate context break
- The "parking lot" method: keep a single scratchpad (physical or digital) next to the workspace where non-urgent items that arrive during a context block are captured with a single line and a timestamp; these are processed during the next communication window, not immediately

### Step 6: Set Interruption Management and Notification Rules

The technical configuration of the user's devices must match the schedule architecture, or the architecture will fail within the first week.

- **Do Not Disturb schedules:** Configure OS-level DND (macOS Focus modes, Windows Focus Assist, iOS/Android DND schedules) to activate automatically during Tier 1 context blocks; do not rely on willpower to activate DND -- it must be automatic
- **Notification tiers:** Classify all notification sources into three tiers: Always-through (calendar alerts for meetings that are already scheduled, phone calls from designated individuals -- never more than 5 people on this list), Batched (Slack, email, most messaging apps -- these are off during deep work, checked during communication windows), and Off (social media, news, non-essential apps -- no exceptions during any work context)
- **Slack-specific configuration** (most common offender in knowledge worker contexts): set status to a focus indicator during deep work blocks; use scheduled notifications to deliver messages only during communication windows; configure channel notification settings so that only direct mentions and direct messages notify; configure the sidebar to hide channels during deep work
- **Physical environment signals:** in an office setting, visual signals dramatically reduce interruption frequency -- a specific object on the desk (a colored cube, a specific mug, a "focus" flag) signals to colleagues that the user is in a deep work context; this works because most colleague interruptions are made without malicious intent and a visible signal provides an easy, face-saving way for the interrupter to self-redirect
- **Emergency escalation path:** define one channel that is always-through for genuine emergencies; this prevents the "but what if something critical happens?" anxiety that keeps people tethered to notifications; for most roles, a direct phone call is the appropriate emergency escalation channel

### Step 7: Produce the Complete System Document and Weekly Review Protocol

Assemble all components into the deliverable and establish the review cadence to iterate the system.

- Output the full system document following the Output Format below
- The weekly review is non-optional -- a context system designed without a review mechanism degrades within 2-3 weeks as the user's task list and calendar drift back toward fragmentation
- Weekly review items: count actual context switches (self-reported or tracked with a tool like Toggl or a simple tally mark system); identify which transitions violated the plan and why; adjust block lengths and context assignments based on one week of real data; celebrate the time-recovered metric to reinforce the behavior change
- Set a 4-week checkpoint: after four weeks of using the system, the user's context definitions may need revision as they discover that some tasks they initially grouped together are actually different cognitive modes; this is expected and healthy iteration
- Define a **degradation trigger**: if the user's switch count returns to within 20% of the pre-optimization baseline for two consecutive weeks, the system needs a structural refresh, not just a reminder to try harder

---

## Output Format

```
## Context Switching Reduction System

### Current State Analysis
- **Daily task type transitions (estimated):** [X] switches/day
- **Daily time lost to switching overhead:** [Y] minutes/day
  - Deep-work switches: [A] switches x 15 min ramp-up = [A*15] minutes
  - Shallow-work switches: [B] switches x 5 min ramp-up = [B*5] minutes
- **Weekly switching overhead:** [Y x 5] minutes/week ([Y x 5 / 60] hours/week)
- **Annual switching overhead (extrapolated):** [Y x 240] minutes/year ([Y x 240 / 60] hours/year)
- **Most expensive transition pair:** [Context A] --> [Context B] --> back to [Context A]
  (estimated cost per cycle: ~[Z] minutes)
- **Interruption source breakdown:** [X%] external (Slack, meetings, colleagues), [Y%] self-initiated

---

### Defined Contexts
| # | Context Name | Tasks Included | Tools Required | Cognitive Tier | Re-Entry Cost |
|---|-------------|---------------|----------------|----------------|--------------|
| 1 | [Name] | [Task 1, Task 2, Task 3] | [Tool list] | Tier 1 -- High | 15-25 min |
| 2 | [Name] | [Task 1, Task 2] | [Tool list] | Tier 2 -- Medium | 7-12 min |
| 3 | [Name] | [Task 1, Task 2, Task 3] | [Tool list] | Tier 2 -- Medium | 7-12 min |
| 4 | [Name] | [Task 1, Task 2] | [Tool list] | Tier 3 -- Low | 3-5 min |
| 5 | [Name] | [Task 1, Task 2, Task 3] | [Tool list] | Tier 1 -- High | 15-20 min |

---

### Context-Batched Daily Schedule
| Time | Block Type | Context | Task Batch | Duration | Energy Tier |
|------|-----------|---------|-----------|----------|-------------|
| [HH:MM-HH:MM] | Work | [Context] | [Specific task batch] | [X] min | Peak |
| [HH:MM-HH:MM] | Transition | -- | Close [Context 1], open [Context 2]. Write context bookmark. | 15 min | -- |
| [HH:MM-HH:MM] | Work | [Context] | [Specific task batch] | [X] min | High |
| [HH:MM-HH:MM] | Transition | -- | Close [Context 2], open [Context 3]. Process parking lot items. | 10 min | -- |
| [HH:MM-HH:MM] | Work | [Context] | [Specific task batch] | [X] min | Medium |
| [HH:MM-HH:MM] | Break | -- | Lunch / full mental break | 45 min | -- |
| [HH:MM-HH:MM] | Work | [Context] | [Specific task batch] | [X] min | Medium |
| [HH:MM-HH:MM] | Transition | -- | Close [Context], open [Context]. | 10 min | -- |
| [HH:MM-HH:MM] | Work | [Context] | [Specific task batch] | [X] min | Low-medium |
| [HH:MM-HH:MM] | Flex | -- | Unscheduled buffer for overruns and unexpected tasks | 30 min | -- |
| [HH:MM-HH:MM] | Shutdown | -- | End-of-day review, next-day context pre-load | 15 min | Low |

---

### Switching Efficiency Comparison
| Metric | Before Optimization | After Optimization | Recovery |
|--------|--------------------|--------------------|----------|
| Context switches/day | [X] | [Y] | [X-Y] fewer |
| Time lost to switching/day | [A] min | [B] min | [A-B] min/day |
| Time lost to switching/week | [A*5] min | [B*5] min | [(A-B)*5] min/week |
| Time lost to switching/year | [A*240] min ([A*240/60] hr) | [B*240] min | [(A-B)*4] hr/week |
| Deep work hours protected/day | [X] hr | [Y] hr | +[Y-X] hr/day |

---

### Notification Configuration
| Context | Tier | DND Setting | Apps Active | Apps Closed/Silent | Always-Through |
|---------|------|-------------|------------|-------------------|----------------|
| [Context 1] | Tier 1 | OS DND ON -- auto-scheduled | [App 1, App 2] | [App 3, App 4, Slack, email] | Phone calls from [designated list] |
| [Context 2] | Tier 2 | DND OFF | [App 1, App 2] | [App 3] | Calendar alerts |
| [Context 3] | Tier 2 | Partial | [App 1] | [App 2] | Direct mentions only |
| [Context 4] | Tier 3 | OFF | All | None | All notifications |

---

### Context Bookmark Protocol
**Trigger:** Any forced context switch during a Tier 1 or Tier 2 context block.

**Tier 1 Bookmark (60-second capture):**
1. Record: Current file/document/artifact being worked on
2. Record: Specific subtask in progress (e.g., "refactoring the login validation function")
3. Record: The next concrete action upon return (e.g., "write the unit test for the null case")
4. Record: Any open decisions or threads in working memory (e.g., "deciding between JWT and session cookie approach")
5. Recommended location: [Inline code comment / Notion block / physical index card at keyboard]

**Tier 2 Bookmark (30-second capture):**
1. Record: Current item and its status
2. Record: Next item in the queue
3. Recommended location: [Sticky note on monitor / task manager note field]

**Parking Lot:**
Keep a single always-open scratchpad for items that arrive during context blocks.
Format: [Timestamp] [Item] [Who it's from / what it's about] -- Review during next Communication window.

---

### Interruption Decision Matrix
| Urgency | Affects Others | Action |
|---------|---------------|--------|
| Minutes (production down, blocking someone) | Yes | Break context. Write bookmark first (60 sec). Handle immediately. |
| Hours (someone waiting on you today) | Yes | Add to parking lot. Address at next Communication window. |
| Hours (someone waiting on you today) | No | Add to parking lot. Address at next Communication window. |
| Days (not urgent) | Either | Add to parking lot. Address at next Communication window. |
| Speculative ("just wanted to mention...") | Either | Defer to Communication window. No exception. |

---

### Weekly Review Protocol
**Every [Friday at 4:30 PM / Monday at 9:00 AM -- choose one fixed time]:**
- [ ] Record actual context switches this week (tally marks or Toggl review): ___/week (target: under [target]/week)
- [ ] Identify the two most disruptive transitions: (1) ___ (2) ___
- [ ] Were any communication windows skipped or violated? If yes, why: ___
- [ ] Was the peak-energy deep work block protected 4+ days out of 5? Y / N
- [ ] Time recovered this week vs. pre-optimization baseline: ___ minutes
- [ ] One context definition to refine or task to re-categorize: ___
- [ ] One notification rule to tighten: ___

**Degradation trigger:** If actual switches exceed [target x 1.2] for two consecutive weeks, schedule a full 30-minute system review -- the architecture needs structural revision, not recommitment.
```

---

## Rules

1. **Never produce this system without the switching cost calculation.** The numbers are the motivation. A user who sees that they are losing 150 minutes per day to switching overhead will act. A user who receives abstract batching advice will not. Always calculate before-state minutes lost using the 15-minute deep ramp-up and 5-minute shallow ramp-up constants.

2. **Define no more than 6 contexts, no fewer than 3.** Fewer than 3 contexts is too coarse -- all tasks get lumped together and the system provides no useful structure. More than 6 contexts means the user is still managing task-level granularity rather than cognitive-mode-level granularity, which defeats the purpose. If the user lists more than 6 task types, merge tasks that share the same cognitive mode and tool set.

3. **Deep work blocks must be a minimum of 60 minutes; 90 minutes is the target.** Blocks shorter than 60 minutes cannot produce meaningful flow state. If the user's calendar only allows 45-minute gaps between meetings, flag this as a structural problem and prioritize meeting consolidation over context-block design.

4. **Peak-energy hours are sacred.** Never schedule meetings, email, or admin tasks in the user's peak-energy window unless the user has explicitly no control over those slots. The entire return on investment of this system depends on protecting peak cognitive hours for Tier 1 contexts. If peak hours are lost, the system degrades to "schedule optimization" rather than genuine context protection.

5. **Communication windows must be time-boxed with a hard end time.** An open-ended communication window does not exist -- it is just "checking Slack forever." Every communication window must have a duration (30-60 minutes maximum) and a hard end time after which the context closes and the next scheduled context begins. If communication genuinely requires more than 3 hours of the workday, the user's role definition needs review, not their schedule.

6. **Transition buffers are non-negotiable between Tier 1 context changes.** No Tier 1 context block should be scheduled immediately adjacent to another Tier 1 context block or to a meeting. The 10-15 minute transition block is not dead time -- it reduces re-entry cost for the incoming context and closes the outgoing context cleanly. Removing transition buffers to "fit more in" will cause the system to collapse within the first week.

7. **The context bookmark system must be defined before the schedule is used.** A context system without a bookmark system is brittle -- the first unexpected interruption will cost the full 15-25 minute ramp-up rather than the 3-5 minute re-entry that a good bookmark enables. Define the exact location and format of the bookmark (inline comment, Notion block, physical index card) before the system goes live.

8. **Do not allow the same context to appear more than twice in one day.** If a context appears three or more times in a single day's schedule, it has not been batched -- it has been distributed. The sole exception is the Reactive Communication context, which may appear up to three times (morning, midday, late afternoon) because communication volume across a workday is often too large to process in a single window.

9. **The weekly review is part of the system, not optional.** A context system that cannot be iterated will drift back to the pre-optimization baseline within 30 days. Build the weekly review into the output and establish the specific day and time it occurs. If the user will not commit to a weekly review, halve the expected benefit -- the system will decay without it.

10. **Identify and name the degradation trigger explicitly.** Every context system will be violated at some point -- by a crunch period, a reorganization, a personal event. The system needs a defined signal that tells the user "this is not a bad week, this is a broken system that needs repair." The degradation trigger (actual switches returning to within 20% of baseline for two consecutive weeks) converts a subjective feeling of failure into an objective diagnostic metric.

---

## Edge Cases

### The Always-On Role (Support Engineers, Managers, On-Call Rotations)
Users whose job explicitly requires real-time responsiveness cannot eliminate reactive interruptions -- but they can contain them. Design an alternating architecture: 90 minutes of deep work (protected) followed by 30 minutes of reactive window, repeated 2-3 times per day. During deep work blocks, configure a "slow triage" channel -- a single Slack channel or shared inbox where urgent items from colleagues land while the user is in a deep work block -- and train colleagues that items in this channel will be acknowledged within 90 minutes, not immediately. Accept that this role will achieve 4-6 switches per day rather than the ideal 3-4, but contain the switches to predictable intervals rather than random intrusions. For users on active on-call rotations (pager duty), designate on-call days as "communication mode" days with no deep work blocks scheduled, and designate off-call days for all Tier 1 context work. Never mix pager duty with scheduled deep work -- the anticipatory attention of waiting for an alert destroys the value of the deep work block entirely.

### Meetings Scattered Throughout the Day
This is the single most common schedule pathology in knowledge work organizations. A day with meetings at 9:00, 11:30, 2:00, and 4:00 has no viable deep work block -- every gap is either too short to reach flow or poisoned by anticipatory attention. The prescription is aggressive calendar surgery before context design. Guide the user to: (1) identify which recurring meetings they could move or eliminate, (2) propose a "meeting half-day" to their team (typically Tuesday and Thursday afternoons) and defend Monday, Wednesday, and Friday mornings as deep work time, (3) for immovable meetings, use the clustering technique -- accept that Wednesday is a meeting-heavy day and front-load all deep work on Monday and Friday. For a meeting scheduled in isolation (e.g., one meeting at 11:00 on a Monday), teach the user to treat the surrounding 30-minute windows as part of the meeting context, not as deep work opportunities -- pre-meeting prep (10 min) and post-meeting action capture (15 min) belong in the meeting context, not jammed between a deep work block and the meeting itself.

### Same Project, Multiple Cognitive Modes (Common for Developers, Researchers, Consultants)
Users who work primarily on one project throughout the day often resist context-switching reduction framing because they feel they are "always working on the same thing." But within a single project, cognitive modes still switch: designing the architecture (Tier 1 creation), implementing the code (Tier 1 creation, same mode), reviewing a colleague's PR (Tier 2 evaluation, different mode), answering questions about the system in Slack (Tier 3 communication, different mode), writing the design doc (Tier 1 creation, same mode as implementation but different artifact and tool set). Define contexts by cognitive mode within the project, not by project identity. The four intra-project contexts for a developer are: Build (writing new code), Review (evaluating existing code), Design (documents, architecture, planning), and Communicate (status, questions, unblocking others). The same batching principles apply -- all Build sessions in the morning, all Review sessions together, all Design sessions in a discrete window.

### ADHD, Hyperfocus, and Non-Standard Attention Profiles
Standard 90-minute deep work blocks are often incompatible with ADHD-pattern attention systems, which may have a natural attention cycle of 20-40 minutes. The key insight is that the goal of context switching reduction is not "work for 90 minutes without stopping" -- it is "spend 90 minutes inside the same cognitive context without switching to a different context." For ADHD users, implement the Pomodoro technique within context blocks: 25 minutes of work, 5-minute break, repeat -- but critically, the break is a within-context rest (stepping away from the screen, stretching, getting water) rather than a cross-context switch (opening Twitter, checking email). Three consecutive Pomodoros within the same context is functionally equivalent to a 90-minute block. The context does not change between Pomodoros. Also note that ADHD users often have hyperfocus capabilities that allow them to sustain Tier 1 work for far longer than 90 minutes under the right conditions -- the context system for these users should include provisions for extended hyperfocus periods with permission to skip scheduled transitions when a natural flow state is active.

### Remote Workers With Cross-Timezone Team Communication Demands
A user on the US West Coast working with a team in Europe faces structural communication demands that conflict with morning deep work protection: the 8:00-11:00 AM window, which would be the user's peak cognitive period, is the last working window for European colleagues (4:00-7:00 PM CET). This creates genuine pressure on the most valuable deep work time. The prescription is a compressed communication window from 8:00-9:30 AM to handle all cross-timezone items, followed by a protected deep work block from 9:30 AM onwards. An alternative for roles with more flexibility is to shift the schedule earlier (6:30-9:30 AM deep work before European colleagues expect responses) or to define the Europe communication window as a formal asynchronous batch rather than a real-time reactive window. The key constraint is to never allow cross-timezone communication pressure to bleed indefinitely into the morning -- define a hard end time for the timezone-overlap communication window even if it feels socially uncomfortable.

### Users Who Have Never Tracked Their Actual Switch Count
Many users can describe their fragmented work experience qualitatively but have no data on actual switch frequency. For these users, recommend a two-day measurement sprint before designing the system: for two full workdays, the user places a tally mark on a piece of paper every time they switch from one task type to another. The act of tallying creates awareness by itself (a minor intervention) and produces the data needed for the switching cost calculation. Alternatively, a time-tracking tool like Toggl with manual task-type tags can generate the data automatically if the user is willing to log context changes in real time. Do not skip the measurement step -- a context system designed against a fabricated switching count will be mis-sized (too many or too few context blocks) and will feel wrong to the user from day one.

### The User Who Wants to Fix Everything at Once
A user who describes a severely fragmented workday (30+ switches per day, no protected deep work time, constant notifications, back-to-back meetings from 9 AM to 5 PM) may present with the expectation that the output of this skill will immediately transform their schedule into a perfectly optimized system. This expectation will produce failure. For severely fragmented baselines, prescribe a **staged implementation**: Week 1 -- implement notification tiers and establish the context bookmark habit only; Week 2 -- add one protected 90-minute deep work block per day (even if imperfect); Week 3 -- establish the communication window architecture; Week 4 -- implement the full system. Trying to change all behaviors simultaneously violates habit formation research (one keystone habit at a time produces more durable change than wholesale behavioral overhaul) and will cause the user to abandon the system entirely after the first calendar conflict destroys their perfectly optimized schedule.

---

## Example

**Input:** "I'm a product manager and my days are absolutely chaotic. I'm constantly jumping between writing product specs, sitting in stakeholder meetings, answering questions on Slack from the engineering team, doing competitive research, reviewing design mockups from the designers, and handling stuff like updating roadmaps in Jira and preparing status reports for leadership. I probably check Slack every 10 minutes and I feel like I'm always reacting to everyone else's agenda. I never have time to actually think deeply about strategy or write a proper spec. I have around 4-5 meetings a day, most of them in the morning."

---

**Output:**

```
## Context Switching Reduction System
**Role:** Product Manager | **Generated:** [Date]

---

### Current State Analysis

- **Daily task-type transitions (estimated):** 28-35 switches/day
  - Checking Slack every 10 minutes across a 7-hour workday = ~42 reactive Slack switches alone
  - Combined with meeting transitions, spec writing interruptions, and review sessions:
    realistic estimate of 30 meaningful cognitive switches per day
- **Switching overhead calculation:**
  - Deep-work switches (spec writing, research, strategy): ~8 switches x 15 min = 120 min
  - Shallow-work switches (Slack, Jira updates, status reports): ~22 switches x 5 min = 110 min
  - **Total daily time lost: ~230 minutes (3 hours 50 minutes)**
- **Weekly switching overhead:** 1,150 minutes (19.2 hours) -- nearly half a standard workweek
- **Annual switching overhead:** 55,200 minutes (920 hours -- 23 full workweeks lost per year)
- **Most expensive transition pair:** Writing a product spec --> Slack interruption --> back to spec writing
  (estimated cost per cycle: 25-30 minutes, occurring ~8 times per day)
- **Interruption source breakdown:** ~75% external (Slack, meetings, colleague requests), ~25% self-initiated (proactive Slack checking)
- **Critical finding:** 4-5 morning meetings are consuming the peak cognitive energy window.
  Strategy and spec writing -- the highest-value PM work -- is being done in the cognitive
  remainder of the day, after meetings have depleted working memory and decision capacity.

---

### Defined Contexts

| # | Context Name | Tasks Included | Tools Required | Cognitive Tier | Re-Entry Cost |
|---|-------------|---------------|----------------|----------------|--------------|
| 1 | Deep Strategy | Product spec writing, strategic thinking, opportunity analysis, narrative development | Notion/Confluence, reference docs, blank doc | Tier 1 -- High | 20-25 min |
| 2 | Research | Competitive analysis, user interview synthesis, market research, data review | Browser, Amplitude/Mixpanel, spreadsheets, Notion | Tier 1 -- High | 15-20 min |
| 3 | Review & Feedback | Design mockup review, spec peer review, copy review, PRD comments | Figma, Notion comments, Confluence | Tier 2 -- Medium | 7-12 min |
| 4 | Communication | Slack batching, email, async stakeholder threads, Loom review | Slack, Gmail, Loom | Tier 3 -- Low-medium | 3-7 min |
| 5 | Meetings | Standups, stakeholder reviews, 1:1s, planning sessions, design reviews (synchronous) | Zoom/Meet, Notion meeting notes, calendar | Tier 2 -- Medium | 10-15 min (preparation) |
| 6 | Admin & Ops | Jira roadmap updates, status report drafting, scheduling, OKR tracking, slide decks | Jira, Google Slides, spreadsheets, calendar | Tier 3 -- Low | 3-5 min |

---

### Context-Batched Daily Schedule

**Priority structural change required before schedule redesign:**
The 4-5 morning meetings are the primary obstacle. The recommended action is to move
all recurring meetings (standup, team syncs, stakeholder reviews) to Tuesday/Thursday
afternoons and preserve Monday, Wednesday, and Friday mornings as no-meeting deep work time.
For meetings that cannot move immediately, implement the schedule below as a transitional state.

| Time | Block Type | Context | Task Batch | Duration | Energy |
|------|-----------|---------|-----------|----------|--------|
| 7:45-8:00 | Prep | -- | Pre-load: review today's contexts, open spec doc, close Slack | 15 min | Low |
| 8:00-9:45 | Work | Deep Strategy | Write/extend current product spec. One spec only -- no multitasking across specs. | 105 min | **PEAK** |
| 9:45-10:00 | Transition | -- | Save spec with inline RESUME comment. Close Notion. Open meeting prep. | 15 min | -- |
| 10:00-10:15 | Work | Meetings | Engineering standup | 15 min | High |
| 10:15-10:45 | Work | Communication | First Slack batch: process all overnight and morning messages. Reply, delegate, or add to parking lot. Hard stop at 10:45. | 30 min | High |
| 10:45-11:00 | Transition | -- | Close Slack. Open Figma and pending review queue. | 15 min | -- |
| 11:00-12:00 | Work | Review & Feedback | Design mockup reviews -- all queued reviews in one session. Written feedback for designers. | 60 min | Medium-high |
| 12:00-12:45 | Break | -- | Full lunch break. No Slack. No email. Physical break away from screen. | 45 min | -- |
| 12:45-1:15 | Work | Admin & Ops | Jira updates, roadmap maintenance, status report drafting | 30 min | Low-medium |
| 1:15-1:45 | Work | Communication | Second Slack batch: reply to all items since 10:45. Process parking lot items from morning. | 30 min | Medium |
| 1:45-2:00 | Transition | -- | Close Slack and Jira. Open research tools and notes. | 15 min | -- |
| 2:00-3:30 | Work | Research | Competitive research, user data analysis, synthesis into structured notes for upcoming specs | 90 min | Medium-rising |
| 3:30-3:45 | Transition | -- | Save research notes with key findings summary. Open Zoom/Meet for afternoon meetings. | 15 min | -- |
| 3:45-4:30 | Work | Meetings | Stakeholder reviews, 1:1s, planning sessions (batched here) | 45 min | Medium |
| 4:30-5:00 | Work | Communication | Final Slack and email batch. Process all remaining parking lot items. Flag items for tomorrow. | 30 min | Low-medium |
| 5:00-5:15 | Shutdown | -- | End-of-day: write tomorrow's context pre-loads, close all apps, review what shipped today | 15 min | Low |
| *Weekly flex* | Flex | -- | 30-min unscheduled buffer built into Thursday afternoon for overruns | 30 min | -- |

---

### Switching Efficiency Comparison

| Metric | Before Optimization | After Optimization | Recovery |
|--------|--------------------|--------------------|----------|
| Context switches/day | ~30 | ~6 | 24 fewer switches |
| Time lost to switching/day | ~230 min | ~30 min (transition buffers) | **200 min/day recovered** |
| Time lost to switching/week | ~1,150 min (19.2 hr) | ~150 min (2.5 hr) | **16.7 hr/week recovered** |
| Deep work hours protected/day | ~0.5 hr (fragmented) | ~3.25 hr (two protected blocks) | +2.75 hr of genuine deep work |
| Slack check frequency | Every 10 min (~42x/day) | 3x/day (30-min windows) | 39 fewer reactive checks/day |

---

### Notification Configuration

| Context | Tier | DND Setting | Apps Active | Apps Silent/Closed | Always-Through |
|---------|------|-------------|------------|-------------------|----------------|
| Deep Strategy | Tier 1 | macOS/iOS Focus Mode ON -- scheduled 8:00-9:45 | Notion, reference docs only | Slack CLOSED, Gmail tab closed, phone silent | Direct phone calls from [engineering lead, CTO, VP Product -- max 3 people] |
| Research | Tier 1 | Focus Mode ON -- scheduled 2:00-3:30 | Browser (research only), Amplitude, spreadsheets | Slack CLOSED, Gmail closed | Same always-through list |
| Review & Feedback | Tier 2 | Partial -- mentions only | Figma, Notion | Slack on mentions-only, email silent | Calendar alerts for imminent meetings |
| Communication | Tier 3 | OFF -- all notifications active | Slack, Gmail, all comms | -- | All |
| Meetings | Tier 2 | Slack DND ON | Zoom/Meet, meeting notes | Email silent | Calendar alerts only |
| Admin & Ops | Tier 3 | OFF | Jira, Slides, spreadsheets | Social media, news | All notifications |

**Slack-specific configuration:**
- Notification schedule: Active only during Communication windows (10:00-10:45, 1:15-1:45, 4:30-5:00)
- Status during Deep Strategy: "Writing -- back at 10:00" (updated automatically via Slack Workflow)
- Channel notifications: Direct messages and @mentions only; all channel notifications muted
- Sidebar: Channels hidden during deep work (use Slack's "Do Not Disturb" to silence, not mute individually)

---

### Context Bookmark Protocol

**Tier 1 Bookmark (for Deep Strategy and Research contexts):**

Format -- written as inline comment in Notion or on a physical index card at the keyboard:

```
RESUME [Date/Time]:
- Document: [Spec name, section title]
- Current task: [e.g., "Writing acceptance criteria for checkout flow redesign"]
- Next action: [e.g., "Define edge case: what happens if payment fails after order confirmed"]
- Open questions in working memory: [e.g., "Confirm with engineering whether webhook retry logic is in scope for v1"]
- Context note: [Any mental thread that needs to be recaptured -- e.g., "Was comparing Option A (modal) vs. Option B (redirect) -- leaning Option A because of mobile experience"]
```

**Where to store it:** Inline at the top of the active Notion spec document as a callout block, or as a sticky note physically placed on the keyboard -- the physical placement ensures it is seen before reopening the laptop.

**Tier 2 Bookmark (for Review & Feedback context):**

```
RESUME: Figma -- [Component name] review, done through [screen/frame number], next is [frame X].
Pending feedback comment: [One-line note of unwritten thought].
```

**Parking Lot (for items arriving during any context block):**
- Single open Notion page titled "Parking Lot -- [Week]"
- Entry format: [HH:MM] -- [Item or question] -- [From whom] -- [Urgency: today/this week/someday]
- Review and clear parking lot during each Communication window
- Items that have been in the parking lot for two communication windows without action should be either delegated, deferred to next week's planning, or deleted

---

### Interruption Decision Matrix

| Urgency | Affects Others? | Response |
|---------|----------------|----------|
| Minutes -- production incident or launch blocker | Yes | Break context immediately. Write 30-second bookmark. Return within 30 minutes if possible. |
| Hours -- someone is blocked waiting on your decision today | Yes | Add to parking lot. Message "I'll respond by [next Communication window time]." Do not break context. |
| Today -- non-blocking question or request | Either | Add to parking lot. Acknowledge receipt during Communication window. |
| This week -- planning item, low urgency | Either | Add to parking lot. Process during Communication window or weekly review. |
| "Thought you'd want to know..." | Either | Acknowledge with a thumbs-up emoji. Add to parking lot for Communication window. |

**Colleague management script (for office/open plan environments):**
When interrupted during a deep work block: "I'm deep in [spec/research] right now -- can I get back to you at 10:00 or 1:15?" This gives a specific, near-future commitment, which satisfies most requests without destroying the context block.

---

### Weekly Review Protocol

**Every Friday at 4:30 PM (30 minutes, non-negotiable):**

- [ ] Tally actual context switches this week: ___/week (target: under 35/week -- 6/day x 5 days + 5 for anomalies)
- [ ] Were both deep work blocks protected 4+ days this week? Y / N
  - If No: What caused the violation? (Meeting moved in? Self-initiated switch? Emergency?)
- [ ] How many times was Slack checked outside of communication windows? ___
  (Target: 0; accept 1-2 per week for first month; more than 5 indicates a habit break that needs attention)
- [ ] Most disruptive transition this week: ___
- [ ] Most disruptive transition last week: ___
  (Recurring pattern = structural fix needed, not behavioral recommitment)
- [ ] One context definition to refine based on this week's experience: ___
- [ ] One meeting to move, shorten, or eliminate next week: ___
- [ ] Time recovered this week vs. estimated pre-optimization baseline:
  (Before: ~1,150 min lost. After: ___. Recovered: ___ minutes)

**Four-week checkpoint:**
At the end of Week 4, review whether the 6-context structure still reflects the actual work.
A new project type, a new team member, or a role change may require a context restructure.
This is expected -- revise the Defined Contexts table and update the schedule accordingly.

**Degradation trigger:**
If actual daily switches return to 25+ (within 20% of the pre-optimization baseline of ~30)
for two consecutive weeks, the system needs structural repair. Schedule a 30-minute
system review -- the calendar has likely drifted, meeting creep has returned,
or a new communication demand has been added without a corresponding context slot.
```
