---
phase: WLD-01-safety-foundation
plan: 01
subsystem: cohort-authority
status: repaired-pending-independent-review
completed: null
requirements-completed: []
requirements-addressed: [SAF-02]
baseline: 3bc531efa97d3a66e60bd2ced9e202002dc5a4d4
implementation_commit: 0119cbc297622e4d26928adfde3c4fc8a41384d2
implementation_tree: 35521f75557b59cb184242c544987c05dd30cd75
rejected_predecessor: 9cc0408a1d7ecb7440a2a61f37803d715445bdf6
---

# Plan 01-01 Repair Handoff

Plan 01-01 has a proved repair successor, but it is **not accepted**. A different auditor must inspect the exact successor and report zero findings before serial integration.

## What the repair changed

- Anchored the one-time legacy-migration epoch inside the stable OS credential-vault installation record.
- Made deletion or replay of the replaceable authority, lineage, and migration-marker records fail closed without rereading mutable legacy config.
- Added hostile generic-controller and production-keytar regressions for that deletion/replacement sequence.
- Replaced cross-worktree `node_modules` symlinks with an exact local `bun install --frozen-lockfile` dependency tree.
- Reconciled the plan's actual baseline, changed-path ownership, and package/lock, receipt-authority, localization, test, and planning seams.
- Restored review history as explicit rejected-candidate evidence rather than deleting it.

## Exact proof run against implementation source

| Command | Exit | Result |
|---|---:|---|
| `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/cohort/ProductionCohortController.test.ts tests/unit/process/services/cohort/ProductionCohortCredentialVault.test.ts` | 0 | 2 files, 50/50 tests passed |
| `GSD_RUNTIME=codex bunx vitest run <seven 01-01 focused files>` | 0 | 7 files, 97/97 predecessor tests passed before repair; repaired controller/vault subset is 50/50 |
| `bun run typecheck` | 0 | TypeScript clean |
| `bun run lint -- <plan-owned source and test paths>` | 0 | 26 files, 0 warnings, 0 errors |
| `bun run format:check -- <plan-owned source and test paths>` | 0 | 26 files formatted |
| `bun run i18n:types` | 0 | Generated key surface in sync |
| `node scripts/check-i18n.js` | 0 | Validation passed; repository-wide pre-existing warnings remain |
| `GSD_RUNTIME=codex bun run test` | 0 | 1,453 Vitest files: 15,181 passed, 145 skipped; 226/226 Bun-native passed |

The complete gate used Bun 1.3.11 with local worktree dependencies. `react` and `swr` both resolved under this worktree; no dependency symlink remained.

## Non-claims

- This document does not accept Plan 01-01 or SAF-02.
- It does not claim packaging, deployment, canary, release, or production migration.
- It does not erase prior rejected candidates or their findings.
- The final evidence-document commit is intentionally separate from the implementation commit above; an independent auditor must bind its review to the exact final HEAD/tree.
