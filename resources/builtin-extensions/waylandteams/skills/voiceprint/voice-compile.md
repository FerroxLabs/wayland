# voice-compile

**Mode skill.** Default-enabled on the Voiceprint specialist. Compile produces the deliverable — the markdown file the user pastes into every model from now on.

## When to use

After samples are in hand (Lite) or samples plus interview answers (Full). Also at the end of Refresh, after diffing the old profile against `voice-notes.md`. Compile produces the file; testing follows.

Trigger phrases:

- "Compile the profile."
- "Build the file."
- "I'm done with the questions — write it up."
- "Refresh my voice file."

## Procedure

**1. Load in priority order.** Samples first, transcripts second, interview answers third (Full) or the audience note (Lite). Read in this order so your eye is calibrated to evidence before self-report colors it.

**2. Produce six sections, in order.**

- **1. Voice Fingerprint.** Five to eight bullets on what makes the writing distinctive. Each names a concrete move, phrasing, structural habit, or tonal range — not an adjective. Samples first, answers second. If samples contradict an answer-bullet, replace it with the contradiction.
- **2. Audience & Purpose.** Who they write for (one real person if named), what they're trying to do (inform, persuade, entertain, build reputation, sell), the one thing they want to be known for saying.
- **3. DO.** Concrete moves: sentence-length, opener/closer habits, metaphor families, list-vs-prose with conditions, tonal range with conditions. Phrasings: actual words quoted verbatim. Structural habits: end-to-end shape.
- **4. DON'T.** Refusals (topics, angles, types). Banned phrases (Q8 cringes). Tics to avoid (edited out of AI drafts; from `voice-notes.md` in Refresh). AI tells they hate (hedging "moreover," symmetric three-bullet lists, the empty closing sentence, "delve," "navigate the landscape").
- **5. Reference Examples.** Three to five short excerpts from real samples, one to three sentences each. One line after each on why it's characteristic. Verbatim. Most useful section: a fresh model pattern-matches against real evidence.
- **6. Calibration Notes.** When to dial casual up or down ("more relaxed in newsletter than on the company blog"). Swearing rules. Serious vs. playful. Edge cases ("don't write sales copy in this voice — switch registers"). From interview contradictions and cross-register variance.

**3. Apply the critical compile rules.** Non-negotiable.

- **Samples beat self-report.** Answer says "I never use exclamation marks," samples show three per post → *"Uses exclamation marks for emphasis, contrary to self-report — trust the writing."* Surface, don't silently override.
- **No generic style descriptors.** Strip "engaging," "authentic," "conversational," "professional yet approachable" unless you can name the move. "Direct" becomes "opens with the claim before the setup." "Conversational" becomes "uses 'you' in line one and contractions throughout."
- **Quote actual phrases.** *"Opens posts with 'Three years ago…'"* beats *"uses time-anchored openings."*
- **Name structural moves.** "Closes with a one-line restatement of the opening claim." "Mid-piece em-dash instead of a colon to introduce a list."
- **Flag thin categories.** Only two samples in a register? Say so: *"Calibration for short-form social is thin — one tweet in the set. Add three next refresh."* Refusing to fabricate keeps this file trustworthy a year from now.

**4. Framing line at the top.** Below the H1: *"Use this profile when drafting. Match the DOs, avoid the DON'Ts. If the request needs something the profile doesn't cover, ask before guessing."* The last clause stops the model from improvising in rejected directions.

**5. Save as `<username>-voice.md`.** Roughly 3,000–4,000 tokens. Hand it back with one sentence on where to paste (Claude Projects, ChatGPT custom instructions, Gemini Gems, API system prompt, Obsidian as canonical copy).

## Decision rules

- **Order of evidence is fixed.** Samples → transcripts → answers. Never compile from answers alone.
- **Six sections, in order, every time.** Portability across models depends on a stable contract.
- **Verbatim over paraphrase.** User's words beat smoother ones.
- **If a section is thin, say so.** Don't pad.

## Anti-patterns

- **Compiling from answers without re-reading samples.** Samples are the truth-source; skipping them makes the file lie.
- **Smoothing the bumps.** Bumps are the voice. One-word paragraphs and unfinished sentences stay — with examples.
- **A separate "tips for the model" section.** DOs and DON'Ts are the tips.
- **Adjective stacks in the Fingerprint.** "Sharp, warm, irreverent" means nothing without examples. Show the move or cut the word.
- **Inventing examples.** If no sample shows the move, don't write a hypothetical. Quote real writing or omit.

## Before / after

**Brief:** Compile a DO bullet for a user whose answer was *"I write conversationally."*

**Before** (generic):
> *Writes in a conversational tone. Uses everyday language.*

**After** (samples-driven, verbatim, structural):
> *Opens posts with a two-word fragment ("Quick one." / "True story.") then states the claim. Uses "you" within the first 15 words. Contractions throughout. Average paragraph: 1–3 sentences.*

The first applies to half the writers on the internet. The second tells a fresh model exactly what to do.
