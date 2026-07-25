# Plan 01-13 Repair Successor R5

Status: **CONSTRUCTED — awaiting independent audit**

This successor repairs the independent HIGH finding that the runtime OfficeCLI
probe accepted exact expected bytes through a symlink outside the authenticated
bundle. Runtime evidence is now bound to stable bundle, binary, and manifest
filesystem identities.

## Exact candidate

- Source commit: `536f18d790ece1e4b238dede20cb14d509ba5129`
- Source tree: `0575c334cdcd30539da228b1a23d6709ae13b4ee`
- Rejected predecessor: `39a38a8ac550f16f03a6b37467e8f57402c585dc`

## Repair

- Rejects a symlinked or non-directory OfficeCLI bundle root.
- Rejects symlinked or non-regular binary and manifest entries.
- Opens both files with no-follow semantics where supported and binds reads to
  the admitted handle identity.
- Revalidates file and bundle identity after the complete read so a pathname or
  ancestor swap cannot mint runtime evidence.
- Preserves the exact manifest, executable, publisher, contract, skill,
  capability-fixture, and executable-ledger lockstep from the predecessor.

## Proof

| Gate                     | Result                                                                | Log SHA-256                                                        |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Focused                  | 7 files; 171 tests passed                                             | `b350602f7be84dcf261f81b2865915a412a0f9994f8dc2af4dde9136c52734be` |
| Typecheck                | PASS                                                                  | `c67398a876270961ec43a24a93502c20fd8778371cede4bd977ddd4f2d2680b5` |
| Changed-file lint        | 0 warnings; 0 errors                                                  | `083f31159401475555e0bd8de6a47822c76df01ce67b3528d3cb5eb5c55c3104` |
| Format                   | PASS                                                                  | `1bfcda25b85536bd26c57e773a140953d7fac86cf47e99d58900fdd9b1295667` |
| Diff check               | PASS                                                                  | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Producer reproducibility | clean/cache manifests byte-identical                                  | `b8e5e2fe3f85cf4f4dbc713c7360f743b0c44c14dcfcb3ad8e21aafa550b07c7` |
| Aggregate                | 1,430 Vitest files; 15,148 tests; 226 Bun-native tests; zero failures | `21e514988707a2bd855e551cb9176d8dacd108fb1d84c783eefd3c7bbd5208ad` |

The earlier contention-affected aggregate observation is retained but explicitly
rejected as authority. Its sole timed-out test passed in isolation, and the one
subsequent clean aggregate above is the accepted construction proof.

Machine-readable evidence is retained under
`evidence/01-13-r5-536f18d7/`. The aggregate log is sanitized and its raw log
was removed.

## Non-claims

- This is a builder construction receipt, not independent acceptance.
- No integration, packaging, deployment, release, or issue action is authorized
  or claimed.
