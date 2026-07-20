---
phase: WLD-01-safety-foundation
plan: 20
subsystem: recovery-historical-transaction-corpus
status: built
completed: 2026-07-20
requirements-addressed: [SAF-01, SAF-03, SAF-05]
build_branch: build/01-20
build_base: be5014e4b
local_only: true
---

# Plan 01-20 Build Summary

Sealed the historical constitution transaction corpus and its provenance harness
so M0A consumes real captured restore/mutation/crash behavior instead of
implementation-authored happy paths. Every declared historical transaction
authenticates its producer release, ordered MAC-chained mutations, expected
state delta, and terminal outcome through one complete corpus manifest, and
every hostile transaction fails closed.

## Corpus inventory / provenance classification

- Contract directory `contracts/recovery/historical-transactions/`:
  - `manifest.json` — complete corpus inventory + provenance digests (sealed
    canonical digest `3e496ec671ecb3755403039438162fe4526530cd443b6f7cc771523379aad3f0`).
  - `harness-only.patch` — verbatim copy of the additive main-only fixture
    failpoint patch (`sha256:6045787b…`), transaction-neutral.
  - `finalizer-inputs.json` — deterministic manifest-finalizer inputs/commands,
    stored separately.
- Captured corpus root `tests/fixtures/constitution-fs` (retained in place,
  origin + digest preserved; produced at commit 8974aa9b2 by the constitution
  strike). Two crash points:
  - `base-991c502-committed` — 3 committed transactions.
  - `base-991c502-pending-ledger-only` — the same 3 committed transactions plus
    one transaction crashed after ledger publication, before journal/receipt
    completion (`after-ledger-before-journal`).
- Classification counts: 2 captured bases, 36 captured files, 0 synthetic,
  6 committed transactions, 1 pending transaction.

## Provenance binding (all real, git-verified)

- Producer commit `991c502e74506ec3702f92e429a8b31b655412ba`, tree
  `1af0b2f9…`, archive `sha256:2e7e4a40…`.
- Named source path `src/process/services/constitution/constitutionFsTransaction.ts`
  bound by git blob `2e63d75c…` / content `sha256:33929dc0…` (48907 bytes) and
  re-derived through `git cat-file` when git is present.
- Harness patch transaction-region (`native/constitution-fs/src/main.rs`
  4306-4331) before-digest == after-digest (`sha256:52b7a371…`): the transaction,
  serialization, format, and durability regions are byte-identical.
- Toolchain, generator (v1), finalizer (v1), and helper build receipt digests
  bound from the retained reproduction record.

## Attack surface (all fail closed)

`verifyHistoricalTransactionCorpus.mjs` rejects current-code reconstruction
(foreign producer commit / drifted source blob), synthetic-as-captured claims,
missing files, extra/undeclared files, ledger gaps (broken MAC chain),
reordering (previousMac mismatch), transaction conflicts (repeated/receding
state), cross-release substitution (foreign commit or protocol version),
unknown critical manifest fields, manifest byte drift (sealed digest), state
drift (any retained byte), and post-terminal events (a pending transaction that
grew a receipt/journal, a committed transaction missing its receipt/journal, or
ledger growth after a non-finalized transaction).

## Proof

- Focused: `GSD_RUNTIME=codex bunx vitest run tests/unit/scripts/recovery/verifyHistoricalTransactionCorpus.test.ts` → 26/26 pass.
- CLI: `node scripts/recovery/verifyHistoricalTransactionCorpus.mjs` → ok, 36 files, 6 committed + 1 pending, both crash points.
- `bun run typecheck` clean.
- `bun run lint -- scripts/recovery/verifyHistoricalTransactionCorpus.mjs tests/unit/scripts/recovery/verifyHistoricalTransactionCorpus.test.ts` → 0 warnings, 0 errors.
- Change is additive-only: three new paths, zero existing files modified.

## Non-claims

Local-only. Not pushed, not merged to main, not released, not deployed, no
canary, no issue closure. The retained helper executable is not rebuilt; routine
verification hashes retained bytes only.
