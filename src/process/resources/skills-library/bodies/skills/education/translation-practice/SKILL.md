---
name: translation-practice
description: |
  Creates translation exercises with source text, target language guidance, and quality criteria for language learners practicing translation skills. Produces practice exercises with model translations.
  Use when a learner asks to practice translating between languages, improve translation accuracy, or do translation exercises.
  Do NOT use for conversation practice (use `conversation-practice`), for grammar instruction (use `grammar-practice`), or for professional translation work (not an education skill).
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
# Translation Practice

## When to Use

Use this skill when any of the following conditions are met:

- A learner asks to practice translating sentences, paragraphs, or short texts from one language into another and wants feedback or a model answer to compare against
- A learner wants to build translation accuracy and fluency between a specific language pair (e.g., French to English, Japanese to Spanish, Arabic to German) and needs structured exercises with graduated difficulty
- A learner is preparing for a formal translation exam -- such as the DELF/DALF (French), JLPT translation tasks, HSK writing sections, or DELE (Spanish) -- and needs targeted practice with quality benchmarks
- A learner wants to understand WHY their translation failed -- not just what the correct answer is -- including identifying calques, false cognates, register errors, and structural interference from their L1
- A learner is working on a specific text type (literary prose, news journalism, academic writing, everyday dialogue) and wants genre-appropriate translation exercises rather than generic sentence drills
- A learner studying a heritage language wants to formalize and refine their intuitive bilingual knowledge into precision translation skills

**Do NOT use when:**

- The user wants to practice speaking or listening in a new language -- use `conversation-practice` instead, which handles oral fluency and dialogue simulation
- The user wants grammar explanation or drill work on conjugations, cases, or syntax rules -- use `grammar-practice` instead, which is structured for paradigm learning and rule internalization
- The user is asking for a professional translation of a business document, legal contract, or publication -- this is educational practice, not professional translation services
- The user wants vocabulary building through flashcards, spaced repetition, or word lists -- use `vocabulary-building` instead
- The user is a teacher designing a curriculum or lesson plan for a classroom -- this skill generates learner-facing exercises, not educator-facing curricula
- The user wants pronunciation or phonetics practice -- translation is a written skill and this skill does not address phonological work
- The request is for purely mechanical substitution (e.g., "translate this for me so I can use it") -- this skill is for deliberate learning, not task completion

---

## Process

### Step 1: Establish the learner's profile

Before generating any exercises, collect or infer the following:

- **Language pair:** Identify source language (L1 or the language of the source text) and target language (the language they are translating INTO). Both matter -- interference patterns and difficulty spikes differ dramatically between pairs (e.g., English into Finnish versus English into Dutch).
- **Proficiency level:** Calibrate using CEFR descriptors (A1--C2) or equivalent. Ask the learner directly, or infer from any sample text they provide. Learners often underestimate themselves at B1 and overestimate at B2.
- **Text type preference or exam target:** Literary, journalistic, academic, conversational, or technical prose each demand different competencies. Ask what type of text the learner encounters most or needs to master.
- **Session goal:** Is the goal accuracy (preserving meaning faithfully), fluency (producing natural-sounding target text), or style awareness (matching register, tone, and author voice)? Most sessions mix all three, but knowing the primary emphasis shapes which exercises to prioritize.
- **Time available:** A 20-minute session should produce 2 exercises maximum. A 60-minute deep session can handle 4--5 exercises with full error analysis.

If the learner provides no context, begin with a brief intake: ask for the language pair, their approximate level, and one sentence they recently struggled to translate or a text type they care about. Do not proceed with generic filler exercises.

---

### Step 2: Select source texts appropriate to level and text type

The source text is the single most important variable in translation practice. Apply these selection principles:

- **A1--A2 (Beginner):** 1--2 sentences maximum per exercise. Use high-frequency vocabulary. Favor SVO sentence structures. Avoid subordinate clauses, ellipsis, and cultural specificity. Example texts: weather descriptions, introductions, simple instructions.
- **B1--B2 (Intermediate):** 3--5 sentences per exercise. Introduce compound and complex sentences, some idiomatic phrasing, and light cultural reference. Tense variety matters at this level -- ensure the source text exercises the tenses that cause the most interference between the specific language pair.
- **C1--C2 (Advanced):** 5--10 sentence passages. Use authentic excerpts from journalism, literary fiction, legal text, or academic writing. Include ellipsis, anaphora, implicit reference, and style markers. At this level, the challenge is not vocabulary but register, rhythm, and cultural negotiation.
- **Text length rule:** Never exceed what the learner can complete in one uninterrupted session. Longer texts should be broken into 2--3 discrete exercises within the session rather than presented as a single block.
- **Authenticity principle:** Whenever possible, construct source texts that reflect real-world usage patterns, including the ambiguities, collocations, and register markers that learners will encounter in authentic materials. Avoid hyper-simplified "textbook" sentences at B1 and above -- they teach translation of a language that does not exist in the wild.
- **Difficulty gradient within a session:** The first exercise should sit at or just below the learner's stated level (to build confidence and establish baseline). The second and third exercises should introduce one or two new challenge variables each -- a new tense, an idiom, a subordinate clause chain, or a cultural reference requiring adaptation.

---

### Step 3: Identify and flag the translation challenges in each source text BEFORE the learner translates

Do not withhold challenge information the way a "test" would. This is deliberate learning practice, not assessment. Before presenting each exercise:

- **Annotate vocabulary items** the learner is unlikely to know at their level. Provide these in a vocabulary support table with the source word, a neutral gloss, and a usage note (e.g., whether the word is formal, colloquial, has a false cognate, or behaves differently in the target language).
- **Flag structural divergences** between the source and target language that will require reordering or restructuring -- not just word substitution. For example: German verb-final subordinate clauses when translating to English; French double negation when translating to English; Japanese topic-comment structure when translating to any European language.
- **Name the likely error type** before the learner attempts the translation, so they can watch for it. Use the taxonomy: calque (word-for-word structural copying), false cognate error, register mismatch, untranslated cultural reference, tense misalignment, pronoun drop error, or article/determiner error.
- **For advanced learners (C1--C2):** Add a "style note" describing the author's register, sentence rhythm, and the key stylistic choice that any good translation must preserve (e.g., "the author uses asyndeton to create urgency -- preserve this in your translation by resisting the urge to add conjunctions").

---

### Step 4: Present the exercise and elicit the learner's translation

Structure each exercise in this sequence:

- Present the source text clearly, labeled with the source language
- Provide the vocabulary support table (beginner and intermediate) or style notes (advanced)
- Leave an explicit space labeled "Your translation:" -- this signals the learner to stop reading, attempt the exercise, and then return
- Provide clear instructions on what quality criteria will be applied when the learner compares their work to the model translation

If the session is asynchronous (the learner is practicing independently), instruct them to cover the model translation and attempt their own version before reading further. If the session is interactive (the learner shares their attempt with the AI), wait for the learner's attempt before revealing the model translation -- this is critical for learning transfer.

---

### Step 5: Provide the model translation with annotated explanation

The model translation is not just a "correct answer" -- it is a teaching document. For each exercise:

- Present the model translation clearly, labeled as "Model translation" (not "correct translation" -- there are often multiple valid translations)
- Immediately follow with a **decision log** of 3--5 specific choices made in the model translation and why. Example: "The French phrase 'avoir le cafard' was rendered as 'to feel down' rather than 'to have the cockroach' (a literal calque) or 'to be depressed' (too clinical for conversational register) because the context is informal speech between friends."
- For intermediate and advanced learners, present 1--2 alternative valid translations alongside the model, showing that translation is a decision space, not a lookup table
- Calculate and display an approximate **translation fidelity score** for the model using the four quality dimensions: Accuracy, Fluency, Register, and (where applicable) Style. This gives the learner a benchmark framework to self-assess their own attempt.

---

### Step 6: Conduct error analysis on the learner's attempt (if provided)

When the learner shares their translation, apply systematic error analysis:

- **Classify each deviation** from the model using the error taxonomy: meaning error (semantic shift or omission), grammatical error (morphological or syntactic), register error (wrong formality level), style error (loss of author's voice), or acceptable variation (different but equally valid)
- **Never penalize acceptable variation.** If the learner chose a synonym or restructured a clause in a way that preserves meaning, fluency, and register, mark it as valid even if it differs from the model.
- **Prioritize errors by impact:** Meaning errors are highest priority. Grammatical errors that impede comprehension are second. Style and register errors are third. Minor word choice differences with no functional impact should be noted but not overcorrected.
- **For each meaning or grammar error, provide the minimum correction** -- do not rewrite the entire translation. Isolate the specific phrase or clause that failed and show the repair.
- **Identify the root cause** behind each error, not just the surface symptom. "You wrote 'I have 30 years' in English" is insufficient feedback. "You applied Spanish age expression syntax ('tengo 30 años') directly to English, which requires 'I am 30 years old' -- this is an L1 structural interference pattern called a calque" is actionable feedback.
- Compile all errors into the **Error Analysis Table** format defined in the Output Format section.

---

### Step 7: Score the translation and generate targeted next-step recommendations

After error analysis, synthesize a session assessment:

- Assign scores on each of the four quality dimensions (1--4 scale: 1=significant work needed, 2=developing, 3=competent, 4=near-native or mastery) based on the error analysis
- Identify the **primary skill gap** -- the one dimension where the learner lost the most points -- and name the targeted exercise type that addresses it
- Provide 2--3 specific next-step recommendations with concrete practice types. Example: "Your accuracy is strong (4/4) but fluency needs work (2/4) -- your translations are correct but sound unnatural. Next session, practice back-translation: translate a native-speaker text from your target language back into the source, then compare your back-translation with the original. This builds intuition for natural phrasing."
- Connect to broader skill development: if the learner has a consistent weakness (e.g., always dropping articles when translating into a language that uses them), flag it as a structural pattern to address over multiple sessions

---

### Step 8: Offer a self-check rubric and follow-up path

Close the session with:

- A clean **self-assessment checklist** the learner can use on any future translation attempt independently
- A **session summary** of errors made, patterns identified, and progress relative to their level
- A clear recommendation for when to do the next practice session (for language learning, spaced repetition suggests returning to the same text type within 3--5 days to reinforce gains before they decay)

---

## Output Format

```
## Translation Practice Session

**Language Pair:** [Source Language] → [Target Language]
**CEFR Level:** [A1 / A2 / B1 / B2 / C1 / C2]
**Text Type:** [Conversational / Journalistic / Literary / Academic / Technical]
**Session Focus:** [Accuracy / Fluency / Register / Style]
**Session Length:** [Number of exercises]

---

### Exercise [N]: [Short Descriptive Title]

**Source Text ([Language]):**
> [Source text presented in block quote for visual clarity]

**Vocabulary Support:**
| Source Word/Phrase | Literal Meaning | Recommended Gloss | Note |
|-------------------|----------------|-------------------|------|
| [word] | [literal] | [natural equivalent] | [false cognate / formal / idiom / etc.] |

**Structural Note:**
[One brief sentence flagging the key grammatical divergence between source and target languages in this exercise.]

**Challenge to watch for:** [Name the likely error type -- calque, register mismatch, false cognate, etc.]

---

**Your Translation:**
_(Attempt your translation before reading further.)_

---

**Model Translation ([Language]):**
> [Model translation in block quote]

**Translation Decision Log:**
1. "[Source phrase]" → "[Target choice]" -- [Reason: why this choice over alternatives]
2. "[Source phrase]" → "[Target choice]" -- [Reason]
3. "[Source phrase]" → "[Target choice]" -- [Reason]

**Alternative Valid Translations:**
- [Alternative A] -- [What this prioritizes differently]
- [Alternative B] -- [What this prioritizes differently]

**Quality Assessment (Model Translation):**
| Dimension | Score (1--4) | Notes |
|-----------|-------------|-------|
| Accuracy | [Score] | [Specific observation] |
| Fluency | [Score] | [Specific observation] |
| Register | [Score] | [Specific observation] |
| Style | [Score] | [For literary texts only] |

---

### Error Analysis (Learner Attempt)

**Learner's Translation:**
> [Learner's attempt reproduced here]

**Error Analysis Table:**
| Learner's Phrase | Model Equivalent | Error Type | Root Cause | Impact |
|-----------------|-----------------|------------|------------|--------|
| [Phrase] | [Correction] | [Calque / Grammar / Register / Vocabulary / Acceptable variation] | [L1 interference / False cognate / Unknown idiom / etc.] | [High / Medium / Low] |

**Learner Score:**
| Dimension | Score (1--4) | Key Finding |
|-----------|-------------|-------------|
| Accuracy | [Score] | [Specific finding] |
| Fluency | [Score] | [Specific finding] |
| Register | [Score] | [Specific finding] |
| Style | [Score] | [Literary texts only] |

**Primary Skill Gap:** [The one dimension most in need of targeted work]

---

### Session Summary

**Exercises completed:** [N]
**Consistent strengths:** [What the learner reliably did well]
**Consistent errors:** [Error patterns that appeared more than once]
**Primary pattern identified:** [Named error pattern with L1 interference mechanism if applicable]

---

### Next Steps

1. **Immediate (today):** [Specific micro-exercise to address the primary skill gap]
2. **Next session (within 3--5 days):** [Text type and focus for follow-up session]
3. **Medium-term (2--4 weeks):** [Skill development goal and how to measure progress]

---

### Self-Assessment Checklist (Use on any future translation)

- [ ] Does my translation preserve all factual content from the source? (Accuracy)
- [ ] Does my translation sound like something a native speaker would naturally say or write? (Fluency)
- [ ] Does my translation match the formality level of the original? (Register)
- [ ] Have I checked every word that looks like a word I know for false cognate risk? (Vocabulary)
- [ ] Have I restructured any phrase that I translated word-for-word -- does it still work in the target language? (Anti-calque check)
- [ ] Have I preserved the author's tone and rhythm where applicable? (Style)
```

---

## Rules

1. **Never reveal the model translation before the learner attempts the exercise.** In interactive sessions, wait for the learner's version before displaying the model. In asynchronous exercises, always include the "Attempt before reading" instruction and place the model translation clearly after a visual separator. Premature exposure to the model eliminates the learning opportunity.

2. **Never classify all deviations from the model as errors.** Translation is not a lookup table. Multiple valid translations exist for nearly every sentence. Apply the "acceptable variation" category liberally -- mark a deviation as an error only when it changes meaning, violates target-language grammar, mismatches register, or produces unnatural output. Overcorrection destroys learner confidence and teaches false precision.

3. **Always identify the root cause of an error, not just the surface form.** Saying "wrong word" is insufficient. Errors must be classified by mechanism: L1 structural interference (calque), false cognate, unknown idiomatic expression, register misjudgment, grammatical gap in target language knowledge, or cultural reference gap. Root cause identification is what enables targeted remediation.

4. **Scale vocabulary support to level.** At A1--A2, provide glosses for approximately 30--40% of lexical items. At B1--B2, gloss idioms, collocations, and culturally specific items only. At C1--C2, provide no vocabulary glosses -- instead, provide style and register notes. Providing too much vocabulary support at higher levels prevents learners from developing lexical independence.

5. **Never use decontextualized single-word translation exercises for any level above A2.** Single words are learned through vocabulary study skills, not translation practice. Translation practice requires minimum phrase-level or clause-level context to be meaningful, because meaning is constructed in context, not in isolation.

6. **Always match text type to the learner's stated goals.** A learner preparing for business correspondence does not benefit from literary translation exercises, even if the literary exercises are well-crafted. Genre mismatch is one of the most common ways language instruction fails to transfer to real-world use.

7. **The model translation must be genuinely excellent -- not just grammatically correct.** A technically correct but stilted model translation teaches learners to produce technically correct but stilted target text. Model translations must sound natural, appropriate to register, and idiomatic in the target language. If uncertain about the naturalness of a translation in a specific target language, flag this explicitly rather than presenting a potentially unnatural model as authoritative.

8. **Limit each session to a maximum of 5 exercises.** Translation is cognitively intensive work. More than 5 exercises in a single session produces diminishing returns and cognitive fatigue. Quality of engagement with fewer exercises outperforms quantity. For learners who want more, recommend a second session after a rest period.

9. **Always use the CEFR framework for level calibration, but treat it as a starting point, not a fixed label.** A learner may be B2 in reading comprehension but only B1 in production -- meaning they can understand C1 source texts but struggle to produce B2-level target text. Calibrate exercises to production level, not comprehension level, since translation output quality is bounded by production ability.

10. **Do not conflate translation practice with language learning through translation.** Translation practice assumes the learner already has functional knowledge of both languages and is developing precision. If the learner cannot yet read the source text with reasonable comprehension (~80% understanding without support), the prerequisite is comprehension development in the source language, not translation practice. Redirect such learners to reading and vocabulary skills first.

---

## Edge Cases

### The learner's native language is neither the source nor the target language (L3 translation)

This arises when, for example, a native Mandarin speaker is practicing translating French into English. Standard error analysis assumes that L1 interference runs between the learner's native language and the target language -- but in L3 translation, interference can run from L1 to both languages simultaneously, or between the two non-native languages. Handle by: asking the learner to identify their native language at the intake step; noting in the error analysis which errors appear to stem from L1 interference versus L2-to-L3 interference; and being explicit that model translations in L3 sessions should be treated with even more emphasis on naturalness checking, since the AI itself should acknowledge limitations in certifying native-speaker naturalness across all three languages simultaneously.

### The learner produces a translation that is radically different from the model but not obviously wrong

This happens frequently with idiomatic or literary texts. A learner might render an idiom with a completely different idiom that carries equivalent meaning and register. Rather than marking this as an error, treat it as an opportunity to discuss translation philosophy: ask the learner to explain their choice, then compare the two options across the quality dimensions. This is one of the highest-value learning interactions in translation practice -- it develops metalinguistic awareness and translation judgment, not just correctness.

### The source language uses a grammatical category that does not exist in the target language

Classic examples: grammatical gender when translating from Spanish to English, politeness honorifics when translating from Japanese to English, aspectual distinctions when translating from Russian to English, or articles when translating from English to Mandarin. These are not errors the learner can fix with vocabulary -- they require a structural strategy decision. Handle by: flagging the category divergence explicitly in the structural note before the exercise; explaining the two or three available strategies (omit, compensate, paraphrase) in the decision log; and scoring the learner's handling of this divergence under the Accuracy dimension with the understanding that any coherent strategy is defensible.

### The learner is using machine translation as a starting point and asking for feedback

This is increasingly common and should not be discouraged -- professional translators routinely use machine translation as a first draft. However, the learning goal must shift: instead of raw translation production, the practice becomes **post-editing**, which is a distinct skill. Adjust the session by: explicitly naming the mode as post-editing practice; assessing whether the learner's edits to the machine-translated output improved accuracy, fluency, and register; identifying which MT errors the learner caught and which they missed; and noting that MT tools systematically struggle with idiom, register, and cultural reference -- which makes these exactly the areas to focus post-editing attention.

### The source text contains culture-specific references that have no direct equivalent in the target culture

Examples: translating a reference to "une grande école" from French to English, or "saudade" from Portuguese, or "Schadenfreude" from German (before it was borrowed into English), or a specific local holiday, legal concept, or food item. There are four standard strategies: borrowing (keep the source term), calque (translate the components literally), functional equivalence (substitute an analogous target-culture concept), and explanatory translation (translate + add a brief explanation). Teach the learner all four strategies, discuss which best fits the text type (borrowing is often acceptable in literary translation; functional equivalence is often better in conversational or journalistic texts), and score accordingly.

### The learner is significantly above or below the level implied by their self-report

If a learner claims B2 but their translation reveals A2-level production, do not correct them directly -- this is demotivating. Instead, quietly adjust the difficulty of the next exercise downward and note privately in the session framing that exercises are calibrated to "build precision at the foundations." Conversely, if a learner claims B1 but translates with near-native fluency, compliment the achievement and offer to move to a C1 exercise, explaining what the C1 challenge introduces. Always keep the learner in the productive challenge zone -- neither too easy (boredom) nor too difficult (panic).

### The learner asks to practice in a language pair involving a language the AI has limited training data on

This includes low-resource languages such as Welsh, Swahili, Faroese, Quechua, or many others. Handle transparently: acknowledge that model translation quality and error analysis reliability are lower for low-resource pairs; still attempt the session but flag specific translations where confidence is limited; emphasize that for low-resource language practice, ideally a native speaker should verify the model translation independently; and provide extra emphasis on structural and register principles rather than specific lexical choices, since structural knowledge is more reliably generalizable than lexical knowledge in low-resource contexts.

---

## Example

**Input:**
"I'm an English speaker learning Spanish, probably B1 level. I want to practice translating Spanish newspaper articles into English. Can we do an exercise?"

---

**Output:**

## Translation Practice Session

**Language Pair:** Spanish → English
**CEFR Level:** B1 (production) / B2 (source text comprehension)
**Text Type:** Journalistic (newspaper)
**Session Focus:** Accuracy and Fluency (register: formal-neutral, newspaper style)
**Session Length:** 2 exercises

---

### Exercise 1: Journalistic Reporting -- Past Tense Narration

**Source Text (Spanish):**
> El alcalde anunció ayer que el ayuntamiento destinará tres millones de euros a la reforma de los parques municipales. La medida, que fue apoyada por la mayoría del pleno, entrará en vigor a principios del próximo año.

**Vocabulary Support:**
| Source Word/Phrase | Literal Meaning | Recommended Gloss | Note |
|-------------------|----------------|-------------------|------|
| alcalde | mayor (of a city) | mayor | Not "alcoholic" -- common confusion for English speakers |
| ayuntamiento | city hall / municipal government | city council / the city | Either works depending on sentence structure |
| destinará | will allocate/earmark | will allocate | Future tense -- note: Spanish journalism uses simple future where English often uses "is set to" |
| pleno | full council session / plenary | full council | "Plenary" is technically correct but sounds overly formal for most English newspaper contexts |
| entrará en vigor | will enter into force | will take effect | "Enter into force" is correct but slightly legalistic; "take effect" is more natural for general press |

**Structural Note:**
The second sentence uses a Spanish participial phrase "que fue apoyada por la mayoría del pleno" (passive relative clause). English journalism strongly prefers active voice -- you will need to restructure, not just translate word-for-word.

**Challenge to watch for:** Passive-to-active restructuring; choosing natural English journalistic register over hyper-literal translation.

---

**Your Translation:**
_(Write your English translation now before reading the model.)_

---

**Model Translation (English):**
> The mayor announced yesterday that the city will allocate three million euros to renovating municipal parks. The measure, which won majority support on the city council, is set to take effect at the beginning of next year.

**Translation Decision Log:**
1. "destinará" → "will allocate" not "will destine" -- "destine" does not collocate with money in English; "allocate" or "earmark" are the natural journalistic verbs for budget decisions
2. "fue apoyada por la mayoría del pleno" → "won majority support on the city council" -- the passive relative clause was converted to an active construction; English newspaper prose strongly prefers active voice, and this restructuring also removes the slightly awkward "majority of the plenary"
3. "entrará en vigor" → "is set to take effect" -- Spanish journalism uses simple future; English journalism more commonly uses "is set to + infinitive" for announced future events, which signals official announcement rather than mere prediction
4. "a principios del próximo año" → "at the beginning of next year" -- literal translation works here; "early next year" is a slightly more natural alternative in English press but changes the precision slightly

**Alternative Valid Translations:**
- "The city has earmarked three million euros for park renovations" -- tightens the sentence and uses "earmarked," a common English budget verb, but loses the attribution to the mayor
- "is expected to take effect" instead of "is set to take effect" -- slightly softer register, more appropriate if the measure is not fully confirmed; here it is confirmed, so "is set to" is marginally better

**Quality Assessment (Model Translation):**
| Dimension | Score (1--4) | Notes |
|-----------|-------------|-------|
| Accuracy | 4 | All factual content preserved: amount, purpose, approval status, timeline |
| Fluency | 4 | Reads as natural English newspaper prose |
| Register | 4 | Formal-neutral journalistic register maintained throughout |

---

### Exercise 2: Journalistic Reporting -- Quote Integration and Attribution (No Vocabulary Support)

**Source Text (Spanish):**
> "Llevamos años esperando esta inversión", declaró una vecina del barrio de Salamanca. "Los parques están en muy mal estado y los niños no tienen dónde jugar." Las obras comenzarán, según fuentes municipales, en el mes de abril.

**Structural Note:**
Spanish frequently places the verb before the subject in attribution clauses ("declaró una vecina" rather than "a resident said"). English attribution almost always follows subject-verb order. Also note: "fuentes municipales" is a standard journalistic phrase with a standard English equivalent -- avoid a literal translation.

**Challenge to watch for:** Attribution syntax reordering; journalistic conventions for quoting; rendering "fuentes municipales" idiomatically.

---

**Your Translation:**
_(Attempt before reading the model.)_

---

**Model Translation (English):**
> "We have been waiting years for this investment," said a resident of the Salamanca neighborhood. "The parks are in very poor condition and children have nowhere to play." According to municipal sources, construction will begin in April.

**Translation Decision Log:**
1. "Llevamos años esperando" → "We have been waiting years" -- this is the Spanish "llevar + gerund" construction expressing duration up to the present moment; English uses present perfect continuous ("have been waiting") to capture this meaning; "We carry years waiting" is a calque error to avoid
2. "declaró una vecina" → "said a resident" -- "declaró" technically means "declared" but in Spanish journalistic attribution it functions as a neutral verb equivalent to "said"; "declared" in English carries a stronger, more formal connotation and would misrepresent the register of the original
3. "muy mal estado" → "very poor condition" -- "very bad state" is technically correct but "poor condition" is the standard English collocation for describing infrastructure deterioration
4. "fuentes municipales" → "municipal sources" -- this is the standard equivalent; "city hall sources" is an acceptable alternative; "municipal fountain" is a catastrophic false cognate error that appears occasionally

**Alternative Valid Translations:**
- "city sources" instead of "municipal sources" -- slightly more conversational, acceptable in tabloid-register English press
- "The parks are in a terrible state" instead of "very poor condition" -- higher register equivalence if the original speaker was being emphatic; "very bad state" is grammatical but not idiomatic

**Quality Assessment (Model Translation):**
| Dimension | Score (1--4) | Notes |
|-----------|-------------|-------|
| Accuracy | 4 | All content preserved including both quote segments and the attribution |
| Fluency | 4 | Reads as natural English newspaper prose |
| Register | 4 | Formal-neutral journalistic register, appropriate for broadsheet English press |

---

### Error Analysis (Learner Attempt -- Example)

**Learner's Translation (Exercise 1):**
> The mayor announced yesterday that the city hall will destine three million euros to the reform of the municipal parks. The measure, which was supported by the majority of the plenary, will enter in vigor at the beginning of the next year.

**Error Analysis Table:**
| Learner's Phrase | Model Equivalent | Error Type | Root Cause | Impact |
|-----------------|-----------------|------------|------------|--------|
| "will destine three million euros" | "will allocate three million euros" | Vocabulary -- false cognate | "Destinar" looks like "to destine" but the English verb "destine" does not collocate with budget allocation; "allocate" or "earmark" are the correct collocations | High -- sounds unidiomatic to an English reader |
| "the reform of the municipal parks" | "renovating municipal parks" | Register / Fluency | Literal translation of "la reforma de"; English journalistic prose prefers verb forms ("renovating") to noun phrases ("the reform of") in this construction | Medium -- meaning preserved but sounds bureaucratic |
| "the majority of the plenary" | "majority support on the city council" | Register + Restructuring | "Plenary" as a standalone noun is too legalistic for general press; passive clause not restructured to active voice | Medium -- comprehensible but registers as non-native prose |
| "will enter in vigor" | "will take effect" | Vocabulary -- calque | Direct translation of "entrará en vigor" word-for-word; "enter into force" is the legal equivalent but "take effect" is more natural for press contexts; "enter in vigor" is not idiomatic English | High -- not natural English |
| "at the beginning of the next year" | "at the beginning of next year" | Grammar -- article | In English, "next year" is used without a definite article as a temporal expression; "the next year" means "the following year" (a different meaning) | Low -- minor but distinguishable to a native reader |

**Learner Score:**
| Dimension | Score (1--4) | Key Finding |
|-----------|-------------|-------------|
| Accuracy | 3 | All factual content was preserved; no meaning lost |
| Fluency | 2 | Multiple phrases read as non-native due to calques and wrong collocations |
| Register | 2 | Some phrases too bureaucratic or legalistic for newspaper register |

**Primary Skill Gap:** Fluency -- specifically, breaking the habit of word-for-word structural copying (calque) when a natural English equivalent phrase exists

---

### Session Summary

**Exercises completed:** 2
**Consistent strengths:** Factual accuracy is reliable -- all semantic content was correctly transferred in both exercises. The learner has strong comprehension of the source text.
**Consistent errors:** Calque patterns appeared in both exercises ("will enter in vigor," "the reform of the municipal parks," "the majority of the plenary") -- the learner is translating at the phrase level rather than the meaning level.
**Primary pattern identified:** L1 interference via calque -- the learner is applying Spanish syntactic and collocation patterns directly to English output rather than re-encoding the meaning in natural English phrasing. This is extremely common at B1 and is typically resolved by extensive exposure to authentic English newspaper prose alongside translation practice.

---

### Next Steps

1. **Immediate (today):** Take the phrase "entrará en vigor" and write 5 different natural English ways to express "a law or measure takes effect." This isolates the collocation gap and builds lexical flexibility around a single high-frequency journalistic phrase. Repeat this with "destinará fondos" (will allocate/earmark/set aside/channel funds).

2. **Next session (within 3--5 days):** Return to journalistic translation at B1--B2 level, but use a text that includes direct quotes and reported speech. Focus the next session specifically on active voice restructuring -- the most impactful single skill gap identified in today's session. Bring your own attempt before viewing any model.

3. **Medium-term (2--4 weeks):** Read 2--3 paragraphs of English newspaper prose daily from a quality broadsheet source, specifically studying how attribution is handled and how budget and policy announcements are phrased. The goal is to internalize English journalistic collocations so that they become as automatic as the Spanish collocations currently driving calque errors.

---

### Self-Assessment Checklist (Use on any future translation)

- [ ] Have I re-read my translation aloud as if it were originally written in English? Does any phrase sound "foreign"?
- [ ] Have I checked every verb I used -- does it collocate naturally with its object in English, or did I just translate the Spanish verb directly?
- [ ] Have I restructured passive relative clauses into active constructions where English prose expects them?
- [ ] Does the register of my translation match the source -- formal, journalistic, conversational, academic?
- [ ] Have I checked for false cognates in any word that resembles its Spanish equivalent?
- [ ] Does my translation preserve all factual content -- numbers, names, dates, attributed sources?
- [ ] Have I avoided "the" before temporal expressions like "next year," "last week," and "this month"?
