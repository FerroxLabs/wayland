---
name: deploy-to-production
description: |
  Orchestrates the process of deploying a software application to production, from CI pipeline verification through monitoring confirmation, chaining six software-development skills into a structured release workflow.
  Use when the user needs to deploy an application to production with a repeatable, safe process that includes database migration, monitoring, and rollback planning.
  Do NOT use for local development setup, staging-only deployments, or infrastructure provisioning without application deployment.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops ci-cd cloud database step-by-step planning"
  category: "software-development"
  depends: "ci-cd-pipeline-design deployment-strategies database-migration-patterns monitoring-alerting logging-patterns performance-testing"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Deploy to Production

**Estimated time:** 1-3 days (depending on deployment complexity, migration scope, and verification depth)

This workflow chains six atomic skills into a structured production deployment process. Each step builds on the prior step's output, creating a traceable path from verified build to confirmed production operation. The workflow assumes you have an application that is ready to deploy (code is written, tests pass) and need a systematic process for getting it into production safely with monitoring, logging, and rollback capability.

## When to Use

- User needs to deploy an application to production for the first time
- User wants a structured release process that minimizes deployment risk
- User is transitioning from manual deployments to an automated, repeatable process
- User needs to deploy a database schema change alongside application code
- Do NOT use when: the user only needs local development setup, is deploying a static site with no backend, or needs to provision cloud infrastructure without deploying an application

## Prerequisites

Before starting this workflow, ensure:

1. **Application code is ready:** All features for this release are complete, tested, and merged to the release branch
2. **Tests pass in CI:** The continuous integration pipeline runs successfully with no failures (unit tests, integration tests, linting)
3. **Staging environment exists:** You have a staging or pre-production environment that mirrors production infrastructure
4. **Database access is configured:** You have credentials and access to both staging and production databases with migration permissions
5. **Monitoring infrastructure exists:** You have a monitoring platform (CloudWatch, Datadog, Grafana, or equivalent) with access to create dashboards and alerts
6. **Rollback plan is documented:** You know how to revert to the previous version if the deployment fails (even if this workflow will formalize that plan)

## Steps

**Step 1: Verify and Harden the CI/CD Pipeline** (uses: ci-cd-pipeline-design)

Verify that the CI/CD pipeline is configured for a production deployment, not just a staging deployment. This step audits the existing pipeline and adds production-specific stages: approval gates, artifact signing, environment-specific configuration injection, and deployment sequencing (database migration before application deployment).

- Input: Current CI/CD pipeline configuration, list of deployment targets (staging, production), environment-specific configuration values
- Output: Production-ready pipeline configuration with: build verification stage (all tests green), staging deployment stage (automatic on merge), production approval gate (manual approval required), database migration stage (runs before application deployment), application deployment stage, post-deployment verification stage
- Key focus: The pipeline must enforce a strict order: tests pass, staging deploys, staging is verified, production approval is granted, database migration runs, application deploys, post-deployment checks run. No step can be skipped. The approval gate is mandatory even for solo developers -- it forces a pause between staging verification and production deployment. Ensure environment variables for production are injected from a secrets manager, never hardcoded in the pipeline configuration.

**Step 2: Select and Configure Deployment Strategy** (uses: deployment-strategies)

Choose and configure the deployment pattern that matches the application's availability requirements and risk tolerance. This step takes the pipeline from Step 1 and adds the traffic management layer that controls how users transition from the old version to the new version.

- Input: Pipeline from Step 1, availability requirements (can users experience downtime during deployment?), infrastructure platform (Kubernetes, ECS, VMs, serverless), current traffic volume
- Output: Deployment strategy configuration with: chosen pattern (blue-green, canary, or rolling), traffic migration rules, health check definitions, rollback triggers and procedure, zero-downtime configuration
- Key focus: Choose the deployment pattern based on risk tolerance and infrastructure:
  - **Blue-green:** Two identical environments, traffic switches instantaneously. Best for: applications where any error rate increase is unacceptable. Requires: double the infrastructure during deployment.
  - **Canary:** New version receives a small percentage of traffic (5-10%) initially, ramping to 100% over time. Best for: high-traffic applications where gradual rollout reduces blast radius. Requires: traffic splitting capability (load balancer or service mesh).
  - **Rolling:** Instances are updated one at a time. Best for: stateless applications on container orchestrators. Requires: health checks that detect application-level failures, not just process liveness.

**Step 3: Plan and Execute Database Migrations** (uses: database-migration-patterns)

Apply database schema changes required by the new application version. This step is the highest-risk part of most deployments because database changes are harder to reverse than application code changes. The migration must be backward-compatible: the old application version must continue to work with the new schema during the deployment window.

- Input: Migration files from development, current production schema, application version compatibility requirements
- Output: Executed migrations with: pre-migration backup verification, migration execution log, post-migration schema validation, rollback scripts tested and ready
- Key focus: Every migration must be backward-compatible. The old application version (still running during deployment) must work with the new schema. This means: never rename a column in a single migration (add new column, backfill, update application, drop old column in a later release). Never add a NOT NULL column without a default value. Never drop a table or column that the current application version reads from. Run the migration on staging first and verify the old application version still works against the migrated schema before touching production.

**Step 4: Configure Production Monitoring** (uses: monitoring-alerting)

Set up or verify monitoring dashboards and alerts that will detect deployment-related issues within minutes. This step prepares the observability infrastructure so that problems caused by the deployment are detected before users report them, and the monitoring data supports the rollback decision.

- Input: Application metrics (response times, error rates, throughput), infrastructure metrics (CPU, memory, connections), business metrics (conversions, signups, key user flows), baseline values from before the deployment
- Output: Deployment monitoring dashboard with: real-time comparison of pre-deployment and post-deployment metrics, alert rules for regression detection (error rate increase, response time increase, throughput drop), deployment event markers on metric graphs, rollback decision criteria documented
- Key focus: Define quantitative rollback triggers before the deployment starts. For example: "Roll back if error rate exceeds 2x the pre-deployment baseline for 5 consecutive minutes" or "Roll back if p95 response time exceeds 3 seconds for any critical endpoint." These triggers must be measurable and unambiguous -- the decision to roll back should not require judgment during the pressure of a failed deployment.

**Step 5: Configure Production Logging** (uses: logging-patterns)

Set up structured logging that captures deployment-specific context and enables rapid diagnosis if the deployment causes issues. This step ensures that logs from the new application version are distinguishable from logs from the old version, and that log aggregation is in place for the deployment window.

- Input: Application logging configuration, log aggregation platform (ELK stack, CloudWatch Logs, Datadog Logs, or equivalent), deployment version identifier
- Output: Production logging configuration with: structured log format (JSON with timestamp, level, service, version, request-id), deployment version tag on all log entries, log aggregation and search capability, log-based alerts for critical error patterns, log retention policy
- Key focus: Every log entry must include the application version so that logs from the old and new versions can be filtered separately during the deployment window. Add deployment-specific log entries: "Deployment started" with version and timestamp, "Migration completed" with duration, "Health check passed" at each verification point. Set up a log-based alert for any ERROR-level log that includes a stack trace during the first hour after deployment -- this catches unexpected exceptions that monitoring metrics might average out.

**Step 6: Run Pre-Production Performance Verification** (uses: performance-testing)

Run a targeted performance test against the staging environment (with the new version deployed) to verify that the deployment does not introduce performance regressions. This step catches performance issues before they affect production users.

- Input: Staging environment with new version deployed, baseline performance metrics from the current production version, critical user flows to test
- Output: Performance test results with: response time comparison (old vs. new version), throughput comparison, resource utilization comparison (CPU, memory, database connections), identified regressions (if any), go/no-go recommendation for production deployment
- Key focus: Test the critical user paths, not the entire API surface. Identify the 5-10 endpoints that handle 80% of production traffic and test those. Compare results against the production baseline. A regression of more than 20% in p95 response time for any critical endpoint is a deployment blocker -- investigate and fix before proceeding to production. Also test the database migration's impact: run the performance test against a staging database that has been migrated to verify that new indexes or schema changes do not degrade query performance.

## Decision Points

- **At Step 2:** Choose deployment strategy based on risk and infrastructure:
  - **Under 1,000 daily active users:** Rolling deployment is sufficient. The blast radius of a failed deployment is small enough that rapid rollback handles the risk.
  - **1,000-50,000 daily active users:** Canary deployment recommended. Route 5% of traffic to the new version for 30 minutes before ramping to 100%.
  - **Over 50,000 daily active users or financial transactions:** Blue-green deployment with instant switchback capability. The cost of double infrastructure during deployment is justified by the risk of serving errors to a large user base.

- **At Step 3:** If the migration is **purely additive** (new tables, new columns with defaults, new indexes), it is low-risk and can be applied directly. If the migration **modifies existing structures** (column type changes, column renames, index rebuilds on large tables), split it into a multi-phase migration: apply the non-breaking portion before the deployment, apply the breaking portion after the new application version is confirmed stable, clean up the old structures in a subsequent release.

- **At Step 4:** If this is the **first deployment** (no baseline metrics exist), set conservative alert thresholds based on staging performance data and plan to adjust after 48 hours of production data. If this is a **routine deployment** with existing baselines, use 2x-deviation alerts (trigger when a metric deviates by more than 2x from the trailing 7-day average).

- **At Step 6:** If the performance test reveals a **regression under 10%**, document it and proceed with the deployment -- minor regressions may be acceptable given the feature value. If the regression is **between 10-20%**, investigate the root cause before deciding whether to proceed. If the regression **exceeds 20%**, the deployment is blocked until the regression is resolved.

## Failure Handling

- **Step 1 pipeline fails during production deployment:** If the pipeline fails after the approval gate but before the application deployment, no user impact has occurred. Diagnose the pipeline failure (usually a configuration error or expired credential), fix it, and restart the pipeline from the approval gate stage. Do not restart from the beginning -- the build artifact is already verified.

- **Step 2 health checks fail during deployment:** If the new version's health checks fail during the deployment rollout (blue-green: new environment unhealthy, canary: canary instances unhealthy, rolling: new instances fail health checks), the deployment tool should automatically stop the rollout and keep traffic on the old version. Diagnose using the logs from Step 5 -- the health check failure reason should be in the application logs. Common causes: missing environment variable, database connection string error, or missing dependency.

- **Step 3 migration fails on production:** If the migration succeeds on staging but fails on production, the cause is almost always data-related: production has data that staging does not (null values in a column being made NOT NULL, duplicate values violating a new unique constraint, foreign key references to deleted records). Do NOT retry the failed migration. Restore from the pre-migration backup, fix the migration script to handle the production data condition, test on staging with production-like data, and retry.

- **Step 4 monitoring shows regression after deployment completes:** If metrics show regression within the first hour post-deployment, execute the rollback immediately using the procedure from Step 2. Do not wait to see if metrics recover. The cost of a false positive (unnecessary rollback) is much lower than the cost of a false negative (serving degraded service to users while hoping metrics improve). After rolling back, use the logging data from Step 5 to diagnose the root cause without time pressure.

- **Step 6 performance testing reveals unacceptable regression:** If the regression exceeds the threshold from the Decision Points, do NOT deploy to production. Identify the slow endpoints using the performance test breakdown, profile them in staging, optimize, and rerun the performance test. Common causes: missing database index for a new query, N+1 query introduced by a new feature, excessive logging in a hot path.

- **User wants to add a last-minute change before deployment:** Do not add changes after the pipeline has verified the build. Any change requires going back to the beginning: commit the change, run the full pipeline, verify on staging, then proceed through the deployment workflow. The deployment process exists to ensure that every change is tested before reaching production.

## Edge Cases

- **Zero-downtime migration on a large table:** If a migration adds an index or modifies a column on a table with millions of rows, the standard migration will lock the table for seconds to minutes, causing request failures. Use the database's online DDL capability (PostgreSQL: CREATE INDEX CONCURRENTLY, MySQL: ALGORITHM=INPLACE) and run the migration outside the application deployment window. Monitor table lock duration during the migration.

- **Deployment during peak traffic hours:** If the deployment cannot be scheduled during low-traffic hours (maintenance window not available, time zone coverage prevents any low-traffic window), increase the canary duration from 30 minutes to 2 hours and reduce the initial canary percentage from 5% to 1%. Monitor the canary more aggressively and have the rollback command ready to execute immediately.

- **Rollback after a database migration that dropped a column:** If the old application version requires a column that the migration dropped, the standard rollback (revert application code, keep new schema) will fail. This is why Step 3 requires backward-compatible migrations. If this constraint was violated and a rollback is needed, the options are: (1) restore the database from backup (data loss since backup time), (2) re-add the column with a new migration and backfill from logs or audit tables, (3) forward-fix the application issue without rolling back the schema.

- **Multi-service deployment with dependencies:** If the deployment includes changes to multiple services that depend on each other (API server depends on a background worker's new message format), deploy services in dependency order: deploy the producer first (new message format, backward-compatible), verify stability, then deploy the consumer. Never deploy both simultaneously -- if either fails, the rollback is ambiguous.

- **Deployment with feature flags instead of version cutover:** If the new code is deployed but hidden behind feature flags, the deployment risk is lower because the new code path is not active until the flag is enabled. In this case, Step 2's deployment strategy applies to the flag activation (canary the flag to a percentage of users), not the code deployment itself. Step 6 performance testing should test with the flag enabled.

- **First deployment of a new service (no baseline exists):** If this is the initial production deployment with no existing production baseline, Step 4 monitoring must use staging performance data as a proxy baseline. Set alert thresholds conservatively (lower error rate thresholds, tighter response time bounds) and plan to recalibrate after 48-72 hours of real production traffic. Step 6 performance testing compares against load test results rather than production history.

## Expected Outcome

When this workflow is complete, the user will have:

1. A production-hardened CI/CD pipeline with approval gates, environment-specific configuration injection, and enforced deployment sequencing
2. A deployment strategy (blue-green, canary, or rolling) matched to the application's traffic volume and risk tolerance, with documented traffic migration rules
3. Database migrations applied safely with backward compatibility verified, pre-migration backups taken, and rollback scripts tested
4. A deployment monitoring dashboard comparing pre-deployment and post-deployment metrics in real time, with quantitative rollback triggers defined before the deployment starts
5. Structured production logging with deployment version tags on every entry, enabling instant filtering between old and new version logs during the deployment window
6. Performance verification confirming no regressions above the threshold on critical endpoints, with evidence supporting the go/no-go decision
7. A complete deployment runbook documenting the exact procedure, rollback steps, and decision criteria that can be followed by any team member
8. Confidence that future deployments follow the same repeatable, auditable process with monitoring and rollback at every stage

## Output Format

The workflow produces a deployment runbook and monitoring artifacts with this structure:

```
deployment/
  runbook.md                    # Complete deployment procedure with rollback steps
  pre-deployment-checklist.md   # Verification items before starting deployment
  migration/
    migration-plan.md           # Step 3: Migration sequence and rollback strategy
    pre-migration-backup.sql    # Step 3: Database backup taken before migration
  monitoring/
    deployment-dashboard.json   # Step 4: Monitoring dashboard configuration
    alert-rules.yml             # Step 4: Alert definitions with rollback triggers
    rollback-criteria.md        # Step 4: Quantitative rollback decision thresholds
  logging/
    log-config.yml              # Step 5: Structured logging configuration
    deployment-log-queries.md   # Step 5: Log search queries for deployment diagnosis
  performance/
    baseline-report.md          # Step 6: Pre-deployment performance baseline
    test-results.md             # Step 6: Post-deployment performance comparison
    go-nogo-decision.md         # Step 6: Deployment approval with evidence
```

## Example

**Scenario:** "Deploy a new payment processing feature to a SaaS application with 15,000 daily active users, including a database migration that adds a transactions table."

**Input:** Application with new payment feature branch merged, database migration adding transactions table with indexes, 15,000 DAU, PostgreSQL on RDS, application on ECS with ALB, GitHub Actions CI pipeline, Datadog for monitoring. Current deployment: manual SSH and restart.

**Output:** Automated deployment with canary rollout, monitoring dashboard, and documented rollback procedure.

**Step 1 (ci-cd-pipeline-design):**
Audit and harden the GitHub Actions pipeline. Add stages: build and test (existing), deploy to staging (automatic on merge to main), staging verification (automated smoke test hitting 5 critical endpoints), production approval gate (requires team lead approval via GitHub environment protection rule), database migration stage (runs alembic upgrade on production RDS), ECS service update stage (triggers blue-green deployment via CodeDeploy), post-deployment verification stage (runs smoke test against production). Environment variables for production RDS connection, Stripe API keys, and monitoring tokens are stored in GitHub secrets, not in the workflow file.

**Step 2 (deployment-strategies):**
Choose canary deployment for 15,000 DAU. Configure ALB target group with two target groups: stable (current version, 95% traffic) and canary (new version, 5% traffic). Canary duration: 30 minutes at 5%, then 30 minutes at 25%, then 100% if no alerts trigger. Health check: GET /health returns 200 with database connectivity verification within 5 seconds. Rollback procedure: drain canary target group and route 100% to stable. Estimated rollback time: under 60 seconds.

**Step 3 (database-migration-patterns):**
Migration adds transactions table (id, user_id FK, amount_cents, currency, status enum, provider_reference, created_at). Index on user_id, index on (status, created_at) for dashboard queries, index on provider_reference for webhook lookups. Migration is purely additive (new table, no changes to existing tables) -- low risk. Pre-migration: take RDS snapshot. Execute: run alembic upgrade head on production. Post-migration: verify table exists with correct columns and indexes via schema comparison query. Rollback: drop transactions table (no data loss since feature is not yet active).

**Step 4 (monitoring-alerting):**
Create Datadog deployment dashboard with 4 sections: (1) error rate comparison (before vs. after deployment, grouped by endpoint), (2) response time percentiles (p50, p95, p99 by endpoint), (3) ECS task health (running count, CPU, memory per target group), (4) database metrics (connections, query duration, table sizes). Deployment event marker on all graphs at deployment timestamp. Alert rules: error rate above 0.5% for 3 consecutive minutes triggers warning, above 2% triggers critical page. P95 response time above 2 seconds on any payment endpoint triggers critical. Database connection count above 80% of max triggers warning.

**Step 5 (logging-patterns):**
Configure structured JSON logging with fields: timestamp, level, service (payments-api), version (v2.4.0), request_id, user_id (hashed), endpoint, duration_ms, status_code. Add deployment lifecycle logs: "deployment_started" with version and deployer, "migration_completed" with duration and affected tables, "canary_traffic_started" with percentage. Set up Datadog log pipeline to extract version field for filtering old vs. new version logs. Create saved search: "version:v2.4.0 AND level:ERROR" for monitoring new-version errors during canary window.

**Step 6 (performance-testing):**
Run load test against staging with payment feature enabled. Test 5 critical endpoints: POST /v1/payments/initiate, GET /v1/payments/:id, GET /v1/users/:id/transactions, POST /v1/webhooks/stripe, GET /v1/dashboard/revenue. Load: 500 concurrent users for 15 minutes (matches peak production traffic). Results: POST payments/initiate p95 at 340ms (baseline: 0ms, new endpoint -- no regression, within budget), GET dashboard/revenue p95 at 180ms (baseline: 45ms, queries new transactions table -- 4x increase, above 20% threshold). Investigation: missing composite index on transactions(user_id, created_at DESC). Fix: add index, rerun test, p95 drops to 52ms. Go/no-go: GO with the index fix applied. Rerun full pipeline from build stage.

**Result:** Payment processing feature deployed to 15,000 users via canary rollout with zero downtime. Deployment dashboard shows stable error rates and response times throughout the rollout. Performance regression caught and fixed before production deployment. Complete runbook documents the exact rollback procedure for future deployments.
