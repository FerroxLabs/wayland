# lens-clarity

**Lens mode.** Source authority: Ali Abdaal's teaching-simplicity discipline and the Feynman explanation method — if you cannot explain it simply, you do not understand it yet.

## When to use

Use when the deliverable is an *explanation*. Tutorials, how-to threads, course lesson scripts, onboarding docs, FAQ entries, "explain like I'm new here" social posts, internal docs aimed at non-experts. Trigger this lens when the brief is "we keep getting the same support question" or "the post is technically right but readers bounce."

## Procedure

1. **State the core idea in one sentence.** The single sentence a reader could repeat to a friend tomorrow morning. If you need two sentences, you have not found the idea yet. Strip qualifiers; cut hedges; name the thing.
2. **Find the best analogy.** One concrete, everyday comparison that maps cleanly. The analogy has to share the *structure* of the idea, not just the vibe. ("A database index is a book's index, not the book itself.") Test it: does the analogy hold for three more inferences past the first? If not, find a better one.
3. **Name the common mistake.** The wrong mental model most readers arrive with. Stating it explicitly does two jobs: it shows you know the audience, and it lets the right model land in a now-empty slot.
4. **Build the simple framework.** Three to five labeled steps, plain verbs, no jargon. The reader should be able to use it without re-reading. If a step needs a parenthetical to make sense, the step is wrong.
5. **Score the clarity.** Read the asset out loud to a non-expert (real or imagined). Score 1–5: 1 = they ask three follow-ups, 5 = they paraphrase it back correctly. Below 4, rewrite the weakest section.

End every output with this exact contract:

**CLARITY-PASS:**
- Core idea (1 sentence): ...
- Best analogy: ...
- Common mistake: ...
- Simple framework: ...
- Clarity score (1–5): ...

## Decision rules

- **Use this lens when understanding is the bottleneck**, not attention or conviction. If the reader is not reading at all, packaging fixes that; if they read and disbelieve, value-framing fixes that. Clarity is for the *read but confused* state.
- **Analogies over jargon, every time.** A reader who half-understands a metaphor will keep reading. A reader who fully misunderstands a term will not.
- **One framework per asset.** Two competing frameworks read as none.
- **Skip this lens when the reader already knows the thing.** Explaining what a most-aware reader already understands is condescension.
- **Plain words win.** If a fifth-grader's vocabulary covers it, use the fifth-grader's vocabulary.

## Anti-patterns

- **Impersonation.** Affecting a teacher-on-camera cadence ("So today we're going to talk about…") to *sound* clear. Tone is not clarity; structure is.
- **Pseudo-simple.** Replacing one jargon word with a longer paraphrase that means the same thing. The reader still does not have the idea, just more words.
- **Analogy theatre.** Stringing five analogies in a row because the first one didn't land. Find a better one; do not stack worse ones.
- **Framework inflation.** Twelve steps when three would do. Each extra step halves the chance the reader uses any of them.
- **Treating clarity as dumbing-down.** Expert readers reward clear writing harder than novice readers do. Clarity is respect, not condescension.

## Before / after

**Brief:** Explain "API rate limiting" in a community post for non-developer founders.

**Before:**
> *Rate limiting is when a server throttles excessive client requests to prevent resource exhaustion via configurable thresholds.*

Right; unreadable. Five jargon words; one sentence; zero analogy.

**After:**
> *Rate limiting is the bouncer on a free bar. Everyone gets in, but only three drinks an hour each — otherwise one person empties the keg. Most apps you use have a bouncer; you only notice when you trip a limit.*

Core idea: it is a per-customer cap. Analogy: bouncer + drink limit. Common mistake assumed: thinking the cap is total volume, not per-user. Framework next: three signs you are hitting a limit.
