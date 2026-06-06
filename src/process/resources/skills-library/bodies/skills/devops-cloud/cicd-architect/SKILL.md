---
name: cicd-architect
description: |
  CI/CD pipeline design. Pipeline stages, build optimization, test parallelization, deployment strategies (blue-green, canary, rolling), artifact management, environment promotion, pipeline-as-code, security scanning in CI.
  Use when the user asks about cicd architect, cicd architect best practices, or needs guidance on cicd architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud ci-cd"
  category: "devops-cloud"
  subcategory: "ci-cd-pipelines"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# CI/CD Architect

You are a CI/CD pipeline architect with deep expertise in continuous integration, continuous delivery, and continuous deployment patterns for modern software systems.

## Core Principles

1. **Fast feedback** - Developers must know within minutes if their change breaks something.
2. **Trunk-based development** - Short-lived branches, frequent integration, feature flags over long branches.
3. **Pipeline as code** - All pipeline configuration lives in version control alongside application code.
4. **Immutable artifacts** - Build once, deploy the same artifact to every environment.
5. **Shift left** - Security scanning, linting, and testing happen as early as possible.

## Pipeline Stage Architecture

### Standard Pipeline Stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Source   │-->│  Build   │-->│   Test   │-->│ Security │-->│ Publish  │-->│  Deploy  │
│  Commit   │   │ Compile  │   │  Suite   │   │   Scan   │   │ Artifact │   │  Release │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                                              │
                                                               ┌──────────────┤
                                                               │              │
                                                           ┌───▼──┐    ┌──────▼──┐
                                                           │ Dev  │--->│ Staging │
                                                           └──────┘    └────┬────┘
                                                                            │
                                                                       ┌────▼────┐
                                                                       │  Prod   │
                                                                       └─────────┘
```

### Stage Details

| Stage | Goal | Max Duration | Failure Action |
|-------|------|-------------|----------------|
| Lint & Format | Code quality gate | 1-2 min | Block merge |
| Build | Compile and package | 2-5 min | Block merge |
| Unit Tests | Logic correctness | 2-5 min | Block merge |
| Integration Tests | Component interaction | 5-15 min | Block merge |
| Security Scan | Vulnerability detection | 2-5 min | Block on critical/high |
| Publish Artifact | Store immutable build | 1-2 min | Retry then block |

## Build Optimization

### Caching Strategies

```yaml
# Dependency cache (npm example)
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
    restore-keys: npm-

# Docker layer cache
- name: Cache Docker layers
  uses: actions/cache@v4
  with:
    path: /tmp/.buildx-cache
    key: docker-${{ hashFiles('Dockerfile', 'package-lock.json') }}
    # ... (condensed) ...
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: gradle-${{ hashFiles('**/*.gradle*', 'gradle-wrapper.properties') }}
```

### Build Parallelization

```yaml
# Run independent jobs in parallel
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run typecheck

  # ... (condensed) ...
    needs: [lint, typecheck, unit-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
```

### Monorepo Build Optimization

```shell
# Only build changed packages
# Using Turborepo
npx turbo run build --filter='...[HEAD~1]'

# Using Nx
npx nx affected --target=build --base=HEAD~1

# Using git diff for custom scripts
CHANGED_DIRS=$(git diff --name-only HEAD~1 | cut -d'/' -f1-2 | sort -u)
for dir in $CHANGED_DIRS; do
  if [ -f "$dir/package.json" ]; then
    cd "$dir" && npm run build && cd -
  fi
done
```

## Test Parallelization

### Sharding Test Suites

```yaml
# Jest parallel shards
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx jest --shard=${{ matrix.shard }}/4

# Pytest parallel with pytest-xdist
- run: pytest -n auto --dist=loadfile

# Go parallel tests
- run: go test -parallel=4 -count=1 ./...
```

### Test Categorization

```
Fast tests (< 5 min) - Run on every commit:
  - Unit tests
  - Linting
  - Type checking
  - Static analysis

Medium tests (5-15 min) - Run on PR:
  - Integration tests
  - API contract tests
  - Component tests

Slow tests (15+ min) - Run on merge to main:
  - End-to-end tests
  - Performance tests
  - Load tests
  - Full security scans
```

## Deployment Strategies

### Rolling Update

```
Best for: Most applications with zero-downtime requirements.
Risk: Medium. Old and new versions run simultaneously during rollout.

Timeline:
  v1 v1 v1 v1    (4 replicas running v1)
  v2 v1 v1 v1    (1 replaced)
  v2 v2 v1 v1    (2 replaced)
  v2 v2 v2 v1    (3 replaced)
  v2 v2 v2 v2    (complete)
```

```yaml
# Kubernetes rolling update
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # Add 1 extra pod during update
      maxUnavailable: 0     # Never reduce below desired count
```

### Blue-Green Deployment

```
Best for: When you need instant rollback capability.
Risk: Low. Full validation before switching traffic.
Cost: Double infrastructure during deployment.

  [Load Balancer]
       │
  ┌────┴────┐
  │         │
  ▼         ▼
[Blue]   [Green]
 (v1)     (v2)
active   standby

Steps:
1. Deploy v2 to Green environment
2. Run smoke tests against Green
3. Switch load balancer from Blue to Green
4. If issues: switch back to Blue (instant rollback)
5. Decommission Blue (or keep as rollback target)
```

```shell
# AWS ALB blue-green with target groups
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG_ARN

# Rollback
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TG_ARN
```

### Canary Deployment

```
Best for: High-traffic services where you want to validate with real traffic.
Risk: Very low. Only a fraction of users see the new version.

  [Load Balancer]
       │
  ┌────┴────┐
  │95%      │5%
  ▼         ▼
[Stable]  [Canary]
  (v1)     (v2)

Steps:
1. Deploy v2 as canary (5% traffic)
2. Monitor error rates, latency, business metrics
3. If healthy: increase to 25%, 50%, 100%
4. If unhealthy: route 100% back to v1
```

```yaml
# Istio canary routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-server
spec:
  hosts:
    - api-server
  http:
    - route:
        - destination:
            host: api-server
            subset: stable
          weight: 95
        - destination:
            host: api-server
            subset: canary
          weight: 5
```

### Feature Flags (Progressive Delivery)

## Artifact Management

### Versioning Strategy

```shell
# Semantic versioning for releases
# MAJOR.MINOR.PATCH (e.g., 2.1.3)

# Git SHA for CI builds (immutable, traceable)
VERSION=$(git rev-parse --short=8 HEAD)

# Combination for production
VERSION="1.5.0-$(git rev-parse --short=8 HEAD)"

# Date-based for continuous deployment
VERSION="$(date +%Y%m%d)-$(git rev-parse --short=8 HEAD)"
```

### Artifact Storage Recommendations

| Artifact Type | Storage | Retention |
|--------------|---------|-----------|
| Container images | ECR, GCR, ACR, Docker Hub | 90 days for non-tagged, indefinite for releases |
| npm packages | npm registry, Artifactory | Indefinite for published versions |
| Java JARs | Maven Central, Nexus | Indefinite |
| Binaries | S3, GCS, Azure Blob | 30 days for snapshots, indefinite for releases |
| Helm charts | OCI registry, ChartMuseum | Indefinite for releases |

## Environment Promotion

### Promotion Pipeline

```
Build Artifact
     │
     ▼
┌─────────┐  auto-deploy   ┌─────────┐  manual gate   ┌─────────┐
│   Dev   │ ──────────────> │ Staging │ ──────────────> │  Prod   │
│         │                 │         │                 │         │
│ smoke   │                 │ e2e     │                 │ canary  │
│ tests   │                 │ tests   │                 │ rollout │
└─────────┘                 └─────────┘                 └─────────┘
```

### Environment Parity Rules

```
1. Same container image across all environments
2. Environment-specific config via:
   - Environment variables
   - ConfigMaps/Secrets per environment
   - Feature flags
3. Infrastructure parity:
   - Same Kubernetes version
   - Same resource ratios (prod has more replicas, not different architecture)
   - Same networking topology
4. Data parity:
   - Staging has anonymized production data
   - Never use production credentials in non-prod
```

## Security Scanning in CI

### Scanning Pipeline

```yaml
security-scan:
  stage: security
  parallel:
    matrix:
      - SCAN_TYPE: [sast, dependency, container, secrets, iac]
  script:
    - case $SCAN_TYPE in
        sast)
          semgrep scan --config=auto --error ;;
        dependency)
          trivy fs --scanners vuln --exit-code 1 --severity HIGH,CRITICAL . ;;
        container)
          trivy image --exit-code 1 --severity HIGH,CRITICAL $IMAGE ;;
        secrets)
          gitleaks detect --source . --exit-code 1 ;;
        iac)
          checkov --directory . --framework terraform --soft-fail ;;
      esac
```

### Security Gate Policy

```
CRITICAL vulnerabilities: Block deployment. Fix immediately.
HIGH vulnerabilities: Block deployment. Fix within 7 days.
MEDIUM vulnerabilities: Warning. Fix within 30 days.
LOW vulnerabilities: Informational. Fix at convenience.

Exceptions:
- Known false positives documented in .trivyignore or similar
- Mitigated vulnerabilities with documented compensating controls
- Third-party vulnerabilities with no available fix (time-boxed exception)
```

## Pipeline Anti-Patterns

```
AVOID:
  x Manual SSH deployments
  x Building different artifacts per environment
  x Skipping tests for "quick fixes"
  x Sharing CI/CD credentials across teams
  x Long-lived feature branches (> 2 days)
  x Running CI on self-hosted runners without security hardening
  x Storing secrets in pipeline YAML
  x Deploying on Fridays without automated rollback
  x Ignoring flaky tests (fix or quarantine them)
  x Pipeline configs that only one person understands

PREFER:
  + Immutable artifacts promoted across environments
  + Automated rollback on failure
  + Pipeline templates shared across teams
  + Secrets from vault/secrets manager (never in code)
  + Trunk-based development with feature flags
  + Self-service deployment for developers
  + Pipeline execution under 10 minutes for PR checks
  + Comprehensive pipeline documentation
```

## Rollback Procedures

### Automated Rollback

```shell
# Kubernetes
kubectl rollout undo deployment/api-server -n production
kubectl rollout status deployment/api-server -n production

# Helm
helm rollback my-release 0 --namespace production  # Previous revision

# AWS ECS
aws ecs update-service \
  --cluster production \
  --service api-server \
  --task-definition api-server:PREVIOUS_REVISION

# Feature flag (instant, no deployment needed)
HTTP client request -X PATCH [reference URL] \
  -H "Authorization: $LD_API_KEY" \
  -d '{"op": "replace", "path": "/environments/production/on", "value": false}'
```

### Rollback Decision Tree

```
Is the issue affecting users?
  YES -> Is there an automated rollback?
    YES -> Trigger rollback immediately, investigate after
    NO  -> Is it a feature flag issue?
      YES -> Disable the flag immediately
      NO  -> Manual rollback: deploy previous known-good version
  NO -> Is it a security vulnerability?
    YES -> Rollback and patch
    NO  -> Fix forward if the fix is simple and tested
```

## Metrics to Track

```
Pipeline Metrics:
  - Lead time for changes (commit to production)
  - Deployment frequency
  - Mean time to recovery (MTTR)
  - Change failure rate

Build Metrics:
  - Build duration (P50, P95)
  - Cache hit rate
  - Test pass rate
  - Flaky test rate

Deployment Metrics:
  - Deployment success rate
  - Rollback frequency
  - Time to rollback
  - Environment promotion time
```

## Pipeline Templates

### Reusable Pipeline Components

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: "22"
      working-directory:
        type: string
        default: "."
    outputs:
      artifact-name:
        value: ${{ jobs.build.outputs.artifact-name }}
# ... (condensed) ...
        run: echo "name=build-$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
      - uses: actions/upload-artifact@v4
        with:
          name: ${{ steps.meta.outputs.name }}
          path: ${{ inputs.working-directory }}/dist/
```

## Production Readiness Checklist

```
[ ] Pipeline runs on every PR and merge to main
[ ] Build completes in under 10 minutes for PR checks
[ ] All tests are automated (no manual test gates)
[ ] Security scanning integrated (SAST, dependencies, containers, secrets)
[ ] Artifacts are immutable and versioned
[ ] Deployment is automated with manual approval for production
[ ] Rollback procedure is documented and tested
[ ] Pipeline secrets are stored in a secrets manager
[ ] Environment promotion path is defined
[ ] Monitoring and alerting trigger on deployment failures
[ ] Pipeline configuration is version controlled
[ ] DORA metrics are tracked and reviewed regularly
```

## When to Use

**Use this skill when:**
- Designing or implementing cicd architect solutions
- Reviewing or improving existing cicd architect approaches
- Making architectural or implementation decisions about cicd architect
- Learning cicd architect patterns and best practices
- Troubleshooting cicd architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Cicd Architect Analysis

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

**Input:** "Help me implement cicd architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended cicd architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When cicd architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
