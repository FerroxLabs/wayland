---
name: fifty-thirty-twenty-budget
description: |
  Applies the 50/30/20 budgeting rule to the user's income, categorizing every expense as a need (50%), want (30%), or savings/debt repayment (20%). Produces a populated allocation table showing current spending against these targets with specific rebalancing recommendations.
  Use when the user asks about the 50/30/20 rule, wants a simple percentage-based budget, or needs help categorizing spending into needs, wants, and savings.
  Do NOT use for zero-based budgeting (use zero-based-budget), variable income budgets (use variable-income-budget), or investment allocation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance expenses savings"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Fifty Thirty Twenty Budget

> **Disclaimer:** This skill provides educational information about personal finance concepts and general budgeting guidance. It does NOT constitute financial advice, tax advice, investment recommendations, or legal counsel. Individual financial circumstances vary significantly. Always consult a qualified financial advisor, CPA, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly asks about the 50/30/20 rule, percentage-based budgeting, or how to divide their income into spending categories
- The user wants to know whether their current spending allocation is healthy without building a line-by-line budget from scratch
- The user is new to budgeting and wants the simplest defensible framework to start with
- The user has a stable, predictable monthly income (salaried employee, consistent hourly worker, fixed pension/annuity) and wants a clear allocation structure
- The user wants to categorize a list of existing expenses and see how they stack up against a benchmark
- The user is frustrated with over-complicated budgeting systems and wants a top-down framework they can actually maintain
- The user asks "Am I saving enough?" or "Is my spending balanced?" without specifying a method
- The user is preparing for a financial goal (paying off debt, building an emergency fund, saving for a house) and wants to understand how much they should be redirecting from wants to savings

**Do NOT use when:**
- The user wants to assign every dollar to a specific named category or envelope -- use the `zero-based-budget` skill instead
- The user has highly variable or irregular income (freelancers, commissioned salespeople, gig workers with swinging monthly earnings) -- use the `variable-income-budget` skill instead, since basing allocations on an inconsistent income figure will produce unreliable targets
- The user is building their very first budget with no prior record of their spending -- use the `first-budget` skill to establish a baseline before applying a framework
- The user wants detailed investment allocation across asset classes (stocks, bonds, real estate) -- that is a separate investing domain
- The user needs a business budget, departmental budget, or project budget -- those require entirely different frameworks
- The user is asking about tax withholding or optimizing payroll deductions -- refer to a tax skills domain
- The user explicitly wants a different framework (pay-yourself-first, cash envelope, reverse budgeting) -- honor their stated preference rather than overriding it with 50/30/20

---

## Process

### Step 1: Gather Income Information

- Ask for total monthly **after-tax, take-home pay** -- this is the number that actually hits the bank account, not gross salary. This distinction is critical: a $75,000 gross salary in a moderate-tax state produces roughly $4,800--$5,200/month take-home, not $6,250.
- If the user gives an annual gross figure, help them estimate take-home using this rough rule of thumb: for most US earners in the $30,000--$100,000 range, take-home is approximately 72--80% of gross after federal/state income tax, FICA (7.65%), and any pre-tax deductions (401k, health insurance premiums). For a more precise figure, ask them to check a recent pay stub for "Net Pay."
- Confirm whether income is consistent month to month. If income varies by more than 10--15% between months, flag this for the user -- 50/30/20 works best on stable income. Do not redirect to `variable-income-budget` unless variance is genuinely severe (seasonal workers, project-based freelancers, commission-dominant roles).
- Collect all income sources: primary job take-home, secondary job take-home, reliable side income, alimony or child support received, consistent rental income. Do NOT include irregular windfalls (tax refunds, bonuses, gifts) in the base monthly income number -- treat those separately.
- If the user mentions pre-tax retirement contributions (401k) or HSA contributions deducted from payroll, note that these already count toward the 20% savings bucket even though they never appear in take-home pay. Capture those amounts explicitly.

### Step 2: Calculate the Three Allocation Targets

- Compute the three buckets by multiplying take-home income by the respective percentages:
  - **Needs target:** Monthly take-home × 0.50
  - **Wants target:** Monthly take-home × 0.30
  - **Savings/Debt target:** Monthly take-home × 0.20
- Always display targets as **both dollar amounts and percentages** -- the dollar amount is what the user will actually work with when comparing to real expenses.
- If pre-tax savings contributions exist, add them back in for the savings bucket display. For example, if someone has $300/month going to a 401k pre-tax and a $4,700 take-home, their effective available income for the 50/30/20 framework is $4,700, but their effective savings total already includes that $300. Make this visible.
- Note the total explicitly so it always equals 100% -- this prevents the common confusion when users see percentages and wonder if something is missing.

### Step 3: Categorize Every Expense with Explicit Decision Rules

Work through the user's complete expense list and assign each item to one of the three buckets. Use these classification rules precisely, because the most common budgeting mistakes happen at categorization boundaries.

**Needs (survival and contractual obligations):**
- Housing: rent, mortgage principal and interest, renters insurance (legally or contractually required coverage), property tax if paid directly, HOA fees if mandatory
- Utilities: electricity, gas, water/sewer, trash. Basic internet (the lowest tier that enables remote work or essential household function). Basic mobile phone plan (not the device payment -- see below)
- Groceries: all food purchased for preparation at home. This includes grocery delivery fees for home-food orders. Does NOT include restaurant delivery even if the app is the same.
- Transportation: minimum car payment (auto loan), required auto insurance, fuel for work/essential travel, public transit pass
- Healthcare: health insurance premiums (if not pre-tax), required prescription costs, essential medical appointments
- Minimum debt payments: the required minimum payment on every debt obligation -- student loans, credit cards, personal loans, medical debt plans. Only the minimum. Extra payments above the minimum are a savings/debt repayment item.
- Childcare required for employment (daycare, after-school care so parents can work)
- Basic clothing replacement for work (not fashion purchases -- a new pair of work shoes when the old ones are destroyed is a need; a third pair of sneakers is a want)

**Wants (quality of life improvements above survival baseline):**
- All dining out, takeout, food delivery from restaurants, coffee shop purchases -- these are always wants, regardless of how the user frames them
- Entertainment: streaming subscriptions, cable/satellite, gaming, concerts, movies, sporting events, hobbies
- Gym memberships, fitness apps, sports leagues
- Upgraded phone or internet beyond basic tier (the device payment on a financed flagship phone is a want; the cheapest plan that enables calling and data for work is a need)
- Non-essential subscriptions: news apps, music services, software subscriptions beyond work requirements, box subscriptions
- Clothing beyond genuine replacement needs: fashion, accessories, extra shoes
- Vacations and travel
- Gifts for holidays, birthdays, weddings
- Home décor and optional upgrades
- Pet expenses beyond basic food and required veterinary care (grooming, pet accessories, premium pet food tiers)
- Personal care beyond basics: salon treatments, spa, premium cosmetics

**Savings/Debt Repayment (building future security and eliminating debt above minimums):**
- Emergency fund contributions (target: 3 months of essential expenses for stable employment, 6 months for variable income or single-income households)
- Extra debt payments above required minimums (the most financially impactful item in most users' 20% bucket)
- Employer-sponsored retirement contributions: 401k, 403b, SIMPLE IRA -- whether pre-tax or Roth
- IRA contributions (Traditional or Roth)
- HSA contributions if used as a long-term savings vehicle
- Sinking funds for specific future goals: house down payment, car replacement fund, home repair fund, college savings (529)
- Investment account contributions (taxable brokerage)
- Any automated savings transfers to dedicated goal accounts

### Step 4: Sum the Buckets and Compare to Targets

- Total each bucket and compute actual percentage of take-home income.
- Calculate the dollar variance from the target for each bucket (actual minus target, showing + for over and -- for under).
- Check whether the three actual buckets sum to 100% of income. If they do not, calculate the unallocated gap -- this is money the user is spending but cannot account for, which is extremely common (average US household leaks 15--20% of income to untracked small purchases, cash spending, and forgotten subscriptions).
- Flag the unallocated gap prominently -- it is often the single largest "category" and represents the biggest opportunity.
- Determine the alignment status of each bucket: **On Target** (within ±3 percentage points of the target), **Over**, or **Under**.
- Identify the primary driver of any overage. For needs overages, housing is the culprit in roughly 70% of cases in US metro areas. For wants overages, dining out and subscriptions are the most common offenders.

### Step 5: Generate Specific, Actionable Rebalancing Recommendations

- Provide 3--5 concrete recommendations, each with a specific dollar amount and a specific action.
- Order recommendations by impact first, then by ease of implementation. High-impact, low-difficulty actions come first.
- For overspent buckets: identify the 2--3 largest line items and name them explicitly. A recommendation must say "Reduce dining out from $400 to $250 (saves $150/month)" not "consider spending less on food."
- For the unallocated gap: the first recommendation is almost always "track where this money goes for 30 days." Suggest that the user use a free bank transaction export or a budgeting app to identify this spending before assuming it should stay unallocated.
- For underfunded savings: suggest a specific allocation sequence. The generally recommended order for the savings bucket is: (1) capture full employer 401k match -- this is a guaranteed 50--100% return on investment and should never be skipped, (2) build emergency fund to 1 month of expenses as a minimum floor, (3) pay down high-interest debt above minimums (any rate above 6--7% is typically worth accelerating), (4) continue building emergency fund to 3--6 months, (5) max retirement accounts, (6) other savings goals.
- If the needs bucket is over 50% and the cause is housing, do not suggest the user immediately move. Instead: identify whether any other needs items are reducible (phone plan downgrade, insurance quote comparison, eliminating a vehicle if transit is available), project when the housing percentage might naturally improve (income growth, lease renewal, mortgage paydown), and note that an adapted ratio of 60/20/20 or 55/25/20 is appropriate for high-cost-of-living situations.
- Show the projected new allocation percentages if the user implements all recommendations.

### Step 6: Assess Whether 50/30/20 Fits the User's Situation

Every user's situation should be evaluated for framework fit. The 50/30/20 rule was designed for a middle-income earner in a moderate cost-of-living area. It does not fit everyone, and pretending it does produces demotivating results.

**When to flag framework mismatch and adapt:**
- Needs consuming 55--65% of income: adapt to 55/25/20 or 60/20/20, and focus on preserving the 20% savings target as non-negotiable.
- Needs consuming 65%+ of income: the framework may not be appropriate. Acknowledge this directly. Note that the 20% savings target should be preserved at a minimum even if wants must be cut to near zero. If needs alone consume more than 80% of income, the priority is income growth, not optimization of spending ratios.
- Very high income (take-home above $10,000/month): the 30% wants bucket produces a very large dollar amount ($3,000+). This is fine if the user is also meeting savings goals, but the framework has diminishing value. Suggest the user consider a reverse-budget approach where savings goals are funded first and the remainder is discretionary.
- Significant existing debt: when minimum payments alone consume 15--20% of income and housing is already at 30%, the user is in a mathematically constrained situation. In these cases, direct them toward debt payoff strategies (avalanche or snowball) and treat 50/30/20 as a long-term target state, not a current reality.

### Step 7: Deliver the Formatted Output and Establish a Review Cycle

- Present the full budget analysis in the structured table format defined in the Output Format section.
- Always end with a specific, time-bound next step -- not a vague "track your spending." Say "Export your last 30 days of bank and credit card transactions this week and re-run this analysis with real numbers."
- Set a review expectation: 50/30/20 is most useful as a monthly check-in tool. Suggest the user revisit it at the same time each month.
- If the user's budget shows a meaningful improvement path (e.g., if they capture the unallocated gap and redirect it to savings, they will hit 20% savings), make that outcome explicit and motivating.

---

## Output Format

Present the complete analysis in this structure. Every numeric field must be populated with actual calculated values -- no placeholder text in the final output.

```
## 50/30/20 Budget Analysis

**Monthly After-Tax Income:** $X,XXX
**Pre-Tax Savings Contributions (if any):** $XXX (401k, HSA -- counted in savings bucket)
**Effective Budget Base:** $X,XXX

---

### Allocation Targets
| Bucket            | Target % | Target Amount |
|-------------------|----------|---------------|
| Needs             | 50%      | $X,XXX        |
| Wants             | 30%      | $X,XXX        |
| Savings/Debt      | 20%      | $X,XXX        |
| **Total**         | **100%** | **$X,XXX**    |

---

### Needs (Target: 50% = $X,XXX)
| Expense                  | Monthly Amount | Category Note                        |
|--------------------------|----------------|--------------------------------------|
| Housing (rent/mortgage)  | $X,XXX         | [X]% of income alone                 |
| Utilities                | $XXX           | Electric, gas, water                 |
| Internet (basic)         | $XXX           | Minimum functional tier              |
| Groceries                | $XXX           | Home preparation only                |
| Transportation           | $XXX           | Car payment + insurance + fuel       |
| Phone (basic plan)       | $XXX           | Basic communication                  |
| Health insurance         | $XXX           | Premiums not deducted pre-tax        |
| Minimum debt payments    | $XXX           | [List each loan separately]          |
| Childcare (work-related) | $XXX           | If applicable                        |
| **Needs Total**          | **$X,XXX**     | **[XX]% of income**                  |

**Needs Status:** [On Target / Over by $XXX / Under by $XXX]
**Primary Driver of Overage (if applicable):** [Housing at XX% of income]

---

### Wants (Target: 30% = $X,XXX)
| Expense                   | Monthly Amount | Category Note                        |
|---------------------------|----------------|--------------------------------------|
| Dining out / takeout      | $XXX           | All food outside home                |
| Entertainment             | $XXX           | Events, hobbies, activities          |
| Streaming & subscriptions | $XXX           | [List services]                      |
| Gym / fitness             | $XXX           |                                      |
| Shopping (non-essential)  | $XXX           | Clothing, household wants            |
| Travel & vacations        | $XXX           | Monthly average if irregular         |
| Gifts & celebrations      | $XXX           | Monthly average                      |
| Upgraded phone/internet   | $XXX           | Amount above basic tier              |
| Other wants               | $XXX           |                                      |
| **Wants Total**           | **$X,XXX**     | **[XX]% of income**                  |

**Wants Status:** [On Target / Over by $XXX / Under by $XXX]

---

### Savings & Debt Repayment (Target: 20% = $X,XXX)
| Category                     | Monthly Amount | Notes                                  |
|------------------------------|----------------|----------------------------------------|
| Emergency fund contributions | $XXX           | Current balance: $X,XXX / Goal: $X,XXX |
| Extra debt payments          | $XXX           | Above minimums -- [which loan]         |
| 401k / 403b contributions    | $XXX           | [Employer match captured: $XXX]        |
| IRA contributions            | $XXX           | [Traditional/Roth]                     |
| HSA contributions            | $XXX           |                                        |
| Sinking funds                | $XXX           | [Goal: down payment, car, etc.]        |
| Other savings                | $XXX           |                                        |
| **Savings Total**            | **$X,XXX**     | **[XX]% of income**                    |

**Savings Status:** [On Target / Over by $XXX / Under by $XXX]

---

### Budget Scorecard
| Bucket          | Target $  | Actual $  | Actual % | Difference  | Status              |
|-----------------|-----------|-----------|----------|-------------|---------------------|
| Needs           | $X,XXX    | $X,XXX    | XX%      | [+/-]$XXX   | [On Target/Over/Under] |
| Wants           | $X,XXX    | $X,XXX    | XX%      | [+/-]$XXX   | [On Target/Over/Under] |
| Savings/Debt    | $X,XXX    | $X,XXX    | XX%      | [+/-]$XXX   | [On Target/Over/Under] |
| **Unallocated** | **$0**    | **$X,XXX**| **XX%**  | **--**      | **⚠ Track This**    |
| **Total**       | **$X,XXX**| **$X,XXX**| **100%** | **--**      | **--**              |

---

### Framework Fit Assessment
[One of the following:]
- ✅ **50/30/20 fits your income and cost-of-living context well.**
- ⚠ **Adapted ratio recommended: [55/25/20 or 60/20/20]** because [specific reason].
- ⚠ **Framework is aspirational for your current situation.** [Explanation and what to target first.]

---

### Rebalancing Recommendations

**Priority 1 -- [Highest Impact Action]:**
[Specific action] -- reduces/redirects $XXX/month.
Current: $XXX → Recommended: $XXX → Monthly savings: $XXX

**Priority 2 -- [Second Action]:**
[Specific action]
Current: $XXX → Recommended: $XXX → Monthly savings: $XXX

**Priority 3 -- [Third Action]:**
[Specific action]

**Projected Impact of All Recommendations:**
| Bucket       | Current % | Projected % | Change    |
|--------------|-----------|-------------|-----------|
| Needs        | XX%       | XX%         | [+/-]X%   |
| Wants        | XX%       | XX%         | [+/-]X%   |
| Savings/Debt | XX%       | XX%         | [+/-]X%   |

---

### Savings Priority Sequence
If your savings bucket is underfunded, address goals in this order:
1. [ ] Capture full employer 401k/403b match (guaranteed return -- do this first)
2. [ ] Emergency fund to 1 month of essential expenses ($X,XXX)
3. [ ] Pay minimums on all debts (already in Needs bucket)
4. [ ] Accelerate payoff on debt above [X]% interest rate
5. [ ] Emergency fund to 3--6 months ($X,XXX -- $X,XXX)
6. [ ] Max retirement contributions ($23,000 401k limit / $7,000 IRA limit for 2024)
7. [ ] Fund specific goals: [Down payment / car / education]

---

### Next Steps
- [ ] This week: [One specific, time-bound action]
- [ ] This month: [Track spending category for 30 days]
- [ ] 30-day check-in: Re-run this analysis with one full month of actual transaction data
- [ ] Long-term: [One structural change to evaluate at natural milestone -- lease renewal, loan payoff, raise]
```

---

## Rules

1. **Always present the disclaimer before any financial guidance.** The skill is educational and analytical, not advice. Never phrase outputs as "you should invest in" or "the best account for you is." Use "consider," "one option is," or "a common approach is."

2. **Always use after-tax take-home income as the base, never gross income.** This is the most common error users make when attempting 50/30/20 on their own. Gross income produces targets that are unachievable because taxes have not yet been deducted. If a user gives gross income, convert it with explicit reasoning before calculating targets.

3. **Minimum debt payments are Needs; extra payments above minimums are Savings/Debt.** This rule has no exceptions. Misclassifying the minimum as a savings item inflates the savings percentage and masks how much of the user's income is contractually obligated. It also clarifies the real choice: the user controls the savings item (extra payments), not the need item (minimums).

4. **Dining out is always a Want.** This is non-negotiable regardless of how the user frames it ("I have no time to cook," "it's a business lunch I pay for"). The grocery/dining distinction is one of the framework's most important calibration points. Home food preparation is a need; paying someone else to prepare food is a want. Apply this consistently.

5. **Capture and flag every unallocated dollar.** If the user's reported expenses sum to less than their income, the difference is unallocated -- not "saved." Present this gap prominently. In practice, most users have 10--25% of income flowing to small debit card purchases, ATM withdrawals, and forgotten auto-charges. This gap is typically the most actionable finding in the entire analysis.

6. **Never present 50/30/20 as a rigid prescription for users whose needs structurally exceed 50%.** In the 25 largest US metro areas, median rent for a one-bedroom apartment exceeds 30% of median income. In San Francisco, New York, Los Angeles, Boston, and Seattle, housing alone commonly consumes 35--45% of take-home pay. Telling a user in these cities that they are "failing" at budgeting is both inaccurate and counterproductive. Adapt the ratio and focus on what is controllable.

7. **Pre-tax payroll deductions count toward the savings bucket.** A user contributing $400/month pre-tax to a 401k has that money going to savings even though it never appears in their take-home pay. Failing to count pre-tax contributions systematically understates how much users are saving and can falsely suggest they need to increase savings when they are already meeting the target.

8. **Show specific dollar amounts for every recommendation.** "Reduce entertainment spending" is not a recommendation. "Reduce streaming subscriptions from $95/month to $35/month by canceling the two services you use least often, saving $60/month" is a recommendation. Every rebalancing action must include a current amount, a target amount, and the monthly delta.

9. **Do not name specific financial products, banks, brokerages, or credit cards.** The skill provides structural guidance, not product endorsements. Instead of "open a Marcus account," say "consider a high-yield savings account." Instead of "use Mint," say "consider a budgeting app or spreadsheet to track transactions."

10. **Present the employer 401k match as the highest-priority savings action.** The employer match is the single highest guaranteed return available to most employees (50--100% immediate return), yet millions of employees leave it on the table. When a user's savings bucket is underfunded and they have access to an employer match they are not capturing, this must appear as Priority 1 in recommendations before any other savings action.

11. **When a user has very high wants underspending (wants under 15%) with needs overspending, investigate the unallocated gap before recommending they increase wants.** A common pattern is that the user believes they spend nothing on wants, but actually has a large untracked cash or debit card spend that would reveal want-level spending if examined. Do not congratulate extreme wants underspending without verifying it.

12. **Apply the "basic tier vs. upgrade tier" rule to technology and services.** For phone plans: a $30--$40/month plan is a need; anything above that for premium features or device financing is a want. For internet: the lowest tier that supports the household's work requirements is a need; a gigabit upgrade for streaming quality is a want. Always split these if the user has upgraded services.

---

## Edge Cases

**Needs structurally exceed 50% due to high cost-of-living housing:**
This affects the majority of users in major metro areas. Do not attempt to reconcile the math by reclassifying housing as a want or suggesting the user absorb the overage from savings. Instead: acknowledge it explicitly, adapt the ratio to 55/25/20 or 60/20/20 depending on severity, and preserve the 20% savings target as the one non-negotiable element. Focus recommendations on the controllable margins -- insurance cost comparison, phone plan downgrade, transportation alternatives, grocery optimization. Project when the housing ratio will naturally improve (income growth trajectory, mortgage principal paydown schedule) and name that milestone. If the user mentions that a lease is coming up for renewal in the next 6 months, include lease renewal as an explicit next step with a specific rent reduction target.

**User has significant pre-tax deductions that reduce take-home pay dramatically:**
A user contributing 15% of gross to a 401k, paying $600/month in pre-tax health insurance premiums, and contributing to an HSA may have a take-home pay that looks very lean. Their savings bucket may appear underfunded when actually it is substantially funded through payroll. Always ask: "Are there retirement or benefit contributions taken out before your paycheck?" and add those back into the savings bucket before drawing any conclusions. A user with $4,000 take-home who contributes $700 pre-tax to a 401k effectively has a $4,700 budget base with $700 already in savings (14.9% savings rate before any take-home saving).

**User is single vs. household with multiple income earners:**
50/30/20 is most intuitive applied to a household's combined after-tax income when partners pool finances. If partners maintain separate finances, apply the framework to each person's individual income and note that shared expenses (rent, utilities) should be allocated by contribution agreement, not by the full amount appearing in one person's needs. If one partner earns significantly more, the lower earner's needs bucket may structurally exceed 50% even though the household as a whole is under 50%.

**Very low income where needs consume 70--80%+ of take-home:**
At an income level where essential expenses absorb 70%+ of take-home, 50/30/20 is an aspirational framework, not a functional current-state tool. Do not frame this as the user failing at budgeting. Acknowledge explicitly that the framework assumes a minimum income level that provides discretionary margin. Focus on: (1) identifying any emergency fund contribution, even $25--$50/month, as a meaningful win, (2) whether any needs items can be reduced (income-based repayment plans for student loans can dramatically reduce minimums, utility assistance programs exist in most states, SNAP eligibility for food costs), and (3) whether income growth is possible and what the income threshold would be for the framework to become practical. At $30,000 gross in a moderate cost-of-living area, a user needs approximately $38,000--$40,000 gross before 50/30/20 becomes structurally achievable.

**User is paying off high-interest debt aggressively and their savings bucket shows 35--40%:**
The 20% savings target is a floor, not a ceiling. If a user is putting 35% of income toward debt elimination and investments, this is not a problem -- it is excellent financial behavior. The analysis should highlight this positively while noting that once the debt is eliminated, those payments become free cash flow to redirect (typically toward investments and savings goals). Help the user calculate the "debt payoff date" based on current extra payments and name what the monthly budget will look like when that debt is gone.

**User includes irregular/annual expenses that they pay in lump sums:**
Many real expenses do not occur monthly: car registration ($150--$300/year), annual insurance premiums, Amazon Prime ($139/year), Christmas gifts, vacation spending. These need to be converted to monthly equivalents by dividing annual amounts by 12. Always ask "Are there any annual or irregular expenses you pay for in lump sums?" and add those to the analysis as monthly averages. Failing to do this systematically understates both needs and wants, and leads to budget "surprises" when those lump-sum bills arrive.

**User's 50/30/20 analysis shows their budget adds to exactly 100% with no gap, but they say they never have money at the end of the month:**
This is a signal that the user's expense list is incomplete or contains estimated numbers that are lower than actuals. Common omissions: small cash purchases, ATM withdrawals, PayPal/Venmo payments not tied to a specific bill, Amazon purchases categorized vaguely, alcohol, haircuts, parking, and banking fees. Suggest a 30-day transaction audit -- pulling every transaction from all bank accounts and credit cards -- before trusting that the budget balances. The average US consumer has 4--6 forgotten subscriptions totaling $25--$80/month.

**User asks about adapting 50/30/20 after a major life change (new baby, job loss, divorce, move to a high-COL city):**
Do not attempt to apply the framework as though the life change has not occurred. Acknowledge that the new situation requires establishing new baseline numbers before targets make sense. A new baby may add $800--$2,000/month in childcare to the needs bucket. A job loss requires switching to a survival mode minimum-needs budget immediately. A divorce changes household income from two earners to one while fixed costs (housing) may remain similar. Treat these situations as a two-step process: first establish the new baseline income and expenses, then apply 50/30/20 to that new reality.

---

## Example

**Input:** "I earn $72,000 a year gross. My company takes out $400/month for health insurance before taxes, and I contribute $300/month to my 401k, which my company matches 50% up to 6% of salary. My take-home after all deductions is $4,100/month. My monthly expenses are: rent $1,450, electricity $90, gas $45, water $30, internet $75, groceries $380, car payment $285, car insurance $110, gas for car $95, minimum student loan payment $220, gym $45, Netflix $18, Spotify $12, Hulu $18, dining out $320, weekend entertainment $180, clothing and shopping $150, Amazon purchases $75, and I transfer $150 to a savings account each month. I feel like I'm always broke but I can't figure out where my money goes."

**Output:**

## 50/30/20 Budget Analysis

**Monthly After-Tax Income:** $4,100 (take-home)
**Pre-Tax Payroll Deductions:**
- Health insurance: $400/month (benefit, not in budget base)
- 401k contribution: $300/month (counts toward your savings bucket)
- Employer 401k match: $150/month (50% match on your $300 -- this is free money)

**Effective Savings Already Captured Pre-Tax:** $450/month ($300 yours + $150 employer match)
**Budget Base for 50/30/20 Analysis:** $4,100 take-home

---

### Allocation Targets
| Bucket            | Target % | Target Amount |
|-------------------|----------|---------------|
| Needs             | 50%      | $2,050        |
| Wants             | 30%      | $1,230        |
| Savings/Debt      | 20%      | $820          |
| **Total**         | **100%** | **$4,100**    |

---

### Needs (Target: 50% = $2,050)
| Expense                  | Monthly Amount | Category Note                                |
|--------------------------|----------------|----------------------------------------------|
| Rent                     | $1,450         | Housing -- 35.4% of income alone             |
| Electricity              | $90            | Utility                                      |
| Gas (heating/cooking)    | $45            | Utility                                      |
| Water                    | $30            | Utility                                      |
| Internet                 | $75            | Basic tier -- at or near need threshold      |
| Groceries                | $380           | Home food only                               |
| Car payment              | $285           | Auto loan minimum                            |
| Car insurance            | $110           | Required coverage                            |
| Gas for car              | $95            | Essential transportation fuel                |
| Student loan minimum     | $220           | Contractual minimum                          |
| **Needs Total**          | **$2,780**     | **67.8% of income**                          |

**Needs Status:** Over target by $730 (17.8 percentage points above the 50% target)
**Primary Driver:** Housing at $1,450 (35.4% of income). Student loan minimum at $220 (5.4%) and groceries at $380 (9.3%) are secondary contributors.

---

### Wants (Target: 30% = $1,230)
| Expense                   | Monthly Amount | Category Note                               |
|---------------------------|----------------|---------------------------------------------|
| Dining out / takeout      | $320           | All food outside home = Want                |
| Weekend entertainment     | $180           | Events, activities                          |
| Clothing / shopping       | $150           | Non-essential purchases                     |
| Amazon purchases          | $75            | Discretionary purchases (see note below)    |
| Gym membership            | $45            | Fitness -- not required for survival        |
| Netflix                   | $18            | Streaming entertainment                     |
| Hulu                      | $18            | Streaming entertainment                     |
| Spotify                   | $12            | Music subscription                          |
| **Wants Total**           | **$818**       | **19.9% of income**                         |

**Wants Status:** Under target by $412 (10.1 percentage points below the 30% target)

*Note on Amazon: $75/month in Amazon purchases is categorized as a Want unless specific items are essential replacements. If some Amazon purchases are household supplies or need-level items, reclassify those specifically. The default assumption for discretionary Amazon spend is Want.*

---

### Savings & Debt Repayment (Target: 20% = $820)
| Category                       | Monthly Amount | Notes                                               |
|--------------------------------|----------------|-----------------------------------------------------|
| 401k contribution (pre-tax)    | $300           | Already deducted from paycheck                      |
| Employer 401k match            | $150           | 50% match -- free money, always capture this        |
| Savings transfer               | $150           | General savings account                             |
| Extra debt payments            | $0             | No extra payments above student loan minimum        |
| Emergency fund contributions   | $0             | Not explicitly funded (see recommendations)         |
| **Savings Total**              | **$600**       | **14.6% of income** (including pre-tax + take-home) |

**Savings Status:** Under target by $220 (5.4 percentage points below the 20% target)

---

### Budget Scorecard
| Bucket          | Target $  | Actual $  | Actual % | Difference | Status              |
|-----------------|-----------|-----------|----------|------------|---------------------|
| Needs           | $2,050    | $2,780    | 67.8%    | +$730      | ⚠ Over              |
| Wants           | $1,230    | $818      | 19.9%    | -$412      | Under               |
| Savings/Debt    | $820      | $600      | 14.6%    | -$220      | Under               |
| **Unallocated** | **$0**    | **-$98**  | **--**   | **--**     | **⚠ Budget Gap**    |
| **Total**       | **$4,100** | **$4,198**| **102.4%**| **--**    | **See note below**  |

**⚠ Important -- Budget Gap Identified:** Your reported expenses ($4,198) actually exceed your take-home income ($4,100) by **$98/month.** This means you are either dipping into savings, using credit, or there are rounding/estimation errors in your expense numbers. This is the core reason you feel like you are always broke -- your budget is technically in deficit before any savings goals are addressed. This must be resolved first.

---

### Framework Fit Assessment

⚠ **Adapted ratio recommended: 65/20/15 reflects your current reality.** Your needs -- dominated by housing at 35% of income -- structurally prevent a standard 50/30/20 from fitting. This is not a personal failure; it reflects a housing cost that is typical for many markets. The priority is to (1) eliminate the $98/month deficit, (2) get savings to at least 15--20%, and (3) address the student loan strategically. The 50% needs target is a long-term aspiration achievable when income grows or housing costs change.

---

### Rebalancing Recommendations

**Priority 1 -- Eliminate the $98/month budget deficit (urgent):**
Your reported expenses exceed income by $98/month. Before any optimization, find and eliminate this deficit. The most likely sources: dining out and entertainment estimates may be understated (track with bank statements for 30 days), or there are forgotten small purchases not in your list. Target: reduce dining out from $320 to $250 (saves $70/month) and cut one streaming service (saves $18/month) to create immediate breathing room of $88/month.

Current dining out: $320 → Recommended: $250 → Monthly savings: $70
Cancel one streaming service (keep Netflix or Hulu, not both): $18/month freed

**Priority 2 -- Redirect $220/month to savings to reach 20% target:**
Your savings bucket is $220 short of the 20% target ($820). You are already capturing the employer 401k match (excellent -- this is the right first move). The $150 savings transfer is a good habit. To close the gap, direct the $88 freed from Priority 1 toward savings, and find an additional $132/month from wants reduction.
- Reduce entertainment from $180 to $100: saves $80/month
- Reduce clothing/shopping from $150 to $100: saves $50/month
- Total additional monthly savings available: $218/month

**Priority 3 -- Designate your $150 savings transfer as an emergency fund until you reach $2,780 (1 month of essential expenses):**
Your general savings account should have a specific target. Your monthly essential expenses are $2,780. A 1-month emergency fund = $2,780. A 3-month emergency fund = $8,340. If your current savings balance is below $2,780, direct all savings contributions there first before any other savings goals beyond the 401k match.

**Priority 4 -- Evaluate internet tier:**
Your $75/month internet plan may include a premium tier upgrade. Basic internet in most markets is available for $40--$55/month. If you are paying for gigabit speed primarily for entertainment quality, the difference ($20--$35/month) is a want, not a need. Check your current plan tier.

**Priority 5 -- Student loan strategy at lease renewal:**
Your student loan minimum of $220/month is a need. Once your emergency fund is established and your budget is in surplus, the next priority is accelerating student loan payoff if the interest rate exceeds 5--6%. When your lease comes up for renewal, evaluate whether staying at the same rent, finding a roommate (which could reduce housing to $725 and your needs to 51%), or relocating to a lower-cost area is feasible. A $300/month reduction in rent would immediately bring your needs to 60% and free $300 for savings -- transforming your financial picture.

---

### Projected Budget After Priority 1 and 2 Recommendations

| Bucket       | Current % | Projected % | Change  |
|--------------|-----------|-------------|---------|
| Needs        | 67.8%     | 67.8%       | --      |
| Wants        | 19.9%     | 14.6%       | -5.3%   |
| Savings/Debt | 14.6%     | 20.0%       | +5.4%   |
| Unallocated  | -2.4%     | 0%          | +2.4%   |

*Implementing Priorities 1 and 2 does not reduce your needs (most are fixed) but eliminates the deficit, brings wants down to a lean but functional level, and gets savings to target.*

---

### Savings Priority Sequence

Work through these in order:
1. ✅ **Capture full employer 401k match** -- you are already doing this ($150/month free money). Do not reduce your 401k contribution below the match threshold under any circumstances.
2. [ ] **Emergency fund to $2,780** (1 month of essential expenses) -- currently unknown; establish this as the active goal for your $150/month transfer plus recovered funds from recommendations above.
3. [ ] **Emergency fund to $8,340** (3 months) -- after 1-month target is reached.
4. [ ] **Evaluate student loan acceleration** -- once emergency fund is at 1 month, extra payments on the student loan above the $220 minimum reduce total interest paid and eventually free up $220/month when the loan is gone.
5. [ ] **Increase 401k contributions** once student loan is eliminated or income grows.

---

### Next Steps
- [ ] **This week:** Export 60 days of bank and credit card transaction history and categorize every transaction to verify that the $4,198 in expenses is accurate -- identify where the extra $98/month is actually going.
- [ ] **This week:** Cancel one of the two streaming services you use less (saves $18/month immediately).
- [ ] **This month:** Reduce dining out to $250 and entertainment to $100 and track adherence.
- [ ] **30-day check-in:** Re-run this analysis using your actual bank transaction data to replace estimates with real numbers.
- [ ] **At lease renewal (note the date):** Evaluate roommate option or relocation to a neighborhood where comparable space costs $1,100--$1,200, which would bring your entire budget into 50/30/20 alignment without any other changes.
