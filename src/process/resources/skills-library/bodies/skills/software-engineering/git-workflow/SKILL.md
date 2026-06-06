---
name: git-workflow
description: |
  Git workflow expert covering branching strategies, commit conventions, interactive rebase, merge vs rebase, conflict resolution, git bisect, hooks, monorepo strategies, and CI integration.
  Use when the user asks about git workflow, git workflow best practices, or needs guidance on git workflow implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices version-control guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Git Workflow

You are an expert in Git workflows. Design and execute Git strategies that keep history clean, enable collaboration, and support CI/CD. Git is a tool for communication between developers across time. Every commit, branch, and merge tells a story.

## Branching Strategies

### Trunk-Based Development (Recommended for Most Teams)

```
main ─────●─────●─────●─────●─────●─────●─────
           \   /       \   /       \   /
            ●           ●           ●
        (short-lived feature branches, < 2 days)
```

**Rules**:
- `main` is always deployable.
- Feature branches live less than 2 days.
- Use feature flags for incomplete features.
- CI runs on every push. Broken builds are fixed immediately.
- Release from `main` using tags or short-lived release branches.

**Best for**: Teams with CI/CD, experienced developers, frequent releases.

### GitHub Flow

```
main ─────●─────────●─────────●─────
           \       /           \
            ●──●──●             ●──●
          (feature/xyz)      (fix/abc)
                |
            Pull Request
```

**Rules**:
- `main` is always deployable.
- Create a branch from `main` for every change.
- Open a PR for review.
- Merge via PR after approval and CI pass.
- Deploy from `main` after merge.

**Best for**: Open-source projects, small-to-medium teams, web applications.

### GitFlow

```
main ────────●───────────────●───── (releases only)
              \             /
develop ──●──●──●──●──●──●──●──── (integration)
           \     /   \     /
            ●──●      ●──●
         (feature)  (feature)
                              \
                     release/1.0 ──●──●
                                       \
                                    hotfix/1.0.1
```

**Rules**:
- `main` tracks production releases.
- `develop` is the integration branch.
- Feature branches merge to `develop`.
- Release branches stabilize the release.
- Hotfix branches patch production directly.

**Best for**: Products with scheduled releases, mobile apps, enterprise software with support contracts.

### When to Use Which

| Factor | Trunk-Based | GitHub Flow | GitFlow |
|--------|-------------|-------------|---------|
| Release frequency | Continuous | Daily-weekly | Scheduled |
| Team size | Any | Small-medium | Medium-large |
| CI/CD maturity | High | Medium | Any |
| Feature flags | Required | Optional | Not needed |
| Complexity | Low | Low | High |

## Commit Message Conventions

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons (not CSS) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build system or external dependency changes |
| `ci` | CI configuration changes |
| `chore` | Other changes that do not modify src or test files |

### Examples

```
feat(auth): add OAuth2 login with Google

Implement Google OAuth2 flow using the authorization code grant.
Users can now sign in with their Google accounts.

Closes #234
```

```
fix(payments): prevent duplicate charges on retry

The payment service was not checking for existing charges before
retrying, causing duplicate charges when the initial request
timed out but actually succeeded.

Fixes #567
```

### Commit Message Rules
1. **Subject line under 72 characters.**
2. **Use imperative mood**: "Add feature" not "Added feature" or "Adds feature".
3. **Do not end the subject with a period.**
4. **Separate subject from body with a blank line.**
5. **Body explains what and why, not how** (the diff shows how).
6. **Reference issues** in the footer.

### What Makes a Good Commit
- **Atomic**: One logical change per commit. Not "fix bug and add feature and update docs".
- **Complete**: The codebase compiles and tests pass after every commit.
- **Meaningful**: Each commit tells a story. Squash "WIP" and "fix typo" before merging.

## Merge vs Rebase

### Merge
```
main:    A──B──C────────M──
              \        /
feature:       D──E──F
```
- Preserves complete history and branch topology.
- Creates a merge commit.
- Non-destructive: never rewrites history.

### Rebase
```
Before:
main:    A──B──C
              \
feature:       D──E──F

After rebase:
main:    A──B──C
                 \
feature:          D'──E'──F'
```
- Produces a linear history.
- Rewrites commit hashes (D, E, F become D', E', F').
- Must NOT be used on shared/public branches.

### Decision Framework

| Situation | Use |
|-----------|-----|
| Updating a personal feature branch with latest main | Rebase |
| Merging a feature branch into main | Merge (or squash merge) |
| Shared branch with multiple contributors | Merge (never rebase shared branches) |
| Cleaning up local commits before PR | Interactive rebase |
| Preserving detailed development history | Merge |
| Creating a clean, linear history | Rebase + merge |

### Squash Merge
```shell
git merge --squash feature/xyz
git commit -m "feat(auth): add OAuth2 login"
```
Collapses all feature branch commits into one. Good for clean main history, but loses granular commit information.

## Interactive Rebase

Use interactive rebase to clean up commits before pushing or merging.

```shell
# Rebase last 4 commits
git rebase -i HEAD~4
```

Editor shows:
```
pick a1b2c3d feat: add user model
pick e4f5g6h fix: typo in user model
pick i7j8k9l feat: add user controller
pick m0n1o2p fix: missing import in controller
```

Clean up:
```
pick a1b2c3d feat: add user model
fixup e4f5g6h fix: typo in user model        # fold into previous, discard message
pick i7j8k9l feat: add user controller
fixup m0n1o2p fix: missing import in controller  # fold into previous
```

### Rebase Commands
| Command | Effect |
|---------|--------|
| `pick` | Keep the commit as-is |
| `reword` | Keep the commit but change the message |
| `edit` | Stop at this commit to amend it |
| `squash` | Fold into previous commit, combine messages |
| `fixup` | Fold into previous commit, discard this message |
| `drop` | Remove the commit entirely |
| `reorder` | Change the order of commits by moving lines |

## Conflict Resolution

### Process
1. **Understand the conflict.** Read both sides. Do not blindly accept one.
2. **Check the intent.** Look at the original commits on each side to understand the purpose.
3. **Resolve semantically, not textually.** The correct resolution may not be either version or a simple combination.
4. **Test after resolution.** Compile and run tests.
5. **Do not introduce new changes** in a conflict resolution commit.

### Conflict Markers
```
<<<<<<< HEAD
const timeout = 5000;
=======
const timeout = 10000;
>>>>>>> feature/increase-timeout
```

### Reducing Conflicts
- Keep branches short-lived (< 2 days).
- Merge/rebase from main frequently.
- Avoid formatting-only commits that touch many lines.
- Avoid moving code unless necessary.
- Communicate about large refactorings before starting.

## Git Bisect

Binary search through commits to find the one that introduced a bug.

```shell
# Start bisecting
git bisect start

# Mark current commit as bad (has the bug)
git bisect bad

# Mark a known-good commit
git bisect good v1.2.0

# Git checks out the midpoint. Test it.
# If this commit has the bug:
git bisect bad
# If this commit is fine:
git bisect good

# Repeat until the first bad commit is identified
# Git reports: "abc1234 is the first bad commit"

# Return to original state
git bisect reset
```

### Automated Bisect
```shell
# Run a test script at each step
git bisect start HEAD v1.2.0
git bisect run npm test
# Git automatically finds the first commit where tests fail
```

## Git Hooks

### Useful Hooks

| Hook | Runs when | Use for |
|------|-----------|---------|
| `pre-commit` | Before commit is created | Lint, format, type check |
| `commit-msg` | After message is written | Validate commit message format |
| `pre-push` | Before push to remote | Run tests, prevent force push to main |
| `prepare-commit-msg` | Before editor opens | Populate template |
| `post-merge` | After merge completes | Install deps, run migrations |
| `post-checkout` | After branch switch | Install deps, clear caches |

### Managing Hooks with Tools

```shell
# Husky (Node.js)
npx husky init
echo "npx lint-staged" > .husky/pre-commit

# pre-commit (Python)
# .pre-commit-config.yaml
repos:
  - repo: [reference URL]
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
  - repo: [reference URL]
    rev: 24.1.0
    hooks:
      - id: black
```

### lint-staged Configuration
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["stylelint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Monorepo Git Strategies

### Sparse Checkout
Check out only the directories you need:
```shell
git sparse-checkout init --cone
git sparse-checkout set packages/my-package packages/shared
```

### Shallow Clone
Reduce clone time by fetching limited history:
```shell
git clone --depth 1 --filter=blob:none <url>
# Get more history later if needed
git get --unshallow
```

### CODEOWNERS
Automatically assign reviewers based on file paths:
```
# .github/CODEOWNERS
packages/auth/**        @auth-team
packages/payments/**    @payments-team
packages/shared/**      @platform-team
*.md                    @docs-team
```

## CI Integration

### Branch Protection Rules
- Require PR review before merge.
- Require status checks to pass (CI, linting, tests).
- Require up-to-date branch before merge.
- Prevent force push to main.
- Require signed commits (optional, for high-security projects).

### CI Pipeline Triggers
```yaml
# GitHub Actions
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    paths-ignore:
      - '**.md'
      - 'docs/**'
```

### Optimizing CI for Git
- Use shallow clones in CI: `get-depth: 1`.
- Cache dependencies between runs.
- Run only affected tests on PRs (use `git diff --name-only` to detect changed files).
- Use merge queue to batch PRs and reduce CI runs.

## Essential Git Commands

### Recovery Commands
```shell
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, keep changes unstaged
git reset HEAD~1

# Recover a deleted branch
git reflog                  # find the commit hash
git checkout -b recovered-branch abc1234

# Recover a dropped stash
git fsck --unreachable | grep commit
git show <hash>

# Undo a pushed merge (creates a revert commit)
git revert -m 1 <merge-commit-hash>
```

### Investigation Commands
```shell
# Who changed this line and when?
git blame -L 10,20 src/auth.ts

# When was a string introduced?
git log -S "secretFunction" --oneline

# What changed between two branches?
git diff main...feature/xyz --stat

# Show the full history of a file, including renames
git log --follow -p -- path/to/file
```

### Cleanup Commands
```shell
# Remove branches merged into main
git branch --merged main | grep -v main | xargs git branch -d

# Remove remote tracking branches that no longer exist
git remote prune origin

# Reduce repo size by cleaning up unreachable objects
git gc --aggressive --prune=now
```

## When to Use

**Use this skill when:**
- Designing or implementing git workflow solutions
- Reviewing or improving existing git workflow approaches
- Making architectural or implementation decisions about git workflow
- Learning git workflow patterns and best practices
- Troubleshooting git workflow-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Git Workflow Analysis

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

**Input:** "Help me implement git workflow for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended git workflow approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When git workflow must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
