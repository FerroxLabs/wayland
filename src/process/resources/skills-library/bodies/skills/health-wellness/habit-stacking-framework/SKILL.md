---
name: habit-stacking-framework
description: |
  Builds personalized habit stacks using implementation intentions that link new habits to existing daily anchors. Gathers the user's current routines and desired new habits, then produces a structured habit stack with "After I [existing habit], I will [new habit]" templates, a visual routine map, and a 2-week commitment plan.
  Use when the user asks about habit stacking, building new habits, implementation intentions, chaining habits together, or creating automatic routines.
  Do NOT use for breaking bad habits (use trigger-identification), addiction recovery, or clinical behavior modification programs.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "goal-setting mental-wellness habits self-care"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Habit Stacking Framework

> **Disclaimer:** This skill provides general wellness and behavioral science information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional judgment. Always consult a qualified healthcare professional before beginning a new fitness program, making dietary changes, or if habit difficulty is connected to significant emotional or psychological distress. If you are experiencing a mental health emergency, contact emergency services or a crisis line immediately.

---

## When to Use

**Use this skill when:**
- The user wants to attach a new behavior to an existing automatic routine ("I want to start meditating but I never remember to do it")
- The user explicitly asks about habit stacking, implementation intentions, habit chaining, or the "After I... I will..." format
- The user has one or more specific new habits they want to build and can name at least one thing they already do consistently every day
- The user wants to restructure a morning, midday, or evening routine and integrate new behaviors into the existing flow rather than create a new time block
- The user has failed at building a habit through willpower or motivation alone and wants a systems-based approach instead
- The user wants to create automaticity for health behaviors: hydration, movement, stretching, supplements, skincare, gratitude journaling, breathwork, reading, or similar low-to-moderate complexity daily practices
- The user is designing a routine for a life transition -- new job, new home, new baby, post-illness recovery -- where habits need to be rebuilt from scratch

**Do NOT use when:**
- The user wants to stop, reduce, or eliminate a harmful existing behavior -- use `trigger-identification` to map the cue-routine-reward loop of the behavior they want to break
- The user is dealing with substance use, disordered eating, compulsive behavior, or other addiction-adjacent patterns -- refer to a licensed mental health or addiction professional; habit stacking is for adding positive behaviors, not restructuring addictive cycles
- The user asks for a 30-day structured challenge format with milestones, public accountability, and journaling prompts -- use `30-day-habit-challenge` which has that scaffolding built in
- The user wants a digital or analog tracking system to monitor habits they already have in place -- use `habit-tracking-system` for streak monitoring, completion logs, and visual dashboards
- The user's difficulty forming any habits at all is tied to significant depression, executive dysfunction, ADHD symptoms, or chronic fatigue -- these are clinical presentations that require professional assessment before behavioral intervention; note the concern and suggest professional support
- The user is asking about organizational or team behavior change in a workplace context -- habit stacking is an individual behavioral tool, not an organizational change management framework

---

## Process

### Step 1: Conduct an Anchor Inventory

Before building any stack, you need to know what reliable behavioral triggers already exist in the user's life. These anchors are the load-bearing pillars of every stack you build.

- Ask the user to walk you through a typical weekday in three phases: morning from wake-up to leaving the house (or starting work), midday from noon to late afternoon, and evening from dinner to sleep. You are listening for behaviors that happen automatically and consistently -- not behaviors they aspire to do.
- Classify each anchor by its reliability score on a three-level scale: **Iron Anchors** happen every single day without variation (brushing teeth, making coffee, flushing the toilet after waking, sitting down at a work computer); **Strong Anchors** happen most days with occasional skips (eating lunch, driving to work, showering); **Weak Anchors** happen irregularly or require some intention (going to the gym, cooking dinner). Only Iron and Strong Anchors qualify as stacking points.
- For each candidate anchor, identify the precise physical moment that marks the anchor's completion -- this is the "linkage point." "Making coffee" is too vague. The linkage points are: starting the coffee maker, waiting for the brew, pouring the first cup, drinking the first sip. The more precise the linkage point, the stronger the implementation intention.
- Note the approximate time and physical location of each anchor. Physical location matters because the environment itself becomes part of the trigger -- the kitchen counter, the bathroom mirror, the car seat, the desk chair each carry their own behavioral momentum.
- Record 6-10 anchors spread across the day. More anchors give more options when matching new habits to optimal timing.

### Step 2: Inventory Desired New Habits

Collect the full list of what the user wants to build, then apply a structured prioritization filter before designing any stack.

- Ask the user to name every new habit they want to build, without filtering yet. Collect the full list even if it is 15 items long.
- For each new habit, capture four attributes: (1) the desired daily duration at full implementation; (2) the time of day when it makes the most biological or practical sense (morning light exposure should happen within 60 minutes of waking; evening gratitude journaling works better near sleep than mid-morning); (3) whether it requires any equipment, physical space, or other person; and (4) whether they have attempted this habit before and what happened.
- Apply the Habit Complexity Rating to each desired habit. Rate each on two axes -- **behavioral complexity** (does it require multiple steps, equipment, decision-making, or other people?) and **current motivation level** (1-10, how much do they want this?). High motivation + low complexity = start here. High motivation + high complexity = break it into sub-habits. Low motivation + any complexity = defer to Phase 2.
- Hard cap the starter stack at 3 new habits maximum, with a preference for 1-2 for genuine beginners or anyone who has previously failed at habit building. If the user insists on more, explain that research on implementation intentions (Gollwitzer, 1999; Duckworth et al.) consistently shows that specificity of a single well-formed intention outperforms multiple vague ones, and that stack fragility increases exponentially with each added link.
- For time-heavy habits (yoga, running, journaling), the desired habit must be broken into a minimum viable habit (MVH) -- a version so small it requires no willpower and takes under 90 seconds to complete. The MVH is not a permanent habit; it is the trigger-installation mechanism. "Do one sun salutation" installs the same trigger-response circuit as "do 30 minutes of yoga" but with near-zero activation cost.

### Step 3: Match New Habits to Anchors

This is the core design step. The quality of the anchor-habit match determines whether the stack will hold or collapse.

- Match each new habit to the anchor where the **contextual logic is strongest**. Morning hydration makes sense after the bathroom trip that already happens upon waking, not after brushing teeth (which is later and drier). Stretching makes sense after a workout anchor, not a coffee anchor. The user should be able to finish the anchor behavior and have the new habit be the most obvious next physical move their body could make.
- Consider **temporal contiguity** -- the anchor and the new habit must happen within 30 seconds of each other with no significant interruption. If the user says "after I get dressed I'll meditate," but getting dressed is followed by talking to a partner, preparing lunches, and herding children for 20 minutes, the anchor-habit link will be disrupted. That gap is a failure point.
- Consider **environmental co-location** -- the anchor behavior and the new habit should occur in the same physical space, or require only a single step of movement. If the anchor is at the kitchen counter and the new habit requires going upstairs to get equipment, the friction will break the chain. Co-location enables automatic transfer.
- Evaluate **energy-state alignment**. Cognitively demanding habits (language learning, writing, problem-solving) should be anchored to morning high-energy states. Physical habits with moderate intensity can be anchored to morning or midday. Wind-down habits (breathing exercises, journaling, reading) should be anchored to evening. Pushing against energy state is a hidden source of habit failure that users rarely diagnose correctly.
- When two new habits could plausibly be linked together in a mini-chain, order them from lower to higher complexity or energy demand. Start with the easier win to build momentum within the stack before asking the nervous system for more.

### Step 4: Write the Implementation Intentions

The implementation intention is the precise, written "if-then" or "After I... I will..." statement that fires the new behavior automatically. Precision here is everything.

- Write each implementation intention in exact "After I [anchor], I will [behavior]" format. The anchor statement must name the specific observable endpoint of the anchor behavior -- "After I place my toothbrush back in its holder" not "After I brush my teeth." The behavior statement must name the specific physical starting action -- "I will pick up the book from my nightstand and open to my bookmark" not "I will read."
- Every behavior clause must contain a physical starting action as its first element. The brain does not automate abstractions. "I will meditate" is an abstraction. "I will sit on my meditation cushion and set a 5-minute timer" is a physical action sequence the motor system can learn.
- The MVH version of each implementation intention should be so small that the user's honest reaction is "that seems almost too easy." If they are not slightly underwhelmed by the starter version, it is too ambitious. Common starter formulas: "I will do 1 rep / 1 page / 1 breath cycle / 1 sentence / 30 seconds of [activity]."
- Write both versions: the MVH version (Days 1-3) and the full target version (Day 8+). Having both written down removes decision-making from the habit execution moment. The user should never be thinking "how long should I do this today" during the habit window.
- Include the completion signal at the end of each stack. The completion signal is a brief, distinct physical action that marks the stack as finished and releases the user back to their normal routine. It should feel slightly rewarding. "Pour my coffee" works because coffee is already anticipated and pleasurable. "Check off the stack on my notepad" works because it provides visual closure.

### Step 5: Design the Environment

Habit stacks fail in the space between intention and execution when the required equipment is not immediately at hand. Environment design is not optional; it is the infrastructure that makes the behavioral architecture viable.

- For every new habit in the stack, identify every physical object required to execute it. Then determine exactly where that object must be placed so that the user encounters it without searching immediately after completing the anchor. This is called **cue placement** -- the object itself becomes a visual trigger that reinforces the implementation intention.
- Apply the **zero-friction rule**: if executing the habit requires more than one deliberate physical action to access the necessary equipment, the friction is too high. The yoga mat should be unrolled and placed where the user will literally step on it. The journal should be open on the table, not closed on a shelf. The water glass should be pre-filled on the counter. The running shoes should be at the door, not in the closet.
- Identify and remove **competing stimuli** near the anchor point. If the new habit is reading before bed but the phone charger is on the nightstand and social media is one tap away, the competing stimulus wins. Move the charger to the bathroom outlet. This is stimulus control, a foundational principle of behavioral science.
- Prepare the environment before Day 1. Give the user a concrete checklist. Physical preparation done the night before is dramatically more effective than physical preparation attempted the morning of.
- For work-based stacks or stacks that take place in shared spaces, identify any dependencies on other people or environmental conditions that the user does not control. Plan a contingency anchor ("if my usual desk is taken, I will do this at the kitchen table instead") for shared-space stacks.

### Step 6: Build the 2-Week Commitment Plan

The first two weeks are not about building the habit at full intensity -- they are about installing the trigger-response circuit. The behavior will grow naturally once the circuit is wired.

- **Days 1-3 (Trigger Installation):** Execute every habit at MVH level only, regardless of available time or energy. The goal is perfect completion of the starter version, not impressive performance. A 1-page reading session completed every day for 3 days is neurologically more valuable than a 20-page session once, because the trigger-response connection requires repetition, not duration.
- **Days 4-7 (Controlled Expansion):** Increase each habit to approximately 30-50% of the target duration or intensity. If the target is a 20-minute run, Days 4-7 should be 6-10 minutes. If the target is 3 pages of journaling, Days 4-7 should be 1 page. The stack should still feel manageable -- effort should increase slightly but should not create dread.
- **Days 8-14 (Full Stack):** Execute the full target versions consistently. Address any friction points identified during expansion. If a particular link in the stack is consistently failing, treat it as diagnostic data and return to Step 3 for that specific habit.
- Write explicit recovery rules for three scenarios: single missed day, two consecutive missed days, and chronic breakage at the same point in the stack. These rules must be written down before Day 1 because they need to be available without requiring decision-making in the moment of failure.
- Build in a Day 7 and Day 14 self-check: a 5-question reflection that asks the user to rate anchor reliability, friction level, MVH adequacy, environmental setup effectiveness, and overall stack coherence. This creates a review loop that catches problems early.

### Step 7: Identify Potential Failure Points and Pre-Solve Them

Expert habit designers anticipate failure before it happens. Run a pre-mortem on the proposed stack before delivering it to the user.

- Review each anchor and ask: "Is there any realistic daily scenario where this anchor does not happen?" If yes, name a backup anchor for that habit.
- Review the transition between each link and ask: "Is there any realistic interruption that would break this transition?" (Partner asking a question, phone notification, child needing attention, work emergency.) If yes, write a "resume rule" -- a specific instruction for how to re-enter the stack after an interruption.
- Check for scheduling conflicts on specific days: if the morning anchor is dependent on the user being home and they commute to an office three days a week, the stack must either work in both environments or have a mobile version for office days.
- Ask the user explicitly: "When you imagine executing this stack on your hardest possible day -- exhausted, running late, stressed -- which step do you think you would skip first?" That step is the most fragile link. Reduce it to its smallest conceivable version or redesign the anchor.

---

## Output Format

```
## Habit Stack Plan

**User's Target Habits:** [habit 1], [habit 2], [habit 3]
**Stack Locations:** [morning / midday / evening -- specify which habits go where]
**Total Stack Time:** [X] min (starter, Days 1-3) -> [Y] min (full, Day 8+)
**Anchor Quality:** [Iron / Strong for each anchor used]

---

### Anchor Inventory

| Time of Day | Anchor Habit | Linkage Point | Anchor Quality |
|-------------|-------------|---------------|----------------|
| [~time] | [anchor behavior] | [precise endpoint] | Iron / Strong |
| [~time] | [anchor behavior] | [precise endpoint] | Iron / Strong |
| [~time] | [anchor behavior] | [precise endpoint] | Iron / Strong |

---

### Implementation Intentions

**[Stack Name] -- Starter Version (Days 1-3):**

1. After I **[precise linkage point of anchor 1]**, I will **[physical starting action of new habit 1 -- MVH version, under 90 seconds]**.
2. After I **[complete new habit 1]**, I will **[physical starting action of new habit 2 -- MVH version, under 90 seconds]**.
3. After I **[complete new habit 2]**, I will **[completion signal -- a brief rewarding action]**. [DONE]

**[Stack Name] -- Full Version (Target by Day 8):**

1. After I **[precise linkage point of anchor 1]**, I will **[physical starting action of new habit 1 -- full version, X minutes]**.
2. After I **[complete new habit 1]**, I will **[physical starting action of new habit 2 -- full version, X minutes]**.
3. After I **[complete new habit 2]**, I will **[completion signal]**. [DONE]

*(Repeat block above for each separate stack if morning + evening stacks are both being built)*

---

### Visual Routine Map

**[Stack Name]:**

[anchor linkage point]
       |
       v
[New Habit 1]          <- [MVH duration] starter / [full duration] target
       |
       v
[New Habit 2]          <- [MVH duration] starter / [full duration] target
       |
       v
[Completion Signal]    <- [DONE -- stack is complete]

---

### Habit Complexity Ratings

| New Habit | Behavioral Complexity | Motivation (1-10) | Start Phase |
|-----------|----------------------|-------------------|-------------|
| [habit 1] | Low / Medium / High | [X/10] | Phase 1 |
| [habit 2] | Low / Medium / High | [X/10] | Phase 1 |
| [deferred habit] | [complexity] | [X/10] | Phase 2 (add after Week 3) |

---

### 2-Week Commitment Plan

| Phase | Days | Stack Activity | Target Duration | Key Goal |
|-------|------|---------------|----------------|----------|
| Trigger Installation | 1-3 | MVH version only | [X] min total | Zero missed completions |
| Controlled Expansion | 4-7 | 30-50% of target | [X] min total | Steady increase, no strain |
| Full Stack | 8-14 | Full target version | [X] min total | Consistent execution |

**Day 7 Self-Check Questions:**
1. Is the anchor happening reliably every day? (Yes / No -- if No, new anchor needed)
2. Is any step creating dread or avoidance? (Yes -- shrink it; No -- proceed)
3. Is the environment set up before you need it? (Yes / No -- if No, fix tonight)
4. Have you missed any days? (If yes, apply recovery rule below)
5. Does the stack feel automatic yet, or does it still require thought? (Automatic = good progress; Still effortful = stay at current level longer)

---

### Recovery Rules

| Scenario | Action |
|----------|--------|
| Missed 1 day | Resume at current phase level the next day. No make-up session needed. Single misses do not reset the trigger circuit. |
| Missed 2 consecutive days | Drop back to MVH level for 2 days, then resume expansion. The trigger needs brief re-installation. |
| Missed 3+ days | Return to Days 1-3 protocol (MVH only) for 3 days before expanding again. |
| Stack breaks at the same link consistently | Diagnose: (a) wrong anchor -- find a more reliable one; (b) habit too large -- shrink further; (c) environment not set up -- fix prep; (d) energy mismatch -- move to different time of day. |
| Traveling or schedule disrupted | Identify the one Iron Anchor that survives the disruption and attach a single MVH habit to it. Maintain the trigger circuit even at minimal level. |

---

### Environment Setup Checklist

Complete this before Day 1. Each item eliminates a failure point.

**Equipment Placement (Cue Setup):**
- [ ] [Physical object for habit 1] placed at [exact location -- visible and within arm's reach of anchor point]
- [ ] [Physical object for habit 2] placed at [exact location]
- [ ] [Physical object for habit 3] placed at [exact location]

**Competing Stimuli to Remove:**
- [ ] [Competing stimulus 1] -- move to [new location] to reduce friction
- [ ] [Competing stimulus 2] -- move to [new location]

**Day-Before Prep Ritual (repeat each night):**
- [ ] [Specific nightly reset action 1]
- [ ] [Specific nightly reset action 2]

---

### Phase 2 Habit Queue

Habits deferred from this stack to be added after Week 3 when the current stack is automatic:

1. [Deferred habit 1] -- suggested anchor when ready: [anchor]
2. [Deferred habit 2] -- suggested anchor when ready: [anchor]
```

---

## Rules

1. **Never use an anchor the user is "trying to do" or "usually does."** An anchor must be something that has been happening automatically for at least 3-4 weeks without requiring any intention. If there is any doubt, ask: "On your worst possible day last month, did this still happen?" If the answer is no or maybe, it is a Weak Anchor and cannot be used as a stacking point. A stack built on a Weak Anchor is a stack built on sand.

2. **Hard cap: 3 new habits per stack, 1-2 preferred for beginners.** Every link added to a chain is an exponential failure point. With 1 new habit, missing the anchor breaks 1 habit. With 3 new habits in a chain, missing the anchor or the first habit breaks all 3. Stack fragility compounds. Build one stack successfully before adding a second; build the second before considering a third.

3. **MVH versions must be genuinely minimal.** If the user says the starter version "feels like enough," it is too long. The correct starter should feel slightly embarrassing in its smallness. "One pushup" "one sentence" "three deep breaths" "30 seconds of stretching" -- these are correct MVH calibrations. Under 90 seconds is the target. Under 2 minutes is the ceiling.

4. **Never accept "in the morning" or "before bed" as an anchor.** These are time zones, not behaviors. A behavior in time, not a time itself, is an anchor. Require the user to name the specific physical act and its precise endpoint. "After I set my coffee to brew" beats "in the morning" every time because the specific behavior fires a specific neural trigger while the time window does not.

5. **Every implementation intention must contain a physical starting action in the behavior clause.** Abstract intentions ("I will be mindful," "I will exercise," "I will practice gratitude") do not activate motor programs. Concrete starting actions ("I will sit cross-legged on my cushion and close my eyes," "I will put on my shoes and step outside," "I will open my notebook and write one thing I noticed today") do. If the behavior clause does not contain a physical starting action, rewrite it.

6. **Environment setup is non-negotiable and must be completed before Day 1.** Users who read their stack plan and intend to set up the environment later almost never set it up adequately. Make the environment setup checklist concrete, specific, and completable the same evening the plan is delivered. An unrolled yoga mat and an open journal sitting on the counter are not small details -- they are the behavioral infrastructure.

7. **Recovery rules must be written in advance and be decision-free.** A recovery rule that requires the user to figure out what to do in the moment of failure is useless. Rules like "if I miss 2 days, I will drop back to MVH for 2 days" are decision-free. The user just executes the pre-written rule without deliberation. This is especially critical because the emotional state around habit failure (guilt, self-criticism, the "I've already blown it" cognitive distortion) actively impairs decision-making.

8. **Do not frame any part of this framework as requiring willpower, discipline, or motivation.** The entire point of habit stacking is to make behavior automatic through trigger-response wiring, not to make behavior happen through effortful self-control. If you find yourself writing phrases like "stay motivated," "push through," or "commit to the process," you have slipped into motivational framing and must revise. The correct frame is engineering, not effort.

9. **For habits with time durations over 10 minutes at full implementation, always confirm the gap between the anchor and any hard constraint (work start time, departure, childcare).** A 20-minute yoga practice anchored to "after I start my coffee maker" at 7:40 AM when the user leaves at 8:00 AM creates structural failure baked into the plan. Always calculate total stack time against available windows before finalizing.

10. **When the user has failed at habit building repeatedly, do not immediately rebuild a similar plan with minor tweaks.** Repeated failure is diagnostic. Conduct a brief failure analysis before redesigning. Ask: Where specifically did the chain break? Was the anchor reliable? Was the environment set up? Was the MVH version attempted first or did they jump to full duration? Was there a recovery rule? Most habit failures trace to one of five root causes: unreliable anchor, too-large starting version, missing environment setup, no recovery rule, or misaligned energy state. Identify the root cause first, then redesign around it.

---

## Edge Cases

**The user has no consistent daily routine (shift worker, new parent, highly variable schedule):**
Standard habit stacking assumes temporal and environmental regularity. When this does not exist, shift to an anchor-of-opportunity approach. Identify the ONE behavior that happens regardless of schedule -- for a new parent, this might be "every time I sit down after putting the baby down." For a shift worker, it might be "every time I get in my car to start a shift." Build a single-habit stack on this anchor only. The stack is not time-bound; it is event-bound. Keep it to one new habit until some schedule regularity emerges. Morning-specific stacks are contraindicated for anyone whose morning varies by more than 45 minutes day to day.

**The user lists a desired habit that is actually several habits bundled together:**
"Get in shape" is four habits: morning movement, hydration, dietary change, and sleep quality. "Be more mindful" is at least three habits: a formal meditation practice, between-task awareness pauses, and journaling. When a user describes a desired habit at a high level of abstraction, decompose it into its specific behavioral components before building the stack. Then apply the Habit Complexity Rating to each component and select only the 1-2 components with the highest motivation score and lowest complexity to include in the Phase 1 stack. The rest go to the Phase 2 queue.

**The user wants to stack habits at work in an open office or unpredictable professional environment:**
Work-based stacks are entirely viable but require different anchors. Use transition moments that the user controls: "After I sit down at my desk and open my laptop," "After I close my last meeting window," "After I send my first email of the day." Avoid anchors that depend on meetings starting or ending on time, on coworkers being present, or on tasks being completed at predictable intervals. Focus on physical transitions the user initiates. For any stack in a shared space, the environment setup requires that equipment be stored at the desk (a water bottle, a journal, resistance bands in a drawer) -- objects that cannot be visually prepared in advance but must be permanently co-located.

**The user's motivation for the desired habit is high but behavioral complexity is also high (e.g., meal prepping, learning an instrument, running):**
High-complexity habits require a scaffolded MVH strategy. For meal prepping, the MVH is not "prep meals for the week" -- it is "after I finish dinner, I will place one item for tomorrow's lunch into a container." For learning guitar, the MVH is not "practice" -- it is "after I turn off my laptop, I will pick up my guitar and play one chord three times." For running, the MVH is "after I brush my teeth, I will put on my running shoes and walk to the end of the driveway." The MVH installs the trigger circuit; the full behavior grows from there. Resist any pressure to skip the MVH phase for high-motivation users. High motivation is transient; automatic triggers are not.

**The user has tried habit stacking before and it failed within the first two weeks:**
Do not rebuild a new plan immediately. Run a 5-question failure analysis first: (1) "Where exactly did the chain break -- which specific step?" (2) "Was the anchor you used actually happening every day before you added the new habit?" (3) "Did you attempt the full-duration version from Day 1 or did you use a starter version?" (4) "Was the equipment ready before you needed it, or were you setting it up each time?" (5) "What happened the first day you missed -- did you have a recovery rule?" The answers will almost always reveal one of the five root causes listed in Rule 10. Redesign specifically around the diagnosed failure point, not generically. Often the correct redesign is simply: smaller MVH, more reliable anchor, and better environment prep.

**The user wants to stack habits for a child or help a family member build habits:**
The same architecture applies with two modifications. First, the anchor must be something that happens in the child's routine, not the parent's -- the child's anchor is the trigger, not the adult's convenience. Second, the completion signal should include an immediate tangible reward for children under 12 (a sticker, a verbal acknowledgment, a small privilege) because the reward circuit in developing brains is not yet mature enough to sustain behavior on delayed or intrinsic reinforcement alone. For adolescents and adults you are helping design stacks for, the person must participate in designing their own stack -- stacks designed entirely by someone else have near-zero adherence because ownership of the implementation intention is part of the mechanism.

**The user's desired habit requires a specific physical space they do not always have access to (e.g., gym, outdoor running path, quiet room for meditation):**
Design two versions of the stack from the start: a primary version for when the preferred space is available, and a home/travel version that works anywhere. The anchor can be the same in both versions ("after I put my toothbrush away"), but the behavior adapts ("I will go to the gym and complete my program" vs. "I will clear a 6x6 space in my room and do my bodyweight workout"). Having both versions pre-written means a travel week or gym closure does not break the trigger circuit -- the user just runs the alternate version. Single-environment habits are fragile; dual-environment habits are resilient.

---

## Example

**Input:** "I want to start doing a short meditation, drinking more water throughout the day, and doing some evening stretching. My consistent daily habits are making coffee every morning, eating lunch at my desk, and brushing my teeth before bed. I've tried meditation a few times but never stuck with it. I have about 20-25 minutes total to add across the day."

**Output:**

## Habit Stack Plan

**User's Target Habits:** Morning meditation, daytime hydration, evening stretching
**Stack Locations:** Morning (meditation), Midday (hydration), Evening (stretching)
**Total Stack Time:** 5 min (starter, Days 1-3) -> 22 min (full, Day 8+)
**Anchor Quality:** Morning coffee (Iron), Desk lunch (Strong), Brushing teeth (Iron)

---

### Anchor Inventory

| Time of Day | Anchor Habit | Linkage Point | Anchor Quality |
|-------------|-------------|---------------|----------------|
| ~7:00 AM | Make morning coffee | The moment the coffee maker begins brewing | Iron |
| ~12:30 PM | Eat lunch at desk | The moment lunch container or plate is placed on the desk | Strong |
| ~10:00 PM | Brush teeth before bed | The moment toothbrush goes back in its holder | Iron |

**Anchor Notes:**
- The desk lunch anchor is rated Strong, not Iron, because work meetings occasionally move or skip lunch. A backup anchor is included in the recovery section.
- "Making coffee" has three candidate linkage points: starting the brewer, waiting for the brew, pouring the first cup. The recommended linkage point is **starting the brewer** because it creates the most natural 2-5 minute window while the coffee brews -- ideal for a brief meditation. The user is neither holding nor consuming anything, their hands are free, and the coffee maker becomes an automatic environmental cue.

---

### Implementation Intentions

**Morning Stack -- Starter Version (Days 1-3):**

1. After I **press the button on the coffee maker**, I will **sit down in my chair at the kitchen table, close my eyes, and take 5 slow breath cycles** (under 90 seconds).
2. After I **finish the 5 breath cycles**, I will **pour my coffee** (completion signal). [DONE]

**Morning Stack -- Full Version (Target by Day 8):**

1. After I **press the button on the coffee maker**, I will **sit down in my chair at the kitchen table, close my eyes, and meditate for 10 minutes using my timer** (10 minutes).
2. After my **timer goes off**, I will **pour my coffee** (completion signal). [DONE]

---

**Midday Stack -- Starter Version (Days 1-3):**

1. After I **place my lunch on my desk**, I will **pick up my full water bottle from the desk corner and take 5 long sips before I take my first bite** (under 60 seconds).
2. After I **take the 5 sips**, I will **begin eating** (completion signal -- lunch is the reward and the resumption cue). [DONE]

**Midday Stack -- Full Version (Target by Day 8):**

1. After I **place my lunch on my desk**, I will **pick up my water bottle and drink 8 oz (roughly half a standard bottle) before my first bite** (90 seconds).
2. After I **finish the water**, I will **begin eating** (completion signal). [DONE]

*Note: The hydration habit is intentionally kept small even in its full version because the goal is to install a consistent mid-day hydration trigger, not to consume a large volume in one sitting. The habit creates a midday baseline; natural thirst throughout the afternoon will compound total intake.*

---

**Evening Stack -- Starter Version (Days 1-3):**

1. After I **place my toothbrush back in its holder**, I will **walk to the open yoga mat beside my bed and do one 30-second standing quad stretch per leg** (60-90 seconds total).
2. After I **finish both sides**, I will **get into bed** (completion signal). [DONE]

**Evening Stack -- Full Version (Target by Day 8):**

1. After I **place my toothbrush back in its holder**, I will **walk to the yoga mat beside my bed and complete my 10-minute stretching sequence** (10 minutes).
2. After I **finish the last stretch**, I will **roll up the mat, get into bed** (completion signal). [DONE]

---

### Visual Routine Maps

**Morning:**

Press coffee maker button
       |
       v
Sit at kitchen table, eyes closed
       |
       v
5 breath cycles (starter) / 10-min meditation (full)
       |
       v
Pour coffee [DONE] <- completion signal / natural reward

**Midday:**

Place lunch on desk
       |
       v
Pick up water bottle
       |
       v
5 long sips (starter) / 8 oz water (full)
       |
       v
Begin eating lunch [DONE] <- completion signal / natural reward

**Evening:**

Toothbrush in holder
       |
       v
Walk to yoga mat (already unrolled beside bed)
       |
       v
1 quad stretch per side (starter) / 10-min stretch sequence (full)
       |
       v
Get into bed [DONE] <- completion signal / natural reward

---

### Habit Complexity Ratings

| New Habit | Behavioral Complexity | Motivation (1-10) | Start Phase |
|-----------|----------------------|-------------------|-------------|
| Morning meditation | Low-Medium (past attempts failed -- MVH approach critical) | 8/10 | Phase 1 |
| Midday hydration | Low | 7/10 | Phase 1 |
| Evening stretching | Low | 8/10 | Phase 1 |

**Note on meditation:** The user has attempted meditation before without success. This is a flag for the anchor-habit design. The failure is almost certainly not motivational (motivation is 8/10) but structural -- likely missing a reliable anchor, starting at too long a duration, or having no physical cue. The coffee maker anchor + 5-breath MVH directly addresses all three typical failure modes.

---

### 2-Week Commitment Plan

| Phase | Days | Morning Stack | Midday Stack | Evening Stack | Total |
|-------|------|--------------|--------------|---------------|-------|
| Trigger Installation | 1-3 | 5 breath cycles (90 sec) | 5 sips water (60 sec) | 1 quad stretch per side (90 sec) | ~4 min |
| Controlled Expansion | 4-7 | 4-min breathing or guided meditation | Full 8 oz water | 4-min stretch sequence | ~10 min |
| Full Stack | 8-14 | 10-min meditation | 8 oz water (consistent) | 10-min stretch sequence | ~22 min |

**Day 7 Self-Check Questions:**
1. Is the coffee maker being used every morning? (If no -- is there a backup anchor like "after I fill my kettle"?)
2. Is any single step creating dread or avoidance? (If yes -- shrink that specific step further; the others can stay)
3. Is the yoga mat unrolled and visible from the bathroom every night? (If no -- fix tonight)
4. Have any days been missed? (If yes -- apply the recovery rule; do not try to make up the missed session)
5. Does the coffee-to-meditation link feel somewhat automatic, or does it still require a deliberate mental prompt? (Automatic = excellent; Still effortful at Day 7 = stay at expansion phase one additional week before going to full duration)

---

### Recovery Rules

| Scenario | Action |
|----------|--------|
| Missed 1 day | Resume at the current phase level the next day. Do not add a make-up session. Single misses do not damage the trigger circuit. |
| Missed 2 consecutive days | Return to MVH level for exactly 2 days, then resume expansion. The circuit needs brief re-installation after a two-day gap. |
| Missed 3+ days | Return to Days 1-3 protocol (MVH only) for 3 days before resuming expansion. |
| Midday stack broken by a skipped lunch or working lunch | Resume the next day. Do not attempt to hydrate "extra" to compensate -- compensation behavior adds cognitive load and guilt. The next anchor is the next opportunity. |
| Meditation keeps breaking -- coffee routine is inconsistent | Shift the meditation anchor to "after I pour my coffee and before I drink the first sip." This is a later linkage point in the same anchor sequence and works for days with different coffee timing. |
| Evening stretching keeps getting skipped -- too tired | This is an energy-state mismatch. Move the stretching anchor to immediately after dinner while seated at the table: "after I push my dinner plate to the side, I will do 3 neck rolls and 3 shoulder circles." This is a dramatically lower-energy version appropriate for high-fatigue evenings while the circuit installs. Return to the bedtime version after 2 weeks. |

---

### Environment Setup Checklist

Complete this tonight before Day 1. These are not optional.

**Equipment Placement (Cue Setup):**
- [ ] Place a chair at the kitchen table in a position that faces away from the phone/TV, usable for seated eyes-closed meditation -- this should already be there but confirm it is not facing a screen
- [ ] Place a full 16-20 oz water bottle at the corner of the desk where lunch is eaten -- fill it the night before and refill each morning
- [ ] Unroll your yoga mat and place it beside your bed, parallel to the bed, so that walking from the bathroom after brushing teeth takes you directly past it
- [ ] If you do not have a yoga mat, fold a bath towel on the floor beside the bed -- the cue placement matters more than the equipment quality

**Competing Stimuli to Remove:**
- [ ] Move your phone charger to a surface outside the bedroom (hallway, bathroom counter) -- this removes the scrolling competitor that fights with the evening stretch and sleep onset
- [ ] If your phone is typically on the kitchen table during morning coffee, move it to the counter or another room during the coffee brew window to protect the meditation time

**Day-Before Prep Ritual (do each night, takes 2 minutes):**
- [ ] Refill the desk water bottle and place it at the lunch corner of the desk
- [ ] Confirm the yoga mat is unrolled beside the bed (if you moved it during the day, return it)
- [ ] Set a gentle alarm or coffee maker timer if needed to keep the morning window consistent

---

### Phase 2 Habit Queue

The following habits were not included in the Phase 1 stack but can be added after the current three stacks have been running automatically for at least 3 weeks (minimum Day 22+):

1. **Morning journaling** -- suggested anchor when ready: "After I pour my coffee and sit down" (extends the morning stack that is already being built; add after meditation is fully automatic)
2. **Post-lunch walk** -- suggested anchor when ready: "After I close my lunch container and place it aside" (builds on the midday anchor already in use; requires confirming a consistent 10-15 min lunch break window)
