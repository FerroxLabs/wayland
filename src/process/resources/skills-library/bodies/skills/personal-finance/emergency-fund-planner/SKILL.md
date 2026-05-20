---
name: emergency-fund-planner
description: |
  Calculates the target emergency fund size based on the user's monthly essential expenses, builds a savings timeline, and determines the monthly contribution needed to reach the target. Produces a funded emergency fund plan with milestones and a contribution schedule.
  Use when the user asks about emergency funds, emergency savings, building a financial safety net, or how much to save for emergencies.
  Do NOT use for general savings goals (use savings-goals-tracker), investment planning, or business cash reserves.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance savings planning"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Emergency Fund Planner

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly asks how much money they should have in an emergency fund or safety net
- The user wants to calculate how long it will take to build emergency savings from zero or from a partial amount
- The user asks whether their current savings balance is sufficient to cover emergencies
- The user has experienced a financial emergency and wants to rebuild their fund after depleting it
- The user is starting a new life stage (marriage, divorce, new baby, job change, becoming self-employed) and needs to recalibrate their emergency fund target
- The user asks what counts as an emergency expense versus a planned expense
- The user has high-interest debt and wants to know whether to pay it down first or save first
- The user is a freelancer, contractor, or gig worker asking how much buffer to keep on hand

**Do NOT use when:**
- The user wants to track multiple distinct savings goals simultaneously -- use `savings-goals-tracker` instead
- The user wants to invest emergency savings in stocks, bonds, or mutual funds for growth -- emergency funds prioritize liquidity and stability; redirect to investment planning skills
- The user wants a comprehensive monthly budget built from scratch -- use `budget-planning` first to establish essential expense totals, then return here
- The user is asking about business operating reserves, cash flow buffers, or working capital -- these follow different sizing rules and belong in business finance skills
- The user already has a fully funded emergency fund and is asking what to do with extra savings -- this is an investment/savings optimization question, not an emergency fund question
- The user is asking about insurance products (disability, income protection) as a substitute for an emergency fund -- while complementary, insurance is a separate topic

---

## Process

### Step 1: Establish Monthly Essential Expenses With Precision

Do not accept a single "total expenses" number from the user. Broken-down categories reveal the true essential baseline and force the user to distinguish between essential and discretionary spending.

- **Housing costs** -- rent or mortgage principal and interest, property taxes if escrowed separately, HOA fees, renter's insurance, homeowner's insurance. Do NOT include mortgage overpayments or extra principal payments; only the required minimum payment counts.
- **Utilities** -- electricity, gas/heating oil, water and sewer, trash removal, internet (essential for most working adults), basic cell phone. Exclude streaming services, cable TV, and premium add-ons -- these are discretionary and can be cut in an emergency.
- **Groceries** -- home food budget only. A realistic figure for a single adult is $250--$400/month; a household of four runs $600--$950/month depending on region. Exclude restaurant meals and delivery apps, which are discretionary.
- **Transportation** -- car loan or lease payment, auto insurance (required minimum coverage), fuel at a conservative estimate, public transit passes. Exclude Uber/Lyft for convenience; include only if it is the user's primary transportation.
- **Health and insurance premiums** -- employer-sponsored health insurance premiums that come out of the paycheck, out-of-pocket prescription costs for ongoing conditions, dental/vision minimums. If self-employed, include the full unsubsidized monthly premium.
- **Minimum debt service** -- the minimum required payment on every loan: federal student loans, private student loans, auto loan (already in transportation), credit card minimums, personal loans. Use only minimums -- not accelerated payoff amounts, which are discretionary.
- **Childcare and dependent care** -- daycare, after-school care, elder care obligations, or disability-related care costs. These are non-negotiable in an emergency.
- **Essential medications and medical maintenance** -- recurring prescriptions, medical equipment costs, therapy copays for chronic conditions.
- **Other non-negotiables** -- court-ordered payments (child support, alimony), contractually obligated subscriptions with large cancellation penalties if within term, HOA special assessments on a payment plan.

After gathering figures, confirm the total by asking: "If you lost your income tomorrow, which of these could you eliminate within 30 days?" Anything that cannot be eliminated within 30 days is essential.

---

### Step 2: Apply a Risk-Profile Framework to Determine Coverage Months

The conventional 3--6 month rule is a starting point, not a universal answer. Use the following multi-factor assessment to determine the appropriate coverage range.

**Income stability score** -- assess each factor:

| Factor | Lower Coverage | Higher Coverage |
|---|---|---|
| Number of income earners | Dual income | Single income |
| Employment type | Salaried W-2 employee | Self-employed / contractor / gig |
| Industry volatility | Healthcare, government, utilities | Tech, media, real estate, finance |
| Job market for their role | High demand, low replaceability | Specialized niche, long search |
| Unemployment insurance eligibility | Eligible for full UI | Not eligible (1099 contractors) |
| Benefits portability | COBRA available | No employer benefits to lose |
| Household dependents | No dependents | Children, elderly parents, disabled family |
| Other safety nets | Liquid assets, family support, equity | No backup resources |

**Coverage guidance by profile:**
- **3 months:** Dual-income household, both in stable employment, at least one partner in a high-demand field, no dependents, access to COBRA, 3+ months of unemployment insurance available
- **4--5 months:** Single income OR one of the above risk factors elevated; modest job search expected in the field
- **6 months:** Single income with moderate job market, or dual income in the same industry (correlated risk), or one earner with dependents and no secondary income
- **7--8 months:** Self-employed part-time or freelancer with some retainer income, single parent, or specialized field where job searches typically run 3--6 months
- **9--12 months:** Fully self-employed, all-1099 income, seasonal work, highly specialized professional role (surgeon, tenured academic, licensed specialist), or history of irregular income

Explain this framework clearly so the user understands WHY the recommendation is what it is -- not just a number handed to them.

---

### Step 3: Calculate the Target Emergency Fund and Identify the Gap

Once monthly essentials and coverage months are established, perform and show the calculation explicitly:

```
Target Emergency Fund = Monthly Essential Expenses × Coverage Months
Remaining Gap = Target Emergency Fund - Current Savings Balance
```

If the user has existing savings scattered across accounts (checking buffer, old savings account, piggy bank), clarify:
- Only count savings that are liquid, not invested in market-based accounts that can lose value
- Do not count savings already earmarked for a known future expense (vacation fund, car repair fund, wedding fund)
- Do count a dedicated high-yield savings account already labeled as emergency fund

Show the user two or three target scenarios based on different coverage month options so they can make an informed choice. For example, show both a 3-month and a 6-month target side by side. People who see the difference choose more thoughtfully.

---

### Step 4: Determine a Realistic Monthly Contribution Rate

Ask the user how much they can currently set aside each month. If they do not know, use their stated after-tax income minus their total essential expenses as the starting point -- but acknowledge that discretionary spending will consume some of that margin.

**Apply the contribution feasibility test:**
- If the user can contribute their full surplus, calculate the timeline
- If the contribution would leave zero discretionary buffer, flag this as unsustainable -- a zero-discretionary budget leads to abandonment. Reserve a minimum discretionary buffer of $100--$200/month even during the savings sprint
- If the monthly contribution produces a timeline longer than 36 months to Stage 3 (3 months of essentials), discuss acceleration strategies

**Acceleration strategies to discuss:**
- Allocate 50--100% of annual tax refunds to the fund (the average U.S. federal refund is approximately $2,800 -- this alone closes 4--6 months of a modest emergency fund in 1--2 years)
- Redirect employer bonuses or commission windfalls for the duration of the build phase
- Apply the "savings rate ratchet" -- each time income increases (raise, side income pickup), allocate at least 50% of the increase to the emergency fund until fully funded
- Identify one recurring discretionary expense to pause temporarily (gym membership, streaming bundle, dining out budget reduction)
- If the user receives irregular income, use a fixed minimum contribution monthly plus a percentage sweep of any income above baseline (30--50% of the overage goes to the fund)

**Calculate the two key timeline numbers:**
1. Months to reach Stage 3 (3 months of essentials) -- the functional safety threshold
2. Months to reach the full target

---

### Step 5: Build the Milestone Ladder

People abandon savings goals that feel distant. Breaking the target into stages with concrete dates makes progress tangible. Use this four-stage ladder:

**Stage 1 -- Starter Emergency Buffer ($500--$1,000)**
- Purpose: Covers a single unexpected essential expense (car repair, ER copay, broken appliance)
- Psychological function: Breaks the paycheck-to-credit-card cycle for small emergencies
- Timeline: Should be reachable within 60--120 days at almost any contribution rate
- If the user already has more than $1,000, skip Stage 1 and acknowledge it as already complete

**Stage 2 -- One-Month Foundation**
- Amount: 1× monthly essential expenses
- Purpose: Covers a very short income disruption (2--3 week illness, short layoff, delayed paycheck)
- Most people can reach this stage within 3--9 months

**Stage 3 -- Three-Month Security Threshold**
- Amount: 3× monthly essential expenses
- Purpose: This is the minimum functional emergency fund that covers the statistically most common emergency durations
- Median U.S. job search after layoff runs 8--10 weeks -- 3 months covers this with a small buffer
- At this stage, the fund provides genuine peace of mind; the user may now split surplus between emergency fund and other goals (not before)

**Stage 4 -- Full Target Fund**
- Amount: The coverage months × monthly essentials calculated in Step 2 and Step 3
- Purpose: Provides complete coverage for the user's assessed risk profile

For each stage, calculate the target date using: Starting Date + (Stage Amount - Current Balance) / Monthly Contribution

---

### Step 6: Define the Account Strategy

Where emergency funds are held matters -- not just how much is in them.

**Appropriate account types (generic guidance, no institution recommendations):**
- High-yield savings accounts offered by FDIC-insured institutions typically pay 4--5× the interest rate of traditional savings accounts; direct the user to research current rates
- Money market accounts at federally insured institutions provide similar yields with check-writing privileges, useful for larger emergency fund withdrawals
- Certificates of deposit (CDs) are NOT appropriate for an emergency fund -- they impose early withdrawal penalties and defeat the purpose of liquid access
- Checking accounts are NOT appropriate as the primary emergency fund vehicle -- proximity to daily spending leads to "drift" where the fund is slowly consumed without a declared emergency
- Investment accounts (brokerage, Roth IRA contributions) are NOT appropriate -- market values fluctuate and you may need the funds when the market is down 30%

**The separation principle:** The emergency fund must be in a dedicated, separate account -- labeled clearly -- that is not the user's primary checking account. The slight friction of a transfer (typically 1--2 business days for savings-to-checking) is a feature, not a bug. It prevents impulse use.

**The accessibility principle:** The fund must be reachable within 1--3 business days. Accounts that require mailing a check or have withdrawal limits lower than the fund balance are inadequate.

---

### Step 7: Establish Use and Replenishment Rules

Without explicit rules, the fund will be drained for non-emergencies. Define these with the user clearly.

**Qualifying emergency criteria (all three must be true):**
1. Unexpected -- not a known future expense that should have been planned for
2. Necessary -- not optional or deferrable for 30+ days without serious consequence
3. Urgent -- the expense disrupts essential living, employment, or health if not addressed

**Classic qualifying emergencies:**
- Job loss or sudden income reduction
- Medical or dental emergency not covered by insurance (ER visit, urgent surgery, unexpected diagnosis)
- Essential vehicle repair when the car is required for work (not cosmetic, not a convenience)
- Critical home repair affecting habitability or safety (furnace failure, roof leak, plumbing emergency)
- Emergency travel for family crisis (immediate family hospitalization, death)
- Unexpected legal requirement with serious consequence for non-compliance

**Classic non-qualifying expenses (these have their own savings categories):**
- Planned car maintenance (oil change, tires, annual registration) -- these should be in a sinking fund
- Known annual expenses (insurance deductibles, holiday gifts, back-to-school supplies) -- use a sinking fund
- Vacations, even to visit family if the visit is not a crisis
- Appliance replacement when the appliance is aging but not yet failed (start a sinking fund)
- Credit card interest or late fees resulting from overspending -- this is a cash flow problem, not an emergency
- Sales or "limited-time offers" -- urgency created by marketing is never an emergency

**Replenishment protocol after any withdrawal:**
1. Immediately after the emergency resolves, calculate the depletion amount
2. Pause all non-essential savings goals (vacation fund, down payment fund, etc.)
3. Redirect the full previous emergency fund contribution PLUS any freed discretionary surplus toward replenishment
4. If applicable, file insurance claims promptly -- any reimbursement goes directly back to the emergency fund
5. Resume other savings goals only after reaching the prior emergency fund balance

---

### Step 8: Flag Intersecting Financial Issues

Several situations require specific guidance beyond the basic plan:

**High-interest debt parallel decision:** If the user carries credit card or personal loan debt above 15% APR, advise the "starter fund first, then avalanche" sequence:
1. Build $500--$1,000 starter fund
2. Attack high-interest debt aggressively with all available surplus
3. Once high-interest debt is eliminated, build the full emergency fund
4. Rationale: A $1,000 emergency without a starter fund goes onto a 20% APR card, instantly costing $200/year in interest and undoing weeks of debt payoff progress

**Income irregularity adjustment:** For variable income earners, the emergency fund serves a dual purpose -- it functions as both an emergency buffer AND an income-smoothing buffer. This changes the sizing calculation. The fund should cover the shortfall during the historically lowest consecutive income months, not just fixed essential expenses. If a freelancer's slowest quarter earns 40% of their average, the fund must bridge that gap for the slow period PLUS cover a true emergency on top.

**Employer stability signals:** If the user mentions layoffs in their company or industry, upcoming company restructuring, or a contract ending soon, note that the situation calls for treating the emergency fund build as urgent priority -- not deferred until more convenient.

---

## Output Format

```
## Emergency Fund Plan

> Note: Figures are based on information provided. Review and update annually
> or after any significant life change.

---

### Monthly Essential Expenses Breakdown
| Category                        | Monthly Cost  | Notes                          |
|---------------------------------|---------------|--------------------------------|
| Housing (rent/mortgage)         | $X,XXX        |                                |
| Utilities (electric/gas/water/internet) | $XXX  |                                |
| Groceries                       | $XXX          |                                |
| Transportation (loan + insurance + fuel) | $XXX |                                |
| Health insurance premiums       | $XXX          |                                |
| Minimum debt payments           | $XXX          | [types of debt]                |
| Childcare / dependent care      | $XXX          |                                |
| Essential medications           | $XXX          |                                |
| Other non-negotiables           | $XXX          | [description]                  |
| **Total Monthly Essentials**    | **$X,XXX**    |                                |

---

### Risk Profile Assessment
| Factor                          | Your Situation         | Impact              |
|---------------------------------|------------------------|---------------------|
| Income earners in household     | [Single / Dual]        | [↑ / ↓ coverage]    |
| Employment type                 | [W-2 / 1099 / Mixed]   | [↑ / ↓ coverage]    |
| Industry stability              | [Stable / Volatile]    | [↑ / ↓ coverage]    |
| Job search duration for your role | [Short / Long]       | [↑ / ↓ coverage]    |
| Unemployment insurance eligible | [Yes / No]             | [↑ / ↓ coverage]    |
| Dependents                      | [Yes / No / How many]  | [↑ / ↓ coverage]    |
| **Recommended coverage**        | **X months**           |                     |

---

### Target Calculation
| Metric                              | Value           |
|-------------------------------------|-----------------|
| Monthly essential expenses          | $X,XXX          |
| Recommended coverage months         | X months        |
| **Target emergency fund**           | **$XX,XXX**     |
| Current liquid emergency savings    | $X,XXX          |
| **Remaining gap**                   | **$XX,XXX**     |

**Alternative scenarios:**
| Coverage | Target | Gap | Best For |
|---|---|---|---|
| 3 months | $XX,XXX | $XX,XXX | Dual income, stable employment |
| 6 months | $XX,XXX | $XX,XXX | [User's recommended scenario] |
| 9 months | $XX,XXX | $XX,XXX | Self-employed or high-risk |

---

### Savings Timeline
| Metric                              | Value           |
|-------------------------------------|-----------------|
| Monthly contribution                | $XXX            |
| Months to Stage 3 (3-month fund)    | XX months       |
| Months to full target               | XX months       |
| Estimated full-target date          | [Month Year]    |

**Acceleration scenarios:**
| If you add...                | New months-to-full-target |
|------------------------------|---------------------------|
| +$50/month ($XXX total)      | XX months                 |
| Tax refund of ~$X,XXX applied | Saves ~XX months          |
| One windfall of $X,XXX       | Reaches Stage X by [date] |

---

### Milestone Ladder
| Stage      | Name          | Target Amount | Remaining | Target Date   | Status      |
|------------|---------------|---------------|-----------|---------------|-------------|
| Stage 1    | Starter       | $1,000        | $XXX      | [Month Year]  | In Progress |
| Stage 2    | Foundation    | $X,XXX        | $X,XXX    | [Month Year]  | Pending     |
| Stage 3    | Security      | $XX,XXX       | $XX,XXX   | [Month Year]  | Pending     |
| Stage 4    | Fully Funded  | $XX,XXX       | $XX,XXX   | [Month Year]  | Pending     |

---

### Fund Usage Rules

**Qualifies as an emergency (all three apply):**
- Unexpected (not a planned or anticipatable expense)
- Necessary (non-optional, cannot be safely deferred 30+ days)
- Urgent (disrupts essential living, employment, or health if unpaid)

**Examples that qualify:** Job loss, medical emergency beyond coverage, critical vehicle repair needed for work, home system failure affecting habitability, emergency travel for family crisis

**Examples that do NOT qualify:** Planned car maintenance, annual known expenses, vacations, appliance upgrades, credit card interest, sale prices

---

### Replenishment Protocol
After any withdrawal from the emergency fund:
1. Immediately pause all non-essential savings goals
2. Redirect full prior emergency fund contribution + freed discretionary funds to replenishment
3. File any applicable insurance claims -- reimbursements go directly to the fund
4. Resume other savings goals only after returning to the pre-withdrawal balance

---

### Next Steps
- [ ] Open a dedicated, separate account labeled "Emergency Fund" (not your checking account)
- [ ] Automate a transfer of $XXX on [paydate] each month to the emergency fund
- [ ] Complete Stage 1 ($1,000) by [Month Year] -- mark this as a milestone worth celebrating
- [ ] Review expense totals and contribution amount in 6 months or after any income/expense change
- [ ] Apply [estimated tax refund / next bonus / next windfall] directly to the emergency fund
```

---

## Rules

1. **Always present the disclaimer** before any financial guidance. Do not skip it even when the user seems financially sophisticated.

2. **Never accept a single "total expenses" number without attempting to break it down by category.** Lump-sum estimates are consistently 15--30% lower than actual totals when users go through line-by-line. Category-level breakdown reveals the true essential baseline.

3. **Target amounts must be derived from actual monthly essential expenses, never from income.** "Save 3--6 months of income" is a common but imprecise heuristic -- it overfunds the emergency account for high earners with low fixed costs and underfunds it for low earners with high housing burdens.

4. **Always show the coverage month range with rationale, not just a single number.** Present at least two scenarios (e.g., 3-month and 6-month targets) with an explanation of which fits the user's situation. Let the user make an informed choice.

5. **Stage 1 ($500--$1,000 starter fund) must always be the first milestone** regardless of how large the full target is. The psychological function of Stage 1 -- breaking the emergency-to-credit-card cycle -- is more important than its dollar amount. An 18-month timeline to a full fund is demotivating; a 2-month timeline to Stage 1 is achievable.

6. **Never recommend investing the emergency fund for higher returns.** High-yield savings accounts and money market accounts are the upper bound of appropriate vehicles. CDs, bond funds, stock funds, and retirement accounts are not suitable because value may decline precisely when the user needs the funds most. Do not compromise on this point even if the user argues that the "money is just sitting there."

7. **If the user carries high-interest debt (above approximately 15% APR), insert the debt-emergency fund sequencing discussion** before building the full savings plan. The sequence is: Stage 1 starter fund first, then aggressive debt payoff, then full emergency fund. Omitting this context leads to a plan that is financially suboptimal.

8. **Include both a monthly-contribution timeline AND at least one windfall-acceleration scenario.** Most users will receive at least one windfall annually (tax refund, bonus, gift). Showing the impact of a single $2,000--$3,000 windfall on the timeline demonstrates leverage and motivates the user to apply it strategically.

9. **Replenishment protocol is mandatory output, not optional.** A funded emergency fund that gets depleted and not replenished reverts to zero protection. The replenishment plan -- pause other goals, redirect all surplus, restore before resuming -- must be included in every plan.

10. **Do not conflate an emergency fund with a sinking fund.** If the user mentions a known future expense (car replacement, home repair, annual insurance payment, holiday gifts), redirect those to sinking fund planning. Emergency funds are for unexpected events only. Mixing known future expenses into the emergency fund inflates the target artificially and confuses the user's mental accounting.

11. **Emergency fund targets must be reviewed annually and after major life events.** A target calculated when rent was $1,200 is wrong when rent is now $1,800. Include a reminder to revisit the target each year. Significant life events that require recalculation include: household income change, change in number of dependents, housing change, major new debt obligation, becoming self-employed, and receiving an inheritance that changes the risk profile.

12. **For dual-income households where both earners work for the same employer or in the same industry, apply correlated income risk.** Standard dual-income discounting assumes income streams are independent. If both partners are in the same company or sector, a single industry downturn can eliminate both incomes simultaneously. In this case, treat the household as effectively single-income for emergency fund sizing purposes.

---

## Edge Cases

### User Has Zero Savings and Cannot Contribute Any Meaningful Amount

Do not tell this user to "find" money they have said they do not have. Instead:

- Validate that any amount is a real start. $20/month builds $240/year and is infinitely better than $0.
- Surface micro-saving mechanisms: automatic round-up features on banking apps, redirecting one subscription (even $8--$15/month streaming service), saving a single $5 bill per week ($260/year).
- Ask whether there is a known one-time source coming: tax refund, birthday money, selling unused items. A single $500 infusion can fund Stage 1 entirely.
- Introduce the concept of the "next dollar" rule: whenever any extra money appears -- overtime pay, found cash, rebate check -- 100% of it goes to the emergency fund until Stage 1 is complete.
- If truly no funds are available, focus the session on identifying the specific budget category that could be reduced by even $30--$50/month. Do not produce a savings plan with $0 contribution -- produce a plan with the smallest realistic amount and note that increasing it is the primary financial action item.

---

### User Is Fully Self-Employed (100% 1099 / Business Owner / Freelancer)

This is the highest-risk profile and requires substantial adjustments:

- **Recommend 9--12 months of coverage minimum.** Self-employed individuals face layered risk: income disruption AND loss of employer-provided benefits simultaneously.
- **Recalibrate the "essential expenses" calculation** to include costs that employed people receive as benefits: health insurance at full cost (not subsidized employer premium), self-employment tax implications if income drops, liability insurance if it cannot lapse, software subscriptions directly tied to income generation (these become essential, not discretionary).
- **Note that unemployment insurance is generally unavailable** for 1099 workers and most business owners, removing a major backstop that W-2 workers can rely on.
- **Address income volatility separately:** If the user's monthly income varies by more than 25% peak-to-trough, the emergency fund must also absorb income-smoothing duties. The target in this case should include 2--3 months of the income gap during the historically worst income period.
- **Flag estimated tax obligations.** Self-employed individuals owe quarterly estimated taxes. If income drops suddenly, the emergency fund should not be raided to pay a tax bill -- that bill should already have a separate sinking fund. Note this risk explicitly.

---

### User Has an Existing Savings Balance They Are Unsure About

When a user says they have "$10,000 saved" but are uncertain if it qualifies:

- Ask: Is it in a bank account that is FDIC insured and not invested in market-linked products?
- Ask: Is any portion already earmarked for a specific known future expense within the next 12 months?
- Ask: Is it accessible within 2--3 business days without penalties?
- Subtract any earmarked amounts and any amounts in CDs with penalties or accounts with withdrawal restrictions.
- The remainder is the valid current emergency fund balance.
- If the existing balance meets or exceeds the target, congratulate the user, confirm the expense totals are current, and note the annual review trigger. Suggest they move on to the `savings-goals-tracker` skill for other financial objectives.

---

### Dual-Income Household With Shared Finances

This is the most common scenario where the standard advice oversimplifies:

- Calculate essential expenses for the full household combined -- not per-person. Housing, utilities, and groceries are shared costs that do not halve if one income disappears.
- Identify which expenses are income-dependent: childcare might be reducible if one parent stops working; commuting costs drop if one person is unemployed; professional clothing and work-related subscriptions drop.
- For a healthy dual-income household in independent, stable industries: 3--4 months of combined essentials is typically appropriate.
- If one income is notably larger (covering 70%+ of essentials), treat the household as functionally single-income and plan for 5--6 months.
- If both partners work in the same organization or highly correlated industries (both in tech, both in finance, both in real estate), use 6 months and note the correlated risk.
- Never allow the user to argue that one partner's income eliminates the need for an emergency fund. The emergency fund protects against scenarios where ALL income is disrupted simultaneously.

---

### User Has Already Funded Their Emergency Fund But Expenses Have Increased

This is a maintenance scenario, not a build scenario:

- Do not dismiss the user's concern. A fund sized for a $2,200/month essential baseline provides only 4.5 months of coverage when expenses have grown to $3,000/month.
- Recalculate the current target using the updated expense figures.
- Calculate the underfunding gap: Current Balance - New Target = Deficit.
- If the deficit is small (less than 15% of the target), the user can fill it gradually with a modest additional monthly contribution.
- If the deficit is large (more than 30% of the target), treat it as a partial build scenario and apply the full milestone ladder starting from the current balance.
- Remind the user that annual reviews prevent large gaps from accumulating undetected.

---

### User Wants to Use Their Roth IRA Contributions as an Emergency Fund

This is a popular strategy in personal finance communities and requires nuanced handling:

- Acknowledge that Roth IRA *contributions* (not earnings) can be withdrawn at any time without penalty or tax. This is factually correct.
- Explain the significant problems with relying on this strategy:
  - Withdrawing from a Roth IRA for an emergency permanently reduces tax-advantaged retirement space -- annual contribution limits do not allow "re-contribution" in most years.
  - Market timing risk: the Roth IRA is invested for growth and may be down 20--30% precisely when the user needs emergency funds.
  - Psychological barrier: separating emergency funds from retirement accounts maintains better mental discipline for both goals.
- Recommend a parallel approach: maintain a dedicated liquid emergency fund AND continue Roth contributions -- do not conflate the two accounts.
- The Roth IRA can serve as a last-resort backstop beyond the dedicated emergency fund, but should not be the primary emergency vehicle.

---

### User Is Building an Emergency Fund While Also Carrying Student Loan Debt at 5--7% APR

This is a common gray-zone scenario distinct from the high-interest debt case:

- At 5--7% APR (typical federal student loan rates), the mathematical case for prioritizing debt over savings is less clear-cut than at 20% APR credit card rates.
- Recommend a parallel approach: allocate the available surplus in a split -- approximately 60--70% toward the emergency fund until Stage 3 is reached, and 30--40% toward additional loan principal.
- Rationale: the psychological security of a funded emergency fund is worth the modest interest cost at this rate range, and building the fund reduces the risk of adding to debt for emergencies.
- Once Stage 3 is reached, shift the split: 30% emergency fund (to reach Stage 4), 70% additional debt paydown.
- This is different from the high-APR case, where the order is strictly: starter fund first, then all available surplus to debt, then full emergency fund.

---

## Example

**Input:** "I'm 34, single, work as a graphic designer at a mid-size agency -- I've been there 4 years but design agencies lay off fast when client budgets get cut. My rent is $1,450, utilities run about $210, groceries $320, car payment $285, car insurance $140, phone $65, health insurance from my paycheck about $180, and I pay $310/month minimum on student loans. I have $1,100 in a savings account right now. I can save $350/month. When will I have a real emergency fund?"

---

**Output:**

## Emergency Fund Plan

> Note: Figures are based on information provided. Review and update annually or after any significant life change (income change, new expenses, housing change).

---

### Monthly Essential Expenses Breakdown
| Category                          | Monthly Cost | Notes                                      |
|-----------------------------------|--------------|--------------------------------------------|
| Rent                              | $1,450       |                                            |
| Utilities (electric/gas/internet/etc.) | $210    |                                            |
| Groceries                         | $320         |                                            |
| Car payment                       | $285         |                                            |
| Car insurance                     | $140         |                                            |
| Phone                             | $65          |                                            |
| Health insurance (payroll deduction) | $180      |                                            |
| Student loan minimums             | $310         |                                            |
| **Total Monthly Essentials**      | **$2,960**   |                                            |

**Expenses confirmed as essential:** All items above are non-negotiable in a genuine emergency. Dining out, streaming subscriptions, gym memberships, and entertainment are not included -- those are discretionary and can be cut.

---

### Risk Profile Assessment
| Factor                           | Your Situation                        | Impact              |
|----------------------------------|---------------------------------------|---------------------|
| Income earners in household      | Single (you only)                     | ↑ Higher coverage   |
| Employment type                  | Salaried W-2                          | Moderate            |
| Industry stability               | Creative / agency -- moderate volatility | ↑ Higher coverage |
| Job search duration for designers | Typically 2--4 months in competitive markets | ↑ Moderate     |
| Unemployment insurance eligible  | Yes (W-2 employee)                    | ↓ Slight reduction  |
| Dependents                       | None stated                           | ↓ Slight reduction  |
| Other safety nets                | Not mentioned                         | Neutral             |
| **Recommended coverage**         | **6 months**                          | Single income + volatile industry offset by UI eligibility |

**Reasoning:** You are a single-income household in a creative agency environment where layoffs correlate with client budget cycles -- not individual performance. This is a structurally higher-risk position than a single person in a government or healthcare role. Six months is the appropriate target. If your agency has recently announced layoffs, budget cuts, or major client losses, consider sizing for 9 months immediately.

---

### Target Calculation
| Metric                              | Value           |
|-------------------------------------|-----------------|
| Monthly essential expenses          | $2,960          |
| Recommended coverage months         | 6 months        |
| **Target emergency fund**           | **$17,760**     |
| Current liquid emergency savings    | $1,100          |
| **Remaining gap**                   | **$16,660**     |

**Alternative scenarios:**
| Coverage | Target   | Gap      | Best For                                    |
|----------|----------|----------|---------------------------------------------|
| 3 months | $8,880   | $7,780   | Would cover only if industry were more stable |
| 6 months | $17,760  | $16,660  | **Recommended for your situation**          |
| 9 months | $26,640  | $25,540  | Warranted if agency signals instability     |

The 3-month fund is not wrong -- it is the minimum. But as a single income earner in an agency environment, 6 months is the appropriate standard. Your UI eligibility is a backstop, not a substitute: UI typically replaces 40--60% of prior wages and lasts 12--26 weeks depending on your state, so it extends -- not replaces -- your runway.

---

### Savings Timeline
| Metric                              | Value           |
|-------------------------------------|-----------------|
| Monthly contribution                | $350            |
| Months to Stage 3 (3-month fund: $8,880) | 23 months (~2 years)  |
| Months to full target ($17,760)     | 48 months (~4 years)  |
| Estimated Stage 3 date              | Approximately Month 23 from today |
| Estimated full target date          | Approximately Month 48 from today |

**Acceleration scenarios:**
| If you add...                          | Impact on timeline                        |
|----------------------------------------|-------------------------------------------|
| +$100/month ($450 total)              | Full target in ~38 months (saves ~10 months) |
| Apply a $2,800 tax refund             | Jumps timeline forward ~8 months; reaches Stage 3 in ~15 months |
| Apply $2,800 refund + $100/month more | Reaches Stage 3 in ~12 months; full target in ~30 months |
| One $5,000 windfall (bonus)           | Reaches Stage 2 immediately; Stage 3 in ~14 months |

**Recommendation:** Even redirecting your estimated tax refund once to the emergency fund cuts your time to Stage 3 nearly in half. Make this the plan before tax season.

---

### Milestone Ladder
| Stage   | Name         | Target Amount | Starting From | Monthly at $350 | Target Date   | Status      |
|---------|--------------|---------------|---------------|-----------------|---------------|-------------|
| Stage 1 | Starter      | $1,000        | $1,100        | **Already met** | Complete      | ✅ Complete |
| Stage 2 | Foundation   | $2,960        | $1,100        | ~6 months       | ~Month 6      | In Progress |
| Stage 3 | Security     | $8,880        | $1,100        | ~23 months      | ~Month 23     | Pending     |
| Stage 4 | Fully Funded | $17,760       | $1,100        | ~48 months      | ~Month 48     | Pending     |

**Good news:** You have already crossed Stage 1 ($1,000) with your current $1,100 balance. Stage 1 is complete. This is not a small thing -- it means a single car repair, ER copay, or broken laptop does not have to go on a credit card. Stage 2 is now the active goal.

---

### Fund Usage Rules

**An expense qualifies if all three are true:**
- **Unexpected** -- you did not know this was coming and could not have planned for it
- **Necessary** -- it cannot be safely deferred more than 30 days without serious consequence to your income, health, or housing
- **Urgent** -- your essential living, employment, or health is disrupted without addressing it

**Qualifies:**
- Losing your job or a major income reduction
- Medical or dental emergency beyond your insurance coverage
- Car repair required to get to work that you cannot defer (not cosmetic damage)
- Home rental emergency affecting habitability (heat failure, flooding, major plumbing)
- Emergency travel for immediate family crisis

**Does not qualify:**
- Planned car maintenance -- oil changes, tire rotation, annual registration should be in a sinking fund
- A great sale on a laptop or camera equipment you want (urgency created by marketing is not an emergency)
- A vacation, even a "once in a lifetime" opportunity
- Paying down credit card debt or making extra loan payments -- those are cash flow decisions, not emergencies
- Replacing an aging appliance before it fails

**Gut check question to use before withdrawing:** "If I didn't have this money, would I be unable to maintain my housing, keep my job, or protect my health within the next 30 days?" If the honest answer is no, do not withdraw.

---

### Replenishment Protocol
If you ever withdraw from this fund:

1. Identify the exact withdrawal amount immediately
2. Pause any non-essential savings (vacation fund, upgrade funds, extra debt payments)
3. File any applicable insurance claims promptly -- direct all reimbursements back to the emergency fund
4. Redirect your full $350/month PLUS freed discretionary funds entirely to replenishment
5. Treat the fund as incomplete until it returns to the balance before the withdrawal
6. Resume other financial goals only after restoration

This is not punitive -- it is how the fund stays functional. An emergency fund you cannot replenish after using is a one-time resource, not a safety net.

---

### Intersection With Student Loan Debt

Your student loans are at minimum payment only ($310/month). A few notes:

- If your loans are federal and below 7% APR, the parallel approach is appropriate: build your emergency fund to Stage 3 first, then split surplus between additional loan principal and completing Stage 4.
- If any loans are private at rates above 8--10%, discuss whether to prioritize those with the full debt-payoff logic before completing Stage 4. Stage 3 coverage first, then evaluate.
- Do not stop minimum payments to accelerate the emergency fund -- a default or delinquency causes more damage than a slower emergency fund build.

---

### Next Steps
- [ ] Confirm the $1,100 is in a separate dedicated account, not your primary checking account. If it is in checking, move it today.
- [ ] Label the account explicitly "Emergency Fund" in your banking app -- this mental accounting step reduces accidental use
- [ ] Set up an automatic transfer of $350 on each payday, not monthly -- aligning with your pay schedule prevents you from spending it before transferring
- [ ] **Stage 2 target: $2,960 by approximately Month 6** -- this is your active milestone; put a calendar reminder for that date to check your balance
- [ ] Before next tax season: decide now that your federal refund (typically $2,500--$3,000) goes entirely to the emergency fund -- this gets you to Stage 3 in 12--15 months instead of 23
- [ ] In 6 months: review your essential expenses total and monthly contribution -- if you received a raise, apply the savings rate ratchet (50% of the raise increase goes to the emergency fund)
- [ ] Set a calendar reminder for 12 months from now to review: current essential expenses vs. the $2,960 baseline used in this plan
