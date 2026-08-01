---
phase: WLD-D-inbox-repairs / D-01
verified: 2026-07-23T23:47:22Z
status: human_needed
score: 6/7 must-haves verified
behavior_unverified: 1
overrides_applied: 0
github_issue: 890
behavior_unverified_items:
  - truth: 'In a FUSED packaged build the baileys bridge boots via bundled Bun, stays up (no app.quit/code=0 → 12-reconnect error ladder), and reaches QR — and baileys runs correctly under bundled Bun'
    test: "Build a fused macOS app via the full electron-builder path (bun run dist:preview:mac — NOT --pack-only, NOT bun run package), revert the regenerated constitutionFsAuthority.generated.ts, then run node scripts/packaged-cockpit-smoke.mjs; enable WhatsApp personal/baileys; confirm the bridge child starts, does NOT immediately app.quit (no code=0), reaches QR (not error), no 'invalid JSON' bridge-stdout lines. Windows box confirmatory after macOS."
    expected: 'Bridge process starts and stays up under bundled Bun; channel reaches QR status; log shows no 12-reconnect error ladder and no stdout JSON pollution.'
    why_human: "#890 reproduces ONLY under the blown RunAsNode fuse, which is set solely by the electron-builder afterPack path — dev and `bun run package` are unfused, so no unit/integration test in this environment can exercise the actual bug or the baileys-under-bundled-Bun runtime risk. Requires a fused packaged build + the capability-seal receipts ceremony (WAYLAND_CAPABILITY_RECEIPTS_DIR); PARKED pending owner's call."
human_verification:
  - test: 'Fused macOS packaged smoke — enable WhatsApp personal/baileys on a `bun run dist:preview:mac` build, confirm bridge boots + stays up + reaches QR (not error), no code=0 exit, no invalid-JSON stdout lines.'
    expected: 'QR renders; no 12-reconnect error ladder.'
    why_human: 'Fuse only trips in the electron-builder packaged path; also settles the baileys-under-Bun compat risk. PARKED (capability-seal receipts ceremony).'
warnings:
  - "Planned artifacts `tests/integration/whatsappBridgeStdoutPurity.test.ts` and standalone `WhatsAppPlugin.consumeStdout.test.ts` were NOT created. The stdout pollution-tolerance behaviour was instead folded into WhatsAppPlugin.bridge.test.ts (two new tests). The dedicated integration test that spawns the REAL bridge.js and asserts every stdout line JSON-parses to a jsonrpc frame does not exist. Non-blocking for the goal (the invariant is partially covered by the unit pollution-tolerance test + the fd2 pino lock), but it is a real deviation from the plan's artifact list."
---

# Phase D-01: WhatsApp bridge fork→spawn fix (#890) — Verification Report

**Phase Goal:** In a packaged build, the WhatsApp personal/baileys bridge boots via a real runtime and stays up (does not `app.quit`/code=0 into the 12-reconnect error ladder); baileys logs never touch the fd1 JSON-RPC pipe; the fix is locked by tests. Root cause = the RunAsNode fuse breaking `child_process.fork`; fix migrates `forkBridge` to `spawn` via `resolveJsRuntime()`, mirroring the shipped #706 fix.
**Verified:** 2026-07-23T23:47:22Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Verdict

**GOAL MET at the level unit-verification + static analysis can prove**, with the fused packaged smoke as the single named remaining acceptance.

What is **proven** (code correctness + unit locks, this environment):

- `forkBridge` no longer calls `child_process.fork`; it spawns the resolved JS runtime.
- The #706/#890 trap is locked by a test that composes the **real, unmocked** resolver: a packaged build spawns bundled Bun, never `process.execPath`, never with `ELECTRON_RUN_AS_NODE`.
- baileys pino is pinned to fd2 (asserted `dest.fd === 2`, and confirmed at runtime — the test emits an NDJSON line to stderr).
- QR-to-stderr is gated on the `WAYLAND_BRIDGE_UNDER_PARENT` env flag; the invalid `process.send` heuristic is gone; the QR frame still emits to fd1 unconditionally.
- `handleFrame` tolerates stdout pollution (object-guard) without throwing or exiting; split frames reassemble.
- WhatsApp unit dir 84/84 pass; the 2 new files 10/10; `tsc --noEmit` exit 0.

What is **NOT proven** (pending): the fused packaged runtime — bridge actually boots, stays up, and reaches QR under bundled Bun. #890 only reproduces under the blown fuse (electron-builder afterPack path); dev and `bun run package` are unfused. The fused packaged smoke is PARKED (capability-seal receipts ceremony). Note the fix spawns the bundled Bun binary directly, sidestepping the fuse by construction — so the residual runtime risk the smoke would close is baileys-under-bundled-Bun, not the fuse itself.

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                   | Status                         | Evidence                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `forkBridge` spawns via `resolveJsRuntime()` + `buildBridgeSpawnConfig`; no `child_process.fork` in the bridge path     | ✓ VERIFIED                     | `WhatsAppPlugin.ts:34` `import { spawn }` (was `fork`); `:697-707` builds config from `resolveJsRuntime()` and calls `spawn(command, argv, {stdio, env})`. Grep: zero `fork(` calls in `whatsapp/` or `whatsapp-bridge/` — only a README note and comment strings remain.                                           |
| 2   | Packaged build spawns bundled Bun, never `process.execPath`/`ELECTRON_RUN_AS_NODE` (the #890 trap)                      | ✓ VERIFIED                     | `bridgeSpawnConfig.ts` is pure; `bridgeSpawnConfig.test.ts` composes the **real** `resolveJsRuntimeWith` (no mock): packaged→`command===BUN`, `!==EXEC`, `env.ELECTRON_RUN_AS_NODE` undefined; packaged+no-Bun→`node`, never EXEC; dev→EXEC + `ELECTRON_RUN_AS_NODE=1`. 10/10 pass.                                 |
| 3   | baileys pino pinned to fd2 so logs can't corrupt fd1 frames                                                             | ✓ VERIFIED                     | `bridgeLogger.js` `createBridgeDestination()` = `pino.destination(2)`; `baileys.js:121` uses `createBridgeLogger()`. `bridgeLogger.test.ts` asserts `dest.fd === 2` and `!== 1`; runtime shows the NDJSON warn line emitted to stderr, not fd1.                                                                     |
| 4   | QR-to-stderr gated on `WAYLAND_BRIDGE_UNDER_PARENT`, replacing the invalid `process.send` heuristic                     | ✓ VERIFIED                     | `baileys.js:197-201` `underParent = process.env.WAYLAND_BRIDGE_UNDER_PARENT === '1'` (old `typeof process.send` gone from code); env flag set in `bridgeSpawnConfig.ts` and asserted by test. `baileys.js:210` `emit('qr.update',{qr})` is OUTSIDE the guard → QR frame still reaches fd1/renderer unconditionally. |
| 5   | `handleFrame` tolerates stdout pollution (object-guard) without throw/exit                                              | ✓ VERIFIED                     | `WhatsAppPlugin.ts:805` `if (typeof parsed !== 'object'                                                                                                                                                                                                                                                             |     | parsed === null) return;`then guarded`'id' in`/`'method' in`. `consumeStdout`line-buffers → split frames reassemble. Pollution-tolerance tests (in`WhatsAppPlugin.bridge.test.ts`) emit app logs, pino NDJSON, primitives `5`/`true`, non-JSON, `[]`, then a valid frame → no throw + valid frame resolves; split-chunk frame reassembles. |
| 6   | Full unit suite green + tsc clean                                                                                       | ✓ VERIFIED                     | `npx vitest run tests/unit/.../whatsapp/ --project node` → 84 pass / 0 fail; the 2 new files 10/10 verbose. `npx tsc --noEmit` exit 0, 0 errors.                                                                                                                                                                    |
| 7   | FUSED packaged build: bridge boots via bundled Bun, stays up (no code=0/error ladder), reaches QR; baileys OK under Bun | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Fuse trips only in the electron-builder afterPack path; unreproducible in dev / `bun run package`. Fused packaged smoke PARKED (capability-seal receipts). See Human Verification.                                                                                                                                  |

**Score:** 6/7 truths verified (1 present-but-behavior-unverified — the fused packaged runtime, unreproducible by construction in this environment).

### Required Artifacts

| Artifact                                               | Expected                                   | Status                 | Details                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/.../whatsapp/WhatsAppPlugin.ts`                   | fork→spawn migration + object-guard        | ✓ VERIFIED             | spawn import; helper-driven spawn; hardened handleFrame. Wired (imports bridgeSpawnConfig + resolveJsRuntime). |
| `src/.../whatsapp/bridgeSpawnConfig.ts`                | pure spawn-config builder                  | ✓ VERIFIED             | Pure, no fs/process; imported by WhatsAppPlugin.ts and its test.                                               |
| `src/.../whatsapp-bridge/backends/bridgeLogger.js`     | pino pinned fd2                            | ✓ VERIFIED             | Imported by baileys.js; fd2 asserted.                                                                          |
| `src/.../whatsapp-bridge/backends/baileys.js`          | fd2 logger + env-flag QR gate              | ✓ VERIFIED             | Uses createBridgeLogger; env-flag gate; QR emit unchanged.                                                     |
| `tests/unit/.../whatsapp/bridgeSpawnConfig.test.ts`    | #706 regression lock (real resolver)       | ✓ VERIFIED             | 7 assertions, unmocked resolver.                                                                               |
| `tests/unit/.../whatsapp/bridgeLogger.test.ts`         | fd2 lock                                   | ✓ VERIFIED             | 3 tests, asserts fd===2.                                                                                       |
| pollution-tolerance test                               | parse tolerance lock                       | ✓ VERIFIED (relocated) | Folded into `WhatsAppPlugin.bridge.test.ts` (2 tests) rather than a standalone `consumeStdout.test.ts`.        |
| `tests/integration/whatsappBridgeStdoutPurity.test.ts` | spawn real bridge.js, assert stdout purity | ✗ MISSING              | Planned integration artifact not created. WARNING — see below.                                                 |

### Key Link Verification

| From                        | To                                   | Via                                            | Status  |
| --------------------------- | ------------------------------------ | ---------------------------------------------- | ------- |
| `WhatsAppPlugin.forkBridge` | `resolveJsRuntime()`                 | direct call, result → `buildBridgeSpawnConfig` | ✓ WIRED |
| `buildBridgeSpawnConfig`    | `spawn(command, argv, {stdio, env})` | destructured config                            | ✓ WIRED |
| `baileys.js`                | `bridgeLogger.createBridgeLogger()`  | import + call at logger init                   | ✓ WIRED |
| `forkBridge` env            | `baileys.js` QR gate                 | `WAYLAND_BRIDGE_UNDER_PARENT` env round-trip   | ✓ WIRED |

### Behavioral Spot-Checks

| Behavior                   | Command                                                                            | Result                                  | Status         |
| -------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- | -------------- |
| WhatsApp unit dir          | `npx vitest run tests/unit/.../whatsapp/ --project node`                           | 84 pass / 0 fail                        | ✓ PASS         |
| New spawn/logger files     | `npx vitest run bridgeSpawnConfig.test.ts bridgeLogger.test.ts --reporter=verbose` | 10 pass / 0 fail; pino NDJSON on stderr | ✓ PASS         |
| Typecheck                  | `tsc --noEmit`                                                                     | exit 0, 0 errors                        | ✓ PASS         |
| Fused packaged bridge boot | `dist:preview:mac` + `packaged-cockpit-smoke.mjs`                                  | not run (parked)                        | ? SKIP → human |

### Anti-Patterns Found

None blocking. No `TODO/FIXME/XXX` introduced. The remaining `fork(` string hits are a README note and explanatory comments about the removed heuristic — not live code.

### Warnings

- The planned dedicated integration test (`tests/integration/whatsappBridgeStdoutPurity.test.ts`) and standalone `WhatsAppPlugin.consumeStdout.test.ts` were not created; the pollution-tolerance behaviour was instead locked in `WhatsAppPlugin.bridge.test.ts`. The unit locks cover parse-tolerance and fd2 routing; the missing integration test would add a real-subprocess stdout-purity layer. Non-blocking for the phase goal, but a deviation from the plan's declared artifacts. Recommend either adding the integration test or recording the fold-in decision in D-01-SUMMARY.md.

### Gaps Summary

No goal-blocking gaps. The code fix is correct and the Wave-0 unit locks that would have caught #890 are in place and green, with the fuse invariant asserted against the real resolver. The single outstanding item is the fused packaged smoke (Task 6) — the true end-to-end acceptance, which also settles the baileys-under-bundled-Bun runtime risk. It is PARKED pending the capability-seal receipts ceremony and the owner's call, and cannot be exercised in dev by construction (the fuse only trips in the electron-builder path). Status is therefore `human_needed`, not `passed`: the packaged runtime is not yet proven.

---

_Verified: 2026-07-23T23:47:22Z_
_Verifier: Claude (ferrox-verifier)_
