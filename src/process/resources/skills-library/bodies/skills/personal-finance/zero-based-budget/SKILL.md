---
name: zero-based-budget
description: |
  Builds a zero-based budget where every dollar of income is assigned to a specific spending, saving, or debt category so that income minus all allocations equals exactly zero. Produces a fully populated allocation table with assignment rationale for each category.
  Use when the user asks about zero-based budgeting, wants to assign every dollar a job, or wants maximum control over their monthly spending.
  Do NOT use for quick percentage-based budgets (use fifty-thirty-twenty-budget), investment allocation, or business budgeting.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance savings planning"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---
# Zero-Based Budget

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user explicitly asks for a zero-based budget, mentions "giving every dollar a job," or wants to build a budget where income minus all allocations equals exactly $0
- The user has tried a percentage-based approach (50/30/20 or similar) and finds it too loose -- they want category-level control and accountability
- The user is carrying consumer debt and needs to find every possible dollar to redirect toward payoff
- The user has a defined savings goal with a specific target and deadline (vacation, down payment, car replacement) and needs to engineer backward from that goal to a monthly allocation
- The user describes feeling like money "disappears" despite earning a decent income -- a symptom of unassigned dollars drifting into untracked spending
- The user is newly married or newly combined finances with a partner and wants a structured system for joint money management
- The user has recently experienced a significant income change (raise, job loss, freelance growth) and wants to deliberately redesign spending from the ground up
- The user manages sinking funds, annual expenses, or irregular costs and wants them captured in a formal system

**Do NOT use when:**
- The user wants a quick percentage-based rule of thumb -- use `fifty-thirty-twenty-budget` instead, which is faster to implement and appropriate for users who don't want category-level tracking
- The user has no spending history whatsoever and can't estimate any category amounts -- use `first-budget` to establish a baseline month of tracking first, then return to this skill
- The user has income that swings more than 30% between months with no predictable floor -- use `variable-income-budget`, which applies a different sequencing methodology (pay yourself in priority order rather than balancing to a fixed total)
- The user is asking about asset allocation, investment portfolio construction, or retirement contribution percentages -- those require dedicated investing skills
- The user needs a business or freelance business budget -- those involve profit margins, tax reserves, payroll, and category logic fundamentally different from personal budgeting
- The user is asking for a general explanation of budgeting philosophy without wanting to build an actual budget -- provide a conceptual overview without running the full process

---

## Process

### Step 1: Determine the Budget Baseline Income

The zero-based method only works if income is a known, fixed number before categories are assigned. Establishing the right number is the most consequential decision in the entire process.

- **For salaried employees paid biweekly:** The annual calculation is `(gross salary ÷ 26) × 2 = monthly equivalent`, but the true monthly take-home is better calculated as `net biweekly paycheck × 2`. In a biweekly pay schedule, two months per year contain three paychecks -- ask the user whether they want to budget the "normal" two-paycheck month and treat the third paycheck as a windfall, or smooth all three paychecks into a higher monthly baseline. The two-paycheck approach is more conservative and is recommended for users still building an emergency fund.
- **For semi-monthly employees (24 pay periods/year):** Net check × 2 gives exact monthly take-home. This is the simplest case.
- **For hourly or variable-hours workers:** Use the average of the last three months of net take-home, then subtract 10% as a buffer. Never budget to an optimistic month.
- **Include all after-tax income sources:** Side income, rental income, child support received, alimony received, disability payments. Each source gets its own income row.
- **Exclude unreliable or one-time income:** Tax refunds, bonuses, freelance income that has not yet been earned. These are handled separately as windfalls (see Edge Cases).
- If the user cannot state their net take-home with confidence, ask them to check their last two pay stubs. Budgeting to gross income is one of the most common zero-based budget failures.

### Step 2: Inventory All Known Expenses Before Assigning Amounts

Do not let the user start assigning dollar amounts yet. First, build the complete list of every category that needs a dollar. Missed categories are why zero-based budgets break mid-month.

Work through these seven category groups in order:

**Group 1 -- Fixed Obligations (non-negotiable, same amount every month):**
- Housing: rent, mortgage principal+interest, HOA fee, renters/homeowners insurance if bundled
- Vehicle: car payment, auto insurance premium (if monthly), registration (annualized)
- Debt minimums: the contractually required minimum payment on every credit card, personal loan, medical debt, and student loan -- not what the user plans to pay, but what they are legally required to pay
- Subscriptions with fixed recurring costs: streaming bundles, gym memberships, software subscriptions, storage unit rental
- Childcare: daycare, after-school programs, standing babysitter arrangements

**Group 2 -- Essential Variable (necessary but amount fluctuates):**
- Groceries (food consumed at home only -- restaurants belong in discretionary)
- Utilities: electricity, gas/heating oil, water/sewer, trash
- Transportation: fuel, public transit passes, tolls, parking
- Phone bill (if not bundled into Group 1)
- Basic personal care: haircuts, toiletries, laundry

**Group 3 -- Savings Goals (purposeful accumulation toward defined targets):**
- Emergency fund (until fully funded -- 3 months minimum expenses, 6 months recommended)
- Specific goal funds: home down payment, vacation, vehicle replacement, home repair reserve
- Children's education fund

**Group 4 -- Debt Acceleration (above-minimum payments):**
- Extra payments toward consumer debts beyond the minimum obligations in Group 1
- The user's debt payoff strategy determines sequencing (see Step 4 for avalanche vs. snowball frameworks)

**Group 5 -- Sinking Funds (known irregular future expenses, funded monthly):**
- Vehicle maintenance and repair (industry average: $75-$150/month depending on vehicle age)
- Home maintenance (rule of thumb: 1% of home value per year divided by 12; for renters, appliance repair and renter incidentals)
- Medical and dental out-of-pocket costs (annual deductible estimate ÷ 12)
- Annual insurance premiums paid in lump sum (annual premium ÷ 12)
- Holiday gifts and celebrations (total annual gift/holiday budget ÷ 12)
- Clothing and seasonal purchases (annual estimate ÷ 12)
- Pet care: routine vet visits, vaccinations, grooming (annual estimate ÷ 12)
- Property taxes if not escrowed (annual tax ÷ 12)

**Group 6 -- Discretionary Spending (wants, lifestyle choices, non-essential):**
- Dining out and takeout (separate from groceries)
- Entertainment: concerts, movies, events, hobbies
- Personal spending allowances (each person in a household gets a no-questions-asked personal fund)
- Household goods and furnishings
- Alcohol and tobacco (if applicable, assign honestly)
- Cosmetics, personal care upgrades beyond basics
- Books, games, digital purchases

**Group 7 -- Buffer:**
- A miscellaneous catch-all category: 1-3% of monthly income, not to exceed $150 for most budgets
- This is for genuinely unforeseeable small expenses that fit no existing category -- a parking ticket, a prescription, a broken kitchen utensil
- It is NOT a slush fund for discretionary overspending

### Step 3: Gather Historical Spending Data for Variable Categories

For every variable category, assign amounts based on evidence, not aspiration.

- Ask the user to recall or look up average spending for groceries, dining, gas, and utilities over the past 2-3 months
- If the user has no data, offer category benchmarks as starting points, clearly labeled as national averages to adjust:
  - Groceries: $250-$400 per person per month (varies heavily by location and dietary choices)
  - Utilities (electricity + gas + water): $150-$300/month for a typical apartment or small home, higher in extreme climates
  - Fuel: calculated from miles driven per month ÷ vehicle MPG × current price per gallon
  - Dining out: American households average $300-$500/month -- most underestimate this category by 40%
- When users estimate dining and discretionary, they almost always underestimate. Ask: "In the last 30 days, can you think of any meals, coffee, or food purchases you paid for outside the home?" This prompts more accurate recall.
- For utility bills, note seasonal variance and use the current season's amount for this month's budget, with a sinking fund component to prepare for high-cost seasons

### Step 4: Assign Dollar Amounts in Priority Order

Now assign amounts to each category, working in strict priority order. This sequence prevents the most common failure mode: allocating all dollars to discretionary and then having nothing left for savings or debt.

**Priority Sequence:**
1. Fixed obligations -- assign the exact contracted amounts, no negotiation
2. Essential variables -- assign based on historical averages or benchmarks from Step 3
3. Emergency fund contribution (if not yet funded to $1,000 minimum)
4. Debt minimums are already captured in Fixed Obligations -- do not double-count
5. Sinking funds -- calculate each as: (annual estimated cost ÷ 12), round up to nearest $5
6. Debt acceleration -- assign extra debt payments using one of two frameworks:
   - **Avalanche method:** Direct extra dollars to the debt with the highest interest rate first; pay minimums on all others. Mathematically optimal -- minimizes total interest paid.
   - **Snowball method:** Direct extra dollars to the debt with the smallest balance first regardless of interest rate. Psychologically effective -- creates visible wins faster.
   - Present both options and let the user choose based on their motivation style
7. Long-term savings goals (vacation, down payment, etc.)
8. Discretionary categories -- assign what remains after all above categories are funded

**If income is insufficient to cover all categories:**
- Do not reduce fixed obligations (they cannot be changed this month)
- Do not eliminate the emergency fund contribution entirely -- even $25/month maintains the habit
- Reduce discretionary categories first, then evaluate sinking funds for temporary reduction
- If still negative after zeroing all discretionary: the user has a structural income-expense problem that requires either expense elimination (subscriptions, housing downsize) or income increase -- flag this explicitly

### Step 5: Balance to Exactly Zero

Calculate: Total Income -- (Sum of all category allocations) = Target Balance of $0.00

- If the result is **positive (surplus):** Every surplus dollar must be assigned immediately. Ask the user their highest priority: emergency fund, debt acceleration, or savings goal. Assign the surplus there. A surplus that isn't assigned becomes unaccountable spending.
- If the result is **negative (deficit):** The budget cannot be approved as-is. Work backward through discretionary, then sinking funds, then savings goals until balance reaches $0. Document what was cut and why, so the user can revisit those categories when income increases.
- The zero balance is not optional. A budget that ends at "$150 left over" is not a zero-based budget -- it is a budget with $150 of unassigned spending that will disappear without trace.

### Step 6: Specify Overflow Rules for Every Category

Zero-based budgets fail mid-month when a category runs dry and the user has no protocol for what to do next. Every category must have an explicit overflow rule defined at budget creation.

**Three overflow rule options:**
- **Stop:** When this category is depleted, spending stops entirely until next month (appropriate for dining out, entertainment, personal spending)
- **Transfer from [specific category]:** When this category is depleted, a conscious, deliberate transfer is made from a named donor category (the user must explicitly decide this, not spend first and reconcile later)
- **Carry forward:** If the category is under-spent, the balance carries into next month's version of that same category (appropriate for sinking funds and some savings categories -- not for discretionary)

**Transfer rules must be asymmetric:** Discretionary categories can transfer to other discretionary categories. They cannot transfer from savings categories without the user making a formal budget revision. Establish this rule upfront.

### Step 7: Design the Monthly Tracking and Rebuild Protocol

A zero-based budget with no tracking is just an aspiration document. Define the operating procedures.

**Tracking frequency:** For users new to zero-based budgeting, daily or every-other-day check-ins against each category are necessary during the first 2-3 months. Experienced users can check every 3-5 days. Weekly check-ins are the minimum -- monthly review is too infrequent to prevent overspending.

**Tracking method options (describe without brand endorsement):**
- Spreadsheet with a transaction log and running category balances
- Envelope method (physical or digital): each category gets its allocation in a dedicated envelope or account; spending draws from that envelope only
- Banking with multiple sub-accounts labeled by category (available at many online banks)
- Paper ledger with daily entries (highly effective for behavioral change, especially for users who want to feel the money moving)

**Month-end protocol:**
- Count every unspent dollar in every category
- Sinking fund balances: roll forward always -- these are accumulating toward a future purpose
- Emergency fund: roll forward always
- Discretionary unspent balances: either roll forward (dangerous for discretionary -- often becomes license for next month's overspending) or reallocate deliberately to a goal category
- Rebuild the next month's budget from scratch: start with income, reassign every dollar fresh. Copying the previous month's budget is the most common drift point -- costs change, priorities change, and categories that should have grown or shrunk stay frozen.

**Budget rebuild timing:** Complete the next month's budget before the current month ends -- ideally in the last 2-3 days of the month, when the user can see how the current month actually performed and calibrate accordingly.

---

## Output Format

Produce the following structure in full. Every field must contain a real number or explicit label -- no blank cells, no "TBD."

```
## Zero-Based Budget: [Month] [Year]

**Total Monthly Income:** $X,XXX.XX
**Total Allocated:** $X,XXX.XX
**Balance:** $0.00

---

### INCOME

| Source                        | Net Monthly Amount |
|-------------------------------|-------------------|
| [Primary salary -- Partner 1] | $X,XXX.XX         |
| [Primary salary -- Partner 2] | $X,XXX.XX         |
| [Side income / other source]  | $XXX.XX           |
| **TOTAL INCOME**              | **$X,XXX.XX**     |

*Note: Budget built on [two-paycheck month / three-paycheck month / average of last 3 months]*

---

### GROUP 1: FIXED OBLIGATIONS

| Category                 | Monthly Amount | Flexibility | Due Date | Notes                              |
|--------------------------|---------------|-------------|----------|------------------------------------|
| Rent / Mortgage          | $X,XXX.XX     | Locked      | 1st      | [Lease / loan term]                |
| Car Payment              | $XXX.XX       | Locked      | [date]   | [Loan payoff date if known]        |
| Auto Insurance           | $XXX.XX       | Locked      | [date]   | [Annual if billed annually ÷ 12]   |
| Renters / Home Insurance | $XXX.XX       | Locked      | [date]   |                                    |
| Phone Plan(s)            | $XXX.XX       | Locked      | [date]   | [# of lines]                       |
| Internet                 | $XXX.XX       | Locked      | [date]   |                                    |
| Streaming / Subscriptions| $XXX.XX       | Locked      | [date]   | [List bundled services]            |
| Minimum Debt Payments    | $XXX.XX       | Locked      | [date]   | [List each debt and its minimum]   |
| Childcare                | $XXX.XX       | Locked      | [date]   |                                    |
| **GROUP 1 SUBTOTAL**     | **$X,XXX.XX** |             |          |                                    |

---

### GROUP 2: ESSENTIAL VARIABLE

| Category              | Allocated  | Flexibility | Basis for Amount              |
|-----------------------|-----------|-------------|-------------------------------|
| Groceries             | $XXX.XX   | Flexible    | [3-month avg / stated amount] |
| Electricity           | $XXX.XX   | Semi-fixed  | [Seasonal estimate / avg]     |
| Gas / Heating         | $XXX.XX   | Semi-fixed  | [Seasonal estimate]           |
| Water / Sewer         | $XXX.XX   | Semi-fixed  | [Quarterly bill ÷ 3]          |
| Fuel / Transportation | $XXX.XX   | Flexible    | [Miles ÷ MPG × price/gallon]  |
| Basic Personal Care   | $XXX.XX   | Flexible    | [Haircuts, toiletries]        |
| **GROUP 2 SUBTOTAL**  | **$XXX.XX** |           |                               |

---

### GROUP 3: SAVINGS GOALS

| Goal                  | Monthly Allocation | Priority | Target Amount | Target Date     | Months to Goal |
|-----------------------|--------------------|----------|---------------|-----------------|----------------|
| Emergency Fund        | $XXX.XX            | 1        | $X,XXX        | [Month/Year]    | [X months]     |
| [Home Down Payment]   | $XXX.XX            | 2        | $XX,XXX       | [Month/Year]    | [X months]     |
| [Vacation Fund]       | $XXX.XX            | 3        | $X,XXX        | [Month/Year]    | [X months]     |
| **GROUP 3 SUBTOTAL**  | **$XXX.XX**        |          |               |                 |                |

---

### GROUP 4: DEBT ACCELERATION

| Debt                  | Balance Owed | Interest Rate | Minimum (in Group 1) | Extra Payment | Total Payment | Payoff Strategy |
|-----------------------|--------------|---------------|----------------------|---------------|---------------|-----------------|
| [Credit Card 1]       | $X,XXX       | XX%           | $XXX                 | $XXX          | $XXX          | [Avalanche/Snowball target] |
| [Credit Card 2]       | $X,XXX       | XX%           | $XXX                 | $0            | $XXX (min only) | [Paying minimum until Card 1 cleared] |
| [Personal Loan]       | $X,XXX       | XX%           | $XXX                 | $0            | $XXX (min only) |                |
| **GROUP 4 SUBTOTAL**  | --           | --            | --                   | **$XXX**      | --            | Extra payments only |

*Debt payoff sequence: [Avalanche: highest rate first / Snowball: lowest balance first]*
*Estimated payoff of current target debt: [Month/Year] at this allocation rate*

---

### GROUP 5: SINKING FUNDS

| Category              | Annual Estimate | Monthly Set-Aside | Current Balance | Notes                          |
|-----------------------|----------------|-------------------|-----------------|--------------------------------|
| Vehicle Maintenance   | $X,XXX         | $XXX              | $XXX            | Oil, tires, unexpected repairs |
| Home / Renter Repair  | $XXX           | $XXX              | $XXX            | Appliances, maintenance        |
| Medical / Dental OOP  | $XXX           | $XXX              | $XXX            | Copays, prescriptions, dental  |
| Holiday / Gifts       | $XXX           | $XXX              | $XXX            | All gift and celebration spending |
| Annual Insurance      | $XXX           | $XXX              | $XXX            | If billed annually             |
| Clothing / Seasonal   | $XXX           | $XXX              | $XXX            | Seasonal wardrobe, kids' growth |
| Pet Care              | $XXX           | $XXX              | $XXX            | Vet, grooming, annual vaccines |
| **GROUP 5 SUBTOTAL**  |                | **$XXX**          |                 | *Roll balances forward monthly* |

---

### GROUP 6: DISCRETIONARY

| Category              | Allocated  | Flexibility | Overflow Rule                        |
|-----------------------|-----------|-------------|--------------------------------------|
| Dining Out / Takeout  | $XXX      | Flexible    | Stop when depleted                   |
| Entertainment         | $XXX      | Flexible    | Transfer from Dining if needed       |
| [Partner 1] Personal  | $XXX      | Flexible    | No transfers out; no questions asked |
| [Partner 2] Personal  | $XXX      | Flexible    | No transfers out; no questions asked |
| Household Goods       | $XXX      | Flexible    | Carry forward if unspent             |
| Hobbies               | $XXX      | Flexible    | Stop when depleted                   |
| **GROUP 6 SUBTOTAL**  | **$XXX**  |             |                                      |

---

### GROUP 7: BUFFER

| Category              | Allocated | Flexibility | Purpose                                  |
|-----------------------|-----------|-------------|------------------------------------------|
| Miscellaneous Buffer  | $XXX      | Flexible    | Genuine unforeseeable small expenses only |

*Buffer = [X]% of income. Not a slush fund. If unspent at month end, transfer to [priority goal].*

---

### BUDGET VERIFICATION

| Group                       | Amount      |
|-----------------------------|-------------|
| Group 1: Fixed Obligations  | $X,XXX.XX   |
| Group 2: Essential Variable | $XXX.XX     |
| Group 3: Savings Goals      | $XXX.XX     |
| Group 4: Debt Acceleration  | $XXX.XX     |
| Group 5: Sinking Funds      | $XXX.XX     |
| Group 6: Discretionary      | $XXX.XX     |
| Group 7: Buffer             | $XXX.XX     |
| **TOTAL ALLOCATED**         | **$X,XXX.XX** |
| **TOTAL INCOME**            | **$X,XXX.XX** |
| **BALANCE**                 | **$0.00**   |

---

### MONTHLY OPERATING RULES

1. **Tracking cadence:** Review spending against each category every [X] days
2. **Depletion protocol:** When any category reaches $0, [stop spending / transfer from named category]
3. **Transfer approval:** Any transfer between categories requires a deliberate decision, not a retroactive justification
4. **Sinking fund rule:** Sinking fund balances roll forward every month without exception
5. **Month-end protocol:** Unspent discretionary balances go to [goal category]; unspent buffer goes to [goal category]
6. **Budget rebuild date:** Build next month's budget from scratch by [date -- 3 days before month end]
7. **Windfall rule:** Any income above baseline goes first to [emergency fund / debt / named goal] in that priority order
```

---

## Rules

1. **Always show the disclaimer before providing financial guidance.** It must appear before any numbers are presented.

2. **The budget must balance to exactly $0.00.** Income minus the sum of all group allocations equals zero. A surplus means unassigned dollars exist -- assign them. A deficit means the budget is unexecutable -- cut categories until balanced.

3. **Never assign spending amounts the user did not provide or cannot verify.** If a category amount is an estimate, label it as such and note the basis. Do not invent numbers for categories the user hasn't mentioned.

4. **Fixed obligations are allocated before any other group.** It is mathematically and practically wrong to allocate discretionary spending before confirming fixed obligations are covered. If fixed obligations alone exceed income, flag a structural problem immediately.

5. **Debt minimums belong in Group 1 (Fixed Obligations), never in Group 4.** Group 4 contains only above-minimum extra payments. Double-counting minimums in both groups inflates the debt section and breaks the zero balance.

6. **Every sinking fund has an annual estimate and a monthly contribution.** Never let the user describe an annual expense and then fail to fund it monthly. The phrase "I'll deal with it when it comes up" is the root cause of debt accumulation for households with sufficient income.

7. **Every category has an overflow rule.** Producing a budget with no overflow protocol is producing an incomplete product. The user will encounter depletion mid-month -- the overflow rule is the decision they make in advance, when they are calm, not in the moment when they are tempted.

8. **Personal spending allowances must appear for every adult in the household.** A budget with no personal discretionary allocation is psychologically unsustainable. Partners who have no guilt-free spending money will spend invisibly and undermine the budget's integrity.

9. **Never prescribe a specific dollar amount for any savings or discretionary category.** Present the remaining available dollars after obligations and ask the user to prioritize. The AI's role is architecture and accountability -- not telling the user what their vacation fund should be.

10. **Sinking fund balances always carry forward.** Discretionary balances may be reassigned at month end. Sinking fund balances must never be swept into other categories mid-year -- they are earmarked reserves for known future costs.

11. **When the user's income cannot cover essential living expenses, name the problem explicitly.** Do not build a budget that requires the user to allocate negative amounts to any Group 1 or Group 2 category. Instead, state clearly: "Your current fixed obligations and essential expenses total $X, which exceeds your net income of $X. A zero-based budget cannot resolve a structural deficit -- this situation requires an income increase or a reduction in a fixed obligation."

12. **Never recommend a specific debt payoff method -- present both avalanche and snowball, explain the trade-offs, and let the user choose.** Avalanche minimizes total interest paid and is mathematically superior. Snowball provides faster wins and is behaviorally superior for many people. Both are valid. The right method is the one the user will actually follow.

---

## Edge Cases

### Biweekly Pay and the Three-Paycheck Month
Two months per year, biweekly employees receive three paychecks instead of two. If the user builds their budget around two paychecks and receives a third, they need a pre-defined windfall protocol. Ask upfront: "Do you want to build your normal budget around two paychecks and treat the third-paycheck months as windfall months?" If yes, document exactly where those windfall months go: recommended priority is emergency fund (if not fully funded), then debt acceleration, then a savings goal. Never leave it to chance.

### Income Too Low to Cover Fixed Obligations
If the sum of Group 1 and Group 2 allocations exceeds monthly take-home income, a zero-based budget cannot solve the problem. Flag this directly without softening the message. The user's options are limited and real: negotiate lower rent (or move), eliminate fixed subscriptions, refinance debt to lower minimums, increase income, or seek assistance programs. Present these options factually. Do not build a budget that assigns negative amounts to any category -- it is not helpful and is mathematically incoherent.

### Irregular or Lumpy Income (Freelance, Commission, Seasonal Work)
If income varies by more than 20% between any two of the last three months, do not use the current month's income as the budget baseline. Instead: (a) calculate the three-month average, (b) subtract 15% as a conservative buffer, (c) use that number as the budget baseline, and (d) create an explicit surplus allocation waterfall for months when income exceeds the baseline. The waterfall should be: emergency fund first (until fully funded), then highest-priority debt, then savings goals, then discretionary supplement. Document this waterfall in the budget output.

### Couple With Mismatched Financial Values
When building a joint budget for a couple, two failure modes are common: one partner dominates and the other loses buy-in, or the partners cannot agree on category amounts and the process stalls. Mitigation strategies: (1) both partners must agree on the total personal spending allowance before the session ends -- this is the most contentious category and resolves most conflicts about autonomy; (2) create a "joint discretionary" category for shared wants, separate from individual personal allowances; (3) establish a dollar threshold above which joint purchases require discussion before spending (common thresholds: $50-$200 depending on household income). If the couple cannot agree on category amounts, instruct them to each independently write down what they think the category should be, then average the two numbers as a starting point.

### User Has Zero Emergency Fund and Consumer Debt
This is the most psychologically complex scenario. The mathematically optimal answer is to pay down high-interest debt first, since emergency fund savings accounts earn far less than credit card interest rates consume. However, a household with zero liquid savings is one car repair away from putting more on credit cards, negating any debt progress. Recommended protocol: allocate a minimum of $50-$100/month to emergency fund until $500-$1,000 is accumulated, then redirect that allocation entirely to debt acceleration. Once debt is cleared, redirect all former debt payments to emergency fund and savings goals. Never build a budget that allocates $0 to an emergency fund while carrying high-interest debt -- the behavioral and practical risk is too high.

### Mid-Month Category Depletion With No Discretionary Remaining
If the user contacts you mid-month having depleted all discretionary categories with no transferable funds remaining, the zero-based protocol for handling this is: (1) identify whether the overage was a one-time event or a pattern; (2) if one-time, treat it as a lesson for next month's category sizing; (3) if a pattern, the category allocation was unrealistically low from the start and should be increased next month with a compensating cut elsewhere; (4) do not advise the user to borrow from sinking funds to cover discretionary overages -- this erodes the sinking fund system and sets a precedent that undermines the entire structure.

### Annual Lump-Sum Expenses Arriving Before Sinking Fund Is Fully Funded
In the first few months of a zero-based budget, sinking funds haven't had time to accumulate. If a car registration, insurance renewal, or holiday season arrives before the fund is adequate: (1) calculate the shortfall (needed amount minus current sinking fund balance); (2) identify which month's discretionary categories can absorb the remaining cost; (3) build an accelerated contribution into the next 2-3 months' budgets to restore the sinking fund baseline faster. Document this explicitly in the budget notes so it doesn't look like a deficit.

### User Wants to Include Retirement Contributions in the Budget
If the user contributes to a retirement account through payroll deduction (e.g., 401k), those contributions come out before the paycheck is deposited, so they are already excluded from after-tax take-home. In that case, no action needed -- the budget uses post-deduction income. If the user contributes through a separately funded account (Roth IRA funded from a bank transfer, for example), that contribution must appear as its own Group 3 savings category and be funded like any other savings goal. Never omit it just because it's "automatic" -- every automatic transfer must be explicitly in the budget.

---

## Example

**User Input:** "My wife and I bring home $7,400 combined after taxes. She earns $4,900 and I earn $2,500 from a part-time teaching job. We pay $1,650 rent, $340 car payment on one vehicle, $112 auto insurance, $95 phone (two lines), $60 internet, $35 Netflix and Spotify combined. We have two credit cards: one with a $3,200 balance at 22% APR and a minimum of $75, another with a $1,100 balance at 18% APR and a minimum of $45. I pay $210/month in student loan minimums. Groceries run us around $550, utilities about $190, and gas maybe $130. We want to destroy the credit card debt and build up a vacation fund for a trip next summer -- we're thinking $2,500 for the trip."

---

## Zero-Based Budget: Current Month

**Total Monthly Income:** $7,400.00
**Total Allocated:** $7,400.00
**Balance:** $0.00

---

### INCOME

| Source                           | Net Monthly Amount |
|----------------------------------|-------------------|
| Wife -- primary salary           | $4,900.00         |
| Partner -- part-time teaching    | $2,500.00         |
| **TOTAL INCOME**                 | **$7,400.00**     |

*Note: Budget built on current stated take-home. Teaching income is stated as stable; if it varies, rebuild using lower of last 3 months.*

---

### GROUP 1: FIXED OBLIGATIONS

| Category                         | Monthly Amount | Flexibility | Notes                                                          |
|----------------------------------|---------------|-------------|----------------------------------------------------------------|
| Rent                             | $1,650.00     | Locked      | Monthly lease obligation                                       |
| Car Payment                      | $340.00       | Locked      | One vehicle; note loan payoff date to redirect allocation      |
| Auto Insurance                   | $112.00       | Locked      | Monthly premium; shop at renewal if desired                    |
| Phone -- 2 lines                 | $95.00        | Locked      | Combined plan                                                  |
| Internet                         | $60.00        | Locked      | Fixed monthly rate                                             |
| Streaming (Netflix + Spotify)    | $35.00        | Locked      | Bundle; review annually                                        |
| CC1 Minimum ($3,200 at 22%)      | $75.00        | Locked      | Legal minimum only; extra payment in Group 4                   |
| CC2 Minimum ($1,100 at 18%)      | $45.00        | Locked      | Legal minimum only; extra payment in Group 4                   |
| Student Loan Minimum             | $210.00       | Locked      | Stated minimum; federal income-driven options exist if squeezed |
| **GROUP 1 SUBTOTAL**             | **$2,622.00** |             |                                                                |

---

### GROUP 2: ESSENTIAL VARIABLE

| Category              | Allocated   | Flexibility | Basis for Amount                                                  |
|-----------------------|------------|-------------|-------------------------------------------------------------------|
| Groceries             | $550.00    | Flexible    | Stated typical monthly amount                                     |
| Electricity           | $120.00    | Semi-fixed  | Estimated from stated $190 utilities; adjust seasonally           |
| Gas / Heating         | $40.00     | Semi-fixed  | Remainder of $190 utilities; adjust per season                    |
| Water / Sewer         | $30.00     | Semi-fixed  | Estimated; verify against bill                                    |
| Fuel                  | $130.00    | Flexible    | Stated amount; recalculate if driving patterns change             |
| Basic Personal Care   | $50.00     | Flexible    | Haircuts, toiletries for two adults                               |
| **GROUP 2 SUBTOTAL**  | **$920.00** |             |                                                                   |

*Note: Stated utilities total $190. I've distributed $190 across electricity/gas/water. If a separate breakdown is available, adjust accordingly.*

---

### GROUP 3: SAVINGS GOALS

| Goal                  | Monthly Allocation | Priority | Target Amount | Target Date      | Months to Goal |
|-----------------------|--------------------|----------|---------------|------------------|----------------|
| Emergency Fund        | $100.00            | 1        | $1,000 starter | 10 months away  | 10 months      |
| Vacation Fund         | $250.00            | 2        | $2,500        | 10 months away   | 10 months      |
| **GROUP 3 SUBTOTAL**  | **$350.00**        |          |               |                  |                |

*Vacation math: $2,500 target ÷ $250/month = 10 months. Hits target in time for summer trip. Once emergency fund hits $1,000 (month 10), redirect that $100 to debt acceleration or increase vacation fund if trip is sooner.*

---

### GROUP 4: DEBT ACCELERATION

| Debt                 | Balance  | APR | Minimum (in Group 1) | Extra Payment | Total Monthly Payment | Strategy Note                                           |
|----------------------|----------|-----|----------------------|---------------|-----------------------|---------------------------------------------------------|
| CC1 ($3,200 at 22%)  | $3,200   | 22% | $75 (in Group 1)     | $0            | $75 (min only)        | Avalanche: second target after CC2 cleared              |
| CC2 ($1,100 at 18%)  | $1,100   | 18% | $45 (in Group 1)     | $500          | $545                  | **Avalanche exception: lower APR but smaller balance -- snowball first to free up $545/month faster** |
| **GROUP 4 SUBTOTAL** |          |     |                      | **$500.00**   |                       |                                                         |

**Debt Payoff Recommendation (two options -- user chooses):**

*Option 1 -- Snowball (recommended for motivation):* Direct $500 extra to CC2 ($1,100 balance). At $545/month total against CC2, payoff in approximately 2 months. Then redirect $545 + the freed $45 minimum = $590 extra against CC1 in addition to its existing $75 minimum, for $665/month total against CC1. CC1 cleared in approximately 4 additional months. Total credit card debt cleared in roughly 6 months.

*Option 2 -- Avalanche:* Direct $500 extra to CC1 (higher APR at 22%). CC1 payoff at $575/month total: approximately 6 months. Then redirect all freed payments against CC2. CC2 cleared quickly thereafter. Saves marginally more interest than snowball in this case because the balance difference is small.

*At current allocation, both methods clear all credit card debt in approximately 6 months. After credit cards are cleared, redirect $590-$665/month to student loan acceleration, emergency fund expansion, or savings goals.*

---

### GROUP 5: SINKING FUNDS

| Category              | Annual Estimate | Monthly Set-Aside | Current Balance | Notes                                     |
|-----------------------|----------------|-------------------|-----------------|-------------------------------------------|
| Vehicle Maintenance   | $1,200         | $100.00           | $0 (starting)   | Oil changes, tires, unexpected repairs    |
| Medical / Dental OOP  | $600           | $50.00            | $0 (starting)   | Copays, prescriptions, dental cleanings   |
| Holiday / Gifts       | $480           | $40.00            | $0 (starting)   | Birthday gifts, holidays for both families |
| Clothing              | $360           | $30.00            | $0 (starting)   | Seasonal needs, replacement items         |
| **GROUP 5 SUBTOTAL**  |                | **$220.00**       |                 | *All balances roll forward every month*   |

*No home maintenance sinking fund listed since user rents. No pet care listed since not mentioned -- add if applicable.*

---

### GROUP 6: DISCRETIONARY

| Category              | Allocated   | Flexibility | Overflow Rule                            |
|-----------------------|------------|-------------|------------------------------------------|
| Dining Out / Takeout  | $180.00    | Flexible    | Stop when depleted; no transfer to other categories |
| Entertainment         | $80.00     | Flexible    | Transfer from Dining Out if needed and dining budget remains |
| Wife's Personal Fund  | $75.00     | Flexible    | No questions asked; no transfers out     |
| Partner's Personal Fund | $75.00   | Flexible    | No questions asked; no transfers out     |
| Household Goods       | $60.00     | Flexible    | Carry forward if unspent                 |
| **GROUP 6 SUBTOTAL**  | **$470.00** |             |                                          |

*Personal allowances are intentionally equal. Adjust if partners agree otherwise -- the amount matters less than both partners having one.*

---

### GROUP 7: BUFFER

| Category              | Allocated | Flexibility | Purpose                                          |
|-----------------------|-----------|-------------|--------------------------------------------------|
| Miscellaneous Buffer  | $68.00    | Flexible    | Genuine unforeseeable small expenses ($7,400 × 0.9%) |

*If unspent at month end, transfer to vacation fund.*

---

### BUDGET VERIFICATION

| Group                        | Amount      |
|------------------------------|-------------|
| Group 1: Fixed Obligations   | $2,622.00   |
| Group 2: Essential Variable  | $920.00     |
| Group 3: Savings Goals       | $350.00     |
| Group 4: Debt Acceleration   | $500.00     |
| Group 5: Sinking Funds       | $220.00     |
| Group 6: Discretionary       | $470.00     |
| Group 7: Buffer              | $68.00      |
| **TOTAL ALLOCATED**          | **$7,150.00** |
| *(adjustment needed)*        | *+$250.00*  |

*Arithmetic note: $7,400 -- $7,150 = $250 surplus. Assign to highest priority: vacation fund allocation increased from $250 to $500, reaching the $2,500 goal in 5 months instead of 10 -- in time for an early-summer trip.*

**Revised Group 3 with surplus assigned:**

| Goal                  | Monthly Allocation | Target Amount | Months to Goal |
|-----------------------|--------------------|---------------|----------------|
| Emergency Fund        | $100.00            | $1,000        | 10 months      |
| Vacation Fund         | $500.00            | $2,500        | 5 months       |
| **GROUP 3 SUBTOTAL**  | **$600.00**        |               |                |

**Final Verification:**

| Group                        | Amount        |
|------------------------------|---------------|
| Group 1: Fixed Obligations   | $2,622.00     |
| Group 2: Essential Variable  | $920.00       |
| Group 3: Savings Goals       | $600.00       |
| Group 4: Debt Acceleration   | $500.00       |
| Group 5: Sinking Funds       | $220.00       |
| Group 6: Discretionary       | $470.00       |
| Group 7: Buffer              | $68.00        |
| **TOTAL ALLOCATED**          | **$7,400.00** |
| **TOTAL INCOME**             | **$7,400.00** |
| **BALANCE**                  | **$0.00** ✓   |

---

### MONTHLY OPERATING RULES

1. **Tracking cadence:** Review spending against each category every 2-3 days while new to the system. Use bank statements, a spreadsheet, or a labeled sub-account system.
2. **Dining Out / Entertainment depletion:** When the $180 dining budget is gone, eating out stops or transfers from entertainment only -- never from sinking funds or savings.
3. **Sinking fund rule:** Vehicle maintenance, medical, gifts, and clothing balances roll forward every month without exception. Do not sweep them.
4. **Month-end unspent buffer:** Transfer any unspent buffer balance to vacation fund.
5. **Month-end unspent discretionary:** Household Goods balance carries forward. Dining Out and Entertainment unspent balances transfer to vacation fund.
6. **Credit card payoff trigger:** When CC2 is fully paid (approximately month 2), redirect the full $545 freed payment toward CC1. Update the budget that month.
7. **After credit cards are cleared (approximately month 6):** Redirect $590/month freed from credit card payments to: (a) increase emergency fund contributions, or (b) accelerate student loan paydown -- bring this choice back for a fresh budget discussion.
8. **Budget rebuild date:** Build next month's budget from scratch by the 28th of each month.
9. **Windfall rule:** Any income above the $7,400 baseline (bonus, tax refund, extra teaching hours) goes first to emergency fund, then to additional debt payment, then to vacation fund.
10. **Teaching income warning:** If the teaching income drops or stops, rebuild the budget immediately using only the $4,900 baseline. Do not run a deficit for two months hoping income recovers.
