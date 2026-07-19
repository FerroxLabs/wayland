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

- Exact R7 repair implementation commit: `1cef5ffb0a5d9bbc1319544bbcbeb167398795ea`.
- Exact R7 repair implementation tree: `a56ee55e8d8192a0ec218d29d3244da34aff571d`.
- Executable hostile-test parent: `1d61bae52fb1fb3c8b5dceebc683d17ae0eb9c9d`.
- Focused repair suite: 16 files, 158 tests passed in three deterministic resource-isolated shards.
- Typecheck: passed.
- Changed-file oxlint: 0 warnings, 0 errors.
- Oxfmt and `git diff --check`: passed.
- Exact bounded-worker aggregate: 1,434 Vitest files passed and 21 skipped; 15,205 tests passed and 145 skipped. Bun-native aggregate: 226 passed, 0 failed.
- Sanitized retained command logs and their SHA-256 digests are recorded in `evidence/01-11-r7-1cef5ffb/RECEIPT.md`.
- The first successor aggregate attempt exposed one stale Concierge test double that still expected the retired direct MCP setter. The test was migrated to the atomic authority, the add-name invariant was moved inside the atomic mutation, and the exact aggregate was rerun successfully from a clean implementation commit.

## Successor repair details

- Failed-probe reconciliation now compares the winner's exact adapter key, not
  only its canonical collision key. A case-only replacement removes the
  restored old spelling before publishing the durable winner, preventing
  case-sensitive agents from retaining two live definitions.
- Stateful adapter tests cover partial initial removal, restoration, exact-key
  cleanup, case-only replacement, true rename, concurrent disabled/deleted
  winners, and fail-closed divergence when cleanup itself fails.

- Failed-probe publication cleanup now treats the durable status commit as an explicit applied/conflict/error outcome. A successful or partial adapter revocation that loses its durable CAS reconciles the exact main-process winner rather than silently returning.
- The reconciliation outcome matrix covers adapter revocation success/restoration, CAS win/loss, and concurrent enabled, disabled, deleted, renamed, and canonical case-fold replacement declarations. Exact enabled winners are republished, disabled/deleted winners remain absent, renamed winners first revoke the stale key, and any failed reconciliation persists the shared publication-divergence marker.
- A rejected status write performs an authoritative queued read before reconciliation; it cannot interpret missing callback state as a deleted connector.
- The shared reconciliation writer is used by both toggle compensation and failed-probe compensation so delete/recreation/canonical-replacement behavior cannot drift between paths.

- A publication whose durable compare-and-set loses to a concurrent edit can no
  longer disappear behind ordinary disabled state when adapter compensation
  also fails. The winning durable row is retained and marked as unresolved
  publication divergence without overwriting its concurrent fields.
- If the declaration was concurrently deleted, R5 recreates only a disabled
  error-state reconciliation handle. If a canonical replacement won, that row
  is marked instead of creating a case-only duplicate. Passive and direct probe
  paths continue to withhold until explicit reconnect republishes successfully.

- Neither a passive nor a direct standalone probe can erase an unresolved publication-divergence marker. Explicit reconnect republishes first and probes the exact declaration revision returned by that publication commit, never a later inferred storage revision.
- Reconciliation error truncation reserves independent space for the publication-divergence marker, so an arbitrarily long provider error cannot hide the required reconnect state.
- Add and batch import bind their storage mutation to the exact declaration revision observed before publication revocation; a concurrent edit wins without being overwritten.
- Concierge add stores disabled, disconnected declaration truth and rejects canonical case-only name collisions before its atomic main-process mutation.
- Archive removal and config-persistence compensation failures remain logged and are also returned as explicit rollback-publication failures rather than hiding divergence behind the first error.

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
