---
name: flashcard-generation
description: |
  Creates Anki-ready or paper-based Q/A flashcard pairs from provided study content. Produces specific, well-formulated cards following the minimum information principle -- one concept per card, clear question, concise answer.
  Use when a learner asks to create flashcards, make Anki cards, generate Q&A pairs for studying, or convert notes into flashcard format.
  Do NOT use for spaced repetition scheduling (use `spaced-repetition`), for practice test questions (use `active-recall-practice`), or for concept mapping (use `concept-mapping`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spaced-repetition study-skills active-recall note-taking"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Flashcard Generation

## When to Use

Use this skill when any of the following conditions are met:

- A learner explicitly asks to create flashcards, make Anki cards, generate study cards, or convert notes into Q&A format from provided content such as lecture slides, textbook excerpts, personal notes, or a vocabulary list
- A student wants to memorize a body of knowledge -- terminology, facts, processes, rules, or formulas -- and needs the content atomized into retrievable units
- A user uploads or pastes raw notes and asks for them to be "turned into something I can study" or "organized for memorization"
- A user is preparing for a high-stakes exam (board exam, standardized test, professional certification, language proficiency test) and needs dense information converted into efficient, reviewable card sets
- A user explicitly mentions Anki, Quizlet, RemNote, Mochi, or any flashcard app and wants content ready to import or copy in
- A user is learning a second language and wants vocabulary, grammar patterns, or idioms converted into bilingual cards
- A user is studying a procedural domain (pharmacology, legal rules, anatomy, programming syntax) and needs factual recall support

**Do NOT use when:**

- The user wants to schedule reviews, calculate optimal review intervals, or understand the SuperMemo SM-2 algorithm -- use `spaced-repetition` instead
- The user wants full practice test questions with distractors, scoring rubrics, or simulated exam conditions -- use `active-recall-practice` instead
- The user wants to visualize how concepts relate to each other in a network or hierarchy -- use `concept-mapping` instead
- The user wants a study plan, timeline, or weekly schedule -- use `study-planning` instead
- The user is writing essay-style responses or needs long-form recall practice -- use `active-recall-practice` instead
- The content is primarily procedural skill-building (how to write code, how to solve proofs) rather than factual recall -- hands-on practice is more appropriate than flashcards
- The user needs to understand a concept they do not yet understand at all -- flashcards reinforce existing understanding; direct explanation should come first

---

## Process

### Step 1: Gather Source Material and Learner Parameters

Before generating a single card, collect the following information. If the user provides the content directly, most parameters can be inferred -- ask only for what is missing.

- **Source content:** Obtain the raw material -- pasted text, uploaded notes, a list of terms, a chapter summary. If the user has not provided content, ask them to paste it directly rather than describing it vaguely.
- **Subject and course level:** The depth and vocabulary of cards differs between an introductory biology student and a medical student studying for USMLE Step 1. Identify the level (high school, undergraduate, graduate, professional certification).
- **Card count target:** For new learners or short content, recommend 15-30 cards. For a full textbook chapter, 40-80 cards is typical. For a complete subject area like organic chemistry mechanisms, 200+ cards organized into subdecks is appropriate. Never generate more than 60 cards in a single output -- split into batches and label clearly.
- **Format preference:** Ask whether the user wants Anki-importable format (tab-separated plain text), a human-readable list for paper cards or Quizlet manual entry, or both. Default to universal readable format if not specified.
- **Card type preferences:** Ask whether to include cloze deletions, application cards, reverse cards, or to keep it strictly basic (front/back). Default to a mix of basic, cloze, and reverse.
- **Prior knowledge level:** Cards for a complete beginner need more foundational vocabulary cards. Cards for someone reviewing before an exam can skip definitions and focus on discrimination and application cards.

### Step 2: Analyze the Source Material Before Writing Any Cards

Never dive immediately into card creation. Spend this step understanding the structure of the content.

- **Identify the concept hierarchy:** Separate foundational facts (vocabulary, definitions, dates, names) from relational facts (how X causes Y, why A differs from B) from application knowledge (given a scenario, apply rule Z). These map to different card types.
- **Count the distinct atomic concepts:** Each concept that can be independently recalled is a candidate for a card. Overlapping or compound concepts must be decomposed. For example, "the sodium-potassium pump moves 3 Na⁺ out and 2 K⁺ in per ATP" contains at least three atomic facts: what the pump does, the stoichiometry for Na⁺, and the stoichiometry for K⁺.
- **Flag content unsuitable for flashcards:** Arguments, interpretations, processes requiring procedural skill, and essays cannot be effectively flashcarded. Note these to the user with alternatives.
- **Identify prerequisite relationships:** Concept A must be understood before Concept B can be learned. These define card ordering and deck structure.
- **Detect implicit knowledge gaps:** If the source material uses a term without defining it and the user is a beginner, flag that the definition card should be added even if the source did not include the definition explicitly.

### Step 3: Apply the Minimum Information Principle Rigorously

This is the most important step. Every card must encode exactly one atomic memory trace. Violating this principle produces cards that are slow to review, prone to tip-of-the-tongue failure, and ineffective for long-term retention.

- **One question, one answer:** The answer to any card must be retrievable with a single memory access. If answering requires recalling two independent facts, split the card.
- **The 20-word answer ceiling:** For basic and cloze cards, the answer should be no longer than 20 words. For application cards, up to 40 words is acceptable. If you are consistently exceeding this, the question is too broad.
- **Decomposition test:** Before writing a card, ask: "Could I split this into two cards, each independently useful?" If yes, split it.
- **Avoid "list all" questions:** "List all six phases of mitosis" produces a card that is nearly impossible to answer correctly during early learning and does not build precise individual recall. Replace with individual cards: "What happens during the prophase stage of mitosis?" for each phase.
- **Exception -- small, bounded sets:** If the answer is a bounded short list (2-3 items) that always appear together and are always recalled together (e.g., "What are the three branches of the US federal government?"), a list answer is acceptable. Sets of 4+ items should always be split.
- **Avoid vague questions:** "What is important about the French Revolution?" has no single correct answer. "What year did the French Revolution begin?" and "What event is considered the start of the French Revolution?" are answerable.

### Step 4: Write Cards Using the Full Range of Appropriate Card Types

Match card type to the nature of the knowledge being encoded. Use the following decision logic:

**Basic (Front/Back) cards** -- use for:
- Definitions of terms ("What is osmosis?")
- Factual single-answer questions ("What year was the Treaty of Versailles signed?")
- Named relationships ("What enzyme catalyzes the first step of glycolysis?")

**Cloze deletion cards** -- use for:
- Filling in a key term in a statement the learner should memorize verbatim or near-verbatim
- Sequential processes where context matters ("During the action potential, the membrane depolarizes when {{c1::sodium}} ions rush into the cell")
- Formulas where variable names must be memorized ("Ohm's Law: V = {{c1::I}} × {{c2::R}}")
- Best for Anki users; for paper/Quizlet users, rewrite as "fill in the blank" with the blank indicated by an underline or brackets

**Reverse cards** -- use for:
- Vocabulary where bidirectional retrieval is required (term → definition AND definition → term)
- Named phenomena where both directions appear on exams
- Language learning (always bidirectional for vocabulary)
- In Anki, these are created by enabling the "Basic (and reversed card)" note type, which generates two cards from one note

**Application cards** -- use for:
- Concepts that appear in scenario-based exam questions (MCAT, bar exam, USMLE, case studies)
- Rules that must be applied to novel situations
- Formulas that must be selected and used correctly given contextual cues
- Template: "Given [specific scenario], [action or prediction the learner must make]?"

**Discrimination cards** -- use for:
- Easily confused pairs or groups (mitosis vs. meiosis, affect vs. effect, arteries vs. veins)
- False friends in language learning
- Template: "How does X differ from Y in terms of [dimension]?"

**Production cards (language learning only)** -- use for:
- Generating a target-language sentence from a first-language prompt
- Conjugating a verb in a specific tense and person given the infinitive
- Writing a word from a phonetic or audio cue

### Step 5: Perform a Card Quality Audit Before Output

Before writing the final output, check every card against this six-point quality checklist. A card that fails any point must be revised.

1. **Unambiguous:** Is there one and only one clearly correct answer? If two students with identical knowledge could give different answers and both be right, the question is ambiguous.
2. **Self-contained:** Can the card be understood in isolation, without needing to see any other card in the deck? If a card says "What is the next step after this?", it fails.
3. **Testable:** Does answering require genuine recall? If a person could guess correctly 50% of the time without knowing the material (true/false, obvious distractors), the card fails.
4. **Positive phrasing:** Questions should ask what something IS, not what it is NOT. "What is the function of the mitral valve?" not "Which valve is NOT on the right side of the heart?"
5. **Correct and complete:** Verify that the answer on every card is factually accurate and complete enough to be useful. Do not write answers that require the learner to "look it up" or "see textbook page X."
6. **Appropriate difficulty:** Cards should be challenging but answerable in 5-10 seconds of focused recall. If answering correctly requires more than 10 seconds of sustained reasoning, the card may be too complex for flashcard format.

### Step 6: Tag, Sequence, and Organize the Card Set

Organization is not optional -- it directly impacts how effectively the learner can study the deck.

- **Tag every card** with at minimum: (1) the subtopic it belongs to, and (2) its card type. For Anki users, tags are searchable and filterable. Example tags: `chapter-3::glycolysis`, `card-type::cloze`, `difficulty::hard`, `exam-priority::high`.
- **Assign difficulty ratings** on a 1-3 scale: (1) recognition-level fact, (2) relational knowledge requiring connecting two concepts, (3) application requiring judgment in a scenario.
- **Define a study order** based on prerequisite relationships. Cards that introduce foundational vocabulary must come before cards that apply that vocabulary.
- **Flag high-priority cards** when the user has mentioned an upcoming exam or has identified priority topics. High-priority cards should be studied first and reviewed more frequently.
- **For large decks (40+ cards):** Create named subdecks. Anki uses the format `DeckName::SubdeckName` in the deck field. Recommend the user create one parent deck per course and one subdeck per chapter or topic unit.

### Step 7: Provide Import-Ready Output and Usage Guidance

The card set is only useful if the learner can immediately act on it.

- **For Anki users:** Provide a tab-separated plain text block that can be imported via File > Import in Anki. The format is: `Front[TAB]Back[TAB]Tags`. For cloze cards, the front field uses `{{c1::term}}` syntax. Specify which Anki note type to use: "Basic", "Basic (and reversed card)", or "Cloze".
- **For Quizlet users:** Provide a plain front/back list. Quizlet imports comma-separated or tab-separated files. Cloze cards should be rewritten as "fill in the blank" because Quizlet does not natively support Anki cloze syntax.
- **For paper users:** Format cards clearly with FRONT: and BACK: labels. Recommend printing two-sided or using index cards (3×5 for vocabulary, 4×6 for application cards).
- **Study guidance:** Always include a brief note on how to use the cards: start with the study order provided, self-rate each card after answering (easy/medium/hard), and flag cards answered incorrectly for priority review. For Anki users, remind them to set the new cards per day limit to 20-30 for a deck of this size.

---

## Output Format

```
## Flashcard Set: [Topic Name]

**Subject:** [Course name and level, e.g., "AP Biology", "USMLE Step 1", "Mandarin Chinese -- Beginner"]
**Source Material:** [Brief description, e.g., "Chapter 7: Cellular Respiration, Campbell Biology 12th ed."]
**Total Cards:** [Number]
**Card Types Used:** [e.g., Basic, Cloze, Reverse, Application, Discrimination]
**Format:** [Anki / Quizlet / Paper / Universal]
**Tags:** [Top-level subject tags]
**Study Priority:** [High / Medium / Low, or "Exam on [date]"]

---

### Card Set

**Card [N]** [Type: Basic | Cloze | Reverse | Application | Discrimination]
**Tag:** [subtopic::specific-tag] | **Difficulty:** [1 = recall / 2 = relational / 3 = application]
- Front: [Question or cloze statement]
- Back: [Answer -- under 20 words for Basic/Cloze, under 40 for Application]

*(Repeat for all cards, numbered sequentially)*

---

### Deck Structure and Study Order

| Phase | Card Numbers | Focus | Prerequisite For |
|-------|-------------|-------|-----------------|
| Foundation | [e.g., 1-8] | Vocabulary and definitions | All other phases |
| Core Knowledge | [e.g., 9-20] | Mechanisms and relationships | Application phase |
| Application | [e.g., 21-28] | Scenario-based cards | None |
| Discrimination | [e.g., 29-32] | Easily confused concepts | Core Knowledge phase |

**Recommended daily new card limit:** [Number] cards/day
**Estimated time to first pass:** [X] days at recommended pace

---

### Priority Flags

- **High priority (review first):** Cards [list numbers]
- **Conceptually difficult (expect multiple review sessions):** Cards [list numbers]
- **Safe to de-prioritize if time is short:** Cards [list numbers]

---

### Anki Import Block (tab-separated)

*Copy the text below and import via File > Import in Anki.*
*Note type: [Basic / Basic (and reversed card) / Cloze]*

```text
[Front text][TAB][Back text][TAB][tag1 tag2 tag3]
[Cloze text with {{c1::term}} syntax][TAB][Extra context or hint][TAB][tag1 tag2]
```

---

### Quality Notes

- [Any cards flagged as needing user verification]
- [Any content from the source that was intentionally excluded and why]
- [Any prerequisite knowledge the user should confirm before studying these cards]
```

---

## Rules

1. **Never create a card with a list longer than three items as the answer.** A list answer means the learner cannot self-check reliably -- did they remember all items? In the correct order? For any list of 4+ items, split into one card per item. The question becomes specific: "What is the FIRST step in X?" not "What are all the steps in X?"

2. **Never create true/false cards.** True/false cards require only recognition, not recall. A learner who has never seen the material can answer correctly 50% of the time by chance. They produce false confidence and poor long-term retention. Replace every true/false card with a basic recall or cloze card.

3. **Never use negatively phrased questions.** Questions like "Which of the following is NOT a function of the liver?" or "What is NOT true about ionic bonds?" are ambiguous and cognitively confusing. They require the learner to hold all false options in working memory simultaneously. Rephrase as positive questions: "Name one function of the liver that distinguishes it from the pancreas."

4. **Every answer must be verifiably correct and self-contained.** Do not write "See your textbook for the full list" or "Refer to the diagram in Chapter 4." If the information cannot fit on a card in under 40 words and be independently verified as correct, it should not be a flashcard -- suggest the concept-mapping or note-taking skill instead.

5. **Cloze deletions must blank meaningful terms, not filler words.** "The mitochondria is {{c1::the}} powerhouse of the cell" is useless. "The {{c1::mitochondria}} is the powerhouse of the cell" is correct. The blanked term must be the exact piece of knowledge being tested.

6. **Never include multiple cloze deletions in one sentence that are dependent on each other.** If a learner must know c1 to answer c2, the sentence must be split into separate cards. Anki's c1/c2 syntax can appear in one card only when the two blanks are fully independent.

7. **For application cards, the scenario must be specific enough to have one correct answer.** "What would you do in an ethical dilemma?" is not an application card -- it is an essay prompt. "A patient presents with elevated serum creatinine and decreased urine output 48 hours post-surgery. What does this indicate and what is the most likely mechanism?" is a proper application card.

8. **Maintain factual accuracy above all other considerations.** If the source material provided by the user contains an error, note it explicitly before generating the card. Do not reproduce the error in the card. If uncertain about a fact in the source material, flag it with a note in the Quality Notes section rather than writing a card with a potentially incorrect answer.

9. **For Anki import format, use only plain text with no markdown inside the tab-separated block.** Anki will render HTML, not Markdown. Bold should be written as `<b>term</b>`, not `**term**`. Line breaks inside a card should use `<br>`, not newlines. Failure to follow this rule produces garbled card formatting inside Anki.

10. **Always generate at least three distinct card types per set unless the content genuinely does not support them.** A deck composed entirely of basic cards is a missed opportunity -- cloze cards produce stronger encoding for definitions, and reverse cards are essential for vocabulary. The only exception is a very short set (under 8 cards) or a set with a single concept type (e.g., a list of dates where only basic cards apply).

11. **Never exceed 60 cards in a single output batch.** Long outputs degrade quality and overwhelm the learner. For large content sets, generate the first batch, label it "Part 1 of N," and ask the learner to confirm before continuing.

12. **Do not invent information not present in the source material.** If the user's notes say "the powerhouse of the cell" without specifying the function further, write a card about what is stated. Do not add information about ATP synthesis, cristae, or the inner membrane unless the source explicitly includes it. If important related concepts are clearly absent, flag them in the Quality Notes section as "Consider adding cards on X."

---

## Edge Cases

### Very Dense Source Material (100+ Distinct Concepts in One Session)

When a user pastes a full textbook chapter, a dense set of lecture notes, or a comprehensive review document, do not attempt to cover everything at once.

- **First, audit the content:** Identify the 20-30 highest-yield concepts (most frequently tested in the domain, most foundational for understanding the rest) and generate cards for those first.
- **Label the output clearly:** "Part 1 of 3 -- Batch 1: Foundational Concepts (Cards 1-30)." Inform the user how many additional batches will follow.
- **Create a deck map:** Before generating cards, output a brief outline of how the full content will be organized across subdecks. Get user approval before proceeding.
- **Subdeck naming for Anki:** Use the format `Subject::Chapter::Subtopic` so cards are automatically organized in Anki's deck hierarchy. For example, `Biochemistry::Glycolysis::Enzymes`.

### Process-Based Knowledge (Sequential Steps, Protocols, Workflows)

Content like the steps of PCR, the stages of mitosis, the phases of the action potential, or legal procedures cannot be turned into a single "list all steps" card without violating the minimum information principle.

- **Use the forward-chaining cloze method:** Create one cloze card per step, with the full process visible as the stem and only the specific step blanked. For example: "In PCR, after the denaturation step at 94-98°C, the next step is {{c1::annealing}}, in which primers bind to the template at [temperature]."
- **Create sequence-recall cards:** "What is the step that immediately follows denaturation in PCR?" These test order without requiring the learner to recite the full sequence from memory.
- **Create purpose cards for each step:** "What is the purpose of the annealing step in PCR?" This tests comprehension, not just rote sequence memorization.
- **Do NOT create a single card asking for all steps in order** unless the process has exactly 3 steps or fewer and the steps are always recalled as a unit.

### Language Learning Vocabulary and Grammar

Language flashcards have specific requirements that differ substantially from content-area flashcards.

- **Always create bidirectional cards:** Every vocabulary item needs a card in both directions -- target language → native language AND native language → target language. These are different cognitive skills and must be practiced separately.
- **Include example sentences:** Add a third card for high-frequency vocabulary: a fill-in-the-blank card where the target word is missing from a natural example sentence. This builds contextual recall and prevents out-of-context memorization that fails in actual use.
- **Include grammatical metadata on the card back:** For nouns, include gender and plural form. For verbs, include the infinitive and indicate regularity. For languages with cases, include the nominative and genitive forms.
- **Pronunciation guidance:** For languages with non-phonetic orthography (French, English, Mandarin, Arabic), include a phonetic transcription (IPA or romanization such as Pinyin for Mandarin, Hepburn for Japanese) on the back of the card. For tonal languages, include the tone number or tone mark prominently.
- **For grammar patterns:** Create two types of grammar cards. First, a rule card: "What is the word order for questions in German? State the rule." Second, a production card: "Translate: 'Do you speak English?' → German." The production card tests the rule under realistic conditions.
- **Cognates and false friends:** Flag false friends (words that look like known words but mean something different) with a discrimination card: "Spanish 'embarazada' means ___. NOT ___."

### Formulas, Equations, and Mathematical Relationships

Mathematical content requires a family of cards per formula, not a single card.

- **Card Family Structure for each formula:**
  - **Name card:** "What formula is used to calculate [quantity]?" Answer: The formula itself.
  - **Variable card (one per variable):** "In the formula PV = nRT, what does the variable R represent?" Answer: "The ideal gas constant, 8.314 J/(mol·K)."
  - **Unit card:** "What are the SI units for pressure in the ideal gas law?" Answer: Pascals (Pa).
  - **Selection card:** "A sealed container of gas is heated at constant volume. Which law or formula governs the pressure-temperature relationship?" Answer: Gay-Lussac's Law, P₁/T₁ = P₂/T₂.
  - **Calculation card:** "A gas occupies 2.0 L at 300 K. What volume does it occupy at 600 K (constant pressure)?" Answer: "4.0 L, by Charles's Law: V₁/T₁ = V₂/T₂."
- **Write formulas using plain text conventions** that render cleanly in flashcard apps: use ^ for exponents (E = mc^2), / for division (PV = nRT), and Greek letter names spelled out or using Unicode characters (ΔG, Σ, μ) rather than LaTeX syntax unless the user has confirmed LaTeX rendering in their app.

### Highly Visual Content (Anatomy, Geography, Circuit Diagrams, Histology)

When source content is inherently visual and images cannot be generated, handle the limitation explicitly.

- **Acknowledge the limitation upfront:** Tell the user that image occlusion cards cannot be generated as actual images, but you will provide the verbal equivalent and instructions for creating the visual card themselves.
- **Verbal image occlusion format:** "On a diagram of the human heart, the structure that receives oxygenated blood from the pulmonary veins is the ___." Answer: "Left atrium." This verbal approximation tests the same spatial knowledge.
- **Reference card:** "On a diagram of [X], label [structure Y]. Note: Create an image occlusion card using your own diagram in Anki's Image Occlusion Enhanced add-on."
- **For anatomy:** Create cards for (1) name the structure given its location, (2) give the location given the name, (3) state the function given the name, (4) name the adjacent or related structure.
- **For geography:** Use compass-direction cards ("Which body of water lies to the east of the Iberian Peninsula?") rather than relying on map visualization.

### User-Provided Content Contains Errors or Ambiguities

Users frequently paste imperfect source material -- lecture notes with gaps, informal summaries with inaccuracies, or content that contradicts established knowledge.

- **Do not silently reproduce errors.** If source material says "mitosis produces 4 genetically distinct daughter cells" (which is incorrect -- that describes meiosis), do not write the card with the incorrect information.
- **Flag the error explicitly:** "Note: Your source material states [X]. This appears to conflict with [correct information]. I have written the card with the correct information [correct version]. Please verify against your primary textbook."
- **For ambiguous statements:** If the source says something that could be interpreted two ways, write the card for the most standard interpretation and note the ambiguity. Do not guess silently.
- **For incomplete information:** If a key term appears in the source but is never defined, add a definition card and mark it: "Definition added -- not in source. Verify this definition matches your course materials."

### Learner is a Complete Beginner to the Subject

Beginning learners need scaffolded card sets that would be inappropriate for advanced learners reviewing before an exam.

- **Prioritize vocabulary cards:** At least 40% of cards for a beginner deck should be term-definition cards, because comprehension of relational and application cards requires knowing the terms.
- **Add "why does this matter" cards:** "Why is the concept of homeostasis important in biology?" with a one-sentence answer. These orientation cards are inefficient for experts but essential for beginners who need to understand why they are memorizing the fact.
- **Reduce application cards:** Limit application cards to 10-15% of the deck for beginners. They should not encounter application cards until they have reviewed the foundational cards at least once.
- **Include example cards:** "Give one everyday example of osmosis." Answer: "Water moving from a dilute salt solution into a more concentrated one across a semipermeable membrane, as in kidney function." These context anchors help beginners form initial mental models.

---

## Example

**Input:** "I'm studying for my pharmacology shelf exam next week. Here are my notes on beta-blockers. Can you make Anki cards from this? Notes: Beta-blockers block beta-adrenergic receptors. Beta-1 receptors are found mainly in the heart. Beta-2 receptors are in the lungs, vasculature, and liver. Selective (cardioselective) beta-blockers block only beta-1: metoprolol, atenolol, esmolol. Non-selective beta-blockers block both: propranolol, carvedilol (also blocks alpha-1), labetalol (also blocks alpha-1). Beta-blockers are used for hypertension, heart failure, angina, arrhythmias, post-MI protection. Contraindicated in asthma/COPD (bronchospasm), decompensated heart failure, bradycardia, heart block. Side effects: bradycardia, fatigue, erectile dysfunction, masking of hypoglycemia symptoms. Propranolol is the non-selective prototype. Metoprolol is the cardioselective prototype. Esmolol is ultra-short acting (t½ ~9 minutes), IV only, used in acute settings."

---

## Flashcard Set: Beta-Blockers

**Subject:** Pharmacology -- Medical (Shelf Exam)
**Source Material:** Student notes on beta-adrenergic antagonists
**Total Cards:** 32
**Card Types Used:** Basic, Cloze, Reverse, Application, Discrimination
**Format:** Anki (tab-separated import block provided)
**Tags:** `pharm::beta-blockers`, `exam-priority::high`
**Study Priority:** HIGH -- Exam next week. Study all cards within 2 days to allow 2 review cycles.

---

### Card Set

**Card 1** [Type: Basic]
**Tag:** `pharm::beta-blockers::mechanism` | **Difficulty:** 1
- Front: What is the mechanism of action of beta-blockers?
- Back: They competitively block beta-adrenergic receptors, preventing catecholamines (epinephrine, norepinephrine) from binding.

**Card 2** [Type: Basic]
**Tag:** `pharm::beta-blockers::receptors` | **Difficulty:** 1
- Front: Where are beta-1 adrenergic receptors predominantly located?
- Back: The heart (primarily) -- also kidneys and eyes.

**Card 3** [Type: Basic]
**Tag:** `pharm::beta-blockers::receptors` | **Difficulty:** 1
- Front: Where are beta-2 adrenergic receptors predominantly located?
- Back: Lungs, vascular smooth muscle, and liver.

**Card 4** [Type: Cloze]
**Tag:** `pharm::beta-blockers::receptors` | **Difficulty:** 1
- Front: Cardioselective beta-blockers block only {{c1::beta-1}} receptors, while non-selective beta-blockers block both {{c2::beta-1}} and {{c3::beta-2}} receptors.
- Back: [Cloze answers: beta-1 / beta-1 / beta-2]

**Card 5** [Type: Basic]
**Tag:** `pharm::beta-blockers::drugs::selective` | **Difficulty:** 1
- Front: Name three cardioselective (beta-1 selective) beta-blockers.
- Back: Metoprolol, atenolol, esmolol. (Memory aid: "MIAMI" -- Metoprolol, I (esmolol), Atenolol, More selective, I think)

**Card 6** [Type: Reverse]
**Tag:** `pharm::beta-blockers::drugs::nonselective` | **Difficulty:** 1
- Front A: Propranolol -- selective or non-selective? Which receptors does it block?
- Back A: Non-selective. Blocks both beta-1 and beta-2 receptors.
- Front B: Which non-selective beta-blocker is the prototype drug for the class?
- Back B: Propranolol.

**Card 7** [Type: Basic]
**Tag:** `pharm::beta-blockers::drugs::nonselective` | **Difficulty:** 2
- Front: What makes carvedilol and labetalol different from propranolol?
- Back: Carvedilol and labetalol also block alpha-1 receptors (in addition to beta-1 and beta-2), providing additional vasodilation.

**Card 8** [Type: Cloze]
**Tag:** `pharm::beta-blockers::drugs::nonselective` | **Difficulty:** 1
- Front: Carvedilol blocks {{c1::alpha-1}}, {{c2::beta-1}}, and {{c3::beta-2}} receptors.
- Back: [Cloze answers: alpha-1 / beta-1 / beta-2]

**Card 9** [Type: Basic]
**Tag:** `pharm::beta-blockers::drugs::esmolol` | **Difficulty:** 2
- Front: What is the half-life of esmolol, and what does this make it suitable for?
- Back: Half-life ~9 minutes. It is ultra-short acting, IV only, used in acute settings such as intraoperative hypertension and SVT.

**Card 10** [Type: Reverse]
**Tag:** `pharm::beta-blockers::drugs::esmolol` | **Difficulty:** 1
- Front A: Esmolol -- selective or non-selective? Route of administration?
- Back A: Cardioselective (beta-1). IV only.
- Front B: Which beta-blocker is ultra-short acting with a half-life of ~9 minutes?
- Back B: Esmolol.

**Card 11** [Type: Basic]
**Tag:** `pharm::beta-blockers::indications` | **Difficulty:** 1
- Front: Name four clinical indications for beta-blockers.
- Back: Hypertension, angina, heart failure (stable, compensated), cardiac arrhythmias, and post-MI cardioprotection.

**Card 12** [Type: Basic]
**Tag:** `pharm::beta-blockers::indications` | **Difficulty:** 2
- Front: Why are beta-blockers used in stable heart failure despite reducing cardiac contractility?
- Back: They reduce chronic sympathetic overstimulation that causes maladaptive cardiac remodeling, improving long-term outcomes even though they acutely reduce contractility.

**Card 13** [Type: Basic]
**Tag:** `pharm::beta-blockers::contraindications` | **Difficulty:** 2
- Front: Why are non-selective beta-blockers contraindicated in asthma and COPD?
- Back: Blocking beta-2 receptors in the airways causes bronchoconstriction/bronchospasm, which can be life-threatening in patients with reactive airway disease.

**Card 14** [Type: Basic]
**Tag:** `pharm::beta-blockers::contraindications` | **Difficulty:** 2
- Front: Why are beta-blockers contraindicated in decompensated heart failure?
- Back: Decompensated heart failure requires sympathetic drive to maintain cardiac output. Beta-blockade acutely reduces contractility and heart rate, worsening decompensation.

**Card 15** [Type: Basic]
**Tag:** `pharm::beta-blockers::contraindications` | **Difficulty:** 1
- Front: Name four contraindications to beta-blocker use.
- Back: Asthma/COPD (bronchospasm risk), decompensated heart failure, bradycardia, and second- or third-degree heart block.

**Card 16** [Type: Cloze]
**Tag:** `pharm::beta-blockers::contraindications` | **Difficulty:** 2
- Front: In a patient with asthma who requires a beta-blocker, the preferred choice is a {{c1::cardioselective}} agent such as {{c2::metoprolol}} or {{c3::atenolol}}, used with caution.
- Back: [Cloze answers: cardioselective / metoprolol / atenolol]

**Card 17** [Type: Basic]
**Tag:** `pharm::beta-blockers::side-effects` | **Difficulty:** 1
- Front: Name four adverse effects of beta-blockers.
- Back: Bradycardia, fatigue, erectile dysfunction, and masking of hypoglycemia symptoms (tachycardia is blunted, though sweating is preserved).

**Card 18** [Type: Basic]
**Tag:** `pharm::beta-blockers::side-effects` | **Difficulty:** 2
- Front: Why do beta-blockers mask hypoglycemia, and what symptom is NOT masked?
- Back: They block beta-adrenergic symptoms of hypoglycemia (tachycardia, tremor). Diaphoresis (sweating) is NOT masked because it is cholinergically mediated.

**Card 19** [Type: Application]
**Tag:** `pharm::beta-blockers::clinical-reasoning` | **Difficulty:** 3
- Front: A 58-year-old man with hypertension and a history of asthma needs antihypertensive therapy. A colleague suggests metoprolol. Is this appropriate? Explain.
- Back: Potentially, with caution. Cardioselective agents like metoprolol have reduced risk of bronchospasm compared to non-selective agents, but are not without risk in severe asthma. An ACE inhibitor or calcium channel blocker may be safer as a first choice.

**Card 20** [Type: Application]
**Tag:** `pharm::beta-blockers::clinical-reasoning` | **Difficulty:** 3
- Front: A diabetic patient on insulin presents with diaphoresis but no palpitations and a blood glucose of 42 mg/dL. She takes a beta-blocker. What is the explanation?
- Back: Beta-blockers mask the adrenergic symptoms of hypoglycemia (palpitations, tremor) but not diaphoresis, which is cholinergically mediated. The patient experienced hypoglycemia with masked sympathetic warning signs.

**Card 21** [Type: Application]
**Tag:** `pharm::beta-blockers::clinical-reasoning` | **Difficulty:** 3
- Front: A patient arrives in the ER with SVT and a heart rate of 170 bpm. The team wants a rapid-acting IV beta-blocker that can be titrated and stopped quickly if needed. Which agent is ideal?
- Back: Esmolol -- ultra-short acting (t½ ~9 min), IV administration, cardioselective, easily titratable and rapidly reversible.

**Card 22** [Type: Application]
**Tag:** `pharm::beta-blockers::clinical-reasoning` | **Difficulty:** 3
- Front: Why would you choose carvedilol over metoprolol in a patient with heart failure and hypertension who needs beta-blockade?
- Back: Carvedilol also blocks alpha-1 receptors, providing vasodilation in addition to cardiac effects. Evidence supports carvedilol specifically for heart failure (HFrEF) with improved mortality outcomes.

**Card 23** [Type: Discrimination]
**Tag:** `pharm::beta-blockers::compare` | **Difficulty:** 2
- Front: How does esmolol differ from metoprolol? (Consider selectivity, duration, and route.)
- Back: Both are cardioselective (beta-1). Esmolol is ultra-short (t½ ~9 min), IV only, used acutely. Metoprolol is oral (also available IV), longer-acting, used chronically.

**Card 24** [Type: Discrimination]
**Tag:** `pharm::beta-blockers::compare` | **Difficulty:** 2
- Front: How does carvedilol differ from propranolol? (Consider receptor profile and clinical use.)
- Back: Both are non-selective beta-blockers. Carvedilol additionally blocks alpha-1 (vasodilation), and has evidence specifically for heart failure mortality reduction. Propranolol is the older non-selective prototype, used for arrhythmias, hypertension, and tremor.

**Card 25** [Type: Basic]
**Tag:** `pharm::beta-blockers::prototype` | **Difficulty:** 1
- Front: What is the prototype non-selective beta-blocker?
- Back: Propranolol.

**Card 26** [Type: Basic]
**Tag:** `pharm::beta-blockers::prototype` | **Difficulty:** 1
- Front: What is the prototype cardioselective beta-blocker?
- Back: Metoprolol.

**Card 27** [Type: Cloze]
**Tag:** `pharm::beta-blockers::side-effects` | **Difficulty:** 1
- Front: Beta-blockers can cause {{c1::bradycardia}} and are therefore contraindicated in patients with pre-existing {{c2::bradycardia}} or {{c3::heart block}}.
- Back: [Cloze answers: bradycardia / bradycardia / heart block]

**Card 28** [Type: Basic]
**Tag:** `pharm::beta-blockers::indications` | **Difficulty:** 2
- Front: What is the role of beta-blockers in post-MI management?
- Back: They reduce cardiac oxygen demand, prevent arrhythmias, and reduce reinfarction risk. They should be started in all hemodynamically stable post-MI patients without contraindications.

**Card 29** [Type: Cloze]
**Tag:** `pharm::beta-blockers::drugs::selective` | **Difficulty:** 1
- Front: The mnemonic for cardioselective beta-blockers is "A-M-E-B": {{c1::Atenolol}}, {{c2::Metoprolol}}, {{c3::Esmolol}}, {{c4::Bisoprolol}}.
- Back: [Cloze answers: Atenolol / Metoprolol / Esmolol / Bisoprolol]

**Card 30** [Type: Application]
**Tag:** `pharm::beta-blockers::clinical-reasoning` | **Difficulty:** 3
- Front: You are about to give a patient their first dose of a beta-blocker for newly diagnosed heart failure. What clinical signs must you confirm before administering?
- Back: Confirm the patient is hemodynamically compensated (not acutely decompensated): adequate blood pressure, no signs of acute pulmonary edema, heart rate above 60 bpm, and no high-degree heart block.

**Card 31** [Type: Basic]
**Tag:** `pharm::beta-blockers::mechanism` | **Difficulty:** 2
- Front: What are two cardiovascular effects of blocking beta-1 receptors in the heart?
- Back: Decreased heart rate (negative chronotropy) and decreased force of contraction (negative inotropy).

**Card 32** [Type: Basic]
**Tag:** `pharm::beta-blockers::mechanism` | **Difficulty:** 2
- Front: What is the consequence of blocking beta-2 receptors in the lungs?
- Back: Bronchoconstriction -- which is why non-selective beta-blockers are dangerous in asthma and COPD.

---

### Deck Structure and Study Order

| Phase | Card Numbers | Focus | Prerequisite For |
|-------|-------------|-------|-----------------|
| Foundation | 1-4 | Mechanism and receptor locations | All phases |
| Drug Profiles | 5-10, 25-29 | Specific drugs, selectivity, half-lives | Application phase |
| Indications & Contraindications | 11-16, 28 | Clinical use and when to avoid | Application phase |
| Side Effects | 17-18, 27 | Adverse effects and mechanisms | Application phase |
| Application | 19-22, 30 | Clinical reasoning scenarios | Discrimination phase |
| Discrimination | 23-24, 31-32 | Distinguishing similar drugs/concepts | None |

**Recommended daily new card limit:** 16 cards/day (complete first pass in 2 days)
**Estimated time to first pass:** 2 days at this pace, leaving 5 days for spaced repetition review before the exam.

---

### Priority Flags

- **High priority (review first):** Cards 1, 2, 3, 5, 6, 13, 15, 17, 18 -- These cover mechanism, selectivity, and key contraindications most likely to appear on shelf exams.
- **Conceptually difficult (expect multiple review sessions):** Cards 12, 14, 18, 20, 22 -- These require understanding the reasoning, not just the fact.
- **Safe to de-prioritize if time is short:** Cards 8, 27, 29 -- These are cloze reinforcement cards for facts already covered in basic cards.

---

### Quality Notes

- Cards 5 and 29: Bisoprolol was added in Card 29's mnemonic but does not appear in your original notes. Verify that bisoprolol is covered in your course syllabus before studying this card.
- Card 11 lists five indications with a prompt asking to "name four" -- this reflects that there are at least five valid answers. Any four are acceptable on the exam.
- Card 12 requires conceptual understanding of HFrEF management beyond what your notes stated. Verify this explanation against your pharmacology textbook (the Katzung or Goodman & Gilman chapter on adrenergic antagonists).
- Your notes did not include the mechanism of beta-blocker effect on renin secretion (blocking beta-1 in the kidney reduces renin, contributing to antihypertensive effect). Consider adding a card for this if it appears in your course materials.

---

### Anki Import Block (tab-separated)

*Import via File > Import in Anki. Select note type "Basic" for all cards except Cards 4, 8, 16, 27, 29 (use "Cloze" type). For Cards 6 and 10 (Reverse), use "Basic (and reversed card)".*

```text
What is the mechanism of action of beta-blockers?	They competitively block beta-adrenergic receptors, preventing catecholamines from binding.	pharm::beta-blockers::mechanism
Where are beta-1 adrenergic receptors predominantly located?	The heart (primarily) -- also kidneys and eyes.	pharm::beta-blockers::receptors
Where are beta-2 adrenergic receptors predominantly located?	Lungs, vascular smooth muscle, and liver.	pharm::beta-blockers::receptors
Cardioselective beta-blockers block only {{c1::beta-1}} receptors, while non-selective beta-blockers block both {{c2::beta-1}} and {{c3::beta-2}} receptors.	[Cloze card]	pharm::beta-blockers::receptors
Name three cardioselective (beta-1 selective) beta-blockers.	Metoprolol, atenolol, esmolol.	pharm::beta-blockers::drugs::selective
What is the half-life of esmolol, and what does this make it suitable for?	Half-life ~9 minutes. IV only, used acutely for SVT and intraoperative hypertension.	pharm::beta-blockers::drugs::esmolol
Why are non-selective beta-blockers contraindicated in asthma and COPD?	Blocking beta-2 in airways causes bronchoconstriction/bronchospasm.	pharm::beta-blockers::contraindications
Why do beta-blockers mask hypoglycemia, and what symptom is NOT masked?	They block adrenergic symptoms (tachycardia, tremor). Diaphoresis (sweating) is NOT masked -- it is cholinergically mediated.	pharm::beta-blockers::side-effects
```
