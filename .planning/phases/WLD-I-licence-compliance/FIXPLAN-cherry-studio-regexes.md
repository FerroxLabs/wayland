# Cherry Studio derived patterns — provenance and replacement plan

# Verdict up front

**The finding is confirmed — byte-identity verified against the pinned revision.** But three things in the brief's framing are wrong or incomplete, and one of them changes the scope materially:

1. **It did not come from us.** The regex reached our tree via **AionUi**, our fork point. Nobody on our side copied from Cherry Studio.
2. **It is not one regex, it is three.** Rewriting only the reranking regex leaves a *more* protectable Cherry Studio artifact in place.
3. **The escape hatch prior research left open (Q9) is now closed.** I checked the licence timing. AGPL governs. The exposure is real.

**Rewriting is the right call. Rewriting only the rerank regex is not.**

---

# 1. Verified provenance

### Ours

`/Users/seandonahoe/dev/wayland-worktrees/packet-attribution/src/common/utils/modelCapabilities.ts:38-39`

```ts
/** Reranker / retriever models (cross-encoders) - never chat models. */
const RERANK_MODEL = /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i;
```

### Theirs

Pin `b5632b009` resolves via the GitHub API to the full SHA **`b5632b0097d0240e6dbf1baf22c8c327850fc3f1`** (2025-09-06). Fetched that exact commit — not code search, which as you note only indexes the default branch. `/tmp/cs-probe/src/renderer/src/config/models/embedding.ts:9`:

```ts
export const RERANKING_REGEX = /(?:rerank|re-rank|re-ranker|re-ranking|retrieval|retriever)/i
```

SHA-256 of both regex literals: `9928af715f1b23d9dc1baccc6072b29909473651f884c9dcd0581aa7f448d704`. **Byte-identical confirmed.** Only the binding differs (`RERANK_MODEL` vs exported `RERANKING_REGEX`).

### The corroborating fingerprint

Four of the six alternatives are **redundant**. The match is unanchored, so `rerank` already subsumes `reranker` and `reranking`; `re-rank` already subsumes `re-ranker` and `re-ranking`. Nobody independently writes four dead alternations. This is strong evidence of copying — though, as I argue in §3, it says nothing about protectability.

### The chain, dated

| Date | Event | Evidence |
|---|---|---|
| 2024-10-17 | Cherry LICENSE = Apache-2.0 **+ commercial rider** | `267c60f24`, raw LICENSE |
| **2025-03-18** | **Cherry flips to AGPL-3.0 + >10-individual commercial trigger** | `9ae7c5101` |
| 2025-06-03 | `RERANKING_REGEX` present in Cherry `models.ts:212` | `be1dae7ef` |
| **2025-08-30** | **AionUi ADDS the byte-identical regex** | `7bc0312e1` (author `zmworm`), diff shows `+  rerank: /(?:rerank\|re-rank\|...)/i` |
| 2026-05→ | AionUi v1.9.5 = `5b2c741f927b5043b60006bf850c7b7b1342698c` carries it at `src/renderer/utils/model/modelCapabilities.ts:23` | matches your supplied fork point |
| 2026-06-07 | Enters our tree in squashed import `2b3b60e11` "Wayland v0.9.6-rc.1" | `git log -S` |

**This closes Q9 from `.planning/research/WLD-J/SUMMARY.md`.** That research correctly flagged that Cherry's licence was rewritten 2025-03-18 and that a pre-flip copy might be permissively licensed. It is not. AionUi copied **five months after** the AGPL flip. **AGPL-3.0 governs.**

(Worth knowing anyway: even the pre-flip Apache-2.0 licence carried a rider requiring commercial authorisation for *"二次修改、开发（包括但不限于修改应用名称、logo、代码以及功能）"* — secondary modification including changing the app name, logo, code or functionality. A rebranded fork would have tripped it either way. The flip changed the flavour from attribution to copyleft, not the existence.)

AionUi shipped it under `SPDX-License-Identifier: Apache-2.0`. **Copyright does not launder through an intermediate fork.** AionUi's Apache grant cannot convey rights over expression AionUi did not own.

---

# 2. Scope: it is three patterns, not one

AionUi's own comments name the source, in Chinese, at the fork point (`/tmp/aionui-probe/.../modelCapabilities.ts`):

- line 13: `能力匹配的正则表达式 - 参考 Cherry Studio 的做法`
- line 115: `判断模型是否具有某个能力 - 参考 Cherry Studio 的三层判断逻辑`

Comparing all three trees:

| Pattern | Cherry @ pin | AionUi v1.9.5 | Ours today | Status |
|---|---|---|---|---|
| **rerank** | `RERANKING_REGEX` | identical | **identical** | ⚠️ **byte-identical, shipping** |
| **embedding** | `EMBEDDING_REGEX` | **byte-identical** to Cherry | modified | ⚠️ **derived token set retained** |
| **image gen** | `TEXT_TO_IMAGE_REGEX` | near-identical | modified head | ⚠️ **65-char identical run** |
| vision / reasoning / web_search / function_calling | built via `new RegExp(arr.join('\|'))` with negative lookaheads | simple literals | simple literals | ✅ **not derived** |

**Embedding.** Cherry and AionUi are byte-identical:
`/(?:^text-|embed|bge-|e5-|LLM2Vec|retrieval|uae-|gte-|jina-clip|jina-embeddings|voyage-)/i`

Ours (`modelCapabilities.ts:35-36`) is rewritten with token-boundary anchoring, but **retains the curated token selection**: `bge, gte, e5, uae, voyage, jina-clip, retrieval, llm2vec`. `uae` (UAE-Large-V1) and `llm2vec` are obscure academic picks. Nobody arrives at that exact set independently.

**Image generation.** Longest byte-identical run between ours (`:49`) and Cherry's `TEXT_TO_IMAGE_REGEX`:

```
diffusion|stabilityai|sd-|dall|cogview|janus|midjourney|mj-|image
```

65 characters, 9 alternation tokens, verbatim.

### Calibration (as instructed)

Whole-file identifier overlap, comments stripped, ≥3 chars:

| Comparison | Overlap |
|---|---|
| POS: ours(common) vs AionUi | **87.1%** |
| POS: ours(renderer) vs AionUi | **97.4%** |
| NEG: `modelClassifierRules.ts` (Ferrox-original) vs AionUi | 31.9% |
| NEG: `modelClassifierRules.ts` vs Cherry `embedding.ts` | **11.1%** |
| TARGET: ours(common) vs Cherry `embedding.ts` | 26.9% |

The 26.9% is **diluted and I am not relying on it** — our file is mostly ours. The meaningful read is the shared set itself: `bge, gte, uae, voyage, jina, clip, embed, embeddings, retrieval, retriever, rerank, rank, ranker, ranking`. That is the entire payload, at 100%, against an 11.1% baseline. (`llm2vec` is also shared; my tokeniser is case-sensitive and Cherry writes `LLM2Vec`.)

### The structure

Cherry's `isEmbeddingModel` resolves: user-selected → provider special-case (`anthropic`, `doubao`) → regex. Ours (`src/renderer/utils/model/modelCapabilities.ts:71-120`) resolves: user-configured → `PROVIDER_CAPABILITY_RULES` (`anthropic`, `deepseek`) → regex. Same three layers, same order, same `anthropic` special-case — generalised into a table by AionUi. The comment is accurate.

---

# 3. Straight verdict: does rewriting suffice?

**Yes for the code, no as scoped — and the honest answer is that the rerank regex is the *weakest* of the three items you'd be fixing.**

Taking your two hypotheticals in turn, because the answer differs for each:

**"A short functional regex may not be protectable at all."** For the *rerank* regex specifically, largely correct. Six morphological variants of one word plus `retrieval`/`retriever` is close to the only way to express "match reranker model names." Merger and scènes à faire bite hard. Four alternations are functionally dead, which proves copying but adds no creative expression. If this were the only item, I would tell you the exposure is thin enough to be theoretical.

**"If what we took is the structure, swapping characters changes nothing."** For the three-layer logic, this does *not* bite — a resolution-precedence order is a method of operation, unprotectable under the idea/expression line. And we inherited that implementation from AionUi under Apache-2.0, which we are entitled to use with attribution.

**But there is a third thing you didn't list, and it is the real one.** The **embedding token list** is a curated selection of facts — exactly the thin-but-real `Feist` selection-and-arrangement copyright. It is more protectable than the rerank regex, it is still substantially in our tree, and it is not on your fix list. Same for the 65-character image run.

So: **the item does not evaporate, it moves.** If you rewrite only the rerank regex, you will have spent the effort and still be able to produce, from `modelCapabilities.ts:35`, a curated Cherry Studio token list under an AGPL project with a headcount trigger. The AGPL question would not disappear; it would just be harder to find. That is the worst outcome — cost paid, exposure retained, and now with a commit implying you'd handled it.

**Two things rewriting does not do, which you should accept explicitly rather than discover later:**

- It does not cure **historical distribution**. This has shipped in every release since v0.9.6-rc.1 (2026-06-07). For a fragment this trivial, that is de minimis in practice, but "the question disappears" is true prospectively only.
- It does not change that **AionUi has this problem too**, in files you continue to sync from. Whether you tell them is a separate call (and above my pay grade), but expect recurrence on future merges unless someone watches that file.

**Recommendation: proceed with the rewrite, extend it to all three patterns, and do it in one commit.** All three are cheap. Do not treat the rerank regex as the deliverable.

---

# 4. Replacement plan

### Callers — and a load-bearing discovery

**No caller anywhere requests the `'rerank'` capability.** Full sweep of `src/`:

| Consumer | Capability requested |
|---|---|
| `src/common/utils/teamModelUtils.ts:37,39` | `function_calling`, `excludeFromPrimary` |
| `src/renderer/hooks/agent/useModelProviderList.ts:87,88` | `function_calling`, `excludeFromPrimary` |
| `src/renderer/pages/guid/utils/modelUtils.ts:36,37` | `function_calling`, `excludeFromPrimary` |
| `src/renderer/utils/model/imageVisionGate.ts:71` | `vision` |

`'rerank'` appears only in the `ModelType` union (`src/common/config/storage.ts:785`) and as a user-selectable capability. `RERANK_MODEL` reaches observable behaviour **solely** through interpolation into `excludeFromPrimary` at `modelCapabilities.ts:62`.

**Consequence:** the behaviour that must be preserved is *"which model ids get filtered out of the primary/workflow picker,"* not *"which ids are labelled rerank."* That is a much smaller surface than the brief assumed — and it is the surface where a regression actually hurts (#740, #108).

### Derive from our own catalogue

We already have an in-house idiom, in a file the negative control confirms is Ferrox-original — `src/process/providers/catalog/modelCapabilityRules.ts:5`:

```ts
const EMBEDDING_MODEL_ID_RE = /(?:^|[\s/.:_-])(?:text[-_]?embedding|embeddings?|embed|rerank|bge)(?=$|[\s/.:_-])/i;
```

Boundary-anchored alternation of stems. Use that, not a transliteration of Cherry's.

**Recommended replacement:**

```ts
/**
 * Reranker / cross-encoder models — retrieval-stage models, never chat models.
 * Stems are token-anchored (start-of-id or a `/ . : _ -`/whitespace separator)
 * for the same reason EMBEDDING_MODEL is: an unanchored substring match fires
 * inside unrelated ids. Suffixes are explicit because real reranker ids append
 * them to the stem (`bge-reranker-v2-m3`, `Qwen3-Reranker-8B`).
 */
const RERANK_MODEL = /(?:^|[\s./:_-])(?:re-?rank(?:er|ing)?|retriev(?:al|er))(?=$|[\s./:_-])/i;
```

Anchoring matches our own house style, the suffix handling is derived from ids in our catalogue, and no alternation is redundant.

Apply the same treatment to `EMBEDDING_MODEL` (:35) and the image alternation (:49) — the token lists there need to be re-derived from providers we actually ship, and any token we cannot justify from our own catalogue should be dropped rather than inherited.

### Behaviour-preservation table

Both candidates run against the current regex over a 52-id corpus (real rerankers, real embeddings, chat models incl. the `#108`/`#740` regression guards, plus adversarial ids):

| Model id | rerank cur→new | excludeFromPrimary cur→new |
|---|---|---|
| `bge-reranker-v2-m3` | true → true | true → true |
| `bge-reranker-base` / `-large` | true → true | true → true |
| `rerank-english-v3.0` | true → true | true → true |
| `rerank-multilingual-v3.0` | true → true | true → true |
| `rerank-v3.5` | true → true | true → true |
| `jina-reranker-v2-base-multilingual` | true → true | true → true |
| `jina-reranker-v1-turbo-en` | true → true | true → true |
| `mxbai-rerank-large-v1` / `-xsmall-v1` | true → true | true → true |
| `Qwen3-Reranker-8B` / `-0.6B` | true → true | true → true |
| `bce-reranker-base_v1` | true → true | true → true |
| `gte-multilingual-reranker-base` | true → true | true → true |
| `xlm-roberta-base-reranker` | true → true | true → true |
| `cohere.rerank-v3-5:0` | true → true | true → true |
| `retriever-base`, `llm-retriever-v1` | true → true | true → true |
| `bge-m3:latest`, `gte-large`, `voyage-3`, `e5-mistral-7b-instruct`, `jina-embeddings-v3`, `nomic-embed-text`, `text-embedding-3-large`, `jina-clip-v2` | false → false | true → true |
| `gpt-4o`, `claude-3-5-sonnet`, `llama3.1:8b`, `qwen2.5-coder:7b`, `deepseek-chat`, `gemini-2.0-flash`, `mistral-large-latest`, `grok-4`, `command-r-plus`, `o1-preview` | false → false | false → false |
| `kuae-coder`, `kuae-cloud-coding` (#740 guard) | false → false | false → false |
| `text-davinci-003` (#740 guard) | false → false | false → false |
| `flux-auto`, `flux-fast`, `flux-reasoning` (#108 guard) | false → false | false → false |
| `ms-marco-MiniLM-L-6-v2` | false → false | false → false |
| `my_rerank_model`, `Reranker`, `RERANK` | true → true | true → true |
| `reranked-legacy` | true → **false** | true → **false** |
| `prerank-model` | true → **false** | true → **false** |
| `xrerank` | true → **false** | true → **false** |

**Identical on all 49 real model ids.** The three divergences are synthetic and are all cases where the *current* regex over-matches. `prerank-model` is worth pausing on: it matches today because "p‑**rerank**‑model" contains the substring. That is a latent false positive in shipping code — an unrelated model called `prerank-*` would be silently hidden from the picker. The rewrite fixes it.

**If you want provably zero divergence instead**, this variant is identical on the 52-id corpus *and* on all 4,096 generated token concatenations I fuzzed:

```ts
const RERANK_MODEL = /re-?rank|retriev(?:al|er)/i;
```

**I recommend against it.** It is a mechanical re-encoding of the same alternation set — semantically the same expression with the redundancy squeezed out. If the goal is that the AGPL question disappears, a minimal reformulation is a derivative work and does not achieve it. The anchored version is genuinely re-derived from our own idiom, and it is identical where it counts. Take Variant B only if someone vetoes any behaviour change at all.

---

# 5. Tests

New file: `tests/unit/common/modelCapabilities.rerank.test.ts` (vitest, matching `tests/unit/common/modelCapabilities.embedding.test.ts`; note the bun/vitest timeout split in your notes — this suite is fast and unaffected).

```ts
/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { hasSpecificModelCapability } from '@/common/utils/modelCapabilities';
import type { IProvider } from '@/common/config/storage';

// Pins reranker classification so the RERANK_MODEL rewrite is provably
// behaviour-preserving. Every id below is a real published model.
const provider = { platform: 'ollama' } as unknown as IProvider;

describe('hasSpecificModelCapability — reranker classification', () => {
  const rerankIds = [
    'bge-reranker-v2-m3', 'bge-reranker-base', 'bge-reranker-large',
    'rerank-english-v3.0', 'rerank-multilingual-v3.0', 'rerank-v3.5',
    'jina-reranker-v2-base-multilingual', 'jina-reranker-v1-turbo-en',
    'mxbai-rerank-large-v1', 'mxbai-rerank-xsmall-v1',
    'Qwen3-Reranker-8B', 'Qwen3-Reranker-0.6B',
    'bce-reranker-base_v1', 'gte-multilingual-reranker-base',
    'xlm-roberta-base-reranker', 'cohere.rerank-v3-5:0',
  ];

  for (const id of rerankIds) {
    it(`${id} is classified as a rerank model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).toBe(true);
    });
    // The load-bearing assertion: rerank reaches production ONLY via
    // excludeFromPrimary. A reranker offered for chat 400s at the provider.
    it(`${id} IS excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).toBe(true);
    });
  }

  // Over-exclusion guards. These repeat the #108 / #740 classes: a naive
  // substring match hides real chat models from the picker.
  const chatIds = [
    'gpt-4o', 'claude-3-5-sonnet', 'llama3.1:8b', 'qwen2.5-coder:7b',
    'deepseek-chat', 'gemini-2.0-flash', 'mistral-large-latest',
    'command-r-plus', 'grok-4', 'o1-preview',
  ];

  for (const id of chatIds) {
    it(`${id} is NOT classified as a rerank model`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).not.toBe(true);
    });
    it(`${id} is NOT excluded from the primary picker`, () => {
      expect(hasSpecificModelCapability(provider, id, 'excludeFromPrimary')).not.toBe(true);
    });
  }

  // Token-boundary pins. Each of these matches TODAY via unanchored substring
  // and is a false positive; the anchored rewrite must reject them.
  for (const id of ['prerank-model', 'xrerank', 'reranked-legacy']) {
    it(`${id} does not trip the rerank stem (boundary anchoring)`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).not.toBe(true);
    });
  }

  // Normalisation: getBaseModelName maps `_` → `-`, and matching is case-insensitive.
  for (const id of ['my_rerank_model', 'Reranker', 'RERANK']) {
    it(`${id} still classifies as rerank after normalisation`, () => {
      expect(hasSpecificModelCapability(provider, id, 'rerank')).toBe(true);
    });
  }
});
```

Note the three boundary-anchoring tests **will fail against the current code** — that is intentional. Write them first, watch them fail, then rewrite. If you take Variant B instead, invert those three to `.toBe(true)`.

The existing `tests/unit/common/modelCapabilities.embedding.test.ts` (incl. its `bge-reranker-v2-m3` assertion at :41), `modelCapabilities.flux.test.ts` and `modelCapabilities.fluxRouter.test.ts` must all stay green untouched. If you extend the rewrite to `EMBEDDING_MODEL`, the embedding suite becomes the behaviour-preservation harness for that half and needs no changes.

---

# 6. The restored comment — noted, not acted on

`src/renderer/utils/model/modelCapabilities.ts:66` currently reads:

```ts
 * Determine whether a model has a given capability - three-layer resolution inspired by Cherry Studio
```

Two corrections to the brief. It is **English, not Chinese** — `9f439fbeb` restored *our translation* of AionUi's Chinese original (the commit body says so explicitly, and AionUi's line 115 is the Chinese source). And `9f439fbeb` reverted `3f1c5ba10` on evidence, listing this file at 94.1% derived from AionUi.

**The rewrite does not moot this comment, and that is the point.** Rewriting the three regexes removes Cherry Studio's *literal expression*. It does not remove the **three-layer resolution structure**, which is what the comment actually describes and which remains Cherry-derived (via AionUi). So after the rewrite the comment is still factually accurate and still the only record of that lineage.

What *does* change: once no byte-identical Cherry expression ships, the exposure drops from "verbatim AGPL code in a distributed artifact" to "unprotectable method, credited." That is a materially different question for WLD-I's F3 (counsel on the headcount trigger) and Q8, and both should be re-scoped once the rewrite lands — plausibly downgraded from compliance to courtesy.

**Do not reword or remove the comment as part of this work.** It is an inherited AionUi notice; touching it is itself a §4(c) act and belongs to WLD-I.

---

# Artifacts

Analysis scripts, if you want to re-run any of it:

- `/tmp/behav.mjs` — behaviour-preservation harness + 4,096-case fuzz
- `/tmp/idcmp.py` — identifier-overlap comparator (controls)
- `/tmp/cs-probe` — Cherry Studio @ `b5632b0097d0240e6dbf1baf22c8c327850fc3f1`
- `/tmp/aionui-probe` — AionUi @ `5b2c741f927b5043b60006bf850c7b7b1342698c` (v1.9.5, your fork point)
- `/tmp/ai-full` — full AionUi clone (used to date `7bc0312e1`)
