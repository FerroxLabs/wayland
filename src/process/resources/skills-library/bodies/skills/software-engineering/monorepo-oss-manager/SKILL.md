---
name: monorepo-oss-manager
description: |
  Open source monorepo management expertise covering multi-package repository architecture, Changesets for versioning and changelogs, independent vs synchronized versioning, CI/CD optimization (caching, affected detection), workspace tooling (Turborepo, Nx, pnpm workspaces), and contributor experience in large repositories.
  Use when the user asks about monorepo oss manager, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of monorepo oss manager or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices template python javascript typescript api-design testing automation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Monorepo OSS Manager

You are an expert open source monorepo manager who helps teams structure multi-package repositories, manage independent versioning and releases, optimize CI/CD pipelines, and maintain excellent contributor experience as repositories grow in size and complexity.


## When to Use

**Use this skill when:**
- User asks about monorepo oss manager techniques or best practices
- User needs guidance on monorepo oss manager concepts
- User wants to implement or improve their approach to monorepo oss manager

**Do NOT use when:**
- The request falls outside the scope of monorepo oss manager
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Ecosystem:** JavaScript/TypeScript (npm), Rust (Cargo), Go, Python, or multi-language?
2. **Package count:** How many packages currently, and expected growth?
3. **Versioning strategy:** Independent versions per package, or synchronized versions?
4. **Current setup:** Starting fresh, or migrating from multi-repo? What tools are you using?
5. **CI provider:** GitHub Actions, GitLab CI, CircleCI, or other?
6. **Team size:** Number of maintainers and regular contributors?
7. **Release cadence:** How often do you release, and is it automated?

---

## Monorepo Architecture

### Directory Structure

```
my-oss-project/
├── .changeset/               # Changeset configuration and pending changes
│   └── config.json
├── .github/
│   └── workflows/
│       ├── ci.yml            # Build/test pipeline
│       ├── release.yml       # Automated release pipeline
│       └── size-check.yml    # Bundle size tracking
├── packages/
│   ├── core/                 # @myproject/core
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── CHANGELOG.md
│   │   └── README.md
│   ├── react/                # @myproject/react
│   │   ├── src/
│   │   ├── package.json      # depends on @myproject/core
│   │   └── CHANGELOG.md
│   └── cli/                  # @myproject/cli
│       ├── src/
│       ├── package.json
│       └── CHANGELOG.md
├── apps/                     # Example apps, docs site (not published)
│   ├── docs/
│   └── playground/
├── scripts/                  # Shared build/release scripts
├── turbo.json                # Turborepo configuration
├── pnpm-workspace.yaml       # Workspace package globs
├── package.json              # Root package.json
└── tsconfig.base.json        # Shared TypeScript config
```

### Workspace Configuration (pnpm)

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// Root package.json
{
  "name": "myproject-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "changeset": "changeset",
    "release": "turbo run build && changeset publish",
    "version-packages": "changeset version"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## Changesets for Versioning

### Setup

```shell
pnpm add -Dw @changesets/cli
pnpm changeset init
```

```json
// .changeset/config.json
{
  "$schema": "[external resource]",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "owner/repo" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Versioning Strategies

```
Independent Versioning (recommended for most OSS):
  @myproject/core: 2.3.1
  @myproject/react: 1.5.0
  @myproject/cli: 3.0.2

  Config: "fixed": []  (default, each package versions independently)
  When: Packages have different stability levels and release cadences

Fixed/Synchronized Versioning:
  @myproject/core: 2.3.1
  @myproject/react: 2.3.1
  @myproject/cli: 2.3.1

  Config: "fixed": [["@myproject/core", "@myproject/react", "@myproject/cli"]]
  When: Packages are always used together (like Babel, React)

Linked Versioning (hybrid):
  If any linked package gets a major bump, all get major bumped
  But minor/patch can be independent

  Config: "linked": [["@myproject/core", "@myproject/react"]]
  When: Some packages must stay compatible but have different cadences
```

### Changeset Workflow

```shell
# Developer creates a changeset describing their change
pnpm changeset

# Interactive prompts:
# 1. Which packages are affected?
# 2. Is this a major, minor, or patch for each?
# 3. Write a summary of the change

# This creates a file like:
# .changeset/happy-dogs-dance.md
```

```markdown
---
"@myproject/core": minor
"@myproject/react": patch
---

Added support for custom themes in the core configuration.
React bindings updated to pass theme prop correctly.
```

```shell
# At release time, consume all pending changesets:
pnpm changeset version
# This:
# - Bumps package.json versions
# - Updates CHANGELOG.md for each package
# - Deletes consumed changeset files
# - Updates internal dependency versions

# Then publish:
pnpm changeset publish
# Publishes all changed packages to npm
# Creates git tags for each published version
```

---

## CI/CD Optimization

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "[external resource]",
  "globalDependencies": ["tsconfig.base.json"],
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "inputs": ["src/**", "tsconfig.json", "package.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          clone-depth: 2  # needed for change detection

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      # Turborepo remote cache (shared across CI runs)
      - name: Cache turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ github.sha }}
          restore-keys: turbo-${{ runner.os }}-

      - run: pnpm install --frozen-lockfile

      # Only build/test affected packages
      - name: Build affected
        run: pnpm turbo run build --filter='...[HEAD~1]'

      - name: Test affected
        run: pnpm turbo run test --filter='...[HEAD~1]'

      - name: Lint all (fast, no cache)
        run: pnpm turbo run lint

      # Changeset check (PRs must include changeset)
      - name: Check changeset
        if: github.event_name == 'pull_request'
        run: |
          pnpm changeset status --since=origin/main
```

### Automated Release Pipeline

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          version: pnpm changeset version
          title: 'chore: release packages'
          commit: 'chore: release packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Affected Package Detection

### Turborepo Filter Syntax

```shell
# Build only packages that changed since last commit
turbo run build --filter='...[HEAD~1]'

# Build a specific package and its dependencies
turbo run build --filter=@myproject/react...

# Build everything that depends on core
turbo run build --filter=...@myproject/core

# Build packages changed in this PR
turbo run build --filter='...[origin/main]'
```

### Custom Affected Detection Script

```javascript
// scripts/affected.js
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

function getChangedFiles(base) {
  const result = execFileSync('git', ['diff', '--name-only', base || 'origin/main']);
  return result.toString().trim().split('\n').filter(Boolean);
}

function getAffectedPackages(changedFiles) {
  const packageDirs = fs.readdirSync('packages');
  const affected = new Set();

  for (const file of changedFiles) {
    for (const pkg of packageDirs) {
      if (file.startsWith('packages/' + pkg + '/')) {
        affected.add(pkg);
      }
    }
    // Root config changes affect everything
    if (file.match(/^(tsconfig|turbo|pnpm)/)) {
      packageDirs.forEach(p => affected.add(p));
    }
  }

  return [...affected];
}
```

---

## Internal Dependencies

### Managing Cross-Package References

```json
// packages/react/package.json
{
  "name": "@myproject/react",
  "version": "1.5.0",
  "dependencies": {
    "@myproject/core": "workspace:^"
  }
}
```

```
workspace: protocol (pnpm):
  "workspace:*"  -> resolves to exact version at publish time (e.g., "2.3.1")
  "workspace:^"  -> resolves to caret range (e.g., "^2.3.1")
  "workspace:~"  -> resolves to tilde range (e.g., "~2.3.1")

Recommendation: Use "workspace:^" for internal dependencies
  - Allows consumers to use compatible versions
  - Changesets automatically bumps dependents when dependency changes
```

### Dependency Graph Visualization

```shell
# Turborepo graph
turbo run build --graph=graph.html

# pnpm recursive list
pnpm -r list --depth=0

# Custom dependency graph
pnpm ls -r --json | node scripts/dep-graph.js
```

---

## Contributor Experience

### First-Time Contributor Setup

```markdown
## Development Setup

1. **Fork and clone** the repository
2. **Install dependencies**: `pnpm install` (requires pnpm 9+)
3. **Build all packages**: `pnpm build`
4. **Run tests**: `pnpm test`
5. **Create a branch**: `git checkout -b my-feature`

### Making Changes

1. Make your changes in `packages/<name> ./src/`
2. Add tests for new functionality
3. Create a changeset: `pnpm changeset`
   - Select affected packages
   - Choose version bump type (patch/minor/major)
   - Write a summary for the changelog
4. Run `pnpm build && pnpm test` to verify
5. Open a Pull Request

### Changeset Guidelines

Every PR that changes package behavior needs a changeset:
- **patch**: Bug fixes, documentation, internal refactoring
- **minor**: New features, non-breaking additions
- **major**: Breaking changes (API changes, dropped support)

PRs that don't need a changeset:
- Changes to CI/CD configuration
- Changes to non-published files (docs site, examples)
- README updates
```

### PR Template

```markdown
## Description
[What does this PR do?]

## Packages Affected
- [ ] @myproject/core
- [ ] @myproject/react
- [ ] @myproject/cli

## Changeset
- [ ] I've added a changeset (`pnpm changeset`)

## Testing
- [ ] New tests added
- [ ] Existing tests pass
```

---

## Scaling Considerations

### When the Monorepo Gets Large (50+ packages)

```
Problem: CI takes too long
Solution:
  - Turborepo remote caching (share cache across CI runs)
  - Only build/test affected packages
  - Parallelize independent tasks
  - Use larger CI runners for bottleneck packages

Problem: Install time is slow
Solution:
  - pnpm (efficient deduplication)
  - Prune dev dependencies in CI for release jobs
  - Cache node_modules in CI

Problem: Hard to navigate the codebase
Solution:
  - CODEOWNERS file mapping packages to maintainers
  - Package-level README files
  - Architecture decision records (ADRs)
  - Automated dependency graph in docs
Problem: Too many releases to manage manually
Solution:
  - Fully automated release via Changesets + GitHub Actions
  - Snapshot releases for prereleases
  - Canary releases from main for testing
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to monorepo oss manager
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Monorepo Oss Manager Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with monorepo oss manager for my current situation"

**Output:**

Based on your situation, here is a structured approach to monorepo oss manager:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
