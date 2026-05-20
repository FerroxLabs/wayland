---
name: service-catalog-builder
description: |
  Internal service catalog design expertise covering service registry architecture, ownership metadata, SLO/SLI definition, dependency mapping and visualization, API documentation aggregation, automated catalog population from infrastructure, and self-service developer portal implementation using Backstage or custom solutions.
  Use when the user asks about service catalog builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of service catalog builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud budgeting template typescript api-design automation analysis"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Service Catalog Builder

You are an expert platform engineer specializing in building internal service catalogs that give developers a single pane of glass for discovering, understanding, and managing services across the organization. You design catalogs that stay current through automation and become the foundation for developer self-service.


## When to Use

**Use this skill when:**
- User asks about service catalog builder techniques or best practices
- User needs guidance on service catalog builder concepts
- User wants to implement or improve their approach to service catalog builder

**Do NOT use when:**
- The request falls outside the scope of service catalog builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Organization size:** How many services, teams, and developers?
2. **Current state:** Do you have any service registry today, or starting from scratch?
3. **Tech stack:** What languages, frameworks, and infrastructure (K8s, AWS, GCP)?
4. **Primary pain point:** Service discovery, ownership clarity, dependency visibility, or onboarding speed?
5. **Tooling preference:** Backstage (CNCF), Port, OpsLevel, custom-built, or undecided?
6. **Integration needs:** What systems should feed into the catalog (CI/CD, monitoring, incident management)?

---

## Service Catalog Architecture

### Core Data Model

```yaml
# catalog-info.yaml (Backstage format - industry standard)
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: payment-service
  description: Handles payment processing, refunds, and invoicing
  annotations:
    github.com/project-slug: myorg/payment-service
    pagerduty.com/service-id: PXXXXXX
    grafana/dashboard-url: [external resource]
    sonarqube.org/project-key: payment-service
  tags:
    - payments
    - java
    - critical
  links:
    - url: [external resource]
      title: Documentation
    - url: [external resource]
      title: Runbooks
spec:
  type: service
  lifecycle: production
  owner: team-payments
  system: commerce-platform
  providesApis:
    - payment-api
  consumesApis:
    - user-api
    - notification-api
  dependsOn:
    - resource:payments-db
    - resource:payment-queue
```

### Entity Types

```
Component (a service, library, or website)
  type: service | library | website | documentation
  lifecycle: experimental | production | deprecated
  owner: team reference
  system: logical grouping

System (logical group of components)
  owner: team reference
  domain: business domain

API (interface provided by a component)
  type: openapi | grpc | asyncapi | graphql
  lifecycle: experimental | production | deprecated
  definition: inline or reference to spec file

Resource (infrastructure dependency)
  type: database | storage | queue | cdn
  owner: team reference

Group (organizational unit - team)
  type: team | department | sub-department
  parent: parent group
  members: list of users

User (individual person)
  memberOf: groups
  profile information
```

---

## Ownership Model

### Ownership Definition

```
Every entity MUST have an owner. No exceptions.

Owner Responsibilities:
  - Respond to incidents within SLA
  - Review and merge PRs
  - Keep documentation current
  - Maintain SLOs and address violations
  - Handle security vulnerability patches
  - Plan deprecation and migration when needed

Ownership Types:
  - Primary Owner: Team responsible for service lifecycle
  - Steward: Individual point of contact within the team
  - Escalation: Manager or leadership for unresolved issues
```

### Orphaned Service Detection

```yaml
# GitHub Action to detect services without owners
name: Catalog Health Check
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday 9 AM

jobs:
  check-ownership:
    runs-on: ubuntu-latest
    steps:
      - name: Check all services have active owners
        run: |
          echo "Querying catalog API for all components"
          echo "Cross-referencing owners with active teams"
          echo "Flagging services where owner team dissolved or < 2 members"
```

---

## SLO/SLI Definition

### SLO Template per Service

```yaml
# slo.yaml (referenced from catalog-info.yaml)
service: payment-service
slos:
  - name: Availability
    description: Payment API returns successful responses
    sli:
      type: availability
      good_events: "http_status < 500"
      total_events: "all requests"
      measurement: prometheus
      query: >
        sum(rate(http_requests_total{service="payment",status!~"5.."}[5m]))
        / sum(rate(http_requests_total{service="payment"}[5m]))
    objective: 99.95%
    window: 30d
    burn_rate_alerts:
      - severity: critical
        short_window: 5m
        long_window: 1h
        factor: 14.4
      - severity: warning
        short_window: 30m
        long_window: 6h
        factor: 6

  - name: Latency
    description: Payment API responds within acceptable time
    sli:
      type: latency
      threshold: 500ms
      percentile: p99
    objective: 99%
    window: 30d

  - name: Correctness
    description: Payment amounts match between request and ledger
    sli:
      type: correctness
    objective: 99.99%
    window: 30d
```

### SLO Dashboard Integration

```
Catalog SLO Status Display:

  payment-service                    Owner: Payments
  ──────────────────────────────────────────────────
  Availability  99.97% ████████████████████░ 99.95%
  Latency (p99) 99.2%  ████████████████████░ 99%
  Correctness   99.99% ████████████████████░ 99.99%
  Error Budget: 12.4 minutes remaining (30d window)
  ──────────────────────────────────────────────────
  Dependencies: user-api (ok)  notification-api (ok)
  Last Deploy: 2025-03-15  |  On-call: @alice
```

---

## Dependency Mapping

### Automated Dependency Discovery

```
Data Sources for Dependency Detection:
  - Service mesh (Istio/Linkerd): Network-level call graphs
  - Distributed tracing (Jaeger/Tempo): Request-level dependencies
  - DNS/service discovery: Which services resolve which names
  - Kubernetes: Service to Pod to Container relationships
  - Infrastructure as Code: Terraform references
  - Code analysis: Import statements, API client references
  - API gateway: Route to service mappings
```

### Dependency Visualization

```
Catalog should show:
1. Direct dependencies (what this service calls)
2. Reverse dependencies (what calls this service)
3. Transitive dependencies (full dependency tree)
4. Dependency health (are dependencies healthy?)

Visualization formats:
- Graph view (nodes and edges)
- Table view (sortable, filterable)
- Impact analysis view (what breaks if this goes down?)
```

---

## Backstage Implementation

### Getting Started

```shell
# Create Backstage app
npx @backstage/create-app@latest

# Key configuration files
# app-config.yaml         - Main configuration
# catalog-info.yaml       - Per-repo entity definitions
# app-config.production.yaml  - Production supersedes
```

### Auto-Discovery Configuration

```yaml
# app-config.yaml
catalog:
  # Scan all repos in the organization for catalog-info.yaml
  providers:
    github:
      myOrgProvider:
        organization: 'my-org'
        catalogPath: '/catalog-info.yaml'
        filters:
          repository: '.*'
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
```

### Custom Catalog Processors

```typescript
// Enrich catalog entities with live data from your systems
import { CatalogProcessor } from '@backstage/plugin-catalog-node';

export class SloEnrichmentProcessor implements CatalogProcessor {
  getProcessorName() { return 'SloEnrichmentProcessor'; }

  async postProcessEntity(entity, _location, emit) {
    if (entity.kind === 'Component' && entity.spec?.type === 'service') {
      const serviceName = entity.metadata.name;
      const sloData = await this.fetchSloStatus(serviceName);

      // Add SLO annotations
      entity.metadata.annotations = {
        ...entity.metadata.annotations,
        'slo/availability': sloData.availability.toString(),
        'slo/error-budget-remaining': sloData.errorBudget.toString(),
      };
    }
    return entity;
  }
}
```

---

## Keeping the Catalog Fresh

### Scorecard System

```
Service Maturity Scorecard:

  Criteria                         | Score (0-100)
  ---------------------------------|-------------
  Has catalog-info.yaml            | 10
  Has valid owner                  | 15
  Has description > 20 chars       | 5
  Has API spec (OpenAPI/gRPC)      | 10
  Has TechDocs published           | 10
  Has SLOs defined                 | 15
  Has runbooks linked              | 10
  Has PagerDuty integration        | 10
  Has CI/CD pipeline               | 10
  Has dependencies documented      | 5
  ---------------------------------|-------------
  Minimum for production           | 70

Enforcement:
- Block production deploys below score 70
- Weekly report to team leads for services below 50
- Gamification: leaderboard of team catalog scores
```

### Automated Staleness Detection

```yaml
# Check catalog freshness weekly
checks:
  - name: Documentation freshness
    condition: last_techdocs_update > 90 days
    action: Notify owner team
    severity: warning

  - name: Owner team exists
    condition: owner team has < 2 active members
    action: Flag for platform team review
    severity: critical

  - name: Dependency accuracy
    condition: declared dependencies != observed (from traces)
    action: Open PR to update catalog-info.yaml
    severity: info

  - name: API spec matches implementation
    condition: OpenAPI spec date < last code change to routes
    action: Notify owner, suggest spec update
    severity: warning
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to service catalog builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Service Catalog Builder Analysis

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

**Input:** "Help me with service catalog builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to service catalog builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
