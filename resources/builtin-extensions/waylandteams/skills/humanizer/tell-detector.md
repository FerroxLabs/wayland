# tell-detector

**Mode skill.** Default-enabled on the Humanizer specialist.

## When to use

Use any time a user asks "does this read as AI?" or pastes a draft and wants a verdict before rewriting. Run before any rewrite pass so the rewrite knows what to fix.

Trigger phrases that should activate this mode:

- "Scan this for AI tells."
- "How AI-flavored is this?"
- "Score this draft."
- "What's wrong with this copy?"
- "Is this going to get flagged?"

Auto-route into this mode if the user pastes a draft of 50+ words with no question. Assume diagnose first, rewrite second.

## Scoring convention (LOCKED)

All sub-axis scores use **10 = most human, 1 = most AI**. AI-likelihood is the derived composite: `AI-likelihood = 10 − (avg of human-axis scores)`. So AI-likelihood 10 = obviously AI, 1 = obviously human. Apply this convention everywhere.

## Procedure

**1. Score AI-flatness (perplexity).** Read the draft. Flag every word from the canonical 2026 AI-vocabulary blacklist below.

**Vocabulary tells:** delve, tapestry, multifaceted, _leverage_, embark, navigate, dive deep, pivotal, robust, elevate, foster, harness, showcase, intricate, comprehensive, streamline, _cutting-edge_, paradigm, holistic, seamlessly, meticulously, profound, profoundly.

**Phrase tells:** "it's worth noting," "in today's digital age," "let's dive in," "in the realm of," "it's important to note," "at the end of the day," "on the other hand," "when it comes to," "the fact that."

**Transition + hedge tells:** "Furthermore," "Moreover," "Additionally," "In addition," "It is important to," "It should be noted that," "One could argue that," "Notably," "Crucially."

Count occurrences. Three or more heavy hits = score 2/10 or lower on AI-flatness (heavy AI). Zero heavy hits in 200 words = 8/10 or higher (reads human on vocabulary).

**2. Score rhythm (burstiness).** Measure sentence lengths in the draft. Flag:

- Three or more consecutive sentences within 3 words of each other in length = AI-flat
- All sentences under 20 words = AI-uniform
- No fragments or one-word sentences in 200+ words = AI-tic
- Parallel-clause sentences ("She did A, did B, did C") three or more in a row = AI-parallelism

A draft with sentences of length 14/15/16/13/14 scores 2/10 on rhythm (AI-flat). A draft with 8/22/3/18/11 scores 9/10 (human-bursty).

**3. Score structural tells.** Look for:

- Lists with exactly three items (AI loves threes; name it when you see four-in-a-row of three-item lists)
- Paragraph parallelism, each paragraph opening with the same syntactic structure
- The "rule of three" sentence ("It is X, it is Y, and it is Z")
- Em-dash overuse (every paragraph has one). 2026 has flipped em-dashes from a writer-tell into an AI-tell because every model has been trained on writer-edited text
- Zero parentheticals or asides in 300+ words

**4. Output the verdict.** Format:

```
AI-likelihood (composite): <X>/10 (10 = obviously AI, 1 = obviously human)
  - AI-flatness (vocabulary): <X>/10 (10 = most human, 1 = most AI), <one-line reason>
  - Rhythm (burstiness):     <X>/10 (10 = most human, 1 = most AI), <one-line reason>
  - Structural tells: <count, with the worst named>

Top three things to fix:
1. <specific change with line reference>
2. <specific change>
3. <specific change>

Lines flagged:
  Line 3: "delve into the intricacies", heavy vocabulary tell
  Line 7: opens with "Furthermore," transition tell
  Lines 4-6: three consecutive 16-word sentences, rhythm flat
```

If composite AI-likelihood is 7+/10, recommend the rewrite mode. If under 4/10, tell the user honestly that the draft already reads human and a rewrite would risk over-editing.

## Decision rules

- **Score honestly, not flatteringly.** A 6/10 means 6/10. Do not soften to 5/10 to seem encouraging. The user needs accurate signal.
- **Specificity beats abstraction.** "Reads as AI" is useless feedback. "Line 7 uses 'navigate' and opens with parallel clauses" is actionable.
- **Surface the worst tell first.** If a draft has one heavy vocabulary tell and twenty rhythm tells, lead with rhythm. Volume of small problems often matters more than one big one.
- **Do not auto-rewrite.** Diagnosis is a separate step. The user decides whether to rewrite.

## Anti-patterns

- Scoring without naming specific lines. "This reads slightly AI" gives the user nothing.
- Rewriting in place when asked to diagnose. The user asked what is wrong, not for you to fix it.
- Treating em-dashes as a writer-quality tell. In 2025 they were; in 2026 they signal AI. Reality has shifted.
- Counting "AI words" out of context. Sometimes "_leverage_" is the right word (verb-using-a-tool). Score the cluster, not the isolated occurrence.
- Flagging fragments as errors. Fragments are humanizing, not AI-tells.

## Before / after

**Input draft:**

> *Furthermore, our _cutting-edge_ platform _leverage_s robust analytics to navigate the intricate landscape of customer engagement. It is important to note that this multifaceted approach delivers comprehensive results across the digital ecosystem.*

**Diagnostic output:**

```
AI-likelihood (composite): 9/10 (obviously AI)
  - AI-flatness (vocabulary): 1/10, six heavy-hit words in two sentences
  - Rhythm (burstiness):     2/10, both sentences are ~22 words, parallel structure
  - Structural tells: 1, "Furthermore" paragraph-opener

Top three things to fix:
1. Replace "Furthermore", strongest single tell.
2. Cut "_cutting-edge_ / robust / navigate / intricate / multifaceted / comprehensive", six tells in 28 words.
3. Break sentence rhythm; both sentences are the same length. Add a fragment, or break one in two.

Recommend: rewrite pass.
```
