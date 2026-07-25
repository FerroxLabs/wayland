---
phase: WLD-D-inbox-repairs / D-01
reviewed: 2026-07-23T23:42:15Z
depth: deep
files_reviewed: 15
files_reviewed_list:
  - src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ts
  - src/process/channels/plugins/tier1/whatsapp/bridgeSpawnConfig.ts
  - src/process/channels/whatsapp-bridge/backends/baileys.js
  - src/process/channels/whatsapp-bridge/backends/bridgeLogger.js
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.bridge-path.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.bridge.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.capabilities.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.medfixes.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.mode.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.reconnect.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ssrf.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.webhook.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.welcome.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/bridgeLogger.test.ts
  - tests/unit/process/channels/plugins/tier1/whatsapp/bridgeSpawnConfig.test.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase WLD-D / D-01: Code Review Report

**Reviewed:** 2026-07-23T23:42:15Z
**Depth:** deep
**Files Reviewed:** 15 (4 source + 11 test)
**Status:** issues_found (no blockers — the fix is sound; findings are 2 pre-existing WARNINGs + 3 nits)

## Summary

The #890 fix is **correct and adequately locked by tests.** I independently traced all six
load-bearing points against the actual code, not the description:

1. **Transport contract preserved.** Grepping the whole `whatsapp-bridge/` tree + `WhatsAppPlugin.ts`
   for `process.send` / `process.on('message')` / `parentPort` / `NODE_CHANNEL_FD` / `.send(` turns up
   **no real IPC data path** — every hit is either a comment or the QR heuristic that was removed.
   Requests still flow parent→child over `child.stdin.write` (`WhatsAppPlugin.ts:1002`) → `bridge.js`
   `process.stdin.on('data')` (`bridge.js:69`); responses flow child→parent over `process.stdout.write`
   in `writeFrame` (`bridge.js:96`) → `child.stdout.on('data')` (`WhatsAppPlugin.ts:709`). Dropping the
   `'ipc'` slot breaks nothing.
2. **QR env-gate polarity is correct.** Old `hasIpc = typeof process.send === 'function'; if (!hasIpc)`
   → render when standalone. New `underParent = env.WAYLAND_BRIDGE_UNDER_PARENT === '1'; if (!underParent)`
   → render when standalone. Under the Electron parent the plugin always sets the flag
   (`bridgeSpawnConfig.ts:74`), so ANSI is suppressed exactly as before; a dev running `node bridge.js`
   directly has no flag and still gets the QR. `baileys.js:194-201`.
3. **`buildBridgeSpawnConfig` can never spawn `process.execPath` or carry `ELECTRON_RUN_AS_NODE` in a
   packaged build.** It composes `resolveJsRuntimeWith` (`jsRuntime.ts:86`): packaged → bundled Bun
   (`command=bunPath, env={}`) or, if Bun is missing, system `node`/`node.exe` (`env={}`). Only the
   unpackaged `electron-node` branch returns `execPath` + `ELECTRON_RUN_AS_NODE=1`. Verified.
4. **`handleFrame` object-guard prevents the `TypeError`.** `typeof parsed !== 'object' || parsed === null`
   short-circuits primitives (`5`, `true`, `"x"`) and `null` before `'id' in frame`, which would otherwise
   throw `Cannot use 'in' operator ... in 5` and escape the `stdout 'data'` handler. Happy path
   (numeric-id responses, method notifications) is unchanged. `WhatsAppPlugin.ts:805`.
5. **spawn-vs-fork semantics hold.** `child.stdin` / `child.stdout` / `child.once('exit'|'error')` are all
   valid on a `spawn()` ChildProcess; stdio `['pipe','pipe','inherit']` makes stdin/stdout real streams.
   Nothing depended on fork's `silent` option (that flag only existed to force `pipe` — now done explicitly).
6. **Tests lock the invariants.** `bridgeSpawnConfig.test.ts` composes the REAL `resolveJsRuntimeWith`
   (no mock) and asserts packaged→Bun-not-execPath, no `ELECTRON_RUN_AS_NODE`, no `ipc` in stdio, flag set.
   `bridgeLogger.test.ts` asserts `dest.fd === 2`. `bridge.test.ts` pollution suite feeds `5`, `true`,
   `[]`, a pino NDJSON object and garbage and asserts no throw + a valid frame still resolves. All 9
   migrated suites mock `spawn` (not `fork`) and pin `resolveJsRuntime`. These fail if the fix regresses.

Per the parent brief: #890 only reproduces in a FUSED packaged build, so unit tests structurally cannot
reproduce the boot-a-second-Electron bug — that is expected and not held against the tests. The invariants
they lock (never `execPath`, no `ELECTRON_RUN_AS_NODE`, pino on fd2, primitive-tolerant framing) are the
correct proxies.

**Verdict: GO.** No Critical or High findings. The two WARNINGs below are both **pre-existing** (present
before this diff) and independently confirm the prior reviewer; neither blocks #890.

## Warnings

### WR-01: Bridge child inherits the FULL `process.env`, bypassing the envAllowlist safeSpawn uses

**File:** `src/process/channels/plugins/tier1/whatsapp/bridgeSpawnConfig.ts:74`
**Status:** Pre-existing (the old `fork` also inherited full `process.env` by default) — **confirms the prior reviewer.** Not a #890 regression.

**Issue:** `env: { ...parentEnv, ...runtime.env, [BRIDGE_UNDER_PARENT_ENV]: '1' }` forwards the entire
main-process environment into the bridge child. The sibling #706 site, `safeSpawn.ts:172`, deliberately
routes env through `buildChildEnv` (`envAllowlist.ts`), which forwards only a fixed allowlist (`PATH`,
`HOME`, `NODE_ENV`, `ELECTRON_RUN_AS_NODE`, locale/tmp vars, exact `IJFW_*`). The bridge child runs
third-party npm dependencies (`baileys`, `qrcode-terminal`, `whatsapp-web.js`); any of those — or a
transitive dep — executing in that child gets read access to every secret/token the main process holds in
its environment. The fork→spawn migration was the natural moment to close this to match the app's own
standard, and it was not taken. Defense-in-depth corollary: because `runtime.env` for the packaged path is
`{}`, this merge would also pass through a stray `ELECTRON_RUN_AS_NODE` if one ever existed in the parent
env (it does not today in the Electron main process, so no live exposure).

**Fix:** Route the bridge env through the same allowlist, adding the one bridge-specific key. `HOME` is
already allowlisted, so the baileys `sessionDir` fallback (`baileys.js:118`) keeps working:
```ts
import { buildChildEnv } from '@process/services/ijfw/envAllowlist';
// ...
env: buildChildEnv({ ...runtime.env, [BRIDGE_UNDER_PARENT_ENV]: '1' }),
```
(`buildChildEnv`'s `EXTRA_KEY_PATTERN` accepts `WAYLAND_BRIDGE_UNDER_PARENT` and `ELECTRON_RUN_AS_NODE`.)
If a broader set of vars is genuinely required by baileys, extend the allowlist explicitly rather than
inheriting everything.

### WR-02: Stale `--session` comment + dead per-instance session isolation

**File:** `src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ts:338-339` (and `src/process/channels/whatsapp-bridge/bridge.js:43`)
**Status:** Pre-existing — **confirms the prior reviewer.** Not introduced or touched by this diff (the old `fork(entry, ['--backend', backend])` also omitted `--session`).

**Issue:** The comment claims "sessionDir is supplied at fork time via CLI flag," but the argv the plugin
builds is only `[entry, '--backend', backend]` (`bridgeSpawnConfig.ts:72`) — no `--session` is ever passed.
`bridge.js:43` therefore always reads `SESSION_DIR = getArg('session', '') === ''`, and `baileys.js:116-118`
falls back to a single shared `~/.wayland/baileys` auth dir for every instance. The per-instance session
plumbing (`getArg('session')` → `sessionDir` → `useMultiFileAuthState`) is dead: two WhatsApp channel
instances would collide on one credential store. Low live impact today (channels appear single-instance in
practice), but the comment actively misleads a future maintainer into believing isolation is wired.

**Fix:** Either pass the flag so the plumbing becomes live —
```ts
argv: [entry, '--backend', backend, '--session', sessionDirForThisInstance],
```
— or, if single-shared-session is intended, delete the dead `getArg('session')` path in `bridge.js` and
correct the comment at `WhatsAppPlugin.ts:338` to state that the session dir is resolved child-side from
`HOME`. Track as its own item; out of scope for the #890 land.

## Info

### IN-01: `handleFrame` comment overstates the guard (arrays are not dropped by it)

**File:** `src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ts:801-805`
**Issue:** The comment says primitives, null, **and arrays** are dropped by the guard, but
`typeof parsed !== 'object' || parsed === null` does not catch arrays (`typeof [] === 'object'`, not null).
An array falls through to `'id' in frame` (valid on arrays, returns false) and `'method' in frame` (false),
so it is silently ignored anyway — no crash — but not by the mechanism the comment describes.
**Fix:** Tighten the comment to "primitives and null are rejected here; arrays and non-frame objects fall
through both branches harmlessly," or add `|| Array.isArray(parsed)` to the guard to match the prose. The
`bridge.test.ts` pollution case already feeds `[]` and passes, so no behavior change is required.

### IN-02: Migrated test spies still named `forkSpy` after the fork→spawn migration

**File:** `tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.medfixes.test.ts:18,73,80,138`; `tests/unit/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ssrf.test.ts:19,68,76,79`
**Issue:** Both suites correctly mock `spawn` (e.g. `medfixes:80` `spawn: forkSpy`), but the spy variable is
still called `forkSpy`. Functionally fine — point 6 (mock `spawn`, not a leftover `fork`) is satisfied — but
the name will mislead a future reader into thinking `fork` is still the transport.
**Fix:** Rename `forkSpy` → `spawnSpy` in both files for consistency with `bridge.test.ts`.

### IN-03: Packaged system-node fallback parks `error` on ENOENT rather than reconnecting

**File:** `src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ts:733-736` (with `jsRuntime.ts` `system-node` branch)
**Issue:** In a packaged build where bundled Bun is somehow absent, `resolveJsRuntime` returns bare
`node`/`node.exe`. If no `node` is on PATH, `spawn` emits `'error'` → `setError()` — the channel parks
`error` with no reconnect ladder. This is the documented, intended degradation (`jsRuntime.ts` comments say
callers "already degrade on" ENOENT, and parking beats crash-looping), so it is a residual-risk note, not a
defect. Worth a one-line log hint pointing at a missing bundled Bun so support can distinguish it from a
genuine backend failure.
**Fix:** Optional — in the `'error'` handler, if `err.code === 'ENOENT'`, append a hint like
`"(no JS runtime found — bundled Bun missing from the package?)"` to the surfaced error.

---

_Reviewed: 2026-07-23T23:42:15Z_
_Reviewer: Claude (ferrox-code-reviewer)_
_Depth: deep_
