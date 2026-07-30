# WLD-H attribution packet — cross-audit findings

> ## ⛔ READ THIS FIRST — the audit found a systemic Apache-2.0 §4(c) exposure
>
> **~310 of our `src/` files appear to be AionUi-derived and carry only a Ferrox Labs copyright.**
> Codex found the proof case; I measured the scope. This is not the packet's fault — it is
> pre-existing and it predates every commit here — but it makes this packet's central premise
> ("we are trimming attribution to what is owed") the wrong frame, and it **must not merge as a
> compliance packet** while this is open.
>
> **The proof case.** `src/common/electronSafe.ts` vs AionUi
> `packages/desktop/src/common/electronSafe.ts`: **100% of substantive lines identical, 34/34
> distinctive identifiers shared.** An unmodified copy. The only difference in the header is
> `Copyright 2025 AionUi (aionui.com)` → `Copyright 2026 Ferrox Labs`.
>
> **The scope.** AionUi's tree has 1,324 distinct `.ts`/`.tsx` paths; **445 of them exist at the
> same path in our `src/`**. A deterministic 23-file sample of those 445:
>
> | literal overlap with AionUi `main` | files | reading |
> | --- | --- | --- |
> | ≥50% | 16 | clearly derived |
> | 20–50% | 6 | likely derived |
> | <20% | 1 | diverged |
>
> Six sampled files are ≥88% and three are 100%. Extrapolated, **~310 of the 445 are derived**.
> `git grep -c "Copyright.*[Aa]ion[Uu]i" -- src` returns **0**.
>
> This is a **lower bound**: the comparison is against AionUi's *current* `main`, which has drifted
> since our fork, so overlap at the fork point was higher.
>
> **This refutes my own earlier recommendation, which was wrong.** `H-FINDINGS.md` and my session
> memory say the AionUi §4(c) item "cannot be fixed mechanically — fork point unrecoverable" and
> recommend "keep the prominent shipped notice, accept residual strict-§4(c) risk." Both halves are
> wrong. It *is* mechanically discoverable — I just enumerated the candidate set from the upstream
> tree API in three commands. And "accept residual risk" is defensible for a diffuse concern, not for
> ~310 files where the upstream copyright line was replaced with ours.
>
> **Needs Sean, and possibly counsel.** The remedy is a restoration sweep over the derived set, not a
> notices-file edit. Nothing below should be merged as "the attribution fix" while this stands.

Audit of `packet/attribution-audit` (15 commits, `15d6740aa..538656b1b`) before any merge.
Panel: Codex 5.6 Sol, Gemini 3.1 Pro, Kimi K3, internal `ferrox-code-reviewer`, plus my own
verification pass. Nothing pushed.

**Verdict: FIX-FIRST.** The packet's code changes are sound and the functional scan is clean,
but the shipped notices file carries four false factual claims (three pre-existing, one I
introduced), one earned attribution was missed, and one unearned attribution survives.

## Method note — why eyeballing headers was not enough

Provenance verdicts here are measured, not read. For each claimed adaptation, literal
substantive-line overlap against the **checked-out upstream pin**, calibrated with controls:

| comparison                                    | overlap | reading            |
| --------------------------------------------- | ------- | ------------------ |
| `backoff.ts` vs `src/infra/backoff.ts`        | **80%** | positive control   |
| `web-search.ts` vs gemini-cli upstream        | 33.8%   | derived (attributed) |
| `web-fetch.ts` vs gemini-cli upstream         | 18.4%   | derived (NOT attributed) |
| `baileys.js` vs `whatsapp/src/session.ts`     | 6.1%    | derived (10 identical lines + verbatim regex) |
| `TunnelManager.ts` vs `voice-call/src/tunnel.ts` | 1.1% | one Tailscale call — not derived |
| Discord trio vs **entire** discord extension  | 0–3.7%  | boilerplate only — not derived |
| `webhookExposureGuard.ts` vs unrelated file   | 0%      | negative control   |

Scripts: `litcmp2.py`, `maxoverlap.py` (scratchpad `xaudit-attribution/`).

⚠️ Two traps this pass hit and future passes will hit again:
1. **A non-recursive listing of `src/process/agent/gemini/cli/` returns 13 files and there are
   exactly 13 Google-headered files.** The coincidence reads as "13/13 clean". It is 21 files
   and 8 are unheadered. Always `find -type f`, never `ls`.
2. **Anchored regexes (`^WCORE_[A-Z_]+$`) over `strings` output on a Rust binary return 0**
   because the string table concatenates entries (`WCORE_MEMORY_DIRAIONRS_MEMORY_DIR`). A zero
   from an anchored grep is a method artifact, not evidence. Confirm the method finds a known
   positive before believing a zero.

## Findings

### 1. CRITICAL — false Section 4(d) claim in the shipped notices file (I introduced this)

`notices/THIRD-PARTY-NOTICES.md:9` (added by me in `8d9550c93`):

> None of the Apache-2.0 upstreams below distributes a NOTICE file, so Apache-2.0 Section 4(d)
> imposes no further attribution obligation.

`iOfficeAI/OfficeCLI` **does** distribute one — `api.github.com/repos/iOfficeAI/OfficeCLI/contents/NOTICE`
returns 200, and it reads: *"This NOTICE file is part of the required attribution under Section 4
of the Apache License, Version 2.0. Redistributions of this work, with or without modification,
must retain this notice."* AionUi, aionrs and gemini-cli each 404, so the sentence is right about
three of four and wrong about the one that matters. Gemini flagged the same line by spotting that
the OfficeCLI entry lower in the same document contradicts it.

The obligation is met in substance (`notices/OfficeCLI-THIRD-PARTY-NOTICES.txt` reproduces the
copyright and maintainer and it ships). The sentence is what is false.

**Fix:** scope the sentence to AionUi / aionrs / gemini-cli, state that OfficeCLI ships a NOTICE
whose attribution notices are reproduced, and ship the upstream NOTICE verbatim as
`notices/OfficeCLI-NOTICE.txt` (already inside a packaged directory, no builder change).

### 2. CRITICAL — two false Section 4(b) modification claims (pre-existing, root commit `2b3b60e11`)

`notices/THIRD-PARTY-NOTICES.md:48-49`:

> - Default config file renamed (`.aionrs.toml` to `.wcore.toml`).
> - User config directory renamed (`~/.aionrs` to `~/.wcore`).

Verified against the **shipped** engine binary `resources/bundled-wayland-core/darwin-arm64/wayland-core`:
`wcore` appears 605 times but **`.wcore` never appears as a path at all**. The real names are
`.wayland-core.toml` (file form) and `.wayland-core/config.toml` (dir form) — the binary carries
the disambiguation warning string *"both .wayland-core.toml and .wayland-core/config.toml exist;
using .wayland-core.toml (file form)"*. `src/process/agent/wcore/index.ts:56` says so explicitly:
"engine reads `.wayland-core.toml` (file form) — NOT `.wcore.toml`".

The other three sub-claims in that list are TRUE: crates are `wcore-*`, the binary is
`wayland-core` (`aionrs` appears twice), and `WCORE_MEMORY_DIR` / `WCORE_SESSION_ID` /
`WCORE_SKILL_DIR` each sit adjacent to their `AIONRS_*` alias in the string table.

Not introduced by this branch, but this branch rewrote that entry and `8d9550c93` claims to have
verified it, so it is ours to fix.

**Fix:** `.wayland-core.toml` and `~/.wayland-core`.

### 3. CRITICAL — Apache-2.0 §4(c) gap: `web-fetch.ts` (pre-existing)

`src/process/agent/gemini/cli/tools/web-fetch.ts` carries only `Copyright 2026 Ferrox Labs` yet
shows **18.4%** literal overlap with gemini-cli's `packages/core/src/tools/web-fetch.ts` — 14
identical lines including `const URL_FETCH_TIMEOUT_MS = 10000;`, `export interface WebFetchToolParams`,
`import { convert } from 'html-to-text';` and `protected createInvocation(`. Kimi independently
found the same file and added a second identical constant, `MAX_CONTENT_LENGTH = 100000`. Its
sibling `web-search.ts` shows 33.8% overlap and **does** carry the Google header — that asymmetry
is what exposed it.

Removing an upstream copyright notice from a derivative work is exactly what §4(c) forbids.

The notices claim at line 31-32 ("Source under `src/process/agent/gemini/cli/` derives from Gemini
CLI and retains the original `Copyright 2025 Google LLC` headers") is therefore false as a blanket
statement: the directory is 21 files, 13 headered, 8 not. Of the 8, seven are Ferrox originals
(each probed 404 upstream; `mcpServerCwd.ts` cites our own issue #755, `oauthTokenManager.ts` and
`streamResilience.ts` are Ferrox OAuth work, `tools/index.ts` is a barrel export) — only
`web-fetch.ts` is derived.

**Fix:** restore the `Copyright 2025 Google LLC` header on `web-fetch.ts`, and reword the notices
claim so it covers the derived files rather than the whole directory. Minor, same file set:
`utils/geminiSchemaFilter.ts` carries no SPDX header at all.

### 4. HIGH — earned attribution missed by the normalization pass: `baileys.js`

`src/process/channels/whatsapp-bridge/backends/baileys.js` header reads
`Copyright (c) 2025 OpenClaw contributors` — matching neither `LICENSES/openclaw.txt` nor the
notices entry (both say Peter Steinberger for the pinned revision) — and carries **no
`LICENSES/openclaw.txt` pointer and no pin**.

The attribution is **earned**: 10 identical lines vs `extensions/whatsapp/src/session.ts`, 4 vs
`auth-store.ts`, and a verbatim `const WHATSAPP_LID_RE = /@(lid|hosted\.lid)$/i;` vs `identity.ts`.

Root cause: my pass keyed on the phrase "adapted from OpenClaw". This tree has **six** header
dialects — `adapted from OpenClaw (url)` ×19, `adapted from OpenClaw <url>@pin` ×8,
`derived from OpenClaw's discord extension` ×3, `Ported from OpenClaw's ...` ×3,
`Harvested from openclaw/...`, `Adapted from openclaw/...`. Two were normalized; four were not
even looked at.

⚠️ **Fixing this file requires re-pinning `scripts/whatsapp-bridge-source.json`** or every
packaged build fails.

**Fix:** normalize the header to the same form as the other 27, then re-pin.

### CORRECTION — two of my own verdicts below were WRONG. Read this first.

Findings 5 and 6 as originally written are superseded. Both errors came from the same cause:
**literal-line overlap detects copy-paste but not a port.** A rewritten port shares no lines and is
still a derivative work. The internal reviewer caught it; Gemini had flagged it and I wrongly
dismissed Gemini.

The metric that actually discriminates is **shared hand-authored identifier names**, with one
essential refinement learned the hard way below:

| shared vocabulary                                        | signal |
| -------------------------------------------------------- | ------ |
| third-party API names (`GuildVoiceStates`, `joinVoiceChannel`, `MessagingApiClient`, `chat_guid`) | none — any independent implementation uses them |
| hand-authored helper names (`getTailscaleDnsName`, `resolveSignalCliPath`, `sanitizeIrcTarget`) | strong |
| names that appear only as an **import + call site** of a helper defined in an *attributed* sibling | none — the notice belongs on the definition |

Calibration: a Ferrox-original file shares 17/38 identifiers with an unrelated upstream extension,
so raw share-rate alone proves nothing. Judge the *content* of the shared set.

### 5. SUPERSEDED — the Discord trio: UNVERIFIED, do NOT strip

Originally rated HIGH unearned-attribution with a recommendation to strip. **Withdrawn.**

Line overlap is 0–3.7% against the entire upstream extension, but distinctive-identifier overlap is
29/53, 25/43 and 69/142. Nearly every shared name is discord.js API surface — `GuildVoiceStates`,
`GuildMessageReactions`, `MessageContent`, `Intents` (GatewayIntentBits members), `joinVoiceChannel`
and `adapterCreator` (from `@discordjs/voice`), `messageReference`, `globalName`, `webhookId`,
`createdTimestamp` (discord.js fields). Any independent Discord adapter uses these. But the
negative control shares 45% too, so this evidence cannot settle it either way.

**Verdict: UNVERIFIED.** The risks are asymmetric — wrongly stripping a notice creates a live MIT
breach, wrongly keeping one grants credit we did not owe, which carries no liability. So the
attribution **stays**. Fix only the internal inconsistency: the headers credit
`Copyright OpenClaw contributors` with no pin and no `LICENSES/openclaw.txt` pointer.

### 6. SUPERSEDED — the tunnel trio: attribution IS OWED (I had this backwards)

Originally rated MEDIUM "overstates provenance, reword". **Wrong.** These are ports and the notice
is owed. My error was comparing `TunnelManager.ts` only against `extensions/voice-call/src/tunnel.ts`
— what `find -name tunnel.ts` returned — when the upstream logic is spread across sibling files in
that extension.

Evidence (internal reviewer's, which I reproduced and confirmed):

- Upstream `voice-call/src/webhook/tailscale.ts:52` `export async function getTailscaleDnsName(): Promise<string | null>`
  vs ours `TunnelManager.ts:256` `async function getTailscaleDnsName(): Promise<string | null>` —
  same distinctive hand-authored name, same signature. Not an API name from any library.
- Same trailing-dot strip `.replace(/\.$/, "")`.
- Upstream `runNgrokCommand(["config", "add-authtoken", …])` vs ours `runOnce('ngrok', ['config', 'add-authtoken', authToken])`.
- 34/73 distinctive identifiers shared, including `ngrokAuthToken`, `funnel`, `dnsName`, `startTunnel`,
  and the lowercase argv form `authtoken`.
- `webhookExposureGuard.ts` 20/38 shared including the `twilio`/`telnyx` provider pair its own comment
  names; `WebhookExposureService.ts` 19/54 including `tunnelProvider`, `publicUrl`, `ingress`.

All three carry **no MIT notice, no holder, no pointer**, and are absent from the notices list. Worse,
in all three the provenance sits in a **second comment block with no `@license`** — byte-for-byte the
Rollup-stripping shape that `485b212ff` fixed for eight other files, so it is dropped from every build.

**Fix:** add proper normalized OpenClaw headers to all three and add the tunnel subsystem to the
notices entry. Same treatment for `src/process/channels/types.ts:13` ("Lifted concept from OpenClaw
`src/channels/plugins/outbound.types.ts` (MIT)" — names MIT but no holder and no path).

### 5-original (superseded, retained for the record) — the Discord trio

`DiscordAdapter.ts`, `DiscordActions.ts`, `DiscordPlugin.ts` each claim derivation from named
upstream files (`normalize.ts`, `outbound-adapter.ts`, `client.ts`, `actions/runtime.moderation.ts`)
and credit `Copyright OpenClaw contributors`. Measured against the **entire** upstream discord
extension, not just the named files:

- `DiscordActions.ts` — **0 identical lines against every file in the extension**
- `DiscordAdapter.ts` — 2 lines, `const chunks: string[] = [];` and `while (remaining.length > limit) {`
- `DiscordPlugin.ts` — 1 line, `for (const chunk of chunks) {`

Identifier overlap for the largest pair is 23 of 411 tokens and every one is generic (`string`,
`export`, `return`, `discord`, `config`). Against an 80% positive control this is not a derivative
work; the matched lines are uncopyrightable boilerplate.

The notices OpenClaw entry names **Discord** among the adapted integrations — asserting in a
shipped legal document that we incorporated MIT code we did not. Same bucket as the 11 files
stripped in `9add51a0c`, adjudicated by the same method.

**Note — the panel split here.** Gemini rated this CRITICAL under-attribution and recommended
*adding* MIT headers plus listing the tunnel files in the notices. It reasoned from our own
comment text without checking upstream. Taking our comments at face value is precisely what
produced the original over-attribution this packet exists to fix, so the measurement governs.

**Fix:** strip the three headers, drop Discord from the OpenClaw entry.

### 6. MEDIUM — the tunnel trio overstates provenance

`TunnelManager.ts:11` "Ported from OpenClaw's `tunnel.ts`" — 1.1% overlap (a single
`const dnsName = await getTailscaleDnsName();`). `webhookExposureGuard.ts:10` cites
`webhook-exposure.ts`, which **does not exist at the pin**. `WebhookExposureService.ts:11` cites
`runtime.ts ~424-457`.

No obligation, and their absence from the notices list is correct. But the words "Ported from"
invite a future reader (or auditor — Gemini did exactly this) to conclude we have an unmet MIT
obligation.

**Fix:** reword to design lineage, consistent with the treatment in `9add51a0c`.

### 7. MEDIUM — the packet's own accounting is wrong

`485b212ff` says "Ten files" and "the 31 files that happen to have the same text pasted INSIDE
their @license block". The tree says **8 folded** and **20 already surviving**. True accounting:
base carried 39 headers in the "adapted from" dialect, 11 stripped → 28, of which 8 name an
explicit `Source:` path and 20 are blanket. Plus 3 Discord and 3 tunnel in other dialects.

The wrong figures propagated into `H-FINDINGS.md` and the session memory. No history rewriting, so
the commit message stands and the correction lives here and in `H-FINDINGS.md`.

Kimi also found `electron-builder.yml`'s comment claims "31 source headers cite
`LICENSES/openclaw.txt`" where the real count is 30 (28 under `src/`+`scripts/`, 2 under `tests/`).

## Additional findings from the panel (Kimi K3 + internal reviewer)

### 8. HIGH — `3f1c5ba10` deleted third-party provenance on an unevidenced assertion (internal)

That commit removed clauses naming acpx, Zed, Codex CLI, Claude Code, NocoBase, Figma and Cherry
Studio from 8 files, justified by one sentence: *"None of these upstreams has code in this repo."*
No per-file diff was produced — while `9add51a0c` gave a per-file upstream comparison for all 11
OpenClaw removals. **Two evidentiary standards in one branch, and the weaker one was applied to the
upstreams nobody audited.**

Three deleted clauses were specific enough to matter:
`ApprovalStore.ts:10` "inspired by Codex CLI's ApprovalStore" (Apache-2.0);
`IAcpClient.ts:11` "acpx's AcpClient and Zed's AcpConnection" (**GPL-family** — the one with real
teeth); `cronSkillFile.ts:62` "Mirrors Claude Code's parseTaskFileContent()" (closed source, so
undiffable, which is exactly why the comment had value).

It is also not internally consistent: `Modeled after Claude Code's team leader prompt` survives at
`leadPrompt.ts:20` and `teammatePrompt.ts:31`.

**UNVERIFIED** whether any code was copied. The branch did not determine it either — it deleted the
pointer. **Needs Sean:** restore the clauses pending verification, or fund the adjudication.

### 9. HIGH — `notices/README.md` ships, is stale, and states a falsehood (internal)

`electron-builder.yml` ships the whole `notices/` directory. That README says the Apache text is kept
*"solely to satisfy the attribution terms of the AionUi and aionrs upstreams"* — false once this
branch added Gemini CLI, and the ship set includes OfficeCLI. It calls the notices file "Apache-2.0
attribution" when it now covers four MIT upstreams, lists 2 of 5 files, and never mentions the newly
shipped `LICENSES/`. The branch never touched it.

### 10. MEDIUM — pptx2json is not "vendored verbatim" (Kimi)

`notices/THIRD-PARTY-NOTICES.md:80`. Against upstream tag `v0.0.10`: `index.js` was converted
CJS→ESM, reformatted, given a vendoring header, dropped an unused import, and carries **a real code
change** — upstream's `if (!PresentationXML in json)` corrected to `if (!(PresentationXML in json))`.
`index.d.ts` is locally authored (404 upstream). Holder, year, release and licence are all correct;
"verbatim" is not. Also resolves finding M-4's UNVERIFIED release number: the tag exists and 0.0.10
is right.

### 11. MEDIUM — 7zip-bin "solely Windows" is inaccurate (Kimi)

The entry says Wayland bundles the Windows ARM64/x64 `7za.exe` *solely* for the NSIS recovery
extraction. True of the recovery flow, but the packaged app also ships macOS and Linux `7za` from the
same package under `Resources/app.asar.unpacked/node_modules/7zip-bin/`, and `patches/7zip-bin@5.2.0.patch`
deliberately keeps the bundled mac `7za` in use. Same MIT licence so exposure is low, but the shipped
description of what we bundle is wrong.

### 12. MEDIUM — misc claim corrections

- `electron-builder.yml:118` "31 source headers cite `LICENSES/openclaw.txt`" — actual **30** (28 in
  `src/`+`scripts/`, 2 in tests that never ship). Kimi and internal agree.
- `notices/THIRD-PARTY-NOTICES.md:70` "the path the per-file headers cite" is false for the Discord
  trio and `baileys.js`, which cite no path.
- `notices/THIRD-PARTY-NOTICES.md:113` "SHA-256 digest published by GitHub" misdescribes the control:
  `scripts/prepareOfficeCli.js` verifies against the checked-in `bundled-officecli-shasums.json`; no
  live GitHub fetch exists. Kimi confirms the *values* are byte-identical to GitHub's published
  SHA256SUMS, so it is the fetch path that is misdescribed.
- `scripts/install-signal-cli.mjs` carries a full OpenClaw header but is missing from the notices
  entry's "the affected set is" enumeration (internal, M-2).
- `src/process/agent/gemini/cli/utils/geminiSchemaFilter.ts` has no SPDX header at all.

### 13. BORDERLINE — needs Sean's call (Kimi)

`src/process/channels/plugins/tier1/whatsapp/WhatsAppPlugin.ts:258-271` says "Mirrors OpenClaw's
`reconnect.ts` shape" and its constants (2000 / 30000 / 1.8 / 12) are **identical** to upstream's
`DEFAULT_RECONNECT_POLICY`. Code is rewritten inline. By this repo's own standard — `SynologyChatAdapter`
kept a header for a single identical payload string — this arguably earns one.

### Panel disagreement worth recording

On `notices/THIRD-PARTY-NOTICES.md:59-60` ("© 2026 OpenClaw Foundation; portions © 2025 Peter
Steinberger, the copyright holder recorded in the revision Wayland adapted"), the internal reviewer
rated it HIGH — the Foundation appears nowhere at the pin. Kimi checked the same facts and rated it
**clean**, because the sentence explicitly distinguishes current holder from holder-at-pin. Kimi's
read is the more careful one; treat this as a wording improvement, not a falsehood.

Kimi also corrected an error in my own audit framing: the identical `payload=` line I attributed to
`NextcloudTalkAdapter` actually belongs to `SynologyChatAdapter`, **which kept its header**. Upstream
match confirmed near-verbatim at `extensions/synology-chat/src/client.ts:242-256`.

## The 11 removals are SOUND — verified three ways

This was the highest-stakes open question: if any of the 11 was derived, this branch created an MIT
breach. All three independent routes agree they are correct.

Kimi adjudicated all 11 against the pin: WebhookAdapter (upstream has no outbound HMAC signing at
all), the three verifiers (different libs, endpoints and constructions), IrcPlugin (`irc-framework`
vs upstream's hand-rolled net/tls), NextcloudTalk ×2 (OCS REST vs ActivityPub webhook), SignalPlugin
(upstream's only mention is a TODO saying it is *not* ported), LinePlugin, ImessagePlugin.

My own structural re-check raised a false alarm worth recording as a method lesson: `SignalPlugin.ts`
shares `resolveSignalCliPath` and `IrcPlugin.ts` shares `sanitizeIrcTarget` / `IrcPrivmsgEvent` with
upstream — hand-authored names, which normally convict. But in our tree those are **defined in
`SignalDaemon.ts` and `IrcAdapter.ts`, both of which retain their attribution**; the stripped files
only import and call them. The notice belongs on the definition, not every consumer. Likewise the
webhook family: we use Node's built-in `timingSafeEqual` where upstream hand-rolled its own
`timingSafeEquals`, and a different Microsoft endpoint (`openidconfiguration` vs `keys`).

## Confirmed clean

- **Functional scan of the full 3,719-line diff (Kimi):** no behaviour changes, renames fully
  propagated, `migrations.ts` touched only a comment, no test loosened, `AIONRS_VERSION` removal safe.
- **Packaging (Kimi + Gemini):** `extraResources` paths all resolve — `notices/`, `LICENSES/`,
  `src/vendor/pptx2json/LICENSE`, `whatsapp-bridge/`; bridge re-pins match recomputed sha256/size.
- **`migrations.ts` SQL literals (Gemini):** the ~25 `aionrs` strings were not tampered with.
- **`foundry-skills` (Gemini):** preserved untouched.
- **OfficeCLI update disabling (Gemini):** `OFFICECLI_SKIP_UPDATE=1` at `src/process/utils/shellEnv.ts:701`
  does what the notice claims.
- **Rollup retention (Gemini):** the folded `@license` blocks are legal comments and survive.
