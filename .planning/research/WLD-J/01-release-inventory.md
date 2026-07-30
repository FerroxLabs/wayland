# WLD-J / Dimension 1 — AionUi Upstream Release & Change Inventory

**Range:** `v1.9.5` (`5b2c741f927b5043b60006bf850c7b7b1342698c`, 2026-04-01) → `v2.1.44` (`f37a6187f034c6697d4095c4ad4f7556d19fd2e5`, 2026-07-30)
**Upstream:** `https://github.com/iOfficeAI/AionUi.git`
**Local tree examined:** `/Users/seandonahoe/dev/wayland/resources/upstream/AionUi`
**Compiled:** 2026-07-30

---

## 0. Method, and a trap that had to be worked around first

Two environment problems materially affected this inventory. Both are recorded because any re-run will hit them.

### 0.1 The local upstream clone is SHALLOW, and grafted at exactly the two endpoints

`.git/shallow` contains exactly two entries — and they are precisely the two commits in scope:

```
5b2c741f927b5043b60006bf850c7b7b1342698c   (v1.9.5)
f37a6187f034c6697d4095c4ad4f7556d19fd2e5   (v2.1.44)
```

Consequences, all observed directly:

| Command | Returned | Reality |
|---|---|---|
| `git rev-list --count HEAD` | `1` | HEAD is v2.1.44, grafted, so no parents are traversable |
| `git rev-list --count v1.9.5..v2.1.44` | `1` | meaningless under the graft |
| `git merge-base --is-ancestor v1.9.5 v2.1.44` | `NO` | **false negative** — GitHub reports `behind_by: 0` |

The commit objects themselves *do* still carry their real parent pointers (a shallow graft hides parents, it does not rewrite the object), but those parents are genuinely absent from the object store:

```
v2.1.44 parent 1204ffa88c839f35c71ecb84947202a00e346c7b   -> MISSING
v1.9.5  parents e92d6d09d3d4bc931701400e2772b5cb3179fc1b  -> MISSING
               8f70dba4d8ca85537ce1cb30097a762e1f1de48f  -> MISSING
```

**However**, the object store holds 6064 commits reachable from other refs. `v2.1.43` is *not* grafted and carries 5822 commits of real ancestry back to the repo root (`cfab0327bef7790b72d3b5409df33c00d098af8d`, 2025-08-07, `init`). `v1.9.5` **is** a genuine ancestor of `v2.1.43`.

So the working spine used throughout this document is:

- **`v1.9.5..v2.1.43` — reconstructed locally from real history (1779 commits).**
- **`v2.1.43..v2.1.44` — a 5-commit tail recovered from the read-only GitHub compare API** (no clone, no fetch, no writes to the upstream tree).

Nothing was cloned, fetched, or modified in the upstream tree.

### 0.2 `rtk` silently truncates `git log`

Confirmed live during this work, exactly as warned:

```
git log --format=... v1.9.5..v2.1.43 | count  ->   50     (WRONG - silently truncated)
rtk proxy git log --format=... v1.9.5..v2.1.43 | count -> 1779  (correct)
```

`git rev-list --count` was **not** affected; `git log` was. Every enumeration below therefore uses `rtk proxy git log` or `git rev-list`, and every headline number is cross-checked by at least two independent methods. `rtk` additionally mangled `wc -l` (returned `0` for a 1294-line file), `grep -h`, and `find -exec`; `awk 'END{print NR}'`, `python3`, and plain `grep` were used instead. macOS `awk` also lacks gawk's `match()` capture arrays, so churn parsing was done in Python.

### 0.3 Verification of the headline commit count (two fully independent methods)

| Method | Result |
|---|---|
| Local: `git rev-list --count v1.9.5..v2.1.43` | 1779 |
| Local: `rev-list v2.1.43` (5822) − `rev-list v1.9.5` (4043) | 1779 |
| Local: enumerate `rev-list` and count unique lines | 1779 |
| GitHub API: `compare/v2.1.43...v2.1.44` → `total_commits` | 5 |
| **Local 1779 + API 5** | **1784** |
| **GitHub API: `compare/v1.9.5...v2.1.44` → `ahead_by` / `total_commits`** | **1784** ✅ |

The two paths agree exactly. GitHub also reports `behind_by: 0`, `status: "ahead"` — confirming `v1.9.5` is a true linear ancestor of `v2.1.44` upstream, and that the local `merge-base` "NO" was purely a shallow-graft artifact.

Further cross-check on the 5-commit tail: the API reports 62 changed files and 3004 additions for `v2.1.43...v2.1.44`; the local `git diff --shortstat v2.1.43..v2.1.44` independently reports `62 files changed, 3004 insertions(+), 91 deletions(-)`. Identical. And the API's first commit `1204ffa88c8` is exactly the parent sha that the local grafted `v2.1.44` object pointed at.

---

## 1. Headline numbers

| Metric | Value |
|---|---|
| **Total commits `v1.9.5..v2.1.44`** | **1784** |
| — reconstructed locally (`v1.9.5..v2.1.43`) | 1779 |
| — recovered via GitHub API (`v2.1.43..v2.1.44`) | 5 |
| Non-merge commits (in the 1779) | 1597 |
| Merge commits (in the 1779) | 182 |
| **Release tags in range (stable, excl. fork point)** | **59** |
| Pre-release `-dev-` tags in range | 13 |
| Total tags in range (stable + dev) | 72 |
| Elapsed time | 2026-04-01 → 2026-07-30 (~17 weeks) |
| **Files changed `v1.9.5..v2.1.44`** | **3116** (rename detection enabled) |
| **Insertions** | **260,071** |
| **Deletions** | **281,127** |
| **Net line change** | **−21,056** |

> **Note on the diff numbers.** git's default rename-detection limit is exceeded on this diff and git emits a warning while producing *inflated* figures. With `-c diff.renameLimit=8000` the accurate result is `3116 files changed, 260071 insertions(+), 281127 deletions(-)`. The default (rename-detection skipped) figure, which will be what a naive `git diff --shortstat` prints, is `3262 files changed, 280657 insertions(+), 301713 deletions(-)`. **Use the rename-aware numbers.**

**The single most important number here is the net: −21,056 lines.** Upstream deleted substantially more than it added. This is not a stagnant period — it is 1784 commits of work in which the desktop repo was *hollowed out*, with large subsystems relocated into a separate backend process and a separate repository (see §5).

---

## 2. Release tag inventory

### 2.1 Main-line releases (ancestors of v2.1.43), in ancestry order

"Commits" = `git rev-list --count <previous tag>..<this tag>` on the main line.

| Tag | Date | Commit (short) | Commits |
|---|---|---|---|
| *v1.9.5 (fork point)* | 2026-04-01 | `5b2c741f9` | — |
| v1.9.6 | 2026-04-05 | `cd7ee1d60` | 6 |
| v1.9.7 | 2026-04-06 | `714558902` | 367 |
| v1.9.8 | 2026-04-08 | `1dd9132b5` | 42 |
| v1.9.9 | 2026-04-09 | `27f21b81a` | 25 |
| v1.9.10 | 2026-04-09 | `4d44d1483` | 4 |
| v1.9.11 | 2026-04-09 | `0de3b61c2` | 45 |
| v1.9.12 | 2026-04-10 | `4671df748` | 51 |
| v1.9.13 | 2026-04-12 | `3a94176aa` | 28 |
| v1.9.14 | 2026-04-14 | `bb92a4d35` | 72 |
| v1.9.15 | 2026-04-14 | `057abe422` | 21 |
| v1.9.16 | 2026-04-15 | `01dd5fc48` | 22 |
| v1.9.17 | 2026-04-16 | `8cc938c86` | 7 |
| v1.9.18 | 2026-04-20 | `a01a77ef5` | 43 |
| v1.9.19 | 2026-04-21 | `608cced53` | 18 |
| v1.9.19-dev-5b4f1b3 | 2026-05-10 | `5b4f1b304` | 329 |
| v1.9.19-dev-59e4374 | 2026-05-10 | `59e43748e` | 0 † |
| v1.9.19-dev-bcdd22d | 2026-05-10 | `bcdd22d66` | 0 † |
| v2.0.0-dev-9714b32 | 2026-05-13 | `9714b327c` | 96 |
| v2.0.0-dev-bef1ba9 | 2026-05-13 | `bef1ba978` | 1 |
| v2.0.1-dev-2590f64 | 2026-05-14 | `2590f6458` | 24 |
| v2.0.2-dev-a3881e2 | 2026-05-15 | `a3881e27d` | 8 |
| v2.0.3-dev-8e466e0 | 2026-05-17 | `8e466e05f` | 6 |
| v2.0.3-dev-973e784 | 2026-05-17 | `973e784f4` | 1 |
| v2.0.4-dev-b595dfd | 2026-05-19 | `b595dfd37` | 7 |
| v2.0.5-dev-fc2a899 | 2026-05-19 | `fc2a89923` | 5 |
| v2.0.6-dev-9ddc58c | 2026-05-21 | `9ddc58c5f` | 7 |
| v2.0.7-dev-a33fc56 | 2026-05-22 | `a33fc56a8` | 44 |
| **v2.1.0** | 2026-05-24 | `05e879ed4` | 1 |
| v2.1.1 | 2026-05-24 | `e0e90f76d` | 5 |
| v2.1.2 | 2026-05-25 | `a6e5a6f51` | 48 |
| v2.1.3 | 2026-05-26 | `a815d07df` | 20 |
| v2.1.4 | 2026-05-27 | `8ce8f5ca3` | 3 |
| v2.1.5 | 2026-05-27 | `0ae16b22f` | 40 |
| v2.1.6 | 2026-05-28 | `374f42610` | 8 |
| v2.1.7 | 2026-05-29 | `97595fdef` | 11 |
| v2.1.8 | 2026-05-30 | `72684cc6c` | 4 |
| v2.1.9 | 2026-06-01 | `32652989b` | 6 |
| v2.1.10 | 2026-06-02 | `83f52aff5` | 18 |
| v2.1.11 | 2026-06-04 | `3876f557c` | 8 |
| v2.1.12 | 2026-06-05 | `2dbf20e65` | 7 |
| v2.1.13 | 2026-06-07 | `c3144cc89` | 10 |
| v2.1.14 | 2026-06-08 | `2dc14891f` | 3 |
| v2.1.15 | 2026-06-09 | `2eb7f64aa` | 15 |
| v2.1.16 | 2026-06-10 | `77c6be13f` | 4 |
| v2.1.17 | 2026-06-11 | `cfd8dcbc6` | 12 |
| v2.1.18 | 2026-06-12 | `ddd20d380` | 21 |
| v2.1.19 | 2026-06-15 | `f868eeeb6` | 17 |
| v2.1.20 | 2026-06-17 | `9e6a0724e` | 10 |
| v2.1.21 | 2026-06-19 | `af6b1b4d0` | 6 |
| v2.1.22 | 2026-06-22 | `a2a24db1d` | 8 |
| v2.1.23 | 2026-06-23 | `940ea4cfa` | 6 |
| v2.1.24 | 2026-06-25 | `7c5d64423` | 10 |
| v2.1.25 | 2026-06-26 | `d69897520` | 24 |
| v2.1.26 | 2026-06-30 | `b825a8670` | 10 |
| v2.1.27 | 2026-06-30 | `70fcbfd77` | 8 |
| v2.1.28 | 2026-07-02 | `a5a8b34c7` | 23 |
| v2.1.29 | 2026-07-03 | `704336432` | 15 |
| v2.1.30 | 2026-07-06 | `a48043a61` | 12 |
| v2.1.31 | 2026-07-08 | `e49cd9493` | 8 |
| v2.1.32 | 2026-07-10 | `0a903d835` | 9 |
| v2.1.33 | 2026-07-11 | `a819d1756` | 2 |
| v2.1.34 | 2026-07-13 | `0fea1eb82` | 3 |
| v2.1.35 | 2026-07-14 | `29c9271a5` | 9 |
| v2.1.36 | 2026-07-17 | `dcab26e6b` | 9 |
| v2.1.37 | 2026-07-18 | `db22ef6a2` | 3 |
| v2.1.38 | 2026-07-20 | `4fac22b6e` | 8 |
| v2.1.39 | 2026-07-21 | `1b215f2fc` | 17 |
| v2.1.40 | 2026-07-23 | `e9882492e` | 12 |
| v2.1.41 | 2026-07-24 | `2d8925fc6` | 4 |
| v2.1.42 | 2026-07-28 | `7ee90c13e` | 9 |
| v2.1.43 | 2026-07-29 | `5ec74f8df` | 16 |
| **v2.1.44** | 2026-07-30 | `f37a6187f` | 5 ‡ |

† **Caveat, measured not assumed.** The three `v1.9.19-dev-*` tags are *siblings*, not a chain: `59e4374` and `bcdd22d` are ancestors of `5b4f1b3`, so version-sort order ≠ ancestry order. This is the only non-linearity in the range (verified by testing `merge-base --is-ancestor` on all 71 consecutive pairs — exactly two pairs failed, both in this cluster). It causes the per-release column to sum to 1781 rather than 1779, i.e. a 2-commit double-count confined to that cluster. **The authoritative range total is 1779**, verified three ways in §0.3.

‡ v2.1.44's 5 commits come from the GitHub API, not local history (see §0.1). They are listed individually in §6.

### 2.2 A divergent v1.9.x maintenance line exists and is NOT in the range

Six stable releases and two dev tags are **not** ancestors of `v2.1.43`:

| Tag | Date |
|---|---|
| v1.9.20 | 2026-04-23 |
| v1.9.21 | 2026-04-24 |
| v1.9.22 | 2026-04-29 |
| v1.9.23 | 2026-04-30 |
| v1.9.24 | 2026-05-01 |
| v1.9.25 | 2026-05-05 |
| v1.9.26-dev-c8cda10 | 2026-05-11 |
| v1.9.26-dev-e9bbc43 | 2026-05-11 |

`v1.9.20` *is* a descendant of `v1.9.19`, but the merge-base of `v1.9.25` and `v2.1.43` is `4db788bf26688c609140eb650d0b8dc078246356` (2026-04-21). So the 2.x line and this 1.9.x line **forked immediately after v1.9.19 (2026-04-21)** and never rejoined.

- `git rev-list --count v2.1.43..v1.9.25` = **50 commits** exclusive to that line
- `git rev-list --count v2.1.43..v1.9.26-dev-e9bbc43` = **6 commits**

**Implication:** the 1784-commit figure excludes ~50 commits of parallel 1.9.x maintenance. Whether any of those fixes were separately cherry-picked onto the 2.x line was **not verified** and should be treated as an open question.

There is also an `archive/main-before-backend-migration-2026-05-25` branch (tip `bc29db7a9`, 2026-05-22) — upstream's own snapshot of `main` taken before the migration described in §5.

---

## 3. Categorised commit breakdown

### 3.1 How the classification was done

Classification is by **conventional-commit prefix parsed from the real commit subject line** of the **1597 non-merge commits** in `v1.9.5..v2.1.43`. The 182 merge commits are excluded (their subjects are all `Merge pull request …`, which carries no type). Extraction regex: `^([a-zA-Z]+)(\([^)]*\))?!?:`, lowercased.

This is a mechanical parse, not a judgement call. Where upstream did not use a conventional prefix, the commit is counted as unclassified rather than being guessed into a bucket.

- Classified: **1543**
- Unclassified (no conventional prefix): **54**
- Total: **1597** ✅

### 3.2 The breakdown

| Type | Count | % of classified |
|---|---:|---:|
| `fix` | 649 | 42.1% |
| `feat` | 335 | 21.7% |
| `chore` | 168 | 10.9% |
| `refactor` | 119 | 7.7% |
| `docs` | 86 | 5.6% |
| `style` | 84 | 5.4% |
| `test` | 71 | 4.6% |
| `perf` | 8 | 0.5% |
| `polish` | 7 | 0.5% |
| `revert` | 6 | 0.4% |
| `ci` | 5 | 0.3% |
| `sync` | 2 | 0.1% |
| `wip` | 1 | 0.1% |
| `refine` | 1 | 0.1% |
| `build` | 1 | 0.1% |
| **Classified total** | **1543** | 100% |
| *(unclassified)* | *54* | — |

### 3.3 The two categories that need explaining, because they do not exist as prefixes

**`deps` — there is no `deps` scope in this repo.** Dependabot-style `chore(deps):` commits do not appear. Dependency movement instead shows up two ways:

- **65 commits** matching `bump version` — these are release-cut commits. From v2.0.1 onward *every one of them also pins a backend version*, e.g. `chore: bump version to 2.1.25 and aioncore to v0.1.38 (#3453)`. The companion `aioncore` moves **v0.1.2 → v0.1.55** across the range. This is the clearest single signal of the architecture change in §5.
- **109 commits** touching `package.json`, `bun.lock`, or `packages/desktop/package.json`.

**`security` — one commit uses the scope.** A keyword sweep (`security|vulnerab|CVE-|sanitiz|XSS|injection|credential|secret|encrypt|harden|path traversal`) over all 1779 subjects returns 16 hits, but most are false positives on "injection" in the dependency-injection sense and "breaking" in the ordinary sense. The genuinely security-flavoured ones:

| Sha | Subject |
|---|---|
| `04a17d971db` | `fix(security): pin axios version and enforce frozen lockfile in CI (#2118)` |
| `fix(acp)` | `harden Windows npx command resolution (#2308)` |
| `441f57f65a4` | `fix(installer): harden Windows NSIS update failure handling (#3523)` |
| — | `fix(installer): harden Windows failure reporting and self-lock handling (#3533)` |
| — | `fix(installer): harden win arm64 install (#3387)` |
| — | `fix(test): fix failing path traversal test in apiRoutes-helpers` |

**No CVE is referenced anywhere in the range.** The sweep method was validated against a known positive (`harden` → 6 hits) before the near-zero result was accepted.

**`breaking` — 1 commit carries the `!` marker.** See §5.

### 3.4 What the shape of this data says

`fix` outnumbers `feat` roughly 2:1, and `refactor` + `chore` together (287) approach `feat` (335). Combined with the −21k net line count, this is the profile of a **large architectural migration plus its stabilisation tail**, not a feature-expansion period. The dominant *subject area* is unambiguous:

| Scope | `feat` | `fix` | Total |
|---|---:|---:|---:|
| `team` | 91 | 135 | **226** |
| `acp` | 8 | 36 | 44 |
| `cron` | 13 | 34 | 47 |
| `conversation` | 10 | 23 | 33 |
| `settings` | 12 | 22 | 34 |
| `assistant` | 12 | 9 | 21 |
| `skills` | 11 | — | 11+ |
| `guid` | 7 | 22 | 29 |

**Team mode is the single largest investment in the entire range** — 226 of 984 feat+fix commits (23%).

---

## 4. The 25–40 most significant individual changes

Selected by diff churn (insertions+deletions, computed over all 1597 non-merge commits), cross-referenced against `feat`/`refactor` subjects and the CHANGELOG. **Where a subject was uninformative, the full commit message and/or the per-directory file stat was read** — those are marked ✚.

### 4.1 Structural / architectural (the ones that matter most for a fork)

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 1 | `a677b86478a` | 2026-05-08 | `refactor(webui): decouple WebUI from Electron (M1-M9) (#2792)` | ✚ **THE structural pivot — 1221 files.** Creates the `packages/` monorepo (`desktop`, `web-host`, `web-cli`, `shared-scripts`) and **deletes top-level `src/` in the same commit**. Ports `lifecycleManager` out of Electron into `@aionui/web-host/backend-launcher`, replacing `electron` `app.*` calls with constructor-injected `AppMetadata` + `BackendBinaryResolver`. Verified: this is the only commit in the range that both adds `packages/desktop/package.json` and last-touches `src/`. |
| 2 | `4a89db942ef` | 2026-05-09 | `refactor(agent)!: migrate ACP/agent implementation to backend (#2804)` | ✚ **The one flagged breaking change.** Removes the entire frontend agent runtime: `AcpAgentManager`, `AionrsManager`, `OpenClawAgentManager`, `NanoBotAgentManager`, `RemoteAgentManager`, `McpService`/`McpProtocol`/`McpOAuthService`, all agent-specific MCP adapters, worker/fork infra (`ForkTask`, `WorkerProtocol`), `AgentRegistry`, `AcpConnection`/`AcpDetector`/`NanobotConnection`, shell-env loading, Office preview bridges, and 80+ test cases. 142 files, 33,419 lines churned. |
| 3 | `bc7344500` | 2026-05-10 | `refactor(agent): migrate custom ACP agent implementation to backend (#2819)` | Follow-on to #2 for custom agents; carries the same `BREAKING CHANGE` footer. |
| 4 | `44d831197c9` | 2026-04-30 | `refactor(backend-migration): route desktop persistence through backend (#2700)` | ✚ Moves extension settings and assets to the backend, then **hands off Electron DB access to the backend entirely**. 146 files. |
| 5 | `6cc76b2dd12` | 2026-04-27 | `refactor: collapse Gemini agent runtime into ACP backend (#2667)` | Removes the bespoke Gemini runtime; Gemini becomes just another ACP agent. 191 files. |
| 6 | `1518a9ce4dc` | 2026-04-02 | `refactor(codex): remove CodexAgentManager, use ACP protocol for codex` | Same collapse, applied to Codex. |
| 7 | `57ea303f1fd` | 2026-04-27 | `refactor: migrate openclaw and remote agent to backend-proxy pattern` | Same collapse, applied to OpenClaw + remote agents. |
| 8 | `dc78ccd8472` | 2026-04-17 | `refactor(acp): ACP 2.0 modular protocol layer with single-owner ProcessAcpClient (#2310)` | ✚ Rewrites the ACP protocol layer — 27 files under `src/process/acp` — around a single-owner `ProcessAcpClient`. The precondition for #2. |
| 9 | `5dcf60101ca` | 2026-05-09 | `chore: cleanup dead code + rewrite unit tests + restore CI (N1-N5) (#2801)` | ✚ **Largest single commit in the range (69,534 lines, 386 files).** Five-milestone programme: delete ~1748 LoC of dead frontend code, delete and re-scaffold `tests/unit|integration|regression`, add a `mockHttpBridge` helper, restore CI. |
| 10 | `3d8bb22cb04` | 2026-05-12 | `refactor(process): remove ~3579 lines of dead frontend code after backend migration (#2862)` | Post-migration sweep of newly-orphaned frontend code. |
| 11 | `20ad7289a14` | 2026-05-10 | `feat(webui): consolidate auth onto backend SQLite (M6-cleanup) (#2816)` | Auth state moves out of the renderer into the backend's SQLite store. |
| 12 | `e4cdff41fb7` | 2026-05-08 | `ci(release): wire aionui-web tarballs + install-web.sh into main release pipeline (#2795)` | Adds a **second shipping artifact** — a web distribution alongside the desktop app. 85 files. |
| 13 | `9c157afab41` | 2026-04-29 | `refactor(team): delete src/process/team/ directory and obsolete tests` | Deletes the entire frontend team subsystem (75 files) — it now lives in the backend. |
| 14 | `d91be9c428a` | 2026-04-28 | `refactor(channel): delete src/process/channels/ and debug scripts` | Deletes the frontend channels subsystem (48 files). |

### 4.2 Wire-format / data-model migration (breaks every serialized boundary)

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 15 | `b7824709876` | 2026-04-23 | `refactor: rename camelCase fields to snake_case across all frontend source files` | ✚ **488 files.** Verified spread: `src/process/agent` (34), `src/renderer/hooks` (27), `src/process/services` (21), `src/process/team` (19), `src/process/channels` (19), `src/renderer/pages` (18). A repo-wide identifier rename. |
| 16 | `f78ef7828a3` | 2026-04-27 | `refactor: migrate frontend wire format from camelCase to snake_case (#2672)` | Changes the **on-the-wire** contract (132 files), not just local identifiers. |
| 17 | `e671f60f041` | 2026-04-23 | `refactor: update test files for snake_case field naming migration` | The 213-file test-suite companion to #15. |

### 4.3 Skills subsystem

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 18 | `64e3a88f8d2` | 2026-04-09 | `chore(skills): remove deprecated docx, pptx, and xlsx bundled skills (#2243)` | ✚ 52,007 lines removed. Verified content: bundled OOXML schemas (`ISO-IEC29500-4_2016`, ECMA 4th edition) and their scripts under `resources/skills`. |
| 19 | `081b41a4dab` | 2026-04-24 | `refactor(skill): drop local builtin skills (moved to backend)` | Removes 194 files of local builtin skills; the backend now owns the catalog. |
| 20 | `25794e308e4` | 2026-04-17 | `feat(skills): add builtin skill management, conversation indicator, and exclude filtering (#2280)` | Builtin-skill management UI, per-conversation active-skill indicator, exclusion filtering. |
| 21 | `90d6d403eab` | 2026-07-17 | `feat(skills): skill detail page with assistant attachment (#3604)` | Dedicated skill detail page; skills can be attached to assistants. |
| 22 | `af6b1b4d091` | 2026-06-19 | `chore(skills): remove PR automation skills (#3374)` | Removes the bundled PR-automation skills (5373 lines). |

### 4.4 Team mode (the dominant feature area — 226 commits)

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 23 | `826eba76cf9` | 2026-07-10 | `WIP: feat(team): add manual teammate management (#3532)` | ✚ Subject says "WIP" but it is a substantial 143-file change: shared multi-member teammate picker, exactly-one-leader constraint, add-member popover, canonical `agents` payloads, i18n refresh, and **pins AionCore to a specific commit** `ad720fa9d1e11031ea42df093a7f0944162bd41a`. |
| 24 | `590a5bdb767` | 2026-07-23 | `feat(team): dormant teammate UI with lazy warmup and per-member retry-start (#3712)` | Teammates start dormant and warm up lazily, with per-member retry — a resource-cost change, not just UI. |
| 25 | `ba029cbec23` | 2026-04-16 | `feat(team): add model selection capability to team mode` | Per-teammate model selection. |
| 26 | `c6458d66dc5` | 2026-04-08 | `fix(team): resolve concurrency bugs with atomic repository operations (#2169)` | Atomic repository ops to fix team-state races (7043 lines, 18 files). |
| 27 | `4702cc48b79` | 2026-06-12 | `feat: stabilize team mode conversation runtime (#3309)` | Stabilisation pass on the team conversation runtime. |

### 4.5 Project / Explorer model

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 28 | `26a2e72e8fd` | 2026-07-29 | `feat(explorer): project-scoped Explorer replacing workspace tree (#3763)` | ✚ Replaces the per-conversation Workspace tree with a **Layout-level, project-scoped Explorer** that persists across conversation/agent-tab switches. Introduces a **WebSocket `fs/*` data plane** (subscribe/snapshot/delta + read/write/mkdir/remove/rename) plus an HTTP `/api/projects` control plane; hoists the preview panel; replaces absolute-path/`[[AION_FILES]]` marker building with source-tagged `ChatFileRef[]` resolved backend-side. 129 files. |

### 4.6 Agent/assistant governance

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 29 | `72129a5e837` | 2026-06-25 | `feat(agent): connection testing and assistant availability surfacing (phase 2) (#3395)` | ✚ 308 files. Unifies guid + team assistant selection onto one assistant model, adds connection testing, extends assistants to channel bindings and cron, adds settings-editor and permission localisation. |
| 30 | `762a8b0a73a` | 2026-06-12 | `feat(assistant): deliver phase-1 governance settings (#3277)` | Phase-1 assistant governance/permission settings (107 files). |
| 31 | `bada3a35033` | 2026-06-09 | `feat: enforce agent runtime policy and turn-aware UI state (#3253)` | Runtime policy enforcement plus turn-aware UI gating. |
| 32 | `92a55c9527e` | 2026-07-23 | `feat(permissions): redesign request panel (#3676)` | Rebuilt permission-request panel. |

### 4.7 Notable feature additions

| # | Sha | Date | Subject | What it actually does |
|---|---|---|---|---|
| 33 | `0b6cc7f1851` | 2026-04-03 | `feat(hub): implement Agent Hub for extension discovery, installation, and lifecycle management (#2066)` | New Agent Hub: discovery, install, lifecycle (65 files). |
| 34 | `8bb390b1ab9` | 2026-04-02 | `feat(aionrs): integrate Aion CLI (aionrs) as native agent (#2045)` | Adds upstream's own `aionrs` CLI as a first-class native agent. |
| 35 | `9aaf742be6e` | 2026-04-07 | `feat(pet): add desktop pet with animated states and AI integration (#2127)` | Animated desktop-pet companion wired to the AI (69 files). |
| 36 | `a7a3b6e645d` | 2026-05-29 | `feat(mcp): move MCP management to conversation scope (#3109)` | MCP servers become conversation-scoped rather than global. |
| 37 | `af255a7f4bc` | 2026-06-12 | `feat(stt): streaming voice input with live transcript (#3291)` | Streaming speech-to-text with live transcript. |
| 38 | `be6ad764947` | 2026-04-01 | `feat(cron): add scheduled tasks UI, 1:N conversation model, and sider refactoring` | Scheduled tasks UI plus a **1:N conversation model** change. |
| 39 | `ec1e5458d6a` | 2026-06-14 | `feat(update): use CDN metadata for stable auto updates (#3244)` | Auto-update metadata moves to CDN. |
| 40 | `441f57f65a4` | 2026-07-06 | `fix(installer): harden Windows NSIS update failure handling (#3523)` | Windows NSIS update failure handling (56 files). |
| 41 | `60b19262fad` | 2026-04-14 | `feat: add full Russian (ru-RU) localization (#2306)` | First of a large i18n expansion — the range also adds **uk-UA** (`1d28a17008c`), **de-DE** (`acc3cf34410`), **fa-IR** (`e831d9dcebc`), **es-ES** (`482f6f241c1`), **fr** (`8b3b3de2bbf`). |

---

## 5. Breaking changes and migrations

### 5.1 Explicit breaking-change markers

Exactly **one** commit in the range carries the conventional `!` breaking marker:

```
4a89db942 2026-05-09 refactor(agent)!: migrate ACP/agent implementation to backend (#2804)
```

`git log --grep='BREAKING CHANGE'` returns **three** commits, all carrying the identical footer:

> `BREAKING CHANGE: All agent management now handled by aionui-backend subprocess.`
> `Frontend no longer directly manages ACP sessions, MCP servers, or worker processes.`

| Sha | Date | Subject |
|---|---|---|
| `4a89db942` | 2026-05-09 | `refactor(agent)!: migrate ACP/agent implementation to backend (#2804)` |
| `bc7344500` | 2026-05-10 | `refactor(agent): migrate custom ACP agent implementation to backend (#2819)` |
| `729eea236` | 2026-05-09 | `chore: format docs and improve AcpModelSelector model info fallback (#2810)` |

These are three commits on one logical change (the footer propagated through the branch), not three independent breaks.

### 5.2 The real breaking change is not marked at all

**The `!` marker undercounts the damage by a wide margin.** The following are all breaking for a fork, and none carries a breaking marker:

1. **Repository layout was replaced** (`a677b86478a`). Measured:

   | | v1.9.5 | v2.1.44 |
   |---|---:|---:|
   | tracked files (total) | 2028 | 2070 |
   | files under `src/` | **1398** | **0** |
   | files under `packages/desktop/src/` | 0 | **1072** |

   `packages/` at v2.1.44: `desktop` (1075 files), `web-host` (17), `web-cli` (6), `shared-scripts` (3). Top-level `electron.vite.config.ts` and `vite.renderer.config.ts` are gone; `Makefile`, `CHANGELOG.md`, `CONTRIBUTING.md` are new.

   **Every source path in the fork has moved.** A direct `git merge` of upstream into a `src/`-based fork will conflict on essentially the whole tree.

2. **Wire format changed camelCase → snake_case** (`b7824709876`, `f78ef7828a3`, `e671f60f041`) — 488 + 132 + 213 files. Any divergent serialized contract in the fork is now incompatible.

3. **Runtime model changed from in-process to out-of-process.** From v2.0.1 onward the desktop app pins and spawns a separate `aioncore` backend binary, versioned **v0.1.2 → v0.1.55** across the range, released from a **different repository** (`github.com/iOfficeAI/AionCore`). Agent management, MCP, persistence, skills catalog, team, and channels all live there now.

### 5.3 Migration commits

`migrat` appears in **141** subjects in the range. The overwhelming majority are `docs(backend-migration):` process artifacts (specs, plans, handoffs, e2e reports) for a formally-run migration programme with named phases (N1–N5, M1–M9, T2.5/T3/T4/T6, P0-1/P1-1/P1-2/P1-A1/P1-A3) and a coordinator/e2e-tester/frontend-dev role split. The substantive code migrations are items 1–8 and 15–17 in §4.

Upstream additionally preserved its own pre-migration snapshot as a branch: **`archive/main-before-backend-migration-2026-05-25`** (tip `bc29db7a9`, 2026-05-22). That branch is the closest upstream analogue to the fork's starting shape, and is likely the most useful reference point for any port.

---

## 6. The v2.1.43 → v2.1.44 tail (recovered via GitHub API)

Not present in local history because `v2.1.44` is shallow-grafted. Retrieved read-only from `repos/iOfficeAI/AionUi/compare/v2.1.43...v2.1.44`; `status: ahead`, `ahead_by: 5`, `behind_by: 0`, `total_commits: 5`, 62 files, 3004 additions — the file count and addition count both match the local diff exactly.

| Sha | Date | Subject |
|---|---|---|
| `14e189e0f25` | 2026-07-30 | `feat(search): filename search + chat-ref (#3784)` |
| `5f808f05b38` | 2026-07-30 | `fix(tray): honor close-to-tray on custom title-bar close (#3669) (#3717)` |
| `584fdcf4de1` | 2026-07-30 | `fix(preview): restore file rendering for Explorer opens (#3786)` |
| `1204ffa88c8` | 2026-07-30 | `feat(skills): add file browser to detail page (#3683)` |
| `f37a6187f03` | 2026-07-30 | `chore: bump version to 2.1.44 and aioncore to v0.1.55 (#3792)` |

`1204ffa88c8` is exactly the parent sha the grafted local `v2.1.44` object pointed at — independent confirmation the tail is correct.

---

## 7. Does upstream keep a CHANGELOG / release notes?

**Yes.** `CHANGELOG.md` exists at the repo root, **1294 lines**, and did **not** exist at v1.9.5 (it is one of the new top-level files at v2.1.44).

**Coverage: 41 version headings, from `2.1.4` (2026-05-27) down to `2.1.44` (2026-07-30), newest-first.** It does **not** cover `v1.9.5`–`v2.1.3`. For roughly the first half of the range — including the entire backend migration and the monorepo restructure — **there are no upstream release notes at all**, and git history is the only record.

### 7.1 The structure, quoted verbatim

The newest entry, quoted exactly (`CHANGELOG.md` lines 1–32):

```markdown
# Changelog

## [2.1.44](https://github.com/iOfficeAI/AionUi/compare/v2.1.43...v2.1.44) (2026-07-30)

### Desktop

#### Features

- **skills:** add file browser to detail page (#3683)
- **search:** filename search + chat-ref (#3784)

#### Bug Fixes

- **preview:** restore file rendering for Explorer opens (#3786)
- **tray:** honor close-to-tray on custom title-bar close (#3717)

### Core ([v0.1.55](https://github.com/iOfficeAI/AionCore/releases/tag/v0.1.55))

#### Features

- **agents:** add omp (Oh My Pi) builtin ACP agent (#717)
- **project:** fs/search filename search vertical (#720)

#### Bug Fixes

- **auth:** make AionUi->AionPro data adoption a one-shot event (#716)
- **db:** pre-migration repair for migration-030 startup-blocking CHECK failures (#724)
- prevent silent encryption-key rotation on migration upgrade (ELECTRON-3T0) (#722)
- **project:** add temporary fs/resolve command for preview file paths (#723)
- **session:** carry tool input on permission events so the approval card shows what is being approved (#715)

---
```

And the oldest entry, quoted exactly (`CHANGELOG.md` lines 1285–1294):

```markdown
## [2.1.4](https://github.com/iOfficeAI/AionUi/compare/v2.1.3...v2.1.4) (2026-05-27)

### Desktop

#### Bug Fixes

- **messages:** ignore non-renderable stream events (#3053)
- **messages:** stabilize stream scrolling and initial loading (#3042)

---
```

### 7.2 The schema, read off the structure

```
# Changelog
## [<version>](<compare-link v(n-1)...v(n)>) (<YYYY-MM-DD>)   <- H2, one per release, newest first
### Desktop                                                    <- H3, this repo
#### Features / #### Bug Fixes / #### Refactoring              <- H4, conventional-commit groups
- **<scope>:** <subject> (#<PR>)                               <- scoped bullets; scope may be omitted
### Core ([v0.1.NN](<AionCore release tag link>))               <- H3, the SEPARATE backend repo
#### Features / #### Bug Fixes / #### Refactoring
- **<scope>:** <subject> (#<PR>)                               <- PR numbers link to iOfficeAI/AionCore
---                                                            <- hr between releases
```

Two things about this schema matter more than the format itself:

1. **Every release entry is split into a `### Desktop` section and a `### Core` section**, with `Core` hyperlinked to a release tag in a *different repository* (`iOfficeAI/AionCore`). The changelog is structurally admitting that the product is now two repos.
2. **Issue/PR numbers are in two disjoint namespaces.** Desktop PRs are 4-digit (`#3683`, `#3784`); Core PRs are 3-digit (`#716`, `#724`) and resolve against AionCore. Any tooling that scrapes `#NNNN` from this file without tracking the enclosing `###` section will attribute Core changes to the Desktop repo.

The format is machine-generated (compare-links, conventional-commit grouping) and appears at v2.1.4 — consistent with release-please or an equivalent being adopted at that point.

---

## 8. Could not verify

Recorded explicitly rather than guessed:

- **Commit-level detail for `v2.1.43..v2.1.44` beyond subject lines.** Those 5 commits are absent from the local object store; only the GitHub compare API metadata was used. Their diffs were not read.
- **Whether the ~50 commits on the divergent `v1.9.20`–`v1.9.25` line were cherry-picked onto the 2.x line.** The branch point (`4db788bf2`, 2026-04-21) and the exclusive commit counts are verified; the cherry-pick question is not.
- **The contents of the AionCore repository.** It is a separate repo (`github.com/iOfficeAI/AionCore`) and is not on disk. Its version range in this window (v0.1.2 → v0.1.55) is verified only from the desktop's own bump commits and CHANGELOG links. **A large fraction of the functional delta in this range now lives in code this inventory has not seen.**
- **Whether the fork's own tree corresponds to upstream paths 1:1 at v1.9.5.** Dimension 1 was scoped to upstream; the fork tree at `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution` was not diffed here.
- **Per-release commit counts for the three `v1.9.19-dev-*` sibling tags** are unreliable (see §2.1 footnote †). The range total is not affected.

---

## 9. Headline summary

| | |
|---|---|
| **Range** | `v1.9.5` (2026-04-01) → `v2.1.44` (2026-07-30), ~17 weeks |
| **Commits** | **1784** (1779 local + 5 via API; independently confirmed by GitHub `ahead_by: 1784`) |
| **Non-merge / merge** | 1597 / 182 (of the 1779) |
| **Files changed** | **3116** |
| **Insertions / deletions** | **260,071 / 281,127** → **net −21,056 lines** |
| **Releases** | **59 stable tags** + 13 `-dev-` pre-releases in range |
| **Category split** | fix 649 · feat 335 · chore 168 · refactor 119 · docs 86 · style 84 · test 71 · perf 8 · revert 6 · ci 5 (1543 classified, 54 unclassified) |
| **Explicit breaking changes** | 1 marked (`refactor(agent)!` `4a89db942`), 3 commits carrying the footer |
| **Unmarked breaking changes** | 3 — monorepo restructure, snake_case wire format, out-of-process backend |
| **Biggest single commit** | `5dcf60101ca` — 69,534 lines / 386 files |
| **Most consequential commit** | `a677b86478a` — 1221 files; created `packages/`, deleted `src/` |
| **Dominant feature area** | Team mode — 226 commits (91 feat + 135 fix) |
| **CHANGELOG** | Yes, 1294 lines, but only covers 2.1.4→2.1.44 (41 releases); nothing for v1.9.5–v2.1.3 |

**The three facts that should drive the roadmap:**

1. **`src/` no longer exists upstream.** 1398 files moved to `packages/desktop/src/` in one commit (`a677b86478a`). Path-based merging is off the table.
2. **Upstream deleted ~21k more lines than it added**, because agent management, MCP, persistence, skills, team and channels were relocated into a separate `aioncore` backend process in a separate repo (v0.1.2 → v0.1.55). Much of the v2 delta is not in this repository at all.
3. **The wire format changed camelCase → snake_case** across 488 source files plus 132 wire-contract files — a silent break with no conventional marker.
