# START HERE — 2026-08-10 (late)

Branch `packet/attribution-audit`, head **`7edce2ce7`**, pushed to ferrox.
**Full suite 16,524 tests / 0 failed / 0 failed suites. Typecheck clean.**
Nothing merged, tagged, or PR'd. `constitutionFsAuthority.generated.ts` and
`AGENTS.md` are modified and MUST stay unstaged.

Two lanes now. They are in SEPARATE worktrees on purpose — parallel builds in
one tree produced stepped-on half-commits earlier this session.

| Lane | Worktree | Branch | State |
|---|---|---|---|
| **Voice** | `wayland-worktrees/packet-attribution` | `packet/attribution-audit` | 12 of 22 steps |
| **Agents** | `wayland-worktrees/packet-agent-installers` | `packet/agent-installers` | deps installed, no code yet |

---

## LANE 1 — Voice. Build `.planning/VOICE-COMPOSER-PLAN.md`. Do not re-plan it.

| Phase | Steps | State |
|---|---|---|
| P0 readiness | V1, V2, V3 | done |
| P1 the lift | V4, V5, V6, V7 | done |
| P2 composer | V8, V9, V10, V11, V12 | done · **V13–V18 remain** |
| P3 chunking | V19 done · **H3 GATE**, V20, V21, V22 | see below |
| P4 hardening | V24, V25 | not started |

### ⚠️ H3 is with Sean RIGHT NOW — get the answer before writing V22

Two files were sent for grading:
`scratchpad/h3-oneshot.wav` (one `say` call, first sound **7.26 s**) vs
`scratchpad/h3-chunked.wav` (6 sentences synthesised separately, joined
gaplessly, first sound **~1.37 s**). Chunking loses **2.32 s** of
inter-sentence pause across the whole 33 s answer.

**The only question: does the chunked one sound like ONE speaker?**
- **Passes** → build V20, V21, V22 as planned.
- **Fails** → ship the two-chunk fallback (V19 + V20 only), skip V21/V22, stop.

Prior evidence it will pass: M2, where Sean graded one-shot / gapless / padded
as indistinguishable on a five-sentence reply.

### V12 gap CLOSED (`7edce2ce7`)

Three tests, one per axis, each mutation-proven to kill exactly itself:
streaming keeps both controls alive, a live session closes dictation but not
the soundwave, and `disabled` still closes both. Suite **16,524 / 0 failed**.

### V13–V18 remain, carrying these decided points
- **V13** glow: listening and speaking must look DIFFERENT. Animate via a CSS
  keyframe on a class, never from the token render loop — SendBox re-renders on
  every token. Do NOT reuse `SpeechInputButton`'s waveform strip; `useSpeechInput`
  is per-instance so it stays idle for the whole session.
- **V14** distinct names/icons + i18n across 12 locales. Short `aria-label`s,
  full sentences only in `title`.
- **V15** the mic must be VISIBLE when STT is off (today it returns null, so most
  users see two buttons, not three) — route it to settings, never auto-enable.
- **V16** staged attachments must not be swallowed by a spoken turn: write the
  transcript to the draft instead of auto-sending. The one deliberate exception
  to "voice never writes `input`".
- **V17** behavioural separation proof. **V18** Escape (already on the session
  hook from V4; verify semantics).

---

## LANE 2 — Agents. `.planning/AGENT-STRATEGY-2026-08-10.md` is the authority.

Worktree ready: deps installed (`bun install --frozen-lockfile`, exit 0) and
MCP servers built. **No code written yet.**

**Positioning (Sean's, and it settles the cannibalisation question):** Wayland is
the layer ABOVE the agents, not a rival to them. OpenClaw is a thing you run;
Wayland runs things. Installing competitors makes the one-ring claim more true.

**Do NOT re-research.** Channels, package identity, postinstall status, OAuth
surfaces and the Grok script hash are all established by execution in the
strategy note.

**Order:**
0. **T1 alone** — structured launch command. `parseWindowsCliPath` keeps only the
   first quoted token, so `C:\Program Files\Wayland` breaks every spawn.
1. **Mechanic A, parallel** — Codex, Kimi Code, OpenClaw. All npm, all verified
   postinstall-free. One code path, three agents.
2. **Mechanic B** — Claude Code, then OpenCode, then Goose (tarball + checksum).
3. **Mechanic C** — Hermes via PyPI; reuse the existing `hermes-setup` assistant.
4. **Mechanic D** — Grok Build, sandboxed, script pinned, result hashed. LAST:
   it is `vendor`, so it earns Flux nothing.
5. **Auth surfacing** — per-agent login through the EXISTING `node-pty`. Write no
   new OAuth: `chatgptOAuth.ts` + `ChatGptButton` + `XGrokButton` already exist.

**Two one-line fixes to land whenever:** `acpTypes.ts:465` still says
`name: 'Kimi CLI'` (product is Kimi Code), and `kimi` has no `fluxCompat`.

**STILL SEAN'S CALL:** this order departs from the approved K-05 sequence (qwen,
gemini, auggie). He has since cut gemini and qwen, so the approved order ships an
installer for agents he does not want. Do not silently reorder — get the word.

---

## Verified this session

- **macOS** full suite green throughout (16,521 at head).
- **Windows** real hardware at head: 16,513 tests, 5 failed — all pre-existing
  platform artifacts (`pathConfinement` asserting POSIX paths, a missing CLI, a
  tray sync). **All 18 voice suites 0 failed.**
- **Linux** real KVM droplet (created + destroyed in-session, ~$0.07): **54/54 on
  the voice logic.** DOM suites not run there — transfer truncated, uplink too
  slow to repeat; they are jsdom and green on two other OSes.
- **Case-sensitive imports** — the failure mode macOS and Windows both hide — are
  caught by tsc 5.9.3, proven with a deliberate wrong-case probe.

## Known flake, identified, NOT ours

`tests/unit/webserver/constitutionRecoveryConsumerJourney.dom.test.tsx` fails
only under full-suite load; passes 5/5 alone. Real HTTP + mounted renderer. Zero
references to voice or ChatLayout.

## Method notes that keep earning

- **A test that cannot go red proves nothing.** Every guard this session was
  mutation-checked. Twice a mutation itself was wrong (a ternary chain cannot
  render two branches; a `perl` line-number edit silently missed) and proved
  nothing until rebuilt — check that the mutation actually applied.
- **RTK truncates piped output at 1 MB on one line**, so `grep -c` against it
  returns 1 regardless. Have vitest write JSON itself.
- Before believing a zero, prove the method finds a known positive. This caught
  a wrong claim about `AgentRegistry` this session — the ACP backends live in
  `acpTypes.ts`, not there.
- **Never pin a package by plausible name.** npm `kimi-cli` is an unrelated
  front-end tool; npm `kimi-code` and `grok-cli` are third-party proxy wrappers
  by the same publisher; npm `hermes-agent` is an unofficial bridge.
