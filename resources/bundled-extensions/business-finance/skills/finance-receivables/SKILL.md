---
name: finance-receivables
description: Analyze accounts receivable aging, calculate DSO, and generate compliant collection email sequences for overdue invoices. FDCPA / state-UDAP-aware language; intent-gated escalation; SOL-aware bad-debt write-off guidance. Ported from Anthropic's reconciliation skill, hardened for SMB liability surface.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: anthropics/knowledge-work-plugins/finance/skills/reconciliation/SKILL.md (Apache-2.0), adapted
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [receivables, collections, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Collection language carries FDCPA (third-party debt collectors) and state UDAP (original creditors in CA, NY, FL, TX + others) exposure. **Threatening legal action you do not intend or are not authorized to take is a textbook FDCPA §1692e violation pattern.** Review collection templates with counsel before sending. Bad-debt write-off and 1099-C issuance rules vary by basis of accounting.

# Finance - Receivables Management

Analyze AR aging, calculate Days Sales Outstanding (DSO), and generate **compliant** collection emails for overdue invoices.

## When to use

- Monthly AR aging review
- Identifying invoices at risk of becoming bad debt
- Drafting collection emails (first reminder through final notice)
- Calculating DSO and benchmarking against industry standards

## Required inputs

- **Jurisdiction**: US (with state) / UK / EU-country / CA / AU / other - collection law differs.
- **Basis of accounting**: cash / accrual / modified cash - determines bad-debt deductibility.
- **Invoice list** - paste as a table or describe: client name, invoice number, amount, invoice date, due date, status (open / partial / overdue), **whether the underlying contract specifies late fees and any contractual collection terms**.
- **Total monthly revenue** (for DSO calculation)
- **Period**: the as-of date for the aging analysis
- **Client type**: B2B / B2C - FDCPA and state UDAP exposure higher for consumer debts.

## FDCPA / UDAP gate - read before generating any collection language

> ⚠️ **Stop before threatening legal action.** The federal **Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. §1692)** technically governs **third-party debt collectors**, not original creditors. **However, ~15+ states extend collection-conduct rules to original creditors** via state UDAP / consumer-protection statutes - including **California (Rosenthal Fair Debt Collection Practices Act, Civ. Code §1788)**, **New York (GBL §349 + DFS rules)**, **Florida (FCCPA, Fla. Stat. §559)**, **Texas (DTPA + Tex. Fin. Code §392)**, **Massachusetts (M.G.L. c. 93 §49 + 940 CMR 7.00)**, and others.
>
> **The most common violations:**
> - **§1692e** - false, deceptive, or misleading representations, including:
>   - Threatening legal action you do not intend or are not authorized to take
>   - Misrepresenting the legal status of the debt
>   - Threatening to take action that cannot legally be taken
> - **§1692d** - harassment or abuse, including repeated calls, profane language, threats of violence
> - **§1692f** - unfair practices, including charging fees not authorized by contract or law
> - State UDAP equivalents apply the same standards to original creditors.

### Intent gate (required before any "FINAL NOTICE" or legal-action language)

Before generating Template 4 or any "legal remedies" / "collections agency" / "service suspension" language, the skill **MUST** ask the user:

> **Confirm intent for each escalation you want me to mention. I will only generate language for actions you (a) actually intend to take, (b) are authorized to take, and (c) can legally take.**
>
> 1. **Refer to a collections agency?** Y/N - if Y, do you have an engaged agency willing to take this account?
> 2. **Pursue legal action (small claims / civil suit)?** Y/N - if Y, do you have counsel engaged and is the SOL still open in the relevant state? Have you reviewed the matter with counsel?
> 3. **Suspend services?** Y/N - if Y, does the underlying contract authorize suspension for non-payment?
> 4. **Apply a late fee?** Y/N - if Y, is the late fee in the underlying signed contract and below the state usury / late-fee cap?
> 5. **Report to a credit bureau?** Y/N - if Y, are you a furnisher under the **FCRA** (Fair Credit Reporting Act)? FCRA accuracy and dispute-resolution duties apply.
> 6. **Issue a 1099-C?** Y/N - applies only after write-off; see write-off section.

If the user answers N to an item, that escalation **MUST NOT** appear in the generated email.

## AR aging report

Categorize each open invoice by days past due:

```
ACCOUNTS RECEIVABLE AGING - As of [Date]                  Jurisdiction: [SELECTED]
──────────────────────────────────────────────────────────────────
Client         Invoice #  Amount     Invoice Date  Due Date   Age     Bucket
──────────────────────────────────────────────────────────────────
[Client A]     INV-042    $2,400.00  2026-02-01    2026-03-03   0-30  Current
[Client B]     INV-039    $1,850.00  2026-01-15    2026-02-14  31-60  Aging
[Client C]     INV-031    $3,200.00  2025-12-01    2025-12-31  61-90  Overdue
[Client D]     INV-024    $5,500.00  2025-10-15    2025-11-14   90+   Critical
──────────────────────────────────────────────────────────────────
TOTALS
  Current (0–30 days):    $X,XXX    XX%
  Aging (31–60 days):     $X,XXX    XX%
  Overdue (61–90 days):   $X,XXX    XX%
  Critical (90+ days):    $X,XXX    XX%
  TOTAL OPEN AR:          $XX,XXX   100%
──────────────────────────────────────────────────────────────────
```

## DSO calculation

```
DSO = (Total Open AR / Total Revenue for Period) × Number of Days in Period

DSO benchmarks by industry (target):
  Professional services:       30–45 days
  Software / SaaS:             30–45 days
  Manufacturing:               40–55 days
  Wholesale / distribution:    35–50 days
  Construction:                45–70 days (varies widely)
```

## Collection email templates

> **Operating principle:** Reminders should be **factual, conditional, accurate**. Do not use loaded boilerplate. Every escalation must match the **gated intent** the user confirmed above.

### Template 1 - Friendly reminder (1–7 days past due)

```
Subject: Friendly reminder - Invoice [#] due [Date]

Hi [Client name],

Just a quick note - Invoice [#] for $[Amount] was due on [Date].
If you've already sent payment, please disregard this message.

If you have any questions about the invoice, I'm happy to help.
You can pay online at [link] or reply to arrange another method.

Thanks so much,
[Your name]
```

### Template 2 - Second notice (8–21 days past due)

```
Subject: Invoice [#] - payment overdue by [X] days

Hi [Client name],

I'm following up on Invoice [#] for $[Amount], which was due on [Date]
and is now [X] days past due.

Could you let me know the expected payment date? If there's a question
about the invoice, or if you'd like to arrange a payment plan, please
reach out - I'm glad to discuss options.

Payment link: [link]

Best,
[Your name]
```

### Template 3 - Firm notice (22–45 days past due)

```
Subject: Overdue Invoice [#] - [X] days past due

Hi [Client name],

Invoice [#] for $[Amount] (due [Date]) is now [X] days past due.

[IF late-fee gate = Y AND late-fee is in contract AND under usury cap:]
A late fee of [X]% [per month / annum] applies to amounts unpaid past
the due date, as provided in our agreement dated [Contract Date].

Could you let me know when payment will be remitted? If there's an issue
with the invoice or you'd like to discuss a payment plan, please reply
or call [Phone].

[Your name] | [Phone] | [Email]
```

> ⚠️ Do NOT include the late-fee paragraph if the underlying contract does not specify a late fee, or if the rate would exceed the state usury cap. State UDAP exposure.

### Template 4 - Final / pre-action notice (45+ days past due) - INTENT-GATED

> **Generation rule:** Only include each bracketed action **if the user confirmed Y at the intent gate**. If the user has not confirmed, the corresponding sentence MUST be omitted entirely. Do NOT use "no choice but to pursue legal remedies" boilerplate.

```
Subject: Invoice [#] - final notice before [confirmed-action]

[Client name],

Invoice [#] for $[Amount] is [X] days past due. Despite [N] prior
[reminders / messages / calls], the balance remains unpaid.

[IF collections gate = Y, agency engaged:]
If full payment is not received by [Date - typically 10 business days
from this notice], we will refer this account to [Agency Name],
which is authorized to pursue collection.

[IF legal-action gate = Y, counsel engaged, SOL open:]
If full payment is not received by [Date], we have authorized our counsel
[Firm Name, if disclosed] to evaluate filing a [small-claims / civil] action
in [Jurisdiction] for the unpaid balance plus any contractually permitted
costs.

[IF service-suspension gate = Y, contract authorizes suspension:]
Per Section [X] of our agreement dated [Contract Date], services will be
suspended on [Date] if payment is not received.

[IF none of the above are gated Y:]
We are writing to make a final request for payment. If you are unable to
pay in full at this time, please reply by [Date] to discuss a payment plan.

Payment must be made by: [Date]
Payment options: [Methods + link]

[Your name] | [Company] | [Phone] | [Email]
```

## Escalation path

| Age | Action |
|---|---|
| 0–30 days | Send invoice; no follow-up needed unless approaching due date |
| 1–7 days past due | Friendly reminder (Template 1) |
| 8–21 days past due | Second notice (Template 2) |
| 22–45 days past due | Firm notice (Template 3); flag for management review; check intent for next stage |
| 45–90 days past due | Final / pre-action notice (Template 4) - only with intent gate Y for the actions you actually intend to take |
| 90+ days | Evaluate bad-debt write-off + 1099-C threshold (see below); consult counsel before legal action; check SOL |

## State statute-of-limitations (SOL) - open accounts (US selected states)

> ⚠️ Re-verify against current state code; SOL **resets** if debtor makes a partial payment or written acknowledgment in many states. Suing on a time-barred debt can itself be a state UDAP violation in some states.

| State | Open account / written contract | Notes |
|---|---|---|
| CA | 4 years (written) / 2 years (oral / open) | Re-verify Code Civ. Proc. §337, §339 |
| NY | 6 years (written / open) | CPLR §213 |
| FL | 5 years (written) / 4 years (open) | Fla. Stat. §95.11 |
| TX | 4 years | Tex. Civ. Prac. & Rem. Code §16.004 |
| IL | 10 years (written) / 5 years (open) | 735 ILCS 5/13-205, 5/13-206 |
| WA | 6 years (written) / 3 years (open) | RCW 4.16.040, .080 |
| MA | 6 years | M.G.L. c. 260 §2 |
| GA | 6 years (written) / 4 years (open) | O.C.G.A. §9-3-24, §9-3-25 |
| Other | Verify | Range typically 3–10 years |

## Bad-debt write-off and 1099-C cancellation-of-debt

### Basis-of-accounting gate (CRITICAL)

> ⚠️ **Cash-basis filers cannot deduct uncollectible accounts receivable as bad debt.** Because cash-basis taxpayers never recognized the income (income is recognized only when cash is received), there is nothing to "write off" for tax purposes - the deduction is the absence of income. Only **accrual-basis** taxpayers (or businesses with inventory under §263A) can deduct uncollectible AR as a §166 business bad debt.

### Write-off workflow (accrual basis only)
1. Document collection attempts (dates, methods, responses).
2. Assess collectibility - is the debtor insolvent, has the SOL run, has the account been turned over to and returned by collections, has the customer disappeared?
3. Write off in the year the debt becomes **wholly or partially worthless** (IRC §166).
4. Reverse from AR; debit Bad Debt Expense; reduce any allowance if maintained.

### 1099-C issuance threshold (verify for `{filing_year}`)

If you are an **applicable entity** (financial institution, federal/state government, certain credit unions, large organizations) or otherwise required to file, you must issue **Form 1099-C "Cancellation of Debt"** when **$600 or more** of debt is canceled and an identifiable event occurs. **Most small SMBs are NOT applicable entities and are not required to issue 1099-C** - but if they are, the canceled amount is generally taxable to the debtor (with insolvency / bankruptcy / qualified principal residence exclusions). Verify against IRS Pub 4681 and Form 1099-C instructions for `{filing_year}`.

## Bad debt reserve guidance (accrual)

Consider reserving against receivables:
- 5–10% of 61–90 day balances
- 25–50% of 90+ day balances (depends on client history)
- 100% of balances with clients known to be insolvent

(Cash-basis: reserves are book-only; not deductible.)

## FCRA reminder

If you furnish information about a consumer debt to a credit reporting agency, you become a **"furnisher"** under the **Fair Credit Reporting Act (15 U.S.C. §1681s-2)** with affirmative duties to:
- Furnish accurate information.
- Investigate and respond to disputes within 30 days.
- Correct or delete inaccurate information.

Do not threaten credit-bureau reporting unless you actually furnish.

## Workflow

1. Confirm jurisdiction, basis of accounting, and per-account contract terms.
2. Build the AR aging report.
3. Calculate DSO.
4. For each overdue account, dispatch the appropriate template - running the **intent gate** before generating Template 4.
5. Flag accounts approaching SOL.
6. For accrual-basis users with critical balances: route to bad-debt write-off workflow.
7. Output with disclaimer footer.

---

> _**Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: [SELECTED]. Collection language carries FDCPA / state UDAP exposure (CA Rosenthal, NY GBL §349, FL FCCPA, TX DTPA, MA c. 93 §49). Threatening legal action you do not intend or are not authorized to take is an FDCPA §1692e violation pattern. Late-fee enforceability requires contractual basis. Bad-debt write-off and 1099-C rules differ by basis of accounting. State SOL chart is reference only; re-verify state code before relying. Review with counsel before sending Template 4 or pursuing legal action. Wayland and the plugin authors disclaim all liability for use of these templates._
