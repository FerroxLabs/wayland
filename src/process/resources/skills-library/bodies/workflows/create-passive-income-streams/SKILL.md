---
name: create-passive-income-streams
description: >-
  Guided workflow for building passive and semi-passive income streams from
  initial assessment and skill matching through building, automating,
  diversifying, and optimizing income-generating assets. Covers digital
  products, investments, and automated business models.

  Use when the user wants to create passive income streams or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "side-hustle-advisor digital-product-creator content-monetizer investment-advisor budget-builder"
trigger_phrases: >-
  I want to create passive income help me build passive income streams how to
  make money while I sleep build income-generating assets diversify my income
  create multiple income streams
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: investing entrepreneurship personal-finance automation step-by-step planning
  category: business-operations
  depends: "side-hustle-advisor digital-product-creator content-monetizer investment-advisor budget-builder"
---
# Create Passive Income Streams

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 8-16 weeks

True passive income requires significant upfront investment of time, money,
or both. This workflow is honest about that reality while guiding you through
the systematic process of identifying, building, automating, diversifying,
and optimizing income streams that eventually require minimal ongoing effort.

The workflow covers three categories of passive income: digital products
(courses, templates, ebooks), investment income (dividends, interest, real
estate), and automated business models (affiliate marketing, content
monetization). You will start with one stream, prove it works, then expand.

By the end of this workflow you will have: an assessment of your best
opportunities, at least one income stream built and generating revenue,
automation in place to reduce ongoing effort, and a diversification plan.

## When to Use

- User wants to create passive income streams
- User needs a structured, step-by-step process for create passive income streams
- User wants to create passive income
- User wants to build passive income streams
- how to make money while I sleep
- Do NOT use when: the request is outside the scope of create passive income streams or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A primary income source (do not quit your job to build passive income)
- Some capital to invest (even small amounts) or time to create digital assets
- Skills or knowledge that others would pay to learn
- Realistic expectations (most streams take 6-12 months to generate meaningful income)
- Willingness to invest significant upfront effort before seeing returns

## Steps

**Step 1: Assess Your Opportunities** (uses: side-hustle-advisor)

identify the highest-potential passive
income opportunities based on your specific situation.

- Input: skills, expertise, and professional background, Available time per week for building income streams, Available capital for investment-based income
- Output: Ranked list of 3-5 income stream options with scores, How existing skills translate to income opportunities, The chosen first income stream with rationale
- Key focus: Skills and knowledge inventory (what do you know that others need?)

**Step 2: Build Your First Stream** (uses: digital-product-creator)

Use the Digital Product Creator skill (or the appropriate skill for the
chosen income stream type) to build the first income-generating asset.

- Input: `first-stream-selection` from Step 1 (what to build), `skills-to-income-map` from Step 1 (expertise to package), `resource-inventory` from Step 1 (available time and capital)
- Output: The built product, portfolio, or automated system, Price points and any tiered options, Where and how the asset generates revenue
- Key focus: Minimum viable product definition (smallest version that generates revenue)

**Step 3: Automate for Passivity** (uses: content-monetizer)

maximize automation and reduce ongoing
time investment. The goal is to reduce your involvement to under 2 hours
per week per stream.

- Input: `income-asset` from Step 2 (what to automate), `distribution-setup` from Step 2 (existing systems), `launch-results` from Step 2 (what is working)
- Output: All automated processes with tools and triggers, Tasks that require human attention with SOPs, Key metrics and alert thresholds
- Key focus: Marketing automation (email sequences, social scheduling, SEO)

**Step 4: Diversify Your Streams** (uses: investment-advisor)

diversify income across multiple streams
and asset classes. The principle is: never depend on one income source.

- Input: `opportunity-assessment` from Step 1 (other options to pursue), `launch-results` from Step 2 (proven first stream), `automation-map` from Step 3 (time freed up for new streams)
- Output: 3-5 income streams with target allocations, Investment allocation across asset classes, Sequenced plan for building streams 2, 3, and beyond
- Key focus: Evaluating which second and third streams to build

**Step 5: Optimize and Scale** (uses: budget-builder)

optimize the income portfolio for maximum
returns with minimum effort.

- Input: `portfolio-dashboard` from Step 4 (current performance), `diversification-plan` from Step 4 (target allocations), `time-audit` from Step 3 (time efficiency)
- Output: ROI analysis of each income stream, Specific actions to improve underperformers, Which streams to invest more time or capital into
- Key focus: Performance review of each income stream (ROI on time and capital)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Shiny object syndrome:** Focus on one stream until it works before starting another. Spreading thin across five streams means none succeeds.
- **Expecting truly passive from day one:** Every stream requires significant upfront work. "Passive" describes the maintenance phase, not the build phase.
- **Ignoring the math:** Calculate your effective hourly rate for each stream. Some "passive" income pays less than minimum wage when you account for build time.
- **No automation mindset:** If you are still manually processing orders after 6 months, you have not built passive income -- you have built a job.
- **Over-investing before validating:** Test with minimal investment first. Scale what works, kill what does not.

## Expected Outcome

When this workflow is complete, the user will have:

1. At least one income stream generates revenue with under 2 hours per week of effort
2. Income streams are diversified across at least 2-3 categories
3. Automation reduces ongoing time investment to sustainable levels
4. Total passive income grows quarterly through optimization and reinvestment
5. A clear financial projection shows the path to meaningful income replacement
6. Tax strategy is optimized for multiple income types

## Output Format

```
CREATE PASSIVE INCOME STREAMS TRACKER
=====================================

[ ] Step 1: Assess Your Opportunities
    Status: [pending/in-progress/complete]
[ ] Step 2: Build Your First Stream
    Status: [pending/in-progress/complete]
[ ] Step 3: Automate for Passivity
    Status: [pending/in-progress/complete]
[ ] Step 4: Diversify Your Streams
    Status: [pending/in-progress/complete]
[ ] Step 5: Optimize and Scale
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Shiny object syndrome:** Focus on one stream until it works before starting another. Spreading thin across five streams means none succeeds.
- **Expecting truly passive from day one:** Every stream requires significant upfront work. "Passive" describes the maintenance phase, not the build phase.
- **Ignoring the math:** Calculate your effective hourly rate for each stream. Some "passive" income pays less than minimum wage when you account for build time.
- **No automation mindset:** If you are still manually processing orders after 6 months, you have not built passive income -- you have built a job.


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

**Input:** "I want to create passive income streams and need a structured plan to follow step by step."

**Output:**

**Step 1 (side-hustle-advisor):** Assess Your Opportunities -- produces concrete deliverables for this phase.

**Step 2 (digital-product-creator):** Build Your First Stream -- produces concrete deliverables for this phase.

**Step 3 (content-monetizer):** Automate for Passivity -- produces concrete deliverables for this phase.

**Step 4 (investment-advisor):** Diversify Your Streams -- produces concrete deliverables for this phase.

**Step 5 (budget-builder):** Optimize and Scale -- produces concrete deliverables for this phase.

**Result:** User has a complete create passive income streams plan with all deliverables produced, validated, and ready for implementation.
