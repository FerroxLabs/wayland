# Native Constitution Stage A/B seal plan

Status: **PREPARED, NOT SEALED**
Candidate worktree: `codex/desktop-constitution-production`
Candidate baseline: `991c502e74506ec3702f92e429a8b31b655412ba`
Coordination issue: `FerroxLabs/wayland#886`

This plan turns the normative Stage A then Stage B order into an executable
boundary. It does not authorize a commit, root integration, push, package,
release, or receipt. The implementation worktree remains the byte authority
until an explicitly authorized seal operation freezes it.

## Non-negotiable seal rules

1. Preserve the complete dirty candidate before splitting. Never use reset,
   checkout, stash, or a broad path restore against the production worktree.
2. Create Stage A from the same baseline and copy only the Stage A whole-file
   and named mixed-file hunks below.
3. Run the Stage A proof matrix and record the exact commit, tree, toolchain,
   helper, corpus, schema and command digests in
   `receipts/NATIVE-CONSTITUTION-V2.json`.
4. Create Stage B from that exact Stage A commit. It may add only the Stage B
   whole-file and named mixed-file hunks below.
5. Run the complete Stage B proof against the sealed Stage A identity and
   record both commits and all contract digests in
   `receipts/CONSTITUTION-RECOVERY.json`.
6. Stage C consumes those exact two commits. A combined commit, recreated
   patch, branch name, mutable path or later equivalent tree cannot substitute
   for either identity.
7. If a hunk cannot be assigned without changing behavior, stop the split and
   revise this plan. Do not move the whole file to the easier stage.
8. Before copying any byte, generate a complete candidate inventory from the
   baseline through the dirty worktree, including untracked files. Assign every
   path exactly once to Stage A, Stage B, mixed, or explicitly out of scope.
   The seal fails on an omitted path, duplicate assignment, unknown path, or an
   out-of-scope path that contains Constitution/recovery behavior.
9. For every mixed file, freeze a patch artifact and digest for the Stage A
   hunks and a separate patch artifact and digest for the Stage B hunks. Apply
   each patch with three-way/fuzz disabled and prove that recomposing both
   stages produces byte-identical candidate content for that file.
10. After Stage A is assembled, scan its production and test dependency graph.
    It must not import a Stage B DTO, service, route, IPC channel, preload
    method, renderer control, or locator. After Stage B is assembled, prove its
    parent is the exact Stage A receipt commit and that it does not replace or
    mock away Stage A authority.

## Seal preflight inventory gate

The seal operator must preserve these immutable artifacts before the first
commit is created:

- baseline commit and tree identity;
- candidate `git status --porcelain=v2 --untracked-files=all` bytes and digest;
- complete tracked diff plus untracked-file archive and digests;
- machine-readable one-owner path inventory;
- separate Stage A and Stage B mixed-file patches and digests;
- a reconstruction report proving `baseline + Stage A + Stage B` is
  byte-identical to the preserved candidate for every in-scope path;
- an exclusion report proving every out-of-scope dirty path is unchanged by
  both stages.

The path inventory is expanded to exact filenames at seal time. Directory
globs and phrases such as “corresponding tests” are descriptive here only and
are forbidden in either receipt. Stage A cannot be committed until the
inventory checker reports zero unowned, multiply owned, unknown, or
behavior-bearing excluded paths.

The prepared inventory and fail-closed checker are
`NATIVE-CONSTITUTION-SEAL-INVENTORY.json` and
`verify-native-constitution-seal-inventory.mjs`. The checker binds the exact
baseline HEAD, dirty status bytes, one-owner counts, non-symlink regular files,
and each path's frozen Git mode, Git blob OID and raw-byte SHA-256. It compares
all 136 identities directly and fails closed on a missing/malformed identity or
any mode, blob, byte or status drift. It must pass immediately before the
candidate is frozen and be regenerated if any candidate byte or status changes.

`prepare-native-constitution-seal-artifacts.mjs` then emits a new, mode-0700
artifact directory containing the raw NUL-delimited status, inventory snapshot,
per-file byte/patch digests, binary full-candidate patch, whole-file Stage A and
Stage B patches, full mixed-file patch and digest-bound manifest. It refuses an
existing output directory and refuses any dirty path with an empty patch. Its
whole-stage patches deliberately exclude mixed files; they are not seal inputs
until the separately reviewed mixed patches reconstruct every candidate byte.

`NATIVE-CONSTITUTION-MIXED-HUNKS.json` binds all 14 remaining seams to their
current file and full-patch digests and exact Stage A/Stage B selectors. The
inventory checker requires exact set equality between that contract and the
mixed inventory and fails on selector, baseline, file-byte or patch-byte drift.

## Stage A whole-file boundary

Stage A owns the paired native/service authority, durable existing-edit
identity, historical producer corpus, recovery primitives and package-resource
authority:

- `Dockerfile`
- `native/constitution-fs/src/main.rs`
- `scripts/prepareConstitutionFs.js`
- `scripts/verify-packaged-resources.js`
- `src/common/constitutionDefault.ts`
- `src/common/types/constitution.ts`
- `src/process/services/constitution/composePrompt.ts`
- `src/process/services/constitution/constitutionArchiveRestoreAuthority.ts`
- `src/process/services/constitution/constitutionFsAuthority.generated.ts`
- `src/process/services/constitution/constitutionFsBinary.ts`
- `src/process/services/constitution/constitutionFsService.ts`
- `src/process/services/constitution/constitutionFsTransaction.ts`
- `src/process/services/constitution/constitutionKeyStore.ts`
- `src/process/services/constitution/constitutionMutationQuiescence.ts`
- `src/process/services/constitution/constitutionRequestFingerprint.ts`
- `src/process/services/constitution/constitutionRevisionAuthority.ts`
- `src/process/services/recovery/classicConstitutionPromotion.ts`
- `src/process/services/recovery/externalRecoveryAuthority.ts`
- `src/process/services/recovery/externalRecoveryCrypto.ts`
- `src/process/services/recovery/externalRecoveryRecordCodec.ts`
- `src/process/services/recovery/index.ts`
- `src/process/services/recovery/recoveryCapture.ts`
- `src/process/services/recovery/recoveryManifest.ts`
- `src/process/services/recovery/recoveryPointBuilder.ts`
- `src/process/services/recovery/stateAuthorityInventory.ts`
- `src/process/utils/restrictedCanonicalJson.ts`
- `src/renderer/pages/settings/ConstitutionSettings/SpecialistOverlayEditor.tsx`
- `src/renderer/pages/settings/ConstitutionSettings/SpecialistOverlays.tsx`
- `src/renderer/pages/settings/ConstitutionSettings/useSerializedAutosave.ts`
- `tests/unit/apiRoutes-helpers.test.ts`
- `tests/fixtures/constitution-fs/**`
- the corresponding native, service, crypto, corpus, prompt, existing-edit,
  recovery-launcher and package-resource tests.

The compatibility test adjustments in team/task/agent prompt suites belong to
Stage A only when they prove fail-closed Constitution prompt composition or the
new authority envelope. They may not carry unrelated expectation drift.

## Stage B whole-file boundary

Stage B owns shared recovery DTOs, archive/Classic orchestration, restart-safe
discovery, transport registration and the new visible recovery surfaces:

- `src/common/types/constitutionRecovery.ts`
- `src/process/services/constitution/constitutionArchiveRecoveryService.ts`
- `src/process/services/constitution/constitutionClassicRecoveryAuthority.ts`
- `src/process/services/constitution/constitutionClassicRecoveryRuntime.ts`
- `src/process/services/constitution/constitutionClassicRecoveryService.ts`
- `src/process/bridge/applicationBridge.ts`
- `src/process/bridge/index.ts`
- `src/process/services/recovery/externalRecoveryLauncher.ts`
- `src/process/services/recovery/classicRecoveryLocator.ts`
- `src/renderer/pages/settings/ConstitutionSettings/ConstitutionClassicRecovery.tsx`
- `src/renderer/pages/settings/ConstitutionSettings/ConstitutionRecovery.tsx`
- `tests/unit/process/services/recovery/externalRecoveryLauncher.bun.test.ts`
- `tests/unit/webserver/constitutionRecoveryConsumerJourney.dom.test.tsx`
- the corresponding shared-DTO, archive/Classic service, locator, route/IPC,
  renderer and negative-surface tests.

## Mixed-file hunk boundary

These files cannot be assigned wholesale. The split must be symbol- and
behavior-based:

| File                                                         | Stage A hunks                                                                                                                          | Stage B hunks                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/process/utils/initBridge.ts`                            | create and install `ConstitutionFsService` with explicit user-data revision authority; no implicit fallback                            | archive restore operation authority, archive service, Classic recovery readiness, recovery sender validation and bridge injection |
| `src/process/utils/initBridgeStandalone.ts`                  | explicit standalone Constitution filesystem authority and fail-closed startup                                                          | archive recovery composition and explicit `Promise.resolve(null)` Classic capability                                              |
| `src/process/bridge/constitutionBridge.ts`                   | authority envelopes, required mutation request IDs, existing read/write/reset/specialist methods, quiescence around existing mutations | archive inventory/restore and Classic metadata/decision/resume handlers plus sender/auth/rate-limit failures                      |
| `src/process/webserver/routes/constitutionRoutes.ts`         | strict authority reads, required request IDs, existing mutation receipt correlation, default Constitution reset and quiescence         | archive and Classic routes, recovery DTO parsing, hosted principal binding and recovery-specific errors                           |
| `src/common/types/electron.ts`                               | authority-envelope and request-ID corrections for existing Constitution calls                                                          | archive and Classic recovery method declarations                                                                                  |
| `src/preload/main.ts`                                        | existing Constitution authority-envelope/request-ID forwarding                                                                         | archive and Classic recovery IPC forwarding                                                                                       |
| `src/renderer/services/ConstitutionService.ts`               | strict authority/read/specialist parsing, request-ID and fingerprint receipt validation for existing operations                        | archive and Classic DTO clients for Electron and HTTP                                                                             |
| `src/renderer/pages/settings/ConstitutionSettings/index.tsx` | durable overwrite/reset single-shot operations and exact receipt completion                                                            | recovery principal scope and `ConstitutionRecovery`/`ConstitutionClassicRecovery` composition                                     |

Every mixed-file test follows the production symbol it proves. Stage A tests
must not import the Stage B DTO or register recovery routes/channels. Stage B
tests must run against the sealed Stage A contract rather than mocks that
replace its authority.

The `externalRecoveryLauncher.ts` delta and its test are wholly Stage B. The
baseline launcher remains in Stage A; all candidate additions to it form one
restart-safe preparation transaction whose projection publication, destination
rename and activation are inseparable from the locator. Creating an
intermediate no-locator variant would invent behavior absent from the candidate
and is forbidden.

The `applicationBridge.ts` and `bridge/index.ts` deltas are wholly Stage B:
their only new behavior is recovery sender validation and passing the recovery
service into the expanded bridge. Conversely, `services/recovery/index.ts` is
wholly Stage A because its current diff exports only Stage A crypto, authority,
record, capture and promotion primitives; it contains no locator export.

`useSerializedAutosave.ts` and `tests/unit/apiRoutes-helpers.test.ts` are wholly
Stage A. The former contains only durable existing-edit identity and
serialization behavior; the latter proves existing hosted request/default and
authority behavior and imports no Stage B recovery surface.

`tests/unit/process/services/constitution/constitutionFsService.test.ts` is
mixed as well. Stage A owns helper/service, historical-corpus, key/revision,
transaction and native archive-primitive proof. Stage B owns the archive
orchestration response-loss case that instantiates
`ConstitutionArchiveRecoveryService`; that import and test must not exist in
the Stage A tree.

`tests/unit/webserver/constitutionRouteClient.contract.test.ts` and
`tests/unit/webserver/constitutionRoutes.integration.test.ts` are wholly Stage
A. Their current diffs prove request IDs/fingerprints, strict authority and
unsafe-platform envelopes, the canonical default, and existing hosted security
middleware only; neither owns an archive/Classic recovery transport case.

The remaining mixed tests split exactly as follows:

| Test file                                               | Stage A cases                                                                                          | Stage B cases                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `tests/unit/process/bridge/constitutionBridge.test.ts`  | existing read/mutation authority, request IDs, failure envelopes, unavailable authority and rate limit | recovery sender validation, archive DTO/service mapping and Classic metadata/decision/resume |
| `tests/unit/process/utils/initBridgeStandalone.test.ts` | explicit native authority creation, path and installation                                              | archive service construction and explicit unavailable Classic capability                     |
| `tests/unit/renderer/ConstitutionService.test.ts`       | existing read/specialist/grant/mutation receipt and transport validation                               | archive inventory/restore and Classic metadata/decision/resume clients                       |
| `tests/unit/renderer/ConstitutionSettings.dom.test.tsx` | durable autosave/reset/overwrite, conflict and absent/empty/error state                                | mounting the authenticated Classic recovery surface                                          |
| `tests/unit/webserver/constitutionRoutes.test.ts`       | existing reads, grants, mutations, request IDs, unavailable authority and error mapping                | archive metadata/restore and Classic principal/step-up/decision routes                       |

No other test is mixed. `constitutionFsService.test.ts` uses the dedicated
split above; every other test in the inventory is copied wholly to its assigned
stage.

## Stage A proof matrix

Before the Stage A commit may receive a receipt:

1. Build the native helper and verify the paired protocol and generated digest
   authority.
2. Replay both historical producer fixture families through the actual service
   and require byte-identical finalizer reproduction.
3. Run all native transaction, revision, key lifecycle, crypto, record codec,
   promotion journal, response-loss, conflict, rescue-before-CAS, archive
   primitive, prompt composition and durable renderer-operation tests.
4. Run standalone/Electron authority-startup and package-resource tests without
   registering a Stage B route, channel or control.
5. Run typecheck, scoped warning-free lint/format, i18n type generation and
   validation, server and Electron builds, the full Vitest/Bun aggregate and
   `git diff --check`.
6. Independently trace every Stage A source and test path to the acceptance
   contract. Zero unresolved HIGH/BLOCKER is required for the local seal.

## Stage B proof matrix

Before the Stage B commit may receive a receipt:

1. Assert its parent is the exact Stage A receipt commit and revalidate the
   Stage A corpus/digests before running Stage B tests.
2. Run shared DTO, archive inventory/restore, Classic discovery, decision,
   partial/conflict/resume, HTTP, IPC, preload, renderer and negative-surface
   suites.
3. Prove a real helper + service + Express + renderer-fetch response-loss
   replay and changed-fact conflict across restart.
4. Rerun typecheck, warning-free scoped lint/format, i18n type generation and
   validation, server and Electron builds, the full Vitest/Bun aggregate and
   `git diff --check`.
5. Independently trace every Stage B source and test path to the exact sealed
   Stage A dependency. Zero unresolved HIGH/BLOCKER is required before Stage C.

## Stage C evidence still outside the local seal

The following cannot be inferred from either source commit:

- the real signed/notarized v0.11.8 no-change, promotion, partial, conflict,
  unsupported-change rescue, discard and indefinite-preservation journeys;
- an actual built standalone Docker image boot/journey;
- packaged Windows smoke;
- target-exact macOS package, codesign, helper and resource verification;
- one immutable aggregate candidate composition and a final independent
  exact-HEAD zero-HIGH/BLOCKER audit.

Root integration remains forbidden until those Stage C artifacts bind the
exact Stage A and Stage B receipts.
