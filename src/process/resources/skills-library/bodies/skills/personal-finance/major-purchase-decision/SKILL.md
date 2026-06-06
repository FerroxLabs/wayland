---
name: major-purchase-decision
description: |
  Applies a structured buy/wait/skip decision framework to any large purchase.
  Evaluates affordability, needs vs. wants, financing cost, opportunity cost,
  and timing. Produces a scored decision matrix using the user's actual numbers
  and priorities without recommending the outcome.
  Use when the user asks about making a large purchase, is deciding whether to
  buy something expensive, or wants a framework for evaluating a significant
  spending decision.
  Do NOT use for home buying (use home-buying-checklist), car buying specifically
  (use car-buying-analysis), or insurance decisions (use insurance-comparison).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance budgeting decision-making analysis planning"
  category: "personal-finance"
  subcategory: "major-purchases"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---

# Major Purchase Decision Framework

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User is considering a large purchase and wants help deciding
- User asks whether they should buy something expensive
- User wants a framework for evaluating a significant spending decision
- User is debating buy now vs. wait vs. skip entirely
- User wants to understand the true cost of a major purchase including financing and opportunity cost

**Do NOT use this skill when:**
- User is buying a home (use `home-buying-checklist` for the process, `mortgage-comparison` for financing)
- User is buying or leasing a car (use `car-buying-analysis`)
- User is comparing insurance policies (use `insurance-comparison`)
- User needs budgeting help (use `budget-planning`)

## Process

1. **Identify the purchase and context.** Gather:
   - **What:** What are they considering purchasing?
   - **Cost:** What is the total price (including tax, delivery, installation, accessories)?
   - **Financing:** Cash, credit, payment plan, loan? What are the financing terms?
   - **Urgency:** Is there a time constraint (sale ending, seasonal need, moving deadline)?
   - **Current financial position:** Monthly income, savings, existing debt, emergency fund status

2. **Run the Affordability Check.** Determine if the purchase is financially feasible:

   **Test 1: Cash Position**
   - Can you pay for this in cash without depleting your emergency fund?
   - Emergency fund minimum: 3-6 months of essential expenses (user defines their target)
   - If paying cash would bring savings below the emergency fund target: flag as a risk

   **Test 2: Impact on Monthly Budget**
   - If financing: what is the monthly payment?
   - Monthly payment as percentage of take-home income: _____%
   - Does this payment fit within the user's budget without cutting essential categories?
   - Does the user have existing debt payments that constrain capacity?

   **Test 3: The 30-Day Rule**
   - Has the user wanted this item for at least 30 days?
   - Impulse purchases over a significant threshold (user defines) benefit from a waiting period
   - This is not about denying the purchase -- it is about confirming the want is persistent

3. **Evaluate Needs vs. Wants.** Help the user classify the purchase:

   | Classification | Definition | Examples |
   |---------------|-----------|---------|
   | Need | Required for basic function, safety, or livelihood | Replacing a broken appliance, work equipment, transportation |
   | Strong want | Significantly improves quality of life or enables important goals | Upgrade that saves time daily, equipment for a serious hobby |
   | Nice-to-have | Enjoyable but life functions fine without it | Latest model when current works, luxury upgrade |

   The classification does not determine the decision -- strong wants are valid reasons to spend. But it does affect how to weight urgency and alternatives.

4. **Calculate the True Cost.** Go beyond the sticker price:

   **Financing Cost:**
   ```
   If paying with credit card or loan:
   Total interest = Total payments - Principal
   True cost = Purchase price + Interest + Fees
   ```

   **Opportunity Cost:**
   ```
   If this money were saved/invested instead:
   Future value = Purchase amount * (1 + assumed annual rate)^years
   Opportunity cost = Future value - Purchase amount
   ```
   This shows what the money could become. It is not a reason to never buy anything -- it is a factor to weigh.

   **Ongoing Costs:**
   - Maintenance, insurance, subscriptions, consumables
   - Calculate annual ongoing cost and total over expected useful life
   - Total cost of ownership = Purchase price + Financing + Ongoing costs over ownership period

   **Cost Per Use (if applicable):**
   ```
   Estimated uses over lifetime = ____
   Cost per use = Total cost of ownership / Total uses
   ```

5. **Explore Alternatives.** Before the buy/wait/skip decision:
   - **Buy used or refurbished:** Same item at a lower price? What is the cost savings vs. risk?
   - **Buy a lesser version:** Does a less expensive option meet the core need?
   - **Rent or borrow:** For occasional-use items, is renting more cost-effective?
   - **Repair what you have:** Can the current item be repaired instead of replaced?
   - **Wait for a sale or model change:** Is there a predictable price drop coming?

6. **Build the Decision Matrix.** Score each option across weighted criteria:

   | Criterion | Weight (user assigns) | Buy Now | Buy Later | Alternative | Skip |
   |-----------|----------------------|---------|-----------|-------------|------|
   | Meets core need | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
   | Affordability | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
   | Timing advantage | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
   | Total cost | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |
   | Risk/regret | [1-5] | [1-5] | [1-5] | [1-5] | [1-5] |

   Weighted score = Sum of (Weight * Score) for each option.

7. **Present the analysis without a recommendation.** Show all the data and let the user decide.

## Output Format

```
## Major Purchase Decision Analysis

### The Purchase
- Item: [description]
- Total price (including tax, delivery, etc.): $[amount]
- Financing method: [cash / credit / loan at X% for Y months]

### Affordability Check

| Test | Result | Status |
|------|--------|--------|
| Cash available after purchase | $[remaining savings] | [OK / Below emergency fund target] |
| Monthly payment (if financed) | $[amount] | [X]% of take-home income |
| 30-day rule | [Passed / Not yet -- consider waiting] | [OK / Flag] |
| Budget impact | [Fits / Requires cuts to: ____] | [OK / Flag] |

### Needs vs. Wants Classification
Classification: [Need / Strong Want / Nice-to-Have]
Reasoning: [Why this classification based on user's description]

### True Cost Calculation

| Component | Amount |
|-----------|-------:|
| Purchase price (incl. tax) | $[amount] |
| Financing interest | $[amount or $0 if cash] |
| Ongoing annual costs | $[amount] * [years] = $[total] |
| **Total cost of ownership** | **$[amount]** |

**Opportunity Cost:** If invested instead at [user's rate]% for [years] years:
$[purchase amount] could grow to $[future value], a difference of $[opportunity cost]

**Cost Per Use** (if applicable):
$[total cost] / [estimated uses] = $[cost per use]

### Alternatives Explored

| Option | Cost | Meets Need? | Tradeoffs |
|--------|-----:|-------------|-----------|
| Buy new (original plan) | $[amount] | [yes/partially] | [notes] |
| Buy used/refurbished | $[amount] | [yes/partially] | [notes] |
| Lesser version | $[amount] | [yes/partially] | [notes] |
| Rent/borrow | $[amount] | [yes/partially] | [notes] |
| Repair current | $[amount] | [yes/partially] | [notes] |
| Wait for sale | $[estimate] | [yes/partially] | [notes] |
| Skip entirely | $0 | [no] | [notes] |

### Decision Matrix

| Criterion | Weight | Buy Now | Buy Later | Alternative | Skip |
|-----------|:------:|:-------:|:---------:|:-----------:|:----:|
| Meets core need | [W] | [S] | [S] | [S] | [S] |
| Affordability | [W] | [S] | [S] | [S] | [S] |
| Timing advantage | [W] | [S] | [S] | [S] | [S] |
| Total cost | [W] | [S] | [S] | [S] | [S] |
| Risk of regret | [W] | [S] | [S] | [S] | [S] |
| **Weighted Total** | | **[total]** | **[total]** | **[total]** | **[total]** |

### Summary of Analysis
- The total cost of this purchase (including financing and ongoing costs) is $[amount]
- This represents [X]% of your monthly income ([X] months of savings)
- Your affordability check [passed all tests / flagged: X]
- The highest-scoring option in your decision matrix is [option] at [score]
- The next-closest option is [option] at [score]

### Questions to Consider
- [Specific question about their situation]
- [Question about timing or alternatives]
- [Question about financial impact]

### Next Steps
- [ ] Complete the affordability tests with your actual numbers
- [ ] Score the decision matrix based on your personal weights
- [ ] If buying: negotiate the best price and terms
- [ ] If waiting: set a calendar reminder to reassess in [timeframe]
- [ ] If skipping: redirect the money to [savings goal or debt payoff]
```

## Rules

1. NEVER recommend buy, wait, or skip -- present the analysis and let the user decide
2. NEVER judge the user's purchase as unnecessary or frivolous -- apply the framework neutrally
3. ALWAYS include the affordability check before any other analysis
4. ALWAYS calculate total cost of ownership, not just the purchase price
5. ALWAYS include at least 3 alternatives (used, lesser version, rent/borrow, wait, repair)
6. Include the opportunity cost calculation as one factor, not the deciding factor
7. Include the cost-per-use metric for items that will be used repeatedly
8. Let the user assign weights in the decision matrix -- do not prescribe weights
9. The 30-day rule is a suggestion for impulse purchases, not a mandate
10. If the purchase is a clear need (broken essential appliance), streamline the analysis -- skip the needs/wants debate

## Edge Cases

- **Purchase is under financial duress (broken essential item):** Streamline the process. Skip the 30-day rule and needs/wants analysis. Focus on affordability and alternatives (repair, used, rent). The need is established -- the decision is how to meet it at the lowest cost.
- **User is considering a luxury purchase they can clearly afford:** The framework still applies but the emphasis shifts to opportunity cost and alternatives, not affordability. Wealthy users still benefit from thinking about total cost and alternatives.
- **Financing at 0% interest (promotional rate):** Include the risk of the rate reverting if a payment is missed. Calculate what happens if the promotional period ends with a balance remaining [JURISDICTION: verify promotional financing rules]. The "true cost" of 0% financing is only zero if all conditions are met.
- **Business purchase with tax implications:** Note that business purchases may be deductible [JURISDICTION: verify business expense deduction rules]. The after-tax cost may be lower than the sticker price. This does not change the framework but affects the true cost calculation.
- **Couple or family disagreeing about the purchase:** Run the decision matrix separately for each person and compare results. The divergence in weights and scores reveals where they disagree, which is more productive than arguing about the conclusion.
- **User has already decided and wants validation:** Apply the framework anyway. If the numbers support the decision, the user has confirmation. If the numbers reveal a concern, the user has new information. Either way, the framework adds value.

## Example

**Input:** "I'm thinking about buying a $2,500 standing desk setup for my home office. I work from home full time. I currently use a $200 desk that's fine but not ergonomic. Should I buy it?"

**Output:**

## Major Purchase Decision Analysis

### The Purchase
- Item: Standing desk setup (motorized desk + accessories)
- Total price: $2,500 (confirm if this includes tax and delivery)
- Financing method: [Cash? Credit? Payment plan? Please specify]

### Affordability Check

| Test | Your Numbers | Status |
|------|-------------|--------|
| Cash available after purchase | $[savings] - $2,500 = $[remaining] | [Fill in -- is remaining above your emergency fund target?] |
| Monthly payment (if financed) | $[amount if applicable] | [X]% of take-home income |
| 30-day rule | [Have you wanted this for 30+ days?] | [Fill in] |
| Budget impact | [Does this fit without cutting essentials?] | [Fill in] |

### Needs vs. Wants Classification
Classification: **Strong Want** -- Your current desk works but is not ergonomic. An ergonomic setup for full-time home work improves daily comfort and may prevent long-term health issues. This is not a basic need (you have a desk) but it is a quality-of-life investment tied to your livelihood.

### True Cost Calculation

| Component | Amount |
|-----------|-------:|
| Purchase price | $2,500 |
| Financing interest | $[0 if cash, calculate if financed] |
| Ongoing costs (minimal for a desk) | ~$0/year |
| **Total cost of ownership** | **$2,500** |

**Opportunity Cost:** $2,500 invested at 6% (as an example scenario, not a prediction) for 5 years:
$2,500 * (1.06)^5 = $3,345 -- a difference of $845

**Cost Per Use:**
Working from home ~250 days/year * 5+ years = 1,250+ uses
$2,500 / 1,250 = **$2.00 per workday**

### Alternatives Explored

| Option | Estimated Cost | Meets Need? | Tradeoffs |
|--------|------:|-------------|-----------|
| New standing desk ($2,500) | $2,500 | Yes | Full features, warranty |
| Used/refurbished standing desk | $800-1,500 | Likely | May lack warranty, fewer features |
| Standing desk converter (sits on current desk) | $200-500 | Partially | Less range of motion, smaller surface |
| DIY standing desk modification | $50-200 | Partially | Not motorized, less adjustable |
| Ergonomic accessories for current desk (monitor arm, keyboard tray, mat) | $200-400 | Partially | Addresses some ergonomic issues without a new desk |
| Keep current setup | $0 | No ergonomic improvement | No cost, no change |

### Decision Matrix

You assign the weights (1-5) based on what matters most to you:

| Criterion | Weight | Buy $2,500 | Used ~$1,200 | Converter ~$350 | Keep Current |
|-----------|:------:|:----------:|:------------:|:---------------:|:------------:|
| Meets ergonomic need | [you] | 5 | 4 | 3 | 1 |
| Affordability | [you] | 2 | 3 | 5 | 5 |
| Timing (need it now?) | [you] | 5 | 3 | 5 | 5 |
| Total cost | [you] | 1 | 3 | 4 | 5 |
| Risk of regret | [you] | 4 | 3 | 3 | 2 |
| **Weighted Total** | | **[calculate]** | **[calculate]** | **[calculate]** | **[calculate]** |

Fill in your weights, multiply each weight by the score, and sum to find the highest-scoring option.

### Summary
- Total cost: $2,500 (or less with alternatives)
- Cost per workday: $2.00 over 5 years of daily use
- Your current desk works -- this is an upgrade, not a replacement of a broken item
- Several alternatives exist at lower price points that partially address the ergonomic need
- The decision depends on how you weight ergonomic improvement against cost

### Next Steps
- [ ] Complete the affordability check with your actual savings numbers
- [ ] Assign your weights in the decision matrix and calculate scores
- [ ] If considering alternatives: research specific used or converter options
- [ ] If buying: check for sales, employer reimbursement, or ergonomic programs
- [ ] If waiting: set a 30-day reminder and reassess
