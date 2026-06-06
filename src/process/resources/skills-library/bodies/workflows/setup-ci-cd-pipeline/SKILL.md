---
name: setup-ci-cd-pipeline
description: >-
  Orchestrates the creation of a complete CI/CD pipeline from scratch by
  chaining five DevOps skills into a structured automation pipeline. Covers
  pipeline architecture design, workflow configuration, containerization,
  deployment strategy, and production monitoring.
  Use when the user needs to set up automated build, test, and deployment
  from zero or replace a manual deployment process.
  Do NOT use for tweaking an existing pipeline or adding a single CI job
  to an established workflow.
license: Apache-2.0
type: workflow
skills: ci-cd-pipeline-design github-actions docker-engineer deployment-strategies monitoring-alerting
trigger_phrases: setup ci cd pipeline create deployment pipeline automate builds and deploys continuous integration setup
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: devops ci-cd automation cloud step-by-step
  category: software-project
  depends: ci-cd-pipeline-design github-actions docker-engineer deployment-strategies monitoring-alerting
  disclaimer: none
  difficulty: intermediate
---

# Set Up CI/CD Pipeline

**Estimated time:** 2-5 days (depending on project complexity and deployment target)

This workflow chains five atomic skills into the process of creating a complete CI/CD pipeline from scratch. It covers the full path from pipeline architecture through workflow configuration, containerization, deployment automation, and production monitoring integration. By the end, every code push triggers automated builds, tests, and deployments with observability at every stage.

## When to Use

- User needs to set up automated builds, tests, and deployments for a project with no existing CI/CD
- User is replacing a manual deployment process with automation
- User wants to establish a deployment pipeline for a new project from the start
- User needs to containerize an application and automate its deployment
- Do NOT use when: optimizing an existing pipeline (adjust the pipeline directly), adding a single CI step to an established workflow, or the project is a static site that only needs a hosting platform's built-in deployment

## Prerequisites

Before starting this workflow, ensure:

1. **Source code is in a Git repository:** The project is version-controlled in a Git hosting platform (GitHub, GitLab, or Bitbucket) with at least one branch
2. **Application can be built and run locally:** You have a working development environment where the application compiles, runs, and tests pass manually
3. **Deployment target is identified:** You know where the application will run in production (cloud provider, container orchestrator, PaaS, or VPS)
4. **Credentials are available:** You have access credentials for the deployment target and any external services the pipeline needs (container registry, cloud provider, monitoring platform)

## Steps

**Step 1: Design the Pipeline Architecture** (uses: ci-cd-pipeline-design)

Define the pipeline stages, triggers, environments, and artifacts. This step produces the blueprint for the entire CI/CD system, establishing what runs when and what gates must pass before code reaches production.

- Input: Project technology stack, repository structure, deployment target, team branching strategy, current manual deployment steps
- Output: Pipeline architecture document with: stage definitions (build, test, security scan, deploy staging, deploy production), trigger rules (which branches trigger which stages), environment definitions (staging, production), artifact strategy (what is built, where it is stored), and gate criteria (what must pass before promotion to the next stage)
- Key focus: Design for fast feedback. The full pipeline should complete in under 15 minutes. If the test suite is slow, split it into tiers: fast unit tests (under 2 minutes, run on every push), integration tests (under 10 minutes, run on pull requests), and comprehensive tests (run nightly). Every stage should have a clear pass/fail criterion.

**Step 2: Configure CI Workflows** (uses: github-actions)

Implement the pipeline architecture from Step 1 as workflow configuration files. This step translates the pipeline design into concrete CI definitions with proper caching, parallelization, and secret management.

- Input: Pipeline architecture from Step 1, repository structure, technology-specific build commands, test commands, linting commands
- Output: CI workflow files with: build and lint stage, unit test stage with coverage reporting, integration test stage, security scanning stage (dependency audit, secret detection), artifact publishing stage, and proper caching for dependencies and build outputs
- Key focus: Configure dependency caching to speed up repeated runs (cache node_modules, pip packages, Go modules). Use matrix builds for multi-version testing if the project supports multiple runtime versions. Store secrets in the CI platform's secret management, never in workflow files.

**Step 3: Containerize the Application** (uses: docker-engineer)

Package the application into a container image that can be deployed consistently across environments. This step creates the container definition, optimizes the image size, and configures the container registry.

- Input: Application source code and build process, deployment target requirements, base image selection criteria (size, security, compatibility)
- Output: Container image with: optimized multi-stage build (build stage for compilation, runtime stage for execution), minimal base image, non-root user configuration, health check endpoint, environment variable configuration, and container registry push configuration
- Key focus: Use multi-stage builds to keep production images small (separate build dependencies from runtime dependencies). Pin base image versions to specific digests for reproducibility. Include a health check that verifies the application is ready to serve traffic, not just that the process is running.

**Step 4: Configure Deployment Automation** (uses: deployment-strategies)

Set up automated deployment from the CI pipeline to staging and production environments. This step implements the deployment strategy selected in Step 1, including traffic management, health verification, and rollback automation.

- Input: Container image from Step 3, deployment target infrastructure, pipeline configuration from Step 2, staging and production environment definitions
- Output: Deployment automation with: staging auto-deploy on merge to main, production deploy with manual approval gate, health check verification after deployment, automatic rollback on health check failure, and environment-specific configuration management
- Key focus: Staging deploys automatically to enable continuous testing. Production deploys require explicit approval even for solo developers (the approval step forces verification of staging behavior). Configure deployment health checks to wait for the application to serve at least one successful request before declaring the deployment healthy.

**Step 5: Integrate Production Monitoring** (uses: monitoring-alerting)

Connect the deployed application to monitoring and alerting so that pipeline deployments are verified by production metrics. This step closes the feedback loop between deployment and observability.

- Input: Deployed application from Step 4, monitoring platform credentials, baseline performance expectations, critical user paths to monitor
- Output: Monitoring integration with: deployment event markers in dashboards (show when deployments happened), post-deployment metric verification (automated check that error rate and latency did not worsen), alert rules for deployment regressions (error rate spike within 30 minutes of deployment triggers rollback alert), and pipeline status dashboard showing last deployment, current health, and deployment frequency
- Key focus: Configure deployment markers in the monitoring platform so that metric anomalies can be correlated with deployments. Add a post-deployment verification step to the pipeline that checks monitoring metrics 5-10 minutes after deployment and fails the pipeline if error rates increased.

## Decision Points

- **Before Step 1:** If the project has no tests, pause and write at minimum a smoke test before setting up CI. A pipeline that only builds without testing provides limited value.

- **At Step 2:** Choose the CI platform based on where the code is hosted. GitHub repositories benefit most from GitHub Actions (native integration, no additional accounts). GitLab repositories benefit from GitLab CI. For multi-platform teams, consider a platform-agnostic tool.

- **At Step 3:** If the application is a static site or serverless functions, skip containerization. Deploy static assets directly to a CDN and serverless functions directly to the cloud provider. Containerization adds overhead that these deployment models do not need.

- **At Step 4:** Choose the deployment strategy based on risk tolerance. Rolling updates work for most applications. Blue-green deployments add reliability for zero-downtime requirements. Canary deployments add safety for high-traffic applications where a bad deployment affects many users.

## Failure Handling

- **Step 1 design is overengineered:** If the pipeline design has more than 6 stages for a small project, simplify. A three-stage pipeline (build-test-deploy) is sufficient for most projects. Add stages incrementally as the project grows.

- **Step 2 builds are slow (over 15 minutes):** Profile the pipeline to find the bottleneck. Common causes: no dependency caching (adding cache cuts 50-70 percent of build time), sequential test stages that can run in parallel, or large container image pulls that can be cached.

- **Step 3 container image is too large (over 500MB):** Switch to a smaller base image (Alpine Linux, distroless, or slim variants). Verify that multi-stage builds exclude build tools from the production image. Check for accidentally included development dependencies.

- **Step 4 deployment fails intermittently:** Check for race conditions in the deployment process: database migrations running concurrently with application startup, health checks timing out before the application is ready (increase health check grace period), or resource limits that are too tight for startup.

- **Step 5 monitoring produces too many false alerts:** Raise alert thresholds based on observed baseline behavior rather than theoretical values. Only alert on conditions that require human action. Use warning thresholds for awareness and critical thresholds for pages.

## Expected Outcome

When this workflow is complete, the user will have:

1. A documented pipeline architecture with stage definitions, triggers, and promotion gates
2. CI workflow files that automate building, testing, linting, and security scanning on every push
3. A containerized application with optimized image, health checks, and registry configuration
4. Automated deployment to staging (on merge) and production (with approval gate) with rollback capability
5. Monitoring integration with deployment markers, post-deployment verification, and alert rules for deployment regressions

## Output Format

```
CI/CD PIPELINE SETUP
=====================

Project: [project name]
Repository: [repository URL]
CI Platform: [platform name]
Deployment Target: [target description]

[ ] Step 1: Pipeline Architecture
    Status: [pending/in-progress/complete]
    Stages: [build -> test -> scan -> deploy-staging -> deploy-prod]
    Total pipeline time: ____ minutes

[ ] Step 2: CI Workflows
    Status: [pending/in-progress/complete]
    Workflow files: [list]
    Caching: [enabled/disabled]

[ ] Step 3: Containerization
    Status: [pending/in-progress/complete]
    Image size: ____ MB
    Base image: [image name]
    Registry: [registry URL]

[ ] Step 4: Deployment Automation
    Status: [pending/in-progress/complete]
    Strategy: [rolling/blue-green/canary]
    Staging: [auto-deploy on merge]
    Production: [manual approval gate]

[ ] Step 5: Monitoring Integration
    Status: [pending/in-progress/complete]
    Deployment markers: [configured/pending]
    Post-deploy verification: [enabled/disabled]

Timeline: ______ days
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Skip Step 3 for serverless or static site deployments
- For monorepos, design per-service pipelines with shared stages in Step 1
- Start with minimal configuration and add stages incrementally

## Edge Cases

- **Monorepo with multiple services:** Design pipeline triggers that detect which service changed and only build/test/deploy that service. Use path-based triggers in Step 2 to avoid rebuilding unaffected services.
- **Legacy project with no Dockerfile:** In Step 3, start with the simplest possible container (copy build output into a runtime base image). Optimize iteratively after the basic pipeline works end to end.
- **Multiple deployment environments (dev, staging, QA, prod):** Define environment promotion in Step 1 as a linear pipeline with gates. Each environment is a stage that must pass before promotion to the next.
- **Budget constraints (free tier only):** Use the CI platform's free tier with concurrency limits. Optimize pipeline duration aggressively in Step 2 (caching, parallelization) to stay within free-tier minutes.
- **Compliance requirements (audit trail, signed artifacts):** Add artifact signing and audit logging stages in Step 2. Configure the container registry to enforce signed images only. Document the compliance chain from commit to deployment.

## Example

**Scenario:** "Set up CI/CD for a Node.js API project that currently deploys via manual SSH and file copy. The team of 2 developers wants automated testing, containerized deployment to AWS, and monitoring."

**Input:** Node.js Express API with PostgreSQL, hosted on GitHub, currently deployed by copying files to an EC2 instance via SSH. 15 unit tests exist but are only run manually. Team wants automated deploys to ECS with proper staging environment. Budget: $100/month for infrastructure.

**Output:** Complete CI/CD pipeline from code push to production deployment with monitoring.

**Step 1 (ci-cd-pipeline-design):** Pipeline architecture: 4 stages. Stage 1 (build-and-lint, 1 minute): install dependencies, run linter, compile TypeScript. Stage 2 (test, 3 minutes): run unit tests with coverage, run integration tests against test database. Stage 3 (build-image, 2 minutes): build container image, push to ECR. Stage 4 (deploy): auto-deploy to staging on merge to main, manual approval for production. Total pipeline time target: 8 minutes.

**Step 2 (github-actions):** Created .github/workflows/ci.yml with: Node.js 20 setup, dependency caching (saves 45 seconds per run), parallel lint and test jobs, coverage reporting to PR comments. Created .github/workflows/deploy.yml with: ECR image build and push, ECS service update for staging (automatic), ECS service update for production (on workflow_dispatch with environment approval). Secrets configured: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, ECR_REGISTRY.

**Step 3 (docker-engineer):** Multi-stage Dockerfile: stage 1 (node:20-alpine) installs dependencies and compiles TypeScript, stage 2 (node:20-alpine) copies only compiled output and production dependencies. Final image size: 127MB (down from 890MB single-stage). Health check: /health endpoint returns 200 with database connectivity verification. Non-root user configured for container security.

**Step 4 (deployment-strategies):** ECS service configured with rolling update (minimum healthy percent 100, maximum percent 200). Staging environment auto-deploys on merge to main. Production requires manual approval through GitHub environment protection rules. Health check configured: 30-second interval, 3 consecutive healthy checks required, 5-minute deregistration delay for graceful shutdown. Rollback: ECS automatically rolls back if new task definition fails health checks.

**Step 5 (monitoring-alerting):** CloudWatch configured with: ECS task metrics (CPU, memory, restarts), application metrics via custom metrics (request count, error rate, response time percentiles). Deployment event markers added via CloudWatch Annotations API (triggered by deploy workflow). Alert rules: error rate above 2 percent for 5 minutes triggers Slack notification, ECS task restart count above 3 in 10 minutes triggers investigation alert. Dashboard created showing deployment timeline alongside error rate and response time graphs.

**Result:** Complete CI/CD pipeline operational. Code push to production deployment in 8 minutes. Manual SSH deployment eliminated. First automated deployment caught a failing test that would have reached production under the old manual process. Team deploys 3 times per week (up from weekly manual deploys) with confidence in the automated verification.
