---
name: pr-review
description: |
  PR Code Review (Local): perform a thorough local code review with full project context.
  Use when: (1) User asks to review a PR, (2) User says "/pr-review", (3) User wants to review code changes before merging.
---

# PR Code Review (Local)

Perform a thorough local code review with full project context - reads source files directly, no API truncation limits.

**Announce at start:** "I'm using pr-review skill to review the pull request."

## Usage

```
/pr-review [pr_number]
```

`$ARGUMENTS` may contain an optional PR number and/or `--automation` flag.

- Without `--automation`: interactive mode (prompts for confirmation, comment, cleanup)
- With `--automation`: non-interactive mode (auto-post comment, auto-delete branch, output machine-readable result)

---

## Steps

### Step 1 - Determine PR Number

If `$ARGUMENTS` is non-empty, use it as the PR number.

Otherwise run:

```bash
gh pr view --json number -q .number
```

If this also fails (not on a PR branch), abort with:

> No PR number provided and cannot detect one from the current branch. Usage: `/pr-review <pr_number>`

Also parse `--automation` from `$ARGUMENTS`:

```bash
AUTOMATION_MODE=false
if echo "$ARGUMENTS" | grep -q -- '--automation'; then
  AUTOMATION_MODE=true
fi
```

### Step 2 - Check CI Status

```bash
gh pr view <PR_NUMBER> --json statusCheckRollup \
  --jq '.statusCheckRollup[] | {name: .name, status: .status, conclusion: .conclusion}'
```

**Required jobs to check:**

- `Code Quality`
- `Unit Tests (ubuntu-latest)`
- `Unit Tests (macos-14)`
- `Unit Tests (windows-2022)`
- `Coverage Test`
- `i18n-check`

(`build-test` is an optional job and is not included in the required check list.)

**Special cases:** Skip this step and proceed directly when either of the following is true:

- `statusCheckRollup` is empty (CI was never triggered)
- `statusCheckRollup` is non-empty, but none of the required jobs appear in the list (indicating the pr-checks.yml workflow was not triggered at all - e.g. a PR that only touches docs/md files)

**Parsing logic:** Handle three cases:

**Informational checks exclusion:** `codecov/patch` and `codecov/project` are configured as `informational: true` in `codecov.yml` - they never block merging and must be **excluded** from all failure checks below. Treat them as non-existent when evaluating CI status.

**Case 1 - All passing** (all required jobs satisfy `status == COMPLETED && conclusion == SUCCESS`, **and** no **non-informational** job in `statusCheckRollup` has a `conclusion` of `FAILURE` or `CANCELLED`; `codecov/*` failures do not affect this determination)

Proceed to the next steps without prompting.

**Case 2 - Some still running** (at least one required job has `status` of `QUEUED` or `IN_PROGRESS`; non-required jobs still running do not affect this determination)

Display a warning and ask:

> ⏳ The following CI jobs are not yet complete: [job list]
> Not all PR CI jobs have finished - it is recommended to wait before reviewing. Continue anyway? (yes/no)

- User selects **no** → abort
- User selects **yes** → continue to next steps

- **Automation mode:** do not prompt. Output signal and stop:
  ```
  <!-- automation-result -->
  CONCLUSION: CI_NOT_READY
  IS_CRITICAL_PATH: false
  CRITICAL_PATH_FILES: (none)
  PR_NUMBER: <PR_NUMBER>
  <!-- /automation-result -->
  ```
  Then exit.

**Case 3 - Failures exist** (any **non-informational** job in `statusCheckRollup` has a `conclusion` of `FAILURE` or `CANCELLED`, not limited to the required job list; `codecov/*` is always excluded)

Display a warning and ask:

> ❌ The following CI jobs did not pass: [job list with conclusions]
> PR CI has failures - review conclusions may be inaccurate. Continue anyway? (yes/no)

- User selects **yes** → continue, and append a CI status warning at the end of the "Change Summary" section in the final report (see the "Report Enhancement" section for format)
- User selects **no** → abort the review, then immediately ask:

  > Would you like to post a comment on PR #\<PR_NUMBER\> to notify the author to fix the failing CI jobs? (yes/no)
  - User selects **yes** → post the CI failure reminder comment (see "CI Failure Reminder Comment" section below), then exit
  - User selects **no** → exit directly

- **Automation mode:** do not prompt. Post CI failure comment automatically (same format as "CI Failure Reminder Comment"), then output signal and stop:
  ```
  <!-- automation-result -->
  CONCLUSION: CI_FAILED
  IS_CRITICAL_PATH: false
  CRITICAL_PATH_FILES: (none)
  PR_NUMBER: <PR_NUMBER>
  <!-- /automation-result -->
  ```
  Then exit.

#### CI Failure Reminder Comment

When CI has failed and the user chooses not to continue the review but opts to post a reminder, use this comment format:

```bash
gh pr comment <PR_NUMBER> --body "<!-- pr-review-bot -->

## CI Checks Failed

The following jobs did not pass at the time of this review. Please fix them:

| Job | Conclusion |
|-----|------------|
| <failing job name> | ❌ <FAILURE or CANCELLED> |

Code review is on hold until all CI checks pass, at which point it will be re-run."
```

(List only the jobs that actually failed; skip any that passed.)

#### Report Enhancement

When CI has failures but the user chooses to continue, append the following at the end of the "Change Summary" section in the final report:

```
> ⚠️ **CI Status Warning**: The following jobs did not pass at review time: `<job name>` (<conclusion>). This report's conclusions are for reference only - it is recommended to fix CI and re-review.
```

---

### Step 3 - Create Worktree

Create an isolated worktree for this PR review. The main repo stays on its current branch.

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
PR_NUMBER=<PR_NUMBER>
WORKTREE_DIR="/tmp/wayland-pr-${PR_NUMBER}"

# Clean up any stale worktree from a previous crash
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true

# Fetch PR head AND base branch so the three-dot diff is accurate
git fetch origin pull/${PR_NUMBER}/head
BASE_REF=$(gh pr view ${PR_NUMBER} --json baseRefName --jq '.baseRefName')
git fetch origin "$BASE_REF"
git worktree add "$WORKTREE_DIR" FETCH_HEAD --detach

# Symlink node_modules so lint/tsc/test can run in the worktree
ln -s "$REPO_ROOT/node_modules" "$WORKTREE_DIR/node_modules"
```

Save `REPO_ROOT` and `WORKTREE_DIR` for use in subsequent steps. All file reads, lint, and diff commands from this point forward run inside `WORKTREE_DIR`.

Save the checked-out HEAD info:

```bash
cd "$WORKTREE_DIR"
git log --oneline -1
```

### Step 4 - Collect Context (Parallel)

Run the following in parallel:

**PR metadata:**

```bash
gh pr view <PR_NUMBER> --json title,body,author,labels,headRefName,baseRefName,state,createdAt,updatedAt
```

**Full diff (no truncation):**

```bash
cd "$WORKTREE_DIR"
git diff origin/<baseRefName>...HEAD
```

**Changed file list:**

```bash
cd "$WORKTREE_DIR"
git diff --name-status origin/<baseRefName>...HEAD
```

**PR discussion comments (excluding bot review comments):**

```bash
gh pr view <PR_NUMBER> --json comments \
  --jq '[.comments[] | select(.body | startswith("<!-- pr-review-bot -->") | not) | select(.body | startswith("<!-- pr-automation-bot -->") | not) | {author: .author.login, body: .body, createdAt: .createdAt}]'
```

Save as `pr_discussion`. Use in Step 7 as supplementary context for the **approach soundness** evaluation - if participants have explained design decisions or flagged known trade-offs, factor that in. Code is always the authoritative source; comments are context only.

### Step 5 - Run Lint on Changed Files

Run oxlint on all changed `.ts` / `.tsx` files (skip deleted files):

```bash
cd "$WORKTREE_DIR"
bunx oxlint <changed_ts_tsx_files...>
```

Save the lint output as **lint baseline**. Use it when reviewing style and code quality in Step 6:

- If a pattern produces **no lint warning** → it is project-approved; do not flag it as a style issue.
- If a pattern produces **a lint warning/error** → it is a real violation; report it at the appropriate severity (ERROR → HIGH, WARNING → LOW).
- Do **not** suggest replacing a lint-clean pattern with an alternative based on general convention alone (e.g. do not suggest spread over `Object.assign` if `no-map-spread` is active).

### Step 6 - Read Changed File Contents

> Use the Read tool to read each changed file from the **worktree** path (`$WORKTREE_DIR/<relative_path>`), not from the main repo.

**Skip:**

- `*.lock` files
- Images, fonts
- `dist/`, `node_modules/`, `.cache/`
- `*.map`, `*.min.js`, `*.min.css`

**Priority order (read highest priority first):**

1. `src/process/`
2. `src/process/channels/`
3. `src/common/`
4. `src/process/worker/`
5. `src/renderer/`

Also read key interface/type definition files imported by the changed files when they provide important context.

### Step 7 - Perform Code Review

Write the code review report in **English**.

Review dimensions:

- **Approach soundness** - Does the overall approach correctly solve the problem? Does it introduce unnecessary complexity? Is it consistent with the project's existing architecture and patterns? Is there a simpler or more elegant implementation path? Are there known defects or design blind spots in the approach itself? Specific evaluation points: Does the approach actually solve the problem described in the PR (rather than solving a different problem)? Does it bypass ready-made mechanisms provided by the framework/library (reinventing the wheel)? Is it consistent with architecture boundaries such as `src/process/`, `src/renderer/`, and the IPC bridge? Does it introduce unnecessary abstraction layers or over-engineering? Are there known edge cases or race conditions that were not considered at the design level?
- **Correctness** - Is the logic correct? Are edge cases handled?
- **Security** - Injection, XSS, key leakage, privilege escalation
- **Supply chain security** - Guard against malicious code injection; focus on: (1) dynamic code execution via `eval()`, `new Function()`, `vm.runInNewContext()`, etc.; (2) suspicious base64/hex-encoded strings or Unicode escape sequences (common backdoor obfuscation techniques); (3) newly added network requests via `fetch`/`axios`/`http`/`net`, especially those targeting external domains or dynamically composed URLs (data exfiltration risk); (4) unusual reading or exfiltration of sensitive variables from `process.env`; (5) modifications to build scripts, postinstall hooks, or CI configuration that inject additional commands. Flag any of these patterns as **CRITICAL**.
- **Immutability** - Are objects or arrays being directly mutated? (A key principle of this project)
- **Error handling** - Are exceptions silently swallowed? Are error messages reasonable?
- **Performance** - Unnecessary re-renders, large loops, blocking calls
- **Code quality** - Function length, nesting depth, naming clarity
- **Leftover console.log** - Are there debug logs remaining in production code?
- **Database changes** - If the PR touches migration files or database schema: (1) Is the migration correct (field types, constraints, indexes, defaults, rollback safety)? (2) Is the change reasonable and aligned with the PR's goal? (3) Is there a risk of data loss for existing data? (4) Is the migration order and dependency correct? Flag incorrect migrations as CRITICAL.
- **IPC bridge / preload** - If the PR touches `src/preload.ts` or IPC channel definitions: (1) Are unnecessary Node.js APIs being exposed to the renderer? (2) Do all exposed APIs have input validation? (3) Can the renderer trigger privileged operations without authorization? Flag exposure of unsafe APIs as CRITICAL.
- **Electron security configuration** - If the PR touches Electron configuration in `electron-builder.yml`, `entitlements.plist`, or `electron.vite.config.ts`: (1) Are sandbox/nodeIntegration/contextIsolation settings being weakened? (2) Are entitlements over-permissive? (3) Is signing or notarization being broken? Flag security regressions as CRITICAL.
- **Tests** - Evaluate against the standards of the [testing skill](../testing/SKILL.md). Flag any of the following: (1) New features with no corresponding test cases; (2) Logic changes without updates to existing relevant tests; (3) New source files accidentally excluded by `vitest.config.ts`'s `coverage.exclude` (i.e. should count toward coverage but are incorrectly excluded); (4) Existing tests that don't meet the quality rules in testing skill Step 2; (5) `codecov/patch` CI check shows FAILURE (patch coverage below 50%): although `codecov.yml` sets this check as `informational: true` (non-blocking), insufficient coverage indicates the new code in this change lacks tests - note this in the review (severity LOW, for the author's reference).
- **Testability** - Can the changed code still be tested in isolation? Are dependencies mockable? Is it decoupled from existing modules? Can unit tests run without depending on a full runtime environment? When coupling is found, distinguish the source:
  - **Coupling newly introduced by this change** - rate by impact (new features should be decoupled from the design stage: list as HIGH; causes tests to be unable to run: list as CRITICAL)
  - **Pre-existing historical coupling** - not a blocker for this PR; recommend opening a separate issue to track

**Report only real problems.** If a dimension has no issues, skip it - do not manufacture findings to appear thorough. Use the actual code as the authority: report what's there, and honestly say the code is clean when it is. The same applies to approach soundness - if the approach has no problems, write "approach is sound" and move on. Do not nitpick for the sake of appearing rigorous.

For each issue found:

1. Specify file path and line number(s)
2. Quote the problematic code
3. Explain why it is an issue
4. Provide a concrete fix with corrected code

Use the following report template:

---

````markdown
## Code Review: <PR Title> (#<PR_NUMBER>)

### Change Summary

[2–3 sentences describing what this PR changed and which modules are affected.]

---

### Approach Assessment

**Verdict**: ✅ Approach is sound / ⚠️ Approach has flaws / ❌ Approach is fundamentally wrong

[2–4 sentences covering: does the approach correctly solve the stated problem; is it consistent with the project architecture; is there a more elegant alternative (if so, briefly describe); are there any design blind spots at the approach level.]

---

### Issues

#### 🔴 CRITICAL - <Issue Title>

**File**: `path/to/file.ts`, line N

**Problematic code**:

```ts
// problematic code
```
````

**Explanation**: [Why this is a problem]

**Suggested fix**:

```ts
// corrected code
```

---

#### 🟠 HIGH - <Issue Title>

(Same format as above)

---

#### 🟡 MEDIUM - <Issue Title>

(Same format as above)

---

#### 🔵 LOW - <Issue Title>

(Same format as above)

---

### Summary

| #   | Severity    | File        | Issue |
| --- | ----------- | ----------- | ----- |
| 1   | 🔴 CRITICAL | `file.ts:N` | ...   |
| 2   | 🟠 HIGH     | `file.ts:N` | ...   |

### Conclusion

[Choose one:]

- ✅ **Approved** - no blocking issues
- ⚠️ **Conditionally approved** - minor issues; can merge after addressing them
- ❌ **Changes required** - blocking issues that must be resolved first

[One sentence explaining the rationale]

---

_This report was generated by the local `pr-review` skill with full project context and no truncation limits._

````

---

If no issues are found across all dimensions, output:

> ✅ No obvious issues found. Code quality is good - recommend approving the merge.

### Step 8 - Ask to Post Comment

Print the complete review report to the terminal.

**Automation mode:** skip the prompt - automatically proceed to post the comment.

**Non-automation mode:** ask the user:
> Review complete. Would you like to post this report as a comment on PR #<PR_NUMBER>? (yes/no)
If the user says **no**, skip posting.

To post:

1. Check for an existing review comment:
```bash
gh pr view <PR_NUMBER> --json comments --jq '.comments[] | select(.body | startswith("<!-- pr-review-bot -->")) | .databaseId'
````

2. If a previous comment exists, update it:

```bash
gh api repos/{owner}/{repo}/issues/comments/<comment_id> -X PATCH -f body="<!-- pr-review-bot -->

<review_report>"
```

3. If no previous comment exists, create a new one:

```bash
gh pr comment <PR_NUMBER> --body "<!-- pr-review-bot -->

<review_report>"
```

**Automation mode only - after posting the comment, output the machine-readable result block:**

Map the review conclusion to CONCLUSION value based on the **highest severity issue found**:

| Highest issue severity | Review verdict          | CONCLUSION  |
| ---------------------- | ----------------------- | ----------- |
| None / LOW only        | ✅ Approved             | APPROVED    |
| MEDIUM                 | ⚠️ Conditionally approved | CONDITIONAL |
| HIGH                   | ⚠️ Conditionally approved | CONDITIONAL |
| CRITICAL               | ❌ Changes required     | REJECTED    |

**Key rule:** If all issues are LOW (or there are no issues), emit `APPROVED` even when the human-facing verdict says "Conditionally approved". `pr-fix` explicitly skips LOW issues, so triggering a fix session for LOW-only reviews wastes a round with no actionable outcome.

Determine `IS_CRITICAL_PATH` using the `CRITICAL_PATH_PATTERN` env var (defined in `scripts/pr-automation.conf`, passed by daemon at runtime).
When a pattern is defined, check and capture matched files:

```bash
# CRITICAL_PATH_PATTERN is an env var - set by pr-automation daemon or manually
if [ -n "$CRITICAL_PATH_PATTERN" ]; then
  cd "$WORKTREE_DIR"
  CRITICAL_FILES=$(git diff origin/<baseRefName>...HEAD --name-only | grep -E "$CRITICAL_PATH_PATTERN")
  if [ -n "$CRITICAL_FILES" ]; then
    IS_CRITICAL_PATH=true
  else
    IS_CRITICAL_PATH=false
  fi
else
  IS_CRITICAL_PATH=false
  CRITICAL_FILES=""
fi
```

Output:

```
<!-- automation-result -->
CONCLUSION: APPROVED
IS_CRITICAL_PATH: false
CRITICAL_PATH_FILES: (none)
PR_NUMBER: 123
<!-- /automation-result -->
```

When `IS_CRITICAL_PATH` is true, list matched files one per line:

```
<!-- automation-result -->
CONCLUSION: APPROVED
IS_CRITICAL_PATH: true
CRITICAL_PATH_FILES:
- docs/feature/extension-market/agent-hub-requirements.md
- docs/feature/extension-market/research/architecture.md
PR_NUMBER: 456
<!-- /automation-result -->
```

### Step 9 - Cleanup

Remove the worktree. No branch switching needed - the main repo was never touched.

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || true
```

Both automation and non-automation modes use the same cleanup - no prompt needed since worktree removal has no side effects.
