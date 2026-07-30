# Stack Research — WLD-I Licence Compliance tooling

**Domain:** Provenance / derivation classification + npm attribution + bundle-notice retention for an Electron/TypeScript app
**Researched:** 2026-07-30
**Confidence:** HIGH on everything measured locally, MEDIUM on the two tools that need a JVM/Docker and were not executed
**Repo state measured:** `~/dev/wayland-worktrees/packet-attribution` @ `ab675a9a3`, plus the real packaged artifact at `out/mac-arm64/Wayland.app`

---

## ⛔ Read this first — three measured findings that change the milestone, not just its tooling

Everything below is reproducible from commands in this document. Nothing here is inferred from a commit message or a prior finding.

### 1. The fork point IS recoverable, and it is ~2026-04-22. The "445 files" figure is an artifact of comparing against the wrong revision.

`H-FINDINGS.md` said the fork point is unrecoverable. `PROJECT.md` scopes the milestone at **445 same-path files**. Both come from comparing our tree against AionUi's **current `main`**, which has since moved to a `packages/desktop/**` monorepo layout — so almost nothing matches by path any more.

Measured, against a full `--mirror` clone of AionUi (18,151 commits, 821 MB, history back to 2025-08-07):

| our tree | upstream revision compared | same-path `.ts/.tsx/.js` files found |
| -------- | -------------------------- | ----------------------------------- |
| `HEAD` | AionUi `main` (what WLD-H did) | **81** |
| `HEAD` | AionUi `b97f34b28e` (2026-04-24) | **1,424** |
| root `2b3b60e11` | AionUi `b97f34b28e` | **1,427** |

The fork point was located by maximising blob-set intersection: for each of ~70 sampled AionUi commits between 2025-11-01 and 2026-06-15, count how many git blob SHAs are shared with our root tree. The curve peaks sharply at 2026-04-22 → 04-24 (393–395 shared blobs) and decays in both directions (129 by mid-June, 292 by 2026-04-07). **Pin: `b97f34b28e` (2026-04-24), fallback `137c1717b0` (2026-04-22).**

### 2. The exposure is ~1,390 files, not ~310.

At the root commit vs the pin, over the 1,427 same-path files:

| class | count | meaning |
| ----- | ----- | ------- |
| `EXACT_BLOB` — byte-identical | **238** | copied, header and all |
| `NORMALIZED_IDENTICAL` — identical after stripping comments + whitespace | **507** | copied, only the comment/copyright block changed |
| ≥50% substantive-line overlap | **645** | copied then edited |
| 20–50% | 30 | needs human read |
| <20% | 7 | diverged or ours |

**1,390 of 1,427 (97.4%) sit at ≥50% overlap.** Only 37 files are even arguable. Two other facts worth carrying: 0 of these files were renamed (a path-independent normalized-hash sweep found 687 same-path matches and **zero** cross-path matches), and our root commit `2b3b60e11` is **parentless** and dated **2026-06-07** — not 2026-07-06 as recorded in `H-CROSSAUDIT.md`.

### 3. `web-fetch.ts` should get AionUi's copyright, not Google's. The planned WLD-I fix is wrong.

`PROJECT.md` says: *"restore the Google LLC notice on the one derived-but-unattributed file (`tools/web-fetch.ts`)"*. Measured:

- Our `web-fetch.ts` vs **AionUi@pin**: `HIGH_OVERLAP`, **95.8%** (vs 18.4% against gemini-cli, which is why it looked marginal).
- AionUi's own `src/process/agent/gemini/cli/tools/web-fetch.ts` header at the pin reads **`Copyright 2025 AionUi (aionui.com)`**.
- Its sibling `web-search.ts` (96.3% overlap with us) carries **`Copyright 2025 Google LLC`** at the pin — AionUi retained Google there and did not on `web-fetch.ts`.

Our proximate upstream is AionUi, not Google. Restoring "Google LLC" would assert a chain of custody the upstream tree contradicts. **This is exactly why the primary tool must be a pinned proximate-upstream comparison, not a similarity score: only the upstream file tells you whose copyright line to restore.**

Corollary for the whole milestone: our `LICENSES/`/`notices/` set currently names gemini-cli, OfficeCLI and aionrs as if we took them directly. For anything that also exists in AionUi@pin, the chain runs through AionUi. Flag for counsel.

---

## Recommended stack

### Core — job (a), provenance classification

| Technology | Version | Purpose | Why recommended |
| --- | --- | --- | --- |
| `git` (a `--mirror` clone of each upstream) | system | Authoritative pinned upstream corpus; exact blob identity; fork-point search | Blob SHA-1 *is* content identity, so exact matches are zero-false-positive proof. A mirror carries **all refs**, which is the only fix for the "GitHub code search indexes the default branch only" trap. Offline after clone. |
| **Hand-rolled `provcmp.mjs`** (~60 lines, in this doc) | n/a | Per-file classification: exact-blob → normalized-hash → substantive-line overlap, our-tree-at-revision vs upstream-at-pin | **No off-the-shelf tool does this job.** Ran in seconds over 1,427 file pairs, produced a 5-class verdict per file, and passed both controls. Build, don't buy. |
| `jscpd` | 5.0.14 | Independent second opinion; token-based so it survives reformatting/renaming | Verified it finds the cross-tree clone (`electronSafe.ts`, 66 lines / 330 tokens) when both trees are passed in one invocation. Rust engine, single binary, offline. |

### Core — job (b), npm attribution document

| Technology | Version | Purpose | Why recommended |
| --- | --- | --- | --- |
| `generate-license-file` | 4.2.1 | Generate `THIRD-PARTY-LICENSES.txt` with **full licence texts** for production deps only | Ran clean on this repo with no config: 1.3 MB, **1,344 distinct packages**, full texts, prod-only by default, and it *warns* when a package has several candidate licence files instead of guessing. Reconciled to 99% against the real asar (see below). |
| `@electron/asar` | 4.2.1 | Ground truth for "what actually ships" | `asar list` over the real 721 MB `app.asar` took 2.6 s and enumerated **1,332 packages / 82,567 node_modules paths**. This is the reconciliation oracle that makes the report legally useful rather than plausible. |

### Core — job (c), CI regression gate

| Technology | Version | Purpose | Why recommended |
| --- | --- | --- | --- |
| **`provenance.json` manifest + a ~120-line checker** | n/a | Allowlist of derived files with their upstream pin, path, verdict, class, and required notice; fails on drift in either direction | Nothing off-the-shelf models "file X is derived from upstream Y@pin". Cheap to build once the classification exists, and it is the only gate that catches a *new* derived file. |
| `reuse` | 6.2.0 | Header/licence-declaration conformance (SPDX id present, licence text present, filenames SPDX-valid) | Ran `reuse lint-file` against this repo and it produced real findings immediately (below). Adopt it for the **declaration** half only. |

### Core — job (5), bundle-notice retention

| Technology | Version | Purpose | Why recommended |
| --- | --- | --- | --- |
| `rollupOptions.output.banner` (electron-vite native) | rollup 4.59.0 | Unconditional per-chunk notice, unstrippable by tree-shaking | Applied after bundling, so it cannot be attached to a removed import. Must be `/*! … */` or contain `@license` to survive esbuild minify in the renderer. Zero new dependencies. |
| `rollup-plugin-license` | 3.7.1 | Only if you want the banner templated from `package.json`/dep list | `banner.commentStyle: 'ignored'` emits the `/*!` form. **Do not use its `thirdParty` half** — see "What NOT to use". |

### Development tools (already present, verified)

| Tool | Purpose | Notes |
| --- | --- | --- |
| `uvx` | Runs `reuse` without polluting the box | Must be `uvx --with charset-normalizer reuse@6.2.0` — bare `uvx reuse` **crashes** with `NoEncodingModuleError` |
| `cloc` | Denominators for review-effort estimates | `/opt/homebrew/bin/cloc`, already installed |
| Docker 29.4.1 | Only route to ORT/FOSSology on this box | **No JVM installed** — `java -version` fails |

---

## The build-vs-buy verdict on the provenance classifier

**BUILD.** Explicitly and without hedging.

Every licence tool in the evaluation set answers *"what licence does this tree declare?"*. Our question is *"is this file a derivative of that specific file in that specific upstream at that specific revision, and whose copyright line must it carry?"* Those are different questions, and conflating them is what produced the wrong verdicts in WLD-H.

| Tool | Version | What it actually does | Detects a rewritten port? | Can compare our tree vs a pinned upstream tree? | Verdict for WLD-I |
| --- | --- | --- | --- | --- | --- |
| **scancode-toolkit** | 32.5.0 | Scans ONE tree for declared licences, copyright statements, package manifests, SPDX output | No | **No** — no tree-vs-tree mode | Wrong problem. Optional use: bulk-extract the copyright lines already present in our 3,451 headers as an inventory input. |
| **FOSSology** | 4.7.1 | Server (Docker/Postgres) wrapping Nomos/Monk/Ojo licence agents + a human clearing workflow | No | No | Wrong problem, plus it drags in a server and a review UI we do not need. Skip. |
| **OSS Review Toolkit (ORT)** | 91.2.0 | Analyzer (dep graph) + Scanner (delegates to ScanCode) + Reporter (attribution docs, SBOM) | No | No | Right answer for **job (b) only**, and `generate-license-file` already does that job with no JVM. Skip unless you also want CycloneDX/SPDX SBOMs. |
| **licensee** | v10.0.0 | Ruby; identifies the *project's own* LICENSE file against a known-licence corpus. Powers GitHub's licence badge. | No | No | Wrong problem entirely. Skip. |
| **ninka** | last pushed 2022-06-19 | Perl; sentence-level licence-statement classifier | No | No | Wrong problem AND unmaintained. Skip. |
| **Software Heritage** | live service | Archive lookup by `sha1_git` (public). The endpoint that names the **origin** of a blob requires authentication + special permission. | No | Partially, and gated | Redundant: git blob SHA-1 *is* `sha1_git`, and we can clone the upstreams ourselves. Only conceivable use is corroborating a blob whose upstream we cannot clone — and the one such upstream (Claude Code) is closed-source, so SWH will not have it either. **Needs network + an approval request.** Skip. |
| **jscpd** | 5.0.14 | Token-based type-1/2/3 clone detection; Rust engine; scans all paths you give it in one pool | No | **Yes** — pass both trees as arguments | **Adopt as the second opinion.** Verified working. Caveats below. |
| **PMD CPD** | current | Token-based clone detection, same class as jscpd | No | Yes (pass both dirs) | Redundant with jscpd and **needs a JVM this box does not have**. Skip. |
| **simian** | 2.5.x | Commercial similarity analyser | No | Yes | **Paid licence**, closed source, last meaningful release ~2018. Skip. |
| **NiCad** | 6.x | TXL-based near-miss clone detector; strongest normalisation in the academic set | Partially — normalises identifiers, so a mechanical rename-and-reformat port is caught. A genuine rewrite is not. | Yes | Needs a TXL install and a Linux-shaped toolchain; TypeScript grammar support is not first-class. The marginal detection over jscpd does not pay for the setup. Skip. |
| **MOSS (Stanford)** | service | Plagiarism detection for coursework | Partially | Only by uploading source to Stanford | **Requires an emailed account, is network-only, and its terms are academic-use.** Uploading a proprietary AGPL codebase to it for a legal-compliance exercise is a non-starter. Hard skip. |
| **SourcererCC** | research code | Scalable token-bag clone detection at 100M-LOC scale | Partially | Yes | Research artifact, Java, no maintained release. Our corpus is 1,427 file pairs — six orders of magnitude below where its scale advantage matters. Skip. |

### Why the hand-rolled tool wins here

1. **The task is bounded and the answer is nearly binary.** 745 of 1,427 files are identical after comment stripping. A clone detector's cleverness is wasted on files that are literally the same bytes.
2. **The import was a bulk copy, not a rewrite.** The port-vs-copy problem that broke WLD-H exists only because it compared **HEAD** against upstream. Compare **the root commit** — a parentless squashed import — and drift is near zero. A file copied at import and rewritten by us afterwards is *still* a derivative work, and its status is settled at the import.
3. **Only the upstream file tells you what notice to restore.** A similarity score says "derived". It cannot say "and the copyright line is AionUi, not Google". See finding 3.
4. **Nothing detects a true rewritten port.** Not scancode, not jscpd, not NiCad, not MOSS. Accept it and cover it with the human protocol instead of shopping for a tool that does not exist.

---

## Job (a) — the exact toolchain and protocol

### Step 1 — pin the upstreams (one-time, ~5 min, then offline)

```bash
mkdir -p .provenance/upstreams && cd .provenance/upstreams
git clone --mirror https://github.com/iOfficeAI/AionUi.git aionui.git      # 821 MB, 18,151 commits
git clone --mirror https://github.com/google-gemini/gemini-cli.git gemini-cli.git
git clone --mirror https://github.com/openclaw/openclaw.git openclaw.git
git clone --mirror https://github.com/iOfficeAI/aionrs.git aionrs.git
git clone --mirror https://github.com/iOfficeAI/OfficeCLI.git officecli.git
```

`--mirror` is load-bearing: it fetches **every ref**, which is the documented fix for method lesson 5. Record each clone's `git rev-parse HEAD` and clone date in `provenance.json`.

### Step 2 — find each fork point by blob-set maximisation

```bash
# our root tree's blob set
git ls-tree -r 2b3b60e11 -- src > /tmp/ours-root.txt
# sample upstream commits in a window, count shared blobs, take the peak
node .provenance/forkpoint.mjs .provenance/upstreams/aionui.git 2025-11-01 2026-06-15
```

Report the whole curve, not just the peak — the shape (sharp rise, sharp decay) is what makes the pin defensible. **AionUi result: peak `b97f34b28e` @ 2026-04-24, 395 shared blobs.**

⚠️ `rtk` intercepts `git log` and truncated 18,151 commits to 50 during this research. Any script that enumerates commits must call `rtk proxy git log …` or invoke git via `child_process.execFile` (which bypasses the hook). A short commit list is a method artifact, not evidence — the same class of trap as the `ls` vs `find` and anchored-regex traps in `H-CROSSAUDIT.md`.

### Step 3 — classify (the actual tool)

```bash
OUT=.provenance/aionui-root.json node .provenance/provcmp.mjs \
    . 2b3b60e11  .provenance/upstreams/aionui.git b97f34b28e
```

```js
// .provenance/provcmp.mjs — our tree @ rev  vs  upstream tree @ pin
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';

const [oursRepo, oursRev, upRepo, upRev] = process.argv.slice(2);
const git = (r, a) => execFileSync('git', ['-C', r, ...a], { maxBuffer: 1 << 28, encoding: 'utf8' });
const cat = (r, sha) => git(r, ['cat-file', 'blob', sha]);

function tree(repo, rev) {
  const m = new Map();
  for (const l of git(repo, ['ls-tree', '-r', rev]).split('\n')) {
    const x = l.match(/^\d+ blob ([0-9a-f]{40})\t(.*)$/);
    if (x && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(x[2])) m.set(x[2], x[1]);
  }
  return m;
}
// strip block + line comments, collapse whitespace, drop blanks
const normalize = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
     .map((l) => l.replace(/\/\/.*$/, '').replace(/\s+/g, ' ').trim())
     .filter(Boolean);
const nhash = (ls) => createHash('sha256').update(ls.join('\n')).digest('hex');
const substantive = (ls) => ls.filter((l) => l.length > 12 && !/^[{}()[\];,]+$/.test(l));
function overlap(a, b) {
  const A = substantive(a), B = new Set(substantive(b));
  if (!A.length) return 0;
  return A.filter((l) => B.has(l)).length / A.length;
}

const ours = tree(oursRepo, oursRev), up = tree(upRepo, upRev);
const rows = [];
for (const p of [...ours.keys()].filter((p) => up.has(p))) {
  const os = ours.get(p), us = up.get(p);
  if (os === us) { rows.push({ p, verdict: 'EXACT_BLOB', ov: 1 }); continue; }
  const a = normalize(cat(oursRepo, os)), b = normalize(cat(upRepo, us));
  const ov = +overlap(a, b).toFixed(3);
  rows.push({
    p,
    verdict: nhash(a) === nhash(b) ? 'NORMALIZED_IDENTICAL'
           : ov >= 0.5 ? 'HIGH_OVERLAP' : ov >= 0.2 ? 'MEDIUM_OVERLAP' : 'LOW_OVERLAP',
    ov,
  });
}
fs.writeFileSync(process.env.OUT || '/tmp/provcmp.json', JSON.stringify(rows, null, 1));
```

Also run a **path-independent** pass (normalized hash of every file in each tree, intersect on hash, report cross-path hits) to catch renames. For AionUi this returned **zero**, so path-keyed comparison is provably sufficient — but the check has to be run, not assumed.

### Step 4 — confidence signal and remedy per class

| Verdict | Human review needed | Remedy | Confidence |
| --- | --- | --- | --- |
| `EXACT_BLOB` (238) | none | Restore the upstream `Copyright` line verbatim, add ours as a modification notice | Proof |
| `NORMALIZED_IDENTICAL` (507) | none | Same | Proof |
| `HIGH_OVERLAP` ≥0.5 (645) | spot-check 5% | Same | HIGH |
| `MEDIUM_OVERLAP` 0.2–0.5 (30) | **all 30, by hand** | Case by case | needs human |
| `LOW_OVERLAP` <0.2 (7) | **all 7, by hand** | Probably ours; document why | needs human |

**Only 37 files need human adjudication.** That is the entire value of doing this at the pin instead of at HEAD.

### Step 5 — calibration (mandatory, per method lesson 4)

Controls run during this research, all passing:

| Control | Expectation | Measured |
| --- | --- | --- |
| `src/common/electronSafe.ts` (known copy) | near 1.0 | `NORMALIZED_IDENTICAL`, 1.000 ✅ |
| `gemini/cli/tools/web-search.ts` (attributed, known derived) | high | 0.963 ✅ |
| `channels/tunnel/TunnelManager.ts` (OpenClaw-derived, not AionUi) | absent | not in the AionUi same-path set ✅ |
| `DiscordAdapter.ts`, `webhookExposureGuard.ts`, `infra/backoff.ts` | absent | all absent from the AionUi set ✅ |
| Our HEAD vs AionUi `main` | should collapse | 1,424 → **81**, proving revision choice dominates ✅ |

Record these in the phase artifact. A run whose controls are not reproduced is void.

### Step 6 — human review protocol for the 37 + the `3f1c5ba10` re-adjudication

The `3f1c5ba10` set (acpx, Zed, Codex CLI, Claude Code, NocoBase, Figma, Cherry Studio) gets the **same** pipeline, since acpx/Zed/Codex CLI are all cloneable. Claude Code is closed source, so it is undiffable — for that one, the honest verdict is UNVERIFIED and the pointer should be restored rather than deleted, because a deleted pointer is unrecoverable and a retained one carries no liability.

Written protocol, one row per file, no verdict without all five columns filled:

1. **Upstream candidate set** — enumerated by `find -type f` over the pinned checkout, never `ls`, never a non-recursive listing.
2. **Best-match upstream file** — highest overlap across the whole upstream tree, not just the plausibly-named sibling. *(This is the exact error that made the tunnel trio verdict wrong: `getTailscaleDnsName` lives in `webhook/tailscale.ts`, not `tunnel.ts`.)*
3. **Shared identifier set, split into three columns** — third-party API names (no signal), hand-authored helper names (strong signal), import-and-call-site-only of a helper defined in an attributed sibling (no signal; the notice belongs on the definition).
4. **Whose copyright line the upstream file itself carries** — the answer to "what do we restore", and unobtainable from any metric.
5. **Verdict + asymmetry note** — wrongly stripping a notice creates a live breach; wrongly keeping one grants unowed credit and carries no liability. Ties resolve toward keeping.

---

## Job (b) — the npm attribution document

### The scope is 1,332 packages, not 144

Measured on the real artifact:

```bash
bunx @electron/asar@4.2.1 list out/mac-arm64/Wayland.app/Contents/Resources/app.asar > asar-list.txt
# 84,824 entries · 82,567 under node_modules · 1,332 distinct packages · 721 MB asar
```

`electron-builder` 26.10.0 copies the **full production transitive tree** into the asar regardless of the `files` allowlist — the allowlist only adds non-default paths and prunes native binaries. So `dependencies` in `package.json` (144) understates the shipped set by ~9×. Of the 1,332, **1,273 ship their own LICENSE/COPYING/NOTICE file and 59 ship none** (`@office-ai/aioncli-core`, `google-gax`, several `@radix-ui/*`, `@sapphire/*`, `@snazzah/*`, arch-specific `@napi-rs/canvas-*`).

### Comparison

| Tool | Version | Full licence **texts**? | Prod-only? | Verdict |
| --- | --- | --- | --- | --- |
| **`generate-license-file`** | 4.2.1 | **Yes** | Yes, by default | **ADOPT.** Verified: 1.3 MB output, 1,344 distinct packages, 1,514 package↔licence bindings, dedupes identical texts into 648 blocks, and warns per-package when several candidate licence files exist rather than picking silently. |
| `license-checker` | 25.0.1 | No — SPDX ids + a path | `--production` | Reject. **Unmaintained since 2022-06**, and an id is not an attribution document. |
| `license-checker-rseidelsohn` | 5.0.1 (2026-07-15) | Partially (`--files` copies licence files out) | `--production` | Fallback only. Maintained, good for a machine-readable inventory / policy allowlist, but you assemble the document yourself. |
| `license-report` | 6.8.5 (2026-05-28) | No | yes | Reject for this job. It is a dependency *report* (name, version, link, licence id) for humans, not an attribution notice. |
| `oss-attribution-generator` | 1.7.1 | Yes | yes | Reject. **Abandoned since 2022-06**, and it also handles bower. |
| ORT | 91.2.0 | Yes (NoticeTemplate + configurable extra licence-text dir) | yes | Overkill here. Needs a JVM (**absent**) or Docker. Revisit only if a customer demands a CycloneDX/SPDX SBOM. |
| `npm ls --json --omit=dev` / `bun pm ls` | native | **No** — no licence data at all | yes | Not an option. Use as an *input* to cross-check the resolved tree, nothing more. |

### The reconciliation step that makes it legally useful

`generate-license-file` reads the resolved dependency tree; the asar is what ships. They disagree, and the disagreement is exactly what an auditor would find:

| direction | count | examples |
| --- | --- | --- |
| **Ships in asar, MISSING from the document** | **4** | `@whiskeysockets/baileys`, `string-width-cjs`, `strip-ansi-cjs`, `wrap-ansi-cjs` (the three `*-cjs` are npm aliases resolving to a different real name; baileys is separately vendored/patched via the WhatsApp bridge) |
| Documented but does NOT ship (over-attribution) | 16 | `@types/*` ×7, `typescript`, other-arch `@img/sharp-*`, `encoding` |

So:

```bash
# 1. generate
bunx generate-license-file@4.2.1 --input package.json \
  --output notices/THIRD-PARTY-LICENSES.txt --overwrite
# 2. enumerate what actually ships (packaged, not source-mode)
bunx @electron/asar@4.2.1 list "out/mac-arm64/Wayland.app/Contents/Resources/app.asar" > .provenance/asar-list.txt
# 3. reconcile — CI fails only on the "ships but undocumented" direction
node scripts/reconcile-shipped-licences.mjs
```

Fail the build on a non-empty *ships-but-undocumented* set. Warn only on *documented-but-not-shipped*, since over-inclusion carries no liability. Add `notices/THIRD-PARTY-LICENSES.txt` to `extraResources` — the `notices/` directory already ships (verified present at `Wayland.app/Contents/Resources/notices/`), so no `electron-builder.yml` change is needed beyond the file itself.

⚠️ The 59 packages that ship no licence file of their own need their text resolved from the registry/SPDX corpus. `generate-license-file` already emitted text for most of them; the residue is a small manual list, and it needs an explicit "could not determine" section rather than a silent omission.

---

## Job (c) — the CI regression gate

Three layers. Only the first is novel; the other two are off-the-shelf.

### Layer 1 — `provenance.json` drift check (build this)

```json
{
  "upstreams": {
    "aionui": { "url": "https://github.com/iOfficeAI/AionUi.git",
                "pin": "b97f34b28e…", "forkpointEvidence": ".planning/phases/WLD-I-*/forkpoint-scan.json" }
  },
  "files": [
    { "path": "src/common/electronSafe.ts", "upstream": "aionui",
      "upstreamPath": "src/common/electronSafe.ts",
      "verdict": "NORMALIZED_IDENTICAL", "ov": 1.0,
      "requiredNotice": "Copyright 2025 AionUi (aionui.com)",
      "contentHash": "sha256:…" }
  ]
}
```

The checker fails on:
1. a listed file whose header no longer contains `requiredNotice` — a notice was removed;
2. a file **not** listed whose normalized hash or ≥0.5 overlap matches any pinned upstream — new derived code arrived without a notice;
3. a listed file whose `contentHash` changed **and** whose verdict was `MEDIUM_OVERLAP`/`LOW_OVERLAP` — re-adjudicate, since those were human calls;
4. a `notices/THIRD-PARTY-NOTICES.md` claim naming a path that does not exist, or naming an upstream absent from `upstreams`.

**False-positive control:** rule 2 fires only on `NORMALIZED_IDENTICAL` or ≥0.5 overlap against a *pinned upstream tree*. On the measured distribution the nearest non-derived file sits at 0.018, so the 0.5 threshold has ~28× headroom. Run it against the pinned mirrors (vendored under `.provenance/upstreams/`, or a CI cache keyed on the pin) so it is offline and deterministic. Full run over 1,427 pairs took seconds — cheap enough for every PR.

Rule 4 is the layer that would have caught **all four** false claims in `notices/THIRD-PARTY-NOTICES.md`. Extend it to assert claims against the artifact rather than the config: the `.wcore.toml` claim was false because nobody grepped the shipped binary, and the "31 headers" count was wrong because nobody counted.

### Layer 2 — `reuse lint` (adopt, scoped)

```bash
uvx --with charset-normalizer reuse@6.2.0 lint            # whole project
uvx --with charset-normalizer reuse@6.2.0 lint-file <paths>   # PR-scoped, fast
```

Ran it. Real findings on the current tree:

- `LICENSES/openclaw.txt` and `LICENSES/hermes-agent.txt` → *"Could not resolve SPDX License Identifier … make sure it starts with `LicenseRef-`"*. Rename to `LICENSES/LicenseRef-openclaw.txt` etc.
- `src/common/electronSafe.ts: missing license 'Apache-2.0'` and same for `TunnelManager.ts` — because there is no `LICENSES/Apache-2.0.txt`; ours lives at `notices/Apache-2.0.txt`.

**Is the REUSE Specification worth adopting wholesale? Yes for the declaration half, no as the provenance mechanism.**

For: it is a real standard (FSFE, SPDX-based), the tool is a CI-ready exit-code gate, and 2,625 files already carry `SPDX-License-Identifier` so we are part-way. Cost is bounded: move/rename licence texts into `LICENSES/<SPDX-ID>.txt`, and cover the ~4,900 files that have no header via a root `REUSE.toml` path-glob block rather than 4,900 edits. Our free-form `Copyright 2026 Ferrox Labs` lines already satisfy REUSE's copyright half (it accepts `Copyright`/`©`/`(C)`, not just `SPDX-FileCopyrightText:`) — confirmed by the lint output flagging only the licence side. There are **0** `SPDX-FileCopyrightText` lines and 3,451 files with a plain `Copyright` line; that is fine, no mass rewrite needed.

Against: REUSE records *what licence a file is under*. It has no vocabulary for *"derived from upstream X at pin Y"*. It cannot replace layer 1.

⚠️ `REUSE.toml` path globs are tempting as the §4(c) remedy for all 1,390 derived files instead of editing 1,390 headers. It is standards-based and one file, but Apache-2.0 §4(c) speaks of notices carried *"in the Source form of the Work"*. **Route that choice to counsel; do not let it be decided by convenience.** The per-file restoration is mechanically trivial anyway — we have the exact list and the exact upstream line, so it is one scripted pass.

### Layer 3 — header-shape check (build, ~20 lines)

Assert that every provenance statement lives **inside** a single `@license`/`/*!` block. This is not style policing — see the next section for the measurement showing why the shape decides whether the notice ships.

**Note for the phase planner:** the repo forbids `prek run --all-files`. Wire all three layers as explicit CI steps with scoped file arguments (`reuse lint-file $CHANGED`), not as an all-files pre-commit hook.

---

## Job (5) — the Rollup constraint, measured

The premise in the question is close but the mechanism is different, and the difference matters. **Measured with the repo's own rollup 4.59.0:**

| shape (all inside one module) | survives bundling? |
| --- | --- |
| plain block comment, blank line, `import` | **yes** |
| `@license` block, plain block (no blank line between), `import` | **yes, both** |
| `@license` block, **blank line**, plain block, blank line, `import` | **`@license` survives; the plain block is DROPPED** |
| `@license` block, blank line, plain block, no import at all | **yes, both** |
| plain block placed *after* the imports | **yes** |
| `@preserve` / `/*! */` / `//!` before an `import` | **yes** |

Rollup with no minifier preserves everything **except comments attached to a node it removes** — and it removes `import` declarations. A legal comment (`@license`, `@preserve`, `/*!`, `//!`) attached to a removed import is hoisted and kept; a non-legal one goes with the import. The blank-line dependency is the trap: it splits the comment group so the legal block is captured and the rest is not.

`src/process/channels/tunnel/TunnelManager.ts` is exactly the losing shape — `@license` block, blank line, "Ported from OpenClaw's `tunnel.ts`" block, blank line, imports. Confirmed against the real build: `getTailscaleDnsName` **is** in `out/main/chunks/index-Cc44h5sw.js`, and `"Ported from OpenClaw"` appears **0 times** anywhere in `out/main/`. The code ships; the notice does not.

Separately, `esbuild` 0.28.0 (Vite's minifier, renderer only) applies its own rule: it keeps only legal comments, and `legalComments` defaults to `eof` when bundling / `inline` when transforming. `out/renderer/assets/*.js` has 7 files carrying `/*!` comments, so the renderer path works — but only for legal-comment shapes.

### Recommendation: stop relying on comment shape

Per-file shape is a rule humans must remember, and six header dialects in this tree prove they do not. Two changes, both cheap:

1. **Fold every provenance statement inside the single `@license` block** — no blank line, no second block. Commit `485b212ff` already did this for 8 files; extend it to all of them and enforce it with layer 3.
2. **Add a generated `output.banner`** so retention does not depend on per-file shape at all:

```ts
// electron.vite.config.ts — main.build.rollupOptions.output
output: {
  banner: () => fs.readFileSync('notices/BUNDLE-NOTICE.txt', 'utf8'),
  // BUNDLE-NOTICE.txt MUST open with /*! or contain @license, or esbuild strips it
}
```

A banner is applied after bundling, so tree-shaking cannot reach it. Generate `BUNDLE-NOTICE.txt` from `provenance.json` in `prebuild`/`prepackage` so the shipped notice and the manifest cannot drift.

`rollup-plugin-license@3.7.1` is the templated alternative — `banner.commentStyle: 'ignored'` emits the `/*!` form and `banner.content.file` points at a file, with lodash templating over `pkg`/`dependencies`. Its **`thirdParty` half is useless here**: it lists only deps *actually bundled*, and `externalizeDepsPlugin()` means main-process deps are externalised, not bundled. Adding the plugin buys templating; `output.banner` with a generated file buys the same with zero new dependencies. Prefer the native option.

---

## Job (6) — proving a notice reached the packaged artifact

Source-mode or `electron-builder.yml` inspection is not proof. `PROJECT.md` already commits to this standard; here is the mechanism, all verified against the real `out/mac-arm64/Wayland.app`:

```bash
APP="out/mac-arm64/Wayland.app/Contents/Resources"

# 1. loose extraResources present, and their content asserted (not just their path)
test -f "$APP/notices/THIRD-PARTY-LICENSES.txt"
grep -qF "Copyright 2025 AionUi (aionui.com)" "$APP/notices/THIRD-PARTY-NOTICES.md"

# 2. per-file notices survived bundling — for each requiredNotice in provenance.json,
#    assert it appears in out/main/**, out/preload/**, out/renderer/**
node scripts/verify-notices-in-bundle.mjs   # greps the emitted chunks, not the sources

# 3. shipped-package set matches the attribution document (job b step 3)
bunx @electron/asar@4.2.1 list "$APP/app.asar" > /tmp/asar.txt
node scripts/reconcile-shipped-licences.mjs /tmp/asar.txt

# 4. inverse assertion — a notice we deliberately removed must be ABSENT
#    (catches a stale generated banner shipping a claim we retracted)
```

Step 2 is the one that was missing and is why the tunnel-trio notices were dropped from every build. Step 4 is what would have caught the 11 stripped OpenClaw credits if any had still been asserted in the shipped notices file.

Runs on `bun run dist:verify:mac` (`--dir`, no signing, no notarisation), which the D-08 packet already built. **`bun run package` / `dist:verify:mac`, never raw `electron-vite build`** — the packaged artifact is the only thing that proves anything.

---

## Installation

```bash
# job (a) — provenance
mkdir -p .provenance/upstreams
git clone --mirror https://github.com/iOfficeAI/AionUi.git .provenance/upstreams/aionui.git
# (repeat per upstream; ~5 min, ~1.5 GB total, offline thereafter)
# provcmp.mjs / forkpoint.mjs: no dependencies, node built-ins only

# job (a) second opinion
bunx jscpd@5.0.14 --min-tokens 40 --min-lines 5 --reporters json \
  --output .provenance/jscpd ours-tree upstream-tree

# job (b)
bunx generate-license-file@4.2.1 --input package.json \
  --output notices/THIRD-PARTY-LICENSES.txt --overwrite
bunx @electron/asar@4.2.1 list <path-to-app.asar>

# job (c)
uvx --with charset-normalizer reuse@6.2.0 lint          # NOT bare `uvx reuse` — it crashes
```

Nothing above needs a paid licence. Everything runs offline after the initial clones and `bunx`/`uvx` cache warm. **Add `@electron/asar`, `generate-license-file` and `jscpd` as `devDependencies` (pinned) rather than `bunx`-on-demand** so CI is hermetic; `reuse` stays a `uvx` invocation since it is Python.

---

## What NOT to use

| Avoid | Why | Use instead |
| --- | --- | --- |
| Any licence scanner as the derivation classifier (scancode, FOSSology, licensee, ninka, ORT) | They answer "what licence does this tree declare?", not "is this file derived from that file". Conflating the two is what produced WLD-H's wrong verdicts. | `provcmp.mjs` against a pinned mirror |
| **Comparing against the upstream's current `main`** | Collapsed the same-path set from 1,424 to **81** and produced the wrong "445 files / fork point unrecoverable / ~310 derived" frame. | The fork-point pin, found by blob-set maximisation |
| **Comparing at HEAD instead of the root import commit** | Reintroduces the port-vs-copy problem that literal-line overlap cannot solve. Derivation is settled at the import; later rewrites do not undo it. | Classify at `2b3b60e11`, then map forward |
| MOSS | Network-only, emailed account, academic-use terms, requires uploading proprietary source to Stanford | jscpd locally |
| simian | Paid, closed, effectively dead | jscpd |
| PMD CPD / NiCad / SourcererCC | Need a JVM (**absent on this box**) or TXL; no marginal detection over jscpd at our 1,427-pair scale | jscpd |
| `license-checker@25.0.1`, `oss-attribution-generator@1.7.1` | Both unmaintained since June 2022; the former emits ids not texts | `generate-license-file@4.2.1` |
| `rollup-plugin-license`'s `thirdParty` | Lists only *bundled* deps; `externalizeDepsPlugin()` means main-process deps are not bundled | `generate-license-file` + asar reconciliation |
| Software Heritage as a provenance oracle | The origin-naming provenance endpoint needs authentication + special permission; git blob SHA-1 already *is* `sha1_git` and we can clone the upstreams | `git clone --mirror` |
| Per-file comment shape as the retention mechanism | Measured: even the "correct" `@license`-first shape drops a following block when separated by a blank line and followed by an import | Fold into one `@license` block **and** add a generated `output.banner` |
| `prek run --all-files` | Forbidden by this repo | Explicit CI steps with scoped file arguments |
| Bare `uvx reuse` | Crashes with `NoEncodingModuleError` | `uvx --with charset-normalizer reuse@6.2.0` |
| `bun pm ls` / `npm ls --json` as the licence source | No licence data at all | `generate-license-file`; use `npm ls` only to cross-check the resolved tree |

---

## Stack patterns by variant

**If counsel accepts a machine-readable manifest as §4(c) "retention in the Source form":**
- Declare the derived set via a root `REUSE.toml` path-glob block plus `provenance.json`.
- One file changes instead of 1,390. Layer 2 (`reuse lint`) then covers most of layer 1's rule-1 duty.

**If counsel requires per-file notice restoration (assume this until told otherwise):**
- Script the restoration from `provenance.json` — each row already carries the exact upstream copyright line.
- Fold the statement inside the single `@license` block so it survives bundling.
- Keep `provenance.json` anyway as the CI gate's input.

**If a customer or distribution channel later demands an SBOM:**
- Add ORT 91.2.0 via Docker (no JVM on this box) purely as a CycloneDX/SPDX reporter. Do not let it displace `generate-license-file` for the human-readable attribution doc.

**If the upstream mirrors cannot be vendored into CI (size):**
- Cache `.provenance/upstreams/` keyed on the pin SHAs. The gate must fail closed if the cache is missing — a skipped provenance check that reports green is the same class of bug as the docs-only stub that satisfied `main`'s required checks (`ci-required-checks-bypass-docs-stub`).

---

## Version compatibility

| Package | Verified against | Notes |
| --- | --- | --- |
| rollup 4.59.0 / vite 6.4.3 / esbuild 0.28.0 / electron-vite 5.0.0 | this repo's `node_modules` | All comment-retention measurements above were made with these exact versions |
| electron-builder 26.10.0 | the real `out/mac-arm64` build | Ships the full production transitive tree into the asar regardless of the `files` allowlist |
| `@electron/asar` 4.2.1 | 721 MB `app.asar` | `list` completed in 2.6 s; 84,824 entries |
| `generate-license-file` 4.2.1 | this repo's `package.json` | Ran clean with no config file; warns on ambiguous licence files |
| `jscpd` 5.0.14 | two-tree fixture | Rust engine, no Node runtime needed; use the **JSON** reporter, the console one prints bare basenames |
| `reuse` 6.2.0 | this repo | Needs Python ≥3.10 **and** an encoding module; box Python is 3.14.5 and works via `uvx --with charset-normalizer` |
| `scancode-toolkit` 32.5.0 | not run | Publishes a `cp314` wheel, so it would install on this box's Python 3.14.5 — but it does not solve our problem |
| ORT 91.2.0, FOSSology 4.7.1, PMD CPD, NiCad | **not run** | No JVM (`java -version` fails). Docker 29.4.1 is available if ever needed. MEDIUM confidence on these rows — capability read from docs, not executed. |

---

## Sources

**Measured locally (HIGH confidence — reproducible from the commands in this document):**
- Rollup/esbuild comment-retention matrix — 5 fixture variants against `rollup@4.59.0` + `esbuild@0.28.0` from this repo's `node_modules`
- Fork-point scan, blob intersection, 1,427-file classification, control set — `git --mirror` clone of `iOfficeAI/AionUi` (18,151 commits) vs `2b3b60e11` and `HEAD`
- `web-fetch.ts` / `web-search.ts` / `electronSafe.ts` upstream headers — `git show b97f34b28e:<path>`
- Shipped package set, licence-file coverage, 4/16 reconciliation delta — `@electron/asar@4.2.1 list` over `out/mac-arm64/Wayland.app/Contents/Resources/app.asar` vs `generate-license-file@4.2.1` output
- `reuse@6.2.0 lint-file` findings; `jscpd@5.0.14` cross-tree clone detection; absence of a JVM
- Header inventory: 2,625 `SPDX-License-Identifier`, 0 `SPDX-FileCopyrightText`, 3,451 free-form `Copyright`, 7,572 source files
- Registry/release metadata — `registry.npmjs.org`, `pypi.org/pypi/*/json`, `api.github.com/repos/*/releases/latest`

**Documentation (MEDIUM confidence):**
- `rollup-plugin-license` README (upstream `master`) — option names verified verbatim
- ORT reporter/NoticeTemplate capability — oss-review-toolkit.org docs
- ScanCode Toolkit CLI/detection scope — scancode-toolkit.readthedocs.io

**LOW confidence (single web source, not verified by execution):**
- Software Heritage provenance-endpoint gating — docs.softwareheritage.org

**Gaps this research did not close:**
- Whether counsel accepts `REUSE.toml`/`provenance.json` as §4(c) source-form retention. Blocks the choice between a 1-file and a 1,390-file remedy.
- The chain-of-custody question raised by finding 3: for every upstream that also exists in AionUi@pin, is the notice owed to AionUi, to the original upstream, or both? Affects `notices/THIRD-PARTY-NOTICES.md` wholesale, not just `web-fetch.ts`.
- Licence text for the 59 shipped packages that carry none of their own.
- The `3f1c5ba10` re-adjudication has not been run — the pipeline is specified but acpx/Zed/Codex CLI have not been cloned, and Claude Code is closed source so it will stay UNVERIFIED.

---
*Stack research for: WLD-I Licence Compliance tooling*
*Researched: 2026-07-30*
