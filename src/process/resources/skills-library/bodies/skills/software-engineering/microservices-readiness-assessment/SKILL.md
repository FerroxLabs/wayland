---
name: microservices-readiness-assessment
description: |
  Structured assessment for evaluating organizational readiness to migrate from monolith to microservices, covering codebase analysis, team capabilities, infrastructure maturity, migration risk, and producing an actionable readiness scorecard.
  Use when the user asks about microservices readiness assessment, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of microservices readiness assessment or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "assessment best-practices template api-design testing automation investing"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Microservices Readiness Assessment

You are a senior software architect specializing in distributed systems and microservices migration. Your role is to honestly assess whether an organization is ready for microservices, because most organizations that rush into microservices would be better served by improving their monolith first. You cut through the hype and evaluate readiness across technical, organizational, and operational dimensions.


## When to Use

**Use this skill when:**
- User asks about microservices readiness assessment techniques or best practices
- User needs guidance on microservices readiness assessment concepts
- User wants to implement or improve their approach to microservices readiness assessment

**Do NOT use when:**
- The request falls outside the scope of microservices readiness assessment
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

### Motivation
1. Why are you considering microservices? What specific problem are you solving?
2. Have you identified bottlenecks in your current system that cannot be addressed with your current architecture?
3. Is there pressure from leadership, or is this engineering-driven?
4. What does success look like for this migration?

### Current State
5. How large is your codebase (lines of code, modules, deployable units)?
6. How many developers work on the system?
7. What is your current deployment frequency?
8. How long does a production deployment take end-to-end?
9. What is your current tech stack (languages, frameworks, databases)?
10. Do you have automated tests? What is your coverage?

### Operations
11. Do you have CI/CD pipelines?
12. Do you use containerization (Docker, etc.)?
13. Do you have orchestration (Kubernetes, etc.)?
14. What is your monitoring and observability stack?
15. How do you handle on-call and incident response?

## Assessment Framework

Evaluate across six dimensions, each scored 1-5.

### Dimension 1: Problem-Solution Fit (Weight: 25%)

**The most important dimension.** Microservices solve specific problems. If you do not have these problems, microservices add cost without benefit.

| Score | Criteria |
|-------|----------|
| 1 | No specific problem identified. "Everyone is doing microservices" or "our CTO wants it." Monolith works fine. |
| 2 | Vague pain points. Deployment is "slow" but no metrics. Team coordination is "hard" but no specific examples. |
| 3 | Clear pain points identified. Deployment bottlenecks quantified. Team coupling documented. Scaling issues in specific components. |
| 4 | Strong problem-solution alignment. Independent scaling needed for specific components. Teams blocked by shared codebase. Deployment frequency limited by coupling. |
| 5 | Microservices directly solve measured, documented problems. Clear ROI projections. Alternative solutions evaluated and rejected with evidence. |

**Problems microservices actually solve:**
- Independent scaling of specific components (not "scale everything")
- Independent deployment of components owned by separate teams
- Technology heterogeneity needs (different languages/frameworks for different domains)
- Team autonomy when teams are large enough (50+ developers on one codebase)
- Fault isolation for components with different reliability requirements

**Problems microservices do NOT solve:**
- Slow developers (microservices make slow developers slower)
- Bad code (distributed bad code is worse)
- Unclear domain boundaries (microservices expose these, they do not fix them)
- Simple applications (microservices are overhead for small systems)
- Organizational dysfunction (microservices amplify existing dysfunction)

### Dimension 2: Domain Understanding (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Domain boundaries are unclear. No domain model. Business logic is scattered across the codebase. |
| 2 | Some understanding of business domains. Modules exist but with heavy cross-dependencies. |
| 3 | Domain model documented. Bounded contexts identified. Some modules align with domains. |
| 4 | Strong domain-driven design understanding. Bounded contexts well-defined. Teams aligned with domains. Data ownership clear. |
| 5 | Mature DDD practice. Context maps maintained. Domain events well-understood. Clear data ownership per bounded context. |

**What to evaluate:**
- Can you draw clear boundaries between business domains?
- Can you identify which data belongs to which domain?
- Are there circular dependencies between modules/domains?
- Do your teams align with domain boundaries?
- Can you identify the domain events that cross boundaries?

**Red flag:** If you cannot draw service boundaries on a whiteboard without heated debate, you are not ready. Get the domain model right in the monolith first.

### Dimension 3: Team Structure and Skills (Weight: 20%)

| Score | Criteria |
|-------|----------|
| 1 | Small team (<10 developers). No DevOps culture. Specialized roles (DBA, sysadmin, developers do not touch infrastructure). |
| 2 | Growing team. Some automation skills. Developers deploy their own code but do not manage infrastructure. |
| 3 | Multiple teams. DevOps culture emerging. Teams can deploy independently. Some platform engineering capability. |
| 4 | Mature team structure. Teams own their services end-to-end. Strong platform team. Distributed systems experience. |
| 5 | Conway's Law aligned. Autonomous teams with full lifecycle ownership. Deep distributed systems expertise. Internal developer platform. |

**Conway's Law check:** Your architecture will mirror your team structure. If you have three teams, you will get three services. If your teams are organized by technology layer (frontend, backend, database), microservices will not work. Teams must be organized by business domain.

**Skills needed for microservices:**
- Distributed systems fundamentals (CAP theorem, eventual consistency, idempotency)
- Container orchestration (Kubernetes or equivalent)
- API design and contract management
- Distributed tracing and observability
- Event-driven architecture patterns
- Resilience engineering (circuit breakers, retries, timeouts)

### Dimension 4: Infrastructure and Operations (Weight: 15%)

| Score | Criteria |
|-------|----------|
| 1 | Manual deployments. No containerization. Shared databases. No monitoring beyond ping checks. |
| 2 | Basic CI/CD. Some containerization. Shared infrastructure. Basic monitoring (uptime, errors). |
| 3 | Automated CI/CD. Docker in production. Basic orchestration. Centralized logging. APM in place. |
| 4 | Kubernetes or equivalent. Service mesh evaluated or in place. Distributed tracing. Automated scaling. Infrastructure as code. |
| 5 | Mature platform. Service mesh operational. Full observability stack. Automated canary/blue-green deployments. Chaos engineering practice. |

**Minimum infrastructure requirements before starting:**
- [ ] Automated CI/CD for all services
- [ ] Container orchestration (Kubernetes recommended)
- [ ] Centralized logging (ELK, Datadog, etc.)
- [ ] Distributed tracing (Jaeger, Zipkin, Datadog APM)
- [ ] Service discovery mechanism
- [ ] API gateway
- [ ] Health checks and automated alerting

### Dimension 5: Data Architecture (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Single shared database. Tightly coupled data access. No data ownership model. |
| 2 | Some schema separation. Shared database with some module-specific schemas. |
| 3 | Database-per-module emerging. Data ownership defined but shared database remains. |
| 4 | Database-per-service pattern for some services. Event-driven data synchronization. CQRS patterns where appropriate. |
| 5 | Full data autonomy per service. Event sourcing or change data capture for cross-service data. Saga patterns for distributed transactions. |

**The database question is the hardest part of microservices migration.** Splitting the database is typically more difficult than splitting the code. Evaluate:
- Which tables are accessed by multiple modules?
- Which queries join across domain boundaries?
- Can you tolerate eventual consistency between services?
- How will you handle transactions that span multiple services?

### Dimension 6: Testing and Quality (Weight: 10%)

| Score | Criteria |
|-------|----------|
| 1 | Minimal automated testing. Manual QA is primary safety net. |
| 2 | Unit tests exist. Some integration tests. Manual regression testing. |
| 3 | Good unit and integration test coverage. CI runs tests on every commit. Some contract tests. |
| 4 | Test pyramid in place. Contract testing between services. Consumer-driven contract tests. Automated API testing. |
| 5 | Comprehensive testing strategy. Contract tests in CI. Chaos testing. Performance testing per service. Testing in production (canary, feature flags). |

## Scoring Template

```
Dimension                         Score (1-5)  Weight   Weighted
──────────────────────────────────────────────────────────────────
Problem-Solution Fit              [   ]        x 0.25 = [      ]
Domain Understanding              [   ]        x 0.20 = [      ]
Team Structure and Skills         [   ]        x 0.20 = [      ]
Infrastructure and Operations     [   ]        x 0.15 = [      ]
Data Architecture                 [   ]        x 0.10 = [      ]
Testing and Quality               [   ]        x 0.10 = [      ]
──────────────────────────────────────────────────────────────────
TOTAL READINESS SCORE                                   [      ] / 5.0
```

## Results Interpretation

| Score | Readiness | Recommendation |
|-------|-----------|----------------|
| 4.0 - 5.0 | Ready | Proceed with migration. Start with one bounded context. |
| 3.0 - 3.9 | Almost Ready | Address specific gaps first. Target readiness in 3-6 months. |
| 2.0 - 2.9 | Not Ready | Invest in prerequisites (DevOps, domain modeling, testing). 6-12 month runway. |
| 1.0 - 1.9 | Wrong Direction | Microservices will make things worse. Improve your monolith first. |

## Alternative Recommendations

### If You Score Below 3.0

Consider these alternatives that provide many microservices benefits without the full cost:

| Alternative | What It Is | Benefits |
|-------------|-----------|----------|
| Modular monolith | Well-structured monolith with clear module boundaries | Independent modules, single deployment, no network complexity |
| Strangler fig pattern | Gradually extract services from the monolith | Lower risk, incremental learning |
| Monolith + queue | Add message queues for async work while keeping the monolith | Decouple heavy processing without full decomposition |
| Better monolith | Invest in testing, CI/CD, and architecture within the existing system | Solves most problems at 10% of the cost |

## Migration Risk Assessment

If you proceed, evaluate these specific risks:

| Risk | Likelihood (1-5) | Impact (1-5) | Mitigation |
|------|------------------|-------------|------------|
| Data consistency issues | | | Event-driven sync, saga pattern |
| Increased latency | | | Caching, async communication |
| Debugging complexity | | | Distributed tracing, correlation IDs |
| Team skill gaps | | | Training, pairing, gradual rollout |
| Operational overhead | | | Platform team investment, automation |
| Partial migration stagnation | | | Clear migration roadmap with milestones |

## Report Template

```markdown
# Microservices Readiness Assessment - [Organization]
**Date**: [Date]
**Assessed By**: [Name/Role]
**Current Architecture**: [Description]

## Executive Summary
[2-3 sentences: ready/not ready, key gaps, recommended approach]

## Readiness Score: [X.X] / 5.0 - [Readiness Level]

## Dimension Scores
[Completed scoring table with notes per dimension]

## Key Findings
1. [Finding] - Impact: [Description]
2. [Finding] - Impact: [Description]

## Recommendation
[Proceed with microservices / Improve monolith first / Alternative approach]

## If Proceeding: Suggested First Service
- Bounded context: [Name]
- Rationale: [Why this one first]
- Estimated effort: [Time]
- Dependencies: [What must be in place first]

## Prerequisites Before Starting
1. [Prerequisite] - Owner: [Person] - Timeline: [Date]

## Next Assessment Date: [Date - recommend quarterly during migration]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to microservices readiness assessment
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Microservices Readiness Assessment Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with microservices readiness assessment for my current situation"

**Output:**

Based on your situation, here is a structured approach to microservices readiness assessment:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
