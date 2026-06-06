---
name: technical-specification
description: |
  Creates technical specification documents with problem statement, requirements,
  design proposal, trade-off analysis, and decision rationale. Use when the user
  needs to write a tech spec, design document, or RFC for a proposed system or
  feature. Do NOT use for ADRs (use `adr-writing`), user guides (use
  `user-guide`), or API documentation (use `api-documentation`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation guide"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Technical Specification Writing

## When to Use

- User needs to write a technical specification or design document for a proposed feature or system
- User asks for an RFC, tech spec, or engineering design doc
- User wants to document a technical approach with trade-offs and alternatives
- User needs to get buy-in for a technical decision before implementation
- Do NOT use when the user wants to record a decision already made (use `adr-writing` instead)
- Do NOT use when the user wants to document how to use existing software (use `user-guide` instead)
- Do NOT use when the user wants API endpoint documentation (use `api-documentation` instead)
- Do NOT use when the user wants a project proposal with budget and timeline (use `project-proposal` instead)

## Process

1. **Collect specification context.** Ask the user for:
   - What problem or opportunity this specification addresses
   - Who is affected by this problem (users, teams, systems)
   - Proposed solution at a high level
   - Alternative approaches considered
   - Constraints: timeline, budget, technology limitations, team capacity
   - Success metrics: how to measure whether the solution worked
   - Stakeholders who need to approve or review the spec

2. **Write the problem statement with evidence.** The problem section must:
   - State the problem in terms of user or business impact, not technical symptoms
   - Quantify the impact where possible (error rates, time wasted, revenue lost)
   - Describe who experiences the problem and how frequently
   - Distinguish between the root problem and its symptoms
   - Establish urgency: why solve this now rather than later

3. **Define requirements precisely.** Split into:
   - **Functional requirements:** What the system must do (stated as testable assertions)
   - **Non-functional requirements:** Performance targets, availability, scalability, security constraints
   - **Out of scope:** What this spec explicitly does not address (prevents scope creep during review)
   - Number every requirement so reviewers can reference them by ID

4. **Describe the proposed design.** For the solution:
   - Architecture overview: how components interact (describe a diagram -- boxes, arrows, data flow)
   - Data model: entities, relationships, and key fields
   - API contracts: endpoint signatures or function interfaces
   - Sequence flows: step-by-step interaction for the 2-3 most important user flows
   - State transitions: if the system has state, show the state machine

5. **Analyze trade-offs explicitly.** For each major design decision:
   - List 2-3 alternatives considered
   - Evaluate each against the requirements from step 3
   - State the trade-off: what you gain and what you sacrifice with each option
   - Explain why the chosen approach wins given the current constraints
   - Use a comparison table for complex decisions

6. **Address risks and mitigations.** Identify:
   - Technical risks: performance unknowns, integration complexity, data migration hazards
   - Operational risks: deployment complexity, rollback difficulty, monitoring gaps
   - For each risk: likelihood, impact, and specific mitigation strategy
   - Risks that remain unmitigated: state them transparently for stakeholders

7. **Define the implementation plan.** Outline:
   - Phases or milestones with deliverables for each
   - Dependencies between phases
   - Rollout strategy (feature flag, canary, blue-green, big bang)
   - Rollback plan: exact steps to revert if the deployment fails
   - Testing strategy: what is tested, how, and what coverage is needed

## Output Format

```
# Technical Specification: [Feature or System Name]

**Author:** [Name]
**Status:** Draft | In Review | Approved | Superseded
**Created:** [YYYY-MM-DD]
**Last updated:** [YYYY-MM-DD]
**Reviewers:** [Names or teams]

---

## 1. Problem Statement

[2-3 paragraphs describing the problem with quantified impact.]

**Who is affected:** [Users, teams, or systems impacted]
**Frequency:** [How often the problem occurs]
**Impact:** [Quantified business or user impact]

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | [System must do X when Y occurs] | Must |
| FR-2 | [System must support Z] | Must |
| FR-3 | [System should do W] | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Response time for [operation] | < [X]ms at p99 |
| NFR-2 | Availability | [X]% uptime |
| NFR-3 | Data retention | [X] days |

### 2.3 Out of Scope

- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

## 3. Proposed Design

### 3.1 Architecture Overview

[Description of the system architecture. Name each component, its responsibility,
and how it communicates with other components. Describe the diagram: boxes for
services, arrows for data flow, labels for protocols.]

### 3.2 Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| [Entity] | [field: type, field: type] | [has-many Entity2] |
| [Entity2] | [field: type, field: type] | [belongs-to Entity] |

### 3.3 API Design

**[Operation name]**

```
[METHOD] /[path]
Request: { [fields] }
Response: { [fields] }
```

### 3.4 Key Flows

**[Flow name]:**
1. [Actor] sends [request] to [component]
2. [Component] validates [what] and queries [where]
3. [Component] returns [response] to [actor]
4. [Actor] displays [result]

## 4. Alternatives Considered

| Criteria | Option A: [Name] | Option B: [Name] | Option C: [Name] |
|----------|-------------------|-------------------|-------------------|
| [Criterion 1] | [Evaluation] | [Evaluation] | [Evaluation] |
| [Criterion 2] | [Evaluation] | [Evaluation] | [Evaluation] |
| [Criterion 3] | [Evaluation] | [Evaluation] | [Evaluation] |
| **Verdict** | [Rejected: reason] | **Selected** | [Rejected: reason] |

## 5. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | Medium | High | [Specific mitigation steps] |
| [Risk 2] | Low | High | [Specific mitigation steps] |

## 6. Implementation Plan

### Phase 1: [Name] ([Timeline])
- [Deliverable 1]
- [Deliverable 2]

### Phase 2: [Name] ([Timeline])
- [Deliverable 3] (depends on Phase 1)
- [Deliverable 4]

**Rollout strategy:** [Feature flag / Canary / Blue-green / Big bang]

**Rollback plan:** [Exact steps to revert]

## 7. Success Metrics

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| [Metric 1] | [Baseline] | [Goal] | [How measured] |
| [Metric 2] | [Baseline] | [Goal] | [How measured] |

## 8. Open Questions

- [ ] [Question 1 that needs resolution before implementation]
- [ ] [Question 2]
```

## Rules

1. NEVER write a tech spec without a problem statement -- the spec must justify its own existence
2. NEVER present only one option -- always include at least 2 alternatives with trade-off analysis
3. NEVER leave requirements unnumbered -- reviewers must be able to reference specific requirements
4. NEVER describe the proposed design without defining success metrics that prove it works
5. ALWAYS quantify the problem impact with data or estimates
6. ALWAYS include an "Out of Scope" section to prevent scope creep
7. ALWAYS include a rollback plan in the implementation section
8. Risks must include likelihood, impact, and a specific mitigation -- not just "be careful"
9. Requirements must be testable assertions, not vague goals ("Response time < 200ms at p99" not "Fast responses")
10. State the spec status (Draft, In Review, Approved, Superseded) at the top so readers know the document's authority

## Edge Cases

- **Spec for a migration (not a new feature):** Replace the "Proposed Design" section with a "Migration Strategy" section covering: data migration steps, dual-write period, validation checks, cutover plan, and rollback triggers. Include a compatibility matrix showing which clients work with old vs. new systems.
- **Spec requiring cross-team collaboration:** Add a RACI matrix (Responsible, Accountable, Consulted, Informed) as a subsection of the implementation plan. List specific deliverables per team with dependencies between them.
- **Spec for a prototype or spike:** Shorten the format -- keep Problem Statement, Proposed Approach, and Success Criteria. Skip detailed data models and API designs. Define the spike's timebox and exit criteria (what the spike must answer).
- **Security-sensitive specification:** Add a dedicated Security Considerations section covering: threat model, authentication/authorization changes, data encryption requirements, audit logging, and compliance implications. Name specific threats and mitigations.
- **Spec that supersedes a previous spec:** Reference the superseded document by name and date. Summarize what changed and why the original approach is no longer viable. Keep the superseded spec available for historical context.
- **Very large spec (multiple systems):** Split into a parent spec (problem, requirements, architecture overview) and child specs (one per subsystem with detailed design). Parent spec defines interfaces between subsystems; child specs define internal implementation.

## Example

**Input:** "Write a tech spec for adding real-time notifications to our web app. Currently users have to refresh to see updates. We want WebSocket-based push notifications for mentions, task assignments, and status changes."

**Output:**

# Technical Specification: Real-Time Notifications

**Author:** Engineering Team
**Status:** Draft
**Created:** 2024-06-15
**Last updated:** 2024-06-15
**Reviewers:** Backend Team, Frontend Team, Infrastructure

---

## 1. Problem Statement

Users must manually refresh the application to see updates to their tasks, mentions, and status changes. In a team of 10, a user refreshes an average of 47 times per day to check for updates (based on analytics from the past 30 days). This creates a 15-second average delay between an event occurring and a user becoming aware of it, slowing collaboration and causing missed time-sensitive updates.

**Who is affected:** All active users (approximately 2,400 daily active)
**Frequency:** Users check for updates 47 times/day on average
**Impact:** 15-second average awareness delay; 12% of task assignments are seen more than 1 hour late

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | System must deliver notification to user within 2 seconds of triggering event | Must |
| FR-2 | System must support notification types: mention, task-assignment, status-change | Must |
| FR-3 | Users must be able to mark notifications as read individually or in bulk | Must |
| FR-4 | System must persist notifications for users who are offline and deliver on reconnect | Must |
| FR-5 | Users should be able to configure which notification types they receive | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | End-to-end notification latency | < 2 seconds at p99 |
| NFR-2 | WebSocket connection reliability | 99.9% uptime |
| NFR-3 | Concurrent connections supported | 5,000 per server instance |
| NFR-4 | Notification storage retention | 90 days |

### 2.3 Out of Scope

- Email or push notification delivery (mobile notifications are a separate spec)
- Notification grouping or digest summaries
- Admin-to-all broadcast notifications

## 3. Proposed Design

### 3.1 Architecture Overview

Three components: a Notification Service (produces events), a WebSocket Gateway (manages connections and delivers events), and a Notification Store (persists unread notifications in PostgreSQL).

When an event occurs (mention, assignment, status change), the source service publishes a message to a Redis Pub/Sub channel. The WebSocket Gateway subscribes to user-specific channels and pushes the message to connected clients. The Notification Store saves the event for offline users.

### 3.2 Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Notification | id: uuid, user_id: uuid, type: enum, payload: jsonb, read: boolean, created_at: timestamp | belongs-to User |
| NotificationPreference | user_id: uuid, type: enum, enabled: boolean | belongs-to User |

### 3.3 Key Flows

**User receives a real-time notification:**
1. Source service publishes event to Redis channel `notifications:{user_id}`
2. Notification Service writes the notification to PostgreSQL
3. WebSocket Gateway receives the Redis message and looks up active connection for `user_id`
4. Gateway sends JSON payload over WebSocket to the client
5. Client displays notification badge and toast message

## 4. Alternatives Considered

| Criteria | Option A: WebSocket + Redis Pub/Sub | Option B: Server-Sent Events (SSE) | Option C: Long Polling |
|----------|--------------------------------------|-------------------------------------|----------------------|
| Latency | Sub-second delivery | Sub-second delivery | 1-30 second delay (poll interval) |
| Bidirectional | Yes (read receipts over same connection) | No (requires separate POST for reads) | No |
| Browser support | All modern browsers | All modern browsers | All browsers |
| Infrastructure | Requires WebSocket-aware load balancer | Standard HTTP infrastructure | Standard HTTP infrastructure |
| Scalability | Horizontal with Redis | Horizontal with Redis | Higher server load per connection |
| **Verdict** | **Selected** | Rejected: no bidirectional support | Rejected: latency unacceptable |

## 5. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebSocket connections overwhelm server memory | Medium | High | Connection pooling with 5,000 cap per instance; horizontal scaling behind WebSocket-aware ALB |
| Redis Pub/Sub message loss during failover | Low | Medium | Write notifications to PostgreSQL before publishing to Redis; client fetches missed notifications on reconnect |
| Client reconnection storms after deployment | Medium | Medium | Implement exponential backoff with jitter on client reconnect logic |

## 6. Implementation Plan

### Phase 1: Backend Infrastructure (2 weeks)
- WebSocket Gateway service with Redis Pub/Sub subscription
- Notification Store with PostgreSQL schema and write path
- Health check and monitoring endpoints

### Phase 2: Client Integration (1 week)
- WebSocket client with auto-reconnect and backoff
- Notification UI component (badge count, dropdown list, toast)
- Mark-as-read API integration

### Phase 3: Notification Preferences (1 week)
- Preference storage and API
- Filtering in the Gateway before delivery

**Rollout strategy:** Feature flag (`notifications.realtime.enabled`) rolled out to 10% of users, then 50%, then 100% over 1 week.

**Rollback plan:** Disable the feature flag. Client falls back to polling. No data migration needed -- notifications are still stored in PostgreSQL.

## 7. Success Metrics

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| Average notification awareness delay | 15 seconds | < 2 seconds | Time between event creation and client acknowledgment |
| Daily page refreshes per user | 47 | < 10 | Analytics event tracking |
| Late task assignments (>1 hour) | 12% | < 2% | Task assignment timestamp vs. first-view timestamp |

## 8. Open Questions

- [ ] Should notifications be encrypted at rest in PostgreSQL?
- [ ] What is the maximum payload size for a single notification?
- [ ] Do we need WebSocket authentication refresh, or is the initial handshake token sufficient?
