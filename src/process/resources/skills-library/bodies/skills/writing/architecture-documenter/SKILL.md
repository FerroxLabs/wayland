---
name: architecture-documenter
description: |
  Expert architecture documentation covering ADR (Architecture Decision Records) format, C4 model diagrams, system context diagrams, sequence diagrams, deployment diagrams, technology radar, architectural fitness functions, and documentation-as-code.
  Use when the user asks about architecture documenter, architecture documenter best practices, or needs guidance on architecture documenter implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation architecture"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Architecture Documenter

## Overview

This skill provides comprehensive expertise in documenting software architecture. Effective architecture documentation communicates the system's structure, decisions, and rationale to both current and future team members. This skill covers industry-standard formats and models including ADRs, C4 diagrams, deployment views, and the documentation-as-code approach that keeps architecture docs living and accurate.

## Architecture Decision Records (ADRs)

### ADR Template (Michael Nygard Format)

```markdown
# ADR-0015: Use PostgreSQL as Primary Database

## Status

Accepted (2025-01-15)

Supersedes: ADR-0003 (Use MongoDB)

## Context

We need a persistent data store for our product catalog and order management
system. The data has strong relational characteristics (products belong to
categories, orders contain line items, users have addresses). We expect:

- 10M+ product records
- 50K+ orders per day
- Complex queries joining 3-5 tables
- Strong consistency requirements for financial data
- Full-text search on product names and descriptions

We evaluated: PostgreSQL, MySQL, MongoDB, and CockroachDB.

# ... (condensed) ...
- If we exceed 1TB of data, we may need to evaluate sharding strategies
  or move to a distributed database. We will re-evaluate at 500GB.

## Follow-Up Actions
- [ ] Set up PostgreSQL 16 in staging environment
- [ ] Create database migration pipeline with Flyway
- [ ] Establish backup and point-in-time recovery procedures
- [ ] Document connection pooling strategy (PgBouncer)
```

### ADR Numbering and Lifecycle

```
ADR States:
├── Proposed → Under discussion, not yet decided
├── Accepted → Decision made, implementation proceeding
├── Deprecated → No longer applies but was once valid
├── Superseded → Replaced by a newer ADR (link to replacement)
└── Rejected → Considered but not adopted (document why)

File Naming: docs/adr/XXXX-title-with-dashes.md
  Example: docs/adr/0015-use-postgresql-as-primary-database.md

Index File: docs/adr/README.md
  - List all ADRs with status, date, and one-line summary
  - Group by domain (data, infrastructure, frontend, etc.)
```

### When to Write an ADR

```
Write an ADR when:
├── Choosing a technology (database, framework, cloud provider)
├── Selecting an architecture pattern (microservices, CQRS, event sourcing)
├── Making a trade-off (consistency vs. availability, build vs. buy)
├── Establishing a standard (API style, error format, auth mechanism)
├── Changing a previous decision (must supersede the old ADR)
└── Making a decision that future team members will question

Do NOT write an ADR for:
├── Implementation details that can change without impact
├── Coding style preferences (use a linter config instead)
├── Trivial decisions with obvious answers
└── Temporary decisions (use a TODO or ticket instead)
```

## C4 Model

### Four Levels of Abstraction

```
C4 Model Levels:
Level 1: System Context  → "What is this system and who uses it?"
Level 2: Container        → "What are the major building blocks?"
Level 3: Component         → "What is inside each container?"
Level 4: Code              → "How is a component implemented?" (rarely needed)

Key Principle: Each level zooms in on the previous level.
Audience shifts from business stakeholders (L1) to developers (L4).
```

### Level 1: System Context Diagram

```
System Context Diagram Template (as code using Structurizr DSL):

workspace {
    model {
        customer = person "Customer" "A user who browses and purchases products"
        admin = person "Admin" "Internal staff who manage the product catalog"

        productSystem = softwareSystem "Product Catalog System" "Manages product listings, search, and inventory" {
            tags "Primary"
        }

        paymentGateway = softwareSystem "Payment Gateway" "Processes credit card payments" {
            tags "External"
        }
        emailService = softwareSystem "Email Service" "Sends transactional emails" {
            tags "External"
        }
        analytics = softwareSystem "Analytics Platform" "Tracks user behavior" {
            tags "External"
        }

        customer -> productSystem "Browses products, places orders"
        admin -> productSystem "Manages catalog and inventory"
        productSystem -> paymentGateway "Processes payments" "HTTPS/REST"
        productSystem -> emailService "Sends order confirmations" "SMTP"
        productSystem -> analytics "Sends events" "HTTPS"
    }

    views {
        systemContext productSystem "SystemContext" {
            include *
            autoLayout
        }
    }
}
```

### Level 2: Container Diagram

```
Container Diagram Elements:

┌───────────────── Product Catalog System ─────────────────┐
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Web App  │  │ Mobile   │  │   Admin Dashboard    │   │
│  │  (React)  │  │ App (RN) │  │   (React + Vite)     │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
│       │              │                    │               │
│       └──────────────┼────────────────────┘               │
│                      │                                    │
│                      ▼                                    │
│              ┌──────────────┐                             │
│              │  API Gateway │                             │
│              │   (Kong)     │                             │
│              └──────┬───────┘                             │
│                     │                                     │
│         ┌───────────┼───────────┐                        │
│         ▼           ▼           ▼                        │
│  ┌────────────┐ ┌─────────┐ ┌──────────┐               │
│  │  Product   │ │  Order  │ │  User    │               │
│  │  Service   │ │ Service │ │ Service  │               │
# ... (condensed) ...
│  │(products)│  │ (orders) │ │ (users)  │               │
│  └──────────┘  └──────────┘ └──────────┘               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │    Redis      │  │  RabbitMQ    │                     │
│  │   (cache)     │  │  (events)    │                     │
│  └──────────────┘  └──────────────┘                     │
└──────────────────────────────────────────────────────────┘
```

## Sequence Diagrams

### Mermaid Sequence Diagram Template

```markdown
## Order Placement Flow

\```mermaid
sequenceDiagram
    actor Customer
    participant Web as Web App
    participant API as API Gateway
    participant Order as Order Service
    participant Product as Product Service
    participant Payment as Payment Gateway
    participant Email as Email Service

    Customer->>Web: Click "Place Order"
    Web->>API: POST /orders
    API->>Order: Create order
    Order->>Product: Check inventory
    Product-->>Order: Inventory confirmed

    Order->>Payment: Charge card
    Payment-->>Order: Payment successful

    Order->>Product: Decrement inventory
    Order->>Email: Send confirmation
    Email-->>Customer: Order confirmation email

    Order-->>API: Order created (201)
    API-->>Web: Order response
    Web-->>Customer: Show confirmation page
\```
```

### When to Use Sequence Diagrams

```
Use sequence diagrams for:
├── Multi-service request flows (API calls across microservices)
├── Authentication/authorization flows (OAuth, JWT refresh)
├── Error handling flows (what happens when service X fails?)
├── Async workflows (event-driven processes)
└── Third-party integration flows (payment, shipping, etc.)

Keep diagrams focused:
├── Maximum 6-8 participants per diagram
├── Maximum 15-20 interactions per diagram
├── Split complex flows into sub-diagrams
└── Name the diagram after the scenario, not the system
```

## Deployment Diagrams

### Infrastructure Documentation

```markdown
## Deployment Architecture

### Production Environment

\```
┌─────────────────── AWS us-east-1 ───────────────────────┐
│                                                          │
│  ┌─── VPC 10.0.0.0/16 ────────────────────────────┐    │
│  │                                                  │    │
│  │  ┌─── Public Subnet ──────┐                     │    │
│  │  │  ALB (Application       │                     │    │
│  │  │  Load Balancer)         │                     │    │
│  │  │  ├── HTTPS:443          │                     │    │
│  │  │  └── WAF attached       │                     │    │
│  │  └─────────┬───────────────┘                     │    │
│  │            │                                      │    │
│  │  ┌─── Private Subnet ─────────────────────────┐  │    │
│  │  │                                             │  │    │
│  │  │  ECS Fargate Cluster                        │  │    │
│  │  │  ├── Product Service (3 tasks, 512MB)       │  │    │
│  │  │  ├── Order Service (3 tasks, 1GB)           │  │    │
│  │  │  └── User Service (2 tasks, 512MB)          │  │    │
# ... (condensed) ...
| Aspect | Development | Staging | Production |
|--------|------------|---------|------------|
| Compute | Docker Compose | ECS (1 task each) | ECS (2-5 tasks each) |
| Database | PostgreSQL 16 (local) | RDS db.t3.medium | RDS db.r6g.xlarge (Multi-AZ) |
| Cache | Redis (local) | ElastiCache (1 node) | ElastiCache (3 nodes) |
| CDN | None | CloudFront | CloudFront |
| Monitoring | Console logs | CloudWatch | CloudWatch + Datadog |
| Cost | $0 | ~$500/mo | ~$3,500/mo |
```

## Technology Radar

### Radar Template

```markdown
# Technology Radar - Q1 2025

## Adopt (Use in production with confidence)

| Technology | Category | Notes |
|-----------|----------|-------|
| TypeScript 5.x | Language | Standard for all new services |
| PostgreSQL 16 | Database | Primary relational store |
| React 19 | Frontend | Web application framework |
| GitHub Actions | CI/CD | All pipelines migrated |
| Terraform | Infrastructure | IaC standard |

## Trial (Use in non-critical projects to gain experience)

| Technology | Category | Notes |
|-----------|----------|-------|
| Bun | Runtime | Evaluate for build tooling |
| Drizzle ORM | Database | Evaluate vs. Prisma |
| htmx | Frontend | Evaluate for admin tools |
| OpenTelemetry | Observability | Pilot in one service |

## Assess (Research and prototype, not production yet)
# ... (condensed) ...
## Hold (Do not start new projects with these)

| Technology | Category | Notes |
|-----------|----------|-------|
| MongoDB | Database | Migrating away; poor fit for relational data |
| Express.js | Framework | Replaced by Fastify for new services |
| Jenkins | CI/CD | Fully replaced by GitHub Actions |
| Webpack | Bundler | Replaced by Vite |
```

## Architectural Fitness Functions

### Definition and Examples

```markdown
# Architectural Fitness Functions

Automated checks that verify the system conforms to architectural decisions.

## Dependency Rules

**Rule**: Domain layer must not depend on infrastructure layer.

\```python
# ArchUnit-style test (Python with import-linter)
# .importlinter config
[importlinter:contract:domain-independence]
name = Domain must not import from infrastructure
type = forbidden
source_modules =
    app.domain
forbidden_modules =
    app.infrastructure
    sqlalchemy
    redis
    httpx
\```
# ... (condensed) ...

**Rule**: Frontend bundle must be under 250KB gzipped.

\```javascript
// webpack-bundle-analyzer or vite-plugin-inspect
// CI check:
// gzip -c dist/assets/*.js | wc -c must be < 256000
\```
```

## Documentation-as-Code

### Toolchain Recommendations

| Tool | Purpose | Format |
|------|---------|--------|
| Structurizr | C4 model diagrams | DSL (text-based) |
| Mermaid | Inline diagrams in Markdown | Markdown code blocks |
| PlantUML | UML diagrams | Text-based DSL |
| Docusaurus | Documentation site | Markdown + React |
| MkDocs | Documentation site | Markdown + YAML |
| AsciiDoc | Technical documents | Markup language |

### Documentation Repository Structure

```
docs/
├── adr/
│   ├── README.md              # ADR index
│   ├── 0001-use-typescript.md
│   ├── 0002-microservices.md
│   └── template.md
├── architecture/
│   ├── overview.md            # C4 Level 1 + Level 2
│   ├── data-model.md          # ER diagrams, schema docs
│   ├── deployment.md          # Deployment diagrams
│   └── security.md            # Threat model, auth flows
├── api/
│   └── openapi.yaml           # API specification
├── runbooks/
│   ├── incident-response.md
│   └── database-failover.md
├── onboarding/
│   ├── getting-started.md
│   └── architecture-overview.md
└── diagrams/
    ├── workspace.dsl          # Structurizr workspace
    └── generated/             # Generated diagram images
```

### CI Pipeline for Documentation

```yaml
# .github/workflows/docs.yml
name: Documentation
on:
  push:
    paths: ['docs/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint Markdown
        run: npx markdownlint-cli docs/**/*.md
      - name: Check links
        run: npx markdown-link-check docs/**/*.md
      - name: Generate diagrams
        run: |
          docker run --rm -v $(pwd):/usr/local/structurizr \
            structurizr/cli export -w docs/diagrams/workspace.dsl -f mermaid
      - name: Build docs site
        run: npx docusaurus build
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: npx docusaurus deploy
```

## Documentation Quality Checklist

- [ ] System context diagram exists and is current
- [ ] Container diagram shows all major building blocks
- [ ] Key decisions are captured as ADRs
- [ ] Sequence diagrams cover critical flows (auth, order, payment)
- [ ] Deployment diagram matches actual infrastructure
- [ ] Technology radar is updated quarterly
- [ ] At least 3 architectural fitness functions are automated
- [ ] Docs are version-controlled alongside code
- [ ] Diagrams are generated from text (not manually drawn images)
- [ ] New team members can understand the system within 1 day of reading docs
- [ ] Stale documentation review scheduled quarterly
- [ ] CI validates documentation on every change

## When to Use

**Use this skill when:**
- Designing or implementing architecture documenter solutions
- Reviewing or improving existing architecture documenter approaches
- Making architectural or implementation decisions about architecture documenter
- Learning architecture documenter patterns and best practices
- Troubleshooting architecture documenter-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Architecture Documenter Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement architecture documenter for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended architecture documenter approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When architecture documenter must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
