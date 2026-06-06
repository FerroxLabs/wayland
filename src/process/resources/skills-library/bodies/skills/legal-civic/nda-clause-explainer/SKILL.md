---
name: nda-clause-explainer
description: |
  Provides a clause-by-clause breakdown of non-disclosure agreements (NDAs), explaining what each provision means, common variations, red flags, and questions to ask before signing. Covers mutual vs. unilateral NDAs, definition of confidential information, exclusions, term, remedies, and non-solicitation riders.
  Use when the user has an NDA to review, wants to understand NDA terminology, or needs to prepare questions for an attorney about a confidentiality agreement.
  Do NOT use for drafting NDAs, advising whether to sign, or reviewing other contract types (use contract-basics-explainer for general contracts).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts guide checklist"
  category: "legal-civic"
  subcategory: "business-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---
# NDA Clause Explainer

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

---

## When to Use

**Use this skill when:**
- The user has received a complete or partial NDA text and wants a plain-language explanation of what each clause means and what obligations it creates
- The user wants to understand the structural difference between a mutual NDA (both parties disclose and protect) and a unilateral NDA (one party discloses, the other protects) and what that difference means for their leverage and risk
- The user wants to identify red flags, aggressive provisions, or missing standard carve-outs before handing the document to an attorney for negotiation
- The user is preparing specific questions for a legal consultation and wants to use attorney time efficiently by understanding the document first
- The user wants to understand why a specific clause is phrased the way it is -- for example, why a disclosing party prefers a broad definition of confidential information while a receiving party prefers a narrow one
- The user is a first-time founder, freelancer, or employee encountering an NDA for the first time and needs to build baseline legal literacy about confidentiality agreements
- The user has received an NDA in a specific business context (pre-acquisition due diligence, vendor onboarding, investor pitch, employment pre-hire, accelerator application, joint venture discussion, freelance engagement) and wants to know whether the NDA's terms are standard for that context

**Do NOT use when:**
- The user wants to draft NDA language or generate a new NDA from scratch -- this requires a licensed attorney and falls outside educational explanation (use a legal drafting professional)
- The user wants a direct recommendation on whether to sign a specific NDA -- this skill explains what clauses mean and flags concerns, but the signing decision is legal advice requiring an attorney
- The user is reviewing a general commercial contract that includes a confidentiality section but is primarily about something else (services, licensing, employment) -- use `contract-basics-explainer` for multi-topic contracts
- The user is reviewing the confidentiality provisions of an employment agreement as part of the broader employment contract review -- use `employment-contract-reader` for employment-specific confidentiality, non-compete, and IP assignment clauses
- The user believes an NDA has already been violated and wants to understand their legal exposure or remedies -- this requires a litigation attorney, not educational explanation
- The user needs the NDA interpreted under a specific state's case law to determine enforceability -- jurisdiction-specific legal conclusions require local counsel
- The user wants to compare NDA terms across multiple active contracts to determine which governs a particular disclosure -- this is legal analysis requiring an attorney

---

## Process

### Step 1: Establish Context Before Analysis

Before analyzing any clause, gather the following context because NDA norms differ significantly by use case:

- **NDA type:** Is this mutual (both parties disclose) or unilateral (one party discloses)? If the NDA is labeled "mutual" but structured so that one party has broader obligations, flag that immediately.
- **Business context:** What is the relationship? Pre-acquisition due diligence, vendor selection, investor pitch, freelance project scoping, pre-employment interview, joint venture discussion, accelerator application, technology licensing negotiation, or research collaboration each has different market norms for NDA terms.
- **Counterparty profile:** Is this a large corporation with a legal department (their NDA template will be one-sided by design), a startup (may have a poorly drafted or copy-pasted NDA), an individual, or a government entity (government NDAs have additional complexity around FOIA and public records)?
- **User's role:** Is the user the disclosing party, the receiving party, or both in a mutual structure? Their concerns differ fundamentally -- disclosers worry about scope being too narrow; receivers worry about scope being too broad.
- **Governing law:** Which state or country's law governs? This matters because NDA enforceability varies significantly. California, for example, renders non-compete provisions in NDAs effectively unenforceable. New York courts strictly enforce choice-of-law clauses. Delaware is heavily preferred for M&A NDAs because Delaware courts have extensive NDA precedent.
- **Specific concerns:** Ask whether the user has already spotted something that bothers them, or whether they want a full systematic walkthrough.

### Step 2: Analyze the Parties, Purpose, and Structure Clause

The opening recitals and definitions of parties establish who is bound and for what purpose -- this shapes every other clause.

- **Disclosing Party / Receiving Party definitions:** Confirm whether the NDA defines these as individual entities or whether they include "affiliates," "subsidiaries," and "representatives." A definition that includes affiliates extends the obligation (and the permitted disclosure set) across an entire corporate family -- this has significant implications for large companies.
- **Purpose clause:** The stated purpose limits how confidential information can be used. A narrow purpose like "evaluating a potential acquisition of Company X" means the receiving party cannot use disclosed information for any other purpose -- not to compete, not to approach customers, not to inform other deals. A vague purpose like "exploring a potential business relationship" gives the receiving party more flexibility but also provides less protection to the discloser.
- **Unilateral vs. mutual structure:** Unilateral NDAs where the user is the receiver impose all obligations on the user. Mutual NDAs create symmetric obligations. For joint venture discussions, partnership negotiations, and situations where both parties will share sensitive information, a unilateral NDA is commercially unusual and should prompt the question of whether a mutual structure is more appropriate.
- **Representatives and permitted recipients:** Many NDAs extend the Receiving Party's obligations to their "Representatives" -- typically defined to include directors, officers, employees, attorneys, accountants, and financial advisors. If "Representatives" is defined narrowly (employees only), the receiving party may be unable to have their own counsel review the disclosed information without technically breaching the NDA. Verify that at minimum attorneys and professional advisors are included.

### Step 3: Dissect the Definition of Confidential Information

This is the single most consequential clause in any NDA. Its scope determines the universe of the receiving party's obligations.

- **Three structural approaches and their implications:**
  - **Omnibus / broad definition ("all information disclosed..."):** Maximum protection for the discloser; maximum burden for the receiver. The receiver may not know at any given moment whether information received orally over lunch is covered. This is common in large-company standard templates and is aggressive when used for early-stage discussions where most shared information is non-sensitive.
  - **Marked/designated definition ("only information marked CONFIDENTIAL in writing, or if disclosed orally, confirmed in writing within 10 days..."):** Clear but operationally demanding. The discloser must be disciplined about marking. If the discloser fails to mark information and later claims it was confidential, courts often enforce the marking requirement strictly. 10-30 days is the typical window for oral disclosure confirmation.
  - **Category-based definition ("including but not limited to: trade secrets, financial projections, customer lists, source code, manufacturing processes..."):** The cleanest approach. The receiving party knows exactly what is covered. However, "including but not limited to" turns the list into examples rather than an exhaustive definition, which can reintroduce breadth.
- **"Should reasonably know is confidential" language:** This subjective standard is the most problematic. It asks the receiving party to speculate about the discloser's intent. Flag this phrase whenever it appears.
- **Residuals clauses:** Some technology-industry NDAs include a "residuals" provision allowing the receiving party to use information retained in the unaided memory of their representatives -- without any notes. This benefits the receiving party significantly and is strongly resisted by disclosers. Flag it when present because it substantially limits the NDA's protective value.
- **Trade secret overlap:** Confidential information definitions often overlap with statutory trade secret protection under the Defend Trade Secrets Act (DTSA, federal) and the Uniform Trade Secrets Act (UTSA, adopted by 48 states). Information that qualifies as a trade secret gets indefinite protection under statute regardless of NDA duration -- this is why some NDAs carve out trade secrets for indefinite protection while setting shorter terms for general confidential information.

### Step 4: Evaluate the Standard Exclusions

Every well-drafted NDA should contain all five standard exclusions. Missing even one is a red flag that increases risk for the receiving party. Document which exclusions are present and which are absent.

- **Public domain exclusion:** Information that is or becomes publicly available through no fault of the receiving party is excluded. The key phrase is "through no fault" -- if the receiving party caused the disclosure, this exclusion does not apply.
- **Prior knowledge exclusion:** Information the receiving party already possessed before the NDA's effective date is excluded. Red flag: some NDAs require the receiving party to prove prior possession with documentation predating the NDA. Verify whether this burden exists.
- **Independent development exclusion:** Information independently developed by the receiving party without use of the disclosed information is excluded. This is essential for companies in the same general industry -- without this exclusion, the receiving party could be accused of violating the NDA for developing a product that happens to be similar to what was disclosed.
- **Third-party disclosure exclusion:** Information received from a third party without restriction on disclosure is excluded. This protects the receiving party when they later receive the same information from a non-confidential source.
- **Compelled disclosure exclusion:** Information disclosed pursuant to a court order, law, or government requirement is excluded -- but usually requires advance notice to the discloser so they can seek a protective order. The notice provision is important: if there is no notice requirement, the discloser loses the opportunity to protect their information through a court proceeding.
- **Additional non-standard exclusions to consider:** Some receiving parties seek an exclusion for information developed by personnel who had no access to the discloser's information (common in large companies that firewall teams). This is commercially reasonable but disclosers often resist it.

### Step 5: Analyze Obligations, Standard of Care, and Use Restrictions

The obligations clause defines what the receiving party must actively do (and refrain from doing) to comply with the NDA.

- **Confidentiality obligation vs. use restriction:** These are two distinct obligations that appear in the same clause. The confidentiality obligation prohibits disclosure to third parties. The use restriction prohibits using the information for any purpose other than the stated purpose -- even without disclosing it to anyone. A receiving party can violate an NDA's use restriction by using disclosed information internally for a purpose other than the stated one, even if they never tell anyone outside the company.
- **Standard of care comparison:**
  - "Reasonable efforts" or "reasonable measures" -- the most common, most balanced standard. Courts interpret this as what a reasonable company in that situation would do.
  - "Same care as own confidential information, but no less than reasonable care" -- slightly stricter. Introduces an internal reference point that can raise the bar if the receiving party has robust internal data protection.
  - "Best efforts" or "highest degree of care" -- the most onerous. Courts interpret "best efforts" as requiring extraordinary measures. This standard is unusual and should be negotiated down.
- **Need-to-know distribution:** The NDA should limit internal access to employees and representatives who genuinely need the information to accomplish the stated purpose. Verify whether the NDA requires the receiving party to bind those representatives to equivalent confidentiality obligations -- this is a standard and reasonable requirement.
- **Sub-disclosure to professional advisors:** The receiving party's attorneys, accountants, and financial advisors will often need to review disclosed information. If the NDA does not explicitly permit disclosure to professional advisors who are themselves bound by professional confidentiality obligations, the receiving party may technically breach the NDA by having their own lawyer read the disclosed materials.
- **Security requirements:** Some NDAs, particularly in technology and healthcare contexts, specify technical security requirements (encryption at rest and in transit, access logging, specific SOC 2 compliance). If the receiving party cannot meet specified technical requirements, this must be negotiated before signing.

### Step 6: Examine Term, Duration, and Survival Provisions

Duration provisions contain two distinct and commonly confused time periods.

- **Agreement term:** How long the NDA governs new disclosures. After this period, the discloser cannot disclose new information and expect NDA protection. Common ranges by context:
  - Pre-acquisition due diligence: 1-2 years (deal-focused; expected to close or terminate quickly)
  - Vendor/supplier relationships: 2-3 years with renewal provisions
  - Technology partnerships: 3-5 years
  - General business discussions: 1-3 years
- **Survival/confidentiality obligation period:** How long the receiving party's confidentiality obligations last after the agreement expires or terminates. This is where receiving parties frequently fail to read carefully. A 2-year NDA term with a 5-year survival period means the confidentiality obligations actually last 7 years from execution.
- **Trade secret carve-out:** Best practice in well-drafted NDAs is to apply the standard term to general confidential information while requiring confidentiality of trade secrets for as long as they maintain their trade secret status (indefinitely in practice). This is reasonable and commercially standard. An NDA that applies an indefinite confidentiality obligation to ALL information -- not just trade secrets -- imposes an unreasonable lifetime burden.
- **Evergreen provisions:** Some NDAs automatically renew unless terminated with written notice. Flag automatic renewal provisions because receiving parties may not realize they have a contractual obligation to send timely termination notices.
- **Termination triggers:** Understand what triggers termination. Some NDAs terminate only by mutual written agreement; others terminate automatically upon completion of the stated purpose; others include either-party termination rights with notice periods of 30-90 days. A receiving party should prefer a termination right -- being locked into an NDA indefinitely with no exit mechanism is problematic.

### Step 7: Review Remedies, Injunctive Relief, and Enforcement Provisions

The remedies clause determines the consequences of a breach and establishes the enforcement mechanisms available to the discloser.

- **Injunctive relief acknowledgment:** Most NDAs include language stating that the receiving party acknowledges that breach would cause "irreparable harm" for which "monetary damages would be inadequate," and that the discloser is therefore entitled to seek injunctive relief without posting a bond. This language is strategically placed to remove two barriers to emergency court orders: (1) proving irreparable harm and (2) posting a security bond. Courts are not always bound by this contractual acknowledgment, but it helps the discloser. Flag it because the receiving party is pre-consenting to the discloser's ability to obtain an emergency restraining order.
- **Liquidated damages clauses:** Pre-specified damage amounts triggered by breach. These can be reasonable (representing a genuine pre-estimate of harm) or punitive (far exceeding likely actual harm). The enforceability of liquidated damages varies by state -- some states void them if they constitute a penalty; others enforce them liberally. Flag any liquidated damages clause with the specific amount so the user can evaluate whether it is proportionate to the information being protected.
- **Attorneys' fees:** One-way attorneys' fee provisions (only the prevailing discloser recovers fees) are aggressive. Mutual fee-shifting (prevailing party recovers fees regardless of who wins) is more balanced and standard.
- **Indemnification scope:** Indemnification provisions in NDAs can be broad or narrow. Broad versions require the breaching party to indemnify for all losses, claims, damages, and expenses (including third-party claims resulting from the breach). Narrow versions limit indemnification to direct damages. Flag indemnification provisions that extend to third-party claims.
- **DTSA whistleblower immunity:** The Defend Trade Secrets Act (18 U.S.C. § 1833) grants immunity to individuals who disclose trade secrets to government officials or attorneys in the course of reporting suspected violations of law, or in a court filing made under seal. This right cannot be contractually waived -- NDAs that purport to prohibit all disclosure without exception may be partially unenforceable under DTSA in the context of lawful whistleblowing. Note this protection to users even if the NDA does not mention it.
- **DTSA notice requirement:** For employers seeking DTSA's enhanced damages (exemplary damages up to 2x actual damages and attorneys' fees) in a trade secret misappropriation case, the DTSA requires that the employment agreement or NDA include a reference to the whistleblower immunity provision. Employer-issued NDAs that lack this notice clause may affect the employer's remedy options under federal law.

### Step 8: Flag Non-Solicitation, Non-Compete, and Other Riders

NDAs frequently include provisions that have nothing to do with confidentiality -- these riders materially expand the agreement's scope and must be explicitly identified.

- **Non-solicitation of employees:** Prohibits the receiving party from recruiting or hiring the discloser's employees, typically for 1-2 years after the NDA's term. This is common in M&A due diligence NDAs (the acquirer gains access to information about key employees and could poach them). In early-stage business discussions, a non-solicitation in an NDA presented as "just a standard confidentiality agreement" is a significant scope expansion.
- **Non-solicitation of customers:** Prohibits the receiving party from soliciting the discloser's customers, often based on customer information disclosed under the NDA. This can be commercially devastating for a receiving party in a competitive industry.
- **Non-compete provisions:** Prohibits the receiving party from competing in the discloser's business area for a defined period. These are the most aggressive NDA riders. In California, non-competes are effectively unenforceable (Business and Professions Code § 16600). In other states, enforceability depends on reasonableness of scope, duration, and geography. Flag any non-compete provision in an NDA regardless of jurisdiction and recommend attorney review.
- **Standstill provisions (M&A context):** Prohibit the receiving party from acquiring shares of the discloser or making an unsolicited takeover bid for a defined period (typically 12-24 months). Standard in public company M&A due diligence NDAs. Unusual and aggressive in any other context.
- **No-hire provisions:** Distinct from non-solicitation -- a no-hire provision prohibits hiring specific individuals regardless of whether the receiving party solicited them. Courts increasingly scrutinize these as anti-competitive.

---

## Output Format

Deliver the NDA analysis in this structured format. Populate every field with specific information from the NDA text provided. Do not leave fields blank -- if a provision is absent, explicitly note "Not present" and flag it.

```
## NDA Analysis: [Specific Business Context -- e.g., "Pre-Acquisition Due Diligence NDA, TechCorp → User"]

> This analysis provides educational explanations of NDA provisions. It does not constitute legal advice.
> Concern levels: None | Low | Medium | High | Critical

---

### NDA Overview

| Field                    | Detail                                                         |
|--------------------------|----------------------------------------------------------------|
| NDA Type                 | [Mutual / Unilateral -- specify who discloses, who protects]  |
| Disclosing Party         | [Entity name and how "affiliates" are defined, if applicable] |
| Receiving Party          | [Entity name and definition of "Representatives"]             |
| Stated Purpose           | [Exact or paraphrased purpose from the agreement]             |
| Agreement Term           | [Duration of NDA for new disclosures, e.g., 2 years]         |
| Survival Period          | [Duration of confidentiality obligations after expiration]    |
| Total Obligation Window  | [Term + Survival -- the actual duration of user's obligations]|
| Trade Secret Treatment   | [Indefinite / Same as general CI / Not specified]             |
| Governing Law            | [State / Country]                                             |
| Dispute Resolution       | [Courts / Arbitration / Jurisdiction specified]               |
| Automatic Renewal        | [Yes / No / Not specified]                                    |
| Termination Rights       | [Either party / Mutual only / Completion of purpose]         |

---

### Clause-by-Clause Analysis

#### 1. Definition of Confidential Information
- **Structure:** [Omnibus / Marked-designation / Category-based / Hybrid]
- **Exact language (or summary):** "[Quote or close paraphrase]"
- **What this means in practice:** [Plain-language explanation of what is covered]
- **Market standard for this context:** [What is typical for this type of NDA]
- **Concern Level:** [None / Low / Medium / High / Critical]
- **Notes:** [Specific concerns about overbreadth, subjectivity, or vagueness]

#### 2. Exclusions from Confidential Information

| Exclusion                          | Present? | Concern If Missing                                               |
|------------------------------------|----------|------------------------------------------------------------------|
| Already publicly available         | [Yes/No] | User may be bound by info anyone can find in a Google search     |
| Becomes public through no fault    | [Yes/No] | User may be liable for third-party leaks they didn't cause       |
| Prior knowledge of receiving party | [Yes/No] | User's pre-existing knowledge may become restricted             |
| Received from third party          | [Yes/No] | User may be bound after receiving same info from public source   |
| Independently developed            | [Yes/No] | User's own R&D may be treated as derived from disclosed info    |
| Compelled by law / court order     | [Yes/No] | User may lack ability to comply with legal obligations legally   |

- **Burden of proof:** [Who must prove an exclusion applies, and what documentation is required]
- **Overall Exclusions Concern Level:** [None / Low / Medium / High / Critical]

#### 3. Receiving Party Obligations and Use Restrictions
- **Confidentiality obligation:** [Summarize the non-disclosure duty]
- **Use restriction:** [Summarize limitations on internal use beyond disclosure]
- **Standard of care:** [Reasonable efforts / Same as own CI / Best efforts / Highest degree]
- **Need-to-know requirement:** [Yes/No -- who internally can access]
- **Obligation to bind Representatives:** [Yes/No]
- **Professional advisor sub-disclosure permitted:** [Yes/No/Conditional]
- **Concern Level:** [None / Low / Medium / High / Critical]

#### 4. Term and Duration
- **Agreement term:** [X years from effective date / completion of purpose / other]
- **Survival period:** [X years after expiration / indefinite / not specified]
- **Total obligation window:** [Combined calculation]
- **Trade secret treatment:** [Indefinite / same as general / not specified]
- **Automatic renewal:** [Yes -- X-day notice required / No]
- **Concern Level:** [None / Low / Medium / High / Critical]

#### 5. Compelled Disclosure (Legal Process)
- **Permitted:** [Yes / No / Not addressed]
- **Notice to discloser required:** [Yes -- advance notice / Yes -- prompt notice / No]
- **Cooperation in protective order:** [Required / Not required]
- **DTSA whistleblower protection:** [Referenced in agreement / Not referenced]
- **Concern Level:** [None / Low / Medium / High / Critical]

#### 6. Return and Destruction of Information
- **Obligation:** [Return / Destroy / Either at discloser's election]
- **Trigger:** [On request / On termination / On expiration]
- **Certification required:** [Yes / No]
- **Electronic data acknowledgment:** [Addressed / Not addressed]
- **Concern Level:** [None / Low / Medium / High / Critical]

#### 7. Remedies and Enforcement
- **Injunctive relief pre-acknowledgment:** [Yes / No -- explain implications if yes]
- **Liquidated damages:** [Present -- specify amount / Not present]
- **Attorneys' fees:** [Prevailing party / One-way / Not specified]
- **Indemnification scope:** [Direct damages only / Third-party claims included / Not specified]
- **Concern Level:** [None / Low / Medium / High / Critical]

#### 8. Riders and Additional Restrictions
- **Non-solicitation (employees):** [Present -- X-year duration / Not present]
- **Non-solicitation (customers):** [Present -- X-year duration / Not present]
- **Non-compete:** [Present -- scope, duration, geography / Not present]
- **Standstill:** [Present -- X-month duration / Not present]
- **Other riders:** [List any additional restrictions beyond confidentiality]
- **Overall Riders Concern Level:** [None / Low / Medium / High / Critical]

---

### Red Flags Summary

| Priority | Clause                  | Issue                                         | Practical Impact on User                          |
|----------|-------------------------|-----------------------------------------------|---------------------------------------------------|
| Critical | [Clause name]           | [Specific problem]                            | [What this means for the user's obligations]      |
| High     | [Clause name]           | [Specific problem]                            | [What this means for the user's obligations]      |
| Medium   | [Clause name]           | [Specific problem]                            | [What this means for the user's obligations]      |
| Low      | [Clause name]           | [Specific problem]                            | [What this means for the user's obligations]      |

---

### Missing Standard Provisions Checklist

- [ ] [Missing provision] -- [Why it matters and what risk its absence creates]
- [ ] [Missing provision] -- [Why it matters and what risk its absence creates]

---

### Market Context Assessment

**For [this type of NDA], the market standard is:**
[2-4 sentences describing what is typical for this specific NDA context -- pre-acquisition due diligence, employment, investor pitch, vendor relationship, etc. -- and how this NDA compares to that standard.]

---

### Questions to Raise with Your Attorney

**About scope and definitions:**
1. [Specific, targeted question tied to a clause concern]
2. [Specific, targeted question tied to a clause concern]

**About obligations and compliance:**
3. [Specific, targeted question about how to comply with a specific provision]
4. [Specific, targeted question about a provision the user may not be able to meet]

**About negotiation:**
5. [Specific, targeted question about whether a particular term is negotiable]
6. [Specific, targeted question about alternative language to propose]

**About jurisdiction and enforceability:**
7. [Specific question about how the governing state's courts interpret a particular provision]

---

### Jurisdiction Note

This NDA designates [State] law as governing. Key considerations:
- [State]-specific rule 1 relevant to this NDA
- [State]-specific rule 2 relevant to this NDA
- How [State] courts have historically treated [the most concerning provision]
- Whether the user's home state differs from the governing law state, and what that means practically

Recommend confirming all of the above with an attorney licensed in [State].
```

---

## Rules

1. **Always present the disclaimer first and do not bury it.** Place the disclaimer at the top of every response. Do not allow enthusiasm for helping the user to push the disclaimer below the fold.

2. **Never advise the user to sign or not sign.** This is the clearest line between legal education and legal advice. Present the analysis, flag concerns at appropriate severity levels, and always close with a recommendation for attorney review of any High or Critical concern. Saying "this clause is aggressive and you should ask your attorney whether to push back" is appropriate; saying "you should not sign this" is not.

3. **Never draft NDA language or propose specific substitute clause text.** Explaining what a clause means and why it is concerning is within scope. Writing alternative language for the user to propose is drafting -- it creates legal risk for the user if the language has unintended consequences. Direct the user to their attorney for specific language changes.

4. **Distinguish confidentiality obligations from use restrictions in every analysis.** These are different duties with different compliance implications. A receiving party can breach a use restriction without telling anyone outside the company. Always explain both dimensions when analyzing the obligations clause.

5. **Flag every missing standard exclusion explicitly, by name.** Do not summarize missing exclusions as "the exclusions are incomplete." Enumerate which of the five standard exclusions are absent and explain the specific risk each absence creates for the receiving party.

6. **Always flag non-compete, non-solicitation, standstill, and no-hire provisions as scope expansions, regardless of how routine the counterparty claims they are.** These provisions materially expand an NDA beyond confidentiality. The phrase "just a standard NDA" from a counterparty should heighten attention to riders, not reduce it.

7. **Always note DTSA whistleblower immunity, even if the NDA does not reference it.** Users -- particularly employees -- have a federal right to disclose trade secrets to government officials in the context of reporting suspected legal violations. This right cannot be waived by contract. Noting it ensures the user knows a right they may not know they have.

8. **Calculate and state the total obligation window explicitly.** Users routinely misread a "2-year NDA" as meaning their obligations last 2 years. If the agreement has a 2-year term plus a 3-year survival period, state clearly that the user's actual obligations last 5 years from signing.

9. **Assess every NDA against the norms for its specific context.** A provision that is aggressive in a freelance project NDA may be completely standard in a public-company M&A due diligence NDA. Calibrate severity levels against market norms for the specific context, not against an abstract "standard NDA."

10. **When the NDA is governed by a state other than the user's home state, flag this as a jurisdiction concern.** Non-compete enforceability, interpretation of broad definitions, and the implied covenant of good faith differ substantially by state. California, New York, Delaware, and Texas each have materially different NDA jurisprudence. Note the governing state's known tendencies and recommend local counsel review.

11. **When the user provides only a partial NDA or describes clauses from memory, explicitly note the limitations of the analysis.** Analysis of a paraphrased or incomplete NDA is less reliable than analysis of the actual text. Recommend the user share the full document and note that missing provisions may affect the analysis.

12. **Do not present concern levels as binary (fine vs. problematic).** Use a five-tier scale -- None, Low, Medium, High, Critical -- and explain what each level means in context. A provision can be "Medium" concern -- not a deal-breaker but worth understanding and potentially negotiating.

---

## Edge Cases

### Pre-Interview NDA (Employment Context)

Pre-interview NDAs are increasingly common in technology, finance, and executive recruitment. They are appropriate when the candidate will hear genuinely confidential information during the interview process (unannounced product plans, M&A targets, financial results). They become problematic when they are so broad that the candidate is restricted from discussing their own pre-existing knowledge or career trajectory.

**What to look for:**
- Scope should be limited to information disclosed during the interview process, not the candidate's pre-existing knowledge about the industry
- Duration of 1-2 years is reasonable; 5-year pre-interview NDAs are disproportionate
- No non-compete provisions -- the candidate has not been hired and should not be restricted from employment elsewhere based on an interview
- No non-solicitation provisions -- pre-hire NDAs should not restrict who the candidate can work with in the future
- The purpose clause should reference the hiring evaluation specifically, not broadly "exploring a business relationship"

Flag any pre-interview NDA that includes non-compete provisions regardless of their scope. Flag duration over 2 years. Flag definitions so broad they cover information the candidate learned independently before the interview.

### Investor Pitch NDA (Startup Context)

Many venture capital firms and sophisticated angel investors decline to sign NDAs before hearing pitches. This is a market norm, not bad faith -- investors hear hundreds of pitches in similar categories and signing NDAs creates legal complexity. When a startup is asked to sign an NDA before presenting to an investor or accelerator, the concern reverses: the investor may be trying to restrict the startup from discussing its own ideas.

**What to look for:**
- The purpose clause must be specific to the pitch/evaluation process, not broadly stated
- The startup is often the disclosing party -- verify that the NDA actually protects the startup's information, not only the investor's
- Watch for unilateral NDAs where the startup is the receiver -- this is unusual in pitch contexts and may be an attempt to restrict the startup's use of information it independently developed
- Accelerator application NDAs should not restrict the applicant from discussing their business concept with co-founders, advisors, or other investors outside the application process
- Look for "no-shop" or standstill provisions that could prevent the startup from pitching to other investors during the evaluation period

### Extremely Short NDA (One Page or Fewer)

A one-paragraph or one-page NDA is not inherently weaker than a long one -- brevity can actually create broader obligations because the standard carve-outs that protect receiving parties are absent.

**What to look for:**
- Verify all five standard exclusions. One-page NDAs frequently omit the prior knowledge, independent development, and third-party source exclusions
- Check whether there is any term limit. NDAs without an explicit term may create obligations that are indefinite by default
- Check whether there is a compelled disclosure provision. Without it, the receiving party may be unable to comply with a subpoena without breaching the NDA
- Check whether permitted recipients (employees, advisors) are defined. Without this, any internal distribution could technically breach the NDA
- A one-page NDA with no exclusions, no term, and no compelled disclosure provision may create more onerous obligations than a 10-page NDA with all standard provisions present

### Mutual NDA with Asymmetric Obligations

Some NDAs are titled "Mutual Confidentiality Agreement" but impose meaningfully different obligations on each party. This asymmetry can arise from:
- Different definitions of confidential information for each party (Party A's CI is defined broadly; Party B's is defined by a marked-designation requirement)
- Different survival periods (Party A's obligations survive for 5 years; Party B's survive for 2 years)
- Different standards of care (Party A must use "best efforts"; Party B must use "reasonable efforts")
- Remedies available only to one party (Party A can seek injunctive relief; Party B cannot)
- Non-solicitation provisions that run only one direction

When analyzing a mutual NDA, explicitly compare the obligations of both parties side-by-side in the analysis. If the NDA is labeled mutual but the obligations are materially asymmetric, flag this prominently. The asymmetry may be intentional (the party with the more sensitive information negotiated stronger protections) or inadvertent (template language was not properly adapted for a mutual structure).

### M&A Due Diligence NDA (Acquisition Context)

NDAs for pre-acquisition due diligence have specific market-standard features that differ from general business NDAs. Understanding these norms prevents treating standard M&A provisions as red flags or vice versa.

**Standard in M&A NDAs that may appear aggressive in other contexts:**
- Standstill provisions (12-18 months) preventing the acquirer from making unsolicited offers or acquiring shares -- completely standard
- Non-solicitation of employees for 18-24 months -- completely standard because the acquirer gains deep visibility into key personnel
- "Big boy" letters excluding personal injury claims from the limitation of liability -- common in sophisticated transactions
- Specific carve-outs allowing the target to provide information to potential acquisition financing sources under separate confidentiality agreements

**What is still unusual even in M&A NDAs:**
- Indefinite confidentiality obligations on ALL information (not just trade secrets)
- Non-compete provisions against the acquiring company's entire business (beyond the target's specific area)
- Liquidated damages provisions -- M&A NDAs rarely specify pre-set damage amounts because actual harm from breach is highly fact-specific

### NDA That Includes Conflicting Choice-of-Law and Forum Selection Clauses

Occasionally an NDA designates one state's law as governing (e.g., "This Agreement shall be governed by the laws of Delaware") but designates courts in a different state as the mandatory forum (e.g., "Any dispute shall be resolved in the courts of New York"). This creates potential conflict because the New York court would apply Delaware law -- which it can do, but which may reduce consistency of interpretation.

More problematically, some NDAs designate arbitration as the dispute resolution mechanism but include conflicting language allowing either party to seek emergency injunctive relief in court. This is actually common and usually intentional -- arbitration for damages claims, courts for emergency injunctive relief. Explain this structure to the user rather than flagging it as an error.

If the choice-of-law state's non-compete law conflicts with where the receiving party works (particularly California), flag that the choice-of-law provision may not override California's strong public policy against non-competes -- California courts frequently refuse to apply non-California law to non-compete provisions affecting California residents even when the contract selects another state's law.

### User Cannot Locate a Key Clause (Missing Provision Uncertainty)

When the user reports that they cannot find a specific clause -- such as a term provision or survival period -- in the NDA they received, treat the absence as analytically significant rather than a reading error.

- First, ask the user to search for synonymous terms. "Term" may be labeled "Duration," "Effective Period," or appear in a "Miscellaneous" section. "Compelled disclosure" may appear under "Required Disclosures" or "Legal Process."
- If after searching the provision genuinely appears absent, explain the legal default. Courts typically imply a reasonable duration when an NDA lacks an explicit term -- but "reasonable" varies by state and the nature of the information. An NDA with no stated term may effectively create indefinite obligations under some courts' interpretations.
- Flag the absence in the Missing Standard Provisions checklist and prioritize it as a question for attorney review.
- Never assume a provision is present based on context or the user's description of the NDA as "standard."

---

## Example

**Input:**
"I'm a software engineer and a company wants to bring me in for technical interviews for a senior role. Before the first call, they sent me a 3-page NDA. Key provisions:

1. Confidential information is defined as 'any and all information, in any form, disclosed by Company to Candidate during the interview process, including but not limited to technical architecture, product roadmaps, business strategies, personnel information, and any information Company indicates is confidential.'
2. I have to use 'best efforts' to protect the information.
3. The obligations last for 5 years from the date of each disclosure.
4. There are no exclusions listed anywhere in the document.
5. There's a paragraph that says: 'Candidate agrees not to solicit or recruit any Company employees for a period of 3 years following the conclusion of the interview process.'
6. The remedies section says Company can seek injunctive relief and that I 'waive any requirement that Company post a bond.'
7. Governed by Texas law, Harris County courts.
8. No mention of return or destruction of information, no mention of permitted recipients.

I haven't even had a first interview yet. This seems like a lot."

---

**Output:**

## NDA Analysis: Pre-Interview Confidentiality Agreement, Technology Company → Software Engineer Candidate

> This analysis provides educational explanations of NDA provisions. It does not constitute legal advice. Concern levels: None | Low | Medium | High | Critical.

---

### NDA Overview

| Field                   | Detail                                                                                          |
|-------------------------|-------------------------------------------------------------------------------------------------|
| NDA Type                | Unilateral -- Company discloses; Candidate (you) protects                                      |
| Disclosing Party        | Company (definition of "affiliates" not reported -- verify whether parent/subsidiary included) |
| Receiving Party         | Candidate (you) -- permitted recipients not defined                                            |
| Stated Purpose          | Interview process evaluation                                                                    |
| Agreement Term          | Not a fixed term -- obligations run 5 years from date of each individual disclosure            |
| Survival Period         | Not separately stated -- the 5-year obligation IS the duration                                 |
| Total Obligation Window | Up to 5 years from the last disclosure made during interviews                                  |
| Trade Secret Treatment  | Not separately addressed -- all CI treated the same                                            |
| Governing Law           | Texas (Harris County)                                                                           |
| Dispute Resolution      | Harris County courts (state court jurisdiction)                                                |
| Automatic Renewal       | Not reported                                                                                    |
| Termination Rights      | Not reported -- unclear how agreement ends if you withdraw from process                        |

---

### Clause-by-Clause Analysis

#### 1. Definition of Confidential Information

- **Structure:** Category-based with omnibus expansion ("any and all information, in any form")
- **Summary of language:** Covers anything disclosed during the interview process, including technical architecture, product roadmaps, business strategies, and personnel information, plus anything the Company "indicates is confidential."
- **What this means in practice:** Nearly everything the Company tells you during the interview is covered. Technical details you learn during a whiteboard exercise, information about team structure you hear in a hiring manager call, even incidental comments about company direction are potentially covered. The phrase "indicates is confidential" adds a subjective element -- the Company could verbally indicate that something is confidential without any formal marking.
- **Market standard for pre-interview NDAs:** Reasonable pre-interview NDAs limit coverage to genuinely sensitive technical or business information shared specifically for evaluation purposes. "Any and all information in any form" is broader than necessary for an interview context. Category-based definitions listing specific categories (architecture, roadmaps, financial data) without the "any and all" expansion would be more appropriate.
- **Concern Level:** High
- **Notes:** The open-ended "any information Company indicates is confidential" language means the Company can unilaterally expand what is covered during any conversation without any written designation requirement. This creates uncertainty about your obligations.

---

#### 2. Exclusions from Confidential Information

| Exclusion                          | Present? | Risk Created by Absence                                                                               |
|------------------------------------|----------|-------------------------------------------------------------------------------------------------------|
| Already publicly available         | No       | If Company mentions its publicly available roadmap items or open-source architecture in your call, that information is technically covered by this NDA |
| Becomes public through no fault    | No       | If Company later has a data breach or public disclosure, you may remain bound by this NDA even though the information is now public |
| Prior knowledge of receiving party | No       | If you already know about the Company's tech stack from public sources (GitHub repos, conference talks, tech press), using that knowledge could theoretically violate this NDA |
| Received from third party          | No       | If a recruiter or another employee later tells you the same information outside this NDA, you may still be bound |
| Independently developed            | No       | If you independently build or think of something similar to what you heard in the interview, you could face an accusation that you derived it from the Company's disclosure |
| Compelled by law / court order     | No       | If you receive a subpoena or are required by law to testify, you have no contractual right to disclose without violating the NDA |

- **Burden of proof:** Not addressed -- if disputed, you would likely bear the burden of proving an exclusion applies in litigation, without any contractual safe harbor language to rely on.
- **Overall Exclusions Concern Level:** Critical -- all five standard exclusions are absent. This is the most significant structural problem with this NDA.

---

#### 3. Receiving Party Obligations and Use Restrictions

- **Confidentiality obligation:** Protect all covered information from disclosure to third parties.
- **Use restriction:** Not separately articulated -- verify whether the agreement also restricts your use of the information for purposes other than the interview (e.g., using technical insights to inform your own projects).
- **Standard of care:** "Best efforts" -- this is the most demanding standard. Courts in Texas and most states interpret "best efforts" as requiring extraordinary, near-maximum measures to protect the information. This goes well beyond the "reasonable efforts" standard that is market-norm for an NDA of this type.
- **Need-to-know requirement:** Not stated -- the NDA does not appear to limit which of your representatives can access information.
- **Obligation to bind Representatives:** Not stated.
- **Professional advisor sub-disclosure permitted:** Not stated -- this means you may not be able to share interview disclosures with your own attorney to get advice about the NDA itself without technically violating it.
- **Concern Level:** High -- "best efforts" standard is disproportionately demanding for a pre-interview context. The absence of permitted recipient definitions creates ambiguity.

---

#### 4. Term and Duration

- **Agreement term:** Not a fixed term -- the 5-year obligation runs from each individual disclosure date. If the Company makes disclosures across multiple interview rounds, the clock resets with each disclosure.
- **Survival period:** Not separately stated -- the structure is obligations-per-disclosure rather than agreement-term-plus-survival.
- **Total obligation window:** Up to 5 years from your last interview conversation. If final round interviews happen 6 months after you sign, your obligations could run until approximately 5.5 years from signing.
- **Trade secret treatment:** Not differentiated. Trade secrets and general business information are treated identically under this NDA's 5-year period. Note that actual trade secrets receive separate protection under Texas law (Texas Uniform Trade Secrets Act) regardless of what the NDA says.
- **Automatic renewal:** Not reported.
- **Concern Level:** Medium -- 5 years is on the longer end for a pre-interview NDA (1-2 years is more proportionate), but it is not extreme. The per-disclosure structure rather than a fixed agreement term is unusual and worth clarifying.

---

#### 5. Compelled Disclosure (Legal Process)

- **Permitted:** Not addressed.
- **Notice to discloser required:** Not addressed -- because no compelled disclosure provision exists.
- **Cooperation in protective order:** Not addressed.
- **DTSA whistleblower protection:** Not referenced in the agreement. However, your rights under the Defend Trade Secrets Act (18 U.S.C. § 1833) exist independently of what the NDA says. If you ever need to report suspected illegal conduct by the Company to a government agency and that report involves trade secret information, federal law protects you from civil liability under this NDA for that disclosure. This NDA cannot waive that right.
- **Concern Level:** High -- the complete absence of a compelled disclosure provision means you have no contractual authorization to comply with a lawful subpoena or government inquiry without breaching the NDA. Your attorney would need to address this if it arose.

---

#### 6. Return and Destruction of Information

- **Obligation:** Not present.
- **Trigger:** N/A.
- **Certification required:** N/A.
- **Electronic data acknowledgment:** Not addressed.
- **Concern Level:** Low for a pre-interview context. Candidates typically do not receive physical or digital files during interviews. However, if the Company shares documents, technical specs, or recorded video sessions during the process, the absence of a return/destruction provision means your obligations regarding those materials are undefined at agreement end.

---

#### 7. Remedies and Enforcement

- **Injunctive relief pre-acknowledgment:** Yes -- you are acknowledging in advance that the Company can seek a court order against you and that your agreement serves as evidence that monetary damages are inadequate.
- **Bond waiver:** Yes -- you are waiving the requirement that the Company post a security bond before obtaining an emergency restraining order. In practice, this means the Company could obtain emergency injunctive relief against you at reduced cost and reduced procedural burden. This provision is not uncommon in company-drafted NDAs but is aggressive in a pre-interview context where the information shared is typically limited.
- **Liquidated damages:** Not reported -- confirm this is absent from the document.
- **Attorneys' fees:** Not reported -- verify whether a fee-shifting provision exists.
- **Indemnification scope:** Not reported.
- **Concern Level:** Medium -- the injunctive relief acknowledgment and bond waiver together are aggressive. In the context of a large company with a legal department, they reflect standard template language rather than targeted aggression, but they are worth noting.

---

#### 8. Riders and Additional Restrictions

- **Non-solicitation (employees):** Present -- 3 years from conclusion of the interview process. This prohibits you from recruiting or soliciting any Company employees for 3 years after your interviews end, regardless of whether you were hired.
- **Non-solicitation (customers):** Not reported.
- **Non-compete:** Not reported -- confirm this is absent.
- **Standstill:** Not applicable (pre-employment context).
- **Overall Riders Concern Level:** High -- a 3-year non-solicitation of employees that begins running from the conclusion of an interview process is a significant restriction on a candidate who was never hired. If you interview and are rejected, you would be contractually prohibited from recruiting or referring Company employees to other opportunities for 3 years, even through informal professional networking. This provision goes well beyond confidentiality and was likely carried over from the Company's vendor NDA template without modification for the interview context.

---

### Red Flags Summary

| Priority | Clause                         | Issue                                                               | Practical Impact on You                                                                                               |
|----------|--------------------------------|---------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Critical | Exclusions                     | All five standard exclusions are absent                             | Your pre-existing knowledge, independently developed work, and publicly available information may all be treated as covered by this NDA |
| High     | Non-solicitation rider         | 3-year non-solicitation of employees starting after interview ends  | Even if you are rejected, you cannot recruit or refer Company employees for 3 years -- this restricts your professional networking unrelated to confidentiality |
| High     | Standard of care               | "Best efforts" rather than "reasonable efforts"                     | You are held to a near-maximum standard of protection, not the typical market standard, for information shared during an interview |
| High     | No compelled disclosure clause | You cannot comply with a subpoena without contractually breaching   | If you were ever legally required to disclose information discussed in interviews, this NDA provides no pathway to do so |
| High     | No permitted recipients        | You cannot share interview information with your own attorney       | Seeking legal advice about this NDA or the interview process could technically violate the NDA's confidentiality obligation |
| Medium   | Broad confidential info definition | "Any and all information" plus Company-indicated confidentiality  | Near-unlimited scope of what is covered; you cannot confidently know what you are and are not restricted from discussing |
| Medium   | Bond waiver                    | You pre-waive the Company's obligation to post security bond        | Lowers the barrier for the Company to obtain emergency court orders against you                                        |
| Low      | 5-year duration per
