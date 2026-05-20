---
name: vocabulary-building
description: |
  Creates vocabulary acquisition plans with word selection, study methods, and spaced repetition review schedules for language learners. Produces a structured vocabulary building program with practice exercises -- not a word list.
  Use when a learner asks to build vocabulary in a language, create a vocabulary study plan, learn new words systematically, or improve word retention.
  Do NOT use for grammar instruction (use `grammar-practice`), for conversation practice (use `conversation-practice`), or for general flashcard creation (use `flashcard-generation`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "language-learning spaced-repetition study-skills step-by-step"
  category: "education"
  subcategory: "language-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Vocabulary Building

## When to Use

Use this skill when a learner explicitly wants to grow their word knowledge in a specific language in a systematic, retention-focused way. Specific trigger scenarios include:

- A learner asks to build vocabulary in a foreign language (e.g., "I want to learn 500 Spanish words before my trip in two months")
- A learner asks for a structured vocabulary study plan with a timeline and review schedule
- A learner wants to improve word retention after failing to hold onto words they have previously studied
- A learner is preparing for a vocabulary-heavy exam such as JLPT N3, HSK 4, DELF B2, or IELTS and needs a targeted acquisition plan
- A learner wants to move from passive recognition vocabulary (can understand a word when seen) to active production vocabulary (can use the word in speech and writing)
- A learner is studying academic or professional vocabulary (medical terminology, legal English, business Spanish) and needs a domain-specific word acquisition plan
- A learner reports frustration with flashcard apps -- they know words in isolation but cannot use them in context

**Do NOT use when:**

- The learner's primary need is grammar instruction -- grammatical structures, conjugation paradigms, or syntax patterns should use the `grammar-practice` skill instead
- The learner wants to practice speaking or conversational fluency -- route to `conversation-practice`, which handles real-time communicative output
- The learner simply wants a list of flashcards exported to an app -- route to `flashcard-generation` for bulk card creation without the full acquisition methodology
- The learner is a teacher creating a vocabulary curriculum for a class -- this skill addresses individual learner plans, not classroom material design
- The learner needs reading comprehension strategies around unknown words encountered in a text -- route to `reading-comprehension` which handles inference and context strategies
- The learner is asking about etymology or linguistic history with no stated retention goal -- this is informational, not instructional
- The learner's vocabulary goal is native-language academic writing (essay vocabulary, rhetoric) -- that falls under `academic-writing` skill

---

## Process

### Step 1: Diagnose the Learner's Vocabulary Profile

Before building any plan, establish the four coordinates that govern every decision: language, level, goal, and available time.

- **Language pair:** Identify the target language (L2) and the learner's native or strongest language (L1). Linguistic distance matters enormously -- an English speaker learning Dutch will acquire vocabulary ~3x faster than one learning Mandarin or Arabic, and the plan must reflect this.
- **Current vocabulary size:** Ask or estimate. A true beginner has 0-300 words. A false beginner returning to a language has 300-800. A lower-intermediate learner (A2-B1) has 800-2,500. Upper-intermediate (B1-B2) has 2,500-5,000. Advanced (C1) has 5,000-10,000 receptive words.
- **Goal specificity:** Distinguish between vague goals ("get better at Spanish") and measurable goals ("pass JLPT N3 in 8 months," "hold a basic conversation about my job"). Restate vague goals as measurable ones before proceeding.
- **Daily time budget:** This is the single biggest constraint. A learner with 10 minutes/day can realistically acquire 3-5 new words; one with 30 minutes can handle 8-12; one with 60 minutes can push 15-20. Never recommend a word-per-day rate the learner cannot sustain.
- **Access to target language input:** A learner who reads, watches, or listens to L2 content daily will encounter words naturally and reinforce them passively. A learner with no L2 exposure outside study sessions needs more structured review cycles.
- **Learning style and tool preference:** Some learners thrive with digital SRS apps (Anki, custom decks); others prefer physical index cards or Leitner boxes; others prefer notebook-based systems. Match the plan to what the learner will actually use.

---

### Step 2: Select the Right Vocabulary Tier and Word Set

Word selection is the highest-leverage decision in any vocabulary plan. Teaching the wrong words first is the most common failure mode.

- **Apply the frequency principle first.** In virtually every natural language, the top 1,000 most frequent words cover roughly 85-87% of spoken and everyday written text. The top 2,000 words cover roughly 90-92%. The top 5,000 cover 95-96%. A learner who masters the first 2,000 frequency-ranked words has unlocked the ability to understand most of what they encounter.
- **Frequency threshold by goal:**
  - Survival travel (can manage basic transactions and directions): top 300-500 words
  - Basic conversation (A2): top 500-1,000 words
  - Independent reading of simple texts (B1): top 2,000-3,000 words
  - Professional or academic use (B2-C1): top 4,000-8,000 words, weighted toward domain-specific sublists
  - Near-native reading fluency: 8,000-15,000+ words (multi-year project)
- **Use a recognized frequency list as a backbone.** For general vocabulary: use the language's established frequency corpus (e.g., Frequency Dictionary series for Spanish, French, German, Italian, Russian; JACET 8000 for Japanese academic English; NGSL for general English; HSK vocabulary lists for Mandarin; JLPT vocabulary lists for Japanese). Do not invent a frequency ranking -- use authoritative sources.
- **Layer domain-specific vocabulary on top of the frequency foundation.** A medical student learning Spanish should master the top 1,500 general frequency words AND the 300-500 most common medical Spanish terms. Never front-load domain vocabulary before general high-frequency vocabulary, or the learner will know "myocardial infarction" but not "because" or "but."
- **Apply the Known-Unknown Gap test.** For a learner providing a sample text they want to read, estimate what percentage of words they do not know. If more than 5-8% of running words are unknown, the text is too difficult for pleasurable reading and the vocabulary gap needs to be closed first.

---

### Step 3: Build the Word Card System

A vocabulary plan is only as strong as the encoding quality of each word. Shallow encoding (word → translation only) produces fragile, context-free knowledge that fades rapidly.

- **Require multi-layer word cards.** Every word card must include at minimum: (1) the target word in its most common citation form, (2) phonetic pronunciation or IPA, (3) part of speech and key inflections, (4) one authentic example sentence (not an invented textbook example), (5) the L1 translation as a last resort -- not the primary hook, (6) at least one collocate (a word it commonly appears with), and (7) a mnemonic image or sound-alike bridge.
- **Canonical Word Card Format:**

```
FRONT: [Target word]  [Pronunciation guide or IPA]
       [Part of speech, gender if applicable]

BACK:
 Core meaning: [L1 translation -- concise, not dictionary dump]
 Example:      [Authentic sentence using the word naturally]
 Collocates:   [2-3 common partners: verb + noun, adj + noun, etc.]
 Word family:  [Noun / verb / adjective / adverb forms]
 Mnemonic:     [Sound-alike, visual image, or story link]
 Register:     [Formal / informal / neutral / colloquial / written only]
```

- **Authentic example sentences outperform invented ones.** Pull sentences from real sources -- news articles, novels, film subtitles, song lyrics, or learner corpora. A word encountered in a real emotional or narrative context is retained far better than "The dog is in the garden."
- **Prioritize collocations.** The word "make" in English is trivial, but "make a decision," "make progress," and "make sense" are the real units of meaning. Teach words in their most common partnerships from the beginning.
- **Group words thematically for initial learning, then shuffle for retrieval practice.** Learning 10 words in a semantic cluster (e.g., kitchen vocabulary) aids initial encoding. But review must shuffle categories -- blocked practice produces an illusion of mastery that disappears under interleaved testing.

---

### Step 4: Design the Spaced Repetition Schedule

Spaced repetition (SR) is the most empirically validated technique in cognitive psychology for long-term vocabulary retention. The Ebbinghaus forgetting curve shows that without review, 50-80% of new information is lost within 24 hours and up to 90% within a week. SR exploits the spacing effect: reviewing information at the moment just before it would be forgotten produces maximal memory consolidation.

- **The core SR timing intervals for new vocabulary:**
  - First review: 1 day after initial study (within 24 hours)
  - Second review: 3 days after first review
  - Third review: 1 week after second review
  - Fourth review: 2 weeks after third review
  - Fifth review: 1 month after fourth review
  - Sixth review: 3 months (word is now in long-term memory for most learners)
  - Maintenance: twice-yearly review keeps it stable indefinitely

- **The Leitner Box System (physical, no app required):**
  - Box 1 (Daily): New words and failed words -- review every study session
  - Box 2 (Every 2 days): Words answered correctly once
  - Box 3 (Every week): Words answered correctly from Box 2
  - Box 4 (Every 2 weeks): Words answered correctly from Box 3
  - Box 5 (Monthly): Words answered correctly from Box 4 -- these are "known"
  - Rule: Correct answer → move one box forward. Wrong answer → return to Box 1. Never move a card forward just because you "kind of" knew it -- demand full, unprompted recall.

- **Digital SRS systems** automate interval calculation. Anki uses a SuperMemo-2 algorithm: each card has an ease factor (starts at 2.5, meaning each interval is 2.5x the previous). A learner who consistently rates cards "good" will see intervals grow rapidly. A learner who keeps rating "again" will see cards loop in short intervals -- a signal the mnemonic or example needs to be improved, not just reviewed more.

- **Daily new card ceiling:** Research on SRS load shows that more than 15-20 new cards/day creates a review debt that accumulates faster than most learners can sustain. If a learner adds 20 cards/day for 30 days, they will face 100-200+ daily reviews within a month. Recommend 5-10 new cards/day for sustainable programs; allow 15-20 only if the learner has 45+ minutes daily.

- **Session structure -- the 70/30 rule:** 70% of each vocabulary session should be reviewing previously learned words (the existing deck); 30% should be learning new words. Flipping this ratio feels productive but produces poor retention because review consolidates more learning per minute than initial encoding.

---

### Step 5: Incorporate Active Production Practice

Recognition (knowing a word when you see it) is necessary but insufficient. Production (generating the word from meaning) requires a separate, more demanding training protocol. Many learners plateau at passive vocabulary because they never practice active retrieval.

- **Distinguish receptive from productive practice.** Receptive tasks: seeing the word, choosing the correct meaning, identifying it in a sentence. Productive tasks: seeing the meaning, producing the word in the target language; filling in blanks in sentences; writing original sentences using the word.
- **The Keyword Method for production:** Start with the target word's sound. Find a vivid L1 word or phrase with a similar sound (the keyword). Create a mental image linking the keyword to the word's meaning. When you need to produce the word, the image retrieves the sound. Example: Japanese "kawaii" (cute) -- sounds like "cry" -- imagine something so cute it makes you cry. When you want to say "cute," the image surfaces "kawaii."
- **Sentence writing quota:** Every newly learned word should be used in at least two original sentences by the end of week 1. Sentences must be personally meaningful -- about the learner's own life, opinions, or experiences -- because personal relevance dramatically increases retention (self-reference effect).
- **Contextual cycling:** After a word has been in the deck for two weeks, the learner should try to use it in a real communicative context -- in speaking practice, in a written journal entry, or in a message to a language partner. Words used in real communication "upgrade" from studied vocabulary to functional vocabulary.
- **Output-to-input ratio:** For every hour of vocabulary study, recommend at least 20-30 minutes of L2 input (reading, listening) where studied words will likely reappear. Natural encounters with studied words outside the study session are the most powerful consolidation events.

---

### Step 6: Set Measurable Milestones and Tracking Mechanisms

Vocabulary acquisition without measurement is invisible. Learners who track progress stay motivated and can diagnose problems early.

- **Words-per-week rate.** Calculate the sustainable pace: (daily time in minutes ÷ 3) = approximate new words per day. Multiply by 7 for weekly rate. Multiply by weeks remaining to project total vocabulary gain.
- **Vocabulary size tests.** Several validated vocabulary size tools exist. A simple self-test: take a sample of 100 words from a frequency list outside the range the learner has studied. For each word, mark: (K) known well enough to use, (R) recognize but cannot produce, (U) unknown. This gives a rough receptive/productive split and locates the frontier.
- **Weekly review audit.** At the end of each week, count: (1) total cards reviewed, (2) percentage correct (aim for 85-90% -- below 80% means too many new cards are being added too fast; above 95% means the learner should increase the new card rate), (3) words that keep failing (these need mnemonic redesign, not more repetition).
- **Fluency checkpoint at 4 weeks.** Have the learner read a text or watch a video at their target level and tally unknown words per page or per minute. Compare to their baseline. A 20-30% reduction in unknown words per page at 4 weeks indicates the plan is working.
- **Adjust the plan dynamically.** If retention rate drops below 80%, reduce new cards by 30% and increase review time. If retention stays above 95% and the learner feels unchallenged, increase new cards by 20% and add a productive practice challenge.

---

### Step 7: Apply Mnemonic Acceleration Techniques

Raw repetition produces slower acquisition than repetition combined with deliberate encoding strategies. The following techniques have the strongest empirical support for vocabulary retention.

- **Sound-alike (Keyword Method):** Described in Step 5. Works best for phonologically similar L1-L2 pairs. Weakest for tonal languages where tone is part of meaning, because the sound-alike may carry the wrong tone -- explicitly note correct tone in the mnemonic.
- **Visual mnemonics (method of loci / memory palace):** Place vocabulary words in imagined locations in a familiar space (home, school, commute route). When reviewing, mentally walk through the space. Particularly powerful for themed vocabulary sets (a kitchen vocabulary set placed in an imagined kitchen).
- **Story chaining:** Link 5-7 new words in a single absurd short narrative. The absurdity and narrative structure both enhance recall. Effective for thematic clusters studied together.
- **Cognate mapping (for related languages):** Systematically map spelling/sound change rules between related languages. English and Spanish share thousands of cognates following predictable patterns (-tion → -ción, -ty → -dad, -ous → -oso). Teaching these patterns unlocks hundreds of words at once. Document the pattern + 5 examples, then have the learner predict new cognates.
- **Morpheme decomposition:** Teach high-frequency prefixes, suffixes, and roots. In English, knowing 20 Greek and Latin roots unlocks 1,000+ academic words. In German, knowing compound noun structure unlocks thousands of new words from known parts (Hand + Schuh = Handschuh = glove). Prioritize morpheme study for academic and advanced learners.
- **Emotional anchoring:** Connect a word to a specific strong memory, emotion, or personal experience. "Angst" in German -- remember a specific moment of anxiety, make the word its label. Emotionally tagged words show dramatically superior long-term retention.

---

### Step 8: Integrate the Plan and Deliver the Final Output

Assemble all decisions into a single, immediately actionable program document.

- The output must specify: language, level, goal, timeline, word count target, daily time budget, daily new word rate, SR system choice, word card template, weekly schedule, milestone check dates, and mnemonic strategy recommendations.
- Include a starter word list -- the first 30 words to study in priority order, with full word card content completed, not blank.
- Include the Week 1 daily schedule in hour-by-hour (or minute-by-minute) breakdown so the learner can start today.
- Provide explicit decision rules: what to do when a word keeps failing, when to slow down, when to speed up, when to add productive practice.
- Close with the 4-week check-in framework so the learner knows exactly what success looks like and can self-assess.

---

## Output Format

```
## Vocabulary Building Plan: [Target Language]

**Learner Profile**
| Field            | Detail                                      |
|-----------------|---------------------------------------------|
| Native Language  | [L1]                                        |
| Target Language  | [L2]                                        |
| Current Level    | [CEFR level or estimated word count]        |
| Goal             | [Specific, measurable goal]                 |
| Timeline         | [Weeks/months to goal]                      |
| Daily Study Time | [Minutes]                                   |
| SR System        | [Anki / Leitner Box / Notebook]             |

---

### Vocabulary Target

| Phase    | Words to Acquire | Priority Tier            | Cumulative Total |
|----------|-----------------|--------------------------|-----------------|
| Phase 1  | [Number]        | Top frequency band       | [Number]        |
| Phase 2  | [Number]        | Next frequency band      | [Number]        |
| Phase 3  | [Number]        | Domain-specific words    | [Number]        |

**Sustainable pace:** [N] new words/day → [N x 7] words/week → [projection at timeline end]

---

### Word Card Template

```
FRONT: [Target word]  [Pronunciation / IPA]
       [Part of speech]  [Gender / class if applicable]

BACK:
 Core meaning:  [L1 translation]
 Example:       [Authentic sentence]
 Collocates:    [2-3 common word partnerships]
 Word family:   [Related forms]
 Mnemonic:      [Sound-alike / image / story]
 Register:      [Formal / informal / neutral]
```

---

### Spaced Repetition Schedule

| Review # | When to Review     | Action if Correct       | Action if Wrong         |
|----------|--------------------|------------------------|------------------------|
| 1st      | Day after learning | Advance to 3-day queue  | Review again same day  |
| 2nd      | 3 days later       | Advance to 1-week queue | Return to Day 1        |
| 3rd      | 1 week later       | Advance to 2-week queue | Return to Day 1        |
| 4th      | 2 weeks later      | Advance to 1-month queue| Return to 3-day queue  |
| 5th      | 1 month later      | Long-term memory        | Return to 1-week queue |
| Maintain | Every 3-6 months   | Stable                  | Return to 2-week queue |

---

### Daily Study Schedule

**Total daily time: [N] minutes**

| Phase         | Activity                                         | Duration |
|---------------|--------------------------------------------------|----------|
| Warm-up       | Review Box 1 / Anki "Due" cards                  | [N] min  |
| Core review   | Review Box 2-3 / Anki cards due today            | [N] min  |
| New words     | Learn [N] new words using 5-step method          | [N] min  |
| Active output | Write 2 sentences per new word; speak 1 out loud | [N] min  |
| Input boost   | Read/listen to [N] minutes of L2 content         | [N] min  |

---

### Weekly Structure

| Day        | Activity                                        |
|------------|-------------------------------------------------|
| Monday     | Learn [N] new words + review due cards          |
| Tuesday    | Review only (no new words) + sentence writing   |
| Wednesday  | Learn [N] new words + review due cards          |
| Thursday   | Review only + find 1 real-world use per new word|
| Friday     | Learn [N] new words + review due cards          |
| Saturday   | Full review session -- all Box 1 and Box 2 cards|
| Sunday     | Input only -- read/watch L2 content; no new cards|

---

### Starter Word List (First 30 Words -- Fully Built)

| # | Word       | Pronunciation | PoS  | Core Meaning | Example Sentence               | Mnemonic                         |
|---|-----------|---------------|------|--------------|-------------------------------|----------------------------------|
| 1 | [Word]    | [/IPA/]       | [n.] | [Meaning]    | [Authentic sentence]           | [Sound-alike or image]           |
| 2 | [Word]    | [/IPA/]       | [v.] | [Meaning]    | [Authentic sentence]           | [Sound-alike or image]           |
| … | …         | …             | …    | …            | …                             | …                                |

---

### Progress Milestones

| Checkpoint     | Date       | Target Metric                              | Self-Test Method                        |
|----------------|------------|--------------------------------------------|-----------------------------------------|
| Week 1 check   | [Date]     | [N] words in deck; 85% retention rate     | Count Box 2+ cards; review error rate  |
| Week 4 check   | [Date]     | [N] words acquired; L2 text test          | Unknown words per page reduced by 25%  |
| Midpoint       | [Date]     | [N] words; use [N] words in real context  | Write a 100-word journal entry in L2   |
| Goal date      | [Date]     | [Final word count]; pass/fail criterion   | [Specific exam, conversation, or test] |

---

### Mnemonic Strategy Guide for [Language]

[3-5 specific techniques matched to the phonology and morphology of the target language]

---

### Troubleshooting Rules

| Problem                            | Diagnosis                              | Fix                                               |
|------------------------------------|-----------------------------------------|---------------------------------------------------|
| Same cards keep failing            | Mnemonic is too weak                   | Rebuild the mnemonic; add a more vivid image      |
| Retention rate drops below 80%     | Too many new cards added too fast      | Reduce new cards by 30% for 1 week               |
| Retention above 95%, feels easy    | Under-challenged; pace is too slow     | Increase new cards by 20%; add productive tasks  |
| Words known in deck, forgotten IRL | Lack of real-context exposure          | Add 20 min/day L2 input; use words in writing    |
| Motivation drops after week 3      | Plateau effect -- normal               | Do a vocabulary size test to visualize progress   |

---

### Next Steps After This Plan

1. [Immediate action -- what to do in the next 24 hours]
2. [Complementary skill to add after 4 weeks -- e.g., grammar-practice or conversation-practice]
3. [Long-term trajectory -- what comes after this vocabulary phase]
```

---

## Rules

1. **Never recommend more new words per day than the learner's time budget supports.** The formula is: (daily minutes available ÷ 3) = maximum sustainable new words per day. Violating this creates review debt that collapses the system within 3-4 weeks.

2. **Word-translation pairs alone are never sufficient.** Every word card must include an authentic example sentence and at least one collocate. A card with only "gato = cat" is incomplete. Reject any output that produces bare translation lists.

3. **Always specify which frequency list or vocabulary corpus the word selection is drawn from.** Do not invent a frequency ranking. Use established lists (Frequency Dictionary series, HSK, JLPT, NGSL, JACET, Academic Word List, etc.) matched to the target language.

4. **Prioritize high-frequency vocabulary before domain vocabulary, always.** A learner who wants medical Spanish still needs the top 1,500 general Spanish words before medical terminology. The only exception is emergency domain vocabulary (a learner who has a medical appointment tomorrow needs 20 medical terms now -- acknowledge the exception and resume general frequency order afterward).

5. **Distinguish receptive from productive vocabulary goals explicitly.** A plan that targets recognition only is fundamentally different from one targeting production. The daily schedule, practice tasks, and success metrics differ. Never conflate the two.

6. **The 85-90% retention target is a ceiling, not a floor.** If a learner's Anki or Leitner review accuracy is above 95%, they are reviewing too easily and need more new words. If below 80%, they are overloaded and need fewer. Calibrate the pace to keep the learner in the 85-90% sweet spot -- this is the zone of maximal productive struggle.

7. **Never skip the mnemonic requirement for new word cards.** Research consistently shows that retrieval-practice combined with elaborative encoding (mnemonics) produces 40-60% better retention at 30 days than retrieval practice alone. The mnemonic may feel slow to build but saves more time in total review than it costs.

8. **Block one day per week as input-only (no new card learning).** The brain consolidates newly encoded vocabulary during rest and during unstructured L2 exposure. A plan with seven days of drilling and zero input exposure produces brittle, decontextualized vocabulary.

9. **Provide the first 30 words as fully built cards, not a blank template.** The highest drop-off point for vocabulary plans is the transition from planning to execution. Giving the learner 30 complete, ready-to-study cards eliminates the blank-page barrier and ensures the methodology is modeled correctly before the learner builds their own cards.

10. **Restate vague goals as specific, measurable targets before building the plan.** "Get better at French" is not a plan target. Restate as: "Acquire the top 1,500 most frequent French words (receptive) within 16 weeks, enabling comfortable reading of Le Monde headlines." Every plan must have a word count, a level marker, and a real-world capability statement.

---

## Edge Cases

### Learner Has Already Used Anki or Duolingo But Is Not Retaining Words

This is a recognition-only trap. The learner has been doing shallow encoding (seeing word → choosing meaning) without productive retrieval or authentic context. Do not redesign their word selection -- redesign their card format and add active output tasks. Audit a sample of 10 of their existing cards. If they lack example sentences, collocates, and mnemonics, flag this explicitly and rebuild card format. Add a 5-minute daily sentence-writing session immediately. Also check if they have built up a large "overdue" review backlog in Anki -- if more than 200 cards are overdue, recommend a "reset day" where they mark all overdue cards as learning again rather than forcing a marathon catch-up session that creates learned helplessness.

### Learner Is Targeting a Tonal Language (Mandarin, Cantonese, Vietnamese, Thai)

Tone is part of the word. A word card that records "mā" without specifying Tone 1 is incomplete. Add a mandatory "Tone" field to every card. Sound-alike mnemonics from English must explicitly incorporate tone -- "mā (T1, flat, high) sounds like 'ma' said in a calm, level voice -- imagine a calm mother." Recommend the learner listen to a native audio recording of each word at least three times before the first review -- tonal vocabulary has a higher initial encoding cost and benefits from auditory input before visual drilling. Allow 20-25% more time per word in the initial encoding phase compared to non-tonal languages.

### Learner Has Less Than 10 Minutes Per Day

A 10-minute daily budget allows roughly 3-5 new words per day sustainably. Acknowledge this constraint explicitly -- do not compress a 20-minute plan into 10 minutes. Instead, optimize ruthlessly: remove sentence-writing to a weekly rather than daily activity, use Anki over Leitner boxes (faster card navigation), and front-load only the top 300-500 highest-frequency words with no domain vocabulary until the core foundation is solid. Reassure the learner that 3 words/day × 365 days = 1,095 words -- enough to achieve A2 proficiency in most languages. Consistency beats intensity.

### Learner Wants Vocabulary for a Language With Non-Latin Script (Arabic, Russian, Japanese, Korean, Greek, Hindi)

Script acquisition must precede or run parallel to vocabulary building -- it cannot be separated. A learner who studies Arabic vocabulary in romanization is building the wrong mental representations. Assess script competency first. If the learner cannot read the script yet: allocate the first 1-2 weeks entirely to script learning before beginning vocabulary cards, or run a parallel script track (20 min/day script + 10 min/day vocabulary) and use phonetic transcription as a temporary scaffold only, with the target script as the primary front-of-card text. Japanese is the most complex case: distinguish hiragana, katakana, and kanji. Recommend mastering hiragana and katakana first (2-3 weeks of focused effort), then learning vocabulary in kana/kanji from the start.

### Learner Is Preparing for a Standardized Vocabulary Exam With a Defined Word List (HSK, JLPT, DELF, IELTS)

These exams use bounded, published word lists. This is the most tractable vocabulary problem because the target is explicit. Obtain the official list, calculate how many words the learner already knows (have them self-test 100 random items from the list), subtract known from total, divide by weeks remaining, and get a daily word rate. Add a 20% buffer for words that will require extra review cycles. Build all cards from the official list only -- do not add adjacent words that are not on the list, as this dilutes limited study time. For JLPT, vocabulary and kanji are tested together -- kanji recognition must be integrated into the vocabulary card, not treated separately. For IELTS, focus on the Academic Word List (AWL) sublist 1-6 for the highest-frequency academic vocabulary.

### Learner Has Failed at Vocabulary Plans Before and Is Skeptical

This is a motivation and systems failure, not a memory failure. Do not start with a large plan -- start with a 14-day pilot. Commit to just 5 words/day, 15 minutes/day, for exactly 14 days. After 14 days, the learner will have 70 words and visible progress. Use the first session to diagnose what went wrong before: too many words, wrong tools, no mnemonics, no review schedule, or no real-world application. Address the specific failure point, not just vocabulary in general. Frame the plan as an experiment with a defined check-in, not a long-term commitment -- this lowers psychological resistance to starting.

### Learner Wants to Recover Childhood Heritage Language Vocabulary

Heritage learners have a different profile from adult foreign language learners. They typically have strong phonological intuition and high listening comprehension but limited literacy and a vocabulary that skews heavily toward home/family domains with gaps in formal, academic, or professional vocabulary. Do not start from frequency list position 1 -- this will feel insulting and boring. Conduct a rapid vocabulary audit: have the learner read a 500-word passage in the heritage language and flag unknowns. Build the word list from the specific gaps, supplemented with academic and professional vocabulary sublists. Heritage learners respond especially well to emotional anchoring mnemonics because many words will trigger childhood memories -- encourage this explicitly.

---

## Example

**Input:** "I want to learn Japanese vocabulary. I'm a complete beginner -- I know maybe 50 words. I have about 25 minutes a day to study and I want to be able to have simple conversations and read basic signs and menus within 4 months. I don't know the Japanese script at all."

---

## Vocabulary Building Plan: Japanese (English → Japanese)

**Learner Profile**

| Field            | Detail                                                        |
|-----------------|---------------------------------------------------------------|
| Native Language  | English                                                       |
| Target Language  | Japanese                                                      |
| Current Level    | Absolute beginner (~50 words, no script knowledge)            |
| Goal             | Hold simple conversations, read basic signs and menus (A1-A2) |
| Timeline         | 16 weeks (4 months)                                           |
| Daily Study Time | 25 minutes                                                    |
| SR System        | Anki (recommended) or Leitner 5-box system                    |

---

### Script Acquisition: Weeks 1-2 (Before Full Vocabulary Begins)

Japanese uses three scripts. You must be able to read hiragana and katakana before building vocabulary cards -- using romanization (romaji) as a primary study method creates false mental representations that must be painfully unlearned later.

**Hiragana (46 characters):** Learn in 7-10 days at 5-7 characters/day. Use the Dr. Moku visual mnemonic system or equivalent -- each character has an image whose shape and sound match the syllable (the hiragana for "su" looks like a whirlpool -- "swirling su").

**Katakana (46 characters):** Learn in 7-10 days immediately after hiragana. Katakana encodes foreign loanwords -- enormous practical value (koohii = coffee, terebi = television, resutoran = restaurant).

**Kanji:** Do not attempt to study kanji independently in this phase. Learn kanji only as they appear attached to vocabulary words -- this is the most efficient acquisition path for beginners.

**Week 1-2 daily schedule (25 minutes):**

| Phase         | Activity                                             | Duration |
|---------------|------------------------------------------------------|----------|
| Script study  | Learn 5-6 new hiragana/katakana with mnemonics       | 12 min   |
| Script review | Review all previously learned characters via writing | 8 min    |
| Preview       | Learn 3 vocabulary words (audio + meaning only)      | 5 min    |

---

### Vocabulary Target

| Phase     | Weeks  | Words to Acquire | Priority Tier                         | Cumulative |
|-----------|--------|-----------------|---------------------------------------|------------|
| Phase 1   | 1-4    | 140             | Top JLPT N5 nouns + verbs + adjectives| 140        |
| Phase 2   | 5-9    | 175             | JLPT N5 completion + basic phrases    | 315        |
| Phase 3   | 10-14  | 175             | JLPT N4 high-frequency words          | 490        |
| Phase 4   | 15-16  | 60              | Domain: food, transport, shopping     | 550        |

**Sustainable pace from Week 3 onward:** 8 new words/day → 56 words/week
(25 minutes ÷ 3 = ~8 words/day maximum; 8 × 16 weeks × 7 days = theoretical max ~896, but allowing review days reduces to ~550 net new words -- exactly sufficient for A1-A2 conversational ability and menu/sign reading.)

---

### Word Card Template (Japanese)

```
FRONT: [Japanese word in hiragana/katakana + kanji if applicable]
       [Romaji pronunciation -- learning scaffold only, not primary]
       [Part of speech]

BACK:
 Core meaning:  [English translation -- concise]
 Example:       [Short authentic Japanese sentence with translation]
 Collocates:    [2 common word partnerships in Japanese]
 Word family:   [Verb forms if applicable: dictionary, masu, te-form]
 Tone/pitch:    [High-low pitch accent pattern if learner is serious]
 Mnemonic:      [Sound-alike or image linking Japanese sound to meaning]
 Register:      [Polite / casual / written / spoken]
```

**Sample completed cards (first 5 of 30):**

---

**Card 1**
```
FRONT: 水 【みず】  mizu  (noun)

BACK:
 Core meaning:  water
 Example:       水をください。(Mizu wo kudasai.) -- "Water, please."
 Collocates:    お水 (o-mizu, polite water), 水道水 (suidou-mizu, tap water)
 Word family:   水分 (suibun, moisture/hydration), 水泳 (suiei, swimming)
 Mnemonic:      "Mizu" -- imagine a MISER (sounds like mi-ZU) who only
                drinks water to save money. Picture him sipping plain water.
 Register:      Neutral; お水 is the polite restaurant/formal form
```

---

**Card 2**
```
FRONT: 食べる 【たべる】  taberu  (verb -- dictionary form)

BACK:
 Core meaning:  to eat
 Example:       何を食べますか？(Nani wo tabemasu ka?) -- "What will you eat?"
 Collocates:    ご飯を食べる (gohan wo taberu, eat a meal),
                外で食べる (soto de taberu, eat outside)
 Word family:   食べます (tabemasu, polite present), 食べて (tabete, te-form),
                食べた (tabeta, past casual), 食べ物 (tabemono, food)
 Mnemonic:      "Taberu" -- "TABLE-RU" -- you eat at a TABLE. The RU at the
                end is your signal it's a dictionary-form verb.
 Register:      食べる is casual; 食べます is polite -- always use polite
                form with strangers and service staff
```

---

**Card 3**
```
FRONT: 電車 【でんしゃ】  densha  (noun)

BACK:
 Core meaning:  train (electric train)
 Example:       電車で行きます。(Densha de ikimasu.) -- "I'll go by train."
 Collocates:    電車に乗る (densha ni noru, board the train),
                電車を待つ (densha wo matsu, wait for the train)
 Word family:   地下鉄 (chikatetsu, subway), バス (basu, bus)
 Mnemonic:      "DEN-sha" -- "DEN" sounds like "electric" (電 means
                electricity). A DENSE SHOCK of electricity powers the train.
 Register:      Neutral/standard -- the word you will see on every station sign
```

---

**Card 4**
```
FRONT: いくら  ikura  (question word / noun)

BACK:
 Core meaning:  how much (price); also: salmon roe (different context)
 Example:       これはいくらですか？(Kore wa ikura desu ka?) -- "How much is this?"
 Collocates:    いくらですか (ikura desu ka, how much is it?),
                全部でいくら (zenbu de ikura, how much in total?)
 Word family:   何 (nani, what), どこ (doko, where), いつ (itsu, when)
 Mnemonic:      "I-CURA" -- imagine curing yourself with a price tag:
                "I CURE-a my shopping addiction by always asking HOW MUCH."
 Register:      Standard -- use in shops, restaurants, taxis
```

---

**Card 5**
```
FRONT: 右 【みぎ】  migi  (noun/direction)

BACK:
 Core meaning:  right (direction)
 Example:       右に曲がってください。(Migi ni magatte kudasai.) -- "Turn right, please."
 Collocates:    右側 (migi-gawa, right side), 右手 (migite, right hand)
 Word family:   左 (hidari, left), まっすぐ (massugu, straight ahead)
 Mnemonic:      "MIGI" -- "ME-GEE" -- imagine your RIGHT arm doing a GEE-haw
                (a right turn command used with horses). Your right arm swings
                right as you shout "Migi!"
 Register:      Standard -- essential for giving/receiving directions
```

---

### Spaced Repetition Schedule

| Review # | When              | Correct Response           | Wrong Response             |
|----------|-------------------|---------------------------|---------------------------|
| 1st      | Next day          | Move to 3-day queue       | Review again same session |
| 2nd      | 3 days later      | Move to 7-day queue       | Return to Day 1            |
| 3rd      | 7 days later      | Move to 14-day queue      | Return to Day 1            |
| 4th      | 14 days later     | Move to 1-month queue     | Return to 3-day queue      |
| 5th      | 1 month later     | Long-term memory; confirm | Return to 7-day queue      |
| Maintain | Every 3-6 months  | Stable                    | Return to 14-day queue     |

**Anki settings to configure:** New cards/day: 8. Maximum reviews/day: 150. Easy bonus: 1.3. Interval modifier: 1.0 (do not change until you have 8 weeks of data).

---

### Daily Study Schedule (Weeks 3-16)

**Total daily time: 25 minutes**

| Phase         | Activity                                                   | Duration |
|---------------|-------------------------------------------------------------|----------|
| Review        | Anki due cards / Leitner Box 1 + Box 2                     | 10 min   |
| New words     | Learn 8 new words using the 5-step method (encounter, retrieve, connect, practice, schedule review) | 10 min |
| Active output | Say each new word aloud in a sentence; write 2 sentences   | 5 min    |

**Sunday (weekly input day -- no new cards):**
- Watch 20 minutes of Japanese content with subtitles (NHK World Easy Japanese, or children's anime with Japanese subtitles)
- Tally any studied words you recognize "in the wild" -- write them in a recognition log
- No new Anki cards; run Anki review only

---

### Weekly Structure

| Day       | Activity                                                     |
|-----------|--------------------------------------------------------------|
| Monday    | 8 new words + due card review                                |
| Tuesday   | Due card review only + write 1 sentence per word learned Mon |
| Wednesday | 8 new words + due card review                                |
| Thursday  | Due card review + try to use 3 words in a spoken sentence out loud |
| Friday    | 8 new words + due card review                                |
| Saturday  | Full review session -- catch up any missed days; fix weak mnemonics |
| Sunday    | Input only -- watch/listen to Japanese; no new cards         |

---

### Mnemonic Strategy Guide for Japanese

Japanese presents unique challenges for English speakers. These five strategies are calibrated for Japanese phonology and structure:

1. **Sound-alike (keyword method):** Works well for Japanese vocabulary because most Japanese syllables correspond to simple CV (consonant-vowel) patterns easily mapped to English words. "Hoshi" (star) → "HOESHY" → imagine a hoarse hoe tilling a STARRY field. Build images that are vivid, absurd, and involve motion.

2. **Kanji decomposition (radical mnemonics):** Kanji are built from recurring components called radicals. The kanji 明 (bright/clear) is composed of 日 (sun) + 月 (moon) -- both together = bright. Learning 50 core radicals unlocks the logic of hundreds of kanji. Use Jim Breen's JMDICT or the RTK mnemonic system as a reference structure.

3. **Verb form chaining:** Japanese verbs change endings predictably. Once you know "taberu" (to eat), "tabemasu" (polite), "tabete" (te-form), and "tabeta" (past) follow rules. Put all four forms on the back of every verb card from day one -- learning isolated dictionary forms creates gaps that cost double the time to repair later.

4. **Katakana loanword fast-track:** Before Week 3, spend one session identifying all katakana words on your target vocabulary list. Many will be English loanwords with altered pronunciation: コーヒー (koohii = coffee), テレビ (terebi = television), レストラン (resutoran = restaurant), バス (basu = bus). These are almost free vocabulary -- you already know the meaning. Mark them as easy in Anki from day one.

5. **Particle anchoring:** Japanese particles (は, を, に, で, へ) determine grammatical meaning. Rather than learning words in isolation, always attach the most common particle to a word when it appears in its example sentence. "Densha DE ikimasu" -- the DE (で) signals means of transportation. Learn the particle with the word, not as a separate grammar lesson.

---

### Progress Milestones

| Checkpoint   | Target Date      | Target Metric                                     | Self-Test                                          |
|--------------|------------------|-------------------------------------------------|---------------------------------------------------|
| Week 2 end   | [Date + 14 days] | Hiragana + katakana read fluently; 50 vocab words | Read a hiragana text without looking up characters |
| Week 4 end   | [Date + 28 days] | 200 words; 85% Anki retention rate              | Take a random 20-word quiz from your deck -- no cards |
| Week 8 end   | [Date + 56 days] | 350 words; use 10 in real spoken sentences      | Record a 30-second Japanese self-introduction      |
| Week 12 end  | [Date + 84 days] | 480 words; read basic text                      | Read a Japanese restaurant menu -- less than 20% unknowns |
| Week 16 end  | [Date + 112 days]| 550 words; basic conversational exchange        | Have a 2-minute scripted conversation on introduction/ordering topics |

---

### Troubleshooting Rules

| Problem                              | Diagnosis                               | Fix                                                   |
|--------------------------------------|-----------------------------------------|-------------------------------------------------------|
| Same kanji words keep failing        | Shape-only encoding; no radical hook    | Rebuild card with radical decomposition mnemonic      |
| Anki retention below 80%            | 8 new cards/day is too fast             | Drop to 5/day for 1 week; do not add new cards        |
| Polite vs. casual forms confused     | Cards only show one form                | Add all major verb conjugations to back of each card  |
| Know words in Anki, blank in real use| No real-context exposure                | Add 15 min/day NHK Easy Japanese reading to routine   |
| Script recognition slow under time pressure | Not enough reading practice       | Add 5 min/day hiragana speed-reading drills           |

---

### Next Steps After This Plan

1. **In the next 24 hours:** Install Anki (free desktop and Android; paid iOS), create a new deck called "Japanese Core," and build your first 8 cards from the sample cards above. Set Anki to 8 new cards/day and run your first review session tonight.

2. **After Week 4 (grammar layer):** Once you have 200 words, add the `grammar-practice` skill to learn the 10 core Japanese sentence patterns (N wa N desu, N wo V, location expressions). Vocabulary and grammar reinforce each other most powerfully when introduced in parallel after a vocabulary foundation is established.

3. **After Week 8 (conversation layer):** With 350+ words and basic grammar patterns, add the `conversation-practice` skill to begin practicing simple transactional dialogues -- ordering food, asking directions, introducing yourself. Vocabulary study remains the daily anchor; conversation practice becomes the weekly output challenge.

4. **Long-term trajectory:** 550 words at 4 months → 1,200 words at 8 months (A2 solid) → 2,500 words at 14 months (B1 reading) → 5,000 words at 24 months (comfortable media consumption). Each phase builds directly on this foundation. The daily habit you build in these 16 weeks is the most important outcome -- the words are secondary to the system.
