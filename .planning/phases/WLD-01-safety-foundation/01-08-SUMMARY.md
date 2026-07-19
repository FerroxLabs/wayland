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
  - Identity-bound shutdown retry after transient termination failure
  - Durable, restart-replayed post-commit channel cleanup intents
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
    - src/process/channels/core/ConversationChannelCleanup.ts
    - src/process/services/database/conversationChannelCleanupIntent.ts
    - src/process/services/database/conversationChannelCleanupIntent.bun.test.ts
    - tests/unit/WorkerTaskManager.workspaceRetention.test.ts
    - tests/unit/conversationBridge.workspaceRetention.test.ts
    - tests/unit/ConversationChannelCleanup.test.ts
    - tests/unit/managedWorkspaceProvenance.test.ts
  modified:
    - src/process/agent/acp/utils.ts
    - src/process/services/workspaceRetention.ts
    - src/process/services/managedWorkspaceInventory.ts
    - src/process/services/desktopManagedWorkspaceInventory.ts
    - src/process/bridge/conversationBridge.ts
    - src/process/channels/core/ChannelManager.ts
    - src/process/channels/core/SessionManager.ts
    - src/process/bridge/workspaceRetentionBridge.ts
    - src/process/task/AcpAgentManager.ts
    - src/process/task/WorkerTaskManager.ts
    - src/process/services/database/index.ts
    - src/process/services/database/migrations.ts
    - src/process/services/database/schema.ts
    - src/process/services/database/types.ts
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
  - 'A failed termination attempt releases only operation ownership; the exact lease and terminal successor-refusal gate remain available for verified retry.'
  - 'Conversation deletion atomically captures channel session identities and commit-time source before foreign keys can erase the lookup.'
  - 'Post-commit channel cleanup is idempotent, durably retried, replayed after restart, and retired only after all captured identities complete.'
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
        ref: 'GSD_RUNTIME=codex bun run test after durable-cleanup repair (15,207 Vitest + 228 Bun-native pass)'
        status: pass
      - kind: unit
        ref: 'repair scope remains baseline-neutral at 74 lint warnings and 0 errors; typecheck and scoped oxfmt pass'
        status: pass
    human_judgment: false
  - id: D4
    description: 'Committed conversation deletion retains enough identity to finish external-channel cleanup after throws, crashes, restarts, and source races.'
    requirement: SAF-04
    verification:
      - kind: unit
        ref: 'hostile coordinator, bridge, and WorkerTaskManager retry suites pass'
        status: pass
      - kind: integration
        ref: 'Bun-native SQLite close/reopen and transaction rollback proof passes'
        status: pass
    human_judgment: false
duration: 4h
completed: 2026-07-20
status: successor-built-pending-independent-audit
---

# Phase 1 Plan 08: Preservation-First Workspace Retention Summary

**Managed workspace inspection is fail-closed and read-only, with real deletion-path proof that user bytes remain intact.**

## Performance

- **Duration:** approximately 4 hours including five successor audits, repair, and aggregate proof
- **Completed:** 2026-07-20
- **Tasks:** 3
- **Files owned:** 69

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
- Made that post-commit cleanup a durable idempotent transaction intent, captured before `ON DELETE SET NULL`, retried after throws, and replayed on ChannelManager restart.
- Moved cleanup eligibility to the transaction's commit-time source so a stale pre-gate source snapshot cannot suppress required cleanup.
- Preserved the exact terminating lease and fail-closed successor gate after a transient kill failure while allowing a later identity-bound attempt to obtain real exit proof.

## Task Commits

1. **Conservative classifier and real deletion-path proof:** `d73fce99ea53a134b7325c3f2f50f6120532bab9`
2. **Read-only bridge and review presentation:** `56885e04cc390a6f8f48bf303808313d2bfb9cba`
3. **Adversarial authority and race repair:** `88f86216576fa70ee50c4d57fafae72f67a2b73a`
4. **Successor shutdown-proof repair:** `1037c0b82f2c6a7829a4d3b9c36e6279b1db8ee8`
5. **Alias, creation-identity, parser, and deterministic-test repair:** `6d4176d14d91b0c13bbe85d91c6324f617748377`
6. **External-channel rollback repair:** `0b43c3609956d3538e2c0e7275febf5e84652958`
7. **Durable cleanup and shutdown-retry repair:** `77687d43d996fbffc934fdba348639afea519e4a`

**Rejected predecessor:** `0b98288b02e0b65b260c7b3b1670bd5ea5b68419`

**Superseded repair candidate:** `0b43c3609956d3538e2c0e7275febf5e84652958` (evidence commit `0001046836e8d9e2c93fd4c1c225cfa112783f61`)

**Repaired implementation candidate:** `77687d43d996fbffc934fdba348639afea519e4a`

**Aggregate-proved source tree:** `0d5bec955c0fda8a923c296c186fdbd8311dc75f`

**Acceptance state:** pending independent successor re-audit; no acceptance claim is made here.

## Decisions Made

- Authority evidence is complete only when every required source has an exact recognized value and no unknown source is present.
- A review candidate remains informational: it is not a deletion, pruning, or quarantine instruction.
- Current Node filesystem observation cannot safely establish an immutable empty-directory snapshot, so current candidates remain preserved.
- The preview IPC accepts no renderer request object because the main process owns the canonical workspace root and classification evidence.
- The database transaction, not a bridge snapshot, is authoritative for channel-cleanup eligibility and captured session identity.
- Cleanup is at-least-once until durable retirement; repeated external context clear and absent local sessions are treated idempotently.
- A failed kill does not authorize a successor or discard the original lease, but it does permit a later shutdown attempt against that same identity.

## Deviations from Plan

The independent audits reopened the plan five times. Repairs added creation provenance, immutable-snapshot fail-closed behavior, terminating-process leases, total IPC parsing, canonical authority ordering, contradictory-duplicate rejection, human-readable active-work labels, production service/repository deletion proof, callback-time successor draining, fail-closed process-tree enumeration, deterministic idle-rejection observation, canonical alias correlation, creation-time object identity, impossible phase-1 evidence rejection, deterministic Constitution recovery observation, post-commit external-channel cleanup ordering, durable restart replay, transaction-authoritative cleanup identity, and identity-bound shutdown retry. These changes enforce the plan's authority boundary without expanding lifecycle authority.

## Issues Encountered

The complete suite emitted pre-existing non-failing jsdom canvas, listener-count, and nested mock warnings outside this plan's owned files. All required gates completed successfully.

## Explicit Non-Claim

Managed-workspace lifecycle mutation (quarantine, restore, keep, delete, prune) is not delivered.

## Self-Check

BUILDER PROOF PASSED; independent successor re-audit remains required. The repaired implementation passed 243 focused Vitest tests, 2 focused Bun-native hostile tests, typecheck, scoped formatting, 15,207 aggregate Vitest tests, and 228 aggregate Bun-native tests. Scoped lint remained exactly baseline-neutral at 74 warnings and zero errors; the three new linted files introduced no findings. Aggregate proof left no generated `.ijfw/wiki-state/index.json` behind. No lifecycle mutation authority was added.

## Retained Construction Evidence

The SHA-bound receipts are under `.planning/phases/WLD-01-safety-foundation/evidence/01-08-r4-77687d43/`. Ephemeral test-generated password values were not retained; aggregate counts and known warnings are recorded. These are builder receipts, not independent acceptance evidence.

| Receipt                     | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `01-focused-vitest.log`     | `a2902e820e9686a89e0f87222dbc1098532536fe34bf9620c71fb7d64afaa653` |
| `02-bun-native-intent.log`  | `75a82baaf6dd6c2c14473c989e3ce60b696a5379af1c5c538a5078eae299456c` |
| `03-typecheck.log`          | `849bf63f0ed898b23fdd7279ca2ee17a2ca4988c61a759351bfee1f1108d0f8d` |
| `04-scoped-lint.log`        | `8c520931e84f7437276ea73c1429836f468b455f2ab9cc4910e53e099ce3bfaa` |
| `05-scoped-format-diff.log` | `7f1b8646fa49c7be343eddce06e8092b80fb194ceeb9888e53494ed39edbf26c` |
| `06-full-aggregate.log`     | `ecdc2b1a8b3a538377c1427c4523f58e43f0eb158c3d9addc98bdc14b339dd6d` |
| `07-invariants.log`         | `1098c197f0fee6a454a1a52ba1886b18d61ebbc8bb4c95a0a1aed850cefcb502` |

---

_Phase: WLD-01-safety-foundation_  
_Plan: 08_  
_Completed: 2026-07-20_
