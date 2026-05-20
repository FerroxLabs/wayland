---
name: quarterly-planning
description: |
  Produces a personal quarterly plan with 3-5 goals, weekly milestone
  breakdowns, review checkpoints, and a quarter-end evaluation template.
  Use when the user wants to plan the next 3 months, set quarterly personal
  goals, or create a structured 13-week plan for achieving multiple objectives.
  Do NOT use for business or organizational quarterly planning (use business
  strategy skills), single-goal planning (use `smart-goal-builder`), or
  annual planning (use `annual-review` instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting planning checklist"
  category: "productivity"
  subcategory: "goal-setting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Quarterly Planning

## When to Use

- User wants to plan the next 3 months of personal goals and projects
- User asks for help setting quarterly objectives for themselves
- User wants to create a structured 13-week plan with milestones
- User is at the start of a quarter and wants to define what to accomplish
- User wants a system for tracking multiple personal goals across a quarter
- Do NOT use when the user wants to plan organizational or team quarterly goals (use business strategy skills instead)
- Do NOT use when the user wants to set a single specific goal (use `smart-goal-builder` instead)
- Do NOT use when the user wants a full annual plan or year-in-review (use `annual-review` instead)
- Do NOT use when the user wants OKRs with scoring rubrics (use `okr-builder` instead)

## Process

1. **Review the current state.** Before setting new goals, assess where the user stands:
   - What were last quarter's goals? (if applicable) What was achieved and what was not?
   - What is currently in progress that must continue?
   - What external commitments or deadlines exist in the upcoming quarter?
   - What is the user's available capacity? (work hours, energy levels, competing obligations)
   - What lessons from previous quarters should inform this plan?

2. **Identify candidate goals.** Ask the user to brainstorm everything they want to accomplish in the next 3 months across relevant life areas:
   - Career / professional development
   - Health / fitness
   - Relationships / social
   - Learning / skills
   - Projects / creative
   - Financial
   - Filter: remove anything that is actually a task (under 2 hours), a habit (daily/weekly behavior), or an annual goal (too large for one quarter)

3. **Select and prioritize 3-5 goals.** Apply selection criteria:
   - **Impact:** Which goals create the most value if achieved?
   - **Urgency:** Which goals have external deadlines or time-sensitive opportunities?
   - **Capacity:** Does the user have enough time and energy for all selected goals simultaneously?
   - **Balance:** Do the selected goals cover at least 2 different life areas to prevent burnout in one area?
   - Rank the selected goals by priority. Goal 1 gets the most resources; Goal 5 is a stretch goal

4. **Define each goal with success criteria.** For each of the 3-5 goals:
   - Write a one-sentence goal statement (specific and measurable)
   - Define "done" criteria: what exactly must be true for this goal to be complete?
   - Define "partial success" criteria: what counts as meaningful progress even if the goal is not fully achieved?
   - Identify the single most important leading indicator (the metric that predicts success)

5. **Build the 13-week milestone map.** For each goal:
   - Divide the quarter into three phases: Foundation (weeks 1-4), Build (weeks 5-9), Finish (weeks 10-13)
   - Set a specific milestone for the end of each phase
   - Break Phase 1 (Foundation) into weekly targets -- these are the most detailed because they launch the goal
   - Set review checkpoints: Week 4 (foundation check), Week 9 (build check), Week 13 (final evaluation)

6. **Design the weekly rhythm.** Create a recurring weekly structure:
   - Which day and time will the user review quarterly progress? (recommended: Sunday evening or Monday morning, 30 minutes)
   - What does the weekly review cover? (milestone check, next week's priorities, blockers)
   - How will progress be tracked? (spreadsheet, journal, app, calendar)
   - What is the escalation rule? (if a goal falls behind by 2+ weeks, take action: reallocate time, reduce scope, or drop the goal)

7. **Create the quarter-end evaluation template.** Pre-build the review document that the user will complete in week 13:
   - Goal-by-goal assessment: achieved, partially achieved, not achieved
   - Lessons learned per goal
   - What to carry forward to next quarter
   - Overall quarter rating

## Output Format

```
## Quarterly Plan: [Quarter Name] ([Start Date] - [End Date])

### Quarter Overview

**Theme:** [Optional: one-word or short-phrase theme for the quarter]
**Goals:** [count]
**Available weekly hours for goal work:** [X] hours

| # | Goal | Life Area | Priority | Status |
|---|------|-----------|----------|--------|
| 1 | [goal statement] | [area] | Primary | Not started |
| 2 | [goal statement] | [area] | Primary | Not started |
| 3 | [goal statement] | [area] | Secondary | Not started |
| 4 | [goal statement] | [area] | Stretch | Not started |

---

### Goal 1: [Goal Statement]

**Done criteria:** [What "complete" looks like]
**Partial success:** [What "meaningful progress" looks like]
**Leading indicator:** [The metric to watch weekly]

#### Milestones

| Phase | Weeks | Milestone | Target Date |
|-------|-------|-----------|-------------|
| Foundation | 1-4 | [milestone] | [date] |
| Build | 5-9 | [milestone] | [date] |
| Finish | 10-13 | [milestone] | [date] |

#### Foundation Phase Weekly Targets (Weeks 1-4)

| Week | Target | Actions |
|------|--------|---------|
| 1 | [target] | [specific actions] |
| 2 | [target] | [specific actions] |
| 3 | [target] | [specific actions] |
| 4 | [target] | [Foundation milestone check] |

---

[Repeat for Goals 2-5]

---

### Weekly Review Template

**Day/Time:** [scheduled day and time]
**Duration:** 30 minutes

Checklist:
- [ ] Review each goal's leading indicator
- [ ] Mark this week's targets as done or missed
- [ ] Identify blockers for any goal
- [ ] Set next week's top 3 priorities across all goals
- [ ] If any goal is 2+ weeks behind: decide -- reallocate time, reduce scope, or drop

---

### Review Checkpoints

| Checkpoint | Date | Purpose |
|-----------|------|---------|
| Week 4 Review | [date] | Foundation check: Are all goals launched and on track? |
| Week 9 Review | [date] | Build check: Is completion realistic? Adjust scope if needed |
| Week 13 Review | [date] | Final evaluation: Complete quarter-end assessment |

---

### Quarter-End Evaluation Template

**Quarter:** [name]
**Date completed:** [date]

| Goal | Result | Achievement Level | Key Lesson |
|------|--------|-------------------|------------|
| [Goal 1] | [outcome] | Complete / Partial / Not achieved | [lesson] |
| [Goal 2] | [outcome] | Complete / Partial / Not achieved | [lesson] |

**Overall quarter rating:** [1-5 scale]
**Biggest win:** [description]
**Biggest learning:** [description]
**Carry forward to next quarter:** [goals or lessons to continue]
```

## Rules

1. Never allow more than 5 goals per quarter -- cognitive overload from too many goals causes all of them to suffer
2. Every goal must have both "done" and "partial success" criteria defined before the quarter starts
3. Foundation phase (weeks 1-4) must have weekly targets for each goal; later phases can have biweekly targets
4. The weekly review must be scheduled on a specific day and time, not left as "sometime during the week"
5. If a goal has no measurable leading indicator, it is too vague -- refine it before including it in the plan
6. At least 2 different life areas must be represented to prevent single-area burnout
7. The quarter-end evaluation template must be pre-built at planning time, not created retroactively
8. Stretch goals (priority 4-5) must be explicitly labeled so the user does not feel guilt if they are dropped
9. Never include daily habits or recurring tasks as quarterly goals -- those belong in a habit tracker, not a quarterly plan
10. The escalation rule (2+ weeks behind) must have three specific options: reallocate time, reduce scope, or drop the goal. "Try harder" is not an escalation option

## Edge Cases

- **User is planning their first-ever quarter:** Skip the "review last quarter" step. Start with a lighter load: 2-3 goals instead of 5. Add an explicit learning goal: "Learn what my realistic quarterly capacity is." Plan a more frequent review cadence (weekly instead of at checkpoints only) for the first quarter.

- **User has one dominant goal that will consume most of the quarter:** Structure the plan around that primary goal with all 13 weeks mapped in detail. Allow 1-2 minor goals that require less than 2 hours per week each. Do not force balance across life areas if the user's situation genuinely demands focus.

- **User is in a transition period (new job, move, life change):** Reduce goal count to 2-3. Add a "stabilize" goal: "Establish new routines and identify available capacity by week 4." Keep weeks 1-4 focused on settling in, with substantive goals starting in weeks 5-13.

- **User wants to continue goals from last quarter:** Assess what was carried forward. If the user has 3 continuing goals, limit new goals to 1-2. Recalibrate milestones based on current progress, not starting from zero. Note which continuing goals need a new approach (repeating the same plan that failed is not a strategy).

- **External deadlines create an uneven quarter:** Map the deadlines first, then allocate goals around them. If a major deadline falls in week 8, front-load other goals into weeks 1-7 and schedule lighter goal work for weeks 8-9. Use the post-deadline weeks (10-13) for goals that benefit from concentrated attention.

## Example

**Input:** "I want to plan my next quarter. I want to finally learn Spanish, get in shape, finish the online course I started for work, and start a side project. Maybe also read more books."

**Output:**

## Quarterly Plan: Q2 2026 (April 1 - June 30)

### Quarter Overview

**Theme:** Build skills and energy
**Goals:** 4 (5th moved to stretch)
**Available weekly hours for goal work:** 12 hours (estimated: 2 hrs/day weeknights + 2 hrs weekend)

| # | Goal | Life Area | Priority | Status |
|---|------|-----------|----------|--------|
| 1 | Complete work online course (all 8 remaining modules + final project) | Career | Primary | Not started |
| 2 | Exercise 4x/week for 12 weeks, reaching 3 consecutive pull-ups | Health | Primary | Not started |
| 3 | Complete Spanish A1 level (Duolingo tree + 10 conversation sessions) | Learning | Secondary | Not started |
| 4 | Read 6 books (at least 2 non-fiction) | Learning | Stretch | Not started |

*Side project deferred to Q3: not enough capacity this quarter with 3 active goals plus stretch. Revisit during week 13 evaluation.*

---

### Goal 1: Complete Work Online Course

**Done criteria:** All 8 modules finished, final project submitted and graded
**Partial success:** 6+ modules complete, final project in progress
**Leading indicator:** Modules completed per week (target: 2/week for 4 weeks, then project work)

#### Milestones

| Phase | Weeks | Milestone | Target Date |
|-------|-------|-----------|-------------|
| Foundation | 1-4 | Modules 1-4 complete | April 28 |
| Build | 5-9 | Modules 5-8 complete, project outline done | June 2 |
| Finish | 10-13 | Final project submitted and graded | June 30 |

#### Foundation Phase Weekly Targets (Weeks 1-4)

| Week | Target | Actions |
|------|--------|---------|
| 1 | Module 1 complete | 3 hrs: watch lectures, complete exercises, pass quiz |
| 2 | Module 2 complete | 3 hrs: same pattern |
| 3 | Module 3 complete | 3 hrs: same pattern |
| 4 | Module 4 complete | 3 hrs: Foundation checkpoint -- review notes, identify weak areas for modules 5-8 |

---

### Goal 2: Exercise 4x/Week, Reach 3 Pull-ups

**Done criteria:** 48 workouts logged over 12 weeks, 3 consecutive pull-ups demonstrated
**Partial success:** 36+ workouts logged (75% adherence), 1 pull-up achieved
**Leading indicator:** Workouts completed this week (target: 4)

#### Milestones

| Phase | Weeks | Milestone | Target Date |
|-------|-------|-----------|-------------|
| Foundation | 1-4 | 16 workouts logged, routine established | April 28 |
| Build | 5-9 | 36 cumulative workouts, 1 pull-up achieved | June 2 |
| Finish | 10-13 | 48 cumulative workouts, 3 consecutive pull-ups | June 30 |

#### Foundation Phase Weekly Targets (Weeks 1-4)

| Week | Target | Actions |
|------|--------|---------|
| 1 | 4 workouts | Choose workout days (Mon/Wed/Fri/Sat), complete beginner routine, log in tracker |
| 2 | 4 workouts | Same routine, add assisted pull-up practice (2 sets each session) |
| 3 | 4 workouts | Increase resistance/weight slightly on 2 exercises |
| 4 | 4 workouts | Foundation check: test pull-up baseline, adjust routine if needed |

---

### Weekly Review Template

**Day/Time:** Sunday at 7:00 PM
**Duration:** 30 minutes

Checklist:
- [ ] Course: How many modules completed this week? On track?
- [ ] Exercise: How many workouts logged? What is the weekly count?
- [ ] Spanish: How many lessons and conversation sessions this week?
- [ ] Reading: How many pages/chapters? On pace for current book?
- [ ] Identify the #1 blocker for next week and plan around it
- [ ] Set next week's top 3 priorities across all goals
- [ ] If any goal is 2+ weeks behind: reallocate time, reduce scope, or drop

---

### Review Checkpoints

| Checkpoint | Date | Purpose |
|-----------|------|---------|
| Week 4 Review | April 28 | Foundation check: Are all 4 goals launched and on track? |
| Week 9 Review | June 2 | Build check: Course nearing completion? Pull-up progress? Spanish on pace? |
| Week 13 Review | June 30 | Final evaluation: Complete quarter-end assessment below |

---

### Quarter-End Evaluation Template

**Quarter:** Q2 2026
**Date completed:** _______________

| Goal | Result | Achievement Level | Key Lesson |
|------|--------|-------------------|------------|
| Work course | [modules done]/8, project: [status] | Complete / Partial / Not achieved | [lesson] |
| Exercise | [workouts]/48, pull-ups: [count] | Complete / Partial / Not achieved | [lesson] |
| Spanish | [lessons]/[target], conversations: [count]/10 | Complete / Partial / Not achieved | [lesson] |
| Reading | [books]/6 | Complete / Partial / Not achieved | [lesson] |

**Overall quarter rating:** ___/5
**Biggest win:** _______________
**Biggest learning:** _______________
**Carry forward to next quarter:** _______________
**Side project (deferred from this quarter):** Ready to start? Y/N. If Y, add to Q3 plan.
