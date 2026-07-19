---
phase: WLD-01-safety-foundation
plan: 06
subsystem: recovery
tags: [recovery, filesystem-authority, sqlite-snapshot, fail-closed, hostile-testing]
requires: [01-40]
provides:
  - Exhaustive bounded Constitution namespace inventory with explicit Core ownership exclusion
  - One identity-pinned SQLite connection for schema discovery and application-consistent capture
  - Byte-bound post-capture verification that defeats equal-epoch ABA mutation
  - Exact-field validation for current v3 recovery manifests
affects: [01-18, WLD-02-migration-skeleton]
tech-stack:
  added: []
  patterns: [descriptor-relative capture, source-byte binding, fail-closed manifest parsing]
key-files:
  created:
    - .planning/phases/WLD-01-safety-foundation/evidence/01-06-56682b2c/receipt.json
    - .planning/phases/WLD-01-safety-foundation/evidence/01-06-56682b2c/environment.json
    - .planning/phases/WLD-01-safety-foundation/evidence/01-06-56682b2c/audit-reproduction.log
  modified:
    - src/process/services/recovery/recoveryCapture.ts
    - src/process/services/recovery/recoveryDryRun.ts
    - src/process/services/recovery/recoveryManifest.ts
    - src/process/services/recovery/recoveryPointBuilder.ts
    - src/process/services/recovery/stateAuthorityInventory.ts
    - tests/unit/process/services/recovery/recoveryCapture.test.ts
    - tests/unit/process/services/recovery/recoveryManifest.test.ts
    - tests/unit/process/services/recovery/recoveryPointBuilder.test.ts
    - tests/unit/process/services/recovery/stateAuthorityInventory.test.ts
key-decisions:
  - 'Production Constitution discovery is rooted at ~/.wayland; Core profiles are an explicit nested producer-owned exclusion.'
  - 'Schema discovery and SQLite snapshot bytes must come from the same identity-pinned driver connection.'
  - 'Start/end epoch equality is necessary but insufficient; every admitted non-database source byte set is rebound after capture.'
  - 'Current v3 manifests reject undeclared fields recursively while genuine v1/v2 compatibility remains unchanged.'
  - 'Any intentional external-authority provisioning invalidates the admission inventory; capture rebuilds and seals the complete authority plan afterward.'
  - 'Every epoch read revalidates both source content and the exact authoritative capture-plan identity before publication.'
requirements-completed: []
requirements-addressed: [SAF-01, SAF-03, SAF-05]
completed: 2026-07-20
status: constructed
---

# Phase 1 Plan 06: Recovery Capture Boundary Summary

The first successor repaired four HIGH and two MEDIUM findings from the original rejected candidate, but independent audit then found a further HIGH: external recovery-authority provisioning happened after inventory admission, so the builder could publish a snapshot that omitted the newly created authority. The repaired successor rebuilds the exact post-provision inventory and fails closed if the capture plan changes before publication. This remains a construction receipt, not an independent acceptance or integration claim.

## Implemented

- Corrected the production Constitution root from the parent of Core profiles to `~/.wayland`.
- Added deterministic, bounded, recursive inventory of every Constitution namespace entry. Known Constitution paths must have the expected filesystem topology; unknown, symlinked, special, unreadable, hard-linked, and truncated state fails closed. The exact nested `profiles` root is explicitly excluded as producer-owned Core state and is not double-traversed.
- Kept one SQLite driver alive from strict schema discovery through online snapshot creation. Path identity, unique-link regular-file status, schema, single consumption, and pre/post snapshot identity are checked against that connection.
- Bound the in-memory SQLite image's reported schema to the schema read from the pinned connection and wipe mismatched bytes before failure.
- Revisited every admitted non-database source after capture and compared exact path sets and SHA-256 byte digests, closing the equal-epoch A-to-B-to-A mutation gap.
- Made descriptor reads positional so reused admitted file handles always verify from byte zero.
- Added recursive exact-key allowlists for every current-v3 manifest object boundary while preserving genuine v1/v2 compatibility.
- Added hostile proofs for the corrected production root, unknown and unsafe Constitution entries, wrong topology, SQLite pathname replacement, cross-schema snapshot substitution, equal-epoch ABA mutation, and undeclared nested manifest fields.
- Re-inventories and re-admits all authority roots after optional external recovery-authority provisioning, then passes only that post-provision inventory to the builder.
- Seals a deterministic capture-plan identity that excludes observation time but includes the complete authority disposition and source metadata; both epoch reads re-inventory and compare it before accepting source-content fingerprints.
- Added executable regressions for post-provision authority omission, recognized-authority creation after final admission, and mutation of a newly provisioned authority during capture. Every hostile failure leaves the destination unpublished.

## Exact Construction Receipt

- **Rejected evidence successor:** `8e7c5c4f9951939e1512548e21bfcb3f8ffb5d5b` / tree `397bdb004809c1367df9301f2050104db36d2de9`
- **Rejected implementation:** `77b832f8b6cf48ab905c11270706e279f38b7133` / tree `d226aa371528b91e53175fc70683401c8a1cf4d0`
- **Executable audit reproduction:** `0012150f41610b3feb3545ceee7c9a8773f106f7` / tree `16a06fbc81890e9390db3806fbfb6ebcaba88c2c`
- **Repaired implementation:** `56682b2cfd051ed5757d7af9bbcaef4f6170809f` / tree `6c9f130c20674bd3a9feba2d7adc0e3d5b92417c`
- **Environment:** Bun `1.3.11`; Node `v25.8.1`; Git `2.50.1`; macOS `26.3` build `25D125`; Darwin `25.3.0`; `arm64`
- **Environment manifest digest:** `sha256:e6b6a502e68933e790aa165d23113c6866f4873a12eb8797e978e942c20b4c3e`
- **Machine-readable construction receipt:** `.planning/phases/WLD-01-safety-foundation/evidence/01-06-56682b2c/receipt.json`

| Gate                 | Exact command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Exit | Result                                                                                                      | Log SHA-256                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Audit reproduction   | `rtk bun run test:vitest -- tests/unit/process/services/recovery/recoveryCapture.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |    1 | Rejected candidate omitted the newly provisioned authority: 1 failed, 18 passed.                            | `8206179a7b1f6ab02c6bf9366195ea7a8f0ffe834d206a817130e74be222b082` |
| Focused              | `rtk bun run test:vitest -- tests/unit/process/services/recovery/recoveryCapture.test.ts tests/unit/process/services/recovery/recoveryManifest.test.ts tests/unit/process/services/recovery/recoveryDryRun.test.ts tests/unit/process/services/recovery/recoveryPointBuilder.test.ts tests/unit/process/services/recovery/stateAuthorityInventory.test.ts`                                                                                                                                                                                                |    0 | 5 files; 83 passed, 3 skipped.                                                                              | `962f513641e091b857f54a08c982ab6b021cb120ee89254e9e68b163f0ccf017` |
| Successor-owned lint | `rtk bun run lint -- src/process/services/recovery/recoveryCapture.ts src/process/services/recovery/recoveryDryRun.ts src/process/services/recovery/recoveryManifest.ts src/process/services/recovery/recoveryPointBuilder.ts src/process/services/recovery/stateAuthorityInventory.ts tests/unit/process/services/recovery/recoveryCapture.test.ts tests/unit/process/services/recovery/recoveryManifest.test.ts tests/unit/process/services/recovery/recoveryPointBuilder.test.ts tests/unit/process/services/recovery/stateAuthorityInventory.test.ts` |    0 | 0 warnings, 0 errors across 9 files.                                                                        | `830234ba276f827a2a4ab5a799d0ca55ffcc3152863aea8794b50f1dd6393978` |
| Format               | `rtk bunx prettier --check src/process/services/recovery/recoveryCapture.ts tests/unit/process/services/recovery/recoveryCapture.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                 |    0 | Both repaired files conform.                                                                                | `dd3b3794bdefd6c9ae406fda5f1dc989958852ccef6d414855944e9cf768eddc` |
| Diff check           | `rtk git diff --check 8e7c5c4f9951939e1512548e21bfcb3f8ffb5d5b..56682b2cfd051ed5757d7af9bbcaef4f6170809f`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |    0 | Clean.                                                                                                      | `ab98a6c7258c1cc05aa792a7a94d812bd25c4fee505a7e1625c29c7848b32221` |
| Aggregate            | `rtk bun run test`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |    0 | Vitest: 1,430 files passed, 21 skipped; 15,171 tests passed, 149 skipped. Bun-native: 229 passed, 0 failed. | `d287b705907baf7e730eb61d7f13ef19c63929cee3591b2a1cab0eefd087cc81` |
| Typecheck            | `rtk bun run typecheck`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    0 | TypeScript completed with no errors.                                                                        | `9a50f847892069844c9724f0df5e37b90009ef5d35a160446019f709ef4887df` |

Every listed log, the deterministic environment manifest, and the machine-readable receipt are committed under the evidence root. The receipt binds exact source commit/tree, command, timestamps, exit code, log digest, repair ownership, lineage, and non-claims.

## Boundaries and Non-Claims

- This summary does not independently accept plan 01-06 and does not authorize integration, merge, release, deployment, or issue closure.
- Core lease acquisition, expiry, mutation-after-lease, and release semantics remain owned by plan 01-18 and issue #896.
- Darwin and Windows production capture remain deliberately unavailable until an identity-bound native filesystem primitive is implemented and target-proven.
- Six-target packaging, deployment, canary, rollback, and release acceptance remain outside this plan.

## Next Gate

An independent auditor must attack implementation commit `56682b2cfd051ed5757d7af9bbcaef4f6170809f` and verify the committed receipt/log digests. If accepted, integration must re-run seam and aggregate proof on the serial integration head.

---

_Phase: WLD-01-safety-foundation_
_Plan: 06_
_State: constructed, awaiting independent review_
