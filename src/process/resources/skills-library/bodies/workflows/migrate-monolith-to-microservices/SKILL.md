---
name: migrate-monolith-to-microservices
description: >-
  Systematic workflow for decomposing a monolithic application into
  microservices using the strangler fig pattern. Covers domain analysis, service
  extraction, inter-service communication, data ownership migration, deployment
  strategies, and the organizational changes needed to support a distributed
  architecture.

  Use when the user wants to migrate monolith to microservices or needs a
  structured multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  domain-driven-designer microservices-architect api-designer database-architect
  event-driven-architect docker-engineer kubernetes-operator cicd-architect
  monitoring-engineer contract-tester resilience-engineer tech-debt-analyzer
trigger_phrases: >-
  I want to break up my monolith I need to migrate to microservices How do I
  extract services from my monolith I want to decompose my application
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: microservices architecture step-by-step planning
  category: software-project
  depends: >-
    domain-driven-designer microservices-architect api-designer
    database-architect event-driven-architect docker-engineer
    kubernetes-operator cicd-architect monitoring-engineer contract-tester
    resilience-engineer tech-debt-analyzer
  disclaimer: none
  difficulty: advanced
---
# Migrate Monolith To Microservices

**Estimated time:** 3-12 months

Migrating from a monolith to microservices is one of the highest-risk, highest-reward architectural transformations a team can undertake. Done well, it unlocks independent deployability, team autonomy, and technology flexibility. Done poorly, it creates a "distributed monolith" that is harder to operate than what you started with.

This workflow uses the strangler fig pattern: rather than a risky big-bang rewrite, you incrementally extract services from the monolith, routing traffic through a facade. Each extraction follows a disciplined sequence of domain analysis, boundary definition, data migration, service implementation, and cutover. The monolith shrinks over time until only the facade remains.

## When to Use

- User wants to migrate monolith to microservices
- User needs a structured, step-by-step process for migrate monolith to microservices
- User wants to break up my monolith
- I need to migrate to microservices
- How do I extract services from my monolith
- Do NOT use when: the request is outside the scope of migrate monolith to microservices or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A running monolithic application with production traffic
- Access to application source code and database schemas
- Monitoring and logging infrastructure (or willingness to build it first)
- Team alignment on the motivation for migration (scalability, team autonomy, deployment speed)
- Executive sponsorship -- this is a multi-month investment
- At least one team member with distributed systems experience

## Steps

**Step 1: Assess the Monolith and Identify Domains** (uses: domain-driven-designer)

run event storming sessions with domain experts. Map bounded contexts by analyzing code dependencies, database table relationships, and team ownership boundaries. Use the Tech Debt Analyzer skill to identify areas of high coupling and technical debt that will complicate extraction. Produce a domain map showing potential service boundaries.

- Input: Application source code and architecture diagrams, Database schema and entity relationships, Business domain knowledge from product and engineering teams
- Output: Bounded context map with domain boundaries, Event storming results (commands, events, aggregates), Dependency graph (code-level and data-level)
- Key focus: Use the Domain-Driven Designer skill to run event storming sessions with domain experts

**Step 2: Define the Migration Strategy and Sequence** (uses: microservices-architect)

prioritize which bounded contexts to extract first. Apply the strangler fig pattern: start with a low-risk, high-value domain that has clear boundaries and minimal data sharing. Define the facade layer (API gateway or reverse proxy) that will route traffic between the monolith and new services. Create a migration roadmap with phases, each extracting one service.

- Input: Bounded context map from Step 1, Business priorities (which domains change most frequently), Risk tolerance and deployment maturity
- Output: Prioritized extraction sequence with rationale, Strangler fig facade architecture design, Migration roadmap with phases and milestones
- Key focus: Use the Microservices Architect skill to prioritize which bounded contexts to extract first

**Step 3: Design Inter-Service Communication** (uses: api-designer)

define synchronous APIs between services (REST or gRPC). Use the Event-Driven Architect skill to design asynchronous communication for eventual consistency scenarios. Define event schemas, choose a message broker, and establish contracts. Design for failure: every synchronous call must have timeout, retry, and circuit breaker patterns.

- Input: Service boundary definitions from Steps 1-2, Synchronous vs asynchronous communication needs, Consistency requirements between services
- Output: API contracts (OpenAPI specs) for synchronous communication, Event schemas and topic/queue definitions, Communication pattern decision matrix (sync vs async per interaction)
- Key focus: Use the API Designer skill to define synchronous APIs between services (REST or gRPC)

**Step 4: Extract the First Service** (uses: microservices-architect)

implement the strangler fig extraction. First, create the new service alongside the monolith. Implement the service's API and business logic. Use the Database Architect skill to design the data migration: start with the "database per service" goal but use a transitional pattern (shared database with schema separation, or CDC-based sync) during migration. Route traffic through the facade, starting with read operations, then writes.

- Input: First service candidate from Step 2, Database tables owned by this domain, API contracts from Step 3
- Output: New service codebase with API implementation, Database migration scripts (schema and data), Facade routing configuration
- Key focus: Use the Microservices Architect skill to implement the strangler fig extraction

**Step 5: Set Up Deployment Infrastructure** (uses: docker-engineer)

containerize the extracted service with production-ready Dockerfiles (multi-stage builds, non-root users, health checks). Use the Kubernetes Operator skill to define deployment manifests (or Helm charts) with proper resource limits, readiness probes, and horizontal pod autoscaling. Use the CI/CD Architect skill to create independent deployment pipelines so the new service can be deployed without touching the monolith.

- Input: New service from Step 4, Existing deployment infrastructure, Team's container and orchestration experience
- Output: Dockerfile with multi-stage build, Kubernetes manifests or Helm chart, CI/CD pipeline for independent service deployment
- Key focus: Use the Docker Engineer skill to containerize the extracted service with production-ready Dockerfiles (multi-stage builds, non-root users, health checks)

**Step 6: Implement Observability** (uses: monitoring-engineer)

instrument the service with the three pillars of observability: metrics (latency, error rate, throughput), structured logs with correlation IDs, and distributed traces that span the monolith-to-service boundary. Set up dashboards and alerts. This is critical -- you cannot safely operate microservices without observability.

- Input: Deployed service from Step 5, SLIs/SLOs for the service, Existing monitoring stack
- Output: Service metrics dashboard (latency p50/p95/p99, error rate, throughput), Distributed tracing configuration (correlation IDs across service boundary), Structured logging with consistent format
- Key focus: Use the Monitoring Engineer skill to instrument the service with the three pillars of observability: metrics (latency, error rate, throughput), structured logs with correlation IDs, and distributed traces that span the monolith-to-service boundary

**Step 7: Validate with Contract Tests** (uses: contract-tester)

implement consumer-driven contract tests that verify the service meets its API contracts. Use the Resilience Engineer skill to test failure scenarios: what happens when the service is down, slow, or returning errors? Verify the facade correctly falls back to the monolith during failures.

- Input: API contracts from Step 3, Deployed service from Step 5, Known failure modes
- Output: Contract test suite (Pact or similar), Resilience test scenarios and results, Fallback behavior documentation
- Key focus: Use the Contract Tester skill to implement consumer-driven contract tests that verify the service meets its API contracts

**Step 8: Cut Over and Decommission Monolith Code** (uses: microservices-architect)

Execute the full cutover: route all traffic (reads and writes) for the extracted domain through the new service. Monitor closely for the first 48 hours. Once stable, remove the extracted domain's code from the monolith and clean up the shared database tables. This is the "fig" completing its strangling of that branch. Document lessons learned and apply them to the next extraction.

- Input: Validated service from Steps 6-7, Production traffic patterns, Stakeholder approval for cutover
- Output: Cutover runbook with step-by-step procedures, Rollback procedure tested in staging, Monolith code removal commit
- Key focus: Execute the full cutover: route all traffic (reads and writes) for the extracted domain through the new service

**Step 9: Iterate for Remaining Services** (uses: microservices-architect)

Repeat Steps 3-8 for each subsequent service extraction. Each iteration should be faster as the team builds muscle memory and reusable infrastructure (Helm chart templates, CI/CD pipelines, observability patterns). Revisit the extraction sequence periodically -- priorities may shift as you learn more about the domain boundaries.

- Input: Lessons learned from first extraction, Updated migration roadmap, Next service candidate from Step 2
- Output: Updated migration roadmap reflecting progress, Reusable templates for service extraction, Cross-service integration test suite
- Key focus: Repeat Steps 3-8 for each subsequent service extraction

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Invest more time in domain analysis; consider module boundaries within the monolith instead
  - If **After Step 4**: Debug discrepancies; do not proceed with data inconsistencies
  - If **After Step 7**: Fix failures; do not cut over with known issues
  - If **After Step 8**: Investigate instability before extracting more services

## Failure Handling

- **Extracting too many services too fast:** -- Start with one, prove the pattern, then accelerate. Premature parallelization creates chaos.
- **Ignoring data ownership:** -- Shared databases between services create distributed monoliths. Each service must own its data, even if that means eventual consistency.
- **No strangler fig facade:** -- Big-bang cutovers are high-risk. The facade lets you incrementally shift traffic and roll back safely.
- **Skipping observability:** -- You cannot debug distributed systems with printf. Invest in tracing, metrics, and logs before cutting over.
- **Nano-services:** -- Not everything needs to be its own service. If two domains always change together and are owned by the same team, keep them together.

## Expected Outcome

When this workflow is complete, the user will have:

1. Each extracted service can be deployed independently in under 15 minutes
2. Inter-service latency stays within defined SLOs (typically < 50ms p99 for sync calls)
3. Team deployment frequency increases measurably after extraction
4. No data loss or consistency issues during any extraction
5. Monolith codebase shrinks measurably with each extraction phase
6. Teams can develop and deploy their services without coordinating with other teams

## Output Format

```
MIGRATE MONOLITH TO MICROSERVICES TRACKER
========================================

[ ] Step 1: Assess the Monolith and Identify Domains
    Status: [pending/in-progress/complete]
[ ] Step 2: Define the Migration Strategy and Sequence
    Status: [pending/in-progress/complete]
[ ] Step 3: Design Inter-Service Communication
    Status: [pending/in-progress/complete]
[ ] Step 4: Extract the First Service
    Status: [pending/in-progress/complete]
[ ] Step 5: Set Up Deployment Infrastructure
    Status: [pending/in-progress/complete]
[ ] Step 6: Implement Observability
    Status: [pending/in-progress/complete]
[ ] Step 7: Validate with Contract Tests
    Status: [pending/in-progress/complete]
[ ] Step 8: Cut Over and Decommission Monolith Code
    Status: [pending/in-progress/complete]
[ ] Step 9: Iterate for Remaining Services
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Extracting too many services too fast:** -- Start with one, prove the pattern, then accelerate. Premature parallelization creates chaos.
- **Ignoring data ownership:** -- Shared databases between services create distributed monoliths. Each service must own its data, even if that means eventual consistency.
- **No strangler fig facade:** -- Big-bang cutovers are high-risk. The facade lets you incrementally shift traffic and roll back safely.
- **Skipping observability:** -- You cannot debug distributed systems with printf. Invest in tracing, metrics, and logs before cutting over.

## Example

**Input:** "I want to migrate monolith to microservices and need a structured plan to follow step by step."

**Output:**

**Step 1 (domain-driven-designer-tech-debt-analyzer):** Assess the Monolith and Identify Domains -- produces concrete deliverables for this phase.

**Step 2 (microservices-architect):** Define the Migration Strategy and Sequence -- produces concrete deliverables for this phase.

**Step 3 (api-designer-event-driven-architect):** Design Inter-Service Communication -- produces concrete deliverables for this phase.

**Step 4 (microservices-architect-database-architect):** Extract the First Service -- produces concrete deliverables for this phase.

**Step 5 (docker-engineer-kubernetes-operator-cicd-architect):** Set Up Deployment Infrastructure -- produces concrete deliverables for this phase.

**Step 6 (monitoring-engineer):** Implement Observability -- produces concrete deliverables for this phase.

**Step 7 (contract-tester-resilience-engineer):** Validate with Contract Tests -- produces concrete deliverables for this phase.

**Step 8 (microservices-architect):** Cut Over and Decommission Monolith Code -- produces concrete deliverables for this phase.

**Step 9 (microservices-architect-domain-driven-designer):** Iterate for Remaining Services -- produces concrete deliverables for this phase.

**Result:** User has a complete migrate monolith to microservices plan with all deliverables produced, validated, and ready for implementation.
