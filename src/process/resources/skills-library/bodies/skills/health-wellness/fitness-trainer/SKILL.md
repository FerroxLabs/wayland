---
name: fitness-trainer
description: |
  AI-powered personal fitness trainer that builds customized workout plans based on individual goals, fitness level, equipment availability, and injury history. Uses NASM OPT model principles, progressive overload methodology, and evidence-based exercise programming.
  Use when the user asks about fitness trainer, or needs help with ai-powered personal fitness trainer that builds customized workout plans based on individual goals, fitness level, equipment availability, and injury history.
  Do NOT use when the request requires professional medical advice or falls outside the scope of fitness trainer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness fitness guide"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Personal Fitness Trainer

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- User asks about fitness trainer
- User needs guidance on fitness trainer topics
- User wants a structured approach to fitness trainer

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

Before generating any workout plan, gather the following information:

### Required Assessment Questionnaire

```
PERSONAL FITNESS ASSESSMENT
============================

1. GOALS (select primary + secondary):
   [ ] Build muscle / hypertrophy
   [ ] Lose fat / body recomposition
   [ ] Increase strength
   [ ] Improve cardiovascular endurance
   [ ] Increase flexibility / mobility
   [ ] Sport-specific performance
   [ ] General health and wellness
   [ ] Rehabilitation / return to activity

2. CURRENT FITNESS LEVEL:
   [ ] Beginner (0-6 months consistent training)
   [ ] Intermediate (6 months - 2 years consistent training)
   [ ] Advanced (2+ years consistent training)
   [ ] Returning after extended break (how long? ___)

3. TRAINING HISTORY:
   - Current exercise frequency: ___ days/week
   - Types of exercise currently doing: ___
   - Longest consistent training streak: ___

4. PHYSICAL INFORMATION:
   - Age: ___
   - Biological sex: ___
   - Height: ___
   - Weight: ___
   - Body fat % (if known): ___

5. INJURY / LIMITATION HISTORY:
   - Current injuries: ___
   - Past injuries: ___
   - Chronic conditions: ___
   - Movements that cause pain: ___
   - Doctor clearance obtained: [ ] Yes [ ] No

6. EQUIPMENT AVAILABLE:
   [ ] Full commercial gym
   [ ] Home gym (list equipment: ___)
   [ ] Bodyweight only
   [ ] Resistance bands
   [ ] Dumbbells (weight range: ___)
   [ ] Barbell + plates
   [ ] Pull-up bar
   [ ] Kettlebells
   [ ] Machines (list: ___)
   [ ] Cardio equipment (list: ___)

7. SCHEDULE:
   - Days available per week: ___
   - Time per session: ___ minutes
   - Preferred training times: ___
   - Non-negotiable rest days: ___

8. PREFERENCES:
   - Enjoyed exercises: ___
   - Disliked exercises: ___
   - Training style preference: ___
```

## NASM Optimum Performance Training (OPT) Model

The NASM OPT model is a systematic, progressive training framework with five phases:

### Phase 1: Stabilization Endurance (Weeks 1-4 for beginners)
- **Purpose:** Build foundational stability, correct imbalances, develop endurance
- **Sets:** 1-3
- **Reps:** 12-20
- **Tempo:** 4/2/1 (4 sec eccentric, 2 sec isometric, 1 sec concentric)
- **Rest:** 0-90 seconds
- **Intensity:** 50-70% 1RM
- **Exercises:** Stability ball, single-leg, balance-focused movements

### Phase 2: Strength Endurance (Weeks 5-8)
- **Purpose:** Increase lean body mass, improve stabilization endurance and strength
- **Sets:** 2-4
- **Reps:** 8-12
- **Tempo:** 2/0/2
- **Rest:** 0-60 seconds
- **Intensity:** 70-80% 1RM
- **Format:** Superset - one strength exercise followed by one stabilization exercise

### Phase 3: Hypertrophy (Weeks 9-12)
- **Purpose:** Maximize muscle growth
- **Sets:** 3-5
- **Reps:** 6-12
- **Tempo:** 2/0/2
- **Rest:** 0-60 seconds
- **Intensity:** 75-85% 1RM

### Phase 4: Maximal Strength (Weeks 13-16)
- **Purpose:** Increase maximal force production
- **Sets:** 4-6
- **Reps:** 1-5
- **Tempo:** Explosive / controlled
- **Rest:** 3-5 minutes
- **Intensity:** 85-100% 1RM

### Phase 5: Power (Weeks 17-20)
- **Purpose:** Develop speed and force production
- **Sets:** 3-5
- **Reps:** 1-5 (strength) / 8-10 (power)
- **Tempo:** Explosive
- **Rest:** 3-5 minutes
- **Intensity:** 30-45% 1RM (power) / 85-100% (strength)
- **Format:** Superset - one strength exercise followed by one power exercise

## Progressive Overload Principles

Progressive overload is the gradual increase of stress placed on the body during training. Apply these methods systematically:

### Methods of Progression (in priority order)
1. **Improve form/technique** - Master the movement pattern first
2. **Increase range of motion** - Full ROM before adding load
3. **Increase reps** - Add 1-2 reps per set within the target range
4. **Increase sets** - Add 1 set per exercise when rep targets are met
5. **Increase load** - Add weight when all sets hit top of rep range
6. **Decrease rest periods** - Reduce rest time between sets
7. **Increase time under tension** - Slow the tempo
8. **Increase training frequency** - Add training days per week

### Rate of Progression Guidelines
| Level | Strength Gain/Month | Load Increase/Session |
|-------|--------------------|-----------------------|
| Beginner | 3-5% | 2.5-5 lbs upper / 5-10 lbs lower |
| Intermediate | 1-2% | 2.5 lbs upper / 5 lbs lower |
| Advanced | 0.5-1% | Periodized micro-loading |

## Workout Plan Templates

### Template 1: Full Body (3 days/week - Beginner)

```
FULL BODY WORKOUT - DAY A
===========================
Warm-up: 5-10 min (see warm-up protocol below)

1. Goblet Squat             3 x 12-15   Rest: 60s
2. Dumbbell Bench Press     3 x 12-15   Rest: 60s
3. Cable Row                3 x 12-15   Rest: 60s
4. Dumbbell Romanian DL     3 x 12-15   Rest: 60s
5. Overhead Press            3 x 12-15   Rest: 60s
6. Plank Hold               3 x 30-45s  Rest: 45s

Cool-down: 5-10 min (see cool-down protocol below)

FULL BODY WORKOUT - DAY B
===========================
Warm-up: 5-10 min

1. Leg Press                3 x 12-15   Rest: 60s
2. Incline DB Press         3 x 12-15   Rest: 60s
3. Lat Pulldown             3 x 12-15   Rest: 60s
4. Walking Lunges           3 x 12/leg  Rest: 60s
5. Face Pulls               3 x 15      Rest: 45s
6. Dead Bug                 3 x 10/side Rest: 45s

Cool-down: 5-10 min

Schedule: Mon(A) / Wed(B) / Fri(A) -> Mon(B) / Wed(A) / Fri(B)
```

### Template 2: Upper/Lower Split (4 days/week - Intermediate)

```
UPPER BODY - DAY 1 (Strength Focus)
=====================================
Warm-up: 5-10 min

1. Barbell Bench Press      4 x 6-8     Rest: 2-3 min
2. Barbell Row              4 x 6-8     Rest: 2-3 min
3. Overhead Press           3 x 8-10    Rest: 90s
4. Weighted Pull-up         3 x 8-10    Rest: 90s
5. Dumbbell Curl            3 x 10-12   Rest: 60s
6. Tricep Dips              3 x 10-12   Rest: 60s
7. Face Pulls               3 x 15      Rest: 45s

LOWER BODY - DAY 2 (Strength Focus)
=====================================
Warm-up: 5-10 min

1. Barbell Back Squat       4 x 6-8     Rest: 3 min
2. Romanian Deadlift        4 x 8-10    Rest: 2 min
3. Bulgarian Split Squat    3 x 10-12   Rest: 90s
4. Leg Curl                 3 x 10-12   Rest: 60s
5. Calf Raise               4 x 12-15   Rest: 60s
6. Ab Wheel Rollout         3 x 10-12   Rest: 60s

UPPER BODY - DAY 3 (Hypertrophy Focus)
========================================
Warm-up: 5-10 min

1. Incline DB Press         4 x 10-12   Rest: 90s
2. Cable Row                4 x 10-12   Rest: 90s
3. Lateral Raise            3 x 12-15   Rest: 60s
4. Lat Pulldown             3 x 10-12   Rest: 90s
5. Hammer Curl              3 x 12-15   Rest: 60s
6. Overhead Tricep Ext.     3 x 12-15   Rest: 60s
7. Rear Delt Fly            3 x 15      Rest: 45s

LOWER BODY - DAY 4 (Hypertrophy Focus)
========================================
Warm-up: 5-10 min

1. Front Squat              4 x 10-12   Rest: 2 min
2. Stiff-Leg Deadlift       3 x 10-12   Rest: 90s
3. Leg Press                3 x 12-15   Rest: 90s
4. Walking Lunges           3 x 12/leg  Rest: 90s
5. Seated Calf Raise        4 x 15-20   Rest: 60s
6. Hanging Leg Raise        3 x 12-15   Rest: 60s

Schedule: Mon(U1) / Tue(L1) / Thu(U2) / Fri(L2)
```

### Template 3: Push/Pull/Legs (6 days/week - Advanced)

```
PUSH DAY
=========
1. Barbell Bench Press      4 x 5-8     Rest: 3 min
2. Overhead Press           4 x 8-10    Rest: 2 min
3. Incline DB Press         3 x 10-12   Rest: 90s
4. Cable Fly                3 x 12-15   Rest: 60s
5. Lateral Raise            4 x 12-15   Rest: 60s
6. Tricep Pushdown          3 x 10-12   Rest: 60s
7. Overhead Tricep Ext.     3 x 12-15   Rest: 60s

PULL DAY
=========
1. Deadlift                 4 x 5-8     Rest: 3 min
2. Weighted Pull-up         4 x 6-8     Rest: 2 min
3. Cable Row                3 x 10-12   Rest: 90s
4. Face Pulls               3 x 15-20   Rest: 60s
5. Barbell Curl             3 x 10-12   Rest: 60s
6. Hammer Curl              3 x 12-15   Rest: 60s
7. Rear Delt Fly            3 x 15      Rest: 45s

LEGS DAY
=========
1. Barbell Back Squat       4 x 5-8     Rest: 3 min
2. Romanian Deadlift        4 x 8-10    Rest: 2 min
3. Leg Press                3 x 10-12   Rest: 90s
4. Bulgarian Split Squat    3 x 10-12   Rest: 90s
5. Leg Curl                 3 x 10-12   Rest: 60s
6. Calf Raise               5 x 12-15   Rest: 60s
7. Ab Work (varies)         3 x 12-15   Rest: 60s

Schedule: Push/Pull/Legs/Push/Pull/Legs/Rest
```

## Warm-Up Protocol (10 minutes)

Follow this sequence before every training session:

### Phase 1: General Warm-Up (3-5 minutes)
- Light cardio to raise heart rate (walking, cycling, rowing)
- Target: light sweat, slightly elevated breathing

### Phase 2: Self-Myofascial Release / Foam Rolling (2 minutes)
- Roll each target muscle group 30 seconds
- Focus on tight or sore areas
- Apply moderate pressure, pause on tender spots

### Phase 3: Dynamic Stretching (3 minutes)
- Leg swings (front-back and side-to-side): 10 each direction
- Arm circles: 10 forward, 10 backward
- Hip circles: 10 each direction
- Walking lunges with twist: 5 each side
- Inchworms: 5 reps
- Cat-cow: 10 reps

### Phase 4: Movement-Specific Warm-Up (2 minutes)
- Perform 2 sets of the first exercise with light weight
- Set 1: 10 reps at 40% working weight
- Set 2: 5 reps at 60% working weight

## Cool-Down Protocol (5-10 minutes)

### Phase 1: Light Activity (2-3 minutes)
- Walking or easy cycling to gradually lower heart rate

### Phase 2: Static Stretching (5-7 minutes)
Hold each stretch 30 seconds, 2 sets per muscle group worked:
- Chest: doorway stretch
- Back: child's pose
- Shoulders: cross-body stretch
- Quads: standing quad stretch
- Hamstrings: seated forward fold
- Hip flexors: half-kneeling stretch
- Calves: wall calf stretch

## Rep/Set/Rest Scheme Reference

| Goal | Sets | Reps | Rest | Intensity | Tempo |
|------|------|------|------|-----------|-------|
| Muscular Endurance | 2-3 | 12-20 | 30-60s | 50-70% 1RM | 4/2/1 |
| Hypertrophy | 3-5 | 6-12 | 60-90s | 70-85% 1RM | 2/0/2 |
| Strength | 4-6 | 1-5 | 3-5 min | 85-100% 1RM | 1/0/1 |
| Power | 3-5 | 1-5 | 3-5 min | 30-45% 1RM | Explosive |

## Exercise Substitution Guide

When an exercise is unavailable due to equipment or injury, use these swaps:

### Chest Substitutions
| Primary | Substitute 1 | Substitute 2 | Bodyweight |
|---------|-------------|-------------|------------|
| Barbell Bench Press | Dumbbell Bench Press | Floor Press | Push-ups |
| Incline Bench Press | Incline DB Press | Landmine Press | Decline Push-ups |
| Cable Fly | DB Fly | Band Fly | Wide Push-ups |

### Back Substitutions
| Primary | Substitute 1 | Substitute 2 | Bodyweight |
|---------|-------------|-------------|------------|
| Barbell Row | Dumbbell Row | Cable Row | Inverted Row |
| Pull-up | Lat Pulldown | Band Pull-up | Negative Pull-ups |
| Deadlift | Trap Bar Deadlift | DB Deadlift | Single-Leg RDL |

### Leg Substitutions
| Primary | Substitute 1 | Substitute 2 | Bodyweight |
|---------|-------------|-------------|------------|
| Barbell Squat | Goblet Squat | Leg Press | Pistol Squat |
| Romanian Deadlift | DB RDL | Good Morning | Nordic Curl |
| Leg Extension | Sissy Squat | Band Leg Extension | Wall Sit |

### Shoulder Substitutions
| Primary | Substitute 1 | Substitute 2 | Bodyweight |
|---------|-------------|-------------|------------|
| Overhead Press | DB Shoulder Press | Landmine Press | Pike Push-up |
| Lateral Raise | Cable Lateral Raise | Band Lateral Raise | Side Plank Raise |

## Cardiovascular Training Guidelines

### By Goal
| Goal | Type | Frequency | Duration | Intensity |
|------|------|-----------|----------|-----------|
| Fat Loss | LISS + HIIT | 3-5x/week | 20-45 min | 60-85% MHR |
| Endurance | LISS | 3-5x/week | 30-60 min | 60-75% MHR |
| General Health | Mixed | 3x/week | 20-30 min | 65-80% MHR |
| Muscle Gain | Minimal LISS | 2x/week | 15-20 min | 60-70% MHR |

### Max Heart Rate Estimation
- Formula: MHR = 220 - age
- Example: 30 years old -> MHR = 190 bpm
- Zone 2 (fat burning): 60-70% MHR = 114-133 bpm
- Zone 3 (aerobic): 70-80% MHR = 133-152 bpm
- Zone 4 (anaerobic): 80-90% MHR = 152-171 bpm

## Deload Protocol

Every 4-6 weeks, implement a deload week:
- **Option A:** Reduce volume - same weight, 50% of normal sets
- **Option B:** Reduce intensity - same sets/reps, 50-60% of normal weight
- **Option C:** Active recovery - light movement, mobility work, yoga

### Signs You Need a Deload
- Persistent fatigue despite adequate sleep
- Stalled or declining performance for 2+ weeks
- Increased resting heart rate
- Mood disturbances or decreased motivation
- Joint pain or nagging injuries
- Disrupted sleep patterns

## Workout Plan Generation Workflow

1. Collect user assessment data (questionnaire above)
2. Determine appropriate NASM OPT phase
3. Select training split based on schedule and level
4. Choose exercises based on equipment and injury history
5. Set rep/set/rest parameters based on goal and phase
6. Apply progressive overload plan for 4-6 week block
7. Include warm-up and cool-down protocols
8. Schedule deload week
9. Plan reassessment after training block
10. Adjust and progress to next phase

## Safety Reminders

- Never train through sharp or shooting pain
- Maintain proper form over increasing weight
- Stay hydrated during training (sip water between sets)
- Use a spotter for heavy barbell lifts
- Allow 48 hours between training the same muscle group
- Get medical clearance before starting if sedentary or over 40
- Progress gradually - the body adapts over weeks, not days


## Output Format

```
FITNESS TRAINER OUTPUT
======================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "Help me get started with fitness trainer"

**Output:** A structured fitness trainer plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
