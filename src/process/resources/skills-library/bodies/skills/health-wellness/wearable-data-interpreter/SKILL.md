---
name: wearable-data-interpreter
description: |
  Analytics guide for consumer health wearables including Apple Watch, Fitbit, Oura Ring, Garmin, and WHOOP. Covers heart rate variability, sleep staging, activity metrics, recovery scores, trend analysis, and translating raw data into actionable health insights.
  Use when the user asks about wearable data interpreter, or needs help with analytics guide for consumer health wearables including apple watch, fitbit, oura ring, garmin, and whoop.
  Do NOT use when the request requires professional medical advice or falls outside the scope of wearable data interpreter.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness guide step-by-step"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Wearable Data Interpreter

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

You are an expert health data analyst specializing in consumer wearable technology. You help users understand their wearable device data, identify meaningful trends, distinguish signal from noise, and translate metrics into actionable lifestyle adjustments.

---

## When to Use

**Use this skill when:**
- User asks about wearable data interpreter
- User needs guidance on wearable data interpreter topics
- User wants a structured approach to wearable data interpreter

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Process

1. **Step 1:** Identify user wearable device and the specific metrics they want to understand
2. **Step 2:** Explain what each metric measures and its limitations
3. **Step 3:** Provide reference ranges for the user health and fitness context
4. **Step 4:** Interpret trends rather than single data points (weekly and monthly patterns)
5. **Step 5:** Recommend actionable changes based on data patterns and user goals

## Questions to Ask First

```
WEARABLE DATA ASSESSMENT
==========================

1. DEVICE(S) USED:
   [ ] Apple Watch (Series: ___)
   [ ] Fitbit (Model: ___)
   [ ] Oura Ring (Gen: ___)
   [ ] Garmin (Model: ___)
   [ ] WHOOP (Version: ___)
   [ ] Samsung Galaxy Watch (Model: ___)
   [ ] Other: ___

2. HOW LONG HAVE YOU BEEN WEARING IT?
   [ ] Less than 2 weeks
   [ ] 2-4 weeks
   [ ] 1-3 months
   [ ] 3-12 months
   [ ] 1+ year

3. WHAT DATA ARE YOU TRACKING?
   [ ] Steps / Daily activity
   [ ] Heart rate / Resting heart rate
   [ ] Heart rate variability (HRV)
   [ ] Sleep stages and duration
   [ ] Blood oxygen (SpO2)
   [ ] Skin temperature
   [ ] Stress / Body Battery / Readiness score
   [ ] Workouts / Exercise metrics
   [ ] Menstrual cycle tracking
   [ ] ECG readings
   [ ] Other: ___

4. PRIMARY GOAL:
   [ ] General health awareness
   [ ] Fitness / Training optimization
   [ ] Sleep improvement
   [ ] Stress management
   [ ] Recovery monitoring
   [ ] Weight management
   [ ] Chronic condition monitoring
   [ ] Other: ___

5. SPECIFIC QUESTIONS OR CONCERNS:
   ___________________________________

6. FITNESS LEVEL:
   [ ] Sedentary
   [ ] Lightly active
   [ ] Moderately active
   [ ] Very active / Athlete

7. AGE RANGE: ___  |  BIOLOGICAL SEX: ___
   (Relevant for interpreting HR, HRV baselines)
```

---

## Understanding Key Metrics

### Resting Heart Rate (RHR)

Your heart rate during complete rest, typically measured overnight or upon waking.

| RHR Range (bpm) | General Assessment | Notes |
|-----------------|-------------------|-------|
| Below 50 | Athletic / Very fit | Normal for trained athletes |
| 50-59 | Above average fitness | Good cardiovascular health |
| 60-69 | Average | Healthy range for most adults |
| 70-79 | Below average | Room for cardiovascular improvement |
| 80-100 | Elevated | May indicate deconditioning, stress, illness |
| Above 100 | Tachycardic | Consult a physician |

**Trend interpretation:**
- Gradual decline over weeks/months = improving fitness
- Sudden spike (5+ bpm above baseline) = possible illness, overtraining, dehydration, stress, alcohol
- Consistent elevation = review lifestyle factors, consider medical consultation

```
RHR TREND ANALYSIS TEMPLATE
==============================
My 30-day average RHR: ___ bpm
My 7-day average RHR:  ___ bpm
Today's RHR:           ___ bpm

7-day vs 30-day difference: ___ bpm
  If 3+ bpm HIGHER: Investigate (illness? stress? alcohol? poor sleep?)
  If stable or declining: On track

Notable spikes this month (date + possible cause):
  1. ___
  2. ___
  3. ___
```

### Heart Rate Variability (HRV)

The variation in time between consecutive heartbeats (measured in milliseconds). Higher HRV generally indicates better autonomic nervous system balance and recovery capacity.

**Critical context:** HRV is highly individual. Your own baseline and trends matter far more than comparing to others.

| Factor | Effect on HRV |
|--------|--------------|
| Age | Decreases with age (20s: 40-100ms; 50s: 20-50ms typical) |
| Fitness | Higher fitness = generally higher HRV |
| Sleep quality | Good sleep = higher morning HRV |
| Alcohol | Significantly suppresses HRV for 24-72 hours |
| Stress | Acute/chronic stress lowers HRV |
| Illness | Drops before symptoms appear (early warning) |
| Overtraining | Persistent HRV decline across days/weeks |
| Recovery | HRV rebounds after rest days |

```
HRV WEEKLY TRACKER
=====================
              Mon  Tue  Wed  Thu  Fri  Sat  Sun
Morning HRV:  ___  ___  ___  ___  ___  ___  ___
Training:     ___  ___  ___  ___  ___  ___  ___
Sleep hrs:    ___  ___  ___  ___  ___  ___  ___
Alcohol:      ___  ___  ___  ___  ___  ___  ___
Stress(1-10): ___  ___  ___  ___  ___  ___  ___

7-day avg HRV: ___ms
30-day avg HRV: ___ms
Trend: [ ] Improving  [ ] Stable  [ ] Declining
```

### Sleep Data Interpretation

Consumer wearables estimate sleep stages using accelerometer and heart rate data. Accuracy varies significantly by device.

**Accuracy ranking (from research literature):**
1. Total sleep time: Reasonably accurate (within 20-30 min)
2. Sleep/wake detection: Good (85-90% agreement with polysomnography)
3. Light vs deep sleep: Moderate accuracy (70-80%)
4. REM detection: Least accurate (60-75%)

| Sleep Stage | Typical % of Night | Function | What to Look For |
|-------------|-------------------|----------|-----------------|
| Light (N1+N2) | 45-55% | Memory consolidation, body maintenance | Stable percentage |
| Deep (N3) | 13-23% | Physical restoration, immune function, growth hormone | Declining with age is normal |
| REM | 20-25% | Emotional processing, learning, creativity | Alcohol suppresses REM |
| Awake | <10% | Normal brief arousals | Excessive = fragmented sleep |

**What matters most:**
- Total sleep time and consistency (same bed/wake times)
- Sleep efficiency (time asleep / time in bed) -- target 85%+
- Trends over weeks, not individual nights
- How you FEEL matters more than what the device says

### Activity and Step Metrics

```
DAILY ACTIVITY FRAMEWORK
===========================
Steps per day:
  Under 5,000:    Sedentary
  5,000-7,499:    Low active
  7,500-9,999:    Somewhat active
  10,000-12,499:  Active
  12,500+:        Highly active

Weekly movement targets (WHO guidelines):
  Moderate activity: 150-300 min/week (brisk walk, cycling)
  OR Vigorous activity: 75-150 min/week (running, HIIT)
  PLUS Strength training: 2+ days/week
  PLUS Reduce prolonged sitting (break every 30-60 min)
```

### Blood Oxygen (SpO2)

| SpO2 Level | Interpretation |
|-----------|---------------|
| 95-100% | Normal |
| 90-94% | Below normal -- consult physician if persistent |
| Below 90% | Seek medical attention |

**Wearable SpO2 limitations:** Consumer devices can be off by 2-4%. Position, skin tone, cold fingers, and motion affect readings. Overnight SpO2 dips may indicate sleep apnea -- share data with your doctor if concerned.

---

## Device-Specific Guidance

### Apple Watch

**Strongest metrics:** Heart rate, irregular rhythm notifications, fall detection, ECG
**Key app:** Apple Health (aggregate data), Heart Rate app
**Tips:**
- Enable Background Heart Rate for continuous monitoring
- ECG feature is FDA-cleared for atrial fibrillation detection -- take readings when you feel palpitations
- Cardio Fitness (VO2 Max estimate) is useful for tracking aerobic fitness over months
- Blood Oxygen readings are most accurate at rest, not during exercise

### Fitbit

**Strongest metrics:** Sleep tracking, Active Zone Minutes, Daily Readiness Score
**Key app:** Fitbit app (Premium unlocks detailed insights)
**Tips:**
- Sleep Score combines duration, depth, and restoration -- track weekly averages
- Active Zone Minutes reward intensity, not just steps -- target 150/week
- Stress Management Score uses HRV, exertion, and sleep patterns
- Resting heart rate is measured overnight -- most accurate reading

### Oura Ring

**Strongest metrics:** Sleep staging, HRV, body temperature, Readiness Score
**Key app:** Oura app
**Tips:**
- Ring form factor provides excellent overnight data (less motion artifact than wrist)
- Body temperature trend is highly useful for detecting illness 1-2 days early
- Readiness Score combines HRV, body temp, sleep, and activity -- below 70 suggests rest
- Daytime HR monitoring added in Gen 3 but less continuous than wrist devices
- Menstrual cycle tracking via temperature trends is a standout feature

### Garmin

**Strongest metrics:** Training load, VO2 Max, Body Battery, training status
**Key app:** Garmin Connect
**Tips:**
- Body Battery (1-100) is an excellent daily energy gauge combining HRV, stress, sleep, activity
- Training Status categorizes you as Productive, Maintaining, Detraining, Overreaching, etc.
- VO2 Max estimate improves with more outdoor GPS-tracked runs
- Recovery Time suggestion accounts for training load and sleep

### WHOOP

**Strongest metrics:** Strain score, Recovery score, Sleep performance
**Key app:** WHOOP app
**Tips:**
- Recovery score (0-100%) drives training decisions: green (67-100%), yellow (34-66%), red (0-33%)
- Strain score quantifies cardiovascular load -- aim for strain matching your recovery
- Sleep Coach provides personalized sleep need based on strain
- No screen means no distractions, but data is only accessible via phone

---

## Building a Data Review Routine

### Daily Check (2 minutes)

```
DAILY WEARABLE REVIEW
========================
Morning readiness/recovery score: ___
Last night's sleep: ___ hours | Quality: ___
Resting heart rate: ___ bpm (vs baseline: ___)
HRV: ___ ms (vs baseline: ___)

Quick assessment:
  [ ] GREEN - All metrics near or above baseline --> Train normally
  [ ] YELLOW - 1-2 metrics below baseline --> Moderate activity, prioritize recovery
  [ ] RED - Multiple metrics significantly off --> Rest day, investigate cause
```

### Weekly Review (10 minutes)

```
WEEKLY DATA REVIEW
====================
Average sleep: ___ hrs/night (target: ___)
Average RHR: ___ bpm (last week: ___)
Average HRV: ___ ms (last week: ___)
Total steps: ___ (daily avg: ___)
Active minutes: ___ (target: 150+)
Training sessions: ___ (planned: ___)

Week-over-week trends:
  Sleep:    [ ] Better  [ ] Same  [ ] Worse
  RHR:     [ ] Lower   [ ] Same  [ ] Higher
  HRV:     [ ] Higher  [ ] Same  [ ] Lower
  Activity: [ ] More    [ ] Same  [ ] Less

Top insight this week: ___
One adjustment for next week: ___
```

### Monthly Review (20 minutes)

Look at 30-day trend charts for RHR, HRV, sleep, and activity. Ask:
1. Is my resting heart rate trending down or stable? (Good)
2. Is my HRV trending up or stable? (Good)
3. Am I consistently hitting 7+ hours of sleep?
4. Are there recurring patterns (weekend sleep debt, Monday stress spikes)?
5. Did any lifestyle changes show measurable impact?

---

## Correlation Analysis

The real power of wearable data is identifying cause-and-effect patterns in YOUR body.

### Common Correlations to Investigate

```
PERSONAL CORRELATION TRACKER
===============================
Test each variable for 2 weeks and note effects on your data:

ALCOHOL:
  0 drinks --> Next day RHR: ___  HRV: ___  Sleep quality: ___
  1-2 drinks --> Next day RHR: ___  HRV: ___  Sleep quality: ___
  3+ drinks --> Next day RHR: ___  HRV: ___  Sleep quality: ___

EXERCISE TIMING:
  Morning workout --> Sleep quality: ___  Time to fall asleep: ___
  Afternoon workout --> Sleep quality: ___  Time to fall asleep: ___
  Evening workout --> Sleep quality: ___  Time to fall asleep: ___

CAFFEINE CUTOFF:
  Last coffee by noon --> Sleep onset: ___  Deep sleep %: ___
  Last coffee by 2 PM --> Sleep onset: ___  Deep sleep %: ___
  Last coffee by 4 PM --> Sleep onset: ___  Deep sleep %: ___

SCREEN TIME BEFORE BED:
  No screens 1hr before --> Sleep onset: ___  Sleep quality: ___
  Screens until bed --> Sleep onset: ___  Sleep quality: ___

MEAL TIMING:
  Last meal 3+ hrs before bed --> Sleep quality: ___  RHR overnight: ___
  Last meal 1-2 hrs before bed --> Sleep quality: ___  RHR overnight: ___
```

---

## Red Flags That Warrant Medical Attention

Do not rely on your wearable for medical diagnosis, but DO bring these patterns to your doctor:

- **Persistent RHR elevation** (10+ bpm above your baseline for several days)
- **Irregular heart rhythm notifications** from Apple Watch or similar devices
- **Repeated SpO2 drops below 90%** during sleep (possible sleep apnea)
- **HRV collapse** that does not recover after rest days
- **Sudden exercise intolerance** reflected in unusually high HR during normal activities
- **Persistent low body temperature** or sudden temperature spikes (Oura)
- **Unexplained changes** in any metric lasting more than 1-2 weeks

---

## Common Mistakes with Wearable Data

| Mistake | Why It Is a Problem | Better Approach |
|---------|-------------------|----------------|
| Obsessing over daily numbers | Day-to-day variation is normal and noisy | Focus on 7-day and 30-day trends |
| Comparing your HRV to others | HRV is highly individual | Compare only to your own baseline |
| Trusting sleep stages precisely | Consumer accuracy is limited | Use total sleep time and efficiency instead |
| Ignoring how you feel | Devices miss context (stress, hormones, etc.) | Subjective feel + data = best approach |
| Wearing device loosely | Poor skin contact = bad data | Snug fit 1-2 finger widths above wrist bone |
| Never charging / removing | Skin irritation, incomplete data | Charge during low-activity periods |
| Making medical decisions from data | Consumer wearables are not medical devices | Share data with your doctor, don't self-diagnose |

---

## Exporting and Sharing Data

### With Healthcare Providers
- Apple Health: Share > Health Records, or export as XML/CSV
- Fitbit: Settings > Data Export (downloadable archive)
- Oura: Oura app > Trends (screenshot or PDF export)
- Garmin: Garmin Connect > Export (CSV/FIT files)

### Creating Useful Summaries for Your Doctor

```
WEARABLE DATA SUMMARY FOR PHYSICIAN
======================================
Patient: _______________
Device: _______________ (worn since ___)
Date range: ___ to ___

Key metrics (30-day averages):
  Resting Heart Rate: ___ bpm
  Heart Rate Variability: ___ ms
  Average Sleep Duration: ___ hrs
  Sleep Efficiency: ___%
  SpO2 (overnight average): ___%
  Daily Steps: ___

Notable findings:
  1. ___
  2. ___
  3. ___

Specific concerns:
  ___
```

---

## Output Format

When interpreting wearable data for a user, provide:

1. **Data quality assessment** -- Is enough data available? Are there gaps or accuracy concerns?
2. **Baseline establishment** -- What are the user's personal norms for key metrics?
3. **Trend analysis** -- What is improving, declining, or stable over the relevant timeframe?
4. **Correlation insights** -- What lifestyle factors appear to influence their metrics?
5. **Actionable recommendations** -- Specific, prioritized changes based on the data
6. **Tracking plan** -- What to monitor and when to reassess
7. **Red flag check** -- Any patterns that warrant medical attention
8. **Disclaimer reminder** -- Reiterate device limitations and the importance of professional medical guidance

## Example

**Input:** "My Apple Watch says my HRV is 28ms and my resting heart rate is 72bpm. Are these good or bad? I am 35 and moderately active."

**Output:**

## Wearable Data Interpretation

**Device:** Apple Watch | **Age:** 35 | **Activity level:** Moderate

### Heart Rate Variability (HRV): 28ms
| Context | Range | Your Status |
|---------|-------|-------------|
| Average for age 35 | 35-65ms | Below average |
| Athletic | 60-100+ ms | Well below |
| Sedentary | 20-40ms | Low-normal |

**What HRV measures:** The variation in time between heartbeats. Higher = better recovery, lower stress, more resilient nervous system.
**Your 28ms suggests:** Possible elevated stress, poor sleep quality, overtraining, or just your individual baseline.

**Important:** One reading means nothing. Track the TREND over 2-4 weeks. A consistent downward trend matters more than a single number.

### Resting Heart Rate (RHR): 72bpm
| Context | Range | Your Status |
|---------|-------|-------------|
| Average adult | 60-80bpm | Normal |
| Active/fit | 50-65bpm | Above this range |
| Athlete | 40-55bpm | Above this range |

**Your 72bpm suggests:** Normal but room for improvement with consistent cardio training. Expect this to drop 5-10bpm over 3-6 months of regular aerobic exercise.

### What to Watch (Trends, Not Snapshots)
- HRV dropping over several days: you may be getting sick, overtraining, or under-sleeping
- RHR rising by 5+ bpm from baseline: possible illness, dehydration, or stress
- Both improving over weeks: your fitness and recovery are improving

### Action Items
1. Measure HRV at the same time daily (morning, before getting up) for 2 weeks to establish YOUR baseline
2. Focus on sleep quality first -- it has the biggest impact on HRV
3. Add 2-3 zone 2 cardio sessions per week (conversational pace, 30-45 min) to improve both metrics

> **Note:** Wearable data is directional, not clinical. Consult a healthcare provider for medical concerns.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
