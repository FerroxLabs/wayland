---
name: finance-payroll-prep
description: Quarterly Form 941 and annual Form 940 prep checklist, state UI / WC matrix, new-hire reporting, S-corp reasonable-salary documentation (Watson, Glass Blocks, Fleischer factors), and fringe-benefit valuation. Templates only - not personalized payroll, tax, or legal advice.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: authored (business-finance Wayland plugin)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [payroll, tax, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Payroll, withholding, deposit-frequency, state UI / WC, and reasonable-salary rules vary by state and update frequently. Review with a qualified CPA, EA, or payroll provider before filing. Misclassification is the single most expensive SMB tax mistake.

# Finance - Payroll Prep

Quarterly and annual federal payroll prep checklist for SMB owners running W-2 payroll. Covers 941, 940, state UI / WC, S-corp reasonable salary documentation, and fringe-benefit valuation.

## Required inputs

- **Filing year + quarter** (e.g., 2026-Q1)
- **Jurisdiction** (US - state(s) where employees work; multi-state requires per-state filing)
- **Entity type** (S-corp, C-corp, partnership, sole prop with employees, SMLLC with employees)
- **Employee count + total wages + federal income-tax withheld + Social Security and Medicare withheld** for the quarter
- **Deposit schedule** (monthly vs semi-weekly - determined by IRS lookback period)
- **Any S-corp owner-employees** (separate reasonable-salary review required)
- **Fringe benefits paid** (group health, retirement match, vehicle, education, GTL >$50K)

## Worker-classification gate (read before adding anyone to payroll)

Before adding a new worker to W-2 payroll, confirm proper classification (NOT 1099 contractor). For full classification gate (IRS 20-factor + state ABC test + Section 530 + Form SS-8), see `finance-tax-prep` worker-classification section. Misclassifying an employee as contractor is the single most expensive SMB tax error.

## Form 941 - Quarterly Federal Employer Tax Return

Filed quarterly to report:
- Wages paid
- Federal income tax withheld
- Social Security tax (12.4% combined - 6.2% employee + 6.2% employer up to wage base for `{filing_year}`)
- Medicare tax (2.9% combined - 1.45% employee + 1.45% employer; **plus 0.9% Additional Medicare withheld from employee on wages above $200,000 - no employer match on the additional 0.9%**)
- Tips, third-party sick pay, advance EIC if applicable

Filing deadlines (re-verify for `{filing_year}`):

| Quarter | Period | Form 941 due |
|---|---|---|
| Q1 | Jan–Mar | April 30 |
| Q2 | Apr–Jun | July 31 |
| Q3 | Jul–Sep | October 31 |
| Q4 | Oct–Dec | January 31 (following year) |

Deposit schedule:
- **Monthly depositors** (lookback period total ≤ $50,000) - deposit by 15th of following month.
- **Semi-weekly depositors** (lookback total > $50,000) - Wed–Fri payroll → following Wed; Sat–Tue payroll → following Fri.
- **$100,000 next-day deposit rule** - any single payday accumulating $100K+ undeposited tax must be deposited by next banking day, regardless of schedule.
- **De minimis exception** - total quarterly liability < $2,500 may be paid with the return.

Penalties for late deposits: 2% (1–5 days late) → 5% (6–15) → 10% (16+) → 15% (more than 10 days after IRS notice). Verify against IRC §6656 for `{filing_year}`.

## Form 940 - Annual Federal Unemployment (FUTA)

Filed annually:
- FUTA tax: 6.0% on first $7,000 of each employee's wages
- State UI credit: up to 5.4% (effective FUTA rate ~0.6% in non-credit-reduction states)
- **Credit-reduction states** - if a state has not repaid federal UI loans, employers in that state pay a higher effective FUTA rate. Verify Form 940 Schedule A current credit-reduction states for `{filing_year}`.
- Form 940 deadline: January 31 (or February 10 if all FUTA deposited on time)
- Deposit: quarterly if accumulated > $500; otherwise pay with return

## State UI / WC matrix (per-state work - verify each)

State Unemployment Insurance (SUI):
- Each state assigns a base + experience-rated rate (typically 0.5%–6.0%+ of taxable wage base)
- Taxable wage base varies by state (e.g., WA, HI > $50K base; many states $7K–15K)
- New employer rate applied for first 2–3 years until experience rating develops

State Workers' Compensation (WC):
- Required in nearly all states (TX optional, sole prop with no employees often exempt)
- Class-code-based rates (clerical 0.2%, construction 5–10%+)
- Self-insurance, state fund, or private carrier - varies by state

State withholding (income tax):
- Most states with income tax require employer withholding + quarterly / monthly returns
- 9 states with no income tax (AK, FL, NV, NH-on-wages, SD, TN, TX, WA, WY) - verify current list

City / local payroll tax:
- NYC, Philadelphia, San Francisco (Payroll Expense Tax / Gross Receipts Tax), some PA / OH / MI / KY local taxes - verify by location

## New-hire reporting

Federal law (PRWORA, 1996) requires employers to report each new hire to the state directory of new hires within **20 days** of hire (some states shorter - CA 20 days, NY 20 days, etc.). Includes name, address, SSN, employer name, EIN, address. Used for child-support enforcement.

Onboarding checklist:
- [ ] Form **I-9** Section 1 completed by employee on or before first day
- [ ] Form **I-9** Section 2 completed by employer within 3 business days of start
- [ ] Form **W-4** federal (and state W-4 / DE-4 / etc. as applicable)
- [ ] Direct deposit authorization (state-specific consent rules)
- [ ] State new-hire report filed within state-specific deadline
- [ ] Workers' comp coverage verified for new employee
- [ ] State-mandated training (CA harassment, NY harassment, IL, CT, ME, DE, WA - verify)

## S-corp owner-employee - reasonable salary documentation

> ⚠️ S-corp distributions to owner-employees are **not** subject to FICA, but the IRS requires owner-employees to take a **reasonable salary** as a W-2 employee before distributions. Failure → reclassification + back FICA + penalties + interest.

### Case-law factors (Watson v. Commissioner, 8th Cir. 2012; Glass Blocks Unlimited, T.C. 2013; Fleischer, T.C. 2016; Davis, T.C. 2011)
1. Training and experience of the owner-employee
2. Duties and responsibilities (functions performed)
3. Time and effort devoted to the business
4. Dividend / distribution history
5. Payments to non-shareholder employees for similar work
6. Compensation paid to comparable employees by similar businesses (BLS, RC Reports, Comparable Compensation Reports)
7. Whether the corporation has a formal compensation agreement
8. Use of formula or independent valuation

### Reasonable salary documentation file (build per owner-employee per year)
- Job description and duties analysis
- Hours-per-week study (calendar or time-tracking pull)
- Comparable-compensation report (RC Reports, BLS OES, salary surveys)
- Computation methodology + signed memo
- Distribution history vs salary
- Board / single-member resolution setting compensation

Risk indicators (IRS audit triggers):
- $0 or token salary while taking large distributions
- Salary << industry benchmark for the role
- Distributions > salary by large multiples without documentation

## Fringe benefit valuation

Common fringe benefits and tax treatment (verify each for `{filing_year}` against IRS Pub 15-B):

| Benefit | Tax treatment |
|---|---|
| Group health insurance | Generally pre-tax (excluded from Box 1, 3, 5); >2% S-corp shareholders include in W-2 Box 1, deduct on 1040 |
| HSA / HDHP | Employer contributions excluded; check annual contribution limits |
| Retirement match (401(k), SIMPLE, SEP) | Pre-tax up to limits |
| Group term life > $50K | Imputed income (Table I) added to W-2 Box 1, 3, 5 (IRS Pub 15-B) |
| Personal use of company vehicle | Imputed income via Annual Lease Value or cents-per-mile method |
| Employee education assistance | Up to `[§127 limit for {filing_year}]` excluded if qualified plan |
| Bonuses | Supplemental wages - withhold at 22% federal flat (or aggregate method) up to $1M; 37% above |
| Gift cards / cash equivalents | Always taxable, fully includible in wages |

## W-2 / W-3 / W-2c reminders

- W-2 furnished to employees by January 31
- W-2 + W-3 transmitted to SSA by January 31 (electronic if 10+ - verify mandate threshold for `{filing_year}`)
- W-2c for corrections; promptly correct any error and reissue
- Box 12 codes - keep cheat sheet for D (401k), DD (employer-paid health), W (HSA), V (NQSO income), etc.

## Common errors to avoid

- Forgetting to make S-corp owner W-2 payroll all year, then dropping a single year-end W-2 - IRS may treat as imprudent/contrived
- Not depositing 941 timely - penalties stack quickly under IRC §6656
- Ignoring state nexus when an employee moves to a new state - triggers state UI / W/H registration in new state
- Missing FUTA credit-reduction state surcharge on Form 940 Schedule A
- Misclassifying ownership of HSA contributions for >2% S-corp shareholders

## Workflow

1. Confirm filing year, quarter, jurisdiction(s), entity type.
2. Run the worker-classification gate before adding anyone to payroll.
3. Build the 941 working schedule (wages, withholding, FICA).
4. Confirm deposit schedule and check on-time deposit log.
5. For S-corp owners: verify reasonable-salary file is current.
6. For year-end: build 940, W-2 / W-3 package.
7. Cross-check state UI / WC registration in every state where any employee worked during the period.
8. Output checklist with disclaimer footer.

---

> _**Templates and analytical tools only - not personalized payroll, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: [SELECTED]. Filing year: `{filing_year}`. Payroll deposit thresholds, FUTA credit-reduction states, fringe-benefit limits, and state UI / WC rates change annually - re-verify against IRS Pub 15 (Circular E), Pub 15-B, and state revenue / UI / WC websites. Reasonable-salary case-law factors apply on facts and circumstances; document contemporaneously. Review with a qualified CPA, EA, or payroll provider before filing. Wayland and the plugin authors disclaim all liability for use of these templates._
