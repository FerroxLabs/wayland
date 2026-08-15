# Handoff — Smart Trader, live in the app

**`packet/wl-integration` @ `4f55c1a14`**, pushed to `ferrox`. Suite **17,509 passed, 0 failed**.
Nothing merged to main, nothing tagged, nothing released.

**[X]** means proven by executing something. Everything else is inference and says so.

Prior: `.planning/HANDOFF-2026-08-12-EVENING.md` (§0 covers the headless pass).

---

## 1. What this session was for

Smart Trader is the assistant that teaches the upcoming Master Class. Sean's flow is three
beats, and the middle one is the product:

1. **Are you set up?** If not, set them up.
2. **Show them it working** — a real report on screen, unasked. The "holy shit, it worked"
   moment. Krug's don't-make-me-think; Sutherland's make-them-feel-good.
3. **Then** offer the daily briefing.

I had verified beats 1 and 3 and skipped the middle, which made things look further along than
they were. Sean caught it. The middle is where every remaining blocker lives.

---

## 2. Verified by execution

- **The persona loads and behaves** [X]. Asked to buy Apple stock and for a view on NVDA it
  answered _"I do not place orders. I do not give financial advice on what to buy, sell, or
  hold."_ The DB carries the full 7,923-char persona on the conversation row. An earlier
  alarm from me that the persona bug had returned was **wrong** — I checked and withdrew it.
- **Beat 1 detection** [X]: _"TVControl is not installed here. Want me to set it up?"_ on a
  clean profile, via the tool-presence rule.
- **Beat 3 scheduling** [X]: a real consent card, then a real cron row —
  `0 8 * * 1-5`, "Every weekday at 8:00", enabled, next run 08:00 tomorrow.
- **All 13 routines seed disabled** [X] on a fresh profile.
- **The morning report runs on a clean machine** [X]: no env vars, cold cache, **74 names,
  zero NO DATA, ~13 seconds**. That is the payoff latency.
- **TC-TIDE drives a real chart** [X] — added, rendering, trend ribbon + TIDE +35 + T1–T4 +
  the dashboard. Done by hand through the MCP tools, **not** through Smart Trader.
- **The bundled 0.12.26 engine matches `DESKTOP_CORE_V1_PIN`** [X] — digest identical. The
  ship blocker named in the previous handoff is gone.

---

## 3. The two blockers on the middle

### 3a. Core double-fires a tool, and the contract kills the session

```
Tool call: ToolSearch          14:51:48.378
Tool call: ToolSearch          14:51:48.382   <- same tool, 4ms apart
approval_required              14:51:48.430
tool_sequence: tool event tool_running has no matching request
wcore process exited unexpectedly (code=0) during active turn
```

**Reproduced deliberately, twice** [X], and it kills BOTH beat 1 and the in-app report run.
Core announces a tool as _running_ that it never _requested_. One twin gets the approval; the
other's `tool_request` is never on the wire.

**This is Core-side, and Desktop is correct to fail closed.** The validator reads Core's raw
stdout in `consumeChunk`, before any Desktop approval logic touches the frames — so Desktop
cannot be dropping it.

`256e6399b` makes the error name the `call_id` and split the two distinct faults, because when
the engine dies mid-turn that log line is the only evidence left.

### 3b. Skills were unreadable inside the sandbox — FIXED (`4f55c1a14`)

Skills were **symlinked** into the workspace with targets in the app config dir. Core runs the
agent against a `SandboxedFs` rooted at the workspace whose containment check canonicalizes
first, precisely so _"a symlink planted inside the sandbox that points outside is detected and
refused"_ (`crates/wcore-tools/src/vfs.rs`). Deliberate hardening; our skills tripped it.

It hid well: markdown-only skills kept working, because that text is fed to the model directly.
**Skills that ship scripts did not** — the agent could see the skill and read nothing in it.
That is **7 of 36** bundled skills, including `pdf` and `morph-ppt`, not just the trading one.

Now copied, not linked. Verified from Core's source that the allowlist escape hatch named in
that same comment **does not exist in the shipped API** — `SandboxPolicy` is an enum of
`Required | Bypass` and `SandboxedFs::new` takes a single root — so copying was the only fix on
our own timeline.

⚠️ **A workspace on the Desktop would NOT have helped.** The sandbox root moves with the
workspace; the symlink target does not. That was Sean's suggestion and it was worth testing —
the answer is no, and the reason is why.

---

## 4. The instant win, built but NOT yet seen working in-app

- **A default watchlist now ships** (`1fe8b5099`) — 74 names + an empty holdings template. The
  skill shipped ten scripts and no data, defaulting to a path that only existed in Sean's
  private checkout, so on a clean machine the report had nothing to scan.
- **The persona and setup skill now END BY RUNNING IT.** Not offering. Setup finishes with a
  brief on screen, and only then offers the schedule — by which point it is an obvious yes.
  Both also fall back to the report when TradingView will not start, so a broken setup still
  ends with something real.

**Still unproven in-app** because of 3a. The report itself is a script run rather than an MCP
tool chain, so it may well survive the Core bug once 3b's fix is in a running build — that is
the first thing to test next session.

---

## 5. Open, in order

1. **Re-run the instant win in-app** on `4f55c1a14`. 3b is fixed; find out whether the report
   now completes. This is the Master Class demo.
2. **Merge `feat/nav-streamline`** — the sidebar Sean keeps recognising as old. ONE commit
   (`0707e1231`, 2026-07-03, #118: hideable logo, nav registry, **Mission Control first**).
   Never landed on main. **6 conflict hunks across 5 files** — `Layout.tsx`,
   `Sider/index.tsx`, `SettingsSider.tsx`, `NavigationSettings`, `i18n-keys.d.ts`, ~575 lines
   in conflict regions. I aborted rather than resolve a sidebar rewrite I could not also
   visually verify. `feat/frictionless-issue-filing` (#464) is in the same state, 1 commit.
3. **Core handoff for 3a**, timed before 0.13.0.
4. `enable_routine` / `install_agent` proposal handlers are still inert contracts.

---

## 6. Corrections owed to the Core 0.13.0 handoff

Sean's Core session produced `DESKTOP-INTEGRATION-0.13.0.md`. **That file is not on this
machine** — not in `waylandcore`, the lane worktrees, or git history. I checked its claims
against Desktop source anyway:

- 🔴 **"Desktop implements no negotiation at all" is FALSE.** `desktopContractV1.ts` has a full
  state machine — `mode: 'unnegotiated' | 'legacy' | 'v1' | 'failed'`, `negotiate()` at :1035,
  and it **fails closed** if Core emits anything before `ready`:
  `fail('ready_required', 'Core must negotiate before emitting events')`. That reassurance is
  exactly what would let a breaking `ready` change ship. Their own note flagged it as needing
  re-confirmation; this is it.
- 🟡 **"No exit-code handling" — right grep, wrong directory.** It lives in
  `src/process/task/WCoreManager.ts:1326` (`handleProcessExit`), not
  `src/process/agent/wcore/`. Desktop does not _branch_ on the value but does render it via
  `describeExitReason` — "Agent process exited with code 0" was on screen today [X]. Low risk
  to control flow, real change to user-visible text.

---

## 7. Traps paid for this session

- ⚠️ **I forced the renderer viewport to 1500px over CDP** while the window was 1209px, which
  clipped content off the right edge — then reported my own artefact as a layout bug from
  screenshots taken through it. All driver scripts now leave the viewport alone. The only real
  overflow is the tab strip, by 2px.
- ⚠️ **`rtk` breaks `wc -l`** (returned 0 for a 75-line file) as well as `diff` and `git log`.
  Use `/usr/bin/wc`, `/usr/bin/diff`, `shasum`.
- ⚠️ **The dev app dies with the shell that launched it.** `run_in_background` keeps it up only
  while that task lives; `nohup … &` does not survive the tool call at all. Launch:
  `WAYLAND_DEV_PROFILE=Wayland-SmartTrader WAYLAND_CDP_PORT=9230 npx electron-vite dev`.
  `--remote-debugging-port` is **ignored** — the app picks its own port from `WAYLAND_CDP_PORT`.
- ⚠️ **`WAYLAND_DEV_PROFILE` isolates userData without `WAYLAND_MULTI_INSTANCE`**, which is the
  clean way to get a fresh profile. `~/.wayland-dev` and `~/.wayland-config-dev` are symlinks
  INTO the active profile, not shared state — that confused me for a while.
- ⚠️ **flux-auto started returning** `max_tokens must be less than or equal to 4096` mid-session
  and blocked every turn. Unresolved; may just be routing.
- ⚠️ **`better-sqlite3` is built for Electron's ABI** — use `/usr/bin/sqlite3` for profile DBs.

---

## 8. Claims withdrawn — do not re-assert

- "All lanes are merged." **Wrong, twice.** I checked only `packet/wl-*` and missed older
  feature branches. `feat/nav-streamline` and `feat/frictionless-issue-filing` were never
  merged. Sean was right both times he pushed back.
- "The persona bug is back." Wrong — the DB and the behaviour both say it loads.
- "0.12.27 RC" does not exist. Newest published Core is **v0.12.26** stable (2026-08-08).
