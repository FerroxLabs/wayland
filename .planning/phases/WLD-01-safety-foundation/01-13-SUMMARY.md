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
status: constructed
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
- Both guard files are critical packaged resources: omission, size drift, or digest drift fails package verification.
- Producer and runtime skill inventories reject unsupported top-level OfficeCLI symlinks or non-directory namespace entries as well as nested substitution.
- Book Production now uses only Wayland's verified packaged OfficeCLI capability and never instructs the user or agent to install, bootstrap, or substitute another executable.

## Exact construction proof

- Tested implementation commit: `045fdf126673c56ebc9c10b5b300d0ae942c7610`.
- Tested implementation tree: `a4e6aed03d51285e963180d115eabe14ab231beb`.
- Focused successor suite: 7 files, 166 tests passed.
- Typecheck: passed.
- Changed-file oxlint: 0 warnings, 0 errors.
- Oxfmt and `git diff --check`: passed.
- Executable ledger verification: `wayland-third-party-executables/1.0`, four exact entries.
- Exact current-build-host producer `node scripts/prepareOfficeCli.js`: passed for `darwin-arm64`.
- Emitted local target-manifest SHA-256: `0d779185b21da928f7919d38624b0bd6cc4d8972d3bd00ea986480b5e56da363`.
- Live local classifier: `office.native-authoring` available for the pinned `darwin-arm64` binary and exact fixture digest.
- Exact-commit aggregate: 1,430 Vitest files passed, 21 skipped; 15,143 tests passed, 145 skipped; 226/226 Bun-native tests passed.

## Authority boundary

This packet does not mint immutable current-host evidence, external C0-A acceptance, C0-B readiness, C1 artifact acceptance, six-target signed-app closure, hosted fallback consent, packaging, deployment, canary, release, or production authority. Plans 01-24 and 01-31 own the next acceptance boundaries.

## Deviations from plan

`src/common/capabilities/manifest.ts` was added explicitly to plan ownership because the shared capability fixture must derive its version, formats, and operations from the same OfficeCLI contract instead of duplicating them. The first independent audit found four fail-open paths: global fallback when the bundle was absent, a weaker PATH validator, non-executable binary advertisement, and top-level skill symlink bypass. The successor closes all four, preserves the earlier installed-file re-hashing repair, and adds package-level guard integrity checks discovered during repair review.

## Acceptance state

The exact commit containing this summary must be independently audited. Until that successor is accepted and serially integrated, plan 01-13 remains constructed rather than accepted.
