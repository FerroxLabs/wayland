# PR Automation Pipeline

This repository runs a PR automation agent that continuously processes open PRs (review, fix, merge). This document explains the label system, trigger conditions, and how to intervene manually.

---

## Label System

| Label                    | Meaning                                                                                       | Terminal? |
| ------------------------ | --------------------------------------------------------------------------------------------- | --------- |
| `bot:reviewing`          | Review in progress (re-entry lock placeholder)                                                | No        |
| `bot:ready-to-fix`       | CONDITIONAL review complete, waiting for bot to run fix on next cycle                        | No        |
| `bot:fixing`             | Fix in progress (re-entry lock placeholder)                                                   | No        |
| `bot:ci-waiting`         | CI failure notified, waiting for author to push a new commit - bot pauses processing this PR | No        |
| `bot:needs-rebase`       | Merge conflict and bot cannot auto-rebase - waiting for author to push a new commit           | No        |
| `bot:needs-human-review` | Human intervention required (blocking issue)                                                  | ✅        |
| `bot:ready-to-merge`     | Bot has finished processing, code looks good, waiting for human confirmation to merge         | ✅        |

---

## Processing Flow

```
Select PR (priority: bot:ready-to-fix > trusted > FIFO)
 │
 ├─ No PR → EXIT
 │
 ├─ bot:ready-to-fix → Re-check CI
 │     ├─ CI running/failed → Remove label, re-queue → EXIT
 │     └─ CI passed → pr-fix → push → bot:ready-to-merge → EXIT
 │
 └─ Fresh PR → Add bot:reviewing → Check CI
       ├─ Never triggered → Approve workflow → EXIT
       ├─ CI running → Remove bot:reviewing → Find next
       ├─ CI failed → Dedup check
       │     ├─ Already commented and no new commit → Add bot:ci-waiting → Find next
       │     └─ Otherwise → Post comment → EXIT
       └─ CI passed → Check merge conflict
             ├─ UNKNOWN → Find next
             ├─ CONFLICTING → Dedup check
             │     ├─ Already commented and no new commit → Find next
             │     └─ Otherwise → Attempt auto-rebase
             │           ├─ Success → push → EXIT
             │           └─ Failure → Comment + bot:needs-rebase → EXIT
             └─ MERGEABLE
                   ├─ BEHIND → update-branch API → EXIT (GitHub auto-updates base, CI re-runs)
                   └─ Other → pr-review
                         ├─ APPROVED → bot:ready-to-merge → EXIT
                         ├─ CONDITIONAL → bot:ready-to-fix → EXIT
                         │     └─ Fix complete → bot:ready-to-merge → EXIT
                         └─ REJECTED → bot:needs-human-review → EXIT
```

### Skip Conditions (move on to the next PR)

- PR is a draft (`gh pr list -is:draft` filters these out directly)
- Title contains `WIP` (case-insensitive)
- Already has `bot:needs-rebase` / `bot:needs-human-review` / `bot:ready-to-merge` / `bot:reviewing` / `bot:fixing` / `bot:ci-waiting`
- CI is still running (QUEUED / IN_PROGRESS)
- Mergeability is UNKNOWN
- CI failed but already commented and author has no new commit (also applies `bot:ci-waiting`; each cycle does a lightweight check for new commits)
- Merge conflict but already commented and author has no new commit

---

## Manual Intervention

### Blocking automatic processing of a PR

- Set it to draft, or
- Add `WIP` to the title, or
- Manually apply the `bot:needs-human-review` label

After removing `bot:needs-human-review`, the daemon will reprocess the PR on its next cycle.

### Viewing run status

```bash
tail -f /tmp/pr-automation.log
```

---

## Daemon Management

### Start

```bash
# Run in foreground
./scripts/pr-automation.sh

# Run in background
nohup ./scripts/pr-automation.sh >> /tmp/pr-automation.log 2>&1 &
```

### Stop

```bash
kill $(cat /tmp/pr-automation-daemon.pid)
```

### Check if running

```bash
PID=$(cat /tmp/pr-automation-daemon.pid 2>/dev/null) \
  && kill -0 "$PID" 2>/dev/null \
  && echo "Daemon running (PID $PID)" \
  || echo "Daemon not running"
```

### Custom parameters

```bash
SLEEP_SECONDS=60        # Interval between cycles (default: 30 seconds)
MAX_CLAUDE_SECS=3600    # Claude timeout threshold (default: 3600 seconds)
LOG_FILE=/var/log/pr-automation.log
```

---

## Initial Deployment

1. Confirm `gh auth login` is complete and you have sufficient permissions (PR labels, merge, push to external forks)
2. Run once manually: `./scripts/pr-automation.sh` and observe the logs
3. Confirm output shows `No eligible PR found this round` or a PR being processed normally
