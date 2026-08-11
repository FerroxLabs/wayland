# HANDOFF — 2026-08-11 end of session

**Goal for next session: a fully working voice system and finished agent installs.**
Execute from `.planning/CLOSEOUT-PLAN-VOICE-AND-AGENTS.md` (a 12-agent cross-audited
workflow was producing it as this session ended — **check it exists and read it first**;
if the workflow did not finish, its transcript is under
`~/.claude/projects/-Users-seandonahoe-dev-wayland/775e9698-*/subagents/workflows/wf_494cc7eb-cd0`).

---

## 1. Branch state — both pushed, nothing merged

| Lane | Worktree | Branch | Head | Suite |
|---|---|---|---|---|
| Voice + UI | `wayland-worktrees/packet-attribution` | `packet/attribution-audit` | `9f7012048` | 16,937 / **4 pre-existing** failures |
| Agents | `wayland-worktrees/packet-agent-installers` | `packet/agent-installers` | `1cda570a8` | 16,826 / 0 |

The 4 failures are `shellEnv.test.ts` ×1 and `OfficeCliAuthoringCapability.test.ts` ×3.
They are pre-existing and unrelated — **prove that at HEAD before believing anyone who
says otherwise**, and do not "fix" them as part of voice work.

`AGENTS.md` and `constitutionFsAuthority.generated.ts` are modified and **must stay
unstaged, always**.

---

## 2. 🔴 THE FOUR FINDINGS THAT CHANGE THE PLAN

These invalidate earlier assumptions in this repo's planning docs. Trust these.

### 2.1 Local speech-to-text has NEVER worked, in either build
- `acquireBinary('whisper-cpp')` is a **dead end, not an uncalled mechanism**: both
  manifest URLs 404, the pinned `v1.7.1` tag does not exist, and whisper.cpp
  **publishes no macOS CLI binary in any release** (GitHub API, latest 3 releases:
  Windows `.zip`, Ubuntu `.tar.gz`, and an `xcframework` — a library, not an executable).
- **The renderer never calls the main-process whisper path at all.**
  `transcribeAudioBlob` short-circuits `whisper-local` (and unset) to `transcribeLocally`
  — transformers.js in a Worker, no IPC. So the fix is **transformers.js, not native binaries**.
- Consequence: Sean's 141 MB `ggml-base.bin` in `~/Library/Application Support/Wayland-Dev/voice/whisper/`
  is **orphaned** — it feeds code the renderer never reaches.
- Packaged is broken differently: `resources/voice-models/whisper-tiny` is gitignored
  (absent in dev, present when packaged), so **dev fails on a missing model** while
  **packaged fails on the ONNX WASM runtime**, which `whisperWorker.ts` fetches from a
  **CDN under a CSP that blocks external hosts**. Both rendered as "unknown".
  → Stage 2 must **bundle the WASM backend**.

### 2.2 The IPC transport cannot carry a rejection
Proven by execution with a known-positive control: a resolving provider settles, a
**rejecting one never settles**. `@office-ai/platform`'s provider side has no `.catch`
and its invoke side only ever resolves — no reject, no timeout.
This single defect is the structural cause of: the dead **Test voice** button, the
**hung download bar**, and the dictation spinner that only a reload cleared.
`6a26270b3` added an error channel for dictation; **the same hole exists elsewhere** —
audit every `.provider()` registration, not just the voice ones.

### 2.3 Flux Voice is SPEECH-TO-TEXT ONLY
Confirmed by the owner and independently by execution (`/v1/audio/speech` answers
`auth_error` only because Flux runs on LiteLLM; Flux mounts only
`/v1/audio/transcriptions`, and `FULL_FLUX_MODELS` has no TTS alias).
**Flux Voice must never appear in a TTS picker.** The smart-default ladder therefore
resolves **independently per direction**:

| | Preferred | Then | Then | Floor |
|---|---|---|---|---|
| Speech **in** | Flux Voice (Flux connected) | OpenAI key | local, background acquire | "preparing" progress state |
| Speech **out** | OpenAI key | Kokoro local, background | — | `system-native`, never silent |

A **Flux-only user is the common case**: instant speech-in, still needs a TTS answer.
Design for that explicitly; it must not feel half-finished.

### 2.4 Choosing Flux Voice used to guarantee failure
Selecting Flux Voice **skipped the zero-config seed**, so it always hit an empty
`fluxVoice.apiKey`. Fixed in `10ceecc8e` (it now inherits the connected Flux Router
credential). This is why "Flux connected · 77 models" bought nothing for voice.

---

## 3. What landed today

### Voice branch (`packet/attribution-audit`)
| SHA | What |
|---|---|
| `8391bf692` | Constitution decrypt routed to recovery, not a stack trace |
| `b69404dac` | Repointed the orphaned workbench test (**I broke it in `0754a662c`**) |
| `5e9d4200f` | Test voice asks for consent; greets instead of "Voice check." |
| `895496e66` | Auto-read implemented on the V22 speech queue |
| `6a26270b3` | Dictation given an error channel instead of a silent hang |
| `6688093cc` | Voice mode on the new-chat page (**caused the chat-title regression**) |
| `e7bfcc914` | A refresh can clear a provider's stale error state |
| `9502e7ae9` | Stop calling an unusable provider "no provider configured" |
| `a3f6936b0` | Flux hero shows the registry's real model count (was hardcoded `40+`) |
| `7282aebae` | No green badge for providers whose creds cannot decrypt |
| `7fda371f3` | A provider's row and its detail view tell one story |
| `a46cdef62` | Ollama says it is not running, and offers to start it |
| `434c36e48` | Chats stop being named after their workspace path |
| `8a902a332` | Warning text readable on light (**1.67:1 → 5.50:1**) |
| `5f8532ca9` | Voice mode follows the app theme ⚠️ see §6 |
| `10ceecc8e` | Flux Voice inherits the connected Flux credential |
| `78429bfe4` | Transcription names its real failure, not "unknown" |
| `5703b758c` | A failed download no longer hangs forever |
| `abe252b70`, `06b2928d7` | `.planning/VOICE-SMART-DEFAULTS.md` — **stages 2–5 gated on Sean's sign-off** |
| `d770f62ec` | Wire-shape assertions pin the failure detail |
| `9f7012048` | Em dashes gone: 25 en-US by hand, 402 strings across 12 locales |

### Agent branch (`packet/agent-installers`)
| SHA | What |
|---|---|
| `67a558318` | **Closed the dead end** — the launch path reads the install receipt |
| `8725b9442` | Concurrency guard (in main, not React), timeout, cancel |
| `a651f4578` | In-flight install + cancel on the wire |
| `24099700e` | **Windows verification builds were structurally impossible** — gate fixed |
| `1cda570a8` | Merge order pinned so a built-in stub cannot shadow a real install |

---

## 4. Still broken / not done

**Voice**
- Flux Voice settings form leaks Deepgram's field set — shows `nova-2`, a Deepgram model.
- "API Key (Required)" is now a **lie** after `10ceecc8e`. With Flux connected it needs
  no input; without it, the honest prompt is "connect Flux Router", not "paste a 2nd key".
- `(Optional)` badge breaks labels across lines ("Default (Optional) Language").
- "Tap to speak does nothing": the tap sets the **same** error string already on screen,
  React sees identical state and never repaints. Looks dead; isn't.
- Kokoro: model on disk (310 MB), runtime/voice-data/phonemizer absent, **no UI to complete it**.
- The greeting renders text but **speaks nothing** (I wrongly called this "landed").
- Affordance state machine (ready/preparing/needsSetup/unsupported/failed) — designed, not built.

**Agents**
- **Clean-machine test never ran** (see §5).
- `codex` has **no `acp` subcommand** — the ACP piece is `@agentclientprotocol/codex-acp`.
- `openclaw` is **not an ACP backend** — it is `openclaw-gateway` via `OpenClawGatewayManager`.
  Only **kimi** reaches the ACP seam today.
- The Flux chip still renders on `absent` cards and is a **live button** opening
  FluxSetupModal — configuring Flux for an agent you do not have. (My instruction; flagged MAJOR.)

**Cross-cutting**
- `--danger` `#f87171` is **2.77:1 on white** (AA needs 4.5:1). Same class as the fixed
  `--warning`; deferred for blast radius.
- **Constitution**: an unreadable 355-byte *key ring* kills **every turn on every backend**,
  while the real 697 KB constitution ships bundled and readable. Should degrade, not brick.
- **safeStorage keychain hang**: an unsigned dev binary requesting a signed app's keychain
  item **hangs forever** (measured 120 s, killed). No timeout on that path.

**Nano / PR #950** — blocked on Sean publishing. Reconciliation done (`1cda570a8`):
`createWNanoAgent()` returns `available:true` with neither `cliPath` nor `launch` and is
merged at index 1, so first-wins dedup makes that stub the **only** `wnano` entry — a real
install is unlaunchable **and** a user's own PATH copy is discarded. Also: **#950's
`AcpConnection.ts` hunk is dead code** (`new AcpAgent` is never constructed; live path is
`AcpAgentV2`). A bundled Nano is on neither PATH nor a receipt, so `createWNanoAgent()`
needs a resolved absolute `cliPath` mirroring `detectWCore()` — **currently unowned**.

---

## 5. ⚑ What only Sean can do

1. **Ten-minute interactive logon on SeanDesktop as `WaylandCleanTest`** and run
   `C:\wl-clean\out\win-unpacked\Wayland.exe`. This is the only test that can falsify the
   whole installer packet. Password: `C:\Users\seand\wayland-cleantest.cred` (owner-only).
   The account is **proven clean** (no agent CLI on the system PATH across 26 entries);
   a plain `Users` account lacks `SeBatchLogonRight`, so it cannot be driven by task.
2. **The H3 audio listen** — long multi-sentence answer, judge the seams. jsdom has no
   `AudioContext`; no test will ever settle this.
3. **Sign off `.planning/VOICE-SMART-DEFAULTS.md`** (`06b2928d7`) — stages 2–5 are gated.
4. **Nano**: publish, then supply — release repo, exact tag, 6 asset filenames, **two**
   SHA-256s per asset (archive AND extracted binary), target binary name, attestation
   fields (`signerWorkflow` / `sourceRef` / `sourceDigest`), npm name+version.
5. **Decide**: hosted TTS now sends his **display name** to OpenAI in the greeting. New
   data category. Make it name-less by default?
6. **Decide**: fix `--danger` contrast now, or defer.

---

## 6. Process traps learned today — do not repeat

- **Never run multiple agents in one worktree.** They share a git index: `5f8532ca9`
  absorbed 6 files from another agent. Content intact, attribution wrong. **No history
  rewriting** — it stays documented. Give each lane its own worktree.
- `run_in_background` has been observed executing in the **wrong worktree**. Run suites
  **foreground**.
- **Reading DOM text is not proof a feature works.** I read the greeting sentence and
  called it landed; it speaks nothing.
- **Every zero needs a known-positive control.** Two false zeros this session (a broken
  grep, and a log grepped before the app had written to it).
- **PowerShell**: `$ErrorActionPreference = "Stop"` turns native stderr into a terminating
  error — `git clone` writes "Cloning into…" to stderr and killed its own clone. Use
  `Continue` + `$LASTEXITCODE`.
- **Windows OpenSSH kills the session's process tree on disconnect.** `Start-Process` does
  not escape it. Use a **Scheduled Task**.
- **`az vm create` is broken in azure-cli 2.85.0** ("content for this response was already
  consumed"). Use `az deployment group create` with an ARM template. Azure VM quota on this
  subscription is **0** — cloud Windows is not available without a support request.
- **`WAYLAND_MULTI_INSTANCE=1` changes the app identity** (`Wayland-Dev` → `Wayland-Dev-2`),
  and `safeStorage` keys by identity. That recipe **poisons profiles**. Don't use it against
  a profile with real data.

---

## 7. Sean's live state (dev profile `Wayland-Dev`)

- Voice set to **`system-native` out** (macOS `say` — works, he heard it) and
  **`whisper-local` in** (will not work; see §2.1).
- Constitution `revision-authority.enc` **moved aside** with two backups
  (`.bak-*` and `.locked-*`, 355 B each) so turns work again. Original bytes intact.
- Config backed up at `config/wayland-config.txt.bak-voicefix-*`.
- Providers: Flux Router (77 models), ChatGPT-subscription and Sakana are genuinely
  connected; xAI's key is genuinely dead (403); Groq/Gemini/OpenRouter/OpenAI have
  **undecryptable** creds and now show honest red with a re-key action.
