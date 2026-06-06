---
name: user-story-writing
description: |
  Writes agile user stories in standard format with acceptance criteria, definition of done, story point estimation guidance, and sprint-ready breakdown. Use when the user asks about user stories, writing user stories, acceptance criteria, agile story format, or backlog grooming.
  Do NOT use for full PRDs (use prd-writing), technical specifications (use technical-specification), or feature specifications (use feature-spec).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "agile planning template project-management strategy"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# User Story Writing

## When to Use

**Use this skill when:**
- A user asks to write, refine, or review user stories for a feature, epic, or backlog item -- including partial inputs like "I need stories for a checkout flow" or "help me write AC for this story"
- A user wants to break down a large epic or initiative into sprint-ready, independently deliverable stories
- A user needs to convert a rough feature idea, a stakeholder request, a bug report, or a support ticket into properly formatted agile stories
- A user asks specifically about acceptance criteria format, definition of done, Given/When/Then syntax, or BDD-style specifications
- A user is preparing for backlog grooming, sprint planning, or a refinement session and needs stories that are estimation-ready
- A user wants to create a story map to visualize MVP scope across a release or program increment
- A user has existing stories and needs them audited against quality standards (INVEST, testability, vertical slicing)
- A user needs to convert a jobs-to-be-done (JTBD) statement or customer journey map step into discrete user stories

**Do NOT use this skill when:**
- The user needs a full product requirements document covering market context, competitive analysis, and multi-feature scope -- use `prd-writing`
- The user wants a feature specification with wireframe annotations, UX flows, component states, and design decisions -- use `feature-spec`
- The user needs a technical specification describing system architecture, API contracts, data models, or implementation decisions -- use `technical-specification`
- The user is building a product roadmap across multiple quarters or planning a release train -- use `product-roadmap`
- The user is asking how to run a sprint retrospective, write a definition of ready, or structure sprint ceremonies -- those are agile process questions outside story-writing scope
- The user needs a job description, project brief, or statement of work -- those are different document types
- The user is asking for test plans or test cases from existing stories -- the acceptance criteria in stories inform tests, but a test plan is a separate artifact

---

## Process

### 1. Gather Context Before Writing Anything

Before producing a single story, collect the inputs that determine story quality. Skipping this step produces generic, low-value stories that will be rewritten in refinement.

- **Who are the users?** Get specific role names: "logistics coordinator," "first-time homebuyer," "enterprise IT admin" -- not "user" or "customer." If the team has defined personas, use their names. If not, infer the most specific role possible from context.
- **What is the enclosing epic or initiative?** Understand the problem being solved at the feature level before decomposing. A password reset feature exists because users get locked out; that context shapes which stories matter most.
- **What platform and tech constraints exist?** Web-only vs. responsive vs. native mobile changes acceptance criteria significantly. Existing API contracts, legacy system limitations, or SSO integrations may constrain what "done" looks like.
- **What is already built?** Ask whether this is greenfield, an extension to an existing flow, or a replacement of legacy behavior. Existing behavior creates migration stories and regression requirements.
- **What is the sprint/release deadline context?** If this is for an immediate sprint, stories must be small and unambiguous. If planning a quarter ahead, stories can be coarser and refined later.
- **Does the team use points or t-shirt sizing?** Confirm the estimation scale (Fibonacci 1-2-3-5-8-13, t-shirt XS/S/M/L/XL, or ideal days) before adding estimates.
- **Are there compliance, accessibility, or regulatory requirements?** WCAG 2.1 AA, GDPR data handling, HIPAA logging, PCI DSS payment fields -- these generate specific acceptance criteria that cannot be omitted.

### 2. Identify the User Flows and Decompose Vertically

Map the complete user journey for the feature before writing individual stories. This prevents missing stories and ensures each story delivers a true vertical slice.

- **Draw the happy path first.** List every step a user takes from entry to goal completion in plain language: "navigates to page → enters search term → views results → applies filters → clicks result → views detail → takes action." Each discrete decision point or user action is a candidate story.
- **Identify the alternative paths.** What happens when the user has no results? What if they are unauthenticated? What if they are on a mobile device? Alternate paths are P1 or P2 stories, not acceptance criteria on the happy-path story.
- **Decompose by user goal, not by UI component or technical layer.** "Build search index" is a task. "Build the filter component" is a horizontal layer. "User can filter search results by category so that they find relevant products faster" is a vertical slice -- it touches every layer from UI to database but delivers user value.
- **Use the SPIDR decomposition techniques** when a story is too large: decompose by **S**pike (research first), **P**ath (one user path per story), **I**nterface (channel-specific), **D**ata variation (one data type per story), or **R**ules (one business rule per story).
- **Distinguish stories from tasks and spikes.** Stories deliver user value. Tasks are implementation steps (create S3 bucket, write migration script). Spikes are time-boxed research. Format them differently -- do not mix them in the story format.
- **Sequence by dependency and value.** Stories with no dependencies and highest user value go first. Stories that unlock other stories (authentication before anything authenticated) get elevated priority regardless of business value.

### 3. Write Each Story in the Standard Format

The three-clause format ("As a / I want to / So that") is a communication tool, not a bureaucratic template. Every word choice matters.

- **"As a [persona]"** -- be as specific as the context allows. "As a warehouse manager reviewing end-of-day inventory reports" is better than "As a warehouse manager" which is better than "As a user." The persona sets the context for acceptance criteria.
- **"I want to [action]"** -- use active verbs that describe what the user does, not what the system does. "filter my transaction history by date range" (user action) vs. "have the system apply date filters to transactions" (system action). The user-centric framing keeps stories from drifting into technical specs.
- **"So that [outcome]"** -- this is the most commonly botched clause. It must describe the business or user outcome, not restate the action. Test it with the "Five Whys": if you can ask "but why does that matter?" again, you haven't gone deep enough. "So that I can see filtered results" fails the test. "So that I can identify which transactions occurred in Q3 for my audit report" passes.
- **Title the story concisely.** A good story title is a noun phrase that could stand alone in a sprint board: "Filter transaction history by date range" not "Date filtering."
- **If multiple personas need the same capability, write separate stories only if the acceptance criteria differ materially.** An admin searching vs. a read-only user searching may look identical -- combine them. An admin deleting vs. a user requesting deletion are completely different flows -- separate stories.
- **For system-to-system stories (APIs, integrations, background jobs):** replace the human persona with the consuming system. "As the mobile app, I want to receive a webhook payload when an order status changes, so that I can update the user's order status in real time without polling." This preserves the value-oriented format while acknowledging the technical context.

### 4. Write Acceptance Criteria Using Given/When/Then

Acceptance criteria are the contractual definition of "done" for a specific story. They must be precise enough for a QA engineer to write test cases directly from them.

- **Use the Given/When/Then (GWT) format** for behavioral scenarios. Given establishes preconditions (state of the system + user state). When describes the triggering action. Then describes the observable outcome. "Given the user is logged in and has 5 orders in their history, when they navigate to Order History, then they see a list of 5 orders sorted by date descending" is a complete, testable criterion.
- **Cover all three scenario types for every story:**
  - **Happy path** -- the standard successful flow (at least 1-2 criteria)
  - **Alternative paths** -- valid but non-standard conditions: empty state, boundary values, pagination, timeout
  - **Error states** -- invalid input, system failure, unauthorized access, network failure
- **Apply the 3-7 rule as a quality gate:** fewer than 3 AC means the story is too vague for estimation; more than 7 AC means the story should be split into two or more stories. This rule has real exceptions (complex business rules), but treat violations as a prompt to revisit scope.
- **Quantify performance criteria explicitly when they matter:** "The search results return within 500ms for queries against up to 1 million records" not "search is fast." Standard thresholds: page load under 3 seconds (RAIL model), API response under 200ms for synchronous calls, under 1 second for complex queries.
- **Include security and access control criteria in every story involving sensitive data or protected routes:** "Given an unauthenticated user, when they navigate directly to /account/orders, then they are redirected to the login page with a return URL parameter."
- **Include accessibility criteria for all UI stories** where WCAG compliance is required: "All form fields have associated labels readable by screen readers," "Focus order follows the visual layout," "Error messages are announced by ARIA live regions."
- **State what does NOT happen, not just what does.** Negative outcomes prevent misinterpretation: "then the old password remains valid until the user successfully sets a new one" clarifies security behavior that an engineer might otherwise get wrong.
- **Avoid subjective language:** "the UI looks polished," "the form is user-friendly," "the response feels fast." Every criterion must resolve to a binary pass/fail.

### 5. Apply the INVEST Test as a Quality Gate

After drafting stories, run each one through INVEST. This is not a checkbox exercise -- it is a diagnostic tool that reveals structural problems.

- **Independent:** Can this story be developed and tested without any other story in the backlog being completed first? If Story B requires Story A's API to exist, that is a dependency. Surface it explicitly with a "Blocked by: [Story A]" note and consider whether Story A should be in the same sprint or whether Story B needs restructuring.
- **Negotiable:** Does the story describe what the user needs, or does it prescribe how to build it? "User can authenticate using their company SSO" is negotiable. "User authenticates via SAML 2.0 using the Okta connector" is a technical decision embedded in the story -- move implementation detail to Notes or the technical spec.
- **Valuable:** Can this story be shipped and provide value to a user even if no other story in the sprint is completed? A story that only shows value when combined with three other stories is a task masquerading as a story -- combine them or reframe.
- **Estimable:** Can the team produce a point estimate with moderate confidence? If the answer is no, the team needs either more information (create a spike) or the story is too large (split it). An unestimable story should never enter a sprint.
- **Small:** For a two-week sprint, a single story should not exceed 8 story points. A story estimated at 13 points is almost certainly two stories. A story estimated at 21 points is an epic. Push back on stories that cannot be shrunk below 8 points -- find a SPIDR decomposition axis.
- **Testable:** Every acceptance criterion must be verifiable by a QA engineer, an automated test, or a product owner review. If the team cannot agree on what "done" looks like, the story is not testable -- add detail to acceptance criteria or split the story.

### 6. Define or Confirm the Definition of Done

The Definition of Done (DoD) is a team-level contract, not story-level -- but it must be confirmed or established before finalizing stories.

- **Distinguish DoD from acceptance criteria.** AC is story-specific (this story is done when...). DoD is the baseline quality bar every story must meet regardless of its specific AC (all stories must have passing tests, be reviewed, be deployed to staging, etc.).
- **A production-grade DoD typically includes:** code review approved by at least one peer, automated unit tests passing with ≥80% line coverage for new code, integration tests covering critical paths, acceptance criteria verified in a staging environment, no open critical (P0) or high (P1) bugs on the story, release notes or changelog updated for user-visible changes, accessibility audit for UI stories, security review triggered if the story touches auth, payments, or PII.
- **Adjust DoD to team maturity.** A team without CI/CD should not have "deployed to production" in their DoD -- they will game it. Match the DoD to what the team can actually enforce consistently.
- **Include the DoD in the output only when explicitly requested** or when the user appears to be establishing their story framework for the first time. For teams that already have a DoD, acknowledge it and reference it rather than rewriting it.

### 7. Estimate with Relative Story Points

If the user requests estimation guidance, apply the Fibonacci-relative approach. Do not assign hours.

- **Establish a reference story.** Before estimating a batch, identify one well-understood, medium-complexity story and anchor it as "3 points." All other stories are estimated relative to it. "This is about the same as the reference story" = 3. "This is twice as complex" = 5 or 8.
- **Fibonacci scale rationale:** 1 (trivial change, near-zero uncertainty), 2 (small, well-understood), 3 (moderate, clear path), 5 (above-average complexity or uncertainty), 8 (high complexity or significant unknowns, consider splitting), 13 (too large for one sprint -- split required), 21+ (this is an epic, not a story).
- **Story points measure a combination of effort, complexity, and uncertainty.** A story with known implementation but significant edge-case complexity scores higher than a story with unknown implementation but clear requirements. Neither dimension alone drives the estimate.
- **Recommend Planning Poker for teams estimating together.** Simultaneous reveal of estimates (not sequential) prevents anchoring bias. Outlier estimates (highest and lowest) must be discussed before re-estimating.
- **Flag stories with high uncertainty separately.** A spike is preferable to estimating an unknowable story. "Spike: Investigate SSO integration options with legacy auth system. Time box: 4 hours. Output: Recommendation document and estimable story set."

### 8. Organize and Deliver the Story Set

The final deliverable is a coherent, prioritized, sprint-ready story set -- not a list of disconnected items.

- **Group stories by user flow or theme**, not by technical component. "Account Management," "Search and Discovery," "Checkout Flow" are user-centric groupings. "Frontend," "Backend," "Database" are technical groupings that obscure value.
- **Assign priority using a simple three-tier system:** P0 = required for MVP / must ship this sprint, P1 = important but can slip one sprint, P2 = enhancement or future iteration. Every story must have a priority label.
- **Include a story map for epics with 8+ stories.** A story map shows user flow steps on the horizontal axis and story priority tiers on the vertical axis. It makes release planning conversations concrete.
- **Flag dependencies explicitly.** If Story 4 cannot begin until Story 1 is merged, write "Depends on: Story 1" as a story field. Hidden dependencies are one of the top causes of sprint failures.
- **Note open questions as explicit blockers.** "Open question: Does the design team have approved wireframes for the empty state? Blocks: AC verification for Story 3." An open question is not an excuse to leave a story incomplete -- it is a tracked risk with an owner.

---

## Output Format

```markdown
## User Stories: [Feature/Epic Name]

### Epic Summary
[1-2 sentences describing the overall feature, the user problem it solves, and the business outcome expected.]

### Definition of Done (Team Standard)
- [ ] Code written, peer-reviewed (≥1 approver), and merged to main branch
- [ ] Unit tests passing; ≥80% line coverage for new code paths
- [ ] Acceptance criteria verified in staging environment by PO or QA
- [ ] No open critical (P0) or high (P1) severity bugs on this story
- [ ] User-visible changes reflected in changelog or release notes
- [ ] Accessibility criteria verified for all UI changes (WCAG 2.1 AA)
- [ ] Security review completed if story touches authentication, payments, or PII

---

### Story Map (for epics with 5+ stories)

| User Flow Step         | P0 (MVP)           | P1 (Next Sprint)   | P2 (Future)        |
|------------------------|--------------------|--------------------|---------------------|
| [Flow Step 1]          | Story 1            | Story 6            |                     |
| [Flow Step 2]          | Story 2, Story 3   | Story 7            | Story 10            |
| [Flow Step 3]          | Story 4, Story 5   |                    | Story 11            |

---

### Stories

---

#### Story [N]: [Short, active-noun-phrase title]
**Priority:** [P0 / P1 / P2]
**Estimate:** [1 / 2 / 3 / 5 / 8] points
**Depends on:** [Story X, or "None"]

**As a** [specific, named persona or role in context],
**I want to** [concrete, user-initiated action],
**So that** [business or user outcome that explains the value].

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given [preconditions], when [user action], then [observable system outcome]
- [ ] **[Happy Path]** Given [preconditions], when [user action], then [observable system outcome]
- [ ] **[Alternative Path]** Given [edge condition], when [user action], then [expected behavior]
- [ ] **[Error State]** Given [invalid or failure condition], when [user action], then [error behavior and recovery path]
- [ ] **[Performance / Security / Accessibility]** [Specific measurable criterion]

**Open Questions:** [Any unresolved design, business rule, or technical question blocking finalization -- or "None"]
**Notes:** [Implementation hints, design references, constraints, or dependencies worth flagging -- keep these brief and optional]

---

*(Repeat Story block for each story)*

---

### Spike (if applicable)

#### Spike: [Investigation Title]
**Time Box:** [X hours]
**Question to Answer:** [The specific decision or uncertainty this spike resolves]
**Output:** [Document, decision log, ADR, or set of estimable stories]
**Acceptance:** Team can produce point estimates for dependent stories after spike is complete.

---

### Backlog Summary Table

| Story # | Title                        | Priority | Estimate | Depends On |
|---------|------------------------------|----------|----------|------------|
| 1       | [Story title]                | P0       | 3 pts    | None       |
| 2       | [Story title]                | P0       | 5 pts    | Story 1    |
| 3       | [Story title]                | P1       | 2 pts    | Story 2    |
| Total   |                              |          | XX pts   |            |
```

---

## Rules

1. **Never write a story without acceptance criteria.** A story without AC is a wish list item, not a requirement. Any story entered into a sprint without AC will generate scope debate mid-sprint. If AC cannot be written yet, the story is not refinement-ready -- create a spike instead.

2. **Always use the most specific persona the context supports.** "User" is the last resort. "Returning customer with saved payment methods" is a persona. "Enterprise IT admin with tenant management permissions" is a persona. Specificity drives better AC and prevents the team from building for an imaginary average user.

3. **The "So that" clause must survive the "so what?" challenge.** Read it aloud and ask "so what?" If the answer is obvious or adds more value, the clause is too shallow. "So that I can log in faster" barely passes. "So that I can access my dashboard without re-entering credentials every session, reducing friction for daily active use" passes clearly.

4. **Acceptance criteria must be binary pass/fail.** "The UI looks clean" is not a criterion. "All form inputs have a 4px border-radius and match the design system token `border-radius-sm`" is a criterion. If a QA engineer cannot mark it green or red in a test run, rewrite it.

5. **Stories must represent vertical slices, not horizontal layers.** A database migration, an API endpoint, or a React component are tasks -- they do not deliver user value in isolation. Every story must touch every layer needed to deliver a visible user outcome, even if those layers are thin. "User can view their account email address" is a thin vertical slice. "Build the user profile API endpoint" is a horizontal layer.

6. **Stories estimated above 8 points must be split before sprint entry.** There are no legitimate exceptions to this rule for sprint-level planning. If a story "cannot be split," it is not a story -- it is a design failure. Apply the SPIDR model to find the split axis.

7. **Include at least one error state or failure scenario in every story's acceptance criteria.** Happy-path-only stories produce happy-path-only implementations. Engineers build what is specified. If error handling is not in the AC, it will not be built, tested, or consistent.

8. **Never embed implementation decisions in the story narrative.** "User can search products" is a story. "User can search products using an Elasticsearch full-text query with a BM25 relevance scorer" is a story with a technical constraint embedded in the narrative. Move technology decisions to Notes or the technical specification. The story describes the what and why; the team decides the how.

9. **Mark every story with a priority label (P0/P1/P2) before handing it to the team.** Unprioritized backlogs turn refinement sessions into priority debates. P0 means the sprint or release fails without it. P1 means it is important but the sprint is still valuable if it slips. P2 means it is a planned enhancement that can be deferred without user impact.

10. **Flag every cross-story dependency explicitly using a "Depends on" field.** Implicit dependencies are the leading cause of blocked sprint work. If a story cannot start because another story's API does not exist yet, that dependency must be surfaced in writing at story creation time -- not discovered during the sprint when it becomes a blocker.

11. **Do not conflate the Definition of Done with acceptance criteria.** DoD applies to every story uniformly (code review, tests passing, deployed to staging). AC is story-specific (this particular behavior works this particular way). Mixing them produces stories where "tests must pass" appears as AC -- which is redundant noise that obscures the actual behavioral requirements.

12. **Accessibility and security criteria are not optional in UI and auth stories.** For any story touching form inputs, user authentication, PII display, payment data, or navigation: add the relevant WCAG 2.1 AA criterion and the relevant security criterion explicitly. "Accessibility will be handled separately" is a deferral that becomes technical debt within one release.

---

## Edge Cases

### API-Only or Headless System Stories

When writing stories for backend services, data pipelines, or integrations with no direct human-facing UI, replace the human persona with the consuming system or downstream user. "As the order management service, I want to receive a webhook notification when payment is confirmed, so that I can initiate the fulfillment workflow without polling the payment service." The value clause explains why this integration matters at the system level. Acceptance criteria should cover payload structure, retry behavior on failed delivery, and idempotency requirements ("Given the same webhook fires twice, when the service processes it, then only one fulfillment workflow is created").

### Stories Written for Compliance or Regulatory Requirements

Compliance stories (GDPR right-to-erasure, HIPAA audit logging, ADA accessibility, PCI DSS cardholder data isolation) have mandatory, non-negotiable acceptance criteria. Do not mark these as P1 or P2 -- they are P0 by legal obligation. The AC must reference the specific standard and clause: "Given a user submits a data deletion request, when the request is processed, then all PII is permanently deleted from primary storage within 30 days per GDPR Article 17." Include compliance reference numbers in the Notes field for traceability to audit requirements.

### Migrating Legacy Functionality to a New System

When a story describes re-implementing existing behavior in a new platform, add a "behavioral parity" acceptance criterion explicitly: "Given the user performs [action X], when the new system processes it, then the result matches the behavior of the legacy system for all data that existed before [migration date]." Also write a parallel "migration story" for data transition if applicable. Treat regression of existing behavior as a P0 defect, not a P1 enhancement.

### Stories With High Business Rule Complexity

When a single user action triggers five or more distinct business rules (pricing engine calculations, multi-tier approval workflows, eligibility checks), the story will exceed 7 AC and should be decomposed. Use the SPIDR "Rules" axis: write one story per business rule variant. "User can apply a standard discount code" is one story. "User can apply a stacked loyalty + promotional discount" is a separate story. Each will have its own AC covering the specific rule logic. If the rules are not yet documented, create a spike to extract and document them before writing stories.

### Bug Fix as a User Story

Reframe bugs as user stories from the affected user's perspective rather than as technical fix descriptions. "Fix null pointer exception in cart total calculation" is a task. "As a customer, I want my cart total to include all applied discounts correctly, so that I am not surprised by an unexpected charge at checkout" is a story. Acceptance criteria include: the corrected behavior, the specific scenario that was broken (as a regression test case), and confirmation that existing correct scenarios still pass. Add a "Regression" label so the team knows to add a permanent automated test for this path.

### Spike for Unknown Technical Feasibility

When a feature requires technology the team has no experience with, or when the implementation space is genuinely unknown, write a spike instead of a story. Spike format: title starts with "Spike:", states the explicit question being answered ("Can we achieve sub-100ms geolocation lookups using the existing infrastructure without adding a new service?"), defines the time box in hours (never more than one sprint's worth of a single engineer's time -- typically 4-16 hours), and specifies the output artifact ("Decision document with two implementation options, rough complexity estimates, and a recommended approach"). The spike's acceptance criterion is always: "The team can estimate related user stories after the spike is complete." Do not create an open-ended investigation without a time box -- it will expand to fill all available time.

### Cross-Platform Features (Web, iOS, Android)

Write one platform-agnostic story capturing the user behavior, then add platform-specific acceptance criteria within the same story. "As a customer, I want to receive a push notification when my order ships, so that I know when to expect my delivery" applies to all platforms. Platform-specific AC then follows: "On iOS: notification is delivered via APNs; user is prompted for notification permissions on first trigger if not previously granted; tapping the notification opens the Order Detail screen." "On Android: notification is delivered via FCM; notification channel 'Order Updates' is registered; tapping the notification deep-links to the Order Detail screen." If the platform implementations diverge significantly in complexity or timing, split into platform-specific stories -- but only if their estimates would differ by more than one Fibonacci size.

### Stories Inherited From Stakeholder Feature Requests or Sales Commitments

When a story originates from a committed customer feature request or a sales promise, flag it with a "Committed" label and include the commitment context in the Notes field ("Committed to [Customer Name] for [Release X] per sales contract dated [date]"). This changes the P0/P1/P2 framework -- a committed story is P0 by obligation regardless of its internal value ranking. The team needs this context to avoid deprioritizing it during planning. AC for committed stories should be reviewed with the customer-facing team to ensure the implementation will satisfy the actual customer expectation, not just an internal interpretation.

---

## Example

**Input:** "We're building a multi-step onboarding flow for a B2B SaaS product. New users need to set up their company account after signing up. It involves entering company details, inviting team members, and connecting their first integration. I need sprint-ready stories for this."

---

## User Stories: Company Onboarding Flow

### Epic Summary
Enable newly registered B2B users to activate their company account end-to-end -- including setting up their company profile, inviting teammates, and connecting a first integration -- so that the team is functional on day one without requiring support intervention.

### Definition of Done (Team Standard)
- [ ] Code written, peer-reviewed (≥1 approver), and merged to main branch
- [ ] Unit tests passing; ≥80% line coverage for new code paths
- [ ] Acceptance criteria verified in staging environment by PO or QA
- [ ] No open critical (P0) or high (P1) severity bugs on this story
- [ ] All form fields and interactive elements meet WCAG 2.1 AA standards
- [ ] User-visible copy reviewed by product -- no placeholder text in staging
- [ ] Analytics events tracked per instrumentation spec (if applicable)

---

### Story Map

| User Flow Step             | P0 (Sprint 1 MVP)          | P1 (Sprint 2)               | P2 (Future)                  |
|---------------------------|----------------------------|-----------------------------|------------------------------|
| Company Profile Setup     | Story 1                    | Story 6 (logo upload)       |                              |
| Team Member Invitation    | Story 2, Story 3           | Story 7 (bulk CSV import)   | Story 10 (SSO provisioning)  |
| Integration Connection    | Story 4                    | Story 8 (OAuth retry flow)  | Story 11 (multi-integration) |
| Onboarding Completion     | Story 5                    | Story 9 (completion email)  |                              |

---

### Stories

---

#### Story 1: Set Up Company Profile During Onboarding
**Priority:** P0
**Estimate:** 3 points
**Depends on:** None (entry point of the onboarding flow)

**As a** newly registered account admin completing onboarding for the first time,
**I want to** enter my company name, industry, and team size,
**So that** the product can be configured with relevant defaults and my teammates see our company context when they join.

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given I have just registered and my account has no company profile, when I log in for the first time, then I am automatically directed to Step 1 of the onboarding wizard
- [ ] **[Happy Path]** Given I am on Step 1, when I enter a company name (1-100 characters), select an industry from the dropdown, and select a team size range, then I can advance to Step 2
- [ ] **[Validation]** Given I attempt to advance without entering a company name, when I click "Continue," then the company name field shows an inline error: "Company name is required" and focus is moved to that field
- [ ] **[Alternative Path]** Given I have partially completed Step 1, when I close the browser and return within 7 days, then my progress is restored and I resume at Step 1 with my previously entered values pre-filled
- [ ] **[Alternative Path]** Given I am the account admin, when I complete onboarding, then I can edit company profile fields later from the Settings page (onboarding is not the only path to update this data)
- [ ] **[Accessibility]** All form fields have visible labels and associated `<label>` elements; dropdown fields are keyboard-navigable; error messages are announced by an ARIA live region

**Open Questions:** What are the industry categories -- does product have a finalized list, or should we use a standard taxonomy (NAICS, SIC)? Blocks: dropdown implementation.
**Notes:** Progress persistence for partial completion should use local storage as a fallback if the user is not authenticated mid-flow.

---

#### Story 2: Invite Team Members by Email During Onboarding
**Priority:** P0
**Estimate:** 5 points
**Depends on:** Story 1 (company profile must exist before invitations can be associated with it)

**As a** newly registered account admin setting up their company workspace,
**I want to** enter email addresses for my teammates and send them invitation emails during onboarding,
**So that** my team can access the product immediately after setup without me having to remember to do it later from the Settings page.

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given I am on the Invite Team step, when I enter up to 10 valid email addresses (comma-separated or one per line) and click "Send Invites," then each address receives an invitation email within 2 minutes containing a unique accept link that expires in 7 days
- [ ] **[Happy Path]** Given I have sent invitations, when I view the Team Settings page, then I see all invited users listed with status "Invite Pending" and the date the invitation was sent
- [ ] **[Alternative Path]** Given I want to skip this step for now, when I click "I'll do this later," then I advance to the next onboarding step and the invite step is marked skippable (not blocking completion)
- [ ] **[Validation]** Given I enter an email address in an invalid format (missing @ or domain), when I click "Send Invites," then the invalid addresses are highlighted with an inline error and the valid addresses are not affected
- [ ] **[Validation]** Given I enter an email address that is already a member of the company account, when I click "Send Invites," then that address is skipped with a visible notice ("already a member") and the remaining invitations are still sent
- [ ] **[Security]** Given an invitation link is clicked after 7 days, when the new user attempts to accept, then they see an error message: "This invitation has expired. Please ask your admin to resend." and are not granted access
- [ ] **[Security]** Given an already-accepted invitation link is clicked again, when the user attempts to use it, then they are redirected to the login page, not granted a second account creation

**Open Questions:** Should invited users receive the role "Member" by default, or should the admin assign roles at invite time? Design has not confirmed role selection UI.
**Notes:** Invitation email template is owned by the marketing/comms team -- confirm copy before sprint starts.

---

#### Story 3: Accept a Team Invitation and Join the Company Workspace
**Priority:** P0
**Estimate:** 3 points
**Depends on:** Story 2 (invitations must be sent before they can be accepted)

**As a** team member who received an invitation email from my company admin,
**I want to** click the invitation link, set my password, and access the shared company workspace,
**So that** I can start using the product with my team's existing configuration without needing to set anything up myself.

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given I click a valid invitation link, when the page loads, then I see a registration form pre-filled with my invited email address (read-only) and fields for my name and password
- [ ] **[Happy Path]** Given I complete the registration form with a valid password (minimum 8 characters, at least one number), when I submit, then my account is created, I am added to the company workspace with the default Member role, and I am redirected to the product dashboard
- [ ] **[Validation]** Given I enter a password shorter than 8 characters, when I submit, then I see an inline error: "Password must be at least 8 characters" and the form is not submitted
- [ ] **[Error State]** Given I attempt to accept an expired link (older than 7 days), when the page loads, then I see: "This invitation has expired. Contact your admin to get a new one." with no registration form visible
- [ ] **[Error State]** Given I attempt to accept an invitation but a network error occurs during account creation, when I submit the form, then I see an error message and the form remains populated with my data so I can retry without re-entering everything
- [ ] **[Security]** Given I create my account via invitation, when my session is established, then I am authenticated with the same session security constraints as direct-register users (session timeout, HTTPS-only cookies)

**Open Questions:** None -- requirements are clear.
**Notes:** This story reuses the registration form component from direct signup but with the email field locked. Confirm with engineering that the invite token is validated server-side, not client-side.

---

#### Story 4: Connect First Integration During Onboarding
**Priority:** P0
**Estimate:** 8 points
**Depends on:** Story 1 (company profile must exist to associate the integration)

**As a** account admin completing onboarding,
**I want to** connect one of our supported integrations (CRM, helpdesk, or project management tool) during setup,
**So that** the product has live data to work with from day one, increasing the likelihood we see value in the first session.

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given I am on the Connect Integration step, when the page loads, then I see a list of the top 6 supported integrations with their logos, names, and a one-sentence description of what data they sync
- [ ] **[Happy Path]** Given I click "Connect" on an integration, when I complete the OAuth authorization flow in the third-party app, then I am returned to the onboarding flow with a success confirmation showing the integration name and a "Connected" status badge
- [ ] **[Alternative Path]** Given I do not use any of the listed integrations, when I click "Skip for now," then I advance to the completion step -- I can connect integrations from the Settings page after onboarding
- [ ] **[Error State]** Given I begin the OAuth flow, when I deny authorization in the third-party app, then I am returned to the integration selection step with the message: "Authorization was not granted. You can try again or connect a different tool."
- [ ] **[Error State]** Given I complete OAuth authorization, when the third-party system returns an error (expired token, permission scope mismatch), then I see a specific error message with a "Try again" action and a link to our help docs for that integration
- [ ] **[Performance]** Given I complete OAuth and am returned to the onboarding flow, when the success state loads, then the page renders within 2 seconds even if the initial data sync has not yet completed (sync runs asynchronously in the background)
- [ ] **[Security]** OAuth tokens are stored encrypted at rest; the admin's OAuth credentials are scoped to the minimum required permissions documented in our integration spec

**Open Questions:** Do we support all 6 integrations at MVP, or only 3? Product needs to confirm the integration launch set before this story can be estimated confidently -- current estimate assumes 3 integrations with existing OAuth library support.
**Notes:** If the integration set is not confirmed before sprint, recommend timebox spike (4 hours) to audit OAuth library support and confirm per-integration effort. This story may need to be split by integration type if complexity varies significantly.

---

#### Story 5: Complete Onboarding and Reach the Product Dashboard
**Priority:** P0
**Estimate:** 2 points
**Depends on:** Story 1 (profile required), Story 2 or Story 4 (at least one other step attempted)

**As a** new account admin who has completed the required onboarding steps,
**I want to** see a confirmation screen summarizing what I set up and navigate to the product dashboard,
**So that** I have a clear sense of completion and know where to go next without feeling abandoned mid-flow.

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given I have completed Step 1 (company profile) and attempted Steps 2 and 3 (invited team or connected an integration, or skipped them), when I reach the final step, then I see a summary screen listing what was completed with checkmarks and what was skipped
- [ ] **[Happy Path]** Given I am on the completion screen, when I click "Go to Dashboard," then I am redirected to the product's main dashboard and the onboarding wizard does not appear again
- [ ] **[Alternative Path]** Given I skipped one or more steps, when I view the completion screen, then I see a non-blocking prompt: "You can complete your setup anytime from Settings" with a link -- not a blocking error or a forced return to skipped steps
- [ ] **[Re-entry Prevention]** Given I have completed onboarding, when I log out and log back in, then I am taken directly to the dashboard -- not redirected to the onboarding wizard again
- [ ] **[Analytics]** When a user completes the final step, then a `onboarding_completed` event is fired with properties: `{ steps_completed: [], steps_skipped: [], total_time_seconds: number }` per the analytics instrumentation spec

**Open Questions:** None.
**Notes:** The `onboarding_completed` event is required by the growth team for activation rate tracking. Do not defer this criterion.

---

#### Story 6: Upload Company Logo During Profile Setup (P1)
**Priority:** P1
**Estimate:** 3 points
**Depends on:** Story 1

**As a** account admin who has already set up the company profile,
**I want to** upload a company logo image to the account,
**So that** the workspace feels branded for my team when they log in and on any customer-facing exports.

**Acceptance Criteria:**
- [ ] **[Happy Path]** Given I am on the Company Profile page, when I click "Upload Logo" and select a valid PNG or JPG file under 2MB, then the logo is uploaded, a preview is shown, and it appears in the product header for all company users within 5 seconds
- [ ] **[Validation]** Given I attempt to upload a file over 2MB, when I select the file, then I see: "File size must be under 2MB. Please resize your image and try again."
- [ ] **[Validation]** Given I attempt to upload a file type other than PNG or JPG (e.g., GIF, SVG, PDF), when I select the file, then I see: "Only PNG and JPG files are accepted."
- [ ] **[Alternative Path]** Given no logo has been uploaded, when any user views the product header, then a default avatar showing the company's initials (first two letters of company name) is displayed

**Open Questions:** Should we auto-crop to a square, or show a crop/resize interface? UX has not confirmed.
**Notes:** Image processing should be done server-side; do not store raw uploads in user-accessible storage without access controls.

---

### Backlog Summary Table

| Story # | Title                                          | Priority | Estimate  | Depends On       |
|---------|------------------------------------------------|----------|-----------|------------------|
| 1       | Set up company profile during onboarding       | P0       | 3 pts     | None             |
| 2       | Invite team members by email during onboarding | P0       | 5 pts     | Story 1          |
| 3       | Accept invitation and join workspace           | P0       | 3 pts     | Story 2          |
| 4       | Connect first integration during onboarding    | P0       | 8 pts     | Story 1          |
| 5       | Complete onboarding and reach dashboard        | P0       | 2 pts     | Story 1 + 2 or 4 |
| 6       | Upload company logo (P1)                       | P1       | 3 pts     | Story 1          |
| **Total P0** |                                           |          | **21 pts**|                  |
| **Total P1** |                                           |          | **3 pts** |                  |

**Sprint readiness note:** At 21 points for P0 stories, this is at the high end of a standard 2-week sprint velocity (typically 20-30 points for a 4-6 person team). Story 4 (integration connection, 8 points) should be the first candidate to defer to a second sprint if velocity does not support it -- the onboarding flow is still functional without it. Confirm with the team during planning.
