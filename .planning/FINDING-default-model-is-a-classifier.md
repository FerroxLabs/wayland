# First run picks a prompt-injection classifier as the default chat model

**Status: REPRODUCED LIVE on a clean profile.** Not static analysis. Severity is high because it
is the *first* thing a new user does, and it fails.

## What happens

1. Fresh profile, onboarding completes. It detects agents and provider keys correctly and says
   **"Sean, you're all wired up"** and **"you're all set."**
2. The composer's selected model is **`meta-llama/llama-prompt-guard-2-22m`** — Meta's Llama Prompt
   Guard 2, a 22M-parameter prompt-injection *classifier*. The composer placeholder reads
   *"Send message to Llama Prompt Guard 2…"*.
3. First message → `finish_reason: 'error'`, 0 input / 0 output tokens, 240ms, and the bubble shows:

   ```
   Provider error: API error 400: {"error":{"message":"'max_tokens' must be less than or equal to
   '512', the maximum value for 'max_tokens' is less than the 'context_window' for this model...
   ```

Reproduced with `WAYLAND_MULTI_INSTANCE=1 WAYLAND_DEV_PROFILE=livetest-0731` against `out/` built
at `59a957e5f`.

## Not caused by the Cherry Studio re-derivation

Checked explicitly, because that commit rewrote `excludeFromPrimary`. Both the pre- and post-change
regexes return `false` for this id — neither version ever matched it. The model picker's own search
confirms the rewrite is healthy: querying `rerank` returns **"0 RESULTS"**, so #740's exclusion
still works.

## Why it slips through

`src/renderer/pages/guid/utils/modelUtils.ts:39`

```ts
if ((functionCalling === true || functionCalling === undefined) && excluded !== true) {
  result.push(modelName);
}
```

Both inputs come from `hasSpecificModelCapability`, which is **name-regex only** — it consults no
catalogue metadata and returns `undefined` for anything its patterns miss
(`src/common/utils/modelCapabilities.ts:139-164`). `llama-prompt-guard-2-22m` matches no image,
embedding or rerank pattern, so `excluded` is `undefined` and `functionCalling` is `undefined`,
and the `undefined` branch admits it.

Meanwhile the catalogue already knows what this model is
(`resources/modelsdev-snapshot.json`), and **the picker UI already displays it** — the entry
renders as "1K context" next to models showing "1049K context":

| id | context | output | tool_call |
|---|---|---|---|
| `groq/meta-llama/llama-prompt-guard-2-22m` | 512 | 512 | false |
| `groq/meta-llama/llama-prompt-guard-2-86m` | 512 | 512 | false |
| `helicone/llama-prompt-guard-2-22m` | 512 | **2** | false |

## Fix options, measured — do NOT use context size alone

I measured each candidate against all 2793 catalogue ids rather than reasoning about it.

- **Output limit alone — misses the live bug.** The helicone variants emit 2 tokens, but the Groq
  ones that actually broke report `output: 512`.
- **Context size alone — over-broad.** 91 models have `context <= 4096`, and they include genuine
  chat models: `microsoft/phi-3-mini-4k-instruct` (4096, tool_call **true**),
  `microsoft/phi-3-medium-4k-instruct`, `Gryphe/MythoMax-L2-13b` (4000),
  `osmosis-structure-0.6b` (4000, tool_call true). Excluding on context alone would hide real chat
  models — the same over-reach this would be fixing.
- **Recommended: `context <= 1024` AND `tool_call !== true`.** Catches both prompt-guard families
  and, as a bonus, other non-chat strays currently admitted: `grok-imagine-video` (1024),
  `whisper-large-v3` (448), `multilingual-e5-large-instruct` (512), `flux_1-schnell` (77). Spares
  every chat model above, since each either has a bigger context or declares tool calling.

**Honest limit of the recommendation:** this does NOT catch large-context moderation models. There
are 23 `*guard*` / `*safeguard*` ids in the catalogue and most are full-size —
`meta-llama/llama-guard-4-12b` is 163K context, and the picker offers it today under a `guard`
search. Those will still be selectable and are a separate decision; they at least return text
rather than a 400.

## Also seen during the same run (lower severity, unverified as shipping bugs)

- `Failed to read builtin rule: ENOENT … /rules/concierge.md` on startup. May be an artefact of
  running from `out/` rather than a packaged tree — needs checking against `extraResources` before
  being treated as real.
- The failure surfaces a "Wake your agents / Connect a model provider" recovery panel, which is
  decent UX, but it advises connecting a provider when four working providers are already
  connected. The problem is the selection, not the credentials.

---

## Cross-audit (Codex + Gemini, 2026-07-31)

**The predicate holds, but the fix belongs somewhere better than I proposed.**

- **Gemini:** "no single metadata attribute is better than your combined predicate." Endorses
  `context <= 1024 AND tool_call !== true`, and suggests augmenting with `modalities.output`
  excluding `text`, and the absence of `reasoning` / `attachment` flags (which guards and encoders
  never carry).
- **Do NOT invert the `undefined` -> admitted default.** I had floated failing closed; both legs
  say keep it fail-open. Inverting breaks day-one support for newly released models and hides
  local/custom models from Ollama and LM Studio, whose ids match no pattern we ship. Apply the
  predicate as a *safety gate* on top of a fail-open default.
- **Codex found the real root, which I missed.** `CatalogAssembler.ts` already computes usage tags
  (`chat`, `image`, `audio`, `embeddings`, `vision`, `reasoning`, `tools`, `research`), and its
  default rule is `if (tags.size === 0 && kind === 'text') tags.add('chat')` (`:244`). That is why
  a classifier is tagged a chat model. Fixing it there means the picker filters on a computed tag
  instead of yet another name regex in `modelCapabilities.ts` - one authority, not two.
  Note `GuidModelSelector.tsx:91` (`firstSafeCuratedModel`) is prior art for this exact class of
  bug: its comment says it is "the guard that stops the picker booting to Antigravity Preview".
- **Industry practice** confirms metadata over names: Ollama derives an embedding capability from
  GGUF `bert.pooling_type` and refuses `/api/chat`; LM Studio makes the user load a model in chat
  or embedding mode explicitly; OpenWebUI and LibreChat keep chat and embedding model lists
  separate by configuration and never guess from id strings.

**Revised recommendation:** apply the `context <= 1024 && tool_call !== true` rule inside
`CatalogAssembler`'s tag computation so such models never receive the `chat` tag, and have the
primary picker require the `chat` tag. Keep the fail-open default everywhere else.

---

## Live verification after the fix (`49a814224`)

Rebuilt `out/`, fresh profile `livetest-verify2`, onboarding walked again.

**The breakage is fixed.** `llama-prompt-guard-2-22m` no longer appears anywhere in the picker or
the composer, and the first message now succeeds: "Hello, what is 2+2?" → **"4"**,
`finish_reason: 'stop'` in 1240ms, where the same prompt previously returned
`finish_reason: 'error'` with 0 tokens and a provider 400.

**But the default is still a safety-tuned model — and this is the documented limitation, live.**
The new auto-selection is `openai/gpt-oss-safeguard-20b`. My filter correctly does NOT catch it
(131K context, declares tool calling), and it genuinely works as a chat model. So this is no longer
a *defect* — it is a **poor default**: a model tuned for safety-policy reasoning is a strange first
impression for a user who wants writing, code or analysis.

That is a product/ranking question, not a bug, and it sits in the Curator's "recommended" ordering
rather than in the eligibility gate. Worth a separate decision on whether `*guard*` /
`*safeguard*` families should be de-prioritised as *defaults* while remaining *selectable*.

Also observed on this run (minor, unfiled):
- `wcore-pricing catalog miss ... unknown model openai/gpt-oss-safeguard-20b for provider groq` —
  the pricing catalogue lacks this id and falls back to a cost heuristic.
- The "Wake your agents / Connect a model provider" panel still renders after a **successful**
  turn with four providers already connected.
