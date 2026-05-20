---
name: developer-portal-builder
description: |
  Design and implement internal developer portals with service catalogs, service discovery, templates, and self-service workflows using Backstage patterns
  Use when the user asks about developer portal builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of developer portal builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud template guide api-design automation analysis time-management"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Developer Portal Builder

You are a developer portal architect who helps organizations build internal developer portals that unify service catalogs, documentation, templates, and self-service workflows. You guide through portal design, service discovery, template systems, and adoption strategies.


## When to Use

**Use this skill when:**
- User asks about developer portal builder techniques or best practices
- User needs guidance on developer portal builder concepts
- User wants to implement or improve their approach to developer portal builder

**Do NOT use when:**
- The request falls outside the scope of developer portal builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Portal Architecture

### Core Components

```
Developer Portal
    │
    ├── Service Catalog
    │   ├── Service registry and metadata
    │   ├── Ownership and team mapping
    │   ├── Dependency visualization
    │   └── Health and status dashboards
    │
    ├── Software Templates
    │   ├── Project scaffolding
    │   ├── CI/CD pipeline templates
    │   ├── Infrastructure provisioning
    │   └── Documentation starters
    │
    ├── TechDocs
    │   ├── Unified documentation site
    │   ├── Docs-as-code integration
    │   ├── Search across all services
    │   └── Auto-generated API references
    │
    ├── Search and Discovery
    │   ├── Full-text search across catalog
    │   ├── Tag-based filtering
    │   ├── Relationship exploration
    │   └── "Who owns this?" lookup
    │
    └── Plugins/Integrations
        ├── CI/CD status
        ├── Monitoring dashboards
        ├── Cost tracking
        └── Security scanning results
```

### Service Catalog Schema

```yaml
# catalog-info.yaml - placed in each service repository
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: user-service
  description: Manages user accounts, authentication, and profiles
  annotations:
    github.com/project-slug: org/user-service
    pagerduty.com/service-id: PXXXXXX
    grafana/dashboard-selector: "service=user-service"
    sonarqube.org/project-key: org_user-service
  tags:
    - java
    - spring-boot
    - core
  links:
    - url: [external resource]
      title: Wiki
    - url: [external resource]
      title: Dashboard
spec:
  type: service
  lifecycle: production
  owner: team-identity
  system: user-management
  providesApis:
    - user-api
  consumesApis:
    - email-api
    - notification-api
  dependsOn:
    - resource:user-database
    - component:auth-library
```

### Entity Kinds Reference

| Kind | Purpose | Examples |
|------|---------|---------|
| Component | Software (service, library, website) | user-service, auth-library |
| API | Interface definition | user-api (OpenAPI, gRPC, GraphQL) |
| Resource | Infrastructure dependency | user-database, redis-cache |
| System | Collection of related components | user-management, payments |
| Domain | Business area grouping | commerce, identity, platform |
| Group | Team or organizational unit | team-identity, team-payments |
| User | Individual person | jane.smith |
| Template | Software scaffolding | spring-boot-service, react-app |
| Location | Source of catalog data | catalog file URL or directory |

## Software Templates

### Template Definition

```yaml
# template.yaml - Service scaffolding template
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: spring-boot-service
  title: Spring Boot Microservice
  description: |
    Creates a new Spring Boot microservice with CI/CD,
    monitoring, and deployment configuration included.
  tags:
    - java
    - spring-boot
    - recommended
spec:
  owner: team-platform
  type: service

  parameters:
    - title: Service Information
      required:
        - name
        - description
        - owner
      properties:
        name:
          title: Service Name
          type: string
          pattern: '^[a-z][a-z0-9-]*$'
          description: Lowercase with hyphens only
        description:
          title: Description
          type: string
          maxLength: 200
        owner:
          title: Owner Team
          type: string
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: Group

    - title: Technical Options
      properties:
        javaVersion:
          title: Java Version
          type: string
          enum: ['17', '21']
          default: '21'
        database:
          title: Database
          type: string
          enum: ['postgresql', 'mysql', 'none']
          default: 'postgresql'
        includeKafka:
          title: Include Kafka Integration
          type: boolean
          default: false

    - title: Repository Settings
      required:
        - repoUrl
      properties:
        repoUrl:
          title: Repository Location
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com

  steps:
    - id: retrieve
      name: Retrieve Template
      action: retrieve:template
      input:
        url: ./skeleton
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}
          javaVersion: ${{ parameters.javaVersion }}
          database: ${{ parameters.database }}

    - id: publish
      name: Publish to GitHub
      action: publish:github
      input:
        allowedHosts: ['github.com']
        repoUrl: ${{ parameters.repoUrl }}
        description: ${{ parameters.description }}
        defaultBranch: main
        protectDefaultBranch: true

    - id: register
      name: Register in Catalog
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml

  output:
    links:
      - title: Repository
        url: ${{ steps.publish.output.remoteUrl }}
      - title: Open in Catalog
        icon: catalog
        entityRef: ${{ steps.register.output.entityRef }}
```

### Template Skeleton Structure

```
skeleton/
  ├── catalog-info.yaml          # Auto-registered in portal
  ├── README.md                  # Pre-populated documentation
  ├── .github/
  │   └── workflows/
  │       ├── ci.yml             # CI pipeline
  │       └── deploy.yml         # CD pipeline
  ├── Dockerfile                 # Container build
  ├── docker-compose.yml         # Local development
  ├── src/
  │   └── main/java/...         # Application code
  ├── terraform/                 # Infrastructure as code
  │   ├── main.tf
  │   └── variables.tf
  ├── k8s/                      # Kubernetes manifests
  │   ├── deployment.yaml
  │   └── service.yaml
  ├── docs/                     # TechDocs source
  │   ├── index.md
  │   └── architecture.md
  └── mkdocs.yml                # Documentation config
```

## Service Discovery

### Discovery Methods

| Method | How It Works | Pros | Cons |
|--------|-------------|------|------|
| Manual Registration | Teams add catalog-info.yaml | Full control | Requires discipline |
| GitHub Discovery | Scan org repos for catalog files | Automatic | Needs consistent file placement |
| API Discovery | Scan API gateways and registries | Real-time | Complex setup |
| Infrastructure Discovery | Scan cloud resources | Comprehensive | Noisy, needs filtering |

### GitHub Auto-Discovery Configuration

```yaml
# app-config.yaml
catalog:
  providers:
    github:
      myOrg:
        organization: 'my-org'
        catalogPath: '/catalog-info.yaml'
        filters:
          branch: 'main'
          repository: '.*'
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
  rules:
    - allow: [Component, API, Resource, System, Domain, Group]
```

### Service Dependency Mapping

```yaml
# Explicit dependency declaration in catalog-info.yaml
spec:
  dependsOn:
    - component:auth-service       # Runtime dependency
    - resource:postgres-primary    # Database dependency
    - component:shared-library     # Build dependency
  providesApis:
    - user-rest-api                # APIs this exposes
    - user-grpc-api
  consumesApis:
    - notification-api             # APIs this calls
    - billing-api
```

### Dependency Visualization Queries

```
Service Map Questions the Portal Should Answer:

1. What does service X depend on?
   → Show upstream dependencies

2. What depends on service X?
   → Show downstream consumers

3. What would break if service X goes down?
   → Transitive dependency analysis

4. Who owns the services I depend on?
   → Owner resolution across dependencies

5. What APIs are available for my use case?
   → API catalog with search and filtering

6. Is there an existing service that does X?
   → Full-text search across catalog metadata
```

## TechDocs Integration

### Documentation-as-Code Setup

```yaml
# mkdocs.yml in each service repository
site_name: User Service
nav:
  - Home: index.md
  - Architecture: architecture.md
  - API Reference: api.md
  - Runbook: runbook.md
  - ADRs:
    - Overview: adrs/index.md
    - ADR-001 Database Choice: adrs/001-database.md

plugins:
  - techdocs-core

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences
  - pymdownx.tabbed
```

### Documentation Standards Enforcement

```yaml
# CI check for documentation completeness
name: Docs Check
on: [pull_request]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check required docs exist
        run: |
          REQUIRED_FILES=(
            "docs/index.md"
            "docs/architecture.md"
            "docs/runbook.md"
            "catalog-info.yaml"
            "mkdocs.yml"
          )
          MISSING=0
          for file in "${REQUIRED_FILES[@]}"; do
            if [ ! -f "$file" ]; then
              echo "MISSING: $file"
              MISSING=1
            fi
          done
          exit $MISSING
      - name: Build docs
        run: |
          install the package via pip mkdocs-techdocs-core
          mkdocs build --strict
```

## Portal Adoption Strategy

### Adoption Phases

```
Phase 1: Foundation (Months 1-2)
  - Deploy portal with basic service catalog
  - Register 10-20 pilot services manually
  - Onboard 2-3 early adopter teams
  - Gather feedback on core experience

Phase 2: Value Demonstration (Months 3-4)
  - Add software templates for common patterns
  - Enable TechDocs for pilot services
  - Integrate CI/CD status and monitoring links
  - Show measurable time savings

Phase 3: Broad Adoption (Months 5-8)
  - Enable auto-discovery across GitHub org
  - Mandate catalog-info.yaml for new services
  - Roll out to all engineering teams
  - Add plugins for organizational tools

Phase 4: Platform Maturity (Months 9-12)
  - Self-service infrastructure provisioning
  - Custom plugins for internal tools
  - Full dependency and cost visibility
  - Portal becomes the starting point for all dev work
```

### Adoption Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Catalog coverage | > 90% of services registered | Registered vs known services |
| Template usage | > 80% of new services use templates | Template runs vs new repos |
| Documentation coverage | > 70% of services have TechDocs | Services with mkdocs.yml |
| Weekly active users | > 50% of engineering | Portal login analytics |
| Time to first commit (new service) | < 30 minutes | Template to first PR time |
| "Who owns this?" resolution time | < 1 minute | Survey or time tracking |

### Handling Resistance

| Objection | Response |
|-----------|----------|
| "Another tool to maintain" | Catalog file is 20 lines; templates save hours |
| "My team has its own wiki" | Portal aggregates all wikis in one searchable place |
| "We already know who owns what" | New team members and on-call rotations need discovery |
| "Too much overhead" | Auto-discovery minimizes manual work after initial setup |
| "Our services are too custom" | Templates are starting points; customization is encouraged |

## Plugin Development

### Common Plugin Categories

```
Essential Plugins:
  - CI/CD status (GitHub Actions, Jenkins, CircleCI)
  - Monitoring (Grafana, Datadog, New Relic)
  - Incident management (PagerDuty, OpsGenie)
  - Cost tracking (cloud billing dashboards)
  - Security scanning (Snyk, SonarQube)

Productivity Plugins:
  - Service scaffolding (software templates)
  - Documentation (TechDocs)
  - API documentation (Swagger/OpenAPI viewer)
  - Search (unified search across all data)

Governance Plugins:
  - Tech radar (technology choices visualization)
  - Scorecards (service maturity assessment)
  - Compliance checks (policy enforcement)
  - License tracking (dependency license audit)
```

### Service Scorecard Framework

```yaml
# Scorecard definition
scorecards:
  production-readiness:
    title: Production Readiness
    checks:
      - id: has-owner
        name: Has defined owner
        query: metadata.annotations['team'] exists
        weight: 10
      - id: has-description
        name: Has description
        query: metadata.description length > 20
        weight: 5
      - id: has-runbook
        name: Has runbook documentation
        query: docs/runbook.md exists
        weight: 15
      - id: has-monitoring
        name: Has monitoring configured
        query: metadata.annotations['grafana/dashboard'] exists
        weight: 20
      - id: has-alerting
        name: Has alerting configured
        query: metadata.annotations['pagerduty.com/service-id'] exists
        weight: 20
      - id: has-ci
        name: Has CI pipeline
        query: .github/workflows/ci.yml exists
        weight: 15
      - id: recent-deploy
        name: Deployed in last 30 days
        query: last_deploy_date > now - 30d
        weight: 15

    grades:
      - grade: A
        range: [90, 100]
      - grade: B
        range: [75, 89]
      - grade: C
        range: [60, 74]
      - grade: D
        range: [0, 59]
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to developer portal builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Developer Portal Builder Analysis

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

**Input:** "Help me with developer portal builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to developer portal builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
