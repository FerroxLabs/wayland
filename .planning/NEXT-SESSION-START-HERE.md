# START HERE — 2026-08-11

| Lane | Worktree | Branch | Head | State |
|---|---|---|---|---|
| **Voice** | `wayland-worktrees/packet-attribution` | `packet/attribution-audit` | `ec27cb75e` | **16,662 / 0 failed.** Code-complete through Phase 3. |
| **Agents** | `wayland-worktrees/packet-agent-installers` | `packet/agent-installers` | `8543f7f30` | Service proven. **A workflow is mid-flight writing the seam + UI — its output is UNCOMMITTED in the worktree.** |

Nothing merged, tagged, or PR'd. `AGENTS.md` and
`constitutionFsAuthority.generated.ts` are permanently dirty — keep them unstaged.

---

## ⚠️ FIRST THING: there is uncommitted work in the agent worktree

A workflow (`wf_09ea99cb-2f6`) was running when this session ended. It builds the
process seam (T-A) then the Agents-page UI (T-B) from
`.planning/AGENT-INSTALL-UI-PLAN.md`, then runs three read-only reviewers
(security / clean-machine / contract).

**Its results are NOT in the next session's context.** Do this before anything
else:

1. `git status` in `wayland-worktrees/packet-agent-installers` — if
   `src/common/types/acpTypes.ts`, `ipcBridge.ts`, `bridgeAllowlist.ts` and
   `LocalAgents.tsx` are modified, the build ran.
2. Read the run's journal for the reviewer verdicts:
   `~/.claude/projects/-Users-seandonahoe-dev-wayland/775e9698-5b3c-4417-8b28-a518f6f49b0a/subagents/workflows/wf_09ea99cb-2f6/journal.jsonl`
3. **Do not commit it unreviewed.** It touched `AcpLaunchSpec`, which is a shared
   ACP contract (see below). Verify, then commit.

---

## 🔴 OPEN, NEEDS SEAN

1. **The second H3 listen. Blocking for V22.** jsdom has no `AudioContext`, so
   V22's whole suite grades scheduling arithmetic against a fake the implementer
   wrote — green there proves the maths, not the sound. Needs the packaged app,
   real speakers, one long multi-sentence answer. The FIRST H3 (design question:
   "does chunked sound like one speaker") **passed** — Sean could not reliably
   pick between one-shot and chunked, mildly preferred one-shot. That was the
   pause loss (2.32 s over five joins), not the voice; V22 schedules on a cursor
   so restoring pause is a one-constant change.
2. **`setup-opencode` / `setup-codex` are remote-reachable** and write the Flux
   key in plaintext to a host config. The analogous `onboarding.connect-flux` IS
   denied. I denied only the kimi equivalents I added; the existing two are
   shipped behaviour and closing them could break a paired-device flow. A test
   pins the gap as it is and fails if someone closes it. **Deny them or not?**
3. **226 commits sit unmerged on one branch** — voice, panels, K-03, agents, all
   stacked. This is why the left-bar redesign "disappeared": it is on the packet
   branch, `main` is at `b3694a18f`, and Sean was running main. Nothing is lost.
   Decide how it comes home: one PR, or split by packet.
4. **Real brand marks** for the agent cards (the mock uses placeholder glyphs),
   and whether "Available to install" sits below More detected (as drawn) or
   above — below means a clean machine opens to a near-empty page with
   everything useful under the fold.

---

## LANE 1 — Voice

Phases 0–3 done: V1–V22. **V22 (`ec27cb75e`) does not merge on its unit suite** —
see H3 above.

**Remaining:** V23 (receipt semantics before hosted chunking), V24 (named
failures + circuit breaker), V25 (wall-clock caps from real-mic numbers).

**Live-verified as a user:** only V15 — the "Set up dictation" button renders
where it used to return null, and routes to `#/settings/voice`. Confirmed by
driving a running app.
**NOT live-verified:** V13's rings, V16's attachment deferral, V17/V18. They
need a real microphone and a real streaming reply; CDP cannot honestly produce
either. That is ~2 minutes at the keyboard: open a chat, hit the soundwave,
watch the ring go rose while listening and indigo while speaking; then stage a
file, speak, and confirm the transcript lands in the draft instead of sending.

**Two subtleties worth not rediscovering:**
- V20's dedupe is now keyed on the TURN, not turn+message. The two terminal
  paths disagree on message id — `finish` names the assistant message,
  `turnCompleted` reports `lastMessage.id`, routinely an activity card.
- V20's split is behaviour-preserving at HEAD by design. Nothing reachable
  changes until V22 emits segments, so the hook suite only guards the split; the
  pure spec in `src/common/voice/voiceTurnTerminal.ts` is what proves it.

---

## LANE 2 — Agents

**Proven by real installs against the real registry** (not mocks): codex, kimi
and openclaw each install with `--ignore-scripts` into a per-agent prefix,
resolve a launch spec pointing at a real file, **spawn with `shell:false`**, and
uninstall by manifest leaving siblings untouched. None route through
`node_modules/.bin`. Codex is a native binary; kimi and openclaw resolve a JS
runtime.

**The plan is `.planning/AGENT-INSTALL-UI-PLAN.md`** (in the agent worktree) and
records seven settled decisions — do not relitigate them.

**The one live design decision, and it is a shared-contract call:**
`resolveJsRuntime()` returns `{command, env, kind}`; unpackaged that is the
Electron binary plus `ELECTRON_RUN_AS_NODE=1`. `AcpLaunchSpec` is
`{command, args}` with nowhere to put it, so a **dev-mode** kimi/openclaw spec
would launch an Electron WINDOW instead of Node. Packaged is unaffected. Codex
is unaffected either way. If the workflow extended the type, verify
`isAcpLaunchSpec` still accepts every previously-valid shape — specs are
rehydrated from persisted conversation `extra`, which is untyped JSON.

**Approved UI mock:** `~/Desktop/wayland-agents-mock.html` (also published as an
artifact). Three bands; an `absent` card is the same card with a dashed border,
dimmed mark and an Install button; the Flux chip shows BEFORE install.

**Next after the workflow lands:** per-agent sign-in (the agent's own
`claude login` etc. in Wayland's terminal — never reimplement subscription
OAuth), then Mechanic B/C/D, then the ACP handshake over stdio (`--version`
proves the binary runs, not that ACP negotiates).

---

## Method notes that keep paying

- **NEVER `git checkout` an uncommitted file** to undo a mutation — it destroyed
  a whole V15 implementation. Save a copy, restore from that.
- **`waitFor(() => expect(x).toBeNull())` can pass vacuously**, succeeding on its
  first synchronous check before an async effect resolves.
- **A denylist entry that does not match is worse than none.** `'setup-kimi'` vs
  the real `'flux-connector:setup-kimi'` — matching is exact, so the first was
  decorative protection.
- **`bun install --cwd <dir>` does not stay in `<dir>`** — it walks up and will
  install into an ancestor's `node_modules`, leaving the target empty.
- **rtk piping fails silently**: `rtk proxy grep -rl … | rtk wc -l` returns 0
  with a broken-pipe error even for known positives. Count with python.
- Two "verified facts" handed to a subagent turned out wrong (codex's vendor
  path, "all three postinstall-free"). Both were caught by RUNNING the install.
  Brief agents with facts, but let them contradict you.
