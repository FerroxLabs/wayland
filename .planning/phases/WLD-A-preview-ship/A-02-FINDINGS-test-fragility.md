# Finding — 3 unit tests fail against stale bundled build output

## Symptom

On a working tree that has run a package build, the full unit suite reports 3 failing
files (1440 pass):

- `tests/unit/process/services/capabilities/OfficeCliAuthoringCapability.test.ts`
- `tests/unit/wcoreStderrSurfacing.test.ts`
- `tests/unit/shellEnv.test.ts`

On a clean checkout (or CI) the same commits pass 95/0.

## Root cause (proven)

These tests are guarded with `if (!fs.existsSync(<bundled resource>)) return;` — they SKIP
when the gitignored build output `resources/bundled-officecli/` is absent (fresh CI checkout)
and RUN when it is present. When they run, they validate the _real_ bundled artifact against
the current manifest/binary contract.

The local `resources/bundled-officecli/darwin-arm64/` was left by an earlier packaging run and
is **stale** relative to current source, so the happy-path assertion
(`resolveBundledOfficeCliDir(root, 'darwin', 'arm64')` should equal the runtime dir) fails.

Proven both directions:

- Cherry-picked the session's commits onto a clean worktree off `9aa836c86` → **95 pass / 0 fail**.
- Deleted the stale `resources/bundled-officecli/` from the working tree → the same 3 files → **95 pass / 0 fail**.

So it is **not** a code regression and **not** caused by any session commit. It is test
fragility: correctness depends on uncommitted, gitignored build output happening to match
source.

## Why it matters

Green on CI, red for any developer who has run a package build and then runs the unit suite —
which is exactly the "run the full suite before tagging" workflow. It erodes trust in the
suite and can mask a real failure among the noise.

## Recommended fix (Sean's call — not implemented)

Strengthen the guard from "resource exists" to "resource matches the current contract": skip
unless the bundled manifest's `reportedVersion` (and/or a content hash) matches what the test
was written against. A stale artifact should make the test SKIP with a clear message
("bundled-officecli present but stale — rebuild or remove"), not FAIL. Alternatively, point
these tests at a fixture they construct, never at the ambient `resources/` tree.

Immediate mitigation applied locally: removed the stale `resources/bundled-officecli/`.
