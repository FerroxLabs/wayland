---
name: git-branching-strategy
description: |
  Guides expert-level git branching strategy implementation: version-control and best-practices decision frameworks, production-ready patterns, and concrete templates for git branching strategy workflows.
  Use when the user asks about git branching strategy, git branching strategy configuration, or version-control best practices for git projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "version-control best-practices automation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Git Branching Strategy

## When to Use

**Use this skill when:**
- A user asks which branching model to adopt for a new or existing project (trunk-based, GitFlow, GitHub Flow, GitLab Flow, release branch strategy)
- A user wants to migrate from one branching strategy to another and needs a transition plan
- A user needs to configure branch protection rules, merge policies, or automated CI gates to enforce a chosen strategy
- A user is experiencing pain from their current workflow -- long-lived branches causing merge conflicts, flaky release processes, or slow review cycles -- and wants a diagnosis and fix
- A user is building a branching convention for a monorepo, multi-team, or multi-release-line project
- A user wants naming conventions, tagging schemas, commit message standards, or changelog automation tied to their branching model
- A user needs to present a branching strategy decision to a team or document it as an Architecture Decision Record (ADR)
- A user is working in a regulated environment (SOX, HIPAA, FedRAMP) and needs audit-friendly branch controls

**Do NOT use this skill when:**
- The user needs help with a specific Git command syntax issue -- that is a git-commands or git-troubleshooting skill
- The user is asking about CI/CD pipeline configuration beyond branch trigger rules -- use a CI/CD pipeline design skill
- The user wants to set up a monorepo from scratch -- use a monorepo-tooling skill (branching strategy is one component of that larger problem)
- The user needs code review process design beyond how it relates to branch structure -- use a code-review-workflow skill
- The user is asking about semantic versioning in isolation, not tied to a branching model -- use a versioning-strategy skill
- The user wants to configure GitHub Actions, GitLab CI, or Bitbucket Pipelines workflows in detail -- use the relevant CI tooling skill
- The user is asking about database schema migrations or deployment orchestration -- branching strategy is adjacent, not the answer

---

## Process

### Step 1: Diagnose the Current Situation and Constraints

Before recommending anything, gather enough context to avoid a misfit recommendation.

- **Team size** is a primary constraint. Solo or 2-person teams: trunk-based development is almost always correct. 3-8 engineers on a single product: GitHub Flow or lightweight GitFlow. 10+ engineers or multiple squads on a shared codebase: needs explicit integration branch discipline and possibly a monorepo branching convention.
- **Release cadence** determines whether long-lived branches make sense at all. Continuous delivery (multiple deploys per day): trunk-based. Weekly releases with a QA freeze: feature-branch-with-release-branch. Quarterly versioned releases with hotfix support: full GitFlow or a structured release-branch model.
- **Number of simultaneously supported versions** is decisive. If the team ships one version and users always take the latest, a single main line with short-lived branches is sufficient. If the team maintains v1.x, v2.x, and v3.x concurrently with backported security patches, dedicated long-lived release branches are mandatory.
- **Deployment model**: Does production deploy from `main` automatically? From tagged commits? From a release branch? The branching model must match the deployment trigger. A mismatch (e.g., deploying from `main` but using GitFlow's `develop` as the integration branch) is a common source of confusion.
- **Team experience level with Git**: If the team struggles with rebasing or merge conflict resolution, a strategy requiring frequent rebasing (e.g., always-rebase-before-merge trunk-based) will cause friction. Choose a model the team can execute without constant intervention.
- **Compliance and audit requirements**: SOX environments often require 4-eyes approval on all changes to production branches, a full audit trail, and no force pushes. This mandates branch protection with required reviewers and merge commits (not squash or rebase) for traceability.

---

### Step 2: Apply the Strategy Selection Decision Tree

Use the following decision logic to arrive at a recommended strategy:

- **Condition 1 -- Does the team do continuous deployment (deploy to production multiple times per day or on every merge)?**
  - YES: Use **trunk-based development**. All engineers commit to `main` (or a shared trunk) at least once per day. Feature flags control in-progress work. Feature branches are allowed but must live no longer than 1-2 days before merging.
  - NO: Continue to Condition 2.

- **Condition 2 -- Does the team ship a single release line (one version in production at a time)?**
  - YES: Use **GitHub Flow**. One `main` branch representing production. Short-lived feature/fix branches. Branch, PR, review, merge, deploy. No `develop` branch, no release branches unless a release candidate freeze is needed.
  - NO: Continue to Condition 3.

- **Condition 3 -- Does the team maintain multiple concurrent release versions or need a formal release stabilization phase?**
  - YES, with 2+ supported versions: Use a **release-branch model** (GitFlow variant). Long-lived `release/vX.Y` branches. Hotfixes cherry-picked or merged back to trunk. Tag every production release.
  - YES, with one version but structured QA freeze: Use **GitFlow** or **GitLab Flow with environment branches**. Maintain a `develop` integration branch. Cut `release/x.y.z` branches from `develop` for QA, then merge to `main` and tag.
  - NO: Go back to GitHub Flow.

- **Condition 4 -- Is this a monorepo with multiple independently deployable services?**
  - Use **trunk-based development with path-scoped CI triggers**. The branching model stays simple (trunk + short-lived feature branches); complexity is handled at the CI layer by triggering only affected service pipelines.

---

### Step 3: Define the Branch Taxonomy

Once the strategy is chosen, define every branch type the team will use. Ambiguity here is the root cause of most branching convention failures.

- **`main` (or `trunk`)**: Always reflects the current production-deployable state. Never commit directly. Protected with required status checks and at least 1 required reviewer (2 in regulated environments).
- **`develop`** (GitFlow only): Integration branch. All completed features merge here first. Should always be green (passing CI). Never push directly except for version bump commits in automated pipelines.
- **Feature branches** (`feature/JIRA-123-add-oauth-login`): Short-lived. Maximum 3 business days for trunk-based; 1-2 weeks acceptable for GitHub Flow; open-ended but discouraged over 2 weeks for GitFlow. Naming: `feature/<ticket-id>-<slug>`.
- **Bugfix branches** (`bugfix/JIRA-456-fix-null-pointer`): Same lifetime rules as feature branches. Use `fix/` prefix in GitHub Flow, `bugfix/` in GitFlow.
- **Release branches** (`release/2.4.0`): Cut from `develop` (GitFlow) or `main` (release-branch model) when entering the release stabilization phase. Only bug fixes and release preparation commits go here. No new features.
- **Hotfix branches** (`hotfix/2.3.1-payment-timeout`): Cut directly from `main` (or the affected release branch). Must be merged back to BOTH `main` AND `develop` (or trunk) immediately. Failing to merge back is the most common hotfix mistake.
- **Chore/infra branches** (`chore/update-node-18`, `infra/migrate-to-terraform-1.6`): Non-feature work. Follow same review and merge rules as feature branches.

Naming convention rules to enforce:
- Lowercase only, hyphen-separated words in the slug.
- Include ticket/issue ID when one exists for traceability.
- No spaces, no special characters, no uppercase.
- Maximum 60 characters total for the branch name (some Git UIs truncate at 50).

---

### Step 4: Configure Branch Protection and Merge Policies

Enforcement is what makes a branching strategy real. Document rules should be backed by tooling.

- **`main` protection rules (apply to every project regardless of strategy):**
  - Require pull request before merging (no direct pushes)
  - Require at least 1 approving review (2 for regulated projects)
  - Dismiss stale pull request approvals when new commits are pushed
  - Require status checks to pass before merging (CI build + tests at minimum)
  - Require branches to be up to date before merging (prevents "works on my machine, fails in staging" scenarios)
  - Do NOT allow force pushes
  - Do NOT allow deletions

- **`develop` protection (GitFlow only):**
  - Require CI to pass
  - Require 1 approving review
  - Allow team leads to push directly only for automated version bump commits from the release pipeline

- **Merge strategy selection** -- this matters more than most teams realize:
  - **Merge commits** (`--no-ff`): Preserves the full history of a feature branch. Makes it easy to revert an entire feature by reverting the merge commit. Recommended for GitFlow where feature histories are meaningful.
  - **Squash merge**: Collapses all commits in a PR into one commit on `main`. Keeps `main` history clean and linear. Makes individual commit history of the feature branch irrelevant. Best for GitHub Flow when the branch is short-lived and intermediate commits are messy.
  - **Rebase merge**: Replays feature branch commits on top of `main`, no merge commit. Produces a linear history. Requires good individual commit hygiene (atomic commits, good messages). Recommended for trunk-based development when teams have strong commit discipline.
  - **Do not mix strategies** on the same protected branch. Inconsistent merge strategies produce a history that is impossible to reason about.

---

### Step 5: Establish Commit Message and Tagging Standards

A branching strategy without commit standards is half-built. The commit history is the audit trail.

- **Use Conventional Commits format** for all commits to `main` or `develop`:
  - Format: `<type>(<scope>): <description>` with optional body and footer
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`
  - Example: `feat(auth): add OAuth2 PKCE flow for mobile clients`
  - Example: `fix(payments): handle timeout on Stripe webhook retry`
  - `BREAKING CHANGE:` in the footer triggers a major version bump in automated versioning
- **Enforce with tooling**: Use `commitlint` with `@commitlint/config-conventional` in a pre-commit hook (via `husky`) and in CI. Reject non-conforming commits at the PR level.
- **Tagging strategy for releases:**
  - Use semantic versioning: `vMAJOR.MINOR.PATCH` (e.g., `v2.4.1`)
  - Always annotated tags, not lightweight tags: `git tag -a v2.4.1 -m "Release 2.4.1: hotfix payment timeout"`
  - Annotated tags include the tagger identity, timestamp, and message -- critical for audit trails
  - Tag only from `main` (or from the release branch before merging to `main`)
  - Never delete or move tags on shared repositories

---

### Step 6: Automate Changelog and Version Generation

Manual changelogs are always out of date. Automate them from the commit history.

- **`standard-version`** or **`semantic-release`** are the standard tools for Node.js/JavaScript projects. `semantic-release` is fully automated (determines version bump, generates changelog, creates GitHub release, publishes package) based on Conventional Commits. `standard-version` is semi-automated (run it manually as a release command).
- For non-JS projects: `git-chglog` (Go ecosystem but language-agnostic), `conventional-changelog-cli` (Node-based but usable anywhere), or `release-please` (Google's release PR automation).
- **Changelog format**: Generate `CHANGELOG.md` with sections for `Features`, `Bug Fixes`, `Performance Improvements`, `Breaking Changes`, and `Reverts`. Each entry links to the PR or commit.
- **Version bumping rules from Conventional Commits:**
  - `fix:` commits → PATCH bump (1.0.0 → 1.0.1)
  - `feat:` commits → MINOR bump (1.0.0 → 1.1.0)
  - `BREAKING CHANGE:` footer or `feat!:` / `fix!:` → MAJOR bump (1.0.0 → 2.0.0)

---

### Step 7: Document the Strategy as an ADR and Team Runbook

The chosen strategy must survive team turnover. Documentation is not optional.

- **Architecture Decision Record (ADR)** captures:
  - The date of the decision
  - The context (team size, release cadence, constraints)
  - The options considered (with trade-offs)
  - The decision and its rationale
  - The consequences (what becomes easier, what becomes harder)
  - Store ADRs in `docs/adr/` in the repository, numbered sequentially (`0001-git-branching-strategy.md`)
- **Team Runbook** (practical how-to guide) covers:
  - How to start a new feature (exact commands)
  - How to handle a conflict during PR review
  - How to cut a release
  - How to create and deploy a hotfix
  - How to backport a fix to a supported older release branch
  - What to do when CI is red on `main`/`develop`

---

### Step 8: Define Metrics and Review Cadence

A branching strategy is a living convention, not a one-time decision.

- **Track these metrics monthly:**
  - **Branch age distribution**: How many open branches are older than 3 days? Older than 1 week? Chronic long-lived branches indicate incomplete features being held open, poor decomposition, or review bottlenecks.
  - **PR cycle time**: Time from PR opened to merged. Target under 24 hours for most PRs. Over 48 hours consistently indicates review process problems.
  - **Merge conflict rate**: What percentage of PRs require conflict resolution? Over 15% suggests branches are too long-lived or the team is working on overlapping areas without coordination.
  - **Hotfix frequency**: More than 1-2 hotfixes per sprint suggests insufficient testing before release, not a branching problem -- but this is visible through the branching model.
  - **Failed merge-back rate**: How often is a hotfix not merged back to `develop`? This should be 0%. Automate merge-back as a CI step to enforce it.
- **Schedule a quarterly review** of the branching conventions. Bring the metrics. Adjust naming conventions, protection rules, or strategy variant based on real data, not intuition.

---

## Output Format

When delivering a git branching strategy recommendation, use the following structure:

```markdown
## Git Branching Strategy Recommendation

### Project Context Summary
| Dimension          | Value                          |
|--------------------|--------------------------------|
| Team size          | [number] engineers             |
| Release cadence    | [continuous / weekly / monthly / quarterly] |
| Supported versions | [single / multiple: list them] |
| Deployment trigger | [merge to main / tag / release branch] |
| Compliance needs   | [none / SOX / HIPAA / FedRAMP / internal audit] |
| Current pain       | [brief description]            |

---

### Recommended Strategy: [Strategy Name]

**Rationale:** [2-4 sentences explaining why this strategy fits the project context above.
Reference the specific constraints that drove the decision.]

---

### Branch Taxonomy

| Branch Type   | Pattern                          | Lifetime        | Source Branch | Merges Into           |
|---------------|----------------------------------|-----------------|---------------|-----------------------|
| main          | `main`                           | permanent       | --            | --                    |
| develop       | `develop`                        | permanent       | main          | --                    |
| feature       | `feature/<ticket-id>-<slug>`     | 1-5 days        | develop       | develop               |
| bugfix        | `bugfix/<ticket-id>-<slug>`      | 1-3 days        | develop       | develop               |
| release       | `release/<major.minor.patch>`    | days to 2 weeks | develop       | main + develop        |
| hotfix        | `hotfix/<major.minor.patch>-<slug>` | hours to 1 day | main       | main + develop        |

*(Remove rows that do not apply to the chosen strategy)*

---

### Merge Policy

| Branch         | Merge Strategy     | Required Reviews | Required Checks         | Force Push |
|----------------|--------------------|------------------|-------------------------|------------|
| main           | merge commit / squash | 2             | CI, lint, coverage ≥80% | NEVER      |
| develop        | merge commit       | 1                | CI, lint                | NEVER      |
| release/*      | merge commit       | 2                | CI, full regression     | NEVER      |

---

### Commit Message Convention

Format: `<type>(<scope>): <short description>`

Types: `feat` | `fix` | `docs` | `refactor` | `perf` | `test` | `chore` | `ci` | `revert`

**Examples:**
- `feat(auth): implement refresh token rotation`
- `fix(api): return 429 on rate limit instead of 500`
- `chore(deps): upgrade express from 4.18 to 4.19`
- `feat!: remove deprecated /v1 API endpoints` ← triggers MAJOR version bump

---

### Tagging Schema

- Format: `v<MAJOR>.<MINOR>.<PATCH>` (e.g., `v3.1.4`)
- Annotated tags only: `git tag -a v3.1.4 -m "Release 3.1.4"`
- Tag from: `main` after release branch merges in
- Automated by: [semantic-release / standard-version / release-please / manual]

---

### Branch Protection Configuration

#### main
```
- Require pull request: YES (minimum 2 reviewers)
- Dismiss stale reviews on new commits: YES
- Require status checks: [list CI job names]
- Require branch up to date: YES
- Allow force push: NO
- Allow deletion: NO
```

#### develop (if applicable)
```
- Require pull request: YES (minimum 1 reviewer)
- Require status checks: [list CI job names]
- Allow force push: NO
- Allow deletion: NO
```

---

### Common Operations Cheat Sheet

**Start a feature:**
```bash
git checkout develop             # or main for GitHub Flow / trunk-based
git pull --ff-only
git checkout -b feature/PROJ-123-add-user-search
```

**Prepare a release (GitFlow):**
```bash
git checkout develop
git pull --ff-only
git checkout -b release/2.5.0
# bump version in package.json / pyproject.toml / build.gradle
git commit -m "chore(release): bump version to 2.5.0"
# QA testing, bug fixes committed to release/2.5.0 only
git checkout main
git merge --no-ff release/2.5.0
git tag -a v2.5.0 -m "Release 2.5.0"
git checkout develop
git merge --no-ff release/2.5.0
git branch -d release/2.5.0
git push origin main develop --tags
```

**Create and deploy a hotfix:**
```bash
git checkout main
git pull --ff-only
git checkout -b hotfix/2.4.1-fix-session-expiry
# make fix, commit with: fix(session): prevent premature session expiry on mobile
git checkout main
git merge --no-ff hotfix/2.4.1-fix-session-expiry
git tag -a v2.4.1 -m "Hotfix 2.4.1: session expiry"
git checkout develop
git merge --no-ff hotfix/2.4.1-fix-session-expiry   # NEVER skip this step
git branch -d hotfix/2.4.1-fix-session-expiry
git push origin main develop --tags
```

---

### Tooling Recommendations

| Purpose                  | Tool                              | Configuration file            |
|--------------------------|-----------------------------------|-------------------------------|
| Commit linting           | commitlint                        | `commitlint.config.js`        |
| Git hooks                | husky                             | `.husky/commit-msg`           |
| Changelog generation     | semantic-release or standard-version | `.releaserc.json` or `.versionrc.json` |
| Branch naming lint       | branch-name-lint or custom CI check | CI step or `.github/branch-naming.yml` |
| PR size guard            | danger.js or pr-size-labeler      | `Dangerfile.js`               |

---

### ADR Reference

Location: `docs/adr/0001-git-branching-strategy.md`
Status: [Proposed / Accepted / Deprecated / Superseded]
Date: [YYYY-MM-DD]
```

---

## Rules

1. **NEVER recommend GitFlow to a team doing continuous delivery.** GitFlow's `develop` branch and release stabilization phases are incompatible with deploying multiple times per day. The merge overhead and branch proliferation will actively harm the team. Trunk-based development is the only model that scales with continuous deployment.

2. **NEVER allow hotfix branches to close without merging back to both `main` AND the integration branch (`develop` or trunk).** A hotfix applied only to `main` will regress on the next regular release when `develop` is merged. This is the single most common operational mistake in GitFlow and release-branch models.

3. **NEVER use lightweight Git tags for releases.** Lightweight tags contain no metadata and cannot be signed. Annotated tags (`git tag -a`) carry the tagger's identity, timestamp, and message, which are required for audit trails and for tools like `semantic-release` to function correctly.

4. **NEVER mix merge strategies (merge commit, squash, rebase) on the same protected branch.** A mixed-strategy history is impossible to bisect, revert, or reason about. Pick one strategy per branch and enforce it via repository settings, not developer discipline.

5. **ALWAYS configure branch protection rules in tooling, not just in team documentation.** Undocumented conventions break immediately when a new team member joins or when time pressure mounts during an incident. Enforced rules in GitHub, GitLab, or Bitbucket are the only reliable enforcement mechanism.

6. **NEVER allow feature branches to live longer than 2 weeks without a deliberate plan.** Branches older than 2 weeks accumulate merge debt exponentially. If a feature cannot be completed in 2 weeks, it must be decomposed into smaller slices behind a feature flag, or the branch must be rebased against `develop`/`main` at least twice per week.

7. **ALWAYS require `develop` to be green (all CI checks passing) before cutting a release branch.** Cutting a release from a broken integration branch means spending the QA phase fixing problems that should have been caught in development. Build a CI gate that prevents `release/*` branches from being created unless `develop` is green.

8. **NEVER use `git rebase` on branches that have been pushed to a shared remote and reviewed.** Rebasing rewrites commit hashes, invalidating all existing PR review comments and making force-push necessary. Rebase only on local, unpushed branches. Once a branch is in a PR, use merge commits for any integration with the base branch.

9. **ALWAYS include the ticket or issue ID in branch and commit references** when the team uses an issue tracker. This creates bidirectional traceability between code history and work items, which is essential for debugging, auditing, and understanding why changes were made months or years later.

10. **NEVER use the same branching strategy configuration for every service in a multi-service architecture without first checking deployment independence.** A shared monorepo with multiple services may need path-scoped CI triggers and service-level tagging schemes. A microservice with its own repository may correctly use a simpler strategy than the platform's shared libraries. Strategy must fit the deployment unit, not the organization chart.

---

## Edge Cases

### Long-lived feature branches for large features

When a feature is genuinely too large to deliver in 2 weeks (a payment system rewrite, a new authentication provider), do not leave the branch open. Instead:
- Decompose the work into vertical slices that can each ship independently behind a **feature flag**.
- Each slice is a short-lived branch that merges to `develop`/`main` normally. The feature flag controls whether the new code path executes in production.
- Use a feature flag platform (LaunchDarkly, Unleash, Flipt, or a simple environment variable) to gate exposure.
- When the full feature is complete and validated, remove the flag in a cleanup commit.
- If feature flags are not feasible, create an **integration branch** (`feature/payment-rewrite`) that acts as a `develop`-equivalent for that feature. Individual sub-tasks branch from it and merge back to it. Only the integration branch merges to `develop`. Rebase the integration branch against `develop` at least twice per week.

### Migrating from GitFlow to trunk-based development

This transition is high-risk if done abruptly. Use a 4-phase approach:
1. **Phase 1 (Week 1-2)**: Stop creating new release branches. Use your current `develop` branch as if it were trunk. All new features must merge within 3 days.
2. **Phase 2 (Week 3-4)**: Introduce feature flags for any in-flight work. Practice trunk integration daily.
3. **Phase 3 (Week 5-6)**: Merge `develop` into `main` and configure deployment directly from `main`. Archive `develop` (do not delete it for 90 days in case you need to reference it).
4. **Phase 4 (Week 7+)**: Enforce maximum 1-day branch lifetimes in CI. Alert on branches older than 2 days. Retrospect weekly on the transition friction.

Do not rush Phase 1-2. Teams that skip to trunk-based without feature flags typically revert within 2 sprints because they have no way to manage partially-complete features.

### Multiple concurrent supported release versions (e.g., v1.x, v2.x)

When security patches must be applied to v1.4.x while v2.1.x is the current release:
- Maintain permanent named branches: `release/1.x` and `release/2.x` (never delete them while those versions are supported).
- All development targets `main` or `develop` first. Never write code directly on a release branch.
- For a security patch: fix on `main`/`develop`, then **cherry-pick** the fix commit(s) to each affected release branch. Use `git cherry-pick -x <commit-hash>` -- the `-x` flag appends the original commit hash to the cherry-pick commit message, creating a clear audit trail.
- After cherry-picking, tag new patch releases on each release branch (`v1.4.8`, `v2.1.3`).
- Document the End of Life date for each release branch. Remove protection rules and archive the branch when support ends.

### Monorepo with multiple independently deployable services

A monorepo containing 8 microservices should NOT use a different branch per service. That creates unbounded branch proliferation. Instead:
- Use a single trunk-based strategy for the entire repository.
- CI pipeline uses **path filtering** to detect which services have changed and runs only their tests and deployments.
- Tagging is per-service: `auth-service/v2.1.0`, `payments-service/v1.8.3`. Use a tag prefix convention and enforce it.
- Use a tool like `nx affected`, `turborepo`, or `changesets` (for packages) to determine affected services.
- Feature flags remain essential because multiple services may change together but need to be released independently.

### Regulated environments requiring 4-eyes principle and full audit trails

In SOX, HIPAA, or FedRAMP environments:
- **Merge commits are mandatory** (not squash, not rebase). Each merge commit records who merged, what was reviewed, and what CI checks passed. Squashing hides the intermediate commit history that auditors may require.
- **Required reviewers must be configured at the repository level**, not just by convention. Minimum 2 approvals on `main`. The author may not be one of the approvers.
- **All status checks must be required**, including security scanning (SAST via Semgrep, Snyk, or Checkmarx), dependency vulnerability checks, and license compliance.
- **Branch deletion after merge must be logged** and retained. Most platforms (GitHub, GitLab) retain branch history even after deletion, but confirm with your compliance team.
- **No force pushes ever**, including by repository administrators. Some platforms allow "force push" exemptions for admins -- disable this.
- Store your branch protection rule configuration as code (GitHub's `octokit` API, GitLab's API, or Terraform `github_branch_protection` resource) so the protection rules themselves are version-controlled and auditable.

### Resolving a contaminated `main` branch after a bad merge

If a broken, incomplete, or security-violating commit is merged to `main` and CI has already passed:
- **Do NOT use `git revert` on a public release tag.** Reverting a tagged release creates confusion in the changelog and package registries.
- **Do use `git revert` on the merge commit** if the bad commit is recent and has not been tagged. `git revert -m 1 <merge-commit-hash>` creates a new commit that undoes the changes from the merge. This preserves history and is audit-safe.
- If the bad commit introduced a security vulnerability and must be scrubbed from history: this requires a force-push, which is a breaking operation. Coordinate with the entire team, take the repository offline briefly, rewrite history with `git filter-repo`, force-push, and have every team member re-clone. Document the incident in the ADR.
- After the revert or scrub, do a post-mortem to identify how the bad commit passed CI and review. Typically, a bad merge indicates a gap in required checks or an approval from someone without sufficient context.

### Divergent strategies across teams in a large organization

When an organization has 15 teams each doing something different:
- Resist the impulse to immediately standardize everyone onto one model. Start by documenting what each team is actually doing.
- Identify the 2-3 models in use. Usually it is: "everyone thinks they do GitFlow but half do GitHub Flow and a quarter do ad hoc."
- Publish an **organizational branching strategy standard** with 2-3 approved variants tied to deployment pattern (continuous delivery teams use trunk-based, release-oriented teams use GitHub Flow with release branches). Provide a template repository for each variant.
- Allow teams to deviate with a documented exception and a quarterly review. Deviation without documentation is what creates the chaos.
- Do not enforce through platform-level defaults until at least 60% of teams have voluntarily adopted the standard. Forced adoption without buy-in creates resentful workarounds.

---

## Example

**Input:**
"We have a team of 7 engineers building a SaaS B2B application. We deploy to production once per week on Thursday. We have a QA engineer who needs a 2-day freeze to test before each release. We sometimes need emergency hotfixes between weekly releases. We're currently using a messy ad hoc approach where everyone just pushes feature branches and merges whenever, and we keep having merge conflicts and broken releases. We use GitHub."

---

**Output:**

## Git Branching Strategy Recommendation

### Project Context Summary

| Dimension          | Value                                                  |
|--------------------|--------------------------------------------------------|
| Team size          | 7 engineers + 1 QA engineer                           |
| Release cadence    | Weekly (Thursday deploy) with 2-day QA freeze         |
| Supported versions | Single release line (latest only)                     |
| Deployment trigger | Tag on `main` after QA sign-off                       |
| Compliance needs   | None specified                                        |
| Current pain       | Ad hoc branching causing merge conflicts and broken releases |

---

### Recommended Strategy: GitHub Flow with Release Branches

**Rationale:** Your team deploys weekly with a QA stabilization period, which disqualifies pure trunk-based development (no stabilization phase) and pure GitHub Flow (no formal release branch). Full GitFlow adds unnecessary overhead for a single-version SaaS product. The right fit is GitHub Flow extended with a short-lived `release/*` branch cut on Tuesday for QA, merged and tagged on Thursday. This gives QA a stable target, keeps development unblocked during the freeze, and provides a clear hotfix path.

---

### Branch Taxonomy

| Branch Type   | Pattern                                 | Lifetime         | Source Branch | Merges Into           |
|---------------|-----------------------------------------|------------------|---------------|-----------------------|
| main          | `main`                                  | permanent        | --            | --                    |
| feature       | `feature/<ticket-id>-<slug>`            | 1-5 days         | main          | main                  |
| bugfix        | `bugfix/<ticket-id>-<slug>`             | 1-3 days         | main          | main                  |
| release       | `release/<major.minor.patch>`           | Tuesday--Thursday (2 days) | main | main           |
| hotfix        | `hotfix/<major.minor.patch>-<slug>`     | hours to 1 day   | main          | main                  |

**No `develop` branch.** All feature work targets `main` directly. The release branch provides the QA stabilization window. This eliminates the double-merge overhead of GitFlow.

---

### Weekly Release Rhythm

```
Monday:       Engineers merge feature PRs to `main`
Tuesday:      Cut release/1.x.0 from main at EOD. Dev continues on main unblocked.
Wed-Thu AM:   QA tests release/1.x.0. Bug fixes go directly to release/1.x.0 AND are
              cherry-picked back to main.
Thursday PM:  QA signs off. Merge release/1.x.0 → main with --no-ff.
              Tag: git tag -a v1.x.0 -m "Release 1.x.0"
              Deploy from tag.
              Delete release/1.x.0.
Friday:       Monitor production. Any critical issues trigger a hotfix branch.
```

---

### Merge Policy

| Branch         | Merge Strategy | Required Reviews | Required Checks                   | Force Push |
|----------------|----------------|------------------|-----------------------------------|------------|
| main           | Squash merge   | 1                | CI (build + test + lint), coverage ≥ 75% | NEVER |
| release/*      | Merge commit   | 2 (including QA) | CI, full regression suite         | NEVER      |

**Why squash to `main`?** Your engineers currently have messy intermediate commits ("fix typo", "WIP", "trying this"). Squash merge keeps `main` history clean and readable. Each entry in `main`'s history represents one complete, reviewed piece of work.

**Why merge commit for release?** The release branch merge to `main` must be preserved as a distinct event in history so you can easily identify the exact point of each weekly release.

---

### Commit Message Convention

Format: `<type>(<scope>): <short description>`

Types: `feat` | `fix` | `refactor` | `perf` | `test` | `chore` | `ci` | `docs` | `revert`

**Required examples for your context:**
- `feat(billing): add prorated upgrade billing calculation`
- `fix(auth): prevent session token reuse after logout`
- `chore(deps): upgrade @prisma/client from 4.15 to 5.1`
- `fix!: remove deprecated /api/v1/users endpoint` ← triggers MAJOR bump if using semantic versioning

**Enforcement:**
- Install `husky` and `commitlint` in the repository.
- Add a `.husky/commit-msg` hook that runs `commitlint --edit`.
- Add a `commitlint.config.js` that extends `@commitlint/config-conventional`.
- Add the same commitlint check as a required CI status check in GitHub Actions so PRs from external forks are also checked.

---

### Tagging Schema

- Format: `v<MAJOR>.<MINOR>.<PATCH>` -- recommend starting at `v1.0.0` if you are not doing public APIs, or `v0.x.0` during early product development.
- Annotated tags only.
- Tag only from `main`, only after the release branch merge is complete and deployment is confirmed healthy.
- Use `standard-version` to automate changelog generation and version bumping:

```bash
# On the release branch, after QA sign-off, before merging:
npx standard-version --release-as minor   # or patch, or major
# This bumps package.json version, generates CHANGELOG.md, commits both, and creates the tag
# Then merge the release branch to main and push the tag
git push origin main --follow-tags
```

---

### Branch Protection Configuration

**main (in GitHub repository settings → Branches → Add rule for `main`):**
```
Pattern: main
☑ Require a pull request before merging
  ☑ Required approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
☑ Require status checks to pass before merging
  Required checks: ci/build, ci/test, ci/lint
  ☑ Require branches to be up to date before merging
☑ Require conversation resolution before merging
☑ Do not allow bypassing the above settings
✗ Allow force pushes
✗ Allow deletions
```

**release/* (add a second rule for pattern `release/*`):**
```
Pattern: release/*
☑ Require a pull request before merging
  Required approvals: 2  (one must be the QA engineer)
☑ Require status checks to pass before merging
  Required checks: ci/build, ci/test, ci/lint, ci/regression
✗ Allow force pushes
✗ Allow deletions
```

---

### Common Operations Cheat Sheet

**Start a feature:**
```bash
git checkout main
git pull --ff-only origin main
git checkout -b feature/PROJ-42-add-csv-export
# work, commit using conventional commit format
git push -u origin feature/PROJ-42-add-csv-export
# open PR targeting main
```

**Cut Tuesday's release branch:**
```bash
git checkout main
git pull --ff-only origin main
git checkout -b release/1.4.0
git push -u origin release/1.4.0
# Notify QA: release/1.4.0 is ready for testing
```

**Fix a QA-found bug during freeze (on the release branch and back to main):**
```bash
git checkout release/1.4.0
git pull --ff-only origin release/1.4.0
git checkout -b bugfix/PROJ-55-fix-export-encoding
# fix, commit: fix(export): handle UTF-8 BOM in CSV output
git push -u origin bugfix/PROJ-55-fix-export-encoding
# PR targeting release/1.4.0 (NOT main)
# After merge to release/1.4.0, cherry-pick back to main:
git checkout main
git cherry-pick -x <merge-commit-hash-on-release>
git push origin main
```

**Deploy Thursday's release:**
```bash
# After QA sign-off, standard-version run, and release branch → main merge:
git push origin main --follow-tags
# GitHub Actions deployment pipeline triggers on new tag matching v*.*.*
```

**Emergency hotfix (e.g., Friday night incident):**
```bash
git checkout main
git pull --ff-only origin main
# main now has the v1.4.0 tag at HEAD
git checkout -b hotfix/1.4.1-fix-payment-webhook-500
# fix the issue
git commit -m "fix(payments): handle missing idempotency key in webhook payload"
# PR targeting main with 2 reviewers (even at 11pm -- no exceptions)
# After merge:
git tag -a v1.4.1 -m "Hotfix 1.4.1: payment webhook 500 error"
git push origin main --follow-tags
# Deploy from v1.4.1 tag
```

---

### Tooling Setup Checklist

```
☐ Install husky:            npx husky-init && npm install
☐ Install commitlint:       npm install --save-dev @commitlint/{cli,config-conventional}
☐ Configure commitlint:     echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
☐ Add commit-msg hook:      npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
☐ Install standard-version: npm install --save-dev standard-version
☐ Add release script:       "release": "standard-version" in package.json scripts
☐ Configure .versionrc.json with your changelog sections
☐ Add GitHub Actions job for commitlint on PR (covers external contributors)
☐ Configure branch protection rules as described above (or via Terraform)
☐ Create docs/adr/0001-git-branching-strategy.md documenting this decision
☐ Create docs/runbook/branching-workflow.md with the cheat sheet above
```

---

### ADR Template for This Decision

**File:** `docs/adr/0001-git-branching-strategy.md`

```markdown
# ADR 0001: Git Branching Strategy

**Date:** 2024-01-15
**Status:** Accepted

## Context
Team of 7 engineers + 1 QA. Weekly Thursday releases. 2-day QA freeze required.
Prior approach was ad hoc, causing frequent merge conflicts and broken releases.

## Options Considered
1. Trunk-based development -- rejected: no accommodation for QA freeze period
2. Full GitFlow -- rejected: overhead of develop branch unnecessary for single-version SaaS
3. GitHub Flow with release branches -- selected: matches weekly release rhythm with minimal ceremony

## Decision
GitHub Flow with a short-lived release branch (cut Tuesday, merged/tagged Thursday).
Squash merge to main. Conventional Commits enforced via commitlint + husky.
Automated changelog via standard-version.

## Consequences
Positive: Clean main history, unblocked development during QA freeze, clear hotfix path.
Negative: QA bug fixes require cherry-pick back to main (mitigated by making this part of the PR checklist).

## Review Date
2024-04-15 (quarterly review)
```

---

### First 30-Day Adoption Plan

| Week | Action |
|------|--------|
| Week 1 | Configure branch protection on `main`. Install commitlint + husky. Run a 1-hour team workshop on the new workflow using the cheat sheet. |
| Week 2 | First full cycle: cut release branch Tuesday, QA on release branch, deploy Thursday from tag. Debrief Friday. |
| Week 3 | Review PR cycle times and branch ages. Identify any engineers still creating long-lived branches. Pair with them on decomposing work into smaller PRs. |
| Week 4 | Retrospective. Measure: Did we have merge conflicts? Were releases smoother? Adjust conventions if needed. Commit to a quarterly review cadence. |
