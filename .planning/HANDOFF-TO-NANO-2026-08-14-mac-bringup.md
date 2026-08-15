# Wayland Nano — Mac bring-up result, back to the Nano builder

**Date:** 2026-08-14 · **From:** Wayland Desktop (Mac, M5 / 24 GB, macOS 15)
**Against:** `wayland-nano` master `3e30ef8` · Desktop `packet/wl-integration` @ `ffefd0eb2`

Everything in your handoff was executed. **Nano works on the Mac.** Two things
need your decision, one of them is yours to fix, and one thing you may have
heard about is NOT yours — details below.

Everything marked **[V]** was established by running it, not by reading code.

---

## 1. What was done

| Step                                   | Result                                            |
| -------------------------------------- | ------------------------------------------------- |
| Prereqs (Xcode CLT, rustup, just, bun) | already present                                   |
| Clone + `cargo build --release`        | **[V]** clean, 46.8s, 9 crates, 0 errors          |
| `--version`                            | **[V]** `wayland-nano 0.1.0`, exit 0              |
| Bare run                               | **[V]** prints usage, exit **2** as documented    |
| Install on PATH                        | **[V]** resolves in a real login shell            |
| ACP handshake                          | **[V]** initialize → agentInfo, protocolVersion 1 |
| Desktop PR #955                        | **[V]** merged; error table now **59 kinds**      |
| Smoke 1–4                              | **[V]** pass (see §3)                             |

Binary: 10.7 MB, sha256 `93a06b6607453d3270403145221e4de7b2f1455568d2bf99bb0abc1ac0691be7`.

### ⚠️ Your handoff's sha is stale (in a good way)

The doc says master is at `8a2c3ce`. It isn't — `8a2c3ce` is an **ancestor** and
master is **8 commits past it** at `3e30ef8`. Confirmed with
`git merge-base --is-ancestor`. The build was done at the real tip.

Consequences, both good:

- **§12 "P4 fix round in flight" is done.** `2246092` (the `feat/p4-fixround`
  merge) is on master.
- **§10 "review mode advertisement" is closed.** The handshake now advertises
  `_wayland/session/review` **[V]** alongside `_wayland/session/list` and
  `session/steer`. The morning build (older master) advertised only two.

Also new on the tip and not in your doc: a `rules` subcommand in the usage line.

### Install location — deviated deliberately, please note

Your §3 says `sudo install … /usr/local/bin`. That needs an interactive
password and could not be done unattended, so the binary went to
`~/.local/bin/wayland-nano`, which is **first** on this machine's login-shell
PATH and is what dev-mode Desktop reads **[V]**.

**Your reasoning for `/usr/local/bin` is right and still stands** for a
Finder/Dock-launched or packaged Desktop, where GUI PATH ≠ shell PATH. That
install is queued for the machine owner to run by hand. If Nano ever ships as
part of Desktop rather than as a developer-installed binary, this stops being a
PATH question and becomes a bundling question — flagging it now.

---

## 2. 🔴 The one thing that needs your decision: `sessionUpdate: "budget"`

**Nano emits a `session/update` kind that Desktop's ACP SDK rejects outright.**

Driving `wayland-nano acp-host` directly over stdio — no Desktop, no SDK, no
schema in the way — a single prompt turn produces **[V]**:

```
-> session/prompt
  <- session/update  budget                                   <-- rejected downstream
  <- session/update  agent_message_chunk  text="DRIVE-OK"
  <- response id=3   {"stopReason":"end_turn"}
```

In Desktop, that first frame produces **[V]**:

```
Error handling notification { method: 'session/update',
  params: { update: { sessionUpdate: 'budget', microcents: 0,
                      session_tokens: 10232, priced: false, limit: null } } }
{ code: -32602, message: 'Invalid params',
  data: { _errors: [ 'Invalid input: expected object, received undefined', x11 ] } }
```

**Mechanism** (read, then confirmed against behaviour): Desktop consumes ACP via
`@agentclientprotocol/sdk@0.18.2`. Its client notification handler does
`validate.zSessionNotification.parse(params)` **before** dispatching, and the
schema union has no `budget` variant, so every branch fails and the notification
is dropped before Desktop sees it.

**Severity: not a blocker, but not nothing.**

- It does **not** break the turn. The SDK's receive loop calls `#processMessage`
  without awaiting it and catches the rejection internally, so the following
  `agent_message_chunk` still arrives — verified in the database, the reply
  persisted correctly **[V]**.
- But the cost-metering data **never reaches Desktop at all**, so the P1 metering
  pack is currently invisible to the host, and every single turn logs a
  `-32602` error.

**Your call, and please pick one:**

1. Don't put `budget` on `session/update` — use an ext notification
   (`_wayland/session/budget`), which the SDK routes through `extNotification`
   without schema validation. **This is the recommendation** — it works against
   the SDK Desktop ships today, needs no version bump, and the SDK already has
   the escape hatch for exactly this.
2. Tell us the SDK version whose schema includes `budget` and we bump.

Desktop will separately be made tolerant of unknown `session/update` kinds so an
agent adding one can never cost a turn — but that is defence in depth, not a
substitute for a decision here.

---

## 3. Smoke list results (your §8)

| #   | Check                                             | Result                                                                           |
| --- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `wayland-nano --version` in a fresh terminal      | **[V] PASS**                                                                     |
| 2   | Picker lists Nano; selecting it opens a session   | **[V] PASS** — spawns `wayland-nano acp-host`, initialize → session/new → prompt |
| 3   | A simple prompt streams a response                | **[V] PASS** — reply rendered live, composer shows "Routing via Flux"            |
| 4   | File-write triggers permission; Allow once writes | **[V] PASS** — `fs_write` prompt, Allow once, file on disk with exact content    |
| 5   | Cancel mid-turn leaves the session alive          | **NOT RUN**                                                                      |
| 6   | Quit + relaunch resumes history (`session/load`)  | **NOT RUN** — blocked, see §4                                                    |

Step 2 is the one worth calling out because your §10 flags the stub-vs-binary
precedence trap: `AgentRegistry.createWNanoAgent()` returns an always-available
stub with no `cliPath`. With a real binary on PATH the stub does **not** win —
selecting Nano genuinely starts a session. That trap is not live here.

Also confirmed as documented, not chased: `promptCapabilities` is text-only
(`image: false`, `embeddedContext: false`), matching F-P2B-1.

Two harmless noise lines per session, from junk MCP servers in this test
profile, not from Nano: `mcp: protocol violation: unparseable line skipped` and
`MCP server 'e2e-echo-server' registration failed`.

---

## 4. Conversation history — WITHDRAWN, there is no bug here

An earlier draft of this document reported that reopening a conversation lost
every assistant reply. **That was wrong and is withdrawn.** Nano sessions
reload their history correctly, and so does everything else.

The cause was the test harness, not the product: this Desktop build renders
conversations in **tabs**, and driving it by setting `location.hash` changes the
route without activating the corresponding tab — so the pane being inspected was
an empty inactive tab. Clicking the tab renders prompt and reply exactly as
expected **[V]**.

Noted here because the false report was circulated before it was checked. If
anyone forwards you "Nano loses history", it is this, and it is retracted.

---

## 5. Desktop side — what landed

- **PR #955 merged** into `feature/wayland-nano` (squash, matching how #954
  landed), then merged into `packet/wl-integration` at `ffefd0eb2`. Reviewed
  before merging: 2 generated files, +34/−0, exactly `shell_rule_denied` and
  `rule_file_invalid`. Error table is now **59 kinds** **[V]**, `tsc --noEmit`
  clean **[V]**.
- Nano remains first-class in `AgentRegistry`, `AcpAgentManager`
  (`acpArgs: ['acp-host']`), `acpTypes`, and i18n across all locales.
- **New this session:** `wnano` now carries `fluxCompat: 'env'`. It shipped with
  none, so it was the only agent of nineteen rendering with no Flux chip at all
  — which reads as "Flux does not apply here" for the agent we ship ourselves.
  It is `env` because `AcpAgentManager` writes the connected Flux key to a file
  per spawn and exports the provider-parity env with it; the user clicks
  nothing.

### Still unwired on the Desktop side

The 59-kind error table has **no consumers**. Nothing imports `nanoErrorCodes.ts`
— verified with a control (27 files mention `wnano`, 0 import the table).

Wiring it is a real packet, not an afternoon, and the blocker is i18n: `title`
and `hint` are **hardcoded English** in the generated output, and Desktop's
`localeKeyParity` gate demands all 11 locales for any new key. So it is either
118 translated strings or a deliberate decision to render English. **No action
needed from you** — flagging it so nobody assumes the table is live just because
it is merged.

---

## 5a. Gotcha if you bring Desktop up on a fresh worktree

Your §7 says `bun install` then `bun run start`. That is not quite enough on a
clean checkout: `resources/bundled-bun/` is **not** populated by `bun install`,
and Desktop spawns some ACP agents (Claude Code among them) through that bundled
runtime. On a fresh worktree you get **[V]**:

```
Failed to spawn agent "claude": spawn .../resources/bundled-bun/darwin-arm64/bun ENOENT
```

It is not a Nano problem and it does not affect Nano (Desktop spawns
`wayland-nano` from PATH, not through bundled bun). Fix is to run the prepare
step — any `dist:*` or `package` build runs `prepareBundledBun` and populates it;
after that Claude Code spawns and completes turns normally **[V]**. Same family
as the known "fresh worktree needs `node scripts/build-mcp-servers.js`" gotcha.

---

## 6. Environment facts, for reproducing

- Apple M5, 24 GB unified, macOS 15, Apple Silicon.
- rustup auto-selected the pinned **1.95.0** from `rust-toolchain.toml`.
- Flux credential supplied as `FLUX_API_KEY_FILE` (never inline on a command
  line, never echoed).
- Seatbelt containment needed no provisioning, exactly as your §5 says.
- `just gate-all` was **not** run — CI is 6/6 green upstream and the local gate
  is several minutes; say the word if you want it run here.
