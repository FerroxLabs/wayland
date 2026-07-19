---
phase: WLD-01-safety-foundation
plan: 37
status: construction-complete-pending-independent-audit-and-aggregate
verified_source_commit: 4dad5ba75493086f8d169895a02f471bee5b2354
verified_source_tree: c3a8e522d3f676c53ccdca52a1073da6b1810a8a
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
- Bound signed acceptance time to a verifier-owned production clock with an
  explicit 60-second future-skew ceiling and a stable fail-closed reason code.
- Proved the exact skew boundary, just-inside and just-outside values, far-future
  replay, production rejection of caller time injection, and validity only once
  verifier-owned time reaches the allowed boundary.
- Made the detached clean-worktree proof supply the installed dependency tree,
  so it exercises the gate source instead of failing before runtime import.
- Removed all scoped execution lint and format debt.

## Exact verified source identity

- Rejected R3 source commit: `bb939cf15aa9198c153fa1ab6ca1ad98510275c9`
  (audit commit `0fa2ee789516cdcf9c150dd2da2ace334adaa2b5` proved a
  future-dated signed receipt could authorize acceptance before its claimed time)
- Verified R4 source commit: `4dad5ba75493086f8d169895a02f471bee5b2354`
- Verified R4 source tree: `c3a8e522d3f676c53ccdca52a1073da6b1810a8a`
- `PACKET-GATES.json`: `sha256:cb369c0be85428c931d243193470c4e47134f7b7439a52c23b76a4fc7423fa27`
- `PACKET-CONTRACTS.json`: `sha256:af4fab1b4cee50702a36bdcdc3d9a622528a89163f43491bf299d71d6ba6111d`
- `packet-gate-lib.mjs`: `sha256:056e2ccbd6c00968ef029b6ab1891fa3c7d5bdc30ea3c7a39d82f2e0cd747d7d`
- `wayland-gsd-gate.mjs`: `sha256:6e78da8396891eedd13d66df75eea19e6ea247b68ea1c1e088574e00eb7b04bc`
- `desktop-gsd-next.mjs`: `sha256:befd5a40e3caafe976d9f95b013c9840f175ace5e906ed48ff61cb1645de48e7`
- `check-packet-gate.mjs`: `sha256:4682121fed5c095dc8f98c45e2ca3500d479c181efab63779031a0fe8b4e3683`
- `DESKTOP-GSD-ADMISSION.json`: `sha256:91e4011849b054b94ecdac5f1f702ec4f9201d44eec6ef0021447370116d6c91`
- `clean-worktree-smoke.mjs`: `sha256:d51efcf9725157a75c39d1e9574c28ac727804d75e17e8f4a908a762da4ac217`

This summary is intentionally a successor record rather than a circular claim
about its own commit. Reproduce the source identity with `git show` at the
verified source commit and compare the digests above. The documentation-only
successor must retain those exact source bytes.

## Proof

- `node --test .planning/execution/*.test.mjs`: 45/45 tests passed.
- `node .planning/execution/clean-worktree-smoke.mjs`: passed.
- Exact R4 aggregate proof is pending independent successor audit and the
  reserved aggregate slot. R3 aggregate results do not transfer to R4.
- `bun run typecheck`: exit 0.
- `bun run lint -- .planning/execution`: 0 warnings, 0 errors.
- `bun run format:check -- .planning/execution ...`: passed.
- `git diff --check`: exit 0.
- Reproducible sanitized logs, environment identity, exact source digests, and
  a machine-readable receipt are retained under `evidence/01-37-r4-4dad5ba7/`.

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
