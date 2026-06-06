---
name: work-life-balance-assessment
description: |
  Conducts a structured work-life balance assessment and produces a personalized rebalancing plan with specific time allocation changes, boundary-setting scripts, and a weekly schedule redesign. Gathers the user's current time allocation, energy patterns, and values, then identifies imbalances and creates actionable adjustments.
  Use when the user asks about work-life balance, feeling overworked, burnout prevention, setting boundaries at work, or creating more personal time.
  Do NOT use for clinical burnout diagnosis, workplace harassment situations, or treating occupational stress disorders.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness time-management self-care stress-management"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Work Life Balance Assessment

> **Disclaimer:** This skill provides general wellness information for educational and self-reflection purposes only. It does NOT constitute medical advice, clinical diagnosis, or treatment for any condition including burnout, depression, anxiety disorders, or occupational stress disorders. The assessments, reference ranges, and suggestions here are educational tools, not clinical instruments. If you are experiencing symptoms that significantly impair your ability to function -- including persistent hopelessness, inability to get out of bed, suicidal thoughts, or physical symptoms of stress -- contact a licensed mental health professional or your primary care physician. If you are in immediate distress, contact emergency services or a crisis line.

---

## When to Use

**Use this skill when:**
- The user describes feeling chronically overworked, saying things like "I have no time for myself," "I can't remember the last time I relaxed," or "I feel like I live to work"
- The user explicitly asks for help assessing their work-life balance, creating a balanced schedule, or figuring out where their time actually goes
- The user wants to set clearer boundaries at work -- with their manager, their team, or their own after-hours behavior -- and needs specific language to do it
- The user is trying to prevent burnout proactively, recognizing that their current pace is unsustainable before it becomes a crisis
- The user wants to redesign their weekly schedule to protect time for relationships, health, hobbies, or rest and does not know where to start
- The user feels guilty taking personal time and needs a framework to reframe recovery as functional maintenance rather than self-indulgence
- The user is returning from a high-demand period (crunch at work, caregiving crisis, new baby) and wants to deliberately reset their routines

**Do NOT use when:**
- The user describes symptoms consistent with clinical burnout, major depression, or an anxiety disorder (persistent emotional numbness, inability to experience pleasure, intrusive thoughts, panic attacks) -- refer to a licensed mental health professional using the clinical referral language in Rule 10
- The user is describing a toxic workplace, harassment, discrimination, or a hostile manager -- this is an HR, legal, or organizational problem that time reallocation cannot solve; use a workplace conflict or career navigation skill instead
- The user's primary need is productivity optimization -- they want to get more work done in less time, not to protect personal time; use a time management or productivity system skill instead
- The user wants career change advice, is deciding whether to leave a job, or needs help evaluating a job offer; use a career development skill
- The user needs help managing a specific mental health condition (work-related anxiety, PTSD from a workplace event); this requires clinical support, not a wellness assessment
- The user is describing a medical emergency or crisis -- end this skill immediately and direct them to emergency services or a crisis line
- The user is asking about workplace ergonomics, physical health at work, or occupational injury -- use an occupational health skill

---

## Process

### Step 1: Conduct the Time-Energy Audit

Before any plan can be built, you need accurate raw material: how the user actually spends their 168-hour week. Do not accept summaries or impressions -- ask for estimates by category, then do the arithmetic together.

**Ask the user to estimate weekly hours in each of the six categories below:**

- **Work (all-in):** Paid hours plus commute time (both directions, every day), plus work-related communication outside official hours (checking email after dinner, Slack at midnight), plus preparatory work (reviewing materials on Sunday evening, prepping presentations at home). Many users undercount this by 5-10 hours because they do not count "soft" work time.
- **Essential maintenance:** Sleep (hours in bed x 7 days), meals (including preparation and cleanup), hygiene and grooming, household management (cleaning, laundry, grocery shopping, errands), medical and dental appointments. This category is often estimated at 20-30 hours but frequently runs 28-35 hours when sleep is counted accurately.
- **Relationships:** Actual quality time with partner, children, family, or friends -- not co-presence (being in the same room but both on phones), not transactional interactions (coordinating schedules), but engaged, present interaction. Include in-person and intentional remote connection. Exclude time when a child is simply nearby while you are working.
- **Personal fulfillment:** Any activity done primarily for intrinsic reward: exercise, hobbies, creative work, learning for pleasure, spiritual or contemplative practice, volunteer work. If the user struggles to list anything, that is diagnostic information.
- **Recovery:** Pure restoration -- sleep is already counted, so this means passive rest, entertainment, aimless leisure, scrolling, watching TV, lying on the couch. Note that passive recovery is not equivalent to active restoration; it refills low-energy states but does not build capacity the way sleep or exercise does.
- **Unaccounted buffer:** The remainder after the five categories are summed. Typical unaccounted time is 5-15 hours; if it exceeds 20 hours, the user is likely underestimating work or overestimating sleep.

**After gathering numbers, do the following calculations:**
- Sum all categories and compare to 168
- Calculate each category as a percentage of the week
- Note which categories are above or below reference ranges (see Step 2)
- Ask two qualitative questions: "Which category feels most depleted or neglected?" and "Which category feels like it is consuming more than its fair share?"

The qualitative answers often diverge from the quantitative data in revealing ways. A user might have 15 hours of relationship time on paper, but if it is all with their children and zero with adults, the fulfillment from that category is different than the numbers suggest.

---

### Step 2: Identify the Imbalance Pattern Using Reference Ranges and Thresholds

Reference ranges are not prescriptions -- they are epidemiologically derived baselines that correlate with sustained wellbeing. Individual needs vary. Use them as discussion anchors, not judgments.

**Reference ranges (per week) and key thresholds:**

| Category | Sustainable Range | Warning Threshold | Critical Threshold |
|---|---|---|---|
| Work (all-in) | 40-50 hours | 51-60 hours | 61+ hours |
| Sleep | 49-63 hours (7-9 hrs/night) | 42-48 hours (6-7 hrs/night) | Under 42 hours (<6 hrs/night) |
| Essential maintenance | 28-35 hours | Under 21 hours | Under 14 hours |
| Relationships | 10-20 hours | 5-10 hours | Under 5 hours |
| Personal fulfillment | 7-15 hours | 3-7 hours | Under 3 hours / zero |
| Recovery/leisure | 10-20 hours | Under 7 hours | Zero |

**Name the specific imbalance pattern.** There are five common patterns with distinct interventions:

- **The Overwork Compression Pattern:** Work hours are above 55, sleep is adequate or near-adequate, but everything else is compressed. The fix is primarily work boundary-setting and time reclamation.
- **The Sleep-Sacrifice Pattern:** Sleep is below 42 hours per week (six hours per night), and the lost hours are being absorbed by either work or passive late-night recovery. The fix prioritizes sleep before any other rebalancing, because sleep deprivation impairs every other category.
- **The Fulfillment Drought:** Work hours are moderate (50-55), sleep is adequate, but personal fulfillment is zero or near-zero. The user has traded identity-sustaining activities for the path of least resistance. The fix is reactivating specific fulfillment activities within existing time, not reclaiming hours from work.
- **The Relationship Recession:** Work hours are moderate, fulfillment time may exist, but relationship time is critically low. The fix is scheduling and protecting dedicated relationship time, often replacing passive solo recovery.
- **The Compound Deficit:** Multiple categories are at warning or critical threshold simultaneously. Work exceeds 55 hours, sleep is under 6 hours per night, fulfillment is zero, relationships are under 5 hours. This pattern warrants a note about professional support (see Rule 10) and requires a phased plan that stabilizes one category before attempting another.

State the imbalance in concrete, specific language: "You are spending 62 hours per week on work-related activity (37% of your week) and zero hours on personal fulfillment. Sleep at 38 hours per week (5.4 hours per night) is below the threshold associated with sustained cognitive and physical health. This is a Compound Deficit pattern." Do not soften the numbers; accuracy helps the user see why change matters.

---

### Step 3: Assess Energy Patterns and Identify Time-Quality Mismatches

Not all hours are equal. Sixty minutes of high-energy morning time spent in a non-urgent meeting is a qualitatively different loss than 60 minutes of low-energy evening time spent on email. Understanding the user's energy architecture prevents you from designing a schedule that puts the right activities at the wrong times.

**Ask the following questions to map energy patterns:**
- What time of day do you feel sharpest and most capable of complex thinking? (Chronotype anchoring)
- What time of day do you reliably hit a low -- the period where focus drops and mood is lowest?
- What is the first thing you do when you wake up? What is the last thing you do before sleep? (These reveal intrusion patterns -- whether work or phone has colonized sleep transitions)
- When do you most often check work messages outside official hours? Is it compulsive (automatic, without thinking) or responsive (only when you expect something)? Compulsive checking requires habit redesign, not just boundaries.
- After which activities in your current week do you feel genuinely restored vs. after which do you feel depleted?

**Common energy-schedule mismatches to identify:**
- High-value personal time (exercise, creative work) consistently displaced to low-energy slots (10 PM) where it never actually happens
- High-cognitive work (strategic thinking, writing, complex problem-solving) scheduled during chronobiological low points (early afternoon for most people), leaving peak morning hours for administrative tasks
- Recovery time front-loaded with passive activities (scrolling) that feel restful but do not produce genuine restoration, leaving no time for active recovery (exercise, social connection) that actually recharges the user
- Sleep transitions invaded by work: checking email immediately upon waking or within 30 minutes of sleep onset, which elevates cortisol and degrades sleep quality

---

### Step 4: Identify the Top 3 Rebalancing Opportunities

Limit to exactly three changes. Research on habit formation and behavior change (from Fogg's Tiny Habits model to implementation intention research) consistently shows that concurrent change attempts beyond three have sharply diminishing success rates. Three changes, implemented well, produce more lasting shift than seven changes implemented poorly.

**Selection criteria for which three to choose:**

1. **Highest impact first:** If sleep is below 6 hours per night, that is always the first change, regardless of what else is wrong. Sleep deprivation impairs every other capacity -- the ability to enforce boundaries, the energy to exercise, the patience for relationships. Sleep first.
2. **Lowest friction second:** Choose the change that is structurally easiest to implement. A change that requires only a new habit (moving bedtime by 45 minutes) beats one that requires a difficult conversation (asking a manager to stop sending late-night messages). Build momentum before tackling structural obstacles.
3. **Highest personal value third:** Ask the user what they miss most or what feels most absent from their life. This third change is the one that reminds the user why balance matters -- it is motivationally anchored.

**Each rebalancing opportunity must specify:**
- What specifically changes (not "work less" but "stop checking work messages after 8:00 PM on weekdays")
- How many hours per week are recovered or redirected
- Which category the recovered hours come from (source)
- Which category the recovered hours go to (destination)
- The exact mechanism: what action or new behavior makes this happen
- The leading indicator: how the user will know the change is working within 7 days

---

### Step 5: Design Boundary-Setting Strategies With Exact Scripts

Boundaries without communication strategies are aspirations. Every boundary the user needs to set must come with the exact words to say or write, because the gap between knowing a boundary is needed and being able to articulate it is where most attempts fail.

**For each boundary, provide five components:**

1. **The boundary statement:** Precise, behavioral, observable. "I will not respond to non-urgent work messages after 7:30 PM on weekdays" is a boundary. "I will try to have more personal time" is not.
2. **The communication script:** The actual sentence or paragraph the user can say out loud or paste into a message with minimal editing. Write it in first-person, confident-but-collegial tone. Avoid apologetic framing ("I'm sorry to do this, but...") and avoid aggressive framing ("I refuse to..."). Neutral, professional, clear.
3. **The objection response:** The one or two most likely challenges to this boundary and the exact response to each. Most boundary failures happen at the first point of resistance because the user has not rehearsed the response.
4. **First-two-weeks protocol:** What to do in the hardest phase of a new boundary, when the old pattern is strongest. Concrete behavioral instructions: what to do instead of the habitual response, how to manage the discomfort of the new behavior.
5. **The circuit breaker:** A specific, observable indicator that tells the user the boundary has been violated -- so they can reset rather than abandon it. Not shame about the violation, but a clear trigger for re-engaging the boundary next time.

**Types of boundaries and their specific mechanisms:**

- **Temporal boundaries** (after-hours communication, weekend work): Require technology configuration -- turning off notifications, setting status to "unavailable," using OS-level Focus Modes or Do Not Disturb. The technology must enforce what willpower cannot sustain.
- **Workload boundaries** (saying no to new assignments, declining meetings): Require pre-written templates for declining or delegating, because each instance feels unique but the structure is the same.
- **Physical boundaries** (separating workspace from personal space, especially for remote workers): Require a designated work location with a defined entry/exit ritual -- a "commute substitute" that the brain uses to switch contexts.
- **Attentional boundaries** (not thinking about work during personal time): Require a brain dump practice -- writing down all open work loops before ending the workday, so the brain's "open file" monitoring can close. The Zeigarnik effect means unclosed loops intrude on personal time; writing them down closes the loop temporarily.

---

### Step 6: Design the Rebalanced Weekly Schedule

The schedule is not a prescription -- it is a structural template that makes the rebalancing opportunities concrete and visual. A plan without a schedule is an intention; a schedule makes it a system.

**Schedule design principles:**

- **Anchor to fixed points first:** Identify immovable commitments (work start time, school pickup, recurring meetings) and build around them. Do not design around ideal conditions that do not exist.
- **Apply the energy-time match:** Put highest-energy personal activities (exercise, creative hobbies, meaningful social time) at chronobiologically appropriate times, not default leftover slots.
- **Include transition rituals at every work-personal boundary:** Morning startup ritual (signals the start of work), evening shutdown ritual (signals the end of work), and a post-work decompression ritual. These are not luxuries -- they are the psychological infrastructure that makes the schedule work.
- **Build in buffer time:** Every day should have a 30-60 minute unscheduled buffer to absorb overruns. A schedule with no slack is one unexpected task away from collapse, which trains the user to abandon schedules because "they never work."
- **Designate one "non-negotiable personal block" per day:** Even on the busiest days, there is one block that does not get traded for work. It can be as short as 20 minutes. The content matters less than the habit of protecting it. This is the anchor behavior.
- **Design weekends as distinct from weekdays:** Many overworked people treat weekends as continuation of the workweek. The rebalanced schedule should show clear structural differences between Saturday/Sunday and workdays.

**Transition ritual specifics:** The most common balance failure is the inability to mentally exit work. Provide a specific end-of-workday shutdown sequence: (1) Write a 3-item "tomorrow's priority" note -- this closes cognitive open loops. (2) Clear the physical workspace or close all work tabs. (3) One physical transition action: change clothes, take a short walk, make a specific beverage. The sequence must be the same every day to build automatic context-switching.

---

### Step 7: Build the 2-Week Implementation Plan and Establish a Check-In Framework

Gradual implementation is more effective than simultaneous change. The implementation plan phases in changes to prevent overwhelm and build confidence through early wins.

**Week 1: Foundation Changes Only**
- Implement the single highest-impact change identified in Step 4 (typically sleep or work boundary)
- Configure technology to enforce the boundary (Do Not Disturb, notification settings, calendar blocks)
- Start the end-of-workday shutdown sequence every day, even imperfectly
- Identify the one non-negotiable personal block and protect it every day

**Week 2: Add the Second Change; Assess Week 1**
- At the start of Week 2, do a brief audit: how many protected blocks from Week 1 were actually honored? What caused violations? Adjust the plan to address real obstacles, not imagined ones.
- Add the second rebalancing change
- Add the social or relationship block if it was the second or third change
- Note energy levels at the end of Week 2 compared to Week 1 -- early positive feedback reinforces continuation

**Establish the 4-week check-in:** At 4 weeks, the user should re-run the time audit (Step 1) with actual behavior rather than aspiration, and compare to the baseline. Even a 20% improvement in sleep or a doubling of personal fulfillment time from near-zero is meaningful progress worth acknowledging.

---

## Output Format

```
## Work-Life Balance Assessment

> Note: This assessment is a wellness self-reflection tool, not a clinical evaluation.

---

### Current Time Allocation (Weekly)

| Category | Hours/Week | % of Week | Reference Range | Status |
|---|---|---|---|---|
| Work (all-in, incl. commute + after-hours) | [X] | [X%] | 40-50 hrs | [Over / Within / Under] |
| Sleep | [X] | [X%] | 49-63 hrs | [Over / Within / Under] |
| Essential maintenance | [X] | [X%] | 28-35 hrs | [Over / Within / Under] |
| Relationships | [X] | [X%] | 10-20 hrs | [Over / Within / Under] |
| Personal fulfillment | [X] | [X%] | 7-15 hrs | [Over / Within / Under] |
| Recovery/leisure | [X] | [X%] | 10-20 hrs | [Over / Within / Under] |
| Unaccounted buffer | [X] | [X%] | 5-15 hrs | |
| **Total** | **168** | **100%** | | |

---

### Imbalance Pattern Identified

**Pattern name:** [Overwork Compression / Sleep-Sacrifice / Fulfillment Drought / Relationship Recession / Compound Deficit]

[2-3 sentences describing the specific, quantified imbalance with category-level detail. Use exact hours and percentages.]

**Energy-schedule mismatch:** [1 sentence identifying any mismatch between the user's energy peaks and how their time is currently structured, if relevant.]

---

### Top 3 Rebalancing Opportunities

**Priority 1: [Specific Change Title]**
- What changes: [Exact behavioral description]
- Hours recovered/redirected: [X] hours/week
- From category: [Source category]
- To category: [Destination category]
- Mechanism: [The specific action that makes this happen]
- 7-day indicator: [How the user will know this is working within one week]

**Priority 2: [Specific Change Title]**
- What changes: [Exact behavioral description]
- Hours recovered/redirected: [X] hours/week
- From category: [Source category]
- To category: [Destination category]
- Mechanism: [The specific action]
- 7-day indicator: [Observable sign of progress]

**Priority 3: [Specific Change Title]**
- What changes: [Exact behavioral description]
- Hours recovered/redirected: [X] hours/week
- From category: [Source category]
- To category: [Destination category]
- Mechanism: [The specific action]
- 7-day indicator: [Observable sign of progress]

---

### Boundary-Setting Plan

**Boundary 1: [Precise behavioral boundary statement]**
- Communication script: "[Exact words, ready to say or paste]"
- If challenged with "[most likely objection]": "[Exact response]"
- First 2 weeks: [Specific behavioral protocol for the hardest phase]
- Circuit breaker: [The observable indicator that the boundary was violated, with reset instruction]

**Boundary 2: [Precise behavioral boundary statement]**
- Communication script: "[Exact words, ready to say or paste]"
- If challenged with "[most likely objection]": "[Exact response]"
- First 2 weeks: [Protocol]
- Circuit breaker: [Violation indicator and reset]

---

### Rebalanced Weekly Schedule

| Time | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| [Start time] | | | | | | | |
| [Hour blocks across the day] | | | | | | | |
| [End time] | | | | | | | |

**Protected blocks (non-negotiable -- these do not move for work):**
- [Block 1: category, days, exact time window]
- [Block 2: category, days, exact time window]
- [Block 3 if applicable]

**End-of-workday shutdown sequence:**
1. [Step 1: 3-item tomorrow priority note]
2. [Step 2: physical workspace close]
3. [Step 3: transition action]
Estimated time: [X] minutes

**Transition ritual:** [Specific action, duration, and timing]

---

### 2-Week Implementation Plan

| Phase | Changes to Implement | Technology/Setup Required | Success Indicator |
|---|---|---|---|
| Week 1 (Days 1-7) | [Change 1 only] | [Specific app/setting/tool] | [Observable behavior by Day 7] |
| Week 2 (Days 8-14) | [Change 2] + [Week 1 audit] | [Specific setup] | [Observable behavior by Day 14] |
| 4-Week Check-In | Re-run time audit; compare to baseline | -- | [Target metric: e.g., sleep at 49+ hrs/week] |

---

### Revised Time Allocation (Target State)

| Category | Current Hours | Target Hours | Change |
|---|---|---|---|
| Work (all-in) | [X] | [X] | [+/- X hrs] |
| Sleep | [X] | [X] | [+/- X hrs] |
| Essential maintenance | [X] | [X] | [+/- X hrs] |
| Relationships | [X] | [X] | [+/- X hrs] |
| Personal fulfillment | [X] | [X] | [+/- X hrs] |
| Recovery/leisure | [X] | [X] | [+/- X hrs] |
| **Total** | **168** | **168** | |
```

---

## Rules

1. **Never diagnose, never label clinical conditions.** Use descriptive, behavioral language only. "Your sleep is 14 hours below the recommended minimum" is appropriate. "You have burnout" or "You show signs of depression" is not. If the user uses the word "burnout" themselves, reflect it back as their own description rather than adopting it as a clinical assessment: "You described this as burnout. What you're describing -- [specific hours and patterns] -- is a schedule that is not sustainable."

2. **Never suggest quitting, confronting, or major career action.** This skill operates entirely within the user's stated current situation. It adjusts allocation and boundary behaviors, not organizational structure or employment relationships. If a structural problem (an abusive manager, a genuinely impossible workload) is the root cause and cannot be addressed by the user's behavior alone, name that plainly and refer to appropriate resources -- but do not provide career change advice within this skill.

3. **Always use exact numbers.** Every time allocation comparison, every reference range comparison, every rebalancing suggestion must include specific hours per week and percentage of the 168-hour week. "You work a lot" is useless. "You spend 62 hours per week on work-related activity -- 36.9% of your total available time -- which exceeds the sustainable range by 12-22 hours" is actionable.

4. **Always include boundary scripts with exact words.** A boundary without a script is an aspiration. Every boundary in the output must include a sentence or paragraph the user can say or paste verbatim. Scripts should be written in confident, neutral, professional first-person voice. Do not write apologetic scripts. Do not write aggressive scripts. Model the tone the user should aim for.

5. **Limit rebalancing suggestions to exactly three.** Not two (insufficient momentum), not four or five (overwhelm). Three is the evidence-based sweet spot for concurrent behavior change. If the user pushes for more, say: "These three changes, implemented well, will produce more real improvement than six changes attempted poorly. We can revisit additional changes at the 4-week check-in once these three are established."

6. **Sleep is always the first priority when it is below threshold.** If sleep is under 42 hours per week (6 hours per night average), it must be Priority 1, regardless of what the user says they most want to fix. Explain why: sleep deprivation impairs prefrontal cortex function, which is what the user needs to enforce every other change. Frame it as an enabling intervention, not a detour.

7. **Every schedule must include a transition ritual and an end-of-workday shutdown sequence.** These are not optional additions. The absence of a work-to-personal psychological transition is the single most common mechanism of work-life imbalance for knowledge workers and remote workers. A schedule without these rituals will fail within two weeks because work cognition bleeds into personal time.

8. **Acknowledge constraints; never dismiss them.** If the user says "I can't just leave at 5 PM," do not design a plan that requires leaving at 5 PM. Ask what constraints are real and structural vs. what constraints are assumed. Build the plan within actual constraints. If a constraint is genuinely immovable (medical resident on call, single parent with no backup), name it explicitly and design for it rather than around it.

9. **Passive recovery and sleep are not interchangeable.** Do not conflate scrolling, TV watching, or social media time with restorative sleep. If a user has large amounts of passive recovery time and insufficient sleep, the plan should redirect passive recovery to sleep, not frame them as alternatives. Passive recovery is net-neutral to mildly positive at best; sleep deprivation is actively harmful. This distinction must be stated explicitly if the user conflates the two.

10. **Apply the clinical referral threshold.** If any of the following are true, include a direct, non-alarming statement that the user may benefit from speaking with a licensed mental health professional or occupational health specialist, and provide this language: "What you're describing goes beyond schedule adjustment. A licensed therapist or occupational health specialist can provide support that a schedule change alone won't address. This doesn't mean something is wrong with you -- it means you need more than what this tool can offer." Triggers: (a) Work exceeds 70 hours per week consistently, (b) sleep is under 35 hours per week (5 hours per night), (c) personal fulfillment has been at zero for more than 6 months, (d) the user expresses feelings of hopelessness, meaninglessness, or inability to imagine change, (e) the user mentions physical symptoms they attribute to stress (chest pain, persistent headaches, gastrointestinal issues).

---

## Edge Cases

### The Caregiver With No Personal Time
When a user is a parent of young children, a primary caregiver for an elderly or ill family member, or both, their time audit will show relationship time that is technically high but functionally exhausting -- because caregiving is relational labor, not restorative relationship time. Standard reference ranges become misleading.

**How to handle:**
- Separate caregiving time from chosen relationship time in the audit. Label them distinctly: "Caregiving (obligatory)" vs. "Relationship time (chosen)." Caregiving hours belong in essential maintenance, not relationships.
- Acknowledge explicitly that 7-15 hours of personal fulfillment per week may be impossible in the current life phase, and that the reference range is aspirational rather than immediately achievable.
- Redesign the plan around micro-blocks: three 20-minute personal fulfillment slots per day are structurally equivalent to one 60-minute block but far more achievable for caregivers. Research on micro-recovery suggests even 10-20 minute intentional breaks produce measurable restoration when the activity is genuinely self-chosen.
- Identify tag-team opportunities: if there is a partner, family member, or community support system, design one 2-hour per week personal block where someone else takes primary caregiving responsibility. This requires explicit scheduling and a communication script.
- Do not suggest the caregiver "do self-care during naptime." This is the standard advice and it fails because naptime is also the only time to handle maintenance tasks. Instead, help identify which maintenance tasks can be batched, deferred, or delegated to create a genuine window.

### The Remote Worker With No Work-Home Separation
Remote workers frequently report that work has colonized every hour of their day -- not because they work more hours, but because work is always available and the psychological transition out of work never happens. Their time audit often shows moderate total work hours (45-50) with normal-looking numbers that belie constant low-level work intrusion.

**How to handle:**
- Add a qualitative question to the audit: "On a scale of 1-10, how often do you think about work during personal time?" If the answer is above 6, work intrusion is the primary problem, not raw hours.
- Spatial boundary design is the first intervention: designate a specific physical workspace (a specific room, corner, or desk) that is the only place work happens. If this is not possible due to space constraints, use a physical object as the workspace cue (a specific laptop stand, a specific lamp that is only on during work hours). The object creates a contextual cue that the brain uses to enter and exit work mode.
- Temporal design: a workday-start ritual (making coffee and sitting at the designated workspace as the first work act) and a workday-end shutdown sequence are both mandatory in the plan for remote workers.
- Recommend technology configuration: separate browser profiles for work and personal use, separate work and personal email apps, or a work-only device vs. personal device if possible. Visual and technological separation reinforces the psychological boundary.
- The brain dump practice (writing all open work loops at workday end) is especially critical for remote workers because the default is to carry those loops mentally into evening, where they surface as "just one more email."

### The User Whose Work Demand Is Genuinely Temporary or Structural
Some users are in roles where 55-70 hours per week is a real, structural feature of the job at certain times: medical residents, startup founders in early stages, accountants during tax season, agricultural workers during harvest, teachers during grading season. Telling these users to "protect 15 hours of personal fulfillment per week" is not credible and damages trust.

**How to handle:**
- Acknowledge the structural reality directly: "A 70-hour work week during your quarterly close is not a personal failure -- it is a known feature of your role. The plan for this period looks different from a sustainable steady-state plan."
- Focus the high-demand plan on minimum viable maintenance: sleep optimization (quality over quantity -- consistent sleep and wake time, dark/cool room, no screens 30 minutes before bed), one daily relationship touchpoint (even a 15-minute phone call or dinner), and one 20-minute daily recovery block (a walk, a shower taken slowly, anything that has zero cognitive demand).
- Include a mandatory "reassess date": the day after the high-demand period ends, the user re-runs the full audit and designs a rebalancing plan for the recovery period. The high-demand period does not extend indefinitely by default.
- If the high-demand period is not temporary -- if 60+ hours is the permanent baseline for this role -- name that plainly: "The sustainable range for long-term health and relationship functioning is 40-50 hours per week. A role that structurally requires 65+ hours is not a scheduling problem -- it's a role design problem. That's a career navigation question, which is outside this assessment, but worth noting."

### The User Who Feels Guilty About Personal Time
This edge case requires reframing before any practical plan will be accepted. A user who believes personal time is selfish or earned only through exhaustion will not implement a plan that protects personal time -- they will find reasons to override every protected block.

**How to handle:**
- Do not bypass the guilt with cheerful reassurance ("You deserve it!"). This does not work and feels dismissive.
- Use the functional reframe: "Your capacity to do your work, care for the people you love, and maintain your health is not separate from personal time -- it is produced by it. Skipping personal restoration does not free up capacity; it gradually depletes it until the system fails." This is a maintenance argument, not a self-indulgence argument.
- Offer a small experiment framing: "We're not redesigning your life. We're testing whether three specific changes over two weeks produce any noticeable improvement in your energy, focus, or mood. If they don't, we scrap the plan. If they do, the data tells you something your guilt cannot dismiss."
- Help the user identify a specific values-based reason to invest in balance: "What do you want to be present for that you currently aren't?" Anchor the plan to that specific answer. A plan to "have more balance" is abstract. A plan to "be mentally present at my son's soccer games, not checking email on the sidelines" is motivationally concrete.
- Note: If guilt about personal time is pervasive, persistent, and tied to a pattern of self-deprivation across multiple life areas, that may warrant a conversation with a therapist. Include this gently if it seems relevant.

### The User Whose Time Audit Does Not Add Up to 168 Hours
A user's self-reported time audit will frequently not sum to 168 hours. Over-counting produces totals above 168; under-counting produces totals significantly below. Both are informative.

**How to handle:**
- Over 168 hours (totals 180-200 hours): The user is double-counting or experiencing time distortion -- a common feature of chronic overwork. Work and essential maintenance overlap (eating lunch while working, sleeping poorly and spending an hour "resting" in bed that is not sleep). Walk through each category and identify the overlaps. Commuting while on a work call is work, not commute + work. Lying in bed unable to sleep is not sleep. Help the user identify the most likely overcounted categories.
- Under 168 hours by 20+ hours (totals 140-145 hours): There is significant unaccounted time, almost certainly passive recovery time (phone scrolling, background TV, social media) that the user does not register as deliberate activity. Ask: "What do you do between arriving home and going to bed on a typical weeknight?" This usually surfaces the missing hours. Passive recovery is not bad, but if it accounts for 25+ hours per week while personal fulfillment is near zero, there is an opportunity to redirect some of it.
- Under 168 hours by more than 30 hours: The user is estimating significant categories from memory with low accuracy. Ask them to track actual time for 48-72 hours before proceeding, or use a time-tracking app (any simple timer-based app works) on two representative days.

### The User Describing Severe Imbalance That Meets Clinical Referral Threshold
If the user describes working 75+ hours per week, sleeping 4-5 hours per night for months, having experienced no personal fulfillment or meaningful social connection in more than six months, or expresses hopelessness about the possibility of change, the plan must include a clinical referral note before proceeding.

**How to handle:**
- Complete the time audit and imbalance identification so the user feels heard and understood -- do not immediately redirect without engagement.
- Then, include this note at the top of the plan: "What you've described -- [specific hours, specific duration, specific absence of recovery] -- is beyond what a schedule adjustment can address on its own. The changes I'll outline below are meaningful and worth starting, and I also want to note clearly: speaking with a licensed therapist, your primary care physician, or an occupational health specialist can provide support that this plan cannot. This is not an alarm; it's simply a recognition that you're carrying more than a scheduling problem."
- Then proceed with the plan. Do not withhold the plan because of the referral. The referral note and the plan coexist.

---

## Example

**Input:** "I'm a software engineer at a mid-size tech company. I work probably 58-60 hours a week -- the official hours are 9 to 6 but I start checking Slack around 7:30 AM and I'm usually still responding to things until 9 or 10 PM. My commute is about 45 minutes each way 3 days a week, I'm fully remote the other 2. I sleep maybe 5.5 to 6 hours a night because I can't seem to get to bed before midnight. I eat okay. I live alone so maintenance isn't that intensive -- maybe 20 hours for meals, cleaning, errands. I used to run regularly and play guitar but I haven't done either in about 8 months. I see friends maybe twice a month for 2-3 hours at a time. I want to fix this but I genuinely don't know where to start and I feel like if I disconnect even for a few hours something will go wrong at work."

---

**Output:**

## Work-Life Balance Assessment

> Note: This assessment is a wellness self-reflection tool, not a clinical evaluation.

---

### Current Time Allocation (Weekly)

| Category | Hours/Week | % of Week | Reference Range | Status |
|---|---|---|---|---|
| Work (all-in: 7:30 AM to 9-10 PM weekdays, minus meals and commute) | 62 | 36.9% | 40-50 hrs | Over by 12-22 hrs |
| Commute (3 days/week, 1.5 hrs round trip) | 4.5 | 2.7% | Included in work | Included above |
| Sleep (5.5-6 hrs/night x 7 days) | 39 | 23.2% | 49-63 hrs | **Under by 10-24 hrs** |
| Essential maintenance (meals, cleaning, errands) | 20 | 11.9% | 28-35 hrs | Slightly under |
| Relationships (2x/month = ~5 hrs, divided by 4.3 weeks) | 5 | 3.0% | 10-20 hrs | Critically low |
| Personal fulfillment (running, guitar: currently zero) | 0 | 0.0% | 7-15 hrs | **Zero for 8 months** |
| Recovery/passive leisure | 37.5 | 22.3% | 10-20 hrs | High -- likely absorbing post-midnight hours |
| **Total** | **168** | **100%** | | |

Note on the numbers: Work (62 hours) includes the 9-to-6 scheduled day plus the 7:30-9:00 AM Slack window plus the 6:00-9:30 PM response window on weekdays, minus 1 hour for meals. The commute (4.5 hours) is embedded within the work total. Recovery at 37.5 hours is larger than expected and likely represents the late-night hours between 10 PM and midnight that are spent in passive states (scrolling, TV, unwinding in a low-energy but not-restful way) rather than productive work or quality sleep.

---

### Imbalance Pattern Identified

**Pattern: Compound Deficit -- Sleep-Sacrifice + Fulfillment Drought**

You are spending 62 hours per week (36.9% of your available time) on work-related activity, including the 90 minutes before official work hours and the 3-4 hours of evening responsiveness that extends your effective workday to 13.5 hours. Sleep is at approximately 39 hours per week -- 5.6 hours per night -- which is 10-24 hours below the recommended range and falls into the warning threshold (under 42 hours). Personal fulfillment is at zero, and has been for 8 months; activities that previously anchored your identity outside work (running, guitar) have been fully displaced. Relationship time is at 5 hours per week, which is below the warning threshold.

The passive recovery category (approximately 37.5 hours) is the largest non-work category, but this time is not producing genuine restoration -- it is the low-energy "decompression" between the end of evening work responsiveness and the too-late bedtime. It provides distraction but not recovery.

**Energy-schedule mismatch:** Your sharpest cognitive hours (likely 9 AM to noon based on a typical developer chronotype) are being partially consumed by administrative Slack monitoring rather than deep work, and your only "personal" window -- late evening -- is the lowest-energy slot of the day, which is why running and guitar have not happened there.

---

### Top 3 Rebalancing Opportunities

**Priority 1: Add 10 hours of sleep per week (move from 5.6 to 7 hours per night)**
- What changes: Bedtime moves from approximately midnight to 10:45 PM on weeknights. Slack and email notifications are turned off at 10:00 PM via Do Not Disturb settings.
- Hours recovered/redirected: 10 hours/week
- From category: Passive recovery (late-night low-energy time)
- To category: Sleep
- Mechanism: Set Do Not Disturb on phone and computer to activate at 10:00 PM automatically, every night. Set a "prepare for bed" alarm at 10:00 PM. Put the phone on the charger in the kitchen -- not the bedroom -- at 10:15 PM. Begin the pre-sleep routine (brush teeth, dim lights) at 10:30 PM, lights out at 10:45 PM. Wake time stays at 7:00 AM on work days, 8:00 AM on weekends.
- 7-day indicator: By Day 7, you have been in bed with lights off before 11:00 PM on at least 5 of 7 nights. You notice whether you are waking more rested (this takes 5-10 days of consistent sleep to register clearly).

**Priority 2: Eliminate the pre-work Slack window (7:30 AM to 9:00 AM)**
- What changes: Slack and work email are not opened until 9:00 AM on workdays. The 7:30-9:00 AM window becomes protected morning time.
- Hours recovered/redirected: 7.5 hours/week (1.5 hours x 5 days)
- From category: Work (removing the pre-official-hours extension)
- To category: Split between personal fulfillment (running, 3 days/week) and essential maintenance (better morning routine)
- Mechanism: Remove Slack from your phone's home screen and disable all Slack notifications until 9:00 AM using notification scheduling. On Tuesdays, Thursdays, and Saturdays, the 7:30-8:30 AM window is the run. On Mondays, Wednesdays, and Fridays, it is an extended, unpressured morning -- coffee, breakfast without a screen, a slower start. This requires one setup step: communicate to your team that your response window starts at 9:00 AM (script below).
- 7-day indicator: You have completed at least 2 morning runs by Day 7. You have not opened Slack before 9:00 AM on more than 1 day.

**Priority 3: Set a hard 9:00 PM evening cutoff for work communication**
- What changes: After 9:00 PM, no new work messages are read or responded to. The current effective workday ends at 9:30-10:00 PM; this moves it to 9:00 PM, recovering 30-60 minutes of evening time and creating a genuine wind-down window.
- Hours recovered/redirected: 3.5 hours/week (30-60 min x 5 weeknights)
- From category: Work (evening extension)
- To category: Recovery (genuine wind-down) and eventually guitar (a 20-minute guitar session before the 10:00 PM screen-off is the target for Week 3+)
- Mechanism: Set Slack status to "offline" and set all work notifications to silent at 9:00 PM via Focus Mode. Do not check retrospectively at 9:15 PM "just in case." Use the brain dump technique (Step 5 in the plan below) at 8:45 PM to close cognitive open loops before the cutoff.
- 7-day indicator: By Day 7, you have honored the 9:00 PM cutoff on at least 4 of 5 weeknights. You have checked whether any actual crisis emerged from the gaps -- almost certainly none did.

---

### Boundary-Setting Plan

**Boundary 1: Work communication starts at 9:00 AM, not before**
- Communication script (send to your team in Slack or email): "Hey team -- I'm making a small adjustment to my availability: I'll be starting my day and checking messages at 9:00 AM going forward, rather than earlier. My response time during work hours stays the same. For anything time-sensitive before 9, [teammate name] can cover or I'll address it first thing at 9. Thanks for the heads-up."
- If challenged with "But we sometimes need you before standup": "Totally fair. If there's a P0 incident or something genuinely needs me before 9, text my phone directly -- that will always reach me for true emergencies. Slack messages I'll pick up at 9."
- First 2 weeks: Disable Slack notifications on your phone before 9:00 AM using iOS Screen Time or Android Digital Wellbeing. Do not rely on willpower alone -- the notification architecture has to change. If you feel strong urges to check before 9, note what specifically you are afraid you are missing. After two weeks, look back at whether any of those fears materialized.
- Circuit breaker: If you find yourself opening Slack before 9 AM, close it immediately and note the time. At the end of the week, count the violations. If there are more than 2, the technological control is insufficient -- consider a harder block (using an app blocker like Cold Turkey or Freedom to hard-block Slack until 9 AM).

**Boundary 2: Work communication ends at 9:00 PM on weeknights**
- Communication script (no announcement needed -- simply stop responding after 9 PM. If a colleague notices and asks, use this): "I've started closing down work apps at 9 PM to make sure I'm getting enough sleep to bring full energy to work. I'll pick up anything from the evening first thing the next morning."
- If challenged with "We had an important conversation last night and you didn't respond": "I saw it this morning and handled it [or: it was resolved by the time I picked it up]. For things that genuinely can't wait until morning, text me directly -- my Slack goes quiet at 9 but my phone is on for real emergencies."
- First 2 weeks: At 8:45 PM each night, do the brain dump: open a notes app or a paper notebook and write every open work item you are carrying in your head. Title it "Tomorrow's open loops." Write them all down, then close the notebook. Set Slack and email to Do Not Disturb at 9:00 PM automatically. The brain dump is critical -- without it, your brain will manufacture reasons to check "just one more time."
- Circuit breaker: If you respond to a work message after 9 PM, it is not a failure -- it is data. Ask yourself: Was this a genuine emergency? (If yes, the boundary should accommodate genuine emergencies via text, which it does.) Was it compulsive? (If yes, the brain dump was skipped or the notification architecture is not working.) Reset the next night rather than declaring the boundary a failure.

---

### Rebalanced Weekly Schedule

| Time | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| 7:00-7:30 AM | Morning (no screens) | **Run (30 min)** | Morning (no screens) | **Run (30 min)** | Morning (no screens) | Sleep until 8 | Sleep until 8 |
| 7:30-8:30 AM | Breakfast, prep | Post-run, shower | Breakfast, prep | Post-run, shower | Breakfast, prep | Morning coffee | Morning coffee |
| 8:30-9:00 AM | Commute prep or start-up ritual | Commute prep or start-up ritual | Commute prep | Commute (remote) | Commute | Leisure | Leisure |
| 9:00 AM-12:00 PM | **Work (deep focus)** | **Work (deep focus)** | **Work (deep focus)** | **Work (deep focus)** | **Work (deep focus)** | Personal time | Personal time |
| 12:00-12:45 PM | Lunch (away from desk) | Lunch (away from desk) | Lunch (away from desk) | Lunch (away from desk) | Lunch (away from desk) | Lunch | Lunch |
| 12:45-6:00 PM | Work | Work | Work | Work | Work | **Run (Sat)** | Rest/admin |
| 6:00-7:00 PM | Commute + decompression | Dinner | Commute + decompression | Dinner | Commute + decompression | Dinner | Dinner |
| 7:00-8:00 PM | Dinner
