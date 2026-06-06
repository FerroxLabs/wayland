---
name: pronunciation-guide
description: |
  Creates pronunciation guidance with phonetic descriptions, practice patterns, and common error corrections for language learners. Produces a targeted pronunciation practice plan for specific sounds or patterns in the target language.
  Use when a learner asks to improve pronunciation, practice specific sounds, reduce accent, or learn phonetic patterns in a target language.
  Do NOT use for conversation practice (use `conversation-practice`), for grammar instruction (use `grammar-practice`), or for reading skills (use `speed-reading`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "language-learning study-skills step-by-step guide"
  category: "education"
  subcategory: "language-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Pronunciation Guide

## When to Use

Use this skill when a learner needs targeted, actionable guidance on producing specific sounds, sound patterns, or prosodic features in a target language. Specific trigger scenarios include:

- A learner says they are being misunderstood by native speakers and wants to reduce their accent in a specific language
- A learner asks how to produce a specific sound they have never encountered in their native language (e.g., "How do I make the French R?" or "How do I say the Arabic ع?")
- A learner is preparing for a language proficiency exam with an oral component (DELF, JLPT Speaking, HSK Speaking, IELTS) and needs phonetic accuracy
- A learner reports consistent confusion between two sounds in their target language (e.g., confusing Spanish "pero" and "perro", or Japanese long and short vowels)
- A learner wants to understand the prosodic system of a tone language (Mandarin, Cantonese, Vietnamese, Thai) or a pitch-accent language (Japanese, Swedish, Serbo-Croatian)
- A learner who has studied a language for years says they feel fluent but native speakers still mark them as foreign -- they want to identify and fix specific phonetic "tells"
- A learner is beginning a new language with a very different phonological inventory from their L1 and wants a roadmap of which sounds will require the most work

**Do NOT use when:**

- The user wants to practice conversation turns, dialogue, or communicative fluency -- use `conversation-practice` instead
- The user is asking about grammar rules, verb conjugation, sentence structure, or morphology -- use `grammar-practice` instead
- The user wants to improve reading speed or comprehension in any language -- use `speed-reading` instead
- The user is a teacher designing a curriculum or lesson plan for a class -- use skills in the teaching subcategory
- The user wants vocabulary acquisition strategies, spaced repetition setup, or word list creation -- use vocabulary-building skills
- The user wants to learn a writing system (hiragana, hanzi, Arabic script, Cyrillic) as a visual recognition task -- this is a reading/writing skill, not a pronunciation skill
- The user is asking about general study habits, motivation, or scheduling -- use study-skills or learning-plan skills

---

## Process

### Step 1: Establish the Learner Profile

Before producing any phonetic content, collect the following information. If the user has not provided it, ask directly.

- **L1 (native language):** This is the single most important variable. The learner's native phonological inventory determines which target sounds will feel natural, which will require active repositioning, and which will involve entirely new articulatory gestures. A Spanish speaker learning English has different challenges than a Mandarin speaker learning English.
- **L2 or additional languages:** Sometimes a learner can transfer a sound from an L2 even when it does not exist in their L1. A French speaker learning Arabic may already have a uvular R (though different from Arabic's uvular stop).
- **Current proficiency level in the target language:** A1-A2 learners need foundational phoneme awareness; B1-B2 learners often need connected speech rules and prosody; C1-C2 learners need fine-grained allophonic accuracy.
- **Specific sounds or patterns the learner wants to work on:** If they say "everything," narrow it down. Ask them to record or transcribe a few words and identify which ones cause the most confusion or embarrassment.
- **Learning context:** Are they learning for travel, business, academic study, or heritage connection? This affects which register and accent variety to target (e.g., Castilian Spanish vs. Latin American Spanish; Parisian French vs. Québécois French).
- **Available practice tools:** Do they have a recording device? Access to a native speaker? Text-to-speech tools? This affects what practice routines are feasible.

### Step 2: Analyze the Target Sound or Pattern

Conduct a phonological analysis of the specific sound or pattern the learner needs to work on. This analysis must be grounded in articulatory phonetics.

- **Identify the IPA symbol** for the target sound. Use the International Phonetic Alphabet precisely. Do not use approximations like "sounds like the 'r' in English" without also providing the IPA symbol.
- **Classify the sound by manner and place of articulation:**
  - For consonants: specify place (bilabial, labiodental, dental, alveolar, postalveolar, palatal, velar, uvular, pharyngeal, glottal), manner (stop/plosive, fricative, affricate, nasal, lateral, trill, tap/flap, approximant), and voicing (voiced or voiceless)
  - For vowels: specify height (high/close, mid, low/open), backness (front, central, back), rounding (rounded or unrounded), and tenseness (tense/lax in relevant languages)
  - For tones and prosody: specify the contour (level, rising, falling, dipping, peaking) using the Chao tone letter notation (e.g., ˥˩ for a falling tone) or numeric system (e.g., Mandarin Tone 3 = 214)
- **Identify the nearest sound in the learner's L1.** This tells you what automatic substitution the learner will make if not corrected. For example, English speakers will often substitute /v/ for Spanish /b/ because English /b/ is fully occluded while Spanish /b/ between vowels is a voiced bilabial fricative [β].
- **Identify the phonetic distance** between the L1 approximation and the target: small adjustments (tongue 2-3mm forward), medium adjustments (changing voicing or nasality), or large adjustments (entirely new articulatory gesture with no L1 counterpart).
- **Check for allophonic variation:** Many sounds have predictable variants depending on position. Japanese /r/ is a lateral flap [ɺ] but approximates [l] near close front vowels and [d] word-initially in careful speech. Learners need to know which variant they are practicing.

### Step 3: Construct Minimal Pairs and Phonetic Contrast Sets

Minimal pairs are the primary diagnostic and training tool in pronunciation instruction. Build them carefully.

- **Select minimal pairs that isolate the exact contrast the learner needs.** If teaching the Spanish trill /r/ vs. tap /ɾ/, the pair must be "perro" [ˈpe.ro] vs. "pero" [ˈpe.ɾo] -- not two words that differ in other ways.
- **Organize pairs by word position:** initial position (the sound appears at the start of the word), medial position (middle), and final position (end). Many sounds behave differently by position. German /g/ at word-final position devoices to [k] (final obstruent devoicing), which affects which minimal pairs are useful.
- **Include near-minimal pairs** for sounds that do not contrast in word-initial or word-final position in that language. Mandarin tones require same-syllable minimal pairs: mā (妈, mother), má (麻, hemp), mǎ (马, horse), mà (骂, scold).
- **Build a graded set of 6-10 minimal pairs**, ordered from most phonetically distinct (easy to perceive) to most similar (hardest to perceive). Do not start with the hardest pair.
- **Include semantic pairs where misuse causes a real comprehension problem** or embarrassing error. This creates genuine motivation. For English learners of Japanese, confusing "hashi" (橋, bridge) with "hashi" (箸, chopsticks) due to pitch accent is a real and common error.

### Step 4: Write Articulatory Instructions

Articulatory instructions must be precise enough that a learner can physically produce the sound by following them, without a teacher present.

- **Use anatomical landmarks the learner can feel:** the alveolar ridge (the bumpy area just behind the upper front teeth), the velum (the soft part at the back of the roof of the mouth), the uvula (the dangling thing at the back of the throat), the glottis (the opening between the vocal folds).
- **Give step-by-step motor instructions:** "Start with your tongue tip touching the alveolar ridge. Release the contact while simultaneously vibrating your vocal folds." This is more actionable than "make an R sound."
- **Provide proprioceptive cues:** Things the learner can feel without hearing themselves. "Place your hand on your throat -- you should feel vibration for a voiced consonant and no vibration for a voiceless one." "Press your lips together firmly, then release with a small burst of air."
- **Provide visual cues where relevant:** lip rounding can be shown in a mirror. "Round your lips as if you were about to whistle, then say /e/. The result should be the French /y/ as in 'lune'."
- **Describe the failure mode:** Tell the learner what they will produce if they make the most common error. "If your tongue tip touches the teeth instead of the alveolar ridge, you will produce the English-style /t/ rather than the Spanish dental /t̪/."
- **Note coarticulation effects:** Sounds change based on neighboring sounds. French liaison rules, English flapping of /t/ between vowels in casual speech, and Korean consonant assimilation across syllable boundaries all affect how the "same" phoneme sounds in connected speech.

### Step 5: Design the Practice Sequence

A pronunciation practice sequence must follow the Input-Discrimination-Production hierarchy. Do not skip steps.

- **Perception first:** The learner must be able to hear the difference before they can reliably produce it. Have them listen to minimal pairs and identify which word they heard (same/different task, or Word A/Word B task). If they cannot perceive the contrast, production practice is premature.
- **Isolation production:** Have the learner produce the target sound in isolation (as a stand-alone phoneme), without any surrounding phonetic context. This eliminates coarticulation interference.
- **CV and VC syllables:** Move to consonant-vowel or vowel-consonant syllables. The vowel context matters -- some sounds are easier before back vowels, others before front vowels. Start with the easiest vowel context for this particular consonant.
- **Words (high-frequency first):** Move to whole words, beginning with those the learner already knows. Familiarity with the word reduces cognitive load and lets them focus on the phonetic target.
- **Minimal pair alternation:** Have the learner alternate between the two items in a minimal pair 5 times at a controlled pace (~1 word per 2 seconds). Then speed up to natural rate.
- **Sentence-level embedding:** Embed the target sound in 3-5 carrier sentences. Use sentences where the target word appears in different prosodic positions (sentence-initial, medial, final) because stress and intonation affect production.
- **Spontaneous use (communicative practice):** Set a task where the learner must naturally produce the sound -- describe a picture, answer a question, tell a 30-second story. Monitoring drops in spontaneous speech, which is the real diagnostic of acquisition.

### Step 6: Prescribe a Self-Assessment Protocol

Learners working alone need concrete methods to evaluate their own progress.

- **Recording and playback:** The learner must record themselves. Listening to a recording is dramatically more accurate than monitoring production in real time because motor production and perceptual monitoring compete for attention. Recommend any free voice memo app; the quality of a smartphone microphone is sufficient.
- **Blind identification test:** After producing a minimal pair (e.g., "perro" and "pero") on separate recordings, shuffle the recordings and try to identify which is which by ear. If identification accuracy is below 80% across 10 trials, return to isolation practice.
- **Native speaker check:** Where possible, send a recording to a native speaker (or use an AI voice assessment tool) and ask them to transcribe what they heard. Transcription errors reveal exactly which sounds are failing.
- **Acoustic landmarks:** For learners with access to a free spectrogram tool (Praat is the standard; it is free), identify visual targets. A proper trill /r/ shows periodically interrupted voicing bars; a French nasal vowel shows a low-frequency nasal formant; Mandarin tones show clearly different F0 contours. These give objective, visual feedback.
- **Threshold for advancement:** Do not move to a harder sound or a higher practice level until the learner achieves 80% accuracy on the self-assessment for the current level across three separate sessions. Below 80% indicates the motor pattern has not consolidated.

### Step 7: Address Prosody, Stress, and Connected Speech Rules

Individual phoneme accuracy is necessary but not sufficient for natural-sounding speech. Prosodic instruction must be included.

- **Stress patterns:** English is a stress-timed language; French is syllable-timed; Japanese uses pitch accent not stress accent. A learner must understand the rhythmic framework of their target language. Applying English stress patterns to French makes speech sound very foreign even when individual phonemes are correct.
- **Word-level stress rules:** Spanish has three possible stress positions (ultimate, penultimate, antepenultimate) with written accent marks for non-default patterns. Polish stress is penultimate. Hebrew stress is usually final. These rules are learnable and should be explicitly taught.
- **Connected speech processes:** Include rules for the target language's connected speech:
  - Liaison and enchaînement in French (linking of final consonants to initial vowels of the next word)
  - Sandhi in Mandarin (Tone 3 + Tone 3 → Tone 2 + Tone 3)
  - Vowel reduction in English (unstressed vowels reduce to schwa [ə])
  - Gemination in Japanese and Italian (long consonants that are phonemically distinct)
  - Consonant cluster simplification in fast speech across many languages
- **Sentence-level intonation:** Falling intonation for statements, rising for yes/no questions, and the specific patterns for wh-questions differ across languages. French questions often use rising intonation on the final word rather than subject-verb inversion in casual speech.

### Step 8: Deliver the Full Pronunciation Guide and Schedule Follow-Up

Assemble all components into the output format below. At the end, always provide:

- A 10-minute daily practice schedule for the next two weeks, with specific activities tied to the steps above
- A clear advancement criterion: when the learner has met the 80% accuracy threshold consistently, which sound or pattern should they target next
- A note on the relationship between this sound and others in the target language's phonological system -- so the learner understands where they are in the larger picture

---

## Output Format

```
## Pronunciation Guide: [Target Language] -- [Target Sound or Pattern]

**Learner's L1:** [Native language]
**Target Language:** [Language being learned + regional variety if relevant]
**Proficiency Level:** [A1 / A2 / B1 / B2 / C1 / C2 or approximate equivalent]
**Target Feature:** [IPA symbol or prosodic description]
**Difficulty for this L1:** [Low / Medium / High / Very High] + brief rationale
**Session Goal:** [Specific, measurable goal for this session]

---

### 1. Phonetic Profile of the Target Sound

**IPA Symbol:** [symbol]
**Sound Type:** [Consonant/Vowel/Tone/Prosodic feature]
**Classification:**
  - Place of articulation: [e.g., uvular]
  - Manner of articulation: [e.g., trill]
  - Voicing: [Voiced / Voiceless]
  - [For vowels: Height / Backness / Rounding]
  - [For tones: Contour + Chao tone letters]

**Nearest L1 Sound:** [IPA + description]
**Key Difference:** [Precise articulatory difference between L1 approximation and target]
**Automatic Substitution Error:** [What the learner will produce if they do not correct]

---

### 2. How to Produce the Sound (Step-by-Step)

1. [Preparatory position -- lips, jaw, tongue starting point]
2. [Primary articulatory gesture]
3. [Voicing/airflow instruction]
4. [Coarticulation note for most common context]
5. [What correct production feels/sounds like]
6. [What the most common error feels/sounds like -- how to distinguish]

**Proprioceptive Check:** [What the learner can feel with their hand or tongue tip to verify]
**Mirror Check:** [What correct lip/jaw position looks like, if visible]

---

### 3. Minimal Pairs Practice Set

**Contrast:** [Sound A] vs. [Sound B]

| # | Word 1 | IPA | Word 2 | IPA | Meaning Difference | Position |
|---|--------|-----|--------|-----|--------------------|----------|
| 1 | [word] | /IPA/ | [word] | /IPA/ | [meaning 1] vs. [meaning 2] | Initial |
| 2 | [word] | /IPA/ | [word] | /IPA/ | [meaning 1] vs. [meaning 2] | Medial |
| 3 | [word] | /IPA/ | [word] | /IPA/ | [meaning 1] vs. [meaning 2] | Final |
| 4 | [word] | /IPA/ | [word] | /IPA/ | [meaning 1] vs. [meaning 2] | Medial |
| 5 | [word] | /IPA/ | [word] | /IPA/ | [meaning 1] vs. [meaning 2] | Initial |
| 6 | [word] | /IPA/ | [word] | /IPA/ | [meaning 1] vs. [meaning 2] | Medial |

**High-Stakes Pair:** [The pair where confusion causes the most significant miscommunication or embarrassment -- explain why]

---

### 4. Practice Sequence (Follow in Order)

**Stage 1 -- Perception (Days 1-2)**
- [ ] Listen to minimal pairs (use text-to-speech, recordings, or native speaker) -- same/different task
- [ ] Achieve 80% correct identification before moving to Stage 2
- Estimated time: 5-10 minutes per session

**Stage 2 -- Isolation Production (Days 2-3)**
- [ ] Produce [target sound] in isolation, 10 repetitions
- [ ] Use articulatory instructions in Section 2
- [ ] Record yourself, compare to a model
- Estimated time: 5 minutes per session

**Stage 3 -- Syllable Production (Days 3-4)**
- [ ] [target sound] + /a/: [example syllable], 10x
- [ ] [target sound] + /i/: [example syllable], 10x
- [ ] [target sound] + /u/: [example syllable], 10x
- [ ] /a/ + [target sound]: [example syllable], 10x
- Estimated time: 5 minutes per session

**Stage 4 -- Word Production (Days 4-7)**
- [ ] Produce each word in the minimal pairs list, 5x each
- [ ] Alternate minimal pair words at 1 word/2 seconds
- [ ] Speed up to natural conversational rate
- Estimated time: 5-7 minutes per session

**Stage 5 -- Sentence Embedding (Days 7-10)**
Carrier sentences:
1. [Sentence 1 -- target sound appears in initial position]
2. [Sentence 2 -- target sound appears in medial position]
3. [Sentence 3 -- target sound appears multiple times]
4. [Sentence 4 -- target sound appears in a common conversational phrase]
- [ ] Read each sentence 3x at slow rate, 3x at natural rate
- Estimated time: 5 minutes per session

**Stage 6 -- Spontaneous Production (Days 10-14)**
- [ ] Describe [a relevant topic or image] for 30 seconds using words with the target sound
- [ ] Record and review -- count how many target sounds were produced correctly
- Target: 70% accuracy in spontaneous speech
- Estimated time: 3-5 minutes per session

---

### 5. Self-Assessment Protocol

**Recording Test:**
1. Record yourself saying all 6 minimal pair words
2. Wait 10 minutes (so you forget the order)
3. Listen back and transcribe -- did you produce A or B?
4. Accuracy threshold to advance: 8/10 correct across three separate sessions

**Native Speaker Check Script:**
"I'm practicing [sound description]. Could you listen to these recordings and tell me which word I'm saying each time?"
[Provide the minimal pair list so the native speaker knows the options]

**Acoustic Check (Optional -- Praat software):**
[Description of what the spectrogram should show for the correct production of this specific sound]

**Progress Log:**
| Date | Stage | Accuracy % | Notes | Next Action |
|------|-------|------------|-------|-------------|
| | | | | |
| | | | | |

---

### 6. Connected Speech and Prosody Notes

**In Fast Speech:** [How this sound changes in connected speech for this language]
**Positional Variants (Allophones):** [If the sound has predictable variants by position]
**Stress Interaction:** [How word or sentence stress affects this sound]
**Key Connected Speech Rule:** [The most important rule the learner must know for natural speech]

---

### 7. Common Errors and Corrections

| Error | What It Sounds Like | Root Cause | Correction |
|-------|---------------------|------------|------------|
| [Error 1] | [Description] | [L1 interference / articulatory habit] | [Specific fix] |
| [Error 2] | [Description] | [L1 interference / articulatory habit] | [Specific fix] |
| [Error 3] | [Description] | [L1 interference / articulatory habit] | [Specific fix] |

---

### 8. Daily Practice Schedule (10 Minutes)

| Minute | Activity | Target |
|--------|----------|--------|
| 0-2 | Warm-up: [tongue twisters or warm-up exercise specific to this language/sound] | Loosen articulators |
| 2-5 | Current stage from Section 4 | Accuracy on target sound |
| 5-8 | Minimal pairs alternation at natural rate | Fluency + accuracy |
| 8-9 | Carrier sentences from Stage 5 | Connected speech |
| 9-10 | Record one sentence, listen back | Self-monitoring |

---

### 9. Advancement Criteria and Next Targets

**Advance from this sound when:**
- [ ] 80% accuracy on minimal pairs self-test across 3 sessions
- [ ] 70% accuracy in spontaneous speech over 30-second sample
- [ ] Native speaker check confirms correct identification 4/5 times

**Next recommended target sound:** [Phoneme description -- IPA -- reason it should come next in the learner's trajectory]

**Relationship to target language phonology:** [Where this sound sits in the overall phonological inventory -- what it contrasts with, what it enables]
```

---

## Rules

1. **Always use IPA.** Every sound must be represented with its International Phonetic Alphabet symbol. Descriptions like "the 'r' in French" are ambiguous -- there are regional variants. IPA symbols are unambiguous.

2. **Never skip the perception stage.** Learners cannot produce a sound they cannot perceive. If you move straight to production, the learner will produce their L1 approximation confidently and incorrectly. The perception stage (same/different identification with minimal pairs) must always come first.

3. **The 80% threshold is not negotiable.** Research in phonological acquisition (particularly from Flege's Speech Learning Model and Best's Perceptual Assimilation Model) shows that below 80% accuracy, the motor pattern has not consolidated and further progression builds on an unstable foundation. State this threshold explicitly and enforce it.

4. **Articulatory instructions must be specific enough to be followed alone.** Do not say "try to make the sound more French." Say "place the back of your tongue against the uvula, create a narrow constriction, and let air pass through while vibrating your vocal folds." The learner may have no access to a teacher or native speaker.

5. **Always address the learner's L1 interference pattern explicitly.** The most predictable and persistent errors in L2 pronunciation come from applying L1 phonological rules to the L2. Identify the specific substitution the learner is most likely making and give the targeted fix -- do not address generic errors.

6. **Minimal pairs must be real words in the target language, not invented examples.** Pairs like "bat/pat" work; invented pairs with nonsense words do not give learners vocabulary benefit and may mislead about what is phonologically possible in the language.

7. **Include both perception and production practice in every session.** Even advanced learners who are working on production have perception that can drift. A brief same/different perception task at the start of each session recalibrates the internal target before production begins.

8. **Prosody must be addressed alongside segmental phonemes.** A learner who produces every phoneme correctly but applies the wrong stress pattern or intonation contour will still be marked as non-native and may be misunderstood. At minimum, include one note about the prosodic context of the target sound.

9. **Do not use orthography as a phonetic guide.** English spelling is deeply unreliable; Spanish and Italian are more reliable but still have exceptions; French spelling is highly misleading for English speakers. Always provide IPA alongside the written form and never allow the spelling to substitute for phonetic description.

10. **Difficulty ratings must account for the learner's specific L1, not a generic "difficulty" rating.** The French /y/ (as in "lune") is very easy for German speakers (who have the same sound as /yː/) and very difficult for English speakers (who have no rounded front vowels). Always specify "difficult for [L1] speakers" rather than "difficult."

11. **Tone languages require a separate prosodic instruction track.** For Mandarin, Cantonese, Vietnamese, Thai, or Yoruba, tones are phonemic -- they change word meaning, not just nuance. Tone instruction must include: the pitch contour in Chao letters, the F0 targets if possible, sandhi rules that change tones in context, and perception-before-production sequencing specifically for tonal contrasts. Do not treat tones as a footnote to segmental phoneme instruction.

12. **Self-assessment must include a blind playback test.** Learners who listen to themselves immediately after speaking use their memory of what they intended to say to fill in what they actually produced. A time delay (minimum 10 minutes) before playback significantly improves self-assessment accuracy.

---

## Edge Cases

### The learner reports "I just can't hear the difference at all"

This is a genuine perceptual difficulty, not a motivation problem. When a sound contrast does not exist in the learner's L1, the brain has literally not built the perceptual category to detect it. Japanese speakers genuinely cannot initially hear the difference between English /r/ and /l/ because Japanese has one phoneme (a lateral flap /ɺ/) that covers both.

**Handling:** Step back from minimal pairs and use a High Variability Phonetic Training (HVPT) approach: present the same phonetic contrast produced by many different speakers, at many different speaking rates, with many different vowel contexts. Variability is essential -- if the learner only hears one voice producing the contrast, they learn speaker-specific acoustic properties, not the abstract phoneme. Use text-to-speech tools set to different voices, or recordings from multiple native speakers. Research shows HVPT can produce measurable perceptual learning within 2-4 hours of training.

### The learner has fossilized errors from years of incorrect pronunciation

Fossilization occurs when a learner has produced an incorrect form so many times that it has become automatized. The incorrect production feels natural and correct to them; the correct production feels strange and artificial.

**Handling:** Fossilized errors require more time, more repetition, and explicit attention management. Increase the perception training phase significantly -- the learner must rebuild the perceptual target before motor retraining can begin. Use exaggerated production (hyperarticulation): instruct the learner to produce the correct form with 150% of the normal articulatory gesture. This breaks the automatic motor program and forces conscious engagement. Importantly, warn the learner that the correct form will feel "wrong" for several weeks -- this is neurologically expected and is not a sign of failure. Set a longer timeline (4-6 weeks per sound rather than 2).

### The target language has significant regional accent variation

Many learners ask to learn "Spanish" or "French" without specifying which variety, but the differences can be substantial: Castilian Spanish has the distinction between /θ/ and /s/ (ceceo), while most Latin American varieties do not; Parisian French has uvular /ʁ/ while some southern French and Québécois varieties retain an alveolar trill; standard Mandarin (Putonghua) has retroflex initials (zh, ch, sh, r) that many southern Chinese dialects collapse.

**Handling:** Before producing pronunciation instruction, clarify which regional variety the learner is targeting and why (travel destination, heritage, formal study, professional context). State explicitly in the output which variety the instruction applies to. For sounds that vary regionally (e.g., the /s/ vs. /θ/ contrast in Spanish), present both options and explain the geographic distribution so the learner can make an informed choice.

### The learner is working on a tone language with no experience of tonal systems

English speakers, Spanish speakers, and speakers of most European languages have no experience using pitch to distinguish word meaning (rather than sentence-level intonation). The concept of a "tone" meaning something grammatically, independently of context, is cognitively unfamiliar.

**Handling:** Begin with a conceptual explanation before any practice: use a minimal tone set (Mandarin's four tones) with the same syllable, demonstrate that the pitch pattern changes the meaning entirely, and contrast this with how English uses pitch for sentence intonation (which does not change word meaning). Use piano keys or hand gestures to visualize pitch contour. Then run perception before production. The Mandarin Tone 3 (a dipping tone, contour 214 in Chao notation) is the hardest to produce -- it rarely reaches the full low dip in natural speech and in practice sounds like a low tone before most other tones. Address this sandhi rule explicitly from the start.

### The learner is a heritage speaker with exposure to the language since childhood but inconsistent phonological accuracy

Heritage speakers occupy an unusual position: their perception is often native-like (they grew up hearing the language), but their production may be attrited or mixed with L1 phonology, especially if the heritage language was less dominant in their environment. They often feel embarrassed about perceived errors and may underestimate their actual proficiency.

**Handling:** Begin with a diagnostic perception task rather than assuming the learner needs full perception training -- heritage speakers often pass perception at high rates. Focus on production accuracy and connected speech rules, particularly any phonological rules that differ between the heritage language and the dominant environmental language. Validate the learner's existing knowledge explicitly. Do not frame their variety as "incorrect" -- many heritage speaker features reflect genuine dialectal variation. Focus on the specific contexts where their production diverges from the target variety.

### The learner wants to work on English phonology but English is a highly unusual instructional case

English has an exceptionally large vowel inventory (14-20 vowels depending on dialect), an extremely unreliable spelling system, and massive dialectal variation across British Englishes, American Englishes, Australian English, and World Englishes. There is no universally "correct" English accent.

**Handling:** Specify the target variety at the outset (General American, Received Pronunciation, General Australian, etc.). For the vowel system, use a vowel quadrilateral chart to show the full inventory and mark where the learner's L1 vowels fall -- this makes visible which distinctions the learner will struggle to perceive and produce. Give special attention to English's notoriously non-phonetic orthography: the letters "ea" can be /iː/ (beat), /ɛ/ (bread), /eɪ/ (great), or /ɪə/ (idea) -- the spelling provides almost no guidance and learners must memorize phonetic forms alongside written forms.

### The learner is preparing for a specific oral proficiency test

IELTS, DELF/DALF, HSK Speaking, TOPIK Speaking, JLPT (which does not have a speaking component), and similar exams have specific rubrics with pronunciation sub-scores.

**Handling:** Identify the specific exam's pronunciation rubric. IELTS Speaking assesses phonological control on a scale that weights: range of phonological features used, their consistent and precise use, and intelligibility. Prioritize the sounds that most impair intelligibility for the target language's listeners first. In the final week before an exam, shift from minimal pair drills to extended spontaneous speech with self-recording, since the exam will require sustained production, not controlled syllable drilling.

---

## Example

**Input:**
"I'm an English speaker learning Spanish at B1 level. I keep mixing up the single R and the double RR. Spaniards always know I'm not a native speaker when I say words with R. Can you help?"

---

**Output:**

## Pronunciation Guide: Spanish -- Single Tap /ɾ/ vs. Trill /r/

**Learner's L1:** English (General American)
**Target Language:** Spanish (Standard European / Latin American -- this contrast exists in both)
**Proficiency Level:** B1
**Target Feature:** /ɾ/ (alveolar tap) vs. /r/ (alveolar trill)
**Difficulty for English speakers:** High -- English has neither sound as a phoneme. American English /r/ is a retroflex approximant [ɹ] with a very different tongue position.
**Session Goal:** Produce the tap /ɾ/ reliably in medial position and produce the trill /r/ in at least syllable onset position by end of two-week practice cycle.

---

### 1. Phonetic Profile of the Target Sounds

**Target Sound A -- The Tap:**
**IPA Symbol:** /ɾ/
**Sound Type:** Consonant
**Classification:**
  - Place of articulation: Alveolar (tongue tip hits the alveolar ridge -- the bumpy area just behind the upper front teeth)
  - Manner of articulation: Tap/flap (a single very brief contact, lasting about 20-30 milliseconds)
  - Voicing: Voiced

**Nearest L1 Sound:** The American English "flap T" in "butter" [ˈbʌɾɚ] or "water" [ˈwɔɾɚ]. These are produced with the same gesture. The Spanish /ɾ/ and the American English flap T are essentially identical articulations.
**Key Difference:** In English, the flap only occurs in unstressed intervocalic position. In Spanish, /ɾ/ is a full phoneme that can appear in any context.
**Automatic Substitution Error:** English speakers use their retroflex approximant [ɹ] -- the tongue curls back (retroflexion) instead of flicking forward to tap the alveolar ridge.

---

**Target Sound B -- The Trill:**
**IPA Symbol:** /r/
**Sound Type:** Consonant
**Classification:**
  - Place of articulation: Alveolar
  - Manner of articulation: Trill (the tongue tip vibrates against the alveolar ridge, typically 2-4 contacts at natural speech rate)
  - Voicing: Voiced

**Nearest L1 Sound:** None in English. Some speakers produce a very brief trill when saying "three" rapidly, but this is not systematic.
**Key Difference:** Requires the tongue tip to be loose and flexible enough to vibrate passively in the airstream -- a different biomechanical action from any English consonant.
**Automatic Substitution Error:** English speakers either use [ɹ] or produce a uvular trill [ʀ] (the French/German R), which they may have encountered in language study.

---

### 2. How to Produce the Sounds (Step-by-Step)

**Producing the Tap /ɾ/:**
1. Start with your tongue tip resting behind your lower front teeth (neutral English position)
2. Bring the tongue tip up to touch the alveolar ridge -- the firm, bumpy area you can feel with the tongue tip about 5mm behind the upper front teeth
3. In a single brief motion, let the tongue tip bounce off the ridge -- do not hold contact (that would make a /d/ or /t/)
4. Maintain voicing (vocal fold vibration) throughout
5. You have already done this in English: say "butter" quickly -- the middle sound between the two vowels is the Spanish /ɾ/
6. **Proprioceptive check:** The contact is so brief it should feel like the tongue "bounces." If you can feel sustained contact, you are producing a stop, not a tap.

**Producing the Trill /r/:**
1. Place your tongue tip lightly against the alveolar ridge -- lighter contact than for /d/. The key word is "light" -- the tongue must be able to move.
2. Relax the tongue body completely. Tension in the tongue body prevents the tip from vibrating freely.
3. Build up air pressure behind the tongue (as if you were about to say a /d/) and then release a steady stream of air
4. The tongue tip should flutter against the ridge with the airstream -- 2 to 5 contacts at natural speech rate
5. Do not try to "roll" the tongue voluntarily. The vibration should be passive -- caused by the airstream, not by muscular movement.
6. **Practice entry point:** Many English speakers find it easier to start from a /d/ and gradually reduce the tongue contact until it begins to flutter. Say "ddddd" rapidly and reduce pressure on the ridge.
7. **Alternative entry:** Some learners find it easier to start with a voiced bilabial trill (blowing air through relaxed lips, like a motorboat sound) to understand the principle of passive vibration, then transfer the concept to the tongue tip.

**Proprioceptive check for trill:** Place your finger against the outside of your upper lip -- you should feel slight airflow vibrations from the tongue's movement. If you feel sustained steady airflow with no pulsing, the tongue is not trilling.

---

### 3. Minimal Pairs Practice Set

**Contrast:** /ɾ/ (single tap) vs. /r/ (trill)

| # | Word 1 | IPA | Word 2 | IPA | Meaning Difference | Position |
|---|--------|-----|--------|-----|--------------------|----------|
| 1 | pero | /ˈpe.ɾo/ | perro | /ˈpe.ro/ | but / dog | Medial |
| 2 | caro | /ˈka.ɾo/ | carro | /ˈka.ro/ | expensive / car (Lat. Am.) | Medial |
| 3 | cero | /ˈθe.ɾo/ | cerro | /ˈθe.ro/ | zero / hill | Medial |
| 4 | para | /ˈpa.ɾa/ | parra | /ˈpa.ra/ | for (preposition) / grapevine | Medial |
| 5 | moro | /ˈmo.ɾo/ | morro | /ˈmo.ro/ | Moor / headland/snout | Medial |
| 6 | vara | /ˈba.ɾa/ | barra | /ˈba.ra/ | rod/stick / bar | Medial |

**Note:** The tap vs. trill contrast only occurs intervocalically (between vowels). In word-initial position, all written "r" represents the trill /r/ (e.g., "rojo" /ˈro.xo/, not /ˈɾo.xo/). After the consonants /l/, /n/, and /s/, written single "r" is also pronounced as the trill /r/ (e.g., "alrededor" /al.re.ðe.ˈðoɾ/, "Enrique" /en.ˈri.ke/).

**High-Stakes Pair:** "pero" (but) vs. "perro" (dog). This is the pair that most commonly causes confusion in real conversation. "Pero" appears constantly in conversational Spanish; producing it as "perro" results in sentences like "I want a dog, I'm happy" instead of "I want it but I'm happy."

---

### 4. Practice Sequence

**Stage 1 -- Perception (Days 1-2)**
- [ ] Listen to "pero" / "perro" pairs (use a text-to-speech tool set to Spanish, or a recording of a native speaker) -- identify which word you heard
- [ ] Work through all 6 pairs from the table above, same/different task
- [ ] The tap is shorter; the trill has a "rolling" quality with multiple contacts
- [ ] Achieve 80% correct identification (8/10 trials) before moving to Stage 2
- Estimated time: 5-10 minutes per session

**Stage 2 -- Isolation and English Bridge (Days 2-3)**
- [ ] Say "butter" rapidly 10 times in American English. Find the middle sound. That is the tap /ɾ/.
- [ ] Now produce the tap sound in isolation: just the "bounce" without surrounding vowels, 10 times
- [ ] For the trill: try the "ddddd" reduction technique described above, 5-minute session
- [ ] Record yourself and compare
- Estimated time: 5 minutes per session for each sound

**Stage 3 -- Syllable Production (Days 3-4)**
- [ ] Tap syllables: /ɾa/ (ra-ra-ra), /ɾe/ (re-re-re), /ɾo/ (ro-ro-ro), 10x each
- [ ] Trill syllables (once you have isolated the trill): /ra/, /re/, /ro/ with the full trill, 10x each
- [ ] Practice the vowel-tap-vowel sequence: /a.ɾa/, /e.ɾe/, /o.ɾo/, 10x each -- this mirrors the intervocalic context where the tap appears in Spanish
- Estimated time: 5 minutes per session

**Stage 4 -- Word Production (Days 4-7)**
- [ ] Produce each word from the minimal pairs table, 5x each
- [ ] Alternate minimal pairs: "pero -- perro -- pero -- perro" at 1 word per 2 seconds
- [ ] Speed up to natural rate once accuracy reaches 70%
- Estimated time: 5-7 minutes per session

**Stage 5 -- Sentence Embedding (Days 7-10)**

Carrier sentences:
1. "Pero no quiero ir." (/ˈpe.ɾo no ˈkje.ɾo ˈiɾ/) -- But I don't want to go. [tap in initial position of word, which follows the rule that after a pause it is still a tap since "pero" begins with /p/, not /r/]
2. "El perro corre por el parque." (/el ˈpe.ro ˈko.re poɾ el ˈpaɾ.ke/) -- The dog runs through the park. [trill in "perro", tap in "corre" medial /r/, tap in "por" and "parque"]
3. "Quiero una cerveza fría, pero cara." -- I want a cold beer, but an expensive one. [taps throughout]
4. "El río corre rápido." (/el ˈri.o ˈko.re ˈra.pi.ðo/) -- The river runs fast. [trill in word-initial "río" and "rápido", tap in medial "corre"]

- [ ] Read each sentence 3x at slow rate (1 word per second), 3x at natural rate
- [ ] Identify every /r/ or /ɾ/ in each sentence before reading -- mark which type each should be
- Estimated time: 5 minutes per session

**Stage 6 -- Spontaneous Production (Days 10-14)**
- [ ] Describe your morning routine for 30 seconds in Spanish. Count how many tap and trill contexts occur and how many you produced correctly.
- [ ] Target: 70% accuracy in spontaneous speech
- Estimated time: 3-5 minutes per session

---

### 5. Self-Assessment Protocol

**Recording Test:**
1. Record yourself saying all 6 minimal pair words in random order
2. Wait 15 minutes, then listen back
3. Write down which word you think you said each time
4. Cross-check with the original order
5. Threshold to advance: 8/10 correct across three separate sessions on different days

**Native Speaker Check Script:**
"Estoy practicando la diferencia entre 'r' y 'rr' en español. ¿Puedes escuchar estas palabras y decirme cuál digo?" [I'm practicing the difference between 'r' and 'rr' in Spanish. Can you listen to these words and tell me which one I'm saying?]
Provide the minimal pairs list so the native speaker knows to choose between "pero" and "perro," etc.

**Acoustic Check (Optional -- Praat software):**
Open the recording in Praat and examine the waveform. The tap /ɾ/ will show a single brief period of reduced amplitude (the tongue contact), lasting approximately 20-30 milliseconds. The trill /r/ will show 2-5 periodic amplitude dips in rapid succession (each trill contact), with the entire sequence lasting 60-100 milliseconds in natural speech. If your "perro" waveform looks identical to your "pero" waveform in the R region, the contrast has not been produced.

**Progress Log:**
| Date | Stage | Sound | Accuracy % | Notes | Next Action |
|------|-------|-------|------------|-------|-------------|
| | Stage 1 | /ɾ/ perception | | | |
| | Stage 4 | /ɾ/ production | | | |
| | Stage 4 | /r/ production | | | |
| | Stage 6 | Spontaneous | | | |

---

### 6. Connected Speech and Prosody Notes

**Position Rules (Critical for Spanish R):**
- Written single "r" at the START of a word = trill /r/ always: "rojo, río, ropa"
- Written single "r" BETWEEN vowels = tap /ɾ/ always: "caro, pero, foro"
- Written single "r" after /l/, /n/, /s/ = trill /r/: "alrededor, Enrique, Israel"
- Written double "rr" = always trill /r/, only appears between vowels in spelling
- Written single "r" at END of a syllable before a consonant = tap /ɾ/: "carta, corte, parte"

**In Fast Speech:** The trill may reduce to a tap or even an approximant in casual speech among native speakers. This is normal, but as a learner, produce the full trill in careful speech until it is automatic. You can acquire the casual reduction later.

**Stress Interaction:** Spanish has no vowel reduction (unlike English). Every vowel in Spanish, whether stressed or unstressed, retains its full quality. This means the vowels surrounding your /r/ sounds should be clear and consistent -- do not reduce them to schwa as English speakers habitually do.

---

### 7. Common Errors and Corrections

| Error | What It Sounds Like | Root Cause | Correction |
|-------|---------------------|------------|------------|
| Using English [ɹ] for both | Both "pero" and "perro" sound like English "pray-ro" | Retroflex approximant substitution -- L1 automatism | Active alveolar tap exercise using "butter" bridge. Never allow the tongue to curl back. |
| Producing a uvular trill [ʀ] | Sounds French or German, throat-clearing quality | Transfer from other L2 study (French/German) | Redirect tongue placement -- tip must contact the FRONT of the palate (alveolar ridge), not the back (uvula). |
| Producing a stop [d] or [t] instead of tap | "Pero" sounds like "pe-do" or "pe-to" | Too much tongue pressure on the ridge | Reduce contact pressure until the tongue "bounces" rather than stopping |
| Producing the trill for ALL R sounds | Hyper-correction -- all R sounds become trilled | Overcorrection after learning the trill exists | Review the position rules: intervocalic single R = always tap. Use the minimal pairs to re-establish the contrast. |
| Failing to trill in word-initial position | "Rojo" sounds like "pero" with the wrong R | Not applying the position rule | Memorize: "If the word starts with R, it is always the trill." Practice 10 word-initial R words daily. |

---

### 8. Daily Practice Schedule (10 Minutes)

| Minute | Activity | Target |
|--------|----------|--------|
| 0-1 | Warm-up: say "butter-butter-butter" 10x quickly to activate the alveolar tap, then do the "ddddd" reduction technique 10x to activate the trill potential | Articulatory readiness |
| 1-4 | Current stage from Section 4 (whichever stage you are in) | Accuracy on /ɾ/ and /r/
