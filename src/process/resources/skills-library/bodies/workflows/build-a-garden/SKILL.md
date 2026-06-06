---
name: build-a-garden
description: >-
  Complete home gardening workflow from planning and site assessment through
  soil preparation, planting, ongoing maintenance, and harvesting for a
  productive and enjoyable garden in any space.

  Use when the user wants to build a garden or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "garden-advisor diy-planner habit-tracker"
trigger_phrases: >-
  I want to start a garden help me build a garden home vegetable garden how to
  start gardening backyard garden plan container gardening guide
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: gardening hiking home-maintenance step-by-step planning
  category: life-event
  depends: "garden-advisor diy-planner habit-tracker"
  disclaimer: none
  difficulty: beginner
---
# Build A Garden

**Estimated time:** 4-8 weeks setup, ongoing seasonal

This workflow takes you from an empty space to a thriving garden, whether you
have a large backyard, a small patio, or just a sunny windowsill. Gardening
fails most often not from lack of green thumbs but from lack of planning:
wrong plants for the conditions, poor soil preparation, and inconsistent care.

The five phases build a garden that works with your space, climate, and
available time: plan first, then prepare the site, plant strategically,
maintain consistently, and harvest your rewards.

By the end of this workflow you will have: a garden plan matched to your
space and goals, prepared soil and infrastructure, planted crops or
ornamentals, a maintenance routine, and the knowledge to harvest and plan
the next season.

## When to Use

- User wants to build a garden
- User needs a structured, step-by-step process for build a garden
- User wants to start a garden
- User wants to build a garden
- home vegetable garden
- Do NOT use when: the request is outside the scope of build a garden or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Access to outdoor or indoor space with sunlight (minimum 6 hours for most vegetables)
- Basic tools or willingness to acquire them (trowel, watering can, gloves at minimum)
- Commitment of 2-5 hours per week for garden maintenance
- Patience (gardens grow on nature's timeline, not yours)
- Landlord permission if renting (for in-ground or raised bed gardens)

## Steps

**Step 1: Plan Your Garden** (uses: garden-advisor)

design a garden plan before any digging
begins. Planning prevents the most common gardening failures.

- Input: Available space (backyard, patio, balcony, windowsill, community plot), Sunlight analysis (hours of direct sun by area), Climate zone (USDA hardiness zone or local equivalent)
- Output: Layout design with plant placement and spacing, Selected plants with planting dates, spacing, and care needs, Month-by-month planting and harvesting schedule
- Key focus: Site assessment: sun exposure mapping throughout the day

**Step 2: Prepare Your Growing Space** (uses: diy-planner)

build the physical garden infrastructure and
prepare the growing medium. Good soil is the single biggest factor in garden
success.

- Input: `garden-plan` from Step 1 (what to build and where), `materials-budget` from Step 1 (cost constraints), Current state of the garden space (grass, concrete, existing beds)
- Output: Step-by-step site preparation tasks, Soil test results with amendment recommendations, Build plan for beds, irrigation, and paths
- Key focus: Clearing the site (removing grass, weeds, debris)

**Step 3: Plant Your Garden** (uses: garden-advisor)

execute the planting plan with proper
technique.

- Input: `garden-plan` from Step 1 (what goes where), `plant-list` from Step 1 (specific plants and planting dates), `seasonal-calendar` from Step 1 (timing for planting)
- Output: Record of every plant installed with location and date, Indoor seed starting timeline for future plantings, Measures for protecting young plants from weather and pests
- Key focus: Seeds vs. transplants decision for each crop (some start better from seed, others from starts)

**Step 4: Maintain Your Garden** (uses: habit-tracker)

establish a consistent maintenance routine.
Gardens fail from neglect, not from lack of skill.

- Input: `garden-plan` from Step 1 (maintenance needs per plant), `planting-log` from Step 3 (what is growing and where), Weather patterns and seasonal conditions
- Output: Weekly garden maintenance checklist, Plant-by-plant watering needs and frequency, Organic pest prevention and treatment strategies
- Key focus: Watering schedule: deep, less frequent watering beats shallow daily watering

**Step 5: Harvest and Plan Ahead** (uses: garden-advisor)

harvest at peak quality and plan for the next
growing season.

- Input: `planting-log` from Step 3 (what was planted and when), `garden-journal` from Step 4 (what worked and what did not), Harvest readiness signs for each crop
- Output: Ripeness indicators and harvesting technique per crop, Methods for preserving surplus harvest, What worked, what failed, and lessons learned
- Key focus: Harvest timing: signs of ripeness for each crop (color, size, feel, days from planting)

## Decision Points

- **After Step 1:** What type of garden are you building?
  - If **Raised beds**: Best control over soil quality. Good drainage. Easier on the back. Moderate setup cost.
  - If **Container garden**: Best for patios, balconies, and renters. Mobile. Requires more frequent watering.
  - If **In-ground beds**: Most space. Lowest cost. Soil quality depends on what is there. Requires most digging.
  - If **Indoor / windowsill**: Herbs and small plants. Light is the limiting factor. Consider grow lights.
- **After Step 1:** What is your primary garden goal?
  - If **Food production (vegetables, herbs, fruit)**: Focus on productive varieties, succession planting, and harvest timing.
  - If **Ornamental / beauty**: Focus on color, texture, bloom timing, and year-round interest.
  - If **Pollinator / wildlife habitat**: Focus on native plants, bloom succession, and wildlife-friendly practices.
  - If **Mixed (food and beauty)**: Combine edible and ornamental plants. Edible landscaping approach.

## Failure Handling

- **Starting too big:** A small, well-maintained garden outperforms a large, neglected one. Start with a 4x8 bed or 5-6 containers.
- **Ignoring soil:** Most garden problems are actually soil problems. Test the soil. Amend the soil. Feed the soil, not just the plants.
- **Wrong plants for the space:** A plant that needs 8 hours of sun will fail in 4 hours of shade. Match plants to actual conditions.
- **Overwatering:** More plants die from overwatering than underwatering. Check soil moisture before watering.
- **Neglecting weeds:** Weeds compete for water, nutrients, and light. Fifteen minutes of weeding twice a week is easier than a 4-hour weekend battle.

## Expected Outcome

When this workflow is complete, the user will have:

1. The garden produces at least some harvestable food or beautiful blooms
2. Plants survive and grow according to general expectations for the varieties
3. A maintenance routine is established and followed consistently
4. The garden journal captures enough data to improve next season
5. The user enjoys the process and wants to continue gardening
6. Pests and diseases are managed without resorting to harmful chemicals

## Output Format

```
BUILD A GARDEN TRACKER
======================

[ ] Step 1: Plan Your Garden
    Status: [pending/in-progress/complete]
[ ] Step 2: Prepare Your Growing Space
    Status: [pending/in-progress/complete]
[ ] Step 3: Plant Your Garden
    Status: [pending/in-progress/complete]
[ ] Step 4: Maintain Your Garden
    Status: [pending/in-progress/complete]
[ ] Step 5: Harvest and Plan Ahead
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Starting too big:** A small, well-maintained garden outperforms a large, neglected one. Start with a 4x8 bed or 5-6 containers.
- **Ignoring soil:** Most garden problems are actually soil problems. Test the soil. Amend the soil. Feed the soil, not just the plants.
- **Wrong plants for the space:** A plant that needs 8 hours of sun will fail in 4 hours of shade. Match plants to actual conditions.
- **Overwatering:** More plants die from overwatering than underwatering. Check soil moisture before watering.


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

**Input:** "I want to build a garden and need a structured plan to follow step by step."

**Output:**

**Step 1 (garden-advisor):** Plan Your Garden -- produces concrete deliverables for this phase.

**Step 2 (diy-planner):** Prepare Your Growing Space -- produces concrete deliverables for this phase.

**Step 3 (garden-advisor):** Plant Your Garden -- produces concrete deliverables for this phase.

**Step 4 (habit-tracker):** Maintain Your Garden -- produces concrete deliverables for this phase.

**Step 5 (garden-advisor):** Harvest and Plan Ahead -- produces concrete deliverables for this phase.

**Result:** User has a complete build a garden plan with all deliverables produced, validated, and ready for implementation.
