---
name: project-budget-tracker
description: |
  Creates a project budget tracking structure with cost categories, actuals-versus-budget comparison format, variance threshold rules, and escalation criteria. Produces the tracker template for personal or small-team projects, not financial advice.
  Use when the user asks about tracking project expenses, creating a project budget, monitoring spending against a plan, or building a cost tracking system for a project.
  Do NOT use for personal household budgeting (use personal-finance budgeting skills), business financial modeling (use business finance skills), or investment tracking (use personal-finance investing skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "project-management template analysis"
  category: "productivity"
  subcategory: "project-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Project Budget Tracker

## When to Use

**Use this skill when:**
- A user is running a defined project -- home renovation, product launch, event, website build, software feature, or similar -- and needs a structured system to track spending against a plan
- A user asks how to build a project budget spreadsheet, Notion database, or tracking template from scratch
- A user wants to compare actual expenditures against planned amounts across multiple cost categories in real time
- A user needs formal variance thresholds, a RAG (Red-Amber-Green) status system, and escalation rules to catch overruns before they become critical
- A user has a project already underway with informal or no tracking and wants to establish control over remaining spend
- A user needs to report budget status to a sponsor, client, or stakeholder and needs a clean, defensible format
- A user wants to conduct a post-project budget retrospective to improve future estimates

**Do NOT use when:**
- The user wants to track personal household income, bills, savings, or discretionary spending -- use a personal-finance budgeting skill instead
- The user needs a full financial model with revenue projections, P&L forecasts, or multi-year capex planning -- use a business finance modeling skill
- The user wants to track an investment portfolio, asset allocation, or brokerage account -- use a personal-finance investing skill
- The user needs a full project kickoff document including scope, RACI, timeline, and risk register -- use `project-kickoff` and then return here for the budget section
- The user's primary concern is scope creep, change requests, or requirement drift rather than cost tracking -- use `scope-creep-management`; budget impact may be a secondary output
- The user needs payroll management, contractor invoicing, or accounts payable for an ongoing business -- this is project budget tracking, not operational accounting
- The user is asking for tax advice, depreciation schedules, or capitalization rules -- refer them to a qualified accountant

---

## Process

### Step 1: Gather Project Budget Inputs

Before producing anything, collect the critical inputs. If the user provides a lump sum without detail, ask specifically for each element below -- do not guess at category breakdowns.

- **Total approved budget:** The hard ceiling authorized for the project. Distinguish between the total budget (including contingency) and the "working budget" available for planned spending. These are different numbers.
- **Project timeline:** Specific start and end dates or phases (e.g., Week 1-4, Q3, Sprint 1-3). This determines whether to track by week, month, or milestone.
- **Cost categories:** Ask the user to name 4-8 natural spending buckets. Common ones include: labor/contractor fees, materials/supplies, software/tools/licenses, equipment purchase or rental, travel and logistics, marketing/creative, permits/legal/compliance, and professional services.
- **Cost type per category:** Whether each cost is one-time (single purchase), milestone-triggered (paid when a deliverable is complete), or recurring (monthly SaaS subscription, weekly contractor invoice). This determines the payment schedule column.
- **Known committed costs:** Any contracts already signed or deposits already paid. These are "locked" costs and should be marked separately from estimates.
- **Contingency reserve target:** If the user has not specified one, recommend 10% for well-scoped projects with low uncertainty, 15% for moderately uncertain projects, and 20% for novel or highly variable projects. Never allow zero contingency -- the question is only how much.
- **Reporting audience:** Is this tracker purely personal, shared with a team, or presented to a sponsor/client? This affects the level of formality in escalation language and the end-of-project summary format.

---

### Step 2: Establish the Budget Allocation Structure

With inputs gathered, construct the budget allocation -- the plan against which actuals will be measured. This step defines the baseline and must be completed before any tracking columns are added.

- Limit categories to 5-8 maximum. Fewer than 5 collapses important distinctions (e.g., labor and materials behave very differently when overruns occur). More than 8 creates tracking noise and makes the summary table unwieldy.
- Assign a budgeted dollar amount to each category. The sum of all categories plus the contingency reserve must equal the total approved budget exactly. If the user's category estimates fall short or exceed the total, flag the gap and ask how to resolve it -- do not silently pad or trim.
- Compute each category's percentage of the working budget (not of the total including contingency). This reveals allocation imbalances. Labor above 60% of working budget in a short timeline is a risk flag. Contingency below 8% of total is underfunded for most projects.
- For each category, record the expected payment timing in one of three forms: (a) a specific week or month, (b) a milestone name (e.g., "on contractor sign-off"), or (c) a spread pattern (e.g., "evenly across months 1-3"). Payment timing enables cash flow awareness -- a project can be on budget but out of cash at a specific moment.
- Mark known committed costs with a "C" flag in the allocation table. Committed costs are no longer variable -- if they cause an overrun, the response is to cut elsewhere, not to renegotiate what is already signed.
- If the user's category estimates are rough guesses, note the confidence level (high/medium/low) per category. Low-confidence estimates should carry a higher internal variance tolerance before triggering escalation.

---

### Step 3: Design the Actuals-vs-Budget Tracking Table

The tracking table is the operational core of the system. It must be structured to answer three questions at a glance: How much have we spent? Are we on track? Where is the risk?

- For each category, include exactly these columns: Category | Budgeted | Committed-Not-Yet-Paid | Actual Paid to Date | Total Exposure | Remaining Budget | Variance ($) | Variance (%) | Status.
- **Total Exposure** = Committed-Not-Yet-Paid + Actual Paid to Date. This is the number that matters for risk assessment, not just actuals. A project that has paid $500 but committed $3,000 more is not "only $500 spent."
- **Remaining Budget** = Budgeted -- Total Exposure (not Budgeted -- Actual Paid). Using paid-only understates true remaining risk.
- **Variance ($)** = Total Exposure -- Budgeted. Use the sign convention that positive variance = over budget (unfavorable). This is the project management convention, not the accounting convention where favorable variances are positive. State the convention explicitly in the tracker.
- **Variance (%)** = (Total Exposure -- Budgeted) / Budgeted × 100. Round to one decimal place.
- Include a row-level Status (Green/Amber/Red) derived from the variance percentage thresholds defined in Step 4.
- The Total row at the bottom must sum categories only -- the Contingency row is tracked separately and must never be included in the variance calculation for individual categories.

---

### Step 4: Set Variance Thresholds and the RAG Status System

Thresholds must be concrete percentages tied to explicit actions. Thresholds without actions are meaningless.

- **GREEN -- Within +5% over or any amount under budget:** No action required. Document briefly in the weekly update. Under-budget status (negative variance) is good news but warrants a note if it exceeds 10% under -- sometimes it means work has not yet occurred rather than genuine savings.
- **AMBER -- 5% to 15% over budget:** Mandatory written root cause (one sentence minimum). Identify whether the overrun is due to a scope addition, a bad original estimate, a price change, or a procurement error. Each cause has a different corrective action. Scope addition requires a change control decision. Bad estimate may require re-baselining other categories. Price change may require alternative sourcing. Procurement error requires process correction.
- **RED -- Over 15% above budget:** Freeze uncommitted discretionary spending in the affected category immediately. Determine whether to draw from contingency, cut scope, or reallocate from an under-budget category. Escalate to any stakeholder or sponsor per the escalation protocol. Do not continue accumulating costs in a RED category without a documented decision.
- **CRITICAL -- Overall project Variance (%) exceeds 10% with contingency exhausted or nearly exhausted:** This is a project-level escalation event, not just a category event. The project is structurally over budget. Options are limited to: additional funding authorization, scope reduction, or project termination. Present all three options explicitly.
- Apply thresholds to both category-level variance and total project variance independently. A project can be GREEN overall but have a RED individual category that represents a structural risk.
- Dollar-equivalent thresholds are also useful for small projects. For a $2,000 budget, a 15% threshold is $300 -- meaningful. For an $80,000 budget, 5% is $4,000 -- also meaningful. Compute and display both.

---

### Step 5: Build the Expense Log

The expense log is the raw data layer. The tracking table is a summary derived from it. Both are required -- the summary without the log is unauditable.

- Each row in the expense log represents one transaction: a purchase, invoice payment, deposit, or cash outlay.
- Required fields: Date | Category | Vendor/Payee | Description | Invoice or Receipt Reference | Amount | Payment Method | Committed or Paid | Running Total (cumulative across all categories) | Notes.
- The "Committed or Paid" flag distinguishes between an obligation (purchase order raised, contract signed, deposit paid) and a completed payment. This feeds the "Committed-Not-Yet-Paid" column in the tracking table.
- Receipt Reference should be a simple sequential number (EXP-001, EXP-002) that corresponds to a physical or digital receipt. This makes reconciliation fast and the tracker auditable.
- Running Total is the cumulative sum of all Paid entries (not committed) across all categories combined. This is the project's total cash outflow to date and is the number to compare against the project's available cash.
- Log entries should be made within 48 hours of a transaction occurring. Delayed logging leads to reconstruction errors, forgotten small purchases (which accumulate surprisingly), and incorrect status at review time.

---

### Step 6: Define the Tracking Cadence and Review Protocol

A budget tracker with no update schedule is a one-time document, not a management tool.

- For projects with a duration of 4 weeks or less, update weekly -- every Friday is a strong default. Purchases can compound quickly in short timelines.
- For projects of 1-3 months, update biweekly. Weekly updates become burdensome without enough new data to justify the time.
- For projects of 3 months or more, update monthly but include a milestone-triggered review whenever a major phase completes (e.g., when contractor finishes framing, when the website goes to staging).
- Each update session should follow a fixed sequence: (1) Post all new expense log entries since the last update. (2) Recalculate the tracking table totals. (3) Check each category's status color. (4) If any AMBER or RED categories exist, document root cause and action. (5) Check contingency reserve remaining percentage. (6) Write a two-sentence budget narrative summarizing overall status and any action items.
- The budget narrative is mandatory even when everything is GREEN. "Week 2 update: Budget is on track with $4,200 of $7,000 working budget spent or committed. Materials came in $180 under estimate -- savings being held in reserve pending final fixture selection." This creates a paper trail that explains why the final numbers look the way they do.

---

### Step 7: Produce the Complete Budget Tracking System

Assemble all components into the final output. The sequence of sections must always be: Budget Overview → Budget Allocation Table → Spending Tracker → Variance Thresholds → Escalation Protocol → Expense Log → Budget Narrative (update log) → End-of-Project Summary.

- Pre-populate all budgeted amounts with zeros in the Actual and Committed columns. The tracker is initialized at project start -- do not leave those cells blank, which can be confused with "not applicable."
- If the user has already incurred expenses, enter them into the expense log first, then carry totals forward into the tracking table. Never enter actuals directly into the tracking table -- always log them in the expense log first.
- Include a "Tracker Version" and "Last Updated" field in the header. When the budget baseline changes (scope addition, approved change order), increment the version (v1.0 → v1.1) and note the change. Budget baselines should not be edited silently -- changes must be visible.
- State the currency once in the header and never repeat it in every cell (use numbers only in table cells to reduce visual noise).
- Include the sign convention note: "Positive variance = over budget. Negative variance = under budget."

---

## Output Format

```
## Project Budget Tracker: [Project Name]
**Version:** v1.0 | **Last Updated:** [Date] | **Currency:** [USD/GBP/etc.]
**Sign Convention:** Positive variance = over budget (unfavorable). Negative variance = under budget (favorable).

---

### Budget Overview
| Field | Value |
|---|---|
| Total Approved Budget | $[amount] |
| Contingency Reserve | $[amount] ([X]% of total) |
| Working Budget (available for categories) | $[amount] |
| Total Committed to Date | $[amount] |
| Total Paid to Date | $[amount] |
| Total Exposure (committed + paid) | $[amount] |
| Remaining Working Budget | $[amount] |
| Contingency Remaining | $[amount] ([X]% of original reserve) |
| Project Duration | [Start Date] -- [End Date] |
| Tracking Frequency | [Weekly / Biweekly / Monthly] |
| Next Scheduled Review | [Date] |

---

### Budget Allocation (Baseline)
| # | Category | Cost Type | Budgeted ($) | % of Working Budget | Payment Timing | Confidence | Committed? |
|---|----------|----------|-------------|--------------------|----|---|---|
| 1 | [Category] | [One-time/Recurring/Milestone] | [amount] | [X%] | [When] | [High/Med/Low] | [Yes/No] |
| 2 | [Category] | [One-time/Recurring/Milestone] | [amount] | [X%] | [When] | [High/Med/Low] | [Yes/No] |
| 3 | [Category] | [One-time/Recurring/Milestone] | [amount] | [X%] | [When] | [High/Med/Low] | [Yes/No] |
| 4 | [Category] | [One-time/Recurring/Milestone] | [amount] | [X%] | [When] | [High/Med/Low] | [Yes/No] |
| 5 | [Category] | [One-time/Recurring/Milestone] | [amount] | [X%] | [When] | [High/Med/Low] | [Yes/No] |
| -- | **Subtotal (Working Budget)** | | **[sum]** | **100%** | | | |
| -- | Contingency Reserve | As needed | [amount] | n/a | Draw as authorized | -- | -- |
| -- | **TOTAL APPROVED BUDGET** | | **[total]** | | | | |

---

### Spending Tracker -- Current Status
*Positive variance = over budget. Update after every expense log entry.*

| # | Category | Budgeted ($) | Committed Not Paid ($) | Actual Paid ($) | Total Exposure ($) | Remaining ($) | Variance ($) | Variance (%) | Status |
|---|----------|-------------|----------------------|-----------------|-------------------|--------------|-------------|-------------|--------|
| 1 | [Category] | [amt] | 0 | 0 | 0 | [amt] | 0 | 0.0% | GREEN |
| 2 | [Category] | [amt] | 0 | 0 | 0 | [amt] | 0 | 0.0% | GREEN |
| 3 | [Category] | [amt] | 0 | 0 | 0 | [amt] | 0 | 0.0% | GREEN |
| 4 | [Category] | [amt] | 0 | 0 | 0 | [amt] | 0 | 0.0% | GREEN |
| 5 | [Category] | [amt] | 0 | 0 | 0 | [amt] | 0 | 0.0% | GREEN |
| -- | **TOTAL** | **[sum]** | **0** | **0** | **0** | **[sum]** | **0** | **0.0%** | **GREEN** |
| -- | Contingency | [amt] | -- | -- | -- | [amt] | -- | -- | -- |

---

### Variance Thresholds and Required Actions
| Status | Variance Range | Dollar Equivalent (this project) | Required Action |
|--------|---------------|----------------------------------|----------------|
| GREEN | 0% to +5% over OR any amount under | $0 -- $[X] over | Document in weekly narrative. No action required. |
| AMBER | +5% to +15% over budget | $[X] -- $[Y] over | Write root cause (1 sentence). Identify corrective action. Update tracker notes. |
| RED | Over +15% above budget | Over $[Y] | Freeze uncommitted spending in category. Escalate per protocol. Determine contingency draw, scope cut, or reallocation. |
| CRITICAL | Overall project >10% over with contingency <25% remaining | Project-level | Escalate to sponsor/decision-maker. Present three options: additional funding, scope reduction, or project halt. |

---

### Escalation Protocol
1. **Any single purchase above $[threshold -- suggest 10-15% of working budget]:** Obtain at least two price comparisons before committing.
2. **Category enters AMBER:** Document root cause in the expense log Notes field within 24 hours. Identify whether the cause is scope addition, estimate error, price change, or procurement issue. Note the corrective action.
3. **Category enters RED:** Halt uncommitted discretionary purchases in that category. Decide within [X days] whether to draw from contingency, reallocate from an under-budget category, or cut scope. Document the decision.
4. **Contingency reserve falls below 50% of original amount:** Conduct an unscheduled full budget review. Re-assess all remaining uncommitted costs for accuracy. Identify categories where scope reduction is feasible if needed.
5. **Contingency reserve falls below 25% of original amount:** Treat as CRITICAL. No further spending without explicit authorization. Review project completion feasibility.
6. **Project completion within 10% of final milestone:** Conduct final budget reconciliation. Close out all open commitments. Document final variance per category for the end-of-project summary.

---

### Expense Log
*Log every transaction within 48 hours. All actuals must appear here before being reflected in the tracker.*

| Ref # | Date | Category | Vendor/Payee | Description | Committed or Paid | Amount ($) | Payment Method | Running Paid Total ($) | Notes |
|-------|------|----------|-------------|------------|------------------|-----------|----------------|----------------------|-------|
| EXP-001 | | | | | | | | | |
| EXP-002 | | | | | | | | | |

---

### Budget Narrative Log (Weekly/Milestone Updates)
| Update # | Date | Overall Status | Summary | Action Items |
|----------|------|---------------|---------|-------------|
| Update 1 | [Date] | GREEN | [2-sentence summary of status and any notable items] | [Any actions with owner and due date] |

---

### End-of-Project Budget Summary
*Complete at project close. Compare to v1.0 baseline.*

| Category | Original Baseline ($) | Final Actual ($) | Variance ($) | Variance (%) | Root Cause of Significant Variances |
|----------|-----------------------|-----------------|-------------|-------------|--------------------------------------|
| [Category] | [amt] | | | | |
| [Category] | [amt] | | | | |
| [Category] | [amt] | | | | |
| [Category] | [amt] | | | | |
| [Category] | [amt] | | | | |
| **Working Budget Total** | **[sum]** | | | | |
| Contingency Reserve | [amt] | | | | *Amount drawn vs. reserved* |
| **Final Total Project Cost** | **[total]** | | | | |

**Post-Project Notes:**
- Largest single variance: [category] -- [explanation]
- Estimate accuracy assessment: [were categories consistently over or under?]
- Recommendation for future similar projects: [one specific change to estimation approach]
```

---

## Rules

1. **Never omit the Total Exposure column.** Tracking only "Actual Paid" instead of "Committed + Paid" is the single most common cause of budget surprise. A category can look GREEN on paid actuals while being RED on true exposure. Total Exposure is the risk-relevant number.

2. **Categories plus contingency must sum exactly to the total approved budget.** No rounding gaps, no "miscellaneous" that silently absorbs the difference. If the numbers do not reconcile, stop and resolve the discrepancy before proceeding.

3. **Contingency is not a category.** It must appear on a separate row, tracked separately, and never be included in category-level variance calculations. Drawing from contingency is a deliberate management decision -- it should not happen passively through category overruns absorbing from a blended total.

4. **State the sign convention explicitly and use it consistently.** Positive variance = over budget. This is the project management convention and the opposite of the accounting convention. Mixing conventions within a single tracker is a critical error that causes overruns to appear favorable.

5. **Never revise the baseline budget without incrementing the version number and noting the change.** If the scope changes and the budget is re-baselined, the original baseline must be preserved (or at minimum documented). Silent baseline revisions make it impossible to determine whether a project actually stayed within its original authorization.

6. **The expense log is mandatory -- it is not optional detail.** The tracking table is derived from the expense log. Without the log, the tracker cannot be audited, reconciled, or corrected when errors are discovered. A tracker with totals but no supporting log entries is a fiction.

7. **Update frequency must be a specific named date or interval -- never "as needed" or "regularly."** "As needed" universally means "not often enough." Name the day of the week (every Friday) or the calendar date (the 1st of each month) or the trigger event (within 48 hours of each invoice).

8. **Variance thresholds must be pre-computed in dollar terms for this specific project** and displayed alongside the percentage thresholds. Abstract percentages are harder to act on than concrete numbers. "5% AMBER threshold" means nothing to someone staring at a receipt for $340; "$125 AMBER threshold" means something.

9. **If the user is mid-project with no prior tracking, reconstruct the expense log first.** Do not produce a tracker that shows $0 actuals when the user has already spent money. Work backward to reconstruct known expenditures as accurately as possible, flagging reconstructed entries with a note. An inaccurate starting point invalidates all future tracking.

10. **This tracker produces a management tool, not financial advice.** Do not recommend specific vendors, financing products, payment terms as a financial strategy, tax treatment of expenses, or accounting classification of costs. If the user raises questions that touch those areas, produce the tracker and note that those questions fall outside this tool's scope.

---

## Edge Cases

**User has no defined budget ("just want to spend as little as possible"):**
Do not skip the budget definition step -- "no budget" is not a starting condition for a tracker. Instead, build a bottom-up estimate. Ask the user to list every anticipated cost. For each item, apply a "should cost" estimate based on common ranges for that type of work (e.g., professional logo design: $300-$800; 1,000 sq ft carpet installation: $1,500-$3,500). Sum all line items. Add 15% contingency. Present this as the "established baseline budget." Explain that without a baseline, there is no meaningful variance -- a tracker without a plan is just a spending diary. The bottom-up estimate becomes v1.0 of the budget.

**User has already overrun the budget before the tracker is built:**
Acknowledge the overrun explicitly and without euphemism. Document actual spending to date in the expense log as reconstructed entries. Calculate the overrun amount and percentage. Then shift focus: freeze the original budget number for reference but build a "revised completion budget" from current actuals forward. The revised completion budget shows: amount already spent (locked), estimated cost to complete remaining work, total projected final cost, and the gap between projected final cost and original authorization. Present the user with the gap number and the three standard options: identify cost reductions in remaining work, reduce remaining scope, or authorize additional budget.

**User has a mix of currencies (international project or cross-border purchases):**
Choose one "reporting currency" and convert all amounts at the actual exchange rate on the transaction date. Record the original currency amount and the exchange rate used in the Notes field of the expense log. Do not use a single blended rate for all transactions -- exchange rate variance is itself a budget risk that needs to be visible. Flag currency risk explicitly in the Budget Overview section if more than 20% of the budget involves foreign-currency transactions. Do not produce variance analysis in mixed currencies -- it produces meaningless totals.

**Project is time-and-materials with no fixed scope (contractor billing by the hour):**
Add a "Units" tracking layer alongside dollars. For each labor category: Budget Hours | Actual Hours to Date | Remaining Hours | Hourly Rate | Budgeted Cost | Actual Cost | Variance. Hours tracking catches scope creep before it appears in dollar overruns -- a contractor billing $150/hour who is 30 hours over estimate has cost $4,500 extra but may not have invoiced yet. The hours tracker provides an early warning signal that the dollar tracker will lag. Mark T&M categories explicitly in the allocation table and apply a tighter AMBER threshold (3% instead of 5%) due to their open-ended nature.

**User wants to share the tracker with multiple contributors who each track their own spending:**
Add a "Responsible Party" field to both the Budget Allocation table and the Expense Log. Each contributor logs only their own entries. Add a "Submitted By" column to the expense log. Designate one person as the tracker owner who aggregates entries and updates the master tracker on the defined schedule. Without a single tracker owner, parallel updates create version conflicts and reconciliation nightmares. If the team is using a shared spreadsheet tool, provide clear instructions that only the tracker owner edits summary rows -- contributors add only to the expense log.

**Project has a phased structure where budget is released in tranches (e.g., Phase 1 approved, Phase 2 pending):**
Create a separate Budget Allocation section per phase. Track each phase independently with its own variance status. The overall Budget Overview should show: Total Authorized (approved phases only), Total Planned (all phases including pending), and the delta between them as "Budget Pending Authorization." Never include pending budget in the working budget for spending purposes -- only authorized budget is real. If Phase 1 completes under budget, document whether the savings carry forward to Phase 2 or revert to the funder -- this is a policy question that the tracker must reflect accurately.

**User's project spans a fiscal year boundary (e.g., October to March) with annual budget cycles:**
Add a "Fiscal Year" column to the Budget Allocation table showing which fiscal year each category's spending falls in. If spending crosses a year boundary, split the category allocation into "FY1 portion" and "FY2 portion." Flag that budget authorization may need to be re-confirmed for the FY2 portion. Track cumulative spend within each fiscal year separately from total project spend. Year-end budget lapses (where unspent budget does not carry forward) are a common and costly project management failure -- proactive tracking prevents them.

---

## Example

**Input:** "I'm building a custom e-commerce website for my small business. My total budget is $18,000. I'll be using a freelance web developer, a UX designer, a copywriter, and a photographer. I also need to buy a domain, hosting, and a premium theme. The project runs about 3 months and I've already paid a $1,500 deposit to the developer."

**Output:**

---

## Project Budget Tracker: Custom E-Commerce Website Build
**Version:** v1.0 | **Last Updated:** Project Start | **Currency:** USD
**Sign Convention:** Positive variance = over budget (unfavorable). Negative variance = under budget (favorable).

---

### Budget Overview
| Field | Value |
|---|---|
| Total Approved Budget | $18,000 |
| Contingency Reserve | $2,400 (13.3% of total) |
| Working Budget (available for categories) | $15,600 |
| Total Committed to Date | $1,500 (developer deposit -- see EXP-001) |
| Total Paid to Date | $1,500 |
| Total Exposure (committed + paid) | $1,500 |
| Remaining Working Budget | $14,100 |
| Contingency Remaining | $2,400 (100% of original reserve) |
| Project Duration | Month 1 -- Month 3 |
| Tracking Frequency | Biweekly (every other Friday) |
| Next Scheduled Review | End of Week 2 |

---

### Budget Allocation (Baseline)
| # | Category | Cost Type | Budgeted ($) | % of Working Budget | Payment Timing | Confidence | Committed? |
|---|----------|----------|-------------|--------------------|----|---|---|
| 1 | Web Development (freelance) | Milestone | 6,500 | 41.7% | 25% deposit (paid), 50% mid-project, 25% on launch | High | Partial -- deposit paid |
| 2 | UX Design | Milestone | 3,000 | 19.2% | 50% upfront, 50% on design approval | Medium | No |
| 3 | Copywriting | One-time | 1,800 | 11.5% | On delivery of final copy | Medium | No |
| 4 | Photography | One-time | 1,500 | 9.6% | On shoot date | High | No |
| 5 | Domain, Hosting, Theme & Software | One-time + Recurring | 800 | 5.1% | Month 1 (setup); monthly recurring ~$50/mo thereafter | High | No |
| 6 | Testing, QA & Launch Support | One-time | 600 | 3.8% | Month 3 | Low | No |
| 7 | Miscellaneous (stock images, plugins, fonts) | One-time | 1,400 | 9.0% | Spread across Months 1-3 | Low | No |
| -- | **Subtotal (Working Budget)** | | **15,600** | **100%** | | | |
| -- | Contingency Reserve | As authorized | 2,400 | n/a | Draw requires explicit decision | -- | -- |
| -- | **TOTAL APPROVED BUDGET** | | **18,000** | | | | |

*Note: Web Development is the largest single category at 41.7% of working budget. Scope creep risk in this category is highest -- a single uncontrolled change request can push the project into AMBER. Review developer SOW carefully before authorizing any additions.*

---

### Spending Tracker -- Current Status
*Positive variance = over budget. Total Exposure = Committed Not Paid + Actual Paid. Updated at project start with known deposit.*

| # | Category | Budgeted ($) | Committed Not Paid ($) | Actual Paid ($) | Total Exposure ($) | Remaining ($) | Variance ($) | Variance (%) | Status |
|---|----------|-------------|----------------------|-----------------|-------------------|--------------|-------------|-------------|--------|
| 1 | Web Development | 6,500 | 0 | 1,500 | 1,500 | 5,000 | -5,000 | -76.9% | GREEN |
| 2 | UX Design | 3,000 | 0 | 0 | 0 | 3,000 | 0 | 0.0% | GREEN |
| 3 | Copywriting | 1,800 | 0 | 0 | 0 | 1,800 | 0 | 0.0% | GREEN |
| 4 | Photography | 1,500 | 0 | 0 | 0 | 1,500 | 0 | 0.0% | GREEN |
| 5 | Domain/Hosting/Theme/Software | 800 | 0 | 0 | 0 | 800 | 0 | 0.0% | GREEN |
| 6 | Testing, QA & Launch | 600 | 0 | 0 | 0 | 600 | 0 | 0.0% | GREEN |
| 7 | Miscellaneous | 1,400 | 0 | 0 | 0 | 1,400 | 0 | 0.0% | GREEN |
| -- | **TOTAL** | **15,600** | **0** | **1,500** | **1,500** | **14,100** | **-14,100** | **-90.4%** | **GREEN** |
| -- | Contingency | 2,400 | -- | -- | -- | 2,400 | -- | -- | -- |

*Overall budget is GREEN. Negative variance on Web Development reflects only the deposit paid -- it will normalize as remaining milestone payments are made. No action required.*

---

### Variance Thresholds and Required Actions
| Status | Variance Range | Dollar Equivalent (this project) | Required Action |
|--------|---------------|----------------------------------|----------------|
| GREEN | 0% to +5% over OR any amount under | $0 -- approx. $780 over (on working budget) | Document in biweekly narrative. No action required. |
| AMBER | +5% to +15% over budget | $780 -- $2,340 over (on working budget) | Write root cause within 24 hours. Identify corrective action. Update tracker notes. |
| RED | Over +15% above budget | Over $2,340 over (on working budget) | Freeze uncommitted spending in affected category. Escalate per protocol below. Decide on contingency draw, reallocation, or scope cut within 5 business days. |
| CRITICAL | Overall project >10% over with contingency below $600 (25% of reserve) | Project-level | Escalate to decision-maker. Present three options: additional funding, scope reduction, or project halt. No further spending without explicit authorization. |

*Per-category examples: Web Development AMBER triggers at $6,825 total exposure; RED triggers at $7,475. UX Design AMBER triggers at $3,150; RED triggers at $3,450.*

---

### Escalation Protocol
1. **Any single invoice or purchase above $1,560 (10% of working budget):** Obtain at least two quotes or rate comparisons before committing. Document comparison in expense log Notes.
2. **Category enters AMBER:** Write one sentence of root cause in the Budget Narrative Log within 24 hours. Identify whether the cause is: (a) scope addition by the client/user, (b) original estimate was incorrect, (c) vendor price was higher than quoted, or (d) procurement error. Each cause has a different corrective action.
3. **Category enters RED:** Halt all uncommitted discretionary purchases in that category. Within 5 business days, decide from the following options and document the decision: draw from contingency, reduce scope in that category, or reallocate from a confirmed under-budget category. Do not default to contingency without reviewing other options first.
4. **Contingency reserve falls to $1,200 or below (50% of original):** Conduct an unscheduled full budget review. Re-price all remaining uncommitted work. Check if any categories have scope that can be reduced without impairing the launch.
5. **Contingency reserve falls to $600 or below (25% of original):** CRITICAL. No further discretionary spending without explicit authorization. Reassess whether the project can be completed within the remaining budget. Present completion options.
6. **Any contractor submits a change request:** Before approving, price the change, identify which budget category it draws from, and determine the new Total Exposure for that category and its resulting status color. Change requests that push any category into RED must be approved with a documented offset (scope reduction elsewhere or contingency draw authorization).

---

### Expense Log
*Log every transaction within 48 hours. Reconstructed entries from before tracker creation are marked with an asterisk (*).*

| Ref # | Date | Category | Vendor/Payee | Description | Committed or Paid | Amount ($) | Payment Method | Running Paid Total ($) | Notes |
|-------|------|----------|-------------|------------|------------------|-----------|----------------|----------------------|-------|
| EXP-001* | [Date of deposit] | Web Development | [Developer Name] | Project deposit per contract -- 25% of $6,000 dev fee | Paid | 1,500 | Bank transfer | 1,500 | Reconstructed entry. Contract signed [date]. Remaining milestones: $3,000 at mid-project, $1,500 at launch. |
| EXP-002 | | | | | | | | | |

---

### Budget Narrative Log (Biweekly Updates)
| Update # | Date | Overall Status | Summary | Action Items |
|----------|------|---------------|---------|-------------|
| Update 0 (Baseline) | [Project Start] | GREEN | Tracker initialized. Developer deposit of $1,500 logged (EXP-001). All categories GREEN. Working budget remaining: $14,100. Contingency intact at $2,400. | Obtain UX designer quotes before end of Week 1. Confirm developer contract includes change request process. |

---

### End-of-Project Budget Summary
*Complete at project launch and site handover.*

| Category | Original Baseline ($) | Final Actual ($) | Variance ($) | Variance (%) | Root Cause of Significant Variances |
|----------|-----------------------|-----------------|-------------|-------------|--------------------------------------|
| Web Development | 6,500 | | | | |
| UX Design | 3,000 | | | | |
| Copywriting | 1,800 | | | | |
| Photography | 1,500 | | | | |
| Domain/Hosting/Theme/Software | 800 | | | | |
| Testing, QA & Launch | 600 | | | | |
| Miscellaneous | 1,400 | | | | |
| **Working Budget Total** | **15,600** | | | | |
| Contingency Reserve | 2,400 | | | | Amount drawn vs. $2,400 reserved |
| **Final Total Project Cost** | **18,000** | | | | |

**Post-Project Notes (complete at close):**
- Largest single variance: [to be filled at project close]
- Categories that consistently over- or under-estimated: [to be filled at project close]
- Recommendation for future website projects: [e.g., "Build photography into development contract to reduce vendor coordination" or "Miscellaneous budget was insufficient -- increase to $2,000 for comparable scope"]

---

*Tracker initialized at project start. Note: The $1,500 developer deposit has been recorded. Ensure the developer contract specifies a change request process with written approval required for any additions above $300. Uncontrolled change requests are the primary budget risk for freelance web development projects of this type. Review UX designer and copywriter quotes against budget allocations before signing any additional contracts.*
