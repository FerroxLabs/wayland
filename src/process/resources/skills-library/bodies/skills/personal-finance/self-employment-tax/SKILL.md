---
name: self-employment-tax
description: |
  Explains self-employment tax concepts for freelancers and sole proprietors
  including SE tax calculation, the deductible portion, business expense
  categories, home office rules, and mileage tracking. Uses a jurisdiction-aware
  framework with placeholder markers for all rates and rules.
  Use when the user asks about self-employment taxes, freelance tax obligations,
  or how taxes work when you work for yourself.
  Do NOT use for estimating quarterly payments (use quarterly-tax-estimator),
  tracking deductions (use tax-deduction-tracker), or understanding retirement
  accounts for the self-employed (use tax-advantaged-optimizer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tax-planning personal-finance freelancing budgeting"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Self-Employment Tax Guide

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User asks about self-employment taxes or how taxes work for freelancers
- User wants to understand the components of SE tax (income tax + self-employment tax)
- User asks about deductible business expenses for self-employed individuals
- User wants to understand home office or mileage deductions for self-employment
- User is new to freelancing and wants to understand their tax obligations

**Do NOT use this skill when:**
- User needs to calculate quarterly estimated payments (use `quarterly-tax-estimator`)
- User wants to set up a deduction tracking system (use `tax-deduction-tracker`)
- User wants to understand retirement account options for self-employed (use `tax-advantaged-optimizer`)
- User wants to file their tax return (use `tax-filing-prep`)

## Process

1. **Explain the self-employment tax structure.** Clarify that self-employed individuals face two types of tax:

   **Component 1: Self-Employment Tax (SE Tax)**
   - When employed, the employer pays half of social insurance contributions and the employee pays the other half
   - When self-employed, you pay BOTH halves [JURISDICTION: verify SE tax rate and what it covers]
   - SE tax applies to net self-employment earnings above a minimum threshold [JURISDICTION: verify threshold]
   - Half of SE tax is deductible from income (it reduces your taxable income for income tax purposes) [JURISDICTION: verify deductible portion]

   **Component 2: Income Tax**
   - Net self-employment income (after business deductions) is also subject to regular income tax
   - Tax is calculated on total taxable income at applicable bracket rates [JURISDICTION: verify current brackets]
   - The deductible portion of SE tax reduces the income subject to income tax

2. **Walk through the SE tax calculation framework.** Show each step:

   ```
   Step 1: Calculate gross self-employment income
   Total revenue from all self-employment activities = $____

   Step 2: Subtract business deductions
   Gross income - Business expenses = Net SE income

   Step 3: Apply the SE tax calculation
   Net SE income * [JURISDICTION: verify adjustment factor, if any]
   = Adjusted amount
   Adjusted amount * [JURISDICTION: verify SE tax rate]
   = SE tax owed

   Step 4: Calculate the deductible portion
   SE tax * [JURISDICTION: verify deductible percentage]
   = Amount you can deduct from income

   Step 5: Calculate income tax impact
   Net SE income - Deductible SE portion - Personal deductions
   = Taxable income for income tax
   Apply [JURISDICTION: verify brackets] = Income tax owed

   Step 6: Total tax obligation
   SE tax + Income tax = Total self-employment tax obligation
   ```

3. **Explain the major business deduction categories.** For each category, describe what qualifies:

   **Direct Business Expenses:**
   - Supplies and materials used in the business
   - Software and tools essential to the work
   - Professional services (accounting, legal related to the business)
   - Business insurance
   - Marketing and advertising costs
   - Business licenses and permits

   **Home Office Deduction:**
   - Requires a dedicated space used regularly and exclusively for business [JURISDICTION: verify qualification rules]
   - Two methods: simplified (flat rate per square foot) or actual expenses (proportional share of home costs) [JURISDICTION: verify both methods and rates]
   - Actual expenses include: rent or mortgage interest, utilities, insurance, repairs, depreciation -- all prorated by the percentage of home used for business
   - Documentation: Measure office space and total home space; keep records of all home expenses

   **Vehicle and Mileage:**
   - Business miles driven (not commuting) [JURISDICTION: verify what qualifies as business vs. personal travel]
   - Two methods: standard mileage rate [JURISDICTION: verify current rate per mile] or actual vehicle expenses (gas, maintenance, insurance, depreciation -- prorated by business use percentage)
   - Documentation: Mileage log with date, destination, business purpose, and miles for every business trip
   - Cannot deduct travel from home to a regular office -- that is commuting, not business travel

   **Professional Development:**
   - Training, courses, and certifications related to current business
   - Industry conferences and events (registration, travel, lodging)
   - Books and subscriptions related to the profession
   - Professional association memberships

   **Travel and Meals:**
   - Business travel: transportation, lodging, incidentals when traveling away from home for business
   - Business meals: meals with clients or during business travel, deductible at a percentage [JURISDICTION: verify deductible percentage for meals]
   - Documentation: Receipt plus notation of business purpose and attendees

   **Communication and Technology:**
   - Business portion of phone and internet expenses
   - Business-specific phone line or service
   - Website hosting and domain costs
   - Cloud storage and software subscriptions for business

4. **Build the deduction tracking framework.** For each applicable category, create a tracking structure the user can use year-round.

5. **Explain key concepts for new freelancers.** Cover:
   - **Estimated tax payments:** Required if you expect to owe above a threshold [JURISDICTION: verify threshold and penalty rules]
   - **Record keeping:** Keep all receipts and records for [JURISDICTION: verify retention period] years
   - **Separating business and personal:** Use separate bank accounts and credit cards for business transactions
   - **Retirement options:** Self-employed have access to special retirement plans with higher contribution limits [JURISDICTION: verify plan types and limits]

6. **Produce the SE tax summary and action items.**

## Output Format

```
## Self-Employment Tax Overview

### Your Self-Employment Profile
- Business type: [freelance / sole proprietor / contractor]
- Industry: [user's field]
- Estimated annual gross income: $[amount]
- Estimated business expenses: $[amount]
- Estimated net SE income: $[amount]

### SE Tax Calculation Framework

| Step | Calculation | Amount |
|------|-----------|-------:|
| Gross SE income | | $[amount] |
| Business deductions | | -$[amount] |
| **Net SE income** | | **$[amount]** |
| SE tax | Net * [JURISDICTION: verify rate] | $[amount] |
| Deductible SE portion | SE tax * [JURISDICTION: verify %] | $[amount] |
| Taxable income | Net - SE deduction - personal deductions | $[amount] |
| Income tax | [JURISDICTION: verify brackets] | $[amount] |
| **Total tax obligation** | SE tax + Income tax | **$[amount]** |
| **Effective tax rate** | Total tax / Gross income | **[%]** |

### Business Deduction Categories

| Category | What Qualifies | Documentation Needed | Your Estimate |
|----------|---------------|---------------------|-------------:|
| Supplies/materials | Items consumed by the business | Receipts | $[amount] |
| Software/tools | Business-essential technology | Receipts, subscriptions | $[amount] |
| Professional services | Accounting, legal for business | Invoices | $[amount] |
| Home office | Dedicated business space | Measurements, expenses | $[amount] |
| Vehicle/mileage | Business driving | Mileage log | $[amount] |
| Professional development | Training, courses, conferences | Receipts, registration | $[amount] |
| Travel | Business trips | Receipts, itinerary | $[amount] |
| Meals | Business meals at [JURISDICTION: verify]% | Receipts + purpose notes | $[amount] |
| Communication | Business phone, internet | Bills, usage records | $[amount] |
| Insurance | Business liability, professional | Policy documents | $[amount] |
| **Total deductions** | | | **$[amount]** |

### Home Office Calculation (if applicable)

| Method | Calculation | Deduction |
|--------|-----------|----------:|
| Simplified | [office sqft] * [JURISDICTION: verify rate per sqft] | $[amount] |
| Actual | [office sqft / total sqft] * total home expenses | $[amount] |
| **Use whichever method produces the larger deduction** |

Home office measurements:
- Office space: ____ square feet
- Total home: ____ square feet
- Business use percentage: ____%

### Mileage Tracking (if applicable)

| Method | Calculation | Deduction |
|--------|-----------|----------:|
| Standard mileage | [miles] * [JURISDICTION: verify rate] | $[amount] |
| Actual expenses | Total vehicle costs * business use % | $[amount] |

### Essential Actions for Self-Employed

- [ ] Separate business and personal bank accounts
- [ ] Set aside [calculate based on above] per month for estimated tax payments
- [ ] Make quarterly estimated payments [JURISDICTION: verify due dates]
- [ ] Track all business expenses with receipts (use `tax-deduction-tracker`)
- [ ] Maintain mileage log for all business driving
- [ ] Document home office space measurements and expenses
- [ ] Consider self-employed retirement plans (use `tax-advantaged-optimizer`)
- [ ] Keep all records for [JURISDICTION: verify retention period] years
- [ ] Consult a tax professional familiar with self-employment

### Common Mistakes to Avoid
1. Not setting aside money for taxes (SE tax + income tax together can be significant)
2. Mixing business and personal expenses in one account
3. Not tracking mileage in real time (reconstructing from memory is unreliable)
4. skipping to deduct the deductible portion of SE tax
5. Missing quarterly estimated payment deadlines [JURISDICTION: verify penalty rules]
6. Not deducting legitimate business expenses (leaving money on the table)
7. Deducting personal expenses as business expenses (audit risk)

### Important Notes
- All rates, brackets, and thresholds must be verified with your jurisdiction's tax authority
- Tax rules for self-employed individuals change -- verify current year rules
- SE tax applies in addition to income tax -- plan for both
- Self-employment deductions are separate from the standard vs. itemized decision
- State/provincial taxes may also apply to self-employment income [JURISDICTION: verify]
```

## Rules

1. NEVER state specific SE tax rates, income tax brackets, mileage rates, or deduction limits as facts
2. NEVER advise the user on which deductions to take -- present the categories and let them evaluate
3. ALWAYS use [JURISDICTION: verify] for all rates, thresholds, percentages, and deadlines
4. ALWAYS explain both the SE tax and income tax components -- new freelancers often overlook SE tax
5. ALWAYS include the deductible portion of SE tax in the calculation framework
6. Include both home office methods (simplified and actual) when applicable
7. Include both mileage methods (standard rate and actual expenses) when applicable
8. Emphasize the importance of separating business and personal finances
9. Recommend tracking expenses throughout the year, not just at tax time
10. Note that state or provincial taxes may add an additional layer [JURISDICTION: verify]

## Edge Cases

- **User has both W-2 and self-employment income:** Explain that SE tax applies only to the self-employment income. Income tax applies to total income (W-2 + SE). W-2 withholding partially offsets the total tax liability. The user may still need estimated payments for the SE income portion.
- **User earned very little from self-employment:** Below a certain threshold, SE tax may not apply [JURISDICTION: verify minimum earnings threshold for SE tax]. Income tax still applies to net earnings above the filing threshold. Even small amounts should be reported.
- **User just started freelancing mid-year:** Prorate the examples for their actual earning period. Emphasize setting up tracking systems now. First-year freelancers often have a tax surprise because they did not account for SE tax.
- **User has significant equipment purchases:** Explain the concept of depreciation vs. immediate expensing [JURISDICTION: verify rules for capital asset deduction in the year of purchase]. Large purchases may be deductible in full in the purchase year or spread over multiple years depending on jurisdiction rules.
- **User works from home but not exclusively:** The "exclusive use" requirement is strict in many jurisdictions. A desk in a bedroom that is also used for personal purposes may not qualify [JURISDICTION: verify exclusive use rules]. Present the rules and let the user assess their situation.
- **User has international clients:** Income from international clients is still subject to domestic SE tax and income tax. Additional reporting requirements may apply [JURISDICTION: verify foreign income reporting rules]. Recommend a tax professional experienced in international self-employment.

## Example

**Input:** "I started freelance web development this year and made about $45,000. My expenses were maybe $8,000 for software, equipment, and a coworking space. How does self-employment tax work?"

**Output:**

## Self-Employment Tax Overview

### Your Self-Employment Profile
- Business type: Freelance web developer
- Estimated annual gross income: $45,000
- Estimated business expenses: $8,000
- Estimated net SE income: $37,000

### SE Tax Calculation Framework

| Step | Calculation | Amount |
|------|-----------|-------:|
| Gross SE income | | $45,000 |
| Business deductions | Software, equipment, coworking | -$8,000 |
| **Net SE income** | | **$37,000** |
| SE tax adjustment | $37,000 * [JURISDICTION: verify adjustment factor] | $[verify] |
| SE tax | Adjusted amount * [JURISDICTION: verify SE tax rate] | $[verify] |
| Deductible SE portion | SE tax * [JURISDICTION: verify deductible %] | $[verify] |

For income tax:
| Step | Calculation | Amount |
|------|-----------|-------:|
| Net SE income | | $37,000 |
| Less deductible SE portion | | -$[verify] |
| Less standard deduction | [JURISDICTION: verify for your filing status] | -$[verify] |
| **Taxable income** | | **$[verify]** |
| Income tax | Apply [JURISDICTION: verify brackets] | $[verify] |

**Total: SE tax + Income tax = Your total tax obligation**

### Your Business Deductions

| Category | Description | Amount | Documentation |
|----------|------------|-------:|---------------|
| Software | Development tools, subscriptions | $[subtotal] | Subscription records, receipts |
| Equipment | Computer, peripherals | $[subtotal] | Purchase receipts |
| Coworking space | Workspace rental | $[subtotal] | Monthly invoices |
| **Total deductions** | | **$8,000** | |

### Additional Deductions to Explore

You may have additional deductible expenses you have not listed:

| Category | Potentially Applicable? | Action |
|----------|------------------------|--------|
| Home office | Do you also work from home? | [JURISDICTION: verify exclusive use rules] |
| Mileage | Drive to meet clients? | Start tracking business miles now |
| Professional development | Courses, books, conferences? | Keep receipts |
| Phone/internet | Business portion of personal plans? | Calculate business use percentage |
| Health insurance | Pay your own premiums? | [JURISDICTION: verify SE health insurance deduction] |

### Estimated Tax Payments

Since no employer withholds taxes from your freelance income, you likely need to make quarterly estimated payments [JURISDICTION: verify requirements and thresholds].

Monthly set-aside: Calculate your total tax obligation and divide by 12. Transfer this amount to a dedicated tax savings account each month.

### Action Items
- [ ] Calculate your exact SE tax using verified rates from your tax authority
- [ ] Set up quarterly estimated tax payments (use `quarterly-tax-estimator`)
- [ ] Open a separate business bank account
- [ ] Set up a deduction tracking system (use `tax-deduction-tracker`)
- [ ] Start a mileage log if you drive for business
- [ ] Explore self-employed retirement plans (use `tax-advantaged-optimizer`)
- [ ] Save all business receipts -- digital copies are acceptable
- [ ] Consult a tax professional familiar with freelancer taxes
