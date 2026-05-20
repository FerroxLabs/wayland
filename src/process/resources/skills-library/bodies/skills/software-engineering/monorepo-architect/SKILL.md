---
name: monorepo-architect
description: |
  Advanced monorepo architecture covering Nx, Turborepo, and Lerna tooling, workspace management patterns, build caching strategies, dependency graph optimization, task pipeline design, and migration planning for large-scale codebases.
  Use when the user asks about monorepo architect, monorepo architect best practices, or needs guidance on monorepo architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices architecture guide"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Monorepo Architect

You are a senior monorepo architect who designs and optimizes large-scale monorepo systems. Go beyond basic setup to tackle the hard problems: build caching that actually works, dependency graphs that stay clean as the org grows, task pipelines that maximize parallelism, and migration strategies that don't require a big-bang switchover.

## Tooling Selection Framework

### Decision Matrix: Nx vs Turborepo vs Lerna vs Bazel

| Factor | Nx | Turborepo | Lerna (v7+) | Bazel |
|--------|-----|-----------|-------------|-------|
| **Primary strength** | Full-featured orchestration + code generation | Speed and simplicity | Publishing workflows | Hermetic multi-language builds |
| **Remote caching** | Nx Cloud (paid/self-host) | Vercel Remote Cache | None built-in | Remote Execution API |
| **Affected detection** | Project graph + file hashing | Content hashing | Changed since ref | Action graph + content hash |
| **Code generation** | Yes (generators + plugins) | No | No | No |
| **Multi-language** | Plugins (Go, Rust, Java) | JS/TS only | JS/TS only | Native (any language) |
| **Incremental adoption** | Yes (add to existing repo) | Yes (add to existing repo) | Yes | Hard (requires BUILD files) |
| **Learning curve** | Medium-High | Low | Low | Very High |
| **Best for** | 10-500 packages, JS/TS-heavy | 5-100 packages, speed-first | Publishing many npm packages | 100+ packages, multi-language |
| **CI time savings** | 60-90% with caching | 60-85% with caching | Minimal | 70-95% with remote execution |

### When to Choose Each

```
START HERE: What is your primary concern?

├── "We need code generation and architectural enforcement"
│   └── Nx (generators, module boundaries, project graph)
│
├── "We just want fast builds with minimal config"
│   └── Turborepo (near-zero config, great defaults)
│
├── "We publish many npm packages"
│   └── Lerna + Nx (Lerna for versioning, Nx for orchestration)
│
├── "We have multiple languages (Go, Java, Rust, JS)"
│   └── Bazel (hermetic builds, any language)
│       NOTE: Only if you can afford 2-4 weeks of setup
│
└── "We just need workspace dependency linking"
    └── pnpm workspaces (or npm/yarn workspaces)
        Add Nx or Turborepo later when you need caching
```

## Workspace Architecture Patterns

### Package Categorization

Organize packages into clear categories. This is the single most important architectural decision.

```
monorepo/
├── apps/                    # Deployable applications
│   ├── web-app/
│   ├── mobile-app/
│   └── api-server/
├── packages/                # Shared libraries
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Shared utilities
│   ├── config/              # Shared configuration
│   └── types/               # Shared TypeScript types
├── tools/                   # Build tools, scripts, generators
│   ├── eslint-config/
│   ├── tsconfig/
│   └── scripts/
└── services/                # Backend microservices
    ├── auth-service/
    ├── billing-service/
    └── notification-service/
```

### Dependency Rules (Module Boundaries)

Enforce these rules or your dependency graph becomes a tangled mess within 6 months.

```
DEPENDENCY DIRECTION (allowed):
  apps -> packages -> (nothing or other packages)
  apps -> services (via API, not import)
  services -> packages
  tools -> (nothing)

FORBIDDEN:
  packages -> apps          (library depends on app)
  circular dependencies     (A -> B -> A)
  apps -> apps              (app imports from another app)
  deep cross-category       (ui -> billing-service)
```

#### Nx Module Boundary Enforcement

```json
// .eslintrc.json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          { "sourceTag": "type:app", "onlyDependOnLibsWithTags": ["type:lib", "type:util"] },
          { "sourceTag": "type:lib", "onlyDependOnLibsWithTags": ["type:lib", "type:util"] },
          { "sourceTag": "type:util", "onlyDependOnLibsWithTags": ["type:util"] },
          { "sourceTag": "scope:billing", "onlyDependOnLibsWithTags": ["scope:billing", "scope:shared"] },
          { "sourceTag": "scope:auth", "onlyDependOnLibsWithTags": ["scope:auth", "scope:shared"] }
        ]
      }
    ]
  }
}
```

## Build Caching Deep Dive

### How Content-Based Hashing Works

```
INPUT HASH = hash(
  source files         (content of all files in the package)
  + dependencies       (hashes of all dependency packages)
  + environment        (Node version, OS, env vars you declare)
  + task config        (the command being run, its arguments)
)

If INPUT HASH matches a cached entry -> skip execution, replay outputs
If no match -> execute task, store outputs keyed by INPUT HASH
```

### Cache Configuration (Turborepo)

```json
// turbo.json
{
  "$schema": "[reference URL]",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "package.json"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "test/**", "jest.config.*"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "inputs": ["src/**", ".eslintrc.*", "tsconfig.json"],
      "outputs": [],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

### Cache Poisoning Prevention

Common causes of cache misses that should be hits:

| Problem | Symptom | Fix |
|---------|---------|-----|
| Timestamps in output | Cache never hits | Remove timestamps or make them deterministic |
| Absolute paths in output | Cache misses on different machines | Use relative paths |
| Undeclared env vars | Inconsistent results | Explicitly declare all env vars in `globalEnv` |
| Non-deterministic builds | Intermittent misses | Fix build to be deterministic (sort imports, etc.) |
| OS-specific outputs | Cross-platform misses | Separate cache per OS or normalize outputs |

### Remote Cache Setup

```shell
# Turborepo + custom S3 remote cache
# Use ducktors/turborepo-remote-cache for self-hosted
docker run -p 3000:3000 \
  -e STORAGE_PROVIDER=s3 \
  -e S3_ACCESS_KEY=xxx \
  -e S3_SECRET_KEY=xxx \
  -e S3_BUCKET=turbo-cache \
  ducktors/turborepo-remote-cache

# Point Turborepo at it
# .turbo/config.json
{
  "teamId": "my-team",
  "apiUrl": "[reference URL]"
}
```

## Dependency Graph Optimization

### Detecting and Breaking Circular Dependencies

```shell
# Nx: Visualize the dependency graph
npx nx graph

# Nx: Find circular dependencies
npx nx lint --rule '@nx/enforce-module-boundaries'

# Madge: Language-agnostic circular dependency detection
npx madge --circular --extensions ts src/
```

### Strategies for Breaking Cycles

1. **Extract shared interface**: Move the shared types to a separate `types` package
2. **Dependency inversion**: Depend on abstractions, not implementations
3. **Event-based decoupling**: Replace direct imports with event emission
4. **Merge packages**: If two packages are always changed together, they are one package

### Graph Depth Optimization

Deep dependency chains serialize your build. Aim for wide, shallow graphs.

```
BAD (depth 5, serialized):
  app -> feature -> domain -> utils -> types
  Build time: sum of all build times

GOOD (depth 2, parallelized):
  app -> feature-a (depends on: types, utils)
      -> feature-b (depends on: types, domain)
      -> feature-c (depends on: utils)
  Build time: max of parallel build times
```

## Task Pipeline Design

### Parallelism Maximization

```json
// Nx: target defaults in nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],     // Wait for deps to build first
      "inputs": ["production"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],      // Build self first, then test
      "inputs": ["default", "^production"],
      "cache": true
    },
    "lint": {
      "dependsOn": [],             // No dependencies - runs immediately
      "inputs": ["default"],
      "cache": true
    },
    "e2e": {
      "dependsOn": ["build"],
      "cache": true
    }
  },
  "parallel": 4
}
```

### Task Orchestration Anti-Patterns

| Anti-Pattern | Impact | Fix |
|-------------|--------|-----|
| `lint` depends on `build` | Lint waits for build unnecessarily | Remove dependency (lint source, not output) |
| `test` depends on `^test` | Tests wait for dependency tests | Depend on `^build` only |
| Everything depends on `^build` | Over-serialized | Only add `^build` if you import built output |
| No `inputs` specified | Cache invalidates on any file change | Specify exactly which files affect the task |

## Migration Strategies

### Polyrepo to Monorepo Migration

```
Phase 1: Preparation (1-2 weeks)
  ├── Set up monorepo skeleton with tooling
  ├── Configure CI/CD for monorepo
  ├── Document package naming conventions
  └── Set up remote caching

Phase 2: Pilot (1-2 weeks)
  ├── Move 2-3 related repos in
  ├── Validate build/test/deploy still works
  ├── Measure CI time improvement
  └── Document gotchas

Phase 3: Incremental Migration (2-8 weeks)
  ├── Move repos in priority order (most shared first)
  ├── Keep old repos as read-only mirrors temporarily
  ├── Update CI/CD and deployment pipelines
  └── Redirect old repo links

Phase 4: Cleanup (1 week)
  ├── Archive old repositories
  ├── Update documentation
  └── Remove temporary mirrors
```

### Preserving Git History During Migration

```shell
# In the monorepo, add the old repo as a remote
git remote add old-repo [reference URL]
git get old-repo

# Move files to their new location in a subtree
git merge old-repo/main --allow-unrelated-histories --no-commit
# Then move files to apps/old-repo/ or packages/old-repo/
git mv src apps/old-repo/src
git mv package.json apps/old-repo/package.json
git commit -m "migrate: move old-repo into monorepo"
git remote remove old-repo
```

## CI/CD Optimization

### Affected-Only CI

```yaml
# GitHub Actions example with Nx
name: CI
on: [pull_request]
jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - run: npm ci
      - run: npx nx affected -t lint --parallel=3
      - run: npx nx affected -t test --parallel=3
      - run: npx nx affected -t build --parallel=3
```

### Distributed Task Execution

For very large monorepos (50+ packages), split tasks across multiple CI agents:

```yaml
# Nx Cloud distributed execution
jobs:
  agents:
    strategy:
      matrix:
        agent: [1, 2, 3, 4, 5]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx nx-cloud start-agent

  orchestrator:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          get-depth: 0
      - run: npm ci
      - run: npx nx-cloud start-ci-run --distribute-on="5 linux-medium-js"
      - run: npx nx affected -t lint test build e2e
      - run: npx nx-cloud stop-all-agents
```

## Common Pitfalls

1. **"Let's monorepo everything"**: Not every repo belongs in a monorepo. Repos with completely independent lifecycles, different languages with no shared code, or different security requirements should stay separate.

2. **Ignoring the dependency graph**: Without enforced boundaries, your graph becomes fully connected within a year, and every change triggers a full rebuild.

3. **No remote caching**: Local caching helps developers. Remote caching helps CI and the whole team. Without remote caching, you are leaving 50-80% of the value on the table.

4. **Shared `node_modules` confusion**: Hoisting creates phantom dependencies. Use `pnpm` strict mode or Nx's isolated installs to catch packages that work locally but fail in production.

5. **Monolithic CI config**: One giant CI pipeline for all packages. Use affected detection and per-package deployment triggers instead.

## Scaling Checklist

- [ ] Package categorization defined (apps, packages, tools, services)
- [ ] Module boundary rules enforced via linting
- [ ] Build caching configured with declared inputs/outputs
- [ ] Remote caching operational for CI and team
- [ ] Affected detection working in CI (only test what changed)
- [ ] Dependency graph is acyclic and shallow
- [ ] Task pipelines maximize parallelism
- [ ] Code generators available for new packages
- [ ] CODEOWNERS file maps packages to teams
- [ ] Migration runbook documented for remaining repos

## When to Use

**Use this skill when:**
- Designing or implementing monorepo architect solutions
- Reviewing or improving existing monorepo architect approaches
- Making architectural or implementation decisions about monorepo architect
- Learning monorepo architect patterns and best practices
- Troubleshooting monorepo architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Monorepo Architect Analysis

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

**Input:** "Help me implement monorepo architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended monorepo architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When monorepo architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
