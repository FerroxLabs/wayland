# WLD-J · Dimension 3 — Feature Parity vs AionUi Upstream

**Fork point (per WLD-I):** AionUi `v1.9.5` (`5b2c741f9`, 2026-04-01)
**Upstream head:** `v2.1.44` (`f37a6187f`, 2026-07-30)
**Range:** **1,784 commits** (1,602 non-merge + 182 merge)
**Upstream tree:** `/Users/seandonahoe/dev/resources/AionUi` (full history)
**Our tree:** `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution` @ `d84a7fee4`

**Revision note.** A first pass ran against the upstream clone while it was still mid-fetch and
therefore shallow (2 grafts; `git log v1.9.5..v2.1.44` returned 1 commit). That pass enumerated
upstream changes from the 70 release notes — a summary layer. The clone is now healed
(`--is-shallow-repository` → `false`, range = 1,784). **The coverage half below has been redone at
commit level.** All verification-against-our-source from the first pass is unchanged and re-marked;
none of it depended on upstream history.

---

## 0. Method

All enumeration via `rtk proxy git …` (plain `git log` silently truncated the range to 50 this
session; rtk also breaks `wc -l`, `grep -h`, `find -exec` — counts below use `awk`/Python).

1. Dumped all 1,602 non-merge commits, classified by conventional-commit type.
   My independent count — **fix 651 · feat 337 · refactor 119 · perf 8** — matches the coordinator's
   (649/335/119/8) to within 2 on the noisiest bucket. Method validated before I trusted it.
2. Extracted the **800 PR numbers cited across the 70 release notes**, then subtracted: **953 commits
   (59%) were never mentioned in any release note**, including **307 fixes** and **205 feats**.
   That is the seam I was asked to sweep.
3. Triaged those 953 by scope, then read the diff of every plausible user-facing / security /
   data-loss candidate and checked each against our source, citing `file:line`.

**Path-restructure discipline.** `a677b8647` moved `src/` → `packages/`. I hit this trap live: a
`git show v2.1.44:packages/desktop/public/pet-states/idle.svg` returned empty, and the resulting
SHA-256 was `e3b0c442…` — the hash of the empty string. Had I compared that to ours I would have
recorded a spurious "differs". The assets actually live at repo-root `public/` at v2.1.44. Every
path claim below was re-resolved against the actual tag tree; path comparison is used for inclusion
only, never exclusion.

---

## 1. Framing conclusion — tested against commit data, and **corrected**

The first pass concluded that ~50 of 70 releases (~70%) target an architecture we do not have. The
commit data says the direction is right but **the magnitude was overstated.**

Upstream kept `archive/main-before-backend-migration-2026-05-25`, the last pre-migration state. Set
intersection against the range:

| Segment                                                                             |   Commits |   Share | Reachable for us? |
| ----------------------------------------------------------------------------------- | --------: | ------: | ----------------- |
| In range **and** ancestor of the archive snapshot — pre-migration, our architecture |   **752** | **42%** | Yes, in principle |
| In range but **not** in the archive snapshot — post-migration                       | **1,032** | **58%** | No                |

**Corrected claim: 58% of the delta is architecturally unreachable, not ~70%.** The release-note view
inflated it because the post-migration releases were numerous but small (v2.1.x shipped ~50 releases
of a handful of commits each), while v1.9.6–v1.9.25 packed 752 commits into 20 releases. Counting
releases over-weights the tail.

The substance of the conclusion survives, and I still endorse it:

- At `v2.1.0` upstream extracted the backend into **AionCore**, a Rust service (Axum/Tokio/sqlx/rustls)
  in a **different repository**, moved the wire format to snake_case (#2672), and deleted ~3,579 lines
  of now-dead frontend logic (#2862). Agent management, MCP, persistence, skills, team and channels
  all moved out of the repo I am diffing. Net −21,056 lines is relocation, not deletion.
- Anything that moved to `aioncore` is **out of scope for parity — flagged, not chased**, per the
  coordinator's instruction.
- **We made the equivalent move independently** with the bundled `wayland-core` binary
  (`resources/bundled-wayland-core/`). We are not behind on the concept.

The practical consequence is unchanged: a large share of what reads as "bug fixes" in `v2.1.x` —
backend startup diagnostics, `__backendPort unset`, bundled-aioncore verification, port reuse after
crash-restart, health-probe timeouts, snake*case adapter mapping, pre-warmup 404 suppression — are
fixes to glue that exists \_because* they made that move. In the sweep below these show up as a large
`fix(adapter)` / `fix(ipcBridge)` / `fix(backend*)` cluster. They are not latent bugs in our tree.

---

## 2. New finding: our tree already contains post-v1.9.5 upstream content

This is the most consequential thing the real history revealed, and it changes how the delta should
be read.

**Evidence 1 — assets that cannot come from v1.9.5.** `public/pet-states/` exists in our tree (22
files). Upstream added it in `9aaf742be` (2026-04-07, "feat(pet): add desktop pet…" #2127), first
tagged **v1.9.8**. Verified: `git merge-base --is-ancestor 9aaf742be v1.9.5` → **not an ancestor**;
`git ls-tree v1.9.5 | grep -c pet-states` → **0**. Of four sampled SVGs, `dragging.svg` and
`carrying.svg` are **byte-identical** to upstream v2.1.44; `idle.svg` and `happy.svg` differ (partial
rebrand). So our tree carries content from **at least v1.9.8** — three releases after the stated fork
point.

**Evidence 2 — post-fork fixes already in place.** Of the architecture-compatible unannounced fixes I
read and checked, **10 of 10 were already present in our tree**, several byte-identical (§3.2). One
example: `c88583048` (streaming-vs-DB merge data loss) introduces a `streamingByMsgId` map and a
content-length comparison; our `Messages/hooks.ts:480-507` has the identical construct including the
`if (!streamingOnly.length && !streamingByMsgId.size)` guard.

**Evidence 3 — the histories are disjoint.** Neither `v1.9.5` nor `c88583048` is an ancestor of our
`HEAD` (`merge-base --is-ancestor` → false for both). Our repo can resolve those objects only because
`upstream → iOfficeAI/AionUi` is a configured remote and someone fetched. The fork was made by copying
files, not by git — consistent with WLD-I's 981/1005-derived finding.

**Interpretation (inferred, not verified):** either the fork snapshot was taken from a working tree
already ahead of the v1.9.5 tag, or post-fork upstream fixes were ported in later. I cannot
distinguish these without provenance work, and that is WLD-I's job — **flagging, not re-litigating.**

**Why it matters here:** "after the fork ⇒ we lack it" is unsafe as a heuristic. Every claim in this
document is therefore a direct read of our source, not an inference from the fork point. It also means
the effective delta is meaningfully smaller than a naive `v1.9.5…v2.1.44` diff implies.

---

## 3. Commit-level sweep of the 953 unannounced changes

### 3.1 Where the unannounced fixes actually are

307 unannounced fixes by scope: **team 102**, cron 21, (none) 19, acp 11, test 10, then a long tail
(feedback/workspace/adapter/ui/assistant/settings/guid/markdown/aionrs/chat 5-6 each).

- **102 (33%) are `team`** — already declined wholesale (§8); we run our own implementation.
- A further large block is the backend-migration cluster (`fix(adapter)`, `fix(ipcBridge)`,
  `fix(backend*)`, `fix(channel)` snake_case alignment) — out of scope per §1.
- After removing team/test/ci/build/e2e/docs, **184 fixes** remain. I read all 184 subjects and pulled
  the diff for every security-, data-loss-, hang- or user-visible-class candidate.

### 3.2 Every candidate checked — result: **none reproduce**

All rows **verified against our source**.

| Unannounced upstream fix                                                               | Class        | Our code                                                                                                                                                                                                                                         | Verdict                                                                                           |
| -------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `c88583048` streaming content lost when DB merge overwrites in-flight message          | Data loss    | `Messages/hooks.ts:480-507` — identical `streamingByMsgId` + length comparison                                                                                                                                                                   | Already present                                                                                   |
| `8523ba3ac` healthy DB wiped because native-module version mismatch read as corruption | Data loss    | `services/database/index.ts:177` excludes native-module errors                                                                                                                                                                                   | Already present                                                                                   |
| `186a0dab2` orphan cleanup deletes cron job that has child conversations               | Data loss    | `services/cron/CronService.ts:139-147`                                                                                                                                                                                                           | Already present                                                                                   |
| `c351a90b5` orphan cleanup deletes legacy cron jobs with empty `conversationId`        | Data loss    | `services/cron/CronService.ts:134`                                                                                                                                                                                                               | Already present, **stronger** — we `archiveAndRemoveJob`, so even a false positive is recoverable |
| `00c4aaa69` hook promise hangs until timeout when child exits cleanly without IPC      | Hang         | `extensions/lifecycle/lifecycle.ts:163-165` — same fallback, same rationale                                                                                                                                                                      | Already present                                                                                   |
| `5fac8c65e` `markExtensionForReinstall` mutates shared object reference                | Correctness  | `extensions/lifecycle/statePersistence.ts:230` — `{ ...state, installed: false }`                                                                                                                                                                | Already present                                                                                   |
| `0c23c8b6e` multer temp path not validated (path traversal)                            | Security     | `webserver/routes/apiRoutes.ts:41-45` — `MULTER_TEMP_DIR` + runtime validation                                                                                                                                                                   | Already present                                                                                   |
| `84adb5453` OpenAI 500 because `response_format` sent to gpt-image                     | API bug      | `common/chat/imageGenCore.ts:304-305,498` — never sent to gpt-image arms                                                                                                                                                                         | Already present (our shape differs: one core, not per-adapter)                                    |
| `0d7ffdf12` stale service worker serves poisoned scripts                               | White screen | `public/sw.js:95` — `networkFirst`                                                                                                                                                                                                               | Already present                                                                                   |
| `68a6ab005` symlink escapes in extension path confinement                              | Security     | `extensions/sandbox/pathSafety.ts:39` — `realpathSync.native` canonicalizes both sides                                                                                                                                                           | Already present                                                                                   |
| `5e5995b12` markdown sandbox `startsWith` bypassed by `..` segments                    | Security     | **N/A** — we have no local-file resolution; every link goes to `openExternalUrl`, which allowlists https/http/mailto/wayland and rejects `file:` (`utils/platform.ts:125`); we also strip `file://` from markdown text (`Markdown/index.tsx:50`) | Structurally impossible                                                                           |
| `efc94e464` percent-encoded href bypasses local-file checks                            | Security     | **N/A** — same reason                                                                                                                                                                                                                            | Structurally impossible                                                                           |
| `384265149` config migration overwrites user prefs every restart                       | Data loss    | **N/A** — Electron→Rust-backend migration only                                                                                                                                                                                                   | Out of scope                                                                                      |
| `5f808f05b` close-to-tray ignored on custom title-bar close                            | UX           | Our bridge calls `window.close()` (`windowControlsBridge.ts:70`), which fires the `close` event intercepted at `index.ts:844-850` and hides when close-to-tray is on                                                                             | Does not reproduce — one choke point covers both paths                                            |

**Result: 10 already present, 3 not applicable, 1 does not reproduce, 0 reproducing.**

One residual worth a line, not a TAKE: our `windowControls.close` uses `getFocusedWindow()` and
no-ops if focus is lost (`windowControlsBridge.ts:68-71`); upstream added a first-live-window
fallback. A dead click, not data loss.

### 3.3 Unannounced feats (205) — nothing new rises to TAKE

118 non-team unannounced feats read. The bulk are the assistant/settings IA rework, backend-migration
plumbing, channel `agent_type` support, and Sentry tagging. Cross-checked against our source:

- `45d26f9d8` context-usage visualisation → we have `ContextUsageIndicator.tsx`.
- `08ca2230f` disable individual local agents → we have `AgentSettings/LocalAgents.tsx`.
- `14e189e0f` filename search + chat-ref (landed **in v2.1.44 itself**, unannounced) → we have
  conversation search (`ConversationSearchPopover.tsx`, `SiderSearchEntry.tsx`, `searchConversations`
  in `SqliteConversationRepository`/`databaseBridge`) **plus** a cmdk command palette. Their delta is
  filename matching on top — marginal.
- `b2eb762df` open local markdown links in Preview → the feature underlying the two security bugs
  above. **DECLINE** (see §8).
- `7fd40c790` min window width 800 → 375; `6aec0385d` default zoom 0.9 + persisted bounds → cosmetic,
  and our layout has diverged.

### 3.4 New actionable finding: orphaned pet assets ship in every build

`public/pet-states/` holds 21 SVGs + `preview.html`. **Verified: zero references anywhere** in
`src/`, `scripts/`, `electron-builder.yml` or `package.json` — the desktop-pet feature was never
wired in our tree. Yet the assets ship **twice** in every artifact: `electron-builder.yml:24` includes
`public/**/*`, and `electron.vite.config.ts:156` sets `publicDir: resolve('public')`, copying them
again into `out/renderer`.

So we carry dead weight that is partly byte-identical to upstream and carries no attribution. This is
a **deletion**, not a take — and a concrete input for WLD-I (flagged, not chased).

---

## 4. Bug fixes from the release-note pass — verified NOT reproducing

Unchanged from the first pass; **every row verified against our source**, and two were independently
re-confirmed by the commit sweep (`8523ba3ac`, `68a6ab005`).

| Upstream fix                                         | PR      | Our code                                                                                     | Verdict                                                                                                                |
| ---------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| macOS mic dead under hardened runtime                | #3294   | `entitlements.plist:15` + `electron-builder.yml:289-294`                                     | Already fixed                                                                                                          |
| OpenAI SDK given `api_key` not `apiKey`              | #3512   | `common/api/OpenAIRotatingClient.ts:41`                                                      | Never had it                                                                                                           |
| `aion.storage` reachable without manifest permission | #1803   | `extensions/sandbox/permissions.ts`                                                          | Already fixed, richer model                                                                                            |
| Symlink escapes in path confinement                  | #2087   | `extensions/sandbox/pathSafety.ts:39`                                                        | Already fixed                                                                                                          |
| Destructive DB recovery on transient init errors     | #2571   | `services/database/index.ts:183`; quarantines to `.corrupt.<ts>` at `:194`                   | Already fixed, **stronger**                                                                                            |
| Windows `EPERM` — driver open during recovery        | #2214   | `services/database/index.ts:161`                                                             | Already fixed                                                                                                          |
| Scheduled tasks lost local timezone                  | #3056   | `services/cron/CronService.ts:616,902`                                                       | Already fixed                                                                                                          |
| Installer mutated registry before arch check         | #3619   | `resources/windows-installer-arm64.nsh` — `.onVerifyInstDir` runs before the install section | Correct by construction                                                                                                |
| Spellcheck noise in prompt inputs                    | #2272   | `chat/sendbox.tsx:1604`                                                                      | Already fixed                                                                                                          |
| Tray left-click did not toggle                       | #3726   | `process/utils/tray.ts:217`                                                                  | Already fixed                                                                                                          |
| No turn-complete notification when unfocused         | #3715   | `services/notifications/taskCompletionNotifier.ts` (#579)                                    | Already fixed, **stronger** — quiet hours, sound, error/finished split, and it avoids the `ai_waiting_input` spam trap |
| Long URL overflows bubble                            | #3727   | `Messages/components/MessageText.tsx:344`                                                    | Already handled                                                                                                        |
| Overlapping scheduled runs pile up                   | v2.1.36 | `services/cron/CronService.ts:743` (#163)                                                    | Already fixed                                                                                                          |
| Per-model vision capability                          | #3639   | `utils/model/imageVisionGate.ts`, `modelCapabilities.ts`                                     | Already have                                                                                                           |
| Image avatars for custom agents                      | #3667   | `AssistantSettings/AssistantAvatar.tsx`                                                      | Already have                                                                                                           |
| Keyboard shortcut bindings                           | #3675   | cmdk palette (`components/cmdk/`)                                                            | Already ahead                                                                                                          |
| Visual cron schedule builder                         | #3552   | `cron/ScheduledTasksPage/CreateTaskDialog.tsx:66`                                            | Already have                                                                                                           |

Also already present from the architecture-compatible window: Mermaid preview
(`Markdown/MermaidBlock.tsx`), reply/quote (`SelectionReplyButton`, `MessageList.tsx:626`),
`@` file mention (`utils/file/workspaceMentions.ts`), Agent Hub (`extensions/hub/`), team mode
(`process/team/`, 45 files).

**Combined across both passes: 31 upstream fixes checked, 0 reproducing.**

---

## 5. Verified gaps

Three, all **verified against our source** by content grep across all of `src/`:

**a) No macOS wrong-architecture guard** (#3232 / AIO-64). `runningUnderARM64Translation|Rosetta` →
**zero hits** in `src/` and `scripts/`. A user who installs the Intel build on Apple Silicon gets a
confusing failure. We already guard this on Windows, so it is an asymmetry.

**b) No GPU-crash self-heal** (#2945 / ELECTRON-9A, 9D). `src/index.ts:797` handles
`render-process-gone` by **logging only**; our sole `disable-gpu` switch
(`process/utils/configureChromium.ts:44`) is scoped to WebUI/headless Linux and never fires on the
desktop path. Repeated GPU crashes leave a dead window with no recovery.
_Caveat (inferred):_ upstream shipped this against real Sentry IDs; I have no crash data of our own
confirming it bites us. Reachable in principle, unobserved in practice.

**c) No configurable font sizes** (#3223). `chatFontSize|fontSize.*(chat|markdown|code)` → **zero
hits**. We have theme plumbing (`ThemeContext.tsx`, `useColorScheme.ts`) but no text-size control.

---

## 6. We already have upstream's flagship feature, under another name

Upstream's best idea in this window is the **AionUi Butler** (v2.1.20) plus its v2.1.25 "via chat"
entry points. **We have the engine: the Concierge.** `common/chat/conciergeConfig.ts` implements
propose → confirm → apply over `provider_connect`, `set_default_model`, `add_mcp`, `edit_assistant`,
`file_bug_report`, with an explicit confirm card as the consent boundary
(`ConciergeConfigCard.tsx`) and secret hygiene upstream never claims — the key is entered in the card
and is _"never stored in the message, never sent to the model, never written to the chat DB."_ It is
pinned on the launchpad (`quickLaunchAnchors.ts`) and cannot be removed.

The commit sweep sharpened the real delta: upstream built a dedicated **entry-point layer** —
`d7f4cc1d0` (TalkToButler infrastructure), `b1f78d7a1` (wire "via chat" into create/add flows),
`e8499a2fa` + `5b232cd5a` (cron), `eeaeef90b` (bug report). **All four were unannounced.** That is the
gap: not the assistant, the affordance.

---

## 7. TAKE shortlist — ranked by user impact

Four takes and one delete. The commit sweep added no new takes; it added evidence for #1 and one
deletion. Everything here needs per-file provenance treatment under WLD-I — not done or re-litigated
here.

**1. Contextual "via chat" entry points for the Concierge** — _core-aligned, best value/effort_
Upstream #3446 plus the unannounced `d7f4cc1d0`/`b1f78d7a1`/`e8499a2fa`/`eeaeef90b`. We own the hard
part; what is missing is a "set this up by chat" action beside each manual surface that jumps home,
selects the Concierge, and pre-fills the prompt. Purest expression of "friction is the enemy" in the
whole delta, and for us it is wiring. **ADAPT** — their trigger points, our Concierge contract.

**2. macOS wrong-architecture startup guard** — _core-aligned_
#3232. Verified absent; we already do this on Windows. Contained. **TAKE** the concept, implement
against `app.runningUnderARM64Translation`.

**3. GPU-crash self-heal** — _core-aligned_
#2945. Count crashes, relaunch with GPU disabled. A dead window is the worst outcome for a user who
cannot read a log. **ADAPT** — their pattern, our bootstrap.

**4. Configurable font sizes** — _core-aligned, accessibility_
#3223. Independent chat / markdown / code sizes, live-applied and persisted. **TAKE** the concept
only; their implementation is entangled with a theme rewrite we should not import.

**5. DELETE `public/pet-states/` (22 files)** — _housekeeping_
Verified zero code references; ships twice per artifact; partly byte-identical to upstream with no
attribution. Removing it shrinks the package and removes an attribution surface. **DELETE.**

_Deliberately unpadded._ 953 unannounced commits produced **zero** new features worth taking and
**zero** reproducing bugs. That is the finding, not a gap in the search.

---

## 8. DECLINE list

| Item                                                                                 | One-line reason                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop Pet (v1.9.8-9, #2127)                                                        | A mascot, not a capability; a second always-on-top window with its own crash surface — upstream shipped 6+ follow-up fixes (#2170, #2179, #2193, #2212, `93c576e7d`, #3777). We already have the orphaned assets and none of the code; delete rather than finish. |
| Team-mode arc — **102 of 307 unannounced fixes**                                     | The single largest sink of upstream effort. We have our own (`process/team/`, 45 files). Adopting theirs means abandoning ours to chase a target now built on their Rust backend.                                                                                 |
| Local markdown file links opening in Preview (`b2eb762df`, #3379/#3396)              | The feature that produced two path-sandbox escapes (`5e5995b12`, `efc94e464`). Our allowlist design rejects `file:` outright and is safer by construction. Taking the feature means importing the attack surface.                                                 |
| Butler remote access via automatic Cloudflare tunnel (v2.1.20)                       | Putting a non-dev's local agent on the public internet through a tunnel we do not control is a liability, not a friction win.                                                                                                                                     |
| Conversation-scoped MCP (#3109)                                                      | Verified absent, but it turns one global toolset into N per-conversation toolsets — more config surface for a user who does not want to think about MCP. Our curated 110-entry catalog is the everyman answer.                                                    |
| 18 ACP registry agents (v2.1.38)                                                     | Each needs its own product CLI on PATH: 18 new ways for a non-dev to hit "command not found." Opposite of "one system to rule them all."                                                                                                                          |
| Project Explorer (#3763)                                                             | Still landing upstream; our workspace tree works.                                                                                                                                                                                                                 |
| WeChat / WeCom / Weixin / DingTalk channels                                          | Wrong market; we have WhatsApp/Telegram/Lark.                                                                                                                                                                                                                     |
| Aion CLI (`aionrs`) / AionCore / OfficeCLI / 3D Morph PPT / Snow / Hermes-as-backend | Upstream's own product stack; we have `wayland-core`.                                                                                                                                                                                                             |
| Kimi contributor campaign (v2.1.39)                                                  | Business development, not code.                                                                                                                                                                                                                                   |
| Persian (fa-IR) locale (#3284)                                                       | The only locale we lack (we ship 12, they 13). RTL layout work across the app, not a translation drop.                                                                                                                                                            |
| The entire post-migration adapter/ipcBridge/backend fix stream                       | **1,032 commits (58% of the range)** fixing glue that exists only because they split out a Rust backend. Not latent bugs in our tree.                                                                                                                             |
| All 31 fixes verified in §3.2 and §4                                                 | Checked against our source; already fixed, N/A, or structurally impossible. Several of ours strictly stronger.                                                                                                                                                    |

---

## 9. Verified vs inferred

**Verified against our source** (read the file, cited `file:line`): every row in §3.2 and §4; the
three gaps in §5; the Concierge finding in §6; the orphaned-assets finding in §3.4 (including that
`public/**/*` ships and Vite re-copies it).

**Verified against upstream git** (real history, `rtk proxy`): the 1,784-commit range; the
651/337/119/8 classification; the 800 cited PR numbers and the 953-commit unannounced set; the
752/1,032 pre/post-migration split via set intersection against the archive snapshot; `9aaf742be`
introducing `pet-states` and not being an ancestor of `v1.9.5`; the disjoint-history result.

**Inferred, flagged as such:** _why_ our tree contains post-v1.9.5 content (later snapshot vs.
manual porting) — WLD-I's question, not answered here. That the GPU-crash class is reachable in our
build — plausible on shared Electron surface, but I have no crash data of our own. That the
`getFocusedWindow()` no-op in `windowControlsBridge.ts:68-71` is user-visible — reasoned from code,
not reproduced.

---

## 10. Bottom line

With real history the picture gets sharper, and one of my own numbers gets corrected: **58% of the
1,784-commit delta is architecturally unreachable**, not the ~70% the release-note view implied. The
direction held; the magnitude did not, and counting releases was the wrong instrument.

Sweeping the **953 commits upstream never announced** — the seam most likely to hide risk — produced
**zero reproducing bugs**. Of 14 candidates read in full, 10 were already in our tree (several
byte-identical), 3 were not applicable, 1 was designed out. Together with the release-note pass that
is **31 upstream fixes checked, none reproducing.**

The reason is now concrete rather than lucky: **our tree is not a stale v1.9.5 snapshot.** It carries
upstream content from at least v1.9.8 (`pet-states`, absent from v1.9.5, partly byte-identical here),
and it already contains post-fork fixes we would otherwise have "discovered" as gaps. That is a
provenance question for WLD-I; for parity it means the effective delta is smaller than any tag diff
suggests, and that per-item source reads — not fork-point reasoning — are the only safe method.

Net output stays small and specific: **four takes and one delete**, the most valuable of which is not
new machinery but discoverability for the Concierge we already built.
