---
name: git-panic-recovery
description: |
  Emergency rescue guide for common git mistakes - undo commits, recover deleted branches, fix botched merges, and rescue lost work using reflog and other recovery techniques.
  Use when the user asks about git panic recovery, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of git panic recovery or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "quickstart best-practices checklist"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Git Panic Recovery

## When to Use

**Use this skill when:**
- A user has made a destructive or mistaken git operation and needs immediate recovery -- lost commits, deleted branches, broken merges, accidental force pushes, botched rebases
- A user reports seeing terrifying output like "HEAD detached at", "fatal: refusing to merge unrelated histories", or "Your branch and origin have diverged"
- A user ran `git reset --hard`, `git clean -fd`, or `git push --force` and immediately regrets it
- A user deleted a local or remote branch and needs to recover the commits on it
- A user accidentally staged or committed a secret (API key, password, private key) and needs to purge it from history
- A user's working tree is in a conflict or mid-operation state (merge conflict, rebase in progress, cherry-pick interrupted) and they cannot find a clean exit
- A user dropped a stash and needs to recover the dangling commit object before garbage collection runs
- A user needs to understand the reflog as a recovery mechanism after any history-rewriting operation

**Do NOT use when:**
- The user wants to learn git fundamentals from scratch -- redirect to a git fundamentals skill covering staging, branching, and commit model
- The user wants to set up a new repository or configure git for a new project -- redirect to a git repository setup skill
- The user is designing a branching strategy (GitFlow, trunk-based, etc.) -- redirect to a git workflow design skill
- The user wants to automate git operations via CI/CD pipelines -- redirect to a CI/CD automation skill
- The user is asking about GitHub/GitLab-specific UI operations like pull requests, code review, or merge queue management -- those platforms have UI-specific recovery flows outside git's core commands
- The user needs to resolve a complex architectural merge between long-lived diverged branches requiring semantic understanding of the code -- that requires a code review and merge strategy consultation, not a panic recovery
- The situation involves recovering data from a corrupted filesystem or hardware failure where the `.git` directory itself is damaged -- redirect to a filesystem recovery or backup restoration skill

---

## Process

### Step 1: Diagnose the Situation Before Touching Anything

The single most dangerous thing a panicked user can do is run more commands before understanding the current state. Establish ground truth first.

- Run `git status` immediately and read every line -- it tells you if you are mid-operation (merging, rebasing, cherry-picking, bisecting) via the "interactive rebase in progress" or "You have unmerged paths" messages
- Run `git log --oneline --graph --decorate --all -20` to get a visual map of where HEAD, local branches, and remote tracking refs currently point
- Run `git reflog -20` to see the last 20 HEAD movements with timestamps -- this is the audit trail that makes almost every recovery possible
- Run `git stash list` to see if any stashes exist that the user may have forgotten about
- Ask the user: "Did you push yet?" -- this determines whether the fix is local-only (simple) or requires coordination with a remote (complex)
- Ask the user: "Is this on a shared branch (main, develop) or your personal feature branch?" -- this determines whether force push is safe to use
- Ask the user: "How many commits ago did things go wrong?" -- this lets you scope the reflog search
- Never suggest `git reset --hard` or `git push --force` until the diagnostic phase is complete and the target SHA has been confirmed

### Step 2: Match the Symptom to the Recovery Scenario

Use the diagnostic output to classify the incident into one of these categories:

- **Category A -- Uncommitted changes lost:** `git reset --hard` or `git checkout -- file` was run, wiping working tree changes that were never staged or committed -- these are the hardest to recover and may require editor swap files or IDE local history
- **Category B -- Commits exist but are unreachable:** commits were made but then detached from all refs via reset, branch deletion, or rebase -- recover using `git reflog` or `git fsck --no-reflog`
- **Category C -- History was rewritten on a remote:** force push overwrote the remote branch -- recover using the reflog of `origin/branch-name` if it exists locally, or by finding another team member who fetched before the force push
- **Category D -- Mid-operation state:** currently inside a merge, rebase, cherry-pick, or bisect that went wrong -- abort cleanly with the appropriate `--abort` flag before attempting anything else
- **Category E -- Secret committed and pushed:** credentials, tokens, or private keys are now in remote history -- treat the secret as fully compromised and rotate it before doing anything else, then rewrite history
- **Category F -- Wrong branch:** commits landed on the wrong branch but are otherwise intact -- move them with cherry-pick or branch + reset
- **Category G -- Stash dropped:** user ran `git stash drop` or `git stash clear` -- find the dangling commit object via `git fsck`

### Step 3: Abort Any In-Progress Operations First (Category D)

Before any recovery attempt, clean up mid-operation states, because running reset or checkout while mid-rebase can compound the damage.

- If inside a merge: `git merge --abort` -- this restores HEAD and index to the pre-merge state
- If inside a rebase: `git rebase --abort` -- this restores the branch to the commit it was at before the rebase started and removes the `.git/rebase-merge` or `.git/rebase-apply` directory
- If inside a cherry-pick: `git cherry-pick --abort`
- If inside a bisect: `git bisect reset`
- If inside an am (applying patches): `git am --abort`
- Verify the abort worked: `git status` should now show "nothing to commit, working tree clean" or "On branch X"
- After a successful abort, re-run the diagnostic commands from Step 1 to re-establish ground truth

### Step 4: Locate the Target Commit SHA

Every git recovery ultimately comes down to finding the SHA of the state you want to restore to.

- For recent undos, `git reflog` is the primary tool -- entries are formatted as `<sha> HEAD@{N}: <operation>: <description>`, where N=0 is the most recent
- Read the reflog entries backward in time: find the entry just BEFORE the destructive operation, which is the "HEAD@{N}" entry where the message describes what you were doing before things went wrong
- For branch-specific history, use `git reflog show <branch-name>` rather than `git reflog` (which only shows HEAD movements)
- For deleted branch recovery, use `git reflog --all | grep <branch-name>` to find the last known SHA for that branch
- For dropped stashes, use `git fsck --no-reflog | grep "dangling commit"` then inspect each with `git show <sha>` looking for the stash commit message format "WIP on branchname: <sha> <message>"
- For finding commits by content, use `git log --all -S "unique string from the lost work" --oneline` -- the `-S` flag (pickaxe) searches for commits that added or removed that exact string
- Before proceeding, always verify the SHA is correct: `git show <sha> --stat` to see the commit metadata and changed files without outputting the full diff

### Step 5: Execute the Recovery with the Appropriate Command

Use the minimal destructive command needed -- prefer non-destructive operations when possible.

**For Category B (unreachable commits):**
```shell
# Restore a deleted branch
git branch <branch-name> <sha>

# Restore HEAD to a previous state (only on local personal branches)
git reset --hard <sha>

# Restore a single file to a previous state (non-destructive)
git checkout <sha> -- path/to/file.ext
```

**For Category C (force push overwrote remote):**
```shell
# If your local reflog still has the old state
git reflog show origin/<branch-name>
git push origin <sha-before-force>:<branch-name> --force-with-lease

# If you need to see what origin's reflog looked like
git log origin/<branch-name>@{1}  # the state one movement ago
```

**For Category E (secret in history, not yet pushed):**
```shell
# Soft reset to before the commit, remove the file, recommit
git reset --soft HEAD~1
git rm --cached path/to/secret-file
echo "path/to/secret-file" >> .gitignore
git add .gitignore
git commit -m "Remove accidentally added secret"
```

**For Category E (secret already pushed -- use git-filter-repo, not filter-branch):**
```shell
# Install git-filter-repo first (pip install git-filter-repo or via homebrew)
git filter-repo --invert-paths --path path/to/secret-file --force
git push --force --all
git push --force --tags
```

**For Category F (wrong branch):**
```shell
# Move the last N commits from wrong-branch to correct-branch
git log --oneline -5                       # identify the commits
git checkout correct-branch
git cherry-pick <oldest-sha>^..<newest-sha>
git checkout wrong-branch
git reset --hard HEAD~N                    # N = number of commits moved
```

**For Category G (dropped stash):**
```shell
git fsck --no-reflog | awk '/dangling commit/ {print $3}' | \
  xargs -I{} git show {} --stat | grep -B5 "WIP on"
git stash apply <dangling-sha>
```

### Step 6: Verify the Recovery

Never stop at executing the recovery commands -- confirm the state is exactly what was intended.

- Run `git log --oneline --graph --decorate --all -10` again and compare to what you saw in Step 1 to confirm the desired commits are now reachable
- Run `git diff <recovered-sha> HEAD` to confirm no content was lost or duplicated
- If files were recovered, open one of the critical files and verify key content is present
- Run `git status` to confirm no uncommitted changes, conflicts, or mid-operation state remains
- If commits were moved between branches, verify the source branch no longer contains those commits: `git log wrong-branch --oneline -5`
- If a secret was purged, search the entire history to confirm removal: `git log --all -S "the-secret-value" --oneline` should return no results

### Step 7: Harden Against Recurrence

After recovery, install one or more preventive measures appropriate to what caused the panic.

- For "committed to wrong branch" patterns: configure a pre-commit hook that echoes the current branch name and prompts for confirmation when committing to `main` or `develop`
- For force push disasters: enable branch protection on the remote (`git config receive.denyNonFastForwards true` on a bare repo, or enable branch protection rules on the hosting platform)
- For accidental secrets: install a pre-commit hook using `detect-secrets` or `gitleaks` that scans staged content for entropy-based secret patterns before the commit lands
- For all destructive operations: adopt the habit of creating a backup tag before any risky operation: `git tag backup/before-rebase-$(date +%Y%m%d-%H%M%S)`
- For force push safety: always use `git push --force-with-lease` instead of `git push --force` -- `--force-with-lease` refuses to push if the remote has been updated since your last fetch, preventing you from overwriting someone else's work
- Extend the reflog expiry window: `git config --global gc.reflogExpire 180` and `git config --global gc.reflogExpireUnreachable 60` -- the defaults are 90 days and 30 days respectively

---

## Output Format

When responding to a git panic situation, structure your response as follows:

```
## Git Panic Recovery: [Scenario Name]

### Situation Assessment
- **Current state:** [What git status / reflog shows]
- **Pushed to remote:** [Yes / No / Unknown]
- **Shared branch:** [Yes / No]
- **Recovery category:** [A / B / C / D / E / F / G from the classification above]
- **Data loss risk:** [None -- commits are recoverable | Low -- staged data recoverable | High -- unstaged changes may be gone]

### Pre-Recovery Checklist
- [ ] Abort any in-progress operations (merge/rebase/cherry-pick)
- [ ] Confirm target SHA by running git show <sha> --stat
- [ ] Note current HEAD: [sha] (so you can return here if recovery goes wrong)
- [ ] Backup current state: git tag backup/recovery-attempt-[timestamp]

### Recovery Commands
[Exact commands in order, each with an inline comment explaining what it does]

### Verification Steps
1. [Specific command to confirm the recovery worked]
2. [Specific command to confirm no content was lost]
3. [Expected output to look for]

### What Happened (Why You're In This State)
[2-3 sentence explanation of the git internals that caused this situation,
so the user understands and can prevent recurrence]

### Prevention
- [Specific habit or configuration change to prevent this class of problem]
```

---

## Rules

1. **Never suggest `git reset --hard` without first confirming the exact target SHA via `git show <sha> --stat`.** A wrong SHA with `--hard` can move you further from recovery and the damage compounds.

2. **Never suggest `git push --force` on a branch that other developers have checked out.** Always ask "is this a shared branch?" first. On shared branches, use `git revert` to create a new commit that undoes the change, preserving the history other developers have already pulled.

3. **Treat any committed secret as fully compromised the moment it touches a remote.** Even after rewriting history, if the repository is public, the secret has been indexed by bots within minutes. The very first action for Category E scenarios must be credential rotation, not history rewriting.

4. **`git filter-repo` is the correct tool for history rewriting in 2024 -- `git filter-branch` is deprecated.** `filter-branch` is catastrophically slow on large repos, has known correctness bugs, and the official git documentation explicitly discourages its use. Always use `git filter-repo` (installed separately) for purging files from history.

5. **The reflog only protects committed or stashed work.** If the user never committed or stashed their changes and ran `git reset --hard` or `git checkout -- .`, those changes are not in the reflog. In this case, check the IDE's local history feature (IntelliJ, VS Code with Local History extension), editor swap files (`~/.vim/swp`, `/tmp/`), or filesystem-level snapshots before declaring the work unrecoverable.

6. **`git stash` creates a commit object, so dropped stashes are findable via `git fsck` until the next `git gc` runs.** The default gc trigger is 6700 loose objects. On an active repo, this can happen within days. Urgency matters for stash recovery -- treat it as time-sensitive.

7. **`--force-with-lease` is always preferable to `--force`.** The lease checks that the remote tip you are overwriting is the tip you most recently fetched. This prevents the silent overwrite-my-colleague's-commits disaster that bare `--force` enables. Make this a muscle memory replacement: alias `git push --force` to warn or refuse, replacing it with `--force-with-lease`.

8. **When moving commits between branches with cherry-pick, the SHA of the cherry-picked commit changes.** The content is identical but the commit is a new object. If another developer already has the original SHA in their local history, this creates a confusing duplicate-content situation when they merge. Coordinate with the team when cherry-picking across shared branches.

9. **Reflog entries for remote tracking refs (`origin/branch`) only exist if you fetched them locally.** If you force-pushed without fetching first and your local clone has no `reflog show origin/branch-name` entries, you need a teammate who fetched before your force push to recover the remote history.

10. **Never run `git gc --prune=now` during or after an incident.** Garbage collection permanently destroys dangling commit objects that have not yet been pruned. The default grace period is 2 weeks for unreachable objects. Running `--prune=now` eliminates this safety window and makes stash recovery and reflog-based recovery permanently impossible.

---

## Edge Cases

### The Reflog Is Empty or Doesn't Have the Commit

This happens when the repository was freshly cloned (clones do not copy the origin's reflog), when `git gc` has already run and pruned unreachable objects, or when the user is working inside a shallow clone (`--depth=1`).

- For shallow clones, deepen first: `git fetch --unshallow` then re-attempt recovery
- For clones without the original reflog, check if any other developer has the commit: `git fetch --all` then inspect `git log --all --oneline` to see if any remote branch still points at the commit
- If gc has already pruned the objects, the data is gone unless it exists in a backup, fork, or another developer's clone -- ask the team before declaring permanent loss
- Check if the hosting platform (GitHub, GitLab) retains deleted ref SHAs in pull request or MR history -- many platforms show "this branch was force pushed, previous SHA was X" in the PR timeline

### Working in a Monorepo With Hundreds of Thousands of Commits

Reflog and `git fsck` commands can take minutes to complete on very large repositories. Performance-tuned alternatives:

- Use `git log --all --oneline --since="2 hours ago"` to scope the search by time rather than scanning all history
- Use `git log --author="Your Name" --since="yesterday" --oneline` to filter by author when looking for your own lost commits
- Avoid `git filter-repo` on the full monorepo during business hours -- schedule it as a maintenance window and notify all developers that they need to re-clone or run `git fetch --all` with hard reset after the history rewrite

### Merge Commit Was Pushed to Main and Contains Wrong Changes

A simple `git revert` on a merge commit requires specifying which parent is the "mainline" using `-m 1` or `-m 2`. Getting this wrong inverts your changes.

- Parent 1 (`-m 1`) is always the branch that was merged INTO (the receiving branch, usually main)
- Parent 2 (`-m 2`) is the branch that was merged FROM (the feature branch)
- Use `git show <merge-commit-sha>` -- the "Merge: a1b2c3d e4f5a6b" line shows parent 1 then parent 2 in order
- Always use `-m 1` when reverting a feature branch merged into main: `git revert -m 1 <merge-sha>`
- Warn the user: after reverting a merge commit, the changes from the feature branch are recorded as "already applied" by git. If the feature is later fixed and merged again, git will not re-apply those changes. The revert commit itself must be reverted before re-merging: `git revert <revert-commit-sha>` before attempting the second merge

### The Repository Has Submodules

Standard recovery commands operate only on the parent repository's commit graph. If the problem involves submodule pointers:

- `git submodule update --init --recursive` restores submodule working trees to the pointer recorded in the current parent commit
- If a submodule's HEAD was accidentally advanced, `cd <submodule-dir>` then apply recovery steps to the submodule as its own git repository independently
- `git reset --hard` on the parent repository will reset the submodule pointer in the index but will not touch the submodule's working tree -- you must separately run `git submodule update` after resetting the parent

### Bikeshed: Git and LFS-Tracked Large Files

`git lfs` stores large file content on an LFS server and puts pointer files in the git repository. If a large file was committed without LFS tracking and pushed:

- `git lfs migrate import --include="*.psd,*.zip" --everything` retroactively migrates those files to LFS across all history, but requires a force push of all branches and all developers to re-clone
- If the goal is only to remove a large file (not migrate it), `git filter-repo --invert-paths --path path/to/large-file` is appropriate
- After LFS migration or large file removal, all collaborators must run `git fetch --all` followed by `git reset --hard origin/<branch>` on each of their local branches -- simply `git pull` will not fix their local object store

### Interactive Rebase Dropped Commits Instead of Reordering Them

When editing the rebase todo list, accidentally deleting a `pick` line silently drops that commit from the rebased branch. The dropped commit still exists as a dangling object.

- `git reflog show <branch-name>` will show the pre-rebase tip
- Alternatively, `git log --walk-reflogs <branch-name>` shows all historical positions of the branch
- Recovery: `git reset --hard <sha-before-rebase>` to fully abandon the rebase result, or `git cherry-pick <dropped-sha>` if the rebase result is otherwise good and only one commit was dropped
- To prevent this: always use `git rebase -i --keep-empty` when you want to inspect what would be dropped, and use `git rebase --edit-todo` to pause mid-rebase and verify the todo list before proceeding

### Windows Line Endings Caused the Merge Conflict Disaster

`git config core.autocrlf` set inconsistently across a team causes entire files to appear as 100% conflicted even when the semantic content is identical.

- Diagnose: `git diff --ignore-space-at-eol HEAD~1` -- if the diff disappears, the conflict is purely whitespace
- Fix the immediate conflict: `git merge -Xignore-space-change` or `git merge -Xignore-all-space` to merge ignoring CRLF differences
- Fix the root cause: add a `.gitattributes` file with `* text=auto` to normalize line endings on commit/checkout, commit it, then run `git add --renormalize .` to re-normalize all tracked files

---

## Example

**Input from user:** "I was cleaning up my local branches and ran `git branch -D feature/payment-gateway` -- I just realized I never merged it and there are two weeks of work on it. I haven't pushed this branch anywhere. Am I completely screwed?"

---

**Output:**

## Git Panic Recovery: Deleted Local Branch With Unmerged Commits

### Situation Assessment
- **Current state:** Local branch `feature/payment-gateway` deleted via `git branch -D`, HEAD is now on a different branch
- **Pushed to remote:** No -- work exists only in this local clone
- **Shared branch:** No -- this was a personal feature branch
- **Recovery category:** B -- Commits exist but are unreachable (detached from all refs)
- **Data loss risk:** None -- `git branch -D` only deletes the ref pointer, not the commit objects themselves. The commits are still in the object store and will remain there until `git gc` prunes them (default grace period: 14 days for unreachable objects)

### Pre-Recovery Checklist
- [x] No in-progress operations to abort (`git status` shows clean working tree)
- [ ] Locate the target SHA via reflog before running any recovery command
- [ ] Verify the SHA via `git show <sha> --stat` before recreating the branch
- [ ] Create a safety backup tag: `git tag backup/before-branch-recovery-$(date +%Y%m%d-%H%M%S)`

### Recovery Commands

```shell
# Step 1: Find the last commit that was on feature/payment-gateway
# The reflog records every time HEAD moved, including when you were on that branch
git reflog | grep "feature/payment-gateway"

# Expected output will look like:
# a3f92c1 HEAD@{4}: checkout: moving from feature/payment-gateway to main
# 7b284de HEAD@{5}: commit: Add webhook handler for payment confirmation
# ...

# The SHA on the "checkout: moving FROM feature/payment-gateway" line
# is the tip commit of your deleted branch -- that's what you want.

# Step 2: Alternatively, search reflog explicitly for the branch's own history
git reflog show feature/payment-gateway
# Note: this works even after the branch is deleted because reflog stores
# branch-specific movement history separately from HEAD movements.

# Step 3: Confirm the SHA is the right commit before recreating the branch
git show a3f92c1 --stat
# Verify: does the commit message and file list match what you expect to be
# the most recent commit on payment-gateway?

# Step 4: Recreate the branch pointing at that commit
git branch feature/payment-gateway a3f92c1

# Step 5: Switch to it and verify the full history is intact
git checkout feature/payment-gateway
git log --oneline -10

# Step 6: Push to remote immediately to protect the work
git push -u origin feature/payment-gateway
```

### Verification Steps
1. Run `git log --oneline -15` -- you should see the full two weeks of commits with correct messages and timestamps
2. Run `git diff main...feature/payment-gateway --stat` -- you should see all the files you changed across the feature
3. Run `git status` -- should show "Your branch is up to date with 'origin/feature/payment-gateway'" after the push
4. Open one of the key implementation files and confirm the code content is exactly as you left it

### What Happened (Why You're In This State)

In git, a branch is nothing more than a text file in `.git/refs/heads/` containing a 40-character SHA. When you ran `git branch -D`, git deleted that text file -- but every commit object that was on the branch still exists intact in `.git/objects/`. The commits became "unreachable" (no ref points to them) but were not destroyed. The reflog separately records every time HEAD or a branch ref moved, acting as a time-stamped index of all recent SHA positions, which is exactly what made this recovery trivial.

### Prevention

Three habits that prevent this scenario entirely:

1. **Always push feature branches before deleting them locally**, even if the work is not ready to merge -- `git push origin feature/payment-gateway` costs nothing and gives you a remote copy as insurance.

2. **Use `git branch -d` (lowercase) instead of `git branch -D` (uppercase)** -- lowercase `-d` is the safe delete that refuses to delete branches with unmerged commits, requiring you to confirm you actually merged before deletion. Uppercase `-D` force-deletes without checking. Reserve `-D` only for branches you are certain are merged and abandoned.

3. **Before any branch cleanup session**, tag the current state: `git tag backup/pre-cleanup-$(date +%Y%m%d)` -- this gives you a named anchor to the current state of HEAD and makes it easy to find recent commits in the reflog later.
