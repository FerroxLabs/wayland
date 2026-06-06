---
name: cs-handoff-document
description: |
  Produces a sales-to-customer-success handoff document with customer
  context, commitments made during the sale, success criteria, and
  onboarding plan using CS onboarding methodology. Use when the user
  asks to create a customer handoff document, build a sales-to-CS
  transition template, write a customer onboarding brief, document
  commitments made during a sale, or prepare a new customer for
  implementation.
  Do NOT use for follow-up emails after a sale (use follow-up-sequences),
  customer support scripts (not a sales skill), or internal team
  onboarding (use onboarding-plan).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales template planning checklist"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# CS Handoff Document

## When to Use

Use this skill when the user asks the AI to produce, complete, or improve a sales-to-customer-success handoff document for a newly closed deal. Specific trigger scenarios include:

- The user says a deal just closed and needs a handoff packet built before the sales rep disengages from the account
- The user wants to document every commitment made during the sales process so the CS team inherits the full picture, not just the signed contract
- The user is building or standardizing a handoff template for their sales team to use consistently across all new accounts
- The user needs to brief a newly assigned CSM on a customer they did not sell to themselves -- a common situation with high-velocity sales teams
- The user has a complex enterprise deal with multiple stakeholders, business units, or phased rollouts and needs structured documentation to manage handoff risk
- The user mentions a customer who has a hard go-live deadline, a compliance requirement, or a migration from a competitor product -- all situations where a poorly managed handoff causes immediate churn
- The user wants to reduce time-to-value for new customers and needs a repeatable onboarding brief that connects sales-stated goals to CS-managed milestones

**Do NOT use this skill when:**

- The user needs a post-close follow-up email sequence to the customer -- use `follow-up-sequences`, which handles nurture and thank-you touchpoints
- The user needs a customer support playbook or escalation guide -- that is a CS operations artifact, not a handoff document
- The user is onboarding a new internal employee or team member -- use `onboarding-plan` for internal HR-style onboarding
- The user needs a renewal QBR (Quarterly Business Review) deck -- that is a retention and expansion artifact, not a handoff
- The user is asking for a product demo script or sales discovery framework -- those are pre-sale artifacts
- The user wants a contract summary or statement of work -- those are legal documents, not CS handoffs
- The user is building a customer-facing welcome email or onboarding guide -- the handoff document is internal, not customer-facing

---

## Process

### Step 1: Gather the Essential Inputs Before Writing a Single Line

Never produce a handoff document without the following minimum information. If any item is missing, ask the user explicitly before proceeding.

- **Customer identity:** Company name, legal entity if different from brand name, industry vertical, company size (employees and/or revenue), and headquarters location. Industry vertical matters because CS teams need to understand customer norms -- a hospital buying scheduling software has radically different compliance needs than a restaurant chain.
- **Deal structure:** Product or plan purchased, contract value (ACV or MRR), contract term length, start date, and renewal date. Note whether there are multi-year commitments, auto-renewal clauses, or expansion options (e.g., seat-based pricing that could grow).
- **Key contacts:** At minimum, identify the Economic Buyer (who approved budget), the Champion (who drove internal adoption), the Day-to-Day User (who will live in the product), and the Technical Contact (who owns implementation). These four roles are distinct -- conflating them creates CS blind spots.
- **Why they bought:** The specific pain, not the generic category. "They wanted better reporting" is useless. "They had four analysts spending 12 hours per week manually pulling data from three disconnected systems to produce a Tuesday board report" is actionable.
- **What was promised:** Every commitment made during the sales process, explicitly categorized as hard commitments vs. discussed interests. This distinction is the single most important element of the handoff. Experienced CS teams know that undocumented verbal commitments from sales reps are the primary cause of early churn.
- **Success metrics:** Measurable outcomes with numeric targets, baselines, and timelines. If the customer only gave qualitative goals, work with the user to translate them into measurable proxies (see Step 4).
- **Known risks:** Any concerns, objections, competitive considerations, budget sensitivity, internal politics, or technical limitations surfaced during the sales cycle.

### Step 2: Build the Customer Profile Section

The customer profile is the CSM's orientation document. Write it so a CSM who was not part of the sale can read it in 5 minutes and understand who this customer is and why they matter.

- Write the "Why They Bought" narrative in the customer's own voice where possible -- use phrases from the sales call notes if provided. This language will recur in every QBR and renewal conversation.
- Calculate the total cost of the customer's current pain where the user provides enough data. If they spend 25 hours/week on a manual process at a burdened labor rate of $35/hour across 3 people, that is $136,500/year in labor cost alone. Quantifying the pain anchors the success criteria and the renewal conversation.
- Document the "Primary Use Case" as a workflow narrative, not a feature list. "They will use the scheduling module" is a feature list. "Each location GM logs in Monday morning, reviews auto-generated shift assignments based on employee availability submitted via mobile app, adjusts 2-3 exceptions, and publishes the schedule by noon -- replacing a 5-hour manual Excel process" is a workflow narrative.
- Note the buying process: who else evaluated the product, how long the sales cycle took, and whether this was a top-down mandate or a bottom-up champion push. Top-down mandates often have low end-user adoption risk but high executive expectations. Bottom-up champions often have high adoption but weak executive sponsorship for renewal.
- Include the contract tier and any usage limits (seats, API calls, storage, locations) that CS needs to monitor to prevent out-of-compliance situations or identify expansion triggers.

### Step 3: Document Commitments With Surgical Precision

The commitments section is the most legally and relationally sensitive part of the handoff. Treat it accordingly.

- Use a strict three-tier commitment framework:
  - **Tier 1 -- Contractual:** Items that appear in the signed contract, order form, or MSA. These are non-negotiable and the CS team must deliver them or escalate immediately.
  - **Tier 2 -- Verbal/Promised:** Items the sales rep committed to verbally, in email, or in a proposal that do not appear in the contract. These are high-risk -- document them with specificity: who said it, when, and in what context.
  - **Tier 3 -- Discussed/Expressed Interest:** Topics the customer brought up, features they asked about, or capabilities they hoped for but that were never promised. These are valuable signals for expansion but must never be treated as commitments.
- For timeline commitments, document the exact date or relative timeframe (e.g., "go-live by Q2 end, which is March 31") and note whether this timeline was customer-driven or sales-driven. Customer-driven deadlines (compliance, event, season) are non-negotiable. Sales-driven deadlines (end-of-quarter push) may have been artificially compressed.
- For support level commitments (dedicated CSM, response SLA, training hours, professional services hours), cross-reference against what is actually included in the purchased plan. Gaps between what was promised and what the plan includes must be escalated to CS management before the kickoff call.
- Document pricing commitments with granularity: the locked rate, the discount percentage, the expiration date of the discount, and the expected renewal price. If the customer bought at 40% off for year one, the CS team needs to manage toward that renewal price from day one, not discover the gap at month 11.
- If custom development or product roadmap items were referenced during the sale, document them here and flag them for the CS manager. Sales reps sometimes reference roadmap items as near-term certainties. CS must know whether those items are committed on a roadmap, speculative, or completely unplanned.

### Step 4: Define Measurable Success Criteria

Vague success criteria are a churn risk. "Improve efficiency" cannot be measured, cannot be owned by the CS team, and cannot be used in a renewal conversation.

- For every customer goal mentioned by the user, apply the SMART test: Specific, Measurable, Achievable, Relevant, Time-bound. Transform qualitative goals into quantitative metrics.
- Establish baselines for every metric before go-live. Without a baseline, you cannot demonstrate improvement. Common baselines include: current time spent on a process (hours/week), current error rate (%), current cost ($), current headcount involved in a workflow, and current tool (spreadsheet, legacy system, manual process).
- Define the First-Value Milestone (FVM) -- the specific moment when the customer first experiences tangible, demonstrable benefit from the product. The FVM should occur within the first 14-30 days post go-live. FVMs that slip past 45 days are a leading indicator of churn. Examples of well-defined FVMs:
  - "First auto-generated schedule approved by a GM with fewer than 3 manual edits" (scheduling software)
  - "First month-end close completed in under 5 days using the new workflow" (accounting software)
  - "First automated outreach sequence generates a qualified reply without manual rep intervention" (sales engagement software)
- Create three milestone tiers: 30-day adoption milestones (are users logging in and completing core workflows?), 60-day performance milestones (are key metrics moving toward targets?), and 90-day value milestones (can CS demonstrate measurable ROI to the economic buyer?).
- For enterprise customers with multiple business units or locations, create per-unit success metrics in addition to aggregate metrics. A company with 5 locations that is only succeeding at 3 of them has a real adoption problem even if aggregate numbers look acceptable.
- If the customer has not provided quantitative targets, work with the user to establish reasonable targets based on industry benchmarks. Do not leave metrics as "TBD" -- that signals that nobody owns the outcome.

### Step 5: Build the Onboarding Plan

The onboarding plan converts the success criteria into a sequenced project plan with owners, dependencies, and deliverables.

- Structure the onboarding plan in phases, not just weeks, because implementation complexity varies. A simple SaaS tool might complete onboarding in 4 weeks. An enterprise platform with data migrations and API integrations might run 12-16 weeks. Adjust the timeline to match the actual complexity of the deployment.
- Phase 1 -- Foundation (Week 1-2): Kickoff call, stakeholder alignment, account provisioning, basic configuration, and access setup. The kickoff call is the most important event in the handoff -- it is the first impression the CS team makes on the customer. Brief the CS team on the customer's communication preferences and hot-button topics before this call.
- Phase 2 -- Implementation (Week 2-6 depending on complexity): Core feature configuration, data migration (if applicable), integration setup, and parallel-run period where applicable. Parallel runs are critical for replacement deployments -- the customer runs both the old system and new system simultaneously for 2-4 weeks to build confidence before cutting over.
- Phase 3 -- Adoption (Month 2): End-user training, workflow optimization, internal communication to employees about the new system, and resolution of early adoption blockers. User adoption is where most onboarding plans fail -- document who is responsible for change management inside the customer organization.
- Phase 4 -- Value Confirmation (Month 3): Measure actuals against the success metrics established in Step 4, produce a value report for the economic buyer, identify expansion opportunities, and confirm the path to renewal. Month 3 is not the end of the relationship -- it is the first renewal setup conversation.
- Every milestone must have: a specific owner (name or role -- not "the team"), a due date, a defined deliverable (not just an activity), and a dependency flag if it cannot start until something else completes.
- Identify the critical path -- the sequence of milestones where a delay in any one step delays the entire go-live. Document the critical path explicitly so CS management can monitor it.

### Step 6: Document Risks With Candor

The risks section must be honest. This is the section that sales reps sometimes want to minimize -- resist that pressure.

- Risk documentation follows a standard risk register format: risk description, likelihood (High/Medium/Low), impact (High/Medium/Low), and specific mitigation plan. Generic mitigations like "monitor closely" are insufficient. Write actionable mitigation steps.
- Document competitive context even if it feels uncomfortable. CS needs to know that the customer evaluated a competitor with a stronger mobile app, or that the customer's CEO preferred a different vendor but the champion pushed for this product. That context explains future friction.
- Surface relationship risks: the champion is leaving the company in 60 days, the economic buyer approved the purchase reluctantly, the day-to-day user was not involved in the evaluation and may resist adoption. These are all real handoff risks that experienced sales-to-CS teams document explicitly.
- Technical risks deserve their own sub-section for complex deployments: legacy data format incompatibilities, integration with a system that requires a custom connector, a security review requirement that has not been completed, or an IT approval process for software installation.
- Include an "Internal Notes" section that is explicitly labeled as not for sharing with the customer. This is where the sales rep captures the relationship intelligence that does not belong in a customer-facing document: the CFO who nearly killed the deal, the IT contact who is difficult to work with, the champion who needs to show wins to their VP, the customer who was burned by a previous vendor.

### Step 7: Complete the Handoff Checklist and Verify Readiness

The handoff checklist is a gate -- the sales rep should not disengage until every item is confirmed.

- Assign a CS owner by name before the document is finalized. "TBD" is not acceptable. If a CS owner has not been assigned, escalate to CS management before producing the document.
- Confirm that the kickoff call has been scheduled -- with date, time, and agenda -- before the handoff document is delivered. A handoff document without a scheduled kickoff call has a high probability of sitting in an inbox unread.
- Verify that all contractual commitments have been logged in the CRM (Salesforce, HubSpot, or equivalent). The handoff document is a communication artifact -- the CRM is the system of record.
- Confirm that the technical team (implementation, solutions engineering, or professional services) has received all technical requirements and has acknowledged scope.
- Define the sales-to-CS communication protocol for the transition period: Is the sales rep available for the first 30 days? Under what circumstances does CS loop the sales rep back in? What is the escalation path if a commitment cannot be met?

---

## Output Format

```
## Customer Success Handoff: [Customer Company Name]

**Prepared by:** [Sales Rep Name] | [Email] | [Phone]
**CS Owner:** [CSM Name] | [Email]
**Sales Manager:** [Name]
**Handoff Date:** [Date]
**Kickoff Call Scheduled:** [Date and Time] | [Meeting Link]
**Go-Live Target:** [Date]
**Document Version:** 1.0

---

### 1. Customer Profile

| Field | Details |
|-------|---------|
| Company | [Legal name and operating name if different] |
| Industry | [Vertical -- be specific: e.g., "Outpatient Physical Therapy," not just "Healthcare"] |
| Company Size | [Employees] | [Revenue range if known] |
| HQ Location | [City, State/Country] |
| Other Locations | [Number and geography] |
| Product / Plan | [Product name and tier] |
| Seats / Units | [Number of licensed users, locations, or units] |
| Contract ACV | [$X/year] |
| Contract MRR | [$X/month] |
| Contract Term | [X months] |
| Contract Start | [Date] |
| Renewal Date | [Date] |
| Billing Frequency | [Monthly / Annual / Multi-year] |
| Auto-Renews? | [Yes / No] |
| Expansion Potential | [High / Medium / Low -- reason] |

**Why They Bought (Customer's Voice):**
[2-4 sentences in the customer's own language describing the pain they were experiencing,
the trigger event that caused them to act now, and the outcome they expect.
Example: "Our GMs were spending 25 hours a week across 5 locations building paper schedules.
We had 3 overtime violations last quarter that cost us $2,400 in penalties alone.
Tony needs his managers managing restaurants, not building spreadsheets."]

**Pain Quantification:**
- Current cost of the problem: [$X/year in labor, penalties, or lost revenue -- calculate if data provided]
- Volume of work being replaced: [X hours/week, X processes/month]
- Current tool/system being replaced: [Spreadsheets / Legacy system name / Manual process]

**Primary Use Case:**
[A workflow narrative describing exactly how this customer will use the product day-to-day.
Not a feature list -- a story of what their workday looks like after go-live.]

**Buying Process Context:**
- Sales cycle length: [X weeks/months]
- Decision-making style: [Top-down mandate / Bottom-up champion / Committee]
- Who drove the purchase internally: [Name and role]
- Was there internal resistance? [Yes/No -- if yes, from whom and why]

---

### 2. Key Contacts

| Name | Title | Role in Account | Email | Phone | Best Contact Method | What They Care About Most |
|------|-------|----------------|-------|-------|---------------------|--------------------------|
| [Name] | [Title] | Economic Buyer | [Email] | [Phone] | [Email/Call/Slack] | [ROI / cost savings / compliance] |
| [Name] | [Title] | Champion | [Email] | [Phone] | [Preference] | [Career win / efficiency / team morale] |
| [Name] | [Title] | Day-to-Day User | [Email] | [Phone] | [Preference] | [Ease of use / time savings] |
| [Name] | [Title] | Technical Contact | [Email] | [Phone] | [Preference] | [Security / stability / integrations] |
| [Name] | [Title] | End Users (Group) | [Email] | [Phone] | [Preference] | [Mobile app / simplicity] |

**Internal Champion Deep Dive:**
- Name: [Name]
- Why they championed this deal: [Their personal motivation -- career win, solve a team problem, etc.]
- Their relationship with the economic buyer: [Strong / Weak / Uncertain]
- Risk of champion departure: [Low / Medium / High -- reason if elevated]
- What the CS team should do in the first 30 days to strengthen this relationship: [Specific action]

---

### 3. Commitments Made During the Sale

**3A. Tier 1 -- Contractual Commitments (in signed agreement)**

| # | Commitment | Contract Reference | Specifics | Timeline | CS Owner |
|---|-----------|-------------------|-----------|----------|----------|
| 1 | [e.g., Dedicated CSM] | Order Form Section 4 | [Name/level of CSM] | [Ongoing from start date] | CS Manager |
| 2 | [e.g., Implementation support] | SOW Item 2 | [X hours of onboarding support] | [First 60 days] | CSM |
| 3 | [e.g., Uptime SLA] | MSA Section 9.2 | [99.9% uptime guarantee] | [Ongoing] | Engineering |

**3B. Tier 2 -- Verbal / Promised Commitments (not in contract)**

| # | Commitment | Who Said It | When / Context | Specifics | Timeline | CS Owner | Risk Level |
|---|-----------|------------|----------------|-----------|----------|----------|------------|
| 1 | [e.g., API integration with QuickBooks] | [Rep Name] | [Demo call, 11/3] | [Bi-directional sync of payroll data] | [30 days post go-live] | Technical team | High |
| 2 | [e.g., Custom report] | [Rep Name] | [Final negotiation] | [Monthly overtime summary report] | [Before go-live] | CSM | Medium |

**⚠️ VERBAL COMMITMENT RISK ASSESSMENT:**
[Note any verbal commitments that are difficult to deliver, require resources not yet allocated,
or conflict with product roadmap. Escalate to CS Manager before kickoff call.]

**3C. Tier 3 -- Discussed but NOT Promised (expansion signals only)**

| Topic | Context | Customer's Level of Interest | Follow-Up Timeline |
|-------|---------|------------------------------|-------------------|
| [e.g., Multi-location reporting dashboard] | [Asked in demo -- said "would be nice to have"] | Medium | Month 3 check-in |
| [e.g., HR system integration] | [Mentioned their HRIS -- did not ask for it specifically] | Low | Month 6 |

**Pricing Commitments:**
- Year 1 price: $[X] ([X]% discount off list price of $[Y])
- Discount expiration: [Date]
- Year 2 renewal price: $[X] (if agreed)
- Any multi-year price lock? [Yes/No -- terms if yes]
- Billing notes: [Anything unusual about billing terms, PO requirements, net payment terms]

---

### 4. Success Criteria

**Customer's Definition of Success (Their Words):**
"[Direct quote or close paraphrase from the customer describing what winning looks like for them.
This quote should be used in every QBR, renewal conversation, and check-in email.]"

**Pain Baseline and Success Targets:**

| # | Metric | Current Baseline | Target | Improvement | Timeline | How to Measure | CS Owner |
|---|--------|-----------------|--------|-------------|----------|----------------|----------|
| 1 | [e.g., Hours/week on scheduling] | [25 hrs/week across 5 locations] | [5 hrs/week total] | [80% reduction] | [60 days post go-live] | [GM self-reported monthly log] | [CSM] |
| 2 | [e.g., Overtime violations per quarter] | [3/quarter] | [0/quarter] | [100% elimination] | [First full quarter] | [Payroll export] | [CSM] |
| 3 | [e.g., Employee adoption rate] | [0% -- no app] | [80% of staff] | [New capability] | [30 days post go-live] | [App login analytics] | [CSM] |
| 4 | [e.g., Schedule publish turnaround time] | [5 hours/location] | [< 1 hour/location] | [80% reduction] | [60 days] | [System audit log] | [CSM] |

**First-Value Milestone (FVM):**
- What it is: [The specific, demonstrable moment when the customer first sees value]
- Target date: [Date -- should be within 14-30 days of go-live]
- How it will be measured: [Specific data point or observation]
- Who confirms it: [Customer contact who will acknowledge it]
- CS action when achieved: [Email to champion + economic buyer + note in CRM]

**30-Day Success Checkpoint:**
- [ ] [Specific adoption metric -- e.g., "All 5 GMs have logged in and created at least one schedule"]
- [ ] [Core feature in use -- e.g., "Employees have submitted availability via mobile app"]
- [ ] [Technical stability -- e.g., "No integration errors reported"]

**60-Day Success Checkpoint:**
- [ ] [Performance metric -- e.g., "Scheduling time reduced by at least 50% from baseline"]
- [ ] [Adoption metric -- e.g., "70%+ of employees active on mobile app"]
- [ ] [Commitment delivery -- e.g., "QuickBooks integration live and reconciling"]

**90-Day Value Confirmation:**
- [ ] [ROI metric -- e.g., "Scheduling time at or below 1 hr/location/week"]
- [ ] [Business outcome -- e.g., "Zero overtime violations in first full calendar quarter"]
- [ ] [Customer satisfaction -- e.g., "Champion confirms value in monthly call"]
- [ ] [Renewal setup -- "Expansion conversation initiated"]

---

### 5. Onboarding Plan

**Onboarding Overview:**
- Total onboarding duration: [X weeks]
- Onboarding complexity: [Simple / Standard / Complex / Enterprise]
- Critical path risk: [Low / Medium / High -- reason]
- Parallel run required? [Yes / No -- reason]

**Phase 1: Foundation (Dates: [Start] -- [End])**

| Milestone | Activity | Owner | Dependency | Due Date | Deliverable |
|-----------|----------|-------|------------|----------|-------------|
| Kickoff Call | 60-min call: intro CS team, review commitments, confirm go-live plan | CSM + Sales Rep | Kickoff call scheduled | [Date] | Meeting notes + action items sent within 24 hours |
| Account Provisioning | Create org, provision admin users, configure permissions | CSM | Kickoff call complete | [Date] | Admin users logged in, account configured |
| Technical Setup | IT security review, SSO configuration, network access if applicable | Technical + Customer IT | Account provisioned | [Date] | Technical setup confirmed |
| Data Migration Kickoff | Inventory existing data, confirm format, begin migration | CSM + Customer | Account provisioned | [Date] | Data migration plan confirmed |

**Phase 2: Implementation (Dates: [Start] -- [End])**

| Milestone | Activity | Owner | Dependency | Due Date | Deliverable |
|-----------|----------|-------|------------|----------|-------------|
| Core Configuration | Configure primary workflows, locations, user groups, rules | CSM | Phase 1 complete | [Date] | System mirrors customer's operational structure |
| Integration Setup | Build and test all committed integrations (list each by name) | Technical | Core config complete | [Date] | Integration tested with live data |
| Parallel Run Start | Customer runs old system alongside new system | Customer + CSM | Integration live | [Date] | Dual-run protocol confirmed |
| Data Migration Complete | All historical data migrated and verified by customer | CSM + Customer | Parallel run start | [Date] | Customer signs off on data accuracy |

**Phase 3: Training and Adoption (Dates: [Start] -- [End])**

| Milestone | Activity | Owner | Dependency | Due Date | Deliverable |
|-----------|----------|-------|------------|----------|-------------|
| Admin Training | [X hours] admin training for power users | CSM | Implementation complete | [Date] | Admins certified/confident |
| End-User Training | [Format: live/webinar/self-serve] for all end users | CSM + Champion | Admin training | [Date] | [X]% of users completed training |
| Go-Live | Cut over from old system to new system | Customer + CSM | Training complete | [Date] | Old system retired or parallel run ended |
| First-Value Milestone | Confirm FVM has been achieved and document it | CSM | Go-live | [Date] | FVM confirmed and communicated to economic buyer |

**Phase 4: Value Confirmation (Dates: [Start] -- [End])**

| Milestone | Activity | Owner | Dependency | Due Date | Deliverable |
|-----------|----------|-------|------------|----------|-------------|
| 30-Day Check-In | Adoption review, blocker resolution, FVM confirmation | CSM | Go-live | [Date] | Check-in summary + action items |
| 60-Day Performance Review | Metric review vs. baselines, expansion signals identified | CSM | 30-day check-in | [Date] | Performance report shared with champion |
| 90-Day Value Review | Full ROI review vs. success criteria, renewal path discussion | CSM + Economic Buyer | 60-day review | [Date] | Value report + renewal conversation initiated |

---

### 6. Technical Handoff (Complete only if technical integration or migration required)

**Technical Scope:**
- Integrations committed: [List each integration by name and type]
- Data migration required: [Yes/No -- volume and format if yes]
- Security requirements: [SSO, SOC 2, HIPAA, etc.]
- IT approval process: [Required / Not required -- status]
- API access needed: [Yes/No -- endpoints]

**Technical Contacts:**

| Name | Company | Role | Email | Phone |
|------|---------|------|-------|-------|
| [Name] | [Customer] | Customer IT Lead | [Email] | [Phone] |
| [Name] | [Vendor] | Implementation Engineer | [Email] | [Phone] |
| [Name] | [Vendor] | Solutions Engineer | [Email] | [Phone] |

**Technical Timeline:**
[Separate Gantt-style table for technical milestones, parallel to business milestones]

**Open Technical Issues:**
[List any unresolved technical questions that must be answered before implementation can proceed]

---

### 7. Risks and Flags

**Risk Register:**

| # | Risk | Likelihood | Impact | Risk Score | Mitigation Plan | Owner | Review Date |
|---|------|-----------|--------|-----------|----------------|-------|-------------|
| 1 | [e.g., Champion leaving company] | Medium | High | High | Identify secondary champion in Phase 1 | CSM | [Date] |
| 2 | [e.g., IT approval delay blocking integration] | High | Medium | High | Begin IT intro call in Week 1, not Week 3 | Technical | [Date] |
| 3 | [e.g., End-user resistance to mobile app] | Medium | Medium | Medium | Champion to communicate change management plan internally | Customer Champion | [Date] |
| 4 | [e.g., Tight go-live deadline] | Low | High | High | Protect critical path; escalate any Phase 1 delays immediately | CSM | [Date] |

**Competitive Context:**
- Vendors evaluated: [List competitors considered]
- Why they chose us: [The 2-3 decisive factors -- be specific]
- Where competitors had an advantage: [Honest assessment -- what CS should be aware of]
- Customer's alternative if unhappy: [Would they go back to competitor / build internally / tolerate status quo]

---

### 8. Internal Notes (NOT for sharing with customer)

**Relationship Intelligence:**
[What the sales rep would tell the CSM over coffee -- relationship dynamics, personality notes,
hot-button topics, stakeholders to handle carefully, political context inside the customer org]

**Deal History:**
[How the deal closed -- was it clean? Was there last-minute negotiation pressure?
Did the customer feel like they got a good deal or a compromise?]

**Watch Items:**
[Anything that could go wrong that is not a formal risk but the CSM should have in the back of their mind]

**Sales Rep Availability Post-Close:**
- Available for questions: [Yes -- through what date]
- Escalation path: [How does CS loop sales rep back in if needed]
- CRM notes location: [Link to deal record]

---

### 9. Handoff Checklist

**Pre-Handoff (Sales Rep responsibility):**
- [ ] CS owner assigned by name (not TBD)
- [ ] Kickoff call scheduled with date, time, and agenda
- [ ] All contractual commitments documented in Section 3A
- [ ] All verbal commitments documented in Section 3B
- [ ] Success metrics have numeric baselines and targets (no "improve efficiency")
- [ ] Technical team briefed and has confirmed scope acceptance
- [ ] CRM opportunity updated with all contact info and contract terms
- [ ] This document delivered to CS owner at least 48 hours before kickoff call

**Post-Handoff (CS Owner responsibility):**
- [ ] Handoff document reviewed and questions asked back to sales rep
- [ ] Kickoff call agenda prepared using commitments and success criteria from this document
- [ ] Onboarding project created in project management tool with owners and due dates
- [ ] Customer contacts added to CS communication cadence
- [ ] First-Value Milestone date entered into CS platform as a hard target
- [ ] 30/60/90 day reviews scheduled on calendar
- [ ] Verbal commitments reviewed with CS manager for deliverability
- [ ] Sales rep introduced the CSM to customer before sales rep fully disengages
```

---

## Rules

1. **Never produce a handoff document with a "TBD" CS owner.** If the user has not named a CSM, instruct them to assign one before the document is delivered. A handoff document with no named CS owner is an accountability vacuum -- every at-risk account begins as a nameless account.

2. **The three-tier commitment framework is mandatory.** Never collapse Tier 2 (verbal commitments) and Tier 3 (discussed interests) into a single list. The single most common cause of early-stage churn is a customer who believes something was promised that was never delivered. Documented, categorized commitments are the CSM's protection.

3. **Every success metric must have a numeric baseline before go-live.** If the user cannot provide a baseline, instruct them to ask the customer for it during the kickoff call -- and add "baseline collection" as a Week 1 milestone. A metric without a baseline cannot demonstrate improvement and cannot anchor a renewal conversation.

4. **The First-Value Milestone must occur within 30 days of go-live.** If the user's proposed timeline puts the FVM at 45 days or later, flag this as an onboarding risk. Research in SaaS CS consistently shows that customers who do not experience tangible value within 30 days have materially higher 90-day churn rates.

5. **Every onboarding milestone must have a named owner.** "The team will handle it" is not an owner. If the user cannot name an owner, write "TO ASSIGN -- CS Manager action required" and flag it explicitly. Ownerless milestones slip.

6. **Pricing commitments must include the renewal price, not just the contract price.** A customer who bought at 40% off list price and has never been told their renewal price is a renewal conversation waiting to go badly. Document the expected renewal price and the date it must be introduced in conversation.

7. **The internal notes section must never be sanitized into uselessness.** If the user seems reluctant to document relationship intelligence, explain that this section is internal only and that CSMs who inherit accounts without this context regularly damage relationships that could have been managed carefully. The coffee conversation belongs in the document.

8. **Never skip the competitive context section.** CS teams that do not know what alternatives the customer evaluated cannot defend against competitive threats at renewal. The competitor whose mobile app the customer preferred is the competitor whose renewal pitch will land in the customer's inbox at month 10.

9. **Technical handoff scope must be confirmed by the technical team, not just documented by sales.** If the user describes a complex integration or data migration, instruct them to add a step where the technical team reviews and accepts the scope before the kickoff call. Scope acceptance prevents post-kickoff surprises that destroy trust.

10. **The kickoff call must be scheduled before the handoff document is considered complete.** A handoff document without a scheduled kickoff call has approximately a 40% probability of a delayed first meeting, based on patterns common in high-velocity sales environments. Scheduling the kickoff call is part of the handoff -- not a follow-up action.

---

## Edge Cases

### Enterprise Deal With Multiple Business Units or Locations

When a customer has more than one business unit, department, or location that will onboard separately, the standard single-track onboarding plan breaks down. Handle this as follows: create a master onboarding plan showing the phased rollout sequence (which unit goes first and why -- typically the most motivated champion's unit, not the largest), then create a sub-plan for each unit. Note cross-unit dependencies -- a shared SSO configuration or master data schema must be completed before any individual unit can onboard. Document separate success criteria per unit as well as aggregate targets. Assign a primary CS contact per unit if the deal is large enough to warrant it, or document how the single CSM will divide their time across units. Flag the risk that a failure in the pilot unit will poison enthusiasm in later units.

### Customer Purchased With Heavy Discount or Promotional Pricing

Discount-heavy deals create a predictable renewal crisis if CS is not managing toward it from day one. Document the following explicitly: the year-one price, the list price, the discount percentage, the expiration date of the discount, and the target renewal price. Calculate the renewal price increase in dollar terms -- a customer paying $12,000/year at 50% off who faces an $24,000 renewal is a very different conversation than the percentage implies. Flag this for the CSM with a specific recommendation: introduce the renewal price and justify it with ROI evidence no later than month 6. If the value case is not established by month 6, month 11 is too late to build it. Also note whether the discount was granted to close a quarter -- a customer who knows they have negotiating leverage will use it again at renewal.

### Hard External Go-Live Deadline (Compliance, Regulatory, Seasonal, or Event-Driven)

When a customer must go live by a specific non-negotiable date -- HIPAA audit in 90 days, holiday season starting in 8 weeks, board presentation in 6 weeks -- the entire handoff document must be oriented around that deadline. Build the onboarding plan backward from the deadline, not forward from today. Identify the critical path explicitly: list every milestone that, if delayed, delays go-live. Assign an escalation protocol -- if any critical path milestone slips by more than 3 business days, the CS Manager and Sales Manager are notified immediately. Build buffer time explicitly (minimum 5 business days before deadline for final testing and user acceptance). Note the cost to the customer of missing the deadline -- a compliance violation, a missed sales season, or an embarrassing board meeting -- so CS understands what is at stake. Do not use aspirational language like "we will aim to go live by" -- use "go-live by [date] is non-negotiable."

### Customer Is Replacing a Competitor or Legacy System (Migration Deal)

Migration deals require a parallel-run period and a detailed data migration plan that standard new-sale onboarding templates do not include. Add a dedicated migration section to the onboarding plan that covers: inventory of existing data to be migrated (volume, format, location), data cleaning requirements before migration, mapping of old system fields to new system fields, migration testing protocol (migrate a subset, validate, then migrate all), parallel-run period duration (typically 2-4 weeks), cutover criteria (what conditions must be true before the old system is retired), and the sunset plan for the legacy system. Also document which features the customer used in the old system that do not exist in the new product -- these are the places where buyer's remorse and early churn begin. If a feature is on the roadmap, say so with a realistic timeline. If it is not on the roadmap, document it in internal notes so CS can manage expectations proactively.

### Champion Departure Risk

If the user mentions that the internal champion is new to their role, recently promoted, in a volatile industry, or has expressed any intention to move on, flag champion departure as a specific risk with a concrete mitigation plan. The mitigation plan should include: identify a secondary champion during Phase 1 onboarding, ensure the economic buyer is aware of and engaged with the product's value (not just the champion), document the product's value independently of any one person's advocacy, and brief the secondary champion on the product during training. If the champion does depart, the CSM needs a "day one of champion departure" protocol: introduce themselves immediately to the incoming leader, rerun the success criteria conversation, and treat the new contact as a new sales conversation in terms of demonstrating value. A product that loses its champion without a backup relationship is at approximately 3x normal churn risk.

### Startup or Early-Stage Customer With Evolving Requirements

Startup customers often close deals in a state of organizational flux -- they may not have defined their workflows, may not know their final user count, and may pivot their use case within 90 days of signing. Handle this by: noting the stage and growth trajectory of the company in the customer profile, building more flexibility into the onboarding plan (fewer rigid deliverables, more collaborative working sessions), scheduling a week-6 "requirements alignment" call explicitly to reconfirm that the original use case still reflects the customer's current direction, and documenting the contracted scope clearly so the CS team can identify when the customer's evolving needs require a plan change or an expansion conversation. Do not treat startup customers' informal communication style as a signal that documentation is unnecessary -- it is actually more necessary because institutional memory is thin and key contacts change frequently.

### Multi-Product or Bundle Purchase

When a customer purchases multiple products, modules, or add-ons simultaneously, the temptation is to onboard everything at once. Resist this. Create a phased onboarding plan that prioritizes the product most directly connected to the stated primary success metric in Phase 1. Additional products are introduced in Phase 2 or Phase 3 after the customer has achieved the First-Value Milestone on the core product. Trying to onboard multiple products simultaneously overloads the customer's change management capacity, creates confusion about which product to blame if adoption is slow, and dilutes the CSM's focus. Document the sequence explicitly in the onboarding plan with the rationale: "QuickBooks integration in Phase 1 because it is on the critical path to scheduling automation. HR system integration in Phase 2 after GMs are confident with core scheduling."

---

## Example

**Input from user:** "We just closed Pinnacle Physical Therapy. They have 8 outpatient PT clinics across the Southeast. They bought our practice management software -- specifically the scheduling and billing modules. Annual contract is $28,800 ($3,600/month) for 45 providers and front-desk staff. They are replacing a 12-year-old legacy system called CareTrack. The decision maker is Linda Nguyen, VP of Operations. The champion is Marcus Webb, their IT Director. Main goals are to reduce appointment no-show rate and automate insurance claim submissions. Sales rep promised a QuickBooks integration in the first 30 days, which is NOT in the contract. Go-live target is 10 weeks from now. Create the handoff document."

**Output:**

---

## Customer Success Handoff: Pinnacle Physical Therapy

**Prepared by:** [Sales Rep Name] | [email@company.com] | [555-xxx-xxxx]
**CS Owner:** [CSM Name -- TO BE ASSIGNED before kickoff]
**Sales Manager:** [Name]
**Handoff Date:** [Current date]
**Kickoff Call Scheduled:** [DATE REQUIRED -- schedule before this document is delivered]
**Go-Live Target:** [Current date + 10 weeks]
**Document Version:** 1.0

---

### 1. Customer Profile

| Field | Details |
|-------|---------|
| Company | Pinnacle Physical Therapy |
| Industry | Outpatient Physical Therapy / Allied Health |
| Company Size | ~45 providers and front-desk staff across 8 clinics |
| HQ Location | Southeast US |
| Other Locations | 8 outpatient clinic locations |
| Product / Plan | Practice Management Software -- Scheduling + Billing Modules |
| Seats / Units | 45 licensed users; 8 clinic locations |
| Contract ACV | $28,800/year |
| Contract MRR | $3,600/month |
| Contract Term | 12 months |
| Contract Start | [Current date] |
| Renewal Date | [Current date + 12 months] |
| Billing Frequency | Monthly |
| Auto-Renews? | [Confirm -- ask sales rep] |
| Expansion Potential | High -- additional modules (documentation, patient outcomes reporting) and potential headcount growth as clinics expand |

**Why They Bought (Customer's Voice):**
"We are losing revenue every week to no-shows we cannot backfill because we have no automated reminder system. Our billing team is manually entering insurance claims into a system that is 12 years old and cannot talk to any modern payer clearinghouse -- our clean claim rate is around 72% and we are spending 3 full days per week on rework and denials. CareTrack was built before telehealth existed and before modern payer APIs. We need a system that can handle today's billing complexity and get patients to actually show up for their appointments."

**Pain Quantification:**
- No-show revenue loss estimate: At an average PT session value of $175, if 8 clinics each have 3 avoidable no-shows per week, that is approximately $218,400/year in unrecovered lost appointment revenue
- Insurance claim rework cost: If billing staff spend 3 days/week on claim rework at a burdened rate of $28/hour, that is approximately $43,680/year in wasted labor, plus the cost of delayed reimbursement
- Current tool being replaced: CareTrack (12-year-old legacy practice management system) -- full migration required

**Primary Use Case:**
Front-desk staff at each clinic use the scheduling module to manage daily appointment books, automated SMS and email reminders are sent to patients 48 hours and 2 hours before appointments, and providers receive mobile check-in notifications. On the billing side, completed appointment notes trigger automated claim submission to the payer clearinghouse, eligibility verification runs at booking, and remittance advice is reconciled automatically -- eliminating the manual entry workflow that currently generates a 28% claim error rate.

**Buying Process Context:**
- Sales cycle length: [X weeks -- fill in]
- Decision-making style: Top-down approval from Linda Nguyen (VP Ops) with strong technical advocacy from Marcus Webb (IT Director)
- Who drove the purchase internally: Marcus Webb -- evaluated 3 systems, produced a recommendation memo to Linda
- Internal resistance: [Ask sales rep -- was there resistance from billing team or clinic managers?]

---

### 2. Key Contacts

| Name | Title | Role in Account | Email | Phone | Best Contact Method | What They Care About Most |
|------|-------|----------------|-------|-------|---------------------|--------------------------|
| Linda Nguyen | VP of Operations | Economic Buyer | [email] | [phone] | Email | Revenue impact, compliance, clean ROI narrative |
| Marcus Webb | IT Director | Champion + Technical Contact | [email] | [phone] | Email / Slack | Clean implementation, integration stability, no surprises for Linda |
| [Name TBD] | Billing Manager | Day-to-Day User (Billing) | [email] | [phone] | [Preference] | Claim accuracy, less manual rework, faster reimbursement |
| [Name TBD] | Clinic Manager (Lead Location) | Day-to-Day User (Scheduling) | [email] | [phone] | [Preference] | Ease of use, reducing no-shows, staff not overwhelmed |
| [Name TBD] | Front Desk Lead | End User Group Rep | [email] | [phone] | [Preference] | Simple scheduling UI, not more steps than CareTrack |

**⚠️ CONTACT GAPS:** Billing Manager and Clinic Manager names are unknown. CSM must obtain these in the kickoff call. These two users are higher daily-usage contacts than Marcus -- their adoption is critical to success.

**Internal Champion Deep Dive:**
- Name: Marcus Webb
- Why he championed this deal: Marcus produced the evaluation memo and staked professional credibility on this recommendation. He is motivated to prove the selection was right. He has strong technical confidence but lower visibility into daily clinical workflows.
- His relationship with Linda Nguyen: Appears strong -- she trusted his recommendation
- Risk of champion departure: Unknown -- flag for CSM to assess in kickoff call
- What CS should do in first 30 days: Give Marcus early wins he can report upward. Send him a written summary of successful milestones he can forward to Linda. He needs visible proof that his recommendation is paying off.

---

### 3. Commitments Made During the Sale

**3A. Tier 1 -- Contractual Commitments (in signed agreement)**

| # | Commitment | Contract Reference | Specifics | Timeline | CS Owner |
|---|-----------|-------------------|-----------|----------|----------|
| 1 | Scheduling module | Order Form | Full scheduling module with automated SMS/email reminders for 8 locations | Go-live in 10 weeks | CSM |
| 2 | Billing module | Order Form | Insurance claim submission, eligibility verification, ERA reconciliation | Go-live in 10 weeks | CSM + Billing Implementation Specialist |
| 3 | Data migration from CareTrack | SOW (confirm if included) | [Confirm scope with sales rep -- was migration included in contract?] | Phase 2 | Technical Team |
| 4 | Training | Order Form | [X hours of training -- confirm number from contract] | Phase 3 | CSM |

**⚠️ CONTRACT VERIFICATION NEEDED:** Confirm with sales rep whether data migration from CareTrack is in the SOW or is expected as a CS-delivered service outside the contract scope. Migration scope must be confirmed before kickoff call.

**3B. Tier 2 -- Verbal / Promised Commitments (NOT in contract)**

| # | Commitment | Who Said It | When / Context | Specifics | Timeline | CS Owner | Risk Level |
|---|-----------|------------|----------------|-----------|----------|----------|------------|
| 1 | QuickBooks integration | Sales Rep | [Date/context -- confirm with rep] | Bi-directional sync of billing/revenue data with QuickBooks | 30 days post go-live | Technical Team | 🔴 HIGH |

**⚠️ CRITICAL FLAG -- QuickBooks Integration:**
This commitment is NOT in the contract but was verbally promised by the sales rep. Before the kickoff call, the CS Manager must:
1. Confirm with the technical team whether a native QuickBooks integration exists or must be built
2. Confirm the timeline -- 30 days post go-live is aggressive given the CareTrack migration is also in progress
3. If the integration cannot be delivered in 30 days, the sales rep must contact Linda Nguyen or Marcus Webb proactively to reset the timeline before CS inherits the expectation
4. Document the resolution of this risk in writing before the kickoff call

**3C. Tier 3 -- Discussed but NOT Promised (expansion signals)**

| Topic | Context | Customer's Level of Interest | Follow-Up Timeline |
|-------|---------|------------------------------|-------------------|
| Patient outcomes reporting module | Marcus mentioned it in demo -- Linda nodded | Medium-High | Month 3 QBR |
| Telehealth scheduling add-on | Linda asked about it -- "we are starting to think about that" | Medium | Month 6 |
| Additional clinic locations | Pinnacle has plans to open 2 more clinics in 18 months | High expansion signal | Month 9 |

**Pricing
