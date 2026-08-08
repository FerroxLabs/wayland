# Milestone WLD-K — Core First

**Created 2026-08-08. Deadline pressure: Master Class in ~3 weeks.**

**North star for this milestone:** the Master Class demonstrates *Wayland
architecture* — Wayland Desktop driving Wayland Core. Claude Code as the backend is
a fallback we can live with, not the story we are telling. Everything here exists to
make Wayland Core the path a non-technical user actually succeeds on.

---

## Where we actually are (verified, 2026-08-08)

| fact | status |
|---|---|
| TVControl 2.2.2 | published; installs from the Library; 101 tools; **exonerated** |
| W-0 (ToolSearch cannot see MCP tools) | **FIXED** in Core rc.2, verified standalone end to end |
| Desktop + Wayland Core on 0.12.25 | works: engine boots, MCP connects, ToolSearch runs, tools callable |
| Desktop + Wayland Core on 0.12.26-rc.2 | **BROKEN** — every turn dies at bootstrap |
| Root cause | Core 0.12.26 strips authority-expanding *project* config from an untrusted workspace; Desktop writes its launch profile there |
| `--trust-workspace` workaround | **rejected** — clears the profile error, then fails on symlinked skills; reverted in `3ebacf41c` |
| **The real fix** | write the launch profile into the **global** config instead. Verified: symlinks present, no trust flag, `Connected: 101 tools` + completed turn |
| v0.12.26 **stable** | **not published.** GitHub newest = `v0.12.26-rc.2` (pre-release); npm `latest` = 0.12.25 |
| Unpushed | **97 commits**, single machine, no remote |

---

## K-0 — Push the branch (do this first, it is not optional)

97 commits of TVControl work, MCP publication fixes, four audit documents and three
Core handoffs exist on one Mac and nowhere else. That machine has been up 38+ days
with `fseventsd` at 8.6 GB.

**Acceptance:** branch exists on `ferrox`. Nothing merged, nothing tagged.
**Size:** minutes. **Blocked on:** Sean's approval only.

---

## K-1 — Move the launch profile out of the project config *(the milestone's spine)*

**Problem.** `WCoreAgent` writes `.wayland-core.toml` into the per-chat workspace
containing `[profiles.__wayland_desktop_session]`, then passes `--profile`. Core
0.12.26 discards authority-expanding project config from an untrusted workspace, so
the profile vanishes and the engine bails with a message that blames a missing
profile (`envBuilder.ts:407-425`, `index.ts:497-507`).

**Fix.** Write that profile into the config root the engine is already pointed at
(`resolveActiveConfigDir()` → `WAYLAND_HOME`), not the project file.

**Verified before planning:** global-config profile + symlinked skills + **no**
trust flag → `[mcp] Connected to 'tvcontrol': 101 tools`, turn completes.

**This is not a workaround.** It is where launch-local, app-owned configuration
belongs. The project file is for *project* config; Desktop's per-conversation MCP
narrowing is neither project-scoped nor user-authored.

**Design constraints:**
- **Transactional.** For the `default` profile, `resolveActiveConfigDir()` resolves
  to the user's real `~/Library/Application Support/wayland-core`. A launch-local
  block must be journalled and restored exactly as `ProjectConfigTransaction` does
  today for the project file — including recovery after process death.
- **Concurrency.** Two chats can launch at once. There is already
  `withWCoreProjectConfigLease`; the global file needs equivalent serialisation, and
  it is a hotter file than the per-chat one.
- **Never clobber user config.** Merge into `[profiles.*]` only. Reuse
  `sanitizeProjectConfig`'s posture: app-owned keys win, everything else is preserved
  byte-for-byte.
- Keep the project-config write for anything that is genuinely project-scoped; only
  the profile block moves.

**Acceptance:** fresh profile, Wayland Core selected, one prompt, MCP tool executes,
on **both** 0.12.25 and 0.12.26-rc.2. Plus a killed-mid-launch run that leaves the
user's global config byte-identical to its pre-launch state.

**Size:** M. **Risk:** medium — it writes to a file the user also owns.
**Audit:** required, 4-leg. This is the packet that must not be wrong.

---

## K-2 — Surface stripped-config and bootstrap failures honestly

Two separate diagnostic failures cost hours this week and will cost users more:

1. **Core says "Profile not found"** for a profile that is present in a file it
   parsed and then discarded. Raised with Core (`HANDOFF-TO-CORE-2026-08-08`).
2. **Desktop shows "Agent failed to start: wcore Desktop contract rejected ready"** —
   which tells the user nothing actionable. The engine's real stderr reason is
   already captured (`WCORE_STDERR_TAIL_MAX`); it is not reaching the user.

**Acceptance:** an engine that refuses to start surfaces the engine's own reason in
the UI, secret-scrubbed (`SECRET_PATTERNS` already exists), not a contract-layer
abstraction.

**Size:** S. **Risk:** low.

---

## K-3 — The turn that never finishes

**Confirmed and reproduced.** Core emits `stream_end / finish_reason: 'stop'` at 40s;
the UI still shows "running / 368s" six minutes later, with no further engine
activity in the log. Previously deferred as "may be Desktop-side, untriaged" — it is
Desktop-side, and it is on the shipped engine, so it affects users today.

**Acceptance:** a turn that Core ends is shown as ended, including the
no-tools-found and error paths. Regression test drives a `stream_end` with no
assistant text and asserts the UI leaves the running state.

**Size:** S/M. **Risk:** low. **Priority:** high — it makes a working product look broken.

---

## K-4 — Engine RC integration path

`stage-wcore-bump.mjs` and `prepareWaylandCore.js` both refuse pre-release tags
(fixed behind an opt-in, `958099009`), and `build-with-builder.js:766` deliberately
ignores `WCORE_VERSION` with `requireVerified: true`, so a *packaged* build can never
carry an RC. That last part is correct and stays.

**Remaining gap:** we cannot produce a signed, packaged build against an RC, so RC
validation is dev-mode only. Decide whether that is acceptable (it probably is) and
write it down, or give release candidates an attestation policy so they can be
bundled for internal verification builds.

**Acceptance:** documented decision. **Size:** S.

---

## K-5 — Agent Installer *(the new capability)*

**Verified starting point:** `AgentRegistry` already detects **18** agents on a real
machine — Wayland Core, Gemini CLI, Claude Code, Codex, Grok Build, Qwen Code, Goose,
Augment Code, Kimi CLI, OpenCode, Factory Droid, GitHub Copilot, Qoder CLI, Mistral
Vibe, Cursor Agent, Kiro, Hermes Agent, OpenClaw Gateway. There is a
`Settings → Agents` surface and a `resources/managed-cli-shims/` pattern (currently
one entry, officecli).

**So detection is done. Installation is the gap.**

Target set (Sean's list): Claude Code, Codex, Grok Build, Kimi Code, OpenCode, Hermes
Agent, OpenClaw.

**Design constraints — these are what make it shippable rather than dangerous:**
- **Never `curl | sh`.** Install through the package manager the tool actually
  publishes to, with a **pinned version and a verified checksum**, same posture as the
  bundled engine. If a tool only offers a shell installer, it does not ship in v1.
- **Explicit consent per install.** No silent background installation.
- **Windows first-class**, not an afterthought: PATH, `.cmd` shims, and the
  `shell:false` spawn trap we already hit with `npx` (`mcpStdioSpawn.ts:9-26`).
- **Start with the npm-installable subset.** It is nearly uniform and covers most of
  the list. Non-npm channels are a second packet, not a stretch goal inside this one.
- **Uninstall must exist** and must remove exactly what we installed — by manifest,
  not by name (this bit us before, see the GSD removal).

**Acceptance:** on a clean VM per OS, install an agent from the panel, it appears as
detected, and a chat runs on it. Uninstall returns the machine to its prior state.

**Size:** L. **Split:** K-5a npm subset + panel UI; K-5b non-npm channels.

---

## K-6 — Flux fan-out *(the actual advantage)*

**This is the moat, not the installer.** Installing an agent is convenience.
Installing an agent that can immediately drive Kimi K3, GPT-5, Gemini and everything
else on the one Flux key the user already connected is something only a company that
owns both the router and the desktop can offer.

**What it means concretely:** after install, Wayland writes that agent's own config
so its provider base URL points at Flux and its model list is the Flux pinned
catalog. The user picks a model in Claude Code's own UI and it routes through Flux.

**Verified today:** Flux exposes a pinned catalog — a real key enumerates
`flux-fast`, `flux-standard`, `flux-reasoning`, `flux-auto`, plus
`flux-pinned-claude-opus`, `flux-pinned-claude-sonnet`, `flux-pinned-gpt-5`,
`flux-pinned-gpt-5-5`, `flux-pinned-deepseek-v4` and more. Desktop already writes
per-agent config files for MCP (`ClaudeMcpAgent`, `CodexMcpAgent`, `GeminiMcpAgent`),
so the write-into-someone-else's-config pattern exists and is tested.

**Hard constraints:**
- **API key + base URL only. Never Claude subscription OAuth** — standing hard NO on
  ToS grounds. This feature must not touch subscription auth on any agent.
- **Never write a key into a file we do not own without saying so.** The user must
  see which config files we modified and be able to undo it.
- Agents whose config we rewrite must keep working if the user later removes Flux —
  restore, do not strand.
- Per-agent capability differences are real (tool-calling support, streaming, context
  windows). A model appearing in the list must actually work in that agent, or be
  filtered out. **A pinned model that 500s in Claude Code is worse than not offering it.**

**Acceptance:** fresh machine, connect Flux, install Claude Code from the panel, open
Claude Code, select a non-Anthropic pinned model, get a correct answer. Repeat per
supported agent, on all three OSes.

**Size:** L. **Depends on:** K-5.

---

## Recommended order

```
K-0  push                     (minutes, unblocks everything, do it now)
K-1  profile location         (the spine — Core works again on 0.12.26)
K-3  turn-never-finishes      (high user-visible value, small)
K-2  honest failure surfacing (small, prevents the next lost afternoon)
      ── Master Class is safe at this line ──
K-5a agent installer, npm subset
K-6  Flux fan-out
K-5b non-npm install channels
K-4  RC integration decision  (any time)
```

**K-1 + K-3 is the Master Class critical path.** Everything after that is the product
story getting stronger, not the demo getting saved.

---

## Open questions for Sean

1. **v0.12.26 stable is not published.** Do we target stable, or ship the Master Class
   on 0.12.25 + K-1 (which works on both)? **My recommendation: build K-1 so it works
   on both, then the answer stops mattering.**
2. **K-5 target set** — all seven, or the npm subset for v1? **Recommendation: npm
   subset, shipped and solid, beats seven half-working.**
3. **Does Core want to fix the misleading error** before stable, or do we absorb it
   in K-2 only?

## Method notes carried into this milestone

- Verify a mechanism by **executing** it, never by reading code. Both wrong turns this
  week (W-1's root cause, W-3's npx assumption) came from asserting behaviour that was
  never run.
- A packet's "verified facts" section may only contain things actually executed.
- Full suite (`npx vitest run`) before any pass claim. Current baseline: **16,231
  tests, 0 failures**.
- Never commit `constitutionFsAuthority.generated.ts`.
- No merge, tag or release without Sean. `build-and-release.yml` fires on **any** tag.
