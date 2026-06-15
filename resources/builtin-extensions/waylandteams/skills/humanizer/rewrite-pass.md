# rewrite-pass

**Mode skill.** Default-enabled on the Humanizer specialist.

## When to use

Use when the user wants a draft rewritten to read human, usually after a diagnose pass surfaced specific tells. Also valid as a one-step on a draft the user knows is AI-flavored and just wants fixed.

Trigger phrases:

- "Humanize this."
- "Rewrite this so it doesn't sound like AI."
- "Make this sound like a person wrote it."
- "Run a humanize pass on this draft."

If the draft hasn't been diagnosed yet, run a quick mental diagnosis first (AI-flatness score, rhythm score, top tells) so the rewrite is targeted. Do not dump the full diagnostic on the user unless asked. The rewrite output is the deliverable.

## Procedure

**1. Substitute vocabulary.** Replace every blacklist word with a human-register alternative. See `humanizer-tell-detector` for the canonical list. Context-shifts, not 1-to-1 synonyms:

- delve / dive deep → dig into, look at
- _leverage_ → use, lean on
- navigate → work through, deal with
- pivotal → important, load-bearing
- robust → strong, solid
- multifaceted / intricate → complicated, layered
- comprehensive → full, covers everything
- streamline → tighten, cut
- "in today's digital age" → today, in 2026
- "Furthermore / Moreover / Additionally" → cut, or "Also"

When a word has no clean substitute, rewrite the sentence to remove the need.

**2. Vary sentence length (Klinkenborg's rule).** Never two consecutive sentences within 3 words of each other in length. Target rhythm patterns:

- Short / long / short, the most reliable humanizing rhythm
- Long / fragment / long. Fragments are humanizing, not errors
- A one-word sentence somewhere in every 200 words

If the input has five 15-word sentences in a row, the output should have lengths like 7 / 24 / 11 / 3 / 19. Rewrite to hit the rhythm even if it means restructuring the paragraph.

**3. Break parallel structure.** AI loves parallelism: "She did A, did B, did C." "It is X, it is Y, it is Z." "First... Second... Finally..." When you see three or more parallel clauses or sentences, break two of them into non-parallel constructions.

**4. Contraction inconsistency.** AI over-expands contractions. Convert about 60% of `do not / it is / we are / cannot / will not / would not / should not` to contractions and leave the rest expanded. The mixing itself is a strong human signal; uniform expansion or uniform contraction both read flat.

**5. One idiom or colloquialism per ~250 words.** AI under-uses these. Starter list: "hit the ground running," "the catch is," "long story short," "the elephant in the room," "moving the needle," "on the back of," "for what it is worth," "that said." Use one. Do not stack three; cliché-pile reads worse than the original.

**6. Add a parenthetical or aside.** In every 300 words of rewritten text, include at least one personal aside, parenthetical, or hedge: "(or you can," "in my experience," "honestly," "though that depends." This is the single highest-impact humanizing move because AI rarely does it.

**7. Preserve meaning and stance.** The user's claim is the user's claim. Do not soften "this approach is wrong" into "this approach has tradeoffs." You change texture, not position.

**8. Output the rewrite + scores line + 3-bullet diff.** Format:

```
<rewritten draft>

---
Scores: AI-flatness before X/10 → after Y/10 | Rhythm before X/10 → after Y/10 | Composite AI-likelihood before X/10 → after Y/10

Top changes:
1. <vocabulary or phrase swap>, line(s)
2. <rhythm or sentence break>, line(s)
3. <structural or aside addition>, line(s)
```

Higher AI-likelihood = more AI. Higher sub-axes = more human. A good rewrite moves 9/10 → 2/10. Three bullets only — if you made twenty changes, pick the three biggest.

## Decision rules

- **Vocabulary AND rhythm together.** Fixing one alone is what bad humanizers do.
- **Fragments are humanizing.** Use them. AI rarely does.
- **Do not over-edit.** If input was 5/10 AI-likelihood, output should be 2-3/10, not 0/10. Pushing too hard creates new flatness.
- **Preserve verbatim:** fenced code, blockquotes, citations, technical specs (API names, parameter lists, version strings), list bullets under 6 words. Humanize the prose around them, not the artifacts.
- **Read it in your head.** If it sounds stilted, rewrite again.

## Anti-patterns

- Word-substitution alone. Swapping "delve" for "explore" leaves the rhythm AI-flat.
- Over-fragmenting. Three fragments in a row is its own tell.
- Adding hedges to confident claims. The user said it confidently; keep the confidence.
- Smoothing the user's spiky opinions into corporate neutrality.
- Em-dash everywhere. In 2026, em-dashes are an AI-tell. Use them sparingly.

## Before / after

**Input draft (9/10 AI-likelihood):**

> *In today's digital age, organizations must embark on a robust strategy to navigate the multifaceted challenges of customer engagement and _unlock_ comprehensive growth opportunities.*

**Output:**

> *Most "customer engagement strategies" are dashboards stapled to a quarterly review. Useless. If you cannot tell me what one customer actually did yesterday, you do not have a strategy. You have a Notion page.*

```
Scores: AI-flatness before 1/10 → after 8/10 | Rhythm before 2/10 → after 9/10 | Composite AI-likelihood before 9/10 → after 2/10

Top changes:
1. Cut every blacklist word (today's digital age, embark, robust, navigate, multifaceted, _unlock_, comprehensive), replaced with concrete language and a contrarian stance.
2. Rhythm from one 28-word sentence to 12 / 2 / 19 / 8, fragment ("Useless.") plus length variation.
3. Added one parenthetical-flavor aside ("a Notion page") and one direct-address sentence ("If you cannot tell me..."). Stance preserved, not softened.
```
