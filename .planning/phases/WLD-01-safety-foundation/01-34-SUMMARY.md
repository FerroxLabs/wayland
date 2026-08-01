---
phase: WLD-01-safety-foundation
plan: 34
status: complete
evidence_model: local-production-composition-integration-and-e2e-proof
requirements: [SAF-02, SAF-05]
---

# Plan 01-34 Summary: Prove the complete locally constructed Classic instrumentation

## Delivered

Two proofs exercise the whole Classic instrumentation corpus through the real
process-owned graph — never a spy, never a live observation:

    work / incident authorities + signed usability ingestor
      -> CohortJourneyObserver
        -> CohortBaselineService.record
          -> durable LocalM0BCohortEventRepository (on disk)
            -> CohortBaselineService.aggregate -> aggregateM0BBaseline

The 14-day window is fixed and every timestamp is deterministic, so the corpus
is constructed locally without starting a real observation.

### Integration proof — `tests/integration/cohort/classicProductionInstrumentation.test.ts`

Ten focused scenarios, each building the real object graph on a durable temp
repository and asserting exact denominators/terminals:

- All five primary journeys (`chat.first-response`, `project.resume`,
  `cowork.create-artifact`, `developer.modify-and-verify`,
  `operator.run-automation`) emit exactly one closed start/complete pair each.
- Normal, crash, and failed terminals produce distinct denominators and a
  correct crash-free session rate.
- Unresolved work is counted, never terminalized.
- Authenticated signed `support_contact` and `accessibility_violation`
  incidents surface once each and never re-mint on re-drain; an empty inbox
  fabricates nothing.
- A mapped `zero_tolerance_stop` trips the automatic-stop gate and blocks the
  decision; a benign user stop mints nothing.
- Duplicate automation terminals are ignored (counted once); an exact duplicate
  event collapses and a conflicting event id is contract-rejected at
  aggregation.
- A content-bearing field is rejected at the process boundary
  (`forbidden_field`) and never stored or aggregated.
- A cold restart (new repository + service over the same durable directory)
  reproduces the report and mints nothing new.

### E2E proof — `tests/e2e/specs/cohort/classic-observation.e2e.ts`

One whole-corpus construction test: five real Classic sessions across all four
cohorts (four work journeys, a completed / a failed / an unresolved automation
run, normal + crash + incomplete session terminals, a zero-tolerance stop, and
signed support + accessibility incidents) built into a durable on-disk
repository, then aggregated after a cold restart. Asserts exact totals
(9 journey starts, 7 completed, 1 failed, 1 unresolved; 5 sessions, 2 ended,
1 crashed, 2 incomplete; 1 support, 1 accessibility, 1 zero-tolerance stop),
exact per-journey denominators, `dataQualityPass = true` with zero privacy /
contract rejections, and honest gate truth (`automaticStopTriggered = true`,
`readyForDecision = false`).

## Gate

- `bun run lint -- tests/integration/cohort/classicProductionInstrumentation.test.ts tests/e2e/specs/cohort/classic-observation.e2e.ts` — 0 warnings, 0 errors.
- `GSD_RUNTIME=codex bunx vitest run tests/integration/cohort/classicProductionInstrumentation.test.ts` — 10 passed.
- `bunx playwright test tests/e2e/specs/cohort/classic-observation.e2e.ts --config playwright.config.ts` — 1 passed.
- `bun run typecheck` — clean.
- `bun run test` — 15721 passed, 151 skipped. Three unrelated suites
  (`mcpAgentConsumption`, `m0bUsabilityProtocol`, `constitutionFsTransaction`)
  timed out under full-suite load; all pass in isolation / with timeout
  headroom. They spawn subprocesses or compile helpers and are untouched by this
  plan, which adds only the two test files above.

## Success criteria

Local production instrumentation is complete enough to submit to 01-26: every
required journey, terminal, denominator, privacy rejection, and stop condition
traverses its real production path with deterministic results.
