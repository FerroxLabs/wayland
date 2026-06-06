---
name: launch-saas
description: |
  Orchestrates the full process of launching a SaaS product from system architecture through production monitoring, chaining seven software-development skills into a cohesive build-and-deploy pipeline.
  Use when the user wants to build and launch a SaaS application from scratch or migrate a prototype to production-ready infrastructure.
  Do NOT use for single-page static sites, internal tools without user authentication, or mobile-only apps without a web backend.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture api-design devops cloud security step-by-step planning"
  category: "software-development"
  depends: "system-design-process rest-api-design authentication-patterns serverless-patterns ci-cd-pipeline-design deployment-strategies monitoring-alerting"
  disclaimer: "none"
  difficulty: "advanced"
---

# Launch a SaaS Product

**Estimated time:** 4-12 weeks (depending on feature scope, team size, and infrastructure complexity)

This workflow chains seven atomic skills into the end-to-end process of launching a software-as-a-service product. Each step builds on the prior step's output, creating a coherent pipeline from architectural blueprint through production observability. The workflow assumes you are building a web-based SaaS product with user accounts, API endpoints, and cloud deployment.

## When to Use

- User needs to build and launch a SaaS product from concept to production
- User wants a structured multi-week process for going from architecture to live deployment
- User has a validated product idea and needs the technical execution roadmap
- User is transitioning a prototype or MVP to production-grade infrastructure
- Do NOT use when: the project is a static website, a one-off script, a mobile-only app without a web backend, or an internal tool with fewer than 3 users

## Prerequisites

Before starting this workflow, ensure:

1. **Product requirements exist:** You have a written description of what the SaaS product does, who the target users are, and the core features for the initial launch (an MVP feature list)
2. **Technology stack is selected:** You have chosen a primary programming language and framework (the workflow is stack-agnostic but each step requires stack-specific decisions)
3. **Cloud provider account is ready:** You have access to at least one cloud provider (AWS, GCP, or Azure) with billing configured
4. **Domain name is registered:** You own or have reserved a domain name for the product
5. **Source control is initialized:** A Git repository exists and you understand branching basics (or will set up via the git-branching-strategy skill referenced in Decision Points)

## Steps

**Step 1: Design the System Architecture** (uses: system-design-process)

Define the high-level architecture for the SaaS product. This step produces the blueprint that all subsequent steps build upon. Focus on identifying the major components (web frontend, API backend, database, background workers, external integrations), their communication patterns, and the non-functional requirements (expected load, latency targets, availability requirements).

- Input: Product requirements document, target user count estimate, technology stack choice
- Output: System architecture diagram with component inventory, communication patterns, data flow map, and technology decisions documented
- Key focus: Right-sizing the architecture for launch -- avoid over-engineering for scale you do not yet have. A monolithic API with a single database is the correct starting point for most SaaS launches. Document the scaling inflection points where architecture changes would be needed (for example, at 10K concurrent users, consider splitting the background worker into a separate service).

**Step 2: Design the API Layer** (uses: rest-api-design)

Translate the system architecture into a concrete API specification. Every user-facing feature and internal service communication identified in Step 1 becomes an API endpoint or resource. This step produces the contract that the frontend, mobile clients, and third-party integrations will consume.

- Input: System architecture from Step 1, feature list from prerequisites, data model sketches
- Output: API specification with resource definitions, endpoint paths, request and response schemas, status codes, pagination strategy, and versioning approach
- Key focus: Design for the MVP feature set only. Every endpoint must map to a user story or system requirement from Step 1. Avoid speculative endpoints for features not in the launch scope. Define error response formats consistently -- every consumer of this API will depend on predictable error structures.

**Step 3: Implement Authentication and Authorization** (uses: authentication-patterns)

Build the identity layer that protects the API and enables user accounts. This step uses the API specification from Step 2 to determine which endpoints require authentication, which require specific roles or permissions, and how tokens flow between client and server.

- Input: API specification from Step 2, user role definitions (at minimum: anonymous, authenticated user, admin), security requirements
- Output: Authentication implementation with signup, login, password reset, token refresh flows; authorization middleware with role-based access control; session management strategy
- Key focus: Token-based authentication (JWT or opaque tokens with server-side sessions) for the API. Implement refresh token rotation from day one -- retrofitting it after launch creates security gaps during the migration. Store password hashes with bcrypt or Argon2, never roll custom password hashing. For the MVP, email-password authentication is sufficient; OAuth providers can be added post-launch.

**Step 4: Design Serverless and Infrastructure Patterns** (uses: serverless-patterns)

Define the infrastructure patterns for components that do not fit the primary API server: background jobs (email sending, report generation, data processing), scheduled tasks (subscription billing cycles, cleanup jobs), and event-driven processing (webhook handlers, notification dispatch). This step determines which workloads run on the primary server and which should be separate functions or services.

- Input: System architecture from Step 1, API specification from Step 2, list of background and scheduled tasks identified during Steps 1-3
- Output: Infrastructure pattern document specifying which workloads are serverless functions, which are background workers, queue architecture for async tasks, and event routing configuration
- Key focus: Use serverless patterns for bursty, stateless workloads (webhook handlers, image processing, email dispatch). Use persistent workers for long-running or stateful tasks (subscription billing, data exports). The decision boundary is: if the task completes in under 60 seconds and has no persistent connections, it is a serverless candidate. If it needs database connections or runs for minutes, use a background worker.

**Step 5: Configure CI/CD Pipeline** (uses: ci-cd-pipeline-design)

Build the automated pipeline that takes code from a developer's branch to a deployed environment. This step integrates the outputs of Steps 1-4 into a repeatable, automated build-test-deploy process. The pipeline must handle the API server, serverless functions, database migrations, and static assets as separate deployment targets.

- Input: Repository structure, technology stack, deployment targets from Steps 1-4, test suite location
- Output: CI/CD pipeline configuration with: build stage (compile, lint, type-check), test stage (unit, integration, API contract tests), deploy stage (staging first, then production with approval gate), and environment variable management
- Key focus: The pipeline must run all tests before any deployment. Staging deploys automatically on merge to main. Production deploys require an explicit approval step (even for solo developers -- the approval step forces a pause to verify staging). Include database migration as a named pipeline step that runs before the application deployment step.

**Step 6: Plan Deployment Strategy** (uses: deployment-strategies)

Define how the application transitions from staging to production and how subsequent updates are rolled out. This step takes the pipeline from Step 5 and adds the deployment pattern (blue-green, canary, or rolling) that matches the SaaS product's availability requirements.

- Input: CI/CD pipeline from Step 5, availability requirements from Step 1, database migration strategy
- Output: Deployment strategy document specifying: deployment pattern, traffic migration approach, rollback procedure, zero-downtime deployment configuration, and DNS and TLS setup
- Key focus: For the initial launch, a blue-green deployment with manual traffic cutover is the safest approach. Configure health checks that verify not just server responsiveness but actual application functionality (can the health endpoint query the database and return a valid response?). Document the exact rollback procedure: how long it takes, what happens to in-flight requests, and whether database migrations need to be reversed.

**Step 7: Configure Monitoring and Alerting** (uses: monitoring-alerting)

Set up observability for the production system so that problems are detected before users report them. This step instruments the application deployed in Step 6 with metrics, logs, and alerts that cover the critical user paths identified in Steps 1-2.

- Input: Deployed production system from Step 6, API endpoint list from Step 2, SLA or availability targets from Step 1
- Output: Monitoring stack configuration with: application performance monitoring (response times, error rates, throughput), infrastructure monitoring (CPU, memory, disk, network), business metric dashboards (signups, active users, API usage), alert rules with severity levels and notification channels
- Key focus: Define alerts for the conditions that directly affect users: API response time exceeding 2 seconds (p95), error rate exceeding 1 percent of requests, database connection pool exhaustion, and certificate expiration within 14 days. Avoid alert fatigue by setting thresholds based on baseline measurements from the first week of production traffic, not theoretical values.

## Decision Points

- **Before Step 1:** If you are a **solo developer**, plan for trunk-based development with feature flags instead of branching strategies. If you have a **team of 2 or more**, add a branching strategy step using git-branching-strategy before Step 5 to define code review and merge processes.

- **At Step 1:** If this is a **greenfield project**, proceed through all 7 steps sequentially. If you are **migrating an existing codebase** to SaaS architecture, skip Step 1 (your architecture exists) and start at Step 2 by documenting the current API surface before redesigning it.

- **At Step 4:** Choose infrastructure based on **cloud provider**:
  - **AWS:** Lambda for serverless, SQS for queues, ECS or EKS for persistent workers
  - **GCP:** Cloud Functions for serverless, Pub/Sub for queues, Cloud Run for persistent workers
  - **Azure:** Azure Functions for serverless, Service Bus for queues, Container Apps for persistent workers
  If **budget is constrained** (under $100 per month for infrastructure), use a single VPS with systemd-managed background workers instead of managed serverless services. Revisit serverless when traffic justifies the cost.

- **At Step 6:** If the product has **fewer than 100 expected users at launch**, a simple rolling deployment is sufficient -- skip blue-green complexity. If you expect **more than 1,000 users at launch** or have **zero-downtime requirements**, implement blue-green or canary deployment as described in Step 6.

- **At Step 7:** If you are using **self-hosted infrastructure**, add a dedicated monitoring server or use the cloud provider's built-in monitoring. If you are using **managed services** (Heroku, Railway, Vercel), leverage their built-in monitoring and focus Step 7 on application-level metrics and custom business dashboards only.

## Failure Handling

- **Step 1 produces an over-engineered architecture:** If the system design includes microservices, event sourcing, or CQRS for a product that has not validated product-market fit, stop and simplify. The correct architecture for a launch is the simplest one that can serve the MVP feature set. Revisit architectural complexity only after sustained traffic demonstrates the need.

- **Step 3 authentication integration fails with the API:** If authentication middleware conflicts with the API design from Step 2, the issue is almost always in how tokens are passed (header format, cookie configuration, CORS settings). Return to Step 2 and verify the authentication flow is documented in the API specification before retrying Step 3.

- **Step 4 serverless functions fail under real workload:** If serverless functions time out, hit memory limits, or encounter cold-start latency that breaks user experience, migrate the affected workload to a persistent background worker. This is not a failure of the workflow -- it is the expected decision boundary documented in Step 4's Key focus.

- **Step 5 CI/CD pipeline takes too long (over 20 minutes):** Parallelize test stages (unit tests and integration tests run simultaneously), cache dependencies between runs, and consider splitting the pipeline into separate pipelines per deployment target (API server pipeline, serverless function pipeline, frontend pipeline).

- **Step 6 deployment fails with traffic already migrated:** This is the highest-risk failure in the workflow. Immediately execute the rollback procedure documented in Step 6. If database migrations were applied and are not backward-compatible, the rollback requires a database migration reversal -- this is why Step 6 requires that all migrations be backward-compatible for the first release. If the rollback succeeds, diagnose the failure using Step 7's monitoring data before retrying.

- **User wants to change direction mid-build (pivot, scope reduction, technology change):**
  - If before Step 5: Restart from the affected step. Steps 1-4 are design artifacts that are inexpensive to redo.
  - If after Step 5: The CI/CD pipeline and deployment infrastructure represent significant investment. Modify the pipeline incrementally rather than rebuilding. Change the application code deployed through the pipeline, not the pipeline itself.

## Edge Cases

- **Multi-tenant architecture:** If the SaaS product serves multiple organizations that must not see each other's data, address tenant isolation at Step 1 (shared database with tenant_id column vs. schema-per-tenant vs. database-per-tenant). This decision cascades through every subsequent step: API design (tenant scoping on every endpoint), authentication (tenant membership verification), and monitoring (per-tenant metrics).

- **Regulatory compliance requirements (SOC 2, HIPAA, GDPR):** If the product handles sensitive data, add compliance constraints at Step 1 (data residency, encryption at rest, audit logging) and carry them through Steps 3 (authentication strengthening), 5 (pipeline audit trail), and 7 (compliance monitoring dashboards). These requirements typically add 2-4 weeks to the timeline.

- **Third-party payment integration:** If the SaaS product has subscription billing, the payment provider integration (Stripe, Paddle, or equivalent) introduces external dependency risk at Step 4. Test webhook reliability with retry logic. Never store raw credit card numbers -- use the payment provider's hosted checkout or tokenization. Plan for payment failure handling: dunning emails, grace periods, and account suspension flows.

- **Launching without a frontend:** Some SaaS products launch as API-only services (developer tools, B2B integrations). If there is no web frontend, skip the frontend considerations in Steps 1 and 6, but invest more in Step 2 (API documentation becomes the primary user interface) and Step 5 (developer experience of the API documentation site becomes the deployment target).

- **International users with latency requirements:** If users are distributed globally, consider a CDN for static assets at Step 6 and multi-region deployment when the user base justifies it. For the initial launch, deploy in the region closest to the majority of your early users and add regions based on latency data from Step 7 monitoring.

## Expected Outcome

When this workflow is complete, the user will have:

1. A documented system architecture with component inventory, communication patterns, and scaling inflection points
2. A complete API specification with resource definitions, endpoint paths, request/response schemas, and versioning approach
3. An authentication and authorization implementation with signup, login, token refresh, and role-based access control
4. Infrastructure patterns for serverless functions, background workers, and event-driven processing
5. An automated CI/CD pipeline with build, test, staging deploy, production approval gate, and post-deployment verification
6. A deployment strategy with traffic migration, health checks, and a documented rollback procedure tested end-to-end
7. A production monitoring stack with application metrics, infrastructure metrics, business dashboards, and alert rules with defined severity levels
8. Confidence that the system can be deployed, monitored, and rolled back safely from day one

## Output Format

The workflow produces a structured set of artifacts at each step. The final deliverable set follows this structure:

```
project-root/
  docs/
    architecture.md          # Step 1: System architecture document
    api-specification.md     # Step 2: API contract and endpoint reference
    auth-design.md           # Step 3: Authentication and authorization design
    infrastructure.md        # Step 4: Serverless and background job patterns
    deployment-strategy.md   # Step 6: Deployment pattern and rollback procedure
  .github/workflows/
    ci.yml                   # Step 5: CI/CD pipeline configuration
    deploy-staging.yml       # Step 5: Staging deployment workflow
    deploy-production.yml    # Step 5: Production deployment workflow
  monitoring/
    alerts.yml               # Step 7: Alert rule definitions
    dashboards.json          # Step 7: Dashboard configurations
  src/                       # Steps 2-4: Application source code
  tests/                     # Step 5: Test suites
  docker-compose.yml         # Development environment
  Makefile                   # Common development commands
```

## Example

**Scenario:** "Launch a project management SaaS tool for small teams with task boards, team collaboration, and subscription billing."

**Input:** MVP feature list (task boards, team invitations, real-time updates, monthly subscription billing), technology choice (TypeScript, Next.js frontend, Node.js API), target market (small teams of 5-20 members), cloud provider (AWS), expected launch users (200 beta signups).

**Output:** Production-deployed SaaS application with complete infrastructure.

**Step 1 (system-design-process):**
Design a monolithic API server with PostgreSQL database, Redis for caching and real-time features, and S3-compatible object storage for file attachments. The architecture targets 500 concurrent users at launch with a scaling path to 5,000. Components: Next.js frontend on Vercel, Node.js API on ECS, PostgreSQL on RDS, Redis on ElastiCache, S3 for file storage.

**Step 2 (rest-api-design):**
Define REST endpoints: workspaces (CRUD), boards (CRUD within workspace), tasks (CRUD within board, with assignment and status transitions: todo, in-progress, done), users (profile, team membership), billing (subscription status, plan changes). Design WebSocket endpoint for real-time board updates. Specify pagination (cursor-based for task lists), rate limiting (100 requests per minute per user), and error format (JSON with code, message, details).

**Step 3 (authentication-patterns):**
Implement email-password authentication with JWT access tokens (15-minute expiry) and HTTP-only refresh tokens (7-day expiry, rotation on use). Role-based access: workspace owner, workspace member, workspace guest. API middleware checks workspace membership before allowing any workspace-scoped request. Magic link login as a secondary authentication method.

**Step 4 (serverless-patterns):**
Email notifications (task assignment, due date reminders) as Lambda functions triggered by SQS messages. Subscription billing webhook handler as a Lambda function behind API Gateway. Daily digest email generation as an EventBridge-scheduled Lambda. File attachment processing (thumbnail generation) as a Lambda triggered by S3 upload events.

**Step 5 (ci-cd-pipeline-design):**
GitHub Actions pipeline: lint and type-check (2 minutes), unit tests (3 minutes), integration tests with test database (5 minutes), deploy to staging on merge to main, deploy to production on manual approval. Database migrations run as a pipeline step before application deployment. Total pipeline time under 12 minutes.

**Step 6 (deployment-strategies):**
Blue-green deployment on ECS with ALB health check verification. Production runs two identical task definitions. New deployments create a new task set, health checks verify API and database connectivity over 60 seconds, then ALB switches traffic. Rollback is instantaneous by reverting to the previous task set. Database migrations are backward-compatible to support both blue and green application versions simultaneously.

**Step 7 (monitoring-alerting):**
CloudWatch metrics: API response time per endpoint, error rate by status code, WebSocket connection count, active user sessions. Infrastructure: ECS CPU and memory, RDS connections, Redis memory, S3 request counts. Business metrics via custom dashboard: daily active users, tasks created per day, subscription conversion rate, churn rate. Alerts: p95 response time above 1 second triggers warning, error rate above 2 percent triggers critical page, database connections above 80 percent utilization triggers warning, certificate expiry within 14 days triggers action item.

**Result:** A production-ready project management SaaS with automated deployment pipeline, monitoring, and a clear path to scale. The team ships feature updates multiple times per day with confidence that the pipeline catches regressions and the monitoring catches production issues.
