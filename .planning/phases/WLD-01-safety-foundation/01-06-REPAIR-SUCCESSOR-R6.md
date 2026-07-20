# Plan 01-06 Repair Successor R6

Status: **CONSTRUCTED — awaiting independent audit**

This successor repairs independent HIGH finding F-01: the complete source
admission identity could change after the final byte verification but before
the recovery point crossed its publication boundary.

## Exact candidate

- Source commit: `4f6f02e944a4eabf421c224d64747b2702e7ed24`
- Source tree: `c294c29afa246ed91386051560d0fb9d6825f899`
- Parent audit commit: `005b4cbb9f1b49b1f0de0cadc8ed09875c445b52`
- Subject: `fix(recovery): bind publication ancestry`

## Repair

- Revalidates the complete source admission ancestry immediately before
  publication.
- Revalidates both source and destination identities immediately after the
  atomic rename.
- Retains source leases through the post-publication identity check.
- Removes the just-published recovery point and fails closed if either identity
  changed across the publication boundary.
- Adds the executable late-ancestry-swap regression to the focused recovery
  matrix.

## Proof

| Gate              | Result                                                                                          | Log SHA-256                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Focused recovery  | 12 files passed; 176 passed; 3 skipped                                                          | `b0e0217da2ad0677922e57b8108a9e6d965d995f1140ee35853c8f020a0969f0` |
| Typecheck         | PASS                                                                                            | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| Changed-file lint | 0 warnings; 0 errors                                                                            | `ce4df0404bc983b9a068aeb9ab03591b97dbdda3be4c7804632604f91a67dde6` |
| Format            | PASS                                                                                            | `8d52afdc42f8682babb8884bacd35a6a687c8174efeec01a59dde3349dbf4d9a` |
| Diff check        | PASS                                                                                            | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| Aggregate         | Vitest 1,430 files passed/21 skipped; 15,178 passed/149 skipped; Bun-native 229 passed/0 failed | `57f68052cab56650ff3d7ed4e963e76d8ea51579ff39c7310872082a95487297` |

Machine-readable evidence is retained under
`.planning/phases/WLD-01-safety-foundation/evidence/01-06-r6-4f6f02e9/`.
The aggregate log is sanitized; the raw aggregate output was removed.

## Non-claims

- This is a builder construction receipt, not independent acceptance.
- No integration, merge, push, release, deployment, canary, or issue action is
  authorized or claimed.
- An independent auditor must attack the exact source commit and verify the
  retained receipt before the candidate can enter integration.
