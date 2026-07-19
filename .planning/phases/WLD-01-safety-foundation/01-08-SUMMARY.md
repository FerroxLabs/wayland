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
    - src/process/task/WCoreManager.ts
    - src/process/agent/wcore/index.ts
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
  - 'Wayland Core engine-tree shutdown failure remains observable after root exit; manager identity and profile authority survive until exact retry proves the same engine stopped.'
  - 'Root-process exit is notification only; profile-release authority remains held until the exact manager kill proves complete engine-tree shutdown.'
  - 'Resume fallback cannot replace a stale engine identity unless shutdown of that exact child tree is proved; failure retains the child and profile for identity-bound retry.'
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
        ref: 'GSD_RUNTIME=codex bun run test after bootstrap-lifecycle repair (15,217 Vitest + 228 Bun-native pass)'
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

- **Duration:** approximately 4 hours plus successor repair and proof
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
- Propagated Wayland Core engine-tree shutdown failure through `WCoreManager.kill()`, retained the exact manager/profile authority on failure, and prevented a later root `exit` event from turning an unproved descendant shutdown into success.
- Separated root-exit notification from profile-release authority, retaining the profile lease through deferred descendant-tree shutdown and releasing it exactly once only after the exact manager kill succeeds.
- Preserved a spawned Wayland Core identity through ready-timeout and other bootstrap failures, serialized concurrent shutdown callers onto one exact tree-proof attempt, and retained both identity and profile after failed cleanup for an identity-bound retry.
- Made resume fallback fail closed: an unproved stale-child shutdown retains the exact child and profile, spawns no replacement, and allows only an identity-bound retry; concurrent disposal shares that same proof attempt.

## Task Commits

1. **Conservative classifier and real deletion-path proof:** `d73fce99ea53a134b7325c3f2f50f6120532bab9`
2. **Read-only bridge and review presentation:** `56885e04cc390a6f8f48bf303808313d2bfb9cba`
3. **Adversarial authority and race repair:** `88f86216576fa70ee50c4d57fafae72f67a2b73a`
4. **Successor shutdown-proof repair:** `1037c0b82f2c6a7829a4d3b9c36e6279b1db8ee8`
5. **Alias, creation-identity, parser, and deterministic-test repair:** `6d4176d14d91b0c13bbe85d91c6324f617748377`
6. **External-channel rollback repair:** `0b43c3609956d3538e2c0e7275febf5e84652958`
7. **Durable cleanup and shutdown-retry repair:** `77687d43d996fbffc934fdba348639afea519e4a`
8. **Wayland Core engine-exit authority repair:** `853ea9f76023e6d1406ae5887b92fc00c9b0529d`
9. **Wayland Core profile-release authority repair:** `78270b812e7112cb38dda2b732c092916bbebc28`
10. **Wayland Core bootstrap-lifecycle authority repair:** `19e376ad65abefb5cc63fe7a00fbe15bd38a96be`
11. **Wayland Core resume-fallback authority repair:** `10c9fb43297e0cd6a27b7653767ae6b116276687`

**Rejected predecessor:** `0b98288b02e0b65b260c7b3b1670bd5ea5b68419`

**Rejected R4 evidence candidate:** `1f0f44c8927c78b675f023ebcfeadb8591750bd5` (test-only review commit `d726723ddad93a5d00141971d1f005ef45f7e67a` proved swallowed engine-tree shutdown failure)

**Superseded repair candidate:** `0b43c3609956d3538e2c0e7275febf5e84652958` (evidence commit `0001046836e8d9e2c93fd4c1c225cfa112783f61`)

**Superseded R5 implementation candidate:** `853ea9f76023e6d1406ae5887b92fc00c9b0529d` (test-only review commit `3e7b92c8678a6cf1433567dd078593c54ffc428b` proved root exit released the profile lease before descendant-tree shutdown settled)

**Rejected R6 implementation candidate:** `78270b812e7112cb38dda2b732c092916bbebc28` (test-only review commit `f2e20764a6980f8a9341ad0ec86d2b010d3016ae` proved ready-timeout bootstrap could discard a live engine identity and release its profile without tree-exit proof)

**Rejected R7 implementation candidate:** `19e376ad65abefb5cc63fe7a00fbe15bd38a96be` (test-only review commit `ccdf82476f2a437fd71ee8d02f0d75bd8a4891a3` proved resume fallback could swallow stale-child tree-shutdown failure and spawn a replacement against the same profile)

**Repaired R8 implementation candidate:** `10c9fb43297e0cd6a27b7653767ae6b116276687`

**R8 source tree:** `f77df6e7eb3c4fcb4b50dec76d20af2b5cbc2525`

**Acceptance state:** pending independent successor re-audit; no acceptance claim is made here.

## Decisions Made

- Authority evidence is complete only when every required source has an exact recognized value and no unknown source is present.
- A review candidate remains informational: it is not a deletion, pruning, or quarantine instruction.
- Current Node filesystem observation cannot safely establish an immutable empty-directory snapshot, so current candidates remain preserved.
- The preview IPC accepts no renderer request object because the main process owns the canonical workspace root and classification evidence.
- The database transaction, not a bridge snapshot, is authoritative for channel-cleanup eligibility and captured session identity.
- Cleanup is at-least-once until durable retirement; repeated external context clear and absent local sessions are treated idempotently.
- A failed kill does not authorize a successor or discard the original lease, but it does permit a later shutdown attempt against that same identity.
- Wayland Core shutdown is two-stage authority: root exit alone cannot clear a latched process-tree failure, while a transient pre-exit failure can retry the same child identity and clear authority only after proof succeeds.
- Root exit does not own profile release. The profile lease remains held until the exact manager kill proves the complete engine tree stopped; deferred failure preserves both manager and lease for identity-bound retry.
- Bootstrap completion does not own profile release. Start success, start rejection, concurrent disposal, and already-stopped identities all converge on the same tree-proof authority; cleanup failure keeps the exact identity and lease retryable.
- Resume fallback does not own replacement authority until the exact stale child tree is proved stopped. Failure retains that child and profile, forbids a successor spawn, and restricts later progress to a retry bound to the retained identity.

## Deviations from Plan

The independent audits reopened the plan nine times. Repairs added creation provenance, immutable-snapshot fail-closed behavior, terminating-process leases, total IPC parsing, canonical authority ordering, contradictory-duplicate rejection, human-readable active-work labels, production service/repository deletion proof, callback-time successor draining, fail-closed process-tree enumeration, deterministic idle-rejection observation, canonical alias correlation, creation-time object identity, impossible phase-1 evidence rejection, deterministic Constitution recovery observation, post-commit external-channel cleanup ordering, durable restart replay, transaction-authoritative cleanup identity, identity-bound shutdown retry, observable Wayland Core engine-tree failure, exact profile-release authority after complete tree proof, bootstrap-lifecycle tree-proof convergence, and fail-closed resume fallback bound to the exact stale child identity. These changes enforce the plan's authority boundary without expanding lifecycle authority.

## Issues Encountered

The complete suite emitted pre-existing non-failing jsdom canvas, listener-count, and nested mock warnings outside this plan's owned files. All required gates completed successfully.

## Explicit Non-Claim

Managed-workspace lifecycle mutation (quarantine, restore, keep, delete, prune) is not delivered.

## Self-Check

R8 BUILDER CONSTRUCTION PROOF PASSED; aggregate proof and independent successor re-audit remain required. The repaired implementation passed 286 focused Vitest tests, 2 focused Bun-native hostile tests, typecheck, and scoped formatting. Changed-file lint passed with zero warnings and zero errors across the two R8 implementation/test files. No lifecycle mutation authority was added.

## Retained Construction Evidence

The in-progress SHA-bound receipts are under `.planning/phases/WLD-01-safety-foundation/evidence/01-08-r8-10c9fb43/`. These receipts retain sanitized command output, timestamp, environment identity, exact implementation commit/tree, and exit code. Secret-shaped values are passed through the command-secret redactor to a fixed point before retention. These are builder receipts, not independent acceptance evidence. Final hashes and aggregate counts will be sealed only after the reserved aggregate slot is available.

| Receipt                     | State                                  | SHA-256                                                            |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `00-environment.log`        | captured                               | `854b4ecf7b84527f48a997279e63eb8c550b07baafa4fab2cf887fab3fe694c3` |
| `01-focused-vitest.log`     | pass: 23 files / 286 tests             | `f039df8c445b00e7538e7ff0e2c8e2120444fb39f7225ce81d8ff6961ee92741` |
| `02-bun-native-intent.log`  | pass: 2 tests                          | `3ed7c41d19b6843a144dd1674ef068067103f09831cc0570e270d38d0924a881` |
| `03-typecheck.log`          | pass                                   | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| `04-scoped-lint.log`        | pass: 0 warnings / 0 errors            | `d9820f4e34cb74db3bd45d5c62c9a77abc93ebe8200b68fd62677b32c89aff0f` |
| `05-scoped-format.log`      | pass                                   | `f8ac3ba7a49895222422c86775b0ee2f10b0d79d6664e92596e126f5d2ac77ff` |
| `06-full-aggregate.log`     | pending one isolated authoritative run | pending                                                            |
| `07-invariants.log`         | pass                                   | `2e14fffb14e3f496f9280031b3a7ee2a5557a655385bfc25c178e8ed40668ade` |

---

_Phase: WLD-01-safety-foundation_  
_Plan: 08_  
_Completed: 2026-07-20_
