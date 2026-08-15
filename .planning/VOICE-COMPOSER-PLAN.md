# Voice in the composer — final build plan (post cross-audit)

Worktree: `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution` (branch `packet/attribution-audit`)
Baseline: HEAD `af3c17e1b`, 16,450 tests / 0 failed. Planning only — no source file modified.
Supersedes the draft of the same name. Four adversarial audits (feasibility / UX / privacy / testability) folded in; every finding is either applied or explicitly rejected in §Rejected, with reasoning.

Every file:line below was read in this worktree at this HEAD. Measurements name their negative control.

---

## SUMMARY

1. **What.** Lift the voice session out of the full-screen orb into a hook + provider so the composer becomes the voice surface: status, stop, mute, glow, one entry point — and make Wayland speak sentence-by-sentence instead of after the whole answer.
2. **Why it is one job.** `VoiceConversationMode.tsx` (764 lines) _is_ the session today, so the composer cannot show voice state and workflow-mode surfaces have a dead soundwave button.
3. **Critical path.** V1→V2→V3→**V4**→V5→V6→V7→V8→V9→V10→V11→V12→V13→V14→V15→V16→V17→V18→V19→V20→V21→V22.
4. **V4 is the gate.** Nothing in Phase 2 or 3 starts before the hook + provider lands as a behaviour-neutral move.
5. **V8 is a hidden gate.** The Arco Button mock in `sendboxQueue.dom.test.tsx` drops `aria-label`; until it forwards, every accessible-name assertion in Phase 2 tests the mock, not the app.
6. **Ceiling stated honestly.** No byte-level streaming TTS is possible — `say` needs a seekable sink. We ship sentence-chunked synthesis with gapless Web Audio scheduling, and we say that, not "streaming".
7. **RISK 1 — the seam.** Two independently synthesised `say` clips have different prosody contours. No unit test can tell you they sound like one speaker. If ears say no, V19–V22 are wasted and the two-chunk fallback ships. Prove it before writing the queue (H3).
8. **RISK 2 — Web Audio silent failure.** A suspended `AudioContext` schedules against a stopped clock: no error, no `onended`, no `playback_completed`. That is the exact bug this plan exists to fix, arriving through a different door. V21 exists solely to close it.
9. **RISK 3 — background hot mic.** The orb was modal and every exit was a hard mic-off. A composer surface is not modal, the mic auto-re-arms 350 ms after every reply, and turns auto-send. Every stop affordance the orb provided must be re-provided in the composer or we ship a background microphone.
10. **Blast radius.** Two shared files carry real risk: `src/renderer/components/chat/sendbox.tsx` (every conversation surface) and `.../ChatLayout/index.tsx` (provider mount, also rendered by `TeamPage`). Everything else is voice-only or new.

---

## 0. Architecture, and the defects the lift fixes

**The move.** Lift the session out of the full-screen component into a hook + provider mounted once per conversation surface. After the lift: the composer renders status/stop/mute/glow; the orb becomes an optional _view_ of a session that already exists; there is one entry point; the synthesis pipeline has one owner.

**Verified defect A — workflow mode dead button.** `VoiceConversationMode` mounts inside `headerBlock` (`src/renderer/pages/conversation/components/ChatLayout/index.tsx:274`, itself gated on `{conversationId && …}` at `:273`), and the header renders only when `!props.hideHeader` (`:331`). Three call sites pass `hideHeader={true}` (`ChatConversation.tsx:308, 367, 637`). There, the composer soundwave dispatches `wayland:voice-mode-open` (`voiceTurnBridge.ts:34`) into a void. The provider must wrap the whole `ChatLayout` return (`:318`), not the header.

**Verified defect B — two entry points, near-identical names.** Header button and composer button both `aria-label='Start Voice conversation'` (`VoiceModeEntryButton.tsx:22`, used at both placements). The dictation mic is `aria-label={t('conversation.chat.speech.recordTooltip')}` = **"Start voice input"** (`src/renderer/services/i18n/locales/en-US/conversation.json:252`). Three 17–18 px monochrome line icons in one row, two of which read almost identically to a screen reader.

**Verified defect C — Nanobot ships the single-line row.** `/usr/bin/grep -rn "defaultMultiLine" src/` returns five wrapper hits — Gemini:460, OpenClaw:646, WCore:572, Acp:417, Remote:470 — plus the prop declaration/default/state at `sendbox.tsx:170, 194, 211`. **`NanobotSendBox.tsx` (SendBox at `:418`) passes neither `defaultMultiLine` nor `lockMultiLine`**, so `isSingleLine` initialises `true` there and the row at `sendbox.tsx:1652-1669` is live for real users. The draft claimed all six wrappers force multi-line; that was wrong. V9 is not cleanup — it is what stops Nanobot silently missing every voice affordance.

**Verified defect D — TeamPage renders one `ChatLayout` over many conversations.** `TeamPage.tsx:555` passes a single `conversationId`; `TeamChatView.tsx` renders a SendBox per agent, each with its own conversation id. A naively-scoped provider gives N-1 composers the wrong status and a Stop that interrupts someone else's session. `sendbox.tsx:208` already has `useConversationContextSafe()`, so the fix is cheap and mandatory.

---

# PHASE 0 — tell the truth about readiness

### V1 — MUST — Flip the TTS default (was S1)

**Files.** `src/common/types/ttsTypes.ts:23` — `enabled: false` → `enabled: true`.

**Migration reach, corrected (feasibility #8, accepted).** `normalizeTextToSpeechConfig:36` reads `typeof config?.enabled === 'boolean' ? config.enabled : DEFAULT`, so an explicitly stored `false` survives. Both writers persist the **whole object**: `VoiceSettings/index.tsx:65-73` (`handleTtsChange` writes `next` on _any_ field change — voice, speed, provider, auto-read) and `ToolsModalContent.tsx:298` (`await ConfigStorage.set('tools.textToSpeech', config)` inside `handleTestVoice`, i.e. pressing **Test voice** persists the whole config as a side effect). Exact wording for release notes and for anyone reading this plan: **the flip fixes users who never touched _any_ TTS field and never pressed Test voice.** It does not fix users who did. Those users are handled by V2's `disabled-by-user` reason plus V10's one-tap route, **not** by a data migration (see §Rejected R1).

**Leak argument (holds).** `autoReadResponses` has zero runtime consumers — `/usr/bin/grep -rn "autoReadResponses" src/` returns only the type (`ttsTypes.ts:18`), the default (`:27`), the normalizer (`:46-47`), and the inert Switch (`ToolsModalContent.tsx:434`). `voiceSynthBridge.ts:51-66` never reads `config.enabled`. Default-true cannot produce unprompted audio.

**Test.** `tests/unit/process/services/voice/textToSpeech.test.ts` (exists — control: the same `find` located `tests/unit/sendboxQueue.dom.test.tsx`, a known positive): (a) absent config → `enabled === true`; (b) stored `{enabled:false}` → stays `false`; (c) `autoReadResponses` default still `false`.
**The assertion that actually matters is in V4's suite, not here** — see V4 test (d).

---

### V2 — MUST — `resolveVoiceSessionReadiness`: both legs, named reasons (was S2; privacy #3, UX #8, feasibility #3)

**Files.** New `src/common/voice/voiceReadiness.ts`:

```
resolveVoiceSessionReadiness({ ttsConfig, sttConfig, platform, consent, audioContextState })
  → { ready: boolean;
      reason: 'ok' | 'tts-disabled-by-user' | 'no-local-adapter' | 'kokoro-unavailable'
            | 'tts-needs-consent' | 'stt-disabled' | 'stt-unavailable' | 'stt-needs-consent'
            | 'audio-blocked';
      ttsProvider: string; sttProvider: string }
```

Replaces the inline boolean at `VoiceConversationMode.tsx:274`.

**Why both legs (privacy #3, accepted).** The draft gated entry on TTS only. On macOS after V1 the default TTS path is ready and silent, so a user enters, sees no disclosure, and the session immediately begins _continuous auto-re-arming_ microphone capture routed to `openai` / `deepgram` / Flux-seeded `flux-voice`. Nothing leaks unconsented — `SpeechToTextService.ts:478-485` holds — but an unbounded continuous stream would be riding a one-shot dictation acknowledgement, and the entry flow would disclose the quieter leg while staying silent on the louder one.

**Why STT readiness at all (UX #8, accepted).** `DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled = false` (`ToolsModalContent.tsx:43-45`), so conversation mode is a day-one dead end for the default user. Today the failure surfaces at `beginCapture` (`VoiceConversationMode.tsx:277-280`) as a `surfaceError` **only the orb renders** (`:702-706`). Collapsed, the user gets nothing.

**Facts encoded.** `kokoro-local` always throws (`src/process/services/voice/KokoroLocal.ts:53` `resolveBinary: () => null`, `:90`); `system-native` throws off `darwin` (`TextToSpeechService.ts:123`); `openai` needs consent (`voiceSynthBridge.ts:57-62`); `audio-blocked` comes from V21.

**Naive failure.** A bare boolean. The _reason_ is what the composer needs to offer a one-tap fix; a boolean produces "Voice setup is incomplete" with no route out.

**Test.** New `tests/unit/common/voiceReadiness.test.ts`, a table over platform × ttsProvider × sttProvider × enabled × consent × audioContextState.
**Control:** the `darwin / system-native / whisper-local / both enabled / running` row must be `ready: true`. A table where every row is `false` proves nothing.

---

### V3 — MUST — Surface `flux-voice` in STT settings (was S16, **promoted from SHOULD** per privacy #3)

**Files.** `src/renderer/components/settings/SettingsModal/contents/ToolsModalContent.tsx:564-570` — the provider select offers exactly `openai`, `deepgram`, `whisper-local` (read at this HEAD). Add `flux-voice`, and make the consent affordance at `:571` offer consent for the **resolved** provider.

**The defect.** `resolveFluxSttDefault` (`src/process/utils/fluxSttDefault.ts:37-59`, called at `SpeechToTextService.ts:221-231`) returns a `flux-voice` config when a Flux key exists and STT was never explicitly configured. Settings still displays OpenAI. So the user is told to accept a disclosure they cannot reach, and dictation is permanently broken. Fail-closed, so nothing leaks.

**Why this sequences before V5 (privacy #3, accepted — but see §Rejected R2 for the cheaper mechanism).** Once settings shows the truth, the renderer's view of the STT provider equals main's resolved view, and V5 can consent on it without a new IPC round-trip.

**Do not** fix it by exempting `flux-voice` from the gate.

**Test.** `tests/unit/process/bridge/speechToTextService.test.ts` — a seeded Flux user who grants consent via the settings affordance gets a passing request. **Control:** without granting, `STT_HOSTED_CONSENT_REQUIRED`.
Plus, new in `tests/unit/renderer/voice/`: for a seeded-Flux config, the provider the **renderer** would consent to equals the provider `resolveSpeechToTextConfig` resolves. This is the assertion that keeps R2's cheaper mechanism honest.

---

# PHASE 1 — the session becomes shared state

### V4 — MUST — Extract the session into a hook + provider (was S4; + testability #4, #5, privacy #4, #5)

**Files.**

- New `src/renderer/hooks/voice/useVoiceConversationSession.ts` — `VoiceConversationMode.tsx:90-615` moved essentially verbatim, minus JSX.
  Returns `{ state, isActive, isExpanded, readiness, conversationId, lastTranscript, lastResponse, error, level, isMuted, begin, beginCapture, finishCapture, end, interrupt, toggleMute, expand, collapse }`.
  **`beginCapture` and `finishCapture` and `toggleMute` are in the API** — the draft omitted them and V6/V11 cannot exist without them (UX #1, privacy #2).
- New `src/renderer/pages/conversation/voice/VoiceSessionContext.tsx` — `VoiceSessionProvider` + `useVoiceSessionSafe()` returning `null` outside a provider (mirrors `useConversationContextSafe`, `sendbox.tsx:208`).
- `src/renderer/pages/conversation/components/ChatLayout/index.tsx` — wrap the whole `return (` at `:318`. Not `headerBlock`. Note the mount inherits the `{conversationId && …}` gate at `:273`.
- `src/renderer/pages/conversation/voice/VoiceConversationMode.tsx` — becomes presentational, reads context, renders only when `isExpanded`, and **stops rendering `VoiceModeEntryButton placement='header'` at `:758`**.

**Four things the extraction must get right that the draft got wrong or omitted:**

**(a) Strip `useNavigate` (testability #4, accepted).** `VoiceConversationMode.tsx:22` imports it and `:90` calls it. Today that is shielded because the component only mounts inside `headerBlock`, which `hideHeader` skips. `ChatLayout` itself already knows it renders outside a Router — `:102` calls `useInRouterContext()` and `:325` gates `RouterWorkbenchRequestBridge` on it. Wrapping the whole return removes the shield, and react-router throws a hard invariant, not a soft failure. **The hook takes an `onOpenVoiceSettings: () => void` callback; the presentational orb keeps `useNavigate` because it only mounts inside the Router-safe tree.**

**(b) The provider renders `consentModal` (privacy #4, feasibility #6, accepted).** `useHostedVoiceConsent` returns `{ ensureConsent, needsConsent, consentModal }` (read at `useHostedVoiceConsent.tsx:144`). `ensureConsent` resolves via `new Promise(resolve => setPending({provider, resolve}))` (`:83`) and `settle` only runs from the Modal's `onOk`/`onCancel` (`:113-114`). A hook cannot render. If the provider does not render `consentModal`, `await ensureConsent(...)` **never resolves** — silent dead entry, and the obvious wrong repair is deleting the await.

**(c) Conversation scoping (testability #5, accepted — this is a MUST, not a nicety).** `useVoiceSessionSafe()` returns `null` unless `session.conversationId === useConversationContextSafe()?.conversationId`. Without it, TeamPage's N composers all read one session.

**(d) End the session on `conversationId` change (privacy #5, accepted).** All 18 `conversationId` sites in `VoiceConversationMode.tsx` _filter_ by it; none ends the session when it changes. Today the modal orb (`role='dialog' aria-modal='true'`, `:749`) masks this. After the lift the user is back in the normal UI with a hot mic and a sidebar; `submitVoiceTurn({ conversationId, ... })` (`:239`) keeps the stale id and files spoken words into the conversation they navigated away from.

**Preserve without "improving":** the ref-per-render layout effect (`:563-569`), the re-check-on-fire capture timer (`:135-150`), the deliberate no-op effect switch with the `never` drift guard (`:170-194`), and the documented reason each effect is a no-op (`:152-169`).

**Naive failures.** (1) Mounting per SendBox — six wrappers means six sessions and six mic opens. (2) Mounting inside `headerBlock` — stays dead in workflow mode. (3) Rewriting the state machine while moving it. Move first, in one commit that changes no behaviour.

**Tests.**

- New `tests/unit/renderer/conversation/voiceSessionProvider.dom.test.tsx`: render `ChatLayout` with `hideHeader` and assert `wayland:voice-mode-open` still starts a session. **Write it failing first — it fails at HEAD.** **Control:** same assertion with `hideHeader={false}` must also pass.
- Mount the provider with **no Router** — must not throw. **Control:** the same mount inside `MemoryRouter` passes.
- Two SendBoxes with **different** conversation ids under one provider → exactly one shows voice state, exactly one capture start. (The draft's "two SendBoxes → one capture start" passes trivially without the differing ids.)
- Provider renders `consentModal`: assert the modal element is in the DOM, not merely that `ensureConsent` was called.
- **(d) The regression test that would have caught the shipped bug (testability #9, accepted).** `VoiceConversationMode.dom.test.tsx:51-58` stubs `tools.textToSpeech` to `{enabled:true, …}` — _that override is why 16,450 tests were green while every shipped session was silent._ Add to the ported session suite: `ConfigStorage.get('tools.textToSpeech')` resolves **undefined** (the real new-user path) → `voiceSynth.speak` **is** called. **Control:** stored `{enabled:false}` → `speak` not called and the settings route is offered.
- **Retarget, do not relax (testability #1, accepted).** `tests/unit/renderer/conversation/VoiceConversationMode.dom.test.tsx` (527 lines) opens the session in **9 places** via `getByRole('button', { name: 'Start Voice conversation' })` — the exact button V11 deletes. V4 lands `begin()` on the hook and rewrites those 9 entry points to drive the hook, **in the same commit as V11**. Explicit prohibition: do **not** add a test-only entry button; that turns 9 behavioural tests into presence-only.

---

### V5 — MUST — Consent at session entry, both legs (was S3)

**Files.** `openMode` (`VoiceConversationMode.tsx:391-440`, inside the hook after V4).

Before `setIsOpen(true)`: resolve readiness (V2), then `await ensureConsent(ttsProvider)` and `await ensureConsent(sttProvider)` for whichever legs are hosted. Decline on either → do not enter, stay in text chat, say which leg and why. `ensureConsent` short-circuits `Promise.resolve(true)` for local providers (`useHostedVoiceConsent.tsx:79-81`), so the local path costs nothing.

**Do not touch** `voiceSynthBridge.ts:57-66` or `SpeechToTextService.ts:478-485`. Those are the only real privacy control in the system: main-side, per-provider, version-bound, fail-closed, independent of everything the renderer does. Executed control (logic copied verbatim from `src/common/types/voiceConsent.ts:72-76`): `granted('openai', {version:1,accepted:['openai']}) = true` (positive control), `granted('flux-voice', sameRecord) = false`, `granted('openai', {version:0,…}) = false`, `granted('openai', {enabled:true}) = false`.

Entering conversation mode is consent to **make sound**; it is not consent to **transmit**, and the audio leg and the speech leg are two disclosures to two potentially different companies.

**Naive failure 1.** Caching "granted" in the renderer and adding a `skipConsent`/`force` param to the bridge to make per-sentence chunking cheaper. The per-call main-side check is cheap and fail-closed. Keep it; prompt once per session.
**Naive failure 2.** Treating entry as blanket consent. On Windows/Linux the only provider that can speak is hosted OpenAI, so "conversation just works" silently POSTs every reply to `api.openai.com`.

**Test.** Extend `tests/unit/renderer/voice/useHostedVoiceConsent.dom.test.tsx` + new session test: entering with hosted TTS and/or hosted STT and no stored consent must (a) render the modal, (b) not open the session on decline, (c) never call `voiceSynth.speak`, (d) never call `transcribeAudioBlob`.
**Control (corrected, privacy #3).** The all-local row (`system-native` + `whisper-local`) must not prompt at all. The draft's control was `system-native` alone, which asserts silence on exactly the leg where the microphone goes off-device — that control would have passed while the mic leg was unguarded.

---

### V6 — MUST — Entry means one thing; `begin()` is idempotent (UX #1, feasibility #5)

**Two defects, one fix.**

**(a) "Listening…" is a lie when the composer says it (UX #1).** `VoiceConversationMode.tsx:135-137` documents _"The first turn is always a deliberate tap: opening the panel must not open the microphone."_ `openMode` lands in `listening` with `continuousArmedRef=false` and the mic **closed**. The only thing that opens it is the orb tap (`:646-648` → `beginCapture`). Existing copy is honest: `STATE_COPY.listening = 'Tap to speak'` (`:53`), switching to `'Listening'` only at `user-speaking` (`:54`). Collapse the orb and the everyman taps the wave, reads "Listening…", talks, and nothing happens.
→ **The composer soundwave tap = `begin()` then `beginCapture()`.** One tap, one meaning.

**(b) One tap destroys a live session (feasibility #5).** `openMode` (`:391-440`) unconditionally builds a _new_ session and `setIsOpen(true)`. It calls `cancelAutoCapture()` but never `clearAudio()`, never `stopMonitoring()`, never `cancelRecording()`. Today the composer soundwave is `disabled` while `loading` (`sendbox.tsx:1663`, `:1684`), which masks it. V12 removes that guard and V11 makes the soundwave the sole door.
→ **`begin()` is a no-op when `isActive`.** The composer routes to `end()` when active (V11's toggle), so `begin()` can never be reached on a live session — the no-op is belt and braces.

**Test.** Hook test: `begin()` on an active session does not construct a second session, does not re-open the mic, and does not clear audio. **Control:** `begin()` from `ended`/no-session does all three.
Composer test: one tap on the soundwave from idle ends in `state === 'listening'` **with the recorder open** (`beginCapture` called). **This fails at HEAD** — at HEAD the mic stays closed.

---

### V7 — MUST — Teardown completeness: `stopAll()`, hard exits, one mic-off path (feasibility #2, privacy #1)

**(a) `stopAll()` for audio.** `clearAudio` has **eight** call sites — `VoiceConversationMode.tsx:327, 347, 355, 365, 379, 461, 552, 579` (playback entry, playback error paths, interrupt, closeMode, the confirmation handler at `:552` which fires from `speaking`, and unmount at `:579`). V22 replaces `playResponse` with a queue, and its epoch counter stops _issuing_ work — it does not stop audio already scheduled in the graph. Gapless scheduling means up to two `AudioBufferSourceNode`s are `start(when)`-scheduled at any instant. Without `stopAll()`, barge-in does not stop the voice, which is the one thing barge-in exists to do.
→ The queue owns `stopAll()`: `source.stop()` on every scheduled node, cursor reset, epoch bump. **Wire it into all eight sites listed above.**

**(b) `X` means stop (privacy #1, accepted; conflicts with draft S10 — draft loses).** Today all three orb exits call `closeMode` (`:634` Chat, `:637` X, `:748` End) and `closeMode` (`:452-465`) cancels the auto-capture timer, disarms `continuousArmedRef`, calls `stopMonitoring()` and `cancelRecording()`. Every exit is a hard mic-off. The draft re-pointed `X` and `Chat` to `collapse()`. `X` is the universal "stop this" glyph; leaving two live `getUserMedia` streams behind it is indefensible.
→ **`X` = `end()`. `Chat` = `collapse()`** (it says "Return to Chat", which is exactly what collapse does). Collapse also gets its own labelled control — see V11.

**(c) Six subscriptions gate on `isActive`, never `isExpanded` (feasibility #7, accepted).** Six effects are gated `if (!isOpen) return`: response stream (`:498`), `turnCompleted` (`:525`), turn-settled (`:533`), confirmations (`:547`), Escape (`:587`), plus the barge-in monitor (`:608`). V4 moves them verbatim; this step splits `isOpen` into `isActive`/`isExpanded` and **all six take `isActive`**. Take `isExpanded` and collapsing the orb mid-answer unsubscribes the response stream: the reply is never captured, `completeResponse` never runs, and the session hangs in `thinking` forever — while a `state !== 'ended'` assertion passes.

**Test.**

- `X` stops both media streams (recorder and barge-in monitor) and reaches `ended`. **Control:** `Chat` reaches `isExpanded === false` with `state !== 'ended'` and both streams still live.
- Collapse during `thinking` → the turn still completes and still speaks. (The draft's `state !== 'ended'` assertion alone would have passed the broken version.)
- `barge_in` during scheduled playback → every scheduled source received `stop()`. Write it before `stopAll()` exists and watch it fail.

---

# PHASE 2 — the composer becomes the surface

### V8 — MUST — Fix the Arco Button mock **before** any accessible-name work (testability #2)

**Files.** `tests/unit/sendboxQueue.dom.test.tsx:215-241`.

**Verified.** The mock destructures only `{children, icon, className, disabled, onClick, type}` and synthesizes `'aria-label': className?.includes('send-button-custom') ? 'send' : type === 'secondary' ? 'stop' : undefined`. Real Arco renders `VoiceModeEntryButton` with `aria-label="Start Voice conversation"`; the same component inside this harness comes back `aria-label: null`. Meanwhile `sendButton` (`sendbox.tsx:1327-1338`) and `stopButton` (`:1340-1348`) genuinely have **no `aria-label` and no text** — their accessible name in the app today is nothing; the suite has been pinning a name only the mock provides.

**Change.** (1) Mock forwards `aria-label` and `title`. (2) Add real `aria-label`s to `sendButton` and `stopButton` via `t()`. (3) Re-point the existing assertions (including the Stop assertion at `:419`) at the real names, same commit.

**Why it is its own step.** Adding a fourth control to a row of unnamed icon buttons makes the worst case worse, and without (1) the a11y fix ships green and unverified.

**Test.** The retargeted `sendboxQueue.dom.test.tsx` assertions. **Control:** revert (1) alone and the suite must go red — if it stays green the mock is still synthesizing names.

---

### V9 — MUST — One `renderVoiceControls()`, used by both layout branches (was S5)

**Files.** `sendbox.tsx:1652-1669` (`isSingleLine`) and `:1671-1691` (`!isSingleLine`) are byte-identical: `{runningIndicator}`, `SpeechInputButton`, `VoiceModeEntryButton` (both gated on `conversationContext?.conversationId`), `{sendButtonPrefix}`, `{renderActionButtons()}`. Extract to one local const above the return; call from both.

**Premise corrected.** See §0 defect C — Nanobot ships the single-line branch. Editing one branch is not "a change no user ever sees"; it is a silent per-platform divergence.

**Test.** Extend `tests/unit/sendboxQueue.dom.test.tsx` — the same controls with the same accessible names in **both** line modes.

---

### V10 — MUST — Voice status in a live region, not the placeholder (was S6; UX #3, testability #10, privacy #2 all converge)

**The draft was wrong.** `sendbox.tsx:1607-1608` renders `<Input.TextArea value={input} placeholder={placeholder} …>`. An HTML placeholder does not render over a non-empty value — and V12, V16 and Rollback invariant 4 all explicitly require typing to work during a session. So the draft's design deletes its own status channel on the first keystroke, and a placeholder is not announced by a screen reader at all. Worse, in `listening`/`user-speaking` the placeholder would have been the **only** hot-mic indicator.

**Files.** `sendbox.tsx:1353-1358` — `runningIndicator` already ships the right primitive: `<span className='sendbox-running' role='status' aria-live='polite'>` with an i18n'd "Working...". During a voice session, **replace** `runningIndicator` with a voice status element of the same shape (never render both — two contradictory statuses in one row).

Copy, keyed off the existing machine states, split where the machine already distinguishes (UX #1):

| state                   | status                                               | notes                              |
| ----------------------- | ---------------------------------------------------- | ---------------------------------- |
| `connecting`            | Connecting…                                          |                                    |
| `listening` (not armed) | Tap the wave to talk                                 | matches `STATE_COPY:53`            |
| `listening` (armed)     | Listening…                                           |                                    |
| `user-speaking`         | I can hear you                                       | the only "am I being heard" signal |
| `transcribing`          | Transcribing…                                        |                                    |
| `thinking` / `acting`   | Wayland is thinking…                                 | replaces "Working..."              |
| `approval-needed`       | Needs your approval in chat                          |                                    |
| `speaking`              | Wayland is speaking…                                 |                                    |
| `interrupted`           | Stopping…                                            |                                    |
| `reconnecting`          | Reconnecting…                                        |                                    |
| `error`                 | the readiness reason from V2, with the one-tap route |                                    |

Placeholder change is retained as a **secondary** cue only (`placeholder={voicePlaceholder ?? placeholder}` at `:1608`; SendBox has no internal placeholder default — verified by execution, rendering with no `placeholder` prop yields an empty string). It is explicitly **not** the test target.

**Naive failure 1.** Computing status in the six platform wrappers, the way `placeholder` is computed today (`WCoreSendBox.tsx:562-566`, `AcpSendBox.tsx:407`, …). Six copies that drift.
**Naive failure 2.** Rendering both `runningIndicator` and the voice status.

**Test.** New `tests/unit/renderer/conversation/composerVoiceStatus.dom.test.tsx`: drive the provider through all 12 states and assert the `role='status'` text; then **type a non-empty draft and assert the status text is still present**. That last assertion is what fails on a placeholder-only implementation — which is exactly why it is worth writing. Also assert `runningIndicator` is not simultaneously rendered.
**Control:** with no provider, `runningIndicator` behaves exactly as at HEAD and the placeholder is exactly the parent's string.

---

### V11 — MUST — Composer controls: toggle, Stop, mute, expand (was S7 + S10; UX #2, #5, privacy #1, #2, feasibility #9)

**Reviewers disagreed here; the call is below in §Calls C1.** Result:

**(a) The soundwave is a start/end toggle.** Idle → `begin()`+`beginCapture()` (V6). Active → `end()`. Icon and accessible name flip ("Talk with Wayland" / "End voice conversation"). This is the composer's hard mic-off and it is the answer to "the user taps the wrong button" — the destructive direction must not be the one with no exit.

**(b) Stop takes the action slot only when there is no draft (feasibility #9 and UX #5, identical finding, accepted).** `renderActionButtons()` (`sendbox.tsx:1362-1377`) deliberately keeps **Send** in the slot when `allowSendWhileLoading && hasDraftToSend`. A _leading_ voice branch overrides that, so a user who types while Wayland is speaking loses the visible send affordance (Enter still works — for a non-technical everyman that reads as "it broke"). Rule: voice-Stop renders in the action slot only when `!hasDraftToSend`; with a draft, Send stays and voice-Stop moves next to the status element.
Voice-Stop shows for `{transcribing, thinking, acting, speaking}` and calls `session.interrupt()`.

**(c) A mute / stop-listening control for `{listening (armed), user-speaking}` (privacy #2).** V4's `toggleMute` drives it. The orb's mute (`:729-732`, "Mic on"/"Muted") is the only mute control in the product today and collapsing the orb would delete it from reach.

**(d) Expand is a chevron on the status element, SHOULD not MUST.** `session.expand()`. The orb renders on `isExpanded`.

**Naive failure.** Reusing `stopHandler` (`sendbox.tsx:1304-1311`) for voice-Stop. It calls `onStop()` — the _model_ stop — then `setIsLoading(false)`. During voice `speaking` the model has already finished; `interrupt()` itself decides whether the backend needs stopping (`VoiceConversationMode.tsx:376-387`: only from `thinking`/`acting`).

**Test.** New `tests/unit/renderer/conversation/voiceComposerControls.dom.test.tsx`:

- `speaking` + `loading === false` + empty draft → Stop renders in the action slot; clicking calls `interrupt`, **not** `onStop`. **Control:** `loading` with no voice session → the existing Stop still calls `onStop` (assertion exists at `sendboxQueue.dom.test.tsx:419`, must stay green).
- `speaking` + non-empty draft → **Send** is in the action slot and voice-Stop is beside the status.
- `listening` → mute control present and clickable; toggling it prevents the next auto-capture.
- Second tap on the soundwave while active → `end()` called, `begin()` not called.
- In a rendered `ChatLayout` + real SendBox, exactly **one** element matches accessible name `/voice conversation/i`. **Control corrected (testability #3):** the draft claimed this count is 2 at HEAD. It is not — `ChatLayout` does not render a SendBox (the composer arrives as `children` from `ChatConversation.tsx`), so a bare `ChatLayout` render contains only the header button, count 1; and rendering `ChatLayout` with `hideHeader={false}` throws the react-router invariant from `VoiceConversationMode.tsx:90` before reaching any assertion. Use two direct assertions instead — header entry element **absent**, composer entry element **present** (see §Rejected R3).

---

### V12 — MUST — Enablement rules (was S8 + privacy #6)

**Files.** `sendbox.tsx:1656`, `:1663`, `:1677`, `:1684` — currently `disabled={disabled || isLoading || loading || isUploading}` on both voice buttons. Verified by execution: while `loading`, mic and soundwave both come back `disabled: true`. After V9 there is one site.

Three rules, from two reviewers who partly conflict (§Calls C2):

- **Mic** → `disabled || isUploading` (dictating into a queued draft is already legal; that is what `allowSendWhileLoading` at `:1363-1370` exists for) **AND** disabled-with-a-reason while a voice session is active.
- **Soundwave** → `disabled` only.
- Never `isLoading || loading` on either.

**Why the session gate on the mic (privacy #6, accepted).** `SpeechInputButton` owns its own `useSpeechInput` instance (`SpeechInputButton.tsx:127`) and therefore its own `getUserMedia`; the session hook owns a second (`VoiceConversationMode.tsx:247-273`); barge-in opens a third. Tapping dictation while conversation mode is recording opens a second recorder over the same audio: two hosted transcription POSTs of one utterance, one auto-sent, one dropped in the composer.

**Naive failure.** Leaving the `loading` gate. A conversation surface whose control dies the instant a reply starts cannot support barge-in or stop-speaking, and the symptom gets misdiagnosed as an audio bug for a week.

**Test.** `sendboxQueue.dom.test.tsx`: with `loading` set and no session, assert `disabled === false` on both voice buttons. **This fails at HEAD.** **Control:** in the same render the send button is correctly disabled with an empty draft.
Plus: session active → mic `disabled` with a non-empty `title`; and exactly one `transcribeAudioBlob` call per utterance (V17 half 3).

---

### V13 — MUST — Glow, and a _distinct_ listening indicator (was S9; UX #4 correction)

**Files.**

- `src/renderer/hooks/chat/useInputFocusRing.ts` (14 lines) gains `speakingBorderColor`/`speakingShadow` and `listeningBorderColor`/`listeningShadow` — **visually distinct**, not the same warm ring.
- `sendbox.tsx:1436-1437` keys the inline `borderColor`/`boxShadow` on `isInputActive || isVoiceSpeaking || isVoiceListening`.
- `sendbox.css` gains `.sendbox-panel--voice-speaking` and `.sendbox-panel--voice-listening`, declared **after** the existing `.sendbox-panel:focus-within` block (`:487-494`) which sets the same properties. Do not delete that rule — unrelated regression.
- A composer-level level meter driven by the **session hook's `level`**.

**The draft's reuse instruction was factually wrong (UX #4).** It said to pair the glow with `SpeechInputButton`'s existing strip (`.speech-input-feedback__waveform`, `sendbox.css:155-208`, rendered at `SpeechInputButton.tsx:249-265`). `useSpeechInput` is entirely per-instance (`useSpeechInput.ts:253-258` — all `useState`/`useRef`, no module singleton), so that strip is driven by the _button's_ own `recordingLevels` and stays idle for the whole session. Strike the instruction.

**Why listening must look different from speaking.** The mic reopens by itself 350 ms after every answer (`AUTO_CAPTURE_GRACE_MS`, `:132`, `scheduleAutoCapture` `:134-150`), stays open up to 8 s (`ENDPOINT_NO_SPEECH_TIMEOUT_MS = 8000`), and auto-sends what it hears. The user must be able to tell "it's hearing me" from "it's talking" without reading.

**Naive failure 1.** Driving the animation from React state per streamed token. SendBox already re-renders on every token (`useMessageList()`, `sendbox.tsx:223`); animating `box-shadow` on a large element from that render loop will be visible. Keep the animation in a CSS keyframe on a class; lift only coarse `speaking | listening | idle` into state. Precedents: `@keyframes sendbox-running-pulse` (`sendbox.css:520-537`), `.bg-animate` (`base.css:34-45`).
**Naive failure 2.** Over-doing it — Claude's own Mac dictation glow was publicly reviewed as "a little over-the-top". H6 is the gate.

**Test.** DOM test that the two classes toggle with state and are never both applied; the level meter reads the session's `level`, not the button's. Look is human-only (H6).

---

### V14 — MUST — Distinct names, distinct icons, real i18n keys (UX #6, #7)

**Files.** `VoiceModeEntryButton.tsx:22` (`label` is a hardcoded English literal `'Start Voice conversation'`), `SpeechInputButton.tsx:235`, plus new keys under `conversation.chat.voice.*` in **all 12 locales** — `src/renderer/services/i18n/locales/` has de-DE, en-US, es-ES, fr-FR, ja-JP, ko-KR, pt-BR, ru-RU, tr-TR, uk-UA, zh-CN, zh-TW.

Names: mic → `aria-label` "Dictate", `title` "Dictate — type with your voice". Soundwave → `aria-label` "Talk with Wayland" (active: "End voice conversation"), `title` "Talk with Wayland — it answers out loud". Differentiate the icons by fill/weight, not glyph alone.

**Why.** After V11 the accessible name is the entire pre-tap signal, and "Start voice input" vs "Start Voice conversation" is not a signal. V17 proves the distinction behaviourally — but only _after_ the mis-tap, and per V11(a) the mis-tap is the expensive one. Every new composer string in the draft was hardcoded English in a 12-locale product where everything else in the composer goes through `t()` (`sendbox.tsx:1357`).

**Test.** Add the accessible-name assertions to V17's separation suite (they only mean something after V8). Add an i18n key-parity test for the new `conversation.chat.voice.*` keys across all 12 locales. **Control:** delete one key from one locale → red.

---

### V15 — MUST — The mic must be visible when STT is off (was S12)

**Files.** `SpeechInputButton.tsx:219-221` — `if (!isConfigLoaded || !isSpeechToTextEnabled) return null;`. Keep the `!isConfigLoaded` early return. When STT is off, render the button and route `handleClick` to Voice settings.

**Verified by execution.** With `tools.speechToText.enabled = false` the composer renders 2 buttons (soundwave + send); with `true`, 3. So today "two distinct affordances side by side" is, for most users, one affordance.

**Naive failure.** Enabling STT implicitly on click. `DEFAULT_SPEECH_TO_TEXT_CONFIG` is `{enabled:false, provider:'openai'}` (`ToolsModalContent.tsx:43-45`) while the renderer treats an _unset_ provider as local whisper (`src/renderer/services/SpeechToTextService.ts:79`). A click that flips `enabled` silently moves the user from on-device to hosted. Consent still blocks the send, but the mental model is now wrong.

The soundwave gets the same treatment via V2's `stt-disabled` reason and V10's one-tap route — never auto-enable.

**Test.** Invert `tests/unit/renderer/SpeechInputButton.dom.test.tsx:102` (currently "hidden when disabled"): the button renders, clicking navigates, and `ConfigStorage.set` was **not** called. **Control:** the enabled case at `:110` stays unchanged and green.

---

### V16 — MUST — Staged attachments cannot be consumed by a spoken turn (UX #9, privacy #9)

**The defect, verified.** `WCoreSendBox.tsx:369-377`: `onSendHandler` runs `collectSelectedFiles(uploadFile, atPath); clearFiles();` before dispatch, and `useVoiceTurnSubmission(conversation_id, onSendHandler)` (`:400`) routes voice text through that exact handler. Today the orb is a full-screen `role='dialog' aria-modal='true'` overlay (`:619`, `:749`) that hides the composer, so staging a file and then speaking is near-impossible. After this plan the composer _is_ the voice surface. A user attaches a photo, then talks, and the photo goes with a sentence they never meant to attach it to — and `clearFiles()` means it is gone from the composer.

**Change (minimal, contained).** When a voice turn is about to submit and files are staged, **do not auto-send.** Write the transcript into the composer draft and set the status to "Draft ready — press send to include your N attachment(s)." The user presses Send (or Enter) deliberately. This uses the existing draft path, needs no change in any of the six wrappers, and is fail-safe in the direction that matters.

**This is the one deliberate exception to Rollback invariant 4** ("the voice session never writes `input`), and it is gated strictly on `hasStagedFiles`. Invariant 4 is reworded accordingly.

**Test.** New assertions in V17's suite: with a staged file, a completed voice turn calls `onSend` **zero** times, leaves the transcript in the textarea, and leaves the file staged (`clearFiles` not called). **Control:** with no staged file, the same turn auto-sends exactly once via `submitVoiceTurn` (`voiceTurnBridge.ts:30`).

---

### V17 — MUST — Behavioural separation, proven (was S11)

Nothing to build: the mic already never speaks (`SpeechInputButton` → `onTranscript` → `setInput(appendSpeechTranscript(...))`, `sendbox.tsx:1313-1319`). The deliverable is the proof, because the two affordances are distinguished by behaviour and a tooltip assertion is not that.

**Test.** New `tests/unit/renderer/voiceModeSeparation.dom.test.tsx`, four halves in one file:

1. Dictation end to end with `voiceSynth.speak` mocked → `speak` **never** called; transcript lands in the textarea and is **not** sent.
2. Conversation path → `speak` **was** called and the turn auto-sent. _This is the control for half 1 — if `speak` is never called in either, the mock is simply not wired._
3. Exactly one `transcribeAudioBlob` per utterance (V12).
4. The V16 staged-attachment pair.
   Plus the V14 accessible-name assertions.

---

### V18 — MUST — Escape from anywhere, with today's exact semantics (was S19, **promoted from LATER** per privacy #7)

**Files.** Escape handling is gated on `isOpen` (`VoiceConversationMode.tsx:586-602`), so it only works while the orb is up. Move it to the provider so it works from the composer.

**Exact semantics, non-negotiable:** `interrupt()` while the assistant is talking (`thinking|acting|speaking`), `end()` otherwise — verbatim what `:586-602` does today. Mapping it to `collapse()` would turn the reflexive panic key into a no-op that leaves the mic hot.

**Test.** Escape during `speaking` → `interrupt`, session survives. Escape during `listening` → `end`, both media streams stopped. **Control:** Escape with no active session does nothing and does not swallow the key.

---

# PHASE 3 — speech as it goes

## What "as it goes" honestly means

**We cannot do byte-level streaming TTS and we will not pretend to.** `say` requires a seekable sink — that is exactly why `TextToSpeechService.ts:130-133` writes a temp WAV, and why the pre-`af3c17e1b` `--output-file=/dev/stdout` approach returned rc=1 and zero bytes. There is no partial-audio path for the only local provider.

What is feasible with **no IPC protocol change**: sentence-chunked synthesis with a bounded pipeline and gapless Web Audio scheduling. The three things that might have forced a protocol change do not:

1. `voiceSynth.speak` (`ipcBridge.ts:511`) is stateless and re-entrant.
2. The machine already accepts multiple segments per turn: `response_segment_ready` is valid from `speaking` (`VoiceSessionMachine.ts:335`) and accumulates `synthesizedSegmentIds` (`:340-345`).
3. The `number[]` wire shape is not a bottleneck — measured: a 3.09 s WAV is 136,278 elements / 486 KB, 1 ms stringify, 1 ms parse; an 11.86 s paragraph is 1.78 MB, 6 ms / 8 ms.

**Measured economics for `system-native`** (Darwin 25.3.0, default voice, `-r 175`, WAVE/LEI16@22050), independently reproduced by the feasibility audit:

- `wall_ms ≈ 765 + 129 × audioSeconds` (fits every sample to ~40 ms; audit re-ran 3.361 s→1145 ms vs 1199 predicted, 4.455 s→1265 vs 1340, 1.66 s→928 vs 979).
- Fixed overhead ≈ **765 ms** per call — not process spawn (`/usr/bin/true` measured 19–28 ms in the same harness); it is `say`'s own engine init, paid per subprocess.
- **Break-even ≈ 0.88 s of audio** (≈2.6 words at 175 wpm). Real sentences clear it; one-word sentences do not ("Yes." = 0.668 s, reproduced exactly).
- Time to first audio, first sentence alone: **1131 ms**. Same 4 sentences as 4 calls: 4543 ms; as one call: 2290 ms. ~2.3 s more CPU to start speaking ~5 s sooner.
- 2-in-flight inflates per-call wall ~20 % (1145→1320 ms) but a pair still returns 5.85 s of audio in 1322 ms — the pipeline stays comfortably ahead of playback. Bounded-2 is the right bound.
- **Negative control:** the pre-fix args (`-o /dev/stdout --data-format=aiff`) return rc=1, 0 bytes, `The format 'aiff' is unknown…`. The harness distinguishes success from failure.

**`openai` per-chunk latency and cost were never measured.** 0.88 s is a local-subprocess number. Chunking ships on `system-native` only (§Not doing 3).

**Fallback if V19–V22 slip or H3 fails.** A **two-chunk split**: speak the first complete sentence as soon as the splitter yields it, then the remainder as one clip on `finish`. Time to first audio drops to ~1.1 s at the cost of exactly one seam. Needs V19 but not V22's scheduler, and degrades to today's behaviour at N=1.

---

### V19 — MUST — Sentence splitter (was S13; testability #6 correction)

**Files.** New export in `src/common/voice/voiceResponseText.ts` (51 lines, two exports today):
`takeSpeakableSentences(buffer: string): { sentences: string[]; rest: string }` — operating on **raw** text.

**Control for "no splitter exists":** the same `/usr/bin/grep -rEn` that returned NO MATCH for `splitSentences|sentenceBoundary|Intl.Segmenter|segmentSentences|toSentences` over `src/` **did** return `normalizeVoiceResponseText` at `voiceResponseText.ts:29`. The zero is real.

Rules, each traceable to a fact:

- Emit on `[.!?]` followed by whitespace or end-of-buffer.
- **Hold everything while the count of ``` in the buffer is odd.** `normalizeVoiceResponseText:31` uses `/```[\s\S]*?```/g`, which needs a _closing_ fence — run it on an open fence and the model's raw source is read aloud verbatim.
- Merge any candidate under ~15 chars into the next (0.668 s < 0.88 s break-even → underrun and stutter).
- Force-flush at ~200 chars with no terminator.
- Never flush the trailing fragment; the caller flushes on `finish`.
- Run `normalizeVoiceResponseText` **per emitted sentence**, and move the 4000-char cap (`MAX_SPOKEN_CHARACTERS`, `:9`) to a cumulative per-turn counter held by the caller — applied per chunk it means nothing.

**Naive failure.** Splitting on `.` alone. "Dr. Smith", "3.5", "e.g." each become their own chunk at 765 ms fixed overhead plus a seam. Require whitespace after the terminator **and** reject a preceding single capital, digit, or known abbreviation. (Executed: a naive splitter turns `"It is 3.5 metres."` into `"It is 3."` + `"5 metres."`.)

**The draft's headline invariant was unsatisfiable — corrected (testability #6, accepted, independently re-executed).** `normalizeVoiceResponseText` is **not distributive over chunks**: `^\s*[-*+]\s+` and `^\s*\d+[.)]\s+` are line-anchored, so a chunk boundary manufactures a line start. Executed counterexamples at this HEAD:

- `"See below. - item one. - item two."` → whole: `"See below. - item one. - item two."`; per-sentence-then-join: `"See below. item one. item two."` — **not equal**.
- `"Total 4. 2) second. done."` → per-sentence drops the `2)`.
  **Control (the check discriminates):** `"Done. See it."`, `"- leading bullet. next line."`, and `"1. numbered start. then more."` all came back **equal**.
  → State the invariant over **raw** slices: `concat(rawSentences) + rest === rawBuffer`, fed one character at a time. Assert normalization **separately, per emitted sentence**. Do not assert that per-chunk normalization equals whole-text normalization — it does not, and the obvious repair is to weaken the test until it proves nothing.

**Test.** Extend `tests/unit/common/voiceResponseText.test.ts`: the raw round-trip invariant (character-by-character feed); an open ```fence emits nothing and closing it emits the prose around it;`"Dr. Smith went home."`→ one sentence;`"It is 3.5 metres."` → one sentence; a 400-char terminator-free buffer force-flushes exactly once. **Control:** a plain three-sentence paragraph emits exactly three.

---

### V20 — MUST — Split `completeResponse` into a turn-terminal handler (feasibility #1, blocker, accepted)

**Verified at `VoiceConversationMode.tsx:471`:**

```
if (!current || !turnId || !['thinking', 'acting'].includes(current.state)) return;
```

The moment the first sentence chunk fires `response_segment_ready`, the machine is in `speaking` (`VoiceSessionMachine.ts:343`). Every later call to `completeResponse` — from `finish` (`:519`) and from `turnCompleted` (`:528`) — then hits that guard and returns immediately. Under V22 the draft's stated owner of the tail **cannot run**: the trailing fragment is never spoken, `setLastResponse` never fires so captions stay empty, the `NO_SPEAKABLE_RESPONSE` branch is dead, and `completionKeyRef` is never set so the dedupe between the two terminal paths is gone.

**Change.** Split into (a) a turn-terminal handler valid from `thinking|acting|speaking` that owns the tail, `setLastResponse`, the `NO_SPEAKABLE_RESPONSE` case, and the dedupe key (with `speaking` added to it); and (b) the existing single-clip path used when chunking is off. **This is V22's cost, not a free consequence of V19.**

**Test.** Hook test: drive `response_segment_ready` (state → `speaking`), then fire `finish` → the tail is spoken exactly once, `lastResponse` is set, and firing `turnCompleted` immediately after is deduped. **Write it before the split and watch it fail** — at HEAD/post-V19 it returns silently.
**Control:** the same sequence with no prior segment (single-clip path) behaves exactly as at HEAD.

---

### V21 — MUST — `AudioContext` lifecycle: gesture-resumed, asserted, named on failure (feasibility #3, blocker, accepted)

**Verified.** There is **no** `autoplay-policy` switch anywhere in main — `/usr/bin/grep -rn "appendSwitch" src/process/` returns only `ozone-platform`, `disable-gpu`, `disable-software-rasterizer` (`configureChromium.ts:45-47`), `no-sandbox` (`:59`), and `remote-debugging-port` (`:316`). Chromium's default gesture requirement applies. The in-repo precedent is `useSpeechInput.ts:698-699`: `if (audioContext.state === 'suspended') await audioContext.resume()`.

**Why it is a blocker.** `playResponse` is invoked from a stream event, not a gesture. With `HTMLAudioElement` a blocked play _rejects_ and you get `TTS_PLAYBACK_FAILED` (`VoiceConversationMode.tsx:364-367`). With Web Audio, a suspended context gives **no error at all**: `start(when)` schedules against a clock that is not advancing, nothing plays, `onended` never fires, `playback_completed` never fires, the session never re-arms. Symptom-for-symptom the bug this plan exists to fix.

**Change.** Create and `resume()` the `AudioContext` inside the **entry-button click handler** (the gesture, V6). Assert `ctx.state === 'running'` before scheduling; otherwise fail to a named error and surface V2's `audio-blocked` reason. Never schedule against a suspended context.

**Test.** In the V22 suite: a fake context whose `state` stays `'suspended'` → the session reaches `error` with `audio-blocked`, **never** `speaking`, and no source is scheduled. A fake whose `decodeAudioData` rejects → `error`, not silence.

---

### V22 — MUST — Bounded synthesis pipeline + gapless playback + `stopAll` (was S14)

**Files.** Replaces `playResponse` (`VoiceConversationMode.tsx:325-371`, in the hook after V4) and adds `src/renderer/services/voice/voiceSpeechQueue.ts`.

Behaviour:

- Drive from the existing stream site (`:497-522`; chunks are deltas — confirmed at `:509` and at `chatLib.ts:1217/:1277`). After each `responseTextRef.current += chunk`, pull complete sentences with V19 and enqueue. V20's terminal handler owns the tail.
- **At most 2 `voiceSynth.speak.invoke` in flight**, results stored by index.
- Decode each result with `AudioContext.decodeAudioData` — the same primitive already used at `src/renderer/services/voice/localWhisper.ts:82-100`. Trim leading/trailing silence at |sample| > 200/32767, then `AudioBufferSourceNode.start(cursor)`; `cursor += trimmed.duration`.
- Emit `response_segment_ready` + `playback_started` per chunk at the moment that chunk **starts** (`activeSegmentId` is single-valued, `VoiceSessionMachine.ts:344`; `playback_started` enforces `segment_mismatch` at `:364`).
- Emit `playback_completed` **only from the final chunk's `onended`**.
- **Epoch counter**, incremented on `barge_in`, `approval_required`, `end`, collapse-to-ended, and conversationId change. Stale-epoch results are discarded and no further chunks issue.
- **`stopAll()`** (V7a) — `source.stop()` on every scheduled node, wired into all eight `clearAudio` sites.

**Why `HTMLAudioElement` cannot be kept for chunking.** Measured on real `say` output (|sample| > 200): "The weather in London today is mild…" = 2.997 s with **309 ms leading silence**; "Temperatures will hover around fifteen degrees." = 2.395 s with **174 ms leading silence**. Naive `<audio>` chunk playback inserts 174–309 ms of dead air at every boundary plus the element swap.

**Naive failure 1.** Firing all N `speak` calls at once — `say` runs genuinely in parallel and short sentences resolve first, so clips play out of order; on `openai` a barge-in wastes N billed requests instead of 1.
**Naive failure 2.** Emitting `playback_completed` per chunk. It unconditionally returns to `listening`, clears `activeTurnId`, and emits `start_capture` (`VoiceSessionMachine.ts:368-381`) — the mic reopens over Wayland's own voice mid-answer.
**Naive failure 3.** Believing the epoch is a cancel. No cancel exists anywhere: `voiceSynth.stop` is an explicit no-op (`voiceSynthBridge.ts:70-73`), `speak`'s param type is `{text: string}` with no abort token, and main holds no handle on the `say` child (`TextToSpeechService.ts:135`) or the OpenAI fetch (`:90`). The epoch stops _issuing_; `stopAll()` stops _sounding_. Both are required. Accepted residual: at most **one** orphaned in-flight call per interrupt (harmless CPU on `say`; one billed-and-unheard request on `openai`).
**Naive failure 4.** _(Draft's mp3 item deleted — see §Rejected R4. `openai` is the only mp3 producer and it does not chunk, so the clause was dead text contradicting §Not doing 3.)_

**Tests.** New `tests/unit/renderer/voice/voiceSpeechQueue.test.ts` against a fake `speak` with per-index delays resolving **out of order** (index 2 before index 1) and a fake AudioContext recording `start(when)`:

- playback order is 0, 1, 2;
- `cursor` is monotonic and equals the sum of trimmed durations;
- never more than 2 calls in flight;
- `playback_completed` fires exactly once;
- after `barge_in` during index 1: no further `speak` issued, index 1's late result never scheduled, and every already-scheduled source received `stop()`. **Write the epoch and stopAll assertions first, without the guards, and watch them fail** — that is the control that the guards do something;
- V21's suspended-context and decode-reject negative controls.

`tests/unit/common/VoiceSessionMachine.test.ts`: add `ready → started → ready → started → completed` and assert it is accepted — proving the constraint is caller-side and the machine file needs no change.

**Merge gate, stated explicitly (testability #7, accepted with modification).** No `AudioContext` exists in jsdom (executed in the `dom` project: `typeof AudioContext === 'undefined'`, `typeof Audio === 'function'`). The only double in the tree is a 15-line analyser stub at `tests/unit/renderer/useSpeechInput.test.ts:43-57`, and the cited precedent `localWhisper.ts` **has no test file at all** (verified by `find`, control: the same `find` located `tests/unit/sendboxQueue.dom.test.tsx`). So the suite above asserts scheduling arithmetic against a fiction written by the implementer — a suite that is green when the app is silent, which is precisely the shape of the original bug.
→ **V22 does not merge on unit tests alone. H3 (packaged app, real speakers, one long multi-sentence answer) is a blocking gate.** The unit suite still ships — ordering, epoch, `stopAll`, and cursor arithmetic are real logic worth pinning — it is just not sufficient. See §Rejected R5.

---

### V23 — SHOULD — Receipt semantics before any hosted chunking (was S15)

`synthesizeTurn` emits one `VoiceReceipt` per call (`TextToSpeechService.ts:210`) plus one `mainLog` (`:222`). Six sentences = six "turns" and six cost rows for one reply. Add a parent turn id, or aggregate, before chunking is ever enabled on `openai` — otherwise the cost UI lies.

**Test.** `tests/unit/common/voiceReceipt.test.ts` — N chunk receipts for one turn roll up to one row. **Control:** a genuinely separate turn still produces two rows.

---

# PHASE 4 — hardening and honest gaps

### V24 — SHOULD — Named failures and a circuit breaker (was S17)

Adopt the taxonomy Anthropic publishes for Claude Code voice dictation: _recorder started but captured silence_ vs _audio never reached the service_ vs _service returned nothing_ — they explicitly log conflating the first two as a bug fixed in v2.1.200. Our TTS-side analogue is our bug: a synth call that cannot succeed must produce a named error and re-arm the session, never advance the state machine silently. `TextToSpeechBridgeResult` already carries eight error codes (`ttsTypes.ts:70-78`); the gap is that the UI reaches `speaking` before `speak` resolves.
Add a circuit breaker: after 3 consecutive capture failures, stop re-arming and say so.

**Test.** A `speak` resolving `{ok:false}` leaves the session in `error` (not `speaking`) with a user-readable message. **Control:** the success path still reaches `speaking`. Breaker: 3 failures → no 4th `beginCapture`; 2 failures then a success → re-arms normally.

### V25 — SHOULD — Wall-clock caps from shipped, real-mic-validated numbers (was S18)

Every threshold in `useSpeechInput.ts` was tuned against a mocked analyser. Published defaults from products with real traffic: macOS Dictation ends after **30 s** of no speech; Claude Code stops at **15 s** of silence and **2 min** total. Add those as wall-clock timers — independent of the RMS thresholds, so a mistuned endpointer degrades to "capture ended" instead of a hot mic.
**Test.** Fake timers in `tests/unit/renderer/useSpeechInput.test.ts`. **Control:** speech within the window does not trip the cap.

### V26 — LATER — Barge-in calibrates against silence (was S20)

`startMonitoring` is armed on `state === 'speaking'` (`:607-611`), but the machine enters `speaking` at `response_segment_ready` (`:490`) — _before_ `playResponse` awaits `speak.invoke` (`:328`). So the 480 ms echo calibration (`useSpeechInput.ts:725-731`: 6 ticks × 80 ms) runs entirely during 765 ms–2.3 s of synthesis silence: `echoPeak ≈ 0` and the threshold pins to the 0.06 floor (`threshold = max(echoPeak × 3, 0.06)`). It has never been calibrated against real speaker bleed. Fix by calibrating from the first audible output sample. **Chunking does not cause this and slightly improves it — but it will be blamed for it.**

### V27 — LATER — Launch Pad parity (was S21)

`GuidPage.tsx:918-921` passes `SpeechInputButton variant='prominent'` into `GuidActionRow.tsx:273`; it does not use SendBox and has no `conversationId`, so a conversation affordance genuinely cannot exist there. Product question, not a bug.

### V28 — LATER — Local TTS off macOS (was S22)

`TextToSpeechService.ts:123` throws unless `process.platform === 'darwin'` (`/usr/bin/grep -nE "win32|powershell|SAPI|espeak|darwin"` over that file returns only the `darwin` line) and Kokoro is dead. Until a local adapter exists, V2 reports `no-local-adapter` and entry prompts for hosted consent instead of pretending `system-native` works.

### V29 — LATER — Delete the retained `HTMLAudioElement` path

Retained only so Rollback layer 3 is real (see §Rollback). Delete once H3 has passed on a packaged build and one release has shipped with chunking on by default.

---

## §Calls — where reviewers disagreed with each other

**C1 — Soundwave: expand-when-active (feasibility #5) vs toggle-to-end (UX #2).**
Feasibility wanted the composer soundwave to route to `expand()` on an active session, purely to stop `openMode` clobbering it. UX wanted a start/end toggle and Expand demoted.
**Call: toggle to end.** It satisfies feasibility's actual concern completely (`begin()` is never reached on a live session, and V6 makes it a no-op anyway), and it is the only design that gives the composer a hard mic-off — which privacy #1 and #2 independently show is the load-bearing missing affordance once the orb is non-modal. Expand becomes a chevron on the status element and drops to SHOULD. Cost: a user who wants the orb has one more pixel to find. Acceptable; a hot mic with no exit is not.

**C2 — Mic live during a session (draft S8, "voice controls stay live") vs mic disabled during a session (privacy #6).**
**Call: both, on different axes.** S8's real point was the `isLoading || loading` gate, which kills barge-in — remove it. Privacy's real point is two concurrent `getUserMedia` recorders transcribing one utterance twice — add a `sessionActive` gate with a visible reason. They are not the same gate and there is no conflict once separated.

**C3 — Streaming feasibility.** Synthesis lane: yes, no protocol change, with measurements. External lane: Claude's own streaming behaviour is unverified (Engadget says turn-based, datastudios says full-duplex — directly contradictory secondary sources) and waiting for a sentence boundary costs 200–500 ms.
**Call: ship sentence chunking.** It is the only pipeline-compatible answer, the 200–500 ms is paid once at the start instead of waiting for the whole generation, and measured time-to-first-audio of ~1.1 s vs 2.29 s (and vs full-generation-then-synthesis in reality) is a large win. Described as _sentence-chunked synthesis_, never as "streaming audio".

**C4 — Two buttons or one mic + chevron.** Claude Desktop consolidated to a single mic with a chevron that switches dictation ↔ voice and keeps the choice (changelog v1.25927.0). claude.ai web and ChatGPT keep two icons. Sean specified two.
**Call: two buttons.** A chevron is a hidden affordance and the north star is a non-technical everyman who will never find it; two visible controls also let the distinction be asserted behaviourally (V17). Cost is composer width — real, and H7/H8 are the gates. This is the one place the plan knowingly diverges from the reference product, on Sean's call, with the divergence on the table.

**C5 — Retire `enabled` or fix its default.** Config lane: retire it — it protects nothing (the bridge never reads it; Test-voice speaks with it `false`). Synthesis lane: `enabled:false` is the blocking prerequisite for everything.
**Call: keep the field as a user kill switch, flip its default (V1), derive readiness on top of it (V2).** Deleting it breaks the settings Switch, the normalizer, and their tests for zero privacy gain, because it never gated anything.

**C6 — Hands-free VAD or push-to-talk by default.** Claude and ChatGPT default hands-free with server-side VAD tuned on real traffic; Wispr and Claude Code default push-to-talk. Our endpointing has only been validated against a mocked analyser.
**Call: hands-free stays the default inside conversation mode** (continuous turn-taking is the point) **but V25's wall-clock caps ship with it**, and V6 keeps the _first_ turn a deliberate tap. Dictation stays tap-to-start / tap-to-stop and never auto-sends.

---

## §Rejected — reviewer findings not applied, with reasoning

**R1 — Feasibility #8's alternative: a one-shot `enabled` migration.** Rejected (feasibility itself recommended against it). Rewriting a user's stored config to flip a switch they may have deliberately set is worse than leaving it; V2's `tts-disabled-by-user` reason plus V10's one-tap route fixes the same users with their consent. What is **accepted** from #8 is the honest wording — the flip does not fix anyone who ever changed a TTS field or pressed Test voice.

**R2 — Privacy #3's proposed new main-side IPC returning `{ttsProvider, sttProvider}`.** Rejected as written; the _requirement_ is accepted in full. The divergence exists only because settings shows a provider main does not use (the Flux seed). V3 fixes that at the root, after which the renderer's view is authoritative and no new IPC surface is needed. Guarded by V3's added test asserting renderer-resolved == main-resolved for the seeded-Flux case. If that test cannot be made to pass, the IPC comes back — but do not add it speculatively.

**R3 — Testability #3's option A: a new `ChatLayout` + real SendBox + `MemoryRouter` + real-Arco harness.** Rejected in favour of its own option B. Building a fourth composer harness to count buttons is disproportionate; two direct assertions (header entry absent, composer entry present) are stronger, cheaper, and do not create a harness someone must maintain. Testability's underlying correction — that "count is 2 at HEAD" is false — is **accepted** and the control is rewritten.

**R4 — Draft S14 naive-failure #3 (switch `response_format` off `'mp3'`, `TextToSpeechService.ts:100`).** Deleted, per feasibility's closing note. `openai` is the only mp3 producer and §Not doing 3 excludes `openai` from chunking, so the clause was dead text contradicting the exclusion. If hosted chunking is ever enabled, reinstate it there.

**R5 — Testability #7's implication that the V22 unit suite is not worth writing.** Partially rejected. Ordering, in-flight bound, epoch discard, `stopAll` coverage, cursor monotonicity and `playback_completed`-exactly-once are real caller-side logic, and they are cheap to pin. What is **accepted** is that the suite must not be the merge gate: H3 blocks V22. Both statements can be true and the plan asserts both.

**R6 — UX #6's literal aria-label strings** ("Dictate — type with your voice", "Talk with Wayland — it answers out loud"). Rejected as `aria-label` values — a screen reader reading a full sentence on every focus is worse than the problem. Accepted as `title` tooltips, with short distinct `aria-label`s ("Dictate" / "Talk with Wayland"). The substance — distinct names, distinct icon treatment, real i18n keys — is fully accepted as V14.

**R7 — UX #2's implication that Expand can be dropped entirely.** Rejected. After V4 the orb costs one `isExpanded` boolean and reuses 764 lines of already-written captions, level meter, and controls, and Sean's E asks for it. It is demoted to SHOULD and given a proper labelled chevron, not deleted. What is **accepted** is that the second _entry point_ must not survive.

---

## What we are NOT doing, and why

1. **Byte-level streaming TTS (MSE, partial buffers, a new emitter channel).** `say` needs a seekable sink — the reason for the temp file at `TextToSpeechService.ts:130-133`. The local provider cannot produce partial audio at all.
2. **Streaming STT.** `transcribeAudioBlob` / whisper-1 stays batch. A different product decision; blocks nothing here.
3. **Sentence chunking on `openai` TTS.** Not until per-chunk latency and cost are measured on real hardware (H5) and V23 lands. `system-native` first.
4. **Wiring `autoReadResponses`.** Zero runtime consumers today; wiring it creates new unprompted-audio surface. Stays `false` and permanently opt-in whenever it is wired.
5. **Anything for `kokoro-local`.** `resolveBinary` returns `null` (`KokoroLocal.ts:53`); `synthesize` always throws `TTS_KOKORO_LOCAL_UNAVAILABLE` (`:90`).
6. **Decomposing `sendbox.tsx`** (1697 lines, one component, `:157`–`:1695`) beyond the single `renderVoiceControls()` extraction the duplicated action row forces.
7. **Launch Pad / `GuidActionRow` parity.** See V27.
8. **A Windows/Linux local TTS adapter.** See V28.
9. **Touching `voiceSynthBridge.ts:57-66` or `SpeechToTextService.ts:478-485`.** The only real privacy control in the system; nothing here needs them changed.
10. **The five unrelated defects the lanes surfaced** — the CSS/JS duplicate focus ring; the inert "Read responses aloud" Switch; the STT factory default of `provider:'openai'` while the renderer treats unset as local whisper; five test suites stubbing `SpeechInputButton` to a bare div; and `src/renderer/services/voice/localWhisper.ts` having no test file at all. Named so they are not lost; each is a separate packet.

---

## H — Cannot be verified without a real human, a microphone, and speakers

Mandatory. None can be closed by a unit test, by an agent, or by CI. **H3 is a merge gate on V22.**

- **H1 — Endpointing thresholds** (`useSpeechInput.ts`). Every value tuned against a mocked analyser. Real mic in a quiet room, a noisy room, and next to a fan.
- **H2 — Acoustic barge-in.** `threshold = max(echoPeak × 3, 0.06)` (`:728`) against real speaker bleed, at several output volumes, on laptop speakers **and** headphones (echo cancellation differs, and the detector is gated on the browser claiming EC is active).
- **H3 — 🔴 BLOCKING GATE on V22: does the seam sound like one voice?** Packaged app, real speakers, one long multi-sentence real answer. RMS arithmetic cannot tell you whether two independently-synthesised `say` clips — different prosody contour, different terminal pitch — read as one speaker or two. **Run this before writing the queue, not after.** If it fails, ship the two-chunk fallback and stop.
- **H4 — Does 765 ms + 129 ms/audio-second keep the pipeline ahead of playback** across a real long answer read end to end, on a loaded machine.
- **H5 — `openai` TTS per-chunk latency and cost.** Never measured. The 0.88 s break-even is a local-subprocess number.
- **H6 — The glow.** Warm ambient cue, or the "a little over-the-top" orange cloud MacStories described in Claude's own Mac dictation? Screenshot before/after, both themes, both the speaking and listening variants.
- **H7 — Narrow-window and popout layout** with four controls plus a status string. `runningIndicator` is `white-space: nowrap` (`sendbox.css:517`) and the right cluster has no `min-w-0`/`flex-shrink`; popout is the narrowest real surface and no sendbox test covers it. jsdom cannot measure overflow.
- **H8 — Mobile.** `.sendbox-input--mobile` forces 16 px (`sendbox.css:445`), `.sendbox-panel` takes a safe-area bottom margin (`:452`), and only the _left_ tools rail scrolls (`sendbox.tsx:1673`). A wider right cluster steals width from the textarea.
- **H9 — Screen-reader pass** over the composer (dictate, talk, mute, expand, send/stop): reading order, and that the voice status is announced on state change and **not** per streamed token.
- **H10 — Windows.** No local TTS at all off macOS, so the entire conversation path there is hosted OpenAI. Nothing may claim cross-platform voice until this runs on the Windows box (`ssh -i ~/.ssh/wayland_win seand@100.109.207.54`).
- **H11 — Non-default `speed`.** All timing constants measured at `-r 175`. The user-configurable 0.5–2.0 range (`ttsTypes.ts:17`) may move the 765/129 fit and the 0.88 s break-even.
- **H12 — Mis-tap recovery.** The single riskiest human assumption: does a non-technical user who hears the machine start talking attribute it to the icon they pressed two seconds earlier, and reach for that same icon to stop it? Only falsifiable in front of a real person.

---

## Rollback: if the in-composer surface regresses normal typing

Five layers, cheapest first.

1. **`useVoiceSessionSafe()` returns `null` outside a provider** (and outside a matching `conversationId`), and every composer read is written `voiceX ?? existingX`. Removing the one JSX wrapper in `ChatLayout/index.tsx:318` reverts the composer surface entirely: parent `placeholder`, parent `renderActionButtons()`, existing focus ring, `runningIndicator` restored. **Correction to the draft (testability):** this does _not_ mean "no test outside the voice suites changes" — `tests/unit/sendboxQueue.dom.test.tsx` changes in V8 and must stay changed.
2. **One module-level kill switch** beside `ACOUSTIC_BARGE_IN_ENABLED` (`VoiceConversationMode.tsx:80`): `VOICE_IN_COMPOSER_ENABLED`. `false` → the provider still owns the session, the composer renders nothing voice-related, and the orb re-mounts its own entry button. One boolean, shippable in a patch.
3. **Chunking has its own switch**, `VOICE_STREAM_SENTENCES_ENABLED`. **Corrected (testability #8, accepted):** flag-off is _not_ "byte-for-byte today's single-clip path" — today's path is `new Audio(url)` + `addEventListener('ended')` (`VoiceConversationMode.tsx:340-352`) and the existing suite drives re-arm through its `MockAudio` and `lastAudio.fire('ended')` (10 references). Byte-for-byte is only reachable if the `HTMLAudioElement` implementation is genuinely retained. **Decision: retain it as a second, flag-selected path** until H3 passes on a packaged build and one release ships with chunking on; V29 then deletes it. Acceptance for layer 3 is the **ported** session suite from V4 passing with the flag off, not the unchanged file (V11 deletes the entry button those 9 tests click).
4. **The typing invariants, as a named regression file** `tests/unit/composerTypingUnaffected.dom.test.tsx`, run across all 12 machine states: the textarea is never `disabled`; Enter sends the draft; focus is never stolen; the highlight overlay stays metric-aligned (already pinned at `sendboxAtFileMenu.dom.test.tsx:308`); and **`value` changes only from user input, with exactly one exception — V16's staged-attachment hand-off, which is asserted separately and only fires when files are staged.** If any go red, revert to layer 1; do not patch forward.
5. **No new send path exists.** Voice turns already enter the same `onSend` as typed chat via `useVoiceTurnSubmission` (registered by all six wrappers: WCore:400, Gemini:360, OpenClaw:497, Nanobot:316, Acp:326, Remote:399). Nothing here changes that, so a voice regression cannot lose a _typed_ message. **It can misfile a spoken one** — that is what V4(d) closes.

**Blast radius, plainly.** Two shared files carry real risk: `sendbox.tsx` (every conversation surface) and `ChatLayout/index.tsx` (provider mount, also rendered by `TeamPage.tsx:555`). The sendbox edits are confined to: `:1327`/`:1340` (a11y names), `:1353-1358` (status slot), `:1362-1377` (action slot), `:1436-1437` (ring), `:1608` (placeholder, secondary), and `:1652-1691` collapsed into one by V9.

---

# RUN SHEET

## Phases

| Phase                     | Steps                                               | Gate to exit                                                                                                                                |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 — Readiness truth**  | V1, V2, V3                                          | `voiceReadiness.test.ts` table green with its positive-control row; V3's renderer==main provider test green                                 |
| **P1 — The lift**         | V4, V5, V6, V7                                      | V4's no-Router mount test green; V4(d) undefined-config test green; provider-scoping test green; the ported session suite green             |
| **P2 — Composer surface** | V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18 | `composerTypingUnaffected.dom.test.tsx` green across all 12 states; exactly one `/voice conversation/i` control; H6/H7/H8/H9 scheduled      |
| **P3 — Chunking**         | V19, V20, V21, V22, (V23)                           | **H3 passed on a packaged build** — hard gate. Then the queue suite green including the epoch/`stopAll`/suspended-context negative controls |
| **P4 — Hardening**        | V24, V25                                            | Circuit-breaker and wall-clock tests green                                                                                                  |
| **P5 — Later**            | V26, V27, V28, V29                                  | Not scheduled here                                                                                                                          |

**H3 runs at the START of P3, before V22 is written.** If it fails: ship the two-chunk fallback (V19 + V20 only), skip V21/V22, and stop.

## Serialization — steps that touch the same file

Anything in the same row must run **strictly in the listed order, one at a time**. Rows are independent of each other only where no file is shared.

| File                                                                     | Steps, in order                             | Note                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/renderer/components/chat/sendbox.tsx`                               | V8 → V9 → V10 → V11 → V12 → V13 → V15 → V16 | **SERIALIZED.** The single highest-contention file in the plan. V9 must land before V10–V13 or every edit is done twice. |
| `src/renderer/pages/conversation/voice/VoiceConversationMode.tsx`        | V4 → V6 → V7 → V11 → V18 → V20 → V22        | **SERIALIZED.** V4 is a pure move; nothing else touches this file until it lands.                                        |
| `src/renderer/hooks/voice/useVoiceConversationSession.ts` (new, from V4) | V4 → V5 → V6 → V7 → V18 → V20 → V21 → V22   | **SERIALIZED.**                                                                                                          |
| `tests/unit/sendboxQueue.dom.test.tsx`                                   | V8 → V9 → V11 → V12                         | **SERIALIZED. V8 first, always** — before it, no accessible-name assertion in this file means anything.                  |
| `tests/unit/renderer/conversation/VoiceConversationMode.dom.test.tsx`    | V4 → V11 → V22                              | **SERIALIZED.** V4 and V11 retarget the 9 entry clicks **in one commit**.                                                |
| `src/renderer/pages/conversation/components/ChatLayout/index.tsx`        | V4                                          | Single toucher.                                                                                                          |
| `src/common/voice/voiceResponseText.ts` + its test                       | V19                                         | Single toucher — **fully parallel with all of P0/P1/P2**.                                                                |
| `src/renderer/components/settings/.../ToolsModalContent.tsx`             | V3                                          | Single toucher.                                                                                                          |
| `src/common/types/ttsTypes.ts`                                           | V1                                          | Single toucher.                                                                                                          |
| `src/common/voice/voiceReadiness.ts` (new)                               | V2                                          | Single toucher.                                                                                                          |
| `src/renderer/components/chat/SpeechInputButton.tsx`                     | V14 → V15                                   | SERIALIZED (small).                                                                                                      |
| `src/renderer/hooks/chat/useInputFocusRing.ts` + `sendbox.css`           | V13                                         | Single toucher. Nine suites mock `useInputFocusRing`; additive fields are safe.                                          |
| `src/renderer/hooks/system/useSpeechInput.ts`                            | V25                                         | Single toucher.                                                                                                          |
| i18n locales (12 files)                                                  | V14                                         | Single toucher.                                                                                                          |

**Safe to parallelize:** {V1} ∥ {V2} ∥ {V3} ∥ {V19}. Everything from V4 onward funnels through the two serialized columns above.

**Commit discipline.** V4 is one commit that changes no behaviour. V8 is one commit whose only observable effect is a red-then-green rewrite of existing assertions. Every other step lands with its own test in the same commit, and every test listed as "write it failing first" must be shown red before it is shown green.

---

# ADDENDUM — measured on real hardware with Sean listening (2026-08-10)

Everything here was produced by executing `say` and graded by ear, not inferred.
These supersede the corresponding assumptions above.

## M1 — Streaming is justified. Time to first audio 5056ms -> 953ms.

Five-sentence reply, `system-native`:
one-shot synth 5056 ms, audio 10.76 s
per-sentence first chunk 953 ms; chunks 899-1280 ms each; total synth 5007 ms
Synthesis comfortably outpaces playback, so the pipeline will not starve.
**4.1 seconds earlier to first sound** is the whole case for V19-V22.

## M2 — Gapless is FINE. Drop the padding constant. (amends V22)

Naive concatenation loses 1.75 s of inter-sentence pause across 4 boundaries
(437 ms each) versus a one-shot render. I built a padded variant to restore it.
**Sean graded one-shot / gapless / padded as indistinguishable.**
=> V22 keeps simple gapless queueing. Do NOT implement the 437 ms pad. A
measurable difference that no listener can hear is not a defect.

## M3 — The "pronouncing the grammar" defect is INTONATION, not timing.

D raw commas 3.82 s <- what ships today; Sean: sounds like it
is reading the punctuation
E comma -> [[slnc 150]] 3.87 s <- Sean: "less rushed and more natural" WINNER
F commas deleted 3.38 s <- Sean: rushed

D and E are the same length. The difference is that `say` performs a grammatical
intonation contour at a comma. Deleting the comma removes the contour AND the
breath (F, rushed). The fix is to remove the comma and reinsert the breath as
explicit silence.

**RULE: strip syntactic commas, substitute an explicit silence of ~150 ms.**

## M4 — Prosody normalization is PER-PROVIDER. (new constraint)

`[[slnc N]]` is a macOS `say` speech command. Sent to a hosted provider it would
be spoken literally or ignored. So normalization CANNOT be one function for all
providers: `normalizeVoiceResponseText` must stay provider-agnostic (markdown,
safety, length) and a separate prosody adapter must run per provider.
A single shared normalizer emitting `[[slnc]]` would make OpenAI TTS read
"bracket bracket s l n c" aloud. This is a blocking design constraint on V19.

## M5 — The normalizer also has the INVERSE bug: lists collide.

src/common/voice/voiceResponseText.ts strips the bullet marker
(`.replace(/^\s*[-*+]\s+/gm, '')`) and then joins lines (`.replace(/\s+/g,' ')`),
so "- one\n- two" becomes "one two" with no boundary at all. Measured: bullets as
today 3.23 s vs bullets as sentences 4.57 s.
**RULE: list items become sentence boundaries.** Written structure must be
converted INTO prosody, not deleted. Commas down, list boundaries up.

## M6 — Provider ladder with a guaranteed local floor. (new, amends V3)

Pieces already exist but are not chained.
speech in : OpenAI Whisper -> Flux Voice -> local Whisper (localWhisper.ts)
speech out: OpenAI TTS -> Flux Voice -> system-native `say`
Two rules that make this a design rather than a list:

1.  The bottom rung is ALWAYS local. Voice must never hard-fail on a missing key
    or a dropped network. Robotic-and-working beats silent, and silent is exactly
    the failure Sean hit on 2026-08-10.
2.  Fallback is ANNOUNCED once in the UI, never silent. Silent degradation is how
    a user concludes their microphone is broken.
    RISK: `localWhisper.ts` has NO test file (verified; control - the same search
    found textToSpeech.test.ts). The guaranteed floor is currently the least proven
    rung in the chain. Exercise it before leaning on it.

## M7 — Calibrate the endpointer from the mic check, do not ship universal constants. (new; amends V21/V25)

Sean pointed out the app ALREADY has a microphone test:
`src/renderer/pages/settings/VoiceSettings/MicrophoneCheck.tsx` - device picker,
4-second timed window, level bar, single grade.

**It does not answer the endpointing question, and the reason is a trap.**

| surface                                                | measures       | "no signal"/"speech" bar               |
| ------------------------------------------------------ | -------------- | -------------------------------------- |
| MicrophoneCheck (`peakOverWindowRef`, :26-29)          | PEAK amplitude | 0.02                                   |
| endpointer (`Math.sqrt(sum/n)`, useSpeechInput.ts:344) | RMS            | 0.02 (`ENDPOINT_SPEECH_THRESHOLD_MIN`) |

Same number, same 0-1 range, DIFFERENT QUANTITY. Speech crest factor is ~3-5x, so
a 0.12 peak is roughly 0.025-0.04 RMS. Anyone comparing the two 0.02s concludes
the systems agree; they do not. Do not "reconcile" these constants - they are not
comparable.

### The change

MicrophoneCheck already owns getUserMedia, a device list, an AnalyserNode and a
timed window. Add an RMS track beside the existing peak track and make the check
TWO-STAGE:
stage 1 "stay quiet" -> record room-tone RMS
stage 2 "say something" -> record speech RMS
Persist both PER DEVICE (deviceId), and have the endpointer PREFER stored
calibration over ENDPOINT*SPEECH_THRESHOLD_MIN / ENDPOINT_NOISE_FLOOR*\*.

### Why this is better than tuning the constants

- Today 0.02 is a guess applied to every room and every microphone on earth. The
  defect the cross-audit found - a room reading above the bar means the detector
  never stops listening - is not fixable by picking a different global number,
  only by measuring the actual device.
- It removes the "your room is unusual" failure class rather than re-tuning it.
- It closes a real UX gap: the current grade cannot distinguish "quiet room, loud
  voice" (ideal) from "loud room, loud voice" (endpointing will struggle), which
  is exactly what a user needs to know BEFORE trying a conversation.
- Calibration is a thing a non-technical user already understands ("test your
  mic"), so it costs no new concept.

### Rules

- Falling back to the constants MUST still work uncalibrated - never block voice
  on having run the check.
- Store per deviceId; a changed default input invalidates the calibration.
- If measured room tone >= measured speech, the calibration is nonsense: discard
  it, say so in the check, and fall back to constants.
- MUST land before V25 (wall-clock caps), which the audit said should come from
  real validated numbers - this is where those numbers come from.
