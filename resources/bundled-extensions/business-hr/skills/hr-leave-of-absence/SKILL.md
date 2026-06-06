---
name: hr-leave-of-absence
description: Eligibility analysis and documentation for FMLA / state PFML / personal / medical leave - covers federal FMLA (50+ EE within 75 mi, 12 months / 1,250 hrs), state PFML (CA CFRA, NY PFL, NJ FLI, MA PFML, WA PFML, CT PFMLA, CO FAMLI, OR PFMLI, RI TCI, DC PFL, plus 2026 states), request-response letter, return-to-work plan, intermittent-leave tracking. Templates only - not employment-law advice.
slash_command: false
argument-hint: "<jurisdiction, headcount, leave type, expected duration>"
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [fmla, leave, hr, people-ops, smb]
---

> **Templates only - not employment-law advice.** Leave eligibility math is unforgiving - denied leave that should have been granted is actionable. Have HR counsel review eligibility decisions and any denial.

# HR - Leave of Absence

Analyze leave eligibility, document the request and response, and plan return-to-work for FMLA / state PFML / personal / medical leave.

## Pre-flight (REQUIRED)

1. **Employee name, role, state of employment, country, hire date, hours worked in last 12 months**
2. **Total headcount within 75 miles of work site** (FMLA threshold)
3. **Leave type requested**: own serious health condition / family member care / bonding (parental) / qualifying military exigency / military caregiver / pregnancy disability / personal
4. **Expected duration** and **start date**
5. **Whether leave is intermittent / reduced-schedule / continuous**
6. **Prior leave used in same 12-month period**
7. **State of employment** - state PFML or state FMLA-equivalent may apply even when federal FMLA does not, AND vice versa (run BOTH)

## Federal FMLA (1993) - quick reference

- **Employer eligibility**: 50+ employees within 75-mile radius of the worksite
- **Employee eligibility**: 12 months of service (not necessarily consecutive) AND 1,250 hours worked in past 12 months
- **Entitlement**: 12 weeks unpaid, job-protected per 12-month period (26 weeks for military caregiver)
- **Qualifying reasons**:
  - Own serious health condition
  - Care for spouse, child (under 18 or adult disabled), or parent with serious health condition
  - Bonding with new child (birth, adoption, foster) within 12 months
  - Qualifying military exigency
  - Care for covered service member with serious injury or illness (26 weeks)
- **Pay**: unpaid (employee may use PTO concurrently if employer policy allows)
- **Health insurance continuation**: maintain group health benefits as if active
- **Reinstatement**: same or equivalent position
- **Notice**: employee 30 days advance for foreseeable; "as soon as practicable" otherwise. Employer must provide rights and responsibilities notice within 5 business days of becoming aware of qualifying reason.
- **Certification**: employer may require medical certification (limited scope) within 15 calendar days

## State PFML / FMLA-equivalent - quick reference (partial; verify state)

| State | Statute | EE eligibility | Threshold | Duration | Pay |
|-------|---------|----------------|-----------|----------|-----|
| **CA** | CFRA + PFL | 12 mo / 1,250 hrs | 5+ EE (CFRA) | 12 wks CFRA + PDL up to 4 mo + PFL pays 60-70% wages 8 wks | Partial wage replacement (PFL) |
| **NY** | NY PFL | 26 wks at 20+hrs/wk OR 175 days at <20hrs/wk | 1+ EE | 12 wks | 67% of avg weekly wage, capped |
| **NJ** | NJ FLI | 20 weeks earnings | All employers | 12 wks | 85% wage replacement, capped |
| **MA** | MA PFML | $5,400 in last 4 quarters | All employers (1+ EE) | 12 wks family / 20 wks own / 26 wks military caregiver | 80% lower wage tier, lower for higher |
| **WA** | WA PFML | 820 hrs prior 4 quarters | All employers | 12 wks family + 12 wks own (16 max combined) | Up to 90% of weekly wage, capped |
| **CT** | CT PFMLA | 3 mo + state-set wages | All employers | 12 wks | 95% lower-tier; 60% upper-tier; capped |
| **CO** | CO FAMLI | 180 days + state-set wages | All employers (private 9+ for employer share) | 12 wks | 90% lower; declining tier |
| **OR** | OR PFMLI | $1,000 prior year | 25+ EE | 12 wks | 100% lower; capped |
| **RI** | RI TCI | $14,700 base period | All | 7 wks | ~60% wage replacement |
| **DC** | DC PFL | 50% of work in DC | All employers | 12 wks parental, 12 medical, 12 family, 2 prenatal | ~90% lower; capped |
| **DE / MD / MN / ME** | FAMLI / PFMLI variants | (rolling 2026 effective dates) | Verify | Verify | Verify |

**Key**: state PFML is generally **wage-replacement** (state-administered), federal FMLA is **unpaid + job-protected**. They run concurrently where applicable. Some state laws also provide job protection separate from PFML (CA CFRA, NY PFL).

## Eligibility analysis output

```markdown
## Leave Eligibility Analysis
**Employee:** [Name] | **State:** [State] | **Hire date:** [Date] | **Hours last 12 mo:** [X]
**Headcount within 75 mi:** [X] | **Leave reason:** [Type] | **Requested start:** [Date] | **Duration:** [X wks]

### Federal FMLA
- Employer eligible (50+ within 75 mi)? [Y/N]
- Employee eligible (12 mo + 1,250 hrs)? [Y/N]
- Qualifying reason? [Y/N - which]
- Available balance in 12-mo period: [X weeks]
- **FMLA decision:** [Eligible / Not eligible - reason]

### State PFML / state FMLA-equivalent
- State law: [CFRA / NY PFL / etc.]
- Employer eligible? [Y/N]
- Employee eligible? [Y/N]
- Qualifying reason? [Y/N]
- Available balance: [X]
- Wage replacement: [%, source - state agency vs employer]
- **State leave decision:** [Eligible / Not eligible - reason]

### Concurrent vs sequential
- Federal FMLA + state runs concurrently where both apply (default)
- State-only entitlements that don't have FMLA equivalent (e.g., CA PDL) may run sequential

### Other applicable leaves
- Pregnancy: PWFA accommodation may apply alongside or instead of leave
- ADA: leave may be reasonable accommodation if condition is a disability
- Workers' comp: separate framework if work-related injury
- USERRA: military leave separate
- Personal/unpaid: company policy

### Total leave entitlement
- [X] weeks across [federal FMLA + state PFML + state PDL + other]
- Estimated wage replacement: [$X / %]
- Job protection: [Y, by what statutes]
- Health insurance continuation: [Y, terms]
```

## Output - Leave request response letter

```markdown
[Date]

[Employee Name]

Dear [Employee],

Thank you for your leave request received on [Date]. Based on our review:

**Eligibility decision**: [Approved / Approved-conditional / Denied]

**Statutes applied**:
- Federal FMLA: [eligible - X weeks] / [not eligible because Y]
- [State PFML]: [eligible - X weeks at Y% wage replacement] / [not eligible because Z]
- [Other applicable: PDL, USERRA, ADA, company personal]

**Leave dates**:
- Start: [Date]
- Expected return: [Date]
- Type: [Continuous / Intermittent / Reduced schedule]

**Pay during leave**:
- Federal FMLA: unpaid; you may use accrued [PTO/sick/vacation] concurrently per company policy
- State PFML wage replacement: file with [state agency] - we will coordinate; estimated [%]

**Health insurance**: Your group health coverage continues as if you were actively at work. You remain responsible for the employee portion of premium ($[X]/[period]); we will coordinate with payroll for [direct billing / payroll deduction on return].

**Other benefits**: [401(k) contributions during paid portion; equity vesting per Plan; PTO accrual per policy]

**Certification**: [If required] Please return medical certification (form attached) within 15 calendar days. Scope is limited to confirming the qualifying condition and need for leave.

**Return to work**:
- Notify HR at least [3 / 5 / 10] business days before return so we can coordinate.
- Fitness-for-duty certification: [required / not required] for return from own-condition leave (must be required uniformly).
- We will reinstate you to your same or equivalent position.

**Anti-retaliation**: This leave is protected; retaliation is prohibited.

**Questions**: [HR contact + state agency portal for PFML].

Sincerely,
[HR Lead]

---
Attachments: medical certification form (if applicable), state PFML claim packet, benefits-during-leave summary.
```

## Intermittent-leave tracking

When leave is intermittent or reduced-schedule:

```markdown
## Intermittent Leave Tracker - [Employee]
| Date | Hours/Days Used | FMLA Bucket | State Bucket | Cumulative | Notes |
|------|-----------------|-------------|--------------|------------|-------|
| [Date] | [X hrs] | [used] | [used] | [running total] | [reason / certification ref] |

Reset date: [12-month period start]. Rolling backward / calendar / fiscal - match policy.
```

## Return-to-work plan

```markdown
## Return-to-Work Plan - [Employee]
**Last day of leave:** [Date] | **Return date:** [Date]

- Reinstatement role: same / equivalent - [Title]
- Schedule: [Standard / phased return]
- Accommodations on return: [If any from interactive process - see /hr accommodation-request]
- Fitness-for-duty certification received: [Y/N - if required uniformly]
- Manager 1:1 scheduled: [Date]
- Re-onboarding tasks: [tools, project briefings, key meetings]
- Lactation accommodation (if applicable per PUMP Act + state): [private space, break time]
- Performance: leave is not factored into performance evaluation
```

## Common pitfalls

- **Counting only federal FMLA** - many states are stricter (CA CFRA 5+ EE, NY PFL 1+ EE)
- **Denying state-only leave** because federal doesn't apply
- **Asking for diagnosis** - certification scope is limited
- **Charging fitness-for-duty selectively** - must be required uniformly
- **Counting leave against attendance / performance** - interference + retaliation risk
- **Not maintaining health insurance** during FMLA/state PFML
- **Failure to provide rights-and-responsibilities notice** within 5 business days

## Output Path

Save the analysis using `build_report_path("business-hr", instruction)` when writing to file.

## Output footer (REQUIRED on every generated record/letter)

End every record with this block, verbatim:

```
---
**DRAFT - REVIEW REQUIRED**

This leave analysis was generated as a starting template. It is not employment-law
advice. Eligibility math is unforgiving and statute-driven. Before finalizing:

1. Verify federal FMLA AND state PFML / state FMLA-equivalent eligibility separately.
2. Verify wage-replacement coordination with state agency (CA EDD, NY DOL, etc.).
3. Verify health insurance continuation during leave.
4. Verify rights-and-responsibilities notice issued within 5 business days.
5. Verify medical certification scope is limited (no diagnosis, no full records).
6. If intermittent: confirm tracking method and 12-month reset rule match policy.
7. Have HR counsel review denials.

Generated by Wayland business-hr plugin. Templates only - not employment-law advice.
```

---

> _Templates only - not employment-law advice. Have HR counsel review eligibility decisions and any denial._
