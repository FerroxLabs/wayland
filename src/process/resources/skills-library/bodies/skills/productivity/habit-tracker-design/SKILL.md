---
name: habit-tracker-design
description: |
  Designs a personal habit tracking system with habit definitions, tracking
  method, minimum viable habit specifications, and recovery protocols. Use
  when the user wants to build a habit tracker, define trackable habits with
  minimum thresholds, or create a system for monitoring daily routines. Do
  NOT use for behavior change coaching or motivation (use health-wellness
  skills), full goal-setting frameworks (use `smart-goal-builder` or
  `okr-builder`), or enterprise habit/culture programs.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting automation checklist"
  category: "productivity"
  subcategory: "goal-setting"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Habit Tracker Design

## When to Use

**Use this skill when:**
- The user wants to build a habit tracking system from scratch -- including defining what counts as "done," how to record it, and what to do when they miss
- The user asks how to structure daily or weekly habits into a trackable format with clear completion criteria
- The user wants to define minimum viable versions of habits so they can maintain consistency even on low-energy days
- The user has a list of habits they want to track but does not know how to organize them into a coherent system (too many, too vague, no format, no recovery plan)
- The user is restarting a failed habit tracking attempt and needs to diagnose what went wrong and rebuild more durably
- The user wants to differentiate between habits that require daily tracking vs. frequency-based tracking vs. threshold-based tracking
- The user wants a specific recovery protocol for when streaks break -- not motivation, but a procedural response

**Do NOT use this skill when:**
- The user wants coaching on *why* habits work, habit loops, cue-routine-reward psychology, or behavior change methodology -- redirect to health-wellness coaching skills
- The user is trying to motivate themselves or overcome resistance to starting -- this skill designs the *system*, not the *will* to use it
- The user wants to set a specific outcome goal with milestones and accountability checkpoints -- use `smart-goal-builder` or `okr-builder` instead
- The user wants to optimize the *scheduling* of recurring tasks across a calendar or productivity system -- use `recurring-task-optimizer` instead
- The user wants to build habit programs for a team, company culture, or group accountability context -- this skill is strictly personal, single-user
- The user wants to evaluate which habits to prioritize from a life strategy perspective -- use a values-alignment or goal-hierarchy skill first, then return here for the tracker design
- The user is asking about clinical behavioral interventions, addiction recovery programs, or therapeutic behavior modification -- those require clinical frameworks outside this scope

---

## Process

### Step 1: Inventory and Classify All Candidate Habits

Collect every habit the user wants to track. For each, extract or elicit:

- **Habit name:** Short, verb-first, action-oriented. "Meditate" not "Meditation practice." "Write 500 words" not "Writing habit." The name should describe the *behavior*, not the *outcome*
- **Category:** Assign to one of six standard categories -- Health (sleep, movement, nutrition, hydration), Learning (reading, study, skill practice), Productivity (deep work, planning, review), Relationships (calls, messages, acts of care), Creative (writing, drawing, making), Financial (logging expenses, saving actions). If a habit spans categories, assign it to the most dominant one
- **Desired frequency:** Classify as Daily (7/7), High (5-6/7), Moderate (3-4/7), Low (1-2/7), or Weekly (once per week). Frequency determines the tracking structure
- **Current adoption status:** New (never done), Emerging (doing it sometimes, under 40% of target days), Consistent (doing it often, 40-80% of target days), or Established (already doing 80%+ of the time). This affects which habits need MVH design vs. which just need logging
- **Outcome link:** One sentence on what this habit supports. "Meditate supports my ability to focus at work and reduce baseline anxiety." This is not motivational -- it is for the weekly review decision framework

Do not filter the list at this stage. Capture everything. Prioritization happens in Step 2.

---

### Step 2: Apply the Habit Load Limit and Phase the List

Research on habit formation consistently shows that attempting to build more than five to seven new habits simultaneously causes compliance degradation across all of them. Apply these thresholds:

- **Maximum active habits:** 7 total (never more)
- **Maximum new habits simultaneously:** 3 (habits the user is not yet doing at all)
- **Recommended starter load for first-time trackers:** 3 habits (one established, one emerging, one new)

**Prioritization framework when the user has more than 7 habits:**
1. Mark all Established habits (80%+ compliance) as "Track-only" -- they need logging but not intensive design. They occupy one slot in the tracker
2. From the remaining, select the 3-4 habits with the strongest outcome link to the user's stated current priorities
3. Remaining habits go into a **Phase 2 queue** (add after 4 consecutive weeks above 70% overall completion) and a **Phase 3 queue** (add after 8 weeks). Document the phase queues explicitly in the output

**Habit type classification** -- every habit falls into one of three tracking types, and the tracker design must reflect this:
- **Binary habits:** Done or not done. No partial credit. "Meditated" / "Did not meditate." Most habits should be binary
- **Threshold habits:** A minimum quantity must be met. "Drank at least 64oz of water." "Slept at least 7 hours." The threshold is the pass/fail line
- **Frequency accumulation habits:** A count must reach a weekly target, any days. "Exercised 4 times this week." These should never be assigned to specific days of the week -- assigning them to specific days converts schedule conflicts into false misses

---

### Step 3: Define the Minimum Viable Habit (MVH) for Every Non-Established Habit

The MVH is the single most important design element in the tracker. It is not a watered-down version of the habit -- it is a precisely calibrated floor that ensures the behavioral chain never fully breaks.

**MVH design criteria -- all four must be met:**
1. **Completable in under 5 minutes** from a standing start, no setup required
2. **Requires zero willpower** on a subjective 0-10 energy scale of 2/10 -- if someone with a migraine who just got bad news could do it, it qualifies
3. **Preserves the identity signal** of the full habit. A 1-page read preserves "I am a reader." Five push-ups preserves "I exercise." A sentence in a journal preserves "I journal." The MVH must be the same behavior type, just compressed
4. **Completable in the same location and at the same time** as the full version -- if the full habit happens at the desk at 8 AM, the MVH must also be doable at the desk at 8 AM, not somewhere else

**MVH construction method:**
- Start with the full version and strip away everything except the core behavioral act
- Full: "Run 5K in the morning." Strip: remove distance, time, preparation. Core act: "Put on running shoes and step outside." That is the MVH
- Full: "Meditate for 20 minutes with a guided session." Strip: remove duration, app, headphones. Core act: "Sit still and take 10 slow breaths." That is the MVH
- Full: "Write 1,000 words of my novel." Strip: remove word count. Core act: "Open the document and write one sentence." That is the MVH

**Write the MVH statement in this exact form:**
"On a perfect day, I [full version]. On a hard day, I [MVH], and that counts."

**Do not create an MVH for Established habits** (already at 80%+ compliance). They are already habitual. An MVH would add complexity without value.

---

### Step 4: Design the Tracking Format

The format must match the user's habit count, habit types, and stated medium preference. Never over-engineer for a small habit set.

**Format selection rules:**

| Habit Count | Recommended Format |
|-------------|-------------------|
| 1-3 habits | Simple daily checklist -- one line per habit, one mark per day |
| 4-7 habits | Weekly grid -- habits as rows, days as columns |
| 8-10 habits (advanced only) | Categorized weekly grid with section subtotals |

**Medium selection** -- ask or infer from context:
- **Paper/bullet journal:** Best for users who already have a daily journal or planner. Use a monthly habit grid (31 columns, habits as rows). Portable, no friction, but cannot calculate completion rates automatically
- **Spreadsheet (Google Sheets or Excel):** Best for users comfortable with tools. Can auto-calculate completion rates and color-code cells. Build conditional formatting: green for full completion, yellow for MVH completion, red for missed, gray for rest day
- **Dedicated habit apps:** Appropriate when user explicitly prefers apps. Key features to look for: supports binary and threshold habits, supports flexible frequency (not just daily), allows MVH notation, shows calendar view. Do not recommend specific apps by name -- describe the feature requirements
- **Text file or markdown:** Best for developers or users in terminal/text environments. One file per week, one checkbox list per day

**Visual encoding standard** -- use these symbols consistently regardless of medium:
- `✓` or `[V]` = Full completion
- `◐` or `[m]` = MVH completion (half-credit visually)
- `✗` or `[X]` = Missed (scheduled but not done)
- `-` or `[-]` = Rest day or unscheduled day (does not count as missed or completed)
- `?` or `[?]` = Forgot to track (treat as missed for completion rate calculation, not for streak)

**Critical design rule:** Rest days and missed days must have distinct visual representations. Conflating them inflates the apparent miss rate for frequency-based habits and corrupts weekly review data.

---

### Step 5: Set the System Rules

Every tracker needs explicit operating rules written down at the time of design. Rules that are not written break silently.

**The five mandatory rules every tracker must define:**

1. **Daily logging time:** A specific clock time, not "in the evening." Recommended: 9-10 PM, after the day's habits are done. The logging act must be paired with an existing anchor (brushing teeth, making tea, turning off work notifications). Specify both the time and the anchor
2. **MVH eligibility:** On which conditions is it acceptable to do the MVH instead of the full version? Recommended: any day where the user's subjective energy at the time of the habit is 4/10 or below, OR when available time is under 10 minutes. The user decides -- they cannot be wrong about their own energy. No external adjudication
3. **Streak definition:** Define what constitutes a streak for this specific user's system. Two valid approaches:
   - *Daily streak:* consecutive calendar days where every scheduled habit was completed (full or MVH)
   - *Weekly completion rate streak:* consecutive weeks above a target completion rate (e.g., 70%)
   Daily streaks are motivating but fragile. Weekly completion rate streaks are more resilient and better for irregular schedules. Choose based on the user's history with habit tracking
4. **Streak break threshold:** How many consecutive misses on a single habit before the recovery protocol activates? Recommended: **2 consecutive misses** triggers investigation, **3 consecutive misses** triggers formal protocol. Do not set this at 1 -- a single miss is noise, not signal
5. **Addition rule:** No new habits may be added to the active tracker until the current set has been above 70% overall completion for 4 consecutive weeks. This prevents the user from continuously expanding the tracker as a form of productive procrastination

---

### Step 6: Build the Recovery Protocol

The recovery protocol is a pre-written decision tree the user follows when streaks break. Its purpose is to remove guilt and replace it with analysis. It must be documented in the tracker itself, not just in the user's memory.

**Four-stage recovery protocol:**

**Stage 1 -- Mark and Continue (Day of miss):**
Mark the miss with `[X]`. Do not skip the daily logging. Do not adjust anything. Single misses are noise

**Stage 2 -- MVH Restart (After 2 consecutive misses on one habit):**
- The next scheduled day for that habit: do ONLY the MVH version, not the full version
- This is not punishment -- it is a deliberate friction reduction to ensure the chain restarts
- Full version resumes the day after the MVH restart
- Write a single sentence in the tracker: "Restarted [habit] with MVH on [date]"

**Stage 3 -- Habit Audit (After 3 consecutive misses on one habit):**
Run through this diagnostic checklist:
- Is the scheduled frequency realistic given current life load? (If daily is failing, try 5x/week)
- Is the MVH actually doable in under 5 minutes with no setup? (If not, rebuild it)
- Is the timing wrong? (If morning habits are failing, try moving to evening)
- Is this habit still relevant to a current goal? (If not, remove it without guilt)
- Is there an environmental blocker? (Gym clothes not ready, book not on nightstand, journal not visible)

Address exactly one variable at a time. Do not redesign the whole habit. Write the single modification in the tracker

**Stage 4 -- Formal Modification (After 5+ consecutive misses or 2 weeks below 40% on one habit):**
Two options only:
- **Simplify:** Reduce frequency by one step (daily → 5x/week → 3x/week) OR reduce the full version target (not the MVH -- the MVH stays as is)
- **Pause:** Move the habit to the Phase 2 queue. Mark it paused in the tracker with a note. A paused habit is not a failed habit -- it is scheduled for a better window

**Never:** Never delete tracking history. Never restart the tracker from Week 1. The visible gap is information about life load, not evidence of character failure.

---

### Step 7: Design the Weekly Review Checkpoint

The weekly review is what separates a functioning system from an abandoned one. It must be short (under 10 minutes), scheduled (same day and time every week), and output a single decision for each habit.

**Weekly review structure:**

**Part A -- Data collection (3 minutes):**
Calculate completion rate for each habit: completed days / scheduled days × 100. A scheduled day is any day marked `[V]`, `[m]`, or `[X]`. Rest days `[-]` are excluded from the denominator.

**Part B -- Pattern identification (3 minutes):**
- Which habit had the highest completion rate? This is the anchor habit -- the one that is working
- Which habit had the lowest completion rate? This is the system's current weak point
- Were any misses clustered on a specific day of the week? (e.g., all misses on Fridays = scheduling conflict, not willpower problem)
- Did any habit trigger the recovery protocol this week?

**Part C -- Single decision per habit (3 minutes):**
For each habit, make exactly one decision from this list:
- **Maintain:** Completion rate 70%+. No change
- **Investigate:** Completion rate 50-69%. Note the pattern, no change yet
- **Simplify:** Completion rate below 50% for the second consecutive week. Reduce one variable (frequency, full version difficulty, or timing)
- **Pause:** Completion rate below 40% for two weeks OR 5+ consecutive misses. Move to Phase 2 queue
- **Advance:** Completion rate 90%+ for 3 consecutive weeks on a habit whose full version no longer feels challenging. Increase the full version difficulty (not the frequency)

**Schedule the weekly review with a specific anchor:**
Same day, same time, same location every week. Pair it with a low-energy routine (Sunday evening after dinner, Friday morning with coffee). Write it into the tracker grid as a standing item.

---

## Output Format

```
## Personal Habit Tracker System

### Habit Inventory and Phase Assignment

**Active Habits (tracking now):**

| # | Habit | Type | Category | Frequency | Status | Phase |
|---|-------|------|----------|-----------|--------|-------|
| 1 | [Verb-first name] | [Binary/Threshold/Accumulation] | [Category] | [Daily/5x/4x/3x/2x/Weekly] | [New/Emerging/Consistent/Established] | Active |
| 2 | [Verb-first name] | [Binary/Threshold/Accumulation] | [Category] | [Daily/5x/4x/3x/2x/Weekly] | [New/Emerging/Consistent/Established] | Active |

**Phase 2 Queue (add after 4 weeks at 70%+ overall):**
- [Habit name] -- [reason deferred]

**Phase 3 Queue (add after 8 weeks at 70%+ overall):**
- [Habit name] -- [reason deferred]

---

### Minimum Viable Habit Definitions

| # | Habit | Full Version | Minimum Viable Habit | MVH Duration | Outcome Link |
|---|-------|-------------|---------------------|-------------|-------------|
| 1 | [name] | [Full description with quantity/duration] | [Stripped-down core act] | [under 5 min] | [One-sentence outcome] |
| 2 | [name] | [Full description with quantity/duration] | [Stripped-down core act] | [under 5 min] | [One-sentence outcome] |

**MVH Statement per habit:**
- [Habit 1]: "On a perfect day, I [full version]. On a hard day, I [MVH], and that counts."
- [Habit 2]: "On a perfect day, I [full version]. On a hard day, I [MVH], and that counts."

---

### Weekly Tracking Grid

**Daily logging time:** [Clock time] -- anchor: [paired routine]
**Legend:** [V] = Full | [m] = MVH | [X] = Missed | [-] = Rest/Unscheduled | [?] = Forgot to log (counts as missed)

| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Done | Target | Rate |
|-------|-----|-----|-----|-----|-----|-----|-----|------|--------|------|
| [Habit 1] | | | | | | | | | /[n] | % |
| [Habit 2] | | | | | | | | | /[n] | % |
| [Habit 3] | | | | | | | | | /[n] | % |
| **Total** | /[n] | /[n] | /[n] | /[n] | /[n] | /[n] | /[n] | | /[weekly total] | % |

**Streak counter:** Current streak: ___ days | Personal best: ___ days

---

### System Rules

1. Log the tracker at [time] every day, including days when nothing was completed
2. Full completion = [V]. MVH completion = [m]. Both count equally toward streaks and completion rates
3. Rest days = [-]. Do not count toward completion rate denominator. Scheduled rest days for [habit name]: [days]
4. MVH is available on any day when available time is under 10 minutes or energy is 4/10 or below
5. Recovery protocol activates after [2] consecutive missed days on any single habit
6. No new habits added until overall completion rate is 70%+ for 4 consecutive weeks
7. Weekly review scheduled: [Day] at [Time], anchored to [routine]

---

### Recovery Protocol

**Stage 1 -- Single miss:** Mark [X]. Log normally. No action required.

**Stage 2 -- Two consecutive misses on [habit name]:**
- Next scheduled day: do MVH only
- Write "Restarted [habit] with MVH on [date]" in tracker

**Stage 3 -- Three consecutive misses -- Diagnostic:**
Answer these four questions:
- [ ] Is [frequency] realistic right now? If no: drop to [next lower frequency]
- [ ] Is the MVH ([MVH description]) doable in under 5 min with no setup? If no: rebuild it
- [ ] Is [scheduled time] still a good time? If no: move to [alternative time]
- [ ] Is this habit still linked to a current goal? If no: pause it
Modify one variable only. Note the change in the tracker.

**Stage 4 -- Five consecutive misses or 2 weeks below 40%:**
- Option A (Simplify): Reduce frequency to [specific lower target] or reduce full version to [specific reduced version]
- Option B (Pause): Move to Phase 2 queue. Mark as "Paused [date]" in tracker. No guilt -- paused is not failed

**Never delete tracking history. Never restart from Week 1.**

---

### Weekly Review Template

**Scheduled:** [Day] at [Time] | Location: [Where]
**Duration:** 10 minutes maximum

**Part A -- Completion Rates (fill in):**
| Habit | Done | Target | Rate | vs. Last Week |
|-------|------|--------|------|---------------|
| [Habit 1] | | /[n] | % | ↑ / ↓ / = |
| [Habit 2] | | /[n] | % | ↑ / ↓ / = |
| **Overall** | | /[total] | % | ↑ / ↓ / = |

**Part B -- Pattern Check:**
- Misses clustered on: __________ (day/time/context)
- Recovery protocol triggered: [ ] Yes -- [habit name] [ ] No

**Part C -- Decision per Habit:**
| Habit | Rate | Decision | Change Made |
|-------|------|----------|-------------|
| [Habit 1] | % | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |
| [Habit 2] | % | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |

**Phase Queue Check:**
- [ ] Is overall completion 70%+ for 4 consecutive weeks? If yes, add: [next Phase 2 habit]
```

---

## Rules

1. **Never include motivational content, habit psychology explanations, or behavior change coaching.** This skill outputs a system design document. If the user asks why habits work or how to find motivation, redirect to appropriate health-wellness skills before returning here for system design

2. **Every non-Established habit must have an MVH.** A habit definition without an MVH is incomplete. If the user resists defining an MVH ("I just want to do the real thing"), explain that the MVH is not the expected behavior -- it is the floor that prevents the streak from breaking entirely. Established habits (80%+ already) are the only exception

3. **The MVH must pass the four-criteria test before it is accepted:** Under 5 minutes, zero-willpower on a 2/10 energy day, same behavior type as the full version, same location and time as the full version. If a proposed MVH fails any criterion, it must be redesigned

4. **Habit count hard caps:** Maximum 7 active habits total, maximum 3 new habits simultaneously, maximum 3 total habits for first-time trackers. If the user pushes back, do not negotiate up -- instead build explicit Phase 2 and Phase 3 queues so nothing is "lost"

5. **Frequency-accumulation habits must never be pinned to specific days.** "Run 4 times this week" is correct. "Run Monday, Tuesday, Thursday, Saturday" converts schedule variance into false misses and degrades completion rate accuracy. Only binary daily habits and threshold daily habits get assigned to specific days

6. **Rest days and missed days must use different symbols.** Using the same mark (or no mark) for both corrupts the completion rate calculation, which is the primary decision input for the weekly review. A rest day excluded from the denominator and a miss counted as zero in the numerator produce completely different rates

7. **The recovery protocol must be written into the tracker output itself,** not just referenced. When a streak breaks at 11 PM, the user cannot remember what the protocol said. It must be visible on the same page or screen as the tracking grid

8. **Weekly review must be scheduled to a specific day, time, and location in the output.** "Every Sunday" is insufficient. "Sunday at 7:30 PM at the kitchen table, after dinner and before the week-ahead planning" is a schedulable anchor. Unanchored reviews do not happen consistently

9. **Both full completion and MVH completion count equally toward streaks and completion rates.** Do not design a system where MVH counts as "half" toward completion rate. The purpose of tracking consistency is to measure behavioral presence, not effort level. Half-credit systems create shame around MVH use and defeat its purpose

10. **If a habit has been below 50% completion for 2 consecutive weeks, the output must generate a Stage 3 diagnostic -- it must not simply continue logging the failure.** A tracker that records failures without prompting investigation is not a system -- it is a failure journal. The weekly review decision framework must force an action on underperforming habits

11. **Do not assign category labels that imply judgment.** "Health" is a category. "Self-care" implies the user is neglecting themselves without it. "Financial discipline" implies moral valence. Use neutral, descriptive category names

12. **Threshold habits require explicit pass/fail lines.** "Drink enough water" is not trackable. "Drink at least 64oz by 8 PM" is trackable. For every threshold habit, the exact threshold and measurement method must be defined in the Habit Definitions table before the tracker is built

---

## Edge Cases

### User Wants to Track More Than 10 Habits

This is the most common over-design failure. Do not simply pick 7 and discard the rest -- the user will feel that their priorities are being dismissed and will either resist the system or maintain a shadow list they feel guilty about.

Correct approach:
1. Have the user rate each habit on two axes: "How important is this to me right now?" (1-5) and "How ready am I to actually do this?" (1-5). Multiply scores for each habit
2. The top 3-4 non-Established habits become Active. The next 2-3 go to Phase 2. The rest go to Phase 3
3. Explicitly document Phase 2 and Phase 3 in the tracker output with the condition for adding each: "Add [habit] to Active when overall completion is 70%+ for 4 consecutive weeks"
4. Tell the user: "Your Phase 2 list is not abandoned -- it has a specific on-ramp condition. You are not giving up these habits; you are sequencing them to maximize success with all of them"

### User's Habits Are Too Vague to Track

Vague habits are not trackable because they have no completion state. Common vague habits and their decompositions:

- "Be healthier" → decompose by domain: movement ("Walk at least 20 minutes"), nutrition ("Eat a vegetable at lunch"), sleep ("In bed by 11 PM")
- "Read more" → "Read at least 10 pages of a non-fiction book before bed"
- "Be more productive" → "Complete my top-3 task list before checking email" or "Work in 90-minute focused blocks, 2 per day"
- "Meditate" (acceptable but threshold needed) → "Sit for at least 5 minutes of silent or guided meditation"
- "Spend time with family" → "Call or text one family member today" or "Eat dinner with family with no phones"

The test: Can the user answer "did I do this today?" with a binary yes/no? If yes, the habit is trackable. If the answer requires judgment or feels approximate, decompose further

### User Is Restarting After a Failed Previous Attempt

Do not design a new tracker until the failure mode is identified. Ask directly: "What caused you to stop last time?" Map the answer to one of these failure modes:

- **Too many habits:** Built a 12-habit tracker, fell off 3, abandoned the whole thing. Fix: Start with 3 habits. Build the phase queue so the others have a path
- **MVH was too hard:** "My minimum was still 20 minutes of exercise. On bad days that felt impossible." Fix: Rebuild MVH from scratch using the four-criteria test
- **Tracker was inconvenient:** "The app required too many taps" / "The notebook was in another room." Fix: Move the tracker to where the habits happen. Phone lock screen habit list. Journal next to the coffee maker
- **Missed days caused shame spiral:** "I missed two days and felt like a failure so I just stopped tracking." Fix: Explicitly design the recovery protocol for this pattern. The tracker must have written permission to have gaps. Include the rule: "Gaps are data, not failure"
- **No weekly review:** "I just stopped noticing the tracker was declining." Fix: Schedule the weekly review first, before designing anything else. The review is the system's immune response

Address the specific failure mode in the system design before building the new tracker

### User Has Highly Irregular Schedules (Shift Work, Heavy Travel, Caregiving)

Day-of-week assignment fails for users whose schedule rotates. Fix with frequency accumulation for most habits:

- Replace "Meditate every day" with "Meditate 6 times this week -- any days"
- Replace "Exercise Monday, Wednesday, Friday" with "Exercise 3 times this week -- any days"
- For habits that genuinely must be daily (sleep schedule, medication-adjacent habits, sobriety tracking), keep them daily but lower the failure threshold -- a miss on a travel day is environmental, not behavioral
- Design the tracker with a weekly count column instead of a daily checkmark grid. The user tallies each time they complete the habit, regardless of day
- Weekly review for irregular-schedule users should evaluate trailing 4-week averages rather than week-by-week rates, which oscillate too much with schedule shifts to be diagnostic

### User Wants to Track an Outcome, Not a Behavior

Outcome tracking ("lost 2 lbs this week," "saved $200") is not habit tracking -- outcomes are downstream of behaviors and are affected by variables outside the user's direct control. Tracking outcomes without tracking the behaviors that produce them provides no actionable information when things go wrong.

Redirect strategy:
- Identify the behaviors that produce the outcome
- "Lost weight" → behaviors: logged food, walked 30 minutes daily, slept 7+ hours, skipped late-night snacking
- "Saved money" → behaviors: logged every purchase, packed lunch instead of buying, reviewed subscriptions monthly
- Build the tracker around the behaviors. Add a separate "outcome log" row if the user wants to record outcomes, but do not tie it to the streak or completion rate. Make it a data point, not a pass/fail metric

### User Wants to Track Habits With Other People (Couple, Accountability Partner)

This skill is designed for single-user personal trackers. Shared tracking introduces different dynamics: social desirability bias, competitive pressure, and asymmetric schedules.

If the user wants shared tracking:
- Design individual trackers for each person using this skill
- Add a single shared weekly check-in field: "Did I share my completion rate with [partner] this week? [ ] Yes [ ] No"
- The accountability action is the check-in, not the shared tracker. Each person maintains their own system
- Do not merge the trackers into a joint grid -- the completion rates and habits will differ, and one person's misses will become visible to the other in ways that can create friction

### User Wants to Track Mental or Emotional States as Habits

States are not behaviors. "Feel less anxious" cannot be tracked as a habit. However, users often express this as "I want to track my mood" or "I want to track my stress levels."

If the user wants state tracking alongside behavior tracking:
- Separate it visually from the habit grid -- states go in a "Daily Log" section, not the habits table
- Use a 1-5 scale with a specific prompt: "Overall energy today (1=depleted, 5=high)" or "Anxiety level at end of day (1=calm, 5=high)"
- Do not apply pass/fail logic, streaks, or recovery protocols to state scores -- they are contextual data
- State scores are most useful in the weekly review to identify correlations: "My exercise completion rate was 100% on weeks where my energy scores were 4+." This makes state tracking analytically useful without treating emotional states as tasks to be completed

---

## Example

**Input:** "I want to start tracking some daily habits. I want to meditate, exercise, read, journal, and drink enough water. I've tried tracking before but always fall off after about 2 weeks. I work from home and my schedule is pretty flexible but I tend to be more motivated in the mornings."

---

### Preliminary Assessment

**Failure mode diagnosis:** Fell off at 2 weeks. Most common causes at this interval are: too many habits built simultaneously, no recovery protocol for missed days, no weekly review to catch early decline. This design will address all three explicitly.

**Habit count:** 5 habits. Within the 7-habit active cap. All are new or inconsistent for this user (inferred from "tried before and fell off"), so all need MVH design.

**Schedule note:** Flexible schedule, morning motivation peak. All habits will be anchored to the morning where possible. Evening logging at 9 PM.

---

## Personal Habit Tracker System

### Habit Inventory and Phase Assignment

**Active Habits (tracking now -- all 5 are within the 7-habit cap):**

| # | Habit | Type | Category | Frequency | Status | Phase |
|---|-------|------|----------|-----------|--------|-------|
| 1 | Meditate | Binary | Health | Daily (7/7) | Emerging | Active |
| 2 | Exercise | Binary | Health | 4x/week (accumulation) | Emerging | Active |
| 3 | Read | Threshold (10+ pages) | Learning | Daily (7/7) | Emerging | Active |
| 4 | Journal | Binary | Productivity | Daily (7/7) | New | Active |
| 5 | Drink water | Threshold (64oz by 8 PM) | Health | Daily (7/7) | Emerging | Active |

**Note on exercise frequency:** Exercise is set as 4x/week accumulation, not pinned to specific days. Given a flexible work-from-home schedule, this gives freedom to respond to energy levels across the week without creating false misses when a specific day does not work out.

**Phase 2 Queue:** None at this time -- 5 habits is a reasonable starting load. Revisit after 8 consecutive weeks above 70% overall completion if the user wants to add habits.

---

### Minimum Viable Habit Definitions

| # | Habit | Full Version | Minimum Viable Habit | MVH Duration | Outcome Link |
|---|-------|-------------|---------------------|-------------|-------------|
| 1 | Meditate | 15-minute guided meditation session | Sit in the meditation spot, close eyes, take 10 slow breaths | 2 minutes | Reduces baseline anxiety and improves morning focus before work |
| 2 | Exercise | 30-minute workout (run, gym, or bodyweight circuit) | Put on workout clothes and do 5 push-ups + 5 air squats | 2 minutes | Supports energy, mood stability, and long-term cardiovascular health |
| 3 | Read | Read 20 pages of current book | Read 2 pages -- open the book, read two full pages, close it | 3 minutes | Builds sustained focus and accumulates learning across months |
| 4 | Journal | Write 1 full page reflecting on the day's events, thoughts, or goals | Write one sentence: the most important thing that happened today | 1 minute | Processes the day, reduces mental clutter before sleep, builds self-awareness over time |
| 5 | Drink water | Drink at least 64oz (8 glasses) of water by 8 PM | Drink one full 16oz glass of water before 10 AM and one by 3 PM | 1 minute | Maintains baseline hydration for focus, energy, and physical health |

**MVH Statements:**
- **Meditate:** "On a perfect day, I do a 15-minute guided meditation. On a hard day, I sit down, close my eyes, and take 10 slow breaths -- and that counts."
- **Exercise:** "On a perfect day, I do a 30-minute workout. On a hard day, I put on my workout clothes and do 5 push-ups and 5 air squats -- and that counts."
- **Read:** "On a perfect day, I read 20 pages. On a hard day, I open the book and read 2 pages -- and that counts."
- **Journal:** "On a perfect day, I write a full page. On a hard day, I write one sentence about today -- and that counts."
- **Drink water:** "On a perfect day, I drink 64oz by 8 PM. On a hard day, I drink one glass before 10 AM and one by 3 PM -- and that counts."

---

### Weekly Tracking Grid

**Daily logging time:** 9:00 PM -- anchor: after brushing teeth, before turning off the work laptop
**Legend:** [V] = Full | [m] = MVH | [X] = Missed | [-] = Rest/Unscheduled | [?] = Forgot to log (treat as missed in rate calculation)
**Exercise note:** Exercise gets [-] on 3 rest days per week. Rest days are flexible -- mark them at the start of each week or in real time.

| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Done | Target | Rate |
|-------|-----|-----|-----|-----|-----|-----|-----|------|--------|------|
| Meditate | | | | | | | | | /7 | % |
| Exercise | | | | | | | | | /4 | % |
| Read | | | | | | | | | /7 | % |
| Journal | | | | | | | | | /7 | % |
| Water | | | | | | | | | /7 | % |
| **Total** | /5 | /5 | /5 | /5 | /5 | /5 | /5 | | /33 | % |

**Note on Exercise total column:** The weekly total target for exercise is 4. On any week, 3 days will show [-] for exercise and will not count toward the /33 weekly total. The actual weekly maximum is 30 completed daily habits (5 habits × 7 days, minus 3 exercise rest days = 32 scheduled slots).

**Streak counter:** Current streak: ___ days | Personal best: ___ days
**Streak definition for this system:** A streak day = every *scheduled* habit completed (full or MVH) that day. Exercise rest days do not break the streak.

---

### System Rules

1. Log the tracker at 9:00 PM every day. Do not skip logging even on days when nothing was completed -- the logging act is itself the meta-habit that holds the system together
2. Full completion = [V]. MVH completion = [m]. Both count equally toward streaks and the weekly completion rate. MVH is never a penalty or a partial score
3. Exercise rest days = [-]. Mark three rest days per week for exercise. These are flexible -- choose them based on your week. A [-] day is not a miss and does not affect the completion rate denominator
4. MVH is available whenever available time is under 10 minutes OR self-assessed energy is 4/10 or below. You are the only judge. There is no wrong answer about your own energy
5. Recovery protocol activates after 2 consecutive missed days on any single habit. This is not optional -- it is a built-in system response, not a judgment
6. No new habits are added until overall completion rate is 70%+ for 4 consecutive weeks. This rule exists to protect the habits you have already started
7. Weekly review: Sunday at 7:30 PM, at the kitchen table, before evening wind-down

---

### Recovery Protocol

**Stage 1 -- Single miss on any habit:**
Mark [X] in the grid. Log normally at 9 PM. No action required. One miss is not a trend.

**Stage 2 -- Two consecutive missed days on the same habit:**
- The next scheduled day for that habit: do the MVH version only (not the full version)
- Write one line in the notes section: "Restarted [habit] with MVH on [date]"
- Full version resumes the following day

**Stage 3 -- Three consecutive missed days on the same habit -- Run this diagnostic:**
- [ ] Is the current frequency (daily or 4x/week) realistic for this period of life? If no: reduce by one step
  - Daily → 5x/week → 3x/week → 2x/week
- [ ] Is the MVH version still completable in under 5 minutes with zero setup? If no: rebuild it right now. Write the new MVH below
- [ ] Is the scheduled time (morning, before 9 PM log) still working? If no: pick a new anchor time and write it here: ______
- [ ] Is this habit still linked to something I care about? If no: pause it -- that is the right call, not a failure

Modify exactly one variable. Write the change in the tracker notes. Do not redesign the whole system.

**Stage 4 -- Five consecutive missed days OR below 40% completion for 2 consecutive weeks on one habit:**

Choose one:
- **Simplify:** Reduce frequency by one step (see above) OR reduce the full version target (e.g., change "20 pages" to "10 pages" for Read)
- **Pause:** Move to Phase 2 queue. Write "Paused [habit] on [date]" in the tracker. A paused habit has a re-entry condition: "Resume when I have been above 70% overall for 2 consecutive weeks"

**Standing rule: Never delete tracking history. Never start a new tracker from Week 1.** The gaps you see in the grid are information about what was happening in your life during those weeks. They are not evidence of failure -- they are a longitudinal record of a real person living a real life.

---

### Weekly Review Template

**Scheduled:** Every Sunday at 7:30 PM | Location: Kitchen table | Anchor: After dinner, before evening wind-down
**Duration target:** 10 minutes maximum. If it takes longer, the system is over-complicated

**Part A -- Completion Rates (fill in after counting the grid):**

| Habit | Done | Target | Rate | vs. Last Week |
|-------|------|--------|------|---------------|
| Meditate | | /7 | % | ↑ / ↓ / = |
| Exercise | | /4 | % | ↑ / ↓ / = |
| Read | | /7 | % | ↑ / ↓ / = |
| Journal | | /7 | % | ↑ / ↓ / = |
| Water | | /7 | % | ↑ / ↓ / = |
| **Overall** | | /32 | % | ↑ / ↓ / = |

**Part B -- Pattern Check:**
- Were any misses clustered on a specific day? __________ (If yes, that day has a scheduling conflict, not a willpower problem)
- Did any habit trigger the recovery protocol this week? [ ] Yes -- [habit name] [ ] No
- What was the highest-energy part of the week, and did the habits happen then? __________

**Part C -- Decision per Habit:**

| Habit | Rate | Status | Decision | Change (if any) |
|-------|------|--------|----------|-----------------|
| Meditate | % | | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |
| Exercise | % | | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |
| Read | % | | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |
| Journal | % | | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |
| Water | % | | [ ] Maintain [ ] Investigate [ ] Simplify [ ] Pause [ ] Advance | |

**Decision thresholds:**
- 70%+ for 2+ weeks → Maintain
- 50-69% → Investigate (note pattern, no change yet)
- Below 50% for 2 consecutive weeks → Simplify (reduce one variable)
- Below 40% for 2 consecutive weeks → Pause (move to Phase 2 queue)
- 90%+ for 3 consecutive weeks AND full version feels easy → Advance (increase full version only, not frequency)

**Phase Queue Check:**
- [ ] Overall completion rate 70%+ for 4 consecutive weeks? If yes, eligible to add the next Phase 2 habit
- Current Phase 2 queue: *(none at this time -- revisit after 8 weeks if desired)*

**Streak Log:**
- This week's streak days: ___
- Running streak at end of week: ___ days
- Personal best streak: ___ days (set on: _________)

---

**Note on previous failure pattern:** You mentioned falling off at the 2-week mark before. Two-week abandonment most often happens because a few misses in a row trigger shame, which triggers tracker avoidance, which makes the gap grow, which makes restarting feel harder. This system addresses that directly: the recovery protocol gives you a scripted, guilt-free response to any miss, the MVH ensures there is always a version of every habit you can do, and the weekly review catches decline at the pattern level before it becomes abandonment. The tracker does not care how you fell off -- it only asks what you did next.
