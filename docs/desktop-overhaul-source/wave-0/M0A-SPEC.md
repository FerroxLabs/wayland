# M0A — Engineering safety

## Outcome

A newer Desktop build can inspect, back up, recover, and—when proven—transform state without allowing an older or incompatible binary to mutate live data.

## Required implementation

1. Read database `user_version` before schema initialization and fail closed when it is newer than the binary.
2. Return a typed compatibility result that distinguishes future schema, corruption, native-driver failure, and ordinary startup failure.
3. Inventory every state authority: SQLite/WAL, config, profiles, scheduler, artifacts, receipts, WebUI, external backend handles, secrets, and updater channel.
4. Build an application-consistent manifest/dry-run validator with schema, app version, target, hashes, mutation epoch, and incomplete-state reporting.
5. Build the external recovery path that operates on quarantined copies and prevents direct old-binary launch against unclassified future state.
6. Isolate pre-M0A builds by version namespace, update channel, and disposable/copied state.
7. Prove v0.11.8 → v0.11.18/candidate → recovery → re-upgrade on the supported target matrix, including Core plus two non-Core adapters. Constitution proof uses the exact historical transaction corpus and the complete authenticated projection, canonical delta, durable promotion/replay journal, explicit disposition, and encrypted rescue contract in `NATIVE-CONSTITUTION-V2-ACCEPTANCE.md`; restoring only the pre-Classic v2 snapshot is insufficient.

## Verification

- Unit: future version refuses before `initSchema`; database is never renamed/deleted as corruption.
- Integration: backup dry run rejects mutation, missing authority, hash drift, incomplete snapshots, and plaintext secret export.
- Recovery: direct old-binary misuse fails closed; quarantined copy validates before launch.
- Constitution: exact historical pending state reconciles before truth; signed
  Classic no-change, create/replace/delete promotion, partial restart,
  conflict, encrypted local-rescue preservation, pre-dispatch confirmed
  discard, and partial-commit disposition pass through Stage B/Stage C. Wave 0
  proves that portable rescue and destructive deletion entrypoints are absent;
  issue #903 owns their later independently audited protocol.
- Packaging: signed/cold-install/update behavior recorded for macOS arm64/x64, Windows arm64/x64, and Linux arm64/x64.

## Receipt fields

Baseline/candidate versions and commits, schema versions, artifact hashes/signing identities, state-authority coverage, historical fixture and harness provenance, authenticated projection/promotion/rescue receipt digests, exact commands, test results, skips, target eligibility, and rollback-floor decision.
