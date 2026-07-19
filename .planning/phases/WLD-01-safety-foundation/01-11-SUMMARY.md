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
- Probe and refresh writes use compare-and-set semantics so a concurrent declaration edit wins and stale results are discarded.
- Detection/synchronization fails closed on partial backend observations and canonical identity collisions instead of returning a misleading successful subset.
- Preserved legacy `connected` only as probe-reachable compatibility display data; it does not mint ACP publication, ToolSearch, or current-chat readiness.

## Exact construction proof

- Focused plan suite: 5 files, 58 tests passed.
- Targeted full-gate regressions: 3 files, 15 tests passed.
- Typecheck: passed.
- MCP catalog validation: passed.
- Changed-file oxlint with `--deny-warnings`: 0 warnings, 0 errors.
- Scoped plan lint: 0 errors; 24 pre-existing warnings in unchanged MCP agent/message-queue files.
- Oxfmt and `git diff --check`: passed.
- Exact aggregate `bun run test`: 1,430 Vitest files passed, 21 skipped; 15,144 tests passed, 145 skipped; 226/226 Bun-native tests passed.

## Authority boundary

This packet does not claim live ACP `McpConfig` publication, active-session registration, ToolSearch visibility, persistent MCP lifecycle, real credential canaries, or chat readiness. Those remain owned by 01-35, 01-36, and 01-29.

## Deviations from plan

Three existing full-gate regression suites were added to ownership because the stricter result contract required their mocks and expectations to represent process-authored pre-publication evidence. No production authority was widened.

## Acceptance state

The exact commit containing this summary must be independently audited. Until that successor is accepted and serially integrated, plan 01-11 remains constructed rather than accepted.

