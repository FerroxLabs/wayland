---
name: running-coach
description: |
  Running training plan generator covering beginner to marathon programs, Couch-to-5K structure, training zones, weekly mileage planning, race day preparation, pacing strategies, injury prevention, nutrition for runners, and gear recommendations.
  Use when the user asks about running coach, or needs help with running training plan generator covering beginner to marathon programs, couch-to-5k structure, training zones, weekly mileage planning, race day preparation, pacing strategies, injury prevention, nutrition for runners, and gear recommendations.
  Do NOT use when the request requires professional medical advice or falls outside the scope of running coach.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness fitness workout-planning step-by-step"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Running Coach

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- User asks about running coach
- User needs guidance on running coach topics
- User wants a structured approach to running coach

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What is your current running experience?** (Non-runner / Casual jogger / Regular runner / Competitive runner)
2. **What is your goal?** (Start running / Complete a 5K / Improve 10K time / Half marathon / Full marathon / Ultra)
3. **What is your current weekly mileage?** (0 / 1-10 / 10-20 / 20-30 / 30-50 / 50+)
4. **How many days per week can you run?** (3 / 4 / 5 / 6)
5. **When is your target race date?** (If applicable)
6. **What is your current best time for your target distance?** (If applicable)
7. **Do you have any injuries or physical limitations?**
8. **What terrain do you primarily run on?** (Road / Trail / Track / Treadmill / Mixed)
9. **What is your age and general fitness level?**

---

## Training Zones

### Heart Rate Zone System

| Zone | Name | % Max HR | Perceived Effort | Purpose |
|------|------|----------|-------------------|---------|
| 1 | Recovery | 50-60% | Very easy, conversational | Active recovery |
| 2 | Easy/Aerobic | 60-70% | Easy, can hold full conversation | Base building, fat oxidation |
| 3 | Tempo | 70-80% | Comfortably hard, short sentences | Lactate threshold improvement |
| 4 | Threshold | 80-90% | Hard, few words at a time | VO2max improvement |
| 5 | Interval/Max | 90-100% | All-out, cannot speak | Speed and power |

### Estimating Max Heart Rate

```
Formula 1 (Traditional): 220 - Age = Estimated Max HR
Formula 2 (Tanaka): 208 - (0.7 x Age) = Estimated Max HR

Example (Age 35):
Traditional: 220 - 35 = 185 bpm
Tanaka: 208 - (0.7 x 35) = 183.5 bpm

Zone Calculation (using 185 max HR):
Zone 1: 93-111 bpm
Zone 2: 111-130 bpm
Zone 3: 130-148 bpm
Zone 4: 148-167 bpm
Zone 5: 167-185 bpm
```

---

## Program: Couch to 5K (8 Weeks)

### Prerequisites
- Medical clearance
- Proper running shoes
- Ability to walk briskly for 30 minutes

### Schedule (3 days/week)

```
WEEK 1
Run 1 min / Walk 2 min x 8 rounds (24 min total)

WEEK 2
Run 2 min / Walk 2 min x 6 rounds (24 min total)

WEEK 3
Run 3 min / Walk 2 min x 5 rounds (25 min total)

WEEK 4
Run 4 min / Walk 1.5 min x 5 rounds (27.5 min total)

WEEK 5
Run 5 min / Walk 1 min x 5 rounds (30 min total)

WEEK 6
Run 8 min / Walk 1 min x 3 rounds (27 min total)

WEEK 7
Run 12 min / Walk 1 min x 2 rounds (26 min total)
+ Run 5 min continuous

WEEK 8
Run 30 min continuous (approx. 5K at easy pace)
```

---

## Program: 5K Improvement (8 Weeks)

### Prerequisites
- Can run 5K continuously
- Running 10-15 miles/week comfortably

```
WEEK 1-2 (Base Building)
Mon: Rest
Tue: Easy Run 3 mi (Zone 2)
Wed: Cross-train or rest
Thu: Tempo Run - 1 mi warm-up, 1.5 mi @ Zone 3, 1 mi cool-down
Fri: Rest
Sat: Easy Run 3 mi (Zone 2)
Sun: Long Run 4-5 mi (Zone 1-2)
Weekly: 11-13 mi

WEEK 3-4 (Speed Introduction)
Mon: Rest
Tue: Easy Run 3 mi (Zone 2)
Wed: Intervals - 1 mi warm-up, 6x400m @ Zone 4 (90 sec rest), 1 mi cool-down
Thu: Easy Run 3 mi (Zone 2)
Fri: Rest
Sat: Tempo Run - 1 mi warm-up, 2 mi @ Zone 3, 1 mi cool-down
Sun: Long Run 5-6 mi (Zone 1-2)
Weekly: 14-17 mi

WEEK 5-6 (Peak Training)
Mon: Rest
Tue: Easy Run 4 mi (Zone 2)
Wed: Intervals - 1 mi warm-up, 5x800m @ Zone 4 (2 min rest), 1 mi cool-down
Thu: Easy Run 3 mi (Zone 2)
Fri: Rest
Sat: Tempo Run - 1 mi warm-up, 2.5 mi @ Zone 3, 1 mi cool-down
Sun: Long Run 6-7 mi (Zone 1-2)
Weekly: 17-20 mi

WEEK 7 (Taper)
Reduce volume by 30%, maintain intensity

WEEK 8 (Race Week)
Reduce volume by 50%, 2 short easy runs, race on weekend
```

---

## Program: 10K Training (10 Weeks)

### Prerequisites
- Can run 5K comfortably
- Running 12-18 miles/week

### Weekly Template

```
DAY 1: Easy Run (Zone 2) - 4-5 mi
DAY 2: Speed Work - Intervals or Tempo
DAY 3: Rest or Cross-Train
DAY 4: Easy Run (Zone 2) - 3-4 mi
DAY 5: Tempo Run (Zone 3) - 4-5 mi with warm-up/cool-down
DAY 6: Rest
DAY 7: Long Run (Zone 1-2) - 6-10 mi (progressive increase)

Mileage Progression:
Week 1: 18 mi | Week 2: 20 mi | Week 3: 22 mi | Week 4: 18 mi (recovery)
Week 5: 23 mi | Week 6: 25 mi | Week 7: 27 mi | Week 8: 22 mi (recovery)
Week 9: 20 mi (taper) | Week 10: 15 mi (race week)
```

---

## Program: Half Marathon (12 Weeks)

### Prerequisites
- Can run 10K comfortably
- Running 20-25 miles/week base

### Mileage Progression

```
Week  | Easy | Speed | Tempo | Long | Total
------|------|-------|-------|------|------
  1   |  8   |  4    |  4    |  8   |  24
  2   |  9   |  4    |  5    |  9   |  27
  3   |  10  |  5    |  5    |  10  |  30
  4   |  7   |  3    |  4    |  7   |  21  (Recovery)
  5   |  10  |  5    |  5    |  11  |  31
  6   |  11  |  5    |  6    |  12  |  34
  7   |  12  |  5    |  6    |  13  |  36
  8   |  8   |  4    |  4    |  8   |  24  (Recovery)
  9   |  12  |  5    |  6    |  14  |  37
  10  |  11  |  5    |  5    |  12  |  33
  11  |  8   |  4    |  4    |  8   |  24  (Taper)
  12  |  5   |  0    |  3    | 13.1 |  21  (Race Week)
```

---

## Program: Marathon (16-18 Weeks)

### Prerequisites
- Have completed a half marathon or run 13+ miles
- Running 25-35 miles/week base
- At least 1 year of consistent running

### Key Principles

1. **Long run increases:** No more than 10% per week
2. **Peak long run:** 20-22 miles, 3-4 weeks before race
3. **Recovery weeks:** Every 3rd or 4th week, reduce by 20-30%
4. **Taper:** 3-week taper, reducing mileage by 20%, 30%, then 50%
5. **80/20 rule:** 80% of miles at easy pace, 20% at moderate-to-hard

### Weekly Template (Peak Week Example - Week 12)

```
Mon: Rest
Tue: Easy Run 6 mi (Zone 2)
Wed: Speed Work - 2 mi warm-up, 6x1000m @ Zone 4 (2 min jog rest), 2 mi cool-down
Thu: Easy Run 5 mi (Zone 2)
Fri: Rest or Easy 3 mi
Sat: Marathon Pace Run - 2 mi warm-up, 8 mi @ Goal Marathon Pace, 2 mi cool-down
Sun: Long Run 20 mi (Zone 1-2, last 4 mi at marathon pace)
Weekly: ~48-50 mi
```

---

## Pacing Strategies

### Race Pace Calculator (Based on Recent Race Time)

```
If your 5K time is: [TIME]
Estimated 10K: 5K time x 2.09
Estimated Half Marathon: 5K time x 4.65
Estimated Marathon: 5K time x 9.8

Example (5K in 25:00):
10K: ~52:15
Half Marathon: ~1:56:15
Marathon: ~4:05:00
```

### Pacing Strategy by Race

| Race | Strategy | Details |
|------|----------|---------|
| 5K | Even or slight negative split | Start controlled, push last mile |
| 10K | Even splits | Consistent pace throughout |
| Half Marathon | Slight negative split | First half 10-15 sec/mi slower than goal |
| Marathon | Conservative start | First 10K at goal+15 sec/mi, settle into pace, push last 10K |

### Treadmill Pace Conversion

| Pace (min/mi) | Speed (mph) | Pace (min/km) |
|----------------|-------------|----------------|
| 12:00 | 5.0 | 7:27 |
| 10:00 | 6.0 | 6:13 |
| 9:00 | 6.7 | 5:35 |
| 8:00 | 7.5 | 4:58 |
| 7:30 | 8.0 | 4:39 |
| 7:00 | 8.6 | 4:21 |
| 6:30 | 9.2 | 4:02 |
| 6:00 | 10.0 | 3:43 |

---

## Injury Prevention

### Common Running Injuries

| Injury | Symptoms | Common Cause | Prevention |
|--------|----------|-------------|------------|
| Runner's Knee | Pain around kneecap | Overuse, weak quads/glutes | Strengthen quads, reduce mileage increases |
| Shin Splints | Pain along shin bone | Too much too soon, hard surfaces | Gradual mileage increase, proper shoes |
| IT Band Syndrome | Pain outside of knee | Weak hips, tight IT band | Hip strengthening, foam rolling |
| Plantar Fasciitis | Heel/arch pain (worse AM) | Tight calves, unsupportive shoes | Calf stretches, arch support, rolling |
| Achilles Tendinitis | Pain above heel | Tight calves, sudden mileage increase | Eccentric heel drops, gradual progression |
| Stress Fracture | Localized bone pain | Overtraining, low bone density | Rest days, calcium/vitamin D, gradual increase |

### Pre-Run Dynamic Warm-Up (5-7 minutes)

```
1. Walking lunges: 10 each leg
2. Leg swings (front/back): 10 each leg
3. Leg swings (side to side): 10 each leg
4. High knees: 20 total
5. Butt kicks: 20 total
6. A-skips: 10 each leg
7. Carioca/grapevine: 20 yards each direction
8. Strides: 4x80m at 80% effort
```

### Post-Run Static Stretches (Hold 30 seconds each)

```
1. Standing quad stretch
2. Standing calf stretch (straight leg and bent leg)
3. Seated hamstring stretch
4. Pigeon pose (hip/glute)
5. Standing IT band stretch
6. Hip flexor stretch (kneeling)
```

### Foam Rolling Protocol (10 minutes)

```
Roll each area 30-60 seconds, pausing on tender spots:
1. Calves
2. Hamstrings
3. Quads
4. IT band
5. Glutes
6. Upper back
```

---

## Nutrition for Runners

### Daily Nutrition Guidelines

```
Carbohydrates: 3-5 g/kg (easy training) to 7-10 g/kg (heavy training)
Protein: 1.4-1.8 g/kg body weight
Fat: 0.8-1.2 g/kg body weight
Hydration: Half your body weight in ounces daily + 16-24 oz per hour of running
```

### Pre-Run Fueling

| Timing | What to Eat | Examples |
|--------|-------------|---------|
| 3-4 hours before | Full meal, moderate carbs | Oatmeal with banana, toast with PB |
| 1-2 hours before | Light snack, easy to digest | Banana, energy bar, toast with honey |
| 30 min before | Simple carbs if needed | Sports drink, gel, few crackers |

### During-Run Fueling (Runs > 60 minutes)

```
- Begin fueling at 45-60 minutes
- 30-60g carbs per hour
- Options: energy gels, chews, sports drink, dates
- Sip water every 15-20 minutes
- Practice race nutrition during training (nothing new on race day)
```

### Post-Run Recovery

```
Within 30-60 minutes:
- 0.3g protein/kg + 1g carb/kg
- Examples: chocolate milk, protein smoothie, turkey sandwich
- Rehydrate: 16-24 oz fluid per pound lost during run
```

---

## Race Day Preparation

### Race Week Checklist

```
7 Days Out:
[ ] Confirm race logistics (start time, location, parking)
[ ] Plan outfit (nothing new on race day)
[ ] Reduce training volume
[ ] Focus on sleep

2-3 Days Out:
[ ] Increase carb intake slightly (marathon/half only)
[ ] Reduce fiber and fat
[ ] Pick up race bib/packet
[ ] Prepare gear bag
[ ] Charge GPS watch

Night Before:
[ ] Lay out all race gear
[ ] Pin bib to shirt
[ ] Set multiple alarms
[ ] Eat familiar dinner (carb-focused)
[ ] Get to bed early (don't stress about sleep)

Race Morning:
[ ] Wake 2-3 hours before start
[ ] Eat practiced pre-race meal
[ ] Arrive 60-90 minutes early
[ ] Warm up 15-20 minutes before start
[ ] Use bathroom before corrals open
[ ] Start watch at start line
```

### Race Day Gear Checklist

```
[ ] Race bib and safety pins
[ ] GPS watch (charged)
[ ] Running shoes (broken in)
[ ] Race outfit (tested in training)
[ ] Socks (anti-blister)
[ ] Body Glide/anti-chafe
[ ] Sunscreen
[ ] Hat or visor (if sunny)
[ ] Sunglasses
[ ] Energy gels/nutrition
[ ] Water bottle (if not using aid stations)
[ ] Post-race warm clothes
```

---

## Gear Recommendations

### Running Shoes

```
Selection Criteria:
- Get fitted at a specialty running store
- Consider gait analysis (neutral, stability, motion control)
- Replace every 300-500 miles
- Rotate 2+ pairs for different workouts

Types:
- Daily trainer: Cushioned, versatile (most mileage here)
- Speed/racing: Lightweight, less cushion, carbon plate options
- Trail: Lugged sole, toe protection, water resistant
```

### Essential Gear by Season

| Season | Key Gear |
|--------|----------|
| Spring | Light layers, rain jacket, cap |
| Summer | Moisture-wicking shorts/singlet, sunscreen, hydration vest |
| Fall | Arm sleeves, light vest, gloves |
| Winter | Thermal base layer, windproof jacket, beanie, gloves, reflective gear |

### Temperature Dressing Guide

```
60-70F (15-21C): Shorts and singlet
50-60F (10-15C): Shorts and long sleeve or light layers
40-50F (4-10C): Tights or shorts with long sleeve, light gloves
30-40F (-1-4C): Tights, long sleeve, vest or jacket, gloves, headband
20-30F (-7--1C): Tights, thermal top, jacket, gloves, beanie
Below 20F (-7C): Double layer tights, thermal base + mid + wind layer, heavy gloves, face cover
```

---

## Output Format

When generating a running plan, present it as:

```
RUNNING PLAN: [Goal Race/Distance]
Duration: [X] weeks
Frequency: [X] runs/week
Current Fitness: [Description]
Target Pace: [X:XX/mile or X:XX/km]

WEEK [N]
Day | Workout | Distance | Zone/Pace | Notes
----|---------|----------|-----------|------
    |         |          |           |

Weekly Mileage: [X] miles
Key Workout Focus: [Description]

NUTRITION REMINDERS:
- [Pre-run fuel]
- [During-run fuel if applicable]
- [Recovery fuel]
```

## Example

**Input:** "Help me get started with running coach"

**Output:** A structured running coach plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
