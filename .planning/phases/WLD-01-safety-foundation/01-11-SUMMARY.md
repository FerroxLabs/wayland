---
phase: WLD-01-safety-foundation
plan: 11
subsystem: mcp
tags: [mcp, prepublication, correlation, fail-closed, probe]
requires: [01-40]
provides:
  - Closed process-authored MCP pre-publication evidence states
  - Exact saved-declaration correlation for probe results
  - Declaration-only add and import transactions
affects: [01-13, 01-29, 01-35, 01-36]
requirements-completed: []
requirements-addressed: [MCP-01, SAF-05]
status: constructed
completed: 2026-07-20
---

# Phase 1 Plan 11: MCP Pre-publication Truth Summary

MCP catalog declaration, saved configuration, authentication requirement, and standalone probe evidence are now separate fail-closed states. This is construction evidence only; independent acceptance and serial integration remain pending.

## Accomplishments

- Added a closed `wayland-mcp-prepublication/1` evidence union bound to the exact server ID, name, saved declaration revision, observation time, authentication state, probe state, and tool count.
- Rejects malformed, prototype-inherited, unknown-field, duplicate-tool, identity-mismatched, stale, future, and internally contradictory adapter evidence.
- Add and batch-import now persist disabled declarations only. Neither catalog presence nor successful persistence silently enables or publishes an MCP server.
- MCP configuration writes are serialized across renderer hook instances, read the latest durable snapshot, and publish UI state only after storage succeeds.
- Add, edit, import, toggle, probe, and refresh writes use monotonic revisions and compare-and-set semantics so a concurrent declaration edit wins and stale results are discarded.
- Adapter publication changes are transactional: partial publication is rejected and failed persistence attempts restore the previous external configuration or surface rollback failure.
- Detection/synchronization fails closed on partial backend observations and canonical identity collisions instead of returning a misleading successful subset.
- Preserved legacy `connected` only as probe-reachable compatibility display data; it does not mint ACP publication, ToolSearch, or current-chat readiness.

## Exact construction proof

- Exact repair implementation commit: `f7dd56c86f43d845145c0582087d50f74c27650e`.
- Exact repair implementation tree: `cd7abc708af457cc9ea40b1d7c91d9a77b590cf1`.
- Focused hostile repair suite: 17 files, 129 tests passed.
- Typecheck: passed.
- Scoped changed-file oxlint: 0 errors; 6 pre-existing warnings in the shared bridge declaration file.
- Oxfmt and `git diff --check`: passed.
- Exact full aggregate: 1,433 Vitest files passed and 21 skipped; 15,166 tests passed and 145 skipped. Bun-native aggregate: 226 passed, 0 failed.
- The first successor aggregate attempt exposed one stale Concierge test double that still expected the retired direct MCP setter. The test was migrated to the atomic authority, the add-name invariant was moved inside the atomic mutation, and the exact aggregate was rerun successfully from a clean implementation commit.

## Successor repair details

- Save-and-connect now re-reads the durable current declaration and commits probe evidence only against the exact current revision; stale render callbacks cannot publish or toggle a superseded definition.
- Renderer and main-process writers now share one main-process `mcp.config` read-modify-write authority. Renderer writes use retrying compare-and-set and publish only the main-confirmed snapshot; runtime main writers use serialized functional mutations.
- Every adapter operation treats a rejected multi-agent call as potentially partially applied. Add, batch, edit, enable, and disable failures compensate all affected adapters with the prior durable definition or complete revocation.
- A failed manual probe revokes an enabled external publication before recording local disabled truth. If revocation is partial or fails, the prior enabled definition is restored externally and local state remains enabled rather than claiming a false revocation.
- If both revocation and restoration fail, the durable row and user-facing error explicitly surface an incomplete publication rollback instead of discarding the external divergence.
- Atomic state writes now sync the temporary file before rename, then sync the destination file and parent directory before reporting success. Hostile ordering tests cover both asynchronous and synchronous paths.
- Archive/restore active-row mutations use compare-and-set. A race at the archive CAS republishes the winning current definition rather than the stale archived snapshot.

## Authority boundary

This packet does not claim live ACP `McpConfig` publication, active-session registration, ToolSearch visibility, persistent MCP lifecycle, real credential canaries, or chat readiness. Those remain owned by 01-35, 01-36, and 01-29.

## Deviations from plan

The ownership manifest now enumerates the complete accepted baseline delta, including the shared process authority, archive, migration, atomic durability, Concierge, settings, and corresponding test surfaces added during adversarial repair. The shared MCP state hook was brought into scope when review proved its optimistic persistence and per-instance mutation queues could manufacture unsaved UI state and lost updates. The Argon2 correctness-vector timeout was also corrected after the exact aggregate gate reproduced its invalid latency assumption. No production authority was widened.

## Acceptance state

The exact commit containing this summary must be independently audited. Until that successor is accepted and serially integrated, plan 01-11 remains constructed rather than accepted.
