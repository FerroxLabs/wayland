---
name: pr-verify
description: |
  PR Verification & Merge: verify bot:ready-to-merge PRs with impact analysis, test supplementation, and one-click merge.
  Use when: (1) User says "/pr-verify", (2) User wants to verify and merge ready PRs.
---

# PR Verification & Merge

Interactive workflow to verify `bot:ready-to-merge` PRs - displays impact analysis, supplements tests, and provides one-click merge with confidence scoring.

**Announce at start:** "I'm using pr-verify skill to verify and merge ready PRs."

## Usage

```
/pr-verify [pr_number]
```

`$ARGUMENTS` may contain an optional PR number.

- Without argument: display list of `bot:ready-to-merge` PRs for selection
- With argument: skip list, go directly to that PR number

---

## Configuration

```
PR_DAYS_LOOKBACK: env var (default: 7) - lookback window for PR list
CRITICAL_PATH_PATTERN: env var - pattern to detect critical file paths
```

**REPO** is detected automatically at runtime - do not hardcode it:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
```

**Worktree path:** always `/tmp/wayland-verify-<PR_NUMBER>` - never use `/tmp/wayland-pr-*` (reserved for pr-automation/pr-fix).

---

## Steps

### Step 1 - PR List Display

Parse `$ARGUMENTS` for an optional PR number.

**If a PR number is provided:** skip the list, jump directly to Step 2 with that PR number.

**If no argument provided:** query `bot:ready-to-merge` PRs from the last `PR_DAYS_LOOKBACK` days (default 7):

```bash
DAYS=${PR_DAYS_LOOKBACK:-7}
gh pr list \
  --state open \
  --label "bot:ready-to-merge" \
  --search "created:>=$(date -v-${DAYS}d '+%Y-%m-%d' 2>/dev/null || date -d "${DAYS} days ago" '+%Y-%m-%d') -is:draft" \
  --json number,title,labels,changedFiles,additions,deletions,headRefName,baseRefName,commits,createdAt,author \
  --limit 50
```

If the result is empty: display `No bot:ready-to-merge PRs found.` and exit.

For each PR, infer the type from the first commit message prefix:

| Prefix pattern | Type     |
| -------------- | -------- |
| `fix(`         | bugfix   |
| `feat(`        | feature  |
| `refactor(`    | refactor |
| `chore(`       | chore    |
| `docs(`        | docs     |
| `perf(`        | perf     |
| `test(`        | test     |
| other          | misc     |

Display as a numbered table:

```
# | PR   | Title                             | Changes       | Type
--|------|-----------------------------------|---------------|--------
1 | #123 | fix(auth): handle token expiry    | +45 / -12     | bugfix
2 | #124 | feat(ui): add dark mode toggle    | +230 / -18    | feature
```

Then prompt:

> Enter a number to select a PR, or q to quit:

- User inputs a number → use that PR
- User inputs `q` → exit

Save the selected PR number as `PR_NUMBER` for all subsequent steps.

---

### Step 2 - Pre-flight Checks

Run three checks in order. A failure in any check presents the user with an action choice.

#### Check 1 - New Commits Since Ready-to-Merge Label

```bash
# Time when bot:ready-to-merge label was last set (infer from bot comment)
LABEL_SET_TIME=$(gh pr view $PR_NUMBER --json comments \
  --jq '[.comments[] | select(.body | test("<!-- pr-automation-bot -->") and (test("bot:ready-to-merge") or test("auto-reviewed") or test("auto-fixed")))] | last | .createdAt // ""')

LATEST_COMMIT_TIME=$(gh pr view $PR_NUMBER --json commits \
  --jq '.commits | last | .committedDate')
```

If `LATEST_COMMIT_TIME > LABEL_SET_TIME` (new commits after the label was set), prompt:

> ⚠️ This PR has new commits after bot:ready-to-merge was set (latest commit: `<LATEST_COMMIT_TIME>`, label time: `<LABEL_SET_TIME>`).
> Re-review is recommended before merging. Choose:
> r - Remove bot:ready-to-merge label and trigger re-review
> c - Ignore and continue verification

- `r` → remove `bot:ready-to-merge` label:
  ```bash
  gh pr edit $PR_NUMBER --remove-label "bot:ready-to-merge"
  ```
  Display `Label removed. PR will be re-reviewed in the next automation cycle.` and return to list (Step 1).
- `c` → continue to Check 2.

#### Check 2 - CI Status

```bash
gh pr view $PR_NUMBER --json statusCheckRollup \
  --jq '.statusCheckRollup[] | {name: .name, status: .status, conclusion: .conclusion}'
```

Required jobs: `Code Quality`, `Unit Tests (ubuntu-latest)`, `Unit Tests (macos-14)`, `Unit Tests (windows-2022)`, `Coverage Test`, `i18n-check`

Informational exclusions: `codecov/patch` and `codecov/project` are informational - exclude them from all failure checks.

| Condition                                                | Action              |
| -------------------------------------------------------- | ------------------- |
| All required jobs SUCCESS, no non-informational failures | Continue to Check 3 |
| Any required job QUEUED or IN_PROGRESS                   | Prompt (see below)  |
| Any non-informational job FAILURE or CANCELLED           | Prompt (see below)  |

**CI still running prompt:**

> ⏳ The following CI jobs are not yet complete: [job list]
> Choose:
> w - Wait for CI to finish (exit and re-run later)
> c - Ignore and continue verification

- `w` → exit
- `c` → continue to Check 3

**CI failed prompt:**

> ❌ The following CI jobs did not pass: [job list and conclusions]
> Choose:
> s - Skip this PR
> c - Ignore failures and continue verification

- `s` → remove `bot:ready-to-merge` label (let pr-automation re-process next round), return to list (Step 1):
  ```bash
  gh pr edit $PR_NUMBER --remove-label "bot:ready-to-merge"
  ```
- `c` → continue to Check 3

#### Check 3 - Merge Conflicts

```bash
gh pr view $PR_NUMBER \
  --json mergeable,mergeStateStatus,headRefName,baseRefName \
  --jq '{mergeable, mergeStateStatus, head: .headRefName, base: .baseRefName}'
```

| `mergeable`   | Action                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `MERGEABLE`   | Continue to Step 3                                                     |
| `UNKNOWN`     | Skip this PR (return to list), log: `mergeability unknown, will retry` |
| `CONFLICTING` | Attempt auto-merge (see below)                                         |

**Auto-merge attempt on conflict:**

> **Why merge instead of rebase?** Since we squash-merge all PRs, the intermediate commit
> history is irrelevant. `git merge` produces exactly the conflicts GitHub shows (one pass
> over the final diff), while `git rebase` replays each commit individually, often creating
> extra conflicts in files that GitHub reports as clean. Always use merge for conflict
> resolution in this workflow.

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_DIR="/tmp/wayland-verify-${PR_NUMBER}"

# Clean up any stale worktree
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true

# Detect fork vs same-repo PR
HEAD_OWNER=$(gh pr view $PR_NUMBER --json headRepositoryOwner --jq '.headRepositoryOwner.login')
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
IS_FORK=$( [ "$HEAD_OWNER" != "$REPO_OWNER" ] && echo true || echo false )

# Fetch PR head into a named ref (avoids FETCH_HEAD overwrite)
git fetch origin pull/${PR_NUMBER}/head:refs/pr/${PR_NUMBER}
git worktree add "$WORKTREE_DIR" refs/pr/${PR_NUMBER} --detach

ln -sf "$REPO_ROOT/node_modules" "$WORKTREE_DIR/node_modules"

cd "$WORKTREE_DIR"
git fetch origin <base_branch>
git merge origin/<base_branch> --no-edit
```

If merge **succeeds** (no conflicts):

```bash
# Determine push target
if [ "$IS_FORK" = "true" ]; then
  FORK_URL="https://github.com/${HEAD_OWNER}/$(gh repo view --json name --jq '.name').git"
  git remote add fork-target "$FORK_URL" 2>/dev/null || true
  git fetch fork-target <head_branch>
  git push fork-target HEAD:refs/heads/<head_branch> --force-with-lease
else
  git push origin HEAD:refs/heads/<head_branch> --force-with-lease
fi

cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true

gh pr merge $PR_NUMBER --squash --auto
```

Display `Conflicts resolved and pushed automatically. PR has been set to auto-merge and will merge automatically once CI passes.` and skip to next PR (return to Step 1).

If merge **has conflicts**, attempt manual resolution:

Read each conflicting file and resolve the conflicts by understanding both sides of the change. After resolving all conflicts:

```bash
cd "$WORKTREE_DIR"
git add <resolved_files>
git commit --no-edit
```

If resolution succeeds → push (same fork-aware logic as above) and set `--squash --auto`.

If resolution fails or conflicts are too complex:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
```

Prompt:

> ❌ Merge conflicts could not be resolved automatically. Choose:
> m - Notify the author to resolve conflicts manually
> s - Skip this PR
> r - Mark as bot:needs-human-review

- `m` → post comment to PR:

  ```bash
  gh pr comment $PR_NUMBER --body "<!-- pr-verify-bot -->

  ## Merge Conflicts (Cannot Be Resolved Automatically)

  This PR has conflicts with the target branch that could not be resolved automatically. Please resolve them manually by merging or rebasing, then push again:

  \`\`\`bash
  git fetch origin
  git merge origin/<base_branch>
  # After resolving conflicts
  git push
  \`\`\`"
  ```

  Then add label:

  ```bash
  gh pr edit $PR_NUMBER --remove-label "bot:ready-to-merge" --add-label "bot:needs-rebase"
  ```

  Return to list (Step 1).

- `s` → add `bot:needs-rebase` label and comment, return to list (Step 1):
  ```bash
  gh pr edit $PR_NUMBER --remove-label "bot:ready-to-merge" --add-label "bot:needs-rebase"
  gh pr comment $PR_NUMBER --body "<!-- pr-verify-bot -->
  This PR has merge conflicts that could not be resolved automatically. Please resolve them manually and push again."
  ```
- `r` → add label and return to list:
  ```bash
  gh pr edit $PR_NUMBER --remove-label "bot:ready-to-merge" --add-label "bot:needs-human-review"
  ```
  Return to list (Step 1).

---

### Step 3 - Review Summary Display

Fetch and display a concise summary of the existing review.

```bash
# Fetch review comment(s)
gh pr view $PR_NUMBER --json comments \
  --jq '[.comments[] | select(.body | startswith("<!-- pr-review-bot -->"))] | last | .body'
```

Parse from the review comment:

- **Conclusion** (APPROVED / CONDITIONAL / review conclusion line)
- **Issue count** per severity level (CRITICAL / HIGH / MEDIUM / LOW)
- If a `<!-- pr-fix-verification -->` comment exists, also parse fix results

```bash
# Fetch fix verification comment if present
gh pr view $PR_NUMBER --json comments \
  --jq '[.comments[] | select(.body | startswith("<!-- pr-fix-verification -->"))] | last | .body'
```

Fetch changed files:

```bash
gh pr view $PR_NUMBER --json files \
  --jq '.files[] | {path: .path, additions: .additions, deletions: .deletions, status: .changeType}'
```

Check critical path:

```bash
if [ -n "$CRITICAL_PATH_PATTERN" ]; then
  CRITICAL_FILES=$(gh pr view $PR_NUMBER --json files \
    --jq '[.files[].path]' | jq -r '.[]' | grep -E "$CRITICAL_PATH_PATTERN" || true)
  [ -n "$CRITICAL_FILES" ] && HAS_CRITICAL_PATH=true || HAS_CRITICAL_PATH=false
else
  HAS_CRITICAL_PATH=false
  CRITICAL_FILES=""
fi
```

Display concise summary:

```
=== PR #<PR_NUMBER>: <title> ===

Author: <author>  |  Base branch: <base>  |  Changes: +<add> / -<del>

Review conclusion: ✅ Approved / ⚠️ Conditionally approved / ❌ Changes required
Issue count: CRITICAL(0) HIGH(1) MEDIUM(2) LOW(3)
Fix status: ✅ 2 fixed / ⏭️ 1 dismissed  [if pr-fix report present]

Changed files (N):
  src/renderer/features/auth/AuthModal.tsx  +45 / -12
  src/common/utils/token.ts                 +23 / -5
  ...

Critical path: ⚠️ Touches critical path files  [if HAS_CRITICAL_PATH=true]
               src/process/channels/auth.ts
```

Then prompt:

> d - View full review report | Enter to continue to impact analysis

- `d` → display full review comment text, then re-show this prompt
- Enter → continue to Step 4

If no `<!-- pr-review-bot -->` comment found, display:

> ⚠️ No review report found. This PR may not have gone through the automated review pipeline.

And continue to Step 4.

---

### Step 4 - Impact Analysis + Test Supplementation

#### 4a - Worktree Setup

Create worktree at `/tmp/wayland-verify-<PR_NUMBER>` (reuse if already created in Step 2):

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_DIR="/tmp/wayland-verify-${PR_NUMBER}"

# Reuse existing worktree if present, otherwise create
if [ ! -d "$WORKTREE_DIR" ]; then
  # Use a named ref to avoid FETCH_HEAD being overwritten by subsequent fetches
  git fetch origin pull/${PR_NUMBER}/head:refs/pr/${PR_NUMBER}
  git worktree add "$WORKTREE_DIR" refs/pr/${PR_NUMBER} --detach
  ln -sf "$REPO_ROOT/node_modules" "$WORKTREE_DIR/node_modules"
fi
```

#### 4b - Impact Analysis

Parse changed files from the worktree:

```bash
cd "$WORKTREE_DIR"
BASE_REF=$(gh pr view $PR_NUMBER --json baseRefName --jq '.baseRefName')
CHANGED_FILES=$(git diff origin/${BASE_REF}...HEAD --name-only)
```

For each changed file, trace upstream dependencies (up to 2 levels):

- Read the changed file, identify what it exports (functions, components, constants, types)
- Search for files that import from this changed file:
  ```bash
  cd "$WORKTREE_DIR"
  # Level 1 - direct importers
  grep -rl "from.*<relative_module_path>" src/ --include="*.ts" --include="*.tsx" 2>/dev/null
  ```
- For each Level 1 importer, find Level 2 importers similarly

Build an impact map:

```
Changed:   src/common/utils/token.ts
  ↳ L1: src/renderer/features/auth/AuthModal.tsx
         src/process/channels/auth.ts
  ↳ L2: src/renderer/app/App.tsx (via AuthModal)
         src/process/main.ts (via auth channel)
```

**UI rendering impact detection:** flag any changed files in `src/renderer/` or any L1/L2 impacted files that are React components (contain JSX or `export default function`/`export const ... = () =>`).

**Test coverage check per path:**

```bash
cd "$WORKTREE_DIR"
# Check if test files exist for each changed file
for FILE in $CHANGED_FILES; do
  BASENAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
  DIRNAME=$(dirname "$FILE")
  # Look for co-located tests or __tests__ directory
  TEST_EXISTS=$(find "$WORKTREE_DIR/$DIRNAME" -name "${BASENAME}.test.*" -o -name "${BASENAME}.spec.*" 2>/dev/null | head -1)
  TESTS_DIR=$(find "$WORKTREE_DIR/$DIRNAME/__tests__" -name "${BASENAME}*" 2>/dev/null | head -1)
done
```

#### 4c - Test Supplementation

For changed files with coverage gaps, write supplemental tests in the worktree. Do NOT commit or push these tests automatically - they are written to the worktree only for local validation.

**Test writing rules:**

- Each test file goes in `<original_dir>/__tests__/<basename>.verify.test.ts`
- Tests needing external API keys use `test.skipIf(!process.env.KEY)` guard
- Each test is annotated in a comment:
  - `// [commit]` - this test fills a genuine coverage gap and should be committed
  - `// [skip]` - this test is verification-only, not needed in the PR
- Test style matches existing tests in the project (Vitest, no `.only`, proper cleanup)

Example supplemental test structure:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { functionUnderTest } from '../token';

describe('token (supplemental verify)', () => {
  // [commit] fills coverage gap: expiry edge case not tested
  it('returns null when token is expired', () => {
    // ...
  });

  // [skip] integration path requires running process - verify only
  it.skipIf(!process.env.INTEGRATION_TEST)('round-trips through IPC', () => {
    // ...
  });
});
```

#### 4d - Run Test Suite

```bash
cd "$WORKTREE_DIR"
bun run test
```

Capture test results: total, passed, failed, skipped. If tests fail, note which files are failing.

---

### Step 5 - Verification Report

Calculate confidence level based on impact analysis and test results:

| Condition                                                                                                             | Confidence |
| --------------------------------------------------------------------------------------------------------------------- | ---------- |
| Local changes only, all tests pass, no UI impact                                                                      | 🟢 HIGH    |
| Coverage gaps supplemented and all supplemental tests pass; OR UI rendering impact detected                           | 🟡 MEDIUM  |
| Core shared logic (touches `src/common/` or `src/process/`), large impact spread (L2 > 5 files), or any test failures | 🔴 LOW     |

Display the full verification report:

```
=== Verification Report: PR #<PR_NUMBER> ===

## Impact Analysis

Changed files (N):
  [list of changed files]

Upstream impact:
  L1 direct dependents: N files
  L2 indirect dependents: N files
  [impact map summary]

UI rendering impact: ✅ None / ⚠️ Affects N components

Critical path: ✅ Not affected / ⚠️ Affected [file list]

## Test Results

Full test suite: ✅ Passed / ❌ Failed
  Passed: N  |  Failed: N  |  Skipped: N

Coverage:
  [list files with/without tests]

Supplemental test recommendations (N):
  ✅ [commit] src/common/utils/__tests__/token.verify.test.ts - 3 cases covering expiry boundary
  ⏭️ [skip]  src/common/utils/__tests__/token.verify.test.ts - 1 integration case, local verification only

## Overall Confidence

🟢 HIGH / 🟡 MEDIUM / 🔴 LOW
[1-sentence explanation]
```

Then display action menu:

```
Choose an action:
  m  - Merge directly (squash merge)
  mt - Commit supplemental tests then merge
  v  - Manual verification (run the app locally, then decide)
  r  - Reject merge (mark bot:needs-human-review)
  s  - Skip (no label change, return to list)
  d  - View full review report
```

---

### Step 6 - Action Execution

#### `m` - Direct Merge

```bash
gh pr merge $PR_NUMBER --squash
```

Clean up worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
```

Display `✅ PR #<PR_NUMBER> merged.` then return to list (Step 1).

#### `mt` - Merge with Supplemental Tests

First, commit recommended tests (`[commit]`-annotated only) to the PR branch:

```bash
# Get head branch name
HEAD_BRANCH=$(gh pr view $PR_NUMBER --json headRefName --jq '.headRefName')

cd "$WORKTREE_DIR"
# Stage only [commit]-annotated test files
git add <commit-annotated test files>

# Infer scope from changed files (use first changed file's directory segment)
SCOPE=$(echo "$CHANGED_FILES" | head -1 | cut -d'/' -f3)

git commit -m "test(${SCOPE}): add supplemental tests for PR #${PR_NUMBER}"
```

> **Important:** commit message must NOT contain `Co-Authored-By` or any AI signature.

Push to the PR head branch (fork-aware):

```bash
cd "$WORKTREE_DIR"

# Detect fork vs same-repo PR
HEAD_OWNER=$(gh pr view $PR_NUMBER --json headRepositoryOwner --jq '.headRepositoryOwner.login')
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')

if [ "$HEAD_OWNER" != "$REPO_OWNER" ]; then
  FORK_URL="https://github.com/${HEAD_OWNER}/$(gh repo view --json name --jq '.name').git"
  git remote add fork-target "$FORK_URL" 2>/dev/null || true
  git fetch fork-target "$HEAD_BRANCH"
  git push fork-target HEAD:refs/heads/${HEAD_BRANCH} --force-with-lease
else
  git push origin HEAD:refs/heads/${HEAD_BRANCH} --force-with-lease
fi
```

Then enable auto-merge (CI will re-run with the new test commit):

```bash
gh pr merge $PR_NUMBER --squash --auto
```

Clean up worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
```

Display `✅ Supplemental tests pushed and auto-merge enabled. PR #<PR_NUMBER> will merge automatically once CI passes.` then return to list (Step 1).

#### `v` - Manual Verification

Display the command for the user to run in another terminal:

```
Run the following command in another terminal to start the app for verification:

  cd /tmp/wayland-verify-<PR_NUMBER> && bun run start

After verification, choose here:
  m  - Merge
  mt - Commit supplemental tests then merge
  r  - Reject merge
  s  - Skip
```

Wait for user input and execute the corresponding action as defined in this step.

#### `r` - Reject

Prompt for reason:

> Enter a rejection reason (will be posted as a PR comment):

Read reason from user input.

Update labels:

```bash
gh pr edit $PR_NUMBER --remove-label "bot:ready-to-merge" --add-label "bot:needs-human-review"
```

Post rejection comment:

```bash
gh pr comment $PR_NUMBER --body "<!-- pr-verify-bot -->

## Manual Verification: Did Not Pass

This PR was rejected during the pr-verify stage and requires human review.

**Rejection reason:** <user-provided reason>

**Verification details:**
- Confidence: 🟢 HIGH / 🟡 MEDIUM / 🔴 LOW
- Test results: Passed N / Failed N / Skipped N
- Impact scope: L1 N files, L2 N files"
```

Clean up worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
```

Display `Marked bot:needs-human-review. PR #<PR_NUMBER> has been escalated for human review.` then return to list (Step 1).

#### `s` - Skip

No label change. Clean up worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
```

Return to list (Step 1).

#### `d` - View Full Review

Fetch and display the full content of the `<!-- pr-review-bot -->` comment. Stay on the current PR - re-show the action menu after displaying.

---

### Step 7 - Cleanup and Session Summary

When user inputs `q` at the PR list, or the PR list is empty, or all PRs have been processed:

**Clean up all verify worktrees:**

```bash
for dir in /tmp/wayland-verify-*; do
  [ -d "$dir" ] && git -C "$(git rev-parse --show-toplevel)" worktree remove "$dir" --force 2>/dev/null || true
done
```

**Display session summary:**

```
=== pr-verify Session Summary ===

✅ Merged:        [#123 fix(auth): handle token expiry, ...]
🔄 Auto-merging:  [#124 feat(ui): add dark mode toggle, ...]
❌ Rejected:      [#125 refactor(db): restructure schema, ...]
⏭️ Skipped:       [#126 chore: update deps, ...]

Total PRs processed: N
```

---

## Mandatory Rules

- **Worktree path** - always `/tmp/wayland-verify-<PR_NUMBER>`; never use `/tmp/wayland-pr-*` (reserved for pr-automation/pr-fix)
- **No AI signature** - no `Co-Authored-By`, no `Generated with` in any commit or comment
- **Merge strategy** - always `--squash`; never `--merge` or `--rebase`
- **Comment marker** - use `<!-- pr-verify-bot -->` (distinct from `<!-- pr-review-bot -->` and `<!-- pr-automation-bot -->`)
- **REPO detection** - `REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')` - never hardcode
- **Test push only on mt** - supplemental tests are written to worktree only; never pushed unless user chooses `mt`
- **Worktree reuse** - if Step 2 auto-merge already created a worktree, reuse it in Step 4 instead of recreating
- **Label atomicity** - when swapping labels, do both in a single `gh pr edit` call
- **Named refs over FETCH_HEAD** - never rely on `FETCH_HEAD` (it is overwritten by every `git fetch`); always use `refs/pr/<PR_NUMBER>` or explicit branch names
- **Merge over rebase for conflicts** - use `git merge` (not `git rebase`) to resolve conflicts; rebase replays commits individually and creates spurious conflicts that GitHub does not show
- **Fork-aware push** - always detect fork PRs (`headRepositoryOwner != repo owner`) and push to the fork remote; never push fork branches to `origin`
- **Fetch before force-with-lease** - always `git fetch <remote> <branch>` before `--force-with-lease` to avoid "stale info" errors on new remotes
- **Full refspec for push** - always use `HEAD:refs/heads/<branch>` (not `HEAD:<branch>`) to avoid "not a full refname" errors on detached HEAD worktrees

---

## Quick Reference

```
 1. Parse $ARGUMENTS → PR number or display bot:ready-to-merge list for selection
 2. Pre-flight (3 checks):
    a. New commits since ready-to-merge? → ask re-review or continue
    b. CI status? → all pass / running (ask wait/continue) / failed (ask skip/continue)
    c. Mergeable? → MERGEABLE (continue) / UNKNOWN (skip) / CONFLICTING (auto-merge or prompt)
 3. Review summary → parse pr-review-bot comment, show concise summary, d for full report
 4. Impact analysis + test supplementation:
    a. Create worktree at /tmp/wayland-verify-<PR> (reuse if from Step 2)
    b. Trace changed files → L1/L2 upstream deps → UI rendering impact
    c. Write supplemental tests in worktree (annotate [commit] vs [skip])
    d. bun run test in worktree
 5. Verification report → impact map, test results, supplemental test recs, confidence (🟢/🟡/🔴)
    Action menu: m / mt / v / r / s / d
 6. Action execution:
    m  → gh pr merge --squash, cleanup, back to list
    mt → commit [commit] tests, push to head branch, gh pr merge --squash --auto, cleanup, back to list
    v  → show bun run start command, wait for user, then m/mt/r/s menu
    r  → ask reason, remove bot:ready-to-merge + add bot:needs-human-review, post pr-verify-bot comment, cleanup
    s  → no label change, cleanup, back to list
    d  → show full review comment, re-show action menu
 7. Cleanup all /tmp/wayland-verify-* worktrees → session summary (merged/auto-merge/rejected/skipped)
```
