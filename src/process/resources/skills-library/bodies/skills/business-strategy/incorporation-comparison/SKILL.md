---
name: incorporation-comparison
description: |
  Produces an entity comparison table covering sole proprietorship, LLC, S-corp, C-corp, and partnership structures with trade-offs across liability, taxation, governance, and cost for a specific business situation. Use when the user asks about business structures, incorporation options, LLC vs S-corp, choosing an entity type, or forming a business entity.
  Do NOT use for partnership agreements (use partnership-agreement-outline), startup fundraising structure (use fundraising-narrative), or cap table modeling (use cap-table-basics).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship planning strategy decision-making analysis"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Incorporation Comparison

**Important:** This skill produces an informational comparison of business entity types for educational purposes only. It is NOT legal or tax advice. Business entity selection has significant legal, tax, and financial implications that vary by state, country, and individual circumstance. Always direct users to consult a qualified business attorney and CPA before forming any entity.

---

## When to Use

**Use this skill when:**
- A user asks which business structure to choose -- "should I be an LLC or S-corp?", "what is the difference between an LLC and a corporation?", or "how do I structure my new business?"
- A user is a solo founder, freelancer, or consultant earning meaningful revenue and questioning whether their current structure is optimal
- A user has a multi-founder situation and needs to understand entity options before engaging an attorney
- A user asks about self-employment tax and whether an S-corp election can reduce their tax burden
- A user is building a product company and wants to understand whether a C-corp is required before approaching investors
- A user asks about Delaware incorporation specifically, or why startups always seem to form in Delaware
- A user is switching business models (e.g., going from freelancer to product company) and needs to understand when their entity structure stops making sense

**Do NOT use this skill when:**
- The user needs a draft operating agreement or co-founder terms -- use `partnership-agreement-outline`
- The user is raising a funding round and needs to structure the pitch, SAFE, or convertible note -- use `fundraising-narrative`
- The user needs to model equity splits, option pools, or dilution -- use `cap-table-basics`
- The user is asking about a specific state's LLC Act provisions or needs jurisdiction-specific legal interpretation -- recommend a licensed business attorney in that state
- The user is asking about international corporate structures (holding companies, offshore entities, treaty optimization) -- this requires international tax counsel
- The user is restructuring an existing business with employees and retirement plans, which involves payroll tax lookback periods and plan disqualification risk -- recommend a CPA specializing in business transitions

---

## Process

### Step 1: Gather Business Context Before Producing Any Comparison

Do not produce a generic five-column table without first understanding the user's situation. The entity that is right for a $50K/year dog groomer is wrong for a $2M/year SaaS company seeking Series A funding. Ask for -- or extract from context -- the following:

- **Business description:** What does the company sell or do? (Services vs. products, B2B vs. B2C, capital-intensive vs. knowledge-based)
- **Owner count and composition:** Solo founder? Two co-founders? A spouse team? Silent investor partners? Non-US participants?
- **Current or projected net income:** Not revenue -- net income after expenses. This drives the SE tax math. Key thresholds: $0-$40K (sole prop / standard LLC often wins), $40K-$80K (gray zone, model both), $80K+ (S-corp election likely beneficial), $500K+ (C-corp reinvestment strategy may emerge)
- **Investment intent:** No outside capital ever, angel rounds, venture capital, or crowdfunding? This is often the single most deterministic variable. VC = C-corp, period.
- **Employee headcount:** Zero employees changes the compliance math entirely. Adding employees resets costs.
- **State of primary operation:** Some states are dramatically more expensive for certain entities. California LLCs owe an $800 minimum franchise tax plus a gross receipts fee (0.15% of California revenue). Wyoming and New Mexico have no franchise taxes. Delaware has a separate franchise tax computation that can surprise founders.
- **Industry and liability exposure:** Professional services (medical, legal, financial, engineering) often have additional entity options like Professional LLCs (PLLCs) or Professional Corporations (PCs) required by state licensing boards.
- **Exit intent:** Lifestyle/cash-flow business, acquisition target, or IPO? Acquirers often prefer asset sales, which have different tax treatment by entity type. IPOs require C-corps.
- **Existing personal assets to protect:** Someone with a paid-off house, investment portfolio, and savings has much more liability exposure to protect than someone with minimal personal assets.

### Step 2: Educate on the Five Core Entity Types With Specific, Factual Detail

Present each entity with real mechanics, not summaries. Cover the following for each:

**Sole Proprietorship:**
- Not a separate legal entity. Legally indistinguishable from the owner.
- Business income and expenses reported on Schedule C of Form 1040.
- Net profit subject to self-employment tax at 15.3% on the first $168,600 (2024 wage base) and 2.9% above that. The employer half (7.65%) is deductible, reducing net SE tax impact by roughly half that amount, but the owner still bears the full economic cost.
- No formation filing required in most states. A DBA ("doing business as") filing may be required if operating under a name other than the owner's legal name. DBA fees are typically $10-$100 depending on county.
- Provides zero liability protection. A client lawsuit, contract dispute, or vendor claim can reach personal bank accounts, home equity, and investments.
- Cannot raise institutional investment. Cannot issue equity to employees via stock options.
- Best reserved for: solo consultants testing a business idea before committing to formation costs, or low-risk freelancers under $40,000 net income with minimal liability exposure.

**General Partnership:**
- Two or more persons carrying on a business together for profit. Can be formed inadvertently by conduct -- two people splitting business profits can legally constitute a partnership even without a written agreement.
- Joint and several liability: every partner is personally liable for 100% of the partnership's debts, including debts created by the actions of any other partner. This is the most dangerous liability structure in common use.
- Files Form 1065 (informational return only; the partnership itself pays no federal income tax). Each partner receives Schedule K-1 showing their allocable share of income, losses, deductions, and credits, reported on their personal Form 1040.
- Self-employment tax applies to the full distributive share for general partners who participate in management.
- Limited Partnership (LP) is a variant: one or more general partners with unlimited liability manage the business; limited partners have liability limited to their investment but cannot participate in management without losing LP status. LPs are common for real estate investment and private equity fund structures, not typical operating businesses.
- Rarely the right choice for a new business when an LLC provides the same pass-through taxation with liability protection at modest additional cost.

**Limited Liability Company (LLC):**
- The dominant entity for new small businesses in the United States for the past 25 years. Combines partnership-style taxation flexibility with corporate-style liability protection.
- Members' personal assets are shielded from business liabilities, provided they maintain proper separation of business and personal finances ("piercing the corporate veil" risk is real but uncommon when basic hygiene is maintained: separate bank account, no personal charges on business accounts, adequate capitalization).
- Tax classification is chosen, not automatic. Single-member LLC: disregarded entity by default (taxed like sole proprietorship on Schedule C). Multi-member LLC: partnership by default (Form 1065 / K-1). Either can elect C-corp taxation (Form 8832) or S-corp taxation (Form 2553). This flexibility is the LLC's most powerful feature.
- Formation: Articles of Organization (or Certificate of Organization) filed with the Secretary of State. Filing fees range from $50 (Kentucky, Colorado) to $500 (Massachusetts). Operating Agreement is required in California, New York, Maine, Missouri, and Delaware; strongly recommended everywhere else.
- Ongoing compliance: Annual report / biennial report filings in most states ($25-$800). California imposes an $800/year minimum franchise tax plus a Gross Receipts Fee starting at $900/year for revenues of $250K-$499,999. Texas imposes a franchise tax (0.375% of revenue for most small businesses, with a $1.18M no-tax threshold in 2024). Wyoming has no LLC tax.
- Ownership is called "membership interests." Transferability is governed by the Operating Agreement. This matters if a member dies, becomes incapacitated, or wants to sell.
- Not preferred by venture capitalists due to K-1 complexity for their limited partners (many are tax-exempt entities like pension funds and endowments, for whom UBTI -- unrelated business taxable income -- from an LLC investment creates problems). LLCs can always convert to C-corps; the IRS has streamlined this conversion process, but it is a taxable event in some scenarios.

**S Corporation:**
- Not a separate entity type -- it is a tax election made by a corporation (or LLC) by filing IRS Form 2553 with the IRS. The underlying entity is either a state-chartered corporation or an LLC that has first elected to be taxed as a corporation (Form 8832) and then elected S-corp status.
- The primary benefit is payroll tax savings. An S-corp owner who works in the business must receive "reasonable compensation" (salary) subject to payroll taxes (Social Security and Medicare). Net income distributed above that salary is not subject to the 15.3%/2.9% SE tax. At $120,000 net income with a $72,000 reasonable salary, the owner saves SE tax on approximately $48,000 -- roughly $6,900 in savings (at the 14.13% effective SE tax rate after the employer deduction). Against compliance costs of $2,000-$4,000/year, this is a meaningful but modest net benefit.
- Strict eligibility requirements: maximum 100 shareholders; shareholders must be US citizens or permanent residents (no foreign shareholders), certain trusts, or estates -- no corporations or partnerships as shareholders; only one class of stock permitted (though differences in voting rights are allowed). These restrictions make S-corps incompatible with institutional investment.
- Reasonable compensation requirement is the IRS's primary audit focus for S-corps. The IRS uses industry compensation surveys, the "S-Corp 60/40 rule" (60% of profits as salary, 40% as distribution) as an informal benchmark, and officer compensation filings to identify underpayment. Paying yourself $1 and taking $500,000 in distributions is a known audit trigger.
- Built-in Gains (BIG) tax: if a C-corp converts to an S-corp, assets that appreciated in value prior to the S election are subject to a 21% corporate tax when sold within five years of conversion. This is a critical consideration for C-corps with appreciated assets evaluating a switch.
- Governance requirements mirror those of a C-corp: Articles of Incorporation, Bylaws, initial organizational meeting, board of directors, annual meetings, corporate minutes, and stock certificates or records.
- State conformity is not guaranteed. Some states -- notably New York City (General Corporation Tax), Tennessee, and New Hampshire -- do not recognize S-corp status and tax the entity at the state corporate level. This significantly reduces the benefit of an S-corp election in those jurisdictions.

**C Corporation:**
- The default corporation. A fully separate legal entity that can enter contracts, own property, sue, be sued, and exist indefinitely regardless of owner changes.
- Double taxation is the frequently cited disadvantage: the corporation pays federal corporate income tax at 21% (flat rate since the Tax Cuts and Jobs Act of 2017, reduced from a top rate of 35%). When the corporation distributes profits to shareholders as dividends, shareholders pay qualified dividend rates (0%, 15%, or 20% depending on income). A profitable company earning $500,000 and distributing all profits pays $105,000 in corporate tax, then shareholders pay up to $79,000 in dividend tax on the remaining $395,000. However, for growth companies that reinvest profits rather than distributing them, double taxation is deferred or avoided -- retained earnings compound at the 21% corporate rate rather than the 37% individual rate.
- Qualified Small Business Stock (QSBS) -- IRC Section 1202 -- is an extraordinary tax benefit available only to C-corp shareholders. Investors and founders who acquire QSBS in a C-corp with gross assets under $50M at time of issuance and hold the stock for more than 5 years can exclude up to 100% of federal capital gains on the sale (up to $10 million or 10x the adjusted basis, whichever is greater). This is a multi-million dollar benefit available exclusively to C-corps, and is a major reason why startup founders choose Delaware C-corps even before raising institutional capital.
- Venture capital firms universally require C-corps. The reasons are structural: (1) VC funds use preferred stock with liquidation preferences, anti-dilution protections, and board representation rights -- all impossible in an S-corp and awkward in an LLC; (2) institutional LPs (pension funds, endowments, funds of funds) cannot receive K-1 income without UBTI complications; (3) Delaware corporate law is the most developed and predictable in the country.
- Delaware incorporation: approximately 68% of Fortune 500 companies and over 1 million small businesses are incorporated in Delaware. The reasons include the Court of Chancery (a specialized business court with no jury trials and highly predictable outcomes), the most developed body of corporate case law, flexible corporate statutes, absence of Delaware state income tax for companies that don't do business there, and the General Corporation Law's director-friendly provisions. Formation cost is $90 (minimum) plus a registered agent fee ($50-$300/year). The annual franchise tax uses either the Authorized Shares Method (which can produce surprise bills of $75,000+ for companies with millions of authorized shares) or the Assumed Par Value Capital Method (typically $400-$5,000 for early-stage startups). Always use the Assumed Par Value method -- Delaware allows companies to choose, but the default computation can be wildly unfavorable.
- Stock option plans (ISOs and NSOs) are only available to corporations. An LLC can issue profits interests, which achieve similar economic outcomes but are administratively different and lack the familiarity that employee candidates expect.
- 83(b) elections apply to both corporations and LLCs but are most commonly associated with C-corp restricted stock grants to founders. Filing within 30 days of a grant is mandatory; missing the window cannot be fixed.

### Step 3: Identify the User's Key Decision Variables

Map the user's situation to the handful of factors that actually drive entity selection:

**Decision Variable 1 -- Investment Path:**
- Raising venture capital or issuing preferred stock → C-corp (Delaware preferred) is required
- Raising angel investment via SAFE or convertible note → C-corp strongly preferred; LLC with conversion provision is acceptable
- Revenue-based financing, SBA loans, bank loans → Any entity with liability protection (LLC or corp) qualifies
- No outside capital, ever → LLC or S-corp; C-corp is unnecessary complexity

**Decision Variable 2 -- Tax Efficiency at Current Income Level:**
- Under $40,000 net income: Sole proprietorship or standard LLC -- the SE tax cost is low, and S-corp compliance costs ($2,000-$4,000/year) would eliminate any savings
- $40,000-$80,000 net income: Model both LLC and LLC with S-corp election. The break-even point where S-corp savings exceed costs is typically around $50,000-$60,000 net income, depending on the state and the accountant's fees
- $80,000-$500,000 net income: LLC with S-corp election is often the optimal structure for a single-owner service business. Savings scale with income.
- $500,000+ net income: Reconsider C-corp for retained earnings accumulation at 21% vs. personal rates of 37%+ on pass-through income. This requires careful modeling by a CPA.

**Decision Variable 3 -- Liability Risk Profile:**
- Home-based service with no physical clients, no products, minimal contracts → Lower urgency for liability protection; sole prop or LLC acceptable
- Any business with employees, physical premises, product liability, professional malpractice exposure, significant contracts, or substantial personal assets to protect → LLC or corporation required

**Decision Variable 4 -- Owner Composition:**
- Solo founder → Single-member LLC, S-corp election when profitable
- Two or more founders → Multi-member LLC (partnership taxation by default) or C-corp (if investment-seeking)
- Non-US citizen/resident involved → S-corp is disqualified; LLC with non-US members has complex FIRPTA/ECI withholding rules; C-corp is cleanest
- Spouse co-owners → Qualified Joint Venture election on Schedule C (in community property states) or SMLLC-treated-as-disregarded in some states; varies significantly

**Decision Variable 5 -- Administrative Capacity:**
- Solo operator with no accounting staff → Simplest viable structure; S-corp payroll adds real burden
- Business with a bookkeeper or fractional CFO → S-corp or C-corp compliance is manageable
- Pre-revenue startup → LLC (low cost, easy to maintain while pre-revenue, converts cleanly when needed)

### Step 4: Run the Self-Employment Tax Calculation Explicitly

For any user with an LLC or sole proprietorship and net income above $50,000, calculate the approximate SE tax savings from an S-corp election. This is the most concrete financial number in the entire comparison, and users respond to it.

**SE Tax Mechanics:**
- SE tax rate: 15.3% on net self-employment income up to the Social Security wage base ($168,600 in 2024); 2.9% Medicare on income above that; additional 0.9% Additional Medicare Tax above $200,000 (single) / $250,000 (married)
- The deductible portion of SE tax (50%) reduces effective SE tax rate to approximately 14.13% on the first $168,600 of net income
- S-corp "reasonable salary" for a working owner reduces the SE-taxable base to the salary amount only
- Distributions above the salary avoid SE tax entirely (though they are subject to regular income tax)

**Illustrative Calculation Template:**

For a user with $120,000 net income:
- Standard LLC: SE tax on $120,000 × 92.35% = $110,820 at 15.3% = ~$16,955
- S-corp: Set reasonable salary at $72,000 (60% -- a defensible benchmark in most knowledge-work fields). SE equivalent via FICA = $72,000 × 15.3% = $11,016 (employer + employee share). Distribution of $48,000 avoids SE tax.
- Gross SE tax savings: ~$5,939/year
- S-corp compliance costs: payroll service ($50-$100/month = $600-$1,200/year) + corporate tax return Form 1120-S ($800-$2,000/year more than Schedule C preparation) + additional state filings = $1,500-$3,500/year total
- Net annual benefit: approximately $2,500-$4,400/year
- Present value over 10 years (not discounted): $25,000-$44,000 in retained savings

Caution: the "reasonable salary" is not a number the user should set arbitrarily. The IRS publication Rev. Rul. 74-44 and subsequent Tax Court cases (Watson v. Commissioner, David E. Watson P.C., 2011) establish that reasonable compensation is based on what the business would pay an unrelated employee for the same services. Bureau of Labor Statistics Occupational Employment surveys, Robert Half salary guides, and compensation databases are commonly used references. Setting salary at 60% is a rule of thumb, not a safe harbor.

### Step 5: Address the Delaware C-Corp Pathway for Startup Founders

This is the most commonly misunderstood situation. A user building a software product or tech startup often asks "should I form an LLC or a corporation?" without knowing that their real question is "am I on the venture-backed startup path or the bootstrapped/revenue-focused path?"

**Delaware C-Corp Formation Checklist:**
- File Certificate of Incorporation with Delaware Division of Corporations ($90 + expedite fee if needed)
- Standard startup certificate: 10,000,000 authorized shares of common stock at $0.0001 par value (intentionally low par value minimizes Delaware franchise tax under the Assumed Par Value method)
- Engage a registered agent in Delaware ($50-$300/year; required because most founders are not Delaware residents)
- Adopt bylaws at organizational meeting
- Issue founder shares via Restricted Stock Purchase Agreements with vesting schedules (typically 4-year vest, 1-year cliff)
- File 83(b) elections within 30 days of each founder's stock issuance -- this is not optional, and the 30-day window is absolute
- Apply for EIN with the IRS
- Open a business bank account (requires EIN and formation documents)
- Register as a "foreign corporation" in the state where the business actually operates (e.g., if founders are in California, register with the California Secretary of State and pay the California $800 minimum franchise tax)

**Delaware Annual Franchise Tax:** Due March 1 each year. Startups should always request the Assumed Par Value Capital Method calculation. For a company with 10,000,000 authorized shares, $0.0001 par value, and $500,000 in gross assets, the Assumed Par Value method yields approximately $400 in franchise tax. The Authorized Shares Method on the same company yields $85,000. Delaware will not automatically give you the better calculation -- you must compute and request it.

### Step 6: Build the Comparison Table Specific to the User's Situation

Do not present all five entities with equal weight when 2-3 of them are clearly irrelevant. For a solo freelancer with no investment plans, focus the table on Sole Prop, LLC, and S-corp. For a venture-backed startup, focus on LLC vs. Delaware C-corp. Filter the comparison to the relevant 3-4 entities and highlight the dimensions that actually matter for their situation.

Always include in the table:
- Liability protection (yes/no + conditions)
- Federal tax treatment
- Self-employment / payroll tax on owner's income (specific amounts if income is known)
- Formation cost (state-specific if known)
- Annual compliance cost (realistic ranges, not minimums)
- Investment compatibility
- Owner restrictions
- Administrative burden rating (Low / Medium / High)

### Step 7: Produce the Recommendation and Next Steps

The recommendation must be specific and ranked:
1. **Primary recommendation** with rationale tied directly to the user's situation (income level, investment plans, liability exposure, state)
2. **Runner-up** with the specific condition under which the runner-up becomes the right answer
3. **Do NOT choose** -- explicitly name any entity that is disqualified for their situation and why
4. **"When to revisit"** -- the trigger that should prompt them to return to this decision (income doubles, first employee, first investor term sheet, etc.)
5. **Immediate next steps** -- ordered, specific, actionable

---

## Output Format

```
## Business Entity Comparison: [Business Name or Description]

> **Disclaimer:** This comparison is for informational and educational purposes only.
> It does NOT constitute legal or tax advice. Business entity selection has significant
> legal, tax, and financial implications that vary by jurisdiction and individual circumstance.
> Consult a qualified business attorney and CPA before making any entity decisions.

---

### Business Context

| Field | Detail |
|-------|--------|
| **Business description** | [What the business does] |
| **Owner(s)** | [Number, composition, residency] |
| **Net income (projected)** | [$X/year] |
| **Investment plans** | [None / Angel / VC / Revenue-based] |
| **Employees** | [Current and projected year 1] |
| **State(s) of operation** | [State(s)] |
| **Key assets to protect** | [Home equity, savings, prior business, etc.] |
| **Long-term goal** | [Cash flow / Acquisition / IPO / Lifestyle] |
| **Primary concern** | [Tax efficiency / Liability / Simplicity / Investment readiness] |

---

### Entity Comparison Table

| Dimension | [Entity 1] | [Entity 2] | [Entity 3] |
|-----------|------------|------------|------------|
| **Liability protection** | | | |
| **Federal tax treatment** | | | |
| **SE / payroll tax on owner income** | | | |
| **Estimated annual SE/payroll tax** | | | |
| **Formation cost** | | | |
| **Annual compliance cost** | | | |
| **Investment compatibility** | | | |
| **Owner restrictions** | | | |
| **Stock/equity options for employees** | | | |
| **Administrative burden** | | | |
| **QSBS eligibility (IRC §1202)** | | | |
| **State franchise / annual tax** | | | |

---

### Self-Employment Tax Analysis
*(Include only when SE tax savings are a meaningful consideration)*

| Metric | [Entity A] | [Entity B (S-Corp)] |
|--------|------------|---------------------|
| **Net income** | $[X] | $[X] |
| **Salary (reasonable compensation)** | N/A | $[X] |
| **SE / FICA taxable income** | $[X] | $[X] (salary only) |
| **SE / FICA tax (gross)** | $[X] | $[X] |
| **Annual compliance cost** | $[X] | $[X] |
| **Net annual tax + compliance cost** | $[X] | $[X] |
| **Annual net savings from S-corp** | -- | $[X] |

*Reasonable salary basis: [explain the benchmark used]*

---

### Situation Analysis: Priority Matrix

| Priority | Importance to This Business | Best-Fit Entity |
|----------|-----------------------------|-----------------|
| [Priority 1] | [High / Medium / Low] | [Entity] |
| [Priority 2] | [High / Medium / Low] | [Entity] |
| [Priority 3] | [High / Medium / Low] | [Entity] |
| [Priority 4] | [High / Medium / Low] | [Entity] |

---

### Recommendation

**Primary recommendation: [Entity type]**

[3-5 sentences explaining why this entity is the best fit for this specific user's income level,
liability exposure, investment plans, state, and goals. Reference the numbers calculated above.]

**Runner-up: [Entity type]**
[When this becomes the right answer -- specific trigger condition]

**Eliminated options:**
- [Entity X]: [One sentence on why it is disqualified for this user]
- [Entity Y]: [One sentence on why it is disqualified for this user]

**When to revisit this decision:**
- [Specific trigger 1, e.g., net income exceeds $80,000/year]
- [Specific trigger 2, e.g., first term sheet from an investor]
- [Specific trigger 3, e.g., first employee hired]

---

### Next Steps (In Order)

1. [ ] **Consult a CPA** in [state] to model the exact SE tax savings and confirm reasonable salary for your profession
2. [ ] **Consult a business attorney** in [state] to review state-specific formation requirements for [entity]
3. [ ] **File [Articles of Organization / Certificate of Incorporation]** with [State] Secretary of State
   - Fee: ~$[X] | Processing: [timeframe] | Online filing available: [Yes/No]
4. [ ] **Obtain an EIN** from the IRS (free, takes 10 minutes online at irs.gov/businesses/small-businesses)
5. [ ] **Draft [Operating Agreement / Bylaws]** -- do not use a free online template for a multi-owner business
6. [ ] **File IRS Form 2553** (S-corp election) within 75 days of formation or by March 15 for the current tax year
   *(Include only if S-corp election is recommended)*
7. [ ] **Open a dedicated business bank account** -- required to maintain liability protection
8. [ ] **Register as foreign [entity type]** in [other state] if operating outside formation state
9. [ ] **Set up payroll** if S-corp or C-corp with working owners (ADP, Gusto, or Rippling are standard options)
10. [ ] **Implement bookkeeping** from day one (QuickBooks Online, Xero, or Wave for early-stage)

---

### State-Specific Alerts

*[Include any significant state-level costs, taxes, or requirements specific to the user's state]*

- **[State] note:** [e.g., "California imposes an $800/year minimum franchise tax on LLCs regardless of revenue, plus a Gross Receipts Fee of $900/year for LLCs earning $250K-$499,999. Factor this into your LLC vs. sole prop decision if revenue is near the $250K threshold."]
```

---

## Rules

1. **Always include the disclaimer.** Every output opens with the informational/educational disclaimer. This skill produces analysis, not legal or tax advice. This is non-negotiable and must appear even when the user has not asked for it.

2. **Calculate real SE tax numbers when income is known.** Never leave the self-employment tax analysis abstract. If the user gives you a revenue or income figure, compute the estimated SE tax impact of their current structure vs. an S-corp election. Specific dollar amounts convert an abstract choice into a concrete financial decision.

3. **Filter the comparison table to relevant entities.** Showing five columns when only three are relevant dilutes the analysis and wastes the user's attention. A venture-backed startup founder does not need a detailed sole proprietorship column. A $60K/year sole consultant does not need a C-corp analysis unless they ask.

4. **The reasonable salary is the crux of the S-corp analysis -- explain it carefully.** The "pay yourself a salary and take distributions" framing is widely misunderstood. The IRS will recharacterize unreasonably low salaries as wages, assess back payroll taxes, penalties, and interest, and potentially pursue fraud. Name the benchmark you are using (industry surveys, 60/40 rule, comparables) and flag that a tax professional must confirm it.

5. **Never recommend a Delaware C-corp to a user with no investment ambitions.** Delaware C-corps create California franchise tax obligations for California-based founders (the CA Franchise Tax Board taxes based on the location of operations, not formation). A bootstrapped California founder forming a Delaware C-corp pays Delaware franchise tax AND California's $800 minimum plus corporate taxes. This is a $1,500-$3,000/year unnecessary cost that online formation services never mention.

6. **Always address the "when to switch" question.** Every entity recommendation should include the income level, business milestone, or event that should trigger a revisit of the entity structure. Most businesses start as LLCs and face a real inflection point at $60K-$80K net income (consider S-corp election), at $1M+ net income (consider C-corp retained earnings), or at first investor term sheet (consider C-corp conversion).

7. **Warn explicitly about state non-conformity with S-corp elections.** Tennessee, New Hampshire, New York City (through the General Corporation Tax), and the District of Columbia do not fully recognize S-corp status. Users in these jurisdictions may owe state/local corporate tax even with a federal S-corp election, materially reducing or eliminating the expected savings.

8. **The 83(b) election window is absolute and must be highlighted for any C-corp formation.** An 83(b) election must be filed with the IRS within 30 days of a restricted stock grant. Missing this window cannot be corrected retroactively. For a founder receiving shares subject to vesting (which is almost always the case), failing to file an 83(b) means owing income tax on the appreciated value of shares as they vest -- a potentially catastrophic tax outcome that has financially devastated founders of successful companies.

9. **Separate formation cost from ongoing annual cost in every table.** These numbers are fundamentally different. A Wyoming LLC costs $100 to form and $60/year to maintain. A California LLC costs $70 to form but $800/year minimum plus graduated fees. An S-corp may cost $300-$800 to form and $3,000-$6,000/year in compliance costs. Presenting only one cost dimension gives users a distorted picture.

10. **Do not let "simplicity" recommendations override real liability concerns.** A user with $200K in home equity, $150K in retirement savings, and a service business with client contracts should not stay as a sole proprietor for simplicity. The cost of an LLC ($50-$500 formation + $100-$500/year) is trivially small relative to the asset protection provided. When a user cites simplicity as a reason to stay unincorporated, directly quantify the liability exposure they are accepting.

---

## Edge Cases

**Solo Founder Planning to Raise VC in 12-18 Months:**
Start as a Delaware C-corp even before raising capital. The window to purchase founder shares at a nominal price (e.g., $0.0001/share = $100 for 1,000,000 shares) exists only at formation. If the company has any traction when investors arrive, shares are worth more, and issuing at a low price without justification creates taxable income for founders. Early Delaware C-corp formation locks in low-cost shares, starts the QSBS 5-year clock (potentially worth millions in capital gains exclusion), and ensures the company is investor-ready without a costly and time-consuming conversion. The additional cost of maintaining a Delaware C-corp pre-revenue is $400-$800/year in franchise tax and registered agent fees -- trivial against the potential QSBS benefit.

**Non-US Founder or International Co-Founder:**
S-corp status is automatically disqualified if any shareholder is a non-US person (non-resident alien). An LLC with non-US members triggers FIRPTA withholding requirements, ECI (Effectively Connected Income) analysis, and potentially withholding on distributions to non-US members under IRC §1446. For a US-operating business with non-US participants, a C-corp is almost always the cleanest structure. The non-US founder's home country tax treaty with the US may also affect their optimal structure. This requires international tax counsel -- flag this clearly to the user and do not attempt to resolve it without professional guidance.

**Business Operating in Multiple States:**
The "foreign qualification" requirement creates real cost and compliance burden. A Delaware LLC or corporation that operates physically in California must register as a foreign entity in California, pay California's franchise taxes, file California corporate/LLC returns, and maintain a California registered agent -- in addition to its Delaware obligations. The argument for Delaware incorporation weakens for a business that operates exclusively in one state: forming in the home state is simpler (one registration, one set of filings, no registered agent needed for out-of-state). For a national e-commerce business with no physical presence in any particular state, forming in Wyoming (zero income tax, zero franchise tax, $60/year annual report) or Delaware may genuinely be the most cost-effective option.

**Professional Services Requiring Licensing (Doctors, Lawyers, Dentists, Engineers):**
In many states, licensed professionals cannot operate through a standard LLC or corporation. Instead, they must form a Professional Limited Liability Company (PLLC) or Professional Corporation (PC), regulated under different statutes. The members/shareholders must all be licensed in the same profession in many states. A dental practice in New York, for example, must use a PC or PLLC; a regular LLC is not permitted. PLLC/PC structures limit the liability protection offered by standard LLCs -- typically, personal liability for the member's own professional malpractice remains, though liability for other members' malpractice is generally shielded. Direct the user to their state licensing board's requirements before recommending any entity type for a licensed profession.

**Spouse-Owned Business in a Community Property State:**
In the nine community property states (Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, Wisconsin), a business owned jointly by spouses may qualify for the Qualified Joint Venture (QJV) election under IRC §761(f). A QJV allows married co-owners to report business income on two separate Schedule Cs rather than filing a partnership return (Form 1065), simplifying tax compliance significantly. The QJV requires that (1) both spouses materially participate in the business, (2) they file a joint return, and (3) they both elect QJV treatment. The QJV does not affect liability protection -- a married couple running a sole-proprietorship-based QJV still has no liability shield. For a husband-and-wife business with real liability exposure, a single-member LLC owned by a community property trust, or a multi-member LLC, is preferable.

**Business With IP as Its Primary Asset:**
Consider an IP-holding structure for businesses where the intellectual property (software, patents, trademarks, trade secrets) is the primary asset. An IP holding LLC owns the IP and licenses it to an operating LLC. The operating LLC earns revenue, has employees and contracts, and bears operational liability risk. If the operating company is sued, the IP is held separately and is harder to reach in litigation. This structure also enables more flexible IP licensing to other entities in the future. The downside is administrative complexity (two entities, two sets of filings, intercompany license agreement, transfer pricing considerations). This structure is worth modeling only when the IP has significant standalone value -- not for early-stage companies where the IP exists primarily in the founder's head.

**LLC Converting to C-Corp for a Series A:**
Conversion is a taxable event in some scenarios. If the LLC has appreciated assets (e.g., IP developed internally with zero cost basis), contributing them to a new C-corp in exchange for stock can trigger gain recognition unless the transaction qualifies as a tax-free incorporation under IRC §351 (which requires that the transferors collectively own at least 80% of the new corporation immediately after the exchange). Most startup conversions qualify under §351, but the mechanics must be coordinated with a tax attorney. Practically, the conversion involves: (1) forming a Delaware C-corp, (2) the LLC members contributing their membership interests to the C-corp in exchange for stock (the LLC dissolves into the C-corp through a statutory merger or interest contribution), (3) filing the appropriate tax forms. Investors prefer to see this done cleanly before the Series A closes. The conversion also resets the 83(b) situation -- new restricted stock agreements must be signed and 83(b) elections filed.

---

## Example

**User Input:**
"I'm starting a digital marketing agency with my business partner. We'll both work in the business full time. We're projecting $300K in combined revenue in year one, with profit of around $180K after expenses. We're in Texas, we have no plans to raise investment, and we both have homes and personal savings we want to protect."

---

### Business Entity Comparison: Digital Marketing Agency (Two-Founder Texas Business)

> **Disclaimer:** This comparison is for informational and educational purposes only. It does NOT constitute legal or tax advice. Business entity selection has significant legal, tax, and financial implications that vary by jurisdiction and individual circumstance. Consult a qualified business attorney and CPA before making any entity decisions.

---

### Business Context

| Field | Detail |
|-------|--------|
| **Business description** | Digital marketing agency -- services to business clients |
| **Owner(s)** | 2 co-founders, both US citizens, both working full time in the business |
| **Net income (projected)** | $180,000/year combined ($90,000 per owner at 50/50 split) |
| **Investment plans** | None -- self-funded, revenue-based growth |
| **Employees** | 0 initially; contractors likely |
| **State of operation** | Texas |
| **Assets to protect** | Both owners have homes and personal savings |
| **Long-term goal** | Cash flow business; possible acquisition in 5-10 years |
| **Primary concern** | Liability protection + tax efficiency |

---

### Entity Comparison Table

| Dimension | General Partnership | Multi-Member LLC | Multi-Member LLC + S-Corp Election |
|-----------|--------------------|-----------------|------------------------------------|
| **Liability protection** | None -- each partner personally liable for the other's actions | Yes -- personal assets shielded from business liabilities | Yes -- same as standard LLC |
| **Federal tax treatment** | Pass-through (Form 1065 + K-1s) | Pass-through (Form 1065 + K-1s) | Pass-through (Form 1120-S + K-1s) |
| **SE/payroll tax on owner income** | 15.3% on full distributive share | 15.3% on full distributive share | FICA only on salary; distributions exempt |
| **Estimated annual SE tax (per owner)** | ~$12,100 on $90K share | ~$12,100 on $90K share | ~$8,415 on $55K salary (see below) |
| **Formation cost (Texas)** | $0 (no filing required) | $300 (Texas Certificate of Formation) | $300 + Form 2553 (free) |
| **Annual compliance cost** | ~$400-$800 (Form 1065 + K-1 prep) | ~$600-$1,200 (Form 1065, Texas franchise tax filing) | ~$3,500-$6,000 (payroll, Form 1120-S, K-1s) |
| **Texas franchise tax** | Subject to Texas franchise tax (0.375% of revenue for most service businesses above $1.18M threshold -- likely $0 in year one) | Subject to Texas franchise tax (same) | Subject to Texas franchise tax (same) |
| **Investment compatibility** | Poor | Moderate (converts to C-corp if needed) | Poor (S-corp restrictions limit investors) |
| **Owner restrictions** | No limit; any persons | No limit; any persons or entities | Max 100 US shareholders; one class |
| **Employee equity (stock options)** | No | Profits interests only | Restricted stock; no ISOs |
| **Administrative burden** | Low (dangerously low -- no liability protection) | Low-Medium | Medium-High (payroll required) |

---

### Self-Employment Tax Analysis

| Metric | Multi-Member LLC (Default) | Multi-Member LLC + S-Corp Election |
|--------|---------------------------|-------------------------------------|
| **Net income per owner** | $90,000 | $90,000 |
| **Salary per owner (reasonable comp)** | N/A | $55,000 |
| **SE/FICA taxable income per owner** | $90,000 × 92.35% = $83,115 | $55,000 |
| **SE/FICA tax per owner** | $83,115 × 15.3% = ~$12,715 | $55,000 × 15.3% = ~$8,415 |
| **SE tax savings per owner** | -- | ~$4,300 |
| **Combined SE tax savings (both owners)** | -- | ~$8,600 |
| **Additional S-corp compliance cost** | -- | ~$2,500-$4,000 vs. standard LLC |
| **Net annual benefit (combined)** | -- | ~$4,600-$6,100 |

*Reasonable salary basis: A digital marketing agency founder/operator who would command $50,000-$65,000 in salary as an employee, based on Bureau of Labor Statistics Marketing Manager compensation data for Texas. $55,000 is a defensible midpoint. Confirm with a CPA before electing.*

---

### Situation Analysis: Priority Matrix

| Priority | Importance | Best-Fit Entity |
|----------|------------|-----------------|
| Liability protection (two owners with personal assets at risk) | **Critical** | LLC or Corp -- eliminates General Partnership |
| Tax efficiency at $90K/owner | **High** | LLC with S-Corp election |
| Simplicity (no payroll infrastructure currently) | **Medium** | Standard Multi-Member LLC |
| Investment readiness | **Low** (no plans) | Any of the three above |
| Acquisition readiness in 5-10 years | **Medium** | LLC (converts easily; acquirers often prefer asset purchases, which LLCs handle cleanly) |

---

### Recommendation

**Primary recommendation: Multi-Member Texas LLC with S-Corp Tax Election**

At $90,000 net income per owner, the combined annual SE tax savings of approximately $8,600 exceed the additional S-corp compliance costs by roughly $4,600-$6,100 per year. Over five years, this represents $23,000-$30,500 in retained earnings -- a meaningful sum. The LLC provides the liability protection both founders need given their personal assets. Texas does not impose a state income tax, and the Texas franchise tax will likely be $0 in year one (the no-tax threshold is $1.18M in annualized revenue for 2024). The LLC is also the cleanest structure for a potential acquisition in 5-10 years, as buyers can execute an asset purchase without the double-taxation complications of a C-corp.

**Runner-up: Standard Multi-Member LLC (without S-Corp election)**

Choose this if either partner is not comfortable managing payroll or if the business has slow months that produce variable income. S-corp payroll must be run regardless of whether the business has cash -- owners must receive regular W-2 wages even in loss months. If the agency's income is highly seasonal or unpredictable in year one, start as a standard LLC, monitor net income, and make the S-corp election for the following tax year once income stabilizes.

**Eliminated options:**
- **General Partnership:** Both founders own homes and personal savings. A general partnership exposes each partner to unlimited liability for the other's actions. This is untenable and should not be considered.
- **Sole Proprietorship:** There are two owners; this entity is legally unavailable for a multi-owner business.
- **C-Corporation:** No investment planned, no IPO path, and the double taxation at the current income level would result in higher total tax than a pass-through structure. Not appropriate for this situation.

**When to revisit this decision:**
- If either owner's net income share exceeds $168,600 (the Social Security wage base), the marginal SE tax rate drops to 2.9%, and the S-corp salary may need to be recalibrated
- If the agency raises outside investment (angel, PE firm), the S-corp structure will need to be restructured -- S-corps cannot have corporate shareholders or more than 100 shareholders
- If the business grows to a point where significant profits are being reinvested (not distributed), model whether a C-corp's 21% retained earnings rate becomes more favorable than the partners' personal rates
- If either founder's situation changes significantly (divorce, estate planning, relocation to a state without pass-through tax conformity)

---

### Next Steps (In Order)

1. [ ] **Consult a Texas CPA** to confirm the reasonable salary for each founder, model exact SE tax savings for your income projections, and confirm the S-corp election timing
2. [ ] **Consult a Texas business attorney** to review the Operating Agreement and confirm LLC formation requirements
3. [ ] **File Certificate of Formation** with the Texas Secretary of State online at sos.state.tx.us
   - Fee: $300 | Processing: 2-3 business days online | Expedite available for $25
4. [ ] **Draft a detailed Operating Agreement** -- do not use a free template for a two-founder business. The Operating Agreement must address: ownership percentage, profit/loss allocation, decision-making authority, what happens if one partner wants to leave, buy-sell provisions, and non-compete covenants
5. [ ] **Obtain an EIN** from the IRS (free, at irs.gov/businesses)
6. [ ] **Open a dedicated business bank account** under the LLC's name and EIN before conducting any transactions
7. [ ] **File IRS Form 2553** (S-Corp election) -- must be filed within 75 days of LLC formation OR by March 15 of the tax year for which the election is to be effective
8. [ ] **Set up payroll** for both owner-employees through a payroll service (Gusto is commonly used for small S-corps; run payroll at least quarterly, ideally monthly)
9. [ ] **Establish a bookkeeping system** from day one (QuickBooks Online or Xero recommended; sync with business bank account)
10. [ ] **File a Texas Franchise Tax Report** annually (due May 15). Most small businesses under $1.18M in annualized revenue file the No Tax Due report -- still required even if no tax is owed

---

### Texas-Specific Alerts

- **Texas franchise tax:** The 2024 no-tax threshold is $1.18M in annualized total revenue. If the agency earns $300K in year one, no franchise tax is owed, but the No Tax Due report must still be filed by May 15.
- **Texas does not have a state income tax** -- pass-through income is not taxed at the state level. This makes the LLC/S-corp structure particularly favorable compared to states like California or New York that impose state income tax on pass-through income.
- **Texas does not require an Operating Agreement by statute**, but it is strongly recommended for a two-founder business. Without one, the Texas Business Organizations Code's default rules govern disputes -- these defaults are rarely what either partner actually wants.
- **Texas registered agent:** An LLC must have and maintain a registered agent with a physical Texas address. Either owner can serve as registered agent (free) or a commercial registered agent service can be used ($50-$200/year).
