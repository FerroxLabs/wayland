---
name: finance-1099-prep
description: Vendor W-9 collection workflow, 1099-NEC vs 1099-MISC vs 1099-K decision tree, contractor classification check (IRS 20-factor + ABC test embedded), TIN matching, backup withholding triggers. Templates only - not personalized tax advice.
slash_command: false
as_of: 2026-05-03
attribution:
  lineage: authored (business-finance Wayland plugin)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [1099, tax, contractors, finance, smb, business]
---

> **Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** 1099 issuance is downstream of **worker-classification**. Misclassifying an employee as a 1099 contractor creates back-payroll-tax + penalties + interest + state UI / WC exposure that often exceeds six figures. Run the worker-classification gate (IRS 20-factor + state ABC test) BEFORE issuing any 1099. Review with a qualified CPA / EA / tax attorney before filing.

# Finance - 1099 Prep

Vendor / contractor 1099 preparation workflow. Covers W-9 collection, classification gate, 1099-NEC vs 1099-MISC vs 1099-K selection, TIN matching, and backup-withholding rules.

## Required inputs

- **Filing year** `{filing_year}`
- **Jurisdiction** (US - federal + any state with separate 1099 requirements like CA, MA)
- **Vendor list** - for each vendor paid in the year:
  - Legal name + DBA
  - Address
  - TIN (SSN or EIN)
  - Tax classification (sole prop, single-member LLC, partnership, C-corp, S-corp, other)
  - Total payments in the year
  - Payment method (check / bank ACH / credit card / PayPal / Venmo / Stripe / Zelle)
  - Nature of work performed
  - Whether worker has been onsite / supervised / using payer-supplied tools (classification factors)

## Worker-classification gate - RUN FIRST

> ⚠️ **Stop. Before issuing any 1099, run the worker-classification gate.** Misclassification is the highest-cost SMB tax error.

### Gate 1 - IRS Common-Law / 20-Factor test

Three control categories:
1. **Behavioral control** - does the payer instruct when, where, how, with what tools, in what sequence?
2. **Financial control** - who provides equipment, who bears the risk of loss, is the worker available to other clients, is there an investment in facilities?
3. **Type of relationship** - written contract, benefits, expected duration, services performed are key activity of payer.

If the payer controls the work, the worker is likely an **employee**, not a contractor. Form **SS-8** (Determination of Worker Status) lets you request an IRS determination if uncertain - note that filing SS-8 may itself trigger an examination of similar workers.

### Gate 2 - State ABC test (CA AB5 + ~20 other states)

Worker is presumed an **employee** unless **all three** prongs satisfied:
- **A.** Free from control and direction in fact and under contract.
- **B.** Performs work outside the usual course of the hiring entity's business.
- **C.** Customarily engaged in an independently established trade, occupation, or business of the same nature.

CA AB5 codified ABC broadly with carve-outs (Borello multi-factor for some occupations). NJ, MA, IL (effective 2025 partial), and others apply variants. **Failing any prong → employee. ABC is harder to satisfy than IRS test.**

### Gate 3 - Section 530 Safe Harbor (Federal)

Section 530 of the Revenue Act of 1978 may protect against IRS reclassification if:
1. All required 1099s were filed on time
2. Worker and similar workers were treated **consistently** as contractors
3. There is a **reasonable basis** for the classification (judicial precedent, prior IRS audit, long-standing industry practice)

Section 530 protects FICA / FUTA / income-tax-withholding. Does NOT protect against state-law claims, ERISA, or worker-side actions.

### Gate 4 - Backup withholding

If the payee:
- Fails TIN matching, OR
- Refuses or fails to provide a W-9, OR
- Has been notified of incorrect TIN by IRS ("B notice")

Then payer **MUST backup withhold at the rate published by IRS for `{filing_year}` (historically 24%)** on reportable payments and remit on **Form 945**. Payer reports backup withholding on the same 1099 in Box 4.

### Gate output

If the worker is reclassified as employee → STOP issuing 1099. Route to `finance-payroll-prep` to set up W-2 payroll (W-4, I-9, state new-hire reporting, withholding, FICA, FUTA, state UI / WC).

## W-9 collection workflow

Before any payment of $50+ to a non-employee, request **Form W-9 (Request for Taxpayer Identification Number and Certification)** from the payee.

- [ ] Send W-9 with the contract / engagement letter; do not pay until W-9 is on file.
- [ ] Verify legal name matches the TIN (SSN or EIN).
- [ ] **TIN matching** - use IRS TIN Matching service (e-Services) before issuing a large-volume 1099 batch. Mismatches trigger IRS B notices and require backup withholding.
- [ ] Confirm tax classification box (sole prop, single-member LLC, partnership, C-corp, S-corp, other LLC, exempt payee).
- [ ] Note **C-corp and S-corp** payees - generally exempt from 1099-NEC reporting (with exceptions: legal services to attorneys ARE reportable regardless of entity type; medical and health care payments ARE reportable to corporations).
- [ ] Retain W-9 in vendor file for at least 4 years after the last reportable payment.
- [ ] Re-collect when vendor's name, TIN, or entity type changes.

## 1099-NEC vs 1099-MISC vs 1099-K decision tree

### 1099-NEC (Nonemployee Compensation)
Use for payments to **non-employees** for services rendered (formerly Box 7 of 1099-MISC; spun off in 2020).
- Threshold: `[1099-NEC threshold for {filing_year}]` (historically $600; **OBBBA-era law schedules raise to $2,000** - confirm effective year for `{filing_year}`)
- Recipient types: independent contractors, freelancers, gig workers, attorneys (ALL legal-services payments regardless of entity), medical/health care providers (also regardless of entity)
- Filing deadline: **January 31** (both to recipient AND to IRS - no later filing for IRS copy)

### 1099-MISC (Miscellaneous Information)
Use for non-service payments:
- Box 1 - Rents (≥$600)
- Box 2 - Royalties (≥$10)
- Box 3 - Other income (prizes, awards) (≥$600)
- Box 5 - Fishing boat proceeds
- Box 6 - Medical and health care payments (≥$600, **even to corporations**)
- Box 7 - Substitute payments in lieu of dividends
- Box 10 - Gross proceeds paid to attorneys (settlement funds, ≥$600 - **not** legal services to your business; that is 1099-NEC Box 1)
- Filing deadline: paper Feb 28 / e-file March 31; recipient copy by Jan 31 (verify for `{filing_year}`)

### 1099-K (Payment Card and Third-Party Network Transactions)
**Issued by payment processors / third-party settlement organizations (TPSO)**, NOT the payer business. **Do not issue 1099-K yourself unless you are the TPSO.**
- Threshold for `{filing_year}` - **highly volatile**. The threshold has been changed and delayed multiple times:
  - Pre-2022: $20,000 + 200 transactions
  - 2022 ARPA scheduled to drop to $600; delayed
  - Phased schedule: $5,000 (2024), $2,500 (2025), $600 (2026 originally) - **but delayed multiple times by IRS notices**
  - **Verify the announced 1099-K threshold for `{filing_year}` against IRS.gov before assuming.**
- Implications for payee businesses: payments received through Stripe, PayPal, Square, Venmo (business), Cash App (business) etc. may already be reported on 1099-K - to avoid double-counting, **do not** also issue 1099-NEC for the same payments paid via credit card or third-party settlement organization. (Treas. Reg. on 1099-NEC excludes payments made by credit card / TPSO to avoid duplication.)

### Decision tree

```
Did you pay this party for SERVICES?
├── YES - services
│   ├── Paid by check / bank ACH / cash?
│   │   ├── YES → 1099-NEC (if total ≥ {filing_year} threshold AND payee is not a corp,
│   │   │       OR payee is an attorney providing legal services,
│   │   │       OR payment is medical/health care)
│   │   └── NO (paid by credit card / Stripe / PayPal-business / Square / Venmo-business)
│   │       → DO NOT issue 1099-NEC; the TPSO will issue 1099-K
│   └── Was the payee actually an employee under classification gate?
│       └── YES → STOP. Issue W-2 instead. Route to finance-payroll-prep.
└── NO - not for services
    ├── Rent paid to landlord? → 1099-MISC Box 1 (if ≥$600)
    ├── Royalties? → 1099-MISC Box 2 (if ≥$10)
    ├── Prizes / awards / "other income"? → 1099-MISC Box 3 (if ≥$600)
    ├── Settlement / gross proceeds paid to attorney? → 1099-MISC Box 10 (if ≥$600)
    └── Medical / health care payments? → 1099-NEC if for services to medical
                                          professional (regardless of entity)
                                          OR 1099-MISC Box 6 if for medical/health
                                          payments not for services rendered
```

## Filing process

1. **Verify W-9 on file for every vendor** that meets the threshold.
2. **TIN match** through IRS e-Services TIN Matching before issuing batch.
3. **For each vendor over threshold**:
   - Build 1099-NEC or 1099-MISC with name, address, TIN, amount in correct box, payer info.
   - Include any backup withholding in Box 4 (1099-NEC) or applicable box (1099-MISC).
4. **Furnish recipient copy by January 31**.
5. **File with IRS by January 31 (NEC) or per MISC schedule**, electronically if 10+ forms (verify e-file mandate threshold for `{filing_year}`). Use IRS FIRE system or IRIS portal.
6. **State filings** - many states require separate 1099 filings (CA, MA, OK, etc.); verify each.
7. Retain copies and W-9 for at least 4 years.

## Penalties (verify for `{filing_year}` against IRC §6721 / §6722)

- Late filed within 30 days: smaller penalty per form
- Late filed after 30 days but before August 1: medium per form
- Late filed after August 1 or never filed: largest per form
- **Intentional disregard**: substantially higher (no cap; ~$680+ per form historically)
- Failure to furnish recipient copy (§6722) stacks on top of failure to file with IRS (§6721) - penalties double

## Common errors to avoid

- Issuing 1099-NEC for credit-card / Stripe / PayPal-business payments (will be double-counted with 1099-K)
- Missing 1099 to attorneys / medical providers because they are corporations (corporations are NOT exempt for these categories)
- Not collecting W-9 before paying - leaves payer on hook for backup withholding
- Using 1099-MISC Box 7 (no longer exists post-2020 - that's now 1099-NEC)
- Missing state 1099 filings (CA Form 1099-NEC + state W-2 reconciliation)
- Skipping TIN match - IRS B notices later trigger backup withholding

## Workflow

1. Confirm `{filing_year}` and jurisdiction.
2. Run worker-classification gate for every vendor.
3. Collect / verify W-9 on file.
4. Run TIN matching.
5. Apply 1099-NEC / 1099-MISC / no-1099 (TPSO) decision tree per vendor.
6. Build 1099 batch with amounts, boxes, backup withholding.
7. Furnish recipient copies by January 31.
8. File with IRS (and any state) by deadline.
9. Output checklist + reconciliation report with disclaimer footer.

---

> _**Templates and analytical tools only - not personalized financial, tax, accounting, or legal advice.** Generated [DATE]. Jurisdiction: US federal + state. Filing year: `{filing_year}`. 1099-NEC threshold (historically $600, scheduled to rise to $2,000), 1099-K threshold (highly volatile), backup-withholding rate (historically 24%), and corporation-exception rules change with tax law - re-verify against IRS instructions for the year you are filing. Worker classification governs whether 1099 vs W-2 is appropriate; misclassification is the highest-cost SMB tax error. Review with a qualified CPA / EA / tax attorney before filing. Wayland and the plugin authors disclaim all liability for use of these templates._
