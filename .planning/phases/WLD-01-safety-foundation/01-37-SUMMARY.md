---
phase: WLD-01-safety-foundation
plan: 37
status: construction-complete-pending-independent-audit
verified_source_commit: 4ff95c34dda5af40c66ba5e2d107a977d20ec04d
verified_source_tree: 23db2f4baffedb5c774d993ebaae14990514d9d9
evidence_model: successor-record-for-verified-source
---

# Plan 01-37 Summary: Schema-v2 target verification source

## Delivered

- Classified every sealed P1-P7 gate as exactly `entry` or `acceptance`.
- Preserved the complete existing prerequisite and physical-absence DAG.
- Added the bounded `M0B-OBSERVATION-COMPLETE` contract and dedicated
  `P1-M0B` and `P1-FLUX-PRODUCER` acceptance gates.
- Required every acceptance gate to declare and authenticate a non-empty
  target separately from its prerequisites.
- Kept entry gates non-promoting with `accepted_targets: []`.
- Bound receipt authorization to the complete schema-v2 gate object so v1
  prerequisite-only authorization cannot replay.
- Added fail-closed validation for unclassified and mixed-schema gates, entry
  targets, empty acceptance targets, unknown contracts, duplicate targets,
  prerequisite/target overlap, both/neither exclusive targets, and stale or
  substituted candidate evidence.
- Preserved deterministic reuse of one physical-absence receipt across
  independent exact-one groups while rejecting duplicates within a list,
  across required/alternative categories, and across `any` groups.
- Passed the sealed production P5/P6 manifest through the real `checkGate`
  validator in regression proof.
- Added stable `reason_code`/`error_code` failures and proved malformed receipt
  and config excerpts plus external paths do not escape in verifier output.
- Closed the verifier check/use race by executing the exact wrapper and library
  byte snapshots whose SHA-256 digests were checked.
- Loaded the gate manifest and contract manifest from the pinned control commit
  and cloned all manifest, contract, and trust inputs before asynchronous work.
- Bound the acceptance key ID inside the signed receipt body and rejected
  duplicate public-key identities even when an attacker supplies different
  aliases.
- Replaced permissive date parsing with canonical millisecond-precision UTC
  validation for acceptance, validity-window, and revocation timestamps.

## Exact verified source identity

- Verified source commit: `4ff95c34dda5af40c66ba5e2d107a977d20ec04d`
- Verified source tree: `23db2f4baffedb5c774d993ebaae14990514d9d9`
- `PACKET-GATES.json`: `sha256:cb369c0be85428c931d243193470c4e47134f7b7439a52c23b76a4fc7423fa27`
- `PACKET-CONTRACTS.json`: `sha256:af4fab1b4cee50702a36bdcdc3d9a622528a89163f43491bf299d71d6ba6111d`
- `packet-gate-lib.mjs`: `sha256:e9183d6fd97852ca1e1b19319507ca1cd9d17207844841f0e94e579e15b6f89f`
- `wayland-gsd-gate.mjs`: `sha256:6e78da8396891eedd13d66df75eea19e6ea247b68ea1c1e088574e00eb7b04bc`
- `desktop-gsd-next.mjs`: `sha256:51ef53cfb9112bbc9d6d7e700f192136f8e3a2a5c89e4b190ed02d7c7d940148`

This summary is intentionally a successor record rather than a circular claim
about its own commit. Reproduce the source identity with `git show` at the
verified source commit and compare the digests above. The documentation-only
successor must retain those exact source bytes.

## Proof

- `node --test .planning/execution/*.test.mjs`: 45/45 tests passed.
- Post-source-commit `bun run test`: 1,430 Vitest files passed with 15,121 tests
  passed, followed by 226/226 Bun-native tests passed.
- `bun run typecheck`: exit 0.
- `bun run lint -- .planning/execution`: exit 0, with one pre-existing warning
  in unchanged `clean-worktree-smoke.mjs`.
- `git diff --check`: exit 0.

## Explicit non-claims

- This is repository construction evidence only, not packet acceptance.
- The installed verifier, wrapper, trust configuration, receipt store, and
  external control commit were not changed.
- No acceptance key was created or provisioned.
- This builder does not self-accept the candidate; an independent audit remains
  required.
- Plan 01-38 must independently install and pin these exact committed bytes,
  prove live schema-v2 output, and preserve rollback before any gate result can
  become external authority.
- Nothing was merged to the integration branch or main, pushed, released,
  deployed, or used to close a coordination issue.
