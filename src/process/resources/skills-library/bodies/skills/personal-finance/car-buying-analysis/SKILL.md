---
name: car-buying-analysis
description: |
  Evaluates buying vs. leasing vs. financing a vehicle by computing total cost
  of ownership for each option. Factors in depreciation, insurance, maintenance,
  fuel, opportunity cost, and financing charges. Produces a side-by-side
  comparison using numbers the user provides from their actual options.
  Use when the user asks about buying vs. leasing a car, wants to calculate the
  true cost of vehicle ownership, or is comparing car financing options.
  Do NOT use for general major purchase decisions (use major-purchase-decision),
  comparing insurance policies (use insurance-comparison), or loan comparison
  math (use loan-comparison from financial literacy skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance analysis planning budgeting"
  category: "personal-finance"
  subcategory: "major-purchases"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Car Buying Analysis

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User asks about buying vs. leasing a vehicle
- User wants to calculate the total cost of owning a car
- User is comparing financing options for a vehicle purchase
- User asks whether to buy new, buy used, or lease
- User wants to understand all the costs beyond the sticker price

**Do NOT use this skill when:**
- User wants a general buy-or-wait framework for any purchase (use `major-purchase-decision`)
- User wants to compare insurance quotes specifically (use `insurance-comparison`)
- User wants to compare loan terms in general (use `loan-comparison`)
- User is asking about commercial fleet or business vehicle decisions (out of scope)

## Process

1. **Identify the user's vehicle options.** Collect:
   - **Option A: Buy (new or used)** -- Purchase price, planned financing terms
   - **Option B: Lease** -- Monthly payment, term, mileage allowance, residual
   - **Option C: Buy (alternative vehicle or used vs. new)** -- For three-way comparison
   - **Planned ownership/usage period:** How many years will they keep the vehicle or how long is the lease?
   - **Annual mileage estimate:** How many miles/km per year?
   - **Current vehicle (if any):** Trade-in value, remaining loan balance

2. **Calculate purchase costs (Buy option).** Break down the total cost:

   **Upfront Costs:**
   - Purchase price (after negotiation)
   - Sales tax [JURISDICTION: verify rate and calculation method]
   - Registration and title fees [JURISDICTION: verify amounts]
   - Down payment
   - Trade-in credit (reduces out-of-pocket)

   **Financing Costs (if financed):**
   ```
   Monthly payment = Loan amount * [r(1+r)^n] / [(1+r)^n - 1]
   Total interest = (Monthly payment * n) - Loan amount
   ```
   Where r = monthly rate, n = number of months

   **Ongoing Costs (annual, multiplied by ownership years):**
   - Insurance premiums (get a quote for the specific vehicle)
   - Fuel costs: Annual miles / fuel efficiency * price per unit
   - Maintenance: Scheduled maintenance + estimated repairs (increases with age)
   - Registration renewal [JURISDICTION: verify annual cost]

   **Depreciation:**
   - Estimated value at end of ownership period
   - Depreciation cost = Purchase price - Resale value at end of period
   - This is the largest cost for most vehicles, especially new ones

3. **Calculate lease costs (Lease option).** Break down the total cost:

   **Lease Payments:**
   - Monthly payment * lease term months
   - Down payment / drive-off amount
   - Acquisition fee (often rolled into payment)

   **Additional Lease Costs:**
   - Excess mileage charges: (Expected miles - Allowed miles) * per-mile charge [if applicable]
   - Wear and tear charges at turn-in (estimate)
   - Disposition fee at lease end [JURISDICTION: verify if typical]
   - Insurance requirements may be higher for leased vehicles

   **Ongoing Costs (same categories as buy):**
   - Insurance (may be higher for leased vehicle)
   - Fuel costs
   - Maintenance (usually under warranty for lease term)

   **At Lease End:**
   - Option to purchase at residual value
   - Option to return (no equity retained)
   - Option to lease a new vehicle (resets the cycle)

4. **Build the total cost of ownership comparison.** For the same time period:

   ```
   Total Cost of Ownership =
     Depreciation (or lease payments + fees)
   + Financing interest (if financed)
   + Insurance (total over period)
   + Fuel (total over period)
   + Maintenance (total over period)
   + Taxes and fees
   - Resale value (for purchase options)
   ```

   Express as:
   - Total cost over the comparison period
   - Monthly equivalent cost (total / months)
   - Cost per mile (total / total miles driven)

5. **Calculate the opportunity cost.** The difference in upfront costs between options could be invested:
   - If buying requires a larger down payment than leasing, the difference has an opportunity cost
   - Calculate what that difference would grow to if invested at a user-provided assumed rate (this is an educational exercise, not a guarantee)

6. **Present the decision factors beyond cost.** Cost is not the only consideration:

   | Factor | Buy (New) | Buy (Used) | Lease |
   |--------|-----------|-----------|-------|
   | Equity | Builds equity | Builds equity | No equity |
   | Customization | Full freedom | Full freedom | Restricted |
   | Mileage | No limit | No limit | Limited by contract |
   | Maintenance | Owner's responsibility | Owner's responsibility | Often under warranty |
   | Commitment | Long-term | Long-term | Term-based, can switch |
   | Monthly payment | Typically highest | Lower than new | Often lowest |
   | End of term | Own the vehicle | Own the vehicle | Return or purchase |

7. **Produce the comparison summary.**

## Output Format

```
## Vehicle Cost Comparison

### Options Being Compared
| Detail | Option A: [Buy/Lease] | Option B: [Buy/Lease] |
|--------|----------------------|----------------------|
| Vehicle | [year make model] | [year make model] |
| Price / Lease payment | $[amount] | $[amount/mo] |
| Down payment | $[amount] | $[amount] |
| Term | [months] months | [months] months |
| Interest rate / Money factor | [rate]% | [rate/factor] |
| Annual mileage | [miles] | [miles (limit: X)] |

### Total Cost of Ownership ([X]-Year Comparison)

| Cost Category | Option A | Option B |
|---------------|--------:|--------:|
| Purchase price / Total lease payments | $[amount] | $[amount] |
| Sales tax | $[amount] | $[included or amount] |
| Registration and fees | $[amount] | $[amount] |
| Financing interest | $[amount] | $[N/A or amount] |
| Insurance ([X] years) | $[amount] | $[amount] |
| Fuel ([X] years) | $[amount] | $[amount] |
| Maintenance ([X] years) | $[amount] | $[amount] |
| Lease-end fees | N/A | $[amount] |
| Excess mileage charges | N/A | $[amount or N/A] |
| **Subtotal costs** | **$[amount]** | **$[amount]** |
| Less: Resale value | -$[amount] | $0 (no equity) |
| **Net cost of ownership** | **$[amount]** | **$[amount]** |

### Cost Metrics

| Metric | Option A | Option B |
|--------|--------:|--------:|
| Net cost over [X] years | $[amount] | $[amount] |
| Monthly equivalent | $[amount] | $[amount] |
| Cost per mile | $[amount] | $[amount] |
| Difference | $[amount less/more] | -- |

### Opportunity Cost Analysis
- Upfront cost difference: $[amount]
- If invested at [user's assumed rate]% for [term] years: $[projected value]
- This represents the cost of having more capital tied up in one option

### Non-Cost Decision Factors

| Factor | Option A | Option B |
|--------|----------|----------|
| Equity at end of term | $[resale value] | $0 |
| Mileage restrictions | None | [limit] per year |
| Customization freedom | Full | Restricted |
| Maintenance coverage | [User's responsibility] | [Warranty status] |
| Flexibility to switch | Sell anytime | Locked until term end |

### Summary
Based on the numbers you provided:
- Option A costs $[total] over [period] ([monthly equivalent]/month)
- Option B costs $[total] over [period] ([monthly equivalent]/month)
- The difference is $[amount] over [period]
- [Note about equity, flexibility, or other non-cost factors that differ]

### Next Steps
- [ ] Get insurance quotes for each specific vehicle
- [ ] Verify fuel efficiency ratings from official sources
- [ ] Research maintenance schedules and typical costs for each vehicle
- [ ] Check trade-in value if you have a current vehicle
- [ ] Read all lease terms carefully (mileage limits, wear standards, fees)
- [ ] Consider your plans for the next [X] years (job stability, family changes, relocations)
```

## Rules

1. NEVER recommend buying, leasing, or a specific vehicle -- present the comparison and let the user decide
2. NEVER name specific dealerships, lenders, or financial institutions
3. ALWAYS include depreciation as the largest cost component for purchased vehicles
4. ALWAYS compare options over the same time period for a fair comparison
5. ALWAYS include insurance, fuel, and maintenance in the total cost -- not just the purchase/lease price
6. Include the opportunity cost of larger upfront payments
7. Show cost per mile as a normalized comparison metric
8. If comparing buy vs. lease, note that the user has equity at the end of a purchase but not a lease
9. For leases, include potential excess mileage and wear charges in the total cost estimate
10. Present non-cost factors alongside the financial comparison

## Edge Cases

- **User is comparing new vs. used (both purchases):** Focus on depreciation difference (new vehicles depreciate faster in early years), maintenance costs (used vehicles typically cost more to maintain), and warranty coverage differences. The same total cost framework applies.
- **User drives significantly more or less than average:** High-mileage drivers face larger depreciation, higher fuel costs, and more maintenance. Leases may incur costly excess mileage charges. Low-mileage drivers may find leasing less risky but should verify they are not paying for unused miles.
- **User plans to keep the car for 10+ years:** Long ownership periods favor buying because the cost per year decreases as the vehicle is paid off and depreciation slows. Show the year-by-year cost curve.
- **User has a large trade-in or down payment:** Factor the trade-in value into the purchase calculation. Note that a large down payment on a lease (more than a few months' payments) is risky -- if the car is totaled, the down payment may be lost.
- **User is considering cash purchase (no financing):** Remove the financing interest line. Add the opportunity cost calculation: that cash could be earning returns if invested instead. Present both the cash-purchase total cost and the financed total cost.
- **Electric or hybrid vehicle:** Adjust the fuel cost calculation for electricity costs or mixed fuel/electric usage. Note that EVs typically have lower maintenance costs (no oil changes, fewer brake replacements) but higher purchase prices and potential battery replacement costs.

## Example

**Input:** "I'm trying to decide between buying a $35,000 car with a 5-year loan at 5.9% or leasing the same car for $399/month for 36 months with $2,000 down. I drive about 12,000 miles a year."

**Output:**

## Vehicle Cost Comparison

### Options Being Compared (5-Year Comparison Period)

| Detail | Option A: Buy (Finance) | Option B: Lease (3 years) |
|--------|------------------------|--------------------------|
| Vehicle price / payment | $35,000 | $399/month |
| Down payment | $3,000 (assumed) | $2,000 |
| Term | 60 months (5 years) | 36 months (3 years) |
| Interest rate | 5.9% | Included in payment |
| Annual mileage | 12,000 (no limit) | 12,000 (verify limit) |

Note: For a fair comparison over 5 years, Option B requires estimating what happens in years 4-5 (new lease, buy, or other vehicle).

### Total Cost of Ownership (5-Year Comparison)

**Option A: Buy and Own for 5 Years**

| Cost Category | Amount |
|---------------|-------:|
| Purchase price | $35,000 |
| Sales tax | [JURISDICTION: verify rate] * $35,000 |
| Registration (5 years) | [JURISDICTION: verify annual cost] * 5 |
| Loan interest (60 months at 5.9%) | $5,236 |
| Insurance (5 years, estimated) | $[get quote] * 5 |
| Fuel (60,000 miles at user's efficiency) | $[calculate] |
| Maintenance (5 years) | $[estimate based on vehicle] |
| **Subtotal costs** | **$[total]** |
| Less: Resale value at year 5 | -$[estimate -- typically 40-50% of purchase price for a 5-year-old vehicle] |
| **Net cost** | **$[total]** |

Monthly loan payment: $35,000 financed at 5.9% for 60 months = **$676/month**

**Option B: Lease for 3 Years + Estimate Years 4-5**

| Cost Category | Years 1-3 (Lease) | Years 4-5 (Estimate) | Total |
|---------------|------------------:|--------------------:|------:|
| Lease payments (36 * $399) | $14,364 | -- | $14,364 |
| Down payment | $2,000 | -- | $2,000 |
| Disposition fee | $[verify with dealer] | -- | $[amount] |
| New lease or purchase (years 4-5) | -- | $[estimate] | $[amount] |
| Insurance (5 years) | $[amount] | $[amount] | $[total] |
| Fuel (60,000 miles) | $[calculate] | $[calculate] | $[total] |
| Maintenance (covered by warranty + years 4-5) | $[minimal] | $[estimate] | $[total] |
| **Net cost** | | | **$[total]** |

### Cost Metrics

| Metric | Buy | Lease (5-year estimate) |
|--------|----:|----------------------:|
| Monthly cost equivalent | $[amount] | $[amount] |
| Cost per mile (60,000 miles) | $[amount] | $[amount] |
| Equity at year 5 | $[resale value] | $0 |

### Key Observations
- Monthly payment: Lease ($399) is lower than loan ($676) during their respective terms
- But the lease resets at month 37 -- you start paying again with no equity
- After 5 years of buying, the car is paid off and you own a vehicle worth approximately $[estimate]
- After 5 years of leasing, you have paid $[total] and own nothing

### Next Steps
- [ ] Get insurance quotes for this specific vehicle
- [ ] Verify the lease mileage limit (12,000/year is common but confirm)
- [ ] Calculate excess mileage charges if you might exceed the limit
- [ ] Research the resale value of this vehicle at 5 years
- [ ] Factor in your plans: will you keep the car beyond 5 years?
- [ ] Read the full lease contract for all fees and restrictions
