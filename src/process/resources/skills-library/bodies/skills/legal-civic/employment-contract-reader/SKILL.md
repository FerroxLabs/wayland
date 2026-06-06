---
name: employment-contract-reader
description: |
  Guides users through key terms in employment contracts and offer letters, explaining compensation structures, benefits, restrictive covenants, termination provisions, and intellectual property assignments. Identifies negotiation leverage points and generates questions for attorney review.
  Use when the user has received a job offer letter or employment contract, wants to understand employment agreement terms, or needs to prepare for a negotiation conversation with an employer.
  Do NOT use for freelance or independent contractor agreements, executive compensation packages requiring specialized counsel, or legal advice on whether to accept an offer.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts checklist guide"
  category: "legal-civic"
  subcategory: "personal-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---
# Employment Contract Reader

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- The user has received a formal employment contract or offer letter and wants clause-by-clause plain-language analysis
- The user wants to identify provisions that are outside market norms before accepting or negotiating an offer
- The user wants to understand the financial impact of compensation structures -- particularly equity vesting, bonus conditions, and clawback provisions
- The user needs to understand how restrictive covenants (non-compete, non-solicitation, IP assignment) could limit their career mobility after leaving
- The user wants to compare the restrictive burden and total compensation across two or more competing offers
- The user is preparing for a negotiation conversation with an employer and wants to know which terms are routinely negotiated and how to frame requests
- The user wants a structured list of specific, informed questions to bring to an employment attorney -- not just general concerns

**Do NOT use when:**
- The user has a freelance or independent contractor agreement -- the legal framework, tax classification, and relevant risks differ entirely (use `contract-basics-explainer`)
- The user is reviewing a standalone NDA unrelated to an employment offer (use `nda-clause-explainer`)
- The user wants advice on whether to accept or decline a specific job offer -- that is a personal and career decision beyond legal literacy
- The user has an executive compensation package involving carry interest, change-in-control golden parachutes, 409A deferred compensation, or SERP arrangements -- these require specialized executive compensation counsel and exceed this skill's scope
- The user is asking about employment law rights broadly -- wrongful termination, discrimination, wage and hour law -- as a standalone topic (use `employment-law-basics`)
- The user has already signed the agreement and wants to know if they can get out of it -- that is a legal dispute situation, not contract literacy
- The user needs a severance agreement reviewed after a layoff -- severance releases carry distinct legal considerations (use `severance-agreement-review`)

---

## Process

### Step 1: Identify the Document Type, Position Level, and Jurisdiction

Before analyzing any terms, establish context that determines which issues are high-priority.

- **Document type matters enormously.** An offer letter is typically a summary of key terms -- it is usually binding on salary, start date, and at-will status, but benefits, restrictive covenants, and detailed equity terms are almost always governed by separate documents (a Proprietary Information and Inventions Agreement (PIIA), Employee Handbook, Equity Plan, and Award Agreement). A full employment contract is a standalone binding agreement. Ask the user which they have and request all referenced documents before completing analysis.
- **Position level changes the risk profile.** Entry-level employees face fewer restrictive covenants and simpler equity structures. Mid-career employees should scrutinize non-competes and IP assignment scope -- their institutional knowledge is what makes these provisions meaningful. Senior hires (VP and above) often have negotiating leverage on nearly every term; flag the full range of negotiation opportunities.
- **Industry affects norms.** Technology companies heavily use equity (especially options and RSUs), have broad IP assignment clauses, and frequently impose non-solicitation of employees. Financial services firms use compensation clawbacks and may impose broad non-solicitation of clients. Healthcare has licensing and credentialing clauses. Media and creative fields often include broad work-for-hire provisions. Flag deviations from industry norms explicitly.
- **Jurisdiction is the single most important variable for restrictive covenants.** Collect the state (or country) where the employee will primarily work -- not where the company is incorporated. California, North Dakota, and Oklahoma broadly void non-competes for employees. Minnesota banned most employee non-competes effective January 1, 2023. Colorado, Illinois, Maine, Maryland, Nevada, Oregon, Rhode Island, Virginia, and Washington have enacted salary thresholds below which non-competes are void (e.g., Colorado voids non-competes for workers earning under $123,750 as of 2024 thresholds; Illinois voids them under $75,000). Massachusetts requires garden leave or independent consideration plus procedural compliance under the 2018 Noncompetition Agreement Act.
- Ask specifically: Is there a prior inventions list attached or referenced? This is critical for engineers, designers, researchers, and anyone with ongoing side projects.

---

### Step 2: Analyze Compensation Structures in Detail

Compensation analysis goes well beyond listing numbers -- the structure and conditions determine actual expected value.

**Base Salary:**
- Note pay frequency (semi-monthly vs. bi-weekly -- this affects cash flow and paycheck size). Semi-monthly = 24 paychecks/year; bi-weekly = 26 paychecks.
- Identify exempt vs. non-exempt classification under the FLSA. For 2024, the federal salary threshold for exempt status is $684/week ($35,568/year), but some states set higher thresholds (California requires $66,560/year for 2024). Misclassification as exempt strips overtime eligibility.
- Flag whether salary is guaranteed for any minimum period. In at-will states, a guaranteed salary for "one year" is only enforceable if the contract explicitly limits at-will termination for that period -- mere salary mention is not a guarantee of employment duration.
- Note whether raises are guaranteed (uncommon), tied to CPI, or purely discretionary. "Annual review" language without guaranteed minimums means the company has full discretion.

**Bonus Compensation:**
- Distinguish mandatory language ("Employee shall receive a bonus of...") from discretionary language ("Employee may be eligible for a bonus..."). Discretionary bonuses are not enforceable as income you can count on.
- Check whether the bonus requires active employment on the payment date. "Must be employed on December 31 to receive the annual bonus" means a departure in November forfeits a full year of performance. This is a common negotiation point -- request proration language.
- Commission plans: look for draw provisions (recoverable vs. non-recoverable), quota calculation methods, territory protection, and whether commissions are paid on invoicing, payment receipt, or contract signing.
- Clawback provisions require specific attention: what triggers recoupment (voluntary departure within X months, termination for cause, financial restatement), what is the repayment schedule, and is the clawback limited to net after-tax amounts or gross. Gross clawbacks are punitive and worth flagging.
- Signing bonuses almost universally have repayment provisions. Note the duration (typically 12-24 months) and whether repayment is prorated (departing after 8 months of a 12-month period = repay 4/12 of the bonus) or cliff-based (any departure before month 12 = full repayment). Prorated repayment is significantly more employee-friendly.

**Equity Compensation -- The Most Complex and High-Stakes Component:**
- Identify the equity type precisely. Stock options (the right to buy shares at a fixed price) are not the same as RSUs (a promise to deliver shares upon vesting). The distinction matters enormously for tax treatment, risk, and actual value.
- **ISO (Incentive Stock Options):** Available only to employees; have favorable AMT tax treatment if holding periods are met (hold shares 2 years from grant date AND 1 year from exercise date). Capped at $100,000 in grant value per year under ISO rules; excess is treated as NSO.
- **NSO (Non-Qualified Stock Options):** Available to employees and non-employees; spread at exercise is ordinary income regardless of holding period. Less tax-favorable but more flexible.
- **RSUs:** No exercise price; vest and convert to shares automatically. Taxed as ordinary income at vesting on the fair market value. In private companies, RSUs may have a double-trigger vesting requirement (time + liquidity event) to prevent a tax event with no liquid shares.
- Vesting schedule: the industry-standard for startups and tech is a 4-year vest with a 1-year cliff. After the cliff, monthly vesting is more employee-friendly than quarterly or annual vesting. Ask the user to confirm the post-cliff schedule.
- For private company options, identify the strike price relative to the 409A independent appraised value (the FMV used to set strike prices). A strike price close to FMV means the option has little intrinsic value today; a lower strike price (from earlier grants) has more value but only on paper until a liquidity event.
- Exercise windows after departure are critical and frequently overlooked: the standard 90-day post-departure exercise window is punitive for employees with options at private companies where there is no liquid market to fund the exercise. Some companies have extended this to 1 year, 5 years, or until the earlier of 10 years from grant or company exit. This is a legitimate negotiating point.
- Acceleration: single-trigger acceleration (equity vests upon a change of control) is rare and extremely valuable; double-trigger acceleration (equity vests upon both a change of control AND termination without cause or constructive dismissal within a defined window, typically 12-24 months) is more common in senior offers. If neither is present, flag it as a negotiation item.
- For public company equity: RSU cliff dates relative to blackout periods, tax withholding method (sell-to-cover vs. net share settlement), and 10b5-1 plan considerations matter for timing.

**Benefits:**
- Health insurance start dates vary: some employers begin coverage on day one, others on the first of the month following start, others after 30 or 90 days. A gap in coverage can be financially significant.
- 401(k) matching: note both the match percentage (e.g., 100% match up to 3% of salary = $5,400/year at $180K salary) and the vesting schedule for employer match (immediately vested, cliff vesting at 2-3 years, or graded vesting over 6 years). Unvested match is forfeited upon departure.
- PTO: accrual-based vs. unlimited PTO. Unlimited PTO sounds generous but eliminates payout on departure in most states (only California, Illinois, and a few others require PTO payout as wages; most states allow unlimited PTO policies that eliminate accrual). Accrual-based PTO with a payout obligation is often more valuable. Note use-it-or-lose-it restrictions and carryover caps.
- Relocation packages: lump sum vs. managed move, tax gross-up inclusion, and repayment provisions. Flag repayment clauses on relocation with the same scrutiny as signing bonuses.

---

### Step 3: Analyze Restrictive Covenants -- The Career Mobility Provisions

This section requires the most careful analysis because the consequences are long-lasting and users systematically underestimate them.

**Non-Compete Clauses:**
- Map the geographic scope precisely. "Worldwide" or "global" scope is frequently unenforceable for mid-level employees but may face less scrutiny for senior executives with genuinely global roles.
- Map the activity scope. "Shall not engage in any business that competes with the Company" can encompass entire industries. "Shall not perform software engineering services for a direct competitor in the enterprise security software space" is narrowly tailored and more likely enforceable.
- Duration matters: 6 months is commonly upheld for most employees; 1 year is the upper range for most non-executive roles; 2 years is rarely upheld except for senior executives with access to genuinely sensitive long-cycle business strategies.
- Note the consideration question: in many states, a non-compete signed mid-employment (not at hiring) requires independent consideration beyond continued employment. Signing a new non-compete months into employment for nothing in return may be unenforceable in Illinois, Massachusetts, Washington, and others.
- The FTC's 2024 proposed rule broadly banning non-competes was struck down by federal courts. At publication time, non-compete regulation remains a state-by-state matter -- always verify current status in the user's jurisdiction.
- If the contract has a California choice-of-law clause but the employee works in California, California courts will likely apply California law regardless -- choice-of-law clauses cannot override fundamental public policy of the forum state.

**Non-Solicitation Clauses:**
- Distinguish client non-solicitation from employee non-solicitation. They have different legal standards and different practical impacts.
- Client non-solicitation: note whether it covers only clients the employee personally served, or all company clients globally. "Any client with whom you had material contact in the 12 months prior to departure" is narrower and more reasonable than "any client of the Company at any time."
- Employee non-solicitation: "You shall not solicit employees of the Company" is common; "You shall not hire employees of the Company" is broader and more restrictive; "You shall not encourage departure" is extremely broad and potentially vague. In California, employee non-solicitation clauses have faced significant legal challenge as quasi-non-compete restrictions.
- Duration: 1 year is standard; 2 years is high for non-solicitation. Note the start date -- does the clock run from notice of departure or actual last day?
- Passive vs. active solicitation: some clauses bar only active outreach; others bar hiring a former colleague who independently applied to an open position. Flag overly broad passive solicitation coverage.

**Confidentiality and Non-Disclosure Provisions:**
- The definition of "Confidential Information" is the key battleground. Broad definitions ("any information not publicly available") can technically cover general skills, methodologies, and professional knowledge the employee brought to the role or would naturally develop -- this overreach is worth flagging.
- Carve-outs to look for: information already known to the employee before employment; information independently developed without use of company resources; information received from a third party without restriction; information required to be disclosed by law (e.g., to regulatory authorities, in legal proceedings).
- Duration: trade secrets may have perpetual protection under state trade secret law regardless of what the contract says. Non-trade-secret confidential information typically has a finite duration (2-5 years post-employment) in a well-drafted agreement. Perpetual confidentiality on all confidential information (including non-trade-secret business information) is worth questioning.
- Note the federal Defend Trade Secrets Act (DTSA) immunity provision: employees may disclose trade secrets to attorneys or government agencies for reporting purposes. Some employment agreements include or should include this notice language.
- Whistleblower carve-outs: under the NLRA and various state laws, employees retain rights to discuss wages, hours, and working conditions with coworkers. Confidentiality clauses cannot override these protected concerted activity rights.

**Intellectual Property Assignment -- The Most Underestimated Risk for Knowledge Workers:**
- The core question is whether the assignment covers work created (a) only during work hours using company resources, (b) during work hours or using company resources, or (c) at any time during employment. Option (c) is the most concerning and most common in tech company PIIAs.
- "Related to the Company's business or anticipated business" is extremely broad for a technology company whose "anticipated business" could span virtually any software product.
- Prior inventions schedule: this is a separate exhibit (typically Exhibit A of a PIIA) where the employee lists specific prior inventions, open-source projects, or side projects they want to exclude from assignment. If the user has not completed this schedule, it defaults to assigning all potentially relevant prior work. This is one of the highest-priority items to address before signing.
- Moral rights and attribution: relevant for creative professionals -- whether the employee retains any right to be credited for work.
- State carve-outs exist in California (Labor Code §2870), Delaware (§ 19-805), Illinois (765 ILCS 1060), Minnesota (Minn. Stat. §181.78), North Carolina (G.S. §66-57.1), and Washington (RCW 49.44.140). These statutes void IP assignments that cover inventions created entirely on the employee's own time without company resources and unrelated to the employer's business or anticipated business. If the user is in one of these states, note the protection explicitly.
- Even in states without explicit IP protection statutes, employers cannot assign work that is entirely unrelated to the business and created without company resources -- but the employee bears the burden of proving this.

---

### Step 4: Review Termination and Separation Provisions

These provisions define the user's downside risk and are often given insufficient attention during the excitement of a new offer.

- **At-will vs. term employment:** Most U.S. private employment is at-will, meaning the employer can terminate for any non-discriminatory reason at any time. A contract that specifies a term of employment (e.g., "a 2-year initial term") significantly limits at-will termination -- but verify whether the contract contains a "notwithstanding the foregoing, this agreement may be terminated at-will" clause that effectively overrides the term, which is a common drafting contradiction.
- **For-cause definition:** In contracts that require cause for termination, the definition of "cause" is everything. Narrow definitions (felony conviction, material breach of the agreement, willful misconduct) protect the employee. Broad definitions ("conduct that the Company reasonably believes is detrimental to its interests," "failure to meet performance objectives") give the employer substantial discretion and reduce the practical protection of for-cause requirements.
- **Good reason / constructive dismissal:** "Good reason" provisions allow the employee to resign and claim severance by treating a resignation as effectively a termination. Triggers typically include: material reduction in salary (usually defined as >10-15%), material diminution of duties, forced relocation beyond a specified distance (typically 50 miles), and change of control followed by material changes. Good reason provisions are more common in senior roles. If present, note the notice-and-cure process (typically the employee must give 30 days' notice of the good reason event, the employer has 30 days to cure, and if not cured, the employee can resign within 30 days of the cure period expiration).
- **Severance:** At-will employees have no legal entitlement to severance beyond final wages unless the contract specifies it. Contractual severance is valuable and worth negotiating. Market benchmarks: 1-2 weeks per year of service for non-executives; 3-6 months for director-level; 6-12 months for VP-level. Note whether severance is conditioned on signing a release of all claims -- it almost always is. The user should understand this trade-off: accepting severance typically means releasing wrongful termination and discrimination claims.
- **WARN Act:** For employers with 100+ employees, the federal WARN Act requires 60 days' notice before mass layoffs or plant closings. Some states (California, New York, New Jersey) have mini-WARN Acts with lower employee thresholds or longer notice periods. The contract may address this indirectly through termination notice provisions.
- **Garden leave:** Common in financial services and more senior technology roles. During the garden leave period, the employee remains on payroll but cannot work for a competitor. Garden leave effectively extends the non-compete period while paying the employee -- it is more employee-friendly than an unpaid non-compete. Massachusetts law specifically recognizes garden leave as the preferred mechanism for compensating employees during non-compete periods.
- **Post-employment obligations:** Flag provisions that require cooperation with litigation ("you agree to cooperate with the Company in any legal proceeding upon request") -- these can create ongoing obligations to participate in depositions, investigations, or litigation at the former employer's request, potentially interfering with new employment. Note whether the employer must reimburse the employee's reasonable expenses for such cooperation.

---

### Step 5: Review Dispute Resolution Provisions

This section is routinely overlooked but shapes the user's practical ability to enforce their rights.

- **Mandatory arbitration clauses:** A binding arbitration clause requires the employee to resolve employment disputes through a private arbitration process rather than court. Arbitration eliminates jury trials (generally favorable for employees in discrimination cases), limits discovery, limits appeal rights, and often involves arbitrators who may have institutional relationships with repeat-player employers. Note: under the Ending Forced Arbitration of Sexual Assault and Sexual Harassment Act of 2022, employees may not be forced to arbitrate sexual harassment and assault claims -- this federal exception applies regardless of what the contract says.
- **Class action waiver:** Often paired with arbitration. Prohibits the employee from joining collective actions (e.g., wage and hour class actions). The NLRA creates some carve-outs, but these are complex.
- **Choice of law and forum selection:** The contract may specify that disputes are governed by Delaware law in Delaware courts even if the employee works in California. Courts in the employee's home state can override choice-of-law provisions that conflict with fundamental public policy -- but this requires litigation to establish. Flag significant divergences between the governing law state and the employee's work state.
- **Attorney fee shifting:** Standard U.S. practice is each party bears its own fees (the "American rule"). A clause requiring the losing party to pay the winner's fees disproportionately chills employee litigation -- a wrongfully terminated employee risks owing six figures in attorney fees if the claim fails. Flag this as high concern.
- **Modification and integration clauses:** An integration (merger) clause states that the written agreement is the entire agreement and supersedes all prior representations. This means verbal promises made during recruiting (equity, title, promotion timeline) are unenforceable if not in writing. Flag this and advise the user to ensure all material promises made during recruiting are included in the written documents.

---

### Step 6: Identify Negotiation Leverage Points and Frame Discussion Strategies

Based on the analysis, identify specific provisions worth discussing and frame them using language that is professional and non-adversarial.

- Assess leverage by position level. Senior hires (Director and above, total comp above $200K) have leverage on nearly everything. Mid-career hires have leverage on: non-compete scope, IP carve-outs, vesting acceleration, and signing bonus structure. Entry-level hires have least leverage but can ask about: start date, signing bonus, and remote work flexibility.
- Assess leverage by talent market conditions. Highly specialized roles (AI/ML engineers, certain clinical specialists, niche finance professionals) retain leverage even in weaker hiring markets.
- Frame negotiation items as market alignment: "I noticed the non-compete covers the entire technology industry -- I've seen other offers in this field narrow this to direct competitors. Would the company be open to that adjustment?" avoids adversarial framing.
- Non-compete scope reduction (direct competitors in specific sector vs. entire industry) is routinely granted when asked professionally.
- IP assignment carve-outs for specific listed prior projects are routinely granted -- the prior inventions schedule exists precisely for this purpose.
- Signing bonus repayment from cliff to prorated is frequently achievable.
- Equity exercise window extension (90 days to 1-2 years post-departure) is increasingly common at well-capitalized companies and frequently granted when asked.
- Adding severance for termination without cause (even 2-3 months base salary) is achievable for senior hires in many cases.
- Double-trigger acceleration on equity is achievable for Director+ hires.

---

### Step 7: Generate Structured Questions for Attorney Review

The user is not an attorney and should not make legal conclusions from this analysis. Structure attorney questions to be specific, answerable, and prioritized.

- Prioritize questions that require jurisdiction-specific legal knowledge (non-compete enforceability, IP assignment statutes, consideration requirements for mid-employment agreements).
- Frame questions around the user's specific facts ("Does this non-compete's 'entire technology industry' scope comply with Massachusetts law given my role?") rather than general legal questions.
- Include one question per significant red flag identified.
- Add a question about any provision the user specifically expressed concern about.
- Recommend the user bring a printed copy of the full agreement (all referenced documents) to the attorney consultation.

---

## Output Format

```
## Employment Agreement Analysis: [Position Title] at [Company Name]
**Document Type:** [Offer Letter / Employment Contract / Both]
**Jurisdiction:** [State where employee will work]
**Position Level:** [Entry / Mid-Career / Senior / Executive]
**Analysis Date:** [Date]

---

### Section 1: Compensation Summary

| Component | Terms as Written | Expected Annual Value | Key Conditions | Flag |
|-----------|-----------------|----------------------|----------------|------|
| Base salary | $[X]/year, [pay frequency] | $[X] | [Exempt/non-exempt; review schedule] | [None / Review] |
| Bonus | [X]% target / $[X] target | $[X] at target | [Guaranteed vs. discretionary; proration; payment date requirement] | [None / Review / High] |
| Equity | [Type]: [quantity] units | $[X] projected (note: [private = uncertain / public = calculable]) | [Vesting schedule; cliff; acceleration; exercise window] | [None / Review / High] |
| Signing bonus | $[X] | One-time | [Repayment structure: prorated vs. cliff; duration] | [None / Review / High] |
| 401(k) match | [X]% match up to [X]% of salary | ~$[X]/year | [Employer match vesting schedule] | [None / Review] |
| Health insurance | [Coverage level] | [N/A or premium contribution] | [Start date; gap analysis] | [None / Review] |
| PTO | [Accrual rate or unlimited] | [X days/year] | [Carryover; payout on departure; use-it-or-lose-it] | [None / Review] |
| **Estimated Total Year-1 Compensation** | | **$[X] -- $[X] range** | [Includes base + target bonus + equity year-1 vest; excludes uncertain upside] | |

---

### Section 2: Restrictive Covenants Analysis

| Covenant | Scope as Written | Duration | Geographic Reach | Concern Level | Basis for Concern |
|----------|-----------------|----------|-----------------|---------------|-------------------|
| Non-compete | [Exact scope description] | [X months/years] | [City / State / National / Global] | [Low / Medium / High / Critical] | [Overbroad scope / Jurisdiction may void / Consideration issue] |
| Client non-solicitation | [Scope: all clients vs. clients I served] | [X months/years] | [N/A] | [Low / Medium / High] | [Overbroad definition / Duration excessive] |
| Employee non-solicitation | [Scope: active solicitation vs. hiring] | [X months/years] | [N/A] | [Low / Medium / High] | [Passive hiring restriction problematic] |
| Confidentiality / NDA | [Definition of covered information] | [Duration / Perpetual] | [N/A] | [Low / Medium / High] | [Overly broad definition / No carve-outs] |
| IP assignment | [Scope: work hours / any time / company resources] | [During employment / Perpetual on covered work] | [N/A] | [Low / Medium / High / Critical] | [Covers personal projects / No prior inventions carve-out] |

---

### Section 3: Termination and Separation Summary

| Provision | Terms as Written | Concern Level | Notes |
|-----------|-----------------|---------------|-------|
| Termination basis | [At-will / For cause / Term employment] | [Low / Medium / High] | [Definition of cause if applicable] |
| Severance | [None / X weeks per year of service / X months guaranteed] | [Low / Medium / High] | [Release required; timing; conditions] |
| Notice period | [X days required by employee / employer] | [Low / Medium] | [Garden leave during notice?] |
| Good reason trigger | [Present / Absent; triggers if present] | [Low / Medium / High] | [Salary reduction threshold; relocation threshold; cure period] |
| Equity on termination | [Unvested forfeited / Acceleration provision] | [Low / Medium / High] | [Single vs. double trigger; post-departure exercise window] |
| Clawback provisions | [None / Signing bonus / Bonus / Equity] | [Low / Medium / High] | [Trigger events; gross vs. net; repayment schedule] |

---

### Section 4: Red Flags

| Priority | Provision | Issue Identified | Practical Impact on You |
|----------|-----------|-----------------|-------------------------|
| Critical | [Provision name] | [Specific concern] | [What this means for your career/finances] |
| High | [Provision name] | [Specific concern] | [What this means for your career/finances] |
| Medium | [Provision name] | [Specific concern] | [What this means for your career/finances] |

---

### Section 5: Negotiation Leverage Points

| Priority | Provision | Current Term | Market Benchmark | Suggested Discussion Approach |
|----------|-----------|-------------|------------------|-------------------------------|
| High | [Provision] | [Current language] | [What is typical at this level/industry] | [How to raise this professionally] |
| Medium | [Provision] | [Current language] | [What is typical] | [How to raise this professionally] |
| Low | [Provision] | [Current language] | [What is typical] | [Optional: raise only if other items are granted] |

---

### Section 6: Missing Documents to Request

The following documents are referenced in or typically accompany this agreement and should be reviewed before signing:
- [ ] [Document name, e.g., Proprietary Information and Inventions Agreement (PIIA)]
- [ ] [Document name, e.g., Equity Award Agreement and Equity Plan]
- [ ] [Document name, e.g., Employee Handbook (if incorporated by reference)]
- [ ] [Document name, e.g., Commission Plan or Variable Compensation Plan]

---

### Section 7: Questions for Your Employment Attorney

**Priority 1 -- Address Before Signing:**
1. [Specific question tied to a red flag or jurisdiction-specific issue]
2. [Specific question about enforceability of the non-compete in [state]]
3. [Specific question about IP assignment scope]

**Priority 2 -- Important but May Not Change Decision:**
4. [Specific question about termination/severance]
5. [Specific question about equity treatment]
6. [Specific question about another significant provision]

**Priority 3 -- Clarifying Questions:**
7. [Specific question about benefits or compensation structure]
8. [Specific question the user raised directly]

---

### Section 8: Jurisdiction Note

[State] has specific rules that apply to one or more provisions in this agreement:
- **Non-compete:** [Summary of state's specific rule, e.g., salary threshold, duration limit, garden leave requirement, or general unenforceability]
- **IP assignment:** [State statute protection if applicable, e.g., Cal. Labor Code §2870]
- **Non-solicitation:** [Any state-specific limitations]
- **Other:** [Any additional jurisdiction-specific considerations]

These rules may significantly affect the enforceability of certain provisions. An employment attorney licensed in [state] can advise you on whether the specific language in your agreement complies with current law.

---
**Reminder:** This analysis is legal literacy education -- not legal advice. It identifies issues for discussion, not conclusions about your rights. Consult a qualified employment attorney before making decisions based on this analysis.
```

---

## Rules

1. **Always display the disclaimer before providing any substantive analysis.** Legal literacy is not legal advice -- this distinction must be visually and verbally reinforced at the start of every output.

2. **Never state whether a specific clause is enforceable or unenforceable.** Enforceability is a legal conclusion that depends on jurisdiction, facts, contract interpretation, and case law. Instead, state whether a clause "may face enforceability challenges under [state] law" or "has been the subject of litigation in [state]" and recommend attorney review.

3. **Never advise the user to accept or reject a job offer.** The analysis informs the decision -- it does not make it. Financial, personal, career, and risk tolerance factors are beyond the scope of this skill.

4. **Never draft or suggest specific contract language revisions.** Recommending the user "change the non-compete to read..." crosses into legal drafting, which requires licensed counsel. Instead, describe what a narrower or more employee-friendly version of a provision typically covers and suggest discussing this with an attorney.

5. **Flag the prior inventions schedule (or its absence) for every knowledge worker.** For any user in a technology, research, creative, or engineering role, the absence of a prior inventions exhibit is a critical issue -- not a minor detail. Treat it as high priority in the analysis regardless of whether the user mentions it.

6. **Distinguish offer letters from employment contracts in every analysis.** An offer letter analysis must note that binding terms typically appear in separate documents (PIIA, Equity Plan, Employee Handbook) that the user must request and review before signing.

7. **Quantify financial impact wherever possible.** "The bonus is discretionary" is less useful than "A 15% discretionary bonus on $180,000 = $27,000 annually that the employer has no legal obligation to pay." Real numbers make abstract risks concrete.

8. **Note the release-of-claims trade-off whenever severance is discussed.** Severance conditioned on signing a general release means the employee is waiving litigation rights -- potentially including rights to bring future discrimination or wrongful termination claims -- in exchange for payment. Users systematically underweight this trade-off and it must be made explicit.

9. **Never make equity value projections for private companies without prominent uncertainty caveats.** Private company equity has zero liquid value until a qualifying exit event. Projections based on last-round valuation or stated strike price can be wildly misleading. Frame private equity as "potential upside contingent on a liquidity event" -- not as earned compensation.

10. **Use concern levels (Low / Medium / High / Critical) consistently and define them.** Low = standard provision, no material concern. Medium = outside market norms or contains conditions worth understanding. High = could materially limit career mobility or financial position; requires attorney discussion. Critical = may be unenforceable, exposes user to significant financial risk, or could result in loss of employment if misunderstood.

11. **Do not perform jurisdiction analysis without explicitly noting the state the employee will work in.** Company state of incorporation is irrelevant to restrictive covenant enforceability -- the employee's work state controls. Always verify this distinction.

12. **Flag mandatory arbitration and class action waiver clauses as a distinct category.** These provisions directly limit the user's legal remedies and should be identified even if they do not appear in the restrictive covenants section of the agreement.

---

## Edge Cases

### Offer Letter With No Formal Employment Contract
Many technology and startup employers issue offer letters as the sole written pre-employment document, with all restrictive covenants in a separate PIIA signed on day one. Critically, the user may not have seen the PIIA yet. Explain that: (a) the offer letter is binding on salary, title, start date, and often at-will status; (b) the PIIA and equity documents will impose IP assignment and potentially non-compete obligations that are separate from the offer letter; (c) the user should request a copy of the PIIA and Equity Plan before signing the offer letter if at all possible. Some employers resist this request -- if so, the user should negotiate for the right to review PIIA terms before their first day and understand that they may be asked to sign comprehensive restrictive covenants as a condition of employment on day one.

### Mid-Employment Signature Request (New Agreement or Amendment)
When an employer asks a current employee to sign a new or revised employment agreement -- often adding or tightening non-compete or IP assignment provisions -- the consideration question is paramount. In most states, continued employment is sufficient consideration for a new agreement. However, Illinois, Minnesota, Massachusetts, Oregon, and Washington require additional consideration (a promotion, raise, bonus, or other tangible benefit) for mid-employment non-competes. The timing is also legally significant: some states require a meaningful opportunity to review the agreement before signing. Frame this as a Priority 1 attorney question. Additionally, flag that the employee does not have a legal obligation to immediately sign a mid-employment agreement presented without explanation -- it is reasonable to ask for time to review and consult an attorney.

### Remote Work With Multi-State Exposure
A user who lives in California but is hired by a company headquartered in New York with a Delaware-choice-of-law clause presents a classic multi-state analysis problem. The analysis should note: (a) the choice-of-law clause will be assessed by courts in the state where litigation occurs; (b) California courts have consistently applied California law to protect California workers from non-competes regardless of choice-of-law clauses; (c) if the user works remotely from California, California law will likely apply to the non-compete regardless of what the contract says; (d) however, the IP assignment and confidentiality provisions will still be enforced under the terms of the agreement unless California law provides specific contrary protections. Remote workers who move states after signing should understand that applicable law may shift with their move.

### Competing Offers Side-by-Side Comparison
When the user has two or more offers and wants a comparison, build a side-by-side table that covers: total Year-1 guaranteed compensation (base + guaranteed bonus); total target compensation (base + target bonus); equity value (with significant uncertainty caveats for private company equity); restrictive covenant burden score (Low / Medium / High based on non-compete scope, IP assignment reach, and non-solicitation breadth); benefits gap analysis; and termination downside (severance if any, garden leave, equity treatment on termination). Note that total compensation comparisons between public and private company equity are inherently apples-to-oranges -- a public RSU is liquid value; a startup option is a contingent right to uncertain upside. Help the user understand what they are comparing rather than presenting a false precision total comp number.

### International Assignment or Foreign Contract
Employment law varies so dramatically across jurisdictions that substantive analysis of an international contract requires country-specific counsel. What this skill can do: flag that most EU countries require written notice before termination (EU Labor Framework Directive), that many EU countries mandate statutory severance, that non-compete enforcement in Germany typically requires Karenzentschädigung (compensation equal to at least half the employee's prior compensation during the non-compete period), and that the UK Retained EU Law framework has modified some prior EU-derived worker protections. For international agreements, the appropriate output is a clear list of jurisdiction-specific questions for a cross-border employment attorney, not a substantive enforceability analysis.

### Severance Agreement Presented at Departure (Not New Employment)
This situation falls outside this skill's scope but users sometimes present it. A severance agreement signed at departure is different in kind from an employment contract: (a) it is usually exchanging severance payment for a release of all legal claims against the employer; (b) ADEA waivers (for employees 40 and older) require 21 days to consider and 7 days to revoke under the Older Workers Benefit Protection Act; (c) the release language is the most important provision and requires attorney review if any potential discrimination, retaliation, or wage claims exist. Redirect users to the `severance-agreement-review` skill or directly to an employment attorney for severance agreements signed at departure.

### User Is an H-1B or Other Work Visa Holder
The employment agreement has additional significance for visa holders because termination of employment typically initiates an immigration status clock. Specifically: termination of H-1B employment triggers a 60-day grace period before the visa holder must depart, change status, or find a new sponsoring employer. The employment contract's at-will status and termination provisions directly affect immigration stability. Flag this as a Priority 1 attorney issue for any user who identifies as a work visa holder. Additionally, non-compete enforcement considerations may weigh differently for visa holders whose job search universe is already constrained by visa sponsorship requirements.

### Agreement Contains an Entire Agreement / Integration Clause With Oral Promise Discrepancy
If the user mentions that verbal commitments were made during recruiting (a title upgrade in 6 months, equity above what is written, a specific project assignment) that do not appear in the written agreement, flag this as a Critical issue. An integration clause will render those verbal promises unenforceable if they are not reflected in the written agreement. The user should request that all material oral promises be reduced to writing and included as amendments or addenda before signing. The employer's response to this request -- whether accommodating or dismissive -- is itself informative about how the employer is likely to honor informal commitments post-hire.

---

## Example

**User Input:** "I received a formal employment contract for a Staff Software Engineer role at a Series C startup in Boston. Base salary is $195,000, 10% discretionary annual bonus, and 40,000 ISOs vesting over 4 years with a 1-year cliff. $20,000 signing bonus that I have to pay back in full if I leave in the first 12 months, or repay 50% if I leave between months 12 and 18. The contract has a 2-year non-compete covering 'any business that develops or sells software products competitive with the Company's current or reasonably anticipated products,' a non-solicitation of employees for 2 years, an IP assignment that covers all inventions conceived during employment whether or not on company time, and mandatory arbitration. No severance provision. I'm in Massachusetts and I have two open-source projects I work on evenings and weekends."

---

## Employment Agreement Analysis: Staff Software Engineer at [Series C Startup]

**Document Type:** Formal Employment Contract
**Jurisdiction:** Massachusetts (employee work location)
**Position Level:** Senior Individual Contributor (Staff Engineer)
**Analysis Date:** [Current Date]

---

### Section 1: Compensation Summary

| Component | Terms as Written | Expected Annual Value | Key Conditions | Flag |
|-----------|-----------------|----------------------|----------------|------|
| Base salary | $195,000/year | $195,000 | Confirm pay frequency; verify exempt classification | None |
| Bonus | 10% target, discretionary | $19,500 at target | Discretionary -- no legal obligation to pay; confirm payment date employment requirement and proration terms | Review |
| Equity | 40,000 ISOs | Uncertain (private company) | 4-year vest, 1-year cliff; strike price at 409A FMV; confirm post-departure exercise window (likely 90 days -- ask about extension); check AMT exposure on exercise | High |
| Signing bonus | $20,000 | One-time | Cliff repayment: 100% before month 12, 50% months 12-18. If you leave at month 13, you owe $10,000. Structure is reasonably common but cliff is not prorated | Review |
| **Estimated Total Year-1 Guaranteed Compensation** | | **$215,000** | Base + signing bonus; bonus is not guaranteed; equity has no liquid value at this time | |
| **Estimated Total Year-1 Target Compensation** | | **$234,500** | Adds 10% target bonus; equity excluded from this figure as it has no liquid value until exit event | |

**Equity Note:** 40,000 ISOs at a Series C startup have real potential upside but zero guaranteed value. If the company's last 409A valuation set the strike price at, for example, $3.00/share and the company ultimately exits at $10.00/share, the theoretical pre-tax spread is $280,000 -- but this requires a liquidity event, continued employment through vesting, and sufficient time to exercise. Treat equity as potential upside, not as current compensation. Confirm whether ISOs or NSOs -- if the grant value exceeds $100,000 at the time of vesting in any calendar year, the excess is automatically treated as NSOs with less favorable tax treatment.

---

### Section 2: Restrictive Covenants Analysis

| Covenant | Scope as Written | Duration | Geographic Reach | Concern Level | Basis for Concern |
|----------|-----------------|----------|-----------------|---------------|-------------------|
| Non-compete | "Any business that develops or sells software products competitive with the Company's current or reasonably anticipated products" | 2 years post-employment | Implied global / national (no geographic limit stated) | **Critical** | No geographic limitation; "reasonably anticipated products" is extremely broad and subjective; 2 years is at the outer edge of enforceability; Massachusetts 2018 Act compliance is uncertain |
| Employee non-solicitation | Scope not fully specified in summary -- confirm whether it bars active solicitation or passive hiring | 2 years | N/A | High | 2 years is above market norm; if it bars passive hiring, it may face enforceability challenge in Massachusetts |
| Client non-solicitation | Not mentioned in summary -- confirm whether present in full document | Unknown | N/A | Review needed | Request clarification |
| Confidentiality | Not detailed in summary -- confirm scope and carve-outs | Not specified | N/A | Review needed | Confirm whether general skills carve-out is present |
| IP assignment | "All inventions conceived during employment whether or not on company time" | Perpetual on covered work | N/A | **Critical** | No resource or relevance limitation; directly threatens your open-source projects by its plain language; Massachusetts does not have an explicit IP protection statute (unlike California, Illinois, Washington), though general principles may limit overreach |

---

### Section 3: Termination and Separation Summary

| Provision | Terms as Written | Concern Level | Notes |
|-----------|-----------------|---------------|-------|
| Termination basis | At-will (Massachusetts default) | Medium | No contractual protection; employer can terminate for any non-discriminatory reason at any time |
| Severance | None | High | No contractual severance -- on termination without cause you receive only final wages; this is negotiable and worth raising for a Staff-level hire |
| Equity on termination | Not detailed -- unvested ISOs presumably forfeited | High | Confirm whether there is any single or double-trigger acceleration; confirm post-departure exercise window (standard 90 days is punitive for private company ISOs -- exercise cost + AMT risk with no liquid market) |
| Signing bonus clawback | 100% before month 12; 50% months 12-18 | Medium | Structure is standard; note that if you are involuntarily terminated without cause before month 12, you should negotiate that the repayment obligation is waived -- the contract as described may require repayment even on employer-initiated termination |
| Bonus clawback | None described | None | Confirm absence |
| Garden leave | Not mentioned | Medium | Massachusetts non-compete law favors garden leave as the mechanism for compensating employees during non-compete periods -- its absence creates uncertainty about whether the non-compete satisfies MA Act requirements |

---

### Section 4: Red Flags

| Priority | Provision | Issue Identified | Practical Impact on You |
|----------|-----------|-----------------|-------------------------|
| Critical | Non-compete scope | No geographic limitation; "reasonably anticipated products" standard has no fixed boundary; 2-year duration is at the outer limit of Massachusetts enforceability | You could be effectively prohibited from working as a software engineer at virtually any technology company for 2 years after departure. Massachusetts law requires the non-compete to be no broader than necessary to protect a legitimate business interest -- this scope may not meet that standard |
| Critical | IP assignment + open-source projects | "All inventions conceived during employment whether or not on company time" -- by its plain language, your existing and future open-source projects may be claimed by the employer as company property | Your evening and weekend open-source work could be assigned to the company. You need to list your existing projects on the prior inventions exhibit before signing, and negotiate a carve-out for personal projects not using company resources and unrelated to the company's business |
| Critical | Massachusetts Non-Compete Act compliance | The 2018 MA Noncompetition Agreement Act requires: (1) the agreement be provided at least 10 business days before the start date; (2) the agreement must advise the employee to consult an attorney; (3) the employee must receive garden leave pay (at least 50% of base during the restricted period) or other mutually agreed consideration. It is unclear whether this agreement complies | If the agreement does not comply with the MA Act, it may be unenforceable in its entirety -- but you should not rely on this without attorney confirmation |
| High | No severance provision | At a Series C startup with at-will employment, you have zero contractual protection against termination without cause at any time | One of the most common sources of financial harm in startup employment is termination without cause before meaningful equity vests. Even 2-3 months of severance for termination without cause would significantly improve your downside risk position |
| High | Signing bonus repayment on involuntary termination | The described clawback does not appear to distinguish between voluntary departure and employer-initiated termination without cause | If you are laid off in month 6, you may owe $20,000 back to the company that terminated you. This is an unreasonable outcome and should be negotiated out -- repayment should apply only to voluntary departure, not involuntary termination without cause |
| High | ISO exercise window | Standard 90-day post-departure exercise window is implied but not confirmed | If you leave before the company exits and hold ISOs, you must pay the strike price for all vested options within 90 days or forfeit them. For 40,000 ISOs at a $3.00 strike price, this means $120,000 cash plus potential AMT exposure. Request an extended exercise window of 1-5 years |
| Medium | Mandatory arbitration | Disputes must be resolved through private arbitration rather than in court | Eliminates jury trial for employment disputes; limits discovery and appeal; generally favors repeat-player employers in procedural experience. Sexual harassment and assault claims are now excluded from mandatory arbitration under federal law |
| Medium | "Reasonably anticipated products" in IP assignment | Same overbreadth problem as in the non-compete -- the company's anticipated products could be defined expansively | An employer in a broad software sector could claim ownership of tangentially related side projects as "anticipated products" |

---

### Section 5: Negotiation Leverage Points

| Priority | Provision | Current Term | Market Benchmark for Staff SWE | Suggested Discussion Approach |
|----------|-----------|-------------|--------------------------------|-------------------------------|
| High | Non-compete scope | Any competitive software business, globally, 2 years | Direct competitors in specific product category, 6-12 months, with geographic limitation | "I want to make sure I understand and can commit to this restriction. I've seen agreements narrow this to direct competitors in [specific sector] for 12 months -- would that work here?" |
| High | IP assignment personal project carve-out | All inventions during employment, any time | Inventions using company resources or related to company's business only; prior inventions list for existing projects | "I have two open-source projects I'd like to list on the prior inventions exhibit and get explicit agreement that my continued work on those won't be covered by this clause." |
| High | MA Non-Compete Act compliance |
