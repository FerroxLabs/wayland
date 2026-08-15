# Voice smart defaults — it just works, out of the box

Status: **plan**. Stage 1 landed, stages 2–4 not started.
Owner requirement: a customer never thinks about voice setup. No provider
picker on first run, no dead buttons, no silence, no raw error codes.

Every number and every URL in this document was verified by execution on
2026-08-11 (macOS 26.3, arm64, Apple M5, 10 cores, 24 GiB). Claims that were
NOT verified are marked **UNVERIFIED** and say what would settle them.

---

## 0. What was actually broken

Measured, not assumed:

| Finding                                                                                                                       | How it was proven                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The IPC transport cannot carry a rejection. A provider that throws leaves the renderer's `invoke()` pending **forever**.      | Executed the real `@office-ai/platform` `buildProvider` with a known-positive control: resolving provider settles, rejecting provider times out.                                                                     |
| `voiceAsset.download` had no try/catch, so every failed acquisition hung the UI at "downloading".                             | Same transport property + code read. Fixed in `5703b758c`.                                                                                                                                                           |
| `whisper-cpp` and `onnx-runtime` entries in `voiceBinaryManifest.ts` are **fabricated**. Both URLs 404.                       | `curl -I` → 404. The `v1.7.1` tag does not exist (`releases/tags/v1.7.1` → 404).                                                                                                                                     |
| whisper.cpp publishes **no macOS CLI binary at all**.                                                                         | GitHub releases API, latest 3 releases: only `whisper-bin-*.zip` (Windows), `whisper-bin-ubuntu-*.tar.gz`, and an `xcframework` (a library, not an executable).                                                      |
| So `acquireBinary('whisper-cpp')` can never succeed on macOS, no matter what URL is used.                                     | Follows from the two rows above.                                                                                                                                                                                     |
| The renderer never calls the main-process whisper path anyway.                                                                | `transcribeAudioBlob` short-circuits `whisper-local` (and unset) to `transcribeLocally` — transformers.js in a Web Worker, no IPC.                                                                                   |
| Therefore the 141 MB `ggml-base.bin` in the owner's profile is **orphaned**: it feeds a code path the renderer never reaches. | Same as above.                                                                                                                                                                                                       |
| Flux Router exposes `/v1/audio/speech`, but registers **no TTS model** and customer keys carry **no TTS alias**.              | Route probe: `/v1/audio/speech` → auth_error (route exists), `/v1/audio/translations` and a fabricated path → 404 (controls). `FULL_FLUX_MODELS` in flux-router lists only `flux-voice{,-accurate,-fast}` for audio. |

**The pattern:** both local providers were half-installed in the same way —
a model was acquired, a runtime never was — and the acquisition UI treated
"model" as the whole job.

---

## 1. Two ladders, not one

Flux Voice is **speech-to-text only** (owner-confirmed, and independently
proven in §1.2). A provider does not necessarily serve both directions, so
a single ladder cannot express the defaults. They resolve independently,
at first run and again whenever a credential appears or disappears.

### 1.1 Speech IN (listen)

| Rung | Condition                 | Provider        | Download                          |
| ---- | ------------------------- | --------------- | --------------------------------- |
| 1    | Flux Router connected     | `flux-voice`    | none                              |
| 2    | OpenAI credential present | `openai`        | none                              |
| 3    | neither                   | `whisper-local` | background, machine-relative tier |
| 4    | rung 3 still acquiring    | _preparing_     | in flight                         |

**There is no floor on this side.** With nothing connected and nothing
downloaded, speech-in genuinely cannot work. That is why `preparing` and
`needsSetup` are real and common here, and why the mic must be
inactive-with-a-reason rather than clickable into silence.

### 1.2 Speech OUT (speak)

| Rung | Condition                  | Provider        | Download           |
| ---- | -------------------------- | --------------- | ------------------ |
| 1    | OpenAI credential present  | `openai`        | none               |
| 2    | otherwise                  | `kokoro-local`  | background, ~86 MB |
| 3    | rung 2 acquiring or failed | `system-native` | none               |

**`system-native` is a guaranteed floor on macOS**, so speech-out should
essentially never reach `needsSetup` there; it reaches `degraded` and says
so. On Windows and Linux no `say` equivalent is wired, so the floor does
not exist and `unsupported` is reachable.

**Flux Voice must not appear in the TTS picker at all.** Proven: its
`/v1/audio/speech` route answers `auth_error` rather than 404, so the route
exists, but only because Flux runs on LiteLLM, which ships that route
natively. Flux's own code mounts only `/v1/audio/transcriptions`, and the
customer key allowlist (`FULL_FLUX_MODELS`) carries no TTS alias, only
`flux-voice`, `flux-voice-accurate`, `flux-voice-fast`. LiteLLM 401s any
model absent from the key, so offering it would ship a guaranteed failure.

### 1.3 The common case this creates

A Flux-only user gets instant speech-in with zero download and still needs
an answer for speech-out. They land on `system-native` immediately, so they
are never silent, while Kokoro acquires in the background, then upgrade
without being asked. The upgrade is announced quietly rather than
silently: a user who chose nothing should be told their voice improved,
and a user who chose `system-native` deliberately must keep it.

### 1.4 Unset vs user-chosen

The ladder sets a default. It must never override a deliberate choice, and
today it cannot tell the difference: `resolveFluxSttDefault` infers intent
from whether an API key string happens to be empty, which is a guess.

Config gains an explicit origin per direction:

```
tools.speechToText.origin : 'default' | 'user'
tools.textToSpeech.origin : 'default' | 'user'
```

- `'default'` — the resolver owns this leg and may re-resolve it freely.
- `'user'` — set the moment a human changes the provider in Settings. The
  resolver never rewrites it. It may still report `degraded` if the chosen
  provider stops working, but it substitutes loudly and never silently
  re-points the setting.

Migration: an existing config with no `origin` is treated as `'default'`
UNLESS its provider differs from what the ladder would have picked, in
which case it is `'user'`. That reads a deliberate past choice correctly
without a prompt.

### 1.5 Credential transitions

| Event                            | Speech in                                                                                    | Speech out                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Flux connected                   | re-resolve to `flux-voice`; cancel a pending Whisper download                                | unchanged (Flux is STT-only)                          |
| OpenAI connected                 | re-resolve to `openai` if origin is `default`                                                | re-resolve to `openai` if origin is `default`         |
| Credential removed               | fall back down the ladder; start acquisition if the next rung is local                       | fall back; `system-native` covers the gap immediately |
| Credential becomes undecryptable | treated as removed, and reported as `failed` with the real reason, never as "not configured" |

Cancelling a pending download when a credential arrives is the point of the
transition table: a Flux user who connects mid-download should not keep
pulling 488 MB they no longer need.

## 2. Which local engine, and which tier

### 2.1 Runtime choice — transformers.js, not native binaries

There is no acquirable native runtime for either provider (§0). There IS a
working precedent already in the codebase: `whisperWorker.ts` runs Whisper
through `@huggingface/transformers` (already a dependency) in a Web Worker
with the WASM backend. Both local providers should use that path.

- **Whisper**: already there. What is missing is that it only ever loads
  the bundled `whisper-tiny`; the ggml models the Settings control
  downloads are for the dead native path and are consumed by nothing.
- **Kokoro**: `onnx-community/Kokoro-82M-v1.0-ONNX` is transformers.js
  compatible and carries per-voice weights as separate small files.
  Verified sizes: `model_q8f16.onnx` 86.0 MB, `model_quantized.onnx`
  92.4 MB, `model_fp16.onnx` 163.2 MB, `model.onnx` 325.5 MB, and each
  voice `voices/*.bin` 522 KB.
  Needs a phonemizer; neither `phonemizer` nor `kokoro-js` is installed
  today, so this rung adds a dependency.

The 310 MB `kokoro-v1.0.onnx` already in the owner's profile is from the
`thewh1teagle/kokoro-onnx` release, which targets a **Python** library. It
is not loadable by transformers.js. It should be treated as orphaned and
garbage-collected, not counted as progress.

### 2.2 Whisper tier policy

Verified sizes (HTTP range request, `content-range` totals):

| Tier     | Download | Approx. peak RSS |
| -------- | -------- | ---------------- |
| tiny     | 77.7 MB  | ~0.3 GB          |
| base     | 148.0 MB | ~0.4 GB          |
| small    | 487.6 MB | ~0.9 GB          |
| medium   | 1.53 GB  | ~2.1 GB          |
| large-v3 | 3.10 GB  | ~3.9 GB          |

Policy — chosen on **total** RAM, never free RAM (free memory on this host
read 0.1 GiB while 24 GiB was installed; macOS uses everything it can, so
free RAM is noise), plus core count as a latency proxy:

| Condition                                | Tier    |
| ---------------------------------------- | ------- |
| < 8 GiB total RAM                        | `tiny`  |
| ≥ 8 GiB                                  | `base`  |
| ≥ 16 GiB **and** ≥ 8 cores               | `small` |
| arm64 Apple silicon, ≥ 16 GiB, ≥ 8 cores | `small` |

Justification for stopping at `small`: `medium` is a 1.5 GB background
download and ~2.1 GB resident for a dictation feature, which violates
"never blocks app start or first turn" on any realistic connection. `large`
is never auto-selected. Both remain manually selectable in Settings for
users who want them. This host resolves to `small`.

Kokoro has no tier ladder — `model_q8f16.onnx` (86 MB) is the default for
every machine, with `model_fp16.onnx` offered manually. **UNVERIFIED:**
relative audio quality of the quantized variants has not been listened to.
That needs a human ear on real output and cannot be settled from tests.

---

## 3. The affordance state machine

**The invariant: a voice control is never clickable into a dead end.**
Either it works, or it is inactive and says why on hover, without the user
having to click to find out. Today's defect is exactly this violation: an
enabled Test voice button, clicked, produced silence and logged nothing.
That must become structurally impossible, not fixed in one handler.

One resolver produces one state per direction. Every surface reads it.
No surface hand-rolls its own logic, so the button and the settings page
can never disagree, a contradiction that has already bitten this repo twice
(a provider row red while its detail view said connected; Settings showing
"Connected, 77 models" while chat said no provider).

### 3.1 States

| State         | Meaning                                                        | Control               | Clickable                                       |
| ------------- | -------------------------------------------------------------- | --------------------- | ----------------------------------------------- |
| `ready`       | provider usable, all components present, credential resolvable | normal                | yes                                             |
| `preparing`   | assets acquiring in the background                             | inactive + progress   | no                                              |
| `needsSetup`  | nothing usable and nothing downloading                         | inactive              | no; the hover action routes to Settings > Voice |
| `unsupported` | cannot work on this platform or build                          | inactive              | no                                              |
| `failed`      | a real error occurred                                          | inactive, cause named | no; offers Retry                                |

`preparing` is a progress state and is never styled or worded as an error.
`failed` always names the cause; "unknown" is not a permitted rendering.

### 3.2 Derivation

State is a function of the same readiness resolver that drives the ladder:

```
resolveVoiceLeg(direction) -> {
  provider,            // what the ladder picked, or the user's choice
  origin,              // 'default' | 'user'
  state,               // the five above
  missing: Component[] // every component still absent, named
  progress?: { component, bytesDownloaded, totalBytes }
  reason?: string      // required when state is failed | unsupported
}
```

Readiness is computed from **every** required component, never just the
model. This is the defect already proven in §0: Whisper let the user select
it, download a model, and then fail at speak time, because the runtime was
never part of the readiness question. Kokoro already refuses correctly.
Components per provider:

- `whisper-local`: model weights **and** the transformers.js engine assets
- `kokoro-local`: model weights, the selected voice `.bin`, phonemizer data
- `openai` / `flux-voice`: a resolvable credential
- `system-native`: macOS only

### 3.3 Copy, per state, per direction

Speech-out has a floor and speech-in does not, so the copy is not shared.

| State         | Speech IN (mic, voice-mode button)                             | Speech OUT (Test voice, auto-read)                                            |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `preparing`   | "Downloading the speech model in the background" + %           | not reachable; `system-native` covers it                                      |
| `needsSetup`  | "Check voice settings to enable" -> routes to Settings > Voice | macOS: not reachable. Others: "No speech voice is available on this platform" |
| `unsupported` | "This build cannot record audio"                               | "Speech output is not available on this platform"                             |
| `failed`      | the named cause, plus Retry                                    | the named cause, plus Retry                                                   |
| `ready`       | normal                                                         | normal                                                                        |

Every string needs a real i18n key in all 12 locales. The mic already has a
"Set up dictation" route; `needsSetup` reuses it rather than inventing a
second path.

### 3.4 Surfaces covered

The composer mic, the composer voice-mode (waveform) button, the front-page
pair, and Settings' Test voice. All four read `resolveVoiceLeg`; none of
them decide for themselves whether they are enabled.

## 4. Staging

Larger than one packet. Ordered by benefit-to-risk. **Stages 2-5 are gated
on owner sign-off of this document.**

- **Stage 1 - safety net (LANDED).** Failures name their cause and nothing
  hangs. `10ceecc8e` Flux credential inheritance (the highest-value single
  fix: it turns "download 488 MB and wait" into "already works" for every
  Flux user), `5703b758c` failed downloads no longer hang forever,
  `78429bfe4` "unknown" replaced by the real reason, plus the Test voice
  silent no-op and the undecryptable-credential cause.
- **Stage 2 - honesty.** Delete the fabricated `whisper-cpp` /
  `onnx-runtime` manifest entries and the orphaned ggml download control.
  Component-aware readiness (§3.2). Settings tells the exact truth per
  component. Flux Voice's own form stops rendering Deepgram's fields and
  stops asking for a key it does not need. No new runtime, no new
  dependency. _Lowest risk._
- **Stage 3 - the affordance state machine.** `resolveVoiceLeg`, the five
  states, and all four surfaces reading it (§3). Delivers "never clickable
  into a dead end" even before any new provider exists.
- **Stage 4 - Kokoro on transformers.js.** New worker mirroring
  `whisperWorker.ts`, a phonemizer dependency, background acquisition of
  model plus selected voice. This is what actually delivers "not the
  robotic system voice by default".
- **Stage 5 - first-run orchestration.** The two ladders as a real
  resolver, `origin` in config (§1.4), resumable and cancellable background
  acquisition that never blocks app start or the first turn, and the
  credential-transition table (§1.5).

Nothing is bundled into the installer; the owner was explicit that assets
are fetched in the background rather than shipped in the package.

## 5. What cannot be proven from this lane

- **That any of it sounds right.** jsdom has no `AudioContext`, and unit
  tests assert bytes, not audio. Every claim about a voice being audible or
  good needs a human listening to the packaged app.
- **Flux TTS.** Owner-confirmed as speech-to-text only, and the route
  evidence in §1.2 agrees. What I could not do is authenticate against Flux
  from this lane (no key may be printed or used here), and the local
  flux-router checkout is from May 2026, so the proof is a deployed-route
  probe plus source rather than a live authenticated call.
- **Which build the owner was running** when he saw "unknown". The
  `resources/voice-models/whisper-tiny` directory is gitignored and absent
  from this worktree but present in `~/dev/wayland/app` and inside
  `/Applications/Wayland.app`. So a dev run from a worktree fails on a
  missing model, and the packaged app would instead fail on the ORT WASM
  runtime, which `whisperWorker.ts` fetches from a CDN under a CSP that
  blocks external hosts. Both produce a non-`STT_` message, and both were
  rendered as "unknown". Stage 2 should bundle the WASM backend rather than
  fetch it.
