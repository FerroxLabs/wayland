---
name: hr-termination-letter
description: Draft an involuntary termination letter (performance / RIF / policy / at-will) with state-specific final-pay timing, COBRA / mini-COBRA notice, and OWBPA/ADEA-compliant separation agreement variant for age 40+. Templates only - not employment-law advice.
slash_command: false
argument-hint: "<employee name, reason category, state, severance terms>"
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [termination, separation, hr, people-ops, smb]
---

> **Templates only - not employment-law advice.** Termination letters trigger state-specific final-pay deadlines, COBRA / mini-COBRA notices, and ADEA release windows. Have HR counsel review every termination before delivery.

# HR - Termination Letter

Draft an involuntary-termination letter with the correct state-specific final-pay timing, COBRA route, and (when severance is offered to age-40+ employees) an OWBPA-compliant separation agreement.

## Pre-flight (REQUIRED - refuses to draft without these)

1. **Employee name, role, tenure**
2. **Reason category**: performance / RIF (use `/hr rif` for the upstream analysis) / policy violation / at-will (no cause stated) / for-cause misconduct
3. **State of employment** - drives final-pay timing (see matrix)
4. **Country**
5. **Total headcount** - federal vs state mini-COBRA route
6. **Employee age 40+?** - OWBPA 21-day + 7-day window if severance is offered
7. **Severance offered?** - what consideration (additional weeks of pay, COBRA subsidy, accelerated equity)
8. **Last day, last day worked, separation date**
9. **Active legal hold / harassment complaint involving employee?** - if yes, **STOP** and route to counsel (do not terminate during pending complaint without counsel sign-off - wrongful-termination/retaliation risk)
10. **Visa / immigration status** - H-1B/L-1/O-1 termination triggers 60-day grace period and USCIS notification; route to immigration counsel

## State-by-state final-pay timing (US - abbreviated; see `_jurisdiction.md` for full)

| State | Involuntary final pay due |
|-------|---------------------------|
| CA | Same day, all wages + accrued vacation; 30-day waiting-time penalty if late (Lab. Code §§201-203) |
| MA | Same day |
| CO | Immediately if practical, else within 6 hrs of next business day, 24 hrs if offsite |
| HI | Immediately or by next business day |
| CT | Next business day |
| MT | Immediately if for cause; 4 hrs / end of business day otherwise; **no at-will after probation** |
| NV | Immediately |
| IL, NY | Next regular payday |
| TX | Within 6 days |
| All others | Next regular payday safest default - verify state DOL |

## COBRA / mini-COBRA route

- 20+ EE: federal COBRA - Election Notice within 44 days (30 to plan admin + 14 to QB)
- <20 EE: state mini-COBRA per state matrix (CA Cal-COBRA, NY, NJ, CT, MA, IL, etc.)

## Output - Termination Letter (basic - without separation agreement)

```markdown
[Date]

[Employee Name]
[Address]

Dear [Employee Name],

This letter confirms that your employment with [Company Name] is terminated effective [Last Day]. [If notice period: Your last day of work is [date]; you will be paid through [date].]

**Reason for termination:** [Brief - performance / position eliminated as part of restructuring / policy violation / at-will (no reason stated, where state law permits)]

**Final pay.** You will receive your final paycheck on [Date - meeting state-specific timing requirement]. This includes:
- Earned wages through [Last Day]: $[X]
- Accrued, unused [PTO / vacation per state law and policy]: $[X]
- [Reimbursable expenses]: $[X]
- [Earned commissions per plan]: $[X]
- **Total**: $[X]

[Wages already earned, accrued PTO where state requires, and unreimbursed expenses are paid regardless of whether you sign any agreement.]

**Benefits.**
- Health insurance continues through [last day of month / last day of coverage].
- COBRA Election Notice [if 20+ EE] / Cal-COBRA / state mini-COBRA Election Notice [if <20 EE] will be mailed to you within [44 days federal / state-specific timeline].
- [HSA: portable. FSA: use by [date].]
- 401(k) distribution / rollover packet will be sent by the plan administrator.
- Equity: post-termination exercise window per Equity Plan and Grant Notice - [90 days / extended].

**Return of company property.** Please return [laptop, badge, phone, equipment] by [Date]. Arrangements: [pickup / shipping label / in-person].

**Continuing obligations.** Per your offer letter and Employee Confidentiality, Non-Solicitation, and Invention Assignment Agreement: confidentiality, non-solicitation [where enforceable in state], and the federal Defend Trade Secrets Act §1833(b) immunity notice continue to apply.

**References.** [Company]'s policy is to provide neutral references confirming your dates of employment and last position held. Direct reference inquiries to [HR contact].

**Unemployment insurance.** You may be eligible for unemployment insurance benefits. Contact [state UI agency]; we will respond to any UI claim consistent with applicable law. [If CA: you are receiving the EDD "For Your Benefit" pamphlet with this letter, as required by state law.]

**Anti-retaliation.** This decision is not retaliation for any protected activity. Federal and state law prohibits retaliation for filing complaints, requesting accommodations, taking protected leave, or other protected acts.

[Optional severance offer:]
We are offering severance benefits in exchange for your signature on the attached Separation Agreement and Release. Please review carefully. [If 40+: You have 21 days (or 45 days if group RIF) to consider, and 7 days after signing to revoke.]

We thank you for your contributions to [Company] and wish you the best in your next chapter.

Sincerely,

[HR Lead / Hiring Manager]
[Title]
[Company]

---

**Required attachments**
- [ ] Final paycheck or pay-stub (per state timing)
- [ ] State separation pamphlet (CA EDD "For Your Benefit"; NY DOL "Record of Employment"; etc.)
- [ ] COBRA / Cal-COBRA / state mini-COBRA Election Notice
- [ ] HSA/FSA/401(k) packet
- [ ] Equity grant post-termination exercise notice
- [ ] (If applicable) Separation Agreement and Release with OWBPA/ADEA language
```

## Output - Separation Agreement (when severance offered, age 40+)

Use the OWBPA/ADEA-compliant scaffold from `/hr offboard` (which includes 21-day consideration, 7-day revocation, McLaren Macomb-narrowed non-disparagement, decisional-unit disclosure for group RIF, and statute-protected-claims carve-outs).

## Tips

1. **Confirm final-pay timing matches state** - CA same-day involuntary is non-negotiable.
2. **COBRA / mini-COBRA notice** - federal vs state route based on headcount.
3. **OWBPA windows for 40+** - 21 days consider / 7 days revoke / 45 days if group RIF.
4. **Do not terminate during pending complaint** without counsel.
5. **Visa employees** - coordinate with immigration counsel before termination.
6. **Do not contest UI** as a default - fighting routine claims can characterize the termination as retaliatory.

## Output Path

Save the termination letter using `build_report_path("business-hr", instruction)` when writing to file.

## Output footer (REQUIRED on every generated letter)

End every termination letter (and separation agreement, if offered) with this block, verbatim:

```
---
**DRAFT - REVIEW REQUIRED**

This termination letter was generated as a starting template. It has not been
reviewed by employment counsel and may not comply with applicable law in your
jurisdiction. Before delivering:

1. Verify final-pay timing matches state rule (CA same-day; MA same-day; etc.).
2. Verify COBRA / state mini-COBRA route (20+ EE federal; <20 state).
3. If employee 40+ and severance offered: verify OWBPA 21-day (or 45-day group)
   consideration + 7-day revocation + decisional-unit disclosure (if RIF).
4. Verify non-disparagement narrowed per McLaren Macomb (NLRB 2023).
5. Verify no active protected-activity complaint or pending leave (route to counsel).
6. Verify state separation pamphlet attached (CA EDD "For Your Benefit," etc.).
7. Verify visa/immigration coordination if H-1B/L-1/O-1.

Generated by Wayland business-hr plugin. Templates only - not employment-law advice.
```

---

> _Templates only - not employment-law advice. Have HR counsel review every termination before delivery._
