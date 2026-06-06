---
name: business-proposal
description: |
  Writes structured business proposals with executive summary, scope of work,
  pricing, timeline, and next steps for client-facing or vendor engagements.
  Use when the user needs to write a business proposal, service proposal, or
  client engagement document. Do NOT use for internal project proposals (use
  `project-proposal`), academic grant proposals (use `grant-proposal-writing`),
  or RFP responses (use `rfp-response`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "proposal writing business-writing"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Business Proposal Writing

## When to Use

- User needs to write a business proposal for a client or prospect
- User wants to create a service proposal, consulting proposal, or engagement document
- User asks for help structuring a proposal with pricing and scope
- User needs a proposal document to win new business or formalize an engagement
- Do NOT use when the user wants an internal project proposal (use `project-proposal` instead)
- Do NOT use when the user wants an academic grant proposal (use `grant-proposal-writing` instead)
- Do NOT use when the user wants to respond to a formal RFP (use `rfp-response` instead)
- Do NOT use when the user wants a simple business letter (use `business-letter` instead)

## Process

1. **Collect proposal context.** Ask the user for:
   - Client or prospect name and their business
   - The problem or need the proposal addresses
   - Proposed solution or scope of work
   - Pricing structure: fixed, hourly, retainer, or milestone-based
   - Timeline and key milestones
   - Decision-maker and any known evaluation criteria
   - Competitive situation: are other vendors being considered

2. **Structure the proposal.** Build from this standard architecture:
   - Executive Summary (the entire proposal in one page)
   - Understanding of the Problem (prove you listened during discovery)
   - Proposed Solution / Scope of Work (what you will deliver)
   - Timeline and Milestones (when it happens)
   - Investment / Pricing (what it costs)
   - Why Us (relevant experience and differentiators)
   - Next Steps (how to move forward)
   - Terms and Conditions (optional, if formal)

3. **Write the executive summary.** This must:
   - State the client's problem in their language (not your product language)
   - Summarize your proposed solution in 2-3 sentences
   - State the expected outcome or ROI
   - Include the investment amount and timeline
   - Be self-contained: if the decision-maker reads only this page, they have the full picture

4. **Write the problem statement.** This section proves you understand:
   - The client's specific situation (not a generic industry problem)
   - The cost of the problem (revenue lost, time wasted, risk exposure)
   - What has been tried before and why it did not fully solve the problem
   - Use the client's own language from discovery conversations

5. **Write the scope of work.** Be precise about:
   - What is included (deliverables, not activities)
   - What is explicitly excluded (scope boundaries prevent disagreements later)
   - Milestones or phases with specific deliverables per phase
   - Client responsibilities and dependencies (what you need from them)

6. **Write the pricing section.** Present investment as:
   - Total investment clearly stated
   - Breakdown by phase or deliverable (if milestone-based)
   - Payment terms and schedule
   - What triggers additional costs (scope changes, additional rounds of revision)

7. **Write the next steps.** Make it easy to say yes:
   - Exactly what the client needs to do to proceed (sign, reply, schedule a call)
   - Proposal validity period (typically 30 days)
   - Target start date if approved by a specific date

## Output Format

```
# [Proposal Title: Solution for Client Name]

**Prepared for:** [Client Name, Title, Company]
**Prepared by:** [Your Name, Title, Company]
**Date:** [date]
**Valid until:** [date]

---

## Executive Summary

[3-5 sentences: client's problem, proposed solution, expected outcome,
investment amount, timeline. Self-contained for decision-maker scanning.]

---

## Understanding of Your Challenge

[2-3 paragraphs proving you understand the client's specific situation.
Use their language. Quantify the cost of the problem.]

---

## Proposed Solution

[2-4 paragraphs describing what you will deliver. Focus on deliverables
and outcomes, not methodology or process details.]

### Scope of Work

| Phase | Deliverables | Timeline |
|-------|-------------|----------|
| Phase 1: [name] | [specific deliverables] | [weeks/dates] |
| Phase 2: [name] | [specific deliverables] | [weeks/dates] |
| Phase 3: [name] | [specific deliverables] | [weeks/dates] |

### Out of Scope

- [Item explicitly not included]
- [Item explicitly not included]
- [Item that would require a separate engagement]

### Client Responsibilities

- [What you need from the client to deliver]
- [Access, materials, or decisions required]
- [Response timeframes for reviews and approvals]

---

## Timeline

| Milestone | Date | Dependencies |
|-----------|------|-------------|
| Project kickoff | [date] | Contract signed |
| [Milestone 1] | [date] | [dependency] |
| [Milestone 2] | [date] | [dependency] |
| Final delivery | [date] | [dependency] |

---

## Investment

| Item | Amount |
|------|--------|
| [Phase 1 / Deliverable 1] | $[amount] |
| [Phase 2 / Deliverable 2] | $[amount] |
| [Phase 3 / Deliverable 3] | $[amount] |
| **Total Investment** | **$[total]** |

**Payment terms:** [schedule -- e.g., 50% at signing, 50% at delivery]

**Additional costs:** [what triggers extra charges and how they are handled]

---

## Why [Your Company]

[2-3 paragraphs with specific relevant experience. Include 1-2 brief
client results or project examples similar to this engagement.]

---

## Next Steps

1. [Specific action to approve -- sign this proposal, reply with approval, schedule a call]
2. [What happens after approval -- kickoff meeting within X days]
3. [Target start date if approved by X date]

**This proposal is valid for 30 days from the date above.**
```

## Rules

1. NEVER open the proposal with "I am pleased to submit" or "Thank you for the opportunity" -- the executive summary is the opener and it states the client's problem, not your gratitude
2. NEVER use passive voice in the scope section ("Deliverables will be provided") -- state what you will do in active voice ("We will deliver")
3. NEVER hide the price -- the investment section must be clear, prominent, and not buried in appendices
4. NEVER submit a proposal without an executive summary -- decision-makers read this section first and sometimes only
5. NEVER leave scope ambiguous -- vague scope leads to scope creep and disputes
6. ALWAYS state the client's problem before presenting the solution -- proposals that skip the problem statement feel generic
7. ALWAYS include an "Out of Scope" section to set clear boundaries
8. ALWAYS include "Client Responsibilities" -- what you need from them to deliver
9. ALWAYS make the next steps concrete and actionable (one specific action to proceed)
10. ALWAYS include a proposal validity period
11. Frame pricing as "investment" and connect it to expected outcomes, not just hours or deliverables
12. Keep the total proposal under 5 pages for standard engagements. Only add length if the scope genuinely requires it.

## Edge Cases

- **Client has not shared a budget.** Include 2 options at different price points (e.g., "Essential" and "Comprehensive") so the client self-selects. Note the differences in deliverables, not in quality.
- **Proposal is unsolicited (no prior discovery conversation).** Add a section called "Assumptions" listing what you believe about their situation, and note that the scope and pricing may adjust after a discovery conversation.
- **Multiple decision-makers will review.** Add a one-page summary as the first page that any stakeholder can read in 60 seconds. The full proposal follows for those who want detail.
- **Client wants a proposal but has not clearly defined the problem.** Propose a paid discovery phase first (2-4 weeks) with a separate, lower investment, followed by the full engagement proposal based on discovery findings.
- **Proposal competes against other vendors.** Strengthen the "Why Us" section with specific differentiators. Do not bad-mouth competitors; instead, state what you do that others typically do not.

## Example

**Input:** "Write a proposal for a website redesign project. The client is a law firm (Blackwell Partners) with a 10-year-old website that doesn't generate leads. They want a modern site with contact forms and case study pages. Budget around $25,000. Timeline: 3 months."

**Output:**

# Website Redesign Proposal for Blackwell Partners

**Prepared for:** Sarah Blackwell, Managing Partner, Blackwell Partners LLP
**Prepared by:** [Your Name], Creative Director, [Agency Name]
**Date:** March 2026
**Valid until:** April 30, 2026

---

## Executive Summary

Blackwell Partners' current website generates fewer than 5 contact form submissions per month despite receiving 2,000+ monthly visitors. The site's design, built 10 years ago, does not meet the expectations of prospects evaluating legal representation online. We propose a full website redesign focused on lead generation: a modern design with clear service pages, client case studies, and conversion-optimized contact forms. The project will be completed in 12 weeks for a total investment of $24,500, with an expected 3-5x increase in monthly contact form submissions within 90 days of launch.

---

## Understanding of Your Challenge

Prospective clients who visit the current Blackwell Partners website encounter a design that signals outdated technology. Navigation is unclear, service descriptions are buried in dense paragraph text, and the sole contact mechanism is an email link with no form. For a law firm competing against practices with modern digital presence, the website is a liability rather than a lead generation tool.

The cost of this problem is measurable: at your current 2,000 monthly visitors, a well-designed legal services website converts at 2-5% on contact forms. Your current conversion rate is approximately 0.25%. Closing that gap represents 35-95 additional monthly inquiries.

---

## Proposed Solution

We will redesign the Blackwell Partners website with three priorities: credibility (a design that reflects the firm's reputation), lead generation (conversion-optimized pages and forms), and usability (clear navigation for prospective clients evaluating legal representation).

### Scope of Work

| Phase | Deliverables | Timeline |
|-------|-------------|----------|
| Phase 1: Strategy and Design | Competitive audit, sitemap, wireframes for 8 page templates, 2 design concepts | Weeks 1-4 |
| Phase 2: Development | Responsive website build, CMS setup, contact form integration, case study template | Weeks 5-9 |
| Phase 3: Content and Launch | Content migration, SEO setup, testing, training, launch | Weeks 10-12 |

### Out of Scope

- Ongoing content writing (content brief templates will be provided for future use)
- Paid advertising campaign setup or management
- Photography or video production (stock image selection is included)

### Client Responsibilities

- Provide existing brand guidelines, logos, and color preferences by Week 1
- Designate one point of contact for feedback and approvals
- Provide feedback on design concepts within 5 business days of delivery
- Supply case study content (client names, outcomes, testimonials) by Week 8

---

## Timeline

| Milestone | Date | Dependencies |
|-----------|------|-------------|
| Project kickoff | Week 1 | Contract signed, brand assets received |
| Design concepts delivered | End of Week 3 | -- |
| Design approved | End of Week 4 | Client feedback within 5 days |
| Development complete | End of Week 9 | Design approval |
| Content loaded and tested | End of Week 11 | Case study content from client |
| Launch | End of Week 12 | Final client approval |

---

## Investment

| Item | Amount |
|------|--------|
| Phase 1: Strategy and Design | $8,500 |
| Phase 2: Development | $11,000 |
| Phase 3: Content and Launch | $5,000 |
| **Total Investment** | **$24,500** |

**Payment terms:** 40% at project kickoff ($9,800), 30% at design approval ($7,350), 30% at launch ($7,350)

**Additional costs:** Additional page templates beyond the 8 included are $750 each. Revisions beyond 2 rounds per phase are billed at $150/hour.

---

## Why [Agency Name]

We have redesigned 12 professional services websites in the past 3 years, including 4 law firms. Our redesign for Morrison Legal increased their monthly contact form submissions from 8 to 34 within 60 days of launch. We understand how legal prospects evaluate firms online and design specifically for that decision journey.

---

## Next Steps

1. Reply to this email confirming approval, or schedule a 30-minute call to discuss any questions
2. Upon approval, we send the contract and first invoice. Kickoff meeting within 5 business days of signed contract
3. If approved by April 15, target launch date is July 8

**This proposal is valid for 30 days from the date above.**
