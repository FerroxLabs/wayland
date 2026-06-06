---
name: offer-letter
description: |
  Creates a structured job offer letter with role details, compensation package, start date, conditions of employment, and expiration date in a professional format. Use when the user asks about writing an offer letter, job offer, employment offer, or extending an offer to a candidate.
  Do NOT use for rejection letters (use rejection-letter), job descriptions (use job-description), or employment contracts which require legal review.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "template email planning checklist strategy"
  category: "business-strategy"
  subcategory: "human-resources"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Offer Letter

## When to Use

**Use this skill when:**
- A recruiter, HR professional, founder, or hiring manager needs to draft a formal job offer letter for a candidate they have decided to hire
- The user wants to structure a full compensation package (base salary, bonus, equity, signing bonus, benefits) into a professional written offer
- The user needs to extend a verbal offer in writing and wants a document the candidate can sign and return
- The user is onboarding their first employees and needs a reusable offer letter framework that reflects their employment type and jurisdiction
- The user needs to issue an offer letter for a promotion, internal transfer, or conversion from contractor to full-time employee
- The user is offering a role with a complex compensation structure (RSUs, performance bonuses, commission, deferred compensation) and needs each component stated precisely and unambiguously
- The user wants to confirm an offer that was verbally extended and needs the written document to match those terms exactly

**Do NOT use this skill when:**
- The user needs a full employment contract with negotiated terms, termination clauses, garden leave provisions, or detailed restrictive covenants -- those require legal counsel and are fundamentally different documents (use a contract drafting service or employment attorney)
- The user wants to write a candidate rejection letter (use `rejection-letter`)
- The user needs to create a job posting or job description (use `job-description`)
- The user wants help negotiating salary or deciding what compensation to offer -- this skill writes the offer, it does not help set compensation benchmarks
- The user needs an Independent Contractor Agreement or Statement of Work for a freelancer -- those are separate legal instruments governing a non-employment relationship
- The user is outside the US and needs jurisdiction-specific compliance guidance that supersedes general best practices -- flag this early and recommend local employment counsel or an Employer of Record (EOR) service
- The user is dealing with a union employee -- unionized positions are governed by a Collective Bargaining Agreement (CBA) and offer letters must conform to negotiated terms; recommend HR/labor relations counsel

---

## Process

### Step 1: Gather All Required Information Before Writing

Do not begin drafting until you have the following. If the user has not provided any of these fields, ask for them explicitly -- an offer letter with placeholders is worse than asking two clarifying questions.

- **Candidate details:** Full legal name as it should appear on a signed document, candidate's mailing address (required if sending a physical letter or for record-keeping)
- **Role details:** Exact job title (this becomes the legal title of record), department, reporting manager name and title, FLSA classification (exempt or non-exempt in the US), employment type (full-time, part-time, temporary, fixed-term)
- **Work arrangement:** Primary office location with city and state, remote vs. hybrid vs. fully in-office, if hybrid -- specific cadence (e.g., "3 days per week in the Austin, TX office")
- **Start date:** Confirmed or proposed. If proposed, flag that it should be confirmed before sending. Allow at least 2 weeks from the offer date -- most candidates have notice obligations.
- **Compensation -- base salary:** Annual figure, pay frequency (bi-weekly = 26 pay periods, semi-monthly = 24 pay periods, monthly = 12 pay periods). Calculate the gross per-pay-period amount yourself and include it.
- **Compensation -- variable pay:** Bonus target as a percentage of base AND as a dollar amount. Timing of payment (annual, quarterly). Performance criteria basis (individual, company, or both). First-year proration logic (from start date or from a specific measurement period).
- **Compensation -- equity:** Type (ISOs, NSOs, RSUs, or phantom equity). Number of units/shares. Vesting schedule (standard: 4-year with 1-year cliff). Strike price for options if known. Subject to board approval language is mandatory. Reference to the equity plan document.
- **Compensation -- signing bonus:** Amount, timing of payment (first paycheck vs. within X days of start), clawback period and repayment terms (standard: 12 months, prorated or full repayment depending on the company)
- **Benefits:** Key benefits to call out -- health insurance effective date (first day or after 30/60/90 days), 401(k) details including match percentage and vesting schedule, PTO days or policy type (accrual vs. unlimited), any notable benefits (parental leave, stipends, professional development budget)
- **Conditions of employment:** Background check (criminal, credit, or both), reference verification, drug screening, proof of right to work, required agreement execution (PIIA -- Proprietary Information and Inventions Agreement, NDA, non-compete if applicable and jurisdiction permits)
- **Offer expiration:** Standard is 5--7 business days. For senior roles, 7--10 business days is appropriate to allow candidates to manage notice obligations and competing offers without unnecessary pressure.
- **Authorized signatory:** Name and title of the company representative signing the offer (CEO, VP HR, Head of People -- this should be a person with authority to make employment commitments)
- **Acceptance instructions:** Email address or DocuSign link, physical return address if applicable

### Step 2: Determine Jurisdiction and Employment Classification

This step prevents costly errors. Apply the following framework before writing a single line of the offer:

- **At-will employment:** In the US, 49 states and DC are at-will employment states (Montana is the exception, where for-cause termination protections apply after a probationary period). Include standard at-will language for all US employees unless the user specifies a fixed-term or contract employment arrangement.
- **FLSA classification:** Exempt employees are paid a salary and are not entitled to overtime. Non-exempt employees must be paid overtime (1.5x) for hours over 40 per week. The FLSA salary threshold for exempt classification is currently $684 per week ($35,568 annually) at the federal level, but some states (California, New York, Colorado, Washington) have higher thresholds. Flag this if the offered salary is below $60,000 -- the classification may need review.
- **California-specific flags:** California employment law is significantly more protective. Non-compete agreements are generally unenforceable. There are mandatory rest and meal break provisions. Equity acceleration and severance language must comply with California case law. If the employee is in California, flag all non-compete or non-solicitation language and recommend legal review.
- **State-specific paid leave:** Several states (California, New York, New Jersey, Washington, Massachusetts, Colorado) have mandatory paid family and medical leave programs that must be disclosed. Do not omit this if the user is in one of these states.
- **Contractor vs. employee misclassification:** If the user describes a role that sounds like an independent contractor relationship (project-based, the person sets their own hours, provides their own tools), flag this. Misclassification carries significant legal and tax liability. An offer letter is for employees only.

### Step 3: Structure the Compensation Section with Precision

This is the highest-stakes section of the offer letter. Errors here create disputes, damage trust, and may constitute misrepresentation. Apply these rules:

- **Base salary:** Always state as annual AND per-pay-period. Show your math. Example: "$165,000 per year, paid semi-monthly in gross installments of $6,875.00 before applicable taxes and deductions."
  - Pay period calculation: Annual ÷ 26 for bi-weekly, ÷ 24 for semi-monthly, ÷ 12 for monthly
  - Never state net pay -- the employer cannot promise net amounts because tax withholding varies by employee
- **Bonus structure:** State target percentage AND dollar equivalent. Define the triggering conditions with specificity -- "based on individual and company performance as determined by the Board" is acceptable; "you will receive a bonus" is not (it implies a guaranteed bonus, which creates legal obligation). Always prorate the first year with an explicit formula: "Your 2026 bonus will be prorated based on the number of days worked in 2026 as a fraction of 365."
- **Equity -- stock options vs. RSUs:** Options have a strike price (exercise price), meaning the employee must pay to acquire shares -- they have value only if the company's valuation exceeds the strike price. RSUs are grants of stock that vest and are received outright. The offer letter must specify which type is being offered. For options: include the exercise price if determined (it must be fair market value at grant, per Section 409A of the IRS code). For RSUs: state the number of shares and vesting schedule.
- **Equity vesting schedule specifics:** Standard is 4-year vesting with a 1-year cliff (25% vest after 12 months of continuous employment, the remaining 75% vests monthly over the next 36 months -- 2.0833% per month). Some companies use quarterly vesting after the cliff. Always state the minimum employment threshold for the cliff to apply.
- **Signing bonus clawback language:** A signing bonus without a clawback clause is a gift. Standard language: "If you voluntarily resign or are terminated for cause within 12 months of your start date, you agree to repay the full amount of the signing bonus. If you resign or are terminated for cause between 12 and 24 months of your start date, you agree to repay 50% of the signing bonus." Some companies use prorated repayment (repay X/12 for each month remaining in the first year).
- **Commission-based roles:** For sales or revenue-generating roles, reference the Sales Compensation Plan as a separate document. Do not embed the full commission structure in the offer letter -- state the On-Target Earnings (OTE) clearly: "Your annual OTE is $200,000, consisting of a $100,000 base salary and a $100,000 variable commission at 100% quota attainment. Full details are provided in the Commission Plan document, which will be provided prior to your start date."

### Step 4: Write Conditions of Employment Accurately

Conditions protect the company and set clear expectations. Include only conditions the company actually enforces -- listing a drug test you never conduct creates liability if you fail to conduct it.

- **Background check:** Specify what type (criminal history, credit history, professional license verification, education verification). Under the Fair Credit Reporting Act (FCRA), employers must provide a separate disclosure and obtain written consent before running a background check -- this disclosure is NOT part of the offer letter but should be sent concurrently. Note in the offer letter: "This offer is contingent upon the successful completion of a background check in accordance with applicable law."
- **Work authorization:** Use language such as "verification of your legal right to work in the United States, as required by Form I-9." Do not ask for citizenship status -- that is discriminatory. Do not ask which specific documents the candidate will present -- that is also a violation.
- **Required agreements:** List the agreements by name: Proprietary Information and Inventions Agreement (PIIA), Employee Non-Disclosure Agreement, Arbitration Agreement (if applicable). Note that some states (California, Illinois, New York, others) have restricted mandatory arbitration agreements for employment disputes. Recommend legal review if using arbitration clauses.
- **Non-compete enforceability map:** As of 2024, the FTC has proposed a nationwide ban on non-competes (legal status is contested). State-level bans include California, North Dakota, Oklahoma, Minnesota, and others. Even in states where non-competes are permitted, they must be reasonable in scope, geography, and duration to be enforceable. Do not include a non-compete in the offer letter -- reference it as a separate agreement and flag enforceability risk.
- **Reference checks:** "This offer is contingent upon receipt of satisfactory professional references" is appropriate. Do not promise that employment begins before references are cleared if that is the company's policy.

### Step 5: Set the Tone and Structure of the Letter

The offer letter serves two functions simultaneously: it is a legally meaningful document AND a recruitment tool. A cold, legalistic offer letter can cause a candidate to second-guess their decision. Balance is essential.

- **Opening paragraph:** Express genuine enthusiasm. Reference something specific about the candidate -- their background, a skill they demonstrated, the specific team problem they will solve. Generic "We are pleased to offer" language is sufficient if no specifics are provided, but specific language is more compelling.
- **Length and structure:** 1 to 2 pages is ideal. Use section headers with a table for the position details (scannable and professional). Prose for compensation (because numbers need context). Bullet list for conditions (easy to verify). A single closing paragraph for acceptance instructions.
- **Avoid these phrases:** "This letter constitutes a contract of employment" (it should not, unless intended), "guaranteed bonus" (implies contractual obligation), "permanent position" (implies job security that at-will doctrine does not support), "continued employment" without qualification (same issue).
- **Tone for different seniority levels:** Entry-level and mid-level offers should be warm and welcoming. Executive offers (VP and above) should be warm but note that a separate employment agreement will govern the detailed terms -- the offer letter for executives is a term sheet, not the full agreement.

### Step 6: Build the Acceptance Mechanism

The acceptance mechanism turns the letter into a completed agreement. It must be practical and legally adequate.

- **Physical signature with return by date:** Old-fashioned but still common. Include two signed copies: one the candidate keeps, one the company keeps.
- **Electronic signature:** DocuSign, HelloSign (now Dropbox Sign), and Adobe Sign are all legally valid under the ESIGN Act (US) and similar laws in other jurisdictions. Specify the platform if the user is using one.
- **Offer expiration:** State the exact date, not a number of days. "This offer expires at 11:59 PM Pacific Time on [specific date]" is clearer than "within 7 business days." For senior roles, extensions can be granted but must be documented.
- **Counterpart execution:** For multi-location companies, note that the letter may be executed in counterparts (each party signs a copy and both have the same legal effect).
- **Acceptance by email:** Some companies accept a simple email from the candidate stating "I accept the offer as described." This is legally valid in most US jurisdictions but a signed copy provides cleaner documentation. Recommend requiring signature.

### Step 7: Review Before Finalizing

Apply a pre-send checklist before delivering the draft to the user:

- Are all salary figures calculated correctly? (Annual ÷ pay periods = gross per period -- show this math)
- Is the FLSA classification stated and correct for the compensation level?
- Does the at-will statement appear if the jurisdiction requires/permits it?
- Does equity language include "subject to board approval"?
- Does the signing bonus have a clawback clause?
- Is the offer expiration date a specific calendar date?
- Are conditions limited to what the company will actually enforce?
- Is the authorized signatory identified?
- Is there an acceptance mechanism (signature line or digital signature instruction)?
- Are benefits described at a summary level with a reference to full details during onboarding? (Detailed benefit descriptions belong in the benefits guide, not the offer letter.)
- If the candidate is in California, New York, or another highly regulated state -- is there a flag for legal review?

---

## Output Format

```
[Company Name]
[Company Address, City, State ZIP]

[Letter Date: Month DD, YYYY]

[Candidate Full Legal Name]
[Candidate Address, City, State ZIP]

Dear [Candidate First Name],

We are thrilled to offer you the position of [Job Title] at [Company Name]. 
[One to two sentences specific to this candidate -- what stood out, what they will contribute, 
why the team is excited. Example: "Your experience scaling product operations at a Series B company 
and your clear framework for cross-functional alignment made you the standout choice for this role."]

We look forward to having you join the [Department/Team] and believe you will make an immediate 
and lasting impact.

───────────────────────────────────────────────────────────

POSITION DETAILS

| Field                  | Details                                                |
|------------------------|--------------------------------------------------------|
| Job Title              | [Exact Job Title]                                      |
| Department             | [Department Name]                                      |
| Reports To             | [Manager Name], [Manager Title]                        |
| Employment Type        | Full-Time / Part-Time / Temporary / Fixed-Term         |
| FLSA Classification    | Exempt / Non-Exempt                                    |
| Work Location          | [City, State] -- [Remote / Hybrid: X days/week in office / On-site] |
| Proposed Start Date    | [Day, Month DD, YYYY]                                  |

───────────────────────────────────────────────────────────

COMPENSATION

Base Salary
Your annual base salary will be $[X,XXX] ($[X,XXX.XX] gross per [bi-weekly / semi-monthly / 
monthly] pay period, before applicable taxes and deductions). [Company Name] processes payroll 
on a [bi-weekly / semi-monthly] basis.

[BONUS -- include if applicable]
You are eligible for a target annual performance bonus of [X]% of your base salary 
($[dollar equivalent]), based on [individual performance / company performance / a combination 
of individual and company performance] as evaluated by [Company Name] in its discretion. 
Bonus payments, if any, are typically made in [Q1 of the following year / within 90 days of 
fiscal year-end]. Your 20XX bonus will be prorated based on the number of days worked in 20XX 
as a proportion of the full calendar year. Bonus eligibility requires active employment on the 
date of payment.

[EQUITY -- include if applicable]
Subject to approval by the Board of Directors and the terms of the Company's [Year] Equity 
Incentive Plan, you will be granted [X,XXX] [Incentive Stock Options (ISOs) / Non-Qualified 
Stock Options (NSOs) / Restricted Stock Units (RSUs)].

  For Options: These options will carry an exercise price equal to the fair market value of 
  the Company's common stock on the date of grant, as determined by the Board. 

  For RSUs: These RSUs represent the right to receive shares of the Company's common stock 
  upon vesting.

  Vesting: [X,XXX] [options/RSUs] will vest over 4 years, with 25% vesting on the one-year 
  anniversary of your start date (the "cliff") and the remaining 75% vesting in equal [monthly 
  / quarterly] installments over the following [36 / 12] months, subject to your continued 
  employment with the Company. Full terms are governed by the equity plan documents and a 
  separate grant agreement.

[SIGNING BONUS -- include if applicable]
As part of your compensation package, [Company Name] will provide you with a one-time signing 
bonus of $[X,XXX], payable [on your first regular paycheck / within 30 days of your start date], 
subject to applicable withholdings. If you voluntarily resign from the Company or are terminated 
for cause within [12] months of your start date, you agree to repay the full amount of the 
signing bonus. [If a prorated clawback is preferred: "If you voluntarily resign or are terminated 
for cause between your [12] and [24]-month anniversary, you agree to repay a prorated portion 
equal to the number of months remaining in that period divided by 12."]

[RELOCATION -- include if applicable]
[Company Name] will provide a relocation assistance payment of $[X,XXX] to assist with your 
relocation to [City, State], payable [on your first paycheck / within 30 days of start], less 
applicable withholdings. This payment is subject to full repayment if you voluntarily resign 
within [12] months of your start date. [Specify what is and is not covered: e.g., "This 
allowance is intended to cover moving expenses, temporary housing, and travel costs. Itemized 
receipts are not required." or "Actual moving expenses up to $[X,XXX] will be reimbursed upon 
submission of receipts within 90 days of your start date."]

───────────────────────────────────────────────────────────

BENEFITS

You will be eligible to participate in [Company Name]'s benefits program, which currently includes:

- Medical, Dental, and Vision Insurance: Effective [your first day of employment / the first 
  of the month following 30 days of employment]. [Company Name] covers [X]% of the premium 
  for employee coverage.
- 401(k) Retirement Plan: You are eligible to participate [immediately / after 90 days]. 
  [Company Name] matches [X]% of your contributions up to [X]% of your salary, with [immediate 
  / 3-year graded / 4-year cliff] vesting on the company match.
- Paid Time Off: [X days of PTO per year, accrued at X hours per pay period / Unlimited PTO 
  subject to manager approval and business needs]. [X] company holidays per year.
- [Additional benefits: Parental leave (X weeks paid), professional development stipend 
  ($X,XXX annually), remote work stipend, commuter benefits, HSA/FSA, life and disability 
  insurance, etc.]

Complete details of the benefits program, including enrollment deadlines and eligibility 
requirements, will be provided during onboarding.

───────────────────────────────────────────────────────────

CONDITIONS OF EMPLOYMENT

This offer is contingent upon the satisfactory completion of each of the following:

1. A background investigation (criminal history [and/or credit history / and/or education 
   and employment verification]), conducted in accordance with applicable federal and state law. 
   You will receive a separate authorization form as required by the Fair Credit Reporting Act.
2. Verification of your legal authorization to work in the United States, as required by 
   federal law (Form I-9). [Company Name] will require you to present valid identity and work 
   authorization documents on or before your first day of employment.
3. Execution of the Company's [Proprietary Information and Inventions Agreement (PIIA) / 
   Employee Non-Disclosure Agreement / [Other required agreements]], which will be provided 
   to you prior to your start date.
4. [Any other conditions specific to this role, e.g., "Verification of professional 
   licensure," "Successful completion of a drug screening."]

───────────────────────────────────────────────────────────

AT-WILL EMPLOYMENT [US STANDARD -- OMIT OR MODIFY FOR NON-US EMPLOYEES]

Your employment with [Company Name] will be on an at-will basis. This means that either you 
or the Company may terminate the employment relationship at any time, with or without cause or 
advance notice. Nothing in this offer letter, any employee handbook, or any other Company 
communication creates a contract of employment for a specific duration or alters the at-will 
nature of your employment.

───────────────────────────────────────────────────────────

OFFER EXPIRATION AND ACCEPTANCE

This offer will remain open until 11:59 PM [Pacific / Eastern / Central] Time on 
[Expiration Date: Month DD, YYYY]. 

To accept this offer, please sign below and return a copy of this letter to [Contact Name] 
at [contact@company.com] by the expiration date. [If using electronic signature: "You may 
also accept this offer electronically via the DocuSign link provided in your email."]

If you have any questions about this offer, please contact [Contact Name] at [phone number] 
or [contact@company.com].

We are genuinely excited to welcome you to [Company Name] and look forward to seeing the 
impact you will make beginning on [Start Date].

Sincerely,

_______________________________
[Authorized Signatory Name]
[Title]
[Company Name]
[Date]

───────────────────────────────────────────────────────────

CANDIDATE ACCEPTANCE

By signing below, I confirm that I have read and understood the terms of this offer and 
accept employment with [Company Name] under the terms described above.

Candidate Signature: ____________________________    Date: ________________

Printed Name: __________________________________

Start Date Confirmed: __________________________
```

---

## Rules

1. **Never represent the offer letter as a contract of employment.** Include explicit language stating it is not a contract and does not alter at-will status. If a user asks for an employment contract, decline to produce it under this skill and recommend legal counsel -- the financial and legal exposure from an improperly drafted employment contract is significant.

2. **Always calculate the per-pay-period gross amount yourself.** Bi-weekly = annual salary ÷ 26. Semi-monthly = annual salary ÷ 24. Monthly = annual salary ÷ 12. Show the number in the letter. A $120,000 salary paid bi-weekly is $4,615.38 per period, not "approximately $4,600." Round to the nearest cent.

3. **Never state net or take-home pay.** Withholding varies by the employee's W-4 elections, state of residence, benefits elections, and retirement contributions. Stating net pay creates an implied promise the employer cannot keep. Always qualify: "before applicable taxes, withholdings, and deductions."

4. **Always include "subject to board approval" for equity grants.** An offer letter alone does not legally grant equity -- that requires a board resolution and a separate grant agreement under the equity incentive plan. Stating equity without this caveat may create a contractual obligation to grant equity even if the board later declines.

5. **Bonus language must never imply a guarantee.** The word "target" must appear for variable compensation. Add: "Bonus eligibility requires active employment on the date of payment and is subject to the Company's determination in its discretion." Without this, a terminated employee may have a claim for a prorated bonus.

6. **Offer expiration must be a specific date and time with timezone.** "Within 5 business days" is ambiguous -- it does not account for weekends, holidays, or timezone differences. State: "This offer expires at 11:59 PM Pacific Time on March 12, 2026."

7. **Signing bonuses without clawback language are legally gifts.** If a candidate accepts, takes the signing bonus, and leaves after 60 days, the company has no recourse without a written repayment agreement. Always include clawback terms: amount, trigger events (voluntary resignation, termination for cause), timeframe (typically 12--24 months), and repayment mechanics.

8. **FLSA classification must be stated explicitly.** Omitting exempt/non-exempt status creates confusion about overtime eligibility. Exempt employees at or near the federal salary threshold ($684/week as of 2024) may need reclassification -- flag any salary under $45,000 as a potential non-exempt situation requiring review.

9. **Non-compete language does not belong in the offer letter.** Reference the agreement by name only. Many jurisdictions do not enforce non-competes; California, North Dakota, Oklahoma, and Minnesota effectively prohibit them entirely. Including non-compete terms in the offer letter rather than a separate agreement muddies enforceability and may void the entire restrictive covenant.

10. **Benefits effective dates must be stated precisely.** "You will receive health benefits" is not adequate. State: "Medical, dental, and vision coverage is effective on your first day of employment" OR "effective on the first day of the month following 30 days of employment." The difference between day-one and day-31 coverage is material to candidates who are between jobs, pregnant, or managing ongoing healthcare needs.

11. **Do not use the offer letter to deliver the employee handbook, PIIA, or benefits guide.** Reference these documents as forthcoming. Embedding them or attaching them to the offer letter creates legal ambiguity about which document governs -- the handbook or the offer letter -- and may inadvertently create contractual obligations through handbook language.

12. **For international employees or remote employees in other countries, do not apply US employment law assumptions.** Do not include at-will language for UK, German, French, or Australian employees -- those jurisdictions have statutory notice periods and termination protections that override at-will doctrine. Do not assume US-style equity treatment applies globally (UK and EU equity taxation rules differ significantly). Flag international hires for EOR service or local counsel review.

---

## Edge Cases

### Candidate Located in California
California employment law requires special handling on multiple fronts. Do not include any non-compete or non-solicitation of customers language -- California courts will not enforce them and their presence may expose the company to litigation under California Business and Professions Code Section 16600. Replace the standard non-compete reference with: "As required by California law, no non-competition agreement will be required as a condition of your employment." Do include: California Paid Family Leave disclosure, meal and rest period rights notice (required for non-exempt employees), and a statement that disputes are governed by California law if the company is based in California. For equity, note that California-optioned shares may be subject to a different tax treatment if the company is not registered in California's securities filing.

### Executive-Level Offer (VP, SVP, C-Suite, Board Member)
Executive offers should be treated as term sheets, not final agreements. The offer letter should be abbreviated -- position, title, reporting structure, compensation summary (base, target bonus, equity grant size) -- with an explicit note: "The detailed terms of your employment, including severance provisions, change-of-control protections, D&O insurance, and any non-solicitation arrangements, will be set forth in a separate Executive Employment Agreement to be provided prior to your start date." Do not include at-will language in an executive offer if the company intends to negotiate severance -- that language will contradict the severance provision. The offer letter for an executive is a commitment to offer; the employment agreement is the binding document.

### Promotion or Internal Transfer
The tone must shift significantly. The candidate is a current employee, not a new hire. Replace "pleased to offer you the position" with "pleased to confirm your promotion to" or "pleased to confirm your transfer to." Include the effective date (which may differ from a "start date"). Itemize only what is changing: new title, new compensation, new reporting structure. Do not re-list benefits the employee already has -- note: "Your existing benefits enrollment will remain unchanged unless you elect to make changes during the next open enrollment period." For equity, note how the existing grant is affected (it typically continues unaffected unless there is a new grant). For internal transfers across business entities or subsidiaries, note whether there are any changes to employment entity that could affect benefits, equity plan participation, or years-of-service calculations.

### Contractor Conversion to Full-Time Employee
This is a legally sensitive situation. The individual has been paid on a 1099 (contractor) basis -- their new W-2 (employee) status means the company will now pay employer-side payroll taxes (FICA, FUTA, SUTA), and the individual loses the tax deductions associated with self-employment. The offer letter should not reference the prior contractor relationship in a way that could be used as evidence of misclassification. Treat this as a new employment offer. Note the effective date carefully -- there should be a clean break between the last contractor payment and the first employee payroll date to avoid a period of dual classification. Benefits eligibility typically starts fresh from the employment start date, not the original contractor engagement date, unless the company has a policy otherwise.

### Role With Commission or Variable Compensation (Sales)
Never try to embed a full commission plan in an offer letter. Commission structures have tiers, accelerators, draws, clawback provisions, territory definitions, and quota-setting methodologies that belong in a separate Sales Compensation Plan document. The offer letter should state the OTE clearly: "Your total On-Target Earnings (OTE) are $[X], consisting of a $[Y] base salary and $[Z] variable commission at 100% of quota attainment. Your specific quota, commission rates, and plan terms will be provided in the [Company Name] Sales Compensation Plan, which forms part of your compensation agreement." Note whether there is a guaranteed draw during a ramp period: "During your first [90 days], you will receive a guaranteed draw of $[Z] per month against your commission, to provide earnings stability while you build your pipeline. This draw is [recoverable / non-recoverable]." A recoverable draw creates a debt the employee owes if they do not earn enough commission to repay it -- a non-recoverable draw does not.

### Candidate Has a Competing Offer or Is in Active Negotiation
The offer letter itself should not change substantively because of a competing offer -- do not add special terms or side agreements in the letter in response to a competing offer, as this creates inconsistency in your offer population and potential pay equity issues. If the user indicates there is a counteroffer situation, make the compensation presentation in the offer letter especially clear and unambiguous -- clearly laid out numbers are persuasive. Suggest the user ask the hiring manager to write a personal note in the opening paragraph. The offer expiration date should be reasonable (7 business days) but not open-ended -- an open-ended offer signals low urgency and may encourage continued negotiation. If the user wants to adjust the package in response to the competing offer, update the numbers before the letter is sent, not after.

### Remote Employee in a State Where the Company Has No Prior Presence
Hiring a remote employee in a new state creates "nexus" -- a physical presence -- which triggers employer obligations in that state: state income tax withholding, state unemployment insurance (SUTA), workers' compensation coverage, and compliance with state-specific wage and hour laws. The offer letter should note the employee's home state as their primary work location. Before the offer is finalized, flag this to the user: "Hiring a remote employee in [state] may require [Company Name] to register as an employer in that state, obtain workers' compensation coverage, and comply with [state]-specific employment laws. Please confirm with your payroll provider or HR counsel that these registrations are in place before the start date." The offer letter itself can proceed, but the operational compliance must be in place.

### Fixed-Term or Temporary Employment
Fixed-term employment has a defined end date. This changes multiple aspects of the offer letter:
- Replace "at-will employment" with language specifying the term: "Your employment under this offer will commence on [start date] and is expected to conclude on [end date], unless earlier terminated by either party with [X weeks] written notice or extended by mutual written agreement."
- Bonus eligibility requires careful drafting -- a fixed-term employee who works 11 months of a 12-month bonus period may have a strong claim for a prorated bonus if the letter is not explicit about eligibility ending at employment end.
- Benefits: specify whether benefits continue through the end of the term or terminate earlier.
- Equity: most standard equity plans provide that vesting stops at termination. For a fixed-term employee, the vesting schedule should be structured so that meaningful vesting occurs within the contract period, or equity should not be included in the offer at all.

---

## Example

**Input:**
"I need an offer letter for Marcus Webb for a Head of Growth role. $185,000 salary, 20% bonus target, 12,000 RSUs vesting over 4 years, $10,000 signing bonus with a 12-month clawback. He starts May 12. We're in Austin, TX, remote-friendly (2 days per week in office). He reports to our CEO, Jordan Kim. Offer expires in 7 business days."

**Analysis before writing:**
- Head of Growth at $185,000 -- classify as Exempt under FLSA (salary well above federal threshold)
- Texas is an at-will state with no additional employer obligations that change standard language
- RSUs (not options) -- no exercise price needed, standard 4-year cliff vesting
- Semi-monthly pay is most common for this salary range -- $185,000 ÷ 24 = $7,708.33 gross
- 20% bonus target = $37,000 at full target
- $10,000 signing bonus -- include clawback language
- Offer expiration = 7 business days from letter date. If letter date is April 17, 2026, expiration = April 28, 2026 (accounting for weekdays only)
- No international flags, no California flags -- standard US offer applies

---

**Output:**

```
NovaCo, Inc.
1200 Barton Springs Road, Suite 400
Austin, TX 78704

April 17, 2026

Marcus Webb
[Marcus's Address]
[City, State ZIP]

Dear Marcus,

We are delighted to offer you the position of Head of Growth at NovaCo, Inc. Your track 
record of building and scaling multi-channel acquisition programs -- and your specific 
experience turning paid and organic growth into a repeatable, data-driven engine -- is 
exactly what our team needs as we head into our next phase. Jordan and the leadership 
team are genuinely excited to have you aboard.

───────────────────────────────────────────────────────────

POSITION DETAILS

| Field                  | Details                                                |
|------------------------|--------------------------------------------------------|
| Job Title              | Head of Growth                                         |
| Department             | Marketing / Growth                                     |
| Reports To             | Jordan Kim, Chief Executive Officer                    |
| Employment Type        | Full-Time                                              |
| FLSA Classification    | Exempt                                                 |
| Work Location          | Austin, TX (Hybrid: 2 days per week in office)         |
| Start Date             | Monday, May 12, 2026                                   |

───────────────────────────────────────────────────────────

COMPENSATION

Base Salary
Your annual base salary will be $185,000 ($7,708.33 gross per semi-monthly pay period, 
before applicable taxes and deductions). NovaCo processes payroll on a semi-monthly 
basis (the 15th and last business day of each month).

Performance Bonus
You are eligible for a target annual performance bonus of 20% of your base salary 
($37,000), based on a combination of your individual performance against agreed-upon 
objectives and NovaCo's company-level performance, as evaluated by the CEO in his 
discretion. Bonuses, if any, are paid in Q1 of the following fiscal year (typically 
by March 15). Your 2026 bonus will be prorated based on the number of days worked in 
2026 as a proportion of 365. Bonus eligibility requires that you be actively employed 
by NovaCo on the payment date.

Equity -- Restricted Stock Units (RSUs)
Subject to approval by the NovaCo Board of Directors and the terms of the Company's 
2023 Equity Incentive Plan, you will be granted 12,000 Restricted Stock Units (RSUs). 
Each RSU represents the right to receive one share of NovaCo common stock upon vesting. 

Vesting Schedule: 3,000 RSUs (25%) will vest on the one-year anniversary of your 
employment start date. The remaining 9,000 RSUs will vest in equal monthly installments 
of 250 RSUs over the following 36 months, subject to your continued employment with 
NovaCo. Full terms are governed by the 2023 Equity Incentive Plan and a separate RSU 
Grant Agreement, which will be provided to you prior to your start date.

Signing Bonus
NovaCo will pay you a one-time signing bonus of $10,000, payable on your first regular 
paycheck, subject to applicable tax withholdings. If you voluntarily resign from NovaCo 
or are terminated by the Company for cause within 12 months of your start date, you agree 
to repay the full $10,000 signing bonus within 30 days of your separation date. 
Repayment may be deducted from any final compensation owed to you to the extent permitted 
by applicable law.

───────────────────────────────────────────────────────────

BENEFITS

You will be eligible to participate in NovaCo's benefits program beginning on your first 
day of employment, which currently includes:

- Medical, Dental, and Vision Insurance: NovaCo covers 90% of the premium for employee 
  coverage and 70% for dependent coverage. Coverage is effective on your first day.
- 401(k) Plan: You are eligible to participate immediately. NovaCo matches 100% of your 
  contributions up to 4% of your salary, with immediate vesting on the company match.
- Paid Time Off: Flexible PTO (unlimited, subject to manager approval and business needs), 
  plus 11 company holidays per year.
- Professional Development: An annual stipend of $2,500 for conferences, courses, 
  or relevant professional memberships.
- Additional benefits include short and long-term disability insurance, life insurance 
  (2x annual salary), and a $75/month remote work stipend.

Full benefits details and enrollment instructions will be provided during onboarding.

───────────────────────────────────────────────────────────

CONDITIONS OF EMPLOYMENT

This offer is contingent upon the satisfactory completion of each of the following:

1. A background investigation (criminal history and employment verification), conducted 
   in accordance with applicable federal and state law. You will receive a separate 
   authorization and disclosure form as required by the Fair Credit Reporting Act 
   (FCRA) -- please watch for that in your email.
2. Verification of your legal authorization to work in the United States, as required 
   by federal law (Form I-9). You will be required to present valid identity and 
   work authorization documents on or before your first day of employment.
3. Execution of NovaCo's Proprietary Information and Inventions Agreement (PIIA) and 
   Employee Non-Disclosure Agreement, which will be provided to you prior to your start 
   date.

───────────────────────────────────────────────────────────

AT-WILL EMPLOYMENT

Your employment with NovaCo, Inc. will be on an at-will basis. This means that either 
you or NovaCo may end the employment relationship at any time, with or without cause or 
advance notice, subject to applicable law. Nothing in this offer letter, the employee 
handbook, or any other Company communication creates a contract of employment for a 
specific term or alters the at-will nature of your employment.

───────────────────────────────────────────────────────────

OFFER EXPIRATION AND ACCEPTANCE

This offer will remain open until 11:59 PM Central Time on Tuesday, April 28, 2026.

To accept, please sign below and return a copy of this letter to Priya Nair, Head of 
People Operations, at pnair@novaco.com. You may return a scanned copy by email or 
accept electronically via the DocuSign link included in your offer email.

If you have any questions at all -- about the role, the team, the compensation, or 
anything else -- please don't hesitate to reach out to Priya at (512) 555-0184 or 
to Jordan directly.

We are looking forward to having you join the team on May 12. This is going to be 
a great chapter for NovaCo and for you.

Warm regards,

_______________________________
Jordan Kim
Chief Executive Officer
NovaCo, Inc.
April 17, 2026

───────────────────────────────────────────────────────────

CANDIDATE ACCEPTANCE

By signing below, I, Marcus Webb, confirm that I have read and understood the terms 
of this offer and accept employment with NovaCo, Inc. under the conditions described above.

Candidate Signature: ____________________________    Date: ________________

Printed Name: __________________________________

Confirmed Start Date: May 12, 2026
```

---

**Post-draft notes to the user:**
- The offer expiration of April 28 assumes today's date of April 17 and counts 7 business days (skipping weekends). Confirm this works for your timeline.
- The FCRA background check authorization form must be sent as a separate document -- it cannot be embedded in the offer letter.
- If Marcus is coming from a role with unvested equity, you may want the hiring manager to discuss equity buyout during the verbal offer conversation before this letter is sent. The letter itself does not need to address it, but it is a common negotiation point for head-of-function hires.
- If you want to add a relocation stipend, a specific commission plan for any revenue targets Marcus will own, or a provision for accelerated vesting on a change of control, those additions should be discussed with legal counsel before adding them to this letter.
