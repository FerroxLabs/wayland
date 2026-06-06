---
name: finance-r-and-d-credit
description: Form 6765 R&D Tax Credit walkthrough plus §174 capitalization rules (post-TCJA mandate, software-SMB hot topic). Inputs qualified research activities, qualified research expenses (wages, supplies, contract research), four-part test screening. Outputs 6765 prep package + §174 capitalization schedule. Templates only - not personalized tax advice.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: authored (business-finance Wayland plugin)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [r-and-d, tax-credit, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** R&D credit and §174 capitalization are the highest-dollar SMB-software tax issues and most volatile area of current tax legislation. Documentation requirements are stringent (Treas. Reg. §1.41-4(d), §41(d) four-part test). Review with a qualified CPA / EA / R&D specialist before claiming the credit. Improperly claimed §41 credits are an active IRS audit target.

# Finance - R&D Credit + §174 Capitalization

Build a Form 6765 R&D credit prep package and §174 capitalization schedule for SMBs (especially software, manufacturing, biotech, engineering, and product-development businesses).

## Required inputs

- **Filing year** `{filing_year}` (legislation in this area changes annually - verify §174 immediate-expensing status and §41 credit calculation method for `{filing_year}`)
- **Jurisdiction** (US federal - `finance-r-and-d-credit` covers §41 federal credit; many states have separate R&D credits - CA FTB §23609, NY DTF, MA DOR, etc.)
- **Entity type** (C-corp / S-corp / partnership / sole prop affects how credit flows out)
- **Business activity**: the qualified research activities being claimed
- **Wage records** for employees performing qualified research
- **Supplies used** in research
- **Contract research** payments
- **Cloud computing / hosting** used to develop products (qualifying cases)
- **Prior year QRE** for base-amount calculation (regular method) or 3-year average (simplified)
- **Gross receipts** (5-year for regular method)

## Section 174 capitalization mandate - read FIRST

> ⚠️ **For tax years beginning after 12/31/2021, §174 requires capitalization and amortization of "specified research or experimental (SRE) expenditures":**
> - **5-year amortization** for **domestic** R&E
> - **15-year amortization** for **foreign** R&E
> - Half-year convention applies in year of incurrence
> - Software development is **explicitly** included as SRE (per Notice 2023-63)
> - This applies **whether or not** the §41 credit is claimed
> - Verify whether `{filing_year}` legislation has restored immediate expensing - multiple bills have proposed restoration; status changes.

### Practical impact for software SMBs

A bootstrapped software company spending $500K/year on developer wages historically deducted that immediately. Under post-2021 §174, only 1/5 (with half-year convention, ~10% in year 1) is deductible - taxable income jumps materially even with no operational change. **Pair with §41 credit when possible to soften the cash impact.**

### §174 capitalization schedule

```
SECTION 174 CAPITALIZATION SCHEDULE - Tax Year {filing_year}
──────────────────────────────────────────────────────────────────
Activity     Domestic SRE    Foreign SRE   Total
──────────────────────────────────────────────────────────────────
[Activity 1] $XX,XXX         $X,XXX        $XX,XXX
[Activity 2] $XX,XXX         $X,XXX        $XX,XXX
              --------       --------      --------
TOTAL         $XX,XXX         $XX,XXX       $XXX,XXX

Year 1 amortization:
  Domestic: 1/5 × ½ = 10%  → $XX,XXX × 10% = $X,XXX
  Foreign:  1/15 × ½ ≈ 3.3% → $XX,XXX × 3.33% = $X,XXX

Years 2–5 (domestic): 20% per year
Years 2–15 (foreign): 6.67% per year
──────────────────────────────────────────────────────────────────
```

## §41 R&D Tax Credit - Four-Part Test (IRC §41(d))

For activities to qualify, **ALL FOUR** must be satisfied:

### 1. Permitted Purpose (§41(d)(1)(B)(ii))
The activity must be undertaken to develop a **new or improved business component** - function, performance, reliability, or quality. Cosmetic / style / aesthetic improvements do NOT qualify.

### 2. Technological in Nature (§41(d)(1)(B)(i))
The activity must rely on principles of:
- Physical sciences (physics, chemistry)
- Biological sciences (biology, biochemistry)
- Engineering (mechanical, electrical, civil, chemical)
- Computer sciences (software development, data processing, AI/ML)

Activities relying solely on social sciences, arts, or humanities do NOT qualify.

### 3. Elimination of Uncertainty (§41(d)(1)(A))
At the outset, the taxpayer must face uncertainty about:
- **Capability** - can it be done?
- **Methodology** - how should it be done?
- **Appropriate design** - what is the optimal design?

If the answer was already known via existing public knowledge, professional skill, or off-the-shelf solutions, the activity does NOT qualify.

### 4. Process of Experimentation (§41(d)(1)(C))
Substantially all (≥80%) of the research activities must constitute a **process of experimentation** - systematic evaluation of one or more alternatives. Examples:
- Modeling, simulation
- Iterative testing and refinement
- Trial and error to converge on a solution

Documented hypotheses, alternatives evaluated, and iterations are key audit defenses.

## Qualified Research Expenses (QRE) categories

### Wages - IRC §41(b)(2)
- W-2 wages of employees performing qualified services (research, direct supervision, direct support).
- **Box 1 wages** are the base; specifically excludes amounts not reported in Box 1 (e.g., 401(k) deferrals are still in QRE; some bonuses included; verify).
- Time-tracking by activity is the strongest documentation - % of time on QRA × wages.
- Officer / owner wages can qualify if performing qualified services.

### Supplies - IRC §41(b)(2)(A)(ii)
- Tangible property (other than land and depreciable property) used in qualified research.
- Includes prototype materials, lab supplies, materials consumed in testing.
- Does NOT include capital assets (computers, lab equipment) - those are depreciated separately.

### Contract Research - IRC §41(b)(3)
- 65% of payments to non-employees performing qualified research on the taxpayer's behalf.
- The taxpayer must bear the financial risk and have substantial rights in the research.
- 75% if payment is to a qualified research consortium.

### Computer Leasing / Cloud Computing - IRC §41(b)(2)(A)(iii)
- Payments for the use of computers in qualified research, where the computer is owned and operated by a third party and located off-premises.
- Cloud / SaaS used for qualified research (training ML models, simulation, dev environments) - qualifying when the third party is not related and not the primary user.

### Excluded activities (§41(d)(4))
- Research after commercial production
- Adaptation of existing components for a particular customer
- Duplication of existing components
- Surveys, studies, market research
- Computer software for internal use (with carve-outs and high-threshold-of-innovation test - see Treas. Reg. §1.41-4(c)(6))
- Research outside the US, Puerto Rico, or US possessions (different test for foreign)
- Funded research (where another party bears the risk and retains substantial rights)
- Social-science research
- Research in arts and humanities

## Credit calculation methods

### Regular Credit (RRC) - IRC §41(a)(1)
```
Regular credit = 20% × (QRE - base amount)
base amount    = MAX(fixed-base % × avg gross receipts of 4 prior years, 50% × current QRE)
```
Complex; requires gross-receipts history; better for high-growth firms with established baselines.

### Alternative Simplified Credit (ASC) - IRC §41(c)(5)
```
ASC = 14% × (current-year QRE − 50% × avg of 3 prior years' QRE)
If no QRE in any of prior 3 years:  ASC = 6% × current-year QRE
```
Most SMBs use ASC because it's simpler and doesn't require gross-receipts history.

### Section 280C(c)(3) reduced credit election
Under §280C(c), the §174 / §162 deduction must be reduced by the §41 credit (or equivalently, an election under §280C(c)(2) to take a reduced credit at 79% × marginal rate × full credit). Most pass-through entities historically elect §280C(c) reduction to avoid book-tax adjustments. **Verify mechanics for `{filing_year}` since §174 capitalization changes the math.**

### Payroll-tax election (small startups) - IRC §41(h)
**Qualified Small Businesses** (≤$5M gross receipts in current year + no gross receipts more than 5 years prior) may elect to apply up to **$500K of §41 credit against employer payroll tax (Social Security + Medicare portion)** rather than income tax (Inflation Reduction Act of 2022 raised cap to $500K from $250K - verify cap for `{filing_year}`).

This is a **major SMB benefit** - credit becomes useful even for pre-revenue / loss-position startups.
- Election made on Form 6765, Section D.
- Applied via Form 8974 attached to Form 941.
- Verify cap and qualifications for `{filing_year}` (inflation adjustments + legislation).

## Form 6765 walkthrough

```
Form 6765 - Credit for Increasing Research Activities

Section A - Regular Credit (RRC)
  Line 5    Total QRE (current year wages + supplies + contract research + computer rental)
  Line 6    Fixed-base percentage × prior-year gross receipts (base amount, RRC method)
  Line 11   Credit before §280C(c) reduction = (Line 5 − Line 6) × 20%
  Line 12   §280C(c) reduced credit (if elected)

Section B - Alternative Simplified Credit (ASC)
  Line 28   Total QRE for current year
  Line 29   QRE for each of prior 3 years
  Line 30   Average of prior 3 years
  Line 32   50% × Line 30
  Line 33   Line 28 − Line 32
  Line 34   ASC = Line 33 × 14% (or 6% × QRE if no prior history)

Section C - Pass-through allocation (if applicable)
  Pass to Schedule K-1 (1120-S Box 13P; 1065 Box 15M)

Section D - Payroll Tax Election (Qualified Small Businesses)
  Line 41   Election to apply credit against payroll tax - verify cap for {filing_year}
  Line 44   Amount applied against payroll tax (filed via Form 8974 with Form 941)
```

## Documentation requirements (Treas. Reg. §1.41-4(d))

The IRS requires **contemporaneous documentation** that establishes the four-part test for each business component claimed:

1. **Project descriptions** - what was the new/improved business component?
2. **Hypotheses and alternatives evaluated** - what design / methodology / capability was uncertain?
3. **Process of experimentation** - what tests / iterations / models / prototypes?
4. **Time tracking** - who worked on what activity, % of time
5. **Cost tracking** - wages by employee by activity, supplies, contract research invoices
6. **Outcome / lessons** - what was learned, why prior approaches failed

Tools: project-management exports (Jira, Linear, Asana), git commit history, design-doc revisions, lab notebooks, and contemporaneous time-tracking are strong defenses. Reconstructed-after-the-fact narratives are weak defenses.

## State R&D credits

Many states have separate R&D credits - sometimes more generous than federal:
- **CA FTB §23609** - 15% credit, separate state QRE rules
- **NY DTF** - investment incentive in NY (DTF-216)
- **MA DOR** - 10% incremental + 15% basic research
- **TX, AZ, GA, IL, FL, NJ, PA, etc.** - verify state-specific credits and certifications
- Some require pre-certification or post-claim audit

Federal QREs ≠ state QREs in most states; track separately.

## Common errors to avoid

- Claiming §41 credit without §174 capitalization (the two interact under §280C(c) and post-TCJA rules)
- Treating §174 immediate-deduction as still applying for `{filing_year}` without verifying current legislation
- Failing the four-part test on routine product-iteration work (style, marketing, customer-specific adaptation = NOT R&D)
- Internal-use software claims without high-threshold-of-innovation documentation
- Taking the payroll-tax election but failing to file Form 8974 with the 941
- Reconstructing time tracking after the fact (audit-vulnerable)
- Missing state credits that compound the federal benefit

## Workflow

1. Confirm `{filing_year}`, jurisdiction, entity type.
2. Determine §174 capitalization status for `{filing_year}` - verify against current legislation.
3. List business components and run four-part test on each.
4. Categorize QRE: wages × time-allocation, supplies, contract research × 65%, cloud computing.
5. Choose credit method (RRC vs ASC); compute both if data allows; pick the larger.
6. Decide §280C(c) reduced election.
7. For Qualified Small Businesses: evaluate payroll-tax election (`finance-payroll-prep` Form 8974 follow-through).
8. Build §174 capitalization schedule (domestic 5-yr / foreign 15-yr).
9. Identify state R&D credit opportunities.
10. Output 6765 prep package + §174 schedule + documentation matrix with disclaimer footer.

---

> _**Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: US federal (+ state). Filing year: `{filing_year}`. R&D credit and §174 capitalization rules are highly fact-specific and currently the most legislatively volatile area of business tax. Four-part test documentation under Treas. Reg. §1.41-4(d) must be **contemporaneous**. §174 immediate-expensing status, payroll-tax election cap, ASC percentages, and internal-use-software thresholds change with legislation and IRS guidance - re-verify against IRC §41, §174, current Notices, and Form 6765 / Form 8974 instructions for the year you are claiming. Improperly claimed §41 credits are an active IRS audit target. Review with a qualified CPA / EA / R&D credit specialist before filing. Wayland and the plugin authors disclaim all liability for use of these templates._
