---
name: devops-pipeline-from-scratch
description: >-
  End-to-end workflow for building a complete DevOps pipeline from an empty
  repository through CI/CD, infrastructure as code, monitoring, alerting, and
  incident response. Covers the full lifecycle from first commit to
  production-grade operations.

  Use when the user wants to devops pipeline from scratch or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  git-workflow github-actions docker-engineer terraform-engineer cicd-architect
  kubernetes-operator monitoring-engineer logging-architect runbook-writer
  incident-responder security-hardener shell-scripter
trigger_phrases: >-
  I want to set up DevOps from scratch I need to build a CI/CD pipeline How do I
  set up infrastructure as code I want to automate my deployments
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: devops ci-cd automation step-by-step planning
  category: software-project
  depends: >-
    git-workflow github-actions docker-engineer terraform-engineer
    cicd-architect kubernetes-operator monitoring-engineer logging-architect
    runbook-writer incident-responder security-hardener shell-scripter
  disclaimer: none
  difficulty: intermediate
---
# Devops Pipeline From Scratch

**Estimated time:** 4-8 weeks

A DevOps pipeline is the backbone of modern software delivery. It automates the journey from code commit to production deployment while maintaining quality, security, and reliability. This workflow builds the pipeline incrementally: start with version control and CI, add containerization and infrastructure as code, implement CD with multiple environments, and finish with monitoring, alerting, and incident response.

Each step builds on the previous one, creating a pipeline that catches bugs early, deploys safely, and alerts you before users notice problems. By the end, you will have a production-grade delivery pipeline that supports multiple deployments per day with confidence.

## When to Use

- User wants to devops pipeline from scratch
- User needs a structured, step-by-step process for devops pipeline from scratch
- User wants to set up DevOps from scratch
- I need to build a CI/CD pipeline
- How do I set up infrastructure as code
- Do NOT use when: the request is outside the scope of devops pipeline from scratch or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A code repository (or application ready to be committed)
- A cloud provider account (AWS, GCP, or Azure)
- Basic familiarity with Git, containers, and command-line tools
- A domain name (optional but recommended for production)
- Budget for cloud infrastructure ($50-200/month for a starter setup)

## Steps

**Step 1: Establish Version Control Standards** (uses: git-workflow)

establish branching strategy, commit conventions, and PR workflow. For most teams, trunk-based development with short-lived feature branches works best. Configure branch protection rules, require PR reviews, and set up Conventional Commits for automated changelog generation. Create PR templates that prompt for testing evidence and deployment notes.

- Input: Team size and collaboration model, Release cadence (daily, weekly, on-demand), Existing codebase or greenfield project
- Output: Branch protection rules configuration, PR template with testing checklist, Commit convention guide (Conventional Commits)
- Key focus: Use the Git Workflow skill to establish branching strategy, commit conventions, and PR workflow

**Step 2: Build the CI Pipeline** (uses: github-actions)

Use the GitHub Actions and CI/CD Architect skills to create a CI pipeline that runs on every push and PR. The pipeline should: install dependencies, run linting and formatting checks, execute unit and integration tests, build the application, and report results. Optimize for speed -- developers should get feedback in under 5 minutes. Use caching aggressively (dependency caches, build caches).

- Input: Language/framework and test runner, Code quality tools (linter, formatter, type checker), Build artifacts (binaries, packages, container images)
- Output: CI workflow file (`.github/workflows/ci.yml`), Caching configuration for dependencies and builds, Test reporting integration
- Key focus: Use the GitHub Actions and CI/CD Architect skills to create a CI pipeline that runs on every push and PR

**Step 3: Containerize the Application** (uses: docker-engineer)

create a production-ready Dockerfile. Use multi-stage builds to separate build and runtime environments. Run as a non-root user. Use distroless or minimal base images. Configure health checks. Create a `.dockerignore` to minimize build context. Set up a docker-compose for local development that mirrors the production environment as closely as possible.

- Input: Application runtime requirements, Build vs runtime dependencies, Security requirements
- Output: Dockerfile (multi-stage, non-root, health check), `.dockerignore`, `docker-compose.yml` for local development
- Key focus: Use the Docker Engineer skill to create a production-ready Dockerfile

**Step 4: Define Infrastructure as Code** (uses: terraform-engineer)

define all infrastructure as code. Start with the networking layer (VPC, subnets, security groups), then compute (ECS/EKS, or VMs), then data (databases, caches), then supporting services (load balancers, DNS, CDN). Use Terraform modules for reusable components. Set up remote state with locking (S3 + DynamoDB for AWS, or Terraform Cloud). Create separate workspaces or state files for staging and production.

- Input: Cloud provider and region selection, Environment requirements (staging, production), Networking and security requirements
- Output: Terraform modules for networking, compute, data, and services, Remote state backend configuration, Environment-specific variable files (staging, production)
- Key focus: Use the Terraform Engineer skill to define all infrastructure as code

**Step 5: Implement CD Pipeline** (uses: cicd-architect)

extend the CI pipeline with continuous deployment. Build the container image, push to a registry, and deploy to staging automatically on merge to main. Use the Kubernetes Operator skill (if using K8s) to define deployment manifests with rolling updates, readiness probes, and resource limits. Production deployment should require manual approval or be triggered by a release tag. Implement deployment notifications (Slack, email).

- Input: Container image from Step 3, Infrastructure from Step 4, Deployment strategy preference (rolling, blue-green, canary)
- Output: CD workflow file (`.github/workflows/deploy.yml`), Container registry configuration, Deployment manifests (Kubernetes or ECS task definitions)
- Key focus: Use the CI/CD Architect skill to extend the CI pipeline with continuous deployment

**Step 6: Add Security Scanning** (uses: security-hardener)

integrate security scanning into the pipeline. Add dependency vulnerability scanning (Dependabot, Snyk, or Trivy), container image scanning, secret detection (gitleaks or truffleHog), and SAST scanning. Configure severity thresholds: block deployment on critical/high, warn on medium, allow low. Set up automated dependency update PRs.

- Input: CI/CD pipeline from Steps 2 and 5, Container image from Step 3, Dependency manifest (package.json, requirements.txt, etc.)
- Output: Dependency scanning configuration, Container image scanning in CI, Secret detection pre-commit hook and CI check
- Key focus: Use the Security Hardener skill to integrate security scanning into the pipeline

**Step 7: Set Up Monitoring and Alerting** (uses: monitoring-engineer)

implement the three pillars of observability: metrics (Prometheus/CloudWatch), logs (structured JSON with correlation IDs), and traces (OpenTelemetry). Build dashboards showing the four golden signals per service. Use the Logging Architect skill to design structured logging with consistent formats, log levels, and correlation IDs. Set up alerts for SLO violations with appropriate severity and routing.

- Input: Deployed application from Step 5, SLIs/SLOs for the application, On-call expectations
- Output: Metrics collection and dashboard configuration, Structured logging implementation, Distributed tracing setup
- Key focus: Use the Monitoring Engineer skill to implement the three pillars of observability: metrics (Prometheus/CloudWatch), logs (structured JSON with correlation IDs), and traces (OpenTelemetry)

**Step 8: Create Runbooks and Incident Response** (uses: runbook-writer)

create operational runbooks for every alert. Each runbook should include: alert description, likely causes, diagnostic steps, resolution steps, and escalation paths. Use the Incident Responder skill to establish an incident response process: severity classification, communication templates, roles (incident commander, communicator, resolver), and post-incident review templates.

- Input: Alerts defined in Step 7, Known failure modes of the application, Team on-call structure
- Output: Runbook per alert (linked from alert annotations), Incident severity classification guide, Incident response playbook with roles and responsibilities
- Key focus: Use the Runbook Writer skill to create operational runbooks for every alert

**Step 9: Optimize and Iterate** (uses: cicd-architect)

measure and optimize DORA metrics: deployment frequency, lead time for changes, change failure rate, and time to restore service. Use the Shell Scripter skill to automate repetitive operational tasks. Identify bottlenecks in the pipeline and address them: slow tests, flaky builds, manual steps that should be automated. Target: multiple deployments per day with < 1% failure rate.

- Input: Pipeline metrics (build time, deployment frequency, failure rate), Team feedback on developer experience, DORA metrics baseline
- Output: DORA metrics dashboard, Pipeline optimization backlog, Automation scripts for common operations
- Key focus: Use the CI/CD Architect skill to measure and optimize DORA metrics: deployment frequency, lead time for changes, change failure rate, and time to restore service

## Decision Points

- **After Step ?:** 
  - If **After Step 2**: Stabilize CI before adding complexity
  - If **After Step 4**: Debug IaC issues in staging before building CD
  - If **After Step 5**: Fix deployment issues before adding security gates
  - If **After Step 7**: Expand monitoring coverage before building runbooks

## Failure Handling

- **Building the whole pipeline at once:** -- Start with CI, then containerize, then add CD. Incremental progress beats delayed perfection.
- **Slow CI feedback:** -- If CI takes 20 minutes, developers stop waiting for it. Optimize aggressively: caching, parallelism, selective testing.
- **No staging environment:** -- Deploying directly to production without a staging environment is playing with fire. Test in staging first.
- **Manual infrastructure changes:** -- Every manual console change is drift waiting to happen. If it is not in Terraform, it does not exist.
- **Alert fatigue:** -- Too many alerts, especially noisy ones, train the team to ignore all alerts. Alert only on conditions that require human action.

## Expected Outcome

When this workflow is complete, the user will have:

1. Deployment to production is automated and takes less than 15 minutes end-to-end
2. Change failure rate is below 5%
3. Mean time to recovery (MTTR) from incidents is under 1 hour
4. Developers get CI feedback in under 5 minutes
5. All infrastructure is defined in code with no manual changes
6. Security scanning catches vulnerabilities before they reach production
7. Every alert has an associated runbook

## Output Format

```
DEVOPS PIPELINE FROM SCRATCH TRACKER
====================================

[ ] Step 1: Establish Version Control Standards
    Status: [pending/in-progress/complete]
[ ] Step 2: Build the CI Pipeline
    Status: [pending/in-progress/complete]
[ ] Step 3: Containerize the Application
    Status: [pending/in-progress/complete]
[ ] Step 4: Define Infrastructure as Code
    Status: [pending/in-progress/complete]
[ ] Step 5: Implement CD Pipeline
    Status: [pending/in-progress/complete]
[ ] Step 6: Add Security Scanning
    Status: [pending/in-progress/complete]
[ ] Step 7: Set Up Monitoring and Alerting
    Status: [pending/in-progress/complete]
[ ] Step 8: Create Runbooks and Incident Response
    Status: [pending/in-progress/complete]
[ ] Step 9: Optimize and Iterate
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Building the whole pipeline at once:** -- Start with CI, then containerize, then add CD. Incremental progress beats delayed perfection.
- **Slow CI feedback:** -- If CI takes 20 minutes, developers stop waiting for it. Optimize aggressively: caching, parallelism, selective testing.
- **No staging environment:** -- Deploying directly to production without a staging environment is playing with fire. Test in staging first.
- **Manual infrastructure changes:** -- Every manual console change is drift waiting to happen. If it is not in Terraform, it does not exist.

## Example

**Input:** "I want to devops pipeline from scratch and need a structured plan to follow step by step."

**Output:**

**Step 1 (git-workflow):** Establish Version Control Standards -- produces concrete deliverables for this phase.

**Step 2 (github-actions-cicd-architect):** Build the CI Pipeline -- produces concrete deliverables for this phase.

**Step 3 (docker-engineer):** Containerize the Application -- produces concrete deliverables for this phase.

**Step 4 (terraform-engineer):** Define Infrastructure as Code -- produces concrete deliverables for this phase.

**Step 5 (cicd-architect-kubernetes-operator):** Implement CD Pipeline -- produces concrete deliverables for this phase.

**Step 6 (security-hardener):** Add Security Scanning -- produces concrete deliverables for this phase.

**Step 7 (monitoring-engineer-logging-architect):** Set Up Monitoring and Alerting -- produces concrete deliverables for this phase.

**Step 8 (runbook-writer-incident-responder):** Create Runbooks and Incident Response -- produces concrete deliverables for this phase.

**Step 9 (cicd-architect-shell-scripter):** Optimize and Iterate -- produces concrete deliverables for this phase.

**Result:** User has a complete devops pipeline from scratch plan with all deliverables produced, validated, and ready for implementation.
