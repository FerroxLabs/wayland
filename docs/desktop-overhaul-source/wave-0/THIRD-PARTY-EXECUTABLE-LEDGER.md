# Third-party executable ledger — Wave 0

Status: **OPEN RELEASE GATE**  
Last verified: 2026-07-16

This ledger records native executables redistributed by the Desktop candidate.
An entry is not release-closed until provenance, license/notice compliance,
immutable bytes, update behavior, platform signing, packaged placement, runtime
selection, and removal/rollback are all proven for every supported target.

## OfficeCLI native authoring runtime

| Field | Current evidence | Gate |
|---|---|---|
| Upstream | `iOfficeAI/OfficeCLI` | Recorded |
| Release | `v1.0.136`, published 2026-07-14; tag commit `4ba79f0b984e141f57f58d4398ba2df29e8187e8` | Recorded |
| Upstream source identity | Lightweight tag points to an **unsigned** commit; GitHub verification reports `verified=false`, reason `unsigned` | Open: digest and platform-signature evidence must compensate; do not claim source-attested provenance |
| License | Apache-2.0; redistribution permitted subject to license/NOTICE retention | Recorded |
| Required notices | Upstream `NOTICE` plus bundled MIT notices for DocumentFormat.OpenXml 3.4.1, System.CommandLine 3.0.0-preview.2.26159.112, and .NET Runtime | Implemented locally; packaged-notice proof pending |
| Assets | macOS arm64/x64, Windows arm64/x64, Linux glibc arm64/x64, Linux musl arm64/x64 | Recorded |
| Immutable bytes | GitHub release API publishes SHA-256 digests for all eight assets; `scripts/bundled-officecli-shasums.json` pins the same values and preparation verifies before copy, execution, or packaging | Locally implemented; CI drift proof pending |
| Runtime contract | `wayland-officecli-authoring/1.0`, exact `1.0.136`, required commands/elements and DOCX/XLSX/PPTX smoke/validation | macOS arm64 locally proven; six-target packaged proof open |
| Background mutation | Upstream enables background auto-update by default; Wayland-managed environments force `OFFICECLI_SKIP_UPDATE=1` | Locally implemented; packaged process proof pending |
| Hosted/metered fallback | Legacy npm `officecli@0.2.79` removed from dependencies, trusted dependencies, ASAR rules, and runtime PATH | Locally implemented; lock/package proof pending |
| macOS identity | Local arm64 asset has a valid Developer ID signature from `AionUi Inc. (52JQX2HUSC)` and hardened runtime; raw-binary `spctl -t exec` assessment is rejected because it is not an app | Open: prove final app notarization and nested-code acceptance on arm64/x64 |
| Windows identity | Not inspected in this worktree | Open: Authenticode publisher, chain, timestamp, and packaged verification on arm64/x64 |
| Linux identity | SHA-256 only; no upstream detached signature identified | Open: document digest-only trust decision and verify packaged bytes on glibc/musl targets |
| Network/cost | Native authoring is local. Any hosted or metered generation path is unavailable by default and requires a separately brokered, explicit-consent product contract | Fail closed |
| Recovery/removal | Bundled runtime is release-owned and removed/replaced with the application artifact, not a mutable user-global install | Open: signed rollback and re-upgrade proof on six release targets |

### OfficeCLI update and compromise authority

- Technical owner: Desktop lane (`area:desktop-ui`). Release/disable decision authority: Sean as release owner; agents may prepare evidence and fail builds but may not ship or waive the gate.
- Decision deadline: re-evaluate this entry before every Desktop release and within 24 hours of an upstream security advisory, asset replacement/digest drift, certificate revocation, repository compromise notice, or credible report that the bundled runtime performs undisclosed network/metered work.
- Revocation triggers: any pinned digest mismatch; invalid/expired/revoked platform signature where one is required; upstream tag/asset mutation; license/NOTICE incompatibility; contract-smoke regression; background-update containment failure; or evidence that the native path can silently reach a hosted/metered fallback.
- Required disable path: `prepareOfficeCli` and packaged-resource verification must fail the candidate build for a revoked version; an already published affected build requires an emergency Desktop release that removes/denylists the runtime and reports Cowork Office authoring unavailable until a newly pinned version passes the complete gate. Runtime download/repair is forbidden.
- Receipt authority: this ledger plus immutable M0A/M8 candidate receipts containing the base commit, tracked-diff digest, untracked manifest/digests, lock digest, exact OfficeCLI asset/package digests, platform-signing evidence, and test artifacts. Narrative version claims cannot waive a failed or missing receipt.

Authoritative upstream evidence:

- Release and asset digests: https://github.com/iOfficeAI/OfficeCLI/releases/tag/v1.0.136
- License: https://github.com/iOfficeAI/OfficeCLI/blob/v1.0.136/LICENSE
- NOTICE: https://github.com/iOfficeAI/OfficeCLI/blob/v1.0.136/NOTICE
- Bundled third-party notices: https://github.com/iOfficeAI/OfficeCLI/blob/v1.0.136/THIRD-PARTY-NOTICES.txt
- Upstream update behavior: https://github.com/iOfficeAI/OfficeCLI#installation

## Exit criteria

1. Exact asset digest matches the pinned manifest before and after packaging.
2. Platform signing/notarization evidence is captured for every shipped target.
3. Notices ship in the installed product and are reachable from support/about.
4. Runtime resolution selects only the bundled verified binary for the managed
   Cowork path; incompatible or user-global binaries cannot masquerade as ready.
5. Background update is disabled in the actual spawned process environment.
6. Cold install, update, rollback, and re-upgrade preserve the executable and
   document-authority contract without introducing a hosted-cost path.
