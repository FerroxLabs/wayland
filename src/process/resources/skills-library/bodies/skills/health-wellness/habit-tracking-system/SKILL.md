---
name: habit-tracking-system
description: |
  Creates personalized habit tracking systems using paper trackers, digital templates, and streak-based formats. Gathers the user's habits to track and preferences, then produces ready-to-use tracking templates with scoring rules, review prompts, and minimum viable habit definitions for streak preservation.
  Use when the user asks about habit trackers, tracking daily habits, building a habit dashboard, maintaining streaks, or measuring habit consistency.
  Do NOT use for building new habits from scratch (use habit-stacking-framework), creating challenges (use 30-day-habit-challenge), or clinical behavior tracking.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting checklist habits self-care"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Habit Tracking System

> **Disclaimer:** This skill provides general wellness and habit-formation information for educational and organizational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. Always consult a qualified healthcare professional before making decisions about your health or beginning a new wellness program. If tracking-related anxiety, perfectionism, or obsessive patterns emerge, refer the user to a licensed mental health professional.

---

## When to Use

**Use this skill when:**
- The user wants to create a habit tracker from scratch -- paper, digital, or app-based -- and needs a ready-to-use template they can start today
- The user is already tracking habits but their system feels chaotic, overwhelming, or has broken down and they want a redesign
- The user asks how to measure habit consistency, calculate completion rates, or quantify their progress over time
- The user wants to maintain streaks across multiple habits and needs rules that prevent all-or-nothing thinking from derailing them
- The user wants a habit dashboard that shows multiple habits on a single view -- a daily scorecard, a monthly grid, or a weekly summary
- The user wants to track habits for a specific domain: sleep, fitness, nutrition, mental health, creative practice, productivity, or relationships
- The user needs to define what "done" means for each habit so there is no ambiguity during daily marking

**Do NOT use when:**
- The user wants to build a new habit from scratch using environmental design, cue-routine-reward loops, or implementation intentions -- use `habit-stacking-framework` instead
- The user wants a structured 30-day progressive challenge with escalating difficulty -- use `30-day-habit-challenge` instead
- The user wants to identify the triggers, cravings, or environmental cues that drive existing behaviors -- use `trigger-identification` instead
- The user is asking about breaking a bad habit or reducing a harmful behavior -- tracking alone is insufficient and may reinforce the behavior through attention
- The user needs clinical behavior tracking for a therapeutic treatment plan, OCD management, or eating disorder recovery -- this is beyond the scope of a wellness skill and requires professional oversight
- The user has explicitly mentioned that tracking makes them anxious, obsessive, or perfectionistic -- begin with the Minimal Check-In format and monitor before building a full system
- The user wants accountability with another person or coach -- habit tracking produces the data, but accountability structure requires a separate social-commitment framework

---

## Process

### Step 1: Conduct a Habit Audit

Before building anything, understand what the user already has and what they actually want to track.

- Ask: "What habits do you want to track? List every single one, even if you are not sure." Let them brain-dump without filtering.
- Ask: "Are these habits you already do inconsistently, or habits you are trying to establish?" This determines whether the habit needs identity reinforcement (new) or consistency tools (existing).
- Ask: "How long have you been doing each of these habits?" Less than 2 weeks = new habit (fragile, needs simple tracking). 2 weeks to 90 days = developing habit (building automaticity). 90+ days = established habit (tracking for maintenance and data).
- Ask: "How are you currently tracking, if at all?" A user with no tracking system needs a full build. A user with an abandoned tracker needs a redesign, not more complexity.
- Ask: "What medium do you prefer?" Paper grid (physical, visible, tactile satisfaction), spreadsheet (data-oriented, percentage-focused), notes app (minimal, journal-style), or a dedicated habit app (notification-driven, gamified). Match the system to the user, never the reverse.
- Note any habits that are vague or emotion-based ("be healthier", "stress less", "be more present") -- these must be converted to observable behaviors in Step 3 before they can be tracked.

### Step 2: Apply the Habit Load Limit

Tracking too many habits simultaneously is the single most common reason habit tracking systems fail. Apply hard limits.

- **The hard maximum is 7 habits.** This is not a preference -- it is a system constraint. Research in self-regulation shows that monitoring load degrades decision quality beyond 5-7 tracked items. When users exceed this, tracking fatigue causes them to abandon the entire system rather than individual habits.
- **Recommended starting load:**
  - Beginner (0-3 months of consistent tracking experience): 3 habits maximum
  - Intermediate (has maintained a tracker for at least 3 months): 5 habits
  - Advanced (consistent tracker for 6+ months): Up to 7 habits
- If the user lists more habits than the limit allows, use a **Habit Priority Matrix**: rank each habit on two axes -- Impact (how much does doing this improve your life?) and Current Consistency (how often are you doing this already?). Track high-impact, low-consistency habits first. High-impact, high-consistency habits may not need tracking.
- Place excess habits in a **Habit Waitlist** -- a written list of habits to add one at a time once an existing habit reaches 80%+ monthly consistency for two consecutive months. This prevents premature addition and queue-jumps.
- If the user resists the limit, show them the math: 5 habits at 90% consistency = 135 completions per month. 10 habits at 50% consistency = 150 completions, but the user experiences constant failure and eventually quits everything. The first system wins on durability.

### Step 3: Define Each Habit with Precision

Every tracked habit needs three layers of definition before it can be tracked accurately.

- **Full Version (FV):** The optimal version the user does on a good day with adequate time and energy. This is specific and measurable. "Exercise" is not a full version. "30-minute run at a conversational pace" is a full version. "Meditate" is not a full version. "10-minute body scan meditation using a timer" is.
- **Minimum Viable Habit (MVH):** The smallest observable action that counts as keeping the habit alive. MVH rules: must take under 5 minutes, must require zero willpower or preparation, must share the core identity of the full version (putting on running shoes and doing 5 squats is in the running identity; watching a running video is not). The MVH is a streak-preservation tool, not a replacement for the full version.
- **Completion Criteria:** The exact, unambiguous condition that counts as "done." Remove all gray area. "Read" is ambiguous. "Read at least 1 page of a physical or digital book (not social media or news)" is unambiguous. This matters at 10pm when the user is tired and negotiating with themselves.
- **Frequency:** Daily (7x/week), near-daily (5-6x/week), or scheduled (specific named days, e.g., Monday/Wednesday/Friday). Weekly habits tracked on a daily grid should have blank cells on non-scheduled days -- a blank cell on a rest day is not a miss.
- **Point Value (for Scorecard format):** Assign 1-5 points based on the habit's health impact and difficulty. A habit that takes 30+ minutes and requires physical effort (exercise, long meditation) earns 3-5 points. A habit that takes under 2 minutes and requires no preparation (vitamins, 1 glass of water, short gratitude note) earns 1-2 points. Point weighting makes high-impact habits count more toward the weekly score.
- For vague habits, apply the **Observable Behavior Conversion**: identify the internal state the user wants to cultivate, then define the smallest observable action that produces or represents it. "Drink more water" → "Drink one 16oz glass of water before coffee every morning (binary: yes/no)." "Be more grateful" → "Write 3 specific things I noticed today that I am grateful for (not generic -- must be specific to today)."

### Step 4: Select the Tracking Format

Match the format to the user's cognitive style, environment, and available time. Present the options and let the user choose -- do not assume.

**Format 1: Paper Monthly Grid**
- Structure: Habits on rows, days 1-31 on columns, one sheet per month. Hang it where the habit happens (bathroom mirror for morning habits, kitchen for nutrition habits, desk for work habits).
- Marking system: X = full completion, / = MVH, blank = missed. Optional: color the cells with markers (green/yellow/red) for visual impact.
- Best for: Visual processors, people who want a physical cue, users who do not want screen time in their routine, users who find satisfaction in physical marking (the "satisfying X" effect).
- Limitation: Cannot auto-calculate percentages. Requires counting manually at weekly review. Not portable unless photographed.
- Supports: 3-7 habits comfortably on one standard portrait-orientation sheet.

**Format 2: Digital Spreadsheet with Conditional Formatting**
- Structure: One tab per month. Column A = habit names. Column B = point values. Columns C onward = days of the month. A summary column calculates monthly completion rate using COUNTIF formulas.
- Conditional formatting: cells marked "1" (full) turn green, cells marked "0.5" (MVH) turn yellow, cells marked "0" turn red, blank cells remain white.
- Completion formula: =COUNTIF(C2:AG2,"1")/DAY(EOMONTH(A1,0)) -- gives percentage of full completions for the month.
- Best for: Data-oriented users, users who want to see trends across months, users who travel and want access on phone and desktop.
- Limitation: Requires initial setup time (30-45 minutes for a full template). Needs a device to mark daily. Conditional formatting setup is not intuitive for non-spreadsheet users.
- Supports: Unlimited habits, but visual clarity degrades above 10 rows.

**Format 3: Minimal Daily Check-In (Journal Style)**
- Structure: Three questions answered daily in a notes app, paper journal, or text file. No grids. No columns. Questions: (1) Which habits did I complete today? (2) Did I do the full version or MVH for each? (3) How is my energy and mood today? (1-10)
- Best for: Users who dislike visual grids, users who already journal, users for whom structured tracking has previously caused anxiety, users tracking subjective or hard-to-quantify habits.
- Limitation: Hard to calculate consistency percentages without manual counting. Streaks are visible only by scrolling through entries. Not visually motivating.
- Weekly review adds: Copy the week's entries to a summary note. Count completions manually. One sentence summary.
- Supports: Any number of habits, but practically useful only for 3-5 without becoming repetitive.

**Format 4: Daily Scorecard**
- Structure: Each day has a possible score based on the sum of all habit point values. The user earns points for full completions, partial points for MVH. The daily score is compared to a "good day" threshold (typically 70% of possible points). Weekly score is compared to a "good week" threshold.
- Best for: Gamification-motivated users, users with a competitive mindset, users who do not want to feel guilty about imperfect days (a score of 8/10 is objectively good, even if one habit was missed), users who respond to percentages over binary pass/fail systems.
- The scorecard separates performance from identity: "I scored 7/10 today" is more emotionally neutral than "I missed two habits today."
- Supports: 3-10 habits. Above 10 habits, daily score calculation becomes burdensome even mentally.

**Format 5: Habit Stack Anchor Sheet (for users building habit stacks)**
- A one-page list of habits organized by anchor event (wake up, after coffee, at lunch, before dinner, before bed) rather than by time of day. Each anchor has 2-3 attached habits. The user marks the anchor event and each attached habit as a unit.
- This format is most effective when habits are already linked to existing routines. It reinforces the habit stack structure rather than treating each habit as an independent item.
- Best used in combination with: `habit-stacking-framework` outputs.

### Step 5: Build the Ready-to-Use Template

Produce the complete, ready-to-use template -- not a description of it, but the actual template the user can copy, print, or enter into their tool of choice.

- For paper formats: provide the exact grid structure, all labels, marking key, and point values. The user should be able to print or draw this template with no additional decision-making.
- For spreadsheet formats: provide the exact cell structure with column headers, row labels, formula text, and conditional formatting instructions. Include a sample row with data to demonstrate how it looks when filled in.
- For journal formats: provide the exact three questions, a sample daily entry, and weekly review prompts.
- For scorecard formats: provide the full scoring table, the daily max score, the "good day" threshold (70%), the weekly max score, and the "good week" threshold (71%).
- Every template must include: the marking key (what each symbol or value means), the MVH indicator (a distinct marking that differs from full completion), and a streak counter column or row.
- Include the habit definitions table with all five columns (Habit, Full Version, MVH, Frequency, Points) filled in for the user's specific habits. Do not leave blank rows -- fill in every row with the user's actual habits.

### Step 6: Define Scoring, Streak, and Streak Insurance Rules

Streak rules must be explicit. Users will encounter edge cases and make decisions that erode their system without clear rules.

- **Streak continuation rules:** A streak continues for any day on which either the Full Version or the MVH was completed. A day with neither is a miss.
- **Streak insurance (the "Never Miss Twice" protocol):** If the user misses one day, they can prevent the streak from resetting by completing the MVH on the following day. This applies once per 7-day window -- it cannot chain. Three consecutive MVH completions without any Full Version day should trigger a check-in: is the Full Version too hard, or is something in the user's life causing the dip?
- **Streak reset:** After two consecutive missed days, the streak resets to 0. The reset is recorded, not erased -- in the monthly review, count total reset events as data (2 resets per month = a signal that the habit or its definition needs adjustment).
- **Retrospective marking rule:** If a user forgets to mark for 1-3 days but can recall what they did, retrospective marking is permitted. Beyond 3 days, do not guess -- mark as missed and move on. Falsified data degrades the value of the weekly and monthly reviews.
- **Partial credit philosophy:** MVH completion earns half points (rounded up) and preserves the streak, but is NOT equivalent to full completion in the weekly summary. The weekly review should distinguish between full-completion days and MVH days. A month of mostly MVH completions is a signal: the full version may need to be recalibrated, or the user's life load may need a honest acknowledgment.

### Step 7: Schedule Reviews and Install the Review Habit

A tracking system without review is data without insight. Reviews are where the behavior change actually happens.

- **Daily review (1-2 minutes, same time every day):** The daily review is marking-only, not analysis. Pick a consistent time: immediately after a fixed anchor event (brushing teeth, finishing dinner, turning off the desk lamp). The review must be triggered by something that already happens every day, not a calendar alarm alone. Place the tracker physically in the review location or set the spreadsheet as the device's home screen.
- **Weekly review (10 minutes, same day and time each week, typically Sunday evening or Monday morning):**
  - Calculate this week's total points and compare to the weekly target
  - Identify the habit with the lowest completion rate this week
  - Name one concrete obstacle that caused misses (not "I was busy" -- what specifically competed for the time/energy?)
  - Decide on one micro-adjustment for next week (change the time, simplify the MVH, move the habit anchor, reduce the target from daily to 5x/week)
  - Note current streak for each habit
- **Monthly review (20 minutes, first day or first Sunday of each month):**
  - Calculate overall monthly consistency for each habit: (full completions + (MVH completions × 0.5)) / days in month × 100
  - Identify any habit that exceeded 80% consistency for two consecutive months -- this habit may be becoming automatic. Consider removing it from the tracker or replacing it with a harder version.
  - Identify any habit below 50% consistency -- this habit needs a root cause analysis. Is the definition too ambitious? Is the MVH not low enough? Is this habit actually not a priority?
  - Consult the Habit Waitlist. Is any existing habit ready to be promoted to automatic? If so, add the next waitlisted habit.
  - Ask the alignment question: "Are these habits still the right habits for where I want to be in 90 days?"

### Step 8: Deliver with Implementation Guidance

The difference between a template the user uses and one they abandon is often the first-use instruction.

- Specify exactly when the user should start. "Start on the 1st of next month" invites procrastination. "Start tomorrow morning" is better. "Start today, even mid-month -- a partial month of data is better than zero" is best.
- Identify the physical or digital location where the tracker will live. The tracker must be visible at the time of the habit, not buried in a folder.
- Predict the first hard moment: "On Day 4 or 5, you will feel like skipping marking because nothing bad will happen if you do. This is the critical moment. Do the MVH. Mark the cell. The system works if you mark it."
- Remind the user that the first two weeks are the hardest because the tracking itself is a new habit. After two weeks, marking feels automatic. If it still feels like a burden at Week 3, the format is wrong -- not the user.

---

## Output Format

```
## Habit Tracking System

**Habits Tracked:** [X] habits
**Format:** [Paper Grid / Digital Spreadsheet / Minimal Check-In / Scorecard / Habit Stack Anchor Sheet]
**Tracking Start Date:** [Specific date]
**Daily Max Points:** [X]
**Weekly Max Points:** [X × 7]
**Good Week Threshold:** [70% of weekly max = X points]

---

### Habit Definitions

| # | Habit | Full Version | MVH (Minimum Viable) | Frequency | FV Points | MVH Points |
|---|-------|-------------|---------------------|-----------|-----------|------------|
| 1 | [name] | [specific, measurable description] | [under-5-min, zero-prep action] | Daily / [X]x week | [X] | [ceil(X/2)] |
| 2 | [name] | [specific, measurable description] | [under-5-min, zero-prep action] | Daily / [X]x week | [X] | [ceil(X/2)] |
| 3 | [name] | [specific, measurable description] | [under-5-min, zero-prep action] | Daily / [X]x week | [X] | [ceil(X/2)] |
| 4 | [name] | [specific, measurable description] | [under-5-min, zero-prep action] | Daily / [X]x week | [X] | [ceil(X/2)] |
| 5 | [name] | [specific, measurable description] | [under-5-min, zero-prep action] | Daily / [X]x week | [X] | [ceil(X/2)] |

**Waitlisted habits (add after an existing habit reaches 80% for 2 consecutive months):**
- [Habit 6]
- [Habit 7]

---

### Tracking Template

[Complete, ready-to-use template -- grids, tables, formulas, or questions
as appropriate for the chosen format. No placeholders. Fully populated
with the user's specific habits, point values, and marking keys.]

**Marking Key:**
- X = Full Version completed (full points)
- / = MVH completed (half points, streak preserved)
- blank = Missed (0 points, streak at risk)

---

### Scoring Rules

| Completion Type | Points Earned | Streak Status |
|-----------------|--------------|---------------|
| Full Version (X) | [X] per habit | Continues |
| MVH (/) | [ceil(X/2)] per habit | Continues |
| Missed (blank) | 0 | Day 1 of risk |
| Missed 2 consecutive days | 0 | Streak resets to 0 |

**Daily target:** [X] points ([Y] habits × average [Z] points)
**Weekly target:** [X] points (70% of [Y] possible)
**Monthly consistency target:** 80%+ for each habit

**Streak Insurance Protocol:**
- Missed yesterday? Do the MVH today to preserve the streak (usable once per 7-day window)
- Missed two days in a row? Streak resets. Mark the new start date. Begin counting.
- No guilt clause: a reset is data, not failure.

---

### Review Schedule

**Daily (1-2 minutes, at [specific anchor event]):**
- Mark each habit: X, /, or leave blank
- Calculate today's score: ___ / [daily max]
- Note anything unusual that affected today (optional, 1 line)

**Weekly (10 minutes, every [day] at [time]):**
1. Total points this week: ___ / [weekly max]
2. Habit with lowest completion rate this week: _______________
3. Specific obstacle (not "busy" -- what actually happened?): _______________
4. One micro-adjustment for next week: _______________
5. Current streaks: [Habit 1]: ___ days | [Habit 2]: ___ days | [Habit 3]: ___ days

**Monthly (20 minutes, [day] of each month):**
1. Monthly consistency per habit:
   - [Habit 1]: ___ % | [Habit 2]: ___ % | [Habit 3]: ___ %
2. Any habit at 80%+ for 2 consecutive months? → Consider removing from tracker or upgrading to harder version
3. Any habit below 50%? → Root cause: too ambitious / wrong time / wrong MVH / not a real priority
4. Waitlist check: Is any slot open for the next waitlisted habit?
5. Alignment check: Are these still the right habits for my 90-day goals?

---

### Streak Summary

| Habit | Current Streak | Longest Streak This Month | Reset Count |
|-------|---------------|--------------------------|-------------|
| [Habit 1] | ___ days | ___ days | ___ |
| [Habit 2] | ___ days | ___ days | ___ |
| [Habit 3] | ___ days | ___ days | ___ |

**Streak Insurance uses this month:** ___ / [max 4 per month, 1 per 7-day window]
```

---

## Rules

1. **Never exceed 7 simultaneously tracked habits.** The maximum is a hard system constraint, not a recommendation. Beginners (under 3 months of tracking experience) should start with 3 habits and add only after 2 months of 80%+ consistency. The tracking habit itself is a new habit -- it needs to stabilize before more habits are loaded onto it.

2. **Every tracked habit must have a defined MVH before it can be placed on the tracker.** A habit without an MVH has only one speed: full effort or nothing. The MVH creates a floor that prevents complete system collapse during high-stress periods, illness, travel, and low-willpower days. The MVH must be observable, take under 5 minutes, and require zero preparation.

3. **The daily marking act must take under 2 minutes.** If marking itself takes longer, the tracking system has become a burden and will be abandoned before the habits fail. Complexity must be concentrated in the weekly review, not the daily marking. If a user has a system that takes 5+ minutes to mark daily, diagnose and simplify immediately.

4. **Never suggest punishment, penalties, or negative consequences for missed days.** The tracker is a measurement instrument, not a judgment system. Language matters: "missed" not "failed," "reset" not "broken," "paused" not "ruined." The no-guilt framing is not soft -- it is scientifically supported. Shame and self-criticism reduce the probability of resuming the behavior, not the reverse.

5. **Vague habits cannot be tracked and must be converted before building the system.** If a user submits an unmeasurable habit ("be healthier," "stress less," "spend more time with family"), pause and apply the Observable Behavior Conversion before proceeding. Ask: "What is the smallest specific action that would represent this to you?" A vague habit tracked inaccurately produces false data and erodes trust in the system.

6. **Always include weekly review prompts and schedule them with a specific anchor event.** The review converts raw tracking data into behavior-change intelligence. Without the review, the tracker is a record-keeping exercise, not a growth tool. The weekly review must be scheduled at a specific, named time and anchored to a recurring event in the user's week (Sunday night after dinner, Monday morning before email, etc.).

7. **Streak insurance applies once per 7-day rolling window, never consecutively.** Three consecutive MVH-only completions should trigger a check-in about whether the full version is correctly calibrated. Streak insurance is a recovery tool, not an alternative definition of consistency. If a user uses streak insurance more than twice in a month, the habit definition or life load needs adjustment -- do not simply extend the insurance policy.

8. **Tracking the wrong habits perfectly is not progress.** The monthly review must include an explicit alignment question: "Are these the right habits for my current goals?" A user who perfectly tracks five habits for three months but never asks this question may be optimizing for tracking performance rather than life improvement. Habits that have become fully automatic (95%+ consistency for 3+ months with no effort) are candidates for removal from the tracker and replacement with habits that still need reinforcement.

9. **Never recommend specific paid applications or commercial products.** Provide templates that function with free, universally accessible tools: plain paper, any notes application, any free spreadsheet software, basic phone calendar. If the user mentions a specific app they already use, adapt the template to that tool -- but do not initiate a product recommendation.

10. **If the user reports that tracking is causing anxiety, obsessive checking, or perfectionism, do not add more structure -- remove it.** Immediately simplify to the Minimal Check-In format (3 questions, no grids, no streaks) and reduce to 3 habits maximum. If distress persists or escalates after simplification, explicitly recommend that the user speak with a licensed mental health professional. Tracking-induced anxiety is a real phenomenon, particularly in users with perfectionist tendencies or a history of obsessive-compulsive patterns.

11. **Distinguish between new habits (fragile) and established habits (durable) when setting targets.** A habit practiced for less than 3 weeks needs a lower consistency target (50-60%) because variability is normal during the establishment phase. Setting an 80% target on a 2-week-old habit guarantees perceived failure. Calibrate targets to habit age: under 3 weeks = 50-60% target, 3 weeks to 3 months = 70-75% target, 3+ months = 80%+ target.

12. **Never conflate frequency reduction with failure.** If a daily habit realistically belongs at 5x/week for this user's life, redefining it as a 5x/week habit and achieving 90% consistency is not a compromise -- it is a more accurate definition. An honest tracker outperforms an aspirational tracker. A habit marked as daily but completed only 4x/week generates a false 57% completion rate. The same behavior marked as 5x/week generates an 80% completion rate and an accurate picture of what the user is actually doing.

---

## Edge Cases

### User Wants to Track 10+ Habits Simultaneously
Apply the Habit Priority Matrix immediately. Draw a 2×2 grid with "Impact on your goals" (low/high) on the Y-axis and "Current consistency" (low/high) on the X-axis. Place each habit in a quadrant. High impact + low consistency = Track now (these are the highest-ROI habits to reinforce). High impact + high consistency = Waitlist or remove (may already be automatic). Low impact + low consistency = Drop entirely (these are aspirational habits without commitment). Low impact + high consistency = Consider removing from tracker (already automatic, tracking may be unnecessary). Select the top 3-5 from the "Track now" quadrant. Place the rest in the waitlist with the explicit instruction: "You can add one habit from this list when any currently tracked habit reaches 80% consistency for two consecutive months."

### User Has an Existing Tracker That Has Broken Down
Do not build a new tracker on top of a failed one. Conduct an abandonment autopsy first. Ask: When did you stop using it? What was happening in your life then? What did the tracker look like (how many habits, what format)? How long did daily marking take? Common diagnoses and fixes: Too many habits (solution: cut to 3) -- no MVH definitions (solution: define MVH for each remaining habit) -- tracking took too long (solution: switch to Minimal Check-In) -- no weekly review (solution: add review before anything else) -- format mismatch (solution: change the format, not the habits) -- life disruption caused a miss that felt like failure (solution: add streak insurance and reframe the language). The rebuilt tracker should be materially simpler than the abandoned one. If the user had 8 habits, rebuild with 4. If they had a complex spreadsheet, rebuild with paper.

### User Wants to Track the Same Habits for the Whole Family
Do not build a single shared tracker for individual habits. Shared trackers for individual behaviors create comparison dynamics that undermine intrinsic motivation, particularly with children. Build one personal tracker per family member. For habits the family shares (weekly family dinner, device-free evenings, family walk), a shared tracker is appropriate -- but the shared tracker tracks the family unit's behavior, not individual compliance. Implement a low-friction family check-in: at a fixed time (dinner, car ride), each person states one habit win from the day in under 30 seconds. This creates social acknowledgment without scorecarding. For children, use sticker-based paper grids with 3 habits maximum, non-comparative framing ("Did you do your habit today?" not "Your brother did his habit today"), and reward milestones at 7-day and 21-day intervals rather than streaks, which children find discouraging after a reset.

### User Achieves 14 Days of Tracking Then Abandons the System
This is the most statistically common abandonment pattern. The cause is almost always the same: the novelty effect (tracking feels engaging at first) wears off at approximately Day 10-14, and the intrinsic reward of marking boxes is no longer sufficient to sustain the behavior. Prevention strategies: (1) Reward milestone at Day 14: a small, predetermined personal reward for completing 14 consecutive days of tracking -- not for habit completion, for the tracking behavior itself. The tracking habit needs reinforcement just like any other habit. (2) Reward milestone at Day 30: a larger reward at the first full month. (3) At the Week 2 review, make a deliberate, written re-commitment: "I am choosing to continue this system because ___." The written re-commitment counteracts drift. (4) If this has already happened (the user is describing a past system), add the milestone rewards retroactively in the rebuilt system and set a calendar event for the Day 14 reward immediately.

### User Tracks Habits That Are Hard to Measure (Internal States, Emotional Goals)
Users frequently want to track internal states: "be more present," "worry less," "practice gratitude," "be kinder." These cannot be directly observed or marked. Apply the Observable Behavior Conversion protocol:
- Identify the internal state: e.g., "worry less"
- Identify the physical or behavioral correlate that the user can control: e.g., "when I notice worry, do one round of box breathing (4 counts in, 4 hold, 4 out, 4 hold)"
- Define completion: "Did I do at least one round of box breathing in response to worry today? Yes/No"
- The tracking target is the behavior, not the internal state. Tracking the behavior consistently is the mechanism by which the internal state changes -- the user cannot track their way to feeling less worried, but they can track a behavior that reduces worry over time.
- For "be more present," a useful conversion: "Completed one 5-minute phone-free period intentionally (not because the phone was unavailable) -- Yes/No."
- For "practice gratitude," a useful conversion: "Wrote 3 specific, concrete things I noticed today that I appreciate -- not generic statements, specific to today -- Yes/No."
- Never accept a habit definition that requires the user to subjectively judge whether they "felt" the habit. Feelings are outcomes; behaviors are inputs. Track the inputs.

### User Uses a Habit App with Built-In Tracking and Asks for Help Optimizing It
The skill does not recommend specific apps, but can work with whatever tool the user already uses. Ask: Does the app support custom habit definitions (not just preset habits)? Does it allow you to mark partial completion (MVH)? Does it show a monthly grid view? Does it calculate consistency percentages? Does it allow you to add notes? If the app is missing critical features -- particularly MVH partial credit -- supplement it with a minimal paper or notes-app tracker for the MVH distinction. The app handles the streak and full-completion marking; the supplemental tool records MVH days. Alternatively, if the app supports two separate entries for the same habit (e.g., "Exercise -- Full" and "Exercise -- MVH"), use this workaround. The key is that the MVH must be distinct from both full completion and a miss -- a system that only recognizes done/not-done will not accurately reflect the user's behavior.

### User Experiences a Multi-Week Life Disruption (Illness, Travel, Family Emergency, Major Life Change)
This is different from a standard missed day. When the user's life circumstances fundamentally change for a period of weeks, the appropriate response is a system pause, not a streak insurance attempt.
- Formally pause the tracker: note the date and reason in the tracker itself ("Paused: [date] due to [brief reason]").
- During the pause period, maintain only one keystone habit -- the one with the highest identity value for the user -- using only the MVH. Everything else is suspended.
- Resume the tracker on a specific restart date (set this date at the time of the pause, not after). Upon restart: reset all streaks to 0, reduce the habit load by one habit for the first two weeks post-disruption, use the MVH as the default target (not the full version) for the first week.
- The pause-and-resume protocol is healthier than white-knuckling through a disruption and generating weeks of missed marks. A clean pause followed by a deliberate restart preserves the user's relationship with the tracking system.

---

## Example

**Input:** "I want to track these habits: morning run, journal, read before bed, no phone after 9pm, and drink enough water. I've tried tracking apps before but always quit. I think I'd do better with paper. I care a lot about keeping streaks going."

**Output:**

## Habit Tracking System

**Habits Tracked:** 5 habits
**Format:** Paper Monthly Grid (streak-focused, with color marking key)
**Tracking Start Date:** Tomorrow morning (place the grid tonight)
**Daily Max Points:** 11
**Weekly Max Points:** 77
**Good Week Threshold:** 54+ points (70% of 77)
**Tracking Location:** Stick to the bathroom mirror or the inside of your journal cover -- wherever you end your day

---

### Habit Definitions

| # | Habit | Full Version | MVH (Minimum Viable) | Frequency | FV Points | MVH Points |
|---|-------|-------------|---------------------|-----------|-----------|------------|
| 1 | Morning Run | 25-minute run outside at a conversational pace before 9am | Put on running shoes, walk outside, walk for 5 minutes (no excuses needed, no pace) | Daily | 4 | 2 |
| 2 | Journal | Write for 10 minutes -- open entry, no prompt required, private | Write 3 sentences about anything (can be "I have nothing to say") | Daily | 2 | 1 |
| 3 | Read Before Bed | Read a physical or digital book (not social media, not news) for 20 minutes, in bed, before turning off the light | Read 2 pages -- any book -- before putting the device down | Daily | 2 | 1 |
| 4 | Phone Curfew | All phone activity (including passive scrolling) ends by 9:00pm. Phone placed in a room other than the bedroom. | Phone is placed outside the bedroom by 9:30pm. Looking at it until 9:30 is allowed; keeping it in the bedroom is not. | Daily | 2 | 1 |
| 5 | Hydration | Drink 64oz (8 cups) of water distributed across the day, starting with 1 cup upon waking | Drink 1 full glass (16oz) of water before your first coffee or tea of the day | Daily | 1 | 1 |

**Daily max score:** 11 points (4+2+2+2+1)
**Weekly max score:** 77 points
**Good week:** 54+ points
**Waitlisted habits:** None listed -- if you want to add more later, bring this list back.

**Note on the Morning Run MVH:** The 5-minute walk counts as streak preservation because it maintains the "I go outside in the morning" identity. You are not a runner who skipped -- you are a morning mover who had an easy day. The psychology of this matters.

---

### Paper Grid Tracker Template

Draw this grid on a standard piece of paper (landscape orientation works best) or use a printed sheet. Post it at eye level in the location where you will mark it each evening.

```
MONTH: _________________     YEAR: _______

Habit               Pts  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31  STREAK
-------------------      -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --  ------
Morning Run          4  [  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]  ___
Journal              2  [  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]  ___
Read Before Bed      2  [  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]  ___
Phone Curfew         2  [  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]  ___
Hydration            1  [  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]  ___
-------------------      -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --  ------
DAILY SCORE             [  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ][  ]

WEEKLY TOTALS:   Wk 1 (Days 1-7): ___/77  |  Wk 2 (Days 8-14): ___/77  |  Wk 3 (Days 15-21): ___/77  |  Wk 4 (Days 22-28): ___/77

MONTHLY TOTAL: _____ / [11 × days in month = ___]     MONTHLY %: _______%

MARKING KEY:
  X  =  Full Version completed       (full points)
  /  =  MVH completed                (half points, streak preserved)
     =  Missed                       (0 points, streak at risk)

STREAK INSURANCE USED: ___ (max 1 per 7-day window)
```

**Tip for paper marking:** Use a green pen for X (full) and an orange or yellow pencil for / (MVH). The color contrast across the month is visually motivating and lets you spot patterns at a glance -- "I go orange every Thursday" is a real insight.

---

### Scoring Rules

| Completion Type | Morning Run | Journal | Read Before Bed | Phone Curfew | Hydration |
|-----------------|-------------|---------|----------------|-------------|-----------|
| Full Version (X) | 4 pts | 2 pts | 2 pts | 2 pts | 1 pt |
| MVH (/) | 2 pts | 1 pt | 1 pt | 1 pt | 1 pt |
| Missed (blank) | 0 pts | 0 pts | 0 pts | 0 pts | 0 pts |

**Daily max:** 11 points
**Good day:** 8+ points (73% of daily max)
**Weekly max:** 77 points
**Good week:** 54+ points (70% of weekly max)
**Monthly consistency target:** 80%+ full completions per habit by Month 3 (first month: 60%+ is a strong start)

**Streak Insurance -- the explicit rule:**
- If you miss a day entirely (all five habits), do the MVH for each habit the very next morning/evening and mark the missed day as "/" retroactively (using the grace rule, one time per 7-day window).
- If you miss two days in a row: streaks reset. Mark the missed days as blank. Write the new streak start date in pencil next to each habit name. Begin counting from 1. This is not failure -- it is honest data.
- Three consecutive days of MVH-only (no full version for any habit): flag this at the next weekly review. Something is draining your capacity. Name it.

---

### Review Schedule

**Daily (2 minutes, in the evening after brushing teeth):**
- Retrieve the tracker (bathroom mirror placement makes this automatic)
- Mark each cell: X, /, or leave blank
- Add the daily score at the bottom row
- Total takes under 90 seconds once you are practiced

**Weekly (10 minutes, every Sunday at 8:00pm):**
1. Add up this week's daily scores for the weekly total: ___ / 77
2. Which habit had the most blank cells this week? _______________
3. What specific event or pattern caused those misses? (Not "life was busy." What time of day? What came up? What was competing?)
4. One micro-adjustment for next week (choose one):
   - Change the time of day for [habit]
   - Simplify the MVH for [habit]
   - Reduce [habit] from daily to 5x/week temporarily
   - Move the tracker to a new location
5. Write this week's streak count for each habit:
   - Morning Run: ___ days | Journal: ___ days | Read: ___ days | Phone Curfew: ___ days | Hydration: ___ days

**Monthly (20 minutes, first Sunday of each month):**
1. Count total marks for each habit:
   - Full completions (X): ___ | MVH completions (/): ___ | Missed (blank): ___
   - Consistency % = (X + (/ × 0.5)) ÷ days in month × 100 = ___%
2. Longest streak this month per habit:
   - Morning Run: ___ | Journal: ___ | Read: ___ | Phone Curfew: ___ | Hydration: ___
3. Streak insurance uses this month: ___ / 4 maximum
4. Habit to investigate (below 50% consistency): _______________
   - Root cause question: "Was the full version too hard, or did I not care enough about this habit this month?"
5. Habit to celebrate (above 80% consistency for 2 months in a row): _______________
   - Upgrade question: "Is this habit becoming automatic? Should I make the full version harder?"
6. Alignment check: "Three months from now, which of these five habits will I be most grateful I kept?"
7. Reward milestone check:
   - Day 14 reward (if you tracked every day for 14 consecutive days, including MVH days): [Choose your reward now and write it here before starting]
   - Day 30 reward: [Choose and write now]

---

### Streak Summary Table

| Habit | Current Streak | Longest Streak This Month | Streak Resets This Month |
|-------|---------------|--------------------------|--------------------------|
| Morning Run | ___ days | ___ days | ___ |
| Journal | ___ days | ___ days | ___ |
| Read Before Bed | ___ days | ___ days | ___ |
| Phone Curfew | ___ days | ___ days | ___ |
| Hydration | ___ days | ___ days | ___ |

**Streak Insurance uses this month:** ___ (max 4 -- 1 per 7-day window)

---

### Predicted Hard Moments and Pre-Planned Responses

Because you mentioned that past app-based tracking always ended in quitting, here are the three moments most likely to derail this system and what to do instead of stopping:

**Moment 1 -- Day 4-6: "Marking this feels pointless, nothing has changed yet."**
Response: This is expected. The brain craves immediate reward, and a 6-day grid looks unimpressive. Do the MVH for every habit on this day. Just mark the cells. The value of the system is in the monthly view, not the daily view.

**Moment 2 -- Day 10-14: "I missed two days and the streak is broken. Why bother?"**
Response: This is the most common quitting point. Use streak insurance for the next day, mark the missed days honestly, and say out loud: "Two missed days plus 12 tracked days equals 12 days of practice. That is 12 more than last month." Restart counting from Day 1 and continue.

**Moment 3 -- Week 3-4: "I feel like I already know how this ends, I always quit."**
Response: This thought is a pattern, not a prediction. Do the minimum viable version of every habit today. Do not think about tomorrow. Mark the cells. Write the day's score. You have been tracking longer than most people who start this system get.

---

**Implementation instruction:** Tonight, draw or print this grid. Decide where it will hang (bathroom mirror is strongly recommended for this particular habit set -- the morning run and phone curfew habits both have natural bathroom-adjacent moments). Write your Day 14 reward and Day 30 reward in the margin before you start. Begin tracking tomorrow morning with the Morning Run. The first cell is the only one that matters right now.
