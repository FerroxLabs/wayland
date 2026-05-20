---
name: train-for-marathon
description: >-
  Complete marathon training workflow covering base building, progressive
  training, peak preparation, taper strategy, race execution, and recovery for
  finishing your first or fastest 26.2 miles.

  Use when the user wants to train for marathon or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "running-coach workout-planner sports-nutrition injury-rehab"
trigger_phrases: >-
  I want to run a marathon help me train for a marathon marathon training plan
  how to prepare for 26.2 miles first marathon training run a marathon in six
  months
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: running fitness step-by-step planning
  category: life-event
  depends: "running-coach workout-planner sports-nutrition injury-rehab"
  disclaimer: not-medical-advice
  difficulty: intermediate
---
# Train For Marathon

This workflow references health and fitness information for educational purposes only. It is not medical advice. Consult a qualified healthcare provider before starting any fitness or nutrition program.

**Estimated time:** 16-24 weeks

This workflow takes you from your current running level through a structured
marathon training plan covering six phases: base building, progressive training,
peak weeks, taper, race day, and recovery. Whether this is your first marathon
or you are chasing a personal record, the workflow adapts to your experience
and goals.

Marathon training is a months-long commitment that demands consistency in
running, nutrition, sleep, and injury prevention. This workflow ensures none
of those pillars is neglected.

By the end of this workflow you will have: a solid aerobic base, a progressive
training plan, a fueling strategy tested in training, a taper plan, a race
day execution strategy, and a recovery protocol.

> **DISCLAIMER**: This workflow provides general fitness guidance for
> educational purposes. It is not medical advice. Consult a physician before
> beginning a marathon training program, especially if you have cardiovascular
> conditions, joint issues, or have been sedentary. Stop running if you
> experience chest pain, dizziness, or unusual joint pain and seek medical
> attention.

## When to Use

- User wants to train for marathon
- User needs a structured, step-by-step process for train for marathon
- User wants to run a marathon
- User wants to train for a marathon
- marathon training plan
- Do NOT use when: the request is outside the scope of train for marathon or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Ability to run at least 3-5 miles continuously (or willingness to build to this first)
- 4-6 days per week available for training (including one long run day)
- A target marathon event with at least 16 weeks lead time (20+ weeks preferred)
- Running shoes properly fitted (visit a specialty running store)
- Willingness to follow a plan and not skip steps

## Steps

**Step 1: Build Your Aerobic Base** (uses: running-coach)

build the aerobic foundation that all marathon
training depends on. Skipping this phase is the most common training mistake.

- Input: Current running ability (weekly mileage, longest recent run, pace), Running history and experience level, Any current or past injuries
- Output: Current fitness level and running ability, Target finish time or completion goal with rationale, Weekly mileage progression to build aerobic base
- Key focus: Current fitness assessment (recent mileage, longest run, easy pace)

**Step 2: Progressive Training** (uses: workout-planner)

design the main training block with
structured workouts that build marathon-specific fitness.

- Input: `base-assessment` from Step 1 (current running level), `marathon-goal` from Step 1 (goal determines workout intensities), `base-building-plan` from Step 1 (current weekly mileage)
- Output: Week-by-week training schedule with all workouts detailed, Descriptions of each workout type with pacing guidance, Long run distances and goals week by week
- Key focus: Weekly structure: easy runs, one quality workout, one long run, rest/cross-training

**Step 3: Fuel Your Training** (uses: sports-nutrition)

build a nutrition and hydration strategy
that fuels training and is tested before race day.

- Input: `marathon-goal` from Step 1 (pace determines calorie burn rate), `training-plan` from Step 2 (volume determines calorie needs), current eating habits and any dietary restrictions
- Output: Daily nutrition targets adjusted for training phases, During-run fueling strategy tested in long runs, Daily and during-run hydration targets
- Key focus: Daily calorie needs adjusted for training volume (do not under-eat during training)

**Step 4: Taper and Prepare** (uses: running-coach)

execute a proper taper and prepare mentally
and logistically for race day.

- Input: `training-plan` from Step 2 (current peak training load), `marathon-goal` from Step 1 (pacing strategy for race day), `fueling-protocol` from Step 3 (race-day nutrition finalized)
- Output: 2-3 week taper schedule with daily workouts, Mile-by-mile pacing and fueling strategy, Travel, accommodation, expo, and morning-of timeline
- Key focus: Taper schedule: reduce volume 20-30% per week for 2-3 weeks pre-race

**Step 5: Race Day Execution** (uses: running-coach)

guide race-day execution. The race is the
culmination of months of training. Execute the plan, adapt to conditions,
and finish strong.

- Input: `race-day-plan` from Step 4 (pacing and fueling strategy), `logistics-checklist` from Step 4 (morning timeline), `mental-prep` from Step 4 (coping strategies for tough moments)
- Output: Actual splits, fueling, and notes per segment, What went well, what to improve, emotional experience, Official finish time, placement, and splits
- Key focus: Morning execution: follow the timeline exactly, eat the practiced meal

**Step 6: Recovery and What is Next** (uses: injury-rehab)

guide proper post-marathon recovery. Most
runners underestimate recovery time and return too soon.

- Input: `race-execution-log` from Step 5 (how the body performed), `race-reflections` from Step 5 (lessons learned), Any injuries or pain from the race
- Output: Day-by-day recovery protocol for the first 4 weeks, Complete analysis of training and race execution, Post-race physical status and any issues to address
- Key focus: Immediate post-race: walk, eat, hydrate, stretch gently, ice if needed

## Decision Points

- **After Step 1:** What is your current running experience?
  - If **Beginner (running < 6 months)**: Extend base building to 8+ weeks. Target 20-24 week total plan. Run-walk strategy for the race is valid.
  - If **Intermediate (regular runner, no marathon)**: Standard base building of 4-6 weeks. 16-20 week plan. Focus on long run development.
  - If **Experienced (previous marathon finisher)**: May skip base building if currently running 25+ miles per week. Focus on quality workouts and pacing.
- **After Step 1:** What is your primary marathon goal?
  - If **Just finish (first marathon)**: Conservative approach. Run-walk is valid. Focus on completion, not time.
  - If **Finish under a specific time**: Pace-specific training with tempo runs and marathon pace work. Requires honest fitness assessment.
  - If **Personal record / Boston qualification**: Aggressive training with targeted quality sessions. Requires strong base and injury resilience.

## Failure Handling

- **Starting too fast on race day:** The number one marathon mistake. If the first 5K feels easy, you are on pace. If it feels fast, you are going too fast.
- **Skipping the base:** Jumping into a training plan without adequate base mileage leads to injury.
- **Running every run hard:** 80% of runs should be easy (conversational pace). Hard days need easy days to recover.
- **Ignoring nutrition in training:** If you have not practiced your fueling strategy on long runs, race day is not the time to figure it out.
- **Increasing mileage too fast:** The 10% rule exists for a reason. Sudden jumps cause injury.

## Expected Outcome

When this workflow is complete, the user will have:

1. The marathon is completed (this is success, regardless of time)
2. Training plan was followed with 85%+ adherence
3. No serious injuries during training or race
4. Nutrition was tested in training and executed on race day
5. Negative or even splits on race day (not positive splits from starting too fast)
6. The user feels proud of the accomplishment and ready for the next challenge
7. A proper recovery period is taken before returning to full training

## Output Format

```
TRAIN FOR MARATHON TRACKER
==========================

[ ] Step 1: Build Your Aerobic Base
    Status: [pending/in-progress/complete]
[ ] Step 2: Progressive Training
    Status: [pending/in-progress/complete]
[ ] Step 3: Fuel Your Training
    Status: [pending/in-progress/complete]
[ ] Step 4: Taper and Prepare
    Status: [pending/in-progress/complete]
[ ] Step 5: Race Day Execution
    Status: [pending/in-progress/complete]
[ ] Step 6: Recovery and What is Next
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Starting too fast on race day:** The number one marathon mistake. If the first 5K feels easy, you are on pace. If it feels fast, you are going too fast.
- **Skipping the base:** Jumping into a training plan without adequate base mileage leads to injury.
- **Running every run hard:** 80% of runs should be easy (conversational pace). Hard days need easy days to recover.
- **Ignoring nutrition in training:** If you have not practiced your fueling strategy on long runs, race day is not the time to figure it out.

## Example

**Input:** "I want to train for marathon and need a structured plan to follow step by step."

**Output:**

**Step 1 (running-coach):** Build Your Aerobic Base -- produces concrete deliverables for this phase.

**Step 2 (workout-planner):** Progressive Training -- produces concrete deliverables for this phase.

**Step 3 (sports-nutrition):** Fuel Your Training -- produces concrete deliverables for this phase.

**Step 4 (running-coach):** Taper and Prepare -- produces concrete deliverables for this phase.

**Step 5 (running-coach):** Race Day Execution -- produces concrete deliverables for this phase.

**Step 6 (injury-rehab):** Recovery and What is Next -- produces concrete deliverables for this phase.

**Result:** User has a complete train for marathon plan with all deliverables produced, validated, and ready for implementation.
