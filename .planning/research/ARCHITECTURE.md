# Architecture Research — WLD-I Attribution Restoration (remedy design)

**Domain:** Licence-compliance remediation over an Electron/TypeScript monorepo (~4k source files, one dominant Apache-2.0 upstream, four MIT upstreams, AGPL-3.0-or-later outbound)
**Researched:** 2026-07-30
**Confidence:** HIGH on the tree facts (all re-measured in this worktree, commands recorded). MEDIUM on the header design (standards read directly, but the standards do not settle the question). LOW→counsel on five explicitly marked items.
**Measured in:** `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution` @ `ab675a9a3` (branch `packet/attribution-audit`, local only)

---

## ⛔ Read first — five premises in the brief are wrong, and two of them change the design

I was told not to trust the brief's summary of conventions. Correct.

| Brief said                                                         | Tree says                                                                                                                                                                                                                   | Effect on design                                                                                                                                                                                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "~2600 src/ files carry a header"                                  | **1,650** files carry `@license`; 1,649 carry `SPDX-License-Identifier: Apache-2.0`; 1,628 carry `Copyright 2026 Ferrox Labs`                                                                                               | The SPDX sweep in Q2 is 1,650 files, not 2,600 — but see next row, which matters more                                                                                                                             |
| "every file header declares SPDX Apache-2.0"                       | There are **3,966** `.ts`/`.tsx` files in `src/`. **2,316 of them have no licence header at all.** The header convention covers 42% of the tree                                                                             | There is no existing invariant to protect. "Don't break the universal convention" is not an argument that exists, because the convention is not universal. The real cost argument is diff volume, not consistency |
| "~310 appearing to be AionUi-derived" (445 same-path)              | **445 same-path in `src/` — exact, reproduced.** Plus **59 more outside `src/`** (`tests/e2e/specs` ×32, `tests/e2e/helpers` ×9, `tests/unit/renderer` ×4, others). True candidate set is **504**                           | **Scope gap.** `PROJECT.md` scopes the milestone to "all 445 same-path files". §4(c) binds the _source form_, and `tests/` is in the source form Ferrox distributes. The 59 must be in scope                      |
| "lint-staged runs oxfmt on `*.md`, which repads that dir's README" | **lint-staged is dormant.** `core.hooksPath=.husky/_`; `.husky/` contains no user hooks, so `.husky/_/h` hits `[ ! -f "$s" ] && exit 0`; nothing invokes `lint-staged`. And the bridge README needs no edit at all (see Q7) | The stated collision is not the live one. The live one is `bun run format` — bare `oxfmt`, and `.prettierignore` contains only `mobile/`                                                                          |
| (implied) the whatsapp-bridge pin is stale                         | **All 9 digests currently match.** The D-01 staleness is already repaired on this branch                                                                                                                                    | The pin is a live control, so any edit breaks it — but there is a seconds-fast unit test that proves the re-pin. See Q7                                                                                           |

Two of these are load-bearing. The 59-file scope gap has to reach `ROADMAP.md`. The header-coverage number (42%, not ~100%) is what makes the Q2 answer defensible rather than hand-wavy.

**Side findings, out of scope, flag and move on:** (a) because `core.hooksPath` overrides `.git/hooks/`, the ratchet pre-commit hook that blocks staged secrets and AI signatures **never runs** — that is a live security-hygiene gap unrelated to licensing; (b) `.oxlintrc.json` ignores `src/agent/gemini/cli/`, a path that does not exist (the real one is `src/process/agent/gemini/cli/`), so that ignore has never matched.

---

## Standard Architecture

### System Overview — where each obligation actually binds

The single most useful thing this research found is that Apache-2.0 puts §4(c) and §4(d) in **different distribution forms**, and the repo has been treating them as one problem.

```
┌───────────────────────────────────────────────────────────────────────────┐
│  SOURCE FORM  — the git repo / AGPL §6 Corresponding Source               │
│  Apache-2.0 §4(c) binds HERE, and only here:                              │
│  "You must retain, in the Source form of any Derivative Works that You    │
│   distribute, all copyright, patent, trademark, and attribution notices   │
│   from the Source form of the Work"          (notices/Apache-2.0.txt:100) │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ per-file headers │  │ manifest         │  │ notices/*.md            │  │
│  │ 1,650 of 3,966   │  │ (does not exist  │  │ ships too, so it also   │  │
│  │ ts/tsx           │  │  yet — Q3)       │  │ satisfies §4(d)         │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────────────┘  │
│         ↑ Rollup is IRRELEVANT to this layer                              │
├───────────────────────────────────────────────────────────────────────────┤
│  BUNDLER  — Rollup / electron-vite                                        │
│  Retains a leading /** */ block IFF it contains @license or @preserve      │
│  VERIFIED EMPIRICALLY in out/main/, not read from docs:                    │
│    "Portions adapted from OpenClaw (…)"              → 30 instances kept   │
│    "Portions adapted from OpenClaw <…>@aee2681a"     →  2 instances kept   │
│    @license blocks in out/main/index.js alone        → 10                  │
├───────────────────────────────────────────────────────────────────────────┤
│  OBJECT FORM  — the packaged .app / .exe                                  │
│  §4(a) + §4(d) bind here. ALREADY SATISFIED, verified in                   │
│  electron-builder.yml:110-126 —  notices/ → notices/,  LICENSES/ →         │
│  LICENSES/,  src/vendor/pptx2json/LICENSE → LICENSES/pptx2json.txt         │
└───────────────────────────────────────────────────────────────────────────┘
```

**Why this matters:** the panic in `H-CROSSAUDIT.md` conflates "the notice is missing from the file" (a §4(c) source-form question) with "Rollup strips the notice" (a §4(d) object-form question that `notices/` already answers). Separating them is what makes a manifest a legitimate remedy instead of a dodge, and it is why the risky 504-file sweep can be sequenced _after_ a cheap, complete source-form fix.

⚖️ **LEGAL-GATED, and it is the pivot of the whole milestone:** does a central `scripts/provenance/aionui.json` in the source tree satisfy "retain … in the Source form" on its own, or does the notice have to sit in the file it was removed from? This single question decides whether Wave 3 is **one file** or **504 files**. Nothing else in this document is worth as much to ask counsel.

### Component Responsibilities

| Component                                       | Responsibility                                                                                       | Implementation                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `scripts/provenance/<upstream>.json`            | Source of truth: path, upstream path, upstream revision, measurement, classification, reviewer, date | New. Hand-classified, machine-consumed                                                                                  |
| `scripts/provenance/<upstream>.tree.json`       | Checked-in path index of the pinned upstream tree                                                    | New. Makes the new-file check offline and deterministic — without it the check needs network, goes flaky, gets disabled |
| `scripts/provenance/apply.mjs`                  | Renders headers from the manifest. `--check` default, `--write` opt-in                               | New                                                                                                                     |
| `tests/unit/scripts/provenanceManifest.test.ts` | Binds manifest ↔ tree. Fails if a header drifts or a same-path file is unclassified                  | New. Clone of the proven `whatsappBridgeSourcePin.test.ts` pattern                                                      |
| Per-file `@license` header                      | Carries the retained upstream notice and the §4(b) modification statement                            | Exists in 1,650 files; generated for the derived set                                                                    |
| `notices/THIRD-PARTY-NOTICES.md`                | Human-readable §4(d) + project-level §4(b) record. Ships                                             | Exists; carries 4 false claims                                                                                          |
| `LICENSES/` + `notices/*.txt`                   | §4(a) licence texts. Ship                                                                            | Exists and verified shipping                                                                                            |
| `scripts/whatsapp-bridge-source.json`           | Integrity pin over 9 files. **Adversarial to editing**                                               | Exists, currently valid                                                                                                 |

---

## Q1 — The header format

### Constraints the design must satisfy simultaneously

1. **Apache §4(c)** — retain the upstream copyright notice. Verbatim from `notices/Apache-2.0.txt:100-104`.
2. **Apache §4(b)** — `notices/Apache-2.0.txt:97-98`: _"You must cause any modified files to carry prominent notices stating that You changed the files."_ Note what it does **not** require: no description of _what_ changed, no date, no format.
3. **Survive Rollup** — the attribution text must live inside the same `/** */` block as `@license`. Verified empirically above.
4. **Machine-parseable** — REUSE 3.3: header MUST contain ≥1 Copyright Notice and ≥1 `SPDX-License-Identifier`.
5. **Not create a 7th dialect** — the tree already has six.
6. **ASF policy** (the most on-point authority found): _"Do not modify or remove any copyright notices or licenses within third-party works"_ and _"Do not add the standard Apache License header to the top of third-party source files."_ The tree did **exactly both**, 301 times.

### The literal header — AionUi-derived AND Ferrox-modified

Copy-paste this. This is the primary form; the generator emits it.

```typescript
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Derived from AionUi <https://github.com/iOfficeAI/AionUi>@f37a6187
 * Source: packages/desktop/src/common/electronSafe.ts
 * Modified by Ferrox Labs. This file is not the upstream file.
 * Licensed under the Apache License, Version 2.0 - see notices/Apache-2.0.txt
 */
```

Applied to the proof case, the diff against the current tree is exactly this — `src/common/electronSafe.ts` today reads `Copyright 2026 Ferrox Labs` alone, and **upstream at the pinned revision reads `Copyright 2025 AionUi (aionui.com)` in the identical four-line shape.** I fetched it:

```
$ curl -s https://raw.githubusercontent.com/iOfficeAI/AionUi/f37a6187f034c6697d4095c4ad4f7556d19fd2e5/packages/desktop/src/common/electronSafe.ts | head -5
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */
```

**That is the whole finding in five lines.** Our 1,650-file header convention _is_ AionUi's header convention with the copyright holder substituted. It is not an independent Ferrox style that happens to omit an upstream — it is a systematic substitution. That makes the §4(c) exposure worse to describe and the fix simpler to execute: restore the line that was replaced, in place, above ours.

### Variants

**Verbatim copy, no Ferrox modification** — no Ferrox copyright, no §4(b) statement. Claiming a copyright in an unmodified copy is a false claim, and §4(b) does not apply to an unmodified file.

```typescript
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unmodified copy from AionUi <https://github.com/iOfficeAI/AionUi>@f37a6187
 * Source: packages/desktop/src/common/electronSafe.ts
 * Licensed under the Apache License, Version 2.0 - see notices/Apache-2.0.txt
 */
```

**Partial derivation — a few functions ported into an otherwise-Ferrox file.** This is the only case where a _standardised_ provenance idiom exists (REUSE 3.3 `SPDX-Snippet*`), and the tree already does the free-form equivalent well — `IrcAdapter.ts:26`, `TwitchAdapter.ts:25`, `LineAdapter.ts:245` each carry an inline per-function `// Adapted from openclaw/… (MIT).`. Keep that. Do **not** convert them to `SPDX-Snippet*`: it buys nothing here (nobody is running `reuse spdx` on this repo) and costs a new dialect.

```typescript
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions derived from AionUi <https://github.com/iOfficeAI/AionUi>@f37a6187
 * Source: packages/desktop/src/renderer/hooks/useSyncStatus.ts
 * Copyright 2025 AionUi (aionui.com)
 * Licensed under the Apache License, Version 2.0 - see notices/Apache-2.0.txt
 * Wayland additions remain under this project's AGPL-3.0-or-later terms.
 */
```

Note the deliberate structural difference: in the whole-file form the upstream copyright is the **first line** (it is the retained notice — retention should be the first thing a reader or auditor sees). In the partial form it sits inside the provenance stanza next to the path it belongs to, matching `src/process/utils/backoff.ts:6-10`, which is the existing in-tree pattern and the one that survives bundling.

### `SPDX-FileCopyrightText:` vs plain `Copyright` — use plain `Copyright`

Recommendation: **keep the `Copyright` prefix. Do not adopt `SPDX-FileCopyrightText:`.**

- REUSE 3.3 accepts `Copyright` as a valid Copyright Notice prefix ("MUST start with a prefix: `SPDX-FileCopyrightText`, `Copyright`, or `©`"). So the header is already REUSE-parseable. The tag switch buys **zero** additional machine-readability.
- Adopting it on 504 files while 1,146 others keep `Copyright` creates a seventh dialect — the exact defect this milestone exists to remove.
- Adopting it everywhere is a 1,650-file cosmetic diff with no compliance value. Recommend against.
- Multiple `Copyright` lines in one header are explicitly fine — REUSE permits repeated copyright notices for multiple holders.

### "Derived from X, modified by us" — there is no standard idiom, and that is the answer

I looked specifically. **No SPDX or REUSE tag means "derived from upstream project X".** There is no `Adapted-From`, no `Upstream-Name` file tag. The three nearest things:

| Vehicle                                                               | What it is                                 | Fit here                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `SPDX-SnippetBegin` / `SPDX-SnippetCopyrightText` / `SPDX-SnippetEnd` | REUSE 3.3, delimits borrowed lines in-file | Only fits partial derivation, and only if something consumes it. Nothing here does |
| SPDX relationship `ancestorOf` / `descendantOf`                       | Document-level, in an SBOM                 | Right semantics, wrong place — it lives in an SPDX document, not a file header     |
| Free-form prose                                                       | What Apache-2.0 §4(b) itself relies on     | **Correct.** Apache prescribes no format, and ASF's own policy gives none either   |

So: the **copyright and licence half** of the header is standardised (`Copyright` + `SPDX-License-Identifier`), and the **derived-from / modified-by half is necessarily free-form**. Standardise it _locally_ — one wording, generated from the manifest, so it is uniform by construction rather than by discipline. That is the entire justification for the generator.

**Engineering, not legal:** tag choice, block ordering, pointer path, generator existence.
⚖️ **LEGAL-GATED:** the exact §4(b) wording (`"Modified by Ferrox Labs. This file is not the upstream file."`) and whether the upstream copyright must precede ours. Both are one-time decisions applied 504 times — counsel reviews **one string**, not 504 files.

---

## Q2 — SPDX Apache-2.0 vs outbound AGPL. **Verdict: leave it alone in WLD-I.**

Ground truth first. `package.json:6` → `"AGPL-3.0-or-later"`. Root `LICENSE` is the 33.7K AGPL text. `readme.md:322` states the split as deliberate: _"This desktop app is GNU AGPL-3.0; the engine, wayland-core, is Apache-2.0. The split is deliberate."_ So the inconsistency is real: 1,649 files declare Apache-2.0 inside an AGPL product.

### Is it wrong, harmful, or defensible?

**Wrong-ish, not harmful to anyone but Ferrox, and defensible on the derived set.** Four points, in order of decisiveness:

1. **It is not a compliance defect, and it cannot become one.** Apache-2.0 §4 nowhere requires a per-file SPDX identifier — §4(a) wants the licence text, §4(b) a modification notice, §4(c) retained notices, §4(d) the NOTICE contents. A per-file identifier that is _more permissive_ than the outbound licence cannot breach Apache-2.0 (you have over-granted your own rights, not under-granted theirs) and cannot breach AGPL (Ferrox is the copyright holder of its own code and may licence it however it likes). **No third party has a claim here.** That single fact is why this must not gate the §4(c) work.

2. **On the 445-file candidate set it is not merely defensible — it becomes correct and load-bearing the moment Q1 lands.** Those files contain Apache-2.0 material. `SPDX-License-Identifier: Apache-2.0` accurately identifies the licence of that material, and upstream's own header says exactly that. Changing it to `AGPL-3.0-or-later` on a derived file would be a **regression** — it would assert copyleft over material the upstream licensed permissively. Any sweep must therefore _exclude_ the derived set, which means the sweep depends on the inventory, which means it cannot precede it.

3. **The residual problem is confined to the ~1,205 headered Ferrox-original files, and the exposure runs against Ferrox.** A downstream fork could point at `SPDX-License-Identifier: Apache-2.0` in a file header and argue it may take that file permissively, weakening the AGPL moat the readme calls deliberate. That is a **licensing-strategy** risk, not a compliance risk, and it is exactly what counsel is for. It is also partly blunted by `CONTRIBUTING.md:11-15`, whose CLA grants Ferrox a _"perpetual, worldwide, royalty-free license to use, modify, sublicense, and relicense"_ every contribution — Ferrox retains the right to relicense regardless of what a header says.

4. **The cost of fixing it now is not the diff, it is the review.** 1,205 files. But the real cost is that a 1,205-file SPDX churn lands in the same milestone as a 504-file §4(c) restoration, and a reviewer can no longer tell which changed lines are the legally significant ones. **That is the argument.** Mixing them makes the compliance packet unreviewable, and the compliance packet is the one with an actual obligation behind it.

### Recommendation — three moves, ~1 hour total

| Move                                                                                                                                             | Cost                                             | Rationale                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Do not change any existing `SPDX-License-Identifier` in WLD-I**                                                                                | 0 files                                          | Points 1–4                                                                                                                                            |
| **Add one precedence statement** to `notices/THIRD-PARTY-NOTICES.md` and `notices/README.md` (the latter is being rewritten anyway — see Wave 0) | 2 files                                          | States the intent explicitly instead of leaving it to inference. Do **not** touch root `LICENSE`; `notices/THIRD-PARTY-NOTICES.md:136-137` forbids it |
| **Fix it forward:** new Ferrox-original files get `SPDX-License-Identifier: AGPL-3.0-or-later`                                                   | 1 CONTRIBUTING line + one branch in the Q5 check | Stops the population growing at ~zero cost while counsel decides                                                                                      |

Be honest about the second move's limit: a precedence note that contradicts 1,205 file headers is a weak instrument, and if it is written to imply the headers never meant what they say, it reads as a retroactive walk-back. Suggested wording — accurate, and does not pretend:

> Wayland as a whole is distributed under the GNU AGPL-3.0-or-later (`LICENSE`). Many source files
> carry `SPDX-License-Identifier: Apache-2.0`, inherited from the Apache-2.0 upstreams this codebase
> derives from. On upstream-derived files that identifier is accurate and is retained deliberately.
> On files authored entirely by Ferrox Labs it is a historical artifact of that inheritance and is
> broader than the licence under which Ferrox Labs distributes the work as a whole; where the two
> differ, `LICENSE` governs the combined work.

### If counsel says fix it — the correct expressions, for a _later_ milestone

Per REUSE/SPDX, simultaneous obligations use the conjunctive `AND`:

| File class                         | Correct expression                 |
| ---------------------------------- | ---------------------------------- |
| Ferrox-original                    | `AGPL-3.0-or-later`                |
| Upstream-derived + Ferrox-modified | `Apache-2.0 AND AGPL-3.0-or-later` |
| Verbatim upstream copy             | `Apache-2.0`                       |

This is the _same machinery_ as Q3 — manifest classification → generated header — so it is cheap to run once the manifest exists and expensive to review now. That is the argument for sequencing it after WLD-I, not for never doing it.

### And explicitly: do not touch the 2,316 unheadered files

A repo-wide REUSE-compliance push would add headers to 2,316 files with zero compliance value (they have no upstream notice to retain). **Recommend against, in WLD-I and after.** `reuse lint` would fail the repo today; do not adopt `reuse lint --all` as a gate, because the only way to make it pass is that 2,316-file churn. Use REUSE's _format_ without claiming its _compliance badge_.

---

## Q3 — Scale strategy. **Verdict: manifest-driven, generated headers, human classification. Not hand-editing.**

The sharpest way to put it: **a human signs the classification; a machine writes the header.** Neither pure batch-edit nor pure hand-edit is acceptable, and the split is not a compromise — each half goes to whichever party can actually be trusted with it.

- Hand-editing 504 headers guarantees drift. The tree is the proof: six dialects, and `H-CROSSAUDIT.md` finding 4 records a normalization pass that **missed four of the six** because it keyed on one phrase. Hand-editing is what produced the mess.
- Unreviewed batch-editing is worse. It would stamp `Copyright 2025 AionUi` onto Ferrox-original files that share a path by coincidence. The measurement already proves this happens: `H-CROSSAUDIT.md` records a Ferrox-original file sharing 17/38 identifiers with an unrelated upstream. A false attribution is a false claim in a shipped file, which is precisely what the milestone's own Success Standard forbids.
- The reuse-tool docs land on the same split: _be cautious using `annotate` in automated processes; the information it adds must reflect reality, and that is best verified manually._

### The manifest

`scripts/provenance/aionui.json`:

```json
{
  "contract": "wayland-provenance/1.0",
  "upstream": {
    "id": "aionui",
    "name": "AionUi",
    "url": "https://github.com/iOfficeAI/AionUi",
    "license": "Apache-2.0",
    "copyright": "Copyright 2025 AionUi (aionui.com)",
    "comparison_revision": "f37a6187f034c6697d4095c4ad4f7556d19fd2e5",
    "comparison_captured": "2026-07-30",
    "fork_reference": {
      "our_root_commit": "2b3b60e11",
      "our_root_date": "2026-07-06",
      "upstream_nearest_by_date": "<TBD>",
      "note": "classification measures against fork_reference where resolvable, comparison_revision otherwise"
    },
    "path_rebase": [
      ["packages/desktop/src/", "src/"],
      ["packages/web-host/src/", "src/"]
    ]
  },
  "files": [
    {
      "path": "src/common/electronSafe.ts",
      "upstream_path": "packages/desktop/src/common/electronSafe.ts",
      "metric": { "tool": "litcmp2.py", "literal_overlap": 1.0, "identifiers_shared": "34/34" },
      "classification": "derived-modified",
      "tier": "A",
      "reviewer": "sean",
      "reviewed": "2026-07-31",
      "note": "code byte-identical; only the @internal doc comment differs"
    }
  ]
}
```

`classification` ∈ `derived-verbatim` | `derived-modified` | `derived-partial` | `independent` | `unresolved`. Each maps 1:1 to a Q1 header variant; `independent` emits nothing and **records the negative determination** — which is the half `3f1c5ba10` skipped and got caught for.

Three design points worth defending:

- **`path_rebase` is an explicit input, not a heuristic.** My enumeration produced 504 same-path files; `H-CROSSAUDIT.md` says 445. Both are right — 445 is `src/` only, 59 more sit under `tests/`. The count is a function of the rebase rule, so the rule has to be data, or every future re-run yields a different number and nobody can tell whether the tree moved or the script did.
- **`fork_reference` is a methodological upgrade on the cross-audit.** That audit measured against current `main` and correctly labelled its numbers a lower bound. Measuring against the nearest-by-date upstream commit raises overlap and strengthens every classification — and AionUi is a live target (`pushed_at: 2026-07-30T11:58:04Z`, i.e. it moved _today_), so an unpinned comparison is not reproducible at all.
- **`scripts/provenance/`, not `notices/provenance/`.** `electron-builder.yml:115` copies all of `notices/`, so anything placed there **ships** — and every classification error would ship with it, against a Success Standard that requires every shipped claim to be verified. §4(c) binds the source form, and `scripts/` is in the source form. Keep the working artifact in the source tree; put only the settled human-readable summary in `notices/THIRD-PARTY-NOTICES.md`.

### Human effort tiering

| Tier | Overlap | Expected N                       | Human action                                                                              | Signed                      |
| ---- | ------- | -------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------- |
| A    | ≥50%    | ~310 (16/23 of the audit sample) | Accept the tier verdict; spot-check ~20                                                   | Per tier, recorded per file |
| B    | 20–50%  | ~80                              | **Read every file.** Judge the _content_ of the shared identifier set, not the rate       | Per file, `note` required   |
| C    | <20%    | ~110                             | Read every file. Default `independent`; a `derived-*` verdict here needs a written reason | Per file, `note` required   |

Tier B/C cannot be automated, and `H-CROSSAUDIT.md` explains exactly why in a way worth carrying forward: literal-line overlap detects copy-paste but **not a port**, and a rewritten port shares no lines and is still a derivative work. Its refinement — third-party API names carry no signal, hand-authored helper names carry strong signal, an import-plus-call-site of a helper defined in an _attributed_ sibling carries no signal — is the actual review rubric for tiers B and C. It cost the audit two wrong verdicts to learn; it belongs in the manifest tooling's docstring, not in a memory.

### The 144-file surprise inside the 445

Of the 445 `src/` same-path files, **301 have an SPDX header and 144 have none at all**. Those are two different edits with two different review questions:

- **301 files:** _modify_ a header — remove nothing, insert the retained upstream copyright above ours. This is the §4(c) restoration proper, and it is where ASF's "do not remove third-party copyright notices" bites.
- **144 files:** _add_ a header where none exists. Cleanest case — nothing to reconcile, no Ferrox claim to walk back. But still requires classification, because a path collision is not provenance.

Never mix the two in one commit. See Q4.

---

## Q4 — Commit and PR structure

Two hard mechanical constraints, both verified: `.pre-commit-config.yaml` runs `conventional-pre-commit` with `--strict --force-scope`, so **every** commit must be `type(scope): subject` from the fixed type list. The branch's existing `fix(legal): …` form satisfies it.

**Split by confidence tier first, then by edit kind. Not by directory, not by upstream.**

Reviewers review _decisions_, not files. A tier is one decision applied N times, so a tier-shaped PR has one argument to check. A directory-shaped PR mixes tiers and forces the reviewer to re-derive the argument for every file — with 171 candidates in `src/renderer/pages` alone, that PR is unreviewable regardless of how it is described. And splitting by upstream is moot here: one upstream dominates 504 of ~520 open items.

| Packet   | Contents                                                                                             | Files  | Reviewable because                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| **I-01** | Manifest scaffold + `apply.mjs` + drift test + checked-in upstream tree index. **Zero header edits** | ~4 new | Small, self-contained, and it is the thing every later packet is checked against                                         |
| **I-02** | Tier A, edit-kind _modify_ (has a header)                                                            | ~200   | Large diff, **one** decision. `node scripts/provenance/apply.mjs --check` reproduces it byte-for-byte from a small input |
| **I-03** | Tier A, edit-kind _add_ (no header)                                                                  | ~110   | Different review question: insertion, not restoration                                                                    |
| **I-04** | Tier B, per-file `note` in the manifest                                                              | ~80    | Reviewer reads 80 notes, not 80 diffs                                                                                    |
| **I-05** | Tier C + the `independent` set. **Manifest entries only, no header edits**                           | 1      | Records the negative determinations — the thing `3f1c5ba10` was faulted for omitting                                     |
| **I-06** | The 59 same-path files outside `src/`                                                                | ~59    | Separate because `tests/` never reaches the object form, so only §4(c) applies                                           |

**One commit = one tier × one edit-kind × one upstream.** The unit is not "a directory" and not "50 files" — it is a decision.

The seeming contradiction with "no bulk cleanup bombs" resolves cleanly: **a large generated diff is not a bulk cleanup bomb if it is reproducible from a small reviewed input.** The reviewer checks the manifest and the generator, then runs `--check`. That is a stronger review than eyeballing 200 hand-made diffs, and it is _cheaper_. Make it explicit in each PR body: the exact `--check` command and its output.

No history rewriting anywhere. `H-CROSSAUDIT.md` finding 7 already establishes the house style for a wrong commit message: the commit stands, the correction lives in the planning record.

---

## Q5 — Regression-proofing

Four layers, cheapest first. Layer 2 is the one that actually catches a future contributor.

**1. Manifest ↔ tree binding test.** Clone `tests/unit/scripts/whatsappBridgeSourcePin.test.ts` — a pattern this repo has already paid to learn. Its own docstring records why:

> an oxfmt pass over the branch delta reformatted `backends/baileys.js` from 15,582 to 15,420 bytes,
> which invalidated the authority and therefore EVERY packaged build — while tsc, all 15,760 unit
> tests, and every pre-commit hook stayed green.

For every `derived-*` manifest entry, assert the file's first comment block contains the upstream copyright line **and** the `Source:` path. Seconds, no build, no network. This is the load-bearing gate.

**2. The new-file check — the actual regression vector.** A file added at a path present in the pinned upstream tree index and **absent from the manifest** fails, with a message naming the file and telling the contributor to classify it. This is why `scripts/provenance/aionui.tree.json` must be checked in: without it the check needs the GitHub API, goes flaky, gets disabled, and the mechanism dies. Offline and deterministic or it does not survive.

**3. `CONTRIBUTING.md` note.** `CONTRIBUTING.md` currently says nothing about headers at all — its licence section is entirely CLA. Add a short section: if you port code from an upstream, add a manifest entry and run the generator; the suite will tell you if you did not. Keep it to five lines; the check is the enforcement, the doc is the pointer.

**4. Do NOT write an oxlint rule.** Recommend against. A header-shape lint cannot know provenance — it can only assert that _some_ header exists, which is the least valuable property. The manifest test asserts the _correct_ header on the _right_ files, which is the property that matters. Note `hashicorp/copywrite` (`--plan` dry-run, non-zero exit, built for exactly this at scale) as the industry tool and **reject it** for the same reason: it enforces one uniform header, and this tree needs per-file variable upstream attribution driven by a manifest.

**What fails, concretely:** the vitest suite goes red with the file path and the missing line. That suite is already a required check after the WLD-F required-checks-bypass fix, so red means unmergeable rather than merely noticed.

---

## Q6 — Ordering, dependencies, and risk labels

Labels: **ENG-SAFE** = no legal decision, blast radius ≈ 0, ship now. **ENG-GATED** = waits on the inventory. **LEGAL-GATED** = waits on counsel.

### Wave 0 — ENG-SAFE. Ship immediately. Do not let these wait for anything.

Every item is "a document we ship says something demonstrably false." Correcting a false statement is never worse than leaving it, and none of these touches `src/`.

| Packet | Change                                                                                                                                                                                                                              | Files | Label                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------- |
| I-A    | `notices/THIRD-PARTY-NOTICES.md:9-11` — scope the §4(d) sentence to AionUi/aionrs/gemini-cli; state that OfficeCLI ships a NOTICE whose contents are reproduced. Add `notices/OfficeCLI-NOTICE.txt` verbatim                        | 2     | ENG-SAFE                                                        |
| I-B    | `:48-49` — `.wcore.toml`/`~/.wcore` → `.wayland-core.toml`/`~/.wayland-core`                                                                                                                                                        | 1     | ENG-SAFE                                                        |
| I-C    | `notices/README.md` rewrite. 517 bytes, stale, states a falsehood, and it **ships**                                                                                                                                                 | 1     | ENG-SAFE                                                        |
| I-D    | `electron-builder.yml:118` — 31 → 30. **Verified: exactly 30 files cite `LICENSES/openclaw.txt`** (28 under `src/`+`scripts/`, 2 under `tests/`)                                                                                    | 1     | ENG-SAFE                                                        |
| I-E    | pptx2json "verbatim" → vendored-with-modifications; 7zip-bin "solely Windows"; the `:113` SHA-256 fetch-path wording; add `scripts/install-signal-cli.mjs` to the OpenClaw enumeration; the `:70` "the path the headers cite" claim | 1     | ENG-SAFE                                                        |
| I-Z    | npm dependency licence report for the 144 bundled production deps                                                                                                                                                                   | new   | ENG-SAFE, fully parallel — depends on nothing in this milestone |

Wave 0 collectively touches ~5 files and zero `src/`. **It is a mistake to sequence any of it behind the legal decision**, and I-C in particular is a document that ships today asserting the Apache text is retained _"solely to satisfy the attribution terms of the AionUi and aionrs upstreams"_ — which the branch itself already falsified by adding Gemini CLI.

### Wave 1 — ENG-SAFE, small, independent. Fact-finding already complete.

| Packet | Change                                                                                                                                                                       | Files | Label                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------ |
| I-F    | `tools/web-fetch.ts` — restore `Copyright 2025 Google LLC`; `utils/geminiSchemaFilter.ts` — add a header; reword the notices claim from blanket-directory to the derived set | 3     | ENG-SAFE — §4(c), but the finding is single-file and settled |
| I-G    | Tunnel trio + `channels/types.ts` — OpenClaw headers in the surviving `@license` form; add the tunnel subsystem to the notices entry                                         | 5     | ENG-SAFE — asymmetric risk, and the panel converged          |
| I-H    | Collapse the six OpenClaw dialects to one across the existing 28 files. **Excludes `baileys.js`**                                                                            | ~28   | ENG-SAFE — normalization only, no new claims                 |
| I-I    | `backends/baileys.js` header + re-pin                                                                                                                                        | 2     | ENG-SAFE, **isolated** — see Q7                              |

I-H should adopt the `backoff.ts` form (`Portions adapted from OpenClaw <url>@aee2681a` + `Source:` + holder + `LICENSES/openclaw.txt` pointer) since it already survives Rollup at 32 measured instances, and should preserve the inline per-function `// Adapted from openclaw/… (MIT).` comments — those are the good pattern, not a dialect to collapse.

### Wave 2 — ENG-GATED on the inventory. No header edits.

| Packet | Change                                                                                                 | Label     |
| ------ | ------------------------------------------------------------------------------------------------------ | --------- |
| I-01   | Manifest scaffold, generator, drift test, checked-in upstream tree index                               | ENG-GATED |
| I-J    | Run the measurement over all **504** candidates; resolve `fork_reference`; classify; fill the manifest | ENG-GATED |

### Wave 3 — LEGAL-GATED. This is the remedy.

| Packet      | Change                                                                                                   | Label                               |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| I-02 … I-06 | Apply generated headers per tier and edit-kind                                                           | ⚖️ LEGAL-GATED                      |
| I-K         | Re-adjudicate `3f1c5ba10` — acpx / Zed (**GPL-family, the one with real teeth**), Codex CLI, Claude Code | ⚖️ LEGAL-GATED + needs fact-finding |

### Dependency order

```
Wave 0  I-A I-B I-C I-D I-E ─┐   (parallel, independent, ship now)
Wave 0p I-Z ─────────────────┤   (npm licence report, fully parallel)
Wave 1  I-F I-G I-H ─────────┤   (parallel, independent)
Wave 1  I-I ─────────────────┤   (SERIAL AND ALONE — pinned dir)
                              │
Wave 2  I-01 ────────────────┴──> I-J (inventory + classification)
                                       │
                              ⚖️ counsel │ (5 questions, one round)
                                       ▼
Wave 3                        I-02 → I-03 → I-04 → I-05 → I-06
Wave 3                        I-K (independent of I-02..06)
```

### The five questions for counsel, in value order

1. **Does a central provenance manifest in the source tree satisfy §4(c), or must the notice sit in the file it was removed from?** Decides whether Wave 3 is 1 file or 504. Ask this one first and alone if only one question gets asked.
2. The literal §4(b) modification wording and whether the upstream copyright must precede ours (Q1).
3. The overlap threshold below which `independent` is defensible (Q3, tiers B/C).
4. Whether to change `SPDX-License-Identifier` on ~1,205 Ferrox-original files (Q2) — and whether the proposed precedence sentence is sufficient in the interim.
5. Restore-or-leave on the `3f1c5ba10` GPL-family clauses (I-K).

**Everything else in this document is engineering.** Counsel reviews five decisions, not 504 files. Structuring it that way is the difference between one review round and a per-file billing relationship.

---

## Q7 — The whatsapp-bridge trap

### Corrected facts — the trap is smaller than described, but the collision vector is different

| Claim                                                  | Verified state                                                                                                                                                                                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The pin is stale and every build fails                 | **False now.** All 9 entries match on this branch. The D-01 staleness is repaired. The pin is a live control, so an edit breaks it                                                                                                                                   |
| lint-staged runs oxfmt on `*.md` and repads the README | **Not live.** `core.hooksPath=.husky/_`, `.husky/` has no user hooks, `.husky/_/h` exits 0, nothing invokes `lint-staged`. It is dormant config that would bite if wired up                                                                                          |
| The README needs editing                               | **No.** `README.md:67-68` already carries correct attributions, including the OpenClaw holder pair (`(c) 2026 OpenClaw Foundation; portions (c) 2025 Peter Steinberger`) that `baileys.js`'s own header gets wrong. The README is already the more accurate document |
| There is no generator                                  | **True.** But `tests/unit/scripts/whatsappBridgeSourcePin.test.ts` exists and catches drift in seconds without a build                                                                                                                                               |

**So WLD-I needs to edit exactly one file in that directory: `backends/baileys.js`.** That collapses the trap from "a pinned directory with a markdown-formatter collision" to "one `.js` file with a digest."

**The live collision vector is `bun run format`.** `scripts.format` is bare `oxfmt` with no path arguments. `.oxfmtrc.json` carries only style keys — no ignore list. oxfmt reads `.gitignore` and `.prettierignore` by default, and **`.prettierignore` contains exactly one line: `mobile/`.** So a bare `bun run format` reformats the whole pinned directory. `prek`'s oxfmt hook _does_ exclude it, which is why CI is safe — but the exclusion lives only in the hook config, and the hook is not the only way the formatter gets run.

### The safe procedure

1. Edit `backends/baileys.js` only. Never `git add src/process/channels/whatsapp-bridge/` wholesale.
2. **Do not run `bun run format`.** Use `prek run` (its exclude protects the dir) or `npx oxfmt <explicit other files>`.
3. Recompute `size` and `sha256` for that one entry and rewrite it in `scripts/whatsapp-bridge-source.json`. Nine entries total; only one moves.
4. `bun run test:vitest tests/unit/scripts/whatsappBridgeSourcePin.test.ts` — seconds, and authoritative. This is the gate.
5. No packaged build needed: the _file set_ is unchanged, so the `sourceInventory` comparison in `verify-packaged-resources.js:672-677` is unaffected. Only the digest moved, and step 4 proves it.

Header for `baileys.js` — normalized to the surviving form, with the holder pair the README already gets right. Note the block stays a single `/** */` containing `@license`; the bridge ships as loose source under `Resources/whatsapp-bridge/` and is never bundled, so Rollup is irrelevant here, but keeping one form across the tree is the point of I-H:

```javascript
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 *
 * Portions adapted from OpenClaw <https://github.com/openclaw/openclaw>@aee2681a
 * Source: extensions/whatsapp/src/{connection-controller,session,auth-store,identity,creds-files}.ts
 * Copyright (c) 2026 OpenClaw Foundation; portions Copyright (c) 2025 Peter Steinberger
 * Licensed under the MIT License - see LICENSES/openclaw.txt
 * Used per MIT permission grant; Wayland additions remain under Apache-2.0.
 */
```

### Should a generator be written? **Yes — and its own packet, `--check`-first.**

The repo has paid for this gap twice: D-01 left the pin stale and broke every packaged build, and an oxfmt pass broke it again at 15,582 → 15,420 bytes. It is ~30 lines.

But the design risk is the reason to be careful, and it is probably why no generator exists yet: **a blind `--write` would "fix" a tampering event by re-pinning it, converting an integrity control into a rubber stamp.** So:

- `node scripts/repin-whatsapp-bridge.mjs` → verify, exit non-zero on drift, print the corrected JSON to stdout. Default mode.
- `--write` → rewrite, **requires the explicit flag**, and prints a warning that the operator must have intended the source change.
- **Never wire `--write` into a hook, a script alias, or CI.** `--check` may be wired anywhere.

**Plus the one-line durable fix, which is worth more than the generator:** add the pinned paths to `.prettierignore`, which oxfmt honours by default. That makes a bare `bun run format` safe and closes the vector at the tool level instead of in one hook's config.

```
mobile/
src/process/channels/whatsapp-bridge/
resources/modelsdev-snapshot.json
contracts/
tests/fixtures/
strike/
src/process/resources/skills/
```

Those paths are copied from the `prek` oxfmt `exclude` list, whose own comment says: _"Every entry below was added because a formatter run actually broke it."_ Having that list in exactly one place — the one the tool reads by default — is the fix. Small packet, ENG-SAFE, ship in Wave 0.

---

## Anti-Patterns

### 1. Treating §4(c) and the Rollup problem as one problem

**What people do:** conclude that because the bundler strips notices, every notice must be forced into a bundler-surviving comment.
**Why it's wrong:** §4(c) is explicitly limited to the **Source form** (`notices/Apache-2.0.txt:100`). Object-form attribution is §4(a)/§4(d), and `electron-builder.yml:110-126` already satisfies it. Conflating them inflates the remedy and makes the manifest look like a dodge when it is a legitimate source-form answer.
**Instead:** decide §4(c) in the source tree and §4(d) in `notices/`, and ask counsel question 1 before sizing Wave 3.

### 2. Reasoning from our own comments instead of from upstream

**What people do:** read `"Ported from OpenClaw's tunnel.ts"` and act on it.
**Why it's wrong:** this is documented, twice, in one audit. Taking our comments at face value produced the original over-attribution; and dismissing a correct flag because the _named_ file showed 1.1% overlap produced the opposite error, because the upstream logic was spread across sibling files. `find -name tunnel.ts` was the wrong search.
**Instead:** measure against the pinned upstream, compare against the whole upstream module, and record the metric in the manifest so the next reader does not have to re-derive it.

### 3. Trusting a zero from an anchored or non-recursive query

**What people do:** `ls` a directory, or `grep -c` with `^…$` anchors, and believe the count.
**Why it's wrong:** both cost a wrong verdict in this branch. `ls src/process/agent/gemini/cli/` returns 13 files and there are exactly 13 Google-headered files — the coincidence reads as 13/13 clean. It is 21 files and 8 are unheadered. Separately, anchored regexes over `strings` output on a Rust binary return 0 because the string table concatenates entries.
**Instead:** `find -type f`, never `ls`. And confirm the method finds a known positive before believing a zero.

### 4. Applying two evidentiary standards in one branch

**What people do:** produce a per-file upstream comparison for the removals someone audited, and delete the rest on one sentence.
**Why it's wrong:** `3f1c5ba10` removed acpx/Zed (**GPL-family**), Codex CLI and Claude Code clauses on _"None of these upstreams has code in this repo"_ with no per-file diff, while `9add51a0c` gave a per-file comparison for all 11 OpenClaw removals. The weaker standard landed on the upstreams nobody audited — including the only GPL-family one.
**Instead:** the manifest records `independent` verdicts with the same fields as `derived-*`. A negative determination is a determination and must be evidenced.

### 5. Letting the exclusion list live in the hook instead of the tool

**What people do:** add the pinned path to `prek`'s `exclude` and consider it handled.
**Why it's wrong:** `bun run format` does not read the hook config. The `prek` list is now seven entries long and every one was added after a formatter run broke something.
**Instead:** `.prettierignore`, which oxfmt reads by default. One place, all invocation paths.

### 6. Claiming a copyright in an unmodified copy

**What people do:** apply the house header uniformly, including to verbatim upstream files.
**Why it's wrong:** it is a false claim, and it is what happened 301 times — including `src/common/electronSafe.ts`, whose code is byte-identical to upstream. ASF's own policy: _"Do not add the standard Apache License header to the top of third-party source files."_
**Instead:** the `derived-verbatim` variant carries no Ferrox copyright and no §4(b) statement.

---

## Integration Points

| Boundary                                          | Interaction                                              | Notes                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| manifest → headers                                | `scripts/provenance/apply.mjs`, `--check` default        | Reproducibility is what makes a 200-file diff reviewable                                    |
| manifest → suite                                  | `tests/unit/scripts/provenanceManifest.test.ts`          | Load-bearing gate. Seconds, no build, no network                                            |
| manifest → `notices/THIRD-PARTY-NOTICES.md`       | Manual, at packet close                                  | Human-readable summary only; the manifest itself does not ship                              |
| `baileys.js` → `whatsapp-bridge-source.json`      | Adversarial. Any byte change breaks every packaged build | Re-pin then run the pin test. One file in scope for WLD-I                                   |
| `.prettierignore` → oxfmt / `bun run format`      | Default ignore path                                      | The single-point fix for the formatter-vs-digest class                                      |
| `notices/` + `LICENSES/` → `electron-builder.yml` | `extraResources`, verified resolving                     | §4(a)/§4(d) already satisfied. Anything added to `notices/` **ships**                       |
| upstream AionUi → `comparison_revision`           | GitHub tree API, pinned                                  | `pushed_at: 2026-07-30T11:58:04Z` — it moved today. Unpinned comparison is not reproducible |

---

## What I could not settle

- **`fork_reference`.** I did not resolve AionUi's nearest-by-date commit to our root `2b3b60e11` (2026-07-06). It is cheap (one API call over upstream's commit list) and it strengthens every tier-B/C classification, so I-J should do it first, not last.
- **The exact tier-A/B/C population.** My tiering projects the audit's 23-file sample onto 504. The real split only exists after I-J runs. Do not put the projected numbers in a commit message.
- **The 59 non-`src/` files.** I confirmed they exist and are in scope; I did not classify them. `tests/e2e/specs` ×32 is the bulk.
- **`reuse lint-file` argument surface.** Confirmed the subcommand exists in reuse 6.2.0; the docs page I fetched did not include its arguments or JSON-output options. Irrelevant if the bespoke test is used as recommended.

---

## Sources

**Primary — this tree, re-measured 2026-07-30** (HIGH):
`git grep -l '@license' -- src | wc -l` → 1650 · `git grep -l 'SPDX-License-Identifier: Apache-2.0' -- src | wc -l` → 1650 · `find src -name '*.ts' -o -name '*.tsx' | wc -l` → 3966 · `git grep -ci 'Copyright.*[Aa]ion[Uu]i' -- src` → 0 · `git grep -l 'LICENSES/openclaw.txt' -- src scripts tests | wc -l` → 30 · `grep -rho 'Portions adapted from OpenClaw[^*]*' out/main/` → 30 + 2 retained · AionUi tree API @ `f37a6187f034c6697d4095c4ad4f7556d19fd2e5` → 1,325 distinct rebased paths, 445 same-path in `src/` (301 headered / 144 unheadered), 59 outside `src/` · all 9 whatsapp-bridge digests recomputed and matching.

**Files read:** `notices/Apache-2.0.txt:93-114` (§4 verbatim) · `notices/THIRD-PARTY-NOTICES.md` · `notices/README.md` · `electron-builder.yml:110-201` · `package.json:6,376-384` · `CONTRIBUTING.md:1-30` · `readme.md:322` · `.pre-commit-config.yaml` · `.husky/_/h` · `.prettierignore` · `.oxfmtrc.json` · `.oxlintrc.json` · `scripts/whatsapp-bridge-source.json` · `scripts/verify-packaged-resources.js:650-678` · `tests/unit/scripts/whatsappBridgeSourcePin.test.ts` · `src/process/utils/backoff.ts` · `src/common/electronSafe.ts` · `src/process/channels/whatsapp-bridge/{README.md,bridge.js,allowlist.js,backends/*}` · commits `485b212ff`, `3f1c5ba10`, `9add51a0c`.

**Planning inputs** (HIGH, in-repo): `.planning/PROJECT.md` · `.planning/phases/WLD-H-attribution/H-CROSSAUDIT.md`.

**External standards** (MEDIUM — read directly at the source, but none of them settles the §4(c) placement question):

- [REUSE Specification 3.3](https://reuse.software/spec-3.3/) — comment-header requirements, `Copyright` as a valid notice prefix, `SPDX-Snippet*`, `REUSE.toml` `precedence = closest|aggregate|override`
- [ASF Source Header and Copyright Notice Policy](https://www.apache.org/legal/src-headers.html) — do not modify or remove third-party notices; do not add the Apache header to third-party files; no prescribed modification-notice format
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) — §4(b), §4(c), §4(d)
- [SPDX 2.3 Annex E — short identifiers in source files](https://spdx.github.io/spdx-spec/v2.3/using-SPDX-short-identifiers-in-source-files/) and [Clause 9 — Snippet Information](https://spdx.github.io/spdx-spec/v2.3/snippet-information/)
- [reuse-tool](https://github.com/fsfe/reuse-tool) / [reuse CLI docs](https://reuse.readthedocs.io/en/stable/man/reuse.html) — `annotate`, `lint`, `lint-file`; the manual-verification warning
- [hashicorp/copywrite](https://github.com/hashicorp/copywrite) — `--plan` dry-run + non-zero exit; evaluated and rejected
- [FOSSA — Apache-2.0 vs AGPL-3.0 compatibility](https://fossa.com/resources/devops-tools/license-compatibility-checker/apache-2-0-vs-agpl-3-0/) (LOW)

---

_Architecture research for: WLD-I licence-compliance remedy design_
_Researched: 2026-07-30_
