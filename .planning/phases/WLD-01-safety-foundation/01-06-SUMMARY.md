---
phase: WLD-01-safety-foundation
plan: 06
subsystem: recovery
tags: [recovery, authority-inventory, fail-closed, hostile-testing]
requires: [01-40]
provides:
  - Desktop-only production capture preflight before database provisioning
  - Evidence-derived authority and policy validation for recovery dry-runs
  - Canonical destination isolation and hard-link rejection
affects: [01-18, WLD-02-migration-skeleton]
tech-stack:
  added: []
  patterns: [evidence-derived state, exact authority sets, canonical path isolation]
key-files:
  created: []
  modified:
    - src/process/services/recovery/recoveryCapture.ts
    - src/process/services/recovery/recoveryDryRun.ts
    - src/process/services/recovery/recoveryManifest.ts
    - src/process/services/recovery/stateAuthorityInventory.ts
    - tests/unit/process/services/recovery/recoveryCapture.test.ts
    - tests/unit/process/services/recovery/recoveryDryRun.test.ts
    - tests/unit/process/services/recovery/stateAuthorityInventory.test.ts
key-decisions:
  - "Production capture performs Desktop-only authority preflight before opening a schema driver or provisioning recovery authority."
  - "Dry-run authorization is derived from filesystem evidence, not caller-supplied authority states or policy claims."
  - "Core-bearing profiles remain blocked until producer-owned quiescence is implemented by plan 01-18 and accepted from issue #896."
requirements-completed: []
requirements-addressed: [SAF-01, SAF-03, SAF-05]
coverage:
  - id: D1
    description: "Every required authority is present exactly once and its claimed state matches observed evidence."
    requirement: SAF-03
    verification:
      - kind: unit
        ref: "focused recovery Vitest corpus at 6fcc65fad10e13fdbe3b906125f270775d384e4a (34/34 pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Desktop-only capture rejects Core state, destination aliases, hard links, and forged capture policies before publication."
    requirement: SAF-01
    verification:
      - kind: unit
        ref: "recoveryCapture, recoveryDryRun, and stateAuthorityInventory hostile tests"
        status: pass
      - kind: other
        ref: "TypeScript typecheck and owned-file oxlint (0 warnings, 0 errors)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The complete source tree passed aggregate tests; a later commit-bound rerun exposed one unrelated intermittent renderer assertion."
    requirement: SAF-05
    verification:
      - kind: integration
        ref: "source tree a3f1a0cfdf0938d559fba6e9034163f257b27891: 15,245 Vitest and 226 Bun-native tests passed before commit"
        status: pass
      - kind: integration
        ref: "commit-bound rerun: 15,244 Vitest passed, one ConstitutionRecovery DOM assertion failed; isolated file rerun 18/18 passed; Bun-native 226/226 passed"
        status: partial
    human_judgment: false
completed: 2026-07-19
status: complete
---

# Phase 1 Plan 06: Recovery Capture Boundary Summary

**Desktop-only recovery capture now authenticates the complete authority inventory and fails closed before touching recovery infrastructure when Core or unsafe filesystem state is present.**

## Accomplishments

- Added a production capture preflight that fixes Core quiescence capability to unavailable and rejects every Core-bearing profile before schema-driver or recovery-authority provisioning.
- Made dry-run validation recompute authority state from evidence, require the exact authority set, enforce the exact policy and logical-state mapping, and reject unknown, missing, duplicate, or caller-forged entries.
- Canonicalized source and destination roots so symlink aliases cannot place disposable output inside live state.
- Inventoried hard-link counts and rejected linked mutable state during both capture and mutation fingerprinting.
- Added hostile coverage for Core presence, forged inventories and policies, symlink aliases, and hard-link mutation risks.

## Implementation Receipt

- **Commit:** `6fcc65fad10e13fdbe3b906125f270775d384e4a`
- **Tree:** `a3f1a0cfdf0938d559fba6e9034163f257b27891`
- **Subject:** `fix(recovery): authenticate capture boundary`
- **Diff:** 7 files changed, 418 insertions, 44 deletions

## Proof

- `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/recovery/recoveryCapture.test.ts tests/unit/process/services/recovery/recoveryManifest.test.ts tests/unit/process/services/recovery/recoveryDryRun.test.ts tests/unit/process/services/recovery/stateAuthorityInventory.test.ts` — 4 files, 34/34 tests passed at the implementation commit.
- `bun run typecheck` — passed at the implementation commit.
- `bunx oxlint <eight owned source/test files>` — 0 warnings and 0 errors at the implementation commit.
- `bun run test` — the identical source tree passed 1,442 Vitest files / 15,245 tests plus 226 Bun-native tests before commit.
- A later exact-commit aggregate rerun produced one intermittent, out-of-scope failure in `tests/unit/renderer/ConstitutionRecovery.dom.test.tsx:183`; its isolated rerun passed 18/18, and the Bun-native suite passed 226/226. This is recorded as integration-suite stability debt, not represented as a green commit-bound aggregate run.

## Decisions and Boundaries

- Desktop does not infer Core consistency from timestamps, copied files, process termination, or a locally fabricated lease.
- OS-keychain state remains an external authority and is not copied into the snapshot; reconnection remains explicit.
- This plan does not implement Core lease acquisition, scope, expiry, mutation-after-lease, or release. Plan 01-18 owns those semantics and `recoveryPointBuilder.ts`.
- This plan does not claim Constitution acceptance, state transformation, six-target packaging, deployment, release, or cohort acceptance.

## Deviations from Plan

The implementation added canonical-path and hard-link defenses after adversarial inspection showed that lexical destination checks and ordinary file digests did not exclude aliases to live mutable state. These changes remain inside the declared recovery-capture authority boundary.

## Remaining Blockers

- Core-bearing recovery remains deliberately unavailable until issue #896 is accepted, pinned, and consumed by plan 01-18.
- The aggregate `ConstitutionRecovery` DOM timing failure must be stabilized or shown green again on the serial integration head; it is outside this plan's file ownership.

## Next Phase Readiness

The Desktop-only terminal claim is focused-proof green and ready for independent cross-review. Serial integration must re-run aggregate proof and must not promote the phase while the unrelated DOM suite is red.

---
*Phase: WLD-01-safety-foundation*  
*Plan: 06*  
*Completed: 2026-07-19*
