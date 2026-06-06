---
name: start-a-business
description: >-
  Guided business launch workflow from business planning and market research
  through pricing strategy, brand identity, social media presence, and financial
  management for new entrepreneurs starting a service-based or product-based
  business.

  Use when the user wants to start a business or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "business-planner market-researcher pricing-strategist brand-strategist social-media-strategist budget-builder"
trigger_phrases: >-
  I want to start a business help me launch a company new business checklist how
  to start a small business entrepreneur guide business launch plan
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: entrepreneurship planning marketing personal-finance step-by-step
  category: business-operations
  depends: "business-planner market-researcher pricing-strategist brand-strategist social-media-strategist budget-builder"
---
# Start A Business

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 4-8 weeks

This workflow guides a new entrepreneur through the essential steps of launching
a business, from defining the concept and validating the market through pricing,
branding, social media presence, and financial management. It is designed for
solo founders and small teams starting either a service-based or product-based
business.

This workflow focuses on business fundamentals. If you are building a software
product specifically, complete this workflow for business foundations, then
follow the "Launch a SaaS Product" workflow for technical execution.

By the end of this workflow you will have: a comprehensive business plan, market
validation, a pricing strategy, a brand identity, a social media presence, and
a financial management system.

## When to Use

- User wants to start a business
- User needs a structured, step-by-step process for start a business
- User wants to start a business
- User wants to launch a company
- new business checklist
- Do NOT use when: the request is outside the scope of start a business or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A business idea (product or service)
- Willingness to invest 10-20 hours per week in launch preparation
- Access to basic financial information (personal expenses, startup costs)
- No prior business experience required (the workflow teaches as it guides)

## Steps

**Step 1: Create Your Business Plan** (uses: business-planner)

create a comprehensive business plan.

- Input: business idea (even if rough), Their current situation (full-time job, savings, family commitments), Their motivation and long-term vision
- Output: Complete business plan with Business Model Canvas, Clear statement of what you offer and why it matters, Revenue and cost projections for 12 months
- Key focus: Building a Business Model Canvas to visualize the entire business model

**Step 2: Research Your Market** (uses: market-researcher)

validate the business concept with real data.

- Input: `business-plan` from Step 1 (customer segments and competitors to research), `value-proposition` from Step 1 (hypothesis to validate)
- Output: TAM/SAM/SOM with market sizing methodology, Detailed personas using Jobs-to-be-Done framework, Competitor analysis with positioning map
- Key focus: TAM/SAM/SOM analysis (total, serviceable, and obtainable market)

**Step 3: Set Your Pricing** (uses: pricing-strategist)

develop a pricing strategy that balances
value capture with market competitiveness.

- Input: `business-plan` from Step 1 (cost structure and revenue targets), `competitive-landscape` from Step 2 (competitor pricing benchmarks), `validation-results` from Step 2 (willingness to pay data)
- Output: Pricing model, price points, and tier structure, CAC, LTV, and margin analysis, Pricing presentation and communication plan
- Key focus: Choosing a pricing model (cost-plus, value-based, competitive, tiered, freemium)

**Step 4: Build Your Brand** (uses: brand-strategist)

create a cohesive brand identity.

- Input: `business-plan` from Step 1 (business vision and values), `customer-personas` from Step 2 (who the brand speaks to), `competitive-landscape` from Step 2 (differentiation opportunities)
- Output: Purpose, mission, values, positioning, and personality, Brand voice, tone, and messaging guidelines, Color palette, typography, and visual style specifications
- Key focus: Defining brand purpose, mission, and values

**Step 5: Launch Your Social Media Presence** (uses: social-media-strategist)

establish a strategic social media
presence.

- Input: `brand-identity` from Step 4 (brand voice and visual identity), `customer-personas` from Step 2 (where customers spend time online), `go-to-market` from Step 1 (acquisition channels)
- Output: Platform selection, content pillars, and posting cadence, First 30 days of content across all platforms, Community management and engagement tactics
- Key focus: Platform selection based on where target customers actually spend time

**Step 6: Set Up Financial Management** (uses: budget-builder)

Use the Budget Builder skill adapted for business finances. Create both
personal and business budgets:

- Input: `financial-projections` from Step 1 (revenue and cost forecasts), `pricing-strategy` from Step 3 (revenue per unit), `unit-economics` from Step 3 (CAC, LTV, margins)
- Output: Personal financial plan for the startup period, Startup costs and monthly operating budget, Month-by-month cash flow for 12 months
- Key focus: Use the Budget Builder skill adapted for business finances

## Decision Points

- **After Step 1:** What type of business are you starting?
  - If **Service-based (consulting, freelancing, agency)**: All steps are relevant. Pricing strategy will focus on service pricing (hourly, project, retainer).
  - If **Product-based (e-commerce, physical goods)**: Pricing focuses on product margins and inventory management.
  - If **SaaS or digital product**: After completing this workflow, follow up with "Launch a SaaS Product" for technical execution.
  - If **Local brick-and-mortar**: Additional considerations: location, lease, permits. Social media focuses on local marketing.
- **After Step 2:** How will you fund this business?
  - If **Bootstrapped (self-funded)**: Conservative pricing to reach profitability fast. Budget focuses on minimal viable spend.
  - If **Seeking investment**: Pricing can prioritize growth over immediate profitability. Include pitch deck preparation.
  - If **Side project (keeping day job)**: Adjust time commitments throughout. Everything takes longer but is lower risk.

## Failure Handling

- **Analysis paralysis in Step 1:** Planning is not doing. Set a 1-2 week hard limit on the business plan.
- **Skipping market research:** Assumptions are not validation. Talk to actual potential customers.
- **Pricing too low:** New entrepreneurs consistently underprice. Value-based pricing captures more value.
- **Generic branding:** A brand that tries to appeal to everyone appeals to no one. Be specific.
- **Being on every social platform:** Pick 1-2 platforms and do them well. Spreading thin leads to burnout.

## Expected Outcome

When this workflow is complete, the user will have:

1. A comprehensive business plan exists with validated assumptions
2. Market research confirms demand and willingness to pay
3. Pricing is set and covers costs with a path to profitability
4. A brand identity is established and consistent across touchpoints
5. Social media presence is active and generating awareness
6. Financial systems are in place to track revenue, expenses, and cash flow
7. The first customer or concrete lead has been secured

## Output Format

```
START A BUSINESS TRACKER
========================

[ ] Step 1: Create Your Business Plan
    Status: [pending/in-progress/complete]
[ ] Step 2: Research Your Market
    Status: [pending/in-progress/complete]
[ ] Step 3: Set Your Pricing
    Status: [pending/in-progress/complete]
[ ] Step 4: Build Your Brand
    Status: [pending/in-progress/complete]
[ ] Step 5: Launch Your Social Media Presence
    Status: [pending/in-progress/complete]
[ ] Step 6: Set Up Financial Management
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Analysis paralysis in Step 1:** Planning is not doing. Set a 1-2 week hard limit on the business plan.
- **Skipping market research:** Assumptions are not validation. Talk to actual potential customers.
- **Pricing too low:** New entrepreneurs consistently underprice. Value-based pricing captures more value.
- **Generic branding:** A brand that tries to appeal to everyone appeals to no one. Be specific.

## Example

**Input:** "I want to start a business and need a structured plan to follow step by step."

**Output:**

**Step 1 (business-planner):** Create Your Business Plan -- produces concrete deliverables for this phase.

**Step 2 (market-researcher):** Research Your Market -- produces concrete deliverables for this phase.

**Step 3 (pricing-strategist):** Set Your Pricing -- produces concrete deliverables for this phase.

**Step 4 (brand-strategist):** Build Your Brand -- produces concrete deliverables for this phase.

**Step 5 (social-media-strategist):** Launch Your Social Media Presence -- produces concrete deliverables for this phase.

**Step 6 (budget-builder):** Set Up Financial Management -- produces concrete deliverables for this phase.

**Result:** User has a complete start a business plan with all deliverables produced, validated, and ready for implementation.
