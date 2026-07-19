# M1F Flux routing-evidence producer acceptance receipt

Status: merged producer corpus and both composition roots accepted; live-transport and canary gates open  
Date: 2026-07-15  
Desktop baseline: `v0.11.18`  
Desktop branch: `codex/desktop-cockpit-wave0`  
Coordination issue: `FerroxLabs/wayland#888`

## Producer pin

- Exact merged Flux commit: `6e7fa427ee6c062b531e67c0e7e1cedfd7aff208`
- Producer behavioral baseline: `6eda360c8497b4dab0e26003ad7bad03d0aa9c6f`
- Contract: `1.0.0`
- Generator: `1.0.1`
- Corpus: 12 canonical fixtures plus schema and manifest
- Bundle digest: `sha256:128b817984ff2bb76b8fd8c10d1f35b4ce3ac24498fe1f693068fc4e6d1ce9fd`
- Schema digest: `sha256:356fb1f472c9909bc5a11003edf8e4e30e93ad3d06c8607316973acfb490e85a`

The vendored corpus was compared with the exact merged Git object. The Desktop drift test recomputes every manifest file hash and the aggregate bundle digest from local bytes, rejects missing or extra corpus files, and pins the merge commit separately from the producer baseline.

## Desktop consumer evidence

- Replays all 12 canonical capability/event fixtures through `evaluateFluxRoutingCapability` or `consumeFluxRoutingEvidence`; it does not treat successful JSON parsing as acceptance.
- Uses the producer's corrected `no_flux` expectation directly for disconnected and invalid-credential fixtures. No Desktop filename exception or profile rewrite remains.
- Requires the five-part expected correlation tuple and rejects malformed expected correlation, correlation drift, gaps, out-of-order events, conflicting duplicates, post-terminal events, missing terminals, malformed events, and unsupported contract/generator values.
- Mirrors the producer sequence semantics for override/route/connection ordering; attempt start/failure/retry references; circuit and fallback references; unique cost evidence; and success/failure terminal requirements.
- Enforces explicit-native identity, no Flux involvement, no reroute permission, exact precedence, and stream-wide fallback prohibition.
- Preserves unpriced cost as `null`/unknown rather than zero.
- Missing, stale, future-skewed, malformed, unavailable, or incompatible capability evidence resolves to `no_flux` and cannot support route, provider-attempt, or cost claims.

## Composition-root evidence

- `FluxRoutingEvidenceAdapter` is the atomic process-side claim boundary. It never enables customer-visible claims from the existing selected-model label, spawn-routing heuristic, or daemon-presence probe.
- Electron/Desktop initializes its own adapter from `initAllBridges`; standalone Web/Cloud initializes a separate adapter from `initBridgeStandalone`.
- Both production roots start at `no_flux` / `capability_absent` with route explanations, provider attempts, and cost claims disabled.
- Both roots replay the complete serialized request fixture corpus through the same capability inspector and semantic reducer. A later bad capability or stream atomically clears all previously accepted events, summary state, and claim permissions.
- The adapter deliberately has no guessed fetch path. The merged Flux producer tree adds the replay contract but no live gateway/daemon endpoint or framing transport. The existing `FluxDesktopService` is test-only with no production caller and is not treated as evidence.

## Exact proof commands

```sh
bunx vitest run tests/unit/fluxRoutingEvidence.test.ts
bunx vitest run tests/unit/fluxRoutingEvidence.test.ts tests/unit/process/flux/FluxRoutingEvidenceAdapter.test.ts tests/unit/process/utils/initBridgeStandalone.test.ts
bunx vitest run tests/unit/FluxDesktopService.test.ts tests/unit/common/flux.test.ts tests/unit/common/modelCapabilities.flux.test.ts tests/unit/common/modelCapabilities.fluxRouter.test.ts tests/unit/process/providers/fluxRouterRegistration.test.ts tests/unit/process/providers/resolveModelSecretsForSpawn.test.ts tests/unit/renderer/modelSelector/resolveSelectedProvider.test.ts tests/unit/renderer/acpModelSelectorFlux.dom.test.tsx tests/unit/renderer/acpFluxFailover.test.ts tests/unit/task/fluxRouting.test.ts tests/unit/task/fluxRoutingSafety.test.ts tests/unit/task/fluxRoutingResolvedModel.test.ts tests/unit/task/fluxRoutingRespawn.test.ts tests/unit/settings/routeThroughFlux.test.ts tests/unit/fluxRoutingEvidence.test.ts tests/unit/process/flux/FluxRoutingEvidenceAdapter.test.ts tests/unit/process/utils/initBridgeStandalone.test.ts
bun run typecheck
bunx oxlint src/common/routingEvidence/v1.ts tests/unit/fluxRoutingEvidence.test.ts
bun run test
bunx electron-vite build
git diff --check
```

## Results

- Focused contract consumer: 1 file, 6 tests passed.
- Contract plus composition roots: 3 files, 12 tests passed.
- Flux/provider/model-selection surface: 17 files, 145 tests passed.
- TypeScript typecheck: passed.
- Targeted lint: 0 warnings and 0 errors.
- Full exact-current Vitest corpus: 1,273 files passed and 19 skipped; 13,246 tests passed and 137 skipped.
- Production Electron/Vite build: passed; existing dynamic/static import and chunk-size warnings retained.
- `git diff --check`: passed.

## Open boundaries

This receipt accepts the merged producer contract and Desktop/Web/Cloud composition-root consumers. It does not claim full M1F completion or live routing-evidence UI delivery. Flux commit `6e7fa427` explicitly describes v1 as a serialization/replay boundary and publishes no live evidence endpoint or stream framing. A trusted producer transport must still deliver the capability response and complete correlated stream into the registered adapter before SC-14 route explanations, provider attempts, or cost claims can be enabled.

The live Anvil acceptance canaries remain credential-blocked until `AnvilTestKey2` is injected into Keychain. That external canary is separate from deterministic fixture acceptance and does not relax it.

Flux backlog issues `#863`, `#319`, `#434`, and stale `#112` are separate contracts and are not represented as closed by this receipt. Coordination issue `#888` remains open; Desktop does not close it.
