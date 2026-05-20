---
name: symptom-documentation-guide
description: |
  Teaches how to observe, record, and organize symptoms systematically for productive medical conversations. Produces a symptom documentation template with structured observation categories, pattern tracking, and provider communication frameworks. Does NOT interpret or diagnose symptoms.
  Use when the user asks about documenting symptoms, keeping a symptom diary, how to describe symptoms to a doctor, or tracking health patterns over time.
  Do NOT use for interpreting symptoms, suggesting diagnoses, recommending treatments, or assessing symptom severity.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "guide template strategy"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Symptom Documentation Guide

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user wants to build a symptom diary or health journal and needs a structured framework for what to observe and record
- A user has a recurring symptom (headaches, fatigue, stomach discomfort, joint pain, skin flares, dizziness) and wants to identify patterns before a medical appointment
- A user says their doctor asked them to "keep track" of symptoms and they are not sure what information to capture
- A user wants to improve how they describe their symptoms in appointments -- moving from vague descriptions ("I just feel off") to precise, actionable observations
- A user is tracking symptoms that are tied to potential triggers -- food, activity, sleep, stress, menstrual cycle, weather, or environmental exposures
- A user is preparing for a first specialist appointment and wants to arrive with organized documentation rather than relying on memory
- A user has been living with a chronic condition and wants to detect whether their symptom pattern is changing over time

**Do NOT use when:**
- The user asks what their symptoms might mean or indicate -- this requires clinical interpretation and falls outside this skill's scope; acknowledge the question and advise them to raise it with their provider
- The user asks whether their symptoms are serious or whether they should see a doctor -- do not assess urgency; advise consulting their healthcare provider promptly and, if symptoms feel severe or sudden, contacting emergency services
- The user asks for treatment recommendations, home remedies, or medication guidance -- defer entirely to their provider; see the medication-tracking or treatment-adherence skills for related but distinct workflows
- The user describes symptoms consistent with acute emergency (chest tightness, shortness of breath, sudden severe headache, one-sided weakness, sudden vision change, high fever with stiff neck) -- stop all other guidance and advise contacting emergency services immediately
- The user wants to interpret patterns they have already documented -- pattern interpretation is clinical reasoning; help the user formulate their observations as questions for their provider instead
- The user is seeking a specific diagnosis through a different framing ("I don't want a diagnosis, I just want to know if this sounds like X") -- this is still diagnostic reasoning; redirect to documentation and provider consultation

---

## Process

### Step 1: Clarify the Documentation Goal Before Building Anything

Begin by understanding what the user actually needs. The right documentation structure depends entirely on context.

- Ask whether they are tracking a single symptom or multiple concerns simultaneously -- multiple symptoms require correlation tracking in addition to individual logs
- Determine how long the symptom has been present: new (days to 2 weeks), subacute (2--6 weeks), or chronic/recurring (months to years) -- this shapes how long they need to track before the appointment
- Find out whether they have an upcoming appointment (and when) -- if the appointment is in 3 days, help them create a retrospective summary from memory; if it is in 4 weeks, build a prospective daily log
- Ask whether a provider has given them specific instructions about what to track -- if yes, build the template to match those instructions exactly; provider-specified tracking always takes priority
- Ask what tool or format they prefer for recording: handwritten notebook, phone notes app, a spreadsheet, printed template -- format matters for actual compliance; the best documentation system is the one the user will actually use

### Step 2: Teach the OPQRST Observation Framework

OPQRST is the gold-standard clinical framework used by healthcare professionals to characterize any symptom. Teaching users to apply it produces documentation that directly maps to how providers think.

- **O -- Onset:** When did the symptom first appear? Was the onset sudden (appearing in seconds to minutes) or gradual (building over hours or days)? What were you doing when it started?
- **P -- Provocation/Palliation:** What makes it worse? What makes it better? Specific positions, foods, activities, temperatures, stress levels, time of day, medications taken
- **Q -- Quality:** What does the sensation feel like? Teach a vocabulary of descriptors:
  - Pain descriptors: sharp, stabbing, dull, aching, burning, cramping, throbbing, pressure-like, squeezing, shooting, gnawing, tearing
  - Non-pain descriptors: tingling, numbness, heaviness, tightness, fullness, fluttering, pulsing, crawling, itching, warmth, cold
- **R -- Region/Radiation:** Where exactly is the symptom located? Does it move or radiate to another area? Ask the user to point to the specific location on their body and note whether it stays fixed or travels (e.g., "starts in my lower back and moves down my right leg")
- **S -- Severity:** Use the 0-10 numeric scale consistently -- 0 means the symptom is completely absent, 5 means it is present and noticeable but not preventing activity, 10 means the worst imaginable version of that sensation. Record both the typical severity and the peak severity experienced
- **T -- Timing:** How long does each episode last (seconds, minutes, hours, constant)? Is it continuous or intermittent? How frequently does it occur (daily, several times per week, weekly)? Is there a time-of-day pattern?

### Step 3: Build the Right Log Structure for the Symptom Type

Different symptom categories warrant different logging emphases. Apply domain-specific column configurations:

**For pain symptoms (headache, back pain, joint pain, abdominal pain):**
  - Location specificity (point location vs. regional) and radiation pattern are critical
  - Include a body map field -- instruct users to mark the location on a simple front/back body outline
  - Add a functional impact column: "What did this prevent you from doing?" -- this is clinically meaningful beyond intensity alone
  - Track position-dependency: does lying down, sitting, or standing make it better or worse?

**For gastrointestinal symptoms (nausea, cramping, bloating, changes in bowel habits):**
  - Track the prior 2-hour food and beverage intake for every episode
  - Include a bowel habits column if relevant -- frequency, consistency using Bristol Stool Scale descriptors (formed, loose, watery) without asking the user to interpret what this means clinically
  - Note whether onset is related to eating: before meals, immediately after, 30-60 minutes post-meal, 2+ hours after
  - Track stress and sleep quality on the same day as high-impact variables

**For fatigue, mood, or cognitive symptoms:**
  - Intensity alone is insufficient -- add functional impact: "Could not drive / could not work / rested for 2 hours"
  - Track sleep the prior night (hours and perceived quality on a 1-5 scale)
  - Note hydration and caffeine intake as baseline variables
  - Track time of day carefully -- fatigue that is worst in the morning has different pattern implications than late-afternoon crashes

**For skin symptoms (rash, hives, itching, flares):**
  - Track location AND spread over time (did it appear in one spot and spread?)
  - Note any new products used in the prior 72 hours: detergents, lotions, soaps, foods, medications
  - Environmental exposures: outdoor time, animals, dust, pollen levels
  - Temperature and moisture: hot shower before onset? Sweating? Cold exposure?

**For cyclical or hormonal-pattern symptoms:**
  - Build the log to track cycle day if the user tracks their menstrual cycle
  - Note whether symptoms correlate with the week before menstruation, during, or after
  - Track 2 full cycles minimum to detect a cyclical pattern

### Step 4: Establish Consistent Intensity and Impact Scaling

Numbers without calibration are unreliable across time. Help users establish personal anchors for their own scale:

- **0-10 Pain/Intensity Scale Calibration:** Help the user define their personal anchors before they begin:
  - Their personal 10: "Think of the most severe version of this symptom you have ever experienced -- that is your 10"
  - Their personal 5: "Present but you can carry on with normal activity with moderate effort"
  - Their personal 3: "You notice it but it does not interrupt what you are doing"
  - Their personal 7-8: "You are modifying your behavior because of it -- skipping activities, resting"
- **Functional Impact Scale (1-4):** Use this alongside the intensity number for a more meaningful picture:
  - 1 = Noticeable but no activity change
  - 2 = Modified one or more activities (chose not to exercise, took a break)
  - 3 = Stopped a planned activity or required rest
  - 4 = Unable to perform daily tasks (work, childcare, self-care)
- Consistency rule: encourage the user to always record intensity and impact at the same point in an episode -- e.g., "record when symptoms are at their worst" or "record 30 minutes after onset" -- rather than retrospectively

### Step 5: Build the Trigger Tracking Layer

Trigger identification is the highest-value output of a symptom diary because it gives the provider actionable clinical hypotheses. Build this layer deliberately:

- Create a standardized list of potential trigger categories based on the symptom type, then help the user check them against each episode:
  - **Dietary:** specific foods, alcohol, caffeine, skipped meals, large meals, eating time
  - **Activity:** exercise (intensity and type), prolonged sitting, prolonged standing, specific movements
  - **Sleep:** hours the prior night, sleep quality (1-5), unusual sleep schedule
  - **Stress:** work stress, social stress, significant events -- rate stress level 1-5 for that day
  - **Environmental:** weather changes (barometric pressure drops are a documented trigger for certain headache types), temperature extremes, air quality, seasonal allergens
  - **Medications and supplements:** what was taken in the prior 24 hours, including timing
  - **Hormonal:** menstrual cycle day if relevant
  - **Postural and positional:** body position at onset, recent physical activity, screen time duration
- Teach the user not to pre-assume which triggers matter -- the goal is to record broadly for the first 2 weeks, then identify patterns from data rather than assumption
- True trigger identification requires seeing a symptom occur AND NOT occur relative to a potential trigger. Advise recording potential trigger exposure even on symptom-free days

### Step 6: Design the Weekly Pattern Summary

Raw daily logs are data. The weekly summary converts data into patterns that are communicable to a provider in a 10-15 minute appointment:

- At the end of each week, calculate or estimate:
  - Total episode count for the week
  - Average intensity and peak intensity
  - Episode duration range (shortest to longest)
  - Most consistent trigger across episodes (appears in 3 or more episodes)
  - Most effective relief method (reduced intensity by at least 2 points or resolved episode)
  - Any new associated symptoms that appeared this week
- Add a qualitative "Pattern Notes" field -- this is where the user writes in plain language what they noticed: "All 4 episodes this week happened within 1 hour of eating" or "The three worst episodes were all Monday/Tuesday -- high-stress workdays"
- Compare week-over-week: Is frequency increasing, decreasing, or stable? Is intensity changing? Are new symptoms emerging? A clear trend direction is clinically valuable even if the user cannot explain it

### Step 7: Build the Provider Communication Summary

Before the appointment, help the user compile all tracking data into a one-page summary structured around how clinicians receive information. Most appointments are 15-20 minutes; a well-organized one-page summary maximizes the value of that time:

- **Structured summary format (OPQRST-aligned):**
  - Symptom name (descriptive, not diagnostic): "Recurring cramping sensation in the left lower abdomen"
  - Tracking duration: "Tracked for [X] weeks, [Y] total episodes recorded"
  - Frequency: "[X] episodes per week on average"
  - Intensity: "Typical [X]/10, peak [Y]/10"
  - Timing pattern: "Onset most common [time of day / day of week / relationship to meals or activity]"
  - Identified triggers: listed in order of consistency
  - Identified relief: what has worked and to what degree
  - Functional impact: "Caused me to stop activity / rest / miss work on [X] occasions"
  - Trend: "Frequency has [increased / decreased / remained stable] over the tracking period"
- **Questions section:** Help the user convert their observations into specific questions:
  - Format: "I noticed [observation] -- is that significant?"
  - Format: "The symptom seems to [pattern] -- does that point to anything I should know about?"
  - Format: "Is there a specific trigger or pattern you would like me to track more precisely before our next visit?"
- Advise the user to bring both the one-page summary AND the raw daily log to the appointment -- the provider may want to see the raw data

### Step 8: Establish a Maintenance and Review Protocol

If the tracking is long-term (for a chronic condition or ongoing monitoring), build in a review structure:

- **Daily:** Record within 30 minutes of an episode when possible -- retrospective recording at end-of-day is acceptable but same-day recording is more accurate
- **Weekly:** Complete the pattern summary every Sunday (or whatever day works consistently) while the week is fresh
- **Monthly:** Review 4-week trends, note any changes in baseline, update the trigger list based on new observations
- **Before appointments:** Compile the provider summary 2-3 days before the appointment -- not the morning of, when there is no time to organize clearly
- **After appointments:** Record what the provider said in response to the tracking data -- this creates continuity if the symptom recurs or the provider changes

---

## Output Format

```
## Symptom Documentation System
**Created:** [Date tracking begins]
**Tracking for:** [Appointment date or "ongoing monitoring"]
**Primary symptom(s) being tracked:** [Descriptive name -- e.g., "Recurring pressure sensation behind eyes"]

---

### Daily Symptom Log

| Date | Time | Symptom Description | Location | Radiation | Intensity (0-10) | Functional Impact (1-4) | Duration | Onset Context | Potential Triggers | Relief Attempted | Relief Effect | Associated Symptoms |
|------|------|---------------------|----------|-----------|-------------------|--------------------------|----------|---------------|-------------------|-----------------|---------------|---------------------|
|      |      |                     |          |           |                   |                          |          |               |                   |                 |               |                     |

**Intensity Scale Anchors (set at start of tracking):**
- My 10: [User-defined worst experience]
- My 5: [User-defined -- present but manageable]
- My 3: [User-defined -- noticeable, not disruptive]

**Functional Impact Scale:**
- 1 = Noticeable, no activity change
- 2 = Modified an activity
- 3 = Stopped a planned activity / rested
- 4 = Unable to perform daily tasks

---

### Trigger Checklist (Review After Each Episode)

**Dietary (prior 2 hours):**
- [ ] Specific food: ___________
- [ ] Alcohol: ___________
- [ ] Caffeine: ___________
- [ ] Skipped meal / fasting
- [ ] Large meal
- [ ] Other: ___________

**Activity and Posture:**
- [ ] Exercise type/intensity: ___________
- [ ] Prolonged sitting (>2 hours): ___________
- [ ] Prolonged standing
- [ ] Specific movement or position: ___________

**Sleep (prior night):**
- [ ] Hours slept: ___________
- [ ] Sleep quality (1-5): ___________
- [ ] Unusual schedule (shift, travel, disruption)

**Stress:**
- [ ] Stress level today (1-5): ___________
- [ ] Significant stressor: ___________

**Environmental:**
- [ ] Weather change (temperature drop, storm, barometric change)
- [ ] Allergen season / outdoor exposure
- [ ] New product (detergent, soap, lotion, food)
- [ ] Temperature extreme (heat, cold)

**Medications / Supplements:**
- [ ] Taken in prior 24 hours: ___________
- [ ] Timing relative to symptom: ___________

**Other:**
- [ ] Menstrual cycle day (if tracking): ___________
- [ ] Other notable context: ___________

---

### Weekly Pattern Summary

| Week | Episodes | Avg Intensity | Peak Intensity | Avg Duration | Functional Impact (episodes at level 3-4) | Most Consistent Trigger | Most Effective Relief | Trend vs. Last Week | Pattern Notes |
|------|----------|---------------|----------------|--------------|-------------------------------------------|------------------------|-----------------------|---------------------|---------------|
| 1    |          |               |                |              |                                           |                        |                       | (baseline)          |               |
| 2    |          |               |                |              |                                           |                        |                       |                     |               |
| 3    |          |               |                |              |                                           |                        |                       |                     |               |
| 4    |          |               |                |              |                                           |                        |                       |                     |               |

---

### Symptom-Free Day Log (Optional but Valuable)

On days with NO symptom, note which potential triggers were present but did NOT cause a symptom. This helps distinguish true triggers from coincidental patterns.

| Date | Potential Triggers Present | Symptom Occurred? |
|------|---------------------------|-------------------|
|      |                           | No                |

---

### Provider Summary (Bring to Appointment)

**Symptom (descriptive):** [e.g., "Recurring cramping sensation, left lower abdomen"]
**Tracking period:** [Start date] to [End date] -- [X] weeks total
**Total episodes recorded:** [N]
**Average frequency:** [X] episodes per week
**Typical intensity:** [X]/10 | Peak intensity recorded: [Y]/10
**Typical duration per episode:** [Range]
**Functional impact:** [X] episodes caused activity modification; [Y] episodes caused activity stoppage

**Timing Pattern:**
- Time of day: [e.g., "Most episodes occur between 7-9 PM"]
- Day-of-week pattern: [e.g., "No consistent pattern" or "More frequent on weekdays"]
- Relationship to meals/activity: [e.g., "Typically within 45 minutes of eating"]

**Identified Triggers (in order of consistency):**
1. [Trigger -- observed in X of Y episodes]
2. [Trigger -- observed in X of Y episodes]
3. [Trigger -- observed in X of Y episodes]

**Effective Relief:**
- [Relief method] -- reduced intensity by approximately [X] points / resolved episode in [Y] minutes
- [Relief method] -- [effect observed]

**Trend Over Tracking Period:** [Frequency increasing / decreasing / stable / changing pattern -- describe]

**Associated Symptoms Observed:**
- [Symptom] -- occurred alongside primary symptom in [X] of [Y] episodes

**Questions for My Provider:**
1. I noticed [specific observation] -- is that pattern significant?
2. [Trigger] seems to precede episodes consistently -- does that tell you anything useful?
3. [Relief method] works about [X]% of the time -- is that worth discussing?
4. The [frequency/intensity] has been [trend] over 4 weeks -- is that expected?
5. Are there specific additional details you would like me to track before our next visit?
```

---

## Rules

1. **Always present the disclaimer before providing any guidance** -- this is non-negotiable regardless of how benign the symptom description seems.

2. **Never interpret symptoms or suggest what they might indicate** -- if the user asks "does this sound like X?", redirect entirely: "That interpretation is for your provider -- what I can help you do is document your observations clearly so your provider has the best possible information to make that judgment."

3. **Never assess whether a symptom is serious, urgent, or can wait** -- severity assessment requires clinical training, physical examination, and medical history. If the user asks, advise contacting their provider. If symptoms sound acute (sudden, severe, involving chest, breathing, neurological changes), stop all documentation guidance and advise emergency services.

4. **Teach descriptive language, not interpretive language** -- the user's job is to report what they observe with sensory precision; the provider's job is to interpret what it means. A user who says "I think I have [condition]" anchors the provider to their assumption; a user who says "pressure-like sensation, 7/10, lasting 3 hours, unrelieved by rest" gives the provider raw clinical data.

5. **Always calibrate the 0-10 intensity scale to the user's personal anchors at the start of tracking** -- without personal anchors, intensity numbers drift across days and episodes, making trend data unreliable. A "6 today" should mean the same thing as "6 three weeks ago."

6. **Include trigger tracking in every documentation system** -- trigger identification is the primary mechanism through which a symptom diary generates actionable clinical information beyond what a patient can report from memory.

7. **Track symptom-free days when relevant for trigger patterns** -- if a user suspects a specific trigger, a trigger present on a symptom-free day is evidence against that trigger. Diary data without symptom-free day context can create false trigger associations.

8. **Recommend a minimum of 2 full weeks of prospective tracking before an appointment** -- for recurring symptoms, 2 weeks captures enough episodes to identify patterns, but not so long that the user feels overwhelmed before acting. For weekly-or-less frequent symptoms, 4 weeks is the minimum for meaningful frequency data.

9. **Never recommend specific apps, wearables, or commercial health tracking products** -- platform recommendations are outside scope and may become outdated or unavailable. Acknowledge that digital tools exist and that the user can ask their provider for recommendations if they want a digital option.

10. **Adapt the log structure to the symptom type** -- a gastrointestinal log must include food intake columns that a headache log does not need. A skin symptom log requires product and environmental exposure columns. Generic one-size-fits-all templates produce lower-quality data than symptom-specific ones. Always customize.

11. **If the user has multiple symptoms, create a correlation tracking layer** -- symptoms that co-occur are clinically significant. The user should note in each episode log whether other tracked symptoms were also present that day, so the provider can see whether symptoms cluster together or appear independently.

12. **Never tell the user how to act on documented patterns** -- if the user observes "I always feel worse after coffee," the response is not "you should try eliminating coffee." The response is "that is a valuable observation -- bring it to your provider as a specific question." Dietary or behavioral change recommendations are clinical decisions.

---

## Edge Cases

### Tracking Symptoms for a Child

Parents cannot rely on a child's self-reported intensity score, especially under age 8-10. Adapt the framework:
- Replace the 0-10 intensity scale with a behavioral impact scale: 1 = playing/active normally, 2 = quieter than usual / self-limiting activity, 3 = resting voluntarily / not eating normally, 4 = crying / unable to be comforted / refusing all normal activities
- Add columns specifically for: appetite change (eating normal / eating less / refusing food), sleep disruption (fell asleep earlier / woke at night / napped when normally does not), behavioral change (irritable, clingy, withdrawn)
- Record the child's own description verbatim in quotation marks alongside the parent's behavioral observation -- "my tummy is on fire" alongside "child bent over and declined dinner" gives the provider both data points
- Track school attendance and participation as a functional impact measure: "Went to school but nurse called at noon" is a meaningful data point
- Note parental distress level separately -- a parent's perception of severity can influence documentation; keeping the behavioral scale objective helps

### User Has Multiple Simultaneous Symptoms to Track

When a user is tracking 3 or more concurrent symptoms, individual logs become unmanageable. Structure for this scenario:
- Create one master daily log with a row per symptom per day (not per episode) to track co-occurrence
- Use color-coding or column groupings to distinguish symptom categories
- Add a "same-day co-occurrence" column to each symptom section: "Did [other symptom] also occur today? Y/N"
- In the weekly summary, add a correlation row: "Symptom A and Symptom B occurred together in [X] of [Y] episodes this week"
- Prioritize: if the user is overwhelmed, help them identify which 1-2 symptoms are most disruptive to their daily life and build a detailed log for those first; note others at a simpler level (occurred: Y/N, intensity: High/Medium/Low)

### User Is Trying to Track Symptoms Retrospectively From Memory

For users who have not been tracking and have an appointment in days rather than weeks:
- Start with a timeline reconstruction: working backward week by week, ask what they can recall about frequency (roughly how many times per week?), intensity (was it ever bad enough to stop activity?), and any consistent circumstances
- Capture at least 4-6 specific episodes from memory in the daily log format, even if dates are approximate -- "approximately 3 weeks ago, after dinner" is more useful than no data
- Have the user note which elements are estimated ("~") vs. clearly recalled -- providers understand memory limitations and appreciate the transparency
- Build a "history and pattern" narrative section alongside the log: "Over the past 2 months, I believe this has occurred approximately X times per week and has been [getting worse / staying the same / better since Y]"
- Emphasize beginning prospective tracking immediately even if only 1-3 days of real-time data are available before the appointment

### User Was Given a Specific Tracking Form by Their Provider

This is the highest-priority scenario -- the provider's format overrides any generic template:
- Ask the user to describe every field on the provider's form before building anything
- Map the OPQRST framework onto the provider's specific field names -- they are almost certainly capturing the same dimensions, just labeled differently
- If the provider's form has fields the user does not understand, help them understand what observation those fields are asking for without interpreting what the answers mean
- If the provider's form seems to be missing a dimension the user finds important (e.g., no trigger column), advise tracking it separately and mentioning it verbally at the appointment: "The form didn't have a trigger column, but I kept a separate note of what preceded each episode"
- Help the user complete any pre-appointment fields with the data they have already collected

### User Describes Symptoms That Sound Acute or Emergent While Setting Up a Tracking System

This is not an edge case -- it is a priority interrupt. If a user mentions any of the following while asking about documentation, stop all documentation guidance immediately:
- Chest pain, pressure, or tightness
- Shortness of breath at rest
- Sudden severe headache described as "worst of my life"
- One-sided weakness, numbness, or facial drooping
- Sudden vision changes or loss
- Confusion or difficulty speaking
- High fever with severe headache and neck stiffness
- Severe abdominal pain with rigidity
- Any symptom the user themselves describes as the worst they have ever felt, sudden in onset, or frightening

Response in these cases: "What you are describing could require immediate medical attention. Please contact emergency services (call your local emergency number) or go to the nearest emergency department rather than setting up a tracking system. Documentation can always wait -- please prioritize getting evaluated now."

### User Wants to Track Symptoms Over a Very Long Timeline (6+ Months)

For chronic condition monitoring, the daily log format becomes unwieldy at scale. Adapt:
- Shift to a weekly-entry format rather than episode-by-episode after the first 4-6 weeks of establishing a baseline
- Create a monthly summary page that tracks frequency, average intensity, and functional impact per month in a single row -- this allows a full year to be represented in 12 rows
- Add a "baseline change" indicator: a threshold the user and provider agreed upon that would trigger additional contact (e.g., "if frequency exceeds 4 episodes per week for 2 consecutive weeks")
- Build a "notable events" log separate from the symptom log: major stressors, illnesses, travel, significant dietary or lifestyle changes, medication changes -- providers correlating symptom trends with life events need this context
- Revisit and recalibrate intensity anchors at the 3-month and 6-month marks, because chronic exposure to a symptom can shift perceived baseline over time

### User Tracks Symptoms but Cannot Identify Any Consistent Triggers

This is a valid and important outcome -- absence of trigger patterns is itself clinically meaningful:
- Help the user articulate it clearly in the provider summary: "Over [X] weeks and [Y] episodes, I tracked [list of trigger categories] and was unable to identify a consistent pattern. Episodes appear to occur without a consistent preceding circumstance."
- Suggest adding a "random vs. patterned" field to the weekly summary: did this week's episodes seem to cluster around anything, or were they distributed without obvious pattern?
- Advise the user that lack of identifiable triggers is useful information for the provider -- it narrows the clinical picture differently than trigger-associated symptoms do
- Do not push the user to find triggers that may not exist -- confirmation bias in trigger tracking (attributing each episode to whatever preceded it) produces false patterns

---

## Example

**Input:** "I've been having headaches several times a week for the past month. I have an appointment with my doctor in 3 weeks and want to track them properly before I go."

**Output:**

---

## Symptom Documentation System: Recurring Headaches
**Created:** [Today's date]
**Tracking through:** [Appointment date -- approximately 3 weeks]
**Primary symptom:** Recurring headache -- descriptive tracking only

---

### Intensity Scale -- Set Your Personal Anchors Now (Before You Begin)

Answer these once and keep them visible when you record:
- **My 10:** The worst headache I have ever had (or can imagine)
- **My 7-8:** Bad enough that I stop what I am doing and lie down
- **My 5:** Clearly there, getting in the way of concentration, but I can push through
- **My 3:** I notice it in the background but it is not affecting what I am doing
- **My 0:** Completely gone

Use these same reference points every time you record to keep your numbers consistent across weeks.

---

### Daily Headache Log

Fill in one row each time a headache occurs. Record as close to the time of the episode as possible -- same-day is always better than next-morning recall.

| Date | Start Time | Location (front/back/one side/both sides/behind eyes/top of head) | Quality (throbbing, pressure, stabbing, tight band, dull ache, other) | Intensity at Onset (0-10) | Peak Intensity (0-10) | Duration (minutes/hours) | Functional Impact (1-4) | Sleep Prior Night (hours + quality 1-5) | Stress Level That Day (1-5) | Food/Caffeine in Prior 2 Hours | Activity Before Onset | Light/Sound Sensitivity (Y/N) | Nausea (Y/N) | What You Tried for Relief | Relief Effect (reduced by X points / no change / resolved) |
|------|------------|---------------------------------------------------------------------|------------------------------------------------------------------------|---------------------------|----------------------|--------------------------|--------------------------|----------------------------------------|-----------------------------|-------------------------------|----------------------|-------------------------------|--------------|---------------------------|-----------------------------------------------------------|
|      |            |                                                                     |                                                                        |                           |                      |                          |                          |                                        |                             |                               |                      |                               |              |                           |                                                           |

**Functional Impact Reference:**
- 1 = Noticeable, no change to plans
- 2 = Reduced activity level (quieter, took a break)
- 3 = Stopped activity, rested
- 4 = Unable to work, care for myself/others, or carry out normal tasks

---

### Trigger Checklist (Review After Each Episode)

Check anything that was present in the few hours before the headache began. You are recording observations, not conclusions -- a trigger is just something that was present; your provider will help interpret what it means.

**Sleep:**
- [ ] Less than 6 hours sleep the night before
- [ ] More than 9 hours sleep (oversleeping is a documented pattern in some headache types)
- [ ] Disrupted or poor-quality sleep
- [ ] Unusual sleep schedule (weekend lie-in, shift change, travel time zones)

**Dietary:**
- [ ] Skipped a meal or ate significantly later than usual
- [ ] Dehydration / lower fluid intake than normal
- [ ] Alcohol (type and amount: _________)
- [ ] High caffeine intake
- [ ] Caffeine withdrawal (lower than usual / missed morning coffee)
- [ ] Specific food consumed (note it -- let your provider identify patterns): _________
- [ ] Large meal within 30 minutes before onset

**Environmental:**
- [ ] Weather change (temperature drop, incoming storm, humidity change)
- [ ] Strong smells (perfume, cleaning products, smoke, paint)
- [ ] Bright or flickering light (screens, fluorescent lights, sunlight)
- [ ] Loud or sustained noise
- [ ] High altitude or pressure change (flight, elevation)

**Physical and Postural:**
- [ ] Prolonged screen time before onset (hours: _______)
- [ ] Poor posture / sustained neck position (driving, desk work)
- [ ] Strenuous physical exertion
- [ ] Coughing, straining
- [ ] Eye strain (sustained reading, detailed close work)

**Stress:**
- [ ] High-stress day (rate: _____/5)
- [ ] Emotional distress, conflict, or significant event
- [ ] Post-stress / letdown (headache started after stressful period ended -- sometimes called "letdown headache")

**Hormonal (if applicable):**
- [ ] Menstrual cycle day: ______ (note day 1 = first day of menstruation)

**Medications:**
- [ ] Pain medication taken in prior 48 hours (type and frequency: _________)
- [ ] Any new medication or supplement started recently: _________

---

### Headache-Free Day Log (Record 3-4 Times Per Week)

On days you do NOT have a headache, note which triggers were present anyway. This is how you distinguish "coffee triggers my headaches" from "I drink coffee every day and my headaches are unrelated to it."

| Date | Triggers Present (from checklist above) | Headache Occurred? |
|------|----------------------------------------|--------------------|
|      |                                        | No                 |
|      |                                        | No                 |

---

### Weekly Pattern Summary

Complete this every Sunday before the next week begins.

| Week | Total Headaches | Avg Intensity | Peak Intensity | Avg Duration | Episodes at Functional Impact 3-4 | Most Consistent Trigger | Most Effective Relief | Trend vs. Prior Week | Pattern Notes |
|------|----------------|---------------|----------------|--------------|-------------------------------------|------------------------|-----------------------|---------------------|---------------|
| 1 | | | | | | | | Baseline | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |

**At the end of each week, answer:**
- Did headaches cluster on certain days of the week?
- Did most episodes start at a similar time of day?
- Was there any week-level variable that differed from prior week (higher stress, unusual schedule, different food habits)?
- Did I try any relief method that clearly worked better than others?

---

### Provider Summary -- Bring to Appointment

**Symptom (descriptive):** Recurring headache -- [location and quality description, e.g., "pressure sensation, both sides of forehead"]
**Tracking period:** [Start date] to [End date] -- 3 weeks
**Total episodes recorded:** ___
**Average frequency:** ___ headaches per week
**Typical intensity:** ___/10 | Peak intensity recorded: ___/10
**Typical duration:** ___ (range: ___ to ___)
**Functional impact:** ___ episodes required stopping activity or resting

**Timing Pattern:**
- Most common time of onset: ___________
- Day-of-week clustering: ___________
- Relationship to sleep: ___________

**Most Consistent Triggers (present in 2 or more episodes):**
1. __________ (present in ___ of ___ episodes)
2. __________ (present in ___ of ___ episodes)
3. __________ (present in ___ of ___ episodes)

**Triggers Present on Headache-Free Days (ruled out or inconsistent):**
- __________

**Effective Relief:**
- [Method] -- reduced intensity by approximately ___ points / resolved in ___ minutes
- [Method] -- no consistent effect

**Associated Symptoms Present in Episodes:**
- Light sensitivity: ___ of ___ episodes
- Sound sensitivity: ___ of ___ episodes
- Nausea: ___ of ___ episodes

**Trend Over 3 Weeks:**
- Frequency: [Increasing / decreasing / stable]
- Intensity: [Increasing / decreasing / stable]
- Duration: [Increasing / decreasing / stable]

**Questions for My Provider Based on My Observations:**
1. I noticed most headaches started in the [time range] and were often preceded by [trigger] -- is that pattern significant?
2. [Relief method] consistently helped more than others -- does that tell you anything useful?
3. I had several headaches on days after less than 6 hours of sleep -- is sleep a common factor worth prioritizing?
4. The frequency has been [trend] over the 3 weeks -- is that something to pay attention to?
5. Are there additional variables you would like me to track before our next visit?

---

> **Reminder:** If at any point during your tracking period you experience a headache that feels significantly different from your usual pattern -- sudden severe onset, worst of your life, accompanied by fever, confusion, vision changes, or weakness -- do not document and wait. Contact your healthcare provider or emergency services immediately.
