# M0A engineering-safety candidate receipt

Status: **local engineering proof only — M0A is not passed**

Identity note: the uncommitted-tree identity below is historical. The full
current Wave 0 tree was subsequently sealed at local checkpoint
`f6f7a81950c1ee2ca1629bbcc5c5e78045eb2fa2` with tree
`191ddfd1cbe60cc4934ce1586d9996eb7766ef9e`; see
`WAVE-0-STRIKE-CHECKPOINT.md`. That checkpoint does not change this receipt's
M0A-not-passed status or retroactively bind older command results to new bytes.

## Identity

- Baseline release: Desktop `v0.11.18`
- Baseline and current uncommitted-tree HEAD: `1b1c1e91119e3352bec3958188254ee91f150492`
- Working branch: `codex/desktop-cockpit-wave0`
- Desktop schema supported by this tree: `53`
- Proof host: macOS ARM64
- Proof date: `2026-07-16`

The candidate changes are intentionally uncommitted. This receipt identifies the exact base commit and commands but does not invent a candidate commit or artifact hash.

## Locally implemented and exercised

- Dependency-light startup preflight runs before the stateful main module is imported.
- Existing Desktop SQLite is opened read-only and its `user_version` is read before schema initialization.
- Future schema, corruption, native-driver failure, and ordinary startup failure are distinct typed stops.
- Symlinked and non-regular physical database paths fail closed before a driver opens them.
- The database initializer repeats the future-schema guard before `initSchema` and never routes that condition through corruption recovery.
- Corrupt DB/WAL/SHM files are quarantined as a rollback-safe set; failed quarantine rolls already-moved members back and never deletes sidecars.
- State discovery inventories Desktop DB/WAL/SHM, config, durable runtime files, default and named Core profiles, file key material, OS keychain ownership, updater state, external agent configs, and external workspaces without following symlinks.
- Recovery dry-run blocks missing/unreadable/symlinked copied authorities, unproven SQLite capture, missing quiescence, mutation-epoch absence, and unsealed sensitive material.
- Recovery-point construction uses SQLite online backup, Desktop/Core quiescence leases, mutation epochs, sealed sensitive copies, a private same-filesystem staging directory, manifest validation, hash verification, and one final publish rename.
- Recovery manifests reject incomplete state, unsafe/non-canonical paths, duplicate file IDs and artifact paths, ownership/policy drift, plaintext sensitive copies, unproven copied-authority consistency, omitted physical or logical authorities, logical reference/exclusion overclaims, and malformed external references.
- The production bootstrap exposes a dependency-light `--verify-recovery-snapshot <directory>` command before importing the stateful main module. It refuses a symlinked/non-directory snapshot root, opens the manifest without following a final-component symlink, rechecks file identity around the read, and runs the full manifest/artifact hash and type verifier.
- Recovery verification does not load the persisted CDP configuration, open a debugging port, or touch the CDP instance registry, including in an unpackaged development build.
- The same dependency-light bootstrap exposes a fail-closed external Classic launcher for an already materialized recovery tree. It requires all materialized files to match their receipt and a caller-pinned lowercase SHA-256 that equals both the observed binary and the compiled v0.11.8 executable pin before preparation, publication, and spawn. It never executes an untrusted binary for version discovery.
- `contracts/recovery/classic-v0.11.8-release.json` pins the published v0.11.8 release ID, exact tag commit, and one asset plus executable identity for macOS, Windows, and Linux on ARM64/x64. `classicReleaseTrust.ts` pins the catalog's canonical SHA-256 in compiled code, validates all six identities and publisher-gate declarations, and verifies a regular non-symlink file through one descriptor with before/after identity checks. Release-asset verification hard-codes `authorizesClassicLaunch: false`; the launcher separately requires the compiled executable pin and platform publisher validation. Its production trust receipt binds the catalog digest, release/tag commit, selected asset, exact executable, and observed platform publisher evidence. The exact receipt must remain stable before preparation, before publication, and immediately before spawn. Dependency-injected fixture evidence uses an explicit test-only contract with `authorizesClassicBinaryLaunch: false`; it is never serialized as production trust. macOS validation covers the whole app bundle, exact Developer ID authority, Team ID, bundle ID, and stapled notarization without starting Classic. Windows validation requires valid Authenticode and one exact `CN=Ferrox Labs` signer common name. Linux currently has exact GitHub asset/executable bytes and an explicit `publisher-signature-unavailable` limitation rather than a publisher-signature claim.
- The launcher transforms schema 53 to 52 in a private staging tree, exports post-baseline custom models for later re-import, validates integrity/foreign keys/schema, disables copied cron jobs and channel plugins, parks running workflow sessions, removes external cache overrides and updater state, disables background refresh/webhook tokens, and publishes by one rename.
- Classic receives only an isolated Electron `userData`, isolated `HOME`, isolated default and named Core homes, and `WAYLAND_DISABLE_AUTO_UPDATE=1`. The live Desktop/Core state and materialized source remain read-only, and recovery commands do not initialize CDP.
- Sensitive recovery files use a versioned authenticated envelope backed only by Electron's OS credential store. Keychain/DPAPI/libsecret unavailability blocks capture/materialization; there is no plaintext or file-key fallback. Source/destination files use no-follow/exclusive opens, bounded reads, plaintext size/digest checks, and failure cleanup.
- `--launch-classic-recovery-snapshot` chains verification, authenticated materialization, schema transform, safety neutralization, isolated publication, final binary-pin verification, and spawn. Its transient plaintext materialization tree is removed on success and failure.
- `--create-recovery-snapshot <destination>` is registered before stateful startup. It requires the ordinary Desktop profile lock, refuses destinations overlapping live Desktop/Core roots, inventories the live authority set, captures SQLite with the read-only online-backup driver, reads the actual database schema, seals sensitive files, and compares content-bound start/end epochs for every copied Desktop config/runtime/key/updater authority.
- Core default or named-profile state blocks capture until producer-owned issue `FerroxLabs/wayland#896` supplies a bounded quiescence lease and mutation receipt. The current command does not substitute filesystem timestamps, hashing, or process termination for Core ownership.

## Adversarial gaps closed in this pass

1. Distinct source names that sanitize to the same artifact path now abort the entire capture before overwrite or publication.
2. Serialized manifests with duplicate or non-canonical artifact paths now fail validation.
3. A structurally malformed external manifest returns typed validation errors instead of throwing while iterating attacker-controlled fields.
4. Logical state cannot claim `accounted` when a backing authority is `reference-only` or `excluded`.
5. Startup no longer collapses corruption, native ABI/driver failure, and ordinary I/O/startup failure into one ambiguous result.
6. A database symlink cannot bypass the physical-path preflight.
7. The v0.11.8 executable's `--version` flag was proven unsafe: it enters ordinary application startup, initializes services, and touches browser-profile state before printing the version. The recovery launcher no longer runs it. Exact compiled executable identity and platform signature validation now establish Classic provenance without executing Classic before isolation.

## Exact local proof

```text
rtk bunx vitest run tests/unit/process/services/recovery/recoveryManifest.test.ts tests/unit/process/services/recovery/recoveryPointBuilder.test.ts tests/unit/process/services/recovery/recoveryDryRun.test.ts tests/unit/process/services/recovery/stateAuthorityInventory.test.ts tests/unit/process/services/database/index.test.ts
```

Result: 5 files passed; 39 tests passed; zero failures.

```text
rtk bun test src/process/services/recovery/startupCompatibility.bun.test.ts
```

Result: 1 real-SQLite future-schema test passed; DB and WAL remained byte-identical and no sidecar was removed.

```text
rtk bun run typecheck
rtk bunx vitest run
rtk bun run package
rtk git diff --check
```

Results:

- TypeScript: passed.
- Full exact-current Vitest: 1,294 files passed and 19 skipped; 13,367 tests passed and 140 skipped; zero failures.
- Electron/Vite production main, preload, and renderer bundles: passed with the already-recorded mixed-import, third-party directive, and chunk-size warnings.
- Diff whitespace validation: passed.
- Targeted lint: zero errors. Existing warnings in the large database module and intentional sequential recovery I/O remain visible and are not represented as cleaned up.

```text
rtk bunx electron . --verify-recovery-snapshot /definitely-missing-wayland-recovery-snapshot
```

Result: exited `2` with only a typed `SNAPSHOT_ROOT_UNREADABLE` JSON result. It emitted no CDP/DevTools listener output and did not enter ordinary application startup.

```text
rtk bun test tests/unit/process/services/recovery/recoverySealing.bun.test.ts tests/unit/process/services/recovery/recoveryCli.test.ts tests/unit/process/services/recovery/externalRecoveryLauncher.bun.test.ts tests/unit/process/services/recovery/recoveryStateTransformer.bun.test.ts
rtk bunx vitest run tests/unit/startupBootstrapContract.test.ts
rtk bun run typecheck
rtk bunx oxlint <targeted recovery/bootstrap files>
rtk git diff --check
```

Results after the one-step sealed-snapshot path: 26 Bun tests passed; 8 Vitest bootstrap tests passed; TypeScript passed; targeted sealing/CLI/bootstrap lint reported zero warnings and zero errors (intentional sequential security-I/O warnings in the broader launcher remain visible); diff whitespace validation passed.

```text
rtk bunx vitest run tests/unit/process/services/recovery/recoveryCapture.test.ts tests/unit/startupBootstrapContract.test.ts tests/unit/process/services/recovery/recoveryCli.test.ts
rtk bun run typecheck
rtk bunx oxlint <targeted capture/CLI/bootstrap files>
rtk git diff --check
```

Results after production capture registration: 3 files and 21 tests passed; TypeScript passed; targeted lint reported zero warnings and zero errors; diff whitespace validation passed. Mutation-epoch tests prove deterministic content binding, change detection, and symlink refusal. This does not claim a complete Core-inclusive capture because `#896` remains unfulfilled.

```text
rtk bunx vitest run tests/unit/process/services/recovery/classicReleaseTrust.test.ts tests/unit/process/services/recovery/recoveryCapture.test.ts tests/unit/process/services/recovery/recoveryCli.test.ts tests/unit/process/services/recovery/recoveryDryRun.test.ts tests/unit/process/services/recovery/recoveryManifest.test.ts tests/unit/process/services/recovery/recoveryPointBuilder.test.ts tests/unit/process/services/recovery/stateAuthorityInventory.test.ts tests/unit/startupBootstrapContract.test.ts
rtk bun test tests/unit/process/services/recovery/externalRecoveryLauncher.bun.test.ts tests/unit/process/services/recovery/recoverySealing.bun.test.ts tests/unit/process/services/recovery/recoveryStateTransformer.bun.test.ts
rtk bun run typecheck
rtk bunx oxlint src/process/services/recovery/classicReleaseTrust.ts tests/unit/process/services/recovery/classicReleaseTrust.test.ts
rtk git diff --check
```

Results after exact v0.11.8 release/executable cataloging, unsafe-probe removal, structured trust receipts, acquisition, and extraction: all six live release downloads matched their compiled size/SHA-256 pins. macOS ARM64/x64 ZIPs produced exact executable hashes `43b0d619c8e0e8ff9739a00d4203fe91316ab7fabdd80d496043d0f05f8e75ab` and `09753f4d29ba4fbccf7721b771efe7638fd5700554ab62b98641dc93e9e532ee`; both complete bundles passed deep/strict code-signature and stapled-ticket checks for Ferrox Labs Team `PX6SP9GPWJ`. Windows ARM64/x64 NSIS assets produced exact PE hashes `8b8121b85f59509a7ee587cba98d2c5f974aae2f3a397104c40a9ff6f2979fc4` and `7c718b88fdcb78eba726af5b4f007c93360c55e5957dc2950513c0b5e14a1f9e`. Linux AppImage executable hashes equal their pinned release-asset hashes. The actual macOS ARM64 production asset-to-binary chain returned a receipt bound to release `346809341`, tag commit `74b37efb1a1f624ec86b66fb3465025cb1a9fd22`, catalog digest `4ce7287830468b0218c78bade7704e18db3b7a0de6ba523085f8526be026e2b5`, executable digest, exact Developer ID, Team ID, bundle ID, and stapled notarization without starting Classic. The focused proof is now 10 Vitest files/64 tests and 24 Bun recovery tests; TypeScript and diff whitespace validation pass. Targeted lint has zero errors and retains intentional sequential security-I/O/test warnings.

Actual macOS ARM64 packaging now proves both checksum-pinned Windows `7za.exe` recovery resources physically land in the app Resources tree and pass exact size/SHA-256 checks. The same package passes every critical packaged-resource check, preserves the exact pinned OfficeCLI release bytes and Aion Developer ID signature, retains hardened runtime with only `allow-jit`, and passes deep app-signature validation. This is a local ad-hoc Wayland package and not a signed recovery journey.

The Core supply-chain blocker exposed by the first package run is now locally corrected and package-proven for macOS ARM64. The package command asserts strict preparation for every requested target at exact Core release `v0.12.25`; the independent pin ledger binds all six release-archive digests to all six extracted-executable digests. Strict preparation rejects skip, `latest`, missing executable pins, archive drift, and executable drift. A byte-identical staged executable may be reused only as `sourceType=verified-cache`, never `local-prebuilt`. The post-package verifier replays the contract/generator, exact target, release, canonical asset URL, archive digest, executable name/digest, file set, and packaged bytes; it rejects unverified, skipped, local, mismatched, self-asserted, or extra runtime content.

The first corrected macOS package attempt then failed closed because Electron signing had changed Core from pinned SHA-256 `aa818a9492b59fd4402b2d4d451104d88dee5e5c20f05b722a487cdc39a6a382` to different bytes and granted broad Electron entitlements. The builder now excludes the exact nested Core path from re-signing. A later adversarial pass found that multi-platform/multi-architecture invocations could contaminate every artifact through the shared native-resource root; packaging now requires one exact platform and architecture per invocation, deletes stale foreign Core/Office runtime directories before preparation, and requires the packaged runtime sets to equal—not merely contain—the declared targets. The final real macOS ARM64 package contains exactly one Core and one Office runtime, preserves the pinned Core SHA-256 exactly, retains the released linker-signed ad-hoc Core binary with no entitlements, passes `codesign --verify --deep --strict` for the complete app, and passes the standalone packaged-resource replay with `--wcore-runtime darwin-arm64 --officecli-runtime darwin-arm64`. Focused provenance proof passes 4 files / 40 tests, including six-target pin resolution and negative cases for unsafe tags, cross-target packaging, local/unverified manifests, missing target declarations, wrong target/release, archive drift, self-asserted digest, packaged-byte drift, valid and invalid undeclared runtimes, and hidden placeholder-only critical directories. This is one local ad-hoc package receipt, not six-target signed release proof.

The preceding 4-file / 40-test package statement is superseded by the fresh
post-correction package receipt. That package again preserves exact Core SHA-256
`aa818a9492b59fd4402b2d4d451104d88dee5e5c20f05b722a487cdc39a6a382`,
contains exactly regular `wayland-core` plus `manifest.json`, passes the
standalone target/release/archive/binary replay, and passes deep strict app
signature validation. Focused provenance proof is now 5 files / 46 tests and
also covers alternate/encoded/target-qualified architecture arguments, stale
runtime pruning, runtime symlink rejection, and macOS CI failure propagation.

Results after one-action pinned-release orchestration: 10 focused Vitest files / 68 tests and 3 Bun recovery files / 26 tests pass. The new ordered test proves download -> binary preparation -> sealed materialization -> isolated launch, live-profile non-interference, archive cleanup on success, and archive plus orphan-runtime cleanup when materialization fails. Parser tests prove pinned/provided source exclusivity and duplicate/missing flag refusal. TypeScript, Prettier, diff whitespace validation, and the full production Electron/Vite main/preload/renderer bundle pass.

The one diagnostic invocation that exposed the unsafe v0.11.8 `--version` behavior exited on its own. Read-only follow-up showed the authoritative Desktop database mtime remained `2026-07-15 17:27:50`; browser-profile `Network Persistent State`, `Local Storage/leveldb/LOG`, and a `blob_storage` directory were touched at the probe time. No cleanup was attempted because those paths are user-owned live state.

## Required proof still absent

- Capture, verification, authenticated materialization, and isolated Classic launch have production bootstrap entry points, including a one-step snapshot-to-launch command. Desktop-owned capture is wired; a normal Core-present installation intentionally stops at `CORE_QUIESCENCE_UNAVAILABLE` until `FerroxLabs/wayland#896` is accepted, so the complete operator journey remains gated rather than falsely green.
- The compiled catalog now roots the exact published v0.11.8 release assets and executable hashes. Dependency-light production commands stream-download only the compiled current-platform asset and prepare it with exact asset, extractor, executable, and platform publisher verification. The actual macOS ARM64 asset-to-binary preparation chain passed and produced a non-authorizing receipt without starting Classic. Pinned-release mode now composes download, trusted extraction, sealed snapshot materialization, and launch as one operator action; release-asset and binary-preparation receipts still cannot authorize launch on their own. Windows Authenticode still needs a recovery-specific packaged Windows receipt, Linux is checksum-only, the two packaged Windows extractor resources now have a real macOS ARM64 packaged-host presence/hash receipt, and no packaged end-to-end recovery has consumed the chain.
- Desktop schema downgrade and isolated Core default/named-profile placement have local fixture proof only; no packaged rollback/re-upgrade journey yet proves the complete Desktop/Core state corpus or two representative non-Core adapters.
- There is no signed candidate artifact or cold-install/update/recovery/rollback/boot/re-upgrade receipt on macOS arm64/x64, Windows arm64/x64, or Linux arm64/x64.
- There is no executed `v0.11.8 -> candidate -> recovery -> re-upgrade` journey.
- `receipts/M0A.json` remains absent because the release evidence needed to populate it does not exist.

## Decision

The local engineering boundary is materially safer, but M0A remains a hard stop. Cockpit may remain an explicit development opt-in; no real-user cohort, migration, rollback-floor change, or release-complete claim is authorized by this receipt.
