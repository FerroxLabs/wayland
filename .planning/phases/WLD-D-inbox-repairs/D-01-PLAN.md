---
phase: WLD-D-inbox-repairs
plan: D-01
type: execute
wave: D1
depends_on: []
files_modified:
  - src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ts
  - src/process/channels/plugins/tier1/whatsapp/bridgeSpawnConfig.ts (new pure helper)
  - src/process/channels/plugins/tier1/whatsapp/bridgeSpawnConfig.test.ts (new unit)
  - src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.consumeStdout.test.ts (new unit)
  - src/process/channels/whatsapp-bridge/backends/baileys.js
  - src/process/channels/whatsapp-bridge/backends/bridgeLogger.js (new, extracted from baileys.js)
  - src/process/channels/whatsapp-bridge/backends/bridgeLogger.test.ts (new unit)
  - tests/integration/whatsappBridgeStdoutPurity.test.ts (new integration)
autonomous: false
blocking: true
github_issue: 890
---

> **Source of truth:** `D-01-RESEARCH.md` (root cause independently re-verified) and the
> RESEARCH VERDICT banner in `D-CONTEXT.md`. Confidence HIGH on root cause; the one open
> risk (baileys-under-bundled-Bun) is settled by the packaged smoke in Task 6, with a
> documented fallback (Task 5). Do not re-derive the diagnosis — build the fix.

<objective>
#890 — the WhatsApp personal/baileys bridge never connects in packaged builds. Root cause
is the RunAsNode fuse: `WhatsAppPlugin.forkBridge` (`WhatsAppPlugin.ts:34,687`) uses
`child_process.fork`, which Electron breaks once `afterPack.js` blows `RunAsNode`
(SEC-ELEC-05, #706) on every packaged build. The "fork" then boots a SECOND Electron
instance that loses the single-instance lock and `app.quit()`s (code=0) → 12× reconnect
ladder → status `error`; baileys/QR never run. This is the identical #706 breakage already
fixed at `safeSpawn.ts:151-156` via `resolveJsRuntime()`; `forkBridge` is the one spawn site
never migrated.

Deliver: migrate `forkBridge` off `child_process.fork` to a fused-safe `spawn` via the
existing `resolveJsRuntime()`, preserving the JSON-RPC-over-stdio transport contract exactly;
route baileys pino to stderr so its logs never touch the stdout RPC pipe; make the QR-to-stderr
guard runtime-agnostic; add a minimal stdout-purity guard. Tests are written FIRST (Task 1,
red→green). Acceptance is a FUSED packaged build (the only build that reproduces #890), not
dev mode.

Purpose: baileys personal WhatsApp actually reaches QR pairing in the shipped app.
Output: fused-safe bridge spawn + companion fixes + Wave-0 unit/integration tests, proven on a
packaged macOS build (Windows confirmatory).
</objective>

<tasks>

**Task 1 — Wave 0: write the failing tests FIRST (red).**
Author these before touching `forkBridge`. They are the automated floor that would have caught
#890 and they lock the fix. Note honestly: none of these reproduce the fuse bug itself (dev is
unfused — `fork` works in dev), but they lock the spawn config, parse tolerance, and log routing
that the packaged fix depends on. The packaged repro is Task 6.

- `bridgeSpawnConfig.test.ts` — **spawn-config assertion (the #706 regression lock).** Drives the
  pure helper `buildBridgeSpawnConfig({ isPackaged, runtime, entry, backend })` (extracted in
  Task 2, mirroring `resolveJsRuntimeWith` in `jsRuntime.ts`). Assert:
  - when `isPackaged=true`, `command` is the resolved runtime (bundled-Bun path), and is
    **never** `process.execPath` (the app binary);
  - `env` carries **no** `ELECTRON_RUN_AS_NODE` in the packaged case;
  - when `isPackaged=false` (dev), `command` is the app binary with `ELECTRON_RUN_AS_NODE=1`
    (preserves dev behaviour exactly);
  - argv is `[entry, '--backend', backend]`;
  - stdio matches the chosen transport from Task 2 (recommended: `['pipe','pipe','inherit']`, no
    `'ipc'` slot — see Task 3), and the `WAYLAND_BRIDGE_UNDER_PARENT` env flag is set.
  Verify: `bun run test:vitest bridgeSpawnConfig` — RED before Task 2 (helper does not exist).
- `WhatsAppPlugin.consumeStdout.test.ts` — **parse tolerance.** Drive `consumeStdout`/`handleFrame`
  (`WhatsAppPlugin.ts:769-795`) with interleaved pollution — `[Wayland:init] …`, a pino NDJSON
  line `{"level":30,"msg":"x"}`, plain text, and a valid line split across two chunks — plus one
  valid JSON-RPC frame. Assert the valid frame dispatches and **no throw and no process exit**
  occurs on any pollution line. **Harness (W2 — `consumeStdout`/`handleFrame` are `private` at
  `WhatsAppPlugin.ts:769,780`):** drive them through the REAL public path — construct the plugin with
  a fake/mock child whose `stdout` is a `PassThrough`, emit `stdout.on('data')` chunks, and assert on
  observable effects (a pending RPC resolves for the valid frame; the child never `exit`s). Do NOT
  widen method visibility in production code and do NOT cast to `any` to reach privates — if a seam is
  needed, inject the fake child, don't refactor the class surface. Verify: `bun run test:vitest
  consumeStdout` — GREEN already on today's tolerant `handleFrame`; this test PINS that invariant so
  the fix cannot regress it.
- `bridgeLogger.test.ts` — **pino destination.** Assert the extracted `createBridgeLogger()`
  (Task 3) builds its logger against **fd2**, i.e. nothing baileys logs can reach fd1 (the RPC
  pipe). **W3 — confirm this is cleanly assertable first:** `pino.destination(2)` exposes `.fd`, so
  assert `logger[pino.symbols.streamSym].fd === 2` (or construct the destination separately and
  assert `dest.fd === 2`). If that internal is not stably reachable in this pino version, DROP the
  `bridgeLogger.js` extraction and make the change one line in place at `baileys.js:121`
  (`pino({level:'warn'}, pino.destination(2))`) — the new file/test only earns its keep as an
  automated fd2 lock; without a clean assertion it is over-build. Verify: `bun run test:vitest
  bridgeLogger` — RED until Task 3 extracts the helper and points it at `pino.destination(2)`.
- `tests/integration/whatsappBridgeStdoutPurity.test.ts` — **stdout-purity (integration).** Spawn
  the REAL `bridge.js` with `--backend baileys` through the new spawn path, capture stdout, assert
  every non-empty stdout line `JSON.parse`s to a `{jsonrpc:'2.0', …}` frame. Verify:
  `bun run test:vitest whatsappBridgeStdoutPurity`. Honest note in the test header: passes on
  macOS dev because dev is unfused; it proves the invariant, not the fuse repro.

Verify (Task 1 whole): the four test files exist; spawn-config + bridgeLogger are RED; the two
tolerance/purity tests are GREEN or RED-then-GREEN as noted.
Done: tests committed as `test(D-01): ...` before any production edit.

**Task 2 — Primary fix (NECESSARY): migrate `forkBridge` fork → spawn via `resolveJsRuntime()`.**
- Extract a pure helper `bridgeSpawnConfig.ts` exporting
  `buildBridgeSpawnConfig({ isPackaged, runtime, entry, backend })` returning
  `{ command, argv, stdio, env }` — mirror the pure/injectable shape of `resolveJsRuntimeWith`
  (`jsRuntime.ts:85`) so the decision is unit-testable off-process.
- In `forkBridge` (`WhatsAppPlugin.ts:687`), replace
  `fork(entry, ['--backend', this.backend], { silent:true, stdio:['pipe','pipe','inherit','ipc'] })`
  with `spawn` driven by the helper + `resolveJsRuntime()`:
  - `const runtime = resolveJsRuntime();` (jsRuntime.ts — bundled Bun when packaged, app-as-Node
    in dev);
  - `spawn(runtime.command, [entry, '--backend', this.backend], { stdio, env: { ...process.env, ...runtime.env, ...extraBridgeEnv } })`;
  - swap `import { fork } from 'child_process'` (line 34) for `spawn`; keep the `ChildProcess` type
    import.
- **Preserve the JSON-RPC-over-stdio transport contract exactly:** child **stdin (fd0)** = request
  lines the plugin writes (`bridge.js:68-78`); child **stdout (fd1)** = the private JSON-RPC frame
  pipe the host reads in `consumeStdout` (`bridge.js:96`); child **stderr (fd2)** = inherited into
  the parent log. `resolveBridgeEntryPath()` already returns the on-disk extraResources copy in
  packaged builds (`WhatsAppPlugin.ts:131-133`), which is exactly what a real runtime needs.
- Do NOT touch `afterPack.js` / the fuses. `RunAsNode:false` is a security control (SEC-ELEC-05);
  the correct fix is to stop depending on run-as-Node, exactly as #706 did. Do NOT re-introduce
  `ELECTRON_RUN_AS_NODE` in the packaged env.
Verify: `bun run test:vitest bridgeSpawnConfig` goes GREEN; `bun run test:vitest` full suite green;
`bun run test:e2e:a11y` green.
Done: forkBridge no longer references `child_process.fork`; packaged spawn command is the bundled
runtime, never `process.execPath`.

**Task 3 — Companion fixes (NECESSARY): IPC/`process.send` resolution + pino→stderr + QR gate.**
This is the highest-risk detail. Raw `spawn` does not wire an IPC channel the way `fork` does, so
the `process.send`-based path must be resolved explicitly, not assumed.

- **Resolve the IPC dependency FIRST (do the grep, do not hand-wave).** Confirm the only use of
  `process.send` in the bridge child is the presence-heuristic at `baileys.js:196`
  (`const hasIpc = typeof process.send === 'function'`) — it is READ to decide QR-to-stderr, never
  CALLED to send data. Confirm no `parentPort` / `NODE_CHANNEL_FD` / `process.on('message')` data
  path exists in `whatsapp-bridge/`. (Verified in research; re-confirm by grep before editing.)
  - **Because no code path carries data over IPC, drop the `'ipc'` stdio slot entirely** (stdio
    `['pipe','pipe','inherit']`) and make the QR gate runtime-agnostic: `forkBridge` always sets
    `WAYLAND_BRIDGE_UNDER_PARENT='1'` in the child env, and `baileys.js:196` changes from
    `typeof process.send === 'function'` to `process.env.WAYLAND_BRIDGE_UNDER_PARENT === '1'`.
    This removes ALL dependence on IPC-channel wiring (which bundled Bun may or may not honour via
    `NODE_CHANNEL_FD`), so QR routing is identical under electron-node (dev) and bundled-Bun
    (packaged). Rationale: under a plain `spawn` with no ipc slot, `process.send` is `undefined` →
    the old guard flips `hasIpc=false` → QR ANSI would flood the inherited stderr log every ~minute
    (the exact behaviour the guard was written to prevent).
  - **Alternative, only if the grep finds a real `process.send` DATA path (research says it does
    not):** keep `'ipc'` in the spawn stdio array AND prove the chosen runtime actually populates
    `process.send` in a fused packaged build before relying on it. Prefer the env-gate above; it is
    strictly safer. Do not build both.
- **Route baileys pino to stderr (NECESSARY companion).** `baileys.js:121`
  `const logger = pino({ level: 'warn' })` defaults to fd1 — the RPC pipe. Extract logger
  construction into `bridgeLogger.js` exporting `createBridgeLogger()` that returns
  `pino({ level: 'warn' }, pino.destination(2))`, and have `baileys.js` import it. (Extraction, not
  rewrite — one line moved into a testable helper for `bridgeLogger.test.ts`.) This leak is dormant
  today because baileys never runs in packaged builds; the moment Task 2 makes baileys actually run,
  pino warn lines would land on fd1 — so Tasks 2 and 3 MUST ship together.
- **Do not touch the QR emit.** `baileys.js:206` `emit('qr.update', { qr })` writes the QR frame to
  fd1 regardless of the guard, so the renderer keeps painting the QR; only the ANSI-to-stderr dev
  convenience is gated.

Verify: `bun run test:vitest bridgeLogger` GREEN; grep confirms no `child_process.fork` and no
`typeof process.send` presence-heuristic remain in the bridge path; full suite + a11y green.
Done: pino targets fd2; QR-to-stderr gates on `WAYLAND_BRIDGE_UNDER_PARENT`; no residual
`process.send` dependency.

**Task 4 — Defense-in-depth (keep, do not over-build): minimal stdout-purity guard.**
`consumeStdout`/`handleFrame` (`WhatsAppPlugin.ts:769-795`) already tolerate non-JSON (try/catch,
log, return — never exit). Keep that invariant. Add ONLY a minimal refinement, not a rewrite:
treat a line as a frame only if it parses to an object carrying `jsonrpc`/`id`/`method`, drop
everything else quietly (avoid warn-spam on a pollution burst), and never call `process.exit` on
the child for a bad line. The behavioural lock is the `WhatsAppPlugin.consumeStdout.test.ts` from
Task 1.
Verify: `bun run test:vitest consumeStdout` stays GREEN with the refinement.
Done: pollution bursts are dropped silently; a valid frame still dispatches; no new exit paths.

**Task 5 — Fallback branch (CONDITIONAL — build ONLY if Task 6's smoke fails).**
If baileys proves Bun-incompatible under `resolveJsRuntime()` in the packaged smoke (Task 6 shows
the bridge failing to boot under bundled Bun), fall back to Electron `utilityProcess.fork` (A2),
which runs Electron's real bundled Node and works under the blown fuse. In-repo wrapper already
exists: `ElectronPlatformServices.ts:70-87`. **Blast radius is larger** — `utilityProcess` cannot
give a piped stdin, so the JSON-RPC request direction (parent→child over stdin, `bridge.js:68-78`)
must move to `parentPort`/`postMessage`, touching `bridge.js`, the plugin's `rpc()`/`consumeStdout`,
and the QR/notification wiring. Try the `resolveJsRuntime`/spawn path (Tasks 2-3) FIRST, prove it on
the packaged smoke, and only fall back to utilityProcess if the smoke fails. **Do not build both.**
Verify: N/A unless triggered; if triggered, re-run Task 6 acceptance against the utilityProcess
build.
Done: this branch stays unbuilt when the A1 spawn smoke passes.

**Task 6 — Acceptance gate (the honest one): FUSED packaged build + smoke.**
#890 reproduces ONLY in a packaged, fused build — dev is unfused, so `fork` works in dev and every
dev test passes on the broken code. Note precisely: `bun run package` (= `electron-vite build`) is
UNFUSED and CANNOT reproduce #890; the RunAsNode fuse is blown only by the electron-builder
`dist:*` path (afterPack → `applyElectronFuses`). The packaged-smoke script
(`scripts/packaged-cockpit-smoke.mjs`) therefore requires a real fused `.app` under `out-preview/`.

- Build a fused macOS packaged app (the acceptance surface) via the FULL electron-builder path:
  `bun run dist:preview:mac` (= `WAYLAND_RELEASE_TRACK=preview node scripts/build-with-builder.js auto --mac`).
  - **`--pack-only` is FORBIDDEN for this acceptance.** `build-with-builder.js:698-700` returns
    (`console.log('…skipped distributable creation'); return;`) BEFORE electron-builder runs — so
    afterPack/`applyElectronFuses` never fires (build is UNFUSED → cannot reproduce #890) AND the
    early return also skips `prepareBundledBun` (:708) and `prepareWhatsAppBridgeResources` (:719),
    so `resolveJsRuntime()` finds no bundled Bun and the bridge extraResources copy is unstaged →
    the run cannot settle the baileys-under-Bun risk either. A `--pack-only` smoke is the exact
    false green this task exists to avoid. Only the full `dist:*` path is fused (`electron-builder.yml:306`
    afterPack; preview config `electron-builder.preview.cjs` spreads `...stable` so it inherits afterPack).
  - **Also forbidden: `bun run package` as the acceptance build.** `package` = `electron-vite build`
    (`package.json`), which never invokes electron-builder → also UNFUSED. NOTE: `D-01-RESEARCH.md`
    is STALE on this one point — it claims a `bun run package` build reproduces the fuse bug; it does
    NOT. Trust THIS task, not the research banner, on the acceptance surface. (`bun run package` remains
    the correct build for general dev/launch-artifact purposes — that rule is about the prepackage hook,
    a different past bug — but it is unfused and useless for the #890 repro.)
  - After packaging, **revert `src/process/services/constitution/constitutionFsAuthority.generated.ts`**
    (the prepackage step regenerates it).
- Run `node scripts/packaged-cockpit-smoke.mjs` against the built `.app`, plus a targeted packaged
  WhatsApp-bridge-boot check: enable WhatsApp **personal/baileys**, and confirm the forked bridge
  process **starts and does NOT immediately `app.quit`** — no code=0 exit, no 12-reconnect `error`
  ladder — and reaches **QR** (not `error`), with no bridge-stdout "invalid JSON" lines in the log.
  Broken build = `error` status + pipe pollution; fixed build = QR renders.
- **This smoke also settles the baileys-under-Bun risk.** If the bridge boots and reaches QR under
  bundled Bun, A1 holds. If it fails to run under Bun, switch to Task 5 (utilityProcess) and re-run.
- **Windows box** (`ssh seandesktop`) is confirmatory on the reporter's exact platform AFTER the
  macOS packaged smoke passes — not the primary gate (afterPack blows the fuse on every platform,
  so macOS reproduces it).

Honest split for the record: unit + integration tests (Task 1) lock the spawn config, parse
tolerance, pino fd2, and stdout purity on macOS dev; the **macOS fused packaged smoke** proves the
end-to-end #890 fix and settles the Bun-compat risk; the **Windows packaged run** confirms on the
reporter's platform. Dev-mode alone cannot prove #890.
Verify: fused macOS `.app` reaches WhatsApp QR (not `error`); `packaged-cockpit-smoke.mjs` green;
Windows confirm green.
Done: reported symptom retired on a packaged build; Bun-compat resolved.

</tasks>

<verification>
- `bun run test:vitest` (full unit suite) green; `bun run test:e2e:a11y` green.
- `bridgeSpawnConfig.test.ts`: packaged spawn command is the bundled runtime, never
  `process.execPath`; no `ELECTRON_RUN_AS_NODE` in the packaged env.
- Grep: no `child_process.fork` and no `typeof process.send` presence-heuristic remain in the
  WhatsApp bridge path; pino targets fd2; QR gates on `WAYLAND_BRIDGE_UNDER_PARENT`.
- FUSED macOS packaged `.app`: WhatsApp personal/baileys reaches QR (not the 12-reconnect `error`),
  bridge process does not immediately `app.quit`, no "invalid JSON" bridge-stdout lines.
- Independent cross-audit of the diff before any merge; LOCAL only, no push/merge without Sean.
- Constitution tests may flake under full-suite parallelism (pass isolated) — not a regression.
</verification>

<success_criteria>
In a fused packaged build, the WhatsApp personal/baileys bridge boots via a real runtime (bundled
Bun, or utilityProcess if Task 5 triggered), stays up, and reaches QR pairing — not a 12-reconnect
`error`. baileys logs never touch the stdout JSON-RPC pipe. Wave-0 tests lock the fix. #890 auto-closes
on merge (`github_issue: 890`).
</success_criteria>

<output>
Write `D-01-SUMMARY.md` recording: chosen approach (A1 spawn vs A2 utilityProcess) and why; the
IPC/`process.send` resolution taken; the fused-build command used; packaged-smoke evidence
(QR reached, screenshots/log); baileys-under-Bun verdict; Windows confirm status; cross-audit result.
</output>
