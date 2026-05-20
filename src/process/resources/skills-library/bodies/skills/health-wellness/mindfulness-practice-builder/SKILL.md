---
name: mindfulness-practice-builder
description: |
  Designs a personalized daily mindfulness practice using specific techniques (body scan meditation, mindful observation, breath awareness, mindful walking). Gathers the user's experience level, available time, and goals, then produces a structured practice plan with guided sequences and a progressive weekly schedule.
  Use when the user asks about starting a mindfulness practice, building a meditation habit, practicing present-moment awareness, or creating a mindfulness routine.
  Do NOT use for clinical meditation therapy, trauma-sensitive meditation, or treating any mental health condition.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness self-care meditation breathing"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Mindfulness Practice Builder

> **Disclaimer:** This skill provides general wellness information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before starting any new wellness program. If you are experiencing a mental health crisis, contact emergency services or a crisis helpline immediately.

---

## When to Use

**Use this skill when:**
- A user wants to build a first-ever mindfulness or meditation practice and needs a concrete, structured starting point with specific techniques and durations
- A user has tried meditation apps (Headspace, Calm, Insight Timer) and wants to transition to a fully self-directed, app-independent practice they understand and can maintain independently
- A user asks specifically about breath awareness, body scan meditation, mindful observation, or mindful walking and wants guided step-by-step sequences for any of these techniques
- A user wants a progressive 4-week habit-building plan that accounts for their available time, preferred schedule, and primary wellness goal (stress reduction, focus, emotional awareness, sleep preparation, or general wellbeing)
- A user mentions they have 5 to 30 minutes per day available and wants that time used efficiently with a structured, evidence-informed sequence
- A user wants to understand the mechanism behind mindfulness -- why the techniques work -- so they can practice with more confidence and motivation
- A user has an inconsistent practice (meditates occasionally, keeps stopping and restarting) and wants a structured reset with better anchoring strategies and obstacle-response protocols

**Do NOT use this skill when:**
- The user describes mindfulness as part of treatment for a diagnosed anxiety disorder, PTSD, OCD, depression, or any other clinical condition -- refer them to a licensed mental health professional who is trained in Mindfulness-Based Cognitive Therapy (MBCT) or Mindfulness-Based Stress Reduction (MBSR) as a clinical intervention
- The user has a history of trauma or dissociation and is asking specifically whether mindfulness is safe for them -- this requires a trauma-informed clinician's assessment, not a wellness skill
- The user is in acute emotional distress, crisis, or is expressing hopelessness -- this is not the moment to build a habit; address their immediate need first and consider redirecting to crisis resources
- The user wants a tradition-specific practice rooted in a particular lineage (Theravada Vipassana retreat instruction, Tibetan visualization practice, Zen shikantaza, Sufi dhikr) -- these require a qualified teacher from that tradition, not a general wellness skill
- The user wants audio-guided meditations or voice-led sessions -- this skill produces written, self-administered practice sequences only
- The user is asking about the clinical research comparing mindfulness interventions (MBSR vs. MBCT outcomes, neuroimaging studies, effect sizes in RCTs) -- use a research synthesis approach instead
- The user wants cognitive behavioral techniques for managing intrusive thoughts -- that is a distinct clinical methodology; use a CBT-adjacent skill instead

---

## Process

### Step 1: Gather Structured Intake Information

Ask the user for five specific inputs before designing anything. Do not guess or proceed with defaults if the user has not provided these.

- **Experience level** -- Use these four tiers to calibrate technique complexity and language: (1) Never tried it, (2) Tried 1-5 times, nothing consistent, (3) Practiced occasionally, no regular habit, (4) Had a regular practice, now restarting. These tiers matter because Tier 1 users need technique mechanics explained step by step, while Tier 4 users benefit from a shorter review and a focus on anchoring.
- **Available daily time** -- Ask for a number in minutes. The critical thresholds are: 5 minutes (single technique, no secondary practice), 10 minutes (primary technique with secondary introduced Week 3), 15-20 minutes (primary technique plus secondary technique as a regular alternating pair by Week 2), 25+ minutes (full multi-technique sequence with journaling option). Do not design a plan that exceeds the user's stated available time by even one minute.
- **Preferred practice time of day** -- Morning (most researched for consistency), midday (highest dropout rate, needs strongest anchoring), evening (effective for sleep prep, lowest focus-training benefit). This determines technique selection because Body Scan is contraindicated as a morning practice for users who report morning grogginess.
- **Primary goal** -- The four most common goals map to technique priorities: stress reduction (Body Scan + Breath Awareness), focus and cognitive performance (Breath Awareness with counting), sleep quality (Body Scan in bed, no closing ritual), emotional awareness and regulation (RAIN technique + Breath Awareness). General wellbeing and curious exploration (Mindful Observation + Mindful Walking).
- **Physical considerations and constraints** -- Explicitly ask whether the user can sit on the floor, sit in a chair, stand, or walk. Also ask whether they have any conditions affecting sustained stillness (chronic pain, ADHD, restlessness). This determines whether a movement-based primary practice is more appropriate than a seated one.

### Step 2: Determine the Technique Stack

Select 1-2 primary techniques for Weeks 1-2, and 1 secondary technique for introduction in Week 3, using this decision framework:

**Primary technique selection logic:**
- Goal is stress reduction AND experience is Tier 1 or 2: Start with Mindful Observation (external focus, concrete, no abstraction required) for the first 5-7 days, then layer in Breath Awareness.
- Goal is stress reduction AND experience is Tier 3 or 4: Start directly with Breath Awareness or Body Scan.
- Goal is focus/productivity: Start with Breath Awareness with counting (counted exhales build sustained attention faster than non-counted breath awareness -- the count gives the wandering mind a recovery anchor).
- Goal is sleep quality: Body Scan done lying in bed is the primary and only technique. No walking, no observation. The closing ritual is eliminated entirely.
- Goal is emotional awareness: Start with Breath Awareness as the stabilizing foundation, introduce the RAIN technique (Recognize, Allow, Investigate, Nurture) in Week 3 only after the breath anchor is established.
- User cannot sit still or dislikes sitting: Mindful Walking as the primary technique, Mindful Observation as secondary.

**The four core techniques -- detailed mechanics:**

**Breath Awareness:**
The fundamental technique. Attention is directed to the physical sensation of breathing -- the slight coolness and dryness of inhaled air at the inner nostrils, the slight warmth and humidity of exhaled air, the rise and fall of the chest or belly. The instruction is never to control the breath but to observe it as it naturally occurs. The key sub-technique for beginners is labeling: silently noting "in" on the inhale and "out" on the exhale at about 10-20% of mental volume, like a quiet background narration. When the mind wanders (which it will, every 10-60 seconds for most beginners), the instruction is to notice the thought without engaging it, briefly label it ("thinking," "planning," "remembering"), and return attention to the breath. This noticing-and-returning motion IS the practice; it is not a failure or interruption of the practice. Effective duration range: 3-20 minutes. Minimum meaningful dose: 3 minutes of sincere attention. Optimal consistency-building starting point: 5 minutes.

**Body Scan Meditation:**
Systematic, deliberate movement of attention through the body from toes to crown (or crown to toes for users who want a more grounding effect). The scanning pace is critical: approximately 20-30 seconds per region, with 10-12 distinct regions (left foot, right foot, lower legs, upper legs, pelvis and lower abdomen, belly, chest, hands and forearms, upper arms and shoulders, neck and throat, face and scalp, crown and top of head). The instruction is to notice whatever sensation is present in each region -- warmth, coolness, tingling, pressure, tension, numbness, pulsing -- without trying to change it. If no sensation is noticeable, that absence is itself something to observe. Body Scan is best practiced lying down (savasana posture with a thin pillow under the head) or seated with eyes closed. It is the single most effective technique in this set for sleep preparation and for users whose stress manifests primarily as physical tension. Full 45-minute clinical MBSR body scans are not appropriate here; a 10-12 minute condensed version that covers all regions is the target format. Do not start beginners with more than 10 minutes.

**Mindful Observation:**
Choosing a single sensory object -- a plant, a mug, a candle flame, a piece of fruit, a texture on the wall -- and sustaining full, curious attention on it for 2-5 minutes. The instruction is to look at the object as if encountering it for the very first time, noticing details that habitual perception filters out: how many distinct colors exist in what appears to be a single shade, the precise texture of a surface that the brain has categorized as simply "smooth," the way light behaves differently on different faces of the object. This technique bypasses the beginner's most common obstacle (anxiety about "doing it right") because the object provides a concrete, external anchor. It also activates what researchers call "beginner's mind" -- a quality of perception that is central to all mindfulness practice. Effective duration: 2-5 minutes. Can also be practiced with sounds (mindful listening to ambient noise) or tastes (eating one raisin or piece of chocolate over 3 minutes). The food-based version (mindful eating) is particularly useful for users whose goal includes stress-related eating awareness.

**Mindful Walking:**
Walking at 30-50% of normal pace in a short circuit (10-20 feet) or a longer outdoor path, with attention directed to the specific physical sensations of each step: the heel contacting the ground, the weight rolling from heel to ball of foot, the toe pushing off, the brief float of the foot in the air before the next heel strike. The instruction is to feel the floor or ground as if your feet have never felt it before. A basic synchronization is 3 steps per inhale and 3 steps per exhale; if this feels forced, allow the breath to find its natural rhythm and focus purely on foot sensation. For outdoor walking, practitioners can periodically shift to sensory check-ins: notice 3 things you can see, 2 things you can hear, 1 thing you can feel on your skin (wind, temperature). Effective duration: 5-15 minutes. This is the best technique for users with restlessness, ADHD traits, or chronic physical tension from sedentary work.

**RAIN Technique (introduced Week 3+ only, for emotional awareness goals):**
A four-step micro-protocol for working with difficult emotions during practice: Recognize (name what is present: "there is anxiety," "there is frustration"), Allow (decide to let it be present rather than suppressing or analyzing it), Investigate (with gentle curiosity, ask: where does this emotion live in the body? What does it feel like physically?), Nurture (offer yourself the same kindness you would offer a close friend experiencing the same feeling). This technique is not a primary starting technique. It requires the foundation of Breath Awareness to work effectively, because the practitioner needs an anchor to return to after the investigation phase.

### Step 3: Design the Session Architecture

Every practice session -- regardless of total duration -- follows a three-part structure. The proportions scale with total available time.

**Opening Ritual (always 1 minute, never skip this):**
A consistent sensory signal that practice is beginning. The specific protocol: sit or take your chosen posture, set a timer, take exactly 3 deliberate breaths (4 seconds inhale through the nose, pause 1 second, 6 seconds exhale through the mouth -- this activates the parasympathetic nervous system via the elongated exhale). On the third exhale, release deliberate breath control and allow breathing to return to its natural, unmanipulated rhythm. The opening ritual serves as a context cue -- over weeks of use, the ritual itself begins to trigger a settling response before the main practice begins.

**Core Technique Sequence (variable duration based on available time and week):**
The detailed step-by-step sequence for the selected technique (see Step 2 for mechanics). Every sequence must include the "when the mind wanders" instruction. Every sequence must specify exact timing for each phase.

**Closing Ritual (always 1 minute, always conscious and deliberate):**
Mirror the opening: 3 slow breaths, then a brief sensory grounding -- notice 1 thing you can see, 1 thing you can hear, 1 thing you can feel against your skin. Then a 10-second intention: simply notice that you have completed the practice. The closing ritual prevents practitioners from shooting straight from meditation back into high-stimulus activity, which can produce a jarring contrast that makes practice feel ineffective.

**Exception: Sleep Body Scan.** Eliminate the closing ritual entirely. The goal is sleep onset, not re-engagement with waking awareness.

### Step 4: Build the 4-Week Progressive Plan

Progression follows a specific protocol for each time tier:

**5-minute available time:**
- Week 1: Opening (1 min) + Core technique (3 min) + Closing (1 min) = 5 min total. Core starts at 3 minutes.
- Week 2: Same structure. Focus shifts from "surviving the duration" to "quality of attention returns."
- Week 3: Introduce 1-minute Mindful Observation during the opening ritual as a warm-up. Core remains 3 min.
- Week 4: User chooses to either extend core by 1-2 minutes (slightly over stated time, now that the habit is formed) or maintain 5 minutes as their sustainable ceiling.

**10-minute available time:**
- Week 1: Opening (1 min) + Core technique (4 min) + Closing (1 min) = 6 min. End 4 minutes early intentionally. Under-promise on duration to build the feel of success.
- Week 2: Opening (1 min) + Core technique (6 min) + Closing (1 min) = 8 min.
- Week 3: Opening (1 min) + Core technique (4 min) + Brief secondary technique (3 min) + Closing (1 min) = 9 min. Alternating days: Days 1/3/5 = primary only extended. Days 2/4/6 = primary + secondary.
- Week 4: Full 10 minutes. Structure freely chosen from the techniques the user now knows.

**15-20 minute available time:**
- Week 1: Opening (1 min) + Core technique (8 min) + Closing (1 min) = 10 min. Reserve 5-10 minutes of stated time.
- Week 2: Opening (1 min) + Core technique (10 min) + Closing (1 min) = 12 min.
- Week 3: Opening (1 min) + Primary technique (7 min) + Secondary technique (5 min) + Closing (1 min) = 14 min.
- Week 4: Full stated duration, technique mix chosen by user.

**25+ minute available time:**
- Add a 3-5 minute free-writing reflection at the end (write one observation from the practice -- not a judgment, just a noticing) beginning in Week 2. This builds meta-awareness of the practice's progress.

### Step 5: Create Habit Anchoring

Habit science distinguishes between time-based cues ("I'll meditate at 7 AM") and activity-based cues ("I'll meditate immediately after I pour my morning coffee"). Activity-based anchoring produces higher consistency because existing habits are deeply encoded behavioral routines that are more reliable than clock-watching.

Provide a specific anchor for the user's stated schedule:
- **Morning practice anchor options (choose one):** After the coffee or tea is poured but before the first sip, after putting on shoes before leaving for work (morning walk option), immediately after making the bed (physical completion creates readiness).
- **Midday practice anchor options:** After closing the laptop for a lunch break, after returning from getting food or coffee, after using the restroom mid-day (the most reliable anchor for office workers -- one they cannot skip).
- **Evening practice anchor options:** After changing out of work clothes, after dinner and before turning on any screen, after brushing teeth at night (strongest evening anchor, combines physical routine with time-of-day predictability).

Always specify a **minimum viable practice (MVP)** -- the smallest possible version of the practice the user commits to doing even on the hardest days. The MVP is always the opening ritual alone: 1 minute, 3 deliberate breaths, sitting in the practice posture. Maintaining the behavioral chain on difficult days preserves the habit even when full practice is impossible. The neurological basis: the cue-routine-reward loop is preserved by any version of the routine, including the MVP, which prevents the "all or nothing" collapse that kills most new meditation habits.

### Step 6: Compile Common Obstacles and Specific Responses

Every practice plan must include at least 4 obstacle-response pairs, drawn from these validated common challenges:

- **"My mind won't stop thinking"** -- The mind producing thoughts is not a problem; it is the mind's function. The practice is not thinking versus not-thinking; it is noticing that thinking is happening and choosing where to place attention. Each redirection is one repetition of the skill. A productive 10-minute session might involve 30-50 redirections. This is not failure; it is high-volume practice.
- **"I fell asleep"** -- Switch from lying down to seated. If seated and still falling asleep, open the eyes to a soft gaze on the floor. If still falling asleep, the body is communicating a sleep debt that mindfulness cannot override; address sleep quantity first.
- **"I missed several days"** -- Resume with no penalty. Do not attempt to compensate with a longer session. Guilt about missing practice is itself a thought to notice and release. Research on habit formation shows that missing 1-2 days does not significantly affect long-term habit consolidation; missing 3+ consecutive days benefits from returning to Week 1 duration (not technique) to rebuild the behavioral association.
- **"I don't feel calmer or different after practicing"** -- The most common realistic timeline: perceptible change in stress reactivity appears after 2-4 weeks of daily practice. The first week of practice typically produces no noticeable shift during daily life. What changes first is speed of awareness -- noticing stress, irritation, or distraction slightly sooner than before. Ask the user to check for this specific shift rather than expecting a general feeling of peace.
- **"I feel more anxious during practice, not less"** -- This is a documented phenomenon, particularly with closed-eye breath awareness in people with high anxiety or panic history. Switch to open-eye Mindful Observation or Mindful Walking immediately. Shorten duration to 3 minutes. If anxiety persists across all techniques, recommend consulting a mental health professional trained in mindfulness adaptations.
- **"I feel bored and restless"** -- Restlessness is a legitimate object of mindful observation. Instruct the user to notice the restlessness itself: where does it sit in the body, what quality does it have, does it shift while being observed? This reframe converts what feels like a problem into the actual practice material.

### Step 7: Deliver the Practice Plan

Format the output using the template in the Output Format section below. Ensure:
- Every technique sequence specifies exact timing for every phase in minutes and seconds
- The 4-week plan is presented as a table with all five columns populated with real content
- The habit anchor is specific to the user's stated schedule (no generic "pick a time")
- The obstacle table has at least 4 rows with fully written responses (no [placeholder] text)
- Total session durations in the Week 4 plan exactly match the user's stated available time
- If the user's goal was sleep, the Body Scan plan omits the closing ritual and notes this explicitly

---

## Output Format

```
## Personalized Mindfulness Practice Plan

**Experience Level:** [Tier 1: Never tried / Tier 2: Tried a few times / Tier 3: Occasional / Tier 4: Restarting]
**Daily Time Available:** [X] minutes
**Preferred Practice Time:** [Morning / Midday / Evening]
**Primary Goal:** [Stress reduction / Focus / Sleep quality / Emotional awareness / General wellbeing]
**Physical Setup:** [Chair / Floor cushion / Lying down / Walking route]

---

### Core Technique: [Technique Name]

**Why this technique for your goal:** [1-2 sentence rationale specific to this user's goal]

**Setup:**
- Posture: [specific posture with body position details]
- Environment: [light, noise, phone, seating specifics]
- Timer: Set for [X minutes] so you do not need to monitor time manually

**Opening Ritual (1 minute):**
1. Take your chosen posture and set the timer
2. Inhale slowly through your nose for 4 seconds
3. Pause for 1 second at the top of the inhale
4. Exhale slowly through your mouth for 6 seconds
5. Repeat for 2 more breaths, then release control of the breath and let it find its natural rhythm

**[Technique Name] Sequence ([X] minutes):**
1. [Specific instruction with timing, e.g., "0:00-0:30: Direct attention to..."]
2. [Next phase instruction with timing]
3. [Continue for all phases of the technique]
4. [Include sensory specificity: temperature, texture, pressure, sound]
5. [Final phase before closing]

**When the mind wanders:**
[Full, specific instruction -- not a placeholder. Include: what wandering looks like, what to do when noticed, how to return, and the framing that normalizes wandering as the practice itself]

**Closing Ritual (1 minute):**
1. Take 3 slightly deeper breaths without controlling the exact timing
2. Gently notice one thing you can see, one thing you can hear, one thing you can feel against your skin
3. Recognize that you have completed the practice -- a brief, deliberate acknowledgment, not an evaluation

---

### Secondary Technique: [Technique Name]
*(Introduced in Week [X])*

**Why this technique as secondary:** [1-sentence rationale]

**Setup:**
- [Physical setup for this technique]

**[Technique Name] Sequence ([X] minutes):**
1. [Specific instruction with timing]
2. [Next phase]
3. [Continue for all phases]

**When the mind wanders:**
[Full specific instruction for this technique's specific distraction patterns]

---

### 4-Week Progressive Plan

| Week | Days/Week | Technique(s) | Session Structure | Total Duration | Focus |
|------|-----------|--------------|-------------------|----------------|-------|
| 1 | 5-7 | [technique] | Open (1) + Core (X) + Close (1) | [X] min | [specific focus for this week] |
| 2 | 5-7 | [technique] | Open (1) + Core (X) + Close (1) | [X] min | [specific focus for this week] |
| 3 | 5-7 | [A / B alternating] | Open (1) + Primary (X) + Secondary (X) + Close (1) | [X] min | [specific focus for this week] |
| 4 | 5-7 | [user's chosen mix] | Open (1) + [technique mix] + Close (1) | [X] min | [specific focus for this week] |

---

### Habit Anchor

- **Anchor event:** [specific existing habit from user's schedule, not a clock time]
- **Full practice trigger:** [Exact description: "Immediately after you _____, sit down and set the timer before doing anything else"]
- **Minimum viable practice (MVP):** [Exact description of the opening ritual alone, 1 minute maximum]
- **Tracking method:** [Simple, zero-friction method: check mark on a paper calendar or a single-column note in a phone app. No streak-tracking apps required.]
- **Target consistency:** 5 out of 7 days per week. Not 7 out of 7. A realistic target prevents the all-or-nothing dropout pattern.

---

### Common Obstacles and Responses

| Obstacle | Response |
|----------|----------|
| "My mind won't stop thinking" | [Full response, not a placeholder] |
| "I fell asleep during practice" | [Full response] |
| "I missed several days" | [Full response] |
| "I don't feel any different after two weeks" | [Full response] |
| [Fifth obstacle specific to this user's goal or technique] | [Full response] |
```

---

## Rules

1. **Never exceed the user's stated available time in the Week 4 plan.** If the user said 10 minutes, the fully developed Week 4 practice totals exactly 10 minutes including opening and closing rituals. Not 11, not 12. Exceeding the stated time erodes trust and contributes to plan abandonment.

2. **Never instruct the user to empty the mind, stop thinking, or clear thoughts.** These instructions are technically inaccurate (the default mode network continues generating thoughts regardless of meditation experience) and set a standard of failure that no practitioner can meet. Always use "notice and return" language: "when you notice the mind has wandered, gently guide attention back."

3. **Never start a complete beginner on more than 5 minutes of core technique in Week 1.** The research on meditation dropout consistently shows that sessions exceeding the practitioner's current attention capacity produce frustration rather than skill. The Week 1 core technique duration must be short enough that the user finishes feeling capable, not defeated.

4. **Always include the "when the mind wanders" instruction for every technique in the plan.** This is the single most common source of practitioner discouragement. If a technique sequence is written without this instruction, it is incomplete regardless of how detailed the rest of the sequence is.

5. **Do not recommend the Body Scan as the primary morning technique for users who report morning grogginess or difficulty waking.** The deeply relaxing, systematic nature of the Body Scan can intensify morning grogginess or produce sleep onset in people who are not yet fully alert. Morning practice for these users should begin with Mindful Walking or open-eye Mindful Observation, which engage alertness rather than deepen relaxation.

6. **Do not introduce the RAIN technique before Week 3 and not at all unless the user's primary goal is emotional awareness.** RAIN requires a stable breath anchor as a return point after the investigation phase. Introducing it to a beginner without this foundation is likely to produce rumination rather than mindful investigation, which is counterproductive.

7. **If the user reports that practice produces anxiety, dissociation, intrusive thoughts that worsen, or emotional distress that persists after the session ends, provide this specific guidance:** Pause the practice, switch to an externally focused technique (Mindful Observation, Mindful Walking), and if distress persists across sessions, consult a mental health professional trained in trauma-sensitive or clinical mindfulness approaches. Do not attempt to counsel through this distress within this skill.

8. **Always specify exact timing within technique sequences.** Instructions like "spend a moment on each body part" or "focus on your breath for a while" are not acceptable. Every phase needs a clock reference: "0:00-0:30," "30 seconds," "2 minutes." Ambiguous timing is a major source of beginner uncertainty and session drift.

9. **Do not reference any religious tradition, spiritual lineage, or cultural framework for mindfulness unless the user explicitly requests one.** The evidence-informed wellness framing (attention training, nervous system regulation, habit formation, cognitive skill development) is the appropriate frame for this skill. Unsolicited religious or spiritual framing can alienate secular users and exceeds the scope of a wellness skill.

10. **Always pair the 4-week plan with a specific activity-based habit anchor, not a time-based one.** "Meditate at 7 AM" is a time-based cue that fails when the morning routine varies. "Meditate after you pour your morning coffee" is an activity-based cue tied to an existing behavioral chain that persists through schedule variation. Activity anchors produce reliably higher habit consolidation rates.

11. **Do not include more than 3 distinct techniques in any single session plan.** More than 3 techniques in one session reduces the depth of practice with each technique and increases cognitive switching cost. More techniques does not equal more benefit. Depth with fewer techniques consistently outperforms breadth.

12. **Treat the 5-out-of-7 consistency target as non-negotiable in the plan.** Never set a 7-day streak target for new practitioners. Perfect consistency targets activate the all-or-nothing thinking pattern that causes practitioners to abandon the entire practice after missing one day. Explicitly state the 5-out-of-7 target and explain why it is intentionally imperfect.

---

## Edge Cases

### User Reports Prior Negative Experience with Meditation ("It made my anxiety worse")
This is a clinically documented phenomenon called meditation-induced anxiety, reported in approximately 5-8% of new practitioners attempting closed-eye breath awareness. Do not dismiss the experience or insist they try again the same way. Recommend a complete switch to Mindful Observation with eyes open, focused on a concrete external object. The external focus prevents the self-referential thought loops that can amplify anxiety during internal-focus techniques. Shorten the starting duration to 2-3 minutes. If open-eye techniques also produce anxiety, recommend consulting a mental health professional before building a practice. Do not push through persistent practice-induced distress with wellness-level guidance.

### User Has ADHD or Reports Extreme Restlessness During Stillness
Design the entire practice around Mindful Walking as the primary technique. Seated meditation is culturally prevalent but not required for effective mindfulness practice. Mindful Walking engages proprioceptive and kinesthetic attention channels that are more accessible for people with high attentional variability. For sitting-adjacent practice, use very short Mindful Observation bursts (90 seconds maximum) with physical object manipulation -- holding the object and exploring it tactilely rather than only visually. The body scan is generally not recommended for this user profile until a stable walking practice is established.

### User Is Designing a Sleep-Specific Practice
The entire session structure changes. The Body Scan is the only appropriate technique. It is performed lying in bed, under the covers or on top of them, with lights off or dimmed. The opening ritual is reduced to a single slow deliberate exhale. There is no closing ritual. The timer is not set -- the goal is sleep onset, not practice completion. The scanning direction is reversed from the standard (crown to toes, rather than toes to crown) because the downward direction is associated with the physical sensation of heaviness and settling, which aids sleep onset. If the practitioner reaches the toes without sleeping, they silently return to the crown and begin again. Note explicitly: this is sleep preparation, not a treatment for insomnia. Persistent sleep difficulties require medical evaluation.

### User Has Very Limited Time (5 Minutes or Less)
Resist the impulse to apologize for the brevity or to suggest the user "find more time." Five minutes of consistent daily practice produces measurable changes in perceived stress after 4-6 weeks and is superior to occasional 30-minute sessions. Design the entire plan within 5 minutes: 1-minute opening ritual, 3-minute core technique (Breath Awareness or Mindful Observation), 1-minute closing ritual. Do not attempt to fit secondary techniques into 5 minutes -- depth with one technique is more effective than shallow contact with two. State clearly that 5 minutes is a complete, sufficient practice, not a placeholder until the user has more time.

### User Is Restarting After a Previously Abandoned Practice
Do not start from Week 1 of the full sequence as if they are a complete beginner. They have embodied knowledge of the techniques even if they have not practiced recently. Conduct a brief assessment: which technique felt most natural, what caused the practice to lapse (time pressure, loss of motivation, moved house, life event), what was the longest successful streak. Use this information to design a restart plan that: begins at 50-75% of their previous duration, re-establishes the habit anchor (often the previous anchor broke when life changed), and addresses the specific obstacle that caused the lapse. Week 1 of the restart plan is anchor re-establishment, not technique re-learning.

### User Has Physical Limitations Affecting All Standard Postures
If the user cannot sit upright, stand, or walk due to illness, disability, or recovery from surgery, the Body Scan lying down is the primary option. Mindful Observation can be practiced in any position from a lying or reclined posture by choosing an object within the visual field (ceiling texture, the pattern of light through a window, an object on a bedside table). Explicitly validate that lying-down practice is complete, legitimate mindfulness practice -- it is not a compromise. Mindful Listening (choosing a sound in the environment -- ambient noise, a fan, birds outside -- and attending to it with full sensory curiosity) is an additional option that requires no physical movement whatsoever and is fully equivalent in attention-training value to visual Mindful Observation.

### User Asks About Measuring Progress
Provide specific, realistic indicators of progress that do not rely on subjective "feeling calmer" reports. Observable signs of developing mindfulness skill include: (1) Noticing mind-wandering sooner -- the gap between when the mind leaves the breath and when the practitioner notices shrinks from minutes to seconds over weeks of practice. (2) Brief moments of noticing stress, irritation, or reactivity in daily life slightly before acting on them -- the pause between stimulus and response beginning to lengthen. (3) Occasionally noticing sensory details in daily life (the sound of the shower, the temperature of a door handle) that previously went unregistered. Frame progress as skill development measured in awareness granularity, not as emotional state or feeling. The feeling of peace during practice often follows skill development rather than preceding or accompanying it.

---

## Example

**User Input:** "I've never meditated before. I have about 10 minutes each morning before work starts. I'm mainly trying to reduce stress -- work has been overwhelming lately and I want to start my day more grounded. I sit at a desk all day so I'd prefer not to sit on the floor. I can use a kitchen chair."

---

## Personalized Mindfulness Practice Plan

**Experience Level:** Tier 1 -- Never tried
**Daily Time Available:** 10 minutes
**Preferred Practice Time:** Morning, before work
**Primary Goal:** Stress reduction, starting the day grounded
**Physical Setup:** Kitchen chair, seated upright

---

### Core Technique: Breath Awareness

**Why this technique for your goal:** Breath Awareness is the most direct way to activate the parasympathetic nervous system -- the branch of the autonomic nervous system responsible for the calming response -- and it builds the quality of deliberate, non-reactive attention that reduces stress reactivity over time. For mornings specifically, it creates a clear boundary between rest and work that trains the nervous system to begin the work day from a settled state rather than an anxious one.

**Setup:**
- Sit in your kitchen chair with both feet flat on the floor, hip-width apart. Do not cross your legs.
- Rest your hands on your thighs, palms down or palms up -- whichever feels more comfortable.
- Sit upright without rigidity: imagine a string pulling gently upward from the crown of your head, allowing the spine to find its natural tall alignment without forcing it.
- Set a phone or kitchen timer for the session duration and place it face-down so you cannot see the screen.
- If the room is loud, that is fine -- you do not need silence.

**Opening Ritual (1 minute):**
1. Settle into the chair. Close your eyes fully, or, if closing eyes feels uncomfortable, lower your gaze to a point on the floor about 3 feet in front of you and let your vision go soft and unfocused.
2. Inhale slowly through your nose for a count of 4 seconds.
3. Pause gently at the top for 1 second -- no straining, just a brief rest.
4. Exhale slowly through your mouth for a count of 6 seconds. Let the exhale be longer than the inhale; this is what activates the calming response.
5. Repeat this deliberate breathing cycle two more times (3 cycles total).
6. On the third exhale, release all control of the breath. Let it return entirely to its natural, uncontrived rhythm. This transition from controlled to natural breathing is the beginning of the main practice.

**Breath Awareness Sequence (4 minutes in Week 1):**

- **0:00-0:30:** Direct your attention to the very tip of your nostrils. Notice the slight coolness and dryness of the air entering on the inhale. Notice the slight warmth and softness of the air leaving on the exhale. You do not need to make the breath any different from how it naturally is -- just notice it exactly as it occurs.
- **0:30-1:30:** Narrow your attention to the specific physical boundary where inhale transitions to exhale and exhale transitions to inhale. These are brief pauses that the mind rarely notices. See if you can detect them.
- **1:30-3:00:** Broaden your attention slightly to include the rising and falling of your chest or belly with each breath. If you place one hand on your belly, you can feel the slight swell on the inhale and the slight deflation on the exhale. Let your attention rest there, following each cycle.
- **3:00-4:00:** Allow your attention to hold both the nostril sensation and the belly or chest movement simultaneously, like a wide lens taking in both points at once. Continue following the natural breath wherever it is most vivid.

**When the mind wanders:**
Your mind will leave the breath -- repeatedly, and quickly. This will happen within the first 30 seconds of practice on most days. This is not a failure. The capacity for mind-wandering is universal and is not a sign that you are doing it wrong or that meditation is not working for you. When you notice that your attention has drifted (you are thinking about your to-do list, replaying yesterday, anticipating the workday), do three things: first, briefly and neutrally label what happened ("thinking," "planning," "remembering") -- use one word, silently, without judgment. Second, release the thought without following it further. Third, gently guide your attention back to the physical sensation of the breath at the nostrils or belly. That's it. That noticing-labeling-returning sequence is one repetition of the core skill. A 4-minute session might involve 15-30 of these redirections. That is a productive session, not a struggling one.

**Closing Ritual (1 minute):**
1. Without opening your eyes yet, take 3 breaths that are slightly deeper than your natural rhythm -- not forced, just a deliberate deepening.
2. Gently wiggle your fingers, then your toes. Roll your shoulders back once.
3. Open your eyes slowly.
4. Before standing or reaching for your phone, notice: one thing you can see in the room, one sound you can hear, one physical sensation (the chair beneath you, the temperature of the air). This brief sensory check-in prevents the jarring transition from a settled state back into high-stimulus activity.
5. You have completed the practice.

---

### Secondary Technique: Mindful Observation
*(Introduced in Week 3, on alternating days)*

**Why this technique as secondary:** After 2 weeks of Breath Awareness, your attention muscle will benefit from a different kind of workout -- one that uses an external anchor rather than the internal anchor of the breath. This variety also teaches you that mindfulness is a portable skill you can apply to anything, not just breathing.

**Setup:**
- Choose one object from your kitchen: a coffee mug, a piece of fruit, a small plant, a salt shaker -- anything with some texture or color variation.
- Hold it or place it on the table at a comfortable distance where you can see it clearly without straining.
- You do not need to close your eyes at any point during this practice.

**Mindful Observation Sequence (3 minutes on alternating days in Week 3):**

- **0:00-0:30:** Look at the object as if you have never seen it before in your life. What is the most obvious color? Now look more carefully -- how many distinct shades can you count within that single apparent color? There are almost always more than three.
- **0:30-1:00:** Shift your attention to texture. Trace every surface with your eyes as if your eyes were your fingertips. If the surface appears smooth, look for micro-irregularities: how does light fall differently on different angles of what seems uniform?
- **1:00-1:30:** Look at the shape. Trace the complete outline of the object with your gaze very slowly, as if you are drawing it. Notice any curves, edges, or proportions you had never registered before.
- **1:30-2:30:** Let your gaze rest on the object as a whole without analyzing any particular feature. Hold it in your full visual field with relaxed, curious attention, the way you might look at a campfire -- not trying to see any specific thing, just seeing.
- **2:30-3:00:** Before the timer sounds, notice one detail about this object that you genuinely did not notice during yesterday's observation of it. The object will reveal something new each time.

**When the mind wanders:**
During Mindful Observation, the mind typically wanders by starting to think about or categorize the object ("this mug needs to be washed," "my mother gave me this plant") rather than simply perceiving it. When this happens -- and it will -- you do not need to restart the sequence. Simply return your gaze to the object and pick up where you left off. The instruction is to see it, not think about it.

---

### 4-Week Progressive Plan

| Week | Days/Week | Technique(s) | Session Structure | Total Duration | Focus |
|------|-----------|--------------|-------------------|----------------|-------|
| 1 | 5-7 | Breath Awareness | Open (1 min) + Breath Awareness (4 min) + Close (1 min) | 6 min | Building the habit and the posture; finishing early is intentional -- success should feel easy |
| 2 | 5-7 | Breath Awareness | Open (1 min) + Breath Awareness (6 min) + Close (1 min) | 8 min | Extending attention duration; noticing that mind-wandering frequency may begin to shift |
| 3 | 5-7 | Breath Awareness (Mon/Wed/Fri/Sun) + Mindful Observation (Tue/Thu/Sat) | Open (1 min) + Primary (4 min) + Secondary (3 min) + Close (1 min) | 9 min | Adding variety; discovering which technique feels most natural for morning practice |
| 4 | 5-7 | User's chosen technique or both | Open (1 min) + Preferred technique(s) (8 min) + Close (1 min) | 10 min | Full target duration reached; self-directed practice established |

---

### Habit Anchor

- **Anchor event:** Your morning coffee or tea preparation. The moment you pour your drink is your cue.
- **Full practice trigger:** Immediately after your drink is poured, bring it to your practice spot (the kitchen chair) and set the timer before taking the first sip. The drink sits with you but you do not touch it until the closing ritual is complete. This creates a small, pleasant reward at the end of each session.
- **Minimum viable practice (MVP):** On days when 10 minutes is genuinely impossible -- you are running late, something urgent happened -- do only the opening ritual: sit in the chair, take the 3 deliberate breaths (about 60 seconds total). That's it. This preserves the habit chain without requiring the full practice.
- **Tracking method:** Put a sticky note or small paper calendar on your refrigerator. Draw a checkmark on each day you practice, including MVP days. No apps, no streaks, no journaling required.
- **Target consistency:** 5 out of 7 days per week. Deliberately not 7 out of 7. Missing 2 days per week is the expected, sustainable pattern. If you achieve 7 days in a week, that is a bonus -- not the baseline expectation.

---

### Common Obstacles and Responses

| Obstacle | Response |
|----------|----------|
| "My mind won't stop thinking -- I can't focus at all" | The goal is not a quiet mind. Your brain is designed to generate thoughts continuously; no amount of practice changes that. What practice changes is how quickly you notice the mind has wandered and how smoothly you return. If you redirected your attention 25 times in a 4-minute session, you did 25 repetitions of the skill. That is not a bad session -- that is training at high volume. |
| "I fell asleep in the chair" | First, this means the opening ritual is working (you are relaxing). To stay awake: sit slightly more upright, keep your eyes open with a soft downward gaze instead of closing them, or try practicing standing for one week. If you consistently fall asleep before work, your body may have a sleep debt that mindfulness cannot fix -- consider whether your sleep duration is sufficient. |
| "I missed 4 days because work got overwhelming" | Resume tomorrow. One session, at the Week 1 duration (6 minutes), no pressure. Do not try to "catch up" with a longer session -- that is not how this skill works. The practice is not a savings account where you deposit extra time to make up for absences. Each session stands alone. The goal is returning, not compensating. |
| "After 2 weeks I don't feel any different" | The changes in this practice appear in a specific order: first, you begin to notice your stress reactions slightly sooner than before -- there is a brief moment of awareness before you are fully swept into the reaction. This is the first shift, and it is subtle. Ask yourself: 'Have I noticed, even once, that I was getting irritated and had a brief window before fully reacting?' If yes, the practice is working. The feeling of being calmer comes later, after the awareness speed has increased. |
| "Some mornings I sit down and feel more stressed, not less" | This is common in early practice. Sitting still and reducing external stimulation can make existing stress more visible, not because practice is making it worse but because the noise that usually covers it is now reduced. This heightened visibility is temporary and tends to resolve by Week 3. If the stress during practice feels escalating rather than simply visible, use the Mindful Observation practice (eyes open, external focus) on those days instead of Breath Awareness. |
