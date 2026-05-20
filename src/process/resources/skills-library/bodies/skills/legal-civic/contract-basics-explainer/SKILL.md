---
name: contract-basics-explainer
description: |
  Breaks down standard contract sections into plain language, explaining what each clause means, why it matters, and what questions to ask before signing. Covers offer, acceptance, consideration, representations, warranties, indemnification, limitation of liability, termination, and boilerplate clauses.
  Use when the user has a contract to review, wants to understand contract terminology, needs to know what to look for before signing, or wants a plain-language explanation of common contract clauses.
  Do NOT use for drafting contracts, providing legal advice on whether to sign, negotiating contract terms on behalf of the user, or reviewing jurisdiction-specific regulatory compliance.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts guide checklist"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---
# Contract Basics Explainer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary significantly by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- A user has received a contract -- service agreement, vendor agreement, software license, partnership agreement, purchase order, or similar document -- and wants to understand what each section means before deciding how to proceed
- A user is preparing to sign a contract and wants a clause-by-clause walkthrough to identify what they are committing to, what risks they are accepting, and what protections may be absent
- A user encounters unfamiliar legal terminology (indemnification, representations and warranties, force majeure, severability, liquidated damages) and wants plain-language definitions with context for why those terms exist
- A user wants to prepare intelligent, specific questions before a consultation with an attorney so they can use that paid time efficiently
- A user has already signed a contract and wants to understand their current obligations, termination rights, renewal windows, or compliance requirements
- A user wants to understand what a standard contract of a given type normally includes, so they can recognize what is missing from the document in front of them
- A user is comparing two versions of a contract (original vs. redlined revision) and wants to understand what changed and which direction each change tilts the balance of power

**Do NOT use when:**
- User wants to draft new contract language or have specific clause language written for them -- that constitutes legal practice; refer to a licensed attorney
- User wants a definitive answer on whether to sign -- that is legal advice; present the analysis and direct them to counsel
- User needs negotiation strategy specific to their situation -- use `contract-negotiation-prep` skill if available
- User has a specific NDA to analyze in depth -- use `nda-clause-explainer` skill for that specialized review
- User has a residential or commercial lease to analyze -- use `lease-agreement-reviewer` skill, which covers landlord-tenant law specifics
- User has an employment contract or offer letter -- use `employment-contract-reader` skill, which addresses at-will employment, non-compete enforceability, and benefits nuances
- User needs a determination of whether a specific clause is legally enforceable in their jurisdiction -- that requires a licensed attorney; flag enforceability questions but do not resolve them
- User is dealing with a contract dispute or litigation -- that is active legal representation; refer immediately to an attorney

---

## Process

### Step 1: Identify the Contract Type and Context

Before analyzing any clause, establish what kind of contract this is and who the parties are. The type of contract determines which protections are standard, which red flags are most common, and which clauses carry the highest risk.

- Ask the user: **What type of contract is this?** Common types include:
  - Service agreements (one party provides ongoing services)
  - Statements of Work / project-based agreements (fixed scope, fixed deliverable)
  - Purchase agreements (transfer of goods or assets)
  - Software or SaaS subscription agreements (licensing, not ownership)
  - Licensing agreements (IP rights granted without transfer of ownership)
  - Partnership or joint venture agreements (shared business activity)
  - Non-disclosure / confidentiality agreements (refer to `nda-clause-explainer`)
  - Settlement agreements (resolving disputes -- high stakes, always refer to attorney)
- Ask: **Who are the parties?** The legal status of the parties matters: individual-to-individual contracts have different norms than business-to-business (B2B) contracts, and consumer contracts are sometimes governed by consumer protection statutes that can't be waived by contract language
- Ask: **Which party is the user?** The party providing services faces different risks (IP assignment, liability for defects, indemnification exposure) than the party receiving services (payment default, scope creep, delivery failure)
- Ask: **Is there a specific section confusing them, or should the full document be walked through?** If the user pastes the full contract text, work through every section; if they describe the sections, work through standard interpretations for each named section
- Ask: **Have they already signed this contract, or are they reviewing it before signing?** The analytical focus shifts -- pre-signing analysis emphasizes risk assessment and negotiation leverage; post-signing analysis emphasizes understanding obligations and rights

---

### Step 2: Analyze the Contract Structure and Parties Section

A well-formed contract begins by establishing exactly who is bound by it. Errors here can affect enforceability.

- **Parties and recitals:** The full legal name of each party must be stated -- "John Smith" is different from "John Smith LLC." A contract signed by a person acting as an agent of a company may not bind the company if authority is unclear
- **Defined terms:** Most commercial contracts define key terms in a Definitions section (capitalized throughout the document). Walk through definitions that are unusually broad or narrow:
  - "Services" defined to include any activity related to the client's business is broader than "the web development work described in Exhibit A"
  - "Confidential Information" that includes everything ever discussed -- even non-sensitive material -- is a flag
  - "Intellectual Property" defined to include moral rights, database rights, and trade secrets in addition to copyrights and patents is significantly broader than a narrow definition
- **Recitals ("WHEREAS" clauses):** These set context but typically are not binding operative terms -- they can, however, be used in contract interpretation disputes, so they should be accurate
- **Effective date vs. execution date:** Note whether the contract starts when signed (execution date) or is backdated/forward-dated to a different effective date, and flag if the effective date creates retroactive obligations

---

### Step 3: Walk Through Core Operative Clauses

These are the sections that define what each party actually has to do and what they get in return.

- **Scope of Work / Subject Matter:**
  - Specificity is everything. A scope that says "developer will build a website" leaves room for unlimited revision demands; a scope that references "Exhibit A, which lists 12 specific deliverables with acceptance criteria" protects the contractor
  - Watch for "reasonable efforts," "best efforts," and "commercially reasonable efforts" -- these are legally distinct standards, with "best efforts" being the highest obligation (may require a party to act against its own financial interest in some jurisdictions) and "commercially reasonable efforts" being a lower, more common standard
  - Acceptance testing provisions matter: who decides if deliverables are acceptable, and what is the process if the client rejects them? Absence of acceptance criteria means the client decides subjectively
  - Watch for scope expansion language: "and such other related services as may be requested from time to time" -- this is a flag that allows the client to expand obligations without changing compensation

- **Consideration (Payment Terms):**
  - Payment triggers: Is payment due on (a) invoice submission, (b) milestone completion, (c) client approval, or (d) a calendar date? Client-approval triggers give the client control to delay payment indefinitely
  - Net payment terms: "Net-30" means payment is due 30 days after invoice. "Net-60" or "Net-90" terms in a small contract can create serious cash flow problems for contractors and small businesses
  - Late payment: Is there an interest penalty for late payment? Standard commercial rate is prime + 2% or a flat 1.5% per month (18% APR). Absence of a late payment clause means the payee has no financial incentive to collect quickly and no compensation for late payment
  - Expense reimbursement: If the performing party incurs costs (travel, software licenses, third-party services), does the contract address reimbursement? What is the approval process and documentation requirement?
  - Change orders: How is additional work outside the scope requested and priced? Absence of a change order process means disputes about extra work are resolved by negotiation under pressure
  - Unilateral pricing changes: Some contracts -- especially subscription agreements -- include language allowing one party to change prices with notice (e.g., 30 days). Flag any clause that allows price changes without the other party's consent

---

### Step 4: Analyze Risk-Allocation Clauses

These sections define what happens when things go wrong. They are frequently the most consequential clauses in a contract and the ones most commonly misunderstood.

- **Representations and Warranties:**
  - A **representation** is a statement of fact made to induce the other party to enter the contract (e.g., "the company is duly incorporated and in good standing"). If false, the remedy may include rescission (unwinding the contract) or fraud claims
  - A **warranty** is a promise that something will remain true or perform in a certain way going forward (e.g., "the software will perform substantially as described in the documentation for 90 days after delivery"). Breach of warranty gives rise to a damages claim
  - Common warranty carve-outs that favor the provider: "as-is" disclaimers, disclaimer of implied warranties (merchantability, fitness for a particular purpose -- under UCC Article 2 for goods contracts in the U.S.), and limitations to "substantial conformance" rather than perfect performance
  - Mutual vs. one-sided warranties: Both parties typically make baseline representations (authority to enter the contract, no conflicts with other agreements). Watch for contracts where only one party makes extensive warranties

- **Indemnification:**
  - Indemnification is one party's promise to cover the other party's losses, costs, and legal fees if a specified type of harm occurs. It is a risk-transfer mechanism
  - **Mutual indemnification** is standard in B2B contracts: each party indemnifies the other for its own negligence, IP infringement, and breach of contract
  - **One-way indemnification** -- typically demanded by larger parties -- requires the smaller party to indemnify the larger party even when the larger party's own conduct contributed to the harm. This is a significant red flag for smaller contractors
  - Three common indemnification structures:
    1. **Broad form:** Indemnifying party covers losses even if the indemnitee was partially at fault
    2. **Intermediate form:** Indemnifying party covers losses except those caused solely by the indemnitee's negligence
    3. **Limited form:** Each party covers only losses caused by its own acts or omissions
  - The **trigger** for indemnification matters: some clauses are triggered by a third-party claim being made (regardless of outcome); others are triggered only by final judgments. Claim-trigger indemnification creates an obligation to defend lawsuits from the moment they are filed, which is more burdensome
  - IP indemnification is a specific and important subtype: the provider typically warrants that the deliverables don't infringe third-party IP and indemnifies the client if they do. This is a potentially large exposure for a solo developer whose code might incorporate open-source components

- **Limitation of Liability:**
  - Most commercial contracts cap the total damages either party can claim at some fixed amount, often the total fees paid under the contract in the prior 12 months
  - **Mutual cap:** Both parties have their damages capped at the same level -- this is fair
  - **Asymmetrical cap:** One party's liability is capped but the other's is not -- this is a flag. Vendors often try to cap their own liability while leaving the client's claims against the vendor limited, while the client's liability (for payment obligations) is uncapped
  - **Exclusion of consequential damages:** This is one of the most important clauses in a contract. "Consequential" damages include lost profits, lost business opportunities, and reputational harm -- often far larger than direct damages. Contracts frequently exclude all liability for consequential, incidental, indirect, and punitive damages. For a service recipient, this means if the provider's failure causes a major business loss, the provider owes only direct damages. For a service provider, this clause protects them from catastrophic claims
  - **Carve-outs from the cap:** Certain obligations are typically excluded from limitation caps: (1) indemnification obligations for IP infringement, (2) confidentiality breaches, (3) death or personal injury from negligence, (4) fraud, and (5) willful misconduct. Whether indemnification sits inside or outside the liability cap is a critical negotiation point in commercial contracts
  - In most U.S. states, limitation of liability clauses for gross negligence or willful misconduct are unenforceable -- but "most states" is not "all states," and this must always be verified with local counsel

- **Insurance:**
  - Many commercial service contracts require the service provider to maintain specific insurance coverages during the contract term:
    - **General Liability:** Typically $1M per occurrence / $2M aggregate for contractors
    - **Professional Liability (Errors and Omissions):** Typically $1M per claim for technology and professional services
    - **Cyber Liability:** Increasingly required -- typically $1M for businesses handling sensitive data
    - **Workers' Compensation:** Required in most states for employees; required in some contracts for contractors
  - Verify that required insurance levels are realistic for the party bearing the obligation -- a $5M professional liability requirement from a client is unusual for an individual freelancer and may be a negotiation point

---

### Step 5: Analyze the Relationship and Duration Clauses

- **Term and Termination:**
  - **Fixed term** contracts have a defined end date -- obligations automatically expire unless renewed. Flag whether renewal is **automatic** (renews unless a party actively opts out within a notice window) or **optional** (requires affirmative action to renew). Automatic renewal with a short opt-out window is a common consumer complaint and is regulated in some U.S. states (e.g., California's Automatic Renewal Law requires clear disclosure and cancellation mechanisms)
  - **Termination for cause** allows either party to end the contract if the other materially breaches it -- typically after written notice and a cure period (usually 10-30 days). Watch for asymmetrical cure periods where one party gets 30 days to cure but the other only gets 10
  - **Termination for convenience** allows a party to end the contract without any breach, usually with advance notice (30-90 days). This is standard in many B2B service agreements -- the key issue is whether the terminating party owes any payment for work in progress or a termination fee ("kill fee")
  - **Survival clauses** specify which contract provisions continue to bind the parties after the contract ends. Clauses that typically survive: confidentiality, IP ownership, indemnification, limitation of liability, and governing law. Clauses that shouldn't survive: payment obligations for future services. Review the survival list carefully -- some contracts draft overly broad survival provisions

- **Independent Contractor vs. Employee Classification:**
  - Many service contracts include a "contractor is an independent contractor, not an employee" clause. This clause does NOT determine legal worker classification -- that is governed by the IRS common law test (behavioral control, financial control, and relationship type), the ABC test used in California and some other states, and various state wage-and-hour laws
  - Flag this clause with the note that the label in the contract doesn't automatically protect either party from misclassification liability -- actual working conditions determine status

- **Non-Compete and Non-Solicitation Clauses:**
  - **Non-compete clauses** restrict a party (usually the service provider) from working for competitors for a defined period after the contract ends. Enforceability varies dramatically by state -- California Business & Professions Code Section 16600 renders most non-competes unenforceable in California; other states enforce them with reasonable time, geography, and scope limitations
  - **Non-solicitation clauses** restrict a party from poaching the other party's employees or clients. These are generally more enforceable than non-competes but still subject to reasonableness tests
  - Time period benchmarks: Non-competes up to 12 months are more commonly enforced; 24-month restrictions are scrutinized more heavily; anything over 36 months is difficult to enforce in most U.S. jurisdictions
  - Geographic scope benchmarks: National restrictions on a local contractor performing local services are frequently found unreasonable

---

### Step 6: Analyze Boilerplate and Governing Provisions

"Boilerplate" clauses are often dismissed as standard, but they are highly consequential.

- **Governing Law and Jurisdiction:**
  - The governing law clause specifies which state's (or country's) law interprets the contract. This can matter enormously for enforceability of specific clauses (non-competes, arbitration clauses, consequential damages waivers)
  - The jurisdiction clause specifies where disputes must be litigated. If a California freelancer signs a contract governed by New York law with disputes resolved in New York courts, enforcing a judgment or defending a claim requires either travel or retaining out-of-state counsel -- a real financial burden
  - Some states have statutes overriding choice-of-law provisions for their residents in certain contexts (e.g., California Labor Code Section 925 protects California employees from being forced to adjudicate employment disputes outside California)

- **Dispute Resolution:**
  - **Litigation** is the default if no dispute resolution clause exists -- filing a lawsuit in the specified jurisdiction
  - **Arbitration** substitutes a private arbitrator (or panel) for a judge. Key issues: (1) Which arbitration rules apply -- AAA Commercial (American Arbitration Association), JAMS, ICC? (2) Is it individual or class arbitration? Class arbitration waivers are enforceable in most commercial contexts after AT&T Mobility v. Concepcion (2011); (3) Where is the arbitration seat? (4) Who pays arbitration fees? AAA filing fees for commercial disputes can run $1,750-$10,000+ depending on claim size
  - **Mediation** is a non-binding facilitated negotiation -- often required as a step before arbitration or litigation
  - Many commercial contracts require mediation, then arbitration, as a two-step escalation process. This is generally reasonable

- **Assignment:**
  - Without an assignment clause, contract rights can generally be freely assigned and performance obligations cannot. The clause controls: (1) Can either party assign the contract to a third party? (2) Does change of control (acquisition) trigger the assignment restriction? A change-of-control clause means a company can't be acquired without the other party's consent -- significant in M&A contexts
  - Most contracts require written consent for assignment and are silent on whether consent can be unreasonably withheld; flag if the contract allows assignment without consent

- **Amendment and Waiver:**
  - Contracts should require amendments to be in writing and signed by both parties. Flag any clause allowing one party to amend terms unilaterally (common in some consumer terms of service, but a red flag in commercial contracts)
  - Waiver clauses specify that failing to enforce a right once doesn't mean you've given it up permanently -- these protect both parties and are generally reasonable

- **Entire Agreement (Integration Clause):**
  - This clause states that the written contract supersedes all prior discussions, emails, proposals, and oral agreements. This means anything promised in sales conversations or email exchanges that is NOT in the contract is legally meaningless
  - Flag the importance of getting any promises or representations made during negotiation into the written contract before signing

- **Severability:**
  - If a court finds one clause unenforceable, severability means the rest of the contract survives. This is standard and generally reasonable -- note if it is absent

- **Force Majeure:**
  - Excuses performance during "extraordinary events" beyond a party's control. Post-COVID, clients and courts scrutinize force majeure language more carefully
  - Key questions: Does the clause cover pandemics? Supply chain disruptions? Cyberattacks? Does it apply to both parties symmetrically? Does it excuse performance, or just delay it? Is there a maximum duration before either party can terminate?

---

### Step 7: Identify Red Flags and Missing Protections

After reviewing all clauses, synthesize observations into actionable flags organized by risk severity.

**High-severity red flags (require attorney review before signing):**
- One-sided indemnification requiring the smaller party to indemnify the larger party for the larger party's own negligence
- No limitation of liability cap, or an asymmetrical cap protecting only one party
- Broad IP assignment with no carve-out for pre-existing materials or portfolio rights
- Termination for convenience with no kill fee and no payment for work in progress
- Mandatory arbitration with the other party's home jurisdiction as the seat and all arbitration costs split equally (financially burdensome for smaller parties)
- Liquidated damages provisions with amounts that appear disproportionate to actual likely harm (may be unenforceable as penalties, but invite litigation)

**Medium-severity red flags (should be understood and ideally negotiated):**
- Automatic renewal with a short opt-out window (less than 30 days notice required)
- Net-60 or Net-90 payment terms for a service provider
- "Best efforts" obligations without definition
- Non-solicitation clauses that last more than 24 months
- Broad confidentiality definitions with no carve-out for general skills and knowledge acquired during performance

**Missing protections to flag by contract type:**
- Service agreements: Missing acceptance criteria, missing change-order process, missing late payment interest, missing mutual indemnification
- Technology/software agreements: Missing source code escrow for custom software, missing data security/breach notification obligations, missing service level agreements (SLAs) and remedies for downtime
- Vendor/supply agreements: Missing warranty on conformity to specifications, missing remedy for defective goods (repair, replacement, or refund), missing allocation of risk of loss during shipping

---

### Step 8: Generate the Structured Output and Attorney Questions

Compile everything into the Output Format below. The attorney questions must be specific -- not "ask your attorney about indemnification" but "ask your attorney whether the one-sided indemnification in Section 8.2 would expose you to covering the client's legal fees even for claims where the client was partially at fault, and whether adding a proportionate fault carve-out is customary in your jurisdiction."

---

## Output Format

```
## Contract Analysis: [Contract Type] -- [Brief Description]

> **Disclaimer:** This analysis is educational and does not constitute legal advice.
> Consult a licensed attorney before making any decisions about this contract.

---

### Parties
| Role | Name / Description | Notes |
|------|--------------------|-------|
| [Role -- e.g., "Client"] | [Full legal name if known] | [Any notes on party type -- individual, LLC, corporation] |
| [Role -- e.g., "Contractor"] | [Full legal name if known] | [Any notes] |

---

### Plain-Language Summary
**What this contract does:** [1-2 sentences describing the core exchange]
**Duration:** [Fixed term / at-will / project-based with estimated timeline]
**Total value:** [Dollar amount if stated, or "not specified"]
**Key obligations of [Party A]:** [Bullet list]
**Key obligations of [Party B]:** [Bullet list]

---

### Clause-by-Clause Breakdown

| Section | What It Actually Says (Plain Language) | Why It Matters to You | Risk Level |
|---------|----------------------------------------|-----------------------|------------|
| Parties & Definitions | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Scope of Work | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Payment Terms | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Representations & Warranties | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Intellectual Property | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Confidentiality | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Indemnification | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Limitation of Liability | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Term & Termination | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Dispute Resolution | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Governing Law | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |
| Boilerplate | [Plain-language explanation] | [User-specific impact] | Low / Medium / High |

---

### Red Flags Identified

| Severity | Contract Section | What the Clause Says | Why It Is a Concern | Potential Impact |
|----------|-----------------|----------------------|---------------------|-----------------|
| 🔴 High | [Section reference] | [Quote or paraphrase of the clause] | [Explanation of the issue] | [Dollar, legal, or operational impact] |
| 🟡 Medium | [Section reference] | [Quote or paraphrase] | [Explanation] | [Impact] |
| 🟢 Low | [Section reference] | [Quote or paraphrase] | [Explanation] | [Impact] |

---

### Missing Protections
The following clauses are standard in this type of contract but appear to be absent:

| Protection | Why It Typically Exists | Risk of Its Absence |
|------------|------------------------|---------------------|
| [Protection name] | [Standard purpose] | [Risk if absent] |
| [Protection name] | [Standard purpose] | [Risk if absent] |

---

### Questions for Your Attorney
Bring these specific questions to your attorney consultation:

1. **[Topic]:** [Specific question referencing actual clause language or section]
2. **[Topic]:** [Specific question]
3. **[Topic]:** [Specific question about jurisdiction-specific enforceability]
4. **[Topic]:** [Specific question about a missing protection]
5. **[Topic]:** [Specific question about a red flag]

---

### Key Dates, Deadlines, and Financial Terms
| Item | Value | Notes |
|------|-------|-------|
| Effective date | [Date or trigger event] | |
| Contract end date | [Date or "project completion"] | |
| Automatic renewal date | [Date or "N/A"] | [Opt-out deadline if applicable] |
| Termination notice required | [Number of days] | [For cause vs. convenience] |
| Payment schedule | [Milestones / dates / net-XX] | |
| Confidentiality duration | [Years after termination] | |
| Non-compete duration | [Months / "N/A"] | |
| Insurance minimums required | [Coverage types and amounts] | |

---

### Overall Risk Assessment
**Contract balance:** [Balanced / Slightly favors [Party] / Significantly favors [Party]]
**Recommended next step:** Consult a licensed attorney to review [the specific high-risk clauses identified] before signing. Estimated attorney review time for a contract of this type and length is typically [0.5-2 hours], depending on complexity.
```

---

## Rules

1. **Always lead with the disclaimer** -- present it before any substantive analysis, in full, every time this skill is used

2. **Never advise signing or not signing** -- the role is to illuminate what the contract says and what risks exist, not to make a recommendation on whether to accept those risks; that judgment belongs to the user and their attorney

3. **Never draft replacement clause language** -- explaining what a clause means and why it is concerning is legal literacy; writing a revised clause is legal practice. If a user asks for suggested language, decline and recommend they ask an attorney to draft it

4. **Distinguish between "concerning" and "unenforceable"** -- a clause can be extremely one-sided and still be fully enforceable; labeling a clause as unenforceable without jurisdiction-specific legal analysis is overstepping. Say "this clause may be unenforceable in some jurisdictions -- your attorney should evaluate enforceability in [relevant state/country]"

5. **Calibrate risk level to the user's role in the contract** -- a limitation of liability clause that caps damages at contract value is balanced for the service recipient but potentially catastrophic for the service provider if their error causes significant third-party harm; always frame analysis from the perspective of the user's role in the specific contract

6. **Flag absence as strongly as presence** -- the absence of an acceptance criteria clause, a change order process, a late payment penalty, or a mutual indemnification provision is as significant as the presence of a one-sided clause; missing protections should always be called out

7. **Jurisdiction matters -- say so explicitly and often** -- non-compete enforceability, arbitration clause enforceability, automatic renewal disclosure requirements, worker classification tests, and implied warranty disclaimers all depend heavily on jurisdiction. Every time jurisdiction affects analysis, note: "enforceability and interpretation of this clause depends on governing law -- verify with an attorney licensed in [state/country specified in the governing law clause]"

8. **Use precise legal terminology defined in plain language** -- do not avoid terms like "indemnification," "consequential damages," or "representations and warranties" -- these terms exist because they carry specific legal meanings; use them and define them clearly inline on first use

9. **Translate financial exposure into concrete terms** -- "uncapped liability" is abstract; "if this project is worth $10,000 and your liability is uncapped, a client claiming $500,000 in lost profits could sue you for that amount" is concrete. Where dollar amounts are available from the contract, use them in the risk analysis

10. **Attorney referral is mandatory for high-severity red flags** -- whenever a high-severity red flag is identified (one-sided indemnification, uncapped liability, broad IP assignment with no carve-out, mandatory arbitration in a distant jurisdiction), explicitly state that this specific clause warrants review by a licensed attorney before signing, not just a general recommendation at the end

11. **Do not assume the contract is "standard" or "boilerplate"** -- sellers and clients frequently describe their contracts as "standard" to discourage negotiation; every contract is negotiable until signed, and even "standard" contracts can contain high-risk provisions

12. **For contracts involving consumer-to-business relationships, note consumer protection considerations** -- consumer contracts are subject to additional protections under state consumer protection statutes (e.g., unfair and deceptive trade practice laws, automatic renewal disclosure laws, mandatory arbitration restrictions in some consumer contexts) that commercial B2B contracts are not

---

## Edge Cases

### 1. Contract Is Written in Another Language or Governed by a Non-U.S. Legal System
Civil law jurisdictions (France, Germany, Japan, Brazil, Mexico, most of continental Europe and Latin America) operate on codified statutory frameworks rather than common law precedent. Default rules in civil law jurisdictions often provide stronger implied protections -- meaning that clauses which are necessary in a U.S. common law contract (such as explicit damages exclusions) may not be necessary because statute provides the baseline. Conversely, some standard U.S. protections (implied warranties, consequential damages waivers) operate differently or may not apply. For contracts governed by foreign law: (1) explain the general framework of each clause as described; (2) explicitly note that civil law default rules differ from U.S. common law defaults in ways that may significantly affect the analysis; (3) recommend the user consult an attorney licensed in the relevant jurisdiction, not just any attorney; (4) if the contract is in a foreign language, note that machine translation of legal documents can introduce material errors -- a certified legal translator and bilingual attorney are the appropriate resources

### 2. User Has Already Signed the Contract
Post-signature, the analytical focus shifts entirely. Do not focus on "what you should have negotiated" -- that is not actionable. Instead: (1) map the user's current legal obligations clearly -- what must they do, by when, and what are the consequences of non-performance; (2) identify termination rights and the exact mechanics for exercising them -- notice requirements, required form (written, certified mail, email), and any cure periods; (3) identify upcoming dates -- renewal windows, termination notice deadlines, payment due dates; (4) explain any survival clauses so the user understands which obligations persist after the contract ends; (5) note that if the user believes they have a claim or are in breach, they should contact an attorney immediately -- do not analyze litigation strategy

### 3. Contract Is Very Short (Under Two Pages) or Appears Informal
Brevity creates risk through omission. A one-page contract that is silent on dispute resolution, limitation of liability, intellectual property ownership, and termination rights is not "simple" -- it has left all of those issues unaddressed, which means they default to the rules of the governing jurisdiction (which may be unclear or unfavorable). For short or informal contracts: (1) run through every standard section and explicitly note which are absent; (2) explain what the legal default is when each clause is absent; (3) flag that informal language does not make a contract unenforceable -- courts enforce informal agreements regularly if the elements of offer, acceptance, and consideration are present; (4) recommend the user ask an attorney to prepare a more complete agreement or addendum if the transaction has meaningful financial stakes

### 4. Contract Contains a Redline (Two Versions Being Compared)
Work through changes section by section. For each change: (1) explain what the original language said and what the revised language says in plain terms; (2) identify which direction the change shifts risk -- toward Party A, toward Party B, or neutral; (3) note if the revised language introduces new red flags not present in the original; (4) note if the revised language addresses concerns that existed in the original; (5) produce a change summary table showing each material change and its effect; (6) do not express a view on which version is "better" -- explain what each version commits each party to

### 5. Contract Includes an Exhibit, Schedule, or Attachment That Is Missing or Referenced But Not Provided
Many contracts incorporate key terms by reference into exhibits (e.g., "Services are described in Exhibit A," "Pricing is set forth in Schedule 1"). If those exhibits are missing: (1) flag explicitly that analysis is incomplete because the operative terms for [scope / pricing / specifications] are in an exhibit the user has not provided; (2) warn that the main body of the contract is sometimes designed to be favorable while unfavorable terms are buried in exhibits -- the exhibits are as legally binding as the main document; (3) instruct the user to obtain and review all referenced exhibits before signing

### 6. User Is a Consumer Signing a Contract of Adhesion
A "contract of adhesion" is a standardized form offered on a take-it-or-leave-it basis -- common in consumer software EULAs, online terms of service, and cell phone carrier agreements. For contracts of adhesion: (1) note that courts in many U.S. jurisdictions apply heightened scrutiny to adhesion contracts, particularly for clauses that are "unconscionable" -- meaning oppressively one-sided and the product of unequal bargaining power; (2) arbitration clauses in consumer adhesion contracts have faced significant judicial and legislative pushback -- California, New Jersey, and other states have restricted their enforceability in consumer contexts; (3) the user likely cannot negotiate the terms, so the practical question shifts from "what should I negotiate?" to "what am I consenting to and what are my rights?" -- explain both clearly

### 7. Contract Is a Settlement Agreement
Settlement agreements end disputes and typically include mutual releases of all claims. They are among the highest-stakes contracts a non-attorney can receive because: (1) signing releases potential legal claims that may have significant value; (2) they often include confidentiality obligations that restrict what the settling party can say about the underlying dispute; (3) they can affect tax treatment of any payment received (some settlement payments are taxable income, others are not, depending on the nature of the claim); (4) they may include non-disparagement clauses restricting future speech. For any settlement agreement: flag that this contract type carries uniquely high stakes, provide the general clause analysis, and make an explicit and emphatic recommendation that the user consult a licensed attorney before signing. Do not analyze litigation strategy or express any view on whether the settlement amount is fair

### 8. Contract Contains Unusual or Novel Clause Types (Crypto, AI, Data Governance)
Emerging technology contracts increasingly include clauses covering: (1) **data ownership and portability** -- who owns data generated during the contract relationship and can the user export it; (2) **AI-generated work product** -- is output generated by AI tools owned by the provider, the client, or joint? This area has no settled law as of 2024; (3) **smart contract triggers** -- some crypto-related agreements include automated payment or performance mechanisms; (4) **data breach notification obligations** -- contractual breach notification windows (often 24-72 hours) that are more demanding than statutory requirements. For novel clauses: explain what the clause attempts to accomplish, note where the legal framework is unsettled, and recommend attorney review with specific attention to the novel provision

---

## Example

**Input:**
"I'm a freelance UX designer and I just received a five-page contract from a mid-sized software company. The contract is titled 'Independent Contractor Services Agreement.' The sections are: Scope of Work, Fees and Payment, Intellectual Property Assignment, Confidentiality, Term and Termination, Limitation of Liability, and General Provisions. Payment is a flat $15,000 for 90 days of work. The IP section says I assign 'all inventions, works, and developments created in connection with this Agreement.' The termination section says the company can terminate for convenience with 14 days' notice. The limitation of liability section caps damages at $1,000 for both parties. Can you help me understand what I'm agreeing to?"

**Output:**

## Contract Analysis: Independent Contractor Services Agreement -- UX Design

> **Disclaimer:** This analysis is educational and does not constitute legal advice. Consult a licensed attorney before making any decisions about this contract.

---

### Parties
| Role | Name / Description | Notes |
|------|--------------------|-------|
| Client | Mid-sized software company | Business entity -- verify full legal name and state of incorporation in the contract |
| Contractor | User (freelance UX designer) | Individual -- confirm whether you are contracting in your own name or as an LLC |

---

### Plain-Language Summary
**What this contract does:** A software company is hiring you to perform UX design services for 90 days in exchange for a flat fee of $15,000. In exchange for the payment, you transfer ownership of everything you create under this contract to the company, keep their information confidential, and accept a $1,000 cap on the total damages you can recover if the company fails to perform.

**Duration:** 90 days from effective date (project-based, but with early termination rights)
**Total value:** $15,000 flat fee (payment schedule and milestones not yet confirmed)
**Key obligations of the Client:** Pay $15,000 per the payment schedule; provide reasonable access to project materials
**Key obligations of the Contractor (you):** Deliver UX design work per the scope; assign all IP created; maintain confidentiality

---

### Clause-by-Clause Breakdown

| Section | What It Actually Says (Plain Language) | Why It Matters to You | Risk Level |
|---------|----------------------------------------|-----------------------|------------|
| Scope of Work | Defines what UX design work you will perform | If vague -- e.g., "UX design services as requested" rather than specific deliverables with acceptance criteria -- the client can demand additional work without paying more | 🟡 Medium -- confirm whether deliverables, revision rounds, and acceptance criteria are specifically described |
| Fees and Payment | $15,000 flat fee for 90 days of work | At approximately $167/day (assuming 5-day work weeks = ~65 working days), this is roughly $231/day. The bigger question is: when does the company pay you? If it's one lump sum at the end of 90 days, you bear 90 days of cash flow risk | 🟡 Medium -- no late payment penalty or milestone payment structure described |
| Intellectual Property Assignment | "All inventions, works, and developments created in connection with this Agreement" are assigned to the company | This is the most significant clause for you. As written, this likely includes: (1) all custom design systems, wireframes, and prototypes you create; (2) any code or tools you build during the engagement; (3) potentially any pre-existing design components you use if they are "in connection with" this agreement | 🔴 High -- requires attorney review |
| Confidentiality | Restricts disclosure of the company's information | Standard for commercial contracts -- the key questions are: (1) how long does it last after the contract ends; (2) whether you can list this company as a client in your portfolio; and (3) whether you can show samples of your work for portfolio purposes | 🟡 Medium -- duration and portfolio rights matter |
| Term and Termination | Client can terminate for convenience with 14 days' notice | This means the company can end the contract any time after giving you 14 days' written notice -- with no stated obligation to pay you for work completed beyond what was already due. If they terminate at day 60, do you get paid for the 60 days of work? The contract as described does not address this | 🔴 High -- no kill fee or payment-for-work-completed provision described |
| Limitation of Liability | Both parties' damages are capped at $1,000 | This is mutual and protects you from large damage claims -- but a $1,000 cap on your ability to recover damages means: if the company never pays you your $15,000, your contract-based damage claim may be capped at $1,000. This could make the clause effectively unenforceable for payment disputes in some jurisdictions, but that is jurisdiction-specific | 🔴 High -- $1,000 cap against a $15,000 contract may leave you without meaningful legal recourse for non-payment |
| General Provisions | Standard boilerplate -- governing law, entire agreement, severability, assignment, amendments | Note whether arbitration or mediation is required for disputes, which jurisdiction governs, and whether the assignment clause prevents the company from being acquired and having a new owner take over your contract without your consent | 🟡 Medium -- verify governing law and dispute resolution mechanism |

---

### Red Flags Identified

| Severity | Contract Section | What the Clause Says | Why It Is a Concern | Potential Impact |
|----------|-----------------|----------------------|---------------------|-----------------|
| 🔴 High | IP Assignment | "All inventions, works, and developments created in connection with this Agreement" | The phrase "in connection with" is extremely broad. Courts have interpreted similar language to capture pre-existing work that was adapted for the client, general design skills and methodologies developed during the engagement, and tools you created for your own efficiency. There is no carve-out for your pre-existing materials, your personal design library, or portfolio rights | You could be prevented from using work samples in your portfolio, from reusing design components you consider your own, and from showcasing this engagement to future clients |
| 🔴 High | Term and Termination | Company may terminate for convenience on 14 days' notice | No kill fee or partial payment provision is described. If the company terminates at day 60, there is no stated obligation to pay you for 60 days of work unless the payment schedule addresses this | You could complete a majority of the project and collect little or none of the $15,000 if your payment was structured as a single end-of-project lump sum |
| 🔴 High | Limitation of Liability | Both parties capped at $1,000 | A $1,000 cap on your claims against a $15,000 contract means that in the event of a payment dispute, a $1,000 damages cap could effectively eliminate your ability to recover the $14,000 balance in contract damages -- though your attorney should evaluate whether this cap applies to payment obligations or only to consequential damages | If the company refuses to pay, your contractual remedy could be limited to $1,000 in damages (though small claims court or other remedies may exist depending on jurisdiction) |
| 🟡 Medium | Payment Terms | Flat $15,000 -- payment schedule not described | No milestone payments, no late payment interest clause, and no penalty for delayed payment are described | You carry the full cash flow risk for 90 days; the company has no financial incentive to pay on time |
| 🟡 Medium | Confidentiality | Duration and portfolio exception not confirmed | If confidentiality lasts indefinitely with no portfolio exception, you cannot show this work to future clients | Loss of portfolio rights significantly reduces the non-monetary value of this engagement |

---

### Missing Protections
The following clauses are standard in freelance service agreements and appear to be absent:

| Protection | Why It Typically Exists | Risk of Its Absence |
|------------|------------------------|---------------------|
| Milestone payment schedule | Aligns payment with progress; reduces contractor cash flow risk | You may complete substantial work before receiving any payment |
| Late payment interest clause | Incentivizes timely payment; compensates contractor for the cost of delayed payment | Company has no financial incentive to pay on time; 1.5% per month (18% APR) is the common commercial rate |
| Kill fee / payment for work completed upon early termination | Protects contractor from non-payment when contract ends before completion | If terminated at day 60, you may have no claim to payment for the preceding 60 days of work |
| Portfolio license carve-out from IP assignment | Preserves the contractor's ability to show work samples while assigning underlying IP to client | You may be contractually prohibited from referencing this project in your portfolio |
| Pre-existing IP carve-out | Protects contractor's ownership of tools, templates, and design assets created before this engagement | Your personal design library and reusable components may be swept into the assignment |
| Acceptance criteria and revision limits | Defines what constitutes satisfactory delivery; limits scope expansion | Client can reject deliverables subjectively or demand unlimited revisions within the scope |
| Indemnification clause | Allocates risk for third-party claims (e.g., a claim that your designs infringe someone else's copyright) | Without explicit allocation, liability defaults to general negligence and contract principles -- unpredictable |
| Dispute resolution mechanism | Provides a cost-efficient path to resolve disputes | Absence defaults to litigation -- expensive and slow for a solo contractor |

---

### Questions for Your Attorney
Bring these specific questions to your attorney consultation:

1. **IP Assignment scope:** Does the "all inventions, works, and developments created in connection with this Agreement" language sweep in my pre-existing design components and personal asset library, and can I add a carve-out that specifically excludes those pre-existing materials from the assignment?

2. **Portfolio rights:** Can I negotiate a license that lets me show this work in my design portfolio even after assigning the underlying IP to the client, and is that a common ask in freelance design contracts in my jurisdiction?

3. **Limitation of liability vs. payment obligations:** Does the $1,000 liability cap apply to the company's payment obligations to me -- meaning could the company successfully argue they owe me only $1,000 if they refuse to pay the full $15,000 -- or do liability caps typically apply only to tort and consequential damage claims, not to the core payment obligation?

4. **Termination and unpaid work:** If the company terminates for convenience at day 60, do I have a legal claim for the value of work I've completed, and should I add a kill fee clause specifying payment for all work completed through the termination date?

5. **Payment structure:** Given the 90-day timeline, should I insist on a milestone payment schedule (e.g., 30% at execution, 30% at mid-project delivery, 40% upon final delivery) to reduce my cash flow exposure and reduce the risk that a termination leaves me unpaid?

6. **Governing law and non-compete:** What state governs this contract, and does the governing law include any implied protections for independent contractors that I should know about before signing?

---

### Key Dates, Deadlines, and Financial Terms
| Item | Value | Notes |
|------|-------|-------|
| Effective date | Not confirmed -- verify in contract | Often "upon execution by both parties" |
| Contract end date | 90 days from effective date | |
| Automatic renewal | Not described -- verify in General Provisions | |
| Termination notice (for convenience) | 14 days written notice by client | No stated notice requirement for contractor to terminate -- verify |
| Payment total | $15,000 flat | |
| Payment schedule | Not confirmed -- CRITICAL to clarify | Milestone vs. lump sum significantly changes your risk profile |
| Late payment interest | Not described | Recommend adding 1.5%/month |
| Confidentiality duration | Not confirmed -- verify in contract | Typical range: 2-5 years after termination |
| Portfolio rights | Not confirmed -- likely prohibited as drafted | Negotiate a portfolio license exception |
| Pre-existing IP carve-out | Absent -- needs to be added | |
| Insurance requirements | Not described in summary -- verify in contract | |

---

### Overall Risk Assessment
**Contract balance:** Significantly favors the Client as currently described
**Three highest-priority issues before signing:**
1. The IP assignment clause needs a pre-existing IP carve-out and a portfolio license exception -- consult an attorney about adding these
2. The $1,000 liability cap needs attorney review to confirm it does not impair your ability to collect the $15,000 payment if the company defaults
3. A kill fee or payment-for-work-completed provision needs to be added before signing to protect you if the company exercises the 14-day termination for convenience clause

**Recommended next step:** Consult a licensed attorney to review the IP assignment, limitation of liability, and termination clauses before signing. For a five-page contract of this type, expect approximately 1-2 hours of attorney review time. The stakes -- $15,000 in fees plus potential loss of your portfolio rights and pre-existing IP -- justify that investment.
