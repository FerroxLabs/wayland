---
name: renovate-and-sell-house
description: >-
  Complete house flipping workflow from property acquisition and renovation
  scope assessment through renovation planning, interior design staging,
  professional photography, and strategic selling for maximum return on
  investment in residential property flipping.

  Use when the user wants to renovate and sell house or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  house-flipper home-renovation-planner interior-designer photography-guide
  home-seller
trigger_phrases: >-
  I want to flip a house help me renovate and sell house flipping guide how to
  flip houses buy fix and sell a property renovate to sell investment property
  renovation
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: home-buying step-by-step planning
  category: cross-domain
  depends: >-
    house-flipper home-renovation-planner interior-designer photography-guide
    home-seller
  disclaimer: none
  difficulty: advanced
---
# Renovate And Sell House

**Estimated time:** 3-6 months

This workflow guides you through the complete process of buying, renovating,
and selling a house for profit. It covers property analysis and acquisition
strategy, renovation planning and execution, interior design for maximum
buyer appeal, professional-quality photography, and strategic selling
for the best possible return on investment.

House flipping requires a disciplined approach to numbers, timelines, and
decision-making. Every dollar spent on renovation must return more than a
dollar in sale price. This workflow ensures you make data-driven decisions
rather than emotional ones.

By the end of this workflow you will have: a property acquisition strategy,
a renovation plan with ROI analysis, a staged interior that appeals to
buyers, professional listing photography, and a selling strategy that
maximizes your profit.

## When to Use

- User wants to renovate and sell house
- User needs a structured, step-by-step process for renovate and sell house
- User wants to flip a house
- User wants to renovate and sell
- house flipping guide
- Do NOT use when: the request is outside the scope of renovate and sell house or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- Capital for property purchase and renovation (cash or financing)
- Understanding of your local real estate market
- Willingness to manage contractors and timelines
- Basic knowledge of real estate transactions (or a good agent)
- Risk tolerance (flipping is a business, and businesses can lose money)

## Steps

**Step 1: Analyze and Acquire the Property** (uses: house-flipper)

evaluate and acquire a property with
strong flip potential.

- Input: available capital and financing options, Their target market and geographic area, Their experience level with renovations and real estate
- Output: ARV calculation, purchase analysis, and profit projection, Search criteria, funding approach, and offer strategy, High-level scope assessment (cosmetic, moderate, or gut rehab)
- Key focus: The 70% rule for maximum purchase price (ARV x 70% - repair costs)

**Step 2: Plan the Renovation** (uses: home-renovation-planner)

create a detailed renovation plan
that maximizes ROI. Not all renovations add equal value.

- Input: `property-analysis` from Step 1 (property condition and ARV), `renovation-scope` from Step 1 (overall scope assessment), `flip-budget` from Step 1 (renovation budget constraints)
- Output: Detailed project list with scope, sequence, and timeline, Line-item budget with bids and material costs, Contractor assignments with start and completion dates
- Key focus: Prioritizing renovations by ROI (kitchen and bathrooms first, always)

**Step 3: Design the Interior for Buyers** (uses: interior-designer)

make design decisions that appeal to the
broadest buyer pool and maximize perceived value.

- Input: `renovation-plan` from Step 2 (what is being renovated), `property-analysis` from Step 1 (target buyer profile based on ARV and neighborhood), `flip-budget` from Step 1 (staging and design budget)
- Output: Complete interior design selections for renovated spaces, All finishes (paint colors, tile, countertops, fixtures) with specs, Furniture placement and staging elements for showings
- Key focus: Color palette selection (neutral, modern, appealing to the target market)

**Step 4: Photograph the Property** (uses: photography-guide)

create listing photography that sells.
In real estate, photos are the first showing.

- Input: `design-plan` from Step 3 (completed renovations to photograph), `staging-plan` from Step 3 (staged spaces ready for photography), `property-analysis` from Step 1 (listing positioning and target buyer)
- Output: Professional-quality photos of all rooms and exterior, Editing workflow for consistent, appealing results, Strategic ordering of photos for the listing
- Key focus: Preparing each room for photography (declutter, style, light)

**Step 5: Sell the Property** (uses: home-seller)

execute the sale for maximum price.

- Input: `property-analysis` from Step 1 (ARV and target sale price), `listing-photos` from Step 4 (photos for the listing), `renovation-plan` from Step 2 (renovation details for listing description)
- Output: Pricing, positioning, and marketing plan for the listing, Compelling property description highlighting renovations, Framework for comparing and evaluating offers
- Key focus: Pricing strategy using updated comparable market analysis

## Decision Points

- **After Step 1:** What level of renovation does this property need?
  - If **Cosmetic flip (paint, flooring, fixtures)**: Fastest timeline (4-6 weeks). Lowest risk. Lower profit margin per flip but faster turnover.
  - If **Moderate renovation (kitchen, bath, some structural)**: Standard flip timeline (2-4 months). Permits likely needed. Higher profit potential.
  - If **Full gut rehab (everything down to studs)**: Longest timeline (4-6 months). Highest risk and highest potential reward. Experienced contractors essential.
- **After Step 4:** How will you sell the property?
  - If **List with a real estate agent**: Agent handles marketing, showings, and negotiation. Commission is 2.5-3% but often worth it for maximum exposure.
  - If **For Sale By Owner (FSBO)**: Save on commission. You handle all marketing, showings, and negotiation. Works best in hot markets.
  - If **Wholesale to another investor**: Fastest exit. Lower profit but no holding costs. Good if the renovation reveals bigger problems than expected.

## Failure Handling

- **Paying too much for the property:** The 70% rule exists for a reason. Violating it is the number one cause of flip losses.
- **Underestimating renovation costs:** Always add 15-20% contingency. Surprises are guaranteed.
- **Over-improving for the neighborhood:** Do not install luxury finishes in a starter home neighborhood. Match the comps.
- **Holding too long:** Carrying costs (mortgage, insurance, taxes, utilities) eat into profit every month. Speed matters.
- **Designing for personal taste:** Design for the buyer, not for yourself. Neutral appeals to the broadest market.

## Expected Outcome

When this workflow is complete, the user will have:

1. Property is acquired at or below the 70% rule target price
2. Renovations are completed on time and within budget
3. Interior design appeals to the target buyer profile
4. Listing photos are professional and showcase the renovation quality
5. The property sells within 30 days of listing (market-dependent)
6. Net profit meets or exceeds the target after all costs
7. A retrospective captures lessons for improving the next flip

## Output Format

```
RENOVATE AND SELL HOUSE TRACKER
===============================

[ ] Step 1: Analyze and Acquire the Property
    Status: [pending/in-progress/complete]
[ ] Step 2: Plan the Renovation
    Status: [pending/in-progress/complete]
[ ] Step 3: Design the Interior for Buyers
    Status: [pending/in-progress/complete]
[ ] Step 4: Photograph the Property
    Status: [pending/in-progress/complete]
[ ] Step 5: Sell the Property
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Paying too much for the property:** The 70% rule exists for a reason. Violating it is the number one cause of flip losses.
- **Underestimating renovation costs:** Always add 15-20% contingency. Surprises are guaranteed.
- **Over-improving for the neighborhood:** Do not install luxury finishes in a starter home neighborhood. Match the comps.
- **Holding too long:** Carrying costs (mortgage, insurance, taxes, utilities) eat into profit every month. Speed matters.

## Example

**Input:** "I want to renovate and sell house and need a structured plan to follow step by step."

**Output:**

**Step 1 (house-flipper):** Analyze and Acquire the Property -- produces concrete deliverables for this phase.

**Step 2 (home-renovation-planner):** Plan the Renovation -- produces concrete deliverables for this phase.

**Step 3 (interior-designer):** Design the Interior for Buyers -- produces concrete deliverables for this phase.

**Step 4 (photography-guide):** Photograph the Property -- produces concrete deliverables for this phase.

**Step 5 (home-seller):** Sell the Property -- produces concrete deliverables for this phase.

**Result:** User has a complete renovate and sell house plan with all deliverables produced, validated, and ready for implementation.
