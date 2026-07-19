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
  created: []
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
  - "Production Constitution discovery is rooted at ~/.wayland; Core profiles are an explicit nested producer-owned exclusion."
  - "Schema discovery and SQLite snapshot bytes must come from the same identity-pinned driver connection."
  - "Start/end epoch equality is necessary but insufficient; every admitted non-database source byte set is rebound after capture."
  - "Current v3 manifests reject undeclared fields recursively while genuine v1/v2 compatibility remains unchanged."
requirements-completed: []
requirements-addressed: [SAF-01, SAF-03, SAF-05]
completed: 2026-07-20
status: constructed
---

# Phase 1 Plan 06: Recovery Capture Boundary Summary

The successor repairs all four HIGH and both MEDIUM findings from the rejected 01-06 candidate. This remains a construction receipt, not an independent acceptance or integration claim.

## Implemented

- Corrected the production Constitution root from the parent of Core profiles to `~/.wayland`.
- Added deterministic, bounded, recursive inventory of every Constitution namespace entry. Known Constitution paths must have the expected filesystem topology; unknown, symlinked, special, unreadable, hard-linked, and truncated state fails closed. The exact nested `profiles` root is explicitly excluded as producer-owned Core state and is not double-traversed.
- Kept one SQLite driver alive from strict schema discovery through online snapshot creation. Path identity, unique-link regular-file status, schema, single consumption, and pre/post snapshot identity are checked against that connection.
- Bound the in-memory SQLite image's reported schema to the schema read from the pinned connection and wipe mismatched bytes before failure.
- Revisited every admitted non-database source after capture and compared exact path sets and SHA-256 byte digests, closing the equal-epoch A-to-B-to-A mutation gap.
- Made descriptor reads positional so reused admitted file handles always verify from byte zero.
- Added recursive exact-key allowlists for every current-v3 manifest object boundary while preserving genuine v1/v2 compatibility.
- Added hostile proofs for the corrected production root, unknown and unsafe Constitution entries, wrong topology, SQLite pathname replacement, cross-schema snapshot substitution, equal-epoch ABA mutation, and undeclared nested manifest fields.

## Exact Construction Receipt

- **Rejected base commit:** `8832dbe1fecf3370ddc83bf86122546a2c109fe2`
- **Rejected base tree:** `e49727e08d486d96f239f061c0d35aee51f709cf`
- **Successor implementation commit:** `77b832f8b6cf48ab905c11270706e279f38b7133`
- **Successor implementation tree:** `d226aa371528b91e53175fc70683401c8a1cf4d0`
- **Proof timestamp:** `2026-07-19T18:20:38Z`
- **Environment:** Bun `1.3.11`; Node `v25.8.1`; Git `2.50.1`; macOS `26.3` build `25D125`; Darwin `25.3.0`; `arm64`
- **Environment digest:** `sha256:f8f6cfbc3073c24e704d2a6d64fea7ec5828657913f1ae6d7989138adf4d4b15`

| Gate | Exact command | Exit | Result | Log SHA-256 |
|---|---|---:|---|---|
| Aggregate | `rtk bun run test` | 0 | Vitest: 1,430 files passed, 21 skipped; 15,168 tests passed, 149 skipped. Bun-native: 229 passed, 0 failed. | `98faa2d96bd26763fd09453986ec43d9918f3fc52b2f7551a033aee5f268e733` |
| Typecheck | `rtk bun run typecheck` | 0 | TypeScript completed with no errors. | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| Successor-owned lint | `rtk bun run lint -- src/process/services/recovery/recoveryCapture.ts src/process/services/recovery/recoveryDryRun.ts src/process/services/recovery/recoveryManifest.ts src/process/services/recovery/recoveryPointBuilder.ts src/process/services/recovery/stateAuthorityInventory.ts tests/unit/process/services/recovery/recoveryCapture.test.ts tests/unit/process/services/recovery/recoveryManifest.test.ts tests/unit/process/services/recovery/recoveryPointBuilder.test.ts tests/unit/process/services/recovery/stateAuthorityInventory.test.ts` | 0 | 0 warnings, 0 errors across the exact nine-file successor diff. | `17fb6e08acce252a3fc865f635a321f53fc11a1321d8a8815b0fa3e8c9737189` |

The three full logs were retained locally at `/tmp/wayland-01-06-77b832f-{test,typecheck,lint}.log`. The summary commit is evidence-only control-plane metadata; the receipt above binds the exact implementation commit and tree that were executed.

## Boundaries and Non-Claims

- This summary does not independently accept plan 01-06 and does not authorize integration, merge, release, deployment, or issue closure.
- Core lease acquisition, expiry, mutation-after-lease, and release semantics remain owned by plan 01-18 and issue #896.
- Darwin and Windows production capture remain deliberately unavailable until an identity-bound native filesystem primitive is implemented and target-proven.
- Six-target packaging, deployment, canary, rollback, and release acceptance remain outside this plan.

## Next Gate

An independent auditor must attack implementation commit `77b832f8b6cf48ab905c11270706e279f38b7133`. If accepted, integration must re-run seam and aggregate proof on the serial integration head.

---
*Phase: WLD-01-safety-foundation*  
*Plan: 06*  
*State: constructed, awaiting independent review*
