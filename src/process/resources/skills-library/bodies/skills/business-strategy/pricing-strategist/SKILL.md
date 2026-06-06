---
name: pricing-strategist
description: |
  Strategic pricing guidance covering cost-plus, value-based, competitive, freemium, tiered, and usage-based models, with psychological pricing tactics, A/B testing frameworks, pricing page design, and price increase communication strategies. Use when the user asks about pricing strategist or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy analysis entrepreneurship"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Pricing Strategist

## When to Use

**Use this skill when:**
- The user needs to set or restructure pricing using cost-plus, value-based, competitive, or tiered models
- The user wants help with psychological pricing tactics, A/B testing frameworks, or pricing page design
- The user needs a price increase communication strategy or freemium-to-paid conversion plan
- The user wants to analyze pricing against competitors or design usage-based pricing models

**Do NOT use this skill when:**
- The user needs subscription-specific pricing with MRR/ARR and churn analysis (use subscription-model-designer instead)
- The user wants broader business strategy beyond pricing (use business-planner or startup-advisor instead)
- The user needs competitive analysis that goes beyond pricing comparison (use competitive-analyst instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to pricing strategist.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on pricing strategist
- User asks about pricing strategist best practices or techniques
- User wants a structured approach to pricing strategist

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of pricing strategist
## Questions to Ask the User First

1. **What is your product/service?**
2. **What is your current pricing?** (If any)
3. **What type of business?** (SaaS, e-commerce, services, marketplace, physical product)
4. **Who is your target customer?** (Consumer, SMB, mid-market, enterprise)
5. **What do competitors charge?** (Range of prices in the market)
6. **What are your costs?** (COGS, delivery costs, marginal costs)
7. **What is the primary value you deliver?** (Save time, save money, increase revenue, reduce risk)
8. **Do you have existing customers to survey?**
9. **What are your growth goals?** (Maximize revenue, maximize adoption, market share)
10. **Are you launching new pricing or changing existing pricing?**
---
## Step 1: Pricing Model Selection

### Pricing Model Comparison
```
PRICING MODEL DECISION MATRIX

Score each model 1-5 for fit with your business:

| Model            | Revenue     | Simplicity | Scalability | Customer   | SCORE |
|                  | Predictabil.| for Buyer  |             | Alignment  |       |
|------------------|-------------|------------|-------------|------------|-------|
| Cost-Plus        | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Value-Based      | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Competitive      | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Freemium         | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Tiered           | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Usage-Based      | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Per-Seat         | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |
| Flat Rate        | {{1-5}}     | {{1-5}}    | {{1-5}}     | {{1-5}}    | {{}}  |

RECOMMENDED MODEL: {{highest_score}}
```

### Model Details

#### Cost-Plus Pricing
```
COST-PLUS CALCULATION

Direct costs per unit: ${{direct_cost}}
Indirect costs allocated per unit: ${{indirect_cost}}
Total cost per unit: ${{total_cost}}
Desired margin: {{margin}}%
Price = Total cost / (1 - margin%) = ${{price}}

WHEN TO USE:
- Commoditized products with known costs
- Government contracts requiring cost transparency
- Manufacturing with stable input costs

WHEN TO AVOID:
- Software (marginal cost near zero)
- Products where value far exceeds cost
- Competitive markets where cost-plus overprices you
```

#### Value-Based Pricing
```
VALUE-BASED PRICING CALCULATION

STEP 1: Quantify value delivered
  Time saved per month: {{hours}} hours x ${{hourly_rate}} = ${{time_value}}
  Revenue increased: ${{revenue_increase}} per {{period}}
  Costs reduced: ${{cost_reduction}} per {{period}}
  Risk mitigated: ${{risk_value}} per {{period}}
  TOTAL VALUE DELIVERED: ${{total_value}} per {{period}}

STEP 2: Determine value capture rate
  Industry benchmark capture: 10-25% of value delivered
  Selected capture rate: {{pct}}%

STEP 3: Calculate price
  Price = ${{total_value}} x {{pct}}% = ${{price}} per {{period}}

STEP 4: Validate
  Does this price feel fair to the customer? {{yes/no}}
  Can you prove the value with data/case studies? {{yes/no}}
  Is there a measurable ROI you can guarantee? {{yes/no}}
```

#### Freemium Model
```
FREEMIUM DESIGN

FREE TIER:
  Purpose: Acquisition and habit formation
  Features included:
    1. {{feature_1}} (core value, limited)
    2. {{feature_2}} (enough to be useful)
    3. {{feature_3}} (creates desire for more)
  Limits: {{usage_limits}}
  What is explicitly excluded: {{excluded}}

PAID TIER(S):
  Conversion trigger: When user hits {{limit}} or needs {{feature}}
  Target free-to-paid conversion rate: {{pct}}% (benchmark: 2-5%)
  Expected time to convert: {{days/weeks}} average

FREEMIUM ECONOMICS:
  Free users: {{count}}
  Cost to serve free user: ${{cost}}/month
  Total free user cost: ${{total_free_cost}}/month
  Paid users: {{paid_count}} ({{conversion_pct}}% conversion)
  Paid ARPU: ${{arpu}}
  Paid revenue: ${{paid_revenue}}/month
  Net contribution: ${{net}} (must be positive)
```

#### Tiered Pricing
```
TIERED PRICING DESIGN

TIER STRUCTURE:

Tier 1: {{tier_name}} -- ${{price}}/{{period}}
  Target customer: {{segment}}
  Features: {{feature_list}}
  Limits: {{limits}}
  Purpose: Low barrier entry, high volume

Tier 2: {{tier_name}} -- ${{price}}/{{period}}  [MOST POPULAR]
  Target customer: {{segment}}
  Features: Everything in Tier 1 plus {{additional_features}}
  Limits: {{limits}}
  Purpose: Optimal value for most customers (anchor this tier)

Tier 3: {{tier_name}} -- ${{price}}/{{period}}
  Target customer: {{segment}}
  Features: Everything in Tier 2 plus {{additional_features}}
  Limits: {{limits}}
  Purpose: Power users, makes Tier 2 look reasonable

Enterprise: Custom pricing
  Target customer: {{segment}}
  Features: Everything plus {{enterprise_features}}
  Purpose: Large accounts, custom needs

TIER DESIGN RULES:
- 3 tiers is optimal (paradox of choice)
- Middle tier should be the target (decoy effect)
- 2-3x price jump between tiers
- Each tier should have a clear "hero feature" that unlocks
- Name tiers by persona, not size (e.g., "Starter, Professional, Team")
```

#### Usage-Based Pricing
```
USAGE-BASED PRICING DESIGN

USAGE METRIC: {{what_you_charge_for}}

Good usage metrics are:
- [ ] Easy for customers to understand
- [ ] Correlate with value received
- [ ] Predictable for the customer
- [ ] Grow as the customer succeeds

PRICING TABLE:
| Volume         | Price per Unit | Effective Rate |
|---------------|---------------|----------------|
| 0-{{tier1}}   | ${{price1}}   | ${{rate1}}     |
| {{tier1}}-{{tier2}} | ${{price2}} | ${{rate2}} |
| {{tier2}}-{{tier3}} | ${{price3}} | ${{rate3}} |
| {{tier3}}+    | ${{price4}}   | ${{rate4}}     |

MINIMUM COMMITMENT: ${{minimum}}/month (if any)
OVERAGE RATE: ${{overage}} per {{unit}}

CONSIDERATIONS:
- Provide a cost calculator on your pricing page
- Send usage alerts at 50%, 80%, 100% of plan limits
- Offer committed-use discounts for predictability
```
---
## Step 2: Willingness-to-Pay Research

### Van Westendorp Price Sensitivity Meter
```
VAN WESTENDORP SURVEY QUESTIONS

Ask your target customers these 4 questions:

Q1: At what price would {{product}} be so cheap you would
    question its quality?
    $_______ (Too Cheap)

Q2: At what price would {{product}} be a bargain -- a great
    value for the money?
    $_______ (Cheap / Good Value)

Q3: At what price would {{product}} start to seem expensive,
    but you would still consider buying it?
    $_______ (Expensive but Acceptable)

Q4: At what price would {{product}} be too expensive --
    you would never consider buying it?
    $_______ (Too Expensive)

ANALYSIS:
Plot cumulative distributions of all four answers.
- Optimal Price Point (OPP): Intersection of Too Cheap and Too Expensive
- Indifference Price Point (IDP): Intersection of Cheap and Expensive
- Acceptable Price Range: Between OPP and IDP

Recommended sample size: 100+ responses minimum
```

### Gabor-Granger Method
```
GABOR-GRANGER SURVEY

Present prices sequentially and measure purchase intent:

"Would you buy {{product}} at ${{price_1}}?"
  [ ] Definitely yes [ ] Probably yes [ ] Maybe [ ] Probably no [ ] Definitely no

"Would you buy {{product}} at ${{price_2}}?" (higher)
  [ ] Definitely yes [ ] Probably yes [ ] Maybe [ ] Probably no [ ] Definitely no

"Would you buy {{product}} at ${{price_3}}?" (even higher)
  [ ] Definitely yes [ ] Probably yes [ ] Maybe [ ] Probably no [ ] Definitely no

Continue until "probably no" or "definitely no" is selected.

Revenue-maximizing price = Price x Purchase probability
Calculate for each price point and select the maximum.
```
---
## Step 3: Psychological Pricing Tactics

### Proven Psychological Pricing Techniques
```
PSYCHOLOGICAL PRICING CHECKLIST
CHARM PRICING:
  $99 instead of $100, $49 instead of $50
  Why: Left-digit effect. Brain anchors on first digit.
  When to use: Consumer products, mass market
  When to avoid: Luxury/premium positioning
ANCHOR PRICING:
  Show expensive option first to make others seem reasonable
  Enterprise: $999/mo | Professional: $299/mo | Starter: $49/mo
  Why: First price seen becomes the reference point
DECOY EFFECT:
  Add a tier that makes your target tier look like best value
PRICE ENDING:
  $X.99 -- Value/discount perception
  $X.00 -- Quality/premium perception
  $X.97 -- Sale/clearance perception
  Choose based on brand positioning
BUNDLE PRICING:
  Individual prices: A=$50, B=$50, C=$50 = $150
  Bundle price: All three for $99 (save $51)
  Why: Perceived value exceeds actual discount cost
ANNUAL VS MONTHLY:
  Monthly: $29/mo
  Annual: $24/mo (billed $288/year) -- Save 17%
  Display as: "$24/mo" not "$288/year"
  Why: Monthly feels smaller, annual improves cash flow
REMOVE THE DOLLAR SIGN:
  Menu: Steak 24 (instead of $24.00)
  Reduces "pain of paying" -- backed by Cornell research
  When to use: High-end dining, luxury services
FREE TRIAL:
  14-day free trial (SaaS standard)
  No credit card required: Higher signups, lower conversion
  Credit card required: Lower signups, higher conversion
  Choose based on funnel goals
```
---
## Step 4: Pricing Page Design

### Pricing Page Best Practices
```
PRICING PAGE STRUCTURE
SECTION 1: HEADLINE
  "Simple, transparent pricing" or similar trust-building headline
  Optional: One-line value reinforcement

SECTION 2: TOGGLE
  Monthly | Annual (show savings percentage)

SECTION 3: TIERS (3 columns recommended)
  Left: Entry tier
  Center: Recommended tier (highlighted, labeled "Most Popular")
  Right: Premium tier

FOR EACH TIER:
  - Tier name
  - Price (large, prominent)
  - Billing period
  - One-sentence description of who this is for
  - Feature list with checkmarks
  - CTA button (primary color on recommended tier)

SECTION 4: FEATURE COMPARISON TABLE
  Full breakdown of all features by tier
  Use checkmarks and X marks

SECTION 5: FAQ
  - Can I switch plans?
  - What payment methods do you accept?
  - Is there a free trial?
  - What happens when I exceed my limits?
  - Can I cancel anytime?
  - Do you offer refunds?
  - Do you offer discounts for nonprofits/education?

SECTION 6: SOCIAL PROOF
  Customer logos, testimonials, review scores

SECTION 7: ENTERPRISE CTA
  "Need custom pricing?" -- Contact sales
```
---
## Step 5: A/B Testing Prices

### Price Testing Framework
```
PRICE A/B TEST PLAN

HYPOTHESIS: Changing the price of {{plan}} from ${{current}} to
${{new_price}} will {{increase/decrease}} {{metric}} by {{pct}}%.

TEST DESIGN:
  Control: ${{current_price}}
  Variant: ${{new_price}}
  Traffic split: 50/50
  Minimum sample size: {{sample}} per variant (use statistical calculator)
  Minimum test duration: {{days}} days (at least 1 full business cycle)
  Primary metric: {{conversion_rate / revenue_per_visitor / ARPU}}
  Guardrail metrics: {{churn_rate / support_tickets / refund_rate}}

ETHICAL CONSIDERATIONS:
  - New customers only (never change price on existing customers mid-test)
  - Honor the price shown if customer converts
  - Ensure pricing is not discriminatory
  - Be transparent if asked

STATISTICAL REQUIREMENTS:
  Confidence level: 95%
  Minimum detectable effect: {{mde}}%
  Statistical test: Two-proportion z-test (for conversion)

RESULT:
  Control conversion: {{pct}}%
  Variant conversion: {{pct}}%
  Revenue per visitor (control): ${{rpv_control}}
  Revenue per visitor (variant): ${{rpv_variant}}
  Statistically significant: {{yes/no}}
  Decision: {{implement_variant / keep_control / run_longer}}
```
---
## Step 6: Discount Strategy

### Discount Framework
```
DISCOUNT STRATEGY RULES

WHEN DISCOUNTS ARE APPROPRIATE:
- Annual commitment (12+ months upfront)
- Volume commitment (higher tier or quantity)
- Strategic accounts (logo value, case study rights)
- Startup/nonprofit programs (brand goodwill)
- Seasonal promotions (time-limited)

WHEN DISCOUNTS ARE DANGEROUS:
- To close any deal (trains buyers to always ask)
- Large across-the-board discounts (erodes brand value)
- Discounts on new features (devalues innovation)
- Competitor matching (race to bottom)

DISCOUNT TIERS:
  Standard: 0% (list price is the price)
  Annual commitment: 15-20% off monthly price
  2-year commitment: 25-30% off monthly price
  Volume (10+ seats): 10-15% negotiable
  Strategic/enterprise: Up to 25% with case study rights
  Startup program: 50-90% for qualifying early-stage startups

MAXIMUM DISCOUNT AUTHORITY:
  Sales rep: Up to {{pct_1}}% without approval
  Sales manager: Up to {{pct_2}}% with justification
  VP Sales: Up to {{pct_3}}% for strategic deals
  CEO: Anything above {{pct_3}}%

DISCOUNT TRACKING:
  Track average discount by:
  - Sales rep
  - Deal size
  - Customer segment
  - Time period
  Target average discount: <{{target_avg}}%
```
---
## Step 7: Price Increase Communication

### Price Increase Playbook
```
PRICE INCREASE COMMUNICATION PLAN
PREPARATION (4-8 weeks before):
1. Document the justification (new features, costs, market adjustment)
2. Quantify value delivered since last pricing
3. Prepare FAQ for support and sales teams
4. Segment customers by risk of churn
5. Determine grandfather policy (if any)
COMMUNICATION TIMELINE:
  T-60 days: Internal alignment (sales, support, leadership)
  T-30 days: Notify customers via email (see template below)
  T-14 days: Reminder email with FAQ
  T-7 days: Personal outreach to highest-value accounts
  T-0: New pricing takes effect
  T+7 days: Follow up with any customers who have questions
EMAIL TEMPLATE:
Subject: Updates to our {{product}} pricing
Hi {{first_name}},
I am writing to let you know about an upcoming change to our pricing.
Over the past {{time_period}}, we have {{accomplishment_1}},
{{accomplishment_2}}, and {{accomplishment_3}}. These improvements
have helped customers like you {{benefit}}.
Starting {{date}}, your plan will change from ${{old_price}}/{{period}}
to ${{new_price}}/{{period}}.
Here is what this means for you:
- Your new rate takes effect on {{effective_date}}
- You will continue to have access to all features plus {{new_features}}
- If you would like to lock in a lower rate, you can switch to annual
  billing before {{deadline}} and save {{pct}}%.
deliver exceptional value, and this investment allows us to {{future_plans}}.
{{support_contact}}.
Thank you for being a valued customer.
{{sender_name}}
{{title}}
RISK MITIGATION:
- Offer annual lock-in at old price as retention tool
- Grandfather long-term customers for 3-6 months
- Provide personal outreach for top 20% of accounts by revenue
- Prepare save offers for customers who threaten to churn:
  - Tier 1 save: Extend old pricing 3 months
  - Tier 2 save: Offer annual plan at 15% discount
  - Tier 3 save: Downgrade to lower tier at same price
```
---
## Step 8: Enterprise Pricing
```
ENTERPRISE PRICING GUIDELINES

WHEN TO OFFER ENTERPRISE PRICING:
- Customer needs >{{seat_threshold}} seats
- Customer requires custom SLA, security, or compliance
- Deal size >${{deal_threshold}}/year
- Customer is a recognizable brand (logo value)

ENTERPRISE PRICING STRUCTURE:
  Base platform fee: ${{base}}/year
  Per-seat fee: ${{per_seat}}/year
  Volume tiers:
    1-50 seats: ${{tier1}}/seat
    51-200 seats: ${{tier2}}/seat
    201-500 seats: ${{tier3}}/seat
    500+: Custom

ENTERPRISE ADD-ONS:
  - SSO/SAML: ${{sso_price}}/year
  - Dedicated support: ${{support_price}}/year
  - Custom integrations: ${{integration_price}}/year
  - SLA guarantee: ${{sla_price}}/year
  - Data residency: ${{residency_price}}/year

NEGOTIATION FRAMEWORK:
  1. Start with list price -- never discount first
  2. Understand their budget and timeline
  3. Trade value for discount (case study, multi-year, references)
  4. Use total contract value, not monthly rate, for negotiation
  5. Never discount more than your maximum authority without approval
```
---
## Pricing Strategy Checklist

- [ ] Pricing model aligns with how customers perceive value
- [ ] Willingness-to-pay research has been conducted
- [ ] Pricing supports target unit economics (LTV:CAC >3:1)
- [ ] Tier structure uses proper psychological framing
- [ ] Pricing page is clear and conversion-optimized
- [ ] Discount policy is documented and enforced
- [ ] Price increase plan is prepared with communication templates
- [ ] Enterprise pricing is structured for larger accounts
- [ ] Competitive pricing is understood but not blindly followed
- [ ] Pricing is reviewed quarterly and adjusted as needed


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Pricing Strategist deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with pricing strategist for a mid-size project."

**Output:** A complete pricing strategist framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
