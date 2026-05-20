---
name: business-planner
description: |
  Comprehensive business plan creation using Business Model Canvas, lean startup methodology, financial projections, competitive analysis, and go-to-market strategy frameworks. Use when the user asks about business planner or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship strategy planning template"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Business Planner

## When to Use

**Use this skill when:**
- The user wants to create a comprehensive business plan with financial projections and market analysis
- The user needs help with Business Model Canvas, lean startup methodology, or go-to-market strategy
- The user is preparing a business plan for a bank loan, investors, or internal stakeholders
- The user needs competitive analysis frameworks or revenue model design

**Do NOT use this skill when:**
- The user is building a pitch deck specifically for investors (use pitch-deck-builder instead)
- The user needs deep competitive intelligence beyond the business plan (use competitive-analyst instead)
- The user wants to run a specific type of business and needs operational guidance (use the relevant business-type skill)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to business planner.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on business planner
- User asks about business planner best practices or techniques
- User wants a structured approach to business planner

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of business planner

A structured, expert-level business planning skill that guides users through every component of a professional business plan -- from executive summary to financial projections. Built on proven frameworks including the Business Model Canvas, Lean Startup methodology, and standard financial modeling practices.

---

## Questions to Ask the User First

Before generating any business plan content, gather these critical inputs:

1. **What is your business idea in one sentence?**
2. **What stage are you at?** (Idea only / Validated concept / Already operating / Scaling)
3. **Who is your target customer?** (Be as specific as possible)
4. **What problem do you solve, and how do you solve it differently?**
5. **What is your revenue model?** (Subscription, one-time sale, marketplace, freemium, advertising, etc.)
6. **What is your funding goal?** (Bootstrapping / Seeking investment / Grant application)
7. **What is your timeline?** (Planning horizon: 1 year, 3 years, 5 years)
8. **What industry/sector are you in?**
9. **Do you have any existing traction?** (Revenue, users, LOIs, partnerships)
10. **Who is on your team currently?**

---

## Step 1: Executive Summary

Write the executive summary LAST but place it FIRST in the document. It should be 1-2 pages max.

### Executive Summary Template

```
EXECUTIVE SUMMARY
Company Name: {{company_name}}
Founded: {{founding_date}}
Location: {{headquarters}}
Industry: {{industry}}
MISSION STATEMENT
{{company_name}} exists to {{mission_verb}} {{target_audience}} by {{unique_approach}}.
THE PROBLEM
{{Describe the pain point in 2-3 sentences. Use data to quantify the problem.}}
OUR SOLUTION
{{Describe your product/service in 2-3 sentences. Focus on the value delivered.}}
TARGET MARKET
Our primary market is {{target_segment}}, representing a ${{TAM}} total
addressable market. We are initially focused on {{beachhead_segment}},
a ${{SAM}} serviceable market.
BUSINESS MODEL
We generate revenue through {{revenue_model}}. Our average revenue per
customer is ${{ARPU}} with a customer acquisition cost of ${{CAC}}.
TRACTION TO DATE
- {{metric_1}}: {{value_1}}
- {{metric_2}}: {{value_2}}
- {{metric_3}}: {{value_3}}

FINANCIAL HIGHLIGHTS ({{projection_years}}-Year Projection)
- Year 1 Revenue: ${{year1_revenue}}
- Year 3 Revenue: ${{year3_revenue}}
- Break-even: {{break_even_timeline}}
- Gross Margin: {{gross_margin}}%

THE ASK
We are seeking ${{funding_amount}} in {{funding_type}} to {{primary_use_of_funds}}.
This funding will allow us to {{milestone_1}} and {{milestone_2}} within
{{timeline}}.

TEAM
{{founder_name}}, {{title}} - {{relevant_experience}}
{{cofounder_name}}, {{title}} - {{relevant_experience}}
```

---

## Step 2: Business Model Canvas

The Business Model Canvas was created by Alexander Osterwalder and Yves Pigneur (Strategyzer AG). The original canvas is licensed under Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0). For the complete methodology, see Osterwalder and Pigneur's *Business Model Generation* and strategyzer.com.

Complete each of the nine blocks systematically.

### Canvas Template

```
+-------------------+-------------------+-------------------+
|  KEY PARTNERS     |  KEY ACTIVITIES   |  VALUE            |
|                   |                   |  PROPOSITIONS     |
|  Who are your     |  What must you    |                   |
|  key partners     |  do to deliver    |  What value do    |
|  and suppliers?   |  your value       |  you deliver to   |
|                   |  proposition?     |  the customer?    |
|  1. {{partner_1}} |                   |                   |
|  2. {{partner_2}} |  1. {{activity_1}}|  1. {{value_1}}   |
|  3. {{partner_3}} |  2. {{activity_2}}|  2. {{value_2}}   |
|                   |  3. {{activity_3}}|  3. {{value_3}}   |
+-------------------+-------------------+-------------------+
|  KEY RESOURCES    |                   |  CUSTOMER         |
|                   |                   |  RELATIONSHIPS    |
|  What key         |                   |                   |
|  resources does   |                   |  What type of     |
|  your value       |                   |  relationship     |
|  proposition      |                   |  does each        |
|  require?         |                   |  segment expect?  |
|                   |                   |                   |
|  1. {{resource_1}}|                   |  1. {{rel_type_1}}|
|  2. {{resource_2}}|                   |  2. {{rel_type_2}}|
+-------------------+-------------------+-------------------+
|  COST STRUCTURE                       |  REVENUE STREAMS  |
|                                       |                   |
|  What are the most important costs?   |  For what value   |
|                                       |  are customers    |
|  Fixed: {{fixed_costs}}               |  willing to pay?  |
|  Variable: {{variable_costs}}         |                   |
|  Economies of: {{scale_or_scope}}     |  1. {{stream_1}}  |
|                                       |  2. {{stream_2}}  |
+---------------------------------------+-------------------+
|  CHANNELS                             |  CUSTOMER         |
|                                       |  SEGMENTS         |
|  How do you reach your customers?     |                   |
|                                       |  Who are your     |
|  Awareness: {{awareness_channel}}     |  most important   |
|  Evaluation: {{eval_channel}}         |  customers?       |
|  Purchase: {{purchase_channel}}       |                   |
|  Delivery: {{delivery_channel}}       |  1. {{segment_1}} |
|  After-sales: {{support_channel}}     |  2. {{segment_2}} |
+---------------------------------------+-------------------+
```

### Validation Checklist

For each canvas block, verify:
- [ ] Value Proposition directly addresses a validated customer pain
- [ ] Customer Segments are specific (not "everyone")
- [ ] Channels match where your customers actually spend time
- [ ] Revenue Streams are testable and measurable
- [ ] Key Resources include intellectual property, human capital, and financial
- [ ] Key Activities distinguish what YOU do vs. what partners do
- [ ] Key Partnerships have clear mutual value exchange
- [ ] Cost Structure separates fixed from variable costs
- [ ] Customer Relationships define acquisition, retention, and upsell

---

## Step 3: Market Analysis

### 3A: Market Sizing (TAM/SAM/SOM)

```
MARKET SIZING WORKSHEET

TOTAL ADDRESSABLE MARKET (TAM)
Method: Top-down
  Industry size (global): ${{tam_global}}
  Growth rate (CAGR): {{tam_cagr}}%
  Source: {{tam_source}}

Method: Bottom-up
  Total potential customers: {{total_customers}}
  x Average revenue per customer: ${{arpu}}
  = Bottom-up TAM: ${{tam_bottom_up}}

SERVICEABLE ADDRESSABLE MARKET (SAM)
  Geographic constraint: {{geography}}
  Segment constraint: {{segment_filter}}
  Technology constraint: {{tech_filter}}
  SAM = ${{sam_value}}

SERVICEABLE OBTAINABLE MARKET (SOM)
  Realistic market share in Year 1: {{share_pct}}%
  Based on: {{share_justification}}
  SOM = ${{som_value}}
```

### 3B: Industry Analysis (Porter's Five Forces)

Rate each force from 1 (low) to 5 (high):

| Force | Rating | Analysis |
|-------|--------|----------|
| Threat of New Entrants | {{1-5}} | {{barriers_to_entry}} |
| Bargaining Power of Suppliers | {{1-5}} | {{supplier_power_analysis}} |
| Bargaining Power of Buyers | {{1-5}} | {{buyer_power_analysis}} |
| Threat of Substitutes | {{1-5}} | {{substitute_analysis}} |
| Competitive Rivalry | {{1-5}} | {{rivalry_analysis}} |

**Overall Industry Attractiveness:** {{high/medium/low}}

### 3C: Customer Persona

```
CUSTOMER PERSONA: {{persona_name}}

Demographics:
  Age: {{age_range}}
  Gender: {{gender}}
  Income: ${{income_range}}
  Education: {{education}}
  Location: {{location}}
  Job Title: {{job_title}}

Psychographics:
  Goals: {{top_3_goals}}
  Frustrations: {{top_3_frustrations}}
  Values: {{core_values}}
  Information sources: {{where_they_learn}}

Buying Behavior:
  Decision process: {{how_they_decide}}
  Budget authority: {{yes_no}}
  Purchase triggers: {{what_triggers_purchase}}
  Objections: {{common_objections}}

Quote: "{{A sentence this person would actually say about the problem}}"
```

---

## Step 4: Competitive Landscape

### Competitive Matrix

```
| Feature/Factor      | Your Company | Competitor A | Competitor B | Competitor C |
|---------------------|-------------|-------------|-------------|-------------|
| Price               | {{}}        | {{}}        | {{}}        | {{}}        |
| Core Feature 1      | {{}}        | {{}}        | {{}}        | {{}}        |
| Core Feature 2      | {{}}        | {{}}        | {{}}        | {{}}        |
| Customer Support     | {{}}        | {{}}        | {{}}        | {{}}        |
| Ease of Use         | {{}}        | {{}}        | {{}}        | {{}}        |
| Market Share        | {{}}        | {{}}        | {{}}        | {{}}        |
| Funding/Resources   | {{}}        | {{}}        | {{}}        | {{}}        |
| Key Differentiator  | {{}}        | {{}}        | {{}}        | {{}}        |
```

### Positioning Statement

```
For {{target_customer}} who {{need_or_opportunity}},
{{product_name}} is a {{product_category}}
that {{key_benefit}}.
Unlike {{primary_competitor}},
we {{key_differentiator}}.
```

---

## Step 5: Go-to-Market Strategy

### GTM Framework

```
PHASE 1: VALIDATE (Months 1-3)
  Target: {{beachhead_segment}}
  Channel: {{primary_channel}}
  Goal: {{validation_metric}} (e.g., 50 paying customers)
  Budget: ${{phase1_budget}}
  Key actions:
    1. {{action_1}}
    2. {{action_2}}
    3. {{action_3}}

PHASE 2: ESTABLISH (Months 4-9)
  Target: {{expanded_segment}}
  Channels: {{channel_1}}, {{channel_2}}
  Goal: {{establishment_metric}} (e.g., $10K MRR)
  Budget: ${{phase2_budget}}
  Key actions:
    1. {{action_1}}
    2. {{action_2}}
    3. {{action_3}}

PHASE 3: SCALE (Months 10-18)
  Target: {{full_target_market}}
  Channels: {{all_channels}}
  Goal: {{scale_metric}} (e.g., $100K MRR)
  Budget: ${{phase3_budget}}
  Key actions:
    1. {{action_1}}
    2. {{action_2}}
    3. {{action_3}}
```

---

## Step 6: Financial Projections

### 6A: Revenue Projections

```
REVENUE MODEL: {{model_type}}

ASSUMPTIONS:
  Customer growth rate (monthly): {{growth_rate}}%
  Average revenue per customer: ${{arpu}}
  Churn rate (monthly): {{churn}}%
  Conversion rate (free to paid): {{conversion}}%

MONTHLY REVENUE FORECAST:
| Month | New Customers | Churned | Total Active | MRR        |
|-------|--------------|---------|-------------|------------|
| M1    | {{}}         | {{}}    | {{}}        | ${{}}      |
| M2    | {{}}         | {{}}    | {{}}        | ${{}}      |
| M3    | {{}}         | {{}}    | {{}}        | ${{}}      |
| ...   | ...          | ...     | ...         | ...        |
| M12   | {{}}         | {{}}    | {{}}        | ${{}}      |

ANNUAL REVENUE SUMMARY:
  Year 1: ${{year1}}
  Year 2: ${{year2}}
  Year 3: ${{year3}}
```

### 6B: Profit & Loss Statement

```
PROJECTED P&L (ANNUAL)
                          Year 1       Year 2       Year 3
REVENUE
  Product/Service Revenue ${{}}        ${{}}        ${{}}
  Other Revenue           ${{}}        ${{}}        ${{}}
  TOTAL REVENUE           ${{}}        ${{}}        ${{}}

COST OF GOODS SOLD
  Direct costs            ${{}}        ${{}}        ${{}}
  GROSS PROFIT            ${{}}        ${{}}        ${{}}
  GROSS MARGIN            {{}}%        {{}}%        {{}}%

OPERATING EXPENSES
  Salaries & Wages        ${{}}        ${{}}        ${{}}
  Marketing & Sales       ${{}}        ${{}}        ${{}}
  Rent & Utilities        ${{}}        ${{}}        ${{}}
  Software & Tools        ${{}}        ${{}}        ${{}}
  Professional Services   ${{}}        ${{}}        ${{}}
  Other Operating         ${{}}        ${{}}        ${{}}
  TOTAL OPEX              ${{}}        ${{}}        ${{}}

  EBITDA                  ${{}}        ${{}}        ${{}}
  NET INCOME              ${{}}        ${{}}        ${{}}
  NET MARGIN              {{}}%        {{}}%        {{}}%
```

### 6C: Cash Flow Projection

```
CASH FLOW STATEMENT (QUARTERLY)
                          Q1       Q2       Q3       Q4
OPENING BALANCE           ${{}}    ${{}}    ${{}}    ${{}}

CASH IN
  Revenue collected       ${{}}    ${{}}    ${{}}    ${{}}
  Investment received     ${{}}    ${{}}    ${{}}    ${{}}
  Other income            ${{}}    ${{}}    ${{}}    ${{}}
  TOTAL CASH IN           ${{}}    ${{}}    ${{}}    ${{}}

CASH OUT
  COGS                    ${{}}    ${{}}    ${{}}    ${{}}
  Payroll                 ${{}}    ${{}}    ${{}}    ${{}}
  Marketing               ${{}}    ${{}}    ${{}}    ${{}}
  Operations              ${{}}    ${{}}    ${{}}    ${{}}
  Capital expenditure     ${{}}    ${{}}    ${{}}    ${{}}
  TOTAL CASH OUT          ${{}}    ${{}}    ${{}}    ${{}}

NET CASH FLOW             ${{}}    ${{}}    ${{}}    ${{}}
CLOSING BALANCE           ${{}}    ${{}}    ${{}}    ${{}}
```

### 6D: Break-Even Analysis

```
BREAK-EVEN CALCULATION

Fixed Costs (monthly): ${{fixed_monthly}}
Variable Cost per Unit: ${{variable_per_unit}}
Average Selling Price: ${{asp}}
Contribution Margin: ${{asp}} - ${{variable}} = ${{contribution}}
Contribution Margin %: {{cm_pct}}%

Break-Even Point (units): {{fixed}} / {{contribution}} = {{be_units}} units/month
Break-Even Point (revenue): ${{be_revenue}}/month
Expected month to reach break-even: Month {{be_month}}
```

---

## Step 7: Funding Requirements

```
FUNDING REQUIREMENTS

Total Raise: ${{total_amount}}
Instrument: {{equity / convertible_note / SAFE / debt}}
Pre-money Valuation: ${{valuation}} (if equity)

USE OF FUNDS:
| Category              | Amount    | % of Total |
|----------------------|-----------|------------|
| Product Development  | ${{}}     | {{}}%      |
| Sales & Marketing    | ${{}}     | {{}}%      |
| Hiring               | ${{}}     | {{}}%      |
| Operations           | ${{}}     | {{}}%      |
| Working Capital      | ${{}}     | {{}}%      |
| TOTAL                | ${{}}     | 100%       |

MILESTONES THIS FUNDING ENABLES:
1. {{milestone_1}} by {{date_1}}
2. {{milestone_2}} by {{date_2}}
3. {{milestone_3}} by {{date_3}}

RUNWAY: {{months}} months at projected burn rate of ${{monthly_burn}}/month
```

---

## Step 8: Risk Analysis

### Risk Matrix

| Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation |
|------|------------------|--------------|-------|------------|
| {{risk_1}} | {{}} | {{}} | {{}} | {{mitigation_1}} |
| {{risk_2}} | {{}} | {{}} | {{}} | {{mitigation_2}} |
| {{risk_3}} | {{}} | {{}} | {{}} | {{mitigation_3}} |
| {{risk_4}} | {{}} | {{}} | {{}} | {{mitigation_4}} |

Common risk categories to address:
- **Market risk:** Demand does not materialize as projected
- **Competitive risk:** Incumbent or new entrant captures market
- **Execution risk:** Team cannot deliver product on time
- **Financial risk:** Insufficient funding or revenue shortfall
- **Regulatory risk:** Compliance requirements change
- **Technology risk:** Platform or infrastructure failures

---

## Lean Startup Integration

For early-stage businesses, supplement the full plan with:

### Build-Measure-Learn Loop

```
HYPOTHESIS: We believe {{customer_segment}} will {{expected_behavior}}
            because {{reason}}.

EXPERIMENT: To test this, we will {{experiment_description}}.

METRIC: We will measure {{metric}} and consider the hypothesis
        validated if {{success_criteria}}.

TIMELINE: {{duration}} to run experiment.

RESULT: {{actual_outcome}}

DECISION: [ ] Persevere  [ ] Pivot  [ ] Kill
```

### MVP Definition

```
MVP SCOPE:
  Core features (must-have):
    1. {{feature_1}}
    2. {{feature_2}}
    3. {{feature_3}}

  Nice-to-have (post-MVP):
    1. {{feature_4}}
    2. {{feature_5}}

  Explicitly excluded:
    1. {{excluded_1}}
    2. {{excluded_2}}

  MVP success criteria: {{criteria}}
  MVP timeline: {{weeks}} weeks
  MVP budget: ${{budget}}
```

---

## Output Checklist

Before delivering the final business plan, verify:

- [ ] Executive summary is compelling and stands alone
- [ ] Problem/solution fit is clearly articulated
- [ ] Market size uses both top-down and bottom-up methods
- [ ] Financial projections have stated assumptions
- [ ] Competitive analysis includes at least 3 competitors
- [ ] Go-to-market has specific, actionable phases
- [ ] Team section highlights relevant experience
- [ ] Ask/funding requirements are specific and justified
- [ ] Risk analysis addresses top 5 threats with mitigations
- [ ] All numbers are internally consistent


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Business Planner deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with business planner for a mid-size project."

**Output:** A complete business planner framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
