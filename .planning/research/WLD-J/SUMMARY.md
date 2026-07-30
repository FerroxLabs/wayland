# WLD-J — What to take from AionUi upstream. Authoritative summary.

**Compiled 2026-07-30.** Synthesises `01-release-inventory.md`, `02-security-deps.md`, `03-feature-parity.md`, `04-restructure-migration.md` (+ its CSV), and `adjudication-3f1c5ba10.md`, **re-based onto the corrected fork point established in `.planning/phases/WLD-I-licence-compliance/FORK-POINT.md`**, which post-dates all five.

Every material claim below is tagged: **[VS]** verified against our source · **[VU]** verified against upstream git · **[INF]** inferred.

---

## 1. The bottom line in five sentences

We forked AionUi at **v1.9.25** (`bbada2a92`) on a branch upstream **abandoned** — it is not an ancestor of `v2.1.44`, the line split at `4db788bf2` on 2026-04-21 and never rejoined, so the honest delta is **1032 upstream commits since the merge-base, not the 1784 every input report used** **[VU]**. Of that delta, **100% is post-divergence and most of it is unreachable by construction**: upstream deleted its JS engine, moved agent/MCP/persistence/skills/team/channels into `aioncore`, a Rust service in a **different repository**, flipped the wire format to snake_case, and relocated every source path into `packages/desktop/` **[VU]**. We measured rather than guessed whether any of it can be transported: **5.2% of upstream commits apply cleanly** to our tree (3.7% where we share every path, 4.0% for the most portable renderer-only class), and a same-shaped source applies *worse* (0.4%), which proves our own divergence — not the restructure — is the blocker **[VU]**. Against that, **31 upstream fixes were checked against our actual source and none reproduce**, all **8 applicable security fixes are already present (3 in stronger form)**, and we are **four Electron majors ahead** — the security premise of this milestone inverts **[VS]**. Net output is deliberately small: **four takes, one delete, one revert**, one build-tool bump, and one structural risk (an abandoned `aioncli-core` with 57 importers) that is the only item here that gets worse with time.

---

## 2. The baseline correction, and exactly what it invalidates

### 2.1 The corrected numbers

| | superseded figure | corrected figure | basis |
|---|---|---|---|
| Fork point | `v1.9.5` (`5b2c741f9`) | **`v1.9.25` (`bbada2a92`)** | FORK-POINT.md, two independent methods |
| Upstream delta | "1784 commits (`v1.9.5..v2.1.44`)" | **1032 commits (`4db788bf2..v2.1.44`)** **[VU]** | `git rev-list --count` |
| Our side of the split | not stated | **50 commits (`4db788bf2..v1.9.25`)** **[VU]** | ditto |
| Shared ancestry we already hold | counted as "delta" | **752 commits (`v1.9.5..4db788bf2`)** **[VU]** | ditto |
| Ancestry v1.9.25 → v2.1.44 | assumed linear | **none — not an ancestor** **[VU]** | `merge-base --is-ancestor` → NO |
| Derived files (WLD-I) | 981 of 1005 | **1377** | WLD-I re-baselined |
| 100%-overlap files | 186 | **270** | ditto |
| DIVERGED files | 20 | **4** | ditto |

752 + 1032 = 1784 exactly. **The old headline was not wrong arithmetic; it was the wrong range.**

### 2.2 The most consequential consequence: dimension 3's split was measuring the fork, not the migration

`03-feature-parity.md` §1 reports a 752 / 1032 "pre-migration reachable vs post-migration unreachable" split, derived by intersecting the range with the archive snapshot's ancestry. **That split is arithmetically identical to the merge-base split, and it is the same set** — because `merge-base(archive, v2.1.44)` is also `4db788bf2` **[VU]**.

So the correct reading of dimension 3's own number is stronger than dimension 3 stated:

- The **752 are not "reachable in principle" — they are ancestors of `v1.9.25`, i.e. we already have them** **[VU]**. Not 42% of the delta to consider; 0%.
- The **1032 are the entire delta**, all of it post-divergence. Dimension 3's "58% architecturally unreachable" and "42% reachable" become **100% post-divergence**, of which the architecturally unreachable share is the whole `aioncore`-shaped remainder.

This does not change a single TAKE or DECLINE — every one of those was decided by reading our own source, not by fork-point arithmetic. It changes the framing: **there is no cheap reachable half.**

### 2.3 New finding: the branch we forked from is exhausted

The abandoned 1.9.x line contains **10 commits past our fork point** (`bbada2a92..bc29db7a9`), and their content is: three WeChat QR-code doc updates, an Arco font-family style override, its own revert, and an "ambient bubble window skeleton" **[VU]**. `archive/main-before-backend-migration` tip `bc29db7a9` is a **direct descendant of our fork point**, only 10 commits ahead.

Two consequences:

1. **There is nothing to salvage from our own line's continuation.** It is closed.
2. **`04-restructure-migration.md` §3.2's archive-branch control needs re-reading.** It sampled 250 commits from `v1.9.5..archive` (812 commits) and measured 0.4% clean-apply — but **752 of those 812 are commits we already contain** **[VU]**. A ~92% chance of sampling a change already in our tree fully explains a 0.4% apply rate and the "already exists / context mismatch" failure causes. **The 0.4% figure does not support the inference drawn from it.** The conclusion it was used to support (restructure is not the obstacle) still stands, but on the *other* evidence: aliases absorbed the move, 170 of 429 renames are `R100` byte-identical, path rewriting is a `sed` **[VU]**. Do not re-cite the 0.4% as a control.

### 2.4 Conclusions that survive the baseline change untouched

Baseline-independent, because they were measured against our tree or against fixed artifacts:

- **5.2% cherry-pick clean-apply rate** (n=400, harness validated at 93.3% on a known positive) **[VU]**
- **Electron 41.6.0 vs upstream 37.10.3** — four majors ahead **[VS]**
- **31 upstream fixes checked against our source, 0 reproducing** **[VS]**
- **8 of 8 applicable security fixes present, 3 stronger** **[VS]**
- **57 `aioncli-core` importers in our tree** **[VS]**
- **The three verified gaps** (§3 takes 2–4) — content greps over all of `src/` **[VS]**
- **The whole `3f1c5ba10` adjudication** — pinned upstream checkouts, controlled comparisons
- **1,632 conflict hunks / 268 files / 95,995 lines** — a 3-way merge sim against `v1.9.5`; the *magnitude* is sound as a rebase price, but see §7, the base is wrong by 20 tags

### 2.5 Conclusions whose validity depends on the baseline — flagged

| claim | why it is baseline-dependent | status |
|---|---|---|
| "Upstream added X after the fork ⇒ we lack it" (any such inference) | judged against v1.9.5, 20 tags early | **Unsafe. Dimension 3 already refused to use it** and read our source per item instead. No TAKE rests on it. |
| `03-feature-parity.md` §2 "our tree contains post-v1.9.5 upstream content… at least v1.9.8" | correct observation, wrong explanation | **Resolved.** Not later porting or a drifted snapshot — the fork point is simply v1.9.25. Its "inferred, flagged" interpretation can be closed. |
| `04-restructure-migration.md` §4 — 981-derived-file cross-reference and the entire `04-derived-files-upstream-action.csv` (1005 rows) | keyed to the v1.9.5 inventory, now 1377/270/4 | **Stale. Re-run against v1.9.25 before sizing anything.** Ratios are indicative; counts are not. |
| §4.1 3-way merge sim (base = v1.9.5) | wrong base | **Directionally sound, numerically stale.** A v1.9.25 base can only reduce conflicts (nearer base). Treat 1,632 hunks as an **upper bound**. |
| "Whether the ~50 divergent-line commits were cherry-picked onto 2.x" (01 §8) | framed as an upstream curiosity | **Reframed: those 50 are OURS**, the commits on our side of the split, and per FORK-POINT.md §4 they are unexamined. |
| Adjudication's derivation percentages (100% / 95.1% / 94.1% / 89.6% / 72.5%) measured vs v1.9.5 | wrong baseline | **Direction is under-counting** (WLD-I: DIVERGED 20 → 4 on re-baseline). Re-measurement can only strengthen the RESTORE verdicts, never weaken them. Verdicts stand. |

---

## 3. What we take

Six actions. Ranked by value, with effort. **Every item needs per-file provenance treatment under WLD-I before it lands** — that is not re-litigated here.

| # | Item | Verdict | Justification | Effort |
|---|---|---|---|---|
| **T1** | **Contextual "via chat" entry points for the Concierge** (#3446 + unannounced `d7f4cc1d0`, `b1f78d7a1`, `e8499a2fa`, `eeaeef90b`) | **ADAPT** | We already own the hard part — `common/chat/conciergeConfig.ts` implements propose→confirm→apply with a consent card and secret hygiene upstream never claims **[VS]**. The gap is not the assistant, it is the **affordance**: a "set this up by chat" action beside each manual surface. Purest expression of "friction is the enemy" in the whole delta. | **S** — wiring, no new machinery. Their trigger points, our Concierge contract. |
| **T2** | **macOS wrong-architecture startup guard** (#3232 / AIO-64) | **TAKE (concept)** | `runningUnderARM64Translation\|Rosetta` → **zero hits** across `src/` and `scripts/` **[VS]**. We already guard this on Windows, so it is an asymmetry, not a feature request. Intel build on Apple Silicon fails confusingly. | **S** — implement against `app.runningUnderARM64Translation`. |
| **T3** | **GPU-crash self-heal** (#2945 / ELECTRON-9A, 9D) | **ADAPT** | `src/index.ts:797` handles `render-process-gone` by **logging only**; our sole `disable-gpu` switch (`process/utils/configureChromium.ts:44`) is scoped to WebUI/headless Linux and never fires on the desktop path **[VS]**. A dead window is the worst outcome for a user who cannot read a log. *Caveat:* upstream shipped this against real Sentry IDs; **we have no crash data of our own confirming it bites us** **[INF]**. | **S–M** — crash counter + relaunch with GPU disabled, in our bootstrap. |
| **T4** | **Configurable font sizes** (#3223) | **TAKE (concept only)** | `chatFontSize\|fontSize.*(chat\|markdown\|code)` → **zero hits** **[VS]**. Accessibility gap; we have theme plumbing but no text-size control. Their implementation is entangled with a theme rewrite we should **not** import. | **M** — independent chat/markdown/code sizes, live-applied, persisted. |
| **T5** | **`electron-builder` 26.10.0 → 26.15.2** | **TAKE (conditional)** | The **only** dependency in the entire range where upstream is ahead of us — five minors **[VU]**. Build-toolchain, not runtime, so **not a shipped-product exposure**. **Not verified** whether 26.11–26.15 carry a security fix; that advisory check gates urgency in both directions. | **S** — bump + packaged-artifact verify. Do not treat as urgent until the advisory check is done. |
| **T6** | **Full revert of `3f1c5ba10`, then attribute *more*** | **REVERT** | Settled and executed; recorded here for completeness. All 9 deleted sites adjudicate to RESTORE; 7 of 9 were **AionUi's own notices, byte-identical at the same path**, in files at 72.5–100% derivation. Two deletions removed the last provenance record for subsystems with **measured, shipping third-party code**: the acpx port (MIT, zero attribution anywhere in `src/process/acp/`) and a Cherry Studio regex **byte-identical** and still shipping in `src/common/utils/modelCapabilities.ts` (**AGPL-3.0 + >10-person commercial trigger**). | Done. Follow-ons F1–F7 remain, incl. **F3 (counsel: Cherry Studio headcount trigger)** and **F6 (P1 → WLD-I: `docs/architecture/research/claude-team-mode-analysis.md`)**. |

### The one DELETE

**D1 — delete `public/pet-states/` (22 files: 21 SVGs + `preview.html`).**
Verified **zero references** anywhere in `src/`, `scripts/`, `electron-builder.yml` or `package.json` — the desktop-pet feature was never wired in our tree **[VS]**. Yet the assets ship **twice in every artifact**: `electron-builder.yml:24` includes `public/**/*`, and `electron.vite.config.ts:156` sets `publicDir: resolve('public')`, copying them again into `out/renderer` **[VS]**. Two of four sampled SVGs are **byte-identical to upstream v2.1.44** and carry no attribution **[VU]**. Deleting shrinks the package and removes an attribution surface. Effort: **XS**. This is also a concrete input to WLD-I.

### What the search actually produced, stated plainly

953 upstream commits were never mentioned in any release note — the seam most likely to hide risk. Sweeping them produced **zero new features worth taking and zero reproducing bugs** **[VS/VU]**. That is the finding, not a gap in the search. The takes above come from three verified absences and one discoverability gap; nothing else survived contact with our own source.

---

## 4. What we decline, and why

| Item | Reason |
|---|---|
| **The entire post-`aioncore` stream — 1032 commits** | Fixes to glue that exists *only because* upstream split out a Rust backend: backend startup diagnostics, `__backendPort unset`, bundled-aioncore verification, port reuse after crash-restart, health-probe timeouts, snake_case adapter mapping, pre-warmup 404 suppression. **Not latent bugs in our tree.** We made the same architectural move independently, at a different cut line, to a different engine. |
| **Team-mode arc — 102 of 307 unannounced fixes; 226 commits total, the single largest upstream investment** | We have our own (`process/team/`, 45 files). Adopting theirs means abandoning ours to chase a target now built on their Rust backend. |
| **Desktop Pet (#2127)** | A mascot, not a capability. A second always-on-top window with its own crash surface — upstream shipped 6+ follow-up fixes. We hold the orphaned assets and none of the code: **delete rather than finish** (D1). |
| **Local markdown file links in Preview (`b2eb762df`, #3379/#3396)** | The feature that produced **two** path-sandbox escapes (`5e5995b12`, `efc94e464`). Our design rejects `file:` outright — `openExternalUrl` allowlists https/http/mailto/wayland (`utils/platform.ts:125`) and we strip `file://` from markdown text (`Markdown/index.tsx:50`) **[VS]**. Taking the feature means importing the attack surface. |
| **Butler remote access via automatic Cloudflare tunnel (v2.1.20)** | Putting a non-dev's local agent on the public internet through a tunnel we do not control is a liability, not a friction win. |
| **Conversation-scoped MCP (#3109)** | Verified absent, and declined anyway: it turns one global toolset into N per-conversation toolsets — more config surface for a user who does not want to think about MCP. Our curated 110-entry catalog is the everyman answer. |
| **18 ACP registry agents (v2.1.38)** | Each needs its own product CLI on PATH: 18 new ways for a non-dev to hit "command not found." Opposite of "one system to rule them all." |
| **Project Explorer (#3763)** | Still landing upstream (v2.1.43, 129 files, brings its own WebSocket `fs/*` data plane). Our workspace tree works. |
| **Adopting the `packages/*` monorepo layout** | Upstream's driver was **running the UI outside Electron in a browser** — `@aionui/web-host`, `@aionui/web-cli`, both explicitly "no Electron dependency". Adopt it only if we independently want a browser-hosted Wayland UI. **Do not adopt it for portability: it buys nothing** (§5). |
| **WeChat / WeCom / Weixin / DingTalk channels** | Wrong market; we ship WhatsApp/Telegram/Lark. |
| **`aionrs` / AionCore / OfficeCLI / 3D Morph PPT / Snow / Hermes-as-backend** | Upstream's own product stack; we have `wayland-core`. |
| **Kimi contributor campaign (v2.1.39)** | Business development, not code. |
| **Persian (fa-IR) locale (#3284)** | The only locale we lack (we ship 12, they 13). RTL layout work across the whole app, not a translation drop. |
| **Upstream's preload additions** (`bbb734c31`, `9595eabe2`, `e743f8e6b`) | All three **expand** the renderer-reachable surface; there is no preload allowlist or CSP work in the range. **Adopting any of it would enlarge our attack surface.** |
| **All 31 fixes checked in dimension 3 §3.2 / §4** | Read against our source: already present (10, several byte-identical), N/A (3), or structurally impossible (1). Several of ours strictly stronger — e.g. `c351a90b5` where we `archiveAndRemoveJob` so a false positive is recoverable. |
| **Marginal/cosmetic feats** | `14e189e0f` filename search (we have conversation search **plus** a cmdk palette; their delta is filename matching); `7fd40c790` min-window-width; `6aec0385d` default zoom — our layout has diverged. |

**Residual, noted not taken:** our `windowControls.close` uses `getFocusedWindow()` and no-ops if focus is lost (`windowControlsBridge.ts:68-71`); upstream added a first-live-window fallback. A dead click, not data loss **[INF — reasoned from code, not reproduced]**.

---

## 5. Strategy — targeted re-port, with a thin cherry-pick lane

**Verdict: targeted re-port (B), plus a narrow cherry-pick lane for the ~4% of genuinely isolated changes and for any security fix, where the correct unit is "the fix," not "the commit."**

### The measured evidence that killed cherry-pick

Harness: strip the `packages/desktop/` prefix from patch headers, `git apply --check -p1`, read-only. **Control run first**, per the find-a-known-positive rule: the same patches applied against upstream's own parent commit, n=60 → **93.3% CLEAN**. The harness is sound **[VU]**.

| sample | clean |
|---|---|
| Random upstream commits ≤80 files (n=400) | **5.2%** |
| …where we hold 100% of the commit's paths (n=191) | **3.7%** |
| …where we hold 0% of the paths (n=60) | **21.7%** |
| Renderer-only commits — the most portable class (n=200) | **4.0%** |

Failure causes: context mismatch, our file diverged (217) · file missing our side (124) · target already exists, added independently (20). **The 21.7% row is the tell: commits land cleanly only when they add files we do not have.** Where we share the file, we conflict — 19 of every 20 commits need manual resolution, at which point you are hand-porting while paying the overhead of pretending otherwise.

The single worst shared file: `src/common/adapter/ipcBridge.ts` — base 1164 L → upstream 2073 L, **ours 3377 L**. Both sides doubled/tripled it independently; **70 of 363 sampled failures blame that one file** **[VU]**.

### Why the restructure is not the obstacle

Path aliases (`@/*`, `@process/*`, `@renderer/*`, `@worker/*`) survived the move under the same names, so **import specifiers inside source files did not change**; 170 of 429 detected renames are `R100` byte-identical; e.g. `src/common/adapter/constant.ts` is blob `64887b617d891064a57f8e51ec1649e7307b70ed` on **both** sides **[VU]**. Path rewriting is a `sed`. **Our own divergence is the blocker, not layout** — do not spend effort on layout compatibility expecting it to buy portability.

*(The archive-branch 0.4% control that dimension 4 used to make this same point is confounded — see §2.3. The alias and `R100` evidence above is not.)*

### Why rebase-onto-upstream is disqualified

Priced honestly rather than dismissed. The merge cost is real — **1,632 conflict hunks across 268 files touching 95,995 lines of our code**, plus **504 files with no automatic counterpart** needing human adjudication (both figures measured against the wrong base and therefore **upper bounds**, §2.4). But the merge cost is not the disqualifier.

**The disqualifier is that upstream `v2.1.44` has no JS engine.** Its `src/process/{agent,channels,extensions,webserver,task,worker}` are gone — **185 files of backend logic with no successor anywhere in the tree** — and `@office-ai/aioncli-core` and `@office-ai/platform` are deleted from its dependencies **[VU]**. Rebasing onto it means either shipping against `aioncore` — abandoning `wayland-core`, the WhatsApp/baileys bridge (**8,774 files** under our `src/process/channels/`), Flux routing and the cost/budget subsystem — or re-attaching our entire backend to a tree engineered to not have one. The ACP wire contract also flipped camelCase → snake_case (serde's default; measured on `acpTypes.ts`: 151→0 camelCase props vs 11→31 snake_case) **[VU]**.

**This is not a hard merge. It is a different product.** Recommend against, on those grounds.

### Sequencing

1. **T5 advisory check → bump**, plus any genuinely isolated single-file fix. Cheapest real value.
2. **D1 delete.** XS effort, shrinks the artifact, closes an attribution surface.
3. **T2, T3** — contained, verified-absent, no upstream code needed.
4. **T1** — the highest-value item; wiring against a contract we already own.
5. **T4** — concept only; do not import the theme rewrite.
6. **Do not adopt `packages/*`** unless we independently want a browser-hosted UI.
7. **Read `archive/main-before-backend-migration` as a reference, never as a merge source.** It is a direct descendant of our fork point (10 commits) and shows the last upstream implementation that assumed our architecture — often more useful than v2.1.44's aioncore-shaped version. Its 0.4% apply rate rules it out as a transport, and that rate is itself confounded (§2.3).
8. **Treat everything downstream of the aioncore extraction as permanently forked.** Track for ideas, never for code.

---

## 6. Live risks we hold

**R1 — `@office-ai/aioncli-core@0.30.6` is abandoned and we have 57 importers.**
Last publish **2026-04-20**; `0.30.6` is the final release (verified directly against the npm registry) **[VU]**. Upstream removed it entirely (`2eb86fb67`, `ed83ab48c`, 2026-07-15) and their importer count went 41 → 14 → **0**. **Ours is 57 — nineteen more than upstream had at the fork point.** We deepened the dependency over exactly the four months upstream eliminated it **[VS]**.
We carry **four** local patches against it (the brief said three): Anthropic sampling params; the OpenAI tool-schema `properties` bug; MCP OAuth (port-collision, branded HTML, `clientId` refresh fallback); and a `package.json` floor-loosening for `picomatch`/`simple-git`/`systeminformation` so our root `resolutions` can hoist patched versions — **that fourth one is itself a supply-chain control and is easy to overlook.**
**There is no upstream relief.** Their exit was "adopt AionCore," which is their engine, not a library we can consume. Our exit is migrating the 57 call sites onto `wayland-core`, which we already ship. **Not exploitable today; it is the only item here that strictly worsens with time.** This should drive a WLD-J roadmap phase.

**R2 — `electron-builder` 26.10.0 vs upstream 26.15.2.**
The only place upstream leads us on a dependency. Build-toolchain, not runtime — **not a shipped-product exposure**. **Whether 26.11–26.15 contain a security fix was not verified.** That advisory check gates whether this is urgent *or* dismissible; until it is run, neither claim is supportable. → T5.

**R3 — untraced path-traversal lead in our own code.**
`resolveMessageFilePath` (`src/renderer/pages/conversation/Messages/components/MessageText.tsx:118-125`) does string concatenation of workspace + user-supplied path with **no `..` collapsing and no containment check**, and its output feeds `resolvedFiles` at `:176` **[VS]**. **This is not an upstream gap — it is our own code**, and upstream's analogous markdown path needed **two** fixes (`efc94e464`, `5e5995b12`) for exactly this class. **Reachability was not traced** and depends on what consumes `resolvedFiles`. Flagged, not claimed. Needs a follow-up review with its own owner.

**R4 — coverage limits that are load-bearing.** These bound what the above can claim:
- **The AionCore scan reached 250 of 398 commits — ~63%.** `v0.1.2..v0.1.55` via the GitHub compare API; **148 commits were never returned.** One security-relevant commit appeared in the 250 (`05df6f7c2`, quinn-proto RustSec advisory, no advisory ID given and none invented) and it does not transfer — their engine is Rust, ours is `wayland-core`. **A security fix living in AionCore is invisible to any git analysis of AionUi.** Low relevance, but it is the honest boundary.
- **`v2.1.43..v2.1.44` diffs were never read** — those 5 commits are absent from the local object store; only GitHub compare metadata was used.
- **`04-derived-files-upstream-action.csv` (1005 rows) and the 504 "no counterpart" bucket are keyed to the superseded v1.9.5 inventory.** And the 504 must **not** be read as "upstream deleted them" — spot-checks show reorganisation (`slashMatcher.test.ts` → `src/common/chat/slash/**`) and porting (`Messages/codex/**` → generic `Messages/**` + `Messages/acp/**`) as often as genuine absence. A port shares no literal lines with its source, so **no text-overlap method will find these; only reading the code will.**
- **The 50 commits on our side of the split are unexamined.** They may contain fixes upstream mainline never received — a second, independent reason our tree leads.

**R5 — accepted-and-declined, listed so it is not rediscovered:** `useThrottle` (`src/renderer/hooks/ui/useThrottle.ts`) has no `useEffect` unmount cleanup, so a pending timer fires after unmount **[VS]**. **Memory leak, not a security issue.** The only genuine code-level miss found in 1784 commits. One-line fix, listed for completeness rather than urgency.

---

## 7. Where we lead upstream

Stated factually, without triumph — several of these are simply consequences of different priorities.

| axis | upstream at v2.1.44 | ours |
|---|---|---|
| **Electron** | `^37.10.3` — never moved a major in the whole range | **41.6.0**, four majors ahead. Electron supports the latest three majors; **37 is outside that window**, so upstream is the one carrying unpatched Chromium CVEs **[VS]** |
| **Electron security shell** | `webPreferences` **byte-identical** at v1.9.5 and v2.1.44: preload + `webviewTag` only. No `contextIsolation`, no `nodeIntegration`, no `sandbox`. **Zero security-shell commits in the range.** Still ships `contextIsolation=no` in `WebviewHost.tsx:478` and `allowRunningInsecureContent` in `HTMLRenderer.tsx` | `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `nodeIntegrationInWorker: false` (`src/index.ts:555-567`), plus a `will-attach-webview` guard (`:608-615`) that **strips `preload`/`preloadURL` and force-overrides** the guest's flags — neutralising the exact pattern upstream still carries — and a discriminating permission handler (`:617+`) **[VS]** |
| **Credential storage** | `safeStorage` usage went **2 files → 0**. Upstream **deleted** OS-keychain-backed credential encryption from the desktop (`d91be9c42`, `77dbc4ba8`); credentials now live behind AionCore | A dedicated `src/process/secrets/` subsystem — `safeStorage.ts`, `fileKeyStore.ts`, `vaultPassphrase.ts` — plus `ProviderRepository`, `legacyModelConfigMigration`, `modelRegistryIpc` **[VS]** |
| **Supply chain** | `prepare-aioncore.js`, 591 lines — **no `sha256`, no `createHash`, no checksum, no signature**. Their "verify bundled resources" script checks `existsSync`/`statSync` only — **presence and layout, not integrity**. Resolves `aioncoreVersion` to **`'latest'`** as a documented fallback: an unpinned, unverified binary fetch | `scripts/prepareWaylandCore.js`, 723 lines — SHA-256 manifest, per-asset `archiveSha256` + `binarySha256`, `WCORE_REQUIRE_VERIFIED=1` strict path, hard "supply-chain guard" failure when the manifest is missing **[VS]** |
| **Transitive deps** | **No `resolutions`/`overrides` block at all** | A **34-entry** `resolutions` block (`axios >=1.16.0`, `tar ^7.5.7`, `undici ^7.28.0`, `dompurify ^3.4.12`, `ws ^8.21.1`, …), ahead of upstream's floors on `@xmldom/xmldom` and `mermaid`. A capability upstream simply does not have **[VS]** |
| **Auth** | refresh-token blacklist (`ba0e0df2a`) | same, **plus a token-family id** for reuse detection that upstream does not have at v2.1.44 **[VS]** |
| **Path confinement** | `startsWith` check on the multer temp path | canonical **by construction** — `path.join(path.resolve(MULTER_TEMP_DIR), path.basename(file.path))` **[VS]** |
| **Anthropic SDK** | `^0.71.2` — unchanged across the entire range | `^0.96.0`, 25 minors ahead **[VU]** |
| **A cautionary tale, not a lead** | `b455f110d` (07-06): upstream's blanket camelCase→snake_case rename (`b78247098`, 04-23) silently turned `apiKey` into `api_key` in the OpenAI SDK config, so the configured key was dropped and the client fell back to `process.env.OPENAI_API_KEY`. **2.5 months to notice.** | We never had it — `OpenAIRotatingClient.ts:41` is correct **[VS]** |

**The premise this milestone started from — "unfixed upstream security bugs are live in our shipped product" — does not survive contact with the evidence.** Zero commits in the range reference a CVE or GHSA. All 8 applicable fixes are present. The direction of travel on credential storage, supply-chain verification and the Electron shell is **opposite to ours**, and upstream is the one moving backwards.

---

## 8. Open questions and unverified claims

| # | Question / claim | Status | What would settle it |
|---|---|---|---|
| Q1 | Do `electron-builder` 26.11–26.15 contain a security fix? | **Not verified.** Gates whether T5 is urgent or dismissible. | Advisory check against electron-builder release notes + GHSA. One pass. |
| Q2 | What is in the **50 commits on our side of the split** (`4db788bf2..v1.9.25`)? | **Unexamined** (FORK-POINT.md §4). May contain fixes upstream mainline never received. | `rtk proxy git log 4db788bf2..v1.9.25` + read the subjects; classify. Cheap. |
| Q3 | Is `resolveMessageFilePath` reachable? | **Flagged, not claimed** — string concat with no `..` collapsing, feeding `resolvedFiles`. | Trace every consumer of `resolvedFiles` from `MessageText.tsx:176`. Own review, own owner. |
| Q4 | Do the **148 unreturned AionCore commits** contain anything relevant? | **Acknowledged gap** (63% coverage). Low relevance — their engine is Rust, not ours. | Clone `iOfficeAI/AionCore` and enumerate locally, or paginate the compare API properly. |
| Q5 | What do the **5 `v2.1.43..v2.1.44` commits** actually change? | **Subjects only**; diffs never read (shallow graft). | Fetch the tag properly, or read the 5 diffs via the API. |
| Q6 | The **504 "no counterpart" files** — reorganised, ported, or genuinely gone? | **Explicitly not determined.** The bucket is "no same-name counterpart found," nothing more. | Read the code. No text-overlap method will resolve a port. |
| Q7 | Does the derived-file cross-reference change on the **v1.9.25** baseline? | **Stale** — CSV and the 3-way merge sim are keyed to v1.9.5. Error direction is under-counting. | Re-run `inventory.py` and the merge sim with base = v1.9.25. It takes the baseline as a directory argument — a re-run, not a rewrite. |
| Q8 | **Cherry Studio's >10-individual commercial-licence trigger.** | **Open — commercial, not compliance.** Byte-identical AGPL-licensed regex ships today in `src/common/utils/modelCapabilities.ts`, uncredited. | Ferrox Labs headcount + counsel (adjudication F3). |
| Q9 | Which Cherry Studio licence generation governs? | **Open, cheap to close.** Their `LICENSE` was rewritten 2025-03-18; before that it was permissive. | `gh api "repos/iOfficeAI/AionUi/commits?path=src/renderer/utils/model/modelCapabilities.ts"` → earliest commit introducing `LLM2Vec`, compare to 2025-03-18. One call (adjudication F4). |
| Q10 | `docs/architecture/research/claude-team-mode-analysis.md` — **present in HEAD**, states it is based on extracted Claude Code source, and reproduces verbatim internal comments, paths, error strings and production telemetry, with a per-module "Replication %" table topping out at *"can be precisely copied — 92%."* | **🔴 P1, routed to WLD-I** (adjudication F6). Proprietary-source exposure, **not** an attribution question. | Sean + counsel. Decide separately whether that doc belongs in a public repo at all. |
| Q11 | Is our `cronSkillFile.ts` derived from Claude Code? | **UNVERIFIED and undiffable by construction** — closed source, minified, and Anthropic stopped shipping readable `cli.js` at 2.1.113 (2026-04-17), before our file landed. A partial frontmatter-regex match exists; a zero in a minified bundle is not evidence. | Nothing will settle it. Comment restored as evidence precisely because the record cannot be reconstructed later. |
| Q12 | Was the GPU-crash class ever observed in *our* build? | **[INF]** — plausible on shared Electron surface, but we have no crash data of our own. | Our own Sentry/crash telemetry. Does not block T3; a dead window is unrecoverable either way. |

---

## 9. Where the inputs conflict

| Conflict | Resolution |
|---|---|
| **Fork point: v1.9.5 (all five reports) vs v1.9.25 (FORK-POINT.md)** | **v1.9.25.** FORK-POINT.md post-dates all five and carries two independent methods — a first-appearance floor (3 files first appear at v1.9.25, nothing after) and a same-path byte-identical blob curve peaking at v1.9.25 (590). v1.9.5 was supplied verbally and is contradicted by the tree. **All five reports are re-based accordingly (§2).** |
| **`merge-base --is-ancestor v1.9.5 v2.1.44`: report 01 says false-negative-from-shallow-graft; report 04 says it resolved to YES after fetching** | **Both are right about v1.9.5, and both are answering the wrong question.** v1.9.5 *is* a linear ancestor of v2.1.44. **Our fork point v1.9.25 is not** — re-verified on the healed clone **[VU]**. |
| **Non-merge commit counts: 1597 (report 01) vs 1602/1631 (reports 03/04)** | Immaterial; ±0.3% on a range that is itself superseded. Report 01's 1597 is the better-evidenced figure (explicit merge/non-merge split, cross-checked three ways). Both classifications agree to within 2 on the noisiest bucket (fix 649 vs 651). |
| **"~70% architecturally unreachable" (report 03 first pass) vs "58%" (report 03 revised)** | **Neither.** The release-note view over-weighted the tail; the 58% was the merge-base split in disguise. Correct statement: **the delta is 1032 commits, 100% post-divergence** (§2.2). |
| **Report 04: "the archive branch is a divergent branch, not an ancestor"** | True of `v2.1.44` — but it is a **direct descendant of our fork point**, 10 commits ahead **[VU]**. Its value as a reading reference is *higher* than report 04 credited; its 0.4% apply rate is confounded and should not be re-cited (§2.3). |
| **Adjudication brief: "acpx and Zed are GPL-family"** | **Half wrong.** acpx is **MIT** (© 2025 OpenClaw Team) at the pin `v0.5.3`; npm metadata was Apache-2.0 only at 0.1.0. Zed is GPL-3.0 but **no Zed code is present and none can be** — it is Rust, ours is TypeScript, and 8/8 Zed-specific identifiers return zero. **The GPL-family exposure in that commit is Cherry Studio**, and it is the one deletion where verbatim third-party code is provably still shipping. |

---

## 10. Provenance discipline

Every take, delete and revert above is subject to per-file provenance treatment under WLD-I before it lands. Two rules carried forward from the adjudication and not re-litigated here:

1. **Wrongly stripping attribution creates a live licence breach; wrongly keeping it is harmless over-credit.** The asymmetry decides every close call.
2. **Rewording an inherited notice is itself a §4(c) act.** No trim, clarification or consolidation of AionUi's surviving provenance comments (`ipcBridge.ts:1009,1100,1105`, `extensionsBridge.ts:196,244`, `ExtensionRegistry.ts:72`) until the §4(c) counsel question lands — and then all-or-nothing.

---

## Reproducing the corrected figures

```bash
cd ~/dev/resources/AionUi
git merge-base --is-ancestor v1.9.25 v2.1.44        # exit 1 = NOT an ancestor
git merge-base v1.9.25 v2.1.44                      # 4db788bf26688c609140eb650d0b8dc078246356
git rev-list --count 4db788bf2..v2.1.44             # 1032  <- the real upstream delta
git rev-list --count 4db788bf2..v1.9.25             # 50    <- our side of the split
git rev-list --count v1.9.5..4db788bf2              # 752   <- shared ancestry we already hold
git merge-base archive/main-before-backend-migration-2026-05-25 v2.1.44   # 4db788bf2 (same base)
git rev-list --count bbada2a92..bc29db7a9           # 10    <- all that is left of our line
```

Use `rtk proxy git ...` for anything that enumerates — plain `git log` silently truncated a 1779-commit range to 50 rows during this work, and `rtk` itself mangles `wc -l`, `grep -h` and `find -exec`. Use `awk 'END{print NR}'` or Python for counting.
