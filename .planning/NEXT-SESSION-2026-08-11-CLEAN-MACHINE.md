# START HERE — 2026-08-11, paused at weekly limit

Paused mid-run for an account switch. Nothing is half-applied; both worktrees
are committed. **All cloud resources are destroyed and verified destroyed.**

| Lane | Worktree | Branch | Head | Suite |
|---|---|---|---|---|
| Voice + UI | `wayland-worktrees/packet-attribution` | `packet/attribution-audit` | `71ca6a0f5` + Job 1 (see below) | 16,663 / 0 at branch point |
| Agents | `wayland-worktrees/packet-agent-installers` | `packet/agent-installers` | `a651f4578` | **16,821 / 0 failed** |

Nothing merged, tagged, or PR'd. `AGENTS.md` and
`constitutionFsAuthority.generated.ts` stay unstaged, always.

---

## ✅ JOB 2 IS CLOSED — the installer is no longer a dead end

Three commits on `packet/agent-installers`:

| SHA | What |
|---|---|
| `67a558318` | Read the install receipt back, so an installed agent can launch |
| `8725b9442` | Guard concurrent installs, and give them a deadline and a cancel |
| `a651f4578` | Put the in-flight install and its cancel on the wire |

21 files, +1635 −30. Suite **16,776 → 16,821, 0 failed**. 13 mutations, each
RED then GREEN after restore from a saved copy, each confirmed applied on disk.

### My diagnosis was one layer off — correct the record
The *consumer* of `AcpLaunchSpec` was already complete and well built
(`AcpAgentManagerData.launch` → `LegacyConnectorFactory:65,95` →
`createGenericSpawnConfig` at `acpConnectors.ts:265`, which takes the spec
branch first, bypasses `parseWindowsCliPath`, and merges `launch.env`).
What was missing was a **producer**: `extra.launch` was only ever written by a
previous spawn of that same code, so nothing ever set it a first time.
New file `src/process/services/agentInstaller/installedAgentLaunch.ts` is it.

Also: the live launch path is `AcpAgentV2` (`AcpAgentManager.ts:1712`), NOT
`AcpConnection.connect()` — that legacy path drops `launch` entirely, but
nothing reaches it.

### 🔴 THE FINDING THAT CHANGES SCOPE — verified by running the binaries
**`codex` has no `acp` subcommand.** `@openai/codex@0.147.0 --help` lists
`exec, review, login, mcp-server, app-server …` and no `acp`. The `codex`
backend's `acpArgs` is `[]` because the thing meant to be spawned is a
*different* package, `@agentclientprotocol/codex-acp`. Feeding the codex
receipt into the ACP seam would spawn the interactive TUI with no args and
**hang the session**. There is a gate; codex cannot reach the seam.

**`openclaw` is not an ACP backend at all** — `openclaw-gateway` is its own
conversation kind with `OpenClawGatewayManager`, which takes a `cliPath`
*string* resolved through PATH. It needs its own launch-spec seam.

So `AgentPackage.acpBackend` is now explicit and **only `kimi` is mapped**
(`kimi acp` is documented by its own `--help` as an ACP server over stdio).
codex and openclaw still install / record / uninstall exactly as before; they
just do not reach the ACP launch seam. Two follow-ups, each its own packet:
openclaw needs a seam in `OpenClawGatewayManager`; codex needs a way to point
`codex-acp` at the installed binary.

### D1 (system copy wins) is decided in exactly one place
Managed entries merge *behind* the PATH-detected builtins, so the pre-existing
first-wins `deduplicate()` keeps the user's copy. `getManagedLaunchSpec` reads
the *merged* list, inheriting that decision instead of re-deriving it.

### End-to-end evidence, real install → receipt → spec → real spawn
Kept as `tests/live/agentInstallLaunch.live.test.ts` (3 tests, green, NOT in CI
— it hits npm). Scratch `userDataDir` + scratch `KIMI_CODE_HOME`;
`~/.kimi-code` never touched. Proven: kimi spawns from the receipt with
`shell:false`, args `[…/dist/main.mjs, "acp"]`, exit 0, version 0.34.0.

---

## ⏳ JOB 1 — constitution decrypt — WAS STILL RUNNING AT THE PAUSE
Agent was working in `packet-attribution` on: classify the
`safeStorage.decryptString` failure the way its two siblings already do
(`constitutionArchiveRestoreAuthority.ts:424-431`,
`constitutionClassicRecoveryAuthority.ts:340-347` wrap it as
`INTEGRITY_FAILURE`), and route to the recovery UI that already exists and is
currently unreachable (`ConstitutionRecovery.tsx`,
`ConstitutionClassicRecovery.tsx`, `ConstitutionRecoveryOperationLock.ts`).
**First action next session: check `git log` in that worktree** to see whether
it committed before the pause.

Reminder: this is NOT a regression from our commits. A clean
`WAYLAND_DEV_PROFILE` boots with zero decrypt errors; Sean's `-dev` profile
throws six, because safeStorage keys by app identity and dev-from-worktree is a
different identity than the canonical installed app.

---

## 🖥️ CLEAN-MACHINE PLAN — decided, not yet executed

**Sean approved: a fresh local account on SeanDesktop.** Not yet created.

Why this and not cloud, all verified this session:
- **Azure has zero VM quota.** Azure's own preflight: `standardDSv5Family …
  Current Limit: 0`. `az vm list-usage -l eastus` returns `[]` even unfiltered.
  Raising it is a support request with human approval, hours to days.
- **Windows 11 *client* in the cloud is essentially Azure-only.** GCP and AWS
  give Windows *Server*, which is not what users run.
- **`az vm create` is broken in azure-cli 2.85.0** — `RuntimeError: The content
  for this response was already consumed`, reproducible with a different image
  and minimal flags. The ARM-template path (`az deployment group create`) gets
  past it; template saved in this session's scratchpad if needed again.
- **SeanDesktop is Windows 11 Pro 10.0.26200, 32 cores, 127.8 GB** and already
  runs four sandbox accounts (CodexSandboxOffline/Online,
  NanoK3SandboxOffline/Online), so a fifth matches the existing pattern.

**A fresh local account is both necessary and sufficient — proven:**
- *Sufficient*: every agent on that box is per-user —
  `codex`→`C:\Users\seand\AppData\Roaming\npm\codex.ps1`,
  `kimi`→`C:\Users\seand\.kimi-code\bin\kimi.exe`,
  `openclaw`→`…\Roaming\npm\openclaw.ps1`,
  `claude`→`C:\Users\seand\.local\bin\claude.exe`,
  `gemini`→`…\Roaming\npm\gemini.ps1`. Nothing machine-wide.
- *Necessary*: sanitizing `process.env.PATH` is NOT enough. `AcpDetector` uses
  `this.enhancedEnv` from `getEnhancedEnv()`, which resolves the user's login
  shell (`dscl` on macOS) and runs it with `-l` to source `.zprofile` /
  `.bash_profile`, merges that PATH with `process.env.PATH`, and additionally
  probes `~/.nvm` / `~/.volta` with `existsSync`. Process-level stripping is
  defeated by the login-shell merge.

**Do NOT touch `C:\wl-verify` or the `seand` profile.**

### Mac leg — decouple two things that got conflated
- The **H3 audio listen does not need a clean machine.** It needs the packaged
  app and real speakers. Cleanliness has no bearing on whether the voice sounds
  right. Sean can do it on his normal account.
- A clean-*profile* voice check is mostly covered by a fresh
  `WAYLAND_DEV_PROFILE`; a fresh macOS local account is the stronger version.
- Cloud Mac is not worth it: AWS bills EC2 Mac on a 24-hour minimum, ~$25 floor.

---

## 💸 CLOUD STATE — all destroyed, verified
Created and destroyed this session: `wayland-clean-linux-1` /
`wayland-clean-linux-2` (DO, nyc3, s-4vcpu-8gb, ~20 min) and the throwaway SSH
key `wayland-clean-run-2026-08-11`. Azure RG `wayland-clean-test-rg` deleted;
**no Azure VM was ever created** (quota). Total spend ≈ $0.05.
Verified remaining on DO: `flux-pool-r2-*` ×4 and `wayland-mobile-test` —
all pre-existing, untouched. **`flux-router-prod-rg` never touched.**

---

## ⚠️ HAZARD WORTH ACTING ON
The Job 2 agent reported that its `run_in_background` bash calls executed in
`packet-attribution` — the OTHER agent's worktree — despite an explicit `cd`
and even `sh -c 'cd … && …'`. Its runs were read-only vitest and it re-verified
every number in the foreground, but **if two agents run in two worktrees, do
not trust `run_in_background` cwd.** Use foreground runs, or verify the tree.

## 🟡 STILL OPEN (unchanged)
- Test voice toasts `TTS_HOSTED_CONSENT_REQUIRED` instead of invoking the
  `consentModal` / `ensureConsent` that sit on that very component
  (`ToolsModalContent.tsx:297`). Phrase should be human, not "Voice check."
- **Auto-read is not implemented** — `autoReadResponses` has no runtime consumer.
- H3 second listen in the packaged app still blocks V22 (jsdom has no
  `AudioContext`, so V22's suite grades arithmetic against a fake).
- Live-verify V13/V16/V17/V18 — need a real microphone.
- `setup-opencode` / `setup-codex` remain remote-reachable. Sean's call.
- Merge: 218 commits, clean fast-forward, recommend ONE PR.
  `build-and-release.yml` fires on ANY tag.
- Cancelled/timed-out installs leave a partial prefix on disk (matches
  pre-existing behaviour; status correctly reports not-installed).
- ACP *handshake* for an installed kimi is unverified — process spawn proven,
  JSON-RPC `initialize` not driven (needs real auth). Windows unverified.
