---
name: budget-planning
description: |
  Creates personal or household budgets using zero-based, 50/30/20, or envelope methods. Gathers the user's income, fixed expenses, variable expenses, and financial goals, then produces a populated budget table with category allocations, percentage breakdowns, and actionable next steps.
  Use when the user asks about budgeting, managing money, tracking expenses, creating a spending plan, or choosing a budgeting method.
  Do NOT use for investment advice, tax planning, business financial modeling, or debt consolidation strategy (use debt-consolidation-analysis instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance expenses savings planning"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Budget Planning

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- The user asks to create a monthly budget, spending plan, or cash flow plan for personal or household finances
- The user wants to know where their money is going and how to allocate income across categories deliberately
- The user needs help choosing between budgeting methodologies (zero-based, 50/30/20, envelope, pay-yourself-first)
- The user mentions feeling like their money "disappears" before month's end or they cannot identify a consistent surplus
- The user wants to set up sinking funds for irregular expenses (car registration, holiday gifts, medical deductibles)
- The user is starting a new job, getting a raise, or experiencing an income change and needs to rebuild their spending plan
- The user wants to create a budget that accommodates a specific goal -- emergency fund, home down payment, debt payoff, vacation fund
- The user is combining finances with a partner for the first time and needs a shared framework
- The user is recovering from a budget overage and wants a corrective plan for the next month

**Do NOT use when:**
- The user wants specific investment product recommendations or portfolio allocation (use an investing skill instead)
- The user needs tax optimization, deduction planning, or estimated quarterly tax calculations (use a tax-planning skill instead)
- The user needs a business profit-and-loss budget, departmental budget, or business cash flow model (use a business finance skill instead)
- The user wants a structured debt payoff sequence with interest calculations (use `debt-snowball-planner` or `debt-avalanche-planner`)
- The user wants a consolidated debt refinancing analysis (use `debt-consolidation-analysis`)
- The user has never built a budget before and is completely new to personal finance concepts (use `first-budget` to establish foundational literacy first)
- The user is asking about negotiating salary, benefits, or compensation packages (different scope entirely)

---

## Process

### Step 1: Gather Complete Financial Information

Before building any budget, collect every number needed to populate a real allocation table. Do not proceed with assumptions or placeholder amounts.

- Ask for **total monthly after-tax take-home pay** from every source: W-2 salary, part-time work, freelance income, rental income, child support received, alimony received, government benefits, and any other recurring inflows. Do not use gross income -- after-tax take-home is the only number that actually passes through a personal budget.
- Ask for all **fixed expenses** -- amounts that do not change from month to month: rent or mortgage payment, renter's or homeowner's insurance, car payment, student loan minimum payment, personal loan minimum payment, childcare or daycare, contracted subscriptions (streaming, software, gym memberships at fixed rates), and any court-ordered payments.
- Ask for all **variable expenses** -- amounts that fluctuate but recur each month: groceries, utilities (electric, gas, water, internet, phone), gasoline or transit fares, dining out, entertainment, clothing, household supplies, personal care, and pet care.
- Ask for **irregular expenses** that are paid less than monthly: annual car registration, semi-annual auto insurance premium, quarterly pest control, annual memberships, holiday and birthday gifts, car maintenance (oil changes, tires), medical co-pays, and home maintenance. If the user cannot name them all, prompt specifically: "Do you have any bills that come once or twice a year instead of monthly?"
- Ask for **current account balances relevant to the budget**: checking account balance, any existing savings or emergency fund, and whether any existing retirement contributions are already being made pre-tax (which affects the take-home number).
- Ask for **financial goals with timeline**: "I want a $1,000 emergency fund" is different from "I want a $10,000 emergency fund" which is different from "I want to save $25,000 for a house down payment in two years." Each goal generates a specific monthly contribution requirement.
- If the user cannot provide exact numbers, ask them to estimate. Note any estimates in the budget output with an asterisk so both the user and AI can identify where to refine accuracy later.

### Step 2: Determine the Correct Budgeting Method

Select or recommend a method based on the user's specific situation. Do not default to a single method for everyone.

- **50/30/20 Rule (Elizabeth Warren framework, popularized in "All Your Worth"):** Best for users who want a simple, maintainable framework without tracking every dollar. Allocates 50% of after-tax income to needs, 30% to wants, and 20% to savings and debt repayment above minimums. This method functions as guardrails, not a granular ledger. Recommend this when: the user is a budget beginner, income is stable, they have modest debt, or they find detailed tracking unsustainable.
- **Zero-Based Budget (Dave Ramsey / YNAB methodology):** Every dollar of monthly income is assigned to a named category. Total income minus total allocations equals exactly zero -- no unassigned money. This creates maximum accountability. Recommend this when: the user has tried looser methods and still overspends, they carry high-interest debt they need to aggressively pay down, or they want complete visibility into every spending decision.
- **Envelope Method (cash-based or digital):** Fixed dollar amounts are assigned to specific spending categories at the start of the month. When a category's envelope is empty, spending in that category stops. In a digital context, this can be implemented with separate accounts or sub-accounts per category. Recommend this when: the user consistently overspends in specific categories (dining, clothing, entertainment) and needs hard spending stops rather than soft targets.
- **Pay-Yourself-First Method:** Savings and investment contributions are automatically transferred on payday before any discretionary spending occurs. The remainder is spent however the user chooses. Recommend this when: the user's primary goal is savings acceleration and they find detailed category tracking unsustainable. Pair with a minimum 20% automatic transfer.
- If the user is uncertain: ask whether they prefer simple rules (50/30/20), total control (zero-based), hard category limits (envelope), or effortless savings (pay-yourself-first). Match the method to their behavioral tendency, not just their financial situation.

### Step 3: Classify Every Expense Into the Three Core Types

This step requires judgment, not just labeling. Apply consistent standards.

- **Needs (Non-Negotiable):** Expenses required for basic functioning and safety. Criteria: removing this expense would create immediate harm or legal/contractual consequences. Include: primary housing payment (rent or mortgage), electricity, gas for heating, water, basic internet (required for remote work), groceries (not restaurant meals), minimum debt payments (contractual), auto insurance and car payment if the car is required for work, health insurance premiums, required prescriptions, basic phone plan, and childcare required for employment.
- **Wants (Discretionary):** Expenses that improve quality of life but are not required for survival or employment. Include: dining out and takeout, streaming subscriptions, gym membership, hobbies, entertainment (concerts, movies, sports), clothing beyond basic replacements, alcohol and tobacco, premium phone plans above basic service, vacation savings, and any upgrade above the minimum functional version of a need (e.g., internet at a speed faster than basic required for work).
- **Savings and Debt Repayment (Future Security):** Money directed toward financial resilience and future goals. Include: emergency fund contributions, extra debt payments above minimums, retirement contributions (401k, IRA, Roth IRA), sinking fund contributions for irregular expenses, college savings (529), down payment savings, and any other goal-directed savings. Note: employer-matched 401k contributions that are already withheld pre-tax do not appear in the after-tax budget -- but the user should know they exist and factor them into their overall savings rate.
- Watch for reclassification traps: a car payment is a need only if the car is required for income generation. A car payment for a second vehicle or a vehicle in a transit-accessible city is a want. Subscriptions for work tools (cloud storage, professional software) are needs. Netflix is a want. Flag ambiguous cases and ask the user to clarify their situation.

### Step 4: Build the Full Budget Allocation Table

Construct the complete monthly budget with real numbers, percentages, and method-specific verification.

- Start with total monthly after-tax income as the ceiling. Every allocation comes out of this number.
- Convert all irregular expenses to monthly equivalents immediately. Annual expense / 12 = monthly sinking fund contribution. Semi-annual / 6. Quarterly / 3. Add these as explicit line items to the budget -- they are real monthly cash outflows that must be reserved, even if the bill doesn't arrive that month.
- Calculate the percentage of income for every single category: (category amount / total income) × 100. Round to whole numbers for readability.
- **For 50/30/20 method:** After populating all categories, sum the Needs total, Wants total, and Savings/Debt total separately. Compare each subtotal against the 50%, 30%, and 20% targets. If any category exceeds its target, identify the largest line items within that category for potential adjustment.
- **For zero-based method:** Sum all allocations. The result must equal total income exactly. If there is a surplus, assign it explicitly -- to emergency fund, extra debt payment, or a named savings goal. "Leftover" money without a category is not zero-based budgeting.
- **For envelope method:** Only discretionary (Want) categories get envelope limits. Fixed expenses are paid as normal. For each Want category, set a hard monthly dollar ceiling based on what the user commits to, not what they historically spent.
- Flag immediately if: total allocated expenses exceed total income (deficit budget), savings plus debt repayment is below 10% of income (financial fragility warning), or Needs exceed 65% of income (housing cost burden requiring specific intervention).

### Step 5: Calculate Sinking Fund Requirements for Irregular Expenses

This step is frequently omitted in basic budgeting and is one of the most common causes of budget failure. Make it explicit and prominent.

- A **sinking fund** is a dedicated savings sub-account where a monthly contribution accumulates until an irregular expense is due. It converts unpredictable large bills into predictable small ones.
- For each identified irregular expense: calculate the annual total, divide by 12, and assign that dollar amount as a monthly contribution to a named sinking fund. Label each fund clearly: "Car Insurance Fund," "Holiday Gifts Fund," "Car Maintenance Fund," "Medical Deductible Fund."
- Benchmark irregular expense amounts for common categories if the user doesn't know their numbers: car maintenance averages $500-$1,200/year for a vehicle under 10 years old ($42-$100/month); medical out-of-pocket costs vary widely but $500-$2,000/year is common for insured adults ($42-$167/month); holiday gifts and celebrations average $500-$1,500/year for a household ($42-$125/month).
- Sinking funds should live in a separate high-yield savings account (or sub-accounts) to prevent accidental spending of reserved funds. The physical or digital separation is as important as the math.

### Step 6: Identify Specific Adjustments When the Budget Doesn't Balance or Doesn't Meet Targets

Generic advice ("spend less on dining out") is useless. Provide specific dollar amounts and reallocation paths.

- If needs exceed 50%: Identify which need category is the largest overage. Housing above 30% of income is the most common culprit. If rent is 35-40% of income, the structural fix is either increasing income, finding a lower-cost housing situation, or accepting that the remaining categories must compress further. Subscriptions and minimum loan payments are the next targets.
- If wants exceed 30%: Itemize the three largest want-category line items. Calculate what reducing each by 25% would save. Ask the user which they're most willing to reduce -- force a specific choice, not a vague commitment to "cut back."
- If savings are below 20% (or below 10%, which is a critical warning): Calculate exactly how many dollars are needed to reach 20%. Show the user which want categories could fund that gap. "Cutting dining from $400 to $250 and subscriptions from $120 to $60 generates $210/month, which closes 70% of your savings gap."
- If total expenses exceed income (deficit): Flag this explicitly. Prioritize in order: (1) cover all fixed Needs, (2) cover all variable Needs at minimum sustainable levels, (3) make minimum debt payments, (4) identify every Want that can be paused or eliminated, (5) explore income-side options (overtime, side income, benefit adjustments).

### Step 7: Create a Concrete Tracking and Review Plan

A budget with no follow-through mechanism fails within 30 days for most people. Build the accountability structure into the output.

- Recommend a specific **weekly check-in day and time** (Sunday evening is optimal for most schedules -- reviews the prior week and sets intentions for the upcoming week). Duration: 15 minutes maximum. Tasks: compare actual spending in each category to budget, flag any category that has used more than 75% of its monthly allocation before mid-month.
- Recommend a **monthly budget reset** -- a 30-minute session on a specific date (first of the month or last Sunday of the month). Tasks: enter all prior-month actuals, identify top 3 overages, make explicit adjustments to next month's budget based on what the user learned.
- Identify the 2-3 categories most likely to overspend based on the user's data and flag them explicitly as "watch categories" requiring closer tracking.
- If the user mentions using an app or tool, incorporate it into the plan. Common tools: spreadsheets (manual control), YNAB (zero-based digital envelopes), Mint/Copilot/Monarch Money (automatic transaction categorization), bank-native budgeting features (vary by institution), or even a paper ledger for envelope-method users.
- Set a concrete **first milestone** based on the user's primary goal: "At $500/month to your emergency fund, you will reach your $1,000 initial target in 2 months. Set a calendar reminder to check your fund balance on [date]."

---

## Output Format

```
## Monthly Budget: [Method Name]

> Note: This budget is an educational planning tool, not professional financial advice.

**Budget Period:** [Month Year]
**Total Monthly After-Tax Income:** $X,XXX
**Budgeting Method:** [50/30/20 / Zero-Based / Envelope / Pay-Yourself-First]

---

### Income Sources
| Source                        | Monthly Amount | Notes              |
|-------------------------------|---------------|--------------------|
| [Primary employment]          | $X,XXX.XX     |                    |
| [Secondary income source]     | $X,XXX.XX     | [Est. if variable] |
| **Total Monthly Income**      | **$X,XXX.XX** |                    |

---

### Budget Allocations
| Category                    | Budgeted  | % of Income | Type         |
|-----------------------------|----------|-------------|--------------|
| **NEEDS**                   |          |             |              |
| Housing (rent/mortgage)     | $X,XXX   | XX%         | Need         |
| Utilities -- Electric/Gas   | $XXX     | X%          | Need         |
| Utilities -- Internet/Phone | $XXX     | X%          | Need         |
| Groceries                   | $XXX     | X%          | Need         |
| Transportation (car/transit)| $XXX     | X%          | Need         |
| Auto/Renters Insurance      | $XXX     | X%          | Need         |
| Health Insurance (if not pre-tax) | $XXX | X%         | Need         |
| Minimum Debt Payments       | $XXX     | X%          | Need         |
| Childcare (if applicable)   | $XXX     | X%          | Need         |
| *Needs Subtotal*            | *$X,XXX* | *XX%*       |              |
|                             |          |             |              |
| **WANTS**                   |          |             |              |
| Dining Out / Takeout        | $XXX     | X%          | Want         |
| Entertainment               | $XXX     | X%          | Want         |
| Subscriptions               | $XXX     | X%          | Want         |
| Hobbies / Personal Spending | $XXX     | X%          | Want         |
| Clothing                    | $XXX     | X%          | Want         |
| *Wants Subtotal*            | *$XXX*   | *XX%*        |              |
|                             |          |             |              |
| **SAVINGS & DEBT PAYOFF**   |          |             |              |
| Emergency Fund              | $XXX     | X%          | Savings      |
| Extra Debt Payment          | $XXX     | X%          | Debt Payoff  |
| Retirement (IRA/Roth IRA)   | $XXX     | X%          | Savings      |
| [Goal-Specific Savings]     | $XXX     | X%          | Savings      |
| *Savings Subtotal*          | *$XXX*   | *XX%*        |              |
|                             |          |             |              |
| **SINKING FUNDS**           |          |             |              |
| Car Maintenance Fund        | $XXX     | X%          | Savings      |
| Medical/Dental Fund         | $XXX     | X%          | Savings      |
| Holiday / Gifts Fund        | $XXX     | X%          | Savings      |
| [Other Irregular Expense]   | $XXX     | X%          | Savings      |
| *Sinking Funds Subtotal*    | *$XXX*   | *XX%*        |              |
|                             |          |             |              |
| **TOTAL ALLOCATED**         | **$X,XXX** | **100%**  |              |

---

### Budget Summary vs. Method Targets
| Type                  | Budgeted   | % of Income | Method Target | Status        |
|-----------------------|-----------|-------------|---------------|---------------|
| Needs                 | $X,XXX    | XX%         | 50%           | [✅ On / ⚠️ Over] |
| Wants                 | $XXX      | XX%         | 30%           | [✅ On / ⚠️ Over] |
| Savings + Debt Payoff | $XXX      | XX%         | 20%           | [✅ On / ⚠️ Under] |
| Sinking Funds         | $XXX      | X%          | (within 20%)  |               |
| **Total**             | **$X,XXX**| **100%**    | 100%          | ✅             |

> ⚠️ **Flag:** [If applicable: "Needs exceed 50% target. See adjustments below." / "Savings below 10% -- financial fragility risk."]

---

### Sinking Fund Detail
| Fund Name           | Annual Target | Monthly Contribution | Months to Fund | Notes          |
|---------------------|--------------|---------------------|----------------|----------------|
| Car Maintenance     | $XXX         | $XX                 | X months       | [Last service] |
| Medical Deductible  | $X,XXX       | $XXX                | X months       |                |
| Holiday / Gifts     | $XXX         | $XX                 | X months       |                |
| [Other]             | $XXX         | $XX                 | X months       |                |

---

### Recommended Adjustments
1. **[Category]:** Reduce from $XXX to $XXX -- saves $XX/month. Rationale: [specific reason].
2. **[Subscription/Service]:** Cancel or downgrade [specific item] -- saves $XX/month.
3. **[Reallocation]:** Move $XX/month from [Want category] to [Emergency Fund / Sinking Fund / Goal].
4. **[Income-side option if applicable]:** [Specific suggestion tied to user's situation].

> Net impact of all adjustments: $XXX/month freed up, bringing Savings to XX% of income.

---

### Goal Milestone Tracker
| Goal                    | Monthly Contribution | Target Amount | Months to Goal |
|-------------------------|---------------------|--------------|----------------|
| Emergency Fund (1 month)| $XXX                | $X,XXX       | X months       |
| [Secondary Goal]        | $XXX                | $X,XXX       | X months       |

---

### Tracking Plan
- [ ] **Weekly check-in:** Every [day] at [time] -- 15 minutes. Compare actual vs. budgeted in each category.
- [ ] **Monthly reset:** [Specific date] each month -- 30 minutes. Enter prior-month actuals, adjust next-month budget.
- [ ] **Watch categories:** [Category 1] (currently at $XXX -- easiest to overspend), [Category 2]
- [ ] **First milestone check:** [Date] -- verify [Emergency Fund / Goal] balance has reached $XXX.
- [ ] **Tool:** [Spreadsheet / app recommendation based on user's method] for tracking actuals.
```

---

## Rules

1. **Always present the disclaimer first.** Every budget output must include the educational disclaimer. Do not omit it even when the output is a quick adjustment or partial budget update.

2. **Never use gross income as the budget base.** Personal budgets operate on after-tax take-home pay only. If the user gives gross income, ask for their net take-home or estimate net by applying standard withholding rates (approximately 20-30% for most W-2 earners depending on tax bracket and benefits elections) -- and flag clearly that the estimate should be confirmed against their actual pay stub.

3. **Never leave money unassigned in a zero-based budget.** If income minus all named allocations produces a remainder, that remainder must be explicitly assigned to a category -- usually extra debt payment or emergency fund top-up. "Misc" or "leftover" is not a category.

4. **Always convert irregular expenses to monthly sinking fund equivalents.** A budget that ignores annual car insurance, holiday gifts, and car maintenance is not a real budget -- it is a plan that will fail three to four times per year when irregular bills arrive. This conversion is non-negotiable regardless of method used.

5. **Flag financial fragility thresholds explicitly and without judgment.** If savings plus debt repayment above minimums is below 10% of income, mark this with a visible warning. If needs exceed 65% of income, note that this indicates a structural housing or debt burden that percent-based adjustments alone cannot solve. Do not hide these signals to avoid discomfort.

6. **Never recommend specific financial institutions, named investment products, or specific credit cards.** Refer to account types generically: "a high-yield savings account," "a Roth IRA," "a 401k up to your employer match." The moment a specific institution or product is named, the output crosses from education into advice requiring licensure.

7. **Always show percentage of income for every line item.** Absolute dollar amounts mean nothing across different income levels. A $400 grocery budget is 4% of a $10,000/month income and 9% of a $4,500/month income -- those are very different budget positions. Percentages enable the user to self-assess proportion and enable year-over-year comparison as income changes.

8. **Distinguish between minimum debt payments (Needs) and extra debt payments (Savings/Debt Payoff).** Minimum payments are contractual obligations -- not paying them has immediate consequences. Extra payments above minimums are discretionary savings choices. Conflating them produces a misleading picture of financial necessity versus choice.

9. **Provide specific dollar amounts in every recommended adjustment.** "Reduce dining out spending" is useless guidance. "Reduce dining out from $450 to $250 -- that is $200/month, which closes your entire savings gap" is actionable. Every adjustment recommendation must name the category, the current amount, the proposed new amount, the monthly saving, and the reallocation destination.

10. **Sinking funds are Savings category allocations, not expenses.** Money set aside monthly for future irregular bills is savings behavior, not current-month spending. Label them accordingly in the budget table so they count toward the user's savings rate and so the user understands they are building reserves, not spending money.

11. **Never present 50/30/20 percentages as universal law.** The 50/30/20 split was designed for median incomes in average cost-of-living areas. In high-cost cities (San Francisco, New York, Boston), housing alone can consume 40-50% of a middle-income earner's after-tax income. In those cases, the framework adapts: prioritize keeping savings at or above 15%, compress wants before calling needs unfixable, and acknowledge the constraint explicitly.

12. **Always include a Goal Milestone Tracker when the user has stated financial goals.** Vague goals fail. "I want an emergency fund" becomes "at $500/month you reach $1,000 in 2 months and $9,000 (3-month emergency fund) in 18 months." Turning goals into dated milestones creates accountability and momentum.

---

## Edge Cases

### Irregular or Variable Income (Freelancers, Gig Workers, Commission-Based Employees)
Fixed percentage targets are unreliable when monthly income changes by 30-50% or more. Use a **baseline income method**: calculate the average of the last 6 months of income, then identify the lowest single month in that window. Build the essential-expenses-only budget using the lowest month as the income ceiling -- this ensures needs are always covered. Budget the difference between the baseline average and the low month as variable surplus. In high-income months, direct the surplus in priority order: (1) replenish buffer fund to 1-2 months of essential expenses, (2) catch up on any savings goals behind target, (3) accelerate debt payoff. Recommend zero-based budgeting recalculated from scratch each month rather than a static template, because the monthly starting number changes. A "buffer account" holding 1-2 months of essential expenses is a critical infrastructure piece for irregular-income households -- build it into the budget explicitly.

### Shared Finances (Partners, Spouses, Roommates)
The correct approach depends on how the household manages money. Ask: "Do you manage all finances jointly, split everything equally, or each pay different categories?" For **fully joint finances**: build one combined budget with all household income and all household expenses -- treat the household as a single entity. For **proportional contribution** (common when incomes differ significantly): each partner contributes to a shared account proportional to their income share (if one earns 60% of household income, they contribute 60% of shared expenses). Build the user's budget showing their contribution to shared expenses as fixed line items, plus their personal discretionary money. For **split-category arrangements** (one pays rent, one pays groceries): build the budget for the user's assigned categories only, note explicitly that the full household budget has additional categories handled by the partner, and flag that the user should know the full household picture even if they only manage half.

### Zero or Interrupted Income (Job Loss, Medical Leave, Parental Leave)
Shift immediately from allocation budgeting to **emergency triage mode**. Do not build a standard budget. Instead: (1) Calculate current liquid reserves (checking + savings + accessible funds). (2) Identify the minimum monthly "survival budget" -- housing, utilities, groceries, insurance, minimum debt payments only -- everything else is suspended. (3) Divide liquid reserves by the survival budget to calculate runway in months. (4) Identify which expenses have hardship deferment options (federal student loans, many landlords, some insurers, most credit cards have hardship programs). (5) Set a weekly spending ceiling equal to (liquid reserves / estimated weeks until income resumes), preserving a 4-week buffer. Do not build wants categories into a zero-income budget.

### Very High Income with Large Surpluses
When income is high enough that 50/30/20 produces surplus wants dollars that exceed any reasonable use, the framework needs upward recalibration. A household with $25,000/month after-tax take-home has a "wants" ceiling of $7,500/month -- which may vastly exceed actual lifestyle spending. In this case: increase the savings/debt target above 20% first (many high-income earners can sustainably save 30-40% and accelerate financial independence timelines significantly). Define specific additional savings goals: taxable brokerage contributions, children's 529 accounts, real estate reserve fund, charitable giving targets. Do not let unallocated surplus sit in checking -- assign it explicitly or it will inflate lifestyle spending by default.

### Household with Multiple Debt Minimums Consuming Most of the Budget
When minimum debt payments across student loans, auto loans, personal loans, and credit cards consume 25-35% of after-tax income, the standard budget framework breaks down because minimum payments are Needs that crowd out savings entirely. In this case: (1) List every debt with its balance, interest rate, and minimum payment. (2) Identify whether any debts are at 0% promotional rates (treat differently from high-interest debt). (3) Note that the debt payoff sequencing decision itself should be handled by `debt-snowball-planner` or `debt-avalanche-planner` -- this budget skill covers only how to fit minimum payments into the current month's allocation. (4) Build the budget with all minimums as fixed line items. (5) Identify even a small extra payment allocation ($25-$100/month) that can be targeted at one debt -- even a minimal amount creates momentum and marginally reduces future minimum requirements.

### Users Who Have Never Tracked Their Spending and Cannot Provide Numbers
Some users genuinely do not know what they spend in each category. Do not block budget creation on perfect data. Use a two-phase approach: **Phase 1** -- build a budget using estimates and averages (national average benchmarks: housing 25-35% of income, groceries $200-$400/month for one adult, utilities $150-$300/month, transportation 10-15% of income). Mark every estimated line item with an asterisk. **Phase 2** -- instruct the user to review their last two months of bank and credit card statements and replace every estimate with an actual average. Set the Phase 2 review as a specific action item with a date. A budget built on estimates is better than no budget, but the user must understand that the estimates carry significant uncertainty until replaced with real data.

### Student with Loans in Deferment or Grace Period
Loans in deferment or grace period require a forward-looking budget adjustment. Include the **expected future minimum payment** as a sinking fund line item today -- the user is accumulating a future obligation right now even if no payment is currently due. Calculate when the grace period ends (typically 6 months after graduation for federal loans) and what the monthly payment will be under a standard 10-year repayment plan (rough estimate: $100/month per $10,000 borrowed at standard rates). Add this amount as "Future Student Loan Payment -- Sinking Fund" so the budget is not shocked when payments resume. Simultaneously, the money accumulating in this sinking fund can be held in savings and applied as a lump-sum payment when repayment begins, reducing principal and potentially shortening the loan term.

### Two-Income Household Facing Potential Income Reduction
When one partner's income is at risk (contract work ending, pregnancy leave approaching, business struggling), build two explicit budgets: a **dual-income budget** (current state) and a **single-income contingency budget** (survive on one income only). The gap between the two budgets identifies which categories are fully funded by the at-risk income and would need to be cut or covered by the primary income. This forces the household to see the specific dollar impact of an income reduction before it happens and identify which cuts are manageable versus which would require structural changes (housing downsizing, vehicle reduction).

---

## Example

**Input:** "My husband and I both work. I bring home $3,200/month and he brings home $2,800/month -- so $6,000 total. Our rent is $1,850, electricity averages $90, internet $65, phone for both of us is $120. We spend about $600 on groceries. He has a car payment of $380 and we pay $180/month for car insurance. I take the subway to work. We eat out probably 3-4 times a week and spend maybe $500-600 on that, plus another $150 on streaming and other subscriptions. I'd say we spend $200 on other random stuff each month. We have about $800 in savings right now. No retirement accounts yet, and we want to build an emergency fund and eventually save for a house down payment."

---

**Output:**

## Monthly Budget: 50/30/20 Method

> Note: This budget is an educational planning tool, not professional financial advice.

**Budget Period:** Current Month
**Total Monthly After-Tax Income:** $6,000
**Budgeting Method:** 50/30/20 (with zero-based sinking fund assignments)

---

### Income Sources
| Source                     | Monthly Amount | Notes           |
|----------------------------|---------------|-----------------|
| Partner 1 (your income)    | $3,200        | After-tax       |
| Partner 2 (spouse's income)| $2,800        | After-tax       |
| **Total Monthly Income**   | **$6,000**    |                 |

---

### Budget Allocations
| Category                      | Budgeted  | % of Income | Type     |
|-------------------------------|----------|-------------|----------|
| **NEEDS**                     |          |             |          |
| Rent                          | $1,850   | 31%         | Need     |
| Electricity                   | $90      | 2%          | Need     |
| Internet                      | $65      | 1%          | Need     |
| Phone (both)                  | $120     | 2%          | Need     |
| Groceries                     | $600     | 10%         | Need     |
| Car payment (spouse)          | $380     | 6%          | Need     |
| Car insurance                 | $180     | 3%          | Need     |
| Transit / subway (your commute)| $100    | 2%          | Need*    |
| *Needs Subtotal*              | *$3,385* | *56%*       |          |
|                               |          |             |          |
| **WANTS**                     |          |             |          |
| Dining out / takeout          | $400     | 7%          | Want     |
| Streaming subscriptions       | $100     | 2%          | Want     |
| Other subscriptions           | $50      | 1%          | Want     |
| Personal / miscellaneous      | $200     | 3%          | Want     |
| *Wants Subtotal*              | *$750*   | *13%*       |          |
|                               |          |             |          |
| **SAVINGS & DEBT PAYOFF**     |          |             |          |
| Emergency Fund                | $500     | 8%          | Savings  |
| House Down Payment Fund       | $300     | 5%          | Savings  |
| Retirement (IRA -- future)    | $0       | 0%          | Savings  |
| *Savings Subtotal*            | *$800*   | *13%*       |          |
|                               |          |             |          |
| **SINKING FUNDS**             |          |             |          |
| Car Maintenance Fund          | $65      | 1%          | Savings  |
| Medical / Dental Fund         | $100     | 2%          | Savings  |
| Holiday / Gifts Fund          | $60      | 1%          | Savings  |
| Home / Apartment Fund         | $40      | 1%          | Savings  |
| *Sinking Funds Subtotal*      | *$265*   | *4%*        |          |
|                               |          |             |          |
| **TOTAL ALLOCATED**           | **$5,200** | **87%**   |          |
| **Unassigned Surplus**        | **$800** | **13%**     | Assign   |

> *Transit estimate based on typical monthly transit pass cost -- confirm with your actual monthly pass or usage.

---

### Budget Summary vs. Method Targets

| Type                    | Budgeted   | % of Income | Method Target | Status        |
|-------------------------|-----------|-------------|---------------|---------------|
| Needs                   | $3,385    | 56%         | ≤50%          | ⚠️ Over by 6% |
| Wants                   | $750      | 13%         | ≤30%          | ✅ Well under  |
| Savings + Sinking Funds | $1,065    | 18%         | ≥20%          | ⚠️ Slight gap  |
| Unassigned              | $800      | 13%         | Assign to $0  | ⚠️ Needs assignment |
| **Total**               | **$6,000**| **100%**    | 100%          | ✅             |

> ⚠️ **Flag -- Needs at 56%:** Your needs exceed the 50% target, driven primarily by rent ($1,850 = 31% of income) and the car payment ($380 = 6%). These are fixed costs unlikely to change in the short term. The good news: your wants are only 13%, well below the 30% ceiling, giving you room to work. The structural note is that your needs percentage will improve as your income grows -- but the better immediate lever is assigning the $800 surplus to boost savings above 20%.

> ⚠️ **Note -- $0 in Retirement:** You currently have no retirement contributions budgeted. This is the highest-priority category to add after your emergency fund reaches 3 months of expenses. Even $100-$200/month in a Roth IRA each, started now, compounds significantly over a 30-40 year window. This budget leaves you room to add retirement contributions once your emergency fund reaches its first milestone.

---

### Sinking Fund Detail

| Fund Name           | Annual Target | Monthly Contribution | Months to Fund | Notes                               |
|---------------------|--------------|---------------------|----------------|-------------------------------------|
| Car Maintenance     | $780         | $65                 | 12 months      | Oil changes, tires, misc. repairs   |
| Medical / Dental    | $1,200       | $100                | 12 months      | Co-pays, deductibles, dental cleanings |
| Holiday / Gifts     | $720         | $60                 | 12 months      | Both sides of the family            |
| Home / Apartment    | $480         | $40                 | 12 months      | Small repairs, renter essentials    |

Keep sinking fund contributions in a separate high-yield savings account with labeled sub-funds. This prevents the money from being accidentally spent on daily expenses.

---

### Unassigned $800 -- Recommended Assignments

You have $800/month unassigned after all current budget categories. Here is a recommended priority sequence for that surplus:

1. **Emergency Fund acceleration:** Redirect $500/month (you already have $500 budgeted, total becomes $1,000/month to emergency fund). You currently have $800 in savings -- you need $6,000 to reach 1 month of expenses. At $1,000/month, you reach 1-month emergency fund in approximately 5 months and a 3-month fund ($18,000) in approximately 18 months.
2. **Retirement starter contributions:** Once emergency fund reaches $6,000, redirect $400/month ($200 each) to Roth IRAs. The remaining $400 continues to the down payment fund.
3. **Down payment acceleration:** After retirement contributions begin, route remaining surplus to the down payment fund. At $600-$700/month to the down payment fund, a $60,000 down payment on a $300,000 home takes approximately 7-8 years from zero -- or faster if income increases.

---

### Recommended Adjustments

1. **Dining Out -- reduce from $500-600 range to a fixed $400 ceiling:** You're spending approximately $500-600/month on dining (3-4 times per week at an average of $35-50 per outing). Setting a firm $400 budget and tracking it weekly saves $100-200/month. Redirect to emergency fund. This is the single easiest lever in your budget because your wants are already low -- this is simply tightening an already-manageable category.

2. **Phone plan -- audit for potential reduction:** $120/month for two lines is $60/line, which is at the higher end of standard plans. If either line is on a premium tier, a mid-tier plan for both at $40-45/line could save $30-40/month annually. Even $30/month freed up = $360/year. Redirect to medical sinking fund.

3. **Subscriptions -- audit for unused services:** $150/month across streaming and other subscriptions is reasonable for two people, but audit each one: list every subscription, when it was last actively used, and whether both people use it. Canceling even one $15/month service saves $180/year.

4. **Assign the $800 surplus this month:** Do not leave it unassigned. Unassigned money in a joint checking account will be spent on the same miscellaneous items that already appear as $200 in your "random stuff" category. Assign it in the priority order above -- emergency fund first, retirement second, down payment third.

> **Net impact of adjustments 1-3:** $160-$270/month freed up, pushing total savings rate from 18% to 20-23% of income.

---

### Goal Milestone Tracker

| Goal                             | Monthly Contribution | Target Amount  | Months to Goal |
|----------------------------------|---------------------|----------------|----------------|
| Emergency Fund -- 1 month expenses | $1,000 (total)    | $6,000         | ~5 months      |
| Emergency Fund -- 3 months expenses | $1,000 (total)   | $18,000        | ~18 months     |
| House Down Payment (10% of $300k) | $400-700           | $30,000        | ~4-6 years     |
| Retirement -- starter ($200 each) | $400 (after EF)   | Ongoing        | Begin month 6  |

---

### Tracking Plan

- [ ] **Weekly check-in:** Every Sunday evening -- 15 minutes. Log actual dining out and miscellaneous spending against the $400 and $200 budgets. These are the two categories most likely to drift.
- [ ] **Monthly reset:** First Sunday of each month -- 30 minutes. Pull bank and credit card statements, compare actuals to budget, update the down payment and emergency fund running totals.
- [ ] **Watch categories:** Dining/Takeout ($400 ceiling -- 3-4 outings per week adds up fast) and Miscellaneous ($200 ceiling -- this category tends to absorb unplanned spending that should have its own named category).
- [ ] **Sinking fund check:** Each month, confirm that $265/month has been transferred to the separate sinking fund account before spending discretionary money.
- [ ] **First milestone check:** In 5 months -- confirm emergency fund has reached $5,800-$6,000 (1 full month of expenses). At that milestone, begin Roth IRA contributions.
- [ ] **Budget tool suggestion:** Because you have a joint budget, a shared spreadsheet or a budgeting app that both partners can access simultaneously will prevent the "I thought you paid that" problem. Label every shared contribution and make both partners active participants in the monthly review.
