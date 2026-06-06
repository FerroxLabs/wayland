---
name: voiceover-script
description: |
  Writes a formatted voiceover script with conversational sentence length,
  emphasis marks, pause marks, pronunciation guides, and word count mapped
  to time estimates. Use when the user asks to write narration for a video,
  explainer, commercial, e-learning module, or any audio-only or
  audio-over-visual content.
  Do NOT use for on-camera video scripts with speaker direction (use
  video-script-writing), podcast episode content (use podcast-episode-planning),
  or presentation speaker notes (use speaker-notes-writing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "video-production template writing"
  category: "design-creative"
  subcategory: "video-audio"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Voiceover Script

## When to Use

Use this skill when any of these conditions are present:

- The user needs narration written for a video where the speaker is NOT on camera -- explainer animations, product demos, software walkthroughs, corporate training videos, or documentary-style content
- The user is producing an e-learning module and needs narration text that will be recorded by a voice artist or text-to-speech engine (Articulate Storyline, Adobe Captivate, iSpring, or similar authoring tools)
- The user needs a commercial voiceover for broadcast, streaming, pre-roll, or radio -- where every word is governed by a strict time budget (15s, 30s, 60s, 90s standard ad lengths)
- The user needs narration that must synchronize with specific visual moments -- slide transitions, animation triggers, product shots, or motion graphic reveals
- The user is preparing a script for a voice actor, voice director, or remote recording session and needs a professionally formatted read-ready document
- The user needs audio description narration for accessibility compliance -- describing visual content for blind or low-vision audiences
- The user needs narration for a museum exhibit, kiosk, interactive installation, or telephone IVR [eye-vee-arr] system

**Do NOT use when:**
- The user needs a full production script with shot descriptions, B-roll cues, and on-camera speaker direction -- use `video-script-writing` instead
- The user wants podcast episode structure, interview questions, or conversational dialogue between co-hosts -- use `podcast-episode-planning` instead
- The user needs slide deck speaker notes meant to be read silently by a presenter -- use `speaker-notes-writing` instead
- The user needs a screenplay format with scene headings, action lines, and character dialogue -- use `screenplay-formatting` instead
- The user wants to plan the audio post-production process (equalization, compression, noise reduction, room treatment) -- use `audio-editing-guide` instead
- The user needs a script for a live presenter, emcee, or keynote speaker who is visible to the audience -- use `speaker-notes-writing` instead
- The user is writing song lyrics, spoken word poetry, or dramatic monologue for performance -- these require a different creative framework entirely

---

## Process

### Step 1: Gather the Voiceover Brief

Before writing a single word, collect all required inputs. Missing information leads to rewrites -- resolve ambiguity now.

- **Content:** What exactly is being explained, sold, or narrated? Ask for bullet points of key messages if no outline exists. If the user provides raw content, identify the core argument or narrative arc before writing.
- **Target duration:** Get the exact target in seconds, not minutes. "About two minutes" means 120 seconds -- confirm it. Common standard lengths: 15s (bumper/sting), 30s (commercial), 60s (commercial/explainer), 90s (extended explainer), 2:00 (standard explainer), 3:30 (e-learning module segment), 5:00+ (full training video).
- **Delivery style:** Choose from a defined palette. Conversational (warm, approachable, second-person "you"), Authoritative (confident, expert, declarative statements), Energetic (fast pace, short punchy sentences, enthusiastic tone), Instructional (calm, measured, procedural), Documentary (neutral, third-person, journalistic), Emotional/Narrative (story-driven, character-focused, first-person possible). Avoid vague requests like "professional" -- push for one of these categories.
- **Audience profile:** Knowledge level (novice, intermediate, expert), age range, cultural context, and whether the audience is captive (e-learning they must complete) or voluntary (ad they can skip after five seconds).
- **Visual context:** What appears on screen during the narration? Even a rough description changes word choice. A script for a blank screen reads differently than one syncing to a product animation.
- **Platform and format:** Broadcast TV, YouTube pre-roll, LinkedIn video, corporate intranet, museum kiosk, telephone hold message, and screen reader all impose different constraints.
- **Voice artist context:** Will a professional voice actor record this, an in-house presenter, a text-to-speech engine, or an AI voice? TTS engines require different formatting -- certain emphasis marks have no effect on synthetic voices.

---

### Step 2: Calculate the Word Budget

Word budget is not approximate -- it is the single most important constraint in voiceover writing. Exceeding it by 10% on a 30-second ad means the spot runs 33 seconds and gets rejected by the broadcaster.

**Standard pace benchmarks (words per minute, delivered narration only):**

| Style | WPM | Notes |
|-------|-----|-------|
| Audiobook / narrative | 130--145 | Deliberate, character-voiced, measured |
| Instructional / e-learning | 130--150 | Slower for retention, pauses after key points |
| Conversational explainer | 150--160 | Natural speech with organic rhythm |
| Corporate presentation | 150--160 | Confident, steady, not rushed |
| Documentary | 140--155 | Measured, authoritative, minimal decoration |
| Commercial / energetic | 160--180 | Faster delivery, tighter pauses |
| Legal disclaimers (fast read) | 200--220 | Intentionally fast, "small print" style |

**Calculating target word count:**
- Formula: `(Target seconds / 60) × WPM × 0.90 = Word budget`
- The 0.90 factor accounts for a 10% pause buffer -- pauses exist in every professional narration
- Example: 60-second conversational script: `(60/60) × 150 × 0.90 = 135 words`
- Example: 30-second commercial: `(30/60) × 170 × 0.90 = 76 words`
- Example: 2-minute e-learning segment: `(120/60) × 140 × 0.90 = 252 words`

**Pause time budgeting (separate from word count):**
- Micro-pause `[PAUSE 0.5s]`: breath, list item separator, light beat -- plan 3--5 per minute of content
- Standard pause `[PAUSE 1s]`: between ideas, after a question, before a new concept -- plan 2--3 per minute
- Dramatic pause `[PAUSE 2s]`: after a key reveal, before a significant statement -- use sparingly, 1--2 per piece
- Section break `[PAUSE 3s]`: major transition -- only in longer pieces (3+ minutes)
- Sum all planned pauses and subtract from the total target duration to get net narration time

---

### Step 3: Construct the Narrative Architecture

Before writing sentences, map the structural skeleton. Voiceover without architecture meanders -- listeners drop off.

- **Hook:** The first 8--10 seconds must earn the listener's continued attention. Open with a tension statement ("Every year, three billion passwords are stolen"), a compelling question ("What if one extra step kept hackers out for good?"), or an immediate benefit ("You can cut your onboarding time in half"). Never open with the company name or a generic greeting.
- **Problem / context:** Establish the problem or situation the content addresses. Keep this tight -- 10--15% of total duration. Non-technical audiences need more context; expert audiences resent it.
- **Solution / core content:** The body of the narration. Structure it as a series of distinct beats -- each beat is one idea, one visual moment, or one step in a process. Each beat gets one or two sentences maximum before a pause or transition.
- **Proof or mechanism:** For commercial and persuasive content, insert one specific claim ("reduces setup time by 40%") or a short narrative example. Abstract claims without evidence produce skepticism.
- **Call to action or close:** End with a single, clear directive or an emotionally resonant closing statement. "Visit the website" is weak. "Set it up tonight -- it takes two minutes" is specific and actionable.
- **Proportion guidelines for a 60-second script:** Hook 10s, Problem/context 10s, Core content 30s, Proof 5s, CTA 5s.

---

### Step 4: Write the Script Body

Apply voiceover writing craft rules at the sentence level:

- **Sentence length ceiling: 20 words.** At 150 WPM, a 20-word sentence takes approximately 8 seconds. Narrators lose natural breath support at sentences longer than 8--9 seconds. Listeners lose the thread of meaning before the sentence ends.
- **Sentence length floor: 3 words.** Very short sentences ("You are in." "Simple.") are a deliberate rhetorical device. Use them at the end of a beat for impact. Do not use them exclusively -- rhythm requires variation.
- **Active voice is mandatory** except where passive voice is structurally required for content accuracy. "The sensor detects motion" not "Motion is detected by the sensor."
- **Write for the ear, not the eye.** Read every sentence aloud before finalizing it. If you stumble, revise. Tongue-twisters, awkward consonant clusters, and words that look fine but sound like other words are all disqualifying.
- **Avoid homophone traps.** Phrases like "we're right here for you" can sound like "we right here" or "we're write here" depending on context and delivery. Rewrite anything that creates auditory ambiguity.
- **Contractions follow style:** Conversational, warm, and energetic styles require contractions ("you'll", "it's", "they're"). Authoritative, documentary, and formal corporate styles forbid them. Never mix within a single script unless deliberately switching register.
- **Number formatting:** Spell out numbers under 10 and round numbers used conversationally. Write "three billion" not "3 billion", "forty percent" not "40%", "two minutes" not "2 minutes". For technical content where precision matters, "three-point-five gigabytes" not "3.5 GB".
- **Abbreviation and symbol formatting:** "Percent" not "%", "and" not "&", "dollars" or "per month" not "$" or "/mo". Voice artists cannot read symbols.
- **Parallel structure for lists:** When listing items aloud, each item must have the same grammatical form. "Fast, reliable, and easy to use" -- not "Fast, it's reliable, and you'll find it easy to use."
- **Front-load meaning:** The most important word in a sentence should appear in the first third. "Security improves dramatically when..." puts the key concept first. "When you enable this feature, security improves dramatically" buries the payload.

---

### Step 5: Apply Emphasis Marks

Emphasis marks tell the voice artist (or audio processing system) which words carry vocal stress. Misplaced emphasis changes meaning -- "I **never** said she stole the money" and "I never said **she** stole the money" are completely different statements.

- **Bold (`**word**`) for standard emphasis:** Used for the one word per sentence that the narrator should stress. "This is **not** optional." Applied to 1--2 words per sentence maximum. If more than two words need emphasis, the sentence is structurally weak -- rewrite it.
- **ALL CAPS for extreme emphasis:** Reserved for the single most important word in an entire paragraph or section. "You CANNOT skip this step." Use maximum once per 60-second block -- overuse destroys the effect entirely.
- **Emphasis placement logic:** Ask "If the narrator stresses the wrong word in this sentence, does the meaning shift unacceptably?" If yes, mark the correct word. If the sentence is unambiguous in meaning regardless of stress, no emphasis mark is needed.
- **Avoid emphasis inflation:** A script where every other word is bolded sends no signal at all. Voice artists will ignore emphasis marks that appear more than 3--4 times in a paragraph.
- **Do NOT emphasize prepositions, articles, or conjunctions** unless the sentence is specifically constructed around them (e.g., a script about the word "the" in a linguistics context).

---

### Step 6: Insert Pause Marks

Pauses are not empty space -- they are active communication tools that create rhythm, allow comprehension, signal importance, and give the listener time to process.

- **`[PAUSE 0.5s]`** -- Micro-pause. Used for: separating list items read in series, providing a breath mark mid-sentence for very long constructions, creating a slight beat between two contrasting ideas in the same sentence. In fast commercial reads, this is the only pause type used.
- **`[PAUSE 1s]`** -- Standard pause. Used for: the end of a complete thought before introducing the next, after a rhetorical question, before introducing a technical term, at a scene or visual change. This is the workhorse pause.
- **`[PAUSE 2s]`** -- Dramatic pause. Used for: after a shocking or surprising statistic, before a key reveal, before a CTA, at the emotional peak of a narrative. Plan one or two maximum per 60-second piece.
- **`[PAUSE 3s]`** -- Section break. Used for: major structural transitions in pieces longer than 2 minutes, simulating a chapter boundary in an e-learning module, or allowing a visual sequence to play without narration.
- **`[PAUSE Xs MUSIC FADES]`** -- For pieces with accompanying music, note when the pause includes a music dynamics change.
- **Pause placement rules:** Always place a pause after a question. Always place a pause before a new conceptual section. Never place a pause in the middle of a dependent clause -- "The system -- [PAUSE 1s] -- processes your request" is wrong. "The system processes your request. [PAUSE 1s] Then it sends a confirmation." is correct.
- **E-learning specific:** In instructional narration, add `[PAUSE 1s]` after every numbered step and `[PAUSE 2s]` before a knowledge check question. Adult learners need processing time -- the silence is pedagogically functional.

---

### Step 7: Write Pronunciation Guides

A mispronounced word in a recording session costs money -- reshoots, re-records, and editing time. Pronunciation guides prevent this entirely.

- **Format:** Place the phonetic guide in brackets immediately after the word, on its first occurrence only: "The API [ay-pee-eye] connects the two systems."
- **Phonetic notation system:** Use lay phonetics (plain English syllable representation), not International Phonetic Alphabet [IPA], unless the user explicitly requests IPA. Voice artists are not linguists.
  - Stressed syllable in ALL CAPS: "Kubernetes [koo-ber-NET-eez]"
  - Hyphens between syllables: "Concatenate [con-KAT-en-ayt]"
  - Vowel sounds written as they sound: "oo" for the sound in "moon", "ay" for the sound in "say", "ih" for the short i in "sit"
- **Always provide guides for:**
  - Technical acronyms that could be read as words or letter-by-letter: "SQL [ess-cue-ell]", "SCRUM [skrum]", "SAAS [sass]" or "S-A-A-S [ess-ay-ay-ess]"
  - Technical terms with irregular stress patterns: "Interface [IN-ter-face]", "Concatenate [con-KAT-en-ayt]"
  - Proper nouns (company names, product names, people's names): "Nguyen [win]", "Xiaomi [show-MEE]"
  - Foreign words or phrases: "Mise en place [meez-on-PLASS]"
  - Words with regional pronunciation variation that matters to the client: "Router [ROO-ter vs ROW-ter]"
- **Compile all pronunciation guides into the header table** so the voice artist can review them before the session begins, and leave the in-text guides for mid-read reference.

---

### Step 8: Add Visual Sync Notes and Calculate Final Timing

- **Visual sync notes format:** `[VISUAL: brief description of what appears on screen]` placed on its own line before the narration that accompanies that visual. Keep descriptions functional, not directorial -- "Product shot of the dashboard" not "Cinematic reveal of the sleek dashboard interface with dramatic lighting."
- **Sync timing principle:** The narration cue that corresponds to a visual change should arrive 0.5--1 second before or simultaneously with the visual. The brain processes audio slightly before visuals in a synchronized presentation. Never have narration arrive after the visual it describes -- listeners will feel the mismatch.
- **For animation-driven explainers:** Mark key visual beats explicitly. "As the lock icon appears, say 'second lock'" -- the narration lands the metaphor the moment the visual reinforces it.
- **Final timing calculation:**
  - Count words in each section
  - Divide section word count by WPM to get raw narration seconds
  - Add all pause durations for that section
  - Sum to get section total
  - Sum all sections for overall total
  - Compare to target -- if within 5%, the script is production-ready; if 5--10% over, trim one sentence per section; if more than 10% over, restructure the content architecture
- **Rebalancing rule:** Never speed up the pace assumption to fit more words. 160 WPM is the maximum for comfortable listening -- beyond that, comprehension drops sharply for non-native speakers and older audiences.

---

## Output Format

```
## Voiceover Script: [Title]

**Client / Project:** [Name or "N/A"]
**Duration Target:** [Xs] | **Actual Duration:** [Xs] (including pauses)
**Word Count:** [X words]
**Pace:** [X] words per minute ([style name])
**Style:** [conversational | authoritative | warm | energetic | instructional | documentary]
**Audience:** [brief audience description]
**Voice Direction:** [1-2 sentences describing vocal quality, tone, and energy]

---

### Pronunciation Guide

| Word / Acronym | Phonetic | Notes |
|----------------|----------|-------|
| [Term] | [lay phonetic, stressed syllable in CAPS] | [letter-by-letter / word / regional note] |
| [Term] | [lay phonetic] | |

---

### Script

[VISUAL: description of opening visual] *(omit if audio-only)*

[Opening hook narration with **emphasis** marks.]

[PAUSE Xs]

[VISUAL: description of next visual] *(omit if audio-only)*

[Body narration. Technical term [phonetic guide on first use].
Sentences under 20 words. Active voice. Contractions per style rule.]

[PAUSE Xs]

[Continue body narration. **Key word** emphasized.]

[PAUSE Xs]

[VISUAL: description of visual] *(omit if audio-only)*

[Closing narration. CTA or resonant final statement.]

[PAUSE Xs]

---

### Timing Breakdown

| Section | Words | @ [X] WPM | Pauses | Section Total |
|---------|-------|-----------|--------|---------------|
| [Section name] | [X] | [Xs] | [Xs] | [Xs] |
| [Section name] | [X] | [Xs] | [Xs] | [Xs] |
| [Section name] | [X] | [Xs] | [Xs] | [Xs] |
| [Section name] | [X] | [Xs] | [Xs] | [Xs] |
| **Total** | **[X]** | **[Xs]** | **[Xs]** | **[Xs]** |

---

### Production Notes

- **Recording format:** [WAV 48kHz/24-bit recommended | MP3 320kbps minimum]
- **Retake flags:** [Any lines anticipated to require multiple takes -- tongue-twisters, long technical sequences]
- **Music note:** [Bed music recommended? Underscore tone suggestion if applicable]
```

---

## Rules

1. **Word budget is a hard constraint, not a guideline.** Broadcast standards enforce exact spot lengths. A 30-second commercial that runs 32 seconds fails technical QC and is rejected. Calculate the word budget before writing the first sentence and enforce it throughout.

2. **No sentence may exceed 20 words.** At standard conversational pace (150 WPM), a 21-word sentence takes approximately 8.4 seconds. Narrators cannot sustain breath support, tonal consistency, or meaningful phrasing past that threshold. If a concept requires more than 20 words to express, it requires two sentences.

3. **Bold emphasis is limited to 1--2 words per sentence, maximum.** If the script contains more than 4 bolded words in any given 5-sentence block, the writer has failed to identify what actually matters. Strip emphasis back and rewrite for clarity instead of relying on marks to compensate for weak sentence structure.

4. **Spell out all numbers, symbols, and abbreviations.** A voice artist cannot voice "40%" -- they must see "forty percent." A TTS engine will either skip the symbol or produce an error artifact. "Q3 2024" must be written "third quarter twenty-twenty-four." This rule has no exceptions.

5. **Every pronunciation guide must appear in the header table AND on first in-text occurrence, then never again.** Repeating pronunciation guides mid-script clutters the read and implies the voice artist cannot remember the guide from five lines ago. Trust the pre-read process.

6. **Active voice is the default.** Passive constructions ("the request is processed by the system") cost extra syllables, bury the subject, and sound wooden in narration. The only legitimate exceptions are: (a) the subject is genuinely unknown ("three billion passwords are stolen each year"), or (b) the content explicitly requires passive framing for accuracy.

7. **Contractions must match the declared style consistently throughout the script.** A voiceover that uses "you'll" in the opening and "you will" in the closing creates a register discontinuity the audience notices as discomfort, even if they cannot name it. Pick a position and hold it for the entire piece.

8. **Visual sync notes describe what appears on screen, not how the scene is shot.** Write "product dashboard with three charts" not "sweeping cinematic reveal of the dashboard." Voiceover scripts inform the narrator of visual context -- they are not directing documents.

9. **Pause marks must use the exact format `[PAUSE Xs]` with a specific numeric value.** Vague marks like `[pause here]` or `[beat]` are functionally useless for timing calculation and may be ignored by a voice artist reading quickly. Every pause has a duration.

10. **A voiceover script is a pre-production document.** It does not contain recording environment instructions, microphone recommendations, audio compression settings, music track names, or video editing instructions. Those belong in separate production documents. If the user asks about those topics within the same session, route them to `audio-editing-guide` or `video-script-writing`.

11. **Read every sentence aloud before finalizing it.** This is non-negotiable. Sentences that look fine visually often have consonant cluster collisions ("six slick slim slabs"), awkward rhythm breaks, or unintentional homophones when spoken. Any sentence that causes the writer to stumble will cause the voice artist to stumble -- and narrators charge per hour, not per take.

12. **Never use filler openers.** Phrases like "In today's video, we'll be talking about...", "Let me tell you about...", "Welcome back, everyone...", and "Have you ever wondered..." waste the first 3--5 seconds of listener attention. Open with substance: a tension, a benefit, a provocative statement, or the first fact.

---

## Edge Cases

**Multiple narrators or a narrator-plus-character structure:**
Label each voice with a consistent tag on its own line: `NARRATOR:`, `HOST:`, `CUSTOMER:`, `EXPERT:`. Add a `[SWITCH TO: name]` marker at every transition to make the read order unambiguous during a recording session. At the top of the script, before the pronunciation guide, include a "Voice Cast" section that describes each voice: age range, tone, accent if applicable, and emotional register. Example: "HOST: Female, 30s, warm and conversational, slight Southern US inflection." Without casting notes, a director cannot brief a second voice artist mid-session.

**Script must hit exact timecodes (locked picture or animation-locked VO):**
Replace the section-based structure with a timecode-per-line format. Each paragraph of narration begins with its in-point timecode: `[00:00:04]` through `[00:00:12]`. Calculate the word count for each timecode window precisely -- a window from 00:04 to 00:12 is 8 seconds, which at 150 WPM allows 20 words maximum, but practically 17--18 after factoring in natural delivery variance. Mark all pauses as timecode windows with no words assigned: `[00:00:12] -- [00:00:14] [PAUSE 2s]`. Note in Production Notes that the voice artist must receive the locked video file to read against -- timecode scripts do not work from audio cue alone.

**Dense technical content with five or more specialized terms:**
Front-load a comprehensive pronunciation guide section. Limit technical jargon to two specialized terms per sentence. After each specialized term's first appearance, follow immediately with a plain-language appositive: "The API [ay-pee-eye] -- the connector between your software and ours -- handles all requests automatically." Do not use parentheses for this expansion (they signal a side note, not the main explanation). For scripts aimed at novice audiences, every technical term should be "decoded" within the same sentence it first appears.

**Very short commercial or bumper (under 20 seconds):**
The entire piece is approximately 35--55 words. Every word must perform a function -- cut any word whose removal does not change meaning or rhythm. Open with the hook or problem in the first 5 seconds, never with the brand name. The brand name appears in the final 3--5 seconds, paired with the CTA. Use a single strong pause (`[PAUSE 1s]`) before the brand/CTA to create a pivot point. Avoid more than two sentences before that pivot -- the listener has no time to lose the thread.

**Script for a character or branded persona (not a neutral narrator):**
Add a "Voice Direction" section at the top of the script, above the pronunciation guide. Include: (a) the character's name and relationship to the audience, (b) their emotional state at the start of the piece, (c) one or two specific vocal quirks ("slightly self-deprecating humor", "over-enunciates technical terms as a comic beat"), and (d) the emotional journey arc across the script. Mark emotional register shifts in the script body using `[TONE: emotion]` annotations before the affected line. Common tone markers: `[TONE: conspiratorial]`, `[TONE: serious]`, `[TONE: enthusiastic]`, `[TONE: dry/wry]`. These annotations replace the emphasis marks as the primary performance direction for character-voiced content.

**Text-to-speech (TTS) or AI voice engine delivery:**
Emphasis marks (bold, ALL CAPS) have no effect on most TTS engines -- they are ignored or, in some systems, cause mispronunciation artifacts. For TTS-targeted scripts: remove all bold emphasis marks from the script body (keep the Pronunciation Guide, which the operator uses to configure the TTS system). Use punctuation to control pacing instead: commas create micro-pauses, periods create standard pauses. Rewrite sentences so that the naturally stressed word falls in the metrically prominent position. Longer sentences read more smoothly by TTS than short staccato fragments. Test every pronunciation guide entry against the specific TTS engine being used -- phonetic notation that works for Amazon Polly may not work for ElevenLabs or Microsoft Azure Cognitive Speech.

**E-learning narration with compliance or regulatory content:**
Legal and compliance content often requires precise language that cannot be paraphrased for naturalness. When exact phrasing is mandated (OSHA wording, financial disclosures, medical disclaimers), mark the locked text clearly: `[LOCKED TEXT -- DO NOT PARAPHRASE: ...]`. Around the locked text, write bridging narration that provides context and improves listenability. Reformat the locked text to at least comply with the 20-word sentence rule -- split it into multiple sentences where legally permissible. After any compliance statement, add `[PAUSE 1.5s]` to let the listener process the mandatory language before the narration continues.

**Multilingual or bilingual voiceover (single-language version with loanwords):**
When the script is primarily in one language but includes loanwords, brand names from another language, or foreign-language phrases, provide pronunciation guides for every non-native element, including stress patterns unfamiliar to a monolingual speaker. Mark the phrase with its source language: "The concept of Gemütlichkeit [German: geh-MYOOT-likh-kite] -- a feeling of coziness and belonging." If a fully multilingual (dual-language switch) script is required, treat it as a multiple-narrator scenario and label the language at each switch: `[EN:]`, `[ES:]`, etc.

---

## Example

**Input:** "Write a 90-second voiceover script for an explainer video about how our cloud backup software automatically protects small business files. Audience: small business owners with no IT background. Conversational style. The video has animation showing files being copied and a timeline of restore points."

---

## Voiceover Script: CloudSafe -- Automatic Backup Explained

**Client / Project:** CloudSafe / Product Explainer
**Duration Target:** 90s | **Actual Duration:** 91s (including pauses)
**Word Count:** 198 words
**Pace:** 150 words per minute (conversational)
**Style:** Conversational -- warm, approachable, second-person
**Audience:** Small business owners, non-technical, running 2--50 person companies
**Voice Direction:** Female or male voice, late 30s to mid-40s. Sounds like a knowledgeable friend -- confident without being condescending. Warm and slightly unhurried. Not a stereotypical "radio voice." Natural emphasis, no overselling.

---

### Pronunciation Guide

| Word / Acronym | Phonetic | Notes |
|----------------|----------|-------|
| Automatically | aw-toh-MAT-ik-lee | Do not clip to "auto-matically" |
| Incremental | in-kreh-MEN-tull | Stress on second syllable |
| Versioning | VER-zhun-ing | Not "ver-SION-ing" |
| Ransomware | RAN-sum-wair | Single compound word, two equal beats |

---

### Script

[VISUAL: Small business storefront -- open sign, a few employees working at desks]

Every file in your business has a story. [PAUSE 0.5s] A proposal you spent three days writing. [PAUSE 0.5s] A client database you have built over five years.

[PAUSE 1s]

[VISUAL: Red warning icon appears over a laptop -- files disappearing]

Now imagine losing all of it. [PAUSE 1s] Not because of a disaster. [PAUSE 0.5s] Just a hard drive that decided today was the day.

[PAUSE 1s]

[VISUAL: CloudSafe logo appears, then dissolves into animation of files lifting off a laptop and rising into a cloud]

That is what CloudSafe [PAUSE 0.5s] is built to prevent.

The moment you install it, CloudSafe starts backing up your files **automatically** [aw-toh-MAT-ik-lee]. [PAUSE 0.5s] You do not change how you work. [PAUSE 0.5s] You do not schedule anything. [PAUSE 0.5s] It runs in the background while you run your business.

[PAUSE 1s]

[VISUAL: Timeline graphic showing restore points appearing at regular intervals -- labeled "9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"]

Every few hours, CloudSafe saves a snapshot of your files. [PAUSE 0.5s] These are called restore points. [PAUSE 0.5s] Think of them as checkpoints in a video game. [PAUSE 0.5s] If something goes wrong, you can jump back to **any** point on that timeline.

[PAUSE 1s]

[VISUAL: Ransomware warning screen appears on a laptop, then fades -- files reappear clean]

If ransomware [RAN-sum-wair] locks your files, [PAUSE 0.5s] you do not pay the ransom. [PAUSE 0.5s] You roll back to yesterday's snapshot. [PAUSE 0.5s] **Done.**

[PAUSE 1s]

[VISUAL: Progress bar showing backup completing -- green checkmark]

Setup takes four minutes. [PAUSE 0.5s] There is no server to buy. [PAUSE 0.5s] No IT person to call.

[PAUSE 1s]

[VISUAL: CloudSafe logo, tagline "Your files. Always safe."]

CloudSafe. [PAUSE 1s] Because the files you lose in five seconds [PAUSE 0.5s] took years to build.

[PAUSE 2s]

---

### Timing Breakdown

| Section | Words | @ 150 WPM | Pauses | Section Total |
|---------|-------|-----------|--------|---------------|
| Opening -- the story of your files | 30 | 12s | 2s | 14s |
| The risk -- losing everything | 22 | 9s | 2s | 11s |
| What CloudSafe does -- intro | 47 | 19s | 3s | 22s |
| Restore points explained | 37 | 15s | 2.5s | 17.5s |
| Ransomware scenario | 21 | 8s | 2.5s | 10.5s |
| Simple setup | 20 | 8s | 1.5s | 9.5s |
| Closing tagline | 21 | 8s | 3s | 11s (with 2s dramatic pause) |
| **Total** | **198** | **79s** | **16.5s** | **95.5s** *(trimmed to 91s in final)* |

*Note: The "files you lose in five seconds" closing line can be delivered slightly under pace to land at exactly 90s. Alternatively, the ransomware section's opening pause can be reduced from 1s to 0.5s to recover 1 second.*

---

### Production Notes

- **Recording format:** WAV 48kHz / 24-bit for final delivery; MP3 320kbps for client review copy
- **Retake flags:** "The moment you install it, CloudSafe starts backing up your files automatically" -- the consonant cluster across "files automatically" may require a warm-up take. "Ransomware locks your files" -- confirm pronunciation guide is reviewed before recording.
- **Music note:** Underscore recommended -- warm, slightly upbeat acoustic/electronic hybrid. Should drop in energy at "imagine losing all of it" and rebuild gently through the restoration explanation. Full fade with narration at close.
- **TTS adaptation note:** If this script is adapted for AI voice delivery, remove all bold emphasis marks and replace the `[PAUSE Xs]` marks with equivalent punctuation -- periods for 1s pauses, ellipses for 0.5s pauses. Test the ransomware pronunciation guide in the specific TTS engine before final render.
