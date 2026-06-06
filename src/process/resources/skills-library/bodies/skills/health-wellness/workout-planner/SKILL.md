---
name: workout-planner
description: |
  Comprehensive workout plan generator with assessment, program design by goal, split programming, progressive overload tracking, deload scheduling, warm-up/cool-down protocols, and an exercise database organized by muscle group.
  Use when the user asks about workout planner, or needs help with comprehensive workout plan generator with assessment, program design by goal, split programming, progressive overload tracking, deload scheduling, warm-up/cool-down protocols, and an exercise database organized by muscle group.
  Do NOT use when the request requires professional medical advice or falls outside the scope of workout planner.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness fitness workout-planning"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Workout Planner

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- User asks about workout planner
- User needs guidance on workout planner topics
- User wants a structured approach to workout planner

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

Before generating any workout plan, gather the following information:

1. **What is your primary fitness goal?** (Hypertrophy / Strength / Endurance / General Fitness / Fat Loss / Athletic Performance)
2. **What is your training experience level?** (Complete Beginner / Beginner / Intermediate / Advanced)
3. **How many days per week can you train?** (2 / 3 / 4 / 5 / 6)
4. **How long can each session last?** (30 min / 45 min / 60 min / 75 min / 90 min)
5. **What equipment do you have access to?** (Full Gym / Home Gym / Dumbbells Only / Bodyweight Only / Resistance Bands)
6. **Do you have any injuries or movement limitations?**
7. **What is your age and approximate fitness level?**
8. **Do you have any exercises you strongly prefer or want to avoid?**

---

## Phase 1: Fitness Assessment

### Training History Classification

| Level | Criteria |
|-------|----------|
| Complete Beginner | Never trained consistently; no gym experience |
| Beginner | 0-6 months consistent training; learning movement patterns |
| Intermediate | 6-24 months consistent training; comfortable with compound lifts |
| Advanced | 2+ years consistent training; plateau management needed |

### Baseline Strength Standards (Approximate 1RM relative to bodyweight)

| Lift | Beginner (M/F) | Intermediate (M/F) | Advanced (M/F) |
|------|-----------------|---------------------|-----------------|
| Squat | 0.75x / 0.5x | 1.25x / 0.85x | 1.75x / 1.25x |
| Bench Press | 0.5x / 0.35x | 1.0x / 0.6x | 1.5x / 0.9x |
| Deadlift | 1.0x / 0.65x | 1.5x / 1.0x | 2.0x / 1.5x |
| Overhead Press | 0.35x / 0.25x | 0.65x / 0.45x | 1.0x / 0.65x |

### Body Composition Assessment

```
Current Weight: _____ lbs / kg
Estimated Body Fat %: _____
Goal Weight (if applicable): _____ lbs / kg
Waist Circumference: _____ inches / cm
```

---

## Phase 2: Program Design by Goal

### Goal: Hypertrophy (Muscle Growth)

**Parameters:**
- Rep range: 8-12 reps primary, 6-8 and 12-15 secondary
- Sets per muscle group per week: 10-20
- Rest periods: 60-90 seconds
- Tempo: 2-0-2-1 (eccentric-pause-concentric-pause)
- Training frequency per muscle: 2x per week minimum
- Progressive overload: Add weight when hitting top of rep range for all sets

**Template - 4-Day Upper/Lower Hypertrophy Split:**

```
DAY 1 - UPPER BODY A (Horizontal Focus)
1. Barbell Bench Press: 4x8-10
2. Barbell Row: 4x8-10
3. Incline Dumbbell Press: 3x10-12
4. Cable Row: 3x10-12
5. Lateral Raises: 3x12-15
6. Face Pulls: 3x15-20
7. Barbell Curl: 3x10-12
8. Tricep Pushdown: 3x10-12

DAY 2 - LOWER BODY A (Quad Focus)
1. Barbell Back Squat: 4x6-8
2. Romanian Deadlift: 3x8-10
3. Leg Press: 3x10-12
4. Walking Lunges: 3x12 each
5. Leg Extension: 3x12-15
6. Seated Calf Raise: 4x12-15
7. Hanging Leg Raise: 3x12-15

DAY 3 - UPPER BODY B (Vertical Focus)
1. Overhead Press: 4x8-10
2. Weighted Pull-ups: 4x6-8
3. Dumbbell Shoulder Press: 3x10-12
4. Lat Pulldown: 3x10-12
5. Cable Fly: 3x12-15
6. Rear Delt Fly: 3x15-20
7. Hammer Curl: 3x10-12
8. Overhead Tricep Extension: 3x10-12

DAY 4 - LOWER BODY B (Posterior Chain Focus)
1. Conventional Deadlift: 4x5-6
2. Front Squat: 3x8-10
3. Bulgarian Split Squat: 3x10-12 each
4. Leg Curl: 3x10-12
5. Hip Thrust: 3x10-12
6. Standing Calf Raise: 4x10-12
7. Ab Wheel Rollout: 3x10-12
```

### Goal: Strength

**Parameters:**
- Rep range: 1-5 reps primary, 5-8 accessory
- Sets per exercise: 3-5
- Rest periods: 3-5 minutes for main lifts
- Intensity: 80-95% 1RM on main lifts
- Frequency: Each main lift 2x per week

**Template - 4-Day Strength Program (5/3/1 Inspired):**

```
WEEK 1 (5s Week)
Main Lift: 3x5 @ 65%, 75%, 85%

WEEK 2 (3s Week)
Main Lift: 3x3 @ 70%, 80%, 90%

WEEK 3 (1s Week)
Main Lift: 3x5/3/1 @ 75%, 85%, 95%

WEEK 4 (Deload)
Main Lift: 3x5 @ 40%, 50%, 60%
```

### Goal: Endurance

**Parameters:**
- Rep range: 15-25 reps
- Sets: 2-4
- Rest periods: 30-45 seconds
- Circuit-based training encouraged
- Incorporate supersets and tri-sets
- Moderate weight: 40-60% 1RM

### Goal: General Fitness

**Parameters:**
- Rep range: 8-15 mixed
- Sets: 3-4
- Rest periods: 60-90 seconds
- Blend of compound and isolation
- Include cardiovascular conditioning
- 3-4 days per week

---

## Phase 3: Split Programming

### Full Body (2-3 days/week) - Best for Beginners

```
Template:
1. Squat variation: 3x8-10
2. Horizontal push: 3x8-10
3. Horizontal pull: 3x8-10
4. Hip hinge: 3x8-10
5. Vertical push: 2x10-12
6. Vertical pull: 2x10-12
7. Core: 2x12-15
```

### Upper/Lower (4 days/week) - Best for Intermediates

```
Mon: Upper A | Tue: Lower A | Thu: Upper B | Fri: Lower B
```

### Push/Pull/Legs (6 days/week) - Best for Advanced

```
Mon: Push | Tue: Pull | Wed: Legs | Thu: Push | Fri: Pull | Sat: Legs
```

### Push/Pull/Legs Template (Detailed)

```
PUSH DAY
1. Barbell Bench Press: 4x6-8
2. Overhead Press: 3x8-10
3. Incline Dumbbell Press: 3x10-12
4. Cable Lateral Raise: 3x12-15
5. Tricep Dips: 3x8-12
6. Overhead Tricep Extension: 3x12-15

PULL DAY
1. Barbell Row: 4x6-8
2. Weighted Pull-up: 3x6-8
3. Cable Row: 3x10-12
4. Face Pull: 3x15-20
5. Barbell Curl: 3x8-10
6. Hammer Curl: 3x10-12

LEG DAY
1. Barbell Squat: 4x6-8
2. Romanian Deadlift: 3x8-10
3. Leg Press: 3x10-12
4. Walking Lunge: 3x12 each
5. Leg Curl: 3x10-12
6. Calf Raise: 4x12-15
7. Hanging Leg Raise: 3x12-15
```

---

## Phase 4: Progressive Overload Tracking

### Overload Methods (Priority Order)

1. **Add Reps** - Hit the top of the rep range across all sets, then increase weight
2. **Add Weight** - Smallest increment available (typically 5 lbs upper, 10 lbs lower)
3. **Add Sets** - Increase volume by 1 set per exercise per week (cap at weekly MRV)
4. **Increase Frequency** - Add another training day for a lagging muscle group
5. **Decrease Rest** - Shorten rest periods by 15 seconds
6. **Increase Tempo** - Slow the eccentric phase

### Weekly Progression Log Template

```
Exercise: __________________
Week | Weight | Sets x Reps Achieved | RPE | Notes
-----|--------|----------------------|-----|------
  1  |        |                      |     |
  2  |        |                      |     |
  3  |        |                      |     |
  4  |        |                      |     |
```

### Volume Landmarks (Sets per Muscle Group per Week)

| Muscle Group | MV (Minimum) | MEV (Effective) | MAV (Maximum Adaptive) | MRV (Recovery Limit) |
|--------------|-------------|------------------|------------------------|---------------------|
| Chest | 4 | 8 | 12-16 | 20 |
| Back | 6 | 10 | 14-18 | 22 |
| Quads | 4 | 8 | 12-16 | 20 |
| Hamstrings | 4 | 6 | 10-14 | 16 |
| Shoulders | 4 | 8 | 12-16 | 20 |
| Biceps | 2 | 6 | 10-14 | 18 |
| Triceps | 2 | 6 | 8-12 | 16 |
| Calves | 4 | 8 | 10-14 | 16 |

---

## Phase 5: Deload Weeks

### When to Deload

- Every 4-6 weeks of hard training (programmed)
- When performance stalls for 2+ consecutive sessions
- When experiencing unusual fatigue, poor sleep, or joint pain
- RPE consistently above 9 on working sets

### Deload Protocol Options

| Method | Volume Reduction | Intensity Reduction |
|--------|-----------------|---------------------|
| Volume Deload | Reduce sets by 50% | Maintain weight |
| Intensity Deload | Maintain sets | Reduce weight by 40-50% |
| Full Deload | Reduce sets by 50% | Reduce weight by 40% |
| Active Recovery | Light activity only | No resistance training |

### Deload Week Template

```
Perform 2-3 sessions during deload week
- Use 50-60% of normal working weights
- Perform 2 sets per exercise instead of 3-4
- Focus on perfect form and mind-muscle connection
- No sets taken close to failure
- Include extra mobility and flexibility work
- Prioritize sleep and nutrition
```

---

## Phase 6: Warm-Up and Cool-Down Protocols

### General Warm-Up (5-10 minutes)

```
1. Light cardio: 3-5 min (walking, cycling, rowing)
2. Dynamic stretches:
   - Arm circles: 10 each direction
   - Leg swings (front/back): 10 each leg
   - Leg swings (side/side): 10 each leg
   - Hip circles: 10 each direction
   - Torso rotations: 10 each direction
   - Inchworms: 5 reps
   - World's greatest stretch: 5 each side
```

### Specific Warm-Up (Before Main Lifts)

```
Set 1: Bar only x 10 reps
Set 2: 40% working weight x 8 reps
Set 3: 60% working weight x 5 reps
Set 4: 80% working weight x 3 reps
Set 5: 90% working weight x 1 rep (heavy days only)
Begin working sets
```

### Cool-Down Protocol (5-10 minutes)

```
1. Light walking: 2-3 minutes
2. Static stretches (hold 30 seconds each):
   - Chest doorway stretch
   - Lat stretch (hang from bar)
   - Quad stretch (standing)
   - Hamstring stretch (seated)
   - Hip flexor stretch (kneeling)
   - Shoulder cross-body stretch
   - Tricep overhead stretch
3. Deep breathing: 1-2 minutes (4 count inhale, 6 count exhale)
```

---

## Phase 7: Exercise Database by Muscle Group

### Chest
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Barbell Bench Press | Barbell, Bench | Mid Chest | Intermediate |
| Incline Dumbbell Press | Dumbbells, Bench | Upper Chest | Beginner |
| Cable Fly | Cable Machine | Inner Chest | Beginner |
| Dips (Chest Focus) | Dip Station | Lower Chest | Intermediate |
| Push-ups | Bodyweight | Full Chest | Beginner |
| Decline Bench Press | Barbell, Bench | Lower Chest | Intermediate |

### Back
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Barbell Row | Barbell | Mid Back | Intermediate |
| Pull-ups | Pull-up Bar | Lats | Intermediate |
| Lat Pulldown | Cable Machine | Lats | Beginner |
| Cable Row | Cable Machine | Mid Back | Beginner |
| T-Bar Row | T-Bar or Barbell | Mid Back | Intermediate |
| Face Pull | Cable Machine | Rear Delts/Upper Back | Beginner |

### Legs (Quadriceps)
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Barbell Back Squat | Barbell, Rack | Quads/Glutes | Intermediate |
| Front Squat | Barbell, Rack | Quads | Advanced |
| Leg Press | Machine | Quads | Beginner |
| Bulgarian Split Squat | Dumbbells, Bench | Quads/Glutes | Intermediate |
| Leg Extension | Machine | Quads (isolation) | Beginner |
| Goblet Squat | Dumbbell/Kettlebell | Quads/Glutes | Beginner |

### Legs (Hamstrings/Glutes)
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Romanian Deadlift | Barbell/Dumbbells | Hamstrings | Intermediate |
| Conventional Deadlift | Barbell | Posterior Chain | Intermediate |
| Hip Thrust | Barbell, Bench | Glutes | Intermediate |
| Leg Curl | Machine | Hamstrings | Beginner |
| Good Morning | Barbell | Hamstrings/Lower Back | Advanced |
| Glute Bridge | Bodyweight/Barbell | Glutes | Beginner |

### Shoulders
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Overhead Press | Barbell | Front/Mid Delts | Intermediate |
| Dumbbell Lateral Raise | Dumbbells | Side Delts | Beginner |
| Arnold Press | Dumbbells | Full Delts | Intermediate |
| Rear Delt Fly | Dumbbells/Cable | Rear Delts | Beginner |
| Upright Row | Barbell/Cable | Side Delts/Traps | Intermediate |
| Cable Lateral Raise | Cable Machine | Side Delts | Beginner |

### Arms
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Barbell Curl | Barbell | Biceps | Beginner |
| Hammer Curl | Dumbbells | Brachialis/Biceps | Beginner |
| Tricep Pushdown | Cable Machine | Triceps | Beginner |
| Skull Crushers | Barbell/EZ Bar | Triceps | Intermediate |
| Preacher Curl | EZ Bar, Bench | Biceps (short head) | Beginner |
| Overhead Tricep Extension | Dumbbell/Cable | Triceps (long head) | Beginner |

### Core
| Exercise | Equipment | Primary Target | Difficulty |
|----------|-----------|----------------|------------|
| Hanging Leg Raise | Pull-up Bar | Lower Abs | Intermediate |
| Ab Wheel Rollout | Ab Wheel | Full Core | Intermediate |
| Plank | Bodyweight | Core Stability | Beginner |
| Cable Woodchop | Cable Machine | Obliques | Intermediate |
| Pallof Press | Cable/Band | Anti-Rotation | Beginner |
| Dead Bug | Bodyweight | Deep Core | Beginner |

---

## RPE (Rate of Perceived Exertion) Guide

| RPE | Description | Reps in Reserve |
|-----|-------------|-----------------|
| 10 | Maximum effort, could not do another rep | 0 |
| 9 | Could maybe do 1 more rep | 1 |
| 8 | Could do 2 more reps | 2 |
| 7 | Could do 3 more reps, moderate difficulty | 3 |
| 6 | Could do 4+ more reps, light-moderate | 4+ |
| 5 | Warm-up weight | 5+ |

---

## Quick Program Selection Guide

```
Goal: Muscle Growth + 3 days/week = Full Body Hypertrophy
Goal: Muscle Growth + 4 days/week = Upper/Lower Hypertrophy
Goal: Muscle Growth + 6 days/week = PPL Hypertrophy
Goal: Strength + 3-4 days/week = 5/3/1 or Starting Strength
Goal: Fat Loss + 3-4 days/week = Full Body + Cardio Conditioning
Goal: General Fitness + 3 days/week = Full Body Mixed
Goal: Endurance + 4 days/week = Circuit Training + Cardio
```

---

## Output Format

When generating a workout plan, present it as:

```
WORKOUT PLAN: [Goal] - [Split Type]
Duration: [X] weeks
Frequency: [X] days/week
Session Length: [X] minutes

WEEK [N] - DAY [N]: [Focus]
Warm-Up: [Protocol]

Exercise | Sets | Reps | Rest | RPE Target | Notes
---------|------|------|------|-----------|------
         |      |      |      |           |

Cool-Down: [Protocol]

PROGRESSION NOTES:
- [When to increase weight]
- [Deload schedule]
- [Adjustments for next phase]
```

## Example

**Input:** "Help me get started with workout planner"

**Output:** A structured workout planner plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
