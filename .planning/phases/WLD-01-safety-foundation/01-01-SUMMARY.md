---
phase: WLD-01-safety-foundation
plan: 01
subsystem: cohort-authority
tags: [cohort, ipc, persistence, fail-closed, hostile-testing, i18n]
requires: [01-40]
provides:
  - Process-owned closed cohort classification with versioned persistence
  - Fail-closed assignment and consent reconciliation
  - Hostile IPC and renderer projection proof across all settings locales
affects: [WLD-01-safety-foundation]
tech-stack:
  added: []
  patterns: [main-process authority, exact-schema parsing, immutable observation assignment]
key-files:
  created:
    - tests/unit/cohortPreloadBridge.test.ts
  modified:
    - src/process/services/cohort/ProductionCohortController.ts
    - src/process/bridge/cohortBridge.ts
    - src/preload/main.ts
    - src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx
key-decisions:
  - "The renderer may request a closed cohort but only the main process mints and persists the effective assignment."
  - "Once an observation window has ever started, withdrawal does not unlock relabeling."
  - "Malformed, missing, unknown-version, partial, or contradictory persistence disables observation."
requirements-completed: []
requirements-addressed: [SAF-02]
coverage:
  - id: D1
    description: "Exactly one process-owned cohort assignment survives restart and the recognized v1 migration."
    requirement: SAF-02
    verification:
      - kind: unit
        ref: "ProductionCohortController.test.ts (20/20 pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Renderer, IPC, and preload inputs cannot mint or alter the effective cohort after observation begins."
    requirement: SAF-02
    verification:
      - kind: unit
        ref: "combined cohort bridge/preload/renderer gate (31/31 pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The implementation passes generated i18n, static analysis, and the complete Desktop test suite."
    requirement: SAF-02
    verification:
      - kind: integration
        ref: "bun run test at dbef48a1dfa435fc7f18ed9e063065ee81555580 (15257 Vitest + 226 Bun-native pass)"
        status: pass
      - kind: other
        ref: "typecheck and scoped oxlint (0 warnings, 0 errors)"
        status: pass
    human_judgment: false
completed: 2026-07-19
status: complete
---

# Phase 1 Plan 01: Process-Owned Cohort Authority Summary

**The hard-coded production cohort is gone. A closed, persisted main-process classification now owns the effective cohort and fails closed under hostile persistence, IPC, and renderer input.**

## Accepted Candidate

- **Implementation commit:** `dbef48a1dfa435fc7f18ed9e063065ee81555580`
- **Source tree:** `73286ab8d04f802c6db444fe906634fe8090903d`
- **Changed-path manifest SHA-256:** `d125bdfac9bc5506713bbb702aad9333f05b1b34a1413b78380f732c7c648249`
- **Baseline:** `3bc531efa97d3a66e60bd2ced9e202002dc5a4d4`

## Accomplishments

- Replaced the production `knowledge-work` hard-code with four closed cohort values and a versioned process-owned assignment record.
- Added exact-schema parsing, one explicit v1 migration, consent/assignment reconciliation, stable restart identity, and fail-closed handling for malformed or contradictory state.
- Preserved the original assignment and window after consent withdrawal and rejected relabeling both during and after that window.
- Added narrow assignment IPC/preload methods and made the renderer display only the main-process acknowledgement.
- Added explicit cohort and observation language to all 12 settings locales and regenerated the typed key surface.
- Added hostile controller, bridge, preload, and DOM tests for forged projections, invalid requests, persistence failures, and relabel attacks.

## Proof Receipts

| Command | Exit | Result |
|---|---:|---|
| `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/cohort/ProductionCohortController.test.ts` | 0 | 1 file, 20/20 tests passed |
| `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/cohort/ProductionCohortController.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx` | 0 | 4 files, 31/31 tests passed |
| `bun run i18n:types` | 0 | Typed key file regenerated |
| `node scripts/check-i18n.js` | 0 | Cohort keys present in all 12 locales; pre-existing global missing-key warnings remain |
| `bun run typecheck` | 0 | TypeScript clean |
| `bun run lint -- <plan-owned paths>` | 0 | 25 files, 0 warnings, 0 errors |
| `bun run test` | 0 | 1,443 Vitest files and 15,257 tests passed; 226/226 Bun-native tests passed |
| `git diff --check` | 0 | No whitespace errors |

## Non-Claims

- This is implementation evidence for Plan 01-01 only; it does not accept SAF-02, Phase 1, packaging, release, deployment, or live cohort observation.
- No observation was started and no production user state was migrated by this worktree.
- The existing 14-calendar-day Classic observation and signed `M0B.json` remain separate acceptance gates.

## Next Readiness

Plan 01-01 is ready for serial integration. The remaining Phase 1 instrumentation and observation prerequisites remain open.

---
*Phase: WLD-01-safety-foundation*  
*Plan: 01*  
*Completed: 2026-07-19*
