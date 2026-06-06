---
name: scaling-checklist
description: |
  Produces an operations scaling checklist covering team, systems, processes, finance, and legal readiness for a business transitioning from startup to growth stage. Use when the user asks about scaling operations, growth readiness, scaling a startup, operations checklist, or preparing to scale.
  Do NOT use for product launch (use product-launch-checklist), MVP scoping (use mvp-definition), or financial modeling (use financial-model-structure).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship planning strategy checklist project-management"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Scaling Checklist

## When to Use

**Use this skill when:**
- The user's business has demonstrated product-market fit and is preparing to scale operations -- typically evidenced by consistent month-over-month growth of 15%+ for 3+ consecutive months, a Net Promoter Score above 40, or an unsolicited inbound demand that the team cannot service fast enough
- The user asks about what needs to be in place to grow from early traction (10-50 customers, $10K-$50K MRR) to meaningful scale (200-1,000 customers, $500K-$5M ARR) within a 12-24 month window
- The user wants to assess operational readiness before deploying new capital -- this is one of the highest-leverage moments for a scaling checklist because capital amplifies both strengths and weaknesses
- The user describes specific symptoms of premature or unmanaged scaling: support tickets piling up, founder still closing every deal personally, onboarding taking longer than it did 6 months ago, engineers firefighting instead of shipping features, or churn suddenly accelerating
- The user has received a term sheet, closed a funding round, or is anticipating a large enterprise contract that will require demonstrably more operational capacity
- The user is preparing for a Series A and needs to demonstrate to investors that the business has the operational infrastructure to deploy growth capital efficiently
- The user explicitly asks about growing pains, scaling challenges, organizational design, or operational bottlenecks at the startup-to-growth-stage transition

**Do NOT use this skill when:**
- The user needs a product launch plan for a new feature or product line -- use `product-launch-checklist` instead
- The user is still defining or refining their MVP and has not yet found product-market fit -- use `mvp-definition` instead, because building scaling infrastructure before PMF is premature optimization that wastes capital
- The user needs a financial model with growth projections, scenario analysis, or unit economics modeling -- use `financial-model-structure` instead, though the scaling checklist will reference unit economics thresholds
- The user needs a fundraising narrative or pitch deck -- use `fundraising-narrative` instead, though scaling readiness is a common investor diligence topic
- The user is a large enterprise running a transformation initiative -- this skill is specifically calibrated for the startup-to-growth transition (roughly $0-$10M ARR), not corporate transformation programs
- The user is asking purely about product roadmap prioritization -- that is a product strategy question, not an operations scaling question

---

## Process

### Step 1: Establish Current State Baselines with Precision

Before building any checklist, gather specific data across five baseline dimensions. Generic answers produce generic checklists. Specificity determines which items are "must have now" versus "build later."

- **Revenue metrics:** Collect MRR or ARR, MoM growth rate for the last 6 months, average contract value (ACV), and revenue concentration (what percentage of revenue comes from the top 3 customers? If it exceeds 30%, that is a scaling risk that belongs on the checklist)
- **Customer metrics:** Total active customers, monthly churn rate (logo churn and net revenue retention separately), average time to close a new deal, and average time to onboard a new customer fully
- **Team composition:** Full list of team members with actual responsibilities (not job titles) -- this reveals who is wearing multiple hats and where single points of failure exist; a 5-person team where the founder is still doing customer support, final QA approval, and closing every enterprise deal has three single points of failure before scaling begins
- **Infrastructure state:** Current infrastructure cost per customer per month, any known technical debt items that cause instability, and whether the system has ever been load tested beyond 2x current usage
- **What is already breaking:** Ask this question explicitly -- "What is the first thing that will snap if you double your customer count tomorrow?" The answer almost always becomes a Priority 1 item on the checklist
- **Business model classification:** SaaS (subscription), transactional (usage-based), marketplace (take rate), services (time and materials), or hybrid -- the model determines which scaling dimensions are most critical; a marketplace has completely different bottlenecks than a SaaS

### Step 2: Define the Target Scale and What It Actually Requires

Scaling "from 50 to 200 customers" sounds simple but implies a specific set of structural requirements. Map the target state rigorously.

- **Calculate the implied operational load:** 4x customers means approximately 4x support volume, 4x onboarding runs, 4x infrastructure load, and 4x sales activity to maintain a constant close rate -- every checklist item should be evaluated against this multiplier
- **Identify the target organizational structure:** A team of 5 scaling to 200 customers in 12 months typically needs to reach 12-18 people; map out the org chart at the target state including functional areas (Engineering, Sales, Customer Success, Marketing, Finance/Ops) and reporting lines
- **Define Series A readiness criteria if applicable:** Investors typically want to see 3x YoY ARR growth, net revenue retention above 110%, gross margin above 70% for SaaS, a repeatable sales motion with a cycle under 90 days, and a documented playbook for each revenue-generating function
- **Establish the go/no-go criteria for launching scaled operations:** Agree on which checklist items are true blockers (scaling cannot begin without them) versus parallel-track items (can be built while scaling proceeds)
- **Set the 90-day, 6-month, and 12-month milestones:** Scaling is not a switch that flips -- it is a 12-18 month transition; define what "done" looks like at each interval so progress is measurable

### Step 3: Audit Dimension 1 -- Team, Hiring, and Organization

Team scaling is almost always the rate-limiting constraint. Most operational failures during scaling are people failures, not technology failures.

- **Identify single points of failure immediately:** If any critical function (closing deals, handling escalations, approving releases, managing payroll) depends on exactly one person who is not the founder, that is a hiring priority before scaling begins
- **Map the founder's current time allocation across functions:** Most founders at the pre-scale stage are spending 20-40% of their time on tasks that should be delegated -- customer calls, support escalations, hiring interviews for every role, approving every purchase; document these explicitly because they become the first delegation checklist
- **Define the hiring sequence using the 80/20 of revenue impact:** The first 3 hires at the scale stage should be chosen to remove the bottlenecks most directly limiting revenue -- typically: (1) a head of sales or second sales rep if the founder is the only seller, (2) a customer success lead if the support burden is preventing product development, and (3) an engineering lead or second senior engineer if infrastructure is fragile
- **Assess management layer readiness:** A founder managing 12 people directly with no management layer creates a bottleneck that worsens with every hire; the rule of thumb is that a management layer should be introduced before the team exceeds 8 direct reports; identify which existing team members have management potential and whether they need training
- **Audit hiring infrastructure:** Does the company have a structured interview process with defined criteria for each role? Is there an offer letter template reviewed by employment counsel? Is there an onboarding checklist that gets a new hire to productivity within 30 days? Without these, each new hire takes disproportionate founder time
- **Check compensation structure:** Are salary bands defined for each role? Is the equity plan (pool size, vesting schedule, cliff terms) documented and consistently communicated? Inconsistent compensation practices become legal and cultural liabilities at scale
- **Review culture documentation:** Values that exist only in the founder's head cannot be transmitted to a 15-person team; they must be written, demonstrated in hiring criteria, and reinforced in performance conversations

### Step 4: Audit Dimension 2 -- Systems and Technical Infrastructure

Infrastructure failures during scaling are catastrophic because they damage trust with customers at exactly the moment when reputation is being built. Audit each layer specifically.

- **Load test the product against the target scale, not just current usage:** For a company going from 50 to 200 customers, test at 400 concurrent users (2x the target, not just the target) -- a useful rule is to load test to 2x the 12-month target so headroom exists; document the results including latency degradation curves, error rates at load, and which specific components fail first
- **Audit the data infrastructure for metrics-driven management:** At scale, the CEO cannot rely on intuition -- they need a dashboard that shows MRR, churn, CAC, support ticket volume, NPS, and engineering deployment frequency updated daily; if these metrics require manual extraction and calculation, they will not be used consistently; implement a data warehouse or BI tool (Metabase, Looker, or even a well-structured Redash) before scaling
- **Review the CRM state with specificity:** A CRM used inconsistently by one salesperson is not a CRM -- it is a contact list; before scaling, the CRM should have a defined pipeline stage structure, required fields for each stage, a conversion rate calculated for each stage, and a practice of weekly pipeline reviews; if the CRM does not exist or has never been cleaned, plan 2-4 weeks of data remediation before the second sales rep starts
- **Assess support infrastructure against a specific SLA target:** Define the target response times before building the support stack -- a common B2B SaaS baseline is: P1 (product down) < 1 hour response, P2 (major feature broken) < 4 hours, P3 (minor issue) < 24 hours; then assess whether the current ticketing system (Zendesk, Intercom, Freshdesk, or even email) can enforce these SLAs and produce a report on whether they are being met
- **Review security posture before scale brings regulatory scrutiny:** At 50 customers, a security incident is embarrassing; at 200 enterprise customers, it is potentially company-ending; at minimum, verify: encryption in transit and at rest, access controls with role-based permissions, audit logging for sensitive data access, a process for offboarding departed employees' access immediately, and an external penetration test within the last 12 months
- **Assess vendor contract terms against growth projections:** Many early-stage companies are on entry-level plans with cloud providers, payment processors, and email delivery services; map each vendor against the 12-month usage projection and identify which vendors will need contract renegotiation, custom pricing, or replacement before reaching the target scale

### Step 5: Audit Dimension 3 -- Processes and Documentation

Process documentation is the mechanism by which the founder's knowledge becomes company knowledge. Without it, the company cannot grow beyond the founder's personal bandwidth.

- **Identify every process that currently lives only in one person's head using a "bus test":** Ask: if this person were unavailable for 3 weeks, which business functions would stop or degrade? Each answer is a documentation priority; the bus test is not about pessimism -- it is about identifying the processes that must be written down before a new hire can execute them
- **Audit the customer onboarding process against a specific time-to-value benchmark:** For most B2B SaaS, the target is to deliver the customer's first meaningful value (the "aha moment") within 7 days of contract signing; document the current average time-to-value, the exact steps in the onboarding process, and the drop-off rate at each step -- this becomes both a process improvement exercise and a customer success playbook
- **Document the sales process end to end with stage-specific exit criteria:** A documented sales process is not just a list of stages in a CRM -- it includes: qualification criteria (what signals indicate a lead is worth pursuing), discovery questions for each buyer persona, common objections and responses, the demo script or framework, proposal templates, and negotiation boundaries (minimum deal size, acceptable discounts, red-line contract terms); without this documentation, a second sales rep will sell differently than the first, making it impossible to diagnose conversion problems
- **Create a decision rights matrix (RACI or equivalent) before the team exceeds 8 people:** At 5 people, decisions happen informally; at 15, the absence of a decision framework causes constant escalation to the founder; define for each major decision category (hiring, pricing changes, product roadmap priorities, customer contract exceptions, vendor contracts above a certain value) who is Responsible, who is Accountable, who must be Consulted, and who must be Informed
- **Build an incident response runbook before scaling increases the probability of incidents:** The runbook should include: the definition of each severity level, the escalation chain for each level, the communication template for customer-facing messages, the post-mortem process, and the criteria for declaring an incident resolved; the first time a production incident occurs at 2 AM is not the moment to design this process
- **Define the product development and release process with explicit quality gates:** As the engineering team grows from 2 to 5+ engineers, informal coordination breaks down; define: branch and PR policies, the code review requirement (at least one approval from a senior engineer), the staging environment promotion criteria, the rollout strategy (feature flags, canary releases, or full deploys), and the rollback procedure if a release causes production errors

### Step 6: Audit Dimension 4 -- Finance, Unit Economics, and Cash Management

Scaling with poor unit economics is the most common cause of startup death at the growth stage. Capital amplifies both profitable and unprofitable growth with equal indifference.

- **Calculate and stress-test unit economics before deploying any growth capital:** The critical thresholds for SaaS are: Gross Margin above 70% (below 65% indicates a services component or infrastructure cost problem that worsens at scale), LTV:CAC ratio above 3:1 (below 3:1 means customer acquisition is not economically viable at scale), and CAC Payback Period under 18 months (above 18 months creates severe cash flow risk because customers must stay much longer than average before generating profit); if any of these are outside threshold, address the economics before scaling acquisition spend
- **Build a 18-month cash flow forecast that models three scenarios:** (1) base case at plan, (2) 70% of plan (sales miss by 30%), and (3) 130% of plan (overperformance that requires additional hiring and infrastructure investment); the key output of each scenario is the cash-out date; the company needs at least 12 months of runway visible at all times during the scaling phase, which typically means raising growth capital before dropping below 18 months of runway
- **Assess accounting infrastructure for investor and board reporting:** Before Series A, the company needs: a monthly close process that produces a P&L, balance sheet, and cash flow statement within 5 business days of month end; a chart of accounts structured for the business model; deferred revenue accounting that correctly handles multi-month and annual subscriptions; and expense categorization clean enough to produce a department-level budget-vs-actual report; if the books are maintained in a spreadsheet or in a tool not being reconciled monthly, this must be resolved before fundraising conversations begin
- **Define the budget and headcount plan for the scaling period:** Map planned hires by quarter, the loaded cost of each hire (salary plus benefits plus recruiting cost plus equipment, typically 1.25-1.4x base salary), and the lag between hire date and revenue contribution (a new sales rep typically takes 3-4 months to reach full productivity); this creates a cash burn curve that can be compared to the revenue ramp forecast
- **Review revenue recognition practices against the accounting standard (ASC 606):** SaaS companies that bill annually upfront must recognize revenue monthly over the contract period, not on the date of payment; many early-stage companies manage this incorrectly, which creates misleading financial statements; correct this before investor due diligence

### Step 7: Audit Dimension 5 -- Legal, Compliance, and Risk

Legal infrastructure is not bureaucracy at the scaling stage -- it is the foundation that prevents catastrophic, company-ending events that become much more likely as the company grows.

- **Assess entity structure for the target scale:** A Delaware C-Corporation is the standard entity for VC-backed startups because it enables stock option plans (ISOs for employees), has well-established corporate governance law, and is familiar to institutional investors; an LLC may be appropriate for bootstrapped businesses, but complicates equity compensation and raises questions in institutional fundraising; if the entity needs to change, do it before a financing event, not during
- **Audit IP assignment for every founder, employee, and contractor:** Intellectual property that is not formally assigned to the company via a signed PIIA (Proprietary Information and Inventions Agreement) or equivalent belongs to the individual who created it; this is a common and serious defect in early-stage companies -- a contractor who wrote core product code without a signed IP assignment agreement may own that code; audit all IP assignments before Series A due diligence, when this will be discovered by investors' counsel regardless
- **Plan for employment law headcount thresholds:** In the US, specific employment law obligations are triggered at 15 employees (Title VII anti-discrimination, ADA), 20 employees (ADEA age discrimination), 50 employees (FMLA family leave, ACA reporting, California-specific requirements), and 100 employees (EEO-1 reporting); companies scaling from 10 to 50 employees will pass the 15-employee and 20-employee thresholds and must have compliant policies before reaching them, not after
- **Review customer contracts for scaling risks:** Common early-stage contract problems that become serious at scale include: unlimited liability clauses (the contract holds the company liable for unlimited damages, which is uninsurable and catastrophic), custom SLA commitments that exceed what the product can actually deliver, most-favored-nation pricing clauses (obligates the company to give any customer the lowest price ever offered to any customer), and data processing agreements that are required for GDPR/CCPA compliance but were never executed; audit the top 10 customer contracts for these provisions before scaling the sales motion
- **Verify insurance coverage against the scale of the business:** At $1M+ ARR with enterprise customers, the following coverages are typically required: General Liability ($1M-$2M per occurrence), Professional Liability / Errors and Omissions ($1M-$2M), Cyber Liability ($1M minimum, higher if handling healthcare or financial data), Directors and Officers ($1M-$2M, often required by investors as a condition of funding), and Employment Practices Liability (especially important before the 15-employee threshold); many enterprise customer procurement teams will require a Certificate of Insurance as a condition of contract signature

### Step 8: Audit Dimension 6 -- Customer Success, Retention, and Expansion

Retention is the foundation of the scaling math. A SaaS business with 5% monthly logo churn has a half-life of 14 months for its customer base -- meaning every cohort loses half its customers within 14 months. That is not a business that can scale; it is a bucket that must be filled faster than it drains.

- **Calculate net revenue retention (NRR) as the primary retention health metric:** NRR above 100% means existing customers are expanding faster than they are churning -- the business grows even without new customers; NRR below 90% means the company is shrinking its revenue base and must acquire new customers just to maintain flat revenue; for Series A benchmarks, B2B SaaS investors typically expect NRR above 110%; if NRR is below 100%, fixing retention is a higher-leverage investment than increasing sales headcount
- **Build a customer health scoring model before scaling acquisition:** A health score assigns a numerical value to each customer based on leading indicators of churn -- typical inputs include: product usage frequency (logins per week, features activated), support ticket volume and sentiment, NPS or CSAT score, contract renewal date proximity, and executive sponsor engagement; customers with scores below a defined threshold are flagged for proactive outreach; this model does not need to be sophisticated -- even a manual scoring exercise using a spreadsheet identifies at-risk customers who should be rescued before the company acquires 100 more while losing 30
- **Define the expansion revenue motion explicitly:** The most capital-efficient growth path for SaaS is expansion from existing customers -- seat additions, tier upgrades, module add-ons, or usage-based overages; before scaling acquisition, quantify the expansion revenue opportunity in the existing base, define the triggers that indicate a customer is ready for an expansion conversation (usage approaching plan limits, new department expressed interest, key milestone achieved), and assign responsibility for expansion motions to either the CS team or a dedicated account management function
- **Systematize customer feedback collection with a closed-loop process:** NPS surveys sent quarterly with no action on the results are theater; a functioning feedback loop requires: a survey mechanism (NPS, CSAT, or a custom health check), a routing process (promoters go to the referral/case study program, passives get a check-in call, detractors get an executive escalation within 48 hours), and a reporting mechanism that surfaces themes from feedback to the product team monthly; without this loop, the product will drift away from customer needs as the team grows and spends less time with customers directly
- **Create a customer reference and advocacy program before it is needed for sales:** Enterprise deals frequently require customer references as part of the evaluation process; a startup with 50 customers should have at least 5-8 documented, reference-ready customers before scaling sales -- meaning customers who have signed a release to be contacted, ideally have a published case study, and have been briefed on what to say; building this program during a sales cycle is too late and forces the sales team to make uncomfortable asks of customers mid-relationship

---

## Output Format

```markdown
## Scaling Readiness Checklist: [Business Name / Description]

---

### Current State Snapshot

| Metric | Value | Notes |
|--------|-------|-------|
| Monthly Recurring Revenue | $[X]K MRR | $[Y]K ARR |
| MoM Revenue Growth Rate | [X]% (avg, last 6 mo) | Trend: [accelerating / stable / decelerating] |
| Active Customers | [X] | Logo count |
| Average Contract Value | $[X] | ACV |
| Net Revenue Retention | [X]% | [Above / Below 100%] |
| Monthly Logo Churn | [X]% | [Acceptable / Needs intervention] |
| Team Size | [X] people | [List functional areas] |
| Current Runway | [X] months | Based on current burn |
| Infrastructure Cost per Customer | $[X]/mo | [Gross margin implication] |

### Target State (12-18 Month Horizon)

| Metric | Target | Implied Change |
|--------|--------|----------------|
| Monthly Recurring Revenue | $[X]K MRR | [X]x current |
| Active Customers | [X] | [X]x current |
| Team Size | [X] people | [X] net new hires |
| Key Milestone | [e.g., Series A / Profitability / Enterprise motion launched] | |
| Infrastructure Load | [X] concurrent users | Load test target: [2x this number] |

---

### DIMENSION 1: Team, Hiring, and Organization

| # | Item | Current Status | Priority | Specific Action Required | Owner | Target Date |
|---|------|---------------|----------|--------------------------|-------|-------------|
| 1.1 | Single points of failure identified and mitigated | [Exists / Partial / Missing] | [Must Have Before / Build During / Build After] | [Action] | [Name] | [Date] |
| 1.2 | Org chart documented for target scale | | | | | |
| 1.3 | Critical hire pipeline active (roles defined) | | | | | |
| 1.4 | Structured interview process per role | | | | | |
| 1.5 | 30-day onboarding checklist for each role | | | | | |
| 1.6 | Management layer in place or planned | | | | | |
| 1.7 | Compensation bands and equity plan documented | | | | | |
| 1.8 | Culture values written and used in hiring | | | | | |
| 1.9 | Founder's time allocation mapped; delegation list created | | | | | |
| 1.10 | Employment agreements for all team members signed | | | | | |

**Dimension 1 Blocking Issues:**
[List any items scored "Must Have Before" that are currently Missing -- these must be resolved before scaling begins]

---

### DIMENSION 2: Systems and Technical Infrastructure

| # | Item | Current Status | Priority | Specific Action Required | Owner | Target Date |
|---|------|---------------|----------|--------------------------|-------|-------------|
| 2.1 | Load test completed at 2x 12-month target user count | | | | | |
| 2.2 | Uptime monitoring and alerting active (target: 99.9%) | | | | | |
| 2.3 | Automated backups with tested restore process | | | | | |
| 2.4 | Disaster recovery runbook documented | | | | | |
| 2.5 | CRM implemented with defined pipeline stages | | | | | |
| 2.6 | Support ticketing system with SLA enforcement | | | | | |
| 2.7 | Metrics dashboard (MRR, churn, CAC, NPS) -- daily update | | | | | |
| 2.8 | Role-based access controls and offboarding process | | | | | |
| 2.9 | External penetration test within last 12 months | | | | | |
| 2.10 | Vendor contracts reviewed for scale (cloud, payments, email) | | | | | |
| 2.11 | Data backup and encryption (in transit and at rest) confirmed | | | | | |
| 2.12 | Infrastructure cost projection at target scale calculated | | | | | |

**Dimension 2 Blocking Issues:**
[List blocking items]

---

### DIMENSION 3: Processes and Documentation

| # | Item | Current Status | Priority | Specific Action Required | Owner | Target Date |
|---|------|---------------|----------|--------------------------|-------|-------------|
| 3.1 | Customer onboarding process documented (target: TTV < 7 days) | | | | | |
| 3.2 | Support tiers and SLAs defined (P1/P2/P3 response times) | | | | | |
| 3.3 | Sales playbook documented (ICP, discovery, objections, demo) | | | | | |
| 3.4 | Product release process with defined quality gates | | | | | |
| 3.5 | Decision rights matrix (who approves what at what threshold) | | | | | |
| 3.6 | Incident response runbook (severity levels, escalation, comms) | | | | | |
| 3.7 | Internal knowledge base or wiki started | | | | | |
| 3.8 | Company-wide communication rhythm defined (standups, all-hands) | | | | | |
| 3.9 | Bus test completed -- all critical processes documented | | | | | |
| 3.10 | Post-mortem process for incidents and sales losses | | | | | |

**Dimension 3 Blocking Issues:**
[List blocking items]

---

### DIMENSION 4: Finance, Unit Economics, and Cash Management

| # | Item | Current Status | Priority | Specific Action Required | Owner | Target Date |
|---|------|---------------|----------|--------------------------|-------|-------------|
| 4.1 | Gross margin calculated and above threshold ([70%+ SaaS]) | | | | | |
| 4.2 | CAC calculated by channel (not blended total) | | | | | |
| 4.3 | LTV:CAC ratio above 3:1 | | | | | |
| 4.4 | CAC payback period under 18 months | | | | | |
| 4.5 | 18-month cash flow forecast (3 scenarios) | | | | | |
| 4.6 | Monthly close process under 5 business days | | | | | |
| 4.7 | Budget by department with budget-vs-actual reporting | | | | | |
| 4.8 | Deferred revenue accounting correct (ASC 606) | | | | | |
| 4.9 | Headcount plan with loaded cost and productivity ramp | | | | | |
| 4.10 | Tax filings current; entity structure reviewed | | | | | |
| 4.11 | Revenue concentration risk assessed (no customer >20% of ARR) | | | | | |

**Dimension 4 Blocking Issues:**
[List blocking items]

---

### DIMENSION 5: Legal and Compliance

| # | Item | Current Status | Priority | Specific Action Required | Owner | Target Date |
|---|------|---------------|----------|--------------------------|-------|-------------|
| 5.1 | Entity structure appropriate for target scale and investors | | | | | |
| 5.2 | IP assignment agreements (PIIA) signed by all founders, employees, contractors | | | | | |
| 5.3 | Trademarks filed for brand and product name | | | | | |
| 5.4 | Customer contracts reviewed -- liability caps, SLAs, MFN clauses | | | | | |
| 5.5 | Data processing agreements (DPA) executed with enterprise customers | | | | | |
| 5.6 | Privacy policy current and compliant (GDPR / CCPA as applicable) | | | | | |
| 5.7 | Employment law compliance plan for next headcount threshold | | | | | |
| 5.8 | Business insurance: GL, E&O, Cyber, D&O in place | | | | | |
| 5.9 | Vendor agreements for critical vendors reviewed by counsel | | | | | |
| 5.10 | Employee handbook updated to current team size and regulations | | | | | |

**Dimension 5 Blocking Issues:**
[List blocking items]

---

### DIMENSION 6: Customer Success, Retention, and Expansion

| # | Item | Current Status | Priority | Specific Action Required | Owner | Target Date |
|---|------|---------------|----------|--------------------------|-------|-------------|
| 6.1 | Monthly logo churn calculated and benchmarked | | | | | |
| 6.2 | Net revenue retention calculated (target: >110% for B2B SaaS) | | | | | |
| 6.3 | Customer health scoring model in place | | | | | |
| 6.4 | At-risk customer list current and assigned | | | | | |
| 6.5 | Customer feedback loop with closed-loop action process | | | | | |
| 6.6 | Expansion revenue motion defined (triggers, process, owner) | | | | | |
| 6.7 | Customer reference program (5+ reference-ready customers) | | | | | |
| 6.8 | Case studies or testimonials published | | | | | |
| 6.9 | QBR (quarterly business review) process for key accounts | | | | | |
| 6.10 | CS team capacity assessed against 12-month customer target | | | | | |

**Dimension 6 Blocking Issues:**
[List blocking items]

---

### Scaling Readiness Score

| Dimension | Must-Have Items | Must-Have Complete | Build-During Items | Build-After Items | Blocking Issues |
|-----------|----------------|-------------------|--------------------|--------------------|-----------------|
| 1. Team and Hiring | [X] | [Y] ([Z]%) | [X] | [X] | [Count] |
| 2. Systems / Infrastructure | [X] | [Y] ([Z]%) | [X] | [X] | [Count] |
| 3. Processes / Docs | [X] | [Y] ([Z]%) | [X] | [X] | [Count] |
| 4. Finance / Unit Economics | [X] | [Y] ([Z]%) | [X] | [X] | [Count] |
| 5. Legal / Compliance | [X] | [Y] ([Z]%) | [X] | [X] | [Count] |
| 6. Customer Success | [X] | [Y] ([Z]%) | [X] | [X] | [Count] |
| **OVERALL** | **[X]** | **[Y] ([Z]%)** | | | **[Total blockers]** |

**Scaling Readiness Verdict:**
- [Green]: 90%+ of Must-Have items complete, 0 blocking issues -- ready to scale
- [Yellow]: 70-89% of Must-Have items complete, or 1-3 blocking issues -- scale with caution, resolve blockers within 30 days
- [Red]: Below 70% of Must-Have items complete, or 4+ blocking issues -- do not accelerate scaling until blockers are resolved

---

### 90-Day Scaling Readiness Roadmap

| Phase | Days | Objective | Top 5 Actions | Success Criteria |
|-------|------|-----------|---------------|-----------------|
| Phase 1: Stabilize and Unblock | 1-30 | Resolve all blocking issues; start critical hires | [Action 1-5] | All blocking issues resolved; offers extended for critical hires |
| Phase 2: Build and Document | 31-60 | Complete process documentation; implement core systems | [Action 1-5] | Sales playbook complete; onboarding documented; CRM live |
| Phase 3: Test and Launch | 61-90 | Validate at target load; train team; launch scaled motion | [Action 1-5] | Infrastructure load tested; new hires onboarded; first scaled sales sprint complete |

**Go/No-Go Checkpoint (Day 90):**
Proceed with full scaled operations when: (1) all Must-Have items are complete, (2) no Blocking Issues remain open, and (3) the team has been trained on the new processes and systems. If any blocker remains open at Day 90, extend the readiness phase by 30 days and reassign ownership with daily tracking.

**Monthly Review:** Revisit this checklist on the first Monday of each month during the scaling phase. New gaps emerge as the business grows. Items that were "Build After" at the start may become "Must Have" as circumstances change.
```

---

## Rules

1. **Never skip the current state baseline.** A scaling checklist built without specific current-state data will misclassify priorities. A business with $5K MRR and 5 customers does not have the same scaling risks as a business with $50K MRR and 80 customers. Collect actual numbers before building the checklist.

2. **Always validate unit economics before any growth investment.** Scaling with a LTV:CAC ratio below 3:1 or a CAC payback period above 18 months accelerates cash consumption without building a sustainable business. Flag unit economics problems as Priority 1 blockers, regardless of how eager the founder is to scale.

3. **Always separate "must have before scaling" from "build during scaling."** Attempting to complete the entire checklist before beginning to scale causes paralysis and wastes the momentum window that follows fundraising or a PMF signal. The goal is to remove blocking risks, not to achieve operational perfection before the first growth hire is made.

4. **Never ignore retention when the user wants to talk about acquisition.** A monthly logo churn rate above 3% (for SMB SaaS) or above 1% (for enterprise SaaS) is a customer success emergency that must be addressed before increasing sales spend. Present the math explicitly: a $50K MRR business with 5% monthly churn loses $2,500 of MRR every month from existing customers -- the sales team must first generate $2,500 just to stay flat.

5. **Always identify the single points of failure in the team before recommending scaling.** A founder who personally handles any critical function that cannot be delegated (closing deals, managing a critical customer relationship, approving production deployments) is the bottleneck. Do not recommend scaling headcount on the go-to-market side until the operational single points of failure are addressed.

6. **Always include a headcount plan with loaded costs and productivity ramp assumptions.** "We need to hire 5 people" is not a plan. A plan specifies: the role, the base salary, the loaded cost (typically 1.25-1.4x base salary including benefits, equipment, and recruiting cost), the quarter they will be hired, and the number of months before they reach full productivity. Without this model, cash burn projections will be wrong.

7. **Never allow IP assignment to be deferred.** If any founder, co-founder, employee, or contractor has created intellectual property for the company without a signed PIIA or IP assignment agreement, this must be corrected immediately. This is the most common and most serious legal defect uncovered in Series A due diligence, and it can delay or kill a financing round.

8. **Always include a load test requirement with a specific target.** "Our infrastructure can handle the load" is not acceptable. The load test must specify: the target number of concurrent users, the response time threshold (e.g., 95th percentile response time under 2 seconds at load), and the error rate threshold (e.g., below 0.1% error rate at target load). Untested infrastructure fails under real growth traffic.

9. **Always include the specific employment law headcount thresholds relevant to the user's jurisdiction.** In the US, the 15-employee threshold (Title VII, ADA), the 20-employee threshold (ADEA), and the 50-employee threshold (FMLA, ACA) are hard legal deadlines, not suggestions. A company that passes these thresholds without compliant policies is exposed to litigation. Flag whichever threshold the company is approaching next.

10. **The checklist is a living document, not a one-time deliverable.** Instruct the user to review and update the checklist monthly during the scaling phase. As the business grows, new gaps emerge, some planned items become irrelevant, and the priority classification of existing items shifts. A checklist built at 50 customers will need significant revision at 150 customers.

---

## Edge Cases

### Services or Agency Business Scaling
Services businesses (consulting, agencies, managed services) scale on people, not technology. The primary constraint is delivery capacity, and the primary risk is quality dilution as the team grows beyond the founder's direct supervision.
- The revenue-per-employee ratio is the key efficiency metric -- for professional services, a healthy target is $150K-$250K in revenue per full-time employee; below $100K suggests either pricing is too low or utilization is too low
- Documented delivery methodology is non-negotiable before scaling: every service delivered must follow a written process that a trained new hire can execute at the same quality level as the founder
- The checklist should include a utilization rate target (typically 65-75% billable hours for a consulting firm) and a tracking mechanism for each billable staff member
- Pricing model review is critical at scale: hourly billing creates a revenue ceiling (you can only sell so many hours), while retainer or productized service models scale more predictably; if the business is hourly, the checklist should include a pricing model transition item
- Hiring infrastructure for a services business includes: a skill-based competency framework for each role, a formal training program for new consultants, a peer review or QA process for client deliverables, and a shadowing or mentorship program to transmit tacit knowledge from senior to junior staff

### Marketplace Business Scaling (Two-Sided Network)
Marketplaces have two separate scaling problems -- supply side and demand side -- and scaling them out of balance destroys liquidity and user experience.
- Before scaling, calculate the liquidity rate (percentage of listings or supply units that successfully transact within a given period); a liquidity rate below 20-30% indicates a supply glut and the priority should be demand, not more supply
- The checklist must separately assess supply-side and demand-side readiness because they have different bottlenecks, different unit economics, and different team requirements
- Trust and safety infrastructure becomes critical at scale: fraud detection, identity verification, dispute resolution processes, and review integrity systems must be designed before the marketplace reaches the scale where bad actors find it worth attacking
- Include network density by geography or category in the checklist -- a marketplace that is barely liquid at the national level is deeply illiquid at the local level; geographic or vertical expansion strategy must be decided before scaling marketing spend

### Hardware or Physical Product Business Scaling
Physical product businesses face irreversible scaling decisions: manufacturing commitments, inventory purchases, and supply chain investments must be made months before the product reaches customers.
- The checklist must include a manufacturing lead time analysis -- if the lead time from order to delivery is 12 weeks, the inventory purchase decision for Q4 must be made in Q1; this creates a fundamentally different planning cadence than software
- Supplier concentration is an existential risk: a business whose entire product depends on a single supplier is one supply disruption away from being unable to fulfill orders; the checklist should require either dual-sourcing or a documented contingency plan for each single-source component
- Quality control at volume is different from quality control in limited runs: document the inspection and testing process for each product before scaling manufacturing volumes, and define the acceptable defect rate and return rate thresholds that will trigger a production halt
- Cash flow management is more complex for hardware because of the large working capital requirement: inventory must be purchased before it can be sold; model the working capital cycle explicitly and ensure the business has access to inventory financing or has raised capital sufficient to fund the inventory build

### Heavily Regulated Industry (Fintech, Healthtech, Legaltech, Edtech)
In regulated industries, compliance is not a parallel track -- it is the main track. Scaling without regulatory infrastructure creates existential risk that cannot be remediated retroactively.
- Identify every applicable regulatory framework before building the checklist: a fintech processing payments may face PCI DSS, FinCEN/AML requirements, state money transmission licenses, and federal banking regulations simultaneously; each has specific operational requirements that must be implemented, not planned
- Compliance gaps are not "build after" items in regulated industries -- they are "must have before" items even if they are expensive and slow; a fintech that scales its transaction volume before completing its AML program is creating regulatory liability that can result in forced shutdown
- The checklist must include a compliance officer or compliance function: at scale, regulatory compliance cannot be managed part-time by a non-specialist; budget for a Head of Compliance as an early hire in regulated industries, not a later one
- Audit readiness is a continuous state: the business must maintain documentation, logging, and controls that would withstand a regulatory examination at any point -- not just when an examination is scheduled

### Solo Founder Scaling Past Personal Bandwidth Limit
Solo founders often reach a moment where they are simultaneously the bottleneck for every function and unable to delegate because nothing is documented. This is a specific scaling failure mode that requires a specific intervention sequence.
- The first action is a time audit, not a hiring plan: the founder should track how they spend every hour for two weeks and categorize each activity as (1) only I can do this now, (2) this should be delegated but is not documented, or (3) this should already not be mine; Categories 2 and 3 become the documentation and delegation priority list
- The first two hires must be sequenced to create the maximum delegation: typically this means hiring an operations generalist or executive assistant first (to take over Category 3 tasks immediately) and then a senior individual contributor in the highest-revenue-impact function second
- The founder must explicitly define which decisions require their involvement versus which can be delegated with defined parameters: pricing exceptions above $X require founder approval; engineering architecture decisions require CTO (or senior engineer) approval; all other product decisions are delegated -- without this framework, a growing team will escalate everything to the founder, recreating the bottleneck even after hiring

### Business with Revenue Concentration Risk
A business where one or two customers represent more than 30% of ARR has a structural risk that must be addressed before scaling.
- Scaling a business with 40% customer concentration does not reduce concentration risk -- it may temporarily reduce the percentage, but the underlying dependency on a small number of customers creates fragility that investors and acquirers penalize heavily
- The checklist for a concentrated business must include: a retention program specifically for the top 2-3 customers (executive relationships, dedicated success resources, custom roadmap input), a deliberate diversification timeline (target reducing top-3 concentration to below 20% of ARR within 12 months), and a financial contingency plan if the largest customer churns
- Revenue concentration also affects product roadmap decisions in ways that harm scalability: a business that builds too many features for its largest customer at the expense of the broader market creates a product that is hard to sell to new customers; the checklist should include a product roadmap review to ensure custom work for large customers is not cannibalizing the scalable product

---

## Example

**Input:** "We're a B2B SaaS startup. We have 65 customers, $42K MRR growing about 12% per month, team of 6 (3 engineers, 1 founder/CEO who also runs sales, 1 customer success manager, 1 part-time marketing contractor). We just closed a $1.5M seed round. We want to get to 250 customers and $180K MRR in the next 14 months. What do we need in place?"

---

**Output:**

## Scaling Readiness Checklist: B2B SaaS Startup -- Seed Stage to Growth Stage

---

### Current State Snapshot

| Metric | Value | Notes |
|--------|-------|-------|
| Monthly Recurring Revenue | $42K MRR | $504K ARR |
| MoM Revenue Growth Rate | 12% | Strong -- but founder-dependent sales motion is the ceiling |
| Active Customers | 65 | Logo count |
| Average Contract Value | ~$646/customer/mo | Estimated; verify actual ACV distribution |
| Net Revenue Retention | Unknown -- must calculate immediately | This is Priority 1 data |
| Team Size | 6 (3 eng, 1 CEO/sales, 1 CS, 1 PT marketing) | Founder is only salesperson -- single point of failure |
| Runway (post-seed) | ~20 months at current burn | Assumes $75K/mo burn with planned hires |
| Infrastructure Cost per Customer | Unknown -- must calculate | Gross margin implication |

### Target State (14-Month Horizon)

| Metric | Target | Implied Change |
|--------|--------|----------------|
| MRR | $180K MRR | 4.3x current |
| ARR | $2.16M ARR | Series A benchmark zone |
| Active Customers | 250 | 3.8x current |
| Team | 14-16 people | 8-10 net new hires |
| Implied Org | CEO, VP Sales, 2-3 AEs, CS Lead + 2 CSMs, 5 Engineers, Head of Ops/Finance | |
| Infrastructure Load | 250 customers at full usage | Load test target: 500 concurrent accounts |

**Critical Math Check:** Growing from $42K to $180K MRR in 14 months at 12% MoM growth actually gets you to approximately $200K MRR -- the organic growth trajectory is on track, but only if the sales bottleneck (founder as only salesperson) is resolved immediately. If growth decelerates to 8% per month because the founder's sales capacity is exhausted, the business reaches only $120K MRR -- $60K short of target. **Hiring a second salesperson is the highest-leverage action in the entire checklist.**

---

### TOP PRIORITY ITEMS -- Blocking Issues to Resolve in 30 Days

| # | Dimension | Item | Why It Blocks Scaling | Immediate Action |
|---|-----------|------|----------------------|-----------------|
| B1 | Team | Founder is sole salesperson | Sales capacity is capped at founder's personal bandwidth; already limiting 12% growth rate | Post VP Sales or AE job description this week; target hire in 45 days |
| B2 | Finance | NRR not calculated | Cannot validate scaling economics without knowing if you are retaining and expanding revenue | Pull data from billing system; calculate cohort retention by month; do this before anything else |
| B3 | Process | Sales process not documented | A second salesperson cannot be effective without a written ICP, discovery framework, demo script, and objection handling guide | 2-week project to document the current founder sales motion end to end |
| B4 | Systems | No metrics dashboard | At 4x customers, decisions cannot be made on intuition; MRR, churn, CAC, and NPS must be visible in a dashboard updated daily | Implement Metabase or Looker Studio pulling from billing system within 30 days |
| B5 | Legal | IP assignment status unknown | If any engineer or contractor created product code without a signed PIIA, the company may not own its own IP -- a fatal Series A diligence defect | Audit all employment agreements and contractor agreements this week; have counsel cure any gaps immediately |

---

### DIMENSION 1: Team, Hiring, and Organization

| # | Item | Current Status | Priority | Specific Action Required | Target Date |
|---|------|---------------|----------|--------------------------|-------------|
| 1.1 | Founder's sales role delegated to a dedicated salesperson | Missing -- BLOCKING | Must Have Before | Hire AE or VP Sales within 45 days; document current sales process first | Day 45 |
| 1.2 | Customer Success capacity assessed for 250-customer load | Partial -- 1 CSM for 65 customers; ratio will break at 150+ | Must Have Before | Plan CS hire #2 by Month 3; current CSM can support up to ~120 customers | Month 3 |
| 1.3 | Engineering capacity for product and infrastructure at 4x load | Partial -- 3 engineers; no dedicated infrastructure owner | Build During | Hire senior engineer or DevOps engineer by Month 2 to own infrastructure | Month 2 |
| 1.4 | Org chart documented for 12-month target state | Missing | Must Have Before | Draw the 14-month org chart this week; use it to sequence hires | Day 14 |
| 1.5 | Structured interview process per role | Missing | Must Have Before | Build interview scorecard for first 3 hires before sourcing begins | Day 7 |
| 1.6 | Onboarding checklist for each new hire role | Missing | Must Have Before | Build 30-60-90 day plan template; customize for first hire before they start | Day 30 |
| 1.7 | Compensation bands defined for all planned roles | Missing | Must Have Before | Benchmark market salaries using public SaaS comp data; define ranges for each role | Day 14 |
| 1.8 | Equity plan and remaining option pool documented | Unknown | Must Have Before | Confirm option pool size from cap table; document vesting schedule; have
