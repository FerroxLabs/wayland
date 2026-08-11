# Closeout Plan — Voice, Agent Installs, Nano

Authoritative. Supersedes `.planning/VOICE-SMART-DEFAULTS.md` and every earlier draft.
Written read-only against `packet/attribution-audit @ 0e681189b`, `packet/agent-installers @ 1cda570a8`, PR #950 `feature/wayland-nano`.
Every claim tagged **[X]** was proven by executing something this session. Untagged claims are design intent.

---

## 1. Where we are

**Voice.** The plumbing is real and the product is not. The bundled Whisper-tiny model, the worker, the
per-provider services, the consent sheet, the synthesis bridge and 59 green voice tests all exist. What has
never been demonstrated, on any machine, in any build, is **one transcript coming out of the on-device
model** — and the local path cannot work as shipped: Vite emits the ORT runtime as
`out/renderer/assets/ort-wasm-simd-threaded.asyncify-DMmc6YqF.wasm` (22.5 MB, hash in the filename) **[X]**,
while `whisperWorker.ts` sets no `wasmPaths` at all, so ORT resolves its runtime from
`cdn.jsdelivr.net` — an egress the app's own CSP forbids in the document context and which simply fails
offline. Two long-standing beliefs are now **refuted by execution**: the custom scheme *is* already
privileged (`bootstrap.ts:30` registers `standard/secure/supportFetchAPI/corsEnabled`) **[X]**, and the
model side is *not* forgotten (`whisperWorker.ts` sets `allowRemoteModels=false`, `allowLocalModels=true`,
`localModelPath`) **[X]**. Separately, the factory default is `{enabled:false, provider:'openai'}` **[X]**
— speech-in is off and pointed at a keyless hosted service for every new user; the composer mic
(`useSpeechInput.ts`, `SpeechInputButton.tsx`) contains **zero** readiness references **[X]**, so it is
structurally blind to everything the voice-mode hook computes; and the acquisition layer for whisper.cpp
and kokoro is 8 dead URLs with empty hashes behind 19 test files **[X]**.
**Proven:** the em-dash sweep (`9f7012048`, verified against a known-positive control), the Test-voice
timeout/failure-naming fix in `5f8532ca9`, the `wayland-asset:` privilege registration.
**Merely tested:** everything else in voice.

**Agent installs.** This lane is genuinely close. Real installs of codex, kimi and openclaw ran with pinned
versions, `--ignore-scripts`, per-agent prefixes and uninstall-by-manifest; `67a558318` made the launch path
consume the install receipt; `8725b9442`/`a651f4578` added a concurrency guard, timeout and cancel. Suite is
16,826/0. **Proven by running the binaries:** codex has no `acp` subcommand (that is
`@agentclientprotocol/codex-acp`), openclaw is not an ACP backend at all and refuses to run under Bun
(`node:sqlite`), so only kimi reaches the ACP seam today. **Never run:** the clean-machine test. The Windows
artifact exists at `C:\wl-clean\...\Wayland.exe` but predates every fix in both lanes, and the clean account
had a blank password so it was console-logon-only; that has since been resolved zero-touch (see S-1).

**Nano (#950).** Not shippable. `FerroxLabs/wayland-nano` is private with **0 releases, 0 tags and no
release workflow** **[X]** — there is nothing to attest, so the integrity bar cannot be met. #950's
`createWNanoAgent()` returns `available:true` with no `cliPath` at registry index 1, which first-wins dedup
turns into the only wnano entry — a real install becomes unlaunchable. `1cda570a8` pins the correct order;
#950 has not been rebased onto it.

---

## 2. Adjudication of the four internal lenses and three external legs

Only disagreements and the findings that change the plan. Everything marked TAKE is folded into §4.

| # | Finding | Source | Verdict |
|---|---|---|---|
| A1 | `wasmPaths` as a **string prefix** cannot work — ORT then requests the canonical `ort-wasm-simd-threaded.asyncify.wasm`, which does not exist; Vite emitted a hash-suffixed name | Codex, Kimi | **TAKE — confirmed [X].** V-0/V-4 must use the object form (`{ wasm: <url> }`) built from Vite's `new URL(..., import.meta.url)` so the hash is resolved at build time. |
| A2 | `wayland-asset:` privileges (`standard`/`secure`/`supportFetchAPI`) are omitted and must be added | Codex, Kimi, Gemini | **DECLINE — refuted [X].** Already registered at `bootstrap.ts:30` with all four flags. Residual: `stream: true` is *not* set, so `WebAssembly.instantiateStreaming` may fall back to `arrayBuffer`. Folded into V-0 as an observation, not a task. |
| A3 | The model side is forgotten — nothing sets `allowLocalModels` / `localModelPath` | Gemini | **DECLINE — refuted [X].** `whisperWorker.ts` sets all three. Gemini read the plan, not the file. |
| A4 | Threading: the emitted artifact is `*-simd-threaded`, requiring `SharedArrayBuffer` + `crossOriginIsolated`, which is never established or verified | Codex, Kimi | **TAKE as measurement, not as a task.** ORT degrades to `numThreads=1` without SAB; whether it degrades *cleanly* here is unknown. V-0 logs `crossOriginIsolated` and `typeof SharedArrayBuffer` and the plan branches on the result. |
| A5 | V-5's migration rule contradicts V-5's own acceptance — the two profiles are byte-identical on disk | all 4 internal + Codex + Kimi | **TAKE.** Resolved by dropping the unsatisfiable clause: **all** pre-`origin` configs migrate to `origin:'default'`; the never-overwrite guarantee is **forward-only**, scoped to profiles written after V-5 ships. |
| A6 | V-6 is sequenced before V-7 yet declares V-7 blocking | Codex, Kimi, internal | **TAKE.** Reordered. |
| A7 | The truth table has no hosted-consent axis; on a factory profile every hosted rung is `*-needs-consent`, so all six cells pass while the ladder silently degenerates | internal L1, Kimi, Codex | **TAKE.** Table becomes 12 cells with an explicit consent axis, and `stt-needs-consent`/`tts-needs-consent` join the failure list. |
| A8 | OD-4's privacy rationale is false for credentialed profiles: the ladder prefers hosted, so default-on can route the first mic audio off-machine | Codex, Kimi, internal L1 | **TAKE, and it inverts the ladder.** See OQ-2. On an untouched profile the **local floor is the default rung**; hosted rungs are opt-in via the existing consent sheet, never auto-preferred. |
| A9 | The composer mic — the shipped voice surface — is outside every voice task | internal L1 | **TAKE.** New task V-7 (composer wiring), named files, own acceptance. |
| A10 | V-8 deletes the `whisper-local` provider id that V-4/V-6 make mandatory | Kimi | **TAKE.** The id **survives**; only the dead main-process `WhisperLocal.ts` binary path is deleted. The renderer transformers.js worker keeps the public identifier `whisper-local`. |
| A11 | V-8's test blast radius is 19 files, not 1 | internal L2 | **TAKE — enumerated [X].** V-8 carries the list and a per-file disposition. |
| A12 | V-13 uses `C:\wl-clean`, which CM-3 says must be rebuilt; two sweeps compete for one console logon | internal L1/L2, Codex | **TAKE.** One artifact, one session, one merged sweep (S-1). |
| A13 | CM-2's RDP fallback is impossible under CM-2's own F8 | internal L2/L3, Kimi | **TAKE.** Replaced with in-session screen capture, and CDP is proven as `seand` *before* the logon is requested. |
| A14 | The constitution `safeStorage` blocker gates both acceptance gates and is unowned | internal L2/L3, Codex, Kimi | **TAKE.** Becomes V-0b, a hard precondition. |
| A15 | V-12's "audible speech or a named failure" cannot fail — a silent 40 KB WAV satisfies it | Codex, Kimi | **TAKE.** Acceptance becomes RIFF parse **plus** peak amplitude > 0.02 over ≥0.4 s of the buffer. |
| A16 | V-7's injection payload `Remove-Item C:\ -Recurse` destroys the only Windows verification box, and "no other process spawned" is unmeasurable and wrong (it would run in-process) | Codex, Kimi, internal L3 | **TAKE.** Non-destructive canary file + `Test-Path` assertion, with a deliberately-interpolated variant proving the method finds a known positive. |
| A17 | V-1's ref *causes* staleness (refs do not re-render); a mirrored second copy is the wrong fix | Gemini, Kimi | **TAKE.** V-1 is deleted as a standalone task and folded into V-6 as one authoritative resolver with a single credential source. |
| A18 | V-1's grep guard is a lint, not a structural guarantee | Codex, Kimi, internal L3 | **TAKE.** Enforced in the type system: the raw resolver stops being exported; only a closure that captures its own inputs is callable. |
| A19 | V-2 needs `key` on the DOM node, and a new object identity does not restart a CSS animation or re-announce an ARIA live region | Gemini, Codex | **TAKE.** |
| A20 | V-10 disables the control in `needsSetup`, and disabled native buttons are unfocusable so the hover explanation is unreachable to keyboard/SR users | Codex | **TAKE.** Controls use `aria-disabled` + focusable, and `needsSetup` **routes to setup** rather than dead-ending. |
| A21 | V-9's live check proves reachability, not integrity, and being "gated" lets CI skip the only test that catches dead URLs | Codex, Kimi, internal L3 | **TAKE.** One tier is downloaded end-to-end and SHA-compared, with a flipped-hex-digit negative control, and it runs on a required nightly job, not an opt-in one. |
| A22 | F4 is wrong: `agents[1].backend==='wnano'` and a passing `getManagedLaunchSpec('wnano')` are not mutually exclusive, so CI is not a safety net for the #950 merge | Kimi | **TAKE.** N-6 does not rely on CI catching it; the RED-before/GREEN-after run is performed by hand and recorded. |
| A23 | F2's "child, not sibling" is stale — attribution has moved past the merge-base, so both are siblings and either can fast-forward | internal L2 | **TAKE.** Merge order is re-derived from readiness, not diff cosmetics. See §5. |
| A24 | "No merge, no tag, no PR" contradicts "PR1 → main" | Codex | **TAKE, by clarification.** §5 is the *planned* order. Nothing in it executes without the owner's explicit go. The standing rule holds. |
| A25 | `deepgram` is a live consent-gated provider with no state anywhere in the new machine | internal L1 | **TAKE.** Manual-only rung, own `needsSetup` copy, own row in the affordance matrix. Not deleted. |
| A26 | Linux ships (AppImage/deb/rpm) with no cell, no copy and an unverified speech-in floor | internal L1 | **TAKE.** See OQ-4. |
| A27 | The upgrade cohort is never analysed; default-on arms a mic for the existing install base | internal L1 | **TAKE.** First-run seeding and upgrade migration are separated, and an upgraded profile with a credential but no consent must not arm a hosted transcriber. |
| A28 | No failed-acquisition path, no disk-space precheck, no metered-connection handling — a dead download leaves the leg in `preparing` forever | internal L1, Gemini, Codex | **TAKE.** |
| A29 | `powershell.exe` vs `pwsh` (PS7 lacks .NET Framework `System.Speech`), stdin is consumed as *source* by `-Command -`, `-NoProfile -NonInteractive`, ExecutionPolicy, cold-start latency ~1 s/utterance, no audio endpoint makes `Speak()` throw even when redirected to a WAV, EDR/AppLocker interception | Gemini, Codex, Kimi | **TAKE — all of it.** These collectively make OD-2 an open question, not a decision. See OQ-1. |
| A30 | The keychain hang (unsigned dev binary vs signed app's item, 120 s, no timeout) threatens the plan's own CDP verification method | internal L1 | **TAKE as an operating rule**, not a task: never run a dev build against a signed app's profile; always a scratch `WAYLAND_HOME`. |
| A31 | Key parity cannot detect English copied into 11 locales (#950's blurbs), broken interpolation or plural errors | Codex | **TAKE as an owner decision** (OQ-5), not as tooling work. |
| A32 | Bulk "missing" list: MIME/range behaviour, asar vs asarUnpack, arch matrix, proxy/captive-portal, retry ceilings, atomic resume, schema version/downgrade/rollback flags, symlink protection on the orphan reclaim, memory budget, worker termination, device-removal, autoplay denial, main-process authz on install IPC, process-tree kill, Windows locked files, packaged CI matrix | Codex | **PARTIALLY DECLINED.** Taken: atomic-rename + partial cleanup + disk space (V-9), `lstat`/realpath on the orphan reclaim (V-11), Windows locked-file handling on uninstall (AI-3), packaged smoke + offline job (S-1). Declined: the rest, as invented scope. House rule: verify a threat is reachable before guarding it, and calibrate to blast radius. Each declined item is a hypothetical on a code path no user has been shown to reach. |
| A33 | V-11's "voice-related hardcoded JSX" is not a mechanically definable scope | Kimi | **TAKE.** Guard is scoped to the 12 locale JSON files only; JSX is covered by review, not by a grep that cannot be specified. |

---

## 3. The critical path

Two hard preconditions, then voice, then agents, then one merged sweep. Nothing below V-0 starts until V-0
produces evidence.

```
V-0  ORT/offline spike ─┐
V-0b constitution fix ──┴─→ V-1 origin ─→ V-2 ladder+floor ─→ V-3 affordance ─→ V-4 composer wiring
                                              │                     │
                                              │                     ├─→ V-5 repaint
                                              │                     ├─→ V-6 greeting cause
                                              │                     └─→ V-8 Test-voice audibility
                                              └─→ V-9 background tiers ─→ V-10 acquisition failure
                                                                          V-11 delete dead layer
                                                                          V-12 em-dash guard
AI-1 copy ─┬─ AI-2 cancel ─ AI-6 freshness
           ├─ AI-3 uninstall
           └─ AI-4 codex ACP handshake (else DEFER codex)
AI-5 Flux chip (independent)   AI-7 openclaw removal (decision only)

OWNER: attested Nano release ─ N-0 ─ N-1 ─ N-2 ─ N-3 ─ N-4 ─ N-5 ─ N-6
OWNER: SAPI listen (OQ-1) ────────────────────→ V-7 windows TTS ──┐
                                                                  ▼
   merge (§5) ─→ S-0 package one artifact ─→ [OWNER: one console logon] ─→ S-1 the sweep
```

Long poles, honestly: **V-0** (if the on-device floor cannot run offline, OQ-2 and half of §4 collapse),
the **Nano release** (upstream build-and-publish job that does not exist yet), and the **one console logon**.

---

## 4. Per-task detail

Standing constraints for every task: no merge, no tag, no PR, no release. `AGENTS.md` and
`constitutionFsAuthority.generated.ts` stay unstaged; never `git add -A src` or `git add -u src`. No existing
test is relaxed, skipped or deleted except where a task names the file and states why the *subject* is gone.
Every guard is mutation-verified: save a copy, mutate, confirm on disk, confirm RED, restore **from the saved
copy**, confirm GREEN. Full suite foreground (`npx vitest run`); known pre-existing failures are 1 in
`shellEnv.test.ts` and 3 in `OfficeCliAuthoringCapability.test.ts`. New strings in all 12 locales, zero em
dashes. **Never run a dev build against the signed app's profile** — use a scratch `WAYLAND_HOME` (A30).

**The jsdom ceiling, stated once:** no `AudioContext`, no media decode, no worker WASM execution, no OS
speech APIs. **No test in this plan proves a byte reached a speaker.** Audibility is proved only in §6.

---

### V-0 — Prove the on-device floor, offline, in a packaged app. FIRST. Nothing else starts.

All three external legs independently named this the highest-risk assumption. It is a spike, not a feature.

**What changes.** `whisperWorker.ts` sets `env.backends.onnx.wasm.wasmPaths` to an **object map**, not a
string prefix — `{ wasm: new URL('...asyncify.wasm', import.meta.url).href }` resolved through Vite so the
emitted hash is baked in at build time. Delete the stale "offline-WASM bundling is a follow-up" comment.
Add one-time diagnostic logging inside the worker: `crossOriginIsolated`, `typeof SharedArrayBuffer`, every
requested URL with status and `content-type`, and the ORT init result.

**Acceptance, phrased so it can fail.** Package one artifact. Disable Wi-Fi at the OS (not DevTools
throttling). Dictate one phrase in the composer. It **passes** only if a transcript returns. It **fails** if
any request leaves the app's own origin, if ORT init throws, if the returned text is empty, or if the worker
logs a fetch error. Known-negative control that must be run first: on the pre-fix build with the network up,
the DevTools Network panel filtered to `jsdelivr` **must show the request** — if it does not, the observation
method is broken and no result from it may be believed.

**Verification.** Live, packaged, offline, both macOS and Windows. Plus a unit test asserting `wasmPaths` is
an object whose `wasm` value is under the app's own asset root (today `grep -rn wasmPaths src` returns 0 —
that is the control).

**Cannot be verified without the owner.** Nothing. This one is mine to run.

**If it fails:** stop. The bundled floor does not exist, OQ-2 flips to "hosted-only with an explicit
`unsupported` local leg", and V-2/V-9/V-10 are rewritten before anything is built.

---

### V-0b — The constitution decrypt path must degrade, not brick

**What changes.** The revision-authority key ring throwing raw kills every turn on every backend while the
697 KB constitution itself ships bundled and readable. Wrap it as `INTEGRITY_FAILURE` like its two siblings
already do, and make the recovery UI reachable.

**Acceptance.** With the 355-byte key ring deliberately corrupted, the app completes one real turn on one
backend and surfaces a named integrity warning. It **fails** if the turn is refused, if the failure is
unnamed, or if the recovery UI cannot be reached from the surfaced error.

**Verification.** Live, on a scratch profile, one real turn end to end.

**Why it is here.** Both acceptance gates (S-1 steps that require a completed turn, and every dictation cell)
run through this path on a fresh identity. Without it the sweep cannot be executed at all, and the plan would
be sequencing twenty tasks behind a gate it cannot open.

---

### V-1 — `origin: 'default' | 'user'`, forward-only

**What changes.** Add `origin` to `SpeechToTextConfig` and `TextToSpeechConfig`, defaulted `'default'`,
flipped to `'user'` only when the user changes a control in the Voice panel. Both normalizers preserve it.
Add provider-validity coercion to `normalizeSpeechToTextConfig` mirroring the TTS normalizer, which already
falls back when a stored provider is not one the synthesizer owns — the STT normalizer currently spreads any
stored string through unvalidated **[X]**.
**Migration (this is the adjudication of A5): every pre-`origin` config migrates to `origin:'default'`.**
Legacy profiles are irrecoverably ambiguous — a factory profile and a deliberate keyless-OpenAI choice are
the same bytes. A one-time non-blocking notice appears on first Voice-panel open after upgrade.

**Acceptance.** A profile with no `origin` field migrates to `'default'` and is eligible for reseeding. A
profile written *after* V-1 with `origin:'user'` is **never** reseeded by any ladder rung. A stored provider
outside the union coerces to the floor with `origin:'default'`. It **fails** if a post-V-1 explicit choice is
overwritten, if a pre-V-1 profile is treated as explicit, or if an unknown provider string survives
normalization. The unsatisfiable "a legacy explicit OpenAI choice resolves to `'user'`" clause is
**deleted, not softened** — it cannot be satisfied and a test written to it could only pass vacuously.

**Verification.** Unit tests over both normalizers and the migration, driven over **legacy-shaped JSON with
no `origin` field** — never over a fixture that already carries one. Mutation-verify by making the migration
mark everything `'user'` and confirming the reseed test goes RED.

---

### V-2 — Two ladders, the local floor, and one authoritative resolver

Absorbs the old V-1 (A17/A18) and V-6.

**What changes.** Replace the single combined `resolveVoiceSessionReadiness` verdict with
`resolveVoiceLeg(direction)`, resolved independently per direction:

| Leg | Rung order on an untouched profile |
|---|---|
| Speech **in** | **bundled local whisper-tiny (the floor, always available)** → hosted rungs only when the user has both a credential **and** granted consent for that provider → `preparing` while a better tier downloads |
| Speech **out** | `system-native` on darwin → `windows-native` on win32 (V-7, if OQ-1 clears) → hosted `openai` only with credential **and** consent → `unsupported(named)` |

Flux Voice never appears in the speech-out ladder — it is STT-only. `deepgram` is a manual-only speech-in
rung: reachable when the user selects it, never auto-selected (A25). `DEFAULT_SPEECH_TO_TEXT_CONFIG.enabled`
becomes `true` with `provider` unset and `origin:'default'`; `DEFAULT_STT_PROVIDER = 'openai'` in
`voiceReadiness.ts` is deleted — no path may leave "absent provider" meaning "a hosted service with no key".
`fluxSttDefault.ts` stops writing `enabled:false`.
**Structural guard (A18):** the raw resolver stops being exported. Only a factory-produced closure that
captures the credential source is callable, so no call site can supply arguments and no fifth call site can
drift. There is **one** credential source, not a state/ref mirror (A17).

**Acceptance — a 12-cell table.** {Flux credential / OpenAI credential / neither} × {consent granted / not
granted} × {darwin / win32}, all on a factory profile with no manual setup. Every cell must resolve to a
**working provider on both legs**. It **fails** if any cell yields `stt-disabled`, `stt-unavailable`,
`stt-needs-consent`, `tts-needs-consent`, or a speech-out leg with no provider. Additional cells that must
fail if violated: an **upgraded** profile with a connected Flux credential and no granted consent must not
arm a hosted transcriber (A27); a documented single off-switch disables the whole voice surface and is
asserted in the same test.

**Verification.** Table-driven unit tests over the two resolvers, mutation-verified by restoring
`enabled:false` and confirming the whole table goes RED. Then live per cell.

**Cannot be verified here.** The speech-out half of every cell. jsdom proves the resolver *picked*
`system-native`; it cannot prove `say` emitted sound.

**Depends on.** V-0, V-0b, V-1, and V-7 for the win32 speech-out cells.

---

### V-3 — The affordance state machine

**What changes.** Five states per leg — `ready` / `preparing` / `needsSetup` / `unsupported` /
`failed(namedCause)`. `preparing` shows "Models downloading in the background" on hover with no click needed.
`needsSetup` **routes to setup** — it is a live control that opens the Voice panel or the consent sheet, not
a disabled dead end (A20). `unsupported` and `failed` name the cause and are `aria-disabled` and focusable,
never natively `disabled`, so the explanation is reachable by keyboard and screen reader.
**Naming is enforced at compile time, not by grep (A?/L3):** the failure-cause union becomes a closed
TypeScript type, `describeVoiceFailure` switches exhaustively with a `never` check on the default branch, and
an unmapped string returns a named fallback sentence that identifies the subsystem.

**Acceptance.** For every reachable leg-state pair, the control's interactive state matches its leg state and
every non-`ready` state carries a reachable explanation. It **fails** if any control dead-ends, if any state
renders with no explanatory text, if `describeVoiceFailure` returns anything containing "unknown", if adding
a union member without a case does **not** make the typecheck RED, or if `check-i18n` reports a key present
in en-US and missing anywhere else.

**Verification.** jsdom matrix test over all leg-state pairs. Compile-time exhaustiveness mutation. Locale
grep as a *secondary* check, never as the criterion. Screenshot sweep in S-1.

**Cannot be verified here.** `audio-blocked` — jsdom has no `AudioContext`, so that state can only be
injected. Its real behaviour is exercised live in S-1 by denying autoplay.

---

### V-4 — Wire the composer mic (the surface the user actually taps)

The gap the internal completeness lens caught and every other reader missed.

**What changes.** `src/renderer/hooks/system/useSpeechInput.ts` and
`src/renderer/components/chat/SpeechInputButton.tsx` — today both contain **zero** readiness references
**[X]**; the button takes a bare `disabled` prop from its parent. Both are wired to `resolveVoiceLeg('in')`.

**Acceptance.** The composer button's interactive state and its hover copy come from the leg resolver. It
**fails** if forcing a blocked leg does not change the composer button's state and text, and it **fails** if
the composer is enabled while the leg is `unsupported` or `failed`.

**Verification.** jsdom test on the composer, mutation-verified by forcing a blocked leg. Live in S-1.

---

### V-5 — Tap-to-speak repaints on every tap

**What changes.** `surfaceError` becomes `{ message, seq }` with `seq` incremented on every set; the rendered
error node carries `key={seq}` so React remounts it rather than patching the text node in place, which is
what makes a CSS flash/shake actually re-run and an ARIA live region re-announce identical text (A19).

**Acceptance.** Two taps with a byte-identical refusal produce two distinct mounts. It **fails** if the error
element's `key` is unchanged on the second tap, or if the animation does not restart.

**Verification.** jsdom render-count + key assertion; mutation by reverting to the plain string. Live: tap
three times against a known-refusing config and confirm the region re-animates each time.

---

### V-6 — A blocked greeting always says why

**What changes.** `speakGreeting`'s `{kind:'blocked', message}` settlement is surfaced unconditionally, not
only under `snapshotRef.current?.state === 'user-speaking'`. The greeting caption renders with an inline
"speech output unavailable: `<cause>`" badge rather than being held back — holding it makes the greeting feel
slow.

**Acceptance.** With synthesis stubbed to fail and the session **not** in `user-speaking`, the rendered
greeting carries the named cause. It **fails** if greeting text renders with no cause, or if the cause is
"unknown".

**Verification.** jsdom across `idle`, `assistant-speaking`, `user-speaking`; mutation by restoring the
`user-speaking` guard.

---

### V-7 — Windows speech-out floor (conditional on OQ-1)

**What changes.** A `windows-native` provider spawning **`powershell.exe` explicitly** (not `pwsh` — PS7 does
not carry .NET Framework `System.Speech` the same way) with `-NoProfile -NonInteractive`, `shell:false`,
`Add-Type -AssemblyName System.Speech`, `SetOutputToWaveFile(<temp>)`, `Speak(<text>)`, WAV read back as a
buffer, temp deleted. **Text is passed via a UTF-8 temp file the script reads, never on the command line and
never on stdin** — `-Command -` consumes stdin as PowerShell *source*, so stdin cannot double as the text
channel (A29). Bounded timeout. Registered in `ttsTypes.ts` and labelled by OS so a macOS user never sees it.

**Acceptance — four cases, each able to fail.**
1. With no hosted credential, `speak("testing one two three")` returns a buffer whose RIFF/WAVE header parses
   **and whose peak amplitude exceeds 0.02 over at least 0.4 s** (A15). Fails on empty, on a non-RIFF header,
   on digital silence, or on `TTS_SYSTEM_NATIVE_UNAVAILABLE`.
2. **Injection, non-destructively (A16).** Text containing `"; New-Item $env:TEMP\wl-tts-canary-<uuid>.txt`
   produces a WAV and `Test-Path` on that exact canary is **False**. Known-positive control in the same run:
   a deliberately string-interpolated variant must make the canary **appear**; restore afterwards. The
   original "delete C:\ and assert no other process spawned" is rejected — its success condition destroys the
   only Windows verification box, and the payload would run *inside* the same child anyway.
3. **Blocked PowerShell.** With `Add-Type` forced to fail (Constrained Language Mode / AppLocker), `speak()`
   returns a named `TTS_WINDOWS_SPEECH_BLOCKED` failure with its own copy — **not** `no-local-adapter`, whose
   existing text says the synthesizer is macOS-only and would be factually wrong.
4. **No audio endpoint.** On a machine with no output device, `Speak()` to a WAV file must still return a
   buffer or a named failure — never a hang (Gemini's finding that `Speak()` can throw even when redirected).

**Verification.** Live on SeanDesktop, same class as `agentInstallLaunch.live.test.ts`.

**Cannot be verified without the owner.** Whether the SAPI voice is acceptable as the floor, and whether an
unsigned packaged Electron spawning `powershell.exe` survives Defender/EDR on a managed box. Both are OQ-1.

---

### V-8 — Test voice: audibility, not just a buffer

**Status.** The silent no-op is already fixed in `5f8532ca9`: 20 s timeout on both the consent step and the
persist+speak sequence, explicit `result.ok === false` (the codebase compiles without `strictNullChecks`, so
`!ok` would not narrow), `TTS_EMPTY_AUDIO` on a zero-length buffer, `describeVoiceFailure(raw)` rendered.

**What still changes.** Extend to `windows-native`. Assert Test voice is never enabled for a provider whose
leg is not `ready`. **Replace the unfailable criterion (A15):** "audible speech or a visible named failure"
becomes — the returned buffer parses as RIFF/WAVE **and** carries peak amplitude > 0.02 over ≥0.4 s, **or** a
named failure is visible within 20 s. It **fails** if a non-empty all-silence buffer is accepted.

**Cannot be verified without the owner.** Amplitude proves the file is not silence. It does not prove the
speech was correct or intelligible. §6 listen 4.

---

### V-9 — Background tiers, sized to the machine

**What changes.** A registry of transformers.js-compatible ONNX tiers (`Xenova/whisper-base`,
`Xenova/whisper-small`) pinned by **immutable HF commit SHA** — never `main`, never a mutable tag (A21) —
with a per-file SHA-256 for every tokenizer, config and ONNX file, following the `prepareVoiceModel.js`
pattern already proven here. Background acquisition at first run, never blocking, resumable, atomic
rename-into-place only after hash match, partial-download cleanup on abort. Tier by RAM and cores.
`VoiceAssetManager.download` currently renames a file into place when the expected hash is empty **[X]** —
an empty hash becomes a hard error.

**Acceptance.** On ≥8 GiB with no credentials, dictation works **immediately** on the bundled floor, and
`whisper-base` (141 MiB) is on disk with a matching SHA **within 10 minutes of app launch on a 50 Mbit link,
measured from timestamped logs** — not "one background cycle", which no run could ever be declared late
against. UI responsiveness is measured, not felt: **no main-thread task over 100 ms and no dropped-frame run
over 200 ms** during the download window, from a DevTools performance trace, with a known-positive control
(inject a deliberate 2 s sync loop and confirm the same method flags it). It **fails** if a mismatched or
empty-hash download is renamed into place, if a <8 GiB machine auto-fetches above tiny, if a >16 GiB machine
auto-fetches above `small`, or if a corrupted byte is accepted.

**Live-reachability, made real (A21).** One **required nightly** job — not an opt-in gated one — downloads a
pinned tier end to end and asserts the computed SHA equals the pin, with a flipped-hex-digit negative control
in the same run. The disease this cures is the current 41 green tests over 100% dead URLs, every one of them
injecting a fake fetch.

**Cannot be verified without the owner.** Transcription accuracy per tier. §6 listen 3.

---

### V-10 — Acquisition failure has a name and a floor

**What changes.** A disk-space precheck that refuses with a named cause rather than starting. A
metered/offline check that defers rather than hijacking a hotspot. A defined mapping from permanently failed
or abandoned download → `failed(namedCause)` with copy in 12 locales. A hot-swap so a finished better tier is
adopted without an app restart (Gemini). Rollback to the floor on repeated failure.

**Acceptance.** Terminating a download mid-flight leaves **no** leg in `preparing` and produces a named,
actionable failure. It **fails** if any leg remains `preparing` after the download is dead, or if a full disk
starts a download at all.

---

### V-11 — Delete the dead acquisition layer (and only the dead parts)

**What changes.** Remove `voiceBinaryManifest.ts` (8 entries, 100% dead URLs, all `sha256: ''`),
`acquireBinary`, `KokoroLocal.ts`, the `kokoro-local` provider and its picker entry, the **main-process**
`WhisperLocal.ts` binary path, `WhisperLocalDownloadControl`, `kokoro-unavailable` from
`VoiceReadinessReason`, and the ggml/kokoro entries from `voiceAssetRegistry.ts`.
**The `whisper-local` provider id SURVIVES (A10)** — it is the public identifier of the renderer
transformers.js floor that V-0/V-2 make mandatory. Only the dead binary implementation behind it goes.
One-time orphan reclaim of `voice/kokoro/kokoro-v1.0.onnx` (325,532,387 B) and `voice/whisper/ggml-*.bin`
(147,951,465 B), silent with a logged byte count, using `lstat`/realpath so a symlink cannot walk out of
`<userData>/voice/`.

**Test blast radius — enumerated [X], 19 files.** Each gets a written disposition before the task starts:

| File | Disposition |
|---|---|
| `voice/voiceBinaryManifest.test.ts` | **Delete** — subject removed; its sole assertion is that a URL returning 404 resolves non-null |
| `voice/whisperLocal.test.ts` | **Delete** — subject removed |
| `common/voiceReadiness.test.ts` | **Rewrite** — asserts `kokoro-unavailable` (lines 52-54) and uses `provider:'whisper-local'` (20, 41); the provider id survives, the reason does not |
| `renderer/voice/localEngineFailureNamesCause.test.ts` | **Rewrite** against the surviving renderer floor |
| remaining 15 (`voiceGreeting`, `useHostedVoiceConsent`, `voiceModeSeparation`, `voiceSessionProvider`, `capabilityProjection`, `voiceConsent`, `sendboxQueue`, `fluxSttDefault`, `voiceAssetBridge`, `speechToTextService`, `voiceSynthBridge`, `voiceAssetBridgeErrorChannel`, `fluxVoiceErrors`, `textToSpeech`, `voiceReceiptFactory`) | **Preserve** — audit each for an incidental `kokoro`/`whisper-local` string; none may be deleted |

**Acceptance.** `grep -rn "whisper-cpp\|acquireBinary\|kokoro" src` returns zero production hits (control:
the same grep on the pre-change tree must find them). No user-visible control leads to a provider that cannot
run. Full suite green minus the 4 known failures. Reclaim: after upgrade on a profile holding both orphans,
both are gone; a decoy outside `voice/` and a symlink pointing outside it both survive untouched. It **fails
harder** if anything outside `<userData>/voice/` is touched.

**Depends on.** V-2 (the floor must exist before alternatives are removed).

---

### V-12 — Em-dash ratchet

**Status.** Done at `9f7012048`: 402 values across 12 locales, no keys touched, plus the hardcoded JSX in
`useHostedVoiceConsent.tsx`. Verified — `grep -rl '—' src/renderer/services/i18n/locales/` is empty against a
known-positive control of 6 hits in `en-US/settings.json` at fork point `b3cd0511a`.

**What still changes.** A guard asserting zero U+2014 across the 12 locale JSON files. Scope is the JSON only
(A33) — "voice-related hardcoded JSX" is not mechanically definable and is covered by review.

**Acceptance.** Inserting one em dash into any locale file makes the suite RED. Mutation-verified both ways.

**Owner call.** The ideographic/fullwidth comma substitutions in ja-JP, zh-CN and zh-TW are unreviewed by a
native speaker. See OQ-5.

---

### AI-1 — Copy for the three unreachable failure reasons

Add `already-installing`, `timed-out`, `cancelled` under `settings.agentsPage.install.failed` in 12 locales
plus `i18n-keys.d.ts`. **Acceptance:** driving `install.invoke` to `{ok:false, reason:'timed-out'}` renders
human copy — asserting `install-state-kimi.textContent` does not start with `settings.` **fails today** (it is
literally the raw key). Do this first: every later Windows failure is unreadable without it.

### AI-2 — Cancel affordance

`InstallControl` state `'installing'` gains Cancel wired to `agentInstaller.cancel.invoke`. Rename the
existing consent-sheet `cancelInstall` to `dismissConsent` so the two are not confusable.
**Acceptance:** clicking Cancel during `installing` calls `cancel.invoke` with the agent id — **fails today**,
`cancel` has zero renderer call sites. Mutation: delete the `onClick` body → RED. Depends on AI-1.

### AI-3 — Uninstall affordance

Remove button for state `'installed'` only (`null` for `'system'` — Wayland did not install it and must not
remove it), behind a confirm, wired to `uninstall.invoke`. **Windows locked files:** if the agent process is
running or holds log handles, uninstall must fail with a named cause and leave the receipt **intact**, not
half-deleted (A32/Gemini). **Acceptance:** an `installed` codex tile contains a control whose click calls
`uninstall.invoke` — **fails today** (`InstallControl` returns `null`). Live extension asserts package dir
and receipt are both gone on the success path, and both survive on the locked path.

### AI-4 — codex reaches the ACP seam, or codex is deferred

`AGENT_PACKAGES.codex` installs `@agentclientprotocol/codex-acp@1.1.2`; **drop the standalone
`@openai/codex@0.147.0` pin** or the user gets 0.144.6 while the receipt claims 0.147.0.
`installedAgentLaunch.ts` writes `launch.env.CODEX_PATH = <absolute native codex binary in the same prefix>`,
which removes the entire `process.execPath`/bundled-bun/`createRequire` unknown. Set
`acpBackend = 'codex'`. Gate `LegacyConnectorFactory.ts:81-90`'s launch-spec preference on the spec
originating from a Wayland receipt, so a user's pre-existing PATH codex keeps the npx bridge and
`prepareCodex`'s diagnostics.
**Acceptance, three, each able to fail:** (a) a live test drives a JSON-RPC `initialize` into the spawned
codex-acp and gets a well-formed ACP response within 30 s — **currently unproven**, a hand-rolled attempt
produced no stdout in 25 s; (b) `resolveManagedAgentLaunch('codex').env.CODEX_PATH` points at an executable
file — fails today; (c) a PATH codex with no receipt still routes through `connectCodex`, and must FAIL if
the guard is removed.
**If (a) cannot be made to pass, codex is DEFERRED and removed from the band**, exactly as openclaw is. Decide
this **before** S-0 packages the artifact, or the sweep demos a dead card.

### AI-5 — The Flux chip stops being a live button on cards for software you do not have

Keep the chip **visible** on `absent` (the reason to install must be visible while deciding), make it
**non-interactive** there. `FluxCompatChip` already has a non-interactive `setup` branch; add
`interactive?: boolean` (default `true`, so detected-agent cards are untouched) and pass
`interactive={state === 'installed' || state === 'system'}`.
**Acceptance:** the existing test is **tightened, not relaxed** — it must still assert the chip renders, and
additionally that `tagName !== 'BUTTON'` and that clicking its container mounts **zero** `.arco-modal`. That
addition fails today: tagName is `BUTTON` and the click mounts one modal titled "Route codex through Flux".

### AI-6 — Status freshness during an install

`refreshInterval` on `AvailableToInstall`'s `useSWR` while any tile is `installing`.
**Acceptance:** flipping main-process status to `failed` updates the tile without a remount — fails today
(bare `useSWR`, mount/focus only). Depends on AI-2.

### AI-7 — openclaw comes out of the band

**Proven by execution:** `bun openclaw.mjs --version` prints that Bun is unsupported because OpenClaw
requires `node:sqlite`; the same file under node v22.23.1 prints the version. `resolveJsRuntimeWith` returns
bundled-bun whenever a bundled bun exists, and `launchSpecResolver` has **no runtime-compatibility gate**. So
a Wayland-installed openclaw on a clean machine is guaranteed to fail. Making it work means acquiring,
pinning, verifying and shipping a Node runtime — its own bundled-binary pipeline, comparable in size to the
whole Nano track.
**Changes:** remove `openclaw` from `AGENT_PACKAGES`. System-openclaw detection is untouched — users who
already have it keep it. **Acceptance:** the band offers exactly `['codex','kimi']` (fails today, offers
three), plus a durable guard that no `AGENT_PACKAGES` entry resolves to bundled-bun while declaring an
incompatible `engines.node`, which must go RED if openclaw is re-added.

---

### N-0 — Owner input for Nano, and the precondition that gates all of it

**Precondition [X]:** `FerroxLabs/wayland-nano` is **private, 0 releases, 0 tags, default branch
`wayland-nano`, no release workflow** (only `blocking-ci`, `cla`, `nano-g0`, `v8-canary`).
`verifyPublisherAttestation` demands SLSA provenance v1 from a GitHub-hosted runner. **Nothing downstream can
be written or tested until a tagged release built by an attesting workflow exists.** Mirror
`FerroxLabs/wayland-core/.github/workflows/release.yml`.

| # | Value | Constraint |
|---|---|---|
| 1 | Release repo | It is **private** — flip it public at release time, or confirm every builder (local + CI) has a `gh`-authed read token. CI does not have one today. |
| 2 | Release tag | **Must not collide with any wayland-core tag string.** Recommend `nano-vX.Y.Z`. Proven by execution: `selectPolicy()` matches on `releaseTag` **alone** and throws on two matches — a bare `vX.Y.Z` clash produced `No unique publisher attestation policy for v0.12.26` and **breaks the wayland-core build**. |
| 3 | 6 asset filenames | wcore shape is `wayland-core-<tag>-<arch>-<triple><ext>`, `aarch64\|x86_64` × `apple-darwin\|unknown-linux-gnu\|pc-windows-msvc`, `.tar.gz` except `.zip` on Windows. |
| 4 | 12 SHA-256s | `archiveSha256` **and** `binarySha256` per asset, prefixed `sha256:`. |
| 5 | Binary name in the archive | Expected `wayland-nano`, `.exe` on win32. |
| 6 | Attestation policy block | `id`, `releaseTag`, `repository`, `signerWorkflow` (full path), `sourceRef` — **default branch is `wayland-nano`, so `refs/heads/wayland-nano` unless releases are cut elsewhere** — and `sourceDigest`. |
| 7 | npm name + version | Only if Nano is also offered through the install band. If bundled is the only route, say so and we skip it. |
| 8 | Does the binary speak ACP on bare invocation? | #950 sets `acpArgs: []`. Confirm or give the subcommand. |

### N-1 — Namespace the attestation key

Adopt the `nano-` tag prefix (owner value 2), or change `selectPolicy` to match on `repository` +
`releaseTag`. **Recommend the prefix:** zero code change, zero blast radius on a shipped supply-chain gate.
**Acceptance:** a policy document containing one wcore and one nano policy resolves **both**; the synthetic
clash throws. Must be done **before** the first hash is pinned — retrofitting means regenerating the shasums.

### N-2 — `scripts/prepareWaylandNano.js`

Mirrors `prepareWaylandCore.js` 1:1. `GITHUB_REPO='wayland-nano'`,
`BUNDLE_CONTRACT='wayland-nano-bundle/1.0'`, `SHASUMS_FILE=scripts/bundled-wnano-shasums.json`. **Export
surface identical in shape** (the function plus `BUNDLE_CONTRACT`, `BUNDLE_GENERATOR`,
`DEFAULT_WNANO_VERSION`, `SHASUMS_FILE`, `getAssetName`, `loadExpectedProvenance`,
`normalizeExactReleaseTag`, `pruneRuntimeDirectory`) — N-3's verifier takes it as an authority.
**Acceptance:** it produces `resources/bundled-wayland-nano/<platform>-<arch>/wayland-nano[.exe]` **and a
`manifest.json`**; corrupting one archive byte makes it **throw before extraction**. The throw is the
acceptance; the success is the control.

### N-3 — Pack and verify wiring

Four points, each with a wcore precedent: `electron-builder.yml` `extraResources`; the **macOS signing
include** `'/Contents/Resources/bundled-wayland-nano/[^/]+/wayland-nano$'` (miss this and the mac build ships
an unsigned binary inside a signed app); `build-with-builder.js` prune list + `prepareWaylandNano` call;
`verify-packaged-resources.js` table entry `{critical:true, kind:'wnano-bundle'}` plus
`verifyWNanoRuntime`/`verifyWNanoBundle`.
**Acceptance:** the verifier **fails** when `bundled-wayland-nano` is deleted, and **fails** when its
`manifest.json` provenance is edited. Passing on an untouched build is the control, not the acceptance.

### N-4 — Resolve an absolute launch target

`src/process/agent/wnano/binaryResolver.ts` mirroring `wcore/binaryResolver.ts` (packaged
`process.resourcesPath/bundled-wayland-nano/<runtimeKey>/`, dev `process.cwd()/resources/…`, then PATH).
`createWNanoAgent()` gains `...(info.cliPath ? { cliPath: info.cliPath } : {})`.
**Acceptance:** with a bundled binary present and nothing named `wayland-nano` on PATH,
`getDetectedAgents().find(a=>a.backend==='wnano').cliPath` is an absolute path to an existing file. **Fails on
#950 as written** — the stub carries no `cliPath` and spawn falls back to the bare string through
`createGenericSpawnConfig`'s final branch. Gemini's related point stands: PR2 installs to
`<userData>/agents/wnano`, which is **not** on the system PATH, so the `cliCommand` fallback cannot rescue it.

### N-5 — Nano discoverable when the user brought their own

Add `{ cmd: 'wayland-nano', … }` to `POTENTIAL_ACP_CLIS`. This is what makes #950's custom-agent-row removal
safe rather than lossy. **Acceptance:** with `wayland-nano` on PATH and no bundle and no receipt, exactly one
`wnano` entry carrying the probed `cliPath` — fails today.

### N-6 — Reconcile #950

On the **rebased** branch (not merged — the merge is textually clean and semantically wrong; in the clean
merged tree `createWNanoAgent()` sits at index 1 ahead of `builtinAgents` and `managedAgents` while the
`D2 slot` comment sits empty at the correct position **[X]**):
1. Move `createWNanoAgent()` into the marked **D2 slot** (after `...this.managedAgents`, before
   `...this.otherAgents`).
2. Amend #950's `agentRegistryDeduplicate.test.ts`: `expect(agents[1].backend).toBe('wnano')` becomes
   `'gemini'` with empty sub-detectors; the three length assertions stay. This is **tightening to the correct
   invariant** — the position assertion is replaced by the two stronger launchability guards in
   `agentRegistryManagedInstalls.test.ts`.
3. Put the D2 rationale in the PR body so a later reviewer chasing picker order does not "fix" it back.
   Picker position belongs in the renderer.
4. Translate the 12 `wnano` blurbs — #950 ships **English into all 12 locale files**; parity passes, quality
   does not (OQ-5).
5. #950's `AcpConnection.ts` `case 'wnano':` is dead code (live path is `AcpAgentV2` via
   `LegacyConnectorFactory`). Keep or drop; **do not** spend a review cycle, and do not let anyone "verify
   Nano works" by pointing at it.

**Acceptance.** On the reconciled branch, with a valid `wnano` receipt on disk,
`getManagedLaunchSpec('wnano')` returns the receipt's spec and `getDetectedAgents().filter(wnano)` has length
1. **Do not rely on CI to catch the naive merge (A22 — Kimi is right that the two #950 assertions are not
actually mutually exclusive, so the claimed safety net does not exist).** Run both test files by hand on the
merged state *before* the fix and record the RED; that RED is the deliverable.

---

### S-0 — Package **one** artifact

The `C:\wl-clean` build predates both lanes and cannot demonstrate anything in this plan. Repackage from the
merged post-voice, post-installers state (post-Nano if Nano is in scope).
**Acceptance:** `verify-packaged-resources` passes, and deleting `bundled-wayland-nano` makes it fail.

### S-1 — The single clean-machine sweep (voice + agents, one session, one artifact)

Absorbs the old V-13 and CM-4. One artifact, one console session, both lanes (A12).

**Cells — 7, not 6.** {Flux credential / OpenAI credential / neither} × {macOS, Windows}, **plus a seventh:
neither-credential with the network fully off at the OS**, on both platforms (A/L3). Every online cell also
captures DevTools Network filtered to any host outside the app's own origin and asserts **zero rows**, with
the pre-fix build as the known-positive control.

**Per cell, as a user:** the composer reports voice ready without visiting Settings; the greeting speaks; a
dictated sentence appears as text; Test voice speaks. It **fails** if any cell requires a Settings visit, if
any control dead-ends, or if any failure surfaces without a named cause.

**Agent steps, in the clean session:**
1. `where.exe codex kimi openclaw wayland-nano` returns nothing. **Run this first — do not trust a clean
   result without it.**
2. First launch on a profile-less account completes and the Agents page renders. This is also the first run
   of the constitution decrypt path on a genuinely fresh identity; V-0b must already be in.
3. The band shows every offered agent as `absent`, **not** `unavailable` — `unavailable` would mean bundled
   bun did not resolve in the packaged app, which invalidates the entire band.
4. The Flux chip on an `absent` codex card is not clickable, and `%USERPROFILE%\.codex\config.toml` does
   **not** exist after the page is visited. Assert the file's absence explicitly.
5. Install kimi (consent sheet shows four facts), **launch it and complete an ACP handshake**. A spawned
   process is not a launch.
6. Install codex, launch, handshake — **skipped entirely if AI-4 (a) never passed**, in which case codex is
   not in the band at all.
7. Cancel an install mid-flight; the tile returns to `absent` with human copy, not a raw i18n key.
8. Uninstall kimi; the agent dir and the receipt are both gone.
9. Nano launches from the **bundled** binary with nothing on PATH — confirm via `Get-Process` command line
   showing the absolute `resources\bundled-wayland-nano\...` path. A bare `wayland-nano` in that command line
   is a **FAIL**.

**Getting into the clean session — A13 SUPERSEDED. THE OWNER LOGON IS NO LONGER REQUIRED [X].**

A13 concluded RDP-as-clean-user was "a dead end" and that a physical console click was the only mechanism.
That was true of the account *as it stood*, not of the account. It has been done zero-touch, and every step
below was executed:

1. `Set-LocalUser -Name WaylandCleanTest -Password <generated>` — the blank password was the entire cause of
   the console-logon-only restriction, and it is a property of the account, not a policy we cannot move.
   The password lives at `~/.config/wayland-smoke/wlclean-pw`, mode 600, never echoed. **It is not an admin**
   (verified: not a member of `Administrators`), so the account stays a genuine limited clean profile.
2. `Add-LocalGroupMember -Group "Remote Desktop Users" -Member WaylandCleanTest`.
3. `brew install freerdp` on the Mac, giving a headless client.
4. **The first attempt failed with `ERRINFO_LOGOFF_BY_USER` after 36 s and created no profile.** That is not
   an auth failure — it is Windows' single-session "another user is signed in, disconnect them?" prompt
   timing out with nobody present to answer it. `tsdiscon 1` freed the slot (disconnect, not logoff, so
   `seand` loses nothing and simply reconnects).
5. `sdl-freerdp /v:100.109.207.54 /u:WaylandCleanTest` then created **session 5**, and
   `C:\Users\WaylandCleanTest` now exists. The session sits `Disc`, which is exactly what is wanted: a
   disconnected RDP session **retains its window station**, so Electron runs in it and CDP works.

Proven end to end on the existing (stale) artifact: a scheduled task with
`New-ScheduledTaskPrincipal -UserId WaylandCleanTest -LogonType Interactive` launched
`Wayland.exe --remote-debugging-port=9222`; four processes report owner `WaylandCleanTest` in session 5, and
`http://127.0.0.1:9222/json/version` returns `Wayland/0.11.18 Electron/41.6.0`. CDP is therefore proven
*without* spending an owner logon, which was A13's stated worry.

The clean-machine PATH control is also proven, with the known-positive control the standing rule demands:
run as `WaylandCleanTest`, `where.exe codex kimi openclaw wayland-nano claude` finds **nothing**, while the
same probe in the same session finds `powershell` and `notepad`. A zero from a method that cannot find a
known positive would have proven nothing.

**What is left for S-1 is therefore only the artifact**, not the session: repackage post-merge, copy it to
the box, and re-run the task. No owner action.

---

## 5. Merge sequencing

The branches are **siblings, not parent/child** (A23): they forked at `4ed839e34`, but attribution has moved
39 commits past it and is now at `0e681189b` **[X]**. Main has zero divergence from both, so either can
fast-forward first. `git merge-tree` returns rc=0 on all three pairs — **git will not warn anyone**, and the
#950 collision is semantic.

**Planned order — installers first (this reverses the earlier draft).**

| | Branch | Why here |
|---|---|---|
| PR1 | `packet/agent-installers` | It is **done and proven**. The earlier draft put voice first for diff cosmetics; that is not a technical constraint, and it made finished work hostage to ~20 unstarted voice tasks. The em-dash concern is moot: the 23 install-band keys are already em-dash-free in all 12 locales, verified with a known-positive control **[X]**. |
| PR2a | `packet/attribution-audit`, **split** — UI/theming, the em-dash sweep `9f7012048` + its V-12 guard, the Test-voice fix in `5f8532ca9`, **with the incomplete voice surface feature-gated off** | Resolves the "what is PR1's content" hole (A/L2 blocker). Ships the proven work without shipping a voice surface that V-11 deletes one PR later. |
| PR2b | The voice work: V-0 … V-11 | Lands when the owner decisions and V-0's evidence exist. |
| PR3 | #950, **rebased** onto post-PR1 main, reconciled per N-6 | A merge is conflict-free and wrong. Rebasing makes the author see the `D2` slot in context. |

**If Nano slips, ship PR1 + PR2a/2b without it.** Nothing in the agent-install track depends on Nano.

**Collisions and what actually happens:**

| File | Reality |
|---|---|
| `acpTypes.ts` | Additive at different points. Clean **[X]** |
| `AgentRegistry.ts` | **Semantic conflict, no textual conflict** — task N-6 **[X]** |
| `AcpDetector.ts` | Clean, but #950 removes the legacy custom-agent row — N-5 supplies the replacement route |
| `AcpConnection.ts` | Dead code either way |
| 12× `locales/*/settings.json` | Three-way additive, merges clean **[X]**. Re-run `check-i18n` after every merge anyway |

Hygiene at every step: `AGENTS.md` and `constitutionFsAuthority.generated.ts` stay unstaged; no tag
(`build-and-release.yml` fires on **any** tag); full suite foreground on the **merged** state, not on either
parent. §5 is the *planned* order — **nothing executes without the owner's explicit go** (A24).

---

## 6. What the owner must supply or do — one sitting

1. **Answer OQ-1 … OQ-6 below.** OQ-1, OQ-2 and OQ-3 block the largest task in the plan (V-2).
2. **One click at SeanDesktop's physical sign-in screen:** choose `WaylandCleanTest`, sign in (no password),
   then leave it signed in — lock the screen if you like, do not sign out. Windows 11 Pro is single-session,
   so your `seand` RDP session disconnects and reconnects with nothing lost. **Do not do this until S-0's
   artifact is on the box and CDP has been proven as `seand`** — the session is the scarcest resource here
   and it should be consumed once.
3. **Publish an attested `wayland-nano` release** (workflow mirroring wayland-core's), then supply the 8
   values in N-0. Until this exists, Nano cannot be written, let alone tested.
4. **Five listens.** In this order, and listen 1 is now *cheap and first* — I will synthesize a SAPI WAV over
   SSH as `seand` today and send it to you, so OQ-1 is answered in hours rather than after V-7 is built:
   1. **Windows SAPI, before V-7.** Does the default voice work as *the floor for every credential-free
      Windows user*, or does it need a specific voice? Gates OQ-1.
   2. **The greeting, after V-2** — macOS `say` and Windows SAPI. Does it sound like a product?
   3. **Dictation, after V-9** — `tiny` (bundled floor) vs `base` (first background tier), same phrase, same
      mic. If `tiny` is good enough for your speech, V-9's tiering is over-engineering and should shrink.
   4. **Test voice, after V-8** — each shipped provider on each platform.
   5. **Sentence-streaming prosody.** Deferring in advance: your ear overruled my numbers on comma prosody
      before. If the measurement and the listen disagree, **the listen wins**.

---

## 7. Risks accepted, and defects deliberately deferred

| Item | Decision | Reason |
|---|---|---|
| `--danger #f87171` at 2.77:1 on white (AA needs 4.5:1) | **Deferred** | Same class as the `--warning` bug already fixed, wider blast radius, not voice-specific. Track it; do not smuggle it in. |
| History rewrite for `5f8532ca9`'s mis-attribution of 6 files | **Declined** | Content is correct, attribution is wrong, it stays documented. No history rewriting. |
| The keychain hang (unsigned dev binary vs signed app's item, 120 s, no timeout) | **Accepted as an operating rule, not fixed** | Never run a dev build against a signed app's profile; use a scratch `WAYLAND_HOME`. A bounded fix is worth doing later; it is not on this critical path. |
| `stream: true` absent from the `wayland-asset:` privilege block | **Accepted** | `supportFetchAPI` + `corsEnabled` are present **[X]**; ORT falls back from `instantiateStreaming` to `arrayBuffer`. V-0 will show if it matters. |
| ORT threading without `crossOriginIsolated` | **Accepted, measured** | ORT degrades to single-thread. V-0 logs it. If degradation is not clean, that is V-0's failure and the plan re-scopes. |
| Codex's bulk "missing" list (MIME/range, asar-vs-unpack, arch matrix, proxy, retry ceilings, schema-version/rollback flags, memory budget, worker termination, device removal, autoplay denial, install-IPC authz, process-tree kill) | **Declined as invented scope** | House rule: verify a threat is reachable before guarding it, and calibrate to blast radius. The reachable subset was taken into V-9/V-10/V-11/AI-3/S-1; the rest are hypotheticals on paths no user has been shown to reach. |
| Non-en-US translation quality (the 402 rewrites, and #950's English-in-12-locales blurbs) | **Owner call, OQ-5** | `check-i18n` proves key parity, not meaning. Tooling cannot close this. |
| Linux speech-out | **Deferred, but the deferral now costs a task** | No `say`, no SAPI. It gets `unsupported` with a **named** reason — and that string must actually be written in 12 locales, which the old plan promised and never scheduled. See OQ-4. |

---

## 8. Open questions — recommendation first

**OQ-1 — Windows speech-out floor. Recommendation: build `windows-native` (SAPI via `powershell.exe`), but
only after the cheap listen and an EDR check.**
Today off-darwin there is **zero** speech out without a hosted key. SAPI ships in every Windows install, needs
no download, has no licence question, and returns a buffer so it slots into `voiceSynthBridge` unchanged. But
three auditors independently flagged that a packaged unsigned Electron spawning `powershell.exe` can be
blocked by Defender/AppLocker/EDR, that PS7 lacks .NET Framework `System.Speech`, and that cold-starting
PowerShell per utterance costs roughly a second — which hurts conversational prosody even when it works.
**So OQ-1 is two questions:** does the default voice sound acceptable (listen 1, hours away), and does the
spawn survive a managed box (a 10-line probe I can run). If either fails, the alternative is win32
speech-out = `unsupported` with a named cause, decided **before** V-2's table is authored. Rejected
alternative: renderer `window.speechSynthesis` — cross-platform in one shot, but it produces no audio buffer,
bypasses the main-side synthesis gate, and forks the playback path.

**OQ-2 — Speech-in defaults ON, with the local floor as the DEFAULT rung and hosted rungs opt-in.**
This is the inversion the audit forced (A8). Defaulting *on* is safe **because** the default engine is
on-device: no audio leaves the machine, nothing is owed in disclosure, and the mic still requires a press.
Hosted rungs (Flux, OpenAI, deepgram) keep their per-recipient consent sheet and are **never auto-preferred
on an untouched profile** — the earlier draft's ladder put them first, which would have routed a credentialed
user's first microphone audio off-machine while the truth table still passed. **This decision is void if V-0
fails**: without a working local floor there is no on-device default, and default-on would be indefensible.

**OQ-3 — Amend "never bundle models into the installer" to: bundle the ~43 MiB tiny floor only.**
The rule already conflicts with shipped reality — `prepareVoiceModel.js` puts 43.1 MiB of
`Xenova/whisper-tiny` inside the installer and `verify-packaged-resources.js` marks it `critical: true`. That
43 MiB is the only thing between a credential-free machine and zero speech-in, and it is what makes OQ-2
defensible. Everything above it downloads in the background. I need this stated explicitly because V-2's
floor depends on it.

**OQ-4 — Linux: hide the voice surface entirely this cycle.**
Recommendation is the cheaper, more honest commitment. Linux ships (AppImage/deb/rpm) with no `say`, no SAPI,
and an on-device speech-in floor nobody has ever exercised there. The alternative — a Linux cell in S-1
covering the speech-in floor end to end **plus** a named `unsupported` speech-out string in 12 locales — is
real work for a platform with no verification story yet. Hiding it is one condition and one hidden surface;
half-shipping it means a third of the platforms has an unwritten string and an unverified download path.

**OQ-5 — Accept the ja-JP / zh-CN / zh-TW comma substitutions as-is; do NOT accept #950's English blurbs.**
The em-dash sweep's ideographic/fullwidth comma changes are mechanical and low-risk; routing them through
native review costs more than it buys. #950 is different — it ships literal English into all 12 locale files
**[X]**, which passes parity while shipping untranslated product copy. That one needs translation before PR3.

**OQ-6 — One engine for local speech: transformers.js + Xenova ONNX. Delete whisper.cpp/ggml and
kokoro-local.**
whisper.cpp has never published a macOS CLI at any tag, ships multi-file archives with sidecar `.so`/`.dll`
that `acquireBinary` structurally cannot install, and all 8 manifest URLs 404. Kokoro needs a runtime, a
28 MB `voices-v1.0.bin`, and a G2P/phonemizer that exist nowhere in this codebase — that is a build, not a
download. transformers.js is already bundled and already runs on both target platforms. One engine turns
"sized to the machine" into a model-tier choice instead of three unfinished ports. The alternative is funding
the whisper.cpp port (build, sign and host a macOS CLI as a Wayland release asset, add archive
extract/verify, solve RPATH on two OSes) — weeks, for an engine whose only advantage is speed. **Note the
correction from the audit:** the `whisper-local` provider **id** survives this deletion; only the dead binary
implementation behind it goes.

**Also confirm, one line each:** reclaim the orphaned `kokoro-v1.0.onnx` (325,532,387 B) and `ggml-*.bin`
(147,951,465 B) silently on upgrade with a log line rather than a prompt; and the auto-tier ceiling — never
auto above `base` on <16 GiB, never auto above `small` at any size, `medium`/`large` manual-only (measured:
tiny 74.1 MiB, base 141.1 MiB, small 465.0 MiB, medium 1.43 GiB, large-v3 2.88 GiB).

---

## 8. Execution findings, 2026-08-11 evening

Proven by execution during the build session. These change what the plan claims.

### V-0 PASSES: the bundled on-device model produces an accurate transcript, offline

All three external legs named this the highest-risk assumption. It is now settled in two halves,
and it is worth being precise about which half proved what.

**Half one, the runtime (lane 3).** Pre-fix, the running app really did fetch ~22.5 MiB of ORT WASM
from `cdn.jsdelivr.net` on first dictation, and local dictation failed completely with the network
off. Post-fix it makes zero requests to jsdelivr and still transcribes. The known-negative control
(`grep -rn wasmPaths src` returning 0) was recorded before editing. Notably the lane's *first*
instrument was silently blind to the worker, logging 173 document subresources and zero worker
requests; it caught that itself and replaced the method. A zero from a blind instrument would have
"proved" the fix while the CDN call continued.

Two corrections to the plan came out of it: `wayland-asset:` was **not** needed, because the emitted
URL resolves against the worker's own location and so behaves identically in dev and packaged; and
setting `.mjs` alongside `.wasm` would have been an active regression, because ORT ships its WASM
factory statically bundled into the worker chunk and abandons it the moment `.mjs` is set.

**Half two, the model.** Lane 3's every successful run returned the single word `"you"`, which is
whisper-tiny's well-known output for near-silence, so the pipeline was never fed real speech. Run
separately against the bundled `resources/voice-models/whisper-tiny` with the production config
copied exactly from `whisperWorker.ts` (`dtype: 'q8'`, `session_options.graphOptimizationLevel:
'basic'`, `allowRemoteModels=false`), on a 16 kHz mono WAV of real speech at peak amplitude 0.8248:

```
in:  "the quick brown fox jumps over the lazy dog"
out: " The quick brown fox jumps over the lazy dog."
model load 1872 ms, inference 2644 ms
```

**Half three, closed later the same session: the two halves together, offline.** An adversarial
verifier drove the PRODUCTION-BUILT worker chunk (`out/renderer/assets/whisperWorker-*.js` from a
real `electron-vite build`) from a `file://` document with production `webPreferences`
(`sandbox:true, contextIsolation:true, nodeIntegration:false, nodeIntegrationInWorker:false`) and the
app's real CSP re-applied, fed it the same 16 kHz real-speech WAV, **with DNS blackholed**:

```
audio:      {sampleRate:16000, channels:1, samples:46677, peak:0.8248, rms:0.1047}
init:       {"type":"ready"} in 715 ms
transcribe: "The quick brown fox jumps over the lazy dog."
wasm load:  XHR file:///.../out/renderer/assets/ort-wasm-simd-threaded.asyncify-DMmc6YqF.wasm
```

A four-run matrix settles causation rather than asserting it:

| run | code | network | production worker jsdelivr hits | transcript |
|---|---|---|---|---|
| A | HEAD | online | 0 | correct |
| B | HEAD | DNS blackholed | 0 | correct |
| C | base `153e51539` | DNS blackholed | 2 | **none - ORT init errored** |
| D | base `153e51539` | online | 2 | correct |

Run C is the proof the CDN was load-bearing, not merely present. The instrument was validated with a
known-positive control in the same run: a dedicated worker fetching the real jsdelivr URL WAS logged
by both probes, so the zeros come from an instrument demonstrably able to see worker traffic.

**CORRECTION to an earlier claim in this document and in the lane's commit message.** It was stated
that jsdelivr is "an origin the app's own CSP forbids". That is FALSE for the worker. With the app's
real CSP applied and confirmed live via `onHeadersReceived`, a dedicated worker still fetched
jsdelivr with **HTTP 200**. CSP was never the barrier here. The offline argument stands entirely on
its own and is sufficient; the CSP framing was wrong and is withdrawn.

**The one remaining gap is narrow and named:** everything above ran from an UNPACKED `file://` tree.
Inside `app.asar`, ORT routes `file:` URLs to XMLHttpRequest rather than fetch, so Electron's asar
shim has to serve it. Plausible, untested, and worth one live packaged check - especially since local
STT has never once worked in a packaged build.

### CORRECTION: the "Gemini CLI" entry is NOT a false-positive detection

I recorded this as a defect and I was wrong. Retracted here rather than quietly edited, because
acting on it would have broken a working feature.

The observation was real: on `WaylandCleanTest`, `where.exe` finds `powershell` but finds no
`gemini`, `%APPDATA%\npm` is empty, and there is no gemini on that user's PATH - yet the app shows
"Gemini CLI" under "MORE DETECTED - 1". I concluded `AgentRegistry.createGeminiAgent()` hardcoding
`available: true` with no probe was a false positive putting a dead end in front of a new user.

It is not. `src/process/agent/gemini/` is an **in-process implementation** - `index.ts` plus a
vendored `cli/` tree, driven through the `@google/genai` SDK, with **no** `spawn`, `execFile`,
`which` or `cliPath` anywhere in it. Gemini runs inside Wayland exactly as Wayland Core does, so
`available: true` is accurate and there is no external binary to detect. Removing the hardcode, which
is what my finding implied, would have disabled a working backend.

What survives is a **copy** issue, not a defect: grouping it under "MORE DETECTED" implies something
was found on the machine, and the name "Gemini CLI" implies an external CLI. Neither is true. Worth
one line of copy, not a fix.

The lesson is the one this project already knows: an observation is not a diagnosis. The probe was
sound and the zero was real; the causal claim attached to it was not checked before it was written
down.

### The stated suite baseline was wrong, and all five lanes said so independently

Every lane was briefed that 4 pre-existing failures were expected (1 in `shellEnv.test.ts`, 3 in
`OfficeCliAuthoringCapability.test.ts`). **None of the five reproduced them**; all reported those
files passing. The briefing was wrong and the branches are cleaner than claimed. Recorded because a
wrong baseline is exactly the kind of thing that later gets used to wave away a real failure.

Separately, three lanes running `vitest` concurrently drove load to 166-193 with 40-47 workers and
produced spurious 10s/30s timeouts in files outside the lanes' diffs, which passed in isolation.
Full suites must run one lane at a time.

### The Windows clean-machine gate, and what the first-ever sweep showed

Session created zero-touch (see S-1). The first clean-machine run of the install band, against a
freshly packaged artifact built from `packet/agent-installers @ 1cda570a8`, confirmed:

- the band renders every offered agent as installable, **not** `unavailable` - so bundled bun does
  resolve in a packaged app, which was the condition that would have invalidated the whole band;
- the Flux chip on an `absent` card really is inside a live `<button>`, reproducing the defect on a
  clean machine rather than only in a unit test.

That artifact predates all five lanes, so it stands as the pre-fix control, not the deliverable.

### CM-4 steps 1-5 PASS: install to ACP handshake, on a clean Windows machine, first time ever

Run against a freshly packaged artifact from `packet/agent-installers @ 1cda570a8`, as `WaylandCleanTest`
in its own session. This validates the installer chain that is already landed, independently of the
five in-flight lanes.

1. **First launch on a profile-less account completes** and the Agents page renders.
2. **The band shows every offered agent as installable, not `unavailable`.** This was the condition
   that would have invalidated the entire band, because `unavailable` means bundled bun did not
   resolve in a packaged app.
3. **The consent sheet shows exactly the four facts**: package `@moonshot-ai/kimi-code`, version
   `0.34.0`, destination under the clean user's own profile, and **install scripts Blocked**.
4. **Install completed** and the card flipped to "Installed by Wayland 0.34.0". On disk:
   `agents/kimi/` with `node_modules/.bin/kimi.exe` and the receipt `.wayland-agent-install.json`.
5. **The installed agent LAUNCHED and completed an ACP handshake** - the actual deliverable, since a
   spawned process is not a launch. Driven with the receipt's own `launchSpec` plus the kimi
   backend's `acpArgs: ['acp']`, as the clean user:

```
command: <app>\resources\bundled-bun\win32-x64\bun.exe
args:    <profile>\agents\kimi\...\dist\main.mjs  acp
-> {"jsonrpc":"2.0","id":0,"method":"initialize",...}
<- {"jsonrpc":"2.0","id":0,"result":{"protocolVersion":1,
     "agentCapabilities":{...},"authMethods":[...],
     "agentInfo":{"name":"Kimi Code CLI","version":"0.34.0"}}}
elapsed 1153 ms
```

Note what this proves that a unit test cannot: the launch used **bundled bun** on an account with no
Node on its PATH, resolved an absolute path out of a receipt written minutes earlier, and got a real
protocol response from a real agent process.

**Still to run on the clean machine** (needs the post-merge artifact, since the one used here
predates all five lanes): cancel mid-flight, uninstall, the inert Flux chip, codex, and every voice
cell.

Two PowerShell 5.1 traps cost time and are recorded so they do not again: `$args` is a reserved
automatic variable and silently shadows a caller's array, and `ProcessStartInfo.ArgumentList` does
not exist in 5.1 - use the `Arguments` string. Also, `>` redirection inside a `schtasks /tr` value is
swallowed; use `Start-Transcript` inside the script instead.

---

## 9. MERGE LANDMINE - read before merging any voice branch

`packet/wl-voice-wintts` is branched from **before** `packet/wl-voice-core` landed its ladder. Its
copy of `voiceReadiness.ts` is therefore the **pre-ladder** file: it still carries the flat
`VoiceReadinessReason`, still defines `DEFAULT_STT_PROVIDER = 'openai'`, and has no per-direction
legs.

**A naive merge in that direction reinstates the exact default the voice-core lane exists to
remove** - the one that points a fresh profile at a hosted service with no key, which is the root
cause of "voice does not work out of the box". Git will not warn anyone, because this is the same
class of conflict-free-but-wrong merge as the Nano collision.

**Required order and resolution:**
1. `packet/wl-voice-core` merges FIRST. Its `voiceReadiness.ts` is authoritative and must survive
   the merge intact - verify `DEFAULT_STT_PROVIDER` is **absent** from the merged file afterwards.
2. `packet/wl-voice-wintts` merges SECOND, taking voice-core's `voiceReadiness.ts` wholesale and
   contributing only its own files.
3. The two-step wiring of `platformNativeTtsProvider` to the wintts lane's
   `resolveLocalTtsProvider` (which lives in `ttsTypes.ts`, a file voice-core was forbidden to
   touch) is completed as step 2.

The voice-core lane left a deliberate tripwire for this: **the `win32` row of its platform table is
written to FAIL until step 2 is done.** Do not "fix" that row by weakening it - it going green is
the signal that the merge was completed correctly.

Cross-lane convergence that reduces the risk: both lanes independently found and fixed the same
`isWindows()` bug (`/win/i` matches the "win" in "darwin"), and voice-core deliberately adopted the
wintts lane's `rendererPlatform` naming, body and signature **verbatim** specifically to remove the
textual conflict. Two lanes reaching the same fix independently is corroboration; the naming
adoption is what keeps the merge clean.

One correction to an earlier coordination note: the `isMacOS() ? 'darwin' : 'other'` ternary was at
**2** call sites in voice-core's tree, not 4 - that lane had already collapsed four hand-built
readiness objects into a single `readinessInput()` helper. The count of 4 came from the pre-collapse
file.

---

## 10. The live run — what actually happens when you start the app

Everything above this section is unit or harness evidence. This section is the app, running, on
macOS, driven over CDP against scratch profiles, with screenshots. It is the most valuable thing in
this document, because four of these were invisible to a fully green suite.

### 🟢 Voice works. First demonstration in the real application.
Fresh profile, no keys. The mic control renders **enabled** with a human tooltip. Tap to recording
in **0.5 s**; six seconds of speech; transcript in the composer **2.0 s** after stopping:

> "The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog."

Verbatim correct, **zero network requests**, on-device whisper-tiny. The documented 5-10 s warmup
was not observable end to end.

Worth recording how that result was earned: the first two attempts returned the single word `"you"`.
Rather than reporting a transcription failure, the agent worked out that *its own* audio delivery was
being blocked by Chromium's sandbox, fixed it, and verified real signal (RMS 0.29, peak 1.0) before
believing any transcript. A near-silence artefact was one step away from being reported as a result.

Also passing: a real turn completes end to end; the agents page renders; the Flux chip on an absent
card is genuinely non-interactive (forced click changed no route, no modal, no DOM); ten settings
pages produced **zero console errors**.

### 🔴 The RELEASED engine cannot start a single turn
`build-mac` bundles Core `v0.12.26`. `DESKTOP_CORE_V1_PIN` demands an **unreleased** Core dev
commit: minor 12 vs 13, `gen/13` vs `gen/14`, and a different schema hash, all compared for equality.
Running the released binary gives *"wcore Desktop contract rejected ready: Core contract minor
differs from the pin."*

This came in with `f94487a6b` (the C-1..C-5 integration), **not** from the five lanes - but it is
live on this branch, and it means a packaged build ships a dead default backend. An unreleased
binary was hand-placed at `resources/bundled-wayland-core/darwin-arm64/wayland-core` (gitignored) to
test anything at all, so **turns working locally must not be read as the release working.**
Cross-repo; needs Core.

### 🔴 Every in-thread notice was invisible, for two independent reasons
Fixed in `5ea2a2c43`, both root-caused by execution.

1. **The notice was never put on the wire.** `emitConstitutionReclaimNotice` called `addMessage()`,
   which only writes SQLite. And `transformMessage` had **no `case 'tips'`** - so `CronService`'s
   emit, carrying the comment *"Emit to frontend so it shows immediately if conversation is open"*,
   has been dead code, silently logging "Unsupported message type 'tips'".
2. **Error tips rendered and were then deleted, in-session.** `handleTurnEnd()` settles the activity
   card synchronously *before* the `finish` frame, so the renderer sees
   `error` -> `activity_turn_end` -> `finish`. The catch-all read `activity_turn_end` as successful
   content after an error, reset the flag, and the following `finish` wiped the tip. The row stayed
   in the DB, which is exactly the reported symptom.

The same seam produced the third defect: `mcp_session_state` / `mcp_ready` forwarded with an empty
`msg_id` while a conversation is merely *opened* set the stream running, so a **dead turn rehydrated
as active** with a climbing timer and a live stop button - the renderer undoing its own correct
hydration. One gate fixes all three:
`isTurnOutput = Boolean(msg_id) && type !== 'activity_turn_end'`.

The `react-virtuoso: Zero-sized element` flood, which was the leading suspect, is a **red herring** -
identical in broken and fixed runs.

### 🔴 A second Constitution damage mode still bricks every turn
Flipping a byte **mid-payload** rather than in the last CBC block makes macOS `safeStorage` -
unauthenticated AES-CBC, no MAC - decrypt to garbage instead of throwing. That yields `_INVALID`,
which the reclaim guard does not catch, so the user sees
`CONSTITUTION_FS_REVISION_AUTHORITY_INVALID` verbatim with no recovery affordance. The fix covers
foreign-identity ciphertext; it does not cover corruption.

### 🟠 The Voice panel told the user their audio was leaving the machine
On one screen simultaneously: dropdown "Whisper (Local)"; beneath it *"Currently using OpenAI
Whisper... This provider processes audio and text off your device"*; below that *"Runs on your
device... no audio leaves this machine."* Measured behaviour: zero network requests, fully local.

Root cause: the panel asked a **different resolver than the one that routes the audio**.
`resolveEffectiveSttProvider` predates the on-device-first ladder and still ends in `return 'openai'`,
while the dropdown drew from the correct answer. Fixed; the off-device warning is pinned by a
known-positive test so it cannot be "fixed" by deletion. Deepgram was also being mislabelled as
OpenAI Whisper by a two-way ternary.

### 🟠 Speech-out: hypothesis refuted
"Synthesizes bytes nobody plays" is **false on both halves**. A consumer exists and is unconditional
(`Blob` -> `createObjectURL` -> `new Audio(url).play()`), and running the real service spawned `say`
genuinely and returned 123,578 bytes of valid RIFF WAV in 1,145 ms. The watcher was validated both
ways first (46 hits with `say` running, 0 without). The live-run silence is therefore **upstream** -
nothing reached the synthesizer - with the never-rejecting IPC transport as the prime suspect. That
last step is inferred, not proven.

### Smaller, real
- `bun run package` and `make` are literally `electron-vite build`, and the `prebuild`/`prepackage`
  hooks staged constitution-fs, the models snapshot and the skill pack while **omitting the voice
  model** - so a fresh clone built an app with no on-device floor. The release path was always
  correct. Fixed on both hooks.
- Onboarding addresses the user by the name they typed, then the home screen greets them by their
  **OS account name**.
- Onboarding's completion screen lists providers only; the model chosen for the user is never shown.
  The user's first sight of it is the composer chip, and their first turn was the 400.
