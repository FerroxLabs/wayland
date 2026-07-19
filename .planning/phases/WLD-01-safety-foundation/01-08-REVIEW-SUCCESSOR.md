---
phase: WLD-01-safety-foundation
plan: 08
reviewed: 2026-07-19
candidate_commit: 4558887e66cc59d3c84901e073d979dbf8a75297
candidate_tree: ba88dfc1f5872ece67827b1b4017223d5a67af09
status: issues_found
findings:
  high: 1
  medium: 2
  low: 0
  total: 3
---

# Plan 01-08 Successor Review

## Decision

**REJECT / REOPEN.** The successor fixes the previously reported provenance,
snapshot, ordering, and shape-validation gaps, but three bounded contradictions
remain. No destructive workspace capability was found.

## Findings

### SR-01 (HIGH): conversation removal can outlive an older same-ID process lease

**Files:** `src/process/task/WorkerTaskManager.ts:122-164`,
`src/process/bridge/conversationBridge.ts:290-323`

`addTask` permits an older same-conversation lease to remain `terminating` while
publishing a new `running` successor. `kill(id)` then selects only the running
lease and returns its termination promise. The real `conversation.remove` path
awaits that one promise and may delete the durable conversation reference while
the older same-ID lease is still alive, failed, or able to write to its original
workspace. The older workspace remains visible to the inventory, but the
conversation deletion terminal claim is false: deletion has not proved that all
processes owned by that conversation stopped.

**Required repair:** make `kill(id)` terminate and await every running or
terminating lease with the ID, fail the deletion if any lease fails, and add a
hostile replacement/removal regression that proves persistence remains until
both shutdowns settle.

### SR-02 (MEDIUM): collision-created managed workspaces are outside discovery grammar

**Files:** `src/process/utils/initAgent.ts:234-251`,
`src/process/services/managedWorkspaceInventory.ts:54,202-205`

The exclusive-create fallback appends `-<uuid>` after the timestamp, producing
names such as `hermes-temp-1736900000000-<uuid>`. The inventory admits only
names ending in the timestamp digit run. Desktop therefore creates and records
provenance for a managed workspace that its own retention inventory will never
discover. This silently removes the workspace from the read-only safety view
after a predictable-name collision.

**Required repair:** share one closed managed-workspace-name grammar between
creation and discovery, keep collision fallbacks inside that grammar, and prove
the fallback is inventoried while the pre-existing predictable directory is not
adopted.

### SR-03 (MEDIUM): the IPC parser accepts semantically contradictory reports

**File:** `src/common/types/managedWorkspaceRetention.ts:138-269`

The parser validates shapes and gives special semantic treatment only to
`review-candidate`. A `preserve` entry can claim `referenceCount: 1` while
publishing zero references, claim `classifications: ['unknown']` despite positive
schedule or active-process evidence, carry arbitrary reasons inconsistent with
the classifier, or mark an otherwise fully complete report as incomplete. Such
reports are admitted into renderer state because the summary remains
self-consistent with the forged decision.

**Required repair:** use one shared pure classifier for production and IPC
validation, require the decision to equal the decision recomputed from evidence,
bind positive/null authority counts to the projected reference set, reject
duplicate/blank reference identities, and require `complete` to equal the
recomputed report-completeness fact. Add hostile parser/UI regressions for each
contradiction.

## Positive evidence retained

- The bridge remains read-only and rejects every renderer request payload.
- No delete, prune, quarantine, move, or rename provider exists in the Plan
  01-08 surface.
- Missing snapshot authority still prevents every current workspace from
  becoming a review candidate.
- Provenance remains installation, canonical-root, canonical-path, device, and
  inode bound.

## Audit boundary

This review is scoped to Plan 01-08 ownership and the exact candidate above. It
does not assert acceptance, packaging, deployment, release readiness, or the
deferred managed-workspace lifecycle.
