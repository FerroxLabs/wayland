# Wave 0 Strike checkpoint receipt

Status: **immutable local integration checkpoint; not a release or packet acceptance receipt**

## Identity

- Baseline release: Desktop `v0.11.18`
- Baseline commit: `1b1c1e91119e3352bec3958188254ee91f150492`
- Integration branch: `codex/desktop-cockpit-wave0`
- Checkpoint commit: `f6f7a81950c1ee2ca1629bbcc5c5e78045eb2fa2`
- Checkpoint tree: `191ddfd1cbe60cc4934ce1586d9996eb7766ef9e`
- Commit subject: `feat(desktop): checkpoint Wave 0 overhaul`
- Proof host: macOS ARM64
- Proof date: `2026-07-16`

This checkpoint supersedes descriptions of the candidate as only an
uncommitted working tree. It binds the current 587-file Wave 0 implementation
to a local commit and tree so isolated remediation lanes can start from exactly
the same bytes. It does not promote M0A, M0B, M1 packaging, M1F live transport,
M1M/MCP-2, C0, M2/C1+, release, enrollment, or cohort status.

Generated Signal CLI extraction directories under
`src/process/channels/signal-cli-runtime/tmp-*` are explicitly ignored and are
not part of the checkpoint.

## Isolated remediation lanes

| Lane | Branch | Boundary |
|---|---|---|
| Safety | `codex/desktop-strike-safety` | Constitution archive-before-mutation and restore |
| Runtime truth | `codex/desktop-strike-runtime` | MCP exact-active-session readiness; no probe-derived green state |
| Shell resilience | `codex/desktop-strike-experience` | Classic independence from Cockpit import/render failure |
| Packaging follow-up | `codex/desktop-strike-packaging` | Exact platform/architecture output selection, DMG retry identity, and fresh optional-resource verification; starts from integrated `623dace07` |
| Constitution FS helper | `codex/desktop-strike-constitution-fs` | New anchored native transaction backend and no-fallback wrapper only; starts from integrated `623dace07` |

Each lane must return a local commit, focused tests, TypeScript, bounded lint,
and `git diff --check`. Root integration remains the only authority permitted to
combine those commits. No lane may push, merge, release, deploy, close issues,
or edit another lane's files.

## Checkpoint proof

```text
rtk git diff --cached --check
rtk git commit -m "feat(desktop): checkpoint Wave 0 overhaul"
rtk git rev-parse HEAD
rtk git rev-parse HEAD^{tree}
rtk bun run typecheck
```

Results:

- staged diff whitespace validation: passed;
- local checkpoint commit: created;
- exact commit and tree: as recorded above;
- TypeScript: passed.

```text
rtk bun run test -- \
  tests/unit/process/services/constitution/constitutionArchive.test.ts \
  tests/unit/process/services/mcpServices/mcpConnectorArchive.test.ts \
  tests/unit/process/services/mcpServices/mcpProjection.test.ts \
  tests/unit/process/services/mcpServices/mcpSessionTruthGate.test.ts \
  tests/unit/process/services/mcpServices/runtimeMcpServers.test.ts \
  tests/unit/process/services/mcpServices/McpService.removeResult.test.ts \
  tests/unit/webserver/mcpConfigRoutes.test.ts \
  tests/unit/shellExperience.test.ts \
  tests/unit/cockpitNavigation.test.ts
```

Result: 9 files passed; 60 tests passed; zero failures.

## Remaining gates

- The checkpoint is local and has not been pushed or published.
- Historical full-suite/package results predate this exact commit and are not
  represented as exact-checkpoint proof.
- Each lane requires adversarial review before cherry-pick.
- Aggregate post-integration proof is still required.
- All packet, release, platform, live-vendor, enrollment, and cohort gates stay
  in their prior fail-closed state.

## Post-checkpoint integration ledger

This ledger records work derived from the immutable checkpoint. It does not
change the checkpoint identity or convert it into an acceptance receipt.

| Root commit | Result | Evidence boundary |
|---|---|---|
| `654456221` | Restored the full Vitest collection after checkpoint test-harness drift | Test-authority correction only |
| `705e5b890` | First Cockpit failure containment | Rejected as insufficient composition-root isolation; retained only as history pending the follow-up |
| `34c6cb6d1e393267a6cda72318c97975e15942ba` | Required `bun run test` and PR CI now execute every Bun-native suite as well as Vitest | Test-authority correction; not product acceptance |
| `b9f4e0baf828e735669beda811bd80a8c12df0ca` | Exact-session MCP publication and Core receipt correlation with process-local HMAC definition binding | Bounded runtime-truth implementation; no MCP-2 or live-vendor claim |
| `623dace0737f4f1644a32d8f839355cb48b11977` | Independent Classic/Cockpit lazy composition roots and session-only Cockpit failure recovery | Independent re-audit: zero HIGH; bounded Shell resilience only |

Exact integration baseline after those commits and before the pending Shell and
Safety corrections:

```text
rtk bun run typecheck
rtk bun run test
```

Results:

- TypeScript: passed;
- Vitest: 1,320 files / 13,657 tests passed; 19 files / 141 tests skipped;
- Bun native: 25 files / 189 tests passed; zero failures;
- aggregate command: passed.

The aggregate run also emitted pre-existing non-fatal harness warnings for
jsdom canvas, EventEmitter listener count, and nested `vi.mock` calls. They do
not invalidate the pass, but they remain explicit test-hygiene debt and may not
be represented as a warning-free run.

Production-build discovery:

```text
rtk bun run build
```

- ARM64 application, ZIP, and DMG were built and signed; the critical packaged
  resource verifier passed with the optional Hub resource absent.
- x64 application, ZIP, and DMG were built and signed, but the aggregate command
  exited 1 because the x64 verification pass also scanned the prior ARM64 app
  while applying x64 Core/OfficeCLI expectations. Independent source tracing
  confirms this exact-target selection defect as HIGH.
- Hub resource preparation returned HTTP 404 from both configured mirrors and
  continued as an explicitly optional capability.
- Signal CLI preparation reported that no binary was found after extraction,
  while later packaged-resource verification reported `signal-cli-runtime` as
  present. Independent inspection proves the package contains only temporary
  JSON-schema extraction debris and no `bin/signal-cli`; the generic directory
  check falsely reported `OK`. Signal also selects the host rather than package
  target architecture and may fall back to an unrelated archive. No Signal
  packaging claim follows from this run.
- Upstream v0.14.6 has no macOS/Windows native Signal asset. The independently
  downloaded Linux-native archive is pinned by observed SHA-256
  `c78639c2d3c14cd004872a99ecf129bd7d7c26ee7d9844d50c2b0afdafefea68`;
  it contains one x86-64 ELF executable with SHA-256
  `0f9850154f51a0ef0ffcb7a52a38c8aa794ec92a4ab6f76210e726c544c01798`.
  Only a source-pinned Linux-x64 implementation may report Signal present.
- The configured `FerroxLabs/waylandHub` repository itself returns GitHub 404
  and no accessible FerroxLabs Hub repository was found. Hub remains absent and
  optional; stale local bytes cannot substitute for that missing producer.
- DMG retry uses the first matching `mac*` directory instead of the exact
  current platform/architecture output, allowing stale or wrong-architecture
  substitution. Generic non-empty-directory validation creates adjacent stale
  resource risk, and Hub skip can retain stale bytes by returning before
  cleanup.

The build is therefore recorded as **failed evidence**, not as a packaging
pass, despite both macOS application bundles being produced and signed.

Current hold:

- Shell follow-up source commit `fe685db903956d7d63af4247c589a4513d513f15`
  was independently re-audited with zero HIGH and integrated as `623dace07`.
- Constitution source commit `ed24371fae5ac03b1b7db5a514a17e0eba6984fa`
  is rejected pending remediation of five HIGH filesystem/integrity findings.
- Constitution follow-up `7f7a20849076413b3296dec13f5eea7d54fa6655`
  passed 3 files / 57 tests and closes bounded static-path and hosted-error
  cases, but independent review retains three HIGHs: forgeable public digest,
  parent/path TOCTOU, and unbound recovery/displaced-byte mutation. It is not
  integrated; a dirty successor is not evidence.
- A separate hosted Constitution journey audit found three HIGH authorization,
  specialist-parity, and read-versus-reset findings. It follows the filesystem
  correction as a separate isolated remediation.
- Four packaging HIGHs are assigned to an isolated exact-target/fresh-resource
  correction lane. Until it passes hostile tests and independent review, the
  production build remains failed evidence and M1 stays locked.
