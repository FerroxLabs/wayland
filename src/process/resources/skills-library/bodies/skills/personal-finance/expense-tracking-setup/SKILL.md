---
name: expense-tracking-setup
description: |
  Designs a personal expense tracking system with categories, tracking method, review cadence, and weekly reconciliation routine. Produces a complete tracking template the user can implement immediately with their own spending data.
  Use when the user asks about tracking expenses, categorizing spending, setting up a spending log, or creating an expense tracking system.
  Do NOT use for creating a full budget (use budget-planning), business expense reporting, or investment tracking.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "budgeting personal-finance expenses planning"
  category: "personal-finance"
  subcategory: "budgeting"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---
# Expense Tracking Setup

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making significant financial decisions.

## When to Use

**Use this skill when:**
- The user has no current system for tracking where their money goes and wants to build one from scratch
- The user tracks expenses inconsistently (random receipts, mental accounting, occasional spreadsheet entries) and wants a structured, repeatable system
- The user wants to categorize spending for the first time and needs help deciding which categories to use
- The user asks specifically how to build a spending log, expense journal, or transaction ledger
- The user wants to understand their actual spending patterns before attempting to build a budget -- tracking comes first
- The user needs a weekly reconciliation routine to cross-check bank statements against their manual log
- The user is starting fresh after a life change (new income, new city, new household) and wants a system tailored to current circumstances

**Do NOT use when:**
- The user wants to allocate income to categories with target spending limits and savings goals -- that is budget construction, use `budget-planning`
- The user already has transaction data for 2+ months and wants to analyze patterns, trends, or anomalies -- use `spending-analysis`
- The user needs to track business expenses, mileage, or reimbursable costs for an employer or self-employment -- use a business expense skill
- The user wants to track investment accounts, portfolio performance, or net worth changes -- use an investing or net worth tracking skill
- The user wants to specifically audit and cancel recurring subscriptions -- use `subscription-audit`
- The user needs help with cash flow management, bill payment scheduling, or managing income timing -- those are distinct workflows

## Process

### Step 1: Gather Tracking Context (Ask These Specific Questions)

Collect the following before designing anything. These answers drive every downstream decision.

- **What is the user's goal for tracking?** Visibility only (understanding where money goes) versus active control (stopping overspending in specific areas)? This determines whether you include category ceilings or not.
- **What spending scope?** All personal spending, household-only (shared with a partner), or discretionary-only (excluding fixed bills like rent and loan payments)?
- **Current method, if any:** Do they currently do anything -- even informally? What broke down? Knowing the failure mode prevents repeating it.
- **Entry frequency tolerance:** Daily, every 2-3 days, or weekly batch processing? Be realistic -- most beginners overestimate their commitment. Default to weekly batch unless they specifically commit to daily.
- **Format preference:** Spreadsheet (columns, formulas, sorting) versus paper/printed template (tactile, offline, no tech required) versus hybrid (paper during the day, transfer to spreadsheet weekly)?
- **Household setup:** Solo tracking, or shared with a partner who also spends? Shared tracking requires split-expense handling.
- **Income range (approximate, monthly take-home):** Needed to set percentage-based sanity thresholds for categories, not to prescribe how they should spend.
- **Known problem spending areas:** Where do they feel the most friction or guilt? These become the categories that get the most granularity and, if the user wants control, the tightest review frequency.

If the user provides minimal context, default to: all personal spending, weekly batch entry, spreadsheet format, solo tracking, visibility goal.

### Step 2: Design the Category Architecture

Category design is the highest-leverage decision in the system. Too few categories and the log is useless for analysis. Too many and the user abandons it within two weeks.

**The 8-12 Category Rule:**
- 8 categories minimum for meaningful pattern detection
- 12 categories is the practical limit for a beginner maintaining the system alone
- 15 categories absolute maximum for experienced trackers with distinct high-volume spending areas
- Anything beyond 15 requires a hierarchical system (parent categories with sub-categories), which is a different complexity level

**The Core Five -- categories that almost everyone should have:**
1. **Housing** -- rent or mortgage, renters/homeowners insurance, HOA fees, any storage units. Fixed and easy to log.
2. **Food: Groceries** -- supermarket, warehouse club, specialty grocery, farmers market. Separate from dining because the cost-per-meal ratio is dramatically different and conflating them hides behavior.
3. **Food: Dining & Takeout** -- restaurants, takeout, delivery fees, coffee shops. Separated from groceries intentionally -- this is the single category most people underestimate by 40-60%.
4. **Transportation** -- gas, parking, tolls, transit passes, rideshare, vehicle maintenance, registration. One category unless the user drives extensively for a hobby (then split fuel from maintenance).
5. **Utilities & Subscriptions** -- electric, gas, water, internet, phone bill, plus all recurring digital subscriptions (streaming, software, memberships). Combine unless the user suspects subscription creep is a problem, in which case split into Utilities and Subscriptions as separate categories.

**The Variable Six -- add based on the user's actual life:**
- **Health & Medical** -- copays, prescriptions, dental, vision, gym membership, therapy. Add if any of these represent non-trivial spending.
- **Personal Care** -- haircuts, toiletries, cosmetics, nail care. Add if monthly spend likely exceeds $40.
- **Clothing & Apparel** -- clothing, shoes, accessories. Add if not seasonal-only for the user.
- **Entertainment & Recreation** -- concerts, events, hobbies, games, sporting activities. Add if the user has active social or hobby spending.
- **Gifts & Occasions** -- birthdays, holidays, weddings, charitable giving. Often overlooked and then causes budget shock in Q4.
- **Pets** -- food, vet, grooming, boarding. Add immediately if the user has pets -- this category is notoriously underestimated.

**The Two Mandatory Extras:**
- **Savings Transfers** -- any transfer to a savings account, emergency fund, or retirement account. Tracking this makes savings visible as an expense, not a leftover.
- **Miscellaneous** -- catch-all with a strict rule: any item in this category for more than 30 days without recategorization gets a dedicated category or gets assigned to an existing one.

**Category Granularity Decision Framework:**
If a category exceeds 15% of total monthly spending, it should probably be split. If a category consistently shows under $20/month, collapse it into the closest parent category.

**Assigning Short Codes:**
Use 3-letter codes derived from the category name. They speed up manual entry dramatically and reduce the cognitive load of logging. Make codes phonetically obvious so they are recalled without consulting a legend.

### Step 3: Select and Configure the Tracking Method

Each method has a specific failure mode. Match the method to the user's behavior pattern, not their aspiration.

**Spreadsheet Method -- best for analytical users who sit at a computer regularly:**
- Column structure: Date | Vendor/Description | Amount | Category Code | Payment Method | Notes
- Add a 7th column for "Reimbursable?" (Y/N) if the user ever has expenses that get paid back by a partner, employer, or insurance
- Use a separate sheet/tab for the weekly summary and another for the monthly summary -- do not cram everything onto one sheet
- Formula logic for the daily log: category totals using SUMIF against the category code column, running month-to-date totals, and a simple year-to-date row
- Sort the daily log by date descending so the most recent entry is always at the top -- this reduces friction for adding new entries
- Color-code category rows by family (food categories in one color, transport-related in another) to catch miscategorizations at a glance

**Paper Log Method -- best for users who spend primarily with cash, prefer tactile logging, or have screen fatigue:**
- Use a dedicated small notebook (not a random notebook that also has grocery lists and work notes -- dedicated tracking gets maintained longer)
- Daily page layout: date header, ruled lines with four columns (Time, What, $Amount, Code), and a daily total box at the bottom
- Use a weekly summary page at the end of each 7-day block with category totals
- Paper logs work best when the user carries the notebook physically -- "log at point of purchase" eliminates the memory problem
- Print a category legend card to keep in the notebook so codes are always accessible

**Receipt Capture + Batch Entry Method -- best for users who cannot or will not log in real time:**
- Designate a single physical location (a small tray, envelope, or phone photo album) for all receipts
- Set one recurring weekly session (20-30 minutes, same day and time each week -- Sunday evening is most common) to process the entire week's receipts
- Digital receipts: create a dedicated email folder or label for financial receipts and forward all email confirmations there before the batch session
- Bank statement cross-check: pull the past 7 days of bank/credit card transactions during the session and compare against collected receipts to catch anything missed
- This method has the highest coverage risk -- cash purchases without receipts disappear entirely unless the user keeps a simple daily cash note

**Payment Method Tracking -- why it matters:**
Tracking payment method (cash, debit, credit card, bank transfer) serves two functions. First, it enables reconciliation -- total credit card entries should approximately match the credit card statement. Second, it reveals spending behavior patterns. Research consistently shows people spend 12-18% more on average when using credit versus cash or debit because the friction of payment is lower.

### Step 4: Build the Actual Tracking Artifact

Produce the complete, ready-to-use template the user can start populating today. Do not leave placeholder fields the user has to design themselves -- they asked you to build this.

**For the daily log:**
- Pre-populate the category code legend directly in the template
- Include 2-3 sample entries showing exactly what a fully logged row looks like
- Leave at least 30 rows in the daily section if building for a full month -- underestimating space causes people to abandon the template mid-month
- Include a "Week Total" row after every 7 rows for built-in weekly subtotaling

**For the weekly summary:**
- One row per active category
- Columns: Category | This Week | Month-to-Date | Monthly Ceiling (if using ceilings) | Remaining (if using ceilings) | % of Weekly Total
- The "% of Weekly Total" column is a diagnostic tool -- it reveals concentration of spending in a category at a glance

**For the monthly summary:**
- One row per active category
- Columns: Category | Month Total | % of Take-Home Income | vs. Prior Month | vs. 3-Month Average
- "vs. Prior Month" starts as N/A for the first month and populates after month two
- "vs. 3-Month Average" is the most useful analytical column -- it smooths seasonal and irregular spending and reveals true trends

### Step 5: Design the Review Routine

The review cadence is what converts a tracking template into a functional financial system. Without scheduled reviews, logged data becomes archaeological instead of actionable.

**Daily Review (2-3 minutes) -- the logging habit:**
- Log all transactions from the current day before going to sleep, or immediately after each purchase for users who prefer point-of-sale logging
- The only question to answer: did anything happen today with money? If yes, log it. If no, write "no transactions" in the date row (this active acknowledgment maintains the habit better than skipping blank days)
- Check that cash on hand roughly matches expected cash (starting cash minus logged cash purchases)

**Weekly Review (15-20 minutes) -- the reconciliation session:**
- Trigger: same day every week. Sunday evening is most common and most effective because it closes the week and previews the coming week's obligations
- Pull the past 7 days of bank and credit card transaction histories
- Match every bank/card transaction against logged entries -- any transaction without a matching log entry gets logged now with "Reconciled" in the Notes column
- Recategorize any Miscellaneous entries from the week
- Calculate weekly category totals and update the Month-to-Date column
- If using category ceilings: flag any category that has consumed more than 70% of its ceiling before month-end -- this is the "yellow zone" threshold. At 90% consumed, the category is in the "red zone" requiring an active spending decision.
- Answer one question before closing: "Was there anything this week that surprised me?" Write it in a notes section. Surprises are where the most useful behavioral insights emerge.

**Monthly Review (30-45 minutes) -- the learning session:**
- Trigger: the 1st or 2nd of each new month, reviewing the prior month
- Total all categories
- Calculate each category as a percentage of monthly take-home income
- Compare to prior month (after month two) and flag any category that changed by more than $50 or 20%, whichever is smaller
- Identify the top 3 spending categories -- these are where any meaningful change in financial outcomes will come from
- Review the Miscellaneous category: any item sitting in Miscellaneous for a full month either gets a new permanent category added to the system or gets reassigned to an existing one. Never carry Miscellaneous items forward uncategorized.
- Check the Savings Transfers category to confirm transfers actually happened
- Adjust category ceilings if reality has diverged from estimates for two consecutive months -- ceilings based on outdated data are worse than no ceilings

### Step 6: Configure Spending Alerts and Behavioral Controls

These elements transform passive tracking into active financial awareness.

**The 70/90 Threshold System for Category Ceilings:**
- 70% of ceiling consumed -- yellow zone: awareness only, no action required but the user should note it during the weekly review
- 90% of ceiling consumed -- red zone: before spending more in this category, the user explicitly decides whether to stay under the ceiling, transfer budget from another category, or exceed the ceiling with a documented reason
- 100% ceiling reached -- hard stop review: the user records the excess and its cause in the monthly notes. This is data, not failure -- ceilings are calibration tools.

**Impulse Spending Threshold:**
- Ask the user to define a dollar amount above which any unplanned single purchase triggers a 24-48 hour waiting period
- Common thresholds: $30 for users trying to build savings aggressively; $50 for moderate control; $100 for users who primarily want visibility
- The rule applies only to discretionary, unplanned purchases -- not bills, groceries, or pre-planned expenses
- After the waiting period, if the user still wants the item, they buy it without guilt. The point is not denial -- it is converting impulse into intention.

**Top Impulse Category Watch:**
- After the first month of tracking, the user will have data on their two or three highest-variability categories -- categories where spending fluctuates most month-to-month
- These categories get reviewed at every weekly session, not just monthly
- The goal is to move them from unconscious to conscious spending, not necessarily to reduce them

**Cash Reconciliation Check:**
For any user with significant cash spending, include a weekly cash tracking box:
- Starting cash on hand (record Monday morning)
- Cash purchases logged during the week (total from the log)
- Cash remaining (count at end of Sunday)
- Unaccounted cash = Starting - Logged Purchases - Remaining
- If unaccounted cash exceeds $10/week consistently, the user has a tracking gap to investigate

### Step 7: Deliver the First-Month Calibration Plan

A tracking system built on estimated ceilings is only a hypothesis. The first 30 days of actual data are calibration, not performance. Set this expectation explicitly.

**Calibration Phase guidance:**
- Month 1 ceilings are starting estimates, not commitments. Exceeding them reveals reality, not failure.
- At the end of Month 1, the user has their first actual baseline -- the most important dataset they will ever have for personal finance.
- Adjust all ceilings after Month 1 to reflect actual spending unless the user specifically wants to reduce a category (in which case, set the ceiling 10-15% below Month 1 actuals as a realistic reduction target, not a dramatic cut).
- Do not attempt to reduce more than two categories simultaneously during the calibration period -- too many behavioral changes at once causes system abandonment.

## Output Format

```
## Expense Tracking System

### Configuration Summary
- **Scope:** [All personal / Household / Discretionary only]
- **Tracking method:** [Spreadsheet / Paper log / Batch receipt capture]
- **Entry frequency:** [Daily / Every 2-3 days / Weekly batch]
- **Review cadence:** Daily (2-3 min) | Weekly on [day] (15-20 min) | Monthly on the [1st/2nd] (30-45 min)
- **Goal:** [Visibility only / Active spending control]
- **Household:** [Solo / Shared with partner -- split tracking included]
- **Monthly take-home income:** $[amount] (used for percentage calculations only)

---

### Category Structure

| Code | Category             | Monthly Ceiling | Scope Notes                                          |
|------|----------------------|-----------------|------------------------------------------------------|
| HSG  | Housing              | $X,XXX          | Rent/mortgage, renters insurance, storage, HOA       |
| GRO  | Groceries            | $XXX            | Supermarket, warehouse club, farmers market          |
| DIN  | Dining & Takeout     | $XXX            | Restaurants, takeout, delivery, coffee shops         |
| TRN  | Transportation       | $XXX            | Gas, parking, tolls, transit, rideshare, maintenance |
| UTL  | Utilities            | $XXX            | Electric, gas, water, internet, phone bill           |
| SUB  | Subscriptions        | $XXX            | Streaming, software, digital memberships             |
| HLT  | Health & Medical     | $XXX            | Copays, prescriptions, gym, therapy                  |
| PER  | Personal Care        | $XXX            | Haircuts, toiletries, cosmetics                      |
| CLO  | Clothing             | $XXX            | Apparel, shoes, accessories                          |
| ENT  | Entertainment        | $XXX            | Events, hobbies, games, activities                   |
| GFT  | Gifts & Occasions    | $XXX            | Birthdays, holidays, charitable giving               |
| SAV  | Savings Transfers    | $XXX            | All savings account and retirement contributions     |
| MSC  | Miscellaneous        | $XXX            | Catch-all -- review and recategorize by month-end    |

*Calibration note: These ceilings are starting estimates. After 30 days of actual tracking, reset all ceilings to reflect real spending.*

---

### Daily Expense Log -- [Month Year]

| Date  | Vendor / Description | Amount   | Code | Payment Method | Notes              |
|-------|----------------------|----------|------|----------------|--------------------|
| MM/DD | [Sample: Coffee]     | $X.XX    | DIN  | Debit card     |                    |
| MM/DD | [Sample: Grocery run]| $XXX.XX  | GRO  | Credit card    |                    |
| MM/DD |                      |          |      |                |                    |
| MM/DD |                      |          |      |                |                    |
| MM/DD |                      |          |      |                |                    |
| MM/DD |                      |          |      |                |                    |
| MM/DD |                      |          |      |                |                    |
| **Week 1 Total** |             | **$X,XXX** |    |                |                    |
| MM/DD |                      |          |      |                |                    |
[...repeat for weeks 2-4...]

---

### Weekly Summary -- Week of [Date]

| Category          | This Week | Month-to-Date | Ceiling | Remaining | % of Week Total | Status  |
|-------------------|-----------|---------------|---------|-----------|-----------------|---------|
| Housing           | $X,XXX    | $X,XXX        | $X,XXX  | $XX       | XX%             | ✓ Green |
| Groceries         | $XXX      | $XXX          | $XXX    | $XXX      | XX%             | ✓ Green |
| Dining & Takeout  | $XXX      | $XXX          | $XXX    | $XX       | XX%             | ⚠ Yellow|
| Transportation    | $XXX      | $XXX          | $XXX    | $XXX      | XX%             | ✓ Green |
| Utilities         | $XXX      | $XXX          | $XXX    | $XXX      | XX%             | ✓ Green |
| Subscriptions     | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| Health & Medical  | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| Personal Care     | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| Clothing          | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| Entertainment     | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| Gifts & Occasions | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| Savings Transfers | $XXX      | $XXX          | $XXX    | $X        | XX%             | ✓ Green |
| Miscellaneous     | $XX       | $XX           | $XXX    | $XXX      | XX%             | ✓ Green |
| **WEEK TOTAL**    | **$X,XXX**|               |         |           | 100%            |         |

Status key: ✓ Green = under 70% | ⚠ Yellow = 70-89% consumed | 🔴 Red = 90%+ consumed

---

### Monthly Summary -- [Month Year]

| Category          | Month Total | % of Income | vs. Prior Month | vs. 3-Month Avg | Notes             |
|-------------------|-------------|-------------|-----------------|-----------------|-------------------|
| Housing           | $X,XXX      | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Groceries         | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Dining & Takeout  | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Transportation    | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Utilities         | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Subscriptions     | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Health & Medical  | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Personal Care     | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Clothing          | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Entertainment     | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Gifts & Occasions | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Savings Transfers | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   |                   |
| Miscellaneous     | $XXX        | XX%         | N/A (Month 1)   | N/A (Month 1)   | Recategorize all  |
| **MONTH TOTAL**   | **$X,XXX**  | **XX%**     |                 |                 |                   |

Top 3 spending categories this month: (1) [Category] (2) [Category] (3) [Category]
Biggest surprise: [note here during monthly review]
Ceiling adjustments for next month: [note here]

---

### Weekly Cash Reconciliation (If Applicable)

| Week  | Starting Cash | Cash Purchases Logged | Cash Remaining | Unaccounted |
|-------|--------------|----------------------|----------------|-------------|
| Week 1| $XXX         | $XXX                 | $XXX           | $XX         |
| Week 2| $XXX         | $XXX                 | $XXX           | $XX         |
| Week 3| $XXX         | $XXX                 | $XXX           | $XX         |
| Week 4| $XXX         | $XXX                 | $XXX           | $XX         |

*Target: Unaccounted cash under $10/week. Persistent gaps above $10 indicate a tracking gap to investigate.*

---

### Review Checklist

**Daily (2-3 minutes -- before bed)**
- [ ] Log all transactions from today
- [ ] If no transactions: write "no transactions" in the date row
- [ ] Count cash on hand -- does it roughly match starting cash minus logged cash purchases?

**Weekly on [DAY] (15-20 minutes)**
- [ ] Pull 7-day bank and credit card transaction history
- [ ] Match every bank/card transaction to a log entry -- add any missed entries (mark "Reconciled" in Notes)
- [ ] Recategorize all Miscellaneous entries from the week
- [ ] Update Month-to-Date totals for all categories
- [ ] Check category status (Green / Yellow / Red) and note any Yellow or Red categories
- [ ] Answer: "What surprised me this week?" -- write it down
- [ ] Complete cash reconciliation box if applicable

**Monthly on the [1st or 2nd] (30-45 minutes)**
- [ ] Total all categories for the prior month
- [ ] Calculate each category as % of take-home income
- [ ] Identify the top 3 spending categories
- [ ] Compare to prior month (Month 2+) -- flag changes over $50 or 20%
- [ ] Recategorize everything remaining in Miscellaneous
- [ ] Verify Savings Transfers category matches actual transfers made
- [ ] Adjust ceilings if actual spending diverged from estimates for 2+ consecutive months
- [ ] Write one sentence describing what the month revealed about your spending

---

### Impulse Spending Controls

- **Cooling-off threshold:** $[user-defined] -- any unplanned discretionary purchase above this amount requires a 24-hour wait before buying
- **High-variability categories to review every week:** [Category 1], [Category 2]
- **First-month rule:** Exceed a ceiling? Log the reason. This is calibration data, not failure.

---

### Month 1 Calibration Reminders

- These ceilings are hypotheses, not rules. The first 30 days reveal your actual baseline.
- After Month 1, reset all ceilings to actual spending (or 10-15% below actual for categories you want to reduce).
- Do not attempt to change behavior in more than 2 categories during Month 1 -- the priority is completing the month with consistent tracking.
- The most important output of Month 1: a complete, honest picture of where your money actually goes.
```

## Rules

1. Always display the disclaimer before providing any financial content or templates.

2. NEVER prescribe specific dollar amounts for category ceilings -- all amounts must come from the user's stated spending, their estimates, or their existing budget. If the user provides zero data, use percentage ranges (e.g., "a common range for groceries in single-person households is 8-12% of take-home income") and instruct them to fill in real amounts after Month 1.

3. Cap category count at 12 for beginners (defined as users who have never maintained a tracking system for more than one month). Cap at 15 for experienced trackers. Never exceed 15 categories in a flat structure -- beyond that, implement parent/sub-category hierarchy which is a different complexity level.

4. Every daily log template must contain these five columns at minimum: Date, Vendor/Description, Amount, Category Code, Payment Method. The Payment Method column is not optional -- it enables reconciliation and reveals spending-mode behavioral patterns.

5. Always separate Groceries and Dining Out into two distinct categories. Combining them is the single most common design error in personal expense tracking because it masks one of the highest-variability and highest-impact spending behaviors.

6. Always include a Savings Transfers category. Treating savings as an expense category makes it visible and accountable rather than an afterthought. If the user has no current savings habit, include it with a $0 ceiling as a placeholder and note it is ready to activate.

7. Always include a Miscellaneous catch-all category and always pair it with an explicit monthly recategorization rule. A Miscellaneous category without a recategorization instruction becomes a permanent dumping ground that obscures spending patterns.

8. Never include more than one weekly review session in the routine -- multiple sessions per week cause abandonment. The weekly session should be one defined block (15-20 minutes), not distributed across multiple days.

9. Always provide the Month 1 calibration framing explicitly. First-month tracking is a data-gathering exercise, not a performance evaluation. Failing to set this expectation causes users to quit when they exceed a ceiling rather than recording the data and learning from it.

10. If the user has a partner or household member who shares expenses, always add a Split/Shared column to the daily log and instruct the user to track the full purchase amount alongside their individual share. Tracking only the split amount creates an incomplete picture of household spending and makes reconciliation against bank statements impossible.

11. Do not recommend specific software applications by name. Describe the format and functionality (e.g., "a spreadsheet with SUMIF formulas" not a specific product name). The principles apply to any tool the user chooses.

12. When the user mentions a specific spending pain point (overspending on food, not knowing where cash goes, etc.), that category gets a more granular treatment in the system -- more specific scope notes, weekly instead of monthly review, and the first slot in the Impulse Spending Controls section.

## Edge Cases

**User has never tracked expenses and feels overwhelmed:**
Start with a reduced system: 8 categories maximum (Housing, Food-Groceries, Food-Dining, Transportation, Utilities, Health, Savings, Miscellaneous), daily logging for the first two weeks only to build the habit, and a simplified daily log with only four columns (Date, What, Amount, Category -- omit payment method until Month 2). Explicitly tell them this is a "Month 1 Only" version and they will expand it once the habit is established. The habit of logging matters more than the sophistication of the system in the first 30 days.

**Shared household with a partner who does not want to participate:**
The non-participating partner makes shared tracking impossible for expenses they control. Solution: track only the user's own spending plus their defined share of shared expenses (e.g., 50% of grocery and utility bills). Add a "Shared Contribution" category to capture the user's portion of joint costs and note it separately from individually controlled spending. The user cannot account for the partner's discretionary spending and should not attempt to.

**User has primarily cash-based spending (market vendors, tipping, small transactions):**
The standard bank-reconciliation method will not work because cash transactions leave no digital trail. Solution: provide a physical cash envelope method -- the user starts each week with a budgeted cash amount, records all cash expenditures in a pocket notepad at the point of purchase, and reconciles the notebook against remaining cash each Sunday. Unaccounted cash above $10/week is flagged for investigation. Digital spending can still be reconciled against bank statements. The two systems run in parallel and merge at the weekly review.

**Highly irregular income (freelancers, commission-based, gig workers):**
Standard monthly ceilings based on a fixed income figure do not work. Solution: track income as a separate log alongside expenses, using the same category and date structure. Replace fixed dollar ceilings with percentage-of-income ceilings (e.g., Dining is capped at 8% of that month's income, not a fixed dollar amount). Calculate ceilings at the start of each month based on actual income from the prior month. Include a "Lean Month Protocol" note: a reduced-ceiling version of the same categories that activates automatically if income falls below a defined threshold.

**User has already tried expense tracking multiple times and quit:**
Identify the failure mode before designing the system. Common failure modes and fixes: (1) Too many categories -- reduce to 8. (2) Daily logging felt like a chore -- switch to weekly batch. (3) Missed a few days and felt behind -- explicitly build in a "catch-up" reconciliation step at each weekly session so a few missed days never mean starting over. (4) Did not know what to do with the data -- add explicit review questions to the monthly session ("What surprised me? What would I change?"). Design the system to be restart-proof: missing a week should never require starting over, only catching up.

**User wants to track but explicitly does not want category ceilings:**
Omit all ceiling columns entirely. The system becomes a pure visibility tool. Replace the status column (Green/Yellow/Red) with a "% of Total" column showing what fraction of total monthly spending each category represents. Monthly review focuses on category ranking and month-over-month changes rather than ceiling adherence. Note that this is a valid and complete use of the system -- ceilings are one feature, not the definition of the system. The user can add ceilings any time they want after building a 2-3 month baseline.

**User is preparing to significantly change their financial situation (moving cities, starting a new job, going from dual to single income):**
Do not use prior spending data to set ceilings -- it is from a different financial context and will create false expectations. Instead, build the system with placeholder ceilings and an explicit note that Month 1 is entirely calibration. Add a "New Baseline" flag column to the monthly summary for the first 3 months. During the monthly review, the question is not "did I stay under the ceiling?" but "what is normal for my new situation?" Ceilings are calibrated progressively: set tentative ceilings after Month 1, refine after Month 2, treat Month 3 as the first real performance measure.

**User wants to track both personal and side business expenses using one system:**
Do not combine them. Separate ledgers are mandatory because (a) business expenses may be tax-deductible and require clean documentation, (b) combining them makes both datasets unreliable, and (c) business expense tracking has workflow requirements (receipts, purpose notes, client association) that differ from personal tracking. Build the personal tracking system as requested. Note that business expenses need a separate system and refer to business expense tracking guidance. If some expenses are genuinely mixed-use (home office, cell phone, vehicle), note those categories specifically and leave a split-percentage field for the user to fill in.

## Example

**Input:** "I want to start tracking my spending. I've tried it before and gave up after a few weeks. I make about $4,200 a month after taxes. I use a spreadsheet. I think my biggest problem is food -- I spend a ton on restaurants but I'm not sure how much. I use my credit card for almost everything, maybe $40-50 in cash per week."

**System design notes:** User has prior failed attempt -- identify and fix the failure mode. Primary pain point is food/dining -- split groceries and dining into prominent separate categories, apply tightest review and lowest impulse threshold there. Credit card dominant -- bank reconciliation is viable. Small but consistent cash use -- include weekly cash reconciliation. Request to build in restart-proofness.

**Output:**

## Expense Tracking System

### Configuration Summary
- **Scope:** All personal spending
- **Tracking method:** Spreadsheet
- **Entry frequency:** Weekly batch -- every Sunday evening (20-25 minutes, pulling 7 days of credit card transactions)
- **Review cadence:** Weekly on Sunday (20 min) | Monthly on the 1st (35 min)
- **Goal:** Visibility plus identifying the dining spending problem specifically
- **Household:** Solo
- **Monthly take-home income:** $4,200

*Previous attempt notes: System is designed to be restart-proof. Missing a week never means starting over -- the Sunday session catches up any gap using credit card history. No more than 10 categories to keep it sustainable.*

---

### Category Structure

| Code | Category          | Month 1 Ceiling | Scope Notes                                               |
|------|-------------------|-----------------|-----------------------------------------------------------|
| HSG  | Housing           | $1,300          | Rent, renters insurance -- confirm exact amount           |
| GRO  | Groceries         | $350            | Supermarket, warehouse club -- NOT restaurants or delivery|
| DIN  | Dining & Takeout  | $300            | Restaurants, takeout apps, delivery fees, coffee shops    |
| TRN  | Transportation    | $200            | Gas, parking, transit -- adjust if you drive rarely       |
| UTL  | Utilities & Subs  | $250            | Electric, internet, phone, all streaming and app subs     |
| HLT  | Health            | $150            | Copays, prescriptions, gym membership                     |
| PER  | Personal Care     | $80             | Haircuts, toiletries, pharmacy items                      |
| ENT  | Entertainment     | $100            | Events, hobbies, activities                               |
| SAV  | Savings Transfers | $300            | Any transfer to savings or retirement -- track as expense |
| MSC  | Miscellaneous     | $150            | Catch-all -- recategorize everything by month-end         |

*Month 1 ceilings are estimates based on common spending patterns for your income level. Every ceiling gets reset after 30 days of real data. Do not treat these as rules -- treat them as guesses you are testing.*

*The DIN ceiling of $300 is intentionally set as a starting hypothesis for the category you flagged. After Month 1, you will know the real number.*

---

### Daily Expense Log -- [Month Year]

| Date  | Vendor / Description       | Amount   | Code | Payment Method | Notes                    |
|-------|----------------------------|----------|------|----------------|--------------------------|
| 05/01 | Whole Foods                | $87.43   | GRO  | Credit card    |                          |
| 05/01 | Uber Eats -- Thai delivery | $38.50   | DIN  | Credit card    | Includes $5 delivery fee |
| 05/02 | Monthly gym membership     | $35.00   | HLT  | Credit card    | Auto-charge               |
| 05/02 | Coffee shop -- latte       | $6.75    | DIN  | Credit card    |                          |
| 05/03 | Cash -- weekend market     | $22.00   | GRO  | Cash           |                          |
| 05/03 | Cash -- parking            | $12.00   | TRN  | Cash           |                          |
| 05/04 |                            |          |      |                |                          |
| 05/05 |                            |          |      |                |                          |
| 05/06 |                            |          |      |                |                          |
| 05/07 |                            |          |      |                |                          |
| **Week 1 Total** |                  | **$XXX** |      |                |                          |
| 05/08 |                            |          |      |                |                          |
[...continue for 31 days, with Week 2/3/4 Total rows...]

*Spreadsheet tip: In the Amount column, use a SUMIF formula in your weekly and monthly summary tabs referencing the Code column. Sort the daily log by Date descending so your most recent entry is always at the top.*

---

### Weekly Summary -- Week of [Date]

| Category          | This Week | Month-to-Date | Ceiling | Remaining | % of Week | Status   |
|-------------------|-----------|---------------|---------|-----------|-----------|----------|
| Housing           | $0        | $1,300        | $1,300  | $0        | 0%        | ✓ Green  |
| Groceries         | $109      | $109          | $350    | $241      | XX%       | ✓ Green  |
| Dining & Takeout  | $45       | $45           | $300    | $255      | XX%       | ✓ Green  |
| Transportation    | $12       | $12           | $200    | $188      | XX%       | ✓ Green  |
| Utilities & Subs  | $35       | $35           | $250    | $215      | XX%       | ✓ Green  |
| Health            | $35       | $35           | $150    | $115      | XX%       | ✓ Green  |
| Personal Care     | $0        | $0            | $80     | $80       | 0%        | ✓ Green  |
| Entertainment     | $0        | $0            | $100    | $100      | 0%        | ✓ Green  |
| Savings Transfers | $0        | $0            | $300    | $300      | 0%        | Pending  |
| Miscellaneous     | $0        | $0            | $150    | $150      | 0%        | ✓ Green  |
| **WEEK TOTAL**    | **$236**  |               |         |           | 100%      |          |

Status key: ✓ Green = under 70% of ceiling consumed | ⚠ Yellow = 70-89% consumed | 🔴 Red = 90%+ consumed

*Sunday reconciliation check: Pull last 7 days of credit card transactions. Every charge on the statement should match a row in the log. Any transaction without a match gets added now with "Reconciled" in Notes.*

---

### Weekly Cash Reconciliation

| Week  | Starting Cash | Cash Purchases Logged | Cash Remaining | Unaccounted |
|-------|--------------|----------------------|----------------|-------------|
| Week 1| $50          | $34 ($22 GRO + $12 TRN)| $16           | $0          |
| Week 2| $50          |                      |                |             |
| Week 3| $50          |                      |                |             |
| Week 4| $50          |                      |                |             |

*If unaccounted cash exceeds $10 in any week, look for a cash purchase you did not log. Common gaps: tips, vending machines, splitting a bill with cash.*

---

### Monthly Summary -- [Month Year]

| Category          | Month Total | % of Income | vs. Prior Month | vs. 3-Month Avg | Notes                   |
|-------------------|-------------|-------------|-----------------|-----------------|-------------------------|
| Housing           | $1,300      | 31.0%       | N/A (Month 1)   | N/A             |                         |
| Groceries         | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Dining & Takeout  | $XXX        | XX%         | N/A (Month 1)   | N/A             | KEY category -- note total|
| Transportation    | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Utilities & Subs  | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Health            | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Personal Care     | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Entertainment     | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Savings Transfers | $XXX        | XX%         | N/A (Month 1)   | N/A             |                         |
| Miscellaneous     | $XXX        | XX%         | N/A (Month 1)   | N/A             | Recategorize all items  |
| **MONTH TOTAL**   | **$X,XXX**  | **XX%**     |                 |                 |                         |

**After completing Month 1, answer these three questions:**
1. What was the actual Dining & Takeout total? Is it more or less than you expected?
2. What category surprised you most?
3. What is the total of all categories combined? How does it compare to your $4,200 income?

*Month 1 ceiling reset instructions: For any category where actual spending differed from the ceiling by more than 20%, update the ceiling to match actual spending. If you want to reduce Dining & Takeout, set the new ceiling 15% below actual (not 50% -- dramatic cuts fail). Change only one or two ceilings at a time.*

---

### Review Schedule

**Weekly on Sunday (20-25 minutes):**
- [ ] Open credit card transaction history for past 7 days
- [ ] Match each transaction to a log entry -- add any missing entries (mark "Reconciled" in Notes)
- [ ] Log any cash transactions from the week using the cash reconciliation box
- [ ] Update Month-to-Date totals in the weekly summary tab
- [ ] Check DIN (Dining & Takeout) status -- this is your focus category
- [ ] Note anything that surprised you this week (one sentence)

*Restart rule: If you missed last week's Sunday session, do not start over. Open the past 14 days of credit card history and catch up in this session. It takes 5-10 extra minutes. Missing never means starting over.*

**Monthly on the 1st (35 minutes):**
- [ ] Total all categories for prior month
- [ ] Calculate % of income for each category
- [ ] Find the actual Dining & Takeout total -- write it prominently
- [ ] Recategorize all Miscellaneous items
- [ ] Verify Savings Transfers match actual bank transfers
- [ ] Reset ceilings based on actual data
- [ ] Write one sentence: "This month I learned that I spend _____ on _____."

---

### Impulse Spending Controls

- **Cooling-off threshold:** $40 -- any unplanned discretionary purchase above $40 (meals, clothing, entertainment, etc.) waits 24 hours before buying. Pre-planned purchases (groceries on your regular grocery day, a dinner you planned in advance) do not trigger the waiting period.
- **High-priority review categories:** Dining & Takeout (check every Sunday, not just monthly)
- **Food decision rule:** Before opening a delivery app, check whether DIN is currently in Green, Yellow, or Red status. This is not a prohibition -- it is a 10-second awareness check.
- **Month 1 rule:** Exceed a ceiling? Log it, note the reason, and move on. This month is about seeing reality, not performing against a target.
