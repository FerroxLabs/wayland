---
name: git-pr-workflow
description: |
  Guides expert-level git pr workflow implementation: version-control and best-practices decision frameworks, production-ready patterns, and concrete templates for git pr workflow workflows.
  Use when the user asks about git pr workflow, git pr workflow configuration, or version-control best practices for git projects.
  Do NOT use when the user needs a different developer tools capability -- check sibling skills in the developer tools subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "version-control best-practices clean-code"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Git PR Workflow

## When to Use

**Use this skill when:**
- A user asks how to structure pull requests, branch naming, or code review processes for a team project
- A user wants to set up branch protection rules, required reviewers, or CI gates for a repository
- A user is troubleshooting a messy merge history, long-lived branches, or frequent merge conflicts
- A user asks how to write PR descriptions, commit messages, or changelogs in a consistent way
- A user wants to enforce PR standards programmatically (hooks, CI checks, linting commit messages)
- A user is choosing between GitHub Flow, GitFlow, trunk-based development, or a custom workflow variant
- A user needs to onboard a new team to a consistent version-control discipline
- A user asks about stacking PRs, draft PRs, or managing dependencies between in-flight features

**Do NOT use this skill when:**
- The user needs help with a specific Git command's syntax -- use a Git command reference skill instead
- The user is asking about CI/CD pipeline architecture beyond the PR gate stage -- use a CI/CD pipeline skill
- The user wants to set up a monorepo structure or workspace tooling -- use a monorepo strategy skill
- The user is asking about semantic versioning or release tagging independently of the PR workflow
- The user needs Git internals (object model, pack files, refspecs) -- use a Git internals skill
- The user is resolving a specific merge conflict interactively -- use a merge conflict resolution skill
- The user needs repository access control (SSO, SAML, org-level permissions) beyond branch protection

---

## Process

### 1. Identify Team and Project Context

Before recommending any workflow, collect concrete facts about the environment. Generic advice causes workflow friction.

- **Team size thresholds:** 1--3 engineers can operate with very lightweight rules (no required reviewers, fast-merge policy). 4--12 engineers need at least 1 required reviewer and a branch naming convention. 12+ engineers need automated enforcement, CODEOWNERS files, and sub-team routing.
- **Deployment cadence:** Ask whether the team ships multiple times per day (favors trunk-based), once per sprint (favors GitHub Flow), or maintains multiple live versions simultaneously (favors GitFlow or release-train branching).
- **Monorepo vs. polyrepo:** In a monorepo, PR scope is critical -- large PRs that touch many packages trigger broad reviewer assignments and slow review cycles. Recommend scoped PRs with path-based CODEOWNERS.
- **Regulated environment check:** Ask whether the org requires audit logs of who approved what and when. This determines whether simple GitHub/GitLab approval counts suffice or whether a formal change management integration (Jira, ServiceNow) is required.
- **Current pain points:** Ask the user to describe what is failing today -- long PR queues, review fatigue, broken main, flaky CI, or unclear ownership. The diagnosis drives the prescription.

### 2. Select the Core Branching Strategy

Match the workflow model to the team's actual deployment and release model. Do not default to GitFlow for teams that do not maintain multiple production versions simultaneously.

- **Trunk-Based Development (TBD):** Engineers commit directly to `main` or open short-lived branches (< 2 days of work) targeting `main`. Feature flags gate incomplete features. Best for teams deploying to production 3+ times per week with mature CI. Requires feature flag infrastructure if features span multiple PRs.
- **GitHub Flow:** One long-lived branch (`main`), unlimited short-lived feature branches, PRs always merge into `main`, `main` is always deployable. Ideal for teams with a single production environment and weekly-to-daily deploys. Simplest model for 90% of product teams.
- **GitFlow:** `main` + `develop` + `feature/*` + `release/*` + `hotfix/*`. Use only when maintaining multiple major versions in production simultaneously (e.g., SaaS with enterprise customers on v1.x and v2.x). GitFlow adds significant overhead; do not recommend it by default.
- **Release branch strategy (scaled GitHub Flow):** `main` is always tip-of-trunk. `release/vX.Y` branches are cut from `main` when preparing a release. Hotfixes are cherry-picked onto release branches. This is the right middle ground for teams with quarterly releases but continuous `main` development.
- **Decision rule:** If the team deploys from `main` and does not support multiple live versions, use GitHub Flow. If they need release stabilization periods, use release branches. If they have feature flag infrastructure and high deploy frequency, use TBD.

### 3. Define Branch Naming Conventions

Naming conventions enable automation, link PRs to work items, and make `git log --oneline` readable.

- Use the pattern `<type>/<ticket-id>-<short-description>` for all feature and fix branches. Example: `feat/PROJ-142-user-oauth-login`, `fix/PROJ-201-null-pointer-checkout`.
- Valid type prefixes: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `hotfix`, `spike`. Align these with your commit message convention (Conventional Commits).
- Branch names must be lowercase, hyphen-separated, and under 60 characters. No spaces, no underscores, no uppercase.
- Protect `main`, `develop` (if used), and `release/*` from direct push using branch protection rules. All other branches are ephemeral.
- For hotfix branches targeting a release branch: `hotfix/vX.Y.Z-<description>` -- e.g., `hotfix/v2.3.1-payment-timeout`.
- Automate name validation with a pre-push hook or a CI check that rejects PRs whose source branch does not match the required pattern. Use a regex like `^(feat|fix|chore|refactor|docs|test|hotfix|spike)\/[A-Z]+-[0-9]+-[a-z0-9-]+$`.

### 4. Write and Enforce Commit Message Standards

Commit messages are the primary record of intent. They feed changelogs, bisect operations, and blame workflows. Enforce Conventional Commits format.

- **Format:** `<type>(<scope>): <subject>` on the first line, blank line, then optional body and footer. Subject is imperative mood, ≤ 72 characters, no period at end.
- Valid types: `feat` (new feature, triggers MINOR semver bump), `fix` (bug fix, triggers PATCH bump), `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`.
- Breaking changes: append `!` after the type/scope -- `feat(api)!: remove deprecated /v1/users endpoint` -- and include `BREAKING CHANGE:` in the footer.
- Enforce with `commitlint` and `husky`. Install: `npm install --save-dev @commitlint/cli @commitlint/config-conventional husky`. Configure `.commitlintrc.json` to extend `@commitlint/config-conventional`.
- Add a CI step that runs `commitlint --from origin/main --to HEAD` on every PR. Fail the pipeline if any commit in the PR does not conform.
- **Squash vs. merge vs. rebase:** For most teams, squash-and-merge is correct -- it produces one clean commit on `main` per PR, with the PR title used as the commit message (which must be Conventional Commits format). This keeps `git log` on `main` linear and changelog-friendly. Use merge commits only if the team wants to preserve branch history in `main`. Use rebase-and-merge for library maintainers who want a perfectly linear history without squashing.

### 5. Structure PR Descriptions with a Mandatory Template

A well-structured PR description reduces review time by 30--50% because reviewers are not hunting for context. It also serves as the canonical record of intent.

- Create `.github/pull_request_template.md` (GitHub) or `.gitlab/merge_request_templates/Default.md` (GitLab). This template is automatically pre-filled when a PR is opened.
- **Required sections in the template:**
  - `## Summary` -- one paragraph explaining what changed and why. Link to the ticket.
  - `## Type of Change` -- checklist: bug fix, new feature, breaking change, documentation update, refactor, performance improvement.
  - `## How to Test` -- step-by-step instructions for the reviewer to verify behavior. Include curl commands, UI steps, or test commands.
  - `## Screenshots / Recordings` -- required for UI changes, optional otherwise.
  - `## Checklist` -- self-review checklist (tests added, docs updated, no debug code, migration scripts reviewed).
  - `## Related Issues` -- `Closes #<issue-number>` or `Relates to #<issue-number>`. Using `Closes` auto-closes the issue on merge.
- PR titles must follow the same Conventional Commits format as commit messages. Enforce this with a GitHub Action using `amannn/action-semantic-pull-request`.
- Require PR descriptions to be non-empty using a CI step: fail if the PR body contains only the template placeholder text.

### 6. Configure Branch Protection and Review Requirements

Branch protection turns conventions into enforced policy. Configure it at the repository level so individuals cannot bypass it.

- **Settings for `main` (GitHub):**
  - Require pull request before merging: enabled
  - Required approvals: 1 for teams of 4--8, 2 for teams of 9+
  - Dismiss stale pull request approvals when new commits are pushed: enabled
  - Require review from Code Owners: enabled (with CODEOWNERS file)
  - Require status checks to pass before merging: enabled -- list every CI job that must pass (lint, tests, type-check, security scan)
  - Require branches to be up to date before merging: enabled
  - Require conversation resolution before merging: enabled
  - Do not allow bypassing the above settings: enabled (prevents admin override in normal flow)
  - Allow force pushes: disabled
  - Allow deletions: disabled
- **CODEOWNERS file format (`.github/CODEOWNERS`):**
  ```
  # Default owners for everything
  *                   @org/platform-team

  # Frontend ownership
  /src/frontend/      @org/frontend-team

  # API ownership
  /src/api/           @org/backend-team

  # Infrastructure
  /infra/             @org/devops-team

  # Security-sensitive files always require security review
  /src/auth/          @org/security-team
  ```
- Set CODEOWNERS so that no engineer can self-approve their own PRs into owned paths.
- For regulated environments: require signed commits (`git config commit.gpgsign true`) and enable "Require signed commits" in branch protection.

### 7. Establish Review Etiquette and the Merge Decision

A workflow that enforces code review without defining reviewer behavior creates bottlenecks and interpersonal friction.

- **Reviewer assignment:** Rotate reviewers by default using a round-robin assignment bot (GitHub's built-in load balancing or a tool like `auto-assign-action`). Avoid a single "gatekeeper" reviewer who becomes a bottleneck.
- **Review SLA:** Define a maximum response time for initial review feedback -- 1 business day is the standard for most teams. PRs open more than 2 business days without activity should trigger an async ping.
- **PR size limits:** Enforce a maximum of 400 changed lines per PR (excluding auto-generated files, migrations, and lock files). PRs larger than 400 lines have statistically lower review quality and higher defect rates. If a feature requires more, split it into a base PR + dependent PRs (stacked PRs).
- **Comment resolution:** Every review comment must be resolved before merge. Use "Request Changes" status for blocking issues. Use a "nit:" prefix for non-blocking stylistic suggestions that should not block approval.
- **Draft PRs:** Use draft PRs for work-in-progress that needs early feedback. Do not merge a draft PR. Convert to ready-for-review only when the author considers it complete.
- **Merge authority:** The PR author merges (not the reviewer) after approval, to ensure the author takes responsibility for timing and watches CI pass. Reviewers should not merge other people's PRs unless explicitly asked.
- **Stale PR policy:** Auto-close PRs with no activity for 30 days using a stale bot. This forces a decision: merge it, revive it, or close it.

### 8. Automate Changelog and Release Notes Generation

If commit messages and PR titles follow Conventional Commits, changelog generation can be fully automated.

- Use `conventional-changelog-cli` or `release-please` (Google's tool) to generate `CHANGELOG.md` entries from commits since the last tag.
- `release-please` opens a release PR automatically when commits to `main` meet release criteria (any `feat` or `fix` commit triggers a PATCH or MINOR version bump). The release PR contains the changelog diff and a version bump. Merging the release PR creates the git tag and GitHub release.
- For teams not using `release-please`: run `npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0` after tagging. Commit the updated `CHANGELOG.md` as part of the release commit.
- Never manually edit `CHANGELOG.md` between releases -- this breaks the automated generation. Only append manually if the automated tool misses something, and document why.

---

## Output Format

When advising a user on their PR workflow, produce output in this structure:

```markdown
## PR Workflow Recommendation for [Project/Team Name]

### Context Summary
- Team size: [N engineers]
- Deploy frequency: [continuous / weekly / per-sprint / quarterly]
- Environments: [e.g., dev → staging → prod]
- Existing tooling: [GitHub / GitLab / Bitbucket, CI system]
- Key constraints: [e.g., regulated, monorepo, multiple live versions]

### Recommended Strategy
**Branching model:** [GitHub Flow / TBD / Release Branches / GitFlow]
**Rationale:** [2--3 sentences explaining why this model fits the context]

### Branch Naming Convention
Pattern: `<type>/<ticket-id>-<short-description>`
Example: `feat/PROJ-42-add-oauth-login`
Protected branches: `main`, [others if applicable]

### Commit Message Standard
Format: `<type>(<scope>): <subject>`
Enforcement: commitlint + husky pre-commit hook + CI check
Merge strategy: [squash / rebase / merge commit] with rationale

### Branch Protection Configuration

| Setting | Value | Rationale |
|---|---|---|
| Required approvals | [N] | Team size |
| Dismiss stale reviews | Yes | Force re-review after new commits |
| Required status checks | [lint, test, type-check, security] | Quality gate |
| Up-to-date before merge | Yes | Prevent integration surprises |
| Force push disabled | Yes | Protect history |
| CODEOWNERS required | [Yes/No] | Ownership routing |

### PR Template Location
`.github/pull_request_template.md`

### Automation Setup
- [ ] commitlint + husky installed
- [ ] PR title check GitHub Action configured
- [ ] CODEOWNERS file created
- [ ] Stale bot configured (30-day threshold)
- [ ] Release automation: [release-please / conventional-changelog]
- [ ] Branch name validation: [pre-push hook regex / CI check]

### PR Size Guideline
Target: < 400 changed lines per PR (excluding lock files, generated files, migrations)
Splitting strategy: [base PR + stacked feature PRs / separate chores from features]

### Rollout Plan
1. [Week 1 action]
2. [Week 2 action]
3. [Week 3 action]
```

---

## Rules

1. **NEVER recommend GitFlow for teams that deploy a single live version.** GitFlow's `develop` branch and release branch structure add merge overhead that provides zero value when there is only one production environment. It is the single most common cause of "merge hell" complaints from teams who adopted it without a multi-version requirement.

2. **NEVER allow squash-merge and merge-commit simultaneously on a repository.** Mixing merge strategies produces a chaotic `git log` on `main` and breaks `conventional-changelog` parsing. Pick one strategy and enforce it by disabling the others in repository settings.

3. **ALWAYS require CI to pass before merge, with no admin bypass in normal operation.** Admin bypass creates a pattern where developers skip CI "just this once," which becomes the default behavior under deadline pressure. If an emergency bypass is genuinely needed, it should require two approvers and an incident ticket.

4. **NEVER set required approvals to 0 on `main` for any team of 2+ engineers.** Even a single required reviewer catches the majority of logic errors, security issues, and API contract breaks that authors miss through familiarity blindness.

5. **ALWAYS dismiss stale reviews when new commits are pushed.** An approval given to commit A must not automatically apply to commits A + B + C added afterward. Failure to dismiss stale reviews is a security and quality risk.

6. **NEVER merge a PR that has unresolved review comments,** even if the PR has the required number of approvals. Unresolved comments represent open questions or requested changes. Enforce the "resolve conversations before merge" branch protection setting.

7. **ALWAYS enforce PR title format in CI, not just encourage it.** Human convention compliance decays over time. The `amannn/action-semantic-pull-request` GitHub Action rejects PRs whose titles do not match Conventional Commits format and takes 2 minutes to configure. Use it.

8. **NEVER let a PR sit in "draft" status as a long-term parking lot.** Draft PRs older than 5 days without activity should either be converted to ready-for-review or closed. Long-lived drafts accumulate merge conflicts, lose context, and signal unclear ownership.

9. **ALWAYS include a CODEOWNERS file for repos with 4+ engineers across multiple functional areas.** Without CODEOWNERS, reviewer assignment is manual and inconsistent. Engineers assigned to review code outside their domain catch fewer bugs and take longer to review. CODEOWNERS routes reviews to the right people automatically.

10. **NEVER use `git push --force` on a shared branch, even `--force-with-lease`.** Force pushes rewrite history that other contributors may have based work on, causing diverged branches and lost commits. The only legitimate use of force push is on a personal feature branch before the first review begins. After review starts, additional commits via `git commit --amend` + force push must be explicitly agreed upon with reviewers.

---

## Edge Cases

### Stacked PRs and Inter-Branch Dependencies
When a feature is too large for one PR and must be split into dependent PRs (PR B depends on PR A), use stacking:
- PR A targets `main`. PR B targets the branch of PR A, not `main`.
- When PR A is merged, update PR B's base branch to `main` using `git rebase --onto main <old-base> <branch-b>`.
- Use a tool like `graphite` or document the dependency chain explicitly in each PR's description: "Depends on #142. Review that first."
- The risk: if PR A is significantly revised, PR B accumulates rebase conflicts. Keep stacks shallow -- no more than 3 PRs deep. If you need deeper stacking, break the work into independently deployable units behind a feature flag instead.

### Long-Running Feature Branches
A branch that lives more than 5--7 days from `main` accumulates divergence and will produce painful merge conflicts:
- Require the branch to sync with `main` at least every 2 days: `git fetch origin && git rebase origin/main`.
- If the feature cannot ship in 7 days, it should use a feature flag so it can be merged to `main` in an incomplete state. The branch should then be closed.
- Never resolve "sync with main" by creating a merge commit from `main` into the feature branch if squash-merge policy is in use -- the squashed commits from `main` will show up as changes in the PR diff. Use rebase-only sync.

### Hotfixes to a Release Branch While Main Has Diverged
When `main` is 20+ commits ahead of `release/v2.3` and a critical bug must be fixed in both:
- Fix on the release branch directly: `git checkout -b hotfix/v2.3.1-fix-payment release/v2.3`.
- Open a PR targeting `release/v2.3`. Merge after approval.
- Tag the release branch: `git tag v2.3.1`.
- Cherry-pick the fix commit(s) to `main`: `git cherry-pick <commit-hash>`. If cherry-pick produces conflicts due to divergence, resolve manually -- do not merge the entire release branch into `main`.
- Open a second PR to `main` with the cherry-picked commits. Reference the release branch PR in the description.
- The critical mistake to avoid: merging `release/v2.3` back into `main` -- this pulls in all the commits that were intentionally not included in main yet.

### Monorepo PRs with Broad Impact
In a monorepo, a single dependency upgrade or shared utility change can legitimately touch hundreds of files across dozens of packages:
- Exclude auto-generated files, lock files (`package-lock.json`, `yarn.lock`, `go.sum`), and snapshot files from the 400-line PR size guideline. Only count hand-authored code changes.
- Configure CODEOWNERS to auto-assign affected package owners even when the change was made by a platform team member. All impacted owners must approve.
- Consider splitting the PR into: (1) the core change to the shared utility, and (2) a follow-up automated PR that propagates the change to all consumers.
- Tag bulk-update PRs with a `bulk-update` label so reviewers know to focus on the pattern rather than reviewing every file individually.

### Regulated Environments Requiring Audit Trails
In SOC 2, HIPAA, PCI-DSS, or FedRAMP environments, the PR merge record must prove four-eyes approval with identity verification:
- Require signed commits with GPG or SSH signing. Configure `git config commit.gpgsign true` and set up organization-wide signing key verification.
- Enable "Require signed commits" in branch protection. Unsigned commits are rejected at push time.
- Enable GitHub's audit log export (GitHub Enterprise) or equivalent GitLab audit events and pipe them to your SIEM (Splunk, Datadog, etc.).
- In some frameworks, the ticketing system must cross-reference the PR. Use the branch naming convention `<type>/<ticket-id>-<description>` and configure a CI check that validates the PR description contains a valid ticket link.
- Do not store secrets in the PR template or description fields. All secrets must be injected from a vault at CI runtime.

### Force-Pushed Main or History Rewrite After Merge
If someone with admin rights force-pushes `main` and rewrites merged history (which should never happen but does):
- Immediately freeze the repository: disable pushes to `main` until the issue is assessed.
- Identify what commits were lost using `git reflog` on the server (GitHub exposes this via the API for 90 days).
- Restore the lost commits by creating a recovery branch from the last known good SHA: `git checkout -b recovery/main-restore <sha>`.
- Open a PR from the recovery branch to restore the commits. Do not force-push `main` back -- this resets everyone's local clones again.
- Post-incident: enable "Do not allow bypassing above settings" in branch protection to prevent admins from force-pushing `main` in the future.

### Teams Migrating from No Workflow to an Enforced Workflow
Introducing PR requirements, branch protection, and commit linting to a team that has been committing directly to `main` with no conventions requires a phased rollout to avoid rebellion:
- **Week 1:** Introduce branch naming and PR conventions as guidelines only. No enforcement. Run commitlint in warn mode (exit 0 even on failure). Hold a 30-minute team session to explain the rationale.
- **Week 2:** Enable branch protection with 1 required reviewer. Do not yet require CI to pass. Identify and fix any CI jobs that are too flaky to be required gates.
- **Week 3:** Enable required CI status checks after flaky tests are stabilized. Switch commitlint to enforce mode (exit 1 on failure).
- **Week 4:** Enable CODEOWNERS and stale bot. Review the first month's metrics: PR cycle time, number of reverts on `main`, reviewer assignment distribution.
- The most common failure mode: enabling all settings simultaneously on day 1, hitting an edge case (broken CI, CODEOWNERS misconfiguration) that blocks all merges, and losing team trust in the workflow before it has had a chance to demonstrate value.

---

## Example

**Input:** "We have a 7-person team building a B2B SaaS product. We deploy to production roughly twice a week. We use GitHub, GitHub Actions for CI, and Jira for tickets. Right now everyone pushes to `main` directly and we keep breaking prod. What PR workflow should we implement?"

**Output:**

## PR Workflow Recommendation for 7-Person B2B SaaS Team

### Context Summary
- Team size: 7 engineers
- Deploy frequency: ~2x per week (Tuesday and Friday deploys)
- Environments: development → staging → production
- Existing tooling: GitHub, GitHub Actions, Jira
- Key constraints: Single live production version, Jira ticket integration required
- Current problem: Direct pushes to `main`, recurring production breakage

### Recommended Strategy
**Branching model: GitHub Flow**
**Rationale:** You deploy twice a week from a single production environment and do not maintain multiple live versions. GitHub Flow -- short-lived feature branches targeting `main`, with `main` always deployable -- is the exact right fit. GitFlow would add overhead you do not need. Trunk-based development would require feature flag infrastructure you likely do not have yet.

### Branch Naming Convention

Pattern: `<type>/PROJ-<ticket-number>-<short-description>`

Examples:
- `feat/PROJ-142-user-oauth-login`
- `fix/PROJ-201-null-pointer-at-checkout`
- `chore/PROJ-180-upgrade-nodejs-20`
- `hotfix/PROJ-210-payment-timeout-prod`

Protected branches: `main` only. All feature branches are ephemeral and deleted on merge.

CI enforcement (add to `.github/workflows/pr-checks.yml`):
```yaml
- name: Validate branch name
  run: |
    BRANCH="${{ github.head_ref }}"
    if ! echo "$BRANCH" | grep -qP '^(feat|fix|chore|refactor|docs|test|hotfix|spike)\/[A-Z]+-[0-9]+-[a-z0-9-]+$'; then
      echo "Branch name '$BRANCH' does not match required pattern"
      exit 1
    fi
```

### Commit Message Standard

Format: `<type>(<scope>): <subject>` (Conventional Commits)

Examples:
- `feat(auth): add Google OAuth login flow`
- `fix(checkout): prevent null pointer when cart is empty`
- `chore(deps): upgrade Node.js to 20.x`
- `feat(api)!: remove deprecated /v1/users endpoint` (breaking change)

**Enforcement setup:**
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
npx husky init
echo "npx commitlint --edit \$1" > .husky/commit-msg
```

`.commitlintrc.json`:
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 100]
  }
}
```

CI check (`.github/workflows/pr-checks.yml`):
```yaml
- name: Lint commit messages
  uses: wagoid/commitlint-github-action@v5
  with:
    configFile: .commitlintrc.json
```

**Merge strategy: Squash and merge.** One clean commit per PR on `main`. The PR title becomes the commit message on `main` -- it must follow Conventional Commits format.

### Branch Protection Configuration for `main`

| Setting | Value | Rationale |
|---|---|---|
| Require pull request before merging | Enabled | No more direct pushes |
| Required approvals | 1 | Appropriate for 7-person team |
| Dismiss stale reviews on new commits | Yes | Re-review required after changes |
| Require review from Code Owners | Yes | Route to domain experts |
| Required status checks | lint, test, type-check, build | Quality gate |
| Require branches up to date | Yes | Prevent integration surprises |
| Require conversation resolution | Yes | No unanswered review comments |
| Allow force pushes | Disabled | Protect shared history |
| Allow deletions | Disabled | Prevent accidental branch loss |
| Bypass allowed for admins | Disabled | No exceptions in normal flow |

### CODEOWNERS File (`.github/CODEOWNERS`)

```
# Default: all changes require review from any senior engineer
*                     @yourorg/senior-engineers

# Frontend -- require frontend team review
/src/frontend/        @yourorg/frontend-team

# API and backend
/src/api/             @yourorg/backend-team

# Database migrations -- always require backend lead
/db/migrations/       @backend-lead-username

# Infrastructure and CI
/.github/             @yourorg/platform
/infra/               @yourorg/platform
```

### PR Template (`.github/pull_request_template.md`)

```markdown
## Summary
<!-- What changed and why? Link to the Jira ticket. -->
Closes [PROJ-](https://yourorg.atlassian.net/browse/PROJ-)

## Type of Change
- [ ] Bug fix (non-breaking change that resolves an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Documentation update
- [ ] Refactor (no functional change)
- [ ] Performance improvement

## How to Test
<!-- Step-by-step instructions for the reviewer to verify this change. -->
1. 
2. 
3. 

## Screenshots / Recordings
<!-- Required for UI changes. Drag and drop images here. -->

## Checklist
- [ ] I have tested this change locally
- [ ] I have added or updated tests covering the new behavior
- [ ] I have updated documentation if behavior changed
- [ ] No debug code, TODO comments, or console.log left in
- [ ] Database migrations are backward compatible (or migration plan is documented)
- [ ] No secrets or credentials in this PR
```

### Automation Setup Checklist

- [x] `commitlint` + `husky` installed and configured
- [x] PR title semantic check: add `amannn/action-semantic-pull-request@v5` to CI
- [x] CODEOWNERS file created and tested with a draft PR
- [ ] Stale bot: add `.github/stale.yml` -- close PRs after 30 days, issues after 60 days
- [ ] Release automation: configure `release-please-action` on pushes to `main`
- [ ] Branch name validation CI step added
- [ ] Slack/Teams notification on PR open (optional, reduces review lag)

### Stale Bot Configuration (`.github/stale.yml`)
```yaml
daysUntilStale: 30
daysUntilClose: 7
staleLabel: stale
staleComment: >
  This PR has had no activity for 30 days. It will be closed in 7 days
  unless updated. If this is still relevant, please rebase and re-request review.
closeComment: >
  Closing due to inactivity. Reopen if this work should continue.
exemptLabels:
  - pinned
  - security
  - do-not-close
```

### PR Size Guideline

Target: fewer than 400 changed lines per PR, excluding:
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Auto-generated files (GraphQL types, protobuf stubs, migration SQL)
- Snapshot test files (`*.snap`)

If a PR exceeds 400 lines of hand-authored code, split it:
1. Open a base PR with shared types, interfaces, or database schema changes
2. Open a feature PR targeting the base branch with the implementation
3. After base merges, rebase feature PR onto `main`

### Rollout Plan (4-Week Migration)

**Week 1 -- Branch + PR conventions, no enforcement**
- Create the branch naming convention document
- Add the PR template
- Team meeting: explain rationale, answer questions
- Start requiring PRs (no direct pushes) -- this is the highest-impact change

**Week 2 -- Enable branch protection with soft CI**
- Enable 1 required reviewer
- Enable required status checks (only the tests that reliably pass -- identify flaky tests first and exclude them)
- Run commitlint in warn-only mode

**Week 3 -- Full CI enforcement**
- Fix or quarantine flaky tests identified in week 2
- Switch commitlint to enforce mode
- Add PR title semantic check to CI
- Enable "require branches to be up to date"

**Week 4 -- Ownership and automation**
- Finalize and activate CODEOWNERS file
- Configure stale bot
- Set up `release-please` for automated changelog and release PRs
- First retrospective: review PR cycle time, number of CI failures caught, merge frequency

**Expected outcomes after 4 weeks:**
- Zero direct pushes to `main`
- Production breakage frequency drops by 60--80% (CI catching regressions before merge)
- PR review cycle time: under 1 business day with rotating assignments
- `git log --oneline main` is clean, readable, and changelog-generator compatible
