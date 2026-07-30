# WLD-H — Attribution audit: verified findings

**Status: investigation in progress, 2026-07-30.** Branch `packet/attribution-audit`.
Everything below was verified in the tree, with file:line. Nothing has been edited yet.

Supersedes parts of `H-BRIEF.md` — see §0 for the corrections.

---

## 0. Corrections to H-BRIEF.md

The brief was right that the ask does not survive contact, but it was wrong about two things and
missed a third file. Corrected here.

| H-BRIEF claim                                                              | Reality                                                                                                                                                              |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "`openclaw`/`hermes` are FUNCTIONAL. Do not touch them." (§1)              | **Half right.** The protocol/migration identifiers are functional. But there is also a large body of genuinely **MIT-licensed OpenClaw source** in the tree. See §3. |
| "There are TWO third-party notices files" (§4)                             | **There are THREE.** The brief missed `docs/legal/THIRD-PARTY-NOTICES.md`.                                                                                           |
| "The single genuine fork statement is `THIRD-PARTY-NOTICES.md:22,24`" (§2) | The real provenance statement is about **AionUi**, not aionrs, and the strongest wording sits in a file that **does not ship**. See §2.                              |

---

## 1. The actual provenance, established

Wayland desktop is a derivative work of **AionUi** (`github.com/iOfficeAI/AionUi`), Apache-2.0.
The Rust engine `wayland-core` is a separate fork of **aionrs** (same org), Apache-2.0.
The channels subsystem incorporates substantial **OpenClaw** source (MIT, © 2025 Peter Steinberger).

Outbound licensing is **AGPL-3.0** and is stated consistently in the two places that matter:

- `LICENSE` — 661 lines, `GNU AFFERO GENERAL PUBLIC LICENSE Version 3`. Zero occurrences of
  "Apache License".
- `package.json:6` — `"license": "AGPL-3.0-or-later"`.
- `readme.md:322` states the split correctly: app AGPL-3.0, engine Apache-2.0, "third-party
  attributions live in notices/".

**`readme.md` is clean.** It contains no fork/derivative confession, does not mention AionUi, and
lists OpenClaw and Hermes at `readme.md:216-217` as _supported integrations_ alongside their logos.
That is a feature list, not an attribution. Nothing to clean on the user-facing surface.

---

## 2. §4 RESOLVED — which notices file ships, and the defects in the other two

**Only `notices/` ships.** `electron-builder.yml:110-116`:

```yaml
extraResources:
  # Redistribution notices for bundled Apache/MIT components, including the
  - from: notices
    to: notices
```

`LICENSES/`, root `THIRD-PARTY-NOTICES.md`, and `docs/legal/` are **not** in `extraResources` and
never reach a user.

All three notices files were introduced in the same squashed commit `2b3b60e11` (v0.9.6-rc.1,
2026-06-07). Only `notices/THIRD-PARTY-NOTICES.md` has been touched since (`f6f7a8195`, 2026-07-16,
which added OfficeCLI and 7zip-bin). **`notices/` is authoritative de facto.**

### The three files, and what is wrong with each

| File                                | Ships? | Referenced? | Covers                                     | Defect                                                                                                                                                                                                                                                    |
| ----------------------------------- | ------ | ----------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notices/THIRD-PARTY-NOTICES.md`    | YES    | yes         | AionUi, Wayland-Core, OfficeCLI, 7zip-bin  | **Omits OpenClaw entirely** — see §3. Otherwise accurate.                                                                                                                                                                                                 |
| `THIRD-PARTY-NOTICES.md` (root)     | no     | no          | AionUi, Wayland-Core                       | Line 19-20 claims "The full Apache License is included as `LICENSE` at the root". **False** — `LICENSE` is AGPL-3.0. Also carries the harshest wording. Stale since 2026-06-07.                                                                           |
| `docs/legal/THIRD-PARTY-NOTICES.md` | no     | no          | AionUi, Wayland-Core (aside), **OpenClaw** | Line 8-10: "this repository ... **is distributed under the Apache License, Version 2.0**". **False, and it misstates our own outbound licence.** Also cites `src/process/services/channels/` which does not exist (real path is `src/process/channels/`). |

`notices/README.md` states the situation correctly and is the only prose in the tree that gets it
right: project is AGPL-3.0, `Apache-2.0.txt` "preserved solely to satisfy the attribution terms of
the AionUi and aionrs upstreams."

### Why `docs/legal/THIRD-PARTY-NOTICES.md` is the most serious item in this audit

It asserts the repository is distributed under Apache-2.0. That is not a missing attribution, it is
an **inaccurate grant of our own code under a permissive licence**. A third party who found that
file and relied on it would believe they could take Wayland source without AGPL's network-copyleft
obligation. It cuts against us, not against an upstream. It is also unshipped, unreferenced, and has
not been maintained in seven weeks.

### The wording difference on AionUi

- Root (unshipped): "**Wayland is a derivative work of AionUi.** The original AionUi source **forms
  the foundation** of the Wayland application ... all originate from AionUi."
- `notices/` (shipped): "**Portions** of the Wayland desktop application originate from AionUi ...
  **Wayland has since diverged substantially into an independent product.**"

The shipped wording is the accurate and proportionate one, and it is already what users see. The
"forms the foundation" framing that reads like a confession exists only in a file nobody receives.

---

## 3. The real compliance gap: shipped OpenClaw code with no shipped notice

This is the inverse of the original premise. We are not over-attributing in the artifact; we are
**under**-attributing.

Measured:

- **41 files** under `src/` carry a Peter Steinberger copyright header.
- **31 files** carry `* Licensed under the MIT License - see LICENSES/openclaw.txt`, including
  `scripts/install-signal-cli.mjs:8`.
- Concentrated in `src/process/channels/**` (Signal, Slack, IRC, Mattermost, Twitch, Nostr,
  Bluebubbles, Nextcloud Talk, Google Chat, Synology Chat, MS Teams, LINE, iMessage, webhook
  verifiers, WhatsApp bridge) plus `src/process/utils/{retry-policy,channel-errors,backoff}.ts`.

MIT requires: "The above copyright notice and this permission notice shall be included in all copies
or substantial portions of the Software."

The shipped `notices/` directory contains **no OpenClaw entry and no copy of the MIT text for it**.
`LICENSES/openclaw.txt` — the file 31 source files point at — **does not ship**. So the packaged app
distributes substantial MIT-licensed code while omitting the required notice.

**`LICENSES/openclaw.txt` is load-bearing and must not be deleted.** 31 source headers reference it
by path.

### Hermes

`LICENSES/hermes.txt` exists (MIT, © 2026 Eric (outsourc-e)) but **zero files reference it** and no
source file carries an outsourc-e copyright header. Note also that `readme.md:217` attributes Hermes
to **Nous Research**, which does not match the copyright holder in `LICENSES/hermes.txt`. Under
investigation — if there is no Hermes-derived code, this is a leftover to remove, not an attribution
to preserve.

---

## 4. Open item: SPDX tags claiming Apache-2.0

`src/renderer/components/settings/SettingsModal/contents/AboutModalContent.tsx:4` carries
`SPDX-License-Identifier: Apache-2.0`.

On an AionUi-derived file that is correct and required by Apache-2.0 §4(a)/(b). On a file we wrote,
it is an accidental permissive grant on our own code. The repo-wide count and the per-file split has
not yet been established. **This gates any conclusion about the SPDX surface.**

Separately: `AboutModalContent.tsx` (292 lines) contains **no** user-facing licence, notices, or
acknowledgements section. Users cannot reach attribution from inside the app; `notices/` ships as a
resource file on disk only. Defensible, but weak for both AGPL §5 and MIT.

---

## 5. What is safe to do, and what is not

**Safe, and it serves the ask:**

1. Add an OpenClaw entry to `notices/THIRD-PARTY-NOTICES.md` and ship the MIT text as
   `notices/OpenClaw-MIT.txt`. Closes a live MIT gap.
2. Delete root `THIRD-PARTY-NOTICES.md` and `docs/legal/THIRD-PARTY-NOTICES.md`. Both are unshipped,
   unreferenced, stale, and each contains a false statement about our own licence. Deleting them
   removes the "derivative work / forms the foundation" framing from the repo **and** removes the
   incorrect Apache-2.0 self-licence claim, while the shipped notice stays complete and gets
   _stronger_. No test or workflow references either path (verified across `tests/`, `scripts/`,
   `.github/workflows/`).
3. Resolve `LICENSES/hermes.txt` once the Hermes question is settled.

**Not safe:**

- Removing the AionUi entry from `notices/`, or the Wayland-Core/aionrs entry. Apache-2.0 §4(c)
  requires the NOTICE; §4(b) requires stating modifications. Both are compliance working correctly.
- Removing the 41 OpenClaw per-file MIT headers or `LICENSES/openclaw.txt`. MIT §requires the
  notice; 31 files cite the path.
- Renaming the `openclaw` / `hermes` / `zeroclaw` protocol and migration identifiers. They are
  persisted values driving a shipped migration feature (`src/common/types/migration.ts:20`,
  `src/common/types/detectedAgent.ts:21`) and appear in `readme.md:216-217` as supported
  integrations.

---

## 6. Inventory result

Full sweep done. Of the phrase hits, **50 files are THEIR-CODE** (upstream code present, comment is
the required attribution) and **26 are OUR-CODE** (idea reference only, no legal weight). Named
upstreams: OpenClaw 53 sites, Foundry 5, Hermes Agent 3, Gemini CLI 13 (via header not prose),
pptx2json 2, Figma 3, NocoBase 2, acpx/Zed/Codex CLI/Cherry Studio/Flow 1 each.

Two corrections to the raw sweep: `~89 files` was an over-count driven by `ported from` also
matching `imported from`/`exported from`; and several apparent upstreams are **ours** —
`flux-desktop`, `wayland-hermes` (predecessor app), `FoundrySkills` (a shipped content bundle,
distinct from the `Foundry` UI upstream), and `.planning` doc references.

### Upstream identities verified against the GitHub API

| upstream                    | verdict                                                                                                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/openclaw`         | **MIT, © 2026 OpenClaw Foundation.** 384k stars, canonical. GitHub reports NOASSERTION only because the LICENSE has a trailing third-party-notices paragraph that defeats exact-match detection — the terms are standard MIT. |
| `steipete/openclaw`         | a 15-star personal fork of `vercel-labs/openclaw`. 31 of our headers cite this rather than the canonical repo. Not worth churning 31 files over; the notices file cites the canonical one.                                    |
| `google-gemini/gemini-cli`  | Apache-2.0. Confirmed.                                                                                                                                                                                                        |
| `iOfficeAI/AionUi`          | Apache-2.0. Confirmed.                                                                                                                                                                                                        |
| `iOfficeAI/aionrs`          | Apache-2.0. Confirmed.                                                                                                                                                                                                        |
| `hermes-agent/hermes-agent` | **404 — does not exist or is private.** Cannot verify the copyright holder.                                                                                                                                                   |

## 7. Bundler behaviour, measured

Rollup retains a module's leading comment only when it is a legal comment (`@license`, `@preserve`,
or opening `/*!`). Ten OpenClaw notices sat in a bare `/* */` block above the Ferrox `@license`
block and were therefore **stripped from every build**, while the 31 that happen to have the same
text pasted inside their `@license` block survived. Accident, not design.

`src/process/utils/backoff.ts` was the clean proof: `computeBackoff` shipped, its MIT notice did not.
Fixed in `485b212ff` and verified by building and grepping `out/main` — the Variant A form went
0 → 2 and `Peter Steinberger` 30 → 32. The remaining eight do not appear because their code does not
either (type-only or tree-shaken). **The notice now survives wherever the code survives.**

Comment survival is undocumented bundler behaviour, so it is defence in depth only. The
authoritative notice is `notices/THIRD-PARTY-NOTICES.md` plus the now-shipping `LICENSES/`.

## 8. What was changed

| commit      | change                                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deacf2937` | Finished the 2026-05-15 wcore rename: 12 residual `aionrs` internal names/comments. `migrations.ts` untouched (persisted).                                                  |
| `12ab4f861` | Deleted both orphan notices files; corrected the false Apache-2.0 §4(b) claim in the shipped one; added OpenClaw, Hermes Agent and Gemini CLI entries; shipped `LICENSES/`. |
| `485b212ff` | Folded 10 OpenClaw notices into their `@license` blocks so the bundler keeps them.                                                                                          |
| `3f1c5ba10` | Dropped competitor names from 10 design-inspiration comments (Cherry Studio, Figma, NocoBase, acpx, Zed, Codex CLI, Claude Code).                                           |

## 9. Needs Sean

**RESOLVED 2026-07-30 — Foundry and Flow are first-party.** Sean: Foundry was the original version
of Wayland; Flow was his voice dictation app. Consequences:

- **No attribution is owed for either, and neither belongs in `notices/THIRD-PARTY-NOTICES.md`.**
  That file exists to discharge third-party obligations. Listing our own prior work there would
  assert, in the one legal document that ships, that we incorporated someone else's code — the exact
  impression this audit was asked to remove. You cannot owe yourself attribution.
- The `MicrophoneCheck.tsx:249` "copy 1:1" risk is void. It is our copy.
- All 17 Foundry/Flow references were therefore removed from the source in `7866d1076`, keeping the
  technical content and the deliberate-divergence rationale.
- `FoundrySkills` / `foundry-skills` is a **different thing** and was left alone: it is the skills
  library's own product name, present as `author: foundry-skills` in 2112 shipped SKILL.md files and
  baked into the library schemas and taxonomy. Openly ours, and renaming it would rewrite shipped
  content.

**RESOLVED 2026-07-30 — the attributions named the wrong parties.** Sean: Steinberger is OpenClaw,
Hermes Agent is Nous Research. Established against the GitHub API:

| our file                       | actual upstream                                                                                                                  | holder                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `whatsapp-bridge/bridge.js`    | `NousResearch/hermes-agent` → `scripts/whatsapp-bridge/bridge.js` (42428 bytes, exists)                                          | MIT, **© 2025 Nous Research**   |
| `whatsapp-bridge/allowlist.js` | same repo → `allowlist.js` (2326 bytes, exists)                                                                                  | MIT, **© 2025 Nous Research**   |
| `backends/baileys.js`          | `openclaw/openclaw` → `extensions/whatsapp/src/{session,auth-store,identity,connection-controller,creds-files}.ts` (all 5 exist) | MIT, © 2026 OpenClaw Foundation |

Upstream Hermes `bridge.js` credits no third party of its own, so **there was never a Steinberger
interest in the Hermes files** — the credit was a copy-paste of the OpenClaw block.

**The `Eric (outsourc-e)` mystery is solved.** `outsourc-e` is a real GitHub user (Eric) with
Hermes/OpenClaw-ecosystem repos, and `outsourc-e/hermes-workspace`'s LICENSE reads byte-for-byte
`Copyright (c) 2026 Eric (outsourc-e)` — identical to the old `LICENSES/hermes.txt`. That repo has
**no whatsapp bridge**. Someone took an MIT licence from the wrong "Hermes". Replaced by
`LICENSES/hermes-agent.txt`, fetched verbatim from the real upstream.

Also normalised: 31 headers cited `github.com/steipete/openclaw` (a 15-star fork of
`vercel-labs/openclaw`) instead of the canonical `openclaw/openclaw`. All 50 references now agree.

`LICENSES/openclaw.txt` left byte-identical on purpose — `© 2025 Peter Steinberger` is the notice
carried by the revision we pinned (`aee2681a`); restating a third party's copyright line is not ours
to do. The Foundation's current holding is recorded in the notices entry.

### Still open

1. ~~`LICENSES/hermes.txt` naming `Eric (outsourc-e)`~~ — resolved above. Previously: the in-code
   headers named
   `Peter Steinberger / Hermes Agent contributors`, and `readme.md:217` credits **Nous Research**.
   Three holders for one name, the upstream repo 404s, and `outsourc-e` appears nowhere else in the
   tree. The shipped `bridge.js`/`allowlist.js` carry their own notice verbatim so MIT is satisfied
   for them; this is about getting the notices entry right.
2. **`notices/` has never actually shipped.** The `extraResources` rule landed in `f6f7a8195`
   (2026-07-16); `v0.11.18` is `1b1c1e911` (2026-07-15) and is not a descendant. No released build
   has ever carried `THIRD-PARTY-NOTICES.md`. The config reads correctly but has never been
   exercised — confirm with `ls <app>/Contents/Resources/notices` on the next packaged build.

Two lower-priority observations, recorded rather than acted on:

- **2616 files under `src/` declare `SPDX-License-Identifier: Apache-2.0` while the project ships
  AGPL-3.0**, and not one file declares AGPL. Defensible (Ferrox may license its own contributions
  permissively into an AGPL work) but nothing in the tree reconciles it except `notices/README.md`.
- `src/process/resources/skills/moltbook/package.json:18` declares `"license": "MIT"` and has no
  notices entry; `src/process/channels/whatsapp-bridge/package.json` has no `license` field at all
  and ships as a loose file tree.

## 9b. NEW, and the one item that points toward MORE attribution: AionUi §4(c)

**AionUi headers every source file. We replaced those headers with ours on derived files.**

Upstream `packages/desktop/src/common/electronSafe.ts` opens:

```
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */
```

Our `src/common/electronSafe.ts` — same filename, same subpath, same purpose — opens with
`Copyright 2026 Ferrox Labs` in that exact slot. Repo-wide: **2693 Ferrox Labs headers, zero AionUi
headers.**

Apache-2.0 **§4(c)**: "You must retain, in the Source form of any Derivative Works that You
distribute, all copyright, patent, trademark, and attribution notices from the Source form of the
Work." Replacing an upstream copyright line on a modified version of their file does not satisfy
that. This is the substance behind the false claim the old root notices file made ("files modified
by Wayland carry no removal of the original copyright notices") — the claim was wrong, and the
underlying gap is real.

**Why it cannot simply be fixed mechanically.** The AionUi-derived file set is not identifiable:
- Our root commit `2b3b60e11` is a squashed import of **6245 files** with no pre-fork history.
- AionUi is a live 31k-star project (`packages/` monorepo, pushed 2026-07-30) that has moved on
  substantially, and our fork point is not recorded anywhere.

So there is no reliable way to know which of our files derive from theirs. Applying a dual copyright
too broadly would credit AionUi for our own work — the exact over-crediting this pass is removing.
Too narrowly and it fails the obligation anyway.

**Options, for Sean:**

1. **Keep the prominent notice and stop there (my recommendation).** `notices/THIRD-PARTY-NOTICES.md`
   now names AionUi, its licence, its copyright and the fact of derivation, and it ships. This is
   what the large majority of real forks do, it is honest, and it is proportionate. Residual risk is
   a strict §4(c) reading.
2. **Dual-copyright the plausibly-derived files.** Needs a diff against an AionUi tag near the fork
   point to identify them. Large, approximate, and prone to over-crediting.
3. Take advice, or approach AionUi directly.

I did **not** act on this unilaterally. It is the only finding in the audit that pushes toward more
attribution rather than less, it touches thousands of files, and it is a judgment call with legal
weight either way. **What I did do is stop the notices file from asserting §4(c) compliance we do not
have** — that sentence is now removed rather than left to ship as a false claim.

For contrast, where lineage IS known the pattern already works correctly: the 13 Gemini CLI files
retain their `Copyright 2025 Google LLC` headers untouched.

## 10. The honest summary

The brief asked whether attribution could be removed. Measured across the tree, the answer is that
the removable surface was **10 comments naming competitors as design inspiration** — real, but small,
and none of it read like "we stole this".

Everything that _does_ read like a fork confession is either legally required (OpenClaw MIT, AionUi
and Gemini CLI Apache-2.0) or was already gone from anything a user sees. The two files carrying the
harshest wording — "Wayland is a derivative work of AionUi", "forms the foundation" — never shipped,
were unreferenced, and each misstated our own licence; deleting them removed the confession _and_
fixed a defect.

The audit's actual output is the reverse of its premise: this codebase was **under**-attributing in
the artifact, not over-attributing in the source.
