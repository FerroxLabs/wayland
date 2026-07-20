# Plan 01-06 Repair Successor R5

Status: **CONSTRUCTED — awaiting independent audit**

This successor repairs independent finding F-01 (HIGH): admitted source leaf
handles did not bind the complete authoritative ancestor chain, so an attacker
could replace an authority root and move the same admitted descendants beneath
the replacement without changing the leaf identities.

## Exact candidate

- Source commit: `9674fd1ed2e3b8da6357bb3c7248dc061b10a286`
- Source tree: `7e81fbfad6e97e8508eb11cd18faeea3a87a278b`
- Parent audit commit: `05e4e1859b1f92d87d877a94a7045ae057d6290e`
- Subject: `fix(recovery): bind source ancestor authority`

## Repair

- Admits and retains the complete canonical ancestor chain for every recovery
  source through the full capture.
- Revalidates each ancestor's device and inode identity after both mutation
  epoch reads.
- On Linux, opens descendants relative to the retained parent descriptor.
- Revalidates the requested source alias against the canonical admitted source.
- Binds the recovery inventory plan to the authoritative user-data-root path,
  device, and inode at both epoch boundaries.
- Adds hostile regressions for authority-root replacement with the original
  admitted descendants moved beneath the replacement. Publication fails closed.

## Proof

| Gate | Result | Log SHA-256 |
| --- | --- | --- |
| Focused recovery | 12 files passed; 174 passed; 3 skipped | `56cd4bfac67b67668e2e16179f3c83dbefb5a5eb9d1ab28b05bfa6d6df5708b8` |
| Typecheck | PASS | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| Changed-file lint | 0 warnings; 0 errors | `3797f436c8de2425fea814caf115ba2f10f35cb55c1ae3ca0ffc1206575dafa4` |
| Format | PASS | `05cc93c9766086692f11a0c77393f847036cb0203b31d763f5fdffc209eba6ed` |
| Diff check | PASS | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| Aggregate | Vitest 1,430 files passed/21 skipped; 15,176 passed/149 skipped; Bun-native 229 passed/0 failed | `f48a86ea52b322ad04879d475920c049eae4651ff360e2d0aef4d6cbc185c10f` |

Machine-readable evidence is retained under
`.planning/phases/WLD-01-safety-foundation/evidence/01-06-9674fd1e/`.
The aggregate log is sanitized; the raw aggregate output was removed.

## Non-claims

- This is a builder construction receipt, not independent acceptance.
- No integration, merge, push, release, deployment, canary, or issue action is
  authorized or claimed.
- An independent auditor must attack the exact source commit and verify the
  retained receipt before the candidate can enter integration.
