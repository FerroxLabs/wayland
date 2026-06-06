---
name: github-actions-expert
description: |
  GitHub Actions CI/CD expert covering workflow syntax, composite actions, reusable workflows, matrix strategies, self-hosted runners, caching strategies, secrets management, environment protection rules, and advanced workflow patterns.
  Use when the user asks about github actions expert, github actions expert best practices, or needs guidance on github actions expert implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automation shell-scripting ci-cd"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# GitHub Actions Expert

You are an expert in GitHub Actions who designs efficient, secure, and maintainable CI/CD pipelines. You understand the full range of GitHub Actions capabilities, from simple test-on-push workflows to complex matrix builds, reusable workflows, and deployment pipelines with environment protection rules. You optimize for speed, reliability, and developer experience.

## Workflow Fundamentals

### Workflow Structure

```yaml
# .github/workflows/ci.yml
name: CI Pipeline                    # Display name in GitHub UI

on:                                  # Trigger events
  push:
    branches: [main]
    paths-ignore:
      - '**.md'                      # Skip CI for docs-only changes
      - '.github/ISSUE_TEMPLATE/**'
  pull_request:
    branches: [main]
  workflow_dispatch:                  # Manual trigger
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options: [staging, production]

concurrency:                         # Prevent duplicate runs
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true           # Cancel previous run on same branch

permissions:                         # Least privilege
  contents: read
  pull-requests: write

env:                                 # Workflow-level environment variables
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint                      # Job dependency
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

### Trigger Events Reference

```yaml
# Common trigger configurations

# On push to specific branches
on:
  push:
    branches: [main, 'release/*']
    tags: ['v*']                     # Trigger on version tags

# On PR with specific conditions
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/**'                     # Only when source code changes
      - 'package.json'

# Scheduled (cron)
on:
  schedule:
    - cron: '0 6 * * 1'             # Every Monday at 6 AM UTC

# On release published
on:
  release:
    types: [published]

# Cross-workflow trigger
on:
  workflow_run:
    workflows: ["Build"]
    types: [completed]
    branches: [main]

# Repository dispatch (API trigger)
on:
  repository_dispatch:
    types: [deploy-trigger]
```

## Matrix Strategies

### Multi-Platform, Multi-Version Testing

```yaml
jobs:
  test:
    strategy:
      fail-fast: false               # Do not cancel other matrix jobs on failure
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20, 22]
        exclude:
          - os: windows-latest
            node: 18                 # Skip Node 18 on Windows
        include:
          - os: ubuntu-latest
            node: 20
            coverage: true           # Add coverage only for this combo

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
      - if: matrix.coverage
        run: npm run test:coverage
```

### Dynamic Matrix

```yaml
jobs:
  # Generate matrix from code
  discover:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.find.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
      - id: find
        run: |
          # Find all packages in the monorepo
          PACKAGES=$(ls packages/ | jq -R -s -c 'split("\n")[:-1]')
          echo "packages=$PACKAGES" >> "$GITHUB_OUTPUT"

  test:
    needs: discover
    strategy:
      matrix:
        package: ${{ fromJson(needs.discover.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -w packages/${{ matrix.package }}
```

## Caching Strategies

### Dependency Caching

```yaml
# Node.js (built-in to setup-node)
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'                     # Automatic npm cache

# Custom cache (for build outputs, etc.)
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      .next/cache
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Docker layer caching
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ env.REGISTRY }}/${{ github.repository }}:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Cache Tips

```
1. Hash LOCK FILES not source files: hashFiles('**/package-lock.json')
2. Use restore-keys for partial cache matches (most recent fallback)
3. Cache build outputs (.next/cache, dist/) not just dependencies
4. Separate caches per purpose (they invalidate at different rates)
5. 10 GB limit per repo -- LRU eviction applies
```

## Reusable Workflows

### Creating a Reusable Workflow

```yaml
# .github/workflows/reusable-deploy.yml
name: Reusable Deploy

on:
  workflow_call:                      # Makes this reusable
    inputs:
      environment:
        required: true
        type: string
      image-tag:
        required: true
        type: string
    secrets:
      AWS_ACCESS_KEY_ID:
        required: true
      AWS_SECRET_ACCESS_KEY:
        required: true
    outputs:
      deploy-url:
        description: 'The deployment URL'
        value: ${{ jobs.deploy.outputs.url }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - id: deploy
        run: |
          # Deploy to ECS/K8s/etc.
          URL=$(deploy --env ${{ inputs.environment }} --image ${{ inputs.image-tag }})
          echo "url=$URL" >> "$GITHUB_OUTPUT"
```

### Calling a Reusable Workflow

```yaml
# .github/workflows/ci-cd.yml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}

  deploy-staging:
    needs: build
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: staging
      image-tag: ${{ needs.build.outputs.image-tag }}
    secrets:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-production:
    needs: deploy-staging
    uses: ./.github/workflows/reusable-deploy.yml
    with:
      environment: production
      image-tag: ${{ needs.build.outputs.image-tag }}
    secrets:
      AWS_ACCESS_KEY_ID: ${{ secrets.PROD_AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.PROD_AWS_SECRET_ACCESS_KEY }}
```

## Composite Actions

### Creating a Composite Action

```yaml
# .github/actions/setup-project/action.yml
name: 'Setup Project'
description: 'Install dependencies and build the project'

inputs:
  node-version:
    description: 'Node.js version'
    required: false
    default: '20'

outputs:
  cache-hit:
    description: 'Whether the cache was hit'
    value: ${{ steps.cache.outputs.cache-hit }}

runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}

    - id: cache
      uses: actions/cache@v4
      with:
        path: node_modules
        key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

    - if: steps.cache.outputs.cache-hit != 'true'
      run: npm ci
      shell: shell

    - run: npm run build
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
          node-version: '20'
      - run: npm test
```

## Self-Hosted Runners

### When to Use Self-Hosted Runners

```
USE SELF-HOSTED WHEN:
  - Builds require specific hardware (GPU, ARM, high memory)
  - Network access to internal resources is needed
  - Cost optimization for heavy CI usage (>2000 min/month)
  - Regulatory requirements (data cannot leave your network)
  - Builds need persistent local caches (large monorepos)

USE GITHUB-HOSTED WHEN:
  - Standard compute needs
  - Security isolation is important (ephemeral environments)
  - Low maintenance is preferred
  - Usage is moderate (<2000 min/month)
```

### Runner Group Configuration

```yaml
# Target specific runner groups
jobs:
  build:
    runs-on:
      group: production-runners
      labels: [self-hosted, linux, x64, gpu]
    steps:
      - uses: actions/checkout@v4
      - run: nvidia-smi  # GPU available on self-hosted
      - run: make build
```

## Secrets Management

```yaml
# Environment-specific secrets
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production           # Uses production-specific secrets
    steps:
      - name: Deploy
        env:
          DB_URL: ${{ secrets.DATABASE_URL }}      # Environment secret
          API_KEY: ${{ secrets.API_KEY }}           # Repository secret
        run: deploy --db-url "$DB_URL"

# OIDC for cloud providers (no static secrets!)
  deploy-aws:
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-deploy
          aws-region: us-east-1
          # No static keys -- uses GitHub OIDC token
```

## Advanced Patterns

### Monorepo: Run Only Affected Packages

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.changes.outputs.api }}
      web: ${{ steps.changes.outputs.web }}
      shared: ${{ steps.changes.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            api:
              - 'packages/api/**'
              - 'packages/shared/**'
            web:
              - 'packages/web/**'
              - 'packages/shared/**'
            shared:
              - 'packages/shared/**'

  test-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test -w packages/api

  test-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test -w packages/web
```

### Environment Protection Rules

Configure in GitHub UI per environment: required reviewers, wait timers, branch restrictions.

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: [reference URL]
    steps:
      - run: echo "Deploying to production..."
```

## Quick Reference Card

```
TRIGGERS: push, pull_request, schedule, workflow_dispatch, workflow_call, release
MATRIX: Multi-OS/version testing, fail-fast:false, include/exclude, dynamic from JSON
CACHING: Hash lockfiles, restore-keys for partial matches, 10GB limit, separate caches
REUSABLE: workflow_call for shared pipelines, composite actions for shared steps
RUNNERS: GitHub-hosted (simple), self-hosted (specific hardware, cost, network)
SECRETS: Environment-specific, OIDC for cloud (no static keys), never log secrets
OPTIMIZE: Concurrency groups, path filters, parallel jobs, cache everything, fail fast
SECURITY: Minimum permissions, pin action versions, OIDC over static credentials
```

## When to Use

**Use this skill when:**
- Designing or implementing github actions expert solutions
- Reviewing or improving existing github actions expert approaches
- Making architectural or implementation decisions about github actions expert
- Learning github actions expert patterns and best practices
- Troubleshooting github actions expert-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Github Actions Expert Analysis

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

**Input:** "Help me implement github actions expert for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended github actions expert approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When github actions expert must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
