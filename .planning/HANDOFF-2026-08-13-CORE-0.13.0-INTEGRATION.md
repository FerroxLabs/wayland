# Handoff — integrate and test Wayland Core 0.13.0

**Start here.** `packet/wl-integration` @ `4435ad24e`, pushed to `ferrox`. Working tree clean
(only `constitutionFsAuthority.generated.ts` modified — it must NEVER be staged).
Suite **17,509 passed / 0 failed**.

Goal: get 0.13.0 **integrated, tested and working**. This document is the playbook.

**[X]** = proven by executing. Everything else says what it is.

---

## 0. Paths

| what                                                               | where                                                                                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop worktree (branch `packet/wl-integration`, remote `ferrox`) | `/Users/seandonahoe/dev/wayland-worktrees/wl-integration`                                                                                                                            |
| ⛔ canonical tree — never write here                               | `/Users/seandonahoe/dev/wayland/app`                                                                                                                                                 |
| Core repo                                                          | `/Users/seandonahoe/dev/waylandcore`                                                                                                                                                 |
| **0.13.0 binary (arm64), verified**                                | `/Users/seandonahoe/Downloads/wcore-0130/wayland-core-aarch64-apple-darwin/wayland-core`                                                                                             |
| Core's handoff to us                                               | `/private/tmp/claude-501/-Users-seandonahoe-dev-waylandcore/11929102-d58a-47e9-9644-0e9d530b58c4/scratchpad/HANDOFF-CORE-TO-DESKTOP-0.13.0.md` (durable copy: `hetzner-dsm:/root/…`) |
| Our reply to Core                                                  | `.planning/HANDOFF-TO-CORE-2026-08-12-0.13.0-CONTRACT.md`                                                                                                                            |
| Smart Trader context                                               | `.planning/HANDOFF-2026-08-12-SMART-TRADER-LIVE.md`                                                                                                                                  |

---

## 1. ⚠️ THE TRAP THAT COST THIS ROUND — read before touching anything

**Identify every engine binary by sha256. NEVER by `--version`.**

The binary bundled in Desktop reports `wayland-core 0.12.26` and is **not** the published
release. Its sha is `6d0ca72a1ca5afa7d33a337a73a6a389a1075d583a97e14096aaebc583b08a08` — the
C-1..C-5 integration dev build. `desktopContractV1.ts:21-24` says so in as many words. I read
`--version`, believed it, and told Core that "published 0.12.26" emits values that actually came
from a dev build. Corrected in §6a of our reply.

Consequence for the next session: **we still do not know what the published v0.12.26 emits.**
A pre-existing note claims minor 12 / gen-13 / schema `23fb3048…`; I "refuted" it against the
wrong binary, so treat it as probably right until the release asset says otherwise.

---

## 2. What is verified about 0.13.0

Binary identity confirmed by sha before running it [X]:

```
wayland-core 0.13.0 · Mach-O 64-bit arm64
sha256 c55205d4b36cd5fd843c767c897e8edb30a4dd193e74da0a8fdad0dcdb24b229
```

Contract read off a real `ready` frame [X]:

| field                  | value                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| `name`                 | `wayland-desktop-core`                                                    |
| `major`                | 1                                                                         |
| `minor`                | **14**                                                                    |
| `generator`            | `wcore-desktop-contract-gen/14` — **does NOT move**                       |
| `fixture_digest`       | `sha256:d729f9336e7ba0b4ed5a4f50ffdf3e3903ff7f38d000f43275fc654e87e2ec3d` |
| `schema_digest`        | `sha256:306d83e19fa01a83c1d17d6365c9159efeb94373b8328259cbf842d783e00152` |
| `source_inputs_digest` | `sha256:55d366c8706ea852b55595049e5dcb9b1d641745a2209e938121e95644c2e6d6` |
| `capabilities`         | 17 keys, **identical to the current pin** [X]                             |

### How to re-read it yourself (do this, don't transcribe)

```bash
SC=$(mktemp -d)
API_KEY="not-a-real-key-init-probe" WAYLAND_HOME="$SC" timeout 30 \
  /Users/seandonahoe/Downloads/wcore-0130/wayland-core-aarch64-apple-darwin/wayland-core \
  --json-stream --assistant '__wayland_desktop_session' \
  > "$SC/out.jsonl" 2>"$SC/err.txt" < /dev/null
python3 -c "
import json
for l in open('$SC/out.jsonl'):
    o=json.loads(l)
    if o.get('type')=='ready': print(json.dumps(o['contract'],indent=2,sort_keys=True)); break
"
```

The fake key is required — without one the engine exits 1 at `init_failed` and never reaches
`ready`. It makes no provider call. **Never use a real key, and never on a command line.**
Never point `WAYLAND_HOME` at Sean's real config: his `backend = "plaintext"` makes the engine
refuse to start.

---

## 3. BLOCKED ON CORE — two artifacts, then integration is mechanical

The pin is **not** the whole integration. Desktop compiles the contract corpus into the app and
schema-validates every inbound frame against it (`desktopContractV1.ts:10-12`):

```
contracts/wayland-desktop-core/v1/manifest.json            <- currently "minor": 13
contracts/wayland-desktop-core/v1/schema/core-event.schema.json
contracts/wayland-desktop-core/v1/schema/host-command.schema.json
```

A pin at minor 14 over a corpus at minor 13 is incoherent, and 0.13.0's new or widened event
fields would fail schema validation even with matching digests.

**Ask 1 — the regenerated 0.13.0 corpus**: `manifest.json` + both schema files. Desktop cannot
generate them.
**Ask 2 — what the PUBLISHED v0.12.26 emits**, read from the release asset, to settle whether
the move is 13→14 or 12→14 for the engine users actually have (§1).

---

## 4. The integration, once those land

1. Drop the three corpus files into `contracts/wayland-desktop-core/v1/`.
2. Set the four moving values in `DESKTOP_CORE_V1_PIN` (`desktopContractV1.ts:37`) — `minor`,
   `fixtureDigest`, `schemaDigest`, `sourceInputsDigest`. `generator`, `name`, `major` and
   `capabilities` do not move. Update the block comment: the current one describes the dev-build
   pin and will be stale.
3. **Do NOT ship the pin ahead of the engine.** `assertDescriptor` compares for equality against
   exactly one pin — no range, no dual acceptance — so a pin ahead of the bundled engine kills
   every session on frame 1. The other half of the edit is `DEFAULT_WCORE_VERSION` in
   `scripts/prepareWaylandCore.js:227`. For local testing use the override route instead (step 4).
4. Test via the override, which beats the bundled binary unconditionally:
   ```
   ~/Library/Application Support/Wayland-SmartTrader/wayland-core-overrides/darwin-arm64/wayland-core
   ```
   ⚠️ The resolver takes the override on a bare `existsSync` with **no version check**, so it
   wins forever. **Positive control, do not skip:** prove Desktop is running the new engine by
   version AND sha before believing any result. (`Dev-ISO` has been silently pinned to 0.12.16
   this way for weeks — every other profile's override is already renamed `.DISABLED-stale…`.)
5. Launch and run a real turn:
   ```bash
   WAYLAND_DEV_PROFILE=Wayland-SmartTrader WAYLAND_CDP_PORT=9230 npx electron-vite dev
   ```
6. `npx tsc --noEmit` then the full suite: `node ./node_modules/vitest/vitest.mjs run --root <worktree>`.

### What to test once it runs

- A turn completes at all (contract accepted, no `contract_*_mismatch`).
- **Does the tool double-fire survive into 0.13.0?** See §5 — this is the real prize.
- `/doctor` — `engine.contractPin` should agree; it reads the digest off the binary.

---

## 5. Still the blocker on Smart Trader — Core double-fires a tool

**Reproduced twice on the bundled engine** [X]:

```
Tool call: ToolSearch   14:51:48.378
Tool call: ToolSearch   14:51:48.382   <- same tool, 4ms apart
approval_required       14:51:48.430
tool_sequence: tool event tool_running has no matching request
wcore process exited unexpectedly (code=0) during active turn
```

Core-side: Desktop validates raw stdout in `consumeChunk` before any approval logic, so it is not
dropping the frame. Blocks Smart Trader's whole setup path. **Testing whether 0.13.0 fixes this
is the main reason to integrate.**

---

## 6. Other open work (unchanged)

1. **Re-run the Smart Trader instant win in-app.** The skills-sandbox fix (`4f55c1a14`) landed
   after the last attempt; the report may now complete. This is the Master Class demo.
2. **Merge `feat/nav-streamline`** (`0707e1231`, #118 — hideable logo, nav registry, Mission
   Control first). The "old sidebar" Sean keeps recognising. **6 conflict hunks / 5 files /
   ~575 lines**: `Layout.tsx`, `Sider/index.tsx`, `SettingsSider.tsx`, `NavigationSettings`,
   `i18n-keys.d.ts`. Also `feat/frictionless-issue-filing` (#464), 1 commit.
3. `enable_routine` / `install_agent` proposal handlers are still inert contracts.
4. flux-auto began returning `max_tokens must be <= 4096` and blocked turns. Unresolved.

---

## 7. Environment traps

- The dev app **dies with the shell that launched it**; `run_in_background` holds it only while
  that task lives. `--remote-debugging-port` is **ignored** — use `WAYLAND_CDP_PORT`.
- **Never override the CDP viewport.** I forced 1500px on a 1209px window, clipped the UI, and
  reported my own artefact as a layout bug.
- `rtk` breaks `wc -l`, `diff` and `git log`. Use `/usr/bin/…` and `shasum`.
- `better-sqlite3` is built for Electron's ABI — use `/usr/bin/sqlite3` on profile DBs.
- `WAYLAND_DEV_PROFILE=<name>` gives an isolated profile **without** `WAYLAND_MULTI_INSTANCE`.

---

## 8. Claims withdrawn — do not re-assert

- "Published 0.12.26 emits minor 13 / gen-14 / `4971f456…`" — that was the **dev build**.
- "The `23fb3048…` note is stale" — refuted against the wrong binary; probably correct.
- "All lanes are merged" — wrong twice; `feat/nav-streamline` was never merged.
- "0.12.27 RC exists" — it does not. Newest published Core is **v0.12.26**.
