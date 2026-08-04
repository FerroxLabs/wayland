# Handoff — TVControl inside Wayland, 2026-08-04

Repos: `~/dev/tvcontrol` (v2.2.0, MIT, uncommitted one-line fix) · Wayland worktree
`~/dev/wayland-worktrees/packet-attribution` (72 commits, nothing pushed).

**Nothing pushed. No PR opened. No issue filed.**

---

## Start here

The question on the table was "it worked in Claude Code, so this is a Wayland problem." The evidence
splits: **the zero-tools failure is tvcontrol's, not Wayland's** — but Wayland has three genuine
defects of its own that this exercise surfaced, and one of them is nasty.

---

## 1. tvcontrol's MCP server: broken for every client (PROVEN)

With the repo **exactly as committed** — lockfile-pinned `zod@4.3.6`, `@modelcontextprotocol/sdk@1.29.0`
— `tools/list` does not return an empty list. It throws:

```
{"jsonrpc":"2.0","id":2,"error":{"code":-32603,
 "message":"Cannot read properties of undefined (reading '_zod')"}}
```

Reproduced from a clean clone, on stdio, with TradingView live. Any MCP client — Claude Code, Codex,
Cursor, Wayland — gets zero tools. Wayland's "Probe reported 0 tools" was reporting this accurately.

**Root cause, one line — `src/tools/sweep.js:13`:**

```js
inputs: z.record(z.array(z.union([z.string(), z.number()]))).optional()            // one arg
inputs: z.record(z.string(), z.array(z.union([z.string(), z.number()]))).optional() // fixed
```

Zod v4 requires `z.record(keyType, valueType)`. One argument leaves the value type `undefined`, so
schema conversion dies inside `recordProcessor`. Stack lands in
`node_modules/zod/v4/core/json-schema-processors.js:432`.

**Fix verified:** `tools/list` goes from throwing to **101 tools**, at 0ms and 1.2s delay, repeatedly,
over real stdio. The fix is applied but **uncommitted** in `~/dev/tvcontrol`.

**Second, related problem:** tvcontrol imports `z` from `'zod'` in ~15 files but **does not declare
zod as a dependency**. It has two deps and resolves zod transitively from the SDK. That is how a Zod
major-version change broke it silently.

### Why "it worked in Claude Code" is probably true

`package.json` history shows the SDK declared **`1.12.1` until 2026-07-16**, when commit `98bc5e0`
bumped it to `1.29.0`. SDK 1.12.1 converted schemas via `zod-to-json-schema`; 1.29.0 uses Zod v4's
native `toJSONSchema`, which is where the two-arg `z.record` requirement bites. So it very likely did
work until ~3 weeks ago, and the SDK bump broke it.

**NOT CONFIRMED.** I tried to reproduce the pre-bump world (SDK 1.12.1 + zod 3.25.76 + unfixed code)
in `scratchpad/tvold`. The server starts, but my probe harness times out against 1.12.1 — a handshake
difference in my script, not evidence either way. **Do not state the timeline as fact until someone
drives the old combination with a real client.** That is the one open question on the tvcontrol side.

### Why 512 tests and 10 verify scripts missed it

None of them speak MCP. The CLI path never goes through schema conversion, so the entire offline
suite passes while the MCP server is dead. **One test that calls `tools/list` over stdio would have
caught this and the existing 512 cannot.**

---

## 2. Wayland defects this surfaced (REAL, worth tickets)

**a. "publication rollback incomplete" is an unrecoverable state.** First import published tvcontrol
to all five agents, the probe failed, Wayland rolled back, and the Claude rollback errored
(`No MCP server named "tvcontrol" in local scope`). After that the connector is permanently stuck:
**Reconnect never re-spawns the server, and an app restart does not clear it** — confirmed by zero
spawn attempts in the logs across a full restart. Only a brand-new profile recovered. A user who adds
a briefly-broken MCP server has to throw the profile away.

**b. Wayland never runs its own stdio probe for custom servers.** "Probe reported 0 tools" persisted
on a clean profile with a working server that returns 101 over stdio, and `grep` found zero spawns of
the server binary. The tool count shown in the MCP Library is not evidence about the server.

**c. `WAYLAND_DEV_PROFILE` does not isolate agent config writes.** Running an isolated dev profile
wrote tvcontrol into the **real global** configs:

- `~/.gemini/settings.json`
- `~/.codex/config.toml`
- `~/.claude.json`

All three carry a valid `tvcontrol` stdio entry pointing at `~/dev/tvcontrol/src/server.js`. **Left in
place deliberately — Sean's call whether to remove.** Anyone testing MCP integrations on a dev profile
is silently mutating their real agent setup.

---

## 3. What DOES work (verified live, both platforms)

- **macOS**: 512/512 offline, lint clean. Live against TradingView Desktop: read `SPCFD:SPX` 30m,
  SPX 7600.49, saw the `TC-SBR Trading System` study, changed symbol to AAPL and timeframe to 1D,
  verified, pulled real OHLCV, screenshot showed the mutation on screen, read the full 240-line
  `TC-JBox V5` Pine strategy. **Chart restored** to SPCFD:SPX/30m with both studies.
- **Windows** (`seandesktop`, Tailscale): 512/512 offline. TradingView is an **MSIX/Store package**
  (`TradingView.Desktop 3.3.0.7992`) and `launch_tv_debug.bat` already handles it via `Get-AppxPackage`.
  Launched, CDP up, symbol → MSFT, verified, live quote, screenshot, **101 tools available, 0 blocked**.
- **Wayland integration itself works on a clean profile**: `enabled=true`, published to WCore, Wayland,
  Gemini and Codex with no rollback, and correct entries written to the agent configs.

---

## 4. Smaller findings

- **Cold-start `pine get` fails on the first call and succeeds on retry.** Reproduced on macOS and on
  a genuinely cold Windows instance. The tool opens the Pine Editor as a side effect but returns
  before Monaco mounts. Matters because an agent that sees an error usually reports failure rather
  than retrying. Fix is a bounded wait-for-Monaco, not a better message.
- The `pine_editor_closed` hint shows MCP syntax (`ui_open_panel({...})`) to CLI users; the actual
  command is `tv ui panel pine-editor open`.
- Under five rapid spawn/`SIGKILL` cycles the server stopped responding entirely, then self-healed.
  Consistent with tvcontrol's own comment that CDP sessions "accumulate until Electron refuses new
  DevTools clients". Worth a bounded-retry on connect.
- Windows screenshots over SSH are 52KB vs 518KB on macOS — session 0 renders an unpainted window.
  Not a tvcontrol bug, but headless Windows screenshots are not trustworthy.
- `ui_evaluate` (arbitrary page JS) is **disabled by default**, gated behind `TV_MCP_ADVANCED=1`.
  Correct posture. Any native bundling must not flip that.
- My own error to not repeat: `--output` on `tv screenshot` is a *filename*, not a path. Passing an
  absolute path is misuse, not a defect.

---

## 5. Native-support assessment

Mechanically easy. Wayland already bundles MCP servers via `bundleWaylandMcp(...)` in
`scripts/build-mcp-servers.js` (imap, news, cal-com, apple). tvcontrol fits: **MIT** (no AGPL-outbound
friction), **2 runtime deps**, proper stdio entry at `src/server.js`, published as
`@ferroxlabs/tvcontrol@2.2.0`.

**The caveat is the precondition, not the code.** Unlike the other builtins it is inert unless
TradingView Desktop is installed *and* relaunched with a debug port. Shipping it always-on gives most
users a dead builtin.

**Recommendation: detection-gated first-class support.** Detect TradingView Desktop, and only then
surface TVControl with a one-click "relaunch with control enabled". Native for traders, invisible for
everyone else.

---

## 6. Next actions

1. **Land the tvcontrol fix** — `z.record` two-arg, add `zod` to `dependencies` with an explicit
   version, and add one `tools/list`-over-stdio test. Fix is sitting uncommitted.
2. **Confirm or drop the 2026-07-16 timeline claim** (open question above).
3. **File the three Wayland defects.** (a) is the serious one.
4. **Decide on the three global agent-config entries** — leave or remove.
5. Then decide on detection-gated native support.

## Environment notes

- TradingView Desktop: `/Applications/TradingView.app`, launch via
  `bash scripts/launch_tv_debug_mac.sh 9222`. CDP on 9222; Wayland's own CDP is 9230.
- Wayland dev run: `bun run package` THEN `node scripts/build-mcp-servers.js`, then
  `WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=<name> ./node_modules/.bin/electron out/main/index.js`.
- Config store: `<profile>/config/wayland-config.txt` =
  `json.loads(urllib.parse.unquote(base64.b64decode(raw)))`, MCP servers under key `mcp.config`.
- Profiles used: `tvtest` (poisoned by the stuck-rollback state), `tvclean` (good).
- Windows: TradingView must be stopped after testing — `Stop-Process -Name TradingView -Force`.

---

## UPDATE — 2026-08-04, second session: RESOLVED IN WAYLAND

**TVControl now works inside Wayland.** MCP Library: `Server reachable - Probe reported
101 tools`; durable `enabled:true / status:connected / tools:101 / lastError:None`.

### What was actually wrong with each claim above

**"Wayland never stdio-probes custom servers" - WRONG, retract it.** The probe is real
(`McpProtocol.testStdioConnection`, spawn + `listTools()`). It was reporting tvcontrol's
own `-32603` accurately. Once tvcontrol was fixed the same probe returned 101.

**The 2026-07-16 timeline is now PROVEN, not inferred.** SDK 1.12.1 declared `zod: ^3.23.8`
and nested its own 3.25.76; 1.29.0 widened to `^3.25 || ^4.0`. Rebuilt the pre-bump tree with
`npm ci` from that commit's lockfile and drove `tools/list` against the UNFIXED source:
**82 tools, no error** (the catalog was 88 then). It worked in Claude Code until the bump.

**The unrecoverable-rollback defect had two concrete causes, both now fixed** (`e3303e5cc`),
both reproduced against the real CLI:

- `claude mcp add-json` is not an upsert - exits 1 with `MCP server X already exists in user
  config`. Only the STDIO path uses add-json; HTTP/SSE uses `claude mcp add`, which overwrites.
  So every re-publication of an stdio connector to Claude Code failed while the same operation
  on a remote connector always succeeded.
- `claude mcp remove` on an absent server exits 1 with `No MCP server named "X" in <scope>
  scope`. The absence check looked for `not found`/`does not exist` **and read
  `error.message`, which safeExecFile fixes to `Command failed with exit code 1`** - so no
  wording could ever have matched. CodexMcpAgent already classified on the joined output.

### Still open

**A background status refresh invalidates the publication compare-and-set mid-flight.**
Log evidence from the clean run: all five agents publish successfully (09:49:15 to 09:49:36),
then `!committed` throws and the rollback strips every agent at 09:50:22. Publication takes
20-45s across five serialized CLIs; the refresher cycles faster than that. This is the real
root of the divergence state, it is a serialization design change, and it was deliberately
not attempted here.

Also still open: the Library row does not re-render after durable state recovers, and an
enabled-at-rest connector is never published to the CLIs at startup (only on user action).

### tvcontrol side

Branch `fix/mcp-tools-list-zod-record`, **PR ferroxLabs/tvcontrol#2 open, not merged**.
Two-arg `z.record`, `zod` declared at `4.3.6` (it was imported in 17 files and declared in
none), version 2.2.1 + changelog, and `tests/mcp_stdio.test.js` - the first test in the repo
that speaks MCP. 517/517 offline, lint clean, 5/5 of the new tests fail on the unfixed source.

Claude Code `claude mcp list` reports Connected; Codex lists it enabled; 101 tools from a
bare environment and a foreign working directory.
