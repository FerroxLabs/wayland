---
name: contract-reviewer
description: |
  Comprehensive contract review checklist covering key clauses, red flags, negotiation points, and common contract types including employment, freelance, lease, and service agreements with amendment process guidance.
  Use when the user asks about contract reviewer, or needs help with comprehensive contract review checklist covering key clauses, red flags, negotiation points, and common contract types including employment, freelance, lease, and service agreements with amendment process guidance.
  Do NOT use when the request requires professional legal advice or falls outside the scope of contract reviewer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts guide"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---

# Contract Reviewer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User wants to understand clauses in a contract before signing
- User needs help identifying concerning terms in an agreement
- User wants a plain-language explanation of contract language
- User needs a checklist of what to look for in a specific contract type

**Do NOT use this skill when:**
- User needs legally binding contract drafted -- refer to qualified attorney
- User needs legal advice on whether to sign -- this skill teaches literacy, not legal counsel
- User has an active legal dispute about a contract -- refer to legal professional

## Process

1. **Step 1:** Identify contract type and key parties involved
2. **Step 2:** Review and explain critical clauses: payment, termination, liability, IP, non-compete
3. **Step 3:** Flag concerning terms: one-sided provisions, hidden fees, auto-renewal, broad indemnification
4. **Step 4:** Provide plain-language summary of obligations and rights for each party
5. **Step 5:** Suggest questions to ask before signing and clauses to negotiate

## Purpose

This skill provides a systematic approach to reviewing contracts of all types. It covers the key clauses to examine, red flags to watch for, negotiation strategies, and specific guidance for the most common contract types.

---

## Questions to Ask the User First

1. **What type of contract is this?** (employment, freelance/independent contractor, residential lease, commercial lease, service agreement, SaaS/software, NDA, partnership, purchase agreement, other)
2. **Which party are you?** (the one who drafted it, or the one being asked to sign)
3. **What is the total value of the contract?** (monetary or estimated equivalent)
4. **Is this negotiable or take-it-or-leave-it?**
5. **What is your biggest concern about this contract?**
6. **Have you signed contracts like this before?**
7. **Is there a deadline for signing?**
8. **What state/country will this contract be governed by?**

---

## Master Contract Review Checklist

### Phase 1: Structural Review

```
STRUCTURAL REVIEW CHECKLIST
============================

[ ] Document is complete (no blank pages, missing exhibits, or "[TBD]" placeholders)
[ ] All pages are present and numbered sequentially
[ ] All exhibits and attachments referenced in the body are actually attached
[ ] Defined terms are used consistently throughout
[ ] Party names are correct and match legal entity names
[ ] Dates are filled in correctly (effective date, term, deadlines)
[ ] Dollar amounts are written in both words and numerals where applicable
[ ] Signature blocks match the named parties
[ ] No handwritten additions without both parties' initials
[ ] Version is marked as "final" or equivalent (not "draft")
```

### Phase 2: Key Clause Examination

#### 1. Definitions Section
- Are all capitalized terms defined?
- Are definitions overly broad or narrow?
- Do definitions match your understanding of the deal?
- Watch for: "including but not limited to" (expands scope dramatically)

#### 2. Scope of Work / Services
```
SCOPE REVIEW:
- Deliverables clearly listed: YES / NO
- Acceptance criteria defined: YES / NO
- Timeline/milestones specified: YES / NO
- Change order process included: YES / NO
- Out-of-scope items identified: YES / NO
```

#### 3. Payment Terms
```
PAYMENT REVIEW:
- Total amount: {{AMOUNT}}
- Payment schedule: {{SCHEDULE}}
- Payment method: {{METHOD}}
- Late payment penalty: {{PENALTY}}
- Invoice requirements: {{REQUIREMENTS}}
- Expense reimbursement: {{TERMS}}
- Currency specified: {{CURRENCY}}
- Tax responsibilities: {{WHO_PAYS_TAX}}
```

#### 4. Term and Termination
```
TERMINATION REVIEW:
- Start date: {{DATE}}
- End date: {{DATE}} or {{CONDITION}}
- Auto-renewal: YES / NO
  - Renewal term: {{TERM}}
  - Opt-out window: {{WINDOW}}
- Termination for convenience:
  - By you: YES / NO -- Notice: {{DAYS}} days
  - By them: YES / NO -- Notice: {{DAYS}} days
- Termination for cause:
  - Cure period: {{DAYS}} days
  - What constitutes "cause": {{DEFINITION}}
- Effect of termination:
  - Surviving clauses: {{LIST}}
  - Wind-down obligations: {{OBLIGATIONS}}
  - Payment for work completed: {{TERMS}}
```

#### 5. Liability and Indemnification
```
LIABILITY REVIEW:
- Your liability cap: {{AMOUNT_OR_FORMULA}}
- Their liability cap: {{AMOUNT_OR_FORMULA}}
- Mutual or one-sided: {{ASSESSMENT}}
- Consequential damages excluded: YES / NO
- Indemnification:
  - You indemnify them for: {{TRIGGERS}}
  - They indemnify you for: {{TRIGGERS}}
  - Indemnification procedure defined: YES / NO
- Insurance requirements: {{REQUIREMENTS}}
```

#### 6. Intellectual Property
```
IP REVIEW:
- Who owns pre-existing IP: {{TERMS}}
- Who owns IP created during the contract: {{TERMS}}
- License grants: {{SCOPE_AND_DURATION}}
- Work-for-hire designation: YES / NO
- IP assignment clause: YES / NO
- Right to use for portfolio/reference: YES / NO
```

#### 7. Non-Compete / Non-Solicitation
```
RESTRICTIVE COVENANT REVIEW:
- Non-compete present: YES / NO
  - Duration: {{TIME}}
  - Geographic scope: {{AREA}}
  - Industry/activity scope: {{DESCRIPTION}}
  - Reasonableness assessment: {{ASSESSMENT}}
- Non-solicitation present: YES / NO
  - Covers employees: YES / NO
  - Covers clients: YES / NO
  - Duration: {{TIME}}
```

#### 8. Confidentiality
```
CONFIDENTIALITY REVIEW:
- Definition of confidential information: {{SCOPE}}
- Exclusions from confidentiality: {{LIST}}
- Duration of obligation: {{TIME}}
- Permitted disclosures: {{CIRCUMSTANCES}}
- Return/destruction of materials: {{TERMS}}
```

#### 9. Dispute Resolution
```
DISPUTE RESOLUTION REVIEW:
- Method: LITIGATION / ARBITRATION / MEDIATION-THEN-ARBITRATION
- Venue/Location: {{LOCATION}}
- Governing law: {{JURISDICTION}}
- Prevailing party attorney fees: YES / NO
- Jury trial waiver: YES / NO
- Class action waiver: YES / NO
- Arbitration provider: {{PROVIDER}}
- Number of arbitrators: {{NUMBER}}
```

#### 10. Warranties and Representations
```
WARRANTY REVIEW:
- Warranties provided by them: {{LIST}}
- Warranties provided by you: {{LIST}}
- "AS IS" disclaimer present: YES / NO
- Warranty duration: {{TIME}}
- Remedy for warranty breach: {{REMEDY}}
```

---

## Red Flags by Severity

### Critical Red Flags (Do Not Sign Without Resolution)
1. **Unlimited personal liability** when you are an entity
2. **Perpetual non-compete** with no geographic limitation
3. **Unilateral amendment rights** without notice or consent
4. **Assignment of all IP** including pre-existing and unrelated work
5. **Auto-renewal with no opt-out mechanism** or very short cancellation window
6. **Penalty clauses** that are disproportionate to actual damages
7. **Blank or "[TBD]" sections** in material terms

### Serious Red Flags (Negotiate Before Signing)
1. **One-sided indemnification** -- you cover their losses but not vice versa
2. **Arbitration in a distant venue** with costs borne by you
3. **Broad definition of "cause"** that includes subjective standards
4. **No cure period** before termination for breach
5. **Late payment interest** above state usury limits
6. **Liability cap that only applies to them** but not to you
7. **Overly broad confidentiality** preventing you from discussing the relationship

### Caution Flags (Understand and Accept Knowingly)
1. **Governing law** in a different state than yours
2. **Non-solicitation of employees** (standard but verify scope)
3. **Insurance requirements** that may require additional coverage
4. **Audit rights** that may be burdensome
5. **Notice requirements** via specific methods only (e.g., certified mail)

---

## Negotiation Strategies by Clause

### General Negotiation Principles
1. **Prioritize.** Pick 3-5 most important items; do not redline everything.
2. **Propose alternatives.** Do not just reject; offer a counter.
3. **Use standards.** "Industry standard is..." carries persuasive weight.
4. **Trade.** Concede on less important points to win on critical ones.
5. **Get it in writing.** Verbal assurances mean nothing if the contract says otherwise.

### Specific Negotiation Scripts

**For One-Sided Indemnification:**
```
"We are comfortable with mutual indemnification for each party's own
negligence or willful misconduct. We propose making Section {{X}}
reciprocal so both parties share proportional risk."
```

**For Broad Non-Compete:**
```
"We appreciate the business interest this protects. We propose narrowing
the scope to [specific competitors/activities] within [specific geography]
for a period of [6-12 months] to make this enforceable and proportionate."
```

**For Unlimited Liability:**
```
"We propose capping each party's aggregate liability at [1-2x the total
contract value or fees paid in the prior 12 months], with customary
carve-outs for indemnification obligations, IP infringement, and
confidentiality breaches."
```

**For Missing Cure Period:**
```
"We propose adding a [15-30] day cure period for any curable breach
before the non-breaching party may terminate, with written notice
specifying the breach."
```

**For Automatic Renewal:**
```
"We propose that either party may opt out of renewal by providing
written notice at least [60-90] days before the end of the current term,
rather than the current [X] day window."
```

---

## Common Contract Types: Specific Guidance

### Employment Contract Checklist

```
EMPLOYMENT-SPECIFIC REVIEW:
[ ] Job title and reporting structure
[ ] Compensation (base, bonus structure, equity/options)
[ ] Benefits (health, dental, vision, 401k match, PTO)
[ ] Start date and at-will status
[ ] Non-compete scope and enforceability in your state
[ ] IP assignment -- does it cover personal projects?
[ ] Severance terms upon termination
[ ] Clawback provisions on bonuses/equity
[ ] Relocation requirements or travel expectations
[ ] Remote work policy
[ ] Change of control / acquisition provisions
[ ] Garden leave provisions
```

### Freelance / Independent Contractor Agreement Checklist

```
FREELANCE-SPECIFIC REVIEW:
[ ] Properly classifies you as independent contractor (not employee)
[ ] Scope of work is specific, not open-ended
[ ] Payment terms (net 15/30/45, milestones, retainer)
[ ] Kill fee if project is cancelled
[ ] Revision limits
[ ] Portfolio usage rights
[ ] Tax form requirements (W-9)
[ ] Equipment/tool responsibilities
[ ] Exclusivity restrictions (can you work for competitors?)
[ ] Subcontracting rights
```

### Residential Lease Checklist

```
LEASE-SPECIFIC REVIEW:
[ ] Rent amount, due date, grace period, late fee
[ ] Security deposit amount and return conditions/timeline
[ ] Lease term and renewal options
[ ] Maintenance responsibilities (tenant vs landlord)
[ ] Subletting and assignment rights
[ ] Pet policy and associated fees
[ ] Parking, storage, amenity access
[ ] Entry/access by landlord (notice required)
[ ] Utilities included vs tenant-paid
[ ] Modification/alteration restrictions
[ ] Insurance requirements (renter's insurance)
[ ] Early termination penalty and conditions
```

### SaaS / Service Agreement Checklist

```
SAAS-SPECIFIC REVIEW:
[ ] Service level agreement (SLA) with uptime guarantee
[ ] SLA remedy (service credits, termination right)
[ ] Data ownership and portability
[ ] Data security obligations and breach notification
[ ] Integration and API access rights
[ ] Price increase limitations
[ ] Implementation timeline and support levels
[ ] User/seat licensing model
[ ] Data retention and deletion upon termination
[ ] Acceptable use policy scope
[ ] Suspension rights (can they suspend service?)
[ ] Subprocessor notification
```

---

## Amendment Process

### How to Propose Amendments

1. **Review the amendment clause** in the existing contract first
2. **Check required format** -- many contracts require amendments in writing, signed by both parties
3. **Draft a redline version** showing proposed changes clearly
4. **Use an amendment document** rather than creating a whole new contract

### Amendment Template

```
AMENDMENT NO. {{NUMBER}} TO {{CONTRACT_NAME}}

This Amendment No. {{NUMBER}} ("Amendment") to the {{CONTRACT_NAME}} dated
{{ORIGINAL_DATE}} (the "Agreement") is entered into as of {{AMENDMENT_DATE}}
by and between {{PARTY_A}} and {{PARTY_B}}.

RECITALS

WHEREAS, the parties entered into the Agreement on {{ORIGINAL_DATE}}; and

WHEREAS, the parties desire to amend certain terms of the Agreement as
set forth herein;

NOW, THEREFORE, in consideration of the mutual promises herein, the
parties agree as follows:

1. AMENDMENTS

   a. Section {{SECTION_NUMBER}} of the Agreement is hereby amended to read
      in its entirety as follows:

      "{{NEW_LANGUAGE}}"

   b. Section {{SECTION_NUMBER}} of the Agreement is hereby deleted and
      replaced with:

      "{{NEW_LANGUAGE}}"

2. EFFECT OF AMENDMENT

   Except as expressly modified by this Amendment, all terms and conditions
   of the Agreement remain in full force and effect. In the event of any
   conflict between this Amendment and the Agreement, this Amendment shall
   control.

3. COUNTERPARTS

   This Amendment may be executed in counterparts, each of which shall be
   deemed an original.

IN WITNESS WHEREOF, the parties have executed this Amendment as of the
date first written above.

{{PARTY_A}}                          {{PARTY_B}}
By: _________________________       By: _________________________
Name: {{NAME}}                       Name: {{NAME}}
Title: {{TITLE}}                     Title: {{TITLE}}
Date: {{DATE}}                       Date: {{DATE}}
```

---

## Post-Signing Contract Management

### Immediate Actions After Signing
1. Save a fully executed copy (signed by all parties)
2. Calendar all key dates (renewal, notice deadlines, milestones)
3. Share relevant terms with anyone who needs to comply
4. Set up reminders for opt-out windows (at least 30 days before deadline)
5. Store securely with your other legal documents

### Ongoing Monitoring
- Track performance against obligations
- Document any breaches or concerns in writing as they occur
- Keep all correspondence related to the contract
- Review before any renewal period

---

## Contract Review Summary Template

```
CONTRACT REVIEW SUMMARY
========================

Contract: {{TITLE}}
Parties: {{PARTY_A}} and {{PARTY_B}}
Reviewed by: {{REVIEWER}}
Date of Review: {{DATE}}

OVERALL RISK ASSESSMENT: LOW / MEDIUM / HIGH / CRITICAL

KEY TERMS SUMMARY:
- Duration: {{TERM}}
- Value: {{VALUE}}
- Payment: {{SCHEDULE}}
- Termination: {{TERMS}}

RED FLAGS FOUND: {{COUNT}}
1. {{FLAG}} -- Severity: {{LEVEL}} -- Section: {{REF}}
2. {{FLAG}} -- Severity: {{LEVEL}} -- Section: {{REF}}
3. {{FLAG}} -- Severity: {{LEVEL}} -- Section: {{REF}}

RECOMMENDED ACTIONS:
[ ] Safe to sign as-is
[ ] Sign after minor clarifications
[ ] Negotiate specific terms (listed above)
[ ] Attorney review recommended
[ ] Do not sign in current form

NOTES:
{{ADDITIONAL_OBSERVATIONS}}
```

---

*This skill provides a contract review framework. For contracts with significant financial exposure or legal complexity, professional legal review is strongly recommended.*


## Output Format

```
CONTRACT REVIEWER OUTPUT
========================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "I am about to sign a freelance contract for a web development project. What should I look for before signing?"

**Output:**

## Freelance Web Development Contract Review Checklist

### Critical Clauses to Find and Understand

| Clause | What to Look For | Red Flag |
|--------|-----------------|----------|
| **Scope of Work** | Specific deliverables listed | Vague "all work as requested" language |
| **Payment Terms** | Amount, schedule, milestones | No deposit required, payment on "satisfaction" |
| **Revision Rounds** | Number of included revisions | Unlimited revisions with no additional cost |
| **Timeline** | Deadlines for both parties | Only your deadlines, no client response deadlines |
| **IP Ownership** | When ownership transfers | Ownership transfers before final payment |
| **Termination** | How either party can exit | Only client can terminate, or no kill fee |
| **Liability Cap** | Maximum you could owe | Unlimited liability or broad indemnification |
| **Non-Compete** | Duration and geographic scope | Over 12 months or overly broad industry scope |

### Questions to Ask Before Signing
1. "What happens if the project scope changes mid-project?"
2. "Is there a kill fee if the client cancels after work has begun?"
3. "When exactly does IP transfer -- upon final payment or upon delivery?"
4. "What constitutes 'acceptance' of a deliverable?"

### Clauses to Negotiate
- Add: "Client will provide feedback within 5 business days of each deliverable"
- Add: 50% deposit before work begins, milestone payments thereafter
- Change: IP transfers upon FINAL PAYMENT, not upon delivery
- Remove or narrow: any non-compete beyond the specific project

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
