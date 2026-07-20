---
phase: WLD-01-safety-foundation
plan: 22
subsystem: recovery-authority-adapters
status: built
completed: 2026-07-20
requirements-addressed: [SAF-01, SAF-03, SAF-05]
build_branch: build/01-22
build_base: c5eda7b76
local_only: true
---

# Plan 01-22 Build Summary

Sealed the closed state-authority adapter ledger for Core plus two representative
non-Core backends (Gemini, ACP), keeping Desktop-owned stores separately
inventoried. Every hostile capture claim fails closed; unproven or non-resumable
backends are mechanically excluded from cohort eligibility.

## Authorities (owner / session handle / epoch / disposition)

| Adapter | Producer owner | Session/handle identity | Mutation epoch source | Resumability | Failure behavior | Cohort |
| --- | --- | --- | --- | --- | --- | --- |
| `acp.session` | acp-backend | `conversations.extra.acpSessionId` + pinned `acpWrapperVersion` (`<backend>@<version>`) | `backend-session-updated-at` (bound) | backend-session-replay (proven) | fail-closed | ELIGIBLE |
| `core.session` | wayland-core | `--resume <conversationId>`, producer-owned transcript | `producer-quiescence-lease` (unbound) | producer-quiesced (unproven) | fail-closed | EXCLUDED — deferred |
| `gemini.session` | gemini-cli | none (only `sessionMode`/model persisted; process liveness is not resumability) | none | non-resumable | degraded-read-only | EXCLUDED |

Separately inventoried Desktop storage authorities (never backend adapters,
`substitutesBackendAdapter: false`): `desktop.sqlite` (wayland.db) and
`office.artifact-workspace`.

## Deferred blocker

`core.session` carries `deferredBlocker: FerroxLabs/wayland#896`. Core session
capture is producer-quiescence dependent; the quiescence lease is not yet
accepted, so Core fails closed and cannot enter the M0A/cohort claim. This
preserves #896 rather than fabricating a Desktop-side lease.

## Ledger/runtime lockstep

`authorityAdapters.ts` binds each adapter to an authoritative runtime fact:
`ACP_SESSION_AUTHORITY` (AcpAgentManager) and `GEMINI_SESSION_AUTHORITY`
(GeminiAgentManager) are exported from the live managers; `CORE_SESSION_AUTHORITY`
is stated locally as unproven. Any drift in producer, handle source, resumability,
or proof between the ledger JSON and the managers throws at load. The ledger is
sealed with a canonical SHA-256 digest; byte drift fails closed.

## Attack surface (all fail closed)

`evaluateBackendCaptureRequest` rejects unknown producers, wrong owners, wrong
handles, generic filesystem-copy substitution, adapter self-assertion of the
validation receipt, absent/mixed/expired epochs, mutation after quiescence, and
partial roots. Non-resumable backends degrade (read-only); unproven Core defers
to its blocker. `parseStateAuthorityLedger` additionally rejects unknown/duplicate
adapters, missing fields, silent widening of `cohortEligible`, contradictory
failure behavior, and storage-authority substitution.

## Proof

- Focused: `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/recovery/authority/authorityAdapters.test.ts tests/integration/recovery/recoveryBackendAuthorityAdapters.test.ts` -> 33/33 pass.
- `bun run typecheck` clean.
- `bun run lint --` on the five named files: 0 warnings, 0 errors.
- Full `bun run test`: the packet's suites pass. The only red is a small set of
  pre-existing, parallel-load flakes that do not import this packet's modules
  (renderer DOM `waitFor` timeouts, cohort m0b, provider-readiness) plus
  `tests/integration/mcpAgentConsumption.test.ts`, which reproduces the identical
  `MCP fixture timeout: initialize` on the untouched baseline c5eda7b76 (verified
  in the pinned integration worktree). None are caused by this additive packet.

## Non-claims

Local-only. Not pushed, not merged to main, not released, not deployed, no canary
promotion, no issue closure. #896 remains an open, deferred Core blocker.
