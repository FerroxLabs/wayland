# START HERE — 2026-08-11 (end of session)

| Lane | Worktree | Branch | Head | Suite |
|---|---|---|---|---|
| **Voice + UI** | `wayland-worktrees/packet-attribution` | `packet/attribution-audit` | `0754a662c` | **16,663 / 0 failed** |
| **Agents** | `wayland-worktrees/packet-agent-installers` | `packet/agent-installers` | `24289e4f1` | green, but **NOT shippable — see blockers** |

Nothing merged, tagged, or PR'd. `AGENTS.md` and
`constitutionFsAuthority.generated.ts` stay unstaged, always.
**`main` has moved ZERO commits since we branched** — the merge is a clean
fast-forward of 218 commits, no conflicts, no rebase.

---

## 🔴 JOB 1 — the core agent is broken and it is blocking Sean

`Agent failed to start: Error while decrypting the ciphertext provided to
safeStorage.decryptString.` Every turn dies. This is what Sean is looking at.

**It is NOT a regression from our 218 commits.** Proven: a clean
`WAYLAND_DEV_PROFILE` boots with **zero** decrypt errors; his `-dev` profile
throws **six**. The constitution authority file in that profile was encrypted
under a different app identity (safeStorage keys by identity, and running dev
from a worktree ≠ the canonical app that wrote it).

**But the failure MODE is a real bug and is the actual work:**
- Path: `readAuthorityFile` → `ConstitutionRevisionAuthority.load` →
  `ConstitutionFsService.readConstitution` → `composePrompt` →
  `WCoreManager.start`. The raw crypto error is thrown straight through and
  printed into the chat.
- **The sibling authorities already do this correctly.**
  `constitutionArchiveRestoreAuthority.ts:424-431` and
  `constitutionClassicRecoveryAuthority.ts:340-347` both catch decrypt failure
  and wrap it as a typed `INTEGRITY_FAILURE`. The revision authority does not.
- **A whole recovery UI already exists and is unreachable from here:**
  `src/renderer/pages/settings/ConstitutionSettings/ConstitutionRecovery.tsx`,
  `ConstitutionClassicRecovery.tsx`, `ConstitutionRecoveryOperationLock.ts`.

**Fix:** classify it like its siblings, and route the user to the recovery flow
instead of a stack trace. Unblock Sean immediately with a fresh
`WAYLAND_DEV_PROFILE`; that is a workaround, not the fix.

---

## 🔴 JOB 2 — the agent installer is a DEAD END

Three adversarial reviewers all refuted the seam+UI (`24289e4f1`, committed as
WIP on purpose, blockers named in its message).

**BLOCKER — nothing consumes the install receipt.** Verified independently: the
only reader of `getAgentInstallStatus` / `readInstallReceipt` outside
`src/process/services/agentInstaller/` is `agentInstallerBridge.ts:73`, the
status handler. So on a clean machine: Install → "Installed by Wayland" → **the
agent is still absent from the picker.** The launch path must read the receipt
and use its `AcpLaunchSpec`. This is the packet that makes any of it real.

**BLOCKER — concurrent installs into the same prefix.** The only "already
installing" guard is React state in the mounted component. Navigate away
mid-install and back → a second `bun install` into the same directory. Main has
no in-flight guard.

**MAJOR — the Flux chip on an `absent` card is a live config write.** My
instruction, and it was wrong: for codex/kimi that chip is a *button* opening
FluxSetupModal, so a user can configure Flux for an agent they do not have. Make
it inert when absent.

**MAJOR — no timeout, no cancel** anywhere along the seam (`execFile` has no
`timeout`, the handler awaits unbounded, the UI shows a disabled spinner).

**MAJOR — D7's remote denial has no UI failure path.** The WS adapter *resolves*
a denied invoke with `{error:'failed'}`, which the hook does not treat as
failure → on a paired device, Install is a silent dead click.

**SOUND, keep it:** the env-gap decision. `AcpLaunchSpec` gained an **optional**
`env`, validated only when present, omitted entirely when empty so packaged
receipts stay byte-identical. `isAcpLaunchSpec` still accepts every
previously-valid shape (mutation-proven). Status carries `system|installed|absent`
as DATA with raw facts alongside; the launch spec is deliberately kept off the
wire; denial keys are fully qualified.

---

## ✅ WHAT LANDED THIS SESSION — voice

**Phases 0–3 complete: V1 through V22.** Suite 16,663 / 0 failed.

- **V12 tests** `7edce2ce7` · **V15** `f23e28cf1` (mic renders when dictation is
  off and routes to settings; never auto-enables, because the stored default is
  `{enabled:false, provider:'openai'}` while an UNSET provider transcribes
  on-device) · **V13** `7fd7d5cb8` (rose 1.4s listening vs indigo 2.6s speaking,
  CSS-owned animation, session-driven level meter) · **V14** `27a476638`
  (9 keys × 12 locales + parity test with a frozen baseline for 406 pre-existing
  gaps) · **V16/V17/V18** `76640d4e0` (staged attachments can no longer be
  swallowed by a spoken turn; 6 wrappers; 23 tests, 20 mutations) ·
  **V20/V21** `62fdee6c0` · **V22** `ec27cb75e` (sentence-by-sentence speech,
  ≤2 synth calls in flight, gapless cursor, epoch + `stopAll`).

**H3 first gate PASSED** — Sean could not reliably tell one-shot from chunked and
said both sound good; the mild preference for one-shot is the 2.32 s of lost
pause across five joins, not the voice. V22 schedules on a cursor, so restoring
pause is a one-constant change.

**⚠️ H3 SECOND LISTEN STILL BLOCKS V22.** jsdom has no `AudioContext`, so V22's
whole suite grades scheduling arithmetic against a fake the implementer wrote —
green there proves the maths, not the sound. Needs the packaged app, real
speakers, one long multi-sentence answer.

**Live-verified as a user: only V15.** V13's rings, V16's deferral, V17/V18 have
never been seen running — they need a real microphone and a real streaming reply.

---

## ✅ WHAT LANDED THIS SESSION — UI

- **Workbench is Workspace only** `340760f89`. Engine box and Progress rail
  unpublished (not deleted — `missionSection` is still computed for the
  in-thread strip, so restoring is an uncomment). 9 tests repointed, plus a new
  test pinning the removal so it cannot creep back.
  **Cost, stated plainly:** the two secret-masking tests lost their rendered-DOM
  leg — `redactCommandSecrets` had exactly one renderer, `MissionProgressPanel`,
  now unmounted. They assert the fields *and* the humanized label instead;
  mutation-testing confirms that is not weaker. `adapters.test.ts` never
  exercises that path with a secret, so those two are its only coverage.
  `MissionProgressPanel` is now dead code with a live test file — deletion is a
  separate call.
- **One workbench toggle** `0754a662c`. The titlebar keeps it; the duplicate
  36px rail strip is gone.

## ✅ AGENTS — what is proven

Real installs against the real registry: **codex, kimi and openclaw** each
install with `--ignore-scripts` into a per-agent prefix, resolve a launch spec
pointing at a real file, **spawn with `shell:false`**, and uninstall by manifest
leaving siblings untouched. None route through `node_modules/.bin`.
Also landed: kimi renamed to Kimi Code, the `.kimi/skills` → `.kimi-code/skills`
bug fixed, the `cli-setup` skill repaired (it shipped `uv tool install kimi-cli`,
which installs *different, legacy* software), and a Flux connector for Kimi Code
built, wired and mutation-proven.

---

## 🟡 SMALLER, STILL OPEN

- **Test voice fails with jargon instead of asking.** Hosted providers are
  consent-gated; `handleTestVoice` (ToolsModalContent.tsx:297) calls speak
  directly and toasts `TTS_HOSTED_CONSENT_REQUIRED` — while `consentModal` and
  `ensureConsent` are on that very component and never invoked from that path.
  Also the phrase is "Voice check."; Sean wants something human like
  "Hi, I'm Wayland. How are you?"
- **Auto-read is not implemented.** `autoReadResponses` has NO runtime consumer
  anywhere — it is a toggle wired to storage that nothing reads.
- **`setup-opencode` / `setup-codex` are remote-reachable** and write the Flux
  key in plaintext to a host config, while `onboarding.connect-flux` IS denied.
  Only the kimi equivalents were denied. Sean's call.
- **Merge:** 218 commits, clean fast-forward. Recommend ONE PR — the commits are
  atomic and well-messaged, and splitting is days of work for review granularity
  nobody will use. `build-and-release.yml` fires on ANY tag.

## Method notes that keep paying
- **NEVER `git checkout` an uncommitted file** to undo a mutation.
- **`waitFor(() => expect(x).toBeNull())` can pass vacuously** — it succeeds on
  its first sync check, before async effects resolve.
- **An unqualified denylist entry never fires** — matching is exact.
- **`bun install --cwd <dir>` walks UP** and will install into an ancestor's
  `node_modules`, leaving the target empty.
- **rtk piping fails silently** — count with python, not `| rtk wc -l`.
- Facts handed to subagents have twice been wrong and were caught by RUNNING the
  thing. Brief agents with facts, but let them contradict you.
