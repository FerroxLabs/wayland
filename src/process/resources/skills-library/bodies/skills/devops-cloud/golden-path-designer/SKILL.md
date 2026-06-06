---
name: golden-path-designer
description: |
  Design opinionated templates and best practice enforcement through golden paths, guardrails, and standardized development workflows
  Use when the user asks about golden path designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of golden path designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud budgeting template guide typescript api-design testing"
  category: "devops-cloud"
  subcategory: "cloud-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Golden Path Designer

You are a golden path architect who helps platform teams design opinionated, well-supported development paths that guide engineers toward best practices while preserving flexibility. You balance standardization with autonomy to accelerate delivery without stifling innovation.


## When to Use

**Use this skill when:**
- User asks about golden path designer techniques or best practices
- User needs guidance on golden path designer concepts
- User wants to implement or improve their approach to golden path designer

**Do NOT use when:**
- The request falls outside the scope of golden path designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Golden Path Principles

### What Is a Golden Path

```
Golden Path = the supported, recommended way to do something

Not a mandate. Not the only way. But the way that:
- Has been designed and tested by the platform team
- Comes with built-in best practices
- Is fully supported with tooling and documentation
- Gets you from zero to production fastest
- Has guardrails that prevent common mistakes
```

### Design Principles

```markdown
## 1. Opinionated but Escapable
- Strong defaults that work for 80% of cases
- Clear supersede mechanisms for the other 20%
- Document WHY the opinions exist

## 2. Paved, Not Paved Over
- Golden paths should feel natural, not forced
- Developers should choose the path because it is better
- Measure adoption, not compliance

## 3. Complete, Not Partial
- Cover the full lifecycle: create -> develop -> test -> deploy -> operate
- Include monitoring, alerting, and runbook templates

## 4. Evolving, Not Static
- Version your golden paths
- Deprecate old paths with migration guidance

## 5. Measured, Not Assumed
- Track adoption rates by team and service type
- Measure time-to-production for golden path vs. off-path
- Survey developer satisfaction quarterly
```

## Template Design

### Golden Path Template Structure

```
golden-paths/
  ├── web-service/
  │   ├── template.yaml          # Scaffolder definition
  │   ├── skeleton/              # Project skeleton
  │   │   ├── src/
  │   │   ├── Dockerfile
  │   │   ├── .github/workflows/
  │   │   ├── terraform/
  │   │   ├── k8s/
  │   │   └── catalog-info.yaml
  │   ├── docs/
  │   │   ├── overview.md
  │   │   ├── decisions.md       # Why these choices
  │   │   └── customization.md   # How to deviate
  │   └── tests/
  ├── data-pipeline/
  ├── frontend-app/
  └── shared/
      ├── ci-templates/
      ├── terraform-modules/
      └── k8s-base/
```

### Template Decision Documentation

```markdown
# Web Service Golden Path: Design Decisions

## Language: TypeScript
**Why**: Largest internal skill base (78% of teams), strong typing.
**supersede**: Set `language: go` in template parameters

## Framework: Express.js with Fastify adapter
**Why**: Lightweight, well-understood, good performance.
**supersede**: Available as separate golden path template

## Database: PostgreSQL via managed service
**Why**: ACID compliance, JSON support, managed service reduces ops burden.
**supersede**: Change database parameter; must justify in architecture review.

## CI/CD: GitHub Actions
**Why**: Integrated with repository hosting, no additional infrastructure.

## Deployment: Kubernetes via Helm
**Why**: Standardized deployment, auto-scaling, self-healing.
**supersede**: Lambda available as separate golden path template

## Monitoring: Datadog
**Why**: Unified metrics, logs, traces; existing enterprise agreement.
**supersede**: Must still emit standard metrics for org-wide visibility.
```

### Parameterized Template Example

```yaml
# template.yaml for web service golden path
parameters:
  - title: Service Configuration
    properties:
      serviceName:
        title: Service Name
        type: string
        pattern: '^[a-z][a-z0-9-]{2,30}$'
      team:
        title: Owning Team
        type: string
        ui:field: TeamPicker
      serviceType:
        title: Service Type
        type: string
        enum: [rest-api, graphql-api, grpc-service, event-consumer, scheduled-job]
        default: rest-api

  - title: Infrastructure
    properties:
      database:
        title: Database
        type: string
        enum: [postgresql, none]
        default: postgresql
      cache:
        title: Cache Layer
        type: string
        enum: [redis, none]
        default: none
      messageQueue:
        title: Message Queue
        type: string
        enum: [kafka, sqs, none]
        default: none

  - title: Deployment
    properties:
      initialEnvironments:
        title: Environments to Create
        type: array
        items:
          type: string
          enum: [development, staging, production]
        default: [development, staging]
      scalingProfile:
        title: Expected Load Profile
        type: string
        enum:
          - low     # 1-2 replicas, 256MB-512MB RAM
          - medium  # 2-4 replicas, 512MB-1GB RAM
          - high    # 4-10 replicas, 1GB-2GB RAM
        default: low
```

## Guardrails Design

### Guardrail Categories

```
1. HARD GUARDRAILS (block)
   Cannot be bypassed without exception process
   - No secrets in source code
   - Required security scanning
   - Mandatory authentication on APIs
   - Container image signing

2. SOFT GUARDRAILS (warn)
   Warning issued but action allowed
   - Non-standard dependency versions
   - Missing documentation
   - Test coverage below threshold
   - Cost estimate above team budget

3. ADVISORY GUARDRAILS (inform)
   Informational, no blocking or warning
   - Newer framework version available
   - Performance optimization suggestions
   - Upcoming deprecation notices
```

### Policy-as-Code Implementation

```yaml
# policies/security.yaml
policies:
  no-secrets-in-code:
    type: hard
    description: Source code must not contain secrets or credentials
    check: scan/secrets
    enforcement: block-merge

  container-scanning:
    type: hard
    description: All container images must pass vulnerability scan
    check: scan/container
    enforcement: block-deploy
    severity-threshold: critical

  api-authentication:
    type: hard
    description: All public APIs must require authentication
    check: api/auth-check
    enforcement: block-deploy
    exceptions: [health-check endpoints, public documentation]

  dependency-updates:
    type: soft
    description: Dependencies should be within 2 major versions
    check: deps/version-check
    enforcement: pr-comment
```

### CI Pipeline Guardrails

```yaml
# .github/workflows/guardrails.yml
name: Golden Path Guardrails
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
      - name: Dependency vulnerability check
        run: npm audit --audit-level=critical
      - name: SAST scan
        uses: github/codeql-action/analyze@v3

  standards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check golden path compliance
        run: |
          REQUIRED=("Dockerfile" "catalog-info.yaml" "docs/index.md" ".github/CODEOWNERS")
          for file in "${REQUIRED[@]}"; do
            [ ! -f "$file" ] && echo "::warning::Missing: $file"
          done
      - name: Check container best practices
        uses: hadolint/hadolint-action@v3
```

## Best Practice Enforcement

### Enforcement Spectrum

```
Least Restrictive -------------------------------- Most Restrictive

Documentation -> Linting -> Warnings -> Gates -> Mandates

Documentation: "Here's how to do it well" (guides, examples)
Linting:       "Your code has style issues" (auto-fixable, non-blocking)
Warnings:      "This deviates from standards" (PR comments, dashboard alerts)
Gates:         "This cannot ship until fixed" (CI checks, review requirements)
Mandates:      "This is not configurable" (hardcoded in templates)
```

### Compliance Scorecard

```yaml
scorecard:
  name: Golden Path Compliance

  categories:
    - name: Repository Standards
      weight: 20
      checks:
        - name: Has CODEOWNERS
          type: file-exists
          path: .github/CODEOWNERS
        - name: Has catalog-info.yaml
          type: file-exists
          path: catalog-info.yaml
        - name: Branch protection enabled
          type: github-setting

    - name: CI/CD Standards
      weight: 25
      checks:
        - name: CI pipeline exists
          type: file-exists
          path: .github/workflows/ci.yml
        - name: Security scanning enabled
          type: workflow-step
        - name: Automated deployment configured
          type: file-exists
          path: .github/workflows/deploy.yml

    - name: Observability
      weight: 25
      checks:
        - name: Health check endpoint
          type: endpoint-exists
          path: /health
        - name: Metrics endpoint
          type: endpoint-exists
          path: /metrics
        - name: Structured logging
          type: log-format
          format: json

    - name: Documentation
      weight: 15
      checks:
        - name: README exists
          type: file-exists
          path: README.md
        - name: Runbook exists
          type: file-exists
          path: docs/runbook.md
        - name: API documentation
          type: api-docs-complete

    - name: Security
      weight: 15
      checks:
        - name: No critical vulnerabilities
          type: vulnerability-scan
        - name: Secrets not in code
          type: secret-scan
        - name: Dependencies up to date
          type: dependency-age
          max-major-behind: 2

  grading:
    A: [90, 100]
    B: [75, 89]
    C: [60, 74]
    D: [0, 59]
```

## Migration Paths

### Migrating Existing Services to Golden Path

```markdown
## Migration Approach: Incremental Adoption

### Phase 1: Assessment
- Run compliance scorecard against existing service
- Identify gaps and estimate effort
- Prioritize by risk and value

### Phase 2: Incremental Adoption
Do NOT rewrite. Adopt golden path elements incrementally:

Week 1: Repository standards (catalog-info.yaml, CODEOWNERS, branch protection)
Week 2: CI/CD alignment (standard workflow, security scanning)
Week 3: Observability (health endpoint, structured logging, dashboard)
Week 4: Documentation (README, runbook, architecture decisions)

### Phase 3: Validation
- Re-run compliance scorecard
- Address remaining gaps
```

### Migration Tooling

```shell
platform migrate assess                    # Run compliance check
platform migrate plan                      # Generate migration plan
platform migrate apply --step ci           # Apply CI standards
platform migrate apply --step observability # Apply monitoring
platform migrate verify                    # Re-check compliance
```

## Measuring Golden Path Success

### Key Metrics

```markdown
### Adoption Metrics
- % of new services using golden path templates (target: >90% after 6 months)
- % of existing services at grade B or above (target: >70% after 12 months)
- Average compliance score across all services (target: >80)

### Velocity Metrics
- Time from idea to first deployment (golden path vs. off-path)
- Time to add new environment
- Incident count per service (compare MTTR and frequency)

### Developer Experience Metrics
- Developer satisfaction with golden path (target: >4.0/5.0)
- supersede/escape hatch usage rate (if >30%, path needs updating)
```

### Feedback Loop

```
Measure -> Analyze -> Improve -> Communicate -> Measure

Monthly: Review adoption, analyze supersedes, identify pain points
Quarterly: Developer survey, update templates, communicate changes, retire outdated paths
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to golden path designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Golden Path Designer Analysis

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

**Input:** "Help me with golden path designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to golden path designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
