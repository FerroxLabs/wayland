---
name: project-proposal
description: |
  Writes internal project proposals with problem statement, proposed solution,
  resource requirements, ROI estimate, and implementation timeline for securing
  organizational buy-in. Use when the user needs to propose a project internally,
  get budget approval, or pitch an initiative to leadership. Do NOT use for
  client-facing business proposals (use `business-proposal`), academic grant
  proposals (use `grant-proposal-writing`), or RFP responses (use `rfp-response`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "proposal writing planning"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Project Proposal Writing

## When to Use

Use this skill when any of the following conditions apply:

- The user needs to pitch an internal project to leadership, a steering committee, or a department head to secure budget, headcount, or executive sponsorship
- The user needs to justify a capital expenditure, tool purchase, or process change that requires sign-off above their own authority level
- The user is building a business case for a technology initiative, operational improvement, organizational restructuring, or strategic program
- The user needs to formalize an idea that has been discussed informally and now requires documented approval to move forward
- The user is requesting resources -- people, time, money, or access -- that are not already allocated in the current budget cycle
- The user needs to compete for internal funding (e.g., annual planning cycles, innovation funds, discretionary budgets) against other proposed initiatives
- The user is creating a "pre-mortem" document to socialize risk and establish accountability before a project begins

**Do NOT use this skill when:**

- The audience is external (a client, partner, or prospect) -- use `business-proposal` instead
- The document is a response to a formal tender, bid, or government procurement -- use `rfp-response` instead
- The user needs an academic or nonprofit funding request -- use `grant-proposal-writing` instead
- The user needs to summarize a project that is already approved and underway -- use `project-status-report` instead
- The user needs to condense an existing long document into a shorter summary -- use `executive-summary` instead
- The project scope is already agreed upon and the user only needs to plan execution -- use `project-plan` instead
- The user is writing a retrospective on a completed project -- that requires a separate post-mortem or lessons-learned skill

---

## Process

### Step 1: Conduct a Structured Intake Before Writing a Single Word

Proposals fail when written from the proposer's perspective rather than the approver's. Before drafting, gather the following information explicitly:

- **The problem, not the solution:** Ask "what is going wrong, what opportunity is being missed, or what organizational risk is unmanaged?" before the user describes what they want to build
- **The approver profile:** Who is making the decision? What is their role, what metrics do they own, and what keeps them up at night? A CFO cares about payback period and cash flow timing; a CTO cares about technical debt, integration risk, and team capacity; a COO cares about operational disruption and change management risk
- **The organizational moment:** Is this proposal timed to a budget cycle, a strategic planning session, a recent incident, or a competitive threat? Timing dramatically affects how the proposal should be framed
- **Existing constraints:** What budget envelope is realistic? Has similar work been proposed or rejected before? Are there political sensitivities (team ownership, vendor relationships, previous failed projects in this area)?
- **The strength of the evidence:** Does the user have hard data (cost per incident, revenue lost, hours wasted, error rates) or soft signals (anecdotal complaints, rough estimates, gut feel)? Know this before writing -- it determines how much hedging language is needed
- **The sponsorship situation:** Does the user have a champion in leadership who already supports the idea, or is this a cold pitch? Proposals with a named executive sponsor have a significantly higher approval rate

### Step 2: Frame the Problem Using the Problem Anatomy Model

The problem statement is the most important section of any proposal. Decision-makers approve solutions to problems, not interesting ideas. A rigorous problem statement has five components:

- **Current state description:** What is happening today, in specific, observable terms (not "support is overwhelmed" -- "the support team receives 180 inbound requests per week and handles them through a single shared email inbox with no assignment logic")
- **Quantified cost of the current state:** Translate pain into dollars, hours, or risk level. Use at least two of these quantification lenses:
  - *Direct cost:* Labor hours wasted × hourly loaded cost (salary + benefits + overhead, typically 1.25x--1.4x base salary)
  - *Opportunity cost:* Revenue not captured because of the limitation
  - *Risk cost:* Probability × impact of the risk event occurring (e.g., a 30% chance of a $200K compliance fine = $60K expected loss)
  - *Replacement cost:* What it would cost to fix the damage after the problem causes harm
- **Root cause:** Why does the problem exist? This is critical -- it proves you understand the problem deeply enough to solve it, and it pre-empts "why hasn't this already been fixed?"
- **Trajectory:** Is the problem static, worsening, or accelerating? Proposals that show a worsening trend ("customer base grew 30% this year; support tickets grew 47%") create urgency that static descriptions do not
- **Connection to organizational priorities:** Link explicitly to a strategic objective the approver already owns. If the company is in a growth phase, link to scalability. If the company is managing costs, link to efficiency. If the company is dealing with a compliance requirement, link to risk reduction

### Step 3: Structure the Proposed Solution with the Three-Option Framework

Never present a single recommendation. Approvers instinctively push back on proposals that offer no choice -- it feels like a done deal dressed up as a request. Use the three-option framework:

- **Option 1 -- Do Nothing (the baseline):** This is not a throwaway option. Calculate the cost of inaction over 12, 24, and 36 months. Include compounding effects (the longer the problem persists, the more expensive it gets). This anchors the reader and makes the investment look proportionate
- **Option 2 -- Minimum Viable Intervention:** A lower-cost, lower-scope approach that partially addresses the problem. This option often gets rejected on its own merits but validates that you considered a lighter-touch approach. It also protects against the approver proposing a watered-down version during the meeting -- you already addressed it
- **Option 3 -- The Proposed Solution (recommended):** The full-scope recommendation. Frame it as the recommendation, not the ideal. Acknowledge what it requires and why the return justifies it

For the recommended solution, address four dimensions concisely:
- What it delivers (outcomes and success metrics, not activities)
- How it works at a high level (one paragraph -- not a technical specification)
- Why this approach over the alternatives (criteria-based comparison)
- What it requires (budget, people, time, dependencies)

### Step 4: Build the Business Case with Financial Rigor

The business case is where most internal proposals fail. Vague benefit claims ("improved efficiency," "better customer experience") carry no persuasive weight with finance-literate approvers. Use these frameworks:

- **Total Cost of Ownership (TCO):** Include all costs over a 3-year horizon: software licenses, implementation, integration, training, ongoing support, and opportunity cost of internal staff time. Never present only the software license fee -- approvers who discover hidden costs later will lose trust in the entire proposal
- **Return on Investment (ROI):** Calculate as (Net Benefit / Total Investment) × 100. For a proposal with $120K in benefits and $40K in investment, ROI = (($120K - $40K) / $40K) × 100 = 200%. Present conservatively -- use the low end of benefit estimates
- **Payback period:** The number of months until cumulative benefits exceed cumulative costs. Anything under 12 months is typically easy to approve. 12--24 months is the typical acceptable range. Beyond 36 months requires strategic justification (compliance, existential risk, or foundational infrastructure)
- **Net Present Value (NPV) for large investments:** For proposals above $100K, discount future cash flows at the company's hurdle rate (typically 8--15% for internal projects). A positive NPV is the baseline threshold for approval
- **Sensitivity analysis for uncertain estimates:** Present a conservative case (30% below expected benefits, 20% above expected costs) and a base case. If the conservative case still shows positive ROI, say so explicitly -- it neutralizes the "what if your numbers are wrong?" objection
- **Non-financial benefits:** Quantify by proxy wherever possible. "Reduced compliance risk from High to Low per our risk framework" is more credible than "improved compliance posture." Tie to existing risk registers or audit findings if they exist

### Step 5: Build a Credible Implementation Plan

A proposal without a realistic implementation plan signals that the proposer has not thought through execution. The implementation plan must demonstrate feasibility, not just aspiration:

- **Use phases, not a flat Gantt:** Three to four phases with clear gates between them. Each phase should have a named deliverable, a timeline with specific weeks or months (not "Q3"), and explicit resource requirements. Phase gates give leadership natural checkpoints to reassess without abandoning the project
- **Resource allocation by phase:** Specify who does what. If the project requires 0.5 FTE from the engineering team and 0.25 FTE from operations, say that. Hidden resource draws are a leading cause of project rejection after approval, and they damage credibility
- **Dependencies and prerequisites:** What must be true before the project can start? What other in-flight projects does this compete with for resources? Call these out proactively -- approvers will identify them if you do not, and it is better to have already addressed them
- **Decision gates:** Identify 2--3 points during implementation where leadership should review progress and approve the next phase. This reduces the perceived risk of a large single commitment and gives approvers a sense of control
- **Critical path awareness:** Identify the 1--2 items that, if delayed, delay everything else. Flag these as risks with mitigation strategies

### Step 6: Perform Pre-Mortem Risk Analysis

Most proposals treat risks as a perfunctory list appended at the end. Experienced approvers use the risk section to assess the proposer's judgment. Perform a genuine pre-mortem: assume the project failed 12 months after launch, and ask why:

- **Categorize risks by type:** Technical risks (integration complexity, data quality, tool limitations), organizational risks (change adoption, resource availability, competing priorities), financial risks (cost overrun, benefit shortfall), and external risks (vendor instability, regulatory change, market shift)
- **Score risks on a 2x2:** Impact (High/Medium/Low) × Likelihood (High/Medium/Low). Only include in the proposal the risks that are either High Impact or High Likelihood -- do not include every conceivable risk, or the proposal reads as anxious rather than rigorous
- **Mitigation must be specific:** "Monitor the situation" is not a mitigation. "If the integration takes more than 4 weeks, we will engage the vendor's professional services team at a pre-negotiated rate of $X/day" is a mitigation
- **Residual risk after mitigation:** State the risk level after mitigation, not just before. This demonstrates that the mitigation is substantive

### Step 7: Write the Ask with Surgical Precision

The final section is where proposals most commonly fail in execution. The ask must be unambiguous:

- **Specify the exact dollar amount, headcount, or resource being requested** -- never "approximately" or "in the range of" -- if you must use a range, explain why and commit to a scoping phase with a specific date
- **Name the specific approver or approving body:** "VP of Finance" is not specific enough if the actual process requires sign-off from the Capital Expenditure Committee that meets on the first Tuesday of each month
- **State the decision deadline and its rationale:** "Decision needed by April 1 to begin work before the Q2 engineering freeze" is actionable. "Hoping for approval soon" is not
- **Quantify the cost of delay:** Calculate what each month of delay costs in continued problem impact. "$3,800 per month in at-risk churn revenue" converts delay from an abstraction into a tangible cost
- **State the immediate next step if approved:** "Upon approval, the project manager will schedule kickoff within 5 business days and issue vendor contracts within 10 business days." This signals execution readiness

---

## Output Format

```
# Project Proposal: [Project Name]

**Submitted by:** [Name, Title, Department]
**Date:** [Month Day, Year]
**Decision requested by:** [specific date]
**Approving authority:** [specific person or body]
**Project sponsor (if applicable):** [Name, Title]
**Document status:** [Draft for Review / Final for Approval]

---

## Executive Summary

[3--5 sentences maximum. State the problem and its quantified cost, the
recommended solution, the total investment, the expected return, and the
specific ask. This should stand alone -- many approvers read only this section.]

---

## Problem Statement

### Current State

[Specific, observable description of what is happening today. Include
numbers, frequency, affected populations. 1--2 paragraphs.]

### Cost of the Current State

| Cost Dimension | Annual Impact |
|----------------|--------------|
| Direct labor cost (wasted hours × loaded rate) | $[amount] |
| Opportunity cost (revenue not captured or at risk) | $[amount] |
| Risk exposure (probability × severity) | $[amount] |
| [Other relevant dimension] | $[amount] |
| **Total estimated annual cost** | **$[amount]** |

### Root Cause

[Why does this problem exist? 2--3 sentences. This demonstrates depth of
understanding and validates the proposed solution's logic.]

### Trend and Urgency

[Is the problem worsening? At what rate? Why act now rather than later?]

### Connection to Strategic Priorities

[Link explicitly to 1--2 organizational goals, OKRs, or strategic
priorities the approver owns or cares about.]

---

## Options Considered

### Option 1: Do Nothing (Baseline)

[Cost of inaction over 12, 24, and 36 months. Compounding effects if
applicable. Specific consequences of non-action.]

| Year | Cumulative Cost of Inaction |
|------|----------------------------|
| Year 1 | $[amount] |
| Year 2 | $[amount] |
| Year 3 | $[amount] |

### Option 2: [Minimum Viable Intervention]

[Brief description. Why it partially addresses the problem and why it
is insufficient. Cost and key limitation.]

### Option 3: [Full Proposed Solution] -- RECOMMENDED

[2--3 paragraphs: what it delivers (outcomes), how it works at a high
level, why this approach over the alternatives.]

#### Criteria-Based Comparison

| Criterion | Weight | Do Nothing | Minimum Intervention | Recommended |
|-----------|--------|------------|---------------------|-------------|
| Solves root cause | 30% | ✗ | Partial | ✓ |
| Scalability | 20% | ✗ | ✗ | ✓ |
| Time to value | 20% | -- | 30 days | 90 days |
| Total 3-year cost | 30% | $[inaction cost] | $[cost] | $[cost] |

---

## Business Case

### Investment Summary

| Cost Item | One-Time | Annual Recurring | 3-Year Total |
|-----------|----------|-----------------|-------------|
| [Software / tools] | $[amount] | $[amount] | $[amount] |
| [Implementation / setup] | $[amount] | -- | $[amount] |
| [Internal labor (hours × loaded rate)] | $[amount] | $[amount] | $[amount] |
| [Training] | $[amount] | -- | $[amount] |
| [Contingency (15%)] | $[amount] | -- | $[amount] |
| **Total** | **$[amount]** | **$[amount]** | **$[amount]** |

### Expected Benefits

| Benefit | Measurement | Conservative Estimate | Base Estimate | Source |
|---------|-------------|----------------------|---------------|--------|
| [Benefit 1] | [metric] | $[amount] | $[amount] | [data source] |
| [Benefit 2] | [metric] | $[amount] | $[amount] | [data source] |
| [Benefit 3] | [metric / proxy] | $[qualitative] | $[qualitative] | [source] |
| **Total Annual Benefit** | | **$[amount]** | **$[amount]** | |

### Return Analysis

| Metric | Conservative | Base Case |
|--------|-------------|-----------|
| Total 3-Year Investment | $[amount] | $[amount] |
| Total 3-Year Benefit | $[amount] | $[amount] |
| Net Benefit | $[amount] | $[amount] |
| ROI | [%] | [%] |
| Payback Period | [months] | [months] |

---

## Implementation Plan

### Overview

**Total timeline:** [weeks/months]
**Project owner:** [Name, Title]
**Core team:** [roles, not necessarily names -- e.g., "1 x Senior Engineer (0.5 FTE), 1 x Operations Analyst (0.25 FTE)"]

### Phases

| Phase | Description | Key Deliverables | Timeline | Resources | Gate Criteria |
|-------|-------------|-----------------|----------|-----------|---------------|
| Phase 1: [Name] | [What happens] | [Specific outputs] | [Weeks X--Y] | [FTE + budget] | [What must be true to proceed] |
| Phase 2: [Name] | [What happens] | [Specific outputs] | [Weeks X--Y] | [FTE + budget] | [What must be true to proceed] |
| Phase 3: [Name] | [What happens] | [Specific outputs] | [Weeks X--Y] | [FTE + budget] | [What must be true to proceed] |

### Dependencies and Prerequisites

- [Dependency 1: What it is, which team owns it, current status]
- [Dependency 2]
- [Dependency 3]

---

## Risk Analysis

| Risk | Category | Impact | Likelihood | Risk Score | Mitigation | Residual Risk |
|------|----------|--------|------------|------------|------------|---------------|
| [Risk 1] | [Technical/Org/Financial] | H/M/L | H/M/L | H/M/L | [Specific mitigation action] | H/M/L |
| [Risk 2] | [Technical/Org/Financial] | H/M/L | H/M/L | H/M/L | [Specific mitigation action] | H/M/L |
| [Risk 3] | [Technical/Org/Financial] | H/M/L | H/M/L | H/M/L | [Specific mitigation action] | H/M/L |

---

## [Optional] Concerns and Responses

*Include this section only if the proposal is likely to face known objections.*

| Anticipated Concern | Response |
|--------------------|---------|
| "[Specific objection a skeptic would raise]" | [Evidence-based response that acknowledges validity and addresses it directly] |
| "[Specific objection]" | [Response] |

---

## The Ask

**What is being requested:**
[Exact dollar amount] in budget approval and [specific headcount or resource access].

**Who must approve:**
[Name and title of approver, or name of approving body and its next scheduled meeting]

**Decision needed by:**
[Specific date] -- to [specific downstream action, e.g., "begin vendor onboarding before the Q2 engineering sprint freeze on May 1"]

**Cost of delay:**
Every [time period] of delay costs the organization approximately $[amount] in [specific form of cost].

**If approved, the immediate next steps are:**
1. [Action within X business days]
2. [Action within Y business days]
3. [Action within Z business days]

---

*Appendices (if applicable):*
*A. Supporting data and analysis*
*B. Vendor evaluation scorecard*
*C. Detailed financial model*
```

---

## Rules

1. **Never lead with the solution.** The problem statement must appear before any description of the solution. If an approver cannot understand why action is needed before you tell them what to do, the proposal lacks credibility. Establish the pain, then offer the cure.

2. **Always present a minimum of three options**, including "do nothing" with quantified cost of inaction. Proposals presenting a single option trigger the reaction "they've already made up their mind and are just going through the motions." The do-nothing option is your most powerful persuasion tool.

3. **Never use vague ROI language.** "Significant cost savings," "improved productivity," and "better customer experience" are not business cases. Every benefit must be expressed as a number, a percentage, or a proxy metric from an existing measurement system (e.g., CSAT score, NPS, error rate per 1,000 transactions, support ticket volume). If you cannot quantify something, say "we do not currently measure this; we recommend establishing a baseline in Phase 1" -- that is more credible than fabricating a number.

4. **Always include internal labor costs in the investment total.** A $10,000 software purchase that requires 400 hours of internal engineering time (at a $120/hour loaded rate) is a $58,000 project. Omitting internal labor is the single most common reason proposals exceed budget -- it destroys trust when discovered, and experienced finance reviewers will calculate it themselves.

5. **The payback period must be stated explicitly.** This is the single most commonly asked question by financial approvers and the single metric most often missing from proposals. If payback period exceeds 24 months, justify it with strategic or risk-based arguments, not financial return alone.

6. **Mitigation plans must be specific enough to execute.** "Monitor closely," "escalate as needed," and "address if it arises" are not mitigations -- they are admissions that you have no plan. Each mitigation should name who is responsible, what action they will take, and at what trigger point.

7. **The ask must name a specific decision date with a reason.** An open-ended ask ("when you get a chance") creates an implicit approval to delay indefinitely. The date must be tied to a downstream consequence: a budget cycle, a vendor contract window, an implementation freeze, a regulatory deadline, or a quantified cost of each month of delay.

8. **Keep the main body under 4 pages.** Leadership decision-makers read shorter proposals more carefully and approve them faster. The body should be navigable in 10 minutes of reading. Detailed analyses, vendor comparisons, and financial models belong in labeled appendices that are referenced from the body.

9. **Never claim zero risk.** Any experienced decision-maker will immediately distrust a proposal that presents no risks. A proposal with zero risks signals either that the proposer has not thought deeply enough about execution, or that they are hiding concerns. Presenting 2--4 real risks with credible mitigations increases, not decreases, the proposal's persuasive power.

10. **Calibrate the language to the approver's domain.** A proposal to the CFO should foreground financial metrics (ROI, payback period, cash flow timing, contingency reserves). A proposal to the CTO should foreground technical metrics (system reliability, integration risk, technical debt reduction, team velocity). A proposal to the COO should foreground operational metrics (process efficiency, error rates, change management burden). Write one version with appropriate emphasis -- do not send the same generic proposal to every stakeholder.

11. **Separate outcomes from activities in the solution description.** "We will implement Zendesk and train the support team" is an activity. "The support team will have full ticket visibility and SLA tracking within 60 days, reducing missed responses by an estimated 80%" is an outcome. Approvers fund outcomes, not activities.

12. **State the executive sponsor explicitly if one exists.** A proposal with a named internal champion ("This initiative has the support of the VP of Operations, who has reviewed this proposal") carries significantly more weight than an anonymous submission. If there is no sponsor, consider whether the proposal is ready to submit or whether sponsorship should be secured first.

---

## Edge Cases

### The Proposal Has No Quantifiable Financial ROI

Some projects generate genuine value that does not translate directly to dollars -- improving employee morale, reducing compliance risk, building organizational capability. Handle this rigorously rather than retreating to platitudes:

- Use proxy metrics that are already tracked in the organization (eNPS, attrition rate, audit findings count, security incident frequency, training completion rates)
- Quantify the risk exposure using the expected value formula: Probability × Impact. "There is a 40% chance of a $150,000 regulatory fine within 24 months based on our last audit findings; this project reduces that probability to under 5%, reducing expected loss by $52,500"
- Reference industry benchmarks or peer organizations where internal data is unavailable, and label them clearly as external benchmarks
- For compliance and regulatory projects, note that the question is not ROI but rather "what is the cost of non-compliance" -- reframe accordingly
- Use a qualitative scoring matrix if financial quantification is genuinely impossible, scoring benefits on criteria the organization cares about (strategic alignment, risk reduction, employee impact, customer impact) with explicit weights

### The Project Requires New Headcount, Not Just Budget

Headcount proposals face additional scrutiny because they create ongoing fixed costs and organizational commitments that a one-time project expense does not. Address this explicitly:

- Present the build-vs.-buy comparison: full-time hire (fully loaded cost including benefits, equipment, onboarding, and ramp time -- typically 1.25x--1.5x base salary, with 3--6 months before full productivity) vs. a time-limited contractor engagement (typically 1.5x--2x the equivalent hourly rate but with no long-term commitment)
- Quantify when a permanent hire becomes more cost-effective than ongoing contractor use (typically the crossover is at 12--18 months of sustained need)
- Specify whether the headcount is funded from the project budget or requires a separate headcount approval process -- many organizations have a separate HC approval track distinct from project budget approval
- If proposing a full-time hire, include a role description, hiring timeline (typically 6--12 weeks for professional roles), and what happens during the gap

### The Proposal Will Face Known Political Opposition

Some proposals threaten existing power structures, budgets, or ownership domains. Ignoring this context produces a naive proposal that gets rejected for reasons never stated in the feedback. Handle political opposition proactively:

- Add a "Concerns and Responses" section that names the objection without naming the objector, addresses it with evidence, and acknowledges any legitimate validity in the concern
- Reframe ownership carefully: proposals that feel like a land-grab by one team over another's territory fail even when the business case is strong. Consider proposing a cross-functional governance structure that gives the affected team a seat at the table
- Identify whether there is a natural coalition of supporters (teams who benefit from the outcome) and whether securing their visible support before submission would change the political calculus
- If the opposition is strong enough, consider staging the proposal: a smaller Phase 1 proof of concept that builds evidence and allies before the full commitment is requested

### The Proposal Has Been Rejected Before

Re-submitting a previously rejected proposal without addressing the rejection reason is almost always futile. Before rewriting:

- Explicitly ask what changed: new data available, increased severity of the problem, reduced project cost, changed organizational priorities, new risk that emerged, new executive sponsor who supports it
- Frame the proposal around what is different, not just restating the original case more forcefully
- If the rejection reason was budget timing, align with the next budget cycle and include a note acknowledging the previous submission: "This proposal was initially submitted in October. The following table shows how conditions have changed and why the business case is stronger today."
- If the rejection reason was insufficient data, show that you collected the requested data and restructure the proposal to lead with it
- If the rejection reason was unclear, seek a direct conversation before resubmitting -- a rejected proposal without a known reason cannot be meaningfully improved

### The Budget Estimate Is Highly Uncertain

Early-stage proposals often need approval before detailed scoping work can be done, creating a chicken-and-egg problem. Handle uncertainty without sacrificing credibility:

- Present a two-stage ask: "We are requesting $8,000 for a 4-week scoping phase to develop a firm estimate. Upon completion, we will return with a detailed proposal for Phase 2 funding." This reduces the approver's risk and is often easier to approve than a large uncertain number
- Use analogical estimation: reference 2--3 comparable projects (internally if they exist, externally from industry benchmarks if not) and calibrate the estimate to those. Label this method explicitly: "This estimate is based on analogical comparison to our 2023 CRM implementation and two external benchmarks; it carries a ±30% uncertainty range"
- Include a contingency reserve of 15--20% and explain it as a standard practice for projects at this stage of definition, not as padding
- Never present a single-point estimate for a genuinely uncertain budget -- a range with an explicit confidence level is more credible than false precision

### The Approver Is Technical and Will Scrutinize the Implementation Plan

When the approver is a CTO, VP of Engineering, or other technical leader, the implementation plan must hold up to expert scrutiny:

- Include a technical approach section with enough specificity to demonstrate that the implementation is feasible -- key architectural decisions, integration points, data migration approach, and testing strategy at a high level
- Address scalability and maintainability: how will this solution perform at 2x the current load? Who owns it after implementation?
- Call out any technical debt or simplifications made to meet the budget or timeline, and explain why they are acceptable
- Identify specific technical risks: data migration integrity, API rate limits, single points of failure, third-party dependencies -- and show that you understand their mitigation

### The Organization Requires a Specific Proposal Format

Many larger organizations have a standardized project intake process, capital expenditure form, or investment committee template. If this is the case:

- Ask the user at the outset whether there is a required format, scoring rubric, or submission process -- do not assume the output format above is appropriate
- If a form exists, map the output format sections to the form fields, then write the content using the domain guidance from this skill
- Flag any sections of the required form that seem to conflict with best practices (e.g., if the form asks for benefits but has no field for costs, flag this and recommend adding a cost section even if informal)

---

## Example

**Input:** "We need to propose a project to our CFO and VP of Engineering to replace our manual monthly billing reconciliation process. Right now three finance analysts spend about 2 days each at month-end manually reconciling billing data between our CRM, our payment processor, and our ERP. We've had some billing errors that caused customer disputes. We want to automate this with an integration platform. Budget is probably around $40K--$60K but we're not sure. We're a 200-person B2B SaaS company."

---

**Output:**

# Project Proposal: Automated Billing Reconciliation Integration

**Submitted by:** Director of Finance Operations
**Date:** April 2026
**Decision requested by:** April 30, 2026
**Approving authority:** CFO and VP of Engineering
**Document status:** Final for Approval

---

## Executive Summary

Our month-end billing reconciliation process requires three Finance Analysts to spend two full days each -- totaling 48 person-hours per month -- manually matching records between Salesforce, Stripe, and NetSuite. In the past four quarters, this manual process produced 11 billing disputes, two of which required credit issuances totaling $18,400. This proposal recommends deploying an integration platform to automate the reconciliation workflow, eliminating manual matching errors and reducing month-end close time by an estimated 90%. The total 3-year investment is $141,000, against an estimated $312,000 in recovered labor, dispute resolution, and operational risk costs over the same period -- a 121% ROI with a payback period of approximately 9 months. We are requesting $141,000 in budget approval to proceed, with a decision by April 30 to begin implementation before the May month-end cycle.

---

## Problem Statement

### Current State

Each month, three Finance Analysts spend two full business days -- the 27th through the 28th of each month -- manually exporting billing records from Salesforce (our CRM), Stripe (our payment processor), and NetSuite (our ERP), then cross-referencing them in Excel to identify discrepancies. The process requires 48 person-hours per month (3 analysts × 2 days × 8 hours), consumes approximately 15% of each analyst's monthly capacity, and produces results that are consistently accurate enough only to a first pass -- discrepancies require an additional triage cycle that extends into the first week of the following month.

### Cost of the Current State

| Cost Dimension | Annual Impact |
|----------------|--------------|
| Labor: 576 analyst-hours/year × $65/hour loaded rate | $37,440 |
| Billing dispute resolution: triage, customer communication, credit issuance | $22,000 (4-quarter actual) |
| Delayed month-end close: finance team overtime in first week of each month | $8,100 |
| Risk exposure: probability of a material billing error reaching an enterprise account (est. 15% × $80K avg. ARR impact) | $12,000 (expected annual) |
| **Total estimated annual cost** | **$79,540** |

### Root Cause

The three source systems -- Salesforce, Stripe, and NetSuite -- were implemented independently over a 4-year period with no integration layer. Each system stores billing data in a different format, with different customer ID conventions and different timestamp logic for subscription changes. There is no automated reconciliation because no one has built the bridge, not because the bridge is technically infeasible.

### Trend and Urgency

This year's customer base grew 28% year-over-year, and billing transaction volume grew 34%. The number of billing disputes grew from 6 in Q3 2024 to 11 in Q4 2025 -- an 83% increase in 18 months. At current growth rates, the problem will require a fourth analyst dedicated primarily to reconciliation within 18 months, adding $90,000+ per year in headcount cost. The process does not scale; it deteriorates.

### Connection to Strategic Priorities

This proposal directly supports two organizational priorities established in the 2026 company planning session: (1) reducing month-end close cycle time from 10 days to 5 days as a prerequisite for our Series C readiness audit, and (2) achieving zero billing error SLA for enterprise accounts as part of the enterprise tier service commitment approved in Q1.

---

## Options Considered

### Option 1: Do Nothing (Baseline)

Maintain the current manual process. Costs continue to compound as transaction volume grows.

| Year | Cumulative Cost of Inaction |
|------|----------------------------|
| Year 1 | $79,540 |
| Year 2 | $105,000 (estimated, at current growth rate with additional analyst hire) |
| Year 3 | $138,000 (estimated, with continued growth) |
| **3-Year Total** | **$322,540** |

This option does not address the enterprise billing SLA commitment and creates a material risk to the Series C readiness audit if month-end close time cannot be reduced.

### Option 2: Standardize the Manual Process with Better Tooling

Invest in Excel macros, better export templates, and documented SOPs to reduce manual effort without building an integration. Estimated cost: $8,000 in analyst time to build and document.

This option reduces error probability by an estimated 20--30% and shaves approximately 8--10 hours from the monthly process. It does not address the root cause (disconnected systems), does not scale with transaction volume, does not meet the 5-day close target, and does not eliminate billing disputes. It is an interim patch, not a solution. It was used informally in Q2 2025 with minimal measurable improvement.

### Option 3: Automated Billing Reconciliation Integration -- RECOMMENDED

Deploy an iPaaS (Integration Platform as a Service) solution to automate bidirectional data synchronization between Salesforce, Stripe, and NetSuite. The integration will run nightly, flag discrepancies automatically with a categorized exception report, and require analyst intervention only for true anomalies -- estimated at 2--4 per month based on current dispute rates after clean data matching.

The integration will be built and maintained by a vendor-managed professional services team using a pre-built connector library for all three platforms, reducing implementation risk. The Finance Operations team will own the exception workflow and SLA monitoring. Engineering involvement is scoped to environment access and API credential management -- approximately 20 hours over the implementation period.

#### Criteria-Based Comparison

| Criterion | Weight | Do Nothing | Standardize Manual | Recommended Integration |
|-----------|--------|------------|-------------------|------------------------|
| Eliminates root cause | 30% | ✗ | ✗ | ✓ |
| Scalable with growth | 25% | ✗ | ✗ | ✓ |
| Meets 5-day close target | 20% | ✗ | Partial | ✓ |
| Time to value | 15% | -- | 30 days | 90 days |
| 3-year total cost | 10% | $322,540 | $316,540 | $141,000 |

---

## Business Case

### Investment Summary

| Cost Item | One-Time | Annual Recurring | 3-Year Total |
|-----------|----------|-----------------|-------------|
| iPaaS platform license (3 connectors) | -- | $18,000 | $54,000 |
| Implementation and integration build | $42,000 | -- | $42,000 |
| Internal engineering time (20 hours × $140/hr loaded) | $2,800 | -- | $2,800 |
| Analyst training and process documentation | $4,200 | -- | $4,200 |
| Contingency reserve (15%) | $7,350 | -- | $7,350 |
| Annual platform support and maintenance | -- | $10,550 | $31,650 |
| **Total** | **$56,350** | **$28,550** | **$141,000** |

Note: The budget range indicated in the project brief ($40K--$60K) covers the first-year implementation cost. This proposal presents the full 3-year TCO for a complete financial picture, as the CFO review process requires 3-year cost disclosure for SaaS platform commitments.

### Expected Benefits

| Benefit | Measurement | Conservative Estimate | Base Estimate | Source |
|---------|-------------|----------------------|---------------|--------|
| Labor recovered: analyst time | 576 hrs/yr × loaded rate | $31,000/yr | $37,440/yr | Timesheet data, 4 quarters |
| Billing dispute reduction (est. 85% reduction) | Dispute cost per incident | $15,000/yr | $18,700/yr | Finance dispute log, 4 quarters |
| Eliminated overtime in first week of month | Overtime pay records | $6,500/yr | $8,100/yr | Payroll records |
| Risk exposure reduction | Expected value of material billing error | $8,500/yr | $12,000/yr | Risk assessment |
| **Total Annual Benefit** | | **$61,000/yr** | **$76,240/yr** | |

### Return Analysis

| Metric | Conservative | Base Case |
|--------|-------------|-----------|
| Total 3-Year Investment | $141,000 | $141,000 |
| Total 3-Year Benefit | $183,000 | $228,720 |
| Net Benefit | $42,000 | $87,720 |
| ROI | 30% | 62% |
| Payback Period | 14 months | 9 months |

Even in the conservative case, the project returns positive net value within 14 months and delivers full payback well within the 3-year horizon. If benefits are 30% below the conservative estimate and costs run 20% over budget, the project still breaks even within 22 months.

---

## Implementation Plan

### Overview

**Total timeline:** 12 weeks
**Project owner:** Director of Finance Operations
**Core team:** 1 x Finance Operations Analyst (0.25 FTE, process ownership and UAT), 1 x Senior Engineer (0.1 FTE, API credentials and environment access), Vendor implementation team (full-time during Phases 1 and 2)

### Phases

| Phase | Description | Key Deliverables | Timeline | Resources | Gate Criteria |
|-------|-------------|-----------------|----------|-----------|---------------|
| Phase 1: Design and Build | Vendor maps data schemas; builds and configures connectors for Salesforce, Stripe, and NetSuite | Connector configuration, field-mapping documentation, exception report template | Weeks 1--5 | Vendor team + 0.1 FTE Engineer | All three system APIs accessible; mapping signed off by Finance Operations |
| Phase 2: Testing and UAT | Parallel running -- automated reconciliation runs alongside manual process; discrepancies compared | UAT sign-off document, exception rate baseline established | Weeks 6--9 | Vendor team + 0.25 FTE Analyst | <2% variance between automated and manual output over 2 full run cycles |
| Phase 3: Cutover and Handover | Manual process retired; analyst team trained on exception-only workflow; monitoring dashboards live | Training completion records, runbook, monitoring alerts configured | Weeks 10--12 | 0.25 FTE Analyst + Vendor support | Exception workflow validated; Finance team confirms readiness |

### Dependencies and Prerequisites

- API credential access for Stripe and NetSuite production environments -- owned by Engineering, currently available (confirmed with VP of Engineering)
- Vendor contract execution -- 2-week lead time after approval; vendor has confirmed April capacity
- Month-end cycle freeze: Phase 3 cutover must not coincide with the 27th--28th of the month; implementation schedule has been designed to avoid this

---

## Risk Analysis

| Risk | Category | Impact | Likelihood | Risk Score | Mitigation | Residual Risk |
|------|----------|--------|------------|------------|------------|---------------|
| Data schema inconsistency discovered mid-implementation (e.g., Stripe customer IDs do not align with NetSuite account IDs) | Technical | High | Medium | High | Vendor has conducted a pre-implementation schema review; a 3-day contingency buffer is built into Phase 1. If schema issues require custom transformation logic, this is covered by the 15% contingency | Medium |
| Finance analyst resistance to exception-only workflow after years of hands-on reconciliation | Organizational | Medium | Medium | Medium | Analysts have been consulted during proposal development and expressed support; Phase 2 parallel running preserves their ability to validate before manual process is retired | Low |
| Vendor delivery delay pushing cutover past Q2 month-end cycle | Financial | Medium | Low | Low | Contract will include a week 9 milestone with a $5,000 penalty clause for delays caused by vendor; internal Engineering access commitments are confirmed | Low |

---

## Concerns and Responses

| Anticipated Concern | Response |
|--------------------|---------|
| "We've evaluated integration tools before and they were expensive to maintain." | This proposal uses pre-built connectors for all three platforms rather than custom-built integrations. Maintenance is covered by the vendor's platform support contract at $10,550/year. The Finance Operations team manages the exception workflow with no Engineering dependency post-launch. |
| "What if Stripe or NetSuite changes their API and breaks the integration?" | The iPaaS vendor guarantees connector compatibility as part of the platform support SLA, including API version updates within 30 days of a platform change. This is a standard clause in enterprise iPaaS contracts and has been confirmed with the vendor. |
| "The 9-month payback assumes we capture all the labor savings -- what if the analysts just get reassigned to other tasks?" | The proposal identifies 576 analyst-hours per year currently spent on reconciliation. Recovering these hours creates capacity for the Q2 financial reporting automation initiative and the FP&A dashboard project, both of which are on Finance's 2026 roadmap and currently blocked by capacity constraints. |

---

## The Ask

**What is being requested:**
$141,000 in total project budget authorization: $56,350 in Year 1 one-time costs (implementation, training, contingency) and $28,550 per year in recurring platform and support costs beginning in Year 2. Year 1 expenditure is requested from the Operations capital budget; recurring costs would be expensed as SaaS subscription costs beginning in Year 2.

**Who must approve:**
CFO (budget authorization) and VP of Engineering (API access and engineering time commitment). Both approvals are required to proceed.

**Decision needed by:**
April 30, 2026 -- to execute the vendor contract by May 5 and begin Phase 1 before the May 27 month-end reconciliation cycle. A May start ensures the first fully automated month-end cycle occurs in June, reducing the Q2 close burden.

**Cost of delay:**
Each month of delay costs approximately $6,600 in continued labor and dispute costs based on the trailing 4-quarter average. A 2-month delay to a June start pushes the payback period from 9 months to 11 months and means the team absorbs another manual month-end cycle at the beginning of Series C preparation.

**If approved, the immediate next steps are:**
1. Vendor contract executed within 5 business days of approval
2. Engineering API credential provisioning scheduled within 3 business days of approval
3. Phase 1 kickoff meeting scheduled for the first week of May with vendor, Finance Operations, and Engineering

---

*Appendix A: 4-quarter billing dispute log with cost detail*
*Appendix B: iPaaS vendor evaluation scorecard (3 vendors evaluated)*
*Appendix C: Detailed 3-year financial model with monthly cash flow*
