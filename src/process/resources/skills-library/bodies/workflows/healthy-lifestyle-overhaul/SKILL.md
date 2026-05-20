---
name: healthy-lifestyle-overhaul
description: >-
  Comprehensive health transformation workflow integrating fitness training,
  nutrition planning, weekly meal preparation, sleep optimization, and habit
  formation for sustainable lifestyle change rather than quick fixes.

  Use when the user wants to healthy lifestyle overhaul or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "fitness-trainer nutrition-advisor meal-planner sleep-optimizer habit-tracker"
trigger_phrases: >-
  I want to get healthy help me transform my lifestyle healthy lifestyle plan
  get fit and eat better total health overhaul improve my health start living
  healthier
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: health-wellness fitness nutrition sleep habits step-by-step planning
  category: life-event
  depends: "fitness-trainer nutrition-advisor meal-planner sleep-optimizer habit-tracker"
  disclaimer: not-medical-advice
  difficulty: beginner
---
# Healthy Lifestyle Overhaul

This workflow references health and fitness information for educational purposes only. It is not medical advice. Consult a qualified healthcare provider before starting any fitness or nutrition program.

**Estimated time:** 8-12 weeks

This workflow guides you through a comprehensive, sustainable health
transformation covering the five pillars of wellness: exercise, nutrition,
meal planning, sleep, and habit formation. Unlike crash diets or extreme
workout programs, this workflow builds lasting change by starting with small,
achievable steps and progressively expanding.

Each skill builds on the previous one, creating an integrated system where
exercise, nutrition, sleep, and habits reinforce each other. The habit
formation step ties everything together with behavioral science.

By the end of this workflow you will have: a personalized fitness program, an
evidence-based nutrition plan, a weekly meal prep system, optimized sleep
practices, and a habit system that makes healthy choices automatic.

## When to Use

- User wants to healthy lifestyle overhaul
- User needs a structured, step-by-step process for healthy lifestyle overhaul
- User wants to get healthy
- User wants to transform my lifestyle
- healthy lifestyle plan
- Do NOT use when: the request is outside the scope of healthy lifestyle overhaul or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Medical clearance for exercise (consult a doctor if you have health conditions)
- Willingness to make gradual changes (this is not a quick fix)
- Access to basic fitness equipment or a gym (bodyweight-only options available)
- A kitchen with basic cooking equipment
- Honesty about your current habits (no judgment -- just the starting point)

## Steps

**Step 1: Build Your Fitness Foundation** (uses: fitness-trainer)

design a progressive training program.

- Input: current fitness level and exercise history, Their goals (weight loss, muscle gain, endurance, general fitness), Available equipment and time per week
- Output: Complete workout plan with exercises, sets, reps, and progression, SMART fitness goals with measurement methods, Selected exercises with form cues and alternatives
- Key focus: Fitness assessment (current strength, cardiovascular fitness, flexibility)

**Step 2: Design Your Nutrition Plan** (uses: nutrition-advisor)

create an evidence-based nutrition plan
that supports the fitness program.

- Input: `fitness-program` from Step 1 (exercise type affects nutritional needs), `fitness-goals` from Step 1 (goals drive calorie and macro targets), current eating habits and dietary preferences
- Output: Daily calorie and macronutrient targets with food guidance, Daily water intake goals and tracking method, Evidence-based supplement recommendations
- Key focus: Calculating daily calorie needs (TDEE) adjusted for activity level

**Step 3: Set Up Weekly Meal Prep** (uses: meal-planner)

translate the nutrition plan into a
practical meal prep system.

- Input: `nutrition-plan` from Step 2 (calorie and macro targets to hit), `fitness-program` from Step 1 (training days vs. rest days may differ), cooking skill level and available time
- Output: 7-day meal plan aligned with nutrition targets, When to prep, what to prep, and storage instructions, Organized grocery list from the meal plan
- Key focus: Designing a weekly meal plan that hits nutrition targets

**Step 4: Optimize Your Sleep** (uses: sleep-optimizer)

improve sleep quality, which is the foundation
that makes fitness and nutrition work.

- Input: `fitness-program` from Step 1 (exercise timing affects sleep), `nutrition-plan` from Step 2 (evening eating affects sleep quality), current sleep patterns and problems
- Output: Current sleep quality baseline and identified issues, Optimized sleep hygiene practices and environment changes, Structured wind-down routine for consistent sleep onset
- Key focus: Sleep assessment (current schedule, quality, duration, disruptions)

**Step 5: Build Lasting Habits** (uses: habit-tracker)

tie all the lifestyle changes together into
sustainable automatic behaviors. This is the step that determines whether
the changes last.

- Input: `fitness-program` from Step 1 (exercise habit to establish), `nutrition-plan` from Step 2 (eating habits to build), `weekly-meal-plan` from Step 3 (meal prep habit to maintain)
- Output: The 3-5 core habits that drive the entire lifestyle change, Implementation intentions, cues, routines, and rewards for each habit, Chosen tracking tool and daily review process
- Key focus: Identifying the 3-5 keystone habits from the previous steps

## Decision Points

- **After Step 1:** What is your primary fitness goal?
  - If **Weight/fat loss**: Nutrition plan emphasizes caloric deficit. Fitness program includes cardio and resistance.
  - If **Muscle gain**: Nutrition plan emphasizes caloric surplus and protein. Fitness program focuses on hypertrophy.
  - If **General health and energy**: Moderate nutrition targets. Fitness program balances strength, cardio, and flexibility.
  - If **Athletic performance**: Nutrition plan supports training demands. Fitness program is sport-specific with periodization.
- **After Step 2:** Do you have a preferred dietary approach?
  - If **No specific diet (balanced eating)**: Meal plans focus on balanced macros with variety. Most flexible approach.
  - If **Plant-based/vegetarian/vegan**: Meal plans adapted for plant-based protein sources. Special attention to B12, iron, and complete proteins.
  - If **Low-carb/keto**: Meal plans emphasize fats and protein. May affect high-intensity exercise performance.
  - If **Cultural or religious dietary requirements**: Meal plans respect specific food requirements. Nutrition targets adjusted for available foods.

## Failure Handling

- **Trying to change everything at once:** Start with Steps 1 and 2. Add meal prep and sleep changes gradually.
- **All-or-nothing thinking:** An imperfect day is not a failure. Consistency over perfection.
- **Ignoring sleep:** Sleep is the multiplier. Poor sleep undermines both exercise and nutrition.
- **Overly restrictive nutrition:** Extreme diets fail long-term. Aim for 80/20 compliance.
- **No tracking:** What gets measured gets managed. Track workouts, meals, and habits.

## Expected Outcome

When this workflow is complete, the user will have:

1. A fitness program is being followed consistently (3+ sessions per week)
2. Nutrition targets are being met most days (80% compliance is excellent)
3. Meal prep is saving time and supporting nutrition goals
4. Sleep quality has measurably improved
5. Key habits are tracked and maintained for at least 3 consecutive weeks
6. The user feels more energetic, stronger, and more in control of their health
7. Changes feel sustainable, not punishing

## Output Format

```
HEALTHY LIFESTYLE OVERHAUL TRACKER
==================================

[ ] Step 1: Build Your Fitness Foundation
    Status: [pending/in-progress/complete]
[ ] Step 2: Design Your Nutrition Plan
    Status: [pending/in-progress/complete]
[ ] Step 3: Set Up Weekly Meal Prep
    Status: [pending/in-progress/complete]
[ ] Step 4: Optimize Your Sleep
    Status: [pending/in-progress/complete]
[ ] Step 5: Build Lasting Habits
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Trying to change everything at once:** Start with Steps 1 and 2. Add meal prep and sleep changes gradually.
- **All-or-nothing thinking:** An imperfect day is not a failure. Consistency over perfection.
- **Ignoring sleep:** Sleep is the multiplier. Poor sleep undermines both exercise and nutrition.
- **Overly restrictive nutrition:** Extreme diets fail long-term. Aim for 80/20 compliance.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** "I want to healthy lifestyle overhaul and need a structured plan to follow step by step."

**Output:**

**Step 1 (fitness-trainer):** Build Your Fitness Foundation -- produces concrete deliverables for this phase.

**Step 2 (nutrition-advisor):** Design Your Nutrition Plan -- produces concrete deliverables for this phase.

**Step 3 (meal-planner):** Set Up Weekly Meal Prep -- produces concrete deliverables for this phase.

**Step 4 (sleep-optimizer):** Optimize Your Sleep -- produces concrete deliverables for this phase.

**Step 5 (habit-tracker):** Build Lasting Habits -- produces concrete deliverables for this phase.

**Result:** User has a complete healthy lifestyle overhaul plan with all deliverables produced, validated, and ready for implementation.
