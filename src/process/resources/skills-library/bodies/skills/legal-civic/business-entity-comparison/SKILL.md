---
name: business-entity-comparison
description: |
  Compares business entity types (sole proprietorship, LLC, S-Corp, C-Corp, partnership) across liability protection, taxation, formation requirements, and ongoing compliance. Produces a structured comparison table based on the user's business situation to inform their conversation with an attorney or accountant.
  Use when the user is starting a business and wants to understand entity options, wants to compare LLC vs corporation, or needs to prepare for a consultation with a business attorney about entity selection.
  Do NOT use for entity formation filing, tax preparation, legal advice on which entity to choose, or multi-state or international entity structuring.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy entrepreneurship guide checklist"
  category: "legal-civic"
  subcategory: "business-legal"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---
# Business Entity Comparison

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you. Tax thresholds, filing fees, and compliance requirements referenced in this skill are current as of the skill's creation date and must be independently verified.

---

## When to Use

**Use this skill when:**
- A user is in the early stages of starting a business and needs to understand what entity structure options exist before they speak with a professional
- A user wants to compare LLC vs. corporation and understand the actual mechanical differences in liability treatment, taxation, and compliance burden
- A user has heard terms like "S-Corp election," "pass-through taxation," or "piercing the corporate veil" and wants to understand what they mean in practice
- A user is preparing for a first meeting with a business attorney or CPA and wants to arrive with informed, specific questions rather than starting from zero
- A user already operates as a sole proprietorship and is wondering whether they have outgrown that structure (common trigger: revenue exceeds $50,000-$80,000/year, or they have taken on their first significant client contract)
- A user is evaluating whether to add a business partner and needs to understand how different structures handle multi-owner scenarios
- A user has been advised by an accountant to "consider an S-Corp" and wants to understand what that actually means before agreeing

**Do NOT use when:**
- The user wants to actually file formation documents -- this requires state-specific forms, current fees, and procedural knowledge that a professional or state agency portal should handle (use a state-specific formation resource or refer to the Secretary of State's website)
- The user needs tax preparation, estimated tax calculations, or wants to know their actual payroll tax savings -- these require their specific financials and a licensed CPA or enrolled agent
- The user wants a definitive recommendation on which entity is "right" for them -- this skill produces an informed framework, not a conclusion; always refer to an attorney and tax professional for the actual decision
- The user needs multi-state formation strategy, foreign entity qualification in multiple states, or international business structuring -- this requires specialized transactional counsel
- The user is asking about entity dissolution, merger, acquisition, or conversion of an existing entity -- these are distinct legal events with significant tax consequences (refer to transactional/M&A counsel)
- The user's primary question is about employment classification, hiring contractors vs. employees, or HR compliance -- use `employment-law-basics`
- The user is asking about nonprofit formation (501(c)(3) or other exempt status) -- nonprofit entity structure is a distinct topic with entirely different formation, governance, and tax rules

---

## Process

### Step 1: Gather the User's Business Context

Before generating any comparison, collect the following information. Each variable materially changes which entity types are relevant and how to weight the trade-offs. Ask all of these in a single conversational turn rather than one at a time:

- **Business type and activity:** What does the business actually do? Freelance/consulting, retail, SaaS/tech, real estate investment, professional services (law, medicine, architecture), food and beverage, construction/trades. The nature of the business determines liability exposure profile.
- **Number of owners (members/shareholders):** Solo, two-person partnership, or larger group? This affects which entities are available and which are practical.
- **Expected annual gross revenue and net income:** Distinguish between gross and net if possible. The S-Corp payroll tax analysis is based on net profit, not revenue. Revenue ranges: under $30K, $30K-$80K, $80K-$150K, $150K-$500K, over $500K.
- **Will the business have W-2 employees** (separate from owner-employees)?
- **Will the business seek outside investment?** Venture capital, angel investors, or SBA/bank financing? VC and institutional investors have strong structural preferences.
- **What state will the business be formed and operated in?** Formation fees, franchise taxes, annual report fees, and state income tax treatment vary enormously. California's $800 minimum franchise tax is not the same as Colorado's $10 annual report fee.
- **Does the user or any owner work in a licensed profession?** Some states require professionals (doctors, attorneys, architects, CPAs) to use a Professional Corporation (PC) or Professional Limited Liability Company (PLLC), which are distinct from a standard LLC or C-Corp.
- **Timeline:** Are they starting from scratch or converting an existing informal business?

### Step 2: Explain the Five Primary Entity Types with Specificity

Present each entity type with its actual mechanical operation, not just labels. The goal is to give the user enough understanding to hold a productive professional conversation.

**Sole Proprietorship**
- No state filing is required. The business and the owner are the same legal person. This is the default status when any individual does business without forming an entity.
- All business income flows to Schedule C of the owner's Form 1040. Net Schedule C income is subject to self-employment (SE) tax at 15.3% on the first $160,200 (2023 threshold, adjusted annually for inflation) and 2.9% above that, in addition to regular income tax. The owner may deduct half of SE tax paid as an above-the-line deduction.
- **Liability:** There is no legal separation between the owner's business and personal assets. A client who sues the business can reach the owner's personal bank accounts, home equity, and other assets. There is no "veil" to pierce because none exists.
- **Formation cost:** Essentially zero at the state level. A DBA ("doing business as") or trade name registration may be required if operating under a name other than the owner's legal name -- typically $10-$100 at the county or state level.
- **Ongoing compliance:** File Schedule C with annual Form 1040. No annual reports, no separate entity tax return, no meeting minutes.
- **When it is appropriate:** Very early stage businesses testing viability; extremely low-risk, low-revenue activities (arts and crafts sales, babysitting); situations where simplicity outweighs protection. Most business attorneys do not recommend this structure for any business with meaningful revenue or client-facing professional risk.

**General Partnership**
- Exists by default when two or more people operate a business together without forming an entity. No filing required.
- **Liability:** Joint and several -- every partner is fully and personally liable not only for their own actions but for the actions of any other partner taken in the ordinary course of business. If Partner A makes a negligent business decision that costs a client $500,000, Partner B's personal assets are equally at risk. This is the most dangerous default structure in business law.
- **Taxation:** The partnership files an informational return on IRS Form 1065 and issues Schedule K-1 to each partner, who reports their distributive share on their personal return. Self-employment tax applies to each partner's share of net income.
- **Formation:** No state filing required for a general partnership to exist, but a written partnership agreement is essential -- it defines ownership percentages, profit and loss allocation, decision-making authority, what happens when a partner wants to exit, and dissolution procedure. Operating without one is the most common source of small business litigation.
- **Ongoing compliance:** Form 1065 (informational partnership return) annually. Following the partnership agreement terms.
- **Recommendation context:** General partnerships are rarely advisable in modern practice. The unlimited mutual liability makes this structure an accidental trap for business partners who simply start working together without formalizing. The standard professional recommendation is to form an LLC instead, which provides the same flexible tax treatment with liability protection.

**Limited Liability Company (LLC)**
- The LLC is a statutory entity created by state law. Every state has an LLC act, but the rules vary. The LLC is the most popular small business entity in the U.S. because it combines liability protection, tax flexibility, and relatively low compliance burden.
- **Liability protection -- the corporate veil:** Members' personal assets are generally shielded from LLC debts and judgments. However, the veil has conditions. Courts will "pierce the corporate veil" and hold members personally liable if: (a) the member personally guaranteed a loan or obligation; (b) the member commingled personal and business funds (using the same bank account, paying personal expenses from the business account); (c) the LLC was inadequately capitalized for the risks of its business; (d) the LLC was used to commit fraud; or (e) in some jurisdictions, the member treated the LLC as their alter ego (no separate records, no operating agreement observed). Maintaining veil protection requires a separate business bank account, EIN, consistent use of the LLC name in contracts and invoices, and observing the Operating Agreement.
- **Taxation -- the default rules:** A single-member LLC is a "disregarded entity" for federal tax purposes -- it files as a sole proprietorship on Schedule C (or Schedule E for rental income). A multi-member LLC is taxed as a partnership -- it files Form 1065 and issues K-1s. In both cases, all net income passes through to the members and is subject to self-employment tax.
- **Taxation -- elections available:** An LLC can elect to be taxed as a C-Corp by filing Form 8832, or as an S-Corp by filing Form 2553 (after first electing or defaulting into corporate tax treatment). This tax flexibility is the LLC's defining structural advantage over other entity types.
- **Formation:** File Articles of Organization (sometimes called a Certificate of Formation) with the Secretary of State. Costs by state vary widely: Delaware ($90), Wyoming ($100), Colorado ($50), California ($70 filing fee + $800 minimum franchise tax starting year one), Texas ($300), New York ($200 + publication requirement in some counties that can cost $500-$2,000). An Operating Agreement governs internal relations and should always be drafted regardless of whether the state requires it.
- **Ongoing compliance:** Annual reports in most states ($10-$800). Some states impose minimum franchise taxes on LLCs regardless of income (California: $800/year; Massachusetts: $500/year; Tennessee: franchise/excise taxes based on capital or income). Registered agent required in all states (in-state agent or registered agent service typically $50-$300/year if using a service).
- **Best for:** Most small businesses with 1-20 owners, solo service providers wanting liability protection, real estate holding, businesses with moderate complexity. The LLC is the correct default recommendation to evaluate first for most small business scenarios.

**S-Corporation (S-Corp)**
- The S-Corp is not a separate entity type -- it is a federal income tax election available to either a corporation or an LLC. The entity is formed as a standard corporation (by filing Articles of Incorporation) or as an LLC, and then the S-Corp election is made by filing IRS Form 2553, which must be signed by all shareholders/members and submitted by March 15 of the tax year for which the election is to apply (or within 75 days of formation for new entities).
- **The payroll tax savings mechanism:** The core S-Corp benefit is the ability to split business income into two components: (1) a W-2 salary to the owner-employee, subject to FICA payroll taxes (Social Security 6.2% + Medicare 1.45% = 7.65% employee side; employer matches, so total cost is 15.3% up to the Social Security wage base), and (2) distributions from the entity, which are not subject to self-employment tax or FICA. A sole proprietor or default-taxed LLC member pays SE tax (15.3%) on all net business income. An S-Corp owner pays FICA only on the salary portion.
- **The "reasonable salary" requirement:** The IRS requires that owner-employees of an S-Corp pay themselves a "reasonable" or "reasonable and necessary" salary before taking distributions. The IRS has successfully challenged S-Corps that paid minimal salaries to avoid payroll tax. The reasonable salary is determined by what the market would pay for that role -- documented through industry wage data (Bureau of Labor Statistics data, comparable job postings, RCReports or similar tools that CPAs use). Underpaying on salary to maximize distributions is an audit risk.
- **Break-even analysis:** The S-Corp structure adds complexity and cost: payroll processing ($500-$2,000/year for a payroll service), separate business tax return (Form 1120-S, which a CPA may charge an additional $500-$1,500 to prepare beyond a personal return), state S-Corp recognition (some states do not recognize the S-Corp election and tax the entity as a C-Corp at the state level -- New York City being a prominent example with its general corporation tax), and additional compliance. The payroll tax savings only make sense if they exceed these costs. A rough rule of thumb used by CPAs: S-Corp election typically makes financial sense when net business income exceeds $50,000-$80,000 per year, but this threshold shifts based on state, salary level, and CPA fees. This calculation must be done by a tax professional for the specific situation.
- **S-Corp eligibility restrictions:** Maximum 100 shareholders. All shareholders must be U.S. citizens or permanent residents (green card holders qualify; visa holders generally do not). Only one class of stock permitted (all shares have identical economic rights, though voting vs. non-voting shares are allowed). Cannot be owned by a C-Corp, another S-Corp (with narrow exceptions), partnership, LLC, or most trusts. These restrictions make S-Corps unsuitable for businesses seeking institutional investment or complex equity structures.
- **Best for:** Profitable service businesses with a single owner or small number of owners, businesses generating $80,000-$500,000+ in net income where the owner works in the business and can justify a reasonable salary, and businesses that do not need complex equity structures.

**C-Corporation**
- A C-Corp is a fully separate legal entity with its own perpetual existence, owned by shareholders, managed by a board of directors, and operated by officers. It is the oldest and most legally developed corporate form in the U.S. and the foundation of modern capital markets.
- **Liability:** Strong entity-level liability protection. Shareholders, directors, and officers are generally not personally liable for corporate debts or obligations. Exceptions include personal guarantees, "alter ego" liability in cases of corporate formality failures, and director/officer liability for specific statutory violations (payroll tax withholding, certain securities law violations).
- **Taxation -- double taxation:** The C-Corp files Form 1120 and pays federal corporate income tax at a flat 21% rate (as of the Tax Cuts and Jobs Act of 2017; subject to legislative change). When the corporation distributes profits to shareholders as dividends, those dividends are taxed again on the shareholder's personal return at qualified dividend rates (0%, 15%, or 20% depending on income level). This double layer of taxation is the primary ongoing disadvantage.
- **Offsetting factors for double taxation:** The double taxation concern is often overstated for businesses that intend to retain and reinvest profits rather than distribute them. If profits are reinvested for growth, they are taxed once at 21% (which may be lower than a high-income individual's marginal rate). Only upon distribution does the second layer apply. For venture-backed companies intending to grow and exit (acquisition or IPO), the exit may be structured as a stock sale, which converts double-tax concern into capital gains treatment. Additionally, owner-employees can receive compensation (salary, benefits, retirement contributions) as tax-deductible corporate expenses, reducing taxable corporate income.
- **The VC and investor preference:** Institutional investors (venture capital firms, private equity) almost universally require C-Corp structure, specifically Delaware C-Corps. Reasons include: (a) Delaware's sophisticated Court of Chancery and well-developed corporate law provides predictability; (b) convertible preferred stock -- the instrument VCs use to invest -- works cleanly in a C-Corp and awkwardly or not at all in an LLC or S-Corp; (c) employee stock option plans (ESOPs) and ISOs (Incentive Stock Options) are clean in a C-Corp structure; (d) future IPO registration requires C-Corp structure. For any business with a realistic venture capital path, C-Corp formation in Delaware is the standard.
- **Qualified Small Business Stock (QSBS) -- Section 1202:** C-Corp shareholders who hold stock for more than five years in a qualified small business may exclude up to $10 million (or 10x the investor's basis, whichever is greater) in capital gains from federal income tax upon exit. This is a significant benefit for startup founders and early investors that only applies to C-Corps. This is a reason some founders choose C-Corp even without immediate VC plans.
- **Formation:** File Articles of Incorporation. Adopt bylaws. Elect initial board of directors. Issue stock. File Form SS-4 for EIN. State fees: Delaware ($89 minimum + franchise tax), California ($100 filing + minimum franchise tax), Texas ($300), Colorado ($50).
- **Ongoing compliance:** Annual Form 1120 (corporate tax return), annual reports, board meeting minutes, shareholder meeting minutes, stock ledger maintenance. Corporate formalities are more demanding than LLC requirements. Failure to maintain formalities creates veil-piercing risk.
- **Best for:** Businesses seeking venture capital or angel investment, technology startups with equity compensation plans, businesses planning an IPO, businesses with significant retained earnings to reinvest, and companies where QSBS eligibility is valuable.

**Professional Corporation (PC) / Professional LLC (PLLC)**
- Many states require licensed professionals -- physicians, attorneys, CPAs, architects, engineers, therapists, real estate brokers -- to form a specialized entity type rather than a standard LLC or C-Corp. This varies by state and by profession.
- A PLLC operates similarly to a standard LLC for tax and liability purposes but typically limits ownership to licensed professionals in the relevant field and is subject to the licensing board's oversight.
- A Professional Corporation (PC) is similar to a standard corporation but may carry professional liability that passes through to the licensed professional who committed the malpractice (in some states, the PC does not fully shield professionals from their own malpractice).
- If the user is in a licensed profession, note this entity type and strongly recommend they confirm the specific requirements with a business attorney licensed in their state, as requirements vary significantly.

### Step 3: Identify the User's Primary Decision Factors

After presenting the entity types, identify which 2-3 factors are most material for this specific user. The primary decision axes are:

- **Liability exposure level:** High (construction, medical services, legal services, food service), moderate (general consulting, retail, software), or low (online content, very small-scale personal services). Higher exposure tilts toward entity formation even at low revenue.
- **Revenue and net income:** Under $50K net -- LLC default taxation is typically adequate. $50K-$80K net -- borderline for S-Corp analysis. Over $80K net -- S-Corp analysis is almost always worth having a CPA run the numbers. Over $500K net -- C-Corp retained earnings strategy may become relevant.
- **Investment and equity plans:** Any realistic venture capital or institutional investment path -- Delaware C-Corp. Angel/friend investment without institutional plans -- LLC or C-Corp both work.
- **Number of owners:** Single owner -- LLC is almost always cleanest starting point. Two or more -- operating agreement / shareholder agreement is critical regardless of entity type.
- **Industry-specific requirements:** Professional licensing, regulated industries (financial services, cannabis, healthcare) may have additional requirements that override pure structural analysis.

### Step 4: Generate the Tailored Comparison Table

Produce a comparison table that shows only the entity types that are actually relevant to the user's situation. Do not include C-Corp in the comparison for a solo freelancer with no investor plans -- it adds noise, not value. The table should have state-specific cost information when the user has provided their state.

Include in the table:
- Personal liability protection (None / Yes / Yes-with-conditions)
- Formation cost (dollar amounts specific to their state)
- Annual compliance cost (dollar amounts, broken into state fees + accounting + payroll if applicable)
- Federal tax treatment (Schedule C / K-1 pass-through / Salary + distributions / Corporate + dividends)
- Self-employment / payroll tax exposure (quantified where possible as a percentage or dollar range)
- Complexity level (relative scale)
- Outside investor suitability
- Estimated total year-1 cost including formation, annual fees, and accounting overhead

### Step 5: Quantify the S-Corp Trade-Off When Relevant

When the user's net income is in the range where S-Corp may matter ($50,000+), provide a structured illustration (not a tax calculation -- an illustration) of how the math works, using their stated income range. Frame it clearly as an illustration that their CPA must validate:

- Estimate SE tax on full net income under sole prop/default LLC
- Illustrate SE tax on salary component only under S-Corp (using a reasonable salary example for their industry)
- Show the approximate gross savings
- Subtract estimated additional compliance costs (payroll service, Form 1120-S preparation)
- Show the approximate net benefit range, with the caveat that the reasonable salary amount determines the actual savings

This illustration is the most valuable thing you can provide for users at this income range -- it gives them enough information to have a meaningful CPA conversation.

### Step 6: Address State-Specific Nuances

For the state the user provides, note:
- Current filing fee for LLC and corporation (verify these are accurate; note they change)
- Annual report fee
- Whether the state imposes a minimum franchise tax or gross receipts tax on LLCs (California $800, Massachusetts $500, Tennessee franchise/excise tax based on net worth or income, New Hampshire business profits tax, Texas margin tax for businesses over $1.18M gross receipts)
- Whether the state recognizes S-Corp election for state income tax purposes (most do; New York City does not for the NYC general corporation tax; some states impose their own S-Corp franchise taxes)
- Any state-specific LLC act features (Delaware's Chancery Court, Wyoming's single-member LLC charging order protection, Nevada's officer/director liability protections)
- Whether the state has a publication requirement for LLC formation (New York requires publication in two newspapers designated by the county clerk, which can cost $500-$2,000 depending on the county)

### Step 7: Produce the Professional Consultation Preparation Package

This is the output section with the highest practical value for the user. Produce:
- A structured list of questions for a business attorney, organized by topic
- A structured list of questions for a CPA or tax professional, organized by topic
- A checklist of documents and information to bring to those consultations
- A note on what to expect from each type of professional and roughly what each consultation typically costs ($150-$400/hour for a business attorney; $200-$400/hour for a CPA; flat-fee entity formation packages range from $500-$2,000 depending on complexity)

---

## Output Format

```
## Business Entity Comparison: [Business Type and State]

---

> **Disclaimer:** This comparison is educational information only and does not constitute legal or tax advice. Entity selection has significant legal and tax consequences. Always consult a business attorney and CPA licensed in your state before making this decision.

---

### Your Situation Summary

| Factor | Your Details |
|--------|-------------|
| Business type | [Description] |
| Owner structure | [Solo / Partners: number and relationship] |
| Expected annual gross revenue | [Range] |
| Expected annual net income | [Range, if provided or estimable] |
| Employees planned | [Yes / No / Unsure] |
| Outside investment planned | [Yes / No / Eventually] |
| Formation state | [State] |
| Licensed profession | [Yes -- specify / No] |
| Investment timeline | [Immediate / Within 6 months / Exploring] |

---

### Entity Comparison Table: [Entities Relevant to This Situation]

| Factor | [Entity 1] | [Entity 2] | [Entity 3] |
|--------|-----------|-----------|-----------|
| Personal liability protection | | | |
| Formation cost ([State]) | | | |
| Annual state fees | | | |
| Annual accounting cost (est.) | | | |
| Total estimated year-1 cost | | | |
| Federal tax treatment | | | |
| SE/payroll tax on net income | | | |
| Tax return type | | | |
| Equity/investor suitability | | | |
| Administrative complexity | | | |
| Minimum owners | | | |
| Maximum owners | | | |

*State fees are approximations as of skill creation date. Verify current amounts at [State] Secretary of State website before filing.*

---

### Analysis: Which Options Are Most Relevant for Your Situation

**Option [A] -- [Entity type]:** [2-4 sentences explaining why this is or is not a strong fit, with specific reasons tied to the user's stated revenue, industry, owner structure, and state]

**Option [B] -- [Entity type]:** [2-4 sentences on fit, specific to their situation]

**Option [C] -- [Entity type if applicable]:** [2-4 sentences on fit or reason to exclude]

**Why [Entity type] is less relevant here:** [1-2 sentences explaining the exclusion with specific reasoning, not generic]

---

### S-Corp Tax Savings Illustration
*(Include only when net income is $50,000+; omit for lower-income scenarios)*

This is a simplified illustration, NOT a tax calculation. Your actual savings depend on your specific expenses, deductions, state tax treatment, and what your CPA determines is a reasonable salary for your role and market.

| Scenario | Annual Net Income | Estimated "Reasonable Salary" | SE/Payroll Tax on Salary | Distributions | Estimated Tax on Distributions | Approx. Gross SE Tax Savings |
|----------|-----------------|-------------------------------|-------------------------|---------------|-------------------------------|------------------------------|
| Default LLC / Sole Prop | $[Amount] | N/A | 15.3% on all net income | N/A | N/A | Baseline |
| LLC with S-Corp election | $[Amount] | $[Industry salary benchmark] | 15.3% on salary only | $[Amount] | 0% SE/FICA | ~$[Estimated savings] |

**Estimated additional S-Corp compliance costs (annual):**
- Payroll service (e.g., Gusto, ADP): ~$500-$1,500/year
- Form 1120-S preparation (CPA): ~$500-$1,500/year additional
- State S-Corp fees (if any): $[State-specific]
- **Total additional cost estimate:** ~$1,000-$3,000/year

**Estimated net benefit:** $[Gross savings] minus $[Compliance cost range] = approximately $[Net range]

*This analysis must be validated by a CPA using your actual figures. The reasonable salary determination is the most critical variable and carries audit risk if set too low.*

---

### Formation Cost Detail: [State]

| Entity Type | State Filing Fee | Annual Report Fee | Min. Franchise/State Tax | Registered Agent (if needed) | Estimated Year-1 Total |
|-------------|-----------------|-------------------|-------------------------|------------------------------|------------------------|
| Sole Proprietorship (DBA) | $0-$[DBA fee] | None | None | None | $0-$[DBA fee] |
| LLC | $[Amount] | $[Amount] | $[Amount or None] | $[0 if self-agent / $50-$300 service] | $[Total] |
| Corporation (C or S) | $[Amount] | $[Amount] | $[Amount or None] | $[Amount] | $[Total] |

*Does not include attorney fees ($500-$2,000 for entity formation), operating agreement/bylaw drafting, or ongoing CPA fees.*

---

### State-Specific Notes: [State]

- **LLC annual fee:** [Specific amount and due date cadence]
- **Franchise/gross receipts tax:** [Specific tax if applicable, or "None -- [State] does not impose a minimum franchise tax on LLCs"]
- **S-Corp state recognition:** [Does the state recognize federal S-Corp election for state income tax? Any state-level S-Corp fees?]
- **Publication requirement:** [If applicable -- New York, Nebraska, Arizona have newspaper publication requirements]
- **Professional entity requirement:** [If user is in a licensed profession, note whether state requires PC/PLLC]
- **Notable feature:** [Delaware Chancery Court, Wyoming charging order, Nevada officer protections, California franchise tax trap, etc.]

---

### Veil Protection Checklist
*(For any user forming or operating an LLC or corporation)*

To maintain liability protection, the owner must:
- [ ] Open a dedicated business bank account and NEVER pay personal expenses from it
- [ ] Obtain an EIN (Employer Identification Number) from the IRS -- free at irs.gov
- [ ] Use the entity's full legal name (including "LLC" or "Inc.") in all contracts, invoices, and communications
- [ ] Sign contracts in your capacity as owner/member/officer, not in your personal name
- [ ] Keep a signed Operating Agreement (LLC) or Bylaws + meeting minutes (Corporation)
- [ ] Maintain adequate business insurance
- [ ] Do not guarantee business debts in your personal name if avoidable
- [ ] Do not undercapitalize the business (fund it adequately for its known obligations)

---

### Questions for Your Business Attorney

**Entity structure and liability:**
1. [Specific question based on user's industry and liability profile]
2. [Question about veil protection in the context of their specific activity]
3. [Question about operating agreement / shareholder agreement provisions specific to their ownership structure]
4. [Question about converting the entity later if business grows or adds investors]

**State-specific questions:**
5. [Question about state-specific requirement -- e.g., publication, franchise tax, professional licensing]
6. Do I need to register in any other state, or will all my business be conducted entirely in [State]?

**Future planning:**
7. If I want to add a partner or investor later, what does this entity structure allow and what would need to change?
8. Are there any clauses I should include in my Operating Agreement / shareholder agreement now to protect against future disputes?

---

### Questions for Your CPA / Tax Professional

**Tax structure decisions:**
1. Based on my projected net income of $[Amount], does an S-Corp election make mathematical sense this year or in the near future?
2. If I elect S-Corp status, what would you consider a defensible "reasonable salary" for my role in this business and market?
3. What are the state income tax implications of my entity choice in [State]?

**Compliance and setup:**
4. What business bank account and bookkeeping setup do you recommend to ensure my records will support any future audit?
5. When are estimated quarterly tax payments due, and how do I calculate them in my first year?
6. What deductions am I likely to miss as a new business owner that I should be tracking from day one?

---

### What to Expect from Professional Consultations

| Professional | Typical Initial Consultation | What They Can Help With | Typical Cost Range |
|-------------|------------------------------|------------------------|-------------------|
| Business attorney | 1-2 hours | Entity selection legal analysis, Operating Agreement drafting, veil protection guidance, future investor/partner structure | $150-$400/hour; flat-fee formation packages: $500-$2,000 |
| CPA / Enrolled Agent | 1-2 hours | Tax structure optimization, S-Corp analysis, estimated taxes, deduction strategy, ongoing compliance | $150-$400/hour; annual tax prep: $500-$2,500+ depending on complexity |
| Both -- recommended | Sequential or joint meeting | Best to consult attorney first on structure, then CPA on tax elections; ideally they communicate with each other | Variable |

*Many attorneys and CPAs offer a free or low-cost initial consultation. Bring your Situation Summary (above) to maximize the value of that meeting.*

---

### Key Terms Glossary
*(For users encountering these terms for the first time)*

- **Pass-through taxation:** Income and losses pass through the entity to owners' personal tax returns, avoiding entity-level tax
- **Self-employment (SE) tax:** The sole proprietor/LLC member's equivalent of FICA payroll taxes -- 15.3% on net income up to the Social Security wage base, 2.9% above it
- **Corporate veil:** The legal separation between an entity and its owners; protects personal assets from business liability
- **Piercing the veil:** A court ruling that treats the entity and owner as the same, eliminating liability protection -- typically due to commingling funds, fraud, or failure to maintain formalities
- **Operating Agreement:** Internal governance document for an LLC -- defines ownership, management, profit sharing, voting, and what happens when members leave
- **Articles of Organization / Articles of Incorporation:** The state-filed document that creates the LLC or corporation
- **Registered Agent:** A person or service designated to receive legal notices and government documents on behalf of the entity; required in all states
- **EIN:** Employer Identification Number -- the entity's federal tax ID, analogous to a Social Security Number; obtained free from irs.gov
- **Form 2553:** The IRS form used to elect S-Corp tax status; must be filed timely
- **Reasonable salary:** The IRS-required compensation that an S-Corp owner-employee must pay themselves before taking distributions; subject to payroll tax and audit scrutiny if set too low
- **QSBS / Section 1202:** Qualified Small Business Stock exclusion -- allows C-Corp shareholders to exclude up to $10 million in capital gains from federal tax upon exit, subject to conditions
```

---

## Rules

1. **Always lead with and periodically reinforce the disclaimer.** Do not bury the disclaimer at the end. The disclaimer must appear at the top of the output before any substantive comparison. This is a legal-adjacent topic where users may act on information as if it were professional advice.

2. **Never recommend a specific entity type as the definitive right answer.** The output should always be framed as "here are the trade-offs, here is how they apply to your described situation, here are the questions to ask a professional" -- not "you should form an LLC." The line between education and advice is crossed when you make a specific recommendation as if you know the user's complete legal and financial situation.

3. **Never calculate or imply specific tax savings as if they are the user's actual savings.** The S-Corp illustration must be clearly labeled as an illustration using the user's stated income as an input, not as a projection of their actual tax liability. Always caveat that a CPA using actual figures must validate any estimate.

4. **Always address the veil maintenance requirement when recommending or explaining entities with liability protection.** Liability protection is not automatic or unconditional. A user who forms an LLC but continues to pay personal expenses from the business account may have no protection when it matters most. This is the single most common small business legal mistake.

5. **Never omit the S-Corp reasonable salary risk when discussing S-Corp benefits.** The self-employment tax savings of an S-Corp are real, but the IRS aggressively audits S-Corps where the owner salary is set unreasonably low (some CPAs call salaries of $12,000/year on $200,000 of distributions "phantom employee" schemes). Always pair the savings discussion with the audit risk and the requirement for a defensible salary determination.

6. **When the user mentions wanting VC or institutional investment, immediately flag the Delaware C-Corp norm.** Do not bury this at the bottom. Founders who form an LLC and then raise a VC seed round often face costly conversion to a Delaware C-Corp with tax implications. If there is any realistic investor path, the C-Corp discussion is material from the start.

7. **When the user's state is California, Texas, New York, or any state with non-standard LLC treatment, always call this out explicitly.** California's $800 minimum franchise tax applies from the first year of operation (with a first-year exemption introduced in 2021 for entities formed after January 1, 2021 -- verify current status), even if the business earns nothing. New York City does not recognize S-Corp elections for the NYC general corporation tax (applies to NYC-based businesses only). Texas imposes a margin tax on businesses above the threshold. These are not minor footnotes -- they can be decisive cost factors.

8. **Always ask about licensed profession status before completing the analysis.** A user who is an attorney, CPA, physician, architect, or other state-licensed professional may be legally required to form a PC or PLLC rather than a standard LLC. Providing an analysis that omits this possibility creates a meaningfully misleading picture. If the user is in a licensed profession, flag the PC/PLLC issue and recommend they verify with a state bar or licensing board.

9. **When multiple owners are involved, always treat the operating agreement or shareholder agreement as a critical deliverable, not an optional add-on.** The most expensive business litigation in small company law arises from partnerships and multi-member LLCs that never formalized their internal governance. The absence of a written agreement defaults to state law provisions that may not match what the parties intended. Make this point clearly and specifically.

10. **Entity type can always be changed later, but "easily" is an overstatement -- always note the conversion consequences.** Converting an LLC to a C-Corp for a VC round, or electing S-Corp status after years as a default LLC, or converting an S-Corp to a C-Corp all have potential tax events, state filing requirements, and timing rules. When users ask "can I change this later?", the answer is "yes, but with planning, cost, and timing constraints -- your attorney and CPA should guide any conversion."

11. **Never present general partnership as a viable ongoing option without strongly noting the mutual unlimited liability risk.** A general partnership is appropriate to describe as an existing structure that someone may find themselves in by accident. It should not be presented as a reasonable choice for any new business formation with more than one owner when an LLC is available.

12. **State-specific filing fees and franchise taxes change frequently -- always note that the user should verify current amounts** with their state's Secretary of State website or a local attorney before filing. Use the best available figures but do not present them as guaranteed current.

---

## Edge Cases

### User Is a Solo Freelancer or Consultant Wondering Whether They "Need" an LLC

This is the highest-frequency scenario. The answer is never a simple yes or no. Walk through the relevant factors:

- **Liability exposure:** A graphic designer, copywriter, or web developer has moderate professional liability risk (errors and omissions, contract disputes). A personal trainer, yoga instructor, or massage therapist has significant personal injury liability risk. A construction contractor has extreme liability exposure. The higher the risk, the more the LLC's protection value justifies its cost even at low revenue.
- **Revenue threshold for LLC formation:** For very low revenue ($15,000-$30,000/year), the LLC formation and compliance cost may not be justified for a low-risk freelancer. At $50,000+ revenue, the cost is generally justified. At $80,000+, not having an LLC is difficult to defend on risk management grounds.
- **The insurance alternative:** For low-revenue, low-risk freelancers, professional liability (errors and omissions) insurance and general liability insurance may provide practical protection at lower cost than entity formation. This is worth mentioning -- it is not an either/or. Many well-advised small businesses maintain both an LLC and adequate insurance.
- **The S-Corp question at this income level:** If the freelancer's net income approaches or exceeds $80,000, tell them the S-Corp analysis is worth having a CPA run the numbers. At $80,000 net income, an S-Corp with a $45,000 reasonable salary could save approximately $5,000-$6,000 in SE tax annually -- which must then be weighed against $1,500-$3,000 in additional compliance cost. The net savings may be $2,000-$4,000, which is material.

### User Wants to Form in Delaware or Wyoming But Operates in Another State

Formation in a "business-friendly" state is a common question, particularly for users who have read about Delaware's Chancery Court or Wyoming's charging order protection.

- **The foreign entity registration requirement:** Any LLC or corporation formed in one state but doing business in another state must register as a "foreign entity" in each state where it operates. "Doing business" generally means having a physical presence, employees, an office, or regularly conducting transactions there. This means: two sets of formation/registration fees, two sets of annual reports, potentially two registered agents, and potentially compliance with the laws of both states.
- **When out-of-state formation makes sense:** Delaware C-Corp formation makes strong practical sense for venture-backed startups because Delaware's Chancery Court provides decades of precedent on corporate governance issues. The cost of foreign qualification in the home state is justified by the legal infrastructure. Wyoming LLC formation occasionally makes sense for specific asset protection strategies (Wyoming has strong single-member LLC charging order protections), but this is a specialized strategy that requires an attorney's analysis.
- **When out-of-state formation does NOT make sense:** For a local service business, restaurant, retail shop, or solo freelancer -- forming in Delaware or Wyoming and then registering as a foreign entity in the home state adds cost ($150-$500 in foreign registration fees) and complexity with essentially no practical benefit. The "Delaware advantage" is meaningful for companies with complex governance, outside investors, and potential litigation. It is irrelevant for a two-person landscaping LLC.

### User Has a Business Partner With No Written Agreement

This scenario requires a direct and clear response. Do not downplay the risk.

- A general partnership exists by default, with all its mutual unlimited liability, even if the parties have never signed anything and consider themselves to be "just working together for now."
- Even if the parties plan to form an LLC, the period before formation is a period of unprotected general partnership if the business is already operating.
- The Operating Agreement is not a formality -- it is the document that resolves the questions that will inevitably arise: What happens when one partner wants to leave? What if one partner stops contributing? Who makes decisions when partners disagree? What are the buyout terms? How is profit allocated?
- Key operating agreement provisions to raise: ownership percentage (capital contributions vs. sweat equity), profit and loss allocation, decision-making (unanimous vs. majority vs. designated managing member), withdrawal and buyout mechanism (right of first refusal, valuation method), non-compete and non-solicitation clauses upon departure, and dissolution procedure.
- Recommend that each partner retain separate counsel to review the operating agreement if the stakes are significant. A single attorney drafting an agreement for both parties has a conflict of interest.

### User's Business Has Both High-Risk and Low-Risk Activities (Asset Segregation)

Some businesses mix asset types or activity types with different liability profiles:

- Common examples: a real estate investor who also operates a property management company; a tech company that also owns the building where it operates; a restaurant group that owns multiple locations; a consultant who also teaches workshops where participants could be injured.
- **Asset segregation strategy:** Using separate LLCs for different risk buckets is a legitimate legal strategy. Classic structure: one LLC (OpCo) for operations, a separate LLC (PropCo) for real estate or valuable equipment. If the operations LLC is sued, its creditors cannot reach the assets of the real estate LLC (assuming proper separation is maintained).
- **Series LLC as an alternative:** A handful of states (Delaware, Illinois, Texas, Nevada, Wyoming) have enacted Series LLC statutes, which allow a single LLC to contain multiple "series" with legally segregated assets -- potentially achieving asset separation without forming entirely separate entities. This is an emerging and not universally recognized structure; whether other states' courts will respect the separation is an open question. Require specialized counsel for serious consideration.
- **Cost-benefit analysis:** Each additional entity means additional formation costs, annual fees, registered agent fees, and separate bookkeeping. For most small businesses, the cost of maintaining multiple entities is not justified until the business reaches a meaningful scale or until there is a specific identifiable asset to protect.

### User Is a Non-U.S. Citizen or Non-Resident

Non-citizens face a materially different analysis:

- **LLC and C-Corp:** Generally available to non-citizens and non-residents. A foreign national can own and form an LLC or C-Corp in any U.S. state. An EIN can be obtained with an ITIN (Individual Taxpayer Identification Number) if no Social Security Number is available.
- **S-Corp election:** Not available to shareholders who are not U.S. citizens or permanent resident aliens. A single non-resident alien shareholder disqualifies the entire S-Corp election. This is an absolute restriction -- there is no workaround.
- **Tax treaty implications:** The U.S. has income tax treaties with many countries that affect how business income is taxed. Withholding tax on distributions, FIRPTA rules for real estate, and FDAP income rules may apply depending on the owner's country of residence and the business's activities.
- **Visa considerations:** Some visa types (student visas, tourist visas, certain work visas) may restrict the holder's ability to own or operate a U.S. business. This must be verified with an immigration attorney.
- **Recommendation:** Any non-citizen considering U.S. business formation should retain both a U.S. business attorney and a CPA with international tax experience. The standard sole proprietorship / LLC / S-Corp framework does not map cleanly onto this scenario without professional modification.

### User Is Considering Converting an Existing Sole Proprietorship to an LLC Mid-Year

This is a practical operational question that arises frequently:

- **Tax year implications:** Converting to an LLC mid-year does not create a separate tax year for most single-member LLCs (disregarded entity). The income from both the sole proprietorship period and the LLC period all flows to the same Schedule C on the same Form 1040.
- **Existing contracts:** Existing client contracts are between the individual and the client. Upon forming an LLC, new contracts should be signed in the LLC's name. Existing contracts may need assignment language if the parties agree. Notify clients and vendors of the entity change.
- **Existing bank accounts:** Open a new business bank account in the LLC's name with the LLC's EIN. Do not continue using the personal account for business purposes post-formation.
- **Timing for S-Corp election:** If the goal is to elect S-Corp status, there are strict timing rules. Form 2553 must be filed by March 15 of the tax year for which the election is to apply, or within 75 days of the entity's formation date. Missing this deadline means waiting until the following tax year. Plan accordingly.
- **Registered agent and annual report:** The new LLC will have its own annual report due date on the first anniversary of formation (in most states). Set a calendar reminder to avoid late fees or administrative dissolution.

### User Is in California (Special State Rules)

California warrants its own edge case because its LLC rules are materially more expensive than most states:

- **$800 minimum franchise tax:** California LLCs pay a minimum of $800/year in franchise tax to the Franchise Tax Board, regardless of income. If the LLC earns zero, the $800 is still owed. There was a first-year exemption introduced for LLCs formed after January 1, 2021 -- verify whether this exemption is still in effect and whether it applies to the current tax year.
- **LLC gross receipts fee:** In addition to the $800 minimum, California LLCs with total income from California sources over $250,000 pay additional fees on a tiered schedule: $900 (over $250K), $2,500 (over $500K), $6,000 (over $1M), $11,790 (over $5M). These fees are based on gross income, not net income -- a low-margin business with high gross revenue can owe significant fees.
- **S-Corp state recognition:** California recognizes the S-Corp election for state income tax purposes but imposes a 1.5% franchise tax (minimum $800) on S-Corp net income at the entity level, which is unusual among states.
- **Foreign entity cost:** A California LLC must also pay California's franchise tax even if it was formed in Delaware or another state and is registered as a foreign LLC in California. The formation-in-another-state strategy does not avoid California's taxes.
- **Practical implication:** For a California-based business, the annual franchise tax cost must be factored into the entity decision. For a low-revenue business (under $50K/year), the $800 minimum may represent a meaningful percentage of profit. A sole proprietorship or general partnership is not subject to the $800 minimum (though it is subject to California personal income tax).

---

## Example

**Input:**

"I'm starting a small tech consulting business. I'll be doing software architecture consulting for mid-sized companies. I have a business partner -- my co-founder -- and we're planning to split ownership 60/40. We're based in Texas. We expect to make around $250,000 in combined revenue in year one, probably around $180,000 in net income split between us. We might want to bring on outside investors someday but nothing is planned right now. No employees to start. Should we form an LLC or a corporation? We've heard S-Corp might save us on taxes."

---

**Output:**

## Business Entity Comparison: Tech Consulting Partnership -- Texas

---

> **Disclaimer:** This comparison is educational information only and does not constitute legal or tax advice. Entity selection has significant legal and tax consequences. Always consult a business attorney and CPA licensed in your state before making this decision.

---

### Your Situation Summary

| Factor | Your Details |
|--------|-------------|
| Business type | Software architecture consulting |
| Owner structure | Two partners -- 60% / 40% ownership split |
| Expected annual gross revenue | ~$250,000 |
| Expected annual net income | ~$180,000 (split between two owners) |
| Employees planned | No |
| Outside investment planned | Not currently; possible future |
| Formation state | Texas |
| Licensed profession | No |
| Investment timeline | Exploring for future |

---

### Entity Comparison Table: Entities Relevant to This Situation

| Factor | General Partnership | Multi-Member LLC (Default) | LLC with S-Corp Election | Delaware C-Corp |
|--------|--------------------|--------------------------|--------------------------|--------------------|
| Personal liability protection | None -- joint and several | Yes -- veil protection | Yes -- veil protection | Yes -- strongest |
| Formation cost (Texas) | $0 | ~$300 state filing fee | ~$300 + IRS Form 2553 | ~$89 (Delaware) + ~$750 Texas foreign registration |
| Annual Texas fees | None | ~$0 Texas annual report (franchise tax threshold) | ~$0 + payroll processing | ~$400 Delaware franchise + ~$[TX] |
| Annual accounting cost (est.) | $1,000-$2,500 | $1,500-$3,000 | $3,000-$5,000 (adds payroll + 1120-S) | $4,000-$7,000+ |
| Total estimated year-1 cost | ~$1,000-$2,500 | ~$1,800-$3,300 | ~$3,300-$5,300 | ~$5,200-$9,000+ |
| Federal tax treatment | Pass-through (Form 1065) | Pass-through (Form 1065 + K-1s) | Salary + distributions per owner | Corporate tax + divid
