---
name: sales-proposal
description: |
  Produces a client-facing sales proposal with executive summary, solution
  overview, ROI calculation, investment details, and next steps using
  proposal structure methodology. Use when the user asks to create a sales
  proposal, write a client proposal, build a deal proposal, draft a
  solution proposal for a prospect, or prepare a formal offer document.
  Do NOT use for investor pitch decks (use startup-pitch-narrative),
  internal business cases (use business-plan), or RFP responses (requires
  specialized procurement format).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales proposal planning template"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Sales Proposal

## When to Use

- User asks to create a sales proposal or client proposal
- User wants to write a formal proposal for a prospect after discovery
- User needs to build a solution proposal with pricing and ROI
- User asks to draft a deal proposal that closes business
- User wants to prepare a proposal document to send after a demo
- Do NOT use when: user needs an investor pitch (use `startup-pitch-narrative`), internal business plan (use `business-plan`), RFP response (requires specialized procurement format), or statement of work (use project management skills)

## Process

1. **Collect proposal context.** Before producing the proposal, gather:
   - Company name and product or service being proposed
   - Prospect company name, industry, and size
   - Decision maker's name and title
   - The prospect's specific problem (from discovery call)
   - Proposed solution and scope
   - Pricing structure (per user, flat fee, tiered, custom)
   - Implementation timeline
   - Key competitors the prospect is evaluating
   - Proof points available (case studies, ROI data, testimonials)
   - Proposal deadline or decision timeline

2. **Write the executive summary.** Lead with the prospect's problem:
   - State the prospect's challenge in their language (from discovery)
   - Summarize the proposed solution in 2-3 sentences
   - State the expected outcome with a specific metric
   - Keep the executive summary to one page maximum
   - Write this so the decision maker who reads only this section understands the value

3. **Detail the solution.** Describe what the prospect gets:
   - Map each solution component to a specific problem identified in discovery
   - Include what is in scope and what is out of scope
   - Describe the implementation approach and timeline
   - List key deliverables with expected completion dates
   - Include any assumptions or dependencies

4. **Build the ROI case.** Quantify the value:
   - Calculate the cost of the current problem (from implication questions)
   - Project the expected improvement with the solution
   - Show the ROI: return divided by investment
   - Include payback period: months until the investment is recovered
   - Use conservative assumptions and state them explicitly

5. **Present the investment.** Frame pricing as investment:
   - Show the total investment clearly (no hidden costs)
   - Break down by component if the solution has multiple parts
   - Include payment terms and schedule
   - Frame the investment against the ROI calculation from the previous section
   - If offering multiple options, present 3 tiers (recommended option in the middle)

6. **Close with next steps.** End with a specific action:
   - Propose a specific next step with timeline
   - State the proposal validity period
   - Include who to contact and how
   - List what the prospect needs to provide to move forward

## Output Format

```
## Sales Proposal: [Solution Name] for [Prospect Company]

**Prepared for:** [Decision Maker Name], [Title]
**Prepared by:** [Your Name], [Your Title], [Your Company]
**Date:** [Date]
**Valid until:** [Expiry date]
**Proposal Reference:** [Reference number]

---

### Executive Summary

[Prospect Company] is experiencing [specific problem from discovery]. This is costing [quantified impact: $X per month, Y hours per week, Z% attrition rate].

We propose [solution name and brief description] to [expected outcome]. Based on similar implementations with [reference customer], we project [specific metric improvement] within [timeframe].

**Projected ROI:** [X:1 return on investment within Y months]

---

### Your Challenge

**Current Situation:**
- [Problem 1 with quantified impact]
- [Problem 2 with quantified impact]
- [Problem 3 with quantified impact]

**Cost of Inaction:**
| Factor | Current Cost | Annual Impact |
|--------|-------------|---------------|
| [Time lost] | [X hours/week] | [$X/year] |
| [Errors/risk] | [X incidents/month] | [$X/year] |
| [Opportunity cost] | [Description] | [$X/year] |
| **Total** | | **[$X/year]** |

---

### Proposed Solution

**Overview:** [2-3 sentence solution summary]

| Component | What It Solves | Deliverable |
|-----------|---------------|-------------|
| [Component 1] | [Problem it addresses] | [What they receive] |
| [Component 2] | [Problem it addresses] | [What they receive] |
| [Component 3] | [Problem it addresses] | [What they receive] |

**In Scope:**
- [Included item 1]
- [Included item 2]
- [Included item 3]

**Out of Scope:**
- [Excluded item 1 -- available as add-on if needed]
- [Excluded item 2]

---

### Implementation Timeline

| Phase | Duration | Activities | Milestone |
|-------|----------|-----------|-----------|
| Phase 1: [Setup] | [Weeks] | [Activities] | [Deliverable] |
| Phase 2: [Launch] | [Weeks] | [Activities] | [Deliverable] |
| Phase 3: [Optimize] | [Weeks] | [Activities] | [Deliverable] |

**Assumptions:**
- [Assumption 1 -- what the prospect needs to provide]
- [Assumption 2 -- timeline dependency]

---

### Proof of Results

**Case Study: [Customer Name]**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| [Metric 1] | [Value] | [Value] | [% change] |
| [Metric 2] | [Value] | [Value] | [% change] |

"[Customer testimonial quote]" -- [Name, Title, Company]

**Additional References:**
- [Customer 2]: [One-line result]
- [Customer 3]: [One-line result]

---

### ROI Projection

| Metric | Calculation | Value |
|--------|------------|-------|
| Annual cost of current problem | [From "Cost of Inaction" above] | [$X] |
| Projected improvement | [X% of current cost eliminated] | [$X] |
| Annual investment | [From pricing below] | [$X] |
| **Net annual benefit** | [Improvement - investment] | **[$X]** |
| **ROI** | [Net benefit / investment] | **[X:1]** |
| **Payback period** | [Investment / monthly benefit] | **[X months]** |

*Assumptions: [State conservative assumptions used in calculation]*

---

### Investment

**Option A: [Recommended]**
| Item | Price |
|------|-------|
| [Component 1] | [$X] |
| [Component 2] | [$X] |
| [Implementation/setup] | [$X] |
| **Total Annual Investment** | **[$X]** |

**Payment Terms:** [Monthly/quarterly/annual, net 30, etc.]

[If offering tiers:]

| | Starter | Professional (Recommended) | Enterprise |
|---|---------|---------------------------|------------|
| [Feature 1] | [Included/Limited] | [Included] | [Included] |
| [Feature 2] | [Not included] | [Included] | [Included] |
| [Feature 3] | [Not included] | [Not included] | [Included] |
| **Price** | **[$X/year]** | **[$X/year]** | **[$X/year]** |

---

### Next Steps

1. **[Action]** -- [Who does it] by [Date]
2. **[Action]** -- [Who does it] by [Date]
3. **[Action]** -- [Who does it] by [Date]

**To proceed:** [Specific instruction -- sign and return, reply to confirm, schedule call]

**Questions?** Contact [Name] at [email/phone]

**This proposal is valid until [date].**
```

## Rules

1. NEVER produce a proposal without first collecting prospect context, specific problems, and pricing details
2. ALWAYS lead the executive summary with the prospect's problem, not the seller's product description
3. The cost of inaction must be quantified in dollars, hours, or risk -- not described in vague terms
4. Every solution component must map directly to a problem identified in discovery
5. ROI calculations must use conservative assumptions and state those assumptions explicitly
6. Pricing must be transparent -- no hidden fees, no "contact us for pricing" unless the user specifically requests it
7. The proposal must include both in-scope and out-of-scope sections to prevent scope creep
8. Next steps must include specific dates and responsible parties, not "we will follow up"
9. Include a proposal validity date -- open-ended proposals create no urgency
10. Proof of results must include specific metrics from named customers, not generic claims

## Edge Cases

- **Early-stage company with no case studies:** Replace the proof section with industry data, methodology explanation, and pilot program offer. Frame the proof as "here is what companies adopting this approach see on average" and offer a paid pilot with defined success metrics.
- **Complex enterprise deal with multiple decision makers:** Create an executive summary version (1 page) for the economic buyer and a detailed version for the evaluation team. The executive summary focuses on ROI and strategic impact. The detailed version includes technical specifications and implementation details.
- **Competitive displacement (replacing an incumbent):** Add a transition plan section covering migration, data transfer, parallel running period, and training. Address switching costs explicitly and show how the transition risk is managed. Do not attack the incumbent -- focus on gaps the prospect identified.
- **Custom or variable pricing:** Use a pricing framework with clear variables and ranges. Include a sample calculation for the prospect's specific situation. State what factors affect final pricing and when exact pricing will be confirmed.
- **Very small deal (under $5K):** Shorten the proposal to 2-3 pages. Combine executive summary and solution into one section. Simplify the ROI calculation. The proposal length should be proportional to the deal size -- a 10-page proposal for a $3K deal signals misalignment.

## Example

**Input:** "Create a sales proposal for our employee scheduling software for Mario's Pizza, a 5-location pizza chain. The GM, Tony Rossi, is the decision maker. They currently use paper schedules, spend 5+ hours/week per location on scheduling, and had 3 overtime violations last quarter. Our software is $3/employee/month. They have about 120 employees across all locations."

**Output:**

## Sales Proposal: [Product] Employee Scheduling for Mario's Pizza

**Prepared for:** Tony Rossi, General Manager, Mario's Pizza
**Prepared by:** [Your Name], [Your Title], [Your Company]
**Date:** [Current date]
**Valid until:** [Date + 30 days]

---

### Executive Summary

Mario's Pizza is spending 25+ hours per week across 5 locations on manual scheduling and experienced 3 overtime violations last quarter. This is costing an estimated $52,000 per year in management time and compliance risk.

We propose [Product] automated scheduling to eliminate manual schedule building, enforce labor law compliance automatically, and give employees self-service access to their schedules and shift swaps. Based on similar restaurant implementations, we project an 80% reduction in scheduling time and zero overtime violations within 60 days.

**Projected ROI:** 12:1 return on investment within the first year.

---

### Your Challenge

**Current Situation:**
- 5 GMs spend 5+ hours each per week building and adjusting paper schedules
- 3 overtime violations last quarter, averaging $800 per violation in penalties
- No visibility into labor costs until after payroll runs
- Employees call managers directly for shift swaps, creating constant interruption

**Cost of Inaction:**

| Factor | Current Cost | Annual Impact |
|--------|-------------|---------------|
| GM scheduling time (25 hrs/week at $28/hr) | 25 hrs/week | $36,400/year |
| Overtime violations (~12/year at $800) | 3/quarter | $9,600/year |
| Shift swap coordination (est. 5 hrs/week) | 5 hrs/week | $7,280/year |
| **Total** | | **$53,280/year** |

---

### Proposed Solution

| Component | What It Solves | Deliverable |
|-----------|---------------|-------------|
| Auto-scheduling engine | Manual schedule creation | Compliant schedules generated in minutes based on availability, skills, and labor rules |
| Labor law compliance module | Overtime violations | Automatic enforcement of overtime limits, break requirements, and minor labor rules |
| Employee mobile app | Shift swap interruptions | Self-service schedule viewing, shift swap requests, and availability management |

**In Scope:**
- Software licenses for all 5 locations (120 employees)
- Initial configuration and labor rule setup
- 2-hour training session for all 5 GMs
- 30-day onboarding support

**Out of Scope:**
- Payroll integration (available as add-on at $1/employee/month)
- Custom reporting beyond standard dashboards

---

### Investment

| Item | Price |
|------|-------|
| [Product] scheduling (120 employees at $3/employee/month) | $4,320/year |
| Setup and configuration (one-time) | $0 (included) |
| Training (one-time) | $0 (included) |
| **Total Annual Investment** | **$4,320/year** |

**Payment Terms:** Monthly billing ($360/month), cancel anytime after initial 12-month term.

---

### ROI Projection

| Metric | Calculation | Value |
|--------|------------|-------|
| Annual cost of current problem | Management time + violations + coordination | $53,280 |
| Projected improvement (80% reduction) | $53,280 x 80% | $42,624 |
| Annual investment | 120 employees x $3 x 12 months | $4,320 |
| **Net annual benefit** | $42,624 - $4,320 | **$38,304** |
| **ROI** | $38,304 / $4,320 | **8.9:1** |
| **Payback period** | $4,320 / ($42,624 / 12) | **1.2 months** |

*Assumptions: 80% time reduction based on average of similar restaurant deployments. Overtime violations eliminated within 60 days of go-live. GM hourly cost estimated at $28/hr loaded.*

---

### Next Steps

1. **Sign this proposal** -- Tony Rossi by [Date + 7 days]
2. **Kickoff call** -- [Your Company] configures locations and labor rules -- Week 1
3. **GM training** -- 2-hour session for all 5 GMs -- Week 2
4. **Go live** -- All 5 locations on automated scheduling -- Week 3

**To proceed:** Reply to this email confirming acceptance, and I will send the service agreement and schedule the kickoff call.

**Questions?** Contact [Your Name] at [email] or [phone].

**This proposal is valid until [Date + 30 days].**
