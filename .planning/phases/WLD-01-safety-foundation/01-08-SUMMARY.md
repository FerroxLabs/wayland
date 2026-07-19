---
phase: WLD-01-safety-foundation
plan: 08
subsystem: safety/storage/ui
tags: [workspace-retention, preservation-first, fail-closed, ipc, hostile-testing]
requires: [01-40]
provides:
  - Preservation-first managed-workspace classification
  - Read-only review-candidate inventory projection
  - Conversation deletion proof that managed workspace bytes remain unchanged
affects: [WLD-01-safety-foundation, managed-workspaces, conversation-deletion]
tech-stack:
  added: []
  patterns: [process-owned authority, malformed-evidence preservation, read-only IPC]
key-files:
  created:
    - tests/unit/conversationBridge.workspaceRetention.test.ts
  modified:
    - src/process/services/workspaceRetention.ts
    - src/process/services/managedWorkspaceInventory.ts
    - src/process/services/desktopManagedWorkspaceInventory.ts
    - src/process/bridge/conversationBridge.ts
    - src/process/bridge/workspaceRetentionBridge.ts
    - src/renderer/pages/settings/StorageSettings/ManagedWorkspacesCard.tsx
    - tests/unit/workspaceRetention.test.ts
    - tests/unit/managedWorkspaceInventory.test.ts
    - tests/unit/desktopManagedWorkspaceInventory.test.ts
    - tests/unit/process/bridge/workspaceRetentionBridge.test.ts
    - tests/unit/bridgeAllowlistWorkspaceRetention.redteam.test.ts
    - tests/unit/renderer/pages/settings/storage/ManagedWorkspacesCard.dom.test.tsx
key-decisions:
  - "Missing, malformed, raced, unreadable, incomplete, contradictory, or active evidence always preserves content."
  - "Only an exact, complete, old, empty, authority-free shell is a non-authoritative review candidate."
  - "Renderer IPC accepts no path, root, classification, mutation, legacy alias, or unknown input."
patterns-established:
  - "Classification does not grant lifecycle mutation authority."
  - "Real deletion-path tests compare exact workspace bytes before and after conversation removal."
requirements-completed: [SAF-04]
coverage:
  - id: D1
    description: "Managed workspaces are conservatively classified from complete process-owned evidence."
    requirement: SAF-04
    verification:
      - kind: unit
        ref: "focused workspace-retention suite (64/64 pass)"
        status: pass
      - kind: integration
        ref: "conversationBridge.workspaceRetention proves exact binary workspace bytes survive conversation.remove"
        status: pass
    human_judgment: false
  - id: D2
    description: "The bridge and renderer expose review-only classification without mutation authority."
    requirement: SAF-04
    verification:
      - kind: unit
        ref: "workspaceRetentionBridge, allowlist red-team, and ManagedWorkspacesCard DOM tests pass"
        status: pass
      - kind: other
        ref: "legacy quarantine aliases absent from every owned source and test path"
        status: pass
    human_judgment: false
  - id: D3
    description: "The integrated Desktop source remains green after preservation-first hardening."
    requirement: SAF-04
    verification:
      - kind: integration
        ref: "bun run test (15,260 Vitest + 226 Bun-native pass)"
        status: pass
      - kind: unit
        ref: "owned lint: 0 warnings and 0 errors; typecheck pass; oxfmt check pass"
        status: pass
    human_judgment: false
duration: 1h
completed: 2026-07-19
status: complete
---

# Phase 1 Plan 08: Preservation-First Workspace Retention Summary

**Managed workspace inspection is fail-closed and read-only, with real deletion-path proof that user bytes remain intact.**

## Performance

- **Duration:** approximately 1 hour
- **Completed:** 2026-07-19T07:08:28Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Replaced mutation-suggestive quarantine vocabulary with a non-authoritative `review-candidate` classification and removed the legacy aliases.
- Made incomplete, malformed, contradictory, unreadable, raced, invalid-date, and active-process evidence preserve by default.
- Proved through the production conversation bridge that deleting a conversation severs the database reference without altering exact managed-workspace file bytes.
- Restricted the retention IPC and renderer to read-only explanations, with hostile tests rejecting renderer-supplied roots, paths, classifications, mutation verbs, aliases, and unknown fields.

## Task Commits

1. **Conservative classifier and real deletion-path proof:** `d73fce99ea53a134b7325c3f2f50f6120532bab9`
2. **Read-only bridge and review presentation:** `56885e04cc390a6f8f48bf303808313d2bfb9cba`

**Accepted implementation commit:** `56885e04cc390a6f8f48bf303808313d2bfb9cba`  
**Accepted implementation tree:** `d63c52bb54ec5023c45668a536dcd42e1ee1a4a4`

## Decisions Made

- Authority evidence is complete only when every required source has an exact recognized value and no unknown source is present.
- A review candidate remains informational: it is not a deletion, pruning, or quarantine instruction.
- The preview IPC accepts no renderer request object because the main process owns the canonical workspace root and classification evidence.

## Deviations from Plan

The hostile loop added strict validation for malformed promotion records, producer arrays, filesystem identity races, and invalid timestamps. These changes directly enforce the plan's required fail-closed terminal claim and do not expand lifecycle authority.

## Issues Encountered

The complete suite emitted pre-existing non-failing jsdom canvas, listener-count, and nested mock warnings outside this plan's owned files. All required gates completed successfully.

## Explicit Non-Claim

Managed-workspace lifecycle mutation (quarantine, restore, keep, delete, prune) is not delivered.

## Self-Check

PASSED. The implementation, focused hostile corpus, lint, formatting, typecheck, and exact full test suite are green; no legacy quarantine alias remains in owned paths.

---
*Phase: WLD-01-safety-foundation*  
*Plan: 08*  
*Completed: 2026-07-19*
