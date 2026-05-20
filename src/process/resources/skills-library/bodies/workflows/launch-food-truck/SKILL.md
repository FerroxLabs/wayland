---
name: launch-food-truck
description: >-
  Complete food truck business launch workflow from operations planning and
  business structure through menu development, pricing strategy, social media
  marketing, and financial management for aspiring mobile food entrepreneurs.

  Use when the user wants to launch food truck or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "food-truck-operator business-planner pricing-strategist social-media-strategist budget-builder"
trigger_phrases: >-
  I want to start a food truck help me launch a food truck food truck business
  plan how to start a mobile food business food truck guide open a food truck
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: entrepreneurship step-by-step planning
  category: business-operations
  depends: "food-truck-operator business-planner pricing-strategist social-media-strategist budget-builder"
---
# Launch Food Truck

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 6-12 weeks

This workflow guides you through launching a food truck business from concept
to opening day and beyond. It combines food truck operational expertise with
business planning, pricing, marketing, and financial management skills to build
a sustainable mobile food business.

Food trucks are unique businesses that blend culinary skill with logistics,
marketing, and operations. This workflow covers the specific challenges of
mobile food service including permits, routes, events, commissary kitchens,
and the seasonal nature of the business.

By the end of this workflow you will have: a complete operational plan, a
business structure, a designed menu with pricing, a social media presence, and
a financial management system to keep the business profitable.

## When to Use

- User wants to launch food truck
- User needs a structured, step-by-step process for launch food truck
- User wants to start a food truck
- User wants to launch a food truck
- food truck business plan
- Do NOT use when: the request is outside the scope of launch food truck or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A food concept or cuisine type in mind
- Basic cooking skills and food safety knowledge (or willingness to learn)
- Starting capital of $50,000-$200,000 (or a funding plan)
- A valid driver's license
- Willingness to work long, physically demanding hours

## Steps

**Step 1: Plan Food Truck Operations** (uses: food-truck-operator)

establish the operational foundation.
This is the most food-truck-specific step.

- Input: food concept and cuisine type, Their available starting capital, Their target market and geographic area
- Output: Complete food truck operations manual, All required permits, licenses, and inspections with costs, Truck selection criteria, equipment list, and layout plan
- Key focus: Researching local permits, licenses, and health department requirements

**Step 2: Build the Business Plan** (uses: business-planner)

create a comprehensive business plan
tailored to the food truck model.

- Input: `operations-plan` from Step 1 (operational costs and logistics), `permit-checklist` from Step 1 (startup cost items), `truck-specs` from Step 1 (capital equipment costs)
- Output: Complete food truck business plan, Itemized startup costs with total investment needed, Monthly revenue projections for the first year
- Key focus: Business Model Canvas adapted for food trucks

**Step 3: Set Menu Pricing** (uses: pricing-strategist)

Use the Pricing Strategist skill adapted for food truck pricing.

- Input: `menu-design` from Step 1 (items to price), `business-plan` from Step 2 (cost structure and revenue targets), `revenue-projections` from Step 2 (targets to hit)
- Output: Complete menu with prices, food costs, and margins, Combo and meal deal options with pricing, Premium pricing structure for events and catering
- Key focus: Food cost percentage analysis (target 25-35% food cost per item)

**Step 4: Launch Social Media Marketing** (uses: social-media-strategist)

Use the Social Media Strategist skill adapted for food truck marketing. Food
trucks live and die by their social media presence.

- Input: `operations-plan` from Step 1 (locations and schedule to promote), `business-plan` from Step 2 (target customers and brand), `menu-pricing` from Step 3 (menu items and prices to feature)
- Output: Platform strategy, content pillars, and posting schedule, First 30 days of food truck social content, Tips for consistent, appetizing food photography
- Key focus: Instagram as the primary platform (food photography is king)

**Step 5: Manage Finances** (uses: budget-builder)

Use the Budget Builder skill adapted for food truck financial management.

- Input: `startup-budget` from Step 2 (costs to track), `revenue-projections` from Step 2 (targets to measure against), `menu-pricing` from Step 3 (revenue per sale)
- Output: Daily, weekly, and monthly financial tracking procedures, Food truck-specific expense tracking categories, Sales tax, income tax, and quarterly payment schedule
- Key focus: Daily sales tracking system (cash, card, mobile payments)

## Decision Points

- **After Step 1:** How will you acquire your food truck?
  - If **Buy a new custom-built truck**: Highest cost ($75K-200K) but everything is new and to spec. Longest lead time (3-6 months for build).
  - If **Buy a used food truck**: Lower cost ($30K-80K) but may need modifications. Inspect thoroughly before purchase.
  - If **Lease a food truck**: Lowest upfront cost. Good for testing the concept before committing. Monthly payments affect operating budget.
  - If **Build out a trailer**: Can be more affordable ($20K-50K). Requires a tow vehicle. Different permit requirements in some areas.

## Failure Handling

- **Underestimating permit complexity:** Start the permit process early. It can take weeks or months.
- **Too many menu items:** Start with 6-10 items maximum. Simplify until you have speed of service dialed in.
- **Ignoring food cost tracking:** Track food costs weekly. Small leaks in food cost destroy profitability.
- **Relying on one location:** Diversify locations. A great spot can disappear due to construction, permits, or competition.
- **Skipping social media:** Food trucks depend on social media more than almost any other business. Post daily.

## Expected Outcome

When this workflow is complete, the user will have:

1. All permits and licenses are obtained
2. Food truck is operational with a tested menu
3. Pricing covers food costs and operating expenses with a healthy margin
4. Social media is active and driving customers to the truck
5. Financial tracking systems are in place and being used daily
6. The truck has completed at least one week of service
7. Daily sales are trending toward the break-even target

## Output Format

```
LAUNCH FOOD TRUCK TRACKER
=========================

[ ] Step 1: Plan Food Truck Operations
    Status: [pending/in-progress/complete]
[ ] Step 2: Build the Business Plan
    Status: [pending/in-progress/complete]
[ ] Step 3: Set Menu Pricing
    Status: [pending/in-progress/complete]
[ ] Step 4: Launch Social Media Marketing
    Status: [pending/in-progress/complete]
[ ] Step 5: Manage Finances
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Underestimating permit complexity:** Start the permit process early. It can take weeks or months.
- **Too many menu items:** Start with 6-10 items maximum. Simplify until you have speed of service dialed in.
- **Ignoring food cost tracking:** Track food costs weekly. Small leaks in food cost destroy profitability.
- **Relying on one location:** Diversify locations. A great spot can disappear due to construction, permits, or competition.


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

**Input:** "I want to launch food truck and need a structured plan to follow step by step."

**Output:**

**Step 1 (food-truck-operator):** Plan Food Truck Operations -- produces concrete deliverables for this phase.

**Step 2 (business-planner):** Build the Business Plan -- produces concrete deliverables for this phase.

**Step 3 (pricing-strategist):** Set Menu Pricing -- produces concrete deliverables for this phase.

**Step 4 (social-media-strategist):** Launch Social Media Marketing -- produces concrete deliverables for this phase.

**Step 5 (budget-builder):** Manage Finances -- produces concrete deliverables for this phase.

**Result:** User has a complete launch food truck plan with all deliverables produced, validated, and ready for implementation.
