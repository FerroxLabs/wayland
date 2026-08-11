# Closeout plan: voice and agent installs

Adjudicated 2026-08-11 from a 12-agent workflow: two survey readers per area, two plan
drafters, four adversarial audit lenses. The synthesis agent died before writing; this file
is the adjudication its inputs support.

**All four audit lenses returned FIX-FIRST on the drafted plans.** Their findings are folded
in below. Where a lens contradicted a drafter, the lens wins and the reason is stated.

---

## 1. Decisions taken (not asked)

The drafters left seven owner decisions open. Six of them are forced by evidence or by the
owner's stated principle ("don't make me think and it just fucking works"), so they are
taken here rather than parked. Each is reversible; say the word and it flips.

| # | Decision | Why it is not a real question |
|---|---|---|
| D1 | **One local speech engine: transformers.js + Xenova ONNX.** Delete whisper.cpp/ggml and kokoro-local. | whisper.cpp has never published a macOS CLI at any tag, ships multi-file archives the acquire code structurally cannot install, and all 8 manifest URLs 404. Kokoro needs a runtime, a 28 MB voices file and a phonemizer that exist nowhere in the tree. That is a build, not a download. transformers.js already works and is already bundled. |
| D2 | **Windows speech-out floor = `windows-native` via SAPI.** | Off darwin there is zero speech out without a hosted key. SAPI ships in every Windows install, needs no download, has no licence question, and returns a buffer so it slots into the existing bridge unchanged. |
| D3 | **Bundle the ~43 MiB tiny floor only; everything above downloads in background.** | Not a new rule, a description of shipped reality: `prepareVoiceModel.js` already puts 43.1 MiB of whisper-tiny in the installer and the resource verifier marks it critical. That 43 MiB is the only thing between a credential-free machine and zero speech-in. |
| D4 | **Speech-in defaults ON, with the on-device floor placed FIRST in the ladder.** | See §2, finding A. The "on" is only safe because of the "first". |
| D5 | **Reclaim orphaned assets on upgrade** (325 MB kokoro + 148 MB ggml), silently, with a log line. | Consumed by nothing. A prompt about files the user never chose to download is noise. |
| D6 | **Linux is out of scope for the speech-out floor this cycle** — `unsupported` with a named reason, never silence. | No `say`, no SAPI. Naming it is honest; pretending otherwise is not. |
| D7 | **openclaw comes out of the install band.** | Proven by execution: openclaw requires `node:sqlite` and refuses bundled bun; the packaged app resolves bundled bun whenever one exists, and there is no runtime-compatibility gate. A Wayland-installed openclaw on a clean machine is guaranteed to fail. System-detected openclaw is untouched. |

**Still genuinely the owner's, and both are on the critical path:**

- **One console logon on SeanDesktop as `WaylandCleanTest`.** One click, no password. A plain
  `Users` account has no `SeBatchLogonRight`, so no scheduled task can create the session, and a
  batch logon has no window station for Electron. The account has a blank password, which Windows
  policy restricts to console logon only, so RDP is a dead end. Once signed in, everything after
  is scripted over SSH.
- **Publish an attested `wayland-nano` release.** The repo is private, has 0 releases, 0 tags, and
  no release workflow. `verifyPublisherAttestation` needs SLSA provenance v1 from a GitHub runner.
  Nothing in the Nano track can be written, let alone tested, until that exists. The tag must be
  namespaced (`nano-vX.Y.Z`), because `selectPolicy` matches on `releaseTag` alone and throws on
  two matches — a bare `vX.Y.Z` collision **breaks the wayland-core build**. This was proven with
  a synthetic clash and a known-positive control.

Neither blocks the macOS work now in flight.

---

## 2. What the audit lenses overturned

Five corrections that change the build. Each was proven, not argued.

**A — The obvious ladder walks the user into a legal modal.** `hostedVoiceConsentGranted` is
fail-closed and `HOSTED_VOICE_PROVIDERS` includes flux-voice, openai and deepgram. So a ladder of
"Flux → OpenAI → local" means the most common fresh-install user, someone who connected Flux
Router, gets a disclosure sheet on their first tap of the mic. It also falsifies the privacy
rationale for defaulting speech-in on. **The on-device floor goes first for `origin: 'default'`.**
Hosted rungs are used only when the user picks one, and the consent sheet is offered there, in the
Voice panel — never from the composer. `stt-needs-consent` and `tts-needs-consent` become *failure*
states of the acceptance table, not passes. The draft omitted them and the table went green while
the user hit a wall.

**B — The composer mic is outside every voice task.** All five non-test call sites of the readiness
resolver are in the voice-mode hook. `SpeechInputButton` takes a bare `disabled` prop from its
parent and `useSpeechInput` never consults readiness at all. The composer is the shipped surface
per the owner's own direction — voice in the composer like Claude Desktop, not a full-screen orb —
so a plan that never names either file cannot deliver working voice. Both files are now named
tasks.

**C — The floor has a 5-10 second silent cold start and nothing warms it.** The worker's own header
documents the warmup; `warmLocalWhisper()` and `isLocalWhisperReady()` exist and have **zero call
sites** anywhere in the tree. Today that latency hides, because the local engine is only reachable
via Settings, which warms it. Making it the default relocates those silent seconds onto the first
tap. Fix: a `warming` leg state driven by the readiness probe, plus an eager warm at a moment the
user is not waiting, plus a measured tap-to-transcript ceiling in acceptance.

**D — Voice certifies a session that cannot answer.** The resolver has no model leg. On a fresh
install with no keys, voice reports ready, greets, opens the mic, transcribes — and nothing
replies, because no model is connected. The product already knows this state elsewhere
(`NoModelCtaCard`). A third leg now gates entry: no model, no greeting, no mic, and copy that
routes where the CTA card routes.

**E — The `origin` migration contradicted itself.** The draft said a keyless-OpenAI config migrates
to `'default'` *and* that a deliberate keyless-OpenAI choice resolves `'user'` and is never
reseeded. Those are the same bytes on disk — the normalizer spreads the default over every stored
config, so an absent provider reads back as `'openai'`. Resolution: **all pre-origin configs
migrate to `'default'`**, and the never-reseed guarantee is forward-only. The acceptance test drives
the real migration over legacy-shaped JSON with no origin field, never over a fixture that already
carries one. Separately, the STT normalizer passes `provider` through with no validation, unlike its
TTS sibling — so a stored `whisper-local` would survive the deletion and be pinned as `'user'`
forever. Provider-validity coercion closes that.

---

## 3. Sequencing

`packet/agent-installers` is a **child** of `packet/attribution-audit`, not a sibling — merge-base
`4ed839e34`, 38 commits on attribution since the fork against 14 on installers.

All three branch pairs merge with **zero textual conflicts**, confirmed with `git merge-tree`. That
is the danger, not the reassurance: the #950 Nano collision is **semantic**. In the clean merged
tree `createWNanoAgent()` lands at index 1, ahead of the managed installs, while the `D2 slot`
comment sits empty at the correct position — precisely the defect commit `1cda570a8` was written to
prevent, delivered by a conflict-free merge. CI does catch it, because the merged suite carries two
mutually exclusive assertions. #950 must be **rebased**, not merged, so its author sees the slot in
context.

Order: attribution → main, installers → main, #950 rebased last. Landing installers first would put
a Nano stub on main that shadows real installs.

**Split recommended.** The attribution branch carries finished work (theming, the 402-string em-dash
sweep, the Test-voice fix) behind unfinished voice work. Ship the finished half as its own PR so the
installers packet is not hostage to a lane that is still building.

---

## 4. Build now in flight

Six isolated worktrees, one agent each, each adversarially refuted by an independent skeptic.
Running multiple agents in one worktree cost a mis-attributed commit and a wrong-worktree test run
last session; the rule is now enforced by construction.

| Lane | Worktree | Scope |
|---|---|---|
| Constitution | `wl-constitution` | The key ring bricking every turn on every backend. Degrade instead of brick, preserve the old ciphertext, timeout the keychain. **Gate for all live verification.** |
| Voice core | `wl-voice-core` | Origin flag, inverted per-direction ladder, composer wiring, cold-start warm, model leg, total failure vocabulary, repaint fix. |
| Voice offline | `wl-voice-offline` | Local ORT-WASM paths so the floor stops fetching 22.5 MiB from a CDN the app's own CSP forbids, and works offline. |
| Voice inventory | `wl-voice-wintts` | Windows SAPI floor; delete whisper.cpp/kokoro/acquire layer; reclaim orphans. |
| Agent UI | `wl-agent-ui` | Failure copy, cancel, uninstall, inert Flux chip on absent cards, drop openclaw, status freshness, codex handshake — answer NO if it does not respond. |

---

## 5. The honesty line

jsdom has no `AudioContext`, no media decode, no worker WASM and no OS speech APIs. **No test in
this plan can prove a byte reached a speaker.** Every lane states what it proves and what it cannot.
Audibility is settled by the owner's ears against the packaged artifact, not by a green suite —
and when the measurement and the listen disagree, the listen wins. That has already happened once
on comma prosody.

Two acceptance gates cannot run on this machine at all: the Windows speech-out floor and the
clean-machine sweep. They are written here, executed there, after one console logon.
