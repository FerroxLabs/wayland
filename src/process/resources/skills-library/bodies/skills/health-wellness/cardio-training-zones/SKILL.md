---
name: cardio-training-zones
description: |
  Explains heart rate training zones (Zone 1 through Zone 5) with calculation methods, training adaptations per zone, and how to structure a cardio program using zone-based training. Produces a personalized zone chart and weekly cardio plan organized by zone targets.
  Use when the user asks about heart rate zones, Zone 2 training, cardio training intensity, how to calculate training zones, or how to structure cardio sessions by intensity.
  Do NOT use for running-specific training plans (use running-training-plan), HIIT workout design (use hiit-workout-design), or heart rate monitoring for medical purposes.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness running workout-planning"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Cardio Training Zones

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before starting a new fitness program, changing exercise intensity, or making decisions about your health. If you experience chest pain, dizziness, shortness of breath beyond normal exertion, or any other concerning symptoms during exercise, stop immediately and contact emergency services or a healthcare professional.

---

## When to Use

**Use this skill when:**
- The user asks what heart rate training zones are, how many zones exist, or what each zone physiologically accomplishes
- The user wants to calculate their personal heart rate zones using their age, resting heart rate, or both
- The user asks specifically about Zone 2 training, aerobic base building, fat oxidation, or mitochondrial development through low-intensity cardio
- The user wants to understand how to structure weekly cardio volume across different intensity levels and goals (general fitness, endurance development, fat loss, active recovery)
- The user asks how to use perceived exertion, the talk test, or heart rate monitors to gauge cardio intensity without a lab test
- The user asks about the physiological meaning of lactate threshold, VO2max, or aerobic/anaerobic boundaries in the context of planning their training
- The user asks how much time per week they should spend in each zone given their specific fitness goals
- The user is following an 80/20 training model, polarized training, or has heard about "not spending too much time in Zone 3" and wants to understand the science behind it

**Do NOT use when:**
- The user wants a running-specific training plan with mileage progressions, taper schedules, or race-week protocols -- use `running-training-plan`
- The user wants a designed HIIT circuit with exercise selection, work-to-rest ratios, and movement patterns -- use `hiit-workout-design`
- A physician has prescribed specific heart rate limits or exercise restrictions -- defer entirely to those prescribed limits and do not layer general zone calculations on top of clinical guidance
- The user is describing cardiac symptoms -- chest tightness, palpitations, irregular heartbeat, syncope during exercise, or unexplained breathlessness -- advise stopping exercise and seeking immediate medical evaluation
- The user wants race-specific periodization, peak-week programming, or event taper design -- zone education is only one component of those more complex plans
- The user has a diagnosed cardiovascular condition such as arrhythmia, heart failure, or recent cardiac event -- exercise guidance for these populations requires direct clinical supervision

---

## Process

### Step 1: Gather User Context

Collect the following before calculating anything. Each piece of information changes the output meaningfully.

- **Age** -- Required. Used for max heart rate estimation. Note that this estimate carries a standard deviation of ±10-12 BPM; the formula is a population average, not a personal measurement.
- **Resting heart rate (RHR)** -- Strongly recommended. Enables the Karvonen Heart Rate Reserve method, which is significantly more individualized than percentage-of-max-HR alone. A resting HR of 45 BPM versus 75 BPM at the same age produces dramatically different training zones.
- **Primary training goal** -- Choose from: general cardiovascular fitness, fat loss, aerobic endurance building, recovery and stress management, or preparation for an endurance event. Each goal shifts zone distribution.
- **Current cardio modality** -- Running, cycling (indoor or outdoor), rowing, swimming, elliptical, hiking, or other. Zone targets apply universally, but maximum heart rate can differ by modality -- running typically produces the highest HR ceiling, swimming the lowest (approximately 10-13 BPM lower than running max due to horizontal position, water pressure, and cooler temperature).
- **Current weekly cardio volume** -- How many sessions per week and approximate duration. This determines how aggressively zones can be introduced without overtraining.
- **Available equipment** -- Heart rate monitor (chest strap, wrist-based, or optical), or none. This determines whether true HR monitoring is feasible or whether RPE/talk test must be used.
- **Medication status** -- Specifically ask whether the user takes beta-blockers, calcium channel blockers, or any medication that affects heart rate response. These render HR-based zone calculations unreliable.

### Step 2: Select the Appropriate Zone Calculation Method

Choose between two methods based on available data. Always present the Karvonen method when resting HR is known.

**Method A -- Percentage of Maximum Heart Rate (% Max HR)**

Use when resting heart rate is unknown or unavailable.

- Estimate Max HR using the revised formula: **Max HR = 220 - age**
- An alternative formula with slightly better accuracy across age ranges is **Max HR = 208 - (0.7 × age)** (Tanaka, 2001). Use this as a secondary check for users over 40.
- Apply zone percentages directly to estimated Max HR.

**Method B -- Karvonen Heart Rate Reserve (HRR)**

Use when resting heart rate is known. This method accounts for cardiovascular fitness level and produces more individualized zones.

- **HRR = Estimated Max HR - Resting HR**
- **Target HR = (HRR × Zone Intensity %) + Resting HR**
- A highly fit individual with RHR of 45 will have meaningfully higher absolute zone values than a sedentary individual with RHR of 75, even at the same age, because HRR reflects cardiovascular efficiency.
- Recommend measuring RHR first thing in the morning, before standing, for 3 consecutive days, then averaging. A single measurement is acceptable to proceed with.

**Important accuracy note:** Neither formula replaces a maximal exercise test (graded exercise test or VO2max field test). For users who pursue serious endurance goals, note that a functional threshold test -- such as a 20-minute all-out effort followed by 95% of average HR as an FTP proxy for threshold -- will produce more accurate zones than any age-based formula.

### Step 3: Define Each Zone with Full Physiological Context

Present all five zones with their corresponding physiology, not just percentages and effort labels. Users who understand why each zone exists train more purposefully.

**Zone 1 -- Active Recovery (50-60% Max HR / 50-60% HRR)**
- **Physiology:** Aerobic fat oxidation at the lowest intensity. Heart rate is low enough that cardiac output is only mildly elevated. Blood lactate remains at baseline (under 1 mmol/L). No meaningful training stress is added.
- **Adaptation:** Increases blood flow to muscles, flushes metabolic byproducts from harder sessions, promotes parasympathetic recovery. Does not build fitness directly.
- **Feel:** Walking briskly, very easy cycling, leisurely swimming. Fully conversational. Could sustain indefinitely.
- **Programming use:** Rest day activity, warm-up and cooldown periods. Counterproductive to exceed 20-30% of weekly volume in Zone 1 -- it occupies time that could be Zone 2.

**Zone 2 -- Aerobic Base / Fat Oxidation (60-70% Max HR / 60-70% HRR)**
- **Physiology:** Primary substrate shifts toward fat oxidation (approximately 50-70% of calories from fat at this intensity). Blood lactate remains low (1-2 mmol/L), just above resting levels. Mitochondrial biogenesis is stimulated via PGC-1α pathway activation. Slow-twitch (Type I) muscle fibers are primarily recruited.
- **Adaptation -- the most important zone for long-term cardiovascular development:**
  - Increases mitochondrial density in skeletal muscle (more "engines" per muscle cell)
  - Improves mitochondrial efficiency (each mitochondrion processes oxygen more effectively)
  - Develops capillary density -- more blood vessels per unit of muscle tissue
  - Enhances fat oxidation capacity -- the body learns to spare glycogen by preferentially burning fat
  - Lowers resting heart rate over months of consistent training
  - Elevates lactate threshold by improving the body's lactate clearance mechanisms
- **Feel:** Comfortable, fully conversational effort. The classic test is whether you can recite 3-4 sentences without pausing to breathe. Often described as "embarrassingly slow" by beginners who are accustomed to training harder.
- **Programming use:** Should constitute 70-80% of total weekly cardio volume. The most common mistake is training too hard in this zone and drifting into Zone 3, which reduces the pure aerobic stimulus without adding meaningful high-intensity adaptation.

**Zone 3 -- Aerobic Development / Tempo (70-80% Max HR / 70-80% HRR)**
- **Physiology:** Blood lactate rises to approximately 2-4 mmol/L. The body begins using a higher proportion of glycogen (carbohydrate) relative to fat. Both aerobic and anaerobic systems are active. Still aerobic overall, but approaching the lactate threshold.
- **Adaptation:** Improves lactate clearance rate, increases aerobic enzyme activity, and builds mitochondrial density -- though less efficiently than Zone 2 at equivalent duration. Does develop aerobic capacity.
- **Feel:** "Comfortably hard." Can speak in short phrases of 3-5 words. Breathing is noticeably elevated. Could sustain for 30-60 minutes.
- **Programming use:** Zone 3 is sometimes called "the grey zone" or "no man's land" because it is metabolically expensive (burns significant glycogen, accumulates fatigue) without providing the specific adaptation of Zone 2 (pure aerobic base) or the powerful stimulus of Zone 4-5 (threshold and VO2max development). A polarized training model intentionally minimizes Zone 3 in favor of Zone 2 and Zone 4. However, Zone 3 tempo work has specific value for recreational athletes building aerobic capacity who are not yet ready for threshold intervals. Limit to 10-20% of weekly volume.

**Zone 4 -- Lactate Threshold (80-90% Max HR / 80-90% HRR)**
- **Physiology:** Blood lactate rises sharply to approximately 4-6 mmol/L and approaches or reaches the lactate threshold (LT2, or OBLA -- onset of blood lactate accumulation). At this intensity, the anaerobic system contributes significantly to energy production. Glycolysis predominates as the fuel pathway.
- **Adaptation:**
  - Raises the lactate threshold -- the point at which blood lactate accumulates faster than it can be cleared
  - Improves VO2max (peak oxygen utilization)
  - Enhances the ability to sustain high-intensity effort over longer durations (crucial for tempo performance)
  - Increases fast-twitch muscle fiber aerobic capacity
- **Feel:** Hard. Can speak only a few words at a time. Breathing is heavy and controlled. A trained individual can sustain 20-40 minutes continuously. An intermediate athlete, 15-25 minutes.
- **Programming use:** 1-2 sessions per week maximum. Commonly structured as threshold intervals (e.g., 3 × 8 minutes at Zone 4 with 3-minute Zone 1 recovery) or sustained tempo efforts. High recovery cost -- require 36-48 hours of easy training afterward.

**Zone 5 -- VO2max / Neuromuscular Power (90-100% Max HR / 90-100% HRR)**
- **Physiology:** Maximal aerobic oxygen utilization. Blood lactate exceeds 6 mmol/L and may rise to 12-15 mmol/L. The anaerobic energy system is dominant. Recruits both Type I and Type II (fast-twitch) muscle fibers maximally. Heart rate approaches its physiological ceiling.
- **Adaptation:**
  - Maximizes VO2max -- the ceiling of oxygen processing capacity
  - Develops anaerobic capacity and buffering ability (the body's ability to tolerate and clear lactate rapidly)
  - Recruits and trains fast-twitch muscle fibers that Zone 2 never reaches
  - Improves running economy and power output at race pace
- **Feel:** All-out. Cannot speak. Breathing is maximal. Sustainable for 30 seconds to 5 minutes depending on fitness level. Highly uncomfortable.
- **Programming use:** 5% or less of total weekly volume. Only structured as short intervals -- typically 30-second to 2-minute repeats with full recovery (2:1 to 3:1 rest-to-work ratio). Never programmed in consecutive sessions. Requires a minimum of 6-8 weeks of Zone 2 base training before introduction.

### Step 4: Apply the Polarized Training Principle

Provide context on zone distribution philosophy. This is the single most important framework error most recreational athletes make.

**The 80/20 Rule (Polarized Training Model):**
Research by exercise physiologist Stephen Seiler on elite endurance athletes consistently shows that the highest-performing athletes spend approximately 80% of training time below the lactate threshold (primarily Zone 1 and Zone 2) and approximately 20% at or above it (Zones 4-5). Zone 3 is minimized.

The practical implication: if a user is currently doing most cardio in Zone 3 ("moderate effort, breathing hard but not gasping"), they are likely in the most metabolically expensive zone with the least specific return. The fix is to make easy training genuinely easy (lower heart rate, slower pace) and make hard training genuinely hard (true threshold intervals, not sustained moderate effort).

**Pyramidal Distribution (alternative for recreational athletes):**
Zone 2 (70%) > Zone 3 (20%) > Zone 4-5 (10%). More sustainable for beginners or those with limited weekly volume because it does not require the discipline to train very slowly on easy days.

**Goal-based distribution guidance:**
- General fitness: 70% Z2, 20% Z3, 10% Z4. Minimal Z5 until base is established.
- Fat loss: 75% Z2, 15% Z3, 10% Z4. Extended Z2 sessions maximize fat oxidation duration.
- Endurance building: 80% Z2, 10% Z3, 10% Z4-5. Strict polarized model.
- Maintenance: 65% Z2, 25% Z3, 10% Z4. Slightly more moderate work acceptable.
- Active recovery: 100% Z1-Z2. Zero threshold or interval work during recovery weeks.

### Step 5: Build the Weekly Training Schedule

Construct a weekly plan based on the user's stated sessions per week and primary goal.

**Session architecture guidelines:**
- Every session, regardless of target zone, should begin with a 5-10 minute Zone 1 warm-up and end with a 5-10 minute Zone 1 cooldown. These are included in total session duration.
- Zone 2 sessions: maintain a flat, steady heart rate throughout the working portion. Do not allow drift above Zone 2 -- reduce pace or resistance rather than accepting upward drift.
- Zone 3 sessions: typically structured as sustained blocks of 15-30 minutes, not intervals.
- Zone 4 sessions: structured as intervals (e.g., 4 × 6 minutes, 3 × 10 minutes) with recovery periods between sets at Zone 1-2.
- Zone 5 sessions: structured as short high-intensity intervals (30 seconds to 2 minutes) with generous recovery (2-3 minutes per interval at Zone 1).
- Never schedule Zone 4-5 sessions on consecutive days.
- At least one full rest day or Zone 1 active recovery day between Zone 4-5 sessions.

**Session frequency by weekly volume:**
- 2 sessions/week: 2 × Zone 2 (30-45 min each). No threshold work -- insufficient volume to recover safely.
- 3 sessions/week: 2 × Zone 2, 1 × Zone 3 tempo. Optional 1 × Zone 4 after 6 weeks.
- 4 sessions/week: 3 × Zone 2 (including one longer "long session"), 1 × Zone 3 or Zone 4.
- 5 sessions/week: 3-4 × Zone 2, 1 × Zone 3 tempo, 1 × Zone 4 threshold intervals.
- 6+ sessions/week: Should include a dedicated Zone 1 active recovery session. 4 × Zone 2, 1 × Zone 3, 1 × Zone 4. Reserve Zone 5 for athletes with over 12 months of consistent training.

### Step 6: Provide Heart Rate Monitoring and Zone Tracking Guidance

Address monitoring method based on user's available equipment.

**Chest strap heart rate monitors:**
The gold standard for accurate HR data. Electrode-based measurement detects electrical signals of the heart directly. Accuracy within ±1-2 BPM. Essential for users who want precise zone adherence, especially for Zone 4-5 interval work where staying in the correct zone matters.

**Wrist-based optical HR monitors (including smartwatch sensors):**
Sufficient for Zone 2 steady-state work where heart rate changes slowly. Accuracy is ±5-10 BPM under ideal conditions, but degrades significantly during high-intensity intervals, rapid acceleration, and cold weather. Lag time of 10-30 seconds makes them unsuitable for short Zone 4-5 intervals.

**No heart rate monitor -- Rate of Perceived Exertion (RPE) and Talk Test:**
Use a 1-10 RPE scale (1 = at rest, 10 = absolute maximum):
- Zone 1: RPE 1-3. Could maintain indefinitely. Full sentences effortlessly.
- Zone 2: RPE 3-4. Could continue for hours if trained. Complete conversation without pausing to breathe.
- Zone 3: RPE 5-6. Comfortably hard. Short phrases only. Slightly breathless but controlled.
- Zone 4: RPE 7-8. Hard. Few words. Would not maintain beyond 20-40 minutes.
- Zone 5: RPE 9-10. Maximum. Cannot speak. Fully maximal effort.

**Cardiac drift:**
During prolonged Zone 2 sessions (over 45 minutes), heart rate naturally rises due to rising core temperature, dehydration, and cardiovascular fatigue -- even as power output (pace, wattage) remains constant. This is called cardiac drift. If heart rate drifts 5-10 BPM above the Zone 2 ceiling during a long session, reduce intensity (slow pace, lower resistance) rather than accepting the drift into Zone 3. Cardiac drift is expected; the correct response is to respect zone ceilings by adjusting output downward.

### Step 7: Address Progression and Reassessment

Zone calculations are not static. Explain how zones evolve with fitness.

**Signs that zones need recalculation (upward shift, indicating improved fitness):**
- The same heart rate now produces a noticeably faster pace, higher power output, or lower perceived effort compared to 6-8 weeks ago -- this is aerobic adaptation
- Resting heart rate has dropped by 3+ BPM (retest RHR and recalculate Karvonen zones)
- Zone 2 pace has improved by 30-60 seconds per mile or 15-20 watts on the bike at the same HR ceiling

**Reassessment schedule:**
- Recalculate zones every 8-12 weeks of consistent training using the same method (do not switch methods mid-cycle)
- Update Karvonen zones whenever resting HR changes by 3+ BPM
- After 6-12 months of consistent training, recommend a functional threshold test (e.g., 20-minute maximal effort test, 95% of average HR as lactate threshold HR proxy) to replace age-predicted max HR with actual performance data

**Progressive overload within zones:**
- Do not increase intensity (zone) before volume. Add duration to Zone 2 sessions before introducing Zone 3 or Zone 4 work.
- The 10% rule: increase total weekly cardio volume by no more than 10% per week to avoid overuse injury and overtraining.
- After 3-4 weeks at a given volume, maintain volume and add one quality session (Zone 3 or Zone 4).

---

## Output Format

```
## Cardio Training Zones: [User Name / Goal Context]

> Disclaimer: [Abbreviated reminder -- consult a healthcare professional before beginning new exercise programs]

---

### Calculation Summary

| Parameter              | Value                                         |
|------------------------|-----------------------------------------------|
| Age                    | [X] years                                    |
| Estimated Max HR       | [X] BPM ([Formula used, e.g. 220-age])        |
| Alternate Max HR Est.  | [X] BPM (208 - 0.7 × age, Tanaka formula)    |
| Resting Heart Rate     | [X] BPM [or "Not provided"]                  |
| Heart Rate Reserve     | [X] BPM [or "N/A -- using % Max HR method"]  |
| Calculation Method     | [Karvonen HRR / % of Max HR]                 |

---

### Personal Zone Chart

| Zone | Name              | HR Range (BPM) | Intensity %  | Blood Lactate  | RPE (1-10) | Talk Test              |
|------|-------------------|----------------|--------------|----------------|------------|------------------------|
| 1    | Active Recovery   | [X -- X]       | 50-60%       | < 1 mmol/L     | 1-3        | Full sentences         |
| 2    | Aerobic Base      | [X -- X]       | 60-70%       | 1-2 mmol/L     | 3-4        | Conversational         |
| 3    | Aerobic Tempo     | [X -- X]       | 70-80%       | 2-4 mmol/L     | 5-6        | Short phrases only     |
| 4    | Lactate Threshold | [X -- X]       | 80-90%       | 4-6 mmol/L     | 7-8        | 2-3 words max          |
| 5    | VO2max / Max      | [X -- X]       | 90-100%      | 6-15 mmol/L    | 9-10       | Cannot speak           |

[If Karvonen method: show worked example formula]
*Zone 2 lower bound: ([HRR] × 0.60) + [RHR] = [X] BPM*
*Zone 2 upper bound: ([HRR] × 0.70) + [RHR] = [X] BPM*

---

### Weekly Training Plan ([X] sessions/week -- [Goal])

| Day       | Session Type            | Target Zone | Duration | Structure                                      |
|-----------|-------------------------|-------------|----------|------------------------------------------------|
| [Day]     | [Session Name]          | Zone [X]    | [X] min  | [Warm-up Z1 X min] + [Work block] + [Cooldown] |
| [Day]     | Rest / Active Recovery  | --          | --       | [Optional Z1 walk or full rest]                |
[Continue for all days of the week, including rest days]

---

### Zone Volume Distribution (Weekly)

| Zone | Zone Name         | Weekly Minutes | % of Total | Primary Purpose                            |
|------|-------------------|----------------|------------|--------------------------------------------|
| 1    | Active Recovery   | [X]            | [X%]       | Warm-up, cooldown, active rest             |
| 2    | Aerobic Base      | [X]            | [X%]       | Mitochondrial density, fat oxidation       |
| 3    | Aerobic Tempo     | [X]            | [X%]       | Lactate clearance, aerobic capacity        |
| 4    | Lactate Threshold | [X]            | [X%]       | LT raising, VO2max development             |
| 5    | VO2max            | [X]            | [X%]       | Peak oxygen uptake, anaerobic capacity     |
| **Total** |              | **[X]**        | **100%**   |                                            |

---

### Monitoring and Execution Notes

**Heart rate monitoring:** [Device-specific guidance based on user's equipment]
**Cardiac drift:** [Applicable note for sessions over 40 minutes]
**Zone 2 checkpoint:** [Specific cue for verifying the user is in Zone 2 for their modality]
**Progression signal:** [What to watch for that indicates zones need recalculation]

---

### 8-Week Progression Roadmap

| Weeks   | Focus                         | Adjustment from Starting Plan               |
|---------|-------------------------------|---------------------------------------------|
| 1-2     | Zone 2 establishment          | [Specific starting volume]                  |
| 3-4     | Zone 2 volume build           | [+X minutes per session or +1 session]      |
| 5-6     | Introduce quality work        | [Add first Zone 3 or Zone 4 session]        |
| 7-8     | Consolidate and reassess      | [Reassessment criteria and next steps]      |
```

---

## Rules

1. **Always present the disclaimer** before any zone calculations or training recommendations. Keep it brief but present.

2. **Always name the formula used** and explicitly flag the ±10-12 BPM standard deviation of the 220-age formula. A user whose real max HR is 198 BPM but who calculates it as 180 BPM (age 40) will have meaningfully wrong zones. Offer the Tanaka formula (208 - 0.7 × age) as a secondary check.

3. **Prioritize Karvonen over % Max HR whenever resting HR is available.** The difference is not cosmetic -- at identical ages, a resting HR of 50 versus 80 shifts Zone 2 targets by 10-20 BPM. Never use % Max HR when resting HR has been provided.

4. **Zone 2 must constitute 70-80% of weekly cardio volume for all primary training goals except pure maintenance.** This is the most common error in recreational training and the one most supported by research. If a user's plan shows less than 60% Zone 2, reconsider the structure before outputting it.

5. **Never prescribe Zone 5 as more than 5% of weekly volume,** and never prescribe Zone 5 work to users who lack a demonstrated aerobic base (defined as at least 6-8 weeks of consistent Zone 2 training). Zone 5 in a deconditioned individual produces disproportionate fatigue relative to adaptation.

6. **Never characterize Zone 2 as the "fat-burning zone" in a misleading sense.** Zone 2 does maximize fat as a percentage of fuel used, but absolute fat oxidation in calories does not differ dramatically from Zone 3. The real reason to prioritize Zone 2 is mitochondrial and cardiovascular adaptation -- not substrate-level calorie math. Clarify this if users raise the "fat-burning zone" framing.

7. **For users on heart-rate-affecting medications (beta-blockers, non-dihydropyridine calcium channel blockers),** abandon HR-based zone calculations entirely. These medications cap maximum heart rate pharmacologically, making all percentage-of-max-HR formulas invalid. Use RPE (1-10 scale) and the talk test exclusively for these users.

8. **Zone numbers must always be presented as ranges, never as single BPM targets.** Zones are bands of physiological response, not precise thresholds. A user trying to hold exactly 142 BPM will overcorrect; a user aiming for 138-148 BPM will train more naturally and effectively.

9. **Cardiac drift must be addressed for any Zone 2 session exceeding 40 minutes.** Failure to mention drift leads users to believe their rising HR is a sign of increasing effort rather than thermoregulatory and cardiovascular fatigue. They will accept Zone 3 training believing it is still Zone 2, which degrades the adaptation stimulus.

10. **When the user's stated fitness goal is fat loss, do not re-frame the plan entirely around high-intensity training for caloric burn.** Research is clear that Zone 2 volume produces superior long-term metabolic adaptation for sustainable fat loss compared to high-intensity caloric burn sessions. Acknowledge that higher intensity burns more calories per minute -- but explain the Zone 2 advantage for long-term metabolic health, fat oxidation enzyme activity, and training sustainability.

11. **Swimming maximum heart rate is approximately 10-13 BPM lower than running max HR** due to the horizontal body position (reduced gravitational load on the heart), hydrostatic pressure, and cooler water temperature. Always apply a modality correction when the user is a swimmer. Failure to adjust results in all zones appearing too hard to reach.

12. **Zone calculations should be reassessed every 8-12 weeks.** Zones are not permanent. A user who consistently trains Zone 2 for 10 weeks will have a lower resting heart rate and improved cardiac output, making original zone calculations outdated. Include a reassessment timeline in every plan.

---

## Edge Cases

### User Does Not Know Their Resting Heart Rate

Use the % Max HR method immediately and proceed. Do not delay the output to wait for RHR measurement.

However, include a dedicated instruction box explaining how to measure RHR properly: lie or sit quietly for 5+ minutes immediately upon waking, before any movement or caffeine. Measure for 60 seconds. Repeat for 3 consecutive mornings and average the results. Note that a single morning measurement is typically within ±3-5 BPM of a multi-day average and is acceptable to use.

After providing the initial % Max HR zones, flag that if the user measures RHR later and it is below 55 BPM or above 75 BPM, they should return to recalculate using the Karvonen method -- the zones will shift meaningfully.

### User Is on Beta-Blockers or Other HR-Suppressing Medication

Do not attempt to modify zone formulas to compensate for medication. There is no validated adjustment factor. Instead:
- Explain clearly that the medication artificially caps heart rate response, making BPM-based zones unreliable
- Switch entirely to RPE (1-10) and talk test for zone identification
- Map the five zones to RPE bands: Z1 = RPE 1-3, Z2 = RPE 3-4, Z3 = RPE 5-6, Z4 = RPE 7-8, Z5 = RPE 9-10
- Encourage the user to discuss exercise intensity targets with their prescribing physician, who may provide specific guidance
- Present the full plan using only RPE and talk test descriptors, removing all BPM values from the zone table

### User Is Over 60 or Describes Significant Deconditioning

The 220-age formula becomes progressively less accurate above age 60, with some research showing actual max HR values 10-20 BPM higher than formula predictions in well-trained older adults, and similar deviations in the opposite direction for deconditioned individuals.

Approach:
- Lead with RPE and talk test as the primary guidance tools, with HR zones as a secondary reference only
- Emphasize Zone 1 and Zone 2 exclusively for the first 4-6 weeks before suggesting any Zone 3 introduction
- For a 65-year-old, the formula gives Max HR = 155 BPM, which may be significantly wrong in either direction -- flag this explicitly
- Note that Tanaka's formula (208 - 0.7 × age) tends to be slightly more accurate for older populations than 220-age
- Recommend that users in this demographic discuss exercise testing with a healthcare provider before pursuing Zone 4-5 training

### User Wants to Train Only at High Intensity (Zone 4-5) for Faster Results

This is common among users who associate "harder = better" with fitness progress. Address it with evidence-based framing, not dismissal.

Explanation to provide:
- Without an aerobic base developed through Zone 2, high-intensity sessions are metabolically expensive but structurally inefficient: the cellular machinery (mitochondria, oxidative enzymes, capillaries) needed to utilize high-intensity training is built primarily through Zone 2 volume
- An analogy: Zone 4-5 is the engine, Zone 2 is the fuel system and cooling system. Building a bigger engine without improving fuel delivery and heat management leads to rapid breakdown
- Research on elite endurance athletes consistently shows that even those performing at world-class levels spend 75-80% of training time below lactate threshold
- Recommend a minimum 6-8 week Zone 2 foundation phase before introducing regular Zone 4 work, and at least 12 weeks before meaningful Zone 5 intervals
- Acknowledge that for users with very limited time (2-3 sessions/week), a slightly higher Zone 3 proportion is acceptable since total volume is already low

### User Combines Cardio with Heavy Strength Training

Concurrent training creates interference effects when high-intensity cardio and heavy resistance training are not properly sequenced. Zone selection interacts with recovery demands.

Specific guidance:
- Zone 2 cardio (30-45 minutes) can be performed on the same day as strength training with minimal interference if separated by at least 6 hours. In the same session, strength training should precede cardio.
- Zone 3-4 cardio performed within 24 hours before a heavy lower-body strength session significantly impairs force production due to residual fatigue in the same muscle groups (particularly for cycling, running, and rowing)
- Zone 5 intervals should never precede a compound lower-body strength session by less than 24 hours
- Active recovery Zone 1 sessions (20-30 minutes) can be used on strength training days to enhance blood flow without competing for recovery resources
- For users doing 4+ days of strength training, prioritize Zone 2 for all cardio and reserve Zone 4-5 for periods of reduced strength training volume (deload weeks)

### User Is Transitioning From Running to Another Modality (or Vice Versa)

Max heart rate and zone thresholds are not perfectly transferable across exercise modalities.

Known modality-specific adjustments:
- **Swimming:** Subtract 10-13 BPM from running-derived max HR. Zones will appear harder to reach at a given RPE. This is normal and expected.
- **Cycling:** Max HR on a bike is typically 5-10 BPM lower than running max, particularly on stationary equipment. Indoor cycling in upright position yields higher HR than aerobars/TT position.
- **Rowing:** Engages 85%+ of total muscle mass; max HR approaches running values or exceeds them in well-trained rowers. Use running-derived max HR as a starting estimate.
- **Elliptical:** Typically 5-7 BPM lower than running due to reduced ground contact forces and slightly less eccentric muscle loading.
- If a user recently experienced a dramatic change in perceived exertion relative to their expected zones, check whether they have changed modalities -- do not assume the zone calculations are wrong.

### User Has Unusually High or Low Resting Heart Rate

- **RHR below 45 BPM:** This is within the normal range for well-trained endurance athletes (athlete's heart) and increases HRR, producing higher absolute zone targets. This is appropriate -- do not flag it as a concern unless the user describes symptoms.
- **RHR above 90 BPM:** Indicates high cardiovascular stress, deconditioning, illness, or chronic stress. In this range, Zone 2 training produces rapid benefit, but the user should start with shorter sessions (20-25 minutes) and build gradually. Also recommend that the user discuss chronically elevated RHR with a healthcare provider if it does not decrease with regular training over 4-6 weeks.
- If RHR exceeds 100 BPM consistently, do not build a training plan. Recommend medical evaluation before beginning any structured cardio program.

---

## Example

**Input:** "I'm 38 years old, resting heart rate around 58. I mostly cycle indoors on my stationary bike. Goal is to build better cardiovascular endurance -- I want to do a 100-mile charity ride in about 7 months. I can commit to 4 cardio sessions per week. I have a Bluetooth heart rate chest strap."

**Output:**

---

## Cardio Training Zones: Indoor Cycling -- Endurance Base Building (Age 38)

> *Disclaimer: This is general wellness information, not medical advice. Consult a healthcare professional before beginning a new training program.*

---

### Calculation Summary

| Parameter              | Value                                                 |
|------------------------|-------------------------------------------------------|
| Age                    | 38 years                                             |
| Estimated Max HR       | 182 BPM (220 - 38 = 182)                             |
| Alternate Max HR Est.  | 182 BPM (208 - 0.7 × 38 = 181.4, rounds to 182)     |
| Resting Heart Rate     | 58 BPM                                               |
| Heart Rate Reserve     | 182 - 58 = 124 BPM                                   |
| Calculation Method     | Karvonen HRR (more accurate with known resting HR)   |

**Note:** The 220-age formula has a standard deviation of ±10-12 BPM. Your actual max HR may range from approximately 170-194 BPM. The Karvonen method reduces some of this error by incorporating your resting HR (58 BPM), which reflects a good cardiovascular baseline. As you train consistently over the next 7 months, remeasure your resting HR every 6-8 weeks and recalculate zones when it changes by 3+ BPM.

**Cycling note:** Stationary bike max HR typically runs 5-10 BPM lower than running max HR for the same individual. Your zones below already reflect your cycling modality -- if you ever test zones outdoors running, expect to reach higher BPM values at equivalent perceived effort.

---

### Personal Zone Chart

*Formula: Target HR = (HRR × Zone %) + RHR = (124 × Zone %) + 58*

| Zone | Name              | HR Range (BPM) | % HRR   | Blood Lactate  | RPE (1-10) | Talk Test                      |
|------|-------------------|----------------|---------|----------------|------------|--------------------------------|
| 1    | Active Recovery   | 120 -- 132     | 50-60%  | < 1 mmol/L     | 1-3        | Full conversation, effortless  |
| 2    | Aerobic Base      | 132 -- 145     | 60-70%  | 1-2 mmol/L     | 3-4        | Conversational, full sentences |
| 3    | Aerobic Tempo     | 145 -- 157     | 70-80%  | 2-4 mmol/L     | 5-6        | Short phrases, slightly winded |
| 4    | Lactate Threshold | 157 -- 170     | 80-90%  | 4-6 mmol/L     | 7-8        | 2-3 words, heavy breathing     |
| 5    | VO2max            | 170 -- 182     | 90-100% | 6-15 mmol/L    | 9-10       | Cannot speak, maximal effort   |

**Worked examples:**
- Zone 2 lower bound: (124 × 0.60) + 58 = 74.4 + 58 = **132 BPM**
- Zone 2 upper bound: (124 × 0.70) + 58 = 86.8 + 58 = **145 BPM**
- Zone 4 lower bound: (124 × 0.80) + 58 = 99.2 + 58 = **157 BPM**
- Zone 4 upper bound: (124 × 0.90) + 58 = 111.6 + 58 = **170 BPM**

---

### Weekly Training Plan (4 Sessions/Week -- Endurance Base Building)

| Day       | Session Type                  | Zone        | Duration | Structure                                                                      |
|-----------|-------------------------------|-------------|----------|--------------------------------------------------------------------------------|
| Monday    | Zone 2 Steady State           | Zone 2      | 50 min   | 5 min Z1 warm-up + 40 min Z2 (target 132-145 BPM) + 5 min Z1 cooldown        |
| Tuesday   | Full Rest                     | --          | --       | No cardio. Stretching or walking acceptable.                                   |
| Thursday  | Zone 2 Steady State           | Zone 2      | 50 min   | Identical to Monday. Maintain consistent HR; reduce resistance if drifting up  |
| Friday    | Zone 4 Threshold Intervals    | Zone 4      | 45 min   | 10 min Z1 + 4 × 6 min at Z4 (157-170 BPM) with 3 min Z1 recovery + 5 min Z1 |
| Saturday  | Zone 2 Long Ride              | Zone 2      | 70 min   | 5 min Z1 + 60 min Z2 (lower half of zone, 132-138 BPM) + 5 min Z1 cooldown   |
| Sunday    | Active Recovery or Full Rest  | Zone 1      | 20-30 min| Light Z1 spin (under 130 BPM) or complete rest. No intensity today.            |
| Wednesday | Full Rest                     | --          | --       | Recovery. This is where adaptation occurs.                                     |

**Notes on Friday's threshold session:**
Each 6-minute interval should reach Zone 4 (157-170 BPM) within the first 90 seconds and be sustained. If HR exceeds 170 BPM, reduce resistance. The 3-minute recovery between intervals should allow HR to drop below 140 BPM before beginning the next interval. If it does not recover below 140, extend recovery to 4-5 minutes. Do not sacrifice interval quality for pace.

---

### Zone Volume Distribution (Weekly)

| Zone | Zone Name         | Weekly Minutes | % of Total | Primary Adaptation                             |
|------|-------------------|----------------|------------|------------------------------------------------|
| 1    | Active Recovery   | ~25 min        | ~11%       | Warm-up/cooldown, recovery                     |
| 2    | Aerobic Base      | ~165 min       | ~75%       | Mitochondrial density, fat oxidation, cardiac efficiency |
| 3    | Aerobic Tempo     | 0 min          | 0%         | Not programmed in base phase (weeks 1-6)       |
| 4    | Lactate Threshold | ~24 min        | ~11%       | Lactate threshold elevation, VO2max stimulus   |
| 5    | VO2max            | 0 min          | 0%         | Not yet introduced -- insufficient base       |
| **Total** |              | **~214 min**   | **100%**   |                                                |

**Zone distribution note:** At 75% Zone 2 and 11% Zone 4 (with zero Zone 3), this follows a polarized training model. Zone 3 is intentionally excluded in the first 6 weeks to ensure easy days are genuinely easy and the Thursday quality session provides a true high-intensity stimulus. After week 6, one Zone 3 session can replace a Zone 2 session if the endurance base is tracking well.

---

### Monitoring and Execution Notes

**Heart rate monitoring:** Your Bluetooth chest strap is the correct tool for this training. Use it for all sessions. For Zone 2 rides, set an HR alarm at 146 BPM -- if it triggers, reduce resistance immediately rather than accepting drift. For Zone 4 intervals, use the monitor to confirm you reach 157 BPM within 90 seconds of beginning each interval.

**Cardiac drift management:** On Saturday's 70-minute ride, expect your HR to rise gradually over the back half of the session even at constant resistance. This is normal. Target the lower end of Zone 2 (132-138 BPM) at the start so you have a buffer as HR drifts. If HR pushes above 145 by minute 50, reduce resistance by one or two increments -- do not push harder to maintain pace.

**Zone 2 checkpoint for cycling:** A practical on-bike test: at your Zone 2 target HR (132-145 BPM), you should be able to recite a 4-5 word sentence smoothly and without interrupting your breathing rhythm. If you find yourself pausing mid-sentence to breathe, you are in Zone 3. Reduce resistance.

**Progression signal:** After 6-8 weeks of this structure, the same resistance level and cadence will produce a heart rate 5-8 BPM lower than it does today. This is the aerobic adaptation working. When this happens, you will need to increase resistance slightly to remain in Zone 2. That is a good problem -- recalculate zones and continue building.

---

### 8-Week Progression Roadmap

| Weeks | Focus                              | Adjustment from Starting Plan                                          |
|-------|------------------------------------|------------------------------------------------------------------------|
| 1-2   | Zone 2 establishment               | Begin exactly as above. Prioritize HR adherence over pace or resistance. Some sessions may feel "too easy." That is correct. |
| 3-4   | Zone 2 volume build                | Extend Monday and Thursday rides from 50 to 60 minutes. Saturday long ride extends to 80 minutes. |
| 5-6   | Threshold session refinement       | Increase Friday intervals: progress from 4 × 6 min to 3 × 10 min at Zone 4. Maintain same 3-min recoveries. |
| 7-8   | Reassess and consolidate           | Remeasure resting HR. If dropped by 3+ BPM, recalculate all zones using updated Karvonen figures. Consider adding a second quality session if response is strong. |

**Looking ahead to the 100-mile ride (7 months out):**
The Zone 2 base you build in months 1-3 is the foundation for everything else. In months 4-5, long Saturday rides will extend to 90-120 minutes. In month 6, outdoor long rides of 3-4 hours become the primary session. Zone 4 work continues weekly to raise your threshold, which directly improves your sustained power at the century pace. For race-specific pacing strategy and taper, consult the `running-training-plan` skill (or a cycling-specific equivalent) once the endurance base is established.
