---
name: house-flipper
description: |
  Expert guidance for residential property flipping including acquisition strategies (MLS, auctions, wholesalers), renovation scope assessment, contractor management, budget tracking using the 70% rule, timeline planning, After Repair Value (ARV) calculation, and selling strategy for maximum profit. Use when the user asks about house flipper or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "home-buying personal-finance investing"
  category: "personal-finance"
  subcategory: "major-purchases"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# House Flipper

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to house flipper.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on house flipper
- User asks about house flipper best practices or techniques
- User wants a structured approach to house flipper

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of house flipper


## Questions to Ask First

1. What is your total available capital for this project (cash, credit lines, partnerships)?
2. Do you have experience with home renovation or construction?
3. What is your target market and price range?
4. Do you have reliable contractors already, or do you need to build a team?
5. Is this a full-time pursuit or a side project alongside other work?
6. What is your risk tolerance -- can you absorb a loss on your first project?
7. Do you have a real estate agent experienced with investment properties?
8. Have you researched local permit requirements and timelines?
9. What is your target timeline from purchase to sale?
10. Do you have a holding cost budget if the property does not sell quickly?

---

## Phase 1: The 70% Rule and Deal Analysis

### The 70% Rule

```
Maximum Purchase Price = (ARV x 70%) - Renovation Costs

ARV = After Repair Value (what the home will be worth fully renovated)

Example:
  ARV: $300,000
  70% of ARV: $210,000
  Estimated Renovation: $50,000
  Maximum Purchase Price: $210,000 - $50,000 = $160,000
```

**The 30% margin covers:**
- Buying closing costs (1-3%)
- Holding costs (mortgage, taxes, insurance, utilities during renovation)
- Selling costs (agent commissions 5-6%, seller closing costs 1-2%)
- Profit margin (target 10-15% of ARV minimum)
- Contingency buffer for unexpected costs

### ARV Calculation

**Step 1:** Find 3-5 comparable renovated properties that have sold within the last 3-6 months.

**Comparable criteria:**
- Within 0.5-1 mile of subject property
- Similar square footage (within 10%)
- Same bedroom/bathroom count (or close)
- Similar lot size
- Same general neighborhood quality
- Renovated to similar level as your planned renovation

**Step 2:** Adjust comparables for differences (see Home Seller Guide CMA adjustments).

**Step 3:** Calculate average adjusted price per square foot and apply to your property.

```
ARV Calculation Worksheet:
Comp 1: _________ address, sold $_______, $/sqft: $_______
Comp 2: _________ address, sold $_______, $/sqft: $_______
Comp 3: _________ address, sold $_______, $/sqft: $_______
Average $/sqft after adjustments: $_______
Subject property sqft: _______
Estimated ARV: $_______
```

### Full Flip Profitability Analysis

```
FLIP DEAL ANALYSIS
==================
Property Address: _________________________________

ACQUISITION:
  Purchase Price:                      $__________
  Closing Costs (buying):             $__________
  Total Acquisition Cost:              $__________

RENOVATION:
  Renovation Budget:                   $__________
  Contingency (15-20%):               $__________
  Total Renovation Cost:               $__________

HOLDING COSTS (Monthly x Estimated Months):
  Mortgage/Hard Money Payment:         $__________
  Property Taxes:                      $__________
  Insurance:                           $__________
  Utilities:                           $__________
  HOA (if applicable):                $__________
  Lawn/Snow/Maintenance:               $__________
  Monthly Holding Total:               $__________
  Estimated Hold Time: _____ months
  Total Holding Costs:                 $__________

SELLING COSTS:
  Agent Commission (5-6%):            $__________
  Closing Costs (selling):            $__________
  Staging:                             $__________
  Photography:                         $__________
  Total Selling Costs:                 $__________

SUMMARY:
  Expected Sale Price (ARV):           $__________
  Total Project Costs:                 $__________
  Estimated Profit:                    $__________
  ROI (Profit / Total Cash Invested):  _________%
  Profit Margin (Profit / ARV):        _________%
```

---

## Phase 2: Acquisition Strategies

### Finding Deals: Source Comparison

| Source | Discount Potential | Competition | Effort Required | Best For |
|--------|-------------------|-------------|-----------------|----------|
| MLS (listed properties) | 5-15% below market | High | Low | Beginning flippers |
| Wholesalers | 15-30% below market | Medium | Medium | Consistent deal flow |
| Auctions (foreclosure) | 20-40% below market | Medium-High | High | Experienced flippers |
| Direct mail/marketing | 20-40% below market | Low | Very High | Serious full-time flippers |
| Driving for dollars | 15-30% below market | Low | High | Local market knowledge |
| Probate/estate sales | 10-25% below market | Low-Medium | Medium | Patient investors |
| Bank REOs | 10-25% below market | Medium | Medium | All experience levels |
| Tax lien sales | Varies widely | Medium | High | Experienced investors |

### MLS Deal Finding Strategy
- Set alerts for keywords: "investor special," "as-is," "estate sale," "needs TLC," "handyman special"
- Filter for properties with 30+ days on market
- Look for price reductions
- Focus on the ugliest homes in the best neighborhoods
- Properties with expired listings may have motivated sellers

### Auction Buying Checklist
- [ ] Research auction type (foreclosure, tax sale, estate)
- [ ] Inspect exterior thoroughly (interior access may be limited)
- [ ] Research title (liens, judgments, back taxes)
- [ ] Set maximum bid before the auction and do not exceed it
- [ ] Understand payment terms (often cash or cashier's check within 24-48 hours)
- [ ] Factor in unknown interior condition into your budget
- [ ] Have funds verified and ready before bidding
- [ ] Understand "as-is" terms and eviction requirements

### Working with Wholesalers
- Build relationships with 3-5 active wholesalers in your market
- Verify their ARV and repair estimates independently
- Always inspect the property yourself before committing
- Negotiate -- wholesale prices have markup built in
- Close quickly and reliably to get first access to future deals
- Check assignment fee transparency

---

## Phase 3: Renovation Scope Assessment

### Property Walkthrough Evaluation

**Structural Assessment (Major Cost Items):**
- [ ] Foundation: Cracks, settling, water intrusion, bowing walls
- [ ] Roof: Age, missing shingles, sagging, leaks, remaining life
- [ ] Framing: Load-bearing wall identification, structural integrity
- [ ] Grading and drainage: Water flow away from foundation

**Systems Assessment:**
- [ ] Electrical: Panel amperage (100A minimum for modern), wiring type (copper vs aluminum vs knob-and-tube), outlet count
- [ ] Plumbing: Pipe material (copper, PEX, galvanized, polybutylene), water pressure, drain condition
- [ ] HVAC: Age, condition, efficiency, ductwork condition
- [ ] Water heater: Age, capacity, type

**Cosmetic Assessment:**
- [ ] Flooring: Condition under carpet, hardwood salvageable?
- [ ] Walls: Drywall condition, texture, damage
- [ ] Kitchen: Layout, cabinets (reface vs replace), countertops, appliances
- [ ] Bathrooms: Fixtures, tile, vanities, layout
- [ ] Paint: Interior and exterior condition
- [ ] Windows: Condition, seal integrity, style/age
- [ ] Doors: Interior and exterior condition

### Renovation Cost Estimating Guide

| Project | Budget Range | Timeline |
|---------|-------------|----------|
| Full kitchen renovation | $15,000-$50,000 | 3-6 weeks |
| Kitchen cosmetic update | $5,000-$15,000 | 1-2 weeks |
| Full bathroom renovation | $8,000-$25,000 | 2-4 weeks |
| Bathroom cosmetic update | $2,000-$8,000 | 1-2 weeks |
| Roof replacement | $5,000-$15,000 | 2-5 days |
| HVAC replacement | $3,000-$10,000 | 1-3 days |
| Electrical panel upgrade | $1,500-$4,000 | 1-2 days |
| Full house paint (interior) | $3,000-$8,000 | 3-7 days |
| Flooring (whole house) | $5,000-$20,000 | 3-7 days |
| New windows (whole house) | $5,000-$20,000 | 1-3 days |
| Landscaping refresh | $1,000-$5,000 | 1-3 days |
| Siding replacement | $5,000-$15,000 | 1-2 weeks |
| Foundation repair | $5,000-$30,000+ | 1-4 weeks |
| Driveway replacement | $3,000-$8,000 | 2-5 days |

### Renovation Tiers: What Level of Finish?

**Tier 1 - Cosmetic Flip (lowest cost, fastest):**
Paint, flooring, fixtures, hardware, landscaping, cleaning. Budget: $10,000-$25,000.

**Tier 2 - Mid-Level Renovation:**
Everything in Tier 1 plus kitchen update (new counters, backsplash, appliances), bathroom updates, some mechanical work. Budget: $25,000-$60,000.

**Tier 3 - Full Renovation:**
Everything in Tier 2 plus layout changes, new kitchen/bathrooms, new systems (HVAC, electrical, plumbing), windows, roof. Budget: $60,000-$150,000+.

**Match renovation level to the neighborhood.** Do not over-improve for the area.

---

## Phase 4: Contractor Management

### Finding and Vetting Contractors

**Finding contractors:**
- Referrals from other investors (best source)
- Local real estate investor meetups and groups
- Licensed contractor directories (state licensing boards)
- Supplier referrals (lumber yards, plumbing supply houses)

**Vetting checklist for each contractor:**
- [ ] Verify active license (check state licensing board)
- [ ] Verify insurance (general liability + workers' comp)
- [ ] Check references (call 3+ recent clients)
- [ ] Review portfolio of completed work
- [ ] Get detailed written bid (not just a total number)
- [ ] Verify no complaints with BBB or state consumer protection
- [ ] Start with a small job to test reliability and quality

### Bid Comparison Template

```
Project: ___________________

                    Contractor A  Contractor B  Contractor C
Company Name:       ___________   ___________   ___________
License #:          ___________   ___________   ___________
Insurance Verified: Y / N         Y / N         Y / N
Total Bid:          $__________   $__________   $__________
Materials Included: Y / N         Y / N         Y / N
Timeline:           ____ weeks    ____ weeks    ____ weeks
Payment Terms:      ___________   ___________   ___________
Warranty:           ___________   ___________   ___________
References Checked: Y / N         Y / N         Y / N
```

### Payment Structure Best Practices
- **Never pay more than 10-20% upfront** (for materials)
- Structure payments based on milestones, not time
- Hold 10% retainage until final punch list is complete
- Pay for completed work only after inspection
- Use a written contract specifying scope, timeline, materials, and payment schedule

### Common Contractor Issues and Solutions
| Issue | Prevention | Response |
|-------|-----------|----------|
| Going over budget | Detailed scope and fixed-price contract | Change order process with written approval |
| Missing deadlines | Penalty clause in contract | Weekly check-ins, escalation process |
| Poor quality work | Clear specifications, reference photos | Do not pay until corrected, get independent opinion |
| No-shows | Multiple contractor relationships | Backup contractors identified in advance |
| Scope creep | Detailed contract, change order process | Written approval required for any additions |

---

## Phase 5: Budget Tracking

### Project Budget Tracker

```
RENOVATION BUDGET TRACKER
=========================
Property: _________________________________
Original Budget: $__________
Contingency (20%): $__________
Total Approved Budget: $__________

Category          | Budget    | Actual    | Variance  | Status
------------------+-----------+-----------+-----------+--------
Demolition        | $________ | $________ | $________ | ______
Structural        | $________ | $________ | $________ | ______
Electrical        | $________ | $________ | $________ | ______
Plumbing          | $________ | $________ | $________ | ______
HVAC              | $________ | $________ | $________ | ______
Framing/Drywall   | $________ | $________ | $________ | ______
Insulation        | $________ | $________ | $________ | ______
Roofing           | $________ | $________ | $________ | ______
Windows/Doors     | $________ | $________ | $________ | ______
Kitchen           | $________ | $________ | $________ | ______
Bathrooms         | $________ | $________ | $________ | ______
Flooring          | $________ | $________ | $________ | ______
Paint             | $________ | $________ | $________ | ______
Fixtures/Hardware | $________ | $________ | $________ | ______
Landscaping       | $________ | $________ | $________ | ______
Permits/Fees      | $________ | $________ | $________ | ______
Miscellaneous     | $________ | $________ | $________ | ______
------------------+-----------+-----------+-----------+--------
TOTALS            | $________ | $________ | $________ |
Contingency Used  | $________ |
Remaining Budget  | $________ |
```

---

## Phase 6: Timeline Planning

### Typical Flip Timeline

| Phase | Duration | Activities |
|-------|----------|-----------|
| Acquisition | 2-4 weeks | Due diligence, closing |
| Planning | 1-2 weeks | Design, permits, ordering materials, contractor scheduling |
| Demolition | 3-7 days | Tear-out, debris removal |
| Rough work | 2-4 weeks | Framing, electrical, plumbing, HVAC, inspections |
| Insulation/Drywall | 1-2 weeks | Install, tape, mud, sand, prime |
| Finish work | 3-6 weeks | Flooring, tile, cabinets, counters, trim, paint, fixtures |
| Final details | 1-2 weeks | Punch list, cleaning, staging, photography |
| Sale | 2-8 weeks | Listing, showings, offer, closing |
| **Total** | **3-6 months** | Varies significantly by scope |

### Timeline Management Tips
- Build in 2-week buffer between phases
- Order materials early (lead times can be 2-8 weeks for some items)
- Schedule inspections immediately when ready (can have multi-day waits)
- Have backup plans for weather delays (exterior work)
- Track critical path items that block other work
- Hold weekly project meetings with contractors

---

## Phase 7: Selling Strategy

### Pre-Listing Preparation
- [ ] Professional staging (budget $1,500-$5,000; or virtual staging $200-$500)
- [ ] Professional photography and videography
- [ ] 3D virtual tour (Matterport or similar)
- [ ] Clean and detail entire property
- [ ] Final landscaping and curb appeal
- [ ] Touch up any construction wear
- [ ] All systems and appliances tested and operational
- [ ] Compile renovation documentation for buyers

### Pricing a Flip
- Price at or slightly below ARV to generate immediate interest
- Create a "just completed" urgency
- Highlight all new/updated systems and finishes in listing
- Provide home warranty to give buyers confidence
- Consider pre-listing appraisal to support your price

### If It Is Not Selling

| Days on Market | Action |
|---------------|--------|
| 0-14 | Monitor showing traffic and feedback |
| 14-21 | Adjust marketing, add virtual tour if missing |
| 21-30 | Consider 3-5% price reduction |
| 30-45 | Evaluate staging changes, second price reduction |
| 45-60 | Consider renting until market improves |
| 60+ | Aggressive price reduction or pivot to rental |

---

## Common Flip Mistakes

1. **Overestimating ARV** -- use conservative comps and account for market shifts
2. **Underestimating renovation costs** -- always add 15-20% contingency
3. **Ignoring holding costs** -- they erode profit every month
4. **Over-improving for the neighborhood** -- match finishes to comparable sales
5. **Skipping inspections before purchase** -- unknown issues destroy budgets
6. **Not having enough reserves** -- unexpected costs are the norm, not the exception
7. **Doing too much yourself** -- your time has value; contractors are faster
8. **Emotional attachment to design choices** -- renovate for the target buyer, not yourself
9. **Ignoring permits** -- unpermitted work creates liability and can block sales
10. **Not having an exit strategy** -- if it won't sell, can you rent it profitably?

---

## Exit Strategy Planning

Always have a backup plan:

**Plan A:** Sell at target ARV for full profit
**Plan B:** Reduce price to break even or small profit
**Plan C:** Rent the property until market improves (ensure cash flow covers holding costs)
**Plan D:** Refinance into long-term financing and hold as rental
**Plan E:** Sell to another investor at wholesale price (minimize loss)

Run numbers for each exit strategy before purchasing. If the property only works under Plan A, the deal may be too risky.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[House Flipper deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with house flipper for a mid-size project."

**Output:** A complete house flipper framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
