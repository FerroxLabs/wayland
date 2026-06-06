---
name: github-actions
description: |
  GitHub Actions CI/CD. Workflow syntax, reusable workflows, composite actions, matrix builds, environment protection, secrets management, caching (npm, pip, docker), artifact management, custom runners, security hardening.
  Use when the user asks about github actions, github actions best practices, or needs guidance on github actions implementation.
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
  difficulty: "advanced"
---

# GitHub Actions

You are a GitHub Actions CI/CD expert with deep knowledge of workflow design, reusable components, security hardening, caching, and operational patterns for building efficient pipelines.

## Core Principles

1. **Workflow as code** - All CI/CD configuration lives in `.github/workflows/` alongside the application.
2. **Reusable components** - Extract common patterns into reusable workflows and composite actions.
3. **Security first** - Minimal permissions, pin action versions by SHA, protect secrets.
4. **Fast feedback** - Optimize for developer experience. Fail fast, cache aggressively.
5. **Idempotent runs** - Every workflow run produces the same result for the same input.

## Workflow Syntax Fundamentals

### Complete Workflow Structure

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '*.md'
      - 'docs/**'
  pull_request:
    branches: [main]
  workflow_dispatch:
    # ... (condensed) ...
      - uses: actions/checkout@v4
      - name: Deploy
        run: |
          echo "Deploying ${{ needs.build.outputs.image-tag }} to production"
```

## Reusable Workflows

### Defining a Reusable Workflow

```yaml
# .github/workflows/reusable-deploy.yml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      image-tag:
        required: true
        # ... (condensed) ...
        name: Deploy to ${{ inputs.environment }}
        run: |
          echo "Deploying ${{ inputs.image-tag }} to ${{ inputs.environment }}"
          echo "url=[reference URL] inputs.environment }}.example.com" >> "$GITHUB_OUTPUT"
```

### Calling a Reusable Workflow

```yaml
# .github/workflows/main.yml
jobs:
  build:
    # ... build job ...

  deploy-staging:
    needs: build
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      image-tag: ${{ needs.build.outputs.image-tag }}
    # ... (condensed) ...
      environment: production
      image-tag: ${{ needs.build.outputs.image-tag }}
    secrets:
      AWS_ROLE_ARN: ${{ secrets.PROD_AWS_ROLE_ARN }}
```

## Composite Actions

### Creating a Composite Action

```yaml
# .github/actions/setup-project/action.yml
name: Setup Project
description: Install dependencies and set up the project

inputs:
  node-version:
    description: Node.js version
    required: false
    default: '22'
  install-playwright:
    description: Install Playwright browsers
    # ... (condensed) ...

    - if: inputs.install-playwright == 'true'
      run: npx playwright install --with-deps chromium
      shell: shell
```

### Using the Composite Action

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-project
        with:
          install-playwright: 'true'
      - run: npm test
```

## Matrix Builds

```yaml
jobs:
  test:
    strategy:
      fail-fast: false           # Don't cancel other jobs if one fails
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [20, 22]
        exclude:
          - os: macos-latest
            node: 20
        include:
          # ... (condensed) ...
      - run: npm ci
      - run: npm test
      - if: matrix.coverage
        run: npm run test:coverage
```

## Environment Protection

```yaml
# Configure in: Settings > Environments
# Environments: staging, production

# staging:
#   - No required reviewers
#   - Branch policy: main, develop
#   - Deployment timeout: 30 minutes

# production:
#   - Required reviewers: 2
#   - Branch policy: main only
#   - Wait timer: 5 minutes
#   - Environment secrets: PROD_API_KEY
```

## Secrets Management

### Secret Types and Scope

```
Organization secrets:  Available to all repos in org (or selected repos)
Repository secrets:    Available to all workflows in repo
Environment secrets:   Available only in jobs using that environment

Naming conventions:
  AWS_ROLE_ARN_STAGING    (environment-specific)
  DOCKER_PASSWORD         (service-specific)
  SLACK_WEBHOOK_URL       (integration-specific)
```

### OIDC for Cloud Authentication (No Long-Lived Secrets)

```yaml
# AWS with OIDC (no access keys needed)
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
      aws-region: us-east-1

# ... (condensed) ...
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

## Caching Strategies

### Language-Specific Caching

```yaml
# Node.js (npm)
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm               # Built-in cache support

# Python (pip)
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: pip
# ... (condensed) ...
      ~/.cargo/git/db/
      target/
    key: cargo-${{ runner.os }}-${{ hashFiles('**/Cargo.lock') }}
    restore-keys: cargo-${{ runner.os }}-
```

### Docker Layer Caching

```yaml
# Using GitHub Actions cache backend (recommended)
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    cache-from: type=gha
    cache-to: type=gha,mode=max

# Using registry cache
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myregistry/myapp:latest
    cache-from: type=registry,ref=myregistry/myapp:cache
    cache-to: type=registry,ref=myregistry/myapp:cache,mode=max
```

## Artifact Management

```yaml
# Upload artifacts
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: |
      dist/
      !dist/**/*.map
    retention-days: 5
    if-no-files-found: error

# Download in another job
# ... (condensed) ...
- uses: actions/download-artifact@v4
  with:
    path: all-artifacts/
    merge-multiple: true
```

## Custom Runners

### Self-Hosted Runner Configuration

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64, gpu]    # Label-based selection
    timeout-minutes: 30
    container:                                   # Run in Docker container
      image: node:22-slim
      credentials:
        username: ${{ secrets.REGISTRY_USER }}
        password: ${{ secrets.REGISTRY_PASS }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
```

### Runner Group Strategy

```
Ephemeral runners (recommended):
  - Fresh environment for each job
  - No state leakage between jobs
  - Use --ephemeral flag when registering

Runner labels:
  - self-hosted, linux, x64      (general purpose)
  - self-hosted, linux, gpu      (ML/GPU workloads)
  - self-hosted, linux, arm64    (ARM builds)
  - self-hosted, macos, m1       (macOS builds)
```

## Security Hardening

### Workflow Permissions

```yaml
# Repository-level: Settings > Actions > General > Workflow permissions
# Set to "Read repository contents and packages permissions"

# Workflow-level: Minimal permissions per job
permissions:
  contents: read          # Default: read repo contents
  packages: write         # Push to GHCR
  id-token: write         # OIDC authentication
  pull-requests: write    # Comment on PRs
  issues: write           # Create/update issues
  security-events: write  # Upload SARIF
```

### Pin Actions by SHA

```yaml
# BAD: Mutable tag (can be overwritten by attacker)
- uses: actions/checkout@v4

# GOOD: Pinned to specific SHA (immutable)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1

# Use Dependabot to keep pinned SHAs updated
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    groups:
      actions:
        patterns: ["*"]
```

### Preventing Script Injection

```yaml
# BAD: Direct interpolation of untrusted input (injection risk)
- run: echo "Title is ${{ github.event.pull_request.title }}"

# GOOD: Use environment variable (safe from injection)
- env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "Title is ${PR_TITLE}"

# BAD: Using issue body in scripts
- run: echo "${{ github.event.issue.body }}"

# GOOD: Environment variable
- env:
    ISSUE_BODY: ${{ github.event.issue.body }}
  run: echo "${ISSUE_BODY}"
```

### Security Scanning in Workflows

```yaml
security:
  runs-on: ubuntu-latest
  permissions:
    security-events: write
  steps:
    - uses: actions/checkout@v4

    # Dependency scanning
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        # ... (condensed) ...

    # SAST
    - name: CodeQL
      uses: github/codeql-action/analyze@v3
```

## Advanced Patterns

### Conditional Job Execution

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          # ... (condensed) ...
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd packages/web && npm test
```

### Service Containers

```yaml
jobs:
  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          # ... (condensed) ...
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
```

### Release Automation

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      # ... (condensed) ...
          generate_release_notes: true
          files: |
            dist/*.tar.gz
            dist/*.zip
```

## Workflow Optimization Tips

```
1. Use concurrency groups to cancel redundant runs
2. Cache dependencies aggressively (npm, pip, Docker layers)
3. Run independent jobs in parallel
4. Use matrix builds for cross-platform testing
5. Use path filters to skip irrelevant workflows
6. Set timeout-minutes on every job
7. Use fail-fast: false in matrix to get all results
8. Use composite actions for shared setup steps
9. Use artifacts to pass data between jobs (not caches)
10. Minimize steps that need secrets (reduce exposure)
```

## Production Checklist

```
[ ] All workflows have timeout-minutes set
[ ] Concurrency groups prevent duplicate runs
[ ] Actions pinned by SHA (not mutable tags)
[ ] Minimal permissions declared per workflow and job
[ ] Secrets use OIDC where possible (no long-lived credentials)
[ ] Untrusted inputs use environment variables (no direct interpolation)
[ ] Caching configured for dependencies and Docker layers
[ ] Reusable workflows for common patterns
[ ] Environment protection rules for production
[ ] Dependabot configured for action updates
[ ] Security scanning integrated (dependencies, secrets, SAST)
[ ] Branch protection requires CI to pass
[ ] Workflow files are reviewed in PRs
```

## When to Use

**Use this skill when:**
- Designing or implementing github actions solutions
- Reviewing or improving existing github actions approaches
- Making architectural or implementation decisions about github actions
- Learning github actions patterns and best practices
- Troubleshooting github actions-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Github Actions Analysis

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

**Input:** "Help me implement github actions for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended github actions approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When github actions must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
