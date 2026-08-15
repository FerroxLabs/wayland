# Pitfalls Research — Licence Compliance Remediation (WLD-I)

**Domain:** Post-hoc attribution restoration in a rebranded Apache-2.0-derived fork
**Researched:** 2026-07-30
**Confidence:** HIGH on primary-source facts (licence text, upstream repo state, prior-art artifacts fetched directly). MEDIUM on narrative/outcome framing of prior-art cases (web search + one archived blog post). LOW on anything about legal consequence — flagged inline for counsel.

> **Scope note.** This file answers "how does an attribution restoration go wrong, and what did comparable projects actually do." It is not legal advice and does not decide the remedy. Where a claim is a legal conclusion rather than a fact, it is marked **[COUNSEL]** and collected in the last section.

---

## ▶ Read this first — four verified facts that change the frame

Each was verified against a primary source in this research pass, not inferred.

**1. AionUi ships no NOTICE file, so Apache-2.0 §4(d) imposes nothing on Wayland.**
`api.github.com/repos/iOfficeAI/AionUi/contents/NOTICE` → 404; `NOTICE.txt` → 404. `LICENSE` is stock Apache-2.0 with the appendix filled as `Copyright 2025 AionUi (aionui.com)`. The live exposure is §4(c) (retain notices) and §4(b) (state modifications) only. This narrows the remedy considerably.

**2. §4(b) never required the enumerated modification list — and that list is the source of the false claims.**
Verified against `apache.org/licenses/LICENSE-2.0.txt`. §4(b) in full: _"You must cause any modified files to carry prominent notices stating that You changed the files."_ It requires a statement **that** you changed files. It does not require saying **what** you changed. Two of the four false statements in `notices/THIRD-PARTY-NOTICES.md` (the `.wcore.toml` / `~/.wcore` renames) exist only because someone volunteered a specification-of-changes that the licence never asked for. Prior art agrees: OpenSearch's convention is literally _"Modifications Copyright OpenSearch Contributors. See GitHub history for details."_ — a pointer to VCS, no enumeration.

**3. Apache-2.0 contains no termination-for-breach clause and no cure clause.**
`grep -i terminat` over the licence text returns exactly one hit: §3, patent-litigation termination. There is no §8-style 30-day cure like AGPL-3.0 has, and no automatic termination like GPLv2. What that means for a cured §4(c) breach is **[COUNSEL]** — but note that at least one web source confidently told me Apache-2.0 has a "cure such failure in a reasonable period" clause. It does not; that is Eclipse Public License language. Do not let a summary of the licence into a planning document. Quote the text.

**4. §4's final paragraph expressly blesses the dual-copyright form.**
_"You may add Your own copyright statement to Your modifications and may provide additional or different license terms ... for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License."_ The AGPL-3.0 relicensing of the whole is fine. The defect is narrow and specific: the Ferrox line **replaced** the AionUi line instead of **joining** it.

---

## Prior art

Ordered by how directly it applies. Classification matters: the quality gate for this milestone is that licence-compliance disputes are not confused with trademark or copyleft disputes.

| Case                                                 | Year    | Type                                                                   | Directly on point?                                       |
| ---------------------------------------------------- | ------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| **Digger / OpenTaco vs OTF**                         | 2025    | Attribution-only, no attribution given, cured in public                | **YES — closest analogue found**                         |
| **OpenTofu vs HashiCorp**                            | 2024    | Attribution/relicensing _allegation_, refuted with a provenance record | **YES — the methodology case**                           |
| **OpenSearch ← Elasticsearch**                       | 2021–   | Apache-2.0 §4 header convention at fork scale                          | **YES — the mechanics case**                             |
| **Valkey ← Redis**                                   | 2024–   | BSD-3 notice retention at fork scale                                   | YES (contrasting model)                                  |
| **LibreOffice / TDF policy**                         | ongoing | Written policy on mixed third-party files                              | YES (answers the "both sides changed it" question)       |
| **Open WebUI licence tightening**                    | 2025    | Upstream _reaction_ to rebranded forks                                 | YES (predicts upstream behaviour)                        |
| **AppGet / Microsoft winget**                        | 2020    | **Credit**, not licence                                                | Partly — reputational only                               |
| **ReactOS internal audit**                           | 2006–07 | Clean-room provenance, not attribution                                 | Partly — cost-of-uncertainty only                        |
| **Hellwig v. VMware**                                | 2016–19 | **Copyleft**, litigated                                                | Partly — evidentiary burden only, and it cuts against us |
| Elastic v. AWS; Hudson→Jenkins; CentOS/OpenELA/Rocky | various | **Trademark / governance / source availability**                       | **NO — off point, do not cite as precedent**             |
| MySQL→MariaDB; Gitea→Forgejo; Bitwarden SDK          | various | Governance / licence-purity disputes                                   | **NO — off point**                                       |

### 1. Digger / OpenTaco vs OTF (Sept 2025) — the closest analogue

_Confidence: MEDIUM on narrative, HIGH on artifacts (the remediation PR diff and the archived post-mortem were fetched directly)._

**Complaint.** Digger launched "Project OpenTaco" on Reddit on 2025-09-24. On 2025-09-25 `leg100` — Louis Garman, author of OTF (MPL-2.0, 691 stars) — pointed out in the launch thread that OpenTaco contained code copied from OTF with no attribution. The Reddit launch post was subsequently removed by moderators.

**Root cause, and it is uncomfortably familiar.** From their own five-whys: the code was moved as-is out of an internal proof-of-concept repo; at PoC time "not much thought was given to open source best practices"; "we did not have any attribution guidelines and did not follow any ourselves"; and "we were rushing to launch by HashiConf and completely forgot about code copied from OTF by the time of the launch." A forgotten import from a PoC, discovered at launch. That is Wayland's root commit `2b3b60e11` with different names on it.

**What they changed — within roughly 24 hours of being flagged, all three merged:**

- `PR#2262` "Add appropriate attributions in source" — 8 files, **49 additions, 0 deletions**. Per-declaration comments `// Adapted from OTF (MPL License): https://github.com/leg100/otf` placed above each adapted struct and function, _plus_ the same per-file provenance table added to the shipped `taco/README.md`.
- `PR#2263` — relicensed Digger from Apache-2.0 to MIT.
- `PR#2264` — added explicit attribution guidelines to the contribution process.

**How it was resolved.** A public post-mortem (Igor Zalutski, 2025-09-26) with a dated chain of events, a **per-file table naming every copied symbol**, an apology, explicit thanks to the person who caught them, and an open invitation: _"We'd love to know if there is anything else that we could / should do to make this right."_ No litigation. No takedown. No visible upstream escalation. The project survived and was renamed OpenTaco in December 2025.

**Cost.** Not publicly disclosed in money. Observable: the launch narrative was destroyed, the Reddit launch post was removed, three emergency PRs, a licence change, and a permanent public record. The Hacker News submission of the post-mortem drew **3 points and one comment** — and that one comment is the lesson: _"If I'm reading these five why's correct, essentially they just copied the code without caring, and then didn't want to let caring get in the way of their product announcement, and got caught. It's not even really malicious, it's just apathetic. I'm not sure which is worse."_

**Two things to steal and one to avoid.**

- Steal: the per-file/per-symbol provenance table, published, in a shipped file.
- Steal: the speed. One day from flagged to merged cure.
- Avoid: the five-whys framing. A root-cause chain that reads as "we were busy" invites the apathy reading. Lead with the measurement and the fix, not with why nobody noticed.

**The unfinished part, and it is a real pitfall.** OTF is **MPL-2.0** — file-level copyleft. The cure was a provenance _comment_ inside files that Digger then relicensed to **MIT**. Whether a comment saying "adapted from an MPL project" discharges MPL's own per-file notice obligation is **[COUNSEL]** and I take no position. What is observable and transferable: _a fast, public, well-received cure can still be substantively incomplete, and the incompleteness survives in public forever._ Cure by comment is not the same as cure by compliance.

### 2. OpenTofu vs HashiCorp (April 2024) — why the provenance record is the asset

_Confidence: MEDIUM on narrative; HIGH on the header convention and CI enforcement, both fetched from the repo._

**Complaint.** On 2024-04-03 Matt Asay (then MongoDB VP DevRel) wrote in InfoWorld that OpenTofu had taken BUSL-licensed Terraform code, removed the headers, and relicensed it as MPL-2.0. On 2024-04-05 GitHub issue `opentofu/opentofu#1469` made the same charge about `internal/refactoring/remove_statement.go`. HashiCorp sent a cease-and-desist alleging OpenTofu had "incorrectly re-labeled HashiCorp's code to make it appear as if it was made available by HashiCorp originally under a different license."

**What they changed: nothing.** On 2024-04-11 OpenTofu published a **Source Code Origin (SCO) analysis** — a line-by-line provenance trace showing the disputed code descended from the pre-BUSL MPL-2.0 Terraform tree, and noting HashiCorp had copied from the same older code when implementing its own version. They published the C&D, their response, and the SCO analysis together.

**How it resolved.** Asay's article got an editor's note stating it now appeared the copying had not happened, and he publicly disavowed it. No litigation followed. Coverage afterward framed HashiCorp's threats as having "fallen flat."

**Cost.** Not publicly disclosed. The reputational cost landed on the **accuser**, because the accused could produce the record on demand.

**The convention that made it possible** — verified directly from `raw.githubusercontent.com/opentofu/opentofu/main`, present on both the disputed file and ordinary files:

```go
// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) 2023 HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0
```

Fork first, upstream retained beneath, both with an SPDX tag. Machine-checkable. And **enforced in CI, not applied once**: `.github/workflows/checks.yml` runs a dedicated `copyright` job calling `opentofu/scripts/.github/workflows/copyright.yml` (a `copyright_check.sh` over configurable search/ignore globs, failing the build on a missing header), alongside a separate `licensei` job with an approved-licence allowlist (`.licensei.toml`: apache-2.0, bsd-2-clause, bsd-3-clause, isc, mpl-2.0, mit).

**Lesson for WLD-I.** The deliverable is not a clean tree. It is a **record that survives an adversarial reading by a hostile stranger.** OpenTofu won because a critic's claim could be checked against a published analysis in an afternoon. Wayland currently cannot do that for a single file, because the root commit is squashed.

### 3. OpenSearch ← Elasticsearch 7.10.2 (2021–) — the mechanics at fork scale

_Confidence: MEDIUM (search + the tracking issue)._

Not a dispute — a fork that did the header sweep deliberately. Per `opensearch-project/.github#21`, coordinated across **29+ repositories**:

- **New files:** `Copyright OpenSearch Contributors` / `SPDX-License-Identifier: Apache-2.0`. **No year. No "All Rights Reserved." No Amazon reference.**
- **Files with existing Elastic headers:** the existing header is **kept**, and an OpenSearch block is prepended:

```
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license.

Modifications Copyright OpenSearch Contributors. See
GitHub history for details.
```

- **Years:** none for the fork's own line; _retain_ years where an Elastic copyright is needed.
- **Modifications:** not enumerated. "See GitHub history for details."

Three details worth lifting:

1. **They did not decide per file whether it was derived.** They applied the modifications block broadly and kept whatever was already there. Adding your own modification notice to a file that turns out not to be derived costs nothing. Deleting an upstream notice from a file that turns out to be derived is the breach. Prior art validates the asymmetry the WLD-H cross-audit already reached independently.
2. **"See GitHub history for details" is the §4(b) answer** — and Wayland's squashed root commit is what makes that sentence a lie for pre-fork provenance. That gap must be filled by a checked-in baseline document, not by a pointer to history that does not exist.
3. **Issue #21 is itself a correction issue** — titled _"Correct copyright notices to reflect Copyright OpenSearch Contributors."_ The first sweep at a well-resourced AWS-backed project got it wrong and needed a second, coordinated pass. Plan for two passes.

### 4. Valkey ← Redis (2024–) — the model Wayland can no longer use

_Confidence: HIGH — verified from the repo._

`src/server.c` on `unstable` opens with `Copyright (c) 2009-2016, Redis Ltd.` and the full BSD-3 text, **completely untouched**, with no Valkey line added. The fork's own copyright appears only in top-level `COPYING`:

```
BSD 3-Clause License

Copyright (c) 2024-present, Valkey contributors
Copyright (c) 2006-2020, Redis Ltd.
```

Valkey never had to classify a single file, because it never removed anything. This is the cheapest and safest model — and it is the one Wayland forfeited at the root commit. Worth recording precisely because it shows how small the original correct action was: leaving the line alone. The remediation cost is entirely self-inflicted by an act of deletion.

### 5. LibreOffice / The Document Foundation — the written policy on mixed files

_Confidence: MEDIUM (search summary; the wiki page itself blocked direct fetch)._

TDF's `License_Policy` reportedly states that the project does not accept altering the licence on existing files without legal approval; that "additional **accurate** notices of copyright ownership may be added"; and — the part that answers the hardest question in WLD-I — that when mixing third-party and project code, contributors should **separate new code from old into separate files where possible**, and where major changes are unavoidable, **indicate clearly which is new code and which is third-party code that cannot be relicensed**.

Two operative words: **accurate** (an inaccurate added notice is not a safe default — see Pitfall 3) and **separate** (the structural answer for a file both parties have rewritten).

### 6. Open WebUI (2025) — what an upstream actually does about rebranded forks

_Confidence: MEDIUM (their own docs + HN discussion)._

Open WebUI moved from BSD-3 to a custom "Open WebUI License" from **v0.6.6** onward, adding a branding-protection clause: users may not alter, remove, or obscure Open WebUI branding. Their stated reasoning is explicitly about rebranded deployments — _"Visible branding costs users nothing, but it connects the software to the team behind it."_ Pre-v0.6.6 code stays BSD-3; contributions from v0.6.6 require a CLA; anyone who objects may fork from v0.6.5. The change was contentious on HN.

**Why this matters for Wayland's remedy decision, concretely.** The most likely upstream response to discovering a 31k-star project's code inside a rebranded commercial-adjacent Electron app is **not a lawsuit**. It is (a) a public statement and (b) a licence tightening that freezes the fork at the last permissive revision. Wayland's ability to pull future AionUi improvements is a real asset, and it is the asset most exposed by a badly handled disclosure — more exposed than the bank account.

### 7. AppGet / Microsoft winget (June 2020) — reputational only, **not** a licence case

_Confidence: MEDIUM._

Explicitly classified: this was a **credit and process** dispute, not a licence breach. Microsoft interviewed AppGet's author Keivan Beigi, went quiet, then shipped winget with no acknowledgement. After days of community outrage, Andrew Clinick published a post crediting Beigi: _"Over the past couple of days we've listened and learned from our community and clearly we did not live up to this goal. More specifically, we failed to live up to this with Keivan and AppGet."_ Press coverage was near-uniformly framed as "credits but offers no apology." AppGet was retired 1 August 2020.

**Two transferable lessons.** First: the delay was the damage. Silence between discovery and acknowledgement is where the story gets written by someone else. Second: **a credit that reads as legally-reviewed rather than sincere gets reported as a non-apology.** For Wayland, whose release-notes practice leads with strength, the trap is producing exactly that artifact.

### 8. ReactOS (2006–07) — the cost of an unresolved provenance question

_Confidence: MEDIUM. Off-point on subject matter (clean-room/copyright, not attribution), on-point on cost._

On 2006-01-17 a developer alleged on the dev list that ReactOS contained code derived from disassembling Windows. On 2006-01-27 maintainers **disabled repository access**. An internal audit followed; the audit status was removed from the homepage only in **September 2007**. Details were never published.

The datapoint: ~20 months of a project operating under an unresolved provenance cloud, with development frozen at the start of it. This is the cost of _not_ answering the question, and it is the argument for finishing the WLD-I inventory rather than accepting residual risk.

### 9. Hellwig v. VMware (2016–2019) — the evidentiary lesson, and it does not comfort us

_Confidence: MEDIUM. Copyleft litigation, not attribution._

Christoph Hellwig's GPL suit was dismissed in Hamburg because he failed to identify the specific lines of code in VMware's product that he owned — _"insufficient proof of the right ownership or the copyright protection capability of the components taken over from Linux"_ on appeal. It turned on evidence, never reaching the derivative-work question.

**Do not read this as protection.** Hellwig's problem was that he was one of thousands of contributors to a 20-million-line kernel claiming ownership of scattered modifications. AionUi's position is the opposite in every dimension: a single corporate copyright holder, a single upstream, **identical file paths**, and at least one file (`src/common/electronSafe.ts`) at 100% substantive-line identity with 34/34 shared distinctive identifiers where the only header change is `Copyright 2025 AionUi (aionui.com)` → `Copyright 2026 Ferrox Labs`. Proof would take an afternoon and a `diff`. The evidentiary difficulty that saved VMware is absent here. Anyone who reaches for "hard to prove" as comfort should be shown this paragraph.

### Cases deliberately excluded as off-point

Citing these as precedent would be an error, and the roadmap should not:

- **Elastic v. AWS** (settled Feb 2022) — trademark.
- **Hudson → Jenkins** (2011) — trademark ownership by Oracle.
- **CentOS rebuilds / Rocky / AlmaLinux / OpenELA** (2023) — source availability and subscription terms. There _is_ one useful distinction buried in it: debranding a rebuild legitimately removes the upstream's **trademarks**, and that necessity has never licensed removing the upstream's **copyright notices**. A rebrand is not a warrant to rewrite copyright lines. That distinction is the whole of Wayland's defect.
- **MySQL → MariaDB**, **Gitea → Forgejo**, **Bitwarden SDK** — governance and licence-purity disputes.
- **MinIO AGPL enforcement**, **Redis/Valkey licence change**, **Grafana AGPL** — copyleft and business-model, not attribution.
- **Cherry Studio** — I could not verify my own recollection of an Apache-2.0-to-restrictive licence change driven by rebranded forks. Current verified state is AGPL-3.0 with a commercial licence required above 10 individuals. **Marked as unverified recollection; do not use.**
- **A documented Electron/AI-desktop-app attribution incident** — searched for and **not found**. The Digger case is the nearest thing in the AI-tooling space. If the roadmap wants an in-domain precedent, there isn't one; act on the general prior art.

---

## Critical Pitfalls

### Pitfall 1: The restoration itself becomes the false statement

**What goes wrong:** A mass sweep writes 310 headers asserting derivation from AionUi. A later audit finds a subset were Ferrox originals that merely happen to sit at a matching path. The project has now put a false factual claim about third-party ownership into 40 shipped files, and the sentence "we verified this" is on the record for all of them.

**Why it happens:** Same-path is a candidate filter, not a verdict. The WLD-H sample already shows 1 of 23 sampled same-path files below 20% overlap. Extrapolate and roughly 30 of 445 are not derived. A sweep sized to "the 445" will be wrong ~30 times; a sweep sized to "the derived set" needs 445 measurements.

**How to avoid:** Split the sweep into two claim types with two different standards. A **copyright retention** (`Copyright 2025 AionUi (aionui.com)` restored alongside the Ferrox line) is a conservative act — over-applying it costs credit you didn't owe and carries no liability, exactly as the cross-audit concluded and exactly as OpenSearch operated. A **derivation assertion** in `notices/THIRD-PARTY-NOTICES.md` or a `Source:` path in a header is a factual claim and needs a measurement. Bias inclusion in the first; require evidence for the second.

**Warning signs:** A plan that says "apply the header to all 445." A commit message with a count in it that nobody recomputed. Any file where the header names a specific upstream path that was not opened.

**Phase to address:** Inventory phase must emit a per-file classification with a recorded score before the restoration phase is allowed to run.

---

### Pitfall 2: Enumerating modifications the licence never asked for

**What goes wrong:** The §4(b) notice becomes a changelog. Every enumerated item is a new falsifiable assertion, and the tree drifts away from it. Two of WLD-H's four CRITICAL findings are exactly this: `.aionrs.toml → .wcore.toml` and `~/.aionrs → ~/.wcore`, both false against the shipped binary, where the real names are `.wayland-core.toml` and `~/.wayland-core`.

**Why it happens:** Enumerating feels more honest and more thorough. It is more thorough and it is a liability, because it converts one durable true sentence into N sentences that rot.

**How to avoid:** Verified from the licence text — §4(b) requires only "prominent notices stating that You changed the files." Adopt the OpenSearch form: _modified, see history for details._ Delete the enumerated list rather than fixing it. If product marketing wants a rename table, that belongs in docs, not in a shipped legal notice.

**Warning signs:** Any bullet list under a §4(b) heading. Any specific string, path, or version number inside a notices file that isn't a copyright line.

**Phase to address:** Shipped-claim truth pass. Its default action on an enumerated claim should be **delete**, not **correct**.

---

### Pitfall 3: Wrong holder, wrong year, wrong entity — the machine-generated header that is subtly wrong 300 times

**What goes wrong:** A generated header credits the current foundation for a revision authored by an individual; or invents a year; or credits a fork instead of the canonical upstream; or normalises `Copyright 2025 AionUi (aionui.com)` into a tidier `Copyright (c) 2025 AionUi Contributors` that no upstream file has ever said. At 310 files the error is uniform and invisible.

**Why it happens:** Header generation is templating, and templating normalises. The instance already exists in this tree: `notices/THIRD-PARTY-NOTICES.md:59-60` credits the "OpenClaw Foundation," which appears nowhere at the pin, and the panel split on whether the sentence rescues itself. `baileys.js` says `Copyright (c) 2025 OpenClaw contributors` while `LICENSES/openclaw.txt` and the notices entry both say Peter Steinberger.

**How to avoid:** One rule — **copy the notice byte-for-byte as it appears in the revision you took, and never modernise it.** OpenSearch's rule is the same shape: no year on your own line, retain years on the upstream's. TDF's word is _accurate_. Practically: for every restored header, the generator must read the upstream file at the pinned baseline and emit the exact bytes of its copyright line. If it cannot fetch that file, it must fail, not fall back to a template.

**Warning signs:** A restoration script with a copyright string as a constant. Any restored header whose text is not `grep`-able verbatim in the baseline checkout. A year that matches the year of the sweep.

**Phase to address:** Baseline phase must produce a local checkout of the pinned upstream revision that the restoration phase reads from directly. Verification: for each restored file, the emitted copyright line must be found verbatim in the baseline checkout.

---

### Pitfall 4: The notice ships as a bundler-stripped comment — a notice that does not exist

**What goes wrong:** The header is in the source, the audit passes, and the packaged app contains nothing. `esbuild`'s definition of a legal comment (verified from its docs) is _"any statement-level comment in JS or rule-level comment in CSS that contains `@license` or `@preserve` or that starts with `//!` or `/_!`"* — default `eof`when bundling,`inline`otherwise. Anything else is discarded. The cross-audit already found this shape live: the tunnel trio carry provenance in a **second comment block with no`@license`**, byte-for-byte the form `485b212ff` fixed for eight other files, and therefore dropped from every build.

**Why it happens:** Source-tree grep is the natural verification and it is the wrong artifact. And the failure is silent — nothing errors.

**How to avoid:** Every restored provenance comment must sit **inside** an `@license` block (or `/*!`). Verification must run against the **packaged artifact**, not the source tree — which is already the WLD-I success standard ("confirmed present in a real packaged artifact, not inferred from `electron-builder.yml`"). Hold it.

**The non-obvious corollary.** `eof` mode does not delete legal comments — it **relocates** them to the end of the emitted chunk. ASF's rule is that _"copyright notifications which have been relocated, rather than removed, from source files must be preserved in NOTICE."_ A minified renderer chunk with all its legal comments swept to EOF is a relocation. This is the strongest argument for making the notices file the **primary** compliance vehicle and per-file headers the secondary one: the notices file is a plain text file that a builder copies, and its content survives.

**Warning signs:** A provenance comment in a second block. A restored header verified by `git grep`. A `@license`-less `/* Adapted from ... */`.

**Phase to address:** A packaged-artifact verification phase that greps the built `.app`/`.exe`/asar for a sample of restored notices, gated in CI.

---

### Pitfall 5: Touching a file invalidates a checksum or pin, and every build fails

**What goes wrong:** A header edit changes a file's bytes, which changes a recorded sha256, which fails a supply-chain verification gate. This is not hypothetical here: the cross-audit flags that fixing `baileys.js` **requires re-pinning `scripts/whatsapp-bridge-source.json` or every packaged build fails** — and memory records that a stale version of that exact file already broke every packaged build including CI once.

**Why it happens:** Attribution work is filed mentally as "comments only, zero risk," so it skips the build verification that a code change would get.

**How to avoid:** Before the sweep, enumerate every manifest that records a hash or size of a file in the candidate set (`scripts/whatsapp-bridge-source.json`, `bundled-officecli-shasums.json`, `resources/bundled-wayland-core/**` shasums, any `patches/*.patch` whose context lines shift). Make re-pinning a mandatory step of the same commit, and make a full packaged build the gate on the sweep — not a `tsc` pass.

**Warning signs:** A commit that touches a vendored or bridge file without touching its manifest. A patch file that no longer applies. Any green typecheck presented as evidence the sweep is safe.

**Phase to address:** Inventory phase produces the pin-impact list; every restoration commit that touches a pinned file re-pins in the same commit.

---

### Pitfall 6: Asserting completeness that a later audit disproves

**What goes wrong:** A shipped legal document says "all AionUi-derived files carry restored attribution" or "this is the complete set." Someone later finds file 311. The false completeness claim is now worse than the original omission, because omission is negligence and a false assurance looks like concealment.

**Why it happens:** Completeness is the natural way to close a compliance milestone, and closure is the emotional goal of the whole exercise. This tree already contains three instances of the pattern, all found by WLD-H: a blanket "the directory retains the original Google headers" that was true for 13 of 21 files; a "none of these upstreams distributes a NOTICE file" that was false for the one upstream that does; and a commit message asserting verification of a claim that was wrong.

**How to avoid:** Never assert completeness. Assert **method, scope, and date** — the OpenTofu form. "As of <date>, <N> files were compared against AionUi revision <sha> by <named method>; <N> were classified derived and carry restored attribution; the classification, scores, and scripts are in `<path>`." That sentence stays true when file 311 turns up, and file 311 becomes a follow-up rather than a contradiction. Digger's post-mortem published a per-file table and never claimed it was exhaustive.

**Warning signs:** The words "all," "complete," "every," "none," or "fully" in a shipped notices file. A milestone exit criterion phrased as an absolute.

**Phase to address:** Shipped-claim truth pass. Add a lint: the notices file may not contain unqualified universal quantifiers.

---

### Pitfall 7: Deleting provenance comments to "clean up"

**What goes wrong:** A comment naming an upstream is deleted because no copying was proven. But the comment was the only pointer anyone had, and deleting it destroys the ability to adjudicate later while creating a fresh act of removal to explain.

**Why it happens:** An unproven provenance comment looks like noise, or like over-attribution, and this milestone's stated purpose makes deletion feel aligned with the goal.

**How to avoid:** This project already did it and its own audit caught it. `3f1c5ba10` removed clauses naming acpx, Zed, Codex CLI, Claude Code, NocoBase, Figma and Cherry Studio from 8 files on a single sentence of justification — _"None of these upstreams has code in this repo"_ — with **no per-file diff**, while the sibling commit `9add51a0c` produced a per-file upstream comparison for all 11 of its OpenClaw removals. Two evidentiary standards in one branch, and the weaker one was applied to the upstreams nobody had audited. It is also internally inconsistent: `Modeled after Claude Code's team leader prompt` survived at `leadPrompt.ts:20`. One of the deleted clauses named **acpx and Zed — GPL-family**, the one with actual teeth, and one named Claude Code, which is closed-source and therefore undiffable, _which is exactly why that comment had value._

The rule: **removal requires strictly more evidence than retention.** Retention is free. Removal is an act you will be asked to justify. Where the upstream cannot be diffed at all, the comment can never be disproven and must stay.

**Warning signs:** A deletion justified by a general statement rather than a per-file comparison. A cleanup commit whose diff is all `-` lines in comments. Inconsistent treatment of the same upstream across files.

**Phase to address:** A dedicated re-adjudication phase for `3f1c5ba10`, held to the `9add51a0c` standard. Default action pending adjudication: **restore.**

---

### Pitfall 8: Reconstructing the fork baseline from upstream's current main

**What goes wrong:** Overlap is measured against AionUi's `main` today. Files that AionUi has since rewritten score low, get classified "not derived," and are excluded — when at the fork point they may have been identical. Divergence in upstream is read as evidence of independence in the fork. The exclusions are wrong in precisely the direction that flatters the project.

**Why it happens:** Current `main` is the tree you can `git clone` in one command. The correct baseline requires work that produces no code.

**How to avoid:** See "Establishing a defensible baseline" below. Short version: current-main comparison is valid **only as a lower bound establishing that derivation occurred**. It is never a valid basis for **excluding** a file.

**Warning signs:** Any exclusion whose evidence is a low score against `main`. Any measurement script that clones without a `--revision` pin.

**Phase to address:** A baseline phase, blocking, before any inventory verdicts are recorded.

---

### Pitfall 9: A method artifact read as a clean result

**What goes wrong:** A grep returns zero, a listing returns a satisfying count, and the absence is recorded as evidence.

**Why it happens:** Zeros are not scrutinised. WLD-H hit this twice: a **non-recursive** `ls` of `src/process/agent/gemini/cli/` returned 13 files and there are exactly 13 Google-headered files, reading as a perfect "13/13 clean" — it is 21 files and 8 are unheadered; and an anchored regex `^WCORE_[A-Z_]+$` over `strings` output on a Rust binary returned 0 because the string table concatenates entries (`WCORE_MEMORY_DIRAIONRS_MEMORY_DIR`).

I hit the same class in this research pass and caught it only because the cross-audit warned me: GitHub code search returned **0** for `"Google LLC"` and **0** for `"gemini-cli"` in the AionUi repo. Before believing either, I ran controls — `"electronSafe"` → 3, `"Copyright 2025 AionUi"` → 778, and `"Copyright 2025 Google LLC"` in `google-gemini/gemini-cli` → 1404. The controls fired, so the zeros are real. Without them they were worthless.

**How to avoid:** Institutionalise it: **every zero and every suspiciously tidy count must be accompanied by a positive control run through the identical method.** Put the control in the artifact, not in the analyst's head. Always `find -type f`, never `ls`.

**Warning signs:** A clean result that arrives faster than expected. A count that matches a round number or a directory listing. A regex with `^`/`$` over binary-derived text.

**Phase to address:** Every measuring phase. The inventory phase's output schema should require a `control` field per query.

---

### Pitfall 10: The remedy is scoped as an engineering task and misses the distribution risk

**What goes wrong:** The team treats this as a source-tree problem and forgets that the sanction that actually bites is distributional, not judicial.

**Why it happens:** Litigation is the vivid risk, so it absorbs the anxiety. It is also the least likely.

**How to avoid:** Note where Wayland is exposed: npm, GitHub Releases, a Homebrew tap, and signed installers. A DMCA notice to GitHub or npm costs the upstream a web form and no lawyer, and can pull a release inside days. **[COUNSEL]** on process and counter-notice mechanics. Prior art bears out the ranking: across every attribution-specific case found, **zero** produced litigation; the observed consequences were a removed launch post, a C&D that went nowhere, an emergency licence change, and a permanent public record.

**Warning signs:** A remedy plan with no answer to "what if a takedown lands on the npm package next week." A release scheduled before the notices are true.

**Phase to address:** The remedy/disclosure decision phase, with counsel, before any release that ships the restoration.

---

## Establishing a defensible baseline when the fork point is unrecoverable

Answering the roadmapper's question 4 directly.

**Is comparing against upstream's current `main` methodologically acceptable?** Partially, and asymmetrically:

- **Acceptable** to establish that derivation occurred and to bound its scale. Overlap against a drifted `main` is a strict lower bound; a 100% match today is unimpeachable evidence.
- **Not acceptable** as the basis for excluding a file. A file at 6% against today's `main` may have been at 95% at the fork point. Every exclusion made on a current-main score is an unforced error waiting for someone with a `git log`.

Prior art confirms the distinction: OpenTofu's SCO analysis is persuasive precisely because it traced to the **historical MPL-era tree**, not to the tree of the day.

**And upstream is drifting fast.** Verified in this pass: AionUi has restructured into a monorepo (`packages/desktop/...`) and `packages/desktop/src/process/agent` **no longer exists**. The 445 same-path figure is therefore not a stable measurement — it is a decaying one. Every week WLD-I is deferred, the baseline gets harder to reconstruct and the inventory understates the overlap by more. That is an argument for doing the baseline work **now**, before the remedy debate concludes.

**How to manufacture a baseline after the fact.** The root commit `2b3b60e11` is dated 2026-07-06 and AionUi was created 2025-08-07, so the fork revision lies in an 11-month window ending 2026-07-06. Procedure:

1. Enumerate AionUi revisions in the window — release tags first, then commits touching `packages/desktop/src/`, filtered to on or before 2026-07-06.
2. For each candidate, check out the tree and compute aggregate substantive-line overlap against Wayland's `src/` over a fixed, pre-registered file sample.
3. The **argmax revision is the defensible baseline.** Publish the candidate set, the scores, and the winner. The search itself is the evidence — it is what turns "we guessed" into "we bracketed and measured," and it is reviewable by anyone who repeats it.
4. Pin that revision in a checked-in `BASELINE.md` (or equivalent) with the sha, the date, the candidate table, and the scripts. This is the artifact that substitutes for the git history the squashed import destroyed, and it is the thing that would let Wayland do in a day what OpenTofu did in eight.
5. Only then run the per-file inventory, against that checkout, never against `main`.

**Files where both parties have since changed the file substantially.** Three points:

- **Divergence does not extinguish §4(c).** The obligation attaches to notices "from the Source form of the Work" you started from. A file you rewrote 70% of is still a Derivative Work of the file whose notice you deleted. Rewriting is not laundering.
- **The correct output is dual copyright, not a judgement call.** Restore the upstream line, keep the Ferrox line, and state modification without enumerating it — the OpenSearch form. No percentage threshold is needed, which conveniently removes the argument nobody can win.
- **Where the mixture is structural, split the file.** This is TDF's documented practice: separate new from old into separate files where possible; where not, mark clearly which is which. Reserve it for the handful of files where it's cheap; do not turn WLD-I into a refactor.

**The one thing that would make this materially easier and should be checked first:** whether any pre-squash artifact survives anywhere — a reflog on a machine that did the import, an old clone, a stale worktree, a CI cache, an `npm pack` tarball of an early version, a packaged `.asar` from an early release. Memory records that `git worktree list` shows registrations rather than disk truth and undercounted 20×, so search the filesystem, not the registration list. A single surviving pre-squash object graph converts the whole baseline phase from reconstruction into retrieval.

---

## The reputational and community dimension

**Recommendation: cure first, then acknowledge publicly and briefly, in a channel that is not the release notes.** Rationale, then the counter-case.

**Why not quiet.** The exposure is trivially discoverable — 445 same-path files against a 31,115-star project, one file at 100% identity, `git grep -c "Copyright.*[Aa]ion[Uu]i" -- src` returning 0. Anyone with a diff tool finds it in an afternoon, and the WLD-H artifacts mean it is already written down. A quiet fix does not remove the exposure; it removes Wayland's ability to be the one who tells the story. Digger's launch post was removed by moderators because the upstream author got there first. AppGet shows the days between discovery and acknowledgement are exactly where the narrative is lost.

**Why not loud.** A prominent mea culpa on a product surface would be disproportionate to a §4(c) notice defect with no NOTICE-file obligation, and — per the AppGet coverage — a carefully-worded credit reads as a non-apology and gets reported that way. The HN reaction to Digger's post-mortem is the more precise warning: a self-published root-cause narrative that reads as "we were busy" earns _"it's just apathetic. I'm not sure which is worse."_

**The shape that works.** Prior art converges on: a short factual note, published **after** the cure ships, that states the defect, the method, the scope, and the fix, links the artifacts, and credits anyone who flagged it. Digger's structure minus its framing: keep the per-file provenance table, drop the five-whys.

**On this project's standing rules.** Two rules are in tension and both can be honoured. _Announcements lead with strength_ and _transparency is explicitly acceptable for security and trust fixes_ — with a recorded easing on the never-reference-prior-problems rule for trust work, detailing the fix as rigor. Licence compliance is trust work. But the resolution is a **channel** decision, not a tone decision:

- **Release notes:** one strength-led line, forward-facing. Something in the register of "complete third-party attribution and per-file provenance now ship with every build, with a published inventory" — true, leads with the rigor, does not narrate the failure.
- **A separate, linkable compliance note** (repo doc or blog, not the release announcement): the full factual record — method, baseline revision, counts, what was restored, what remains open. This is the artifact that wins the exchange if someone comes looking, and the one place where a plain "we found that our root import replaced upstream copyright lines with ours; that was wrong and here is the fix" belongs. Unhedged, once, in a low-traffic place, is far cheaper than hedged everywhere.

Do not merge these two. The release note carrying the confession is what produces the non-apology headline; the compliance note carrying spin is what produces the credibility loss.

---

## Upstream contact: should Wayland contact AionUi?

**Recommendation: yes, but only after the cure has shipped in a released artifact — and as a notification, not a negotiation.** Do not open a dialogue while the tree is still in breach.

### The case for contacting (after cure)

- It converts the frame from _"you are in breach"_ to _"we found a gap in our own compliance and fixed it; here is the record."_ That framing is only available to whoever speaks first, and only credible if the fix already exists.
- It is the pattern that demonstrably worked. Digger cured within ~24 hours of being flagged and published immediately; the upstream did not escalate; the project survived. In every attribution-specific case found, a good-faith visible cure ended the matter.
- It preserves the option of pulling future AionUi work. Open WebUI is the counterexample of what a blindsided upstream does: tighten the licence going forward and strand every fork at the last permissive revision. Given AionUi's velocity and the fact that its structure has already moved out from under Wayland's, that option has real value.
- **[COUNSEL]** A contemporaneous, documented, self-initiated cure is generally understood to bear on willfulness. Ask counsel whether that holds in the relevant jurisdictions and whether the note should be drafted or reviewed by them.

### The case against contacting — stated properly, because it is not weak

- **Apache-2.0 does not require upstream consent to cure.** §4(c) is a condition on redistribution, not a permission to be requested. Contacting creates an obligation-shaped conversation where none exists in the licence.
- **You hand over control of timing.** Once notified, the upstream can publish on any schedule it likes, including during a Wayland release week.
- **You create a dated admission by a named party.** **[COUNSEL]** on whether and how that matters, but the asymmetry is real: the note is discoverable and permanent, and it is evidence you authored.
- **An approach invites a demand.** A commercially-motivated upstream — iOfficeAI runs `aionui.com` and also ships OfficeCLI, which _does_ distribute a NOTICE file, so they are demonstrably attention-paying on licensing — may respond with an ask (prominent credit in the product UI, a link, a naming change, a commercial conversation) that is expensive to refuse once made in writing and cheap to refuse if never asked.
- **The glass-house problem, and it is genuinely double-edged.** Verified in this pass: AionUi carries **778** `Copyright 2025 AionUi` headers and **zero** `Google LLC` copyright notices, ships **no NOTICE file**, and its README does not describe the project as derived from anything — while it markets itself extensively as a GUI for Gemini CLI. Whether AionUi has its own §4(c) position with respect to Google is **not established** by that and I am not asserting it. But it means (a) an upstream in a comparable posture is unlikely to want a public forensic exchange about copyright headers, which lowers the risk of contact; and (b) _any temptation to point this out is a trap._ Raising it converts a compliance cure into a mutual-accusation fight, forfeits the good-faith frame entirely, and is the single fastest way to turn a cooperative outcome into a punitive one. Note it as background for the risk assessment; never put it in a message.
- **Contacting before the cure is strictly worse than either alternative.** Silence is a stable state; a shipped cure is a stable state; "we're in breach and working on it" is a two-to-six-month window where the upstream holds all the initiative and Wayland cannot control the story.

### Do the upstreams respond punitively or cooperatively?

The honest answer: **cooperatively, when the cure is already done — and there is no observed case of punitive response to a good-faith completed cure.** OTF's author flagged and let Digger fix it. HashiCorp escalated to a C&D and it went nowhere against a project that produced its provenance record. Open WebUI's response to rebranded forks was to change its own licence, not to attack the forks.

But every one of those upstreams was reacting to something already visible. There is no prior-art case in this set of an upstream reacting to a _pre-emptive self-report of an unfixed breach_, so nobody should claim to know how that goes. That absence of precedent is itself an argument for the cure-first ordering.

**What the note should be if sent:** short, factual, no legal characterisation, no apology theatre, no request. State that Wayland is an AGPL-3.0 derivative that includes Apache-2.0-licensed AionUi code; that a compliance review found upstream copyright notices had been replaced rather than retained at the original import; that attribution has been restored across the identified set as of version X; link the published inventory and baseline; offer to correct anything they find wrong. Nothing else. **[COUNSEL]** should see it before it goes.

---

## What NOT to do

| Action                                                                        | Why it looks reasonable                                         | Why it makes things worse                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delete provenance comments to "clean up"**                                  | Reduces apparent over-attribution; aligns with the stated goal  | Already done once here on one sentence of justification (`3f1c5ba10`, 8 files, incl. **GPL-family** acpx/Zed and undiffable Claude Code), and the audit flagged it. Destroys the only pointer, adds a fresh removal to explain, and is internally inconsistent with surviving clauses. **Removal needs more evidence than retention, never less.** |
| **Backdate notices**                                                          | Makes the record look consistent                                | A copyright line asserting a year that predates the commit that wrote it is a fabricated record, discoverable by one `git log`, and converts a compliance gap into a credibility question.                                                                                                                                                         |
| **Rewrite git history to fabricate a cleaner lineage**                        | "Restores" the fork point; makes the tree look properly derived | Fabricated provenance. Already forbidden by this repo's own rules. And it is self-defeating: reconstructed history is only worth anything if it is _true_, and a bracketed-and-measured `BASELINE.md` is more defensible than a synthesised commit graph precisely because it shows its work.                                                      |
| **State in a shipped legal document that attribution is complete**            | Clean milestone closure                                         | Pitfall 6. Three instances of this pattern already exist in this tree and all three were found by the first serious audit. Assert method, scope, and date instead.                                                                                                                                                                                 |
| **Rely on a bundler-stripped comment as the notice**                          | The header is right there in the source                         | Verified: `esbuild` keeps only comments containing `@license`/`@preserve` or starting with `//!`/`/*!`. The tunnel trio's provenance sits in a second block with no `@license` and is dropped from every build. Verify against the packaged artifact.                                                                                              |
| **Apply the restoration to all 445 same-path files as derivation assertions** | Maximally conservative, fast                                    | Conservative for _copyright retention_, reckless for _derivation claims_. ~30 of 445 are likely Ferrox originals. ASF: _"Do not add anything to NOTICE which is not legally required"_ — each addition burdens downstream consumers. Two claim types, two standards.                                                                               |
| **Contact AionUi before the cure ships**                                      | Good faith, gets ahead of it                                    | Hands over timing and framing, creates a dated admission with no fix attached, and invites a demand. Cure first.                                                                                                                                                                                                                                   |
| **Mention AionUi's own attribution posture to AionUi**                        | It is materially relevant and verified                          | Instantly forfeits the good-faith frame and converts a cure into a fight. Background only. Never in a message.                                                                                                                                                                                                                                     |
| **Ship the confession in the release notes**                                  | Transparency                                                    | Produces the AppGet "credits but no apology" headline and taints a release. Strength-led line in the release notes; full record in a separate linkable compliance note.                                                                                                                                                                            |
| **Close WLD-I with "accept residual §4(c) risk"**                             | It's diffuse, pre-existing, and not our fault                   | Already tried in `H-FINDINGS.md` and **withdrawn as wrong** by its own author. Defensible for a diffuse concern; not for ~310 files where the upstream copyright line was replaced with ours. ReactOS is the cost of leaving a provenance question open: repository frozen, ~20 months under a cloud.                                              |

---

## Technical Debt Patterns

| Shortcut                                                          | Immediate benefit             | Long-term cost                                                                                                                                                 | When acceptable                                                                                                   |
| ----------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Measure against upstream `main` instead of a pinned baseline      | One `git clone`, starts today | Every _exclusion_ is unsafe; understates overlap; upstream drift makes it worse weekly (AionUi has already restructured)                                       | For **inclusion** and scale-bounding only. Never for exclusion.                                                   |
| One-time header sweep with no CI gate                             | Milestone closes              | Regresses on the next import; the compliance claim silently rots. OpenTofu runs a `copyright` job on every PR                                                  | Never — the gate is cheaper than the sweep                                                                        |
| Verify restored notices by `git grep` in source                   | Fast, no build                | Bundler-stripped notices pass. Already the live failure mode here                                                                                              | Only as a pre-check before the packaged verification                                                              |
| Fix an enumerated §4(b) modification list instead of deleting it  | Feels thorough                | N new falsifiable claims that drift with the tree; two of WLD-H's four CRITICALs are this                                                                      | Never — §4(b) does not require enumeration                                                                        |
| Machine-generate headers from a template constant                 | 310 files in one command      | Uniform, invisible wrong-holder/wrong-year errors at scale (Pitfall 3)                                                                                         | Only if the generator reads the pinned upstream file and **fails** rather than falling back                       |
| Defer the baseline reconstruction until the remedy is decided     | Avoids work that may be moot  | The baseline is a decaying asset — every week of upstream drift makes it harder and the inventory weaker                                                       | Never; the baseline is the input to the remedy decision, not its output                                           |
| Generate the dependency licence report from `package.json` ranges | One file to read              | Reports licences for versions you don't ship. ASF: _"Only bundled bits matter"_ and LICENSE/NOTICE _"must exactly represent the contents of the distribution"_ | Never — resolve from the lockfile's production tree, and report only what is actually bundled in the packaged app |

---

## Integration Gotchas

| Integration                                                   | Common mistake                                                | Correct approach                                                                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| esbuild / Rollup / electron-vite                              | Assuming a provenance comment survives bundling               | Wrap in `@license` (or `/*!`). Verify in the packaged artifact. Note `eof` mode **relocates** comments, which per ASF means the notices file must also carry them |
| `scripts/whatsapp-bridge-source.json` and other sha/size pins | Editing a pinned file's header without re-pinning             | Re-pin in the same commit; gate the sweep on a full packaged build. This exact file has already broken every packaged build once                                  |
| `electron-builder.yml` `extraResources`                       | Inferring that a notices file ships because it is listed      | Grep the built `.app`/`.exe`/asar. Already the WLD-I success standard                                                                                             |
| `patches/*.patch`                                             | Header edits shift context lines and the patch stops applying | Include patched files in the pin-impact list; re-run `patch-package` in the sweep's verification                                                                  |
| GitHub code search / `gh api search/code`                     | Believing a zero                                              | Run a positive control through the identical method and record it (Pitfall 9)                                                                                     |
| npm production dependency tree (144 packages)                 | Reporting from declared ranges; omitting the report entirely  | Resolve from the lockfile, restrict to what the packaged app actually contains, and ship the generated attribution file as a verified resource                    |
| Upstream AionUi tree                                          | Cloning `main`                                                | Clone at the pinned baseline sha. `main` has already restructured into `packages/desktop/**` and dropped `src/process/agent`                                      |

---

## Security / integrity mistakes

Domain-specific to compliance work rather than general appsec.

| Mistake                                                                     | Risk                                                                                | Prevention                                                                                                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Restoration commit silently invalidates a supply-chain checksum             | Packaged builds fail, or worse, a verification gate gets loosened to make them pass | Pin-impact list up front; **fix the pin, never the check** — memory records a live security check being relaxed to satisfy a fixture artifact, caught only by cross-audit |
| Relaxing a notices/header CI check to unblock a release                     | The compliance claim becomes unenforced while still being asserted                  | Treat the header gate as a required check. Note the standing trap: **a skipped required check counts as a pass**, and `paths:` filters fire on any match                  |
| Shipping an unverified generated attribution file for 144 deps              | A new class of false claims, at 144× scale, in a signed artifact                    | Generate from resolved lockfile data only; no hand-editing; verify a sample against the actual installed package's own LICENSE                                            |
| Publishing a release while the notices file contains known-false statements | Every installer built is a distributed copy of a false legal claim, and signed      | No release ships while any known-false claim is outstanding. This is a release gate, not a nice-to-have                                                                   |

---

## "Looks done but isn't" checklist

- [ ] **Restored headers:** present in the packaged `.app`/`.exe`/asar, not just in `src/` — verify by grepping the built artifact
- [ ] **Restored headers:** inside an `@license` (or `/*!`) block, verified per file, not assumed
- [ ] **Restored copyright lines:** each byte-identical to the line in the pinned baseline checkout — `grep -F` it, don't eyeball it
- [ ] **Baseline:** a pinned upstream sha exists in a checked-in document, with the candidate set and scores that justify choosing it
- [ ] **Inventory:** every _exclusion_ justified against the **baseline**, never against upstream `main`
- [ ] **Every zero and every tidy count:** accompanied by a recorded positive control through the identical method
- [ ] **Notices file:** contains no unqualified "all / every / none / complete / fully"
- [ ] **Notices file:** contains no enumerated modification list (§4(b) doesn't need one; the enumeration is where the falsehoods live)
- [ ] **Every claim in the notices file:** re-verified against the tree or the pinned upstream at the moment of the final read, not against a prior finding or a commit message
- [ ] **`notices/README.md`:** rewritten — it ships, it is stale, and it states a falsehood
- [ ] **Pins:** every touched file's sha/size manifest re-pinned in the same commit; full packaged build green
- [ ] **`3f1c5ba10`:** re-adjudicated per file, or the clauses restored pending adjudication
- [ ] **CI gate:** a header/notices check runs on every PR and is a _required_ check that cannot be satisfied by being skipped
- [ ] **Dependency report:** generated from the lockfile's resolved production tree, restricted to bundled packages, and present in the packaged app
- [ ] **Disclosure artifacts:** compliance note drafted, release-note line drafted separately, both reviewed before any release
- [ ] **Counsel:** has seen the fact-finding and signed off on the remedy and the disclosure, per the 2026-07-30 decision

---

## Recovery Strategies

| Pitfall                                                          | Recovery cost                                              | Recovery steps                                                                                                                                                                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Over-attributed: header asserts derivation for a Ferrox original | LOW                                                        | Correct in a normal commit with the per-file measurement attached. Retaining a copyright line you didn't owe carries no liability; only a _derivation assertion_ needs correcting                                             |
| Under-attributed: file 311 found after the sweep                 | LOW **if** completeness was never asserted; HIGH if it was | Method-scope-date phrasing makes this a follow-up commit. A prior "complete" claim makes it a credibility event                                                                                                               |
| Wrong holder/year across N generated headers                     | MEDIUM                                                     | Regenerate from the baseline checkout; a second corrective sweep is normal — OpenSearch needed one across 29+ repos                                                                                                           |
| Notice stripped by the bundler, found post-release               | MEDIUM                                                     | Point release. The notices file (a copied text file, not a comment) is the durable vehicle; headers are the belt                                                                                                              |
| Pin invalidated, packaged builds broken                          | MEDIUM                                                     | Re-pin. Do **not** relax the verification to make the build pass                                                                                                                                                              |
| False claim discovered in a signed shipped release               | HIGH                                                       | Point release plus a correction in the compliance note. Cannot be un-shipped; installers are already out                                                                                                                      |
| Upstream discovers it first and posts publicly                   | HIGH                                                       | Ship the cure and the record within days — Digger's ~24 hours is the benchmark. This is why the baseline and inventory artifacts should exist _before_ the remedy debate concludes: they are the only fast response available |
| DMCA takedown on npm / GitHub release                            | HIGH                                                       | **[COUNSEL]** — process and counter-notice. Mitigated by having a shipped cure and a published record before it happens                                                                                                       |

---

## Pitfall-to-Phase Mapping

Phase names are suggestions; the roadmapper owns them. Ordering is not.

| Pitfall                                     | Prevention phase                                           | Verification                                                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 8 — baseline from current `main`            | **Baseline** (first, blocking)                             | A checked-in doc with the pinned sha, candidate revisions, scores, scripts; a local checkout exists that later phases read from         |
| 9 — method artifact read as clean           | **Baseline + Inventory**                                   | Every recorded query carries a positive control and its result                                                                          |
| 1 — restoration becomes the false statement | **Inventory** (before Restoration)                         | Per-file classification with score and method; two claim types separated; exclusions justified against the baseline                     |
| 5 — invalidated pins                        | **Inventory** (produces the list) → **Restoration** (acts) | Pin-impact list exists; every touched pinned file re-pinned in the same commit; full packaged build green                               |
| 3 — wrong holder/year at scale              | **Restoration**                                            | Every emitted copyright line found verbatim (`grep -F`) in the baseline checkout; generator fails rather than templating                |
| 4 — bundler-stripped notice                 | **Restoration** + **Packaged verification**                | Sample of restored notices greppable in the built `.app`/`.exe`/asar                                                                    |
| 2 — enumerating modifications               | **Shipped-claim truth pass**                               | No enumerated §4(b) list remains; §4(b) satisfied by a modification statement plus a VCS/baseline pointer                               |
| 6 — asserting completeness                  | **Shipped-claim truth pass**                               | Lint: no unqualified universal quantifiers in shipped notices; every claim carries method, scope, date                                  |
| 7 — deleting provenance to clean up         | **Re-adjudicate `3f1c5ba10`**                              | Per-file comparison for every removal, to the `9add51a0c` standard; undiffable upstreams retained by default                            |
| Dependency report false claims              | **Dependency licence report**                              | Generated from the lockfile's resolved production tree; restricted to bundled packages; sample-verified against installed LICENSE files |
| Regression after the sweep                  | **CI gate**                                                | Header/notices check required on every PR; verified to fail on a deliberately stripped header; cannot pass by being skipped             |
| 10 — distribution risk unaddressed          | **Remedy & disclosure** (with counsel, gates the release)  | Counsel sign-off recorded; compliance note and release-note line drafted separately; no release ships with a known-false claim          |

**Ordering rationale.** Baseline before inventory, because inventory verdicts made against `main` are unsafe and would have to be redone. Inventory before restoration, because the restoration's correctness is the inventory's output. Truth pass after restoration, because the notices file must describe what actually shipped. Re-adjudication of `3f1c5ba10` is independent and can run in parallel. CI gate before the release, or the whole thing regresses on the next import. Remedy and disclosure last, and it gates the release rather than the code.

**Phases most likely to need their own deeper research:** the baseline reconstruction (the candidate-enumeration and scoring method is the novel part and the part an adversary would attack) and the dependency licence report (144 packages, tooling not yet chosen or verified). The header restoration itself is mechanical once the baseline exists.

---

## Questions for legal counsel

Per the 2026-07-30 decision, counsel reviews the remedy, not the fact-finding. These are the specific questions the fact-finding raises. None is answered here.

1. **No cure clause.** Apache-2.0 contains no termination-for-breach clause and no cure provision (verified: the only "terminate" is §3 patent litigation). What is the status of the licence grant for copies already distributed in breach of §4(c), and does a subsequent cure restore it prospectively, retrospectively, or neither?
2. **Scope of §4(c).** Does the carve-out "excluding those notices that do not pertain to any part of the Derivative Works" bear on files that have diverged substantially since the fork?
3. **Sufficiency of the remedy form.** Is a restored dual-copyright header plus a modification statement plus a checked-in baseline document sufficient, or is anything further required (a NOTICE-equivalent, an in-product credit, a README statement)?
4. **§4(b) form.** Is "these files were modified; see the published inventory and baseline" sufficient, given that VCS history for the fork point does not exist? Is the substitute artifact adequate?
5. **Distribution channels.** Exposure and process for DMCA notices to npm, GitHub, and Homebrew; counter-notice mechanics; what to have prepared in advance.
6. **Jurisdiction.** AionUi/iOfficeAI appears to be a non-US entity. Which jurisdictions govern, and does US registration status bear on statutory damages availability?
7. **Willfulness and good faith.** Does a documented, self-initiated, contemporaneous cure bear on willfulness, and does the existence of the WLD-H cross-audit (which records the defect in writing before the cure) help or hurt?
8. **Disclosure.** Should the upstream note and the public compliance note be drafted or reviewed by counsel? Should the note be sent at all, given the tradeoffs above?
9. **The Digger question.** Where a fork's cure is a provenance comment inside a file relicensed under different terms, is the upstream licence's own notice requirement discharged? Bears on the OpenClaw (MIT) and gemini-cli (Apache-2.0) portions of Wayland as well as the AionUi portion.
10. **`3f1c5ba10` and the GPL-family clause.** `IAcpClient.ts` previously named acpx and Zed's AcpConnection (GPL-family). What is the appropriate standard of investigation before that clause is either restored or left deleted, and what is the exposure if code was in fact taken?

---

## Sources

**Primary sources fetched and verified directly in this pass (HIGH confidence).** The classify-confidence seam rates the search leg MEDIUM (`websearch --verified`) and the fetch leg LOW; these specific facts are rated HIGH because they were read from the artifact, and the command is recorded so the read is repeatable.

- Apache License 2.0 full text — `curl https://www.apache.org/licenses/LICENSE-2.0.txt`; §4(a)–(d) and the final paragraph quoted verbatim; `grep -i terminat` → one hit (§3).
- OpenTofu per-file header convention — `curl raw.githubusercontent.com/opentofu/opentofu/main/internal/refactoring/remove_statement.go` and `.../internal/command/apply.go`.
- OpenTofu CI enforcement — `raw.githubusercontent.com/opentofu/opentofu/main/.github/workflows/checks.yml` (job `copyright`, lines ~189–195; job `license-checks`), `.licensei.toml`, and `raw.githubusercontent.com/opentofu/scripts/main/.github/workflows/copyright.yml`.
- Valkey notice retention — `raw.githubusercontent.com/valkey-io/valkey/unstable/src/server.c` and `.../COPYING`.
- AionUi upstream state — `gh api repos/iOfficeAI/AionUi` (Apache-2.0, 31,115 stars, created 2025-08-07, not a fork); `NOTICE`/`NOTICE.txt` → 404; `LICENSE` appendix; `packages/desktop/src/common/electronSafe.ts` header; `gh api search/code` counts 778 / 0 / 0 with controls 3 / 778 / 1404.
- Digger remediation diff — `gh api repos/diggerhq/digger/pulls/2262` (8 files, 49 additions, 0 deletions, merged 2025-09-26T21:33:50Z) and `.../pulls/2262/files`; `gh api repos/leg100/otf` (MPL-2.0, 691 stars).
- Digger post-mortem full text — `web.archive.org/web/2025/https://blog.digger.dev/post-mortem-opentaco-using-code-from-otf-without-attribution/` (the live domain no longer resolves).
- Hacker News reaction — `hn.algolia.com/api/v1/items/45412573` (3 points, one comment).

**Search- and fetch-derived (MEDIUM confidence on narrative, per the classify-confidence seam):**

- [Assembling LICENSE and NOTICE files — Apache Infrastructure](https://infra.apache.org/licensing-howto.html) — "keep NOTICE as brief and simple as possible"; "Do not add anything to NOTICE which is not legally required"; "must exactly represent the contents of the distribution"; "Only bundled bits matter"; relocated-vs-removed notices.
- [Correct copyright notices to reflect Copyright OpenSearch Contributors — opensearch-project/.github#21](https://github.com/opensearch-project/.github/issues/21) — the header conventions, the no-year/no-ARR rules, "See GitHub history for details", 29+ repos.
- [OpenTofu Responds To HashiCorp Copyright Infringement Claims — Forbes](https://www.forbes.com/sites/justinwarren/2024/04/11/opentofu-responds-to-hashicorp-copyright-infringement-claims/) and [OpenTofu forges on with beta feature that drew HashiCorp ire — TechTarget](https://www.techtarget.com/searchitoperations/news/366581612/OpenTofu-forges-on-with-beta-feature-that-drew-HashiCorp-ire) — C&D, the SCO analysis, the editor's note and disavowal.
- [OpenTofu may be showing us the wrong way to fork — InfoWorld](https://www.infoworld.com/article/2336694/opentofu-may-be-showing-us-the-wrong-way-to-fork.html) and [opentofu/opentofu#1469](https://github.com/opentofu/opentofu/issues/1469) — the allegation as originally framed.
- [OpenTofu's response to HashiCorp's cease and desist](https://opentofu.org/blog/our-response-to-hashicorps-cease-and-desist/) — methodology and posture.
- [Why HashiCorp's threats to a Terraform fork fell flat — Runtime](https://www.runtime.news/hashicorps-threats-to-a-terraform-fork-fell-flat-and-might-have-made-it-stronger/) — outcome framing.
- [Post-Mortem: OpenTaco using code from OTF without attribution — Digger blog (archived)](https://blog.digger.dev/post-mortem-opentaco-using-code-from-otf-without-attribution/) — chain of events, per-file table, five whys, remediation PRs, apology.
- [Open WebUI License](https://docs.openwebui.com/license/) and [HN discussion](https://news.ycombinator.com/item?id=43901575) — branding-protection clause from v0.6.6, rationale, fork-from-v0.6.5 escape hatch.
- [AppGet 'really helped us,' Microsoft says, but offers no apology — The Register](https://theregister.com/2020/06/01/microsoft_appget_acknowledged) and [Slashdot](https://it.slashdot.org/story/20/06/01/1447201/microsoft-now-credits-maker-of-package-manager-it-copied----but-offers-no-apology) — Clinick's statement, the non-apology framing.
- [ReactOS suspends development for source code review — Linux.com](https://www.linux.com/news/reactos-suspends-development-source-code-review/), [ReactOS Code Audit — Slashdot](https://slashdot.org/story/06/02/01/1944257/reactos-code-audit), [ReactOS — Wikipedia](https://en.wikipedia.org/wiki/ReactOS) — Jan 2006 repo lockdown through Sept 2007.
- [Christoph Hellwig's case against VMware dismissed — LWN](https://lwn.net/Articles/696764/), [Hellwig's lawsuit against VMware FAQ — Software Freedom Conservancy](https://sfconservancy.org/copyleft-compliance/vmware-lawsuit-faq.html), [GPL enforcement action dismissed — Opensource.com](https://opensource.com/law/16/8/gpl-enforcement-action-hellwig-v-vmware) — the evidentiary dismissal and the Hamburg appeal.
- [Policy for Licensing and Copyright Attribution — The Document Foundation](https://wiki.documentfoundation.org/License_Policy) (direct fetch blocked; content via search summary — treat as MEDIUM and re-verify before quoting in a shipped document) and [Licensing — LibreOffice/core](https://deepwiki.com/LibreOffice/core/1.2-licensing).
- [esbuild — Legal comments](https://esbuild.github.io/api/#legal-comments) — the definition and the `eof`/`inline` defaults.
- [Linux kernel licensing rules](https://www.kernel.org/doc/Documentation/process/license-rules.rst) and [LWN on the SPDX conversion](https://lwn.net/Articles/738159/) — the SPDX sweep as tooled, staged, multi-reviewer work (Gleixner, Ombredanne, Stewart). Background for the "a mass sweep needs review infrastructure" point; I did not verify a specific documented error from that conversion, so no such claim is made.

**Internal inputs:** `.planning/phases/WLD-H-attribution/H-CROSSAUDIT.md` (the measured findings, the method note, and the eight traps — every internal fact cited above comes from there), `.planning/PROJECT.md` (WLD-I scope and the 2026-07-30 decisions).

**Explicitly unverified — do not use:** any claim that Cherry Studio changed its licence in response to rebranded forks (my recollection; current verified state is AGPL-3.0 plus a commercial licence above 10 individuals). No documented Electron/AI-desktop-app attribution incident was found despite searching; the Digger case is the nearest in-domain analogue.

---

_Pitfalls research for: post-hoc attribution restoration in a rebranded Apache-2.0-derived Electron fork_
_Researched: 2026-07-30_
