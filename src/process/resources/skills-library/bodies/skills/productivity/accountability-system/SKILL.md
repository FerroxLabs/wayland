---
name: accountability-system
description: |
  Builds a personal accountability system by identifying accountability
  mechanisms, defining check-in protocols, setting success criteria, and
  creating a consequence structure. Use when the user wants to hold themselves
  accountable to goals, create a system for follow-through on commitments, or
  design check-in routines that prevent goals from being skipped. Do NOT use
  for team accountability or management (use business skills), behavior change
  coaching (use health-wellness skills), or single-goal planning (use
  `smart-goal-builder` instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting planning template"
  category: "productivity"
  subcategory: "goal-setting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Personal Accountability System

## When to Use

- User wants to create a system for holding themselves accountable to goals
- User asks how to stay on track with commitments they keep dropping
- User wants to design check-in routines for monitoring their own progress
- User mentions struggling with follow-through despite having clear goals
- User wants an accountability partner framework or self-accountability system
- Do NOT use when the user needs team accountability or performance management systems (use business skills instead)
- Do NOT use when the user wants behavior change coaching or motivation strategies (use health-wellness skills instead)
- Do NOT use when the user wants to set the goal itself (use `smart-goal-builder` or `okr-builder` first, then this skill for the accountability layer)
- Do NOT use when the user wants a habit tracker design (use `habit-tracker-design` instead)

## Process

1. **Assess the user's accountability profile.** Ask about:
   - What goals or commitments have they struggled to follow through on?
   - What has worked in the past? (deadlines, social pressure, rewards, consequences)
   - Do they respond better to internal motivation or external accountability?
   - How many active goals or commitments need accountability right now?
   - What is their primary failure mode? (skipping, procrastinating, losing motivation, getting distracted)

2. **Select accountability mechanisms.** Based on the profile, choose 2-3 mechanisms:
   - **Self-reporting:** Scheduled check-ins where the user reviews their own progress against defined criteria. Best for: people who lose track of goals (skipping failure mode)
   - **Social accountability:** Partner, group, or public commitment where progress is visible to others. Best for: people who respond to social pressure (procrastination failure mode)
   - **Consequence structure:** Pre-committed positive and negative consequences tied to milestones. Best for: people who know what to do but do not do it (motivation failure mode)
   - **Environment design:** Modifying the user's environment to make the desired action easier and the undesired action harder. Best for: people who get pulled off course (distraction failure mode)
   - Choose mechanisms that match the identified failure mode, not generic ones

3. **Design the check-in protocol.** For each selected goal or commitment:
   - **Check-in frequency:** How often will progress be reviewed? (daily, weekly, biweekly)
   - **Check-in format:** What specific questions will be answered at each check-in?
   - **Check-in duration:** How long does a check-in take? (recommended: 5-15 minutes for self-reporting, 15-30 minutes for partner check-ins)
   - **Escalation trigger:** What level of missed progress triggers a more intensive intervention?
   - **Check-in location:** Where and when does the check-in happen? (specific day, time, and place)

4. **Define success criteria and progress metrics.** For each goal:
   - What does "on track" look like at the 25%, 50%, and 75% marks?
   - What does "behind" look like at each mark?
   - What does "at risk" look like?
   - Define the minimum acceptable pace: the slowest progress rate that still leads to the goal on time

5. **Build the consequence structure.** Define consequences that are:
   - **Pre-committed:** Decided now, not at the moment of evaluation (willpower is not needed)
   - **Proportional:** Matched to the importance of the milestone
   - **Specific:** Not "I will treat myself" but "I will buy [specific item]" or "I will donate $50 to [specific organization]"
   - Types of consequences:
     - **Positive (reward):** Earned only when a milestone is met. Must be something the user genuinely wants
     - **Negative (cost):** Incurred when a milestone is missed. Must be genuinely unpleasant but not harmful
     - **Neutral reset:** If partly met, the consequence is a mandatory review session to recalibrate

6. **Create the accountability dashboard.** Build a single-page reference showing:
   - Active goals and their current status
   - Next check-in date and format
   - Upcoming milestones and their consequences
   - Progress indicator for each goal
   - Escalation history (how many times has intervention been triggered?)

7. **Design the accountability review.** Schedule a monthly meta-review:
   - Is the accountability system itself working?
   - Which mechanisms are driving behavior and which are being ignored?
   - Should any goals be added, modified, or removed?
   - Should consequences be adjusted (too easy = ineffective, too harsh = avoided)?

## Output Format

```
## Personal Accountability System

### Accountability Profile

**Primary failure mode:** [skipping | procrastinating | losing motivation | getting distracted]
**Response style:** [internal motivation | external accountability | consequence-driven | environment-dependent]
**Selected mechanisms:** [2-3 mechanisms from the options]

---

### Active Goals & Accountability Setup

#### Goal 1: [Goal Statement]

**Deadline:** [date]
**Accountability mechanism:** [which mechanism applies]
**Check-in cadence:** [frequency]

**Progress Milestones:**

| Mark | Date | "On Track" | "Behind" | "At Risk" | Consequence |
|------|------|-----------|---------|-----------|-------------|
| 25% | [date] | [criteria] | [criteria] | [criteria] | [reward/cost] |
| 50% | [date] | [criteria] | [criteria] | [criteria] | [reward/cost] |
| 75% | [date] | [criteria] | [criteria] | [criteria] | [reward/cost] |
| 100% | [date] | [criteria] | -- | -- | [final reward/cost] |

---

### Check-in Protocol

**Frequency:** [cadence]
**Day/Time:** [specific schedule]
**Duration:** [X] minutes
**Location:** [where]

**Check-in questions:**
1. [Question about progress since last check-in]
2. [Question about blockers or obstacles]
3. [Question about next actions]
4. [Question about pace -- on track, behind, or ahead?]
5. [Question about accountability -- have I followed the system?]

**Escalation trigger:** If [specific condition], then [escalation action].

---

### Consequence Structure

#### Rewards (earned when milestones are met)

| Milestone | Reward | Pre-committed? |
|-----------|--------|---------------|
| [milestone] | [specific reward] | Yes |

#### Costs (incurred when milestones are missed)

| Milestone | Cost | Pre-committed? |
|-----------|------|---------------|
| [milestone] | [specific cost] | Yes |

---

### Accountability Dashboard

| Goal | Status | Next Check-in | Next Milestone | Escalation Count |
|------|--------|--------------|----------------|------------------|
| [Goal 1] | [on track / behind / at risk] | [date] | [milestone + date] | [count] |

---

### Monthly System Review

**Day/Time:** [First [day] of each month]

- [ ] Is the accountability system driving behavior? (Y/N)
- [ ] Which mechanism is most effective? _________
- [ ] Which mechanism is being ignored? _________
- [ ] Any goals to add, modify, or remove?
- [ ] Are consequences too easy (not motivating) or too harsh (being avoided)?
- [ ] Adjustments for next month: _________
```

## Rules

1. Never design an accountability system without identifying the user's primary failure mode first -- mechanisms must match the failure mode
2. Every check-in must have specific questions to answer, not just "review progress" as a vague activity
3. Consequences must be pre-committed (decided now) and specific (exact reward or cost named) -- vague consequences are ignored
4. Positive consequences (rewards) must be things the user genuinely wants but would not normally buy or do for themselves
5. Negative consequences (costs) must be genuinely unpleasant but not harmful or financially destructive
6. The check-in schedule must have a specific day, time, and location -- unscheduled check-ins do not happen
7. Escalation triggers must be defined with specific thresholds (not "when things are going badly" but "when 2 consecutive check-ins show behind-pace progress")
8. Never recommend accountability partners without specifying what the partner should do and say at each check-in
9. The monthly system review must be scheduled and treated as non-negotiable -- accountability systems that are never evaluated decay into theater
10. Environment design changes must be specific actions (remove the app, move the running shoes to the door, set a recurring alarm) not abstract principles ("make it easier")

## Edge Cases

- **User has no accountability partner available:** Focus on self-reporting mechanisms and consequence structures. Design the check-in protocol for solo execution. Add environment design as a second mechanism (phone app blockers, visible tracker on the wall, alarm reminders). Social accountability can be simulated with public posting (blog, social media) if the user is comfortable.

- **User's goals are private (fitness, mental health, finances):** Design the system for full self-accountability. Use a private journal check-in format. Make the consequence structure self-administered (reward: allow yourself to buy X; cost: skip your usual coffee/treat for the week). No social component unless the user volunteers to share.

- **User has too many goals requiring accountability (5+):** Limit the active accountability system to 3 goals maximum. More than 3 creates check-in fatigue and dilutes the consequence structure. Prioritize by impact and failure risk. The remaining goals can use lighter tracking (habit tracker) without the full accountability apparatus.

- **User has tried accountability systems before and abandoned them:** Diagnose why the previous system failed. Common failure modes: too complex (simplify), consequences not enforced (make them automatic -- e.g., scheduled donations), check-ins too frequent (reduce cadence), system felt punishing (add more positive consequences, reduce negative ones). Design the new system to specifically address the previous failure.

- **User wants accountability for a creative or open-ended goal ("write more"):** Quantify the creative output for accountability purposes. "Write more" becomes "Write 500 words per session, 3 sessions per week." Accountability measures the sessions and word count, not the quality. Quality is subjective; quantity is trackable. The accountability system monitors the input (sessions), not the output (how well the writing turns out).

## Example

**Input:** "I keep setting goals but then skipping about them after a week. I made a New Year's resolution to exercise 4 times a week and to read 2 books a month, and I was on track for the first two weeks and then completely stopped. I need some kind of system to stay accountable."

**Output:**

## Personal Accountability System

### Accountability Profile

**Primary failure mode:** skipping (goals fade from awareness after initial motivation wears off)
**Response style:** Needs external reminders and structured check-ins (internal motivation fades within 2 weeks)
**Selected mechanisms:**
1. Self-reporting with structured weekly check-ins (addresses skipping)
2. Consequence structure with pre-committed rewards and costs (addresses motivation decay after week 2)
3. Environment design changes (makes goals visible and reduces friction)

---

### Active Goals & Accountability Setup

#### Goal 1: Exercise 4x/week

**Deadline:** Ongoing (first evaluation at 8-week mark)
**Accountability mechanism:** Self-reporting + environment design
**Check-in cadence:** Weekly (Sunday evening)

**Progress Milestones:**

| Mark | Date | "On Track" | "Behind" | "At Risk" | Consequence |
|------|------|-----------|---------|-----------|-------------|
| Week 2 | [date] | 7+ workouts total | 5-6 workouts total | Under 5 workouts | Behind: review and commit to 3 specific days next week |
| Week 4 | [date] | 14+ workouts total | 10-13 workouts total | Under 10 workouts | On track: buy new workout gear item ($30 budget). At risk: donate $20 to a charity you feel neutral about |
| Week 8 | [date] | 28+ workouts total | 22-27 workouts total | Under 22 workouts | On track: book a massage or experience you have been wanting. At risk: forfeit a planned discretionary purchase |

#### Goal 2: Read 2 books/month

**Deadline:** Ongoing (first evaluation at 2-month mark)
**Accountability mechanism:** Self-reporting + consequence structure
**Check-in cadence:** Weekly (Sunday evening)

**Progress Milestones:**

| Mark | Date | "On Track" | "Behind" | "At Risk" | Consequence |
|------|------|-----------|---------|-----------|-------------|
| Month 1 end | [date] | 2 books complete | 1 book complete, 2nd started | Under 1 book | On track: buy next 2 books guilt-free. Behind: reading replaces phone time before bed for 2 weeks |
| Month 2 end | [date] | 4 books total | 3 books total | Under 3 books | On track: dinner at a restaurant you have been wanting to try. At risk: no new book purchases until caught up |

---

### Check-in Protocol

**Frequency:** Weekly
**Day/Time:** Sunday at 7:00 PM
**Duration:** 10 minutes
**Location:** At desk with tracker visible

**Check-in questions:**
1. How many workouts did I complete this week? ___/4. Which days? _______________
2. How many pages/chapters did I read this week? Am I on pace to finish the current book this month?
3. What blocked me from completing any missed workouts or reading sessions?
4. Am I on track, behind, or at risk for each goal? (Check the milestone table above)
5. What are my 3 specific workout days for next week? (Write them on the calendar now)

**Escalation trigger:** If 2 consecutive weekly check-ins show "behind" or "at risk" status for either goal, schedule a 30-minute recalibration session: reassess the goal, adjust the target if needed, or add an accountability partner.

---

### Consequence Structure

#### Rewards (earned when milestones are met)

| Milestone | Reward | Pre-committed? |
|-----------|--------|---------------|
| Exercise: 4 weeks on track | New workout gear item (up to $30) | Yes |
| Exercise: 8 weeks on track | Book a massage or experience ($50) | Yes |
| Reading: Month 1 on track | Buy next 2 books guilt-free | Yes |
| Reading: Month 2 on track | Dinner at a restaurant of your choice | Yes |

#### Costs (incurred when milestones are missed)

| Milestone | Cost | Pre-committed? |
|-----------|------|---------------|
| Exercise: at risk at week 4 | Donate $20 to a cause you feel neutral about (not a charity you love) | Yes |
| Exercise: at risk at week 8 | Forfeit one planned discretionary purchase | Yes |
| Reading: behind at month 1 | Replace phone screen time with reading for 2 weeks (set phone to grayscale after 8 PM) | Yes |
| Reading: at risk at month 2 | No new book purchases until caught up | Yes |

---

### Environment Design Changes (Implement This Week)

| Change | Goal | Action |
|--------|------|--------|
| Exercise visibility | Exercise | Write your 3 workout days on a sticky note on your bathroom mirror. Move workout clothes next to your bed (night before) |
| Reading accessibility | Reading | Place current book on pillow. Remove phone charger from bedroom (charge in another room) |
| Check-in reminder | Both | Set a recurring Sunday 7 PM alarm labeled "ACCOUNTABILITY CHECK-IN -- 10 min" |
| Progress visibility | Both | Print the milestone table and tape it next to your desk where you see it daily |

---

### Accountability Dashboard

| Goal | Status | Next Check-in | Next Milestone | Escalation Count |
|------|--------|--------------|----------------|------------------|
| Exercise 4x/week | Not started | [Sunday date] | Week 2 check (7+ workouts) | 0 |
| Read 2 books/month | Not started | [Sunday date] | Month 1 end (2 books) | 0 |

---

### Monthly System Review

**Day/Time:** First Sunday of each month, during weekly check-in (extend to 20 min)

- [ ] Is the accountability system driving behavior? (Y/N)
- [ ] Which mechanism is most effective? (self-reporting / consequences / environment)
- [ ] Which mechanism is being ignored?
- [ ] Are consequences motivating? Too easy? Too harsh?
- [ ] Have escalation triggers been hit? What action was taken?
- [ ] Any goals to add, modify, or remove?
- [ ] Adjustments for next month: _________________
