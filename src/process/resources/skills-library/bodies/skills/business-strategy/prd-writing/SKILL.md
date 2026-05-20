---
name: prd-writing
description: |
  Creates product requirements documents (PRDs) with problem statement, user stories, acceptance criteria, out-of-scope definition, and success metrics using standard PRD format. Use when the user asks about PRDs, product requirements, feature requirements, writing requirements documents, or product specifications.
  Do NOT use for technical specifications (use technical-specification), user story writing alone (use user-story-writing), or feature specs (use feature-spec).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning strategy template agile project-management"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# PRD Writing

## When to Use

**Use this skill when:**
- The user explicitly asks to write, create, draft, or review a PRD, product requirements document, or product spec
- The user needs to align engineering, design, and stakeholders on scope before a sprint or development cycle begins
- The user is defining a new feature, initiative, or product line that requires sign-off from multiple stakeholders with competing priorities
- The user needs to document the "why" and "what" of a product decision to preserve institutional knowledge and reduce re-litigation of decisions
- The user is preparing for a roadmap review, planning meeting, or kickoff where scope, success criteria, and priorities must be locked
- The user has a problem they want to validate and frame before any solution design begins
- The user needs to decompose a vague executive request ("we need to improve onboarding") into specific, testable requirements
- The user is writing a PRD for an internal tool, compliance requirement, operational improvement, or infrastructure initiative -- not just user-facing features

**Do NOT use this skill when:**
- The user needs only one or two user stories in isolation without context -- use `user-story-writing`
- The user wants architecture diagrams, API contracts, data models, or system design -- use `technical-specification`
- The user needs a detailed feature spec with UX annotations, interaction states, and design tokens -- use `feature-spec`
- The user wants a prioritized multi-quarter product roadmap -- use `product-roadmap`
- The user is doing competitive analysis to decide what to build -- use `competitive-analysis`
- The user wants to write a project plan with tasks, owners, and timelines -- use `project-plan`
- The user is running a discovery sprint and has not yet identified the problem to solve -- run discovery first, then use this skill
- The user is asking about OKRs or goal-setting frameworks without a specific initiative -- use `okr-writing`

---

## Process

### Step 1: Establish the Problem Statement Before Anything Else

The problem statement is the load-bearing wall of the PRD. Every decision about scope, priority, and success criteria must trace back to it. A weak problem statement is the single most common cause of PRDs that confuse more than they align.

- **Identify the specific user segment** -- not "users" or "customers" but a concrete segment with shared context: "enterprise data analysts at companies with 500+ seats," "first-time buyers on mobile," "support agents handling billing escalations." Ask the user to name the segment before writing anything else.
- **Separate the observable behavior from the assumed need.** The user writes "users want a dark mode." Push back: what is the actual problem? Eye strain during evening use? Accessibility requirement? Corporate branding? The root problem determines the right solution.
- **Demand evidence at one of three levels:** quantitative data (support ticket volume, NPS drivers, funnel drop-off rates, churn survey citations), qualitative research (user interviews, usability test findings, sales call themes), or proxy evidence (competitor feature adoption, industry benchmarks). If no evidence exists, mark the assumption explicitly and flag it as the highest-risk item in the PRD.
- **Calculate the cost of inaction.** This is not optional -- it justifies prioritization. Translate the problem into business terms: monthly churn attributable to this gap, support cost per ticket (industry average is $25--$50 for tier-1, $75--$150 for tier-2), hours per week lost to manual workaround, or revenue at risk from competitive displacement. Even rough estimates force the right conversation.
- **Surface existing workarounds.** What are users doing today instead of using the missing feature? A workaround that works well (copy-paste into Excel, a third-party integration) means lower urgency. A workaround that is painful or error-prone (rebuilding pivot tables by hand every week) confirms strong latent demand.
- **Write the problem statement in two to three sentences maximum.** Force compression -- if it cannot be said in three sentences, the problem is not understood well enough yet.

### Step 2: Define Goals and Success Metrics with Baselines

Metrics without baselines are decorative. Baselines without targets are observations. This section must produce a measurable contract between the product team and the business.

- **Choose one primary metric** -- the single number that answers "did this work?" It must be: owned by this initiative (not a lagging business metric influenced by twenty variables), measurable within 30--90 days post-launch, and sensitive enough to move if the feature works. Conversion rate, task completion rate, feature adoption rate (DAU using feature / total DAU), time-on-task, and support ticket deflection are strong primary metrics. Revenue and retention are almost always secondary -- they lag too far behind.
- **Add two to four secondary metrics** that provide diagnostic power. If the primary metric moves but secondary metrics do not, something unexpected is happening. If the primary metric is "export feature adoption," secondary metrics might be "average exports per user per week" and "dashboard sessions followed by export action."
- **Mandate at least one guardrail metric** for every PRD. Guardrails define what must not get worse. Common guardrail categories: performance (p95 page load time, API error rate), existing feature engagement (the feature being modified), and accessibility score. The team must agree on guardrail thresholds before launch -- not after.
- **For every metric, record:** current baseline value and measurement date, target value with justification, how it is measured (specific tool, query, or dashboard), and the measurement window (30 days, 60 days, one quarter post-launch).
- **Distinguish between output metrics and outcome metrics.** Output metrics measure what the team ships (feature is live, X stories shipped). Outcome metrics measure what changes in user behavior or business results. The PRD should include only outcome metrics -- output metrics belong in the project plan.
- **Set realistic targets using the Rule of 10x for new features:** A net-new feature reaching 10--15% of eligible users within 60 days post-launch is a strong adoption result. 25%+ in 60 days is exceptional. Setting targets like "80% of users will use this within 30 days" for a new feature is almost always unrealistic and signals a misunderstanding of adoption curves.

### Step 3: Define the Target User with Behavioral Specificity

Generic personas do not help engineers make trade-offs. This section must give the team enough specificity to resolve ambiguous edge cases without escalating.

- **Use a behavioral archetype, not just a demographic profile.** "A marketing manager, age 35--45, enterprise company" is a demographic. A behavioral archetype adds: "currently exports data by asking their data analyst to run a report in SQL -- waits 24--48 hours -- receives a spreadsheet by email -- manually formats it for their VP." Behavioral specificity reveals what the feature must accomplish, how it must be triggered, and where it fits in an existing workflow.
- **Specify the context of use:** the device (mobile vs. desktop vs. both), the environment (office, home, field), the frequency (daily, weekly, monthly), and the urgency (real-time need vs. batch task). These constraints directly inform UX, performance requirements, and offline behavior.
- **If there are multiple user types interacting with the same feature** (e.g., an admin configures it, a viewer consumes it), create a separate user row for each. Conflating them leads to acceptance criteria that try to serve two masters and satisfy neither.
- **State the current behavior explicitly.** This is the "before" state. Without a documented "before," there is no way to validate that the feature actually changed behavior.
- **State the desired behavior as an observable action, not a feeling.** "Users feel confident" is not observable. "Users complete the export flow without visiting the help center" is observable and testable.

### Step 4: Write User Stories with Unambiguous Acceptance Criteria

This is the technical core of the PRD. Acceptance criteria are the contract between product and engineering -- they define done, not design. They must be testable by a QA engineer who has never spoken to the PM.

- **Use the canonical user story format without deviation:** As a [specific user type], I want to [specific action], so that [specific, concrete benefit]. The "so that" clause is not filler -- it anchors every AC and prevents gold-plating. If the engineering team cannot trace an AC back to the "so that" benefit, question whether the AC is necessary.
- **Write acceptance criteria in Given/When/Then (Gherkin) format for any story with complex conditional logic:** Given [precondition], When [user action], Then [observable system response]. For simpler stories, a flat checklist of testable conditions is sufficient. The key test: can a QA engineer write a test case directly from this AC without asking the PM a single question?
- **Apply the INVEST criteria** to every story: Independent (deliverable without dependency on another story), Negotiable (scope can be adjusted), Valuable (delivers measurable user or business value), Estimable (team can size it), Small (completable in one sprint or less), Testable (has clear pass/fail criteria). If a story fails INVEST, it needs to be broken down or restructured.
- **Assign explicit priorities using the MoSCoW framework or P0/P1/P2 taxonomy** and document the rationale, not just the label. P0/Must-have: launch is blocked without this. P1/Should-have: significant value reduction if excluded. P2/Nice-to-have: incremental value, defer to Phase 2 if timeline pressure occurs. If a stakeholder challenges a priority, the rationale defends the decision.
- **Group stories into functional themes or user journey flows** -- not arbitrary groupings. A theme represents a coherent user goal (e.g., "Data Selection," "Export Execution," "Error Handling"). Themes help the team understand which stories can ship together and which are atomic units of value.
- **Set explicit non-functional acceptance criteria** in the story, not as an afterthought. Every P0 story that involves data retrieval, file generation, or user interaction should specify: performance requirement (response within X seconds for Y rows), error handling behavior (what the user sees when it fails), and empty state behavior (what the user sees before data exists). These are the ACs most frequently missing and the ones that generate the most rework.
- **Limit P0 stories to what is genuinely required for launch.** A PRD with 15 P0 stories and 3 P2 stories has not been prioritized -- it has been labeled. The ratio of P0 to P1 to P2 stories should roughly follow a 30/50/20 distribution across the total story set.

### Step 5: Define Out of Scope with Explicit Rationale

Out of scope is not a dumping ground for "things we did not think about." It is a deliberate set of decisions that prevent scope creep, manage stakeholder expectations, and preserve engineering focus.

- **Include every feature or use case that a stakeholder has mentioned or could reasonably expect, and explicitly exclude it with a reason.** Ambiguous silence is not exclusion -- a stakeholder who did not hear "that is not in scope" will assume it is in scope.
- **Use four exclusion categories:** Deferred (will be addressed in a later phase -- name the phase or initiative), Out of product scope (handled by another system, team, or product -- name it), Deliberately excluded (consciously choosing not to solve this -- explain the trade-off), and Not yet known (insufficient data to scope this now -- name the follow-on research needed).
- **Be specific about which user segments are excluded.** If the PRD covers desktop users only, state that explicitly. If the feature supports only enterprise tier, state that. Segment exclusions prevent engineering from building for a broader audience than intended.
- **Revisit out-of-scope items in phased rollouts.** Phase 2 scope should trace back to items marked "Deferred" in Phase 1's out-of-scope table. This creates continuity across PRDs and signals to stakeholders that deferred items are tracked, not forgotten.

### Step 6: Document Assumptions, Risks, and Dependencies

This section turns the PRD from a wishlist into a risk-managed plan. Every PRD contains hidden assumptions -- this step makes them visible before they cause damage.

- **Classify assumptions into three buckets:** User assumptions (users will behave the way we expect), Technical assumptions (the system can support this at the required scale), and Business assumptions (this will produce the expected commercial outcome). Each type requires a different validation method -- user research, load testing, or A/B analysis respectively.
- **Rate every risk using a 3x3 likelihood-impact matrix (H/M/L for each dimension).** Anything rated H/H is a launch blocker unless explicitly mitigated. Anything rated H/M or M/H requires a documented contingency plan. This prevents the common mistake of listing risks without triaging them.
- **Common high-risk categories for product features include:** data privacy or regulatory exposure (GDPR, CCPA -- if user data is involved, name the specific risk), performance degradation at scale (define the scale threshold -- "100K row exports may exceed 30-second timeout"), dependency on third-party APIs (name the API, the SLA, and the fallback), and adoption risk (if similar features have launched to <5% adoption, note the precedent and the mitigation).
- **Dependencies must have named owners and impact assessments.** "Depends on data pipeline team" is not a dependency entry. "Depends on data pipeline team completing ETL refactor (Owner: [team], ETA: [date], Impact if delayed: export returns stale data, 24-hour lag)" is a dependency entry.
- **Flag assumptions that are also launch gates.** If the PRD assumes that the authentication service supports OAuth 2.0 scoped tokens and it does not, the feature cannot launch. Mark these as "assumption AND dependency" and verify them before the PRD is approved.

### Step 7: Specify the Release Plan and Rollback Strategy

Shipping is not the end state -- controlled rollout with defined reversal criteria is. This section operationalizes the launch.

- **Define the rollout strategy from three options:** Full launch (all eligible users on day one -- only appropriate for low-risk, low-complexity features with strong pre-launch validation), Percentage rollout (1% → 10% → 50% → 100% with gate conditions at each phase -- appropriate for most features), or Targeted cohort rollout (specific user segments, paying tiers, or geographic markets first -- appropriate for enterprise features, regulatory constraints, or capacity-limited infrastructure).
- **Define gate conditions for each phase transition.** A gate condition is a quantitative threshold that must be met before expanding rollout. Example: "Advance from 10% to 50% only if: primary metric has moved +20% vs. control, p95 API response time remains under 3 seconds, and error rate is below 0.5%." Gate conditions without thresholds are not gate conditions -- they are suggestions.
- **Define feature flag requirements explicitly.** Name the flag, the flag owner, the default state (off or on), and the kill switch procedure. Feature flags are not just a technical implementation detail -- they are the mechanism that makes rollback possible without a full deployment.
- **Specify rollback triggers and the rollback procedure.** A rollback trigger is a specific observable condition: "If error rate exceeds 2% sustained over 15 minutes, kill the feature flag." A rollback procedure is the specific action: "Feature flag owner disables flag in LaunchDarkly; oncall engineer verifies error rate returns to baseline; PM notifies stakeholders within 30 minutes." Vague rollback plans ("we will turn it off if something goes wrong") are not plans.
- **Include a post-launch review date** -- typically 30 days after the first phase reaches full rollout. This is when the team reviews primary metrics against targets, closes the PRD, or updates it with findings. PRDs that are never closed create documentation debt.

---

## Output Format

```markdown
## PRD: [Feature or Initiative Name]

### Metadata
| Field | Value |
|-------|-------|
| **Author** | [Name, Role] |
| **Contributors** | [Names and roles: Engineering Lead, Designer, Data Analyst] |
| **Date created** | [YYYY-MM-DD] |
| **Last updated** | [YYYY-MM-DD] |
| **Status** | Draft / In Review / Approved / Shipped |
| **Target release** | [Version number or date range] |
| **Stakeholders** | [Names, roles, and approval authority: Approver / Reviewer / Informed] |
| **Related documents** | [Link to tech spec, design file, discovery doc, competitive analysis] |

---

### Problem Statement

**Who:** [Specific user segment -- not "users." Name the segment, tier, and context.]
**Problem:** [Observable pain point in behavioral terms -- what they cannot do or must do the wrong way.]
**Evidence:** [Quantitative: X tickets/month, Y% churn citing this. Qualitative: user interview themes, usability findings. Proxy: competitor feature, industry benchmark.]
**Cost of inaction:** [Business impact -- revenue at risk, support cost, hours lost per week, competitive displacement risk.]
**Current workaround:** [What users do today instead -- reveals how painful the problem actually is.]

---

### Goal and Success Metrics

**Goal:** [One sentence: Verb + what changes + for whom + why it matters to the business.]

| Metric | Type | Baseline | Target | Measurement Method | Window |
|--------|------|----------|--------|--------------------|--------|
| [Primary metric] | Primary | [Current value + date] | [Target + justification] | [Tool/query/dashboard] | [30/60/90 days post-launch] |
| [Secondary metric 1] | Secondary | [Current] | [Target] | [Method] | [Window] |
| [Secondary metric 2] | Secondary | [Current] | [Target] | [Method] | [Window] |
| [Guardrail metric 1] | Guardrail | [Current] | Must not degrade beyond [threshold] | [Method] | Ongoing |
| [Guardrail metric 2] | Guardrail | [Current] | Must not degrade beyond [threshold] | [Method] | Ongoing |

---

### Target User

| Attribute | Detail |
|-----------|--------|
| **Segment** | [Named segment with tier, context, and size if known] |
| **Current behavior** | [Step-by-step: what they do today to accomplish this goal -- the workaround workflow] |
| **Desired behavior** | [Observable action after this feature exists -- not a feeling, an action] |
| **Context of use** | [Device, environment, frequency, urgency level] |
| **Out-of-scope users** | [Who is NOT the target for this initiative and why] |

*If multiple user types interact with this feature, add a row per user type.*

---

### User Stories

#### Theme 1: [User Journey Phase or Functional Area]

**Story 1.1 [P0]:** As a [specific user type], I want to [specific action], so that [specific, concrete benefit].

Acceptance Criteria:
- [ ] AC1: [Testable condition -- Given/When/Then or flat statement. Specific enough for a QA engineer to write a test without asking the PM.]
- [ ] AC2: [Performance condition: completes within X seconds / handles up to Y records]
- [ ] AC3: [Error state: when X fails, user sees Y and can take action Z]
- [ ] AC4: [Empty state or edge state: when no data exists, system displays Z]
- [ ] AC5: [Non-functional: accessible at WCAG 2.1 AA / works on mobile viewport / UTF-8 encoded]

**Story 1.2 [P1]:** As a [user type], I want to [action], so that [benefit].

Acceptance Criteria:
- [ ] AC1: [Testable condition]
- [ ] AC2: [Testable condition]
- [ ] AC3: [Error handling]

#### Theme 2: [User Journey Phase or Functional Area]

**Story 2.1 [P0]:** As a [user type], I want to [action], so that [benefit].

Acceptance Criteria:
- [ ] AC1: [Testable condition]
- [ ] AC2: [Testable condition]

---

### Out of Scope

| Exclusion | Category | Reason |
|-----------|----------|--------|
| [Specific feature or use case] | Deferred | [Named phase or initiative it belongs to] |
| [Platform or user segment] | Deliberately excluded | [Trade-off rationale] |
| [Adjacent capability] | Out of product scope | [Which team or system owns it] |
| [Unclear requirement] | Not yet known | [What research or data is needed to scope it] |

---

### Assumptions, Risks, and Dependencies

#### Assumptions
| Assumption | Type | Validation Method | Owner | Status |
|------------|------|------------------|-------|--------|
| [What must be true] | User / Technical / Business | [How we will verify before/after launch] | [Who validates] | [Validated / Pending / At risk] |

#### Risks
| Risk | Category | Likelihood | Impact | Mitigation | Contingency |
|------|----------|-----------|--------|------------|-------------|
| [Risk description] | Technical / Adoption / Regulatory / Dependency | H/M/L | H/M/L | [What we do to reduce probability] | [What we do if it materializes] |

#### Dependencies
| Dependency | Description | Owner Team | Required By | Status | Impact if Delayed |
|-----------|-------------|-----------|-------------|--------|------------------|
| [System or team] | [What specifically is needed] | [Team name] | [Date] | [On track / At risk / Blocked] | [Impact on launch timeline or feature quality] |

---

### Release Plan

| Phase | Rollout | Audience | Gate Conditions to Advance | Duration |
|-------|---------|----------|---------------------------|----------|
| Phase 1 -- Canary | 1--5% | [Internal users or beta cohort] | Error rate < 0.5%, p95 latency within threshold | 1 week |
| Phase 2 -- Limited | 10--25% | [Specific segment or region] | Primary metric directionally positive, no guardrail breaches | 2 weeks |
| Phase 3 -- General | 100% | All eligible users | All gate conditions met | -- |

**Feature flag:** [Flag name], Owner: [Name], Default: Off, Kill switch: [Procedure]

**Rollback triggers:**
- Error rate exceeds [X]% sustained over [Y] minutes
- [Guardrail metric] degrades beyond [threshold]
- [Other observable condition]

**Rollback procedure:** [Specific steps -- who does what, in what order, with what notification chain]

**Post-launch review date:** [Date, approximately 30 days after Phase 3 launch]

---

### Open Questions

| Question | Owner | Resolution Needed By | Status |
|----------|-------|---------------------|--------|
| [Unresolved question that blocks a decision in this PRD] | [PM / Eng / Design / Legal] | [Date] | [Open / In progress / Resolved] |
```

---

## Rules

1. **Never write the PRD before the problem statement is locked.** If the user skips straight to "here are the features I want," pull them back. Ask: what problem are these features solving, who has it, and what is the evidence? A PRD that starts with solutions is a feature list dressed up as a requirements document -- it will be overscoped, under-prioritized, and impossible to measure.

2. **Every user story must have acceptance criteria that pass the QA stranger test.** Can a QA engineer who has never spoken to the PM read the AC and write a test case? If not, the AC is too vague. Common failures: "the feature works correctly" (not testable), "the UI is intuitive" (not testable), "performance is acceptable" (not testable without a number). Replace every subjective criterion with an observable, measurable condition.

3. **Never allow a success metric without a documented baseline.** A target of "increase export adoption to 15%" is meaningless if today's adoption is 0% (new feature baseline) versus 8% (existing feature with room to grow). Baselines must include the measurement date -- metrics drift over time and a stale baseline is as misleading as no baseline.

4. **The out-of-scope table must be populated for every PRD, including small ones.** The smaller the feature, the more critical the out-of-scope table -- small features attract the most scope creep because they appear "almost done" and stakeholders feel comfortable adding "one more thing." Explicitly excluding a single adjacent capability prevents weeks of renegotiation.

5. **Prioritization must have rationale, not just labels.** A P0 label without a reason is a guess. The rationale must answer: why is this required for launch (not just desirable)? Acceptable P0 rationale: "without this, the feature provides no value" or "without this, the feature violates a compliance requirement." Unacceptable P0 rationale: "the stakeholder wants it" or "it seems important."

6. **Guardrail metrics must be specified before the PRD is approved, not after launch.** If the team has not agreed on what "unacceptable degradation" looks like before shipping, there will be no agreement when it happens -- only politics. Guardrails should be set at the current baseline with a tolerance band: a p95 API response time baseline of 1.8 seconds might have a guardrail threshold of 3.0 seconds. Never use "must not increase" without a number.

7. **Dependencies must be verified, not assumed.** Every dependency listed in the PRD must have been confirmed with the owning team before the PRD is approved. A dependency that is listed but unconfirmed is an assumption -- move it to the assumptions table and flag it as the highest-risk assumption. An unconfirmed dependency is the most common cause of PRD-to-sprint failure.

8. **The PRD must not contain implementation details.** Specifying database schema, API endpoint design, class names, or code architecture in a PRD contaminates the product requirements with technical decisions that belong in the engineering spec. The PRD answers what and why. The technical spec answers how. Mixing them creates a document that is authoritative for neither audience. Exception: non-functional requirements (performance thresholds, security requirements, accessibility standards) are legitimate PRD content because they constrain what counts as done.

9. **Every assumption must have a named owner and a validation method.** "We assume users will adopt this" is an unowned, unvalidated assumption -- it is a risk in disguise. The assumption must specify: what specifically must be true, who is responsible for validating it, how they will validate it (user research, A/B test, data pull), and by when. Assumptions without owners do not get validated.

10. **The PRD must have a review and approval process, not just a status field.** A PRD marked "Approved" that no one actually approved is worse than a draft -- it creates false confidence. The metadata must list specific approvers (not just stakeholders), and each approver must have an explicit scope: the engineering lead approves technical feasibility, the design lead approves UX scope, the PM lead or head of product approves priority and business value. If the user's context does not include a formal approval process, note the review date and the names of people who provided input.

11. **Out-of-scope items must trace to either a future initiative or a deliberate exclusion -- never just disappear.** Every item excluded from this PRD should either appear in a named future phase (Phase 2 of this initiative), link to another tracked initiative, or be documented as a deliberate "will not build" decision with the rationale. "We might do this later" is not a disposition -- it creates a graveyard of half-acknowledged requirements that resurface at every planning cycle.

12. **Do not confuse outputs with outcomes in the success metrics table.** "Ship the export feature by Q2" is an output. "Reduce export-related support tickets by 75% within 60 days of launch" is an outcome. PRD success metrics must be outcomes. If the user proposes output-based metrics, reframe them into outcome-based equivalents and explain why the distinction matters for evaluating whether the initiative delivered value.

---

## Edge Cases

### Internal Tool or Operations Feature
When the "user" is an internal team member -- a support agent, ops analyst, finance manager, or sales rep -- the problem statement changes shape. Replace user-facing impact language with operational cost language: hours per week spent on the manual task, error rate of the current process, number of people performing the workaround, and the cost-per-error if the process fails. Success metrics focus on efficiency gains (time-on-task reduction, error rate reduction, throughput increase) rather than adoption curves. Acceptance criteria must account for the internal user's workflow context -- they may be using the tool in a high-pressure, multitasking environment where error recovery and confirmation states matter more than for a deliberate end-user feature. The stakeholder map looks different: the sponsor is typically the team manager or VP of the internal function, not a product owner, and their approval carries specific operational authority.

### Regulatory or Compliance-Driven Requirement
The "problem" is non-compliance, and the problem statement must name the specific regulation, the specific requirement within it, and the specific gap in the current product. For example: "GDPR Article 17 requires the ability for EU data subjects to request erasure of all personal data. Current product has no deletion workflow -- data is retained indefinitely. Regulatory deadline: [date]." Acceptance criteria must map one-to-one with regulatory checkboxes -- vague ACs are a compliance liability. The out-of-scope table must explicitly state which parts of the regulation are covered by this PRD and which are addressed by other initiatives or already compliant. Include a legal review dependency with a named legal contact and a required sign-off before launch. The rollback plan must address the regulatory implication of reverting -- in some cases, a feature cannot be rolled back once users have exercised a right.

### Feature With No Prior Adoption Baseline (Net New)
When there is no historical baseline for the primary metric (because the feature does not exist yet), use a proxy-based baseline approach. For adoption: use adoption rates of the most similar feature in the product as a benchmark. For support deflection: use the incoming ticket volume as the pre-launch baseline. For task completion: use the time-and-error-rate of the current workaround workflow as the baseline. Document the proxy clearly -- "baseline is the adoption rate of the CSV import feature (the closest comparable, at 18% of eligible users within 60 days of launch)." Set targets relative to the proxy rather than absolute guesses. Flag this explicitly so stakeholders understand the benchmark is approximate.

### Multi-Team or Multi-Product Initiative
When the initiative spans more than one engineering team, product area, or platform, a single PRD will be incomplete and will create ownership ambiguity. The recommended structure is: one parent PRD that defines the shared problem statement, shared success metrics, and cross-team dependencies, plus one child PRD per team or product area that defines that team's specific scope, stories, and release plan. The parent PRD includes a RACI table -- Responsible, Accountable, Consulted, Informed -- for each functional area and for each key decision (go/no-go for each phase, rollback decisions, scope changes). Without explicit ownership, multi-team PRDs silently fail when one team's dependency slips -- each team assumes the other is handling the coordination.

### Exploratory or Research-Phase Initiative
When the scope of a feature is genuinely unknown because the product team has not yet done user research or validated the problem, a standard PRD is premature. Instead, write a "discovery PRD" -- a lighter artifact that documents: the business question being explored (not the solution), the research method (user interviews, prototype testing, data analysis), the sample size and timeline for the research, the specific decisions the research will inform, and the threshold of evidence required to proceed to a full PRD. User stories are replaced with research tasks. Success criteria are about learning milestones, not shipped features. The discovery PRD closes with a go/no-go framework: what evidence would cause the team to proceed, what evidence would cause the team to pivot, and what evidence would cause the team to stop. This prevents "we learned something interesting but different" from indefinitely extending the discovery phase without a decision.

### Highly Technical Feature With No Direct User Interface
For features like API rate limiting, background job optimization, webhook reliability improvements, or caching layer upgrades, the "user" is typically a developer, an integration partner, or the system itself. The problem statement should quantify the technical pain in developer experience terms: P99 API latency degraded from 200ms to 4 seconds under load, causing 12% of partner integrations to fail silently. User stories take the form of developer tasks and system behavior requirements. Acceptance criteria are primarily performance benchmarks, error rate thresholds, and observability requirements (the system must emit the correct logs and metrics to detect a regression). Success metrics include developer experience proxies: integration failure rate, developer support ticket volume about the API, SDK adoption rate. Guardrail metrics are more critical here than in user-facing features -- a background infrastructure change can silently degrade user-facing behavior in ways that are invisible until measured.

### Internationalization or Localization Scope
When a feature must be localized for one or more languages or regions, localization scope is one of the most commonly under-specified areas in PRDs -- leading to last-minute scope creep, delayed launches, or incomplete localizations. The PRD must explicitly state: which locales are in scope for launch (list them specifically: en-US, fr-FR, de-DE), which locales are deferred, the character encoding requirements (UTF-8 in most cases but critical for CJK character sets), any locale-specific formatting requirements (date formats, currency symbols, number separators, RTL layout for Arabic or Hebrew), and whether content is user-generated (requiring a different localization strategy than static UI copy). The dependency table must include the localization team or vendor, the string freeze date (the date after which no new UI copy will be added to the launch scope), and the review process for translated content.

---

## Example

**Input:** "I need a PRD for a bulk CSV export feature on our B2B analytics dashboard. Power users have been requesting it. We get about 20 support tickets a month about this, and we lost two enterprise accounts recently who cited data export limitations in their churn survey."

**Output:**

---

## PRD: Bulk CSV Data Export

### Metadata
| Field | Value |
|-------|-------|
| **Author** | [PM Name], Product Manager -- Analytics |
| **Contributors** | [Eng Lead], [Designer], [Data Analyst] |
| **Date created** | 2025-01-15 |
| **Last updated** | 2025-01-15 |
| **Status** | Draft |
| **Target release** | Q1 2025 (estimated late March) |
| **Stakeholders** | [VP Product] -- Approver; [Head of Engineering] -- Approver (feasibility); [Customer Success Lead] -- Reviewer; [Legal] -- Reviewer (data handling) |
| **Related documents** | Dashboard technical spec v2.3, Data retention policy, GDPR data handling guidelines |

---

### Problem Statement

**Who:** Power users of the B2B analytics dashboard -- primarily data analysts and marketing managers at enterprise accounts (100+ seats) who rely on the dashboard for weekly or monthly reporting cycles.

**Problem:** Users cannot export dashboard data for offline analysis, executive reporting, or integration with external tools (Tableau, Google Sheets, Excel, internal BI systems). They are locked into consuming data exclusively through the dashboard UI.

**Evidence:** 20 support tickets per month requesting export capability (the highest-volume feature request by ticket count for the past three months). Two enterprise accounts cited "inability to get data out of the platform" as a primary reason for churn in exit surveys. Sales team reports that export capability is raised as a requirement in approximately 40% of enterprise sales conversations.

**Cost of inaction:** At an average enterprise ACV of $45,000, the two churned accounts represent $90,000 ARR lost. If export limitations are a factor in 40% of sales conversations and the team estimates 10% of those deals stall due to this gap, the pipeline impact is approximately $180,000 in potential ARR per quarter. Support cost at 20 tickets/month at an estimated $75 per tier-2 ticket is $1,500/month ($18,000/year) in operational cost.

**Current workaround:** Users ask their data analyst or the customer success team to run raw data queries and deliver results via email. This creates 24--72 hour delays, depends on analyst availability, and produces inconsistently formatted files. Some users have requested API access as a workaround -- a technically heavier solution than a UI export feature.

---

### Goal and Success Metrics

**Goal:** Enable analytics dashboard users to self-serve CSV exports of any dashboard view, reducing support burden, removing a churn driver, and eliminating the analyst-as-data-pipeline workaround.

| Metric | Type | Baseline | Target | Measurement Method | Window |
|--------|------|----------|--------|--------------------|--------|
| Export-related support tickets | Primary | 20/month (Jan 2025) | ≤ 5/month | Zendesk tag: "export-request" | 60 days post-full launch |
| Export feature adoption (% of eligible DAU who use export ≥1x per week) | Secondary | 0% (feature does not exist) | ≥ 15% | Product analytics (Amplitude) | 30 days post-full launch |
| Average exports per active exporter per week | Secondary | 0 | ≥ 2 | Amplitude | 60 days |
| Dashboard p95 page load time | Guardrail | 2.1 seconds (Jan 2025) | Must not exceed 2.8 seconds | Datadog APM | Ongoing |
| API error rate (dashboard endpoint) | Guardrail | 0.3% (Jan 2025) | Must not exceed 0.8% | Datadog | Ongoing |

---

### Target User

| Attribute | Detail |
|-----------|--------|
| **Segment** | Data analysts and marketing managers at enterprise accounts (100+ seats). Estimated 1,200 eligible users across 80 enterprise accounts. |
| **Current behavior** | User identifies data they need → emails customer success or internal analyst → waits 24--72 hours → receives unformatted CSV via email → manually reformats for use in Excel/Google Sheets/Tableau. |
| **Desired behavior** | User identifies data they need in the dashboard → clicks Export → selects date range → downloads a correctly formatted CSV within 30 seconds -- no email, no waiting, no reformatting. |
| **Context of use** | Desktop browser (Chrome/Firefox/Safari), used during business hours, weekly or monthly reporting cadence. Export is a deliberate, task-completing action -- not a real-time streaming need. |
| **Out-of-scope users** | Free-tier users (cost and abuse risk); mobile users (lower demand, export on mobile introduces UX complexity deferred to Phase 2); API users (they have programmatic access; this PRD covers UI export only). |

---

### User Stories

#### Theme 1: Export Initiation

**Story 1.1 [P0]:** As a data analyst, I want to export the current dashboard view as a CSV file, so that I can analyze the data in my preferred analytics tool without waiting for manual data extraction.

Acceptance Criteria:
- [ ] AC1: An "Export CSV" button is visible on every dashboard view without requiring a settings change or permission grant (for users with Analyst role or above).
- [ ] AC2: Clicking "Export CSV" initiates file generation and shows a progress indicator within 2 seconds.
- [ ] AC3: The export completes and the file downloads automatically within 30 seconds for datasets up to 100,000 rows.
- [ ] AC4: For datasets exceeding 100,000 rows, the export is queued and the user receives an email with a download link within 5 minutes. The user is informed of this at initiation.
- [ ] AC5: The CSV file uses UTF-8 encoding with RFC 4180-compliant comma-separated formatting and properly escaped special characters.
- [ ] AC6: If the export fails for any reason, the user sees an error message that identifies whether the failure is temporary ("Try again") or requires support contact, and the error is logged to Datadog.

**Story 1.2 [P0]:** As a data analyst, I want the exported CSV to include all columns visible in the current dashboard view with headers matching the dashboard labels, so that I do not need to manually rename columns after downloading.

Acceptance Criteria:
- [ ] AC1: Column headers in the CSV match exactly the column labels displayed in the dashboard UI (including any custom column names the user has configured).
- [ ] AC2: Column order in the CSV matches the left-to-right column order in the dashboard view at the time of export.
- [ ] AC3: Data types are preserved appropriately: dates as YYYY-MM-DD, numbers without currency symbols or thousands separators (raw numeric values), strings as unformatted text.
- [ ] AC4: Hidden or filtered-out columns (not visible in the current dashboard view) are not included in the export.

#### Theme 2: Date Range Selection

**Story 2.1 [P1]:** As a marketing manager, I want to select a custom date range before exporting, so that I can retrieve data for a specific reporting period without modifying the live dashboard view.

Acceptance Criteria:
- [ ] AC1: A date range picker is displayed when the user clicks "Export CSV," offering Quick Select options (Last 7 days, Last 30 days, Last 90 days, Custom range) and a Custom range calendar input.
- [ ] AC2: The date range picker pre-populates with the date range currently active on the dashboard.
- [ ] AC3: The exported data reflects the selected date range exclusively -- no rows outside the selected range are included.
- [ ] AC4: If the user selects a custom date range spanning more than 365 days, a warning is displayed: "Exports over 365 days may take longer. Large datasets will be sent by email." The user can proceed or cancel.
- [ ] AC5: The selected date range is included in the exported filename as a suffix: `dashboard-name_YYYY-MM-DD_to_YYYY-MM-DD.csv`.

#### Theme 3: Permissions and Access Control

**Story 3.1 [P0]:** As an account administrator, I want export capability to respect the existing role-based access control settings, so that users cannot export data that their role does not permit them to view.

Acceptance Criteria:
- [ ] AC1: The "Export CSV" button is visible only to users with the Analyst, Manager, or Admin role. Viewer-role users do not see the export button.
- [ ] AC2: A Viewer-role user who attempts to access the export endpoint directly (e.g., via URL manipulation) receives a 403 response, not a data payload.
- [ ] AC3: Exported data is scoped to the data the user has permission to view -- row-level security applied in the dashboard view is also applied to the export.
- [ ] AC4: Export actions are logged in the audit log with: user ID, account ID, timestamp, dashboard ID, date range selected, row count exported.

#### Theme 4: Error Handling and Empty States

**Story 4.1 [P1]:** As a data analyst, I want clear feedback when my export cannot be completed, so that I can take appropriate action without contacting support.

Acceptance Criteria:
- [ ] AC1: If the dashboard view has no data for the selected date range, the export button is disabled and a tooltip reads: "No data available for the selected period."
- [ ] AC2: If the export service is unavailable (HTTP 503), the user sees: "Export is temporarily unavailable. Please try again in a few minutes." The error is tagged in Datadog for alerting.
- [ ] AC3: If the export times out (exceeds 35 seconds for small datasets), the system automatically falls back to the email delivery flow and notifies the user inline.

---

### Out of Scope

| Exclusion | Category | Reason |
|-----------|----------|--------|
| PDF export | Deferred | Requested by 3 tickets/month (low demand). Requires significant rendering work. Targeted for Phase 2 post-adoption validation. |
| Scheduled / automated exports (email cadence, Slack delivery) | Deferred | Requires background job infrastructure and notification service integration. Separate initiative -- "Automated Reporting." ETA: Q3 2025. |
| Excel (.xlsx) export format | Deferred | UTF-8 CSV opens correctly in Excel. Native .xlsx requested by 4 tickets/month. Deferred until adoption data justifies the additional format complexity. |
| Export of raw event-level data | Deliberately excluded | Raw event tables can contain hundreds of millions of rows. Performance risk is unacceptable in this PRD's scope. Scoped to aggregated dashboard views only. Raw data access is addressed through the Data API initiative. |
| Mobile (iOS/Android) export | Deferred | Export on mobile introduces download manager complexity. Mobile DAU is 8% of total. Deferred to Phase 2 after desktop adoption is validated. |
| Free-tier user access to export | Deliberately excluded | Export is positioned as a paid-tier differentiator. Free-tier users see a "Upgrade to export" prompt instead of the export button. |
| Multi-dashboard batch export | Not yet known | Insufficient data on whether users want cross-dashboard aggregated exports. Requires UX research before scoping. |

---

### Assumptions, Risks, and Dependencies

#### Assumptions
| Assumption | Type | Validation Method | Owner | Status |
|------------|------|------------------|-------|--------|
| The export backend can generate 100K-row CSVs within 30 seconds on current infrastructure | Technical | Load test with representative query patterns before Phase 1 launch | Engineering Lead | Pending |
| Users will adopt self-serve export rather than continuing to email customer success | User | Monitor CS export request tickets at 30 days post-launch; target < 5/month | Customer Success Lead | Pending |
| UTF-8 CSV is sufficient for the majority of users; specialized format requests are a minority | User | Support ticket analysis (confirmed: 3 xlsx requests/month vs. 20 generic export requests) | PM | Validated |
| Row-level security currently applied in the dashboard query layer can be reused for exports | Technical | Engineering Lead to confirm before PRD approval | Engineering Lead | Pending |

#### Risks
| Risk | Category | Likelihood | Impact | Mitigation | Contingency |
|------|----------|-----------|--------|------------|-------------|
| Large export queries degrade dashboard performance for other users | Technical | Medium | High | Implement query queuing and resource limits; run large exports in a separate worker pool | Kill switch to disable exports > 50K rows; revert to email-only for large exports |
| Users attempt to export data they are not authorized to view via direct API calls | Technical / Security | Low | High | Implement auth checks at export API layer (not just UI layer); include in security review | Immediate rollback of feature flag if unauthorized access is detected |
| Customer success team continues to receive manual export requests from habit, masking true adoption | Adoption | Medium | Medium | Proactive in-app announcement + CS team training on directing users to self-serve export | Adjust adoption target interpretation at 30-day review if CS request volume does not drop proportionally |
| Enterprise account data volume exceeds assumed 100K row limit, causing timeouts | Technical | Low | Medium | Implement graceful fallback to email delivery at 100K row threshold | Increase threshold if P99 latency data shows headroom; escalate to Data API team for large accounts |

#### Dependencies
| Dependency | Description | Owner Team | Required By | Status | Impact if Delayed |
|-----------|-------------|-----------|-------------|--------|------------------|
| Dashboard query service | Export reuses the existing query execution layer; requires confirmation that the service supports async query execution for large exports | Data Platform | 2025-02-01 | Pending confirmation | If async not supported, email delivery for large exports requires a separate background job -- adds 2-week engineering effort |
| Audit logging service | Export actions must be logged; requires audit log service to accept a new event type: "data_export" | Security Engineering | 2025-02-15 | On track | If delayed, export can launch without audit logging only if legal approves a time-limited exception |
| Legal review -- data export and GDPR | Confirm that on-demand CSV export complies with data handling and retention policies for EU accounts | Legal | 2025-02-01 | In progress | If export requires additional consent flows for EU users, launch scope may require segmented rollout (non-EU first) |

---

### Release Plan

| Phase | Rollout | Audience | Gate Conditions to Advance | Duration |
|-------|---------|----------|---------------------------|----------|
| Phase 1 -- Internal | 100% internal users | Internal team members and beta accounts (5 accounts, manually selected) | Zero critical bugs, p95 export time < 30 seconds for test dataset, audit log entries confirmed | 1 week |
| Phase 2 -- Limited | 10% of enterprise accounts (random cohort) | ~8 enterprise accounts | Error rate < 0.5%, p95 response time within guardrail, primary metric directionally positive (support ticket volume decreasing) | 2 weeks |
| Phase 3 -- General | 100% of paid-tier users | All Analyst, Manager, Admin roles on paid tiers | All gate conditions met; no guardrail breaches; legal sign-off confirmed | -- |

**Feature flag:** `bulk-csv-export-enabled`, Owner: [Engineering Lead], Default: Off, Kill switch: Disable flag in LaunchDarkly within 5 minutes; Engineering oncall verifies error rate returns to baseline; PM notifies customer-facing stakeholders within 30 minutes.

**Rollback triggers:**
- API error rate exceeds 1.5% sustained for 10 minutes on the export endpoint
- Dashboard p95 page load time exceeds 2.8 seconds (guardrail breach)
- Unauthorized data access confirmed by security monitoring

**Rollback procedure:** Engineering oncall disables `bulk-csv-export-enabled` flag in LaunchDarkly → verifies dashboard error rate returns to < 0.5% baseline within 5 minutes → PM notified → PM sends internal stakeholder notification within 30 minutes → post-mortem scheduled within 48 hours.

**Post-launch review date:** 30 days after Phase 3 launch -- review primary metric (support ticket volume), secondary metrics (adoption rate, exports per user), and guardrail metrics. Close PRD or create Phase 2 PRD based on findings.

---
