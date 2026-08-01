# Plan 01-06 Repair Successor R7

Status: **CONSTRUCTED — awaiting independent audit**

This successor repairs the independent MEDIUM publication-collision finding
against R6. Node's `rename()` uses replacement semantics, so a concurrent actor
could reserve the final snapshot pathname at the publication boundary and have
that inode silently overwritten.

## Exact candidate

- Source commit: `2a672bd54464be4143dca27ccdf1d2db8c0a76ac`
- Source tree: `29a76c2db0331763440333051ff17158ed3e9e76`
- Parent audit-test commit: `f99137474252c48a46bb0182e1e4c768c741c4d0`
- Rejected R6 source: `4f6f02e944a4eabf421c224d64747b2702e7ed24`
- Subject: `fix(recovery): prevent publication replacement`

## Repair

- Reserves the final snapshot name with no-replace `mkdir()` semantics.
- Rejects and preserves concurrent directory, regular-file, symlink, and Unix
  socket reservations.
- Copies only the previously verified sealed artifacts into the identity-bound
  reserved root.
- Writes `manifest.json` last as the logical publication commit marker. Existing
  recovery readers require and verify this manifest, so a partially copied root
  is never an admissible recovery point.
- Revalidates source, destination, and publication-root identities throughout
  the commit sequence.
- Binds failure cleanup to the inode originally reserved by this builder; a
  pathname replacement is never deleted merely because it occupies the same
  name.
- Preserves primary errors and exercises publication-handle cleanup failure.

## Proof

| Gate              | Result                                                                                          | Log SHA-256                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Focused recovery  | 12 files passed; 183 passed; 3 skipped                                                          | `c9321a0e93d988cfa11346d4a46c6c93845c3c975fdc78cc98982ba10f7d7ac0` |
| Typecheck         | PASS                                                                                            | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| Changed-file lint | 0 warnings; 0 errors                                                                            | `13261879fcb316f870d3bc4ef17541387c342dadb0a64529f644122f7c0fa48d` |
| Format            | PASS                                                                                            | `c510df01cd21dfa21b1275ee2d6a201a96961b05abf47016e4cfe5cada513e74` |
| Diff check        | PASS                                                                                            | `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b` |
| Aggregate         | Vitest 1,430 files passed/21 skipped; 15,185 passed/149 skipped; Bun-native 229 passed/0 failed | `d54fbb3fa8ff03c1b9728320f59d17a272c5d41be3642f5eeebbf1ab517e4a4d` |

Machine-readable evidence is retained under
`.planning/phases/WLD-01-safety-foundation/evidence/01-06-r7-2a672bd5/`.
The aggregate log is sanitized; the raw aggregate output was removed.

## Non-claims

- This is a builder construction receipt, not independent acceptance.
- The logical manifest commit boundary does not claim a native single-syscall
  directory exchange.
- No integration, merge, push, release, deployment, canary, or issue action is
  authorized or claimed.
- An independent auditor must attack the exact source commit and authenticate
  the retained receipt before the candidate can enter integration.
