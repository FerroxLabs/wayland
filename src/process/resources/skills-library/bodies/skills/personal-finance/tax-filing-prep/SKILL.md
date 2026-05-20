---
name: tax-filing-prep
description: |
  Walks through the document gathering and organization process for tax filing.
  Produces a personalized document checklist, filing timeline, and organization
  system based on the user's income sources and financial activities. Does NOT
  complete tax returns or provide filing advice.
  Use when the user asks about preparing to file taxes, what documents they need
  for tax season, or how to organize for tax filing.
  Do NOT use for year-end tax planning (use year-end-tax-checklist), tracking
  deductions during the year (use tax-deduction-tracker), or understanding
  tax-advantaged accounts (use tax-advantaged-optimizer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tax-planning personal-finance planning checklist"
  category: "personal-finance"
  subcategory: "tax-planning"
  depends: ""
  disclaimer: "educational-finance"
  difficulty: "beginner"
---

# Tax Filing Preparation Guide

> **Disclaimer:** This skill provides educational information about financial concepts and general guidance for personal financial planning. It does NOT constitute financial advice, investment recommendations, or tax guidance. Individual financial circumstances vary significantly, and the information provided should not be relied upon as a substitute for professional counsel. Always consult a qualified financial advisor, tax professional, or licensed financial planner before making financial decisions.

## When to Use

**Use this skill when:**
- User asks what documents they need to file their taxes
- User wants help organizing for tax season
- User asks how to prepare for meeting with a tax professional
- User needs a checklist of tax documents to gather
- User is filing taxes for the first time and needs guidance on the process

**Do NOT use this skill when:**
- User wants year-end tax planning strategies (use `year-end-tax-checklist`)
- User wants to track deductions during the year (use `tax-deduction-tracker`)
- User wants to estimate quarterly payments (use `quarterly-tax-estimator`)
- User wants someone to complete their tax return (out of scope -- consult a tax professional)

## Process

1. **Determine the user's filing profile.** Gather:
   - **Filing status:** Single, married filing jointly, married filing separately, head of household, qualifying widow(er) [JURISDICTION: verify available filing statuses]
   - **Income sources:** Employment, self-employment, investments, rental, retirement distributions, other
   - **Life events this year:** Marriage, divorce, new child, home purchase/sale, job change, retirement, relocation
   - **Deduction approach:** Itemizing or standard deduction
   - **Filing method:** Self-filing, tax professional, or undecided

2. **Build the document checklist by category.** For each applicable category, list the specific documents needed:

   **Category A: Identity and Personal Information**
   - Government-issued identification numbers for all filers and dependents [JURISDICTION: verify what identification is required]
   - Prior year tax return (for reference and carryforward items)
   - Bank account information for direct deposit of refund or direct debit of payment

   **Category B: Income Documents**
   - W-2 forms from all employers (expect by [JURISDICTION: verify employer deadline to provide W-2])
   - 1099 forms for freelance, contract, or gig income [JURISDICTION: verify form name and deadline]
   - Investment income statements (dividends, interest, capital gains) [JURISDICTION: verify form names]
   - Retirement distribution statements [JURISDICTION: verify form names]
   - Rental income records (if applicable)
   - Social security or government benefit statements [JURISDICTION: verify form names]
   - Any other income documentation (alimony received, gambling winnings, etc.)

   **Category C: Deduction Documents (if itemizing)**
   - Mortgage interest statement from lender [JURISDICTION: verify form name]
   - Property tax bills or payment records
   - Charitable donation receipts and acknowledgment letters
   - Medical expense records (amounts paid minus insurance reimbursements)
   - State and local tax payment records
   - Education expense statements [JURISDICTION: verify form names]

   **Category D: Self-Employment Documents (if applicable)**
   - Business income records (invoices, payment receipts, bank statements)
   - Business expense records with receipts by category
   - Mileage log for business driving
   - Home office measurements and expense records
   - Equipment and asset purchase records
   - Business insurance records

   **Category E: Tax Credit Documents (if applicable)**
   - Childcare expense records and provider identification [JURISDICTION: verify form requirements]
   - Education credits documentation (tuition statements) [JURISDICTION: verify form names]
   - Energy efficiency improvement records [JURISDICTION: verify if credits available]
   - Health insurance marketplace statements [JURISDICTION: verify form name if applicable]

   **Category F: Other Documents**
   - Student loan interest statement [JURISDICTION: verify form name]
   - Health savings account contribution and distribution records [JURISDICTION: verify form names]
   - IRA contribution records
   - Estimated tax payment records (dates and amounts)
   - Prior year carryforward items (unused capital losses, charitable contributions)

3. **Create the filing timeline.** Build a schedule from document arrival through filing:
   - [JURISDICTION: verify] -- Employers begin issuing income documents
   - [JURISDICTION: verify] -- Most tax documents should be received
   - [JURISDICTION: verify] -- Filing season begins (returns accepted)
   - [JURISDICTION: verify] -- Filing deadline (or extension deadline)
   - Include time for review, professional appointment scheduling, and filing

4. **Set up the organization system.** Provide a folder structure:
   - Physical or digital folder for each category (A through F)
   - Tracking checklist to mark documents as received
   - Cross-reference list for documents expected but not yet received
   - Secure storage recommendations for sensitive documents

5. **Prepare for the filing appointment (if using a professional).** Compile:
   - Questions to ask the tax professional about their situation
   - Summary sheet with all income sources and amounts
   - List of life changes and significant financial events
   - Prior year return for comparison

6. **Present the completed preparation package.**

## Output Format

```
## Tax Filing Preparation Package

### Your Filing Profile
- Filing status: [status] [JURISDICTION: verify eligibility]
- Income sources: [list]
- Life events this year: [list or none]
- Deduction approach: [itemizing / standard / undecided]
- Filing method: [self / professional / undecided]

### Document Checklist

#### A. Identity and Personal Information
- [ ] Government identification numbers for all filers [JURISDICTION: verify requirements]
- [ ] Government identification numbers for all dependents
- [ ] Prior year tax return
- [ ] Bank account and routing numbers (for direct deposit/debit)

#### B. Income Documents
| Document | Source | Expected By | Received? |
|----------|--------|-------------|-----------|
| W-2 | [employer name] | [JURISDICTION: verify deadline] | [ ] |
| [Income form] | [source] | [JURISDICTION: verify deadline] | [ ] |
| Investment statements | [institution] | [JURISDICTION: verify deadline] | [ ] |
| [Other forms] | [source] | [JURISDICTION: verify] | [ ] |

#### C. Deduction Documents (if itemizing)
- [ ] Mortgage interest statement
- [ ] Property tax records
- [ ] Charitable donation receipts ($[total])
- [ ] Medical expense records ($[total above threshold])
- [ ] State/local tax records

#### D. Self-Employment Documents (if applicable)
- [ ] Business income total: $[amount]
- [ ] Business expense total: $[amount] (with receipts by category)
- [ ] Mileage log: [total miles]
- [ ] Home office documentation

#### E. Tax Credit Documents
- [ ] [Applicable credits for user's situation]

#### F. Other Documents
- [ ] Student loan interest statement
- [ ] HSA/IRA contribution records
- [ ] Estimated tax payment records
- [ ] Prior year carryforward items

### Filing Timeline

| Date | Action |
|------|--------|
| [JURISDICTION: verify] | Begin receiving tax documents |
| [JURISDICTION: verify] | Most documents should arrive |
| [JURISDICTION: verify] | Review all documents for accuracy |
| [JURISDICTION: verify] | Filing season opens |
| [2 weeks before deadline] | File return or schedule professional |
| [JURISDICTION: verify] | Filing deadline |
| [JURISDICTION: verify] | Extension deadline (if needed) |

### Organization System
Create these folders (physical or digital):
1. **Income** -- All W-2s, 1099s, and income statements
2. **Deductions** -- Receipts and statements for deductible items
3. **Business** -- Self-employment income and expenses (if applicable)
4. **Credits** -- Documentation for tax credits claimed
5. **Reference** -- Prior year return, notes, and questions
6. **Filed** -- Copy of completed return and confirmation

### If Meeting with a Tax Professional
Bring:
- [ ] All documents from the checklist above
- [ ] Prior year tax return
- [ ] Summary of income by source
- [ ] List of life events and changes this year
- [ ] Questions about your specific situation
- [ ] Notes on anything you are unsure about

### Document Verification Checklist
Before filing, verify:
- [ ] All expected income documents received (compare to bank records)
- [ ] Name and identification numbers match across all documents
- [ ] Prior year carryforward items accounted for
- [ ] All deduction receipts organized and totaled
- [ ] Estimated payments reconciled with payment records

### Important Reminders
- Verify all deadlines with your jurisdiction's tax authority -- they change
- File or request an extension by the deadline to avoid late-filing penalties [JURISDICTION: verify]
- An extension to file is not an extension to pay -- estimated payment may be needed [JURISDICTION: verify]
- Keep copies of your filed return and all supporting documents for [JURISDICTION: verify retention period] years
- Report all income even if you did not receive a formal document
```

## Rules

1. NEVER provide tax filing advice or recommend how to file (self vs. professional)
2. NEVER interpret tax documents or calculate tax liability
3. NEVER state specific document deadlines as facts -- always use [JURISDICTION: verify]
4. ALWAYS remind the user to verify all deadlines and requirements with their jurisdiction
5. Include all document categories relevant to the user's income sources and situation
6. Include the filing timeline with jurisdiction-placeholder deadlines
7. Include the organization system recommendation (folder structure)
8. Note that extensions to file are not extensions to pay [JURISDICTION: verify]
9. Recommend keeping copies of filed returns and supporting documents
10. If the user is filing for the first time, include extra context about the overall process flow

## Edge Cases

- **First-time filer:** Provide additional context about the overall tax filing process: what a tax return is, why it is filed, and what the possible outcomes are (refund, balance due, break even). Include guidance on choosing between self-filing and using a professional.
- **User has income from multiple states or countries:** Note that separate returns may be required for each jurisdiction. The document checklist should include income allocated by jurisdiction. Recommend a tax professional experienced in multi-jurisdiction filing.
- **User has investment income with complex transactions:** Include capital gains/losses worksheets, wash sale adjustments, and cost basis documentation. Note that brokerage statements may need reconciliation. Flag that complex investment situations benefit from professional preparation.
- **User missed the filing deadline:** Note that filing late is better than not filing. Late-filing and late-payment penalties are separate [JURISDICTION: verify penalty rates]. The user should file as soon as possible and pay any estimated balance due to minimize penalties.
- **User is missing a document they expected to receive:** Check with the issuer first. If the document does not arrive, the user may need to use their own records (bank statements, pay stubs) to report the income. Note that tax authorities generally receive copies of income documents -- unreported income is likely to be noticed.
- **User wants to know if they need to file at all:** Explain that filing requirements depend on income level, filing status, and age [JURISDICTION: verify filing threshold for each status]. Even below the threshold, filing may be beneficial to claim refundable credits or recover withheld taxes.

## Example

**Input:** "I need to get organized for tax season. I have a full-time job, did some freelance work on the side, and bought a house this year. What do I need to gather?"

**Output:**

## Tax Filing Preparation Package

### Your Filing Profile
- Filing status: [Confirm -- single, married, etc.?]
- Income sources: W-2 employment + freelance/self-employment
- Life events: Home purchase this year
- Deduction approach: Worth evaluating itemizing (mortgage interest + property taxes may exceed standard deduction)
- Filing method: [Your preference -- self or professional?]

### Document Checklist

#### A. Identity and Personal Information
- [ ] Government identification numbers for all filers [JURISDICTION: verify]
- [ ] Prior year tax return (for reference)
- [ ] Bank account and routing numbers for refund deposit

#### B. Income Documents
| Document | Source | Expected By | Received? |
|----------|--------|-------------|-----------|
| W-2 | Full-time employer | [JURISDICTION: verify] | [ ] |
| Freelance income forms | Each client who paid above threshold | [JURISDICTION: verify] | [ ] |
| Interest/dividend statements | Bank and investment accounts | [JURISDICTION: verify] | [ ] |

Note: Track freelance income yourself even if clients do not issue formal documents. All income is reportable.

#### C. Deduction Documents (Evaluate Itemizing)
- [ ] **Mortgage interest statement** from lender [JURISDICTION: verify form name] -- This is new for you this year
- [ ] **Property tax records** -- Amount paid at closing and any payments since
- [ ] **Closing disclosure** from home purchase -- Shows points paid, property taxes prorated at closing
- [ ] Charitable donation receipts
- [ ] State/local tax records
- [ ] Medical expenses (if significant)

Itemization check: Mortgage interest + property taxes + SALT + charitable = $____
vs. standard deduction [JURISDICTION: verify amount for your filing status]

#### D. Self-Employment Documents (Freelance Income)
- [ ] Total freelance income received: $[amount]
- [ ] Business expense receipts organized by category:
  - Software/tools: $____
  - Equipment: $____
  - Professional development: $____
  - Other business expenses: $____
- [ ] Mileage log (if you drove for freelance work)
- [ ] Home office documentation (if applicable)
- [ ] Record of estimated tax payments made (if any)

#### E. Home Purchase Documents
- [ ] Closing disclosure (HUD-1 or equivalent)
- [ ] Mortgage interest paid from closing date through year end
- [ ] Property taxes paid (both at closing and after)
- [ ] Points paid on mortgage origination [JURISDICTION: verify deductibility]
- [ ] Private mortgage insurance premiums [JURISDICTION: verify if deductible]

#### F. Other Documents
- [ ] Student loan interest statement (if applicable)
- [ ] Retirement account contribution records
- [ ] HSA contribution records (if applicable)
- [ ] Health insurance documentation

### Filing Timeline

| Timeframe | Action |
|-----------|--------|
| [JURISDICTION: verify] | Expect W-2 and freelance income forms to arrive |
| [JURISDICTION: verify] | Mortgage interest and property tax documents arrive |
| By mid-filing-season | Review all documents for accuracy and completeness |
| [JURISDICTION: verify] | File return or schedule tax professional appointment |
| [JURISDICTION: verify] | Filing deadline |

### Special Notes for Your Situation

**First-year homeowner:** Your closing disclosure is a key document. It shows mortgage interest, property taxes, and points that may be deductible. Keep it with your tax documents.

**Freelance income with a day job:** You have two types of income requiring different tax treatment. W-2 income has taxes withheld; freelance income does not. Verify whether your W-2 withholding covered the additional tax on freelance income. If not, you may owe a balance and should consider quarterly estimated payments next year.

### Next Steps
- [ ] Start a folder system now (do not wait for documents to arrive)
- [ ] Calculate freelance income total from bank deposits or invoices
- [ ] Locate your closing disclosure from the home purchase
- [ ] Decide whether to self-file or use a professional (your situation has some complexity)
- [ ] Set reminders for document deadlines
- [ ] Consider setting up a deduction tracker for next year (use `tax-deduction-tracker`)
