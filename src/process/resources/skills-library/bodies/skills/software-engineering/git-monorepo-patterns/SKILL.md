---
name: git-monorepo-patterns
description: |
  Guides expert-level git monorepo patterns implementation: version-control and architecture decision frameworks, production-ready patterns, and concrete templates for git monorepo patterns workflows.
  Use when the user asks about git monorepo patterns, git monorepo patterns configuration, or version-control best practices for git projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "version-control architecture best-practices"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Git Monorepo Patterns

## When to Use

**Use this skill when:**
- A user is evaluating whether to consolidate multiple repositories into a monorepo or split an existing monorepo into polyrepo packages
- A user is setting up sparse checkout, worktrees, or partial clone strategies to manage a large monorepo that is slow to clone or check out
- A user needs help configuring path-based CI filtering (only rebuild affected packages) in a git monorepo with tools like Turborepo, Nx, Bazel, or Pants
- A user wants to implement a tagging and versioning strategy for independently releasable packages within a single git repository
- A user is experiencing git performance degradation (slow `status`, `fetch`, `log`) in a repository that has grown beyond manageable scale
- A user wants to establish code ownership boundaries, CODEOWNERS enforcement, or merge gating at the package level inside a monorepo
- A user needs to migrate a set of polyrepos into a monorepo while preserving full commit history using `git filter-repo` or `git subtree`

**Do NOT use this skill when:**
- The user needs guidance on branching strategies within a single-package repository -- that is covered by the git-branching-strategies skill
- The user is asking about GitHub Actions, GitLab CI, or Bitbucket Pipelines configuration syntax in general -- check the CI/CD pipeline configuration skill
- The user needs help with semantic versioning rules or changelog generation in isolation -- check the semantic-versioning skill
- The user is asking about Docker multi-stage builds or container image tagging for monorepo services -- check the container-build-optimization skill
- The user needs a package manager workspace setup (npm workspaces, pnpm workspaces, Cargo workspaces) without git-specific guidance -- check the package-manager-workspaces skill
- The user is asking about distributed version control alternatives or SVN-to-git migration

---

## Process

### 1. Characterize the Repository Before Prescribing a Pattern

Before recommending any specific pattern, gather concrete facts about the current or planned state:

- **Repository size signals:** Count the number of logical packages or services (under 20 is micro-monorepo, 20--200 is mid-scale, 200+ is large-scale). Each tier needs different tooling.
- **Team structure:** Identify whether teams own horizontal layers (frontend/backend/infra) or vertical slices (feature teams owning full-stack services). Vertical ownership favors package-per-team layouts; horizontal ownership favors layer-based layouts.
- **Release coupling:** Ask whether packages must release in lockstep (e.g., an API and its generated SDK client) or independently. Lockstep releases simplify versioning; independent releases require per-package version tracking.
- **Language and build ecosystem:** Determine the primary language(s). JavaScript/TypeScript monorepos are well-served by pnpm workspaces + Turborepo. JVM ecosystems fit Gradle multi-project or Bazel. Python fits Pants or Bazel. Rust fits Cargo workspaces natively. Polyglot repos almost always need Bazel or Pants.
- **Clone and fetch latency baseline:** For existing repos, run `git count-objects -vH` and check `size-pack`. Repositories exceeding 1 GB pack size need partial clone or shallow clone strategies from day one.
- **CI build time baseline:** Record the current full-build time. The target for affected-only builds is 80% reduction from full-build time at the 20-package scale and 95%+ at the 100-package scale.

---

### 2. Choose the Monorepo Layout Pattern

Select one of four canonical layout patterns based on the characterization:

- **Flat workspace layout** -- All packages live at `packages/<name>/`. Best for up to ~50 packages with a single language and uniform build tooling. Simple to navigate; path-based CI filtering is straightforward.
  - Root `package.json` (or equivalent) declares all workspace members with a glob: `"packages/*"`.
  - Each `packages/<name>/` has its own `package.json`, `src/`, `tests/`, and `README.md`.
  - Shared configuration lives in root-level `tsconfig.base.json`, `.eslintrc.base.js`, `jest.config.base.js`.

- **Domain-grouped layout** -- Packages are grouped into domain directories: `services/`, `libs/`, `tools/`, `apps/`. Best for 50--200 packages where team ownership aligns with domain boundaries.
  - `services/` contains deployable microservices.
  - `libs/` contains shared libraries with explicit public APIs.
  - `tools/` contains internal developer tooling and scripts.
  - `apps/` contains end-user applications (web, mobile, CLI).
  - CODEOWNERS files at the domain directory level enforce ownership.

- **Product-grouped layout** -- Packages are grouped by product or business unit: `product-a/`, `product-b/`. Best for conglomerate organizations where products share infrastructure code but have separate roadmaps.
  - Each product directory has its own `apps/`, `libs/`, and `services/` subdirectories.
  - A root `shared/` or `platform/` directory holds cross-product libraries.
  - This layout scales beyond 200 packages but increases tooling complexity.

- **Build-system-centric layout (Bazel/Pants)** -- Every directory with a BUILD or BUILD.bazel file is a build target. No workspace-level grouping convention is required because the build system tracks the full dependency graph.
  - Best for polyglot repos or repos requiring hermetic builds and remote execution.
  - Requires significant upfront investment in BUILD file authoring and remote cache setup.
  - Query language (`bazel query 'rdeps(//..., //path/to/changed:file)'`) replaces manual change detection.

---

### 3. Configure Change Detection for Affected-Only CI

This is the highest-leverage configuration decision in a monorepo. Full builds at the 50-package scale become intolerable within months of adoption.

- **Hash-based change detection (Turborepo / Nx):** The build orchestrator hashes all inputs (source files, lockfile, config files) for each package. If the hash matches a cached run, the task is skipped. Configure with:
  - `turbo.json` pipeline definition specifying `dependsOn`, `inputs`, and `outputs` for each task type (build, lint, test).
  - Remote cache: point `remoteCache.apiUrl` to Vercel Remote Cache, Turborepo Remote Cache, or a self-hosted endpoint (Turborepo is cache-protocol compatible with several OSS servers). Cache hit rates above 80% are achievable for a team of 10+ after the first week.
  - For Nx: `nx affected --target=build --base=origin/main` uses the project graph to compute affected packages from git diff automatically.

- **Path-filter-based CI (GitHub Actions):** Use the `dorny/paths-filter` action or the native `on.push.paths` trigger to scope workflow runs:
  - Define a filter map in `.github/filters.yml` listing each package and its path glob.
  - Each package's CI job checks the output of the filter step and skips if not affected.
  - Limitation: path filters do not understand transitive dependencies. If `lib-a` changes and `service-b` depends on `lib-a`, path filters alone will not detect that `service-b` is affected unless you define the dependency graph manually or use an orchestrator.

- **Hybrid approach (recommended for most teams):** Use Turborepo or Nx for local and CI task orchestration with hash-based caching, and use path filters only as a coarse pre-filter to decide which CI workflows to trigger at all (avoiding even spinning up runners for unrelated changes).

- **Critical: define `inputs` explicitly.** If `turbo.json` does not specify `inputs` for a task, it defaults to all files in the package directory. Include lockfile changes in `globalDependencies` so that a lockfile update triggers full rebuilds: `"globalDependencies": ["package-lock.json", "pnpm-lock.yaml"]`.

---

### 4. Establish Versioning and Release Strategy

Decide between three versioning models before writing any release tooling:

- **Fixed/synchronized versioning:** All packages share a single version number that increments on every release. Used by Angular, Babel, Jest. Implementation: a single `version` field in the root manifest, updated by a release script that stamps all package manifests simultaneously. Tagging: `v1.4.2` on the commit.
  - Pro: simple to communicate, easy to correlate releases across packages.
  - Con: forces consumers to upgrade all packages simultaneously; minor changes to one package bump the version of all.

- **Independent versioning:** Each package has its own version that only increments when that package changes. Used by most large open-source monorepos. Implementation: Changesets (for JS/TS), semantic-release with monorepo plugins, or Release Please (multi-component mode).
  - Changesets workflow: contributors run `pnpm changeset` to author a changeset file in `.changeset/`. On merge to main, the Changesets GitHub Action opens a "Version Packages" PR that bumps affected package versions and updates changelogs. Merging that PR publishes packages.
  - Tag format: `@scope/package-name@1.2.3` for scoped npm packages; `service-name/v1.2.3` for non-npm artifacts.

- **Lockstep with pinned cross-dependencies:** All packages use independent versions but the monorepo enforces that internal cross-dependencies always point to the exact current workspace version (not a range). Use `syncpack` or a custom lint rule to detect and prevent version drift between internal packages.

- **For applications (not libraries):** Version the deployment artifact (Docker image tag, Helm chart version) from the git SHA of the last affecting commit, not from a semantic version. Use `git log --oneline packages/my-service/ | head -1 | cut -d' ' -f1` as the version component. This makes every meaningful change to a service automatically produce a new unique artifact.

---

### 5. Implement Repository-Scale Git Performance Optimizations

Apply these in order; each has prerequisites:

- **Partial clone with blob filter** (git 2.22+): `git clone --filter=blob:none <url>` creates a blobless clone. Git fetches commit and tree objects upfront but defers blob downloads until a file is actually checked out. Reduces initial clone of a 5 GB repository to under 30 seconds on a fast connection. Required for large repositories with many binary assets or a long history.
  - Set `git config core.sparseCheckout true` in the cloned repo if you also need sparse checkout.

- **Sparse checkout** (git 2.25+, `git sparse-checkout`): Limits the working tree to only the directories a developer or CI job needs.
  - Cone mode (recommended): `git sparse-checkout init --cone` then `git sparse-checkout set packages/my-service shared/`. Cone mode restricts patterns to directory prefixes, which git can evaluate in O(1) using the index structure rather than O(n) pattern matching.
  - Non-cone mode: supports arbitrary glob patterns but is significantly slower at large scale.
  - In CI: use sparse checkout to check out only the packages affected by a change. A pipeline that checks out 3 packages instead of 150 runs the checkout step 10--50x faster.

- **Git worktrees for parallel development:** `git worktree add ../my-feature feature/xyz` creates a second working directory linked to the same repository object store. Developers can have multiple packages checked out on different branches simultaneously without multiple clones. Particularly useful when working on coordinated changes across a service and its shared library simultaneously.

- **Maintenance commands:** Schedule `git gc --aggressive` or `git maintenance start` (git 2.31+) on CI agents and developer machines. The `git maintenance` command runs background tasks (commit-graph generation, loose object packing, prefetch) on a configurable schedule. A commit-graph file reduces `git log --graph` traversal by 10--100x for large repositories.

- **`.gitattributes` for large file handling:** Use Git LFS for binary assets exceeding 1 MB (images, compiled binaries, test fixtures). Configure LFS tracking in `.gitattributes`: `*.png filter=lfs diff=lfs merge=lfs -text`. Without LFS, a repository accumulates binary history permanently and clone times degrade linearly.

---

### 6. Define Code Ownership and Merge Governance

Ownership enforcement prevents the monorepo from becoming an ownership vacuum where no one is responsible for any particular code:

- **CODEOWNERS file:** Place `CODEOWNERS` (or `.github/CODEOWNERS`) at the repository root. Define ownership patterns from least specific to most specific -- git reads the last matching pattern.
  ```
  # Default owner for everything
  *                          @platform-team

  # Domain overrides
  /services/payments/        @payments-team
  /services/auth/            @identity-team
  /libs/design-system/       @frontend-platform-team
  /tools/                    @dx-team
  ```
  Require review from CODEOWNERS in branch protection rules. GitHub enforces this natively; GitLab uses `CODEOWNERS` with `require_code_owner_approval` on protected branches.

- **Package-level ownership metadata:** For ecosystems without native CODEOWNERS (Bazel targets, Gradle subprojects), store ownership in a machine-readable sidecar. A `METADATA` or `owners.yaml` file per package can be consumed by custom tooling that posts review requests in CI.

- **Merge queue (GitHub Merge Queue / GitLab Merge Trains):** At repositories with more than 20 concurrent PRs per day, merge conflicts and "merge race" conditions (passing tests on a branch that conflict with another simultaneously-merging branch) become common. Merge queues serialize merges and re-run CI on the final candidate commit, eliminating false-green merges. Enable this before the team experiences the problem, not after.

- **Required status checks scoped to affected packages:** Configure branch protection to require only the CI checks relevant to the changed packages. In GitHub Actions, use a matrix job pattern where each package is a matrix entry, then configure branch protection to require the summary/gate job rather than individual matrix jobs. This avoids requiring 150 package checks to pass for a PR that only touches 2 packages.

---

### 7. Establish History Migration or Consolidation Procedures

When bringing existing polyrepos into a monorepo, history preservation is non-negotiable for most teams:

- **`git filter-repo` method (preferred):** Install `git filter-repo` (requires Python 3.5+; do not use the deprecated `git filter-branch`). For each source repo, rewrite history to move all files into a subdirectory:
  ```bash
  git filter-repo --to-subdirectory-filter packages/my-service
  ```
  Then in the target monorepo, add the rewritten repo as a remote, fetch, and merge with `--allow-unrelated-histories`:
  ```bash
  git remote add my-service ../my-service-rewritten
  git fetch my-service
  git merge my-service/main --allow-unrelated-histories -m "chore: absorb my-service into monorepo"
  git remote remove my-service
  ```
  This preserves full commit history, blame, and bisect capability.

- **`git subtree` method (simpler, no external tool):** For ongoing synchronization between a monorepo and an extracted subtree, `git subtree` is appropriate:
  ```bash
  git subtree add --prefix=packages/my-service https://github.com/org/my-service.git main --squash
  ```
  The `--squash` flag condenses the imported history into a single commit. Use without `--squash` to preserve full history at the cost of a more complex initial log.

- **Cutover strategy:** After migration, place a `MOVED.md` in the source repository with a pointer to the monorepo location and the date. Archive the source repository (make it read-only). Redirect CI/CD pipelines from the old repository to monorepo paths. Allow a 2-week overlap period where both locations are technically valid before archiving.

---

### 8. Validate and Continuously Monitor Repository Health

Monorepos degrade silently without active measurement:

- **Circular dependency detection:** Run a dependency graph check as part of CI. For JavaScript: `madge --circular --extensions ts src/` or the Nx built-in `nx graph` with circular detection. For Java/Kotlin: Gradle enforces acyclic dependencies natively. Zero circular dependencies is a hard constraint -- circular deps prevent incremental builds and indicate architectural problems.
- **Build time tracking:** Record per-package build times and total pipeline duration in CI. Store in a time-series metric store (Datadog, Grafana, or even a simple CSV artifact). Alert if full-build time exceeds a configured threshold (e.g., 20 minutes triggers a performance investigation).
- **Dependency version drift:** Run `syncpack list-mismatches` (for JS) or equivalent on every PR to detect internal packages depending on mismatched versions of shared dependencies. Version drift silently causes duplicate bundle bloat in frontend apps.
- **Repository size monitoring:** Add `git count-objects -vH` to a scheduled CI job. Alert if `size-pack` exceeds a predefined threshold (e.g., 500 MB for a source-only repo, 5 GB with LFS). Unexpected size growth indicates binary files committed accidentally.
- **Bisect validity:** Ensure every commit on the main branch produces a passing build for all packages. This is a requirement for `git bisect` to remain useful. Enforce this by requiring CI to pass before merge and by never force-pushing main.

---

## Output Format

When responding to a monorepo architecture question, structure the output as follows:

```markdown
## Monorepo Assessment

### Repository Profile
| Dimension               | Current State              | Implication                          |
|-------------------------|----------------------------|--------------------------------------|
| Package count           | [number]                   | [layout tier: micro/mid/large]       |
| Primary language(s)     | [languages]                | [recommended build orchestrator]     |
| Team size               | [headcount]                | [ownership model recommendation]     |
| Release model           | [lockstep / independent]   | [versioning strategy]                |
| Largest package size    | [MB or LOC estimate]       | [partial clone / sparse checkout]    |
| CI build time (current) | [minutes]                  | [affected-only build priority level] |

---

## Recommended Layout

[Name of layout pattern and rationale]

### Directory Structure
```
root/
├── [domain-a]/
│   ├── [package-1]/
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   └── [package-2]/
├── [domain-b]/
├── shared/
├── tools/
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
├── turbo.json (or nx.json / BUILD)
├── pnpm-workspace.yaml (or equivalent)
└── package.json
```

---

## Change Detection Configuration

### Orchestrator Choice: [Turborepo / Nx / Bazel / Pants]
Rationale: [specific reason based on language and team size]

### Pipeline Definition
[Actual configuration file content -- turbo.json, nx.json, or BUILD file excerpt]

---

## Versioning Strategy

**Model:** [Fixed / Independent / Lockstep cross-deps]
**Tooling:** [Changesets / Release Please / custom script]
**Tag format:** [exact format string]

**Release workflow steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

---

## Git Performance Configuration

**Applicable optimizations (in priority order):**
1. [Optimization name] -- [specific command or config]
2. [Optimization name] -- [specific command or config]

**Not applicable:** [List any optimizations not relevant and why]

---

## Ownership Configuration

### CODEOWNERS
[Actual CODEOWNERS content for the described repository structure]

### Branch Protection Rules
- Required reviews: [number]
- Required status checks: [list]
- Merge queue: [enabled / not needed at this scale]

---

## 30-Day Implementation Roadmap

| Week | Action Items                                              | Success Metric                    |
|------|-----------------------------------------------------------|-----------------------------------|
| 1    | [concrete tasks]                                          | [measurable outcome]              |
| 2    | [concrete tasks]                                          | [measurable outcome]              |
| 3    | [concrete tasks]                                          | [measurable outcome]              |
| 4    | [concrete tasks]                                          | [measurable outcome]              |
```

---

## Rules

1. **NEVER recommend Turborepo or Nx without first confirming the primary language is JavaScript/TypeScript.** These tools are JS-ecosystem-specific. For Python monorepos, recommend Pants or Bazel. For JVM, recommend Gradle multi-project or Bazel. For Rust, Cargo workspaces are built-in. Prescribing the wrong build orchestrator is the single most common and costly monorepo mistake.

2. **NEVER recommend a flat workspace layout for more than 50 packages.** Beyond 50 packages, a flat `packages/` directory becomes unnavigable. The cognitive overhead of scrolling through 100+ entries in a single directory is real. Push toward domain-grouped or product-grouped layouts explicitly.

3. **ALWAYS specify the exact git version required for each performance feature.** Sparse checkout cone mode requires git 2.25+. Partial clone requires git 2.22+. `git maintenance` requires git 2.31+. Many CI runners (especially self-hosted or enterprise) run git 2.17 or earlier. Verify before recommending.

4. **NEVER allow circular dependencies between packages.** A circular dependency between `lib-a` and `lib-b` means neither can be built without the other, breaking all incremental build tooling and making the dependency graph a lie. If a user describes a circular dependency, the correct response is to extract the shared code into a third `lib-c` that both depend on.

5. **ALWAYS scope `CODEOWNERS` patterns from least specific to most specific.** The last matching pattern in `CODEOWNERS` wins on GitHub. Placing specific patterns before generic ones causes the generic fallback to override specific ownership, silently breaking review enforcement. Verify this order in every CODEOWNERS recommendation.

6. **NEVER recommend `git filter-branch` for history rewriting.** It is officially deprecated, 10--100x slower than `git filter-repo`, and prone to subtle correctness bugs. Always recommend `git filter-repo` for monorepo history consolidation.

7. **ALWAYS define `globalDependencies` in Turborepo pipeline configuration.** Without this, a lockfile change does not trigger cache invalidation, and packages can run with a cached build against a changed dependency tree. This produces silent correctness failures that are extremely difficult to diagnose.

8. **NEVER use the root `package.json` as a package that gets published or deployed.** The root manifest in a monorepo is a workspace container, not a package. Publishing it accidentally is a common mistake that pollutes package registries and confuses consumers. Add `"private": true` to the root manifest unconditionally.

9. **ALWAYS set cache output paths explicitly in build orchestrator configuration.** If `outputs` in `turbo.json` is not defined for a build task, Turborepo cannot replay cached artifacts. The cache will store nothing and every build will execute in full. Define outputs such as `["dist/**", ".next/**", "build/**"]` for every task type.

10. **NEVER merge a polyrepo into a monorepo without first auditing for secrets in commit history.** Source repositories from different teams may contain accidentally committed secrets, tokens, or credentials in historical commits. Run `git log -p | grep -E '(password|secret|token|key)' -i` or use `truffleHog` before importing. Monorepo history is visible to all contributors -- a secret buried in one repo's history becomes visible to the entire organization.

---

## Edge Cases

### Very Large Binary Assets (Game Assets, ML Model Weights, Design Exports)

Repositories with binary files exceeding 10 MB per file or 500 MB total binary payload must use Git LFS before monorepo consolidation, not after. Post-hoc LFS migration (`git lfs migrate import --include="*.psd"`) rewrites history and requires all team members to re-clone. Do this before the monorepo absorbs other repos to avoid rewriting already-merged history twice. Configure LFS with a generous `lfs.fetchrecentrefsdays` (default 7) to ensure CI runners with persistent workspaces do not stale-cache LFS pointers.

### CI Runner Caching with Turborepo Remote Cache

When using Turborepo remote cache in a corporate environment with network egress restrictions, the default Vercel-hosted remote cache endpoint is often blocked by firewalls. In this case, self-host a Turborepo-compatible remote cache server using the open-source `ducktape-cache` or `turbogit` implementations, or use Nx Cloud which can be configured to use a private endpoint. The alternative is to use GitHub Actions cache (via `actions/cache`) as a fallback -- less effective than a true remote cache because it is scoped to a single repository and branch, but it avoids the network restriction problem. Document the cache endpoint configuration in the repository's contributor guide; cache misconfiguration is invisible until a developer notices builds are slower than expected.

### Migrating a Team from Polyrepo Culture to Monorepo

Teams that have operated in a polyrepo model for years have deep muscle memory and cultural expectations around repository autonomy. Technical migration is the easy part. Address three specific friction points:
- **"It's too loud in the monorepo":** Configure GitHub notification filtering so engineers only get PR notifications for packages they own (CODEOWNERS-based). Create saved search queries in GitHub: `is:pr repo:org/monorepo label:team-payments` for each team.
- **"I can't tell what's mine":** Add a `teams.json` at root mapping each package path to a team identifier. Build a simple CLI tool (`./tools/bin/my-packages`) that reads this file and lists packages owned by the current user based on their git config email.
- **"Release cadence is coupled now":** If teams are using independent versioning with Changesets, they retain full release independence. Make this explicit with a demo during onboarding. Teams that conflate "single repo" with "coupled releases" need to see an actual independent release before the concern dissolves.

### Monorepo with Mixed Open-Source and Proprietary Code

Some organizations keep a public monorepo for open-source packages and need to co-locate proprietary packages. This is architecturally incompatible -- you cannot have a single git repository that is simultaneously public and private. The correct solution is two repositories with a shared tooling layer:
- Public monorepo: open-source packages only, Apache 2.0 or MIT licensed.
- Private monorepo: proprietary packages that depend on the public packages as versioned published artifacts (not as local workspace paths).
- Shared config packages (ESLint config, TypeScript config, jest config) are published from the public monorepo and consumed as npm dependencies in both.
- Never link the private monorepo to the public one via git submodules -- this creates a maintenance burden that compounds every time git changes submodule behavior.

### Bisecting Failures Across a Monorepo with Many Contributors

`git bisect` remains the most effective tool for finding regressions, but it requires every intermediate commit to be buildable. In a high-traffic monorepo where multiple teams merge dozens of PRs per day, "good" commits are rare if the CI pipeline for all packages is not enforced on every merge. Enforce this by:
- Enabling merge queue (which re-runs CI on the merge commit, not just the PR branch).
- Running a nightly "full build" job that builds and tests all packages unconditionally and files a GitHub issue if it fails, tagging the last-passing commit.
- Scripting a monorepo-aware bisect helper: `git bisect run ./tools/bisect-helper.sh packages/my-service` that only runs the test suite for the affected package, making bisect 10--20x faster than running the full suite.

### Workspace Protocol Drift in pnpm Workspaces

In pnpm workspaces, internal dependencies can be declared as `"workspace:*"` (any version), `"workspace:^"` (semver compatible), or `"workspace:1.2.3"` (pinned). Teams that mix these conventions across packages encounter inconsistent behavior when running `pnpm publish` or using Changesets -- some packages release with the correct version substitution and others do not. Enforce a single convention (`workspace:*` during development, automatic resolution to exact version at publish time) using `syncpack` lint rules configured in a `syncpackrc.js` at the repository root. Add this check to the `pre-push` hook via Husky or `lefthook`.

### Rebasing Long-Lived Feature Branches in a High-Traffic Monorepo

When a feature branch touches shared libraries and main receives 50+ commits per week from other teams, rebasing becomes expensive because git must replay all feature branch commits against each new base. Three strategies address this:
- **Short-lived branches (preferred):** Feature flag newly developed code at the application layer and merge small, frequent commits to main. No long-lived branch survives more than 3 days.
- **Stacked PRs with Graphite or similar:** Use a stacking tool that manages rebase chains automatically, so each PR in a stack is rebased in dependency order.
- **Merge-based integration:** Accept merge commits instead of rebase for long-lived branches. The history is less linear but the rebase cost is eliminated. Reserve this for branches that intentionally span multiple sprints (e.g., large architectural refactors).

---

## Example

**Input:** "We have 8 TypeScript microservices and 4 shared libraries currently spread across 12 separate GitHub repos. We're a team of 15 engineers split into 3 feature teams (Payments, Identity, Catalog) and a platform team. CI takes 6--12 minutes per service repo. We want to consolidate into a monorepo. What should we do?"

---

### Monorepo Assessment

#### Repository Profile
| Dimension               | Current State              | Implication                                         |
|-------------------------|----------------------------|-----------------------------------------------------|
| Package count           | 12 (8 services + 4 libs)   | Mid-scale -- domain-grouped layout recommended      |
| Primary language(s)     | TypeScript                  | Turborepo + pnpm workspaces recommended             |
| Team size               | 15 engineers, 4 teams      | Per-team CODEOWNERS ownership model                 |
| Release model           | Services: independent; libs: independent | Independent versioning with Changesets |
| Repository size         | Unknown (assume < 500 MB)  | Standard clone, no partial clone needed initially   |
| CI build time (current) | 6--12 min × 12 repos       | Affected-only builds target: under 3 min per PR    |

---

### Recommended Layout: Domain-Grouped

**Rationale:** 12 packages organized by the existing 3 domain teams plus a platform team maps perfectly to a domain-grouped layout. Each team owns a top-level directory. The platform team owns `libs/` and root tooling.

```
monorepo/
├── services/
│   ├── payments-api/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── payments-worker/
│   ├── identity-api/
│   ├── identity-oauth/
│   ├── catalog-api/
│   ├── catalog-search/
│   ├── catalog-ingest/
│   └── notifications-api/
├── libs/
│   ├── shared-types/
│   ├── api-client/
│   ├── logging/
│   └── testing-utils/
├── tools/
│   └── scripts/
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

### Change Detection Configuration

**Orchestrator Choice: Turborepo**
**Rationale:** TypeScript-only codebase, team of 15, under 20 packages -- Turborepo has minimal setup overhead vs Nx and provides the remote cache and affected-build features needed. Nx would be equally valid but has higher initial config complexity.

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'services/*'
  - 'libs/*'
  - 'tools/*'
```

**`turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["pnpm-lock.yaml", "tsconfig.base.json"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "package.json"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tests/**", "jest.config.ts"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "inputs": ["src/**", ".eslintrc.js"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json"],
      "outputs": []
    }
  }
}
```

**`package.json` (root, never published):**
```json
{
  "name": "monorepo-root",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "release": "changeset publish"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@changesets/cli": "^2.27.0"
  }
}
```

---

### CI Workflow (Affected-Only)

**`.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for turbo to diff against base

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Build and test affected packages
        run: pnpm turbo run build test lint type-check --filter=...[origin/main]
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

The `--filter=...[origin/main]` flag tells Turborepo to run tasks only for packages that have changed relative to `origin/main`, including all packages that transitively depend on the changed packages. A change to `libs/shared-types` will automatically trigger builds for all 8 services that depend on it.

---

### Versioning Strategy

**Model:** Independent versioning per package
**Tooling:** Changesets (`@changesets/cli`)
**Tag format:** `@company/package-name@1.2.3` for libraries; services use Docker image tags from the git SHA.

**Initialization:**
```bash
pnpm changeset init
```

**`.changeset/config.json`:**
```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@company/payments-api",
    "@company/identity-api",
    "@company/catalog-api",
    "@company/catalog-search",
    "@company/catalog-ingest",
    "@company/notifications-api",
    "@company/payments-worker",
    "@company/identity-oauth"
  ]
}
```

Services are ignored by Changesets (they do not get published to npm). Libraries in `libs/` are versioned and published. Engineers run `pnpm changeset` after changing a library to describe the change type (major/minor/patch) and impact. The Changesets bot opens a "Version Packages" PR on main when changesets accumulate.

---

### Git Performance Configuration

**Applicable optimizations:**
1. **Partial clone** -- Enable on initial repository creation: `git clone --filter=blob:none <url>`. Not strictly necessary at 12 packages but sets the repo up for growth past 1 GB.
2. **`git maintenance`** -- Run `git maintenance start` on all developer machines after cloning. Generates commit-graph and prefetches in the background.
3. **`.gitattributes` LFS** -- Even though current assets are TypeScript, configure LFS for common binary types proactively:
   ```
   *.png filter=lfs diff=lfs merge=lfs -text
   *.jpg filter=lfs diff=lfs merge=lfs -text
   *.pdf filter=lfs diff=lfs merge=lfs -text
   *.zip filter=lfs diff=lfs merge=lfs -text
   ```

**Not applicable at this scale:**
- Sparse checkout -- 12 packages is small enough that full checkout is fast (< 5 seconds). Revisit at 50+ packages.
- Worktrees -- Optional; introduce only if developers frequently need to work on coordinated changes across service + library simultaneously.

---

### Ownership Configuration

**`.github/CODEOWNERS`:**
```
# Default: platform team owns everything not otherwise specified
*                                    @company/platform-team

# Library ownership (platform team)
/libs/                               @company/platform-team

# Payment team services
/services/payments-api/              @company/payments-team
/services/payments-worker/           @company/payments-team

# Identity team services
/services/identity-api/              @company/identity-team
/services/identity-oauth/            @company/identity-team

# Catalog team services
/services/catalog-api/               @company/catalog-team
/services/catalog-search/            @company/catalog-team
/services/catalog-ingest/            @company/catalog-team

# Notifications (owned by platform until a dedicated team forms)
/services/notifications-api/         @company/platform-team

# CI/CD and tooling (platform team only)
/.github/                            @company/platform-team
/tools/                              @company/platform-team
/turbo.json                          @company/platform-team
/pnpm-workspace.yaml                 @company/platform-team
```

**Branch Protection Rules for `main`:**
- Required reviews: 1 (from CODEOWNERS)
- Required status checks: `build-test` (the single CI job above)
- Dismiss stale reviews on new commits: enabled
- Merge queue: consider enabling after onboarding is complete and PR volume exceeds 15/day
- Force push: disabled
- Deletion: disabled

---

### 30-Day Implementation Roadmap

| Week | Action Items                                                                                                             | Success Metric                                                        |
|------|--------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| 1    | Create empty monorepo with pnpm workspaces, Turborepo, root config files, and CODEOWNERS. Migrate 2 libraries using `git filter-repo`. | Two libraries build in monorepo with full history preserved.         |
| 2    | Migrate remaining 2 libraries and 3 services (one per team). Set up CI workflow with affected-only builds. Migrate team CI/CD pipelines for migrated services. | All migrated packages pass CI. Affected build time < 3 minutes.     |
| 3    | Migrate remaining 5 services. Initialize Changesets. Run onboarding sessions for each team (30 min each). Archive migrated source repos. | All 12 packages in monorepo. Zero active PRs in source repos.        |
| 4    | First full Changesets release cycle for libraries. Enable merge queue. Audit secrets in imported history. Measure CI time and cache hit rate. | Cache hit rate > 60%. Library `v1.x.x` tags present. No secrets found. |
