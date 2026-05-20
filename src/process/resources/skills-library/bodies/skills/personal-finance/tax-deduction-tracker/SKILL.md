---
name: tax-deduction-tracker
description: |
  Builds a structured tax deduction tracking system covering common deduction
  categories with documentation requirements and jurisdiction-aware placeholders.
  Produces a categorized tracker the user populates throughout the year to
  maximize legitimate deductions at filing time.
  Use when the user asks about tracking tax deductions, organizing receipts for
  taxes, or building a system to document deductible expenses.
  Do NOT use for filing taxes (use tax-filing-prep), estimating quarterly taxes
  (use quarterly-tax-estimator), or understanding tax-advantaged accounts
  (use tax-advantaged-optimizer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tax-planning personal-finance planning"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Tax Deduction Tracker

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User wants to set up a system to track tax deductions throughout the year
- User asks what expenses might be deductible
- User needs to organize documentation for tax-deductible expenses
- User wants a template for categorizing potential deductions
- User asks how to document expenses for tax purposes

**Do NOT use this skill when:**
- User wants to file their taxes (use `tax-filing-prep`)
- User needs to estimate quarterly tax payments (use `quarterly-tax-estimator`)
- User wants to understand tax-advantaged accounts (use `tax-advantaged-optimizer`)
- User wants specific tax advice for their situation (consult a tax professional)

## Process

1. **Identify the user's deduction context.** Determine:
   - **Filing status:** Are they employed (W-2), self-employed, or both?
   - **Itemizing vs. standard:** Do they itemize deductions or take the standard deduction? [JURISDICTION: verify current standard deduction amounts and when itemizing makes sense]
   - **Major deduction categories applicable:** Based on their situation, identify which categories to track
   - **Current tracking method:** Are they starting from scratch or improving an existing system?

2. **Build the deduction category framework.** Present the common deduction categories. For each category, provide:
   - What qualifies [JURISDICTION: verify your country/state eligibility rules]
   - Documentation required to substantiate the deduction
   - Whether there is a cap or phase-out [JURISDICTION: verify current limits]
   - Tracking method recommendation

   **Category 1: Medical and Health Expenses**
   - Unreimbursed medical expenses above a percentage of adjusted gross income [JURISDICTION: verify the AGI threshold percentage]
   - Documentation: Receipts, insurance Explanation of Benefits (EOB), pharmacy records
   - Track: Date, provider, description, amount paid, insurance reimbursement received

   **Category 2: Charitable Contributions**
   - Cash donations to qualified organizations
   - Non-cash donations (clothing, goods) at fair market value
   - Documentation: Receipts, acknowledgment letters for donations above threshold [JURISDICTION: verify receipt requirements and limits]
   - Track: Date, organization, type (cash/goods), amount or estimated value

   **Category 3: State and Local Taxes (SALT)**
   - State income taxes or sales taxes paid
   - Local property taxes
   - [JURISDICTION: verify deductibility limits and caps on SALT deductions]
   - Documentation: Tax returns, property tax bills, pay stubs showing state tax withheld

   **Category 4: Mortgage Interest**
   - Interest paid on a qualifying mortgage [JURISDICTION: verify loan amount limits for deductibility]
   - Points paid on a mortgage origination
   - Documentation: Annual mortgage interest statement from lender
   - Track: Monthly payment breakdown showing interest portion

   **Category 5: Education Expenses**
   - Tuition and fees [JURISDICTION: verify which education expenses qualify as deductions vs. credits]
   - Student loan interest [JURISDICTION: verify deduction limits and income phase-outs]
   - Documentation: Tuition statements, student loan interest statements

   **Category 6: Business and Self-Employment Expenses (if applicable)**
   - Business supplies, equipment, software
   - Professional development and industry memberships
   - Business travel, meals (at deductible percentage) [JURISDICTION: verify deductible percentages]
   - Home office expenses [JURISDICTION: verify home office qualification rules]
   - Documentation: Receipts, mileage logs, home office measurements

   **Category 7: Investment-Related Deductions**
   - Investment management fees [JURISDICTION: verify if currently deductible]
   - Tax preparation fees [JURISDICTION: verify if currently deductible]
   - Documentation: Fee statements, invoices from tax professionals

   **Category 8: Job-Related Expenses (if applicable)**
   - Unreimbursed employee expenses [JURISDICTION: verify if currently deductible -- rules vary significantly]
   - Professional licenses and certifications
   - Union dues
   - Documentation: Receipts, employer non-reimbursement documentation

3. **Create the tracking template.** For each applicable category, build a tracking spreadsheet structure:
   - Date of expense
   - Category and subcategory
   - Vendor or payee
   - Description of expense
   - Amount
   - Documentation status (receipt collected: yes/no)
   - Notes (reimbursement status, special circumstances)

4. **Set up the documentation system.** Advise on organizing supporting documents:
   - Digital filing: One folder per category, named by year
   - Receipt capture: Photograph or scan receipts immediately (paper fades)
   - Monthly reconciliation: Review tracked expenses against bank/credit card statements
   - Annual summary: Total by category before filing

5. **Establish a review schedule.** Build a recurring process:
   - Weekly: Log new expenses, capture receipts
   - Monthly: Reconcile against statements, verify documentation completeness
   - Quarterly: Review category totals, identify missing documentation
   - Year-end: Final reconciliation, prepare totals for filing

6. **Present the itemization threshold analysis.** Help the user understand whether tracking matters for their situation:
   - Compare their expected total deductions against the standard deduction [JURISDICTION: verify current standard deduction for their filing status]
   - Note that tracking is valuable even if they take the standard deduction -- they may cross the itemization threshold unexpectedly
   - Self-employment deductions are separate from the itemize vs. standard decision

## Output Format

```
## Tax Deduction Tracking System

### Your Profile
- Filing type: [employed / self-employed / both]
- Deduction approach: [itemizing / standard / undecided]
- Standard deduction for comparison: [JURISDICTION: verify current amount for your filing status]
- Categories to track: [list applicable categories]

### Deduction Category Tracker

#### Category 1: [Category Name]
What qualifies: [JURISDICTION: verify eligibility rules]
Documentation needed: [list]
Deduction limit: [JURISDICTION: verify current cap or threshold]

| Date | Vendor/Payee | Description | Amount | Receipt | Notes |
|------|-------------|-------------|-------:|---------|-------|
| | | | | [ ] | |
| | | | | [ ] | |
| **Category Total** | | | **$0.00** | | |

#### Category 2: [Category Name]
[Same structure repeated for each applicable category]

### Running Deduction Summary

| Category | YTD Total | Documentation Complete? | Limit/Cap |
|----------|----------:|------------------------|-----------|
| Medical | $[amount] | [%] | [JURISDICTION: verify AGI threshold] |
| Charitable | $[amount] | [%] | [JURISDICTION: verify limits] |
| SALT | $[amount] | [%] | [JURISDICTION: verify cap] |
| Mortgage Interest | $[amount] | [%] | [JURISDICTION: verify] |
| Education | $[amount] | [%] | [JURISDICTION: verify] |
| Business/SE | $[amount] | [%] | Various |
| **Total Tracked** | **$[amount]** | | |

### Itemization Threshold Check
- Your tracked deductions: $[amount]
- Standard deduction: [JURISDICTION: verify for your filing status]
- Difference: [+/- amount] -- [above/below threshold]

### Review Schedule
- [ ] Weekly: Log new expenses, photograph receipts
- [ ] Monthly: Reconcile against bank statements
- [ ] Quarterly: Review totals, check documentation gaps
- [ ] Year-end: Final reconciliation, prepare filing totals

### Documentation Checklist
- [ ] All receipts digitized and filed by category
- [ ] Charitable donation acknowledgment letters collected
- [ ] Mortgage interest statement received from lender
- [ ] Property tax bills saved
- [ ] Medical expense EOBs organized
- [ ] Mileage log maintained (if applicable)
- [ ] Home office measurements documented (if applicable)

### Important Reminders
- All jurisdiction-specific rules must be verified at your official tax authority
- Tax rules change annually -- confirm current rules before filing
- Keep records for [JURISDICTION: verify required retention period] years
- Consult a tax professional for complex deduction situations
```

## Rules

1. NEVER state specific deduction amounts, limits, or thresholds as facts -- always use [JURISDICTION: verify] placeholders
2. NEVER advise whether to itemize or take the standard deduction -- present the comparison framework
3. NEVER provide tax filing instructions -- this skill builds the tracking system, not the return
4. ALWAYS include documentation requirements for every deduction category
5. ALWAYS remind the user to verify eligibility rules with their jurisdiction's official source
6. Include both the standard deduction comparison and the tracking template
7. Include a review schedule with weekly, monthly, quarterly, and annual checkpoints
8. Mark every jurisdiction-specific detail with [JURISDICTION: ...] placeholder
9. If the user is self-employed, include both personal and business deduction categories
10. Note that tracking deductions is valuable even if the user takes the standard deduction

## Edge Cases

- **User does not know if they should itemize:** Build the tracking system for all potential categories. At year-end, the totals will reveal whether itemizing exceeds the standard deduction. Tracking costs nothing; missing deductions costs money.
- **User is self-employed:** Self-employment deductions (business expenses) are deducted differently from personal itemized deductions [JURISDICTION: verify where business deductions are claimed]. Build separate tracking sections for personal and business expenses.
- **User has income from multiple jurisdictions:** Note that state and local deduction rules vary by jurisdiction. The tracking system should tag each expense with the relevant jurisdiction. Recommend consulting a tax professional who handles multi-state situations.
- **User is new to tracking and overwhelmed:** Start with the three largest categories likely to apply (charitable, medical, business/job expenses). Add categories in future months as the habit develops. A partial tracking system is better than none.
- **User asks about audit protection:** Note that documentation is the primary defense in an audit. The tracking system with receipts and records serves this purpose. [JURISDICTION: verify record retention requirements -- typically several years minimum].
- **Mid-year start:** Reconstruct year-to-date expenses from bank and credit card statements. Digital records make this feasible. Focus on large expenses first and fill in smaller ones as time allows.

## Example

**Input:** "I'm self-employed and want to set up a system to track my tax deductions this year. I work from home and drive to client meetings."

**Output:**

## Tax Deduction Tracking System

### Your Profile
- Filing type: Self-employed
- Deduction approach: Self-employment deductions are separate from itemized vs. standard decision
- Standard deduction for comparison: [JURISDICTION: verify current standard deduction for your filing status]
- Key categories: Business expenses (home office, mileage, supplies), plus personal deduction categories

### Business Expense Tracker

#### Home Office
What qualifies: [JURISDICTION: verify home office qualification rules -- typically requires regular and exclusive use for business]
Documentation needed: Home square footage, office square footage, utility bills, mortgage/rent payments
Deduction limit: [JURISDICTION: verify -- may use simplified or actual expense method]

| Date | Expense Type | Description | Amount | Receipt | Notes |
|------|-------------|-------------|-------:|---------|-------|
| Monthly | Rent/Mortgage | Proportional share | $[amount] | [ ] | [office sqft / total sqft] |
| Monthly | Utilities | Proportional share | $[amount] | [ ] | Electric, internet, heat |
| | | | | [ ] | |
| **Category Total** | | | **$0.00** | | |

#### Vehicle/Mileage for Business
What qualifies: [JURISDICTION: verify -- miles driven for business purposes, not commuting]
Documentation needed: Mileage log with date, destination, business purpose, miles driven
Method: [JURISDICTION: verify standard mileage rate OR actual expense method]

| Date | Destination | Business Purpose | Miles | Rate | Amount |
|------|------------|-----------------|------:|------|-------:|
| | | | | [JURISDICTION: verify rate] | |
| **Category Total** | | | **0** | | **$0.00** |

#### Business Supplies and Equipment
| Date | Vendor | Description | Amount | Receipt | Notes |
|------|--------|-------------|-------:|---------|-------|
| | | | | [ ] | |
| **Category Total** | | | **$0.00** | | |

#### Professional Development
| Date | Provider | Description | Amount | Receipt | Notes |
|------|---------|-------------|-------:|---------|-------|
| | | Courses, books, conferences | | [ ] | |
| **Category Total** | | | **$0.00** | | |

#### Other Business Expenses
Software subscriptions, professional memberships, insurance, marketing, legal/accounting fees.

| Date | Vendor | Category | Amount | Receipt | Notes |
|------|--------|----------|-------:|---------|-------|
| | | | | [ ] | |
| **Category Total** | | | **$0.00** | | |

### Personal Deduction Tracker (Itemized)

| Category | YTD Total | Documentation Status |
|----------|----------:|---------------------|
| Medical (above AGI threshold) | $0.00 | |
| Charitable contributions | $0.00 | |
| State/local taxes | $0.00 | [JURISDICTION: verify SALT cap] |
| Mortgage interest | $0.00 | |
| **Total Personal Deductions** | **$0.00** | |

Standard deduction comparison: [JURISDICTION: verify for your filing status]

### Review Schedule
- [ ] Weekly: Log mileage and new expenses, capture receipts immediately
- [ ] Monthly: Reconcile against bank/credit card statements, total home office expenses
- [ ] Quarterly: Review totals for estimated tax payments (use `quarterly-tax-estimator`)
- [ ] Year-end: Final reconciliation, prepare totals for tax filing

### Documentation Checklist
- [ ] Home office measurements recorded (office square footage and total square footage)
- [ ] Mileage log maintained with date, destination, purpose, and miles for every trip
- [ ] All business receipts digitized and filed by category
- [ ] Home utility and rent/mortgage records saved monthly
- [ ] Professional development receipts and certificates saved
- [ ] Software and subscription payment records saved
- [ ] Charitable donation acknowledgment letters collected

### Important Reminders
- Self-employment deductions reduce both income tax AND self-employment tax
- Verify all rules at your jurisdiction's official tax authority -- rules change annually
- Keep records for [JURISDICTION: verify required retention period] years
- Consider quarterly estimated tax payments to avoid underpayment penalties
- Consult a tax professional for complex situations (multi-state, international, mixed use)
