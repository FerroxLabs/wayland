---
name: sleep-hygiene-protocol
description: |
  Builds a personalized sleep hygiene protocol with specific bedtime routines, environment optimization, stimulus control rules, and a sleep-wake schedule. Gathers the user's current sleep patterns, challenges, and constraints, then produces a structured protocol with an implementation timeline.
  Use when the user asks about improving sleep quality, building a bedtime routine, sleep hygiene practices, fixing a sleep schedule, or reducing time to fall asleep.
  Do NOT use for diagnosing sleep disorders, treating insomnia, sleep apnea assessment, or medication-related sleep questions.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sleep mental-wellness self-care stress-management"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Sleep Hygiene Protocol

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health or sleep. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when the user:**
- Wants to improve subjective sleep quality (feeling rested, reducing grogginess upon waking) and asks for behavioral strategies
- Wants to build or rebuild a consistent bedtime routine from scratch
- Reports difficulty falling asleep (sleep onset latency over 30 minutes) and wants non-medication strategies
- Wants to shift their sleep-wake schedule -- earlier bedtime and wake time, later schedule, or tightening weekend-weekday drift
- Asks about sleep hygiene best practices in general terms ("what should I be doing before bed?")
- Wants to optimize their sleep environment (temperature, light, sound, bedding)
- Reports waking feeling unrefreshed despite what they believe is adequate sleep duration
- Is preparing for a period of high cognitive demand (exam, project deadline, new baby) and wants to bank sleep quality improvement now
- Has recently changed time zones domestically and wants a re-anchoring plan (not jet lag recovery -- that is a separate protocol)
- Asks about how daytime behaviors (caffeine, exercise, naps, alcohol, light exposure) affect their nighttime sleep

**Do NOT use this skill when:**
- User describes symptoms consistent with a sleep disorder: chronic insomnia lasting more than 3 consecutive months, witnessed apneic events or loud snoring with daytime sleepiness, restless leg sensations, sudden muscle weakness triggered by emotion, or episodes of falling asleep involuntarily during the day -- refer to a healthcare provider for evaluation
- User asks about sleep medication (prescription or OTC), melatonin dosing, magnesium, or any supplement for sleep -- refer to a healthcare provider or pharmacist
- User's sleep disturbance is clearly caused by an identified medical condition (chronic pain, hyperthyroidism, GERD affecting sleep, psychiatric medication side effects) -- the medical condition must be addressed first; refer to a healthcare provider
- User is a rotating shift worker needing a full circadian rhythm management protocol -- this requires specialized light therapy timing, anchor sleep scheduling, and strategic napping beyond general sleep hygiene
- User reports significant depression, anxiety disorder, PTSD, or bipolar disorder as the primary driver of their sleep problem -- behavioral sleep strategies can complement treatment but should be coordinated with a mental health provider; recommend they discuss sleep hygiene as an adjunct with their provider
- User is asking about pediatric sleep (children under 12) or infant sleep training -- these require age-specific protocols with different physiology and safety considerations
- User asks about sleep and pregnancy -- hormonal and physical changes require specialist input

## Process

### Step 1: Gather Baseline Sleep Data

Ask the user to describe their current sleep situation. You need specific data, not general impressions. If the user provides a vague description ("I sleep badly"), prompt for specifics.

Collect the following data points:
- **Current sleep schedule:** What time do they typically get into bed? What time do they typically fall asleep (estimated)? What time do they wake up? Do they use an alarm or wake naturally? Are weekday and weekend schedules different?
- **Sleep onset latency:** Approximately how long does it take to fall asleep once the lights are off? Under 5 minutes (may indicate sleep deprivation), 10-20 minutes (normal range), over 30 minutes (elevated onset latency, a primary target for the protocol)
- **Sleep continuity:** Do they wake during the night? How many times? How long are they awake before returning to sleep? Are there identifiable triggers (needing to urinate, noise, anxiety, partner, child)?
- **Morning function:** Do they feel rested on waking? Rate on a 1-5 scale if possible. Do they experience significant grogginess that takes more than 30 minutes to clear (sleep inertia)? Do they rely on caffeine to function?
- **Current pre-bed behaviors:** What do they do in the 60-90 minutes before bed? Screen usage (type, duration)? Food and drink consumption? Exercise?
- **Sleep environment:** Can they describe their bedroom? Temperature (do they feel too hot or too cold)? Light sources (streetlights, LED indicators, partner's phone)? Noise sources? Is the bed also used for working, watching TV, or scrolling?
- **Daytime factors:** Caffeine consumption (amount and timing), alcohol use frequency and timing, nap habits, and typical daily exercise

Do not proceed to protocol design until you have at minimum: current and desired wake time, current bedtime, approximate sleep onset time, and the user's primary complaint (can't fall asleep, can't stay asleep, waking too early, or not feeling rested).

### Step 2: Identify the Primary Sleep Problem Pattern and Protocol Priority

Different complaint profiles call for different protocol emphases. Identify which pattern best matches the user's situation before building the protocol.

**Pattern A -- Sleep Onset Difficulty (takes more than 30 minutes to fall asleep):**
- Primary causes: excessive arousal at bedtime (screens, stimulating content, stress), irregular sleep timing, conditioned wakefulness from bed association, caffeine interference
- Protocol emphasis: wind-down routine quality, stimulus control, consistent wake time, bedroom association rules
- Most impactful single change: moving screens out of the bedroom and fixing wake time

**Pattern B -- Sleep Maintenance Difficulty (falls asleep normally but wakes 1+ times for more than 20 minutes):**
- Primary causes: alcohol in the evening, temperature dysregulation, noise disruption, conditioned mid-night arousal, anxiety, sleep apnea (note: if snoring is present, flag for medical evaluation)
- Protocol emphasis: environment optimization (temperature, sound masking), alcohol timing, stimulus control applied to nighttime awakenings, pre-bed progressive muscle relaxation
- Most impactful single change: eliminating alcohol within 3 hours of bed, environment optimization

**Pattern C -- Early Morning Waking (wakes 1-2 hours before desired time and cannot return to sleep):**
- Primary causes: sleep timing is misaligned earlier than needed (circadian phase advance, common in older adults), early morning light exposure, habitual early schedule becoming entrenched
- Protocol emphasis: gradual bedtime delay (push bedtime 15 minutes later every 3 days), blackout window treatment, avoiding bright light until desired wake time
- Flag: Persistent early morning waking that does not respond to behavioral intervention within 2 weeks can be associated with depression -- note this and recommend evaluation if it persists

**Pattern D -- Non-Restorative Sleep (adequate duration but waking unrefreshed):**
- Primary causes: sleep fragmentation from environment, poor sleep architecture from alcohol or late-night eating, sleep-disordered breathing (flag for evaluation), stress load, physical inactivity
- Protocol emphasis: environment quality, alcohol and food timing, daytime exercise, sleep duration adequacy
- Flag: Non-restorative sleep that persists despite optimized hygiene and adequate duration warrants medical evaluation

### Step 3: Build the Sleep-Wake Schedule

The circadian anchor is the single most important element of any sleep hygiene protocol. The wake time -- not the bedtime -- is the primary lever.

**Wake time selection rules:**
- The target wake time should be realistic for the user's life obligations 7 days per week, or as close to 7 as possible
- Weekend wake time should fall within 30 minutes of weekday wake time -- any more creates "social jet lag," which has the physiological equivalent of traveling across time zones every week
- Once wake time is selected, it is held constant even if the user slept poorly the previous night -- this is the mechanism by which sleep pressure builds and improves the following night

**Bedtime calculation:**
- Adults need 7-9 hours of sleep opportunity, with 8 hours covering most of the population adequately
- Add 15 minutes as a sleep onset buffer to account for normal time-to-sleep
- Example: 6:30 AM wake time minus 8 hours sleep minus 15 minutes onset buffer = 10:15 PM target bedtime
- The user's target bedtime is when they should be IN BED with lights off, not when they begin winding down

**Schedule shift planning:**
- If the current wake time differs from the target by more than 60 minutes, a gradual shift is required
- Abrupt large schedule changes are poorly tolerated and typically abandoned within a few days
- Shift the wake time earlier by 15-30 minutes every 2-3 days, adjusting bedtime correspondingly
- The direction always goes: fix wake time first, then walk back bedtime as sleep pressure builds

**Sleep duration adequacy check:**
- Calculate current sleep duration: time from estimated sleep onset to natural wake time
- If the user is sleeping less than 7 hours nightly and reporting daytime impairment, the protocol prioritizes increasing sleep opportunity (earlier bedtime relative to fixed wake time) before optimizing architecture
- If the user sleeps more than 9 hours routinely but still feels unrefreshed, excess time in bed is not the solution -- fragmentation or sleep quality issues are more likely

### Step 4: Design the Wind-Down Routine

The wind-down routine is a 30-60 minute pre-sleep sequence that systematically reduces physiological and psychological arousal. It works by creating consistent pre-sleep cues (Pavlovian conditioning) and by allowing core body temperature, heart rate, and cortisol to begin their natural nighttime decline.

**The four components of an effective wind-down:**

**1. Screen and stimulation cutoff (60 minutes before lights out):**
- Blue light emitted by screens suppresses melatonin production for 90+ minutes. The 60-minute cutoff is the minimum; 90 minutes is ideal for high-sensitivity individuals.
- Equally important as light: stimulating CONTENT (news, social media, arguments, exciting video) activates the sympathetic nervous system regardless of the screen's light output. The phone in night mode with alarming content is still problematic.
- Practical instruction: the phone goes on its charger in a room other than the bedroom at this time. Not on the nightstand. Not face-down. Out of the room.
- Acceptable alternatives: physical book (not e-ink reader with backlight), audiobook at low volume, light conversation, journaling on paper, gentle stretching

**2. Light dimming (45-50 minutes before lights out):**
- Bright overhead lighting (especially white or blue-toned LEDs) signals daytime to the suprachiasmatic nucleus and delays melatonin onset
- Transition to a single warm-toned lamp (2700K or lower color temperature) or candlelight-level illumination
- Smart bulbs set to "sunset" mode or red-spectrum light are ideal
- The bathroom at tooth-brushing time is a common bright-light exposure that disrupts this -- use the lowest bathroom light setting or a small night light for the evening hygiene routine

**3. Thermal transition (30-45 minutes before lights out):**
- Core body temperature must fall by 1-3 degrees Fahrenheit to initiate and sustain sleep
- A warm shower or bath (100-103 degrees F, 38-39 degrees C) taken 30-90 minutes before bed triggers a compensatory vasodilation response -- blood rushes to the skin surface, releasing core heat, accelerating the temperature drop after exiting the shower
- This is one of the most evidence-supported non-behavioral interventions in sleep hygiene literature
- Room temperature should be set between 65-68 degrees F (18-20 degrees C) -- even one person who runs warm may need 63-65 degrees F
- If the user cannot control room temperature (renting, window unit limitations), a fan creates evaporative cooling and white noise simultaneously

**4. Relaxation anchor (final 15 minutes before lights out, in bed):**
- This is done in bed with lights off -- it is the bridge between wakefulness and sleep
- Select ONE technique and practice it consistently (consistency of the anchor matters more than which technique is chosen):
  - **4-7-8 breathing:** Inhale through nose for 4 seconds, hold for 7 seconds, exhale through mouth for 8 seconds. Do 4 cycles. The extended exhale activates the parasympathetic nervous system. Note: some people find the hold phase anxiety-producing initially -- if so, substitute box breathing (4-4-4-4) until comfortable.
  - **Progressive muscle relaxation (PMR):** Systematically tense each muscle group for 5-7 seconds, then release. Start at the feet, work upward to the face. Total duration approximately 10-12 minutes. Most effective for users who report physical tension.
  - **Body scan:** Non-judgmental, sequential attention to each body part without tensing. More passive than PMR. Preferable for users who find tensing muscles activating.
  - **Cognitive shuffle (serial diverse imaging):** Visualize a random, unrelated sequence of benign images -- a sock, a lighthouse, a green door, a horse. The deliberate generation of disconnected imagery mimics the hypnagogic state and disrupts ruminative thought loops. Useful for users whose primary problem is racing thoughts.

### Step 5: Optimize the Sleep Environment

The bedroom environment should function as a consistent physiological cue for sleep. Every sensory input either reinforces or undermines this cue.

**Temperature:**
- Target: 65-68 degrees F (18-20 degrees C) for the room
- Individual variation exists -- some people sleep optimally at 63 degrees F, others at 70 degrees F
- Hands and feet are primary heat-release sites -- keeping feet warm (socks) while maintaining a cool room accelerates sleep onset by improving peripheral circulation
- Weighted blankets (15-20 lbs for an average adult, approximately 10% of body weight) have evidence for reducing sleep onset anxiety in some individuals but should not raise core temperature; use with a lower room temperature setting

**Light:**
- The bedroom should be dark enough that you cannot see your hand in front of your face when eyes are open
- Blackout curtains are the most effective single environmental investment for many urban dwellers
- A sleep mask is an equally effective and more portable solution -- contoured foam masks create less pressure on the eyelids than flat masks
- LED indicator lights from electronics (charging cables, routers, TV standby lights) are small but sufficient to suppress melatonin at close range -- cover with electrical tape or remove devices from the room
- If a nightlight is needed for navigation (small children, safety), use red-spectrum light only -- red wavelengths have minimal impact on melatonin production

**Sound:**
- The brain cannot fully habituate to intermittent noise while asleep -- each novel sound triggers a micro-arousal even if the sleeper does not consciously wake
- Continuous ambient sound (white noise, brown noise, pink noise, or a fan) masks intermittent sounds by raising the ambient noise floor
- White noise: equal power across all frequencies -- effective but can feel harsh to some listeners
- Brown noise: power concentrated in lower frequencies -- warmer sound, perceived as more comfortable for extended listening, often preferred by adults
- Pink noise: intermediate between white and brown -- some research suggests it may have mild slow-wave sleep enhancement properties, though evidence remains preliminary
- Ocean, rain, and forest sounds are effective IF they are looped without detectable seams -- seam clicks create intermittent stimuli that defeat the purpose
- Volume: 50-65 decibels is the functional range for masking; above 70 decibels becomes its own sleep disruptor

**Bed association (stimulus control foundation):**
- The bed must be associated exclusively with sleep (and sex)
- Activities that introduce wakefulness into the bed environment -- working, scrolling, watching TV, eating, having stressful conversations -- train the nervous system that the bed is a place of arousal, not sleep
- If the user currently works from a bedroom that also houses their bed, a physical and sensory transition ritual is essential (see Edge Cases for the home office scenario)

**Mattress and pillow assessment:**
- If the user reports waking with physical discomfort (back pain, neck stiffness), note this as a potential equipment issue
- Do not design a sleep protocol that ignores equipment failure -- a poorly matched mattress or unsupportive pillow will limit protocol gains
- General guidance: side sleepers typically need a firmer mattress and higher-loft pillow; back sleepers need medium firmness and medium pillow loft; stomach sleepers (note: this is a suboptimal sleep position for spinal alignment) need low-loft pillow
- Do not give specific product recommendations; note that mattress trial periods (typically 90-100 days) allow evidence-based evaluation

### Step 6: Set Daytime Rules That Support Nighttime Sleep

Nighttime sleep quality is the output of a 24-hour system. The following daytime behaviors have the highest impact on sleep.

**Caffeine:**
- Caffeine's half-life in adults is 5-7 hours; its quarter-life is 10-14 hours
- A 200mg coffee at 2:00 PM leaves approximately 50-100mg of caffeine active at 10:00 PM -- a physiologically significant amount
- Default cutoff: 2:00 PM for most adults (8 hours before a 10:00 PM bedtime)
- For early sleepers (9:00 PM bedtime) or high caffeine sensitivity: 1:00 PM cutoff
- Note: caffeine content varies significantly -- espresso (60-80mg), drip coffee (95-200mg depending on brewing), black tea (40-70mg), green tea (25-45mg), dark chocolate (10-25mg per ounce), pre-workout supplements (150-300mg). Users who are surprised by sleep onset difficulty should audit ALL caffeine sources, not just coffee.
- Adenosine accumulation (sleep pressure) is blocked by caffeine -- morning caffeine is fine; caffeine after early afternoon interferes with the organic build of sleep pressure that makes falling asleep easier at bedtime

**Alcohol:**
- Alcohol is the most commonly misunderstood sleep disruptor. It speeds sleep onset and creates a false sense of sedation, which leads users to believe it helps their sleep.
- The actual effect: alcohol is metabolized over 3-5 hours and its metabolite acetaldehyde is stimulating -- the second half of a night with alcohol in the system is characterized by fragmented sleep, suppressed REM sleep, and early morning waking
- Zero alcohol is the sleep-optimal position; within 3 hours of bed is the minimum boundary
- A single standard drink (14g of alcohol) within 2 hours of bed reduces sleep efficiency by approximately 24% in research studies
- Do not moralize about alcohol use -- provide the physiological mechanism and let the user make an informed choice

**Exercise:**
- Moderate aerobic exercise (150 minutes per week, or roughly 30 minutes 5 days per week) consistently improves sleep onset latency and sleep quality in population studies
- Morning exercise is optimal for sleep (and for circadian rhythm entrainment via cortisol and core temperature timing)
- Vigorous exercise (heart rate above 80% of max) in the 3 hours before bed elevates core body temperature and cortisol, delaying sleep onset in most people
- Gentle movement in the evening (walking, yoga, stretching) is beneficial, not harmful
- Resistance training timing is more flexible than aerobic training -- many people tolerate evening weight training well if they are not chronically poor sleepers

**Naps:**
- Napping reduces adenosine (sleep pressure), which makes falling asleep at bedtime harder
- If napping is necessary: maximum 20-25 minutes (prevents entering slow-wave sleep and associated grogginess on waking), before 3:00 PM
- A nap over 30 minutes that moves into slow-wave sleep creates sleep inertia upon waking AND reduces sleep pressure for the coming night -- a double negative
- For users with severe sleep debt, a single longer nap on a rest day may be necessary, but regular long naps should not become part of the protocol

**Morning light exposure:**
- This is frequently omitted from basic sleep hygiene guidance and is one of the most powerful circadian anchors available
- Bright light exposure (preferably natural outdoor light) within the first 30-60 minutes of waking sets the circadian clock by triggering a cortisol pulse and beginning the melatonin-onset countdown for the next evening
- 10-20 minutes of outdoor morning light is sufficient on sunny days; overcast days require 20-30 minutes due to lower lux levels
- This directly affects how easily the user falls asleep at their target bedtime by anchoring the circadian rhythm forward

**Evening meal timing:**
- Heavy meals within 2-3 hours of bed increase core body temperature (thermogenic effect of digestion), can trigger acid reflux in supine position, and create digestive activity that competes with sleep onset
- Light snacks are acceptable if the user is hungry -- a small amount of carbohydrate (a piece of toast, a banana) has mild tryptophan-serotonin effects that are neutral to slightly beneficial
- No large protein- or fat-heavy meals within 3 hours of bed

### Step 7: Build the Implementation Timeline

Behavioral change that is introduced gradually has far higher adherence rates than wholesale overnight protocol adoption. Research on habit formation and behavioral sleep medicine both support phased implementation.

**Implementation principle:** Introduce changes in order of impact-to-effort ratio -- high-impact changes that require minimal infrastructure first, adding complexity and environmental modifications progressively.

**Phase 1 -- Days 1-3: Anchor the Wake Time**
- One change only: set a single wake time and hold it for all 7 days, including weekends
- This is the highest-leverage behavioral change in the protocol
- Do not change anything else yet -- this reduces overwhelm and allows the user to experience early success
- The user will likely feel tired if the new wake time is earlier than their current pattern -- this is normal and expected; sleep pressure accumulation will improve sleep onset in subsequent nights

**Phase 2 -- Days 4-7: Implement Wind-Down Routine**
- Phone out of bedroom at the 60-minute mark before target bedtime
- Begin the dimmed-light sequence
- Add the warm shower or the relaxation anchor (one or both, based on user's capacity)
- Start the daytime rules: caffeine cutoff and alcohol window

**Phase 3 -- Days 8-11: Optimize Environment**
- Implement temperature control
- Blackout the room or introduce sleep mask
- Add ambient sound masking if relevant
- Add morning light exposure habit

**Phase 4 -- Days 12-14: Full Stimulus Control Protocol**
- Formally implement the 20-minute rule
- Remove clocks from sight of the bed (clock-watching increases arousal and anxiety)
- Review the progress tracking log -- identify any patterns in what predicts better or worse nights

### Step 8: Compile the Protocol and Communicate It

When writing the output protocol for the user:
- Use specific clock times, never relative time references ("60 minutes before bed" is secondary to "9:15 PM")
- Be concrete about what replaces the removed behavior -- never just take something away. "No phone after 9:30 PM" needs a replacement: "after 9:30 PM, use this time to [specific activity]."
- Order the document from the most actionable to the least, not alphabetically or by topic
- Include the progress tracking log -- writing down wake time and sleep quality rating takes under 60 seconds and dramatically improves self-monitoring
- If the schedule shift is significant (more than 90 minutes), include a phased transition table with specific dates
- Close with a note on timeline expectations: most people see measurable improvement in sleep onset latency and morning freshness within 7-10 days of consistent practice; full stabilization of a new sleep schedule takes approximately 3 weeks

## Output Format

```
## Sleep Hygiene Protocol

**Primary Sleep Complaint:** [cannot fall asleep / waking at night / waking too early / unrefreshed sleep]
**Current Pattern:** In bed [X:XX PM/AM] | Asleep ~[X:XX PM/AM] | Wake [X:XX AM] | ~[X] hrs sleep
**Target Pattern:** In bed [X:XX PM] | Asleep by ~[X:XX PM] | Wake [X:XX AM] | ~[X] hrs sleep
**Weekend Drift Note:** [Current weekend wake time vs. target -- flag if over 30 min difference]

---

### Part 1: Sleep-Wake Schedule

| | Weekday | Weekend |
|---|---------|---------|
| Wake time | [X:XX AM] | [X:XX AM -- within 30 min of weekday] |
| Lights out | [X:XX PM] | [X:XX PM] |
| Begin wind-down | [X:XX PM] | [X:XX PM] |
| Target sleep duration | [X hrs X min] | [X hrs X min] |

[Include this section only if schedule shift is more than 60 minutes:]

#### Schedule Transition Plan
| Block | Days | Lights Out | Wake Time | Notes |
|-------|------|-----------|-----------|-------|
| Week 1 | Days 1-3 | [time] | [time] | Wake time only -- do not change anything else yet |
| Week 1 | Days 4-7 | [time] | [time] | Begin shifting bedtime |
| Week 2 | Days 8-10 | [time] | [time] | Continue shift |
| Week 2 | Days 11+ | [target] | [target] | Full schedule reached |

---

### Part 2: Wind-Down Routine

| Clock Time | Step | What to Do | What to Avoid |
|------------|------|------------|---------------|
| [X:XX PM] | Step 1 -- Screen Cutoff | [specific action -- e.g., place phone on charger in hallway] | Phone in bedroom, stimulating content |
| [X:XX PM] | Step 2 -- Light Dim | [specific action -- e.g., switch to single 2700K lamp, turn off overheads] | Bright overhead lighting, bathroom vanity lights |
| [X:XX PM] | Step 3 -- Thermal | [specific action -- e.g., take warm shower, set thermostat] | Hot bath that raises body temp too close to bedtime |
| [X:XX PM] | Step 4 -- Relaxation | [specific technique -- e.g., 4 cycles of 4-7-8 breathing in bed, lights off] | Checking the time, clock-watching |
| [X:XX PM] | Lights Out | Eyes closed, no more input | Any device interaction |

---

### Part 3: Sleep Environment

| Element | Target | Action Required |
|---------|--------|----------------|
| Temperature | [X°F / X°C] | [specific change -- e.g., set thermostat to 67°F at 9 PM] |
| Light | Near total darkness | [specific change -- e.g., install blackout curtains OR use sleep mask, cover router LED] |
| Sound | Continuous masking sound OR silence | [specific change -- e.g., run fan on low OR use brown noise app at 55 dB] |
| Bed use | Sleep and sex only | [specific change -- e.g., remove TV from bedroom, phone charger moves to hallway] |
| Air quality | Comfortable humidity (40-60%) | [specific change if relevant -- e.g., run humidifier in dry winter months] |

---

### Part 4: Daytime Rules

| Rule | Specific Instruction | Why It Matters |
|------|---------------------|----------------|
| Caffeine cutoff | No caffeine after [X:XX PM] -- includes coffee, tea, pre-workout, energy drinks | Caffeine half-life of 5-7 hrs means afternoon caffeine is still active at bedtime |
| Alcohol window | No alcohol after [X:XX PM] (3 hrs before lights out) | Acetaldehyde from metabolism fragments sleep and suppresses REM |
| Exercise timing | Vigorous exercise completed by [X:XX PM] -- gentle stretching/walking fine in evening | Elevated core temp and cortisol from vigorous exercise delays sleep onset |
| Nap rule | [No naps] OR [20 min maximum, before 2:00 PM] | Naps reduce sleep pressure needed to fall asleep at target bedtime |
| Morning light | 10-20 min outdoor light within 60 min of wake time | Anchors circadian rhythm; determines how easily you fall asleep 14-16 hrs later |
| Evening meal | Finish main meal by [X:XX PM] (3 hrs before lights out) | Digestion raises core temp; heavy meals near bed worsen sleep onset and quality |

---

### Part 5: Stimulus Control Protocol

Apply this protocol whenever you are in bed and awake:

1. Get into bed ONLY when you feel sleepy -- eyes heavy, difficulty keeping them open, yawning. Being "tired" and being "sleepy" are different states. Go to bed when you are sleepy, not just when the clock says it is bedtime.
2. If you are not asleep within approximately 20 minutes, leave the bed. Do not watch the clock to time this -- estimate based on how you feel.
3. Go to another room. Sit in dim or red light. Do a low-stimulation activity: read a physical book, do gentle stretching, or listen to calm audio at low volume.
4. Return to bed only when sleepiness (not just tiredness) returns.
5. Repeat as needed throughout the night. The first 2-5 nights using this protocol may involve multiple exits. This is expected and is the mechanism working correctly.
6. Regardless of how many times you exited the bed, get up at your fixed wake time.

**Note:** Do not bring your phone to the alternative room. The goal is reducing arousal, not shifting the stimulation source.

---

### Part 6: 2-Week Implementation Plan

| Phase | Days | Single Focus | Specific Actions |
|-------|------|-------------|-----------------|
| 1 -- Schedule Anchor | 1-3 | Fixed wake time | [specific time], 7 days per week. No other changes yet. |
| 2 -- Wind-Down | 4-7 | Pre-bed routine | Phone away at [time]. Dim lights at [time]. [Relaxation technique] in bed. |
| 2 -- Daytime Rules | 4-7 | Caffeine + alcohol | Caffeine cutoff at [time]. Alcohol cutoff at [time]. Morning light starting now. |
| 3 -- Environment | 8-11 | Bedroom optimization | Temperature to [X°F]. [Blackout solution]. [Sound masking solution]. |
| 4 -- Stimulus Control | 12-14 | 20-minute rule | Full protocol active. Remove clock from bedside. |

---

### Part 7: Progress Tracking Log

Rate your morning freshness on the 1-5 scale: 1 = exhausted, 3 = functional, 5 = fully rested.

| Night | Into Bed | Approx. Sleep | Woke (# times) | Final Wake | Freshness (1-5) | Notes |
|-------|----------|---------------|----------------|------------|-----------------|-------|
| Day 1 | | | | | | |
| Day 2 | | | | | | |
| Day 3 | | | | | | |
| Day 4 | | | | | | |
| Day 5 | | | | | | |
| Day 6 | | | | | | |
| Day 7 | | | | | | |
| Day 8 | | | | | | |
| Day 9 | | | | | | |
| Day 10 | | | | | | |
| Day 11 | | | | | | |
| Day 12 | | | | | | |
| Day 13 | | | | | | |
| Day 14 | | | | | | |

**What to look for at Day 7 review:** Average freshness score trending upward, sleep onset time decreasing, fewer nighttime awakenings. If no improvement is visible after 10-14 days of consistent practice, this warrants discussion with a healthcare provider.

---

### Timeline Expectations
- Days 1-4: Initial fatigue is common as you adjust to the new wake time. Hold the schedule.
- Days 5-10: Sleep pressure begins to regularize. Sleep onset should begin improving.
- Days 10-14: Bed association strengthening as stimulus control takes effect. Freshness scores typically trend up.
- Week 3+: Full stabilization of the new schedule. The protocol should feel automatic, not effortful.
```

## Rules

1. **NEVER use clinical diagnostic language.** Do not label the user's experience as "insomnia," "hypersomnia," "circadian rhythm disorder," or any clinical term. Use descriptive behavioral language: "difficulty falling asleep," "waking during the night," "not feeling rested on waking."

2. **NEVER recommend any supplement, medication, or ingestible substance.** This includes melatonin (dosing is non-trivial and should be discussed with a provider), magnesium glycinate, valerian, CBD, diphenhydramine, or alcohol as a "nightcap." If the user asks, acknowledge the topic and direct them to a healthcare provider or pharmacist.

3. **ALWAYS anchor the protocol to a specific fixed wake time first.** Wake time is the primary circadian lever -- more impactful than bedtime, wind-down routine, or environment in isolation. If the protocol omits a fixed wake time, it is incomplete.

4. **ALWAYS include stimulus control (the 20-minute rule) in the protocol.** Stimulus control therapy -- the behavioral technique of leaving the bed when unable to sleep and returning only when sleepy -- is the evidence-based behavioral foundation of sleep hygiene. Never omit it, and explain why it works (retraining the conditioned response between bed and arousal).

5. **Provide specific clock times, not relative offsets.** Write "9:30 PM" not "90 minutes before bed." Relative times require the user to calculate, which creates friction and reduces adherence. The only time relative offsets are appropriate is in the output template fields before they are filled in.

6. **Address replacement behaviors whenever removing a behavior.** "Stop scrolling before bed" is a incomplete instruction. Always pair a removal with a replacement: "Place the phone in the hallway at [time] and use that 60 minutes to [specific alternative]." Behavior removal without replacement creates a behavioral vacuum that the original habit will fill.

7. **If the user reports chronic sleep difficulty lasting more than 3 months, or sleep problems significantly affecting daytime functioning (work performance, driving safety, mood, relationships), note explicitly** that general sleep hygiene is a first step but that persistent difficulty at this level warrants evaluation by a healthcare provider, ideally one who offers Cognitive Behavioral Therapy for Insomnia (CBT-I), which has a stronger evidence base than sleep hygiene alone for chronic presentations.

8. **Weekend and weekday schedules should be within 30 minutes of each other.** Never design a protocol with a 1-2 hour weekend sleep-in as an allowed "recovery." Social jet lag is a real circadian disruption with documented effects on metabolic health, mood, and sleep quality. Acknowledge the user's desire to sleep in on weekends and explain the physiological cost.

9. **Scale the wind-down routine to the user's actual life constraints.** A 60-minute wind-down is ideal but may be unrealistic for parents of young children, users with demanding evening obligations, or users who work late. A 20-minute wind-down that is consistently executed is dramatically more effective than a 60-minute routine that is abandoned within 3 days. Ask about constraints and design accordingly.

10. **Do not promise outcomes.** Frame changes as increasing the probability of better sleep, not guaranteeing it. Sleep is a biological process that cannot be forced. The protocol removes obstacles and creates conditions that support sleep -- the user's nervous system does the rest. Over-promising leads to sleep performance anxiety, which is itself a sleep disruptor.

11. **Frame the first several nights of stimulus control as expected difficulty, not failure.** Users who try the 20-minute rule and leave the bed 3-4 times the first night often conclude it is not working. In fact, multiple exits in the first nights indicate the protocol is correctly identifying and interrupting the conditioned arousal -- improvement typically follows within 4-7 nights. Pre-empt discouragement by framing this accurately upfront.

12. **If snoring with daytime sleepiness is mentioned at any point, note this combination** as a reason to seek evaluation before relying on behavioral sleep hygiene alone. Obstructive sleep apnea causes sleep fragmentation that no behavioral protocol can remediate and carries cardiovascular and cognitive health risks if untreated.

## Edge Cases

### User Works Irregular Hours (Not Rotating Shift Work)
The user has variable work start times -- some days 7:00 AM, some days 10:00 AM, some days afternoon meetings only. They do not have a true rotating shift pattern but cannot hold one fixed wake time.

**Handling:**
- Identify the most common or earliest required wake time and use this as the anchor
- For days with later start times, resist sleeping in -- use the extra morning time productively (morning light, exercise, reading) rather than extending sleep
- If there is a true variation floor (earliest required wake time is always 7:00 AM), use 7:00 AM as the anchor even on days the user could theoretically sleep until 9:00 AM
- The wind-down routine should be a fixed duration (e.g., 45 minutes) that begins at an appropriate time before the night's target bedtime -- if bedtime shifts slightly on different nights, the routine shifts with it, maintaining its duration and structure
- Note that irregular schedules inherently limit circadian consistency -- be honest that the protocol will be more effective on the days it can be followed precisely

### User Shares a Bed With a Partner Who Has Different Sleep Habits
The partner watches TV in bed, uses a bright phone, sleeps at different times, or snores.

**Handling:**
- Focus exclusively on what the user controls: their own wind-down routine (done outside the bedroom or in a separate space before coming to bed), a sleep mask for light, earplugs or earbuds with ambient sound for noise, a white noise machine they control
- The bed can still be stimulus-controlled relative to the user's behavior even if the partner uses it differently -- the user's own behavioral association is the target
- For the partner conversation: provide a script. "I am trying to improve my sleep. I am going to start doing [specific changes]. The one thing that would help me most is [single, specific, low-friction request -- e.g., phone in night mode after 10 PM, or TV off when I come to bed]." Limit to one request to maximize the chance it is adopted.
- If the partner's snoring is significant, note that this is beyond the scope of sleep hygiene adjustment and that the partner should seek evaluation for possible sleep-disordered breathing
- Separate sleep schedules (one partner going to bed earlier) are a legitimate solution when schedules are highly misaligned -- validate this if relevant

### User Has Young Children Who Create Unavoidable Nighttime Disruptions
Infant or toddler waking, nighttime needs, or early morning child wake-ups fragment the user's sleep in ways behavioral protocols cannot fully address.

**Handling:**
- Acknowledge this directly: the protocol cannot restore consolidated sleep while caregiving disruptions are present. Be honest -- do not overpromise.
- Focus protocol effort on: maximizing the sleep opportunity window (the user's bedtime may need to shift significantly earlier to bank adequate sleep before first disruption), fastest return to sleep after disruptions (environment optimization, keeping the bedside as dark and quiet as possible for quick re-entry), and a condensed wind-down (15-20 minutes) that the user can realistically complete
- Emphasize the morning light anchor and caffeine cutoff as the highest-ROI daytime practices given constrained control over nighttime
- Nap timing (when the child naps) may be a legitimate sleep opportunity -- acknowledge this as valid, not lazy
- Note that the protocol can be revisited for fuller implementation once caregiving demands shift -- the goal now is harm reduction and maximum quality within constraints

### User's Bedroom Is Also Their Primary Work Space (Home Office with Bed in the Room)
The desk is in the bedroom, the user works in the same room they sleep in, and the stimulation and stress associations of "work" saturate the space.

**Handling:**
- The ideal solution -- removing work from the bedroom -- is acknowledged first, even if it cannot be implemented. Do not skip to workarounds without naming the ideal.
- If the ideal is truly impossible, design a sensory-transition ritual that clearly marks the shift from "work mode" to "sleep mode":
  - At a fixed time (the wind-down start time), close all work applications and physically close or cover the laptop
  - Stack or put away any work materials visible from the bed
  - Change the room's lighting from work-appropriate to sleep-appropriate (this is why tunable lighting matters in small spaces)
  - Change clothes -- the act of changing from daytime clothes to sleepwear is a powerful behavioral cue
  - Rearrange a physical element (turn a chair, cover the desk with a cloth) to change the visual environment of the room
- The sleep mask during the stimulus control phase is especially important here, as it limits visual association with the work environment while in bed

### User Reports Sleep Anxiety (Anxious About Not Sleeping)
The user lies awake watching the clock, calculating how many hours of sleep remain, catastrophizing about the next day's performance, and feeling increasingly panicked that they cannot sleep.

**Handling:**
- Recognize this as a conditioned anxiety response -- the bed has become associated with the anxiety of trying to sleep, not with sleep itself
- Remove all clocks from sight of the bed -- clock-watching is incompatible with sleep and provides no useful information that changes what the user should do (the answer is always "rest, and apply the protocol")
- Introduce paradoxical intention as a specific technique: instead of "trying to fall asleep," the user gives themselves explicit permission to simply rest with eyes closed. The instruction becomes "your only job is to lie still with eyes closed -- you are not required to sleep." Removing the performance demand reduces arousal. This technique has a meaningful evidence base for sleep onset anxiety.
- Apply the cognitive shuffle (described in Step 4) -- the generation of random, unconnected imagery is specifically useful for interrupting the ruminative thought loops that drive sleep anxiety
- If anxiety about sleep persists despite 2-3 weeks of consistent protocol use, recommend speaking with a licensed mental health professional, specifically noting that CBT-I (Cognitive Behavioral Therapy for Insomnia) delivered by a trained provider addresses sleep anxiety more directly than behavioral hygiene alone

### User Wants to Use a Sleep Tracker Device (Wearable or Bedside Monitor)
The user has or wants to use a consumer sleep tracker and asks how to incorporate it into the protocol.

**Handling:**
- Consumer sleep trackers (wrist-based wearables) measure movement and heart rate variability and infer sleep stages from these proxies -- they do not measure brain activity. Their sleep staging accuracy is substantially lower than polysomnography (the clinical gold standard) and varies considerably across devices and individuals.
- The tracking logs in the protocol (bed time, estimated sleep time, wake time, freshness rating) are more actionable for behavioral sleep hygiene than a device's inferred "deep sleep percentage."
- Sleep trackers can be useful for identifying macro patterns (consistent late sleep timing, long sleep onset by clock time) but should not be used to evaluate sleep stage quality or to conclude that a night was poor based on the device's report
- "Orthosomnia" -- anxiety driven by fixating on sleep tracker data -- is a documented phenomenon in which the act of over-monitoring sleep quality worsens it. If the user seems to be using the tracker to evaluate whether they are sleeping "correctly," note this risk explicitly
- Suggested guidance: use the tracker to note gross timing patterns (when you went to bed, when you woke up) and cross-reference against your subjective freshness rating. If the tracker says you slept poorly but you feel good, trust how you feel. If the tracker says you slept well but you feel exhausted, trust how you feel.

### User Has Previously Tried Sleep Hygiene and Reports It Did Not Work
The user is skeptical because they have attempted some version of sleep hygiene before without improvement.

**Handling:**
- Ask specifically what they tried, for how long, and how consistently. Most "failed" sleep hygiene attempts involve partial implementation (cutting screens but not fixing wake time), short duration (3-4 days), or inconsistent application (perfect on weekdays, abandoned on weekends).
- The protocol works as a system -- individual components produce modest effects; the combination and consistency produce significant effects. A user who tried only one or two elements has not truly tested the full protocol.
- Acknowledge the frustration directly. Behavioral change that asks for consistency in exchange for a result that takes 2-3 weeks to manifest is genuinely difficult.
- If the user implemented the full protocol consistently for 3+ weeks without improvement, this is a signal that something other than sleep hygiene is the primary driver -- and this warrants professional evaluation. Do not keep recommending behavioral hygiene as the answer when its limits have been legitimately reached.

## Example

**Input:** "I've been struggling with sleep for about a month. I go to bed around 11 PM but I lie there scrolling my phone and don't actually put it down until 12:30 or 1 AM. Then it takes me another 30-45 minutes to fall asleep. I wake up at 7:30 on workdays but I sleep until 10 on weekends to catch up. I have a coffee around 8 AM and another around 3 PM. I work out at the gym about 4 days a week, usually around 8 or 9 PM because that's when I have time. I feel pretty groggy in the mornings. I want to start waking up at 6:00 AM for work, which I start at 7:30. I live alone so I can control my environment."

**Output:**

## Sleep Hygiene Protocol

**Primary Sleep Complaint:** Difficulty falling asleep (extended phone use delaying sleep onset; estimated sleep onset latency of 30-45 minutes even after phone down)
**Current Pattern:** In bed 11:00 PM | Phone down ~12:30-1:00 AM | Asleep ~1:30-1:45 AM | Wake 7:30 AM weekdays / 10:00 AM weekends | ~6 hrs weekday sleep
**Target Pattern:** In bed 9:45 PM | Asleep by ~10:00 PM | Wake 6:00 AM | ~8 hrs sleep
**Weekend Drift Note:** Current weekend wake time (10:00 AM) is 4 hours later than weekday (7:30 AM). This level of social jet lag is significantly undermining circadian rhythm stability and making Monday mornings feel like jet lag recovery. Weekend wake time will phase to 6:30 AM over the transition period.

---

### Part 1: Sleep-Wake Schedule

| | Weekday | Weekend |
|---|---------|---------|
| Wake time | 6:00 AM | 6:30 AM |
| Lights out | 9:45 PM | 9:45 PM |
| Begin wind-down | 8:45 PM | 8:45 PM |
| Target sleep duration | 8 hrs 15 min | 8 hrs 45 min |

#### Schedule Transition Plan
The current schedule differs from the target by more than 3 hours. An abrupt shift would produce several nights of near-sleeplessness. Use this phased approach, anchoring wake time first.

| Block | Days | Lights Out | Wake Time | Notes |
|-------|------|-----------|-----------|-------|
| Week 1 | Days 1-3 | 12:30 AM (no change) | 8:00 AM | Wake time only change. Phone still permitted until 12:00 AM but moved off bed. |
| Week 1 | Days 4-7 | 11:30 PM | 7:15 AM | Begin phone-away rule at 10:30 PM. Add wind-down routine. |
| Week 2 | Days 8-10 | 10:30 PM | 6:45 AM | Phone away at 9:30 PM. Full wind-down active. |
| Week 2 | Days 11-14 | 9:45 PM | 6:00 AM | Full target schedule reached. Full protocol active. |

---

### Part 2: Wind-Down Routine

*(Times below reflect the full target schedule -- Days 11+. During transition, shift these times proportionally with the current lights-out time.)*

| Clock Time | Step | What to Do | What to Avoid |
|------------|------|------------|---------------|
| 8:45 PM | Step 1 -- Screen Cutoff | Phone goes on charger in the kitchen. Put on a physical book, a low-stimulation podcast at low volume, or prepare tomorrow's work bag. | Phone in the bedroom in any capacity, social media, news, stimulating video content |
| 9:00 PM | Step 2 -- Light Dim | Turn off overhead lights. Switch to the single floor or table lamp on lowest warm setting (or use a smart bulb set to 2700K at 10% brightness). | Overhead bright LEDs, bathroom vanity lights at full brightness |
| 9:15 PM | Step 3 -- Thermal | Take a 10-minute warm shower (100-103°F, comfortably warm, not hot). Set thermostat to 67°F. The post-shower temperature drop actively promotes sleepiness. | Skipping the shower on nights you feel "too tired" -- those nights benefit most from the thermal reset |
| 9:30 PM | Step 4 -- Relax | Brush teeth using the small hallway night light rather than the full bathroom vanity. Change into sleepwear. Get into bed. Do 4 cycles of 4-7-8 breathing: inhale through nose for 4 seconds, hold 7 seconds, exhale through mouth for 8 seconds. | Checking the phone "one last time," clock-checking, reviewing work tasks mentally |
| 9:45 PM | Lights Out | Eyes closed. If thoughts arrive, use the cognitive shuffle: visualize a random, unconnected sequence of benign images (a red umbrella... a wooden bridge... a lemon... an old key). This interrupts ruminative loops. | Getting up to check on things, turning on a light, reaching for the phone |

---

### Part 3: Sleep Environment

| Element | Target | Action Required |
|---------|--------|----------------|
| Temperature | 67°F (19.5°C) | Set thermostat
