---
name: start-freelancing
description: |
  Guides the user through launching a freelance practice from rate calculation
  through client acquisition, chaining 6 atomic skills covering pricing,
  proposals, contracts, portfolio, outreach, and onboarding. Handles decision
  points for full-time vs. side hustle, generalist vs. specialist positioning,
  and platform-based vs. direct client acquisition. Use when the user wants to
  start freelancing or consulting in their skill area. Do NOT use for finding
  traditional employment (use land-new-job workflow), negotiating a raise at a
  current employer (use negotiate-raise workflow), or switching to a completely
  new career field (use switch-careers workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "freelancing entrepreneurship career planning step-by-step"
  category: "career"
  depends: "freelance-rate-calculator freelance-proposal-writer freelance-contract-template portfolio-building-plan cold-outreach-email client-onboarding-checklist"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Start Freelancing

**Estimated time:** 2-6 weeks to launch, 2-3 months to first steady income (depending on existing network, portfolio readiness, and market demand)

This workflow orchestrates 6 career-development skills into a freelance launch pipeline. Freelancing requires simultaneous competence in pricing, selling, legal protection, and client management -- skills that most professionals have never needed in traditional employment. Each step in this workflow produces specific artifacts (rate card, proposal templates, contract template, portfolio, outreach messages, onboarding checklist) that the user will reuse for every future client engagement. The workflow handles the three most common entry paths: full-time freelancing from day one, side hustle while employed, and platform-based (Upwork, Fiverr) vs. direct client acquisition.

## When to Use

- User wants to start offering their professional skills as a freelancer or independent consultant
- User is currently employed and wants to start freelancing as a side hustle before going full-time
- User has been laid off and wants to freelance while searching for full-time employment or as a permanent career shift
- User has been doing ad-hoc freelance work and wants to professionalize their practice with proper pricing, contracts, and client processes
- Do NOT use when: user wants to find traditional full-time employment (use `land-new-job` workflow), user wants to build a product-based business rather than a service-based practice (different business model), user wants to switch to a completely new skill area (use `switch-careers` workflow first, then return to this workflow once skills are established)

## Prerequisites

Before starting this workflow, ensure:

1. **Marketable skill identified:** The user has at least one professional skill that others will pay for as a service (writing, design, development, consulting, marketing, coaching, etc.). This workflow does not help identify what to freelance in -- it helps launch the practice.
2. **Minimum financial runway:** For full-time freelancing, 3-6 months of living expenses saved. For side-hustle freelancing, current employment covers expenses during ramp-up.
3. **Basic business infrastructure:** The user has a way to receive payments (bank account, PayPal, Stripe), send invoices (even a spreadsheet works initially), and communicate professionally (dedicated email address).
4. **Time availability:** Full-time freelancing requires 30-40 hours per week (including non-billable business development time). Side-hustle freelancing requires at least 10-15 hours per week outside of the user's primary job.

## Steps

**Step 1: Calculate Your Freelance Rate** (uses: freelance-rate-calculator)

Determine pricing that covers costs, reflects market value, and supports the user's income goals. This is the foundation for everything else -- underpricing leads to burnout and resentment, overpricing leads to zero clients.

- Input: User's target annual income, estimated business expenses (software, insurance, taxes, equipment), desired billable hours per week, market rate data for their skill in their market
- Output: Rate card with hourly rate, half-day rate, full-day rate, and project-based pricing guidelines. Also includes the break-even calculation showing the minimum rate that covers expenses and taxes.
- Key focus: New freelancers consistently underprice by 30-50%. The calculator must account for: self-employment taxes (15.3% in the US), health insurance, retirement contributions, non-billable time (marketing, admin, invoicing), and vacation and sick days (no one pays freelancers for time off). A $50 per hour employee costs their employer $75-90 per hour with benefits -- the freelance rate should reflect the freelancer's true cost, not their previous salary divided by 2,080 hours.

**Step 2: Create Proposal Templates** (uses: freelance-proposal-writer)

Build reusable proposal templates that can be customized for each client opportunity. A strong proposal communicates understanding of the client's problem, a clear scope of work, timeline, pricing, and terms.

- Input: Rate card from Step 1, user's service offerings and specialization, 2-3 example client scenarios to template against
- Output: 2-3 proposal templates (one for small projects, one for large projects, one for retainer arrangements), each with sections for: client problem summary, proposed approach, deliverables, timeline, pricing, and terms
- Key focus: The proposal should demonstrate understanding of the client's problem before presenting the solution. Lead with "Here is what I understand about your challenge" not "Here is what I do." Include specific deliverables with descriptions, not vague "consulting services." Always present pricing with context -- "This 3-week project at $X includes [specific deliverables]" is stronger than a standalone dollar amount.

**Step 3: Prepare Contract Templates** (uses: freelance-contract-template)

Create legally protective contract templates that cover scope, payment terms, intellectual property, revisions, and termination. Contracts protect both the freelancer and the client.

- Input: Service types the user will offer, standard payment terms (net-15, net-30, deposit requirements), intellectual property preferences, revision and scope change policies
- Output: Master service agreement template and a project-specific statement of work template, covering: scope description, deliverables, timeline, payment schedule, late payment terms, revision limits, IP assignment, confidentiality, termination clause, and dispute resolution
- Key focus: Three non-negotiable contract provisions for new freelancers: (1) deposit requirement before work begins (25-50% of project value), (2) a revision limit with additional revisions at the hourly rate, and (3) a kill fee if the client cancels mid-project (typically 25-50% of remaining project value). The contract should be written in plain language, not legalese. Note: these templates are starting points -- the user should consult a legal professional for their specific situation.

**Step 4: Build Your Freelance Portfolio** (uses: portfolio-building-plan)

Create or curate a portfolio that demonstrates the user's capabilities to potential clients. The portfolio is the freelancer's most important sales tool -- clients hire based on evidence of past results, not promises.

- Input: User's existing work samples (from employment, personal projects, or volunteer work), target client types, service specializations from Steps 1-2
- Output: Portfolio plan with 4-6 curated pieces, each with: project description, the problem solved, the user's role, and measurable results. Also includes format recommendations (website, PDF, or platform profile) based on the target client acquisition channel.
- Key focus: Quality over quantity -- 4 excellent pieces outperform 20 mediocre ones. Each piece should tell a story: what was the challenge, what did the user do, what was the result. If the user lacks client work, create spec projects that mirror real client problems. Get permission before including employer work in a portfolio. Tailor the portfolio to the type of client being targeted -- a portfolio for startup clients looks different from one for enterprise clients.

**Step 5: Launch Client Outreach** (uses: cold-outreach-email)

Write and send targeted outreach messages to potential clients. Cold outreach is one of three primary client acquisition channels (alongside referrals and platform-based bidding).

- Input: Target client profile (industry, company size, typical problems the user solves), portfolio from Step 4, rate card from Step 1
- Output: Cold outreach email templates for 3 scenarios: direct client outreach, agency or partner outreach, and follow-up sequences. Also: weekly outreach targets and tracking system.
- Key focus: Effective outreach focuses on the client's problem, not the freelancer's credentials. "I noticed your website's checkout flow has [specific issue] -- here is how I would approach fixing it, based on similar work I did for [portfolio example]" outperforms "I am a web developer with 5 years of experience and I would love to work with you." Target 10-15 personalized outreach messages per week. Track response rates and iterate on messaging every 2 weeks.

**Step 6: Set Up Client Onboarding** (uses: client-onboarding-checklist)

Create a standardized onboarding process for new clients. Professional onboarding reduces scope confusion, sets clear expectations, and creates a positive first impression.

- Input: Service types from Step 2, contract templates from Step 3, typical client questions and concerns
- Output: Client onboarding checklist covering: welcome message template, discovery questionnaire (to understand the client's needs in detail), contract and payment setup steps, project kickoff meeting agenda, communication expectations document (response times, preferred channels, meeting cadence), and file-sharing setup
- Key focus: The onboarding process should answer every question a new client might have before they need to ask. Include: how to reach the freelancer (email, not phone, unless specified), expected response time (within 24 hours on business days), how progress updates work (weekly email recap), what happens if the scope changes (written change order, additional cost), and when invoices are sent and payment is expected.

## Decision Points

- **Before Step 1:** If the user is going full-time freelance from day one, the rate calculation must cover 100% of living expenses, taxes, insurance, and business costs with a margin for slow months. If the user is starting as a side hustle while employed, the rate can be more experimental -- the primary income provides a safety net, allowing the user to test pricing and adjust before going full-time.

- **Before Step 2:** If the user is positioning as a generalist (e.g., "web developer" or "graphic designer"), proposals must work harder to differentiate. If the user is positioning as a specialist (e.g., "Shopify migration specialist" or "SaaS landing page designer"), proposals leverage the niche positioning as the primary differentiator. Specialists can charge 30-50% more than generalists because their expertise is more targeted.

- **Before Step 5:** If the user plans to acquire clients through platforms (Upwork, Toptal, Fiverr), Step 5 shifts from cold email outreach to platform proposal optimization. The principles are the same (lead with the client's problem, show relevant work), but the format differs (shorter proposals, platform-specific profile optimization, bidding strategies). If the user plans direct client acquisition, Step 5 focuses on email and LinkedIn outreach.

- **After Step 5:** If the user's outreach generates meetings but meetings do not convert to clients, the problem is in the proposal or pricing (return to Steps 1-2). If outreach does not generate meetings at all, the problem is targeting or messaging (revise Step 5 outreach templates).

- **Before Step 1:** If the user is choosing a pricing model, the workflow default is hourly or project-based for new freelancers. Retainer pricing (monthly fixed fee for ongoing access) is introduced only after the user has 2-3 active clients and can predict their capacity. Value-based pricing (pricing based on the value delivered to the client rather than time spent) requires enough experience to accurately estimate value -- not recommended for the first 6 months.

## Failure Handling

- **Step 1 fails (rate too high or too low for market):** If the calculated rate is significantly above market (no clients willing to pay) or below market (attracting only low-quality clients), recalibrate using market data from 3-5 competitors. Check freelance rate surveys for the user's skill, experience level, and geographic market. If the market rate does not cover the user's expenses, they need to either reduce expenses, increase billable hours, or add a higher-value service to justify higher rates.

- **Step 5 fails (no client responses):** If 30+ personalized outreach messages over 3 weeks generate fewer than 3 responses, audit: (a) targeting -- are the messages reaching people who actually need and can pay for the service? (b) messaging -- does the outreach lead with the client's problem or the freelancer's credentials? (c) portfolio -- is the linked portfolio compelling enough to prompt a response? Iterate on one variable at a time to identify the blocker.

- **First project has scope creep:** This is the most common failure for new freelancers. When the client requests work beyond the agreed scope, use the contract from Step 3 to reference the original agreement, then present a change order with additional cost and timeline. If the contract does not have a clear scope boundary (the user skipped or weakened Step 3), absorb the lesson and strengthen the scope section for all future contracts.

- **Payment collection issues:** If a client is late on payment, the contract from Step 3 should include late payment terms (typically 1.5% per month or a flat late fee). Send a formal reminder at day 1 past due, a firmer reminder at day 14, and a final notice with work stoppage at day 30. For the first project, require a deposit before starting work and milestone payments for longer projects -- never do all work before any payment.

- **User wants to change direction:** If the user discovers during outreach that their chosen specialization has too little demand, the portfolio and proposal templates need updating, but the rate calculation framework, contract templates, and onboarding process transfer directly to a new specialization.

## Output Format

```
## Freelance Launch Plan: [Service Specialization]

### Step 1: Rate Card
- Target annual income: $[amount]
- Business expenses: $[amount/year]
- Effective tax rate: [percentage]%
- Billable hours target: [N per week]
- Hourly rate: $[amount]
- Half-day rate: $[amount]
- Full-day rate: $[amount]
- Project rate guidance: [multiplier or range]

### Step 2: Proposal Templates
- Small project template: $[range] for [scope]
- Large project template: $[range] for [scope]
- Retainer template: $[range/month] for [scope]

### Step 3: Contract Essentials
- Deposit requirement: [percentage]% before work begins
- Revision limit: [N] rounds included
- Payment terms: net-[N] days
- Late fee: [amount or percentage]
- Kill fee: [percentage]% of remaining value
- IP transfer: [on full payment / retained / licensed]

### Step 4: Portfolio
- Pieces curated: [count]
- Format: [website / PDF / platform profile]
- Each piece includes: [problem, approach, result]

### Step 5: Outreach Plan
- Target client profile: [description]
- Weekly outreach target: [N messages]
- Channels: [email / LinkedIn / platform]
- Follow-up cadence: [timing]

### Step 6: Onboarding Process
- Welcome message: [ready / draft]
- Discovery questionnaire: [ready / draft]
- Contract and payment setup: [ready / draft]
- Kickoff meeting agenda: [ready / draft]
- Communication guide: [ready / draft]

### Launch Status
- Infrastructure: [complete / in progress]
- First outreach: [date]
- Pipeline: [N prospects / N active clients]
```

## Edge Cases

- **User has a non-compete clause from their employer:** Before launching, review the non-compete scope. If it restricts freelancing in the same industry, the user may need to: (a) freelance in a different niche until the clause expires, (b) consult a legal professional about enforceability, or (c) wait until the non-compete period ends. This is a legal constraint external to the workflow.

- **User has no portfolio-ready work samples:** If employer work cannot be shared and no personal projects exist, Step 4 must create spec projects from scratch. Allocate 2-4 extra weeks for portfolio building before launching outreach. Target 3 spec projects that mirror the types of work prospective clients need.

- **User is in a field where freelancing is uncommon:** Some industries (e.g., manufacturing, government) have less freelance demand. Step 5 outreach strategy must be adjusted to identify the subset of potential clients who do hire freelancers, which may mean targeting adjacent industries or focusing on remote-first companies that are more accustomed to contractor relationships.

- **User wants to freelance in a completely new skill they are still learning:** This workflow assumes the user already has the skill they plan to sell. If they are still learning, they should use the switch-careers workflow to build competence first, then return to this workflow to monetize the skill.

- **User is in a country with different freelance legal requirements:** Tax rates, business registration requirements, contract enforceability, and payment platforms vary by jurisdiction. Step 1 and Step 3 should be adapted for local regulations. The workflow provides frameworks; the user must verify specifics for their location.

- **Client wants to hire the user full-time instead of freelancing:** This is a success scenario, not a failure. If the user wants to accept, the transition to employment is straightforward. If the user wants to remain freelance, Step 3 contract should include a conversion fee clause (typically 15-25% of first-year salary) payable if the client hires the freelancer within 12 months.

## Expected Outcome

When this workflow is complete, the user will have:

1. A data-backed rate card with hourly, project, and retainer pricing options that cover all business costs and income goals
2. Reusable proposal templates customizable for each client opportunity with clear scope, timeline, and pricing
3. A legally protective contract template with deposit requirements, revision limits, and termination provisions
4. A curated portfolio of 4-6 pieces demonstrating relevant work with measurable results
5. Outreach message templates and a client acquisition system with tracking and follow-up sequences
6. A standardized client onboarding process that sets clear expectations and prevents scope confusion

## Example

**Input:** "I'm a marketing manager at a tech company. I want to start freelancing as a content marketing strategist on the side, with the goal of going full-time in 6 months if it works."

**Output:**

**Step 1 (freelance-rate-calculator):**
Target: $120K per year full-time freelance income. Expenses: $15K per year (software, insurance, retirement). Tax rate: 30% effective. Billable hours target: 25 per week (full-time). Calculated hourly rate: $115 per hour. For side-hustle phase (10 billable hours per week), the rate stays the same -- the user just has fewer billable hours. Market check: content marketing strategists in the user's market charge $85-150 per hour; $115 is mid-range and defensible.

**Step 2 (freelance-proposal-writer):**
Three templates created: (a) One-time content strategy project ($3,500-5,000, includes audit, strategy, editorial calendar), (b) Ongoing content retainer ($2,500-4,000 per month, includes strategy, 4 blog posts, social distribution plan), (c) Content audit only ($1,500-2,000, the low-commitment entry point for skeptical clients).

**Step 3 (freelance-contract-template):**
Master service agreement covers: 50% deposit before work begins, 2 revision rounds included with additional rounds at $115 per hour, net-15 payment terms, IP transfers to client upon full payment, 30-day termination notice with payment for work completed, and scope change process requiring written approval.

**Step 4 (portfolio-building-plan):**
Five portfolio pieces selected from current employer work (with permission) and 1 spec project: (1) Content strategy for SaaS product launch (employer project, anonymized), (2) Blog post series that generated 12K organic visits in 3 months, (3) Email nurture sequence with 35% open rate, (4) Content audit case study showing 45% traffic increase, (5) Spec project: content strategy for a fictional B2B startup demonstrating full planning process.

**Step 5 (cold-outreach-email):**
Outreach targets: B2B SaaS companies with 20-200 employees (big enough to need content marketing, small enough to not have a full in-house team). Message template: "I noticed [Company] is publishing blog content but does not have a consistent content strategy connecting topics to your product's value proposition. Here is what I'd focus on [2 specific suggestions based on their current content]. I helped a similar SaaS company increase organic traffic by 45% with a focused content strategy. Would you be open to a 15-minute conversation?" Weekly target: 12 personalized emails.

**Step 6 (client-onboarding-checklist):**
New client receives: welcome email with next steps, discovery questionnaire (business goals, target audience, existing content assets, brand voice guidelines), contract for e-signature, invoice for 50% deposit, kickoff meeting agenda, and communication guide (email for non-urgent, scheduled weekly sync for updates, shared project tracker for deliverables).

**Result:** Within 4 weeks, the user has all infrastructure in place and begins side-hustle outreach. By week 8, they have 2 paying clients ($5,500 per month combined). By month 5, they have 4 clients ($9,000 per month) and give notice at their full-time job to go freelance full-time.
