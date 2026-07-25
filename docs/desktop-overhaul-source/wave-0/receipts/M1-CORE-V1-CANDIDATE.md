# M1 Core v1 delivered producer validation receipt

Status: Desktop consumer validation passed; exact producer commit published and accepted
Date: 2026-07-15
Desktop baseline: `v0.11.18`
Desktop branch: `codex/desktop-cockpit-wave0`
Coordination issue: `FerroxLabs/wayland#887`

## Producer pin

- Exact Core commit: `d0aa0abc75afe056cc5434fcd652efa6d474ab0c`
- Contract: `wayland-desktop-core` `1.0`
- Generator: `wcore-desktop-contract-gen/1`
- Corpus: 11 commands, 39 events, 110 fixtures
- Fixture digest: `sha256:2c611ffad0096289fc6a68e93921233821b9d75028b21b9a85c67b293eadac2b`
- Schema digest: `sha256:37c51099256e62226306fa02f7a8637cc6a9a102df8e7c41c6e73253f7638271`
- Source-input digest: `sha256:c3fb582801bbf7ab75a9fefe45e79e5cafb28013bc900a6515cfd7462650863e`

The corpus was imported from the exact Git object. The dirty Core working tree was not consumed.

## Desktop implementation evidence

- Runtime descriptor/digest negotiation and pinned Ajv 2020 schema validation.
- Bounded 8 MiB, fatal-UTF-8 JSONL framing on the production WCore stdout path.
- Fail-closed malformed, version/digest mismatch, unsupported required extension, unknown criticality, gap, regression/out-of-order, conflicting duplicate, and terminal-conflict behavior.
- Explicit drop-only behavior for unknown `critical:false` events and absorbing post-terminal nonterminals.
- Semantic reducers for ordinary turns/tools, effective execution-policy revisions, Core workflow/node/child lifecycle, and Anvil receipt/invalidation replay.
- Conservative persistent Anvil watcher: any later workspace mutation revokes live trust; unavailable/erroring recursive watch fails closed.
- Disconnect/reconnect revokes live publication-bound trust. Fresh Core validation is required.
- Host-derived `anvil_trust_changed` propagation updates display trust without manufacturing a Core invalidation receipt.
- Session-level accepted policy/workflow/Anvil evidence crosses `WCoreAgent` and `WCoreManager` before the empty-message guard.
- Host-delegated channel and scheduling ownership remains unchanged.

## Deferred producer items closed by Desktop

- `ordinary_turn_tool_replay_reducer`
- `anvil_desktop_replay_reducer`
- `anvil_persistent_mutation_watcher`

## Exact proof commands

```sh
bunx vitest run tests/unit/process/agent/wcore/desktopContractV1.test.ts tests/unit/wcoreStderrSurfacing.test.ts tests/unit/WCoreManagerEventBus.test.ts
bunx vitest run tests/unit/WCoreManager*.test.ts tests/unit/wcore*.test.ts tests/unit/process/agent/wcore/*.test.ts tests/unit/process/task/wcoreEffort.test.ts tests/unit/process/agent/acp/wcoreUserMcpInjection.test.ts tests/unit/scripts/wcorePinLockstep.test.ts
bun run typecheck
bunx electron-vite build
bun run test
bunx oxlint src/process/agent/wcore/anvilMutationWatcher.ts src/process/agent/wcore/desktopContractV1.ts src/process/agent/wcore/index.ts src/process/agent/wcore/protocol.ts src/process/task/WCoreManager.ts tests/unit/process/agent/wcore/desktopContractV1.test.ts tests/unit/wcoreStderrSurfacing.test.ts
git diff --check
```

## Results

- Contract/raw-wire/manager focus: 3 files, 54 tests passed.
- Full WCore/Desktop integration surface: 44 files passed; 483 tests passed and 3 skipped.
- TypeScript typecheck: passed.
- Production Electron/Vite build: passed; existing bundle warnings retained.
- Full exact-current Vitest corpus: 1,269 files passed and 19 skipped; 13,219 tests passed and 137 skipped.
- Targeted lint: 0 errors; one pre-existing test-helper warning.
- `git diff --check`: passed.
- Publication follow-up: remote commit reachability verified; the focused contract/raw-wire/manager suite remained 54/54 and the latest full exact-current Desktop corpus passed 13,241 tests with 137 skipped across 1,272 passed and 19 skipped files, followed by a successful production build.

## Publication and packaging boundary

Desktop verified that exact commit `d0aa0abc75afe056cc5434fcd652efa6d474ab0c` is reachable from the published `FerroxLabs/wayland-core` repository and `origin/feat/887`. The source-contract publication gate is closed; Desktop no longer depends on a dirty or local-only Core checkout.

This does not silently replace the packaged engine binary. `scripts/prepareWaylandCore.js` remains pinned to released `v0.12.25` until a separately authorized Core binary/release uptake passes bundled/previous/candidate compatibility and packaging proof. Issue #887 remains open under the project coordination policy.

M1 as a whole remains open for bundled/previous/candidate release compatibility and later Cockpit persistence/rendering completion. F13/F14 are additive Core work and do not alter this accepted v1 pin unless they publish a versioned wire-contract change.
