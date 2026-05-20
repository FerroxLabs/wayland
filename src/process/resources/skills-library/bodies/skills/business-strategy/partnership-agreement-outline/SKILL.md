---
name: partnership-agreement-outline
description: |
  Creates a non-legal partnership discussion guide covering roles, equity split, decision rights, vesting, compensation, intellectual property, exit provisions, and dispute resolution for co-founders and business partners. Use when the user asks about partnership agreements, co-founder agreements, equity splits, co-founder terms, or business partnership structure.
  Do NOT use for legal contract drafting (recommend an attorney), incorporation decisions (use incorporation-comparison), or investor term sheets (use fundraising-narrative).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship planning strategy decision-making template"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Partnership Agreement Outline

**Important:** This skill produces a discussion guide and term outline for co-founders and business partners. It is NOT a legal document and does NOT constitute legal advice. The output is designed to help partners align on key terms before engaging an attorney to draft a legally binding agreement. Users should consult a qualified attorney to draft the actual partnership or operating agreement for their specific jurisdiction and situation.

## When to Use

**Use this skill when:**
- User is starting a business with a co-founder and needs to discuss partnership terms
- User wants to structure an equity split with a business partner
- User asks about co-founder agreements, partnership terms, or equity allocation
- User needs a framework for discussing roles, responsibilities, and exit provisions with a partner
- User wants to prepare for a conversation with a co-founder about business terms

**Do NOT use this skill when:**
- User needs a legally binding contract (recommend an attorney)
- User is deciding which business entity to form (use `incorporation-comparison`)
- User needs investor terms or fundraising structure (use `fundraising-narrative`)
- User needs a cap table with dilution modeling (use `cap-table-basics`)

## Process

1. **Understand the partnership context.** Ask the user for:
   - How many partners or co-founders?
   - What is each partner's role? (technical, business, operations, domain expert)
   - What is each partner contributing? (cash, time, skills, IP, customers, reputation)
   - Is this a new venture or an existing business adding a partner?
   - Will all partners work full-time on the business?
   - Has any partner already invested money or time?
   - What is the expected timeline to revenue or fundraising?

2. **Address the equity split.** This is the most emotionally charged topic. Framework for the conversation:

   **Contribution-based approach:** Assess each partner's contribution across dimensions:
   - **Idea:** Who originated the concept? (typically worth 5-10%, not 50%)
   - **Domain expertise:** Who has unique knowledge of the market or technology?
   - **Execution commitment:** Who is working full-time vs part-time?
   - **Capital contribution:** Who is investing money?
   - **Network and customers:** Who brings existing relationships?
   - **Opportunity cost:** What is each partner giving up? (salary, other opportunities)

   **Common approaches:**
   - Equal split (50/50 or 33/33/33): Simple, avoids hard conversations, but often unfair if contributions differ significantly
   - Weighted split based on contributions: More complex, but more equitable
   - Dynamic equity (Slicing Pie model): Equity is calculated based on actual tracked contributions over time. Complex to administer but fair.

   **The hard conversation:** If partners cannot agree on equity after an honest discussion, that disagreement is a signal about alignment. Better to discover it now than after the company is worth something.

3. **Define vesting.** Vesting protects all partners from a co-founder who leaves early:

   - **Standard vesting:** 4-year vesting with 1-year cliff. Each partner "earns" their equity over 4 years. If a partner leaves before 1 year, they receive nothing. After the cliff, equity vests monthly or quarterly.
   - **Why vesting matters:** Without vesting, a partner who leaves after 3 months keeps their full equity stake. The remaining partners do all the work but share ownership with someone who is no longer contributing.
   - **Acceleration clauses:** What happens to unvested equity if the company is acquired? Single-trigger (accelerates on acquisition) or double-trigger (accelerates only if the partner is terminated after acquisition).
   - **Vesting is not about trust.** It is about protecting all partners, including the one who leaves, by ensuring a fair outcome regardless of what happens.

4. **Define roles and decision rights.** Ambiguity about who decides what causes most co-founder conflicts:

   - **CEO/final decision maker:** One person must have final say on day-to-day operational decisions. Shared leadership works in theory but creates paralysis in practice.
   - **Decision categories:**
     - Day-to-day operations (one person decides)
     - Hiring and firing (defined threshold, e.g., CEO for under $X salary, board vote for above)
     - Spending (spending authority limits per person)
     - Strategic direction (requires unanimous or majority consent)
     - Equity and fundraising (requires unanimous consent)
   - **Deadlock resolution:** What happens when partners cannot agree? Options: mediator, advisory board vote, coin flip on minor issues, predetermined tiebreaker

5. **Define compensation and expenses.** Money issues addressed early prevent resentment:

   - **Salary:** Will partners take a salary? When does salary start? (often deferred until revenue or funding)
   - **Expense reimbursement:** What business expenses are reimbursable? What is the approval process?
   - **Profit distribution:** How are profits distributed? Pro-rata to equity, or a different formula?
   - **Loans to the company:** If a partner loans money to the company, document terms (interest rate, repayment priority)
   - **Sweat equity accounting:** If one partner works without pay longer than others, is that additional equity, a loan, or a salary deferral?

6. **Define intellectual property ownership.** IP clarity prevents lawsuits:

   - All IP created for the business belongs to the business entity, not individual partners
   - Pre-existing IP that a partner brings to the business: is it assigned, licensed, or retained personally?
   - What happens to IP if a partner leaves? (it stays with the company)
   - Non-compete and non-solicitation terms: scope, duration, geographic limits

7. **Define exit provisions.** Every partnership ends eventually. Plan for it:

   - **Voluntary departure:** What happens when a partner wants to leave?
   - **Buyout mechanism:** How is the departing partner's share valued? (formula, independent valuation, or predetermined method)
   - **Right of first refusal:** Can remaining partners buy the departing partner's shares before outside parties?
   - **Forced departure:** Under what circumstances can a partner be removed? (unanimous vote of other partners, cause-based termination)
   - **Death or disability:** What happens to a partner's share if they die or become permanently disabled? (life insurance buyout, transfer to estate, redemption by company)
   - **Drag-along and tag-along rights:** If majority partners sell, can they compel minority to sell (drag-along)? If majority sells, can minority participate at the same price (tag-along)?

8. **Define dispute resolution.** Lawsuits between partners destroy companies:

   - **Mediation first:** Agree to attempt mediation before any legal action
   - **Arbitration:** Binding arbitration is faster and cheaper than litigation
   - **Governing law:** Which state's laws govern the agreement?
   - **Advisory board:** Consider establishing a 1-3 person advisory board to consult on disputes

## Output Format

```
## Partnership Discussion Guide: [Business Name]

**Disclaimer:** This is a discussion guide for business partners, NOT a legal document. It does NOT constitute legal advice. Use this outline to align on key terms, then engage a qualified attorney to draft a legally binding agreement for your specific situation and jurisdiction.

---

### Partners

| Partner | Role | Commitment | Key Contribution |
|---------|------|-----------|-----------------|
| [Name] | [CEO / CTO / COO / etc.] | [Full-time / Part-time / Advisory] | [What they bring: skills, capital, IP, network] |
| [Name] | [Role] | [Commitment] | [Contribution] |

---

### Equity Split

| Partner | Equity % | Rationale |
|---------|---------|-----------|
| [Name] | [X%] | [Based on: role, commitment, capital, expertise] |
| [Name] | [X%] | [Based on: role, commitment, capital, expertise] |
| **Option pool** | [X%] | Reserved for future employees/advisors |

**Equity method:** [Equal split / Contribution-weighted / Dynamic (Slicing Pie)]

---

### Vesting Schedule

| Term | Value |
|------|-------|
| **Vesting period** | [4 years standard] |
| **Cliff** | [1 year standard] |
| **Vesting frequency** | [Monthly / Quarterly after cliff] |
| **Acceleration** | [None / Single-trigger / Double-trigger] |
| **Pre-vesting credit** | [X months credited for work already done, if applicable] |

---

### Roles and Decision Rights

| Decision Type | Who Decides | Approval Required |
|--------------|-------------|-------------------|
| Day-to-day operations | [CEO / designated partner] | None |
| Hiring (under $[X] salary) | [CEO] | None |
| Hiring (over $[X] salary) | [All partners] | Majority / Unanimous |
| Spending under $[X] | [Any partner] | None |
| Spending $[X] - $[X] | [CEO] | Notification to partners |
| Spending over $[X] | [All partners] | Unanimous |
| Strategic direction / pivots | [All partners] | Majority / Unanimous |
| Equity issuance / fundraising | [All partners] | Unanimous |
| Selling the company | [All partners] | [Majority / Unanimous] |

**Deadlock resolution:** [Mediation / Advisory board vote / Designated tiebreaker]

---

### Compensation

| Term | Value |
|------|-------|
| **Starting salary** | [$X / Deferred until {milestone}] |
| **Salary review** | [Annually / After fundraise / After profitability] |
| **Expense reimbursement** | [Policy: pre-approved over $X] |
| **Profit distribution** | [Pro-rata to equity / Defined formula] |
| **Partner loans** | [Terms if applicable: interest rate, repayment priority] |

---

### Intellectual Property

| Term | Value |
|------|-------|
| **New IP ownership** | All IP created for the business belongs to the business entity |
| **Pre-existing IP** | [Assigned to company / Licensed to company / Retained by partner] |
| **IP on departure** | Remains with the company |
| **Non-compete** | [Duration] in [scope/geography] |
| **Non-solicitation** | [Duration] -- cannot recruit employees or solicit customers |

---

### Exit Provisions

| Scenario | What Happens |
|----------|-------------|
| **Partner leaves voluntarily** | [Unvested equity forfeited, vested equity subject to buyout at {valuation method}] |
| **Partner terminated for cause** | [All unvested equity forfeited, vested equity bought at {discount / fair value}] |
| **Partner terminated without cause** | [Accelerated vesting of {X months}, buyout at fair value] |
| **Death or disability** | [Company or partners buy shares at {valuation method}, funded by insurance if available] |
| **Right of first refusal** | [Remaining partners have X days to match any outside offer] |
| **Drag-along** | [{Majority threshold}% can compel all partners to sell] |
| **Tag-along** | [Minority partners can join any sale at same terms] |

**Valuation method for buyouts:** [Formula / Independent appraiser / Revenue multiple / Book value]

---

### Dispute Resolution

| Step | Process |
|------|---------|
| 1 | Direct conversation between partners (30 days) |
| 2 | Mediation with neutral third party |
| 3 | Binding arbitration under [rules, e.g., AAA] in [city/state] |
| **Governing law** | [State] |

---

### Discussion Checklist

Before meeting with an attorney, partners should align on:

- [ ] Equity percentages and rationale
- [ ] Vesting terms (period, cliff, acceleration)
- [ ] Who is CEO / final decision-maker
- [ ] Spending authority limits
- [ ] Starting salary and when it begins
- [ ] IP ownership (especially pre-existing IP)
- [ ] Non-compete scope and duration
- [ ] What happens if a partner leaves in year one
- [ ] What happens if the company is acquired
- [ ] How disputes will be resolved
```

## Rules

1. ALWAYS include the legal disclaimer prominently. This skill produces a discussion guide, NOT a legal document. The output is designed to prepare partners for a conversation with an attorney.
2. ALWAYS include vesting. A partnership agreement without vesting is the number one cause of co-founder disputes. Every partner should vest, including the founder who originated the idea.
3. NEVER suggest a 50/50 split as the default. Equal splits avoid hard conversations but often create resentment when contributions are unequal. Present contribution-based approaches and let partners decide.
4. ALWAYS define what happens when a partner leaves. Exit provisions are the most important part of the agreement and the most commonly omitted. If partners do not discuss exits upfront, they will negotiate them under duress.
5. ALWAYS separate equity from decision rights. A partner can own 40% of the company without having 40% of the operational decision-making power. Equity is ownership. Decision rights are governance.
6. Include a deadlock resolution mechanism. Two equal partners who disagree on a critical issue need a predetermined tiebreaker. Without one, the company is paralyzed.
7. Address IP ownership explicitly. In many jurisdictions, IP created by an individual belongs to that individual unless there is a written assignment. The partnership agreement must assign all business-related IP to the entity.
8. Include non-compete and non-solicitation terms. These protect the business if a partner leaves and starts a competing venture or recruits employees.
9. NEVER provide specific legal language or clauses. This skill outlines terms for discussion. The attorney converts discussion terms into enforceable legal language appropriate for the jurisdiction.
10. Address the money conversation directly. Deferred salary, expense policies, and profit distribution cause more co-founder conflict than equity splits. Define these terms explicitly.

## Edge Cases

- **Unequal commitment (one full-time, one part-time):** Equity should reflect actual commitment, not just the idea or the relationship. A full-time partner contributing 50+ hours per week should generally receive more equity than a part-time partner contributing 10 hours per week. Vesting based on hours or milestones (rather than time only) can help when commitments differ.

- **One partner contributes capital, the other contributes labor:** Treat the capital contribution as either: (a) a loan with defined repayment terms, separate from equity, or (b) an equity allocation based on the capital amount relative to total company value. Mixing capital and labor in a single equity split without distinguishing them leads to disagreements about what the capital was "worth."

- **Adding a partner to an existing business:** The existing business has value. The new partner is joining something already built. Structure this as: the new partner receives equity (with vesting) in exchange for defined contributions (capital, skills, time). The existing partner's pre-existing equity should be considered vested (or partially vested). An independent valuation of the existing business helps establish fair terms.

- **Three or more co-founders:** Decision rights become more complex. Consider: majority vote for most decisions, unanimous consent for major decisions (equity, sale, dissolution). Establish a clear CEO with operational authority to prevent three-way deadlocks. Vesting is even more important with three or more founders because the probability of at least one departure increases.

- **Romantic partners or family members starting a business:** All of the same terms apply, and they are more important, not less. Family and romantic relationships make it harder to have honest business conversations, which is exactly why the terms should be written down and agreed upon in advance. Include a specific provision for what happens to the business if the personal relationship changes.

## Example

**Input:** "My friend and I want to start a SaaS company together. I am the developer and will build the product. She has the domain expertise and will handle sales and business development. We are both going full-time. How should we structure the partnership?"

**Output:**

## Partnership Discussion Guide: [SaaS Venture]

**Disclaimer:** This is a discussion guide, NOT a legal document. Engage a qualified attorney to draft a legally binding agreement.

### Partners

| Partner | Role | Commitment | Key Contribution |
|---------|------|-----------|-----------------|
| [You] | CTO / Co-founder | Full-time | Product development, technical architecture |
| [Friend] | CEO / Co-founder | Full-time | Domain expertise, sales, business development |

### Equity Split Options

| Approach | You | Friend | Option Pool | Rationale |
|----------|-----|--------|-------------|-----------|
| **Option A: Equal** | 45% | 45% | 10% | Both full-time, complementary skills, equal commitment |
| **Option B: Weighted** | 40% | 50% | 10% | Domain expertise + sales drives early revenue; technical skills are more replaceable |
| **Option C: Weighted** | 50% | 40% | 10% | Product is the core asset; technology is the differentiator |

**Recommended approach:** Start with Option A (equal) if both partners are truly equal in commitment, risk, and opportunity cost. Adjust if one partner has significantly more relevant experience, is contributing capital, or is taking on more risk.

### Vesting

| Term | Value |
|------|-------|
| **Period** | 4 years |
| **Cliff** | 1 year |
| **Vesting** | Monthly after cliff |
| **Acceleration** | Double-trigger (accelerates only if terminated within 12 months after acquisition) |

### Decision Rights

| Decision | Who Decides |
|----------|-------------|
| Product features and technical architecture | CTO (you) |
| Sales strategy, pricing, partnerships | CEO (friend) |
| Hiring, major spending (over $5,000), fundraising | Both, unanimous |
| Company sale or dissolution | Both, unanimous |

### Compensation

| Term | Value |
|------|-------|
| **Starting salary** | Deferred until $10K MRR or seed funding |
| **Post-milestone salary** | Market rate minus 20% (startup discount) |
| **Equity** | Compensates for deferred salary period |

### Key Discussion Points Before Seeing Attorney

1. Are you truly both willing to work without salary for 6-12 months?
2. If one of you leaves after 8 months, is 0% equity (before cliff) fair?
3. Who makes the final call if you disagree about the product roadmap?
4. What happens if one of you gets a job offer you cannot refuse?
5. If an acquirer offers $1M in year 2, would you both sell?
