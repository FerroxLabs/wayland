---
phase: WLD-01-safety-foundation
plan: 01
subsystem: cohort-authority
status: repaired-pending-independent-review
completed: null
requirements-completed: []
requirements-addressed: [SAF-02]
baseline: 3bc531efa97d3a66e60bd2ced9e202002dc5a4d4
implementation_commit: 59013f371612f7db62e8db08cb481ae862281188
implementation_tree: 2d30b2846c73544e47ed7ca8e857368519b13ab7
audited_predecessor: 3f0fbdf6840bf0e52a5e960ac6dddcda85d2a083
audited_tree: 83f334fe5d3c296c27b170499a9baeca883b6666
evidence_completed_utc: 2026-07-19T18:52:31Z
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
- Burned one-shot legacy migration without minting authority when its post-confirmation process clock is invalid.
- Failed every existing-authority projection, consent, runtime, and rollout surface closed when the process clock is non-finite, negative, fractional, or unsafe.
- Captured one clock value per mutation/result path, revalidated process-generated authority before publication, and bounded authority/window identifiers.
- Rejected accepted-evidence callbacks with invalid completion timestamps or noncanonical aggregate digests.
- Kept a consented assignment locked before its immutable window start, created runtime state only when that start is reached, and reported post-window returns as outside-window rather than consent-disabled.
- Reconciled the declared ownership manifest to the exact 49-path baseline delta, including seven retained proof logs.

## Exact proof against the audited candidate

Candidate HEAD `3f0fbdf6840bf0e52a5e960ac6dddcda85d2a083` has tree `83f334fe5d3c296c27b170499a9baeca883b6666` and runtime implementation parent `59013f371612f7db62e8db08cb481ae862281188` with tree `2d30b2846c73544e47ed7ca8e857368519b13ab7`. Proof ran from 2026-07-19T18:49:30Z through 2026-07-19T18:52:31Z on macOS Darwin 25.3.0 arm64, Bun 1.3.11, Node v25.8.1, and the local frozen dependency tree.

| Command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Exit | Result                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---: | -------------------------------------------------------------------------------------------------- |
| `GSD_RUNTIME=codex bunx vitest run tests/unit/process/services/cohort/ProductionCohortController.test.ts tests/unit/process/services/cohort/ProductionCohortCredentialVault.test.ts tests/unit/process/services/cohort/ProductionCockpitRolloutStatusProvider.test.ts tests/unit/process/services/cohort/rolloutAuthority.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/process/bridge/wikiBridge.noProject.test.ts tests/unit/process/services/wiki/wikiAutoSync.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx`                                                                                                                                         |    0 | 9 files, 129/129 tests passed                                                                      |
| `bun run typecheck`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |    0 | TypeScript clean                                                                                   |
| `bun run lint -- src/common/config/storage.ts src/process/services/cohort src/process/services/wiki/wikiAutoSync.ts src/common/types/cohortRollout.ts src/common/types/electron.ts src/process/bridge/cohortBridge.ts src/process/bridge/wikiBridge.ts src/preload/main.ts src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx tests/unit/process/services/cohort tests/unit/process/services/wiki/wikiAutoSync.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/process/bridge/wikiBridge.noProject.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx`                                                                                    |    0 | Scoped lint clean                                                                                  |
| `bun run format:check -- src/common/config/storage.ts src/process/services/cohort src/process/services/wiki/wikiAutoSync.ts src/common/types/cohortRollout.ts src/common/types/electron.ts src/process/bridge/cohortBridge.ts src/process/bridge/wikiBridge.ts src/preload/main.ts src/renderer/pages/settings/NavigationSettings/CohortEvidenceConsent.tsx tests/unit/process/services/cohort tests/unit/process/services/wiki/wikiAutoSync.test.ts tests/unit/process/bridge/cohortBridge.test.ts tests/unit/process/bridge/wikiBridge.noProject.test.ts tests/unit/cohortPreloadBridge.test.ts tests/unit/renderer/cohortEvidenceConsent.dom.test.tsx .planning/STATE.md .planning/phases/WLD-01-safety-foundation/01-01-PLAN.md` |    0 | Scoped format check clean                                                                          |
| `bun run i18n:types`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |    0 | Generated key surface unchanged                                                                    |
| `node scripts/check-i18n.js`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |    0 | Validation passed; repository-wide baseline warnings remain                                        |
| `GSD_RUNTIME=codex bun run test`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |    0 | 1,433 Vitest files passed, 21 skipped; 15,207 tests passed, 145 skipped; 226/226 Bun-native passed |

## Retained log digests

All logs are retained under `.planning/phases/WLD-01-safety-foundation/evidence/01-01-successor-3f0fbdf6/`. Each log records candidate identity, implementation identity, exact command, UTC start and finish, line-complete command output, and exit code. The aggregate's declared secret-value redaction changes values only, not line count.

| Log                     | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `01-focused-vitest.log` | `5c71e1b8aa98f8d165d5a7b620d82bc6b369fe8efcd0581c89f3a616890ae460` |
| `02-i18n-types.log`     | `c73ff1315761f4bdb4ab1fb5e03c86525c757c1c968336e264ff2493435ccacb` |
| `03-i18n-check.log`     | `ebc064563b199abd97e072089340615422c5189b7245a82ae3102128a94d62ec` |
| `04-typecheck.log`      | `121e407f47952e81047bd465805d4815fabef47563d544646dc3f0902bef9cd2` |
| `05-scoped-lint.log`    | `6e9b9b5710f3fb087c6e7d2627323f7a74225ba95425ef6847df582b080a34b1` |
| `06-scoped-format.log`  | `8458d3b5d5f2fad4125686ea5c02d8e43b335bd2e27ecc018d0a90fbf3e0c00b` |
| `07-full-aggregate.log` | `34ae4a4b085c0ed6978c709df35ca0d1fe309c487895a7f787d470f518f22115` |

The exact aggregate left source files unchanged and did not create `.ijfw/wiki-state/index.json`. The full aggregate log preserves every output line while redacting only ephemeral test-generated password values; that sanitization is declared in the log before its command metadata. Declared and actual baseline path manifests both contain the same 49 paths.

## Non-claims

- This document does not accept Plan 01-01 or SAF-02.
- It does not claim packaging, deployment, canary, release, or production migration.
- It does not erase prior rejected candidates or their findings.
- The evidence-document commit is intentionally separate from the implementation commit above; an independent auditor must bind review to the exact final HEAD and tree.
