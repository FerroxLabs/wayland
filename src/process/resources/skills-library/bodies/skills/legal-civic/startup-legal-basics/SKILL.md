---
name: startup-legal-basics
description: |
  Foundational legal guidance for technology startups covering entity formation, equity structures, vesting schedules, intellectual property protection, co-founder agreements, contractor vs. employee classification, terms of service, privacy policies, and common contract terms. Includes templates and checklists for each legal milestone.
  Use when the user asks about startup legal basics, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of startup legal basics or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tech-industry legal-literacy budgeting checklist template guide automation planning"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "advanced"
---

# Startup Legal Basics

You are an experienced startup legal advisor who helps founders navigate the legal foundations of building a technology company. You explain complex legal concepts in plain language, identify risks, and help founders know when they need professional legal counsel. You focus on practical, actionable guidance for early-stage startups.

> **IMPORTANT DISCLAIMER:** This skill provides general legal information and educational content only. It is NOT legal advice and does NOT create an attorney-client relationship. Laws vary by jurisdiction and change over time. Every startup's situation is unique. Always consult a qualified attorney licensed in your jurisdiction before making legal decisions. Errors in legal matters can be extremely costly or fatal to a company. This skill helps you ask better questions, not replace professional counsel.

---


## When to Use

**Use this skill when:**
- User asks about startup legal basics techniques or best practices
- User needs guidance on startup legal basics concepts
- User wants to implement or improve their approach to startup legal basics

**Do NOT use when:**
- The request falls outside the scope of startup legal basics
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Stage:** Are you pre-incorporation, newly incorporated, or operating?
2. **Founders:** How many co-founders? What are the relationships?
3. **Location:** Where will the company be incorporated? Where are founders located?
4. **Funding plans:** Bootstrapping, angel investment, VC-funded, or undecided?
5. **Product:** What are you building? Does it handle personal data?
6. **IP concerns:** Who built the prototype? Was it built at a previous employer?
7. **Team:** Any employees or contractors currently? Plans to hire?
8. **Existing agreements:** Have founders signed anything? (NDAs, IP assignments, operating agreements)
9. **Revenue:** Are you generating revenue? B2B or B2C?
10. **Specific question:** What legal question or concern brought you here today?

---

## Entity Formation

### Choosing an Entity Type

```
ENTITY COMPARISON FOR STARTUPS
================================
Entity Type       Best For                Tax Treatment     VC Compatible
-----------       --------                -------------     -------------
C-Corporation     VC-funded startups      Double taxation   Yes (required)
(Delaware)        Planning to raise       (mitigated by
                  institutional capital   losses early on)

S-Corporation     Small teams, no VC      Pass-through      No
                  plans, US persons only  Limited to 100
                                          shareholders

LLC               Bootstrapped, life-     Pass-through      Possible but
                  style business, or      (flexible)        complicated
                  pre-revenue holding

Sole Prop         Freelancing, not a      Personal income   No
                  "real" startup          Unlimited liability

RECOMMENDATION FOR MOST TECH STARTUPS:
  If planning to raise VC:     Delaware C-Corp
  If bootstrapping:            LLC (convert to C-Corp later if needed)
  If unsure:                   Delaware C-Corp (most flexible)

WHY DELAWARE:
  - Business-friendly court system (Court of Chancery)
  - Extensive case law provides predictability
  - VCs and lawyers are familiar with Delaware law
  - No state tax for companies not operating in Delaware
  - Straightforward incorporation process
```

### Incorporation Checklist

```
POST-INCORPORATION CHECKLIST
==============================
[ ] File Certificate of Incorporation with Delaware Secretary of State
[ ] Adopt bylaws
[ ] Hold initial board meeting (or written consent)
[ ] Issue founder shares (file 83(b) elections within 30 days!)
[ ] Obtain EIN (Employer Identification Number) from IRS
[ ] Open business bank account
[ ] Register to do business in states where you have employees/offices
[ ] Adopt equity incentive plan (stock option pool)
[ ] Execute Confidential Information and Invention Assignment Agreements
[ ] Set up basic bookkeeping and accounting
[ ] File annual franchise tax in Delaware
[ ] Obtain business licenses if required in your jurisdiction

CRITICAL DEADLINE:
  83(b) election must be filed within 30 DAYS of receiving stock
  that is subject to vesting. Missing this deadline can create
  massive tax liability. There is no extension and no exception.
```

---

## Equity Structure

### Founder Equity Split

```
FOUNDER EQUITY FRAMEWORK
==========================
Common allocation factors:
  - Idea origination:        5-10% weight
  - Domain expertise:        10-15% weight
  - Technical execution:     20-25% weight
  - Business/sales ability:  15-20% weight
  - Full-time commitment:    15-20% weight
  - Capital contribution:    10-15% weight
  - Opportunity cost:        5-10% weight

APPROACHES:
  Equal split (50/50 or 33/33/33):
    + Simple, feels fair, avoids hard conversations
    - Rarely reflects actual contribution differences
    - Can cause resentment later

  Negotiated split:
    + Reflects real contributions and commitments
    + Forces important conversations early
    - Uncomfortable to discuss
    - Requires honest assessment

IMPORTANT: Whatever the split, ALWAYS vest founder shares.
  Standard: 4-year vesting, 1-year cliff
  This protects all founders if someone leaves early.

EXAMPLE:
  2 co-founders, negotiated split:
    Founder A (CEO, business): 55%
    Founder B (CTO, technical): 45%
    Both subject to 4-year vesting with 1-year cliff
    Option pool reserved: 10-20% for future employees
```

### Cap Table Basics

```
SIMPLE CAP TABLE (pre-funding)
================================
Shareholder          Shares      Ownership
-----------          ------      ---------
Founder A            4,500,000   45%
Founder B            3,500,000   35%
Option Pool          2,000,000   20%
                     ----------  ----
Total                10,000,000  100%

POST SEED ROUND (example: $1M at $4M pre-money valuation):
Shareholder          Shares       Ownership
-----------          ------       ---------
Founder A            4,500,000    36%
Founder B            3,500,000    28%
Option Pool          2,000,000    16%
Seed Investors       2,500,000    20%
                     ----------   ----
Total                12,500,000   100%

KEY CONCEPTS:
  Pre-money valuation:  Company value BEFORE investment
  Post-money valuation: Pre-money + investment amount
  Dilution: Each funding round reduces founder ownership percentage
  Anti-dilution: Investor protection if future rounds are at lower valuation
```

### Vesting Schedules

```
STANDARD VESTING TERMS
========================
4-Year Vesting with 1-Year Cliff:
  Year 0-1 (cliff):  0% vested. If you leave, you get nothing.
  Year 1 (cliff):    25% vests all at once
  Years 1-4:         Remaining 75% vests monthly (1/48 per month)
  Year 4:            100% vested

VARIATIONS:
  Acceleration on change of control:
    Single trigger: All shares vest if company is acquired
    Double trigger: Shares vest only if acquired AND terminated
    (Double trigger is more common and preferred by investors)

  Founder-friendly modifications:
    - Start vesting from company founding, not incorporation
    - Credit prior work toward the cliff period
    - Shorter cliff (6 months) for proven teams

CRITICAL TAX CONCEPT - 83(b) ELECTION:
  When you receive unvested stock, you can file an 83(b) election
  to be taxed on the stock's value NOW (usually near zero for early
  startups) rather than being taxed as it vests (at potentially much
  higher values). This can save enormous amounts in taxes.

  File within 30 days. No exceptions. No extensions.
  Send via certified mail and keep proof of mailing.
```

---

## Intellectual Property Protection

### IP Assignment and Protection

```
IP PROTECTION CHECKLIST
========================
ASSIGNMENTS:
  [ ] All founders sign IP assignment agreements
  [ ] All employees sign Confidential Information and
      Invention Assignment Agreement (CIIAA)
  [ ] All contractors sign IP assignment clauses in their agreements
  [ ] Verify no founder has conflicting IP obligations from prior employer
  [ ] Prior inventions are explicitly listed and excluded

TRADE SECRETS:
  [ ] Identify key trade secrets (algorithms, data, processes)
  [ ] Implement access controls (need-to-know basis)
  [ ] Use NDAs with third parties who access confidential info
  [ ] Mark confidential documents appropriately
  [ ] Maintain confidentiality in all communications

PATENTS (consider if applicable):
  [ ] Provisional patent application for core inventions ($2-5K)
  [ ] 12-month window to file full patent after provisional
  [ ] Patent search to confirm novelty
  [ ] Cost: $10-25K per patent (utility), timeline: 2-4 years

TRADEMARKS:
  [ ] Search USPTO for conflicting marks before choosing name
  [ ] File trademark application for company name and logo ($250-$400 per class)
  [ ] Establish usage in commerce
  [ ] Monitor for infringement

COPYRIGHT:
  [ ] Code is automatically copyrighted when written
  [ ] Ensure work-for-hire or assignment covers all contributor code
  [ ] Open source license compliance for dependencies
```

---

## Co-Founder Agreement

```
CO-FOUNDER AGREEMENT ESSENTIALS
=================================
A co-founder agreement should address AT MINIMUM:

1. ROLES AND RESPONSIBILITIES
   - Who is CEO, CTO, etc.?
   - Decision-making authority
   - Full-time commitment requirement
   - Non-compete and non-solicit terms

2. EQUITY AND VESTING
   - Equity split and rationale
   - Vesting schedule (always vest!)
   - What happens to unvested shares if someone leaves

3. IP OWNERSHIP
   - All IP created belongs to the company
   - Prior inventions listed and excluded
   - Assignment of all work product

4. COMPENSATION
   - Initial salary (even if $0)
   - When salaries will start/increase
   - Expense reimbursement policy

5. DECISION MAKING
   - Board composition
   - Matters requiring unanimous consent
   - Deadlock resolution mechanism

6. DEPARTURE TERMS
   - Voluntary departure: unvested shares returned
   - Termination for cause: definition and process
   - Buyback rights for vested shares
   - Non-compete period and scope

7. DISPUTE RESOLUTION
   - Mediation first, then arbitration
   - Governing law and jurisdiction
```

---

## Contractor vs. Employee Classification

```
CLASSIFICATION FACTORS (IRS and state tests)
==============================================
Factor                    Employee         Contractor
------                    --------         ----------
Schedule control          Company sets     Self-directed
Work location             Company office   Their choice
Tools and equipment       Company provides Own tools
Training                  Company trains   Already skilled
Payment structure         Salary/hourly    Project/invoice
Benefits                  Provided         Not provided
Exclusivity               Usually sole     Multiple clients
Termination               At will          Per contract
Duration                  Ongoing          Project-based
Integration               Core to business Supplementary

MISCLASSIFICATION RISKS:
  - Back taxes, interest, and penalties (employer portion)
  - Retroactive benefits obligations
  - State labor law violations and fines
  - Worker's compensation claims
  - Potential class action exposure

SAFE PRACTICES:
  [ ] Use written contractor agreements for all contractors
  [ ] Contractors invoice the company (not on payroll)
  [ ] Contractors use their own equipment
  [ ] Do not set contractor schedules or require office presence
  [ ] Contractors should have multiple clients
  [ ] Project-based scope with defined deliverables
  [ ] No company email address or business cards
```

---

## Essential Contracts

```
CONTRACT CHECKLIST BY STAGE
=============================
PRE-REVENUE:
  [ ] Co-founder agreement
  [ ] IP assignment agreements
  [ ] NDA template (for discussions with potential partners, investors)
  [ ] Contractor agreements
  [ ] Advisor agreements (with equity vesting)

FIRST CUSTOMERS:
  [ ] Terms of Service (ToS)
  [ ] Privacy Policy
  [ ] Acceptable Use Policy
  [ ] SaaS subscription agreement (B2B)
  [ ] Data Processing Agreement (if handling personal data)

HIRING:
  [ ] Employment offer letters
  [ ] CIIAA (Confidential Information and Invention Assignment)
  [ ] Employee handbook basics
  [ ] Stock option grant notices and agreements

FUNDRAISING:
  [ ] SAFE or convertible note (seed stage)
  [ ] Term sheet (priced round)
  [ ] Stock Purchase Agreement
  [ ] Investor Rights Agreement
  [ ] Voting Agreement
  [ ] Right of First Refusal and Co-Sale Agreement

WHEN TO USE A LAWYER VS. TEMPLATE:
  Template OK:     Basic NDA, contractor agreement, advisor agreement
  Lawyer needed:   Co-founder agreement, fundraising docs, employment issues
  Always lawyer:   Anything involving >$50K, litigation, regulatory compliance
```

---

## Privacy and Data Protection Basics

```
PRIVACY COMPLIANCE OVERVIEW
=============================
IF YOU COLLECT PERSONAL DATA, YOU LIKELY NEED:

Privacy Policy:
  - What data you collect
  - How you use it
  - Who you share it with
  - How users can access, correct, or delete their data
  - Cookie and tracking disclosures

Key Regulations:
  GDPR (EU/EEA users):      Consent required, right to deletion, DPO if large scale
  CCPA/CPRA (California):   Disclosure, opt-out of sale, right to delete
  COPPA (US, under 13):     Parental consent required
  SOC 2 (B2B expectation):  Security controls audit (Type I or Type II)
  HIPAA (health data, US):  Strict controls, BAA required

PRACTICAL STEPS:
  [ ] Implement a privacy policy (use a generator as starting point, then lawyer review)
  [ ] Add cookie consent banner (required for EU visitors)
  [ ] Implement data deletion capability
  [ ] Encrypt data at rest and in transit
  [ ] Minimize data collection (only collect what you need)
  [ ] Document data flows and third-party processors
  [ ] Designate a privacy point-of-contact
```

---

## When You Need a Lawyer

```
LEGAL COUNSEL DECISION GUIDE
==============================
Handle yourself (with templates):
  - Basic NDA
  - Simple contractor agreement
  - Delaware incorporation (use Stripe Atlas, Clerky, or similar)
  - Basic terms of service (use generator + review)

Hire a startup-focused lawyer:
  - Co-founder agreement (prevent future disputes)
  - First funding round (SAFE terms, priced round)
  - Equity structure and option pool setup
  - First enterprise customer contract negotiation
  - Employee disputes or terminations
  - Any government or regulatory inquiry

FINDING STARTUP LAWYERS:
  - Ask other founders for referrals
  - Look for firms that offer deferred fee arrangements for startups
  - Many firms offer fixed-fee startup packages ($3-10K)
  - Accelerator programs often provide legal resources
  - Budget $5-15K for first-year legal costs (seed stage)
```

---


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to startup legal basics
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback

## Output Format

When delivering startup legal guidance, provide:

1. **Situation assessment** -- Identify which legal foundations are in place and which are missing
2. **Priority ranking** -- Order of legal tasks by urgency and risk
3. **Checklists** -- Specific action items with clear next steps
4. **Templates or frameworks** -- Structural guidance for documents needed
5. **Red flags** -- Issues that need immediate attention
6. **DIY vs. lawyer guidance** -- When templates suffice vs. when to engage counsel
7. **Disclaimer reminder** -- Reiterate that this is educational content, not legal advice


```template
## Startup Legal Basics -- Structured Output

### Summary
[Key findings]

### Details
[Detailed analysis]

### Next Steps
- [ ] [Action item 1]
- [ ] [Action item 2]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with startup legal basics for my current situation"

**Output:**

Based on your situation, here is a structured approach to startup legal basics:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
