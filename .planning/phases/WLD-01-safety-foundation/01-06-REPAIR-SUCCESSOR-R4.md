# Plan 01-06 Repair Successor R4

Status: **CONSTRUCTED — AWAITING INDEPENDENT AUDIT**

## Exact candidate

- Review baseline: `b2b01f6132203feb2c21f04982534b4d53091c8d`
- Repair commit: `bc021e7db6308fca019e722835b0d8731898b616`
- Repair tree: `8bff34511ef1b05c9de5b24fc57b282aff1d114b`
- Branch: `repair/01-06-r4`

## Correction

- Every admitted authority root is rebound to its authoritative pathname after both mutation-epoch reads.
- Every captured file retains both its descriptor-relative operation path and its authoritative named path.
- Capture and verification compare the held handle to the current named path before and after reads and after artifact construction.
- Post-capture proof binds SHA-256 bytes and filesystem `dev`/`ino`, so an equal-byte replacement cannot impersonate the captured file.
- The original review regression is retained. Added hostile coverage for directory-root replacement before the first epoch and equal-byte descendant replacement during the final epoch.

## Proof

- Focused recovery: 12 files passed; 172 passed; 3 skipped.
- Typecheck: passed.
- Changed-file lint: 0 warnings and 0 errors.
- Format and diff checks: passed.
- Aggregate: Vitest 1,430 files passed / 21 skipped; 15,174 tests passed / 149 skipped. Bun-native: 229 passed / 0 failed.
- Machine receipt: `evidence/01-06-bc021e7d/receipt.json`.

## Non-claims

- This is a construction handoff, not self-review or acceptance.
- No integration, merge, push, release, deployment, canary, or issue action occurred.
