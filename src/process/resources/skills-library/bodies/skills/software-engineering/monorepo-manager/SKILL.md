---
name: monorepo-manager
description: |
  Monorepo management covering tool comparison (Nx, Turborepo, Lerna, Bazel), workspace configuration, dependency management, build caching, affected detection, task pipelines, CI optimization, and migration from polyrepo.
  Use when the user asks about monorepo manager, monorepo manager best practices, or needs guidance on monorepo manager implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices architecture guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Monorepo Manager

You are an expert in monorepo management. Design monorepo architectures that scale to hundreds of packages and thousands of developers. Monorepos succeed when the tooling makes working in a large codebase feel like working in a small one.

## When to Use a Monorepo

### Benefits
- **Atomic changes**: Modify multiple packages in a single commit and PR.
- **Shared tooling**: One linter config, one CI pipeline, one dependency tree.
- **Code reuse**: Easy to extract shared libraries. No publish-then-consume cycle.
- **Consistent versions**: All packages use the same version of shared dependencies.
- **Cross-project refactoring**: Rename a function and update all callers in one commit.

### Drawbacks
- **Tooling complexity**: Standard tools break at scale. You need specialized build systems.
- **CI time**: Every change must determine what to test. Naive CI runs everything.
- **Repository size**: Clone time increases. Need shallow clones and sparse checkout.
- **Access control**: Harder to restrict access to subsets of code (git does not have per-directory permissions).
- **Learning curve**: New developers must understand the workspace structure.

### Decision Matrix

| Criterion | Monorepo | Polyrepo |
|-----------|----------|----------|
| Teams share code frequently | Monorepo | -- |
| Independent release cycles | -- | Polyrepo |
| Cross-project atomic changes needed | Monorepo | -- |
| Strict access control required | -- | Polyrepo |
| Shared tooling/standards desired | Monorepo | -- |
| Teams are fully autonomous | -- | Polyrepo |

## Tool Comparison

### Feature Matrix

| Feature | Nx | Turborepo | Lerna | Bazel | pnpm Workspaces |
|---------|----|-----------| ------|-------|-----------------|
| Task orchestration | Yes | Yes | Basic | Yes | No |
| Build caching (local) | Yes | Yes | No | Yes | No |
| Build caching (remote) | Yes (Nx Cloud) | Yes (Vercel) | No | Yes (any) | No |
| Affected detection | Yes | Yes (via Turborepo) | Yes | Yes | No |
| Code generation | Yes (generators) | No | No | No | No |
| Dependency graph viz | Yes | Yes | Yes | Yes | No |
| Language support | JS/TS (+ plugins for Go, Rust, etc.) | JS/TS | JS/TS | Any language | JS/TS |
| Learning curve | Medium | Low | Low | High | Low |
| Best for | Full-featured JS/TS monorepos | Fast, simple JS/TS monorepos | Legacy, publishing-focused | Large multi-language repos | Simple workspaces |

### Nx Setup
```shell
npx create-nx-workspace@latest my-org --preset=ts
```

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  }
}
```

### Turborepo Setup
```shell
npx create-turbo@latest
```

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Bazel Setup (Concept)
```python
# BUILD file
load("@rules_nodejs//nodejs:defs.bzl", "nodejs_binary")

nodejs_binary(
    name = "server",
    entry_point = "src/main.ts",
    deps = [
        "//packages/shared:lib",
        "//packages/auth:lib",
        "@npm//express",
    ],
)
```

## Workspace Configuration

### Package Manager Workspaces

#### pnpm (Recommended)
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'tools/*'
```

#### npm
```json
// package.json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

#### yarn
```json
// package.json
{
  "workspaces": {
    "packages": ["packages/*", "apps/*"],
    "nohoist": ["**/react-native", "**/react-native/**"]
  }
}
```

### Recommended Directory Structure
```
my-org/
  apps/
    web/                   # Next.js web app
    api/                   # Express API server
    mobile/                # React Native app
  packages/
    ui/                    # Shared UI components
    utils/                 # Shared utility functions
    config/                # Shared configuration (ESLint, TypeScript, etc.)
    types/                 # Shared TypeScript types
    database/              # Database client and migrations
  tools/
    scripts/               # Build and deployment scripts
    generators/            # Code generators
  package.json             # Root package.json
  pnpm-workspace.yaml      # Workspace definition
  turbo.json               # Build pipeline configuration
  tsconfig.base.json       # Shared TypeScript config
  .eslintrc.js             # Shared ESLint config
```

### Internal Package Setup
```json
// packages/utils/package.json
{
  "name": "@myorg/utils",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "lint": "eslint src/"
  }
}
```

```json
// apps/web/package.json
{
  "name": "@myorg/web",
  "dependencies": {
    "@myorg/utils": "workspace:*",
    "@myorg/ui": "workspace:*"
  }
}
```

## Dependency Management

### Hoisting Strategy
- Hoist shared devDependencies (TypeScript, ESLint, Prettier) to root.
- Keep runtime dependencies in each package.
- Use `pnpm` (strict by default, prevents phantom dependencies).

### Version Consistency
```json
// Root package.json - enforce consistent versions
{
  "pnpm": {
    "supersedes": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "typescript": "^5.3.0"
    }
  }
}
```

### Syncpack (Version Consistency Tool)
```shell
# Check for version mismatches
npx syncpack list-mismatches

# Fix mismatches
npx syncpack fix-mismatches
```

## Build Caching

### How Build Caching Works

1. Hash the inputs (source files, dependencies, environment).
2. Check if a cache entry exists for that hash.
3. If yes, restore the cached outputs. If no, run the task and cache the outputs.

```
Inputs (hash) -> Cache Lookup
  |                |
  Hit              Miss
  |                |
  Restore          Run Task
  outputs          |
                   Store outputs
                   in cache
```

### Cache Configuration (Turborepo)
```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"]
    }
  }
}
```

### Remote Caching
Share cache across developers and CI:

```shell
# Turborepo with Vercel
npx turbo login
npx turbo link

# Nx with Nx Cloud
npx nx connect-to-nx-cloud
```

### Cache Hit Rates
Target > 80% cache hit rate in CI. Monitor and investigate misses:
- Changing environment variables that should not be inputs.
- Non-deterministic build outputs (timestamps, random IDs).
- Missing inputs in the cache configuration.

## Affected Detection

Run only what is affected by a change. This is the key to fast CI in monorepos.

### How It Works
1. Build the dependency graph of all packages.
2. Determine which files changed (git diff).
3. Map changed files to packages.
4. Find all packages that depend on the changed packages (transitively).
5. Run tasks only for affected packages.

### Commands
```shell
# Nx
nx affected --target=test --base=main --head=HEAD

# Turborepo (via filter)
turbo run test --filter=...[HEAD^1]

# Lerna
lerna run test --since=main
```

### Affected Detection in CI
```yaml
# GitHub Actions with Nx
- name: Run affected tests
  run: npx nx affected --target=test --base=origin/main --head=HEAD
```

## Task Pipelines

### Defining Task Dependencies
```
build (packages/ui) ──> build (apps/web) ──> deploy (apps/web)
                    ──> build (apps/api) ──> deploy (apps/api)
                    ──> test (apps/web)
                    ──> test (apps/api)
```

### Pipeline Configuration
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // depends on build of dependencies
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],   // depends on own build
      "outputs": []
    },
    "deploy": {
      "dependsOn": ["build", "test"],
      "outputs": []
    },
    "lint": {
      // No dependencies, can run in parallel
      "outputs": []
    }
  }
}
```

### Parallelism
```shell
# Run up to 4 tasks in parallel
turbo run build --concurrency=4

# Use all available CPUs
turbo run build --concurrency=100%
```

## CI Optimization for Monorepos

### Strategies

1. **Affected-only execution**: Only run tests/builds for changed packages.
2. **Remote caching**: Share build cache between CI runs.
3. **Distributed execution**: Spread tasks across multiple CI agents.
4. **Shallow clone**: `git clone --depth=1` to reduce clone time.
5. **Dependency caching**: Cache `node_modules` between CI runs.
6. **Selective checkout**: Use sparse checkout to reduce working directory size.

### GitHub Actions Example
```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0   # needed for affected detection

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pinstall via npm: --frozen-lockfile

      - name: Run affected lint
        run: pnpm turbo run lint --filter=...[origin/main]

      - name: Run affected tests
        run: pnpm turbo run test --filter=...[origin/main]

      - name: Run affected build
        run: pnpm turbo run build --filter=...[origin/main]
```

### Distributed Task Execution (Nx)
```shell
# Split tasks across multiple CI agents
nx affected --target=build --parallel=3 --distribution
```

## Migration from Polyrepo

### Migration Plan

#### Phase 1: Preparation (1-2 weeks)
1. Inventory all repositories to migrate.
2. Document inter-repo dependencies.
3. Choose monorepo tooling (Nx, Turborepo, etc.).
4. Set up the monorepo skeleton.
5. Configure shared tooling (linting, TypeScript, testing).

#### Phase 2: Import Repositories (2-4 weeks)
```shell
# Import with full git history
git subtree add --prefix=packages/auth <auth-repo-url> main

# Or use a migration tool
npx nx import <repo-url> packages/my-package
```

For each repository:
1. Import into the monorepo under `packages/` or `apps/`.
2. Update import paths to use workspace references.
3. Replace published package dependencies with `workspace:*`.
4. Verify all tests pass.
5. Set up CI for the migrated package.

#### Phase 3: Unify (2-4 weeks)
1. Consolidate shared dependencies.
2. Extract common configurations to root.
3. Set up affected detection and caching.
4. Migrate CI from per-repo to monorepo.
5. Archive old repositories (do not delete yet).

#### Phase 4: Optimize (Ongoing)
1. Monitor CI times. Optimize with caching and affected detection.
2. Extract shared libraries from duplicated code across packages.
3. Establish conventions for new packages.
4. Document the monorepo workflow for new developers.

### Common Migration Pitfalls
- **Trying to migrate everything at once**: Migrate one package at a time.
- **Losing git history**: Use `git subtree` or dedicated migration tools.
- **Not updating CI**: Monorepo CI must use affected detection from day one.
- **Ignoring dependency conflicts**: Two repos may use incompatible versions of the same dependency. Resolve before or during migration.
- **No shared tooling setup**: Without shared linting and testing config, the monorepo is just repos in a trench coat.

## Output Format

```markdown
# Monorepo Manager Analysis

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

**Input:** "Help me implement monorepo manager for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended monorepo manager approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When monorepo manager must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
