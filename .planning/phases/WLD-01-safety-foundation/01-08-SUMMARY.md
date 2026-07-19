---
phase: WLD-01-safety-foundation
plan: 08
subsystem: safety/storage/ui
tags: [workspace-retention, preservation-first, fail-closed, ipc, hostile-testing]
requires: [01-40]
provides:
  - Preservation-first managed-workspace classification
  - Installation-bound encrypted workspace-creation provenance
  - Terminating-process leases retained until shutdown settles
  - Read-only managed-workspace inventory projection
  - Conversation deletion proof that managed workspace bytes remain unchanged
affects: [WLD-01-safety-foundation, managed-workspaces, conversation-deletion]
tech-stack:
  added: []
  patterns: [process-owned authority, malformed-evidence preservation, read-only IPC]
key-files:
  created:
    - src/common/types/managedWorkspaceRetention.ts
    - src/process/services/managedWorkspaceProvenance.ts
    - tests/unit/WorkerTaskManager.workspaceRetention.test.ts
    - tests/unit/conversationBridge.workspaceRetention.test.ts
    - tests/unit/managedWorkspaceProvenance.test.ts
  modified:
    - src/process/agent/acp/utils.ts
    - src/process/services/workspaceRetention.ts
    - src/process/services/managedWorkspaceInventory.ts
    - src/process/services/desktopManagedWorkspaceInventory.ts
    - src/process/bridge/conversationBridge.ts
    - src/process/bridge/workspaceRetentionBridge.ts
    - src/process/task/AcpAgentManager.ts
    - src/process/task/WorkerTaskManager.ts
    - src/renderer/pages/settings/StorageSettings/ManagedWorkspacesCard.tsx
    - tests/unit/workspaceRetention.test.ts
    - tests/unit/managedWorkspaceInventory.test.ts
    - tests/unit/desktopManagedWorkspaceInventory.test.ts
    - tests/unit/process/bridge/workspaceRetentionBridge.test.ts
    - tests/unit/bridgeAllowlistWorkspaceRetention.redteam.test.ts
    - tests/unit/renderer/pages/settings/storage/ManagedWorkspacesCard.dom.test.tsx
key-decisions:
  - 'Missing, malformed, raced, unreadable, incomplete, contradictory, or active evidence always preserves content.'
  - 'Filename grammar is discovery only; provenance comes from an encrypted installation-bound creation ledger.'
  - 'Without a portable immutable filesystem snapshot, empty-looking shells remain preserved and unknown.'
  - 'A terminating agent remains active authority until shutdown resolves; failed shutdown retains the lease and chat.'
  - 'Callback-time same-ID successors are refused and drained to a fixed point before removal can report success.'
  - 'Failed taskkill or POSIX process-tree enumeration cannot mint backend-exit proof.'
  - 'Renderer IPC accepts no path, root, classification, mutation, legacy alias, or unknown input.'
patterns-established:
  - 'Classification does not grant lifecycle mutation authority.'
  - 'Real service/repository deletion-path tests compare exact workspace bytes before and after conversation removal.'
requirements-completed: [SAF-04]
coverage:
  - id: D1
    description: 'Managed workspaces are conservatively classified from complete process-owned evidence.'
    requirement: SAF-04
    verification:
      - kind: unit
        ref: 'focused workspace-retention and process-exit suite passes'
        status: pass
      - kind: integration
        ref: 'ConversationServiceImpl through SqliteConversationRepository proves exact binary workspace bytes survive conversation.remove'
        status: pass
    human_judgment: false
  - id: D2
    description: 'The bridge and renderer expose review-only classification without mutation authority.'
    requirement: SAF-04
    verification:
      - kind: unit
        ref: 'workspaceRetentionBridge, allowlist red-team, and ManagedWorkspacesCard DOM tests pass'
        status: pass
      - kind: other
        ref: 'legacy quarantine aliases absent from every owned source and test path'
        status: pass
    human_judgment: false
  - id: D3
    description: 'The integrated Desktop source remains green after preservation-first hardening.'
    requirement: SAF-04
    verification:
      - kind: integration
        ref: 'GSD_RUNTIME=codex bun run test after rollback repair (15,202 Vitest + 226 Bun-native pass)'
        status: pass
      - kind: unit
        ref: 'repair additions introduce no lint findings; initAgent retains 11 baseline no-await-in-loop warnings and 0 errors; typecheck and scoped oxfmt pass'
        status: pass
    human_judgment: false
duration: 3h 30m
completed: 2026-07-20
status: successor-built-pending-independent-audit
---

# Phase 1 Plan 08: Preservation-First Workspace Retention Summary

**Managed workspace inspection is fail-closed and read-only, with real deletion-path proof that user bytes remain intact.**

## Performance

- **Duration:** approximately 3.5 hours including four successor audits, repair, and aggregate proof
- **Completed:** 2026-07-20
- **Tasks:** 3
- **Files owned:** 58

## Accomplishments

- Replaced mutation-suggestive quarantine vocabulary with a non-authoritative `review-candidate` classification and removed the legacy aliases.
- Made incomplete, malformed, contradictory, unreadable, raced, invalid-date, and active-process evidence preserve by default.
- Added an encrypted installation-bound provenance ledger at the real temporary-workspace creation seam; matching filenames can no longer mint ownership.
- Bound provenance publication to the exact canonical root, canonical workspace path, device, and inode observed immediately after exclusive creation; replacing that object before ledger publication now fails closed.
- Kept CLI-safe root aliases usable by correlating canonical producer entry paths against the report's canonical root, while retaining lexical-root identity as separate evidence.
- Preserved terminating process authority until actual shutdown and made conversation removal fail closed when shutdown fails.
- Proved through the production conversation service and SQLite repository adapter that deleting a conversation severs the database reference without altering exact managed-workspace file bytes.
- Restricted the retention IPC and renderer to read-only explanations, with hostile tests rejecting renderer-supplied roots, paths, classifications, mutation verbs, aliases, and unknown fields.
- Closed the callback-time successor race: removal now re-drains refused same-ID processes after deferred persistence and fails closed when their shutdown is unproved.
- Made Windows taskkill failure and POSIX process-tree enumeration failure reject shutdown instead of silently treating missing evidence as success.
- Awaited idle-shutdown results through `Promise.allSettled`, preserving failed leases while deterministically observing every rejection.
- Prevented background wiki synthesis from treating the launch working directory as user-authorized project context, eliminating generated `.ijfw` state from aggregate proof.
- Preserved the 1,001-entry Mission Control reachability proof while removing its repeated full-accessibility-tree timeout failure under aggregate load.
- Deferred irreversible external-channel cleanup until after durable conversation deletion commits, so a failed shutdown or database delete cannot retain a chat after destroying its channel resources.

## Task Commits

1. **Conservative classifier and real deletion-path proof:** `d73fce99ea53a134b7325c3f2f50f6120532bab9`
2. **Read-only bridge and review presentation:** `56885e04cc390a6f8f48bf303808313d2bfb9cba`
3. **Adversarial authority and race repair:** `88f86216576fa70ee50c4d57fafae72f67a2b73a`
4. **Successor shutdown-proof repair:** `1037c0b82f2c6a7829a4d3b9c36e6279b1db8ee8`
5. **Alias, creation-identity, parser, and deterministic-test repair:** `6d4176d14d91b0c13bbe85d91c6324f617748377`
6. **External-channel rollback repair:** `0b43c3609956d3538e2c0e7275febf5e84652958`

**Rejected predecessor:** `0b98288b02e0b65b260c7b3b1670bd5ea5b68419`

**Repaired implementation candidate:** `0b43c3609956d3538e2c0e7275febf5e84652958`

**Aggregate-proved source tree:** `5a53433ff6ff471b71946cbb2d97178e20aa8bd5`

**Acceptance state:** pending independent successor re-audit; no acceptance claim is made here.

## Decisions Made

- Authority evidence is complete only when every required source has an exact recognized value and no unknown source is present.
- A review candidate remains informational: it is not a deletion, pruning, or quarantine instruction.
- Current Node filesystem observation cannot safely establish an immutable empty-directory snapshot, so current candidates remain preserved.
- The preview IPC accepts no renderer request object because the main process owns the canonical workspace root and classification evidence.

## Deviations from Plan

The independent audits reopened the plan four times. Repairs added creation provenance, immutable-snapshot fail-closed behavior, terminating-process leases, total IPC parsing, canonical authority ordering, contradictory-duplicate rejection, human-readable active-work labels, production service/repository deletion proof, callback-time successor draining, fail-closed process-tree enumeration, deterministic idle-rejection observation, canonical alias correlation, creation-time object identity, impossible phase-1 evidence rejection, deterministic Constitution recovery observation, and post-commit external-channel cleanup ordering. These changes enforce the plan's authority boundary without expanding lifecycle authority.

## Issues Encountered

The complete suite emitted pre-existing non-failing jsdom canvas, listener-count, and nested mock warnings outside this plan's owned files. All required gates completed successfully.

## Explicit Non-Claim

Managed-workspace lifecycle mutation (quarantine, restore, keep, delete, prune) is not delivered.

## Self-Check

BUILDER PROOF PASSED; independent successor re-audit remains required. The repaired implementation passed 238 focused tests, typecheck, scoped formatting, 15,202 Vitest tests, and 226 Bun-native tests. New repair lines introduced no lint findings; `initAgent.ts` retains 11 baseline `no-await-in-loop` warnings and zero errors. Aggregate proof left no generated `.ijfw/wiki-state/index.json` behind. No lifecycle mutation authority was added.

## Retained Construction Evidence

The retained logs are under `.planning/phases/WLD-01-safety-foundation/evidence/01-08-r3-0b43c360/`. Ephemeral test-generated password values in the aggregate log are replaced with `[REDACTED]`; all result lines and warnings are retained.

| Receipt | SHA-256 |
|---|---|
| `01-focused-vitest.log` | `51111836384634bb675fea182309fc7aee1aed1dfd577d132a895f86a410a9ac` |
| `02-typecheck.log` | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| `03-scoped-lint.log` | `5d36849f53bc0d527a2b6042063eabbc5f0bcb234df9187f82d031f6eb236525` |
| `04-scoped-format.log` | `ce74892a50259be576c24aedc1e0dd4eeea6ac09efda981ebd8c79bc9e8d9f82` |
| `05-full-aggregate.log` | `8c797d82468f4aad9556cabf5ed68364c193f4f5b203f305ddf768b654d9ee17` |
| `06-invariants.log` | `963c3032b9552c41e9b216afca35ef4dfe79d672d598a74335cc302db1f5cc58` |

---

_Phase: WLD-01-safety-foundation_  
_Plan: 08_  
_Completed: 2026-07-19_
