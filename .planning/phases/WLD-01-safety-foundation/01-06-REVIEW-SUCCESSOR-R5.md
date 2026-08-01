# Plan 01-06 Independent Review Successor R5

Status: **REJECTED**

## Exact candidate

- Evidence successor: `72eec02010d621dec6630357650970511dd862c9`
- Evidence tree: `b48920715ea3f123230033ec9cfb77aef3507b6a`
- Repaired source: `9674fd1ed2e3b8da6357bb3c7248dc061b10a286`
- Source tree: `7e81fbfad6e97e8508eb11cd18faeea3a87a278b`
- Prior rejected audit: `05e4e1859b1f92d87d877a94a7045ae057d6290e`

## Finding F-01 — HIGH — source ancestry can change after its final check

R5 retains the complete source-ancestor chain and validates it immediately
after each mutation-epoch read. However, after the final ancestor check it
performs a second traversal to verify every captured source. That traversal can
overlap an authoritative-root replacement. If the already admitted descendants
are moved back beneath the replacement root, all leaf pathnames, descriptors,
bytes, and inodes remain valid. No ancestor check runs after verification, so
the builder publishes under an authority root whose identity differs from the
admitted capture plan.

The regression uses the existing `closeFileHandle` seam only to schedule the
filesystem mutation deterministically after the second epoch and first
verification read. The mutation itself is an ordinary rename, replacement
directory creation, and reattachment of the original descendants. It preserves
the leaf identities and demonstrates the real namespace race.

This violates source/profile identity authentication and the requirement that
admitted source authority remain bound through verification and publication.

### Executable reproduction

- Test: `tests/unit/process/services/recovery/recoveryPointBuilder.test.ts`
- Case: `rejects a source parent replacement after the final ancestor check but during source verification`
- Command: `rtk env GSD_RUNTIME=codex bun run test:vitest -- tests/unit/process/services/recovery/recoveryPointBuilder.test.ts`
- Exit: `1`
- Expected: the changed authoritative parent is rejected and the destination remains empty.
- Observed: the parent inode changes and the builder publishes; 22 existing tests pass, 3 skip, and only the hostile regression fails.
- Retained log: `.planning/phases/WLD-01-safety-foundation/evidence/01-06-review-r5/audit-reproduction.log`
- Log SHA-256: `89eaeec05cc79c972c2c1013e5897f9409acf3bf6791ac40c61a139173c009e4`

### Required correction

Revalidate every admitted ancestor chain after the complete post-capture source
verification pass and before releasing the Desktop quiescence lease or
authorizing publication. Retain a hostile regression that changes the parent
at this exact boundary while preserving all admitted descendant identities.

## Receipt verification completed before fail-fast

- Candidate commit and tree match the declared source identity.
- Evidence commit and tree match the declared successor identity.
- Every retained R5 log digest and the environment-manifest digest match the
  construction receipt.
- Repair ownership is limited to the four files declared in the receipt.

## Audit boundary

Audit stopped at the first proven HIGH. This test-only successor does not
implement a production fix and does not authorize integration, merge, push,
release, deployment, canary promotion, or issue closure.
