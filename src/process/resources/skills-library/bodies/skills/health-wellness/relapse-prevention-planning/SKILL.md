---
name: relapse-prevention-planning
description: |
  Creates a structured plan for getting back on track after a habit break, covering common disruption patterns (travel, illness, schedule changes, motivation loss), recovery protocols, and streak rebuilding strategies. Produces a complete recovery playbook with warning signs, action steps, and minimum viable habit rules for maintaining progress during disruptions.
  Use when the user asks about getting back on track after falling off a habit, recovering from a habit break, preventing habit backsliding, or maintaining habits during disruptions.
  Do NOT use for substance abuse relapse prevention, addiction recovery planning, or clinical relapse prevention for mental health conditions.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting mental-wellness habits self-care"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Relapse Prevention Planning

> **Disclaimer:** This skill provides general wellness and behavioral habit information for educational purposes only. It does NOT constitute medical advice, clinical treatment, or therapeutic intervention. This skill is strictly limited to non-clinical habit disruption -- everyday habits such as exercise, sleep hygiene, nutrition, journaling, meditation, and productivity routines. It does NOT apply to substance use, addiction, eating disorders, or clinical mental health conditions. If a user describes any of these, do not proceed -- refer them to a qualified healthcare professional or licensed counselor immediately.

---

## When to Use

**Use this skill when the user:**
- Has fallen off a non-clinical habit (exercise, journaling, hydration, sleep schedule, diet quality, meditation, reading, skin care, productivity routines) and wants a structured path back
- Is anticipating a disruption (upcoming travel, surgery recovery, busy season, new job, move) and wants a pre-built recovery playbook before the break happens
- Describes a repeating cycle of building a habit, losing it, and not knowing why they keep losing it
- Wants to reduce the emotional cost of habit disruption -- guilt, shame, frustration, or resignation after missing days
- Is rebuilding after a major life transition (new baby, job change, relocation) that permanently destroyed the old routine's environmental scaffolding
- Wants to know what warning signs to watch for so they can intervene before a minor slip becomes a multi-week break
- Asks how long recovery "should" take and is trying to set realistic expectations after a break of days, weeks, or months

**Do NOT use this skill when:**
- The user describes substance use, alcohol, drugs, nicotine, or gambling -- these require a licensed addiction counselor or substance use treatment provider; habit disruption frameworks do not address physiological dependency or psychological compulsion
- The user mentions clinical relapse prevention for a diagnosed mental health condition (depression, bipolar disorder, OCD, anxiety disorder, PTSD) -- refer to their treatment team; this is a clinical matter, not a habit matter
- The user is describing disordered eating patterns, compulsive exercise, or restriction behaviors -- these are clinical concerns; use `eating-disorder-sensitivity` guidance and refer to a registered dietitian or therapist
- The user wants to build a completely new habit from scratch with no prior history of the habit -- use `habit-stacking-framework` instead, which covers implementation intentions, habit pairing, and cue design
- The user wants a challenge-based momentum builder (30-day structure, accountability partner matching, streak mechanics) -- use `30-day-habit-challenge` instead
- The user is describing burnout, chronic fatigue, or work-life imbalance as the root cause of all habit collapse -- these systemic issues need `burnout-recovery-planning`, not a habit protocol
- The user explicitly states they do not want to restart the habit and are looking for permission to stop -- validate their decision and do not produce a recovery plan; produce a graceful exit acknowledgment instead

---

## Process

### Step 1: Conduct a Structured Disruption Assessment

Before producing any plan, gather specific information. Do not assume. The recovery architecture changes significantly based on the answers.

- **What habit(s) were disrupted?** Get the specific behavior, not the category. "Exercise" is insufficient -- "30-minute runs 4 days per week at 6 AM" is actionable.
- **How established was the habit before the break?** Under 66 days (pre-automaticity phase) is fragile and needs more scaffolding. Over 66 days (post-automaticity) has stronger neural encoding and recovers faster -- research by Phillippa Lally et al. suggests 66 days as the median automaticity threshold, with a range of 18 to 254 days depending on behavior complexity.
- **How long has the break been?** Classify by duration:
  - 1-3 days: Micro-slip -- immediate resume protocol
  - 4-14 days: Short break -- graduated 10-day recovery
  - 15-60 days: Medium break -- standard 3-week recovery protocol
  - 60+ days: Extended break -- treat as near-new habit with 4-week reintroduction
- **What caused the disruption?** Use the four-type classification in Step 2.
- **Is the disruption resolved, ongoing, or cyclical?** Resolved = environment is back. Ongoing = environment changed permanently. Cyclical = same disruption recurs (travel schedule, seasonal illness, semester structure).
- **How is the user feeling about the break?** Guilt, shame, and resignation are the three emotions that most reliably prevent restart. Identify which one is active and address it specifically in the emotional reset section.
- **Have they tried to restart before and failed?** If yes, how many times and over what timeframe? Three or more failed restarts in 6 months signals a structural problem, not a willpower problem -- the habit design needs to change, not just the motivation.

---

### Step 2: Classify the Disruption Type

Each type has a distinct recovery architecture. Applying the wrong protocol to the wrong disruption type is the most common reason recovery plans fail.

**Type A -- Resolved External Disruption:**
A temporary event broke the routine and is now over. Illness, travel, house guests, work deadline, holiday period, moving day. The environment has returned to baseline.
- Recovery mechanism: The environmental cues still exist. The habit loop is intact. Recovery is about re-engaging the cue chain, not rebuilding it.
- Timeline: 10-17 days to full restoration
- Risk: Attempting to jump to pre-break level immediately (over-correction). Prevent by enforcing MVH for the first 3-5 days regardless of energy level.

**Type B -- Ongoing Environmental Change:**
The disruption created a permanent new context. New job with different hours, new city without the old gym, new baby, retirement, or major illness. The old habit's triggers, anchors, and environmental supports no longer exist.
- Recovery mechanism: The habit behavior may be preserved, but the entire cue-routine-reward loop must be redesigned around new environmental anchors. Implementation intentions must be rebuilt from scratch: "When [new trigger], I will [habit behavior] at [new location]."
- Timeline: 3-5 weeks minimum; expect false starts
- Risk: Trying to transplant the old routine into a new context without redesigning the triggers. This produces effort without engagement.

**Type C -- Motivation Fade (Gradual Erosion):**
No identifiable external event. The habit quietly dissolved over weeks. "I just stopped one day and never started again." Common after a habit reaches the 3-month mark and the novelty effect ends.
- Recovery mechanism: Before rebuilding, determine if the habit is still aligned with current goals. If yes: restart with minimum viable version and re-anchor to a clear "why" statement. If no: consider whether the habit has completed its purpose or was never genuinely valued.
- Timeline: 14-21 days, with an explicit values-alignment check at Day 7
- Risk: Restarting a habit that was never genuinely valued and will fade again within weeks. Address this directly.

**Type D -- Collapse from Overcommitment:**
The user tried to do too much, too perfectly, or too many habits simultaneously. The entire system became unsustainable and crashed. Common after aggressive New Year's commitments, post-vacation "fresh start" bursts, or external accountability challenges that ended.
- Recovery mechanism: Radical simplification. Identify the single most impactful habit. Everything else is secondary. The system must become easier than the previous version, not equivalent to it. Add complexity only after 21 consecutive days of the simplified system.
- Timeline: 4-6 weeks with deliberately slow progression
- Risk: The user re-adds complexity too quickly because the simplified version feels insufficient. Enforce the 21-day stability rule before adding any second habit.

**Type E -- Identity Shift (Advanced Classification):**
The disruption was not the habit break -- the disruption was a change in self-concept. "I used to be the kind of person who ran. Now I don't think of myself that way." Common after major life transitions, grief, illness, or achievement of the original goal. This is distinct from motivation fade because it involves identity, not just motivation.
- Recovery mechanism: Before addressing the behavior, address the identity. Use the identity statement reframing technique: "I am a person who [behavior]" rather than "I am trying to do [behavior]." Recovery starts with two or three small actions that reconfirm the identity before scaling the behavior.
- Timeline: This varies widely -- identity shifts take longer than behavioral resets. Do not rush.
- Risk: Treating this as a simple behavioral restart. The behavior will not stick if the identity has not been re-anchored.

---

### Step 3: Build the Minimum Viable Habit (MVH) Framework

The MVH is the most important single element of the recovery plan. It is not a reduced version of the full habit -- it is the absolute floor, designed to preserve the cue-response link when full execution is impossible.

**MVH design rules:**
- Must be completable in under 2 minutes with zero preparation
- Must require no special equipment, location, or conditions
- Must contain the core trigger element of the full habit (putting on running shoes is the trigger for running; opening the notes app is the trigger for journaling)
- Must be so easy that doing it during illness, travel, exhaustion, or emotional difficulty requires no decision-making
- The MVH is NOT a "lazy day option" -- it is a structural safety mechanism. Doing the MVH on a hard day is not failure; it is expert-level habit maintenance.

**MVH examples by habit type:**

| Habit | Full Version | MVH |
|-------|-------------|-----|
| Running | 5K run, 3x/week | Put on running shoes, walk outside for 2 minutes |
| Meditation | 20-minute guided session daily | Sit in meditation position, take 3 conscious breaths |
| Journaling | 500-word morning journal daily | Open journal, write one sentence about the current moment |
| Nutrition tracking | Log all meals in app daily | Log breakfast only |
| Strength training | 45-minute gym session, 4x/week | 5 pushups and 5 squats, anywhere, no equipment |
| Reading | 30 minutes of nonfiction daily | Read one page |
| Sleep hygiene | 10:30 PM lights out, phone off, no screens 1 hour prior | Set phone to Do Not Disturb at 10:30 PM |
| Cold shower | 90-second full-cold shower daily | 10-second cold blast at end of normal shower |

---

### Step 4: Build the Recovery Timeline

The recovery timeline is graduated to prevent the two most common restart failure modes: (1) attempting full restoration on Day 1, which causes re-burnout within 3-7 days, and (2) staying at MVH level indefinitely, which prevents full habit re-establishment.

**Standard Recovery Timeline (4-week, Medium Break):**

| Phase | Duration | Effort Level | Frequency | Key Instruction |
|-------|----------|--------------|-----------|-----------------|
| Restart | Days 1-5 | MVH only (20-30% of full) | Every scheduled day | No exceptions up; hold the floor |
| Rebuild | Days 6-12 | 50% of full version | Every scheduled day | Add duration/intensity, not frequency |
| Strengthen | Days 13-19 | 75% of full version | Every scheduled day | One optional step toward full level |
| Restoration | Days 20-28 | 90-100% of full version | Pre-break schedule | Evaluate sustainability; adjust if needed |

**Micro-slip Protocol (1-3 day break):**
- Day 1: Resume at full level immediately. Micro-slips do not require graduated recovery -- they require immediate re-engagement to prevent slip from expanding into break.
- No timeline needed. Do today's habit today.

**Short Break Protocol (4-14 day break):**
- Days 1-3: MVH only
- Days 4-7: 50% of full version
- Days 8-14: Full version

**Extended Break Protocol (60+ day break):**
- Week 1: MVH only, every day (including non-habit days, to rebuild the identity)
- Week 2: 30% of full version, original schedule
- Week 3: 50-60% of full version
- Week 4: 75% of full version
- Week 5+: Full restoration, evaluate anchoring

**Critical progression rule:** Never skip a phase to accelerate. If the user skips the MVH phase because they "feel great," they are spending stored motivation, not building habit momentum. The neurological encoding of a habit happens through repetition of the cue-routine-reward cycle, not through effort level. 10 days of MVH workouts does more for habit restoration than 3 days of maximal effort followed by 7 days of paralysis.

---

### Step 5: Design the Disruption Prevention Architecture

Recovery without prevention planning recreates the conditions for the same break. The prevention architecture has four components:

**Component 1: Early Warning System**
Define specific, observable behavioral signals that indicate a break is beginning. These must be concrete behaviors, not feelings.

Standard warning signs to customize for each habit:
- Missed 2 consecutive scheduled days without illness or travel (the "two-miss rule" -- one miss is normal; two misses is a pattern requiring intervention)
- Using postponement language internally: "I'll make it up this weekend," "tomorrow I'll do double," "I'll start fresh Monday"
- Habit materials becoming inaccessible (gym bag buried, running shoes in the closet, journal under other books) -- physical inaccessibility is a leading indicator of behavioral avoidance
- Habit is removed from the daily schedule mentally even while nominally "still doing it"
- Completion rate drops below 50% of scheduled days in a given week

**Component 2: Pre-Built Disruption Routines**
For each predictable disruption type the user faces (travel, illness, high-stress work periods, seasonal changes), build a specific reduced-but-active routine in advance. Pre-building removes the decision-making burden during high-stress periods, which is when decision fatigue most reliably collapses habits.

Principle: "I have already decided what I will do when I travel. I do not need to think about it."

**Component 3: The Two-Miss Intervention Rule**
After two consecutive missed days, trigger an automatic, pre-planned intervention. Do not wait until the break feels "long enough" to address. The two-miss rule prevents the common pattern where a 2-day miss becomes a 2-week break because the person was waiting for the "right time" to restart.

Intervention script after two misses: "Two misses. Today I do the MVH. Tomorrow I assess whether I'm back on track or need to run the recovery protocol."

**Component 4: Scheduled Habit Audits**
A weekly 5-minute habit audit on a fixed day. Not a lengthy review -- a rapid status check:
- Did I complete my core habit this week? (Yes/No/Partial)
- If no or partial, what happened?
- What is my specific action plan for tomorrow?

The audit is on the calendar as a recurring appointment. It is not optional during disrupted periods -- this is when it is most valuable.

---

### Step 6: Address the Emotional Architecture

Guilt, shame, and resignation are not motivation problems -- they are cognitive distortions that specifically impair restart behavior. Each requires a distinct intervention.

**Guilt** ("I should have done better"):
- Guilt is action-oriented and can be redirected productively.
- Replacement script: "I stopped for [X days/weeks]. That is information, not a judgment. I am starting today because I want the benefits of this habit, not to compensate for stopping."
- Cognitive reframe: The break does not cancel the work already done. 90 days of exercise before a 3-week break does not become zero. The fitness base, the neural encoding, and the self-knowledge from 90 days of practice are permanent gains.

**Shame** ("I am someone who can't maintain habits"):
- Shame is identity-level -- more damaging and more resistant than guilt.
- Do not address the habit first. Address the identity claim directly.
- Replacement script: "Stopping for a period of time is a behavior, not a character trait. People who maintain habits long-term are not people who never stop -- they are people who restart consistently."
- Evidence technique: Ask the user to name 2-3 habits they have successfully maintained over 6+ months at any point in their life. This disconfirms the "I can't maintain habits" identity claim with their own evidence.

**Resignation** ("There's no point -- I'll just stop again anyway"):
- Resignation is learned helplessness applied to habit behavior. It often signals repeated failed restarts.
- Do not push through resignation with motivational language -- it will not work.
- First step: Validate. "It makes sense that you feel that way -- you have tried to restart before and it didn't hold. That is a real pattern worth understanding."
- Second step: Investigate the structural cause (see repeated restart cycles in Edge Cases).
- Third step: Redesign the habit to be significantly simpler than previous versions.

**The Fresh Start Effect -- when to use it:**
Research by Hengchen Dai, Katherine Milkman, and Jason Riis demonstrates that temporal landmarks (Monday, first of the month, first day after a birthday, new year, beginning of a new season) increase the psychological separation between the "old self" who stopped and the "new self" who is starting. Use this strategically:
- If a natural landmark is within 3 days, wait for it to capitalize on the motivational lift
- If the nearest landmark is more than 5 days away, start today and don't wait -- the "wait for Monday" pattern extends breaks by an average of 3-4 days with no behavioral benefit
- Never use the fresh start effect as justification for delaying restart by more than 3 days

---

### Step 7: Build the Post-Recovery Evaluation Framework

At the end of the recovery timeline (typically Week 3 or Day 21), conduct a structured evaluation. This is not a celebration -- it is a systems audit.

**Evaluation questions:**
1. Did the recovery timeline match reality, or did it need to be faster/slower?
2. Was the MVH actually performable on the hardest days? If not, it was not simple enough -- redesign it.
3. What caused the original break, and has that cause been addressed structurally? Or is it still present?
4. Is the habit still aligned with current goals? Would an outside observer say this habit is serving the user's life right now?
5. What is the next most likely disruption, and is there a pre-built routine for it?
6. Are there any "debt" beliefs remaining (guilt, shame, resignation) that might undermine the next phase?

**Write the next disruption plan before closing out the recovery.** This is the most skipped step and the most important one -- the user is more motivated to prevention-plan immediately after recovering from a break than at any other time.

---

### Step 8: Apply Habit Identity Anchoring

Identity-based habit theory, articulated in behavioral research and popularized by James Clear's identity-based habit framework, holds that sustainable habits are attached to self-concept rather than outcomes. Apply this throughout the recovery plan:

- Reframe every recovery action as identity confirmation, not goal pursuit: "I did a 10-minute walk today. That is what people who exercise do."
- Provide an explicit identity statement for the user to use: "I am a person who [habit behavior], even on hard days."
- Use behavioral voting language: Every time the user completes even the MVH, they cast a vote for the identity. Every vote counts regardless of the effort level of that day's action.
- Caution: Do not overuse identity language early in the recovery if the user is in a shame state -- attaching identity to a fragile new behavior before it is stable can increase shame when the next slip occurs. Introduce identity language after 7-10 consecutive days of MVH completion.

---

## Output Format

```
## Habit Recovery Plan

**Habit(s) Being Recovered:** [specific behavior, not category]
**Pre-Break Habit Maturity:** [established (66+ days) / developing (under 66 days)]
**Break Duration:** [X days/weeks/months]
**Disruption Type:** [A: Resolved External / B: Ongoing Environmental / C: Motivation Fade / D: Overcommitment Collapse / E: Identity Shift]
**Recovery Start Date:** [today or specific date]
**Emotional State at Restart:** [guilt / shame / resignation / neutral / motivated -- and primary framing strategy]

---

### Minimum Viable Habit (MVH) Definition

| Habit | Full Version | MVH (Floor -- Never Go Below This) |
|-------|-------------|-------------------------------------|
| [habit name] | [full description: duration, intensity, frequency, location] | [under-2-min, zero-equipment, zero-decision version] |

**MVH Rule:** On any day when full execution is impossible, the MVH counts as a complete day. The MVH is not failure -- it is expert-level disruption management.

---

### Recovery Timeline

| Phase | Days | What to Do | Effort Level | Key Constraint |
|-------|------|-----------|--------------|----------------|
| Restart | Days 1-5 | [MVH description] | 20-30% of full | No escalation above MVH this phase |
| Rebuild | Days 6-12 | [50% version description] | ~50% of full | Add intensity, not frequency yet |
| Strengthen | Days 13-19 | [75% version description] | ~75% of full | One optional step up toward full level |
| Restoration | Days 20-28 | [full habit description] | 90-100% | Evaluate sustainability at Day 28 |

**Override rule for micro-slips (1-3 days only):** Skip the timeline. Resume full habit today.

---

### Disruption Prevention Architecture

**Two-Miss Early Warning System:**
After 2 consecutive missed scheduled days, trigger this response immediately:
> "[specific self-prompt language tailored to this user's habit and emotional patterns]"

**Warning Signs -- Watch for These:**
1. [observable behavioral signal 1]
2. [observable behavioral signal 2]
3. [observable behavioral signal 3]
4. [observable behavioral signal 4]

**Pre-Built Disruption Routines:**

| Disruption Type | Normal Version | Pre-Built Reduced Version | Emergency Minimum |
|----------------|---------------|--------------------------|-------------------|
| [relevant disruption 1] | [full habit] | [reduced but complete] | [MVH] |
| [relevant disruption 2] | [full habit] | [reduced but complete] | [MVH] |
| [relevant disruption 3] | [full habit] | [reduced but complete] | [MVH] |

**Weekly Habit Audit (every [specific day], [specific time], [specific place]):**
Three questions only:
1. Did I complete my core habit this week? [Yes / Partial / No]
2. If no or partial: what specifically happened on the days I missed?
3. What is my plan for tomorrow? [Specific action, time, and location -- not a general intention]

---

### Emotional Reset Protocol

**Primary emotional pattern identified:** [guilt / shame / resignation]

**Current distorted thought:** "[the specific thought the user expressed or implied]"

**Replacement thought:** "[specific replacement with real content -- not generic encouragement]"

**Identity anchor statement:** "I am a person who [behavior], even on hard days. Today I proved that by [doing the MVH / returning to the habit]."

**Evidence disconfirmation (for shame only):**
Name two habits you have successfully maintained for 6+ months at any point in your life:
1. _______________
2. _______________
This is evidence that you are capable of maintaining habits. The current break is behavior, not identity.

---

### Post-Recovery Evaluation (Complete at Day 21 or End of Restoration Phase)

1. Did the graduated timeline work? What would I adjust for next time?
2. Was the MVH simple enough to do on my worst days? (If no: redesign it to be simpler.)
3. What originally caused the break -- and is that cause structurally resolved?
4. Is this habit still serving my current goals?
5. What is the next most likely disruption, and have I pre-built a routine for it?
6. Write the next disruption plan now: [specific plan for the next anticipated disruption]

---

### Recovery Progress Tracker (Optional)

| Week | Days Completed | MVH Days | Full Days | Notes |
|------|---------------|----------|-----------|-------|
| Week 1 | /[X scheduled] | | | |
| Week 2 | /[X scheduled] | | | |
| Week 3 | /[X scheduled] | | | |
| Week 4 | /[X scheduled] | | | |
```

---

## Rules

1. **Never frame a habit break as failure, laziness, or lack of willpower.** Habit breaks are disruptions to an environmental system, not character defects. The language throughout the plan must reflect this: "You stopped for 3 weeks" not "you failed for 3 weeks." Every sentence matters because the user's emotional state will determine whether they implement the plan at all.

2. **Always enforce the graduated recovery timeline -- no exceptions for high motivation.** The most common cause of repeated restart failure is attempting full restoration on Day 1. High motivation on restart day is a poor predictor of Day 4 behavior. The timeline exists specifically because the user cannot predict their motivation in 4 days. Build the system for low-motivation days, not high-motivation days.

3. **The MVH must meet all three criteria: under 2 minutes, zero preparation, zero equipment.** An MVH that requires a gym, a specific app, good weather, or emotional readiness will fail during disruptions -- exactly when it is needed most. If you cannot do it sick, exhausted, traveling, and emotionally depleted, it is not a true MVH.

4. **Never recommend compensation for missed days.** "I'll do double tomorrow" and "I'll make up the 10 days I missed" are forms of psychological punishment that increase the emotional cost of imperfection and accelerate burnout cycles. Recovery starts today; missed days are not debt.

5. **Always include a "drop it" option alongside the recovery plan.** Not every disrupted habit deserves recovery. If the user does not spontaneously express missing the habit's benefits -- only guilt about the break -- this is a signal the habit was serving a "should" rather than a genuine goal. Explicitly give the user permission to close the habit intentionally rather than letting it fade through repeated failed restarts.

6. **Address the specific emotion present, not a generic pep talk.** Guilt, shame, and resignation require distinct interventions. Applying motivational language to a shame state makes it worse. Applying evidence-disconfirmation to a guilt state is unnecessary. Identify which emotion is primary and apply the correct protocol from Step 6.

7. **If the user describes 3 or more failed restart attempts in 6 months with significant distress, do not produce another standard recovery plan.** Instead, investigate the structural cause: Is the habit too complex? Does it require environmental conditions that are chronically unavailable? Is the user's baseline capacity (sleep, stress, load) incompatible with the habit as designed? Redesign the habit to be fundamentally simpler before building another recovery plan around the same design that has failed repeatedly.

8. **Never allow a Type B (ongoing environmental change) plan to target the old full-version habit.** The old routine's anchors no longer exist. Designing a recovery plan back to the old full version is designing around an environment that is gone. The plan must redesign the habit for the new environment, using new triggers, new locations, and new timing.

9. **The two-miss rule is non-negotiable in the prevention plan.** One miss is noise; two consecutive misses is a pattern. The intervention must be automatic and pre-planned, not reactive. The user should have a written response to two misses before they occur, not after.

10. **Do not produce a recovery plan that covers more than 3 habits simultaneously.** Recovery plans covering 5 or more habits are overcommitment plans -- they recreate the conditions of Type D collapse. If the user has disrupted multiple habits, sequence them: identify the highest-impact, lowest-effort habit first, stabilize for 14-21 days, then add the next. More than 3 habits in one recovery plan is a liability, not an asset.

11. **Use the fresh start effect strategically, not as justification for delay.** If the user is 4+ days from the nearest temporal landmark (Monday, first of month), do not suggest waiting. The average "wait for Monday" delay extends breaks by 3-4 additional days. Start today. If a landmark is within 2-3 days and the user is in an emotional state where the reset would genuinely help them, the brief wait is acceptable.

12. **Never use the word "streak" as a primary motivator in the recovery plan.** Streak-based motivation creates brittle habits -- a single break destroys the motivator. If the user mentions streak tracking, validate the usefulness of tracking while reframing the metric: track consistency rate (percentage of scheduled days completed in the last 4 weeks) rather than consecutive days. A 75% completion rate over 4 weeks is a sustainable habit. A 100-day streak followed by a 60-day break is not.

---

## Edge Cases

### Edge Case 1: The User Has Been Off the Habit for Months and Shame Is the Primary Barrier

When a user has been away from a habit for 2-6 months, the emotional weight of the break often exceeds the behavioral challenge of restarting. The user may say things like "I don't even know why I stopped" or "I feel like such a failure" or "I can't believe I let it get this bad."

**Handling protocol:**
- Do not produce the full recovery plan in the first response. The emotional architecture must be addressed before the behavioral plan will land.
- Session 1: Emotional reset only. Use the shame-specific intervention from Step 6. Ask for the two-habit evidence disconfirmation. Provide the identity reframe. End with one instruction: "For the next 3 days, do only the MVH. Nothing more."
- Session 2 (after 3 days): Check in on how the MVH days went. If the user completed any of the 3 days, build the full recovery timeline from that success point.
- Do not use a fresh start date for shame-driven paralysis -- it extends the break. "Starting today" is specifically important here because immediate action is the fastest route out of shame.

### Edge Case 2: The Disruption Is Ongoing and Open-Ended (New Baby, Chronic Illness, Caregiving)

The user is asking how to "get back to normal" when there is no return to the previous normal in the near term.

**Handling protocol:**
- Do not design a recovery-to-full plan. That plan will fail within days because the conditions for full execution do not exist.
- Design a "maintenance mode" version of the habit that is explicitly labeled as the current standard, not a temporary reduced version. "For this period of your life, this IS your habit."
- The maintenance mode version is built around the highest-priority constraints: available time (often 5-10 minutes maximum), available energy (often depleted), and available location (often home-bound).
- Set explicit expectations: "When this period changes, we will redesign the habit for the new context. Right now, the goal is continuity -- maintaining any version of this habit prevents the complete restart problem later."
- Recovery timelines are not applicable in this scenario. Replace the recovery timeline with a maintenance audit: a simple weekly check that the maintenance mode habit is still being done.

### Edge Case 3: The User Wants to Restart 5 or More Habits After a System Collapse

After a period of high stress, illness, or life disruption, users sometimes want to restart everything at once. "I stopped exercising, meditating, eating well, journaling, and reading. I need to get everything back."

**Handling protocol:**
- Acknowledge that all of these habits were important and will be rebuilt. But not simultaneously.
- Apply the prioritization framework: Ask the user which single habit, if restored, would have the most positive impact on their wellbeing and would make the other habits easier to restart. This is almost always the habit that affects energy and mood (typically sleep schedule, exercise, or a morning anchor habit).
- Restart one habit only. Build the full recovery plan for that habit.
- The explicit timeline for adding the second habit: after 14-21 consecutive days of the first habit meeting or exceeding MVH level.
- Add habits one at a time, never two simultaneously.
- Explain the mechanism: "The conditions that caused the system collapse are probably still partially present. Adding multiple habits to a recovering system overloads it before it is stable. You built these habits one at a time. You will rebuild them one at a time."

### Edge Case 4: The User Broke a Streak and Is Fixated on the Lost Number

The user has had a long streak (30 days, 100 days, 365 days) and is expressing disproportionate grief or anger over the broken number rather than discussing the habit itself.

**Handling protocol:**
- Validate the significance of the streak as a motivational tool. It represented real work and real consistency.
- Then separate the streak from the practice: "The streak was a counter for something real -- the actual days you [did the habit]. You did those days. The counter resetting to zero does not undo them. The fitness, the knowledge, the identity confirmation from those days are yours."
- Shift the tracking metric: Instead of consecutive days, track weekly completion rate (X out of Y scheduled days per week). This metric rewards consistency without the catastrophic reset mechanic of streaks.
- Suggest a 2-week moratorium on streak tracking during recovery. Tracking during recovery introduces a new performance anxiety before the habit is stable.
- If the user's primary motivation was the streak rather than the habit's benefits, this is a Type C or Type E disruption (motivation fade or identity shift) -- address that classification, not just the behavioral restart.

### Edge Case 5: The User Describes a Repetitive Cycle of Build-Break-Build-Break

Three or more cycles of building a habit and losing it within 6-12 months, with the user expressing frustration or resignation about the pattern.

**Handling protocol:**
- Do not produce another standard recovery plan. The current habit design has failed to account for the user's actual life conditions.
- Conduct a root cause analysis: At what point in the cycle does the break typically occur? After 2-3 weeks (complexity was too high from the start)? After 2-3 months (novelty effect ended and the habit was never embedded in identity or environment)? During a specific recurring disruption (seasonal, work cycle)?
- Redesign the habit to be significantly simpler than any previous version. The MVH for this person may need to become the standard version for 3-6 months before building up.
- Investigate whether a genuine conflict exists between the habit and the user's actual schedule, energy level, or life priorities. Sometimes a habit cycles because the person's life has not had room for it and they have not acknowledged that.
- If the user describes the cycle with significant emotional distress (hopelessness, self-blame that is pervasive rather than habit-specific, disrupted sleep or mood alongside the habit cycling), gently note that speaking with a licensed mental health professional may help identify patterns that extend beyond habit design.

### Edge Case 6: The Break Was Healthy -- the User Was Overtraining, Over-Tracking, or Compulsively Practicing

A user reports stopping a habit -- exercise, meditation, calorie tracking, journaling -- and the description of the "full version" before the break reveals compulsive or harmful levels of engagement: 2-hour daily workouts that felt mandatory rather than chosen, anxiety when skipping any day of tracking, inability to eat without logging, or meditation sessions that extended because stopping felt dangerous.

**Handling protocol:**
- Do not produce a recovery plan that returns the user to the pre-break version. Validate the break explicitly: "It sounds like your relationship with this habit became distressing rather than supportive. Stopping may have been self-protective."
- Help the user design a fundamentally different version of the habit with built-in rest, explicit upper limits, and permission-to-skip structures built into the design from the start.
- If the user describes persistent difficulty moderating the behavior -- inability to exercise "normally," anxiety when not tracking, distress around food -- this exceeds habit planning. Refer directly to a registered dietitian (nutrition habits), a licensed mental health professional (compulsive behaviors), or a sports medicine professional (exercise). Do not attempt to habit-design around clinical-level compulsion.

### Edge Case 7: The User Explicitly Does Not Want to Restart the Habit

The user says: "I keep feeling like I should restart [habit], but honestly I don't miss it. I just feel guilty that I stopped."

**Handling protocol:**
- Do not produce a recovery plan. The user is describing a completed or misaligned habit, not a disrupted one.
- Validate the information the break provided: "The fact that you do not miss the habit -- only the feeling that you 'should' be doing it -- is useful information. It suggests the habit was serving someone else's expectations or a past version of your goals, not your current ones."
- Help the user close the habit intentionally: "Instead of letting it fade with guilt attached, you can make a conscious decision: 'I am choosing not to continue this habit because [reason]. If my goals or circumstances change, I can revisit it.' This replaces the ongoing low-level guilt with a deliberate choice."
- An intentional stop is not the same as failure. Some habits have served their purpose and completion is appropriate.

---

## Example

**Input:** "I was doing a morning routine for 5 months -- 20-minute meditation, 30-minute workout, and 10-minute journaling every weekday. I got really sick with pneumonia 6 weeks ago and was in bed for 2 weeks. Since I recovered I just haven't been able to get it back. I feel like I'm a different person now and the routine feels impossible. I've tried starting twice and lasted 3 days each time before stopping. I feel ashamed about it."

---

## Habit Recovery Plan

**Habits Being Recovered:** Morning meditation (20 min daily), weekday workout (30 min daily), morning journaling (10 min daily)
**Pre-Break Habit Maturity:** Established -- 5 months (well beyond the 66-day automaticity threshold; strong neural encoding)
**Break Duration:** 6 weeks total (2 weeks illness + 4 weeks inactivity with two failed restarts)
**Disruption Type:** Type A (Resolved External -- pneumonia) with Type E elements (Identity Shift -- "I feel like a different person now")
**Recovery Start Date:** Today
**Emotional State at Restart:** Shame + resignation (two failed restarts present) -- requires emotional architecture before behavioral protocol
**Complexity Note:** Three habits simultaneously is at the maximum; strict sequencing and simplification apply

---

### First: The Emotional Reset (Complete Before Starting the Recovery Plan)

**Shame is present. Address this before looking at any timeline.**

**The thought you're having:** "I've tried twice and failed. I'm a different person now. The routine that worked before doesn't work for me anymore."

**What is actually true:**

You built a 5-month established morning routine. That is not a small achievement -- that is a deeply encoded habit system. Pneumonia is one of the most physiologically exhausting illnesses an otherwise healthy person can experience; 6 weeks of difficulty returning to baseline after pneumonia is medically normal, not a personal failure. The two 3-day restarts were not failures -- they were attempts made before your system was ready and before you had a graduated protocol. Now you have one.

**The shame reframe:** "Stopping for 6 weeks is something that happened to my routine. It is not evidence of who I am. I maintained this routine for 5 months before getting seriously ill. The person who built 5 months of habit is the same person who is reading this plan. I am not starting over as a different person. I am restarting as someone with 5 months of habit history in my nervous system."

**Evidence disconfirmation -- your assignment before anything else:**
Name two habits you successfully maintained for 6+ months at any point in your life. They do not need to be formal habits. (Brushing teeth, showing up to work, calling a family member, any consistent behavior.) Write them down. This is proof that you are a person capable of maintaining habits. The pneumonia break does not erase that.

**Identity anchor:** "I am a person who has a morning routine. Right now I am rebuilding it after a serious illness. That is different from being a person who doesn't have a morning routine."

---

### Minimum Viable Habits (MVH) -- Your Non-Negotiable Floor

| Habit | Full Version | MVH (Floor -- Do This When Nothing Else Is Possible) |
|-------|-------------|------------------------------------------------------|
| Meditation | 20-min guided session, every weekday morning | Sit in your usual meditation spot. Take 5 conscious breaths. That's it. |
| Workout | 30-min workout, every weekday morning | 5 pushups + 5 bodyweight squats + 5 lunges. No equipment, no gym, no warm-up required. Pajamas acceptable. |
| Journaling | 10-min morning journal entry | Open your journal. Write one sentence: what you notice right now. |

**Why these matter:** The MVH is not a lesser version of the habit -- it is the cue-response link firing. Your brain has 5 months of morning routine encoding. These MVHs activate that encoding with almost no activation energy. You are not starting from zero. You are rebooting a system that already knows how to run.

---

### Recovery Timeline -- Sequenced for Three Habits

**Critical rule:** Because you have three habits and have had two failed restarts, this recovery uses sequenced re-introduction. Starting all three simultaneously on Day 1 recreated the original collapse pattern in your two previous attempts.

**Phase 0: Emotional Reset (Days 1-3 -- Before the Full Protocol)**
- Do only this: Meditation MVH each morning. Nothing else from the routine.
- Purpose: Prove to yourself that restart is possible before adding complexity.
- Three mornings of a 5-breath sit is your foundation for everything that follows.

**Phase 1: Restart -- Meditation Only (Days 4-10)**

| Day | Meditation | Workout | Journaling |
|-----|-----------|---------|------------|
| Days 4-10 | MVH only (5 breaths → build to 5 minutes by Day 10) | Not started yet | Not started yet |

- Hold the floor on meditation. Build duration gradually: 5 breaths (Day 4-5) → 3 minutes (Day 6-7) → 5 minutes (Day 8-10).
- Resist the urge to add the workout this week. The stability of one habit first is the entire strategy.

**Phase 2: Rebuild -- Add Workout (Days 11-20)**

| Day | Meditation | Workout | Journaling |
|-----|-----------|---------|------------|
| Days 11-14 | 5-10 minutes | MVH only (5 pushups, 5 squats, 5 lunges) | Not started yet |
| Days 15-20 | 10 minutes | 15-minute workout (full bodyweight circuit) | Not started yet |

- Meditation continues to build. Workout enters at MVH and steps up to 15 minutes over the first week.
- Journaling still not added. You are 2 for 3. That is the plan.

**Phase 3: Add Journaling (Days 21-28)**

| Day | Meditation | Workout | Journaling |
|-----|-----------|---------|------------|
| Days 21-24 | 15 minutes | 20-minute workout | MVH (1 sentence) |
| Days 25-28 | 15-20 minutes | 25-minute workout | 3-5 minutes |

- All three habits are now active. You are at approximately 60-75% of full version.

**Phase 4: Strengthen (Days 29-35)**

| Day | Meditation | Workout | Journaling |
|-----|-----------|---------|------------|
| Days 29-35 | 20 minutes (full) | 30-minute workout (full) | 10 minutes (full) |

- Full morning routine restored. Evaluate on Day 35.

**Note on failed restarts:** Your previous two attempts went to full restoration immediately (Day 1 at full level). This 35-day graduated protocol is built specifically to prevent the overload pattern that ended those attempts.

---

### Disruption Prevention Architecture

**Two-Miss Early Warning System:**
After 2 consecutive missed weekday mornings (not counting genuine illness), trigger this response:

> "Two misses. This morning I do 5 breaths of meditation. That is all that is required today. Tomorrow I assess whether I am back on track or need to rerun the restart phase."

Do not try to make up the missed days. Do not start a new full-routine day immediately. Fire the MVH and assess.

**Warning Signs -- Specific to Your Routine:**

1. You go two weekdays without opening your journal (physical inaccessibility is the leading indicator for journaling collapse)
2. You tell yourself "I'll do a longer workout tomorrow to make up for today" -- this is compensation thinking and it signals an overload state
3. Your meditation app shows no sessions opened in 3 consecutive weekdays
4. You skip the workout and feel relief rather than disappointment -- relief signals the habit has become an obligation rather than a practice; redesign trigger timing
5. The total morning routine starts taking 90+ minutes because you add things when you feel good -- this creates an unreachable standard that collapses during busy periods

**Pre-Built Disruption Routines:**

| Disruption | Full Morning Routine | Pre-Built Reduced Version | Emergency MVH |
|------------|--------------------|--------------------------|--------------------|
| Work travel | Full (1 hour total) | 5-min meditation + hotel room bodyweight circuit (10 min) + 3-sentence journal | 5 breaths + 5 pushups + 1 sentence |
| Illness (mild cold) | Full | Meditation only, 10 minutes; rest is recovery for workout | 5 breaths in bed |
| Illness (moderate -- flu/fever) | Full | Suspend all three. Rest is the practice. Return to Phase 0 protocol after 72 hours symptom-free. | Rest |
| Late night before (under 6 hours sleep) | Full | Meditation 5 min only. Skip workout to protect recovery. Journal 1 sentence. | 5 breaths |
| Major work deadline (2-3 day crunch) | Full | 5-min meditation + journal 1 sentence. Workout becomes afternoon walk. | 5 breaths + 1 sentence |

**Weekly Habit Audit (every Friday evening, 5 minutes, at your desk before closing your computer):**
1. Did I complete my morning routine this week? How many of 5 weekdays?
2. If fewer than 3: what happened on the missed days? What specifically changed?
3. What is my plan for Monday morning? (Write a specific time and the first action: "6:30 AM, sit on the meditation cushion, set a 5-minute timer.")

---

### Emotional Reset Protocol

**Primary pattern:** Shame + resignation (two failed restarts amplified shame into "I can't do this")

**The thought to replace:** "I feel like a different person. The routine that worked before doesn't work for me anymore. I've tried twice and stopped both times."

**Replacement thought:** "I built 5 months of morning routine before getting seriously ill. My nervous system knows this routine. The two 3-day attempts were made before I had a graduated protocol -- I was trying to restart at full load, which is the fastest way to stop again. Today I am starting differently: 5 breaths only. That is the entire plan for today. Tomorrow I do 5 breaths again. My body knows how to do a morning routine. I am reminding it, not re-teaching it."

**Identity anchor statement:** "I am a person who has a morning routine. I am rebuilding it after a serious illness. Today I proved that by sitting down and taking 5 breaths."

**For the resignation specifically:**
Your two previous restarts were not evidence that recovery is impossible -- they were evidence that the approach was wrong. Jumping to full restoration after a 6-week break consistently fails in the first 3-7 days. You were not failing; you were using the wrong protocol. This plan is built differently. Give it the 35 days before drawing conclusions.

---

### Post-Recovery Evaluation (Complete on Day 35)

1. Did the 35-day graduated timeline match your actual experience, or did you need to go slower/faster in any phase?
2. Was the meditation MVH (5 breaths) simple enough to do on your worst days? If not: what would a simpler version look like?
3. The original break was pneumonia -- an event with no predictability and no prevention. What is your specific plan the next time you are seriously ill? (Write it now: "If I am ill for more than 3 days, I will go to Phase 0 -- meditation MVH only -- for 3 days after I am 72 hours symptom-free. Then I will rerun the restart protocol.")
4. Is the 1-hour morning routine still aligned with your current life? If the 5-month version felt unsustainable before pneumonia, this is the time to redesign it at a level that can survive your actual schedule.
5. Are there any residual shame or resignation thoughts present? If yes, return to the emotional reset section -- these need to be cleared before the next disruption cycle, not stored.
6. **Write your next disruption plan before closing this evaluation.** The most valuable prevention planning happens immediately after a successful recovery, not before the next break.

---

### Recovery Progress Tracker

| Week | Meditation | Workout | Journaling | Notes |
|------|-----------|---------|------------|-------|
| Week 1 (Days 1-7) | /5 (MVH) | -- | -- | Phase 0 + Phase 1 start |
| Week 2 (Days 8-14) | /5 | /5 (MVH) | -- | Phase 2 start |
| Week 3 (Days 15-21) | /5 | /5 | /5 (MVH) | Phase 3 start |
| Week 4 (Days 22-28) | /5 | /5 | /5 | Phase 3 full |
| Week 5 (Days 29-35
