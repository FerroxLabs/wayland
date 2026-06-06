---
name: legal-contractor
description: Generate an independent contractor / consulting agreement template - with worker-classification gate (IRS 20-factor + ABC + IR35), 1099 vs W-2 framing, IP assignment, payment terms, and exclusivity. Templates only - not legal advice. Misclassification carries six-figure exposure; have an attorney review before signing.
slash_command: false
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [contractor, ic-agreement, abc-test, legal, smb, business]
---

> **Templates only - not legal advice.** Have an attorney review before signing or distributing.

# Legal - Independent Contractor / Consulting Agreement

Generate an independent-contractor (1099 in the US) or consulting agreement. The biggest risk in this document is **misclassification**: drafting a "consulting agreement" for someone who is functionally a W-2 employee creates IRS, DOL, state-DOL, and unemployment-insurance liability - typical settlement is **$5K–$50K per misclassified worker**, plus back taxes and statutory penalties.

This skill therefore opens with a classification gate. If classification is shaky, it refuses and routes to `legal-employment`.

## When to use

- Hiring a true freelancer or consultant - has multiple clients, sets own schedule, provides own tools, performs work outside your core business
- Engaging a specialized agency / firm via a contractor-of-record
- Project-based engagements paid by deliverable, not by time

## When NOT to use

- Hiring full-time staff who will be integrated into operations → use `legal-employment`
- Engaging an executive / fractional C-suite → may be employee under most tests; use counsel
- Engaging through a staffing agency → the agency is the employer; you're the client of a B2B agreement; use `legal-contract` MSA
- Hiring across borders → local counsel in the contractor's country; permanent-establishment risk for the company

## Required inputs (ask upfront)

1. **Jurisdiction (HARD GATE)** - country + state/province for governing law. **If the user does not answer after one ask, REFUSE to generate.** Reply: "I cannot generate a contractor agreement without a governing-law jurisdiction. Worker-classification rules differ sharply (CA AB-5, NJ ABC test, MA, IL, IR35 in UK), and the wrong defaults create misclassification liability."
2. **Contractor location** - country + state/province where the work will be performed. May differ from the company jurisdiction; both matter for tax and classification.
3. **Scope** - deliverables, milestones, acceptance criteria
4. **Payment terms** - fixed fee, hourly, milestone-based, retainer; currency; payment cadence; net-15/30/60
5. **Term** - fixed end date, project completion, or open-ended with termination-for-convenience
6. **IP assignment** - work-for-hire vs. license-back; pre-existing IP carveout
7. **Exclusivity** - can the contractor work for competitors? (caution: exclusivity is a strong **employee** signal under both IRS and ABC tests)
8. **Tools and expenses** - who provides equipment? who reimburses?
9. **Number of expected clients** - only this company, or multiple? (single client = employee signal)

## Workflow

### Step 1: Worker-classification gate (HARD - refuse if shaky)

Run the same screening as `legal-contract` Step 1a. Reproduce the questions verbatim:

#### IRS 20-factor (high-signal questions)

1. Instructions - does the company control when/where/how?
2. Training - does the company train the worker?
3. Tools - who provides them?
4. Work hours - who sets the schedule?
5. Order of work - who controls task sequence?
6. Reports - required regularly?
7. Payment - by time (employee) or by deliverable (contractor)?
8. Expenses - who reimburses?
9. Multiple clients - yes (contractor) or no (employee signal)?
10. Right to discharge - at-will (employee) or only for breach (contractor)?
11. Integration - is the role part of the company's core operations?

#### ABC test (CA Lab. Code § 2775; NJ; MA; ~20 other states)

The hiring company must prove ALL THREE:

- **A**: Worker is free from control and direction in fact and under the contract.
- **B**: Work is outside the usual course of the hiring entity's business.
- **C**: Worker is customarily engaged in an independently established trade.

Failing any prong → employee classification.

#### IR35 (UK)

If contractor is UK-based:
- Working through a PSC?
- Right of substitution (can they send someone else)?
- Mutuality of obligation (must the company offer work and the worker accept)?
- Control over how, when, where?

#### Decision and routing

- **CLEAR CONTRACTOR** - proceed to Step 2.
- **SHAKY OR EMPLOYEE** - REFUSE. Reply:
  > "Based on your answers, the working relationship has material employee indicators (specifically: [list factors]). I will not generate a contractor template. Drafting a 'consulting agreement' for a functional employee creates IRS back-tax exposure, state DOL penalties, and class-action liability under CA Lab. Code § 2775 / NJ ABC test / similar. Use `/legal employment` for an employment agreement, or engage an employment attorney to evaluate the relationship before classifying."

Record the gating decision (questions asked, answers given, decision rationale) in the document's attorney-review-notes section.

### Step 2: Confirm tax framing

US: this is a **1099-NEC** relationship. Tell the user:
- Company will issue Form 1099-NEC if total annual payments to the contractor reach $600 (federal threshold; some states lower).
- Company collects W-9 from the contractor BEFORE first payment (with TIN; mandatory under IRS rules). Backup withholding (currently 24%) applies if W-9 not collected.
- Contractor pays self-employment tax (15.3% SE tax + income tax). The company does NOT withhold.
- Contractor is NOT eligible for company benefits, unemployment, workers' comp (in most states).

UK: confirm IR35 status determination. Medium/large engaging companies must issue a Status Determination Statement (SDS); if Inside IR35, PAYE/NIC apply.

EU: contractor must be self-employed under local law (Selbstständig in DE; lavoratore autonomo in IT; auto-entrepreneur in FR). Permanent-establishment risk for the company if scope of contractor work is broad.

### Step 3: Generate the contractor agreement - verbatim canonical clauses

Reproduce sections in this order. Replace bracketed placeholders. Do not summarize.

#### 1. Parties and Effective Date

```
This Independent Contractor Agreement (the "Agreement") is entered into as of [EFFECTIVE DATE] by and between [COMPANY LEGAL NAME], a [STATE/COUNTRY] [ENTITY TYPE] with its principal place of business at [ADDRESS] ("Company"), and [CONTRACTOR LEGAL NAME], [an individual / a [STATE/COUNTRY] [ENTITY TYPE]] with [an address / a principal place of business] at [ADDRESS] ("Contractor"). Each may be referred to as a "Party" and collectively as the "Parties."
```

#### 2. Independent Contractor Relationship (mandatory)

```
The Parties intend to establish an independent contractor relationship and not an employment, agency, partnership, or joint venture relationship. Contractor is engaged as an independent contractor and not as an employee. Accordingly:

(a) Contractor shall determine the manner, method, and means of performing the Services and shall control the work, subject only to the deliverables and acceptance criteria described in the applicable Statement of Work.
(b) Contractor shall provide Contractor's own equipment, tools, materials, and workspace, except as expressly stated in the SOW.
(c) Contractor is free to perform services for other clients, including competitors, except as expressly limited by Section [Exclusivity, if applicable].
(d) Contractor is solely responsible for, and shall pay, all federal, state, local, and foreign income taxes, self-employment taxes, social security and Medicare contributions (or local equivalents), and any other taxes or levies on amounts paid under this Agreement. Company shall not withhold any taxes from amounts paid to Contractor.
(e) Contractor is not entitled to participate in any of Company's employee benefit plans (including health, dental, vision, retirement, vacation, sick leave, or stock-option plans), workers' compensation, unemployment insurance, or other benefits provided to employees.
(f) Contractor shall not be entitled to overtime pay, minimum-wage protection, or other protections applicable to employees under applicable law.
(g) Contractor shall not have the authority to bind Company to any contract or obligation, and shall not represent itself as an employee, partner, agent, or representative of Company.
```

#### 3. Services and Statement of Work

```
Contractor shall perform the services described in one or more written Statements of Work (each, an "SOW") attached to or incorporated by reference into this Agreement. Each SOW shall identify (a) the deliverables, (b) the schedule, (c) the fees and payment terms, (d) acceptance criteria, and (e) any Contractor personnel assigned. In the event of a conflict between this Agreement and an SOW, the SOW controls only to the extent it expressly references the conflicting term.
```

#### 4. Fees and Payment

```
Company shall pay Contractor the fees stated in each SOW. Unless an SOW provides otherwise, Contractor shall invoice Company [monthly / upon milestone completion / upon final delivery], and Company shall pay undisputed amounts within [NET PAYMENT - e.g., thirty (30)] days of receipt of a valid invoice. Late undisputed amounts accrue interest at the lesser of [1.0%] per month or the maximum rate permitted by applicable law. Each invoice shall reference this Agreement, the SOW, and the period covered.

Contractor's fees are inclusive of all expenses unless an SOW expressly authorizes pre-approved reimbursable expenses, supported by receipts.

Contractor is responsible for all taxes on amounts received except for any sales, use, VAT, or similar tax that the SOW expressly states is in addition to fees.
```

#### 5. Term and Termination

```
This Agreement begins on the Effective Date and continues until terminated as provided in this Section. Either Party may terminate this Agreement, or any SOW, for any reason or no reason on [TERMINATION-FOR-CONVENIENCE NOTICE - default fifteen (15)] days' written notice. Either Party may terminate immediately for material breach if the breaching Party fails to cure within [CURE - default ten (10)] days of written notice of the breach.

Upon termination: (a) Contractor shall promptly deliver all work in progress, deliverables, and Company materials in Contractor's possession; (b) Company shall pay all undisputed fees for services performed and expenses incurred through the termination date; (c) the rights and obligations in Sections [IP, Confidentiality, Indemnification, Governing Law, Miscellaneous] survive termination.
```

#### 6. Intellectual Property

```
[CHOOSE ONE - match the SOW]

OPTION A - Work-for-hire / assignment (default for product, engineering, design):
All deliverables, work product, inventions, discoveries, designs, software, and materials created by Contractor in performing the Services (the "Work Product") are works made for hire under the U.S. Copyright Act to the extent permitted by law and shall be the sole and exclusive property of Company. To the extent any Work Product does not qualify as a work made for hire, Contractor irrevocably assigns to Company all right, title, and interest in and to the Work Product, including all intellectual property rights, effective upon creation.

Contractor retains ownership of any pre-existing materials owned by Contractor before the Effective Date and disclosed in writing to Company (the "Background IP"). To the extent Contractor incorporates Background IP into the Work Product, Contractor grants Company a perpetual, worldwide, royalty-free, sublicensable license to use, reproduce, modify, and distribute the Background IP as part of the Work Product.

Contractor shall execute any further documents Company reasonably requests to perfect the assignment.

OPTION B - License-back (use only when contractor retains ownership of a tool / framework / library):
Contractor retains ownership of the Work Product and grants Company a perpetual, worldwide, royalty-free, fully-paid, sublicensable license to use, reproduce, modify, and distribute the Work Product for Company's business purposes.
```

#### 7. Confidentiality

```
Contractor shall hold all of Company's non-public information disclosed to or learned by Contractor in connection with this Agreement ("Confidential Information") in strict confidence, shall use it solely to perform the Services, and shall not disclose it to any third party without Company's prior written consent. Confidential Information does not include information that is or becomes publicly available through no fault of Contractor, was rightfully in Contractor's possession before disclosure, was rightfully received from a third party without restriction, or is independently developed by Contractor without use of or reference to Company's Confidential Information. Contractor may disclose Confidential Information to the extent required by applicable law or legal process, provided that, where legally permitted, Contractor gives Company prompt notice and reasonable cooperation in seeking a protective order. Contractor's obligations under this Section survive termination for [SURVIVAL - default three (3)] years.
```

#### 8. Representations and Warranties

```
Each Party represents and warrants that it has full power and authority to enter into this Agreement and that its performance does not breach any other agreement. Contractor further represents and warrants that (a) the Services will be performed in a professional and workmanlike manner; (b) the Work Product will be Contractor's original work and will not infringe any third party's intellectual property or proprietary rights, except for properly licensed third-party components disclosed in the SOW; and (c) Contractor will comply with all applicable laws in performing the Services.
```

#### 9. Indemnification

```
Contractor shall indemnify, defend, and hold harmless Company from any third-party claims, damages, losses, and reasonable attorneys' fees arising out of (a) Contractor's breach of Section 8 (Representations and Warranties); (b) Contractor's gross negligence or willful misconduct; or (c) Contractor's breach of confidentiality. Company's sole remedy for misclassification claims by Contractor is excluded from this indemnification (each Party bears its own classification risk subject to applicable law).
```

#### 10. Limitation of Liability

```
EXCEPT FOR BREACHES OF CONFIDENTIALITY OR INDEMNIFICATION OBLIGATIONS, NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, AND EACH PARTY'S AGGREGATE LIABILITY SHALL NOT EXCEED THE FEES PAID OR PAYABLE UNDER THE APPLICABLE SOW DURING THE [TWELVE (12)] MONTHS PRECEDING THE CLAIM.
```

#### 11. Insurance (optional - include for higher-risk engagements)

```
Contractor shall maintain, at Contractor's sole expense, the following insurance during the Term: (a) commercial general liability of not less than $[1,000,000] per occurrence; (b) professional liability / E&O of not less than $[1,000,000] per claim; (c) workers' compensation as required by applicable law (if Contractor has employees). Contractor shall provide certificates of insurance on request and shall name Company as additional insured under the CGL policy.
```

#### 12. Exclusivity (CONDITIONAL - surface AB-5 / 20-factor risk)

If the user requested exclusivity:

```
[WARNING - exclusivity is a strong employee signal under the IRS 20-factor test and the ABC test. Including this clause may convert the relationship to W-2 employment under applicable law.]

[Optional language, with attorney review:]
During the Term and for [DURATION - default zero, i.e., not recommended] thereafter, Contractor shall not perform substantially similar services for [LIST - competitors named or category]. This exclusivity is limited to [SCOPE - narrow, e.g., the specific deliverable].
```

If user insists on exclusivity, surface a prominent reminder: "Exclusivity may convert this to an employment relationship for tax and classification purposes. Confirm with employment counsel before relying on this clause."

#### 13. Governing Law and Dispute Resolution

```
This Agreement shall be governed by the laws of [JURISDICTION - required input], without regard to conflict-of-laws principles. Any dispute arising out of or relating to this Agreement shall first be subject to good-faith negotiation between executives, then to non-binding mediation under [JAMS / AAA] rules, and only thereafter to [court / arbitration] in [VENUE].
```

#### 14. Miscellaneous

```
This Agreement (with all SOWs) is the entire agreement between the Parties on its subject matter. Amendments require a writing signed by both Parties. Notices must be in writing and sent to the addresses in the Parties' signature blocks. If any provision is unenforceable, the remainder continues in effect. This Agreement may be executed in counterparts, including by electronic signature.
```

#### 15. Signature Block

```
COMPANY                              CONTRACTOR

By: _____________________            By: _____________________
Name: [NAME]                          Name: [NAME]
Title: [TITLE]                        Title: [TITLE]
Date: ___________________            Date: ___________________
```

### Step 4: Generate companion artifacts (mention)

- **Statement of Work (SOW)** - separate doc per project; reference back to this Agreement.
- **Form W-9** (US) - collect from contractor before first payment.
- **W-8BEN / W-8BEN-E** (non-US contractors) - required for tax-treaty benefits and to avoid 30% backup withholding.
- **Status Determination Statement (UK IR35)** - if applicable.

### Step 5: Save

Save to `build_report_path("business-legal", "contractor-<contractor>-<date>.md")`.

### Step 6: Tell the user the next steps

1. Counsel review - every classification, every IP clause, every dispute clause.
2. Collect W-9 before first payment (US) or W-8BEN/IR35 SDS (non-US).
3. Track 1099-NEC threshold ($600 US federal; lower in some states like CA at $600 for certain payments, MA $1).
4. Confirm contractor has own insurance if higher-risk engagement.
5. Calendar a relationship review at 6 months and 12 months - facts on the ground (not just the contract) determine classification.

## Output footer (REQUIRED on every generated document)

End every generated contractor document with this block, verbatim:

```
---
**DRAFT - NOT LEGAL ADVICE**

This document was generated as a starting template. It has not been reviewed by an attorney and may not comply with applicable law in your jurisdiction. Before signing, distributing, or relying on this document, you must:

1. Have a qualified attorney licensed in your jurisdiction review and revise it.
2. Verify all clauses are enforceable under applicable law.
3. Confirm it fits your specific situation, parties, and use case.

Generated by Wayland business-legal plugin. No warranty, express or implied.
```

---

> _Templates only - not legal advice. Misclassification carries six-figure exposure - engage employment counsel for any close-call relationship._
