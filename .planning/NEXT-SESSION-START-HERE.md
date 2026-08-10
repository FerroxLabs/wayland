# START HERE — 2026-08-11 (after the overnight run)

Two branches, both pushed to ferrox. **Nothing merged, tagged, or PR'd.**
`constitutionFsAuthority.generated.ts` and `AGENTS.md` are modified in both
worktrees and MUST stay unstaged.

| Lane | Worktree | Branch | Head | Full suite |
|---|---|---|---|---|
| **Voice** | `wayland-worktrees/packet-attribution` | `packet/attribution-audit` | `76640d4e0` | **16,604 / 0 failed** |
| **Agents** | `wayland-worktrees/packet-agent-installers` | `packet/agent-installers` | `555747ab7` | **16,557 / 0 failed** |

Typecheck clean on both.

---

## 🔴 THREE THINGS THAT NEED SEAN, IN ORDER

### 1. H3 — I made the call for you, overturn it if you disagree
You were going to bed, so I did **not** make you grade two WAVs. I proceeded on
the M2 precedent (you graded one-shot / gapless / padded indistinguishable on a
five-sentence reply). Files are still in `scratchpad/`: `h3-oneshot.wav` (first
sound 7.26 s) vs `h3-chunked.wav` (first sound ~1.37 s, loses 2.32 s of
inter-sentence pause across 33 s).

**V20–V22 are NOT built yet**, so the call is still cheap to reverse. If the
chunked one does not sound like ONE speaker, ship the two-chunk fallback and
skip V21/V22 entirely.

### 2. A remote-reachability gap in the Flux connectors — pre-existing, needs a decision
The flux-connector **write** channels take the stored Flux key and put it, in
plaintext, into a CLI config file **on the host**. Nothing denied them to a
paired-device WebSocket caller — while the directly analogous
`onboarding.connect-flux` and `mcp.set-byo-oauth-credentials` **are** denied.

I denied only the two channels I added (`flux-connector:setup-kimi`,
`remove-kimi`) so the gap did not widen, and **left opencode and codex reachable**
because that is shipped behaviour and closing it could break a paired-device
flow. A test in `bridgeAllowlist.redteam.test.ts` pins the gap as it actually is
and will fail if someone closes it. **Your call.**

### 3. Two Windows holes found while designing the installer
- **No bundled bun exists for `win32-arm64`** — and we ship that target
  (`build-and-release.yml:30`). `getBundledBunDir()` returns null there.
- **Non-AVX2 Windows x64 also gets null**: `shellEnv.ts:220` asks for
  `win32-x64-baseline`, the asset IS pinned in `bundled-bun-shasums.json:10`,
  but `prepareBundledBun.js:189-196` never stages baseline for win32 and
  `verify-packaged-resources.js:713-716` enforces its absence.

Both pre-existing, neither touched. They constrain the installer design below.

---

## LANE 1 — Voice. `.planning/VOICE-COMPOSER-PLAN.md`. Do not re-plan it.

| Phase | Steps | State |
|---|---|---|
| P0 readiness | V1–V3 | done |
| P1 the lift | V4–V7 | done |
| P2 composer | V8–V18 | **DONE — V13, V14, V15, V16, V17, V18 landed overnight** |
| P3 chunking | V19 done · **H3 GATE**, V20, V21, V22 | **not started — gated on H3** |
| P4 hardening | V24, V25 | not started |

### What landed overnight
- **V12 tests** (`7edce2ce7`) — three mutation-proven guards. Streaming keeps
  both controls alive; a live session closes dictation but never the soundwave;
  `disabled` still closes both.
- **V15** (`f23e28cf1`) — the mic now renders when dictation is OFF and routes to
  settings. It was returning null, which is the shipped default, so most users
  saw two composer affordances instead of three and the missing one was the only
  on-ramp. It never auto-enables: the stored default is
  `{enabled:false, provider:'openai'}` while an UNSET provider transcribes
  on-device, so a helpful auto-enable would move someone off local Whisper onto
  a hosted service they never chose.
- **V13** (`7fd7d5cb8`) — distinct listening vs speaking rings (rose 1.4 s pulse
  vs indigo 2.6 s), CSS-owned animation, session-driven level meter,
  reduced-motion held at mid-glow.
- **V14** (`27a476638`) — 9 real i18n keys × 12 locales + a parity test.
- **V16/V17/V18** (`76640d4e0`) — staged attachments can no longer be swallowed
  by a spoken turn; 23 tests, 20 mutations all red.

### V20–V22 remain. Read this before starting them.
**V20 is a hard prerequisite for V22** and is NOT a free consequence of V19.
`completeResponse` guards on `['thinking','acting']`, but the first sentence
chunk moves the machine to `speaking` — so every later call returns immediately
and the tail is never spoken, captions stay empty, and the dedupe key is never
set. Split it into a turn-terminal handler valid from `thinking|acting|speaking`
first. **Write the test before the split and watch it fail.**

**V21 is the one that fails silently.** With Web Audio a suspended
`AudioContext` gives NO error: `start(when)` schedules against a clock that is
not advancing, nothing plays, `onended` never fires, the session never re-arms —
symptom-for-symptom the bug this whole plan exists to fix. Create and
`resume()` the context inside the entry-button CLICK handler and assert
`state === 'running'` before scheduling.

---

## LANE 2 — Agents. `.planning/AGENT-STRATEGY-2026-08-10.md` is the authority.

### ⚠️ T1 IS ALREADY BUILT — `245723d67`
My previous handoff listed it as the first unstarted job. **That was wrong.**
It is built, cross-audited (FIX-FIRST twice, then closed). Read the branch, not
the plan.

Two things in that commit worth knowing: the defect was WIDER than recorded —
`parseWindowsCliPath` shreds a *bare* spaced path too — and
`LegacyConnectorFactory` checked the npx bridge list before the launch guard, so
claude/codex/codebuddy silently discarded an installed binary and ran the npx
one instead.

### What landed overnight
- **kimi renamed to Kimi Code** (`5845226e5`). "Kimi CLI" is the legacy product;
  the binary ships a `migrate` subcommand to move data off it.
- **Live bug fixed** (`72a44a23f`): `skillsDirs` was `.kimi/skills`, so every
  builtin skill symlinked for a Kimi session landed where Kimi never looks. Its
  binary carries `PROJECT_BRAND_DIRS = [".kimi-code/skills"]`.
- **cli-setup skill repaired** (`06a10a540`). It shipped `uv tool install
  kimi-cli`, which installs **different, legacy software**, plus a fabricated
  `uv` prerequisite, a `~/.kimi/` credentials path that does not exist, and two
  verify commands (`kimi info`, `kimi logout`) that are not subcommands. Also
  led with the RETIRED `@zed-industries/claude-code-acp` when our constant is
  `@agentclientprotocol/claude-agent-acp`.
- **Kimi Flux connector built + wired** (`a0b711d89`, `555747ab7`). Kimi is
  `fluxCompat: 'setup'`, contradicting the earlier "vendor-locked" note.

### NEXT JOB: Mechanic A installer. The design is done — build it.
Verified **by execution**, not by reading:

```
<bunPath> install --cwd <prefix> --ignore-scripts --no-save <pkg>@<exact-version>
```
exit 0 in 1.95 s, creates `<prefix>/node_modules/...` and a `.bin` symlink.
Works with or without a pre-existing `package.json`. `--ignore-scripts` is what
keeps postinstall out of the flow.

**Do NOT point the launch spec at `node_modules/.bin`.** `@openai/codex` ships
NATIVE per-triple executables *inside* the package —
`vendor/aarch64-pc-windows-msvc/codex/codex.exe` is a real PE32+ binary. So:

```
AcpLaunchSpec = { command: '<prefix>/node_modules/@openai/codex/vendor/<triple>/codex/codex[.exe]', args: [...] }
```

A real executable: no `.cmd` shim, no bun needed at RUN time, and it works on
win32-arm64 where no bundled bun exists. That last point is why this shape is
required rather than merely nicer.

**Non-negotiables carried in:** installers emit an `AcpLaunchSpec`, never a
`cliPath` string (see below). Never curl|sh. Pinned version + verified checksum.
Explicit per-install consent. Uninstall by MANIFEST, never by name.

Full spec and the three adversarial verdicts:
`/private/tmp/.../tasks/wqzz5qqox.output`.

### Why a cliPath string is forbidden
The ACP generic spawn is hardcoded `shell: false` with **no `.cmd`/`.bat`
branch** (`acpConnectors.ts:302-310`). Node cannot execute a `.cmd` shim that
way, and npm global installs on Windows produce exactly those. Meanwhile
`parseWindowsCliPath` turns `C:\Program Files\...` into `command: 'C:\Program'`
— and a test **pins that broken output deliberately**, because T1 fixed the
problem by bypassing the parser, not repairing it.

---

## Method notes that earned their keep overnight

- **Never `git checkout` an uncommitted file to undo a mutation.** It discarded a
  whole V15 implementation. Save a copy first and restore from that.
- **`waitFor(() => expect(x).toBeNull())` can pass vacuously** by succeeding on
  its first synchronous check, before an async effect resolves. One existing
  test was asserting the not-yet-loaded state and would have passed whatever the
  code did.
- **A denylist entry that does not match is worse than none.** I wrote
  `'setup-kimi'` when the registered key is `'flux-connector:setup-kimi'` and
  matching is exact — decorative protection. The redteam test now reproduces
  that exact mistake as a mutation.
- **rtk piping fails silently**: `rtk proxy grep -rl … | rtk wc -l` returned 0
  with a broken-pipe error even for known positives. Use python to count.
- **Confirm a mutation actually applied** before believing the green. A subagent
  caught two harness defects doing this — an invalid reporter flag produced a
  startup error that *looked* like red.
