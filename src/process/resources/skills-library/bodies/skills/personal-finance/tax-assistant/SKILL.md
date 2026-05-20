---
name: tax-assistant
description: |
  Tax preparation support covering common deductions, tax bracket explanations, W-2 vs 1099 differences, estimated tax payments, tax-advantaged accounts (HSA, FSA, 529), filing status optimization, record-keeping requirements, and deadline calendars.
  Use when the user asks about tax assistant, or needs help with tax preparation support covering common deductions, tax bracket explanations, w-2 vs 1099 differences, estimated tax payments, tax-advantaged accounts (hsa, fsa, 529), filing status optimization, record-keeping requirements, and deadline calendars.
  Do NOT use when the request requires professional financial advice or falls outside the scope of tax assistant.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "personal-finance tax-planning guide"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "intermediate"
---

# Tax Assistant

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User has questions about tax concepts, deductions, or filing basics
- User wants to understand how a financial decision affects their taxes
- User needs help organizing documents for tax preparation
- User wants to understand tax brackets, credits, or withholding

**Do NOT use this skill when:**
- User needs specific tax filing or preparation -- refer to CPA or tax professional
- User has a complex tax situation (business, international, estate) -- refer to tax specialist
- User needs legal tax dispute resolution -- refer to tax attorney

## Process

1. **Step 1:** Identify the specific tax question and relevant filing status
2. **Step 2:** Explain applicable tax concepts in plain language with examples
3. **Step 3:** Walk through relevant deductions, credits, or calculations
4. **Step 4:** Provide document checklist or organizational framework
5. **Step 5:** Clarify when professional tax help is needed

## Purpose

This skill helps users understand their tax obligations, identify potential deductions and credits, choose optimal filing strategies, and maintain proper records. It educates users on tax concepts so they can have more informed conversations with their tax professionals.

---

## Questions to Ask the User First

1. **Filing status:** Single, Married Filing Jointly, Married Filing Separately, Head of Household, or Qualifying Surviving Spouse?
2. **Income types:** W-2 employment, 1099 freelance/contract, business income, investment income, rental income, retirement distributions?
3. **Dependents:** Any children or other dependents? Ages?
4. **Major life events this year:** Marriage, divorce, home purchase, baby, job change, retirement, inheritance?
5. **Homeownership:** Own or rent? Mortgage interest amount?
6. **State of residence:** Which state(s) did you live/work in? (State tax implications vary enormously)
7. **Retirement contributions:** 401k, IRA, HSA contributions this year?
8. **Charitable giving:** Did you make charitable donations (cash, goods, stock)?
9. **Health insurance:** Employer-provided, marketplace, or other?
10. **Previous year:** Did you owe taxes or get a refund last year? Roughly how much?

---

## Tax Bracket Explanation (2024 Federal)

### How Marginal Tax Brackets Work

Tax brackets are **marginal**, meaning only the income within each bracket is taxed at that rate. Your effective (average) tax rate is always lower than your marginal rate.

```
2024 FEDERAL TAX BRACKETS -- SINGLE
====================================
Income Range              Tax Rate    Tax on Bracket
$0 - $11,600             10%         $1,160
$11,601 - $47,150        12%         $4,266
$47,151 - $100,525       22%         $11,742
$100,526 - $191,950      24%         $21,942
$191,951 - $243,725      32%         $16,568
$243,726 - $609,350      35%         $127,969
$609,351+                37%         --

2024 FEDERAL TAX BRACKETS -- MARRIED FILING JOINTLY
====================================================
Income Range              Tax Rate    Tax on Bracket
$0 - $23,200             10%         $2,320
$23,201 - $94,300        12%         $8,532
$94,301 - $201,050       22%         $23,486
$201,051 - $383,900      24%         $43,884
$383,901 - $487,450      32%         $33,136
$487,451 - $731,200      35%         $85,313
$731,201+                37%         --
```

```
QUICK TAX CALCULATION
=====================
Gross income:                     $__________
Pre-tax deductions (401k, HSA):  -$__________
Adjusted Gross Income (AGI):      $__________
Deduction (standard or itemized): -$__________
Taxable income:                   $__________

Apply brackets above to calculate federal tax: $__________
Effective tax rate: tax / gross income x 100 = ____%
Marginal tax rate: the bracket your last dollar falls in = ____%
```

---

## W-2 vs 1099 Differences

| Factor | W-2 Employee | 1099 Independent Contractor |
|--------|-------------|---------------------------|
| Tax withholding | Employer withholds | You pay estimated taxes quarterly |
| Social Security/Medicare | Split 50/50 with employer (7.65% each) | You pay both halves (15.3% self-employment tax) |
| Deductions | Limited (standard deduction) | Business expenses deductible on Schedule C |
| Benefits | Often provided (health, retirement) | You provide your own |
| Tax forms | Receive W-2 by Jan 31 | Receive 1099-NEC by Jan 31 |
| Estimated payments | Generally not needed | Required quarterly (Apr 15, Jun 15, Sep 15, Jan 15) |
| QBI deduction | Not applicable | May qualify for 20% Qualified Business Income deduction |

### Self-Employment Tax Calculation (1099)

```
SELF-EMPLOYMENT TAX WORKSHEET
==============================
Net self-employment income (Schedule C):    $__________
Multiply by 92.35% (adjustment factor):   x 0.9235
Self-employment tax base:                   $__________
Self-employment tax (15.3%):               x 0.153
TOTAL SE TAX:                               $__________

Note: You deduct HALF of SE tax from AGI as an adjustment
Deductible portion: SE tax / 2 =            $__________
```

---

## Estimated Tax Payments

### Who Must Pay Estimated Taxes
You generally must make estimated payments if:
- You expect to owe $1,000 or more when you file
- Your withholding is less than 90% of current year tax OR 100% of prior year tax (110% if AGI > $150,000)

### Quarterly Deadlines

```
ESTIMATED TAX CALENDAR
======================
Quarter    Income Period        Due Date
Q1         Jan 1 - Mar 31      April 15
Q2         Apr 1 - May 31      June 15
Q3         Jun 1 - Aug 31      September 15
Q4         Sep 1 - Dec 31      January 15 (following year)

Payment methods:
- IRS Direct Pay (irs.gov/payments)
- EFTPS (Electronic Federal Tax Payment System)
- IRS2Go app
- Check mailed with Form 1040-ES voucher
```

### Safe Harbor Calculation

```
ESTIMATED PAYMENT CALCULATOR
=============================
Method 1: 90% of current year tax
  Estimated total tax this year:    $__________
  x 90%:                            $__________
  Divided by 4:                     $__________ per quarter

Method 2: 100% of prior year tax (110% if AGI > $150k)
  Total tax from last year's return: $__________
  x 100% (or 110%):                 $__________
  Divided by 4:                      $__________ per quarter

USE THE LOWER of Method 1 or Method 2 to determine safe harbor.
```

---

## Common Deductions Checklist

### Standard Deduction (2024)
- Single: $14,600
- Married Filing Jointly: $29,200
- Head of Household: $21,900
- Additional $1,550 if 65+ or blind (single); $1,300 (married)

### Itemized Deductions (only if total exceeds standard deduction)

```
ITEMIZED DEDUCTIONS WORKSHEET
==============================
                                                Amount
Medical expenses (only amount exceeding
  7.5% of AGI):                                $__________

State and local taxes (SALT) -- capped at
  $10,000 total:
  State income tax or sales tax:               $__________
  Property tax:                                $__________
  SALT TOTAL (max $10,000):                    $__________

Mortgage interest (on up to $750k of debt):    $__________

Charitable contributions:
  Cash donations:                              $__________
  Non-cash donations (fair market value):      $__________
  Charitable mileage (14 cents/mile):          $__________

Casualty and theft losses (federally
  declared disasters only):                    $__________

TOTAL ITEMIZED DEDUCTIONS:                     $__________

Compare to standard deduction: $__________
USE THE HIGHER AMOUNT
```

### Above-the-Line Deductions (Available Even with Standard Deduction)
- Traditional IRA contributions (up to $7,000; $8,000 if 50+)
- Student loan interest (up to $2,500)
- HSA contributions
- Self-employment tax (50%)
- Self-employed health insurance premiums
- Educator expenses (up to $300)
- Alimony (for agreements before 2019)

---

## Tax-Advantaged Accounts

### HSA (Health Savings Account)
- **Requirements:** Must have a High Deductible Health Plan (HDHP)
- **2024 limits:** $4,150 individual / $8,300 family (+$1,000 catch-up if 55+)
- **Triple tax advantage:** Tax-deductible contribution, tax-free growth, tax-free withdrawals for qualified medical expenses
- **Strategy:** Contribute the max, invest it, pay medical expenses out of pocket, let HSA grow for retirement

### FSA (Flexible Spending Account)
- **2024 limit:** $3,200 (health); $5,000 (dependent care)
- **Use-it-or-lose-it:** Must spend by plan deadline (some plans allow $640 rollover)
- **Pre-tax:** Reduces taxable income

### 529 College Savings Plan
- **State tax deduction:** Many states offer deductions for contributions (check your state)
- **Tax-free growth:** No federal tax on earnings
- **Tax-free withdrawals:** For qualified education expenses
- **Superfunding:** Can contribute up to 5 years of gift tax exclusion at once ($90,000 in 2024)
- **New rule (2024+):** Unused 529 funds can be rolled to a Roth IRA (up to $35,000 lifetime, subject to conditions)

---

## Filing Status Optimization

### Head of Household vs. Single
If you are unmarried with a qualifying dependent, Head of Household gives you:
- Higher standard deduction ($21,900 vs $14,600)
- More favorable tax brackets
- **Requirements:** Unmarried on Dec 31, paid >50% of household costs, qualifying person lived with you >6 months

### Married Filing Jointly vs. Separately
- **Jointly** is almost always better (lower rates, more deductions, more credits)
- **Separately** may help when: one spouse has high medical expenses, income-driven student loan payments, or one spouse has tax liability concerns
- **Warning:** Filing separately disqualifies many credits (Child Tax Credit, EITC, education credits) and limits IRA deductions

---

## Record-Keeping Requirements

### What to Keep and How Long

| Document | Retention Period |
|----------|-----------------|
| Tax returns | Permanently |
| W-2s, 1099s | 7 years |
| Receipts for deductions | 7 years |
| Investment purchase records | Until sold + 7 years |
| Home purchase/improvement records | Until sold + 7 years |
| Business records | 7 years |
| Property tax records | Until property sold + 7 years |

### Organization System

```
RECOMMENDED FOLDER STRUCTURE (physical or digital)
===================================================
/Tax Year 20XX/
  /Income/
    - W-2s
    - 1099s (NEC, INT, DIV, B, R, etc.)
    - K-1s
  /Deductions/
    - Mortgage interest (Form 1098)
    - Property tax bills
    - Charitable receipts
    - Medical receipts
    - Business expenses
  /Payments/
    - Estimated tax payment confirmations
    - Extension filing confirmation
  /Filed Return/
    - Federal return (signed copy)
    - State return (signed copy)
    - E-file confirmation
```

---

## Tax Deadline Calendar

```
KEY TAX DATES
=============
January 15    Q4 estimated tax payment due
January 31    Employers must send W-2s; payers must send 1099s
February 15   Deadline to submit new W-4 to claim exemption
March 15      S-Corp and Partnership returns due (Form 1065, 1120-S)
April 15      Individual tax returns due (Form 1040)
              Q1 estimated tax payment due
              Last day for prior-year IRA contributions
              Last day to file extension (Form 4868) -- extends to Oct 15
June 15       Q2 estimated tax payment due
              Expat filing deadline (automatic 2-month extension)
September 15  Q3 estimated tax payment due
October 15    Extended individual returns due
```

---

## Common Tax Credits

| Credit | Amount | Who Qualifies |
|--------|--------|--------------|
| Child Tax Credit | Up to $2,000/child | Children under 17, income limits |
| Earned Income Tax Credit | Up to $7,430 (2024) | Low-to-moderate income, varies by dependents |
| Child and Dependent Care Credit | Up to $3,000 (1 child) / $6,000 (2+) | Childcare costs to enable work |
| American Opportunity Credit | Up to $2,500/student | First 4 years of higher education |
| Lifetime Learning Credit | Up to $2,000/return | Any post-secondary education |
| Saver's Credit | Up to $1,000 ($2,000 MFJ) | Low-income retirement savers |
| EV Tax Credit | Up to $7,500 | New qualifying electric vehicle purchase |

---

## Output Format

When providing tax guidance, deliver:

1. **Situation summary** -- Filing status, income types, key factors
2. **Standard vs. itemized analysis** -- Which deduction method saves more
3. **Deductions and credits identified** -- Complete list with estimated values
4. **Tax-advantaged account recommendations** -- What to contribute and where
5. **Estimated tax liability** -- Rough calculation with effective rate
6. **Action items** -- Specific steps and deadlines
7. **Records to gather** -- Documents needed for filing
8. **Professional referral note** -- Recommend CPA/EA for complex situations

## Example

**Input:** "I started freelancing this year in addition to my full-time job. I have made $12,000 from freelance work. What do I need to know about taxes?"

**Output:**

## Tax Guide: Freelance Side Income

**Situation:** W-2 employee + $12,000 freelance income
**Key change:** You now have self-employment income, which has different tax rules

### What You Owe (Framework)
| Tax | Rate | On $12,000 |
|-----|------|-----------|
| Federal income tax | Your marginal rate (22-24% typical) | ~$2,640-$2,880 |
| Self-employment tax | 15.3% (Social Security + Medicare) | ~$1,696 |
| State income tax | [JURISDICTION: varies by state] | Varies |
| **Estimated total** | **~37-40%** | **~$4,400-$4,800** |

### Critical Action Items
1. **Quarterly estimated taxes:** You likely owe quarterly payments (due Jan 15, Apr 15, Jun 15, Sep 15). Underpayment penalty applies if you owe more than $1,000 at filing. Use IRS Form 1040-ES.

2. **Deductible expenses:** Track ALL business expenses to reduce taxable income:
   - Software and tools used for freelance work
   - Home office (if dedicated space): simplified method = $5/sqft up to 300 sqft
   - Internet (business-use percentage)
   - Professional development and courses
   - Health insurance premiums (if not covered by employer)

3. **Document everything:** Save all receipts. Use a separate bank account or credit card for freelance transactions.

### Tax Forms You Will Need
- Schedule C (business profit/loss)
- Schedule SE (self-employment tax)
- Form 1040-ES (quarterly estimated payments)
- 1099-NEC from each client paying you $600+

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
