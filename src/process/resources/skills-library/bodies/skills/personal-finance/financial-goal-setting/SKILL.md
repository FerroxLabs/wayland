---
name: financial-goal-setting
description: |
  Converts vague financial aspirations into SMART goals with specific dollar targets, timelines, and monthly savings requirements. Produces a structured goal plan that breaks large financial objectives into measurable monthly actions the user can track.
  Use when the user has financial aspirations but has not defined specific targets, timelines, or monthly contribution amounts.
  Do NOT use for creating a budget (use budget-planning), tracking multiple existing savings goals (use savings-goals-tracker), or investment planning.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance budgeting goal-setting planning savings"
  category: "personal-finance"
  subcategory: "life-stage-financial"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Financial Goal Setting

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly -- including tax situation, risk tolerance, employment stability, family obligations, and local cost of living -- and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

---

## When to Use

**Use this skill when:**
- The user states a financial wish without numbers, timeline, or monthly action attached -- phrases like "I want to buy a house someday," "I should probably start saving," "I want to retire early," "I want to pay off my debt," or "I want to build wealth"
- The user asks how to turn a life event (marriage, new baby, career change, upcoming graduation) into a financial action plan
- The user wants to know whether a financial goal is realistic given their income, and what they need to do monthly to get there
- The user has competing financial priorities and does not know which to fund first or how to allocate a surplus between them
- The user has never set financial goals before and wants a structured starting point -- even if their financial picture is incomplete
- The user is revisiting goals after a life change (divorce, job loss, promotion, inheritance) and needs to rebuild a plan from current reality
- The user wants to understand the specific mechanics of goal math: how long to save, how much per month, what happens if they start late

**Do NOT use when:**
- The user already has defined, specific goals with dollar amounts and timelines, and wants to allocate savings across them -- use `savings-goals-tracker` instead
- The user wants to build a full monthly budget from income and expenses -- use `budget-planning` instead; this skill assumes a surplus exists or can be discovered, not that it needs to be built line by line
- The user wants advice on how to invest existing savings -- use investing-specific skills; this skill treats savings destinations as generic (account, fund, bucket) without specifying investment vehicles
- The user's primary problem is debt -- specifically when total debt obligations consume the majority of surplus -- use a debt management skill first, then return here once a surplus is freed up
- The user wants tax optimization strategies (HSA contributions, 401(k) limits, Roth vs. traditional decisions) -- those require a tax-planning skill
- The user is asking about estate planning, insurance coverage, or will/trust preparation -- those are separate financial planning domains

---

## Process

### Step 1: Gather the Financial Reality Snapshot

Before any goal can be defined, you need enough of the user's actual financial picture to make the math honest. Ask for or infer:

- **Monthly take-home income** (after taxes and benefits deductions) -- not gross salary. If the user gives gross, apply a rough 25--30% effective deduction for standard W-2 workers as a working estimate, and flag this assumption explicitly.
- **Monthly essential expenses** (housing, utilities, groceries, transportation, minimum debt payments, insurance). If the user says "about $X," accept it and note the approximation.
- **Monthly discretionary spending** (dining, subscriptions, entertainment, clothing). If unknown, suggest they estimate or skip this and treat surplus as conservative.
- **Available monthly surplus** = take-home income minus total expenses. This is the fuel for all goals. If the surplus is zero or negative, flag this immediately -- goal-setting becomes prioritization and expense-reduction work.
- **Existing savings balances** relevant to each goal (emergency fund balance, house down payment savings, retirement account balance if relevant).
- **Outstanding debts**: type (credit card, student loan, auto, mortgage), balance, and minimum payment. High-interest debt (above 7% APR) materially affects goal prioritization.
- **Time horizon**: any fixed-deadline events (lease ending, child starting college, planned retirement year) that create hard constraints.

Do not demand perfect information. Work with what the user provides. Flag every assumption you make so the user can correct it.

---

### Step 2: Identify and Clarify Each Financial Aspiration

Collect 1--5 aspirations from the user. For each one, ask clarifying questions to understand what the user actually means:

- **"Save more money"** -- More than what? For what purpose? Is this general liquidity, a specific purchase, or psychological security?
- **"Buy a house"** -- What price range? In which area? How much of a down payment are you thinking? (Note: conventional mortgages typically require 5--20% down; FHA loans require 3.5% with PMI implications; 20% down avoids private mortgage insurance, which typically costs 0.5--1.5% of the loan amount annually.)
- **"Retire early"** -- What age? What does retirement mean to you (full stop, part-time, travel)? Do you have any existing retirement savings?
- **"Pay for my kids' college"** -- How many children? How many years until enrollment? Public or private school expectation? Full coverage or partial?
- **"Take a big trip"** -- When? Where? Rough budget?
- **"Start a business"** -- What type? What startup capital estimate?
- **"Build an emergency fund"** -- Do you know your monthly essential expenses? (Emergency fund targets: 3 months for dual-income, stable employment; 6 months for single-income or variable income; 9--12 months for self-employed or commission-based.)

If the user cannot answer specifics, use standard benchmarks as scaffolding and label them as estimates. The plan can be updated later as clarity improves.

---

### Step 3: Apply the SMART Framework to Each Aspiration

Convert each raw aspiration into a goal with five defined properties. Each property has domain-specific mechanics:

**Specific:** Define exactly what the goal produces.
- Not "save for a house" but "accumulate $40,000 in a dedicated high-yield savings account for a down payment on a home purchase priced at $350,000--$400,000"
- Not "retire early" but "build a retirement nest egg of $1,250,000 by age 55, using the 4% withdrawal rule as a rough sustainability benchmark" (note: the 4% rule is a guideline from historical data, not a guarantee)
- Not "build an emergency fund" but "hold 6 months of essential expenses ($18,000) in a liquid, FDIC-insured account"

**Measurable:** Define the metric and the tracking cadence.
- Dollar amount in a dedicated account, checked monthly
- Percentage of target reached, updated on a set calendar date
- Number of months of expenses covered

**Achievable:** Run the math before accepting the timeline.
- Monthly required = (Target amount -- Current savings) / Months until deadline
- If monthly required exceeds available surplus, the goal needs adjustment
- Adjustment levers in order of preference: (1) extend timeline, (2) reduce target, (3) find additional income or reduce expenses, (4) fund sequentially rather than in parallel
- Flag if the goal requires saving more than 50% of monthly surplus toward a single objective -- this leaves no cushion for unexpected expenses

**Relevant:** Connect the goal to the user's stated motivation.
- Ask "why does this matter to you?" once per goal -- not for philosophical exploration, but because the answer determines priority when tradeoffs arise
- A goal with a deeply personal motivation survives income shocks better than a goal adopted because it seemed responsible

**Time-bound:** Set a specific month and year, not just a duration.
- "24 months from now" is weaker than "October 2027" because a calendar date survives a moment of forgetfulness
- For open-ended goals like "build wealth," define a meaningful checkpoint date (12 months, 36 months) rather than leaving the timeline infinite

---

### Step 4: Calculate Goal Math Precisely

For each goal, perform these calculations explicitly and show your work so the user can verify and adjust:

**Basic calculation:**
- Remaining balance = Target amount -- Current savings already allocated to this goal
- Monthly contribution needed = Remaining balance / Months to deadline
- Round up to the nearest $5 or $10 for simplicity

**Reverse calculation (if user names a monthly amount):**
- Timeline to goal = Remaining balance / Monthly contribution
- Convert months to a specific target date

**Savings growth consideration:**
- For goals longer than 24 months, savings in interest-bearing accounts grow. A simple approximation: for money held in a high-yield savings account at roughly 4--5% APY (as of recent years; rates change), the required monthly contribution is slightly lower than the simple division calculation. For beginner-level goal setting, use simple division and treat any interest earned as a buffer rather than a planning assumption. Flag this for the user.
- For retirement goals with investment growth, the math changes substantially -- use the standard formula: FV = PMT × [((1+r)^n - 1) / r] -- but only apply this if explicitly discussing long-horizon investment-based goals, and note this moves into investing territory.

**Surplus feasibility check:**
- Sum all monthly goal contributions
- Compare to available monthly surplus
- If total contributions exceed surplus: present the gap honestly -- "Your goals require $1,200/month in contributions but your current surplus is $850. That's a $350 gap."
- Offer resolution options: sequential funding, scaled contributions, timeline extension, or identifying expenses to cut

**Parallel vs. sequential funding decision:**
- Fund the emergency fund first in nearly all cases. An emergency fund prevents debt creation when unexpected expenses hit, which would otherwise derail all other goals.
- Exception: if the user has an employer 401(k) match available, capturing that match (which is an immediate 50--100% return) takes priority over building beyond a $1,000 starter emergency fund
- Once the emergency fund is established: fund goals in parallel if total contributions fit within surplus; fund sequentially if they do not
- High-interest debt payoff (above ~7% APR) should compete with or precede discretionary savings goals because the guaranteed return from eliminating 20% APR credit card debt exceeds almost any savings alternative

---

### Step 5: Set Milestones with Psychological Realism

Large financial goals fail not because of math errors but because of motivation collapse over time. Milestones counteract this.

Rules for effective milestones:
- **First milestone must be achievable within 60--90 days.** The brain needs an early win signal. For a 24-month goal, the first milestone might be just 8--10% of the total target.
- **Name milestones concretely** rather than calling them "checkpoint 1." "First month of expenses covered" is motivating. "$2,600 reached" is less so.
- **Space remaining milestones at roughly 25%, 50%, 75%, and 100%** of the target for longer goals.
- **Attach an action or review to each milestone** -- not just a dollar amount. At the 50% mark, the user should revisit whether the goal still makes sense, whether the timeline is still correct, and whether the monthly amount needs adjustment.
- **Identify a non-financial reward at each milestone.** The reward must be meaningful but not expensive enough to derail savings. A specific dinner, a day trip, a book purchase, a personal experience. The user should define this -- you can prompt them, but do not assign it.

---

### Step 6: Design the Accountability System

A plan without an accountability mechanism is just a wish with better formatting. Each plan must include:

**Monthly review ritual:**
- A specific date (e.g., the 1st of each month, or the Sunday after payday)
- A checklist: Did the automatic transfer execute? What is the current balance? Am I on pace for the next milestone?
- Time requirement: 15 minutes maximum. If it takes longer, the tracking system is too complex.

**Automatic transfer setup:**
- Strongly recommend automating contributions on payday, not at the end of the month. Money that passes through checking is mentally spent. Money transferred on payday is invisible to the spending brain.
- Suggest separate, named savings accounts for each goal. Most banks and credit unions allow free sub-accounts. Naming an account "House Down Payment" has documented psychological reinforcement effects.

**Adjustment triggers:**
- Define in advance what will change if income drops by more than 15%: which goal gets paused first, which is non-negotiable
- Define what happens with windfalls (tax refund, bonus, gift): what percentage goes to goals vs. discretionary spending. A common framework is 50% to the highest-priority goal, 50% to discretionary -- prevents both all-or-nothing decisions
- Define a "pause clause": if a genuine emergency hits, contributions to discretionary goals can pause for up to 90 days without the plan being considered failed. Resuming after 90 days is the expectation.

**Progress visibility:**
- A simple progress bar (even hand-drawn) on a physical calendar or whiteboard maintains motivation better than a spreadsheet buried in a folder
- Suggest reviewing progress relative to the milestone chart, not just the end goal -- "I'm 45% of the way to my emergency fund" is more motivating than "I've saved $7,000 of $15,600"

---

### Step 7: Deliver the Goal Plan and Confirm Feasibility

Before presenting the final plan:
- Confirm every assumption with the user: "I've assumed your monthly take-home is $4,800 and your surplus is $600 -- is that correct?"
- Check that the total monthly contribution fits within the surplus with at least a 10% buffer for unexpected expenses. A surplus of $600 should not be entirely committed to goals; $540 maximum as a general guideline.
- Ensure the first action item is specific enough to complete today or this week (opening an account, setting up a transfer, noting a calendar reminder)
- Present the plan as a starting point, not a contract. Financial circumstances change. The plan is designed to be revised.

---

## Output Format

```
## Financial Goal Plan

**Prepared based on:**
- Monthly take-home income: $[X]
- Monthly expenses: $[X]
- Available monthly surplus: $[X]
- Date prepared: [Month Year]
- Note any assumptions made

---

### Goals Overview

| Priority | Goal Name                        | Target      | Current Savings | Remaining   | Deadline      | Monthly Needed |
|----------|----------------------------------|-------------|-----------------|-------------|---------------|----------------|
| 1        | [e.g., Emergency Fund]           | $[amount]   | $[amount]       | $[amount]   | [Month Year]  | $[amount]      |
| 2        | [e.g., House Down Payment]       | $[amount]   | $[amount]       | $[amount]   | [Month Year]  | $[amount]      |
| 3        | [e.g., Vacation Fund]            | $[amount]   | $[amount]       | $[amount]   | [Month Year]  | $[amount]      |

---

### Goal Details

#### Goal 1: [Goal Name] -- Priority 1

| Field                        | Detail                                      |
|------------------------------|---------------------------------------------|
| Original aspiration          | "[User's exact words]"                      |
| SMART goal statement         | [Full specific, measurable, time-bound goal]|
| Target amount                | $[amount]                                   |
| Current savings allocated    | $[amount]                                   |
| Remaining to save            | $[amount]                                   |
| Deadline                     | [Month Year] ([X] months from today)        |
| Monthly contribution         | $[amount]                                   |
| Funding approach             | [Parallel / Sequential -- explain which]    |
| Why this matters (anchor)    | [User's stated motivation]                  |

**Goal Math Check:**
- $[remaining] ÷ [months] = $[monthly] per month required
- Feasibility: [Fits within surplus / Requires adjustment -- explain]

**Milestones:**

| Milestone Name              | Target Amount | Target Date  | Action / Review                              |
|-----------------------------|---------------|--------------|----------------------------------------------|
| First win                   | $[amount]     | [Date]       | [Specific action, e.g., open dedicated acct] |
| 25% reached                 | $[amount]     | [Date]       | [Review: is timeline still correct?]         |
| Halfway                     | $[amount]     | [Date]       | [Revisit goal relevance, celebrate]          |
| 75% reached                 | $[amount]     | [Date]       | [Confirm final push strategy]                |
| Goal complete               | $[amount]     | [Date]       | [Redirect funds / celebrate / set next goal] |

**Milestone reward:** [User-defined non-financial reward at halfway and completion]

---

#### Goal 2: [Goal Name] -- Priority 2

[Same structure as Goal 1]

---

#### Goal 3: [Goal Name] -- Priority 3

[Same structure as Goal 1, including notation if sequential: "Funding begins after Goal 1 is complete in [Month Year]"]

---

### Funding Plan

| Goal                    | Monthly Contribution | Funding Mode          | Starts        | Ends / Redirects        |
|-------------------------|---------------------|-----------------------|---------------|-------------------------|
| [Goal 1]                | $[amount]           | Parallel              | Immediately   | [Month Year]            |
| [Goal 2]                | $[amount]           | Parallel              | Immediately   | [Month Year]            |
| [Goal 3]                | $[amount]           | Sequential            | [Month Year]  | [Month Year]            |
| **Total committed**     | **$[amount]**       |                       |               |                         |
| Available surplus       | $[amount]           |                       |               |                         |
| Uncommitted buffer      | $[amount]           | (Target: ~10% of surplus minimum) |  |                  |
| Feasibility assessment  | [Feasible / Needs adjustment -- explain briefly] |  |  |                |

**Funding flow note:** [Describe what changes when a goal completes -- where do those dollars go next]

---

### Accountability Plan

**Monthly review:**
- Review date: [Specific day of month, e.g., 1st Sunday of each month]
- Review checklist: Confirm transfer executed | Check balance vs. milestone pace | Note any income/expense changes
- Time budget: 15 minutes

**Automation setup:**
- Transfer $[amount] to [Goal 1 account name] on [payday date] each month
- Transfer $[amount] to [Goal 2 account name] on [payday date] each month
- Recommended: Name each savings account by goal (e.g., "Emergency Fund -- 6 Months")

**Adjustment rules:**
- If income drops by 15% or more: [Specify which goal pauses first, which is protected]
- If unexpected expense hits: [Specify whether to pause contributions or use the goal savings]
- If a windfall arrives (bonus, tax refund, gift): Apply [50%] to [highest-priority goal], [50%] to [discretionary or other goals]
- Pause clause: Contributions may pause for up to 90 days during genuine hardship without restarting the plan from scratch. Resume after 90 days is the expectation.

**Progress visibility:**
- Track on: [Preferred method: app, spreadsheet, physical chart, bank sub-account balances]
- Report metric: Percentage of current milestone reached (not just raw dollar amount)

---

### Plan Assumptions
- Monthly surplus figure is approximate and based on user-provided income/expense estimates
- Calculations use simple division (no interest growth assumption) -- any interest earned adds a buffer
- Goal targets use standard benchmarks where user did not specify (note which ones)
- This plan should be reviewed when: income changes, a major expense changes, a goal is reached, or 12 months have elapsed

---

### Next Steps (Complete in Order)

- [ ] [Today] Confirm surplus figure is accurate -- review last month's bank statement
- [ ] [This week] Open a dedicated savings account for [Goal 1] -- name it "[Goal Name]"
- [ ] [This week] Set up automatic transfer of $[amount] on [payday date] to [Goal 1 account]
- [ ] [If applicable] Open a second dedicated account for [Goal 2]
- [ ] [If applicable] Set up automatic transfer of $[amount] to [Goal 2 account]
- [ ] [This month] Schedule first monthly review on [specific date]
- [ ] [This month] Note first milestone target: $[amount] by [date] -- mark on calendar
- [ ] [Optional] Tell one person about your plan (social accountability is a strong motivator)
```

---

## Rules

1. **Always present the disclaimer before providing any financial guidance.** Financial goal-setting crosses into financial planning territory, and individual circumstances (tax situation, employment type, family obligations) can change the correct answer significantly.

2. **Never assume a starting balance of zero without asking.** Many users have money already allocated -- they just have not labeled it. A user with $3,000 in checking might have $1,500 already functioning as an ad hoc emergency fund. Surface this before calculating "remaining" amounts.

3. **Never let the total monthly goal contributions equal 100% of the stated surplus.** Always maintain a minimum 10% uncommitted buffer. A $600 surplus should have no more than $540 committed to goals. Life produces unexpected expenses; a plan with zero buffer will be abandoned after the first $200 car repair.

4. **The emergency fund is functionally prerequisite to other savings goals in nearly all cases.** The only valid exception is capturing an employer 401(k) match, which represents an immediate 50--100% return that no savings rate can beat. Capture the match first (up to the match limit only), then build the emergency fund, then fund other goals.

5. **High-interest debt changes the prioritization math.** Credit card debt at 20--29% APR is a guaranteed negative return at that rate. Saving $200/month at 4.5% APY while carrying $5,000 at 24% APR is mathematically poor. Flag this tradeoff explicitly if the user discloses high-interest debt balances. Do not make the debt payoff decision for them, but make the math visible.

6. **Never set a goal timeline that requires more than 80% of the stated surplus toward a single goal.** This leaves the user with no room to fund other priorities and creates the psychological experience of having no spending freedom, which leads to plan abandonment.

7. **Convert every aspiration into a specific dollar amount before any other SMART work proceeds.** A goal without a number is not a goal -- it is a preference. "I want to retire comfortably" cannot generate a monthly savings figure. "I want to accumulate $800,000 by age 60" can. Use benchmarks when the user does not have a number: the 4% rule for retirement, 3--6 months of expenses for emergency funds, 10--20% of home purchase price for down payments.

8. **Show goal math explicitly, in writing, every time.** Never just state a monthly contribution figure without showing the calculation: $[remaining] ÷ [months] = $[monthly]. This allows the user to catch errors, correct assumptions, and understand what changes if any variable shifts.

9. **The first milestone must produce a bank balance the user has never seen before, within 60--90 days.** If a user has never had more than $500 in savings, the first milestone of a 24-month goal should target $1,000--$1,500 -- something achievable and visually different from their baseline. A first milestone that takes 6 months to hit is a motivational failure.

10. **Flag every assumption, label every benchmark, and invite correction at the end of the plan.** The goal plan is built on estimates. If the user's expenses are actually $200 higher than stated, the surplus drops and the plan breaks. Invite the user to revisit the plan when circumstances change, explicitly telling them which variable would cause the biggest impact if it changes (usually: the surplus figure).

---

## Edge Cases

### The User Has No Financial Surplus
This is the most important edge case. When monthly expenses equal or exceed monthly income, goal-setting cannot proceed in standard form.

- Do not dismiss the session. Reframe it: "Before we can set savings goals, we need to find the money to fund them. That means finding either income to increase or expenses to reduce."
- Identify whether the deficit is structural (income genuinely does not cover essential needs) or behavioral (income covers essentials but discretionary spending fills the gap). The resolution path differs.
- For behavioral deficits: identify 2--3 specific expense categories that, if reduced by 20--30%, would generate a meaningful surplus. Even $75/month is enough to start Goal 1.
- For structural deficits: acknowledge that goal-setting must wait for a near-term income change, and help the user identify what income change would be required to make even a minimum plan work.
- Do not set goals funded by zero dollars. A goal plan that shows $0/month contributions is not a plan.

### The User Has Only One Aspiration
- Apply the full SMART framework with the same rigor as a multi-goal plan.
- Build 4--5 milestones for the single goal.
- Spend more time on the "why it matters" anchor, since a single goal deserves deeper motivation clarity.
- At the end, ask: "Are there any other financial areas you'd want to protect or build while working toward this goal?" -- this often surfaces an emergency fund need or a second priority the user had not articulated.

### The User's Goal Is Financially Unrealistic for Their Income
- Do not dismiss the goal. Reframe it as a math problem with adjustable variables.
- Show the gap explicitly: "Saving $60,000 for a down payment in 3 years on a $350/month surplus requires $1,667/month -- roughly $1,317 more than your current surplus."
- Then offer the adjustment menu: (1) Extend to 14 years at current savings rate; (2) Reduce target to $12,600 for 3 years; (3) Identify whether income can increase to generate the required surplus; (4) Reconsider whether homeownership is the right goal at this income level right now.
- Deliver options neutrally. Do not recommend which lever to pull -- that is the user's decision.

### The User Has Competing Goals That Exceed Their Surplus
- Make the conflict arithmetic visible before offering any solution: "Goal 1 requires $400/month, Goal 2 requires $350/month, Goal 3 requires $200/month. Total: $950/month. Your surplus is $600. Gap: $350/month."
- Then present three resolution strategies with tradeoffs:
  - **Sequential funding:** Fund Goal 1 fully, then Goal 2, then Goal 3. Fastest completion on each individual goal, but Goals 2 and 3 are delayed the longest.
  - **Weighted parallel funding:** Allocate surplus in proportion to priority. Goal 1 gets 50%, Goal 2 gets 30%, Goal 3 gets 20% of available surplus. All goals progress simultaneously but slowly.
  - **Drop the lowest-priority goal:** Temporarily remove Goal 3 from the plan until Goal 1 is complete, then re-add it.
- Ask the user which approach fits their psychological style -- some people need to see multiple things moving; others need to close goals out completely before starting new ones.

### The User Mentions a Fixed-Deadline Life Event
Some goals have immovable deadlines -- a lease ending in 8 months, a child starting college in 4 years, a wedding planned for next spring.

- Treat fixed-deadline goals as constraints, not variables. The monthly contribution is not negotiable; the question is whether the surplus supports it.
- Calculate the fixed-deadline goal first, before any other goals. The monthly contribution is locked.
- Whatever surplus remains after the fixed-deadline goal contribution is the available pool for all other goals.
- If the fixed-deadline goal contribution consumes more than 70% of the surplus, flag this as high financial stress and suggest reducing other spending categories (defer to `budget-planning` skill for that work).

### The User Has Already Achieved Their Stated Goals
- Congratulate the accomplishment genuinely, then immediately reframe the session as a "next level" planning exercise.
- Ask: "Now that [goal] is funded, where do those monthly dollars go next?" -- unaddressed surplus is the fastest path to lifestyle inflation undoing the savings discipline they built.
- Common next-level goals: increasing retirement savings rate toward the 15% of gross income benchmark, building a taxable investment account, saving for a larger life event, or accelerating mortgage payoff.
- For users who feel "done" with financial goals, introduce the concept of an annual savings rate check: what percentage of gross income is currently being saved? The benchmark range for long-term financial health is 15--20% of gross including employer contributions. If they are below this, there is room to grow.

### The User Asks About a Goal That Requires Professional Planning (College, Retirement, Major Medical)
- Provide the SMART framework and the basic math, but prominently flag that these goal categories involve tax-advantaged accounts, legal structures, and long-horizon investment math that goes beyond this skill.
- For college savings: note that 529 plans offer tax-advantaged growth and that the College Board's annual "Trends in College Pricing" report provides current cost benchmarks -- but specific 529 plan selection and contribution strategy require professional guidance.
- For retirement: note the 4% withdrawal rule as a rough benchmark for nest egg sizing, and the 15% gross income savings rate benchmark for accumulation -- but sequence-of-returns risk, Social Security timing, and tax-bracket management in retirement require professional guidance.
- Do not refuse to engage with these goals -- provide the SMART framework and the math. Just label the limits clearly.

---

## Example

**Input:** "I want to save more money, maybe buy a house someday, and I should probably have an emergency fund. I make $5,200/month take-home and spend about $4,400. I have about $800 in savings right now and no high-interest debt. I'm not sure what I'm doing financially and just want to get started."

**Processing notes (internal):**
- Monthly surplus: $5,200 -- $4,400 = $800
- 10% buffer rule: Commit no more than $720/month to goals ($800 × 0.90)
- Existing savings: $800 -- allocate to emergency fund starter
- High-interest debt: None disclosed -- no reordering required
- Employer match: Not mentioned -- flag as a follow-up question at the end
- Three aspirations: emergency fund (foundation), general savings habit (behavioral), house down payment (long-horizon specific)

**Output:**

---

## Financial Goal Plan

**Prepared based on:**
- Monthly take-home income: $5,200
- Monthly expenses: ~$4,400 (user estimate)
- Available monthly surplus: $800
- Existing savings: $800 (being allocated to Goal 1)
- Date prepared: June 2025
- **Assumptions:** Expense figure is approximate. No high-interest debt. Calculations use simple division without interest growth -- any interest earned adds a buffer.

---

### Goals Overview

| Priority | Goal Name                          | Target    | Current Savings | Remaining | Deadline        | Monthly Needed |
|----------|------------------------------------|-----------|-----------------|-----------|-----------------|----------------|
| 1        | Emergency Fund (6 months)          | $16,800   | $800            | $16,000   | June 2027       | $667 / month   |
| 2        | House Down Payment (10% on $320K)  | $32,000   | $0              | $32,000   | March 2030      | $800 / month*  |
| 3        | General Savings Habit              | Ongoing   | --              | --        | Starts now      | $133 / month   |

*Goal 2 funding at $800/month begins after Goal 1 completes in June 2027 (33 months away). During Goal 1 phase, $133/month goes to Goal 3 (general savings habit). The $667 redirects to Goal 2 when Goal 1 is done.

---

### Goal Details

#### Goal 1: Emergency Fund (6 Months of Expenses) -- Priority 1

| Field                        | Detail                                                                 |
|------------------------------|------------------------------------------------------------------------|
| Original aspiration          | "I should probably have an emergency fund"                             |
| SMART goal statement         | Accumulate $16,800 (6 × $2,800 estimated monthly essentials) in a dedicated, liquid savings account by June 2027 |
| Target amount                | $16,800                                                                |
| Current savings allocated    | $800                                                                   |
| Remaining to save            | $16,000                                                                |
| Deadline                     | June 2027 (24 months from today)                                       |
| Monthly contribution         | $667 per month                                                         |
| Funding approach             | Priority 1 -- funded first, in parallel with a smaller Goal 3 contribution |
| Why this matters (anchor)    | Financial foundation -- prevents debt creation when life surprises hit, protecting all other goals |

**Goal Math Check:**
- $16,000 ÷ 24 months = $667 / month required
- Feasibility: $667 fits within $720 committed budget (surplus $800 × 90%). Tight but workable. Remaining $133 goes to Goal 3.

**Milestones:**

| Milestone Name                    | Target Amount | Target Date   | Action / Review                                                    |
|-----------------------------------|---------------|---------------|--------------------------------------------------------------------|
| First win -- starter fund         | $1,800        | August 2025   | Open dedicated savings account named "Emergency Fund." Deposit existing $800 + 1 month of contributions. |
| One month of expenses covered     | $2,800        | October 2025  | Confirm automatic transfer is running. Celebrate with a specific low-cost reward. |
| Three months of expenses covered  | $8,400        | July 2026     | Halfway review: Are expenses still ~$2,800? Adjust target if needed. |
| Five months covered               | $14,000       | March 2027    | Final push. Confirm no change to employment or income situation.    |
| Six months fully funded           | $16,800       | June 2027     | Goal complete. Redirect $667 immediately to down payment account.  |

**Milestone reward:** User to define -- suggested: a dinner out at the "first month covered" milestone, a weekend day trip at the halfway point.

---

#### Goal 2: House Down Payment (10% on $320,000 Home) -- Priority 2

| Field                        | Detail                                                                  |
|------------------------------|-------------------------------------------------------------------------|
| Original aspiration          | "Maybe buy a house someday"                                             |
| SMART goal statement         | Accumulate $32,000 (10% down payment on a $320,000 home) in a dedicated savings account by approximately March 2030 |
| Target amount                | $32,000                                                                 |
| Current savings allocated    | $0 (starts after Goal 1 is complete)                                   |
| Remaining to save            | $32,000                                                                 |
| Deadline                     | March 2030 (~57 months from today; 33 months of full funding after June 2027) |
| Monthly contribution         | $133 during Goal 1 phase (June 2025 -- June 2027); $800 after Goal 1 completes |
| Funding approach             | Sequential -- small parallel contribution now builds habit; full funding starts June 2027 |
| Why this matters (anchor)    | Housing stability and long-term asset ownership                         |

**Goal Math Check:**
- Phase 1 (24 months × $133): $3,192 accumulated by June 2027
- Phase 2 remaining: $32,000 -- $3,192 = $28,808
- Phase 2 months needed: $28,808 ÷ $800 = ~36 months → March 2030
- Total timeline from today: ~57 months (June 2025 to March 2030)
- Feasibility: After Goal 1 completes, $800/month exactly matches the available surplus at 100%. **Flag:** This leaves zero discretionary buffer in Phase 2. Recommend revisiting expenses at that point to maintain a $80/month uncommitted buffer, or accepting a 2-month timeline extension.

**Note on down payment size:** 10% down avoids the need for a jumbo down payment but will typically require private mortgage insurance (PMI) on a conventional loan. PMI commonly runs 0.5--1.0% of the loan amount annually -- on a $288,000 loan, that is roughly $120--$240/month in additional carrying cost. A user may wish to target 20% down ($64,000) to avoid PMI, which would extend the timeline significantly. Present this tradeoff; the decision belongs to the user.

**Milestones:**

| Milestone Name                       | Target Amount | Target Date   | Action / Review                                        |
|--------------------------------------|---------------|---------------|--------------------------------------------------------|
| First contribution habit formed      | $400          | August 2025   | Open "House Fund" savings account. Automate $133/month.|
| Phase 1 complete -- full funding begins | $3,192     | June 2027     | Redirect $667 from emergency fund to down payment. Total now $800/month. |
| 25% of total target                  | $8,000        | February 2028 | Review home prices in target area. Adjust target if needed. |
| Halfway                              | $16,000       | October 2028  | Consult with a mortgage professional to understand current loan qualification requirements. |
| 75% of total target                  | $24,000       | June 2029     | Begin researching home purchase process: credit score, pre-approval, local market. |
| Goal complete                        | $32,000       | March 2030    | Begin pre-approval process. Celebrate the years of discipline.  |

**Milestone reward:** User to define -- suggested: a special dinner at Phase 1 completion; a meaningful experience (weekend trip, etc.) at the halfway point.

---

#### Goal 3: General Savings Habit (Behavioral Foundation) -- Priority 3

| Field                        | Detail                                                                   |
|------------------------------|--------------------------------------------------------------------------|
| Original aspiration          | "I want to save more money"                                              |
| SMART goal statement         | Transfer a minimum of $133/month to a savings account every single month for 12 consecutive months, starting June 2025, to establish an automatic savings habit before addressing larger goals |
| Target amount                | Behavioral (consistency), with $1,596 accumulated in 12 months as a secondary metric |
| Current savings allocated    | $0 separate from emergency fund                                          |
| Deadline                     | June 2026 (12-month habit lock-in period)                                |
| Monthly contribution         | $133 (the portion not committed to emergency fund)                       |
| Funding approach             | Parallel with Goal 1 from the start                                      |
| Why this matters (anchor)    | Builds the savings reflex and demonstrates the plan is working; these funds are later folded into the down payment |

**Note:** After month 12, the "general savings" goal is considered behaviorally established. The accumulated funds ($1,596 approximate) roll into the down payment fund. This goal is about building the habit, not accumulating a separate pool.

---

### Funding Plan

| Goal                          | Monthly Amount | Funding Mode    | Starts      | Ends / Redirects                            |
|-------------------------------|---------------|-----------------|-------------|---------------------------------------------|
| Emergency Fund                | $667          | Priority 1      | June 2025   | June 2027 → redirect to Down Payment        |
| General Savings Habit         | $133          | Parallel        | June 2025   | June 2026 → balance rolls to Down Payment   |
| House Down Payment (Phase 1)  | $133          | Small parallel  | June 2025   | June 2027 → increases to $800               |
| House Down Payment (Phase 2)  | $800          | Sequential      | June 2027   | March 2030                                  |
| **Total committed (Phase 1)** | **$800**      |                 |             |                                             |
| Available surplus             | $800          |                 |             |                                             |
| Uncommitted buffer            | $0 (Phase 1 is tight) | -- Flag: no buffer in current plan |  |               |
| Feasibility assessment        | **Feasible, but tight.** The 10% buffer rule is not met in Phase 1. Recommend identifying one $60--$80/month discretionary expense to reduce, creating a buffer. If this is not possible, consider reducing Goal 3 to $75/month and emergency fund to $625/month, creating a $100 buffer.     |

**Funding flow summary:**
- Months 1--12 (June 2025 -- June 2026): $667 to emergency fund + $133 to general savings
- Months 13--24 (July 2026 -- June 2027): $667 to emergency fund + $133 directly to down payment fund (habit established)
- Month 25 onward (July 2027 -- March 2030): $800 to down payment fund until $32,000 is reached

---

### Accountability Plan

**Monthly review:**
- Review date: First Sunday of each month, after payday
- Review checklist: (1) Did both transfers execute? (2) What is current balance in each account? (3) Am I ahead of, behind, or on pace for the current milestone? (4) Any income or expense changes to flag?
- Time budget: 15 minutes maximum

**Automation setup:**
- Transfer $667 to account named "Emergency Fund -- 6 Months" on payday each month
- Transfer $133 to account named "House Fund" on payday each month
- Recommended: Use a different bank or sub-account from primary checking so balances are not tempting to spend

**Adjustment rules:**
- If income drops by 15% or more: Maintain emergency fund contribution at a reduced rate (minimum $300/month); pause House Fund contributions entirely until income stabilizes
- If unexpected expense hits and it is less than $500: Use the uncommitted buffer first; do not dip into goal savings
- If unexpected expense exceeds the buffer: Use emergency fund only if the expense is a genuine emergency (job loss, medical, essential car repair). A vacation deal or electronics purchase does not qualify.
- If a windfall arrives (tax refund, bonus, gift): 50% to emergency fund until fully funded; 50% to discretionary spending or experience. Once emergency fund is complete, redirect 50% to down payment fund.
- Pause clause: If a genuine hardship requires pausing contributions, resume within 90 days. The plan does not restart -- resume from where you left off.

**Progress visibility:**
- Recommended tracking method: Bank sub-account named by goal (visual balance serves as progress bar)
- Secondary method: A single sticky note on the refrigerator showing current balance vs. next milestone amount -- updated monthly
- Report metric during monthly review: Percentage of current milestone reached (e.g., "I'm at 34% of the 'one month covered' milestone")

---

### Plan Assumptions
- Monthly expenses of $4,400 are user-estimated; actual surplus may differ
- Emergency fund target of $16,800 uses $2,800 as estimated monthly essentials (total expenses ÷ 1.57 to isolate non-discretionary portion -- adjust if actual essentials differ)
- Down payment target of $32,000 uses 10% of $320,000 -- a benchmark only; actual home price and required down payment will vary by market and loan type
- Calculations use simple division; interest earned in savings accounts is treated as a buffer, not a planning input
- No employer 401(k) match situation was disclosed -- **follow-up question:** Do you have access to an employer retirement match? If yes, capturing that match should be added to this plan as Priority 0 before the emergency fund, up to the match limit.
- This plan should be reviewed when: a job or income change occurs, monthly expenses shift by more than $200, a goal milestone is reached, or 12 months elapse from today

---

### Next Steps (Complete in Order)

- [ ] **Today** -- Confirm the $800 monthly surplus figure by reviewing last month's bank statement; adjust if needed
- [ ] **This week** -- Open a dedicated savings account for the emergency fund; name it "Emergency Fund -- 6 Months"; deposit your existing $800 to start it
- [ ] **This week** -- Open a second savings account; name it "House Fund"
- [ ] **This week** -- Set up an automatic transfer of $667 to "Emergency Fund -- 6 Months" on your next payday
- [ ] **This week** -- Set up an automatic transfer of $133 to "House Fund" on your next payday
- [ ] **This month** -- Schedule a recurring first-Sunday-of-month calendar reminder for your 15-minute monthly review
- [ ] **This month** -- Note the first milestone on your calendar: $1,800 in Emergency Fund by August 2025
- [ ] **Follow up** -- Answer the employer 401(k) match question; if a match is available, add it to this plan as an immediate priority before any other contributions

---

*This plan is a starting point, not a fixed commitment. The math works at today's numbers. When your income, expenses, or goals change -- and they will -- revisit this plan and update the variables. A revised plan that reflects your real life is always more valuable than a perfect plan you have abandoned.*
