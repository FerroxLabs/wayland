---
phase: WLD-A-preview-ship
plan: B-01
type: execute
wave: B
depends_on: []
files_modified:
  - src/renderer/hooks/voice/useHostedVoiceConsent.tsx
  - src/renderer/components/settings/SettingsModal/contents/ToolsModalContent.tsx
  - src/renderer (voice error surfacing + i18n)
autonomous: true
blocking: true
---

<objective>
Close the VOC-03 hosted-voice-consent follow-ups so the fail-closed gate is also usable, then
live-click the disclosure with Sean.
</objective>

<tasks>
- Inline "Review hosted-voice consent" affordance in Voice settings when the current provider is hosted + unconsented (today the only recovery is switch-away-and-back, because Arco Select fires no onChange on re-selecting the current value). Fails MORE closed today, but non-obvious.
- Friendlier surfacing for `TTS_HOSTED_CONSENT_REQUIRED` / `STT_HOSTED_CONSENT_REQUIRED` → "accept the disclosure in Voice settings" guidance + i18n (currently raw codes).
- Live-click the consent modal in a sweep with Sean; confirm copy reads right.
</tasks>

<verification>
Existing hosted-provider user can reach the disclosure without switch-away-and-back; error copy is human; unit + full suite green; modal live-clicked.
</verification>

<success_criteria>
Hosted voice stays fail-closed AND is recoverable/legible for a real user.
</success_criteria>

<output>Write B-01-SUMMARY.md with the affordance + live-click evidence.</output>
