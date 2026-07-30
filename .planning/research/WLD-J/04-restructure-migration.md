# WLD-J / Dimension 4 — The Restructure, and What Taking Upstream Actually Costs

**Question:** the other three dimensions say *what* changed upstream. This one says *how hard it is to take*.

**Baselines:** AionUi `v1.9.5` = `5b2c741f927b5043b60006bf850c7b7b1342698c` (2026-04-01, our fork point) → `v2.1.44` = `f37a6187f034c6697d4095c4ad4f7556d19fd2e5` (2026-07-30).
**Trees:** upstream `/Users/seandonahoe/dev/resources/AionUi` (old path `…/wayland/resources/upstream/AionUi` is now a symlink to it); ours `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution`.

**Range:** 1784 commits (182 merges), 3116 files changed, +260,071 / −281,127.

---

## 0. Two method notes that changed the answer

**0.1 — The clone was still being fetched when I started.** `.git/shallow` held grafts at both tags, so `rev-list v1.9.5..v2.1.44` returned **1**, `merge-base` returned nothing, and `merge-base --is-ancestor` said **NO**. Every one of those is a *plausible-looking* answer that would have produced the verdict "the histories are unrelated, cherry-pick is impossible, rebase is impossible." After the fetch completed git pruned `.git/shallow` on its own and the same commands return: merge-base = `5b2c741f92` (exactly the fork point), ancestor = YES, range = **1784**. Independently confirmed by the coordinator against GitHub compare (`ahead_by: 1784`). *Nothing in this document rests on the shallow-state readings.*

**0.2 — Rename detection silently bails and inflates the delta.** Default `git diff --shortstat v1.9.5..v2.1.44` reports `3262 files, +280,657 / −301,713` and prints a warning that exhaustive rename detection was skipped. With `-c diff.renameLimit=20000` the true figure is `3116 files, +260,071 / −281,127`. The default over-counts the migration by ~20,600 insertions and ~20,600 deletions — because it reports a moved file as add+delete instead of a rename. Any effort estimate built on the default number is wrong by that margin.

---

## 1. The repository restructure

### 1.1 It is one commit

| | |
|---|---|
| **Commit** | `a677b8647` |
| **Date** | 2026-05-08 |
| **Subject** | `refactor(webui): decouple WebUI from Electron (M1-M9) (#2792)` |
| **Size** | 1221 files, +23,488 / −6,163 |
| **Breakdown** | 968 renames, 154 modified, 77 added, 22 deleted |

`src/` and `packages/` change over in that single commit. This is the old-path → new-path mapping in its entirety; there is no second, later reshuffle.

### 1.2 What drove it — not a monorepo for its own sake

The commit body enumerates milestones M1–M9, and the intent is explicit in the new packages' own descriptions:

- `@aionui/web-host` — *"WebUI host package - spawns backend and reverse-proxies to it; serves static files (**no Electron dependency**)"*
- `@aionui/web-cli` — *"AionUi WebUI CLI - standalone web runtime (**no Electron**)"*, ships a `bin` entry `aionui-web`
- `@aionui/shared-scripts` — shared build scripts

The driver is **running the UI outside Electron, in a browser, against a backend spawned as a subprocess**. That forces a hard split between Electron-only code and Electron-free code, and *that* is what required workspaces. Bun workspaces (`"workspaces": ["packages/*"]`, absent at v1.9.5) are the mechanism, not the motive. Build tooling did not drive it — see §2, the toolchain barely moved.

### 1.3 Directory mapping

| v1.9.5 | v2.1.44 | Note |
|---|---|---|
| `src/renderer/**` | `packages/desktop/src/renderer/**` | 639 → 901 files (grew) |
| `src/common/**` | `packages/desktop/src/common/**` | 72 → 94 files |
| `src/process/**` | `packages/desktop/src/process/**` | **683 → 70 files** — see §1.5 |
| `src/index.ts`, `src/preload.ts`, `src/types.d.ts` | `packages/desktop/src/…` | |
| `src/server.ts` | *(removed)* | superseded by `packages/web-host` |
| `electron.vite.config.ts` | `packages/desktop/electron.vite.config.ts` | moved |
| `electron-builder.yml` | `packages/desktop/electron-builder.yml` | moved |
| `vite.renderer.config.ts` | *(deleted, no successor)* | |
| `tsconfig.json`, `vitest.config.ts`, `uno.config.ts`, `playwright.config.ts`, `package.json` | **stay at root** | root is the workspace root |
| `tests/**` | **stays at root** | not moved into the package |
| `docs/conventions/**` | `docs/contributing/**` | |
| `docs/cdp.md`, `docs/WEBUI_GUIDE.md`, `docs/SERVER_DEPLOY_GUIDE.md` | `docs/guides/{cdp,webui,deploy-server}.md` | |
| — | `packages/web-host/**` (17 files), `packages/web-cli/**` (6), `packages/shared-scripts/**` (3) | new |

Non-prefix renames bundled into the same move (these will not be caught by a naive `s|^src/|packages/desktop/src/|`):

| v1.9.5 | v2.1.44 |
|---|---|
| `src/renderer/pages/settings/Display/**` | `…/settings/Appearance/**` (16 files) |
| `src/renderer/pages/settings/AgentSettings/AssistantManagement/**` | `…/settings/AssistantSettings/**` (3) |
| `src/renderer/…/platforms/gemini/useGemini*` | `…/platforms/google/useGoogle*` **and** `…/platforms/aionrs/useAionrs*` (a 1→2 split) |
| `src/renderer/services/i18n/locales/*/gemini/**` | `…/locales/*/google/**` (all locales) |
| `src/renderer/…/Messages/codex/**` | collapsed into generic `…/Messages/**` + `…/Messages/acp/**` |
| `src/common/types/acpTypes.ts` | `src/common/types/platform/acpTypes.ts` |

### 1.4 The restructure itself is cheap — verified

The four path aliases survive the move unchanged:

```
v1.9.5   "@/*": ["./src/*"]                    v2.1.44  "@/*": ["./packages/desktop/src/*"]
         "@process/*", "@renderer/*", "@worker/*"        (same four names, retargeted)
```

`baseUrl: "."` was dropped; `include`/`exclude` were retargeted. Because the *alias names* did not change, **import specifiers inside source files did not change**. Verified concretely: `src/common/adapter/constant.ts` → `packages/desktop/src/common/adapter/constant.ts` is blob `64887b617d891064a57f8e51ec1649e7307b70ed` on **both** sides — byte-identical. 170 of the 429 detected renames are `R100`.

**Consequence:** the physical move costs a `sed` on patch headers. It is not the migration cost. Section 3 proves this empirically.

### 1.5 The restructure that actually matters: the backend left the repository

This is the real story, and it is a *different* change from the monorepo move (it starts earlier — `d91be9c42`, 2026-04-29, "refactor(channel): delete src/process/channels/ and debug scripts", 48 files, −13,952).

`src/process/` at v1.9.5 vs `packages/desktop/src/process/` at v2.1.44:

| subsystem | v1.9.5 | v2.1.44 | |
|---|---|---|---|
| `agent/` | 57 | **0** | gone |
| `channels/` | 44 | **0** | gone |
| `extensions/` | 31 | **0** | gone |
| `webserver/` | 21 | **0** | gone |
| `task/` | 21 | **0** | gone |
| `worker/` | 11 | **0** | gone |
| `services/` | 46 | 16 | gutted |
| `bridge/` | 43 | 12 | gutted |
| `utils/` | 23 | 21 | ~same |
| `resources/` | 385 | 2 | gone |
| *new* `startup/`, `pet/`, `backend/`, `feedback/` | — | 8, 6, 3, 1 | |

185 files of backend logic have **no successor anywhere in the v2.1.44 tree** (verified by recursive `ls-tree -r` search for `/channels/`, `/extensions/`, `/webserver/` across the whole tree — only `docs/prds/**` matches remain). They were extracted into **`aioncore`, a separate Rust backend in a different repository**, consumed as a pinned binary:

- root `package.json` → `"aioncoreVersion": "v0.1.55"`
- `scripts/prepareAioncore.js`, `scripts/resolveAioncoreVersion.js` fetch it
- `packages/desktop/src/process/backend/binaryResolver.ts` resolves it at runtime
- `@office-ai/aioncli-core` and `@office-ai/platform` were **removed** from `dependencies`

Corroborating evidence for the Rust backend: the ACP wire contract flipped from camelCase to snake_case, which is serde's default. Measured on `acpTypes.ts` (present in both trees, at different paths):

| | camelCase props | snake_case props |
|---|---|---|
| `v1.9.5:src/common/types/acpTypes.ts` | 151 | 0 |
| `v2.1.44:…/types/platform/acpTypes.ts` | 11 | 31 |

**This is the crux of the whole milestone.** Wayland made the *same architectural move* — we bundle `wayland-core` — but at a **different cut line** and to a **different engine**. Upstream's post-v2 backend work is not in this repository and cannot be ported from it at any price. Our `src/process/` holds 12,097 files (incl. the vendored WhatsApp/baileys bridge under `channels/`, 8,774) against upstream's 70.

---

## 2. Build and tooling: we are *not* diverging where it would hurt

| tool | v1.9.5 | v2.1.44 | ours | verdict |
|---|---|---|---|---|
| bundler | electron-vite `^5.0.0` | `^5.0.0` | electron-vite | **same** |
| vite | `^6.4.1` | `^6.4.1` | | **same** |
| test runner | vitest `^4.0.18` | `^4.0.18` | vitest (+ bun test) | **same** |
| TypeScript | `^5.8.3` | `^5.8.3` | | **same** |
| React | `^19.1.0` | `^19.1.0` | | **same** |
| lint/format | oxlint `^1.56.0`, oxfmt | same | same | **same** |
| CSS | unocss `^66.3.3` | same | same | **same** |
| e2e | `@playwright/test ^1.58.2` | same | same | **same** |
| package manager | bun (`bun.lock`) | bun (`bun.lock`) | bun | **same** |
| electron | `^37.3.1` | `^37.10.3` | | patch drift |
| electron-builder | `^26.6.0` | `26.15.2` (pinned exact) | `^26.6.0` | minor |
| workspaces | none | `["packages/*"]` | **none** | **divergent** |
| node engines | — | `>=22 <25` | | |

Dependency delta at root: **+20 / −2** runtime, **+8 / −0** dev, **0 version changes** among retained deps.
- Added: `@agentclientprotocol/sdk`, the CodeMirror 6 suite (9 pkgs), `mermaid`, `dayjs`, `https-proxy-agent`, `yauzl`, `@xmldom/xmldom`, `smol-toml`, `@wecom/aibot-node-sdk`, `@iconify/react`, `builder-util-runtime`, `@aionui/web-host`
- Dev-added: `playwright`, `ts-morph`, `electron-builder-squirrel-windows`, `electron-devtools-installer`, `builder-util`, `@types/{express,react,yauzl}`
- **Removed: `@office-ai/aioncli-core`, `@office-ai/platform`**

**Read this carefully:** upstream did not change bundler, test runner, language, package manager or CSS engine. The stack we standardised on is still upstream's stack. We diverge on exactly two axes: **repository layout** (flat `src/` vs `packages/*`) and **engine** (we bundle `wayland-core`, a fork of the very `aioncli-core` upstream deleted). The first is cosmetic. The second is architectural and permanent.

`packages/desktop/package.json` is a 10-line stub (`"main": "../../out/main/index.js"`, one workspace dep) — the real build config still lives at the root. Adopting the layout would therefore be a mechanical move plus a `tsconfig`/`electron.vite.config.ts` retarget, not a build-system rewrite.

---

## 3. Cherry-pick feasibility — measured, not estimated

### 3.1 Harness and its control

For each upstream commit: `git show --binary --format=` → strip the `packages/desktop/` prefix from all patch headers (`a/`, `b/`, `--- a/`, `+++ b/`, `rename from/to`) → `git apply --check -p1` in our worktree. Read-only; nothing was written to our tree.

**Control (mandatory, per the "confirm a method finds a known positive" rule):** the same patches, unmodified, applied against upstream's *own parent* commit via a temp `GIT_INDEX_FILE` — n=60: **93.3% CLEAN**, 5.0% empty, 1.7% fail (the one failure is a merge commit with no patch content). The harness is sound; the numbers below are real, not artefacts.

### 3.2 Results

**Random sample of upstream commits ≤80 files (n=400):**

| | | |
|---|---|---|
| CLEAN | 21 | **5.2%** |
| FAIL | 363 | 90.8% |
| empty (merges) | 16 | 4.0% |

Failure causes: context mismatch — our file diverged (217) · file missing on our side (124) · target already exists, we added it independently (20) · other (2).

**Clean rate vs. how much of the commit's path set we actually have:**

| paths present in our tree | clean |
|---|---|
| 100% | 7/191 — **3.7%** |
| 50–99% | 1/116 — 0.9% |
| <50% | 0/33 — 0% |
| 0% | 13/60 — **21.7%** |

That last row is the tell: commits land cleanly *when they only add files we don't have*. Where we share the file, we conflict.

**Renderer-only commits** (every touched file under `src/renderer/` — 406 such commits exist; n=200): **4.0% clean**. The most portable class of change in the entire range still fails 9 times in 10.

**The archive branch — the control that killed the "restructure is the problem" theory.** `archive/main-before-backend-migration-2026-05-25` (`bc29db7a9`, 2026-05-22) descends from v1.9.5 (ancestor: YES), is **not** an ancestor of v2.1.44, and retains the flat `src/` layout *with* `agent/ channels/ extensions/ webserver/ task/ team/ acp/ worker/` intact — i.e. our tree's shape. 812 commits from v1.9.5, of which 752 are shared with v2.1.44's history. Patches from it need **no path rewriting at all**.

Result (n=250): **0.4% clean** (1 of 250), 96.8% FAIL. Causes: context mismatch 130 · missing file 73 · already exists 39.

> **A same-shaped source applies *worse* than the restructured one.** The restructure is not what blocks cherry-picking — our own divergence is. (The archive branch also suffers because its 812 commits are a dependent sequence; pulling one out of the middle fails on its own. That reinforces the same conclusion: sequence and divergence dominate, layout does not.)

### 3.3 Twelve concrete cases, easy → impossible

| # | commit | change | verdict | why |
|---|---|---|---|---|
| 1 | `4a2168651` | `fix(workspace): float directory picker above team/cron create modals` — 1 file, `…/renderer/components/settings/DirectorySelectionModal.tsx` | **CLEAN** | single file, we never touched it |
| 2 | `b2eb762df` | `feat(markdown): open local file links in Preview panel` — `…/renderer/components/Markdown/index.tsx` | **CLEAN** | localised, our copy still matches |
| 3 | `1d1bf3a8a` | `fix(sendbox): restore stop button breathing animation` — 1 CSS/TSX file | **CLEAN** | cosmetic, isolated |
| 4 | `0694ba46e` | `ci(sentry): validate sourcemap upload release config` — `.github/workflows/_build-reusable.yml` | **CLEAN** | CI file, root path, unmoved |
| 5 | `1be18defa` / `9f290bfb7` | `feat(api): WebSocket client` / `HTTP client foundation for aionui-backend` — `src/renderer/api/{ws,client}.ts` | **applies, but do not take** | applies only because the files are *new to us*; they are the client half of the aioncore migration and wire to a backend we do not run |
| 6 | `b1c46c7bd` | `feat(update): install warning on downloaded state in UpdateModal` — `…/settings/UpdateModal.tsx` | **FAIL — re-implement** | ours 667 L; upstream's is now a **7-line re-export shim** to `UpdateNotificationCard`. Both sides rewrote a 480-line base in different directions |
| 7 | `ff5ca7ebc` | `refactor(cron): hide conversation header entry when no scheduled task` — `…/conversation/components/ChatConversation.tsx` | **FAIL — hand-port** | 26 conflict hunks in that file on a full 3-way; our copy is 732 L |
| 8 | `028694fbd`, `5027d6864` | team file-sending / ACP create-payload — both touch `src/common/adapter/ipcBridge.ts` | **FAIL — hardest shared file** | base 1164 L → upstream 2073 L, **ours 3377 L**. Both sides ~doubled/tripled the same file independently. 70 of 363 sampled failures blame this one file |
| 9 | `d4bba61b5` | `fix(process): clean up leaked processes on app quit` — `src/index.ts:700` | **FAIL — hand-port** | base 674 L → upstream 1025 L, ours 1715 L; 24 conflict hunks |
| 10 | `8da980d04` | `i18n(zh-CN): rename workspace concept to project` — locale JSON | **FAIL — mechanical but wide** | our locale files carry Wayland strings; also `i18n-keys.d.ts` is our single worst file at **66 conflict hunks** |
| 11 | `d91be9c42` | `refactor(channel): delete src/process/channels/` (−13,952) | **REJECT** | deletes 44 files upstream; we have **8,774** files there incl. the WhatsApp/baileys bridge. Applying it would delete a Wayland flagship feature |
| 12 | `a677b8647` | the restructure itself, 1221 files / 968 renames | **all-or-nothing** | cannot be taken partially; and taking it means adopting `packages/*`. Mechanically feasible (aliases absorb it), strategically separate from taking any *content* |
| 13 | — | anything under `packages/web-host/**`, `packages/web-cli/**`, or any `chore: bump aioncore to vX` | **N/A** | no counterpart in our tree and no engine to point them at |

---

## 4. Which of the 981 derived files upstream actually touched

Cross-referenced `AIONUI-INVENTORY.csv` (1005 same-path files, 981 derived) against the v1.9.5..v2.1.44 diff. **Matching was done on the diff's OLD-path side**, which is restructure-correct by construction — the inventory's `upstream` column is already a v1.9.5 path, so no forward path-guessing was needed. Method check: **0 of 1005** inventory upstream paths failed to resolve at v1.9.5.

Full per-file results: **`.planning/research/WLD-J/04-derived-files-upstream-action.csv`**.

| upstream action on the file | count | meaning for us |
|---|---|---|
| **no same-name counterpart at v2.1.44** | **504** | see caveat below |
| MOVED + EDITED (`R<100`) | 184 | real content change, plus a move |
| MOVED + REWRITTEN | 167 | resolved out of the deleted bucket by prefix/basename rule |
| MOVED ONLY (`R100`, byte-identical) | 93 | **nothing to take** |
| EDITED IN PLACE (path never moved) | 21 | easiest possible targets |
| UNTOUCHED | 12 | nothing to take |

**372 of the 981 derived files carry a real upstream content change. 105 need nothing (93 pure moves + 12 untouched).**

The 21 `EDITED-IN-PLACE` files — the only ones upstream changed *without* moving — are, revealingly, all test harness and root config: `tests/vitest.setup.ts`, `tests/e2e/helpers/*`, `tests/e2e/specs/ext-*.e2e.ts`, `vitest.config.ts`, `uno.config.ts`, `playwright.config.ts`. Every single piece of *product* code we derive was moved.

> **Caveat on the 504 — do not read this as "upstream deleted them."** This is the inclusion/exclusion trap. The number is the count of files with no *same-name* counterpart found by prefix rule or basename search. It is safe to say "these 504 cannot be matched automatically"; it is **not** safe to say "these 504 were removed." Spot-checks show the real reasons are mixed:
> - `tests/unit/slashMatcher.test.ts` → the slash subsystem was reorganised into `src/common/chat/slash/**` with new tests (`mergeSlashCommands.test.ts`). Reorganised, not deleted.
> - `…/Messages/codex/ToolCallComponent/TurnDiffDisplay.tsx` → the codex-specific message tree was collapsed into a generic `Messages/**` + `Messages/acp/**`. Ported, not deleted.
> - `src/process/agent/**`, `channels/**`, `extensions/**` → genuinely absent, because they became `aioncore` (a different repo).
>
> Composition of the 504: `tests/**` 214 · `src/process/**` 199 · `src/renderer/**` 78 · `src/common/**` 11 · other 2. A **port shares no literal lines with its source**, so no text-overlap method will find these; only reading the code will.

### 4.1 The number that sizes a rebase: true 3-way merge

Simulated `git merge-file` per derived file with **base = v1.9.5, ours = Wayland HEAD, theirs = v2.1.44**. This is precisely what a rebase-onto-upstream or a full re-port must resolve:

| outcome | files |
|---|---|
| no counterpart at v2.1.44 (needs a human decision) | 504 |
| **CONFLICTS** | **268** |
| upstream unchanged → free | 105 |
| merges clean → free | 104 |

**1,632 conflict hunks across 268 files, touching 95,995 lines of our code.**

Worst offenders (conflict hunks / our line count):

| hunks | ours | file |
|---|---|---|
| 66 | 5305 L | `src/renderer/services/i18n/i18n-keys.d.ts` |
| 33 | 1738 L | `src/process/utils/initStorage.ts` |
| 32 | 1004 L | `src/common/config/storage.ts` |
| 31 | 1260 L | `src/renderer/pages/guid/GuidPage.tsx` |
| 31 | 712 L | `…/conversation/Preview/context/PreviewContext.tsx` |
| 31 | 512 L | `…/hooks/assistant/useAssistantEditor.ts` |
| 27 | 797 L | `…/settings/SkillsHubSettings.tsx` |
| 26 | 1249 L | `src/common/types/acpTypes.ts` |
| 26 | 732 L | `…/conversation/components/ChatConversation.tsx` |
| 24 | 1715 L | `src/index.ts` |

Where the commits actually live (n=1631 commits ≤80 files): renderer-only **606 (37.2%)** · touches process/main 454 (27.8%) · non-code only 371 (22.7%) · renderer+common 170 (10.4%) · touches the new web packages 30 (1.8%).

**So ~48% of upstream's work is renderer/common-only — the portable half — and ~28% touches a main process that no longer exists in a form we share.**

---

## 5. Strategy — including the option we would hate

### The three options, honestly

**A. Selective cherry-pick.** *Measured 5.2% clean apply (3.7% where we share every path, 4.0% for renderer-only).* Cherry-picking as a mechanism is dead. 19 of every 20 commits require manual conflict resolution, at which point you are not cherry-picking, you are hand-porting while paying the overhead of pretending otherwise. **Viable only as a narrow tactic** for the ~4% that are genuinely isolated — single-file renderer/CSS fixes, CI files — and for security patches identified by dimension 2, where the correct unit is "the fix," not "the commit."

**B. Targeted re-port of specific subsystems.** Pick the subsystems worth having from dimensions 1/3, read upstream's current implementation, and re-implement against our tree. Cost concentrates in the 268 conflicting files / 1,632 hunks, but you pay only for the subsystems you choose, and you never pay for the 504 unmatchable files or the aioncore half. Fits how the code actually moved: the valuable upstream work (slash reorg, Explorer, generic ACP message tree, Appearance settings, CodeMirror/mermaid rendering) arrived as *rewrites*, which have to be re-implemented regardless of transport. **Effort scales with subsystems chosen, not with the 1784-commit range.**

**C. Rebase onto upstream — the option we would hate.** It deserves a fair hearing because it is the only one that ends the drift permanently, and dimension 4's job is to price it honestly rather than dismiss it. Real price: resolve **1,632 conflict hunks across 268 files / 95,995 lines**, adjudicate **504** files with no automatic counterpart, adopt `packages/*`, and then confront the disqualifier — **upstream v2.1.44 has no JS engine**. Its `src/process/{agent,channels,extensions,webserver,task,worker}` are gone to a Rust `aioncore` binary in another repo, and `@office-ai/aioncli-core` is deleted from its dependencies. Rebasing onto it means either shipping against `aioncore` (abandoning `wayland-core`, our WhatsApp/baileys bridge at 8,774 files, Flux routing, the cost/budget subsystem) or re-attaching our entire backend to a tree engineered to not have one. The ACP wire contract also flipped camelCase → snake_case. **This is not a hard merge; it is a different product.** Recommend against — but on those grounds, not on "merging is hard."

### Two findings that should reset intuitions

1. **The restructure is not the obstacle.** Aliases absorbed the move, pure moves are byte-identical, and path rewriting is a `sed`. Proof: the archive branch, which has *our exact layout* and needs no rewriting, applies **worse** (0.4% vs 5.2%). Do not spend effort on layout compatibility expecting it to buy portability. It buys nothing.
2. **`archive/main-before-backend-migration-2026-05-25` is worth keeping, but not as a merge base.** It is the closest upstream snapshot to our shape (flat `src/`, backend intact, 812 commits past our fork). It is a *divergent* branch, not an ancestor of v2.1.44, and its 0.4% apply rate rules it out as a cherry-pick source. Its real value is as a **reading reference**: for any subsystem we re-port, it shows the last upstream implementation that assumed our architecture, which is often more useful than v2.1.44's aioncore-shaped version.

### Sequencing

1. Take the ~4% cleanly-applying isolated fixes plus dimension 2's security items — cheapest real value.
2. Do not adopt `packages/*` on portability grounds; adopt it only if we independently want a browser-hosted Wayland UI. That, not tidiness, was upstream's reason.
3. Re-port subsystems by value, reading v2.1.44 for intent and the archive branch for architecture-compatible implementation.
4. Treat everything downstream of the aioncore extraction as permanently forked. Track it for ideas, never for code.

### Recommendation

**Targeted re-port (B), with a thin cherry-pick lane (A) for the ~4% of changes that are genuinely isolated and for security fixes.** Cherry-pick is dead as a general mechanism at a measured 5.2% clean-apply rate, and rebase-onto-upstream is disqualified not by merge difficulty but because v2.1.44 deleted the JS engine our entire product is built on — adopting it would mean abandoning `wayland-core`, the channels bridge, and Flux. Re-port is the only strategy whose cost scales with the value we choose to take rather than with 1784 commits of upstream history, most of which is either unmatchable (504 files) or lives in a Rust repository we do not consume.
