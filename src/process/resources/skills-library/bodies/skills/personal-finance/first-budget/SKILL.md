---
name: first-budget
description: |
  Creates a first-time budget for students, new graduates, or anyone who has never budgeted before. Starts from zero with income verification and essential expense mapping, uses simplified categories, and builds a minimal viable budget the user can maintain without financial experience.
  Use when the user is creating their very first budget, has no prior budgeting experience, is a student or new earner, or asks "how do I start budgeting?"
  Do NOT use for experienced budgeters wanting a method upgrade (use budget-planning, zero-based-budget, or fifty-thirty-twenty-budget), debt management, or investment planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance savings beginner-friendly"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# First Budget

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- A user explicitly says they have never budgeted before, or phrases like "I have no idea where to start" or "I just need the basics"
- A user is a student, recent graduate, or new employee setting up their financial life for the first time
- A user has just transitioned to financial independence -- moved out, started college, got their first job, or stopped relying on a parent or guardian
- A user's described situation shows no existing budgeting structure: no categories, no tracking, no savings habit, no awareness of monthly cash flow
- A user feels overwhelmed or anxious about money and needs the lowest-friction entry point possible
- A user has a simple income structure -- one or two jobs, steady paycheck, no business income -- and wants to understand where their money is going
- A user asks "how much should I be saving?" or "am I spending too much?" with no budget context to work from

**Do NOT use when:**
- The user has budgeted before and wants a more structured method -- use `budget-planning`, `zero-based-budget`, or `fifty-thirty-twenty-budget`
- The user has significant debt and wants a payoff strategy -- use debt management skills; a first budget is not a debt elimination tool
- The user wants to track expenses retroactively or categorize past spending -- use `expense-tracking-setup`
- The user's primary concern is investing, retirement accounts, or building wealth -- use investing skills; build the budget foundation separately
- The user has complex finances: multiple income streams totaling different amounts each month, business income, freelance income as a primary earner, or significant assets -- these need the `variable-income-budget` or `self-employed-budget` skills
- The user is dealing with financial crisis -- inability to pay rent or utilities, debt collection, or negative net cash flow of more than $200/month -- these require skills focused on financial triage, not budget-building
- The user is in a couple or household with combined finances and shared decision-making conflicts -- surface the couple budgeting edge case and build a joint framework carefully

---

## Process

### Step 1: Set the Right Expectations Before Building Anything

Before asking for a single number, calibrate the user's expectations about what a first budget is and is not. This reduces abandonment.

- Explain that the goal of a first budget is **awareness**, not perfection. The user does not need to optimize spending on Day 1.
- State explicitly: this budget will have 6-9 line items, not 20. More categories at the beginning create confusion and defeat, not control.
- Clarify that the first budget is designed to last 2-3 months before any changes -- it is a baseline, not a final system.
- Tell the user that underspending their estimates is fine. Overspending by 10-15% in the first month is also fine -- it is data, not failure.
- If the user shows anxiety or shame about money, normalize it directly: most people their age have never been taught this, and the absence of a budget is not a moral failure.
- Do NOT ask more than 5-6 questions to build this budget. Excessive information-gathering overwhelms first-time budgeters and signals that budgeting is hard.

### Step 2: Establish Monthly Take-Home Income

The number that drives every budget decision is monthly take-home pay -- not gross salary, not annual income, not hourly rate. Get to the right number.

- Ask for **net monthly take-home pay** -- the amount actually deposited after taxes, health insurance premiums, and any 401(k) contributions already deducted by the employer.
- If the user gives an **annual salary**, calculate: (annual salary x 0.72 to 0.78) / 12 as a rough net estimate for US workers in the 22% federal tax bracket, and flag it as an estimate until they can confirm from a pay stub.
- If the user is **paid biweekly** (every two weeks), the monthly calculation is: (biweekly paycheck x 26) / 12. This yields the true monthly average. Do NOT simply multiply by 2 -- that underestimates by one full paycheck over a year.
- If the user is **paid weekly**, the monthly calculation is: (weekly paycheck x 52) / 12.
- If the user is **paid twice monthly** (1st and 15th), simply add the two paychecks -- they are already monthly.
- If income **varies** (tips, hourly with fluctuating hours, seasonal work), ask for the lowest month in the past 3 months and use that as the budget base. Explain that budgeting to the floor means the budget never breaks -- any extra becomes a bonus.
- If a student or non-earner gives a fixed monthly allowance, loan disbursement, or family contribution, treat that as income. The source does not change the math.
- **Income threshold check:** If monthly take-home is below $1,200, flag early that the budget will be primarily about essential expense visibility and coverage, not about building savings categories yet. Adjust tone and output accordingly.

### Step 3: Build the Must-Pay List (Fixed Essentials)

These are expenses that occur every month whether the user engages with their budget or not. They are non-negotiable and non-deferrable.

- **Housing:** Rent, mortgage payment, or the portion the user contributes to a shared household. This is always Line 1. For students in dorms, use room and board or housing fee.
- **Utilities:** Electric, gas, water, internet. If the user does not know the amount, estimate $80-$150/month for a single apartment depending on climate, or $30-$50 for their share of a split household. Flag as estimate to confirm after first bill.
- **Phone:** Monthly phone bill (plan only, not device installment). Device installments are debt payments and belong below.
- **Transportation:** This is a multi-part item for car owners -- add monthly car payment + car insurance premium + estimated monthly gas (ask miles driven per week; 15 miles/day x 30 days / 28 MPG average x current gas price gives a workable estimate). For transit users, use the monthly pass cost.
- **Groceries and household staples:** Food eaten at home plus household supplies (soap, cleaning products, toilet paper). Do NOT include dining out here. First-time budgeters frequently blur this line. If the user does not know, $200-$300/month is a reasonable starting estimate for a single adult cooking at home.
- **Minimum debt payments:** Student loan minimums, credit card minimums, car loan if not captured above, any financing agreements. These are legal obligations and belong in essentials regardless of size.
- **Insurance premiums not deducted from paycheck:** Renter's insurance ($10-$20/month, often overlooked), any supplemental health coverage.
- **Subscriptions that are genuinely essential** (only if the user explicitly considers them non-negotiable): streaming for a student who has no TV, necessary software for remote work. Flag that subscriptions are often the first thing reviewed in a Level-Up exercise.
- Total the must-pay list. Label it the **Essentials Total**.
- **Critical check:** If Essentials Total exceeds 70% of take-home income, flag this as a constraint worth noting. If it exceeds 90%, surface the deficit edge case immediately (see Edge Cases).

### Step 4: Calculate Flex Money and Check the Math

Flex money is the operating room in the budget. Its size determines what the user can actually do with the remaining steps.

- **Flex Money = Monthly Take-Home Income -- Essentials Total**
- If Flex Money is a positive number: proceed to Step 5.
- If Flex Money is **zero or negative**: do not attempt to build savings or spending buckets. Switch to the deficit handling in Edge Cases. Identify the single largest essential and discuss whether any part of it is adjustable (not a lecture -- a question about options).
- If Flex Money is **under $200**: build a minimal version -- one small savings deposit ($25-$50) and one buffer ($25-$50). Acknowledge that this is extremely tight and the goal is just to protect against the account hitting zero.
- If Flex Money is **$200-$600**: a simple three-bucket split works. See Step 5.
- If Flex Money is **$600+**: the user has meaningful room to save and spend with intention. Proceed normally through Step 5.
- **Do NOT express judgment about Flex Money size** in either direction. A large Flex Money is not a license to spend carelessly; a small one is not a verdict on the user's worth or choices.

### Step 5: Allocate Flex Money Into Three Buckets

Simplicity is the only feature that matters at this stage. Three buckets, three purposes.

- **Bucket 1 -- Spending Money:** Dining out, entertainment, clothing, personal care, hobbies, gifts, subscriptions, anything not on the essentials list. This is intentional discretionary spending, not guilt-spending. The user decides how much. If they have no idea, start with 55-65% of Flex Money as a default.
- **Bucket 2 -- Savings:** Emergency fund contributions, specific goal savings (trip, car, move), or retirement contributions beyond what is already deducted from paycheck. Even $25-$50/month is the right starting amount if funds are tight -- the habit of moving money to savings on payday is the skill being built, not the dollar amount.
   - Emergency fund priority note: a first-time budgeter's savings goal is almost always the emergency fund first. The standard target is 3-6 months of essential expenses. At the budgeting start, an initial mini-goal of $500-$1,000 is achievable and meaningful -- it covers most single unexpected expenses without needing a credit card.
   - If the employer offers a 401(k) match and it is NOT already captured in the take-home calculation, flag it as worth contributing up to the match. This is the clearest available return on money and belongs in the savings conversation even at the first-budget stage.
- **Bucket 3 -- Buffer:** A small monthly deposit into a mentally separate pool for irregular but predictable expenses: car maintenance, medical copays, vet bills, registration fees, holiday gifts, clothing replacement. Without a buffer, first-time budgeters experience their first $300 car repair as a budget catastrophe and abandon the system. $50-$150/month is appropriate to start.
   - If the user has a car, a $100/month buffer is a reasonable floor -- a single oil change and tire rotation costs $80-$120.
   - If the user does not have a car and is healthy, $50/month buffer covers most unexpected minor expenses.
- **If the user does not know how to split Flex Money**, offer a starting point: **60% Spending / 30% Savings / 10% Buffer**. Emphasize this is not a rule -- it is a default to start with and adjust after the first month when real data is available.
- The three buckets must sum exactly to Flex Money. If there is a small remainder after rounding (e.g., $7), add it to the Buffer.

### Step 6: Build the One-Page Budget

Compile the complete budget into a single table. Every number should be visible at once.

- **Income at the top.** One number. Monthly take-home.
- **Essentials section.** Each line item with its amount. Estimates flagged with "(est.)".
- **Essentials Total.** Bolded subtotal.
- **Flex Money.** Calculated remainder. Stated plainly as "your flexible dollars."
- **Three flex buckets.** Each with a name, amount, and one-sentence purpose.
- **Grand total check.** Income minus all lines should equal exactly $0. A zero-remainder budget means every dollar has a name. If it does not reach zero, the difference goes to buffer by default.
- Keep the entire budget visible in a single screen view. If it requires scrolling, it is too long.
- **Label estimates** clearly. A first-time budgeter who has never looked at a utility bill should not feel they have failed when the first bill is $20 higher than the estimate.
- Do NOT add commentary or coaching in the budget table itself. Keep the table clean. Save notes for below it.

### Step 7: Assign One Tracking Habit

The most common reason first budgets fail is not math -- it is the absence of a single feedback loop. One habit prevents drift without requiring discipline.

- The tracking habit for a first budget is a **weekly spending check**, not daily transaction logging.
- The mechanic: once per week, open the bank account, look at the balance, subtract any essentials scheduled to come out this month but not yet debited. The result is the approximate remaining Spending Money for the month.
- **Assign a specific day and time** (e.g., "Sunday evening before the week starts" or "Friday afternoon before the weekend"). Specificity drives compliance far more than general intent.
- If the user wants to use a tool: bank apps with built-in balance notifications are sufficient at this stage. The habit does not require a third-party app.
- **Do NOT recommend a multi-category tracking system, a spreadsheet with formulas, or daily receipt logging** for a first budget. These are appropriate for `expense-tracking-setup`, not here.
- The only trigger for action from the weekly check: if Spending Money is below 25% of the monthly amount and there is more than one week left in the month, slow discretionary spending for the remainder of the month.
- After 2-3 months of this single habit, the user has enough pattern recognition to adopt more sophisticated tracking. Point them to `expense-tracking-setup` then.

### Step 8: Close with a Level-Up Path and Normalizing Context

End every first budget output with two things: encouragement grounded in fact, and a clear next step.

- State plainly that having a written budget puts this person ahead of the majority of people their age -- not as flattery, but as context. Most adults operate without an explicit budget.
- Note that the budget will need adjustment after the first month. Estimates will be wrong. Some essential costs will have been forgotten. That is expected and part of the process.
- Provide a specific 90-day sequence:
   - **Month 1:** Use the budget as written. Do not try to optimize. Just track the Spending Money balance weekly.
   - **Month 2:** Adjust any estimates that proved inaccurate. Note which spending categories consumed the most Spending Money.
   - **Month 3:** If the budget feels stable, consider adding category-level tracking to Spending Money to see the breakdown (dining vs. clothing vs. entertainment).
   - **After Month 3:** Explore `expense-tracking-setup`, `emergency-fund-planner`, or `fifty-thirty-twenty-budget` depending on goals.

---

## Output Format

Present the budget in this structure after gathering the necessary information:

```
## Your First Budget

> Monthly Take-Home Income: $X,XXX
> Budget Built: [Month Year]

---

### The Must-Pay List (Essentials)

| Expense                        | Monthly Amount | Notes              |
|-------------------------------|----------------|--------------------|
| Rent / Housing                | $XXX           |                    |
| Utilities (electric, gas, internet) | $XXX    | (est.)             |
| Phone                         | $XX            |                    |
| Car Insurance                 | $XXX           |                    |
| Car Payment / Transit Pass    | $XXX           |                    |
| Gas                           | $XX            | (est.)             |
| Groceries & Household         | $XXX           | (est.)             |
| Student Loan Minimum          | $XXX           |                    |
| [Other Debt Minimum]          | $XXX           |                    |
| Renter's Insurance            | $XX            |                    |
| **Essentials Total**          | **$X,XXX**     |                    |

---

### Your Flex Money

**$X,XXX per month -- these are your flexible dollars**

This is the money you actively control. Here is how it is allocated:

| Bucket           | Monthly Amount | What It Covers                              |
|-----------------|----------------|---------------------------------------------|
| Spending Money  | $XXX           | Dining out, fun, clothing, personal care    |
| Savings         | $XXX           | Emergency fund (goal: $500 to start)        |
| Buffer          | $XX            | Car repairs, copays, unexpected costs       |
| **Flex Total**  | **$X,XXX**     |                                             |

---

### Your Complete Budget at a Glance

| Line                   | Amount      |
|-----------------------|-------------|
| Monthly Income        | + $X,XXX    |
| Essentials            | -- $X,XXX   |
| Spending Money        | -- $XXX     |
| Savings               | -- $XXX     |
| Buffer                | -- $XX      |
| **Every Dollar Named**| **$0**      |

---

### Your One Weekly Habit

Every [specific day], spend 2 minutes doing this:

1. Open your bank account
2. Check the current balance
3. Subtract any essentials still due this month (rent, loan payment, etc.)
4. The number you have left is your remaining Spending Money
5. If that number is below $[25% of Spending Money amount], slow down discretionary spending for the rest of the month

That is the entire system for now.

---

### Estimates to Confirm After Month 1

| Item                  | Estimated Amount | Action                                    |
|----------------------|------------------|------------------------------------------|
| Utilities            | $XXX             | Check first bill, update if off by $20+  |
| Gas                  | $XX              | Track fill-ups for 4 weeks, use average  |
| Groceries            | $XXX             | Track receipts for 2 weeks, adjust       |

---

### Your 90-Day Path

- **Month 1:** Use this budget as written. Do not try to change anything. Just do the weekly check.
- **Month 2:** Fix any estimates that were wrong. Note where your Spending Money goes.
- **Month 3:** If this feels stable, look at breaking Spending Money into sub-categories.
- **After Month 3:** You are ready for `expense-tracking-setup` or `fifty-thirty-twenty-budget`.
```

---

## Rules

1. **Always present the disclaimer before any financial content.** It is non-negotiable regardless of how casual or simple the question sounds.

2. **Never go above 9 line items in the essentials list.** If a user describes more expenses, look for natural groupings (all transportation costs into one line, all utilities into one line) before adding new rows. A longer list signals complexity before the user is ready.

3. **Always include a Savings line, even if the amount is $25.** The behavioral habit of separating savings from spending on payday is the most important financial skill in this entire budget. The dollar amount is secondary. Do not omit savings because money is tight.

4. **Always include a Buffer line, even if it is only $30-$50.** The single most common reason first budgets are abandoned is a single unexpected expense -- a $200 car repair, a $150 medical copay -- that "breaks" the plan. A buffer is the circuit breaker that keeps the budget alive through life's normal randomness.

5. **Never use jargon without translating it immediately.** Say "take-home pay (the amount deposited after taxes)" not "net income." Say "must-pay list" not "fixed obligations." Say "flex money" or "flexible dollars" not "discretionary income." Jargon signals that budgeting is for experts, which discourages the exact user this skill serves.

6. **Never instruct the user to cut specific expenses.** A first budget is a diagnostic tool, not an optimization exercise. The job is to make the numbers visible. If the user voluntarily identifies something they want to cut, reflect it back and incorporate it -- but do not initiate spending criticism. A user who feels judged will disengage.

7. **The tracking habit must be exactly one action, once per week.** No daily logging, no category breakdowns, no app setups, no spreadsheets in this skill. Complexity is for subsequent skills. The goal here is to build the feedback loop of checking spending against a known number -- everything else comes later.

8. **Flag every estimate explicitly with "(est.)" in the budget table.** A first-time budgeter who does not know their actual utility bill needs to understand which numbers are confirmed and which are placeholders. Estimates presented as confirmed numbers create discouragement when the first month shows differences.

9. **Use biweekly-to-monthly conversion math precisely.** If a user says "I get paid $1,300 every two weeks," the monthly income is ($1,300 x 26) / 12 = $2,816.67 -- not $2,600. The common mistake of multiplying biweekly by 2 causes a persistent budget shortfall. Flag the correct calculation explicitly.

10. **Always end with the 90-day path and Level-Up pointers.** A first budget without a graduation plan becomes a ceiling. Users who succeed with this system need a clear invitation to grow into more sophisticated tools. Name the next skills (`expense-tracking-setup`, `fifty-thirty-twenty-budget`, `emergency-fund-planner`) so the user knows the path forward.

11. **Do not ask for more than 5-6 pieces of information before building the budget.** Excessive questioning signals that budgeting is complicated and will cause the user to disengage. Gather income, housing, phone, transportation, groceries, and debt payments. Estimate everything else and flag it.

12. **If the budget does not balance to zero, add the remainder to the Buffer.** Never leave unassigned money in a first budget -- "leftover" money that has no name will be spent unconsciously, which is the exact behavior the budget is designed to replace.

---

## Edge Cases

### Student or Non-Earner with No Traditional Income
Replace "monthly income" with "monthly available funds." Sources might include: monthly family contribution, financial aid disbursements divided by months in the term, work-study earnings, or part-time job income. For a student receiving a $8,000 semester loan disbursement covering 5 months, monthly available funds = $8,000 / 5 = $1,600. Build the budget against that number. Emphasize that this is a finite pool -- the budget is about extending coverage through the entire term, not just the first six weeks. Savings in a student budget becomes "end-of-term emergency fund" or "moving fund" rather than a traditional emergency fund.

### Essentials Exceed Income (Deficit Budget)
This is the most important edge case in this skill. Handle it carefully.
- Show the deficit number plainly: "Your must-pay list is $2,100, but your take-home is $1,800. That is a $300/month shortfall on essentials alone."
- Do NOT soften or obscure this. The user needs to see it.
- Do NOT list solutions without the user's input. Instead, ask one question: "Which of these essential expenses has any flexibility at all?" This empowers the user to identify options rather than feeling lectured.
- Common actual options (not generic advice): a roommate to split rent (can cut housing by $400-$700/month), refinancing student loans to lower minimums temporarily, switching to a lower-cost phone plan, or increasing income via additional hours.
- Point toward `debt-management` or a financial counselor if the shortfall is significant and structural.
- Do NOT build savings or buffer lines if essentials exceed income. The budget at this stage is about visualizing the deficit, not allocating non-existent flex money.

### Irregular or Variable Income (Gig Work, Tips, Hourly with Fluctuating Hours)
Use the lowest recent month (past 3 months) as the budget base. Explain clearly: "We are budgeting to your floor income -- the least you have made in a typical month. If you make more, that extra money goes to Buffer first, then Savings. This way, the budget never breaks in a slow month." Do not attempt to average the income -- averages create budgets that work mathematically but fail practically in low-income months. Note that this is a simplified approach and point to `variable-income-budget` for a complete treatment once the user is comfortable with budget basics.

### Couple or Roommates Creating a First Shared Budget
Build using combined after-tax income for all contributing parties. For essential expenses, use the total household bills divided by the number of contributors if costs are split. Include a "Personal Spending" line for each person -- individual discretionary money that does not require discussion or joint approval. This line is the single most important element of a functional shared budget: removing the need to consult each other for every small purchase reduces financial friction and prevents the budget from becoming a control mechanism. Typical starting amount: $75-$200 per person per month depending on total flex money. For joint savings goals (shared apartment fund, vacation), build a shared savings line in addition to any individual savings.

### User Has No Idea What They Spend
This is the most common scenario for a true first budget, not an edge case -- but it requires a specific handling path. Gather the known, fixed items: rent, phone, car insurance, loan payments. These can be verified instantly. For variable essentials (groceries, gas, utilities), provide anchored estimates based on the user's situation and flag each one. Tell the user: "Your first month of this budget will tell you whether these estimates are right. The goal right now is to have a number on paper -- even an imperfect number -- because any number is better than no number." After 30 days of using the budget, the user will have actual data to replace the estimates. This is normal and expected.

### User Just Had a Life Change (New Job, Moved Out, Breakup, Graduated)
These transitional moments are the highest-frequency triggers for a first budget. The financial picture is genuinely uncertain because new costs are being discovered in real time. Build the budget with a larger-than-normal Buffer (15-20% of Flex Money instead of the usual 10%) to absorb setup costs: new apartment deposits, furniture, job-related clothing, transportation changes. Explicitly tell the user: "Your first two months will have higher costs than normal -- these are one-time transition expenses. The budget will stabilize in month 3." This prevents the user from concluding that the budget "doesn't work" because month 1 shows higher spending.

### User Asks "Am I Spending Too Much on X?"
When a user singles out a category for judgment before a budget exists, redirect before answering. Build the full budget first. Once the complete picture is visible, the question of whether any single line is "too much" has context -- it is only meaningful relative to total income and what else the person values. If the user insists on a benchmark, common reference ranges (not rules) for single adults: housing under 30% of gross income; transportation 10-15% of net income; groceries $200-$400/month. Always frame these as population averages, not personal prescriptions.

### User Mentions Overdrafting Regularly
Overdrafting is the clearest signal that the budget is already needed and that the tracking habit is critical. Before building the budget, note that overdraft fees ($25-$35 per incident at most institutions) are themselves a line item consuming flex money that could be redirected. If the user is overdrafting 1-2 times per month, that is $25-$70/month in fees -- often enough to fund a small Buffer that prevents future overdrafts. Build the Buffer line with urgency. Note that many institutions offer overdraft protection transfers from savings accounts for free or at lower cost than standard overdraft fees -- this is general financial literacy, not a product recommendation.

---

## Example

**Input:** "I just started my first real job three months ago and I'm finally feeling settled enough to actually do this. I make $52,000 a year but I have no idea what that is per month after taxes. I pay $950/month rent, $70 for my phone, $130 for car insurance, I own my car outright so no payment, and I'm spending maybe $280 on groceries (I think). I have $215/month in student loans and I have two credit cards I'm paying minimums on -- one is $35/month and the other is $25/month. I honestly have no idea where the rest of my money goes. I've never made a budget before."

---

**Output:**

## Your First Budget

> Monthly Take-Home Income: $3,120
> Budget Built: [Current Month Year]

**Income note:** You mentioned $52,000/year. For a US salary in that range, take-home after federal and state taxes typically lands around $3,050-$3,200/month depending on your state. I am using $3,120 as a working estimate -- confirm this against your last pay stub and update the budget if the actual number is different by more than $50.

---

### The Must-Pay List (Essentials)

| Expense                         | Monthly Amount | Notes                              |
|--------------------------------|----------------|------------------------------------|
| Rent                           | $950           |                                    |
| Utilities (electric, internet) | $120           | (est.) -- confirm after first bill  |
| Phone                          | $70            |                                    |
| Car Insurance                  | $130           |                                    |
| Gas                            | $80            | (est.) -- track fill-ups for 4 weeks |
| Groceries & Household          | $280           | (est.) -- keep grocery receipts    |
| Student Loan                   | $215           |                                    |
| Credit Card Minimum -- Card A  | $35            |                                    |
| Credit Card Minimum -- Card B  | $25            |                                    |
| Renter's Insurance             | $15            | (est.) -- worth getting if you do not have it; typical cost $12-$20/month |
| **Essentials Total**           | **$1,920**     |                                    |

*Essentials are 61.5% of your take-home income. That is a healthy ratio -- you have meaningful flex money to work with.*

---

### Your Flex Money

**$1,200 per month -- these are your flexible dollars**

This is the money you actively control. You decide where it goes. Here is a suggested starting split:

| Bucket          | Monthly Amount | What It Covers                                                   |
|----------------|----------------|------------------------------------------------------------------|
| Spending Money  | $720           | Dining out, entertainment, clothing, personal care, subscriptions |
| Savings         | $360           | Emergency fund -- goal is $1,000 first, then $5,000             |
| Buffer          | $120           | Car maintenance, medical copays, gifts, anything unexpected     |
| **Flex Total**  | **$1,200**     |                                                                  |

**Why these amounts?** I used a 60/30/10 split as a starting point. After your first month, you will know whether $720 in Spending Money is tight or generous for how you actually live. Adjust the split then -- this is a starting point, not a rule.

---

### Your Complete Budget at a Glance

| Line                    | Amount      |
|------------------------|-------------|
| Monthly Income         | + $3,120    |
| Essentials             | -- $1,920   |
| Spending Money         | -- $720     |
| Savings                | -- $360     |
| Buffer                 | -- $120     |
| **Every Dollar Named** | **$0**      |

---

### Your One Weekly Habit

Every **Sunday evening**, spend 2 minutes doing this:

1. Open your bank account
2. Check the current balance
3. Subtract any essentials still due this month (rent if unpaid, loan payment, insurance, etc.)
4. The number you have left is your approximate remaining Spending Money
5. If that number is below **$180** (25% of your $720 Spending Money) and there is more than a week left in the month, slow down discretionary spending until the month resets

That is the entire tracking system for now. No app required. No spreadsheet required.

---

### Estimates to Confirm After Month 1

| Item           | Used in Budget | Action                                                    |
|---------------|----------------|----------------------------------------------------------|
| Take-Home     | $3,120         | Check pay stub -- adjust if off by more than $50         |
| Utilities     | $120           | Check first electric and internet bills, update if needed |
| Gas           | $80            | Keep a note of fill-up amounts for 4 weeks, use average  |
| Groceries     | $280           | Keep receipts or check bank transactions for 2 weeks     |

---

### A Note on Your Credit Cards

Your current card minimums ($35 and $25 = $60/month) are in your Essentials list, which is correct. But minimums on credit cards cover almost no principal -- they mostly pay interest. Once your budget is stable and your emergency fund reaches $500-$1,000, revisit whether any of your Spending Money or Savings can be redirected toward paying above the minimum on the higher-interest card. That is a conversation for `debt-management` skill -- not today. For now, treating minimums as fixed essentials is exactly right.

---

### Your 90-Day Path

- **Month 1:** Use this budget exactly as written. Do the Sunday check. Do not try to optimize anything. Just let the budget show you what is real.
- **Month 2:** Fix the estimates that were wrong (utilities, gas, groceries). Note where your Spending Money goes -- which 2-3 things consume most of it.
- **Month 3:** If this feels routine, consider breaking Spending Money into sub-categories (dining, entertainment, shopping) to see the detail.
- **After Month 3:** You are ready to level up.
   - To track expenses with more detail: `expense-tracking-setup`
   - To build your emergency fund deliberately: `emergency-fund-planner`
   - To try a structured budget method: `fifty-thirty-twenty-budget`
   - To address your credit card balances: `debt-management`

---

**One last thing:** You mentioned not knowing where the rest of your money goes. That is the most honest thing a person can say about their finances, and it is exactly the right starting point. After one month with this budget, you will know. The budget does not require you to already understand your spending -- it is the tool that creates that understanding.
