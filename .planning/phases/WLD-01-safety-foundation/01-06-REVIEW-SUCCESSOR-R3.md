# Plan 01-06 Independent Review Successor R3

Status: **REJECTED**

## Exact candidate

- Evidence successor: `5d9df833bee3465a7deffccdb6ed9920f952eaf1`
- Evidence tree: `a5beb86a5e17ca7da1eb3bf972a49e1615565dba`
- Repaired source: `56682b2cfd051ed5757d7af9bbcaef4f6170809f`
- Source tree: `6c9f130c20674bd3a9feba2d7adc0e3d5b92417c`
- Source parent: `0012150f41610b3feb3545ceee7c9a8773f106f7`

## Finding F-01 — HIGH — admitted source can lose pathname authority before the first epoch

`buildRecoveryPoint` admits copied source handles and only then invokes the first `readMutationEpoch`. If an admitted file is renamed away and replaced at its authoritative pathname during that boundary, both mutation epochs can observe the stable replacement while capture and post-capture verification continue reading the retired inode through the admitted handle. The point is published with bytes that no longer belong to the authoritative pathname.

This violates the plan's terminal claim that captured state is application-consistent and the requirement that authority disposition and source identity remain bound throughout capture.

### Executable reproduction

- Test: `tests/unit/process/services/recovery/recoveryPointBuilder.test.ts`
- Case: `rejects a source pathname replacement after handle admission but before the first mutation epoch`
- Command: `bun run test:vitest -- tests/unit/process/services/recovery/recoveryPointBuilder.test.ts`
- Expected: capture rejects and publishes no recovery point.
- Observed: capture publishes successfully, the authoritative pathname contains the replacement, and the snapshot contains the retired inode's bytes.

### Required correction

Bind every admitted source handle to its authoritative pathname at the first and final epoch boundaries, or begin the authenticated mutation boundary before admitting handles and prove that later pathname replacement invalidates the capture. Add hostile coverage for both file and directory authority roots without weakening descriptor-relative capture.

## Evidence verification

- All eight retained paths in `receipt.json` hash to their declared SHA-256 values.
- The receipt candidate commit, tree, and parent match Git exactly.
- The environment manifest matches the live Bun, Node, Git, macOS, kernel, and architecture values observed during review.
- Retained proof timestamps follow the source commit and precede the evidence commit.

The retained evidence is internally consistent, but its green tests do not exercise F-01 and therefore cannot authorize acceptance.

## Non-claims

- This is a test-only audit successor; it does not implement a production fix.
- It does not authorize integration, merge, release, deployment, canary promotion, or issue closure.
- Audit stopped at the first proven HIGH. Lower-severity hunting must resume against the repaired successor.
