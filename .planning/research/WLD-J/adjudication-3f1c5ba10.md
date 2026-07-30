# WLD-J — Adjudication of `3f1c5ba10` ("docs: drop competitor names from design-inspiration comments")

**Date:** 2026-07-30 · **Branch:** `packet/attribution-audit` · **Worktree:** `/Users/seandonahoe/dev/wayland-worktrees/packet-attribution`
**Scope:** every provenance reference deleted by `3f1c5ba10`, adjudicated to the evidentiary standard `9add51a0c` met.
**Nothing was committed, reverted, or edited. Research only.**

> ## ⛔ HEADLINE — the commit's stated premise is false for 7 of its 9 deletions
>
> The commit justified every deletion with one sentence: *"None of these upstreams has code in this
> repo, none appears in any notices file."*
>
> **Seven of the nine deleted lines were not ours to delete.** They are AionUi's own attribution
> notices, present byte-for-byte at the same path in AionUi **v1.9.5** (`5b2c741f92`, the fork point
> Sean supplied), in files measured at **72.5% – 100% literal derivation** from that upstream.
> Apache-2.0 **§4(c)** requires us to *retain, in the Source form of any Derivative Works we
> distribute, all copyright, patent, trademark, and attribution notices from the Source form of the
> Work.* `3f1c5ba10` deleted attribution notices out of AionUi's source.
>
> The obligation those seven lines discharge is **owed to AionUi**, not to Figma or NocoBase.
> Whether Figma has a claim is a second-order question; whether AionUi does is not.
>
> **And the "no code in this repo" claim is independently false in two places:**
> - **Cherry Studio** — `/(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i` ships in
>   `src/common/utils/modelCapabilities.ts` **byte-identical** to Cherry Studio's `RERANKING_REGEX`.
>   Cherry Studio is **AGPL-3.0 + a >10-person commercial-licence trigger**. It appears in no notices file.
> - **acpx** — our whole `src/process/acp/` infra layer is a documented port of acpx v0.5.3 (MIT),
>   per *our own internal spec*, confirmed by measurement. It carries **zero** attribution anywhere.
>
> **Recommendation: full revert of `3f1c5ba10`**, then a separate packet to *add* the attribution
> that was already missing before this commit.

---

## 0. Correction to the brief I was given

The brief states *"acpx and Zed are GPL-family, which is the licence family with real teeth."*
**Half wrong, and it points at the wrong file.**

| upstream | actual licence | evidence |
| --- | --- | --- |
| **acpx** | **MIT**, © 2025 OpenClaw Team | `LICENSE` at tag `v0.5.3` (`087f8207d5`, 2026-04-08); npm metadata MIT for every version from 0.1.2 onward (0.1.0 was Apache-2.0) |
| **Zed** | GPL-3.0 (editor crates) | correct, but see §3 — no Zed code is present, and none can be: it is Rust, ours is TypeScript |
| **Cherry Studio** | **AGPL-3.0 + "User-Segmented Dual Licensing"** — organisations of **more than 10 individuals MUST obtain a commercial licence** | `LICENSE` at `b5632b009` (v1.6.0-beta.7, 2025-09-06); `gh api repos/CherryHQ/cherry-studio` → `AGPL-3.0` |
| **NocoBase** | proprietary **"NocoBase License Agreement"** (NOCOBASE PTE. LTD., updated 2026-02-24) + `LICENSE-APACHE.txt`; GitHub reports `NOASSERTION` | `LICENSE.txt` on `main` |
| **Codex CLI** | Apache-2.0 | `gh api repos/openai/codex` |
| **Figma** | proprietary, **no source published** | — |
| **Claude Code** | proprietary (Anthropic Commercial ToS) | `package.json` → `"license": "SEE LICENSE IN README.md"` |

**The GPL-family exposure in this commit is Cherry Studio, and it is the one deletion where verbatim
third-party code is provably still shipping.**

---

## 1. Method

Same three-instrument method the cross-audit settled on, with the corrections it learned the hard way.

1. **Literal substantive-line overlap** (`litcmp2.py`) — detects copy-paste. Blind to a port.
2. **Distinctive-identifier overlap** (`distinctids.py`) — detects a port. Judged on the *content* of
   the shared set, never the raw percentage: third-party API vocabulary is discarded, hand-authored
   helper names convict.
3. **Max-overlap sweep** (`maxoverlap.py`) — guards against comparing against the wrong upstream file.

Every upstream was **checked out at a pin**, never queried through `search/code` (default-branch-only;
the trap recorded in `H-FINDINGS.md` §9d).

### Controls, run first

| comparison | literal | identifier | reading |
| --- | --- | --- | --- |
| `src/common/electronSafe.ts` vs AionUi 1.9.5 same path | **100.0%** (28/28) | — | **positive control** (the known unmodified copy) |
| `cronSkillFile.ts` vs *all* AionUi 1.9.5 `src/**` | **2.9%** max (2 lines: `import fs from 'fs/promises';`) | 7/56 (all generic) | **negative control** |
| `IAcpClient.ts` vs *all* AionUi 1.9.5 `src/**` | **0 lines against every file** | — | **negative control** |
| `durabilitySync.ts` (Ferrox original) vs acpx `src/acp/*` | — | 5/24, all generic (`NodeJS`, `platform`) | **negative control** |
| `cronSkillFile.ts` vs acpx `src/acp/*` | — | 7/56, all generic | **negative control** |

Floor 0–3%, ceiling 100%. Everything below sits far outside the noise band.

### Pins used

| upstream | pin | date | obtained by |
| --- | --- | --- | --- |
| AionUi | **v1.9.5** (`5b2c741f92`) | fork point | existing checkout `xaudit-attribution/aionui-195` |
| acpx | **v0.5.3** = `087f8207d58aebc6efd3ea455488aad0cd07d3af` | 2026-04-08 | `git clone github.com/openclaw/acpx` + `git checkout v0.5.3` |
| Cherry Studio | `b5632b009` (v1.6.0-beta.7) | 2025-09-06 | raw.githubusercontent at pinned sha |
| openai/codex | `main` @ 2026-07-30 | — | raw.githubusercontent (`codex-rs/core/src/tools/sandboxing.rs`, 521 lines) |
| Claude Code | **2.1.112** (last release shipping `cli.js`) | 2026-04-16 | npm tarball, 13.7 MB bundle |
| NocoBase | `main` | 2026-07-30 | GitHub API |
| Figma | **unobtainable — closed source** | — | — |

**Why 2.1.112 for Claude Code:** every release from **2.1.113 (2026-04-17)** onward dropped the JS
bundle (unpacked size 48 MB → 129 KB; it is now a native-binary installer). 2.1.112 is the last
distributable artifact containing readable code, and it predates our file.

---

## 2. What was actually deleted

Nine sites in eight files. *(The commit message says "Ten comments" — it is nine. Same class of
accounting slip as cross-audit finding #7.)*

| # | file:line (pre-commit) | exact removed text | upstream named |
| --- | --- | --- | --- |
| 1 | `src/process/acp/infra/IAcpClient.ts:11` | ` * Inspired by acpx's AcpClient and Zed's AcpConnection.` | acpx, Zed |
| 2 | `src/process/agent/acp/ApprovalStore.ts:10` | ` * This implementation is inspired by Codex CLI's ApprovalStore.` | Codex CLI |
| 3 | `src/process/extensions/lifecycle/ExtensionEventBus.ts:42` | ` * Inspired by NocoBase's event system, this provides:` → ` * Provides:` | NocoBase |
| 4 | `src/process/extensions/sandbox/permissions.ts:10` | ` * Extension permission declarations - inspired by Figma's manifest permissions model.` | Figma |
| 5 | `src/process/extensions/sandbox/sandbox.ts:15` | ` * Inspired by Figma's iframe sandbox model, adapted for Node.js:` | Figma |
| 6 | `src/process/extensions/types.ts:103` | `     * Lifecycle hook scripts (inspired by NocoBase plugin lifecycle).` | NocoBase |
| 7 | `src/process/extensions/types.ts:120` | `     * Permission declarations (inspired by Figma's manifest permissions).` | Figma |
| 8 | `src/process/services/cron/cronSkillFile.ts:62` | ` * Mirrors Claude Code's parseTaskFileContent().` | Claude Code |
| 9 | `src/renderer/utils/model/modelCapabilities.ts:66` | ` * ... three-layer resolution inspired by Cherry Studio` | Cherry Studio |

---

## 3. THE DECISIVE FINDING — seven of nine are AionUi's notices, not ours

Six of the eight touched files exist at the **identical path** in AionUi v1.9.5, and **each carries the
deleted comment**. Method confirmed with a positive control (`find -name ApprovalStore.ts` returns 3
hits in the AionUi tree, so a zero is real, not a broken search).

| our file | AionUi v1.9.5 same path | literal derivation | AionUi's own text at the same line |
| --- | --- | --- | --- |
| `agent/acp/ApprovalStore.ts` | ✔ | **100.0%** (27/27) | `* This implementation is inspired by Codex CLI's ApprovalStore.` — **byte-identical** |
| `extensions/lifecycle/ExtensionEventBus.ts` | ✔ | **100.0%** (23/23) | `* Inspired by NocoBase's event system, this provides:` — **byte-identical** |
| `extensions/sandbox/sandbox.ts` | ✔ | **95.1%** (98/103) | `* Inspired by Figma's iframe sandbox model, adapted for Node.js:` — **byte-identical** |
| `renderer/utils/model/modelCapabilities.ts` | ✔ | **94.1%** (32/34) | `* 能力匹配的正则表达式 - 参考 Cherry Studio 的做法` / `* 判断模型是否具有某个能力 - 参考 Cherry Studio 的三层判断逻辑` — **our English line is a translation of it** |
| `extensions/sandbox/permissions.ts` | ✔ | **89.6%** (43/48) | `* Extension permission declarations — inspired by Figma's manifest permissions model.` (em dash upstream, hyphen ours) |
| `extensions/types.ts` | ✔ | **72.5%** (190/262) | lines 75 & 92: `(inspired by NocoBase plugin lifecycle)` / `(inspired by Figma's manifest permissions)` — **byte-identical** |

Two files are **absent from all three AionUi checkouts** (`aionui-195`, `aionui-0611`, current `main`)
and are therefore not covered by this argument: `IAcpClient.ts` and `cronSkillFile.ts`. They are
adjudicated on their own upstreams in §4 and §7.

### The AionUi comments are systemic, not incidental

Grepping AionUi v1.9.5 for the named upstreams shows the extension subsystem is comprehensively
attributed *by AionUi*, in files we also carry:

```
src/common/adapter/ipcBridge.ts:1009   /** Permission summary for extension management UI (Figma-inspired) */
src/common/adapter/ipcBridge.ts:1100   // --- Extension Management API (NocoBase-inspired) ---
src/process/bridge/extensionsBridge.ts:196   // --- Extension Management API (NocoBase-inspired) ---
src/process/extensions/ExtensionRegistry.ts:72  // --- Engine compatibility check (Figma-inspired API version locking) ---
src/process/agent/codex/core/ApprovalStore.ts:10
    * This implementation is inspired by Codex CLI's ApprovalStore (codex-rs/core/src/tools/sandboxing.rs).
```

`3f1c5ba10` removed a subset of these and left the rest. The result is a tree that still carries
AionUi's Figma/NocoBase attributions in four other files while having stripped them from five —
internally incoherent whichever way the licence question lands.

### Why this is worse than a §4(c) technicality

`H-CROSSAUDIT.md` already establishes that **~310 `src/` files are AionUi-derived and carry only a
Ferrox Labs copyright** — the §4(c) exposure. `3f1c5ba10` is the same violation performed **actively
and deliberately**, with a commit message recording the intent. In the WLD-I frame (17 U.S.C. §1202,
removal/alteration of copyright management information *with knowledge*), a pre-existing header
substitution inherited from a squashed import and a **fresh 2026-07-30 commit titled "drop competitor
names"** are not the same fact. The second is far harder to characterise as inadvertent.

**This alone is sufficient for RESTORE on sites 2–7 and 9, independent of anything below.**

---

## 4. `IAcpClient.ts` — acpx (site 1). RESTORE. The strongest case in the commit.

This is the one file where the deleted line was the **only** provenance record left in the entire
subsystem, and where the underlying derivation is documented, measured, and unattributed.

### 4.1 Our own internal spec says the file *is* the acpx distillation

The surviving comment points at `docs/specs/acp-rewrite/02-reference-implementation.md §8`.
**That file does not exist in the tree** — so after `3f1c5ba10` the comment is a dangling pointer and
the acpx/Zed clause was the only live provenance in the file.

The doc is recoverable from the object database (deleted by the off-mainline commit `4dbd2f76f`,
"strip non-public docs"); I read all 506 lines at `4dbd2f76f^`. It is titled
**"参考实现分析：acpx (OpenClaw) 与 Zed"** — *Reference-implementation analysis: acpx (OpenClaw) and Zed* —
and it says, in its own words:

- L26–28: *"acpx (v0.5.3) … its `src/acp/` directory implements a clean ACP protocol client. **Wayland's ACP refactor chose acpx as the reference implementation**"*
- L228: *"the following modules are unrelated to acpx business logic … **and can be directly ported into Wayland's new architecture**"*
- **§9.1 "直接复用" (direct reuse) — an explicit port manifest:**

| acpx module | our file | the doc's own note |
| --- | --- | --- |
| `client-process.ts` | `infra/processUtils.ts` | 直接移植 — **directly ported** |
| `error-shapes.ts` | `errors/errorExtract.ts` | 直接移植 — **directly ported** |
| `error-normalization.ts` | `errors/errorNormalize.ts` | ported core logic |
| `jsonrpc-error.ts` | `errors/errorJsonRpc.ts` | 直接移植 |
| `session-control-errors.ts` | inlined into `AcpProtocol.ts` / `errorNormalize.ts` | 直接移植 |
| AcpClient connection management | **`infra/AcpClient.ts`** (= `IAcpClient.ts` + `ProcessAcpClient.ts`) | merge Connector + Protocol into a single owner |

- §8.3: `ProcessAcpClient` *"**inherits all of acpx's patterns** — pending request tracking, lifecycle observers, stderr ring buffer, startup-failure watchdog."*
- Closing line: *"外部参考：[acpx 源码](https://github.com/openclaw/acpx) **v0.5.3**"*.

### 4.2 The measurement agrees — in the deleted file itself

acpx `src/acp/client.ts` @ `087f8207d5`, lines 125–150:

```ts
type AgentDisconnectReason = "process_exit" | "process_close" | "pipe_close" | "connection_close";
export type AgentExitInfo = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  exitedAt: string;
  reason: AgentDisconnectReason;
  unexpectedDuringPrompt: boolean;
};
export type AgentLifecycleSnapshot = { pid?: number; startedAt?: string; running: boolean; lastExit?: AgentExitInfo; };
```

ours, `IAcpClient.ts:76–91` — the file whose acpx credit was deleted:

```ts
export type AgentDisconnectReason = 'process_exit' | 'process_close' | 'pipe_close' | 'connection_close';
export type AgentExitInfo = {
  exitCode: number | null;
  signal: string | null;
  reason: AgentDisconnectReason;
  stderr: string;
  unexpectedDuringPrompt: boolean;
};
export type AgentLifecycleSnapshot = { pid: number | null; running: boolean; lastExit: AgentExitInfo | null; };
```

Same three type names. **The four-member union is identical in members and order.** `exitedAt` and
`startedAt` dropped, `stderr` added, optionality changed — a *modified copy*, which is precisely what
§4(c)/MIT contemplate. `unexpectedDuringPrompt` is a hand-authored name that exists in no protocol,
no SDK and no library; it is not ACP vocabulary.

Four whole lines are byte-identical (`export type AgentExitInfo = {`, `export type
AgentLifecycleSnapshot = {`, `reason: AgentDisconnectReason;`, `unexpectedDuringPrompt: boolean;`) —
14.8% of a 27-line interface file, against a negative-control floor of 0%.

Identifier overlap 31/49 vs the extension, 30/49 against `client.ts` alone. Discarding ACP protocol
vocabulary (`createSession`, `loadSession`, `prompt`, `cancel`, `sessionId`, `InitializeResponse`…),
what remains is exactly the hand-authored acpx set: `AgentDisconnectReason`, `AgentExitInfo`,
`AgentLifecycleSnapshot`, `unexpectedDuringPrompt`, `lastExit`, and the four literal union members.

### 4.3 The port really happened, and carries no notice at all

| our file | vs acpx | literal | distinctive identifiers shared |
| --- | --- | --- | --- |
| `infra/processUtils.ts` | `client-process.ts` | 11.1% incl. verbatim `export function waitForSpawn(child: ChildProcess): Promise<void> {` and `let quote: "'" \| '"' \| null = null;` | 17/31 incl. `splitCommandLine`, `escaping`, `onSpawn`, `settled`, `finish` |
| `errors/errorExtract.ts` | `error-shapes.ts` | 6.2% | `extractAcpError` — the doc calls it *"the single most valuable function"*. Same recursion cap (**ours `MAX_DEPTH = 5`**, acpx `if (depth > 5)`), same `{code, message, data?}` shape, same `error`/`cause`/`acp` field walk, same "4-level fallback" for `formatUnknownError` |
| `infra/ProcessAcpClient.ts` | `client.ts` | 6.3% (14 lines) | **92/197** incl. `runConnectionRequest`, `AgentSpawnError`, `AgentStartupError`, `AgentDisconnectedError`, `createStartupFailureWatcher`, `recordAgentExit` |

Negative control on the same corpus: 5/24 and 7/56, all generic.

**`grep -rn -i "openclaw|MIT License|adapted from|ported from|Copyright (c)" src/process/acp/` returns
zero.** The entire ported subsystem has no attribution. acpx is MIT — *"The above copyright notice
and this permission notice shall be included in all copies or substantial portions of the Software."*

`src/process/acp/errors/errorNormalize.ts:20–39` still names `acpx/src/acp/error-shapes.ts` and
`isAcpResourceNotFoundError` — both of which exist at the pin — so the branch is **already
inconsistent about acpx too**, not only about Claude Code.

**Verdict: RESTORE.** This deletion removed the last provenance marker from a subsystem that our own
spec calls a port of acpx, that measurement confirms is a port of acpx, and that carries no notice.

### 4.4 Zed — no code, keep the credit anyway

Zero Zed-specific identifiers in our tree: `_io_task`, `_wait_task`, `_stderr_task`, `AcpThread`,
`AgentConnectionStore`, `CustomAgentServer`, `acp_thread`, `agent_servers` → **0 hits each** (grep
verified working by a positive control, `AgentExitInfo` → 4). The spec treats Zed in §3 (analysis) and
§9.2 (borrowed patterns) only; **§9.1 direct-reuse contains no Zed row**. Zed is Rust; our file is a
TypeScript interface. **No GPL-3.0 exposure is demonstrable.**

The credit is a single clause covering both. Splitting it to drop only Zed buys nothing, and over-credit
is harmless. Restore the sentence whole.

---

## 5. `modelCapabilities.ts` — Cherry Studio (site 9). RESTORE. Verbatim AGPL code still ships.

This is the deletion where the commit's factual claim is provably wrong.

**Cherry Studio `src/renderer/src/config/models/embedding.ts` @ `b5632b009`:**

```ts
export const EMBEDDING_REGEX =
  /(?:^text-|embed|bge-|e5-|LLM2Vec|retrieval|uae-|gte-|jina-clip|jina-embeddings|voyage-)/i
export const RERANKING_REGEX = /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i
```

**AionUi v1.9.5 `src/renderer/utils/model/modelCapabilities.ts`, under the comment
`能力匹配的正则表达式 - 参考 Cherry Studio 的做法`:**

```ts
embedding: /(?:^text-|embed|bge-|e5-|LLM2Vec|retrieval|uae-|gte-|jina-clip|jina-embeddings|voyage-)/i,
rerank:    /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i,
```

**Byte-identical.** Both regex literals. `LLM2Vec`, `uae-`, `jina-clip` are a distinctive
hand-curated token selection, not a domain inevitability.

**Ours today, `src/common/utils/modelCapabilities.ts` (shipping):**

```ts
const RERANK_MODEL = /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i;
```

— **byte-identical to Cherry Studio's `RERANKING_REGEX`.** `EMBEDDING_MODEL` was restructured with
token boundaries for issue #740 but retains the same curated set (`embed`, `bge`, `gte`, `e5`, `uae`,
`voyage`, `jina-clip`, `retrieval`, `llm2vec`). The rest of the block is still verbatim AionUi/Cherry
lineage: `function_calling: /gpt-4|claude-3|gemini|qwen|deepseek/i` and `reasoning: /o1-|reasoning|think/i`.

The "three-layer resolution" the deleted comment names is Cherry Studio's own shape: `isEmbeddingModel`
does user-selected override → provider rule (`anthropic`, `doubao`) → regex, exactly the order our
`hasModelCapability` implements. Cherry's `getLowerBaseModelName` ↔ our `getBaseModelName`.

**Licence:** Cherry Studio is **AGPL-3.0 with User-Segmented Dual Licensing** — organisations of more
than 10 individuals **must** obtain a commercial licence. It appears in **no** notices file and in **no**
`LICENSES/` entry. Our outbound AGPL-3.0-or-later is copyleft-compatible in direction, but AGPL §5
still requires the notices be kept, and the >10-person trigger is a live commercial question for Sean.

**Verdict: RESTORE**, and note that restoration to the renderer file alone is insufficient — the
regexes migrated to `src/common/utils/modelCapabilities.ts`, which never carried the credit. The
notice belongs on the definition.

**Open, cheap to close:** which Cherry Studio licence generation governs depends on when AionUi copied
the block. Cherry's `LICENSE` was rewritten on **2025-03-18** ("clearer commercial use terms") and again
2025-04-12/13; before that it was permissive. Query needed:
`gh api "repos/iOfficeAI/AionUi/commits?path=src/renderer/utils/model/modelCapabilities.ts"` → take the
earliest commit introducing `LLM2Vec`, compare to 2025-03-18.

*Honest weight:* a curated regex token-list is thin copyright material and reasonable people differ on
whether one regex literal is de minimis. It is not thin enough to assert "no code in this repo" — which
is what the commit asserted.

---

## 6. `ApprovalStore.ts` — Codex CLI (site 2). RESTORE.

The file is a **100% literal copy of AionUi** (27/27 lines), so §3 decides it outright. The underlying
Codex claim is also real and specific.

`openai/codex` (**Apache-2.0**) `codex-rs/core/src/tools/sandboxing.rs` — 521 lines, exists —
module doc line 3: *"Consolidates the approval flow primitives (`ApprovalDecision`, **`ApprovalStore`**,
`ApprovalCtx`, `Approvable`)"*, with:

```rust
pub(crate) struct ApprovalStore { … }
impl ApprovalStore { … }                       // get / put
matches!(store.get(key), Some(ReviewDecision::ApprovedForSession))
store.put(key, ReviewDecision::ApprovedForSession);
```

ours (`AcpApprovalStore`): `get(key)`, `put(key, optionId)` storing only `'allow_always'`, and
`isApprovedForSession(key)`. **`ApprovalStore` + `get`/`put` + `ApprovedForSession`** is a
hand-authored naming correspondence across a Rust→TypeScript boundary — the exact "port, not
copy-paste" category the cross-audit's CORRECTION section was written about. Literal overlap is
necessarily ~0 and proves nothing here.

AionUi's *sibling* file `src/process/agent/codex/core/ApprovalStore.ts:10` names the upstream file
path outright — `(codex-rs/core/src/tools/sandboxing.rs)` — confirming the reference was researched,
not decorative. Apache-2.0 §4(c) applies to Codex as well as AionUi.

**Verdict: RESTORE.** Consider restoring AionUi's fuller form, with the `codex-rs/...` path.

---

## 7. `cronSkillFile.ts` — Claude Code (site 8). RESTORE (upstream UNVERIFIED).

Not an AionUi file (absent from all three checkouts; positive control passes), so it stands or falls
on its own.

**What I could establish:**

- Claude Code **2.1.112** (2026-04-16, last release shipping `cli.js`; 13.7 MB) contains **no literal
  `parseTaskFileContent`**. The bundle *does* preserve 9,150 distinct long camelCase identifiers
  (`toolPermissionContext`, `getEndpointParameterInstructions`, …) so identifier search is not dead —
  **but** minifiers preserve object property keys while mangling standalone function declarations, so
  a zero here is suggestive, **not conclusive**. Per the method rule, I will not treat it as a refutation.
- **Regex literals survive minification, so this test is sound.** Claude Code 2.1.112 contains
  `/^---\s*\n([\s\S]*?)---\s*\n?/`. Ours: `parseCronSkillContent` uses
  `/^---\n([\s\S]*?)\n---\n+([\s\S]*)$/`; `validateSkillContent` uses
  `/^---\s*\n([\s\S]*?)\n---\s*\n+([\s\S]*)$/` — **sharing the `^---\s*\n([\s\S]*?)` … `---\s*\n`
  construction with the `\s*` in both fence positions.** Related, but a common frontmatter idiom;
  short of convicting on its own.

**Verdict: RESTORE, marked UNVERIFIED.** Reasons:

1. **It is undiffable by construction** — closed source, minified, and Anthropic stopped shipping
   readable code three months before our file landed. Deleting the comment destroys the only record
   there will ever be. That is the opposite of what a compliance branch should do.
2. **No attribution comment could cure it anyway.** If our code *is* derived from Claude Code, the
   problem is the Anthropic Commercial ToS, not a missing credit. The comment's value is as evidence,
   and evidence in a compliance branch should not be deleted on an unevidenced assertion.
3. **The asymmetry.** Over-crediting a proprietary product is harmless. Silently removing an
   admission of copying from one is not.

### 7.1 ⚠️ ESCALATION — "Claude Code" is not a bare competitor mention in this repo

While establishing consistency for the two surviving mentions I found something that is **outside my
mandate and above it**. `docs/architecture/research/claude-team-mode-analysis.md` — **present in HEAD**,
inherited from AionUi (dated 2026-03-31, titled *"…and Aion Replication Decision Report"*) — opens:

> **"Based on real source code: `/Users/you/Downloads/extracted/src/`"**

and reproduces, as Claude Code internals: the path `src/utils/agentSwarmsEnabled.ts` with a
`process.env.USER_TYPE === 'ant'` Anthropic-internal check; `src/tasks/InProcessTeammateTask/types.ts`
with `TEAMMATE_MESSAGES_UI_CAP = 50`; a block labelled **"Source comment (verbatim)"** carrying internal
production telemetry (*"~125MB per concurrent agent… Whale session 9a990de8 launched 292 agents in 2
minutes and reached 36.8GB"*); verbatim internal error strings; and a per-module *"Replication %"* table
whose top row reads *"can be precisely copied — 92%."*

`leadPrompt.ts:20` and `teammatePrompt.ts:31` ("Modeled after Claude Code's team leader/teammate
prompt") sit directly on top of that exercise. **This is a WLD-I P1 in its own right and does not belong
in an attribution packet.** Flagging, not acting.

### 7.2 The self-consistency requirement

The branch must end up coherent. Three options; only one survives the evidence:

| option | assessment |
| --- | --- |
| Restore site 8, keep `leadPrompt`/`teammatePrompt` | **RECOMMENDED.** All three Claude Code references stand; over-credit is harmless; the record survives for §7.1's investigation. |
| Delete all three | **NO.** Destroys the only surviving evidence of a possible proprietary derivation, in the same branch that is auditing derivation. Indefensible if §7.1 is ever examined. |
| Keep site 8 deleted, keep the other two | **NO.** The status quo. Two standards, no rationale. |

---

## 8. Figma (sites 4, 5, 7) and NocoBase (sites 3, 6). RESTORE — on the AionUi ground only.

I am separating the two claims deliberately, because they resolve differently.

**The third-party claim is weak-to-nil.**

- **Figma is closed source. No code can have been copied, and none can ever be diffed.** A manifest
  `permissions` array and an iframe/postMessage sandbox are publicly documented interface concepts.
  A design idea is not a derivative work. **No Figma obligation exists.**
- **NocoBase**: our `ExtensionEventBus` is a ~30-line `EventEmitter` subclass with
  `setMaxListeners(200)` and a `${extensionName}:${eventName}` naming convention. Our lifecycle hooks
  are `onInstall`/`onActivate`/`onDeactivate`/`onUninstall`; NocoBase's are
  `afterAdd`/`beforeLoad`/`load`/`install`/`afterEnable`/`afterDisable`/`remove`. **Different names,
  generic mechanism.** No NocoBase code is demonstrable. (NocoBase's licence — a proprietary
  "NocoBase License Agreement" — would make a real derivation serious, which is why it was worth
  checking rather than assuming.)

**The AionUi claim is decisive, and it is the one that governs.** All five sites are byte-identical
AionUi comments in files measured at 72.5% / 89.6% / 95.1% / 100% derivation. Under Apache-2.0 §4(c)
those notices had to be retained in the Source form we distribute. Our opinion of Figma's or NocoBase's
merits is not the test; AionUi wrote the notice, AionUi's licence says retain it.

**Verdict: RESTORE all five.** If the wording is felt to over-claim, the correct instrument is a
*clarifying* edit that keeps the upstream named (e.g. "…following the manifest-permissions model AionUi
took from Figma"), not deletion — and even that should wait on the §4(c) counsel question, because
rewording an inherited notice is itself a §4(c) act.

---

## 9. Per-file verdict table

| # | file | site | upstream | upstream licence | AionUi-derived? | code present? | **verdict** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/process/acp/infra/IAcpClient.ts` | :11 | **acpx** | MIT (© OpenClaw Team) | no (Ferrox) | **YES** — identical type names + 4-member union + `unexpectedDuringPrompt`; subsystem is a documented port | **RESTORE** ⚑ strongest |
| 1b | *(same clause)* | :11 | **Zed** | GPL-3.0 | no | **no** — 0/8 Zed identifiers, Rust vs TS | **RESTORE** (bundled clause; over-credit harmless) |
| 2 | `src/process/agent/acp/ApprovalStore.ts` | :10 | **Codex CLI** | Apache-2.0 | **YES 100%** | design/naming port (`ApprovalStore`, `get`/`put`, `ApprovedForSession`) | **RESTORE** |
| 3 | `src/process/extensions/lifecycle/ExtensionEventBus.ts` | :42 | **NocoBase** | proprietary NocoBase Licence | **YES 100%** | no | **RESTORE** (§4(c) AionUi) |
| 4 | `src/process/extensions/sandbox/permissions.ts` | :10 | **Figma** | proprietary, unpublished | **YES 89.6%** | impossible to copy | **RESTORE** (§4(c) AionUi) |
| 5 | `src/process/extensions/sandbox/sandbox.ts` | :15 | **Figma** | proprietary, unpublished | **YES 95.1%** | impossible to copy | **RESTORE** (§4(c) AionUi) |
| 6 | `src/process/extensions/types.ts` | :103 | **NocoBase** | proprietary NocoBase Licence | **YES 72.5%** | no | **RESTORE** (§4(c) AionUi) |
| 7 | `src/process/extensions/types.ts` | :120 | **Figma** | proprietary, unpublished | **YES 72.5%** | impossible to copy | **RESTORE** (§4(c) AionUi) |
| 8 | `src/process/services/cron/cronSkillFile.ts` | :62 | **Claude Code** | proprietary (Anthropic ToS) | no (Ferrox) | **UNVERIFIED** — undiffable; partial frontmatter-regex match | **RESTORE (UNVERIFIED)** |
| 9 | `src/renderer/utils/model/modelCapabilities.ts` | :66 | **Cherry Studio** | **AGPL-3.0 + >10-person commercial trigger** | **YES 94.1%** | **YES** — byte-identical `RERANKING_REGEX` still shipping in `src/common/utils/modelCapabilities.ts` | **RESTORE** ⚑ + extend to the common file |

**STAYS DELETED: none. Score 9 RESTORE / 0 STAYS DELETED / 0 unresolved-as-to-action.**

---

## 10. Overall recommendation

### ▶ FULL REVERT of `3f1c5ba10`.

Not a partial restore. Every one of the nine sites resolves to RESTORE, and reverting is the only
action that is itself risk-free: re-adding a comment cannot create an obligation, whereas each
selective edit is another touch on an inherited notice while the §4(c) counsel question is open.

**Why full revert rather than "partial restore of the strong four":**

1. The commit's justification is factually false for 7/9 sites (AionUi's notices) and for 2/9 more
   on the merits (acpx, Cherry Studio). Nothing survives it.
2. Cross-audit finding #8 is upheld in full: *"Two evidentiary standards in one branch, and the weaker
   one was applied to the upstreams nobody audited."* Reverting restores one standard.
3. `9add51a0c` removed credit only where a per-file upstream diff showed the code was **ours**.
   `3f1c5ba10` removed credit where the code is **not ours** — the mirror image. It cannot stand in
   the same packet.
4. The asymmetry the Discord trio was settled on applies with more force here: wrongly stripping
   attribution creates a live licence breach; wrongly keeping it is harmless over-credit. Two sites
   (acpx, Cherry Studio) have **measured, shipping upstream code** and no notice anywhere.

### Follow-on packet — restore *more* than the revert returns

The revert closes the regression. It does not close what was already missing.

| # | action | why |
| --- | --- | --- |
| **F1** | Attribute the acpx port: MIT header + `LICENSES/` pointer + pin `v0.5.3` on `infra/processUtils.ts`, `errors/errorExtract.ts`, `errors/errorNormalize.ts`, `infra/ProcessAcpClient.ts`, `infra/IAcpClient.ts`; add acpx to `notices/THIRD-PARTY-NOTICES.md` | MIT notice obligation on a documented, measured port. Currently **zero** attribution in `src/process/acp/`. |
| **F2** | Put the Cherry Studio credit on `src/common/utils/modelCapabilities.ts` (where the regexes actually live) and add a Cherry Studio entry to the notices | The notice belongs on the definition. Byte-identical AGPL-licensed regex ships today, uncredited. |
| **F3** | **Sean / counsel:** Cherry Studio's >10-individual commercial-licence trigger | Ferrox Labs' headcount determines whether the AGPL grant applies at all. Commercial question, not a compliance chore. |
| **F4** | Date the Cherry Studio copy — `gh api "repos/iOfficeAI/AionUi/commits?path=src/renderer/utils/model/modelCapabilities.ts"`, earliest commit containing `LLM2Vec`, vs Cherry's 2025-03-18 licence change | Decides which licence generation governs. One API call. |
| **F5** | Restore the `codex-rs/core/src/tools/sandboxing.rs` path into the ApprovalStore comment | AionUi's sibling file has the specific form; ours had the vague one. |
| **F6** | 🔴 **Route §7.1 to WLD-I as a P1.** `docs/architecture/research/claude-team-mode-analysis.md` is in HEAD, states it is based on extracted Claude Code source, and reproduces verbatim internal comments, paths, error strings and telemetry | Proprietary-source exposure. Not an attribution question. Decide separately whether that doc should be in a public repo at all. |
| **F7** | Sweep AionUi's *other* surviving provenance comments before touching any of them | `ipcBridge.ts:1009,1100,1105`, `extensionsBridge.ts:196,244`, `ExtensionRegistry.ts:72` still carry Figma/NocoBase credits. Any future trim must be all-or-nothing, and after the §4(c) decision, not before. |

### One line for the owner

> `3f1c5ba10` was written as housekeeping. It is the same §4(c) violation the cross-audit found across
> ~310 files, performed deliberately and documented in a commit message, and it deleted the last
> provenance record for two subsystems that demonstrably contain third-party code — one of it
> AGPL-with-a-commercial-trigger. **Revert it whole, then go the other way.**

---

## Appendix A — reproduction

```bash
S=/private/tmp/claude-501/-Users-seandonahoe-dev-wayland/775e9698-5b3c-4417-8b28-a518f6f49b0a/scratchpad/xaudit-attribution
A=$S/aionui-195                       # AionUi v1.9.5 (5b2c741f92) — the fork point
W=/private/tmp/claude-501/-Users-seandonahoe-dev-wayland/775e9698-5b3c-4417-8b28-a518f6f49b0a/scratchpad/wldj
cd /Users/seandonahoe/dev/wayland-worktrees/packet-attribution

# §3 — the seven inherited notices
grep -rn -i "cherry.\?studio\|nocobase\|figma\|Codex CLI" $A/src | grep -v locales

# §3 — derivation, with controls
python3 $S/litcmp2.py \
  "src/common/electronSafe.ts::$A/src/common/electronSafe.ts::POSCTRL" \
  "src/process/agent/acp/ApprovalStore.ts::$A/src/process/agent/acp/ApprovalStore.ts::ApprovalStore" \
  "src/process/extensions/types.ts::$A/src/process/extensions/types.ts::types"
python3 $S/maxoverlap.py src/process/services/cron/cronSkillFile.ts "$A/src/**/*.ts"   # NEGCTRL

# §4 — the acpx pin and the recovered spec
git clone https://github.com/openclaw/acpx.git $W/acpx-src && \
  git -C $W/acpx-src checkout v0.5.3            # = 087f8207d58aebc6efd3ea455488aad0cd07d3af
sed -n '120,150p' $W/acpx-src/src/acp/client.ts
git show 4dbd2f76f^:docs/specs/acp-rewrite/02-reference-implementation.md | sed -n '420,470p'
python3 $S/distinctids.py src/process/acp/infra/ProcessAcpClient.ts "$W/acpx-src/src/acp/*.ts"

# §5 — Cherry Studio
curl -sSL https://raw.githubusercontent.com/CherryHQ/cherry-studio/b5632b009/src/renderer/src/config/models/embedding.ts
grep -n "RERANK_MODEL" src/common/utils/modelCapabilities.ts

# §7 — Claude Code, last bundled release
curl -sSL -o $W/cc.tgz https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-2.1.112.tgz
tar xzf $W/cc.tgz -C $W && grep -c 'parseTaskFileContent' $W/package/cli.js   # 0 — see caveat
```

## Appendix B — method traps hit on this pass

1. **`git log --all -- <path>` returned unrelated commits** for a path that had been deleted on an
   off-mainline branch. Confirm with `git ls-tree`/`--diff-filter=D --name-only`, and pin the pathspec
   to `HEAD` when you mean HEAD. It was the *unfiltered* `--all` scan that recovered the ACP spec.
2. **A zero in a minified bundle is not evidence.** `parseTaskFileContent` → 0 hits in Claude Code's
   `cli.js`, but standalone function names are mangled. I confirmed 9,150 long identifiers *do*
   survive before deciding how much weight the zero carries — and still refused to convict on it.
   **Regex literals survive minification**; that is the sound instrument on a minified target.
3. **`find -name` across three upstream checkouts was validated with a known positive**
   (`ApprovalStore.ts` → 3 hits in `aionui-195`) before the absences of `cronSkillFile.ts` and
   `IAcpClient.ts` were believed.
4. **Partial clone (`--filter=blob:none`) broke `git log -S`** on cherry-studio mid-traversal
   ("repo corruption" against the promisor remote). Pinned `raw.githubusercontent.com` fetches at an
   explicit sha were reliable where the partial clone was not.
5. **npm licence metadata is per-version and moves.** acpx was Apache-2.0 at 0.1.0, MIT from 0.1.2,
   and the repo migrated `janitrai/acpx` → `openclaw/acpx`. Reading the current tag would have given
   the wrong licence for a 2026-04 derivation. Always pin the licence to the version consulted.
