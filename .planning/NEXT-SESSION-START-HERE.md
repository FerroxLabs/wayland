# START HERE — 2026-08-10

Branch `packet/attribution-audit`, head **`590897e55`**, pushed to ferrox.
**Full suite 16,450 tests / 0 failed / 0 failed suites. Typecheck clean.**
Nothing merged, tagged, or PR'd. `constitutionFsAuthority.generated.ts` and
`AGENTS.md` are modified and MUST stay unstaged.

---

## THE NEXT JOB: build voice-in-the-composer from the plan

**`.planning/VOICE-COMPOSER-PLAN.md`** — 645 lines + 2 addenda. Sean has approved
building it. Do NOT re-plan it. Read it, then run it as a workflow.

It is already: researched (4 lanes) → drafted → **cross-audited by 4 adversarial
lenses (all returned FIX-FIRST, all findings applied or explicitly rejected)** →
**corrected by real hardware with Sean listening**.

The plan ends with a RUN SHEET naming which steps must be SERIALIZED. Honour it.
Parallel builds in one worktree produce half-commits stepping on each other —
that has already happened once this session.

### The three blockers the audit caught BEFORE any code was written
1. `completeResponse` (VoiceConversationMode.tsx:471) admits only
   `thinking|acting`, but the first sentence chunk moves the machine to
   `speaking` — the draft named it owner of the trailing fragment and it would
   have been dead code.
2. An epoch counter stops ISSUING synthesis but does nothing about
   `AudioBufferSourceNode`s already scheduled — barge-in would not have stopped
   the voice. Needs a real `stopAll()` across all 8 `clearAudio` sites.
3. No `autoplay-policy` switch exists in main, so `AudioContext` needs an
   explicit asserted `resume()` or it silently never plays.

### Measured on real hardware (addendum M1–M7) — these are FACTS, not guesses
- **Streaming is justified**: 5056 ms → 953 ms to first audio.
- **Gapless is fine — do NOT build the 437 ms padding.** Chunking loses 1.75 s of
  pause and Sean graded padded/gapless/one-shot as indistinguishable.
- **"Pronouncing the grammar" is INTONATION, not timing.** `say` performs a
  grammatical contour at a comma. Fix = strip the comma, reinsert ~150 ms of
  explicit silence. Deleting commas outright sounds rushed (Sean's ear, not mine
  — my numeric read said the opposite and was wrong).
- **Prosody normalization is PER-PROVIDER.** `[[slnc N]]` is macOS-only; a hosted
  provider would read "bracket bracket s l n c" aloud. Blocking on V19.
- **The normalizer has an inverse bug**: strips bullet markers then joins lines,
  so list items collide. Commas down, list boundaries up.
- **Provider ladder** with a guaranteed LOCAL bottom rung and ANNOUNCED fallback.
- **M7: calibrate the endpointer from `MicrophoneCheck.tsx`** rather than shipping
  universal constants. ⚠️ TRAP: the mic check grades **peak** and the endpointer
  thresholds on **RMS**, both 0-1, both literally 0.02. They are NOT comparable —
  never "reconcile" them.

---

## What landed this session (all pushed)

| Commit | What |
|---|---|
| `1e09826ed` | P1 — a lone activity step renders once |
| `4d5f6b65d` | Workbench stacked vertically; Observability section removed |
| `87631b617` | Deleted the orphaned Observability UI chain |
| `6d1fedd3a` | **K-03 — a finished wcore turn actually finishes** |
| `ff73b9ec0` | Design parity with the Claude panel |
| `d0162e582` | Stop the Progress panel saying "Progress" twice |
| `83fc342ee` | An errored turn settles `failed`, not `completed` |
| `9f009f81d` | Catch the failure that emits NO error frame |
| `af3c17e1b` | Continuous voice: effects wired, TTS fixed, endpointing |
| `62ddf28b6` `0e6b701ae` `590897e55` | The voice plan + both addenda |

**Live-verified this session:** K-03 confirmed working in the real app (green
`completed`, spine bar stood down); the stacked panel confirmed by computed style
(cards `rgb(42,42,42)` on panel `rgb(34,34,34)`); Workspace reachable; three
sections open at once.

---

## Open decisions for Sean

1. `MessageActivity` is orphaned in src (13 live tests, its CSS module is
   imported by `ActivityNodeTree`, so deleting cascades).
2. Six orphaned locale keys under `conversation.observability.*` / `.subAgent.*`.
3. Old `wayland.workbench.*.v1` localStorage entries are not migrated.
4. Whether conversation mode should use a HOSTED voice by default. `say` is
   robotic; OpenAI TTS is better but ships the assistant's words off-machine.
   That is a product call sitting on the consent boundary.

## Known-open, deliberately not fixed

- **No `AudioContext` → the mic never closes.** Left open: auto-cancelling a
  capture we cannot measure would reintroduce the silent data loss just fixed.
- Short answers (<400 ms starting after calibration) are still discarded.
- **`localWhisper.ts` has NO test file** — and it is the guaranteed local floor
  the whole provider ladder leans on.
- **Desktop drops `provider_attempt` / `provider_failure` / `provider_retry`**
  with `unknown event type`. Core tells us exactly what went wrong and we bin it.
  This is why a failure reads as "Voice needs attention" instead of "the model
  returned invalid tool arguments, retrying 1 of 2." Small fix, big honesty win.
- **The Engine lane shows on every wcore turn** saying "valid / completed" —
  jargon plus a duplicate of the Progress badge. Should appear only when it has
  something real to say.

## Also queued

- **New Core binary `e912ab2d…`** (on the Desktop, digests verified with a
  negative control). Pin fixture→`3bf2f0f1…`, source→`677d0fd6…`. **`rm` then
  `cp`, never overwrite in place.** Then **re-run the ToolSearch measurement —
  23→10 is UNCONFIRMED**, measured on a binary that loses 82% of long output and
  exits 0 on failure.
- **File card** — the outcome lane is fully plumbed and completely UNFED (zero
  adapters emit `type:'outcome'`). Feeding it also revives Build's dead
  Files/Artifacts facets. Blocker: which code path a real Codex run takes
  (`acp_tool_call` vs `codex_tool_call`) was never resolved.
- **K-05 T1 Windows verification** — mocked `spawn`, never a real `CreateProcess`.

---

## Windows box (for the Nano test agent)

`C:\wl-cdp` — a worktree at `9f009f81`, 2104 packages, MCP bundles built,
**CDP verified working on port 9243**. Full handoff for that agent is in the
session transcript; the essentials:
- **CDP binds 127.0.0.1 only** — the agent must run ON the box, or tunnel.
- Electron's install left an aborted extraction (only `locales`); fixed by copying
  the known-good 41.6.0 dist from `C:\wl-verify`. **`bun install` may undo it.**
- **Wayland Nano runs on that box too** (vite 5173, CDP 9222). Ours takes 5174 and
  9243. There is a startup race where Electron loads 5174 before vite accepts —
  just start it again.
- Do NOT touch `C:\wl-verify` (detached HEAD, deliberate).

---

## Method notes that paid off, keep doing them

- **Every real defect this session came from Sean looking at / listening to the
  running app while the suite was green.** Treat green as permission to test.
- Parallelise RECON, serialize BUILDS.
- Adversarial review before building saved a whole build on the voice plan.
- **A test that cannot go red proves nothing.** Twice this session a feature was
  deletable with a fully green suite.
- Before believing a zero result, prove the method finds a known positive.
- Exit 0 is not proof (the Core binary exits 0 on failure).
