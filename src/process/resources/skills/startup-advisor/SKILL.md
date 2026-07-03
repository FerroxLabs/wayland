---
name: startup-advisor
description: |
  Expert startup guidance covering lean startup methodology, MVP definition, product-market fit measurement, funding strategy, key metrics, pivot decisions, and stage-appropriate advice from ideation through scale. Use when the user asks about startup advisor or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: '1.0.0'
  tags: 'entrepreneurship strategy planning analysis'
  category: 'business-strategy'
  subcategory: 'entrepreneurship'
  depends: ''
  disclaimer: 'none'
  difficulty: 'intermediate'
---

# Startup Advisor

## When to Use

**Use this skill when:**

- The user is building a startup and needs guidance on lean methodology, MVP definition, or product-market fit measurement
- The user wants help with funding strategy, key metrics, or deciding whether to pivot
- The user needs stage-appropriate advice from ideation through scale for a venture-backed business
- The user wants to understand startup economics, fundraising rounds, or growth metrics

**Do NOT use this skill when:**

- The user is bootstrapping without plans to raise funding (use bootstrapper-playbook instead)
- The user wants to write a formal business plan (use business-planner instead)
- The user needs to build a specific pitch deck for investors (use pitch-deck-builder instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to startup advisor.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**

- User needs guidance on startup advisor
- User asks about startup advisor best practices or techniques
- User wants a structured approach to startup advisor

**Do NOT use this skill when:**

- A more specialized skill exists for the specific subtopic
- The request is outside the scope of startup advisor

A comprehensive startup advisory skill that provides stage-appropriate guidance from ideation through scale. Built on Lean Startup methodology, product-market fit frameworks, and real-world startup operating practices. Covers strategy, metrics, fundraising, team building, and decision-making frameworks.

---

## Questions to Ask the User First

1. **What is your startup idea?** (One sentence)
2. **What stage are you at?**
   - Ideation (just an idea)
   - Validation (testing assumptions)
   - MVP (building first version)
   - Early traction (first customers)
   - Growth (scaling what works)
   - Scale (optimizing and expanding)
3. **Are you a solo founder or do you have co-founders?**
4. **What is your background/expertise?**
5. **Are you working on this full-time?**
6. **Do you have any traction?** (Users, revenue, LOIs, waitlist)
7. **How are you funded?** (Self-funded, friends/family, angel, VC, revenue)
8. **What is your biggest challenge right now?**
9. **What is your target customer?**
10. **What is your timeline / runway?**

---

## Startup Stage Framework

### Stage 1: Ideation

**Goal:** Validate that a real problem exists worth solving.

```
IDEATION CHECKLIST:

PROBLEM VALIDATION:
- [ ] Can you describe the problem in one sentence?
- [ ] Have you experienced this problem yourself?
- [ ] Have you talked to 10+ people who have this problem?
- [ ] Can you quantify the cost of this problem? (time, money, frustration)
- [ ] Are people actively seeking solutions today?

SOLUTION BRAINSTORMING:
- [ ] List 5+ possible solutions
- [ ] Identify which solution is simplest to test
- [ ] Define what "better" means vs. existing alternatives
- [ ] Identify your unfair advantage for building this

FOUNDER-MARKET FIT:
- [ ] Why are YOU the right person to solve this?
- [ ] What unique insight do you have?
- [ ] What resources/connections do you bring?
- [ ] Are you passionate enough to work on this for 7-10 years?

QUICK TESTS:
- Create a landing page describing the solution
- Run a "fake door" test (CTA that measures interest)
- Post in relevant communities and measure response
- Talk to 20 potential customers (do NOT pitch -- just listen)
```

### Stage 2: Validation

**Goal:** Prove that customers will pay for your solution.

```
VALIDATION EXPERIMENTS:

EXPERIMENT 1: Problem Interviews (Week 1-2)
  Target: 20 customer interviews
  Script: "Tell me about the last time you experienced {{problem}}..."
  Success metric: 80%+ confirm the problem is significant
  Result: [ ] Validated [ ] Invalidated

EXPERIMENT 2: Solution Interviews (Week 2-3)
  Target: 15 solution interviews with mockup/prototype
  Script: "Here is how we would solve {{problem}}. Would you use this?"
  Success metric: 60%+ express strong interest
  Result: [ ] Validated [ ] Invalidated

EXPERIMENT 3: Willingness to Pay (Week 3-4)
  Target: 10 pricing conversations
  Method: Van Westendorp or direct pricing question
  Script: "If this existed today, what would you expect to pay?"
  Success metric: Price supports viable business model
  Result: [ ] Validated [ ] Invalidated

EXPERIMENT 4: Pre-Sales (Week 4-6)
  Target: 5 pre-orders, LOIs, or deposits
  Method: Offer early access at discount for commitment
  Success metric: Real money or binding commitment changes hands
  Result: [ ] Validated [ ] Invalidated
```

### Stage 3: MVP (Minimum Viable Product)

**Goal:** Build the smallest thing that delivers the core value.

```
MVP DEFINITION WORKSHEET

CORE JOB TO BE DONE:
{{What is the #1 thing your product must do?}}

MVP FEATURE SET (be ruthless):
MUST HAVE (launch blockers):
  1. {{feature}} -- Why: {{it directly delivers core value}}
  2. {{feature}} -- Why: {{without it, product cannot function}}
  3. {{feature}} -- Why: {{required for payment/onboarding}}

SHOULD HAVE (Week 2-4 post-launch):
  1. {{feature}}
  2. {{feature}}

COULD HAVE (Month 2-3):
  1. {{feature}}
  2. {{feature}}

WILL NOT HAVE (explicitly excluded):
  1. {{feature}} -- Why: {{distraction from core value}}
  2. {{feature}} -- Why: {{premature optimization}}

MVP TYPE:
  [ ] Concierge MVP (manually deliver the value)
  [ ] Wizard of Oz (looks automated, human-powered behind scenes)
  [ ] Single-feature product (one thing done well)
  [ ] Landing page + manual process
  [ ] Piecemeal MVP (stitch together existing tools)

TIMELINE: {{weeks}} weeks
BUDGET: ${{budget}}
SUCCESS CRITERIA: {{measurable_outcome}}
```

### Stage 4: Early Traction

**Goal:** Find repeatable customer acquisition and prove product-market fit.

```
PRODUCT-MARKET FIT ASSESSMENT

THE SEAN ELLIS TEST:
Ask existing users: "How would you feel if you could no longer use {{product}}?"
  Very disappointed: {{pct}}% (target: 40%+)
  Somewhat disappointed: {{pct}}%
  Not disappointed: {{pct}}%

RETENTION ANALYSIS:
  Day 1 retention: {{pct}}%
  Day 7 retention: {{pct}}%
  Day 30 retention: {{pct}}%
  Is retention flattening? {{yes/no}} (good = yes, curve flattens)

ORGANIC GROWTH SIGNALS:
  - [ ] Users referring other users without being asked
  - [ ] Inbound leads increasing
  - [ ] Usage frequency increasing over time
  - [ ] Users complaining when product is down
  - [ ] Users finding creative uses you did not anticipate

NET PROMOTER SCORE:
  NPS: {{score}} (-100 to +100, target: 50+)

VERDICT:
  [ ] Strong PMF -- Accelerate growth
  [ ] Emerging PMF -- Double down on what is working
  [ ] Weak PMF -- Iterate on product/positioning
  [ ] No PMF -- Consider pivot
```

### Stage 5: Growth

**Goal:** Scale acquisition channels and optimize unit economics.

```
GROWTH FRAMEWORK

IDENTIFY YOUR GROWTH ENGINE:
  [ ] Viral: Users naturally invite others
      Key metric: Viral coefficient (target: >1.0)
  [ ] Sticky: High retention drives growth
      Key metric: Churn rate (target: <5% monthly)
  [ ] Paid: Profitable customer acquisition
      Key metric: LTV:CAC ratio (target: >3:1)

CHANNEL TESTING MATRIX:
| Channel           | Cost to Test | Timeline | Expected CAC | Status    |
|-------------------|-------------|----------|-------------|-----------|
| Content/SEO       | ${{}}       | 3-6 mo   | ${{}}       | {{}}      |
| Paid Search       | ${{}}       | 2-4 wk   | ${{}}       | {{}}      |
| Paid Social       | ${{}}       | 2-4 wk   | ${{}}       | {{}}      |
| Cold Outreach     | ${{}}       | 2-4 wk   | ${{}}       | {{}}      |
| Partnerships      | ${{}}       | 1-3 mo   | ${{}}       | {{}}      |
| Referral Program  | ${{}}       | 1-2 mo   | ${{}}       | {{}}      |
| Community/Events  | ${{}}       | 2-3 mo   | ${{}}       | {{}}      |
| PR/Media          | ${{}}       | 1-3 mo   | ${{}}       | {{}}      |

GROWTH PRIORITIES (ICE Framework):
  Impact (1-10) x Confidence (1-10) x Ease (1-10) = ICE Score

| Experiment               | Impact | Confidence | Ease | Score |
|--------------------------|--------|------------|------|-------|
| {{experiment_1}}         | {{}}   | {{}}       | {{}} | {{}}  |
| {{experiment_2}}         | {{}}   | {{}}       | {{}} | {{}}  |
| {{experiment_3}}         | {{}}   | {{}}       | {{}} | {{}}  |
```

### Stage 6: Scale

**Goal:** Build organizational capacity and expand markets.

```
SCALING READINESS CHECKLIST:

PRODUCT:
- [ ] Core product is stable and reliable
- [ ] Infrastructure can handle 10x current load
- [ ] Customer onboarding is self-serve or semi-automated
- [ ] Support is scalable (help docs, chatbot, tiered support)

TEAM:
- [ ] Key leadership roles are filled
- [ ] Hiring pipeline is established
- [ ] Culture and values are documented
- [ ] Management structure exists for 3x current headcount

OPERATIONS:
- [ ] Key processes are documented
- [ ] Financial controls and reporting are in place
- [ ] Legal and compliance requirements are met
- [ ] Vendor/partner relationships are formalized

GROWTH:
- [ ] At least 2 acquisition channels are working
- [ ] Unit economics are positive and improving
- [ ] Expansion revenue (upsell/cross-sell) strategy exists
- [ ] International/geographic expansion plan (if applicable)
```

---

## Key Startup Metrics

### Metric Definitions and Benchmarks

```
CORE METRICS DASHBOARD

ACQUISITION:
  Customer Acquisition Cost (CAC):
    Formula: Total sales & marketing spend / New customers acquired
    Benchmark: Varies by industry, but LTV:CAC should be >3:1
    Your CAC: ${{cac}}

  Monthly Recurring Revenue (MRR):
    Formula: Sum of all monthly subscription revenue
    Growth rate: {{mrr_growth}}% MoM (healthy: 10-20% early stage)
    Your MRR: ${{mrr}}

  Annual Recurring Revenue (ARR):
    Formula: MRR x 12
    Your ARR: ${{arr}}

RETENTION:
  Churn Rate (Monthly):
    Formula: Customers lost in month / Customers at start of month
    Benchmark: <5% monthly for SMB, <1% for enterprise
    Your churn: {{churn}}%

  Net Revenue Retention (NRR):
    Formula: (Starting MRR + Expansion - Contraction - Churn) / Starting MRR
    Benchmark: >100% (best-in-class: >120%)
    Your NRR: {{nrr}}%

ECONOMICS:
  Lifetime Value (LTV):
    Formula: ARPU / Monthly churn rate
    Your LTV: ${{ltv}}

  LTV:CAC Ratio:
    Formula: LTV / CAC
    Benchmark: 3:1 minimum, 5:1+ for healthy businesses
    Your ratio: {{ratio}}:1

  Payback Period:
    Formula: CAC / Monthly gross profit per customer
    Benchmark: <12 months
    Your payback: {{months}} months

ENGAGEMENT:
  Daily Active Users (DAU): {{dau}}
  Monthly Active Users (MAU): {{mau}}
  DAU/MAU Ratio: {{ratio}}% (benchmark: 20%+ is good, 50%+ is excellent)

BURN:
  Monthly Burn Rate: ${{burn}}
  Runway: {{months}} months (cash / monthly burn)
  Months to default (if declining runway): {{months}}
```

---

## Pivot vs. Persevere Decision Framework

```
PIVOT ASSESSMENT

Answer each question honestly:

TRACTION SIGNALS:
1. Are users/customers actively using the product? {{yes/no}}
2. Is there organic growth (word-of-mouth)? {{yes/no}}
3. Are users willing to pay the target price? {{yes/no}}
4. Is usage increasing over time? {{yes/no}}
5. Do users get upset when the product is unavailable? {{yes/no}}

Score: {{count}}/5 -- If < 2, strongly consider a pivot.

PIVOT OPTIONS:
  Zoom-in pivot: One feature becomes the whole product
  Zoom-out pivot: Whole product becomes one feature of larger product
  Customer segment pivot: Same product, different customer
  Customer need pivot: Same customer, different problem
  Platform pivot: Change from app to platform (or vice versa)
  Business model pivot: Change how you monetize
  Channel pivot: Change how you reach customers
  Technology pivot: Same solution, different technology
  Value capture pivot: Change your pricing/revenue model

DECISION MATRIX:
| Factor                      | Persevere | Pivot |
|-----------------------------|-----------|-------|
| Customer feedback           | {{}}      | {{}}  |
| Metrics trend               | {{}}      | {{}}  |
| Team energy/conviction      | {{}}      | {{}}  |
| Market timing               | {{}}      | {{}}  |
| Competitive landscape       | {{}}      | {{}}  |
| Runway remaining            | {{}}      | {{}}  |

DECISION: [ ] Persevere  [ ] Pivot to: {{pivot_type}}
RATIONALE: {{why}}
```

---

## Funding Options by Stage

```
FUNDING ROADMAP

PRE-SEED ($25K - $500K):
  Sources:
  - Personal savings / Friends & family
  - Accelerators (Y Combinator, Techstars, etc.)
  - Angel investors
  - SAFE notes or convertible notes
  - Government grants (SBIR/STTR in US)
  What investors expect: Team + idea + initial validation

SEED ($500K - $3M):
  Sources:
  - Angel groups and syndicates
  - Seed-stage VC funds
  - Revenue-based financing (if revenue exists)
  - Crowdfunding (Republic, Wefunder)
  What investors expect: MVP + early traction + clear market

SERIES A ($3M - $15M):
  Sources:
  - Institutional VC funds
  - Corporate venture capital
  What investors expect: Product-market fit + $1M+ ARR + growth rate

SERIES B+ ($15M+):
  Sources:
  - Growth-stage VC
  - Private equity
  - Strategic investors
  What investors expect: Proven unit economics + scalable growth engine

ALTERNATIVE FUNDING:
  - Bootstrapping: Fund from revenue
  - Revenue-based financing: Percentage of revenue until repaid
  - Venture debt: Debt alongside equity raise
  - Grants: Non-dilutive government/foundation funding
  - Strategic partnerships: Advance payments or joint ventures
```

---

## Common Startup Pitfalls

### Top 20 Reasons Startups Fail (and How to Avoid Them)

| Rank | Pitfall             | Prevention                                                |
| ---- | ------------------- | --------------------------------------------------------- |
| 1    | No market need      | Validate before building. Talk to 50+ customers.          |
| 2    | Ran out of cash     | Know your runway. Raise before you need to.               |
| 3    | Wrong team          | Co-founder alignment on vision, values, and commitment.   |
| 4    | Got outcompeted     | Focus on speed and customer intimacy, not features.       |
| 5    | Pricing/cost issues | Test pricing early. Know your unit economics.             |
| 6    | Poor product        | Ship fast, get feedback, iterate weekly.                  |
| 7    | No business model   | Know how you make money from Day 1.                       |
| 8    | Poor marketing      | Find one channel that works before diversifying.          |
| 9    | Ignored customers   | Talk to customers weekly. Build feedback loops.           |
| 10   | Bad timing          | Study market readiness. Why now matters.                  |
| 11   | Lost focus          | Say no to 90% of ideas. Do one thing well.                |
| 12   | Team disharmony     | Written co-founder agreement. Regular check-ins.          |
| 13   | Pivot gone wrong    | Pivot based on data, not desperation.                     |
| 14   | Lack of passion     | Work on problems you genuinely care about.                |
| 15   | Bad location        | Remote-first or relocate to where your customers are.     |
| 16   | No financing        | Build relationships with investors before you need money. |
| 17   | Legal challenges    | Get legal advice early on IP, contracts, and compliance.  |
| 18   | No network          | Join communities, attend events, help others first.       |
| 19   | Burnout             | Pace yourself. This is a marathon, not a sprint.          |
| 20   | Fail to pivot       | Set kill criteria before experiments. Be honest.          |

---

## Founder Operating System

### Weekly Startup Cadence

```
WEEKLY OPERATING RHYTHM

MONDAY:
  - Review key metrics dashboard (30 min)
  - Set 3 weekly priorities with team (30 min)
  - Customer outreach / check-ins (1 hr)

TUESDAY-THURSDAY:
  - Heads-down execution on priorities
  - Daily standup (15 min max)
  - Customer interviews or sales calls (scheduled)

FRIDAY:
  - Week in review: What worked? What did not? (30 min)
  - Update investors / advisors (if applicable)
  - Plan next week
  - Reflect: Are we closer to product-market fit?

MONTHLY:
  - Full metrics review and trend analysis
  - Board update or advisor call
  - Financial review (burn rate, runway)
  - One strategic deep-dive (pricing, positioning, roadmap)

QUARTERLY:
  - OKR review and reset
  - Competitive landscape review
  - Team retrospective
  - Fundraising status assessment
```

---

## Output Checklist

- [ ] Advice is appropriate for the user's current stage
- [ ] Recommendations are specific and actionable (not generic)
- [ ] Metrics and benchmarks are cited for context
- [ ] Next steps are clearly defined with timelines
- [ ] Risks and potential pitfalls are flagged
- [ ] Founder is encouraged but given honest feedback
- [ ] Templates provided are ready to use immediately

## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Startup Advisor deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```

## Example

**Input:** "Help me with startup advisor for a mid-size project."

**Output:** A complete startup advisor framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
