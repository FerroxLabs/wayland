---
name: github-actions-patterns
description: |
  Guides expert-level github actions patterns implementation: ci-cd and cloud decision frameworks, production-ready patterns, and concrete templates for github actions patterns workflows.
  Use when the user asks about github actions patterns, github actions patterns configuration, or ci-cd best practices for github projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ci-cd devops cloud"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# GitHub Actions Patterns

## When to Use

**Use this skill when:**
- User asks how to structure a GitHub Actions workflow for a real project -- CI pipeline, CD pipeline, or both
- User wants to implement reusable workflows, composite actions, or matrix builds across multiple repositories
- User needs to design environment promotion pipelines (dev → staging → production) with approval gates
- User asks about caching strategies, artifact management, or reducing workflow run time in GitHub Actions
- User wants to implement secure secrets management, OIDC authentication, or least-privilege permissions in Actions
- User asks about concurrency controls, workflow triggers, and avoiding redundant runs
- User wants to migrate from Jenkins, CircleCI, GitLab CI, or another CI/CD platform to GitHub Actions
- User needs to implement release automation, semantic versioning, or changelog generation via Actions
- User asks about self-hosted runners, runner scaling, or cost optimization for GitHub Actions usage

**Do NOT use this skill when:**
- User needs Kubernetes deployment patterns -- use the kubernetes-deployment skill in devops-cloud
- User needs container build optimization (Dockerfile best practices) -- use the docker-containerization skill
- User needs infrastructure-as-code patterns with Terraform or Pulumi -- use the infrastructure-as-code skill
- User is asking about GitLab CI, Jenkins, CircleCI, or another CI platform specifically -- this skill is GitHub Actions only
- User needs repository management, branch protection rules, or GitHub administration outside of Actions
- User wants general Git workflow advice (branching strategies, commit conventions) unrelated to automation
- User needs monitoring and observability patterns post-deployment -- use the observability skill
- User is asking about secrets management systems (HashiCorp Vault, AWS Secrets Manager) as standalone products -- focus is on their integration within Actions

---

## Process

### 1. Assess the Workflow Requirements

Before writing a single YAML line, understand what you are automating:

- **Identify all trigger events** -- `push`, `pull_request`, `workflow_dispatch`, `schedule`, `release`, `workflow_call`. Each has different behavior and security implications. Pull request workflows from forks have restricted secrets access by default.
- **Map the pipeline stages** -- Determine the exact sequence: lint → unit test → integration test → build → security scan → deploy → smoke test. Know which stages must be sequential and which can be parallelized as jobs.
- **Quantify performance budgets** -- A developer feedback loop exceeding 10 minutes for a CI run degrades productivity significantly. Set a target: most unit test + lint pipelines should complete in under 5 minutes; full integration pipelines in under 15 minutes.
- **Identify environment targets** -- How many environments exist (dev, staging, production)? Which require manual approval gates? Which deploy automatically on merge to main?
- **Enumerate external system dependencies** -- Container registries, cloud providers (AWS, GCP, Azure), package registries (npm, PyPI, Maven), notification systems (Slack, PagerDuty). Each requires a secrets strategy.
- **Determine team structure** -- Does the organization use a monorepo or many repos? Monorepos need path filtering to avoid running all pipelines on every commit. Multi-repo setups benefit from reusable workflow standardization across the organization.

### 2. Choose the Right Workflow Architecture

Select the architectural pattern that matches the project's complexity and team structure:

- **Single-file linear pipeline** -- Appropriate for small projects with one application, one deployment target, and a team of 1-3 engineers. All jobs in `.github/workflows/ci.yml`. Simple, easy to debug, limited reuse.
- **Split CI/CD files** -- Separate `ci.yml` (triggered on PR and push to branches) from `cd.yml` (triggered on push to main or tag creation). This is the most common pattern for 4-15 engineer teams. CD workflows call CI as a prerequisite using `needs:`.
- **Reusable workflow pattern** -- For organizations with 3+ repositories following similar tech stacks. Create a `.github/workflows` directory in a central `platform-workflows` repository. Individual repos call these via `uses: org/platform-workflows/.github/workflows/node-ci.yml@v2`. Versioned with semantic tags.
- **Composite action pattern** -- For logic that needs to be embedded within a job's steps (not as a separate job). Package as an action in a repository with `action.yml`. Use when you need to share 3-10 steps that must run in the same runner environment as the calling job.
- **Matrix strategy pattern** -- For testing across multiple versions, operating systems, or configuration combinations. Use when you need to test Node 18/20/22, or Linux/macOS/Windows, or multiple database versions. Keep matrix size practical -- beyond 20 combinations, consider whether all are necessary.
- **Fan-out/fan-in pattern** -- Parallelize independent jobs (unit tests, linting, security scanning, type checking) then gate the final deployment on all succeeding. Use `needs: [lint, test, security-scan]` on the deploy job.

### 3. Design Trigger and Concurrency Controls

Poorly designed triggers are the most common source of wasted CI minutes and developer confusion:

- **Restrict push triggers to relevant branches** -- Never use `on: push` without branch filters in production workflows. Use `branches: [main, 'release/**']` to avoid triggering on every feature branch push.
- **Use path filtering for monorepos** -- `paths: ['apps/api/**', 'packages/shared/**']` prevents the API pipeline from running when only the frontend changes. Combine with `paths-ignore: ['**/*.md', 'docs/**']` to skip documentation-only commits.
- **Implement concurrency groups** -- Add `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` to all CI workflows. This cancels the previous run for the same branch when a new commit is pushed, saving runner time and reducing noise.
- **Use `workflow_dispatch` inputs for manual control** -- Production deployments should always support manual triggering with explicit environment selection. Define `inputs:` with `type: choice` and `options: [staging, production]` rather than inferring from the branch.
- **Protect against fork PR abuse** -- Workflows triggered by `pull_request` from forks cannot access secrets. Use `pull_request_target` only when necessary and with extreme caution -- it runs with base branch code and has access to secrets, creating a significant injection risk. Add explicit `head.repo.full_name` checks.
- **Schedule jobs defensively** -- `schedule: cron` triggers do not run on the default branch automatically; they run on the last commit to that branch. Add `if: github.repository == 'org/repo'` to prevent forks from running your scheduled jobs.

### 4. Implement Caching and Artifact Management

Caching is the highest-ROI optimization in most GitHub Actions workflows:

- **Cache dependency managers correctly** -- The cache key must include the lockfile hash, not the manifest. For Node.js: `key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`. For Python: `key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}`. For Maven: `key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}`.
- **Use `restore-keys` for partial cache hits** -- `restore-keys: ${{ runner.os }}-node-` allows using a stale cache when the lockfile changes, which is faster than downloading from scratch. The cache will be updated on the next successful run.
- **Prefer `actions/setup-*` built-in caching** -- `actions/setup-node@v4` with `cache: 'npm'` handles the correct cache path and key generation automatically. Use built-in caching when available before implementing custom cache steps.
- **Cache Docker layers for container builds** -- Use `cache-from: type=gha` and `cache-to: type=gha,mode=max` with `docker/build-push-action`. This can reduce container build times from 8-10 minutes to under 2 minutes for incremental changes.
- **Use artifacts for cross-job handoffs** -- Use `actions/upload-artifact` and `actions/download-artifact` to pass build outputs between jobs. Set `retention-days: 1` for temporary artifacts (test results, coverage reports) and `retention-days: 30` for release artifacts. Artifacts count against storage quotas.
- **Never use artifacts for secrets** -- If a build step produces a file containing credentials, do not upload it as an artifact under any circumstances.
- **Cache test results for re-runs** -- For expensive test suites, upload test result XML and use test splitting tools (pytest-split, jest --shard) combined with matrix jobs to parallelize. A 10-minute pytest suite can often be split into 4 parallel jobs of ~3 minutes each.

### 5. Implement Security Controls

GitHub Actions workflows are frequent attack targets; apply security in depth:

- **Use OIDC instead of long-lived credentials** -- For AWS, GCP, and Azure, configure OpenID Connect federation so Actions can assume IAM roles or workload identity without storing static credentials. AWS example: `aws-actions/configure-aws-credentials@v4` with `role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy`. This eliminates the most common class of credentials leak.
- **Pin action versions to full commit SHAs, not tags** -- `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (the SHA for v4.2.2) instead of `uses: actions/checkout@v4`. Tags are mutable and can be moved by a compromised third-party action author. Use a tool like `pin-github-action` or Dependabot to manage pinned versions.
- **Set minimum workflow permissions** -- Add `permissions: read-all` at the workflow level and grant specific permissions to jobs that need them. A deploy job needs `id-token: write` for OIDC and `contents: read`. A release job needs `contents: write`. Never use the default `permissions: write-all`.
- **Sanitize inputs in `workflow_dispatch`** -- Treat `${{ github.event.inputs.environment }}` as untrusted user input. Validate against an allowlist before using in shell commands. Use `${{ env.VAR }}` to pass validated values to shell rather than `${{ inputs.VAR }}` directly, which can lead to expression injection.
- **Use `pull_request` (not `pull_request_target`) for untrusted code** -- `pull_request` checks out the fork's code but runs without secrets. If you need secrets for a PR check (e.g., posting coverage comments), use the two-workflow pattern: CI runs on `pull_request` and uploads artifacts; a second workflow runs on `workflow_run` with secrets and downloads the artifact.
- **Rotate secrets and audit access** -- Secrets defined at the organization level are accessible to all repos. Prefer repository-level secrets for production credentials. Audit which workflows use which secrets in quarterly reviews.
- **Enable required status checks** -- Configure branch protection rules to require your CI workflow's jobs to pass before merging. Name jobs explicitly (not rely on the default) so they are stable references in branch protection.

### 6. Design Deployment Workflows

Deployment workflows require explicit environment promotion, approval gates, and rollback capability:

- **Use GitHub Environments** -- Define `environment: production` in deploy jobs. This gates deployment on configured reviewers, limits which branches can deploy, and provides a deployment audit trail in the GitHub UI. Environment-specific secrets are only available to jobs targeting that environment.
- **Implement the standard promotion flow** -- A release branch push triggers staging deployment automatically. Production deployment is triggered by either a tag push (`v*.*.*`) or a `workflow_dispatch` with explicit production selection. Never auto-deploy to production on every `main` merge unless the team has mature rollback and monitoring.
- **Build once, deploy many** -- Build the container or artifact once in CI, push to a registry with a content-addressed tag (git SHA: `sha-${{ github.sha }}`), then reference that exact tag in all deployment jobs. Never rebuild for each environment -- this risks divergence between what was tested and what was deployed.
- **Add smoke tests after deployment** -- After deploying to staging, run a `smoke-test` job that hits key endpoints and asserts expected HTTP status codes. Gate production deployment on staging smoke tests passing. A 2-minute smoke test catches 80% of critical deployment failures.
- **Implement structured rollback** -- Every deploy workflow should have a manually-triggerable rollback step. For container-based deployments, this means re-deploying the previous image SHA. Store the last successful deploy SHA as a GitHub Actions variable or in a state file in the repository.
- **Use deployment status APIs** -- Call `actions/github-script` to create deployment and deployment_status objects. This integrates with GitHub's deployment tracking, Slack notifications, and third-party services like Datadog.

### 7. Implement Reusability Patterns

Reusability eliminates configuration drift across multiple repositories:

- **Create caller/callee reusable workflows** -- A callee workflow uses `on: workflow_call:` with defined `inputs:` and `secrets:`. The caller uses `uses: org/workflows/.github/workflows/deploy-node.yml@v3` with `with:` and `secrets: inherit`. Inputs should be typed: `type: string`, `type: boolean`, `type: number`. Default values should cover the common case.
- **Version reusable workflows with tags** -- Never call a reusable workflow on `@main` in production. Pin to a semantic version tag (`@v2`, `@v2.1`). Use major version tags that float to the latest compatible minor version, following the same convention as public actions. Maintain a `CHANGELOG.md` in the workflows repository.
- **Write composite actions for shared steps** -- A `setup-node-project` composite action that runs `actions/setup-node`, `npm ci`, and sets up caching eliminates 4-6 repeated lines in every workflow. Define in `action.yml` at the repository root or in a `.github/actions/setup-node-project/` subdirectory.
- **Use action inputs with defaults** -- Composite action `action.yml` inputs should have sensible defaults: `node-version: '20'`, `working-directory: '.'`. This makes calling the action concise for the common case while remaining flexible.
- **Parameterize environment differences** -- In reusable workflows, accept `environment`, `aws-region`, `eks-cluster-name` as inputs rather than hardcoding them. The caller provides environment-specific values, and the reusable workflow contains the deployment logic. This is the key to consistent cross-environment deployments.
- **Test reusable workflows before releasing** -- Create a `test-caller.yml` workflow in the workflows repository that calls the reusable workflows on every PR. Use a test repository or a dedicated non-production environment to validate changes before tagging a new version.

### 8. Optimize for Performance and Cost

GitHub Actions billing is per-minute on private repositories; optimization has direct cost impact:

- **Move expensive steps to later in the pipeline** -- Run linting and static analysis (fast, typically 30-60 seconds) before running tests (slow, 2-15 minutes). If linting fails, tests never run, saving minutes. Order jobs by: syntax/lint → unit test → integration test → security scan → build → deploy.
- **Use job-level `if` conditions to skip unnecessary work** -- `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` on the deploy job ensures it only runs on main branch pushes, not on every PR commit.
- **Right-size runners** -- GitHub-hosted `ubuntu-latest` (2-core, 7GB RAM) is adequate for most CI tasks. Use `ubuntu-22.04-8core` (available on Teams/Enterprise) only for build-heavy jobs. Self-hosted runners on spot/preemptible instances cost 60-80% less than GitHub-hosted for high-volume pipelines.
- **Parallelize with matrix strategy** -- `strategy: { matrix: { shard: [1, 2, 3, 4] } }` combined with Jest's `--shard=${{ matrix.shard }}/4` or pytest-split's `--splits 4 --group ${{ matrix.shard }}` reduces test wall time proportionally to the number of shards up to the point of setup overhead (typically 4-8 shards is optimal).
- **Set `fail-fast: false` on matrices selectively** -- `fail-fast: true` (the default) cancels other matrix jobs when one fails, saving runner time during normal CI. Set `fail-fast: false` when you need to see results across all matrix dimensions (e.g., compatibility testing across multiple OS/version combinations).
- **Use `timeout-minutes`** -- Every job should have `timeout-minutes: 30` (or a tighter bound). A hung integration test without a timeout consumes runner minutes for up to 6 hours (the GitHub default). Set the timeout to 2x the expected maximum job duration.

---

## Output Format

When producing GitHub Actions workflow files, use this structure:

```yaml
# .github/workflows/{workflow-name}.yml
# Purpose: {one-line description of what this workflow does}
# Triggers: {which events trigger this}
# Environments: {which environments this touches}

name: {Human Readable Workflow Name}

on:
  push:
    branches: [main, 'release/**']
    paths-ignore: ['**/*.md', 'docs/**']
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target deployment environment'
        type: choice
        options: [staging, production]
        required: true
        default: staging

# Restrict default permissions; grant per-job as needed
permissions:
  contents: read

# Cancel previous runs for the same workflow + branch
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  # Global environment variables available to all jobs
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint and Type Check
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    steps:
      - name: Checkout code
        uses: actions/checkout@{PINNED_SHA}

      - name: Set up Node.js
        uses: actions/setup-node@{PINNED_SHA}
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npm run typecheck

  test:
    name: Unit Tests (Shard ${{ matrix.shard }}/${{ strategy.job-total }})
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    needs: [lint]
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - name: Checkout code
        uses: actions/checkout@{PINNED_SHA}

      - name: Set up Node.js
        uses: actions/setup-node@{PINNED_SHA}
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests (shard ${{ matrix.shard }}/4)
        run: npm test -- --shard=${{ matrix.shard }}/4 --coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@{PINNED_SHA}
        if: always()
        with:
          name: coverage-shard-${{ matrix.shard }}
          path: coverage/
          retention-days: 1

  build:
    name: Build and Push Container Image
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    needs: [lint, test]
    permissions:
      contents: read
      packages: write
      id-token: write  # Required for OIDC
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build-push.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@{PINNED_SHA}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@{PINNED_SHA}

      - name: Log in to Container Registry
        uses: docker/login-action@{PINNED_SHA}
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@{PINNED_SHA}
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-,format=short
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push image
        id: build-push
        uses: docker/build-push-action@{PINNED_SHA}
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://staging.example.com
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@{PINNED_SHA}
        with:
          role-to-assume: arn:aws:iam::${{ vars.AWS_ACCOUNT_ID }}:role/github-actions-staging-deploy
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ vars.ECS_CLUSTER }} \
            --service ${{ vars.ECS_SERVICE }} \
            --force-new-deployment

  smoke-test:
    name: Staging Smoke Test
    runs-on: ubuntu-22.04
    timeout-minutes: 5
    needs: [deploy-staging]
    steps:
      - name: Wait for service stability
        run: sleep 30

      - name: Run smoke tests
        run: |
          curl --fail --max-time 10 https://staging.example.com/health
          curl --fail --max-time 10 https://staging.example.com/api/v1/status

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    needs: [smoke-test]
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://example.com
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@{PINNED_SHA}
        with:
          role-to-assume: arn:aws:iam::${{ vars.AWS_ACCOUNT_ID }}:role/github-actions-production-deploy
          aws-region: us-east-1

      - name: Deploy to production ECS
        run: |
          aws ecs update-service \
            --cluster ${{ vars.ECS_CLUSTER_PROD }} \
            --service ${{ vars.ECS_SERVICE_PROD }} \
            --force-new-deployment
```

Decision matrix for workflow architecture:

| Factor | Single-file pipeline | Split CI/CD | Reusable workflows |
|---|---|---|---|
| Team size | 1-3 engineers | 4-15 engineers | 10+ engineers or 3+ repos |
| Repository count | 1 repo | 1-3 repos | 3+ repos |
| Maintenance overhead | Low | Medium | Medium (high initial, low ongoing) |
| Flexibility | High | High | Medium (contract-bound) |
| Drift prevention | N/A | Manual | Enforced by shared caller |
| When to choose | Greenfield / prototype | Standard production app | Platform teams, org standardization |

---

## Rules

1. **NEVER use mutable action tags in production workflows** -- `uses: actions/checkout@v4` is a mutable pointer; a compromised publisher can redirect it. Always pin to a full commit SHA and use Dependabot to manage upgrades: `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683`.

2. **NEVER store secrets in `env:` at the workflow level if the workflow has `pull_request_target` triggers** -- Environment-level `env:` blocks expose secrets to all jobs including potentially untrusted fork code. Gate secrets inside specific job steps with explicit trust checks.

3. **ALWAYS set `timeout-minutes` on every job** -- The GitHub default timeout is 6 hours. A hung Docker build or a test waiting for a TCP connection that never comes will consume 6 hours of runner minutes. Set timeouts to 2x the expected P99 job duration.

4. **NEVER rebuild artifacts between deployment environments** -- Build once (tagged with the git SHA), push to a registry, then reference the immutable SHA tag in all subsequent deployment jobs. Rebuilding introduces the risk that staging and production run different code from the same commit.

5. **ALWAYS use `concurrency:` with `cancel-in-progress: true` for branch CI** -- Without concurrency groups, pushing 5 commits in rapid succession (common during rebasing or fixing linting issues) queues 5 concurrent workflow runs, consuming 5x the runner minutes. Exception: do NOT set `cancel-in-progress: true` for deployment workflows, where an in-progress deploy should not be cancelled.

6. **NEVER use `pull_request_target` without validating `github.event.pull_request.head.repo.full_name`** -- `pull_request_target` runs with base branch secrets and is the most commonly exploited GitHub Actions misconfiguration. If you must use it, add: `if: github.event.pull_request.head.repo.full_name == github.repository` to restrict it to non-fork PRs.

7. **ALWAYS use the `workflow_call` event with typed inputs for reusable workflows** -- Untyped inputs default to string and allow callers to pass unexpected values. Define `type: boolean`, `type: number`, or `type: choice` with `options:` lists to constrain caller behavior and catch misconfiguration at runtime.

8. **NEVER use `continue-on-error: true` on security scanning steps** -- `continue-on-error` is appropriate for informational steps (e.g., posting a coverage badge that might fail due to a network issue), but security scan failures must block the pipeline. Using `continue-on-error` on Trivy, Snyk, or SAST steps creates a false sense of security.

9. **ALWAYS store non-secret configuration in GitHub Actions Variables (`vars.`)** -- Secrets (credentials, tokens) belong in GitHub Secrets. Non-secret configuration (AWS account IDs, cluster names, ECR repository names, feature flags) belongs in GitHub Variables (`vars.CLUSTER_NAME`). Overusing Secrets for non-sensitive values makes variable management opaque.

10. **NEVER write multi-line `run:` scripts exceeding 15 lines** -- Long inline shell scripts are hard to test, version independently, or lint. Extract scripts longer than 15 lines into `.github/scripts/deploy.sh` committed to the repository, and invoke them with `run: bash .github/scripts/deploy.sh`. This enables local testing, shellcheck linting, and cleaner diffs.

---

## Edge Cases

### Monorepo with Multiple Applications

When the repository contains multiple applications (e.g., `apps/api`, `apps/frontend`, `apps/worker`), a single workflow triggers on every commit regardless of which app changed. Implement per-application workflows with path filters:

- Create `ci-api.yml`, `ci-frontend.yml`, `ci-worker.yml` with `paths: ['apps/api/**', 'packages/shared/**']` on each.
- The `packages/shared/**` path is critical -- changes to shared code should trigger all dependent application pipelines.
- Use a `changes` detection job with `dorny/paths-filter` action to produce boolean outputs (`api-changed: true/false`) when you need conditional logic within a single workflow rather than separate files.
- Branch protection required status checks must account for path filtering. If `ci-api.yml` does not run when only the frontend changes, the required check will not appear in the PR. Use a `skip-ci` job that always runs and reports success when the path filter is not matched, so branch protection rules can reference it unconditionally.

### Migrating from Jenkins to GitHub Actions

Organizations migrating from Jenkins face several specific challenges:

- **Shared libraries become reusable workflows or composite actions** -- Jenkins shared libraries map directly to GitHub's reusable workflow pattern. Identify the 5-10 most-used shared library functions and create equivalent reusable workflows first. This provides immediate value before completing the full migration.
- **Jenkins agents become runners** -- Jenkins agents with specific tooling (custom JDKs, proprietary SDKs, internal CA certificates) must be replicated as self-hosted runners or custom container images. Audit agent capabilities before starting migration.
- **Declarative Jenkinsfiles translate 70-80% directly** -- Stage → job, post → `if: always()`, stash/unstash → upload/download artifact. Document the translation mappings for the team.
- **Migrate pipelines in order of value, not complexity** -- Start with fast-running utility pipelines (documentation builds, linting-only checks) to build team familiarity. Leave complex multi-stage deployment pipelines for last.
- **Run both systems in parallel for 2-4 weeks** -- Keep Jenkins running for production deployments while validating GitHub Actions output in parallel. This avoids a big-bang cutover.

### Self-Hosted Runners at Scale

When GitHub-hosted runners are insufficient (cost, network access to private resources, specialized hardware):

- **Use ephemeral runners only** -- Persistent self-hosted runners accumulate state (Docker images, npm caches, temp files) across jobs, leading to non-deterministic builds. Use the `actions-runner-controller` (ARC) on Kubernetes to provision a fresh runner pod per job. Each pod terminates after job completion.
- **Size runners based on workload profiling** -- Run 50 representative jobs with GitHub-hosted runners and collect CPU/memory peak usage from the job logs. Provision self-hosted runners at 1.5x the P95 CPU and memory. Over-provisioning by 50% prevents resource contention without significant cost overhead.
- **Isolate production deploy runners** -- Runners that deploy to production should not run PR code from external contributors. Create a separate runner group with `runs-on: [self-hosted, production-deploy]` and restrict the group to specific workflows or protected branches in the GitHub runner group settings.
- **Implement runner health checks** -- Unhealthy runners silently fail to pick up jobs, causing workflow hangs. Implement Prometheus metrics for runner queue depth and alert when jobs wait more than 5 minutes for a runner.

### Handling Long-Running Integration Tests

When integration tests run Docker Compose stacks, test databases, or external service mocks and take 20-40 minutes:

- **Separate unit and integration test workflows** -- Integration tests should not block the standard PR feedback loop. Run integration tests on a schedule (every 6 hours) or on merge to main rather than on every PR commit, unless the test suite is specifically relevant to the PR changes.
- **Use Docker Compose service containers** -- GitHub Actions supports `services:` blocks that start Docker containers alongside the runner. Define `services: { postgres: { image: postgres:16, env: { POSTGRES_PASSWORD: test } } }` instead of starting Compose in a `run:` step. Service containers are networked to the runner automatically and torn down cleanly after the job.
- **Implement test result caching** -- For deterministic integration tests (no external I/O, no time-dependent data), cache test results keyed by the hash of test files and application code. Only re-run when the relevant code changes. Tools like `nx affected` or `turborepo` provide this for monorepos.
- **Set conservative timeouts and fail fast** -- An integration test suite without a timeout can consume a runner for hours during an infrastructure outage. Set `timeout-minutes: 45` and ensure tests have per-test timeouts configured in the test framework (pytest-timeout, jest `testTimeout`).

### Release Automation and Semantic Versioning

When automating release tagging, changelog generation, and package publishing:

- **Use `release-please` or `semantic-release` consistently, not both** -- `release-please` (Google) creates release PRs that accumulate commits and require a human merge; it is better for projects where release timing is controlled. `semantic-release` creates releases automatically on merge to main based on commit messages; it is better for continuous delivery pipelines. Mixing them creates version conflicts.
- **Protect the release workflow with required commit signature verification** -- Release workflows that publish to npm, PyPI, or container registries should only run on signed commits or through GitHub Environments with required reviewers. An unreviewed release from a compromised branch can publish malicious packages to your registry.
- **Use `GITHUB_TOKEN` scope carefully for releases** -- Creating a release tag requires `contents: write`. Publishing GitHub Packages requires `packages: write`. These permissions should be scoped to the release job only, not the entire workflow.
- **Always publish with provenance** -- npm `--provenance` flag (Node 20+), PyPI attestations, and `docker/build-push-action`'s `provenance: true` create cryptographically verifiable links between the published artifact and the workflow run that built it. This is increasingly required for supply chain security compliance.

### Workflow Debugging Without Exposing Secrets

When a workflow fails intermittently and the standard logs are insufficient:

- **Use `tmate` action for interactive debugging in non-production workflows** -- `mxschmitt/action-tmate` opens an SSH session into the runner environment. This is safe on short-lived GitHub-hosted runners for debugging build failures. NEVER use tmate on runners with production credentials attached.
- **Enable runner debug logging selectively** -- Set the `ACTIONS_STEP_DEBUG` and `ACTIONS_RUNNER_DEBUG` secrets to `true` in the repository settings. This generates verbose logs including shell expansion output. Disable after debugging -- verbose logs can inadvertently print redacted secret values if the secret appears in an argument list.
- **Add explicit `echo` debug statements behind a flag** -- Use `if: ${{ vars.DEBUG_MODE == 'true' }}` on a step that echoes environment variables and file contents. Toggle via the repository variable when investigating issues without modifying workflow code.

---

## Example

**Input:** "We have a Node.js TypeScript API deployed to AWS ECS. We're on a team of 8 engineers. Right now we have one `ci.yml` that runs on every push to every branch, it takes 18 minutes to complete, and it deploys to production on every push to main. We don't have staging. We want to fix this properly."

**Output:**

Your current setup has four critical problems to fix in priority order:

1. **No staging environment** -- deploying directly to production on every merge is high risk
2. **18-minute CI time** -- this is causing developers to avoid running CI locally and create large PRs to minimize wait time
3. **Deploying on every branch push** -- running the full pipeline including deploy on feature branches wastes minutes and could cause accidental deploys
4. **Single monolithic workflow** -- the right structure is split CI/CD with parallelization

Here is the complete redesigned workflow set:

---

**`.github/workflows/ci.yml`** -- Runs on PRs and branch pushes. No deployment. Target: under 8 minutes.

```yaml
# .github/workflows/ci.yml
# Purpose: Lint, test, and build on all PRs and branch pushes
# Triggers: pull_request to main, push to main and release branches
# No deployments occur in this workflow

name: CI

on:
  push:
    branches: [main, 'release/**']
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      - '.github/CODEOWNERS'
  pull_request:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ── Fast feedback layer (runs in parallel, target: <2 min each) ──────────────

  lint:
    name: Lint & Type Check
    runs-on: ubuntu-22.04
    timeout-minutes: 8
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - uses: actions/setup-node@1d0ff469b18454430e4e3d1b7c0d2ee4bd450abe # v4.1.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: ESLint
        run: npm run lint

      - name: TypeScript type check
        run: npm run typecheck

  # ── Unit tests -- sharded across 4 runners (target: <4 min) ─────────────────

  unit-test:
    name: Unit Tests (${{ matrix.shard }}/4)
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    needs: [lint]
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - uses: actions/setup-node@1d0ff469b18454430e4e3d1b7c0d2ee4bd450abe # v4.1.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Run Jest shard ${{ matrix.shard }}/4
        run: |
          npm test -- \
            --shard=${{ matrix.shard }}/4 \
            --coverage \
            --ci \
            --reporters=default \
            --reporters=jest-junit
        env:
          JEST_JUNIT_OUTPUT_DIR: ./test-results
          JEST_JUNIT_OUTPUT_NAME: results-${{ matrix.shard }}.xml

      - uses: actions/upload-artifact@65c4c4a1dddf5ad8a104f3c4b61b5b5898f2c82e # v4.6.0
        if: always()
        with:
          name: test-results-${{ matrix.shard }}
          path: test-results/
          retention-days: 1

  # ── Container build (only on main/release, not on PRs) ──────────────────────

  build:
    name: Build Container Image
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    needs: [lint, unit-test]
    # Only build the image when we'll actually need it for deployment
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.version }}
      image-digest: ${{ steps.build-push.outputs.digest }}
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - uses: docker/setup-buildx-action@f7ce87b8a4a6c9b1906b38a6f6c3f8d8e4c8a3b2 # v3.7.0

      - name: Log in to GHCR
        uses: docker/login-action@9780b0c442fbb1117ed29e0efdff1e18412f7567 # v3.3.0
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract image metadata
        id: meta
        uses: docker/metadata-action@369eb591f429131d6889c46b57f98a33d04a9ec # v5.6.1
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            # Always tag with the short SHA for immutable references
            type=sha,prefix=sha-,format=short
            # Tag branches for human-readable reference
            type=ref,event=branch

      - name: Build and push
        id: build-push
        uses: docker/build-push-action@4f58ea79222b3b9dc2c8bbdd6debcef730109a75 # v6.9.0
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          # GHA cache cuts build time from ~8 min to ~90 sec for incremental changes
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
```

---

**`.github/workflows/cd-staging.yml`** -- Deploys to staging automatically when CI passes on main.

```yaml
# .github/workflows/cd-staging.yml
# Purpose: Deploy to staging environment after successful CI on main branch
# Triggers: Successful completion of CI workflow on main branch
# Requires: GitHub Environment 'staging' configured with reviewer group

name: Deploy to Staging

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

permissions:
  contents: read
  id-token: write  # Required for OIDC to AWS

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-22.04
    timeout-minutes: 15
    # Only deploy when CI succeeded -- not on failure or cancellation
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: staging
      url: https://staging.api.example.com
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502 # v4.0.2
        with:
          # Role has only: ecs:UpdateService, ecs:DescribeServices on staging cluster
          role-to-assume: arn:aws:iam::${{ vars.AWS_ACCOUNT_ID }}:role/github-actions-staging-deploy
          aws-region: ${{ vars.AWS_REGION }}

      - name: Determine image tag from CI run
        id: image
        run: |
          # Use the short SHA from the triggering commit -- this is the immutable tag
          # built in the CI workflow. We never rebuild -- we redeploy the tested image.
          SHORT_SHA=$(echo "${{ github.event.workflow_run.head_sha }}" | cut -c1-7)
          echo "tag=sha-${SHORT_SHA}" >> $GITHUB_OUTPUT

      - name: Update ECS service with new image
        run: |
          # Retrieve current task definition
          TASK_DEF=$(aws ecs describe-task-definition \
            --task-definition ${{ vars.ECS_TASK_FAMILY_STAGING }} \
            --query 'taskDefinition' \
            --output json)

          # Inject the new image tag into the task definition
          NEW_IMAGE="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.image.outputs.tag }}"
          NEW_TASK_DEF=$(echo $TASK_DEF | jq \
            --arg IMAGE "$NEW_IMAGE" \
            '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

          # Register new task definition revision
          NEW_TASK_ARN=$(aws ecs register-task-definition \
            --cli-input-json "$NEW_TASK_DEF" \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)

          # Update the service to use the new task definition
          aws ecs update-service \
            --cluster ${{ vars.ECS_CLUSTER_STAGING }} \
            --service ${{ vars.ECS_SERVICE_STAGING }} \
            --task-definition "$NEW_TASK_ARN"

          # Wait for service to stabilize (up to 10 minutes)
          aws ecs wait services-stable \
            --cluster ${{ vars.ECS_CLUSTER_STAGING }} \
            --services ${{ vars.ECS_SERVICE_STAGING }}
        env:
          REGISTRY: ghcr.io
          IMAGE_NAME: ${{ github.repository }}

  smoke-test:
    name: Staging Smoke Tests
    runs-on: ubuntu-22.04
    timeout-minutes: 5
    needs: [deploy-staging]
    steps:
      - name: Health check
        run: |
          # Retry up to 5 times with 10-second intervals
          for i in $(seq 1 5); do
            HTTP_STATUS=$(curl --silent --output /dev/null \
              --write-out "%{http_code}" \
              --max-time 10 \
              https://staging.api.example.com/health)
            if [ "$HTTP_STATUS" = "200" ]; then
              echo "Health check passed (attempt $i)"
              exit 0
            fi
            echo "Attempt $i failed with status $HTTP_STATUS, retrying in 10s..."
            sleep 10
          done
          echo "Health check failed after 5 attempts"
          exit 1

      - name: API version check
        run: |
          DEPLOYED_SHA=$(curl --silent --max-time 10 \
            https://staging.api.example.com/api/v1/version \
            | jq -r '.commitSha')
          EXPECTED_SHA="${{ github.event.workflow_run.head_sha }}"
          if [[ "$DEPLOYED_SHA" != "${EXPECTED_SHA:0:7}" ]]; then
            echo "Version mismatch: expected ${EXPECTED_SHA:0:7}, got $DEPLOYED_SHA"
            exit 1
          fi
          echo "Deployed SHA matches: $DEPLOYED_SHA"
```

---

**`.github/workflows/cd-production.yml`** -- Deploys to production on tagged releases only, with required approval.

```yaml
# .github/workflows/cd-production.yml
# Purpose: Deploy to production on semantic version tag push
# Triggers: Push of a v*.*.* tag
# Requires: GitHub Environment 'production' configured with required reviewers

name: Deploy to Production

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'

permissions:
  contents: read
  id-token: write

jobs:
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-22.04
    timeout-minutes: 20
    environment:
      name: production
      url: https://api.example.com
    # NOTE: concurrency cancel-in-progress is intentionally FALSE here.
    # A production deploy in progress must complete -- cancelling mid-deploy
    # leaves the service in an undefined state.
    concurrency:
      group: production-deploy
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502 # v4.0.2
        with:
          # Separate role from staging -- production role has more restrictive trust policy
          role-to-assume: arn:aws:iam::${{ vars.AWS_ACCOUNT_ID
