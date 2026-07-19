---
phase: WLD-01-safety-foundation
plan: 01
subsystem: cohort-authority
status: repaired-pending-independent-review
completed: null
requirements-completed: []
requirements-addressed: [SAF-02]
baseline: 3bc531efa97d3a66e60bd2ced9e202002dc5a4d4
implementation_commit: ea2f8ef46eba510f9ef2442225f45801e5e07414
implementation_tree: 3bef42326780ff87ff1d699bb8839bf7703e2c78
audited_predecessor: 811f5790dd4e39c9d49ce2c9b111011022e4ee9c
---

# Plan 01-01 Repair Handoff

Plan 01-01 has a locally proved repair successor, but it is **not accepted**. A different auditor must inspect the exact successor and report zero findings before serial integration.

## What the repair changed

- Extended the stable OS credential-vault installation record with the latest authority ID and generation.
- Made replay of a complete old replaceable authority/lineage/marker tuple fail closed, including production-keytar restart proof.
- Kept the stable anchor write last during normal publication so every interrupted multi-record update either preserves the prior tuple or restarts unavailable.
- Corrected the migration contract: the legacy schema is classification input only; a fresh native confirmation preserves the effective cohort but never trusts legacy consent/window authority.
- Corrected `.planning/STATE.md` so 01-01 is pending independent review rather than falsely accepted.
- Removed both no-project `process.cwd()` fallbacks from manual Wiki access and scheduled Wiki synthesis; neither path may mutate an application/source launch directory.
- Rejected non-finite, negative, unsafe, and rollback clock values before they can create or persist cohort authority.
- Kept a consented assignment locked before its immutable window start, created runtime state only when that start is reached, and reported post-window returns as outside-window rather than consent-disabled.
- Reconciled the declared ownership manifest to the exact 42-path baseline delta.

## Exact proof against the implementation commit

Environment: macOS Darwin 25.3.0 arm64, Bun 1.3.11, Node v25.8.1, local frozen dependency tree.

| Command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Exit | Result                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---: | -------------------------------------------------------------------------------------------------- |
| `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/cohort/ProductionCohortController.test.ts tests/unit/process/services/cohort/ProductionCohortCredentialVault.test.ts tests/unit/process/services/cohort/ProductionCockpitRolloutStatusProvider.test.ts tests/unit/process/services/cohort/rolloutAuthority.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/process/bridge/wikiBridge.noProject.test.ts tests/unit/process/services/wiki/wikiAutoSync.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx`                                                                                                                                         |    0 | 9 files, 116/116 tests passed                                                                      |
| `bun run typecheck`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |    0 | TypeScript clean                                                                                   |
| `bun run lint -- src/common/config/storage.ts src/process/services/cohort src/process/services/wiki/wikiAutoSync.ts src/common/types/cohortRollout.ts src/common/types/electron.ts src/process/bridge/cohortBridge.ts src/process/bridge/wikiBridge.ts src/preload/main.ts src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx tests/unit/process/services/cohort tests/unit/process/services/wiki/wikiAutoSync.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/process/bridge/wikiBridge.noProject.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx`                                                                                    |    0 | Scoped lint clean                                                                                  |
| `bun run format:check -- src/common/config/storage.ts src/process/services/cohort src/process/services/wiki/wikiAutoSync.ts src/common/types/cohortRollout.ts src/common/types/electron.ts src/process/bridge/cohortBridge.ts src/process/bridge/wikiBridge.ts src/preload/main.ts src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx tests/unit/process/services/cohort tests/unit/process/services/wiki/wikiAutoSync.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/process/bridge/wikiBridge.noProject.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx .planning/STATE.md .planning/phases/WLD-01-safety-foundation/01-01-PLAN.md` |    0 | Scoped format check clean                                                                          |
| `bun run i18n:types`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |    0 | Generated key surface unchanged                                                                    |
| `node scripts/check-i18n.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |    0 | Validation passed; repository-wide baseline warnings remain                                        |
| `GSD_RUNTIME=codex bun run test`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |    0 | 1,433 Vitest files passed, 21 skipped; 15,194 tests passed, 145 skipped; 226/226 Bun-native passed |

The exact aggregate left the implementation worktree clean and did not create `.ijfw/wiki-state/index.json`. Declared and actual baseline path manifests both contain the same 42 paths. This repair run did not retain full command logs, so it makes no log-digest claim; every command above is directly reproducible at the exact implementation commit and environment.

## Non-claims

- This document does not accept Plan 01-01 or SAF-02.
- It does not claim packaging, deployment, canary, release, or production migration.
- It does not erase prior rejected candidates or their findings.
- The evidence-document commit is intentionally separate from the implementation commit above; an independent auditor must bind review to the exact final HEAD and tree.
