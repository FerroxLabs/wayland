# WLD-K handoff v3 — MCP root-caused and filed, workbench redesigned

**Worktree** `~/dev/wayland-worktrees/packet-attribution`, branch `packet/attribution-audit`,
head **`d61f38300`**, in sync with `ferrox`. Full suite **16,321 passed, 0 failed**, typecheck clean.
**Nothing merged, nothing tagged, no PR.** Only `AGENTS.md` and the never-commit
`constitutionFsAuthority.generated.ts` are dirty (both permanent).

**Read in this order**
1. this file
2. `phases/WLD-K-core-first/W-1-RESULT.md` — the MCP root cause, measured
3. `HANDOFF-TO-CORE-2026-08-08-v0.12.26-host-findings.md` — C-1…C-5b (C-5b filed as core#265)
4. `K-05-INSTALLER-PLAN.md` — the installer build plan, not yet executed

---

## 1. The headline: MCP is root-caused, filed, and still blocking

**Core's `ToolSearch` is an ALL-tokens literal substring match** (`tool_search.rs:120-123`), not a
semantic search. Every whitespace token of the query must be a literal substring of the tool's name
or description. Proven back to back in one session on one tool:

```
ToolSearch("probe")                                   -> MATCH
ToolSearch("wld_probe_secret tool schema parameters") -> no match
```

The failing query **contains the tool's exact name**. Longer queries match *less*, so a model that
gets nothing and rephrases more fully diverges. Punctuation is part of the token, so
`aion_list_models,` never matches. **Not model-specific** — 28/28 tool calls were `ToolSearch` on
`claude-sonnet-5`; re-repro'd on `gpt-5.6-sol`. My first attribution to the Gemini
`thought_signature` defect (C-4) was **wrong**; that is a separate real defect.

**C-5b is the half that still blocks us, and it is Core's.** With the matcher mitigated host-side,
searches now MATCH and the tool *still* never becomes callable. The model said so itself, unprompted,
via the shell: `printf 'Tool schema did not load into the callable tool registry.'` That is the
hydration-blind snapshot — `registry.rs:206-216` is never rebuilt on hydration while the state lives
in `engine.rs` `hydrated_tool_names`, with no write path between them.

**Latest measured impact — this is the part to lead with:** a research turn spent
**21 ToolSearch calls, 4 Bash, and ended `finish_reason: 'max_turns'`** without writing a word of
output. C-5b does not merely add noise; it **consumes the entire turn budget**. "Continue" just
resumes the loop.

**Filed as `FerroxLabs/wayland-core#265`** (as FerroxLabs; no duplicate among their 15 open issues).
**Sean says C-1…C-5 are being fixed and a private build is coming for us to integrate against.**

### What IS proven

An MCP tool executes **end to end on the engine** — discovery, invocation, tool-body execution
(verified by a witness file the tool itself writes), and the output reaching the reply — on both a
config-declared server and a runtime `add_mcp_server`, with `deferred` at its default, on Flux and
Gemini models. Committed as a gated test: `bun run test:mcp:e2e`.
**Not achieved in the packaged app.** That gap is C-5b.

---

## 2. When the private Core build lands — do this, in this order

1. Drop the binary in and bump `DEFAULT_WCORE_VERSION` via
   `node scripts/stage-wcore-bump.mjs vX.Y.Z --write`. A private build will **fail the publisher
   attestation gate** (`verifyFinalAcceptance.js:196` needs exactly one active policy) — expect that
   and do not weaken the gate to get past it; use a dev-only path.
2. Re-run `bun run test:mcp:e2e`. It should still pass.
3. **Delete the ToolSearch guidance** — `src/process/agent/wcore/toolSearchGuidance.ts` plus its
   injection in `wcore/index.ts` and the four tests in `wcore-profileIsolation.test.ts`. It is
   marked "DELETE THIS once Core fixes C-5" in the file. It is a workaround for a matcher bug and
   should not outlive it.
4. Re-run the live app turn and confirm an MCP tool's body executes **in the app**. That is the
   moment the Master Class claim holds or does not.
5. Re-measure the loop: tool-call mix and `finish_reason` should stop being `max_turns`.

---

## 3. Progress panel is broken — root-caused, NOT fixed

Sean: *"the main thing with the sidebar is to show progress"*. It does not work, and it is not just
conditional-and-quiet. Instrumented live:

```
visible: false · plan: 0 · activities: 0 · msgs: 7 · afterFilter: 0
```

Seven messages in the conversation, **zero reaching the execution snapshot**. The WCore message
order is:

```
text:left · tool_group · tool_group · tool_group · text:right · text:right · tips:center
```

`selectCurrentExecutionMessages` (`src/common/execution/adapters/messages.ts:43-52`) treats
*everything after the last user message* as the current turn. The last `text:right` is at index 5,
so it slices to `[tips:center]` and discards the three `tool_group` messages at indices 1–3. The
turn-boundary heuristic does not hold on the WCore path.

**Same starvation breaks Observability**, which also shows an empty state while the chat plainly
lists tool calls. **One fix, two panels.**

Not attempted because the same function serves the ACP and Gemini paths, so the boundary rule needs
its own packet rather than a bolt-on. **This is the highest-value remaining host-side item.**

---

## 4. What landed since the last handoff (17 commits)

**MCP / Core**
- `284f4f54b` W-1 root cause · `3227332a2` the guidance mitigation (28→2-5 searches, 19→0 no-match)
- `442b91e4e` six cross-audit defects fixed in my own work (see §6)
- `c967368e3` + `e26486ea2` **W-1b fixed**: a failed bootstrap was cached forever (same PID, 95s
  apart, no second spawn); now retries once per turn, rate-limited so cron cannot spawn-storm
- `381f6f6ee` **W-1a withdrawn — I was wrong.** The "turn may wedge" line is a FALSE ALARM: 4 of its
  5 occurrences are followed within ~70ms by `[Bash success] Exit code: 0`
- `5856e5d5a` the live E2E test · `8f53cedc2` + `f4cc197c4` C-5b written up and filed as core#265

**UI**
- `72954ae01` clicking a dormant section no longer vaporises the workbench (`activate()` now records
  user intent that outranks the provider's `requestedOpen`)
- `35340f42f` the panel had **no surface at all**: `bg-bg-2` / `border-border-1` are not real tokens
  (they are `bg-2` / `border-3`), so it compiled to transparent, 0px border, no shadow — it was
  literally rendering as the background
- `a320bd94d` the redesign: one chrome row, tabs instead of a stacked list, 12px gutter, even 12px
  inset, elevation ladder. Label repeats 3→1, close buttons 2→1. "Core" lane renamed **"Engine"**
- `f61b73996` + `d61f38300` activity rows now say what a tool acted on, not just its name

---

## 5. Work list

### W-A — Fix the execution-snapshot turn boundary **[M · highest value]**
See §3. Unblocks **both** Progress and Observability. Touches ACP/Gemini too, so establish the
correct boundary rule rather than special-casing WCore.
*Done when:* a live WCore turn populates Progress with its plan steps and Observability with its
activity, proven by running it, plus a regression test using the real message order above.

### W-B — Integrate the private C-1…C-5 Core build **[S/M · blocked on Sean]**
The five steps in §2.

### W-C — Carry the ToolSearch query through to the renderer **[S]**
A tool node's `detail` holds the tool's **output**, not its input — the query never reaches the UI,
which is why labels fall back to "Looking for a tool". Plumb the arg from the engine event into the
`tool_group` message so the real term shows. Small, and it makes the timeline genuinely readable.

### W-D — The `bg-bg-*` sweep **[S/M]**
15 other files use `bg-bg-2` and are presumably invisible the same way the workbench was. Deliberately
not swept as a drive-by. Worth a measured pass: check computed style, do not trust the class name.

### W-E — K-05 agent installer **[L · plan ready, never started]**
`K-05-INSTALLER-PLAN.md`. Requirements INS-01…INS-06 exist; there is **zero install code** in `src/`
(positive-controlled). Detection exists for claude, codex, kimi, auggie, goose, qwen, opencode,
copilot, droid. **Not blocked on Core** — Core's `plugin install` is for its own plugins and
`migrate` only imports existing config.
Findings that change the shape, all established by execution: **auggie cannot satisfy INS-01 at all**
(`authMethods: []`, OAuth-terminal-only); **qwen can**; the Windows spawn path breaks on the space in
`C:\Program Files\Wayland` because only the first quoted token survives `parseWindowsCliPath`.

### W-F — L-2…L-6 live verification **[M]**
Still outstanding. **L-2 was NOT validly run** — it looked clean after a real SIGKILL but the
positive control failed: polling every 250ms through a launch never observed the profile splice, and
no `--profile` reached the spawn args. With no connectors selected there is nothing to write, so
"clean afterwards" was vacuous. Select a connector first, confirm the splice appears, then kill.

---

## 6. Guardrails — the ones that bit

- **NEVER `git add -A src`.** It sweeps `constitutionFsAuthority.generated.ts` (local trust-root
  sha). It happened in `2e32d11f7`. **Stage by explicit path.**
- `bun run start` does **not** run the prebuild hooks, so the app dies with
  `ConstitutionFsBinaryError: Adjacent manifest disagrees with trusted embedded authority`.
  Fix: `node scripts/prepareConstitutionFs.js` — which modifies that never-commit file. Leave it dirty.
- No merge, no tag, no release, no PR without Sean. `build-and-release.yml` fires on **ANY** tag.
- Never touch `~/dev/wayland/app`. gh writes must be **FerroxLabs**. No backticks in gh bodies.
- **Sean's `~/Library/Application Support/wayland-core/config.toml` is `sha256:0bc1051d…` and must
  stay that way.** It has `backend = "plaintext"`, which makes 0.12.26 refuse to start. Run the
  engine under a scratch `WAYLAND_HOME` instead — never edit his file.
- Never relax, skip or delete a test to make something pass. When a control is deliberately removed,
  **retarget** its test to the new owner (done twice this session), do not delete coverage.

## 7. Method rules that earned their place

- **A zero proves nothing until the same method finds a known positive.** Caught here twice: the
  L-2 splice (vacuous pass) and `init_history` never being logged at all.
- **Verify the fix in the thing the user sees.** The ToolSearch label passed its unit tests and
  rendered `Looking for a "[ { [... 197 similar lines" tool` live. Detail is output, not input.
- **Measure the style, don't read the class name.** `bg-bg-2` looked correct in source and compiled
  to nothing for months.
- **Run the negative control both directions.** Every fix this session did.
- rtk truncates and mangles: use `rtk proxy <cmd>` for counting, and the vitest JSON reporter
  (`--reporter=json --outputFile=…`) to read failures reliably.

## 8. Live-verify rig

`WAYLAND_HOME=<scratch> WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=L1-1226`
`WAYLAND_DISABLE_AUTO_UPDATE=1 WAYLAND_CDP_PORT=9230 bun run start`, CDP on 127.0.0.1:9230.
Helper scripts (`cdp.js`, `chat.js`, `drive.js`, `probe-mcp-server.js`) live in the session
scratchpad and **are wiped by a compact** — the committed
`tests/integration/helpers/probeMcpServer.cjs` is the durable copy of the probe server.
Engine base URL is `https://api.fluxrouter.ai` **without** `/v1` — Core appends it, and `/v1/v1`
returns a 404 that looks like a bad key. Burner key: `~/.config/wayland-smoke/flux-test-key`.
Clicking a sidebar chat over CDP needs a **DOM `.click()` walking a few ancestors**; synthetic mouse
events at coordinates do not open it.
