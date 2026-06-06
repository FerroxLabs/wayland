---
name: adr-writing
description: |
  Creates Architecture Decision Records in standard ADR format with title,
  status, context, decision, and consequences sections. Use when the user needs
  to document an architectural or technical decision, write an ADR, or record
  why a technology choice was made. Do NOT use for technical specifications (use
  `technical-specification`), meeting notes (use `meeting-notes`), or general
  documentation (use `internal-wiki-page`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation writing"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# ADR Writing

## When to Use

Use this skill when the user needs to create, refine, or review an Architecture Decision Record (ADR) -- a short, structured document that captures a significant architectural or technical choice, the context surrounding it, and its consequences.

**Trigger scenarios:**

- The user explicitly asks to "write an ADR," "create a decision record," or "document this architectural decision"
- The user has just made a technology selection (e.g., "we picked Kafka over RabbitMQ") and needs it recorded
- The user needs to capture a structural pattern choice (e.g., adopting hexagonal architecture, event sourcing, CQRS)
- The user wants to document a negative decision -- a deliberate choice NOT to adopt a technology or approach
- The user is retroactively formalizing a decision that was already implemented but never documented
- The user needs to supersede a previous ADR because the original constraints no longer apply
- The user is bootstrapping an ADR log for a new project and needs the first few records written
- The user made a decision under emergency conditions and needs to record it with a follow-up review plan

**Do NOT use this skill when:**

- The user wants a full design document with sequence diagrams, API contracts, or system interfaces -- use `technical-specification` instead
- The user wants to compare options without committing to a choice -- that is comparative analysis, not an ADR; use `options-analysis` instead
- The user wants to record what happened in a meeting -- use `meeting-notes` instead
- The user wants general internal documentation such as runbooks, how-to guides, or onboarding pages -- use `internal-wiki-page` instead
- The user needs a Request for Comments (RFC) process to gather feedback before a decision -- an ADR records a decision already made or proposed, not a discussion forum
- The user wants a technical post-mortem -- that is incident documentation, not architectural decision recording

---

## Process

### Step 1 -- Gather the decision context

Before writing a single word of the ADR, extract the following information from the user. If the user has not provided all of it, ask for the missing pieces directly.

- **The decision itself:** What exactly was chosen? Force the user to state it in one sentence. Vague inputs like "we decided on a new architecture" need to be sharpened to "we will decompose the monolith into three bounded-context services."
- **The problem or need:** What situation required a decision? What was failing, scaling, or creating risk?
- **Constraints and forces:** Timeline pressure, budget ceiling, team size and skill set, existing infrastructure, compliance requirements, organizational mandates. These are the forces that made some options impossible or expensive.
- **Alternatives that were genuinely considered:** At minimum two alternatives. If the user says "we only looked at one option," push back -- ADRs without alternatives appear to be mandates, not decisions.
- **Decision makers:** Individuals or roles who made or ratified the decision. Even informal decisions have an owner.
- **Date:** When was this decided? For retroactive ADRs, this is the original date, not today.
- **Consequences the user already anticipates:** Both the benefits they are counting on and the costs they are accepting.

### Step 2 -- Determine the ADR number and status

ADR numbering must be sequential within the project's ADR log. Use the following logic:

- If the user is starting a new log, begin at ADR-001.
- If the user references prior ADRs, ask for the last number used and increment by one.
- If multiple ADRs are being written in one session, increment sequentially: ADR-012, ADR-013, ADR-014.
- Status values and their precise meanings:
  - **Proposed** -- the decision is drafted and under review; not yet binding
  - **Accepted** -- the decision is ratified and governs the system going forward
  - **Deprecated** -- the decision once applied but is no longer relevant; the system may still reflect it
  - **Superseded** -- the decision has been formally replaced by a newer ADR; reference the superseding ADR number
- Most ADRs written in real-time are "Accepted." Use "Proposed" only when the user explicitly says the decision is still under review or needs sign-off.

### Step 3 -- Write the Context section

The Context section is the hardest to write correctly. It must present the situation without arguing for the outcome.

- Open with the concrete technical or business problem: "The authentication service processes 40,000 session lookups per minute, consuming 60% of the PostgreSQL connection pool."
- Identify the forces in play. A force is any constraint or pressure that shapes the decision space: performance SLAs, team skill gaps, vendor lock-in concerns, compliance mandates (GDPR, SOC 2, HIPAA), budget, existing infrastructure, migration costs.
- Use specific numbers wherever available: latency thresholds, user counts, data volumes, team headcount, budget figures, compliance deadlines.
- Write in past or present tense describing the situation -- not future tense describing the solution.
- Aim for 2-4 paragraphs. A single paragraph is usually too thin. More than 5 paragraphs usually signals scope creep -- split into two ADRs.
- A good litmus test: could a new engineer joining the team in 12 months read this context and understand the pressures, without being told what decision was made?
- Do NOT include phrases like "therefore we chose" or "this is why we selected" in the Context section -- that reasoning belongs in the Decision section.

### Step 4 -- Write the Decision section

The Decision section is short and precise. It answers: "What did we decide, and why is this the right choice given the forces described?"

- Lead with a single declarative sentence in active voice, present tense: "We will use [X] for [purpose]."
- Never use passive constructions: "It was decided to use X" or "X was selected" are forbidden.
- The sentence must name the specific artifact of the decision: a technology, a pattern, an API contract style, a deployment model, a coding standard. Avoid abstraction in this sentence.
- Follow the lead sentence with 2-4 sentences of rationale that connect the decision to the forces in the Context. This is not a re-statement of the context -- it is the explicit reasoning chain: "We chose X over Y because X satisfies the sub-millisecond read requirement while Y introduces a token blacklist that reintroduces server-side state."
- If the context already makes the choice obvious, the rationale can be one sentence.
- Reference alternatives by name: "We chose X over Y and Z because..."

### Step 5 -- Write the Consequences section

The Consequences section is the most valuable long-term artifact of the ADR. It captures what the team knowingly accepted.

- Organize into three subsections: **Positive**, **Negative**, and **Neutral**.
- Every ADR must have at least one negative consequence. A decision with no downsides is not a decision -- it is an obvious move that did not need documentation.
- Positive consequences: frame as capabilities gained or problems solved. "Session lookups drop from 12ms to < 1ms, removing the primary bottleneck from the authentication hot path."
- Negative consequences: frame as costs accepted or risks introduced. Be specific about magnitude where possible: "Adds a Redis cluster as a hard dependency for authentication -- any Redis outage makes login impossible for all users."
- Neutral consequences: changes that are real but neither clearly beneficial nor harmful -- migration work, format changes, monitoring tool changes, updated runbooks.
- Operational consequences must be included: what new infrastructure needs monitoring, what on-call procedures change, what CI/CD pipeline adjustments are required.
- Avoid vague consequences like "improves performance" or "adds complexity." Prefer "reduces p99 authentication latency from 45ms to 8ms" and "requires the on-call team to learn Redis SLOWLOG analysis."

### Step 6 -- Write the Alternatives Considered section

This section prevents the ADR from looking like a rationalization after the fact. It demonstrates genuine evaluation.

- Include every option that was seriously evaluated -- typically 2-4 alternatives.
- For each alternative: name it, describe it in 1-2 sentences, state the specific reason it was rejected.
- Rejection reasons must connect to the forces in the Context. "We rejected PostgreSQL full-text search because our 80ms p99 latency budget cannot tolerate the query plan cost on a 50M-row documents table."
- If an alternative was rejected for cost, state the cost difference.
- If an alternative was rejected due to team skill gaps, say so explicitly -- that is a legitimate force.
- Do NOT dismiss alternatives with vague phrases like "too complex" or "not suitable." Explain what made them unsuitable for this specific context.

### Step 7 -- Write Related Decisions and finalize metadata

Link the ADR to its ecosystem:

- Reference any ADRs that this decision depends on: "ADR-008: Use Redis for Caching -- provides the cluster this decision builds on."
- Reference any ADRs this decision supersedes or conflicts with.
- Reference any ADRs that will be affected downstream.
- Relationship types to use explicitly: "depends on," "supersedes," "is superseded by," "conflicts with," "enables," "is enabled by."
- Finalize all metadata: number, title, status, date, decision makers.
- Title format: starts with an action verb or technology name. Good examples: "Use Kafka for Event Streaming," "Adopt Hexagonal Architecture for the Payments Service," "Do Not Migrate to GraphQL." Bad examples: "Database Decision," "Architecture Discussion," "New Approach."

### Step 8 -- Validate the ADR before delivery

Run through this checklist before presenting the final output:

- Context does not contain solution language or argue for the decision
- Decision section opens with "We will [specific choice]" in one sentence
- At least one negative consequence is listed with concrete specificity
- At least two alternatives are named with their rejection reasons
- ADR number is sequential and status is correct
- Title starts with an action verb or technology name
- Decision makers are named (at minimum a role if not individual names)
- Date is present and in YYYY-MM-DD format
- If superseding an ADR, both the old ADR's status update and the new ADR's reference are noted
- A new team member could read the ADR and understand both what was decided and why, without any additional context

---

## Output Format

```markdown
# ADR-[NNN]: [Decision Title -- Action Verb or Technology Name First]

**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-NNN]
**Date:** [YYYY-MM-DD]
**Decision makers:** [Full names or roles -- e.g., "Backend Lead, Platform Architect, CTO"]

---

## Context

[Paragraph 1: The concrete technical or business problem. Include specific numbers:
request rates, latency figures, data volumes, team size, compliance deadlines.]

[Paragraph 2: The forces shaping the decision space. What constraints made some options
impossible or expensive? What capabilities did the team already have? What requirements
were non-negotiable?]

[Paragraph 3 (if needed): Additional background -- existing system state, prior decisions
that bounded the solution space, organizational constraints.]

---

## Decision

We will [specific choice stated in one sentence, naming the exact technology,
pattern, or approach].

[2-4 sentences of rationale connecting the decision to the forces. Explicitly names
the alternatives that were rejected and the force that ruled them out. Example:
"We chose X over Y because Y requires a token blacklist that reintroduces server-side
state, defeating the statelessness goal stated in the Context."]

---

## Consequences

### Positive

- [Specific capability gained or problem solved, with numbers where available]
- [Specific capability gained or problem solved]
- [Operational benefit -- e.g., leverages existing team expertise or infrastructure]

### Negative

- [Specific cost or risk accepted, with magnitude where known]
- [New dependency introduced and what happens if it fails]
- [Migration or rework cost -- estimate effort in person-days or sprint count if known]

### Neutral

- [Real change that is neither clearly beneficial nor harmful -- e.g., tooling change,
  format migration, updated runbooks]
- [Shift in team responsibility or process that has no clear valence]

---

## Alternatives Considered

### [Alternative 1 Name]

[1-2 sentences describing the alternative and precisely why it was rejected, connected
to a specific force from the Context section.]

### [Alternative 2 Name]

[1-2 sentences describing the alternative and precisely why it was rejected.]

### [Alternative 3 Name -- if applicable]

[1-2 sentences describing the alternative and precisely why it was rejected.]

---

## Related Decisions

| ADR | Title | Relationship |
|-----|-------|-------------|
| ADR-NNN | [Title] | [depends on / supersedes / enables / conflicts with] |
| ADR-NNN | [Title] | [relationship] |

*(Omit this section if there are no related decisions.)*

---

## Notes

*(Optional. Use for time-bounded flags: "Re-evaluate by 2025-Q2 when vendor pricing
tier changes." Or validation plans for Proposed ADRs: "Accept this ADR if load testing
shows p99 < 10ms under 5,000 concurrent users." Omit if not needed.)*
```

---

## Rules

1. **Context must be solution-neutral.** The Context section presents forces and constraints -- it does not argue for the decision. If the context reads like a press release for the chosen option, rewrite it to include the forces that made the unchosen alternatives viable candidates too.

2. **Decision section opens with exactly one declarative sentence.** "We will use [X] for [Y]." If the user's stated decision is too vague to fit in one sentence, ask for clarification before writing. A decision that cannot be stated in one sentence is not yet a decision.

3. **Never use passive voice in the Decision section.** "It was decided," "X was selected," and "the team agreed on" are all forbidden. Active voice ("We will") makes ownership clear and reads as a commitment.

4. **Every ADR must contain at least one concrete negative consequence.** A document with only positive consequences is marketing copy, not an ADR. If the user insists there are no downsides, probe harder: every architectural choice forecloses other options, introduces new dependencies, increases operational complexity, or requires skill acquisition.

5. **Consequences must include operational reality.** Does this decision change what the on-call team monitors? Does it add a new stateful component? Does it change deployment procedures? Architectural decisions live in production, and the consequences section must reflect that.

6. **Alternatives must be rejected for specific reasons tied to the Context.** "Too complex" and "not a good fit" are not acceptable rejection reasons. The rejection must name the specific force from the Context that disqualified the alternative.

7. **One decision per ADR.** If the user describes two decisions (e.g., "we chose Kafka AND we chose to use Avro for serialization"), these are two separate ADRs. Avro serialization may depend on the Kafka ADR, but it is its own choice with its own alternatives and consequences.

8. **ADR titles start with the decision, not a description of the topic.** "Use PostgreSQL for the Orders Service" is correct. "Database Selection for Orders" is a category heading, not an ADR title. The title must state what was decided.

9. **Numbers beat adjectives in consequences.** "Reduces query latency" is weak. "Reduces p99 query latency from 45ms to 4ms based on load test results from 2024-10-12" is strong. Push for real numbers: migration row counts, request rates, team headcount, cost changes, timeline estimates.

10. **Status must be accurate.** An ADR describing a decision that the entire team has already implemented and deployed is "Accepted," not "Proposed." "Proposed" is reserved for decisions still under review. Mis-stating status destroys trust in the ADR log because future readers will not know which decisions are binding.

11. **Supersession requires two document updates.** When an ADR supersedes a prior one, both the old ADR (status updated to "Superseded by ADR-NNN") and the new ADR (references the old one in Related Decisions) must be noted. Flag this explicitly to the user so they update the old file.

12. **Retroactive ADRs are legitimate but must be labeled.** A retroactive ADR documents a real decision and has full historical value. It must note in the Context or Notes section that it is a retroactive record: "This ADR documents a decision made on [date] that was not formally recorded at the time." Write the context and consequences as they were understood at decision time, not with post-hoc hindsight.

---

## Edge Cases

### Decision to NOT adopt a technology or approach

Some of the most valuable ADRs document a deliberate rejection. Title these with "Do Not": "ADR-019: Do Not Adopt GraphQL for the Public API." The Context explains why the option was seriously considered -- what problem it was proposed to solve and why it seemed attractive. The Decision states the choice to retain or continue the current approach. The Consequences section includes the ongoing limitations accepted by not adopting the option (e.g., "REST clients cannot request partial responses; over-fetching remains a problem for mobile clients").

These ADRs prevent "why didn't we use X?" discussions every six months by proving the team evaluated the option with full information.

### Emergency decision made under incident conditions

When a decision was made during a production incident, the ADR must reflect the constraint honestly. In the Context, state the incident and timeline explicitly: "During the P0 outage on 2024-11-03, the team had 90 minutes to choose a mitigation strategy before the next deployment window." In the Negative consequences, include a mandatory follow-up: "This decision was made under time pressure without full evaluation of alternatives. The team must re-evaluate this choice under normal conditions by [specific date, typically 2-4 weeks out] and supersede this ADR if a better option is found." Set status to "Accepted" only if the decision is binding for now, but include the re-evaluation flag clearly.

### Decision made by a distributed team with dissenting views

If team members disagreed on the choice, the dissenting perspective must be reflected in the Context or Alternatives sections -- without attributing it to individuals. Example: "A subset of the team argued that the operational cost of maintaining a separate Redis cluster outweighs the latency benefit, and recommended accepting higher database latency in exchange for reduced infrastructure complexity. This view did not prevail because..." This preserves the reasoning for future readers and prevents the dissenting engineers from feeling their concerns were erased. Never record names alongside dissenting views; record the argument, not the person.

### ADR spanning a gradual migration (not a single event)

Some architectural decisions are not a single event but a direction: "migrate from a monolith to bounded-context services over 18 months." These are valid ADRs but require a specific handling in Consequences. The Neutral section should include the migration plan as a high-level sequence of steps, and the Notes section should include specific checkpoints: "Review migration progress at ADR-031 when the Payments bounded context is extracted (target: 2025-Q1)." The ADR documents the direction and principles, not the implementation schedule. Implementation milestones belong in a project plan or separate technical specification.

### Proposed ADR awaiting validation from load testing or PoC

When a decision is proposed but depends on the outcome of a performance test, security review, or proof-of-concept, set status to "Proposed" and add a **Validation Plan** subsection under Consequences. The Validation Plan must specify: what will be measured, what threshold constitutes success, when the test will be completed, and who is responsible for updating the ADR to "Accepted" or "Rejected" based on results. Example: "This ADR will be accepted if the Redis-backed session load test demonstrates p99 < 5ms under 10,000 concurrent users in the staging environment. Load test to be completed by 2025-01-15. Backend Lead is responsible for updating status."

### ADR for an infrastructure or platform-level decision affecting multiple teams

When a decision affects more than one team -- for example, "Adopt OpenTelemetry as the observability standard across all services" -- the decision makers field must include representatives from all affected teams. The Context section must explicitly name the teams and services affected. The Consequences section should include per-team impacts, not just platform-level impacts. These ADRs often benefit from a pre-publication review period before status is set to "Accepted." In the Notes section, flag the review window: "This ADR will remain in Proposed status until 2025-02-01 to allow all three backend teams to review and raise objections."

### ADR that references external standards or regulations

When a decision is driven by a compliance requirement (SOC 2, GDPR, HIPAA, PCI-DSS, FedRAMP), the Context must name the specific control or regulation clause that creates the force. Do not write "for compliance reasons." Write "to satisfy SOC 2 Type II CC6.1 (Logical and Physical Access Controls), session tokens must be revocable within 15 minutes of a credential change." This makes the ADR a durable audit artifact and prevents future teams from questioning the constraint. In these cases, the Negative consequences may include: "Audit evidence must be maintained demonstrating this control is in place; the DevOps team is responsible for log retention configuration."

---

## Example

**Input from user:** "We need an ADR for our decision to adopt event sourcing for the Order Management Service. We were getting pressure to add more auditing and reporting capabilities, our current approach of storing only current state was losing historical data, and rebuilding read models was impossible. We considered just adding audit logging to the existing CRUD approach and also considered CQRS without event sourcing. We went with full event sourcing. The decision was made last week by our backend architect, the product lead, and the CTO. The downside we know about is the learning curve and operational complexity."

**Output:**

```markdown
# ADR-017: Adopt Event Sourcing for the Order Management Service

**Status:** Accepted
**Date:** 2024-11-18
**Decision makers:** Backend Architect, Product Lead, CTO

---

## Context

The Order Management Service currently persists only the current state of each order
using a CRUD model against a PostgreSQL database. As the business has grown to process
12,000 orders per day, two critical gaps have emerged.

First, the finance and compliance teams require a complete, immutable audit trail of
every state transition an order passes through -- from creation through fulfillment,
cancellation, or dispute. The current model overwrites previous state on every update,
making it impossible to reconstruct what an order looked like at any point in its
history. Producing the audit reports required for the upcoming SOC 2 Type II assessment
(deadline: 2025-Q1) requires replaying state changes that have already been discarded.

Second, the product team needs to build three new reporting features -- order funnel
analysis, SLA breach detection, and refund root-cause attribution -- each of which
requires historical event data the current schema cannot provide. Engineering estimated
that instrumenting the existing CRUD service with sufficient audit logging to support
these reports would take 6-8 weeks and still not produce a replayable event stream.

The engineering team has 8 backend engineers, two of whom have production experience
with event sourcing on a prior project. The team operates on AWS and already uses
PostgreSQL as the event store candidate.

---

## Decision

We will adopt event sourcing for the Order Management Service, storing all order
state changes as an append-only sequence of domain events in a PostgreSQL event
store table, with projections rebuilt from the event stream on demand.

We chose event sourcing over audit logging added to the existing CRUD model because
audit logging produces a parallel record that can fall out of sync with application
state -- it does not eliminate the root problem of discarded history. We chose event
sourcing over CQRS without event sourcing because CQRS alone produces separate read
and write models but does not provide the replayable event stream required for
retrospective reporting and SOC 2 audit compliance.

---

## Consequences

### Positive

- Complete, immutable audit trail for every order state transition, satisfying SOC 2
  Type II CC3.4 (Change Management) and the finance team's reporting requirements
  without additional instrumentation
- Retrospective reporting is now possible: any read model can be rebuilt by replaying
  the event stream from the beginning, enabling the three planned product features
  (funnel analysis, SLA detection, refund attribution) without schema migrations
- Temporal queries become trivial: reconstruct the exact state of any order at any
  point in time by replaying events up to a given timestamp
- Event stream is directly publishable to downstream consumers (analytics pipeline,
  notification service) via outbox pattern, eliminating the need for database polling

### Negative

- Eventual consistency in read models: projections may lag the event stream by up to
  500ms under normal load, requiring the UI team to handle stale-read scenarios for
  order status displays
- Operational complexity increases: the team must operate and monitor both the event
  store and projection storage, manage event schema versioning as the domain evolves,
  and handle projection rebuilds (estimated 45 minutes for a full rebuild of the
  orders_current projection over 18 months of history at current volume)
- Six of eight backend engineers have no prior event sourcing experience; the team
  will require approximately 3-4 weeks of ramp-up before the first production release,
  factored into the Q1 delivery timeline
- Event schema changes must be handled through upcasting or versioned event types --
  this discipline is unfamiliar to the team and will require code review standards
  and tooling (an event schema registry) to enforce correctly
- Debugging production issues becomes more complex: reconstructing order state
  requires replaying a chain of events rather than reading a single row

### Neutral

- Order state is no longer stored as a mutable row; the orders table is replaced by
  an events table (order_id, sequence_number, event_type, payload JSONB, occurred_at)
  and a projection table (orders_current) rebuilt from the stream
- The existing 230,000 orders in the CRUD store must be migrated: each will be
  represented as a synthetic OrderCreated event plus one OrderStateSnapshotted event
  capturing current state -- migration estimated at 4 hours of engineering time
- On-call runbooks for the Order Management Service must be updated to include
  projection rebuild procedures and event store monitoring queries

---

## Alternatives Considered

### Append-only audit log alongside existing CRUD model

Add a separate audit_log table recording every field change on every order update,
keeping the existing CRUD model as the primary store. Rejected because this produces
a secondary record that is dependent on the application correctly writing to both
stores -- any bug or deployment failure creates divergence between current state and
audit history. It also does not produce a replayable event stream with domain
semantics, meaning the three planned reporting features would still require
custom ETL rather than projection queries.

### CQRS without event sourcing

Separate read and write models using CQRS, with the write model remaining CRUD and
the read models synchronized via change data capture (CDC) from PostgreSQL. Rejected
because CDC-based synchronization from a CRUD write model still discards history --
the CDC stream captures row-level changes, not domain events, so historical order
states cannot be reconstructed semantically. This approach would satisfy the reporting
requirements but not the SOC 2 audit trail requirement, which demands domain-level
event semantics (OrderCancelled, not orders.status = 'cancelled').

### Migrate to a dedicated event sourcing platform (EventStoreDB)

Adopt EventStoreDB as a purpose-built event store replacing PostgreSQL for order
persistence. Rejected because the team has no operational experience with EventStoreDB,
the platform team does not support it as a managed service, and introducing a new
stateful database technology adds infrastructure risk for a Q1 deadline. PostgreSQL
with an append-only events table and advisory locks provides sufficient throughput
for the current 12,000 orders/day volume and allows the team to leverage existing
operational expertise. This decision should be revisited if order volume exceeds
500,000/day or if projection rebuild time exceeds 4 hours.

---

## Related Decisions

| ADR | Title | Relationship |
|-----|-------|-------------|
| ADR-004 | Use PostgreSQL as the Primary Persistence Store | This ADR depends on ADR-004; the event store is implemented as a PostgreSQL table |
| ADR-021 | Adopt Outbox Pattern for Event Publishing | Enabled by this ADR; event sourcing makes the outbox pattern natural |
| ADR-009 | Use CQRS for the Inventory Service | Architectural sibling; the Order Service now uses a stronger form of CQRS |

---

## Notes

The team's lack of event sourcing experience represents the primary delivery risk.
The Backend Architect will run two internal workshops on event schema design and
upcasting patterns before the first sprint begins. An event schema registry decision
(ADR-022, Proposed) must be accepted before the first event type is merged to main.

Re-evaluate the decision to use PostgreSQL as the event store (vs. EventStoreDB or
a cloud-native alternative) when order volume reaches 500,000/day or when projection
rebuild time exceeds 4 hours -- whichever comes first.
```
