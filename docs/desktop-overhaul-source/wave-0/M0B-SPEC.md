# M0B — Cohort authority

## Outcome

Rollout decisions compare Cockpit with a measured Classic baseline instead of intuition or vanity telemetry.

## Required implementation

1. Begin a 14-calendar-day rolling Classic baseline on Day 0.
2. Define primary journeys, denominators, success/failure semantics, crash-free sessions, latency, accessibility, support burden, and return-to-Classic reasons.
3. Support opt-in local aggregation or structured cohort UAT without collecting prompt/file contents.
4. Separate novice, knowledge-work, developer, and operator cohorts.
5. Publish threshold, minimum sample/soak, automatic stop, and named decision-owner fields.

## Verification

Fixture events prove aggregation, denominator handling, privacy filtering, cohort separation, and zero-tolerance stops. Invited alpha remains technically disabled until the signed M0B receipt exists.

## Receipt fields

Observation window, app version, cohort/sample counts, metric definitions, thresholds, privacy mode, decision owner, exact commands, and unresolved limitations.

## Current implementation status

Engineering candidate only; the observation has not started.

> **Current-baseline supersession (2026-07-19):** The implementation bullets
> below describe the original candidate, but the closing claim that production
> wiring and consent/visibility UI are absent is stale at baseline
> `6d41c34087b5f40a368c83ca18d2d8e5a7fdb894`. Those surfaces now exist. Phase 1
> planning must use `.planning/intel/PHASE-1-IMPLEMENTATION-RECON.md` as the
> current-state reconciliation. The remaining blockers are the hard-coded
> `knowledge-work` cohort, missing Classic/five-journey/crash/support/
> accessibility/zero-tolerance instrumentation, the real 14-calendar-day
> observation, and a signed `M0B.json`. Existing wiring must be verified, not
> rebuilt merely because this historical section once listed it as absent.

- `src/process/services/cohort/types.ts` defines a closed schema for four cohorts, two shells, five primary journeys, support/accessibility/return reason enums, and the five zero-tolerance stop classes.
- `src/process/services/cohort/privacy.ts` rejects unknown fields and every prompt, message, content, file/path, URL, tool-argument, command, query, credential, secret, and freeform metadata field. It never silently strips them.
- `src/process/services/cohort/CohortBaselineAggregator.ts` deterministically validates event identity and lifecycle, deduplicates identical events, fails data quality on conflicting events, keeps incomplete sessions and unresolved journeys visible, and reports p50/p95 terminal latency.
- `src/process/services/cohort/CohortBaselineService.ts` is the consent gate: disabled means no write, invalid or out-of-window events never reach storage, persistence failure is explicit, and its only export surface is an identifier-free aggregate report.
- `src/process/services/cohort/policy.ts` publishes the unsigned defaults: 20 total participants, 5 per cohort, 10 starts per primary journey, Sean Donahoe as decision owner, and invited alpha disabled.
- `tests/unit/process/services/cohort/CohortBaselineAggregator.test.ts` provides malformed, privacy-leaking, conflicting, incomplete, crash, lifecycle, signature, cohort, denominator, and stop fixtures.

This candidate intentionally does not reuse generic `usage_events.metadata_json`,
which permits arbitrary metadata and therefore cannot be cohort authority.
The actual 14-day Classic observation and a signed `M0B.json` remain open. See
the supersession note above for the current engineering blockers.
