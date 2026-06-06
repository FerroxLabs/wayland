---
name: spending-analysis
description: |
  Analyzes the user's spending history against their stated values and financial goals. Identifies misalignments between what the user says they value and where they actually spend money, then recommends specific reallocation amounts to bring spending in line with priorities.
  Use when the user wants to understand their spending patterns, find misalignments, or optimize how their money is distributed across categories.
  Do NOT use for setting up expense tracking (use expense-tracking-setup), creating a budget (use budget-planning), or auditing subscriptions only (use subscription-audit).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance expenses analysis savings"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Spending Analysis

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user shares actual spending data (bank export, manual log, app summary) and wants to understand where their money is going relative to what they care about
- The user expresses a felt mismatch -- "I make decent money but have nothing to show for it" -- and needs a structured diagnostic
- The user has been tracking expenses for at least 2--4 weeks and wants an analytical review of that data
- The user wants to identify which spending categories are consuming disproportionate shares of income without their conscious awareness
- The user is preparing for a major financial decision (buying a home, having a child, changing careers) and needs a baseline snapshot of current spending patterns
- The user wants to understand whether their spending trajectory can support a specific savings goal within a defined timeframe
- The user wants a quantified comparison between their stated values and their revealed preferences (where money actually flows)
- The user has noticed category creep -- spending in a single category that has drifted upward month over month without a deliberate decision

**Do NOT use when:**
- The user has no spending data at all and needs to set up a tracking system first -- use `expense-tracking-setup` to help them capture data, then return to this skill after 30 days
- The user wants to build a forward-looking spending plan with category limits -- use `budget-planning`, which is prescriptive rather than analytical
- The user's question is exclusively about recurring subscription charges -- use `subscription-audit`, which performs deeper contract and billing-cycle analysis
- The user needs a debt payoff sequence or interest optimization strategy -- use a debt management skill, which handles amortization schedules and avalanche/snowball methods
- The user is asking about business or freelance expense categorization for tax purposes -- use a business expense skill, as personal finance categorization rules do not apply
- The user wants investment portfolio analysis or asset allocation review -- spending analysis does not touch investment accounts, only cash flow
- The user is under active financial crisis (collections, foreclosure, wage garnishment) -- these require triage-oriented skills that prioritize immediate harm reduction before values alignment work

---

## Process

### Step 1: Gather the Input Data

Before any analysis can begin, collect three distinct data types. Missing any one of them produces an incomplete or misleading analysis.

- **Spending data:** Ask for at least one full calendar month of categorized spending. Three months is strongly preferred because it smooths out irregular expenses (quarterly insurance premiums, seasonal utility spikes, annual renewals that hit in a single month). Six months captures annual patterns with better fidelity. If the user provides only one month, note this limitation explicitly in the output.
- **Income baseline:** Collect net monthly take-home pay (after taxes, benefits deductions, and retirement contributions that are automatically withheld). If income is variable (freelance, commission, hourly), ask for the average of the last three to six months and flag the volatility. Do NOT use gross income -- the analysis must be grounded in money the user can actually spend.
- **Stated priorities:** Ask the user to name their top three to five values or life priorities. Avoid leading them toward financial categories. Open-ended prompts produce more honest answers: "What areas of your life matter most to you right now?" If they struggle, offer a structured values menu: financial security, health and longevity, family and relationships, career advancement, experiences and travel, personal growth, community and giving, comfort and enjoyment, creative expression. Ask them to pick and rank.
- **Stated financial goals:** Collect any specific, time-bound goals -- "save $10,000 for a house down payment in 18 months," "eliminate $6,000 in credit card debt by December," "build a 3-month emergency fund." These become anchor targets in the reallocation math.
- **Self-assessment:** Ask one calibration question before running the analysis: "On a scale of 1 to 10, how well do you think your current spending reflects your priorities?" Record the answer. After the analysis, the delta between their self-assessment and the actual alignment score is often the most impactful insight in the report.

### Step 2: Standardize and Categorize All Spending

Raw transaction data is almost never in analysis-ready form. Apply consistent categorization before any numbers go into the report.

- Use twelve standard categories that map to how most personal finance frameworks (the 50/30/20 system, zero-based budgeting, and envelope methods all use variants of these):
  - **Housing:** Rent or mortgage principal and interest, renter's or homeowner's insurance, property taxes (if paid directly), HOA fees, maintenance and repairs, furnishings purchased for the home
  - **Transportation:** Car payment or lease, auto insurance, fuel, tolls, parking, rideshare, public transit, registration and maintenance
  - **Groceries and household:** All supermarket spending, pharmacy runs where food or household goods dominate, household supplies (cleaning, paper goods)
  - **Dining and food service:** Restaurants, takeout, food delivery apps, coffee shops, bars, work lunches bought outside the home
  - **Utilities and communications:** Electric, gas, water, sewer, trash, internet, mobile phone, landline
  - **Health and wellness:** Medical insurance premiums paid out of pocket (not withheld pre-tax), out-of-pocket medical and dental, prescription costs, gym and fitness, therapy, supplements
  - **Personal care:** Haircuts, salon services, personal hygiene products, cosmetics
  - **Entertainment and recreation:** Streaming subscriptions, events (concerts, sporting events, theater), hobbies, gaming, recreation equipment
  - **Shopping and discretionary goods:** Clothing, electronics, home décor, impulse purchases, Amazon/general retail
  - **Financial and savings:** Contributions to savings accounts, investment contributions beyond workplace deductions, all debt payments (note: separate minimum required payments from above-minimum payments -- the above-minimum portion is discretionary)
  - **Education and growth:** Tuition, professional certifications, online courses, books, coaching, conferences, professional association memberships
  - **Giving:** Charitable donations, gifts for others, tips beyond standard restaurant tipping
- When a transaction is ambiguous (a Target run that includes groceries and clothing), ask the user to estimate the split or use the majority-rule approach: categorize to whichever type of spending dominated that transaction.
- Calculate each category's monthly dollar total and its percentage of net income. Both figures must appear -- dollars without percentages obscure scale comparisons; percentages without dollars obscure real magnitude.
- Identify the unaccounted gap: income minus all tracked spending. Any gap above 5% of income is significant and must be flagged. Common sources of gaps: ATM cash withdrawals, automatic transfers the user forgot to mention, Venmo/Zelle peer payments, and annual expenses that did not occur in the analysis window.

### Step 3: Apply Benchmark Comparisons

Raw numbers become meaningful when placed against established reference points. Use these benchmarks as diagnostic calibration, not prescriptive targets.

- **The 50/30/20 framework** (Elizabeth Warren's model, widely used as a starting baseline):
  - Needs (housing, utilities, transportation, insurance, minimum debt payments, groceries): ideally no more than 50% of net income
  - Wants (dining, entertainment, shopping, travel, personal care, hobbies): ideally no more than 30% of net income
  - Savings and debt payoff above minimums: ideally at least 20% of net income
  - Flag any category that deviates more than 10 percentage points from these guidelines as worth examining -- though the user's specific priorities may legitimately justify deviations
- **Housing cost thresholds:** Housing above 30% of gross income (the traditional standard) or above 35--40% of net income signals financial strain in most markets. Above 50% of net income indicates severe housing cost burden that constrains all other financial goals.
- **Savings rate benchmarks:** A savings rate (savings + investments + above-minimum debt payments, divided by net income) below 10% is below the median for financial stability planning. 15--20% is the commonly cited target for retirement readiness on a standard timeline. Above 25% is aggressive and accelerates most financial goals substantially.
- **Food spending norms:** The USDA publishes monthly food plan cost estimates by household size and age. For a single adult eating a "moderate cost plan," grocery costs typically run $350--$500/month depending on location. Dining out above 5--7% of net income without travel or entertainment as a stated top priority often indicates category drift.
- **These are calibration benchmarks, not rules.** A person who lists "experiences and travel" as their top priority and deliberately allocates 15% of income to dining and entertainment is NOT misaligned. Benchmarks flag anomalies; the values map confirms whether those anomalies are intentional.

### Step 4: Build the Values Alignment Map

This is the analytical core of the skill -- the step that distinguishes spending analysis from a simple budget review.

- For each of the user's stated priorities, identify every spending category (or sub-category) that concretely supports that value in their life. This requires judgment:
  - "Health" maps to: gym membership, health insurance premiums (out of pocket), medical and dental visits, healthy grocery spending (estimate 60--70% of grocery total if user is health-focused), therapy, fitness equipment, supplements
  - "Financial security" maps to: savings contributions, investment contributions, emergency fund additions, above-minimum debt payments, insurance premiums that protect against catastrophic loss
  - "Family and relationships" maps to: childcare, family activities, gifts for family, travel to visit family, family dining out
  - "Career growth" maps to: professional development courses, certifications, professional memberships, books and resources, work wardrobe if occupation-critical
  - "Experiences and travel" maps to: travel spending, event tickets, dining at restaurants as an experience (not convenience), hobby spending directly tied to experiences
- Assign a monthly dollar total and income percentage to each priority.
- Rank priorities by actual spending, not stated importance. Present both rankings side by side. The gap between stated rank and spending rank is the quantified misalignment.
- Note that some spending categories support multiple priorities simultaneously (a family camping trip supports both "experiences" and "family"). Double-count deliberately with a note -- the goal is alignment assessment, not accounting precision.
- Calculate the Alignment Ratio: total dollars directed toward the user's top three stated priorities divided by total discretionary spending (total spending minus fixed unavoidable costs like housing, utilities, minimum debt payments). This ratio measures how well the user's controllable spending reflects their values. A ratio above 50% indicates strong alignment; below 30% indicates significant misalignment.

### Step 5: Identify and Quantify Misalignments

Generate a structured set of misalignment findings, ordered by dollar magnitude (largest opportunity first).

- **Priority inversion:** A stated top priority ranks lower in spending than a lower-stated priority. Example: "Financial security" is priority #1 but savings receive 3% of income while entertainment receives 9% of income. Calculate the inversion gap in dollars per month and per year.
- **Ghost spending:** A category consuming 5% or more of income that is not connected to any stated priority and was not deliberately chosen as a trade-off. Shopping, delivery fees, and convenience food are frequent ghost categories -- money leaves without conscious decision-making.
- **Goal funding deficit:** Compare what a stated financial goal requires per month to what is currently being directed toward it. If a user wants to save $12,000 in 12 months but is saving $200/month, the deficit is $800/month. Name the specific discretionary categories large enough to fund this gap.
- **Minimum floor violations:** If health is a top priority but health-related spending is below $50/month and the user has no gym access, no medical plan, and no healthy food budget, flag this. Some priorities require a minimum floor of spending to be meaningful.
- **Spending-to-values ratio inversion in dining vs. financial categories:** Dining out exceeding savings is the single most common misalignment in analyses of households earning under $100,000/year. When it appears, flag it specifically with both monthly and annual figures.
- Do NOT manufacture misalignments. If a user's spending is genuinely well-aligned, say so. Not every analysis will produce dramatic findings, and a clean result is a legitimate and valuable outcome.

### Step 6: Generate Specific Reallocation Recommendations

Every recommendation must meet four criteria: it names a specific source category, specifies an exact dollar reduction, names a specific destination category, specifies an exact dollar increase, and calculates the downstream impact.

- Limit recommendations to three to five. More than five overwhelms and reduces follow-through. Prioritize by: (1) largest dollar impact, (2) easiest behavioral change, (3) highest alignment value.
- Use realistic reduction targets. Cutting dining from $600 to $100 in one month has very low follow-through probability. A 30--40% reduction from the starting point is a realistic first-month target.
- Specify the mechanism: "Reduce dining out from $520 to $320 by cooking dinner at home four nights per week instead of ordering delivery" is actionable. "Spend less on food" is not.
- When recommending savings increases, specify the savings vehicle type (emergency fund, high-yield savings account, additional debt payment) because directing savings to the right destination matters for goal progress.
- Calculate the annual projection for each recommendation. Monthly numbers feel small; annual figures reveal significance. A $150/month shift equals $1,800/year -- concrete enough to motivate action.
- Include a combined impact projection: if the user implements all recommendations, what is the new savings rate and new alignment ratio?

### Step 7: Produce the Alignment Score and Action Plan

Close the analysis with a summary that connects data to decision.

- Calculate two alignment scores: current state and projected state after implementing all recommendations. Present both.
- Restate the user's initial self-assessment score from Step 1 and compare it to the actual alignment ratio. When self-assessed alignment is much higher than actual alignment (common), acknowledge this gap directly but without judgment: "Your self-assessment of 7/10 compares to an actual alignment ratio of 28% -- this gap is common and is exactly what this analysis is designed to surface."
- Produce a prioritized action list with specific items, not vague tasks. Each item must be completable within 30 days.
- Suggest a re-analysis date. One full month of data after implementing changes is the minimum useful re-analysis window.

---

## Output Format

```
## Spending Analysis Report
**Analysis period:** [Month(s) covered]
**Data completeness:** [Full / Partial -- note any gap]

---

### Income and Cash Flow Summary
| Metric                          | Amount       | Notes                          |
|---------------------------------|-------------|--------------------------------|
| Monthly net income              | $X,XXX      |                                |
| Total tracked spending          | $X,XXX      |                                |
| Unaccounted gap                 | $XXX        | [Flag if >5% of income]        |
| Directed savings rate           | X.X%        | Savings ÷ net income           |
| Total savings rate              | X.X%        | Incl. debt above minimums      |

---

### Spending by Category
| Category                  | Monthly  | % of Net Income | 50/30/20 Bucket | Benchmark Flag        |
|---------------------------|---------|-----------------|-----------------|----------------------|
| Housing                   | $X,XXX  | XX%             | Needs           | [At/Over/Under norm] |
| Transportation            | $XXX    | XX%             | Needs           |                      |
| Groceries and household   | $XXX    | XX%             | Needs           |                      |
| Dining and food service   | $XXX    | XX%             | Wants           |                      |
| Utilities and comms       | $XXX    | XX%             | Needs           |                      |
| Health and wellness       | $XXX    | XX%             | Needs/Wants     |                      |
| Personal care             | $XXX    | XX%             | Wants           |                      |
| Entertainment/recreation  | $XXX    | XX%             | Wants           |                      |
| Shopping/discretionary    | $XXX    | XX%             | Wants           |                      |
| Financial/savings         | $XXX    | XX%             | Savings         |                      |
| Education and growth      | $XXX    | XX%             | Wants/Savings   |                      |
| Giving                    | $XXX    | XX%             | Wants           |                      |
| **Total**                 |**$X,XXX**| **XX%**        |                 |                      |

**50/30/20 Actual Split:**
- Needs: XX% (benchmark: ≤50%)
- Wants: XX% (benchmark: ≤30%)
- Savings/debt above minimums: XX% (benchmark: ≥20%)

---

### Values Alignment Map
| Stated Priority | Rank | Supporting Categories         | Monthly $  | % of Net Income | Spending Rank |
|-----------------|------|-------------------------------|-----------|-----------------|---------------|
| [Priority 1]    | #1   | [Category A, Category B]      | $XXX      | XX%             | #X            |
| [Priority 2]    | #2   | [Category C]                  | $XXX      | XX%             | #X            |
| [Priority 3]    | #3   | [Category D, Category E]      | $XXX      | XX%             | #X            |

**Alignment Ratio:** XX% of discretionary spending supports top 3 priorities
**User self-assessment:** X/10 | **Actual alignment:** XX%

---

### Misalignment Findings
| # | Type                  | Finding                                                             | Monthly Gap | Annual Impact |
|---|-----------------------|---------------------------------------------------------------------|------------|---------------|
| 1 | Priority inversion    | [Priority X] is #N stated but #M in spending vs. [Lower priority]  | $XXX       | $X,XXX        |
| 2 | Ghost spending        | [Category] at XX% of income with no connection to stated priorities | $XXX       | $X,XXX        |
| 3 | Goal funding deficit  | [Goal] requires $XXX/mo; current allocation is $XXX/mo             | $XXX       | $X,XXX        |
| 4 | Minimum floor         | [Priority] receives $XX/mo -- below the minimum to be meaningful   | --         | --            |

---

### Reallocation Recommendations
| # | Reduce This             | From    | To      | Shift   | Increase This          | Mechanism                                  | Annual Impact |
|---|-------------------------|--------|--------|---------|------------------------|--------------------------------------------|--------------|
| 1 | [Category]              | $XXX   | $XXX   | -$XXX   | [Category/Goal]        | [Specific behavior change]                 | +$X,XXX      |
| 2 | [Category]              | $XXX   | $XXX   | -$XXX   | [Category/Goal]        | [Specific behavior change]                 | +$X,XXX      |
| 3 | [Category]              | $XXX   | $XXX   | -$XXX   | [Category/Goal]        | [Specific behavior change]                 | +$X,XXX      |

**Combined impact if all recommendations implemented:**
- New savings rate: X.X% → XX%
- New alignment ratio: XX% → XX%
- Annual additional savings: $X,XXX

---

### Spending Alignment Score
| Metric                         | Current  | After Recommendations |
|--------------------------------|---------|----------------------|
| Alignment ratio                | XX%     | XX%                  |
| Savings rate (directed)        | X.X%    | XX%                  |
| Savings rate (total)           | X.X%    | XX%                  |
| Wants spending (% of income)   | XX%     | XX%                  |

---

### 30-Day Action Plan
- [ ] [Specific action 1 -- category, amount, mechanism, deadline]
- [ ] [Specific action 2 -- category, amount, mechanism, deadline]
- [ ] [Specific action 3 -- category, amount, mechanism, deadline]
- [ ] Re-run spending analysis on [date 30 days out] with updated data

**Suggested re-analysis date:** [Date]
```

---

## Rules

1. **Always collect net income, never gross.** Gross income analysis produces savings rate and percentage calculations that are systematically misleading. A person earning $72,000 gross may take home $4,800/month after taxes and benefits -- using gross produces a 33% housing ratio when the true ratio is 33% of net but appears lower against gross. Every percentage in this analysis must be calculated against net (take-home) income.

2. **Never skip the unaccounted gap calculation.** Income minus all tracked spending must be computed and reported. A gap above 5% of net income means the analysis is working with incomplete data. Common culprits: ATM cash that gets spent in untraceable small amounts, Venmo payments to split expenses, automatic transfers to accounts the user forgot to list, and annual expenses that occurred before the analysis window. Flag the gap, estimate its likely sources, and note the impact on the analysis reliability.

3. **Always show both dollar amounts and percentages, in every table.** Percentages without dollars obscure the real scale of spending (4% sounds trivial; $192/month on coffee does not). Dollars without percentages prevent comparison across income levels and make benchmark application impossible.

4. **Apply benchmark context before flagging anomalies.** A finding like "shopping at $500/month" has different significance depending on income. At $3,000/month net income, that is 16.7% of income -- a significant Wants overspend. At $12,000/month net income, that is 4.2% -- well within normal range. Always express the finding relative to income percentage AND benchmark before calling it a misalignment.

5. **Limit reallocation recommendations to three to five.** Research on behavior change consistently shows that presenting more than five action items decreases follow-through on all of them. Prioritize recommendations by magnitude of impact, not by number. One $300/month reallocation is worth more than five $40 reallocations.

6. **Never moralize, catastrophize, or editorialize.** Present findings in neutral, quantitative language. "Dining and food service at $615/month represents 13% of net income and ranks second in spending by category" is a finding. "You're spending an alarming amount eating out instead of saving" is editorializing and damages trust. The user knows their own life context; the analysis provides data, not verdicts.

7. **When spending exceeds income, halt the values alignment analysis and address the deficit first.** A negative savings rate (spending > income) is the primary finding regardless of values alignment. Calculate the monthly deficit, annualize it, estimate the timeline to a debt crisis at the current rate, and identify the two or three largest discretionary categories that could close the gap. Only return to alignment analysis after deficit closure is addressed.

8. **Require stated priorities before analyzing alignment.** Running the analysis without the user's values produces a pure budget benchmarking exercise, which is useful but much less valuable. If the user is resistant to stating priorities, offer the structured values menu from Step 1. If they absolutely refuse, complete the benchmark analysis but explicitly note that the values alignment section cannot be generated without this input.

9. **Distinguish fixed from variable costs when generating recommendations.** Recommendations must target categories where the user has genuine near-term behavioral control. Rent, car insurance, minimum debt payments, and utility base charges are largely fixed in the short term (6--12 months). Recommendations that require the user to move, sell a car, or refinance debt are medium-term structural changes -- label them as such, separate from immediate 30-day actions.

10. **Identify the single highest-leverage change and lead with it.** Every analysis has one finding that, if acted upon, produces the greatest alignment or savings improvement per unit of behavioral effort. Surface this explicitly in the action plan as "Highest Leverage Change." It should be the first item on the 30-day action list. This is the recommendation that survives when a user only implements one thing.

11. **Handle multi-month data by averaging, not summing.** If the user provides three months of data, use the monthly average for each category as the baseline figure. Also note the highest and lowest month for variable categories (dining, shopping, entertainment) -- this range reveals volatility that an average conceals. High volatility in a category is itself a finding: inconsistent spending in a category often indicates impulse-driven rather than intentional behavior.

12. **Never recommend a specific savings vehicle, brokerage, bank, or financial product by name.** Recommend the vehicle type (high-yield savings account, employer-matched retirement plan, 529 account) and describe its characteristics, but do not name specific institutions or products.

---

## Edge Cases

### User provides data for only one month, and it contains a large irregular expense

A single-month snapshot with an outlier (a $1,200 car repair, a $900 medical bill, a $600 birthday trip) will distort category averages significantly. Handle this by: (1) flagging the irregular expense explicitly and excluding it from the recurring monthly totals, (2) calculating a "normalized" monthly baseline without the irregular item, and (3) separately noting that irregular expenses are a real part of financial life and the user should maintain a sinking fund -- a dedicated savings category pre-funded monthly to absorb predictable-but-irregular costs like car maintenance ($75--$100/month), medical costs ($50--$150/month), and annual subscriptions ($20--$50/month). This is why three months of data is strongly preferred.

### User's spending exceeds their income

This is a financial emergency signal that overrides the standard analysis flow. Do not proceed to values alignment work. Instead: calculate the monthly deficit precisely; annualize it to show the compounding damage ("at this rate you are adding approximately $X,XXX in debt per year"); identify the largest two or three discretionary categories that could be reduced to close the gap; note whether the gap is structural (income is genuinely insufficient for the cost of living) or behavioral (income is sufficient but discretionary spending is unconstrained). If the gap appears structural (housing + transportation + utilities + food + minimum debt payments already exceed income), redirect the user toward income-side interventions and note that expense cutting alone cannot solve a structural deficit. Only after the deficit is eliminated should a standard alignment analysis proceed.

### User cannot identify any spending that supports their stated top priority

This is a meaningful finding, not a data problem. If a user lists "health" as priority #1 but has zero gym, zero out-of-pocket medical, and low grocery spending, there are two possible interpretations: (1) their health costs are fully covered by employer benefits and pre-tax deductions (not visible in take-home cash flow), or (2) they are not investing in their stated top priority at all. Ask a clarifying question: "Are your health costs primarily handled through payroll deductions for insurance, or do you feel this area is genuinely underfunded?" The answer determines whether this is a data gap or a genuine misalignment. If it is a genuine gap, it becomes the most important misalignment finding in the report.

### User is part of a dual-income household and provides combined spending

Do not attempt to generate individual-level alignment analysis on combined household data. Instead: (1) acknowledge that household-level analysis is valid and useful, (2) ask whether both partners' priorities have been stated (they may differ significantly), (3) if priorities differ, map spending against both sets and flag categories where one partner's priorities are well-funded and the other's are not -- this is a constructive framing for a financial conversation between partners rather than a conflict to resolve. Common divergences: one partner prioritizes financial security and the other prioritizes experiences; one prioritizes career growth spending and the other does not see value in it. Present these divergences neutrally as areas for joint decision-making.

### Analysis period includes a major life transition (job change, move, relationship change)

Spending data from a period straddling a major life transition is structurally unreliable as a baseline for ongoing behavior. A month that includes moving expenses, a job gap, or a major relationship change will contain large one-time items and may not represent sustainable monthly patterns. Flag the transition explicitly and suggest the user return for analysis after two full "settled" months have passed. If the user insists on proceeding, perform the analysis but label every result with a prominent caveat that the baseline may not reflect ongoing spending.

### All spending appears genuinely well-aligned with stated priorities

This is a success finding, not a failure of the analysis. Confirm the alignment with specific evidence: "Your top three stated priorities are X, Y, and Z. Your spending allocates [X]% of discretionary spending to these areas, with [Priority 1] at [Amount] and [Priority 2] at [Amount]. This is strong alignment." Then offer two forward-looking options: (1) explore whether the current savings rate supports the user's medium and long-term financial goals (retirement timeline, major purchase goals) -- many people with good values alignment still underfund future goals; (2) identify whether any emerging priority or life change (having children, career transition, health changes) would benefit from proactive reallocation now. A clean analysis is a valid and complete deliverable.

### User's income is highly variable (freelance, commission, tips, seasonal employment)

Variable income requires a modified baseline approach. Use the average of the last six months if available; the last three months if not. Additionally, calculate the spending level the user can sustain on their lowest-income month from the analysis period -- this is their "floor budget," the minimum required to cover all needs and financial obligations. Spending above this floor in high-income months is discretionary. Flag any fixed cost (rent, car payment, loan minimum) that exceeds 25% of the lowest-income month as a structural vulnerability. Recommend that the user maintain a buffer of at least two months of average spending as an income-smoothing reserve before aggressively funding other goals.

---

## Example

**Input provided by user:**
"I've been tracking for two months. Here's my average monthly spending: rent $1,800, utilities/internet $140, groceries $310, restaurants and delivery $580, gas $160, car insurance $95, gym $55, streaming services $62, Amazon and random shopping $440, clothing $180, student loan minimum $275, savings transferred to savings account $150, birthday gifts and charitable donations $90. I take home $5,200/month. My priorities are financial security first, then health, then family and relationships. I want to save enough for a 6-month emergency fund -- I currently have $800 saved and want to get to $15,600. I'd say my spending reflects my priorities about a 6 out of 10."

---

## Spending Analysis Report
**Analysis period:** 2-month average (May--June)
**Data completeness:** Strong -- all categories accounted for. Gap of $215/month flagged below.

---

### Income and Cash Flow Summary
| Metric                          | Amount    | Notes                                         |
|---------------------------------|----------|-----------------------------------------------|
| Monthly net income              | $5,200   |                                               |
| Total tracked spending          | $4,337   |                                               |
| Unaccounted gap                 | $863     | 16.6% of income -- significant, see note below |
| Directed savings rate           | 2.9%     | $150 ÷ $5,200                                 |
| Total savings rate (incl. above-min debt) | 2.9% | No above-minimum debt payments identified |

**Note on unaccounted gap:** Income of $5,200 minus tracked spending of $4,337 leaves $863 unaccounted. This is 16.6% of net income -- too large to ignore. Common sources: ATM cash withdrawals, Venmo/Zelle payments, app purchases, fuel or parking paid in cash, or categories not yet listed. This gap should be tracked and categorized before the next analysis cycle. It is possible some of this flows into savings accounts not mentioned, but it should be confirmed.

---

### Spending by Category
| Category                  | Monthly  | % of Net Income | 50/30/20 Bucket | Benchmark Note              |
|---------------------------|---------|-----------------|-----------------|----------------------------|
| Housing                   | $1,800  | 34.6%           | Needs           | At upper edge (norm: ≤33%) |
| Transportation            | $255    | 4.9%            | Needs           | Within norm                |
| Groceries and household   | $310    | 6.0%            | Needs           | Within norm                |
| Dining and food service   | $580    | 11.2%           | Wants           | Elevated (norm: 5--7%)     |
| Utilities and comms       | $140    | 2.7%            | Needs           | Within norm                |
| Health and wellness       | $55     | 1.1%            | Needs/Wants     | Below norm for stated priority |
| Personal care             | $0      | 0%              | Wants           | Not reported               |
| Entertainment/recreation  | $62     | 1.2%            | Wants           | Within norm                |
| Shopping/discretionary    | $620    | 11.9%           | Wants           | Elevated -- see flags      |
| Financial/savings         | $425    | 8.2%            | Savings         | Below 20% benchmark        |
| Education and growth      | $0      | 0%              | Wants/Savings   | Not reported               |
| Giving                    | $90     | 1.7%            | Wants           | Within norm                |
| **Total Tracked**         |**$4,337**| **83.4%**      |                 |                            |

*Shopping/discretionary combines Amazon/random ($440) + clothing ($180) = $620*
*Financial/savings combines savings transfer ($150) + student loan minimum ($275) = $425*

**50/30/20 Actual Split (of tracked spending):**
- Needs (housing, transport, groceries, utilities, health, student loan minimum): $2,835 -- 54.5% of income (benchmark: ≤50%) -- **over by 4.5 percentage points**
- Wants (dining, streaming, shopping, clothing, giving): $1,352 -- 26.0% of income (benchmark: ≤30%) -- within norm
- Savings (directed savings only): $150 -- 2.9% of income (benchmark: ≥20%) -- **severely under benchmark**

**Primary structural observation:** Needs spending is modestly over the 50% guideline, driven by housing at 34.6% of income. This limits how much savings pressure can be solved purely from the Needs category. The critical gap is in the Savings bucket -- 2.9% vs. a 20% benchmark represents $884/month in missing savings activity.

---

### Values Alignment Map
| Stated Priority        | Rank | Supporting Categories                                    | Monthly $  | % of Net Income | Spending Rank |
|------------------------|------|----------------------------------------------------------|-----------|-----------------|---------------|
| Financial security     | #1   | Savings ($150), Student loan minimum ($275)              | $425      | 8.2%            | #5            |
| Health                 | #2   | Gym ($55), Groceries partial (est. $180 of $310)         | $235      | 4.5%            | #7            |
| Family and relationships| #3  | Giving/gifts ($90), Dining-as-social partial (est. $100) | $190      | 3.7%            | #8            |

**Discretionary spending total** (total spending minus fixed unavoidable costs: housing, utilities, transportation, student loan minimum): $4,337 - $2,470 = $1,867/month

**Alignment Ratio:** $850 toward top 3 priorities ÷ $1,867 discretionary = **45.5% -- moderate alignment**

**User self-assessment:** 6/10 | **Actual alignment ratio:** 45.5%
The self-assessment of 6/10 is reasonably calibrated to the actual alignment data. The analysis will show that the primary gap is not awareness but structural: housing cost and high dining/shopping spending are consuming the dollars that would otherwise go toward financial security.

---

### Misalignment Findings
| # | Type                 | Finding                                                                                         | Monthly Gap | Annual Impact |
|---|----------------------|-------------------------------------------------------------------------------------------------|------------|---------------|
| 1 | Priority inversion   | Financial security (#1 stated priority) receives $150/mo in savings -- dining alone receives $580/mo | $430/mo  | $5,160/yr     |
| 2 | Goal funding deficit | Emergency fund goal: $15,600 target, $800 current. At $150/mo, goal reached in 99 months (8+ years). Target timeline requires $595/mo | $445/mo | $5,340/yr |
| 3 | Ghost spending       | Shopping/discretionary at $620/mo (11.9% of income) is not a stated priority -- largest single Wants category | $620/mo | $7,440/yr |
| 4 | Minimum floor        | Health (#2 priority) receives $55/mo gym + partial groceries -- no medical spending, no dental, no vision reported; priority may be underfunded | -- | -- |
| 5 | Unaccounted gap      | $863/mo (16.6% of income) is untracked -- at this scale it almost certainly contains meaningful spending that would change the analysis | $863/mo | $10,356/yr |

---

### Reallocation Recommendations

**Highest Leverage Change:** Reduce shopping/discretionary from $620 to $300/month and redirect to emergency fund. This single change closes the majority of the emergency fund timeline gap.

| # | Reduce This             | From    | To      | Shift  | Increase This            | Mechanism                                                               | Annual Impact        |
|---|-------------------------|--------|--------|--------|--------------------------|-------------------------------------------------------------------------|---------------------|
| 1 | Shopping/discretionary  | $620   | $300   | -$320  | Emergency fund savings   | Implement a "48-hour rule" for non-grocery purchases over $30 before buying; unsubscribe from retail email lists this week | +$3,840 saved/yr |
| 2 | Dining and food service | $580   | $380   | -$200  | Emergency fund savings   | Reduce delivery orders from current frequency to 2x/week max; cook dinner at home Sunday through Thursday | +$2,400 saved/yr |
| 3 | Streaming + misc        | $62    | $30    | -$32   | Health investment        | Audit streaming for unused services (use `subscription-audit`); reallocate to one out-of-pocket health visit (dental, vision, or preventive care) per quarter | +$384/yr to health |

**Combined impact if all three recommendations implemented:**
- New monthly savings directed to emergency fund: $150 + $320 + $200 = $670/month
- New total savings rate: $670 ÷ $5,200 = **12.9%** (up from 2.9%)
- Emergency fund target of $15,600 reached in: ($15,600 - $800) ÷ $670 = **22 months** (down from 99 months)
- New alignment ratio: approximately 60% (up from 45.5%)
- Annual additional savings: $6,240

---

### Spending Alignment Score
| Metric                         | Current  | After All Recommendations |
|--------------------------------|---------|--------------------------|
| Alignment ratio                | 45.5%   | ~60%                     |
| Savings rate (directed)        | 2.9%    | 12.9%                    |
| Emergency fund timeline        | 99 months | 22 months              |
| Shopping as % of income        | 11.9%   | 5.8%                     |
| Dining as % of income          | 11.2%   | 7.3%                     |

---

### 30-Day Action Plan
- [ ] **Week 1:** Track all spending including cash, Venmo, and app purchases to close the $863/month data gap -- this is the single most important data quality action
- [ ] **Week 1:** Audit streaming services to identify unused subscriptions (target: reduce from $62 to $30/month or below)
- [ ] **Week 1:** Implement the 48-hour rule for all non-grocery purchases over $30 -- place items in a digital cart and revisit 48 hours later before buying
- [ ] **Week 2:** Set up a dedicated emergency fund savings account (separate from primary savings to reduce temptation to redraw) and establish an automatic monthly transfer of $520 (the increase from $150 to $670 in two steps: first to $370, then to $670 after dining reduction takes hold)
- [ ] **Week 2:** Establish two "no delivery" nights per week and two "cook at home" nights to begin the $200 dining reduction
- [ ] **Week 4:** Review receipts or transaction history to assess whether shopping spending is trending toward $300 target
- [ ] Re-run this spending analysis on [30 days from today] with full tracked data including the previously unaccounted gap

**Suggested re-analysis date:** 30 days from today, with two complete months of gap-free tracking ideally following.

**One-sentence summary:** Your stated priorities and your spending patterns are moderately aligned at 45.5%, but your #1 priority -- financial security -- is being systematically under-resourced by shopping and dining spending that together consume more than twice what you direct toward savings. Three specific changes can take your emergency fund timeline from 8+ years to under 2 years while increasing your alignment ratio from 45% to approximately 60%.
