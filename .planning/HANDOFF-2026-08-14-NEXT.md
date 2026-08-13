# Handoff — next session

**Start here.** `packet/wl-integration` @ `799fbf087`. Suite **17,513 passed / 0 failed**,
`tsc --noEmit` clean. **Not pushed, not tagged, not merged.**

**[X]** = proven by executing. Everything else says what it is.

---

## 1. State: the Master Class demo works, beats 1 and 2

Core 0.13.0 "mcpfold" is integrated and live-verified [X].

| thing | value |
|---|---|
| engine binary | `~/Downloads/wcore-0130-mcpfold/wayland-core` |
| **identify it by this, never `--version`** | sha256 `be64e252455045695a390e6447ed24366451d7114e625c779cfc1560dcb5031e` |
| installed at | `~/Library/Application Support/Wayland-SmartTrader/wayland-core-overrides/darwin-arm64/wayland-core` |
| corpus source | Core `release/v0.13.0 @ 9b58c893` |
| pin | minor 14, gen/14, fixture `9d5ef0ca…`, schema `306d83e1…`, srcinputs `59b607a0…` |

**Beat 1** [X] — Smart Trader detects and health-checks TVControl unaided.
**Beat 2** [X] — a real 74-row report, **0 rows carrying an error**, `mr.json` 53,345 b and
`morning-brief.html` 78,612 b written to the workspace outbox by the agent itself, under
`compaction = "full"`. Copy kept at `~/Downloads/wayland-morning-brief-AGENT.html`.
**Beat 3** — NEVER TESTED. See §3.

Core's fold fix verified under `compaction = "full"`, which is the only condition that proves
anything [X]: `ToolSearch("chart_set_symbol")` → `chart_set_symbol`, `watchlist_import` →
`watchlist_import`, 3 ToolSearch successes on the wire, **0 fold markers**, grep
positive-controlled on the same segment.

---

## 2. ⚠️ Two deliberate changes to Sean's REAL Core config

`~/Library/Application Support/wayland-core/config.toml` — his file, both his explicit call,
both backed up. **Do not "tidy" either one away.**

1. `compaction = "full"` — restored (line ~55). The `"safe"` workaround is no longer needed now
   the engine is fixed, and `full` is what proves the fold fix. Backup:
   `config.toml.bak-precompaction-20260813`.
2. **`[security] allow_sandboxed_shell_network = true`** — ADDED (line ~16). Core's sandboxed
   shell had NO DNS (`curl: (6) Could not resolve host`), so every data-fetching skill returned a
   complete, well-formed, EMPTY report at exit 0. ⚠️ The grant is **all-or-nothing whole-host
   network** — no sandbox backend can filter shell egress by host. Backup:
   `config.toml.bak-prenetwork-20260813`.

Pre-existing, not ours: `[security] enabled = false` (the in-process HTTP egress gate is off).

**This is why the demo is "works on Sean's box", not "works for a student".** A Master Class
attendee cannot be asked to grant whole-host network. The real fix is Core's per-skill outbound
allowlist, already filed in `.planning/HANDOFF-TO-CORE-2026-08-13-TOOLSEARCH-FOLD.md` §4b-1.

---

## 3. The plan, in order

### 3.1 Merge `feat/nav-streamline` — #118 (do this first)
`0707e1231`, verified still unmerged with a control [X]. This is the "old sidebar" Sean has
flagged **three separate times**; it is the most visible thing wrong with the app and the one
thing a Master Class audience actually sees.

- 6 conflict hunks across 5 files, ~575 lines: `Layout.tsx`, `Sider/index.tsx`,
  `SettingsSider.tsx`, `NavigationSettings`, `i18n-keys.d.ts`.
- Content: hideable logo, nav registry, **Mission Control first**.
- I aborted this last time because I could not visually verify a sidebar rewrite. **That excuse
  is gone** — the CDP rig works (§5). Resolve, then screenshot the sidebar before/after and
  compare, and click every nav item.
- Also merge `feat/frictionless-issue-filing` (`572d71131`, #464), 1 commit, low risk.

### 3.2 Close beat 3 — the daily briefing offer
Beats 1 and 2 pass, so this is short. Smart Trader should, after showing the report, offer to
schedule it and then create a real cron row. Previously verified in isolation: `0 8 * * 1-5`,
"Every weekday at 8:00", enabled, next run 08:00. Test the whole arc in ONE conversation:
opener → detection → report → offer → accept → cron row exists in the DB.

### 3.3 Retest `stream_end` before `stream_start`
Reproduced **twice** on the previous 0.13.0 build [X]; not seen since mcpfold went in, but never
deliberately provoked. Both occurrences were ordinary single-Bash turns. If it reproduces, get a
minimal repro and send it to Core — they own turn framing.

### 3.4 Then, and only then, K-06 — the Flux fan-out
**Not built. Zero code** — I grepped [X]. This is the moat: after an install, write the agent's
own config so its provider base URL points at Flux with the pinned catalogue.

Hard constraints carried from planning: API key + base URL ONLY; **never Claude subscription
OAuth (standing hard NO, ToS)**; never write a key into a file we do not own without telling the
user and letting them undo it; restore-don't-strand if Flux is removed; filter pinned models per
agent capability (a pinned model that 500s in Claude Code is worse than not offering it).

It is an L and it does **not** block the Master Class. Do not start it before 3.1–3.3.

### 3.5 At tag time (Sean's call, not ours)
`DEFAULT_WCORE_VERSION` is still `'v0.12.26'` in `scripts/prepareWaylandCore.js`, and
`desktopContractV1.test.ts` carries a deliberate TRIPWIRE asserting that plus
`DESKTOP_CORE_V1_PIN.minor === 14`, with a comment saying the branch cannot ship. When Core tags
v0.13.0: set both to `v0.13.0` and delete the tripwire block. Not before.

---

## 4. Already done — do NOT redo

- **Agent installer is BUILT and is the final proposed version.** 1,207 lines in
  `src/process/services/agentInstaller/` + `agentInstallerBridge.ts` + settings UI, 8 test files
  including a bridge-allowlist red-team test. Scope is deliberately **two** agents: `codex`
  (`@agentclientprotocol/codex-acp`) and `kimi` (`@moonshot-ai/kimi-code`) — the "npm subset,
  shipped and solid" decision, and only kimi cleanly maps to the ACP seam. Detection already
  covered 18 agents. Widening the catalogue is a choice, not a gap. K-05b (non-npm channels) is
  not built and was not planned for this milestone.
- Three Desktop fixes for the report (`edb113f2c`): `report.mjs` cache probes env → home →
  workspace → tmp instead of assuming `~/.cache` (EPERM in the sandbox produced NO DATA (74) at
  exit 0); the Smart Trader persona now names the skill path; `wayland-morning-report/SKILL.md`
  points at `.wayland-core/skills/…` instead of two paths that do not exist in the sandbox.
- `call_announced` handler (`f0fcfd291`) — Core's 0.13.0 fix is NOT sufficient alone; the host
  must REGISTER the frame, in both the `ordinary` allowlist and the announce branch.

---

## 5. Method notes that cost real time

- **Identify every engine binary by sha256, never `--version`.** The old bundled build
  self-reports `0.12.26` and is not the release.
- **Skills land in a workspace only for the assistant that PINS them, and the workspace is per
  ENGINE SESSION, not per conversation.** Switching chats does not re-provision — a Smart Trader
  chat opened after a Wayland Core chat inherits a workspace with no `market-open-report`. To
  test Smart Trader: restart the app, open Smart Trader FIRST.
- **The dev app dies with the shell that launched it.** `WAYLAND_DEV_PROFILE=Wayland-SmartTrader
  WAYLAND_CDP_PORT=9230 npx electron-vite dev` under `run_in_background`. Two instances silently
  fight over the port — `pkill -9 -f "wl-integration/node_modules/electron"` between runs.
- **CDP rig** (scratchpad is wiped between sessions — rebuild it): connect to
  `http://127.0.0.1:9230/json/list`, take the `page` target's `webSocketDebuggerUrl`, drive with
  `Runtime.evaluate` + `Input.dispatchMouseEvent` + `Input.dispatchKeyEvent` (type `char` per
  character; `Input.insertText` sometimes does not reach React). **Never override the viewport** —
  doing so clips the UI and produces fake layout bugs. Get element coords from
  `getBoundingClientRect()` in-page, never from screenshot pixels.
- Read results from the **DB**, not the screen: `/usr/bin/sqlite3
  "~/Library/Application Support/Wayland-SmartTrader/wayland/wayland.db" "SELECT content FROM
  messages ORDER BY rowid DESC LIMIT 5;"`. `better-sqlite3` is Electron-ABI, use `/usr/bin/sqlite3`.
- Engine log: `~/Library/Logs/Wayland-Dev/<date>.log`. **Always positive-control a grep** before
  believing a zero — a zero from the wrong log file cost me a wrong conclusion.
- `rtk` swallows the dev server's stdout entirely (0 bytes) and mangles shell loops over
  `git log`. Use `python3` for anything iterating git output, and quote paths with spaces.
- Composer placeholder varies: `"Smart Trader, Send a message…"` on a new chat vs
  `"Send message to <model>"` inside one. Match on `/Send (a )?message/`.

---

## 6. Open with Core (filed, theirs to fix)

`.planning/HANDOFF-TO-CORE-2026-08-13-TOOLSEARCH-FOLD.md`:
- **Per-skill outbound network allowlist** — the blocker on shipping this to anyone but Sean.
- `MAX_MATCHES = 10` (`tool_search.rs:190`) — no single query enumerates a 101-tool server.
- `stream_end` before `stream_start` (§3.3 above).
- `record_hydrated_tools` (`engine.rs:17015`) silently returns on parse failure — no log.
- `compact_json` interpolates object keys unescaped (`json.rs:38`).
- `fold.rs` divides a char-counted prefix by a byte length, so CJK never folds.
- ⚠️ Their `frontier/m0` is NOT the shipping tree; auditing there inverts conclusions.
