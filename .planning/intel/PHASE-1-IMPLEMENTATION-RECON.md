# Phase 1 Implementation Recon

**Baseline:** `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894`  
**Reconciled:** 2026-07-19  
**Authority rule:** current code and exact proof outrank historical execution prose.

## M0B Current State Correction

The historical Wave 0 ledger in
`docs/desktop-overhaul-source/wave-0/EXECUTION.md` says production repository
wiring and consent/visibility UI are absent. That statement is stale for the
current baseline:

- `src/process/bridge/index.ts` constructs and registers the production cohort
  controller.
- `src/process/services/cohort/ProductionCohortController.ts` owns persisted
  consent, the 14-day window, local evidence storage, and runtime replacement.
- `src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx`
  exposes explicit consent and current-window visibility.
- Unit tests exercise the controller, bridge, and renderer consent surface.

The current release-blocking defect is narrower and more serious: production
composition hard-codes `cohort: 'knowledge-work'`. The M0B contract defines the
closed set `novice`, `knowledge-work`, `developer`, and `operator`, but the
process has no persisted authoritative participant assignment. Beginning the
observation now would misclassify three required cohorts and invalidate the
cohort table.

## First Executable Phase 1 Slice

1. Define one versioned, closed cohort-assignment record owned and validated by
   the main process. The renderer may request a choice but may not forge the
   effective assignment.
2. Persist the assignment with consent/window state and bind every event and
   rollout-authorization check to that process-authoritative value.
3. Fail closed on missing, malformed, unknown, or renderer-forged assignments.
   A cohort change during an active window must not silently relabel existing
   evidence; it requires an explicit reset/new window or is rejected.
4. Make the effective cohort and its consequence understandable beside consent
   before evidence collection starts.
5. Prove fresh install, restart persistence, consent enable/revoke, all four
   valid cohorts, malformed stored state, missing state, changed-mid-window,
   and forged IPC cases through focused main/bridge/renderer tests.
6. Only after that proof is green may the real 14-calendar-day Classic
   observation begin. Its cohort table, usability protocol, thresholds,
   denominators, sample/soak minimums, and decision owner must then be signed in
   `M0B.json`.

## M0B Day-0 Instrumentation Gap

The current production runtime is not yet capable of producing a valid Classic
baseline. `CohortEvidenceRuntime` records only Cockpit `session_started`,
`session_ended`, and `shell_returned_to_classic`, and its base event fixes
`shell: 'cockpit'`. The contract and aggregator recognize more events, but
recognition is not production instrumentation.

Before Day 0, a separate plan must provide a process-owned Classic or accepted
structured-UAT path for:

- session start, normal end, and crash;
- start plus completion/failure for all five primary journeys;
- support contact and accessibility categories;
- all zero-tolerance stop reasons; and
- stable process-owned participant, cohort, session, journey-run, shell, and
  event identity.

Renderer input is limited to closed categories or observed actions and cannot
mint identity, timestamps, authority, terminal success, or arbitrary content.
Focused hostile proof must show complete denominators, no double terminal, no
cross-shell relabeling, consent/window enforcement, and fail-closed malformed
or forged input. Cohort identity repair is necessary but does not by itself
make the observation startable.

## Non-Claims

- Existing controller, consent UI, and local aggregate storage are not rebuilt.
- Focused source tests do not complete M0B.
- Beginning the observation does not authorize invited alpha, release,
  deployment, cohort expansion, or issue closure.
- M0A engineering safety and M0B observation authority remain independent.

## C0-A Current State Boundary

Current source records substantial bounded C0-A evidence: the native
OfficeCLI `v1.0.136` contract and macOS ARM64 journeys, immutable skill checks,
provider-neutral readiness injection, Cowork authority isolation, current-host
execution with no reachable hosted fallback, and focused tests. Phase 1 must reconcile and re-prove that bounded
claim rather than silently dropping `COW-01` or calling all Cowork readiness
complete.

- C0-A terminal claim: executable/skill lockstep, authority isolation, and
  current-host-only execution with no reachable hosted fallback. Any future
  fallback requires a separately accepted explicit-consent contract.
- C0-B remains Phase 2 work after the sole shared M2 readiness schema and
  downgrade/re-upgrade authority proof exist.
- Final six-target signed application and package closure remains Phase 5/M8.

## Managed Workspace Boundary

The source-of-truth ownership contract grants Phase 1 preservation and dry-run
inventory authority only. It cannot prove that a live workspace has no output
or receipt because no complete trusted output/receipt ledger exists. Therefore:

- referenced, content-bearing, modified, scheduled, promoted, incomplete, and
  unknown workspaces are preserved;
- a provably empty abandoned shell may be classified only for later human
  review;
- Phase 1 performs no quarantine, pruning, or deletion; and
- the human-reviewed quarantine/restore/delete lifecycle is retained as queued
  `WSLX-01`, after the trusted ledger prerequisite is accepted.
