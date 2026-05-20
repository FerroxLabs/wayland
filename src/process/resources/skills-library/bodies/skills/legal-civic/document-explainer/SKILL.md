---
name: document-explainer
description: |
  Translates legal documents into plain language. Breaks down contracts, leases, terms of service, insurance policies, and other legal texts section by section with red flag identification and a glossary of common legal terms.
  Use when the user asks about document explainer, or needs help with translates legal documents into plain language.
  Do NOT use when the request requires professional legal advice or falls outside the scope of document explainer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts step-by-step"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---

# Legal Document Explainer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User has a legal, financial, or technical document they do not understand
- User needs a plain-language summary of a complex document
- User wants specific clauses or sections of a document explained
- User needs to understand implications of document terms before acting

**Do NOT use this skill when:**
- User needs legal advice on document terms -- refer to qualified professional
- User wants a document drafted or written -- use appropriate writing skills
- User needs contract negotiation help -- use contract-reviewer for that scope

## Process

1. **Step 1:** Identify document type, purpose, and user context for reading it
2. **Step 2:** Break document into sections and identify key provisions
3. **Step 3:** Translate legal or technical language into plain language
4. **Step 4:** Highlight obligations, rights, deadlines, and financial implications
5. **Step 5:** Summarize key takeaways and suggest follow-up questions

## Purpose

This skill helps you understand legal documents written in dense legalese by translating them into clear, plain-language explanations. Whether you are reviewing a lease, employment contract, terms of service, or insurance policy, this skill provides a structured methodology for reading, comprehending, and evaluating legal text.

---

## Questions to Ask the User First

Before analyzing any legal document, gather the following information:

1. **What type of document is this?** (lease, employment contract, terms of service, NDA, insurance policy, loan agreement, settlement, other)
2. **What is your role?** (tenant, employee, consumer, buyer, seller, service provider, borrower)
3. **What is your primary concern?** (understanding the whole document, a specific section, potential red flags, comparing to a previous version)
4. **Is there a deadline for signing?** (urgency level)
5. **Have you been asked to sign this as-is, or is there room for negotiation?**
6. **What jurisdiction/state/country does this document apply to?**
7. **Is this a template/standard form or a custom-drafted document?**
8. **Have any sections been specifically pointed out to you by the other party?**

---

## Step 1: Document Identification and Context

### Identify the Document Type

| Document Type | Key Characteristics | Primary Concerns |
|---|---|---|
| Residential Lease | Fixed term, rent amount, property address | Habitability, deposits, termination |
| Employment Contract | Job title, compensation, duties | Non-compete, IP assignment, termination |
| Terms of Service | Online acceptance, service description | Data use, liability limits, arbitration |
| Insurance Policy | Coverage limits, deductibles, exclusions | What is NOT covered, claim process |
| Loan Agreement | Principal, interest rate, repayment schedule | Default triggers, prepayment penalties |
| NDA | Confidential info definition, duration | Scope of restriction, carve-outs |
| Service Agreement | Scope of work, deliverables, timeline | Payment terms, liability, warranties |
| Settlement Agreement | Release of claims, payment terms | What rights you give up, confidentiality |

### Identify the Parties

```
Party Identification Template:
- Party A (Drafter): {{PARTY_A_NAME}} - Role: {{ROLE}}
- Party B (You/Client): {{PARTY_B_NAME}} - Role: {{ROLE}}
- Any guarantors or third parties: {{ADDITIONAL_PARTIES}}
- Governing law jurisdiction: {{STATE_OR_COUNTRY}}
- Effective date: {{DATE}}
- Term/duration: {{DURATION}}
```

---

## Step 2: Section-by-Section Breakdown Methodology

### Standard Legal Document Structure

Most legal documents follow a predictable structure. Read them in this order for best comprehension:

#### Pass 1 - The Big Picture (5 minutes)
1. Read the title and recitals (the "WHEREAS" clauses)
2. Identify who the parties are
3. Find the term (start date and end date)
4. Locate the signature block
5. Note how many pages/sections exist

#### Pass 2 - Core Terms (15-30 minutes)
6. Read the definitions section carefully -- every defined term changes meaning throughout
7. Identify the core obligations of each party (what each side must do)
8. Find the payment/consideration terms
9. Locate termination provisions
10. Read the dispute resolution clause

#### Pass 3 - Risk Assessment (15-30 minutes)
11. Read limitation of liability clauses
12. Find indemnification obligations
13. Check for warranty disclaimers
14. Look for non-compete or restrictive covenants
15. Review insurance requirements
16. Examine default and remedy provisions

#### Pass 4 - Fine Print (10-20 minutes)
17. Read the miscellaneous/general provisions
18. Check for automatic renewal clauses
19. Look for amendment requirements
20. Review notice provisions
21. Check assignment restrictions
22. Note severability clauses

---

## Step 3: Common Legal Terms Glossary

### Foundational Terms

| Term | Plain Language Meaning |
|---|---|
| **Indemnify / Hold Harmless** | You agree to pay for the other party's losses if something goes wrong because of you |
| **Liability** | Legal responsibility for something; often "limited" in contracts meaning they cap how much they owe you |
| **Force Majeure** | Neither side is at fault if extraordinary events (natural disasters, pandemics, war) prevent performance |
| **Severability** | If one part of the contract is found invalid, the rest still applies |
| **Governing Law** | Which state/country's laws apply if there is a dispute |
| **Arbitration** | Disputes go to a private decision-maker instead of court; often binding (you cannot appeal) |
| **Waiver** | Giving up a right; "no waiver" means not enforcing a rule once does not mean you lose that right permanently |
| **Assignment** | Transferring your rights/obligations to someone else |
| **Consideration** | What each side gives in exchange (money, services, promises) |
| **Breach** | Failure to fulfill an obligation under the contract |
| **Remedy** | What the non-breaching party can do when a breach occurs |
| **Covenant** | A binding promise to do or not do something |
| **Warrant / Represent** | A formal statement of fact; if false, it is a breach |
| **Notwithstanding** | "Despite anything else that says otherwise" -- this clause supersedes others |
| **Herein / Hereto / Hereby** | In this document / to this document / by this document |
| **Pursuant to** | In accordance with; following the rules of |
| **Pro rata** | Proportionally; your fair share based on time or amount |

### Contract-Specific Terms

| Term | Plain Language Meaning |
|---|---|
| **Non-compete** | You cannot work for competitors or start a competing business for a specified time/area |
| **Non-solicitation** | You cannot recruit the other party's employees or customers |
| **Liquidated damages** | A pre-agreed amount of money owed if a specific breach occurs |
| **Consequential damages** | Indirect losses (lost profits, lost opportunities) -- often excluded in contracts |
| **Cure period** | Time you have to fix a breach before the other side can terminate |
| **Estoppel** | You cannot take a position contradicting what you previously said or did |
| **Lien** | A legal claim on property as security for a debt |
| **Subordination** | Agreeing that your claim ranks below someone else's |

---

## Step 4: Red Flag Identification

### Universal Red Flags (Any Document Type)

```
RED FLAG CHECKLIST:

[ ] One-sided indemnification (only YOU indemnify THEM, not mutual)
[ ] Unlimited liability on your side with capped liability on theirs
[ ] Mandatory binding arbitration with no opt-out and venue far from you
[ ] Automatic renewal with narrow cancellation windows
[ ] Broad intellectual property assignment (you give up rights to your work)
[ ] Non-compete clauses that are overly broad in time, geography, or scope
[ ] Unilateral amendment rights (they can change terms without your consent)
[ ] Waiver of jury trial
[ ] Confidentiality that prevents you from discussing problems
[ ] "As-is" language combined with warranty disclaimers
[ ] Penalties or fees for early termination that seem excessive
[ ] Choice of law or venue in a distant, inconvenient jurisdiction
[ ] Vague language around scope of work or deliverables
[ ] Missing or unclear payment terms, deadlines, or milestones
[ ] "Notwithstanding" clauses that supersede protections elsewhere
```

### Document-Specific Red Flags

#### Lease Red Flags
- Landlord can enter without notice
- Tenant responsible for all repairs including structural
- Security deposit return conditions are vague
- Lease auto-converts to month-to-month at higher rate
- Restrictions on subletting with no reasonable standard

#### Employment Contract Red Flags
- IP assignment covers work done on your own time with your own resources
- Non-compete exceeds 1 year or covers unreasonably large geography
- At-will termination for you but "for cause" required for employer
- Clawback provisions on bonuses already earned
- Forced relocation clauses

#### Terms of Service Red Flags
- They can share your data with unlimited third parties
- You grant them a perpetual, irrevocable license to your content
- They can terminate your account and keep your data/money
- Class action waiver
- They can change terms at any time without notification

#### Insurance Policy Red Flags
- Exclusions that cover your primary risk
- High deductibles that effectively nullify coverage
- Subrogation clauses that limit your ability to settle
- Duties after loss that are burdensome or time-restricted

---

## Step 5: Document Analysis Template

Use this template to analyze any legal document:

```
LEGAL DOCUMENT ANALYSIS
========================

Document Title: {{DOCUMENT_TITLE}}
Document Type: {{TYPE}}
Date Received: {{DATE}}
Signing Deadline: {{DEADLINE}}
Other Party: {{OTHER_PARTY}}
Jurisdiction: {{JURISDICTION}}

PARTIES AND ROLES:
- {{PARTY_A}}: {{ROLE_DESCRIPTION}}
- {{PARTY_B}}: {{ROLE_DESCRIPTION}}

CORE TERMS:
- Term/Duration: {{TERM}}
- Consideration/Payment: {{PAYMENT_TERMS}}
- Core Obligations (Their side): {{THEIR_OBLIGATIONS}}
- Core Obligations (Your side): {{YOUR_OBLIGATIONS}}

TERMINATION:
- How either party can end the agreement: {{TERMINATION_TERMS}}
- Notice required: {{NOTICE_PERIOD}}
- Penalties for early termination: {{PENALTIES}}
- Automatic renewal: YES / NO -- Details: {{RENEWAL_DETAILS}}

RISK ASSESSMENT:
- Liability cap (yours): {{YOUR_LIABILITY}}
- Liability cap (theirs): {{THEIR_LIABILITY}}
- Indemnification: MUTUAL / ONE-SIDED / NONE
- Dispute resolution: COURT / ARBITRATION / MEDIATION
- Governing law: {{JURISDICTION}}

RED FLAGS IDENTIFIED:
1. {{RED_FLAG_1}} -- Section {{SECTION_REF}} -- Severity: HIGH/MEDIUM/LOW
2. {{RED_FLAG_2}} -- Section {{SECTION_REF}} -- Severity: HIGH/MEDIUM/LOW
3. {{RED_FLAG_3}} -- Section {{SECTION_REF}} -- Severity: HIGH/MEDIUM/LOW

QUESTIONS TO ASK BEFORE SIGNING:
1. {{QUESTION_1}}
2. {{QUESTION_2}}
3. {{QUESTION_3}}

NEGOTIATION POINTS:
1. {{POINT_1}} -- Suggested change: {{CHANGE}}
2. {{POINT_2}} -- Suggested change: {{CHANGE}}

RECOMMENDATION:
[ ] Safe to sign as-is
[ ] Sign with noted concerns
[ ] Negotiate before signing
[ ] Have an attorney review before signing
[ ] Do not sign
```

---

## Step 6: Questions to Ask Before Signing Any Document

### General Questions
1. What happens if I need to get out of this agreement early?
2. Can they change the terms after I sign, and how will I be notified?
3. What is my maximum financial exposure under this agreement?
4. Is there anything I am giving up that I cannot get back (rights, IP, claims)?
5. What is the dispute resolution process, and how much would it cost me?
6. Are there any deadlines or obligations I need to calendar immediately?
7. Who else is bound by this agreement (guarantors, successors)?

### Red Flag Questions
1. Why is this clause one-sided? Can we make it mutual?
2. Can the arbitration clause include an opt-out period?
3. Can we add a cap on liability that is proportional to the contract value?
4. Can the non-compete be narrowed in scope, duration, or geography?
5. Can I get a cure period before termination for breach?

---

## Step 7: Comparison Framework

When comparing two versions of a document or comparing terms across providers:

```
COMPARISON MATRIX
=================

Feature/Clause      | Document A          | Document B          | Better For You
--------------------|---------------------|---------------------|---------------
Term Length          | {{TERM_A}}          | {{TERM_B}}          | {{WINNER}}
Monthly Cost         | {{COST_A}}          | {{COST_B}}          | {{WINNER}}
Termination Notice   | {{NOTICE_A}}        | {{NOTICE_B}}        | {{WINNER}}
Liability Cap        | {{CAP_A}}           | {{CAP_B}}           | {{WINNER}}
Dispute Resolution   | {{DISPUTE_A}}       | {{DISPUTE_B}}       | {{WINNER}}
Auto-Renewal         | {{RENEWAL_A}}       | {{RENEWAL_B}}       | {{WINNER}}
Data/Privacy         | {{PRIVACY_A}}       | {{PRIVACY_B}}       | {{WINNER}}
Overall Risk Level   | {{RISK_A}}          | {{RISK_B}}          | {{WINNER}}
```

---

## Step 8: When to Hire an Attorney

You should consult an attorney if any of the following apply:

- The contract involves more than $5,000 in potential liability
- You are signing a non-compete or non-solicitation agreement
- Real property (real estate) is involved
- You are forming or joining a business entity
- The document involves intellectual property rights
- You have been sued or threatened with legal action
- The other party has an attorney and you do not
- You do not understand a material term after analysis
- The contract is for a duration longer than one year
- You are waiving significant legal rights

---

## Quick Reference: Reading Legal Documents Efficiently

1. **Definitions control everything.** Read the definitions section first. A word that seems ordinary (like "Services" or "Work Product") may have a very specific meaning.
2. **Follow the money.** Find every clause about payment, fees, penalties, and damages.
3. **Find the exits.** Understand how each party can end the relationship and at what cost.
4. **Look for asymmetry.** Anywhere the obligations or rights are not balanced between parties is worth extra scrutiny.
5. **Read what is excluded.** Exclusions, disclaimers, and limitations often matter more than what is promised.
6. **Check the boilerplate.** The "miscellaneous" section at the end often contains consequential provisions about dispute resolution, amendments, and governing law.
7. **Note every deadline.** Calendar any notice periods, cure periods, renewal windows, and option exercise dates.

---

*This skill provides a framework for understanding legal documents. For any document with significant financial or legal consequences, professional legal review is strongly recommended.*


## Output Format

```
DOCUMENT EXPLAINER OUTPUT
=========================

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

**Input:** "I received a cease and desist letter from a company claiming I am infringing on their trademark. I do not understand what it means or what I need to do."

**Output:**

## Document Explanation: Cease and Desist Letter (Trademark)

### What This Document Is
A cease and desist letter is a formal demand to stop an activity. It is NOT a lawsuit -- it is a warning before potential legal action. Receiving one does not mean you are guilty of anything.

### Key Sections Explained

**1. "You are hereby notified..."**
Plain language: The company is formally telling you they believe you are using something (a name, logo, or phrase) that is too similar to their registered trademark.

**2. "Demand that you immediately cease and desist..."**
Plain language: They want you to stop using the name/mark/logo entirely and by a specific date.

**3. "Failure to comply may result in..."**
Plain language: If you do not stop, they may file a lawsuit. This is a threat, not a certainty.

### Your Obligations Right Now
- You are NOT required to respond immediately
- You are NOT required to comply automatically
- You SHOULD consult an intellectual property attorney before responding
- Do NOT ignore it entirely -- ignoring can weaken your position if they do file suit

### Timeline
- Typical response deadline: 10-30 days from receipt
- Use this time to consult an attorney

### Key Questions for an Attorney
1. Is their trademark registration valid and enforceable?
2. Is your use actually infringing, or is it different enough?
3. Do you have any prior use rights?
4. What would compliance cost versus defending?

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
