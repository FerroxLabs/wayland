# Voice System — Implementation Guide

> Canonical "what / how / why" for Wayland's voice features (TTS, STT, auto-read,
> and open voice mode). For the decision rationale and phased roadmap see
> `voice-interaction-design.md`; this document explains the system as built.

---

## 1. What it is

Voice in Wayland is a way to **talk to the assistant and have it talk back**, in
any combination, configurable system-wide with per-conversation overrides. It is
**offline-capable by default** and **provider-agnostic** — local engines and cloud
services plug into the same interface.

Every usage mode is a cell in a simple 3 × 2 grid:

| | **Text reply** | **Voice reply (+ text)** |
|---|---|---|
| **Type** | classic chat | type, hear the answer |
| **Push-to-talk** | dictate, read the answer | car / hands-busy |
| **Open voice** | (rare) | full hands-free conversation |

So the UI never exposes "modes" — it exposes two controls: **how you talk to it**
(type / push-to-talk / open voice) and **whether it speaks back** (on / off).
Engine choice (Kokoro, Piper, Azure, …) lives in Settings, never in the chat.

A hard guarantee runs through the whole system: **text is never gated by voice.**
The assistant's reply streams into the chat in real time; speech synthesis runs
out-of-band in a background worker and reads the *completed* text. You can always
read ahead while audio is still playing, and slow/long playback never delays text.

---

## 2. Architecture — how it works

### 2.1 The engine layer (the core abstraction)

Everything routes through two streaming-first interfaces
(`src/process/services/voice/engine/types.ts`):

```ts
TtsEngine  { id, local, streaming, available(), voices(), synthesize(text, opts, onChunk, signal), warmup?, dispose? }
SttEngine  { id, local, streaming, available(), transcribe(audio, onEvent, signal) }
```

Engines register into a static **registry** (`engine/registry.ts`) at startup
(`engine/initEngines.ts`). The UI renders provider lists and voice dropdowns
*from the registry*, so adding an engine never touches settings code.

Engines shipped in-repo:

| Engine | Dir | Notes |
|---|---|---|
| `kokoro-local` | TTS | Default offline voice; warm worker, 23 curated voices |
| `piper-local` | TTS | Multilingual offline (en/es/fr/de…); warm worker |
| `mlx-audio-local` | TTS | Apple-Silicon "premium" engine; version-aware install |
| `system-native` | TTS | Zero-install floor (macOS `say` / OS speech) |
| `whisper-local`, `openai-whisper`, `deepgram` | STT | Ported into adapters; cloud STT keyed from the provider store |

### 2.2 Chains and failover

Config holds an **ordered preference chain** per direction (e.g. TTS:
`kokoro-local → system-native`). The **chain runner** (`engine/chainRunner.ts`):

1. Skips engines whose `available()` is false (not installed / wrong platform / no key).
2. Tries each in order; on a synthesis *error* it advances and emits a **failover notice**.
3. Local engines sit last as the offline floor that cannot fail.

**Engine health** (`engine/engineHealth.ts`) overlays this: an adapter maps a raw
failure to a typed `EngineError` kind — `auth` / `quota` / `rate-limit` /
`network` / `internal`. Persistent kinds (auth, quota) suspend an engine for an
hour; transient kinds suspend after 3 consecutive failures. Suspended engines drop
to the *bottom* of the effective order (last resort, never removed). The user's
configured order is never rewritten — health is just an overlay. This is what
"if it runs out of credits, drop it to the bottom" looks like in code.

### 2.3 Warm workers (near-real-time local synthesis)

Local TTS originally paid a `uv run` + model-load cost per request (~1.1–1.7 s).
Each local engine now keeps a **persistent Python worker**
(`engine/tts/kokoroWorker.ts`, `piperWorker.ts`) that loads the model once and
serves JSON-lines requests over stdin/stdout, splitting text into sentences and
emitting one audio chunk per sentence:

- **Kokoro:** cold ~1.1 s → **warm ~210 ms**.
- **Piper:** cold ~510 ms → **warm ~47 ms** (caches a `PiperVoice` per model path).

The worker is started lazily, **pre-warmed on conversation open** (so the *first*
reply is warm), idle-shuts-down after 10 min, restarts on crash, and is killed on
app quit. A `voiceSynth.warmup` IPC provider lets the renderer kick it off.

### 2.4 Transport (renderer ↔ main)

Synthesis runs in the **main process**; audio crosses the IPC bridge two ways:

- `voiceSynth.speak` — whole-clip envelope `{ ok, data, mimeType, engineUsed }`
  (used by the settings **Test voice** button).
- `voiceSynth.speakStream` + the `voiceSynth.stream` emitter — **base64 chunks
  scoped by `requestId`** so other windows / WebUI clients ignore frames they
  didn't request. The renderer decodes and plays them **gaplessly via Web Audio**
  (`renderer/utils/voicePlayback.ts`), so playback of a long reply starts on the
  first sentence. A single active-utterance contract means starting a new
  playback stops the previous one; `stopVoicePlayback()` is the global stop.

### 2.5 Auto-read (voice out)

`renderer/hooks/voice/useAutoReadReplies.ts`, mounted once in
`ConversationMessageList`, watches the message list. When an assistant turn
completes (observed via the shared `conversation.responseStream` `finish` event,
which works across every platform), it:

1. Resolves the **effective speak state** — a per-chat tri-state override
   (`inherit / on / off`) over the system-wide `autoReadDefault`.
2. Extracts **prose-only** speakable text (`common/voice/speakableText.ts`):
   strips markdown, drops code blocks / tables / URLs, and substitutes the user's
   **display name → spoken (phonetic) name** so it's pronounced right.
3. Plays it through the streaming chain. Fires exactly once per message.

Failover notices appear **inline in the conversation** (the built-in `tips`
system-line), while the settings Test button keeps toast errors.

### 2.6 Voice in (push-to-talk)

Dictation already existed (`SpeechInputButton` + `useSpeechInput`): mic →
`transcribeAudioBlob` → text injected into the composer. The system now also
wires the previously-dead `autoSend` config so a dictated message can send
automatically, with a settings toggle.

### 2.7 Open voice mode (hands-free "call mode")

`renderer/hooks/voice/useOpenVoiceSession.ts` composes a continuous loop, entered
from a **mic-mode toggle** beside the speaker toggle, with a live overlay
(`OpenVoiceOverlay.tsx`). The risky stateful logic is reduced to a **pure
reducer** (`nextOpenVoiceAction`) that is fully unit-tested:

- **Mic capture with echo cancellation** (`renderer/utils/voiceCapture.ts`):
  `getUserMedia({ echoCancellation, noiseSuppression, autoGainControl })` +
  an AnalyserNode emitting RMS frames.
- **VAD endpointing** (`common/voice/vad.ts`): an energy state machine with
  hysteresis detects speech-start and speech-end (after a configurable silence
  gap → auto-send).
- **Adaptive noise gate** (`common/voice/noiseFloor.ts`): continuously measures
  the ambient floor during non-speech and sets the VAD thresholds to
  `floor + margin` live — a noisy room (car/café) self-calibrates instead of
  false-triggering.
- **Voice-tweakable tuning:** a local intent matcher
  (`thresholdIntent.ts`, `sensitivityIntent.ts`) recognises "wait longer / go
  quicker" (silence gap) and "it's noisy / you're not hearing me" (sensitivity)
  and adjusts the per-conversation thresholds on the fly, with a spoken confirm.
- **Full barge-in:** speaking while the assistant talks stops TTS and the
  in-flight turn. Because the gate is now energy-above-floor, this also resists
  speaker bleed.
- **Call greeting** (`common/voice/greeting.ts`): a time-of-day greeting using
  the spoken name when a call starts.

### 2.8 Choosing a model — recommended defaults (everything is configurable)

The system ships sensible defaults but never locks the user in: any registered
engine/model can be selected, and the chain runner falls back gracefully. The
recommendations below are guidance, not constraints.

**Text-to-speech**

| Situation | Recommended | Why |
|---|---|---|
| Any platform (default) | **Kokoro** (`af_sky`) | Offline, fast (warm ~210 ms), good quality, cross-platform |
| Multilingual, offline | **Piper** | 30+ languages, very fast (warm ~47 ms), cross-platform |
| Apple Silicon, best quality | **mlx-audio** | Runs the large natural-prosody models locally via MLX |
| Zero-setup floor | System Native | No download; always available |

**Speech-to-text**

| Situation | Recommended | Size | Why |
|---|---|---|---|
| Out of the box (default) | **whisper-tiny** (bundled) | ~75 MB | Ships in the installer; zero-download, works offline immediately |
| Cross-platform upgrade | whisper base / small / large-v3-turbo | 148 MB / 488 MB / ~1.5 GB | whisper.cpp; bigger = more accurate, slower, multilingual |
| **Apple Silicon, English** | **Parakeet-MLX (8-bit)** | ~600 MB | Top open-ASR accuracy, lower latency than Whisper, streams partials — ideal for the call loop |
| Apple Silicon, multilingual | MLX Whisper large-v3-turbo | ~1.5 GB | MLX speed with Whisper's language coverage |

Notes that drive the defaults:

- **whisper-tiny is the only model pre-installed.** It bundles with the app and
  is what local dictation uses out of the box. Larger models are opt-in downloads.
- **Parakeet 0.6b is English-only** — that's why it's a *recommendation* for
  English users on a Mac, not the global default. Multilingual users stay on
  Whisper.
- **Parakeet quantization:** 8-bit is the sweet spot — roughly half the size of
  bf16 (~600 MB vs ~1.2 GB) with negligible accuracy loss for transcription;
  4-bit (~350 MB) trades a small, real accuracy cost for less disk. ASR models
  quantize more gracefully than LLMs, so 8-bit is the sane default.

### 2.9 Why MLX on Apple Silicon (the efficiency case)

MLX is Apple's own ML framework, not an ONNX execution provider — which is why it
succeeds where the ONNX CoreML provider doesn't (a benchmark showed CoreML was a
*net loss* for Kokoro because the graph only partially mapped to it). On
Apple Silicon, MLX gives:

- **Unified memory:** CPU and GPU share one pool, so model + audio live together
  with no CPU↔GPU copy — large models run without a discrete GPU.
- **Metal GPU (and ANE) acceleration:** real parallel throughput vs CPU-only
  ONNX/whisper.cpp; this is the latency win that makes the call loop feel live.
- **First-class quantization:** fast 4/8-bit kernels, so 8-bit Parakeet runs
  quickly at ~600 MB and low RAM.
- **Lazy graph fusion:** ops fused before execution — lower per-call overhead.
- **Zero driver setup:** works on any M-series Mac out of the box; no CUDA, no GPU
  drivers, none of CoreML's partial-mapping issues.
- **Power efficiency:** sustained transcription/synthesis at far lower wattage
  than CPU inference — better on battery.
- **Shared runtime:** MLX is already installed via `uv` for mlx-audio (TTS), so
  adding Parakeet-MLX (STT) reuses the same runtime — small incremental footprint.

The deliberate boundary: **MLX is Apple-Silicon-only.** It is therefore a
*premium opt-in tier* (`available()` gates it to `darwin/arm64`), never a default.
Windows, Linux, and Intel Macs use the cross-platform path (Kokoro + whisper.cpp /
ONNX). This is the same pattern on both sides of the system — local-by-default,
MLX as the Apple-Silicon accelerator when present.

---

## 3. What was broken, and how it was fixed

The original Kokoro integration never produced audio. The root causes, in the
order they blocked synthesis:

| # | Bug | Fix |
|---|---|---|
| 1 | Downloaded a **non-existent compiled `kokoro-cli` binary** (manifest had empty URLs) | Switched to the `kokoro-onnx` **PyPI package run via `uv`** — no custom binaries, platform-agnostic |
| 2 | `acquireBinary('onnx-runtime')` grabbed **Microsoft's ONNX Runtime**, not Kokoro | Removed binary acquisition; resolve the uv runtime + model + voices files |
| 3 | Registry had the model but **not the voice-embeddings** file | Both `kokoro-v1.0.onnx` and `voices-v1.0.bin` registered as pinned assets |
| 4 | Synthesis script `import soundfile` — **a package kokoro-onnx doesn't ship** | Write 16-bit WAV via the stdlib `wave`/numpy instead |
| 5 | Script lines joined with `; ` → **Python SyntaxError** on the continuation | Join with newlines |
| 6 | Install pre-warm used `--prerelease=allow`; synthesis didn't → **different env resolved**, re-downloading at synth time | Identical uv flags across status / install / synthesis (**flag parity**) |
| 7 | The vendored IPC bridge **swallows provider rejections** — a throw left the renderer hanging forever with no error | A `buildProvider` wrapper encodes provider errors as a sentinel and re-throws on the renderer side; providers return **result envelopes**, never throw across the bridge |
| 8 | **The real reason it hung:** the provider read `ConfigStorage.get` in the *main* process, which round-trips to the renderer and **never resolves** | Config now rides the request payload; main never reads renderer-bridged storage |
| 9 | Default voice was `'default'` — **not a valid Kokoro voice** | Default to a real voice (`af_sky`); validate on provider switch |
| 10 | `system-native` used `say --data-format=aiff` to stdout — **rejected by macOS, and Chromium can't play AIFF** (only surfaced once the chain made it a real fallback) | Write 16-bit WAV to a temp file |
| 11 | Multi-sentence warm-worker output stacked **per-sentence WAV headers** → playback stopped after sentence one | Strip headers, concatenate PCM, rebuild one header |

Two of these (7, 8) were the load-bearing fixes — everything downstream was
invisible until the bridge could surface an error and the provider stopped
hanging. They're now encoded as **hard constraints** in the design doc so future
work can't reintroduce them: *providers never throw across the bridge; main never
calls `ConfigStorage.get`.*

These lessons are distilled into a **local-engine implementation playbook**
(in `voice-interaction-design.md`): prove the runtime from a shell before wiring
UI; use uv + a Python package over custom binaries; keep uv flags identical
across install/status/synth; verify a package's deps actually ship; register every
required file as a pinned asset; envelope errors; curate UI choices; log at the
bridge; and verify by driving the real app, not just unit tests.

---

## 4. How it uses the existing extensions system

Wayland already ships an extension system — `aion-extension.json` manifests
discovered by `ExtensionLoader` along `WAYLAND_EXTENSIONS_PATH`. The voice engine
layer is deliberately designed so that **a community extension can register voice
engines into the same registry** the in-repo engines use:

- An extension contributes a `TtsEngine` / `SttEngine` (or a factory) that calls
  `registerTtsEngine` / `registerSttEngine`. From that point it is *indistinguishable*
  downstream — it flows through the same chain runner, the same failover and
  health-demotion, the same local/cloud badges, the same settings rendering, and
  the same per-chat controls. Engine origin (in-repo vs extension) is invisible to
  the rest of the system.
- The **registry + the two interfaces are the contribution surface.** An adapter
  touches no UI and no chain code — it only implements `available()` / `voices()` /
  `synthesize()` (or `transcribe()`), so a third party can add an engine without
  forking the app.
- This is gated on the interface having proven stable through Phase 1 (it has).
  Tier-1 cloud adapters (Azure, OpenAI, ElevenLabs, Deepgram, Groq, Cartesia,
  Google, Polly) stay in-repo because they need pinned versions, CI, and the
  install UX; everything beyond that is intended to arrive as community extensions.

The same uv-based install pattern the in-repo local engines use (download a Python
package + pinned model assets, run via the bundled `uv`) is the template a
community *local* engine follows, so new local voices are platform-agnostic by
construction.

### 4.1 Contributing voice models (one level down from engines)

The engine registry is the contribution surface for *engines*; the
**voice-model catalog** (`src/common/voice/voiceModelCatalog.ts`) is the
contribution surface for the *models within an engine*. The settings picker
renders from this catalog instead of hardcoded lists, and a community extension
can append entries to it without forking the picker.

**Manifest convention.** An extension may ship a `voice-models` array — either
inline in its `aion-extension.json` manifest or as a sibling `voice-models.json`
next to the manifest. Each entry matches the `VoiceModelEntry` shape:

```jsonc
{
  "voice-models": [
    {
      "kind": "tts",                       // 'tts' | 'stt'
      "engineId": "mlx-audio-local",       // engine that consumes the model
      "modelId": "acme/my-voice-mlx",      // stable id used in config (HF id or short id)
      "label": "My Voice",                 // dropdown label
      "hfId": "acme/my-voice-mlx",         // HuggingFace repo id, where applicable
      "sizeLabel": "~600 MB",
      "blurb": "Warm narrator voice",      // tooltip / description
      "quant": "8-bit",                    // optional quantization hint
      "platform": "darwin-arm64",          // optional: only offered on this platform
      "recommended": false
    }
  ]
}
```

Entries are merged via `buildVoiceModelCatalog`, which **dedups by
`engineId` + `modelId` and never lets an extension override a built-in** — an
extension can *add* a model but cannot shadow or hijack an in-repo one.

**Status:** the catalog, the merge function, and this manifest convention ship
now. The renderer **read path** (an `extensions.getVoiceModels` IPC provider
backed by `ExtensionRegistry`, parallel to `getThemes` / `getSkills`) is a
deliberate follow-up — adding it touches `src/common/adapter/ipcBridge.ts` and
the extensions bridge/registry. Until that provider lands,
`useVoiceModelCatalog` surfaces the built-in catalog; wiring the fetch is a
one-line change (pass the fetched entries as the `extra` argument), with no call
site changes.

---

## 5. Where things live

```
src/common/voice/                     pure, engine-agnostic logic (testable, no DOM/node)
  vad.ts                              VAD endpointer (energy + hysteresis)
  noiseFloor.ts                       adaptive ambient-floor tracker
  thresholdIntent.ts / sensitivityIntent.ts   voice-command matchers
  speakableText.ts                    prose extraction + name substitution
  greeting.ts                         time-of-day call greeting
src/common/types/
  ttsTypes.ts                         TTS config v2 (chain + per-engine settings) + migration
  voiceChatPrefs.ts                   per-chat speak override, silence + sensitivity thresholds
src/process/services/voice/engine/    the engine layer (main process)
  types.ts, registry.ts, chainRunner.ts, engineHealth.ts, initEngines.ts
  tts/  kokoroEngine, piperEngine, mlxAudioEngine, systemNativeEngine, *Worker
  stt/  whisperLocalEngine, openaiSttEngine, deepgramSttEngine
src/process/bridge/voiceSynthBridge.ts   speak / speakStream / warmup providers
src/renderer/utils/voicePlayback.ts      gapless Web Audio playback + stop
src/renderer/utils/voiceCapture.ts       mic capture with echo cancellation
src/renderer/hooks/voice/                useTtsConfig, useVoiceChatPrefs, useOpenVoicePrefs,
                                         useAutoReadReplies, useOpenVoiceSession
src/renderer/pages/conversation/components/   SpeakRepliesControl, MicModeControl, OpenVoiceOverlay
resources/voice-workers/                 kokoro_worker.py, piper_worker.py (shipped via extraResources)
```

---

## 6. Config & data

- TTS: `tools.textToSpeech` (chain + per-engine voice/speed + `autoReadDefault`).
  Old single-provider configs migrate silently via `normalizeTextToSpeechConfig`.
- STT: `tools.speechToText` (provider, keys, `autoSend`).
- Per-chat: `tools.voiceChatPrefs` (speak override + silence/sensitivity overrides).
- Open-voice defaults: `tools.voiceOpenDefaults` (silence gap, sensitivity bias).
- Name pronunciation: `user.displayName` (shown) + `user.spokenName` (phonetic,
  never displayed except in its settings field).
- Voice assets (models, voices, the `uv` binary, worker scripts) live under
  `<userData>/voice/…`; the warm-worker scripts ship as on-disk resources so
  `uv` can run them in a packaged build.

---

## 7. Verification

Pure modules (VAD, intent matchers, speakable-text, greeting, chain runner,
engine health, the open-voice reducer, config migration) are unit-tested; the
warm workers were shell-proven before wiring; and the full flow is exercised by an
instrumented Playwright spec (`tests/e2e/specs/voice-tts-verify.e2e.ts`,
asset-guarded so it self-skips in CI) that drives the real Settings → Voice UI and
asserts audible playback, warm-worker latency, chain fallback, the error path, and
pronunciation persistence. The one thing best confirmed by ear is the live
hands-free call loop in a real acoustic environment.
