# Phase D1: Bridge Reliability (#890 + #537) - Research

**Researched:** 2026-07-23
**Domain:** Electron child-process spawning under blown security fuses; wcore host-send protocol verification
**Confidence:** HIGH (#890 root cause), HIGH (#537 verdict)
**Worktree:** `/Users/seandonahoe/gsd-workspaces/wayland-desktop-integration/app` @ HEAD `c33d7faef`

---

## User Constraints (from D-CONTEXT.md)

### Locked framing / guardrails

- LOCAL only — no push/merge/release/deploy without Sean. Never touch `/Users/seandonahoe/dev/wayland/app`.
- Acceptance model: Sean + Claude live-test together; a green Playwright/unit sweep IS acceptance. Each fix stamps `github_issue: NN` in PLAN.md frontmatter.
- Every FIX runs the full Factory loop: research → plan → build → independent cross-audit → full unit suite (`bun run test:vitest`) + a11y gate (`bun run test:e2e:a11y`) → live-verify → ship.
- **Always `bun run package`, never raw `npx electron-vite build`** (raw skips the prepackage hook → packaged app crashes on launch). Revert `constitutionFsAuthority.generated.ts` after any package build.
- Constitution tests flake under full-suite parallelism (pass isolated) — not a regression.
- #537 is VERIFY-only. Do **not** tell users to upgrade Core (channel code byte-identical 0.12.17..0.12.19). If Core hook absent → route to Core, mark blocked-on-Core, ship NO desktop change.

### Claude's Discretion

- Exact fix approach for #890 (spawn-via-runtime vs utilityProcess) — recommendation below; Sean picks.
- Depth of stdout-purity hardening / test surface.

### Deferred (OUT OF SCOPE for D1)

- D2–D5 issues (#885, #891, #853, #909, #910, #508, #882, #723). Ignore.
- SBX-02 wiring, COW-04 live citations (Core-gated).

---

## Phase Requirements

| ID   | Description                                                                                                              | Research Support                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| #890 | WhatsApp baileys/personal bridge never connects; app boot strings on JSON-RPC pipe, code=0 exit, 12 reconnects, never QR | Root cause resolved to `child_process.fork` under blown `RunAsNode` fuse (§2). Fix set §3.                              |
| #537 | engine `send_message` "unknown channel: email"                                                                           | Bundled Core v0.12.25 **emits** `host_send_message_request`; desktop hook already armed. Verify-and-close procedure §4. |

---

## Summary

**#890 — root cause is the `RunAsNode` fuse, not a stdout leak.** `WhatsAppPlugin.forkBridge` (WhatsAppPlugin.ts:687) spawns the bridge with `child_process.fork` (imported at line 34). Electron's official docs state plainly: _"With this fuse disabled, `child_process.fork` in the main process will not function as expected, as it depends on [`ELECTRON_RUN_AS_NODE`] to function"_ ([Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses)). Every packaged build blows exactly that fuse — `scripts/afterPack.js:61` sets `[FuseV1Options.RunAsNode]: false` unconditionally (`applyElectronFuses` runs first in afterPack, line 79). So in a packaged build the fork boots a **second full Electron app instance** instead of Node running `bridge.js`. That doomed instance loses the single-instance lock (`index.ts:184`), writes early boot noise to its stdout — which is the private JSON-RPC pipe the host reads in `consumeStdout` — the host logs "bridge emitted invalid JSON", the instance calls `app.quit()` → **exit code 0** (`index.ts:192`), the reconnect ladder respawns it up to `RECONNECT_MAX_ATTEMPTS = 12` (WhatsAppPlugin.ts:275) doomed times, then parks at `error`. QR is never reached because `bridge.js`/baileys **never run**. This is the same fuse failure the app already fixed for its other spawn sites in #706 (`jsRuntime.ts`, `safeSpawn.ts`); `forkBridge` is the one spawn site that was never migrated.

**The three quoted strings are a secondary red herring.** `[Wayland:init]`, `MCP scripts present`, and `Adopting existing Playwright MCP server` are emitted **only** by `initStorage.ts` (lines 1284, 1361, 1187), which runs in the `app.whenReady` bootstrap. A fork-spawned instance that loses the single-instance lock quits at `index.ts:192` **before** `initStorage()` ever runs (§2, H1-vs-H2). So those exact lines are the **primary** app instance's normal startup logs, conflated into the same Windows `%APPDATA%\Wayland\logs` file the reporter pasted (H2). H2 explains the _strings_; it cannot explain the code=0 exit or never-reaching-QR — only H1 does. Both are real; H1 is the bug to fix.

**#537 — verdict: closeable pending one live send.** The bundled Core binary is v0.12.25 and its strings table contains `host_send_message_request`, `ProtocolCommand::HostSendMessageResult`, `WAYLAND_SEND_MESSAGE_HOST_DELEGATE`, and the log line _"send_message runs host-delegated (WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1): sends are fulfilled by the host, not the engine channel table."_ The desktop host-send hook is fully present and armed (`envBuilder.ts:1040` sets the delegate env; `index.ts:1427/1459` handles the event). Both halves exist — so #537 lands on the "live-verify an agent email send, then close" branch (§4), not the "route to Core" branch.

**Primary recommendation:** Migrate `forkBridge` off `child_process.fork` to `child_process.spawn` via the existing `resolveJsRuntime()` (mirroring `safeSpawn.ts`), keeping the stdio JSON-RPC protocol unchanged; add the companion pino→stderr redirect (necessary once baileys actually runs) and an env-based QR gate. Verify baileys-under-Bun with a `bun run package` smoke on macOS (the fuse — and thus the bug — reproduces on all platforms, not just Windows). For #537, run one host-delegated agent email send with the burner Flux key and close.

---

## Architectural Responsibility Map

| Capability                              | Primary Tier                                                       | Secondary Tier                       | Rationale                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Spawning the WhatsApp bridge subprocess | Electron main (WhatsAppPlugin)                                     | JS runtime resolver (`jsRuntime.ts`) | Main owns child lifecycle; runtime resolver owns "what interpreter, given the fuse state" |
| JSON-RPC framing over stdio             | Bridge child (`bridge.js`) ↔ main (`consumeStdout`/`handleFrame`)  | —                                    | Protocol is a stdio contract between the two                                              |
| baileys logging                         | Bridge child (pino)                                                | —                                    | Must be fd2-only; fd1 is protocol-reserved                                                |
| Host-delegated send (email)             | Core engine (emits request) → Electron main (`hostSendMessage.ts`) | Channel plugins                      | Engine delegates; host fulfills via its own channel stack                                 |

---

## #890 — Mechanism Resolved (file:line proof)

### The defect

- `WhatsAppPlugin.ts:34` `import { fork } from 'child_process';`
- `WhatsAppPlugin.ts:687` `this.child = fork(entry, ['--backend', this.backend], { silent: true, stdio: ['pipe','pipe','inherit','ipc'] });`

### Why `fork` is broken in packaged builds (H1 — confirmed root cause)

1. **Every packaged build blows the RunAsNode fuse.** `scripts/afterPack.js:79` calls `applyElectronFuses` first; `afterPack.js:61` sets `[FuseV1Options.RunAsNode]: false`. `jsRuntime.ts:14-30` documents this as SEC-ELEC-05, applied _unconditionally_ — `app.isPackaged` is a sound proxy for "the fuse is off." `[VERIFIED: afterPack.js:61 read]`
2. **`child_process.fork` depends on `ELECTRON_RUN_AS_NODE`.** Electron sets that env var so a forked child runs as Node. Official docs: _"With this fuse disabled, `child_process.fork` in the main process will not function as expected, as it depends on this environment variable to function… we recommend that you use Utility Processes."_ `[CITED: electronjs.org/docs/latest/tutorial/fuses]`
3. **Result:** in a fused packaged build, `fork(entry, …)` spawns `process.execPath` (the app binary) which, with the fuse blown, **ignores the run-as-Node request and boots the full Electron app**. `bridge.js` is never executed. This is the identical failure `jsRuntime.ts:17-19` describes for the sibling spawn sites: _"the child boots as a full Electron APP … instead of Node, so the parent's handshake never completes and the feature crash-loops."_

### Why the child exits code=0

- The doomed second instance hits the single-instance lock: `index.ts:184` `app.requestSingleInstanceLock(...)` returns `false` (primary holds it) → `index.ts:185-192` logs "Activation forwarded…" and calls `app.quit()` → **exit code 0**. `[VERIFIED: index.ts:184-192 read]`
- `WhatsAppPlugin.ts:699` `this.child.once('exit', (code, signal) => …)` → `scheduleReconnect` (line 713) → exhausts at `RECONNECT_MAX_ATTEMPTS = 12` (line 275) → `setStatus('error', …)` (line 736). Matches the reporter's "12 reconnect attempts exhaust, status error" **exactly**. `[VERIFIED: WhatsAppPlugin.ts:275,699-718,733-741 read]`
- The current tolerant `handleFrame` (WhatsAppPlugin.ts:780-795, added v0.9.6-rc.1 per `git log -S "bridge emitted invalid JSON"`) does **not** exit on bad JSON — so the reporter's "throws → exits" is _not_ the exit trigger. The exit is the app-instance `app.quit()`, per above. **#890 is NOT already fixed on this branch** — the fork defect is live; the tolerant handleFrame merely prevents a host-side crash on the garbage lines.

### Why the three app strings appear (H2 — supplement, not the pipe-pollution trigger)

- `[Wayland:init]` → `initStorage.ts:1284`; `MCP scripts present` → `initStorage.ts:1361`; `Adopting existing Playwright MCP server` → `initStorage.ts:1187`. All three are emitted **only** inside `initStorage()`, which runs in the `app.whenReady` bootstrap (`server.ts:93 await initStorage()`). `[VERIFIED: grep of exact strings]`
- A fork-spawned instance that **loses** the single-instance lock quits at `index.ts:192` _before_ `whenReady`/`initStorage()` — so it never emits those three lines to its stdout. Therefore, in normal use (primary instance running) the three quoted strings are the **primary** app's own startup logs, interleaved into the shared Windows log file the reporter pasted. **H2 explains the strings; H1 explains the failure.**
- Corroborating: there are **zero** `console.log`/`stdout.write` app-log calls anywhere in the bridge child source (`bridge.js`, `backends/*.js`) — verified by grep. bridge.js writes fd1 **only** for JSON-RPC frames (line 96) and fd2 for errors (line 99). So the "transitive import of app bootstrap into the child" flavor of H1 is **refuted**: the child source cannot emit app strings; only the child _being a whole app instance_ can. `[VERIFIED: grep console.log/stdout.write in bridge dir]`

### Evidence ledger

| Claim                                                   | Evidence                                          |
| ------------------------------------------------------- | ------------------------------------------------- |
| forkBridge uses raw `fork`                              | WhatsAppPlugin.ts:34, :687                        |
| RunAsNode fuse blown every packaged build               | afterPack.js:61, :79                              |
| `fork` non-functional under blown fuse                  | Electron docs (fuses.md)                          |
| code=0 = second-instance `app.quit()`                   | index.ts:184-192                                  |
| 12 reconnects                                           | WhatsAppPlugin.ts:275 (RECONNECT_MAX_ATTEMPTS=12) |
| tolerant handleFrame present (not the exit cause)       | WhatsAppPlugin.ts:780-795; git log -S v0.9.6-rc.1 |
| 3 strings only from initStorage (whenReady path)        | initStorage.ts:1187,1284,1361                     |
| doomed instance quits before whenReady                  | index.ts:185-192                                  |
| no app-log console.log in bridge child                  | grep (empty result)                               |
| #706 fix pattern already exists but bridge not migrated | jsRuntime.ts, safeSpawn.ts:147-182                |

---

## Recommended Fix Set (per-change necessity / risk / blast-radius)

### (A) PRIMARY — stop forking the app binary _(NECESSARY — this is the root cause)_

Two viable approaches. **Recommendation: A1 (spawn via `resolveJsRuntime`)** — smallest diff, protocol-preserving, reuses the app's own proven #706 fix.

**A1 — `child_process.spawn` via `resolveJsRuntime()` (RECOMMENDED)**

- Replace `fork(entry, args, {stdio})` with:
  ```ts
  const runtime = resolveJsRuntime(); // jsRuntime.ts — bundled Bun when packaged, app-as-Node in dev
  this.child = spawn(runtime.command, [entry, '--backend', this.backend], {
    stdio: ['pipe', 'pipe', 'inherit'], // stdin=requests, stdout=frames, stderr=inherit
    env: { ...process.env, ...runtime.env },
  });
  ```
- **Necessity:** required — directly removes the fork-under-fuse defect.
- **Blast radius:** `forkBridge` only. Protocol (stdin/stdout JSON-RPC lines) is unchanged; `resolveBridgeEntryPath()` already returns the on-disk extraResources copy in packaged builds (WhatsAppPlugin.ts:131-133), which is what a real runtime needs.
- **Risk (the one real risk):** baileys runs under **bundled Bun** in packaged builds. baileys pulls libsignal + protobuf; `whatsapp-web.js` pulls puppeteer; `sharp` native libs are present in the bridge `node_modules`. Bun is a documented drop-in for the app's MCP servers (`jsRuntime.ts:22-26`) but baileys is a heavier native surface. **Must be proven with a packaged smoke** (§5) before ship. If baileys fails under Bun, fall back to A2.
- Consistency: mirrors `safeSpawn.ts:147-182` verbatim in spirit (the established #706 pattern). `[CITED: safeSpawn.ts]`

**A2 — `utilityProcess.fork` (FALLBACK if baileys is Bun-incompatible)**

- Electron's officially recommended replacement for `fork` under a blown RunAsNode fuse. Runs Electron's **real bundled Node** → zero baileys-runtime-compat risk. Already wrapped in-repo: `ElectronPlatformServices.ts:70-87` (`worker.fork` → `utilityProcess.fork`, with #706-aware `IS_PACKAGED` env propagation).
- **Blast radius: larger.** `utilityProcess` does **not** support a piped **stdin** (Electron allows only `'ignore'`/`'inherit'` for stdio[0]); it uses `parentPort`/`MessagePortMain` for parent→child messaging. The current design writes JSON-RPC **requests** into the child's stdin (bridge.js:68-78). So A2 requires refactoring the request direction from stdin-lines to `postMessage`/`process.parentPort` — touching `bridge.js`, the plugin's `rpc()`/`consumeStdout`, and the QR/notification wiring. Larger, riskier diff.
- Recommend only if A1's Bun smoke fails.

### (B) Route baileys pino to stderr _(NECESSARY companion — not defense-in-depth)_

- `baileys.js:121` `const logger = pino({ level: 'warn' });` — pino defaults to **fd1** (stdout), the JSON-RPC channel.
- Change to `pino({ level: 'warn' }, pino.destination(2))` (fd2).
- **Necessity:** required. Today baileys never runs in packaged builds (the fork bug), so this leak is dormant. The moment (A) makes baileys actually run under the parent, pino warn lines would land on the RPC pipe — i.e., fixing (A) _surfaces_ this second stdout-pollution source. Both must land together.
- **Blast radius:** one line in `baileys.js`. Risk: negligible; `pino` already a dependency.

### (C) Make the QR-to-stderr gate runtime-agnostic _(RECOMMENDED companion)_

- `baileys.js:196` `const hasIpc = typeof process.send === 'function';` decides whether to dump QR ANSI to stderr. Under A1's `spawn` (no `'ipc'` in stdio), `process.send` is `undefined` → `hasIpc=false` → in packaged the QR ANSI would spam the inherited-stderr log file (the exact behavior the guard was meant to prevent).
- Replace with an explicit env flag that `forkBridge` always sets, e.g. `WAYLAND_BRIDGE_UNDER_PARENT=1`, and gate on `process.env.WAYLAND_BRIDGE_UNDER_PARENT === '1'`. Makes QR routing independent of whether the runtime wires an IPC channel.
- **Necessity:** required if A1 is chosen without an `'ipc'` stdio slot. **Blast radius:** one line in `baileys.js` + one env key in `forkBridge`. Low risk.

### (D) Defensive `consumeStdout`/`handleFrame` + stdout-purity assertion _(DEFENSE-IN-DEPTH)_

- `handleFrame` (WhatsAppPlugin.ts:780-795) already tolerates non-JSON (try/catch, logs, returns — never exits). Keep that invariant.
- Optional refinement: only treat lines that parse to an object carrying `jsonrpc`/`id`/`method` as frames; drop everything else quietly (avoid warn-spam on a pollution burst). Never call `process.exit` on the child for a bad line.
- Add a bridge **stdout-purity** test (see §5): spawn the real bridge, assert every non-empty stdout line `JSON.parse`s to a `{jsonrpc:'2.0', …}` frame.
- **Necessity:** defense-in-depth; low priority relative to (A)/(B). **Blast radius:** parse path + new test only.

**Note:** No new npm packages are introduced by any change (pino, `resolveJsRuntime`, `utilityProcess`, `spawn` all already in the tree). Package Legitimacy Audit is therefore N/A for this phase.

---

## #537 — Verification Procedure + Decision Tree

### State confirmed this session

- Bundled Core: `resources/bundled-wayland-core/darwin-arm64/wayland-core --version` → **`wayland-core 0.12.25`** (matches A-01 pin). `[VERIFIED: ran --version]`
- `strings` on the binary contains: `host_send_message_request`, `ProtocolCommand::HostSendMessageResult`, `host_send_message_result`, `WAYLAND_SEND_MESSAGE_HOST_DELEGATE`, and _"send_message runs host-delegated (WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1): sends are fulfilled by the host, not the engine channel table."_ → **Core emit path is present.** `[VERIFIED: strings resources/bundled-wayland-core/darwin-arm64/wayland-core]`
- Desktop hook armed: `envBuilder.ts:1040` `WAYLAND_SEND_MESSAGE_HOST_DELEGATE='1'`; `protocol.ts:361-368,444` types; `index.ts:1423-1459` `handleHostSendMessage`; `hostSendMessage.ts`. `[VERIFIED: grep, files present]`
- Burner Flux key exists: `~/.config/wayland-smoke/flux-test-key` (51 bytes). `[VERIFIED: ls]`

### Procedure

1. **Static (done):** confirm the bundled binary's strings table contains `host_send_message_request` + `WAYLAND_SEND_MESSAGE_HOST_DELEGATE`. ✅ present in v0.12.25.
2. **Live (authoritative, the deliverable step):** run a real agent email-send end-to-end:
   - Use the burner Flux key at `~/.config/wayland-smoke/flux-test-key`.
   - Ensure the agent is spawned host-delegated (desktop already sets `WAYLAND_SEND_MESSAGE_HOST_DELEGATE=1` via `envBuilder.ts:1040`).
   - Ask the agent to send an email via `send_message` to a channel of type `email`.
   - **Observe:** desktop logs `handleHostSendMessage` firing (`index.ts:1459`) and the send succeeding — **not** the old `unknown channel: email` (the `"unknown channel: "` string still exists in the binary as the _non_-delegated fallback path; delegation must bypass it).

### Decision tree

- **Core hook present (string ✅ AND live send delegates to host):** live-verify the agent email send → **close #537** (both halves shipped: Core emits, desktop fulfills). Stamp `github_issue: 537`. No desktop code change needed — this is verification only.
- **Core hook absent / live still errors `unknown channel: email`:** route to `wayland-core`, mark #537 **blocked-on-Core**, ship **no** desktop change. Do **not** advise users to upgrade Core (channel code byte-identical 0.12.17..0.12.19).
- Static evidence already points strongly at the first branch; the live send is the confirmation that closes it.

---

## Testability / Coverage (honest split)

### Provable on macOS dev + unit tests (no Windows box)

- **Unit — spawn config (locks the #706 regression):** extract a pure `buildBridgeSpawnConfig({ isPackaged, runtime, entry, backend })` returning `{ command, argv, stdio, env }`; assert that when `isPackaged=true` the `command` is the bundled-Bun path (or utilityProcess path for A2) and **never** `process.execPath`, and that `env` carries no stray `ELECTRON_RUN_AS_NODE` in the packaged case. This is the automated floor that would have caught #890. (Mirror the pattern of `resolveJsRuntimeWith` — pure, unit-testable.)
- **Unit — parse hardening:** drive `consumeStdout` with interleaved pollution (`[Wayland:init] …`, pino NDJSON `{"level":30,…}`, plain text, a partial line split across chunks) plus one valid frame; assert the valid frame dispatches and no throw/exit occurs.
- **Unit — pino destination:** assert baileys constructs its logger against fd2 (inject/inspect the destination), i.e. nothing baileys logs can reach fd1.
- **Integration (unpackaged, macOS):** spawn the **real** `bridge.js` through the new path with `--backend baileys`, capture stdout, assert every non-empty line `JSON.parse`s to `{jsonrpc:'2.0', …}` (stdout-purity). Note: this passes on the current branch too, because **dev is unfused** — `fork` works in dev — so it does _not_ by itself reproduce the fuse bug.

### Requires a PACKAGED (fused) build — but NOT necessarily Windows

> **CORRECTION (post plan-check, verified against `scripts/build-with-builder.js:698-700`):** every
> mention of **`bun run package`** as the acceptance build in this section is WRONG. `bun run package`
> = `electron-vite build` = UNFUSED (it never invokes electron-builder, so `afterPack.js` /
> `applyElectronFuses` never runs) and therefore CANNOT reproduce #890. The correct fused acceptance
> build is the full electron-builder path: **`bun run dist:preview:mac`** (NOT with `--pack-only` —
> that early-returns before electron-builder AND before bundled-Bun/bridge-resource staging). See
> `D-01-PLAN.md` Task 6, which is authoritative on the acceptance surface. Read "`bun run package`"
> below as "`bun run dist:preview:mac`".

- The #890 root cause reproduces **only** in a packaged/fused build. Critically, `afterPack.js` blows the fuse on **every platform**, so a **macOS fused `dist:preview:mac`** build reproduces the bug and proves the fix — the Windows box is not strictly required to demonstrate it.
- **Packaged smoke (macOS, `bun run package`):** install the packaged app, enable WhatsApp **personal/baileys**, confirm the bridge reaches **QR** (not the 12-reconnect `error`) and that no bridge-stdout "invalid JSON" lines appear in the logs. Broken build = `error` status + pipe pollution; fixed build = QR renders. This is the acceptance surface for the reported symptom.
- **This smoke is also where A1's baileys-under-Bun risk is settled.** If baileys fails to run under bundled Bun in the packaged build, switch to A2 (utilityProcess).
- **Windows box (`ssh seandesktop`):** final confirmation on the reporter's exact platform after the macOS packaged smoke passes. Confirmatory, not the primary gate.

**Honest acceptance-criteria statement for the plan:** unit tests lock the spawn config + parse hardening + pino destination; a **macOS packaged smoke** proves the end-to-end fix and settles the Bun-compat risk; a **Windows packaged run** confirms on the reporter's platform. Dev-mode alone cannot prove #890 (dev is unfused).

---

## Common Pitfalls

### Pitfall 1: "Just route pino to stderr" as the whole fix

- **What goes wrong:** pino→stderr alone does nothing — baileys never runs in packaged builds because the fork boots an app instead. The bridge would still 12-reconnect to `error`.
- **How to avoid:** fix (A) is the root cause; (B) is a required companion that only matters _after_ (A). Ship them together.

### Pitfall 2: Fixing it in dev and declaring victory

- **What goes wrong:** dev is unfused; `fork` works there. Every dev test passes on the broken code. The bug is packaged-only.
- **How to avoid:** the acceptance gate is a `bun run package` build (macOS is sufficient to reproduce), never dev mode.

### Pitfall 3: Swapping to `utilityProcess` without accounting for stdin

- **What goes wrong:** `utilityProcess` can't give a piped stdin; the JSON-RPC request path (parent→child over stdin) silently breaks.
- **How to avoid:** if A2 is chosen, refactor the request direction to `parentPort`/`postMessage`. Prefer A1 (spawn) which keeps stdin.

### Pitfall 4: QR ANSI spam after switching off fork's IPC channel

- **What goes wrong:** `baileys.js:196` keys QR-to-stderr on `typeof process.send === 'function'`; a plain `spawn` has no `process.send` → QR ANSI floods the packaged log.
- **How to avoid:** fix (C) — gate on an explicit env flag set by `forkBridge`.

### Pitfall 5: `#537` false-negative from the fallback string

- **What goes wrong:** the binary still contains `"unknown channel: "`; seeing it in a log doesn't mean the hook is absent — that's the _non_-delegated path. Delegation must bypass it.
- **How to avoid:** verify the **live delegated** send (agent spawned with the delegate env), not a raw non-delegated channel send.

---

## Runtime State Inventory

Not a rename/refactor phase — code changes only. No stored data, live-service config, OS-registered state, secrets, or build artifacts carry a renamed identifier.

- **Bundled artifacts:** `resources/bundled-wayland-core/darwin-arm64/wayland-core` = v0.12.25 (read-only; not modified by D1). The bridge ships as `extraResources` with its own `node_modules` (unchanged).

---

## Environment Availability

| Dependency                      | Required By                        | Available                                               | Version                                       | Fallback                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| Bundled Bun runtime             | #890 fix A1 (packaged interpreter) | ✓ (per `jsRuntime.ts`; ship in `resources/bundled-bun`) | ships in bundle                               | A2 utilityProcess                            |
| Bundled wayland-core            | #537 verification                  | ✓                                                       | 0.12.25                                       | —                                            |
| Burner Flux key                 | #537 live send                     | ✓                                                       | `~/.config/wayland-smoke/flux-test-key` (51B) | —                                            |
| `bun run package` toolchain     | packaged smoke                     | ✓ (repo standard)                                       | —                                             | —                                            |
| Windows box (`ssh seandesktop`) | reporter-platform confirmation     | ✓ (per MEMORY)                                          | —                                             | macOS packaged smoke reproduces the fuse bug |
| baileys under bundled Bun       | #890 fix A1                        | **UNVERIFIED**                                          | —                                             | A2 utilityProcess (real Node)                |

**Blocking unknowns:** baileys-under-Bun compatibility — settle in the packaged smoke; A2 is the fallback with no runtime-compat risk.

---

## Security Domain

`security_enforcement` is enabled (not `false`). This phase touches the exact surface the fuses defend.

| ASVS Category                          | Applies | Standard Control                                                                                                         |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| V5 Input Validation                    | yes     | `handleFrame` must keep tolerating/skipping non-frame lines without exit (D)                                             |
| V10 Malicious Code / process integrity | yes     | Do **not** re-enable `RunAsNode` to "fix" the fork; the fuse stays blown (SEC-ELEC-05). Fix by using a real runtime (A). |

| Pattern                                                | STRIDE                             | Mitigation                                                                                      |
| ------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Spawning the app binary as a stand-in Node interpreter | Elevation of Privilege / Tampering | Use bundled Bun (A1) or utilityProcess (A2); never loosen fuses. Mirrors `jsRuntime.ts` intent. |
| Untrusted bytes on the JSON-RPC pipe crashing the host | Denial of Service                  | Tolerant `handleFrame` + stdout-purity test (D)                                                 |

**Hard constraint:** the fix must not touch `afterPack.js` fuses. `RunAsNode: false` is a security control (SEC-ELEC-05); the correct fix is to stop depending on run-as-Node, exactly as #706 did.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                   |
| ------------------ | ------------------------------------------------------- |
| Framework          | vitest (unit) + Playwright (a11y/e2e)                   |
| Quick run command  | `bun run test:vitest` (`vitest run`)                    |
| Full suite command | `bun run test:vitest`                                   |
| a11y gate          | `bun run test:e2e:a11y`                                 |
| Packaged build     | `bun run package` (never raw `npx electron-vite build`) |

### Phase Requirements → Test Map

| Req  | Behavior                                                   | Test Type    | Command                                                   | Exists?                             |
| ---- | ---------------------------------------------------------- | ------------ | --------------------------------------------------------- | ----------------------------------- |
| #890 | packaged spawn uses real runtime, never `process.execPath` | unit         | `bun run test:vitest` (new `buildBridgeSpawnConfig` test) | ❌ Wave 0                           |
| #890 | `consumeStdout` skips pollution, never exits               | unit         | `bun run test:vitest` (new)                               | ❌ Wave 0                           |
| #890 | baileys pino writes fd2 only                               | unit         | `bun run test:vitest` (new)                               | ❌ Wave 0                           |
| #890 | real bridge stdout is pure JSON-RPC                        | integration  | `bun run test:vitest` (new)                               | ❌ Wave 0                           |
| #890 | bridge reaches QR in a packaged build                      | manual smoke | `bun run package` + live                                  | manual (macOS pkg; Windows confirm) |
| #537 | agent email send delegates to host                         | manual smoke | live w/ burner key                                        | manual                              |

### Wave 0 Gaps

- [ ] Extract `buildBridgeSpawnConfig(...)` pure helper from `forkBridge` and unit-test the packaged/dev runtime selection.
- [ ] Unit test around `consumeStdout` pollution tolerance (make it reachable, or test via a small harness).
- [ ] Unit/inspection test for baileys pino fd2 destination.
- [ ] Integration test spawning the real `bridge.js` asserting stdout purity.

---

## Assumptions Log

| #   | Claim                                                                                                                                  | Section       | Risk if Wrong                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| A1  | baileys (+ libsignal/protobuf/sharp) runs cleanly under **bundled Bun**                                                                | Fix A1, Env   | If wrong, A1 fails the packaged smoke → switch to A2 (utilityProcess/real Node). Bounded, testable.           |
| A2  | The reporter's pasted `[Wayland:init]`/MCP strings are the **primary** instance's logs (H2 conflation), not the doomed fork-instance's | #890 H1-vs-H2 | Does not change the fix (H1 is the failure). Only affects the narrative of where those exact lines came from. |
| A3  | Live host-delegated email send succeeds against bundled Core v0.12.25                                                                  | #537          | If it errors `unknown channel: email` despite the strings, #537 routes to Core instead of closing.            |

---

## Open Questions

1. **A1 vs A2 for #890** — Recommend A1 (spawn + `resolveJsRuntime`, smallest diff, reuses #706 pattern). A2 (utilityProcess) is the fallback if baileys is Bun-incompatible. **Decision can be deferred to the packaged smoke** (A1 first; fall back on failure). No Sean input needed unless he wants to pre-commit to A2 to avoid a possible re-plan.
2. **#537 live send** — anything blocking a burner-key agent email-send in this worktree (SMTP/channel config for the email channel)? The Core+desktop code paths are confirmed present; only the live send remains.

---

## Sources

### Primary (HIGH confidence)

- In-repo file reads (this session): `WhatsAppPlugin.ts` (34, 121-164, 685-724, 769-795, 275), `whatsapp-bridge/bridge.js` (68-101, 194), `backends/baileys.js` (28, 121, 190-210), `jsRuntime.ts` (full), `safeSpawn.ts` (147-183), `afterPack.js` (43-84), `index.ts` (177-261, 1423-1459), `initStorage.ts` (1187, 1284, 1361), `ElectronPlatformServices.ts` (70-87), `envBuilder.ts` (1040), `protocol.ts` (361-444).
- `strings` + `--version` on `resources/bundled-wayland-core/darwin-arm64/wayland-core` (v0.12.25; contains host-send symbols).
- `git log -S` confirming tolerant handleFrame / reconnect ladder landed v0.9.6-rc.1.
- Electron Fuses docs: `child_process.fork` non-functional under blown RunAsNode. https://www.electronjs.org/docs/latest/tutorial/fuses

### Secondary (MEDIUM confidence)

- Electron docs recommendation of UtilityProcess as the fork replacement (same source).

## Metadata

**Confidence breakdown:**

- #890 root cause (fork under blown fuse): HIGH — Electron docs + afterPack.js:61 + index.ts:192 + RECONNECT=12 + no-console.log-in-child all converge; only unproven bit is baileys-under-Bun (a _fix-approach_ risk, not a _diagnosis_ risk).
- #890 string provenance (H2): HIGH — the three strings are provably initStorage-only and the doomed instance quits before initStorage.
- #537 verdict: HIGH — bundled binary contains the emit symbols; desktop hook armed; one live send confirms.

**Research date:** 2026-07-23
**Valid until:** ~2026-08-06 (stable; re-verify bundled-core version if the A-01 pin moves).

---

## Sources (URLs)

- https://www.electronjs.org/docs/latest/tutorial/fuses
