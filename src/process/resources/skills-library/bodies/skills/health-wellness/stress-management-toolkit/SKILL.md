---
name: stress-management-toolkit
description: |
  Builds a personalized stress management toolkit combining multiple evidence-informed techniques (progressive muscle relaxation, box breathing, cognitive reframing prompts, time-blocking for recovery). Gathers the user's primary stressors, available time, and preferences, then produces a structured toolkit with daily and acute-stress protocols.
  Use when the user asks about managing stress, reducing tension, coping with overwhelm, building stress resilience, or creating a stress relief plan.
  Do NOT use for clinical anxiety treatment, trauma processing, workplace harassment situations, or crisis intervention. Do NOT use when the user describes symptoms of panic disorder, PTSD, or severe depression.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness self-care stress-management emotional-health"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Stress Management Toolkit

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health or wellness practices. If you are experiencing a mental health emergency, contact emergency services or a crisis line immediately.

---

## When to Use

**Use this skill when the user:**
- Describes ongoing daily stress from identifiable sources (work deadlines, caregiving demands, financial pressure, academic load, life transitions) and wants structured coping tools
- Asks to build a personalized stress management plan, stress relief system, or coping toolkit
- Reports physical tension symptoms associated with stress -- tight jaw, raised shoulders, shallow breathing, stomach knots, tension headaches -- and wants non-clinical strategies
- Feels overwhelmed but is functional: can describe their situation coherently, is engaging constructively, and is not in acute crisis
- Has tried isolated techniques (breathing apps, occasional walks) without a structured framework and wants a more systematic approach
- Asks specifically about progressive muscle relaxation, box breathing, cognitive reframing, mindfulness-based stress reduction concepts, or time-blocking for recovery
- Is preparing for a predictably high-stress period (exam season, performance review cycle, a medical procedure, a move) and wants a proactive toolkit in place before the stress peaks
- Wants to build long-term stress resilience rather than just address an immediate episode

**Do NOT use this skill when -- use a more appropriate skill or referral instead:**
- The user describes panic attacks with physical symptoms (racing heart, derealization, feeling of dying) -- this requires clinical support, not a general wellness toolkit
- The user references trauma, flashbacks, intrusive memories, or hypervigilance -- trauma-informed care from a licensed professional is required, not self-help techniques
- The user expresses thoughts of self-harm, suicide, or harming others -- immediately provide crisis resources (988 Suicide and Crisis Lifeline in the US) and stop the skill
- The user describes symptoms consistent with burnout so severe they cannot perform basic daily functions -- refer to a licensed mental health professional and a physician, as severe burnout has physiological components
- The user is seeking help with a workplace harassment, discrimination, or conflict situation -- use a conflict resolution or HR guidance skill, not a wellness toolkit
- The user asks about medication, dosage, or whether to start, stop, or change a supplement or prescription for anxiety or stress
- The user is asking for clinical diagnosis, clinical assessment scores (PHQ-9, GAD-7), or a professional opinion on whether they have an anxiety disorder or mood disorder
- The user is a caregiver seeking help for a child under 12 experiencing stress -- child stress management has different developmental requirements and should involve a pediatric professional

---

## Process

### Step 1: Gather the Stress Profile

Ask the user for their stress profile before building anything. Do not skip this step -- the toolkit becomes generic and less useful without it. Gather:

- **Primary stressors (top 2-3):** Work deadlines, relationship tension, financial pressure, health concerns (theirs or a family member's), caregiving, academic demands, job insecurity, social isolation, or major life transitions. If the user says "everything," help them narrow it: ask what took up the most mental energy in the past two weeks.
- **Stress timing pattern:** Does stress peak in the morning (anticipatory), midday (performance/demand), evening (decompression failure), or is it unpredictable? Knowing the timing allows protocol placement.
- **Physical stress signals:** Ask specifically. Common signals include tight or raised shoulders, jaw clenching or grinding, shallow chest breathing, stomach tension or nausea, headache at the temples or base of skull, racing heart, cold hands, or skin flushing. The user's specific signals guide which body-based technique to prioritize.
- **Time available per day:** Collect a realistic number. Ask: "On a typical weekday, how many minutes could you genuinely protect for a stress practice -- not ideal, but real?" Under 5 minutes, 5-10 minutes, 10-20 minutes, or 20+ minutes each call for different toolkit architectures.
- **Previous experience:** What has the user tried? Meditation apps (structure but low specificity), exercise (helps but not always available), journaling (good but often abandoned), talking to friends (useful but dependent on others), or nothing systematic. Knowing what did not stick helps avoid repeating it.
- **Context constraints:** Can the user close a door at work? Do they work from home or an open office? Do they have a private car commute? Physical privacy affects which techniques are feasible during the day.

### Step 2: Screen for Appropriate Fit

Before proceeding, apply this decision gate. If any red-flag indicator is present, do not build the toolkit -- redirect instead.

**Red-flag indicators that require referral:**
- User describes stress as unmanageable for more than 4-6 weeks without any relief periods
- User reports inability to sleep for more than 3-4 nights per week consistently (beyond occasional poor nights)
- User mentions they are not eating, not leaving their home, or not performing basic self-care due to how they feel
- User uses language suggesting hopelessness ("nothing will ever change," "I can't keep doing this much longer") combined with withdrawal behaviors
- User mentions recurring physical symptoms with no identified medical cause (chest pain, numbness, persistent GI distress) -- these need physician evaluation before a stress toolkit is appropriate

If no red flags are present, proceed. If a red flag is present, acknowledge what the user shared, note that what they are experiencing sounds significant, and recommend they speak with a licensed mental health professional or physician as a first step. Do not proceed with toolkit construction.

### Step 3: Select Techniques Using the Three-Layer Framework

A well-built toolkit has three layers, each serving a different function. Select 1-2 techniques per layer, keeping the total technique count between 3 and 6.

**Layer 1 -- Daily Maintenance (resilience building, practiced regardless of stress level):**
These are practiced on a schedule, not on demand. Their function is to lower baseline physiological arousal over time so acute stress spikes are less severe.

- **Progressive Muscle Relaxation (PMR):** The Jacobson technique -- systematically tense each muscle group for 5-7 seconds, then release for 10-15 seconds. Standard sequence: feet, calves, thighs, abdomen, hands, forearms, upper arms, shoulders, face. Full-body protocol takes 15-20 minutes. Upper-body abbreviated version (shoulders, hands, face) takes 5-7 minutes and targets the most common tension sites. PMR is particularly effective for users whose primary stress signal is muscular tension. Evidence shows measurable reductions in cortisol markers with 4+ weeks of consistent practice.
- **Diaphragmatic breathing -- 4-7-8 pattern:** Inhale for 4 seconds, hold for 7 seconds, exhale slowly for 8 seconds. The extended exhale activates the parasympathetic nervous system via vagal stimulation more aggressively than equal-ratio breathing. Best for users who report shallow breathing or chest tightness. Limit to 4 cycles initially -- some users experience lightheadedness during the hold phase.
- **Mindfulness body scan:** 10-minute version: move attention sequentially from feet to crown, spending approximately 30 seconds per body region, noticing sensation without trying to change it. Unlike PMR, there is no tensing -- this is pure observational attention. Best for users who report mental racing and difficulty feeling "settled." Not suitable as a standalone acute-stress tool -- it requires a seated or supine position and quiet.

**Layer 2 -- Acute Stress Response (under 3-5 minutes, available anywhere):**
These are used on demand when stress spikes -- before a difficult meeting, after receiving bad news, during a deadline crunch.

- **Box Breathing (4-4-4-4):** Inhale 4 seconds, hold 4 seconds, exhale 4 seconds, hold empty 4 seconds. The equal-ratio structure is easy to remember under pressure. Used by military and emergency personnel for performance under stress precisely because it requires no special environment. 4 complete cycles takes approximately 64 seconds. Start with 3-4 cycles to avoid lightheadedness. Can be done with eyes open, invisibly, in meetings.
- **STOP Technique:** Stop the current action. Take three slow breaths (no counting required -- just slower than normal). Observe what is present physically and emotionally (name it in plain language: "my jaw is tight, I feel pressured"). Proceed with one deliberate chosen action. Total time: 60-90 seconds. This technique interrupts automatic stress reactivity and reintroduces intentional choice. It is especially valuable for users whose stress is driven by reactive decision-making.
- **5-4-3-2-1 Grounding:** Name 5 things you can see, 4 you can physically touch, 3 you can hear, 2 you can smell, 1 you can taste. Redirects attention from the stress narrative to present-moment sensory experience. Takes 2-3 minutes. Particularly useful when stress involves rumination or anticipatory worry. Less useful for physical tension without mental racing.
- **Physiological sigh:** Two rapid inhales through the nose (the second inhale "tops off" the lungs), followed by a long, slow exhale through the mouth. Stanford research identifies this as the fastest single breathing pattern for reducing physiological arousal because it fully deflates the small air sacs in the lungs that collapse under tense breathing. Takes 5-10 seconds. Can be used as a micro-intervention between the other techniques or as a standalone reset when nothing else is feasible.

**Layer 3 -- Evening Decompression (transition from high-demand to low-demand state):**
These help the nervous system shift out of activation mode. Skipping this layer is common but leads to poor sleep quality and elevated baseline arousal the next day.

- **Stress journaling -- structured three-prompt format:** Write for 5 minutes maximum. Prompt 1: "The most stressful thing today was..." Prompt 2: "It mattered because..." Prompt 3: "One small thing within my control tomorrow is..." The third prompt is critical -- it ends the exercise with agency rather than rumination. Writing by hand is preferable to typing because the slower pace moderates the intensity of the emotional content.
- **Cognitive reframing -- thought record (brief version):** Write the stressful thought. Identify the distortion pattern from this list: catastrophizing ("this will be a disaster"), all-or-nothing thinking ("I completely failed"), mind-reading ("they think I'm incompetent"), fortune-telling ("it will definitely go wrong"), should statements ("I should be handling this better"). Then write one alternative, balanced thought that is genuinely believable -- not falsely positive. False positivity ("everything will be fine!") is not reframing; it is suppression. A good reframe acknowledges difficulty while introducing realistic perspective: "The demo may not go perfectly, but I have prepared adequately and can handle feedback."
- **Progressive relaxation for sleep (abbreviated):** 5-minute version done lying in bed: tense and release legs, then torso, then arms and shoulders, then face, spending 30 seconds on each. No need to complete the full Jacobson sequence -- the abbreviated sequence reduces residual muscular tension enough to support sleep onset. Recommended for users who report lying awake with physical tension.

### Step 4: Match Techniques to the User's Specific Stress Profile

This is where the toolkit becomes personalized. Apply these matching rules:

- **Anticipatory stress (worry before events):** Prioritize cognitive reframing and 5-4-3-2-1 grounding. The anxiety is future-oriented; techniques that redirect to present sensory reality or restructure the worry narrative are most effective.
- **Performance-demand stress (in-the-moment pressure during tasks):** Box breathing and the STOP technique work best because they are brief, invisible, and require no preparation.
- **Physical tension without mental racing:** PMR and diaphragmatic breathing address the somatic signal directly. Body scan and journaling are less effective without a mental component.
- **Mental racing without pronounced physical tension:** Structured journaling, cognitive reframing, and 5-4-3-2-1 grounding address the cognitive loop. PMR may not feel relevant to this user.
- **Decompression failure (can't "turn off" at end of day):** Evening journaling and abbreviated PMR for sleep are essential. Add a transition ritual: a consistent 5-minute activity (tea, a walk around the block, changing clothes) that serves as a behavioral boundary between work mode and rest mode.
- **Unpredictable stress timing:** Emphasize the acute-stress protocol techniques (box breathing, STOP, physiological sigh) since they do not require scheduled practice. Add a daily morning maintenance technique as an anchor.

### Step 5: Assign Time Blocks and Contexts

Place each technique into a specific slot in the user's day based on their reported peak stress times and available time. Follow these time-allocation guidelines:

- **Under 5 minutes available daily:** Build around box breathing (2-3 minutes, morning) + physiological sigh (on-demand) + a 2-minute STOP practice at end of day. This is the micro-toolkit configuration.
- **5-10 minutes available daily:** Morning: box breathing or abbreviated PMR (5 minutes). Acute: STOP or physiological sigh. Evening: stress journal (5 minutes) or abbreviated relaxation for sleep.
- **10-20 minutes available daily:** Morning: box breathing + abbreviated PMR or body scan (10 minutes). Acute: full STOP + box breathing sequence (3 minutes). Evening: structured journaling with cognitive reframing prompt (5-7 minutes).
- **20+ minutes available daily:** Full 15-20 minute PMR OR a 10-minute body scan plus box breathing (morning). Acute protocol. Evening journaling plus sleep relaxation. Consider splitting the morning block into a 10-minute maintenance practice and a 10-minute scheduled cognitive reframing session for identified recurring worry themes.

### Step 6: Build the 7-Day Starter Plan

The starter plan must follow a graduated introduction sequence. Introducing too many techniques at once (more than 2 simultaneously) increases the likelihood of abandonment. The evidence base from habit formation research consistently shows that single-behavior anchoring -- attaching a new practice to an existing routine -- produces better adherence than intention-based scheduling.

- **Days 1-2:** Introduce one technique only -- the one with the highest face validity for the user (the technique that intuitively makes sense to them or addresses their most prominent physical signal). Anchor it to an existing behavior (after morning coffee, before opening email, immediately after parking the car).
- **Days 3-4:** Add the acute stress protocol. The user only uses it if stress spikes, so it does not feel like added work -- it is available when needed.
- **Days 5-6:** Add the evening technique. By this point, the morning routine has two days of repetition, which reduces its cognitive load enough to support adding a second practice.
- **Day 7:** Full toolkit trial day -- all three protocols as assembled.
- Include a weekly review prompt set to help the user self-assess and make evidence-based adjustments before week two.

### Step 7: Add Sustainability Scaffolding

A toolkit without adherence support fails. Include at minimum:

- **One anchor instruction per technique:** Specify the existing behavior each technique attaches to (e.g., "Begin box breathing immediately after your alarm goes off, before getting out of bed"). Free-floating intentions ("I'll do it sometime in the morning") have substantially lower follow-through than anchored intentions.
- **The "minimum viable dose" rule:** Tell the user that on hard days, the minimum viable version is acceptable. For box breathing, 2 cycles instead of 4 still activates the parasympathetic response. For journaling, one sentence still externalizes the stress. The toolkit does not need to be perfect to be useful.
- **A 21-day horizon statement:** Stress management techniques show measurable subjective benefit within 1-2 weeks of consistent use. However, the physiological benefits (lower resting heart rate, reduced cortisol baseline, improved heart rate variability) accumulate over 4-8 weeks. Set realistic expectations: noticeable relief within 1-2 weeks, meaningful resilience within 4-8 weeks.
- **One explicit note about when to seek additional support:** If after 3-4 weeks of consistent toolkit use the user still feels their stress is unmanageable, or if symptoms are worsening, encourage them to speak with a licensed mental health professional. This is not a failure of the toolkit -- it is a signal that more individualized support is appropriate.

---

## Output Format

```
## [User's Name or "Your"] Stress Management Toolkit

> This toolkit is a general wellness resource, not a clinical intervention.
> If your stress feels unmanageable despite consistent practice,
> speaking with a licensed mental health professional is always the right step.

---

### Stress Profile Summary
| Element | Detail |
|---|---|
| Primary stressors | [stressor 1] / [stressor 2] / [stressor 3] |
| Peak stress timing | [morning / midday / evening / unpredictable] |
| Physical stress signals | [e.g., tight shoulders, shallow breathing, jaw tension] |
| Daily time available | [X] minutes |
| Previous approaches | [what was tried] -- [what worked or didn't] |
| Key constraint | [e.g., open office, no private space midday] |

---

### Toolkit Architecture

**Total techniques selected:** [3-6]
**Layer 1 (Daily Maintenance):** [Technique name(s)]
**Layer 2 (Acute Stress):** [Technique name(s)]
**Layer 3 (Evening Decompression):** [Technique name(s)]

---

### Layer 1: Daily Maintenance Protocol
**Duration:** [X] minutes
**When:** [Specific anchor -- e.g., "Immediately after your morning alarm, before getting out of bed"]
**Why this was chosen:** [One sentence connecting technique to user's stress profile]

#### Technique: [Name]
**How to do it:**
1. [Step 1 -- with exact timing in seconds where applicable]
2. [Step 2 -- with exact timing]
3. [Step 3 -- with exact timing]
4. [Step 4 -- continue as needed]

**Total time:** [X] minutes
**Minimum viable dose on hard days:** [e.g., "2 cycles instead of 4 -- takes 32 seconds"]
**Physical sensation to notice:** [e.g., "Warmth spreading in the shoulders as tension releases"]

[Repeat block for second Layer 1 technique if applicable]

---

### Layer 2: Acute Stress Protocol
**Duration:** Under [3-5] minutes
**When:** [Specific trigger situations -- e.g., "Before a sprint demo, after receiving critical feedback, when you notice your shoulders rising"]
**Why this was chosen:** [One sentence]

#### Technique: [Name]
**How to do it:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Total time:** [X] minutes
**Minimum viable dose on hard days:** [e.g., "One physiological sigh -- 10 seconds"]
**Can this be done invisibly (e.g., in a meeting)?** [Yes / No -- with note]

[Repeat block for second Layer 2 technique if applicable]

---

### Layer 3: Evening Decompression Protocol
**Duration:** [X] minutes
**When:** [Specific anchor -- e.g., "Within 30 minutes of closing your laptop for the day"]
**Why this was chosen:** [One sentence]

#### Technique: [Name]
**How to do it:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Total time:** [X] minutes
**Minimum viable dose on hard days:** [e.g., "One sentence for each prompt"]

---

### 7-Day Starter Plan

| Day | Morning Anchor | During-Day (If Needed) | Evening Anchor |
|-----|---------------|------------------------|----------------|
| 1   | [Technique], [X] min -- [anchor behavior] | -- | -- |
| 2   | [Technique], [X] min -- [anchor behavior] | -- | -- |
| 3   | [Technique], [X] min | Acute protocol available | -- |
| 4   | [Technique], [X] min | Acute protocol available | -- |
| 5   | [Technique], [X] min | Acute protocol available | [Evening technique], [X] min |
| 6   | [Technique], [X] min | Acute protocol available | [Evening technique], [X] min |
| 7   | Full Layer 1, [X] min | Full Layer 2 | Full Layer 3, [X] min |

**Anchor behaviors used:**
- Morning: [existing behavior the technique attaches to]
- Evening: [existing behavior the technique attaches to]

---

### Technique Quick-Reference Card

| Technique | Layer | Time | Best For | Invisible? |
|-----------|-------|------|----------|------------|
| [Name 1]  | Maintenance | [X] min | [Context] | [Y/N] |
| [Name 2]  | Acute | [X] min | [Context] | [Y/N] |
| [Name 3]  | Evening | [X] min | [Context] | [Y/N] |

---

### Weekly Review Prompts
Answer these after Day 7. Use the answers to adjust Week 2.

1. Which technique reduced tension most noticeably? What did it feel like in your body?
2. Which stressor was hardest to manage this week? Did the toolkit address it, or did it feel like a poor match?
3. Did you use the acute protocol? In what situation? Did it help?
4. Which technique did you skip most often? What made it hard to do?
5. On a scale of 1-10, how manageable did your primary stressor feel by the end of the week compared to before you started?
6. What one adjustment would make next week's plan more realistic to stick to?

---

### When to Seek Additional Support
If after 3-4 weeks of consistent practice your stress still feels unmanageable, is worsening, or is interfering with sleep, work, or relationships, speaking with a licensed mental health professional is the right next step. A therapist can offer individualized strategies that go beyond what a general wellness toolkit can provide -- this is a sign of good self-awareness, not failure.
```

---

## Rules

1. **Never assess or diagnose.** Do not use clinical scoring language ("your score suggests moderate anxiety"), do not name clinical conditions as likely possibilities, and do not compare the user's experience to clinical criteria. Use plain language: "stress," "tension," "overwhelm," "feeling pressured," "difficulty winding down."

2. **Never recommend or reference medication.** If the user raises the topic of supplements, adaptogens, CBD, or prescription medication, acknowledge their question and redirect: "That is a question worth raising with your physician or pharmacist -- it is outside what this toolkit covers."

3. **Apply the red-flag screen at Step 2 before building anything.** If any red-flag indicator is present (inability to function, persistent hopelessness, self-harm language, trauma references, panic attack descriptions), stop the skill, acknowledge what was shared with care, and provide a referral. Do not partially proceed.

4. **Cap the total technique count at 6.** More than 6 techniques creates decision paralysis and undermines the premise of the toolkit. If the user has complex needs that seem to require more, it is a signal that professional support is more appropriate than a self-help toolkit.

5. **Every technique must have step-by-step instructions with specific second/minute counts.** Never name a technique without explaining exactly how to do it. "Try progressive muscle relaxation" is not acceptable output. A user must be able to perform the technique from the instructions alone without needing to look anything up.

6. **Every technique must have a stated minimum viable dose.** Users will miss days or have days when the full technique feels impossible. Providing a minimum viable version (2 cycles of box breathing instead of 4, one journal sentence instead of three prompts) prevents the all-or-nothing abandonment pattern that derails most wellness practices.

7. **Use anchoring language, not scheduling language.** "Do this after your morning coffee" is more likely to be followed than "do this at 8:00 AM." Anchor every technique to an existing daily behavior the user has already confirmed they perform.

8. **Separate relationship stress from the toolkit scope.** The toolkit addresses the user's internal stress response -- physiological, cognitive, and behavioral. It does not address interpersonal dynamics, communication strategies, or conflict outcomes. If the user's primary stressor involves another person's behavior, make this boundary explicit: the toolkit helps the user regulate their own response, not change another person's behavior.

9. **Do not assign techniques that conflict with the user's stated physical limitations.** If the user reports chronic pain in specific areas, exclude PMR for those regions. If the user reports respiratory conditions (asthma, COPD), use caution with breath-hold techniques like 4-7-8 or box breathing and default to simple slow exhale breathing or grounding techniques instead.

10. **Treat "nothing has worked before" as useful information, not a contraindication.** When a user reports that multiple techniques have failed, shift the toolkit emphasis to behavioral and environmental techniques (time-blocking, movement breaks, transition rituals, structured journaling) rather than in-the-moment regulation techniques. The failure mode is usually implementation, not the techniques themselves -- but if behavioral approaches also fail consistently, that warrants professional support.

11. **Include the full Weekly Review Prompts block in every output.** The review serves as built-in feedback infrastructure. Without it, the user has no mechanism for evidence-based self-adjustment.

12. **Frame all techniques as "practices" or "tools," not "treatments" or "therapies."** Language matters: "This is a relaxation practice" is appropriate. "This is a therapeutic intervention for stress" is not.

---

## Edge Cases

### User Reports Very Limited Time (Under 5 Minutes Per Day)

Build the entire toolkit around three micro-techniques: the physiological sigh (10 seconds, on-demand, usable anywhere), box breathing (2-3 minutes, morning anchor), and a one-sentence end-of-day journal entry (write a single sentence completing the prompt: "One thing that was hard today was..."). Do not pad the toolkit to fill a 15-minute slot the user does not actually have. A micro-toolkit used consistently outperforms an aspirational 20-minute protocol used twice. Note that results accumulate more slowly at this dose, but they do accumulate.

### User's Primary Stressor Is Relational (Partner, Family Member, Colleague)

Provide the full toolkit focused entirely on self-regulation. Do not include communication scripts, conflict frameworks, or advice about what the other person should do -- those are separate skill domains. Make the framing explicit: "These tools help you manage your own nervous system's response to stress in the relationship. They do not resolve the relationship issue itself. If the relationship situation is significantly impacting your wellbeing, a licensed counselor or therapist can offer individualized support." The cognitive reframing technique is particularly useful here -- help the user identify whether they are engaging in mind-reading ("they don't respect me") or catastrophizing ("this relationship is ruined") as thought patterns contributing to their stress response.

### User Reports Physical Pain Alongside Stress (Chronic Back Pain, Migraine, Fibromyalgia)

Modify the toolkit to exclude PMR for affected muscle groups. Substitute body scan (pure observation, no tensing) and breathing-based techniques for the somatic regulation layer. For migraines specifically, avoid techniques that require sustained concentration when a migraine is active -- suggest using the physiological sigh and 5-4-3-2-1 grounding during a migraine and saving the more structured practices for headache-free periods. Include a note: "Chronic pain and stress have a bidirectional relationship -- each worsens the other. A physician or physical therapist familiar with your pain condition can help identify which relaxation approaches are safest and most effective for your specific situation."

### User Has Tried Multiple Techniques and Reports "Nothing Works"

Avoid dismissing their experience or implying they did not try hard enough. Ask two clarifying questions before rebuilding: (1) "When you tried those techniques, did you use them consistently for at least 2-3 weeks?" and (2) "Did you use them on a schedule, or only when you were already in the middle of feeling stressed?" Most technique failures trace to one of three causes: insufficient consistency (used 2-3 times, then stopped), incorrect timing (using daily-maintenance techniques as acute interventions, which rarely works), or poor technique-stressor match (using a body-based technique for a cognitively-driven stress pattern). Address the identified cause directly. If none of these explanations fit and the user has genuinely been consistent, note that ongoing unresponsive stress despite sustained effort is a signal to consult a licensed mental health professional who can conduct a more individualized assessment.

### User Asks for Techniques to Use During a Panic Attack

Clarify the scope boundary clearly and without making the user feel dismissed: "The techniques in this toolkit are designed for everyday stress and tension -- they work best when the nervous system is activated but not in a full panic response. What you are describing sounds like it may be beyond what a general toolkit can reliably address." Provide the physiological sigh as a single potentially useful tool (it is fast and low-commitment), but emphasize that recurrent panic attacks are a clinical presentation that benefits significantly from professional treatment -- specifically cognitive-behavioral therapy (CBT) with a trained therapist. Do not proceed with the full toolkit construction without first addressing this.

### User Is Preparing for a Specific High-Stress Event (Surgery, Job Interview, Major Presentation)

Build a "countdown" toolkit in addition to the standard structure. For an event 1-2 weeks away: use the daily maintenance protocol to build baseline regulation capacity starting immediately. For 24-48 hours before: add an additional box breathing or abbreviated PMR session in the evening to counter anticipatory arousal that disrupts sleep. For the morning of: use box breathing and STOP immediately before the event. For immediately after: use the physiological sigh to release accumulated tension, followed by a single journal prompt: "It's over. One thing I handled well was..." Post-event processing is often overlooked but prevents stress from an event from carrying forward into subsequent days.

### User Reports Stress That Peaks Unpredictably With No Clear Pattern

When there is no predictable stress timing, anchoring the toolkit to time slots is less effective than anchoring to physical signals. Teach the user to use their physical stress signals as the trigger: "When you notice your shoulders rising, that is your signal to use the acute protocol." This signal-based triggering works for unpredictable stress patterns where time-based anchoring fails. The daily maintenance protocol should still be anchored to a consistent time (morning is usually the most reliable), but the acute and evening protocols become signal-triggered rather than time-triggered.

### User Is a Student During Exam Period or High-Stakes Academic Deadlines

The toolkit emphasis shifts: cognitive reframing becomes more central because exam stress is heavily anticipatory and narrative-driven ("I'm going to fail," "I'm not smart enough"). Box breathing before studying (to reduce cortisol-induced working memory impairment) and after studying (to decompress) serves as the daily maintenance structure. The evening journaling should be done away from study materials, in a different physical location if possible, to prevent the workspace from becoming solely associated with stress. Introduce the concept of scheduled worry time: a 10-minute daily window (not at night) where the student writes all their worry thoughts, then closes the notebook. Outside that window, when worry thoughts arise, the student notes "I'll address that during worry time" -- this technique reduces intrusive academic worry without suppression.

---

## Example

**Input:** "I'm a nurse working three 12-hour night shifts per week. My stress is highest during the shifts -- particularly when we're short-staffed. I notice I clench my jaw and get very tense across my upper back. When I get home after a shift, I can't sleep even though I'm exhausted -- my mind won't turn off. I probably have about 10 minutes total I can realistically commit to. I've tried a meditation app but couldn't follow the voice instructions while I'm actually at work."

---

**Output:**

## Your Stress Management Toolkit

> This toolkit is a general wellness resource, not a clinical intervention.
> If your stress feels unmanageable despite consistent practice,
> speaking with a licensed mental health professional is always the right step.

---

### Stress Profile Summary

| Element | Detail |
|---|---|
| Primary stressors | Short-staffed shifts / high clinical demand / shift work schedule disruption |
| Peak stress timing | During night shifts, particularly during understaffed periods |
| Physical stress signals | Jaw clenching, upper back tension |
| Daily time available | ~10 minutes total |
| Previous approaches | Meditation app -- helpful concept, but voice-guided format unusable during active work |
| Key constraint | Active clinical environment during peak stress -- techniques must be silent, invisible, and instruction-free once learned |

---

### Toolkit Architecture

**Total techniques selected:** 4
**Layer 1 (Daily Maintenance):** Box Breathing 4-4-4-4 (pre-shift) + Abbreviated PMR Upper Body (post-shift, before sleep)
**Layer 2 (Acute Stress):** Physiological Sigh + STOP Technique
**Layer 3 (Evening Decompression):** Three-Prompt Stress Journal (after arriving home, before sleep attempt)

---

### Layer 1: Daily Maintenance Protocol
**Duration:** 5 minutes total, split across pre-shift and post-shift
**Why this was chosen:** Box breathing reduces cortisol-driven baseline arousal before shifts begin, which lowers the height of the stress spikes during shift. Abbreviated PMR targets your specific tension sites (jaw, upper back) and reduces residual muscular tension that is likely contributing to your post-shift inability to sleep.

#### Technique A: Box Breathing (4-4-4-4)
**When:** In your car before entering the hospital -- anchor to "engine off, before opening the car door"

**How to do it:**
1. Sit upright in the driver's seat with your hands resting in your lap, engine off
2. Exhale completely through your mouth to start with empty lungs
3. Inhale slowly through your nose for exactly 4 seconds (count silently: 1-and-2-and-3-and-4)
4. Hold with full lungs for 4 seconds -- do not clench, simply pause
5. Exhale slowly through your mouth for 4 seconds
6. Hold with empty lungs for 4 seconds
7. Repeat for 4 complete cycles

**Total time:** 3 minutes
**Minimum viable dose on hard days:** 2 cycles -- takes 32 seconds. Even 1 cycle activates the parasympathetic response.
**Physical sensation to notice:** Slight drop in shoulder height as you exhale. Jaw may relax slightly on the exhale hold.
**Can this be done invisibly in a clinical environment?** Yes -- no mouth movement or counting required once learned. Use during charting or any brief pause.

---

#### Technique B: Abbreviated PMR -- Jaw, Shoulders, and Upper Back
**When:** In bed after arriving home, before attempting sleep -- anchor to "lying down after getting into bed"

**How to do it:**
1. Lie on your back with arms loosely at your sides
2. **Jaw:** Clench your teeth and tighten your jaw and cheek muscles as hard as you comfortably can for 6 seconds. Then release completely -- let your mouth hang slightly open, feel the jaw muscles go soft. Hold the release for 12 seconds. Notice the warmth and heaviness spreading through your face.
3. **Shoulders:** Draw both shoulders up toward your ears as hard as you can for 6 seconds. Release suddenly -- let them drop. Hold release for 12 seconds.
4. **Upper back:** Press both shoulder blades toward each other as if trying to pinch a pencil between them. Hold for 6 seconds. Release for 12 seconds.
5. Repeat the shoulder sequence one additional time (your primary tension site gets doubled attention).
6. Take three slow, unrestricted breaths. Allow your body to feel heavy.

**Total time:** Approximately 3-4 minutes
**Minimum viable dose on hard days:** Jaw and shoulder sequence only -- 90 seconds
**Physical sensation to notice:** The contrast between tension and release is the active mechanism. The release should feel dramatically different from the tense phase. If it does not, hold the tense phase slightly longer next time.

---

### Layer 2: Acute Stress Protocol
**Duration:** 10-30 seconds (physiological sigh) to 90 seconds (STOP)
**When:** When short-staffing becomes apparent at the start of shift, after a difficult patient interaction, when you notice your jaw clenching during shift, when a situation escalates unexpectedly
**Why this was chosen:** Your work environment prevents voice-guided or lengthy techniques. Both of these require zero equipment, zero preparation, and are completely invisible to patients and colleagues.

#### Technique A: Physiological Sigh (Primary Reset)
**How to do it:**
1. Take a normal inhale through your nose
2. At the top of that inhale, take a second quick sniff through your nose to fully top off the lungs (you will feel the chest lift a second time)
3. Release a long, slow exhale through your mouth -- let it extend as long as naturally comfortable
4. Return to normal breathing

**Total time:** 10-15 seconds
**Minimum viable dose:** This is already the minimum. One execution is effective.
**Why this works at a physiological level:** The double inhale re-inflates alveoli that collapse during tense, shallow breathing, and the extended exhale triggers the strongest parasympathetic activation available in under 15 seconds. Use it as many times as needed throughout a shift -- there is no practical limit.
**Can this be done invisibly?** Yes. It looks like a normal breath to anyone observing.

---

#### Technique B: STOP Technique (for mental escalation)
**How to do it:**
1. **STOP:** Internally tell yourself to pause for 5 seconds. Step to one side if possible -- even one step creates a micro-boundary between you and the stressor.
2. **TAKE** two slow breaths -- inhale for 4 seconds, exhale for 6 seconds. The longer exhale is the key.
3. **OBSERVE:** Silently name what is happening in your body ("jaw is locked, shoulders are up") and what you are feeling ("I feel overwhelmed and unsupported right now"). Naming the state activates the prefrontal cortex and reduces the raw intensity of the stress response.
4. **PROCEED:** Choose one deliberate next action. Do not try to solve the full staffing problem. Choose the single most important next patient action: "I will check on Room 4 first."

**Total time:** 60-90 seconds
**Minimum viable dose:** Steps 1 and 2 only -- 15 seconds. STOP and breathe. The observation and proceed steps add value but are not required.
**Can this be done invisibly?** Yes. It looks like a brief pause to orient yourself, which is normal clinical behavior.

---

### Layer 3: Evening Decompression Protocol
**Duration:** 5 minutes
**When:** After changing out of work clothes at home -- anchor to "clothes changed, before lying down." Do NOT do this while still in scrubs or at your work bag -- create a physical separation.
**Why this was chosen:** Your primary symptom is post-shift racing mind that prevents sleep. Structured journaling externalizes the mental content of the shift -- it moves the thoughts from inside your head to outside, which reduces the cognitive arousal keeping you awake. Writing by hand (not on a phone) is strongly recommended because the slower pace moderates the emotional intensity.

#### Technique: Three-Prompt Stress Journal
**How to do it:**
1. Set a timer for 5 minutes -- having a hard stop prevents the exercise from becoming rumination
2. With a pen and a dedicated notebook (not your phone, not a work app), write responses to these three prompts. Do not re-read as you write -- forward motion only.
   - **Prompt 1:** "The hardest moment of tonight's shift was..."
   - **Prompt 2:** "I am still thinking about it because..."
   - **Prompt 3:** "One thing I did well tonight, however small, was..."
3. Close the notebook. Do not re-read. The act of closing it is a deliberate signal that the shift is contained.
4. The third prompt is the most important. Ending on a competence statement rather than a problem statement changes the emotional residue you carry into sleep.

**Total time:** 5 minutes
**Minimum viable dose on hard days:** One sentence per prompt. Three sentences. That is sufficient.
**Note on Prompt 3:** This is not toxic positivity. It is not "everything was fine." It is finding one genuine thing -- "I correctly identified Mrs. Chen's deteriorating vitals before anyone else did" or "I got through a double crisis without losing composure." Every shift contains at least one.

---

### 7-Day Starter Plan

| Day | Pre-Shift (In Car) | During Shift (On Demand) | Post-Shift (At Home) |
|-----|-------------------|--------------------------|---------------------|
| 1 | Box Breathing, 3 min -- after turning engine off | -- | -- |
| 2 | Box Breathing, 3 min | -- | -- |
| 3 | Box Breathing, 3 min | Physiological sigh available | -- |
| 4 | Box Breathing, 3 min | Physiological sigh available | -- |
| 5 | Box Breathing, 3 min | Physiological sigh + STOP available | Three-Prompt Journal, 5 min -- after changing clothes |
| 6 | Box Breathing, 3 min | Full acute protocol | Three-Prompt Journal, 5 min + Abbreviated PMR in bed |
| 7 | Full Layer 1: Box Breathing 3 min | Full Layer 2 | Full Layer 3: Journal 5 min + PMR in bed 3 min |

**Anchor behaviors used:**
- Pre-shift anchor: Engine off in hospital parking lot -- before opening car door
- Post-shift anchor: Changing out of work clothes -- journal immediately after; PMR when lying in bed

---

### Technique Quick-Reference Card

| Technique | Layer | Time | Best For | Invisible at Work? |
|-----------|-------|------|----------|--------------------|
| Box Breathing 4-4-4-4 | Maintenance | 3 min | Pre-shift cortisol reduction, baseline arousal | Yes |
| Abbreviated PMR (jaw/shoulders) | Maintenance | 3-4 min | Sleep onset, post-shift tension release | No (done in bed) |
| Physiological Sigh | Acute | 10-15 sec | Any stress spike, jaw clenching trigger | Yes |
| STOP Technique | Acute | 60-90 sec | Mental escalation, overwhelm during crisis | Yes |
| Three-Prompt Journal | Decompression | 5 min | Post-shift mental racing, sleep interference | No (done at home) |

---

### Weekly Review Prompts

Answer these at the end of your first week of use (after your third shift in the week).

1. Did you notice any difference in upper back or jaw tension by the end of shifts where you used box breathing beforehand versus shifts where you did not?
2. How many times did you use the physiological sigh during shifts? In what kinds of situations?
3. Did journaling after your shift change how quickly you fell asleep? What did you notice?
4. Which technique did you forget or skip? What made it hard to do?
5. On a scale of 1-10, how manageable did short-staffed shifts feel by the end of the week compared to before you started?
6. What one change -- to timing, technique, or duration -- would make next week's plan more realistic?

---

### When to Seek Additional Support
Night shift nursing is one of the highest chronic-stress occupational categories identified in health research. If after 3-4 weeks of consistent practice you still feel that your stress is unmanageable, that you are emotionally depleted most of the time, or that you are dreading shifts in a way that does not lift, speaking with a licensed mental health professional is an important next step. Occupational burnout in healthcare has specific clinical features that go beyond what a self-help toolkit can address -- and seeking support is consistent with the same standard of care you hold for your patients.
