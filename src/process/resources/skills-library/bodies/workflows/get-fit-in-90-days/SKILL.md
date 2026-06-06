---
name: get-fit-in-90-days
description: >-
  Structured 90-day fitness transformation workflow that takes you from initial
  assessment through progressive training phases, integrated nutrition planning,
  performance tracking, and long-term sustainability habits for lasting results.

  Use when the user wants to get fit in 90 days or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "fitness-trainer workout-planner nutrition-advisor sports-nutrition habit-tracker running-coach"
trigger_phrases: >-
  I want to get fit in 90 days help me get in shape 90 day fitness plan
  transform my body in 3 months I want to start working out build a fitness
  routine
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: fitness workout-planning nutrition health-wellness step-by-step planning
  category: life-event
  depends: "fitness-trainer workout-planner nutrition-advisor sports-nutrition habit-tracker running-coach"
---
# Get Fit In 90 Days

This workflow references health and fitness information for educational purposes only. It is not medical advice. Consult a qualified healthcare provider before starting any fitness or nutrition program.

**Estimated time:** 12-14 weeks

This workflow provides a structured 90-day path from wherever you are now to
measurably fitter, stronger, and more capable. It is not about extreme protocols
or unsustainable crash programs. Instead, it divides the 90 days into clear
phases -- assessment, progressive training, nutrition integration, tracking, and
sustainability -- so that each week builds on the last.

By the end of this workflow you will have: a baseline fitness assessment, a
periodized training program tailored to your goals and equipment, a nutrition
plan that fuels performance, a tracking system that shows objective progress,
and a sustainability strategy that keeps you going long past day 90.

> **DISCLAIMER**: This workflow provides general fitness and nutrition
> information for educational purposes only. It is not medical advice. Consult
> a qualified healthcare professional before starting any exercise or nutrition
> program, especially if you have existing health conditions, injuries, or
> concerns. Stop any exercise that causes pain and seek professional guidance.

## When to Use

- User wants to get fit in 90 days
- User needs a structured, step-by-step process for get fit in 90 days
- User wants to get fit in 90 days
- User wants to get in shape
- 90 day fitness plan
- Do NOT use when: the request is outside the scope of get fit in 90 days or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Medical clearance for exercise (especially if sedentary, over 40, or with health conditions)
- Access to basic equipment or a gym (bodyweight alternatives are provided)
- Ability to dedicate 3-5 sessions per week, 30-60 minutes each
- A way to track workouts (notebook, phone app, or spreadsheet)
- Honest self-assessment of your current fitness level

## Steps

**Step 1: Assess Your Starting Point** (uses: fitness-trainer)

conduct a thorough baseline
assessment. This is the foundation everything else is built on.

- Input: age, weight, height, and general health status, Exercise history (never, lapsed, inconsistent, or returning from injury), Available equipment and training environment (home, gym, outdoor)
- Output: Complete assessment scores, measurements, and photos, 30-day, 60-day, and 90-day SMART fitness goals, Readiness score and any limitations to program around
- Key focus: Body composition baseline (weight, measurements, photos if willing)

**Step 2: Build Your Training Plan** (uses: workout-planner)

create a periodized 90-day training program
divided into three 30-day phases.

- Input: `fitness-baseline` from Step 1 (current level determines program intensity), `smart-goals` from Step 1 (goals determine program focus), `training-readiness` from Step 1 (limitations shape exercise selection)
- Output: Complete 90-day periodized program with all sessions, Exercise descriptions, form cues, and alternatives, Phase-specific warm-up and cool-down routines
- Key focus: Phase 1 (Days 1-30): Foundation -- build movement quality, establish routine

**Step 3: Dial In Your Nutrition** (uses: nutrition-advisor)

create a nutrition plan that directly
supports the training program and goals.

- Input: `fitness-baseline` from Step 1 (body composition data for calorie calculation), `smart-goals` from Step 1 (fat loss vs. muscle gain changes nutrition targets), `training-program` from Step 2 (training volume affects calorie needs)
- Output: Daily calorie and macronutrient targets per training phase, Practical meal templates hitting macro targets, Evidence-based supplement recommendations
- Key focus: Calculate Total Daily Energy Expenditure (TDEE) adjusted for training load

**Step 4: Track and Measure Progress** (uses: sports-nutrition)

establish a comprehensive tracking system
that provides objective feedback on progress.

- Input: `fitness-baseline` from Step 1 (the reference point for all progress), `smart-goals` from Step 1 (goals define what to measure), `training-program` from Step 2 (training logs feed progress analysis)
- Output: Template for logging all metrics daily and weekly, Biweekly assessment protocol and comparison format, Decision tree for modifying the plan when progress stalls
- Key focus: Body composition tracking (weight, measurements, photos every 2 weeks)

**Step 5: Build Sustainability Beyond Day 90** (uses: habit-tracker)

convert the 90-day program into a permanent
lifestyle. The danger zone is days 91-120 when the structured program ends
and motivation fades.

- Input: `training-program` from Step 2 (which parts of the routine stuck), `nutrition-plan` from Step 3 (which eating habits are now automatic), `tracking-dashboard` from Step 4 (data on what worked and what did not)
- Output: Which habits are automatic vs. still requiring effort, Ongoing training template for after day 90, New SMART goals building on achieved results
- Key focus: Identify which habits became automatic during the 90 days

**Step 6: Sustain and Level Up** (uses: running-coach)

Use the Running Coach skill (or revisit the Workout Planner for strength focus)
to add a new dimension to your fitness. After establishing a general fitness
base, many people benefit from pursuing a specific athletic goal.

- Input: `next-90-goals` from Step 5 (new direction based on results), `maintenance-program` from Step 5 (baseline to build from), discovered preferences for training modalities
- Output: Chosen pursuit with target event and timeline, Training plan integrating new pursuit with base fitness, Groups, clubs, or partners for the chosen activity
- Key focus: Choosing a specific athletic pursuit (5K, obstacle race, sport, competition)

## Decision Points

- **After Step 1:** Where will you primarily train?
  - If **Commercial gym**: Full equipment access. Program uses barbells, dumbbells, cables, and machines.
  - If **Home gym**: Program adapts to available equipment. May need creative alternatives.
  - If **Bodyweight only**: Calisthenics-focused program. Progression through leverage and tempo, not weight.
  - If **Outdoor / minimal equipment**: Combines running, calisthenics, and park equipment. Includes weather contingencies.
- **After Step 2:** What is your primary goal for these 90 days?
  - If **Fat loss**: Nutrition plan sets caloric deficit. Training emphasizes metabolic conditioning plus muscle preservation.
  - If **Muscle gain**: Nutrition plan sets caloric surplus. Training emphasizes hypertrophy and progressive overload.
  - If **General fitness and energy**: Nutrition plan targets maintenance calories. Training is balanced across all fitness qualities.
  - If **Athletic performance**: Nutrition plan supports training demands. Programming is sport-specific with periodization.

## Failure Handling

- **Starting too hard:** Phase 1 feels too easy. That is intentional. Building the habit matters more than crushing yourself on day one.
- **Ignoring nutrition:** You cannot out-train a bad diet. Nutrition is at least 50% of the results.
- **Scale obsession:** Weight fluctuates daily due to water, food, and hormones. Track trends over weeks, not days.
- **Skipping deload weeks:** Recovery is when adaptation happens. Deload weeks are not optional.
- **Program hopping:** Stick with the plan for the full 90 days. Switching programs every 2 weeks guarantees no progress.

## Expected Outcome

When this workflow is complete, the user will have:

1. Day 90 fitness tests show measurable improvement over baseline in all categories
2. Body composition has moved in the desired direction (fat loss, muscle gain, or both)
3. The user can execute a full training session with good form and appropriate intensity
4. Nutrition habits support training without feeling restrictive or unsustainable
5. A maintenance plan is in place so gains are not lost after the program ends
6. The user identifies as someone who trains, not someone who is on a program

## Output Format

```
GET FIT IN 90 DAYS TRACKER
==========================

[ ] Step 1: Assess Your Starting Point
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Your Training Plan
    Status: [pending/in-progress/complete]
[ ] Step 3: Dial In Your Nutrition
    Status: [pending/in-progress/complete]
[ ] Step 4: Track and Measure Progress
    Status: [pending/in-progress/complete]
[ ] Step 5: Build Sustainability Beyond Day 90
    Status: [pending/in-progress/complete]
[ ] Step 6: Sustain and Level Up
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Starting too hard:** Phase 1 feels too easy. That is intentional. Building the habit matters more than crushing yourself on day one.
- **Ignoring nutrition:** You cannot out-train a bad diet. Nutrition is at least 50% of the results.
- **Scale obsession:** Weight fluctuates daily due to water, food, and hormones. Track trends over weeks, not days.
- **Skipping deload weeks:** Recovery is when adaptation happens. Deload weeks are not optional.

## Example

**Input:** "I want to get fit in 90 days and need a structured plan to follow step by step."

**Output:**

**Step 1 (fitness-trainer):** Assess Your Starting Point -- produces concrete deliverables for this phase.

**Step 2 (workout-planner):** Build Your Training Plan -- produces concrete deliverables for this phase.

**Step 3 (nutrition-advisor):** Dial In Your Nutrition -- produces concrete deliverables for this phase.

**Step 4 (sports-nutrition):** Track and Measure Progress -- produces concrete deliverables for this phase.

**Step 5 (habit-tracker):** Build Sustainability Beyond Day 90 -- produces concrete deliverables for this phase.

**Step 6 (running-coach):** Sustain and Level Up -- produces concrete deliverables for this phase.

**Result:** User has a complete get fit in 90 days plan with all deliverables produced, validated, and ready for implementation.
