---
name: hr-offboard
description: Generate an offboarding checklist with state-by-state final-pay timing matrix, federal-vs-state-mini-COBRA routing, OWBPA/ADEA-compliant separation-agreement scaffolding for age 40+, McLaren Macomb-compliant non-disparagement, and data-preservation step before access revocation. Templates only - not employment-law advice.
slash_command: false
argument-hint: "<employee name, departure type, state>"
attribution:
  lineage: anthropics/knowledge-work-plugins/human-resources/skills/onboarding/SKILL.md (Apache-2.0)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [offboarding, hr, people-ops, smb]
---

> **Templates only - not employment-law advice.** Have HR counsel review every separation - final-pay timing, COBRA/mini-COBRA, OWBPA release, and data preservation are statutory and state-specific.

# HR - Offboarding

Generate a complete offboarding checklist that covers state-specific final-pay timing, federal-vs-mini COBRA routing, OWBPA-compliant separation agreements, McLaren Macomb-compliant non-disparagement, and data-preservation-before-revocation.

## Pre-flight (REQUIRED - refuses to generate without these)

1. **Employee name and role**
2. **Departure type**: voluntary planned / voluntary immediate / involuntary with notice / involuntary immediate / contract end
3. **State of employment** - drives final-pay timing rule
4. **Country**
5. **Total headcount** - drives federal-vs-mini COBRA, federal vs mini-WARN
6. **Whether employee is age 40+** - triggers OWBPA/ADEA 21-day + 7-day release window (45-day if group RIF)
7. **Whether group RIF** - triggers OWBPA written disclosure of decisional unit + selection criteria for 40+ employees
8. **Whether active legal hold / litigation / harassment complaint involving this employee** - DO NOT proceed; route to counsel

## Usage

```
/hr offboard <employee name and departure type>
```

## State-by-state final-pay timing matrix (US)

### Involuntary termination - final wages due

| State | Timing | Citation | Penalty for late |
|-------|--------|----------|-------------------|
| **CA** | Same day, all wages including accrued vacation | Lab. Code §§ 201-203 | Waiting-time penalty up to **30 days of wages** |
| **MA** | Same day | M.G.L. c. 149, §148 | Treble damages + atty fees |
| **CO** | Immediately if practical, else within 6 hours of next business day, or 24 hrs if at offsite location | C.R.S. §8-4-109 | Penalty up to 125% of wages owed (CDLE) |
| **HI** | Immediately or by next business day | HRS §388-3 | Penalty + atty fees |
| **CT** | By next business day after discharge | C.G.S. §31-71c | 2x wages |
| **MT** | Immediately if discharged for cause; within 4 hrs or end of business day otherwise | Mont. Code §39-3-205 | Penalty + interest; **note no at-will after probation** |
| **NV** | Immediately | NRS §608.020 | Continued wages |
| **NY** | Next regular payday | Lab. Law §191 | 100% liquidated damages |
| **IL** | By next regular payday or sooner if practicable | 820 ILCS 115/5 | 2% per month + atty fees |
| **TX** | Within 6 days | Tex. Lab. §61.014 | Admin penalty |
| **All others** | Next regular payday is safest default - verify with state DOL |

### Voluntary resignation - final wages due

| State | Timing |
|-------|--------|
| **CA** | With 72+ hrs notice → last day; without notice → within 72 hrs |
| **MA** | Next regular payday |
| **CO** | Next regular payday |
| **Most others** | Next regular payday |

### What's included in "final wages"

- All earned salary/wages through last day worked
- **Accrued, unused PTO/vacation** if state law or company policy treats it as wages (CA, CO, IL, LA, MA, MT, ND, NE, NY-employer-policy-driven, RI, etc. - many states)
- Unpaid commissions earned per commission plan
- Reimbursable expenses
- 401(k) deferral final paycheck (per plan)

## Federal vs state mini-COBRA routing

### Federal COBRA - applies if employer had 20+ EE on more than 50% of typical business days in prior calendar year

- **Notification timeline**: Employer notifies plan administrator within **30 days** of qualifying event; plan administrator notifies qualified beneficiary within **14 days**. **Total: 44 days max** to deliver Election Notice.
- **Election period**: Qualified beneficiary has **60 days** to elect from later of (i) date of Election Notice or (ii) date coverage ended.
- **Coverage duration**: 18 months (29 if disabled), 36 for dependents on certain qualifying events.
- **Premium**: up to 102% of full premium (employee + employer share + 2% admin).

### State mini-COBRA - applies if employer < 20 EE (federal exempt) - **CRITICAL for SMBs at this pack's target size**

| State | Statute | Coverage duration | Notes |
|-------|---------|-------------------|-------|
| **CA Cal-COBRA** | Ins. Code §10128.51 et seq. | Up to 36 months total (combines with federal if applicable) | Applies to 2-19 EE plans |
| **NY** | Ins. Law §3221(m) | 36 months | All group plans |
| **NJ** | N.J.S.A. §17B:27-51.12 | 18 months | 2-50 EE |
| **CT** | C.G.S. §38a-554 | 30 months | All group plans |
| **MA** | M.G.L. c. 176J | 36 months | Small group |
| **IL** | 215 ILCS 5/367e | 12 months | 2-19 EE |
| **FL, GA, MD, MN, NC, NH, OH, OK, OR, RI, SC, TN, TX, UT, VT, WI, WY, DC** | Various | Varies by state | Verify state insurance code |

**Rule of thumb**: if employer has <20 EE, federal COBRA does NOT apply. Use state mini-COBRA (or no continuation if state has none and plan is fully insured but not required to offer continuation). Verify with broker/counsel.

## Output

```markdown
## Offboarding: [Employee Name]
**Departure Type:** [Voluntary / Involuntary / Contract End]
**Last Day:** [Date] | **State:** [State] | **Headcount:** [#] | **Age 40+:** [Y/N] | **Manager:** [Manager] | **HR Contact:** [Contact]

### A. BEFORE access revocation - Data preservation (REQUIRED)

- [ ] **Litigation hold check**: any active or anticipated litigation, harassment complaint, EEOC charge, DOL investigation, or whistleblower issue → preserve email, Slack, files in litigation hold; do NOT delete account
- [ ] **Email export**: forward owner-needed emails to manager; preserve mailbox in cold archive (90+ days minimum, longer if policy requires)
- [ ] **File ownership transfer**: transfer Google Drive / Dropbox / SharePoint / source code commit ownership to backup owner before revoking access
- [ ] **Customer-facing accounts**: change passwords on shared accounts (CRM, support, social media); document handoff
- [ ] **GDPR / state privacy**: if EU-based or CA-based employee, log data-processing change per Art. 30 ROPA / CPRA. Honor deletion requests subject to retention requirements (payroll/tax 4-7 yrs in US, longer in some states)
- [ ] **Equipment retrieval plan** scheduled
- [ ] **Account audit**: snapshot last login, last activity, last device list

### B. Manager / People-Ops checklist

#### Week of departure
- [ ] Confirm last day; coordinate with payroll for state-specific final-pay timing (see matrix above)
- [ ] Schedule knowledge transfer sessions
- [ ] Identify backup owner for active projects
- [ ] Notify team and stakeholders with appropriate context (involuntary: brief and factual; voluntary: warm)
- [ ] Schedule exit interview (voluntary departures only)

#### Last day
- [ ] **Final paycheck delivered per state timing rule** (CA same-day mandatory!)
- [ ] Collect company equipment: laptop, badge, phone, peripherals, security tokens
- [ ] Confirm all access revocation timing (after data preservation step A)
- [ ] Hand-deliver or mail required separation documents (see C below)
- [ ] Send farewell message to broader team (if appropriate)

### C. Required separation documents (state-specific)

- [ ] **Final paycheck** with itemized wage statement (CA Lab. §226)
- [ ] **Notice of final pay rate / earnings** (some states required at separation - NY WTPA at separation)
- [ ] **Unemployment insurance pamphlet** (CA EDD "For Your Benefit" required at separation; NY DOL "Record of Employment"; many states have similar)
- [ ] **COBRA / mini-COBRA Election Notice**:
  - If 20+ EE: federal COBRA - qualifying-event notice to plan administrator within 30 days; plan to qualified beneficiary within 14 days (44-day total)
  - If <20 EE: state mini-COBRA per state matrix above
- [ ] **HIPAA Certificate of Creditable Coverage** (if requested)
- [ ] **HSA / FSA carryover or forfeiture notice** (FSA "use-it-or-lose-it" + run-out period; HSA portable)
- [ ] **401(k) distribution / rollover packet** (per plan)
- [ ] **Equity grant: post-termination exercise window notice** (typical 90 days for ISOs; some plans extend to 7-10 yrs)
- [ ] **Final expense reimbursement** processed
- [ ] **State-specific separation packet** (CA: For Your Benefit pamphlet, EDD form 1101CZ if applicable; MA: Mass Health Connector info; NY: paid family leave continuation info; etc.)

### D. Separation agreement (when offered)

A separation agreement requires **consideration beyond what is already owed** (additional severance, extended COBRA subsidy, accelerated equity vesting, etc.). Wages already earned, accrued PTO where state law treats it as wages, and unreimbursed expenses CANNOT be conditioned on signing a release.

#### If employee is age 40+ → OWBPA / ADEA requirements (mandatory or release is invalid)

- **21 days** to consider the agreement before signing (45 days if group RIF / "exit incentive program")
- **7 days** to revoke after signing (cannot be waived)
- **Written disclosure** if group termination - must include:
  - Decisional unit (job class/group/department from which selection was made)
  - Selection criteria
  - Job titles + ages of those selected for the program
  - Job titles + ages of those NOT selected (in same decisional unit)
- **Plain language** ("you should consult with an attorney before signing")
- **Specific reference to ADEA rights** being released
- Cannot waive future claims (only claims arising on or before execution date)

#### McLaren Macomb (NLRB, 2023) - non-disparagement / confidentiality limits for non-supervisory employees

The NLRB ruled that broad confidentiality and non-disparagement clauses in severance agreements that limit Section 7 rights (concerted activity / discussing workplace) are unlawful for non-supervisory employees. Use narrowed language:

```
NON-DISPARAGEMENT (NARROW). Each party agrees not to make any false or knowingly
misleading statements about the other party. Nothing in this section prevents either
party from (i) discussing wages, hours, or terms and conditions of employment with
co-workers or government agencies, (ii) filing a charge or participating in an
investigation by the EEOC, NLRB, OSHA, SEC, DOL, or any state agency, (iii)
testifying truthfully under oath, or (iv) exercising rights under Section 7 of the
National Labor Relations Act.
```

```
CONFIDENTIALITY (NARROW). The terms of this Agreement are confidential except that
Employee may disclose to (i) immediate family, (ii) attorney, accountant, financial
advisor, or tax preparer, or (iii) as required by law. This section does not
restrict Employee's rights under Section 7 of the NLRA or rights to communicate with
government agencies.
```

#### Statute-protected claims that CANNOT be released

- **Wages already earned** (state wage-and-hour law; FLSA generally requires DOL or court approval to settle)
- **Unemployment insurance benefits**
- **Workers' compensation** (state-specific procedure)
- **Future claims** arising after execution
- **Whistleblower protections** (SOX, Dodd-Frank - and SEC bars confidentiality clauses limiting these)
- **FMLA interference / retaliation** (some courts: prospective release void)
- **NLRB Section 7** rights

#### Separation agreement scaffold

```
SEPARATION AGREEMENT AND RELEASE

This Separation Agreement and Release ("Agreement") is between [Employee] and
[Company] (collectively, the "Parties").

1. Separation. Employee's employment ends on [Last Day].
2. Final wages. Company will pay Employee all earned wages through Last Day plus
   accrued but unused [PTO/vacation per state law and policy], regardless of whether
   Employee signs this Agreement, on the timing required by [State] law.
3. Severance consideration. In exchange for the promises in this Agreement (and
   subject to expiration of the revocation period), Company will pay Employee
   severance of [$X], less applicable withholdings, payable [in lump sum / over X
   weeks of continued payroll].
4. Release. Employee releases Company from all claims arising on or before the
   Effective Date, including but not limited to claims under Title VII, the ADA, the
   Equal Pay Act, ERISA, [state FEPA], common-law contract or tort claims, and the
   ADEA. [If 40+:] Employee acknowledges this release of ADEA claims is knowing and
   voluntary. EXCLUDED: claims that cannot be released by law (workers' comp,
   unemployment, future claims, claims to enforce this Agreement, statutory
   whistleblower protections, NLRA §7 rights, claims to file an EEOC/NLRB/OSHA/SEC
   charge).
5. Consideration period [40+ only]. Employee has [21 / 45] days from receipt of this
   Agreement to consider it. Employee may sign before that window expires, but is
   advised to consult with an attorney first.
6. Revocation period [40+ only]. Employee has 7 days after signing to revoke. The
   Agreement is not effective until the revocation period expires.
7. Non-disparagement. [Use McLaren Macomb-narrow language above]
8. Confidentiality. [Use McLaren Macomb-narrow language above]
9. Cooperation. Employee agrees to reasonable cooperation in transition and pending
   matters; Company will reimburse reasonable expenses.
10. Return of property. Employee has returned or will return all Company property by
    [date].
11. References. Company will provide neutral references confirming dates of
    employment and last position held.
12. No admission. This Agreement is not an admission of liability by either Party.
13. Governing law. [State].
14. Entire agreement / severability / counterparts.

Signed:

Employee: _________________________ Date: _________
Company: __________________________ Date: _________

[40+ ATTACHMENT - OWBPA disclosure for group RIF: decisional unit, criteria, ages.]
```

### E. IT / Systems revocation (AFTER data preservation step A)

- [ ] Email: disable account, set out-of-office or redirect to backup; preserve mailbox in litigation hold if applicable
- [ ] Slack / Teams: deactivate
- [ ] GitHub / GitLab / source code: remove or transfer repo ownership
- [ ] SaaS tools: revoke access
- [ ] SSO / identity provider: remove from directory
- [ ] VPN: revoke
- [ ] Admin / billing accounts: transfer ownership; rotate any shared credentials
- [ ] Physical badge: deactivate
- [ ] Mobile MDM: wipe corporate profile (preserve personal data on BYOD)

### F. Knowledge transfer plan

| Area / System | Owner During KT | New Owner After Departure | Status |
|---------------|----------------|--------------------------|--------|
| [Key project] | [Employee] | [Colleague] | [ ] Done |

### G. Exit interview (voluntary only - keep confidential and aggregated)

Questions to ask:
- What's the primary reason for your decision to leave?
- Was there a moment when you decided to start looking?
- What could we have done differently?
- What did you value most about working here?
- Would you consider returning? Recommend us to others?
- Any feedback for your manager or the company?

*Aggregate themes for retention analysis. Do NOT share specifics with manager. Do NOT include in personnel file.*

### H. Team announcement

**Voluntary (warm):**
> Hi team - [Employee] will be leaving [Company] on [Date]. We're grateful for [contribution]. [Backup owner] will pick up [responsibility]. Please join me in wishing them well.

**Involuntary (brief and factual):**
> Hi team - [Employee] is no longer with [Company] as of [Date]. [Backup owner] will pick up [responsibility]. Please direct ongoing matters to [contact]. We won't be sharing additional details out of respect for [Employee]'s privacy.

### I. Unemployment insurance contest

- Decide whether to contest UI claim (typically NO unless misconduct is documented and severe - fighting routine UI claims rarely succeeds and can be characterized as retaliatory in a wrongful-termination suit).
- If contesting, file timely response with state UI agency citing specific documented misconduct.

### J. 1099 contractor offboarding (different rules)

- No I-9, no W-4, no W-2 - final invoice + 1099-NEC at year-end
- No COBRA (not an employee)
- No FLSA wage timing (independent contractor; check contractor agreement)
- Verify classification was correct (DOL 6-factor + ABC test in CA/NJ/MA) before terminating; misclassification creates retroactive employee liability

```

## Output Path

Save the offboarding plan using `build_report_path("business-hr", instruction)` when writing to file.

## Output footer (REQUIRED on every generated plan)

End every offboarding plan with this block, verbatim:

```
---
**DRAFT - REVIEW REQUIRED**

This offboarding plan was generated as a starting template. It has not been reviewed
by employment counsel and may not comply with applicable law in your jurisdiction.
Before using:

1. Verify final-pay timing matches state rule (CA same-day involuntary, etc.).
2. Verify COBRA route - federal (20+ EE) vs state mini-COBRA (<20 EE).
3. If 40+ employee and a release is offered: verify OWBPA 21-day (or 45-day group)
   consideration + 7-day revocation + decisional-unit disclosure.
4. Verify non-disparagement/confidentiality narrowed per McLaren Macomb (NLRB 2023).
5. Verify data-preservation completed BEFORE access revocation; check litigation hold.
6. Verify state-specific separation pamphlets delivered (CA For Your Benefit, etc.).
7. If RIF/layoff: route to hr-rif for WARN Act + disparate-impact analysis.

Generated by Wayland business-hr plugin. Templates only - not employment-law advice.
```

---

> _Templates only - not employment-law advice. Have HR counsel review every separation before final-pay or release._
