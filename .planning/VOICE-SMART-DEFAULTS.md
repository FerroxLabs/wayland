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

| Finding | How it was proven |
| --- | --- |
| The IPC transport cannot carry a rejection. A provider that throws leaves the renderer's `invoke()` pending **forever**. | Executed the real `@office-ai/platform` `buildProvider` with a known-positive control: resolving provider settles, rejecting provider times out. |
| `voiceAsset.download` had no try/catch, so every failed acquisition hung the UI at "downloading". | Same transport property + code read. Fixed in `5703b758c`. |
| `whisper-cpp` and `onnx-runtime` entries in `voiceBinaryManifest.ts` are **fabricated**. Both URLs 404. | `curl -I` → 404. The `v1.7.1` tag does not exist (`releases/tags/v1.7.1` → 404). |
| whisper.cpp publishes **no macOS CLI binary at all**. | GitHub releases API, latest 3 releases: only `whisper-bin-*.zip` (Windows), `whisper-bin-ubuntu-*.tar.gz`, and an `xcframework` (a library, not an executable). |
| So `acquireBinary('whisper-cpp')` can never succeed on macOS, no matter what URL is used. | Follows from the two rows above. |
| The renderer never calls the main-process whisper path anyway. | `transcribeAudioBlob` short-circuits `whisper-local` (and unset) to `transcribeLocally` — transformers.js in a Web Worker, no IPC. |
| Therefore the 141 MB `ggml-base.bin` in the owner's profile is **orphaned**: it feeds a code path the renderer never reaches. | Same as above. |
| Flux Router exposes `/v1/audio/speech`, but registers **no TTS model** and customer keys carry **no TTS alias**. | Route probe: `/v1/audio/speech` → auth_error (route exists), `/v1/audio/translations` and a fabricated path → 404 (controls). `FULL_FLUX_MODELS` in flux-router lists only `flux-voice{,-accurate,-fast}` for audio. |

**The pattern:** both local providers were half-installed in the same way —
a model was acquired, a runtime never was — and the acquisition UI treated
"model" as the whole job.

---

## 1. The ladder

Resolved automatically at first run and re-resolved on every credential
change. The user is never asked.

| Rung | Condition | STT | TTS | Download |
| --- | --- | --- | --- | --- |
| 1 | Flux Router connected | `flux-voice` | *see §1.1* | none |
| 2 | OpenAI credential present | `openai` | `openai` | none |
| 3 | Neither | `whisper-local` | `kokoro-local` | background, first run |
| 4 | Rung 3 assets not ready yet | *preparing* → progress message | `system-native` | in flight |

Rung 4 is the rule that makes the others safe: **while local assets are
downloading the app still speaks**, using the macOS system voice, and still
tells the user why the microphone is not ready yet. A not-ready state is a
progress message, never an error, never "unknown".

### 1.1 Flux two-way: NO, and it must not be wired

The coordinator asked whether Flux does TTS as well as STT. Answer: **no,
not today.**

- The route exists. `POST /v1/audio/speech` returns `auth_error`
  ("No api key passed in") exactly like `/v1/chat/completions`, while
  `/v1/audio/translations` and a deliberately fabricated path both return
  `404 Not Found`. So the route is real, not a catch-all.
- It exists because Flux is LiteLLM-based and LiteLLM ships that route
  natively. Flux's own code mounts only `/v1/audio/transcriptions`
  (`src/audio_route.py`, `src/audio_route_registrar.py`).
- Flux registers no TTS model, and the customer key allowlist
  (`FULL_FLUX_MODELS`) carries no TTS alias — only `flux-voice`,
  `flux-voice-accurate`, `flux-voice-fast`. LiteLLM's `user_api_key_auth`
  401s any model not on the key.

So wiring Flux as a TTS provider today ships a guaranteed failure. Rung 1
uses Flux for STT and falls to the next available TTS. **UNVERIFIED:** I
could not authenticate against Flux (no key may be printed or used from
this lane), so this rests on the deployed route probe plus the flux-router
source, whose local checkout is from May 2026. Settling it needs one
authenticated `POST /v1/audio/speech` with `model: flux-voice`. If Flux
later registers a TTS model, rung 1 becomes two-way with no other change.

---

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

| Tier | Download | Approx. peak RSS |
| --- | --- | --- |
| tiny | 77.7 MB | ~0.3 GB |
| base | 148.0 MB | ~0.4 GB |
| small | 487.6 MB | ~0.9 GB |
| medium | 1.53 GB | ~2.1 GB |
| large-v3 | 3.10 GB | ~3.9 GB |

Policy — chosen on **total** RAM, never free RAM (free memory on this host
read 0.1 GiB while 24 GiB was installed; macOS uses everything it can, so
free RAM is noise), plus core count as a latency proxy:

| Condition | Tier |
| --- | --- |
| < 8 GiB total RAM | `tiny` |
| ≥ 8 GiB | `base` |
| ≥ 16 GiB **and** ≥ 8 cores | `small` |
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

## 3. State machine

Per leg (speak, listen), replacing today's boolean readiness:

```
        ┌─ user-chosen ──────────────► honour it, never re-resolve
        │
unset ──┼─ ready      ─► provider resolved, all components present
        ├─ preparing  ─► resolved, components downloading (progress %)
        └─ degraded   ─► resolved provider unusable, running on a fallback
                          (always says which, and why)
```

Rules:

1. **`user-chosen` is sticky.** The ladder sets a default; it never
   overrides a deliberate choice. Config must distinguish "never touched"
   from "chosen" — today it cannot, which is why `resolveFluxSttDefault`
   has to infer intent from whether an API key string is empty.
2. **`preparing` is never an error.** No red text, no error code, no
   "unknown". "Downloading the speech model in the background — 42%".
3. **`degraded` always names the substitute and the reason.** Silently
   falling back is the same class of bug as silently failing.
4. **Readiness is computed from every required component**, not just the
   model. A provider with a missing runtime can never present as usable.
   Kokoro already refuses correctly; Whisper does not, which is exactly how
   the owner reached "transcription failed (unknown)" after downloading a
   model.

### Surface copy per state

| Surface | ready | preparing | degraded |
| --- | --- | --- | --- |
| Voice orb | normal | "Getting your voice ready — 42%" | speaks via fallback, banner names it |
| Composer mic | normal | disabled + "Downloading the speech model" | error naming the missing component |
| Settings > Voice | "Installed" per component | per-component progress bars | per-component reason + Retry |

All copy needs real i18n keys in all 12 locales.

---

## 4. Staging

Larger than one packet. Ordered by benefit-to-risk.

- **Stage 1 — safety net (LANDED).** Failures name their cause and nothing
  hangs. `10ceecc8e` Flux credential inheritance (the highest-value single
  fix: it converts "download 450 MB and wait" into "already works" for
  every Flux user), plus the Test-voice and download hang fixes, plus
  "unknown" → real cause.
- **Stage 2 — honesty.** Delete the fabricated `whisper-cpp` /
  `onnx-runtime` manifest entries and the orphaned ggml download control.
  Component-aware readiness. Settings tells the exact truth per component.
  No new runtime yet. *Low risk, no new dependency.*
- **Stage 3 — Kokoro on transformers.js.** New worker mirroring
  `whisperWorker.ts`, phonemizer dependency, background acquisition of
  model + selected voice. This is what actually delivers "not the robotic
  system voice by default".
- **Stage 4 — first-run orchestration.** The ladder as a real resolver,
  `user-chosen` in config, resumable/cancellable background acquisition,
  re-resolution on credential change, and the progress surfaces.

Nothing here is bundled into the installer — the owner was explicit that
assets are fetched in the background, not shipped in the package.

---

## 5. What cannot be proven from this lane

- **That any of it sounds right.** jsdom has no `AudioContext`, and unit
  tests assert bytes, not audio. Every claim about a voice being audible or
  good needs a human listening to the packaged app.
- **Flux TTS**, per §1.1 — needs one authenticated request.
- **Which build the owner was running** when he saw "unknown". The
  `resources/voice-models/whisper-tiny` directory is gitignored and absent
  from this worktree but present in `~/dev/wayland/app` and inside
  `/Applications/Wayland.app`. So a dev run from a worktree fails on a
  missing model, and the packaged app would instead fail on the ORT WASM
  runtime, which `whisperWorker.ts` fetches from a CDN under a CSP that
  blocks external hosts. Both produce a non-`STT_` message, and both were
  rendered as "unknown". Stage 2 should bundle the WASM backend rather than
  fetch it.
