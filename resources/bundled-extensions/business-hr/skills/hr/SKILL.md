---
name: hr
description: HR orchestrator for SMBs. Routes job descriptions, interview questions, onboarding, performance reviews, 1-on-1s, handbook sections, offer letters, offboarding, comp banding, PIPs, terminations, accommodations, leave, RIF, and pipeline reports to the right sub-skill. Templates only - not employment-law advice; outputs must be reviewed by HR counsel.
argument-hint: "<verb> [context]"
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [orchestrator, hr, people-ops, smb]
---

> **⚠️ Important: Templates Only - Not Employment Law Advice**
>
> Outputs are templates and HR frameworks designed to help structure people-ops work - they are **NOT employment-law advice**, are **NOT a substitute for HR counsel**, and may not be appropriate for your jurisdiction (US states, EU/UK/AU each have different rules). Employment law is jurisdiction-specific and rapidly changing.
>
> **Before using ANY output:**
> - Have employment counsel review for jurisdiction-specific compliance
> - Verify wage notices, mandatory training, and posting requirements
> - Confirm the document fits your specific facts (headcount, classification, jurisdiction)
>
> Anthropic, Wayland, and the plugin authors disclaim all liability for use of these templates.

# /hr - HR Orchestrator

AI-powered people operations for SMBs at the hire-2-to-20 stage. One command routes to the right HR workflow.

## Usage

```
/hr <verb> [context]
```

## Jurisdiction & headcount pre-flight (REQUIRED before any binding output)

Every sub-skill that emits a binding document - offer letter, termination letter, separation agreement, JD posting, handbook section, accommodation response, leave letter, RIF notice, PIP - MUST first collect:

1. **State(s) of employment** - primary state where work is performed (and any other states for remote workers).
2. **Country** - US / UK / EU member state / AU / CA / other (employment law differs sharply across these).
3. **Total company headcount** - drives FMLA (50+), Title VII (15+), ADEA (20+), federal COBRA (20+), WARN Act (100+), state mini-WARNs, mandatory anti-harassment training thresholds.
4. **Role classification** - W-2 vs 1099 (independent contractor) AND exempt vs non-exempt (FLSA salary test + duties test) AND full-time vs part-time vs temp.

**If any of these four are unknown:** the sub-skill must either (a) ask the user, or (b) clearly mark the output `DRAFT - JURISDICTION-DEPENDENT FIELDS UNFILLED` and refuse to fill state-specific clauses. Do not silently default to Delaware/at-will/federal-only.

See `_jurisdiction.md` (in this skills folder) for the full router checklist and high-risk topic flags.

## Verb Routing Table

| Verb | Sub-skill dispatched | Example |
|------|---------------------|---------|
| `job-description` | hr-job-description | `/hr job-description Senior Engineer` |
| `interview-questions` | hr-interview-questions | `/hr interview-questions Head of Marketing` |
| `onboard` | hr-onboard | `/hr onboard Jane Smith, Product Manager` |
| `review` | hr-review | `/hr review Alex Chen - Q4 cycle` |
| `1on1` | hr-1on1 | `/hr 1on1 Sam, eng lead, struggling with prioritization` |
| `handbook` | hr-handbook | `/hr handbook remote-work-policy` |
| `offer-letter` | hr-offer-letter | `/hr offer-letter Senior Designer, $140k, SF` |
| `offboard` | hr-offboard | `/hr offboard Jordan Lee, voluntary, 2 weeks notice` |
| `comp-band` | hr-comp-band | `/hr comp-band Staff Engineer, Series B, SF` |
| `report` | hr-report | `/hr report hiring pipeline Q2` |
| `pip` | hr-pip | `/hr pip Sam Lee, missed Q3 goals` |
| `termination-letter` | hr-termination-letter | `/hr termination-letter Alex Chen, performance, CA` |
| `accommodation-request` | hr-accommodation-request | `/hr accommodation-request medical, ergonomic chair` |
| `leave-of-absence` | hr-leave-of-absence | `/hr leave-of-absence FMLA, 12 weeks, NY` |
| `rif` | hr-rif | `/hr rif 8 roles, Series A reset` |
| `full-hire` | hr-job-description + hr-interview-questions + hr-comp-band (parallel) | `/hr full-hire Senior Backend Engineer` |

## Composite Flow: full-hire

`/hr full-hire <role>` fans out three sub-skills in parallel:
1. **hr-job-description** - complete JD with requirements and seniority calibration
2. **hr-interview-questions** - structured question bank and scorecard
3. **hr-comp-band** - market comp research for the role

Combine outputs into a hiring packet ready to post and evaluate.

## Routing Logic

1. Parse the first word after `/hr` as the verb.
2. Look up the verb in the table above. If found, dispatch to that sub-skill via `delegate_task`.
3. If verb is `full-hire`, fan out to hr-job-description, hr-interview-questions, and hr-comp-band simultaneously.
4. Before any sub-skill that emits a binding document runs, ensure the four pre-flight inputs above have been collected (or the output is marked unfilled).
5. If no verb matches, ask: "Which HR task can I help with? (job-description, interview-questions, onboard, review, 1on1, handbook, offer-letter, offboard, comp-band, report, pip, termination-letter, accommodation-request, leave-of-absence, rif)"

## When to Use Which Sub-skill

- **Hiring a new role?** Start with `job-description` + `comp-band`, then `interview-questions` when candidates are in.
- **Someone just accepted an offer?** Use `offer-letter` to draft the letter, then `onboard` to build their plan.
- **Review season?** Use `review` for templates + calibration prep.
- **Regular 1-on-1s?** Use `1on1` with employee context for a crisp agenda.
- **Writing the employee handbook?** Use `handbook` section by section.
- **Performance issue?** Use `pip` for a documented improvement plan with bias/pretext guardrails.
- **Someone leaving?** Use `offboard` for checklist; use `termination-letter` for involuntary separations with separation agreement.
- **Medical / pregnancy / religious accommodation?** Use `accommodation-request` for the interactive-process documentation.
- **Employee requesting FMLA / state PFML / personal leave?** Use `leave-of-absence`.
- **Reduction in force?** Use `rif` for WARN Act analysis + disparate-impact pre-check.
- **Leadership wants numbers?** Use `report` for pipeline and headcount metrics.

## What NOT to use this pack for (route to counsel)

- **Active harassment, discrimination, or retaliation complaints** - investigation requires counsel + neutral investigator
- **Executive separations** - bespoke equity, IP, and non-compete negotiations
- **Multi-state RIFs at WARN Act thresholds** - counsel must clear notification timing
- **Visa-sponsored employee terminations** - H-1B / L-1 / O-1 implications
- **Whistleblower / SOX / Dodd-Frank** matters - privileged investigation territory
- **Union or NLRA §7 protected concerted activity** - labor counsel required

## Disclaimer (repeat on every output)

> _Templates only - not employment-law advice. Have HR counsel licensed in your jurisdiction review every document before sending._
