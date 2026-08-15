# Handoff — 2026-08-15, end of session. START HERE.

**0.12.0 is merged to `main` and NOT tagged. Two real Nano PRs are still outstanding.**

`[V]` = established by executing it this session. Everything else says what it is.

---

## 0. State right now

| Thing | State |
|---|---|
| `main` | `0e7f00a4e` [V] |
| Version on main | **0.12.0** [V] |
| `WNANO_NPM_VERSION` on main | **`'0.1.0'`** (stable) [V] |
| Tag | **NONE.** No `v0.12*` tag exists [V] |
| Release fired? | **No.** `build-and-release.yml`'s newest run is still v0.11.18 from July [V] |
| Open PRs | 4, all Nano (#950–#953) |

Merged this session: **#956** (Desktop 0.12.0, 431 commits, squashed) and **#957** (Nano stable pin).
Both green on all four required checks before merge.

⚠️ The repo **auto-deletes merged branches**. `packet/wl-integration` was deleted on merge
and I pushed it back to preserve the 431-commit history. Do not assume a branch survives.

---

## 1. 🔴 THE THING THAT WILL MISLEAD YOU

**#950–#953 are a STACKED CHAIN, not four independent PRs.**

```
main
 └─ #950  feature/wayland-nano          CONFLICTING with main
     ├─ #951  feature/wnano-bundling        base = feature/wayland-nano
     ├─ #952  feat/wnano-provider-parity    base = feature/wayland-nano
     └─ #953  feat/c7-error-ux              base = feature/wayland-nano
```

GitHub reports #951 and #952 as **MERGEABLE / CLEAN**. That is **clean against
`feature/wayland-nano`, not against `main`** — a base whose content main already absorbed
through the #956 squash. Their green status means nothing. Read the base ref before
trusting any mergeability field. (This exact trap is in the durable memory notes; it bit
a previous session too.)

**Squash-merge also destroys ancestry.** `git merge-base --is-ancestor` cannot tell you
whether these landed, because #956 collapsed 431 commits into one. The only reliable test
is **content**: does the PR's distinctive file exist on main.

---

## 2. Per-PR verdict [all V, by file existence on `ferrox/main`]

### #950 — "add Wayland Nano as a first-class built-in ACP agent"
**ALREADY LANDED.** `src/renderer/assets/logos/brand/wayland-nano.svg` and
`src/common/types/nanoErrorCodes.ts` are both on main.
→ **Close as superseded by #956.** Note it is the BASE of the other three, so close it
last, or re-target them first.

### #952 — "inject multi-provider credentials into wnano spawns (C8)"
**ALREADY LANDED.** `wnano/oauthBearer.ts`, `wnano/providersPayload.ts` and
`tests/unit/task/wnano/fluxKeyFile.test.ts` are all on main.
→ **Close as superseded by #956.**

### #953 — "consume nano typed errors (data.nanoError)" — REAL WORK, NOT LANDED
`errorNormalize.ts` exists on main, but **`nanoError` appears ZERO times** on main in
`PromptExecutor.ts`, `errorNormalize.ts`, `AcpError.ts` or `AcpAgentManager.ts` [V], and
both of its tests are absent. The error-code *table* landed; the *consumption* did not.
+1012/-7 across 8 files.
→ **Rebase onto `main`, re-run CI, merge.** Expect conflicts: it is already CONFLICTING
against its own stale base.

### #951 — "bundle wayland-nano into packaged Desktop" — REAL WORK, NOT LANDED
**None of its files exist on main** [V]: no `scripts/prepareWaylandNano.js`, no
`src/process/agent/wnano/binaryResolver.ts`, no `scripts/bundled-wnano-shasums.json`.
+1457/-19 across 16 files, including `electron-builder.yml`, `scripts/build-with-builder.js`
and `scripts/verify-packaged-resources.js`.
→ **Rebase onto `main`, then a FULL PACKAGED-BUILD verification, not just CI.** It changes
packaging. `verify-packaged-resources.js` is the release gate itself.

---

## 3. The decision that gates the tag

**Today, Nano is NOT bundled.** There is no `prepareWaylandNano` beside `prepareBundledBun`,
`prepareVoiceModel`, `prepareOfficeCli` [V]. Nano launches via `npx waylandnano@0.1.0`
(`defaultCliPath` in `acpTypes.ts`), so **first use needs network and npm.** Every other
bundled dependency is baked into the package.

Verified working [V]: `npx -y waylandnano@0.1.0 --version` → `wayland-nano 0.1.0`, and the
`acp-host` subcommand Desktop spawns starts and exits cleanly on EOF. The 0644 bin mode on
the tarball does NOT affect us — npx runs it through node's bin shim rather than exec'ing it.

**NOT tested: the offline failure path.** If a user on a locked-down machine picks Nano and
npx cannot fetch, I do not know whether it degrades cleanly or hangs. Worth 10 minutes
before shipping Nano as "first-class built-in".

**Sean's call:**
- **(a) Tag 0.12.0 now**, Nano via npx, land #951 bundling as 0.12.1. Lowest risk — the
  build is already verified green on three platforms and #951 is exactly the kind of
  packaging change that invalidates a proven release.
- **(b) Land #951 + #953 first**, then tag. Better product story, but it is a rebase of two
  stale stacked PRs plus a full packaged re-verification.

My recommendation was **(a)**. Sean has not chosen yet as of this handoff.

---

## 4. Recommended order next session

1. Confirm nothing changed: `main` sha, version, no `v0.12*` tag.
2. Take Sean's (a)/(b) decision. If **(a)** → bump nothing, just tag and watch
   `build-and-release.yml`.
3. Close #950 and #952 as superseded (verify the content-on-main check again first —
   cheap, and closing is the irreversible-ish bit).
4. Rebase #953 onto main → CI → merge.
5. Rebase #951 onto main → CI → **packaged build + `verify-packaged-resources`** → merge.
6. Only then consider a 0.12.1 with bundling.

---

## 5. Known-open from the 0.12.0 work (none block the tag)

- **`redteam-extension.e2e.ts` still fails.** The probe never runs, so the spec proves
  nothing in either direction. It was failing before this session. The srcdoc →
  `wayland-asset://` change did NOT fix it; what IS fixed is that the load path now matches
  production and the spec's false claim (that the fixture was outside an allowlist root) is
  gone. Someone needs to determine whether the asset frame receives the app CSP.
- Final e2e: **603 passed / 20 failed / 196 skipped** [V]. Every failure was re-run
  individually. Most were load artifacts on a machine at load 30-47. `cron.e2e.ts` is NOT a
  cron defect — it is `Bridge invoke timeout: cron.add-job`, and the test beside it that
  actually fires a job passed in 1.4s. The rest need live model credentials.
- **Two bugs found while auditing, never filed:** the in-app "create skill" flow writes to
  `~/.wayland/skills/<name>/SKILL.md`, which is neither scanned by `discoverSkills` nor in
  the advertised `[Skills Location]` block; and project-knowledge injection is a snapshot
  frozen at conversation creation, so editing `.wayland/CONTEXT.md` never reaches an open chat.
- **`ConsequentialPolicyPreview` enforces nothing** — renderer preview, zero main-process
  callers. Do not let it be described as a safety layer.

## 5b. Product commitment made to a client this session

Sean answered Marc Goldman on using Wayland as the control plane over a "Project Brain"
(with Graft supplying the code graph). **Two things were promised for the next version:**
1. **Teams do not inherit their project's knowledge.** A Team carries no `projectId`, so
   `injectProjectKnowledge` is a no-op for team agents — they share the workspace directory
   but not the injected context. This is the single largest hole in the shared-brain story.
2. **Make that injection live** rather than frozen at conversation creation (same bug as above).

Not promised, correctly framed as new work: evidence states (`RUNTIME_VERIFIED` etc. do not
exist in any form), computed staleness (the freshness field is always written
`never_reviewed` and nothing computes it), a precedence model, and a propose→approve gate.
Full written answer: artifact "Wayland as Project Brain".

---

## 6. Standing constraints (unchanged)

**The tag is the release.** `build-and-release.yml` fires on **any tag** and on pushes to
**`dev`** — NOT on merges to `main` [V]. So merging and pushing branches are safe; tagging
is the irreversible act and is Sean's.

Never commit `constitutionFsAuthority.generated.ts`; never `git add -A src`. gh writes must
be **FerroxLabs**. No AI signatures in commits or PRs. Never weaken the security shell.
Never relax or delete a test to make it pass.

## 7. Traps that cost real time this session

- **`prek` runs ALL hooks; running one is not enough.** Fixing oxfmt alone left
  trim-trailing-whitespace failing. Run `prek run --from-ref ferrox/main --to-ref HEAD`
  locally and get exit 0 BEFORE pushing, or you burn a 20-minute CI cycle per attempt.
- **oxfmt auto-fixes rather than checks**, so Code Quality fails if it would change anything
  in the whole branch diff. Always run it through `prek`, never by invoking oxfmt directly —
  the config's exclude list exists because past formatter runs broke pinned artifacts.
  Formatting `skills-library/bodies/**` broke a byte-identical-pair assertion this session;
  that path is now excluded.
- **A cancelled shard reds out all three `Unit Tests (<os>)` required checks** exactly like a
  failure. A shard timing out at exactly its cap reports as "cancelled". The cap is now 20m.
- **`pgrep -f "pattern"` in a wait loop matches the waiting shell itself** and deadlocks
  forever. Use `pgrep -f "[p]attern"`.
- **`rtk` silently truncates.** `git log` returned 50 rows for a 431-commit range. Use
  `rtk proxy git …` for enumeration and `/usr/bin/wc`.
- The Playwright fixture launches the **compiled `out/` bundle** — `src/` edits are invisible
  until `bun run package` (~5-6 min).
