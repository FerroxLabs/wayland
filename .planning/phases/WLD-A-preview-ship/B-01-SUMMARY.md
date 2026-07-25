---
phase: WLD-A-preview-ship
plan: B-01
status: built-pending-live-click
completed: 2026-07-22
---

# B-01 — VOC-03 hosted-voice consent follow-ups

## What shipped

- **Reactive re-consent affordance.** `useHostedVoiceConsent` now exposes `needsConsent(provider)` — true only when the current provider is hosted AND unconsented. The TTS + STT provider selectors render an inline "This provider processes audio and text off your device. [Review consent]" affordance that opens the disclosure via `ensureConsent`. Fixes the switch-away-and-back trap for an existing hosted-but-unconsented user (re-selecting the current Select value fires no `onChange`).
- **Friendly error guidance.** Shared `hostedVoiceConsentErrorGuidance(code)` maps `TTS_/STT_HOSTED_CONSENT_REQUIRED` (bare or verbose `CODE: msg` form) to "Open Voice settings and accept the disclosure…". Wired into the TTS test handler.

## Fail-closed integrity (audited)

Independent audit = ACCEPT-WITH-FIXES; **fail-closed property PRESERVED** — the affordance is render-gating only; the authoritative gate stays in `voiceSynthBridge`/`SpeechToTextService` (untouched). Consent granted only via the modal `onOk`.

## Audit fixes applied

- **Initial-render flash (LOW, real):** added a `loaded` flag so the affordance never shows before the async consent read resolves (an already-consented user no longer sees a flicker).
- Hardened the guidance helper to normalize the verbose STT `CODE: message` form.

## Tests

`tests/unit/renderer/voice/useHostedVoiceConsent.dom.test.tsx` (10): reactivity via the changed-event, partial-consent (deepgram still needs consent when only openai accepted), flash-suppression, local-provider negatives (system-native/whisper-local/kokoro-local), `ensureConsent` local+consented resolve vs hosted-unconsented pending, verbose STT code mapping. Full suite green.

## Not done (deferred)

- **Live-click the modal with Sean** — a live-test step, pending the packaged/dev sweep together.
- STT friendly-error surfacing on the voice-conversation surface (helper is shared and ready; the STT settings recovery is covered by the affordance).
