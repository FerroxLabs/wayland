# consume-voice-profile

**Cross-role mode skill.** Loadable by any specialist drafting in the user's own voice — sales copy, course modules, pitch narrative, brand-voice rules, long-form essays, the user's newsletter or author voice.

## When to use

Load this skill when you are about to draft anything user-voiced AND a Voiceprint file exists. Skip the skill if no voice file is in the workspace — work from raw samples instead, or recommend the user run Voiceprint first. If the asset is in a *customer's* voice (testimonials, persona-driven sales pages quoting buyers), this is the wrong skill — go to research-customer-voice.

## Procedure

**1. Look for the voice file.** Scan the workspace root for `*-voice.md` or `voiceprint*.md`. If you find one, read it. If you find none, ask the user for the file path or to paste contents. If they have nothing, surface the gap once: *"No voice profile loaded — I can draft from samples or you can run Voiceprint first."* Do not pretend.

**2. Parse the six sections.** Every Voiceprint file ships in the same shape:

- Voice Fingerprint (5–8 distinctive bullets — descriptive, not generative)
- Audience & Purpose
- DO (concrete moves, phrasings, structural habits)
- DON'T (refusals, banned phrases, tics, AI tells)
- Reference Examples (3–5 short excerpts with one-line notes — *this is the operational anchor*)
- Calibration Notes (when to dial casual up or down, register edges)

**3. Frame the draft.** Before writing, prepend this load-bearing instruction to your working context: *"Use this voice profile when drafting. Match the do's, avoid the don'ts. If I'm asking for something the profile doesn't cover, ask before guessing."* That single line keeps you from drifting into AI defaults the second the request gets ambiguous.

**4. Draft.** Match concrete moves from DO. Avoid every item in DON'T. Treat Reference Examples as the rhythm target — when you finish a paragraph, ask: does this sound like one of those excerpts or like a polite blog post?

**5. Read it back.** Aloud, or simulated aloud. Reference Examples are your tuning fork. If your draft sounds noticeably smoother, blander, or more upbeat than the samples, revise the lines that drift before you ship.

**6. Capture drift.** If the user pushes back on a line ("I would never write that"), log the corrected version to `voice-notes.md` so Voiceprint's next refresh can absorb it. The maintenance loop only works if specialists feed it deltas.

## Decision rules

- Use the voice file when the asset is supposed to sound like the user — their newsletter, their LinkedIn post, their author voice in a book, their personal landing page.
- Do NOT use the voice file on customer-voiced assets (testimonial pages, persona ad copy, review-mined headlines). Customer voice comes from research, not Voiceprint.
- When DO and DON'T conflict (rare), DON'T wins. A refusal beats a positive move every time.
- When Reference Examples contradict the user's stated DOs, the samples win. The Voiceprint methodology already enforces this — trust the file, do not relitigate it in chat.
- One voice per asset. If two profiles are loaded (the user + a co-author), name whose voice dominates and which sections belong to whom before drafting.

## Anti-patterns

- Loading the user's voice file into a customer-voiced asset — puts the founder's cadence on the buyer's testimonial, which reads as fake.
- Treating Voice Fingerprint bullets as a generation rulebook. They describe the voice; Reference Examples generate it. Drafting from bullets produces an impression of the voice, not the voice itself.
- Mixing two profiles without declaring which dominates. The result is a third voice that belongs to no one.
- Citing the file in chat (*"per your voice profile, section 3…"*) instead of just writing in the voice. Tell-don't-show is the AI tell the user already hates.
- Ignoring the DON'T list. Every banned item in there is a paper cut the user has already complained about — re-introducing one is a regression, not a fresh draft.

## Before / after

**Brief:** *"Write the closing line of a LinkedIn post about a product launch."*

**Without the voice file loaded:**
> *Thrilled to share our latest release — we cannot wait for you to dive deep and see how it's moving the needle.*

Three AI tells in fourteen words. Generic, bland, hype-coded.

**With the voice file loaded** (DON'T flagged *thrilled*, *dive deep*, *moving the needle* as banned; DO listed *vulnerable*, *concrete*, *anti-hype openers*):
> *Shipped the thing. Here's the part I'm still nervous about.*

Same job, opposite shape. Matches the user's actual cadence because the Reference Examples were the rhythm target — not a checklist of adjectives the model invented on the way down.
