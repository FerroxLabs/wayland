---
name: breathing-exercises
description: |
  Teaches specific named breathing techniques (box breathing 4-4-4-4, diaphragmatic breathing, 4-7-8 breathing, physiological sigh) with step-by-step sequences, timing, and use-case matching. Gathers the user's goal (calm down, energize, sleep, focus) and produces a complete breathing protocol with technique instructions and a practice schedule.
  Use when the user asks about breathing exercises, breathwork techniques, deep breathing for relaxation, calming breathing patterns, or breath control methods.
  Do NOT use for clinical respiratory therapy, hyperventilation treatment, or breathing exercises for diagnosed respiratory conditions.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness self-care breathing stress-management"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Breathing Exercises

> **Disclaimer:** This skill provides general wellness information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before beginning any new wellness practice. If you are experiencing a medical emergency, chest pain, severe shortness of breath, or other acute symptoms, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user explicitly asks to learn a named breathing technique -- box breathing, 4-7-8, diaphragmatic breathing, physiological sigh, resonance breathing, or similar
- A user describes a specific situational goal: calming down before a high-stakes event, falling asleep faster, shaking off afternoon fatigue, or resetting after a stressful interaction
- A user wants a structured daily breathwork routine that combines multiple techniques across morning, midday, and evening windows
- A user asks how to use breathing to regulate heart rate, reduce physical tension, or quiet a racing mind
- A user is curious about the physiological mechanism behind a breathing pattern (why does holding breath calm you, what is the vagus nerve, how does exhale length affect heart rate)
- A user wants a technique they can use discretely in a social or professional setting without drawing attention
- A user wants to build a consistent breathwork habit over days or weeks and needs a beginner-to-intermediate progression plan
- A user asks specifically about breath control for focus, presence, or mental clarity during cognitive tasks

**Do NOT use this skill when:**
- A user has a diagnosed respiratory condition (asthma, COPD, pulmonary fibrosis, emphysema) and is asking for breathing therapy -- refer them to a respiratory therapist or their treating physician, and use the clinical-referral guidance skill instead
- A user is experiencing an active breathing emergency: chest tightness, severe shortness of breath, inability to complete a sentence, or suspected asthma attack -- direct them to emergency services immediately
- A user is asking specifically about high-intensity hyperventilation protocols such as the Wim Hof method, Holotropic breathing, or Tummo breath retention cycles, which involve extended breath holds and deliberate hypoxia that require supervised in-person instruction
- A user describes recurrent panic disorder, chronic hyperventilation syndrome, or breathing difficulties that persist outside of stress -- these require evaluation by a licensed mental health professional or pulmonologist
- A user asks for breathing exercises to manage a specific diagnosed anxiety disorder as a primary treatment modality -- general wellness breathing can complement treatment but does not replace it; redirect to a licensed therapist
- A user wants performance breathwork specifically tailored to a competitive sport (free diving, high-altitude climbing, competitive cycling) -- refer them to a certified sports performance coach or exercise physiologist
- A user describes symptoms that suggest cardiovascular instability (irregular heartbeat, blood pressure extremes, recent cardiac event) and wants to use breath-hold techniques -- exclude all holds and recommend physician consultation before any breathwork

---

## Process

### Step 1: Clarify the User's Primary Goal and Immediate Context

Before selecting any technique, gather enough information to match precisely to physiological need.

- Ask one direct question: "What are you hoping the breathing exercise will do for you right now?" -- accept the first answer and do not probe exhaustively
- Map the stated goal to one of five functional categories: **Immediate Calm** (stress is happening now), **Sustained Calm** (reducing baseline tension over minutes), **Sleep Preparation** (lowering arousal for sleep onset), **Focus and Alertness** (increasing cognitive readiness), or **Daily Foundation** (general practice without a specific acute need)
- If the user mentions a specific trigger (meeting in 5 minutes, can't sleep, mid-panic moment, post-workout cool-down), treat that as a time-constraint and situational-urgency signal -- this overrides general technique preferences
- Note any contraindications the user mentions casually (pregnancy, heart condition, high blood pressure, dizziness during previous breathwork) -- these activate the constraint rules in Step 3
- If the user has never done structured breathwork before, default to the simplest technique for their goal first and offer progression options afterward; do not front-load a multi-technique protocol on a first-time practitioner

### Step 2: Assess Time Available and Skill Level

Technique selection must match the realistic time window and the user's prior experience.

- **Under 60 seconds available:** Physiological Sigh only -- 3 repetitions, 30--45 seconds, no technique other than this works reliably in this window
- **1--3 minutes available:** Physiological Sigh (1 minute) followed by Box Breathing (2 minutes, 3 cycles) -- this is the pre-event protocol
- **3--5 minutes available:** Box Breathing (4--5 minutes, 4--6 cycles) or 4-7-8 Breathing (3 minutes, 4 cycles) depending on goal
- **5--10 minutes available:** Diaphragmatic Breathing (5--7 minutes) as foundation, optionally preceded by a physiological sigh reset
- **10+ minutes available:** Full protocol combining 2--3 techniques with intentional sequencing (energizing or neutral first, then deepening, then grounding)
- For beginners, do not assign breath-holds longer than 4 seconds in the first session -- the discomfort of a 7-second hold in 4-7-8 is a common reason beginners abandon breathwork entirely; build tolerance progressively

### Step 3: Apply Contraindication Filters

Before finalizing technique selection, screen for the following and modify accordingly.

- **Pregnancy:** Remove all techniques with any breath-hold phase. Diaphragmatic breathing (4s inhale, 6s exhale, no holds) and the physiological sigh are safe continuous-flow options. Note that all breathwork during pregnancy should be discussed with their OB or midwife.
- **High blood pressure (self-reported):** Remove breath-hold techniques (Box Breathing, 4-7-8). Approved options: Diaphragmatic Breathing, extended-exhale breathing (4s in, 6--8s out, no holds), Physiological Sigh. Prolonged breath holds increase intrathoracic pressure which can transiently elevate blood pressure.
- **Previous dizziness or tingling during breathwork:** This indicates hypocapnia (CO2 drop from over-breathing). Reduce pace: extend inhale and exhale by 2 seconds each, eliminate any rapid-rhythm techniques entirely. If the user experienced syncope (fainting), advise them to consult a physician before continuing breathwork.
- **Anxiety that worsens with breath focus:** Some users with anxiety disorders experience heightened somatic awareness when they focus on breathing, making anxiety temporarily worse. In this case, default exclusively to the physiological sigh (brief, minimal attentional demand), and frame it as a physical action rather than a meditation. Avoid extended techniques requiring sustained breath attention.
- **Active distress or panic:** Simplify to 3 steps maximum. Do not introduce new concepts during acute distress. One technique, one time, with short simple language.

### Step 4: Select and Sequence Techniques from the Core Library

Match technique to goal using the following authoritative technique profiles.

**Technique 1 -- Physiological Sigh (Double Inhale + Extended Exhale)**
- **Pattern:** Sharp nasal inhale (2s) → second short sharp nasal inhale without exhaling (1s) → slow full mouth exhale (6--8s) → natural pause (1--2s)
- **Repetitions:** 1--3 sighs
- **Total time:** 20--45 seconds
- **Mechanism:** The double inhale re-inflates collapsed alveoli (tiny air sacs), maximizing gas exchange surface area. The extended exhale stretches the heart slightly, slowing heart rate via the baroreflex. Carbon dioxide is offloaded rapidly, which dampens the sympathetic stress response. This is the fastest physiologically documented method to reduce acute stress -- Stanford neuroscience research shows measurable heart rate reduction within a single sigh cycle.
- **Primary use:** Immediate acute stress reset, real-time calming during any situation including public settings
- **Posture:** Any -- this is the only technique in this library that works standing, sitting, lying, or mid-conversation
- **Common error:** Users inhale too slowly on the second inhale. The second inhale must be a short sharp sniff, not a gentle continuation.

**Technique 2 -- Box Breathing (4-4-4-4 / Tactical Breathing)**
- **Pattern:** Nasal inhale 4s → Hold 4s → Mouth exhale 4s → Hold 4s
- **Cycles:** 4--6 cycles
- **Total time:** 3--5 minutes
- **Mechanism:** Equal-phase patterning entrains autonomic nervous system rhythm, producing alert parasympathetic tone -- calm but cognitively sharp, not sedated. The 4-second hold after inhale gently elevates CO2, which counters the hyperventilation pattern common in stress. Equal inhale and exhale prevent the sedating effect of longer exhales, preserving alertness.
- **Primary use:** Pre-performance focus, sustained calm under pressure, pre-meeting composure
- **Posture:** Seated upright only -- slouching compresses the diaphragm and reduces effectiveness by 30--40%
- **Visualization tool:** Trace a square mentally -- inhale = up the left side, hold = across the top, exhale = down the right side, hold = across the bottom. This visualization reduces mind-wandering and is used by military and emergency services professionals for this reason.
- **Common error:** Clenching the throat or tensing the chest during the hold phases. The hold should be a passive pause, not an active muscular contraction.

**Technique 3 -- 4-7-8 Breathing**
- **Pattern:** Nasal inhale 4s → Hold 7s → Mouth exhale 8s (with audible whoosh sound)
- **Cycles:** 4 cycles maximum in a single session (do not exceed this -- the extended holds can cause significant lightheadedness in beginners)
- **Total time:** Approximately 2.5--3 minutes
- **Mechanism:** The 7-second hold allows oxygen saturation of the blood to peak while CO2 accumulates mildly, stimulating the parasympathetic response. The 8-second exhale activates the vagus nerve through extended intrathoracic pressure release, triggering the relaxation response. This exhale-dominant ratio (8s exhale vs. 4s inhale = 2:1 ratio) is the most powerful parasympathetic activator in this library.
- **Primary use:** Sleep onset preparation, calming deep anxiety (non-acute), deep physical relaxation
- **Posture:** Reclined or lying flat preferred -- this technique is sedating and should not be used before driving or tasks requiring alertness
- **Beginner modification:** If 7-second hold is too intense, scale to 4-5-7 (inhale 4s, hold 5s, exhale 7s) for the first 1--2 weeks, then progress to full 4-7-8
- **Common error:** Exhaling before completing the 7-second hold. Use a visual timer or count with internal rhythm. The incomplete hold is the most frequent reason users report "it didn't work."

**Technique 4 -- Diaphragmatic Breathing (Belly Breathing)**
- **Pattern:** Nasal inhale 4s (belly expands outward, chest stays still) → Mouth exhale 6s (belly contracts, navel draws toward spine)
- **Cycles:** 8--12 cycles
- **Total time:** 5--8 minutes
- **Mechanism:** Diaphragmatic breathing activates the diaphragm as the primary breathing muscle instead of the scalene and intercostal muscles used in chest breathing. This increases tidal volume (amount of air per breath), lowers respiratory rate, and creates consistent vagal stimulation through deep thoracic movement. Regular practice over 4--6 weeks measurably reduces resting heart rate and cortisol.
- **Primary use:** Foundation daily practice, chronic stress reduction, baseline nervous system regulation
- **Posture:** Seated with a hand on the belly and a hand on the chest as biofeedback; the belly hand should rise on inhale, the chest hand should not move. Alternatively, lying flat with a book on the belly makes the movement visible.
- **Common error:** Pushing the belly out on the exhale instead of letting it fall naturally. The belly should inflate passively on inhale as the diaphragm descends, and contract gently on exhale as the diaphragm rises.

**Technique 5 -- Resonance Breathing (Coherence Breathing, 5-5 Pattern)**
- **Pattern:** Nasal inhale 5s → Nasal exhale 5s → No holds, continuous flow
- **Cycles:** 10--15 cycles (can be maintained for 10--20 minutes by intermediate practitioners)
- **Total time:** 5--10 minutes
- **Mechanism:** Breathing at approximately 6 breaths per minute (the 5-5 pattern achieves this) creates heart rate variability (HRV) resonance -- the heart rate accelerates on inhale and decelerates on exhale in a synchronous rhythmic wave. This resonance state is associated with improved emotional regulation, reduced anxiety, and improved cognitive performance. Biofeedback research shows that 20 minutes of resonance breathing produces measurable HRV improvements persisting for 4--6 hours.
- **Primary use:** Daily wellness foundation, emotional regulation training, HRV improvement over weeks of consistent practice
- **Posture:** Either seated or reclined -- unlike 4-7-8, this technique does not cause sedation
- **Common error:** Reverting to the mouth for the exhale. Both inhale and exhale must be nasal to maintain warmth, moisture, and the slight resistance that supports the slow 5-second rhythm.

**Technique 6 -- Energizing Rhythmic Breathing (Stimulating Breath)**
- **Pattern:** Sharp nasal inhale 1s → Sharp nasal exhale 1s (equal emphasis, rapid rhythm at approximately 1 breath per second) → 20--30 breath cycles → Stop and breathe normally for 30--60 seconds → Repeat 2--3 rounds
- **Total time:** 3--5 minutes including rest intervals
- **Mechanism:** Rapid nasal breathing stimulates the sympathetic nervous system through increased respiratory rate and carbon dioxide offloading, creating alertness. The short nasal exhale activates the intercostal muscles actively rather than passively, which increases core temperature and metabolic activation. This is the only technique in this library that deliberately increases arousal.
- **Primary use:** Morning activation, overcoming afternoon fatigue, pre-workout mental preparation
- **Posture:** Seated upright with spine fully erect -- this is critical because the rapid breathing requires full diaphragm mobility
- **Contraindication note:** Do not use this technique if the user has reported high blood pressure, epilepsy, recent eye surgery, or is pregnant. The rapid pressure changes are not appropriate for these situations.
- **Common error:** Using the mouth instead of the nose. Nasal breathing during this technique creates the resistance necessary for the stimulating effect. Mouth-only versions reduce efficacy significantly.

### Step 5: Build the Complete Protocol with Exact Sequencing

Combine techniques in an intentional sequence that follows physiological logic.

- **Reset protocols** (acute stress): Physiological Sigh first, then Box Breathing. Never begin with Box Breathing when someone is acutely stressed -- the 4-second hold can feel suffocating to a stressed nervous system.
- **Sleep protocols:** Diaphragmatic Breathing (5 minutes) followed by 4-7-8 (4 cycles). Do not reverse this order. The diaphragmatic phase establishes slow rhythm before introducing holds.
- **Focus protocols:** Box Breathing alone, or preceded by a single physiological sigh to clear residual stress. Do not add sedating techniques (4-7-8) to a focus protocol.
- **Daily foundation protocols:** Resonance Breathing or Diaphragmatic Breathing as the core, with other techniques layered only as situational needs arise.
- **Morning energy protocols:** Energizing Rhythmic Breathing followed by a 2-minute Box Breathing cool-down to arrive at alert-calm rather than jittery arousal.
- Never recommend more than 3 techniques in a single protocol. Two is ideal for most users. Three is acceptable for a full 10-minute daily practice routine.

### Step 6: Deliver Step-by-Step Instructions with Exact Counts

Every technique instruction must include these elements without exception.

- Exact second counts for every phase with a suggested counting method (counting internally, using a visual clock, using a phone timer)
- Number of cycles specified as a definite number, not a range, for the initial recommendation (offer the range as a progression note)
- Total elapsed time stated explicitly
- Posture in a single sentence immediately before the sequence
- One sentence describing what physical sensation to notice as a sign the technique is working
- One modification for beginners who find the standard timing difficult
- Warning to return to natural breathing immediately and sit quietly if dizziness, tingling in hands/face, or visual changes occur

### Step 7: Provide a Technique Selection Reference and Optional Practice Schedule

Conclude every protocol with two components.

- A quick-reference table mapping 5--8 common situations to the best technique, with time estimates -- this gives the user a decision tool for future self-selection without needing to return to the full instructions
- An optional daily practice schedule only if the user has indicated they want to build a habit -- do not add a schedule to a user who asked only for a one-time technique; it creates unnecessary complexity
- For practice schedules, recommend starting with one session per day (evening is physiologically ideal for beginners because parasympathetic techniques are most impactful before sleep) and adding a second session only after 1--2 weeks of consistent single-session practice

### Step 8: Close with Progression Guidance

After delivering the protocol, offer a clear next step.

- State what the user should notice after 1 session, 1 week, and 4 weeks of consistent practice so they have measurable expectations
- Mention that respiratory rate (breaths per minute) is a useful self-monitoring metric -- the average resting adult breathes 12--18 times per minute; consistent breathwork practice over 4--6 weeks commonly reduces this to 10--14 times per minute at rest
- If the user wants to go deeper, point toward heart rate variability (HRV) biofeedback apps as a self-monitoring tool for resonance breathing effectiveness (mention this as a category of tool, not a specific product)
- Remind the user that breathwork is a skill and that the initial feeling of awkwardness or distraction during counting is normal and diminishes within 3--5 practice sessions

---

## Output Format

```
## Breathing Exercise Protocol

**Goal:** [User's stated goal in their own words]
**Functional Category:** [Immediate Calm / Sustained Calm / Sleep Preparation / Focus & Alertness / Daily Foundation]
**Recommended Technique(s):** [Technique name(s) in order of use]
**Total Session Time:** [X] minutes
**Skill Level:** [Beginner / Intermediate]

---

### Technique [#]: [Technique Name]

**What it does:** [1--2 sentences explaining the physiological mechanism in plain language]
**Best for:** [2--3 specific situations]
**Contraindicated for:** [Any specific populations who should skip this technique]
**Total time:** [X] minutes | [Y] cycles

**Setup:**
- Posture: [Single specific posture instruction]
- Hand placement: [Where to place hands and why]
- Environment: [Eyes open or closed; any relevant environmental note]

**Sequence:**
1. [Phase name] -- [Exact timing, breathing route (nose/mouth), specific physical action]
2. [Phase name] -- [Exact timing, what to do physically during this phase]
3. [Phase name] -- [Exact timing, breathing route, specific physical action]
4. [Phase name if applicable] -- [Exact timing]
5. That completes one cycle. Repeat for [Y] cycles total. ([X] minutes elapsed)

**What to focus attention on:** [Specific internal sensation, visualization, or anchor point]
**Working signal:** [1--2 specific physical sensations that indicate the technique is producing the intended effect]
**Beginner modification:** [Reduced timing or simplified version for first-time practitioners]
**Stop immediately if:** [Specific warning symptoms]

---

### Technique [#]: [Technique Name] [if second technique in protocol]

[Same structure as above]

---

### Quick Reference: Which Technique for Which Situation

| Situation | Technique | Time Needed | Key Reason |
|-----------|-----------|-------------|------------|
| [Specific situation] | [Technique name] | [X] min | [1-sentence mechanism explanation] |
| [Specific situation] | [Technique name] | [X] min | [1-sentence mechanism explanation] |
| [Specific situation] | [Technique name] | [X] min | [1-sentence mechanism explanation] |
| [Specific situation] | [Technique name] | [X] min | [1-sentence mechanism explanation] |
| [Specific situation] | [Technique name] | [X] min | [1-sentence mechanism explanation] |

---

### Daily Practice Schedule [include only if user requested habit-building]

| Time of Day | Technique | Duration | Physiological Purpose |
|-------------|-----------|----------|-----------------------|
| Morning | [Technique] | [X] min | [Why this technique fits this time of day] |
| Midday (as needed) | [Technique] | [X] min | [Why this technique fits this time of day] |
| Evening | [Technique] | [X] min | [Why this technique fits this time of day] |

**Week 1:** One session per day, evening only. Focus on posture and breath routing (nose vs. mouth) rather than perfect timing.
**Weeks 2--4:** Add morning session. Begin tracking resting respiratory rate (count breaths for 60 seconds upon waking).
**Month 2+:** Sessions become intuitive. Most practitioners at this stage report 2--3 breaths per minute reduction in resting respiratory rate.

---

### Progression Path

**After 1 session:** [What the user should realistically notice]
**After 1 week:** [What measurable change to look for]
**After 4 weeks:** [What physiological adaptation has likely occurred]
```

---

## Rules

1. **Never provide a technique without exact second counts.** "Breathe slowly" or "breathe deeply" are not instructions -- they are suggestions. Every phase of every technique must have a number attached. "Inhale for 4 seconds" not "take a long inhale."

2. **Never exceed 4 cycles of 4-7-8 breathing in a single session, and never recommend it to a beginner before first checking for dizziness sensitivity.** The 7-second hold is the most physiologically demanding element in this library for untrained users and causes lightheadedness in a meaningful percentage of first-time practitioners.

3. **Never recommend breath-hold techniques to users who mention pregnancy, high blood pressure, cardiovascular conditions, glaucoma, or recent eye surgery.** Breath holds create transient intrathoracic and intraocular pressure increases. Approved substitutions for all these populations are Diaphragmatic Breathing and the Physiological Sigh only.

4. **Always present the Physiological Sigh as the first technique whenever the user needs relief in under 60 seconds.** No other technique in this library produces a measurable calming effect in under one minute. Recommending Box Breathing to someone in acute distress who has 30 seconds is harmful, not helpful -- the hold phases can feel suffocating when the sympathetic nervous system is already activated.

5. **Never recommend the Energizing Rhythmic Breathing technique to users who report anxiety, heart conditions, high blood pressure, epilepsy, or pregnancy.** Rapid sympathetic activation is counterproductive or contraindicated for all of these populations.

6. **Always specify nasal vs. mouth breathing for every phase of every technique.** Nasal and mouth breathing produce different physiological effects: nasal breathing produces nitric oxide which dilates blood vessels, regulates airflow, and warms air; mouth breathing does not. Failing to specify routes leaves the user guessing and reduces technique effectiveness.

7. **Limit every protocol to a maximum of 3 techniques.** More than 3 creates decision fatigue, extends sessions beyond practical length, and fragments the user's attention. If a user asks for multiple goals (sleep AND focus AND anxiety), prioritize the most urgent or stated primary goal and cover the others via the quick-reference table.

8. **If a user reports that focusing on their breathing makes them more anxious or panicky, do not persist with breathing-focused techniques.** This is a known response in some anxiety disorders called "anxiety sensitivity to somatic cues." Reduce to Physiological Sigh only (brief, action-oriented, low sustained attention demand). If this response is consistent, note that a licensed mental health professional can provide desensitization support.

9. **Frame all breathwork as general wellness practice, not medical treatment.** Never say a technique "treats anxiety," "cures insomnia," or "heals stress." Approved language: "activates the calming response," "supports relaxation," "can reduce the physical sensations of stress." The distinction is between physiological support and clinical intervention.

10. **Always include a stop-immediately warning in every protocol.** Specific symptoms requiring immediate return to natural breathing: dizziness, tingling in hands or face, visual disturbances, nausea, or muscle cramping (particularly in hands -- carpopedal spasm can occur from hypocapnia). These indicate CO2 levels have dropped too fast; the correct response is to stop the technique, breathe naturally, and rest. Do not advise the user to push through these symptoms.

11. **When a user has never done breathwork before, start with a single technique only.** The temptation to be comprehensive is counterproductive with beginners. One technique practiced 3 times correctly produces more learning than three techniques practiced once each incorrectly.

12. **Never tell a user to continue a technique they find painful, extremely uncomfortable, or emotionally distressing.** Breathwork should produce mild effort and notable calm -- not distress. Any technique that consistently produces emotional flooding, dissociation, or intense physical discomfort should be discontinued immediately, and the user should consult a licensed mental health professional before continuing.

---

## Edge Cases

### User Is Currently in Acute Panic or High Distress

Acute distress fundamentally changes the appropriate response -- do not treat this like a standard breathwork request.

- Provide Physiological Sigh only. Three steps, brief instructions, no counting beyond "slow and full."
- Format: Step 1 (short sharp nasal inhale), Step 2 (one more short sniff), Step 3 (long slow mouth exhale). Done.
- Do not introduce timing numbers during acute distress -- counting can increase cognitive load and worsen anxiety in the moment.
- After calm returns, offer to walk through a more complete technique if they want one.
- Note clearly but without alarm: if these episodes are recurrent, discussing them with a licensed mental health professional or physician is worthwhile.
- Do NOT begin a multi-step protocol, ask multiple clarifying questions, or deliver a full output format during this moment -- simplicity is the tool.

### User Mentions Pregnancy

Pregnancy modifies the technique library substantially.

- Remove all techniques with any breath-hold phase: Box Breathing, 4-7-8, and Energizing Rhythmic Breathing are all excluded.
- Approved techniques: Diaphragmatic Breathing (4s in, 6s out, no hold) and Physiological Sigh.
- Resonance Breathing (5-5 nasal, no holds) is also generally appropriate but warrants a note to check with their healthcare provider.
- Note explicitly: respiratory dynamics change during pregnancy due to elevation of the diaphragm and increased oxygen demand; what felt comfortable in the first trimester may feel different in the third. Encourage them to monitor their comfort and reduce intensity freely.
- Always close with: "Run this by your OB or midwife before starting a regular breathwork practice, particularly as your pregnancy progresses."

### User Reports Previous Dizziness or Fainting During Breathwork

This is a clinically significant signal -- not something to work around with minor modifications.

- The likely cause is hypocapnia: CO2 drops when breathing rate increases or when extended exhales are used, causing blood vessels to constrict and reducing cerebral blood flow temporarily.
- Modify technique to slow everything down: minimum 6-second inhale, 6-second exhale, zero holds, no rapid breathing.
- Exclude Energizing Rhythmic Breathing entirely.
- Exclude all breath-hold techniques.
- Recommend the user inform their physician before resuming any breathwork practice, as recurrent syncope during breathing can occasionally indicate an underlying cardiovascular or neurological condition that warrants evaluation.
- Do not frame this as "you probably just did it too hard" -- take the symptom seriously.

### User Wants Breathwork for Athletic Performance Preparation

This is within scope as general wellness but has specific nuance.

- Pre-competition focus: Box Breathing (4--5 minutes, 5 cycles) is appropriate -- used by Navy SEAL training programs for exactly this purpose.
- Pre-workout activation: Energizing Rhythmic Breathing (2--3 rounds) raises alertness and core temperature without requiring a warm-up period.
- Sequence for both: Energizing Rhythmic Breathing (2 minutes) → Box Breathing (3 minutes) → natural breathing for 60 seconds → begin activity. This produces the optimal combination of activation and focused calm.
- Post-workout recovery: Resonance Breathing or Diaphragmatic Breathing to downregulate sympathetic activation and accelerate recovery.
- Be explicit that this is general wellness application -- performance-specific breathwork periodization (like training breathing endurance for distance running or the specific mechanics of apnea training for swimmers) should be designed with a certified performance coach.

### User Reports That Breathwork Never Works for Them

This is usually a technique or execution problem, not a fundamental incompatibility.

- The three most common execution errors: (1) breathing through the mouth when nasal breathing is specified, (2) not completing full exhale on extended-exhale techniques, (3) counting too fast (a "4 count" at anxious internal pace is often 2--2.5 actual seconds).
- Ask the user to describe what they tried and exactly what happened. This usually reveals a specific execution error.
- Suggest adding a visual timer for one session to calibrate actual second counts against their internal count.
- If the user is breathing with the chest and can't shift to diaphragmatic, suggest the lying-flat position with a hand or book on the belly -- the physical biofeedback makes the belly movement immediately apparent.
- The physiological sigh is the technique most likely to work for someone who has failed with other techniques, because it requires the least sustained attention, has no counting, and works in seconds.

### User Wants to Build a Long-Term Breathwork Habit Over Weeks

A week-by-week progression prevents early abandonment.

- **Week 1:** One technique, one session per day, evening only. Target: Diaphragmatic Breathing (5 minutes) or Resonance Breathing (5 minutes). Goal: establish the habit hook, not master the technique.
- **Week 2:** Add timing precision -- introduce a visual timer to verify that internal counts are accurate. Most users discover their "4 seconds" is closer to 2.5 seconds in week 1.
- **Week 3:** Add a second session (morning Energizing Breath or Box Breathing) and introduce a second technique to the library. Now the user has a morning and evening technique.
- **Week 4:** Begin tracking one objective metric: resting respiratory rate on waking (count breaths for 60 seconds before getting out of bed). Typical baseline: 14--18 breaths per minute. After 4 weeks of consistent practice, most practitioners see a reduction to 12--15.
- **Month 2+:** Introduce resonance breathing with HRV biofeedback if the user wants to measure progress objectively. HRV biofeedback apps and wearable devices can display real-time HRV changes during breathing sessions, providing measurable evidence of practice effectiveness. This category of tool converts an invisible physiological process into a visible metric and dramatically increases long-term adherence.

### User Asks About the Wim Hof Method or Similar Hyperventilation Protocols

This is outside the scope of this skill but warrants a careful, informative response rather than a dismissive redirect.

- Acknowledge the question directly: the Wim Hof method involves deliberate cyclic hyperventilation followed by prolonged breath holds, which creates hypoxic conditions that produce specific physiological effects (including adrenaline release and altered sensory experience).
- Explain why it is outside this skill's scope: the technique requires supervision for safe practice, involves deliberately lowered blood oxygen saturation, and carries real risk of loss of consciousness (particularly dangerous in or near water, or while driving). Multiple drowning fatalities have been associated with practicing this method in water unsupervised.
- Do not attempt to teach this method through this skill. Direct the user to in-person guided instruction from a certified practitioner if they want to explore it.
- Offer what is within scope: the general wellness techniques in this library achieve meaningful autonomic nervous system regulation without the risks associated with deliberate hypoxia.

---

## Example

**User Input:** "I'm terrible at sleeping. I lie awake for at least an hour every night, my mind races, and I wake up anxious around 3am and can't get back to sleep. I've tried counting sheep, nothing works. Can breathing actually help with this?"

---

## Breathing Exercise Protocol

**Goal:** Fall asleep faster at bedtime; return to sleep after 3am wake-up
**Functional Category:** Sleep Preparation
**Recommended Techniques:** Diaphragmatic Breathing (bedtime foundation) + 4-7-8 Breathing (sleep onset and 3am reset)
**Total Session Time:** 10--12 minutes at bedtime; 3 minutes for 3am wake-up
**Skill Level:** Beginner

---

### Why Breathing Can Help With This Specific Problem

When you lie awake with a racing mind, your sympathetic nervous system (the "alert" system) is still active from the day. Your cortisol may still be elevated, your heart rate slightly above true rest, and your brain pattern-matching for threats rather than releasing into sleep. Breathing doesn't knock you out -- it gives your nervous system a physiological off-ramp. The specific mechanism: slow exhale-dominant breathing stimulates the vagus nerve, which directly slows heart rate and signals the brain that the environment is safe. You are essentially using your own respiratory system as a remote control for your nervous system.

---

### Technique 1: Diaphragmatic Breathing (Bedtime Foundation)

**What it does:** Activates the diaphragm as the primary breathing muscle, slowing respiratory rate and creating consistent vagal stimulation that progressively lowers heart rate and cortisol over 5--8 minutes.
**Best for:** Beginning the sleep transition, reducing the physical tension that accompanies a racing mind
**Contraindicated for:** No contraindications for this technique in the general population
**Total time:** 6--8 minutes | 10--12 cycles

**Setup:**
- Posture: Lying flat on your back, legs uncrossed, arms by your sides or resting on your belly
- Hand placement: Place one hand flat on your belly just below your navel, one hand flat on your chest -- the belly hand should visibly rise as you inhale; the chest hand should remain still. This biofeedback tells you immediately if you're breathing correctly.
- Environment: Lights off or very dim, eyes closed

**Sequence:**
1. **Exhale first** -- before beginning, take a normal exhale through your mouth and let it complete fully. This empties the lungs and gives you a clean starting point.
2. **Inhale** -- breathe in slowly through your nose for exactly 4 seconds. Feel your belly press upward against your hand as your diaphragm descends. If your chest rises instead, deliberately push your belly out with the muscles as you inhale until the pattern clicks.
3. **No hold** -- there is no pause at the top of this inhale. Move directly to the exhale.
4. **Exhale** -- breathe out slowly through your mouth for exactly 6 seconds. Make your lips as if you're breathing out through a straw -- this creates slight back-pressure that slows the exhale. Feel your belly fall and your hand lower as your diaphragm rises.
5. **Natural pause** -- allow a brief 1--2 second rest with empty lungs. Don't force it, don't hold it artificially. If the next inhale begins before 2 seconds, that's fine.
6. That completes one cycle. Repeat for 10--12 cycles total (6--8 minutes elapsed).

**What to focus attention on:** The physical sensation of your hand rising and falling. This is deliberately body-based rather than thought-based -- you are redirecting your attention from mental activity to physical sensation. When your mind drifts (it will), notice it without frustration and return your attention to the hand rising and falling.

**Working signal:** After 4--6 cycles, you should notice your shoulders have dropped away from your ears, your jaw has unclenched slightly, and your legs feel heavier against the mattress. Your breathing rate is slowing naturally. If after 8 cycles none of this has occurred, check that you are fully completing the 6-second exhale -- an incomplete exhale is the most common reason diaphragmatic breathing doesn't produce the expected relaxation.

**Beginner modification:** If 4s inhale/6s exhale feels forced, start with 3s inhale/5s exhale and add one second to each phase each week until you reach 4s/6s.

**Stop immediately if:** You feel dizzy or tingling in your hands or face. Return to normal breathing, rest, and try again tomorrow with slower counts.

---

### Technique 2: 4-7-8 Breathing (Sleep Onset and 3am Reset)

**What it does:** The 7-second breath hold allows blood oxygen to peak and CO2 to accumulate slightly, directly stimulating the parasympathetic nervous system. The 8-second exhale -- twice as long as the inhale -- is the most powerful vagal activation exhale ratio in this protocol library. Together these phases produce a pronounced sedating effect appropriate for sleep onset.
**Best for:** Transitioning from the diaphragmatic breathing foundation into sleep, and as a stand-alone 3am reset
**Contraindicated for:** Pregnancy, high blood pressure, cardiovascular conditions -- contact healthcare provider before using
**Total time:** Approximately 3 minutes | 4 cycles maximum

**Setup:**
- Posture: Lying flat, same position as Technique 1. If 3am wake-up, stay in bed in whatever position you woke in.
- Hand placement: One hand on belly, or both relaxed at your sides
- Environment: Eyes closed throughout

**Sequence:**
1. **Starting exhale** -- through your mouth, exhale completely. Make a whooshing sound as you do -- this is intentional and part of the technique.
2. **Inhale** -- close your mouth. Inhale quietly through your nose for exactly 4 seconds (count: one-one-thousand, two-one-thousand, three-one-thousand, four-one-thousand).
3. **Hold** -- hold your breath for exactly 7 seconds. Keep your throat relaxed -- this is a passive pause, not a muscular clench. If 7 seconds feels very uncomfortable in your first session, stop at 5 seconds and build up over your first week of practice.
4. **Exhale** -- exhale completely through your mouth with a whoosh sound for exactly 8 seconds. Let every last bit of air leave before stopping. The whooshing sound is not optional -- it creates the auditory anchor that helps maintain the 8-second duration.
5. That completes one cycle. Pause for 2 natural breaths, then repeat.
6. Complete 4 cycles total. After the fourth cycle, stop the technique and allow your breathing to become natural. Do not try to continue counting.

**What to focus attention on:** The physical sensation of your rib cage releasing and sinking during the 8-second exhale. Imagine each exhale as the body getting physically heavier and sinking deeper into the mattress.

**Working signal:** After the third or fourth cycle, many practitioners notice their mind has stopped producing complete thoughts -- instead, imagery or fragments appear, which is the hypnagogic state at the threshold of sleep. Your limbs should feel heavy and slightly disconnected. Yawning is common and is a positive signal (yawning is a natural physiological sigh that reinforces the parasympathetic shift).

**Beginner modification:** If the 7-second hold causes anxiety or physical discomfort in the first week, use 4-5-7 instead (inhale 4s, hold 5s, exhale 7s). Progress to full 4-7-8 after 5--7 sessions once the hold feels comfortable.

**For the 3am wake-up specifically:** When you wake at 3am, do not check your phone, turn on lights, or engage in problem-solving. Simply stay lying down, close your eyes, and begin 4-7-8 immediately. Your body is warm and your environment is already calibrated for sleep -- the technique will be more effective at 3am than at bedtime because you are starting from a partial relaxation state rather than a fully alert one.

**Stop immediately if:** You feel dizzy, experience tingling in your hands or face, or feel chest tightness. Return to natural breathing.

---

### Full Bedtime Sequence (How to Combine Both Techniques)

| Step | Action | Duration |
|------|--------|---------|
| 1 | Lie flat, place hands (belly and chest), eyes closed | 30 seconds |
| 2 | Diaphragmatic Breathing: 4s in / 6s out, 10--12 cycles | 6--8 minutes |
| 3 | After last diaphragmatic exhale, pause naturally for 2 breaths | 30 seconds |
| 4 | 4-7-8 Breathing: 4s in / 7s hold / 8s out, 4 cycles | 3 minutes |
| 5 | Allow natural breathing; do not force continuation | ongoing |

**Total bedtime session:** 10--12 minutes. Most practitioners fall asleep during or immediately after Step 4.

---

### Quick Reference: Which Technique When

| Situation | Technique | Time Needed | Why It Works |
|-----------|-----------|-------------|--------------|
| Lying awake, mind racing at bedtime | Diaphragmatic Breathing + 4-7-8 | 10--12 min | Diaphragmatic phase lowers arousal baseline; 4-7-8 delivers sedating parasympathetic activation |
| Woke at 3am, can't get back to sleep | 4-7-8 Breathing alone | 3 min | Body is already partially relaxed; technique rapidly depresses remaining sympathetic activity |
| Anxious before bed, need quick reset before lying down | Physiological Sigh (3 sighs) | 30 sec | Fastest sympathetic downregulation available; use while seated before getting into bed |
| Feel physically tense (shoulders, jaw, chest) | Diaphragmatic Breathing | 6--8 min | Body-focused attention and slow exhale release muscular tension driven by autonomic nervous system |
| Want a daily habit to improve sleep over time | Resonance Breathing (5-5 nasal) | 10 min (evening) | Consistent HRV resonance practice lowers baseline cortisol and resting heart rate over 4--6 weeks |

---

### Daily Practice Schedule

| Time of Day | Technique | Duration | Physiological Purpose |
|-------------|-----------|----------|-----------------------|
| Evening (30 min before bed) | Resonance Breathing -- 5s nasal in / 5s nasal out, no holds, 10--15 cycles | 8--10 min | Begins the parasympathetic shift from waking activity to sleep preparation; trains HRV coherence over time |
| At bedtime (lying down) | Diaphragmatic Breathing → 4-7-8 | 10--12 min | Direct sleep onset protocol; transitions the nervous system from alert to sleep-ready state |
| 3am wake-up (as needed) | 4-7-8 alone | 3 min | Rapid re-sedation without needing to fully wake up |

**Week 1:** Evening Resonance Breathing only. Focus on nasal exhale and maintaining the 5-second rhythm without a timer. Don't add the bedtime sequence yet -- let one habit establish first.
**Weeks 2--4:** Add the full bedtime Diaphragmatic + 4-7-8 sequence. Track how long it takes to fall asleep (rough estimate) and note any change from your baseline 60-minute onset.
**Month 2+:** Most practitioners at 4 weeks of consistent practice report 20--40 minutes reduction in sleep onset time. Resting respiratory rate measured on waking typically drops from 15--18 to 12--14 breaths per minute.

---

### Progression Path

**After 1 session:** You may notice you feel calmer lying in bed and your breathing has slowed, but sleep onset may not change yet. This is normal -- the first session establishes the neural pattern; it does not immediately override weeks or months of conditioned wakefulness.

**After 1 week (7 consistent sessions):** Most users report the 4-7-8 technique now feels comfortable (the 7-second hold no longer feels urgent) and they are falling asleep during or shortly after the fourth cycle. The 3am wake-up may still occur but return-to-sleep time typically shortens.

**After 4 weeks:** Physiological adaptation is underway. Resting heart rate may be measurably lower (1--4 beats per minute reduction is common). Sleep onset typically faster by 15--30 minutes. Some users report that the 3am wake-up frequency decreases. If sleep difficulties persist after 4 weeks of consistent practice, it is worth discussing them with a physician, as persistent sleep disruption can have physiological causes (sleep apnea, thyroid function, hormonal factors) that breathwork alone will not resolve.
