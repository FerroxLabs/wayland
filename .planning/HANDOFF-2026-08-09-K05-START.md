# WLD-K handoff v4 — Core exchange CLOSED, next is K-05 (agent installer), FULL plan

**Worktree** `~/dev/wayland-worktrees/packet-attribution`, branch `packet/attribution-audit`,
head **`8bc28852e`**, in sync with `ferrox`. Full suite **16,329 passed, 0 failed**, typecheck clean.
**Nothing merged, nothing tagged, no PR.** Only `AGENTS.md` and the never-commit
`constitutionFsAuthority.generated.ts` are dirty (both permanent).

**Read in this order**

1. this file
2. `.planning/K-05-INSTALLER-PLAN.md` — the build plan, 415 lines, execution-corrected
3. `.planning/HANDOFF-2026-08-09-WLD-K-v3.md` — the state K-05 starts from

---

## 1. SEAN'S DECISIONS — already made, do not re-ask

- **Scope: the FULL K-05 plan, all ten tasks (~21–22 days).** I recommended the 10-day critical path
  only and flagged that the full plan consumes the entire Master Class runway. **Sean chose the full
  plan.** That is his call, it was made with the concern stated, and it is not to be relitigated.
- **Loose ends: clear all three first.** W-G, W-D, and the corrupted-conversation DB migration.
- **The plan's own §4 blockers, taken as my recommendations unless Sean says otherwise:**
  - **Q1 — qwen ships first, auggie install-only.** auggie returns `authMethods: []` and requires
    `auggie login` in a terminal; it can _never_ satisfy "and a chat runs on it". qwen was proven
    end-to-end (`session/new` returned a sessionId, nothing written outside our root).
  - **Q2 — the T6 credential path is IN SCOPE.** Without it INS-01 is unprovable:
    `resolveBuiltinBackendConfig` returns no `customEnv`, `acp.config[backend].authToken` has zero
    consumers, and `selectAuthMethod` requires a `type` field qwen does not emit.
  - **Q3 — Windows install root moves to `%LOCALAPPDATA%`.** A 116 MB `node_modules` in roaming
    `%APPDATA%` causes logon sync storms; under Folder Redirection `rename` is not atomic.
    `manifest.json` stays in `userData` so the authority record still roams.

---

## 2. Loose ends — 1 of 3 DONE

- ✅ **W-G — renderer message index** (`8bc28852e`). Keyed by `msg_id + type + position` instead of
  bare `msg_id`, which had mapped a TURN to its last message and fragmented the assistant reply
  around every tool call. Test drives the real hook, not the pure helper.
- ⬜ **W-D — the `bg-bg-*` sweep.** 15 files use `bg-bg-2`, which compiles to nothing — the defect
  that made the workbench panel invisible for months. **Method: check computed style, never trust
  the class name.** Valid tokens are `bg-1..bg-10`, `bg-base`, `bg-hover`, `bg-active`, plus
  `bg-fill-1..4`; numeric keys serve `border-*` too (`uno.config.ts:27-33`).
- ⬜ **The corrupted-conversation DB migration.** Sean's call, still NOT run. Rows are
  `type='text' AND position='left' AND id = msg_id`; flipping them back to `'right'` restores the
  turn boundary and lets the `msg_id` fallback in `selectCurrentExecutionMessages` be deleted.
  **Known false positive to exclude:** `WCoreManager.emitTruncationFlag` legitimately writes that
  same shape. Content stays unrecoverable either way. Back up the row before touching it.

---

## 3. K-05 — what to build

`.planning/K-05-INSTALLER-PLAN.md` is the authority. Critical path is **T1 → T4 → T5 → T6 → T10**.

**T1 is the true gate — start it first, alone.** Until the structured launch command exists nothing
spawns correctly on Windows and T5's pre-spawn verification has nothing to verify. The known trap:
`parseWindowsCliPath` keeps only the first quoted token, so `C:\Program Files\Wayland` breaks.

**Parallelisable off the critical path:** T2 and T3 can start immediately alongside T1 (different
files). T7, T8, T9 can run concurrently once T2 lands. **T8 needs the Windows box — book it early**
(`ssh -i ~/.ssh/wayland_win seand@100.109.207.54`, PowerShell uses `;` not `&&`, repo `C:\wl-verify`).

**What already exists, so do not rebuild it:** `AgentRegistry` (`src/process/agent/AgentRegistry.ts`)
detects claude, codex, kimi, auggie, goose, qwen, opencode, copilot, droid. Detection is done;
**installation is the gap — there is still ZERO install code in `src/`** (positive-controlled).

**Hard constraints carried from the milestone:** never `curl|sh`; pinned version + verified checksum;
explicit per-install consent; uninstall by MANIFEST, never by name; Windows first-class.

---

## 4. Method rules that have earned their place

- **Establish every mechanism claim by EXECUTING it.** Reading source has been wrong repeatedly this
  milestone.
- **A zero proves nothing until the same method finds a known positive.** Caught real false findings
  three times.
- **A positive proves nothing without a negative control.** The C-4 wire evidence is only worth
  something because the old binary produced the opposite result.
- **Never state a mechanism you cannot reproduce.** I told Core the macOS SIGKILL was a
  code-signing cache and had to retract it; the observation was real, the explanation was invented.
- **Verify the fix in the thing the user sees**, and **measure the style, don't read the class name**.
- rtk truncates and mangles: use `rtk proxy <cmd>` for counting, `LC_ALL=C grep -a` on files it
  treats as binary, and the vitest JSON reporter to read failures.

## 5. Guardrails — the ones that bit

- **NEVER `git add -A src` or `git add -u src`.** Both sweep
  `constitutionFsAuthority.generated.ts` (local trust-root sha). It happened again this session.
  **Stage by explicit path.**
- `bun run start` does not run prebuild hooks → `ConstitutionFsBinaryError`. Fix:
  `node scripts/prepareConstitutionFs.js`, which dirties that never-commit file. Leave it dirty.
- No merge, no tag, no release, no PR without Sean. `build-and-release.yml` fires on **ANY** tag.
- Never touch `~/dev/wayland/app`. gh writes must be **FerroxLabs**. No backticks in gh bodies.
- **Sean's `~/Library/Application Support/wayland-core/config.toml` is `sha256:0bc1051d…`.** It has
  `backend = "plaintext"`, which makes the engine refuse to start. Run under a scratch
  `WAYLAND_HOME` — never edit his file.
- Never relax, skip or delete a test to make something pass; retarget it to the new owner instead.
- **Replacing the engine binary: `rm` then `cp`, never overwrite in place** (mechanism unproven, see
  the reply doc — but the observation was real).

## 6. Engine state

Bundled engine is the **C-1..C-5 integration build**, `sha256:6d0ca72a…`, Core `d6f76c67`. It
self-reports `0.12.26` — identify it by sha. Contract pinned to minor 13 / gen-14. The bundle
manifest deliberately still describes the RELEASED engine, so the sha mismatch is a tripwire that
makes `verify-packaged-resources` refuse to package this build. Do not "fix" that.

The Core exchange is closed on both sides:
`.planning/REPLY-TO-CORE-2026-08-09-c1-c5-integration.md` (+ §6a correction) and
`.planning/REPLY-TO-CORE-2026-08-09-c4-wire-evidence.md`. Still open with Core, neither blocking:
the Gemini `position 2` 400 (unreproduced by BOTH sides, no request body ever captured) and their
§6 resumed-session residual, which **we could not reproduce** and filed as an observation awaiting
their confirmation.
