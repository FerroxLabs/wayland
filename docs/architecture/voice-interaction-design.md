# Voice Interaction Architecture

**Date:** 2026-06-12
**Status:** Approved design — implementation scope is Phases 0+1
**Branch:** `feat/tts-kokoro`

## Goal

Make voice a first-class, provider-agnostic way to interact with Wayland: spoken
replies (TTS) and spoken input (STT) in any combination, configurable system-wide
with per-chat overrides, fast enough to feel conversational, and resilient via
ordered provider failover. Covers accessibility needs and situational preference
(headphones in bed, push-to-talk in the car, classic text at a desk).

## The interaction model: two axes, not six modes

Every usage combination is a cell in a 3×2 grid:

| | **Text reply** | **Voice reply (+ text)** |
|---|---|---|
| **Type** | classic chat | type, hear answer |
| **Push-to-talk** | dictate, read answer | car / hands-busy |
| **Open voice** | (rare) | full conversation |

The UI therefore exposes exactly **two controls**:

- **Input mode**: type / push-to-talk / open voice
- **Speak replies**: on / off

Both exist at two levels:

1. **System-wide defaults** in Settings → Voice (alongside engine config).
2. **Per-chat overrides**: tri-state (*inherit default / on / off* for speaking;
   *inherit / type / PTT / open* for input), as compact icons in the chat input
   row. New chats inherit; overrides persist per conversation.

**Universal capture rule:** voice input is transcribed into the chat as the user
message; spoken replies are always also rendered as text. The text transcript is
the single source of truth in every mode.

**Engine configuration never appears in-chat.** Provider/voice/speed/keys are
global (Settings → Voice). Per-chat you choose *how to interact*, not *which
engine*.

**Mode availability derives from engine availability.** Each interaction mode
declares its requirements (voice out: any available TTS engine — System Native
guarantees a floor; push-to-talk: any available STT engine + mic permission;
open voice: a streaming STT engine + mic permission). A mode whose
requirements are unmet is never broken or hidden: its control surfaces the
install path instead (the Test→Install button pattern). Every combination
that CAN work with the installed tools works; combinations that can't clearly
say what to install.

## The engine layer (Phase 0)

### Adapter interfaces

Streaming-first; non-streaming engines return a single chunk. Located with the
existing voice services under `src/process/services/voice/`.

```ts
type TtsChunk = { data: Uint8Array; mimeType: string; seq: number; final: boolean };

interface TtsEngine {
  readonly id: string;                 // 'kokoro-local', 'azure', 'edge-community', ...
  readonly local: boolean;             // offline-capable
  readonly streaming: boolean;         // emits incremental chunks
  available(): Promise<{ ok: boolean; reason?: string }>;   // installed/keyed/platform
  voices(): Promise<{ id: string; label: string }[]>;       // engine-compatible voices only
  synthesize(text: string, opts: { voice?: string; speed?: number },
             onChunk: (c: TtsChunk) => void,
             signal: AbortSignal): Promise<void>;
  warmup?(): Promise<void>;            // optional pre-load (model into memory)
  dispose?(): Promise<void>;
}

interface SttEngine {
  readonly id: string;
  readonly local: boolean;
  readonly streaming: boolean;         // partial transcripts
  available(): Promise<{ ok: boolean; reason?: string }>;
  transcribe(audio: AsyncIterable<Uint8Array>,
             onEvent: (e: { text: string; final: boolean }) => void,
             signal: AbortSignal): Promise<void>;
}
```

A static registry maps engine ids to factories (same pattern as the existing
binary/asset manifests). The UI renders provider lists, voice dropdowns, and
setup controls **from the registry** — adding an engine never touches the
settings UI again. Voice dropdowns call `voices()` so only compatible voices
ever show.

### Ported engines (no behaviour change beyond noted)

| Engine | Direction | Notes |
|---|---|---|
| `kokoro-local` | TTS | Gains the **warm worker** (below); sentence-chunked so it streams |
| `mlx-audio-local` | TTS | becomes the premium Apple-Silicon engine — see below |
| `system-native` | TTS | Renderer speechSynthesis path preserved; main `say` for non-UI callers |
| `whisper-local` | STT | gains model tiers (below); whisper.cpp pin bumped for turbo support |
| `openai-whisper` | STT | as-is |
| `deepgram` | STT | as-is |

### Offline-by-default + Whisper model tiers

The shipped default chains are fully offline: TTS `kokoro-local →
system-native`, STT `whisper-local`. Cloud engines are opt-in upgrades, never
silent defaults.

Whisper local gains accuracy tiers (registry entries, same download/install
flow as Kokoro):

| Tier | Model | Size | Notes |
|---|---|---|---|
| Floor | tiny (bundled) | 43 MB | ships in installer; zero-download dictation |
| Light | base / small | 148 / 488 MB | current options, kept |
| **Recommended** | **large-v3-turbo (quantized)** | ~1 GB | near large-v3 accuracy at ~8× decode speed; Metal on Apple Silicon; needs whisper.cpp pin bump (>= turbo support) |

The onboarding voice step recommends hardware-aware: Kokoro +
large-v3-turbo on capable machines (Apple Silicon / sufficient RAM), stepping
down to base otherwise. Whisper is batch, not streaming — live partials for
Phase 3 come from a streaming transducer engine (e.g. Parakeet via
sherpa-onnx) added through the `SttEngine` interface, not from stretching
Whisper.

### Kokoro warm worker

Replaces spawn-per-request (~1.1–1.7 s, ~70% process spawn + model load):

- One long-lived Python process via
  `uv run --with kokoro-onnx --prerelease=allow python <worker script>`,
  started lazily on first synthesis (or by `warmup()` when TTS is enabled).
- JSON-lines protocol over stdin/stdout: request `{id, text, voice, speed}` →
  responses `{id, seq, pcmBase64|path, sampleRate, final}`. Worker splits text
  into sentences and emits a chunk per sentence — first audio in ~200–400 ms.
- Lifecycle: restart on crash (with backoff), idle shutdown after 10 min,
  killed on app quit. A wedged worker (no response in 30 s) is killed and the
  request fails over down the chain.

### mlx-audio: the premium Apple-Silicon engine (Phase 1)

Positioning: Kokoro is the cross-platform offline default; **mlx-audio is the
"better voices if you have the hardware" engine**. MLX (unified memory +
Metal) is what makes the large natural-prosody models (CSM-1B, Dia, Orpheus,
F5-TTS) practical locally — for 82M-param Kokoro the backend makes no
meaningful difference, so Kokoro stays ONNX everywhere.

Treatment (mirrors the Kokoro install rigor):

- **`available()`**: confirms darwin/arm64 (gate exists today) and uv present;
  otherwise the engine is hidden from chains and settings.
- **Version-aware install**: status probe reports the installed mlx-audio
  version (`uv run --offline … python -c "import mlx_audio; print(__version__)"`-
  style); a pinned minimum compatible version drives install **or upgrade**
  through the existing uv pre-warm flow with progress UI.
- **Model install**: the default model is downloaded explicitly at setup time
  (progress, cancel, delete — same UX as Kokoro), not lazily on first
  synthesis. Curated model dropdown (only models verified to work through
  mlx-audio), plus a free-form HF-ID escape hatch for enthusiasts.
  CosyVoice/Qwen-lineage models enter the curated list only after
  verification — the open Alibaba voice models are CosyVoice (TTS) /
  SenseVoice (STT); Qwen3-TTS/ASR are API-only and are NOT assumed runnable.
- **Warm worker**: mlx-audio's own server mode (`mlx_audio.server`) serves as
  its persistent process, under the same lifecycle contract as the Kokoro
  worker (lazy start, idle shutdown, crash restart, abort).
- **Settings**: appears only on Apple Silicon in the existing Settings → Voice
  engine list, with the install/upgrade control and curated model selector.

### Chains and failover

Config holds an **ordered preference chain** per direction, e.g.
TTS: `azure → kokoro-local → system-native`. The chain runner:

1. Skips engines whose `available()` fails (not installed / no key / wrong platform).
2. Tries engines in order; on error or timeout, advances to the next.
3. On failover, emits a **notice event** the renderer shows as an inline system
   line in the active chat ("⚠ Azure TTS unavailable — using Kokoro") and,
   optionally (config flag), a short spoken cue.
4. Local engines naturally sit last as the offline floor.
5. **Engine health (repeated-failure demotion).** Adapters map raw failures to
   a typed `EngineError` kind: `auth` (invalid key), `quota` (credits/free
   tier exhausted), `rate-limit`, `network`, `internal` (crash/bug). The
   runner keeps an in-memory health record per engine: persistent kinds
   (`auth`, `quota`) suspend immediately for 60 min (or until the engine's
   key/config changes); transient kinds suspend for 5 min after 3 consecutive
   failures. The user's configured order is never rewritten — health is an
   overlay producing the *effective* order, in which suspended engines drop
   to the bottom (tried as last resort, not removed). Success resets the
   record. Notices carry the reason ("Azure suspended 1 h: quota exceeded");
   Settings shows suspended engines with a manual reset.

### Cloud + community engines (Phase 4 adapters, interface fixed now)

Tier 1 (built by us, roughly in this order):

- **Azure Speech** — flagship cloud adapter; official free tier (0.5 M chars/mo
  TTS, 5 h/mo STT, key required). Streaming both directions.
- **OpenAI TTS/STT**, **ElevenLabs (TTS + Scribe STT)**, **Deepgram (STT +
  Aura TTS)**, **AssemblyAI (STT)** — all of these already have key patterns
  in the provider key store (AssemblyAI's `aai_` included), so the adapter is
  the only missing piece.
- **Groq** — hosted Whisper STT + PlayAI TTS; the popular cheap/fast tier.
- **Cartesia Sonic (TTS)** — the low-latency streaming leader; a natural fit
  for a streaming-first interface.
- **Google Cloud TTS/STT** and **Amazon Polly** — enterprise staples; adapters
  are straightforward once the interface exists.
- **Piper (`piper-local`, TTS)** — **pulled forward into Phase 1.** Lightweight
  ONNX, cross-platform, 30+ languages: the local answer to Kokoro's
  English-only limitation, slotting into chains as the multilingual local
  fallback ahead of System Native. Implemented via the same uv pattern as
  Kokoro (`uv run --with piper-tts`, the maintained PyPI package — no custom
  binaries); voices are ONNX+JSON pairs from the official voice repo,
  registered per-voice in the asset registry with pinned checksums and a
  curated per-language dropdown.
- **Edge TTS (`edge-community`)** — community adapter for the keyless Microsoft
  Edge endpoint. Shipped because this is an open-source project and it is
  useful, but: labelled “Community (unofficial)” in the UI, never included in
  default chains, and its failure mode is explicitly “may break without notice”
  (failover handles it). Implementation isolated so its removal is one file.

Everything else arrives as community adapters: the registry + interface is the
contribution surface, and an adapter touches no UI or chain code.

**Community channel:** Wayland's existing extension system
(`aion-extension.json` manifests, `ExtensionLoader`, `WAYLAND_EXTENSIONS_PATH`)
becomes the distribution mechanism for community engines once the
`TtsEngine`/`SttEngine` interface has survived Phase 1 unchanged: an extension
registers engines into the same registry and they pipe through the same two
chains with identical failover, local/cloud badges, and settings treatment.
Engine origin (in-repo vs extension) is invisible downstream. Tier-1 adapters
stay in-repo because they need CI, pinned versions, and the install UX.

### Local engine implementation playbook (the Kokoro lessons)

Every local engine (Piper next, then any community engine) follows this; each
item traces to a real failure found while fixing Kokoro:

1. **No fictional artifacts.** Prove the runtime end-to-end from a shell (the
   exact command the app will run) before wiring any UI. Kokoro shipped
   against a compiled binary that never existed.
2. **uv + Python package over custom binaries.** Platform-agnostic by
   construction; `uv run --with <pkg>` is the execution model.
3. **Flag parity.** Install pre-warm, status probe, and synthesis must use
   byte-identical uv flags, or they resolve different environments (Kokoro's
   `--prerelease=allow` mismatch re-downloaded packages at synth time).
4. **Verify dependencies exist.** Don't assume a package bundles its
   dependencies (Kokoro's script imported soundfile, which kokoro-onnx does
   not ship). Prefer stdlib output paths.
5. **Every required file is a registry asset** with a pinned sha256 — model,
   voices, configs. Kokoro originally registered the model but not the voice
   embeddings.
6. **Envelope errors only; config rides the request** (bridge swallows throws;
   main-side ConfigStorage.get hangs).
7. **Curated, validated choices in the UI** — voice/model dropdowns show only
   what the installed engine can use; stored defaults must be valid values
   (no `'default'` placeholder).
8. **Log at the bridge** (start/ok/failed + duration) — the voice path was
   undebuggable without it.
9. **Instrumented runtime verification before claiming done** — drive the real
   UI (Playwright) and observe playback events; unit tests alone passed while
   the feature was completely broken.

### Integration with existing provider infrastructure

The engine layer plugs into Wayland's existing provider plumbing; it does not
duplicate it:

- **Keys:** cloud engines read the existing provider key store via
  `available()` — no engine-specific key fields. ElevenLabs/Deepgram/AssemblyAI
  key patterns already exist; Azure/Groq/Cartesia patterns are added the same
  way. Pasting a key in providers settings lights the engine up in chain
  config automatically. `ProviderHintBanner` generalizes to registry-driven
  "you have a key for X — add it to your voice chain?".
- **Catalog:** cloud voice engines reference `PROVIDER_META` entries (the
  `voice` group) for branding/naming. The voice group becomes the exception to
  the no-local-entries catalog policy: keyless local engines (Kokoro, Piper,
  MLX, System Native) appear flagged `local`, because for voice they are the
  defaults.
- **Capabilities:** provider capability flags gain `tts`/`stt`, so one
  provider entry (e.g. OpenAI) powers chat models, STT, and TTS from one key.
- **Config:** `tools.textToSpeech` / `tools.speechToText` keys evolve in place
  to the chain schema via the existing normalize/migration pattern; the
  `TTS_CONFIG_CHANGED_EVENT` sync collapses into a single `useVoiceConfig`
  hook. Per-chat overrides ride `TChatConversation`.
- **Plan consequence:** Phase 0's first milestone is porting the existing six
  providers into registry adapters *in place* (service switch statements
  dissolve; settings render from the registry; no user-visible change), so
  chains, the warm worker, and everything later are purely additive.

### Constraints carried from the current codebase (hard-won this session)

- The vendored IPC bridge swallows provider rejections → **all providers return
  result envelopes**, never throw (`buildProvider` wrapper also guards app-wide).
- **Main-process code must never call `ConfigStorage.get`** (renderer-bridged;
  hangs forever). Voice config rides the request payload from the renderer, or
  lives in a main-side store.
- `strictNullChecks` is off → flat envelope types, no boolean-discriminated unions.
- Streaming main→renderer uses a chunk **emitter** (`voiceSynth.chunk` events
  carrying `{requestId, seq, data, mimeType, final}`); request/response stays on
  the existing envelope provider.

## Voice out (Phase 1)

- **Config:** `autoReadResponses` becomes the **system-wide default**
  (`tts.autoReadDefault`). Per-conversation override
  `voice: { speakReplies?: 'inherit' | 'on' | 'off' }` persisted on the
  conversation record (`TChatConversation`); absent = inherit.
- **Per-chat control:** speaker icon in the chat input row cycling
  inherit → on → off (tooltip shows effective state and source).
- **Trigger:** a renderer hook observes assistant turn completion; if the
  effective state is on, it extracts speakable text and plays it.
- **Speakable text:** prose only — markdown stripped, code blocks / tables /
  URLs skipped (silently). Listening to code being spelled out is noise.
- **Playback:** one shared renderer utility (Web Audio API) that queues chunks
  gaplessly, exposes `stop()`, and enforces a single active utterance app-wide.
  Interruption: a new user message, a new playback request, or the stop control
  stops current audio. (Voice barge-in arrives with Phase 3.)
- **Test voice** button reuses the same chain + playback path, so settings test
  exactly what chats do.
- **Migration:** `normalizeTextToSpeechConfig` maps v1 config
  (`provider/voice/speed/autoReadResponses`) → chain `[provider, 'system-native']`,
  per-engine settings, `autoReadDefault`. Old installs upgrade silently.

## Personalization: name and pronunciation

- **Profile fields:** `displayName` (shown in UI) and `spokenName` (phonetic
  respelling, e.g. "Mateo" → "muh-TAY-oh"). `spokenName` is never rendered
  anywhere except the settings field where it is edited — at synthesis time the
  speakable-text layer substitutes `displayName → spokenName` in all text sent
  to TTS. Text respelling is the primary store because it works on every
  engine; an IPA form derived from it (espeak) is attached via SSML
  `<phoneme>` only on engines that support SSML (e.g. Azure). Stored, never
  displayed.
- **Capture, two paths converging on the same value:**
  1. Type a respelling (settings, and the onboarding voice step).
  2. Say it: user pronounces their name; STT returns the closest spelling of
     what it heard (which is what a respelling is); user confirms or tweaks.
- **Re-detection:** Settings → Voice offers a "Re-detect pronunciation" action
  next to the spokenName field that re-runs the say-it capture at any time
  (e.g. after switching STT engine, or if the stored respelling never sat
  right). Runs the same capture + playback confirmation flow; the stored value
  is only replaced on accept.
- **Playback confirmation loop (required for both paths):** "This is how I'll
  say it" → current TTS chain speaks `spokenName` → accept or retry. Without
  this, stored pronunciations silently drift wrong per engine.
- **Call greeting (Phase 3):** when an open-voice session starts, Wayland
  speaks a varied greeting — rotating templates, time-of-day aware ("Morning,
  Matt", "Hey Matt — what are we working on?") — using `spokenName`.
- **Phasing:** profile fields, settings UI, substitution, and the playback
  confirm land in **Phase 1** (auto-read benefits immediately); the greeting
  itself lands with **Phase 3** (calls).

## Onboarding: voice setup step (Phase 1)

A new step in the app setup flow — "Configure voice":

- Pick how you want to talk and be answered (the two axes; defaults
  pre-selected: type + text).
- **Kokoro recommended** as the TTS engine: one-click install reusing the
  existing 3-step download/install flow with its progress UI; System Native
  offered as the zero-download alternative; skippable entirely.
- Optional name pronunciation capture (type or say it, with the playback
  confirmation loop).
- Everything in the step is revisitable later under Settings → Voice; skipping
  configures nothing and leaves the current defaults.

## Voice in (Phase 2 — spec outline)

Push-to-talk in the chat input: hold (or tap-toggle) mic → record → STT chain →
transcript into the input (auto-send configurable). Input-mode per-chat override
icon next to the speaker icon. Existing STT engines via the new interface.

## Open voice mode (Phase 3) — decided

Hands-free "call mode": continuous listening, the assistant speaks replies, you
talk back, with these decisions locked in:

- **Full barge-in (now, not deferred).** Your voice interrupts the assistant
  mid-sentence: when VAD detects user speech during TTS playback, immediately
  `stopVoicePlayback()` and `ipcBridge.conversation.stop()` the in-flight turn.
  Echo is handled by the browser's native acoustic echo cancellation
  (`getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true,
  autoGainControl: true } })`) so the mic doesn't trip on the app's own output
  through the speakers. (If speaker bleed still false-triggers on some hardware,
  gate barge-in on an energy threshold above the measured playback floor.)
- **Adaptive noise gate + voice-tweakable sensitivity.** The VAD energy gate
  (what counts as speech vs. ambient noise) is not a fixed constant: a noise-
  floor tracker continuously measures the ambient RMS during non-speech windows
  and sets the start/end thresholds to `floor + margin` live, so a noisy room
  (car, café) self-calibrates rather than false-triggering barge-in/auto-send.
  Barge-in is also gated on energy above the measured floor (this doubles as the
  AEC speaker-bleed fallback). On top of the auto-calibration, the user can nudge
  it by voice — "it's noisy / you keep picking up background noise / too
  sensitive" widens the margin (less sensitive); "you're not hearing me" narrows
  it — as a per-conversation override (settings default + per-chat), mirroring
  the silence-gap tuning. `getUserMedia`'s `noiseSuppression` helps at the audio
  layer but does not replace the adaptive gate.
- **Auto-send on silence, with an adjustable threshold.** VAD detects the end of
  your turn (a configurable silence gap, default ~1.2 s) and sends
  automatically — true hands-free. The threshold is a **settings default** AND a
  **per-conversation override**, and — critically — the user can change the
  per-conversation value *by voice*: a lightweight local intent matcher on each
  transcribed utterance recognises "wait longer / give me a sec / don't cut me
  off / stop interrupting" (and the inverse "you can go quicker") and bumps the
  conversation's silence threshold up/down a step, with a spoken/inline
  confirmation. No round-trip to the model required; it adjusts on the fly.
- **Live overlay from a mic-mode toggle.** A mic-mode control sits next to the
  per-chat speaker toggle; switching to "open voice" puts the conversation into
  a visually distinct **live state** (listening/speaking waveform indicator,
  current-threshold readout, end-call button). The transcript still fills the
  chat as text underneath — call mode is a layer over the normal conversation,
  not a separate screen.
- **Time-of-day greeting on call start** using `spokenName` (rotating templates:
  "Morning, Matt — what are we working on?").

**Text is never gated by voice (hard guarantee, applies app-wide).** The
assistant's text streams into the chat in real time, completely independent of
TTS: synthesis runs in the warm worker and auto-read consumes the *completed*
text without touching the render path. So the user can read ahead — scroll
through the full reply — while audio is still playing, and a slow/long TTS
playback never delays the text response. In call mode the same holds: the
transcript appears as fast as the model streams it; voice trails alongside.

Everything this needs from earlier phases is already in place: streaming STT
capture + VAD scaffolding (useSpeechInput's AnalyserNode), abort signals,
single-utterance playback with `stopVoicePlayback`, `conversation.stop`,
auto-read, and `autoSend`. Phase 3 assembles them into the continuous loop plus
the barge-in/VAD/threshold-adjustment logic and the live overlay.

## Cross-cutting decisions

- **Privacy.** Engines are badged **Local** / **Cloud** everywhere they appear;
  a cloud TTS chain sends every assistant response to that provider, and cloud
  STT sends the user's voice. A global **"local engines only"** switch filters
  all chains (and the registry honours it in `available()`). Name-pronunciation
  recordings are transcribed and **discarded** — only the text respelling (and
  derived IPA) is ever stored.
- **Audio event scoping.** The bridge adapter broadcasts emitter events to all
  windows and all WebSocket (WebUI) clients. Every chunk stream carries a
  `requestId`, and playback consumers ignore streams they did not request —
  otherwise WebUI clients receive (and speak) audio requested by the desktop.
- **Concurrency policy.** Auto-read speaks only the **focused conversation's**
  completed reply. Replies finishing in unfocused chats stay text-only — no
  queue of stale speech. One active utterance app-wide (already in the playback
  util contract).
- **Stop affordance.** While speaking: a stop control on the message being
  read, a "now speaking" highlight on that message, and a global hotkey
  (default Esc while chat focused) that stops playback immediately.
- **Language.** Kokoro is English-only. The speakable-text step does a cheap
  language check; non-English text routes to the first chain engine that can
  speak it (System Native covers most locales) or is skipped with a notice —
  never read gibberish through an English-only engine.
- **Transport budget.** Chunks cross IPC as bounded base64 frames (well under
  the adapter's 50 MB cap); the current whole-clip `number[]` serialization
  (~5-10× byte size in JSON) is retired in Phase 0.
- **Long messages.** Read-aloud caps at ~2 minutes of audio (configurable),
  ending with a spoken "…continued in chat."
- **Resources.** The warm worker pins ~400 MB RAM while alive; Settings labels
  the trade-off ("keeps the voice model loaded for instant replies") next to
  the idle-shutdown behaviour. Phase 2/3 require mic entitlements
  (`NSMicrophoneUsageDescription`) wired into packaging, and the worker script
  must be included in packaged resources (verify in the packaged e2e lane).
- **Channels.** Replies routed to messaging channels (Telegram, Slack, …) never
  auto-read in the desktop app; voice applies to in-app conversations only.

Deferred (revisit with Phase 3): audio-device handoff mid-playback (Bluetooth
disconnect), ducking other system audio, VoiceOver/screen-reader double-speak
interplay, read-along streaming of in-progress responses.

## Error handling

- Engine errors → envelope `{ ok: false, error }` → chain advances → notice line
  in chat. Chain exhausted → error toast + notice; auto-read silently gives up
  for that message (text is always there).
- Worker crash → restart + failover for the in-flight request.
- All synthesis/transcription requests carry `AbortSignal`; provider switch,
  stop, or chat navigation aborts in-flight work (request-token pattern already
  in the Test voice handler generalises into the playback util).

## Testing

- Unit: chain runner (ordering, skip-unavailable, failover, exhaustion),
  speakable-text extraction, config migration, worker protocol framing
  (runtime-seam fakes as today).
- E2E (Playwright, extends `voice-tts-verify.e2e.ts`): auto-read fires on a
  completed reply with default on; per-chat off suppresses it; per-chat on
  overrides default off; failover notice appears when the first engine is
  broken; warm second synthesis is materially faster than the first.

## Out of scope

Phase 2–4 implementation; voice cloning; reading historical messages in bulk;
per-chat engine selection; mobile.
