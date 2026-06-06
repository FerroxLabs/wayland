---
name: trigger-identification
description: |
  Conducts a structured cue-routine-reward analysis to identify the triggers behind unwanted habits and the rewards those habits provide. Gathers the user's target habit and context, then produces a trigger analysis worksheet, pattern map, and substitution plan with healthier routines that deliver the same reward.
  Use when the user asks about understanding why they do a bad habit, identifying habit triggers, breaking a habit loop, cue-routine-reward analysis, or understanding behavior patterns.
  Do NOT use for addiction assessment or treatment, clinical behavior analysis, or substance dependency.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness goal-setting habits emotional-health"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Trigger Identification

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- The user asks why they keep doing an unwanted habit and wants a structured explanation -- specifically when they describe a behavior that feels automatic, hard to resist, or context-dependent ("I always do X when Y happens")
- The user wants to identify the specific triggers behind a repeating behavior: nail-biting, stress eating, doom-scrolling, procrastinating, venting to the wrong person, impulse buying, cigarette breaks beyond their stated goal, or late-night snacking
- The user explicitly asks for a cue-routine-reward analysis, habit loop breakdown, ABC (Antecedent-Behavior-Consequence) mapping, or wants to understand "what function this behavior serves"
- The user has already tried willpower-based approaches (telling themselves to "just stop," using app blockers, making rules they break within days) and those strategies have repeatedly failed -- this signals that they are not addressing the underlying trigger
- The user wants to design a replacement behavior and needs to first understand what need the current behavior is meeting before they can select an equivalent substitute
- The user describes a specific habit they want to break before building a new one, or wants to audit their existing behavior patterns to understand what sustains them
- The user wants to prepare for a high-risk situation -- a social event, stressful work period, or emotional season -- and wants to anticipate and pre-plan for likely triggers

**Do NOT use when:**
- The user describes a substance they feel physically dependent on, uses the words "withdrawal," "can't function without," or describes physical symptoms when they stop -- refer to a licensed addiction specialist or healthcare provider; use no other skill from this library as a substitute
- The user's language suggests a clinical compulsion that has persisted despite professional attempts at change -- phrases like "I've been in therapy for years for this," "my psychiatrist said," or "I've been hospitalized for this behavior" signal a clinical context beyond this skill's scope
- The user wants to BUILD a new positive habit from scratch with no pre-existing behavior to analyze -- use `habit-stacking-framework` instead, which addresses habit formation rather than habit loop deconstruction
- The user wants to track progress on a habit change they have already diagnosed and planned -- use `behavior-change-tracking` for ongoing monitoring
- The user describes an eating pattern that involves bingeing followed by compensatory behaviors (restriction, excessive exercise, purging) -- this pattern may indicate a clinical eating disorder and warrants referral to a registered dietitian and/or licensed mental health professional
- The user is asking about someone else's behavior to change that person -- trigger analysis requires first-person self-observation data; it cannot be done by proxy
- The user wants a full productivity or time management system, not just habit analysis -- use `time-blocking-design` or `task-prioritization-matrix` as appropriate

---

## Process

### Step 1: Gather the Target Habit with Precise Specificity

Before any analysis begins, the habit description must be concrete enough to be observed. Vague habits ("being on my phone too much," "eating badly," "wasting time") cannot be analyzed because they do not have discrete cues -- they are judgments, not behaviors.

- Ask: "Describe the moment the behavior starts -- what are you doing right before it happens?" This converts a judgment into an observable behavior with a detectable start point.
- Establish behavioral specificity: the habit should be describable as a physical action sequence. "I pick up my phone, open Instagram, and scroll for 20+ minutes" is analyzable. "Phone addiction" is not.
- Collect frequency data: how many times per day or week does this behavior occur? This establishes baseline and later confirms whether substitution is working.
- Collect duration data: how long does each episode last? Short bursts (2-5 minutes) and extended sessions (30+ minutes) often serve different rewards and require different substitutes.
- Ask whether they have tried to stop before, and specifically what happened when they tried -- the failure mode often reveals the reward more clearly than the behavior itself. If they got irritable when they stopped, the reward is likely stress relief. If they felt bored and restless, the reward is likely stimulation.
- Establish how long the habit has existed. Habits under 90 days are likely still in the formation stage and respond well to simple substitution. Habits over 2 years have deeper neural groove reinforcement and may require environment redesign in addition to substitution.

### Step 2: Map All Five Cue Categories Systematically

Charles Duhigg's research, validated across multiple behavioral studies, identifies five universal cue categories. Every habit trigger falls into at least one -- but most habits have a primary trigger category and one or two secondary contributors. Missing a category means missing the actual trigger.

Walk the user through each category explicitly, using the "last time" technique: "Think of the last time the habit happened. Now answer these for that specific moment..."

- **Location/Environment:** Where were you physically? Specific room, desk position, couch vs. bed, car, kitchen, public vs. private. Research by David Neal and Wendy Wood (2006) found that 45% of daily behaviors are performed in the same location each time -- location is the most underrated trigger category.
- **Time:** What time of day was it? Day of week? Time relative to meals, sleep, or work blocks? Time triggers are especially powerful for behavior clusters that have been repeated at consistent intervals.
- **Emotional State:** What were you feeling? Prompt with a specific emotion menu to avoid vague answers: bored, anxious, frustrated, lonely, tired, overwhelmed, sad, excited, celebratory, resentful, embarrassed. "Stressed" is too broad -- narrow to whether it is anticipatory stress (upcoming task), reactive stress (something just went wrong), or ambient stress (generalized pressure without a specific cause). Each maps to a different substitution strategy.
- **People Present:** Who was around? Specific individuals, or types of people (authority figures, strangers, close friends)? Or was the habit consistently triggered when ALONE? Social isolation as a trigger is frequently overlooked.
- **Preceding Action:** What was the last thing you did immediately before the habit started? This is often the most precise predictor -- the habit cue may not be an emotion but a specific action: closing a document, finishing a meeting, stopping physical exercise.

Rate each category from 0-3 for that occurrence:
- 0 = not a factor
- 1 = possibly relevant
- 2 = likely a trigger
- 3 = almost certainly a trigger

The category that scores 3 most consistently across 5 logged episodes is the primary trigger.

### Step 3: Decode the Reward Using the Deprivation Method

The reward is the most misidentified element of the habit loop because people confuse the object of the habit with its function. Someone who stress-eats chips is not after chips -- they may be after crunch (physical stimulation), saltiness (taste reward), the physical act of chewing (oral motor release), or the break from their desk (behavioral escape). Each of these requires a different substitute.

Use three diagnostic techniques:

**Technique 1 -- The Deprivation Question:**
"If you could NOT do the habit when the trigger hits -- the snack is unavailable, the phone is in another room, the person isn't there -- what would you feel?" The emotional answer to this question almost always reveals the reward category:
- Restless/can't focus = stimulation/novelty reward
- Anxious/wound up = stress relief/decompression reward
- Lonely/disconnected = social connection reward
- Bored/flat = entertainment/engagement reward
- Frustrated/agitated = emotional escape reward
- Hungry/empty = sensory/physical reward

**Technique 2 -- The During/After Split:**
Ask separately: "How do you feel DURING the habit?" and "How do you feel 5-10 minutes AFTER?" The during state is the actual reward being delivered. The after state is often negative (guilt, shame, time regret) but does not negate the during reward -- the brain is repeating the behavior for the during experience, not the after. This distinction is critical: if the person says "I feel terrible after," that does not mean the habit is unrewarding. It means the reward is frontloaded.

**Technique 3 -- The Reward Elimination Test:**
Ask: "Have you ever had the trigger occur and gotten the reward through a different path?" For example: "Have you ever had the 3 PM energy dip and gone for a walk instead -- did that also work?" If yes, that confirms the reward is "movement/energy reset," not "sugar" specifically. This naturally points toward viable substitutes.

### Step 4: Build the Trigger Analysis Worksheet and Log Five Episodes

Five episodes is the minimum threshold for pattern detection. Fewer than five produces coincidence, not pattern. More than ten becomes burdensome and reduces compliance.

For each logged episode, collect:
- Date and exact time
- Location (room, setting, context)
- Emotional state at the moment (use the emotion menu from Step 2)
- Who was present or whether they were alone
- The action immediately preceding the habit onset
- The exact routine performed (behavioral steps in sequence)
- Duration of the routine
- Emotional state 10 minutes after completion
- Whether the reward felt satisfied, partially satisfied, or unsatisfied

After five entries, calculate the primary trigger category score using the 0-3 rating system from Step 2. The category with the highest cumulative score across all five logs is the primary trigger.

### Step 5: Apply the Reward-Match Filter to Candidate Substitutions

This is the most technically demanding step and where most habit-change attempts fail. The substitution must satisfy the same psychological need as the original behavior. Use the following reward taxonomy to match substitutes correctly:

| Reward Category | Physiological Basis | Valid Substitutes | Invalid Substitutes |
|----------------|--------------------|--------------------|---------------------|
| Stress relief / decompression | Cortisol reduction, parasympathetic activation | Diaphragmatic breathing (5 minutes, 4-7-8 pattern), progressive muscle relaxation, cold water on wrists, 5-minute walk | Journaling (cognitively engaging, not decompressing), watching news, checking messages |
| Stimulation / novelty | Dopaminergic activation via novelty-seeking | Quick puzzle, interesting article (3-minute cap), physical movement burst (10 jumping jacks), novel music | Meditation, deep breathing (calming, not stimulating), sitting quietly |
| Social connection | Oxytocin, belonging signal | Sending a quick genuine message to a friend, 3-minute check-in call, brief in-person interaction | Passive social media scrolling (simulates connection without delivering it), solo activities |
| Physical/sensory | Oral or tactile stimulation | Chewing gum (replicates jaw movement), strong flavored tea, fidget tool, cold or hot beverage | Screen activities, sedentary quiet activities |
| Escape / avoidance | Avoidance of an aversive state | Structured micro-break with a hard time limit (5 minutes), changing physical location briefly, task-switching | Anything that extends the avoidance indefinitely -- this can reinforce procrastination loops |
| Energy / alertness | Blood glucose, adenosine clearing | Brief physical movement (increases alertness more effectively than sugar), cold water, 10-minute nap if environment allows | Caffeine if already consumed 4+ cups (diminishing returns after threshold) |

A substitution fails the reward-match test if it requires the user to tolerate a negative emotional state rather than replace it with a positive one. "Sit with the discomfort" is not a valid substitute -- it is a suppression strategy, which has a documented rebound effect (Daniel Wegner's ironic process theory: suppressed thoughts and urges resurface with greater intensity).

### Step 6: Design Two-Tier Substitutions for Every Trigger

A single substitute is fragile. Real environments are variable: time, energy, social context, and resources change. Design a two-tier substitution system for each identified trigger:

**Tier 1 -- Instant Response (under 60 seconds):**
Requires zero preparation, zero equipment, available in any location. This is the "floor" substitute -- the absolute minimum viable response when the trigger fires and conditions are limiting.
- Example: Three slow exhales (4 seconds in, 6 seconds out) -- available anywhere, no one notices, directly activates the parasympathetic system

**Tier 2 -- Full Substitute (3-10 minutes):**
The preferred response when conditions allow. Delivers the reward more completely than the Tier 1 option.
- Example: 5-minute walk outside, specific task-break activity, 3-minute mindful tea ritual

Having only a Tier 2 option creates a false choice: "I can't do my substitute right now, so I'll do the old habit." The Tier 1 option closes this loophole.

### Step 7: Run the 7-Day Substitution Test and Interpret Results

Seven days (not five) provides enough variance to account for weekly patterns. If a trigger is primarily a Monday stress response after weekend disconnection, a 5-day test starting Tuesday misses it entirely.

Each day, the user rates reward satisfaction on a 1-5 scale:
- 1 = Cravings for old habit were overwhelming; substitute provided nothing
- 2 = Substitute was tolerable but cravings persisted
- 3 = Substitute reduced cravings to manageable level; felt neutral about it
- 4 = Substitute felt genuinely rewarding; craving mostly resolved
- 5 = Substitute was preferred or the craving didn't feel strong after doing it

**Interpretation thresholds:**
- Average 4.0-5.0: Substitution is working. Reinforce with environmental design (put the substitute in the trigger location, remove barriers to Tier 2).
- Average 3.0-3.9: Partial match. The substitute is addressing part of the reward but not all of it. Likely a compound reward -- the behavior was delivering two separate rewards. Identify the unmet second reward and add a secondary substitute.
- Average 2.0-2.9: Wrong reward category. Return to Step 3 and re-run the deprivation question. The reward hypothesis was incorrect.
- Average 1.0-1.9: Either wrong reward or the trigger identification was incomplete. Return to Step 4 and log 5 more episodes looking specifically at the "preceding action" and "people present" columns, which are most often missed.

---

## Output Format

```
## Trigger Analysis: [Specific Habit Name]

> **Note:** This analysis is for personal reflection and behavioral self-awareness.
> It is not a clinical assessment. If the habit is significantly affecting your health,
> relationships, or functioning, consider speaking with a licensed mental health professional.

---

### Habit Profile

| Field | Detail |
|-------|--------|
| **Target Behavior** | [Specific observable behavior with start point] |
| **Frequency** | [X times per day / week] |
| **Duration per Episode** | [X minutes per occurrence] |
| **Habit Age** | [How long this has been a pattern] |
| **Previous Change Attempts** | [What was tried; how it failed] |
| **Baseline Distress Level** | [How much this habit currently bothers the user, 1-10] |

---

### Habit Loop Map

#### CUE (Primary Trigger)
**Trigger Category:** [Location / Time / Emotional State / People / Preceding Action]
**Specific Trigger:** [The exact cue identified from the logs]
**Secondary Triggers (if any):** [Contributing factors that amplify the primary cue]
**Trigger Strength:** [How reliably does this cue produce the habit? Always / Usually / Sometimes]

#### ROUTINE
**Behavioral Sequence:**
1. [First physical action]
2. [Second physical action]
3. [Continuing steps...]

**Duration:** [Minutes per episode]
**Automaticity Level:** [Deliberate / Semi-automatic / Fully automatic -- does the user often notice only after starting?]

#### REWARD
**Primary Reward Category:** [Stress relief / Stimulation / Social connection / Physical-sensory / Escape-avoidance / Energy]
**Reward Evidence:** [What the deprivation question, during/after split, or elimination test revealed]
**Reward Satisfaction Level:** [How well the current habit delivers this reward, 1-5]

---

### Trigger Analysis Worksheet

Log the next 5 occurrences of the target habit:

| # | Date | Time | Location | Emotional State | Who Present | Preceding Action | Routine (what you did) | Duration | Feeling After (10 min) |
|---|------|------|----------|----------------|-------------|-----------------|----------------------|----------|----------------------|
| 1 | | | | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |
| 4 | | | | | | | | | |
| 5 | | | | | | | | | |

**After each entry, answer:**
- Was this triggered by a genuine physical need (hunger, fatigue, pain) or by a context/emotion? [Yes/No]
- Did you notice the trigger before the habit started, or only after? [Before / Only after starting / Not at all]
- What would you have felt if you couldn't do the habit? [Emotion name]

---

### Pattern Analysis

After 5 logged entries:

| Cue Category | Episode Count | Rating (0-3 per episode) | Total Score | Primary? |
|-------------|--------------|--------------------------|-------------|---------|
| Location | | | | |
| Time | | | | |
| Emotional State | | | | |
| People Present | | | | |
| Preceding Action | | | | |

**Primary Trigger:** [Category with highest total score]
**Consistent Reward:** [Most frequently reported deprivation emotion across episodes]
**Environmental Amplifiers:** [Any conditions that made the trigger stronger -- deadline pressure, specific people, specific locations]
**Pattern Confidence:** [High (4-5 entries show same trigger) / Moderate (3 entries) / Low (log more episodes)]

---

### Reward-Matched Substitution Plan

**Confirmed Reward Category:** [From pattern analysis]
**Reward Physiological Basis:** [What the brain/body is seeking]

| Tier | Trigger | Old Routine | New Substitute | Reward Match | Availability |
|------|---------|-------------|----------------|-------------|-------------|
| Tier 1 (≤60 sec) | [trigger] | [old behavior] | [instant substitute] | [how it delivers same reward] | [any location] |
| Tier 2 (3-10 min) | [trigger] | [old behavior] | [full substitute] | [how it delivers same reward] | [conditions required] |

**Barrier Analysis:**
- What could prevent Tier 2? [Time / location / social context / energy]
- Tier 1 fallback when Tier 2 is blocked: [specific action]

---

### 7-Day Substitution Test

**Substitute being tested:** [Name of Tier 2 substitute]
**Reward being tested for:** [Reward category]

| Day | Trigger Fired? | Used Substitute? | If No, Why | Reward Satisfied (1-5) | Craving After Substitute | Notes |
|-----|---------------|-----------------|------------|----------------------|------------------------|-------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |

**Weekly Average Satisfaction Score:** ___ / 5

---

### Test Interpretation and Next Steps

| Average Score | Interpretation | Action |
|--------------|----------------|--------|
| 4.0 - 5.0 | Substitution works -- reward match confirmed | Reinforce with environment design; continue for 21 days |
| 3.0 - 3.9 | Partial match -- compound reward likely | Identify second unmet reward; add complementary substitute |
| 2.0 - 2.9 | Wrong reward category | Return to Step 3; re-run deprivation question |
| 1.0 - 1.9 | Trigger misidentified or incomplete | Log 5 more episodes; focus on preceding action and people columns |

**Recommended Environment Design Changes:**
1. [Specific environmental modification to reduce trigger exposure or increase substitute accessibility]
2. [Second modification]
3. [Third modification if applicable]

---

### Re-Analysis Trigger

Return to Step 4 and log 5 new episodes if:
- The weekly average falls below 3.0
- The trigger changes context (new job, new living situation, new relationship)
- The habit resurfaces after apparent success
- A new habit appears that may be serving the same reward through a different behavior
```

---

## Rules

1. **Never describe a behavior as an addiction, compulsion, or disorder.** Use only behavioral-descriptive language: "this habit appears to be triggered by X and sustained by reward Y." If a user volunteers a clinical label for themselves, acknowledge it without reinforcing or disputing it, then redirect to the behavioral observation framework. Clinical labels are outside this skill's scope.

2. **Never allow fewer than 5 logged episodes before finalizing the pattern analysis.** Single-instance analysis produces coincidence, not pattern. If a user resists logging ("I already know my trigger"), validate their intuition and still complete the worksheet -- the logs frequently reveal a secondary trigger the user did not anticipate. The worksheet is not doubting them; it is confirming and refining.

3. **The substitution must be reward-matched, not behavior-matched.** Replacing nail-biting with hand lotion is a behavior match (both involve hands). If the reward was anxiety relief, lotion may not satisfy it -- whereas a 4-7-8 breathing cycle would. Always trace to the reward category first, then design the substitute backward from the reward.

4. **Never recommend willpower, resolution, or "just notice the urge."** These are suppression strategies with documented rebound effects (see Wegner's ironic process theory). The framework replaces suppression with substitution. The distinction matters: suppression tells the brain "don't do that," which increases craving salience. Substitution tells the brain "do this instead," which redirects the existing neural pathway rather than fighting it.

5. **The substitute must be equally accessible to the old habit.** "Equally accessible" means: available in the same location, requiring no more than 30 seconds of preparation, and socially acceptable in the same contexts. If the user's trigger fires at a work desk, the substitute cannot require going to a gym. Accessibility mismatch is the second most common reason substitutions fail (after reward mismatch).

6. **Always design a Tier 1 substitute (under 60 seconds) in addition to the preferred Tier 2.** A substitution plan with only a 10-minute walk as the substitute will fail when the trigger fires in a meeting, during a phone call, or late at night. The Tier 1 option ensures there is always a viable response regardless of constraints.

7. **Analyze all five cue categories for every habit, even if one seems obvious.** Users instinctively gravitate toward emotional triggers ("I do it when I'm stressed") and miss environmental or time-based triggers. A habit that feels emotional may actually be primarily time-triggered (3 PM without exception) and the emotion is secondary. Environmental redesign (not snack food available at 3 PM) may be more effective than emotional management in this case.

8. **Do not conflate the trigger with the reason.** A user may say "I snack because I'm bored." That is an interpretation, not a trigger. The trigger is the specific antecedent condition (sitting at desk, after two hours of focused work, phone nearby). The reward is the outcome the habit delivers (stimulation, escape). "Because I'm bored" may accurately name the reward category (engagement/stimulation) while being too vague to design a substitution around.

9. **If the 7-day test scores below 2.0 on average, do not redesign the substitution -- re-examine the reward identification.** A failed substitution almost always means the wrong reward was identified, not that better substitutes need to be found. The intervention point is upstream: return to the deprivation question and re-run the during/after split with fresh data.

10. **Flag any habit that the user describes as causing significant distress, interfering with relationships, or persisting despite multiple genuine attempts at change.** These are markers that suggest the behavior may benefit from professional support. State this clearly but once, without repeated emphasis, and then continue with the framework if the user wants to proceed. The phrasing should be: "Persistent behaviors that resist self-directed change over time can sometimes benefit from working with a licensed therapist or behavioral health specialist who can apply more targeted strategies."

---

## Edge Cases

### The User Cannot Identify the Reward

Some users can describe the habit and the trigger accurately but cannot identify what the habit is giving them -- especially for habits with immediate action (automatic phone-checking, absent-minded eating, hair-pulling).

Use the **Three-Substitute Elimination Protocol:** On three separate trigger occurrences, before doing the old habit, try one of three test substitutes in sequence:
1. Physical movement for 2 minutes (reward tested: physical stimulation / energy)
2. A 3-minute conversation or text exchange with someone (reward tested: social connection / distraction through connection)
3. Sitting with eyes closed and focusing on breath for 2 minutes (reward tested: stress relief / decompression / quiet)

After each test, rate how much the original craving remained (1 = completely gone, 5 = unchanged). The substitute that most reduces the craving reveals the reward category. This protocol takes 3 trigger occurrences and produces clear reward category data even when self-report fails.

### The Trigger Is an Unavoidable Emotion (Chronic Stress, Loneliness, Work Boredom)

When the trigger cannot be removed -- a high-stress job, a period of social isolation, a structurally boring task -- the substitution carries the full burden of behavior change. In this context:

Design a **three-level response ladder** for the same reward category:
- **30-second option:** For triggers that fire in constrained environments (meetings, public spaces) -- three slow exhales, brief grounding technique (name 5 things you can see), or a hand-tension-and-release cycle
- **5-minute option:** For triggers with minimal time margin -- short walk, tea ritual, brief journaling prompt, one text to a close friend
- **15-minute option:** For triggers when a real break is available -- full walk outside, genuine social interaction, a meaningful creative or physical activity

Having three options prevents the common failure mode: "I didn't have time for my substitute, so I did the old habit." If the 5-minute option is blocked, the 30-second option is always available.

Additionally, if the trigger emotion is chronic and severe (persistent loneliness, prolonged work burnout), note that behavioral substitution manages the response but does not address the source. Recommend parallel action on the underlying condition -- social activity, workload conversation, professional support -- while substitution handles the immediate trigger.

### The User Has Multiple Habits They Want to Analyze Simultaneously

Do not run parallel analyses. The cognitive load of logging multiple habits simultaneously reduces data quality across all of them and often produces habit abandonment within 3-4 days.

Use the **Habit Priority Filter:**
1. Frequency: which habit occurs most often?
2. Distress: which habit causes the most negative consequences?
3. Tractability: which habit has the clearest, most specific trigger?

Analyze the habit that scores highest on two or more of these three dimensions first. Complete the full 7-day substitution test before beginning analysis of the second habit. Success with the first habit also has a documented spillover effect -- self-efficacy from one behavior change meaningfully increases probability of success with the next.

### The Habit Is Socially Embedded (Gossiping, Drinking With Specific Friends, People-Pleasing)

When other people are the consistent trigger, the "people present" column in the worksheet becomes the primary analysis variable. Map which specific individuals or relationship types most reliably trigger the behavior.

Key distinctions:
- If the behavior occurs only with one specific person or group: the trigger is relational, and the substitution must address the interpersonal context (a different response to that specific person, a different activity during that time, or a graduated reduction in exposure to that trigger context)
- If the behavior occurs with multiple different people: the trigger is likely an emotional state these interactions produce (evaluation anxiety, need for approval, avoidance of conflict), and the substitution addresses the underlying emotional state rather than the people themselves
- If the behavior is primarily maintained by social reinforcement (others laugh, engage, or reward the behavior): acknowledge that substitution alone may be insufficient -- social reinforcement is one of the most powerful behavior maintainers. The substitution plan should include a way to get the social reward through a different behavior in that same group context.

Note that recurring relationship-driven patterns that cause persistent distress may benefit from a conversation with a licensed counselor.

### The Habit Resurfaces After Initial Success

Relapse in habit loops is common and does not indicate failure of the method -- it typically indicates one of three things:

1. **The trigger changed context:** A new stressor, life change, or environment shift created a new version of the original trigger. Return to Step 4 and log 5 new episodes in the new context.
2. **The reward became compound:** The original single reward was addressed, but a second reward the habit was also delivering (which was dormant or less prominent) has now become primary. Re-run the deprivation question specifically for the new resurgence context.
3. **Environmental design was not completed:** The substitute was found to work but the physical environment still makes the old habit more accessible than the substitute. Conduct an environment audit: is the old habit object still visible, nearby, or within one action of being accessed? Visibility and proximity are the two strongest predictors of habitual behavior initiation.

Address resurgence with updated logging rather than treating it as a character failure. The behavioral language to use: "The habit is telling us something new about the trigger or reward that we didn't catch in the first analysis."

### The User's Habit Has a Legitimate Embedded Function (Nail-Biting as Sensory Regulation, Phone-Checking as Anxiety Management)

Some habits are not purely dysfunctional -- they are genuinely serving a regulatory function, and the user is right to have a nuanced response to changing them. Do not flatten this complexity.

Acknowledge the function explicitly: "This habit is working for you in one specific way -- it's reliably delivering [reward]. The goal isn't to eliminate what it's giving you; it's to get that same thing through a path that doesn't have the cost you're trying to eliminate."

Then apply extra rigor to the reward-match requirement. The substitute must be tested for genuine satisfaction (not just theoretical equivalence) before the user is asked to rely on it. A substitute that is "healthier but less effective" is not a viable substitute -- it is asking the user to accept a worse outcome, which the brain will not sustain.

---

## Example

**Input:** "I keep checking Instagram every time I sit down to start a hard work task. I know I should just start the task but I literally open Instagram before I've even thought about it. I've tried putting my phone in another room but it doesn't stick."

---

## Trigger Analysis: Automatic Instagram Checking at Task Onset

> **Note:** This analysis is for personal reflection and behavioral self-awareness. It is not a clinical assessment. If this pattern is significantly affecting your work, relationships, or wellbeing, consider speaking with a licensed mental health professional.

---

### Habit Profile

| Field | Detail |
|-------|--------|
| **Target Behavior** | Opening Instagram immediately upon sitting down to begin a difficult or effortful work task -- before consciously deciding to check it |
| **Frequency** | Estimated 3-6 times per work day (each time a new hard task begins) |
| **Duration per Episode** | Unknown -- likely 5-20 minutes per episode based on typical platform engagement patterns |
| **Habit Age** | Requires logging to confirm, but automaticity suggests at least 6-12 months of consistent pairing |
| **Previous Change Attempts** | Phone in another room -- failed to stick. This failure mode is informative: the habit is strong enough to overcome environmental friction when the trigger fires |
| **Baseline Distress Level** | High (user proactively seeking change, describes it as happening "before I've even thought about it" -- indicates high automaticity) |

---

### Habit Loop Map

#### CUE (Primary Trigger)

**Trigger Category:** Preceding Action -- specifically the action of initiating a difficult or cognitively demanding task

**Specific Trigger:** Sitting down and/or opening a work document, beginning a task that requires sustained cognitive effort. The habit fires at the transition point between easy or passive activity and hard, effortful work.

**Secondary Triggers:** Possibly time-of-day clusters (likely morning start, after-lunch restart, or late-afternoon sessions when cognitive resources are lower). Environmental cue: being at desk with phone nearby.

**Trigger Strength:** High -- the user describes it as fully automatic, occurring "before I've even thought about it." This indicates the habit has been practiced enough that the trigger-to-behavior pathway requires no conscious decision.

**Key Observation:** The failed attempt to put the phone in another room is diagnostically important. Phone-in-another-room reduces accessibility but does NOT eliminate the trigger. The trigger (initiating a hard task) still fires. Without a substitute behavior in place, the brain searches for the reward through available means. If the phone is accessible after a few seconds of effort, the behavior returns. This confirms the trigger is the task initiation, not the phone's physical presence.

#### ROUTINE

**Behavioral Sequence:**
1. Open work task (document, project, assignment)
2. Brain registers task as difficult or effortful (activation energy required)
3. Reach for phone -- automatic, pre-conscious
4. Open Instagram (or default to home screen then Instagram)
5. Begin scrolling feed or Stories
6. Continue for variable duration until interrupted or guilt overrides engagement

**Duration:** 5-20 minutes per episode based on typical automatic usage patterns; requires logging to establish personal baseline

**Automaticity Level:** Fully automatic at Step 3 -- user is not making a conscious choice to check Instagram, they are executing a conditioned response to the task-onset trigger

#### REWARD

**Primary Reward Category:** Escape/Avoidance -- specifically, avoidance of the cognitive discomfort and activation energy required to begin a difficult task

**Secondary Reward Category:** Stimulation/Novelty -- Instagram's infinite scroll delivers a steady stream of novel stimuli, which is neurologically engaging in a way that contrasts sharply with the focused, effortful demand of complex work

**Reward Evidence from Deprivation Test (hypothesized -- to confirm with logging):**
If the user could not check Instagram when the trigger fired, they would likely feel: a flat, resistive, slightly anxious sense of not wanting to begin -- sometimes described as a "stuck" feeling, mental blankness, or vague dread about the task. This is the sensation Instagram is relieving. It is not boredom; it is task-onset activation discomfort, which is a specific and identifiable cognitive state.

**Reward Satisfaction Level:** 4-5 (the habit is highly effective at delivering the avoidance reward -- this is why it has persisted despite the user's desire to stop)

**Critical nuance:** The Instagram check is not about social connection or entertainment as primary rewards. If it were, the user could be satisfied by a fixed number of posts or a timer. The scroll likely continues until external interruption because the reward is the sustained avoidance of task initiation -- not the content itself. The content is the delivery mechanism, not the reward.

---

### Trigger Analysis Worksheet

Log the next 5 times the Instagram habit fires during work:

| # | Date | Time | Location | Emotional State | Who Present | Preceding Action | Routine | Duration | Feeling After (10 min) |
|---|------|------|----------|----------------|-------------|-----------------|---------|----------|----------------------|
| 1 | | | Desk | | Alone/with others? | What task were you about to start? | Opened Instagram, scrolled | | |
| 2 | | | Desk | | | | | | |
| 3 | | | Desk | | | | | | |
| 4 | | | Desk | | | | | | |
| 5 | | | Desk | | | | | | |

**After each entry, answer:**
- What specifically was the task you were about to start? (Write 3 words describing it)
- On a scale of 1-5, how much were you dreading beginning that task? (1 = neutral; 5 = significant resistance)
- Did you notice picking up the phone before or after you did it?
- After the Instagram session ended, did you start the task? How long did it take to begin?

The "task dread score" per entry is key data. If high dread scores (3-5) consistently align with Instagram episodes, this confirms task-onset avoidance as the primary reward.

---

### Pattern Analysis

After 5 logged entries:

| Cue Category | Episode Count | Rating (0-3 per episode, estimated) | Total Score | Primary? |
|-------------|--------------|--------------------------------------|-------------|---------|
| Location | 5 | 1 each (desk is consistent but not sufficient trigger alone) | 5 | No |
| Time | 3-4 | 1-2 each | 5-7 | Contributing |
| Emotional State | 5 | 2 each (mild dread, resistance) | 10 | Yes (tied) |
| People Present | 1-2 | 0-1 each | 1-2 | No |
| Preceding Action | 5 | 3 each (hard task initiation every time) | 15 | **Primary** |

**Primary Trigger:** Preceding Action -- beginning a cognitively demanding or effortful task
**Secondary Trigger:** Emotional State -- low-level resistance, activation discomfort, or task dread
**Consistent Reward:** Avoidance of task-onset discomfort + novelty stimulation as a secondary benefit
**Environmental Amplifier:** Phone visible and within reach at desk
**Pattern Confidence:** High (all 5 episodes likely share the task-onset trigger)

---

### Reward-Matched Substitution Plan

**Confirmed Reward Category:** Escape/Avoidance of task-onset discomfort + Stimulation
**Physiological Basis:** Task-onset resistance involves elevated activation energy requirement (prefrontal cortex effort initiation). Instagram provides avoidance of this demand AND delivers dopaminergic novelty stimulation as a secondary relief.

The substitution must do one of two things:
1. Reduce the activation energy cost of beginning the task (making the task feel less effortful to start), OR
2. Deliver a brief, bounded version of the escape/stimulation that resets without triggering a scroll loop

Option 1 is often more effective for task-onset triggers because it addresses the cause (task difficulty perception) rather than just the escape route.

| Tier | Trigger | Old Routine | New Substitute | Reward Match | Availability |
|------|---------|-------------|----------------|-------------|-------------|
| Tier 1 (≤60 sec) | Sitting down to a hard task | Grab phone, open Instagram | Write the first sentence of the task in a blank document -- just one sentence, no pressure to continue. Then decide to continue or take a proper break. | Reduces activation energy by shrinking the perceived task size; also interrupts the automatic hand-to-phone motion with a competing motor action (hands on keyboard) | Available at any desk, no preparation |
| Tier 2 (3-5 min) | Sitting down to a hard task after a transition (lunch break, meeting) | Grab phone, open Instagram | 2-minute preparation ritual before the task: write the task name at the top of a blank document, list 3 bullet points of what you know about it, set a 25-minute timer (Pomodoro), then begin. This is the task-entry protocol. | Converts abstract task into concrete steps, reducing activation energy. The timer creates a bounded commitment (25 minutes, then a break) which reduces the psychological demand of "I have to work on this for hours." | Available at any desk; requires 2-3 minutes |

**Barrier Analysis:**
- What could prevent Tier 2? Tight deadline creating additional pressure, interruption mid-setup, low cognitive energy (late afternoon)
- Tier 1 fallback: Write one sentence only -- even if it is "I don't know where to start with this" as a literal first sentence. The act of typing something interrupts the phone-grab reflex and provides a minimal task entry point.

**Additional environment design:** Place a physical notepad and pen at the center of the desk (where the phone was), so the first available action at task onset is writing, not grabbing the phone. Phone goes in a desk drawer (not another room -- the barrier of "other room" proved too cognitively costly when motivation was low, but a drawer achieves mild friction without requiring physical displacement).

---

### 7-Day Substitution Test

**Substitute being tested:** One-sentence task entry (Tier 1) + 25-minute Pomodoro setup (Tier 2)
**Reward being tested for:** Reduction in task-onset discomfort

| Day | Trigger Fired? | Used Substitute? | If No, Why | Reward Satisfied (1-5) | Craving for Instagram After? | Notes |
|-----|---------------|-----------------|------------|----------------------|----------------------------|-------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
| 6 | | | | | | |
| 7 | | | | | | |

**Weekly Average Satisfaction Score Target:** ≥ 3.5

**What to watch for:**
- If scores are higher at the start of the day and lower mid-afternoon: energy depletion is amplifying the trigger in the afternoon. Add a Tier 2 option specifically for the post-2 PM period: a 5-minute physical movement break (not Instagram) BEFORE sitting down to the hard afternoon task, rather than after the trigger fires.
- If the Pomodoro timer approach feels constraining: the resistance to the timer may be a secondary trigger (commitment anxiety). Shorten the timer to 10 minutes for the first week.
- If the one-sentence technique works but the user immediately checks Instagram after writing the sentence: the one sentence is sufficient to initiate work. Follow the one sentence immediately with a second sentence. The task-entry barrier has been crossed -- the habit at that point is no longer about avoidance; it is a new choice.

---

### Test Interpretation and Next Steps

| Average Score | Interpretation | Action |
|--------------|----------------|--------|
| 4.0 - 5.0 | Task-onset entry technique confirmed as reward match | Continue for 21 days; add calendar reminder "one sentence" as phone home screen note |
| 3.0 - 3.9 | Partial match -- novelty/stimulation reward not fully addressed | Add a 2-minute "interesting read" (a saved article, a newsletter, anything with a hard close) as a bounded Tier 2 option for the stimulation component |
| 2.0 - 2.9 | Task-onset avoidance hypothesis partially wrong | Log 5 more episodes specifically noting: how hard was the task? Was it unclear what to do first (ambiguity), or clear but effortful (effort aversion)? These require different substitutes |
| 1.0 - 1.9 | Trigger misidentified | Re-log, focusing on time of day and emotional state columns -- may be a time-triggered habit, not a task-triggered one |

**Recommended Environment Design Changes:**
1. Move phone from desk surface to desk drawer. Drawer friction (one additional action) reduces automatic grabbing by 60-70% in behavioral research on friction-based environment design -- enough to allow conscious override.
2. Place a physical notepad at the center of the desk with "FIRST SENTENCE" written at the top of the first page. Physical prompt in the trigger location creates a competing behavioral cue.
3. Set a recurring calendar block called "First 25 minutes: [Project Name]" for each known hard-task period. Scheduling the task as a named block reduces the ambiguity that amplifies task-onset resistance.

---

### Re-Analysis Trigger

Return to Step 4 and log 5 new episodes if:
- The weekly average falls below 3.0
- Work context changes (new project type, new job, working from a different location)
- Instagram checking resumes after a period of success -- especially if it appears at a different time of day or in a different context than task onset, which would suggest a new trigger has formed
- A different avoidance behavior (news checking, coffee runs, reorganizing the desk) replaces Instagram -- this means the reward is the same (task avoidance) but the routine has migrated; the substitution plan addresses the correct reward but needs to account for routine migration
