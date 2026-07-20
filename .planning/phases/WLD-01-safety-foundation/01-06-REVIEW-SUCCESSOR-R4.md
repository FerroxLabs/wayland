# Plan 01-06 Independent Review Successor R4

Status: **REJECTED**

## Exact candidate

- Evidence successor: `5004110eaed5f67856bf1d067b6e79a6c65df7d9`
- Evidence tree: `c90b7d77ff32ac101361c037568b98f82e27936c`
- Repaired source: `bc021e7db6308fca019e722835b0d8731898b616`
- Source tree: `8bff34511ef1b05c9de5b24fc57b282aff1d114b`
- Review baseline: `b2b01f6132203feb2c21f04982534b4d53091c8d`

## Finding F-01 — HIGH — admitted leaf identities are not bound to their parent chain

The repair binds each admitted authority root and descendant to its current leaf pathname by `dev` and `ino`, but it does not admit or retain the identity of the pathname's ancestor chain. An attacker can rename the authoritative `userDataRoot`, create a different directory at the same pathname, and move every already-admitted child back beneath the replacement parent. All held leaf handles, leaf pathnames, bytes, and mutation epochs still match, so the builder publishes even though the authoritative parent identity changed during collection.

This violates the plan's source/profile identity requirement and the explicit requirement that source identity remain bound throughout capture. Moving the original descendants back is not a synthetic byte mismatch: the reproduction preserves every descendant inode and demonstrates that leaf-only identity checks cannot authenticate the pathname root.

### Executable reproduction

- Test: `tests/unit/process/services/recovery/recoveryPointBuilder.test.ts`
- Case: `rejects replacement of an admitted source parent even when every descendant inode is moved back`
- Command: `rtk bun run test:vitest -- tests/unit/process/services/recovery/recoveryPointBuilder.test.ts`
- Exit: `1`
- Expected: capture rejects and leaves the destination empty.
- Observed: capture publishes successfully while the authoritative parent has a different inode; 21 existing tests pass, 3 skip, and only the hostile regression fails.
- Retained log: `.planning/phases/WLD-01-safety-foundation/evidence/01-06-review-r4/audit-reproduction.log`
- Log SHA-256: `6e3e058b90f183035b66a4117fdd920f4c7b051a7759c660204e0ad6e0732c22`

### Required correction

Admit and retain the complete authoritative source-root ancestor chain, including the `userDataRoot`/profile root that gives child paths their authority. Revalidate that chain after both mutation-epoch reads and across collection. Capture-plan and epoch evidence must be rooted in those admitted identities, not only in unchanged descendant leaf inodes. Add hostile coverage for parent/root replacement with original descendants reattached.

## Audit boundary

Audit stopped at the first proven HIGH. This test-only successor does not implement a production fix and does not authorize integration, merge, push, release, deployment, canary promotion, or issue closure.
