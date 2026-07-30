# Project Research Summary

**Project:** Wayland desktop — Milestone WLD-I, Licence Compliance
**Domain:** Post-hoc third-party attribution restoration in a rebranded Apache-2.0-derived Electron/TypeScript fork (AGPL-3.0-or-later outbound)
**Researched:** 2026-07-30
**Confidence:** MEDIUM-HIGH — HIGH on measured tree facts and licence text, MEDIUM on remedy form, LOW on legal consequence

> **Reader's warning.** The four research files were written against a brief whose numbers have since been superseded by measurement. This summary carries the corrected figures; where a research file conflicts, this file wins and the correction is noted inline. Do not lift counts out of the research files without checking here first.

## Executive Summary

Wayland's root commit `2b3b60e11` (**2026-06-07**) is a squashed, rebranded import of AionUi. The fork point is **known**, supplied by the project owner: **AionUi v1.9.5, tag `5b2c741f92`, dated 2026-04-01**. Measured against that pin and committed as `.planning/phases/WLD-I-licence-compliance/AIONUI-INVENTORY.csv`, there are **1005 same-path files** (730 in `src/`, 275 outside it), classified **DERIVED-HIGH 891 · DERIVED-LIKELY 90 · REVIEW 18 · DIVERGED 6**, with **186 files at 100% literal line overlap and 333 at >=90%**. **Zero files carry an AionUi copyright notice.** The defect is not omission or drift — it is a systematic substitution: the `@license` tag and the SPDX line survived the import and only the ownership line was replaced. That is the hardest fact in the milestone to explain benignly, and it is what moves the exposure beyond a bare licence-condition question (Apache-2.0 §4(b)/§4(c), and potentially 17 U.S.C. § 1202).

The fact-finding is therefore **done**, and a large part of the remedy is **already shipped** (commits `78329477f`, `d99c70b07`). What remains is one large mechanical sweep and one legal question. The sweep is **per-file regardless of how the legal question resolves**, because Apache-2.0 §4(b) ("state THAT you changed the files") is per-file by its own words and has no central-document reading. The legal question — **does a central provenance manifest in the source tree satisfy §4(c), or must the retained notice sit in the file it was removed from?** — decides only the *content* of that sweep: whether §4(c) restoration touches 1 file or ~981. Both STACK.md and ARCHITECTURE.md identify it independently as the highest-value question for counsel.

The recommended approach is **manifest-driven, generated headers, human-signed classification**: a checked-in provenance manifest keyed to the v1.9.5 pin, a generator that reads the upstream copyright line byte-for-byte from a local pinned checkout (and *fails* rather than templating), tier-shaped commits so a 900-file diff is reviewable from a small reviewed input, and a required CI gate so the fix does not regress on the next import. The dominant risks are methodological and operational, not legal: over-attributing a Ferrox original (a false claim, shipped), generating a subtly-wrong holder or year uniformly across ~900 files, a notice that lives in source but is stripped by the bundler and never reaches the packaged artifact, a header edit silently invalidating `scripts/whatsapp-bridge-source.json` and breaking every packaged build, and asserting completeness a later audit disproves. Every one has already happened once in this repo or its immediate prior art.

## Key Findings

### Recommended Stack

**Build, don't buy.** Every off-the-shelf licence tool answers "what licence does this tree declare?" The question here is "is this file derived from that file in that upstream at that revision, and whose copyright line must it carry?" STACK.md's tool survey is sound and its rejections stand: scancode, FOSSology, ORT, licensee, ninka answer the wrong question; MOSS and simian are non-starters (network upload of proprietary source; paid and dead); PMD CPD, NiCad, SourcererCC need a JVM or TXL this box lacks with no marginal detection over jscpd. Nothing detects a genuine rewritten port — accept that and cover it with the human review protocol.

**Core technologies:**
- **Local pinned upstream checkout at AionUi v1.9.5 (`5b2c741f92`)** — the authoritative comparison corpus and the only source of the exact copyright bytes to restore. The generator must read from it, never from a template constant.
- **Hand-rolled classifier (`provcmp.mjs`-style) + `inventory.py`** — already built and run; the CSV is the output. Exact-blob → normalized-hash → substantive-line overlap.
- **`generate-license-file` 4.2.1 + `@electron/asar` list reconciliation** — the npm attribution document with the asar as ground-truth oracle. The shipped set is ~1,332 packages, not the 144 declared `dependencies`; fail CI on *ships-but-undocumented*, warn only on the reverse.
- **`rollupOptions.output.banner` (electron-vite native)** — applied after bundling, so tree-shaking cannot reach it. Stops relying on per-file comment shape.
- **`reuse` 6.2.0 (`uvx --with charset-normalizer`, scoped to `lint-file`)** — declaration conformance only; it has no vocabulary for "derived from upstream X at pin Y" and cannot replace the manifest gate.
- **Manifest + ~120-line drift checker as a required CI check** — the only gate that catches a *new* derived file arriving unattributed.

**⚠️ Corrections to STACK.md:**
- Its **fork-point method is REFUTED and must not enter the plan.** Locating a fork point by maximising git blob-set intersection cannot work here: blob identity requires byte-identical files, and the import was a rebranded snapshot that rewrote headers throughout. Reproduced locally against the 173 available upstream commits it returned a flat 223–256 shared blobs (~4% of our root) with **no peak**, and its claimed pin `b97f34b28e` **does not resolve as an object in this repo**. Record as a rejected approach so nobody retries it.
- Its **1424 / 1390 counts are void** (they rest on that unverified pin). Use 1005 / 891+90.
- Its **`web-fetch.ts` finding SUPERSEDES the old plan and generalises**: for any file also present in AionUi@v1.9.5, the chain of custody runs through **AionUi**, not the original upstream. Restoring a Google LLC notice where AionUi's own copy carries an AionUi notice would assert a lineage the upstream tree contradicts. This affects the **gemini-cli entry in the notices file wholesale**, not one file, and requires per-file verification against v1.9.5 before any notice is written.
- Root-commit date: `2b3b60e11` is **2026-06-07**, not 2026-07-06. Both appear in the corpus.

### Expected Obligations (FEATURES.md, read as obligations)

**Must do (mandatory — omission is breach):**
- **§4(b) per-file modification notice on the derived set** — textually per-file, no central-file reading, currently satisfied on zero files. The strongest single finding in the corpus.
- **§4(c) restore the AionUi copyright *alongside* the Ferrox line.** §4's final paragraph expressly blesses the dual form; the defect is that Ferrox **replaced** rather than **joined**.
- **Per-file verification of the gemini-cli / non-AionUi upstream claims against v1.9.5** before writing any notice.
- **OpenClaw MIT notices** on the tunnel trio and `channels/types.ts`, in the `@license` form that survives bundling.
- **Re-adjudicate `3f1c5ba10`** (acpx / Zed / Codex CLI / Claude Code) to the same per-file standard the OpenClaw removals got. Default pending adjudication: **restore**. Undiffable upstreams (Claude Code) stay UNVERIFIED and retained.

**Already done — do not re-plan as future work** (`78329477f`, `d99c70b07`): verbatim Apache-2.0 text restored (the appendix placeholder had been overwritten with our name); `notices/OfficeCLI-NOTICE.txt` shipped verbatim; four false claims removed from the shipped notices file (blanket §4(d) claim; enumerated §4(b) list containing the false `.wcore.toml` / `~/.wcore` claims; gemini-cli blanket header claim; "every file carries a header"); three smaller corrections (pptx2json not "verbatim", 7zip-bin not "solely Windows", OfficeCLI digests read locally); `notices/README.md` rewritten; whatsapp-bridge added to `.prettierignore`; false authorship claim retracted.

**Should do (defensible posture, not strictly owed):**
- OpenSearch-style convention: additive dual notice, no year on our own line, retain the upstream's year, **no enumeration** of modifications — "modified, see the published inventory" (enumeration is exactly where the four false claims came from).
- Published provenance record asserting **method, scope and date**, never completeness.
- npm dependency licence report from the resolved production tree, reconciled against the asar.
- Required CI header/notices gate.

**Defer:** the per-file `SPDX-License-Identifier` question (locked: leave alone); SBOM unless a customer demands it.

**⚠️ Corrections to FEATURES.md:** its "2615 files declare Apache-2.0" is wrong. Measured: **1650 declaring Apache-2.0, 0 declaring AGPL**. The 1650-vs-0 fact is real; only the count was off. Its framing of the per-file SPDX identifier as a problem to fix here is overruled. Its ~310 / 445 scope figures are superseded by 1005.

### Architecture Approach

ARCHITECTURE.md's central structural insight holds and is the most useful thing in the corpus: **Apache-2.0 puts §4(c) and §4(d) in different distribution forms, and the repo has been treating them as one problem.** §4(c) binds the **source form** (the git repo / AGPL §6 Corresponding Source) — Rollup is irrelevant to it. §4(a)/§4(d) bind the **object form** and are already satisfied by `electron-builder.yml`'s `extraResources` copy of `notices/` and `LICENSES/`. Separating them makes a manifest a legitimate source-form remedy rather than a dodge.

**Major components:**
1. **`scripts/provenance/aionui.json`** — source of truth: path, upstream path, pin (`5b2c741f92`), measurement, classification, reviewer, date. Lives in `scripts/`, **not** `notices/` — anything in `notices/` ships, and a shipped classification error is a shipped false claim.
2. **`scripts/provenance/aionui.tree.json`** — checked-in path index of the pinned upstream tree so the new-file check is offline and deterministic. Without it the check needs the network, goes flaky, gets disabled, and the mechanism dies.
3. **`scripts/provenance/apply.mjs`** — renders headers from the manifest, reading exact upstream copyright bytes from the local pinned checkout. `--check` default, `--write` opt-in.
4. **`tests/unit/scripts/provenanceManifest.test.ts`** — the load-bearing gate, cloned from the proven `whatsappBridgeSourcePin.test.ts` pattern. Seconds, no build, no network.
5. **Per-file `@license` header** — retained upstream notice plus the §4(b) statement, folded inside a single block so it survives bundling.
6. **`notices/THIRD-PARTY-NOTICES.md`** — the human-readable §4(d) vehicle and the durable one (a copied text file, not a comment). Primary; headers are the belt.

**⚠️ Corrections to ARCHITECTURE.md:** its "3966 files / 2316 missing / 42% coverage" is **WRONG** — inflated denominator. Measured two ways (`find` and `git ls-files` agree): `src/` contains **2057** tracked `.ts`/`.tsx` files, **1626** carry an `@license` header (**79% coverage, 431 without**). That weakens its "there is no existing invariant to protect" argument, though its conclusion (do not add headers to unheadered files with no upstream notice to retain) still stands. Its 445/504 scope and `f37a6187` comparison revision are superseded. Its baseline-reconstruction proposal is obsolete.

### Critical Pitfalls

1. **The restoration itself becomes the false statement.** A sweep sized to "all same-path files" over-attributes the ~24 REVIEW/DIVERGED files. Split into two claim types: a **copyright retention** is conservative (over-applying costs credit you didn't owe, no liability — bias inclusion); a **derivation assertion** (a `Source:` path, a notices claim) is a factual claim needing the measurement attached.
2. **Wrong holder / wrong year, uniformly, ~900 times.** Templating normalises. Rule: **copy the notice byte-for-byte from the pinned revision and never modernise it.** A copyright string as a constant is the warning sign; the generator must fail rather than fall back.
3. **The notice ships as a bundler-stripped comment — a notice that does not exist.** esbuild keeps only comments containing `@license`/`@preserve` or starting with `//!`/`/*!`. The tunnel trio's provenance sits in a second block with no `@license` and is dropped from every build today. Verify against the **packaged artifact**, never `git grep`. Corollary: `eof` mode *relocates* rather than deletes, and ASF's rule is that relocated notices must be preserved in NOTICE — another reason the notices file is primary.
4. **A header edit invalidates a pin and every packaged build fails.** `scripts/whatsapp-bridge-source.json` has done this once. Produce a pin-impact list up front (bridge digests, OfficeCLI shasums, bundled-wayland-core shasums, `patches/*.patch` context lines), re-pin in the same commit, gate on a full packaged build — never a green `tsc`. **Fix the pin, never the check.**
5. **Asserting completeness.** Three instances already existed in this tree and all three were found by the first serious audit. Assert **method, scope, date**; never "all/every/none/complete/fully".
6. **Enumerating modifications the licence never asked for.** §4(b) requires only a statement *that* you changed the files. Default action on an enumerated claim is **delete**, not correct.
7. **Deleting provenance to "clean up."** Removal requires strictly *more* evidence than retention. Where an upstream cannot be diffed at all, the comment can never be disproven and must stay.

### Durable method guidance (carry into every measuring phase)

- **Calibration is mandatory.** Any provenance metric needs a known-adapted **positive control** and an unrelated **negative control** before its numbers mean anything — an unrelated Ferrox original shared **45% of identifiers** with an unrelated upstream. A run whose controls are not reproduced is void.
- **Shared third-party API vocabulary is not evidence.** Shared **hand-authored helper names** are. A shared name appearing only as an *import* of a helper defined in an attributed sibling needs no notice of its own — the notice belongs on the definition.
- **Every zero and every tidy count needs a recorded positive control through the identical method.** `ls` is never acceptable; use `find -type f`. Anchored regexes over `strings` output on a binary return 0 for structural reasons.
- **Operational trap:** `rtk` intercepts `git log` and **silently truncated 18,151 commits to 50** during this research. Any enumeration must use `rtk proxy git …` or `child_process.execFile`. A short commit list is a method artifact, not evidence.

## Implications for Roadmap

Ordered and concrete; each marked **BLOCKED on §4(c)** or **NOT BLOCKED**.

### Phase 1: Ship the §4(c) question to counsel — day one
**NOT BLOCKED** (it *is* the unblocking action)
**Rationale:** One question sizes the largest phase. Ask it first and alone.
**Delivers:** the §4(c) placement question; plus the literal §4(b) wording, whether the upstream copyright must precede ours, the overlap threshold below which "independent" is defensible, sufficiency review of the remedy form, and the `3f1c5ba10` GPL-family standard of investigation.
**Constraint:** counsel reviews the **remedy**, not the fact-finding. Hand over the inventory CSV, the header template, the notices diff — five decisions, not 981 files. Do not ask whether files are derived (measured), whether AionUi ships a NOTICE (404), or whether Apache-2.0 is AGPL-compatible (settled).

### Phase 2: Small, settled, independent notices work
**NOT BLOCKED**
**Delivers:** OpenClaw MIT notices on the tunnel trio + `channels/types.ts` in the surviving `@license` form; six OpenClaw header dialects collapsed to one across ~30 files (adopt the `backoff.ts` form — 32 measured surviving instances — and preserve the inline per-function `// Adapted from openclaw/… (MIT).` comments, which are the good pattern); `backends/baileys.js` header **isolated in its own commit** with the digest re-pinned in the same commit, `whatsappBridgeSourcePin.test.ts` as the gate.
**Avoids:** Pitfalls 3, 4, 5. Do **not** run `bun run format` — bare `oxfmt` reformats the pinned bridge directory.

### Phase 3: Per-file chain-of-custody verification of non-AionUi upstream claims
**NOT BLOCKED**
**Rationale:** the `web-fetch.ts` finding generalises — the **gemini-cli notices entry is wrong wholesale**. Writing a Google LLC notice on a file whose AionUi copy carries an AionUi notice asserts a lineage the upstream contradicts. This phase stops the cure creating a new false claim.
**Delivers:** for every file attributed to gemini-cli (and every other non-AionUi upstream), the verdict on whose copyright line the v1.9.5 file itself carries, recorded per file; the notices entry rewritten to match.

### Phase 4: Manifest scaffold, generator, drift test, upstream tree index
**NOT BLOCKED**
**Delivers:** `aionui.json` seeded from `AIONUI-INVENTORY.csv`; `aionui.tree.json`; `apply.mjs` (`--check` default, reads the pinned checkout, fails rather than templating); `provenanceManifest.test.ts`; the pin-impact list; recorded positive + negative calibration controls.
**Rejects:** blob-set-intersection fork-point search — record as a dead end.

### Phase 5: The header sweep — tier-shaped, generated, human-signed
**BLOCKED on §4(c)** for the *content* of the §4(c) half. **NOT BLOCKED** for the §4(b) half — §4(b) is per-file regardless, so the sweep happens either way and the §4(c) answer changes what each header says, not whether the sweep exists.
**Rationale:** one decision applied N times is one review. A large generated diff is not a bulk cleanup bomb if reproducible from a small reviewed input — put the exact `--check` command and output in every PR body.
**Delivers:** split by classification tier × edit-kind (modify-existing-header vs add-where-none-exists) × upstream: DERIVED-HIGH (891), DERIVED-LIKELY (90), REVIEW (18 — read every file, `note` required), DIVERGED (6 — default *independent*, a derived verdict needs a written reason). Record the **negative** determinations with the same fields, which is precisely what `3f1c5ba10` was faulted for omitting. The 275 files outside `src/` are a separate packet: they never reach the object form, so only §4(c) applies.
**Avoids:** Pitfalls 1–4. Every emitted copyright line must be `grep -F`-able verbatim in the pinned checkout. Verbatim-copy files get **no** Ferrox copyright and no §4(b) statement — claiming copyright in an unmodified copy is a false claim, and ASF forbids adding the Apache header to third-party files.
**Constraint:** conventional-commit `type(scope): subject` enforced `--strict --force-scope`. No history rewriting.

### Phase 6: Re-adjudicate `3f1c5ba10`
**NOT BLOCKED** for fact-finding; the acpx/Zed **GPL-family** restore-or-leave call is a counsel item.
**Delivers:** per-file comparison for every removal, to the `9add51a0c` standard. Claude Code is closed source and undiffable — verdict UNVERIFIED, pointer **restored**, because a deleted pointer is unrecoverable and a retained one carries no liability.

### Phase 7: npm dependency licence report
**NOT BLOCKED** — fully parallel.
**Delivers:** `generate-license-file` output reconciled against `@electron/asar list` over the real artifact; CI fails on *ships-but-undocumented*, warns on the reverse; an explicit "could not determine" section for the ~59 packages shipping no licence file of their own. Generate from resolved lockfile data only; no hand-editing.

### Phase 8: Bundle-retention hardening and packaged-artifact verification
**NOT BLOCKED** (input is Phase 5's output, so it lands after)
**Delivers:** a generated `output.banner` from `notices/BUNDLE-NOTICE.txt` (must open `/*!` or contain `@license`), generated from the manifest in `prebuild` so shipped notice and manifest cannot drift; `verify-notices-in-bundle.mjs` asserting each `requiredNotice` appears in `out/main/**`, `out/preload/**`, `out/renderer/**`; the **inverse** assertion that a retracted notice is *absent*; run under `bun run dist:verify:mac`, never raw `electron-vite build`.

### Phase 9: Required CI gate
**NOT BLOCKED** (must land after Phase 5 or it fails on its own remediation target)
**Delivers:** manifest drift check + new-file check (a file at a path in the pinned upstream index and absent from the manifest fails, naming the file) + scoped `reuse lint-file $CHANGED` + header-shape check, as **explicit CI steps with scoped file arguments** (`prek run --all-files` is forbidden). Verified to fail on a deliberately stripped header.
**Standing trap:** a **skipped** required check counts as a **pass**, and `paths:` filters fire on any match. Fail closed if the pinned-upstream cache is missing.

### Phase 10: Remedy sign-off and disclosure — gates the release, not the code
**BLOCKED on §4(c)** and on counsel sign-off.
**Rationale:** the sanction that bites is distributional, not judicial — a DMCA notice costs the upstream a web form. Across every attribution-specific case in the prior art, **zero** produced litigation; observed consequences were a removed launch post, a C&D that went nowhere, an emergency licence change, and a permanent public record.
**Delivers:** counsel sign-off recorded; a **compliance note** (separate, linkable repo doc) with the full factual record — method, pin `5b2c741f92`, counts, what was restored, what remains open; a **separate** strength-led release-note line. Do not merge the two: the release note carrying the confession produces the AppGet "credits but no apology" headline; the compliance note carrying spin loses credibility. **No release ships while any known-false claim is outstanding.**
**Locked constraint:** **do NOT contact AionUi now.** PITFALLS.md recommends post-cure notification; the owner's decision is **no contact**, and the cure comes first regardless.

### Phase Ordering Rationale

- **Counsel first** because one question sizes Phase 5 and is the only true long-pole.
- **Everything cheap and settled runs in parallel immediately** (2, 3, 4, 6, 7). Sequencing a false-statement correction behind a legal decision is a mistake.
- **No baseline phase exists.** The fork point is supplied and the inventory is committed. Every recommendation to reconstruct, bracket, or argmax-search a baseline is obsolete; the blob-intersection method is refuted.
- **Phase 3 before Phase 5** so the sweep does not write a Google LLC notice onto a file whose custody runs through AionUi.
- **Phase 4 before Phase 5** because the manifest makes the sweep reviewable and the generator stops Pitfall 3.
- **Phase 8 after Phase 5** (verifies its output in the packaged artifact). **Phase 9 after Phase 5** or it blocks its own remediation. **Phase 10 last**, gating the release.

### Research Flags

Needs deeper research during planning:
- **Phase 3** — the generalisation is identified but not executed; per-file verdicts against v1.9.5 do not exist, and the answer rewrites a shipped notices entry.
- **Phase 6** — acpx / Zed / Codex CLI are cloneable and have not been cloned; Claude Code stays UNVERIFIED.
- **Phase 7** — the ~59 packages shipping no licence text need it resolved from the registry/SPDX corpus; that residue is manual.

Standard patterns, skip research:
- **Phase 5** — mechanical once pin, inventory and generator exist; the OpenSearch / Linux-kernel SPDX-sweep pattern is well documented.
- **Phases 4, 9** — drift-test pattern already proven in-repo (`whatsappBridgeSourcePin.test.ts`); OpenTofu's `copyright` job is the reference CI shape.
- **Phase 2** — settled findings, small diffs.

## Locked Decisions — constraints, never open questions

| Decision | Owner call |
|---|---|
| Inventory before remedy | Done. `AIONUI-INVENTORY.csv` committed. |
| The WLD-H branch | Fold into this milestone; do **not** merge as a standalone compliance packet. |
| Outside legal review | On the **remedy** decision only, not on fact-finding. |
| Contacting AionUi | **No contact now.** PITFALLS.md's post-cure notification recommendation is overruled; the cure comes first regardless. |
| Discord attribution | **Stays.** Provenance UNVERIFIED; asymmetric risk favours keeping it. |
| Per-file `SPDX-License-Identifier: Apache-2.0` | **Leave it alone** (ARCHITECTURE.md Q2 verdict), notwithstanding FEATURES.md framing it as a problem. Panel disagreement recorded; recommendation is leave it. It is not a compliance defect and cannot become one — an identifier more permissive than the outbound licence over-grants Ferrox's own rights, and no third party has a claim. |

## The One Question That Sizes the Milestone

> **Does a central provenance manifest in the source tree satisfy Apache-2.0 §4(c), or must the retained notice sit in the file it was removed from?**

It decides whether the §4(c) restoration is **1 file or ~981**. Both STACK.md and ARCHITECTURE.md identify it independently; if only one question gets asked, ask this one, first and alone.

**Crucially it does not gate the existence of the sweep.** §4(b) — "state THAT you changed the files" — is per-file by its own words with no central-document reading (HIGH confidence). The per-file pass happens either way; the §4(c) answer changes its **content**, not its existence. Plan Phase 5 as happening, and treat its §4(c) payload as the variable.

The authorities genuinely split on §4(c) and the research is honest about it: SFLC (2012) says *"it's usually acceptable to move notices from individual source files to a central attribution file"*; against that, the verb is "retain" not "include", §4(d) enumerates permitted locations where §4(c) enumerates none (*expressio unius*), and ASF's own policy for **third-party** works — exactly the Wayland/AionUi relationship — is a flat *"Do not modify or remove any copyright notices or licenses within third-party works."*

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Scope / inventory | **HIGH** | Measured against a supplied pin, committed as a CSV. Supersedes every count in the research files. |
| Stack | **MEDIUM-HIGH** | Everything recommended was executed locally. One major method (blob-intersection fork-point search) refuted; one file count (1424/1390) void. ORT/FOSSology/PMD/NiCad rows doc-read, not executed. |
| Obligations | **MEDIUM-HIGH** | Licence text read verbatim; §4(b) per-file and the no-cure-clause finding are HIGH. Two counts wrong (2615 → 1650). §1202 framing MEDIUM; quantification LOW. |
| Architecture / remedy design | **MEDIUM** | Source-form vs object-form separation is HIGH and load-bearing. Header-coverage measurement materially wrong (42% → 79%). The header *form* is a proposal, not a standard — there is no SPDX/REUSE tag meaning "derived from upstream X", and that absence is the answer: standardise locally, generate from the manifest. |
| Pitfalls / prior art | **MEDIUM-HIGH** | Primary artifacts fetched directly. Narrative framing MEDIUM. Its baseline-reconstruction section is obsolete. |
| Legal consequence | **LOW** | No Apache-2.0-specific attribution enforcement case found — that absence is the finding. *Jacobsen v. Katzer* is the nearest frame and cuts against us; *Hellwig v. VMware*'s evidentiary difficulty is **absent** here (one holder, one upstream, identical paths, 186 files at 100%). Refuse to quantify probability. |

**Overall confidence:** MEDIUM-HIGH on what to do and in what order. LOW on what it is worth legally — which is precisely why the remedy goes to counsel and the fact-finding does not.

### Gaps to Address

- **The §4(c) placement question.** Unresolvable internally. Phase 1 ships it; Phase 5 is sized by the answer. Plan Phase 5 as happening either way.
- **Chain of custody for every non-AionUi upstream.** The gemini-cli notices entry is wrong wholesale and the per-file verdicts do not exist. Phase 3 closes it; nothing may write a non-AionUi notice before it does.
- **`3f1c5ba10` re-adjudication not run.** Pipeline specified, upstreams not cloned. Claude Code stays UNVERIFIED by construction.
- **Licence text for the ~59 shipped packages carrying none of their own.** Explicit "could not determine" section, no silent omission.
- **The 18 REVIEW and 6 DIVERGED files.** Human adjudication, one row per file, five columns filled: upstream candidate set enumerated by `find`; best-match upstream file across the *whole* tree, not the plausibly-named sibling; the three-way split of shared identifiers; whose copyright the upstream file itself carries; verdict + asymmetry note. No verdict without all five.
- **Pin-impact list not yet enumerated.** Phase 4 must produce it before Phase 5 touches a byte. Fix the pin, never the check.
- **Superseded figures still live in the four research files** — they were not rewritten. Anyone quoting 445, 503, 550, ~310, 455, 1424, 1390, 2615, 3966, 2316, `b97f34b28e`, `f37a6187`, or 2026-07-06 is quoting a superseded number. Authoritative source: `AIONUI-INVENTORY.csv` plus the corrections in this file.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/WLD-I-licence-compliance/AIONUI-INVENTORY.csv` + `inventory.py` — authoritative scope, measured against AionUi v1.9.5 (`5b2c741f92`, 2026-04-01).
- Fork point supplied by the project owner: AionUi **v1.9.5**, tag `5b2c741f92`.
- `notices/Apache-2.0.txt` and root `LICENSE`, read verbatim — Apache-2.0 §1 definitions, §3, §4(a)–(d) and the final paragraph; AGPL-3.0 §4, §5(a)–(d), §6, §7 (incl. §7(b) and final ¶), §8, §13.
- `https://www.apache.org/licenses/LICENSE-2.0.txt` — `grep -i terminat` → exactly one hit (§3, patent-defensive). **No general termination clause and no cure provision.**
- ASF Source Header and Copyright Notice Policy — *"Do not modify or remove any copyright notices or licenses within third-party works"*; *"Do not add the standard Apache License header to the top of third-party source files."*
- In-tree measurements, 2026-07-30: `src/` = **2057** tracked `.ts`/`.tsx`, **1626** with an `@license` header (79%), **1650** declaring Apache-2.0, **0** declaring AGPL, **0** carrying an AionUi copyright.
- Commits `78329477f`, `d99c70b07` (already-shipped remedy); `0aac367bc`, `b11f6ad87`, `fc7939423` (inventory rebaselining); `3f1c5ba10`, `9add51a0c`, `485b212ff`.
- `.planning/phases/WLD-H-attribution/H-CROSSAUDIT.md` — the method, its calibration controls, and the eight traps that each cost a wrong verdict.
- Rollup 4.59.0 / esbuild 0.28.0 comment-retention matrix measured against this repo's `node_modules`; `@electron/asar list` over the real `out/mac-arm64` artifact.
- GitHub contents API probes: OfficeCLI `NOTICE` → 200; AionUi / aionrs / gemini-cli → 404. **§4(d) binds for OfficeCLI only.**

### Secondary (MEDIUM confidence)
- SFLC, *Managing Copyright Information within a Free Software Project* (2012) — strongest authority **for** central relocation.
- SFLC *Guide to GPL Compliance* 2nd ed.; SFC *Principles of Community-Oriented GPL Enforcement*.
- `opensearch-project/.github#21` — header convention at fork scale across 29+ repos; no year on the fork's own line, retain the upstream's; *"Modifications Copyright OpenSearch Contributors. See GitHub history for details."* Note it is itself a **correction** issue — plan for two passes.
- OpenTofu SCO analysis + the `copyright` CI job (`checks.yml`, `copyright_check.sh`, `.licensei.toml`) — the provenance record as the asset, enforced per-PR.
- Digger / OpenTaco vs OTF (Sept 2025) — closest analogue: per-symbol provenance table in a shipped file, cured within ~24 hours. Steal the table and the speed; avoid the five-whys framing.
- Valkey ← Redis — the cheapest model (never remove anything), forfeited at our root commit.
- Open WebUI licence tightening — the realistic downside channel: not a lawsuit, but an upstream that hardens terms and strands the fork at the last permissive revision.
- esbuild *Legal comments* docs — the `@license`/`@preserve`/`//!`/`/*!` definition and the `eof`/`inline` defaults.
- REUSE Specification 3.3 — `Copyright` is a valid notice prefix, so no `SPDX-FileCopyrightText:` migration is needed.

### Tertiary (LOW confidence — needs validation, do not ship)
- 17 U.S.C. § 1202 / § 1203 framing and any per-violation arithmetic — counsel only.
- *Jacobsen v. Katzer* applied to Apache-2.0 (Artistic License, Fed. Cir.); *Doe v. GitHub* identicality question (argued 2026-02-11, no ruling as of this research).
- TDF `License_Policy` — direct fetch blocked, content via search summary. Re-verify before quoting in a shipped document.
- Any claim that Cherry Studio changed its licence in response to rebranded forks — **unverified recollection, do not use.**
- Software Heritage provenance-endpoint gating — single web source.

### Explicitly rejected (record so nobody retries)
- **Fork-point location by git blob-set intersection maximisation.** Cannot work on a rebranded snapshot that rewrote headers: blob identity requires byte-identical files. Reproduced locally against 173 available upstream commits it returned a flat 223–256 shared blobs (~4% of our root) with no peak, and its claimed pin `b97f34b28e` does not resolve as an object in this repo.
- **Baseline reconstruction / bracketing / argmax search.** Moot — the fork point is supplied.
- **Comparing against upstream's current `main`.** It has restructured into `packages/desktop/**`; valid only as a lower bound for inclusion, never as a basis for exclusion.
- **MOSS, simian, PMD CPD, NiCad, SourcererCC, scancode / FOSSology / ORT / licensee / ninka as the derivation classifier.**
- **`rollup-plugin-license`'s `thirdParty` half** — lists only bundled deps, and `externalizeDepsPlugin()` means main-process deps are not bundled.
- **`prek run --all-files`** — forbidden by this repo. Scoped CI steps only.
- **`hashicorp/copywrite`** — enforces one uniform header; this tree needs per-file variable upstream attribution driven by a manifest.

---
*Research completed: 2026-07-30*
*Ready for roadmap: yes*
