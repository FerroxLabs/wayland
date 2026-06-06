---
name: hr-rif
description: Reduction in Force planning - federal WARN Act analysis (100+ EE; 50+ in single site / 33% workforce / 500+), mini-WARN states (NY/CA/NJ/IL/TN/HI/etc.), disparate-impact (4/5ths rule) pre-check on selection list, notification timeline, and OWBPA/ADEA-compliant severance/release framework. Templates only - not employment-law advice.
slash_command: false
argument-hint: "<headcount affected, demographics of selected roles, business reason>"
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [rif, warn-act, hr, people-ops, smb]
---

> **Templates only - not employment-law advice.** A RIF without WARN Act compliance, disparate-impact analysis, and OWBPA-compliant releases is a class-action fact pattern. Have HR counsel sign off BEFORE notification.

# HR - Reduction in Force (RIF)

Plan a legally-defensible reduction in force: WARN Act analysis, disparate-impact pre-check, notification timeline, severance and release framework.

## ⛔ STOP - counsel checkpoint required

Multi-state RIFs and any RIF affecting 50+ employees at a single site MUST go through counsel BEFORE notification. WARN Act notice timing, mini-WARN state variations, and OWBPA disclosure obligations are unforgiving.

## Pre-flight (REQUIRED)

1. **Total company headcount** (federal WARN at 100+ EE)
2. **Headcount at affected single site** (federal WARN site-level rules)
3. **Number of employees affected**
4. **% of total workforce affected**
5. **Geography** - list every state with affected employees (mini-WARN routing)
6. **Demographic data of selected list** - race / sex / age / disability / pregnancy / FMLA status (for 4/5ths rule analysis); compare to retained pool
7. **Business reason** - economic downturn / restructuring / closure / acquisition; document
8. **Severance offered?** - consideration beyond what's owed (additional weeks, COBRA subsidy, accelerated equity)
9. **Any affected employee on protected leave / pending complaint / accommodation request?** - high retaliation risk; specific counsel review

## Federal WARN Act (1989)

- **Threshold**: 100+ full-time employees (or 100+ FT and PT working >4,000 hrs/wk)
- **Triggers** (90-day window):
  - **Plant closing**: shutdown of single site causing employment loss for 50+ employees
  - **Mass layoff**: employment loss for 500+ employees, OR 50-499 employees if they constitute ≥33% of single-site workforce
- **Notice**: **60 days written advance notice** to (a) affected employees or their reps, (b) state dislocated worker unit, (c) chief elected official of local government
- **Penalties**: back pay + benefits for each violated day (up to 60 days), $500/day to local government
- **Exceptions**: faltering company (closing only), unforeseeable business circumstances, natural disaster - all narrowly construed

## Mini-WARN states

| State | Threshold | Notice | Notes |
|-------|-----------|--------|-------|
| **CA** | 75+ EE; covered facility | **60 days** | Includes relocations 100+ miles; CalWARN broader than federal |
| **NY** | 50+ EE; site-based | **90 days** (longer than federal) | "Reduction in workforce" of 25+ EE / 33% / 250+ |
| **NJ** | 100+ EE | **90 days** + mandatory severance (1 wk per yr of service) | NJ Millville Dallas Airmotive Plant Job Loss Notification Act |
| **IL** | 75+ EE | 60 days | |
| **TN** | 50+ EE | 60 days | |
| **HI** | 50+ EE | 60 days | + dislocated worker allowance |
| **WI, IA, KS, MN, ND, OH, OR, PA, RI, SC, VT** | Various | Various | Verify state DOL |

## Disparate-impact pre-check (4/5ths rule)

Before announcing a RIF, run this analysis on the selected list:

| Group | # in retained pool | # in selected list | Selection rate (selected / pool) | Ratio vs majority |
|-------|---------------------|---------------------|----------------------------------|-------------------|
| Sex: female | [X] | [X] | [%] | [ratio] |
| Sex: male | [X] | [X] | [%] | 1.00 (baseline) |
| Race: Black | [X] | [X] | [%] | [ratio] |
| Race: Hispanic | [X] | [X] | [%] | [ratio] |
| Race: White | [X] | [X] | [%] | 1.00 (baseline) |
| Age: 40+ | [X] | [X] | [%] | [ratio] |
| Age: <40 | [X] | [X] | [%] | 1.00 (baseline) |
| Disability | [X] | [X] | [%] | [ratio] |
| Pregnancy | [X] | [X] | [%] | [ratio] |
| FMLA in last 12 mo | [X] | [X] | [%] | [ratio] |

**Adverse-impact flag**: any protected group with selection ratio < 0.80 (4/5ths) of the majority group, OR significant overrepresentation of FMLA/protected-event employees in selected list.

If flagged: **DO NOT proceed**. Either (a) document business necessity for the criterion driving the disparity, OR (b) revise the selection list. Document analysis and decisions contemporaneously.

## Selection criteria - defensible vs not

| Defensible | Risky |
|------------|-------|
| Job/position elimination (specific roles cut) | "Last in, first out" alone (age proxy) |
| Skills / certifications required for retained roles | "Highest paid" (age + tenure proxy) |
| Documented performance ratings (if rating process is rigorous + bias-checked) | "Manager discretion" with no criteria |
| Cross-training / breadth of skills | "Cultural fit" |
| Specific competency requirements | "Most likely to leave anyway" |

## OWBPA / ADEA group-RIF requirements (employees 40+)

When 2+ employees aged 40+ are in the RIF and severance is offered in exchange for a release, OWBPA requires:

- **45-day** consideration period (longer than non-RIF 21 days)
- **7-day** revocation after signing
- **Written disclosure** with the release containing:
  1. The decisional unit (the class, unit, or group from which selection was made)
  2. The eligibility factors / selection criteria
  3. Time limits applicable
  4. Job titles AND ages of all employees eligible or selected for the program
  5. Job titles AND ages of all employees in the same job classification or organizational unit who were NOT eligible or selected

Failure to include the disclosure invalidates the ADEA release for those individuals. Sample format:

```
ATTACHMENT - OWBPA DISCLOSURE FOR GROUP RIF

DECISIONAL UNIT: [Define - e.g., "Marketing department, Tier 2 and Tier 3 ICs and managers, US-based, as of [date]"]

ELIGIBILITY FACTORS / SELECTION CRITERIA: [List specifically - e.g., "Roles eliminated due to consolidation of Brand and Demand-Gen functions; selection based on (1) elimination of duplicate functions, (2) last 2 cycles of performance ratings, (3) skill match to remaining roles."]

TIME LIMITS: 45 days from receipt of this Agreement to consider; 7 days after signing to revoke.

EMPLOYEES SELECTED:
| Job title | Age |
|-----------|-----|
| [Title] | [Age] |
| [Title] | [Age] |

EMPLOYEES IN SAME UNIT NOT SELECTED:
| Job title | Age |
|-----------|-----|
| [Title] | [Age] |
```

## Output - RIF Plan

```markdown
## RIF Plan
**Date plan finalized:** [Date] | **Effective notification:** [Date] | **Effective separation:** [Date]
**Counsel sign-off:** [Date, name]

### 1. Business Reason (documented)
[Specific, contemporaneous - not retroactive - economic / strategic / structural reason]

### 2. Scope
- Total company headcount: [X]
- Affected: [X] (= [%] of total)
- Single-site analysis:
  - Site [Name]: [Site headcount X] / [Affected X] / [Site %]
- States affected: [list]

### 3. WARN Act Analysis
- **Federal WARN applicable?** [Y/N - based on 100+ EE threshold + plant closing or mass layoff trigger]
- Mass layoff trigger: 500+ OR (50-499 AND ≥33% of single site)
- Notice required: 60 days advance to (a) employees, (b) state dislocated worker unit, (c) local elected official
- **Mini-WARN by state**:
  - CA: [Applicable Y/N - 75+ EE; 60 days]
  - NY: [Y/N - 50+ EE; 90 days]
  - NJ: [Y/N - 100+ EE; 90 days + mandatory severance 1wk/yr]
  - [Other states]
- **Notification timeline**:
  - WARN notice issued: [Date] (60 days before separation; 90 days for NY/NJ)
  - Employee meetings: [Date]
  - Separation effective: [Date]

### 4. Disparate-Impact Pre-Check (4/5ths rule)
[Insert table from above; analyze before announcing]

If any flag: business-necessity defense documented OR list revised. Counsel reviewed: [Date].

### 5. Selection Criteria (defensible)
1. [Criterion - e.g., "Position elimination: roles in Function X consolidated"]
2. [Criterion - e.g., "Skill requirements for retained roles"]
3. [Criterion - performance only if rating process is rigorous + bias-checked]

Excluded: subjective "fit," informal "discretion," tenure-only, cost-only without role rationale.

### 6. Severance and Release Framework
- Severance formula: [X weeks of base + Y weeks per year of service, capped]
- COBRA / mini-COBRA subsidy: [X months]
- Equity acceleration: [If any]
- Outplacement: [Service if offered]
- **OWBPA disclosure** for 40+ (mandatory if any 40+ employee in RIF):
  - 45-day consideration / 7-day revocation
  - Decisional unit + criteria + selected-vs-not titles and ages

### 7. Communications Plan
- All-hands announcement: [Date - after individual notifications]
- Manager talking points (with HR script + Q&A)
- Customer / vendor / partner outreach
- Press / external comms (if material)
- Internal Q&A document

### 8. Notification Day
- One-on-one notification meetings (manager + HR + counsel-on-standby)
- Severance package delivered: [WARN notice + termination letter + separation agreement + COBRA notice + state pamphlets]
- Same-day final pay if state requires (CA, MA, etc.)
- Equipment retrieval scheduled
- Data preservation BEFORE access revocation (litigation hold check)

### 9. Outplacement and Wellness
- Outplacement provider: [Name]
- EAP for retained employees (RIF survivors): [Resource]

### 10. Post-RIF Reviews
- 30-day check on retained employees (workload, morale, regrettable resignation tracking)
- WARN compliance audit
- Disparate-impact post-mortem

```

## Common pitfalls

- **Missing mini-WARN in NY/NJ/CA** - federal threshold not reached but state is
- **NJ mandatory severance** - 1 week per year of service is statutory, not optional
- **Disparate-impact analysis after the fact** - must be done BEFORE notification
- **OWBPA missing decisional-unit disclosure** - invalidates release for 40+
- **Acceleration of layoff to "this week" to avoid WARN** - usually triggers "unforeseeable" exception scrutiny
- **RIF with active complaint / leave** - separate counsel review per individual
- **Visa employees** - 60-day grace period; H-1B portability; route to immigration counsel

## Output Path

Save the RIF plan using `build_report_path("business-hr", instruction)` when writing to file.

## Output footer (REQUIRED on every generated plan)

End every RIF plan with this block, verbatim:

```
---
**DRAFT - REVIEW REQUIRED**

This RIF plan was generated as a starting framework. It is not employment-law advice.
A non-compliant RIF is a class-action fact pattern. Before notification:

1. Verify federal WARN applicability (100+ EE, plant closing or mass layoff triggers).
2. Verify ALL state mini-WARNs (CA 75+ / NY 50+ / NJ 100+ / IL 75+ / TN 50+ / HI 50+ / etc.).
3. Verify NJ mandatory severance (1 wk per yr of service) if NJ employees affected.
4. Run the 4/5ths-rule disparate-impact analysis BEFORE notification; document findings.
5. If 40+ in RIF and release offered: 45-day consideration + 7-day revocation +
   OWBPA decisional-unit disclosure (titles + ages of selected and not-selected).
6. Confirm individuals with active leave / complaint / accommodation request reviewed
   by counsel separately.
7. Confirm visa employees coordinated with immigration counsel.
8. Confirm same-day final-pay states (CA, MA, NV, etc.).

Generated by Wayland business-hr plugin. Templates only - not employment-law advice.
```

---

> _Templates only - not employment-law advice. Have HR counsel sign off on the full RIF plan BEFORE any notification._
