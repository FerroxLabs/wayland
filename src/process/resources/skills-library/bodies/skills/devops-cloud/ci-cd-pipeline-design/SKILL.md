---
name: ci-cd-pipeline-design
description: |
  Guides expert-level ci/cd pipeline design implementation: ci-cd and automation decision frameworks, production-ready patterns, and concrete templates for ci cd pipeline design workflows.
  Use when the user asks about ci/cd pipeline design, ci cd pipeline design configuration, or ci-cd best practices for ci/cd projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ci-cd devops automation"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# CI/CD Pipeline Design

## When to Use

**Use this skill when:**
- A user needs to design or redesign a CI/CD pipeline from scratch for a new or existing application
- A user is experiencing slow pipeline execution (builds exceeding 10 minutes, deploy cycles exceeding 30 minutes) and needs optimization guidance
- A user wants to migrate from a legacy CI system (Jenkins, TeamCity, CircleCI 1.x) to a modern pipeline-as-code approach
- A user is implementing a multi-environment promotion strategy (dev → staging → production) and needs gate controls, approval workflows, and environment parity
- A user is designing a pipeline for a monorepo or microservices architecture and needs path-based triggering, dependency graphs, or matrix builds
- A user needs to integrate security scanning (SAST, DAST, dependency auditing, container image scanning) into an existing pipeline without blocking fast feedback loops
- A user is adopting GitOps patterns and needs to understand the boundary between CI (push-based artifact creation) and CD (pull-based reconciliation)
- A user needs to design deployment strategies such as blue/green, canary, or rolling deployments and needs to know how to wire those into pipeline stages

**Do NOT use this skill when:**
- The user needs help with container orchestration platform configuration (Kubernetes resource definitions, Helm chart authoring) -- use the container-orchestration skill instead
- The user needs infrastructure-as-code design for provisioning cloud resources (Terraform, Pulumi module design) -- use the infrastructure-as-code skill
- The user is asking about secrets management architecture as a standalone topic (Vault policies, AWS Secrets Manager rotation) -- use the secrets-management skill
- The user needs help designing a GitOps operator or ArgoCD application manifest structure -- use the gitops-deployment skill
- The user is asking about monitoring and observability design independent of the pipeline -- use the observability-design skill
- The user needs general Docker or container image optimization advice not tied to pipeline stages -- use the container-image-optimization skill
- The user is asking purely about branching strategy (Git Flow vs trunk-based) without pipeline implications -- use the version-control-strategy skill

---

## Process

### 1. Gather Pipeline Context and Constraints

Before producing any pipeline design, collect the following inputs explicitly from the user. Each answer materially changes the recommended architecture.

- **Application type and runtime:** Is this a compiled language (Go, Java, C#), interpreted (Python, Node.js), or a frontend build (React, Next.js)? Compiled languages need artifact caching strategies; interpreted languages need dependency caching.
- **Target deployment platform:** Kubernetes (self-managed or managed like EKS/GKE/AKS), serverless (Lambda, Cloud Run), VM-based (EC2, GCE), or PaaS (Heroku, Render, Railway). Each has different deployment primitives.
- **Repository structure:** Single-repo single-service, monorepo multi-service, or polyrepo. Monorepos require path-based change detection; polyrepos require cross-repo artifact versioning.
- **Team size and deployment frequency:** Teams of 1--5 with low frequency (< 5 deploys/day) can tolerate simpler pipelines. Teams of 10+ with high frequency (> 20 deploys/day) need parallelized stages, queuing controls, and deployment locks.
- **Existing CI platform constraints:** GitHub Actions, GitLab CI, CircleCI, Buildkite, Jenkins, Tekton, or Drone. Each has architectural primitives (runners vs agents vs executors) that constrain design options.
- **Compliance requirements:** SOC 2, PCI-DSS, HIPAA, FedRAMP. These add mandatory audit logging, approval gates, artifact signing, and immutable build records.
- **Current pain points:** Slow builds, flaky tests, broken deploys, manual steps, no rollback capability, environment drift. These are the primary optimization targets.

### 2. Choose the Pipeline Topology

Apply this decision framework based on collected context:

- **Linear pipeline (single app, single environment path):** Appropriate when deploying one service to one production environment with one staging environment. Stages run sequentially: build → test → scan → package → deploy-staging → smoke-test → deploy-prod. Simplest to understand and debug.
- **Fan-out / fan-in pipeline (monorepo or parallel test suites):** Use when you have multiple independent build targets in a monorepo or when test suites can be parallelized. A single trigger fans out to N parallel jobs, then fans back in to a gate that requires all to pass before proceeding to deployment. Reduces total wall-clock time by 40--70% for large test suites.
- **Matrix build pipeline:** Use when the same code must be validated against multiple runtime versions (Node 18/20/22, Python 3.10/3.11/3.12) or multiple OS targets (linux/amd64, linux/arm64, darwin). Define a matrix and let the CI platform generate job permutations.
- **Multi-stage promotion pipeline (environment promotion):** Use for any production system. Artifacts built once in CI are promoted through environments using immutable references (a container image SHA or a versioned artifact in an artifact registry), never rebuilt. The same artifact that passes staging is what gets deployed to production.
- **GitOps split pipeline:** CI pipeline ends at image push + manifest update. CD is handled by a GitOps operator (ArgoCD, Flux) that pulls and reconciles. The CI pipeline writes a commit to a configuration repository; the CD system detects and applies it. Use when running Kubernetes and wanting deployment history in Git.

### 3. Design Stage Structure and Sequencing

Define each stage explicitly with its purpose, inputs, outputs, and failure behavior:

- **Fast-feedback stage (target: < 3 minutes):** Syntax checks, linting (ESLint, flake8, golangci-lint), unit tests, and import validation. This stage runs on every push including to feature branches. Fail fast: if linting fails, do not proceed to longer-running stages. Use caching aggressively -- cache node_modules, pip packages, Go module cache, Maven .m2 by hashing lockfiles (package-lock.json, requirements.txt, go.sum, pom.xml).
- **Build and package stage (target: < 5 minutes for most apps):** Compile the application, produce the deployable artifact. For containers: docker buildx build with layer caching (--cache-from type=registry or type=gha). For JVM apps: produce a fat JAR or exploded WAR. For Go: produce a static binary. Tag the artifact with the git SHA (not a mutable tag like "latest"). Push to artifact registry only on main/release branches, not feature branches.
- **Full test stage (target: < 10 minutes for 80th percentile):** Integration tests, contract tests, and any tests requiring external dependencies (test containers, localstack for AWS). Parallelize using job matrices or by splitting test files. If total test time exceeds 15 minutes, split into parallel shards -- most CI platforms support this via a modulo split (tests[0..N/3], tests[N/3..2N/3], tests[2N/3..N]) or via a test impact analysis tool that only runs tests affected by changed files.
- **Security scanning stage (run in parallel with full tests):** Static analysis (Semgrep, CodeQL, SonarQube), dependency vulnerability scanning (Dependabot, Snyk, OWASP Dependency-Check), container image scanning (Trivy, Grype, Anchore). Do NOT make these blocking on feature branches initially -- start in audit mode, then enforce after 30 days once the team has cleared baseline violations. On the main branch, fail on CRITICAL and HIGH CVEs in the final application layer (not base image issues you cannot control).
- **Staging deployment stage:** Deploy the tagged artifact to staging. Run smoke tests (a small suite of 5--20 tests validating critical paths) and synthetic transactions. Include an automated rollback trigger: if smoke tests fail within 5 minutes of deploy, automatically redeploy the previous artifact. Capture deployment metadata (who triggered, git SHA, timestamp, environment) into a deployment record.
- **Production deployment stage (with gates):** Require manual approval for production deployments in most organizations. Add automated gate checks: staging smoke tests must have passed, security scan must be clean, no open P1 incidents in the incident management system (via API check). Implement the chosen deployment strategy (rolling, blue/green, or canary) at this stage. Post deployment: run the same smoke test suite against production with a 10-minute window before declaring success.

### 4. Design the Artifact Strategy

Artifact management is where most pipeline designs have critical gaps:

- **Immutable artifacts:** Every build produces one artifact tagged with the full git SHA (40 characters, not abbreviated). Never use floating tags like "latest", "stable", or "main" for deployment references in staging or production. Floating tags cause environment drift and make rollback ambiguous.
- **Artifact registry selection:** Container images go to a container registry (ECR, GCR, Docker Hub private, GitHub Container Registry, GitLab Registry). Non-container artifacts (JARs, NPM packages, Go binaries) go to a language-specific registry (Nexus, Artifactory, GitHub Packages, PyPI private). Set a retention policy: keep the last 30 days of artifacts for main branch builds, keep 3 days for feature branch builds.
- **Build provenance:** For compliance-heavy environments, generate an SBOM (Software Bill of Materials) using Syft or Docker's built-in SBOM generation. Sign container images with Cosign. Store the SBOM as an artifact attestation in the registry. This is required for SLSA Level 2+ supply chain security.
- **Artifact promotion (not rebuild):** The same container image SHA deployed to staging is the one deployed to production. Never rebuild the image for each environment. Parameterize environment-specific configuration through environment variables, ConfigMaps, or Secrets -- not through image contents.

### 5. Implement Caching and Performance Optimization

Pipeline speed directly affects developer productivity. A pipeline exceeding 15 minutes total causes developers to context-switch and reduces merge frequency:

- **Dependency caching:** Cache by hashing the lockfile, not the date or branch. GitHub Actions: use `actions/cache` with a key of `${{ hashFiles('**/package-lock.json') }}`. GitLab CI: use `cache: key: files: [package-lock.json]`. Restore from a fallback key (partial match) when the exact key misses. Warm caches by running the dependency install step even on cache hit to catch lockfile drift.
- **Docker layer caching:** Structure Dockerfiles so that dependency installation (COPY package.json, RUN npm install) comes before application code copy. This ensures the expensive layer (npm install) is cached unless dependencies change. Use multi-stage builds to keep final images small (< 100MB is achievable for most apps) while keeping build caches warm.
- **Test parallelization thresholds:** If test suite runs > 8 minutes serially, split into 2 shards. If > 16 minutes, split into 4 shards. Beyond 4 shards, evaluate whether test quality (flakiness, slow external I/O) is the root cause rather than volume.
- **Incremental builds in monorepos:** Use Nx, Turborepo, Bazel, or Gradle build cache for monorepos. These tools track which packages have changed and skip building/testing unaffected packages. Without this, a monorepo pipeline will rebuild everything on every commit, becoming untenable beyond 10--15 packages.
- **Runner sizing:** Do not run all jobs on the smallest available runner. Build stages benefit significantly from more CPU cores and memory. A GitHub Actions runner with 4 cores instead of 2 typically cuts build time by 35--50% for compiled languages. The cost delta (cents per build) is almost always worth the developer-hour savings.

### 6. Implement Security and Compliance Controls

Security must be embedded in the pipeline design, not bolted on:

- **Secrets management:** Never store secrets in CI/CD environment variables that are printed in logs. Use the CI platform's native secrets store (GitHub Actions Secrets, GitLab CI Variables with "masked" and "protected" flags, CircleCI Contexts) for short-lived tokens. For cloud credentials, use OIDC federation -- GitHub Actions can assume an AWS IAM role or GCP service account via OIDC without storing a long-lived access key. This is the modern standard and eliminates a major credential leak surface.
- **Least-privilege runner permissions:** The GitHub Actions GITHUB_TOKEN should have `contents: read` and `packages: write` only. Grant additional permissions explicitly, not with a blanket `write-all`. For self-hosted runners, run them in isolated environments (Docker containers or ephemeral VMs) so that a compromised build cannot access host secrets.
- **Branch protection and pipeline enforcement:** Require that CI passes before merging to the main branch. Configure required status checks at the branch protection level, not just as a convention. This prevents manual bypasses.
- **Audit trail:** Every deployment should record: the actor who triggered it, the git SHA deployed, the timestamp, the target environment, and the outcome. Store this in a CMDB, Jira deployment tracking, or a structured log that can be queried during an audit. Many compliance frameworks (SOC 2 CC8.1) require this evidence.
- **Image signing and verification:** Sign container images with Cosign using a keyless signing flow (Sigstore Fulcio + Rekor). Configure the deployment platform to verify signatures before deploying. This creates a verifiable chain from source code commit to running container.

### 7. Design for Failure and Recovery

Every pipeline design must answer: what happens when things go wrong?

- **Rollback mechanism:** Every deployment stage must have an explicit rollback procedure documented and preferably automated. For Kubernetes, this is `kubectl rollout undo deployment/name` or `helm rollback`. For blue/green deployments, it is switching the load balancer target group back. For serverless, it is redeploying the previous version alias. The rollback must be executable without pipeline involvement -- a production outage is the wrong time to wait for CI.
- **Failed deployment detection:** Configure automated rollback triggers based on health checks, not just successful pipeline completion. A deployment that succeeds in the pipeline but ships a crash-looping container is a failure. Use deployment readiness probes (Kubernetes readinessProbe), Cloudwatch alarms, or Datadog monitors to detect post-deploy failures within 5--10 minutes and trigger automated rollback.
- **Flaky test handling:** Track test flakiness explicitly. If a test fails more than 5% of the time on an unmodified codebase, it is flaky and must be quarantined (moved to a non-blocking suite) until fixed. Flaky tests that block production deploys are worse than no tests because they create pressure to disable CI gates entirely.
- **Pipeline timeout configuration:** Every job must have a timeout. GitHub Actions defaults to 6 hours -- set it to 15--30 minutes for most jobs. A hung job that consumes a runner for hours blocks other builds and obscures failures.

### 8. Document and Operationalize the Pipeline

A pipeline that only the person who built it can maintain is a liability:

- **Pipeline-as-code in the repository:** All pipeline definitions live in the same repository as the application code they build. This creates a single history for "why did this build break" investigations -- a code change and a pipeline change committed in the same PR are immediately correlated.
- **Reusable components:** Extract repeated pipeline logic into reusable templates. GitHub Actions: composite actions or reusable workflows in a `.github/workflows` directory or a separate shared-workflows repository. GitLab CI: `include` with `project` and `file` keys to reference a central template repository. CircleCI: Orbs. Standardizing on shared templates across teams prevents the "17 different ways to deploy" anti-pattern.
- **Pipeline documentation:** Maintain a short (< 1 page) `PIPELINE.md` in every repository explaining: what each stage does, how long it normally takes, what environment variables are required, how to trigger a manual deploy, and how to roll back. This reduces mean time to resolution during incidents.
- **Metrics and alerting:** Track pipeline metrics: mean build time, build success rate, mean time to recovery after failed build. Alert if build success rate on the main branch drops below 90% over a rolling 7-day window -- this indicates systemic quality problems. Most CI platforms expose these metrics via API or native dashboards.

---

## Output Format

Produce the following artifacts when designing a CI/CD pipeline. Use this exact structure.

### Pipeline Architecture Summary

```
Application:        [name and type]
Repository layout:  [single-repo / monorepo / polyrepo]
CI Platform:        [GitHub Actions / GitLab CI / CircleCI / etc.]
CD Target:          [Kubernetes / Lambda / VM / PaaS]
Deployment strategy:[rolling / blue-green / canary]
Environments:       [dev → staging → production or custom chain]
Expected pipeline duration: [X minutes end-to-end]
```

### Stage Map

| Stage | Trigger | Runs On | Target Duration | Failure Behavior |
|---|---|---|---|---|
| Lint & Unit Test | Every push | linux/amd64 small runner | < 3 min | Block all downstream |
| Build & Package | main branch, release tags | linux/amd64 medium runner | < 5 min | Block deployment stages |
| Integration Test | main branch | linux/amd64 medium runner (parallel x3) | < 8 min | Block deployment stages |
| Security Scan | main branch | linux/amd64 small runner | < 6 min | Block on CRITICAL/HIGH |
| Deploy Staging | main branch, after tests pass | linux/amd64 small runner | < 4 min | Auto-rollback after 5 min |
| Smoke Test Staging | After deploy-staging | linux/amd64 small runner | < 3 min | Block production gate |
| Deploy Production | Manual approval after staging pass | linux/amd64 small runner | < 5 min | Auto-rollback after 10 min |

### Pipeline Definition (GitHub Actions example)

```yaml
# .github/workflows/ci-cd.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, "release/**"]
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write  # Required for OIDC cloud credential federation

env:
  IMAGE_REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-unit-test:
    name: Lint & Unit Tests
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: npm-${{ hashFiles('**/package-lock.json') }}
          restore-keys: npm-

      - name: Install dependencies
        run: npm ci --prefer-offline

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm test -- --coverage --ci
        env:
          CI: true

  build-and-push:
    name: Build & Push Image
    runs-on: ubuntu-22.04
    needs: lint-and-unit-test
    # Only build images on main branch and release tags, not PRs
    if: github.event_name == 'push'
    timeout-minutes: 15
    outputs:
      image-digest: ${{ steps.push.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.IMAGE_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract image metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            # Tag with full git SHA for immutable references
            type=sha,format=long
            # Tag with semver if triggered by a version tag
            type=semver,pattern={{version}}

      - name: Build and push with cache
        id: push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}:cache
          cache-to: type=registry,ref=${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}:cache,mode=max
          # Multi-platform build for ARM64 support
          platforms: linux/amd64,linux/arm64
          provenance: true
          sbom: true

  security-scan:
    name: Security Scan
    runs-on: ubuntu-22.04
    needs: build-and-push
    timeout-minutes: 15
    steps:
      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-and-push.outputs.image-digest }}"
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 1  # Fail on CRITICAL or HIGH
          ignore-unfixed: true  # Do not fail on CVEs without a fix available

      - name: Upload scan results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

  integration-test:
    name: Integration Tests (Shard ${{ matrix.shard }}/${{ matrix.total }})
    runs-on: ubuntu-22.04
    needs: build-and-push
    timeout-minutes: 20
    strategy:
      fail-fast: false  # Let all shards complete for full failure picture
      matrix:
        shard: [1, 2, 3]
        total: [3]
    steps:
      - uses: actions/checkout@v4

      - name: Run integration test shard
        run: |
          npm run test:integration -- \
            --shard=${{ matrix.shard }}/${{ matrix.total }} \
            --forceExit
        env:
          TEST_IMAGE: "${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-and-push.outputs.image-digest }}"

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-22.04
    needs: [integration-test, security-scan]
    environment:
      name: staging
      url: https://staging.example.com
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-staging-deploy
          aws-region: us-east-1
          # No access keys stored -- federated via OIDC

      - name: Deploy to Kubernetes staging namespace
        run: |
          # Update the image tag in the Kubernetes deployment
          kubectl set image deployment/app \
            app=${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-and-push.outputs.image-digest }} \
            --namespace=staging
          # Wait for rollout with timeout
          kubectl rollout status deployment/app --namespace=staging --timeout=300s

      - name: Run smoke tests against staging
        run: npm run test:smoke -- --baseUrl=https://staging.example.com
        timeout-minutes: 5

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-22.04
    needs: deploy-staging
    # Requires manual approval via GitHub Environments protection rules
    environment:
      name: production
      url: https://example.com
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-prod-deploy
          aws-region: us-east-1

      - name: Deploy to Kubernetes production namespace
        run: |
          kubectl set image deployment/app \
            app=${{ env.IMAGE_REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build-and-push.outputs.image-digest }} \
            --namespace=production
          kubectl rollout status deployment/app --namespace=production --timeout=300s

      - name: Run post-deploy smoke tests
        run: npm run test:smoke -- --baseUrl=https://example.com
        timeout-minutes: 10

      - name: Notify on failure and rollback
        if: failure()
        run: |
          kubectl rollout undo deployment/app --namespace=production
          echo "::error::Production deploy failed -- rolled back to previous version"
```

### Decision Matrix: Deployment Strategy Selection

| Criterion | Rolling Update | Blue/Green | Canary |
|---|---|---|---|
| Rollback speed | 2--5 min | < 30 sec | Depends on ramp |
| Infrastructure cost | 1x | 2x during deploy | 1.1--1.5x |
| Traffic cutover control | None | Instant all-or-nothing | Percentage-based |
| Database migration safety | Risky with schema changes | Safe with dual-write | Safe with feature flags |
| Best for | Stateless services with backward-compatible changes | Services with risky changes or SLA requirements | High-traffic services where % rollout reduces blast radius |
| Minimum Kubernetes version | 1.1+ | Requires Ingress or Service Mesh | Requires Ingress or Service Mesh (Istio, Linkerd, NGINX) |

### Caching Strategy Reference

| Ecosystem | Cache Key Pattern | Cache Path | Estimated Speedup |
|---|---|---|---|
| Node.js / npm | `npm-${{ hashFiles('**/package-lock.json') }}` | `~/.npm` | 60--80% |
| Python / pip | `pip-${{ hashFiles('**/requirements.txt') }}` | `~/.cache/pip` | 50--70% |
| Go modules | `go-${{ hashFiles('**/go.sum') }}` | `~/go/pkg/mod` | 70--85% |
| Java / Maven | `maven-${{ hashFiles('**/pom.xml') }}` | `~/.m2` | 60--75% |
| Docker layers | Registry cache with `type=registry,mode=max` | Registry | 40--60% |
| Gradle | `gradle-${{ hashFiles('**/*.gradle') }}` | `~/.gradle` | 65--80% |

---

## Rules

1. **NEVER rebuild artifacts per environment.** Build once, tag with the git SHA, promote the same artifact through environments. Rebuilding introduces the risk that staging and production run different code even with the same commit SHA if build inputs change between runs.

2. **NEVER use mutable image tags ("latest", "main", "stable") as deployment references.** These tags silently change, making it impossible to know what is actually deployed. Always reference images by digest (sha256:...) in deployment manifests and pipeline deploy steps.

3. **NEVER store cloud credentials as long-lived CI secrets.** Use OIDC federation to assume roles directly from GitHub Actions, GitLab CI, or CircleCI. Long-lived access keys in CI secrets are a top-3 cloud security incident cause. OIDC-based roles can be scoped per branch, per job, and with session duration limits.

4. **ALWAYS enforce a maximum timeout on every CI job.** Default timeouts (GitHub Actions: 360 minutes) allow a single hung job to consume a runner for hours. Set job timeouts to 2x the expected runtime: if a build typically takes 7 minutes, set `timeout-minutes: 15`. Alert when jobs approach the timeout threshold.

5. **NEVER make security scans optional on the main branch.** It is acceptable to run security scans in audit-only mode on feature branches during initial rollout, but all merges to main must pass CRITICAL and HIGH severity gates before the artifact can be promoted to any deployment environment.

6. **ALWAYS use `fail-fast: false` in parallel test matrix jobs.** When parallelizing tests, a failure in shard 1 should not cancel shards 2 and 3. Collecting all failures in a single run dramatically reduces debugging time compared to finding one failure at a time on successive runs.

7. **NEVER commit secrets, tokens, or credentials to pipeline definition files.** Pipeline YAML files are version-controlled and readable by anyone with repository access. All secrets must come from the CI platform's secrets store, injected at runtime. Scan pipeline files with tools like Gitleaks or Trufflesecurity as part of the lint stage.

8. **ALWAYS implement automated rollback for production deployments.** A deploy step must be followed by a validation step (smoke tests, health check polling). If validation fails within the defined window (typically 5--10 minutes), the pipeline must automatically revert to the previous known-good artifact. Do not rely on humans to detect and initiate rollback during an incident.

9. **NEVER couple application secrets to container images.** Configuration and secrets must be injected at runtime (Kubernetes Secrets, AWS SSM Parameter Store, HashiCorp Vault agent injection) not baked into the image at build time. An image containing secrets cannot be stored in a shared registry, cannot be promoted between environments, and creates a permanent secret exposure in image layers.

10. **ALWAYS track pipeline metrics and treat pipeline health as a first-class operational concern.** A main branch with a build success rate below 90% over 7 days indicates a systemic problem (flaky tests, bad dependencies, environment drift) that reduces team velocity more than any feature work. Alert on build success rate drops and treat pipeline failures as production incidents when they block the main branch for more than 1 hour.

---

## Edge Cases

### Monorepo with Dozens of Services

When a single repository contains 10--50 independent services, a naive "build everything on every commit" approach becomes untenable -- pipelines exceeding 30 minutes for an unrelated change destroy developer velocity. Implement change detection using one of these strategies:
- **Path-based filtering (GitHub Actions):** Use the `paths` filter in `on.push` triggers or use the `dorny/paths-filter` action to dynamically determine which jobs to run based on changed paths. Each service defines its own workflow or is gated by path filters.
- **Build system graph traversal (Nx, Turborepo, Bazel):** These tools maintain a dependency graph of the monorepo and determine the minimal set of packages that need rebuilding based on changed files and cached task results. Nx affected commands (`nx affected:build`, `nx affected:test`) are the standard approach for JavaScript/TypeScript monorepos. Turborepo offers similar functionality with a simpler configuration model.
- **Key constraint:** The pipeline must still perform a full build of all affected services before production deployment, even if it only runs fast feedback for the changed service on pull requests. A change to a shared library might require rebuilding 12 dependent services -- the pipeline must detect and handle this transitively.

### Database Migrations in Continuous Deployment

Database schema changes are the most dangerous operation in a CD pipeline. The schema and application code can be briefly out of sync during a rolling deployment:
- **Expand/contract pattern (required for zero-downtime):** Never deploy a migration that breaks the currently-running application version. Migrations must be backward compatible with the N-1 application version. The correct sequence is: (1) deploy migration that adds new column/table without removing old ones (expand), (2) deploy new application version that uses new schema, (3) deploy migration that removes old columns no longer needed (contract). This requires 3 separate deployments over 2+ release cycles.
- **Migration runner placement:** Run migrations as a Kubernetes init container or a pre-deploy Job, not as part of application startup. This ensures migrations complete before new application pods start receiving traffic, and migration failures block the deployment before any pods are replaced.
- **Never run destructive migrations (DROP COLUMN, DROP TABLE) until the application version that references those columns has been deployed and the old version is fully retired.** Keeping the old column for 1--2 deployment cycles is always safer than a data loss incident.

### Pipeline for a Regulated Environment (SOC 2 / PCI-DSS)

Standard pipeline designs lack the audit trail and separation-of-duty controls required for formal compliance:
- **Immutable build records:** Every build must produce a signed artifact with a provenance attestation (SLSA Level 2 minimum). Use `sigstore/cosign-installer` to sign images after push and attach attestations. Store the attestations in the registry alongside the image.
- **Four-eyes principle for production deployments:** Configure the production environment in GitHub/GitLab to require approval from a reviewer who is not the person who triggered the pipeline. This is enforced at the platform level, not just by convention.
- **Audit log export:** CI platform audit logs must be exported to a SIEM (Splunk, Datadog, Elastic SIEM) and retained for the required period (typically 12 months for SOC 2, 13 months for PCI-DSS). Configure log export via CI platform APIs or native SIEM integrations.
- **Vulnerability SLA enforcement:** PCI-DSS requires CRITICAL vulnerabilities be remediated within 30 days and HIGH within 90 days. Configure the pipeline to track when a CVE was first detected (store scan results in a database) and fail the build if a CVE has been open beyond its SLA window.

### Slow Pipeline Performance Degradation Over Time

Pipelines that start at 8 minutes frequently reach 25--30 minutes after 12--18 months as test suites grow and dependencies accumulate. Treat this as a performance regression:
- **Establish a pipeline performance budget:** Set a maximum acceptable wall-clock time per stage (lint: 3 min, build: 5 min, tests: 10 min, deploy: 5 min). Fail the pipeline if any stage exceeds 2x its budget, forcing the team to address the regression immediately.
- **Profile before optimizing:** Use CI timing data to identify the slowest steps. Most pipelines have one step consuming 60--70% of total time. Common culprits: `npm install` without cache (fix: proper cache keys), sequential tests that could be parallel (fix: sharding), building the entire Docker image on every run (fix: layer caching and build caching), running all tests instead of affected tests (fix: test impact analysis).
- **Test suite audits:** Run a test duration report quarterly. Any individual test taking > 10 seconds is a candidate for optimization or promotion to a separate slow-test suite that runs less frequently (nightly rather than every commit).

### Multi-Cloud or Multi-Region Deployments

When an application deploys to multiple cloud providers or regions simultaneously, the pipeline must handle deployment fan-out without creating a partial-deployment failure scenario:
- **Parallel regional deploys with a consensus gate:** Deploy to all regions in parallel. Require that a minimum percentage (e.g., 80%) of regional deployments succeed before declaring the overall deployment successful. If a minority of regions fail, leave them at the previous version and alert rather than rolling back all regions.
- **Cloud-specific credential isolation:** Each cloud target requires its own OIDC role with permissions scoped to that cloud and region. Never reuse credentials across cloud providers.
- **Canary-by-region strategy:** Deploy to one low-traffic region first (e.g., ap-southeast-2 for a US/Europe-primary application), validate for 15--30 minutes, then fan out to remaining regions. This provides a regional canary without requiring a full canary infrastructure in every region.

### Self-Hosted Runners in Air-Gapped Environments

Enterprises with air-gapped or private cloud deployments cannot use cloud-hosted CI runners or public container registries:
- **Runner deployment:** Deploy self-hosted runners as ephemeral containers or VMs that are provisioned on demand and destroyed after each job. Persistent runners accumulate state (cached credentials, modified toolchains) that creates security risks and "works on my runner" problems. GitHub Actions Ephemeral Runners and GitLab autoscaling runners on AWS/GCP support this model.
- **Mirror public registries:** All base images and build tool images must come from an internal mirror (Harbor, JFrog Artifactory, Nexus) that has been scanned. Configure Docker daemon on runners to use the internal mirror as a pull-through cache. Block outbound traffic to docker.io and public registries at the network level.
- **Toolchain management:** Lock all build tool versions to specific binaries stored in internal artifact storage. Never `apt-get install` or download binaries from the internet during a build -- pin to internal mirrors. Use `nix` or `devbox` for reproducible toolchain management in air-gapped environments.

### Incident During a Deployment in Progress

When a production incident is detected while a deployment is mid-flight:
- **Immediate rule:** If an incident is declared (P1/P2) while a deployment is in progress, the default action is to complete the rollback and freeze the pipeline until the incident is resolved. Do not continue deploying a new version into a failing production system.
- **Deployment lock mechanism:** Implement a deployment lock via a feature flag system, a simple key-value store (Redis, AWS SSM Parameter Store), or the CI/CD platform's environment lock feature. The incident commander should be able to set the lock via a Slack command or runbook step, and all pipeline deploy stages must check the lock before proceeding.
- **Post-incident deploy:** After an incident is resolved, require a deliberate re-trigger of the production deployment rather than allowing the pipeline to automatically proceed. This ensures human confirmation that the environment is stable before resuming normal deployment flow.

---

## Example

**Input:** "We have a Node.js API service (Express, TypeScript) deployed to Kubernetes on AWS EKS. The team is 8 engineers. Right now we have a basic Jenkins pipeline that does build and deploy in about 20 minutes. We want to migrate to GitHub Actions with proper stages, security scanning, and blue/green deployments. How should we design this?"

---

**Output:**

### Assessment

**Current state analysis:**

The 20-minute Jenkins pipeline is likely suffering from: no dependency caching, sequential test execution, single-stage build with no parallelism, and no distinct artifact promotion (probably rebuilding on every deploy). The migration to GitHub Actions is the right move -- it enables pipeline-as-code without a separate Jenkins server, native OIDC for AWS credential federation, and GitHub Environment protection rules for production approval gates.

**Key constraints from your context:**
- Node.js + TypeScript: build step produces compiled JS, not a binary -- use Docker multi-stage build to produce the container artifact
- EKS target: Kubernetes rolling update is available, but you asked for blue/green -- this requires AWS Load Balancer Controller with separate Service objects per environment color, or an Ingress controller capable of traffic splitting
- Team of 8: you need pipeline that is legible enough for all 8 to maintain and debug; avoid excessive abstraction
- Migration from Jenkins: do not sunset Jenkins until GitHub Actions pipeline proves stable -- run both for 2--4 weeks on non-production branches

---

### Recommended Pipeline Architecture

```
Application:         express-api (Node.js 20, TypeScript)
Repository layout:   Single-repo single-service
CI Platform:         GitHub Actions
CD Target:           AWS EKS (Kubernetes 1.28)
Deployment strategy: Blue/Green via AWS Load Balancer Controller
Environments:        PR preview → staging → production
Expected pipeline duration: 12-14 minutes end-to-end (target after caching)
Rollback time:       < 45 seconds (ALB target group swap)
```

---

### Stage Map

| Stage | Trigger | Runs On | Target Duration | Failure Behavior |
|---|---|---|---|---|
| Lint & Unit Test | Every push | ubuntu-22.04 (2-core) | < 3 min | Block all downstream |
| Type Check | Every push (parallel) | ubuntu-22.04 (2-core) | < 2 min | Block all downstream |
| Build & Push Image | Push to main only | ubuntu-22.04 (4-core) | < 5 min | Block deployment |
| Security Scan (Trivy) | After build | ubuntu-22.04 (2-core) | < 4 min | Block on CRITICAL/HIGH |
| Integration Tests (3 shards) | Push to main only | ubuntu-22.04 (2-core) x3 | < 8 min | Block deployment |
| Deploy Staging (Blue/Green) | After all tests pass | ubuntu-22.04 (2-core) | < 4 min | Auto-rollback |
| Smoke Tests Staging | After staging deploy | ubuntu-22.04 (2-core) | < 2 min | Block production gate |
| Deploy Production (Blue/Green) | Manual approval + staging pass | ubuntu-22.04 (2-core) | < 5 min | Auto-rollback + alert |

---

### Dockerfile (Multi-stage, TypeScript)

```dockerfile
# Build stage -- compiles TypeScript, installs ALL deps including devDeps
FROM node:20-alpine AS builder
WORKDIR /app
# Copy lockfiles first for layer caching
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
# Prune devDependencies from node_modules for production
RUN npm prune --production

# Production stage -- only runtime artifacts, no build tools
FROM node:20-alpine AS production
# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
# Copy compiled output and pruned node_modules from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

This produces a final image of approximately 80--120 MB compared to 600+ MB for a naive single-stage build. The non-root USER directive prevents container breakout escalation.

---

### GitHub Actions Pipeline

```yaml
# .github/workflows/ci-cd.yaml
name: CI/CD -- express-api

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write      # OIDC for AWS
  security-events: write  # Upload Trivy SARIF to GitHub Security

env:
  ECR_REGISTRY: 123456789012.dkr.ecr.us-east-1.amazonaws.com
  ECR_REPOSITORY: express-api
  EKS_CLUSTER: production-eks
  AWS_REGION: us-east-1

jobs:
  # ── Fast feedback (runs on PRs and main) ─────────────────────────────
  lint-and-unit:
    name: Lint & Unit Tests
    runs-on: ubuntu-22.04
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'  # Built-in npm caching by hash of package-lock.json

      - run: npm ci --prefer-offline

      - name: Lint (ESLint + Prettier)
        run: npm run lint

      - name: Unit tests
        run: npm test -- --coverage --ci --forceExit
        env:
          NODE_ENV: test

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/lcov.info
          retention-days: 7

  typecheck:
    name: TypeScript Type Check
    runs-on: ubuntu-22.04
    timeout-minutes: 8
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci --prefer-offline
      - run: npx tsc --noEmit

  # ── Build (main branch only) ──────────────────────────────────────────
  build-and-push:
    name: Build & Push to ECR
    runs-on: ubuntu-22.04
    needs: [lint-and-unit, typecheck]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    timeout-minutes: 20
    outputs:
      image-uri: ${{ steps.push.outputs.image-uri }}
      image-digest: ${{ steps.push.outputs.digest }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC -- no stored access keys)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-ecr-push
          aws-region: ${{ env.AWS_REGION }}

      - name: Log in to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push image
        id: push
        uses: docker/build-push-action@v5
        with:
          context: .
          target: production
          push: true
          # Tag with full SHA -- this is the immutable reference used in all deployments
          tags: |
            ${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:sha-${{ github.sha }}
          # Registry-based layer cache -- survives runner restarts
          cache-from: type=registry,ref=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:cache
          cache-to: type=registry,ref=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}:cache,mode=max
          platforms: linux/amd64,linux/arm64
          provenance: true
          sbom: true

      - name: Output full image URI
        id: output
        run: |
          echo "image-uri=${{ env.ECR_REGISTRY }}/${{ env.ECR_REPOSITORY }}@${{ steps.push.outputs.digest }}" >> $GITHUB_OUTPUT

  # ── Security scan (parallel to integration tests) ────────────────────
  security-scan:
    name: Container Security Scan (Trivy)
    runs-on: ubuntu-22.04
    needs: build-and-push
    timeout-minutes: 15
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-ecr-pull
          aws-region: ${{ env.AWS_REGION }}

      - name: Log in to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Scan image for CRITICAL and HIGH CVEs
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: "${{ needs.build-and-push.outputs.image-uri }}"
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 1
          # Do not fail on CVEs with no available fix (we can't patch upstream)
          ignore-unfixed: true
          vuln-type: os,library

      - name: Upload scan results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

  # ── Integration tests (sharded, parallel) ────────────────────────────
  integration-test:
    name: Integration Tests (Shard ${{ matrix.shard }}/3)
    runs-on: ubuntu-22.04
    needs: build-and-push
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3]
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: testdb
        ports: ['5432:5
