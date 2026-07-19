# Voice Conversation Mode

Status: product/architecture packet added 2026-07-16; V0 truth repair and the
first production V1 turn-voice vertical are implemented and locally proven.
This is deliberately **turn-based voice**, not streaming, VAD/barge-in, or
full-duplex parity.

Interactive prototype:
`.planning/desktop-overhaul/mockups/voice-mode/index.html`

## Executive decision

Wayland will support two presentations of the same canonical conversation:

1. **Chat** — the normal written thread and composer.
2. **Voice** — a focused, interruptible conversation surface over that same chat, Project, agent, model, workspace, authority, tools, plan, outputs, and receipts.

Voice is not a separate assistant, conversation store, permission mode, or simplified engine. Entering or leaving it never forks the thread. The full transcript, tool activity, approvals, outputs, and costs remain available in Chat and the adaptive mission rail.

## Current source truth

Wayland already owns useful pieces:

- renderer microphone capture, waveform feedback, file/audio transcription, and optional auto-send;
- STT adapters for OpenAI, Deepgram, local Whisper, and Flux Voice;
- a main-process synthesis bridge that now returns an explicit success/failure value;
- local Kokoro and macOS system-native TTS implementations;
- Voice settings, microphone checks, model asset acquisition, and microphone permission handling.

The first coherent turn-voice journey now exists:

- a distinct composer control opens Voice without replacing the existing dictation microphone;
- the production renderer captures, transcribes, submits through the canonical backend send path, observes the canonical response stream, invokes `voiceSynth.speak`, and plays the returned audio;
- a deterministic session state machine joins capture, turn submission, response settlement, synthesis, playback, interruption, and recovery;
- Voice and Chat use the same conversation identity and no separate message store;
- response extraction excludes tool, reasoning, plan, approval, cost, usage, and error payloads from spoken text;
- macOS system speech and authenticated OpenAI speech are real production synthesis paths;
- Kokoro is disabled in settings and fails closed until Wayland ships a real compatible runtime rather than the previous nonexistent CLI contract.

It does **not** yet own the complete target journey:

- no barge-in/voice-activity detection contract exists;
- legacy unsupported `grok` or unknown synthesis values normalize to the actual default instead of reaching the runtime;
- the non-macOS system-native path now returns a typed unavailable result through a bridge that always settles;
- the settings test now calls the selected Wayland synthesis provider and plays its returned bytes instead of testing unrelated browser `speechSynthesis`;
- `voiceSynth.stop` owns no process-side synthesis/playback state and cannot prove cancellation;
- Flux Voice is currently an STT path, not evidence of provider-neutral full-duplex or TTS parity;
- plan, output, activity, approval, cost, and receipt projections are not yet composed into the focused Voice surface;
- no privacy, retention, hosted-cost, latency, or reconnect receipt is presented at the voice surface.

These are product gaps, not visual polish.

## Interaction contract

### Entry and continuity

- A voice button in the canonical composer enters Voice for the current or new chat.
- The user can select a voice before entry or from the active surface without leaving the conversation.
- Leaving Voice returns to the exact thread position with the complete transcript and active work intact.
- Deep work may open Voice with the mission rail collapsed; outputs, approvals, blockers, or an explicit user action reveal the same rail used by Chat.

### Honest state model

The surface has explicit states: `connecting`, `listening`, `user-speaking`, `transcribing`, `thinking`, `acting`, `approval-needed`, `speaking`, `interrupted`, `reconnecting`, `error`, and `ended`.

The central Wayland form is a legible state indicator, not decorative ambience:

- listening responds to input level;
- thinking is calm and non-vocal;
- acting exposes the current meaningful step and never implies the model is merely thinking;
- speaking follows output amplitude;
- approval-needed stops conversational momentum and presents the exact consequential action;
- error/reconnecting uses text, icon, and motion changes rather than color alone.

Persistent controls: end, mute/unmute, interrupt/stop, captions/transcript, voice selection, and return to Chat. Escape stops speech first and never silently ends or approves work.

### Conversation behavior

- Barge-in stops playback immediately, preserves already-heard/produced transcript boundaries, and starts a new user turn only after an explicit speech boundary.
- Quick answers remain visually quiet. Multi-step work exposes the current plan step, material activity, outputs, and needs-you state through the existing correlated execution model.
- Tool and agent chatter is summarized into meaningful spoken milestones. Raw logs remain inspectable but are not read aloud.
- The user may say “show me”, “open the output”, or “switch to chat”; visual work transitions naturally to the Workbench without creating a new task.
- Provider/model/agent replacement follows the same declared handoff boundary as Chat. A voice change is presentation only; an agent/model change is an execution change and is disclosed.

### Authority, privacy, and cost

- Voice never widens workspace, tool, network, purchase, publication, or external-action authority.
- Consequential approvals are visual and keyboard accessible. Spoken confirmation may supplement but cannot replace the canonical approval receipt unless a separately threat-modeled voice-auth contract is accepted.
- The surface always distinguishes local capture/synthesis from hosted audio processing before the microphone stream crosses a network boundary.
- Raw microphone audio is ephemeral by default. Any retention, diagnostic upload, or provider retention policy is explicit and separately consented.
- Hosted STT/TTS price basis and active provider are inspectable. Missing cost remains unknown, never free.

## Provider-neutral architecture

Add a `VoiceSession` orchestration layer over the universal work kernel, not over a provider SDK:

- `SpeechInputAdapter`: capabilities for batch/streaming transcription, partials, language, VAD, cancellation, and local/hosted boundary;
- `SpeechOutputAdapter`: voices, batch/streaming synthesis, formats, first-audio latency, cancellation acknowledgement, and local/hosted boundary;
- `VoiceTurnCoordinator`: state machine, turn correlation, transcript boundaries, response segmentation, barge-in, reconnect, and fail-closed settlement;
- `VoicePresentation`: focused surface plus compact mission-rail projection using canonical conversation/run selectors;
- `VoiceReceipt`: provider/model/voice, local-or-hosted classification, correlation IDs, latency, bytes/duration, cancellation, terminal state, and authoritative cost when supplied.

Capability negotiation selects the best available path without lying:

- **Turn voice:** current record → transcribe → send → synthesize pipeline; suitable as the first vertical.
- **Streaming voice:** partial transcription and incremental synthesis with proven cancellation.
- **Full duplex:** simultaneous input/output and server-side turn detection only where a provider contract proves it.

The UI names the achieved capability. A turn-based adapter is never presented as full duplex.

## Delivery packet — M5V

M5V composes with M2 universal-kernel state, M5 conversation truth, M6 authority/receipts, M1F cost evidence, and M8 packaged/accessibility gates. It emits two ordered receipts rather than making M5V and M8 depend circularly on one another:

- **M5V-A functional receipt:** V0–V3 behavior, authority, transcript continuity,
  interruption, recovery, and deterministic provider-neutral adapter proof. This
  is the Wave 3 receipt and the M8 entry gate whenever Voice is included.
- **M5V-B packaged receipt:** V4 packaged audio, accessibility, privacy,
  performance, and provider-canary evidence. M8 produces this aggregate receipt;
  M9 and every Voice release/parity claim require it.

1. **V0 — truth repair:** remove the unsupported hosted-provider cast, return typed unavailable errors, inventory actual voices, and wire synthesis to a bounded test surface.
2. **V1 — turn voice vertical:** enter from composer, use the same chat, capture/transcribe/send/synthesize/play, interrupt, return to Chat, and preserve transcript. Ship no full-duplex claim.
3. **V2 — adaptive work:** connect plan/activity/output/approval state, concise spoken milestones, Workbench transition, and recovery.
4. **V3 — streaming adapters:** provider-neutral partials, incremental audio, barge-in, latency/cost receipts, and reconnect semantics.
5. **V4 — packaged acceptance (M5V-B inside M8):** macOS/Windows/Linux microphone/output-device journeys, keyboard/screen-reader/reduced-motion proof, privacy/cost disclosure, long-session performance, and provider canaries separate from deterministic gates.

Design/prototype work may run in parallel. Runtime integration does not bypass M0A/M2/M5/M6 entry gates.

### V0/V1 implementation receipt

- Unsupported hosted-provider persistence paths deleted; supported providers are `system-native`, `openai`, and fail-closed `kokoro-local`.
- Runtime normalization clamps speed and bounds voice/model identifiers.
- Non-mac system-native synthesis fails with `TTS_SYSTEM_NATIVE_UNAVAILABLE`.
- OpenAI speech uses the connected provider credential, official speech endpoint, bounded input, selected official voice/model/speed, and typed not-configured/auth/rate/request failures.
- Kokoro's previous false executable acquisition was removed; the unavailable production runtime is disclosed and cannot claim readiness.
- Main-process bridge catches every provider/config/synthesis failure and returns a public closed error code, so renderer IPC cannot remain pending.
- Settings “Test voice” persists the visible config, invokes `voiceSynth.speak`, and plays only the returned provider audio.
- A separate waveform control opens Voice while the microphone retains dictation semantics.
- Voice submits through the existing backend send box for WCore, ACP/Codex, Gemini, OpenClaw, Nanobot, and Remote conversations.
- Capture cancellation cannot submit discarded audio; a conversation-scoped open event cannot activate the wrong chat.
- The full-screen surface exposes honest state, captions, mute, stop/interrupt, return-to-Chat, voice selection, and safe recoverable errors.
- Focused proof on 2026-07-16: 10 suites / 122 tests; full TypeScript passed; targeted lint reported zero warnings/errors; formatting and diff whitespace checks passed.

V1 is not V2/V3. It does not claim streaming audio, automatic speech-boundary
detection, true barge-in, full duplex, adaptive mission-rail composition,
authoritative voice cost receipts, or packaged cross-platform acceptance.

## Mandatory journeys

- Start a new Voice chat, ask a question, interrupt the answer, continue in Chat, then return to Voice without duplicate turns.
- Open Voice inside a Project and prove the same shared context and workspace boundary.
- Run a multi-step knowledge-work task; hear meaningful progress, inspect the plan/output, approve or deny a consequential action visually, and continue speaking.
- Run a developer task; transition from voice to Changes/Terminal/Tests and back without losing the run.
- Switch voice only and prove the agent/model/task does not change.
- Replace agent/model at a checkpoint and disclose preserved/lost state.
- Lose microphone, output device, network, STT, TTS, or backend mid-turn and settle to an honest recoverable state.
- Prove local-only mode emits no hosted audio request; prove hosted mode discloses provider and cost boundary before capture.

## Release gates

- deterministic state-machine and cancellation race corpus;
- no duplicate send, speech, tool action, or approval after barge-in/reconnect;
- transcript and execution event IDs agree with Chat and the mission rail;
- voice selection never mutates agent/model/authority;
- typed failure for unavailable or unsupported provider/voice combinations;
- zero raw audio in logs, crash reports, analytics, or retained state by default;
- WCAG AA controls/captions, complete keyboard operation, reduced motion, and screen-reader state announcements;
- packaged audio input/output proof on every supported target before parity claims.
