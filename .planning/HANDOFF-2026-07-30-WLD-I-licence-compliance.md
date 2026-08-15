# HANDOFF 2026-07-30 — WLD-I Licence Compliance + top_p P1

**Work location:** `~/dev/wayland-worktrees/packet-attribution`, branch `packet/attribution-audit`,
stacked on PR #925 (base `15d6740aa`). **9 commits, NOTHING PUSHED.** Tree clean except
`AGENTS.md`, which IJFW tooling auto-modified mid-session (project-detection frontmatter) — not
mine, deliberately uncommitted.

**No merge, no tag, no push without Sean.** `build-and-release.yml` fires on ANY tag.

---

## 1. THE HEADLINE FACT

Wayland desktop is a rebranded derivative of **AionUi v1.9.5** (tag `5b2c741f92`, 2026-04-01 —
**Sean supplied this; it is the authoritative fork point**). Root commit `2b3b60e11` (2026-06-07)
is a squashed 6,245-file import.

Measured against v1.9.5 and committed as
`.planning/phases/WLD-I-licence-compliance/AIONUI-INVENTORY.csv` (+ `inventory.py`, re-runnable
against any revision):

```
1005 same-path files   (730 src/, 275 outside src/)
DERIVED-HIGH 891 · DERIVED-LIKELY 90 · REVIEW 18 · DIVERGED 6
186 at 100% literal line overlap · 333 at >=90%
ZERO files carry an AionUi copyright notice
```

**981 derived files.** The defect is not omission — it is _substitution_: `@license` and the SPDX
line survived the import, only the ownership line was swapped to Ferrox Labs. That is what raises
17 U.S.C. §1202 (false copyright information) rather than a bare §4(c) condition breach.

⚠️ **Do not quote any other scope number.** Superseded: 445, 503, 550, ~310, 455, 1424, 1390.
Also wrong in the four dimension research files: 2615, 3966, 2316 (header counts), pin
`b97f34b28e`, revision `f37a6187`, root-commit date 2026-07-06 (it is **2026-06-07**).
Measured truth: `src/` has **2057** tracked `.ts/.tsx`, **1626** carry `@license` (79%),
**1650** declare SPDX Apache-2.0, **0** declare AGPL.

---

## 2. WHAT SHIPPED (9 commits, local)

| commit      | what                                                                               |
| ----------- | ---------------------------------------------------------------------------------- |
| `4a516002e` | Four-leg cross-audit record → `.planning/phases/WLD-H-attribution/H-CROSSAUDIT.md` |
| `ab675a9a3` | Milestone WLD-I opened (PROJECT.md + STATE.md via `state.milestone-switch`)        |
| `fc7939423` | First inventory (445 files) — **superseded**                                       |
| `d99c70b07` | **Retracted a false authorship claim I shipped that morning**                      |
| `b11f6ad87` | Inventory extended past `src/` (503) — **superseded**                              |
| `0aac367bc` | **Rebaselined on v1.9.5 → 981 derived. AUTHORITATIVE.**                            |
| `78329477f` | **Wave 0** — made the shipped notices true                                         |
| `2c0d1d203` | Research synthesized → `SUMMARY.md` with corrections applied                       |

**Wave 0 (`78329477f`), six files, zero source files:**

- `notices/Apache-2.0.txt` was **not a copy of the licence** — appendix placeholder overwritten
  with `Copyright 2026 Ferrox Labs`, plus a formatter reflow (315 diff lines). Replaced with
  verbatim text from apache.org. §4(a) needs "a copy of this License".
- Four false claims removed: the blanket §4(d) sentence (OfficeCLI **does** ship a NOTICE — 200 at
  tag `v1.0.136`); the enumerated §4(b) list containing the false `.wcore.toml` / `~/.wcore`
  claims; the blanket gemini-cli "retains the Google LLC headers" claim (13 of 21); "Every file
  containing adapted code carries its own attribution header".
- **§4(b) requires stating THAT files changed, not WHAT changed** — so the enumerated list was
  **deleted, not corrected**. Those false claims existed only because we volunteered a spec the
  licence never asked for.
- `notices/OfficeCLI-NOTICE.txt` NEW — upstream NOTICE verbatim. What shipped before paraphrased
  it and dropped the retention clause, the one sentence §4(d) exists to carry.
- pptx2json is not "verbatim" (CJS→ESM + a real bugfix); 7zip-bin not "solely Windows" (mac+linux
  `7za` ship — verified in the built app); OfficeCLI digests read from a checked-in file, not
  fetched from GitHub. `notices/README.md` rewritten.
- **`.prettierignore` now excludes `src/process/channels/whatsapp-bridge/`** — one reformat there
  breaks every packaged build via the sha256 pin. Verified oxfmt reads `.prettierignore` by default.

---

## 3. NEXT ACTION — the top_p P1 (fully diagnosed, NOT written)

**Symptom:** Gemini agent + `claude-sonnet-5` → `400 {"message":"`top_p` is deprecated for this
model."}`. Breaks every Claude 5 model. Sean's hypothesis (AionCLI's Anthropic path) was correct.

**Root cause chain, all verified:**

1. `node_modules/@office-ai/aioncli-core/dist/src/config/defaultModelConfigs.js` — gemini-cli code
   (`Copyright 2025 Google LLC`) — sets `topP: 1` on `base`, `topP: 0.95` + `temperature: 1` on
   `chat-base`.
2. `baseLlmClient.js:88` spreads `...generateContentConfig`, so those land in `request.config`.
3. `anthropicContentGenerator.js:278` — `buildSamplingParameters` falls back to
   `request.config?.topP`. **The leak is the FALLBACK side.** `configSamplingParams`
   (`getContentGeneratorConfig()?.samplingParams`) is the separate _explicit user_ setting.
4. `anthropicContentGenerator.js:50-51` spreads `temperature` and `top_p` into the request.

**Authoritative API rule (from the `claude-api` skill, not from memory):** `temperature`, `top_p`
and `top_k` are **all removed** on Fable 5 / Opus 5 / Sonnet 5 / Opus 4.7 / 4.8 — each returns 400.
NOT temperature-XOR-top_p (that is the older Claude 4.x rule, still true on Opus 4.6 / Sonnet 4.6).
Only `top_p` was flagged because `temperature: 1` **is** Anthropic's default and defaults are still
accepted, while `topP: 0.95` is non-default.

**THE FIX:** delete lines 50-51 of `anthropicContentGenerator.js` — stop sending `temperature` and
`top_p` to Anthropic entirely. Add a hunk to the existing
`patches/@office-ai%2Faioncli-core@0.30.6.patch` (wired via bun `patchedDependencies` in
`package.json:393-396`; it already patches `openaiContentGenerator.js`, so the mechanism is proven).
Then a regression test asserting neither key reaches the request.

**Two rejected alternatives, do not retry:**

- _Prefer `temperature` over `top_p`_ (my first proposal) — **fatal**: temperature is rejected too,
  so it trades one 400 for another. Gemini caught this.
- _Gemini's diff_ (drop the `configSamplingParams` branch, keep `request.config`) — **backwards**:
  keeps the leaking default and discards explicit user config.
- Model-name gating (`claude-*-5`) — rejected: this bug exists _because_ of a hardcoded model
  assumption; an allowlist rots identically.

**Closed gaps:** `generateContentStream` (line 65) just delegates to `generateContent`, so there is
exactly ONE request-build site. `top_k` is never forwarded. One hunk genuinely fixes it.

**Strategic finding:** `0.30.6` is the latest published version, nothing since **2026-04-20**,
because **AionUi dropped `@office-ai/aioncli-core` entirely** — its current version uses
`@anthropic-ai/sdk` `^0.71.2`, `@google/genai`, `openai`, `@agentclientprotocol/sdk` directly. The
patch is correct but temporary; the real fix is re-platforming onto official SDKs.

---

## 4. OPEN DECISIONS FOR SEAN

1. **The §4(c) counsel question — sizes the whole milestone.** _Does a central provenance manifest
   in the source tree satisfy Apache-2.0 §4(c), or must the notice sit in the file it was removed
   from?_ Decides whether restoration is **1 file or ~981**. Both STACK.md and ARCHITECTURE.md
   identify it independently. **§4(b) is per-file regardless**, so the sweep happens either way —
   the answer changes each header's content, not whether the sweep exists.
2. **Cleanup** — approved scope: one-worktree-root-per-repo, keep all repos. `~/dev` is 163GB with
   57GB free; `waylandcore` has 5-6 worktree roots (`-ferrox` 43GB, `-frontier-worktrees` 34GB)
   against your 2026-07-06 one-per-repo rule. **Plan for approval before any deletion.**
3. **AionUi delta milestone (WLD-J)** — v1.9.5 → v2.1.44 is ~4 months of upstream work. Both trees
   on disk. Sean wants it; `~/dev/resources` exists for it.
4. **`3f1c5ba10`** — deleted acpx / Zed / Codex CLI / Claude Code / NocoBase / Figma / Cherry Studio
   provenance from 8 files on ONE unevidenced sentence, while `9add51a0c` gave OpenClaw a per-file
   diff. acpx/Zed are **GPL-family**. Recommend reverting pending the same adjudication.

**Already decided — do not re-ask:** inventory before remedy (done); fold WLD-H into WLD-I, don't
merge it standalone; counsel on the remedy only, not the fact-finding; **do NOT contact AionUi**
(cure first — the obligation is to attribute, not negotiate); **Discord attribution STAYS**
(UNVERIFIED, and wrongly stripping creates a live MIT breach); leave the per-file
`SPDX-License-Identifier: Apache-2.0` alone.

---

## 5. FERROX PROCESS STATE — I went off-rails and partially recovered

Ran: context → goals → confirm → PROJECT.md → STATE.md → 4 researchers → synthesizer.
**Skipped `phases.clear`** deliberately (it archives every phase dir including WLD-H, which holds
this milestone's authoritative input).
**Then hand-rolled Wave 0 instead of `ferrox-plan-phase` → PLAN.md → `ferrox-executor`.** Sean
called this out; correct call.

**`ferrox-roadmapper` was running when context ran out** — writing the WLD-I section of
`ROADMAP.md` and REQ-IDs into `REQUIREMENTS.md`. **CHECK WHETHER IT LANDED.** Before this session
`ROADMAP.md` and `REQUIREMENTS.md` had ZERO mentions of WLD-I and `STATE.md` said
`total_phases: 0`. There is still no PLAN.md. Also mid-flight: the Codex leg of the top_p
cross-research (`scratchpad/xaudit-attribution/toppr-codex.txt`).

**Harness note:** the synthesizer's `Write` was blocked ("subagents should return findings as text")
— that is the #222-class failure the workflow anticipates. I persisted its verbatim output myself
and validated with `ferrox-tools verify-summary` (`passed: true`, all four markers, no sentinel).
Expect to do this again for any writing subagent.

---

## 6. METHOD — earned the hard way, do not skip

**Provenance verdicts must be MEASURED, with controls.** Scripts in
`scratchpad/xaudit-attribution/`: `litcmp2.py` (literal line overlap), `maxoverlap.py` (one file vs
a glob), `distinctids.py` (distinctive identifiers, comment-stripped), `inventory.py` (the
manifest), `forkpoint.py`. Upstream trees on disk: `oc/` (openclaw @ `aee2681a`), `aionui-195/`
(v1.9.5), `aionui/` (current main).

1. **Literal-line overlap detects copy-paste, NOT a port.** A rewritten port shares zero lines and
   is still derivative. This cost me two wrong verdicts.
2. **Shared third-party API vocabulary is NOT evidence** (`GuildVoiceStates`, `joinVoiceChannel`,
   `MessagingApiClient`, `chat_guid`). Shared **hand-authored helper names ARE**
   (`getTailscaleDnsName`, `resolveSignalCliPath`, `sanitizeIrcTarget`).
3. **A shared name appearing only as an IMPORT of a helper defined in an ATTRIBUTED sibling needs
   no notice** — the notice belongs on the definition. This produced a false alarm on the 11
   stripped files, which are all CORRECT (verified three ways).
4. **Always calibrate** with a known-adapted positive control and an unrelated negative control. A
   Ferrox original shares 45% of identifiers with an unrelated upstream.
5. **Never `ls` to verify a directory claim.** Non-recursive `ls` returned 13 of 21 files under
   `src/process/agent/gemini/cli` and 13 happened to be the count of correctly-headered files — it
   read as "13/13 clean". Use `find -type f`.
6. **Anchored regexes over `strings` on a Rust binary return 0** because the string table
   concatenates entries (`WCORE_MEMORY_DIRAIONRS_MEMORY_DIR`). Confirm a method finds a known
   positive before believing a zero.
7. **GitHub `search/code` indexes only the DEFAULT BRANCH** — only a pinned checkout is
   authoritative.
8. **`rtk` intercepts `git log` and silently truncated 18,151 commits to 50.** Use
   `rtk proxy git ...` or execFile for any enumeration. It also mangles `wc -l` output.
9. **REJECTED APPROACH — do not retry:** locating the fork point by maximising git blob-set
   intersection. Blob identity needs byte-identical files and the import rewrote headers
   throughout; run locally it gave a flat 223-256 shared blobs (~4%) with no peak.

**Comparing against upstream's CURRENT main is valid for INCLUSION, never for EXCLUSION.** AionUi
restructured into `packages/desktop/**` and dropped `src/process/agent`, which is why current-main
comparison undercounted by half. `DIVERGED` fell 20 → 6 on the correct baseline.

---

## 7. STILL-OPEN FINDINGS (not yet fixed)

- **`src/process/agent/gemini/cli/tools/web-fetch.ts`** — derived but carries only a Ferrox
  copyright. ⚠️ **My planned fix was WRONG:** it scores 95.8% against **AionUi**@v1.9.5, whose own
  copy carries an AionUi notice, while its sibling `web-search.ts` carries Google's. **For anything
  also present in AionUi@v1.9.5 the custody runs through AionUi, not the original upstream.** This
  invalidates the gemini-cli notices entry wholesale and needs its own phase BEFORE the sweep.
  `utils/geminiSchemaFilter.ts` has no SPDX header at all.
- **OpenClaw tunnel trio** (`TunnelManager.ts`, `webhookExposureGuard.ts`,
  `WebhookExposureService.ts`) + `channels/types.ts` — attribution **IS owed** (I originally said
  it wasn't; Gemini, Kimi and the internal reviewer were right). Shared hand-authored
  `getTailscaleDnsName` with identical signature, `ngrokAuthToken`, lowercase argv `authtoken`,
  34/73 identifiers. All three have NO MIT notice, and their provenance sits in a second comment
  block with no `@license`, so Rollup strips it. `webhookExposureGuard` cites
  `webhook-exposure.ts`, which **does not exist at the pin** — correct or delete that path.
- **`notices/README.md` / `Apache-2.0.txt`** are done, but `baileys.js` still credits "OpenClaw
  contributors" with no pin and no `LICENSES/openclaw.txt` pointer (attribution IS earned — 10
  identical lines vs `whatsapp/src/session.ts`, verbatim `WHATSAPP_LID_RE`). ⚠️ **Editing it
  requires re-pinning `scripts/whatsapp-bridge-source.json` in the SAME commit.**
- **144 → actually ~1,332 bundled prod npm packages** ship with no licence report (electron-builder
  ships the full transitive tree regardless of the `files` allowlist).
- **Pre-existing, unrelated:** `bun run dist:verify:mac` aborts in the OfficeCLI prepackage smoke.
  Workaround `WAYLAND_LOCAL_VERIFICATION=1 CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder
--mac --dir` → `out/mac-arm64/`. Wants its own issue.
- **Repo-wide, out of scope but real:** no pre-commit hook runs at all. `core.hooksPath=.husky/_`,
  the shim resolves the user hook to `.husky/pre-commit`, that file does not exist, so it `exit 0`s.
  lint-staged is configured at `package.json:376` and never invoked — so the secrets and
  AI-signature blocking is convention-only.

---

## 8. HARD CONSTRAINTS

One packet per PR · no bulk cleanup bombs · **no history rewriting, ever** · no AI signatures in
commits or PRs · **never run `prek run --all-files`** · `migrations.ts` `aionrs` SQL literals must
never change (persisted rows) · `FoundrySkills`/`foundry-skills` must never be renamed (2112 shipped
SKILL.md files) · never weaken the security shell or touch the signing pipeline · gh writes must be
**FerroxLabs** (drifts to TradeCanyon) · no backticks in gh/wl comment bodies · a **skipped**
required CI check counts as a **PASS** and `paths:` filters fire on ANY match.

**Foundry and Flow are Sean's OWN prior work** — first-party, no attribution owed, and they must not
appear in a third-party notices file.
