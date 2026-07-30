# Handoff — 2026-07-31, end of the execution session

Branch `packet/attribution-audit`, **37 commits, NOTHING PUSHED**. Worktree
`~/dev/wayland-worktrees/packet-attribution`. Tree clean except `AGENTS.md`, which IJFW rewrites
automatically and which has been left uncommitted deliberately all session.

## READ FIRST — three facts that override earlier documents

1. **The fork point is AionUi `v1.9.25` (`bbada2a92`), not v1.9.5 and not v1.9.8.**
   Full evidence in `.planning/phases/WLD-I-licence-compliance/FORK-POINT.md`.
2. **We did NOT fork an abandoned branch.** Upstream squash-merged that line (`5849b6899`,
   2026-05-11, single parent). A squash carries content but not ancestry, which is why
   `merge-base --is-ancestor` says NO while six of its changes are present at v2.1.44. Their own
   commit calls our line `origin/main`. The *experiment* was `feat/backend-migration`.
3. **Scope is 1377 derived files, not 981.** Re-baselined in `5b6648712`; manifest is
   `AIONUI-INVENTORY-1925.csv`. `AIONUI-INVENTORY.csv` is kept only as the superseded v1.9.5
   measurement.

## IN FLIGHT RIGHT NOW — three background audits

Launched just before this handoff; they survive compaction and will arrive as task notifications.
Each is read-only and told to report findings, not fix.

| audit | commit | the thing to look for |
|---|---|---|
| marker spoof | `cc82eddb1` | is `upgradeLegacyMarkerAttachments` actually WIRED on the read path, or tested-but-never-called? Did the `pathConfinement` roots companion change land (without it, "open log directory" on macOS is broken)? |
| Cherry Studio | `afd3dd028` | were all THREE patterns re-derived, or only rerank? Is the result genuinely re-derived or a cosmetic reshuffle of the same alternation set (still a derivative)? |
| arch guard | `39b49923f` | is the Doctor check actually REGISTERED or defined-but-unwired? Why did it touch `initStorage.ts` (+28)? |

**When they land: triage findings, fix what is real, do not chase nits.**

## What landed this session

| commit | what |
|---|---|
| `d84a7fee4` | **top_p P1 fixed** — stop sending `temperature`/`top_p` to Anthropic from the AionCLI adapter |
| `9f439fbeb` | **revert of `3f1c5ba10`** — 9 attribution restorations, adjudicated 9 RESTORE / 0 STAYS DELETED |
| `d02da3d5f` | deleted 22 unreferenced `public/pet-states/` assets (shipped twice per artifact) |
| `5b6648712` | inventory re-baselined on v1.9.25 (981 → 1377 derived) |
| `c8a51dc75` | `FORK-POINT.md` established |
| `687c793e3` | WLD-J `SUMMARY.md` (synthesiser's write was harness-blocked; orchestrator persisted it) |
| `ec562a914` | corrected the abandoned-branch reading + the 50 divergent commits |
| `0edee0f31`, `c1fa5a720` | the two fix plans |
| `afd3dd028` | Cherry Studio: three patterns re-derived |
| `cc82eddb1` | `[[AION_FILES]]` marker spoof + shell path confinement |
| `39b49923f` | macOS wrong-arch warning (Doctor check + concierge diag) |

All three code packets: **typecheck clean, 226 tests passing.**

## NOT BUILT — two packets the interrupted workflow never reached

Both were researched, planned and adversarially verified (FIX-FIRST, with the fixes specified).
Plans are in the workflow journal at
`~/.claude/projects/-Users-seandonahoe-dev-wayland/775e9698-5b3c-4417-8b28-a518f6f49b0a/subagents/workflows/wf_48d2bfde-d9d/journal.jsonl`.

1. **GPU-crash self-heal.** `src/index.ts:797` handles `render-process-gone` by LOGGING ONLY;
   `configureChromium.ts:44` scopes `disable-gpu` to WebUI/headless Linux so it never fires on the
   desktop path. Build the mechanism + a loop guard ONLY — skip the settings toggle, extra IPC and
   i18n (~380 of upstream's 473 lines were UI wrapping a switch our user never opens).
   ⚠️ The verifier found the plan's justification was **wrong**: it argued we have no crash data,
   but `@sentry/electron` IS live in the main process (`package.json:135`, `src/index.ts:34`,
   captures at `:434`, `:446`, `:918`, `:1341`). Check Sentry before building on precaution.
2. **"Set this up by chat" on the scheduled-tasks page.** ONE surface only. The second CTA
   ("Create Assistant → via chat") is **DROPPED** — no `create_assistant` proposal kind exists and
   the Concierge skill body tells the user to go to the assistants page, so it is a dead-end loop.
   🔴 **BLOCKING PRECONDITION, never answered:** does the `[Scheduling (CRITICAL)]` block reach
   Concierge's system prompt? The plan verified only `prepareFirstMessageWithSkillsIndex`
   (`agentUtils.ts:615-675`) but `WCoreManager.ts:555` calls a DIFFERENT builder,
   `buildSystemInstructionsWithSkillsIndex` (`agentUtils.ts:728`), and Concierge runs on Wayland
   Core. **If the block does not reach it, the button silently does nothing — do not ship it.**

## Decisions Sean made this session — do not re-litigate

- **§4(c): proceed as if the notice must sit IN THE FILE.** So I-05 is a ~1377-file generated sweep.
  Counsel (I-01) still goes out but no longer gates, because §4(b) forces a per-file pass anyway.
- **`aioncli-core`: KEEP IT.** Do NOT propose migrating the 57 importers away. It is AionUi's
  **Gemini CLI fork**, Gemini CLI is still supported, and it is our **fallback when wayland-core has
  a problem**. Future separate project: re-base our modifications onto a NEWER Gemini CLI.
- **`claude-team-mode-analysis.md`: LEAVE IT.** Sean's reasoning: the analysis fed a Rust
  implementation, so it is an approximation and no TypeScript was copied. Closed.
- **Cherry Studio: rewrite rather than credit** — and all three patterns, not just rerank.
- **Marker stripping (O-2): unchanged for now.** Keep today's strip for both positions; the
  content-suppression question is filed separately.
- Cleanup approved and done. **258 lane worktrees in `waylandcore-frontier-worktrees` are still
  NOT approved for deletion** (~24GB of source, may hold unpushed branches).

## Machine state

- **66GB reclaimed** (51GB → 117GB free), build cache only, zero source touched.
  `waylandcore/target` was deliberately KEPT (canonical Core tree).
- ⚠️ `~/dev/waylandcore/actions-runner/` is a **LIVE self-hosted CI runner** — a `cargo build` was
  mid-job. Never delete anything under `_work`.
- ⚠️ `waylandcore-ferrox` has **unpushed Core commits** on `plan/f20-unified-audit-repair`.
- Upstream archives live in **`~/dev/resources/`** — AionUi is `~/dev/resources/AionUi` (256 tags).
  NEVER stage upstream trees in the session scratchpad; it gets wiped.
- **6 tests fail for an environment reason, not a code bug**: the local `officecli` binary was
  re-signed by a packaging run (33,740,304 bytes vs upstream's 33,539,136), so it fails its pin,
  `prepareOfficeCli.js` aborts before writing `manifest.json`, and the fixtures ENOENT. Gitignored,
  untracked. Re-provision to clear.

## Open questions

- **O-3 (gates the marker packet's completeness):** does the desktop back up the DB before
  migrating? The packet avoided the question by taking a read-time upgrade instead of a data
  migration, which is the safe path — but the answer still matters for any future migration.
- **O-1:** was `files` plumbed to `TeamSession`? The commit touches it (+4) but this was never
  independently confirmed. If not, team-mode attachments silently stop rendering.
- Q1: do `electron-builder` 26.11–26.15 carry a security fix? Gates whether that bump is urgent.

## Constraints that never relax

No merge, tag or release without Sean — `build-and-release.yml` fires on **ANY** tag. Never touch
`~/dev/wayland/app` directly. gh writes must be **FerroxLabs**. No backticks in gh/wl comment
bodies. **No AI signatures in commits or PRs.** Never weaken the security shell (`sandbox`,
`contextIsolation`, `nodeIntegration`, CSP, `bridgeAllowlist.ts`, `urlValidation.ts`, DOMPurify,
`safeStorage`). Never touch the signing pipeline. **No history rewriting, ever.** The `aionrs` SQL
literals in `migrations.ts` must never change. `FoundrySkills`/`foundry-skills` must not be renamed.
**PR #925 must land before any of this merges.**

## Method traps that each cost a wrong verdict

- **`rtk` intercepts `git log` and truncated 1779 commits to 50.** Use `rtk proxy git …`. It also
  mangles `wc -l`, `grep -h`, `find -exec`, and multi-arg `git rev-parse`.
- **Confirm a search finds a known positive before believing a zero.**
- **Verify clone DEPTH before dispatching researchers** — a `cp -R`'d shallow clone made
  `rev-list A..B` return 1. `git fetch --tags` heals it in place.
- **`git diff --shortstat` silently inflates** when rename detection bails; use
  `-c diff.renameLimit=8000`.
- **Same-path blob comparison DOES work** for fork-point detection; blob-SET intersection does not.
  Do not conflate them.
- **`git cherry` and patch-id intersection are useless across the `src/` → `packages/desktop/src/`
  move.** Only a controlled `git log -S` content search worked.
- **`bun patch --commit` leaks a `.bun-tag-<hash>` hunk into the patch** — strip it; bun recreates
  the tag itself.
- **Subagent `Write` is often harness-blocked** — the orchestrator must persist returned content.
  Extract it from the task transcript with a script rather than retyping it.
