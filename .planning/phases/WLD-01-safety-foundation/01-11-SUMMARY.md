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
completed: 2026-07-19
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

- Focused plan suite: 10 files, 86 tests passed.
- Durable renderer queue and CRUD hostile subset: 3 files, 27 tests passed.
- Typecheck: passed.
- MCP catalog validation: passed.
- Changed-file oxlint: 0 warnings, 0 errors.
- Scoped plan lint: 0 errors; 24 pre-existing warnings in unchanged MCP agent/message-queue files.
- Oxfmt and `git diff --check`: passed.
- The first aggregate attempt exposed an unrelated 30-second timeout ceiling in the production-strength 256 MiB Argon2 correctness vector. That test was corrected to use a 90-second correctness timeout; the repaired vector is 2/2 green in 70.36 seconds. A fresh exact aggregate run remains required before independent acceptance.

## Authority boundary

This packet does not claim live ACP `McpConfig` publication, active-session registration, ToolSearch visibility, persistent MCP lifecycle, real credential canaries, or chat readiness. Those remain owned by 01-35, 01-36, and 01-29.

## Deviations from plan

Three existing full-gate regression suites were added to ownership because the stricter result contract required their mocks and expectations to represent process-authored pre-publication evidence. The shared MCP state hook was brought into scope when adversarial review proved its optimistic persistence and per-instance mutation queues could manufacture unsaved UI state and lost updates. The Argon2 correctness-vector timeout was also corrected after the exact aggregate gate reproduced its invalid latency assumption. No production authority was widened.

## Acceptance state

The exact commit containing this summary must be independently audited. Until that successor is accepted and serially integrated, plan 01-11 remains constructed rather than accepted.
