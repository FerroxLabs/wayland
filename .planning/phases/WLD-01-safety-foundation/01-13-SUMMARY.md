---
phase: WLD-01-safety-foundation
plan: 13
subsystem: office-authoring
tags: [officecli, supply-chain, skills, capability, fail-closed]
requires: [01-40]
provides:
  - Exact OfficeCLI executable, contract, capability, skill, and ledger lockstep
  - Fail-closed current-build-host Office authoring construction evidence
  - Local-only OfficeCLI PATH authority with a digest-pinned packaged fallback guard
affects: [01-24, 01-31]
requirements-completed: []
requirements-addressed: [COW-01, SAF-05]
status: construction-complete-pending-independent-audit
completed: 2026-07-19
---

# Phase 1 Plan 13: OfficeCLI Lockstep Summary

Desktop now reports Office authoring construction evidence only when the target binary, publisher signature, versioned authoring contract, shared capability fixture, complete bundled OfficeCLI skill set, smoke surface, and executable ledger all match one exact local-only authority. This is construction evidence only; independent acceptance and serial integration remain pending.

## Accomplishments

- Bound all 28 commands exposed by OfficeCLI v1.0.136, the exact DOCX/XLSX/PPTX format set, five authoring operations, schema elements, preview command, and nine bundled OfficeCLI skills into the versioned contract.
- The producer re-hashes every declared skill from its canonical contained path, rejects missing, duplicate, substituted, unexpected, symlink-escaped, or digest-mismatched skills, and embeds the deterministic proof in the target manifest.
- The generated manifest binds the canonical contract digest, shared capability fixture digest, verified third-party executable ledger and OfficeCLI entry digests, executable digest, publisher evidence, executable contract, and specialist smoke proof.
- Capability classification rejects unknown critical fields, unsupported provenance, target/version/binary/publisher drift, stale or altered contract/capability/skill/ledger proof, duplicate or extra declared surfaces, and self-asserted readiness.
- One shared pure classifier now governs both capability evidence and PATH exposure, including reported-version and complete smoke-proof validation.
- Shell PATH exposure requires an executable target-exact binary and exact authority manifests, rejects symlink substitution and existence-only manifests, and never consults npm/global/cache fallback executables.
- A digest-pinned managed guard immediately follows the verified binary on PATH, preventing a missing or disappearing bundle from exposing an unrelated user/global `officecli` while preserving every unrelated user tool.
- Both guard files are critical packaged resources: omission, symlink substitution, non-regular-file substitution, size drift, or digest drift fails package verification, and the POSIX guard must remain executable.
- Producer and runtime skill inventories reject unsupported top-level OfficeCLI symlinks or non-directory namespace entries as well as nested substitution.
- Book Production now uses only Wayland's verified packaged OfficeCLI capability and never instructs the user or agent to install, bootstrap, or substitute another executable.

## Exact construction proof

- Tested implementation commit: `536f18d790ece1e4b238dede20cb14d509ba5129`.
- Tested implementation tree: `0575c334cdcd30539da228b1a23d6709ae13b4ee`.
- Focused successor suite: 7 files, 171 tests passed.
- Typecheck: passed.
- Changed-file oxlint: 0 warnings, 0 errors.
- Oxfmt and `git diff --check`: passed.
- Executable ledger verification: `wayland-third-party-executables/1.0`, four exact entries.
- Exact current-build-host producer `node scripts/prepareOfficeCli.js`: passed for `darwin-arm64`.
- Clean-download and verified-cache producer runs emitted byte-identical target manifests.
- Emitted local target-manifest SHA-256: `b8e5e2fe3f85cf4f4dbc713c7360f743b0c44c14dcfcb3ad8e21aafa550b07c7`.
- Live local classifier: `office.native-authoring` available for the pinned `darwin-arm64` binary and exact fixture digest.
- Exact-commit aggregate: 1,430 Vitest files passed, 21 skipped; 15,148 tests passed, 145 skipped; 226/226 Bun-native tests passed.
- Reproducible command logs, environment identity, output hashes, and machine receipt are retained under `evidence/01-13-r5-536f18d7/`.

## Authority boundary

This packet does not mint immutable current-host evidence, external C0-A acceptance, C0-B readiness, C1 artifact acceptance, six-target signed-app closure, hosted fallback consent, packaging, deployment, canary, release, or production authority. Plans 01-24 and 01-31 own the next acceptance boundaries.

## Deviations from plan

`src/common/capabilities/manifest.ts` was added explicitly to plan ownership because the shared capability fixture must derive its version, formats, and operations from the same OfficeCLI contract instead of duplicating them. The first independent audit found four fail-open paths: global fallback when the bundle was absent, a weaker PATH validator, non-executable binary advertisement, and top-level skill symlink bypass. A later package-gate audit found that identical-byte guard symlinks and a non-executable POSIX guard could pass the post-package verifier even though runtime rejected them. The successors close those gaps, preserve the earlier installed-file re-hashing repair, and keep package verification at least as strict as the runtime guard boundary.

## Acceptance state

Evidence regeneration found and repaired a producer determinism defect: the
verified-cache path previously dropped `reportedVersion` and rewrote immutable
release provenance as the incidental cache path. The same verified bytes now
produce a byte-identical authority manifest on clean and cached runs.

Independent audit then rejected the predecessor because exact expected bytes
could be presented through an out-of-bundle symlink. The R5 successor binds the
bundle, manifest, and executable to stable no-follow filesystem identities and
revalidates them after reading. Its clean aggregate proof supersedes one
contention-affected observation retained only as diagnostic history.

The exact source commit identified above must be independently audited. Until
that successor is accepted and serially integrated, plan 01-13 remains
constructed rather than accepted.
